/**
 * Enhanced Switch Component Class with Deep Nesting Support
 * Handles infinitely nested AND/OR logic
 */

class SwitchComponent {
    constructor() {
        this.id = 'switch_' + Date.now();
        this.switch = '';
        this.when = [];
        this.default = '';
        this.as = '';
    }

    getIcon() {
        return '<i class="bi bi-shuffle"></i>';
    }

    getTitle() {
        return this.id || 'Switch Component';
    }

    getId() {
        return this.id;
    }

    setId(newId) {
        this.id = newId;
    }

    updateField(field, value) {

            console.log('🟡 updateField:', {field, value});

        switch(field) {
            case 'id':
                this.id = value;
                break;
            case 'switch':
                this.switch = value;
                break;
            case 'default':
                this.default = value;
                break;
            case 'as':
                this.as = value;
                break;
        }
    }

    /**
     * Add new simple case
     */
    addCase() {
        this.when.push({
            if: { op: '==', value: '' },
            result: ''
        });
    }

    /**
     * Add nested case with AND/OR logic
     */
    addNestedCase() {
        this.when.push({
            if: {
                and: [
                    { op: '>', value: '' },
                    { op: '==', value: '' }
                ]
            },
            result: ''
        });
    }

    /**
     * Remove case
     */
    removeCase(caseIndex) {
        this.when.splice(caseIndex, 1);
    }

    /**
     * Update case
     */
    updateCase(caseIndex, field, value) {

        console.log('🔵 updateCase:', {caseIndex, field, value});
        if (!this.when[caseIndex]) return;

        if (field === 'result') {
            this.when[caseIndex].result = this.parseValue(value);
        } else if (field === 'condition_type') {
            // Change between simple and nested conditions
            if (value === 'simple') {
                this.when[caseIndex].if = { 
                    op: '==',                    
                    value: '' 
                };
            } else if (value === 'and') {
                this.when[caseIndex].if = {
                    and: [
                        { op: '>', value: '' },
                        { op: '==', value: '' }
                    ]
                };
            } else if (value === 'or') {
                this.when[caseIndex].if = {
                    or: [
                        { op: '>', value: '' },
                        { op: '==', value: '' }
                    ]
                };
            }
        }
    }

    /**
     * Navigate to nested condition by path
     */
    getNestedCondition(condition, path) {
        if (!path || path.length === 0) return condition;
        
        let current = condition;
        for (const step of path) {
            if (step.type === 'and' && current.and && current.and[step.index]) {
                current = current.and[step.index];
            } else if (step.type === 'or' && current.or && current.or[step.index]) {
                current = current.or[step.index];
            } else {
                return null;
            }
        }
        return current;
    }

    /**
     * Update nested condition by path
     */
    updateNestedConditionByPath(caseIndex, path, field, value) {
            console.log('🔴 updateNestedConditionByPath:', {caseIndex, path, field, value});


        if (!this.when[caseIndex]) return;

        const condition = this.getNestedCondition(this.when[caseIndex].if, path);
            console.log('🔥 getNestedCondition result:', condition);
    console.log('🔥 Original condition:', this.when[caseIndex].if);

        if (!condition) return;

        if (field === 'op') {
            condition.op = value;
        } else if (field === 'var') {
            condition.var = value;
        } else if (field === 'value') {
            condition.value = this.parseValue(value);
        } else if (field === 'type') {
            // Convert condition type
            if (value === 'simple') {
                Object.keys(condition).forEach(key => delete condition[key]);
                Object.assign(condition, { op: '>', value: '' });
            } else if (value === 'and') {
                Object.keys(condition).forEach(key => delete condition[key]);
                Object.assign(condition, {
                    and: [
                        { op: '>', value: '' },
                        { op: '>', value: '' }
                    ]
                });
            } else if (value === 'or') {
                Object.keys(condition).forEach(key => delete condition[key]);
                Object.assign(condition, {
                    or: [
                        { op: '>', value: '' },
                        { op: '>', value: '' }
                    ]
                });
            }
        }

         // ถ้าไม่ใช่การเปลี่ยน type ให้จัดลำดับ property
        // if (field !== 'type') {
        //     const orderedCondition = {
        //         op: condition.op || '>'
        //     };

        //     if (condition.var && condition.var.trim() !== '') {
        //         orderedCondition.var = condition.var;
        //     }

        //     orderedCondition.value = condition.value;

        //     Object.keys(condition).forEach(key => delete condition[key]);
        //     Object.assign(condition, orderedCondition);
        // }
    }

