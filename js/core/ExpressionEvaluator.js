/**
 * RuleFlow Core - ExpressionEvaluator
 * Ported from TypeScript with full functionality
 */

class RuleFlowException extends Error {
    constructor(message) {
        super(message);
        this.name = 'RuleFlowException';
    }
}

class ExpressionEvaluator {
    constructor(functionRegistry) {
        this.variables = {};
        this.functionRegistry = functionRegistry || new FunctionRegistry();
        this.autoRoundPrecision = 10; // Default precision
        this.autoRoundThreshold = 1e-10;
    }

    setVariables(vars) {
        this.variables = { ...vars };
    }

    getFunctionRegistry() {
        return this.functionRegistry;
    }

    setAutoRounding(precision = 10) {
        this.autoRoundPrecision = precision;
    }

    disableAutoRounding() {
        this.autoRoundPrecision = null;
    }

    /**
     * Safe evaluation method - main entry point
     */
    safeEval(expression, context) {
        try {
            // Set variables from context
            this.setVariables(context);
            
            // Use main evaluate method
            return this.evaluate(expression);
            
        } catch (error) {
            throw new RuleFlowException(`Safe evaluation failed for '${expression}': ${error.message}`);
        }
    }

    /**
     * Evaluate $ expression at runtime
     */
    evaluateDollarExpression(expression, context) {
        this.setVariables(context);
        return this.evaluate(expression);
    }

    /**
     * Main evaluation method
     */
    evaluate(expression) {
        // Validate formula syntax first (like real RuleFlow)
        this.validateFormulaSyntax(expression);
        
        let processedExpression = expression;

        // 1. Replace variables with values first
        processedExpression = this.replaceVariablesWithValues(processedExpression);

        // 2. Process functions after variable replacement
        processedExpression = this.processFunctions(processedExpression);

        // 3. Validate final expression
        this.validateFinalExpression(processedExpression);

        // 4. Tokenize and evaluate
        const tokens = this.tokenize(processedExpression);
        const processedTokens = this.processUnaryOperators(tokens);
        const postfix = this.convertToPostfix(processedTokens);
        
        const result = this.evaluatePostfix(postfix);
        return this.applyAutoRounding(result);
    }


