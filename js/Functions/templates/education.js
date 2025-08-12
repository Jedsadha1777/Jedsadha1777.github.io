/**
 * RuleFlow Education Functions Template
 * Education system functions for grading, GPA calculation, and academic assessments
 */

const EDUCATION_TEMPLATE = {
    functions: {
        calculate_gpa: (grades) => {
            if (!Array.isArray(grades) || grades.length === 0) {
                throw new Error('Grades array must be non-empty');
            }
            
            // Grade point mapping (4.0 scale)
            const gradePoints = {
                'A': 4.0, 'A-': 3.7,
                'B+': 3.3, 'B': 3.0, 'B-': 2.7,
                'C+': 2.3, 'C': 2.0, 'C-': 1.7,
                'D+': 1.3, 'D': 1.0, 'D-': 0.7,
                'F': 0.0
            };
            
            let totalQualityPoints = 0;
            let totalCredits = 0;
            
            for (const grade of grades) {
                const { grade: letterGrade, credits } = grade;
                
                if (credits <= 0) {
                    throw new Error('Credits must be positive');
                }
                
                const points = gradePoints[letterGrade.toUpperCase()];
                if (points === undefined) {
                    throw new Error(`Invalid grade: ${letterGrade}`);
                }
                
                totalQualityPoints += points * credits;
                totalCredits += credits;
            }
            
            const gpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;
            
            return {
                gpa: Math.round(gpa * 100) / 100,
                totalCredits,
                qualityPoints: Math.round(totalQualityPoints * 100) / 100
            };
        },

        grade_to_point: (grade, scale = '4.0') => {
            const grade4Scale = {
                'A': 4.0, 'A-': 3.7,
                'B+': 3.3, 'B': 3.0, 'B-': 2.7,
                'C+': 2.3, 'C': 2.0, 'C-': 1.7,
                'D+': 1.3, 'D': 1.0, 'D-': 0.7,
                'F': 0.0
            };

            const gradeThaiScale = {
                'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5,
                'C': 2.0, 'D+': 1.5, 'D': 1.0, 'F': 0.0
            };
        
        const gradeMapping = scale === 'thai' ? gradeThaiScale : grade4Scale;
        const points = gradeMapping[grade.toUpperCase()];
        
        if (points === undefined) {
            throw new Error(`Invalid grade: ${grade} for scale: ${scale}`);
        }
        
        return points;
    },

    percentage_to_grade: (percentage, scale = 'standard') => {
        if (percentage < 0 || percentage > 100) {
            throw new Error('Percentage must be between 0 and 100');
        }
        
        const standardScale = {
            97: 'A+', 93: 'A', 90: 'A-',
            87: 'B+', 83: 'B', 80: 'B-',
            77: 'C+', 73: 'C', 70: 'C-',
            67: 'D+', 63: 'D', 60: 'D-',
            0: 'F'
        };
        
        const thaiScale = {
            80: 'A', 75: 'B+', 70: 'B', 65: 'C+',
            60: 'C', 55: 'D+', 50: 'D', 0: 'F'
        };
        
        const gradeScale = scale === 'thai' ? thaiScale : standardScale;
        const thresholds = Object.keys(gradeScale).map(Number).sort((a, b) => b - a);
        
        for (const threshold of thresholds) {
            if (percentage >= threshold) {
                return gradeScale[threshold];
            }
        }
        
        return 'F';
    },

    attendance_grade: (attendedClasses, totalClasses, attendanceWeight = 0.1) => {
        if (totalClasses <= 0) {
            throw new Error('Total classes must be positive');
        }
        
        if (attendedClasses < 0 || attendedClasses > totalClasses) {
            throw new Error('Attended classes must be between 0 and total classes');
        }
        
        const attendanceRate = attendedClasses / totalClasses;
        let attendancePoints = 0;
        
        if (attendanceRate >= 0.95) attendancePoints = 100;
        else if (attendanceRate >= 0.90) attendancePoints = 95;
        else if (attendanceRate >= 0.85) attendancePoints = 90;
        else if (attendanceRate >= 0.80) attendancePoints = 85;
        else if (attendanceRate >= 0.75) attendancePoints = 80;
        else if (attendanceRate >= 0.70) attendancePoints = 75;
        else attendancePoints = Math.max(0, attendanceRate * 100);
        
        return {
            attendance_rate: Math.round(attendanceRate * 100 * 100) / 100,
            attendance_points: Math.round(attendancePoints * 100) / 100,
            weighted_contribution: Math.round(attendancePoints * attendanceWeight * 100) / 100
        };
    },

    final_course_grade: (assignments, exams, participation, attendance, weights = null) => {
        const defaultWeights = {
            assignments: 0.3,
            exams: 0.5,
            participation: 0.1,
            attendance: 0.1
        };
        
        const gradeWeights = weights || defaultWeights;
        
        // Validate weights sum to 1.0
        const weightSum = Object.values(gradeWeights).reduce((sum, weight) => sum + weight, 0);
        if (Math.abs(weightSum - 1.0) > 0.01) {
            throw new Error('Grade weights must sum to 1.0');
        }
        
        // Calculate weighted average
        const weightedGrade = 
            (assignments * gradeWeights.assignments) +
            (exams * gradeWeights.exams) +
            (participation * gradeWeights.participation) +
            (attendance * gradeWeights.attendance);
        
        const finalPercentage = Math.round(weightedGrade * 100) / 100;
        const letterGrade = EDUCATION_TEMPLATE.functions.percentage_to_grade(finalPercentage);
        const gradePoints = EDUCATION_TEMPLATE.functions.grade_to_point(letterGrade);
        
        return {
            final_percentage: finalPercentage,
            letter_grade: letterGrade,
            grade_points: gradePoints,
            breakdown: {
                assignments: Math.round(assignments * gradeWeights.assignments * 100) / 100,
                exams: Math.round(exams * gradeWeights.exams * 100) / 100,
                participation: Math.round(participation * gradeWeights.participation * 100) / 100,
                attendance: Math.round(attendance * gradeWeights.attendance * 100) / 100
            }
        };
    },

    scholarship_eligibility: (gpa, creditHours, financialNeed = false, extracurricular = 0) => {
        let eligibilityScore = 0;
        let scholarshipType = 'none';
        
        // GPA requirements
        if (gpa >= 3.8) eligibilityScore += 40;
        else if (gpa >= 3.5) eligibilityScore += 30;
        else if (gpa >= 3.0) eligibilityScore += 20;
        else if (gpa >= 2.5) eligibilityScore += 10;
        
        // Credit hours (full-time student bonus)
        if (creditHours >= 12) eligibilityScore += 20;
        else if (creditHours >= 9) eligibilityScore += 15;
        else if (creditHours >= 6) eligibilityScore += 10;
        
        // Financial need
        if (financialNeed) eligibilityScore += 15;
        
        // Extracurricular activities
        if (extracurricular >= 3) eligibilityScore += 15;
        else if (extracurricular >= 2) eligibilityScore += 10;
        else if (extracurricular >= 1) eligibilityScore += 5;
        
        // Determine scholarship type
        if (eligibilityScore >= 80) scholarshipType = 'full';
        else if (eligibilityScore >= 60) scholarshipType = 'partial';
        else if (eligibilityScore >= 40) scholarshipType = 'merit_based';
        else if (eligibilityScore >= 20) scholarshipType = 'need_based';
        
        return {
            eligibility_score: eligibilityScore,
            scholarship_type: scholarshipType,
            eligible: eligibilityScore >= 20,
            gpa_contribution: Math.min(40, gpa >= 3.8 ? 40 : gpa >= 3.5 ? 30 : gpa >= 3.0 ? 20 : gpa >= 2.5 ? 10 : 0),
            credit_contribution: creditHours >= 12 ? 20 : creditHours >= 9 ? 15 : creditHours >= 6 ? 10 : 0
        };
    },

    academic_standing: (gpa, creditHoursAttempted, creditHoursCompleted) => {
        if (creditHoursAttempted <= 0) {
            throw new Error('Credit hours attempted must be positive');
        }
        
        const completionRate = creditHoursCompleted / creditHoursAttempted;
        let standing = 'good_standing';
        let probationType = null;
        
        // Determine academic standing
        if (gpa < 2.0) {
            if (creditHoursAttempted >= 60) {
                standing = 'academic_dismissal';
            } else {
                standing = 'academic_probation';
                probationType = 'gpa';
            }
        } else if (completionRate < 0.67) {
            standing = 'academic_probation';
            probationType = 'completion_rate';
        } else if (gpa >= 3.5) {
            standing = 'dean_list';
        } else if (gpa >= 3.2) {
            standing = 'honor_roll';
        }
        
        return {
            academic_standing: standing,
            gpa: gpa,
            completion_rate: Math.round(completionRate * 100 * 100) / 100,
            probation_type: probationType,
            credit_hours_attempted: creditHoursAttempted,
            credit_hours_completed: creditHoursCompleted,
            action_required: standing === 'academic_probation' || standing === 'academic_dismissal'
        };
    },

    course_difficulty_adjustment: (baseGrade, courseLevel, courseType = 'regular') => {
        if (baseGrade < 0 || baseGrade > 100) {
            throw new Error('Base grade must be between 0 and 100');
        }
        
        let adjustment = 0;
        
        // Course level adjustments
        if (courseLevel === 'AP' || courseLevel === 'advanced_placement') {
            adjustment += 5;
        } else if (courseLevel === 'honors') {
            adjustment += 3;
        } else if (courseLevel === 'remedial') {
            adjustment -= 2;
        }
        
        // Course type adjustments
        if (courseType === 'lab') {
            adjustment += 2;
        } else if (courseType === 'seminar') {
            adjustment += 1;
        } else if (courseType === 'online') {
            adjustment -= 1;
        }
        
        const adjustedGrade = Math.min(100, Math.max(0, baseGrade + adjustment));
        
        return {
            base_grade: baseGrade,
            adjustment: adjustment,
            adjusted_grade: Math.round(adjustedGrade * 100) / 100,
            course_level: courseLevel,
            course_type: courseType
        };
    }
},

info: {
    name: 'Education Functions',
    category: 'Education',
    version: '1.0.0',
    description: 'Academic functions for grading, GPA calculation, and educational assessments',
    functions: {
        'calculate_gpa': {
            description: 'Calculate GPA from array of grades and credits',
            parameters: ['grades'],
            returnType: 'object',
            examples: [
                { code: "calculate_gpa([{grade: 'A', credits: 3}, {grade: 'B+', credits: 4}])", description: 'Mixed grades GPA', result: { gpa: 3.6, totalCredits: 7, qualityPoints: 25.2 } }
            ]
        },
        'grade_to_point': {
            description: 'Convert letter grade to grade points',
            parameters: ['grade', 'scale?'],
            returnType: 'number',
            examples: [
                { code: "grade_to_point('A-', '4.0')", description: 'A- on 4.0 scale', result: 3.7 }
            ]
        },
        'percentage_to_grade': {
            description: 'Convert percentage to letter grade',
            parameters: ['percentage', 'scale?'],
            returnType: 'string',
            examples: [
                { code: "percentage_to_grade(87, 'standard')", description: '87% to letter grade', result: 'B+' }
            ]
        },
        'attendance_grade': {
            description: 'Calculate attendance grade and impact',
            parameters: ['attendedClasses', 'totalClasses', 'attendanceWeight?'],
            returnType: 'object',
            examples: [
                { code: "attendance_grade(28, 30, 0.1)", description: '28/30 attendance', result: { attendance_rate: 93.33, attendance_points: 95, weighted_contribution: 9.5 } }
            ]
        },
        'final_course_grade': {
            description: 'Calculate final course grade with weighted components',
            parameters: ['assignments', 'exams', 'participation', 'attendance', 'weights?'],
            returnType: 'object',
            examples: [
                { code: "final_course_grade(85, 88, 92, 95)", description: 'Final grade calculation', result: { final_percentage: 87.7, letter_grade: 'B+', grade_points: 3.3 } }
            ]
        },
        'scholarship_eligibility': {
            description: 'Determine scholarship eligibility and type',
            parameters: ['gpa', 'creditHours', 'financialNeed?', 'extracurricular?'],
            returnType: 'object',
            examples: [
                { code: "scholarship_eligibility(3.7, 15, true, 2)", description: 'High achiever with need', result: { eligibility_score: 85, scholarship_type: 'full', eligible: true } }
            ]
        },
        'academic_standing': {
            description: 'Determine academic standing based on GPA and completion rate',
            parameters: ['gpa', 'creditHoursAttempted', 'creditHoursCompleted'],
            returnType: 'object',
            examples: [
                { code: "academic_standing(3.6, 60, 58)", description: 'Good student standing', result: { academic_standing: 'dean_list', completion_rate: 96.67, action_required: false } }
            ]
        },
        'course_difficulty_adjustment': {
            description: 'Adjust grades based on course difficulty and type',
            parameters: ['baseGrade', 'courseLevel', 'courseType?'],
            returnType: 'object',
            examples: [
                { code: "course_difficulty_adjustment(85, 'honors', 'lab')", description: 'Honors lab course', result: { base_grade: 85, adjustment: 5, adjusted_grade: 90, course_level: 'honors', course_type: 'lab' } }
            ]
        }
    }
}
};
// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
module.exports = { EDUCATION_TEMPLATE };
} else {
window.EDUCATION_TEMPLATE = EDUCATION_TEMPLATE;
}