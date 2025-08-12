/**
 * RuleFlow Business Functions Template
 * Advanced business logic functions for e-commerce, logistics, and financial calculations
 */

const BUSINESS_TEMPLATE = {
    functions: {
        // ================================
        // SHIPPING & LOGISTICS
        // ================================
        
        shipping_cost: (weight, distance, serviceType = 'standard') => {
            if (weight <= 0 || distance <= 0) {
                throw new Error('Weight and distance must be positive');
            }
            
            const baseCost = weight * 2.5;
            const distanceCost = distance * 0.1;
            
            const multipliers = {
                'express': 2.0,
                'overnight': 3.0,
                'same_day': 4.0,
                'standard': 1.0
            };
            
            const multiplier = multipliers[serviceType] || 1.0;
            return Math.round((baseCost + distanceCost) * multiplier * 100) / 100;
        },

        tax_amount: (amount, rate, taxType = 'vat') => {
            if (amount < 0 || rate < 0) {
                throw new Error('Amount and rate must be non-negative');
            }
            
            const baseAmount = amount * (rate / 100);
            
            switch (taxType.toLowerCase()) {
                case 'vat':
                    return Math.round(baseAmount * 100) / 100;
                case 'sales':
                    return Math.round(baseAmount * 100) / 100;
                case 'luxury':
                    const luxuryMultiplier = amount > 100000 ? 1.5 : 1.0;
                    return Math.round(baseAmount * luxuryMultiplier * 100) / 100;
                case 'withholding':
                    return Math.round(baseAmount * 0.75 * 100) / 100; // Reduced rate
                default:
                    return Math.round(baseAmount * 100) / 100;
            }
        },

        loyalty_points: (amount, tierLevel = 'bronze', bonusMultiplier = 1) => {
            if (amount < 0) {
                throw new Error('Amount must be non-negative');
            }
            
            const tierMultipliers = {
                'bronze': 1.0,
                'silver': 1.5,
                'gold': 2.0,
                'platinum': 2.5,
                'diamond': 3.0
            };
            
            const basePoints = Math.floor(amount / 10); // 1 point per 10 units
            const tierMultiplier = tierMultipliers[tierLevel.toLowerCase()] || 1.0;
            
            return Math.floor(basePoints * tierMultiplier * bonusMultiplier);
        },

        // ================================
        // PRICING & DISCOUNTS
        // ================================
        
        seasonal_multiplier: (date, basePrice) => {
            const dt = new Date(date);
            if (isNaN(dt.getTime())) {
                throw new Error(`Invalid date: ${date}`);
            }
            
            const month = dt.getMonth(); // 0-based
            
            // Seasonal pricing multipliers
            let multiplier;
            if (month === 11 || month === 0 || month === 1) { // Dec, Jan, Feb
                multiplier = 1.5; // High season
            } else if (month >= 5 && month <= 8) { // Jun-Sep
                multiplier = 1.2; // Peak season  
            } else if (month === 2 || month === 3) { // Mar, Apr
                multiplier = 0.8; // Low season
            } else {
                multiplier = 1.0; // Regular season
            }
            
            return Math.round(basePrice * multiplier * 100) / 100;
        },

        tier_discount: (tier, amount) => {
            if (amount < 0) {
                throw new Error('Amount must be non-negative');
            }
            
            const discountRates = {
                'bronze': 0.05,   // 5%
                'silver': 0.10,   // 10%
                'gold': 0.15,     // 15%
                'platinum': 0.20, // 20%
                'diamond': 0.25   // 25%
            };
            
            const rate = discountRates[tier.toLowerCase()] || 0;
            const discount = amount * rate;
            
            return {
                discount_amount: Math.round(discount * 100) / 100,
                final_amount: Math.round((amount - discount) * 100) / 100,
                discount_rate: rate
            };
        },

        bulk_discount: (quantity, unitPrice) => {
            if (quantity <= 0 || unitPrice <= 0) {
                throw new Error('Quantity and unit price must be positive');
            }
            
            let discountRate = 0;
            if (quantity >= 100) {
                discountRate = 0.15; // 15% for 100+
            } else if (quantity >= 50) {
                discountRate = 0.10; // 10% for 50-99
            } else if (quantity >= 20) {
                discountRate = 0.05; // 5% for 20-49
            }
            
            const subtotal = quantity * unitPrice;
            const discount = subtotal * discountRate;
            const total = subtotal - discount;
            
            return {
                subtotal: Math.round(subtotal * 100) / 100,
                discount_amount: Math.round(discount * 100) / 100,
                total: Math.round(total * 100) / 100,
                discount_rate: discountRate,
                savings_per_unit: Math.round((unitPrice * discountRate) * 100) / 100
            };
        },

        // ================================
        // BUSINESS METRICS
        // ================================
        
        customer_lifetime_value: (avgOrderValue, purchaseFrequency, customerLifespan, retentionRate = 0.8) => {
            if (avgOrderValue <= 0 || purchaseFrequency <= 0 || customerLifespan <= 0) {
                throw new Error('All values must be positive');
            }
            
            if (retentionRate <= 0 || retentionRate > 1) {
                throw new Error('Retention rate must be between 0 and 1');
            }
            
            // CLV = (Average Order Value × Purchase Frequency × Customer Lifespan) × Retention Rate
            const clv = avgOrderValue * purchaseFrequency * customerLifespan * retentionRate;
            return Math.round(clv * 100) / 100;
        },

        profit_margin: (revenue, costs) => {
            if (revenue < 0 || costs < 0) {
                throw new Error('Revenue and costs must be non-negative');
            }
            
            if (revenue === 0) {
                return { 
                    profit: Math.round(-costs * 100) / 100, 
                    marginPercent: -100, 
                    markup: 0 
                };
            }
            
            const profit = revenue - costs;
            const marginPercent = (profit / revenue) * 100;
            const markup = costs > 0 ? (profit / costs) * 100 : 0;
            
            return {
                profit: Math.round(profit * 100) / 100,
                marginPercent: Math.round(marginPercent * 100) / 100,
                markup: Math.round(markup * 100) / 100
            };
        },

        working_hours_multiplier: (datetime) => {
            const dt = new Date(datetime);
            if (isNaN(dt.getTime())) {
                throw new Error(`Invalid datetime: ${datetime}`);
            }
            
            const hour = dt.getHours();
            const day = dt.getDay(); // 0 = Sunday, 6 = Saturday
            
            // Weekend
            if (day === 0 || day === 6) {
                return 1.5; // Weekend premium
            }
            
            // Working hours (9 AM - 5 PM)
            if (hour >= 9 && hour < 17) {
                return 1.0; // Regular rate
            }
            
            // After hours (5 PM - 9 PM) or early morning (6 AM - 9 AM)
            if ((hour >= 17 && hour < 21) || (hour >= 6 && hour < 9)) {
                return 1.25; // After hours premium
            }
            
            // Night hours (9 PM - 6 AM)
            return 1.75; // Night premium
        },

        // ================================
        // FINANCIAL CALCULATIONS
        // ================================
        
        payment_schedule: (principal, annualRate, years, paymentType = 'monthly') => {
            if (principal <= 0 || annualRate < 0 || years <= 0) {
                throw new Error('Invalid input values');
            }
            
            const periodsPerYear = paymentType === 'monthly' ? 12 : 
                                  paymentType === 'quarterly' ? 4 : 
                                  paymentType === 'annually' ? 1 : 12;
            
            const periodicRate = annualRate / periodsPerYear;
            const totalPeriods = years * periodsPerYear;
            
            if (periodicRate === 0) {
                // No interest case
                const payment = principal / totalPeriods;
                return {
                    payment_amount: Math.round(payment * 100) / 100,
                    total_payments: Math.round(principal * 100) / 100,
                    total_interest: 0,
                    payment_type: paymentType,
                    periods: totalPeriods
                };
            }
            
            // Standard loan payment formula
            const payment = principal * (periodicRate * Math.pow(1 + periodicRate, totalPeriods)) / 
                           (Math.pow(1 + periodicRate, totalPeriods) - 1);
            
            const totalPayments = payment * totalPeriods;
            const totalInterest = totalPayments - principal;
            
            return {
                payment_amount: Math.round(payment * 100) / 100,
                total_payments: Math.round(totalPayments * 100) / 100,
                total_interest: Math.round(totalInterest * 100) / 100,
                payment_type: paymentType,
                periods: totalPeriods
            };
        }
    },

    info: {
        name: 'Advanced Business Functions',
        category: 'Business',
        version: '1.0.0',
        description: 'Comprehensive business logic functions for e-commerce, logistics, and financial calculations',
        functions: {
            // ... (ใช้ info ที่มีอยู่แล้วใน artifact เดิม)
        }
    }
};