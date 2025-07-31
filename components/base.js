/**
 * BaseComponent.js - Base class สำหรับ components ทั้งหมด
 */
class BaseComponent {
    constructor() {
        this.data = {
            id: this.generateId(),
            as: ''
        };
        this.errors = [];
    }

    // Standard methods ที่ทุก component ต้องมี
    getId() { return this.data.id; }
    setId(id) { this.data.id = id; }
    getTitle() { return this.constructor.name.replace('Component', ''); }

    generateId() {
        const type = this.getTitle().toLowerCase();
        return `${type}_${Date.now()}`;
    }

    // ให้ subclass override
    updateField(field, value) {
        this.data[field] = value;
        this.validate();
    }

    validate() {
        this.errors = [];
        
        // Basic validation
        if (!this.data.id || this.data.id.trim() === '') {
            this.errors.push('ID is required');
        }

        return this.errors.length === 0;
    }

    toJSON() {
        const json = { ...this.data };
        // Remove empty fields
        Object.keys(json).forEach(key => {
            if (json[key] === '' || json[key] === null || json[key] === undefined) {
                delete json[key];
            }
        });
        return json;
    }

    fromJSON(json) {
        this.data = { ...this.data, ...json };
    }

    getInputs() {
        return [];
    }

    // Helper methods
    parseValue(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (!isNaN(value) && value !== '') return parseFloat(value);
        return value;
    }

    // Render helpers
    renderFieldGroup(label, field, value, type = 'text', placeholder = '', options = {}) {
        const fieldId = `${field}_${Math.random().toString(36).substr(2, 9)}`;
        
        let input;
        if (type === 'select') {
            input = `
                <select class="form-control" onchange="updateComponentField(${options.componentIndex}, '${field}', this.value)">
                    ${options.options}
                </select>
            `;
        } else if (type === 'textarea') {
            input = `
                <textarea class="form-control" rows="2" placeholder="${placeholder}"
                         onchange="updateComponentField(${options.componentIndex}, '${field}', this.value)">${value}</textarea>
            `;
        } else {
            input = `
                <input type="${type}" class="form-control" value="${value}" placeholder="${placeholder}"
                       onchange="updateComponentField(${options.componentIndex}, '${field}', this.value)">
            `;
        }

        return `
            <div class="mb-3">
                <label class="form-label">${label}</label>
                ${input}
            </div>
        `;
    }

    renderOperatorSelect(selectedOp = '', componentIndex = 0, context = '') {
        return `
            <select class="form-control" onchange="updateComponentField(${componentIndex}, '${context}_op', this.value)">
                ${getOperatorOptions(selectedOp)}
            </select>
        `;
    }

    renderConditionGroup(condition, componentIndex, context) {
        const op = condition.op || '==';
        const value = condition.value || '';
        const variable = condition.var || '';

        return `
            <div class="condition-group p-2 border rounded mb-2">
                <div class="row">
                    <div class="col-md-3">
                        <input type="text" class="form-control form-control-sm" 
                               value="${variable}" placeholder="Variable"
                               onchange="updateComponentField(${componentIndex}, '${context}_var', this.value)">
                    </div>
                    <div class="col-md-3">
                        ${this.renderOperatorSelect(op, componentIndex, context)}
                    </div>
                    <div class="col-md-6">
                        <input type="text" class="form-control form-control-sm" 
                               value="${Array.isArray(value) ? JSON.stringify(value) : value}" 
                               placeholder="${getValuePlaceholder(op)}"
                               onchange="updateComponentField(${componentIndex}, '${context}_value', this.value)">
                    </div>
                </div>
            </div>
        `;
    }
}