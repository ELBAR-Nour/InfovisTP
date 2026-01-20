function applyFilters() {
    filteredData = allData.filter(r => {
        if (filters.testResult && r.testResults !== filters.testResult) return false;
        if (filters.medicalCondition && r.medicalCondition !== filters.medicalCondition) return false;
        if (filters.admissionType && r.admissionType !== filters.admissionType) return false;
        if (filters.medication && r.medication !== filters.medication) return false; 
        if (filters.ageGroup && r.ageGroup !== filters.ageGroup) return false;
        if (filters.hospital && r.hospital !== filters.hospital) return false;
        if (filters.gender && r.gender !== filters.gender) return false;
        if (filters.bloodType && r.bloodType !== filters.bloodType) return false;
        if (filters.admissionYear) {
            const recordYear = r.dateOfAdmission ? r.dateOfAdmission.getFullYear().toString() : null;
            if (recordYear !== filters.admissionYear) return false;
        }
        return true;
    });
    if (typeof updateDashboard === 'function') updateDashboard();
    updateFilterUI();
}

function setFilter(key, value) {
    filters[key] = filters[key] === value ? null : value;
    applyFilters();
}

function clearAllFilters() {
    filters = { 
        testResult: null, 
        medicalCondition: null, 
        medication: null,
        admissionType: null,
        ageGroup: null, 
        hospital: null,
        gender: null,
        bloodType: null,
        admissionYear: null
    };
    applyFilters();
}


function populateDropdowns() {
    // 1. Populate Medical Conditions
    const conditionSelect = document.getElementById('condition-select');
    if (conditionSelect) {
        const conditions = [...new Set(allData.map(d => d.medicalCondition))].filter(c => c).sort();
        conditionSelect.innerHTML = '<option value="">All Medical Conditions</option>';
        conditions.forEach(c => {
            const option = document.createElement('option');
            option.value = c;
            option.textContent = c;
            conditionSelect.appendChild(option);
        });
    }

    // 2. Populate Hospitals
    const hospitalSelect = document.getElementById('hospital-select');
    if (hospitalSelect) {
        const hospitals = [...new Set(allData.map(d => d.hospital))].filter(h => h).sort();
        hospitalSelect.innerHTML = '<option value="">All Hospitals</option>';
        hospitals.forEach(h => {
            const option = document.createElement('option');
            option.value = h;
            option.textContent = h;
            hospitalSelect.appendChild(option);
        });
    }

    // 3. Populate Medications 
    const medSelect = document.getElementById('medication-select');
    if (medSelect) {
        // Extract unique medications, remove blanks/Unknowns/Nones, and sort
        const medications = [...new Set(allData.map(d => d.medication))]
            .filter(m => m && m !== 'None' && m !== 'Unknown')
            .sort();
            
        medSelect.innerHTML = '<option value="">All Medications</option>';
        medications.forEach(med => {
            const option = document.createElement('option');
            option.value = med;
            option.textContent = med;
            medSelect.appendChild(option);
        });
    }

    // 4. Populate Blood Types
    const bloodSelect = document.getElementById('bloodtype-select');
    if (bloodSelect) {
        const bloodTypes = [...new Set(allData.map(d => d.bloodType))].filter(b => b).sort();
        bloodSelect.innerHTML = '<option value="">All Blood Types</option>';
        bloodTypes.forEach(b => {
            const option = document.createElement('option');
            option.value = b;
            option.textContent = b;
            bloodSelect.appendChild(option);
        });
    }

    // 5. Populate Years
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
        const years = [...new Set(allData.map(d => d.dateOfAdmission ? d.dateOfAdmission.getFullYear().toString() : null))]
            .filter(y => y)
            .sort((a, b) => b - a); // Newest first
        yearSelect.innerHTML = '<option value="">All Years</option>';
        years.forEach(y => {
            const option = document.createElement('option');
            option.value = y;
            option.textContent = y;
            yearSelect.appendChild(option);
        });
    }

    const admissionSelect = document.getElementById('admission-select');
    if (admissionSelect) {
        const admissionTypes = [...new Set(allData.map(d => d.admissionType))].filter(a => a).sort();
        admissionSelect.innerHTML = '<option value="">All Admission Types</option>';
        admissionTypes.forEach(a => {
            const option = document.createElement('option');
            option.value = a;
            option.textContent = a;
            admissionSelect.appendChild(option);
        });
    }
}

// ---------------------------------------------------------
// Handler Functions
// ---------------------------------------------------------

function handleConditionChange() {
    const select = document.getElementById('condition-select');
    filters.medicalCondition = select.value || null;
    applyFilters();
}

