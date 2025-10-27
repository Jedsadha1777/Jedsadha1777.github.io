/**
 * PageCalculator - คำนวณเกี่ยวกับ pagination และ spread
 */
class PageCalculator {

    /* ===== คำนวณจำนวน spread ทั้งหมด ===== */
    static getSpreadCount(totalPages, startWithCover) {
        if (startWithCover) {
            // มี cover: spread 0 (cover) + spreads จากหน้าที่เหลือ
            return 1 + Math.ceil((totalPages - 1) / 2);
        }
        // ไม่มี cover: แบ่งหน้าคู่ตามปกติ
        return Math.ceil(totalPages / 2);
    }

    /* ===== คำนวณว่าอยู่ spread ที่เท่าไหร่ ===== */
    static getCurrentSpread(currentPage, startWithCover) {
        if (startWithCover) {
            // spread 0 = page 0 (cover)
            // spread 1 = pages 1-2
            // spread 2 = pages 3-4
            return currentPage === 0 ? 0 : Math.ceil((currentPage + 1) / 2);
        }
        // spread 0 = pages 0-1
        // spread 1 = pages 2-3
        return Math.floor(currentPage / 2);
    }

    /* ===== Snap page ให้ตรงกับ spread boundary ===== */
    static snapToValidPage(page, singlePageMode, startWithCover) {
        if (singlePageMode || page === 0) return page;

        if (startWithCover) {
            // Snap to odd pages: 1, 3, 5, 7...
            return page % 2 === 0 ? Math.max(1, page - 1) : page;
        } else {
            // Snap to even pages: 0, 2, 4, 6...
            return page % 2 === 0 ? page : page - 1;
        }
    }

    /* ===== คำนวณ target page จาก scroll progress ===== */
    static pageFromProgress(progress, totalPages, singlePageMode, startWithCover) {
        if (singlePageMode) {
            const maxPage = totalPages - 1;
            return Math.round(progress * maxPage);
        }

        if (startWithCover) {
            const totalSpreads = 1 + Math.ceil((totalPages - 1) / 2);
            const targetSpread = Math.round(progress * (totalSpreads - 1));

            if (targetSpread === 0) {
                return 0; // cover
            }
            // spread 1→page 1, spread 2→page 3, spread 3→page 5
            return targetSpread * 2 - 1;
        } else {
            const spreads = Math.ceil(totalPages / 2);
            const targetSpread = Math.round(progress * (spreads - 1));
            return targetSpread * 2;
        }
    }

    /* =====  คำนวณ scroll progress จาก current page ===== */
    static progressFromPage(currentPage, totalPages, singlePageMode, startWithCover) {
        if (singlePageMode) {
            const maxPage = totalPages - 1;
            return maxPage > 0 ? currentPage / maxPage : 0;
        }

        const spreads = this.getSpreadCount(totalPages, startWithCover);
        const currentSpread = this.getCurrentSpread(currentPage, startWithCover);
        return spreads > 1 ? currentSpread / (spreads - 1) : 0;
    }
}

/**
 * PageInfoFormatter - จัดการการแสดงผลข้อมูลหน้า
 */
class PageInfoFormatter {

    /* ===== จัดรูปแบบข้อความแสดงหน้าปัจจุบัน ===== */
    static format(currentPage, totalPages, singlePageMode, startWithCover) {
        if (totalPages === 0) return '';

        if (singlePageMode) {
            return ` ${currentPage + 1} / ${totalPages}`;
        }

        // โหมดหน้าคู่
        if (currentPage === 0) {
            return startWithCover
                ? ` 1 / ${totalPages}`
                : ` 1-2 / ${totalPages}`;
        }

        const rightPage = currentPage + 1;
        if (rightPage < totalPages) {
            const leftDisplay = currentPage + 1;
            const rightDisplay = rightPage + 1;
            return ` ${leftDisplay}-${rightDisplay} / ${totalPages}`;
        } else {
            const leftDisplay = currentPage + 1;
            return ` ${leftDisplay} / ${totalPages}`;
        }
    }

    /* ===== เช็คว่าอยู่ที่ spread สุดท้ายหรือไม่  ===== */
    static isLastSpread(currentPage, totalPages, singlePageMode, startWithCover) {
        if (singlePageMode) {
            return currentPage >= totalPages - 1;
        }

        const totalSpreads = PageCalculator.getSpreadCount(totalPages, startWithCover);
        const currentSpread = PageCalculator.getCurrentSpread(currentPage, startWithCover);

        return currentSpread >= totalSpreads - 1;
    }

    /* ===== อัพเดท UI elements ทั้งหมดที่เกี่ยวกับ page info  ===== */
    static updateUI(turnPage) {
        const info = document.getElementById('pageInfo');
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');

        if (turnPage.isLoading) {
            info.textContent = 'กำลังโหลด...';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            nextBtn.classList.remove('hidden');
            turnPage.scrollThumb.style.opacity = '0.5';
            return;
        }

        turnPage.scrollThumb.style.opacity = '1';

        // แสดงข้อความหน้า
        info.textContent = this.format(
            turnPage.currentPage,
            turnPage.totalPages,
            turnPage.singlePageMode,
            turnPage.startWithCover
        );

        // ปุ่ม Previous
        prevBtn.disabled = turnPage.currentPage === 0 || turnPage.isFlipping;

        // ปุ่ม Next
        const isLastSpread = this.isLastSpread(
            turnPage.currentPage,
            turnPage.totalPages,
            turnPage.singlePageMode,
            turnPage.startWithCover
        );

        nextBtn.disabled = isLastSpread || turnPage.isFlipping;
        if (isLastSpread) {
            nextBtn.classList.add('hidden');
        } else {
            nextBtn.classList.remove('hidden');
        }

        // อัพเดท scroll bar
        turnPage.updateScrollBar();
    }
}

/**
 * GeometryHelper - คำนวณเกี่ยวกับเรขาคณิต
 */
class GeometryHelper {

    /* =====  เช็คว่าจุด (x, y) อยู่ใน rect หรือไม่ ===== */
    static isPointInRect(x, y, rect) {
        const [x1, y1, x2, y2] = rect;
        return x >= x1 && x <= x2 && y >= y1 && y <= y2;
    }

    /* =====  คำนวณระยะห่างจากจุดกลาง ===== */
    static distanceFromCenter(x, y, centerX, centerY) {
        return Math.sqrt(
            Math.pow(x - centerX, 2) +
            Math.pow(y - centerY, 2)
        );
    }

    /* =====  จำกัดค่าให้อยู่ในช่วง min-max ===== */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /* =====  คำนวณขอบเขตการ pan ตอน zoom ===== */
    static calculatePanBounds(contentWidth, contentHeight, displayWidth, displayHeight, zoomScale) {
        const zoomedWidth = contentWidth * zoomScale;
        const zoomedHeight = contentHeight * zoomScale;

        return {
            maxPanX: Math.max(0, (zoomedWidth - displayWidth) / 2),
            maxPanY: Math.max(0, (zoomedHeight - displayHeight) / 2)
        };
    }

    /* =====  Clamp pan values ตามขอบเขต ===== */
    static clampPan(panX, panY, bounds) {
        return {
            panX: this.clamp(panX, -bounds.maxPanX, bounds.maxPanX),
            panY: this.clamp(panY, -bounds.maxPanY, bounds.maxPanY)
        };
    }
}

/**
 * TurnPage - Main
 */
class TurnPage {

