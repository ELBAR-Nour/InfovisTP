// ===== Enhanced Charts.js with Full Interactivity =====

// Helper function to get current color scheme
function getCurrentColorScheme() {
    if (typeof window.currentColorScheme !== 'undefined') {
        return window.currentColorScheme;
    }
    if (typeof getColorScheme === 'function') {
        return getColorScheme();
    }
    // Fallback to default colors
    return {
        Normal: '#22c55e',
        Abnormal: '#ef4444',
        Inconclusive: '#f59e0b',
        male: '#0ea5e9',
        female: '#ec4899'
    };
}

// ===== 1️⃣ Donut Chart: Test Results Distribution =====
function drawDonutChart() {
    const container = document.getElementById('donut-chart');
    container.innerHTML = '';

    const width = 280;
    const height = 280;
    const radius = Math.min(width, height) / 2 - 20;

    const svg = d3.select('#donut-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const resultCounts = d3.rollup(filteredData, v => v.length, d => d.testResults);
    const pieData = Array.from(resultCounts, ([key, value]) => ({ key, value }));

    if (pieData.length === 0) {
        svg.append('text')
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', '#999')
            .text('No data');
        return;
    }

    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius);
    const hoverArc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius + 8);

    const arcs = svg.selectAll('.arc')
        .data(pie(pieData))
        .enter()
        .append('g')
        .attr('class', 'arc');

    arcs.append('path')
        .attr('d', arc)
        .attr('fill', d => COLORS[d.data.key])
        .attr('stroke', '#fff')
        .attr('stroke-width', 3)
        .attr('opacity', d => (!filters.testResult || d.data.key === filters.testResult) ? 1 : 0.3)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            if (!filters.testResult || d.data.key === filters.testResult) {
                d3.select(this).transition().duration(200).attr('d', hoverArc);
            }
            const pct = ((d.data.value / filteredData.length) * 100).toFixed(1);
            showTooltip(event, `${d.data.key}: ${d.data.value.toLocaleString()} (${pct}%)`);
        })
        .on('mouseout', function() {
            d3.select(this).transition().duration(200).attr('d', arc);
            hideTooltip();
        })
        .on('click', (event, d) => setFilter('testResult', d.data.key));

    // Center text
    const total = d3.sum(pieData, d => d.value);
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.2em')
        .style('font-size', '2rem')
        .style('font-weight', '700')
        .style('fill', 'var(--text-primary)')
        .text(total.toLocaleString());

    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.5em')
        .style('font-size', '0.875rem')
        .style('fill', 'var(--text-secondary)')
        .text('Total Tests');

    // Update legend
    const legend = document.getElementById('donut-legend');
    legend.innerHTML = ['Normal', 'Abnormal', 'Inconclusive'].map(result => `
        <div class="legend-item ${filters.testResult === result ? 'selected' : ''}" 
             onclick="setFilter('testResult', '${result}')">
            <span class="legend-dot" style="background: ${COLORS[result]};"></span>
            ${result}
        </div>
    `).join('');
}

// ===== 2️⃣ Grouped Bar Chart: Conditions vs Test Results =====
function drawConditionsChart() {
    const container = document.getElementById('conditions-chart');
    container.innerHTML = '';

    const margin = { top: 20, right: 20, bottom: 60, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 260 - margin.top - margin.bottom;

    const svg = d3.select('#conditions-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Group data
    const conditions = [...new Set(allData.map(d => d.medicalCondition))];
    const testResults = ['Normal', 'Abnormal', 'Inconclusive'];

    const groupedData = conditions.map(condition => {
        const conditionData = filteredData.filter(d => d.medicalCondition === condition);
        return {
            condition,
            Normal: conditionData.filter(d => d.testResults === 'Normal').length,
            Abnormal: conditionData.filter(d => d.testResults === 'Abnormal').length,
            Inconclusive: conditionData.filter(d => d.testResults === 'Inconclusive').length,
            total: conditionData.length
        };
    }).sort((a, b) => b.total - a.total);

    const x0 = d3.scaleBand()
        .domain(groupedData.map(d => d.condition))
        .range([0, width])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain(testResults)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const maxValue = d3.max(groupedData, d => Math.max(d.Normal, d.Abnormal, d.Inconclusive)) || 0;
    const y = d3.scaleLinear()
        .domain([0, maxValue])
        .nice()
        .range([height, 0]);

    // Grid
    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''));

    // X axis
    svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x0))
        .selectAll('text')
        .attr('transform', 'rotate(-25)')
        .style('text-anchor', 'end');

    // Y axis
    svg.append('g').call(d3.axisLeft(y).ticks(5));

    // Bars
    const conditionGroups = svg.selectAll('.condition-group')
        .data(groupedData)
        .enter()
        .append('g')
        .attr('transform', d => `translate(${x0(d.condition)}, 0)`);

    conditionGroups.selectAll('rect')
        .data(d => testResults.map(result => ({ 
            result, 
            value: d[result], 
            condition: d.condition 
        })))
        .enter()
        .append('rect')
        .attr('x', d => x1(d.result))
        .attr('y', d => y(d.value))
        .attr('width', x1.bandwidth())
        .attr('height', d => height - y(d.value))
        .attr('fill', d => COLORS[d.result])
        .attr('rx', 2)
        .attr('opacity', d => (!filters.medicalCondition || d.condition === filters.medicalCondition) ? 0.9 : 0.2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1);
            showTooltip(event, `${d.condition} - ${d.result}: ${d.value}`);
        })
        .on('mouseout', function(event, d) {
            d3.select(this).attr('opacity', (!filters.medicalCondition || d.condition === filters.medicalCondition) ? 0.9 : 0.2);
            hideTooltip();
        })
        .on('click', (event, d) => setFilter('medicalCondition', d.condition));
}