function handleMedicationChange() {
    const select = document.getElementById('medication-select');
    filters.medication = select.value || null;
    applyFilters();
}

function handleHospitalChange() {
    const select = document.getElementById('hospital-select');
    filters.hospital = select.value || null;
    applyFilters();
}

function handleBloodTypeChange() {
    const select = document.getElementById('bloodtype-select');
    filters.bloodType = select.value || null;
    applyFilters();
}

function handleYearChange() {
    const select = document.getElementById('year-select');
    filters.admissionYear = select.value || null;
    applyFilters();
}
function handleAdmissionTypeChange() {
    const select = document.getElementById('admission-select');
    filters.admissionType = select.value || null;
    applyFilters();
}

// ---------------------------------------------------------
// UI Update Logic
// ---------------------------------------------------------

function updateFilterUI() {
    // Update test result buttons
    document.querySelectorAll('.filter-chip').forEach(btn => {
        const btnText = btn.textContent.trim();
        const filterType = btn.dataset.filterType || 'testResult'; // Assuming you might distinguish groups
        
        btn.classList.remove('active');
        
        // Check if this button matches selected Test Result OR selected Age Group
        if (filters.testResult === btnText || filters.ageGroup === btnText) {
            btn.classList.add('active');
        }
    });


    // Update condition select
    const conditionSelect = document.getElementById('condition-select');
    if (conditionSelect) {
        conditionSelect.value = filters.medicalCondition || '';
    }
    
    // 3. Update Medication Select 
    const medSelect = document.getElementById('medication-select');
    if (medSelect) {
        medSelect.value = filters.medication || '';
    }

    // Update hospital select
    const hospitalSelect = document.getElementById('hospital-select');
    if (hospitalSelect) {
        hospitalSelect.value = filters.hospital || '';
    }

    const admissionSelect = document.getElementById('admission-select');
    if (admissionSelect) admissionSelect.value = filters.admissionType || '';
    
    // Update blood type select
    const bloodTypeSelect = document.getElementById('bloodtype-select');
    if (bloodTypeSelect) {
        bloodTypeSelect.value = filters.bloodType || '';
    }
    
    // Update year select
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
        yearSelect.value = filters.admissionYear || '';
    }
    
    // Update gender buttons
    document.querySelectorAll('.filter-chip[data-filter="Male"], .filter-chip[data-filter="Female"]').forEach(btn => {
        const btnText = btn.textContent.trim();
        btn.classList.remove('active');
        if (filters.gender === btnText) {
            btn.classList.add('active');
        }
    });

    // Update filter badges display with better styling
    const hasFilters = Object.values(filters).some(v => v !== null);
    const filtersDisplay = document.getElementById('filters-display');
    if (filtersDisplay) {
        filtersDisplay.style.display = hasFilters ? 'block' : 'none';
    }

    const badgesContainer = document.getElementById('filter-badges');
    if (badgesContainer) {
        badgesContainer.innerHTML = '';
        const filterCount = Object.values(filters).filter(v => v !== null).length;
        
        if (filterCount > 0) {
            const countBadge = document.createElement('span');
            countBadge.className = 'filter-count-badge';
            countBadge.textContent = filterCount;
            badgesContainer.appendChild(countBadge);
        }

        if (filters.testResult) {
            badgesContainer.innerHTML += `
                <span class="filter-badge filter-badge-test">
                    <span class="badge-icon" title="Test Result">✓</span>
                    <span class="badge-label">${filters.testResult}</span>
                    <button class="badge-remove" onclick="setFilter('testResult', '${filters.testResult}')" title="Remove">×</button>
                </span>
            `;
        }
        if (filters.medicalCondition) {
            badgesContainer.innerHTML += `
                <span class="filter-badge filter-badge-condition">
                    <span class="badge-icon" title="Medical Condition">✚</span>
                    <span class="badge-label">${filters.medicalCondition}</span>
                    <button class="badge-remove" onclick="setFilter('medicalCondition', '${filters.medicalCondition}')" title="Remove">×</button>
                </span>
            `;
        }
        if (filters.medication) {
            badgesContainer.innerHTML += `
                <span class="filter-badge filter-badge-medication">
                    <span class="badge-icon" title="Medication">💊</span>
                    <span class="badge-label">${filters.medication}</span>
                    <button class="badge-remove" onclick="setFilter('medication', '${filters.medication}')" title="Remove">×</button>
                </span>
            `;
        }
        if (filters.ageGroup) {
            badgesContainer.innerHTML += `
                <span class="filter-badge filter-badge-age">
                    <span class="badge-icon" title="Age Group">◆</span>
                    <span class="badge-label">${filters.ageGroup}</span>
                    <button class="badge-remove" onclick="setFilter('ageGroup', '${filters.ageGroup}')" title="Remove">×</button>
                </span>
            `;
        }
        if (filters.hospital) {
            badgesContainer.innerHTML += `
                <span class="filter-badge filter-badge-hospital">
                    <span class="badge-icon" title="Hospital">■</span>
                    <span class="badge-label">${filters.hospital}</span>
                    <button class="badge-remove" onclick="setFilter('hospital', '${filters.hospital}')" title="Remove">×</button>
                </span>
            `;
        }
        if (filters.gender) {
            badgesContainer.innerHTML += `
                <span class="filter-badge filter-badge-gender">
                    <span class="badge-icon" title="Gender">⚥</span>
                    <span class="badge-label">${filters.gender}</span>
                    <button class="badge-remove" onclick="setFilter('gender', '${filters.gender}')" title="Remove">×</button>
                </span>
            `;
        }
        if (filters.bloodType) {
            badgesContainer.innerHTML += `
                <span class="filter-badge filter-badge-blood">
                    <span class="badge-icon" title="Blood Type">🩸</span>
                    <span class="badge-label">${filters.bloodType}</span>
                    <button class="badge-remove" onclick="setFilter('bloodType', '${filters.bloodType}')" title="Remove">×</button>
                </span>
            `;
        }
        if (filters.admissionYear) {
            badgesContainer.innerHTML += `
                <span class="filter-badge filter-badge-year">
                    <span class="badge-icon" title="Admission Year">📅</span>
                    <span class="badge-label">${filters.admissionYear}</span>
                    <button class="badge-remove" onclick="setFilter('admissionYear', '${filters.admissionYear}')" title="Remove">×</button>
                </span>
            `;
        }
        if (filters.admissionType) {
             badgesContainer.innerHTML += `
                <span class="filter-badge filter-badge-admission">
                    <span class="badge-icon">🚑</span>
                    <span class="badge-label">${filters.admissionType}</span>
                    <button class="badge-remove" onclick="setFilter('admissionType', '${filters.admissionType}')">×</button>
                </span>
            `;
        }
    }

    const sectionMap = {
        testResult: 'Test Outcome',
        ageGroup: 'Age Bracket',
        gender: 'Gender',
        medicalCondition: 'Diagnosis',
        admissionType: 'Admission Type',
        medication: 'Medication',
        hospital: 'Hospital',
        bloodType: 'Blood Type',
        admissionYear: 'Admission Year'
    };

    document.querySelectorAll('.filter-section').forEach(sec => sec.classList.remove('section-active'));

    Object.keys(sectionMap).forEach(key => {
        if (filters[key]) {
            const label = sectionMap[key];
            const sec = Array.from(document.querySelectorAll('.filter-section')).find(s => {
                const lbl = s.querySelector('.filter-label');
                return lbl && lbl.textContent.trim() === label;
            });
            if (sec) sec.classList.add('section-active');
        }
    });
}

