function applyFilters() {
    filteredData = allData.filter(r => {
        if (filters.testResult && r.testResults !== filters.testResult) return false;
        if (filters.medicalCondition && r.medicalCondition !== filters.medicalCondition) return false;
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
    updateDashboard();
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
        ageGroup: null, 
        hospital: null,
        gender: null,
        bloodType: null,
        admissionYear: null
    };
    applyFilters();
}

function handleConditionChange() {
    const select = document.getElementById('condition-select');
    filters.medicalCondition = select.value || null;
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

function updateFilterUI() {
    // Update test result buttons
    document.querySelectorAll('.filter-chip').forEach(btn => {
        const btnText = btn.textContent.trim();
        btn.classList.remove('active');
        if (filters.testResult === btnText || filters.ageGroup === btnText) {
            btn.classList.add('active');
        }
    });

    // Update condition select
    const conditionSelect = document.getElementById('condition-select');
    if (conditionSelect) {
        conditionSelect.value = filters.medicalCondition || '';
    }
    
    // Update hospital select
    const hospitalSelect = document.getElementById('hospital-select');
    if (hospitalSelect) {
        hospitalSelect.value = filters.hospital || '';
    }
    
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
    }
}