// ===== 3️⃣ Billing Histogram =====
function drawBillingChart() {
    const container = document.getElementById('billing-chart');
    container.innerHTML = '';

    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 260 - margin.top - margin.bottom;

    const svg = d3.select('#billing-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    // Gradient - use colors from color scheme
    const scheme = getCurrentColorScheme();
    // Use unique ID to avoid conflicts when redrawing
    const gradientId = 'billing-gradient-' + Date.now();
    const gradient = svg.append('defs')
        .append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', '0%').attr('y1', '100%')
        .attr('x2', '0%').attr('y2', '0%');

    gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', scheme.male || '#0ea5e9')
        .attr('stop-opacity', 0.8);

    gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', scheme.female || '#ec4899')
        .attr('stop-opacity', 0.9);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const billingAmounts = filteredData.map(d => d.billingAmount);
    const x = d3.scaleLinear()
        .domain([0, d3.max(billingAmounts) || 50000])
        .range([0, width]);

    const histogram = d3.bin()
        .value(d => d)
        .domain(x.domain())
        .thresholds(x.ticks(20));

    const bins = histogram(billingAmounts);

    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length) || 0])
        .nice()
        .range([height, 0]);

    // Grid
    g.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''));

    // Bars
    g.selectAll('rect')
        .data(bins)
        .enter()
        .append('rect')
        .attr('x', d => x(d.x0) + 1)
        .attr('y', d => y(d.length))
        .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 2))
        .attr('height', d => height - y(d.length))
        .attr('fill', `url(#${gradientId})`)
        .attr('rx', 2)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.8);
            showTooltip(event, `$${Math.round(d.x0).toLocaleString()} - $${Math.round(d.x1).toLocaleString()}: ${d.length} patients`);
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            hideTooltip();
        });

    // X axis
    g.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickFormat(d => `$${(d / 1000).toFixed(0)}k`));

    g.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', 'var(--text-secondary)')
        .text('Billing Amount');

    // Y axis
    g.append('g').call(d3.axisLeft(y).ticks(5));

    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -45)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', 'var(--text-secondary)')
        .text('Frequency');
}