    /**
     * Replace all variables (both $ notation and regular) with their values
     */
    replaceVariablesWithValues(expression) {
        let processedExpression = expression;
        
        // Replace $variables first
        processedExpression = processedExpression.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, varName) => {
            if (this.variables.hasOwnProperty(varName)) {
                return String(this.variables[varName]);
            }
            throw new RuleFlowException(`Variable '${match}' not found in context`);
        });
        
        // Replace regular variables (but not function names)
        const variablePattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
        let match;
        const replacements = [];
        
        // Find all potential variable matches
        while ((match = variablePattern.exec(processedExpression)) !== null) {
            const varName = match[1];
            const matchStart = match.index;
            const matchEnd = match.index + varName.length;
            
            // Check if it's followed by '(' (function call)
            const nextChar = processedExpression[matchEnd];
            if (nextChar === '(') {
                continue; // Skip function names
            }
            
            // Check if we have this variable
            if (this.variables.hasOwnProperty(varName)) {
                replacements.push({
                    start: matchStart,
                    end: matchEnd,
                    original: varName,
                    replacement: String(this.variables[varName])
                });
            }
        }
        
        // Apply replacements from right to left to maintain indices
        for (let i = replacements.length - 1; i >= 0; i--) {
            const replacement = replacements[i];
            processedExpression = 
                processedExpression.substring(0, replacement.start) +
                replacement.replacement +
                processedExpression.substring(replacement.end);
        }
        
        return processedExpression;
    }

    /**
     * Validate formula syntax (ported from TypeScript)
     */
    validateFormulaSyntax(formula) {
        // Check for unsupported operators
        const unsupportedPatterns = [
            { pattern: /\?.*:/, name: 'Ternary operator (? :)' },
            { pattern: /&&/, name: 'Logical AND (&&)' },
            { pattern: /\|\|/, name: 'Logical OR (||)' },
            { pattern: /===/, name: 'Strict equality (===)' },
            { pattern: /!==/, name: 'Strict inequality (!==)' },
            { pattern: /==/, name: 'Equality (==)' },
            { pattern: /!=/, name: 'Inequality (!=)' }
        ];

        for (const { pattern, name } of unsupportedPatterns) {
            if (pattern.test(formula)) {
                const match = formula.match(pattern)[0];
                throw new RuleFlowException(
                    `Unsupported operator in formula: ${name}. ` +
                    `Use Switch Logic for conditions instead of: ${match}`
                );
            }
        }
    }

    /**
     * Replace variables in expression
     */
    replaceVariablesInExpression(expression, context) {
        return expression.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
            if (context.hasOwnProperty(match)) {
                return String(context[match]);
            }
            return match;
        });
    }

    /**
     * Replace $ notation with variable values
     */
    replaceDollarNotation(expression) {
        return expression.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, varName) => {
            if (this.variables.hasOwnProperty(varName)) {
                return String(this.variables[varName]);
            }
            throw new RuleFlowException(`Variable '${match}' not found in context`);
        });
    }

    /**
     * Process function calls in expression
     */
    processFunctions(expression) {
        const functionPattern = /([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*([^()]*)\s*\)/g;
        
        let processedExpression = expression;
        let match;
        
        // Process functions iteratively
        let maxIterations = 5;
        let iteration = 0;
        
        while ((match = functionPattern.exec(processedExpression)) !== null && iteration < maxIterations) {
            const fullMatch = match[0];
            const funcName = match[1];
            const argsStr = match[2];
            
            try {
                // Parse arguments (simple comma-separated for now)
                const args = argsStr.split(',').map(arg => {
                    const trimmed = arg.trim();
                    // Try to parse as number
                    const num = parseFloat(trimmed);
                    return isNaN(num) ? trimmed : num;
                }).filter(arg => arg !== '');
                
                // Call function
                const result = this.functionRegistry.call(funcName, args);
                
                // Replace the function call with its result
                processedExpression = processedExpression.replace(fullMatch, String(result));
                
                // Reset regex for next iteration
                functionPattern.lastIndex = 0;
                iteration++;
                
            } catch (error) {
                throw new RuleFlowException(`Function call failed for '${funcName}': ${error.message}`);
            }
        }
        
        return processedExpression;
    }

   

    /**
     * Parse function arguments
     */
    parseArguments(argsStr) {
        if (!argsStr.trim()) return [];
        
        const args = [];
        let currentArg = '';
        let parenDepth = 0;
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < argsStr.length; i++) {
            const char = argsStr[i];
            
            if (!inQuotes && (char === '"' || char === "'")) {
                inQuotes = true;
                quoteChar = char;
                currentArg += char;
            } else if (inQuotes && char === quoteChar) {
                inQuotes = false;
                currentArg += char;
            } else if (!inQuotes && char === '(') {
                parenDepth++;
                currentArg += char;
            } else if (!inQuotes && char === ')') {
                parenDepth--;
                currentArg += char;
            } else if (!inQuotes && char === ',' && parenDepth === 0) {
                args.push(this.parseValue(currentArg.trim()));
                currentArg = '';
            } else {
                currentArg += char;
            }
        }
        
        if (currentArg.trim()) {
            args.push(this.parseValue(currentArg.trim()));
        }
        
        return args;
    }

    /**
     * Parse individual argument value
     */
    parseValue(value) {
        const trimmed = value.trim();
        
        // String literal
        if (/^["'].*["']$/.test(trimmed)) {
            return trimmed.slice(1, -1);
        }
        
        // Number
        if (/^\d+\.?\d*$/.test(trimmed)) {
            return parseFloat(trimmed);
        }
        
        // Boolean
        if (trimmed === 'true') return true;
        if (trimmed === 'false') return false;
        
        // Variable reference
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
            if (this.variables.hasOwnProperty(trimmed)) {
                return this.variables[trimmed];
            }
        }
        
        return trimmed;
    }

    /**
     * Validate final expression before evaluation
     */
    validateFinalExpression(expression) {
        // Simple validation - should only contain numbers, operators, and basic math
        const validPattern = /^[\d+\-*/().\s]+$/;
        if (!validPattern.test(expression)) {
            throw new RuleFlowException(`Expression contains invalid characters after processing: ${expression}`);
        }
    }

    /**
     * Tokenize expression into components
     */
    tokenize(expression) {
        const tokens = [];
        let current = '';
        
        for (let i = 0; i < expression.length; i++) {
            const char = expression[i];
            
            if (/\d/.test(char) || char === '.') {
                current += char;
            } else if (char === '*' && i + 1 < expression.length && expression[i + 1] === '*') {
                // Handle ** operator
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                tokens.push('**');
                i++; // Skip next *
            } else if (/[+\-*/()]/.test(char)) {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                tokens.push(char);
            } else if (char === ' ') {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
            }
        }

        if (current) {
            tokens.push(current);
        }

        return tokens;
    }

    /**
     * Process unary operators
     */
    processUnaryOperators(tokens) {
        const processed = [];
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            // Check if it's unary minus
            if (token === '-' && this.isUnaryMinus(tokens, i)) {
                // Convert unary minus to 'u-' to distinguish from binary minus
                processed.push('u-');
            } else {
                processed.push(token);
            }
        }
        
        return processed;
    }

    /**
     * Check if minus is unary
     */
    isUnaryMinus(tokens, index) {
        // If it's the first token = unary
        if (index === 0) return true;
        
        const prevToken = tokens[index - 1];
        
        // If previous token is operator or '(' = unary
        return ['+', '-', '*', '/', '**', '('].includes(prevToken);
    }

    /**
     * Convert infix to postfix notation (Shunting Yard algorithm)
     */
    convertToPostfix(tokens) {
        const precedence = {
            '+': 1, '-': 1,
            '*': 2, '/': 2, '%': 2,
            '**': 3,
            'u-': 4  // Unary minus has highest precedence
        };

        // Right associative operators
        const rightAssociative = new Set(['**', 'u-']);

        const output = [];
        const operators = [];

        for (const token of tokens) {
            if (/^\d+\.?\d*$/.test(token)) {
                output.push(token);
            } else if (token === '(') {
                operators.push(token);
            } else if (token === ')') {
                while (operators.length && operators[operators.length - 1] !== '(') {
                    output.push(operators.pop());
                }
                operators.pop(); // Remove '('
            } else if (precedence[token]) {
                while (
                    operators.length &&
                    operators[operators.length - 1] !== '(' &&
                    precedence[operators[operators.length - 1]] &&
                    (
                        (precedence[operators[operators.length - 1]] > precedence[token]) ||
                        (precedence[operators[operators.length - 1]] === precedence[token] && 
                         !rightAssociative.has(token))
                    )
                ) {
                    output.push(operators.pop());
                }
                operators.push(token);
            }
        }

        while (operators.length) {
            output.push(operators.pop());
        }

        return output;
    }

    /**
     * Evaluate postfix expression
     */
    evaluatePostfix(postfix) {
        const stack = [];

        for (const token of postfix) {
            if (/^\d+\.?\d*$/.test(token)) {
                stack.push(parseFloat(token));
            } else if (token === 'u-') {
                // Unary minus
                if (stack.length < 1) {
                    throw new RuleFlowException('Invalid expression: insufficient operands for unary minus');
                }
                const operand = stack.pop();
                stack.push(-operand);
            } else {
                // Binary operators
                if (stack.length < 2) {
                    throw new RuleFlowException(`Invalid expression: insufficient operands for operator '${token}'`);
                }
                
                const right = stack.pop();
                const left = stack.pop();
                
                let result;
                switch (token) {
                    case '+':
                        result = left + right;
                        break;
                    case '-':
                        result = left - right;
                        break;
                    case '*':
                        result = left * right;
                        break;
                    case '/':
                        if (right === 0) {
                            throw new RuleFlowException('Division by zero');
                        }
                        result = left / right;
                        break;
                    case '%':
                        if (right === 0) {
                            throw new RuleFlowException('Modulo by zero');
                        }
                        result = left % right;
                        break;
                    case '**':
                        result = Math.pow(left, right);
                        break;
                    default:
                        throw new RuleFlowException(`Unknown operator: ${token}`);
                }
                
                stack.push(result);
            }
        }

        if (stack.length !== 1) {
            throw new RuleFlowException('Invalid expression: final stack should contain exactly one value');
        }

        return stack[0];
    }

    /**
     * Apply automatic rounding to prevent floating point precision issues
     */
    applyAutoRounding(result) {
        if (this.autoRoundPrecision === null || typeof result !== 'number') {
            return result;
        }

        // Check if result has precision issues
        const stringResult = result.toString();
        if (stringResult.includes('e-') || 
            (stringResult.includes('.') && stringResult.length > this.autoRoundPrecision + 2)) {
            
            const rounded = parseFloat(result.toFixed(this.autoRoundPrecision));
            
            // Only apply rounding if the difference is small (indicating precision issues)
            if (Math.abs(result - rounded) < this.autoRoundThreshold) {
                return rounded;
            }
        }

        return result;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ExpressionEvaluator, RuleFlowException };
} else {
    window.ExpressionEvaluator = ExpressionEvaluator;
    window.RuleFlowException = RuleFlowException;
}