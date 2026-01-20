function getCurrentColorScheme() {
    if (typeof window.currentColorScheme !== 'undefined') {
        return window.currentColorScheme;
    }
    if (typeof getColorScheme === 'function') {
        return getColorScheme();
    }
    return {
        Normal: '#22c55e',
        Abnormal: '#ef4444',
        Inconclusive: '#f59e0b',
        male: '#0ea5e9',
        female: '#ec4899'
    };
}

// ===== Donut Chart: Test Results Distribution =====
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

// ===== Grouped Bar Chart: Conditions vs Test Results =====
function drawConditionsChart() {
    const container = document.getElementById('conditions-chart');
    container.innerHTML = '';

    const margin = { top: 20, right: 20, bottom: 80, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    
    const height = 350 - margin.top - margin.bottom;

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

    // Get current color scheme
    const scheme = window.currentColorScheme || (typeof getColorScheme === 'function' ? getColorScheme() : COLORS);

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
        .attr('fill', d => scheme[d.result]) 
        .attr('rx', 2)
        .attr('opacity', d => (!filters.medicalCondition || d.condition === filters.medicalCondition) ? 0.9 : 0.2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1);
            showTooltip(event, `<strong>${d.condition}</strong><br/>${d.result}: ${d.value}`);
        })
        .on('mouseout', function(event, d) {
            d3.select(this).attr('opacity', (!filters.medicalCondition || d.condition === filters.medicalCondition) ? 0.9 : 0.2);
            hideTooltip();
        })
        .on('click', (event, d) => setFilter('medicalCondition', d.condition));


    const legendItemWidth = 100; 
    const totalLegendWidth = testResults.length * legendItemWidth;
    const legendStartX = (width - totalLegendWidth) / 2;

    const legendGroup = svg.append('g')
        .attr('transform', `translate(${legendStartX}, ${height + 50})`);

    testResults.forEach((result, i) => {
        const item = legendGroup.append('g')
            .attr('transform', `translate(${i * legendItemWidth}, 0)`)
            .style('cursor', 'pointer');

        item.append('circle')
            .attr('r', 5) 
            .attr('fill', scheme[result]);

        item.append('text')
            .attr('x', 12)
            .attr('y', 4)
            .text(result)
            .style('font-size', '12px') 
            .style('font-weight', '500')
            .style('fill', 'var(--text-secondary)')
            .attr('alignment-baseline', 'middle');
    });
}

// ===== Billing Histogram  =====
function drawBillingChart() {
    const container = document.getElementById('billing-chart');
    if (!container) return; 
    container.innerHTML = '';

    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const svg = d3.select('#billing-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const scheme = window.currentColorScheme || (typeof getColorScheme === 'function' ? getColorScheme() : null);
    
    const barColor = scheme ? (scheme.male || scheme.Normal) : '#0ea5e9';

    if (!filteredData || filteredData.length === 0) {
        g.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .style('fill', 'var(--text-secondary)')
            .text('No data available');
        return;
    }

    // --- Histogram bins ---
    const x = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.billingAmount) || 50000])
        .nice()
        .range([0, width]);

    const histogram = d3.bin()
        .value(d => d.billingAmount)
        .domain(x.domain())
        .thresholds(x.ticks(20));

    const bins = histogram(filteredData);

    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length) || 0])
        .nice()
        .range([height, 0]);

    // --- Grid ---
    g.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''))
        .style('stroke-opacity', 0.1)
        .style('stroke-dasharray', '3,3'); 

    // --- Draw bars ---
    g.selectAll('rect')
        .data(bins)
        .enter()
        .append('rect')
        .attr('x', d => x(d.x0) + 1)
        .attr('y', d => y(d.length))
        .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 2))
        .attr('height', d => height - y(d.length))
        .attr('fill', barColor)
        .attr('rx', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.7); 
            const range = `$${(d.x0/1000).toFixed(1)}k - $${(d.x1/1000).toFixed(1)}k`;
            if (typeof showTooltip === 'function') {
                showTooltip(event, `<strong>${range}</strong><br/>Patients: ${d.length}`);
            }
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            if (typeof hideTooltip === 'function') hideTooltip();
        });

    // --- X Axis ---
    g.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickFormat(d => `$${(d / 1000).toFixed(0)}k`))
        .selectAll("text")
        .style("fill", "var(--text-secondary)");

    g.append('text')
        .attr('x', width / 2)
        .attr('y', height + 35)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', 'var(--text-secondary)')
        .text('Billing Amount');

    // --- Y Axis ---
    g.append('g')
        .call(d3.axisLeft(y).ticks(5))
        .selectAll("text")
        .style("fill", "var(--text-secondary)");

    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -45)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', 'var(--text-secondary)')
        .text('Frequency');
}



// ===== Age Pyramid=====
function drawPyramidChart() {
    const container = document.getElementById('pyramid-chart');
    if (!container) return;
    container.innerHTML = '';

    const margin = { top: 20, right: 60, bottom: 60, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const svg = d3.select('#pyramid-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // ---- COLOR SCHEME ----
    const scheme = window.currentColorScheme || (typeof getColorScheme === 'function' ? getColorScheme() : {});
    const maleColor = scheme.male || '#0ea5e9';
    const femaleColor = scheme.female || '#ec4899';

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
    const centerGap = 25; 

    const y = d3.scaleBand()
        .domain(AGE_GROUPS)
        .range([0, height])
        .padding(0.2);

    const xMale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([width / 2 - centerGap, 0]);

    const xFemale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([width / 2 + centerGap, width]);

    svg.append('line')
        .attr('x1', width / 2)
        .attr('y1', 0)
        .attr('x2', width / 2)
        .attr('y2', height)
        .attr('stroke', 'var(--border-color)')
        .attr('stroke-width', 2);

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

    const minBarWidth = 4;

    svg.selectAll('.male-bar')
        .data(pyramidData)
        .enter()
        .append('rect')
        .attr('x', d => {
            if (d.male === 0) return width / 2 - centerGap; 
            let barW = (width / 2 - centerGap) - xMale(d.male);
            barW = Math.max(barW, minBarWidth);
            return (width / 2 - centerGap) - barW;
        })
        .attr('y', d => y(d.ageGroup))
        .attr('width', d => {
            if (d.male === 0) return 0;
            let barW = (width / 2 - centerGap) - xMale(d.male);
            return Math.max(barW, minBarWidth);
        })
        .attr('height', y.bandwidth())
        .attr('fill', maleColor)
        .attr('rx', 4)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.8);
            if (typeof showTooltip === 'function') 
                showTooltip(event, `<strong>${d.ageGroup}</strong><br/>Male: ${d.male.toLocaleString()}`);
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            if (typeof hideTooltip === 'function') hideTooltip();
        })
        .on('click', (event, d) => setFilter('ageGroup', d.ageGroup));

    svg.selectAll('.female-bar')
        .data(pyramidData)
        .enter()
        .append('rect')
        .attr('x', width / 2 + centerGap)
        .attr('y', d => y(d.ageGroup))
        .attr('width', d => {
            if (d.female === 0) return 0;
            let barW = xFemale(d.female) - (width / 2 + centerGap);
            return Math.max(barW, minBarWidth);
        })
        .attr('height', y.bandwidth())
        .attr('fill', femaleColor)
        .attr('rx', 4)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.8);
            if (typeof showTooltip === 'function') 
                showTooltip(event, `<strong>${d.ageGroup}</strong><br/>Female: ${d.female.toLocaleString()}`);
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            if (typeof hideTooltip === 'function') hideTooltip();
        })
        .on('click', (event, d) => setFilter('ageGroup', d.ageGroup));

    svg.selectAll('.male-count')
        .data(pyramidData)
        .enter()
        .append('text')
        .attr('x', d => {
            let barW = (width / 2 - centerGap) - xMale(d.male);
            barW = Math.max(barW, d.male > 0 ? minBarWidth : 0);
            return (width / 2 - centerGap) - barW - 5;
        })
        .attr('y', d => y(d.ageGroup) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .style('font-size', '11px')
        .style('fill', 'var(--text-secondary)')
        .text(d => d.male ? d.male.toLocaleString() : '');

    // Female Labels
    svg.selectAll('.female-count')
        .data(pyramidData)
        .enter()
        .append('text')
        .attr('x', d => {
            let barW = xFemale(d.female) - (width / 2 + centerGap);
            barW = Math.max(barW, d.female > 0 ? minBarWidth : 0);
            return (width / 2 + centerGap) + barW + 5;
        })
        .attr('y', d => y(d.ageGroup) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .style('font-size', '11px')
        .style('fill', 'var(--text-secondary)')
        .text(d => d.female ? d.female.toLocaleString() : '');

    const legendGroup = svg.append('g')
        .attr('transform', `translate(${width / 2}, ${height + 40})`);

    const maleLegend = legendGroup.append('g')
        .attr('transform', 'translate(-60, 0)')
        .style('cursor', 'pointer')
        .on('click', () => setFilter('gender', 'Male'));
    maleLegend.append('circle').attr('r', 5).attr('fill', maleColor);
    maleLegend.append('text').attr('x', 10).attr('y', 4).text('Male').style('font-size', '12px').style('fill', 'var(--text-secondary)');

    const femaleLegend = legendGroup.append('g')
        .attr('transform', 'translate(10, 0)')
        .style('cursor', 'pointer')
        .on('click', () => setFilter('gender', 'Female'));
    femaleLegend.append('circle').attr('r', 5).attr('fill', femaleColor);
    femaleLegend.append('text').attr('x', 10).attr('y', 4).text('Female').style('font-size', '12px').style('fill', 'var(--text-secondary)');
}

// ===== Length of Stay vs Admission Type & Age Interval =====
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

    const scheme = window.currentColorScheme || (typeof getColorScheme === 'function' ? getColorScheme() : COLORS);

    const ageGroupColors = ageGroups.map((age, i) => {
        return scheme.categorical[i % scheme.categorical.length];
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
            showTooltip(event, `<strong>${d.admissionType}</strong><br/>${d.age}: ${d.value.toFixed(1)} days`);
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            hideTooltip();
        })
        .on('click', (event, d) => setFilter('ageGroup', d.age));

    // Legend
    const legend = document.getElementById('stay-admission-legend');
    if (legend) {
        legend.innerHTML = ageGroups.map(age => `
            <div class="legend-item" onclick="setFilter('ageGroup','${age}')" style="cursor: pointer; display: inline-flex; align-items: center; margin-right: 15px;">
                <span class="legend-dot" style="background:${colorScale(age)}; width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 5px;"></span>
                <span style="font-size: 12px; color: var(--text-primary);">${age}</span>
            </div>
        `).join('');
    }
}


