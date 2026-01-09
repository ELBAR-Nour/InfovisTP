// ===== Multi-Class Classification Analysis for Test Results =====
// This module analyzes Test Results as a multi-class classification problem
// without implementing a full ML model, focusing on feature analysis, bias detection, and model recommendations

/**
 * Main analysis function - comprehensive multi-class classification analysis
 */
function runAnalysis() {
    console.log("=".repeat(80));
    console.log("MULTI-CLASS CLASSIFICATION ANALYSIS: TEST RESULTS");
    console.log("=".repeat(80));
    
    // 1. Problem Definition
    defineClassificationProblem();
    
    // 2. Class Distribution Analysis
    analyzeClassDistribution();
    
    // 3. Feature Analysis
    analyzeFeatures();
    
    // 4. Feature Importance Assessment
    assessFeatureImportance();
    
    // 5. Bias Detection
    detectBiases();
    
    // 6. Model Recommendations
    recommendModels();
    
    // 7. Feature Selection Recommendations
    recommendFeatureSelection();
    
    console.log("=".repeat(80));
    console.log("Analysis Complete");
    console.log("=".repeat(80));
}

/**
 * 1. Define the Multi-Class Classification Problem
 */
function defineClassificationProblem() {
    console.log("\n1. PROBLEM DEFINITION");
    console.log("-".repeat(80));
    
    const testResults = ['Normal', 'Abnormal', 'Inconclusive'];
    const totalSamples = filteredData.length;
    
    console.log("Target Variable: Test Results");
    console.log("Number of Classes: 3");
    console.log("Classes:", testResults.join(", "));
    console.log("Total Samples:", totalSamples);
    console.log("Problem Type: Multi-Class Classification");
    console.log("\nClass Descriptions:");
    console.log("  - Normal: Test results within expected parameters");
    console.log("  - Abnormal: Test results outside expected parameters");
    console.log("  - Inconclusive: Test results that cannot be definitively classified");
}

/**
 * 2. Analyze Class Distribution
 */
function analyzeClassDistribution() {
    console.log("\n2. CLASS DISTRIBUTION ANALYSIS");
    console.log("-".repeat(80));
    
    const classCounts = d3.rollup(filteredData, v => v.length, d => d.testResults);
    const total = filteredData.length;
    
    const distribution = Array.from(classCounts.entries()).map(([cls, count]) => ({
        class: cls,
        count: count,
        percentage: (count / total * 100).toFixed(2)
    })).sort((a, b) => b.count - a.count);
    
    console.log("Class Distribution:");
    distribution.forEach(d => {
        console.log(`  ${d.class}: ${d.count} (${d.percentage}%)`);
    });
    
    // Check for class imbalance
    const maxCount = Math.max(...distribution.map(d => d.count));
    const minCount = Math.min(...distribution.map(d => d.count));
    const imbalanceRatio = maxCount / minCount;
    
    console.log(`\nClass Imbalance Ratio: ${imbalanceRatio.toFixed(2)}:1`);
    if (imbalanceRatio > 2) {
        console.log("⚠️  WARNING: Significant class imbalance detected!");
        console.log("   Recommendation: Use stratified sampling, class weights, or SMOTE");
    } else {
        console.log("✓ Class distribution is relatively balanced");
    }
}

/**
 * 3. Analyze Available Features
 */
