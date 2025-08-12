/**
 * RuleFlow Core - FormulaProcessor
 * Ported from TypeScript with full switch logic support
 */

class FormulaProcessor {
    constructor(functionRegistry) {
        this.functionRegistry = functionRegistry || new FunctionRegistry();
        this.evaluator = new ExpressionEvaluator(this.functionRegistry);
    }

    /**
     * Process array of formulas
     */
    rocess(formulas, inputs) {
        const context = { ...inputs };
        
        for (const formula of formulas) {
            try {
                if (formula.formula) {
                    this.processFormula(formula, context);
                } else if (formula.switch) {
                    this.processSwitch(formula, context);
                } else if (formula.conditions) {
                    this.processConditions(formula, context);
                } else if (formula.function_call) {
                    this.processFunctionCall(formula, context);
                } else if (formula.scoring) {
                    this.processScoring(formula, context);
                } else if (formula.rules) {  // เพิ่มการประมวลผล rules
                    this.processRules(formula, context);
                } else {
                    throw new RuleFlowException(`Formula '${formula.id}' must have formula, switch, conditions, function_call, scoring, or rules`);
                }
            } catch (error) {
                throw new RuleFlowException(`Error processing formula '${formula.id}': ${error.message}`);
            }
        }
        
        return context;
    }


    /**
     * Process mathematical formula
     */
    processFormula(formula, context) {
        // Validate inputs
        if (formula.inputs) {
            for (const input of formula.inputs) {
                const inputKey = input.startsWith('$') ? input.substring(1) : input;
                if (context[inputKey] === undefined) {
                    throw new RuleFlowException(`Input '${input}' not found in context`);
                }
            }
        }

        // Evaluate formula using safeEval with context
        const result = this.evaluator.safeEval(formula.formula, context);

        // Store result
        context[formula.id] = result;

        // Store as variable if specified
        if (formula.as) {
            const varName = formula.as.startsWith('$') ? formula.as.substring(1) : formula.as;
            context[varName] = result;
        }
    }

    /**
     * Process switch logic (new format)
     */
    processSwitch(formula, context) {
        const switchVariable = formula.switch;
        let switchValue;

        // Get switch value
        if (switchVariable.startsWith('$')) {
            const varName = switchVariable.substring(1);
            switchValue = context[varName];
        } else {
            switchValue = context[switchVariable];
        }

        if (switchValue === undefined) {
            throw new RuleFlowException(`Switch variable '${switchVariable}' not found in context`);
        }

        // Process when conditions
        if (formula.when && Array.isArray(formula.when)) {
            for (const whenClause of formula.when) {
                if (this.evaluateCondition(whenClause.if, switchValue, context)) {
                    const result = this.resolveValue(whenClause.result, context);
                    context[formula.id] = result;
                    
                    // Store as variable if specified
                    if (formula.as) {
                        const varName = formula.as.startsWith('$') ? formula.as.substring(1) : formula.as;
                        context[varName] = result;
                    }
                    return;
                }
            }
        }

        // Use default value if no conditions matched
        if (formula.default !== undefined) {
            const result = this.resolveValue(formula.default, context);
            context[formula.id] = result;
            
            if (formula.as) {
                const varName = formula.as.startsWith('$') ? formula.as.substring(1) : formula.as;
                context[varName] = result;
            }
        }
    }

    /**
     * Process conditions (array-based format)
     */
    processConditions(formula, context) {
        for (const conditionClause of formula.conditions) {
            if (this.evaluateCondition(conditionClause.condition, null, context)) {
                const result = this.resolveValue(conditionClause.value, context);
                context[formula.id] = result;
                
                if (formula.as) {
                    const varName = formula.as.startsWith('$') ? formula.as.substring(1) : formula.as;
                    context[varName] = result;
                }
                return;
            }
        }

        // Use default value if no conditions matched
        if (formula.default !== undefined) {
            const result = this.resolveValue(formula.default, context);
            context[formula.id] = result;
            
            if (formula.as) {
                const varName = formula.as.startsWith('$') ? formula.as.substring(1) : formula.as;
                context[varName] = result;
            }
        }
    }

    /**
     * Process function call
     */
    processFunctionCall(formula, context) {
        const functionName = formula.function_call;
        const params = formula.params || [];

        // Resolve parameters from context
        const resolvedParams = params.map(param => {
            if (typeof param === 'string') {
                // Handle $ variable references
                if (param.startsWith('$')) {
                    const varName = param.substring(1);
                    if (context[varName] !== undefined) {
                        return context[varName];
                    } else {
                        throw new RuleFlowException(`Variable '${param}' not found in context`);
                    }
                }

                // Handle direct variable references
                if (context[param] !== undefined) {
                    return context[param];
                }

                // Handle expressions
                if (this.isExpression(param)) {
                    try {
                        return this.evaluator.safeEval(param, context);
                    } catch (error) {
                        throw new RuleFlowException(`Cannot evaluate parameter '${param}': ${error.message}`);
                    }
                }
            }

            return param;
        });

        try {
            const result = this.functionRegistry.call(functionName, resolvedParams);
            context[formula.id] = result;

            if (formula.as) {
                const varName = formula.as.startsWith('$') ? formula.as.substring(1) : formula.as;
                context[varName] = result;
            }
        } catch (error) {
            throw new RuleFlowException(`Function call failed: ${error.message}`);
        }
    }

