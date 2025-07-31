/**
 * RuleFlow Core - FormulaProcessor
 * Complete implementation matching TypeScript and PHP versions
 */

class FormulaProcessor {
    constructor(functionRegistry) {
        this.functionRegistry = functionRegistry || new FunctionRegistry();
        this.evaluator = new ExpressionEvaluator(this.functionRegistry);
    }

    /**
     * Process array of formulas - ตาม TypeScript/PHP versions
     */
    process(formulas, inputs) {
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
                } else if (formula.rules) {
                    this.processAccumulativeScoring(formula, context);
                } else if (formula.scoring) {
                    this.processAdvancedScoring(formula, context);
                } else {
                    throw new RuleFlowException(`Formula '${formula.id}' must have formula, switch, conditions, function_call, rules, or scoring`);
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
     * Process switch logic
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
        
        // Use default if provided
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
     * Process function call - ตาม TypeScript/PHP versions
     */
    processFunctionCall(formula, context) {
        if (!formula.function_call) {
            throw new RuleFlowException(`Function call name is required for formula '${formula.id}'`);
        }

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
                if (param.includes('(') || param.includes('+') || param.includes('-') || param.includes('*') || param.includes('/')) {
                    try {
                        return this.evaluator.safeEval(param, context);
                    } catch (error) {
                        throw new RuleFlowException(`Cannot evaluate parameter '${param}': ${error.message}`);
                    }
                }
            }

            // Return literal value
            return param;
        });

        try {
            const result = this.functionRegistry.call(functionName, resolvedParams);
            
            // Round result if numeric
            const finalResult = typeof result === 'number' ? Math.round(result * 1000) / 1000 : result;

            context[formula.id] = finalResult;

            if (formula.as) {
                const varName = formula.as.startsWith('$') ? formula.as.substring(1) : formula.as;
                context[varName] = finalResult;
            }
        } catch (error) {
            throw new RuleFlowException(`Function call failed for '${functionName}': ${error.message}`);
        }
    }

    /**
     * Process accumulative scoring (rules) - ตาม PHP version
     */
    processAccumulativeScoring(formula, context) {
        let totalScore = 0.0;

        for (const rule of formula.rules) {
            const varName = rule.var.startsWith('$') ? rule.var.substring(1) : rule.var;
            const value = context[varName];

            if (value === undefined) {
                continue;
            }

            // Handle ranges
            if (rule.ranges) {
                for (const range of rule.ranges) {
                    if (this.evaluateCondition(range.if, value, context)) {
                        totalScore += range.score || 0;
                        
                        // Handle set_vars
                        if (range.set_vars) {
                            Object.assign(context, range.set_vars);
                        }
                        break;
                    }
                }
            }
            // Handle single condition
            else if (rule.if) {
                if (this.evaluateCondition(rule.if, value, context)) {
                    totalScore += rule.score || 0;
                }
            }
        }

        context[formula.id] = totalScore;

        if (formula.as) {
            const varName = formula.as.startsWith('$') ? formula.as.substring(1) : formula.as;
            context[varName] = totalScore;
        }
    }

    /**
     * Process advanced scoring (scoring) - ตาม PHP version
     */
    processAdvancedScoring(formula, context) {
        if (formula.scoring.ifs) {
            // Multi-dimensional scoring
            const result = this.processMultiConditionScoring(formula.scoring.ifs, context);
            context[formula.id] = result;
        } else if (formula.scoring.if) {
            // Simple scoring
            const result = this.processSimpleScoring(formula.scoring, context);
            context[formula.id] = result;
        } else {
            throw new RuleFlowException("Invalid scoring structure");
        }

        if (formula.as) {
            const varName = formula.as.startsWith('$') ? formula.as.substring(1) : formula.as;
            context[varName] = context[formula.id];
        }
    }

    /**
     * Process multi-condition scoring
     */
    processMultiConditionScoring(scoringIfs, context) {
        const vars = scoringIfs.vars || [];
        const tree = scoringIfs.tree || [];
        
        // Get values for scoring variables
        const values = vars.map(varName => {
            const cleanVarName = varName.startsWith('$') ? varName.substring(1) : varName;
            return context[cleanVarName];
        });

        // Process scoring tree
        for (const branch of tree) {
            if (this.evaluateCondition(branch.if, values[0], context)) {
                if (branch.ranges) {
                    for (const range of branch.ranges) {
                        if (this.evaluateCondition(range.if, values[1], context)) {
                            return {
                                score: range.score || 0,
                                ...range
                            };
                        }
                    }
                }
                return {
                    score: branch.score || 0,
                    ...branch
                };
            }
        }

        return { score: 0 };
    }

    /**
     * Process simple scoring
     */
    processSimpleScoring(scoring, context) {
        // Implementation for simple scoring logic
        if (this.evaluateCondition(scoring.if, null, context)) {
            return scoring.score || 0;
        }
        return 0;
    }

    /**
     * Evaluate condition with support for nested AND/OR
     */
    evaluateCondition(condition, switchValue, context) {
        if (!condition) return false;

        // Handle nested AND logic
        if (condition.and && Array.isArray(condition.and)) {
            return condition.and.every(subCondition => 
                this.evaluateCondition(subCondition, switchValue, context)
            );
        }

        // Handle nested OR logic
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

        return false;
    }

    /**
     * Compare values using operator
     */
    compareValues(leftValue, operator, rightValue) {
        switch (operator) {
            case '==':
            case 'equals':
                return leftValue == rightValue;
            case '!=':
            case 'not_equals':
                return leftValue != rightValue;
            case '>':
            case 'greater_than':
                return Number(leftValue) > Number(rightValue);
            case '>=':
            case 'greater_than_or_equal':
                return Number(leftValue) >= Number(rightValue);
            case '<':
            case 'less_than':
                return Number(leftValue) < Number(rightValue);
            case '<=':
            case 'less_than_or_equal':
                return Number(leftValue) <= Number(rightValue);
            case 'in':
                return Array.isArray(rightValue) ? rightValue.includes(leftValue) : false;
            case 'not_in':
                return Array.isArray(rightValue) ? !rightValue.includes(leftValue) : true;
            case 'between':
                if (Array.isArray(rightValue) && rightValue.length === 2) {
                    const num = Number(leftValue);
                    return num >= Number(rightValue[0]) && num <= Number(rightValue[1]);
                }
                return false;
            case 'contains':
                return String(leftValue).includes(String(rightValue));
            case 'starts_with':
                return String(leftValue).startsWith(String(rightValue));
            case 'ends_with':
                return String(leftValue).endsWith(String(rightValue));
            default:
                throw new RuleFlowException(`Unknown operator: ${operator}`);
        }
    }

    /**
     * Resolve value from context or return literal
     */
    resolveValue(value, context) {
        if (typeof value === 'string' && value.startsWith('$')) {
            const varName = value.substring(1);
            return context[varName];
        }
        return value;
    }
}