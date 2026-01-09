function applyFilters() {
    filteredData = allData.filter(r => {
        if (filters.testResult && r.testResults !== filters.testResult) return false;
        if (filters.medicalCondition && r.medicalCondition !== filters.medicalCondition) return false;
        if (filters.ageGroup && r.ageGroup !== filters.ageGroup) return false;
        if (filters.hospital && r.hospital !== filters.hospital) return false;
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
    filters = { testResult: null, medicalCondition: null, ageGroup: null };
    applyFilters();
}

function handleConditionChange() {
    const select = document.getElementById('condition-select');
    filters.medicalCondition = select.value || null;
    applyFilters();
}

function updateFilterUI() {
    // Update test result buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const btnText = btn.textContent.trim();
        if (filters.testResult === btnText) {
            btn.classList.add('active');
        } else if (filters.ageGroup === btnText) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update condition select
    const select = document.getElementById('condition-select');
    if (select) {
        select.value = filters.medicalCondition || '';
    }

    // Update filter badges display
    const hasFilters = Object.values(filters).some(v => v !== null);
    const filtersDisplay = document.getElementById('filters-display');
    if (filtersDisplay) {
        filtersDisplay.style.display = hasFilters ? 'block' : 'none';
    }

    const badgesContainer = document.getElementById('filter-badges');
    if (badgesContainer) {
        badgesContainer.innerHTML = '';
        if (filters.testResult) {
            badgesContainer.innerHTML += `
                <span class="filter-badge">
                    Test Result: ${filters.testResult}
                    <button onclick="setFilter('testResult', '${filters.testResult}')">×</button>
                </span>
            `;
        }
        if (filters.medicalCondition) {
            badgesContainer.innerHTML += `
                <span class="filter-badge">
                    Condition: ${filters.medicalCondition}
                    <button onclick="setFilter('medicalCondition', '${filters.medicalCondition}')">×</button>
                </span>
            `;
        }
        if (filters.ageGroup) {
            badgesContainer.innerHTML += `
                <span class="filter-badge">
                    Age: ${filters.ageGroup}
                    <button onclick="setFilter('ageGroup', '${filters.ageGroup}')">×</button>
                </span>
            `;
        }
        if (filters.hospital) {
            badgesContainer.innerHTML += `
                <span class="filter-badge">
                    Hospital: ${filters.hospital}
                    <button onclick="setFilter('hospital', '${filters.hospital}')">×</button>
                </span>
            `;
        }
    }
}