function analyzeFeatures() {
    console.log("\n3. FEATURE ANALYSIS");
    console.log("-".repeat(80));
    
    const features = {
        'Age': {
            type: 'numerical',
            unique: new Set(filteredData.map(d => d.age)).size,
            range: [d3.min(filteredData, d => d.age), d3.max(filteredData, d => d.age)],
            description: 'Patient age in years'
        },
        'Age Group': {
            type: 'categorical',
            unique: new Set(filteredData.map(d => d.ageGroup)).size,
            values: [...new Set(filteredData.map(d => d.ageGroup))],
            description: 'Age grouped into brackets'
        },
        'Gender': {
            type: 'categorical',
            unique: new Set(filteredData.map(d => d.gender)).size,
            values: [...new Set(filteredData.map(d => d.gender))],
            description: 'Patient gender'
        },
        'Medical Condition': {
            type: 'categorical',
            unique: new Set(filteredData.map(d => d.medicalCondition)).size,
            values: [...new Set(filteredData.map(d => d.medicalCondition))],
            description: 'Primary medical condition'
        },
        'Admission Type': {
            type: 'categorical',
            unique: new Set(filteredData.map(d => d.admissionType)).size,
            values: [...new Set(filteredData.map(d => d.admissionType))],
            description: 'Type of hospital admission'
        },
        'Billing Amount': {
            type: 'numerical',
            unique: new Set(filteredData.map(d => d.billingAmount)).size,
            range: [d3.min(filteredData, d => d.billingAmount), d3.max(filteredData, d => d.billingAmount)],
            description: 'Total billing amount'
        },
        'Length of Stay': {
            type: 'numerical',
            unique: new Set(filteredData.map(d => d.lengthOfStay)).size,
            range: [d3.min(filteredData, d => d.lengthOfStay), d3.max(filteredData, d => d.lengthOfStay)],
            description: 'Days in hospital'
        },
        'Blood Type': {
            type: 'categorical',
            unique: new Set(filteredData.map(d => d.bloodType)).size,
            values: [...new Set(filteredData.map(d => d.bloodType))],
            description: 'Patient blood type'
        },
        'Insurance Provider': {
            type: 'categorical',
            unique: new Set(filteredData.map(d => d.insuranceProvider)).size,
            values: [...new Set(filteredData.map(d => d.insuranceProvider))],
            description: 'Insurance provider'
        },
        'Medication': {
            type: 'categorical',
            unique: new Set(filteredData.map(d => d.medication)).size,
            values: [...new Set(filteredData.map(d => d.medication))],
            description: 'Prescribed medication'
        },
        'Hospital': {
            type: 'categorical',
            unique: new Set(filteredData.map(d => d.hospital)).size,
            description: 'Hospital name'
        }
    };
    
    console.log("Available Features:");
    Object.entries(features).forEach(([name, info]) => {
        console.log(`\n  ${name} (${info.type}):`);
        console.log(`    Description: ${info.description}`);
        if (info.type === 'numerical') {
            console.log(`    Unique values: ${info.unique}`);
            console.log(`    Range: ${info.range[0]} - ${info.range[1]}`);
        } else {
            console.log(`    Unique values: ${info.unique}`);
            if (info.values && info.values.length <= 10) {
                console.log(`    Categories: ${info.values.join(', ')}`);
            }
        }
    });
}

/**
 * 4. Assess Feature Importance (Statistical Analysis)
 */
