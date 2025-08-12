/**
 * RuleFlow Core - FunctionRegistry
 * Complete 1:1 match with TypeScript version
 */

class FunctionRegistry {
    constructor() {
        this.functions = new Map();
        this.functionInfo = new Map();
        this.registerBuiltInFunctions();
    }

    // ====================================
    // CORE API METHODS (1:1 Match with TypeScript)
    // ====================================

    /**
     * Register a new function with TypeScript-compatible metadata
     */
    register(name, handler, info = {}) {
        if (typeof handler !== 'function') {
            throw new RuleFlowException(`Function '${name}' must be a function`);
        }

        this.functions.set(name, handler);
        
        if (info) {
            this.functionInfo.set(name, {
                name,
                category: info.category || 'Custom',
                description: info.description,
                parameters: info.parameters,
                returnType: info.returnType
            });
        }
    }

    /**
     * Call a registered function - exact TypeScript match
     */
    call(name, args = []) {
        const handler = this.functions.get(name);
        
        if (!handler) {
            throw new RuleFlowException(`Unknown function: ${name}. Available functions: ${Array.from(this.functions.keys()).join(', ')}`);
        }

        try {
            return handler(...args);
        } catch (error) {
            throw new RuleFlowException(`Error calling function '${name}': ${error.message}`);
        }
    }

    /**
     * Get available functions - TypeScript method name
     */
    getAvailableFunctions() {
        return Array.from(this.functions.keys());
    }

    /**
     * Get functions by category - TypeScript return format
     */
    getFunctionsByCategory() {
        const categories = {
            Math: [],
            Statistics: [],
            Business: [],
            Utility: []
        };

        for (const [name, info] of this.functionInfo.entries()) {
            const category = info.category || 'Utility';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(name);
        }

        return categories;
    }

    /**
     * Get function info - TypeScript method name
     */
    getFunctionInfo(name) {
        return this.functionInfo.get(name);
    }

    /**
     * Check if function exists - TypeScript method name
     */
    hasFunction(name) {
        return this.functions.has(name);
    }

    /**
     * List all functions with metadata - TypeScript method
     */
    listFunctions() {
        const functions = [];
        
        for (const [name] of this.functions.entries()) {
            const info = this.functionInfo.get(name);
            functions.push({
                name,
                category: info?.category,
                description: info?.description
            });
        }
        
        return functions;
    }

    /**
     * Unregister a function - TypeScript method
     */
    unregister(name) {
        const removed = this.functions.delete(name);
        this.functionInfo.delete(name);
        return removed;
    }

    // ====================================
    // LEGACY COMPATIBILITY METHODS
    // ====================================

    getFunctionNames() {
        return this.getAvailableFunctions();
    }

    has(name) {
        return this.hasFunction(name);
    }

    getMetadata(name) {
        return this.getFunctionInfo(name);
    }

    // ====================================
    // BUILT-IN FUNCTION REGISTRATION
    // ====================================

    registerBuiltInFunctions() {
        this.registerMathFunctions();
        this.registerStatisticsFunctions();
        this.registerBusinessFunctions();
        this.registerUtilityFunctions();
    }