function drawAdmissionTrendsChart() {
    const container = document.getElementById('admission-trends-chart');
    if (!container) return;
    container.innerHTML = '';

    // --- Dimensions ---
    const margin = { top: 30, right: 80, bottom: 40, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);


    const comparisonData = allData.filter(r => {
        if (filters.testResult && r.testResults !== filters.testResult) return false;
        if (filters.medicalCondition && r.medicalCondition !== filters.medicalCondition) return false;
        if (filters.ageGroup && r.ageGroup !== filters.ageGroup) return false;
        if (filters.hospital && r.hospital !== filters.hospital) return false;
        if (filters.gender && r.gender !== filters.gender) return false;
        if (filters.bloodType && r.bloodType !== filters.bloodType) return false;
        return true;
    });

    // --- Data Grouping ---
    const yearlyData = d3.rollup(
        comparisonData,
        v => v.length,
        d => d.dateOfAdmission.getFullYear(),
        d => d.dateOfAdmission.getMonth()
    );

    const parsedData = Array.from(yearlyData, ([year, monthMap]) => {
        const values = Array.from(monthMap, ([month, count]) => ({ month, count }))
                           .sort((a, b) => a.month - b.month);
        return { year, values };
    }).sort((a, b) => a.year - b.year);

    // --- Scales ---
    const x = d3.scaleLinear()
        .domain([0, 11]) 
        .range([0, width]);

    const maxCount = d3.max(parsedData, d => d3.max(d.values, v => v.count));
    const y = d3.scaleLinear()
        .domain([0, maxCount || 10])
        .nice()
        .range([height, 0]);

    // Color Scheme
    const scheme = window.currentColorScheme || (typeof getColorScheme === 'function' ? getColorScheme() : {});
    const colors = scheme.categorical || ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const colorScale = d3.scaleOrdinal()
        .domain(parsedData.map(d => d.year))
        .range(colors);

    const activeYear = filters.admissionYear ? String(filters.admissionYear) : null;

    // --- Axes ---
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Grid
    svg.append('g').attr('class', 'grid').attr('opacity', 0.1)
        .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''));

    // X Axis
    svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(12).tickFormat(d => monthNames[d]))
        .style('font-size', '11px')
        .style('color', 'var(--text-secondary)');

    // Y Axis
    svg.append('g')
        .call(d3.axisLeft(y).ticks(5))
        .style('font-size', '11px')
        .style('color', 'var(--text-secondary)');

    // Line Generator
    const line = d3.line()
        .x(d => x(d.month))
        .y(d => y(d.count))
        .curve(d3.curveMonotoneX);

    const years = svg.selectAll('.year-group')
        .data(parsedData)
        .enter()
        .append('g')
        .attr('class', 'year-group');

    years.append('path')
        .attr('fill', 'none')
        .attr('stroke', d => colorScale(d.year))
        .attr('stroke-width', d => (activeYear && String(d.year) === activeYear) ? 4 : 2.5) // Thicker if active
        .attr('d', d => line(d.values))
        .attr('opacity', d => (activeYear && String(d.year) !== activeYear) ? 0.15 : 0.85) // Dim inactive
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
            setFilter('admissionYear', String(d.year));
        });

    years.each(function(d) {
        const group = d3.select(this);
        const isSelected = activeYear && String(d.year) === activeYear;
        const isNoneSelected = !activeYear;

        if (isSelected || isNoneSelected) {
            group.selectAll('.dot')
                .data(d.values.map(v => ({ ...v, year: d.year })))
                .enter()
                .append('circle')
                .attr('cx', v => x(v.month))
                .attr('cy', v => y(v.count))
                .attr('r', isSelected ? 5 : 3.5)
                .attr('fill', colorScale(d.year))
                .attr('stroke', '#fff')
                .attr('stroke-width', 1.5)
                .style('cursor', 'pointer')
                .on('mouseover', function(event, v) {
                    d3.select(this).transition().duration(200).attr('r', 7);
                    showTooltip(event, `
                        <div style="font-weight:bold; color:${colorScale(v.year)}">${v.year}</div>
                        <div>${monthNames[v.month]}: ${v.count} Admissions</div>
                    `);
                })
                .on('mouseout', function() {
                    d3.select(this).transition().duration(200).attr('r', isSelected ? 5 : 3.5);
                    hideTooltip();
                })
                .on('click', (event, v) => {
                    setFilter('admissionYear', String(v.year));
                });
        }
    });

    const legend = svg.append('g')
        .attr('transform', `translate(${width + 15}, 0)`);

    parsedData.forEach((d, i) => {
        const isSelected = activeYear && String(d.year) === activeYear;
        const isDimmed = activeYear && !isSelected;

        const row = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`)
            .style('cursor', 'pointer')
            .on('click', () => setFilter('admissionYear', String(d.year)));
        
        row.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', colorScale(d.year))
            .attr('rx', 2)
            .attr('opacity', isDimmed ? 0.3 : 1);
            
        row.append('text')
            .attr('x', 20)
            .attr('y', 10)
            .text(d.year)
            .style('font-size', '12px')
            .style('font-weight', isSelected ? 'bold' : 'normal')
            .style('fill', 'var(--text-secondary)')
            .attr('opacity', isDimmed ? 0.5 : 1);
    });
}

// ===== Treemap: Gender → Blood Type → Medical Condition =====
function drawTreemapChart() {
    const container = document.getElementById('treemap-chart');
    if (!container) return;
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

    // Data Preparation
    const groupedData = d3.groups(filteredData, d => d.gender, d => d.bloodType, d => d.medicalCondition);
    
    let allCounts = [];
    groupedData.forEach(([gender, bloodGroups]) => {
        bloodGroups.forEach(([blood, conditions]) => {
            conditions.forEach(([condition, records]) => {
                allCounts.push(records.length);
            });
        });
    });

    const minVal = d3.min(allCounts) || 1;
    const maxVal = d3.max(allCounts) || 1;

    const visualScale = d3.scaleSqrt()
        .domain([minVal, maxVal])
        .range([10, 50]); 

    // Build hierarchy
    const hierarchyData = {
        name: 'Patients',
        children: groupedData.map(([gender, bloodGroups]) => ({
            name: gender,
            children: bloodGroups.map(([blood, conditions]) => ({
                name: blood,
                children: conditions.map(([condition, records]) => ({
                    name: condition,
                    realValue: records.length,
                    value: visualScale(records.length)
                }))
            }))
        }))
    };

    const root = d3.hierarchy(hierarchyData)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    d3.treemap()
        .size([width, height])
        .paddingInner(1)
        .paddingOuter(2)
        .paddingTop(12)
        .tile(d3.treemapSquarify.ratio(1))
        (root);

    const scheme = window.currentColorScheme || { male: '#0ea5e9', female: '#ec4899' };
    const allBloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    const bloodTypeShade = d3.scalePoint()
        .domain(allBloodTypes)
        .range([0.95, 0.4]);

    const nodes = svg.selectAll('g')
        .data(root.leaves())
        .enter()
        .append('g')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

    nodes.append('rect')
        .attr('width', d => Math.max(0, d.x1 - d.x0))
        .attr('height', d => Math.max(0, d.y1 - d.y0))
        .attr('rx', 3)
        .attr('fill', d => {
            const bloodNode = d.parent;
            const genderNode = d.parent.parent;
            if (!genderNode || !bloodNode) return '#ccc';
            const baseColorHex = (genderNode.data.name === 'Male') ? scheme.male : scheme.female;
            const opacity = bloodTypeShade(bloodNode.data.name) || 0.5;
            const color = d3.color(baseColorHex);
            color.opacity = opacity;
            return color;
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.8)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('stroke-width', 2).attr('stroke', '#333');
            const bloodType = d.parent.data.name;
            const gender = d.parent.parent.data.name;
            showTooltip(event, `
                <strong>${d.data.name}</strong><br/>
                <span style="color:${d3.color((gender === 'Male' ? scheme.male : scheme.female)).darker()}">
                ● ${gender}</span> | 
                <b>${bloodType}</b><br/>
                Patients: ${d.data.realValue}`);
        })
        .on('mouseout', function() {
            d3.select(this).attr('stroke-width', 0.8).attr('stroke', '#fff');
            hideTooltip();
        })
        .on('click', (event, d) => {
            setFilter('gender', d.parent.parent.data.name);
            setFilter('bloodType', d.parent.data.name);
            setFilter('medicalCondition', d.data.name);
        });

    nodes.append('text')
        .attr('x', 4)
        .attr('y', 12)
        .text(d => (d.x1 - d.x0 > 40 && d.y1 - d.y0 > 20) ? d.data.name : '')
        .attr('font-size', '10px')
        .attr('fill', d => {
            const bloodType = d.parent.data.name;
            const opacity = bloodTypeShade(bloodType) || 0.5;
            return opacity < 0.5 ? '#333' : '#fff';
        })
        .style('pointer-events', 'none');
}



// ===== Billing by Year (Range Chart: Min to Max) =====
function drawBillingByYearStackedChart() {
    const container = d3.select('#billing-year-chart');
    container.selectAll('*').remove();

    let selectedHospital = filters.hospital;
    let isDefaultView = false;

    if (!selectedHospital) {
        if (allData && allData.length > 0) {
            const defaultHosp = allData.find(d => d.hospital === "Union Health");
            selectedHospital = defaultHosp ? "Union Health" : allData[0].hospital;
            isDefaultView = true;
        } else {
            selectedHospital = "Unknown";
        }
    }

    const margin = { top: 40, right: 30, bottom: 40, left: 60 };
    const containerNode = document.getElementById('billing-year-chart');
    const containerWidth = containerNode ? containerNode.clientWidth : 800;
    const width = containerWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    if (isDefaultView) {
        svg.append("text")
            .attr("x", 0)
            .attr("y", -15)
            .attr("fill", "#ef4444") 
            .style("font-size", "11px")
            .style("font-style", "italic")
            .text(`* Default View: Showing "${selectedHospital}". Select a specific Hospital to change.`);
    } else {
        svg.append("text")
            .attr("x", 0)
            .attr("y", -15)
            .attr("fill", "var(--text-primary)")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text(`Billing Range: ${selectedHospital}`);
    }


    const hospitalData = filteredData.length > 0 ? filteredData : allData;
    
    const years = [...new Set(hospitalData
        .filter(d => d.hospital === selectedHospital && d.dateOfAdmission)
        .map(d => d.dateOfAdmission.getFullYear())
    )].sort((a, b) => a - b);

    const dataByYear = years.map(year => {
        const vals = hospitalData
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
            range: max - min,
            count: vals.length
        };
    }).filter(Boolean);

    if (dataByYear.length === 0) {
        container.append('div')
            .attr('class', 'chart-placeholder')
            .style('padding', '36px')
            .style('text-align', 'center')
            .style('color', 'var(--text-secondary)')
            .html(`No billing records found for <strong>${selectedHospital}</strong>.`);
        return;
    }

    const overallMax = d3.max(dataByYear, d => d.max);

    const x = d3.scaleBand()
        .domain(dataByYear.map(d => d.year))
        .range([0, width])
        .padding(0.3); 

    const y = d3.scaleLinear()
        .domain([0, (overallMax || 0) * 1.15]) 
        .nice()
        .range([height, 0]);


    const scheme = window.currentColorScheme || (typeof getColorScheme === 'function' ? getColorScheme() : null);
    const palette = (scheme && scheme.categorical) ? scheme.categorical : ['#3b82f6', '#93c5fd'];
    
    const colorBase = palette[0];  
    const colorRange = palette[1] || '#93c5fd'; 

    svg.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''));

    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(0).tickPadding(10))
        .select(".domain").remove(); 

    svg.append('g')
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => `$${(d / 1000).toFixed(0)}k`))
        .select(".domain").remove();

    const barGroup = svg.selectAll('.year-group')
        .data(dataByYear)
        .enter()
        .append('g')
        .attr('class', 'year-group')
        .attr('transform', d => `translate(${x(d.year)},0)`);

    barGroup.append('rect')
        .attr('class', 'bar-min')
        .attr('x', 0)
        .attr('y', d => y(d.min))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.min))
        .attr('fill', colorBase)
        .attr('opacity', 0.9)
        .attr('rx', 2)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1).attr('stroke', '#333').attr('stroke-width', 1);
            if (typeof showTooltip === 'function') {
                showTooltip(event, `
                    <strong>${d.year} Minimum</strong><br/>
                    Lowest Bill: $${d.min.toLocaleString()}<br/>
                    (Base cost for patients)
                `);
            }
        })
        .on('mouseout', function() { d3.select(this).attr('opacity', 0.9).attr('stroke', 'none'); hideTooltip(); });

    barGroup.append('rect')
        .attr('class', 'bar-range')
        .attr('x', 0)
        .attr('y', d => y(d.max))
        .attr('width', x.bandwidth())
        .attr('height', d => y(d.min) - y(d.max))
        .attr('fill', colorRange)
        .attr('opacity', 0.8)
        .attr('rx', 2)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1).attr('stroke', '#333').attr('stroke-width', 1);
            if (typeof showTooltip === 'function') {
                showTooltip(event, `
                    <strong>${d.year} Maximum</strong><br/>
                    Highest Bill: $${d.max.toLocaleString()}<br/>
                    Variance: $${d.range.toLocaleString()}
                `);
            }
        })
        .on('mouseout', function() { d3.select(this).attr('opacity', 0.8).attr('stroke', 'none'); hideTooltip(); });


    barGroup.append('text')
        .attr('x', x.bandwidth() / 2)
        .attr('y', d => y(d.max) - 5)
        .attr('text-anchor', 'middle')
        .text(d => `$${(d.max/1000).toFixed(0)}k`)
        .attr('font-size', '10px')
        .attr('fill', 'var(--text-secondary)')
        .style('pointer-events', 'none');

    barGroup.append('text')
        .attr('x', x.bandwidth() / 2)
        .attr('y', d => y(d.min) + 12)
        .attr('text-anchor', 'middle')
        .text(d => (d.range > 5000) ? `$${(d.min/1000).toFixed(0)}k` : '') // Hide if cramped
        .attr('font-size', '10px')
        .attr('fill', '#fff') 
        .style('pointer-events', 'none');
}

// ===== Arc Diagram: Diseases to Medications =====
function drawArcDiagram() {
    const container = d3.select('#arc-diagram-chart');
    if (container.empty()) return;

    container.selectAll('*').remove();
    
    if (!filteredData || filteredData.length === 0) {
        container.append('p')
            .style('text-align', 'center')
            .style('padding', '40px')
            .style('color', 'var(--text-secondary)')
            .text('No data available for current filters.');
        return;
    }

    const margin = { top: 60, right: 120, bottom: 60, left: 120 };
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right || 800;
    const height = 600 - margin.top - margin.bottom;


    const diseaseFreq = d3.rollup(filteredData, v => v.length, d => d.medicalCondition);
    const medicationFreq = d3.rollup(filteredData, v => v.length, d => d.medication);

    const diseases = Array.from(diseaseFreq.entries())
        .filter(([d]) => d && d !== 'Unknown')
        .sort((a, b) => b[1] - a[1])
        .map(([d]) => d);

    const medications = Array.from(medicationFreq.entries())
        .filter(([m]) => m && m !== 'None' && m !== 'Unknown')
        .sort((a, b) => b[1] - a[1])
        .map(([m]) => m);

    const maxItems = 15;
    const topDiseases = diseases.slice(0, maxItems);
    const topMedications = medications.slice(0, maxItems);

    if (!topDiseases.length || !topMedications.length) {
        container.append('p')
            .style('text-align', 'center')
            .style('padding', '40px')
            .style('color', 'var(--text-secondary)')
            .text('No disease-medication relationships found.');
        return;
    }

    const relationshipCounts = d3.rollup(
        filteredData.filter(d =>
            topDiseases.includes(d.medicalCondition) &&
            topMedications.includes(d.medication)
        ),
        v => v.length,
        d => d.medicalCondition,
        d => d.medication
    );

    const leftAxisX = 0; 
    const rightAxisX = width;
    const axisHeight = height;

    const diseaseScale = d3.scalePoint()
        .domain(topDiseases)
        .range([0, axisHeight])
        .padding(0.5);

    const medicationScale = d3.scalePoint()
        .domain(topMedications)
        .range([0, axisHeight])
        .padding(0.5);

    const diseaseSizeScale = d3.scaleSqrt()
        .domain([0, d3.max(topDiseases.map(d => diseaseFreq.get(d))) || 1])
        .range([5, 18]);

    const medicationSizeScale = d3.scaleSqrt()
        .domain([0, d3.max(topMedications.map(m => medicationFreq.get(m))) || 1])
        .range([5, 18]);

    const scheme = window.currentColorScheme || (typeof getColorScheme === 'function' ? getColorScheme() : {});
    
    function getColorList(items, paletteSource) {
        const result = [];
        const basePalette = paletteSource || ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
        for (let i = 0; i < items.length; i++) {
            result.push(basePalette[i % basePalette.length]);
        }
        return result;
    }

    const fullPalette = scheme.categorical || ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
    
    const diseaseColorScale = d3.scaleOrdinal()
        .domain(topDiseases)
        .range(getColorList(topDiseases, fullPalette));

    const medicationPalette = [...fullPalette].reverse();
    const medicationColorScale = d3.scaleOrdinal()
        .domain(topMedications)
        .range(getColorList(topMedications, medicationPalette));

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const links = [];
    topDiseases.forEach(disease => {
        topMedications.forEach(medication => {
            const count = relationshipCounts.get(disease)?.get(medication) || 0;
            if (count > 0) {
                links.push({ disease, medication, value: count });
            }
        });
    });

    const maxLinkValue = d3.max(links, d => d.value) || 1;
    const linkWidthScale = d3.scaleLinear()
        .domain([0, maxLinkValue])
        .range([1, 6]);

    g.selectAll('.link')
        .data(links)
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d => {
            const sx = leftAxisX;
            const sy = diseaseScale(d.disease);
            const tx = rightAxisX;
            const ty = medicationScale(d.medication);
            const mx = (sx + tx) / 2;
            return `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;
        })
        .attr('fill', 'none')
        .attr('stroke', d => diseaseColorScale(d.disease))
        .attr('stroke-width', d => linkWidthScale(d.value))
        .attr('opacity', 0.3)
        .style('cursor', 'pointer')
        .on('mouseover', function (event, d) {
            d3.select(this)
                .transition().duration(200)
                .attr('opacity', 0.8)
                .attr('stroke-width', linkWidthScale(d.value) + 2);
            
            showTooltip(event, `
                <div style="margin-bottom:4px; font-weight:bold; color:${diseaseColorScale(d.disease)}">
                    ${d.disease} → ${d.medication}
                </div>
                <div>Patients: ${d.value}</div>
            `);
        })
        .on('mouseout', function (event, d) {
            d3.select(this)
                .transition().duration(200)
                .attr('opacity', 0.3)
                .attr('stroke-width', linkWidthScale(d.value));
            hideTooltip();
        })
        .on('click', (event, d) => setFilter('medicalCondition', d.disease));

    const diseaseNodes = g.selectAll('.disease-node')
        .data(topDiseases)
        .enter()
        .append('g')
        .attr('transform', d => `translate(${leftAxisX},${diseaseScale(d)})`)
        .style('cursor', 'pointer')
        .on('click', (event, d) => setFilter('medicalCondition', d));

    diseaseNodes.append('circle')
        .attr('r', d => diseaseSizeScale(diseaseFreq.get(d)))
        .attr('fill', d => diseaseColorScale(d))
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .on('mouseover', function(event, d) {
            d3.select(this).transition().duration(200).attr('r', diseaseSizeScale(diseaseFreq.get(d)) + 3);
            showTooltip(event, `<strong>${d}</strong><br/>Total Cases: ${diseaseFreq.get(d)}`);
        })
        .on('mouseout', function(event, d) {
            d3.select(this).transition().duration(200).attr('r', diseaseSizeScale(diseaseFreq.get(d)));
            hideTooltip();
        });

    diseaseNodes.append('text')
        .attr('x', -20)
        .attr('y', 5)
        .attr('text-anchor', 'end')
        .text(d => d.length > 20 ? d.slice(0, 18) + '…' : d)
        .style('font-size', '12px')
        .style('fill', 'var(--text-primary)')
        .style('font-weight', '500');

    const medicationNodes = g.selectAll('.medication-node')
        .data(topMedications)
        .enter()
        .append('g')
        .attr('transform', d => `translate(${rightAxisX},${medicationScale(d)})`)
        .style('cursor', 'pointer')
        .on('click', (event, d) => setFilter('medication', d));

    medicationNodes.append('circle')
        .attr('r', d => medicationSizeScale(medicationFreq.get(d)))
        .attr('fill', d => medicationColorScale(d))
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .on('mouseover', function(event, d) {
            d3.select(this).transition().duration(200).attr('r', medicationSizeScale(medicationFreq.get(d)) + 3);
            showTooltip(event, `<strong>${d}</strong><br/>Prescriptions: ${medicationFreq.get(d)}`);
        })
        .on('mouseout', function(event, d) {
            d3.select(this).transition().duration(200).attr('r', medicationSizeScale(medicationFreq.get(d)));
            hideTooltip();
        });

    medicationNodes.append('text')
        .attr('x', 20)
        .attr('y', 5)
        .attr('text-anchor', 'start')
        .text(d => d.length > 20 ? d.slice(0, 18) + '…' : d)
        .style('font-size', '12px')
        .style('fill', 'var(--text-primary)')
        .style('font-weight', '500');
}


