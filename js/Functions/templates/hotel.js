/**
 * RuleFlow Hotel Functions Template
 * Ported directly from TypeScript version - exact 1:1 match
 */

const HOTEL_TEMPLATE = {
    functions: {
        is_weekend: (date) => {
            const d = new Date(date);
            if (isNaN(d.getTime())) throw new Error('Invalid date format');
            const dayOfWeek = d.getDay();
            return dayOfWeek === 0 || dayOfWeek === 6;
        },

        is_holiday: (date, country = 'US') => {
            const d = new Date(date);
            if (isNaN(d.getTime())) throw new Error('Invalid date format');
            
            const month = d.getMonth() + 1;
            const day = d.getDate();
            
            // Common holidays (simplified)
            const holidays = {
                US: [[1, 1], [7, 4], [12, 25]], // New Year, July 4th, Christmas
                TH: [[1, 1], [12, 5], [12, 10], [12, 31]] // Thailand holidays
            };
            
            const countryHolidays = holidays[country] || holidays.US;
            return countryHolidays.some(([m, d]) => month === m && day === d);
        },

        get_season: (date) => {
            const d = new Date(date);
            if (isNaN(d.getTime())) throw new Error('Invalid date format');
            
            const month = d.getMonth() + 1;
            if (month >= 12 || month <= 2) return 'winter';
            if (month >= 3 && month <= 5) return 'spring';
            if (month >= 6 && month <= 8) return 'summer';
            return 'fall';
        },

        days_until_checkin: (checkinDate) => {
            const checkin = new Date(checkinDate);
            const today = new Date();
            if (isNaN(checkin.getTime())) throw new Error('Invalid checkin date');
            
            const diffTime = checkin.getTime() - today.getTime();
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        },

        room_occupancy_rate: (occupiedRooms, totalRooms) => {
            if (totalRooms <= 0) throw new Error('Total rooms must be positive');
            return Math.round((occupiedRooms / totalRooms) * 100 * 100) / 100; // 2 decimal places
        },

        calculate_room_tax: (basePrice, taxRate, location = 'city') => {
            const locationMultiplier = location === 'resort' ? 1.2 : 1.0;
            const taxAmount = basePrice * (taxRate / 100) * locationMultiplier;
            return Math.round(taxAmount * 100) / 100;
        },

        seasonal_rate_adjustment: (baseRate, season, demandLevel = 'normal') => {
            const seasonMultipliers = {
                'winter': 0.8,
                'spring': 1.0,
                'summer': 1.3,
                'fall': 0.9
            };
            
            const demandMultipliers = {
                'low': 0.7,
                'normal': 1.0,
                'high': 1.4,
                'peak': 1.8
            };
            
            const seasonRate = baseRate * (seasonMultipliers[season] || 1.0);
            const finalRate = seasonRate * (demandMultipliers[demandLevel] || 1.0);
            
            return Math.round(finalRate * 100) / 100;
        },

        loyalty_discount: (membershipLevel, stayNights) => {
            const levelDiscounts = {
                'basic': 0.05,
                'silver': 0.10,
                'gold': 0.15,
                'platinum': 0.20
            };
            
            let discount = levelDiscounts[membershipLevel] || 0;
            
            // Additional discount for extended stays
            if (stayNights >= 7) discount += 0.05;
            else if (stayNights >= 3) discount += 0.02;
            
            return Math.min(discount, 0.30); // Cap at 30%
        }
    },

    info: {
        name: 'Hotel Management Functions',
        category: 'Hotel',
        version: '1.0.0',
        description: 'Hotel industry functions for pricing, occupancy, and booking management',
        functions: {
            'is_weekend': {
                description: 'Check if date falls on weekend',
                parameters: ['date'],
                returnType: 'boolean',
                examples: [
                    { code: "is_weekend('2025-07-19')", description: 'Saturday check', result: true }
                ]
            },
            'is_holiday': {
                description: 'Check if date is a holiday in specified country',
                parameters: ['date', 'country?'],
                returnType: 'boolean',
                examples: [
                    { code: "is_holiday('2025-01-01', 'US')", description: 'New Year check', result: true }
                ]
            },
            'get_season': {
                description: 'Determine season from date',
                parameters: ['date'],
                returnType: 'string',
                examples: [
                    { code: "get_season('2025-07-15')", description: 'Summer season', result: 'summer' }
                ]
            },
            'days_until_checkin': {
                description: 'Calculate days until checkin date',
                parameters: ['checkinDate'],
                returnType: 'number',
                examples: [
                    { code: "days_until_checkin('2025-08-15')", description: 'Days to checkin', result: 40 }
                ]
            },
            'room_occupancy_rate': {
                description: 'Calculate hotel occupancy percentage',
                parameters: ['occupiedRooms', 'totalRooms'],
                returnType: 'number',
                examples: [
                    { code: "room_occupancy_rate(85, 100)", description: '85% occupancy', result: 85.0 }
                ]
            },
            'calculate_room_tax': {
                description: 'Calculate room tax with location adjustment',
                parameters: ['basePrice', 'taxRate', 'location?'],
                returnType: 'number',
                examples: [
                    { code: "calculate_room_tax(200, 10, 'resort')", description: 'Resort tax', result: 24.0 }
                ]
            },
            'seasonal_rate_adjustment': {
                description: 'Adjust rates based on season and demand',
                parameters: ['baseRate', 'season', 'demandLevel?'],
                returnType: 'number',
                examples: [
                    { code: "seasonal_rate_adjustment(100, 'summer', 'high')", description: 'Summer high demand', result: 182.0 }
                ]
            },
            'loyalty_discount': {
                description: 'Calculate loyalty member discount',
                parameters: ['membershipLevel', 'stayNights'],
                returnType: 'number',
                examples: [
                    { code: "loyalty_discount('gold', 5)", description: 'Gold member discount', result: 0.17 }
                ]
            }
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HOTEL_TEMPLATE };
} else {
    window.HOTEL_TEMPLATE = HOTEL_TEMPLATE;
}