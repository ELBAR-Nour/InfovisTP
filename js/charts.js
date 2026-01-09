// ===== Enhanced Charts.js with Full Interactivity =====

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

    // Gradient
    const gradient = svg.append('defs')
        .append('linearGradient')
        .attr('id', 'billing-gradient')
        .attr('x1', '0%').attr('y1', '100%')
        .attr('x2', '0%').attr('y2', '0%');

    gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#0ea5e9')
        .attr('stop-opacity', 0.8);

    gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#14b8a6')
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
        .attr('fill', 'url(#billing-gradient)')
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

    // Male bars
    svg.selectAll('.male-bar')
        .data(pyramidData)
        .enter()
        .append('rect')
        .attr('x', d => xMale(d.male))
        .attr('y', d => y(d.ageGroup))
        .attr('width', d => Math.max(0, width / 2 - xMale(d.male) - 25))
        .attr('height', y.bandwidth())
        .attr('fill', '#0ea5e9')
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

    // Female bars
    svg.selectAll('.female-bar')
        .data(pyramidData)
        .enter()
        .append('rect')
        .attr('x', width / 2 + 25)
        .attr('y', d => y(d.ageGroup))
        .attr('width', d => Math.max(0, xFemale(d.female) - width / 2 - 25))
        .attr('height', y.bandwidth())
        .attr('fill', '#ec4899')
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

// ===== Update All Charts Function =====
function updateCharts() {
    drawDonutChart();
    drawConditionsChart();
    drawBillingChart();
    drawPyramidChart();
}