    /**
     * Add condition to nested group by path
     */
    addConditionToGroupByPath(caseIndex, path, groupType) {
        if (!this.when[caseIndex]) return;

        const condition = this.getNestedCondition(this.when[caseIndex].if, path);
        if (!condition) return;

        const newCondition = { op: '>', value: '' };

        if (groupType === 'and' && condition.and) {
            condition.and.push(newCondition);
        } else if (groupType === 'or' && condition.or) {
            condition.or.push(newCondition);
        }
    }

    /**
     * Remove condition from nested group by path
     */
    removeConditionFromGroupByPath(caseIndex, path, conditionIndex, groupType) {
        if (!this.when[caseIndex]) return;

        const condition = this.getNestedCondition(this.when[caseIndex].if, path);
        if (!condition) return;

        if (groupType === 'and' && condition.and) {
            condition.and.splice(conditionIndex, 1);
            if (condition.and.length === 0) {
                condition.and.push({ op: '>', value: '' });
            }
        } else if (groupType === 'or' && condition.or) {
            condition.or.splice(conditionIndex, 1);
            if (condition.or.length === 0) {
                condition.or.push({ op: '>', value: '' });
            }
        }
    }

    /**
     * Legacy methods for backward compatibility
     */
    updateNestedCondition(caseIndex, conditionIndex, field, value) {        
        console.log('🟢 updateNestedCondition:', {caseIndex, conditionIndex, field, value});

        const path = conditionIndex > 0 ? [{ type: 'and', index: conditionIndex }] : [];
        this.updateNestedConditionByPath(caseIndex, [], field, value);
    }


    addConditionToGroup(caseIndex, groupType) {
        this.addConditionToGroupByPath(caseIndex, [], groupType);
    }

    removeConditionFromGroup(caseIndex, conditionIndex, groupType) {
        this.removeConditionFromGroupByPath(caseIndex, [], conditionIndex, groupType);
    }

    /**
     * Parse value to appropriate type
     */
    parseValue(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (/^\d+$/.test(value)) return parseInt(value);
        if (/^\d*\.\d+$/.test(value)) return parseFloat(value);
        
        // Handle arrays for 'in' operator
        if (value.startsWith('[') && value.endsWith(']')) {
            try {
                return JSON.parse(value);
            } catch (e) {
                return value;
            }
        }
        
        return value;
    }

