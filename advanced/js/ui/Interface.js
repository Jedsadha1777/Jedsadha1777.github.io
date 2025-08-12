/**
 * RuleFlow UI - Interface Management
 * jQuery-based UI controller
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
     * Update input variables based on current configuration
     */
    updateInputVariables() {
        const config = this.getCurrentConfig();
        if (!config) return;

        const inputs = this.extractInputVariables(config);
        this.renderInputVariables(inputs);
        this.debug(`Updated input variables: ${inputs.join(', ')}`, 'info');
    },

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
                    const varName = formula.as.startsWith('$') ? formula.as.substring(1) : formula.as;
                    calculatedValues.add(varName);
                }
            });
            
            // Second pass: collect true inputs
            config.formulas.forEach(formula => {
                // Extract from inputs array
                if (formula.inputs) {
                    formula.inputs.forEach(input => {
                        if (!input.startsWith('$') && !calculatedValues.has(input)) {
                            inputs.add(input);
                        }
                    });
                }
                
                // Extract from switch variables
                if (formula.switch && !formula.switch.startsWith('$') && !calculatedValues.has(formula.switch)) {
                    inputs.add(formula.switch);
                }
                
                // Extract from conditions
                if (formula.conditions) {
                    formula.conditions.forEach(cond => {
                        this.extractInputsFromCondition(cond.condition, inputs, calculatedValues);
                    });
                }
                
                // Extract from switch when clauses
                if (formula.when) {
                    formula.when.forEach(when => {
                        this.extractInputsFromCondition(when.if, inputs, calculatedValues);
                    });
                }
            });
        }

        return Array.from(inputs);
    },

    /**
     * Extract inputs from nested conditions
     */
    extractInputsFromCondition(condition, inputs, calculatedValues = new Set()) {
        if (!condition) return;

        // Handle field/var references
        if (condition.field && !condition.field.startsWith('$') && !calculatedValues.has(condition.field)) {
            inputs.add(condition.field);
        }
        if (condition.var && !condition.var.startsWith('$') && !calculatedValues.has(condition.var)) {
            inputs.add(condition.var);
        }

        // Handle AND/OR nested conditions
        if (condition.and && Array.isArray(condition.and)) {
            condition.and.forEach(sub => this.extractInputsFromCondition(sub, inputs, calculatedValues));
        }
        if (condition.or && Array.isArray(condition.or)) {
            condition.or.forEach(sub => this.extractInputsFromCondition(sub, inputs, calculatedValues));
        }
    },

    /**
     * Render input variables in UI
     */
    renderInputVariables(inputs) {
        const $panel = $('#inputVariables');
        $panel.empty();

        if (inputs.length === 0) {
            $panel.html('<p class="text-muted mb-0">No input variables detected</p>');
            return;
        }

        inputs.forEach(input => {
            let inputHTML;
            
            // Special handling for specific variables
            if (input === 'risk_category') {
                inputHTML = `
                    <div class="input-variable" data-input="${input}">
                        <label class="form-label small">${input}</label>
                        <select class="form-control form-control-sm" id="input_${input}">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                `;
            } else {
                inputHTML = `
                    <div class="input-variable" data-input="${input}">
                        <label class="form-label small">${input}</label>
                        <input type="number" 
                            class="form-control form-control-sm" 
                            id="input_${input}" 
                            placeholder="Enter ${input}"
                            step="any">
                    </div>
                `;
            }
            
            $panel.append($(inputHTML));
        });
    },

    /**
     * Set input values programmatically
     */
    setInputValues(values) {
        Object.keys(values).forEach(key => {
            const $input = $(`#input_${key}`);
            if ($input.length) {
                $input.val(values[key]);
                console.log(`Set ${key} = ${values[key]}`); // Debug log
            }
        });
        this.debug(`Set input values: ${JSON.stringify(values)}`, 'info');
    },

    /**
     * Get current configuration from editor
     */
    getCurrentConfig() {
        try {
            const configText = $('#configEditor').val().trim();
            if (!configText) return null;
            
            this.currentConfig = JSON.parse(configText);
            return this.currentConfig;
        } catch (error) {
            this.debug(`Configuration parse error: ${error.message}`, 'error');
            return null;
        }
    },

    /**
     * Get current input values
     */
    getCurrentInputs() {
        const inputs = {};
        $('.input-variable input, .input-variable select').each(function() {
            const $element = $(this);
            const key = $element.attr('id').replace('input_', '');
            const value = $element.val();
            
            if (value !== '') {
                // Handle different input types
                if ($element.is('select') || isNaN(value)) {
                    // Keep as string for select boxes and non-numeric values
                    inputs[key] = value;
                } else {
                    // Try to parse as number
                    const numValue = parseFloat(value);
                    inputs[key] = isNaN(numValue) ? value : numValue;
                }
            }
        });
        
        console.log('getCurrentInputs result:', inputs); // Debug log
        return inputs;
    },

    /**
     * Validate configuration
     */
    validateConfiguration() {
        const config = this.getCurrentConfig();
        const $resultsPanel = $('#resultsPanel');
        
        if (!config) {
            this.showError('Invalid JSON configuration');
            return false;
        }

        try {
            const validation = this.ruleFlow.validateConfig(config);
            
            if (validation.valid) {
                this.showSuccess('✅ Configuration Valid: Ready to execute');
                this.debug('Configuration validation passed', 'success');
                return true;
            } else {
                this.showError(`Validation Error: ${validation.errors.join(', ')}`);
                this.debug(`Validation errors: ${validation.errors.join(', ')}`, 'error');
                return false;
            }
        } catch (error) {
            this.showError(`Validation Error: ${error.message}`);
            this.debug(`Validation exception: ${error.message}`, 'error');
            return false;
        }
    },

    /**
     * Execute rules
     */
    async executeRules() {
        const config = this.getCurrentConfig();
        const inputs = this.getCurrentInputs();
        
        if (!config) {
            this.showError('Please enter a valid configuration');
            return;
        }

        if (Object.keys(inputs).length === 0) {
            this.showWarning('No input values provided');
        }

        try {
            this.showLoading('Executing rules...');
            this.debug(`Executing with inputs: ${JSON.stringify(inputs)}`, 'info');

            const result = await this.ruleFlow.evaluate(config, inputs);
            
            $('#executionTime').text(result.executionTime);

            if (result.success) {
                this.showResults(result.results);
                this.debug(`Execution successful in ${result.executionTime}`, 'success');
            } else {
                this.showError(`Execution Failed: ${result.error}`);
                this.debug(`Execution failed: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showError(`Execution Error: ${error.message}`);
            this.debug(`Execution exception: ${error.message}`, 'error');
        }
    },

    /**
     * Auto-execute rules on input change
     */
    async autoExecute() {
        const config = this.getCurrentConfig();
        if (!config) return;

        try {
            const inputs = this.getCurrentInputs();
            if (Object.keys(inputs).length > 0) {
                const result = await this.ruleFlow.evaluate(config, inputs);
                if (result.success) {
                    this.showResults(result.results, true);
                }
            }
        } catch (error) {
            // Silently fail auto-execution
            this.debug(`Auto-execution failed: ${error.message}`, 'warning');
        }
    },

    /**
     * Generate JavaScript code
     */
    generateCode() {
        const config = this.getCurrentConfig();
        if (!config) {
            this.showError('Please enter a valid configuration');
            return;
        }

        try {
            const generatedCode = this.ruleFlow.generateCode(config);
            $('#generatedCode').val(generatedCode);
            this.debug('Code generation successful', 'success');
        } catch (error) {
            this.showError(`Code Generation Error: ${error.message}`);
            this.debug(`Code generation failed: ${error.message}`, 'error');
        }
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
            <div class="input-variable" data-input="${cleanName}">
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
    showResults(results, isAuto = false) {
        const $panel = $('#resultsPanel');
        $panel.removeClass('error-panel warning-panel').addClass('result-panel');
        
        const title = isAuto ? '⚡ Auto-Update' : '✅ Execution Successful';
        const resultsHtml = this.formatResults(results);
        
        $panel.html(`
            <h6>${title}</h6>
            <pre class="mb-0">${resultsHtml}</pre>
        `);
    },

    /**
     * Format results for display
     */
    formatResults(results) {
        const formatted = {};
        Object.keys(results).forEach(key => {
            const value = results[key];
            if (typeof value === 'number') {
                formatted[key] = Math.round(value * 100000) / 100000; // Round to 5 decimals
            } else {
                formatted[key] = value;
            }
        });
        return JSON.stringify(formatted, null, 2);
    },

    /**
     * Show error message
     */
    showError(message) {
        const $panel = $('#resultsPanel');
        $panel.removeClass('result-panel warning-panel').addClass('error-panel');
        $panel.html(`<h6>❌ Error</h6><p class="mb-0">${message}</p>`);
    },

    /**
     * Show warning message
     */
    showWarning(message) {
        const $panel = $('#resultsPanel');
        $panel.removeClass('result-panel error-panel').addClass('warning-panel');
        $panel.html(`<h6>⚠️ Warning</h6><p class="mb-0">${message}</p>`);
    },

    /**
     * Show success message
     */
    showSuccess(message) {
        const $panel = $('#resultsPanel');
        $panel.removeClass('error-panel warning-panel').addClass('result-panel');
        $panel.html(`<p class="mb-0">${message}</p>`);
    },

    /**
     * Show loading state
     */
    showLoading(message) {
        const $panel = $('#resultsPanel');
        $panel.removeClass('error-panel warning-panel').addClass('result-panel');
        $panel.html(`
            <div class="d-flex align-items-center">
                <div class="spinner me-2"></div>
                <span>${message}</span>
            </div>
        `);
    },

    /**
     * Show copy feedback
     */
    showCopyFeedback() {
        const $button = $('#copyCodeBtn');
        const originalHtml = $button.html();
        
        $button.html('<i class="bi bi-check"></i> Copied!');
        $button.removeClass('btn-outline-success').addClass('btn-success');
        
        setTimeout(() => {
            $button.html(originalHtml);
            $button.removeClass('btn-success').addClass('btn-outline-success');
        }, 2000);
    },

    /**
     * Initialize debug console
     */
    initializeDebugConsole() {
        // Show debug section if in development
        if (this.debugEnabled && window.location.hostname === 'localhost') {
            $('#debugSection').show();
        }
    },

    /**
     * Debug logging
     */
    debug(message, type = 'info') {
        if (!this.debugEnabled) return;

        const timestamp = new Date().toLocaleTimeString();
        const $console = $('#debugConsole');
        
        const $logEntry = $(`
            <div class="debug-log debug-${type}">
                [${timestamp}] ${message}
            </div>
        `);

        $console.append($logEntry);
        
        // Auto-scroll to bottom
        $console.scrollTop($console[0].scrollHeight);
        
        // Limit log entries
        const $logs = $console.find('.debug-log');
        if ($logs.length > 100) {
            $logs.first().remove();
        }

        // Console log for development
        console.log(`[RuleFlowUI] ${message}`);
    },

    /**
     * Utility: Debounce function
     */
    debounce(func, wait) {
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
        this.debounceTimeout = setTimeout(func, wait);
    },

    /**
     * Toggle debug console
     */
    toggleDebug() {
        $('#debugSection').toggle();
        this.debug('Debug console toggled', 'info');
    },

    /**
     * Clear debug console
     */
    clearDebug() {
        $('#debugConsole').empty();
        this.debug('Debug console cleared', 'info');
    },

    /**
     * Export current configuration
     */
    exportConfig() {
        const config = this.getCurrentConfig();
        if (!config) {
            this.showError('No valid configuration to export');
            return;
        }

        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'ruleflow-config.json';
        link.click();
        
        this.debug('Configuration exported', 'success');
    },

    /**
     * Import configuration file
     */
    importConfig() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const config = JSON.parse(event.target.result);
                    $('#configEditor').val(JSON.stringify(config, null, 2));
                    this.updateInputVariables();
                    this.debug('Configuration imported', 'success');
                } catch (error) {
                    this.showError('Invalid JSON file');
                    this.debug(`Import failed: ${error.message}`, 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
};

// Export for global use
window.RuleFlowUI = RuleFlowUI;