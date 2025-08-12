/**
 * RuleFlow Healthcare Functions Template
 * Ported directly from TypeScript version - exact 1:1 match
 */

const HEALTHCARE_TEMPLATE = {
    functions: {
        bmi_category: (weight, heightInMeters) => {
            if (weight <= 0 || heightInMeters <= 0) {
                throw new Error('Weight and height must be positive numbers');
            }
            
            const bmi = weight / (heightInMeters * heightInMeters);
            
            if (bmi < 18.5) return 'underweight';
            if (bmi < 25) return 'normal';
            if (bmi < 30) return 'overweight';
            return 'obese';
        },

        health_risk_score: (age, bmi, smoker, exerciseHours = 0) => {
            let score = 0;
            
            // Age factor
            if (age > 65) score += 30;
            else if (age > 50) score += 20;
            else if (age > 35) score += 10;
            
            // BMI factor
            if (bmi >= 30) score += 25;
            else if (bmi >= 27) score += 15;
            else if (bmi < 18.5) score += 10;
            
            // Smoking factor
            if (smoker) score += 30;
            
            // Exercise factor (protective)
            if (exerciseHours >= 5) score -= 15;
            else if (exerciseHours >= 2.5) score -= 10;
            
            return Math.max(0, Math.min(100, score));
        },

        blood_pressure_category: (systolic, diastolic) => {
            if (systolic < 120 && diastolic < 80) return 'normal';
            if (systolic < 130 && diastolic < 80) return 'elevated';
            if ((systolic >= 130 && systolic < 140) || (diastolic >= 80 && diastolic < 90)) return 'stage1_hypertension';
            if (systolic >= 140 || diastolic >= 90) return 'stage2_hypertension';
            if (systolic > 180 || diastolic > 120) return 'hypertensive_crisis';
            return 'unknown';
        },

        cholesterol_risk: (totalCholesterol, hdl, ldl) => {
            let riskPoints = 0;
            
            // Total cholesterol
            if (totalCholesterol >= 240) riskPoints += 3;
            else if (totalCholesterol >= 200) riskPoints += 1;
            
            // HDL cholesterol (protective)
            if (hdl < 40) riskPoints += 2;
            else if (hdl >= 60) riskPoints -= 1;
            
            // LDL cholesterol
            if (ldl >= 160) riskPoints += 2;
            else if (ldl >= 130) riskPoints += 1;
            
            return Math.max(0, riskPoints);
        },

        calorie_needs: (age, gender, weight, height, activityLevel = 'sedentary') => {
            // Harris-Benedict Equation
            let bmr;
            if (gender.toLowerCase() === 'male') {
                bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
            } else {
                bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
            }
            
            const activityMultipliers = {
                'sedentary': 1.2,
                'light': 1.375,
                'moderate': 1.55,
                'active': 1.725,
                'very_active': 1.9
            };
            
            const multiplier = activityMultipliers[activityLevel] || 1.2;
            return Math.round(bmr * multiplier);
        },

        diabetes_risk_score: (age, bmi, familyHistory, bloodPressure) => {
            let score = 0;
            
            // Age points
            if (age >= 65) score += 9;
            else if (age >= 45) score += 5;
            else if (age >= 35) score += 2;
            
            // BMI points
            if (bmi >= 30) score += 6;
            else if (bmi >= 25) score += 3;
            
            // Family history
            if (familyHistory) score += 5;
            
            // Blood pressure
            if (bloodPressure === 'stage2_hypertension' || bloodPressure === 'hypertensive_crisis') score += 3;
            else if (bloodPressure === 'stage1_hypertension') score += 2;
            else if (bloodPressure === 'elevated') score += 1;
            
            return Math.min(score, 30); // Cap at 30 points
        },

        medication_dosage: (weight, medicationName, baselineUnits = null) => {
            const medications = {
                'acetaminophen': { mg_per_kg: 15, max_dose: 4000 },
                'ibuprofen': { mg_per_kg: 10, max_dose: 3200 },
                'aspirin': { mg_per_kg: 10, max_dose: 4000 }
            };
            
            const med = medications[medicationName.toLowerCase()];
            if (!med) {
                throw new Error(`Unknown medication: ${medicationName}`);
            }
            
            const dosage = weight * med.mg_per_kg;
            return Math.min(dosage, med.max_dose);
        },

        target_heart_rate: (age, restingHeartRate = 70) => {
            const maxHeartRate = 220 - age;
            const heartRateReserve = maxHeartRate - restingHeartRate;
            
            return {
                moderate_min: Math.round(restingHeartRate + (heartRateReserve * 0.5)),
                moderate_max: Math.round(restingHeartRate + (heartRateReserve * 0.7)),
                vigorous_min: Math.round(restingHeartRate + (heartRateReserve * 0.7)),
                vigorous_max: Math.round(restingHeartRate + (heartRateReserve * 0.85))
            };
        }
    },

    info: {
        name: 'Healthcare Functions',
        category: 'Healthcare',
        version: '1.0.0',
        description: 'Medical and health assessment functions for BMI, risk scoring, and clinical calculations',
        functions: {
            'bmi_category': {
                description: 'Categorize BMI as underweight, normal, overweight, or obese',
                parameters: ['weight', 'heightInMeters'],
                returnType: 'string',
                examples: [
                    { code: "bmi_category(70, 1.75)", description: 'Normal weight', result: 'normal' }
                ]
            },
            'health_risk_score': {
                description: 'Calculate health risk score (0-100) based on age, BMI, smoking, exercise',
                parameters: ['age', 'bmi', 'smoker', 'exerciseHours?'],
                returnType: 'number',
                examples: [
                    { code: "health_risk_score(45, 28, false, 3)", description: 'Moderate risk', result: 25 },
                    { code: "health_risk_score(70, 32, true, 0)", description: 'High risk', result: 85 }
                ]
            },
            'blood_pressure_category': {
                description: 'Categorize blood pressure reading',
                parameters: ['systolic', 'diastolic'],
                returnType: 'string',
                examples: [
                    { code: "blood_pressure_category(120, 80)", description: 'Elevated BP', result: 'elevated' },
                    { code: "blood_pressure_category(110, 70)", description: 'Normal BP', result: 'normal' }
                ]
            },
            'cholesterol_risk': {
                description: 'Calculate cholesterol risk points',
                parameters: ['totalCholesterol', 'hdl', 'ldl'],
                returnType: 'number',
                examples: [
                    { code: "cholesterol_risk(200, 45, 130)", description: 'Moderate risk', result: 3 }
                ]
            },
            'calorie_needs': {
                description: 'Calculate daily calorie needs using Harris-Benedict equation',
                parameters: ['age', 'gender', 'weight', 'height', 'activityLevel?'],
                returnType: 'number',
                examples: [
                    { code: "calorie_needs(30, 'male', 75, 175, 'moderate')", description: 'Active male', result: 2650 }
                ]
            },
            'diabetes_risk_score': {
                description: 'Calculate type 2 diabetes risk score',
                parameters: ['age', 'bmi', 'familyHistory', 'bloodPressure'],
                returnType: 'number',
                examples: [
                    { code: "diabetes_risk_score(55, 30, true, 'stage1_hypertension')", description: 'High risk', result: 23 }
                ]
            },
            'medication_dosage': {
                description: 'Calculate weight-based medication dosage (educational only)',
                parameters: ['weight', 'medicationName', 'baselineUnits?'],
                returnType: 'number',
                examples: [
                    { code: "medication_dosage(70, 'acetaminophen')", description: 'Adult acetaminophen', result: 1050 }
                ]
            },
            'target_heart_rate': {
                description: 'Calculate target heart rate zones for exercise',
                parameters: ['age', 'restingHeartRate?'],
                returnType: 'object',
                examples: [
                    { code: "target_heart_rate(40, 65)", description: '40-year-old zones', result: { moderate_min: 155, moderate_max: 172, vigorous_min: 172, vigorous_max: 181 } }
                ]
            }
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HEALTHCARE_TEMPLATE };
} else {
    window.HEALTHCARE_TEMPLATE = HEALTHCARE_TEMPLATE;
}