    /**
     * Evaluate condition (supports AND/OR logic)
     */
    evaluateCondition(condition, switchValue, context) {
        // Handle logical AND
        if (condition.and && Array.isArray(condition.and)) {
            return condition.and.every(subCondition => 
                this.evaluateCondition(subCondition, switchValue, context)
            );
        }

        // Handle logical OR
        if (condition.or && Array.isArray(condition.or)) {
            return condition.or.some(subCondition => 
                this.evaluateCondition(subCondition, switchValue, context)
            );
        }

        // Handle variable-based condition
        if (condition.field || condition.var) {
            const fieldName = condition.field || condition.var;
            let fieldValue;
            
            if (fieldName.startsWith('$')) {
                const varName = fieldName.substring(1);
                fieldValue = context[varName];
            } else {
                fieldValue = context[fieldName];
            }

            if (fieldValue === undefined) {
                return false;
            }

            const operator = condition.operator || condition.op || '==';
            const compareValue = this.resolveValue(condition.value, context);
            
            return this.compareValues(fieldValue, operator, compareValue);
        }

        // Handle direct comparison with switchValue
        if (condition.op && 'value' in condition) {
            const compareValue = this.resolveValue(condition.value, context);
            return this.compareValues(switchValue, condition.op, compareValue);
        }

        return Boolean(condition);
    }

    /**
     * Compare two values using operator
     */
    compareValues(leftValue, operator, rightValue) {
        const left = this.convertValue(leftValue);
        const right = this.convertValue(rightValue);

        switch (operator) {
            case '==':
            case 'eq':
                return left == right;
            case '!=':
            case 'ne':
                return left != right;
            case '>':
            case 'gt':
                return this.isNumeric(left) && this.isNumeric(right) && left > right;
            case '>=':
            case 'gte':
                return this.isNumeric(left) && this.isNumeric(right) && left >= right;
            case '<':
            case 'lt':
                return this.isNumeric(left) && this.isNumeric(right) && left < right;
            case '<=':
            case 'lte':
                return this.isNumeric(left) && this.isNumeric(right) && left <= right;
            case 'between':
                if (Array.isArray(right) && right.length === 2) {
                    return this.isNumeric(left) && left >= right[0] && left <= right[1];
                }
                return false;
            case 'in':
                return Array.isArray(right) && right.includes(left);
            case 'not_in':
                return Array.isArray(right) && !right.includes(left);
            case 'contains':
                return String(left).includes(String(right));
            case 'starts_with':
                return String(left).startsWith(String(right));
            case 'ends_with':
                return String(left).endsWith(String(right));
            default:
                throw new RuleFlowException(`Unknown operator: ${operator}`);
        }
    }

    /**
     * Resolve value (handle variables, expressions, literals)
     */
    resolveValue(value, context) {
        if (typeof value !== 'string') {
            return value;
        }

        // Handle variable reference
        if (value.startsWith('$')) {
            const varName = value.substring(1);
            if (context[varName] !== undefined) {
                return context[varName];
            } else {
                throw new RuleFlowException(`Variable reference '${value}' not found in context`);
            }
        }

        // Handle expression
        if (this.isExpression(value)) {
            try {
                return this.evaluator.safeEval(value, context);
            } catch (error) {
                throw new RuleFlowException(`Cannot evaluate expression '${value}': ${error.message}`);
            }
        }

        // Handle object with formula
        if (typeof value === 'object' && value.formula) {
            try {
                return this.evaluator.safeEval(value.formula, context);
            } catch (error) {
                throw new RuleFlowException(`Cannot evaluate formula '${value.formula}': ${error.message}`);
            }
        }

        // Convert string literal
        return this.convertValue(value);
    }

    /**
     * Check if string is an expression
     */
    isExpression(value) {
        // Check for mathematical operators, variables, or function calls
        return /[\$\w]+\s*[+\-*/]\s*[\$\w\d.]+|[\$\w]+\s*[+\-*/]\s*\d+|\d+\s*[+\-*/]\s*[\$\w]+|[a-zA-Z_][a-zA-Z0-9_]*\s*\(/.test(value);
    }

    /**
     * Convert string value to appropriate type
     */
    convertValue(value) {
        if (typeof value !== 'string') {
            return value;
        }

        // Boolean conversion
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;

        // Number conversion
        if (/^\d+$/.test(value)) {
            return parseInt(value, 10);
        }

        if (/^\d*\.\d+$/.test(value)) {
            return parseFloat(value);
        }

        // Return as string if no conversion possible
        return value;
    }

    /**
     * Check if value is numeric
     */
    isNumeric(value) {
        return !isNaN(value) && !isNaN(parseFloat(value));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormulaProcessor };
} else {
    window.FormulaProcessor = FormulaProcessor;
}