function drawInsuranceCostChart() {
    const container = document.getElementById('insurance-cost-chart');
    if (!container) return;
    container.innerHTML = '';

    if (!filteredData || filteredData.length === 0) {
         container.innerHTML = '<div class="no-data">No data available</div>';
         return;
    }

    const containerWidth = container.clientWidth || 500; 
    const height = 320; 
    
    const margin = { top: 20, right: 60, bottom: 40, left: 130 };
    const width = containerWidth - margin.left - margin.right;

    const insuranceData = d3.rollup(
        filteredData,
        v => ({
            avgCost: d3.mean(v, d => d.billingAmount),
            count: v.length,
            totalCost: d3.sum(v, d => d.billingAmount)
        }),
        d => d.insuranceProvider
    );

    const data = Array.from(insuranceData.entries())
        .filter(([provider]) => provider !== 'Unknown' && provider.trim() !== '')
        .map(([provider, stats]) => ({
            provider,
            avgCost: stats.avgCost || 0,
            count: stats.count,
            totalCost: stats.totalCost
        }))
        .sort((a, b) => b.avgCost - a.avgCost);

    const svg = d3.select('#insurance-cost-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`) 
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.avgCost) * 1.1]) 
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(data.map(d => d.provider))
        .range([0, height])
        .padding(0.3);

    const scheme = window.currentColorScheme || (typeof getColorScheme === 'function' ? getColorScheme() : { categorical: ['#2563eb'] });
    
 
    const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d.provider))
        .range(data.map((_, i) => scheme.categorical[i % scheme.categorical.length]));

    const grid = g.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x)
            .ticks(5)
            .tickSize(-height)
            .tickFormat('')
        );
    
    grid.selectAll('line')
        .attr('stroke', 'var(--border-color, #e2e8f0)') 
        .attr('stroke-dasharray', '3,3'); 
    grid.select('.domain').remove();

    g.selectAll('.bar')
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
        .style('transition', 'all 0.2s ease')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.8);
            if (typeof showTooltip === 'function') {
                showTooltip(event, 
                    `<strong>${d.provider}</strong><br/>
                    Avg Cost: $${Math.round(d.avgCost).toLocaleString()}<br/>
                    Patients: ${d.count}`
                );
            }
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            if (typeof hideTooltip === 'function') hideTooltip();
        });

    g.selectAll('.label')
        .data(data)
        .enter()
        .append('text')
        .attr('x', d => x(d.avgCost) + 8)
        .attr('y', d => y(d.provider) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .text(d => `$${(d.avgCost / 1000).toFixed(1)}k`) 
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('fill', 'var(--text-secondary, #475569)');

    const yAxis = g.append('g')
        .call(d3.axisLeft(y).tickSize(0));

    yAxis.select('.domain').remove(); 
    yAxis.selectAll('text')
        .attr('font-size', '12px')
        .attr('font-weight', '500')
        .attr('fill', 'var(--text-primary, #334155)')
        .style('text-anchor', 'end')
        .text(function(d) {
            const maxChars = 15;
            return d.length > maxChars ? d.substring(0, maxChars) + '...' : d;
        });

    g.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d => `$${d/1000}k`))
        .select('.domain').remove(); 

    g.append('text')
        .attr('transform', `translate(${width / 2}, ${height + 35})`)
        .style('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', 'var(--text-secondary, #64748b)')
        .text('Average Billing Amount (USD)');
}