// ===== 4️⃣ Age Pyramid =====
function drawPyramidChart() {
    const container = document.getElementById('pyramid-chart');
    container.innerHTML = '';

    const margin = { top: 20, right: 60, bottom: 30, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 260 - margin.top - margin.bottom;

    const svg = d3.select('#pyramid-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Process data
    const pyramidData = AGE_GROUPS.map(group => {
        const groupData = filteredData.filter(d => d.ageGroup === group);
        return {
            ageGroup: group,
            male: groupData.filter(d => d.gender === 'Male').length,
            female: groupData.filter(d => d.gender === 'Female').length
        };
    });

    const maxCount = d3.max(pyramidData, d => Math.max(d.male, d.female)) || 0;

    const y = d3.scaleBand()
        .domain(AGE_GROUPS)
        .range([0, height])
        .padding(0.2);

    const xMale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([width / 2, 0]);

    const xFemale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([width / 2, width]);

    // Center axis
    svg.append('line')
        .attr('x1', width / 2)
        .attr('y1', 0)
        .attr('x2', width / 2)
        .attr('y2', height)
        .attr('stroke', 'var(--border-color)')
        .attr('stroke-width', 2);

    // Age labels
    svg.selectAll('.age-label')
        .data(pyramidData)
        .enter()
        .append('text')
        .attr('x', width / 2)
        .attr('y', d => y(d.ageGroup) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('fill', 'var(--text-primary)')
        .text(d => d.ageGroup);

    // Male bars - use color from scheme
    const scheme = getCurrentColorScheme();
    svg.selectAll('.male-bar')
        .data(pyramidData)
        .enter()
        .append('rect')
        .attr('x', d => xMale(d.male))
        .attr('y', d => y(d.ageGroup))
        .attr('width', d => Math.max(0, width / 2 - xMale(d.male) - 25))
        .attr('height', y.bandwidth())
        .attr('fill', scheme.male || COLORS.male || '#0ea5e9')
        .attr('rx', 4)
        .attr('opacity', d => (!filters.ageGroup || d.ageGroup === filters.ageGroup) ? 0.85 : 0.2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1);
            showTooltip(event, `${d.ageGroup} Male: ${d.male}`);
        })
        .on('mouseout', function(event, d) {
            d3.select(this).attr('opacity', (!filters.ageGroup || d.ageGroup === filters.ageGroup) ? 0.85 : 0.2);
            hideTooltip();
        })
        .on('click', (event, d) => setFilter('ageGroup', d.ageGroup));

    // Female bars - use color from scheme
    svg.selectAll('.female-bar')
        .data(pyramidData)
        .enter()
        .append('rect')
        .attr('x', width / 2 + 25)
        .attr('y', d => y(d.ageGroup))
        .attr('width', d => Math.max(0, xFemale(d.female) - width / 2 - 25))
        .attr('height', y.bandwidth())
        .attr('fill', scheme.female || COLORS.female || '#ec4899')
        .attr('rx', 4)
        .attr('opacity', d => (!filters.ageGroup || d.ageGroup === filters.ageGroup) ? 0.85 : 0.2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1);
            showTooltip(event, `${d.ageGroup} Female: ${d.female}`);
        })
        .on('mouseout', function(event, d) {
            d3.select(this).attr('opacity', (!filters.ageGroup || d.ageGroup === filters.ageGroup) ? 0.85 : 0.2);
            hideTooltip();
        })
        .on('click', (event, d) => setFilter('ageGroup', d.ageGroup));

    // Count labels
    svg.selectAll('.male-count')
        .data(pyramidData)
        .enter()
        .append('text')
        .attr('x', d => xMale(d.male) - 5)
        .attr('y', d => y(d.ageGroup) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .style('font-size', '11px')
        .style('fill', 'var(--text-secondary)')
        .text(d => d.male.toLocaleString());

    svg.selectAll('.female-count')
        .data(pyramidData)
        .enter()
        .append('text')
        .attr('x', d => xFemale(d.female) + 5)
        .attr('y', d => y(d.ageGroup) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .style('font-size', '11px')
        .style('fill', 'var(--text-secondary)')
        .text(d => d.female.toLocaleString());
}


// ===== 5️⃣ Length of Stay vs Admission Type & Age Interval =====
function drawStayByAdmissionChart() {
    const container = document.getElementById('stay-admission-chart');
    container.innerHTML = '';

    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 260 - margin.top - margin.bottom;

    const svg = d3.select('#stay-admission-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Unique categories
    const admissionTypes = [...new Set(filteredData.map(d => d.admissionType))];
    const ageGroups = AGE_GROUPS;

    // Aggregate data: average LOS per admissionType & ageGroup
    const groupedData = admissionTypes.map(type => {
        const typeData = filteredData.filter(d => d.admissionType === type);
        const averages = {};
        ageGroups.forEach(age => {
            const ageData = typeData.filter(d => d.ageGroup === age);
            averages[age] = ageData.length > 0
                ? d3.mean(ageData, d => d.lengthOfStay)
                : 0;
        });
        return { admissionType: type, ...averages };
    });

    const x0 = d3.scaleBand()
        .domain(admissionTypes)
        .range([0, width])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain(ageGroups)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const yMax = d3.max(groupedData, d => d3.max(ageGroups, age => d[age])) || 0;
    const y = d3.scaleLinear()
        .domain([0, yMax])
        .nice()
        .range([height, 0]);

    // Use colors from color scheme for age groups
    const scheme = getCurrentColorScheme();
    // Create a color scale that adapts to vision type
    const ageGroupColors = ageGroups.map((age, i) => {
        // Use scheme colors if available, otherwise fallback to distinct colors
        if (i === 0) return scheme.male || '#0ea5e9';
        if (i === 1) return scheme.female || '#ec4899';
        if (i === 2) return scheme.Inconclusive || '#f59e0b';
        return scheme.Abnormal || '#ef4444';
    });
    const colorScale = d3.scaleOrdinal()
        .domain(ageGroups)
        .range(ageGroupColors);

    // Grid
    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''));

    // X axis
    svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x0))
        .selectAll('text')
        .attr('transform', 'rotate(-25)')
        .style('text-anchor', 'end');

    // Y axis
    svg.append('g').call(d3.axisLeft(y).ticks(5));

    // Bars
    const typeGroups = svg.selectAll('.type-group')
        .data(groupedData)
        .enter()
        .append('g')
        .attr('transform', d => `translate(${x0(d.admissionType)},0)`);

    typeGroups.selectAll('rect')
        .data(d => ageGroups.map(age => ({ age, value: d[age], admissionType: d.admissionType })))
        .enter()
        .append('rect')
        .attr('x', d => x1(d.age))
        .attr('y', d => y(d.value))
        .attr('width', x1.bandwidth())
        .attr('height', d => height - y(d.value))
        .attr('fill', d => colorScale(d.age))
        .attr('rx', 3)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.8);
            showTooltip(event, `${d.admissionType} - ${d.age}: ${d.value.toFixed(1)} days`);
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            hideTooltip();
        })
        .on('click', (event, d) => setFilter('ageGroup', d.age));

    // Legend
    const legend = document.getElementById('stay-admission-legend');
    legend.innerHTML = ageGroups.map(age => `
        <div class="legend-item" onclick="setFilter('ageGroup','${age}')">
            <span class="legend-dot" style="background:${colorScale(age)}"></span>${age}
        </div>
    `).join('');
}

// ===== 6️⃣ Admission Trends Over Time =====
function drawAdmissionTrendsChart() {
    const container = document.getElementById('admission-trends-chart');
    container.innerHTML = '';

    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 260 - margin.top - margin.bottom;

    const svg = d3.select('#admission-trends-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Aggregate data by week/month
    const parseTime = d3.timeWeek; // aggregate by week; you can use d3.timeMonth for monthly
    const nested = d3.rollup(
        filteredData,
        v => v.length,
        d => parseTime.floor(d.dateOfAdmission)
    );

    const data = Array.from(nested, ([date, count]) => ({ date, count }))
        .sort((a, b) => a.date - b.date);

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count) || 0])
        .nice()
        .range([height, 0]);

    // Grid
    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''));

    // X axis
    svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat("%b %d")));

    // Y axis
    svg.append('g').call(d3.axisLeft(y).ticks(5));

    // Line generator
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.count))
        .curve(d3.curveMonotoneX);

    // Draw line - use color from scheme
    const scheme = getCurrentColorScheme();
    svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', scheme.male || COLORS.male || '#0ea5e9')
        .attr('stroke-width', 2)
        .attr('d', line);

    // Points for tooltip
    svg.selectAll('.point')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => x(d.date))
        .attr('cy', d => y(d.count))
        .attr('r', 4)
        .attr('fill', scheme.male || COLORS.male || '#0ea5e9')
        .style('cursor', 'pointer')
        .on('mouseover', (event, d) => {
            showTooltip(event, `${d3.timeFormat("%b %d, %Y")(d.date)}: ${d.count} admissions`);
        })
        .on('mouseout', hideTooltip);
}