// Sidebar toggle
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    if (!sb) return;
    const collapsed = sb.classList.toggle('collapsed');
    if (collapsed) {
        document.body.classList.add('sidebar-collapsed');
        localStorage.setItem('sidebarCollapsed', '1');
    } else {
        document.body.classList.remove('sidebar-collapsed');
        localStorage.removeItem('sidebarCollapsed');
    }

    document.querySelectorAll('.filter-section').forEach(sec => {
        const header = sec.querySelector('.filter-section-header');
        const label = sec.querySelector('.filter-label');
        if (header && label) {
            if (collapsed) header.setAttribute('title', label.textContent.trim());
            else header.removeAttribute('title');
        }
    });

    // Update toggle button 
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', String(!collapsed));
}

// Initialize sidebar state from saved preference
document.addEventListener('DOMContentLoaded', function() {
    try {
        if (localStorage.getItem('sidebarCollapsed')) {
            const sb = document.getElementById('sidebar');
            if (sb) {
                sb.classList.add('collapsed');
                document.body.classList.add('sidebar-collapsed');
            }
        }
        if (typeof updateFilterUI === 'function') updateFilterUI();
        if (document.body.classList.contains('sidebar-collapsed')) {
            document.querySelectorAll('.filter-section').forEach(sec => {
                const header = sec.querySelector('.filter-section-header');
                const label = sec.querySelector('.filter-label');
                if (header && label) header.setAttribute('title', label.textContent.trim());
            });
        }
    } catch (e) {
        console.error('Error initializing sidebar state:', e);
    }
});