// ===== Insurance Provider Performance: Bar + Line Chart =====
function drawInsurancePerformanceChart() {
    const container = document.getElementById('insurance-performance-chart');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!filteredData || filteredData.length === 0) {
        container.innerHTML = '<div class="no-data">No data available</div>';
        return;
    }
    
    // 1. Accessibility: Get Dynamic Colors
    const scheme = typeof getColorScheme === 'function' ? getColorScheme() : { categorical: ['#0e7490', '#86198f'] };
    const barColor = scheme.categorical[0]; 
    const lineColor = scheme.categorical[1]; 
    const textColor = 'var(--text-primary, #374151)';
    const gridColor = 'var(--border-color, #e5e7eb)';

    // 2. Setup Dimensions
    const containerWidth = container.clientWidth || 900;
    const height = 400; 
    const margin = { top: 60, right: 80, bottom: 60, left: 80 };
    const width = containerWidth - margin.left - margin.right;
    
    // 3. Data Processing
    const insuranceData = d3.rollup(
        filteredData,
        v => ({
            totalBilled: d3.sum(v, d => d.billingAmount),
            patientCount: v.length,
            avgCost: d3.mean(v, d => d.billingAmount)
        }),
        d => d.insuranceProvider
    );
    
    const data = Array.from(insuranceData.entries())
        .filter(([provider]) => provider !== 'Unknown' && provider.trim() !== '')
        .map(([provider, stats]) => ({
            provider,
            totalBilled: stats.totalBilled || 0,
            patientCount: stats.patientCount || 0,
            avgCost: stats.avgCost || 0
        }))
        .sort((a, b) => b.totalBilled - a.totalBilled)
        .slice(0, 5); 
    
    // 4. Create SVG
    const svg = d3.select('#insurance-performance-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // 5. Scales
    const x = d3.scaleBand()
        .domain(data.map(d => d.provider))
        .range([0, width])
        .padding(0.4); 

    const minBilled = d3.min(data, d => d.totalBilled);
    const maxBilled = d3.max(data, d => d.totalBilled);
    const rangeBilled = maxBilled - minBilled;
    const bufferBilled = rangeBilled === 0 ? minBilled * 0.02 : rangeBilled * 0.1; 

    const yBilled = d3.scaleLinear()
        .domain([minBilled - bufferBilled, maxBilled + bufferBilled])
        .range([height, 0]);

    const minP = d3.min(data, d => d.patientCount);
    const maxP = d3.max(data, d => d.patientCount);
    const rangeP = maxP - minP;
    const bufferP = rangeP === 0 ? minP * 0.05 : rangeP * 0.2;
    
    const yPatients = d3.scaleLinear()
        .domain([minP - bufferP, maxP + bufferP])
        .range([height, 0]);

    // 6. Grid Lines 
    g.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yBilled)
            .ticks(5)
            .tickSize(-width)
            .tickFormat('')
        )
        .selectAll('line')
        .attr('stroke', gridColor)
        .attr('stroke-dasharray', '0');
    
    g.select('.domain').remove();

    // 7. Bars 
    g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.provider))
        .attr('y', d => yBilled(d.totalBilled))
        .attr('width', x.bandwidth())
        .attr('height', d => Math.max(0, height - yBilled(d.totalBilled)))
        .attr('fill', barColor)
        .attr('rx', 0)
        .style('transition', 'opacity 0.2s')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.8);
            if (typeof showTooltip === 'function') {
                showTooltip(event, 
                    `<strong>${d.provider}</strong><br/>
                    Total Billed: $${(d.totalBilled/1000000).toFixed(2)}M<br/>
                    Avg Cost: $${Math.round(d.avgCost).toLocaleString()}`
                );
            }
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            if (typeof hideTooltip === 'function') hideTooltip();
        });

    // 8. Line Path 
    const lineGenerator = d3.line()
        .x(d => x(d.provider) + x.bandwidth() / 2)
        .y(d => yPatients(d.patientCount))
        .curve(d3.curveMonotoneX);

    g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', lineColor)
        .attr('stroke-width', 2.5)
        .attr('d', lineGenerator);

    // 9. Line Points 
    g.selectAll('.dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => x(d.provider) + x.bandwidth() / 2)
        .attr('cy', d => yPatients(d.patientCount))
        .attr('r', 5)
        .attr('fill', lineColor)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('r', 8).attr('stroke-width', 3);
            if (typeof showTooltip === 'function') {
                showTooltip(event, 
                    `<strong>${d.provider}</strong><br/>
                    Patient Count: ${d.patientCount.toLocaleString()}<br/>
                    (Line Data)`
                );
            }
        })
        .on('mouseout', function() {
            d3.select(this).attr('r', 5).attr('stroke-width', 2);
            if (typeof hideTooltip === 'function') hideTooltip();
        });

    // 10. Floating Labels
    g.selectAll('.label-patients')
        .data(data)
        .enter()
        .append('text')
        .attr('x', d => x(d.provider) + x.bandwidth() / 2)
        .attr('y', d => yPatients(d.patientCount) - 12)
        .attr('text-anchor', 'middle')
        .attr('fill', lineColor)
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .style('pointer-events', 'none')
        .text(d => `${(d.patientCount / 1000).toFixed(1)}k`);

    // 11. Axes
    g.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'rotate(-30)')
        .style('text-anchor', 'end')
        .style('font-size', '12px')
        .style('fill', 'var(--text-secondary, #4b5563)');

    g.append('g')
        .call(d3.axisLeft(yBilled).ticks(5).tickFormat(d => `${(d/1000000).toFixed(1)}M`))
        .select('.domain').remove();

    g.append('g')
        .attr('transform', `translate(${width}, 0)`)
        .call(d3.axisRight(yPatients).ticks(5).tickFormat(d => `${d/1000}k`))
        .select('.domain').remove();
        
    g.append('text')
        .attr('transform', 'rotate(90)')
        .attr('y', -width - 45)
        .attr('x', height / 2)
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('fill', lineColor)
        .style('font-size', '11px')
        .text('Total billed patients');

    // 12. Legend
    const legend = svg.append('g')
        .attr('transform', `translate(${margin.left}, 20)`);
    
    legend.append('rect').attr('x', 0).attr('y', 0).attr('width', 12).attr('height', 12).attr('fill', barColor);
    legend.append('text').attr('x', 18).attr('y', 10).text('Billed amounts').style('font-size', '13px').style('fill', textColor);
    
    const legend2X = 140;
    legend.append('line').attr('x1', legend2X).attr('x2', legend2X + 20).attr('y1', 6).attr('y2', 6).attr('stroke', lineColor).attr('stroke-width', 2);
    legend.append('circle').attr('cx', legend2X + 10).attr('cy', 6).attr('r', 3).attr('fill', lineColor);
    legend.append('text').attr('x', legend2X + 25).attr('y', 10).text('Total billed patients').style('font-size', '13px').style('fill', textColor);
}

