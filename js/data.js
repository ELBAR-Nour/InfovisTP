// ===== Global State =====
let allData = [];
let filteredData = [];
let filters = { testResult: null, medicalCondition: null, ageGroup: null };

const COLORS = { Normal: '#22c55e', Abnormal: '#ef4444', Inconclusive: '#f59e0b' };
const AGE_GROUPS = ['0-18', '19-40', '41-65', '65+'];

function getAgeGroup(age) {
    if (age <= 18) return '0-18';
    if (age <= 40) return '19-40';
    if (age <= 65) return '41-65';
    return '65+';
}

function parseRecord(row) {
    try {
        // --- Date parsing ---
        const admission = row['Date of Admission'] ? new Date(row['Date of Admission']) : null;
        const discharge = row['Discharge Date'] ? new Date(row['Discharge Date']) : null;
        if (!admission || !discharge || isNaN(admission) || isNaN(discharge)) return null;

        // --- Number parsing ---
        const age = row['Age'] ? parseInt(row['Age'], 10) : null;
        const billingAmount = row['Billing Amount'] ? parseFloat(row['Billing Amount']) : 0;
        const roomNumber = row['Room Number'] ? parseInt(row['Room Number'], 10) : null;

        if (age === null) return null; // age required for analysis

        // --- Derived features ---
        const lengthOfStay = Math.ceil((discharge - admission) / (1000 * 60 * 60 * 24));
        const ageGroup = getAgeGroup(age);

        return {
            name: (row['Name'] || 'Unknown').trim(),
            age, gender: row['Gender'] || 'Unknown', bloodType: row['Blood Type'] || 'Unknown',
            medicalCondition: row['Medical Condition'] || 'Unknown',
            dateOfAdmission: admission,
            doctor: row['Doctor'] || 'Unknown',
            hospital: row['Hospital'] || 'Unknown',
            insuranceProvider: row['Insurance Provider'] || 'Unknown',
            billingAmount,
            roomNumber,
            admissionType: row['Admission Type'] || 'Unknown',
            dischargeDate: discharge,
            medication: row['Medication'] || 'None',
            testResults: row['Test Results'] || 'Inconclusive',
            lengthOfStay,
            ageGroup
        };
    } catch (e) {
        console.warn('Failed to parse row:', row, e);
        return null;
    }
}


