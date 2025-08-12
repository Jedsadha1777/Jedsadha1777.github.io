/**
* RuleFlow Core - Main Engine
* Ported from TypeScript with validation and code generation
*/

class RuleFlow {
   constructor() {
       this.functionRegistry = new FunctionRegistry();
       this.processor = new FormulaProcessor(this.functionRegistry);
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

       if (!(hasFormula || hasSwitch || hasConditions || hasFunctionCall)) {
           errors.push('Formula "' + formula.id + '" must have one of: formula, switch, conditions, or function_call');
       }

       // Validate formula expression
       if (hasFormula) {
           try {
               this.processor.evaluator.validateFormulaSyntax(formula.formula);
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

       return errors;
   }

   /**
    * Register custom function
    */
   registerFunction(name, func, metadata = {}) {
       this.functionRegistry.register(name, func, metadata);
   }

   /**
    * Get available functions
    */
   getAvailableFunctions() {
       return this.functionRegistry.getFunctionNames();
   }

   /**
    * Get function metadata
    */
   getFunctionMetadata(name) {
       return this.functionRegistry.getMetadata(name);
   }

   /**
    * Generate JavaScript code from configuration
    */
   generateCode(config) {
       const validation = this.validateConfig(config);
       if (!validation.valid) {
           throw new RuleFlowException('Cannot generate code for invalid configuration: ' + validation.errors.join(', '));
       }

       let code = '// Generated JavaScript function from RuleFlow configuration\n';
       code += 'function generatedRuleFunction(inputs) {\n';
       code += '  const results = {};\n';
       code += '  const variables = { ...inputs };\n\n';

       // Helper functions
       code += '  // Helper functions\n';
       code += '  const functions = {\n';
       
       // Add math functions
       code += '    sqrt: Math.sqrt,\n';
       code += '    pow: Math.pow,\n';
       code += '    abs: Math.abs,\n';
       code += '    min: Math.min,\n';
       code += '    max: Math.max,\n';
       code += '    round: (num, decimals = 0) => {\n';
       code += '      const factor = Math.pow(10, decimals);\n';
       code += '      return Math.round(num * factor) / factor;\n';
       code += '    },\n';
       code += '    ceil: Math.ceil,\n';
       code += '    floor: Math.floor,\n';
       
       // Add business functions
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
           }
           code += '\n';
       }

       code += '  return results;\n';
       code += '}';

       return code;
   }

   /**
    * Generate code for formula
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
    * Generate code for switch logic
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
    * Generate code for conditions
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
    * Generate code for function call
    */
   generateFunctionCallCode(formula) {
       let code = '  // ' + formula.id + ' (function call)\n';
       
       const params = (formula.params || []).map(param => {
           if (typeof param === 'string') {
               if (param.startsWith('$')) {
                   return 'variables.' + param.substring(1);
               } else if (this.processor.isExpression(param)) {
                   // Handle expressions in parameters
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
    * Generate condition code
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
           
           const operator = condition.operator || condition.op || '==';
           const value = this.generateValueCode(condition.value);
           
           return this.generateComparisonCode(varRef, operator, value);
       }

       // Handle direct comparison with switch value
       if (switchVar && condition.op && 'value' in condition) {
           const value = this.generateValueCode(condition.value);
           return this.generateComparisonCode(switchVar, condition.op, value);
       }

       return 'false';
   }

   /**
    * Generate comparison code
    */
   generateComparisonCode(left, operator, right) {
       switch (operator) {
           case '==':
           case 'eq':
               return left + ' == ' + right;
           case '!=':
           case 'ne':
               return left + ' != ' + right;
           case '>':
           case 'gt':
               return left + ' > ' + right;
           case '>=':
           case 'gte':
               return left + ' >= ' + right;
           case '<':
           case 'lt':
               return left + ' < ' + right;
           case '<=':
           case 'lte':
               return left + ' <= ' + right;
           case 'between':
               return '(' + left + ' >= ' + right + '[0] && ' + left + ' <= ' + right + '[1])';
           case 'in':
               return right + '.includes(' + left + ')';
           case 'not_in':
               return '!' + right + '.includes(' + left + ')';
           default:
               return left + ' == ' + right;
       }
   }

   /**
    * Generate value code
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
    * Generate expression code
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
    * Test configuration with sample inputs
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
   module.exports = { RuleFlow };
} else {
   window.RuleFlow = RuleFlow;
}