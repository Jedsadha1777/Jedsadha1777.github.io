/**
 * Enhanced Scoring Component Class
 * Complete version with all fields and AND/OR logic support
 */

class ScoringComponent {
    constructor() {
        this.id = 'scoring_' + Date.now();
        this.scoring = {
            ifs: {
                vars: [],
                tree: []
            }
        };
        this.as = '';
    }

    /**
     * Get component icon
     */
    getIcon() {
        return '<i class="bi bi-bar-chart"></i>';
    }

    /**
     * Get component title
     */
    getTitle() {
        return this.id || 'Scoring Component';
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
            case 'as':
                this.as = value;
                break;
            case 'vars':
                this.scoring.ifs.vars = value ? value.split(',').map(s => s.trim()) : [];
                break;

        }
    }

    /**
     * Add new scoring branch
     */
    addScoringBranch() {
        this.scoring.ifs.tree.push({
            if: { op: '>=', value: 0 },
            ranges: [
                { 
                    if: { op: '==', value: '' }, 
                    score: 0
                  
                }
            ]
        });
    }


    /**
     * Remove scoring branch
     */
    removeScoringBranch(branchIndex) {
        this.scoring.ifs.tree.splice(branchIndex, 1);
    }

    /**
     * Update scoring branch condition
     */
    updateScoringBranch(branchIndex, field, value) {
        if (!this.scoring.ifs.tree[branchIndex]) return;

        const branch = this.scoring.ifs.tree[branchIndex];
        
        if (field === 'op') {
            branch.if.op = value;
        } else if (field === 'value') {
            branch.if.value = this.parseValue(value);
        } else if (field === 'condition_type') {
            // Support for AND/OR logic like Switch component
            if (value === 'simple') {
                branch.if = { op: '>=', value: 0 };
            } else if (value === 'and') {
                branch.if = {
                    and: [
                        { op: '>',  value: '' },
                        { op: '==',  value: '' }
                    ]
                };
            } else if (value === 'or') {
                branch.if = {
                    or: [
                        { op: '>',  value: '' },
                        { op: '==', value: '' }
                    ]
                };
            }
        }
    }

    /**
     * Update nested condition in branch (for AND/OR support)
     */
    updateNestedBranchCondition(branchIndex, conditionIndex, field, value) {
        if (!this.scoring.ifs.tree[branchIndex]) return;

        const branchIf = this.scoring.ifs.tree[branchIndex].if;
        let condition = null;

        if (branchIf.and && branchIf.and[conditionIndex]) {
            condition = branchIf.and[conditionIndex];
        } else if (branchIf.or && branchIf.or[conditionIndex]) {
            condition = branchIf.or[conditionIndex];
        }

        if (condition) {
            if (field === 'var') {
                condition.var = value;
            } else if (field === 'op') {
                condition.op = value;
            } else if (field === 'value') {
                condition.value = this.parseValue(value);
            }
        }
    }

    /**
     * Add condition to nested group in branch
     */
    addConditionToBranchGroup(branchIndex, groupType) {
        if (!this.scoring.ifs.tree[branchIndex]) return;

        const branchIf = this.scoring.ifs.tree[branchIndex].if;
        
        if (groupType === 'and' && branchIf.and) {
            branchIf.and.push({ op: '==',  value: '' });
        } else if (groupType === 'or' && branchIf.or) {
            branchIf.or.push({ op: '==',  value: '' });
        }
    }

    /**
     * Remove condition from nested group in branch
     */
    removeConditionFromBranchGroup(branchIndex, conditionIndex, groupType) {
        if (!this.scoring.ifs.tree[branchIndex]) return;

        const branchIf = this.scoring.ifs.tree[branchIndex].if;
        
        if (groupType === 'and' && branchIf.and && branchIf.and.length > 1) {
            branchIf.and.splice(conditionIndex, 1);
        } else if (groupType === 'or' && branchIf.or && branchIf.or.length > 1) {
            branchIf.or.splice(conditionIndex, 1);
        }
    }

    /**
     * Navigate to nested range condition by path (ก็อปจาก switch.js)
     */
    getRangeNestedCondition(branchIndex, rangeIndex, path) {
        if (!this.scoring.ifs.tree[branchIndex] || 
            !this.scoring.ifs.tree[branchIndex].ranges[rangeIndex]) return null;
        
        let condition = this.scoring.ifs.tree[branchIndex].ranges[rangeIndex].if;
        
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
     * Update range condition type by path
     */
    updateRangeConditionTypeByPath(branchIndex, rangeIndex, path, conditionType) {
        const condition = this.getRangeNestedCondition(branchIndex, rangeIndex, path);
        if (!condition) return;

        if (conditionType === 'simple') {
            Object.keys(condition).forEach(key => delete condition[key]);
            Object.assign(condition, { op: '==', value: '' });
        } else if (conditionType === 'and') {
            Object.keys(condition).forEach(key => delete condition[key]);
            Object.assign(condition, {
                and: [
                    { op: '>', value: '' },
                    { op: '>',  value: '' }
                ]
            });
        } else if (conditionType === 'or') {
            Object.keys(condition).forEach(key => delete condition[key]);
            Object.assign(condition, {
                or: [
                    { op: '>', value: '' },
                    { op: '>', value: '' }
                ]
            });
        }
    }

    /**
     * Add condition to range group by path
     */
    addConditionToRangeGroupByPath(branchIndex, rangeIndex, path, groupType) {
        const condition = this.getRangeNestedCondition(branchIndex, rangeIndex, path);
        if (!condition) return;

        const newCondition = { op: '>', value: '' };

        if (groupType === 'and' && condition.and) {
            condition.and.push(newCondition);
        } else if (groupType === 'or' && condition.or) {
            condition.or.push(newCondition);
        }
    }

    /**
     * Remove range condition by path
     */
    removeRangeConditionByPath(branchIndex, rangeIndex, path, conditionIndex, groupType) {
        const condition = this.getRangeNestedCondition(branchIndex, rangeIndex, path);
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
     * Update range condition by path
     */
    updateRangeConditionByPath(branchIndex, rangeIndex, path, field, value) {
        const condition = this.getRangeNestedCondition(branchIndex, rangeIndex, path);
        if (!condition) return;

        // อัพเดท value
        if (field === 'op') {
            condition.op = value;
        } else if (field === 'var') {
            condition.var = value;
        } else if (field === 'value') {
            condition.value = this.parseValue(value);
        }

        // สร้าง object ใหม่ที่มีลำดับถูกต้อง
        const orderedCondition = {
            op: condition.op || '=='
        };

        // เพิ่ม var เฉพาะเมื่อไม่ว่าง
        if (condition.var && condition.var.trim() !== '') {
            orderedCondition.var = condition.var;
        }

        orderedCondition.value = condition.value;

        Object.keys(condition).forEach(key => delete condition[key]);
        Object.assign(condition, orderedCondition);
    }



    /**
     * Add range to scoring branch
     */
    addRangeToBranch(branchIndex) {
        if (!this.scoring.ifs.tree[branchIndex]) return;

        this.scoring.ifs.tree[branchIndex].ranges.push({
            if: { op: '==', value: '' },
            score: 0
       
        });
    }

    /**
     * Remove range from scoring branch
     */
    removeRangeFromBranch(branchIndex, rangeIndex) {
        if (!this.scoring.ifs.tree[branchIndex] || !this.scoring.ifs.tree[branchIndex].ranges) return;

        this.scoring.ifs.tree[branchIndex].ranges.splice(rangeIndex, 1);
        
        if (this.scoring.ifs.tree[branchIndex].ranges.length === 0) {
            this.scoring.ifs.tree[branchIndex].ranges.push({
                if: { op: '==', value: '' },
                score: 0,
                
            });
        }
    }

    /**
     * Update range field
     */
    updateRangeField(branchIndex, rangeIndex, field, value) {
        if (!this.scoring.ifs.tree[branchIndex] || !this.scoring.ifs.tree[branchIndex].ranges[rangeIndex]) return;

        const range = this.scoring.ifs.tree[branchIndex].ranges[rangeIndex];
        
        if (field === 'op') {
            range.if.op = value;
        } else if (field === 'value') {
            range.if.value = this.parseValue(value);
        } else {
            range[field] = this.parseValue(value);
        }
    }

    /**
     * Update set_vars for a range
     */
    updateSetVars(branchIndex, rangeIndex, varsString) {
        if (!this.scoring.ifs.tree[branchIndex] || !this.scoring.ifs.tree[branchIndex].ranges[rangeIndex]) return;

        const range = this.scoring.ifs.tree[branchIndex].ranges[rangeIndex];
        
        try {
            const setVars = {};
            
            if (varsString && varsString.trim()) {
                const pairs = varsString.split(',');
                
                pairs.forEach(pair => {
                    const [key, value] = pair.split('=').map(s => s.trim());
                    
                    if (key && value) {
                        // 🔥 ถ้า key ซ้ำ ให้แปลงเป็น array
                        if (setVars.hasOwnProperty(key)) {
                            if (!Array.isArray(setVars[key])) {
                                setVars[key] = [setVars[key]];
                            }
                            setVars[key].push(this.parseValue(value));
                        } else {
                            setVars[key] = this.parseValue(value);
                        }
                    }
                });
            }
            
            if (Object.keys(setVars).length === 0) {
                delete range.set_vars;
            } else {
                range.set_vars = setVars;
            }
        } catch (error) {
            delete range.set_vars;
        }
    }

    /**
     * Add custom field to range
     */
    addCustomFieldToRange(branchIndex, rangeIndex, fieldName, value) {
        if (!this.scoring.ifs.tree[branchIndex] || !this.scoring.ifs.tree[branchIndex].ranges[rangeIndex]) return;

        const range = this.scoring.ifs.tree[branchIndex].ranges[rangeIndex];
        range[fieldName] = this.parseValue(value);
    }

    /**
     * Remove custom field from range
     */
    removeCustomFieldFromRange(branchIndex, rangeIndex, fieldName) {
        if (!this.scoring.ifs.tree[branchIndex] || !this.scoring.ifs.tree[branchIndex].ranges[rangeIndex]) return;

        const range = this.scoring.ifs.tree[branchIndex].ranges[rangeIndex];
        if (fieldName !== 'if' && fieldName !== 'score' && fieldName !== 'set_vars') {
            delete range[fieldName];
        }
    }

    //20250725 Enhanced Scoring Range
    /**
     * Update range condition type (เพิ่ม method ใหม่)
     */
    updateRangeConditionType(branchIndex, rangeIndex, conditionType) {
        if (!this.scoring.ifs.tree[branchIndex] || !this.scoring.ifs.tree[branchIndex].ranges[rangeIndex]) return;

        const range = this.scoring.ifs.tree[branchIndex].ranges[rangeIndex];
        
        if (conditionType === 'simple') {
            range.if = { op: '>=', value: 0 };
        } else if (conditionType === 'and') {
            range.if = {
                and: [
                    { op: '>', value: '' },
                    { op: '==', value: '' }
                ]
            };
        } else if (conditionType === 'or') {
            range.if = {
                or: [
                    { op: '>', value: '' },
                    { op: '==', value: '' }
                ]
            };
        }
    }

    /**
     * Update nested condition in range (เพิ่ม method ใหม่)
     */
    updateNestedRangeCondition(branchIndex, rangeIndex, conditionIndex, field, value) {
        if (!this.scoring.ifs.tree[branchIndex] || !this.scoring.ifs.tree[branchIndex].ranges[rangeIndex]) return;

        const rangeIf = this.scoring.ifs.tree[branchIndex].ranges[rangeIndex].if;
        let condition = null;

        if (rangeIf.and && rangeIf.and[conditionIndex]) {
            condition = rangeIf.and[conditionIndex];
        } else if (rangeIf.or && rangeIf.or[conditionIndex]) {
            condition = rangeIf.or[conditionIndex];
        } else if (!rangeIf.and && !rangeIf.or) {
            condition = rangeIf; // Simple condition
        }

        if (condition) {
            if (field === 'op') {
                condition.op = value;
            } else if (field === 'var') {
                condition.var = value;
            } else if (field === 'value') {
                condition.value = this.parseValue(value);
            }
        }
    }

    /**
     * Add condition to nested group in range (เพิ่ม method ใหม่)
     */
    addConditionToRangeGroup(branchIndex, rangeIndex, groupType) {
        if (!this.scoring.ifs.tree[branchIndex] || 
            !this.scoring.ifs.tree[branchIndex].ranges[rangeIndex]) return;

        const rangeIf = this.scoring.ifs.tree[branchIndex].ranges[rangeIndex].if;
        
        if (groupType === 'and' && rangeIf.and) {
            rangeIf.and.push({ op: '==', value: '' });
        } else if (groupType === 'or' && rangeIf.or) {
            rangeIf.or.push({ op: '==',  value: '' });
        }
    }

    /**
     * Update scoring range - Enhanced with AND/OR support
     */
    updateScoringRange(branchIndex, rangeIndex, field, value) {
        if (!this.scoring.ifs.tree[branchIndex] || 
            !this.scoring.ifs.tree[branchIndex].ranges[rangeIndex]) return;

        const range = this.scoring.ifs.tree[branchIndex].ranges[rangeIndex];

        if (field === 'op') {
            range.if.op = value;
        } else if (field === 'value') {
            range.if.value = this.parseValue(value);
        } else if (field === 'score') {
            range.score = this.parseValue(value);
        } else if (field === 'set_vars') {
            range.set_vars = this.parseSetVars(value);
        } else if (field === 'condition_type') {
            // Support for AND/OR logic in ranges too
            if (value === 'simple') {
                range.if = { op: '==', value: '' };
            } else if (value === 'and') {
                range.if = {
                    and: [
                        { op: '>',  value: '' },
                        { op: '==',  value: '' }
                    ]
                };
            } else if (value === 'or') {
                range.if = {
                    or: [
                        { op: '>', value: '' },
                        { op: '==', value: '' }
                    ]
                };
            }
        }
    }

    /**
     * Parse set_vars string to object
     */
    parseSetVars(str) {
        if (!str || str.trim() === '') return {};
        
        const result = {};
        const pairs = str.split(',');
        
        pairs.forEach(pair => {
            const [key, value] = pair.split('=').map(s => s.trim());
            if (key && value !== undefined) {
                // Parse value as number if possible
                const numValue = Number(value);
                result[key] = !isNaN(numValue) ? numValue : value;
            }
        });
        
        return result;
    }
    

    /**
     * Remove condition from nested group in range (เพิ่ม method ใหม่)
     */
    removeConditionFromRangeGroup(branchIndex, rangeIndex, conditionIndex, groupType) {
        if (!this.scoring.ifs.tree[branchIndex] || 
            !this.scoring.ifs.tree[branchIndex].ranges[rangeIndex]) return;

        const rangeIf = this.scoring.ifs.tree[branchIndex].ranges[rangeIndex].if;
        
        if (groupType === 'and' && rangeIf.and && rangeIf.and.length > 1) {
            rangeIf.and.splice(conditionIndex, 1);
        } else if (groupType === 'or' && rangeIf.or && rangeIf.or.length > 1) {
            rangeIf.or.splice(conditionIndex, 1);
        }
    }
    //20250725 Enhanced Scoring Range end

    /**
     * Add nested condition to range (เพิ่ม Level 3, 4, 5...)
     */
    addNestedConditionToRange(branchIndex, rangeIndex, conditionIndex, nestType) {
        if (!this.scoring.ifs.tree[branchIndex] || 
            !this.scoring.ifs.tree[branchIndex].ranges[rangeIndex]) return;

        const rangeIf = this.scoring.ifs.tree[branchIndex].ranges[rangeIndex].if;
        let targetCondition = null;

        if (rangeIf.and && rangeIf.and[conditionIndex]) {
            targetCondition = rangeIf.and[conditionIndex];
        } else if (rangeIf.or && rangeIf.or[conditionIndex]) {
            targetCondition = rangeIf.or[conditionIndex];
        }

        if (targetCondition) {
            // 🔥 ถ้ามี nested อยู่แล้ว ให้เพิ่มใน nested นั้น
            if (targetCondition.and) {
                targetCondition.and.push({ op: '==',  value: '' });
            } else if (targetCondition.or) {
                targetCondition.or.push({ op: '==', value: '' });
            } else {
                // 🔥 ถ้ายังไม่มี nested ให้สร้างใหม่ โดย**ไม่ลบข้อมูลเดิม**
                const existingData = {
                    op: targetCondition.op || '==',
                    var: targetCondition.var || '',
                    value: targetCondition.value || ''
                };

                if (nestType === 'and') {
                    targetCondition.and = [
                        existingData, // เก็บข้อมูลเดิม
                        { op: '==',  value: '' } // เพิ่มใหม่
                    ];
                } else if (nestType === 'or') {
                    targetCondition.or = [
                        existingData, // เก็บข้อมูลเดิม
                        { op: '==', value: '' } // เพิ่มใหม่
                    ];
                }

                // 🔥 ลบ properties เดิมหลังจากย้ายไป nested แล้ว
                delete targetCondition.op;
                delete targetCondition.var; 
                delete targetCondition.value;
            }
        }
    }


    /**
     * Update deep nested range condition (เพิ่ม method ใหม่)
     */
    updateDeepNestedRangeCondition(branchIndex, rangeIndex, conditionIndex, deepIndex, field, value) {
        if (!this.scoring.ifs.tree[branchIndex] || 
            !this.scoring.ifs.tree[branchIndex].ranges[rangeIndex]) return;

        const rangeIf = this.scoring.ifs.tree[branchIndex].ranges[rangeIndex].if;
        let targetCondition = null;

        if (rangeIf.and && rangeIf.and[conditionIndex]) {
            targetCondition = rangeIf.and[conditionIndex];
        } else if (rangeIf.or && rangeIf.or[conditionIndex]) {
            targetCondition = rangeIf.or[conditionIndex];
        }

        if (targetCondition) {
            let deepCondition = null;
            
            if (targetCondition.and && targetCondition.and[deepIndex]) {
                deepCondition = targetCondition.and[deepIndex];
            } else if (targetCondition.or && targetCondition.or[deepIndex]) {
                deepCondition = targetCondition.or[deepIndex];
            }

            if (deepCondition) {
                if (field === 'deep_op') {
                    deepCondition.op = value;
                } else if (field === 'deep_var') {
                    deepCondition.var = value;
                } else if (field === 'deep_value') {
                    deepCondition.value = this.parseValue(value);
                }
            }
        }
    }

    /**
     * Add deep nested condition (เพิ่ม method สำหรับ Level 4+)
     */
    addDeepNestedCondition(branchIndex, rangeIndex, conditionIndex, deepIndex, nestType) {
        if (!this.scoring.ifs.tree[branchIndex] || 
            !this.scoring.ifs.tree[branchIndex].ranges[rangeIndex]) return;

        const rangeIf = this.scoring.ifs.tree[branchIndex].ranges[rangeIndex].if;
        let targetCondition = null;

        if (rangeIf.and && rangeIf.and[conditionIndex]) {
            targetCondition = rangeIf.and[conditionIndex];
        } else if (rangeIf.or && rangeIf.or[conditionIndex]) {
            targetCondition = rangeIf.or[conditionIndex];
        }

        if (targetCondition) {
            let deepCondition = null;
            
            if (targetCondition.and && targetCondition.and[deepIndex]) {
                deepCondition = targetCondition.and[deepIndex];
            } else if (targetCondition.or && targetCondition.or[deepIndex]) {
                deepCondition = targetCondition.or[deepIndex];
            }

            if (deepCondition) {
                // สร้าง nested level 4+
                const existingData = {
                    op: deepCondition.op || '==',
                    var: deepCondition.var || '',
                    value: deepCondition.value || ''
                };

                if (nestType === 'and') {
                    deepCondition.and = [
                        existingData,
                        { op: '==', value: '' }
                    ];
                } else if (nestType === 'or') {
                    deepCondition.or = [
                        existingData,
                        { op: '==',  value: '' }
                    ];
                }

                delete deepCondition.op;
                delete deepCondition.var;
                delete deepCondition.value;
            }
        }
    }

    /**
     * Format set_vars for display
     */
    formatSetVars(setVars) {
        if (!setVars || Object.keys(setVars).length === 0) return '';
        
        return Object.entries(setVars)
            .map(([key, value]) => {
                if (Array.isArray(value)) {
                    return value.map(v => `${key} = ${JSON.stringify(v)}`).join(', ');
                }
                return `${key} = ${JSON.stringify(value)}`;
            })
            .join(', ');
    }


    /**
     * Get all custom fields from ranges
     */
    getAllCustomFields() {
        const fields = new Set(['score']);
        
        this.scoring.ifs.tree.forEach(branch => {
            branch.ranges.forEach(range => {
                Object.keys(range).forEach(key => {
                    if (key !== 'if' && key !== 'set_vars') {
                        fields.add(key);
                    }
                });
            });
        });
        
        return Array.from(fields);
    }

    /**
     * Parse value to appropriate type
     */
    parseValue(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (/^\d+$/.test(value)) return parseInt(value);
        if (/^\d*\.\d+$/.test(value)) return parseFloat(value);
        
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
                
                <div class="mb-3">
                    <label class="form-label">Scoring Variables</label>
                    <input type="text" 
                           class="form-control scoring-vars-field" 
                           placeholder="$perf_score, years_service"
                           value="${this.scoring.ifs.vars.join(', ')}" 
                           data-field="vars">
                    <small class="text-muted">Multi-dimensional scoring uses <span class="text-primary">2 variables</span>: <span class="text-primary">when</span> and <span class="text-primary">range</span> (prefix $ for calculated).</small>
                </div>
                
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <label class="form-label mb-0">Scoring Matrix</label>
                        <button type="button" 
                                class="btn btn-sm btn-outline-primary add-scoring-branch-btn">
                            <i class="bi bi-plus"></i> Add Dimension
                        </button>
                    </div>
                    <div class="scoring-matrix">
        `;

        this.scoring.ifs.tree.forEach((branch, branchIndex) => {
            html += this.renderScoringBranch(index, branchIndex, branch);
        });

        if (this.scoring.ifs.tree.length === 0) {
            html += `
                <div class="text-center p-4 border rounded bg-light">
                    <i class="bi bi-bar-chart fs-1 text-muted mb-2"></i>
                    <p class="text-muted mb-2">No scoring dimensions defined</p>
                    <p class="small text-muted">Click "Add Dimension" to create scoring logic</p>
                </div>
            `;
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Render scoring branch (dimension)
     */
    
    /**
     * Render scoring branch (dimension) - ใช้ recursive approach
     */
    renderScoringBranch(componentIndex, branchIndex, branch) {
        const condition = branch.if || {};
        const var1 = this.scoring.ifs.vars[0] || 'var1';
        const var2 = this.scoring.ifs.vars[1] || 'var2';
        
        let html = `
            <div class="scoring-dimension border rounded p-3 mb-3" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0">
                        <i class="bi bi-layers text-primary me-2"></i>
                        Dimension ${branchIndex + 1}: <strong>${var1}</strong>
                    </h6>
                    <button type="button" 
                            class="btn btn-sm btn-outline-danger remove-scoring-branch-btn" 
                            data-branch-index="${branchIndex}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                
                <div class="primary-condition mb-3 p-3 border rounded" style="background: #ffffff;">
                    <label class="form-label small mb-2">When <strong>${var1}</strong>:</label>
                    <!-- ✅ ใช้ recursive สำหรับ Primary Condition -->
                    ${this.renderBranchConditionRecursive(componentIndex, branchIndex, condition, [], 0)}
                </div>
                
                <!-- ✅ เก็บ scoring-ranges ไว้เหมือนเดิม -->
                <div class="scoring-ranges">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <label class="form-label small mb-0">Then score by <strong>${var2}</strong>:</label>
                        <button type="button" 
                                class="btn btn-sm btn-outline-success add-range-to-branch-btn"
                                data-branch-index="${branchIndex}">
                            <i class="bi bi-plus"></i> Add Range
                        </button>
                    </div>
        `;

        branch.ranges.forEach((range, rangeIndex) => {
            html += this.renderScoringRange(componentIndex, branchIndex, rangeIndex, range);
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Render branch condition recursively - ใหม่สำหรับ Primary Condition
     */
    renderBranchConditionRecursive(componentIndex, branchIndex, condition, path, depth) {
        const pathStr = JSON.stringify(path);
        const isNested = condition.and || condition.or;
        const conditionType = condition.and ? 'and' : condition.or ? 'or' : 'simple';
        const logicLabel = conditionType.toUpperCase();
        
        let html = `
            <div class="nested-condition-wrapper" data-depth="${depth}" style="margin-left: ${depth * 20}px;">
                <div class="condition-header d-flex align-items-center gap-2 mb-2">
                    <span class="badge bg-secondary">Level ${depth + 1}</span>
                    <select class="form-select form-select-sm branch-condition-type-select" 
                            style="width: auto;"
                            data-branch-index="${branchIndex}"
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
                            class="btn btn-sm btn-outline-success add-branch-condition-to-group-btn"
                            data-branch-index="${branchIndex}"
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
                
                // 🔁 Recursive call
                html += this.renderBranchConditionRecursive(componentIndex, branchIndex, subCondition, newPath, depth + 1);
                
                html += `
                            </div>
                            ${conditions.length > 1 ? `
                                <button type="button" 
                                        class="btn btn-sm btn-outline-danger ms-2 remove-branch-nested-condition-btn"
                                        data-branch-index="${branchIndex}"
                                        data-path='${pathStr}'
                                        data-condition-index="${conditionIndex}"
                                        data-group-type="${conditionType}">
                                    <i class="bi bi-x"></i>
                                </button>
                            ` : ''}
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
            html += this.renderSimpleBranchCondition(componentIndex, branchIndex, condition, pathStr);
        }

        html += `</div>`;
        return html;
    }

    /**
     * Render simple branch condition
     */
    renderSimpleBranchCondition(componentIndex, branchIndex, condition, pathStr) {
        return `
            <div class="simple-condition-inline">
                <div class="row g-2">
                    <div class="col-md-3">
                        <select class="form-select form-select-sm branch-nested-condition-field" 
                                data-branch-index="${branchIndex}"
                                data-path='${pathStr}'
                                data-condition-field="op">
                            ${getOperatorOptions(condition.op)}
                        </select>
                    </div>

                     <div class="col-md-4">
                        <input type="text" 
                            class="form-control form-control-sm branch-nested-condition-field" 
                            placeholder="Variable name"
                            value="${condition.var || condition.field || ''}"
                            data-branch-index="${branchIndex}"
                            data-path='${pathStr}'
                            data-condition-field="var">
                    </div>

                    <div class="col-md-5">
                        <input type="text" 
                            class="form-control form-control-sm branch-nested-condition-field" 
                            placeholder="${getValuePlaceholder(condition.op)}"
                            value="${this.formatValue(condition.value)}"
                            data-branch-index="${branchIndex}"
                            data-path='${pathStr}'
                            data-condition-field="value">
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render nested branch condition (AND/OR)
     */
    renderNestedBranchCondition(componentIndex, branchIndex, condition, conditionType) {
        const conditions = condition[conditionType] || [];
        const logicLabel = conditionType.toUpperCase();
        
        let html = `
            <div class="nested-branch-condition">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge bg-${conditionType === 'and' ? 'primary' : 'warning'}">${logicLabel} Conditions</span>
                    <button type="button" 
                            class="btn btn-sm btn-outline-success add-condition-to-branch-group-btn"
                            data-branch-index="${branchIndex}"
                            data-group-type="${conditionType}">
                        <i class="bi bi-plus"></i> Add ${logicLabel}
                    </button>
                </div>
        `;

        conditions.forEach((cond, conditionIndex) => {
            html += `
                <div class="condition-row mb-2">
                    <div class="row g-2">
                        <div class="col-md-3">
                            <input type="text" 
                                class="form-control form-control-sm nested-branch-condition-field" 
                                placeholder="Variable"
                                value="${cond.var || ''}"
                                data-branch-index="${branchIndex}"
                                data-condition-index="${conditionIndex}"
                                data-condition-field="var">
                        </div>
                        <div class="col-md-3">
                            <select class="form-select form-select-sm nested-branch-condition-field" 
                                    data-branch-index="${branchIndex}"
                                    data-condition-index="${conditionIndex}"
                                    data-condition-field="op">
                                ${getOperatorOptions(cond.op)}
                            </select>
                        </div>
                        <div class="col-md-5">
                            <input type="text" 
                                class="form-control form-control-sm nested-branch-condition-field" 
                                placeholder="${getValuePlaceholder(cond.op)}"
                                value="${this.formatValue(cond.value)}"
                                data-branch-index="${branchIndex}"
                                data-condition-index="${conditionIndex}"
                                data-condition-field="value">
                        </div>
                        <div class="col-md-1">
                            ${conditions.length > 1 ? `
                                <button type="button" 
                                        class="btn btn-sm btn-outline-danger remove-condition-from-branch-group-btn"
                                        data-branch-index="${branchIndex}"
                                        data-condition-index="${conditionIndex}"
                                        data-group-type="${conditionType}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        return html;
    }

    /**
     * Render scoring range
     * Enhanced renderScoringRange method - รองรับ AND/OR
     */
    renderScoringRange(componentIndex, branchIndex, rangeIndex, range) {
        const condition = range.if || {};
        const customFields = this.getAllCustomFields();
        
        let html = `
            <div class="scoring-range border rounded p-3 mb-2" style="background: #ffffff;">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge bg-secondary">Range ${rangeIndex + 1}</span>
                    <div class="btn-group btn-group-sm">
                        <button type="button" 
                                class="btn btn-outline-info add-custom-field-btn"
                                data-branch-index="${branchIndex}"
                                data-range-index="${rangeIndex}">
                            <i class="bi bi-plus-circle"></i>
                        </button>
                        <button type="button" 
                                class="btn btn-outline-danger remove-range-from-branch-btn"
                                data-branch-index="${branchIndex}"
                                data-range-index="${rangeIndex}">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                </div>
                
                <!-- ✅ Recursive Condition Rendering -->
                <div class="mb-3">
                    <label class="form-label small mb-2">Range Condition:</label>
                    ${this.renderRangeConditionRecursive(componentIndex, branchIndex, rangeIndex, condition, [], 0)}
                </div>

                <!-- ✅ เก็บ Scoring Fields ไว้ครบ -->
                <div class="row g-2 mb-3">
                    <div class="col-md-6">
                        <label class="form-label small">Score <span class="text-danger">*</span></label>
                        <input type="number" 
                            class="form-control form-control-sm scoring-range-field" 
                            placeholder="Numeric score"
                            value="${range.score || ''}"
                            data-branch-index="${branchIndex}"
                            data-range-index="${rangeIndex}"
                            data-range-field="score"
                            step="any">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small">Set Variables</label>
                        <input type="text" 
                            class="form-control form-control-sm set-vars-field" 
                            placeholder="$multiplier = 2.5, $rate = 0.15"
                            value="${this.formatSetVars(range.set_vars)}"
                            data-branch-index="${branchIndex}"
                            data-range-index="${rangeIndex}">
                    </div>
                </div>

                <!-- ✅ เก็บ Custom Fields ไว้ -->
                ${this.renderCustomFields(branchIndex, rangeIndex, range, customFields)}
            </div>
        `;

        return html;
    }

    /**
     * Render custom fields - แยกออกมาเพื่อความชัดเจน
     */
    renderCustomFields(branchIndex, rangeIndex, range, customFields) {
        const excludeFields = ['score', 'set_vars', 'if'];
        const customFieldsOnly = customFields.filter(field => !excludeFields.includes(field));
        
        if (customFieldsOnly.length === 0) return '';
        
        let html = `<div class="row g-2">`;
        
        customFieldsOnly.forEach((fieldName) => {
            const value = range[fieldName] || '';
            
            html += `
                <div class="col-md-6">
                    <div class="d-flex justify-content-between align-items-center">
                        <label class="form-label small">${fieldName}</label>
                        <button type="button" 
                                class="btn btn-sm btn-link text-danger p-0 remove-custom-field-btn"
                                data-branch-index="${branchIndex}"
                                data-range-index="${rangeIndex}"
                                data-field-name="${fieldName}">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                    <input type="text" 
                        class="form-control form-control-sm scoring-range-field" 
                        placeholder="Enter ${fieldName}"
                        value="${value}"
                        data-branch-index="${branchIndex}"
                        data-range-index="${rangeIndex}"
                        data-range-field="${fieldName}">
                </div>
            `;
        });
        
        html += `</div>`;
        return html;
    }

    renderRangeConditionRecursive(componentIndex, branchIndex, rangeIndex, condition, path, depth) {
        const pathStr = JSON.stringify(path);
        const isNested = condition.and || condition.or;
        const conditionType = condition.and ? 'and' : condition.or ? 'or' : 'simple';
        const logicLabel = conditionType.toUpperCase();
        
        let html = `
            <div class="nested-condition-wrapper" data-depth="${depth}" style="margin-left: ${depth * 20}px;">
                <div class="condition-header d-flex align-items-center gap-2 mb-2">
                    <span class="badge bg-secondary">Level ${depth + 1}</span>
                    <select class="form-select form-select-sm range-condition-type-select" 
                            style="width: auto;"
                            data-branch-index="${branchIndex}"
                            data-range-index="${rangeIndex}"
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
                            class="btn btn-sm btn-outline-success add-range-condition-to-group-btn"
                            data-branch-index="${branchIndex}"
                            data-range-index="${rangeIndex}"
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
                
                // 🔁 Recursive call - ไม่สิ้นสุด!
                html += this.renderRangeConditionRecursive(componentIndex, branchIndex, rangeIndex, subCondition, newPath, depth + 1);
                
                html += `
                            </div>
                            ${conditions.length > 1 ? `
                                <button type="button" 
                                        class="btn btn-sm btn-outline-danger ms-2 remove-range-nested-condition-btn"
                                        data-branch-index="${branchIndex}"
                                        data-range-index="${rangeIndex}"
                                        data-path='${pathStr}'
                                        data-condition-index="${conditionIndex}"
                                        data-group-type="${conditionType}">
                                    <i class="bi bi-x"></i>
                                </button>
                            ` : ''}
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
            html += this.renderSimpleRangeCondition(componentIndex, branchIndex, rangeIndex, condition, pathStr);
        }

        html += `</div>`;
        return html;
    }

    /**
     * Render simple range condition (เพิ่ม method ใหม่)
     */
    renderSimpleRangeCondition(componentIndex, branchIndex, rangeIndex, condition, pathStr) {
        return `
            <div class="simple-condition-inline">
                <div class="row g-2">
                    <div class="col-md-3">
                        <select class="form-select form-select-sm range-nested-condition-field" 
                                data-branch-index="${branchIndex}"
                                data-range-index="${rangeIndex}"
                                data-path='${pathStr}'
                                data-condition-field="op">
                            ${getOperatorOptions(condition.op)}
                        </select>
                    </div>
                    <div class="col-md-4">
                        <input type="text" 
                            class="form-control form-control-sm range-nested-condition-field" 
                            placeholder="Variable"
                            value="${condition.var || condition.field || ''}"
                            data-branch-index="${branchIndex}"
                            data-range-index="${rangeIndex}"
                            data-path='${pathStr}'
                            data-condition-field="var">
                    </div>
                    <div class="col-md-5">
                        <input type="text" 
                            class="form-control form-control-sm range-nested-condition-field" 
                            placeholder="${getValuePlaceholder(condition.op)}"
                            value="${this.formatValue(condition.value)}"
                            data-branch-index="${branchIndex}"
                            data-range-index="${rangeIndex}"
                            data-path='${pathStr}'
                            data-condition-field="value">
                    </div>
                </div>
            </div>
        `;
    }
    /**
     * Render nested range condition (เพิ่ม method ใหม่)
     */
    renderNestedRangeCondition(componentIndex, branchIndex, rangeIndex, condition, conditionType) {
        const conditions = condition[conditionType] || [];
        const logicLabel = conditionType.toUpperCase();
        
        let html = `
            <div class="nested-range-condition">
                <!-- ✅ ส่วนที่ 1: Condition Type Selector -->
              
                
                <!-- ✅ ส่วนที่ 2: Add Button Header -->
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge bg-${conditionType === 'and' ? 'primary' : 'info'} fs-6">${logicLabel} Logic</span>
                    <button type="button" 
                            class="btn btn-sm btn-outline-success add-condition-to-range-group-btn"
                            data-branch-index="${branchIndex}"
                            data-range-index="${rangeIndex}"
                            data-group-type="${conditionType}">
                        <i class="bi bi-plus"></i> Add ${logicLabel}
                    </button>
                </div>
        `;

    conditions.forEach((subCondition, conditionIndex) => {
        const hasNestedAnd = subCondition.and && Array.isArray(subCondition.and);
        const hasNestedOr = subCondition.or && Array.isArray(subCondition.or);
        const isDeepNested = hasNestedAnd || hasNestedOr;

        html += `
                <div class="nested-range-condition-item mb-2 p-2 bg-light rounded">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <small class="text-muted">Condition ${conditionIndex + 1}</small>
                        ${conditions.length > 1 ? `
                            <button type="button" 
                                    class="btn btn-sm btn-outline-danger remove-condition-from-range-group-btn"
                                    data-branch-index="${branchIndex}"
                                    data-range-index="${rangeIndex}"
                                    data-condition-index="${conditionIndex}"
                                    data-group-type="${conditionType}">
                                <i class="bi bi-x"></i>
                            </button>
                        ` : ''}
                    </div>

                    ${isDeepNested ? 
                        this.renderDeepNestedCondition(componentIndex, branchIndex, rangeIndex, conditionIndex, subCondition) :
                        this.renderSimpleNestedCondition(componentIndex, branchIndex, rangeIndex, conditionIndex, subCondition)
                    }
                    
                    <!-- ✅ ส่วนที่ 3: Nested Actions (สร้าง sub-group) -->
                    <div class="nested-actions mt-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">Nested Level ${conditionIndex + 2}</small>
                            <button type="button" 
                                    class="btn btn-sm btn-outline-primary add-nested-condition-btn"
                                    data-branch-index="${branchIndex}"
                                    data-range-index="${rangeIndex}"
                                    data-condition-index="${conditionIndex}"
                                    data-nest-type="and">
                                <i class="bi bi-plus"></i> Nested Group
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        return html;
    }

    /**
     * Render simple nested condition (เพิ่ม helper method)
     */
    renderSimpleNestedCondition(componentIndex, branchIndex, rangeIndex, conditionIndex, subCondition) {
        return `
            <div class="simple-nested-wrapper">
                <!-- 🆕 Condition Type Selector สำหรับ nested level -->
                <div class="row g-2 mb-2">
                    <div class="col-md-4">
                        <label class="form-label small">Condition Type:</label>
                        <select class="form-select form-select-sm nested-condition-type-selector" 
                                data-branch-index="${branchIndex}"
                                data-range-index="${rangeIndex}"
                                data-condition-index="${conditionIndex}"
                                data-condition-field="nested_condition_type">
                            <option value="simple" selected>Simple</option>
                            <option value="and">AND Logic</option>
                            <option value="or">OR Logic</option>
                        </select>
                    </div>
                </div>
                
                <!-- Original condition fields -->
                <div class="row g-2">
                    <div class="col-md-3">
                        <select class="form-select form-select-sm nested-range-condition-field" 
                                data-branch-index="${branchIndex}"
                                data-range-index="${rangeIndex}"
                                data-condition-index="${conditionIndex}"
                                data-condition-field="op">
                            ${getOperatorOptions(subCondition.op)}
                        </select>
                    </div>
                    <div class="col-md-4">
                        <input type="text" 
                            class="form-control form-control-sm nested-range-condition-field" 
                            placeholder="Variable"
                            value="${subCondition.var || subCondition.field || ''}"
                            data-branch-index="${branchIndex}"
                            data-range-index="${rangeIndex}"
                            data-condition-index="${conditionIndex}"
                            data-condition-field="var">
                    </div>
                    <div class="col-md-5">
                        <input type="text" 
                            class="form-control form-control-sm nested-range-condition-field" 
                            placeholder="${getValuePlaceholder(subCondition.op)}"
                            value="${this.formatValue(subCondition.value)}"
                            data-branch-index="${branchIndex}"
                            data-range-index="${rangeIndex}"
                            data-condition-index="${conditionIndex}"
                            data-condition-field="value">
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render deep nested condition (เพิ่ม helper method สำหรับ Level 3+)
     */
    renderDeepNestedCondition(componentIndex, branchIndex, rangeIndex, conditionIndex, subCondition) {
    const deepType = subCondition.and ? 'and' : 'or';
    const deepConditions = subCondition[deepType] || [];
    const deepLabel = deepType.toUpperCase();
    
    let html = `
        <div class="deep-nested-section border rounded p-2 bg-white">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-${deepType === 'and' ? 'success' : 'info'} fs-6">${deepLabel} Group</span>
                
                <!-- 🆕 Condition Type Selector สำหรับ deep nested -->
                <select class="form-select form-select-sm deep-condition-type-selector" 
                        style="width: auto;"
                        data-branch-index="${branchIndex}"
                        data-range-index="${rangeIndex}"
                        data-condition-index="${conditionIndex}"
                        data-condition-field="deep_condition_type">
                    <option value="and" ${deepType === 'and' ? 'selected' : ''}>AND Logic</option>
                    <option value="or" ${deepType === 'or' ? 'selected' : ''}>OR Logic</option>
                    <option value="simple">Convert to Simple</option>
                </select>
            </div>
            
            <button type="button" 
                    class="btn btn-sm btn-outline-success mb-2 add-condition-to-deep-group-btn"
                    data-branch-index="${branchIndex}"
                    data-range-index="${rangeIndex}"
                    data-condition-index="${conditionIndex}"
                    data-group-type="${deepType}">
                <i class="bi bi-plus"></i> Add ${deepLabel}
            </button>
    `;

    deepConditions.forEach((deepCond, deepIndex) => {
        // ... existing code สำหรับ render deep conditions
            html += `
                <div class="deep-condition-item mb-2 p-2 bg-light rounded">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <small class="text-muted">Deep Condition ${deepIndex + 1}</small>
                        ${deepConditions.length > 1 ? `
                            <button type="button" 
                                    class="btn btn-sm btn-outline-danger remove-deep-condition-btn"
                                    data-branch-index="${branchIndex}"
                                    data-range-index="${rangeIndex}"
                                    data-condition-index="${conditionIndex}"
                                    data-deep-index="${deepIndex}"
                                    data-group-type="${deepType}">
                                <i class="bi bi-x"></i>
                            </button>
                        ` : ''}
                    </div>
                    
                    <div class="row g-2 mb-2">
                        <div class="col-md-3">
                            <select class="form-select form-select-sm deep-nested-condition-field" 
                                    data-branch-index="${branchIndex}"
                                    data-range-index="${rangeIndex}"
                                    data-condition-index="${conditionIndex}"
                                    data-deep-index="${deepIndex}"
                                    data-condition-field="deep_op">
                                ${getOperatorOptions(deepCond.op)}
                            </select>
                        </div>
                        <div class="col-md-4">
                            <input type="text" 
                                class="form-control form-control-sm deep-nested-condition-field" 
                                placeholder="Variable"
                                value="${deepCond.var || ''}"
                                data-branch-index="${branchIndex}"
                                data-range-index="${rangeIndex}"
                                data-condition-index="${conditionIndex}"
                                data-deep-index="${deepIndex}"
                                data-condition-field="deep_var">
                        </div>
                        <div class="col-md-5">
                            <input type="text" 
                                class="form-control form-control-sm deep-nested-condition-field" 
                                placeholder="${getValuePlaceholder(deepCond.op)}"
                                value="${this.formatValue(deepCond.value)}"
                                data-branch-index="${branchIndex}"
                                data-range-index="${rangeIndex}"
                                data-condition-index="${conditionIndex}"
                                data-deep-index="${deepIndex}"
                                data-condition-field="deep_value">
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        return html;
    }

    renderRecursiveNested(componentIndex, branchIndex, rangeIndex, conditionIndex, deepIndex, deepCond) {
        const recursiveType = deepCond.and ? 'and' : 'or';
        const recursiveConditions = deepCond[recursiveType] || [];
        const recursiveLabel = recursiveType.toUpperCase();
        
        let html = `
            <div class="recursive-nested-section border rounded p-2 bg-warning bg-opacity-10">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge bg-${recursiveType === 'and' ? 'dark' : 'secondary'} fs-6">${recursiveLabel} Level 4+</span>
                    <small class="text-muted">Deep Nesting</small>
                </div>
        `;

        recursiveConditions.forEach((recursiveCond, recursiveIndex) => {
            html += `
                <div class="recursive-condition-item mb-1 p-1 bg-white rounded">
                    <div class="row g-1">
                        <div class="col-md-3">
                            <select class="form-select form-select-sm recursive-nested-condition-field" 
                                    data-branch-index="${branchIndex}"
                                    data-range-index="${rangeIndex}"
                                    data-condition-index="${conditionIndex}"
                                    data-deep-index="${deepIndex}"
                                    data-recursive-index="${recursiveIndex}"
                                    data-condition-field="recursive_op">
                                ${getOperatorOptions(recursiveCond.op)}
                            </select>
                        </div>
                        <div class="col-md-4">
                            <input type="text" 
                                class="form-control form-control-sm recursive-nested-condition-field" 
                                placeholder="Variable"
                                value="${recursiveCond.var || ''}"
                                data-branch-index="${branchIndex}"
                                data-range-index="${rangeIndex}"
                                data-condition-index="${conditionIndex}"
                                data-deep-index="${deepIndex}"
                                data-recursive-index="${recursiveIndex}"
                                data-condition-field="recursive_var">
                        </div>
                        <div class="col-md-5">
                            <input type="text" 
                                class="form-control form-control-sm recursive-nested-condition-field" 
                                placeholder="${getValuePlaceholder(recursiveCond.op)}"
                                value="${this.formatValue(recursiveCond.value)}"
                                data-branch-index="${branchIndex}"
                                data-range-index="${rangeIndex}"
                                data-condition-index="${conditionIndex}"
                                data-deep-index="${deepIndex}"
                                data-recursive-index="${recursiveIndex}"
                                data-condition-field="recursive_value">
                        </div>
                    </div>
                    
                    ${recursiveCond.and || recursiveCond.or ? 
                        // 🔥 ถ้ามี nested อีก ให้แสดงเป็น text เพื่อป้องกัน infinite recursion
                        `<div class="mt-1">
                            <small class="text-muted">
                                <i class="bi bi-info-circle"></i> 
                                Contains ${recursiveCond.and ? 'AND' : 'OR'} sub-conditions (${(recursiveCond.and || recursiveCond.or).length} items)
                            </small>
                        </div>` :
                        // 🔥 ถ้ายังไม่มี nested ให้แสดงปุ่มเพิ่ม
                        `<div class="recursive-actions mt-1">
                            <div class="btn-group btn-group-sm">
                                <button type="button" 
                                        class="btn btn-outline-primary btn-xs add-recursive-nested-condition-btn"
                                        data-branch-index="${branchIndex}"
                                        data-range-index="${rangeIndex}"
                                        data-condition-index="${conditionIndex}"
                                        data-deep-index="${deepIndex}"
                                        data-recursive-index="${recursiveIndex}"
                                        data-nest-type="and">
                                    <i class="bi bi-plus"></i> AND
                                </button>
                                <button type="button" 
                                        class="btn btn-outline-warning btn-xs add-recursive-nested-condition-btn"
                                        data-branch-index="${branchIndex}"
                                        data-range-index="${rangeIndex}"
                                        data-condition-index="${conditionIndex}"
                                        data-deep-index="${deepIndex}"
                                        data-recursive-index="${recursiveIndex}"
                                        data-nest-type="or">
                                    <i class="bi bi-plus"></i> OR
                                </button>
                            </div>
                        </div>`
                    }
                </div>
            `;
        });

        html += `</div>`;
        return html;
    }


    /**
     * Update recursive nested range condition (เพิ่ม method สำหรับ Level 4+)
     */
    updateRecursiveNestedRangeCondition(branchIndex, rangeIndex, conditionIndex, deepIndex, recursiveIndex, field, value) {
        if (!this.scoring.ifs.tree[branchIndex] || 
            !this.scoring.ifs.tree[branchIndex].ranges[rangeIndex]) return;

        const rangeIf = this.scoring.ifs.tree[branchIndex].ranges[rangeIndex].if;
        let targetCondition = null;

        if (rangeIf.and && rangeIf.and[conditionIndex]) {
            targetCondition = rangeIf.and[conditionIndex];
        } else if (rangeIf.or && rangeIf.or[conditionIndex]) {
            targetCondition = rangeIf.or[conditionIndex];
        }

        if (targetCondition) {
            let deepCondition = null;
            
            if (targetCondition.and && targetCondition.and[deepIndex]) {
                deepCondition = targetCondition.and[deepIndex];
            } else if (targetCondition.or && targetCondition.or[deepIndex]) {
                deepCondition = targetCondition.or[deepIndex];
            }

            if (deepCondition) {
                let recursiveCondition = null;
                
                if (deepCondition.and && deepCondition.and[recursiveIndex]) {
                    recursiveCondition = deepCondition.and[recursiveIndex];
                } else if (deepCondition.or && deepCondition.or[recursiveIndex]) {
                    recursiveCondition = deepCondition.or[recursiveIndex];
                }

                if (recursiveCondition) {
                    if (field === 'recursive_op') {
                        recursiveCondition.op = value;
                    } else if (field === 'recursive_var') {
                        recursiveCondition.var = value;
                    } else if (field === 'recursive_value') {
                        recursiveCondition.value = this.parseValue(value);
                    }
                }
            }
        }
    }

    /**
     * Add recursive nested condition (เพิ่ม method สำหรับ Level 5+)
     */
    addRecursiveNestedCondition(branchIndex, rangeIndex, conditionIndex, deepIndex, recursiveIndex, nestType) {
        if (!this.scoring.ifs.tree[branchIndex] || 
            !this.scoring.ifs.tree[branchIndex].ranges[rangeIndex]) return;

        const rangeIf = this.scoring.ifs.tree[branchIndex].ranges[rangeIndex].if;
        let targetCondition = null;

        if (rangeIf.and && rangeIf.and[conditionIndex]) {
            targetCondition = rangeIf.and[conditionIndex];
        } else if (rangeIf.or && rangeIf.or[conditionIndex]) {
            targetCondition = rangeIf.or[conditionIndex];
        }

        if (targetCondition) {
            let deepCondition = null;
            
            if (targetCondition.and && targetCondition.and[deepIndex]) {
                deepCondition = targetCondition.and[deepIndex];
            } else if (targetCondition.or && targetCondition.or[deepIndex]) {
                deepCondition = targetCondition.or[deepIndex];
            }

            if (deepCondition) {
                let recursiveCondition = null;
                
                if (deepCondition.and && deepCondition.and[recursiveIndex]) {
                    recursiveCondition = deepCondition.and[recursiveIndex];
                } else if (deepCondition.or && deepCondition.or[recursiveIndex]) {
                    recursiveCondition = deepCondition.or[recursiveIndex];
                }

                if (recursiveCondition) {
                    // สร้าง Level 5+ (จำกัดไว้ที่ Level 5 เพื่อป้องกัน infinite recursion)
                    const existingData = {
                        op: recursiveCondition.op || '==',
                        var: recursiveCondition.var || '',
                        value: recursiveCondition.value || ''
                    };

                    if (nestType === 'and') {
                        recursiveCondition.and = [
                            existingData,
                            { op: '==', value: '' }
                        ];
                    } else if (nestType === 'or') {
                        recursiveCondition.or = [
                            existingData,
                            { op: '==', value: '' }
                        ];
                    }

                    delete recursiveCondition.op;
                    delete recursiveCondition.var;
                    delete recursiveCondition.value;
                }
            }
        }
    }

    /**
     * Update nested condition type (เพิ่ม method ใหม่)
     */
    updateNestedConditionType(branchIndex, rangeIndex, conditionIndex, conditionType) {
        if (!this.scoring.ifs.tree[branchIndex] || 
            !this.scoring.ifs.tree[branchIndex].ranges[rangeIndex]) return;

        const rangeIf = this.scoring.ifs.tree[branchIndex].ranges[rangeIndex].if;
        let targetCondition = null;

        if (rangeIf.and && rangeIf.and[conditionIndex]) {
            targetCondition = rangeIf.and[conditionIndex];
        } else if (rangeIf.or && rangeIf.or[conditionIndex]) {
            targetCondition = rangeIf.or[conditionIndex];
        }

        if (targetCondition) {
            if (conditionType === 'simple') {
                // Convert back to simple
                const firstCondition = targetCondition.and ? targetCondition.and[0] : 
                                    targetCondition.or ? targetCondition.or[0] : 
                                    { op: '==', value: '' };
                
                targetCondition.op = firstCondition.op;
                targetCondition.var = firstCondition.var;
                targetCondition.value = firstCondition.value;
                
                delete targetCondition.and;
                delete targetCondition.or;
            } else if (conditionType === 'and') {
                const existingData = {
                    op: targetCondition.op || '==',
                    var: targetCondition.var || '',
                    value: targetCondition.value || ''
                };
                
                targetCondition.and = [existingData, { op: '==', value: '' }];
                delete targetCondition.or;
                delete targetCondition.op;
                delete targetCondition.var;
                delete targetCondition.value;
            } else if (conditionType === 'or') {
                const existingData = {
                    op: targetCondition.op || '==',
                    var: targetCondition.var || '',
                    value: targetCondition.value || ''
                };
                
                targetCondition.or = [existingData, { op: '==', value: '' }];
                delete targetCondition.and;
                delete targetCondition.op;
                delete targetCondition.var;
                delete targetCondition.value;
            }
        }
    }

    /**
     * Update deep condition type (เพิ่ม method ใหม่)
     */
    updateDeepConditionType(branchIndex, rangeIndex, conditionIndex, conditionType) {
        if (!this.scoring.ifs.tree[branchIndex] || 
            !this.scoring.ifs.tree[branchIndex].ranges[rangeIndex]) return;

        const rangeIf = this.scoring.ifs.tree[branchIndex].ranges[rangeIndex].if;
        let targetCondition = null;

        if (rangeIf.and && rangeIf.and[conditionIndex]) {
            targetCondition = rangeIf.and[conditionIndex];
        } else if (rangeIf.or && rangeIf.or[conditionIndex]) {
            targetCondition = rangeIf.or[conditionIndex];
        }

        if (targetCondition) {
            if (conditionType === 'simple') {
                // Convert deep nested back to simple
                const firstCondition = targetCondition.and ? targetCondition.and[0] : 
                                    targetCondition.or ? targetCondition.or[0] : 
                                    { op: '==', value: '' };
                
                targetCondition.op = firstCondition.op;
                targetCondition.var = firstCondition.var;
                targetCondition.value = firstCondition.value;
                
                delete targetCondition.and;
                delete targetCondition.or;
            } else if (conditionType === 'and' && targetCondition.or) {
                // Convert OR to AND
                targetCondition.and = targetCondition.or;
                delete targetCondition.or;
            } else if (conditionType === 'or' && targetCondition.and) {
                // Convert AND to OR
                targetCondition.or = targetCondition.and;
                delete targetCondition.and;
            }
        }
    }


    getBranchNestedCondition(branchIndex, path) {
        if (!this.scoring.ifs.tree[branchIndex]) return null;
        
        let condition = this.scoring.ifs.tree[branchIndex].if;
        
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


    updateBranchConditionTypeByPath(branchIndex, path, conditionType) {
        const condition = this.getBranchNestedCondition(branchIndex, path);
        if (!condition) return;

        if (conditionType === 'simple') {
            Object.keys(condition).forEach(key => delete condition[key]);
            Object.assign(condition, { op: '>=', value: 0 });
        } else if (conditionType === 'and') {
            Object.keys(condition).forEach(key => delete condition[key]);
            Object.assign(condition, {
                and: [
                    { op: '>', value: '' },
                    { op: '>', value: '' }
                ]
            });
        } else if (conditionType === 'or') {
            Object.keys(condition).forEach(key => delete condition[key]);
            Object.assign(condition, {
                or: [
                    { op: '>', value: '' },
                    { op: '>', value: '' }
                ]
            });
        }
    }


    addConditionToBranchGroupByPath(branchIndex, path, groupType) {
        const condition = this.getBranchNestedCondition(branchIndex, path);
        if (!condition) return;

        const newCondition = { op: '>', value: '' };

        if (groupType === 'and' && condition.and) {
            condition.and.push(newCondition);
        } else if (groupType === 'or' && condition.or) {
            condition.or.push(newCondition);
        }
    }

    removeBranchConditionByPath(branchIndex, path, conditionIndex, groupType) {
        const condition = this.getBranchNestedCondition(branchIndex, path);
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


    updateBranchConditionByPath(branchIndex, path, field, value) {
        const condition = this.getBranchNestedCondition(branchIndex, path);
        if (!condition) return;

        if (field === 'op') {
            condition.op = value;
        } else if (field === 'var') {
            condition.var = value;
        } else if (field === 'value') {
            condition.value = this.parseValue(value);
        }

        const orderedCondition = {
            op: condition.op || '>='
        };

        // เพิ่ม var เฉพาะเมื่อไม่ว่าง
        if (condition.var && condition.var.trim() !== '') {
            orderedCondition.var = condition.var;
        }

        orderedCondition.value = condition.value;

        Object.keys(condition).forEach(key => delete condition[key]);
        Object.assign(condition, orderedCondition);

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
            scoring: this.cleanScoringData(this.scoring) 
        };

        if (this.as && this.as.trim() !== '') {
            json.as = this.as.trim();
        }

        return json;
    }

    /**
     * Load from JSON configuration
     */
    fromJSON(json) {
        this.id = json.id || this.id;
        this.scoring = json.scoring || { ifs: { vars: [], tree: [] } };
        this.as = json.as || '';
    }

    cleanScoringData(scoring) {
        const cleaned = {
            ifs: {
                vars: scoring.ifs.vars || [],
                tree: []
            }
        };

        if (scoring.ifs.tree) {
            cleaned.ifs.tree = scoring.ifs.tree.map(branch => {
                const cleanedBranch = {
                    if: branch.if,
                    ranges: []
                };

                if (branch.ranges) {
                    cleanedBranch.ranges = branch.ranges.map(range => {
                        const cleanedRange = {
                            if: range.if,
                            score: range.score
                        };

                        // 🔥 เพิ่ม set_vars เฉพาะเมื่อมีข้อมูล
                        if (range.set_vars && Object.keys(range.set_vars).length > 0) {
                            cleanedRange.set_vars = range.set_vars;
                        }

                        // 🔥 เพิ่ม custom fields อื่นๆ
                        Object.keys(range).forEach(key => {
                            if (!['if', 'score', 'set_vars'].includes(key) && 
                                range[key] !== '' && range[key] !== null && range[key] !== undefined) {
                                cleanedRange[key] = range[key];
                            }
                        });

                        return cleanedRange;
                    });
                }

                return cleanedBranch;
            });
        }

        return cleaned;
    }

}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScoringComponent;
} else {
    window.ScoringComponent = ScoringComponent;
}