    /* ===== CONFIG ===== */
    static CONFIG = {
        // Animation
        FLIP_SPEED: 0.035,
        ZOOM_SCALE: 2,

        // Rendering
        THUMBNAIL_SCALE: 0.2,
        THUMBNAIL_QUALITY: 0.8,
        DPR_SCALE_LOW: 0.2,

        // Interaction
        CLICK_THRESHOLD_MS: 300,
        MOVE_THRESHOLD_PX: 10,
        DOUBLE_TAP_THRESHOLD_MS: 300,
        CENTER_ZONE_RATIO: 0.3,
        FLIP_COMMIT_THRESHOLD: 0.3,

        // Page Loading
        PAGE_BUFFER_SINGLE: 3,
        PAGE_BUFFER_DOUBLE: 6,
        PAGE_BUFFER_INITIAL_SINGLE: 2,
        PAGE_BUFFER_INITIAL_DOUBLE: 4,
        THUMBNAIL_BATCH_SIZE: 5,

        // Delays
        RESIZE_DEBOUNCE_MS: 300,
        HIGH_RES_DELAY_MS: 300,
        HIGH_RES_LOAD_DELAY_MS: 500,
        HIGH_RES_INITIAL_DELAY_MS: 100,
        SINGLE_CLICK_DELAY_MS: 300,

        // Rubber Band Effect
        RUBBER_BAND_RESISTANCE: 0.3,      // ความแข็งของยาง (0-1, น้อย = ยืดง่าย)
        RUBBER_BAND_SNAP_DURATION: 300,   // เวลาดีดกลับ (ms)
        RUBBER_BAND_MAX_DISTANCE: 80,     // ระยะยืดสุด (px)

        // Zoom Animation
        ZOOM_ANIMATION_DURATION: 250,
        ZOOM_MIN_SCALE: 1,           // ขั้นต่ำ
        ZOOM_MAX_SCALE: 4,           // ขั้นสูงสุด
        ZOOM_RUBBER_BAND_RANGE: 0.3, // ระยะยืดได้นอกขีด (0.7-4.3)

        // Link Display
        LINK_FADE_DURATION: 2000,      // แสดง link 2 วินาทีแล้ว fade
        LINK_FADE_OUT_SPEED: 0.1,
        LINK_FADE_IN_SPEED: 0.2,
    };


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
            startWithCover: options.startWithCover !== false,
            autoDetectMode: options.autoDetectMode !== false, // เปิดใช้งาน auto-detect โดย default
            ...options
        };

        this.singlePageMode = this.options.singlePageMode;


        // Initialize properties
        this.totalPages = 0;
        this.currentPage = 0;
        this.pages = [];
        this.pageLinks = [];
        this.flipProgress = 0;
        this.isFlipping = false;
        this.flipDirection = 0;
        this.flipTarget = 0;
        this.startWithCover = this.options.startWithCover;

        this.isZoomed = false;
        this.zoomScale = 1;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastPanX = 0;
        this.lastPanY = 0;

        /* INERTIAL SCROLLING */
        this.panVelocityX = 0;
        this.panVelocityY = 0;
        this.lastPanTime = 0;
        this.isInertialScrolling = false;
        this.inertiaAnimationId = null;

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

        // Pinch-to-zoom properties
        this.isPinching = false;
        this.initialPinchDistance = 0;
        this.initialZoomScale = 1;
        this.pinchCenter = { x: 0, y: 0 };
        this.isZoomingOut = false;
        this.isZoomRubberBanding = false;
        this.isAnimatingZoom = false;
        this.isResettingZoom = false;
        // Lock เพื่อป้องกัน race condition ระหว่าง pinch zoom
        this.isPinchZooming = false;
        this.lockedSinglePageMode = null;
        this.lockedOriginalDimensions = null;

        // Rubber band state
        this.isOverscrolling = false;
        this.overscrollX = 0;
        this.overscrollY = 0;

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

        // Link display state
        this.linkOpacity = 1;
        this.linkFadeTimer = null;
        this.hoveredLink = null;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        window.addEventListener('resize', () => {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }

            this.resizeTimeout = setTimeout(() => {

                if (this.options.autoDetectMode) {
                    const newMode = this.detectViewMode();
                    if (newMode !== this.singlePageMode) {
                        this.singlePageMode = newMode;
                        this.updateModeButtons();

                        if (!this.singlePageMode && this.currentPage > 0) {
                            this.currentPage = PageCalculator.snapToValidPage(
                                this.currentPage,
                                this.singlePageMode,
                                this.startWithCover
                            );
                        }
                        //  อัพเดท pagination ทันที
                        this.updatePageInfo();
                    }
                }

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
                    // PDF mode: ล้างข้อมูลและให้ loadPageRange() สร้างใหม่
                    this.pages = new Array(this.totalPages);
                    this.pageViewports = new Array(this.totalPages);
                    this.pageLinks = new Array(this.totalPages);
                }

                this.calculateSize();

                const initialPages = this.singlePageMode
                    ? TurnPage.CONFIG.PAGE_BUFFER_INITIAL_SINGLE
                    : TurnPage.CONFIG.PAGE_BUFFER_INITIAL_DOUBLE;

                if (this.pdfDoc && !this.isLoading) {
                    this.loadPageRange(this.currentPage, Math.min(this.currentPage + initialPages - 1, this.totalPages - 1), true, false)
                        .then(() => {
                            setTimeout(() => {
                                this.loadHighResForCurrentPage();
                            }, TurnPage.CONFIG.HIGH_RES_DELAY_MS);
                        });
                } else if (this.jsonData && this.lowResImages.length > 0 && !this.isLoading) {
                    this.pages = new Array(this.totalPages);
                    this.loadPageRangeFromJSON(this.currentPage, Math.min(this.currentPage + initialPages - 1, this.totalPages - 1), false)
                        .then(() => {
                            setTimeout(() => {
                                this.loadHighResForCurrentPageFromJSON();
                            }, TurnPage.CONFIG.HIGH_RES_DELAY_MS);
                        });
                }
            }, TurnPage.CONFIG.HIGH_RES_DELAY_MS);
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

        if (this.isPinching || this.isPinchZooming) {
            return;
        }

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

            // ดึงข้อมูล viewport จากหน้าแรก
            const firstPage = await this.pdfDoc.getPage(1);
            const raw = firstPage.getViewport({ scale: 1 });
            const ratio = raw.width / raw.height;

            // คำนวณขนาดหน้ากระดาษ
            const maxWidth = window.innerWidth;
            const targetHeight = window.innerHeight;
            const pageCount = this.singlePageMode ? 1 : 2;

            let pageHeight = targetHeight;
            let pageWidth = pageHeight * ratio;

            if (pageWidth * pageCount > maxWidth) {
                pageWidth = maxWidth / pageCount;
                pageHeight = pageWidth / ratio;
            }

            this.pageWidth = pageWidth;
            this.pageHeight = pageHeight;

            this.currentPage = 0;
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

            this.calculateSize();


            const initialPages = this.singlePageMode
                ? TurnPage.CONFIG.PAGE_BUFFER_INITIAL_SINGLE  // was 2
                : TurnPage.CONFIG.PAGE_BUFFER_INITIAL_DOUBLE; // was 4

            await this.loadPageRange(0, Math.min(initialPages - 1, this.totalPages - 1), false, false);



            this.isLoading = false;
            this.updatePageInfo();

            if (!this.thumbnailData) {
                this.generateThumbnailsFromPDF();
            }

            setTimeout(() => {
                this.loadHighResForCurrentPage();
            }, TurnPage.CONFIG.HIGH_RES_DELAY_MS);

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

            const initialPages = this.singlePageMode
                ? TurnPage.CONFIG.PAGE_BUFFER_INITIAL_SINGLE
                : TurnPage.CONFIG.PAGE_BUFFER_INITIAL_DOUBLE;

            await this.loadPageRangeFromJSON(0, Math.min(initialPages - 1, this.totalPages - 1), false);

            setTimeout(() => {
                this.loadHighResForCurrentPageFromJSON();
            }, TurnPage.CONFIG.HIGH_RES_DELAY_MS);
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

            // เก็บ viewport สำหรับ display (ครั้งเดียว)
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
                renderScale = baseScale * (dpr * TurnPage.CONFIG.DPR_SCALE_LOW);
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

            // ← CRITICAL FIX: ใช้ layoutViewport สำหรับ links เสมอ (ไม่ขึ้นกับ low/high-res)
            if (!this.pageLinks[i]) {
                const annotations = await page.getAnnotations();
                const transform = layoutViewport.transform; // ← ใช้ layoutViewport

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
        const batchSize = TurnPage.CONFIG.THUMBNAIL_BATCH_SIZE;
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
            const viewport = page.getViewport({ scale: TurnPage.CONFIG.THUMBNAIL_SCALE }); // 

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            // data to URL
            return canvas.toDataURL('image/jpeg', TurnPage.CONFIG.THUMBNAIL_QUALITY);
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

            if (this.startWithCover) {
                if (pageIndex === 0) {
                    this.currentPage = 0;
                } else {
                    this.currentPage = PageCalculator.snapToValidPage(
                        pageIndex,
                        false,
                        this.startWithCover
                    );
                }
            } else {
                this.currentPage = PageCalculator.snapToValidPage(
                    pageIndex,
                    false,
                    this.startWithCover
                );
            }
        }

        const pagesToLoad = this.singlePageMode
            ? TurnPage.CONFIG.PAGE_BUFFER_SINGLE   // was 3
            : TurnPage.CONFIG.PAGE_BUFFER_DOUBLE;  // was 6

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
        this.startLinkFadeTimer();
        this.cleanupUnusedPages();

        setTimeout(() => {
            if (this.jsonData && this.highResImages.length > 0) {
                this.loadHighResForCurrentPageFromJSON();
            } else {
                this.loadHighResForCurrentPage();
            }
        }, TurnPage.CONFIG.HIGH_RES_LOAD_DELAY_MS);
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
            if (this.startWithCover) {
                // แบบมี blank page (cover mode)
                // Next: 0→1, 1→3, 3→5, 5→7...
                // Prev: 1→0, 3→1, 5→3, 7→5...
                if (this.currentPage === 0 && dir > 0) {
                    target = 1;
                } else if (target === -1 || target === -2) {
                    target = 0;
                }
            } else {
                // แบบไม่มี blank page (normal mode)
                // Next: 0→2, 2→4, 4→6...
                // Prev: 2→0, 4→2, 6→4...
                if (target < 0) {
                    target = 0;
                }
            }
        }

        if (target < 0) return;

        if (this.singlePageMode) {
            if (target >= this.totalPages) return;
        } else {
            if (target >= this.totalPages) return;
        }

        const pagesToLoad = this.singlePageMode
            ? TurnPage.CONFIG.PAGE_BUFFER_SINGLE   // was 3
            : TurnPage.CONFIG.PAGE_BUFFER_DOUBLE;  // was 6

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
        this.startLinkFadeTimer();

    }

    async setMode(singlePage) {
        if (this.isZoomed) {
            this.resetZoomState();
        }

        this.singlePageMode = singlePage;

        this.originalPageWidth = null;
        this.originalPageHeight = null;
        this.originalCenterX = null;
        this.originalCenterY = null;

        // Snap currentPage เมื่อเปลี่ยนเป็นหน้าคู่
        if (!singlePage && this.currentPage > 0) {
            this.currentPage = PageCalculator.snapToValidPage(
                this.currentPage,
                singlePage,
                this.startWithCover
            );
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
            this.pageViewports = new Array(this.totalPages);

            this.pageLinks = new Array(this.totalPages);

            const bufferPages = TurnPage.CONFIG.PAGE_BUFFER_SINGLE;
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

            }, TurnPage.CONFIG.HIGH_RES_DELAY_MS);
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
        PageInfoFormatter.updateUI(this);
    }

    cleanupUnusedPages() {
        if (!this.pdfDoc || this.totalPages === 0) return;

        const keepRange = this.singlePageMode
            ? TurnPage.CONFIG.PAGE_BUFFER_SINGLE   // was 4
            : TurnPage.CONFIG.PAGE_BUFFER_DOUBLE;  // was 6

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
        const progress = PageCalculator.progressFromPage(
            this.currentPage,
            this.totalPages,
            this.singlePageMode,
            this.startWithCover
        );

        // คำนวณตำแหน่งโดยใช้ trackWidth ที่อัพเดทแล้ว
        const maxLeft = Math.max(0, trackWidth - thumbWidth);
        const thumbLeft = progress * maxLeft;

        this.scrollThumb.style.left = `${thumbLeft}px`;
    }

    updateScrollPosition(progress) {
        if (this.totalPages === 0) return;

        let targetPage = PageCalculator.pageFromProgress(
            progress,
            this.totalPages,
            this.singlePageMode,
            this.startWithCover
        );

        targetPage = Math.max(0, Math.min(this.totalPages - 1, targetPage));
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
        newLeft = GeometryHelper.clamp(newLeft, 0, maxLeft);

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
        const clampedProgress = GeometryHelper.clamp(progress, 0, 1);

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
        newLeft = GeometryHelper.clamp(newLeft, 0, maxLeft);

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
        const clampedProgress = GeometryHelper.clamp(progress, 0, 1);

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

        const maxPage = this.singlePageMode ? this.totalPages - 1 : this.totalPages - 2;

        if (x > this.centerX && this.currentPage < maxPage) {

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

        /*  INERTIAL SCROLLING - หยุด inertia เมื่อเริ่ม interact ใหม่ */
        if (this.isInertialScrolling && (this.isPanning || this.dragging)) {
            this.stopInertialScrolling();
        }

        /* 1. Track และแปลงตำแหน่ง mouse */
        const rect = this.canvas.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;

        this.lastMouseX = rawX;
        this.lastMouseY = rawY;

        // แปลงตำแหน่งสำหรับ link detection
        let linkCheckX = rawX;
        let linkCheckY = rawY;

        if (this.isZoomed) {
            const displayWidth = rect.width;
            const displayHeight = rect.height;

            const centerX = displayWidth / 2;
            const centerY = displayHeight / 2;

            const xAfterPan = rawX - centerX - this.panX;
            const yAfterPan = rawY - centerY - this.panY;

            const xAfterZoom = xAfterPan / this.zoomScale;
            const yAfterZoom = yAfterPan / this.zoomScale;

            const contentWidth = this.singlePageMode
                ? this.originalPageWidth
                : (this.originalPageWidth * 2);
            linkCheckX = xAfterZoom + contentWidth / 2;
            linkCheckY = yAfterZoom + this.originalPageHeight / 2;
        }
        // 2. เช็ค link hover ด้วยตำแหน่งที่แปลงแล้ว
        if (!this.isZoomed && !this.isPanning && !this.dragging) {
            this.checkLinkHover(linkCheckX, linkCheckY);
        } else if (this.isZoomed && !this.isPanning && !this.dragging) {
            // ตอน zoom ก็ต้องเช็ค hover ด้วย
            this.checkLinkHover(linkCheckX, linkCheckY);
        }

        // 3. Pan logic (มี return)
        if (this.isPanning && this.isZoomed) {
            if (this.isResettingZoom) {
                return;
            }

            if (!this.originalPageWidth || !this.originalPageHeight) {
                return;
            }

            const dx = e.clientX - this.lastPanX;
            const dy = e.clientY - this.lastPanY;

            /*  INERTIAL SCROLLING - Track velocity */
            const currentTime = performance.now();
            const deltaTime = currentTime - this.lastPanTime;
            if (deltaTime > 0) {
                this.panVelocityX = dx / deltaTime * 16.67; // normalize to 60fps
                this.panVelocityY = dy / deltaTime * 16.67;
            }

            let newPanX = this.panX + dx;
            let newPanY = this.panY + dy;

            const contentWidth = this.singlePageMode
                ? this.originalPageWidth
                : (this.originalPageWidth * 2);
            const contentHeight = this.originalPageHeight;

            const displayWidth = window.innerWidth;
            const displayHeight = window.innerHeight;

            const bounds = GeometryHelper.calculatePanBounds(
                contentWidth,
                contentHeight,
                displayWidth,
                displayHeight,
                this.zoomScale
            );

            const maxPanX = bounds.maxPanX;
            const maxPanY = bounds.maxPanY;

            let isOverX = false;
            let isOverY = false;

            if (newPanX > maxPanX) {
                isOverX = true;
                const overX = newPanX - maxPanX;
                newPanX = maxPanX + this.applyRubberBand(overX);
            } else if (newPanX < -maxPanX) {
                isOverX = true;
                const overX = newPanX + maxPanX;
                newPanX = -maxPanX + this.applyRubberBand(overX);
            }

            if (newPanY > maxPanY) {
                isOverY = true;
                const overY = newPanY - maxPanY;
                newPanY = maxPanY + this.applyRubberBand(overY);
            } else if (newPanY < -maxPanY) {
                isOverY = true;
                const overY = newPanY + maxPanY;
                newPanY = -maxPanY + this.applyRubberBand(overY);
            }

            this.isOverscrolling = isOverX || isOverY;
            this.panX = newPanX;
            this.panY = newPanY;

            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;

            this.lastPanTime = currentTime;
            return;
        }

        // 4. Flip drag logic
        if (!this.dragging || this.isFlipping || this.isZoomed) return;
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

            if (this.isOverscrolling) {
               /* ยกเลิก inertia ถ้ามี overscroll */
                this.panVelocityX = 0;
                this.panVelocityY = 0;

                this.snapBackToEdge();
                return;
            }

            /*  INERTIAL SCROLLING - เริ่ม inertial scrolling */
            const velocityThreshold = 0.5;
            const velocityMagnitude = Math.sqrt(
                this.panVelocityX * this.panVelocityX + 
                this.panVelocityY * this.panVelocityY
            );

            if (velocityMagnitude > velocityThreshold && !this.isOverscrolling) {
                this.startInertialScrolling();
                return;
            }
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
        if (clickDuration < TurnPage.CONFIG.CLICK_THRESHOLD_MS &&
            moveDistance < TurnPage.CONFIG.MOVE_THRESHOLD_PX &&
            !this.isFlipping) {

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
            const distanceFromCenter = GeometryHelper.distanceFromCenter(x, y, centerX, centerY);
            const centerZone = Math.min(rect.width, rect.height) * TurnPage.CONFIG.CENTER_ZONE_RATIO;

            // จัดการ click
            this.clickCount++;

            if (this.clickCount === 1) {
                this.clickTimeout = setTimeout(() => {
                    /* อนุญาต toggle ทั้งตอน zoom และไม่ zoom */
                    if (distanceFromCenter <= centerZone) {
                        this.toggleControls();
                    }
                    this.clickCount = 0;
                }, TurnPage.CONFIG.SINGLE_CLICK_DELAY_MS);
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
            if (this.flipProgress > TurnPage.CONFIG.FLIP_COMMIT_THRESHOLD) {
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

    // helper คำนวณระยะห่างระหว่างสองจุด touch
    getTouchDistance(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // helper คำนวณจุดกึ่งกลางระหว่างสองจุด touch
    getTouchCenter(touch1, touch2) {
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    }

    onTouchStart(e) {

        // 2 นิ้ว = pinch zoom
        if (e.touches.length === 2) {
            e.preventDefault();

            // ยกเลิก single touch interactions
            if (this.touchTimeout) {
                clearTimeout(this.touchTimeout);
                this.touchTimeout = null;
            }
            this.lastTouchTime = null;
            this.dragging = false;

            /* BEGIN PATCH: Lock dimensions ทันทีที่เริ่ม pinch */
            if (!this.originalPageWidth) {
                // เก็บขนาดหน้าเดียว (ไม่ใช่ canvas width)
                this.originalPageWidth = this.pageWidth;
                this.originalPageHeight = this.pageHeight;
                this.originalCenterX = this.centerX;
                this.originalCenterY = this.centerY;

                // Lock mode และ dimensions เพื่อป้องกัน race condition
                this.lockedSinglePageMode = this.singlePageMode;

                // คำนวณ canvas width ที่ถูกต้องตาม mode ที่ lock
                this.originalCanvasWidth = this.lockedSinglePageMode
                    ? this.originalPageWidth
                    : (this.originalPageWidth * 2);

                this.lockedOriginalDimensions = {
                    pageWidth: this.originalPageWidth,
                    pageHeight: this.originalPageHeight,
                    canvasWidth: this.originalCanvasWidth
                };
            }

            // เริ่ม pinch
            this.isPinching = true;
            this.initialPinchDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
            this.initialZoomScale = this.zoomScale;

            const rect = this.canvas.getBoundingClientRect();
            const center = this.getTouchCenter(e.touches[0], e.touches[1]);
            this.pinchCenter = {
                x: center.x - rect.left,
                y: center.y - rect.top
            };

            // ตั้ง flag ว่ากำลัง pinch zoom
            this.isPinchZooming = true;

            return;
        }

        // 1 นิ้ว = ปกติ
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

        // ถ้ากำลัง pinch (2 นิ้ว) แต่ตอนนี้เหลือ 1 นิ้ว → reset pinch state
        if (this.isPinching && e.touches.length === 1) {
            this.isPinching = false;
            this.isPinchZooming = false;

            // อย่าลืม snap zoom ถ้าอยู่ใน rubber band zone
            const minScale = TurnPage.CONFIG.ZOOM_MIN_SCALE;
            const maxScale = TurnPage.CONFIG.ZOOM_MAX_SCALE;

            if (!this.isAnimatingZoom) {
                if (this.zoomScale < minScale) {
                    this.snapZoomToScale(minScale);
                } else if (this.zoomScale > maxScale) {
                    this.snapZoomToScale(maxScale);
                }
            }

            // ตั้งค่า isPanning สำหรับ 1 นิ้วต่อ
            if (this.isZoomed) {
                this.isPanning = false; // ← reset เพื่อให้ logic ด้านล่างเริ่มใหม่

                /* BEGIN NEW FIX: Reset touch tracking */
                // ← Reset เวลาเริ่ม touch ใหม่เพื่อป้องกัน false tap detection
                this.touchStartTime = Date.now();
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            }
        }

        // Pinch zoom (2 นิ้ว)
        if (e.touches.length === 2 && this.isPinching) {
            e.preventDefault();

            const rect = this.canvas.getBoundingClientRect();
            const center = this.getTouchCenter(e.touches[0], e.touches[1]);
            this.pinchCenter = {
                x: center.x - rect.left,
                y: center.y - rect.top
            };

            const currentDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
            const scale = currentDistance / this.initialPinchDistance;
            let newZoomScale = this.initialZoomScale * scale;

            /* Zoom Rubber Band Logic */
            const minScale = TurnPage.CONFIG.ZOOM_MIN_SCALE;
            const maxScale = TurnPage.CONFIG.ZOOM_MAX_SCALE;
            const rubberRange = TurnPage.CONFIG.ZOOM_RUBBER_BAND_RANGE;

            if (newZoomScale < minScale) {
                const underflow = minScale - newZoomScale;
                const damped = this.applyRubberBand(underflow);
                newZoomScale = minScale - damped * rubberRange;
            } else if (newZoomScale > maxScale) {
                const overflow = newZoomScale - maxScale;
                const damped = this.applyRubberBand(overflow);
                newZoomScale = maxScale + damped * rubberRange;
            }

            const absoluteMin = minScale - rubberRange;
            const absoluteMax = maxScale + rubberRange;
            newZoomScale = GeometryHelper.clamp(newZoomScale, absoluteMin, absoluteMax);

            // เช็คว่ากำลัง zoom out กลับไปปกติหรือไม่
            if (newZoomScale < this.initialZoomScale &&
                newZoomScale < 1.1 &&
                !this.isZoomRubberBanding) {

                if (this.isZoomed) {
                    this.isZoomed = false;
                    this.panX = 0;
                    this.panY = 0;
                    // ใช้ค่าจาก locked dimensions
                    this.resetZoomWithLockedDimensions();
                    this.canvas.style.cursor = 'pointer';
                }

                return;
            }

            // เข้าสู่ zoom mode
            if (!this.isZoomed) {
                this.isZoomed = true;

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

                this.canvas.style.cursor = 'grab';
            }

            // เช็คว่าอยู่ใน rubber band zone หรือไม่
            this.isZoomRubberBanding = (
                newZoomScale < minScale ||
                newZoomScale > maxScale
            );

            // อัพเดท zoom scale
            this.zoomScale = newZoomScale;

            /* BEGIN ULTIMATE FIX: ใช้ actual content dimensions */
            if (this.lockedOriginalDimensions) {
                const locked = this.lockedOriginalDimensions;
                // CRITICAL: ใช้ pageWidth จริง (มี padding/centering)
                // locked.pageWidth = ขนาดหน้าเดี่ยว (ไม่รวม blank space)
                const singlePageWidth = locked.pageWidth;
                const contentWidth = this.lockedSinglePageMode
                    ? singlePageWidth
                    : (singlePageWidth * 2);
                const contentHeight = locked.pageHeight;

                // ใช้ originalCenterX ที่บันทึกไว้ (จุดกลาง display จริง)
                // สำหรับหน้าคู่: centerX อาจไม่ใช่ pageWidth ถ้ามี blank space
                const displayCenterX = this.originalCenterX;
                const displayCenterY = this.originalCenterY;

                // หา offset จากจุดกลาง canvas
                const offsetX = this.pinchCenter.x - displayCenterX;
                const offsetY = this.pinchCenter.y - displayCenterY;

                // แปลงเป็น normalized (-0.5 ถึง 0.5)
                // ต้องใช้ contentWidth เพื่อ normalize ให้ถูกต้อง
                const normalizedX = offsetX / contentWidth;
                const normalizedY = offsetY / contentHeight;

                // คำนวณ pan
                this.panX = -normalizedX * contentWidth * (this.zoomScale - 1);
                this.panY = -normalizedY * contentHeight * (this.zoomScale - 1);

            } else if (this.originalPageWidth && this.originalPageHeight &&
                this.originalCenterX !== null && this.originalCenterY !== null) {

                // Fallback: ใช้ logic เดียวกัน
                const useSingleMode = this.lockedSinglePageMode !== null
                    ? this.lockedSinglePageMode
                    : this.singlePageMode;

                const contentWidth = useSingleMode
                    ? this.originalPageWidth
                    : (this.originalPageWidth * 2);

                const contentHeight = this.originalPageHeight;

                const displayCenterX = this.originalCenterX;
                const displayCenterY = this.originalCenterY;

                const offsetX = this.pinchCenter.x - displayCenterX;
                const offsetY = this.pinchCenter.y - displayCenterY;

                const normalizedX = offsetX / contentWidth;
                const normalizedY = offsetY / contentHeight;

                this.panX = -normalizedX * contentWidth * (this.zoomScale - 1);
                this.panY = -normalizedY * contentHeight * (this.zoomScale - 1);
            } else {
                this.panX = 0;
                this.panY = 0;
            }
            /* END ULTIMATE FIX */

            return;
        }

        // 1 นิ้วขณะ zoom = pan
        if (e.touches.length === 1 && this.isZoomed && !this.isPinching) {
            e.preventDefault();


            // ถ้ากำลัง reset → ไม่ทำอะไร
            if (this.isResettingZoom) {
                return;
            }

            // ถ้าไม่มี original dimensions → ไม่ทำอะไร
            if (!this.originalPageWidth || !this.originalPageHeight) {
                return;
            }

             const touch = e.touches[0];

            /*  INERTIAL SCROLLING - Track velocity สำหรับ touch */
            // ถ้ายังไม่เคยตั้งค่า lastPan ให้ตั้งเป็นตำแหน่งปัจจุบัน
            if (!this.isPanning) {
                this.isPanning = true;
                this.lastPanX = touch.clientX;
                this.lastPanY = touch.clientY;
                return;
            }

            // คำนวณ delta
            const dx = touch.clientX - this.lastPanX;
            const dy = touch.clientY - this.lastPanY;

            const currentTime = performance.now();
            const deltaTime = currentTime - this.lastPanTime;
            if (deltaTime > 0) {
                this.panVelocityX = dx / deltaTime * 16.67;
                this.panVelocityY = dy / deltaTime * 16.67;
            }           

            /* BEGIN PATCH: ใช้ locked dimensions ถ้ามี */
            const useSingleMode = this.lockedSinglePageMode !== null
                ? this.lockedSinglePageMode
                : this.singlePageMode;

            const contentWidth = useSingleMode
                ? this.originalPageWidth
                : (this.originalPageWidth * 2);
            /* END PATCH */

            let newPanX = this.panX + dx;
            let newPanY = this.panY + dy;


            const contentHeight = this.originalPageHeight;
            const displayWidth = window.innerWidth;
            const displayHeight = window.innerHeight;

            const bounds = GeometryHelper.calculatePanBounds(
                contentWidth,
                contentHeight,
                displayWidth,
                displayHeight,
                this.zoomScale
            );

            const maxPanX = bounds.maxPanX;
            const maxPanY = bounds.maxPanY;

            let isOverX = false;
            let isOverY = false;

            // X-axis - rubber band
            if (newPanX > maxPanX) {
                isOverX = true;
                const overX = newPanX - maxPanX;
                newPanX = maxPanX + this.applyRubberBand(overX);
            } else if (newPanX < -maxPanX) {
                isOverX = true;
                const overX = newPanX + maxPanX;
                newPanX = -maxPanX + this.applyRubberBand(overX);
            }

            // Y-axis - rubber band
            if (newPanY > maxPanY) {
                isOverY = true;
                const overY = newPanY - maxPanY;
                newPanY = maxPanY + this.applyRubberBand(overY);
            } else if (newPanY < -maxPanY) {
                isOverY = true;
                const overY = newPanY + maxPanY;
                newPanY = -maxPanY + this.applyRubberBand(overY);
            }

            this.isOverscrolling = isOverX || isOverY;
            this.panX = newPanX;
            this.panY = newPanY;

            this.lastPanX = touch.clientX;
            this.lastPanY = touch.clientY;
            this.lastPanTime = currentTime;

            return;
        }

        // 1 นิ้วปกติ (ไม่ zoom) = flip page
        if (e.touches.length === 1 && !this.isPinching && !this.isZoomed) {
            e.preventDefault();
            const touch = e.touches[0];
            this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    onTouchEnd(e) {
        // จบ pinch
        if (this.isPinching) {
            this.isPinching = false;
            this.isPinchZooming = false;


            const minScale = TurnPage.CONFIG.ZOOM_MIN_SCALE;
            const maxScale = TurnPage.CONFIG.ZOOM_MAX_SCALE;

            if (!this.isAnimatingZoom) {
                if (this.zoomScale < minScale) {
                    this.snapZoomToScale(minScale);
                } else if (this.zoomScale > maxScale) {
                    this.snapZoomToScale(maxScale);
                } else if (this.zoomScale < 1.1) {
                    /*  Reset ทันที */
                    this.resetZoomWithLockedDimensions();
                    return;
                } else {
                    this.canvas.style.cursor = 'grab';
                    this.isZoomRubberBanding = false;
                }
            }

            if (e.touches.length === 1) {
                const touch = e.touches[0];
                this.touchStartTime = Date.now();
                this.touchStartX = touch.clientX;
                this.touchStartY = touch.clientY;
            }

            return;
        }


        // Touch end ปกติ (1 นิ้ว)
        const touchDuration = Date.now() - this.touchStartTime;
        const touch = e.changedTouches[0];
        const moveDistance = Math.sqrt(
            Math.pow(touch.clientX - this.touchStartX, 2) +
            Math.pow(touch.clientY - this.touchStartY, 2)
        );

        /*  Reset isPanning */
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = this.isZoomed ? 'grab' : 'pointer';

            if (this.isOverscrolling) {
                this.panVelocityX = 0;
                this.panVelocityY = 0;

                this.snapBackToEdge();
                return;
            }

            /*  INERTIAL SCROLLING - เริ่ม inertial scrolling สำหรับ touch */
            const velocityThreshold = 0.5;
            const velocityMagnitude = Math.sqrt(
                this.panVelocityX * this.panVelocityX + 
                this.panVelocityY * this.panVelocityY
            );

            if (velocityMagnitude > velocityThreshold && !this.isOverscrolling) {
                this.startInertialScrolling();
                return;
            }
        }

        if (touchDuration < TurnPage.CONFIG.CLICK_THRESHOLD_MS &&
            moveDistance < TurnPage.CONFIG.MOVE_THRESHOLD_PX &&
            !this.isFlipping) {

            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            const clickedLink = this.getLinkAtPosition(x, y);
            if (clickedLink) {
                this.handleLinkClick(clickedLink);
                this.dragging = false;
                return;
            }

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const distanceFromCenter = GeometryHelper.distanceFromCenter(x, y, centerX, centerY);
            const centerZone = Math.min(rect.width, rect.height) * TurnPage.CONFIG.CENTER_ZONE_RATIO;

            const now = Date.now();
            if (this.lastTouchTime && now - this.lastTouchTime < TurnPage.CONFIG.DOUBLE_TAP_THRESHOLD_MS) {
                // Double tap = zoom
                clearTimeout(this.touchTimeout);
                this.lastTouchTime = null;
                this.handleZoom(e, x, y);
            } else {
                // Single tap
                this.lastTouchTime = now;
                this.touchTimeout = setTimeout(() => {
                    /* อนุญาต toggle ทั้งตอน zoom และไม่ zoom */
                    if (distanceFromCenter <= centerZone) {
                        this.toggleControls();
                    }
                    this.lastTouchTime = null;
                }, TurnPage.CONFIG.SINGLE_CLICK_DELAY_MS);
            }
            this.dragging = false;
            return;
        }

        if (this.dragging) {
            if (this.flipProgress > TurnPage.CONFIG.FLIP_COMMIT_THRESHOLD) {
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
        if (this.isAnimatingZoom) return;

        if (this.isZoomed) {
            this.isZoomingOut = true;

            // Zoom out
            this.animateZoom(
                this.zoomScale,
                1,
                x, y,
                () => {
                    this.isZoomingOut = false;
                    this.isZoomed = false;
                    this.panX = 0;
                    this.panY = 0;
                    this.canvas.style.cursor = 'pointer';
                }
            );

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

            const targetPanX = -clickOffsetX * contentWidth * (TurnPage.CONFIG.ZOOM_SCALE - 1);
            const targetPanY = -clickOffsetY * this.originalPageHeight * (TurnPage.CONFIG.ZOOM_SCALE - 1);

            this.animateZoom(
                1,
                TurnPage.CONFIG.ZOOM_SCALE,
                x, y,
                null,
                targetPanX,
                targetPanY
            );

            this.canvas.style.cursor = 'grab';
        }
    }

    animateZoom(fromScale, toScale, centerX, centerY, onComplete, targetPanX = 0, targetPanY = 0) {
        // ถ้ากำลัง animate อยู่แล้ว → ออกเลย
        if (this.isAnimatingZoom) return;

        this.isAnimatingZoom = true; // ← ตั้ง flag

        const duration = TurnPage.CONFIG.ZOOM_ANIMATION_DURATION;
        const startTime = performance.now();
        const startScale = fromScale;
        const startPanX = this.panX;
        const startPanY = this.panY;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const eased = 1 - Math.pow(1 - progress, 3);

            this.zoomScale = startScale + (toScale - startScale) * eased;
            this.panX = startPanX + (targetPanX - startPanX) * eased;
            this.panY = startPanY + (targetPanY - startPanY) * eased;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.zoomScale = toScale;
                this.panX = targetPanX;
                this.panY = targetPanY;

                this.isAnimatingZoom = false; // ← ปิด flag

                if (onComplete) {
                    onComplete();
                }
            }
        };

        requestAnimationFrame(animate);
    }

    startInertialScrolling() {
        if (!this.isZoomed) return;

        this.isInertialScrolling = true;
        this.inertiaStartTime = performance.now();

        const animate = () => {
            if (!this.isInertialScrolling) {
                this.inertiaAnimationId = null;
                return;
            }

            const currentTime = performance.now();
            const elapsed = currentTime - this.inertiaStartTime;
            
            // Deceleration factor (ความเร็วในการชะลอตัว)
            const deceleration = 0.95;
            
            // อัปเดต velocity ด้วยการลดลงแบบ exponential
            this.panVelocityX *= deceleration;
            this.panVelocityY *= deceleration;

            // คำนวณ pan ใหม่
            let newPanX = this.panX + this.panVelocityX;
            let newPanY = this.panY + this.panVelocityY;

            // คำนวณ bounds
            const contentWidth = this.singlePageMode
                ? this.originalPageWidth
                : (this.originalPageWidth * 2);
            const contentHeight = this.originalPageHeight;
            const displayWidth = window.innerWidth;
            const displayHeight = window.innerHeight;

            const bounds = GeometryHelper.calculatePanBounds(
                contentWidth,
                contentHeight,
                displayWidth,
                displayHeight,
                this.zoomScale
            );

            const maxPanX = bounds.maxPanX;
            const maxPanY = bounds.maxPanY;

            let hitBoundary = false;

            // ตรวจสอบและจำกัด pan ภายใน bounds
            if (newPanX > maxPanX) {
                newPanX = maxPanX;
                this.panVelocityX = 0;
                hitBoundary = true;
            } else if (newPanX < -maxPanX) {
                newPanX = -maxPanX;
                this.panVelocityX = 0;
                hitBoundary = true;
            }

            if (newPanY > maxPanY) {
                newPanY = maxPanY;
                this.panVelocityY = 0;
                hitBoundary = true;
            } else if (newPanY < -maxPanY) {
                newPanY = -maxPanY;
                this.panVelocityY = 0;
                hitBoundary = true;
           }

            this.panX = newPanX;
            this.panY = newPanY;

            // หยุด animation เมื่อความเร็วต่ำมาก หรือชนขอบ
            const velocityMagnitude = Math.sqrt(
                this.panVelocityX * this.panVelocityX + 
                this.panVelocityY * this.panVelocityY
            );

            if (velocityMagnitude < 0.1 || hitBoundary) {
                this.stopInertialScrolling();
                return;
            }

            this.inertiaAnimationId = requestAnimationFrame(animate);
        };

        this.inertiaAnimationId = requestAnimationFrame(animate);
    }

    stopInertialScrolling() {
        this.isInertialScrolling = false;
        this.panVelocityX = 0;
        this.panVelocityY = 0;
        
        if (this.inertiaAnimationId) {
            cancelAnimationFrame(this.inertiaAnimationId);
            this.inertiaAnimationId = null;
        }
    }

    resetInertialScrolling() {
        this.stopInertialScrolling();
        this.lastPanTime = 0;
    }

    resetZoomState() {
        this.isResettingZoom = true;
        this.isZoomed = false;
        this.zoomScale = 1;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.isPinching = false;

        /*  Reset Rubber Band */
        this.isOverscrolling = false;
        this.overscrollX = 0;
        this.overscrollY = 0;

        this.originalPageWidth = null;
        this.originalPageHeight = null;
        this.originalCenterX = null;
        this.originalCenterY = null;
        this.zoomedCenterX = null;
        this.zoomedCenterY = null;
        this.originalCanvasWidth = null;
        this.canvas.style.cursor = 'pointer';

        this.lockedSinglePageMode = null;
        this.lockedOriginalDimensions = null;
        this.isPinchZooming = false;

        this.calculateSize();
        this.resetInertialScrolling();
        this.isResettingZoom = false;
    }

    resetZoomWithLockedDimensions() {
        this.isResettingZoom = true;
        this.isZoomed = false;
        this.zoomScale = 1;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.isPinching = false;
        this.isPinchZooming = false;

        this.isOverscrolling = false;
        this.overscrollX = 0;
        this.overscrollY = 0;

        this.originalPageWidth = null;
        this.originalPageHeight = null;
        this.originalCenterX = null;
        this.originalCenterY = null;
        this.zoomedCenterX = null;
        this.zoomedCenterY = null;
        this.originalCanvasWidth = null;

        // Clear locked state
        this.lockedSinglePageMode = null;
        this.lockedOriginalDimensions = null;

        this.canvas.style.cursor = 'pointer';

        this.calculateSize();
        this.resetInertialScrolling();
        this.isResettingZoom = false;
    }

    // helper rubber band คำนวนระยะที่ยืดตาม physics
    applyRubberBand(distance) {
        const resistance = TurnPage.CONFIG.RUBBER_BAND_RESISTANCE;
        const maxDistance = TurnPage.CONFIG.RUBBER_BAND_MAX_DISTANCE;

        // Formula: d * (1 - r) ^ (abs(d) / max)
        // ยิ่งยืดมาก ยิ่งแข็งขึ้น (non-linear)
        const sign = distance > 0 ? 1 : -1;
        const absDistance = Math.abs(distance);
        const damping = Math.pow(1 - resistance, absDistance / maxDistance);

        return sign * absDistance * damping;
    }

    // helper rubber band ดีดกลับไปขอบเมื่อปล่อยมือ
    snapBackToEdge() {
        if (!this.isOverscrolling) return;

        const contentWidth = this.singlePageMode
            ? this.originalPageWidth
            : (this.originalPageWidth * 2);
        const contentHeight = this.originalPageHeight;
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;

        const bounds = GeometryHelper.calculatePanBounds(
            contentWidth,
            contentHeight,
            displayWidth,
            displayHeight,
            this.zoomScale
        );

        const targetPanX = GeometryHelper.clamp(this.panX, -bounds.maxPanX, bounds.maxPanX);
        const targetPanY = GeometryHelper.clamp(this.panY, -bounds.maxPanY, bounds.maxPanY);

        const startPanX = this.panX;
        const startPanY = this.panY;
        const duration = TurnPage.CONFIG.RUBBER_BAND_SNAP_DURATION;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic (เร็วแล้วช้าลง เหมือน spring)
            const eased = 1 - Math.pow(1 - progress, 3);

            this.panX = startPanX + (targetPanX - startPanX) * eased;
            this.panY = startPanY + (targetPanY - startPanY) * eased;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isOverscrolling = false;
                this.overscrollX = 0;
                this.overscrollY = 0;
            }
        };

        requestAnimationFrame(animate);
    }

    // helper zoom rubber band 
    snapZoomToScale(targetScale) {
        if (!this.isZoomed) return;

        // ถ้ากำลัง animate อยู่แล้ว → ออกเลย
        if (this.isAnimatingZoom) return;

        this.isAnimatingZoom = true; // ← ตั้ง flag

        const startScale = this.zoomScale;
        const startPanX = this.panX;
        const startPanY = this.panY;

        const duration = TurnPage.CONFIG.RUBBER_BAND_SNAP_DURATION;
        const startTime = performance.now();

        const contentWidth = this.singlePageMode
            ? this.originalPageWidth
            : (this.originalPageWidth * 2);
        const contentHeight = this.originalPageHeight;
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;

        // คำนวณ target pan ที่ถูกต้องตาม targetScale
        const targetBounds = GeometryHelper.calculatePanBounds(
            contentWidth,
            contentHeight,
            displayWidth,
            displayHeight,
            targetScale
        );

        const targetPanX = GeometryHelper.clamp(startPanX, -targetBounds.maxPanX, targetBounds.maxPanX);
        const targetPanY = GeometryHelper.clamp(startPanY, -targetBounds.maxPanY, targetBounds.maxPanY);

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);

            // Interpolate ทั้ง scale และ pan
            this.zoomScale = startScale + (targetScale - startScale) * eased;
            this.panX = startPanX + (targetPanX - startPanX) * eased;
            this.panY = startPanY + (targetPanY - startPanY) * eased;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.zoomScale = targetScale;
                this.panX = targetPanX;
                this.panY = targetPanY;
                this.isZoomRubberBanding = false;
                this.isAnimatingZoom = false; // ← ปิด flag
            }
        };

        requestAnimationFrame(animate);
    }

    /* ===== LINK HANDLING ===== */
    getLinkAtPosition(x, y) {

        let adjustedX = x;
        let adjustedY = y;

        if (this.isZoomed) {
            // คำนวณตำแหน่งย้อนกลับจาก zoom transform
            const displayWidth = this.canvas.width / (window.devicePixelRatio || 1);
            const displayHeight = this.canvas.height / (window.devicePixelRatio || 1);

            const centerX = this.zoomedCenterX || displayWidth / 2;
            const centerY = this.zoomedCenterY || displayHeight / 2;

            // ลบ pan offset
            const xAfterPan = x - centerX - this.panX;
            const yAfterPan = y - centerY - this.panY;

            // หารด้วย zoom scale
            const xAfterZoom = xAfterPan / this.zoomScale;
            const yAfterZoom = yAfterPan / this.zoomScale;

            // บวก offset กลับมา
            const contentWidth = this.singlePageMode
                ? this.originalPageWidth
                : (this.originalPageWidth * 2);
            adjustedX = xAfterZoom + contentWidth / 2;
            adjustedY = yAfterZoom + this.originalPageHeight / 2;
        }

        const cx = this.centerX;
        const topY = this.centerY - this.pageHeight / 2;

        if (this.singlePageMode) {
            const pageX = cx - this.pageWidth / 2;
            return this.checkLinkInPage(this.currentPage, adjustedX, adjustedY, pageX, topY);
        } else {
            if (this.currentPage === 0) {
                const rightPageX = cx;
                return this.checkLinkInPage(0, adjustedX, adjustedY, rightPageX, topY);
            }

            const leftPageX = cx - this.pageWidth;
            const rightPageX = cx;

            const leftLink = this.checkLinkInPage(this.currentPage, adjustedX, adjustedY, leftPageX, topY);
            if (leftLink) return leftLink;

            const rightLink = this.checkLinkInPage(this.currentPage + 1, adjustedX, adjustedY, rightPageX, topY);
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
            this.flipProgress += TurnPage.CONFIG.FLIP_SPEED;
            if (this.flipProgress >= 1) {
                this.flipProgress = 1;
                this.currentPage = this.flipTarget;
                this.isFlipping = false;
                this.flipDirection = 0;
                this.updatePageInfo();
                this.cleanupUnusedPages();
                this.startLinkFadeTimer();


                setTimeout(() => {
                    if (this.jsonData && this.highResImages.length > 0) {
                        this.loadHighResForCurrentPageFromJSON();
                    } else {
                        this.loadHighResForCurrentPage();
                    }

                }, TurnPage.CONFIG.HIGH_RES_INITIAL_DELAY_MS);
            }
        }

        this.ctx.save();

        // ถ้า zoom out เสร็จแล้ว (isZoomed = false) แต่ canvas ยังเต็มจอ
        if (!this.isZoomed && !this.isZoomingOut && !this.isPinching && !this.isPinchZooming &&
            this.originalPageWidth !== null) {

            this.calculateSize();

            this.originalPageWidth = null;
            this.originalPageHeight = null;
            this.originalCenterX = null;
            this.originalCenterY = null;
            this.zoomedCenterX = null;
            this.zoomedCenterY = null;
        }

        if (this.isZoomed || this.isZoomingOut) {
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

        /* DEBUG: แสดงพื้นที่และตัวเลข */
        // if (this.isPinching && this.lockedOriginalDimensions) {
        //     this.ctx.save();
        //     this.ctx.resetTransform();

        //     const locked = this.lockedOriginalDimensions;
        //     const cw = this.lockedSinglePageMode ? locked.pageWidth : (locked.pageWidth * 2);
        //     const offsetX = this.pinchCenter.x - this.originalCenterX;
        //     const normalizedX = offsetX / cw;

        //     // พื้นหลังดำ
        //     this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        //     this.ctx.fillRect(5, 5, 400, 280);

        //     // ข้อความ
        //     this.ctx.fillStyle = 'white';
        //     this.ctx.font = '16px monospace';

        //     let y = 30;
        //     this.ctx.fillText(`Mode: ${this.lockedSinglePageMode ? 'SINGLE' : 'DOUBLE'}`, 15, y); y += 25;
        //     this.ctx.fillText(`---`, 15, y); y += 25;

        //     // เช็คค่า null/undefined
        //     this.ctx.fillStyle = this.originalCenterX === null ? 'red' : 'lime';
        //     this.ctx.fillText(`originalCenterX: ${this.originalCenterX}`, 15, y); y += 25;

        //     this.ctx.fillStyle = this.originalCenterY === null ? 'red' : 'lime';
        //     this.ctx.fillText(`originalCenterY: ${this.originalCenterY}`, 15, y); y += 25;

        //     this.ctx.fillStyle = 'white';
        //     this.ctx.fillText(`pinchCenter.x: ${this.pinchCenter.x.toFixed(0)}`, 15, y); y += 25;
        //     this.ctx.fillText(`pinchCenter.y: ${this.pinchCenter.y.toFixed(0)}`, 15, y); y += 25;
        //     this.ctx.fillText(`---`, 15, y); y += 25;

        //     this.ctx.fillText(`locked.pageWidth: ${locked.pageWidth.toFixed(0)}`, 15, y); y += 25;
        //     this.ctx.fillText(`contentWidth: ${cw.toFixed(0)}`, 15, y); y += 25;

        //     // เช็คค่าติดลบ
        //     this.ctx.fillStyle = offsetX < 0 ? 'yellow' : 'cyan';
        //     this.ctx.fillText(`offsetX: ${offsetX.toFixed(0)}`, 15, y); y += 25;

        //     this.ctx.fillStyle = normalizedX < -0.5 || normalizedX > 0.5 ? 'red' : 'lime';
        //     this.ctx.fillText(`normalizedX: ${normalizedX.toFixed(3)}`, 15, y);

        //     this.ctx.restore();
        // }
        /* END DEBUG */

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
                if (this.startWithCover) {
                    // แบบมี blank page (cover mode)
                    if (this.currentPage === 0) {
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
                        // หน้าขวา
                        if (rightIdx < this.totalPages && this.pages[rightIdx]) {
                            this.drawPage(cx, topY, this.pages[rightIdx]);
                            this.drawLinks(rightIdx, cx, topY);
                        } else if (rightIdx >= this.totalPages) {
                            this.drawBlankPage(cx, topY);
                        }
                    }
                } else {
                    // แบบไม่มี blank page (normal mode)
                    // หน้าซ้าย
                    if (leftIdx < this.totalPages && this.pages[leftIdx]) {
                        this.drawPage(cx - this.pageWidth, topY, this.pages[leftIdx]);
                        this.drawLinks(leftIdx, cx - this.pageWidth, topY);
                    }
                    // หน้าขวา
                    if (rightIdx < this.totalPages && this.pages[rightIdx]) {
                        this.drawPage(cx, topY, this.pages[rightIdx]);
                        this.drawLinks(rightIdx, cx, topY);
                    } else {
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
                    if (this.startWithCover) {
                        // แบบมี blank page (cover mode)
                        if (this.currentPage === 0) {
                            this.drawBlankPage(cx - this.pageWidth, topY);
                            if (this.pages[2]) {
                                this.drawPage(cx, topY, this.pages[2]);
                            }
                            this.ctx.save();
                            this.ctx.translate(cx, 0);
                            if (scaleX > 0) {
                                this.ctx.scale(scaleX, 1);
                                if (this.pages[0]) {
                                    this.drawPage(0, topY, this.pages[0]);
                                }
                            } else {
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
                        // แบบไม่มี blank page
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
                    if (this.startWithCover) {
                        // แบบมี blank page (cover mode)
                        if (this.flipTarget === 0) {
                            this.drawBlankPage(cx - this.pageWidth, topY);
                            if (this.pages[2]) {
                                this.drawPage(cx, topY, this.pages[2]);
                            }
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
                    } else {
                        // แบบไม่มี blank page
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

        for (const link of this.pageLinks[pageIndex]) {
            if (!link.transformedRect) continue;

            const [x1, y1, x2, y2] = link.transformedRect;
            const linkLeft = pageX + offsetX + x1;
            const linkTop = pageY + offsetY + y1;
            const linkWidth = x2 - x1;
            const linkHeight = y2 - y1;

            // เช็คว่า mouse hover อยู่หรือไม่
            const isHovered = this.hoveredLink &&
                this.hoveredLink.pageIndex === pageIndex &&
                this.hoveredLink.rect[0] === x1 &&
                this.hoveredLink.rect[1] === y1 &&
                this.hoveredLink.rect[2] === x2 &&
                this.hoveredLink.rect[3] === y2;

            const opacity = this.hoveredLink === null
                ? this.linkOpacity
                : (isHovered ? 1 : this.linkOpacity);


            if (opacity > 0) {
                this.ctx.fillStyle = `rgba(0, 100, 255, ${0.2 * opacity})`;
                this.ctx.strokeStyle = `rgba(0, 100, 255, ${0.5 * opacity})`;
                this.ctx.lineWidth = 1;

                this.ctx.fillRect(linkLeft, linkTop, linkWidth, linkHeight);
                this.ctx.strokeRect(linkLeft, linkTop, linkWidth, linkHeight);
            }
        }
    }

    startLinkFadeTimer() {
        // ยกเลิก timer เดิม
        if (this.linkFadeTimer) {
            clearTimeout(this.linkFadeTimer);
        }

        // Reset opacity เป็น 1 (แสดงเต็มที่)
        this.linkOpacity = 1;

        // ตั้ง timer ใหม่
        this.linkFadeTimer = setTimeout(() => {
            this.fadeLinkOut();
        }, TurnPage.CONFIG.LINK_FADE_DURATION);
    }

    fadeLinkIn() {
        if (this.linkOpacity < 1 && this.hoveredLink) {
            this.linkOpacity += TurnPage.CONFIG.LINK_FADE_IN_SPEED;
            this.linkOpacity = Math.min(1, this.linkOpacity);

            if (this.linkOpacity < 1) {
                requestAnimationFrame(() => this.fadeLinkIn());
            }
        }
    }

    fadeLinkOut() {
        if (this.linkOpacity > 0 && !this.hoveredLink) {
            this.linkOpacity -= TurnPage.CONFIG.LINK_FADE_OUT_SPEED;
            this.linkOpacity = Math.max(0, this.linkOpacity);

            if (this.linkOpacity > 0) {
                requestAnimationFrame(() => this.fadeLinkOut());
            }
        }
    }

    checkLinkHover(x, y) {
        const cx = this.centerX;
        const topY = this.centerY - this.pageHeight / 2;

        let foundLink = null;

        if (this.singlePageMode) {
            const pageX = cx - this.pageWidth / 2;
            foundLink = this.checkLinkInPageForHover(this.currentPage, x, y, pageX, topY);
        } else {
            if (this.currentPage === 0) {
                const rightPageX = cx;
                foundLink = this.checkLinkInPageForHover(0, x, y, rightPageX, topY);
            } else {
                const leftPageX = cx - this.pageWidth;
                const rightPageX = cx;

                foundLink = this.checkLinkInPageForHover(this.currentPage, x, y, leftPageX, topY);
                if (!foundLink) {
                    foundLink = this.checkLinkInPageForHover(this.currentPage + 1, x, y, rightPageX, topY);

                }
            }
        }

        // Update hover state
        const wasHovered = this.hoveredLink !== null;
        this.hoveredLink = foundLink;
        const isHovered = this.hoveredLink !== null;

        // เปลี่ยน cursor
        this.canvas.style.cursor = isHovered ? 'pointer' : (this.isZoomed ? 'grab' : 'default');

        // ถ้าเริ่ม hover → fade IN แบบไว
        if (!wasHovered && isHovered) {
            // เริ่ม hover - fade out link ที่ไม่ได้ hover
            if (this.linkFadeTimer) {
                clearTimeout(this.linkFadeTimer);
            }
            this.fadeLinkOut();
        }
        // ถ้าหยุด hover → เริ่ม timer fade OUT ใหม่
        else if (wasHovered && !isHovered) {
            // หยุด hover - ตั้ง timer ให้ fade out หลังจาก delay
            if (this.linkFadeTimer) {
                clearTimeout(this.linkFadeTimer);
            }
            this.linkFadeTimer = setTimeout(() => {
                this.fadeLinkOut();
            }, TurnPage.CONFIG.LINK_FADE_DURATION);
        }
    }

    checkLinkInPageForHover(pageIndex, clickX, clickY, pageX, pageY) {
        if (!this.pageLinks || !this.pageLinks[pageIndex]) return null;

        const vp = this.pageViewports[pageIndex];
        if (!vp) return null;

        const offsetX = (this.pageWidth - vp.width) / 2;
        const offsetY = (this.pageHeight - vp.height) / 2;

        for (const link of this.pageLinks[pageIndex]) {
            if (!link.transformedRect) continue;

            const [x1, y1, x2, y2] = link.transformedRect;
            const linkLeft = pageX + offsetX + x1;
            const linkRight = pageX + offsetX + x2;
            const linkTop = pageY + offsetY + y1;
            const linkBottom = pageY + offsetY + y2;

            if (clickX >= linkLeft && clickX <= linkRight &&
                clickY >= linkTop && clickY <= linkBottom) {
                return {
                    pageIndex: pageIndex,
                    link: link,
                    rect: [x1, y1, x2, y2]
                };
            }
        }

        return null;
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}