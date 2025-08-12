/**
 * RuleFlow Template Manager
 * Manages function templates and provides template loading functionality
 */

class TemplateManager {
    constructor() {
        this.loadedTemplates = new Set();
        this.availableTemplates = new Map();
        this.initializeAvailableTemplates();
    }

    /**
     * Initialize available templates registry
     */
    initializeAvailableTemplates() {
        // Business template
        this.availableTemplates.set('business', {
            name: 'business',
            title: 'Business Functions',
            category: 'Business',
            description: 'Advanced business logic functions for e-commerce, logistics, and financial calculations',
            functionCount: 10,
            version: '1.0.0',
            loadFunction: () => {
                if (typeof BUSINESS_TEMPLATE !== 'undefined') {
                    return BUSINESS_TEMPLATE;
                }
                throw new Error('Business template not loaded. Please include business.js');
            }
        });

        // Financial template  
        this.availableTemplates.set('financial', {
            name: 'financial',
            title: 'Financial Analysis Functions',
            category: 'Financial',
            description: 'Advanced financial calculations for loans, investments, and tax planning',
            functionCount: 8,
            version: '1.0.0',
            loadFunction: () => {
                if (typeof FINANCIAL_TEMPLATE !== 'undefined') {
                    return FINANCIAL_TEMPLATE;
                }
                throw new Error('Financial template not loaded. Please include financial.js');
            }
        });

        // E-commerce template
        this.availableTemplates.set('ecommerce', {
            name: 'ecommerce',
            title: 'E-commerce Functions',
            category: 'E-commerce',
            description: 'E-commerce calculations for pricing, shipping, loyalty, and customer analytics',
            functionCount: 7,
            version: '1.0.0',
            loadFunction: () => {
                if (typeof ECOMMERCE_TEMPLATE !== 'undefined') {
                    return ECOMMERCE_TEMPLATE;
                }
                throw new Error('E-commerce template not loaded. Please include ecommerce.js');
            }
        });

        // Healthcare template
        this.availableTemplates.set('healthcare', {
            name: 'healthcare',
            title: 'Healthcare Functions',
            category: 'Healthcare',
            description: 'Medical and health assessment functions for BMI, risk scoring, and clinical calculations',
            functionCount: 7,
            version: '1.0.0',
            loadFunction: () => {
                if (typeof HEALTHCARE_TEMPLATE !== 'undefined') {
                    return HEALTHCARE_TEMPLATE;
                }
                throw new Error('Healthcare template not loaded. Please include healthcare.js');
            }
        });

        // Hotel template
        this.availableTemplates.set('hotel', {
            name: 'hotel',
            title: 'Hotel Management Functions',
            category: 'Hotel',
            description: 'Hotel industry functions for pricing, occupancy, and booking management',
            functionCount: 8,
            version: '1.0.0',
            loadFunction: () => {
                if (typeof HOTEL_TEMPLATE !== 'undefined') {
                    return HOTEL_TEMPLATE;
                }
                throw new Error('Hotel template not loaded. Please include hotel.js');
            }
        });

        // Date template
        this.availableTemplates.set('date', {
            name: 'date',
            title: 'Thai Date Functions',
            category: 'Date',
            description: 'Thai business date, holiday, and fiscal calendar functions',
            functionCount: 8,
            version: '1.0.0',
            loadFunction: () => {
                if (typeof DATE_TEMPLATE !== 'undefined') {
                    return DATE_TEMPLATE;
                }
                throw new Error('Date template not loaded. Please include date.js');
            }
        });

        // Education template
        this.availableTemplates.set('education', {
            name: 'education',
            title: 'Education Functions',
            category: 'Education',
            description: 'Academic functions for grading, GPA calculation, and educational assessments',
            functionCount: 8,
            version: '1.0.0',
            loadFunction: () => {
                if (typeof EDUCATION_TEMPLATE !== 'undefined') {
                    return EDUCATION_TEMPLATE;
                }
                throw new Error('Education template not loaded. Please include education.js');
            }
        });
    }

    /**
     * Get all available template names
     */
    getAvailableTemplates() {
        return Array.from(this.availableTemplates.keys());
    }

    /**
     * Get template by name
     */
    getTemplate(name) {
        const templateInfo = this.availableTemplates.get(name);
        if (!templateInfo) {
            return null;
        }

        try {
            return templateInfo.loadFunction();
        } catch (error) {
            throw new Error(`Failed to load template '${name}': ${error.message}`);
        }
    }

    /**
     * Get template info only (without loading functions)
     */
    getTemplateInfo(name) {
        const templateInfo = this.availableTemplates.get(name);
        if (!templateInfo) {
            return null;
        }

        return {
            name: templateInfo.name,
            title: templateInfo.title,
            category: templateInfo.category,
            description: templateInfo.description,
            functionCount: templateInfo.functionCount,
            version: templateInfo.version
        };
    }