// ===== Blood Type Distribution=====
function drawBloodTypeChart() {
    const container = document.getElementById('blood-type-chart');
    if (!container) return;
    container.innerHTML = '';

    // --- Dimensions ---
    const margin = { top: 20, right: 20, bottom: 60, left: 20 };
    const width = container.clientWidth;
    const height = 320;
    const chartHeight = height - margin.top - margin.bottom;
    const radius = Math.min(width - margin.left - margin.right, chartHeight) / 2;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${margin.top + radius})`);

    // --- Data Processing ---
    const bloodTypes = [...new Set(filteredData.map(d => d.bloodType))].sort();
    const counts = d3.rollup(filteredData, v => v.length, d => d.bloodType);
    const data = bloodTypes.map(type => ({
        type,
        count: counts.get(type) || 0
    })).filter(d => d.count > 0);

    if (data.length === 0) {
        svg.append('text').attr('text-anchor', 'middle').text('No Data');
        return;
    }

    // --- Colors: Accessible categorical palette ---
    const scheme = window.currentColorScheme || (typeof getColorScheme === 'function' ? getColorScheme() : {});
    const categorical = scheme.categorical || [
        '#0ea5e9','#22c55e','#f59e0b','#ec4899','#3b82f6','#10b981','#9333ea','#f43f5e'
    ];
    
    // Ensure colors map consistently to types
    const colorScale = d3.scaleOrdinal()
        .domain(bloodTypes) 
        .range(categorical); 

    // --- Generators ---
    const pie = d3.pie().value(d => d.count).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius - 10);
    const hoverArc = d3.arc().innerRadius(0).outerRadius(radius); 

    // --- Draw Slices ---
    svg.selectAll('path')
        .data(pie(data))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => colorScale(d.data.type))
        .attr('stroke', scheme === 'achromatopsia' ? '#000' : '#fff') 
        .attr('stroke-width', 2)
        .attr('opacity', 0.9)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).transition().duration(200).attr('d', hoverArc).attr('opacity', 1);
            
            const percent = ((d.data.count / filteredData.length) * 100).toFixed(1);
            
            showTooltip(event, `Type ${d.data.type}: ${d.data.count} (${percent}%)`);
        })
        .on('mouseout', function() {
            d3.select(this).transition().duration(200).attr('d', arc).attr('opacity', 0.9);
            hideTooltip();
        })
        .on('click', (event, d) => setFilter('bloodType', d.data.type));

    const legendY = radius + 30;
    const legendItemWidth = 60;
    const itemsPerRow = Math.floor(width / legendItemWidth);
    
    const legend = svg.append('g')
        .attr('transform', `translate(${-((Math.min(data.length, itemsPerRow) * legendItemWidth) / 2)}, ${legendY})`);

    data.forEach((d, i) => {
        const row = Math.floor(i / itemsPerRow);
        const col = i % itemsPerRow;
        
        const g = legend.append('g')
            .attr('transform', `translate(${col * legendItemWidth}, ${row * 20})`)
            .style('cursor', 'pointer')
            .on('click', () => setFilter('bloodType', d.type));

        g.append('circle').attr('r', 5).attr('fill', colorScale(d.type));
        
        g.append('text')
            .attr('x', 10).attr('y', 4)
            .text(d.type)
            .style('font-size', '11px')
            .style('font-family', 'sans-serif')
            .style('fill', 'var(--text-secondary)');
    });
}


function drawDiseaseTrendsChart() {
    const container = document.getElementById('disease-trends-chart');
    if (!container) return;
    container.innerHTML = '';

    // 1️ Get current vision-friendly color scheme
    const scheme = window.currentColorScheme || (typeof getColorScheme === 'function' ? getColorScheme() : { categorical: [] });

    // 2️ Setup dimensions
    const margin = { top: 20, right: 140, bottom: 40, left: 50 }; // Increased left margin for Y-axis visibility
    const width = container.clientWidth - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);


    svg.append('rect')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('fill', 'transparent')
        .style('cursor', 'default')
        .on('click', () => {
            if (typeof setFilter === 'function') setFilter('medicalCondition', null);
        });

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // 3️ Process data
    const validRecords = filteredData.filter(d => d.dateOfAdmission);
    if (validRecords.length === 0) {
        g.append('text').attr('x', width / 2).attr('y', height / 2).text('No data available');
        return;
    }

    const years = validRecords.map(d => d.dateOfAdmission.getFullYear());
    const minYear = d3.min(years);
    const maxYear = d3.max(years);
    const allYears = d3.range(minYear, maxYear + 1);

    const conditions = [...new Set(validRecords.map(d => d.medicalCondition))].sort();

    // 4️ Dynamic Color Assignment
    const palette = scheme.categorical && scheme.categorical.length > 0 
        ? scheme.categorical 
        : ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
    
    const conditionColors = {};
    conditions.forEach((cond, i) => {
        conditionColors[cond] = palette[i % palette.length];
    });

    // 5️ Prepare series data
    const seriesData = conditions.map(condition => {
        const conditionRecords = validRecords.filter(d => d.medicalCondition === condition);
        const values = allYears.map(year => ({
            year,
            count: conditionRecords.filter(d => d.dateOfAdmission.getFullYear() === year).length,
            condition
        }));
        return { name: condition, values };
    });

    // 6️ Scales
    const xScale = d3.scaleLinear().domain([minYear, maxYear]).range([0, width]);

    const allCounts = seriesData.flatMap(s => s.values.map(d => d.count));
    const yMin = d3.min(allCounts) || 0;
    const yMax = d3.max(allCounts) || 10;
    
    const range = yMax - yMin;
    const buffer = range === 0 ? (yMin * 0.1 || 1) : range * 0.1;

    const yScale = d3.scaleLinear()
        .domain([Math.max(0, yMin - buffer), yMax + buffer]) 
        .range([height, 0]);

    // 7️ Axes (Explicitly drawing the Y Axis Line)
    
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(allYears.length).tickFormat(d3.format('d')))
        .attr('font-size', '11px')
        .attr('color', 'var(--text-secondary)');

    const yAxisGroup = g.append('g')
        .call(d3.axisLeft(yScale).ticks(5));

    yAxisGroup.selectAll('text').attr('fill', 'var(--text-secondary)');
    yAxisGroup.selectAll('line').attr('stroke', 'var(--border-color)'); // Ticks
    yAxisGroup.select('.domain').attr('stroke', 'var(--border-color)').attr('stroke-width', 1); // Main Axis Line

    g.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(''))
        .selectAll('line')
        .attr('stroke', 'var(--border-color)')
        .attr('stroke-opacity', 0.2)
        .attr('stroke-dasharray', '2,2');
    
    // Remove the extra domain line from the grid group so it doesn't overlap the main axis
    g.select('.grid .domain').remove();

    // 8️⃣ Draw lines
    const lineGenerator = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.count))
        .curve(d3.curveMonotoneX);

    // Wrapper group for lines to ensure they sit above grid
    const linesGroup = g.append('g');

    const lines = linesGroup.selectAll('.line-group')
        .data(seriesData)
        .enter()
        .append('g')
        .attr('class', 'line-group');

    lines.append('path')
        .attr('d', d => lineGenerator(d.values))
        .attr('fill', 'none')
        .attr('stroke', d => conditionColors[d.name]) 
        .attr('stroke-width', 3) 
        .attr('opacity', 0.9)
        .style('cursor', 'pointer')
        .on('mouseover', function() { d3.select(this).attr('stroke-width', 5); })
        .on('mouseout', function() { d3.select(this).attr('stroke-width', 3); })
        .on('click', (event, d) => {
            event.stopPropagation(); 
            if (typeof setFilter === 'function') setFilter('medicalCondition', d.name);
        });

    // 9️ Draw dots
    lines.selectAll('circle')
        .data(d => d.values)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(d.count))
        .attr('r', 4)
        .attr('fill', '#fff')
        .attr('stroke', d => conditionColors[d.condition])
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('r', 6).attr('fill', conditionColors[d.condition]);
            if (typeof showTooltip === 'function') {
                showTooltip(event, `<strong>${d.condition}</strong><br/>Year: ${d.year}<br/>Patients: ${d.count}`);
            }
        })
        .on('mouseout', function(event, d) {
            d3.select(this).attr('r', 4).attr('fill', '#fff');
            if (typeof hideTooltip === 'function') hideTooltip();
        })
        .on('click', (event, d) => {
            event.stopPropagation(); // Stop click from hitting the background
            if (typeof setFilter === 'function') setFilter('medicalCondition', d.condition);
        });

    //  Legend
    const legend = svg.append('g').attr('transform', `translate(${width + margin.left + 10}, ${margin.top})`);

    conditions.forEach((condition, i) => {
        const row = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`)
            .style('cursor', 'pointer')
            .on('click', (event) => {
                event.stopPropagation();
                if (typeof setFilter === 'function') setFilter('medicalCondition', condition);
            });

        row.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', conditionColors[condition])
            .attr('rx', 2);

        row.append('text')
            .attr('x', 18)
            .attr('y', 10)
            .text(condition)
            .attr('font-size', '11px')
            .attr('fill', 'var(--text-primary)')
            .attr('alignment-baseline', 'middle');
    });
}

