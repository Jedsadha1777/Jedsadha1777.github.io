/**
 * Formula Component Class
 * Handles mathematical formula components
 */

class FormulaComponent {
    constructor() {
        this.id = 'formula_' + Date.now();
        this.formula = '';
        this.as = '';
        this.inputs = [];
    }

    /**
     * Get component icon
     */
    getIcon() {
        return '<i class="bi bi-calculator"></i>';
    }

    /**
     * Get component title
     */
    getTitle() {
        return this.id || 'Formula Component';
    }

    /**
     * Get component ID
     */
    getId() {
        return this.id;
    }

    /**
     * Set component ID
     */
    setId(newId) {
        this.id = newId;
    }

    /**
     * Update field value
     */
    updateField(field, value) {
        switch(field) {
            case 'id':
                this.id = value;
                break;
            case 'formula':
                this.formula = value;
                break;
            case 'as':
                this.as = value;
                break;
            case 'inputs':
                this.inputs = value ? value.split(',').map(s => s.trim()) : [];
                break;
        }
    }

    /**
     * Render component form
     */
    render(index) {
        return `
            <div class="component-form">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">ID</label>
                        <input type="text" 
                               class="form-control" 
                               value="${this.id}" 
                               onchange="updateComponentField(${index}, 'id', this.value)">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Store As Variable (optional)</label>
                        <input type="text" 
                               class="form-control" 
                               placeholder="\$variable_name"
                               value="${this.as}" 
                               onchange="updateComponentField(${index}, 'as', this.value)">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Formula</label>
                    <input type="text" 
                           class="form-control" 
                           placeholder="e.g., \$age * 2 + \$income / 1000"
                           value="${this.formula}" 
                           onchange="updateComponentField(${index}, 'formula', this.value)">
                    <small class="text-muted">Use \$variableName to reference variables. Available functions: sqrt, pow, abs, min, max, round, bmi, etc.</small>
                </div>
                <div class="mb-3">
                    <label class="form-label">Required Inputs (optional)</label>
                    <input type="text" 
                           class="form-control" 
                           placeholder="age, income, weight"
                           value="${this.inputs.join(', ')}" 
                           onchange="updateComponentField(${index}, 'inputs', this.value)">
                    <small class="text-muted">Comma-separated list of required input variables</small>
                </div>
            </div>
        `;
    }

    /**
     * Convert to JSON configuration
     */
    toJSON() {
        const json = {
            id: this.id,
            formula: this.formula
        };

        if (this.inputs && this.inputs.length > 0) {
            json.inputs = this.inputs;
        }

        if (this.as) {
            json.as = this.as;
        }

        return json;
    }

    /**
     * Load from JSON configuration
     */
    fromJSON(json) {
        this.id = json.id || this.id;
        this.formula = json.formula || '';
        this.as = json.as || '';
        this.inputs = json.inputs || [];
    }
}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormulaComponent;
} else {
    window.FormulaComponent = FormulaComponent;
}