    /**
     * Get loaded templates
     */
    getLoadedTemplates() {
        return Array.from(this.loadedTemplates);
    }

    /**
     * Check if template is loaded
     */
    isTemplateLoaded(name) {
        return this.loadedTemplates.has(name);
    }

    /**
     * Mark template as loaded
     */
    markAsLoaded(name) {
        this.loadedTemplates.add(name);
    }

    /**
     * Load template and register its functions with FunctionRegistry
     */
    loadTemplate(templateName, functionRegistry) {
        if (this.isTemplateLoaded(templateName)) {
            console.log(`Template '${templateName}' is already loaded`);
            return true;
        }

        try {
            const template = this.getTemplate(templateName);
            if (!template) {
                throw new Error(`Template '${templateName}' not found`);
            }

            // Register all functions from the template
            Object.entries(template.functions).forEach(([funcName, funcHandler]) => {
                const funcInfo = template.info.functions[funcName] || {};
                functionRegistry.register(funcName, funcHandler, {
                    category: template.info.category,
                    description: funcInfo.description || '',
                    params: funcInfo.parameters || [],
                    returns: funcInfo.returnType || 'any',
                    examples: funcInfo.examples || []
                });
            });

            // Mark as loaded
            this.markAsLoaded(templateName);
            
            console.log(`Template '${templateName}' loaded successfully with ${Object.keys(template.functions).length} functions`);
            return true;

        } catch (error) {
            console.error(`Failed to load template '${templateName}':`, error.message);
            return false;
        }
    }

    /**
     * Load multiple templates
     */
    loadTemplates(templateNames, functionRegistry) {
        const results = {};
        templateNames.forEach(name => {
            results[name] = this.loadTemplate(name, functionRegistry);
        });
        return results;
    }

    /**
     * Get all functions from loaded templates
     */
    getAllLoadedFunctions() {
        const functions = [];

        for (const templateName of this.loadedTemplates) {
            try {
                const template = this.getTemplate(templateName);
                if (template) {
                    Object.entries(template.info.functions).forEach(([funcName, funcInfo]) => {
                        functions.push({
                            name: funcName,
                            template: templateName,
                            category: template.info.category,
                            description: funcInfo.description || ''
                        });
                    });
                }
            } catch (error) {
                console.warn(`Could not get functions from template '${templateName}':`, error.message);
            }
        }

        return functions;
    }

    /**
     * Search functions across all templates
     */
    searchFunctions(keyword) {
        const results = [];
        const searchKeyword = keyword.toLowerCase();

        for (const [templateName, templateInfo] of this.availableTemplates) {
            try {
                const template = this.getTemplate(templateName);
                if (template) {
                    Object.entries(template.info.functions).forEach(([funcName, funcInfo]) => {
                        if (funcName.toLowerCase().includes(searchKeyword) || 
                            (funcInfo.description && funcInfo.description.toLowerCase().includes(searchKeyword))) {
                            
                            results.push({
                                name: funcName,
                                template: templateName,
                                description: funcInfo.description || '',
                                category: template.info.category
                            });
                        }
                    });
                }
            } catch (error) {
                // Template not available for search, skip
                continue;
            }
        }

        return results;
    }

    /**
     * Get template summary for display
     */
    getTemplateSummary() {
        const summary = [];

        for (const [templateName, templateInfo] of this.availableTemplates) {
            summary.push({
                name: templateName,
                title: templateInfo.title,
                category: templateInfo.category,
                functionCount: templateInfo.functionCount,
                description: templateInfo.description,
                loaded: this.isTemplateLoaded(templateName),
                version: templateInfo.version
            });
        }

        return summary;
    }

    /**
     * Register a custom template
     */
    registerCustomTemplate(name, template) {
        if (this.availableTemplates.has(name)) {
            throw new Error(`Template '${name}' already exists`);
        }

        this.availableTemplates.set(name, {
            name: name,
            title: template.info.name,
            category: template.info.category,
            description: template.info.description,
            functionCount: Object.keys(template.functions).length,
            version: template.info.version || '1.0.0',
            loadFunction: () => template
        });
    }

    /**
     * Unload template (remove from loaded set)
     */
    unloadTemplate(templateName) {
        if (this.loadedTemplates.has(templateName)) {
            this.loadedTemplates.delete(templateName);
            console.log(`Template '${templateName}' unloaded`);
            return true;
        }
        return false;
    }

    /**
     * Get statistics about template usage
     */
    getTemplateStats() {
        return {
            available: this.availableTemplates.size,
            loaded: this.loadedTemplates.size,
            load_ratio: this.loadedTemplates.size / this.availableTemplates.size,
            templates: this.getTemplateSummary()
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TemplateManager };
} else {
    window.TemplateManager = TemplateManager;
}