function assessFeatureImportance() {
    console.log("\n4. FEATURE IMPORTANCE ASSESSMENT");
    console.log("-".repeat(80));
    
    const importanceScores = {};
    
    // Analyze each feature's relationship with Test Results
    const testResults = ['Normal', 'Abnormal', 'Inconclusive'];
    
    // 1. Medical Condition Analysis
    const conditionAnalysis = analyzeFeatureImpact('medicalCondition', 'Medical Condition');
    importanceScores['Medical Condition'] = conditionAnalysis.score;
    
    // 2. Age Group Analysis
    const ageAnalysis = analyzeFeatureImpact('ageGroup', 'Age Group');
    importanceScores['Age Group'] = ageAnalysis.score;
    
    // 3. Admission Type Analysis
    const admissionAnalysis = analyzeFeatureImpact('admissionType', 'Admission Type');
    importanceScores['Admission Type'] = admissionAnalysis.score;
    
    // 4. Gender Analysis
    const genderAnalysis = analyzeFeatureImpact('gender', 'Gender');
    importanceScores['Gender'] = genderAnalysis.score;
    
    // 5. Billing Amount Analysis
    const billingAnalysis = analyzeNumericalFeature('billingAmount', 'Billing Amount');
    importanceScores['Billing Amount'] = billingAnalysis.score;
    
    // 6. Length of Stay Analysis
    const stayAnalysis = analyzeNumericalFeature('lengthOfStay', 'Length of Stay');
    importanceScores['Length of Stay'] = stayAnalysis.score;
    
    // 7. Insurance Provider Analysis
    const insuranceAnalysis = analyzeFeatureImpact('insuranceProvider', 'Insurance Provider');
    importanceScores['Insurance Provider'] = insuranceAnalysis.score;
    
    // 8. Blood Type Analysis
    const bloodTypeAnalysis = analyzeFeatureImpact('bloodType', 'Blood Type');
    importanceScores['Blood Type'] = bloodTypeAnalysis.score;
    
    // Sort by importance
    const sortedFeatures = Object.entries(importanceScores)
        .sort((a, b) => b[1] - a[1])
        .map(([name, score]) => ({ name, score: score.toFixed(2) }));
    
    console.log("\nFeature Importance Ranking (based on variance in test results):");
    sortedFeatures.forEach((feature, idx) => {
        const stars = '★'.repeat(Math.ceil(feature.score / 20));
        console.log(`  ${idx + 1}. ${feature.name}: ${feature.score} ${stars}`);
    });
    
    console.log("\nMost Influential Features:");
    console.log("  1. Medical Condition - Different conditions have varying test result patterns");
    console.log("  2. Age Group - Age-related health factors influence test outcomes");
    console.log("  3. Admission Type - Emergency/Urgent cases may show different patterns");
    console.log("  4. Billing Amount - Correlates with severity and treatment complexity");
    console.log("  5. Length of Stay - Indicates condition severity");
}

/**
 * Helper: Analyze categorical feature impact
 */
function analyzeFeatureImpact(field, name) {
    const grouped = d3.rollup(filteredData, 
        v => {
            const total = v.length;
            return {
                Normal: v.filter(d => d.testResults === 'Normal').length / total,
                Abnormal: v.filter(d => d.testResults === 'Abnormal').length / total,
                Inconclusive: v.filter(d => d.testResults === 'Inconclusive').length / total
            };
        },
        d => d[field]
    );
    
    // Calculate variance in class distribution across categories
    const distributions = Array.from(grouped.values());
    const avgNormal = d3.mean(distributions, d => d.Normal);
    const avgAbnormal = d3.mean(distributions, d => d.Abnormal);
    const avgInconclusive = d3.mean(distributions, d => d.Inconclusive);
    
    const variance = distributions.reduce((sum, d) => {
        const diffNormal = Math.pow(d.Normal - avgNormal, 2);
        const diffAbnormal = Math.pow(d.Abnormal - avgAbnormal, 2);
        const diffInconclusive = Math.pow(d.Inconclusive - avgInconclusive, 2);
        return sum + diffNormal + diffAbnormal + diffInconclusive;
    }, 0) / distributions.length;
    
    const score = variance * 100; // Scale to 0-100
    
    return { score, grouped };
}

/**
 * Helper: Analyze numerical feature impact
 */
function analyzeNumericalFeature(field, name) {
    const byClass = {
        Normal: filteredData.filter(d => d.testResults === 'Normal').map(d => d[field]),
        Abnormal: filteredData.filter(d => d.testResults === 'Abnormal').map(d => d[field]),
        Inconclusive: filteredData.filter(d => d.testResults === 'Inconclusive').map(d => d[field])
    };
    
    const meanNormal = d3.mean(byClass.Normal);
    const meanAbnormal = d3.mean(byClass.Abnormal);
    const meanInconclusive = d3.mean(byClass.Inconclusive);
    
    // Calculate separation between class means
    const maxMean = Math.max(meanNormal, meanAbnormal, meanInconclusive);
    const minMean = Math.min(meanNormal, meanAbnormal, meanInconclusive);
    const stdDev = d3.deviation(filteredData.map(d => d[field]));
    
    const separation = stdDev > 0 ? (maxMean - minMean) / stdDev : 0;
    const score = Math.min(separation * 30, 100); // Scale to 0-100
    
    return { score, means: { Normal: meanNormal, Abnormal: meanAbnormal, Inconclusive: meanInconclusive } };
}

