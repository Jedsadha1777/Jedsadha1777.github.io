/**
 * RuleFlow UI - Interface Management
 * jQuery-based UI controller for basic version
 */

const RuleFlowUI = {
    currentConfig: null,
    ruleFlow: null,
    debugEnabled: true,

    /**
     * Initialize the UI
     */
    init() {
        this.ruleFlow = new RuleFlow();
        this.bindEvents();
        this.initializeDebugConsole();
        this.debug('RuleFlow UI initialized', 'success');
    },

    /**
     * Bind all UI events
     */
    bindEvents() {
        // Button events
        $('#validateBtn').on('click', () => this.validateConfiguration());
        $('#executeBtn').on('click', () => this.executeRules());
        $('#generateCodeBtn').on('click', () => this.generateCode());
        $('#copyCodeBtn').on('click', () => this.copyCode());
        $('#addCustomBtn').on('click', () => this.addCustomVariable());

        // Configuration editor events
        $('#configEditor').on('input', () => {
            this.debounce(() => {
                this.updateInputVariables();
            }, 500);
        });

        // Input change events
        $(document).on('input', '.input-variable input', () => {
            this.debounce(() => {
                this.autoExecute();
            }, 300);
        });

        this.debug('UI events bound', 'info');
    },

    /**
     * Initialize debug console
     */
    initializeDebugConsole() {
        // Toggle debug console with Ctrl+Shift+D
        $(document).on('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                this.toggleDebugConsole();
            }
        });
    },

    /**
     * Toggle debug console visibility
     */
    toggleDebugConsole() {
        const $debugSection = $('#debugSection');
        if ($debugSection.is(':visible')) {
            $debugSection.hide();
            this.debug('Debug console hidden', 'info');
        } else {
            $debugSection.show();
            this.debug('Debug console shown', 'info');
        }
    },

    /**
     * Update input variables based on current configuration
     */
    // updateInputVariables() {
    //     const config = this.getCurrentConfig();
    //     if (!config) return;

    //     const inputs = this.extractInputVariables(config);
    //     this.renderInputVariables(inputs);
    //     this.debug(`Updated input variables: ${inputs.join(', ')}`, 'info');
    // },

    /**
     * Extract input variables from configuration
     */
    extractInputVariables(config) {
        const inputs = new Set();
        const calculatedValues = new Set(); // Track calculated values
        
        if (config.formulas) {
            // First pass: collect calculated values
            config.formulas.forEach(formula => {
                calculatedValues.add(formula.id);
                if (formula.as) {
                    const varName = formula.as.startsWith('$') ? 
                        formula.as.substring(1) : formula.as;
                    calculatedValues.add(varName);
                }
            });

            // Second pass: extract input variables
            config.formulas.forEach(formula => {
                if (formula.formula) {
                    const variables = formula.formula.match(/\$(\w+)/g);
                    if (variables) {
                        variables.forEach(variable => {
                            const varName = variable.substring(1);
                            if (!calculatedValues.has(varName)) {
                                inputs.add(varName);
                            }
                        });
                    }
                }

                // Extract from switch variable
                if (formula.switch) {
                    const switchVar = formula.switch.startsWith('$') ? 
                        formula.switch.substring(1) : formula.switch;
                    if (!calculatedValues.has(switchVar)) {
                        inputs.add(switchVar);
                    }
                }

                // Extract from conditions
                if (formula.conditions) {
                    this.extractVariablesFromConditions(formula.conditions, inputs, calculatedValues);
                }

                if (formula.when) {
                    this.extractVariablesFromConditions(formula.when, inputs, calculatedValues);
                }
            });
        }
        
        return Array.from(inputs);
    },

    /**
     * Extract variables from conditions array
     */
    extractVariablesFromConditions(conditions, inputs, calculatedValues) {
        if (!Array.isArray(conditions)) return;
        
        conditions.forEach(condition => {
            if (condition.if) {
                this.extractVariablesFromCondition(condition.if, inputs, calculatedValues);
            }
            
            // Direct field references
            if (condition.field) {
                const fieldName = condition.field.startsWith('$') ? 
                    condition.field.substring(1) : condition.field;
                if (!calculatedValues.has(fieldName)) {
                    inputs.add(fieldName);
                }
            }
            
            if (condition.var) {
                const varName = condition.var.startsWith('$') ? 
                    condition.var.substring(1) : condition.var;
                if (!calculatedValues.has(varName)) {
                    inputs.add(varName);
                }
            }
        });
    },

    /**
     * Extract variables from nested condition structure
     */
    extractVariablesFromCondition(condition, inputs, calculatedValues) {
        if (condition.and && Array.isArray(condition.and)) {
            condition.and.forEach(sub => 
                this.extractVariablesFromCondition(sub, inputs, calculatedValues));
        }
        
        if (condition.or && Array.isArray(condition.or)) {
            condition.or.forEach(sub => 
                this.extractVariablesFromCondition(sub, inputs, calculatedValues));
        }
        
        if (condition.field) {
            const fieldName = condition.field.startsWith('$') ? 
                condition.field.substring(1) : condition.field;
            if (!calculatedValues.has(fieldName)) {
                inputs.add(fieldName);
            }
        }
        
        if (condition.var) {
            const varName = condition.var.startsWith('$') ? 
                condition.var.substring(1) : condition.var;
            if (!calculatedValues.has(varName)) {
                inputs.add(varName);
            }
        }
    },

    /**
     * Render input variables in UI
     */
    renderInputVariables(inputs) {
        const $container = $('#inputVariables');
        
        if (inputs.length === 0) {
            $container.html('<p class="text-muted mb-0">Add components to see input variables</p>');
            return;
        }
        
        $container.empty();
        
        inputs.forEach(input => {
            const $inputDiv = $(`
                <div class="input-variable mb-2" data-input="${input}">
                    <label class="form-label small">${input}</label>
                    <input type="number" 
                           class="form-control form-control-sm" 
                           id="input_${input}" 
                           placeholder="Enter ${input}"
                           step="any">
                </div>
            `);
            
            $container.append($inputDiv);
        });
    },

    /**
     * Get current configuration from components
     */
    // getCurrentConfig() {
    //     try {
    //         // This should be implemented to get config from components
    //         // For now, return null to indicate no config available
    //         return null;
    //     } catch (error) {
    //         this.debug(`Error getting current config: ${error.message}`, 'error');
    //         return null;
    //     }
    // },

    /**
     * Get current input values
     */
    getCurrentInputs() {
        const inputs = {};
        
        $('.input-variable input').each(function() {
            const $input = $(this);
            const value = $input.val();
            const name = $input.attr('id').replace('input_', '');
            
            if (value !== '') {
                inputs[name] = parseFloat(value) || value;
            }
        });
        
        return inputs;
    },

    /**
     * Validate current configuration
     */
    validateConfiguration() {
        const config = this.getCurrentConfig();
        if (!config) {
            this.showError('No configuration available to validate');
            return;
        }

        const validation = this.ruleFlow.validateConfig(config);
        
        if (validation.valid) {
            this.showSuccess('Configuration is valid!');
            if (validation.warnings.length > 0) {
                this.showWarning(`Warnings: ${validation.warnings.join(', ')}`);
            }
        } else {
            this.showError(`Validation failed: ${validation.errors.join(', ')}`);
        }
        
        this.debug(`Validation result: ${validation.valid}`, 
                  validation.valid ? 'success' : 'error');
    },

    /**
     * Execute rules with current inputs
     */
    async executeRules() {
        const config = this.getCurrentConfig();
        const inputs = this.getCurrentInputs();
        
        if (!config) {
            this.showError('No configuration available to execute');
            return;
        }

        if (Object.keys(inputs).length === 0) {
            this.showWarning('No input values provided');
        }

        try {
            const result = await this.ruleFlow.evaluate(config, inputs);
            
            if (result.success) {
                this.showResults(result.results, result.executionTime);
                this.debug(`Execution successful in ${result.executionTime}ms`, 'success');
            } else {
                this.showError(`Execution failed: ${result.error}`);
                this.debug(`Execution failed: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showError(`Execution error: ${error.message}`);
            this.debug(`Execution error: ${error.message}`, 'error');
        }
    },

    /**
     * Auto-execute rules (for real-time updates)
     */
    async autoExecute() {
        const config = this.getCurrentConfig();
        const inputs = this.getCurrentInputs();
        
        if (!config || Object.keys(inputs).length === 0) {
            return;
        }

        try {
            const result = await this.ruleFlow.evaluate(config, inputs);
            if (result.success) {
                this.showResults(result.results, result.executionTime, true);
            }
        } catch (error) {
            this.debug(`Auto-execution failed: ${error.message}`, 'warning');
        }
    },

    /**
     * Generate JavaScript code
     */
    generateCode() {
        /*const config = window.getCurrentConfig ? window.getCurrentConfig() : null; 

        if (!config) {
            this.showError('No configuration available for code generation');
            return;
        }

        try {
            const generatedCode = this.ruleFlow.generateCode(config);
            $('#generatedCode').val(generatedCode);
            this.showSuccess('Code generated successfully!');
            this.debug('Code generation successful', 'success');
        } catch (error) {
            this.showError(`Code generation failed: ${error.message}`);
            this.debug(`Code generation failed: ${error.message}`, 'error');
        }*/
    },

    /**
     * Copy generated code to clipboard
     */
    copyCode() {
        const $codeElement = $('#generatedCode');
        if (!$codeElement.val()) {
            this.showWarning('No code to copy. Generate code first.');
            return;
        }

        $codeElement.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showCopyFeedback();
                this.debug('Code copied to clipboard', 'success');
            } else {
                this.showError('Failed to copy code');
            }
        } catch (error) {
            this.showError('Copy not supported in this browser');
        }
    },

    /**
     * Add custom variable input
     */
    addCustomVariable() {
        const name = prompt('Variable name:');
        if (!name || name.trim() === '') return;

        const cleanName = name.trim().replace(/[^a-zA-Z0-9_]/g, '');
        if (cleanName !== name.trim()) {
            this.showWarning('Variable name cleaned to: ' + cleanName);
        }

        // Check if already exists
        if ($(`#input_${cleanName}`).length > 0) {
            this.showWarning('Variable already exists');
            return;
        }

        const $inputDiv = $(`
            <div class="input-variable mb-2" data-input="${cleanName}">
                <label class="form-label small">${cleanName} (custom)</label>
                <div class="input-group input-group-sm">
                    <input type="number" 
                           class="form-control" 
                           id="input_${cleanName}" 
                           placeholder="Enter ${cleanName}"
                           step="any">
                    <button class="btn btn-outline-danger btn-remove-var" 
                            data-var="${cleanName}" 
                            type="button">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `);

        $('#inputVariables').append($inputDiv);

        // Bind remove event
        $inputDiv.find('.btn-remove-var').on('click', (e) => {
            const varName = $(e.currentTarget).data('var');
            $(`.input-variable[data-input="${varName}"]`).remove();
            this.debug(`Removed custom variable: ${varName}`, 'info');
        });

        this.debug(`Added custom variable: ${cleanName}`, 'info');
    },

    /**
     * Show results in panel
     */
    showResults(results, executionTime, isAuto = false) {
        const $panel = $('#resultsPanel');
        $panel.removeClass('error-panel warning-panel').addClass('result-panel');
        
        const title = isAuto ? 'Auto Results' : 'Execution Results';
        let html = `<h6>${title}</h6>`;
        
        if (Object.keys(results).length === 0) {
            html += '<p class="text-muted mb-0">No results</p>';
        } else {
            html += '<div class="results-grid">';
            Object.entries(results).forEach(([key, value]) => {
                html += `
                    <div class="result-item d-flex justify-content-between">
                        <span class="fw-semibold">${key}:</span>
                        <span class="text-primary">${this.formatValue(value)}</span>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        if (executionTime !== undefined) {
            html += `<small class="text-muted d-block mt-2">Execution time: ${executionTime}ms</small>`;
        }
        
        $panel.html(html);
    },

    /**
     * Format value for display
     */
    formatValue(value) {
        if (typeof value === 'number') {
            return Number.isInteger(value) ? value.toString() : value.toFixed(3);
        }
        return value;
    },

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    },

    /**
     * Show error message
     */
    showError(message) {
        this.showToast(message, 'error');
    },

    /**
     * Show warning message
     */
    showWarning(message) {
        this.showToast(message, 'warning');
    },

    /**
     * Show copy feedback
     */
    showCopyFeedback() {
        this.showSuccess('Code copied to clipboard!');
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        if ($('#toastContainer').length === 0) {
            $('body').append('<div id="toastContainer" class="position-fixed top-0 end-0 p-3" style="z-index: 1050;"></div>');
        }
        
        const toastId = 'toast_' + Date.now();
        const bgClass = type === 'success' ? 'bg-success' : 
                       type === 'error' ? 'bg-danger' : 
                       type === 'warning' ? 'bg-warning' : 'bg-info';
        
        const $toast = $(`
            <div id="${toastId}" class="toast ${bgClass} text-white" role="alert">
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `);
        
        $('#toastContainer').append($toast);
        
        // Initialize and show toast
        const toast = new bootstrap.Toast($toast[0], { delay: 3000 });
        toast.show();
        
        // Remove after hide
        $toast.on('hidden.bs.toast', function() {
            $(this).remove();
        });
    },

    /**
     * Debug logging
     */
    debug(message, type = 'info') {
        if (!this.debugEnabled) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '❌' : 
                      type === 'warning' ? '⚠️' : 
                      type === 'success' ? '✅' : 'ℹ️';
        
        console.log(`[${timestamp}] ${prefix} ${message}`);
        
        // Add to debug console if visible
        const $debugConsole = $('#debugConsole');
        if ($debugConsole.length && $('#debugSection').is(':visible')) {
            const $logEntry = $(`<div class="debug-entry text-${type}">[${timestamp}] ${message}</div>`);
            $debugConsole.append($logEntry);
            $debugConsole.scrollTop($debugConsole[0].scrollHeight);
        }
    },

    /**
     * Debounce utility function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Initialize when DOM is ready
$(document).ready(() => {
    RuleFlowUI.init();
});

// Export for global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RuleFlowUI;
} else {
    window.RuleFlowUI = RuleFlowUI;
}