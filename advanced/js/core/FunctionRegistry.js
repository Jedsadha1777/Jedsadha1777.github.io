/**
 * RuleFlow Core - FunctionRegistry
 * Ported from TypeScript with all built-in functions
 */

class FunctionRegistry {
    constructor() {
        this.functions = new Map();
        this.initializeBuiltInFunctions();
    }

    /**
     * Register a new function
     */
    register(name, func, metadata = {}) {
        if (typeof func !== 'function') {
            throw new RuleFlowException(`Function '${name}' must be a function`);
        }

        this.functions.set(name, {
            func,
            metadata: {
                category: metadata.category || 'Custom',
                description: metadata.description || '',
                params: metadata.params || [],
                returns: metadata.returns || 'any',
                examples: metadata.examples || []
            }
        });
    }

    /**
     * Call a registered function
     */
    call(name, args = []) {
        if (!this.functions.has(name)) {
            throw new RuleFlowException(`Function '${name}' is not registered`);
        }

        const { func } = this.functions.get(name);
        
        try {
            return func.apply(null, args);
        } catch (error) {
            throw new RuleFlowException(`Error calling function '${name}': ${error.message}`);
        }
    }

    /**
     * Check if function exists
     */
    has(name) {
        return this.functions.has(name);
    }

    /**
     * Get function metadata
     */
    getMetadata(name) {
        if (!this.functions.has(name)) {
            return null;
        }
        return this.functions.get(name).metadata;
    }

    /**
     * Get all registered function names
     */
    getFunctionNames() {
        return Array.from(this.functions.keys());
    }

    /**
     * Get functions by category
     */
    getFunctionsByCategory(category) {
        const result = {};
        for (const [name, { metadata }] of this.functions) {
            if (metadata.category === category) {
                result[name] = metadata;
            }
        }
        return result;
    }

    /**
     * Initialize all built-in functions
     */
    initializeBuiltInFunctions() {
        // Math Functions
        this.register('sqrt', Math.sqrt, {
            category: 'Math',
            description: 'Square root of a number',
            params: ['number'],
            returns: 'number',
            examples: ['sqrt(16) = 4']
        });

        this.register('pow', Math.pow, {
            category: 'Math',
            description: 'Raise number to power',
            params: ['base', 'exponent'],
            returns: 'number',
            examples: ['pow(2, 3) = 8']
        });

        this.register('abs', Math.abs, {
            category: 'Math',
            description: 'Absolute value',
            params: ['number'],
            returns: 'number',
            examples: ['abs(-5) = 5']
        });

        this.register('min', Math.min, {
            category: 'Math',
            description: 'Minimum of numbers',
            params: ['...numbers'],
            returns: 'number',
            examples: ['min(1, 2, 3) = 1']
        });

        this.register('max', Math.max, {
            category: 'Math',
            description: 'Maximum of numbers',
            params: ['...numbers'],
            returns: 'number',
            examples: ['max(1, 2, 3) = 3']
        });

        this.register('round', (num, decimals = 0) => {
            const factor = Math.pow(10, decimals);
            return Math.round(num * factor) / factor;
        }, {
            category: 'Math',
            description: 'Round number to specified decimals',
            params: ['number', 'decimals'],
            returns: 'number',
            examples: ['round(3.14159, 2) = 3.14']
        });

        this.register('ceil', Math.ceil, {
            category: 'Math',
            description: 'Round up to nearest integer',
            params: ['number'],
            returns: 'number',
            examples: ['ceil(3.2) = 4']
        });

        this.register('floor', Math.floor, {
            category: 'Math',
            description: 'Round down to nearest integer',
            params: ['number'],
            returns: 'number',
            examples: ['floor(3.8) = 3']
        });

        // Statistics Functions
        this.register('avg', (...numbers) => {
            if (numbers.length === 0) return 0;
            return numbers.reduce((a, b) => a + b, 0) / numbers.length;
        }, {
            category: 'Statistics',
            description: 'Average of numbers',
            params: ['...numbers'],
            returns: 'number',
            examples: ['avg(1, 2, 3) = 2']
        });

        this.register('sum', (...numbers) => {
            return numbers.reduce((a, b) => a + b, 0);
        }, {
            category: 'Statistics',
            description: 'Sum of numbers',
            params: ['...numbers'],
            returns: 'number',
            examples: ['sum(1, 2, 3) = 6']
        });

        this.register('count', (...items) => {
            return items.length;
        }, {
            category: 'Statistics',
            description: 'Count of items',
            params: ['...items'],
            returns: 'number',
            examples: ['count(1, 2, 3) = 3']
        });

        this.register('median', (...numbers) => {
            const sorted = numbers.slice().sort((a, b) => a - b);
            const middle = Math.floor(sorted.length / 2);
            
            if (sorted.length % 2 === 0) {
                return (sorted[middle - 1] + sorted[middle]) / 2;
            } else {
                return sorted[middle];
            }
        }, {
            category: 'Statistics',
            description: 'Median of numbers',
            params: ['...numbers'],
            returns: 'number',
            examples: ['median(1, 2, 3) = 2']
        });

        this.register('variance', (...numbers) => {
            if (numbers.length === 0) return 0;
            const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
            const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
            return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
        }, {
            category: 'Statistics',
            description: 'Variance of numbers',
            params: ['...numbers'],
            returns: 'number',
            examples: ['variance(1, 2, 3) = 0.67']
        });

        this.register('stddev', (...numbers) => {
            const variance = this.call('variance', numbers);
            return Math.sqrt(variance);
        }, {
            category: 'Statistics',
            description: 'Standard deviation of numbers',
            params: ['...numbers'],
            returns: 'number',
            examples: ['stddev(1, 2, 3) = 0.82']
        });

        // Business Functions
        this.register('percentage', (value, total) => {
            if (total === 0) return 0;
            return (value / total) * 100;
        }, {
            category: 'Business',
            description: 'Calculate percentage',
            params: ['value', 'total'],
            returns: 'number',
            examples: ['percentage(50, 200) = 25']
        });

        this.register('discount', (price, rate) => {
            return price * (1 - rate / 100);
        }, {
            category: 'Business',
            description: 'Apply discount to price',
            params: ['price', 'discount_rate'],
            returns: 'number',
            examples: ['discount(100, 10) = 90']
        });

        this.register('compound_interest', (principal, rate, time, compounding = 1) => {
            return principal * Math.pow(1 + rate / (100 * compounding), compounding * time);
        }, {
            category: 'Business',
            description: 'Calculate compound interest',
            params: ['principal', 'annual_rate', 'years', 'compounding_periods'],
            returns: 'number',
            examples: ['compound_interest(1000, 5, 2) = 1102.50']
        });

        this.register('bmi', (weight, height) => {
            // Height in cm, convert to meters
            const heightInMeters = height / 100;
            return weight / (heightInMeters * heightInMeters);
        }, {
            category: 'Health',
            description: 'Calculate BMI',
            params: ['weight_kg', 'height_cm'],
            returns: 'number',
            examples: ['bmi(70, 175) = 22.86']
        });

        this.register('age', (birthDate, referenceDate = null) => {
            const birth = new Date(birthDate);
            const reference = referenceDate ? new Date(referenceDate) : new Date();
            
            let age = reference.getFullYear() - birth.getFullYear();
            const monthDiff = reference.getMonth() - birth.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
                age--;
            }
            
            return age;
        }, {
            category: 'Utility',
            description: 'Calculate age from birth date',
            params: ['birth_date', 'reference_date'],
            returns: 'number',
            examples: ['age("1990-01-01") = 34']
        });