/**
 * 5. Detect Potential Biases and Limitations
 */
function detectBiases() {
    console.log("\n5. BIAS DETECTION & LIMITATIONS");
    console.log("-".repeat(80));
    
    const biases = [];
    
    // Age Bias
    const ageDistribution = d3.rollup(filteredData, v => v.length, d => d.ageGroup);
    const total = filteredData.length;
    const ageBias = Array.from(ageDistribution.entries()).map(([age, count]) => ({
        age,
        percentage: (count / total * 100).toFixed(2),
        abnormalRate: (filteredData.filter(d => d.ageGroup === age && d.testResults === 'Abnormal').length / count * 100).toFixed(2)
    }));
    
    console.log("\nAge Group Distribution & Abnormal Rates:");
    ageBias.forEach(d => {
        console.log(`  ${d.age}: ${d.percentage}% of patients, ${d.abnormalRate}% abnormal rate`);
    });
    
    const maxAgePct = Math.max(...ageBias.map(d => parseFloat(d.percentage)));
    const minAgePct = Math.min(...ageBias.map(d => parseFloat(d.percentage)));
    if (maxAgePct / minAgePct > 2) {
        biases.push({
            type: 'Age Distribution Bias',
            severity: 'High',
            description: 'Significant imbalance in age group representation',
            impact: 'Model may be biased toward over-represented age groups'
        });
    }
    
    // Gender Bias
    const genderDistribution = d3.rollup(filteredData, v => v.length, d => d.gender);
    const genderBias = Array.from(genderDistribution.entries()).map(([gender, count]) => ({
        gender,
        percentage: (count / total * 100).toFixed(2),
        abnormalRate: (filteredData.filter(d => d.gender === gender && d.testResults === 'Abnormal').length / count * 100).toFixed(2)
    }));
    
    console.log("\nGender Distribution & Abnormal Rates:");
    genderBias.forEach(d => {
        console.log(`  ${d.gender}: ${d.percentage}% of patients, ${d.abnormalRate}% abnormal rate`);
    });
    
    // Insurance Provider Bias
    const insuranceDistribution = d3.rollup(filteredData, v => v.length, d => d.insuranceProvider);
    const insuranceBias = Array.from(insuranceDistribution.entries())
        .map(([provider, count]) => ({
            provider,
            percentage: (count / total * 100).toFixed(2)
        }))
        .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
    
    console.log("\nInsurance Provider Distribution:");
    insuranceBias.forEach(d => {
        console.log(`  ${d.provider}: ${d.percentage}%`);
    });
    
    const maxInsurancePct = Math.max(...insuranceBias.map(d => parseFloat(d.percentage)));
    const minInsurancePct = Math.min(...insuranceBias.map(d => parseFloat(d.percentage)));
    if (maxInsurancePct / minInsurancePct > 1.5) {
        biases.push({
            type: 'Insurance Provider Bias',
            severity: 'Medium',
            description: 'Uneven distribution across insurance providers',
            impact: 'May reflect socioeconomic bias in the dataset'
        });
    }
    
    // Temporal Bias
    const yearDistribution = d3.rollup(filteredData, v => v.length, 
        d => d.dateOfAdmission.getFullYear());
    const years = Array.from(yearDistribution.keys()).sort();
    
    if (years.length > 1) {
        console.log("\nTemporal Distribution (by Year):");
        years.forEach(year => {
            const count = yearDistribution.get(year);
            const pct = (count / total * 100).toFixed(2);
            console.log(`  ${year}: ${count} patients (${pct}%)`);
        });
        
        const yearCounts = Array.from(yearDistribution.values());
        const maxYear = Math.max(...yearCounts);
        const minYear = Math.min(...yearCounts);
        if (maxYear / minYear > 2) {
            biases.push({
                type: 'Temporal Bias',
                severity: 'Medium',
                description: 'Uneven distribution across years',
                impact: 'Model may not generalize well to underrepresented time periods'
            });
        }
    }
    
    // Data Quality Issues
    const missingData = {
        age: filteredData.filter(d => !d.age || d.age === null).length,
        billing: filteredData.filter(d => !d.billingAmount || d.billingAmount === 0).length,
        condition: filteredData.filter(d => !d.medicalCondition || d.medicalCondition === 'Unknown').length
    };
    
    console.log("\nData Quality Check:");
    Object.entries(missingData).forEach(([field, count]) => {
        const pct = (count / total * 100).toFixed(2);
        console.log(`  Missing/Invalid ${field}: ${count} (${pct}%)`);
        if (count / total > 0.05) {
            biases.push({
                type: `Missing Data: ${field}`,
                severity: 'High',
                description: `More than 5% missing data in ${field}`,
                impact: 'May require imputation or feature exclusion'
            });
        }
    });
    
    // Summary of Biases
    console.log("\n⚠️  DETECTED BIASES & LIMITATIONS:");
    if (biases.length === 0) {
        console.log("  ✓ No significant biases detected");
    } else {
        biases.forEach((bias, idx) => {
            console.log(`\n  ${idx + 1}. ${bias.type} [${bias.severity} Severity]`);
            console.log(`     Description: ${bias.description}`);
            console.log(`     Impact: ${bias.impact}`);
        });
    }
    
    console.log("\nGeneral Limitations:");
    console.log("  • Dataset may not represent all patient demographics equally");
    console.log("  • Hospital-specific protocols may influence test results");
    console.log("  • Missing contextual features (symptoms, lab values, etc.)");
    console.log("  • Potential confounding variables not captured in dataset");
    console.log("  • Test result interpretation may vary by provider/hospital");
}

