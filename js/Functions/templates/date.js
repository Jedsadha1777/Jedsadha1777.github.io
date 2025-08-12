/**
 * RuleFlow Date Functions Template
 * Ported directly from TypeScript version - exact 1:1 match
 */

const DATE_TEMPLATE = {
    functions: {
        is_business_day: (date) => {
            const dt = new Date(date);
            if (isNaN(dt.getTime())) {
                throw new Error(`Invalid date: ${date}`);
            }
            
            const dayOfWeek = dt.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
            const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
            
            // Check if it's not a Thai holiday
            return isWeekday && !DATE_TEMPLATE.functions.is_holiday(date);
        },

        days_until: (targetDate) => {
            const now = new Date();
            const target = new Date(targetDate);
            
            if (isNaN(target.getTime())) {
                throw new Error(`Invalid target date: ${targetDate}`);
            }
            
            const diffTime = target.getTime() - now.getTime();
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        },

        is_holiday: (date) => {
            const dt = new Date(date);
            const dateStr = dt.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            // Thai holidays 2025 (simplified list)
            const thaiHolidays2025 = [
                '2025-01-01', // New Year's Day
                '2025-02-12', // Makha Bucha Day (estimated)
                '2025-04-06', // Chakri Day
                '2025-04-13', // Songkran Festival
                '2025-04-14', // Songkran Festival
                '2025-04-15', // Songkran Festival
                '2025-05-01', // Labour Day
                '2025-05-04', // Coronation Day
                '2025-05-11', // Visakha Bucha Day (estimated)
                '2025-06-03', // Queen Suthida's Birthday
                '2025-07-28', // King Vajiralongkorn's Birthday
                '2025-07-29', // Asalha Bucha Day (estimated)
                '2025-07-30', // Buddhist Lent Day (estimated)
                '2025-08-12', // Mother's Day
                '2025-10-13', // King Bhumibol Memorial Day
                '2025-10-23', // Chulalongkorn Day
                '2025-12-05', // Father's Day
                '2025-12-10', // Constitution Day
                '2025-12-31'  // New Year's Eve
            ];
            
            return thaiHolidays2025.includes(dateStr);
        },

        format_thai_date: (date) => {
            const dt = new Date(date);
            if (isNaN(dt.getTime())) {
                throw new Error(`Invalid date: ${date}`);
            }
            
            const thaiMonths = [
                'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
            ];
            
            const day = dt.getDate();
            const month = thaiMonths[dt.getMonth()];
            const year = dt.getFullYear() + 543; // Buddhist year
            
            return `${day} ${month} ${year}`;
        },

        business_days_between: (startDate, endDate) => {
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new Error('Invalid date format');
            }
            
            let businessDays = 0;
            const current = new Date(start);
            
            while (current <= end) {
                if (DATE_TEMPLATE.functions.is_business_day(current)) {
                    businessDays++;
                }
                current.setDate(current.getDate() + 1);
            }
            
            return businessDays;
        },

        thai_fiscal_year: (date) => {
            const dt = new Date(date);
            if (isNaN(dt.getTime())) {
                throw new Error(`Invalid date: ${date}`);
            }
            
            // Thai fiscal year starts October 1st
            const year = dt.getFullYear();
            const month = dt.getMonth(); // 0-based
            
            return month >= 9 ? year + 1 : year; // October = month 9
        },

        is_weekend_thai: (date) => {
            const dt = new Date(date);
            if (isNaN(dt.getTime())) {
                throw new Error(`Invalid date: ${date}`);
            }
            
            const dayOfWeek = dt.getDay(); // 0=Sunday, 6=Saturday
            return dayOfWeek === 0 || dayOfWeek === 6;
        },

        thai_quarter: (date) => {
            const dt = new Date(date);
            if (isNaN(dt.getTime())) {
                throw new Error(`Invalid date: ${date}`);
            }
            
            const month = dt.getMonth(); // 0-based
            
            // Thai fiscal quarters (Oct-Dec=Q1, Jan-Mar=Q2, Apr-Jun=Q3, Jul-Sep=Q4)
            if (month >= 9) return 1; // Oct, Nov, Dec
            if (month <= 2) return 2; // Jan, Feb, Mar
            if (month <= 5) return 3; // Apr, May, Jun
            return 4; // Jul, Aug, Sep
        }
    },

    info: {
        name: 'Thai Date Functions',
        category: 'Date',
        version: '1.0.0',
        description: 'Thai business date, holiday, and fiscal calendar functions',
        functions: {
            'is_business_day': {
                description: 'Check if date is a Thai business day (excludes weekends and holidays)',
                parameters: ['date'],
                returnType: 'boolean',
                examples: [
                    { code: "is_business_day('2025-07-21')", description: 'Check Monday', result: true }
                ]
            },
            'days_until': {
                description: 'Calculate days until target date',
                parameters: ['targetDate'],
                returnType: 'number',
                examples: [
                    { code: "days_until('2025-12-31')", description: 'Days until New Year', result: 148 }
                ]
            },
            'is_holiday': {
                description: 'Check if date is a Thai public holiday',
                parameters: ['date'],
                returnType: 'boolean',
                examples: [
                    { code: "is_holiday('2025-01-01')", description: 'New Year Day', result: true }
                ]
            },
            'format_thai_date': {
                description: 'Format date in Thai Buddhist calendar',
                parameters: ['date'],
                returnType: 'string',
                examples: [
                    { code: "format_thai_date('2025-07-20')", description: 'Thai format', result: '20 กรกฎาคม 2568' }
                ]
            },
            'business_days_between': {
                description: 'Count business days between two dates',
                parameters: ['startDate', 'endDate'],
                returnType: 'number',
                examples: [
                    { code: "business_days_between('2025-07-01', '2025-07-31')", description: 'July business days', result: 23 }
                ]
            },
            'thai_fiscal_year': {
                description: 'Get Thai fiscal year (starts October 1st)',
                parameters: ['date'],
                returnType: 'number',
                examples: [
                    { code: "thai_fiscal_year('2025-10-01')", description: 'Fiscal year start', result: 2026 }
                ]
            },
            'is_weekend_thai': {
                description: 'Check if date is weekend in Thailand',
                parameters: ['date'],
                returnType: 'boolean',
                examples: [
                    { code: "is_weekend_thai('2025-07-19')", description: 'Saturday check', result: true }
                ]
            },
            'thai_quarter': {
                description: 'Get Thai fiscal quarter (1-4)',
                parameters: ['date'],
                returnType: 'number',
                examples: [
                    { code: "thai_quarter('2025-07-15')", description: 'Q4 of fiscal year', result: 4 }
                ]
            }
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DATE_TEMPLATE };
} else {
    window.DATE_TEMPLATE = DATE_TEMPLATE;
}