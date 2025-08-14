import { CanvasEngine } from '../core/CanvasEngine.js';
import { ObjectManager } from '../core/ObjectManager.js';
import { SpatialGrid } from '../core/SpatialGrid.js';
import { DirtyRectManager } from '../core/DirtyRectManager.js';
import { MAP_OBJECT_STYLES } from './MapObjects.js';

export class MapEditor extends CanvasEngine {
    constructor(canvas) {
        super(canvas, { gridSize: 20, snapEnabled: true });
        
        this.objects = new ObjectManager();
        this.spatialGrid = new SpatialGrid(100);
        this.dirtyManager = new DirtyRectManager();
        this.currentTool = 'select';
        
        // cursor state tracking
        this.currentCursor = 'default';
        
        this.setupMapEventListeners();
        this.setupUI();
        this.init();
        this.updateInfo();
    }

    setupMapEventListeners() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.tool-btn.active').classList.remove('active');
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
                
                // reset cursor เมื่อเปลี่ยน tool
                if (this.currentTool === 'pan') {
                    this.updateCursor('grab');
                } else {
                    this.updateCursor('default');
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete') {
                const selectedIndex = this.objects.getSelected();
                if (selectedIndex !== -1) {
                    this.deleteObject(selectedIndex);
                }
            }
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const pos = this.screenToCanvas(e.clientX, e.clientY);
            const clickedIndex = this.getObjectAt(pos.x, pos.y);
            if (clickedIndex !== -1) {
                this.deleteObject(clickedIndex);
            }
        });
    }

    setupUI() {
        this.onSnapToggle = () => this.updateInfo();
        this.onZoomChange = () => this.updateInfo();
    }

    updateCursor(cursor) {
        if (this.currentCursor !== cursor) {
            this.currentCursor = cursor;
            this.canvas.style.cursor = cursor;
        }
    }

    getCursorForHandle(handle) {
        const cursorMap = {
            'nw': 'nwse-resize',
            'ne': 'nesw-resize', 
            'sw': 'nesw-resize',
            'se': 'nwse-resize',
            'n': 'ns-resize',
            's': 'ns-resize',
            'e': 'ew-resize',
            'w': 'ew-resize'
        };
        return cursorMap[handle] || 'default';
    }

    handleMouseDown(e, pos) {
        if (this.currentTool === 'select') {
            const selectedIndex = this.objects.getSelected();

            // 1) ถ้ามี selection อยู่ ให้ลองจับ "handle" ก่อน
            if (selectedIndex !== -1 && this.objects.canResize(selectedIndex)) {
                const bounds = this.objects.getBounds(selectedIndex);
                const handle = this.getHandleAtPoint(bounds, pos.x, pos.y);
                if (handle) {
                    this.isResizing = true;
                    this.resizeHandle = handle;
                    this.resizeStartBounds = { ...bounds };
                    this.updateCursor(this.getCursorForHandle(handle));
                    this.render();
                    return;
                }
            }

            // 2) ไม่โดน handle → เช็คโดน object เพื่อ select/drag
            const clickedIndex = this.getObjectAt(pos.x, pos.y);
            if (clickedIndex !== -1) {
                this.objects.selectObject(clickedIndex);
                this.isDragging = true;
                this.dragOffsetX = pos.x - this.objects.x[clickedIndex];
                this.dragOffsetY = pos.y - this.objects.y[clickedIndex];
                this.updateCursor('move');
                this.render();
                return;
            }

            // 3) คลิกพื้นที่ว่าง → เคลียร์ selection
            this.objects.selectObject(-1);
            this.updateCursor('default');
            this.render();
            return;

        } else if (this.isDrawingTool(this.currentTool)) {
            this.isDrawing = true;
            
        } else if (this.currentTool === 'pan') {
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.updateCursor('grabbing');
        }
        
        this.render();
    }

    handleMouseMove(e, pos) {
        // update cursor 
        if (this.isDrawingTool(this.currentTool) && this.currentTool !== 'select') {
            this.updateCursor('crosshair');
        }
        
        
        if (this.currentTool === 'select' && !this.isDragging && !this.isResizing && !this.isPanning && !this.isDrawing) {
            const selectedIndex = this.objects.getSelected();
            let newCursor = 'default';

            // เช็ค resize handles ก่อนถ้ามี object
            if (selectedIndex !== -1 && this.objects.canResize(selectedIndex)) {
                const bounds = this.objects.getBounds(selectedIndex);
                const handle = this.getHandleAtPoint(bounds, pos.x, pos.y);
                if (handle) {
                    newCursor = this.getCursorForHandle(handle);
                } else {
                    // อยู่บน selected object
                    if (this.objects.contains(selectedIndex, pos.x, pos.y)) {
                        newCursor = 'move';
                    }
                }
            } else {
                // ไม่สามารถ resize ได้
                const hoveredIndex = this.getObjectAt(pos.x, pos.y);
                if (hoveredIndex !== -1) {
                    newCursor = 'move';
                }
            }

            this.updateCursor(newCursor);
        }

        // Pan tool cursor
        if (this.currentTool === 'pan' && !this.isPanning) {
            this.updateCursor('grab');
        }

        if (this.isResizing) {
            const selectedIndex = this.objects.getSelected();
            if (selectedIndex !== -1) {
                const id = this.objects.getIdByIndex(selectedIndex);
                const newBounds = this.calculateResize(this.resizeHandle, this.resizeStartBounds, pos);
                
                this.addDirtyRect(this.objects.getBounds(selectedIndex));
                this.spatialGrid.removeObject(id, 
                    this.objects.x[selectedIndex], this.objects.y[selectedIndex],
                    this.objects.width[selectedIndex], this.objects.height[selectedIndex]);
                
                this.objects.setBounds(selectedIndex, newBounds);
                
                this.spatialGrid.addObject(id, newBounds.x, newBounds.y, newBounds.width, newBounds.height);
                this.addDirtyRect(newBounds);
                
                this.optimizedRender();
            }
            
        } else if (this.isDragging) {
            const selectedIndex = this.objects.getSelected();
            if (selectedIndex !== -1) {
                const id = this.objects.getIdByIndex(selectedIndex);
                this.addDirtyRect(this.objects.getBounds(selectedIndex));
                
                this.spatialGrid.removeObject(id,
                    this.objects.x[selectedIndex], this.objects.y[selectedIndex],
                    this.objects.width[selectedIndex], this.objects.height[selectedIndex]);
                
                const newX = pos.x - this.dragOffsetX;
                const newY = pos.y - this.dragOffsetY;
                const snappedPos = this.snapPosition(newX, newY);
                
                this.objects.updateObject(selectedIndex, {
                    x: snappedPos.x,
                    y: snappedPos.y
                });
                
                this.spatialGrid.addObject(id, snappedPos.x, snappedPos.y,
                    this.objects.width[selectedIndex], this.objects.height[selectedIndex]);
                
                this.addDirtyRect(this.objects.getBounds(selectedIndex));
                this.optimizedRender();
            }
            
        } else if (this.isDrawing) {
            this.render();
            if (this.currentTool !== 'waypoint') {
                this.drawPreview(this.startX, this.startY, pos.x - this.startX, pos.y - this.startY);
            }
            
        } else if (this.isPanning) {
            this.panX += e.clientX - this.lastPanX;
            this.panY += e.clientY - this.lastPanY;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.render();
        }
    }

    handleMouseUp(e, pos) {
        // รีเซ็ต cursor 
        if (this.isResizing || this.isDragging) {
            // หลังจาก resize หรือ drag 
            setTimeout(() => {
                if (this.currentTool === 'select') {
                    const selectedIndex = this.objects.getSelected();
                    if (selectedIndex !== -1 && this.objects.contains(selectedIndex, pos.x, pos.y)) {
                        this.updateCursor('move');
                    } else {
                        this.updateCursor('default');
                    }
                }
            }, 0);
        }

        if (this.isPanning) {
            this.updateCursor('grab');
        }

        if (this.isDrawing) {
            if (this.currentTool === 'waypoint') {
                // Single click waypoint
                const snapped = this.snapPosition(pos.x, pos.y);

                const r = MAP_OBJECT_STYLES.waypoint.radius;
                const color = MAP_OBJECT_STYLES.waypoint.color;
                const { id, index } = this.objects.createObject('circle', snapped.x - r, snapped.y - r, r * 2, r * 2, color, 'waypoint');
                this.spatialGrid.addObject(id, snapped.x - r, snapped.y - r, r * 2, r * 2);

                this.objects.selectObject(index);
                
            } else {
                // Drag to create
                const width = pos.x - this.startX;
                const height = pos.y - this.startY;
                
                if (Math.abs(width) > 5 && Math.abs(height) > 5) {
                    let x = Math.min(this.startX, pos.x);
                    let y = Math.min(this.startY, pos.y);
                    let w = Math.abs(width);
                    let h = Math.abs(height);

                    if (this.snapEnabled) {
                        const snappedPos = this.snapPosition(x, y);
                        const snappedEnd = this.snapPosition(x + w, y + h);
                        x = snappedPos.x;
                        y = snappedPos.y;
                        w = snappedEnd.x - x;
                        h = snappedEnd.y - y;
                    }

                    const { shapeType, color, mapType } = this.getToolProperties(this.currentTool);
                    const { id, index } = this.objects.createObject(shapeType, x, y, w, h, color, mapType);
                    this.spatialGrid.addObject(id, x, y, w, h);
                    this.objects.selectObject(index);
                }
            }
            this.updateInfo();
        }
    }

    resetAllStates() {
        super.resetAllStates();
        
        // reset cursor 
        if (this.currentTool === 'select') {
            this.updateCursor('default');
        } else if (this.currentTool === 'pan') {
            this.updateCursor('grab');
        } else {
            this.updateCursor('default');
        }
    }

    isDrawingTool(tool) {
        return ['rectangle', 'circle', 'wall', 'corridor', 'room', 'waypoint'].includes(tool);
    }

    getToolProperties(tool) {
        // default tools
        if (tool === 'rectangle') return { shapeType: 'rectangle', color: '#3498db', mapType: null };
        if (tool === 'circle')    return { shapeType: 'circle',    color: '#3498db', mapType: null };
        // map tools
        const s = MAP_OBJECT_STYLES[tool];
        if (s && (tool === 'wall' || tool === 'corridor' || tool === 'room' || tool === 'waypoint')) {
            return { shapeType: tool === 'waypoint' ? 'circle' : 'rectangle', color: s.color, mapType: tool };
        }
        return { shapeType: 'rectangle', color: '#3498db', mapType: null };
    }

    drawContent() {
        for (let i = 0; i < this.objects.getObjectCount(); i++) {
            this.drawObject(i);
        }
        
        // Draw resize handles for selected object
        const selectedIndex = this.objects.getSelected();
        if (selectedIndex !== -1 && this.objects.canResize(selectedIndex)) {
            const bounds = this.objects.getBounds(selectedIndex);
            this.drawResizeHandles(bounds);
        }
    }

    drawObject(index) {
        const mapType = this.objects.mapTypes[index];
        
        // Set style based on mapType
        if (mapType === 'wall' || mapType === 'corridor' || mapType === 'room' || mapType === 'waypoint') {
           const s = MAP_OBJECT_STYLES[mapType];
            this.ctx.save();
            this.ctx.globalAlpha = s.opacity ?? 1;
            this.ctx.fillStyle = s.color;
            this.ctx.strokeStyle = s.strokeColor;
            this.ctx.lineWidth = s.strokeWidth / this.zoom;
        } else {
            this.ctx.fillStyle = this.objects.colors[index];
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1 / this.zoom;
        }
        
        // Draw shape
        if (this.objects.types[index] === 'rectangle' || mapType === 'wall' || mapType === 'corridor' || mapType === 'room') {
            this.ctx.fillRect(this.objects.x[index], this.objects.y[index], 
                            this.objects.width[index], this.objects.height[index]);
            this.ctx.strokeRect(this.objects.x[index], this.objects.y[index], 
                              this.objects.width[index], this.objects.height[index]);
        } else if (this.objects.types[index] === 'circle' || mapType === 'waypoint') {
            this.ctx.beginPath();
            const centerX = this.objects.x[index] + this.objects.width[index]/2;
            const centerY = this.objects.y[index] + this.objects.height[index]/2;
            
             if (mapType === 'waypoint') {
                this.ctx.arc(centerX, centerY, MAP_OBJECT_STYLES.waypoint.radius, 0, Math.PI * 2);
            } else {
                const radius = Math.min(this.objects.width[index], this.objects.height[index])/2;
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            }
            
            this.ctx.fill();
            this.ctx.stroke();
        }

        if (mapType === 'wall' || mapType === 'corridor' || mapType === 'room' || mapType === 'waypoint') {
            this.ctx.restore();
        }

        // Selection outline
        if (this.objects.selected[index]) {
            this.ctx.strokeStyle = '#0066cc';
            this.ctx.lineWidth = 2 / this.zoom;
            this.ctx.setLineDash([5 / this.zoom, 5 / this.zoom]);
            this.ctx.strokeRect(this.objects.x[index], this.objects.y[index], 
                              this.objects.width[index], this.objects.height[index]);
            this.ctx.setLineDash([]);
        }
    }

    drawPreview(x, y, width, height) {
        this.ctx.save();
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(this.panX / this.zoom, this.panY / this.zoom);

        const { color } = this.getToolProperties(this.currentTool);
        
        this.ctx.fillStyle = color.includes('rgba') ? color : color + '80';
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1 / this.zoom;

        if (this.currentTool === 'waypoint' || this.currentTool === 'circle') {
           this.ctx.beginPath();
           if (this.currentTool === 'waypoint') {
               this.ctx.arc(x + width/2, y + height/2, MAP_OBJECT_STYLES.waypoint.radius, 0, Math.PI * 2);
           } else {
               this.ctx.arc(x + width/2, y + height/2, Math.min(Math.abs(width), Math.abs(height))/2, 0, Math.PI * 2);
           }
           this.ctx.fill();
           this.ctx.stroke();
       } else {
           this.ctx.fillRect(x, y, width, height);
           this.ctx.strokeRect(x, y, width, height);
       }

       this.ctx.restore();
   }

    addDirtyRect(bounds) {
        const dpr = this.dpr || window.devicePixelRatio || 1;

        // world -> screen (CSS px)
        const sx_css = (bounds.x * this.zoom) + this.panX;
        const sy_css = (bounds.y * this.zoom) + this.panY;
        const sw_css = (bounds.width * this.zoom);
        const sh_css = (bounds.height * this.zoom);

        const PAD_CSS = 10;
        // แปลงเป็น device px
        const x_dp  = Math.floor(dpr * (sx_css - PAD_CSS));
        const y_dp  = Math.floor(dpr * (sy_css - PAD_CSS));
        const w_dp  = Math.ceil (dpr * (sw_css + PAD_CSS * 2));
        const h_dp  = Math.ceil (dpr * (sh_css + PAD_CSS * 2));

        this.dirtyManager.addDirtyRect(x_dp, y_dp, w_dp, h_dp);
    }

    optimizedRender() {
        const t0 = performance.now();
        const dirtyRects = this.dirtyManager.getDirtyRects();
        if (!dirtyRects.length) return;

        const PAD = Math.ceil(this.dpr);

        this.ctx.save();

        // 1) ทำงานใน screen space
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        // เคลียร์ทุก rect
        for (const r of dirtyRects) {
            this.ctx.clearRect(r.x - PAD, r.y - PAD, r.width + PAD*2, r.height + PAD*2);
        }

        // สร้าง clip รวม
        this.ctx.beginPath();
        for (const r of dirtyRects) {
            this.ctx.rect(r.x - PAD, r.y - PAD, r.width + PAD*2, r.height + PAD*2);
        }
        this.ctx.clip();

        // 2) ตั้ง world transform
        this.ctx.setTransform(
            this.dpr * this.zoom, 0, 0, this.dpr * this.zoom,
            this.dpr * this.panX, this.dpr * this.panY
        );

        // 3) วาดภายใต้ clip รวม
        this.drawGrid();
        this.drawContent();
        
        this.ctx.restore();

        // 4) ล้างสถานะ dirty
        this.dirtyManager.clear();

        // 5) อัปเดต UI
        const dt = performance.now() - t0;
        const elTime = document.getElementById('renderTime');
        const elRects = document.getElementById('dirtyRects');
        if (elTime) elTime.textContent = dt.toFixed(1) + 'ms';
        if (elRects) elRects.textContent = String(dirtyRects.length);
    }

   getObjectAt(x, y) {
       // Use spatial grid for efficient hit-testing
       const candidateIds = this.spatialGrid.getObjectsAt(x, y);
       
       if (candidateIds.size === 0) {
           return -1;
       }
       
       // Convert IDs to indices and sort by index (z-order)
       const indices = [];
       for (const id of candidateIds) {
           const index = this.objects.getIndexById(id);
           if (index !== undefined) {
               indices.push(index);
           }
       }
       
       // Sort by index descending (top objects first)
       indices.sort((a, b) => b - a);
       
       // Check from top to bottom
       for (const index of indices) {
           if (this.objects.contains(index, x, y)) {
               return index;
           }
       }
       
       return -1;
   }

   deleteObject(index) {
       const id = this.objects.getIdByIndex(index);
       
       this.addDirtyRect(this.objects.getBounds(index));
       
       // Remove from spatial grid using ID
       this.spatialGrid.removeObject(id, 
           this.objects.x[index], this.objects.y[index], 
           this.objects.width[index], this.objects.height[index]);
       
       // Remove from object manager
       this.objects.removeObject(index);
       
       this.updateInfo();
       this.optimizedRender();
   }

   updateInfo() {
       document.getElementById('objectCount').textContent = this.objects.getObjectCount();
       document.getElementById('zoomLevel').textContent = Math.round(this.zoom * 100) + '%';
       document.getElementById('gridCells').textContent = this.spatialGrid.getCellCount();
       document.getElementById('snapStatus').textContent = this.snapEnabled ? 'ON' : 'OFF';
   }
}