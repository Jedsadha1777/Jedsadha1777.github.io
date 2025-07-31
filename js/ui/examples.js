/**
 * RuleFlow UI - Examples
 * Example configurations for quick testing
 */

const RuleFlowExamples = {
    /**
     * Get all example configurations
     */
    getExamples() {
        return [
            {
                id: 'loan_approval',
                title: 'Loan Approval',
                description: 'Basic loan approval logic with age and income checks',
                config: {
                    formulas: [
                        {
                            id: 'loan_decision',
                            switch: 'age',
                            when: [
                                {
                                    if: { op: '>=', var: 'age', value: 18 },
                                    result: { 
                                        formula: 'if($income >= 30000, "approved", "rejected")'
                                    }
                                }
                            ],
                            default: 'rejected'
                        }
                    ]
                },
                inputs: {
                    age: 25,
                    income: 35000
                }
            },
            {
                id: 'scoring_system',
                title: 'Credit Scoring',
                description: 'Multi-factor credit scoring system',
                config: {
                    formulas: [
                        {
                            id: 'income_score',
                            formula: 'clamp($income / 1000, 0, 100)',
                            as: '$income_points'
                        },
                        {
                            id: 'age_score',
                            formula: 'clamp(($age - 18) * 2, 0, 100)',
                            as: '$age_points'
                        },
                        {
                            id: 'final_score',
                            formula: '($income_points * 0.7) + ($age_points * 0.3)'
                        },
                        {
                            id: 'credit_rating',
                            switch: 'final_score',
                            when: [
                                { if: { op: '>=', var: 'final_score', value: 80 }, result: 'Excellent' },
                                { if: { op: '>=', var: 'final_score', value: 60 }, result: 'Good' },
                                { if: { op: '>=', var: 'final_score', value: 40 }, result: 'Fair' }
                            ],
                            default: 'Poor'
                        }
                    ]
                },
                inputs: {
                    income: 50000,
                    age: 30
                }
            },
            {
                id: 'discount_calculator',
                title: 'Discount Calculator',
                description: 'Tiered discount system based on purchase amount',
                config: {
                    formulas: [
                        {
                            id: 'discount_rate',
                            switch: 'purchase_amount',
                            when: [
                                { if: { op: '>=', var: 'purchase_amount', value: 1000 }, result: 15 },
                                { if: { op: '>=', var: 'purchase_amount', value: 500 }, result: 10 },
                                { if: { op: '>=', var: 'purchase_amount', value: 100 }, result: 5 }
                            ],
                            default: 0,
                            as: '$discount_percent'
                        },
                        {
                            id: 'discount_amount',
                            formula: '$purchase_amount * ($discount_percent / 100)'
                        },
                        {
                            id: 'final_price',
                            formula: '$purchase_amount - $discount_amount'
                        }
                    ]
                },
                inputs: {
                    purchase_amount: 750
                }
            },
            {
                id: 'bmi_calculator',
                title: 'BMI Calculator',
                description: 'Body Mass Index calculator with health categories',
                config: {
                    formulas: [
                        {
                            id: 'bmi_value',
                            formula: 'bmi($weight, $height)',
                            as: '$bmi'
                        },
                        {
                            id: 'health_category',
                            switch: 'bmi',
                            when: [
                                { if: { op: '<', var: 'bmi', value: 18.5 }, result: 'Underweight' },
                                { if: { op: '<', var: 'bmi', value: 25 }, result: 'Normal' },
                                { if: { op: '<', var: 'bmi', value: 30 }, result: 'Overweight' }
                            ],
                            default: 'Obese'
                        }
                    ]
                },
                inputs: {
                    weight: 70,
                    height: 1.75
                }
            },
            {
                id: 'nested_conditions',
                title: 'Nested Logic',
                description: 'Complex nested AND/OR conditions',
                config: {
                    formulas: [
                        {
                            id: 'eligibility_check',
                            conditions: [
                                {
                                    if: {
                                        and: [
                                            { op: '>=', var: 'age', value: 18 },
                                            {
                                                or: [
                                                    { op: '>=', var: 'income', value: 30000 },
                                                    { op: '==', var: 'has_guarantor', value: true }
                                                ]
                                            }
                                        ]
                                    },
                                    result: 'eligible'
                                }
                            ],
                            default: 'not_eligible'
                        }
                    ]
                },
                inputs: {
                    age: 25,
                    income: 25000,
                    has_guarantor: true
                }
            },
            {
                id: 'insurance_premium',
                title: 'Insurance Premium',
                description: 'Auto insurance premium calculation',
                config: {
                    formulas: [
                        {
                            id: 'base_premium',
                            formula: '$vehicle_value * 0.05',
                            as: '$base'
                        },
                        {
                            id: 'age_factor',
                            switch: 'driver_age',
                            when: [
                                { if: { op: '<', var: 'driver_age', value: 25 }, result: 1.5 },
                                { if: { op: '<', var: 'driver_age', value: 60 }, result: 1.0 }
                            ],
                            default: 1.2,
                            as: '$age_multiplier'
                        },
                        {
                            id: 'experience_discount',
                            formula: 'clamp($years_experience * 0.02, 0, 0.3)',
                            as: '$experience_discount'
                        },
                        {
                            id: 'final_premium',
                            formula: '$base * $age_multiplier * (1 - $experience_discount)'
                        }
                    ]
                },
                inputs: {
                    vehicle_value: 25000,
                    driver_age: 30,
                    years_experience: 8
                }
            }
        ];
    },

    /**
     * Get example by ID
     */
    getExample(id) {
        return this.getExamples().find(example => example.id === id);
    },

    /**
     * Load example into UI
     */
    loadExample(id) {
        const example = this.getExample(id);
        if (!example) {
            console.error('Example not found:', id);
            return false;
        }

        try {
            // Clear existing components
            if (typeof clearAllComponents === 'function') {
                clearAllComponents();
            }

            // Load configuration
            this.loadConfiguration(example.config);

            // Set input values
            this.setInputValues(example.inputs);

            console.log('Loaded example:', example.title);
            return true;
        } catch (error) {
            console.error('Error loading example:', error);
            return false;
        }
    },

    /**
     * Load configuration into components
     */
    loadConfiguration(config) {
        if (!config.formulas || !Array.isArray(config.formulas)) {
            throw new Error('Invalid configuration: missing formulas array');
        }

        config.formulas.forEach(formula => {
            let componentType;
            let component;

            // Determine component type
            if (formula.formula) {
                componentType = 'formula';
                component = new FormulaComponent();
            } else if (formula.switch) {
                componentType = 'switch';
                component = new SwitchComponent();
            } else if (formula.conditions) {
                componentType = 'conditions';
                component = new ConditionsComponent();
            } else {
                throw new Error(`Unknown formula type for ${formula.id}`);
            }

            // Load formula data into component
            component.fromJSON(formula);

            // Add to components array (this assumes components array is accessible)
            if (typeof window.addComponentFromInstance === 'function') {
                window.addComponentFromInstance(componentType, component);
            }
        });
    },

    /**
     * Set input values in the UI
     */
    setInputValues(inputs) {
        Object.entries(inputs).forEach(([key, value]) => {
            const input = document.getElementById(`input_${key}`);
            if (input) {
                input.value = value;
            }
        });

        // Trigger input update if function exists
        if (typeof updateInputVariables === 'function') {
            updateInputVariables();
        }

        // Auto-execute if function exists
        if (typeof autoExecute === 'function') {
            setTimeout(autoExecute, 100);
        }
    },

    /**
     * Create example cards for UI
     */
    createExampleCards() {
        const examples = this.getExamples();
        return examples.map(example => ({
            id: example.id,
            title: example.title,
            description: example.description,
            onclick: () => this.loadExample(example.id)
        }));
    }
};

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RuleFlowExamples;
} else {
    window.RuleFlowExamples = RuleFlowExamples;
}