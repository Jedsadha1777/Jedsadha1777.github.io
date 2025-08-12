/**
 * RuleFlow Financial Functions Template
 * Ported directly from TypeScript version - exact 1:1 match
 */

const FINANCIAL_TEMPLATE = {
    functions: {
        loan_eligibility_score: (income, debt, creditScore) => {
            const dtiRatio = (debt / income) * 100;
            let score = 0;
            
            // Income scoring (40 points max)
            if (income >= 100000) score += 40;
            else if (income >= 50000) score += 30;
            else if (income >= 30000) score += 20;
            else score += 10;
            
            // DTI scoring (30 points max)
            if (dtiRatio <= 20) score += 30;
            else if (dtiRatio <= 40) score += 20;
            else if (dtiRatio <= 60) score += 10;
            
            // Credit score (30 points max)
            if (creditScore >= 750) score += 30;
            else if (creditScore >= 650) score += 20;
            else if (creditScore >= 550) score += 10;
            
            return Math.min(score, 100);
        },

        debt_to_income_ratio: (totalDebt, grossIncome) => {
            if (grossIncome <= 0) throw new Error('Income must be positive');
            return Math.round((totalDebt / grossIncome) * 100 * 100) / 100;
        },

        future_value: (presentValue, rate, periods) => {
            return Math.round(presentValue * Math.pow(1 + rate, periods) * 100) / 100;
        },

        present_value: (futureValue, rate, periods) => {
            return Math.round((futureValue / Math.pow(1 + rate, periods)) * 100) / 100;
        },

        mortgage_interest_total: (principal, rate, years) => {
            const monthlyRate = rate / 12;
            const totalPayments = years * 12;
            
            if (monthlyRate === 0) return 0;
            
            const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                                  (Math.pow(1 + monthlyRate, totalPayments) - 1);
            const totalPaid = monthlyPayment * totalPayments;
            const totalInterest = totalPaid - principal;
            
            return Math.round(totalInterest * 100) / 100;
        },

        tax_bracket: (income, filingStatus = 'single') => {
            const brackets = {
                single: [
                    [0, 11000, 10],
                    [11000, 44725, 12],
                    [44725, 95375, 22],
                    [95375, 182050, 24],
                    [182050, 231250, 32],
                    [231250, 578125, 35],
                    [578125, Infinity, 37]
                ],
                married: [
                    [0, 22000, 10],
                    [22000, 89450, 12],
                    [89450, 190750, 22],
                    [190750, 364200, 24],
                    [364200, 462500, 32],
                    [462500, 693750, 35],
                    [693750, Infinity, 37]
                ]
            };
            
            const statusBrackets = brackets[filingStatus] || brackets.single;
            
            for (const [min, max, rate] of statusBrackets) {
                if (income > min && income <= max) {
                    return rate;
                }
            }
            
            return statusBrackets[statusBrackets.length - 1][2];
        },

        calculate_effective_tax_rate: (income, filingStatus = 'single') => {
            const brackets = {
                single: [
                    [0, 11000, 10],
                    [11000, 44725, 12],
                    [44725, 95375, 22],
                    [95375, 182050, 24],
                    [182050, 231250, 32],
                    [231250, 578125, 35],
                    [578125, Infinity, 37]
                ],
                married: [
                    [0, 22000, 10],
                    [22000, 89450, 12],
                    [89450, 190750, 22],
                    [190750, 364200, 24],
                    [364200, 462500, 32],
                    [462500, 693750, 35],
                    [693750, Infinity, 37]
                ]
            };
            
            const statusBrackets = brackets[filingStatus] || brackets.single;
            let totalTax = 0;
            
            for (const [min, max, rate] of statusBrackets) {
                if (income > min) {
                    const taxableInThisBracket = Math.min(income, max) - min;
                    totalTax += taxableInThisBracket * (rate / 100);
                }
            }
            
            return Math.round((totalTax / income) * 100 * 100) / 100;
        },

        investment_return: (initialAmount, finalAmount, years) => {
            if (years <= 0 || initialAmount <= 0) {
                throw new Error('Years and initial amount must be positive');
            }
            return Math.round((Math.pow(finalAmount / initialAmount, 1 / years) - 1) * 100 * 100) / 100;
        }
    },

    info: {
        name: 'Financial Analysis Functions',
        category: 'Financial',
        version: '1.0.0',
        description: 'Advanced financial calculations for loans, investments, and tax planning',
        functions: {
            'loan_eligibility_score': {
                description: 'Calculate loan eligibility score based on income, debt, and credit (0-100)',
                parameters: ['income', 'debt', 'creditScore'],
                returnType: 'number',
                examples: [
                    { code: "loan_eligibility_score(75000, 15000, 720)", description: 'Good candidate', result: 80 },
                    { code: "loan_eligibility_score(30000, 20000, 600)", description: 'Poor candidate', result: 40 }
                ]
            },
            'debt_to_income_ratio': {
                description: 'Calculate debt-to-income ratio as percentage',
                parameters: ['totalDebt', 'grossIncome'],
                returnType: 'number',
                examples: [
                    { code: "debt_to_income_ratio(20000, 80000)", description: '25% DTI ratio', result: 25.00 }
                ]
            },
            'future_value': {
                description: 'Calculate future value of investment with compound interest',
                parameters: ['presentValue', 'rate', 'periods'],
                returnType: 'number',
                examples: [
                    { code: "future_value(1000, 0.05, 10)", description: '$1000 at 5% for 10 years', result: 1628.89 }
                ]
            },
            'present_value': {
                description: 'Calculate present value of future amount',
                parameters: ['futureValue', 'rate', 'periods'],
                returnType: 'number',
                examples: [
                    { code: "present_value(1000, 0.05, 10)", description: 'PV of $1000 in 10 years at 5%', result: 613.91 }
                ]
            },
            'mortgage_interest_total': {
                description: 'Calculate total interest paid over life of mortgage',
                parameters: ['principal', 'rate', 'years'],
                returnType: 'number',
                examples: [
                    { code: "mortgage_interest_total(300000, 0.04, 30)", description: '$300k at 4% for 30 years', result: 215608.88 }
                ]
            },
            'tax_bracket': {
                description: 'Determine marginal tax bracket based on income',
                parameters: ['income', 'filingStatus?'],
                returnType: 'number',
                examples: [
                    { code: "tax_bracket(75000, 'single')", description: 'Single filer, $75k income', result: 22 },
                    { code: "tax_bracket(150000, 'married')", description: 'Married filer, $150k income', result: 22 }
                ]
            },
            'calculate_effective_tax_rate': {
                description: 'Calculate effective tax rate (total tax / income)',
                parameters: ['income', 'filingStatus?'],
                returnType: 'number',
                examples: [
                    { code: "calculate_effective_tax_rate(75000, 'single')", description: 'Effective rate on $75k', result: 15.73 }
                ]
            },
            'investment_return': {
                description: 'Calculate annualized investment return rate',
                parameters: ['initialAmount', 'finalAmount', 'years'],
                returnType: 'number',
                examples: [
                    { code: "investment_return(1000, 2000, 10)", description: 'Doubled in 10 years', result: 7.18 }
                ]
            }
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FINANCIAL_TEMPLATE };
} else {
    window.FINANCIAL_TEMPLATE = FINANCIAL_TEMPLATE;
}