// ===== Box Plot: Length of Stay by Medical Condition =====
function drawLosBoxPlot() {
    const container = document.getElementById('los-boxplot');
    if (!container) return;
    container.innerHTML = '';

    if (!filteredData || filteredData.length === 0) {
        container.innerHTML = '<div class="no-data">No data available</div>';
        return;
    }

    // 1. Setup Dimensions
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const svg = d3.select('#los-boxplot')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // 2. Process Data
    const dataByCondition = d3.groups(filteredData, d => d.medicalCondition)
        .map(([condition, values]) => {
            const sorted = values.map(d => d.lengthOfStay).sort(d3.ascending);
            const q1 = d3.quantile(sorted, 0.25);
            const median = d3.quantile(sorted, 0.5);
            const q3 = d3.quantile(sorted, 0.75);
            const iqr = q3 - q1;
            const minBound = q1 - 1.5 * iqr;
            const maxBound = q3 + 1.5 * iqr;
            const min = d3.min(sorted.filter(v => v >= minBound)) || q1;
            const max = d3.max(sorted.filter(v => v <= maxBound)) || q3;
            const outliers = sorted.filter(v => v < min || v > max);
            return { key: condition, q1, median, q3, iqr, min, max, outliers };
        })
        .sort((a, b) => b.median - a.median);

    // 3. SCALES
    const x = d3.scaleBand()
        .domain(dataByCondition.map(d => d.key))
        .range([0, width])
        .padding(0.4);


    const globalMin = d3.min(dataByCondition, d => d.min) || 0;
    const globalMax = d3.max(dataByCondition, d => d.max) || 30;
    
    const yPadding = (globalMax - globalMin) * 0.10; 

    const y = d3.scaleLinear()
        .domain([Math.max(0, globalMin - yPadding), globalMax + yPadding]) 
        .range([height, 0]);

    // 4. Color Scheme
    const scheme = window.currentColorScheme || (typeof getColorScheme === 'function' ? getColorScheme() : { categorical: [] });
    const palette = scheme.categorical || d3.schemeTableau10;
    const colorScale = d3.scaleOrdinal()
        .domain(dataByCondition.map(d => d.key))
        .range(palette);

    // 5. Grid Lines
    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''))
        .selectAll('line')
        .attr('stroke', 'var(--border-color)')
        .attr('stroke-dasharray', '3,3');
    svg.select('.domain').remove();

    // 6. Draw Axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'rotate(-25)')
        .style('text-anchor', 'end')
        .attr('fill', 'var(--text-secondary)');

    svg.append('g')
        .call(d3.axisLeft(y).ticks(5)) 
        .select('.domain').remove();
    
    // Y Label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -45)
        .attr('x', -height / 2)
        .attr('text-anchor', 'middle')
        .style('fill', 'var(--text-secondary)')
        .style('font-size', '11px')
        .text('Days');

    // 7. Draw Box Plots
    const boxWidth = x.bandwidth();

    // Whiskers
    svg.selectAll('.vertLines')
        .data(dataByCondition)
        .enter()
        .append('line')
        .attr('x1', d => x(d.key) + boxWidth/2)
        .attr('x2', d => x(d.key) + boxWidth/2)
        .attr('y1', d => y(d.min))
        .attr('y2', d => y(d.max))
        .attr('stroke', 'var(--text-primary)')
        .attr('stroke-width', 1);

    // Boxes
    svg.selectAll('.boxes')
        .data(dataByCondition)
        .enter()
        .append('rect')
        .attr('x', d => x(d.key))
        .attr('y', d => y(d.q3))
        .attr('height', d => Math.max(1, y(d.q1) - y(d.q3)))
        .attr('width', boxWidth)
        .attr('stroke', 'var(--text-primary)')
        .attr('stroke-width', 1)
        .attr('fill', d => colorScale(d.key))
        .attr('opacity', 0.8)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1).attr('stroke-width', 2);
            if (typeof showTooltip === 'function') {
                showTooltip(event, 
                    `<strong>${d.key}</strong><br/>
                    Max: ${d.max} days<br/>
                    Q3: ${d.q3}<br/>
                    <b>Median: ${d.median}</b><br/>
                    Q1: ${d.q1}<br/>
                    Min: ${d.min} days`
                );
            }
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 0.8).attr('stroke-width', 1);
            if (typeof hideTooltip === 'function') hideTooltip();
        })
        .on('click', (event, d) => {
            if (typeof setFilter === 'function') setFilter('medicalCondition', d.key);
        });

    // Median Lines
    svg.selectAll('.medianLines')
        .data(dataByCondition)
        .enter()
        .append('line')
        .attr('x1', d => x(d.key))
        .attr('x2', d => x(d.key) + boxWidth)
        .attr('y1', d => y(d.median))
        .attr('y2', d => y(d.median))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    // 8. Outliers
    const outlierData = [];
    dataByCondition.forEach(d => {
        d.outliers.forEach(val => {
            outlierData.push({ key: d.key, value: val });
        });
    });

    svg.selectAll('.outliers')
        .data(outlierData)
        .enter()
        .append('circle')
        .attr('cx', d => x(d.key) + boxWidth/2)
        .attr('cy', d => y(d.value))
        .attr('r', 2)
        .attr('fill', 'var(--text-secondary)')
        .attr('opacity', 0.5)
        .style('pointer-events', 'none');
}


