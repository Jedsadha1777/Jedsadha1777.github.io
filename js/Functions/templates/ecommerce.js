/**
 * RuleFlow E-commerce Functions Template  
 * Ported directly from TypeScript version - exact 1:1 match
 */

const ECOMMERCE_TEMPLATE = {
    functions: {
        shipping_cost: (weight, distance, shippingMethod = 'standard') => {
            const baseCost = weight * 2.5;
            const distanceCost = distance * 0.1;
            
            const methodMultiplier = {
                'standard': 1.0,
                'express': 1.8,
                'overnight': 2.5,
                'international': 3.0
            };
            
            const multiplier = methodMultiplier[shippingMethod] || 1.0;
            return Math.round((baseCost + distanceCost) * multiplier * 100) / 100;
        },

        loyalty_points: (purchaseAmount, memberLevel = 'basic', isPromotion = false) => {
            const levelMultipliers = {
                'basic': 1,
                'silver': 1.5,
                'gold': 2,
                'platinum': 3
            };
            
            const basePoints = purchaseAmount * 0.01; // 1 point per dollar
            const multiplier = levelMultipliers[memberLevel] || 1;
            const promotionMultiplier = isPromotion ? 2 : 1;
            
            return Math.floor(basePoints * multiplier * promotionMultiplier);
        },

        dynamic_pricing: (basePrice, demand, supply, competitorPrice = null) => {
            let adjustedPrice = basePrice;
            
            // Demand-supply ratio
            const ratio = supply > 0 ? demand / supply : demand;
            
            if (ratio > 2) {
                adjustedPrice *= 1.2; // High demand, low supply
            } else if (ratio > 1) {
                adjustedPrice *= 1.1; // Moderate demand
            } else if (ratio < 0.5) {
                adjustedPrice *= 0.9; // Low demand, high supply
            }
            
            // Competitive pricing adjustment
            if (competitorPrice !== null && competitorPrice > 0) {
                const priceDiff = (adjustedPrice - competitorPrice) / competitorPrice;
                if (priceDiff > 0.15) {
                    adjustedPrice *= 0.95; // Reduce if significantly higher
                }
            }
            
            return Math.round(adjustedPrice * 100) / 100;
        },

        customer_lifetime_value: (avgOrderValue, purchaseFrequency, retentionYears, discountRate = 0.1) => {
            const annualValue = avgOrderValue * purchaseFrequency;
            let clv = 0;
            
            for (let year = 1; year <= retentionYears; year++) {
                const yearValue = annualValue / Math.pow(1 + discountRate, year - 1);
                clv += yearValue;
            }
            
            return Math.round(clv * 100) / 100;
        },

        cart_abandonment_score: (timeOnSite, cartValue, pageViews, isReturningCustomer = false) => {
            let score = 0;
            
            // Time on site factor (minutes)
            if (timeOnSite > 10) score += 0.3;
            else if (timeOnSite > 5) score += 0.2;
            else score += 0.1;
            
            // Cart value factor
            if (cartValue > 200) score += 0.3;
            else if (cartValue > 100) score += 0.2;
            else if (cartValue > 50) score += 0.1;
            
            // Engagement factor
            if (pageViews > 10) score += 0.2;
            else if (pageViews > 5) score += 0.1;
            
            // Customer type factor
            if (isReturningCustomer) score += 0.2;
            
            return Math.min(Math.round(score * 100), 100);
        },

        inventory_reorder_point: (avgDailyDemand, leadTimeDays, safetyStockDays = 5) => {
            const leadTimeDemand = avgDailyDemand * leadTimeDays;
            const safetyStock = avgDailyDemand * safetyStockDays;
            const reorderPoint = leadTimeDemand + safetyStock;
            
            return Math.ceil(reorderPoint);
        },

        price_elasticity_impact: (currentPrice, newPrice, currentDemand) => {
            const priceChange = (newPrice - currentPrice) / currentPrice;
            const elasticity = -1.5; // Assume price elasticity of -1.5
            const demandChange = elasticity * priceChange;
            const newDemand = currentDemand * (1 + demandChange);
            
            return {
                price_change_percent: Math.round(priceChange * 100 * 100) / 100,
                demand_change_percent: Math.round(demandChange * 100 * 100) / 100,
                new_demand: Math.round(newDemand),
                revenue_current: Math.round(currentPrice * currentDemand * 100) / 100,
                revenue_new: Math.round(newPrice * newDemand * 100) / 100
            };
        }
    },

    info: {
        name: 'E-commerce Functions',
        category: 'E-commerce', 
        version: '1.0.0',
        description: 'E-commerce calculations for pricing, shipping, loyalty, and customer analytics',
        functions: {
            'shipping_cost': {
                description: 'Calculate shipping cost based on weight, distance, and method',
                parameters: ['weight', 'distance', 'shippingMethod?'],
                returnType: 'number',
                examples: [
                    { code: "shipping_cost(2.5, 100, 'express')", description: 'Express shipping cost', result: 31.95 }
                ]
            },
            'loyalty_points': {
                description: 'Calculate loyalty points based on purchase amount and member level',
                parameters: ['purchaseAmount', 'memberLevel?', 'isPromotion?'],
                returnType: 'number',
                examples: [
                    { code: "loyalty_points(150, 'gold', true)", description: 'Gold member promo purchase', result: 6 }
                ]
            },
            'dynamic_pricing': {
                description: 'Calculate dynamic price based on demand, supply, and competition',
                parameters: ['basePrice', 'demand', 'supply', 'competitorPrice?'],
                returnType: 'number',
                examples: [
                    { code: "dynamic_pricing(100, 80, 50, 110)", description: 'High demand pricing', result: 114.0 }
                ]
            },
            'customer_lifetime_value': {
                description: 'Calculate customer lifetime value with discount rate',
                parameters: ['avgOrderValue', 'purchaseFrequency', 'retentionYears', 'discountRate?'],
                returnType: 'number',
                examples: [
                    { code: "customer_lifetime_value(75, 4, 3, 0.1)", description: '3-year CLV calculation', result: 746.89 }
                ]
            },
            'cart_abandonment_score': {
                description: 'Score likelihood of cart abandonment (0-100)',
                parameters: ['timeOnSite', 'cartValue', 'pageViews', 'isReturningCustomer?'],
                returnType: 'number',
                examples: [
                    { code: "cart_abandonment_score(8, 150, 12, true)", description: 'Returning customer analysis', result: 80 }
                ]
            },
            'inventory_reorder_point': {
                description: 'Calculate inventory reorder point with safety stock',
                parameters: ['avgDailyDemand', 'leadTimeDays', 'safetyStockDays?'],
                returnType: 'number',
                examples: [
                    { code: "inventory_reorder_point(25, 7, 3)", description: 'Weekly lead time reorder', result: 250 }
                ]
            },
            'price_elasticity_impact': {
                description: 'Calculate demand and revenue impact of price changes',
                parameters: ['currentPrice', 'newPrice', 'currentDemand'],
                returnType: 'object',
                examples: [
                    { code: "price_elasticity_impact(50, 55, 1000)", description: '10% price increase impact', result: { price_change_percent: 10, demand_change_percent: -15, new_demand: 850, revenue_current: 50000, revenue_new: 46750 } }
                ]
            }
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ECOMMERCE_TEMPLATE };
} else {
    window.ECOMMERCE_TEMPLATE = ECOMMERCE_TEMPLATE;
}