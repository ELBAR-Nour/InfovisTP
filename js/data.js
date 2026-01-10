// ===== Global State =====
let allData = [];
let filteredData = [];
let filters = { 
    testResult: null, 
    medicalCondition: null, 
    medication: null,
    ageGroup: null, 
    hospital: null,
    gender: null,
    bloodType: null,
    admissionYear: null
};

// Dynamic COLORS based on vision type
let COLORS = { Normal: '#22c55e', Abnormal: '#ef4444', Inconclusive: '#f59e0b' };
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
            // Use PapaParse worker-based parsing when available to avoid blocking
            // the main thread for large CSV files. Falls back to `d3.csv`.
            if (typeof Papa !== 'undefined' && Papa.parse) {
                allData = [];
                let processed = 0;
                const MAX_RECORDS = null; // set to a number for dev limiting

                await new Promise((resolve, reject) => {
                    Papa.parse('data/healthcare_dataset.csv', {
                        download: true,
                        header: true,
                        worker: true,
                        chunk: function(results) {
                            const rows = results.data;
                            // Apply optional limit if requested
                            let useful = rows;
                            if (typeof MAX_RECORDS === 'number' && MAX_RECORDS > 0) {
                                const remaining = Math.max(0, MAX_RECORDS - allData.length);
                                useful = rows.slice(0, remaining);
                            }
                            const parsedChunk = useful.map(parseRecord).filter(r => r !== null);
                            allData.push(...parsedChunk);
                            processed += rows.length;
                            const loadingEl = document.getElementById('loading');
                            if (loadingEl) {
                                const p = loadingEl.querySelector('p');
                                if (p) p.textContent = `Parsing ${allData.length} rows...`;
                            }
                            // If we've reached a MAX_RECORDS cap, abort parsing early
                            if (typeof MAX_RECORDS === 'number' && MAX_RECORDS > 0 && allData.length >= MAX_RECORDS) {
                                this.abort();
                            }
                        },
                        error: function(err) { console.error('PapaParse error', err); reject(err); },
                        complete: function() {
                            parsed = allData.slice();
                            console.log(`✓ Parsed (PapaParse): ${parsed.length} valid records`);
                            resolve();
                        }
                    });
                });
            } else {
                const csvData = await d3.csv('data/healthcare_dataset.csv');
                console.log(`✓ CSV loaded: ${csvData.length} records`);

                // By default load the full CSV. If you need to limit records for
                // performance during development, set `MAX_RECORDS` to a positive
                // integer. Leave `null` to use all rows.
                const MAX_RECORDS = null; // e.g. 5000 to limit
                const rows = (typeof MAX_RECORDS === 'number' && MAX_RECORDS > 0)
                    ? csvData.slice(0, MAX_RECORDS)
                    : csvData;

                parsed = rows.map(parseRecord).filter(r => r !== null);
                console.log(`✓ Parsed: ${parsed.length} valid records (limit: ${MAX_RECORDS || 'none'})`);
            }
        } catch (e) {
            console.warn('CSV not found or parse failed, using generated sample data:', e);
        }

        if (parsed.length === 0) {
            console.warn('⚠ No valid records from CSV, generating fallback data');
        }

        allData = parsed;
        
        filteredData = parsed;

        console.log(`✓ Data ready: ${allData.length} records`);
        console.log(`✓ Unique hospitals: ${[...new Set(allData.map(d => d.hospital))].join(', ')}`);

        // Apply color scheme based on vision type
        const scheme = getColorScheme();
        COLORS.Normal = scheme.Normal;
        COLORS.Abnormal = scheme.Abnormal;
        COLORS.Inconclusive = scheme.Inconclusive;
        COLORS.male = scheme.male;
        COLORS.female = scheme.female;
        // Store color scheme globally for charts to access
        window.currentColorScheme = scheme;

        document.getElementById('loading').style.display = 'none';
        document.getElementById('app').style.display = 'block';

        populateConditionSelect();
        populateHospitalSelect();
        populateBloodTypeSelect();
        populateYearSelect();
        populateMedicationSelect();
        updateDashboard();

        window.addEventListener('resize', updateDashboard);

    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Sample Data generator 
