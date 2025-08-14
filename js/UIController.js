/**
 * UIController.js - แก้ให้ทำงานกับ dropdown เดิม
 */
class UIController {
    constructor(componentManager) {
        console.log('UIController constructor called');
        this.componentManager = componentManager;
        this.autoExecuteEnabled = false;
        this.setupComponentListener();
    }

    bindEvents() {
        console.log('bindEvents called - binding to dropdown items');
        
        // Bind dropdown items (HTML เดิมใช้ dropdown)
        $(document).off('click', '.dropdown-item[data-component]').on('click', '.dropdown-item[data-component]', (e) => {
            e.preventDefault();
            const componentType = $(e.target).closest('.dropdown-item').data('component');
            console.log('Dropdown item clicked:', componentType);
            this.addComponent(componentType);
        });

        // Execute button (เดิมมี executeBtn)
        $('#executeBtn').off('click').on('click', (e) => {
            console.log('Execute button clicked via UIController');
            this.executeRules();
        });
        
        // Copy JSON button (เดิมมี copyJsonBtn)
        $('#copyJsonBtn').off('click').on('click', (e) => {
            this.copyJSON();
        });

        // Generate code button (ถ้ามี)
        $('#generateCodeBtn').off('click').on('click', (e) => {
            this.generateCode();
        });

        console.log('Events bound to existing HTML structure');
    }

    addComponent(type) {
        console.log('addComponent called with type:', type);
        
        try {
            console.log('ComponentManager available:', !!this.componentManager);
            const component = this.componentManager.addComponent(type);
            console.log('Component created:', component);
            
            this.showToast(`${type} component added`, 'success');
        } catch (error) {
            console.error('Error in addComponent:', error);
            this.showToast(`Failed to add ${type}: ${error.message}`, 'error');
        }
    }

    setupComponentListener() {
        this.componentManager.onChange((action, component, index) => {
            console.log('Component changed:', action, component?.type);
            this.updateView();
            this.updateJSON();
            this.updateInputVariables();
            
            if (this.autoExecuteEnabled) {
                this.executeRules();
            }
        });
    }

    updateView() {
        console.log('Updating view...');
        const $container = $('#componentContainer');
        const $emptyState = $('#emptyState');
        
        // Clear existing components (except empty state)
        $container.children().not('#emptyState').remove();

        const components = this.componentManager.components;
        console.log('Components to render:', components.length);
        
        if (components.length === 0) {
            $emptyState.show();
            return;
        }

        $emptyState.hide();
        
        components.forEach((component, index) => {
            console.log(`Rendering component ${index}:`, component.type);
            const $element = this.createComponentElement(component, index);
            $container.append($element);
        });
    }

    createComponentElement(component, index) {
        const iconMap = {
            'formula': 'bi-calculator',
            'switch': 'bi-toggle-on', 
            'conditions': 'bi-diagram-3',
            'scoring': 'bi-star'
        };

        const icon = iconMap[component.type] || 'bi-gear';
        const title = component.instance.getTitle?.() || component.type;
        const chevron = component.open ? 'bi-chevron-down' : 'bi-chevron-right';

        let html = `
            <div class="card component-card mb-3" data-component-index="${index}">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <button class="btn btn-sm btn-outline-secondary me-2 toggle-btn" data-index="${index}">
                            <i class="bi ${chevron}"></i>
                        </button>
                        <i class="bi ${icon} me-2"></i>
                        <span class="fw-bold">${title}</span>
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary copy-btn" data-index="${index}">
                            <i class="bi bi-clipboard"></i>
                        </button>
                        <button class="btn btn-outline-danger delete-btn" data-index="${index}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>`;

        if (component.open && component.instance.render) {
            try {
                html += `<div class="card-body">${component.instance.render(index)}</div>`;
            } catch (error) {
                console.error('Error rendering component:', error);
                html += `<div class="card-body"><div class="alert alert-danger">Error rendering component: ${error.message}</div></div>`;
            }
        }

        html += `</div>`;
        
        return $(html);
    }

