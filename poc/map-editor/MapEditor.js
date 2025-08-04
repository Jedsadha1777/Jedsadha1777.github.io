import { CanvasEngine } from '../core/CanvasEngine.js';
import { ObjectManager } from '../core/ObjectManager.js';
import { SpatialGrid } from '../core/SpatialGrid.js';
import { DirtyRectManager } from '../core/DirtyRectManager.js';

export class MapEditor extends CanvasEngine {
    constructor(canvas) {
        super(canvas, { gridSize: 20, snapEnabled: true });
        
        this.objects = new ObjectManager();
        this.spatialGrid = new SpatialGrid(100);
        this.dirtyManager = new DirtyRectManager();
        this.currentTool = 'select';
        
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

    handleMouseDown(e, pos) {
        if (this.currentTool === 'select') {
            const clickedIndex = this.getObjectAt(pos.x, pos.y);
            const selectedIndex = this.objects.getSelected();
            
            if (clickedIndex !== -1) {
                if (selectedIndex === clickedIndex && this.objects.canResize(clickedIndex)) {
                    const bounds = this.objects.getBounds(clickedIndex);
                    const handle = this.getHandleAtPoint(bounds, pos.x, pos.y);
                    
                    if (handle) {
                        this.isResizing = true;
                        this.resizeHandle = handle.name;  // ใช้ handle.name
                        this.resizeStartBounds = { ...bounds };
                        return;
                    }
                }
                
                this.objects.selectObject(clickedIndex);
                this.isDragging = true;
                this.dragOffsetX = pos.x - this.objects.x[clickedIndex];
                this.dragOffsetY = pos.y - this.objects.y[clickedIndex];
            } else {
                this.objects.selectObject(-1);
            }
            
        } else if (this.isDrawingTool(this.currentTool)) {
            this.isDrawing = true;
            
        } else if (this.currentTool === 'pan') {
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        }
        
        this.render();
    }

    handleMouseMove(e, pos) {
        if (!this.isResizing && !this.isDragging && !this.isDrawing && !this.isPanning) {
            this.updateCursor(pos);
        }
        
        if (this.isResizing) {
            // existing resize code...
            const selectedIndex = this.objects.getSelected();
            if (selectedIndex !== -1) {
                const newBounds = this.calculateResize(this.resizeHandle, this.resizeStartBounds, pos);
                
                this.addDirtyRect(this.objects.getBounds(selectedIndex));
                this.spatialGrid.removeObject(selectedIndex, 
                    this.objects.x[selectedIndex], this.objects.y[selectedIndex],
                    this.objects.width[selectedIndex], this.objects.height[selectedIndex]);
                
                this.objects.setBounds(selectedIndex, newBounds);
                
                this.spatialGrid.addObject(selectedIndex, newBounds.x, newBounds.y, newBounds.width, newBounds.height);
                this.addDirtyRect(newBounds);
                
                this.optimizedRender();
            }
            
        } else if (this.isDragging) {
            const selectedIndex = this.objects.getSelected();
            if (selectedIndex !== -1) {
                this.addDirtyRect(this.objects.getBounds(selectedIndex));
                
                this.spatialGrid.removeObject(selectedIndex,
                    this.objects.x[selectedIndex], this.objects.y[selectedIndex],
                    this.objects.width[selectedIndex], this.objects.height[selectedIndex]);
                
                const newX = pos.x - this.dragOffsetX;
                const newY = pos.y - this.dragOffsetY;
                const snappedPos = this.snapPosition(newX, newY);
                
                this.objects.updateObject(selectedIndex, {
                    x: snappedPos.x,
                    y: snappedPos.y
                });
                
                this.spatialGrid.addObject(selectedIndex, snappedPos.x, snappedPos.y,
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

    updateCursor(pos) {
        const selectedIndex = this.objects.getSelected();
        
        if (selectedIndex !== -1 && this.objects.canResize(selectedIndex)) {
            const bounds = this.objects.getBounds(selectedIndex);
            const handle = this.getHandleAtPoint(bounds, pos.x, pos.y);
            
            if (handle) {
                this.canvas.style.cursor = handle.cursor;
                return;
            }
            
            // เช็คว่าอยู่ใน object หรือไม่
            if (this.objects.contains(selectedIndex, pos.x, pos.y)) {
                this.canvas.style.cursor = 'move';
                return;
            }
        }
        
        // เช็ค object อื่นๆ
        const hoveredIndex = this.getObjectAt(pos.x, pos.y);
        if (hoveredIndex !== -1) {
            this.canvas.style.cursor = 'pointer';
        } else {
            // Default cursor based on tool
            if (this.currentTool === 'select') {
                this.canvas.style.cursor = 'default';
            } else if (this.currentTool === 'pan') {
                this.canvas.style.cursor = 'grab';
            } else {
                this.canvas.style.cursor = 'crosshair';
            }
        }
    }


    handleMouseUp(e, pos) {
        if (this.isDrawing) {
            if (this.currentTool === 'waypoint') {
                // Single click waypoint
                const snapped = this.snapPosition(pos.x, pos.y);
                const { index } = this.objects.createObject('circle', snapped.x - 8, snapped.y - 8, 16, 16, '#e74c3c', 'waypoint');
                this.spatialGrid.addObject(index, snapped.x - 8, snapped.y - 8, 16, 16);
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
                    const { index } = this.objects.createObject(shapeType, x, y, w, h, color, mapType);
                    this.spatialGrid.addObject(index, x, y, w, h);
                    this.objects.selectObject(index);
                }
            }
            this.updateInfo();
        }
    }

    isDrawingTool(tool) {
        return ['rectangle', 'circle', 'wall', 'corridor', 'room', 'waypoint'].includes(tool);
    }

    getToolProperties(tool) {
        const MAP_TOOL_CONFIG = {
            'rectangle': { shapeType: 'rectangle', color: '#3498db', mapType: null },
            'circle': { shapeType: 'circle', color: '#3498db', mapType: null },
            'wall': { shapeType: 'rectangle', color: '#2c3e50', mapType: 'wall' },
            'corridor': { shapeType: 'rectangle', color: '#f39c12', mapType: 'corridor' },
            'room': { shapeType: 'rectangle', color: '#3498db', mapType: 'room' },
            'waypoint': { shapeType: 'circle', color: '#e74c3c', mapType: 'waypoint' }
        };
        
        return MAP_TOOL_CONFIG[tool] || { shapeType: 'rectangle', color: '#3498db', mapType: null };
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
        if (mapType === 'wall') {
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.strokeStyle = '#34495e';
            this.ctx.lineWidth = 2 / this.zoom;
        } else if (mapType === 'corridor') {
            this.ctx.fillStyle = 'rgba(243, 156, 18, 0.7)';
            this.ctx.strokeStyle = '#d68910';
            this.ctx.lineWidth = 1 / this.zoom;
        } else if (mapType === 'room') {
            this.ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
            this.ctx.strokeStyle = '#2980b9';
            this.ctx.lineWidth = 1 / this.zoom;
        } else if (mapType === 'waypoint') {
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.strokeStyle = '#c0392b';
            this.ctx.lineWidth = 2 / this.zoom;
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
                this.ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
            } else {
                const radius = Math.min(this.objects.width[index], this.objects.height[index])/2;
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            }
            
            this.ctx.fill();
            this.ctx.stroke();
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
               this.ctx.arc(x + width/2, y + height/2, 8, 0, Math.PI * 2);
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
       const padding = 10;
       const screenX = (bounds.x * this.zoom) + this.panX - padding;
       const screenY = (bounds.y * this.zoom) + this.panY - padding;
       const screenWidth = (bounds.width * this.zoom) + (padding * 2);
       const screenHeight = (bounds.height * this.zoom) + (padding * 2);
       
       this.dirtyManager.addDirtyRect(screenX, screenY, screenWidth, screenHeight);
   }

   optimizedRender() {
       const startTime = performance.now();
       const dirtyRects = this.dirtyManager.getDirtyRects();
       
       if (dirtyRects.length === 0) return;

       dirtyRects.forEach(rect => {
           this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
           
           this.ctx.save();
           this.ctx.beginPath();
           this.ctx.rect(rect.x, rect.y, rect.width, rect.height);
           this.ctx.clip();

           this.ctx.scale(this.zoom, this.zoom);
           this.ctx.translate(this.panX / this.zoom, this.panY / this.zoom);

           this.drawGrid();
           this.drawContent();

           this.ctx.restore();
       });

       this.dirtyManager.clear();
       
       const renderTime = performance.now() - startTime;
       document.getElementById('renderTime').textContent = renderTime.toFixed(1) + 'ms';
       document.getElementById('dirtyRects').textContent = dirtyRects.length;
   }

   getObjectAt(x, y) {
       for (let i = this.objects.getObjectCount() - 1; i >= 0; i--) {
           if (this.objects.contains(i, x, y)) {
               return i;
           }
       }
       return -1;
   }

   deleteObject(index) {
       this.addDirtyRect(this.objects.getBounds(index));
       
       this.spatialGrid.removeObject(index, 
           this.objects.x[index], this.objects.y[index], 
           this.objects.width[index], this.objects.height[index]);
       
       this.objects.removeObject(index);
       this.rebuildSpatialGrid();
       
       this.updateInfo();
       this.optimizedRender();
   }

   rebuildSpatialGrid() {
       this.spatialGrid = new SpatialGrid(100);
       for (let i = 0; i < this.objects.getObjectCount(); i++) {
           this.spatialGrid.addObject(i, this.objects.x[i], this.objects.y[i], 
                                     this.objects.width[i], this.objects.height[i]);
       }
   }

   updateInfo() {
       document.getElementById('objectCount').textContent = this.objects.getObjectCount();
       document.getElementById('zoomLevel').textContent = Math.round(this.zoom * 100) + '%';
       document.getElementById('gridCells').textContent = this.spatialGrid.getCellCount();
       document.getElementById('snapStatus').textContent = this.snapEnabled ? 'ON' : 'OFF';
   }
}