function updateStats() {
    const count = filteredData.length;
    const avgBilling = count > 0 ? filteredData.reduce((sum, d) => sum + d.billingAmount, 0) / count : 0;
    const avgStay = count > 0 ? filteredData.reduce((sum, d) => sum + d.lengthOfStay, 0) / count : 0;
    const abnormalRate = count > 0 ? (filteredData.filter(d => d.testResults === 'Abnormal').length / count) * 100 : 0;
    const conditions = new Set(filteredData.map(d => d.medicalCondition)).size;
    const uniqueDoctors = new Set(filteredData.map(d => d.doctor)).size;
    const uniquePatients = new Set(filteredData.map(d => d.name)).size;

    document.getElementById('stat-patients').textContent = count.toLocaleString();
    document.getElementById('stat-billing').textContent = '$' + Math.round(avgBilling).toLocaleString();
    document.getElementById('stat-stay').textContent = avgStay.toFixed(1) + ' days';
    document.getElementById('stat-abnormal').textContent = abnormalRate.toFixed(1) + '%';
    document.getElementById('stat-conditions').textContent = conditions + ' conditions tracked';

    // Update patient coverage KPI
    const totalPatients = allData.length;
    const coveragePercent = totalPatients > 0 ? ((count / totalPatients) * 100).toFixed(1) : 0;
    const coverageElement = document.getElementById('stat-coverage');
    const coverageSubtitle = document.getElementById('stat-coverage-subtitle');
    if (coverageElement) {
        coverageElement.textContent = coveragePercent + '%';
    }
    if (coverageSubtitle) {
        const hasFilters = Object.values(filters).some(v => v !== null);
        coverageSubtitle.textContent = hasFilters 
            ? `of ${totalPatients.toLocaleString()} total` 
            : 'of total dataset';
    }
    const uniquePatientEl = document.getElementById('stat-unique-patients');
    if (uniquePatientEl) uniquePatientEl.textContent = uniquePatients.toLocaleString();
    
    const doctorEl = document.getElementById('stat-doctors');
    if (doctorEl) doctorEl.textContent = uniqueDoctors.toLocaleString();
    
    // Update patient subtitle to show total when filtered
    const patientsSubtitle = document.getElementById('stat-patients-subtitle');
    if (patientsSubtitle) {
        const hasFilters = Object.values(filters).some(v => v !== null);
        patientsSubtitle.textContent = hasFilters 
            ? `Filtered (${totalPatients.toLocaleString()} total)` 
            : 'In current view';
    }

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





function updateDashboard() {
    updateStats();

    if (typeof updateFilterUI === 'function') updateFilterUI();
    if (typeof updateCharts === 'function') updateCharts();
    if (typeof updateHospitalMap === 'function') updateHospitalMap();
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

function populateHospitalSelect() {
    const hospitals = [...new Set(allData.map(d => d.hospital))].sort();
    const select = document.getElementById('hospital-select');
    if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">All Hospitals</option>';
        hospitals.forEach(hospital => {
            const option = document.createElement('option');
            option.value = hospital;
            option.textContent = hospital;
            select.appendChild(option);
        });
        select.value = currentValue;
    }
}

function populateBloodTypeSelect() {
    const bloodTypes = [...new Set(allData.map(d => d.bloodType))].sort();
    const select = document.getElementById('bloodtype-select');
    if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">All Blood Types</option>';
        bloodTypes.forEach(bloodType => {
            const option = document.createElement('option');
            option.value = bloodType;
            option.textContent = bloodType;
            select.appendChild(option);
        });
        select.value = currentValue;
    }
}

function populateYearSelect() {
    const years = [...new Set(allData
        .map(d => d.dateOfAdmission ? d.dateOfAdmission.getFullYear() : null)
        .filter(y => y !== null)
    )].sort((a, b) => b - a); // Sort descending (newest first)
    const select = document.getElementById('year-select');
    if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">All Years</option>';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year.toString();
            option.textContent = year.toString();
            select.appendChild(option);
        });
        select.value = currentValue;
    }
}
function populateMedicationSelect() {
    // Get unique medications, filter out invalid ones, and sort
    const medications = [...new Set(allData.map(d => d.medication))]
        .filter(m => m && m !== 'None' && m !== 'Unknown')
        .sort();
        
    const select = document.getElementById('medication-select');
    if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">All Medications</option>';
        medications.forEach(med => {
            const option = document.createElement('option');
            option.value = med;
            option.textContent = med;
            select.appendChild(option);
        });
        select.value = currentValue;
    }
}

// Start the application when D3 is ready
if (typeof d3 !== 'undefined') {
    loadData();
} else {
    window.addEventListener('load', loadData);
}