    updateJSON() {
        try {
            const config = this.componentManager.getComponentsAsJSON();
            const formatted = JSON.stringify(config, null, 2);
            $('#jsonOutput').text(formatted);
        } catch (error) {
            console.error('Error updating JSON:', error);
            $('#jsonOutput').text('Error generating JSON: ' + error.message);
        }
    }

    updateInputVariables() {

        console.log(' updateInputVariables Input variables:', inputs);

        try {
            const inputs = this.componentManager.getAllInputVariables();
            
            
            const $container = $('#inputVariables');
            
            // Clear และสร้างใหม่
            $container.empty();

            if (inputs.length === 0) {
                $container.html('<p class="text-muted mb-0">Add components to see input variables</p>');
                return;
            }

            // เพิ่ม input variables
            inputs.forEach(varName => {
                const $input = $(`
                    <div class="input-variable mb-2">
                        <label class="form-label small fw-bold">${varName}</label>
                        <input type="text" class="form-control form-control-sm" 
                               id="input_${varName}" data-variable="${varName}" 
                               placeholder="Enter ${varName}">
                    </div>
                `);
                $container.append($input);
            });

        } catch (error) {
            console.error('Error updating input variables:', error);
        }
    }

    executeRules() {
        try {
            const config = this.componentManager.getComponentsAsJSON();
            const inputs = this.getAllInputValues();
            
            console.log('Executing:', { config, inputs });

            const result = window.ruleFlow.evaluate(config, inputs);
            this.displayResults(result);
            
        } catch (error) {
            console.error('Execution error:', error);
            this.showToast('Execution failed: ' + error.message, 'error');
            this.displayError(error.message);
        }
    }

    getAllInputValues() {
        const values = {};
        $('#inputVariables input[data-variable]').each(function() {
            const name = $(this).data('variable');
            const value = $(this).val();
            
            // แปลงค่าตามประเภท
            if (value === 'true') values[name] = true;
            else if (value === 'false') values[name] = false;
            else if (!isNaN(value) && value !== '') values[name] = parseFloat(value);
            else values[name] = value;
        });
        return values;
    }

    displayResults(results) {
        const $container = $('#resultsPanel');
        
        if (!results || Object.keys(results).length === 0) {
            $container.html('<p class="text-muted mb-0">No results to display</p>');
            return;
        }

        let html = '<div class="results-grid">';
        Object.entries(results).forEach(([key, value]) => {
            html += `
                <div class="result-item mb-2 p-2 bg-light rounded">
                    <strong>${key}:</strong> 
                    <span class="text-primary">${this.formatValue(value)}</span>
                </div>
            `;
        });
        html += '</div>';
        
        $container.html(html);
    }

    displayError(message) {
        const $container = $('#resultsPanel');
        $container.html(`
            <div class="alert alert-danger mb-0">
                <i class="bi bi-exclamation-triangle"></i> ${message}
            </div>
        `);
    }

    formatValue(value) {
        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }
        return String(value);
    }

    copyJSON() {
        const text = $('#jsonOutput').text();
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('JSON copied to clipboard', 'success');
        });
    }

    generateCode() {
        try {
            const config = this.componentManager.getComponentsAsJSON();
            const code = window.ruleFlow.generateCode(config);
            $('#generatedCode').val(code);
            this.showToast('Code generated successfully', 'success');
        } catch (error) {
            console.error('Code generation error:', error);
            this.showToast('Code generation failed: ' + error.message, 'error');
        }
    }

    showToast(message, type = 'info') {
        const alertClass = type === 'error' ? 'alert-danger' : 
                          type === 'success' ? 'alert-success' : 'alert-info';
        
        const $toast = $(`
            <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999;">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
        
        $('body').append($toast);
        setTimeout(() => $toast.alert('close'), 3000);
    }
}