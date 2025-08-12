/**
 * RuleFlow Core - FormulaProcessor
 * Complete 1:1 match with TypeScript version
 */

class FormulaProcessor {
    constructor(functionRegistry) {
        this.functionRegistry = functionRegistry || new FunctionRegistry();
        this.evaluator = new ExpressionEvaluator(this.functionRegistry);
    }

    // ====================================
    // MAIN PROCESSING METHOD
    // ====================================

    /**
     * Process array of formulas - matches TypeScript exactly
     */
    process(formulas, inputs) {
        const context = { ...inputs };

        for (const formula of formulas) {
            try {
                if (formula.formula) {
                    this.processFormula(formula, context);
                } else if (formula.switch) {
                    this.processSwitch(formula, context);
                } else if (formula.function_call) {
                    this.processFunctionCall(formula, context);
                } else if (formula.rules) {
                    this.processAccumulativeScoring(formula, context);
                } else if (formula.scoring) {
                    this.processAdvancedScoring(formula, context);
                } else {
                    throw new RuleFlowException(`Formula '${formula.id}' must have formula, switch, function_call, rules, or scoring`);
                }
            } catch (error) {
                throw new RuleFlowException(`Error processing formula '${formula.id}': ${error.message}`);
            }
        }

        return context;
    }

    // ====================================
    // FORMULA PROCESSING METHODS
    // ====================================

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
     * Process switch logic - matches TypeScript exactly
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