// ===== 7️⃣ Treemap: Gender → Blood Type → Medical Condition =====
function drawTreemapChart() {
    const container = document.getElementById('treemap-chart');
    container.innerHTML = '';

    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 320 - margin.top - margin.bottom;

    const svg = d3.select('#treemap-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    /* =====================================================
       1️⃣ Build hierarchical data
       ===================================================== */
    const hierarchyData = {
        name: 'Patients',
        children: d3.groups(
            filteredData,
            d => d.gender,
            d => d.bloodType,
            d => d.medicalCondition
        ).map(([gender, bloodGroups]) => ({
            name: gender,
            children: bloodGroups.map(([blood, conditions]) => ({
                name: blood,
                children: conditions.map(([condition, records]) => ({
                    name: condition,
                    value: records.length
                }))
            }))
        }))
    };

    const root = d3.hierarchy(hierarchyData)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    d3.treemap()
        .size([width, height])
        .paddingInner(2)
        .paddingOuter(2)
        (root);

    /* =====================================================
       2️⃣ Color scale (by gender)
       ===================================================== */
    const scheme = getCurrentColorScheme();
    const genderColor = d3.scaleOrdinal()
        .domain(['Male', 'Female'])
        .range([
            scheme.male || '#0ea5e9',
            scheme.female || '#ec4899'
        ]);

    /* =====================================================
       3️⃣ Draw leaf nodes (medical condition level)
       ===================================================== */
    const nodes = svg.selectAll('g')
        .data(root.leaves())
        .enter()
        .append('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

    nodes.append('rect')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => genderColor(d.ancestors()[2]?.data.name))
        .attr('rx', 4)
        .attr('opacity', 0.85)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1);
            showTooltip(
                event,
                `
                <strong>${d.data.name}</strong><br/>
                Gender: ${d.ancestors()[2].data.name}<br/>
                Blood Type: ${d.ancestors()[1].data.name}<br/>
                Patients: ${d.value}
                `
            );
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 0.85);
            hideTooltip();
        })
        .on('click', (event, d) => {
            setFilter('gender', d.ancestors()[2].data.name);
            setFilter('bloodType', d.ancestors()[1].data.name);
            setFilter('medicalCondition', d.data.name);
        });

    /* =====================================================
       4️⃣ Labels (only if space allows)
       ===================================================== */
    nodes.append('text')
        .attr('x', 6)
        .attr('y', 14)
        .style('font-size', '11px')
        .style('fill', '#fff')
        .style('pointer-events', 'none')
        .text(d => {
            const w = d.x1 - d.x0;
            return w > 70 ? d.data.name : '';
        });

    /* =====================================================
       5️⃣ Legend (Gender)
       ===================================================== */
    const legend = document.getElementById('treemap-legend');
    legend.innerHTML = ['Male', 'Female'].map(g => `
        <div class="legend-item" onclick="setFilter('gender','${g}')">
            <span class="legend-dot" style="background:${genderColor(g)}"></span>
            ${g}
        </div>
    `).join('');
}


// ===== 8️⃣ Billing by Year (Total with Min/Max Labels) =====
function drawBillingByYearStackedChart() {

    const container = d3.select('#billing-year-chart');
    container.selectAll('*').remove();

    if (!filters.hospital) {
        container.append('div')
            .attr('class', 'chart-placeholder')
            .style('padding', '36px')
            .style('text-align', 'center')
            .style('color', 'var(--text-secondary)')
            .html('Select a hospital in the sidebar to view billing by year.');
        return;
    }

    const margin = { top: 30, right: 30, bottom: 40, left: 70 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const selectedHospital = filters.hospital;

    // ---- DATA: per-record min/max billing per year for the selected hospital ----
    // Use filteredData so other active filters are respected
    const years = [...new Set(filteredData
        .filter(d => d.hospital === selectedHospital && d.dateOfAdmission)
        .map(d => d.dateOfAdmission.getFullYear())
    )].sort((a, b) => a - b);

    const dataByYear = years.map(year => {
        const vals = filteredData
            .filter(d => d.hospital === selectedHospital && d.dateOfAdmission && d.dateOfAdmission.getFullYear() === year)
            .map(d => +d.billingAmount)
            .filter(v => !isNaN(v));

        if (vals.length === 0) return null;
        const min = d3.min(vals);
        const max = d3.max(vals);
        return {
            year,
            min,
            max,
            range: Math.max(0, max - min),
            count: vals.length
        };
    }).filter(Boolean);

    if (!dataByYear.length) {
        container.append('div')
            .attr('class', 'chart-placeholder')
            .style('padding', '36px')
            .style('text-align', 'center')
            .style('color', 'var(--text-secondary)')
            .html('No billing records for this hospital with the current filters.');
        return;
    }

    // Overall min/max across individual records (used for labels)
    const overallMin = d3.min(dataByYear, d => d.min);
    const overallMax = d3.max(dataByYear, d => d.max);

    // ---- SCALES ----
    const x = d3.scaleBand()
        .domain(dataByYear.map(d => d.year))
        .range([0, width])
        .padding(0.25);

    const y = d3.scaleLinear()
        .domain([0, (overallMax || 0) * 1.1])
        .nice()
        .range([height, 0]);

    // ---- GRID ----
    svg.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''));

    // ---- AXES ----
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append('g')
        .call(d3.axisLeft(y).tickFormat(d => `${(d / 1000).toFixed(0)}k`));

    // ---- BARS: stacked per-year min + (max-min) ----
    const barGroup = svg.selectAll('.year-group')
        .data(dataByYear)
        .enter()
        .append('g')
        .attr('class', 'year-group')
        .attr('transform', d => `translate(${x(d.year)},0)`);

    const scheme = getCurrentColorScheme();
    const barMinColor = scheme.Normal;        // e.g., Normal patients color
    const barRangeColor = scheme.Abnormal;    // e.g., Abnormal color
        

    // bottom segment: min (from 0 to min)
    barGroup.append('rect')
        .attr('class', 'bar-min')
        .attr('x', 0)
        .attr('y', d => y(d.min))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.min))
        .attr('fill', barMinColor)
        .attr('rx', 4)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.9);
            showTooltip(event, `
                <strong>${selectedHospital}</strong><br/>
                Year: ${d.year}<br/>
                Min Billing: $${(d.min || 0).toLocaleString()}<br/>
                Records: ${d.count}
            `);
        })
        .on('mouseout', function() { d3.select(this).attr('opacity', 1); hideTooltip(); });

    // top segment: range (max - min)
    barGroup.append('rect')
        .attr('class', 'bar-range')
        .attr('x', 0)
        .attr('y', d => y(d.max))
        .attr('width', x.bandwidth())
        .attr('fill', barRangeColor)  
        .attr('height', d => y(d.min) - y(d.max))
        .attr('rx', 4)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.9);
            showTooltip(event, `
                <strong>${selectedHospital}</strong><br/>
                Year: ${d.year}<br/>
                Max Billing: $${(d.max || 0).toLocaleString()}<br/>
                Range: $${(d.range || 0).toLocaleString()}
            `);
        })
        .on('mouseout', function() { d3.select(this).attr('opacity', 1); hideTooltip(); });
        
    // ---- MIN / MAX LABELS (overall across years) ----
    svg.append('text')
        .attr('x', width)
        .attr('y', y(overallMax) - 8)
        .attr('text-anchor', 'end')
        .attr('font-size', '11px')
        .attr('fill', 'var(--text-secondary)')
        .text(`Max: $${(overallMax || 0).toLocaleString()}`);

    svg.append('text')
        .attr('x', width)
        .attr('y', y(overallMin) + 14)
        .attr('text-anchor', 'end')
        .attr('font-size', '11px')
        .attr('fill', 'var(--text-secondary)')
        .text(`Min: $${(overallMin || 0).toLocaleString()}`);
}