    /**
     * Render component form
     */
    render(index) {
        let html = `
            <div class="component-form">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">ID</label>
                        <input type="text" 
                               class="form-control" 
                               value="${this.id}" 
                               data-field="id">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Store As Variable (optional)</label>
                        <input type="text" 
                               class="form-control" 
                               placeholder="$variable_name"
                               value="${this.as}" 
                               data-field="as">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Switch Variable</label>
                        <input type="text" 
                               class="form-control switch-var-field" 
                               placeholder="$variable or variable"
                               value="${this.switch}" 
                               data-field="switch">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Default Value</label>
                        <input type="text" 
                               class="form-control" 
                               placeholder="Default result"
                               value="${this.default}" 
                               data-field="default">
                    </div>
                </div>
                
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <label class="form-label mb-0">Cases</label>
                        <div class="btn-group btn-group-sm">
                            <button type="button" 
                                    class="btn btn-outline-primary add-case-btn">
                                <i class="bi bi-plus"></i> Simple Case
                            </button>
                            <button type="button" 
                                    class="btn btn-outline-info add-nested-case-btn">
                                <i class="bi bi-plus-circle"></i> Nested Case
                            </button>
                        </div>
                    </div>
                    <div class="switch-cases">
        `;

        this.when.forEach((caseItem, caseIndex) => {
            html += this.renderCase(index, caseIndex, caseItem);
        });

        if (this.when.length === 0) {
            html += '<p class="text-muted">No cases defined. Click "Simple Case" for basic conditions or "Nested Case" for complex AND/OR logic.</p>';
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Render individual case
     */
    renderCase(componentIndex, caseIndex, caseItem) {
        const condition = caseItem.if || {};

        let html = `
            <div class="switch-case border rounded p-3 mb-3" id="case_${componentIndex}_${caseIndex}">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0">Case ${caseIndex + 1}</h6>
                    <button type="button" 
                            class="btn btn-sm btn-outline-danger remove-case-btn" 
                            data-case-index="${caseIndex}">
                        <i class="bi bi-trash"></i> Remove Case
                    </button>
                </div>
        `;

        html += this.renderNestedConditionRecursive(componentIndex, caseIndex, condition, [], 0);

        html += `
                <div class="mt-3 pt-3 border-top">
                    <label class="form-label small"><strong>Then Result:</strong></label>
                    <input type="text" 
                           class="form-control case-field" 
                           placeholder="Result value"
                           value="${caseItem.result || ''}"
                           data-case-index="${caseIndex}"
                           data-case-field="result">
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Render nested condition recursively
     */
    renderNestedConditionRecursive(componentIndex, caseIndex, condition, path, depth) {
        const pathStr = JSON.stringify(path);
        const isNested = condition.and || condition.or;
        const conditionType = condition.and ? 'and' : condition.or ? 'or' : 'simple';
        const logicLabel = conditionType.toUpperCase(); // FIX: Define logicLabel here
        
        let html = `
            <div class="nested-condition-wrapper" data-depth="${depth}" style="margin-left: ${depth * 20}px;">
                <div class="condition-header d-flex align-items-center gap-2 mb-2">
                    <span class="badge bg-secondary">Level ${depth + 1}</span>
                    <select class="form-select form-select-sm condition-type-select" 
                            style="width: auto;"
                            data-case-index="${caseIndex}"
                            data-path='${pathStr}'
                            data-condition-field="type">
                        <option value="simple" ${conditionType === 'simple' ? 'selected' : ''}>Simple Condition</option>
                        <option value="and" ${conditionType === 'and' ? 'selected' : ''}>AND Group</option>
                        <option value="or" ${conditionType === 'or' ? 'selected' : ''}>OR Group</option>
                    </select>
        `;

        if (isNested) {
            html += `
                    <button type="button" 
                            class="btn btn-sm btn-outline-success add-condition-to-nested-group-btn"
                            data-case-index="${caseIndex}"
                            data-path='${pathStr}'
                            data-group-type="${conditionType}">
                        <i class="bi bi-plus"></i> Add ${logicLabel}
                    </button>
            `;
        }

        html += `</div>`;

        if (isNested) {
            html += `<div class="nested-conditions border rounded p-2 mb-2" style="background: ${depth % 2 === 0 ? '#f8f9fa' : '#ffffff'};">`;
            
            const conditions = condition[conditionType] || [];
            conditions.forEach((subCondition, conditionIndex) => {
                const newPath = [...path, { type: conditionType, index: conditionIndex }];
                
                html += `
                    <div class="nested-condition-item mb-2">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                `;
                
                html += this.renderNestedConditionRecursive(componentIndex, caseIndex, subCondition, newPath, depth + 1);
                
                html += `
                            </div>
                            <button type="button" 
                                    class="btn btn-sm btn-outline-danger ms-2 remove-nested-condition-btn"
                                    data-case-index="${caseIndex}"
                                    data-path='${pathStr}'
                                    data-condition-index="${conditionIndex}"
                                    data-group-type="${conditionType}">
                                <i class="bi bi-x"></i>
                            </button>
                        </div>
                `;

                if (conditionIndex < conditions.length - 1) {
                    html += `<div class="text-center my-1"><span class="badge bg-primary">${logicLabel}</span></div>`;
                }

                html += `</div>`;
            });
            
            html += `</div>`;
        } else {
            // Simple condition
            html += this.renderSimpleConditionInline(componentIndex, caseIndex, condition, pathStr);
        }

        html += `</div>`;
        return html;
    }

    /**
     * Render simple condition inline
     */
    renderSimpleConditionInline(componentIndex, caseIndex, condition, pathStr) {
        return `
            <div class="simple-condition-inline">
                <div class="row g-2">
                    <div class="col-md-3">
                        <select class="form-select form-select-sm nested-condition-field" 
                                data-case-index="${caseIndex}"
                                data-condition-index="0"
                                 data-path='${pathStr}'
                                data-condition-field="op">
                            ${getOperatorOptions(condition.op)}
                        </select>
                    </div>
                    <div class="col-md-4">
                        <input type="text" 
                               class="form-control form-control-sm nested-condition-field" 
                               placeholder="Variable"
                               value="${condition.var || condition.field || ''}"
                               data-case-index="${caseIndex}"
                               data-path='${pathStr}'
                               data-condition-field="var">
                    </div>
                    <div class="col-md-5">
                        <input type="text" 
                               class="form-control form-control-sm nested-condition-field" 
                               placeholder="Value"
                               value="${this.formatValue(condition.value)}"
                               data-case-index="${caseIndex}"
                               data-path='${pathStr}'
                               data-condition-field="value">
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Format value for display
     */
    formatValue(value) {
        if (Array.isArray(value)) {
            return JSON.stringify(value);
        }
        return value || '';
    }

    /**
     * Convert to JSON configuration
     */
    toJSON() {
        const json = {
            id: this.id,
            switch: this.switch,
            when: this.when,
            default: this.parseValue(this.default)
        };

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
        this.switch = json.switch || '';
        this.when = json.when || [];
        this.default = json.default || '';
        this.as = json.as || '';
    }
}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SwitchComponent;
} else {
    window.SwitchComponent = SwitchComponent;
}