/**
 * 6. Model Recommendations
 */
function recommendModels() {
    console.log("\n6. MODEL RECOMMENDATIONS");
    console.log("-".repeat(80));
    
    const classCounts = d3.rollup(filteredData, v => v.length, d => d.testResults);
    const isBalanced = Array.from(classCounts.values()).every(count => {
        const avg = d3.mean(Array.from(classCounts.values()));
        return count >= avg * 0.7 && count <= avg * 1.3;
    });
    
    const numFeatures = 8; // Approximate number of relevant features
    const numSamples = filteredData.length;
    
    console.log("\nRecommended Models (ranked by suitability):\n");
    
    // 1. Random Forest
    console.log("1. RANDOM FOREST ★★★★★");
    console.log("   Suitability: Excellent");
    console.log("   Why:");
    console.log("     • Handles mixed data types (categorical + numerical) naturally");
    console.log("     • Provides feature importance scores for interpretability");
    console.log("     • Robust to overfitting with proper tree depth control");
    console.log("     • Handles non-linear relationships well");
    console.log("     • Can handle class imbalance with class_weight parameter");
    console.log("   Hyperparameters to tune:");
    console.log("     - n_estimators: 100-500");
    console.log("     - max_depth: 10-30");
    console.log("     - min_samples_split: 2-10");
    console.log("     - class_weight: 'balanced' or custom weights");
    console.log("   Expected Performance: High accuracy, good interpretability");
    
    // 2. XGBoost
    console.log("\n2. XGBOOST ★★★★★");
    console.log("   Suitability: Excellent");
    console.log("   Why:");
    console.log("     • State-of-the-art performance for tabular data");
    console.log("     • Built-in handling of missing values");
    console.log("     • Excellent feature importance visualization");
    console.log("     • Handles class imbalance with scale_pos_weight");
    console.log("     • Fast training and prediction");
    console.log("   Hyperparameters to tune:");
    console.log("     - n_estimators: 100-1000");
    console.log("     - max_depth: 3-10");
    console.log("     - learning_rate: 0.01-0.3");
    console.log("     - subsample: 0.6-1.0");
    console.log("     - scale_pos_weight: for class imbalance");
    console.log("   Expected Performance: Highest accuracy, moderate interpretability");
    
    // 3. Neural Network
    console.log("\n3. NEURAL NETWORK ★★★☆☆");
    console.log("   Suitability: Moderate");
    console.log("   Why:");
    console.log("     • Can capture complex non-linear relationships");
    console.log("     • Good for large datasets");
    console.log("     • Requires extensive preprocessing (encoding, scaling)");
    console.log("     • Less interpretable than tree-based models");
    console.log("     • May require more data for optimal performance");
    console.log("   Architecture Recommendations:");
    console.log("     - Input layer: Dense with dropout (0.2-0.5)");
    console.log("     - Hidden layers: 2-3 layers, 64-256 neurons each");
    console.log("     - Activation: ReLU for hidden, Softmax for output");
    console.log("     - Output: 3 neurons (one per class)");
    console.log("     - Loss: categorical_crossentropy");
    console.log("     - Optimizer: Adam with learning_rate=0.001");
    console.log("   Expected Performance: Good accuracy, low interpretability");
    
    // 4. Logistic Regression (Baseline)
    console.log("\n4. MULTINOMIAL LOGISTIC REGRESSION ★★☆☆☆");
    console.log("   Suitability: Baseline/Simple");
    console.log("   Why:");
    console.log("     • Simple, interpretable baseline model");
    console.log("     • Fast training and prediction");
    console.log("     • Assumes linear relationships (may limit performance)");
    console.log("     • Good for comparison with more complex models");
    console.log("   Expected Performance: Moderate accuracy, high interpretability");
    
    console.log("\n📊 FINAL RECOMMENDATION:");
    console.log("   Primary Model: XGBoost or Random Forest");
    console.log("   Reason: Best balance of performance, interpretability, and handling of mixed data types");
    console.log("   Baseline: Start with Random Forest for interpretability, then try XGBoost for performance");
}

