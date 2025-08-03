export class DirtyRectManager {
    constructor() { 
        this.dirtyRects = []; 
    }
    
    addDirtyRect(x, y, width, height) { 
        this.dirtyRects.push({ x, y, width, height }); 
    }
    
    clear() { 
        this.dirtyRects = []; 
    }
    
    getDirtyRects() { 
        return this.dirtyRects; 
    }
}