// ===== Seasonality Heatmap: Normalized & Vision Accessible =====
function drawSeasonalityChart() {
    const container = document.getElementById('seasonality-chart');
    if (!container) return;
    container.innerHTML = '';

    if (!filteredData || filteredData.length === 0) {
        container.innerHTML = '<div class="no-data">No data available</div>';
        return;
    }

    // 1. Setup Dimensions
    const margin = { top: 40, right: 30, bottom: 20, left: 120 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select('#seasonality-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // 2. Prepare Data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const conditions = [...new Set(filteredData.map(d => d.medicalCondition))].sort();

    // Create matrix
    let matrix = [];
    conditions.forEach(condition => {
        months.forEach((month, i) => {
            matrix.push({ 
                condition: condition, 
                month: month, 
                monthIndex: i, 
                value: 0 
            });
        });
    });

    // Fill counts
    filteredData.forEach(d => {
        if (d.dateOfAdmission && d.medicalCondition) {
            const mIndex = d.dateOfAdmission.getMonth();
            const cond = d.medicalCondition;
            const cell = matrix.find(x => x.monthIndex === mIndex && x.condition === cond);
            if (cell) cell.value++;
        }
    });

    conditions.forEach(cond => {
        const rowValues = matrix.filter(d => d.condition === cond).map(d => d.value);
        const min = Math.min(...rowValues);
        const max = Math.max(...rowValues);
        const range = max - min;

        matrix.filter(d => d.condition === cond).forEach(d => {
            d.normalized = range === 0 ? 0 : (d.value - min) / range;
        });
    });

    // 3. Scales
    const x = d3.scaleBand()
        .range([0, width])
        .domain(months)
        .padding(0.15);

    const y = d3.scaleBand()
        .range([0, height])
        .domain(conditions)
        .padding(0.15);


    const scheme = window.currentColorScheme || (typeof getColorScheme === 'function' ? getColorScheme() : { categorical: ['#22c55e'] });
    
    const baseColor = scheme.categorical && scheme.categorical.length > 0 
        ? scheme.categorical[0] 
        : '#22c55e'; 

    const lowColor = '#ebedf0'; 

    const colorRange = [
        lowColor,                                     // Level 0 (Empty)
        d3.interpolateRgb(lowColor, baseColor)(0.3),  // Level 1
        d3.interpolateRgb(lowColor, baseColor)(0.6),  // Level 2
        d3.interpolateRgb(lowColor, baseColor)(0.85), // Level 3
        baseColor                                     // Level 4 (Max)
    ];

    const colorScale = d3.scaleQuantize()
        .domain([0, 1])
        .range(colorRange);

    // 5. Draw Cells
    svg.selectAll()
        .data(matrix, function(d) { return d.month + ':' + d.condition; })
        .enter()
        .append("rect")
        .attr("x", function(d) { return x(d.month) })
        .attr("y", function(d) { return y(d.condition) })
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("width", x.bandwidth() )
        .attr("height", y.bandwidth() )
        .style("fill", function(d) { 
            return d.value === 0 ? lowColor : colorScale(d.normalized);
        })
        .style("stroke", "var(--card-bg, #fff)")
        .style("stroke-width", 2)
        .on("mouseover", function(event, d) {
            d3.select(this).style("stroke", "var(--text-secondary, #888)");
            if (typeof showTooltip === 'function') {
                showTooltip(event, 
                    `<strong>${d.condition}</strong><br/>
                    Month: ${d.month}<br/>
                    Admissions: ${d.value}<br/>
                    <span style="font-size:10px; color:${baseColor}">Relative Intensity: ${(d.normalized * 100).toFixed(0)}%</span>`
                );
            }
        })
        .on("mouseout", function(event, d) {
            d3.select(this).style("stroke", "var(--card-bg, #fff)");
            if (typeof hideTooltip === 'function') hideTooltip();
        })
        .on("click", (event, d) => {
            if (typeof setFilter === 'function') setFilter('medicalCondition', d.condition);
        });

    // 6. Axis Labels
    svg.append("g")
        .attr("transform", `translate(0, -10)`)
        .call(d3.axisTop(x).tickSize(0))
        .select(".domain").remove();

    svg.append("g")
        .call(d3.axisLeft(y).tickSize(0))
        .select(".domain").remove();

    svg.selectAll("text")
        .style("font-size", "11px")
        .style("fill", "var(--text-secondary)");

    // 7. Legend
    const legendGroup = svg.append("g").attr("transform", `translate(${width - 100}, -30)`);
    
    legendGroup.append("text")
        .attr("x", -5)
        .attr("y", 9)
        .text("Less")
        .style("font-size", "10px")
        .style("fill", "var(--text-secondary)")
        .style("text-anchor", "end");

    const blockSize = 10;
    colorRange.forEach((color, i) => {
        legendGroup.append("rect")
            .attr("x", i * (blockSize + 2))
            .attr("y", 0)
            .attr("width", blockSize)
            .attr("height", blockSize)
            .attr("rx", 2)
            .style("fill", color);
    });

    legendGroup.append("text")
        .attr("x", colorRange.length * (blockSize + 2) + 5)
        .attr("y", 9)
        .text("More")
        .style("font-size", "10px")
        .style("fill", "var(--text-secondary)");
}

// ===== Parallel Coordinates: Complete (Stable + Filters + Detailed Tooltip) =====
function drawParallelCoordinatesChart() {
    const containerId = 'parallel-coordinates-chart';
    const container = document.getElementById(containerId);

    if (!container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = 400; 

    if (width === 0) return; 

    // 1. Setup SVG (Get or Create Pattern)
    let svg = d3.select(container).select('svg');
    let g;
    
    const margin = { top: 40, right: 10, bottom: 20, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (svg.empty()) {
        svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('display', 'block');
        
        g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)
            .attr('class', 'chart-group');
            
        g.append('g').attr('class', 'layer-paths');
        g.append('g').attr('class', 'layer-axes');
        g.append('text').attr('class', 'no-data-msg')
            .attr('x', innerWidth / 2).attr('y', innerHeight / 2)
            .attr('text-anchor', 'middle').style('opacity', 0);
    } else {
        svg.attr('width', width).attr('height', height);
        g = svg.select('.chart-group');
    }

    if (!filteredData || filteredData.length === 0) {
        g.select('.layer-paths').selectAll('*').remove();
        g.select('.layer-axes').selectAll('*').remove();
        g.select('.no-data-msg').style('opacity', 1).text('No data available');
        return;
    }
    g.select('.no-data-msg').style('opacity', 0);

    // 2. Define Dimensions & Filter Mapping
    const dimensions = [
        { name: 'ageGroup', label: 'Age Group' },
        { name: 'admissionType', label: 'Admission' },
        { name: 'medicalCondition', label: 'Condition' },
        { name: 'testResults', label: 'Outcome' }
    ];

    const filterKeys = {
        'ageGroup': 'ageGroup',
        'admissionType': 'admissionType',
        'medicalCondition': 'medicalCondition',
        'testResults': 'testResult' 
    };

    // 3. Aggregate Data
    let groupedData = d3.rollups(filteredData, 
        v => v.length, 
        d => dimensions.map(dim => d[dim.name] || 'Unknown').join('||') 
    ).map(([key, count]) => {
        const parts = key.split('||');
        const obj = { count: count, key: key };
        dimensions.forEach((dim, i) => obj[dim.name] = parts[i]);
        return obj;
    });

    const totalPatients = filteredData.length;
    const threshold = Math.max(1, Math.ceil(totalPatients * 0.005)); 
    let renderData = groupedData.filter(d => d.count >= threshold);
    renderData.sort((a, b) => a.count - b.count); 

    // 4. Update Scales
    const yScales = {};
    dimensions.forEach(dim => {
        const values = [...new Set(filteredData.map(d => d[dim.name] || 'Unknown'))].sort();
        yScales[dim.name] = d3.scalePoint()
            .domain(values)
            .range([innerHeight, 0])
            .padding(0.1);
    });

    const x = d3.scalePoint()
        .range([0, innerWidth])
        .padding(0.1)
        .domain(dimensions.map(d => d.name));

    const maxCount = d3.max(renderData, d => d.count) || 1;
    const strokeWidthScale = d3.scaleLinear().domain([1, maxCount]).range([0.8, 8]); 
    const opacityScale = d3.scaleLinear().domain([1, maxCount]).range([0.35, 0.9]);

    const scheme = window.currentColorScheme || { Normal: '#22c55e', Abnormal: '#ef4444', Inconclusive: '#f59e0b' };
    const colorScale = d => {
        if (d.testResults === 'Normal') return scheme.Normal;
        if (d.testResults === 'Abnormal') return scheme.Abnormal;
        return scheme.Inconclusive || '#ccc';
    };

    // 5. Draw Lines 
    const pathGenerator = d3.line()
        .x((d, i) => x(dimensions[i].name))
        .y((d, i) => yScales[dimensions[i].name](d))
        .curve(d3.curveMonotoneX);

    const paths = g.select('.layer-paths').selectAll('path.flow').data(renderData, d => d.key);
    paths.exit().remove();

    const pathsEnter = paths.enter().append('path').attr('class', 'flow')
        .style('fill', 'none')
        .style('mix-blend-mode', 'multiply')
        .style('cursor', 'pointer'); 

    paths.merge(pathsEnter)
        .attr('d', d => pathGenerator(dimensions.map(dim => d[dim.name])))
        .style('stroke', d => colorScale(d))
        .style('stroke-width', d => strokeWidthScale(d.count))
        .style('opacity', d => opacityScale(d.count))
        .on('mouseover', function(event, d) {
            d3.selectAll('.flow').style('opacity', 0.05);
            d3.select(this).style('stroke', '#ffffff').style('opacity', 1)
                .style('stroke-width', strokeWidthScale(d.count) + 2).raise();
            
            if (typeof showTooltip === 'function') {
                const percentage = ((d.count / totalPatients) * 100).toFixed(1);
                
                showTooltip(event, `
                    <div style="font-family:sans-serif; min-width:180px;">
                        <div style="border-bottom:1px solid #ffffff; margin-bottom:6px; padding-bottom:4px;">
                            <strong style="font-size:13px; ">Patient Group</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px;">
                            <span>Count:</span> 
                            <strong>${d.count} (${percentage}%)</strong>
                        </div>
                        <div style="display:grid; grid-template-columns: 70px auto; gap:4px; font-size:12px;">
                            <span style="color:#fff;">Age:</span> <strong>${d.ageGroup}</strong>
                            <span style="color:#fff;">Admission:</span> <strong>${d.admissionType}</strong>
                            <span style="color:#fff;">Condition:</span> <strong>${d.medicalCondition}</strong>
                            <span style="color:#fff;">Outcome:</span> <strong style="color:${colorScale(d)}">${d.testResults}</strong>
                        </div>
                    </div>
                `);
            }
        })
        .on('mouseout', function(event, d) {
            d3.selectAll('.flow')
                .style('stroke', d => colorScale(d))
                .style('opacity', d => opacityScale(d.count))
                .style('stroke-width', d => strokeWidthScale(d.count));
            if (typeof hideTooltip === 'function') hideTooltip();
        });

    // 6. Update Axes
    const axisGroups = g.select('.layer-axes').selectAll('.axis-group').data(dimensions);
    axisGroups.exit().remove();
    const axisEnter = axisGroups.enter().append('g').attr('class', 'axis-group');

    axisGroups.merge(axisEnter)
        .attr('transform', d => `translate(${x(d.name)})`)
        .each(function(dim) {
            d3.select(this).call(d3.axisLeft(yScales[dim.name]));
            d3.select(this).selectAll('.domain').style('stroke', 'var(--text-primary)').style('stroke-width', 2);
            
            const label = d3.select(this).selectAll('.axis-label').data([dim]);
            label.enter().append('text').attr('class', 'axis-label').merge(label)
                .attr('y', -15).style('text-anchor', 'middle')
                .text(d => d.label).style('font-weight', 'bold').style('fill', 'var(--text-primary)')
                .style("text-shadow", "0px 1px 2px rgba(255,255,255,0.8)");

            d3.select(this).selectAll('.tick text')
                .style('fill', 'var(--text-primary)')
                .style('font-weight', '600')
                .style('cursor', 'pointer')
                .style("stroke", "#ffffff").style("stroke-width", "4px").style("paint-order", "stroke").style("stroke-opacity", "0.85")
                .on('mouseover', function() { d3.select(this).style('fill', '#000').style('font-size', '12px'); })
                .on('mouseout', function() { d3.select(this).style('fill', 'var(--text-primary)').style('font-size', '11px'); })
                .on('click', (event, textValue) => {
                    const filterKey = filterKeys[dim.name]; 
                    if(typeof setFilter === 'function') setFilter(filterKey, textValue);
                });
        });
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
    drawDiseaseTrendsChart();
    drawBloodTypeChart();
    drawLosBoxPlot();
    drawSeasonalityChart();
    drawParallelCoordinatesChart();
    

}