    // ====================================
    // MATH FUNCTIONS (Enhanced - matches TypeScript)
    // ====================================
    registerMathFunctions() {
        // Basic math operations
        this.register('abs', (x) => Math.abs(x), {
            category: 'Math',
            description: 'Absolute value',
            parameters: ['number'],
            returnType: 'number'
        });

        this.register('min', (...args) => Math.min(...args), {
            category: 'Math',
            description: 'Minimum value',
            parameters: ['...numbers'],
            returnType: 'number'
        });

        this.register('max', (...args) => Math.max(...args), {
            category: 'Math',
            description: 'Maximum value',
            parameters: ['...numbers'],
            returnType: 'number'
        });

        this.register('sqrt', (x) => {
            if (x < 0) {
                throw new Error(`Cannot calculate square root of negative number: ${x}`);
            }
            return Math.sqrt(x);
        }, {
            category: 'Math',
            description: 'Square root',
            parameters: ['number'],
            returnType: 'number'
        });

        // Rounding functions
        this.register('round', (x, precision = 0) => {
            const factor = Math.pow(10, precision);
            return Math.round(x * factor) / factor;
        }, {
            category: 'Math',
            description: 'Round to precision',
            parameters: ['number', 'precision?'],
            returnType: 'number'
        });

        this.register('ceil', (x) => Math.ceil(x), {
            category: 'Math',
            description: 'Round up',
            parameters: ['number'],
            returnType: 'number'
        });

        this.register('floor', (x) => Math.floor(x), {
            category: 'Math',
            description: 'Round down',
            parameters: ['number'],
            returnType: 'number'
        });

        this.register('pow', (x, y) => Math.pow(x, y), {
            category: 'Math',
            description: 'Power function',
            parameters: ['base', 'exponent'],
            returnType: 'number'
        });

        // Logarithmic and exponential functions
        this.register('log', (x, base = Math.E) => {
            if (x <= 0) {
                throw new Error(`Cannot calculate logarithm of non-positive number: ${x}`);
            }
            if (base <= 0 || base === 1) {
                throw new Error(`Invalid logarithm base: ${base}`);
            }
            return Math.log(x) / Math.log(base);
        }, {
            category: 'Math',
            description: 'Logarithm with optional base',
            parameters: ['number', 'base?'],
            returnType: 'number'
        });

        this.register('exp', (x) => Math.exp(x), {
            category: 'Math',
            description: 'Exponential function (e^x)',
            parameters: ['number'],
            returnType: 'number'
        });

        // Trigonometric functions
        this.register('sin', (x) => Math.sin(x), {
            category: 'Math',
            description: 'Sine function (radians)',
            parameters: ['radians'],
            returnType: 'number'
        });

        this.register('cos', (x) => Math.cos(x), {
            category: 'Math',
            description: 'Cosine function (radians)',
            parameters: ['radians'],
            returnType: 'number'
        });

        this.register('tan', (x) => Math.tan(x), {
            category: 'Math',
            description: 'Tangent function (radians)',
            parameters: ['radians'],
            returnType: 'number'
        });
    }

    // ====================================
    // STATISTICS FUNCTIONS (matches TypeScript)
    // ====================================
    registerStatisticsFunctions() {
        this.register('avg', (...args) => {
            if (args.length === 0) return 0;
            return args.reduce((sum, x) => sum + x, 0) / args.length;
        }, {
            category: 'Statistics',
            description: 'Average of numbers',
            parameters: ['...numbers'],
            returnType: 'number'
        });

        this.register('sum', (...args) => {
            return args.reduce((sum, x) => sum + x, 0);
        }, {
            category: 'Statistics',
            description: 'Sum of numbers',
            parameters: ['...numbers'],
            returnType: 'number'
        });

        this.register('count', (...args) => {
            return args.length;
        }, {
            category: 'Statistics',
            description: 'Count of values',
            parameters: ['...values'],
            returnType: 'number'
        });

        this.register('median', (...args) => {
            if (args.length === 0) return 0;
            const sorted = [...args].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);

            return sorted.length % 2 !== 0
                ? sorted[mid]
                : (sorted[mid - 1] + sorted[mid]) / 2;
        }, {
            category: 'Statistics',
            description: 'Median value',
            parameters: ['...numbers'],
            returnType: 'number'
        });

        this.register('variance', (...args) => {
            if (args.length === 0) return 0;
            const mean = args.reduce((sum, x) => sum + x, 0) / args.length;
            const squaredDiffs = args.map(x => Math.pow(x - mean, 2));
            return squaredDiffs.reduce((sum, x) => sum + x, 0) / args.length;
        }, {
            category: 'Statistics',
            description: 'Variance',
            parameters: ['...numbers'],
            returnType: 'number'
        });

