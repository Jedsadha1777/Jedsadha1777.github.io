class TurnPage {

    /* ===== CONSTRUCTOR ===== */

    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id "${canvasId}" not found`);
        }

        this.canvas.style.background = 'transparent';
        this.ctx = this.canvas.getContext('2d');

        // ตรวจจับโหมดจากขนาดหน้าจออัตโนมัติ
        const autoMode = this.detectViewMode();

        // Options
        this.options = {
            pdfUrl: options.pdfUrl || null,
            jsonUrl: options.jsonUrl || null,
            autoLoad: options.autoLoad !== false,
            singlePageMode: options.singlePageMode !== undefined
                ? options.singlePageMode
                : autoMode, // ใช้ autoMode ถ้าไม่ได้กำหนดไว้
            autoDetectMode: options.autoDetectMode !== false, // เปิดใช้งาน auto-detect โดย default
            ...options
        };

        this.singlePageMode = this.options.singlePageMode;
        this.calculateSize();

        // Initialize properties
        this.totalPages = 0;
        this.currentPage = 0;
        this.pages = [];
        this.pageLinks = [];
        this.flipProgress = 0;
        this.isFlipping = false;
        this.flipDirection = 0;
        this.flipTarget = 0;
        this.startWithCover = true;

        this.isZoomed = false;
        this.zoomScale = 2;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastPanX = 0;
        this.lastPanY = 0;

        /* hide - show control */
        this.clickTimeout = null;
        this.clickCount = 0;
        this.controls = document.querySelectorAll('.control');
        /* */

        this.pdfDoc = null;
        this.isLoading = false;
        this.pdfFileName = null;

        this.scrollDragging = false;
        this.scrollThumb = document.getElementById('scrollThumb');
        this.scrollTrack = document.getElementById('scrollTrack');

        this.lastTouchTime = null;
        this.touchTimeout = null;

        this.thumbnailData = null;
        this.lightbox = document.getElementById('lightbox');
        this.thumbnailGrid = document.getElementById('thumbnailGrid');
        this.generatedThumbnails = [];
        this.isGeneratingThumbnails = false;


        this.jsonData = null;
        this.lowResImages = [];
        this.highResImages = [];

        this.updateModeButtons();
        this.setupEvents();
        this.animate();
        this.resizeTimeout = null;

        window.addEventListener('resize', () => {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }

            this.resizeTimeout = setTimeout(() => {

                // กรณีใช้ JSON
                if (this.jsonData && this.jsonData.pageSizes && this.jsonData.pageSizes.length > 0) {
                    const data = this.jsonData;
                    const firstSize = data.pageSizes[0];
                    const aspectRatio = firstSize.width / firstSize.height;

                    const targetHeight = window.innerHeight;
                    const maxWidth = window.innerWidth;

                    let pageHeight = targetHeight;
                    let pageWidth = pageHeight * aspectRatio;

                    const pageCount = this.singlePageMode ? 1 : 2;
                    const totalWidth = pageWidth * pageCount;

                    if (totalWidth > maxWidth) {
                        pageWidth = maxWidth / pageCount;
                        pageHeight = pageWidth / aspectRatio;
                    }

                    for (let i = 0; i < this.totalPages; i++) {
                        const size = data.pageSizes[i] || firstSize;
                        const scale = pageHeight / size.height;

                        this.pageViewports[i] = {
                            width: size.width * scale,
                            height: size.height * scale
                        };
                    }

                    if (data.links) {
                        this.pageLinks = data.links.map((pageLinks, pageIndex) => {
                            const size = data.pageSizes[pageIndex];
                            if (!size) return pageLinks;

                            const viewport = this.pageViewports[pageIndex];
                            if (!viewport) return pageLinks;

                            const scaleX = viewport.width / size.width;
                            const scaleY = viewport.height / size.height;

                            return pageLinks.map(link => {
                                const [x1, y1, x2, y2] = link.transformedRect || [];
                                if (x1 !== undefined) {
                                    return {
                                        ...link,
                                        transformedRect: [
                                            x1 * scaleX,
                                            y1 * scaleY,
                                            x2 * scaleX,
                                            y2 * scaleY,
                                        ],
                                    };
                                }
                                return link;
                            });
                        });
                    }
                }
                // กรณีใช้ PDF 
                else if (this.pdfDoc && this.pageViewports.length > 0) {
                    const firstVp = this.pageViewports[0];
                    if (firstVp) {
                        const aspectRatio = firstVp.width / firstVp.height;

                        const targetHeight = window.innerHeight;
                        const maxWidth = window.innerWidth;

                        let pageHeight = targetHeight;
                        let pageWidth = pageHeight * aspectRatio;

                        const pageCount = this.singlePageMode ? 1 : 2;
                        const totalWidth = pageWidth * pageCount;

                        if (totalWidth > maxWidth) {
                            pageWidth = maxWidth / pageCount;
                            pageHeight = pageWidth / aspectRatio;
                        }

                        const scaleRatio = pageHeight / this.pageHeight;

                        this.pageWidth = pageWidth;
                        this.pageHeight = pageHeight;

                        // อัพเดท viewport 
                        for (let i = 0; i < this.pageViewports.length; i++) {
                            const oldVp = this.pageViewports[i];
                            if (oldVp) {
                                this.pageViewports[i] = {
                                    width: oldVp.width * scaleRatio,
                                    height: oldVp.height * scaleRatio
                                };
                            }
                        }

                        // อัพเดท links 
                        for (let i = 0; i < this.pageLinks.length; i++) {
                            const links = this.pageLinks[i];
                            if (links && links.length > 0) {
                                this.pageLinks[i] = links.map(link => {
                                    if (link.transformedRect) {
                                        const [x1, y1, x2, y2] = link.transformedRect;
                                        return {
                                            ...link,
                                            transformedRect: [
                                                x1 * scaleRatio,
                                                y1 * scaleRatio,
                                                x2 * scaleRatio,
                                                y2 * scaleRatio
                                            ]
                                        };
                                    }
                                    return link;
                                });
                            }
                        }
                    }
                }

                this.calculateSize();

                if (this.options.autoDetectMode) {
                    const newMode = this.detectViewMode();
                    if (newMode !== this.singlePageMode) {
                        this.setMode(newMode);
                        return; // setMode 
                    }
                }

                // load after resize
                if (this.pdfDoc && !this.isLoading) {
                    const initialPages = this.singlePageMode ? 2 : 4;
                    this.loadPageRange(0, Math.min(initialPages - 1, this.totalPages - 1), true, false).then(() => {
                        setTimeout(() => {
                            this.loadHighResForCurrentPage();
                        }, 300);
                    });
                } else if (this.jsonData && this.lowResImages.length > 0 && !this.isLoading) {
                    this.pages = new Array(this.totalPages);
                    const initialPages = this.singlePageMode ? 2 : 4;
                    this.loadPageRangeFromJSON(0, Math.min(initialPages - 1, this.totalPages - 1), false).then(() => {
                        setTimeout(() => {
                            this.loadHighResForCurrentPageFromJSON();
                        }, 300);
                    });
                }
            }, 300);
        });

        // Auto-load if URLs provided
        if (this.options.autoLoad) {
            if (this.options.pdfUrl) {
                this.loadPDFFromUrl(this.options.pdfUrl);
            }
            if (this.options.jsonUrl) {
                this.loadJSONFromUrl(this.options.jsonUrl);
            }
        }
    }

    detectViewMode() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const aspectRatio = width / height;
        // ถ้าอัตราส่วน < 1 (แนวตั้ง) → หน้าเดี่ยว
        // ถ้าอัตราส่วน >= 1 (แนวนอน) → หน้าคู่
        return aspectRatio < 1;
    }

    calculateSize() {
        const targetHeight = window.innerHeight;
        const maxWidth = window.innerWidth;

        // ใช้ aspect ratio เริ่มต้นก่อน (กรณียังไม่มี PDF)
        let aspectRatio = 350 / 460;

        // ถ้ามี PDF ใช้ aspect ratio จากหน้าแรก
        if (this.pageViewports && this.pageViewports[0]) {
            const vp = this.pageViewports[0];
            aspectRatio = vp.width / vp.height;
        }

        this.pageHeight = targetHeight;
        this.pageWidth = this.pageHeight * aspectRatio;

        const pageCount = this.singlePageMode ? 1 : 2;
        const totalWidth = this.pageWidth * pageCount;

        if (totalWidth > maxWidth) {
            this.pageWidth = maxWidth / pageCount;
            this.pageHeight = this.pageWidth / aspectRatio;
        }

        const dpr = window.devicePixelRatio || 1;
        const displayWidth = this.pageWidth * pageCount;
        const displayHeight = this.pageHeight;

        this.canvas.width = displayWidth * dpr;
        this.canvas.height = displayHeight * dpr;
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);

        this.centerX = displayWidth / 2;
        this.centerY = displayHeight / 2;
    }

    setupEvents() {
        document.getElementById('nextBtn').addEventListener('click', () => this.startFlip(1));
        document.getElementById('prevBtn').addEventListener('click', () => this.startFlip(-1));
        document.getElementById('doublePageBtn').addEventListener('click', () => this.setMode(false));
        document.getElementById('singlePageBtn').addEventListener('click', () => this.setMode(true));
        document.getElementById('thumbnailBtn').addEventListener('click', () => this.openLightbox());
        document.getElementById('closeBtn').addEventListener('click', () => this.closeLightbox());

        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.closeLightbox();
            }
        });

        // this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));

        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });

        this.scrollThumb.addEventListener('mousedown', (e) => this.onScrollMouseDown(e));
        this.scrollTrack.addEventListener('mousedown', (e) => this.onScrollTrackClick(e));
        window.addEventListener('mousemove', (e) => this.onScrollMouseMove(e));
        window.addEventListener('mouseup', (e) => this.onScrollMouseUp(e));

        this.scrollThumb.addEventListener('touchstart', (e) => this.onScrollTouchStart(e), { passive: false });
        this.scrollTrack.addEventListener('touchstart', (e) => this.onScrollTrackTouchStart(e), { passive: false });
        window.addEventListener('touchmove', (e) => this.onScrollTouchMove(e), { passive: false });
        window.addEventListener('touchend', (e) => this.onScrollTouchEnd(e));
    }


    /* ===== FILE LOADING ===== */

    async loadPDFFromUrl(url) {
        try {
            this.resetThumbnails();
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();

            const fileName = url.split('/').pop().split('?')[0] || 'document.pdf';

            const file = new File([blob], fileName, { type: 'application/pdf' });
            await this.loadPDF(file);
        } catch (error) {
            console.error('Error loading PDF from URL:', error);
            alert(`ไม่สามารถโหลด PDF จาก ${url}`);
        }
    }

    async loadJSONFromUrl(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            await this.loadJSON(data);
        } catch (error) {
            console.error('Error loading JSON from URL:', error);
        }
    }

    async loadPDF(file) {

        if (this.jsonData && this.jsonData.totalPages) {
            console.log('Using JSON data, skipping PDF load');
            return;
        }

        try {
            this.isLoading = true;
            this.updatePageInfo();
            const arrayBuffer = await file.arrayBuffer();
            this.pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            this.totalPages = this.pdfDoc.numPages;
            this.pdfFileName = file.name;

            const firstPage = await this.pdfDoc.getPage(1);
            const raw = firstPage.getViewport({ scale: 1 });
            const ratio = raw.width / raw.height;
            let pageHeight = window.innerHeight;
            let pageWidth = pageHeight * ratio;
            const maxWidth = window.innerWidth;
            const count = this.singlePageMode ? 1 : 2;
            if (pageWidth * count > maxWidth) {
                pageWidth = maxWidth / count;
                pageHeight = pageWidth / ratio;
            }
            this.pageWidth = pageWidth;
            this.pageHeight = pageHeight;

            this.currentPage = 0;
            this.isZoomed = false;
            this.panX = 0;
            this.panY = 0;
            this.isPanning = false;
            this.isFlipping = false;
            this.flipProgress = 0;
            this.flipDirection = 0;
            this.flipTarget = 0;

            this.pages = new Array(this.totalPages);
            this.pageLinks = new Array(this.totalPages);
            this.pageViewports = new Array(this.totalPages);

            const initialPages = this.singlePageMode ? 2 : 4;
            await this.loadPageRange(0, Math.min(initialPages - 1, this.totalPages - 1), false, false);

            // คำนวณขนาดใหม่หลังจากได้ viewport จาก PDF แล้ว
            this.calculateSize();

            this.isLoading = false;
            this.updatePageInfo();

            if (!this.thumbnailData) {
                this.generateThumbnailsFromPDF();
            }

            setTimeout(() => {
                this.loadHighResForCurrentPage();
            }, 300);

        } catch (error) {
            console.error('Error loading PDF:', error);
            this.totalPages = 0;
            this.pages = [];
            this.isLoading = false;
            this.updatePageInfo();
        }
    }

    async loadJSON(data) {
        this.jsonData = data;


        if (data.thumbnails) {
            this.thumbnailData = {
                title: data.title,
                thumbnails: data.thumbnails
            };
            document.getElementById('thumbnailBtn').disabled = false;
        }

        if (data.low) {
            this.lowResImages = data.low;
        }

        if (data.high) {
            this.highResImages = data.high;
        }

        if (data.totalPages) {
            this.totalPages = data.totalPages;
            this.pages = new Array(this.totalPages);
            this.pageViewports = new Array(this.totalPages);

            if (data.pageSizes && data.pageSizes.length > 0) {
                const firstSize = data.pageSizes[0];
                const aspectRatio = firstSize.width / firstSize.height;

                const targetHeight = window.innerHeight;
                const maxWidth = window.innerWidth;

                let pageHeight = targetHeight;
                let pageWidth = pageHeight * aspectRatio;

                const pageCount = this.singlePageMode ? 1 : 2;
                const totalWidth = pageWidth * pageCount;

                if (totalWidth > maxWidth) {
                    pageWidth = maxWidth / pageCount;
                    pageHeight = pageWidth / aspectRatio;
                }

                for (let i = 0; i < this.totalPages; i++) {
                    const size = data.pageSizes[i] || firstSize;
                    const scale = pageHeight / size.height;

                    this.pageViewports[i] = {
                        width: size.width * scale,
                        height: size.height * scale
                    };
                }
            } else {
                const firstImageUrl = this.lowResImages[0] || this.highResImages[0];
                if (firstImageUrl) {
                    const img = await this.loadImage(firstImageUrl);
                    const aspectRatio = img.width / img.height;
                    for (let i = 0; i < this.totalPages; i++) {
                        this.pageViewports[i] = {
                            width: this.pageWidth,
                            height: this.pageHeight
                        };
                    }
                }
            }

            if (data.links) {
                if (data.pageSizes) {
                    this.pageLinks = data.links.map((pageLinks, pageIndex) => {
                        const size = data.pageSizes[pageIndex];
                        if (!size) return pageLinks;

                        const viewport = this.pageViewports[pageIndex];
                        if (!viewport) return pageLinks;

                        const scaleX = viewport.width / size.width;
                        const scaleY = viewport.height / size.height;

                        return pageLinks.map(link => {
                            const [x1, y1, x2, y2] = link.transformedRect || [];
                            if (x1 !== undefined) {
                                return {
                                    ...link,
                                    transformedRect: [
                                        x1 * scaleX,
                                        y1 * scaleY,
                                        x2 * scaleX,
                                        y2 * scaleY,
                                    ],
                                };
                            }
                            return link;
                        });
                    });
                } else {
                    this.pageLinks = data.links;
                }
            }

            this.calculateSize();
            this.updatePageInfo();

            const initialPages = this.singlePageMode ? 2 : 4;
            await this.loadPageRangeFromJSON(0, Math.min(initialPages - 1, this.totalPages - 1), false);

            setTimeout(() => {
                this.loadHighResForCurrentPageFromJSON();
            }, 300);
        }
    }

    // Helper function 
    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load: ${url}`));
            img.src = url;
        });
    }

    /* ===== PAGE LOADING (PDF) ===== */

    async loadPageRange(startIdx, endIdx, forceReload = false, highRes = false) {

        // ถ้ามี images ใน JSON ให้ไม่ต้องทำอะไร
        if (this.jsonData && this.lowResImages.length > 0) {
            return;
        }

        const dpr = window.devicePixelRatio || 1;

        endIdx = Math.min(endIdx, this.totalPages - 1);


        for (let i = startIdx; i <= endIdx; i++) {
            if (!forceReload && this.pages[i] !== undefined && !highRes) continue;

            const page = await this.pdfDoc.getPage(i + 1);
            const rawViewport = page.getViewport({ scale: 1 });

            const baseScale = Math.max(
                this.pageWidth / rawViewport.width,
                this.pageHeight / rawViewport.height
            );

            const layoutViewport = page.getViewport({ scale: baseScale });

            // เก็บ viewport สำหรับใช้คำนวณ aspect ratio
            if (!this.pageViewports[i]) {
                this.pageViewports[i] = {
                    width: layoutViewport.width,
                    height: layoutViewport.height
                };
            }

            let renderScale;
            if (highRes) {
                renderScale = baseScale * dpr;
            } else {
                renderScale = baseScale * (dpr * 0.2);
            }

            const renderViewport = page.getViewport({ scale: renderScale });

            const canvas = document.createElement('canvas');
            canvas.width = renderViewport.width;
            canvas.height = renderViewport.height;
            const context = canvas.getContext('2d');

            await page.render({
                canvasContext: context,
                viewport: renderViewport
            }).promise;

            this.pages[i] = canvas;

            // อัพเดท viewport
            this.pageViewports[i] = {
                width: layoutViewport.width,
                height: layoutViewport.height
            };

            if (!this.pageLinks[i]) {
                const annotations = await page.getAnnotations();
                const transform = layoutViewport.transform;

                const applyTransform = (x, y, m) => [
                    m[0] * x + m[2] * y + m[4],
                    m[1] * x + m[3] * y + m[5]
                ];

                const links = annotations
                    .filter(ann => ann.subtype === 'Link')
                    .map(ann => {
                        const [x1, y1, x2, y2] = ann.rect;
                        const [tx1, ty1] = applyTransform(x1, y1, transform);
                        const [tx2, ty2] = applyTransform(x2, y2, transform);

                        let linkData = {
                            transformedRect: [
                                Math.min(tx1, tx2),
                                Math.min(ty1, ty2),
                                Math.max(tx1, tx2),
                                Math.max(ty1, ty2)
                            ]
                        };

                        if (ann.url) linkData.url = ann.url;
                        else if (ann.dest) linkData.dest = ann.dest;

                        return linkData;
                    });

                this.pageLinks[i] = links;
            }
        }

        // ไม่โหลด high-res ที่นี่ - ให้ตัวอื่นเรียก
    }

    async loadPagesFromPDF() {
        await this.loadPageRange(0, this.totalPages - 1);
    }

    loadHighResForCurrentPage() {
        if (!this.pdfDoc || this.isLoading) return;

        const currentPages = this.singlePageMode
            ? [this.currentPage]
            : [this.currentPage, this.currentPage + 1].filter(p => p < this.totalPages);

        // โหลด high-res เฉพาะหน้าที่แสดงอยู่
        for (const pageIdx of currentPages) {
            this.loadPageRange(pageIdx, pageIdx, true, true);
        }
    }

    /* ===== PAGE LOADING (JSON) ===== */

    async loadPageRangeFromJSON(startIdx, endIdx, highRes = false) {
        endIdx = Math.min(endIdx, this.totalPages - 1);

        const imageUrls = highRes ? this.highResImages : this.lowResImages;

        if (!imageUrls || imageUrls.length === 0) {
            return;
        }

        for (let i = startIdx; i <= endIdx; i++) {
            if (i >= imageUrls.length) continue;

            if (this.pages[i] && !highRes) continue;

            const imageUrl = imageUrls[i];
            if (!imageUrl) continue;

            try {
                const img = await this.loadImage(imageUrl);

                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                canvas.pageIndex = i;
                this.pages[i] = canvas;


                // คำนวณ viewport และ links เฉพาะตอนโหลด high-res เท่านั้น
                if (highRes && this.jsonData && this.jsonData.pageSizes) {
                    const size = this.jsonData.pageSizes[i];
                    if (size) {
                        const targetHeight = window.innerHeight;
                        const maxWidth = window.innerWidth;
                        const aspectRatio = size.width / size.height;

                        let pageHeight = targetHeight;
                        let pageWidth = pageHeight * aspectRatio;

                        const pageCount = this.singlePageMode ? 1 : 2;
                        const totalWidth = pageWidth * pageCount;

                        if (totalWidth > maxWidth) {
                            pageWidth = maxWidth / pageCount;
                            pageHeight = pageWidth / aspectRatio;
                        }

                        const scale = pageHeight / size.height;

                        this.pageViewports[i] = {
                            width: size.width * scale,
                            height: size.height * scale
                        };

                        // คำนวณ links สำหรับหน้านี้ (หลังโหลด high-res แล้ว)
                        if (this.rawLinks && this.rawLinks[i]) {
                            const viewport = this.pageViewports[i];
                            const scaleX = viewport.width / size.width;
                            const scaleY = viewport.height / size.height;

                            this.pageLinks[i] = this.rawLinks[i].map(link => {
                                const [x1, y1, x2, y2] = link.transformedRect || [];
                                if (x1 !== undefined) {
                                    return {
                                        ...link,
                                        transformedRect: [
                                            x1 * scaleX,
                                            y1 * scaleY,
                                            x2 * scaleX,
                                            y2 * scaleY,
                                        ],
                                    };
                                }
                                return link;
                            });
                        }
                    }
                }

            } catch (error) {
                console.error(`Error loading image for page ${i + 1}:`, error);
            }
        }
    }

    //  high-res from JSON
    loadHighResForCurrentPageFromJSON() {
        if (!this.highResImages || this.highResImages.length === 0) return;

        const currentPages = this.singlePageMode
            ? [this.currentPage]
            : [this.currentPage, this.currentPage + 1].filter(p => p < this.totalPages);

        for (const pageIdx of currentPages) {
            if (pageIdx < this.highResImages.length) {
                this.loadPageRangeFromJSON(pageIdx, pageIdx, true);
            }
        }
    }

    /* ===== THUMBNAIL MANAGEMENT ===== */

    async loadThumbnailJSON(file) {
        try {
            const text = await file.text();
            this.thumbnailData = JSON.parse(text);
            document.getElementById('thumbnailBtn').disabled = false;
            console.log('Thumbnail data loaded:', this.thumbnailData);
        } catch (error) {
            console.error('Error loading thumbnail JSON:', error);
            alert('ไม่สามารถโหลดไฟล์ JSON ได้');
        }
    }

    async generateThumbnailsFromPDF() {
        if (!this.pdfDoc || this.isGeneratingThumbnails) return;

        this.isGeneratingThumbnails = true; //  flag
        console.log('Generating thumbnails from PDF...');
        this.generatedThumbnails = [];

        for (let i = 0; i < this.totalPages; i++) {
            this.generatedThumbnails.push(null);
        }

        // thumbnails batch 
        const batchSize = 5;
        const totalBatches = Math.ceil(this.totalPages / batchSize);

        for (let batch = 0; batch < totalBatches; batch++) {
            const startPage = batch * batchSize;
            const endPage = Math.min((batch + 1) * batchSize, this.totalPages);

            const promises = [];
            for (let i = startPage; i < endPage; i++) {
                promises.push(this.generateSingleThumbnail(i).then(dataUrl => {
                    this.generatedThumbnails[i] = dataUrl;
                    this.updateThumbnailImage(i, dataUrl);
                    return dataUrl;
                }));
            }

            await Promise.all(promises);
        }

        document.getElementById('thumbnailBtn').disabled = false;
        this.isGeneratingThumbnails = false; // ปิด flag
        console.log('Thumbnails generated:', this.generatedThumbnails.filter(t => t !== null).length);
    }

    async generateSingleThumbnail(pageIndex) {
        try {
            const page = await this.pdfDoc.getPage(pageIndex + 1);
            const viewport = page.getViewport({ scale: 0.2 }); // 

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            // data to URL
            return canvas.toDataURL('image/jpeg', 0.8);
        } catch (error) {
            console.error(`Error generating thumbnail for page ${pageIndex + 1}:`, error);
            return null;
        }
    }

    updateThumbnailImage(index, dataUrl) {
        if (!this.lightbox.classList.contains('show')) return;

        const thumbnailItem = this.thumbnailGrid.children[index];
        if (!thumbnailItem || !dataUrl) return;

        const img = thumbnailItem.querySelector('img');
        if (!img) {
            const newImg = new Image();
            newImg.onload = () => {
                const loadingDiv = thumbnailItem.querySelector('.thumbnail-loading');
                if (loadingDiv) loadingDiv.remove();
                thumbnailItem.appendChild(newImg);
            };
            newImg.src = dataUrl;
        } else {
            img.src = dataUrl;
        }
    }

    openLightbox() {
        const thumbnails = this.thumbnailData?.thumbnails || this.generatedThumbnails;

        let title = 'Page Thumbnails';
        if (this.thumbnailData?.title) {
            title = this.thumbnailData.title;
        } else if (this.pdfFileName) {
            title = this.pdfFileName;
        }


        if ((!thumbnails || thumbnails.length === 0) && !this.isGeneratingThumbnails) {
            if (this.pdfDoc) {
                this.generateThumbnailsFromPDF();
            } else {
                alert('กรุณาโหลด PDF ก่อน');
                return;
            }
        }

        this.lightbox.classList.add('show');
        document.getElementById('lightboxTitle').textContent = title;
        this.thumbnailGrid.innerHTML = '';

        const totalItems = thumbnails?.length || this.totalPages;

        for (let index = 0; index < totalItems; index++) {
            const item = document.createElement('div');
            item.className = 'thumbnail-item';

            const thumbData = thumbnails?.[index];

            if (thumbData) {
                const img = new Image();
                img.onload = () => {
                    item.appendChild(img);
                };
                img.onerror = () => {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'thumbnail-loading';
                    errorDiv.textContent = '❌';
                    errorDiv.style.background = '#555';
                    item.appendChild(errorDiv);
                };
                img.src = thumbData;
            } else {
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'thumbnail-loading';
                loadingDiv.textContent = `${index + 1}`;
                item.appendChild(loadingDiv);
            }

            const label = document.createElement('div');
            label.className = 'thumbnail-label';
            label.textContent = `${index + 1}`;
            item.appendChild(label);

            item.addEventListener('click', () => {
                this.goToPage(index);
                this.closeLightbox();
            });

            this.thumbnailGrid.appendChild(item);
        }

        if (this.isGeneratingThumbnails && !this.thumbnailData) {
            console.log('Thumbnails are being generated in background...');
        }
    }

    closeLightbox() {
        this.lightbox.classList.remove('show');
    }

    resetThumbnails() {
        this.thumbnailData = null;
        this.generatedThumbnails = [];
    }

    /* ===== NAVIGATION AND PAGE CONTROL ===== */

    async goToPage(pageIndex) {
        // Reset zoom เมื่อเปลี่ยนหน้า
        if (this.isZoomed) {
            this.resetZoomState();
        }

        if (pageIndex < 0 || pageIndex >= this.totalPages) return;

        if (this.singlePageMode) {
            this.currentPage = pageIndex;
        } else {
            if (pageIndex === 0) {
                this.currentPage = 0;
            } else {
                this.currentPage = pageIndex % 2 === 0 ? pageIndex - 1 : pageIndex;
            }
        }

        const pagesToLoad = this.singlePageMode ? 3 : 6;
        const loadStart = this.currentPage;
        const loadEnd = Math.min(this.currentPage + pagesToLoad - 1, this.totalPages - 1);

        const requiredPages = this.singlePageMode
            ? [this.currentPage]
            : [this.currentPage, this.currentPage + 1].filter(p => p < this.totalPages);

        const allLoaded = requiredPages.every(p => this.pages[p] !== undefined);

        if (!allLoaded) {
            if (this.jsonData && this.lowResImages.length > 0) {
                await this.loadPageRangeFromJSON(
                    this.currentPage,
                    this.currentPage + (this.singlePageMode ? 0 : 1),
                    false
                );
            } else {
                await this.loadPageRange(
                    this.currentPage,
                    this.currentPage + (this.singlePageMode ? 0 : 1),
                    false,
                    false
                );
            }
        }

        if (this.jsonData && this.lowResImages.length > 0) {
            this.loadPageRangeFromJSON(loadStart, loadEnd, false);
        } else {
            this.loadPageRange(loadStart, loadEnd, false, false);
        }

        this.loadPageRange(loadStart, loadEnd, false, false);
        this.updatePageInfo();
        this.cleanupUnusedPages();

        setTimeout(() => {
            if (this.jsonData && this.highResImages.length > 0) {
                this.loadHighResForCurrentPageFromJSON();
            } else {
                this.loadHighResForCurrentPage();
            }
        }, 500);
    }

    async startFlip(dir) {
        // Reset zoom เมื่อพลิกหน้า
        if (this.isZoomed) {
            this.resetZoomState();
        }

        if (this.isFlipping || this.totalPages === 0 || this.isLoading) return;

        const step = this.singlePageMode ? 1 : 2;
        let target = this.currentPage + dir * step;

        if (!this.singlePageMode) {
            if (this.currentPage === 0 && dir > 0) {
                target = 1;
            } else if (target === -1 || target === -2) {
                target = 0;
            }
        }

        if (target < 0) return;

        if (this.singlePageMode) {
            if (target >= this.totalPages) return;
        } else {
            if (target >= this.totalPages) return;
        }

        const pagesToLoad = this.singlePageMode ? 3 : 6;
        const loadStart = target;
        const loadEnd = Math.min(target + pagesToLoad - 1, this.totalPages - 1);

        if (this.jsonData && this.lowResImages.length > 0) {
            this.loadPageRangeFromJSON(loadStart, loadEnd, false);
        } else {
            this.loadPageRange(loadStart, loadEnd, false, false);
        }

        const requiredPages = this.singlePageMode
            ? [target]
            : [target, target + 1].filter(p => p < this.totalPages);

        const allLoaded = requiredPages.every(p => this.pages[p] !== undefined);

        if (!allLoaded) {
            if (this.jsonData && this.lowResImages.length > 0) {
                await this.loadPageRangeFromJSON(
                    target,
                    target + (this.singlePageMode ? 0 : 1),
                    false
                );
            } else {
                await this.loadPageRange(
                    target,
                    target + (this.singlePageMode ? 0 : 1),
                    false,
                    false
                );
            }
        }

        this.isFlipping = true;
        this.flipDirection = dir;
        this.flipProgress = 0;
        this.flipTarget = target;
    }

    async setMode(singlePage) {
        if (this.isZoomed) {
            this.resetZoomState();
        }

        this.singlePageMode = singlePage;

        if (!singlePage && this.currentPage > 0 && this.currentPage % 2 !== 0) {
            this.currentPage = Math.max(0, this.currentPage - 1);
        }

        document.getElementById('doublePageBtn').classList.toggle('active', !singlePage);
        document.getElementById('singlePageBtn').classList.toggle('active', singlePage);

        if (this.jsonData && this.jsonData.pageSizes && this.jsonData.pageSizes.length > 0) {
            const data = this.jsonData;
            const firstSize = data.pageSizes[0];
            const aspectRatio = firstSize.width / firstSize.height;

            const targetHeight = window.innerHeight;
            const maxWidth = window.innerWidth;

            let pageHeight = targetHeight;
            let pageWidth = pageHeight * aspectRatio;

            const pageCount = this.singlePageMode ? 1 : 2;
            const totalWidth = pageWidth * pageCount;

            if (totalWidth > maxWidth) {
                pageWidth = maxWidth / pageCount;
                pageHeight = pageWidth / aspectRatio;
            }

            for (let i = 0; i < this.totalPages; i++) {
                const size = data.pageSizes[i] || firstSize;
                const scale = pageHeight / size.height;

                this.pageViewports[i] = {
                    width: size.width * scale,
                    height: size.height * scale
                };
            }

            if (data.links) {
                this.pageLinks = data.links.map((pageLinks, pageIndex) => {
                    const size = data.pageSizes[pageIndex];
                    if (!size) return pageLinks;

                    const viewport = this.pageViewports[pageIndex];
                    if (!viewport) return pageLinks;

                    const scaleX = viewport.width / size.width;
                    const scaleY = viewport.height / size.height;

                    return pageLinks.map(link => {
                        const [x1, y1, x2, y2] = link.transformedRect || [];
                        if (x1 !== undefined) {
                            return {
                                ...link,
                                transformedRect: [
                                    x1 * scaleX,
                                    y1 * scaleY,
                                    x2 * scaleX,
                                    y2 * scaleY,
                                ],
                            };
                        }
                        return link;
                    });
                });
            }
        }

        this.calculateSize();

        if (this.pdfDoc) {
            this.isLoading = true;
            this.updatePageInfo();

            this.pages = new Array(this.totalPages);
            this.pageLinks = new Array(this.totalPages);
            this.pageViewports = new Array(this.totalPages);

            const bufferPages = 3;
            const requiredPages = this.singlePageMode
                ? [this.currentPage]
                : [this.currentPage, this.currentPage + 1].filter(p => p < this.totalPages);

            const loadEnd = Math.min(
                this.currentPage + bufferPages,
                this.totalPages - 1
            );

            for (const pageIdx of requiredPages) {
                await this.loadPageRange(pageIdx, pageIdx, false, false);
            }

            if (loadEnd > this.currentPage + (this.singlePageMode ? 0 : 1)) {
                this.loadPageRange(
                    this.currentPage + (this.singlePageMode ? 1 : 2),
                    loadEnd,
                    false,
                    false
                );
            }

            this.isLoading = false;

            setTimeout(() => {
                if (this.jsonData) {
                    this.loadHighResForCurrentPageFromJSON();
                } else {
                    this.loadHighResForCurrentPage();
                }

            }, 300);
        }

        this.updatePageInfo();
    }

    updateModeButtons() {
        const doubleBtn = document.getElementById('doublePageBtn');
        const singleBtn = document.getElementById('singlePageBtn');

        if (doubleBtn && singleBtn) {
            doubleBtn.classList.toggle('active', !this.singlePageMode);
            singleBtn.classList.toggle('active', this.singlePageMode);
        }
    }

    updatePageInfo() {
        const info = document.getElementById('pageInfo');

        if (this.isLoading) {
            info.textContent = 'กำลังโหลด...';
            document.getElementById('prevBtn').disabled = true;
            document.getElementById('nextBtn').disabled = true;
            this.scrollThumb.style.opacity = '0.5';
            return;
        }

        this.scrollThumb.style.opacity = '1';

        if (this.totalPages === 0) {
            info.textContent = ''; //ไม่มีข้อมูลไม่ต้องแสดงหน้า
        } else if (this.singlePageMode) {
            info.textContent = ` ${this.currentPage + 1} / ${this.totalPages}`;
        } else {
            // โหมดหน้าคู่
            if (this.currentPage === 0) {
                // แสดง cover page
                info.textContent = ` 1 / ${this.totalPages}`;
            } else {
                const rightPage = this.currentPage + 1;
                if (rightPage < this.totalPages) {
                    info.textContent = ` ${this.currentPage + 1}-${rightPage + 1} / ${this.totalPages}`;
                } else {
                    info.textContent = ` ${this.currentPage + 1} / ${this.totalPages}`;
                }
            }
        }

        document.getElementById('prevBtn').disabled = this.currentPage === 0 || this.isFlipping;

        if (this.singlePageMode) {
            document.getElementById('nextBtn').disabled = this.currentPage >= this.totalPages - 1 || this.isFlipping;
        } else {
            document.getElementById('nextBtn').disabled = this.currentPage >= this.totalPages - 1 || this.isFlipping;
        }

        this.updateScrollBar();
    }

    cleanupUnusedPages() {
        if (!this.pdfDoc || this.totalPages === 0) return;

        const keepRange = this.singlePageMode ? 4 : 6; // เก็บไว้กี่หน้า
        const currentPages = new Set();

        // เก็บหน้าปัจจุบัน + buffer
        const start = Math.max(0, this.currentPage - 2);
        const end = Math.min(this.totalPages - 1, this.currentPage + keepRange);

        for (let i = start; i <= end; i++) {
            currentPages.add(i);
        }

        // ลบหน้าที่ไม่อยู่ใน range
        for (let i = 0; i < this.totalPages; i++) {
            if (!currentPages.has(i) && this.pages[i] !== undefined) {
                // ลบ canvas ออกจาก memory
                this.pages[i] = undefined;
            }
        }
    }

    /* ===== SCROLL BAR ===== */

    updateScrollBar() {
        if (this.totalPages === 0) {
            this.scrollThumb.style.left = '0px';
            return;
        }

        // ใช้ขนาดจริงของ track ณ เวลานั้น
        const trackWidth = this.scrollTrack.offsetWidth;
        const thumbWidth = this.scrollThumb.offsetWidth; // ใช้ขนาดคงที่จาก CSS (30px)
        let progress;

        if (this.singlePageMode) {
            const maxPage = this.totalPages - 1;
            progress = maxPage > 0 ? this.currentPage / maxPage : 0;
        } else {
            // หน้าคู่ คำนวณ progress จากจำนวน spread
            const spreads = Math.ceil((this.totalPages - 1) / 2) + 1; // +1 สำหรับ cover
            const currentSpread = this.currentPage === 0 ? 0 : Math.ceil((this.currentPage + 1) / 2);
            progress = spreads > 1 ? currentSpread / (spreads - 1) : 0;
        }

        // คำนวณตำแหน่งโดยใช้ trackWidth ที่อัพเดทแล้ว
        const maxLeft = Math.max(0, trackWidth - thumbWidth);
        const thumbLeft = progress * maxLeft;

        this.scrollThumb.style.left = `${thumbLeft}px`;
    }

    updateScrollPosition(progress) {
        if (this.totalPages === 0) return;

        const step = this.singlePageMode ? 1 : 2;
        let maxPage, targetPage;

        if (this.singlePageMode) {
            maxPage = this.totalPages - 1;
            targetPage = Math.round(progress * maxPage);
        } else {
            // โหมดหน้าคู่: 0 (cover), 1, 3, 5, 7, ...
            const spreads = Math.ceil((this.totalPages - 1) / 2);
            const targetSpread = Math.round(progress * spreads);
            targetPage = targetSpread === 0 ? 0 : (targetSpread * 2 - 1);
        }

        targetPage = Math.max(0, Math.min(this.totalPages - 1, targetPage));



        const trackWidth = this.scrollTrack.offsetWidth;
        const thumbWidth = this.scrollThumb.offsetWidth;
        const thumbLeft = progress * (trackWidth - thumbWidth);


        if (targetPage !== this.currentPage) {
            this.goToPage(targetPage);
        }
    }

    onScrollMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();
        this.scrollDragging = true;
        this.scrollStartX = e.clientX;
        this.scrollStartLeft = this.scrollThumb.offsetLeft;

    }

    onScrollMouseMove(e) {
        if (!this.scrollDragging) return;
        e.preventDefault();

        const trackWidth = this.scrollTrack.offsetWidth;
        const thumbWidth = this.scrollThumb.offsetWidth;
        const maxLeft = trackWidth - thumbWidth;

        const dx = e.clientX - this.scrollStartX;
        let newLeft = this.scrollStartLeft + dx;
        newLeft = Math.max(0, Math.min(maxLeft, newLeft));

        const progress = maxLeft > 0 ? newLeft / maxLeft : 0;
        this.updateScrollPosition(progress);
    }

    onScrollMouseUp(e) {
        if (this.scrollDragging) {
            this.scrollDragging = false;

        }
    }

    onScrollTrackClick(e) {
        if (e.target === this.scrollThumb) return;

        const rect = this.scrollTrack.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const trackWidth = this.scrollTrack.offsetWidth;
        const thumbWidth = this.scrollThumb.offsetWidth;

        const progress = (clickX - thumbWidth / 2) / (trackWidth - thumbWidth);
        const clampedProgress = Math.max(0, Math.min(1, progress));

        this.updateScrollPosition(clampedProgress);
    }

    onScrollTouchStart(e) {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.touches[0];
        this.scrollDragging = true;
        this.scrollStartX = touch.clientX;
        this.scrollStartLeft = this.scrollThumb.offsetLeft;
    }

    onScrollTouchMove(e) {
        if (!this.scrollDragging) return;
        e.preventDefault();

        const touch = e.touches[0];
        const trackWidth = this.scrollTrack.offsetWidth;
        const thumbWidth = this.scrollThumb.offsetWidth;
        const maxLeft = trackWidth - thumbWidth;

        const dx = touch.clientX - this.scrollStartX;
        let newLeft = this.scrollStartLeft + dx;
        newLeft = Math.max(0, Math.min(maxLeft, newLeft));

        const progress = maxLeft > 0 ? newLeft / maxLeft : 0;
        this.updateScrollPosition(progress);
    }

    onScrollTouchEnd(e) {
        if (this.scrollDragging) {
            this.scrollDragging = false;

        }
    }

    onScrollTrackTouchStart(e) {
        if (e.target === this.scrollThumb) {
            this.onScrollTouchStart(e);
            return;
        }

        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.scrollTrack.getBoundingClientRect();
        const clickX = touch.clientX - rect.left;
        const trackWidth = this.scrollTrack.offsetWidth;
        const thumbWidth = this.scrollThumb.offsetWidth;

        const progress = (clickX - thumbWidth / 2) / (trackWidth - thumbWidth);
        const clampedProgress = Math.max(0, Math.min(1, progress));

        this.updateScrollPosition(clampedProgress);
    }

    onMouseDown(e) {
        this.mouseDownX = e.clientX;
        this.mouseDownY = e.clientY;
        this.mouseDownTime = Date.now();

        if (this.isZoomed) {
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        if (this.isFlipping) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;

        if (x > this.centerX && this.currentPage < this.totalPages - 2) {
            this.dragging = true;
            this.dragSide = 'R';
            this.dragStartX = x;
            this.flipProgress = 0;
        } else if (x < this.centerX && this.currentPage > 0) {
            this.dragging = true;
            this.dragSide = 'L';
            this.dragStartX = x;
            this.flipProgress = 0;
        }
    }

    onMouseMove(e) {
        if (this.isPanning && this.isZoomed) {
            const dx = e.clientX - this.lastPanX;
            const dy = e.clientY - this.lastPanY;

            this.panX += dx;
            this.panY += dy;

            // ขนาด content ต้นฉบับ
            const contentWidth = this.singlePageMode
                ? this.originalPageWidth
                : (this.originalPageWidth * 2);
            const contentHeight = this.originalPageHeight;

            // ขนาดหลังซูม
            const zoomedContentWidth = contentWidth * this.zoomScale;
            const zoomedContentHeight = contentHeight * this.zoomScale;

            // ขนาดพื้นที่แสดงผล (เต็มจอ)
            const displayWidth = window.innerWidth;
            const displayHeight = window.innerHeight;

            // คำนวณขอบเขตการ pan
            const maxPanX = Math.max(0, (zoomedContentWidth - displayWidth) / 2);
            const maxPanY = Math.max(0, (zoomedContentHeight - displayHeight) / 2);

            // จำกัดการ pan ไม่ให้เกินขอบ content
            this.panX = Math.max(-maxPanX, Math.min(maxPanX, this.panX));
            this.panY = Math.max(-maxPanY, Math.min(maxPanY, this.panY));

            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            return;
        }

        if (!this.dragging || this.isFlipping || this.isZoomed) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const dragDistance = x - this.dragStartX;
        const maxDrag = this.pageWidth;
        let t = Math.min(Math.abs(dragDistance) / maxDrag, 1);
        this.flipDirection = this.dragSide === 'R' ? 1 : -1;
        this.flipProgress = t;
    }

    onMouseUp(e) {
        const wasPanning = this.isPanning;

        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = this.isZoomed ? 'grab' : 'pointer';
        }

        const clickDuration = Date.now() - this.mouseDownTime;
        const moveDistance = Math.sqrt(
            Math.pow(e.clientX - this.mouseDownX, 2) +
            Math.pow(e.clientY - this.mouseDownY, 2)
        );

        if (wasPanning && moveDistance > 5) {
            return;
        }

        // ตรวจสอบว่าเป็น click (ไม่ใช่ drag)
        if (clickDuration < 300 && moveDistance < 10 && !this.isFlipping) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // เช็ค link
            const clickedLink = this.getLinkAtPosition(x, y);
            if (clickedLink) {
                this.handleLinkClick(clickedLink);
                this.dragging = false;
                return;
            }

            // คำนวณตำแหน่งจุดกลาง
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const distanceFromCenter = Math.sqrt(
                Math.pow(x - centerX, 2) +
                Math.pow(y - centerY, 2)
            );
            const centerZone = Math.min(rect.width, rect.height) * 0.3;

            // จัดการ click
            this.clickCount++;

            if (this.clickCount === 1) {
                this.clickTimeout = setTimeout(() => {
                    // single click
                    // เฉพาะตรงกลางถึงจะ toggle controls
                    if (distanceFromCenter <= centerZone && !this.isZoomed) {
                        this.toggleControls();
                    }
                    this.clickCount = 0;
                }, 300);
            } else if (this.clickCount === 2) {
                // double click - zoom ทำงานทั้งหน้าจอ (ไม่เช็ค centerZone)
                clearTimeout(this.clickTimeout);
                this.clickCount = 0;
                this.handleZoom(e, x, y);
            }

            this.dragging = false;
            return;
        }

        // จัดการ drag
        if (this.dragging) {
            if (this.flipProgress > 0.3) {
                this.startFlip(this.flipDirection);
            } else {
                this.flipProgress = 0;
                this.flipDirection = 0;
            }
            this.dragging = false;
        }
    }

    onDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isZoomed) {
            // Zoom out 
            this.isZoomed = false;
            this.panX = 0;
            this.panY = 0;

            this.calculateSize();
            this.canvas.style.cursor = 'pointer';
        } else {
            // Zoom in 
            this.isZoomed = true;

            // เก็บขนาดต้นฉบับก่อนซูม
            this.originalPageWidth = this.pageWidth;
            this.originalPageHeight = this.pageHeight;
            this.originalCenterX = this.centerX;
            this.originalCenterY = this.centerY;

            // ขยาย canvas เต็มจอ
            const dpr = window.devicePixelRatio || 1;
            const fullWidth = window.innerWidth;
            const fullHeight = window.innerHeight;

            this.canvas.width = fullWidth * dpr;
            this.canvas.height = fullHeight * dpr;
            this.canvas.style.width = fullWidth + 'px';
            this.canvas.style.height = fullHeight + 'px';

            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.scale(dpr, dpr);

            // อัพเดท center point ใหม่สำหรับ canvas ที่เต็มจอ
            this.zoomedCenterX = fullWidth / 2;
            this.zoomedCenterY = fullHeight / 2;

            // คำนวณตำแหน่งที่คลิกเทียบกับ content ต้นฉบับ
            const contentWidth = this.singlePageMode ? this.originalPageWidth : (this.originalPageWidth * 2);
            const clickOffsetX = (x - this.originalCenterX) / contentWidth;
            const clickOffsetY = (y - this.originalCenterY) / this.originalPageHeight;

            // Pan ไปยังจุดที่คลิก
            this.panX = -clickOffsetX * contentWidth * (this.zoomScale - 1);
            this.panY = -clickOffsetY * this.originalPageHeight * (this.zoomScale - 1);

            this.canvas.style.cursor = 'grab';
        }
    }

    /* ===== TOUCH EVENTS ===== */

    onTouchStart(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartTime = Date.now();
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    onTouchMove(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            const touch = e.touches[0];
            this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    onTouchEnd(e) {
        const touchDuration = Date.now() - this.touchStartTime;
        const touch = e.changedTouches[0];
        const moveDistance = Math.sqrt(
            Math.pow(touch.clientX - this.touchStartX, 2) +
            Math.pow(touch.clientY - this.touchStartY, 2)
        );

        if (touchDuration < 300 && moveDistance < 10 && !this.isFlipping) {
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            const clickedLink = this.getLinkAtPosition(x, y);
            if (clickedLink) {
                this.handleLinkClick(clickedLink);
                this.dragging = false;
                return;
            }

            // คำนวณตำแหน่งจุดกลาง
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const distanceFromCenter = Math.sqrt(
                Math.pow(x - centerX, 2) +
                Math.pow(y - centerY, 2)
            );
            const centerZone = Math.min(rect.width, rect.height) * 0.3;

            // จัดการ double tap
            const now = Date.now();
            if (this.lastTouchTime && now - this.lastTouchTime < 300) {
                // Double tap - zoom (ทำงานทั้งหน้าจอ)
                clearTimeout(this.touchTimeout);
                this.lastTouchTime = null;
                this.handleZoom(e, x, y);
            } else {
                // Single tap - toggle controls เฉพาะตรงกลาง
                this.lastTouchTime = now;
                this.touchTimeout = setTimeout(() => {
                    // เช็คว่าแตะตรงกลางและไม่ได้ zoom อยู่
                    if (distanceFromCenter <= centerZone && !this.isZoomed) {
                        this.toggleControls();
                    }
                    this.lastTouchTime = null;
                }, 300);
            }
            this.dragging = false;
            return;
        }

        // จัดการ drag
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = this.isZoomed ? 'grab' : 'pointer';
            return;
        }

        if (this.dragging) {
            if (this.flipProgress > 0.3) {
                this.startFlip(this.flipDirection);
            } else {
                this.flipProgress = 0;
                this.flipDirection = 0;
            }
            this.dragging = false;
        }
    }

    /* ===== ZOOM AND PAN ===== */

    handleZoom(e, x, y) {
        if (this.isZoomed) {
            // Zoom out
            this.isZoomed = false;
            this.panX = 0;
            this.panY = 0;
            this.calculateSize();
            this.canvas.style.cursor = 'pointer';
        } else {
            // Zoom in
            this.isZoomed = true;
            this.originalPageWidth = this.pageWidth;
            this.originalPageHeight = this.pageHeight;
            this.originalCenterX = this.centerX;
            this.originalCenterY = this.centerY;

            const dpr = window.devicePixelRatio || 1;
            const fullWidth = window.innerWidth;
            const fullHeight = window.innerHeight;

            this.canvas.width = fullWidth * dpr;
            this.canvas.height = fullHeight * dpr;
            this.canvas.style.width = fullWidth + 'px';
            this.canvas.style.height = fullHeight + 'px';

            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.scale(dpr, dpr);

            this.zoomedCenterX = fullWidth / 2;
            this.zoomedCenterY = fullHeight / 2;

            const contentWidth = this.singlePageMode ? this.originalPageWidth : (this.originalPageWidth * 2);
            const clickOffsetX = (x - this.originalCenterX) / contentWidth;
            const clickOffsetY = (y - this.originalCenterY) / this.originalPageHeight;

            this.panX = -clickOffsetX * contentWidth * (this.zoomScale - 1);
            this.panY = -clickOffsetY * this.originalPageHeight * (this.zoomScale - 1);

            this.canvas.style.cursor = 'grab';
        }
    }

    resetZoomState() {
        this.isZoomed = false;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.originalPageWidth = null;
        this.originalPageHeight = null;
        this.originalCenterX = null;
        this.originalCenterY = null;
        this.zoomedCenterX = null;
        this.zoomedCenterY = null;
        this.canvas.style.cursor = 'pointer';

        this.calculateSize();
    }

    /* ===== LINK HANDLING ===== */

    getLinkAtPosition(x, y) {
        const cx = this.centerX;
        const topY = this.centerY - this.pageHeight / 2;

        if (this.singlePageMode) {
            const pageX = cx - this.pageWidth / 2;
            return this.checkLinkInPage(this.currentPage, x, y, pageX, topY);
        } else {
            if (this.currentPage === 0) {
                const rightPageX = cx;
                return this.checkLinkInPage(0, x, y, rightPageX, topY);
            }

            const leftPageX = cx - this.pageWidth;
            const rightPageX = cx;

            const leftLink = this.checkLinkInPage(this.currentPage, x, y, leftPageX, topY);
            if (leftLink) return leftLink;

            const rightLink = this.checkLinkInPage(this.currentPage + 1, x, y, rightPageX, topY);
            if (rightLink) return rightLink;
        }

        return null;
    }

    checkLinkInPage(pageIndex, clickX, clickY, pageX, pageY) {
        if (!this.pageLinks || !this.pageLinks[pageIndex]) return null;

        const vp = this.pageViewports[pageIndex];
        if (!vp) return null;

        const offsetX = (this.pageWidth - vp.width) / 2;
        const offsetY = (this.pageHeight - vp.height) / 2;

        // this.pageLinks[pageIndex] คือ array links 
        for (const link of this.pageLinks[pageIndex]) {
            if (!link.transformedRect) continue;

            const [x1, y1, x2, y2] = link.transformedRect;
            const linkLeft = pageX + offsetX + x1;
            const linkRight = pageX + offsetX + x2;
            const linkTop = pageY + offsetY + y1;
            const linkBottom = pageY + offsetY + y2;

            if (clickX >= linkLeft && clickX <= linkRight &&
                clickY >= linkTop && clickY <= linkBottom) {
                return link;
            }
        }

        return null;
    }

    async handleLinkClick(link) {

        if (link.url) {
            window.open(link.url, '_blank');
            return;
        }

        if (link.dest) {
            try {

                if (!this.pdfDoc) {
                    if (link.destPage !== undefined && link.destPage !== null) {
                        await this.goToPage(link.destPage);
                        return;
                    }
                    //  dest  (1‑based) 
                    if (typeof link.dest === 'number') {
                        await this.goToPage(link.dest - 1);
                        return;
                    }
                    return;
                }

                let dest = link.dest;
                // PDF resolve dest name pdfDoc
                if (typeof dest === 'string') {
                    dest = await this.pdfDoc.getDestination(dest);
                }
                // pageIndex 
                if (dest && dest[0]) {
                    const pageIndex = await this.pdfDoc.getPageIndex(dest[0]);
                    await this.goToPage(pageIndex);
                }
            } catch (error) {
            }
        }
    }

    /* ===== UI CONTROLS ===== */

    toggleControls() {
        if (this.controls && this.controls.length > 0) {
            this.controls.forEach(control => {
                control.classList.toggle('hide');
            });
        }
    }

    /* ===== RENDERING ===== */

    animate() {
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = this.canvas.width / dpr;
        const displayHeight = this.canvas.height / dpr;

        this.ctx.clearRect(0, 0, displayWidth, displayHeight);

        if (this.isFlipping) {
            this.flipProgress += 0.035;
            if (this.flipProgress >= 1) {
                this.flipProgress = 1;
                this.currentPage = this.flipTarget;
                this.isFlipping = false;
                this.flipDirection = 0;
                this.updatePageInfo();
                this.cleanupUnusedPages();
                setTimeout(() => {
                    if (this.jsonData && this.highResImages.length > 0) {
                        this.loadHighResForCurrentPageFromJSON();
                    } else {
                        this.loadHighResForCurrentPage();
                    }

                }, 100);
            }
        }

        this.ctx.save();

        if (this.isZoomed) {
            // ใช้ center point ของ canvas เต็มจอ
            const centerX = this.zoomedCenterX || displayWidth / 2;
            const centerY = this.zoomedCenterY || displayHeight / 2;

            // Apply zoom transformation พร้อม pan
            this.ctx.translate(centerX + this.panX, centerY + this.panY);
            this.ctx.scale(this.zoomScale, this.zoomScale);

            // เลื่อนกลับไปที่ตำแหน่งที่ content ควรอยู่
            const contentWidth = this.singlePageMode
                ? this.originalPageWidth
                : (this.originalPageWidth * 2);
            this.ctx.translate(-contentWidth / 2, -this.originalPageHeight / 2);

            // ชั่วคราว - ใช้ค่าเดิมสำหรับการวาด
            const tempCenterX = this.centerX;
            const tempCenterY = this.centerY;
            const tempPageWidth = this.pageWidth;
            const tempPageHeight = this.pageHeight;

            this.centerX = contentWidth / 2;
            this.centerY = this.originalPageHeight / 2;
            this.pageWidth = this.originalPageWidth;
            this.pageHeight = this.originalPageHeight;

            // วาดหน้า
            if (this.pages.length > 0) {
                this.drawPages();
            }

            // คืนค่าเดิม
            this.centerX = tempCenterX;
            this.centerY = tempCenterY;
            this.pageWidth = tempPageWidth;
            this.pageHeight = tempPageHeight;
        } else {
            // โหมดปกติ
            if (this.pages.length > 0) {
                this.drawPages();
            }
        }

        this.ctx.restore();

        requestAnimationFrame(() => this.animate());
    }

    drawPages() {
        const leftIdx = this.currentPage;
        const rightIdx = this.currentPage + 1;
        const cx = this.centerX;
        const topY = this.centerY - this.pageHeight / 2;

        if (!this.isFlipping) {
            if (this.singlePageMode) {
                const pageX = cx - this.pageWidth / 2;
                this.drawPage(pageX, topY, this.pages[this.currentPage]);
                this.drawLinks(this.currentPage, pageX, topY);
            } else {
                // โหมดหน้าคู่
                if (this.currentPage === 0) {
                    // หน้า cover - ซ้ายเป็นหน้าว่าง, ขวาเป็น cover
                    this.drawBlankPage(cx - this.pageWidth, topY);
                    if (this.pages[0]) {
                        this.drawPage(cx, topY, this.pages[0]);
                        this.drawLinks(0, cx, topY);
                    }
                } else {
                    // หน้าซ้าย
                    if (leftIdx < this.totalPages && this.pages[leftIdx]) {
                        this.drawPage(cx - this.pageWidth, topY, this.pages[leftIdx]);
                        this.drawLinks(leftIdx, cx - this.pageWidth, topY);
                    }

                    // หน้าขวา - ใช้ logic เดียวกับ animation
                    if (rightIdx < this.totalPages && this.pages[rightIdx]) {
                        this.drawPage(cx, topY, this.pages[rightIdx]);
                        this.drawLinks(rightIdx, cx, topY);
                    } else if (rightIdx >= this.totalPages) {
                        this.drawBlankPage(cx, topY);
                    }
                }
            }
        } else {
            if (this.singlePageMode) {
                const t = this.easeInOutCubic(this.flipProgress);
                const angle = t * Math.PI;
                const scaleX = Math.cos(angle);
                const pageX = cx - this.pageWidth / 2;

                if (this.flipDirection > 0) {
                    this.drawPage(pageX, topY, this.pages[this.flipTarget]);
                    this.ctx.save();
                    this.ctx.translate(pageX, 0);
                    if (scaleX > 0) {
                        this.ctx.scale(scaleX, 1);
                        this.drawPage(0, topY, this.pages[this.currentPage]);
                    } else {
                        this.ctx.scale(-scaleX, 1);
                        this.drawPage(-this.pageWidth, topY, this.pages[this.flipTarget]);
                    }
                    this.ctx.restore();
                } else {
                    this.drawPage(pageX, topY, this.pages[this.flipTarget]);
                    this.ctx.save();
                    this.ctx.translate(pageX + this.pageWidth, 0);
                    if (scaleX > 0) {
                        this.ctx.scale(scaleX, 1);
                        this.drawPage(-this.pageWidth, topY, this.pages[this.currentPage]);
                    } else {
                        this.ctx.scale(-scaleX, 1);
                        this.drawPage(0, topY, this.pages[this.flipTarget]);
                    }
                    this.ctx.restore();
                }
            } else {
                const t = this.easeInOutCubic(this.flipProgress);
                const angle = t * Math.PI;
                const scaleX = Math.cos(angle);

                if (this.flipDirection > 0) {
                    // กรณีพิเศษ: จากหน้า 0 (cover) ไปหน้า 1-2
                    if (this.currentPage === 0) {
                        // วาดพื้นหลังคงที่: blank (ซ้าย) และ หน้า 2 (ขวา)
                        this.drawBlankPage(cx - this.pageWidth, topY);
                        if (this.pages[2]) {
                            this.drawPage(cx, topY, this.pages[2]);
                        }

                        // Animation: พลิกหน้า cover จากขวา
                        this.ctx.save();
                        this.ctx.translate(cx, 0);
                        if (scaleX > 0) {
                            // ด้านหน้า = cover
                            this.ctx.scale(scaleX, 1);
                            if (this.pages[0]) {
                                this.drawPage(0, topY, this.pages[0]);
                            }
                        } else {
                            // ด้านหลัง = หน้า 1
                            this.ctx.scale(-scaleX, 1);
                            if (this.pages[1]) {
                                this.drawPage(-this.pageWidth, topY, this.pages[1]);
                            }
                        }
                        this.ctx.restore();
                    } else {
                        // กรณีปกติ
                        if (leftIdx + 2 < this.totalPages && this.pages[leftIdx + 2]) {
                            this.drawPage(cx - this.pageWidth, topY, this.pages[leftIdx + 2]);
                        }
                        if (rightIdx + 2 < this.totalPages && this.pages[rightIdx + 2]) {
                            this.drawPage(cx, topY, this.pages[rightIdx + 2]);
                        }

                        if (leftIdx < this.totalPages && this.pages[leftIdx]) {
                            this.drawPage(cx - this.pageWidth, topY, this.pages[leftIdx]);
                        }

                        this.ctx.save();
                        this.ctx.translate(cx, 0);
                        if (scaleX > 0) {
                            this.ctx.scale(scaleX, 1);
                            if (rightIdx < this.totalPages && this.pages[rightIdx]) {
                                this.drawPage(0, topY, this.pages[rightIdx]);
                            }
                        } else {
                            this.ctx.scale(-scaleX, 1);
                            if (rightIdx + 1 < this.totalPages && this.pages[rightIdx + 1]) {
                                this.drawPage(-this.pageWidth, topY, this.pages[rightIdx + 1]);
                            }
                        }
                        this.ctx.restore();
                    }
                } else {
                    // กรณีพิเศษ: กลับมาหน้า 0 (cover)
                    if (this.flipTarget === 0) {
                        // วาดหน้าว่างด้านซ้าย
                        this.drawBlankPage(cx - this.pageWidth, topY);

                        // วาดหน้า 2 ด้านขวา
                        if (this.pages[2]) {
                            this.drawPage(cx, topY, this.pages[2]);
                        }

                        // Animation: พลิกหน้า 1 กลับ
                        this.ctx.save();
                        this.ctx.translate(cx, 0);
                        if (scaleX > 0) {
                            this.ctx.scale(scaleX, 1);
                            if (this.pages[1]) {
                                this.drawPage(-this.pageWidth, topY, this.pages[1]);
                            }
                        } else {
                            this.ctx.scale(-scaleX, 1);
                            if (this.pages[0]) {
                                this.drawPage(0, topY, this.pages[0]);
                            }
                        }
                        this.ctx.restore();
                    } else {
                        // กรณีปกติ
                        if (leftIdx - 2 >= 0 && this.pages[leftIdx - 2]) {
                            this.drawPage(cx - this.pageWidth, topY, this.pages[leftIdx - 2]);
                        }

                        if (rightIdx >= this.totalPages) {
                            this.drawBlankPage(cx, topY);
                        } else if (rightIdx < this.totalPages && this.pages[rightIdx]) {
                            this.drawPage(cx, topY, this.pages[rightIdx]);
                        }

                        this.ctx.save();
                        this.ctx.translate(cx, 0);
                        if (scaleX > 0) {
                            this.ctx.scale(scaleX, 1);
                            if (leftIdx < this.totalPages && this.pages[leftIdx]) {
                                this.drawPage(-this.pageWidth, topY, this.pages[leftIdx]);
                            }
                        } else {
                            this.ctx.scale(-scaleX, 1);
                            if (leftIdx - 1 >= 0 && this.pages[leftIdx - 1]) {
                                this.drawPage(0, topY, this.pages[leftIdx - 1]);
                            }
                        }
                        this.ctx.restore();
                    }
                }
            }
        }

        if (!this.singlePageMode) {
            //optional
        }
    }

    drawPage(x, y, img) {
        if (img) {
            // ใช้ pageIndex ที่เก็บไว้ใน canvas แทน indexOf
            let pageIdx = img.pageIndex;

            // fallback: ถ้าไม่มี pageIndex (กรณี PDF) ให้ใช้ indexOf
            if (pageIdx === undefined) {
                pageIdx = this.pages.indexOf(img);
            }

            if (pageIdx !== -1 && this.pageViewports[pageIdx]) {
                const vp = this.pageViewports[pageIdx];

                const offsetX = (this.pageWidth - vp.width) / 2;
                const offsetY = (this.pageHeight - vp.height) / 2;

                this.ctx.drawImage(
                    img,
                    0, 0, img.width, img.height,
                    x + offsetX, y + offsetY, vp.width, vp.height
                );
            }
        }
    }

    drawBlankPage(x, y) {
        // fill stype bankpage optional
    }

    drawLinks(pageIndex, pageX, pageY) {
        if (!this.pageLinks || !this.pageLinks[pageIndex]) return;

        const vp = this.pageViewports[pageIndex];
        if (!vp) return;

        const offsetX = (this.pageWidth - vp.width) / 2;
        const offsetY = (this.pageHeight - vp.height) / 2;

        this.ctx.fillStyle = 'rgba(0, 100, 255, 0.2)';
        this.ctx.strokeStyle = 'rgba(0, 100, 255, 0.5)';
        this.ctx.lineWidth = 1;

        for (const link of this.pageLinks[pageIndex]) {
            if (!link.transformedRect) continue;

            const [x1, y1, x2, y2] = link.transformedRect;
            const linkLeft = pageX + offsetX + x1;
            const linkTop = pageY + offsetY + y1;
            const linkWidth = x2 - x1;
            const linkHeight = y2 - y1;

            this.ctx.fillRect(linkLeft, linkTop, linkWidth, linkHeight);
            this.ctx.strokeRect(linkLeft, linkTop, linkWidth, linkHeight);
        }
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}