                    // Set additional variables if specified
                    if (whenClause.set_vars) {
                        for (const [varKey, varValue] of Object.entries(whenClause.set_vars)) {
                            const finalVarName = varKey.startsWith('$') ? varKey.substring(1) : varKey;
                            context[finalVarName] = this.resolveValue(varValue, context);
                        }
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

            // Set additional variables for default case
            if (formula.set_vars) {
                for (const [varKey, varValue] of Object.entries(formula.set_vars)) {
                    const finalVarName = varKey.startsWith('$') ? varKey.substring(1) : varKey;
                    context[finalVarName] = this.resolveValue(varValue, context);
                }
            }
        }
    }

    /**
     * Process function call - NEW method to match TypeScript
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

                // Handle nested function calls or expressions
                if (param.includes('(') || param.includes('+') || param.includes('-') || param.includes('*') || param.includes('/')) {
                    try {
                        this.evaluator.setVariables(context);
                        return this.evaluator.evaluate(param);
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
            
            // Round numeric results
            const roundedResult = typeof result === 'number' ? 
                Math.round(result * 1000000) / 1000000 : result;

            context[formula.id] = roundedResult;

            // Store as variable if specified
            if (formula.as) {
                const varName = formula.as.startsWith('$') ? formula.as.substring(1) : formula.as;
                context[varName] = roundedResult;
            }

        } catch (error) {
            throw new RuleFlowException(`Function call '${functionName}' failed: ${error.message}`);
        }
    }

    /**
     * Process accumulative scoring - NEW method to match TypeScript
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
     * Process advanced scoring - NEW method to match TypeScript
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

        // Store as variable if specified
        if (formula.as) {
            const varName = formula.as.startsWith('$') ? formula.as.substring(1) : formula.as;
            context[varName] = context[formula.id];
        }
    }

    processMultiConditionScoring(scoringIfs, context) {
        const vars = scoringIfs.vars || [];
        const tree = scoringIfs.tree || [];
        
        // Get values for scoring variables
        const values = vars.map(varName => {
            const cleanVarName = varName.startsWith('$') ? varName.substring(1) : varName;
            return context[cleanVarName];
        });

        // Check if any values are missing
        if (values.some(val => val === undefined || val === null)) {
            return this.createDefaultScoringResult();
        }

        // Process scoring tree
        for (const branch of tree) {
            if (this.evaluateCondition(branch.if, values[0], context)) {
                if (branch.ranges && values.length > 1) {
                    for (const range of branch.ranges) {
                        if (this.evaluateCondition(range.if, values[1], context)) {
                            return this.buildScoringResult(range, vars, values, context); 
                        }
                    }
                }
                // No ranges found, return branch result
                return this.buildScoringResult(branch, vars, values, context); 
            }
        }

        // No match found
        return this.createDefaultScoringResult();
    }


    buildScoringResult(matchedRule, vars = [], values = [], context = {}) { 
        if (!matchedRule) {
            return this.createDefaultScoringResult();
        }

        // Start with core result
        const result = {
            score: matchedRule.score || matchedRule.result || 0
        };

        // Add metadata about the match
        if (vars.length > 0 && values.length > 0) {
            result.primary_var = vars[0];
            result.primary_value = values[0];
            
            if (vars.length > 1 && values.length > 1) {
                result.secondary_var = vars[1];
                result.secondary_value = values[1];
            }
        }

        // ✅ เพิ่ม properties เพิ่มเติมแต่ไม่ hardcode null
        Object.keys(matchedRule).forEach(key => {
            // ข้าม keys ที่ไม่ต้องการใน result
            if (!['if', 'score', 'result'].includes(key)) {
                // ✅ เพิ่มเฉพาะถ้ามีค่าจริงๆ (ไม่ใช่ null/undefined)
                if (matchedRule[key] !== null && matchedRule[key] !== undefined) {
                    result[key] = matchedRule[key];
                }
            }
        });

        // Handle set_vars if present
        if (matchedRule.set_vars) {
            Object.assign(context, matchedRule.set_vars);
        }

        return result;
    }


    createDefaultScoringResult() {
        return {
            score: 0
        };
    }

    processSimpleScoring(scoring, context) {
        // Implementation for simple scoring logic
        if (this.evaluateCondition(scoring.if, null, context)) {
            const result = {
                score: scoring.score || scoring.result || 0
            };
            
            Object.keys(scoring).forEach(key => {
                if (!['if', 'score', 'result'].includes(key)) {
                    if (scoring[key] !== null && scoring[key] !== undefined) {
                        result[key] = scoring[key];
                    }
                }
            });
            
            return result;
        }
        return this.createDefaultScoringResult();
    }


    // ====================================
    // HELPER METHODS
    // ====================================

    /**
     * Evaluate condition - NEW method to match TypeScript
     */
    evaluateCondition(condition, targetValue, context) {
        if (!condition) return false;

        // Handle AND conditions
        if (condition.and && Array.isArray(condition.and)) {
            return condition.and.every(subCondition => 
                this.evaluateCondition(subCondition, targetValue, context)
            );
        }

        // Handle OR conditions
        if (condition.or && Array.isArray(condition.or)) {
            return condition.or.some(subCondition => 
                this.evaluateCondition(subCondition, targetValue, context)
            );
        }

        // Handle simple operation
        if (condition.op !== undefined) {
            const leftValue = condition.var ? 
                (context[condition.var] !== undefined ? context[condition.var] : targetValue) : 
                targetValue;
            const rightValue = condition.value;

            return this.compareValues(leftValue, rightValue, condition.op);
        }

        return false;
    }

    /**
     * Compare values with operator - NEW method to match TypeScript
     */
    compareValues(left, right, operator) {
        switch (operator) {
            case '==':
            case '===':
                return left == right;
            case '!=':
            case '!==':
                return left != right;
            case '>':
                return Number(left) > Number(right);
            case '>=':
                return Number(left) >= Number(right);
            case '<':
                return Number(left) < Number(right);
            case '<=':
                return Number(left) <= Number(right);
            case 'between':
                if (Array.isArray(right) && right.length === 2) {
                    const numLeft = Number(left);
                    return numLeft >= Number(right[0]) && numLeft <= Number(right[1]);
                }
                return false;
            case 'in':
                return Array.isArray(right) && right.includes(left);
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
     * Resolve value from context or return literal - NEW method to match TypeScript
     */
    resolveValue(value, context) {
        if (typeof value === 'string') {
            // Handle $ variable references
            if (value.startsWith('$')) {
                const varName = value.substring(1);
                return context[varName] !== undefined ? context[varName] : value;
            }

            // Handle direct variable references
            if (context[value] !== undefined) {
                return context[value];
            }

            // Handle expressions
            if (value.includes('+') || value.includes('-') || value.includes('*') || value.includes('/') || value.includes('(')) {
                try {
                    this.evaluator.setVariables(context);
                    return this.evaluator.evaluate(value);
                } catch (error) {
                    // Return literal value if evaluation fails
                    return value;
                }
            }
        }

        // Return literal value
        return value;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormulaProcessor };
} else {
    window.FormulaProcessor = FormulaProcessor;
}