

export class ObjectManager {
    constructor() {
        // Flat arrays for performance
        this.ids = [];
        this.types = [];          // 'rectangle', 'circle'
        this.mapTypes = [];       // 'wall', 'corridor', 'room', 'waypoint', null
        this.x = [];
        this.y = [];
        this.width = [];
        this.height = [];
        this.colors = [];
        this.selected = [];
        this.walkable = [];
        this.labels = [];
        this.nextId = 0;
        
        // ID to Index mapping for efficient lookups
        this.idToIndex = new Map();
    }

    createObject(type, x, y, width, height, color = '#3498db', mapType = null) {
        const index = this.ids.length;
        const id = this.nextId++;
        
        this.ids[index] = id;
        this.types[index] = type;
        this.mapTypes[index] = mapType;
        this.x[index] = x;
        this.y[index] = y;
        this.width[index] = width;
        this.height[index] = height;
        this.colors[index] = color;
        this.selected[index] = false;
        this.walkable[index] = mapType !== 'wall';
        this.labels[index] = '';
        
        // Update ID mapping
        this.idToIndex.set(id, index);

        return { id, index };
    }

    removeObject(index) {
        const id = this.ids[index];
        
        // Remove from arrays
        this.ids.splice(index, 1);
        this.types.splice(index, 1);
        this.mapTypes.splice(index, 1);
        this.x.splice(index, 1);
        this.y.splice(index, 1);
        this.width.splice(index, 1);
        this.height.splice(index, 1);
        this.colors.splice(index, 1);
        this.selected.splice(index, 1);
        this.walkable.splice(index, 1);
        this.labels.splice(index, 1);
        
        // Update ID mappings - remove deleted ID and update shifted indices
        this.idToIndex.delete(id);
        for (let i = index; i < this.ids.length; i++) {
            this.idToIndex.set(this.ids[i], i);
        }
    }

    updateObject(index, props) {
        if (props.x !== undefined) this.x[index] = props.x;
        if (props.y !== undefined) this.y[index] = props.y;
        if (props.width !== undefined) this.width[index] = props.width;
        if (props.height !== undefined) this.height[index] = props.height;
        if (props.color !== undefined) this.colors[index] = props.color;
        if (props.selected !== undefined) this.selected[index] = props.selected;
    }

    getBounds(index) {
        return {
            x: this.x[index],
            y: this.y[index],
            width: this.width[index],
            height: this.height[index]
        };
    }

    setBounds(index, bounds) {
        this.x[index] = bounds.x;
        this.y[index] = bounds.y;
        this.width[index] = bounds.width;
        this.height[index] = bounds.height;
    }

    contains(index, px, py) {
        if (this.mapTypes[index] === 'waypoint') {
            const centerX = this.x[index] + this.width[index] / 2;
            const centerY = this.y[index] + this.height[index] / 2;
            // ใช้รัศมีจากขนาดจริงของ object (ไม่พึ่ง import ภายนอก)
            const radius = Math.min(this.width[index], this.height[index]) / 2;
            const distance = Math.sqrt((px - centerX) ** 2 + (py - centerY) ** 2);
            return distance <= radius;
        }
        
        return px >= this.x[index] && px <= this.x[index] + this.width[index] &&
            py >= this.y[index] && py <= this.y[index] + this.height[index];
    }

    selectObject(index) {
        // Clear all selections
        for (let i = 0; i < this.selected.length; i++) {
            this.selected[i] = false;
        }
        
        // Select target
        if (index !== -1) {
            this.selected[index] = true;
        }
    }

    getSelected() {
        return this.selected.findIndex(sel => sel);
    }
    
    getIndexById(id) {
        return this.idToIndex.get(id);
    }

    getIdByIndex(index) {
        return this.ids[index];
    }

    getObjectCount() {
        return this.ids.length;
    }

    canResize(index) {
        return this.mapTypes[index] !== 'waypoint';
    }
}