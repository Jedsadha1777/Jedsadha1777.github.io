/**
 * RuleFlow UI - Example Configurations
 * jQuery-based UI helpers for managing examples
 */

const RuleFlowExamples = {
    examples: {
        pricing: {
            title: 'Pricing Calculator',
            description: 'Calculate total price with tax and discounts',
            icon: 'bi-calculator',
            config: {
                formulas: [
                    {
                        id: 'subtotal',
                        formula: 'price * quantity',
                        inputs: ['price', 'quantity'],
                        as: '$subtotal'
                    },
                    {
                        id: 'discount_amount',
                        formula: 'discount($subtotal, discount_rate)',
                        inputs: ['$subtotal', 'discount_rate']
                    },
                    {
                        id: 'tax_amount',
                        formula: '($subtotal - discount_amount) * tax_rate',
                        inputs: ['$subtotal', 'discount_amount', 'tax_rate']
                    },
                    {
                        id: 'total',
                        formula: '$subtotal - discount_amount + tax_amount',
                        inputs: ['$subtotal', 'discount_amount', 'tax_amount']
                    }
                ]
            },
            sampleInputs: {
                price: 100,
                quantity: 2,
                discount_rate: 10,
                tax_rate: 0.07
            }
        },

        scoring: {
            title: 'Credit Scoring',
            description: 'Multi-factor credit assessment logic',
            icon: 'bi-trophy',
            config: {
                formulas: [
                    {
                        id: 'income_score',
                        formula: 'min(income / 1000, 100)',
                        inputs: ['income']
                    },
                    {
                        id: 'age_factor',
                        switch: 'age',
                        when: [
                            {
                                if: { 
                                    and: [
                                        { op: 'gte', value: 25 },
                                        { op: 'lte', value: 65 }
                                    ]
                                },
                                result: 1.0
                            }
                        ],
                        default: 0.8
                    },
                    {
                        id: 'credit_rating',
                        switch: 'credit_score',
                        when: [
                            {
                                if: { op: 'gte', value: 750 },
                                result: 'Excellent'
                            },
                            {
                                if: { op: 'gte', value: 650 },
                                result: 'Good'
                            },
                            {
                                if: { op: 'gte', value: 550 },
                                result: 'Fair'
                            }
                        ],
                        default: 'Poor'
                    },
                    {
                        id: 'final_score',
                        formula: 'income_score * age_factor',
                        inputs: ['income_score', 'age_factor']
                    }
                ]
            },
            sampleInputs: {
                income: 75000,
                age: 35,
                credit_score: 720
            }
        },

        health: {
            title: 'Health Metrics',
            description: 'BMI and health score calculations using Switch Logic',
            icon: 'bi-heart-pulse',
            config: {
                formulas: [
                    {
                        id: 'bmi_value',
                        formula: 'bmi(weight, height)',
                        inputs: ['weight', 'height'],
                        as: '$bmi'
                    }
                ],
                switches: [
                    {
                        id: 'health_score',
                        switch: '$bmi',
                        when: [
                            {
                                if: { 
                                    and: [
                                        { op: 'gte', value: 18.5 },
                                        { op: 'lte', value: 24.9 }
                                    ]
                                },
                                result: 100
                            },
                            {
                                if: { op: 'lt', value: 18.5 },
                                result: 60
                            }
                        ],
                        default: 40
                    },
                    {
                        id: 'bmi_category',
                        switch: '$bmi',
                        when: [
                            {
                                if: { op: 'lt', value: 18.5 },
                                result: 'Underweight'
                            },
                            {
                                if: { op: 'lte', value: 24.9 },
                                result: 'Normal'
                            },
                            {
                                if: { op: 'lte', value: 29.9 },
                                result: 'Overweight'
                            }
                        ],
                        default: 'Obese'
                    }
                ]
            },
            sampleInputs: {
                weight: 70,
                height: 175
            }
        },

        insurance: {
            title: 'Insurance Premium',
            description: 'Calculate insurance premium with risk factors',
            icon: 'bi-shield-check',
            config: {
                formulas: [
                    {
                        id: 'base_premium',
                        formula: 'coverage_amount * 0.01',
                        inputs: ['coverage_amount']
                    },
                    {
                        id: 'age_multiplier',
                        switch: 'age',
                        when: [
                            {
                                if: { op: 'lt', value: 25 },
                                result: 1.5
                            },
                            {
                                if: { op: 'lte', value: 50 },
                                result: 1.0
                            },
                            {
                                if: { op: 'lte', value: 65 },
                                result: 1.2
                            }
                        ],
                        default: 1.8
                    },
                    {
                        id: 'risk_multiplier',
                        switch: 'risk_category',
                        when: [
                            {
                                if: { op: 'eq', value: 'low' },
                                result: 0.9
                            },
                            {
                                if: { op: 'eq', value: 'medium' },
                                result: 1.0
                            },
                            {
                                if: { op: 'eq', value: 'high' },
                                result: 1.3
                            }
                        ],
                        default: 1.5
                    },
                    {
                        id: 'final_premium',
                        formula: 'base_premium * age_multiplier * risk_multiplier',
                        inputs: ['base_premium', 'age_multiplier', 'risk_multiplier']
                    }
                ]
            },
            sampleInputs: {
                coverage_amount: 100000,
                age: 35,
                risk_category: 'medium'
            }
        },

        loan: {
            title: 'Loan Approval',
            description: 'Complex loan approval with nested conditions',
            icon: 'bi-bank',
            config: {
                formulas: [
                    {
                        id: 'debt_to_income',
                        formula: '(monthly_debt / monthly_income) * 100',
                        inputs: ['monthly_debt', 'monthly_income']
                    },
                    {
                        id: 'loan_to_value',
                        formula: '(loan_amount / property_value) * 100',
                        inputs: ['loan_amount', 'property_value']
                    }
                ],
                conditions: [
                    {
                        id: 'approval_status',
                        conditions: [
                            {
                                condition: {
                                    and: [
                                        { field: 'credit_score', operator: 'gte', value: 700 },
                                        { field: 'debt_to_income', operator: 'lte', value: 35 },
                                        { field: 'loan_to_value', operator: 'lte', value: 80 }
                                    ]
                                },
                                value: 'Approved'
                            },
                            {
                                condition: {
                                    and: [
                                        { field: 'credit_score', operator: 'gte', value: 650 },
                                        { field: 'debt_to_income', operator: 'lte', value: 40 }
                                    ]
                                },
                                value: 'Conditional Approval'
                            }
                        ],
                        default: 'Denied'
                    }
                ]
            },
            sampleInputs: {
                credit_score: 720,
                monthly_income: 8000,
                monthly_debt: 2500,
                loan_amount: 250000,
                property_value: 320000
            }
        }
    },

    /**
     * Initialize example cards in the UI
     */
    init() {
        const $container = $('#exampleCards');
        $container.empty();

        Object.keys(this.examples).forEach(key => {
            const example = this.examples[key];
            const $card = $(`
                <div class="col-md-4 col-lg-3 mb-3">
                    <div class="card example-card h-100" data-example="${key}">
                        <div class="card-body">
                            <h6 class="card-title">
                                <i class="${example.icon}"></i> ${example.title}
                            </h6>
                            <p class="card-text small">${example.description}</p>
                        </div>
                    </div>
                </div>
            `);
            $container.append($card);
        });

        // Bind click events
        $container.on('click', '.example-card', (e) => {
            const exampleKey = $(e.currentTarget).data('example');
            this.loadExample(exampleKey);
        });
    },

    /**
     * Load an example configuration
     */
    loadExample(key) {
        const example = this.examples[key];
        if (!example) return;

        // Update active state
        $('.example-card').removeClass('active');
        $(`.example-card[data-example="${key}"]`).addClass('active');

        // Load configuration
        $('#configEditor').val(JSON.stringify(example.config, null, 2));

        // Trigger UI update
        if (window.RuleFlowUI) {
            window.RuleFlowUI.updateInputVariables();
            window.RuleFlowUI.setInputValues(example.sampleInputs);
        }

        // Debug log
        this.debugLog(`Loaded example: ${example.title}`, 'info');
    },

    /**
     * Get example by key
     */
    getExample(key) {
        return this.examples[key];
    },

    /**
     * Get all example keys
     */
    getExampleKeys() {
        return Object.keys(this.examples);
    },

    /**
     * Debug logging
     */
    debugLog(message, type = 'info') {
        if (window.RuleFlowUI && window.RuleFlowUI.debug) {
            window.RuleFlowUI.debug(message, type);
        }
        console.log(`[RuleFlowExamples] ${message}`);
    }
};

// Export for global use
window.RuleFlowExamples = RuleFlowExamples;