// ===== Arc Diagram: Diseases to Medications =====
function drawArcDiagram() {
    const container = d3.select('#arc-diagram-chart');
    if (container.empty()) return;
    
    container.selectAll('*').remove();
    
    if (!filteredData || filteredData.length === 0) return;
    
    const margin = { top: 60, right: 100, bottom: 60, left: 100 };
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right || 800;
    const height = 600 - margin.top - margin.bottom;
    
    // Calculate frequencies and relationships
    const diseaseFreq = d3.rollup(filteredData, v => v.length, d => d.medicalCondition);
    const medicationFreq = d3.rollup(filteredData, v => v.length, d => d.medication);
    
    // Get unique diseases and medications, sorted by frequency
    const diseases = Array.from(diseaseFreq.entries())
        .filter(([d]) => d !== 'Unknown' && d.trim() !== '')
        .sort((a, b) => b[1] - a[1])
        .map(([d]) => d);
    
    const medications = Array.from(medicationFreq.entries())
        .filter(([m]) => m !== 'None' && m !== 'Unknown' && m.trim() !== '')
        .sort((a, b) => b[1] - a[1])
        .map(([m]) => m);
    
    // Build relationships matrix: disease -> medication -> count
    const relationships = [];
    filteredData.forEach(d => {
        if (d.medicalCondition && d.medication && 
            d.medicalCondition !== 'Unknown' && d.medication !== 'None' && 
            d.medication !== 'Unknown' && diseases.includes(d.medicalCondition) && 
            medications.includes(d.medication)) {
            relationships.push({
                disease: d.medicalCondition,
                medication: d.medication
            });
        }
    });
    
    const relationshipCounts = d3.rollup(relationships, 
        v => v.length, 
        d => d.disease, 
        d => d.medication
    );
    
    // Limit to top N diseases and medications for readability
    const maxItems = 15;
    const topDiseases = diseases.slice(0, maxItems);
    const topMedications = medications.slice(0, maxItems);
    
    if (topDiseases.length === 0 || topMedications.length === 0) {
        container.append('p')
            .style('text-align', 'center')
            .style('padding', '40px')
            .style('color', 'var(--text-secondary)')
            .text('No disease-medication relationships found in the filtered data.');
        return;
    }
    
    // Axes positions
    const leftAxisX = 80;
    const rightAxisX = width - 80;
    const axisHeight = height - 40;
    
    // Scales for positioning nodes along axes
    const diseaseScale = d3.scalePoint()
        .domain(topDiseases)
        .range([20, axisHeight])
        .padding(0.5);
    
    const medicationScale = d3.scalePoint()
        .domain(topMedications)
        .range([20, axisHeight])
        .padding(0.5);
    
    // Scales for node sizes (based on frequency)
    const maxDiseaseFreq = d3.max(topDiseases.map(d => diseaseFreq.get(d))) || 1;
    const maxMedicationFreq = d3.max(topMedications.map(m => medicationFreq.get(m))) || 1;
    
    const diseaseSizeScale = d3.scaleSqrt()
        .domain([0, maxDiseaseFreq])
        .range([4, 20]);
    
    const medicationSizeScale = d3.scaleSqrt()
        .domain([0, maxMedicationFreq])
        .range([4, 20]);
    
    // Color scales
    const diseaseColorScale = d3.scaleOrdinal(d3.schemeCategory10);
    const medicationColorScale = d3.scaleOrdinal(d3.schemeSet2);
    
    // Prepare links data
    const links = [];
    topDiseases.forEach(disease => {
        topMedications.forEach(medication => {
            const count = relationshipCounts.get(disease)?.get(medication) || 0;
            if (count > 0) {
                links.push({
                    source: { 
                        name: disease, 
                        x: leftAxisX, 
                        y: diseaseScale(disease),
                        type: 'disease'
                    },
                    target: { 
                        name: medication, 
                        x: rightAxisX, 
                        y: medicationScale(medication),
                        type: 'medication'
                    },
                    value: count
                });
            }
        });
    });
    
    // Check if we have any links before creating SVG
    if (links.length === 0) {
        container.append('p')
            .style('text-align', 'center')
            .style('padding', '40px')
            .style('color', 'var(--text-secondary)')
            .text('No disease-medication relationships found in the filtered data.');
        return;
    }
    
    // Create SVG
    const svg = container
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scale for link opacity/stroke width
    const maxLinkValue = d3.max(links, d => d.value) || 1;
    const linkScale = d3.scaleLinear()
        .domain([0, maxLinkValue])
        .range([0.1, 1]);
    
    const linkWidthScale = d3.scaleLinear()
        .domain([0, maxLinkValue])
        .range([0.5, 4]);
    
    // Draw arcs (links)
    const arcPath = d3.line()
        .curve(d3.curveBasis);
    
    links.forEach(link => {
        const source = link.source;
        const target = link.target;
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        
        // Control points for smooth arc
        const cp1x = source.x + (midX - source.x) * 0.5;
        const cp1y = source.y;
        const cp2x = target.x - (target.x - midX) * 0.5;
        const cp2y = target.y;
        
        const path = `M ${source.x} ${source.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${target.x} ${target.y}`;
        
        g.append('path')
            .attr('d', path)
            .attr('fill', 'none')
            .attr('stroke', diseaseColorScale(source.name))
            .attr('stroke-width', linkWidthScale(link.value))
            .attr('opacity', linkScale(link.value))
            .style('cursor', 'pointer')
            .on('mouseover', function(event) {
                d3.select(this)
                    .attr('opacity', 1)
                    .attr('stroke-width', linkWidthScale(link.value) + 2);
                showTooltip(event, 
                    `${source.name} → ${target.name}<br/>Count: ${link.value}`
                );
            })
            .on('mouseout', function() {
                d3.select(this)
                    .attr('opacity', linkScale(link.value))
                    .attr('stroke-width', linkWidthScale(link.value));
                hideTooltip();
            })
            .on('click', function() {
                setFilter('medicalCondition', source.name);
            });
    });
    
    // Draw disease nodes (left axis)
    const diseaseNodes = g.append('g').selectAll('.disease-node')
        .data(topDiseases)
        .enter()
        .append('g')
        .attr('class', 'disease-node')
        .attr('transform', d => `translate(${leftAxisX},${diseaseScale(d)})`)
        .style('cursor', 'pointer');
    
    diseaseNodes.append('circle')
        .attr('r', d => diseaseSizeScale(diseaseFreq.get(d)))
        .attr('fill', d => diseaseColorScale(d))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('stroke-width', 3);
            showTooltip(event, `${d}<br/>Frequency: ${diseaseFreq.get(d)}`);
        })
        .on('mouseout', function() {
            d3.select(this).attr('stroke-width', 2);
            hideTooltip();
        })
        .on('click', function(event, d) {
            setFilter('medicalCondition', d);
        });
    
    diseaseNodes.append('text')
        .attr('x', -25)
        .attr('y', 4)
        .attr('text-anchor', 'end')
        .attr('font-size', '11px')
        .attr('fill', 'var(--text-primary)')
        .text(d => d.length > 20 ? d.substring(0, 17) + '...' : d)
        .on('mouseover', function(event, d) {
            showTooltip(event, `${d}<br/>Frequency: ${diseaseFreq.get(d)}`);
        })
        .on('mouseout', hideTooltip)
        .on('click', function(event, d) {
            setFilter('medicalCondition', d);
        });
    
    // Draw medication nodes (right axis)
    const medicationNodes = g.append('g').selectAll('.medication-node')
        .data(topMedications)
        .enter()
        .append('g')
        .attr('class', 'medication-node')
        .attr('transform', d => `translate(${rightAxisX},${medicationScale(d)})`)
        .style('cursor', 'pointer');
    
    medicationNodes.append('circle')
        .attr('r', d => medicationSizeScale(medicationFreq.get(d)))
        .attr('fill', d => medicationColorScale(d))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('stroke-width', 3);
            showTooltip(event, `${d}<br/>Frequency: ${medicationFreq.get(d)}`);
        })
        .on('mouseout', function() {
            d3.select(this).attr('stroke-width', 2);
            hideTooltip();
        });
    
    medicationNodes.append('text')
        .attr('x', 25)
        .attr('y', 4)
        .attr('text-anchor', 'start')
        .attr('font-size', '11px')
        .attr('fill', 'var(--text-primary)')
        .text(d => d.length > 20 ? d.substring(0, 17) + '...' : d)
        .on('mouseover', function(event, d) {
            showTooltip(event, `${d}<br/>Frequency: ${medicationFreq.get(d)}`);
        })
        .on('mouseout', hideTooltip);
    
    // Axis labels
    g.append('text')
        .attr('x', leftAxisX)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('fill', 'var(--text-primary)')
        .text('Diseases');
    
    g.append('text')
        .attr('x', rightAxisX)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('fill', 'var(--text-primary)')
        .text('Medications');
    
    // Legend
    const legend = g.append('g')
        .attr('transform', `translate(${width / 2}, ${height + 30})`);
    
    legend.append('text')
        .attr('font-size', '12px')
        .attr('fill', 'var(--text-secondary)')
        .text('Circle size represents frequency. Arc thickness represents relationship strength.');
}

