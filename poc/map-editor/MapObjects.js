export const MAP_OBJECT_TYPES = {
    WALL: 'wall',
    CORRIDOR: 'corridor', 
    ROOM: 'room',
    WAYPOINT: 'waypoint'
};

export const MAP_OBJECT_STYLES = {
    [MAP_OBJECT_TYPES.WALL]: {
        color: '#2c3e50',      // Dark gray
        strokeColor: '#34495e',
        strokeWidth: 2,
        opacity: 1.0
    },
    [MAP_OBJECT_TYPES.CORRIDOR]: {
        color: '#f39c12',      // Orange
        strokeColor: '#d68910',
        strokeWidth: 1,
        opacity: 0.7
    },
    [MAP_OBJECT_TYPES.ROOM]: {
        color: '#3498db',      // Blue
        strokeColor: '#2980b9',
        strokeWidth: 1,
        opacity: 0.5
    },
    [MAP_OBJECT_TYPES.WAYPOINT]: {
        color: '#e74c3c',      // Red
        strokeColor: '#c0392b',
        strokeWidth: 2,
        opacity: 1.0,
        radius: 8              // For circle waypoints
    }
};

export class MapObject {
    constructor(type, x, y, width, height) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.style = { ...MAP_OBJECT_STYLES[type] };
        this.selected = false;
        this.id = Math.random().toString(36).substr(2, 9);
        
        // Map-specific properties
        this.walkable = type !== MAP_OBJECT_TYPES.WALL;
        this.label = '';
    }

    draw(ctx, zoom) {
        const style = this.style;
        
        // Set opacity
        ctx.globalAlpha = style.opacity;
        
        // Fill
        ctx.fillStyle = style.color;
        
        if (this.type === MAP_OBJECT_TYPES.WAYPOINT) {
            // Draw waypoint as circle
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, style.radius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Draw as rectangle
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        // Stroke
        if (style.strokeWidth > 0) {
            ctx.strokeStyle = style.strokeColor;
            ctx.lineWidth = style.strokeWidth / zoom;
            
            if (this.type === MAP_OBJECT_TYPES.WAYPOINT) {
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, style.radius, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.strokeRect(this.x, this.y, this.width, this.height);
            }
        }
        
        // Selection outline
        if (this.selected) {
            ctx.strokeStyle = '#0066cc';
            ctx.lineWidth = 2 / zoom;
            ctx.setLineDash([5 / zoom, 5 / zoom]);
            ctx.strokeRect(this.x - 2/zoom, this.y - 2/zoom, 
                         this.width + 4/zoom, this.height + 4/zoom);
            ctx.setLineDash([]);
        }
        
        // Reset opacity
        ctx.globalAlpha = 1.0;
    }

    contains(px, py) {
        if (this.type === MAP_OBJECT_TYPES.WAYPOINT) {
            const centerX = this.x + this.width/2;
            const centerY = this.y + this.height/2;
            const distance = Math.sqrt((px - centerX)**2 + (py - centerY)**2);
            return distance <= this.style.radius;
        }
        
        return px >= this.x && px <= this.x + this.width &&
               py >= this.y && py <= this.y + this.height;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}