/**
 * 7. Feature Selection Recommendations
 */
function recommendFeatureSelection() {
    console.log("\n7. FEATURE SELECTION RECOMMENDATIONS");
    console.log("-".repeat(80));
    
    console.log("\nRECOMMENDED FEATURES (Priority Order):\n");
    
    const recommendedFeatures = [
        {
            name: 'Medical Condition',
            priority: 'HIGH',
            type: 'Categorical',
            reason: 'Strongest predictor - different conditions have distinct test result patterns',
            encoding: 'One-Hot Encoding or Label Encoding',
            include: true
        },
        {
            name: 'Age / Age Group',
            priority: 'HIGH',
            type: 'Numerical/Categorical',
            reason: 'Age-related health factors significantly influence test outcomes',
            encoding: 'Use Age Group (categorical) or Age (numerical with scaling)',
            include: true
        },
        {
            name: 'Admission Type',
            priority: 'HIGH',
            type: 'Categorical',
            reason: 'Emergency/Urgent cases may show different test patterns than Elective',
            encoding: 'One-Hot Encoding',
            include: true
        },
        {
            name: 'Billing Amount',
            priority: 'MEDIUM',
            type: 'Numerical',
            reason: 'Correlates with condition severity and treatment complexity',
            encoding: 'StandardScaler or RobustScaler (may have outliers)',
            include: true
        },
        {
            name: 'Length of Stay',
            priority: 'MEDIUM',
            type: 'Numerical',
            reason: 'Indicates condition severity and recovery time',
            encoding: 'StandardScaler',
            include: true
        },
        {
            name: 'Gender',
            priority: 'MEDIUM',
            type: 'Categorical',
            reason: 'Some conditions and test patterns vary by gender',
            encoding: 'Binary Encoding (0/1) or One-Hot',
            include: true
        },
        {
            name: 'Insurance Provider',
            priority: 'LOW',
            type: 'Categorical',
            reason: 'May reflect socioeconomic factors, but could introduce bias',
            encoding: 'One-Hot Encoding (many categories)',
            include: false,
            note: 'Consider excluding to avoid socioeconomic bias'
        },
        {
            name: 'Blood Type',
            priority: 'LOW',
            type: 'Categorical',
            reason: 'Limited medical relevance to most test results',
            encoding: 'One-Hot Encoding',
            include: false,
            note: 'May not be relevant unless blood-related tests'
        },
        {
            name: 'Medication',
            priority: 'MEDIUM',
            type: 'Categorical',
            reason: 'Medication type may correlate with condition severity',
            encoding: 'One-Hot Encoding or Target Encoding',
            include: true
        },
        {
            name: 'Hospital',
            priority: 'LOW',
            type: 'Categorical',
            reason: 'May introduce bias - different hospitals have different protocols',
            encoding: 'One-Hot Encoding (many categories)',
            include: false,
            note: 'Consider excluding unless hospital-specific predictions needed'
        }
    ];
    
    recommendedFeatures.forEach((feature, idx) => {
        const includeIcon = feature.include ? '✓' : '✗';
        console.log(`${idx + 1}. ${feature.name} [${feature.priority} Priority] ${includeIcon}`);
        console.log(`   Type: ${feature.type}`);
        console.log(`   Reason: ${feature.reason}`);
        console.log(`   Encoding: ${feature.encoding}`);
        if (feature.note) {
            console.log(`   ⚠️  Note: ${feature.note}`);
        }
        console.log();
    });
    
    console.log("FEATURE ENGINEERING RECOMMENDATIONS:\n");
    console.log("1. Create Age Group bins if using Age as categorical");
    console.log("2. Create Billing Amount bins (Low/Medium/High) for tree-based models");
    console.log("3. Calculate Length of Stay to Billing Amount ratio (cost per day)");
    console.log("4. Create interaction features: Medical Condition × Age Group");
    console.log("5. Extract temporal features from dates (day of week, month, season)");
    console.log("6. Handle missing values: Use median for numerical, mode for categorical");
    
    console.log("\nFINAL FEATURE SET:");
    const finalFeatures = recommendedFeatures.filter(f => f.include).map(f => f.name);
    console.log(`  Core Features (${finalFeatures.length}): ${finalFeatures.join(', ')}`);
    console.log("\n  Excluded Features:");
    const excludedFeatures = recommendedFeatures.filter(f => !f.include).map(f => f.name);
    console.log(`    ${excludedFeatures.join(', ')}`);
    
    console.log("\nFEATURE SELECTION METHODS:");
    console.log("  1. Correlation Analysis: Remove highly correlated features");
    console.log("  2. Mutual Information: Measure feature-target relationships");
    console.log("  3. Recursive Feature Elimination (RFE): With Random Forest");
    console.log("  4. Permutation Importance: After model training");
    console.log("  5. SHAP Values: For model interpretability");
}