        // String Functions
        this.register('concat', (...strings) => {
            return strings.join('');
        }, {
            category: 'String',
            description: 'Concatenate strings',
            params: ['...strings'],
            returns: 'string',
            examples: ['concat("Hello", " ", "World") = "Hello World"']
        });

        this.register('length', (str) => {
            return String(str).length;
        }, {
            category: 'String',
            description: 'Get string length',
            params: ['string'],
            returns: 'number',
            examples: ['length("Hello") = 5']
        });

        this.register('upper', (str) => {
            return String(str).toUpperCase();
        }, {
            category: 'String',
            description: 'Convert to uppercase',
            params: ['string'],
            returns: 'string',
            examples: ['upper("hello") = "HELLO"']
        });

        this.register('lower', (str) => {
            return String(str).toLowerCase();
        }, {
            category: 'String',
            description: 'Convert to lowercase',
            params: ['string'],
            returns: 'string',
            examples: ['lower("HELLO") = "hello"']
        });

        // Date Functions
        this.register('now', () => {
            return new Date().toISOString();
        }, {
            category: 'Date',
            description: 'Current date/time',
            params: [],
            returns: 'string',
            examples: ['now() = "2024-01-01T12:00:00.000Z"']
        });

        this.register('year', (date = null) => {
            const d = date ? new Date(date) : new Date();
            return d.getFullYear();
        }, {
            category: 'Date',
            description: 'Get year from date',
            params: ['date'],
            returns: 'number',
            examples: ['year("2024-01-01") = 2024']
        });

        this.register('month', (date = null) => {
            const d = date ? new Date(date) : new Date();
            return d.getMonth() + 1; // JavaScript months are 0-based
        }, {
            category: 'Date',
            description: 'Get month from date',
            params: ['date'],
            returns: 'number',
            examples: ['month("2024-01-01") = 1']
        });

        this.register('day', (date = null) => {
            const d = date ? new Date(date) : new Date();
            return d.getDate();
        }, {
            category: 'Date',
            description: 'Get day from date',
            params: ['date'],
            returns: 'number',
            examples: ['day("2024-01-01") = 1']
        });

        // Conditional Functions
        this.register('if', (condition, trueValue, falseValue) => {
            return condition ? trueValue : falseValue;
        }, {
            category: 'Logic',
            description: 'Conditional value selection',
            params: ['condition', 'true_value', 'false_value'],
            returns: 'any',
            examples: ['if(true, "yes", "no") = "yes"']
        });

        // Validation Functions
        this.register('isNull', (value) => {
            return value === null || value === undefined;
        }, {
            category: 'Validation',
            description: 'Check if value is null/undefined',
            params: ['value'],
            returns: 'boolean',
            examples: ['isNull(null) = true']
        });

        this.register('isEmpty', (value) => {
            if (value === null || value === undefined) return true;
            if (typeof value === 'string') return value.trim() === '';
            if (Array.isArray(value)) return value.length === 0;
            return false;
        }, {
            category: 'Validation',
            description: 'Check if value is empty',
            params: ['value'],
            returns: 'boolean',
            examples: ['isEmpty("") = true']
        });

        this.register('isNumber', (value) => {
            return !isNaN(value) && !isNaN(parseFloat(value));
        }, {
            category: 'Validation',
            description: 'Check if value is a number',
            params: ['value'],
            returns: 'boolean',
            examples: ['isNumber("123") = true']
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FunctionRegistry };
} else {
    window.FunctionRegistry = FunctionRegistry;
}