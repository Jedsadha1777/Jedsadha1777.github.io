/**
* RuleFlow Core - Main Engine
* Enhanced with Template System - รักษา Code Generation เดิมไว้
*/

class RuleFlow {
    constructor() {
        this.functionRegistry = new FunctionRegistry();
        this.processor = new FormulaProcessor(this.functionRegistry);
        // เพิ่ม templateManager
        this.templateManager = new TemplateManager();
    }

    /**
     * Main evaluation method
     */
    async evaluate(config, inputs) {
        const startTime = performance.now();
        
        try {
            // Validate configuration
            const validation = this.validateConfig(config);
            if (!validation.valid) {
                throw new RuleFlowException('Configuration validation failed: ' + validation.errors.join(', '));
            }

            // Process formulas
            const results = this.processor.process(config.formulas, inputs);
            
            const endTime = performance.now();
            
            return {
                success: true,
                results,
                executionTime: (endTime - startTime).toFixed(2) + 'ms',
                variables: results
            };

        } catch (error) {
            const endTime = performance.now();
            return {
                success: false,
                error: error.message,
                executionTime: (endTime - startTime).toFixed(2) + 'ms'
            };
        }
    }

    /**
     * Validate configuration
     */
    validateConfig(config) {
        const errors = [];
        const warnings = [];

        if (!config) {
            errors.push('Configuration is required');
            return { valid: false, errors, warnings };
        }

        if (!config.formulas || !Array.isArray(config.formulas)) {
            errors.push('Configuration must contain formulas array');
            return { valid: false, errors, warnings };
        }

        // Validate each formula
        for (const [index, formula] of config.formulas.entries()) {
            const formulaErrors = this.validateFormula(formula, index);
            errors.push(...formulaErrors);
        }

        // Check for duplicate IDs
        const ids = config.formulas.map(f => f.id).filter(Boolean);
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        if (duplicates.length > 0) {
            errors.push('Duplicate formula IDs: ' + duplicates.join(', '));
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate individual formula
     */
    validateFormula(formula, index) {
       const errors = [];

       if (!formula.id) {
           errors.push('Formula at index ' + index + ' missing required "id" field');
       }

       // Check that formula has one of the required types
       const hasFormula = !!formula.formula;
       const hasSwitch = !!formula.switch;
       const hasConditions = !!formula.conditions;
       const hasFunctionCall = !!formula.function_call;
       const hasScoring = !!formula.scoring;  // เพิ่มบรรทัดนี้
       const hasRules = !!formula.rules;      // เพิ่มบรรทัดนี้

       if (!(hasFormula || hasSwitch || hasConditions || hasFunctionCall || hasScoring || hasRules)) {
           errors.push('Formula "' + formula.id + '" must have one of: formula, switch, conditions, or function_call');
       }

       // Validate formula expression
        if (hasFormula) {
            try {
               // this.processor.evaluator.validateFormulaSyntax(formula.formula);
                if (!formula.formula || typeof formula.formula !== 'string') {
                    throw new Error('Formula must be a non-empty string');
                }
            } catch (error) {
                errors.push('Formula "' + formula.id + '" syntax error: ' + error.message);
            }
        }

        // Validate switch logic
        if (hasSwitch) {
            if (!formula.when || !Array.isArray(formula.when)) {
                errors.push('Switch formula "' + formula.id + '" must have "when" array');
            }
        }

        // Validate function calls
        if (hasFunctionCall) {
            if (!this.functionRegistry.has(formula.function_call)) {
                errors.push('Function "' + formula.function_call + '" in formula "' + formula.id + '" is not registered');
            }
        }

        // เพิ่ม validation สำหรับ scoring
        if (hasScoring) {
            if (!formula.scoring.ifs || !Array.isArray(formula.scoring.ifs.vars)) {
                errors.push('Scoring formula "' + formula.id + '" must have valid scoring.ifs.vars array');
            }
        }

        // เพิ่ม validation สำหรับ rules
        if (hasRules) {
            if (!Array.isArray(formula.rules)) {
                errors.push('Rules formula "' + formula.id + '" must have rules array');
            }
        }
       return errors;
   }

    /**
     * Generate JavaScript code - รักษาฟังก์ชันเดิมไว้
     */
    generateCode(config) {
        let code = 'function generatedRule(inputs, variables = {}) {\n';
        code += '  const results = {};\n';
        code += '  const functions = {\n';
        code += '    sqrt: Math.sqrt,\n';
        code += '    pow: Math.pow,\n';
        code += '    abs: Math.abs,\n';
        code += '    min: Math.min,\n';
        code += '    max: Math.max,\n';
        code += '    round: Math.round,\n';
        code += '    ceil: Math.ceil,\n';
        code += '    floor: Math.floor,\n';
        code += '    bmi: (weight, height) => weight / ((height / 100) ** 2),\n';
        code += '    percentage: (value, total) => total === 0 ? 0 : (value / total) * 100,\n';
        code += '    discount: (price, rate) => price * (1 - rate / 100),\n';
        code += '    avg: (...numbers) => numbers.reduce((a, b) => a + b, 0) / numbers.length\n';
        code += '  };\n\n';

        // Process each formula
        for (const formula of config.formulas) {
            if (formula.formula) {
                code += this.generateFormulaCode(formula);
            } else if (formula.switch) {
                code += this.generateSwitchCode(formula);
            } else if (formula.conditions) {
                code += this.generateConditionsCode(formula);
            } else if (formula.function_call) {
                code += this.generateFunctionCallCode(formula);
            } else if (formula.rules) {
                code += this.generateRulesCode(formula);
            } else if (formula.scoring) {
                code += this.generateScoringCode(formula);
            }
            code += '\n';
        }

        code += '  return results;\n';
        code += '}';

        return code;
    }

    /**
     * Generate code for formula - รักษาฟังก์ชันเดิมไว้
     */
    generateFormulaCode(formula) {
        let code = '  // ' + formula.id + '\n';
        
        // Replace $ notation and function calls
        let expression = formula.formula;
        
        // Replace $variables
        expression = expression.replace(/\$(\w+)/g, 'variables.$1');
        
        // Replace function calls
        expression = expression.replace(/(\w+)\(/g, (match, funcName) => {
            if (['sqrt', 'pow', 'abs', 'min', 'max', 'round', 'ceil', 'floor', 'bmi', 'percentage', 'discount', 'avg'].includes(funcName)) {
                return 'functions.' + funcName + '(';
            }
            return match;
        });

        // Replace input variables
        if (formula.inputs) {
            formula.inputs.forEach(input => {
                if (!input.startsWith('$')) {
                    const regex = new RegExp('\\b' + input + '\\b', 'g');
                    expression = expression.replace(regex, 'inputs.' + input);
                }
            });
        }

        code += '  results.' + formula.id + ' = ' + expression + ';\n';
        
        if (formula.as) {
            const varName = formula.as.startsWith('$') ? formula.as.substring(1) : formula.as;
            code += '  variables.' + varName + ' = results.' + formula.id + ';\n';
        }

        return code;
    }

    /**
     * Generate code for switch logic - รักษาฟังก์ชันเดิมไว้
     */
    generateSwitchCode(formula) {
        let code = '  // ' + formula.id + ' (switch)\n';
        
        const switchVar = formula.switch.startsWith('$') ? 
            'variables.' + formula.switch.substring(1) : 
            'inputs.' + formula.switch;

        if (formula.when && formula.when.length > 0) {
            formula.when.forEach((whenClause, index) => {
                const condition = this.generateConditionCode(whenClause.if, switchVar);
                const resultValue = this.generateValueCode(whenClause.result);
                
                if (index === 0) {
                    code += '  if (' + condition + ') {\n';
                } else {
                    code += '  } else if (' + condition + ') {\n';
                }
                code += '    results.' + formula.id + ' = ' + resultValue + ';\n';
            });
            
            if (formula.default !== undefined) {
                const defaultValue = this.generateValueCode(formula.default);
                code += '  } else {\n';
                code += '    results.' + formula.id + ' = ' + defaultValue + ';\n';
            }
            code += '  }\n';
        }

        if (formula.as) {
            const varName = formula.as.startsWith('$') ? formula.as.substring(1) : formula.as;
            code += '  variables.' + varName + ' = results.' + formula.id + ';\n';
        }

        return code;
    }

    /**
     * Generate code for conditions - รักษาฟังก์ชันเดิมไว้
     */
    generateConditionsCode(formula) {
        let code = '  // ' + formula.id + ' (conditions)\n';

        formula.conditions.forEach((conditionClause, index) => {
            const condition = this.generateConditionCode(conditionClause.condition);
            const resultValue = this.generateValueCode(conditionClause.value);
            
            if (index === 0) {
                code += '  if (' + condition + ') {\n';
            } else {
                code += '  } else if (' + condition + ') {\n';
            }
            code += '    results.' + formula.id + ' = ' + resultValue + ';\n';
        });
        
        if (formula.default !== undefined) {
            const defaultValue = this.generateValueCode(formula.default);
            code += '  } else {\n';
            code += '    results.' + formula.id + ' = ' + defaultValue + ';\n';
        }
        code += '  }\n';

        if (formula.as) {
            const varName = formula.as.startsWith('$') ? formula.as.substring(1) : formula.as;
            code += '  variables.' + varName + ' = results.' + formula.id + ';\n';
        }

        return code;
    }

    /**
     * Generate code for function call - รักษาฟังก์ชันเดิมไว้
     */
    generateFunctionCallCode(formula) {
        let code = '  // ' + formula.id + ' (function call)\n';
        
        const params = (formula.params || []).map(param => {
            if (typeof param === 'string') {
                if (param.startsWith('$')) {
                    return 'variables.' + param.substring(1);
                } else if (this.processor.isExpression(param)) {
                    return this.generateExpressionCode(param);
                } else {
                    return JSON.stringify(param);
                }
            }
            return JSON.stringify(param);
        }).join(', ');

        code += '  results.' + formula.id + ' = functions.' + formula.function_call + '(' + params + ');\n';

        if (formula.as) {
            const varName = formula.as.startsWith('$') ? formula.as.substring(1) : formula.as;
            code += '  variables.' + varName + ' = results.' + formula.id + ';\n';
        }

        return code;
    }

    /**
     * Generate code for rules - รักษาฟังก์ชันเดิมไว้
     */
    generateRulesCode(formula) {
        let code = '  // ' + formula.id + ' (rules)\n';
        code += '  let totalScore_' + formula.id + ' = 0;\n';

        formula.rules.forEach((rule, ruleIndex) => {
            if (rule.ranges) {
                const varRef = rule.var.startsWith('$') ? 
                    'variables.' + rule.var.substring(1) : 
                    'inputs.' + rule.var;

                rule.ranges.forEach((range, rangeIndex) => {
                    const condition = this.generateConditionCode(range.if, rule.var);
                    const score = range.score || range.result || 0;
                    
                    if (rangeIndex === 0) {
                        code += '  if (' + condition.replace('switchValue_undefined', varRef) + ') {\n';
                    } else {
                        code += '  } else if (' + condition.replace('switchValue_undefined', varRef) + ') {\n';
                    }
                    code += '    totalScore_' + formula.id + ' += ' + score + ';\n';
                });
                code += '  }\n';
            }
        });

        code += '  results.' + formula.id + ' = { score: totalScore_' + formula.id + ' };\n';

        if (formula.as) {
            const varName = formula.as.startsWith('$') ? formula.as.substring(1) : formula.as;
            code += '  variables.' + varName + ' = results.' + formula.id + ';\n';
        }

        return code;
    }

    /**
     * Generate code for scoring - รักษาฟังก์ชันเดิมไว้
     */
    generateScoringCode(formula) {
        let code = '  // ' + formula.id + ' (scoring)\n';
        
        if (formula.scoring.ifs && formula.scoring.ifs.tree) {
            formula.scoring.ifs.tree.forEach((branch, index) => {
                const condition = this.generateConditionCode(branch.if);
                
                if (index === 0) {
                    code += '  if (' + condition + ') {\n';
                } else {
                    code += '  } else if (' + condition + ') {\n';
                }
                
                if (branch.ranges) {
                    branch.ranges.forEach((range, rangeIndex) => {
                        const rangeCondition = this.generateConditionCode(range.if);
                        const score = range.score || 0;
                        const level = range.level ? `"${range.level}"` : 'null';
                        
                        if (rangeIndex === 0) {
                            code += '    if (' + rangeCondition + ') {\n';
                        } else {
                            code += '    } else if (' + rangeCondition + ') {\n';
                        }
                        code += '      results.' + formula.id + ' = { score: ' + score + ', level: ' + level + ' };\n';
                    });
                    code += '    }\n';
                } else {
                    code += '    results.' + formula.id + ' = { score: ' + (branch.score || 0) + ' };\n';
                }
            });
            
            code += '  } else {\n';
            code += '    results.' + formula.id + ' = { score: 0 };\n';
            code += '  }\n';
        }
        
        if (formula.as) {
            const varName = formula.as.startsWith('$') ? formula.as.substring(1) : formula.as;
            code += '  variables.' + varName + ' = results.' + formula.id + ';\n';
        }
        
        return code;
    }

    /**
     * Generate condition code - รักษาฟังก์ชันเดิมไว้
     */
    generateConditionCode(condition, switchVar = null) {
        // Handle AND logic
        if (condition.and && Array.isArray(condition.and)) {
            const subConditions = condition.and.map(sub => this.generateConditionCode(sub, switchVar));
            return '(' + subConditions.join(' && ') + ')';
        }

        // Handle OR logic
        if (condition.or && Array.isArray(condition.or)) {
            const subConditions = condition.or.map(sub => this.generateConditionCode(sub, switchVar));
            return '(' + subConditions.join(' || ') + ')';
        }

        // Handle field-based condition
        if (condition.field || condition.var) {
            const fieldName = condition.field || condition.var;
            const varRef = fieldName.startsWith('$') ? 
                'variables.' + fieldName.substring(1) : 
                'inputs.' + fieldName;
            
            const value = this.generateValueCode(condition.value);
            return this.generateOperatorCode(condition.op, varRef, value);
        }

        // Handle switch-based condition
        if (switchVar && condition.op && condition.value !== undefined) {
            const switchVarRef = switchVar.startsWith('$') ? 
                'variables.' + switchVar.substring(1) : 
                'switchValue_' + (switchVar.replace(/[^a-zA-Z0-9]/g, '_'));
            
            const value = this.generateValueCode(condition.value);
            return this.generateOperatorCode(condition.op, switchVarRef, value);
        }

        return 'true';
    }

    /**
     * Generate operator code - รักษาฟังก์ชันเดิมไว้
     */
    generateOperatorCode(op, left, right) {
        switch (op) {
            case '==':
            case 'equals':
                return left + ' == ' + right;
            case '!=':
            case 'not_equals':
                return left + ' != ' + right;
            case '>':
            case 'greater_than':
                return left + ' > ' + right;
            case '>=':
            case 'greater_than_or_equal':
                return left + ' >= ' + right;
            case '<':
            case 'less_than':
                return left + ' < ' + right;
            case '<=':
            case 'less_than_or_equal':
                return left + ' <= ' + right;
            case 'in':
                return right + '.includes(' + left + ')';
            case 'contains':
                return left + '.includes(' + right + ')';
            default:
                return left + ' == ' + right;
        }
    }

    /**
     * Generate value code - รักษาฟังก์ชันเดิมไว้
     */
    generateValueCode(value) {
        if (typeof value === 'string') {
            if (value.startsWith('$')) {
                return 'variables.' + value.substring(1);
            }
            return JSON.stringify(value);
        }
        return JSON.stringify(value);
    }

    /**
     * Generate expression code - รักษาฟังก์ชันเดิมไว้
     */
    generateExpressionCode(expression) {
        // Replace $variables
        let code = expression.replace(/\$(\w+)/g, 'variables.$1');
        
        // Replace function calls
        code = code.replace(/(\w+)\(/g, (match, funcName) => {
            if (['sqrt', 'pow', 'abs', 'min', 'max', 'round', 'ceil', 'floor', 'bmi', 'percentage', 'discount', 'avg'].includes(funcName)) {
                return 'functions.' + funcName + '(';
            }
            return match;
        });
        
        return code;
    }

    /**
     * Test configuration with sample inputs - รักษาฟังก์ชันเดิมไว้
     */
    async testConfig(config, sampleInputs) {
        const validation = this.validateConfig(config);
        
        if (!validation.valid) {
            return {
                valid: false,
                errors: validation.errors,
                warnings: validation.warnings
            };
        }

        try {
            const result = await this.evaluate(config, sampleInputs);
            return {
                valid: true,
                errors: [],
                warnings: validation.warnings,
                test_result: result.results,
                execution_time: result.executionTime
            };
        } catch (error) {
            return {
                valid: false,
                errors: [error.message],
                warnings: validation.warnings
            };
        }
    }

    // ====================================
    // TEMPLATE METHODS - เพิ่มใหม่
    // ====================================
    
    getAvailableTemplates() {
        return this.templateManager.getAvailableTemplates();
    }

    getTemplate(name) {
        const template = this.templateManager.getTemplate(name);
        return template?.config || null;
    }

    getTemplatesByCategory(category) {
        return this.templateManager.getAvailableTemplates().filter(name => {
            const info = this.templateManager.getTemplateInfo(name);
            return info?.category === category;
        });
    }

    getTemplateInfo(name) {
        return this.templateManager.getTemplateInfo(name);
    }

    getTemplateExamples(name) {
        const template = this.templateManager.getTemplate(name);
        return template?.examples || [];
    }

    searchTemplates(keyword) {
        const results = [];
        const searchTerm = keyword.toLowerCase();
        
        this.getAvailableTemplates().forEach(templateName => {
            const info = this.getTemplateInfo(templateName);
            if (templateName.toLowerCase().includes(searchTerm) ||
                (info?.description && info.description.toLowerCase().includes(searchTerm))) {
                results.push(templateName);
            }
        });
        
        return results;
    }

    getTemplateCategories() {
        const categories = new Set();
        this.getAvailableTemplates().forEach(name => {
            const info = this.getTemplateInfo(name);
            if (info?.category) {
                categories.add(info.category);
            }
        });
        return Array.from(categories);
    }

    async evaluateTemplate(templateName, inputs) {
        const config = this.getTemplate(templateName);
        if (!config) {
            throw new RuleFlowException(`Template '${templateName}' not found`);
        }
        return this.evaluate(config, inputs);
    }

    async testTemplate(templateName, exampleIndex = 0) {
        const examples = this.getTemplateExamples(templateName);
        if (!examples[exampleIndex]) {
            throw new RuleFlowException(`Example ${exampleIndex} not found for template '${templateName}'`);
        }

        const example = examples[exampleIndex];
        const result = await this.evaluateTemplate(templateName, example.inputs);
        
        return {
            template: templateName,
            example: example.name || `Example ${exampleIndex}`,
            inputs: example.inputs,
            outputs: result.results || result,
            expected: example.expectedOutputs
        };
    }

    // ====================================
    // FUNCTION TEMPLATE METHODS - เพิ่มใหม่
    // ====================================

    loadFunctionTemplate(templateName) {
        return this.templateManager.loadTemplate(templateName, this.functionRegistry);
    }

    loadFunctionTemplates(templateNames) {
        templateNames.forEach(name => this.loadFunctionTemplate(name));
    }

    getAvailableFunctionTemplates() {
        return this.templateManager.getAvailableTemplates();
    }

    getLoadedFunctionTemplates() {
        return this.templateManager.getLoadedTemplates();
    }

    getFunctionTemplateInfo(templateName) {
        return this.templateManager.getTemplateInfo(templateName);
    }

    isFunctionTemplateLoaded(templateName) {
        return this.templateManager.isTemplateLoaded(templateName);
    }

    searchTemplateFunctions(keyword) {
        return this.templateManager.searchFunctions(keyword);
    }

    getFunctionTemplateSummary() {
        return this.templateManager.getTemplateSummary();
    }

    registerFunctionTemplate(name, template) {
        Object.entries(template.functions).forEach(([funcName, funcHandler]) => {
            const funcInfo = template.info.functions[funcName];
            this.functionRegistry.register(funcName, funcHandler, {
                category: template.info.category,
                description: funcInfo?.description,
                parameters: funcInfo?.parameters,
                returnType: funcInfo?.returnType
            });
        });
    }

    // ====================================
    // FUNCTION REGISTRY METHODS - เพิ่มใหม่
    // ====================================

    listFunctions() {
        return this.functionRegistry.listFunctions();
    }

    registerFunction(name, handler, info) {
        this.functionRegistry.register(name, handler, info);
    }

    getSystemInfo() {
        return {
            version: '1.0.0-javascript',
            engine: 'JavaScript',
            features: [
                'Formula Evaluation',
                'Switch Logic', 
                'Nested Conditions',
                'Custom Functions',
                'Function Templates',
                'Input Validation',
                'Configuration Testing',
                'Template System',
                'Code Generation'
            ]
        };
    }

    // ====================================
    // ENHANCED CODE GENERATION - เพิ่มใหม่
    // ====================================

    generateFullCode(config, options = {}) {
        const code = this.generateCode(config, options);
        const metadata = this.getGenerationMetadata(config);
        
        return {
            code,
            interfaces: '',
            examples: this.generateExamples(config),
            metadata
        };
    }

    getGenerationMetadata(config) {
        const inputCount = this.extractInputs(config).length;
        const outputCount = config.formulas?.length || 0;
        const complexity = this.calculateComplexity(config);
        
        return {
            inputCount,
            outputCount,
            complexity,
            estimatedPerformanceGain: complexity > 5 ? '3-5x faster' : '2-3x faster'
        };
    }

    extractInputs(config) {
        const inputs = new Set();
        if (config.formulas) {
            config.formulas.forEach(formula => {
                if (formula.inputs) {
                    formula.inputs.forEach(input => inputs.add(input));
                }
                if (formula.formula) {
                    const matches = formula.formula.match(/\b[a-zA-Z_]\w*\b/g);
                    if (matches) {
                        matches.forEach(match => {
                            if (!['sqrt', 'pow', 'abs', 'min', 'max', 'round', 'ceil', 'floor'].includes(match)) {
                                inputs.add(match);
                            }
                        });
                    }
                }
            });
        }
        return Array.from(inputs);
    }

    calculateComplexity(config) {
        if (!config.formulas) return 0;
        return config.formulas.reduce((complexity, formula) => {
            if (formula.switch) complexity += 2;
            if (formula.when && formula.when.length > 3) complexity += 1;
            if (formula.formula) complexity += 1;
            if (formula.rules) complexity += 3;  
            if (formula.scoring) complexity += 4;
            return complexity;
        }, 0);
    }

    generateExamples(config) {
        return `// Example usage:\nconst result = generatedRule(${JSON.stringify(this.getExampleInputs(config), null, 2)});`;
    }

    getExampleInputs(config) {
        const inputs = {};
        this.extractInputs(config).forEach(input => {
            inputs[input] = input.includes('amount') ? 1000 : 
                           input.includes('rate') ? 0.1 : 
                           input.includes('age') ? 25 : 1;
        });
        return inputs;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RuleFlow };
} else {
    window.RuleFlow = RuleFlow;
}