// ===== Horizontal Bar Chart: Average Cost per Insurance Provider =====
function drawInsuranceCostChart() {
    const container = document.getElementById('insurance-cost-chart');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!filteredData || filteredData.length === 0) return;
    
    const margin = { top: 20, right: 80, bottom: 40, left: 200 };
    const width = container.clientWidth - margin.left - margin.right || 800;
    const height = 400 - margin.top - margin.bottom;
    
    // Calculate average cost per insurance provider
    const insuranceData = d3.rollup(
        filteredData,
        v => {
            const avgCost = d3.mean(v, d => d.billingAmount);
            const count = v.length;
            const totalCost = d3.sum(v, d => d.billingAmount);
            return { avgCost, count, totalCost };
        },
        d => d.insuranceProvider
    );
    
    // Convert to array and filter out 'Unknown', then sort by average cost
    const data = Array.from(insuranceData.entries())
        .filter(([provider]) => provider !== 'Unknown' && provider.trim() !== '')
        .map(([provider, stats]) => ({
            provider,
            avgCost: stats.avgCost || 0,
            count: stats.count,
            totalCost: stats.totalCost
        }))
        .sort((a, b) => b.avgCost - a.avgCost); // Sort descending by average cost
    
    if (data.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">No insurance provider data available.</p>';
        return;
    }
    
    // Create SVG
    const svg = d3.select('#insurance-cost-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.avgCost) || 50000])
        .nice()
        .range([0, width]);
    
    const y = d3.scaleBand()
        .domain(data.map(d => d.provider))
        .range([0, height])
        .paddingInner(0.2)
        .paddingOuter(0.1);
    
    // Color scale
    const scheme = getCurrentColorScheme();
    const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d.provider))
        .range(d3.schemeCategory10);
    
    // Grid lines
    g.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x)
            .ticks(8)
            .tickSize(-height)
            .tickFormat('')
        )
        .selectAll('line')
        .attr('stroke', 'var(--border-color)')
        .attr('stroke-opacity', 0.2);
    
    // Bars
    const bars = g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', d => y(d.provider))
        .attr('width', d => x(d.avgCost))
        .attr('height', y.bandwidth())
        .attr('fill', d => colorScale(d.provider))
        .attr('rx', 4)
        .attr('opacity', 0.9)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('opacity', 1)
                .attr('stroke', '#fff')
                .attr('stroke-width', 2);
            showTooltip(event, 
                `<strong>${d.provider}</strong><br/>
                Average Cost: $${d.avgCost.toFixed(2).toLocaleString()}<br/>
                Total Patients: ${d.count.toLocaleString()}<br/>
                Total Cost: $${d.totalCost.toFixed(2).toLocaleString()}`
            );
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('opacity', 0.9)
                .attr('stroke', 'none')
                .attr('stroke-width', 0);
            hideTooltip();
        });
    
    // X axis (top)
    g.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(8))
        .selectAll('text')
        .attr('fill', 'var(--text-secondary)')
        .style('font-size', '11px');
    
    g.append('text')
        .attr('transform', `translate(${width / 2}, ${height + 35})`)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-primary)')
        .attr('font-size', '12px')
        .attr('font-weight', '500')
        .text('Average Billing Amount ($)');
    
    // Y axis (left)
    g.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .attr('fill', 'var(--text-primary)')
        .style('font-size', '11px')
        .style('text-anchor', 'end')
        .call(function(text) {
            text.each(function(d) {
                const text = d3.select(this);
                const tspan = text.text().split(' ').join('\u00A0');
                text.text(null);
                text.append('tspan')
                    .attr('x', -10)
                    .attr('dy', '0.35em')
                    .text(tspan.length > 30 ? tspan.substring(0, 27) + '...' : tspan);
            });
        });
    
    // Value labels on bars
    g.selectAll('.bar-label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'bar-label')
        .attr('x', d => x(d.avgCost) + 5)
        .attr('y', d => y(d.provider) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('fill', 'var(--text-primary)')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .text(d => `$${Math.round(d.avgCost).toLocaleString()}`)
        .style('pointer-events', 'none');
}

// ===== Insurance Provider Performance: Bar + Line Chart =====
function drawInsurancePerformanceChart() {
    const container = document.getElementById('insurance-performance-chart');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!filteredData || filteredData.length === 0) return;
    
    const margin = { top: 40, right: 80, bottom: 80, left: 80 };
    const width = container.clientWidth - margin.left - margin.right || 900;
    const height = 500 - margin.top - margin.bottom;
    
    // Calculate total billed amount and patient count per insurance provider
    const insuranceData = d3.rollup(
        filteredData,
        v => {
            const totalBilled = d3.sum(v, d => d.billingAmount);
            const patientCount = v.length;
            const avgBilled = d3.mean(v, d => d.billingAmount);
            return { totalBilled, patientCount, avgBilled };
        },
        d => d.insuranceProvider
    );
    
    // Convert to array, filter out 'Unknown', and sort by total billed amount
    const data = Array.from(insuranceData.entries())
        .filter(([provider]) => provider !== 'Unknown' && provider.trim() !== '')
        .map(([provider, stats]) => ({
            provider,
            totalBilled: stats.totalBilled || 0,
            patientCount: stats.patientCount || 0,
            avgBilled: stats.avgBilled || 0
        }))
        .sort((a, b) => b.totalBilled - a.totalBilled);
    
    if (data.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">No insurance provider data available.</p>';
        return;
    }
    
    // Create SVG
    const svg = d3.select('#insurance-performance-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // X scale (Insurance providers)
    const x = d3.scaleBand()
        .domain(data.map(d => d.provider))
        .range([0, width])
        .paddingInner(0.2)
        .paddingOuter(0.1);
    
    // Y scale for bars (Total Billed Amount) - left axis
    const maxBilled = d3.max(data, d => d.totalBilled) || 1;
    const yBar = d3.scaleLinear()
        .domain([0, maxBilled * 1.1])
        .nice()
        .range([height, 0]);
    
    // Y scale for line (Patient Count) - right axis
    const maxPatients = d3.max(data, d => d.patientCount) || 1;
    const yLine = d3.scaleLinear()
        .domain([0, maxPatients * 1.1])
        .nice()
        .range([height, 0]);
    
    // Grid lines for bars (left axis)
    g.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickSize(0))
        .call(g => g.selectAll('.domain').remove());
    
    g.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yBar)
            .ticks(6)
            .tickSize(-width)
            .tickFormat('')
        )
        .selectAll('line')
        .attr('stroke', 'var(--border-color)')
        .attr('stroke-opacity', 0.2);
    
    // Draw bars (Total Billed Amount)
    const scheme = getCurrentColorScheme();
    const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d.provider))
        .range(d3.schemeCategory10);
    
    const bars = g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.provider))
        .attr('y', d => yBar(d.totalBilled))
        .attr('width', x.bandwidth())
        .attr('height', d => height - yBar(d.totalBilled))
        .attr('fill', d => colorScale(d.provider))
        .attr('opacity', 0.7)
        .attr('rx', 4)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('opacity', 1)
                .attr('stroke', '#fff')
                .attr('stroke-width', 2);
            showTooltip(event, 
                `<strong>${d.provider}</strong><br/>
                Total Billed: $${d.totalBilled.toFixed(2).toLocaleString()}<br/>
                Patients: ${d.patientCount.toLocaleString()}<br/>
                Avg per Patient: $${d.avgBilled.toFixed(2).toLocaleString()}`
            );
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('opacity', 0.7)
                .attr('stroke', 'none')
                .attr('stroke-width', 0);
            hideTooltip();
        });
    
    // Line generator for patient count
    const line = d3.line()
        .x(d => x(d.provider) + x.bandwidth() / 2)
        .y(d => yLine(d.patientCount))
        .curve(d3.curveMonotoneX);
    
    // Draw line (Patient Count)
    g.append('path')
        .datum(data)
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 3)
        .attr('d', line)
        .style('pointer-events', 'none');
    
    // Draw circles on line
    const linePoints = g.selectAll('.line-point')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'line-point')
        .attr('cx', d => x(d.provider) + x.bandwidth() / 2)
        .attr('cy', d => yLine(d.patientCount))
        .attr('r', 5)
        .attr('fill', '#ef4444')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('r', 7)
                .attr('fill', '#dc2626');
            showTooltip(event, 
                `<strong>${d.provider}</strong><br/>
                Patient Count: ${d.patientCount.toLocaleString()}`
            );
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('r', 5)
                .attr('fill', '#ef4444');
            hideTooltip();
        });
    
    // Left Y axis (Billed Amount)
    g.append('g')
        .call(d3.axisLeft(yBar).ticks(6))
        .selectAll('text')
        .attr('fill', 'var(--text-secondary)')
        .style('font-size', '11px');
    
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-primary)')
        .attr('font-size', '12px')
        .attr('font-weight', '500')
        .text('Total Billed Amount ($)');
    
    // Right Y axis (Patient Count)
    g.append('g')
        .attr('transform', `translate(${width}, 0)`)
        .call(d3.axisRight(yLine).ticks(6))
        .selectAll('text')
        .attr('fill', '#ef4444')
        .style('font-size', '11px')
        .style('font-weight', '500');
    
    g.append('text')
        .attr('transform', 'rotate(90)')
        .attr('x', height / 2)
        .attr('y', width + 60)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ef4444')
        .attr('font-size', '12px')
        .attr('font-weight', '500')
        .text('Total Patients');
    
    // X axis (Insurance Providers)
    g.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('fill', 'var(--text-primary)')
        .style('font-size', '11px')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .call(function(text) {
            text.each(function(d) {
                const text = d3.select(this);
                const tspan = text.text();
                text.text(null);
                text.append('tspan')
                    .attr('x', 0)
                    .attr('dy', '0.35em')
                    .text(tspan.length > 20 ? tspan.substring(0, 17) + '...' : tspan);
            });
        });
    
    // Legend
    const legend = g.append('g')
        .attr('transform', `translate(${width - 200}, 20)`);
    
    // Bar legend
    legend.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', d3.schemeCategory10[0])
        .attr('opacity', 0.7)
        .attr('rx', 2);
    
    legend.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .attr('fill', 'var(--text-primary)')
        .attr('font-size', '11px')
        .text('Total Billed Amount');
    
    // Line legend
    legend.append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('y1', 25)
        .attr('y2', 25)
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 3);
    
    legend.append('circle')
        .attr('cx', 7.5)
        .attr('cy', 25)
        .attr('r', 5)
        .attr('fill', '#ef4444')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);
    
    legend.append('text')
        .attr('x', 20)
        .attr('y', 28)
        .attr('fill', '#ef4444')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .text('Patient Count');
}

// ===== Update All Charts Function =====
function updateCharts() {
    drawDonutChart();
    drawConditionsChart();
    drawBillingChart();
    drawPyramidChart();
    drawStayByAdmissionChart();
    drawAdmissionTrendsChart();
    drawTreemapChart();
    drawBillingByYearStackedChart();
    drawArcDiagram();
    drawInsuranceCostChart();
    drawInsurancePerformanceChart();
    

}