// Load CSV or generate sample data
async function loadData() {
    try {
        let parsed = [];
        try {
            const csvData = await d3.csv('data/healthcare_dataset.csv');
            parsed = csvData.slice(0, 5000).map(parseRecord).filter(r => r !== null);
        } catch (e) { console.log('CSV not found, using generated sample data'); }

        if (parsed.length === 0) parsed = generateSampleData(5000);

        allData = parsed;
        filteredData = parsed;

        document.getElementById('loading').style.display = 'none';
        document.getElementById('app').style.display = 'block';

        populateConditionSelect();
        updateDashboard();
        window.addEventListener('resize', updateDashboard);

    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Sample Data generator (keep your existing function)
function updateStats() {
    const count = filteredData.length;
    const avgBilling = count > 0 ? filteredData.reduce((sum, d) => sum + d.billingAmount, 0) / count : 0;
    const avgStay = count > 0 ? filteredData.reduce((sum, d) => sum + d.lengthOfStay, 0) / count : 0;
    const abnormalRate = count > 0 ? (filteredData.filter(d => d.testResults === 'Abnormal').length / count) * 100 : 0;
    const conditions = new Set(filteredData.map(d => d.medicalCondition)).size;

    document.getElementById('stat-patients').textContent = count.toLocaleString();
    document.getElementById('stat-billing').textContent = '$' + Math.round(avgBilling).toLocaleString();
    document.getElementById('stat-stay').textContent = avgStay.toFixed(1) + ' days';
    document.getElementById('stat-abnormal').textContent = abnormalRate.toFixed(1) + '%';
    document.getElementById('stat-conditions').textContent = conditions + ' conditions tracked';

    const icon = document.getElementById('abnormal-icon');
    if (abnormalRate > 35) {
        icon.className = 'stat-icon danger';
    } else if (abnormalRate > 30) {
        icon.className = 'stat-icon default';
    } else {
        icon.className = 'stat-icon success';
    }

    document.getElementById('filtered-count').textContent = count.toLocaleString();
    document.getElementById('total-count').textContent = allData.length.toLocaleString();

    const hasFilters = Object.values(filters).some(v => v !== null);
    document.getElementById('total-label').style.display = hasFilters ? 'block' : 'none';
}

function updateFiltersBar() {
    // This function is now handled by updateFilterUI() in dashboard.js
    // Keeping this stub to avoid breaking any references
}

function generateSampleData(count) {
    const conditions = ['Cancer', 'Obesity', 'Diabetes', 'Asthma', 'Hypertension', 'Arthritis'];
    const admissionTypes = ['Urgent', 'Emergency', 'Elective'];
    const testResultsArr = ['Normal', 'Abnormal', 'Inconclusive'];
    const genders = ['Male', 'Female'];
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const medications = ['Paracetamol', 'Ibuprofen', 'Aspirin', 'Lipitor', 'Penicillin'];
    const insurers = ['Blue Cross', 'Medicare', 'Aetna', 'UnitedHealthcare', 'Cigna'];
    const hospitals = ['City General', 'Regional Medical', 'St. Marys Hospital', 'University Hospital', 'Community Health'];
    const doctors = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'Dr. Davis'];

    const seededRandom = (seed) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    const data = [];
    for (let i = 0; i < count; i++) {
        const seed = i + 1;
        const age = Math.floor(seededRandom(seed * 1) * 70) + 15;
        const lengthOfStay = Math.floor(seededRandom(seed * 6) * 25) + 1;
        const baseDate = new Date('2020-01-01');
        const daysToAdd = Math.floor(seededRandom(seed * 7) * 1500);
        const admissionDate = new Date(baseDate);
        admissionDate.setDate(admissionDate.getDate() + daysToAdd);
        const dischargeDate = new Date(admissionDate);
        dischargeDate.setDate(dischargeDate.getDate() + lengthOfStay);

        data.push({
            name: `Patient ${i + 1}`,
            age: age,
            gender: genders[Math.floor(seededRandom(seed * 2) * genders.length)],
            bloodType: bloodTypes[Math.floor(seededRandom(seed * 8) * bloodTypes.length)],
            medicalCondition: conditions[Math.floor(seededRandom(seed * 3) * conditions.length)],
            dateOfAdmission: admissionDate,
            doctor: doctors[Math.floor(seededRandom(seed * 9) * doctors.length)],
            hospital: hospitals[Math.floor(seededRandom(seed * 10) * hospitals.length)],
            insuranceProvider: insurers[Math.floor(seededRandom(seed * 11) * insurers.length)],
            billingAmount: Math.floor(seededRandom(seed * 12) * 48000) + 2000,
            roomNumber: Math.floor(seededRandom(seed * 13) * 400) + 100,
            admissionType: admissionTypes[Math.floor(seededRandom(seed * 4) * admissionTypes.length)],
            dischargeDate: dischargeDate,
            medication: medications[Math.floor(seededRandom(seed * 14) * medications.length)],
            testResults: testResultsArr[Math.floor(seededRandom(seed * 5) * testResultsArr.length)],
            lengthOfStay: lengthOfStay,
            ageGroup: getAgeGroup(age)
        });
    }
    return data;
}

function updateDashboard() {
    updateStats();
    updateFiltersBar();
    if (typeof updateFilterUI === 'function') updateFilterUI();
    if (typeof updateCharts === 'function') updateCharts();
}

function populateConditionSelect() {
    const conditions = [...new Set(allData.map(d => d.medicalCondition))].sort();
    const select = document.getElementById('condition-select');
    if (select) {
        // Keep the "All Conditions" option
        const currentValue = select.value;
        select.innerHTML = '<option value="">All Conditions</option>';
        conditions.forEach(condition => {
            const option = document.createElement('option');
            option.value = condition;
            option.textContent = condition;
            select.appendChild(option);
        });
        select.value = currentValue;
    }
}

// Start the application
loadData();