        this.register('stddev', (...args) => {
            if (args.length === 0) return 0;
            const mean = args.reduce((sum, x) => sum + x, 0) / args.length;
            const squaredDiffs = args.map(x => Math.pow(x - mean, 2));
            const variance = squaredDiffs.reduce((sum, x) => sum + x, 0) / args.length;
            return Math.sqrt(variance);
        }, {
            category: 'Statistics',
            description: 'Standard deviation',
            parameters: ['...numbers'],
            returnType: 'number'
        });
    }

    // ====================================
    // BUSINESS FUNCTIONS (matches TypeScript)
    // ====================================
    registerBusinessFunctions() {
        // Fixed percentage function (matches TypeScript exactly)
        this.register('percentage', (value, percent) => {
            return (value * percent) / 100;
        }, {
            category: 'Business',
            description: 'Calculate percentage amount of value',
            parameters: ['value', 'percent'],
            returnType: 'number'
        });

        this.register('percentage_of', (part, total) => {
            if (total === 0) return 0;
            return (part / total) * 100;
        }, {
            category: 'Business',
            description: 'Calculate what percentage part is of total',
            parameters: ['part', 'total'],
            returnType: 'number'
        });

        this.register('compound_interest', (principal, rate, time, frequency = 1) => {
            if (principal < 0 || rate < 0 || time < 0) {
                throw new Error('Principal, rate, and time must be non-negative');
            }
            if (rate === 0) return principal;
            return principal * Math.pow(1 + rate / frequency, frequency * time);
        }, {
            category: 'Business',
            description: 'Compound interest calculation',
            parameters: ['principal', 'rate', 'time', 'frequency?'],
            returnType: 'number'
        });

        this.register('simple_interest', (principal, rate, time) => {
            if (principal < 0 || rate < 0 || time < 0) {
                throw new Error('Principal, rate, and time must be non-negative');
            }
            return principal * (1 + rate * time);
        }, {
            category: 'Business',
            description: 'Simple interest calculation',
            parameters: ['principal', 'rate', 'time'],
            returnType: 'number'
        });

        this.register('discount', (originalPrice, discountPercent) => {
            if (discountPercent < 0 || discountPercent > 100) {
                throw new Error('Discount percentage must be between 0 and 100');
            }
            return originalPrice * (1 - discountPercent / 100);
        }, {
            category: 'Business',
            description: 'Apply discount percentage to price',
            parameters: ['originalPrice', 'discountPercent'],
            returnType: 'number'
        });

        this.register('markup', (cost, markupPercent) => {
            if (markupPercent < 0) {
                throw new Error('Markup percentage must be non-negative');
            }
            return cost * (1 + markupPercent / 100);
        }, {
            category: 'Business',
            description: 'Apply markup percentage to cost',
            parameters: ['cost', 'markupPercent'],
            returnType: 'number'
        });

        // PMT (Payment) function for loan calculations - matches TypeScript
        this.register('pmt', (principal, rate, nper) => {
            if (principal <= 0 || rate < 0 || nper <= 0) {
                throw new Error('Invalid loan parameters: principal > 0, rate >= 0, nper > 0');
            }
            if (rate === 0) {
                return principal / nper;
            }
            return principal * (rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
        }, {
            category: 'Business',
            description: 'Calculate loan payment amount',
            parameters: ['principal', 'monthlyRate', 'numberOfPayments'],
            returnType: 'number'
        });
    }

    // ====================================
    // UTILITY FUNCTIONS (matches TypeScript)
    // ====================================
    registerUtilityFunctions() {
        this.register('clamp', (value, min, max) => {
            return Math.min(Math.max(value, min), max);
        }, {
            category: 'Utility',
            description: 'Clamp value between min and max',
            parameters: ['value', 'min', 'max'],
            returnType: 'number'
        });

        this.register('normalize', (value, min, max) => {
            if (max === min) return 0;
            return (value - min) / (max - min);
        }, {
            category: 'Utility',
            description: 'Normalize value to 0-1 range',
            parameters: ['value', 'min', 'max'],
            returnType: 'number'
        });

        this.register('coalesce', (...args) => {
            for (const arg of args) {
                if (arg !== null && arg !== undefined) {
                    return arg;
                }
            }
            return null;
        }, {
            category: 'Utility',
            description: 'Return first non-null value',
            parameters: ['...values'],
            returnType: 'any'
        });

        this.register('if_null', (value, defaultValue) => {
            return (value === null || value === undefined) ? defaultValue : value;
        }, {
            category: 'Utility',
            description: 'Return default if value is null/undefined',
            parameters: ['value', 'default'],
            returnType: 'any'
        });

        // BMI and Age functions (moved to Utility category to match TypeScript)
        this.register('bmi', (weight, height) => {
            if (weight <= 0 || height <= 0) {
                throw new Error('Weight and height must be positive');
            }
            // Height in cm, convert to meters
            const heightInMeters = height / 100;
            return weight / (heightInMeters * heightInMeters);
        }, {
            category: 'Utility',
            description: 'Calculate BMI',
            parameters: ['weight_kg', 'height_cm'],
            returnType: 'number'
        });

        this.register('age', (birthDate, referenceDate = null) => {
            const birth = new Date(birthDate);
            const reference = referenceDate ? new Date(referenceDate) : new Date();
            
            if (isNaN(birth.getTime())) {
                throw new Error('Invalid birth date');
            }
            if (referenceDate && isNaN(reference.getTime())) {
                throw new Error('Invalid reference date');
            }

            let age = reference.getFullYear() - birth.getFullYear();
            const monthDiff = reference.getMonth() - birth.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
                age--;
            }
            
            return age;
        }, {
            category: 'Utility',
            description: 'Calculate age from birth date',
            parameters: ['birth_date', 'reference_date?'],
            returnType: 'number'
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FunctionRegistry };
} else {
    window.FunctionRegistry = FunctionRegistry;
}