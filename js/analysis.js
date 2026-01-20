
function runAnalysis() {
    const featureCounts = {
        Age: new Set(filteredData.map(d=>d.ageGroup)).size,
        MedicalCondition: new Set(filteredData.map(d=>d.medicalCondition)).size,
        AdmissionType: new Set(filteredData.map(d=>d.admissionType)).size,
        InsuranceProvider: new Set(filteredData.map(d=>d.insuranceProvider)).size,
        Gender: new Set(filteredData.map(d=>d.gender)).size
    };
    console.log("Feature overview:", featureCounts);

    
    console.log("Potential influential features for Test Results:");
    console.log("- Age group, Medical Condition, Admission Type, Hospital, Gender");

    
    const abnormalByAge = d3.rollup(filteredData, v=>v.filter(d=>d.testResults==='Abnormal').length, d=>d.ageGroup);
    console.log("Abnormal tests by age group:", abnormalByAge);

    console.log("Suggested models for classification: Random Forest, XGBoost, Neural Network");
    console.log("Selected features: Age, Medical Condition, Admission Type, Hospital, Gender, Billing Amount");
}