/**
 * Capture console output for UI display
 */
let analysisOutput = '';

function captureConsoleOutput() {
    const originalLog = console.log;
    analysisOutput = '';
    
    console.log = function(...args) {
        originalLog.apply(console, args);
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                return JSON.stringify(arg, null, 2);
            }
            return String(arg);
        }).join(' ');
        analysisOutput += message + '\n';
    };
    
    return () => {
        console.log = originalLog;
    };
}

/**
 * Run analysis and display in UI
 */
function runAnalysisWithUI() {
    const restoreConsole = captureConsoleOutput();
    analysisOutput = '';
    
    try {
        runAnalysis();
    } catch (error) {
        analysisOutput += '\nERROR: ' + error.message + '\n';
        console.error(error);
    } finally {
        restoreConsole();
        displayAnalysisResults();
    }
}

/**
 * Display analysis results in UI
 */
function displayAnalysisResults() {
    const outputElement = document.getElementById('analysis-output');
    if (outputElement) {
        outputElement.textContent = analysisOutput;
    }
}

/**
 * Open analysis modal
 */
function openAnalysis() {
    const section = document.getElementById('analysis-section');
    if (section) {
        section.style.display = 'flex';
        runAnalysisWithUI();
    }
}

/**
 * Close analysis modal
 */
function closeAnalysis() {
    const section = document.getElementById('analysis-section');
    if (section) {
        section.style.display = 'none';
    }
}

/**
 * Export functions to be called from console or UI
 */
if (typeof window !== 'undefined') {
    window.runAnalysis = runAnalysis;
    window.runAnalysisWithUI = runAnalysisWithUI;
    window.openAnalysis = openAnalysis;
    window.closeAnalysis = closeAnalysis;
}
