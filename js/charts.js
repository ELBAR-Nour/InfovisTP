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

    // 1. Increased bottom margin to make room for the legend
    const margin = { top: 20, right: 20, bottom: 80, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    
    // Increased base height from 260 to 350
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
        .attr('fill', d => scheme[d.result]) // Use scheme colors
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

    /* =====================================================
       📝 LEGEND: Normal, Abnormal, Inconclusive
       ===================================================== */
    // 2. Calculate horizontal centering and position at the bottom
    const legendItemWidth = 100; // Approximate width of one legend item
    const totalLegendWidth = testResults.length * legendItemWidth;
    const legendStartX = (width - totalLegendWidth) / 2;

    const legendGroup = svg.append('g')
        .attr('transform', `translate(${legendStartX}, ${height + 50})`); // Position below the x-axis

    testResults.forEach((result, i) => {
        const item = legendGroup.append('g')
            .attr('transform', `translate(${i * legendItemWidth}, 0)`) // Horizontal layout
            .style('cursor', 'pointer');
            // .on('click', () => setFilter('testResult', result)); 

        item.append('circle')
            .attr('r', 5) // Slightly larger dots
            .attr('fill', scheme[result]);

        item.append('text')
            .attr('x', 12)
            .attr('y', 4)
            .text(result)
            .style('font-size', '12px') // Slightly larger text
            .style('font-weight', '500')
            .style('fill', 'var(--text-secondary)')
            .attr('alignment-baseline', 'middle');
    });
}

// ===== 3️⃣ Billing Histogram (Color Vision Adaptive) =====
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

    // --- 🎨 COLOR VISION LOGIC ---
    // Get the current scheme from the window global or the helper function
    const scheme = window.currentColorScheme || (typeof getColorScheme === 'function' ? getColorScheme() : null);
    
    // We prefer a neutral color from the scheme. 
    // Usually 'male' (often blueish) or 'Normal' (often greenish) works best as a primary chart color.
    // If the scheme exists, use 'male' color, otherwise fallback to standard blue.
    const barColor = scheme ? (scheme.male || scheme.Normal) : '#0ea5e9';

    // Safety check for empty data
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
        .style('stroke-dasharray', '3,3'); // Optional: makes grid dashed for better readability

    // --- Draw bars ---
    g.selectAll('rect')
        .data(bins)
        .enter()
        .append('rect')
        .attr('x', d => x(d.x0) + 1)
        .attr('y', d => y(d.length))
        .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 2))
        .attr('height', d => height - y(d.length))
        .attr('fill', barColor) // <--- Uses the dynamic color here
        .attr('rx', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.7); // Darken slightly on hover
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



// ===== 4️⃣ Age Pyramid (Fixed Scales) =====
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
    const centerGap = 25; // Gap on each side of the center line

    const y = d3.scaleBand()
        .domain(AGE_GROUPS)
        .range([0, height])
        .padding(0.2);

    // --- 🔴 FIX: Adjust Ranges to Account for Gap ---
    // Male Scale: 0 starts at (Center - Gap), Max extends to 0 (Left edge)
    const xMale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([width / 2 - centerGap, 0]);

    // Female Scale: 0 starts at (Center + Gap), Max extends to Width (Right edge)
    const xFemale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([width / 2 + centerGap, width]);

    // Center axis line
    svg.append('line')
        .attr('x1', width / 2)
        .attr('y1', 0)
        .attr('x2', width / 2)
        .attr('y2', height)
        .attr('stroke', 'var(--border-color)')
        .attr('stroke-width', 2);

    // Age labels (Centered)
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

    // --- Draw Male Bars (Left) ---
    svg.selectAll('.male-bar')
        .data(pyramidData)
        .enter()
        .append('rect')
        .attr('x', d => {
            if (d.male === 0) return width / 2 - centerGap; 
            // Calculate natural width
            let barW = (width / 2 - centerGap) - xMale(d.male);
            // Enforce minimum width
            barW = Math.max(barW, minBarWidth);
            // Shift x position left by the calculated width
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

    // --- Draw Female Bars (Right) ---
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

    // --- Labels (Counts) ---
    // Male Labels
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

    // --- Legend (Kept as is) ---
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

    // ---- UPDATED COLOR LOGIC ----
    const scheme = window.currentColorScheme || (typeof getColorScheme === 'function' ? getColorScheme() : COLORS);
    
    // Use the 'categorical' palette which guarantees distinct colors 
    // for up to 10 items, avoiding collisions in color-blind modes.
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

    // --- 1. CRITICAL: Custom Data Filtering ---
    // We filter allData manually here. We apply ALL filters (Hospital, Gender, etc.)
    // EXCEPT 'admissionYear'. This ensures all year lines remain visible for comparison.
    const comparisonData = allData.filter(r => {
        if (filters.testResult && r.testResults !== filters.testResult) return false;
        if (filters.medicalCondition && r.medicalCondition !== filters.medicalCondition) return false;
        if (filters.ageGroup && r.ageGroup !== filters.ageGroup) return false;
        if (filters.hospital && r.hospital !== filters.hospital) return false;
        if (filters.gender && r.gender !== filters.gender) return false;
        if (filters.bloodType && r.bloodType !== filters.bloodType) return false;
        // Note: We deliberately SKIP the admissionYear check here
        return true;
    });

    // --- 2. Data Grouping ---
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

    // --- 3. Scales ---
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

    // Check Active Filter (Convert to string to match your filter logic)
    const activeYear = filters.admissionYear ? String(filters.admissionYear) : null;

    // --- 4. Axes ---
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

    // --- 5. Drawing Lines with Interaction ---
    const years = svg.selectAll('.year-group')
        .data(parsedData)
        .enter()
        .append('g')
        .attr('class', 'year-group');

    // PATHS
    years.append('path')
        .attr('fill', 'none')
        .attr('stroke', d => colorScale(d.year))
        .attr('stroke-width', d => (activeYear && String(d.year) === activeYear) ? 4 : 2.5) // Thicker if active
        .attr('d', d => line(d.values))
        .attr('opacity', d => (activeYear && String(d.year) !== activeYear) ? 0.15 : 0.85) // Dim inactive
        .style('cursor', 'pointer')
        // INTERACTION: Click to filter
        .on('click', (event, d) => {
            // Convert to string to match your setFilter expectation
            setFilter('admissionYear', String(d.year));
        });

    // DOTS (Only show if no filter is active, OR if it matches the active filter)
    years.each(function(d) {
        const group = d3.select(this);
        const isSelected = activeYear && String(d.year) === activeYear;
        const isNoneSelected = !activeYear;

        // Only draw dots for the relevant lines to keep UI clean
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

    // --- 6. Interactive Legend ---
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

// ===== 7️⃣ Treemap: Gender → Blood Type → Medical Condition =====
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

    // 1️⃣ Data Preparation
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

    // 2️⃣ Improved Scale: sqrt exaggerates small differences
    const visualScale = d3.scaleSqrt()
        .domain([minVal, maxVal])
        .range([10, 50]); // visual weight

    // 3️⃣ Build hierarchy
    const hierarchyData = {
        name: 'Patients',
        children: groupedData.map(([gender, bloodGroups]) => ({
            name: gender,
            children: bloodGroups.map(([blood, conditions]) => ({
                name: blood,
                children: conditions.map(([condition, records]) => ({
                    name: condition,
                    realValue: records.length,
                    value: visualScale(records.length) // Sqrt-scaled
                }))
            }))
        }))
    };

    const root = d3.hierarchy(hierarchyData)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    // 4️⃣ Layout
    d3.treemap()
        .size([width, height])
        .paddingInner(1)
        .paddingOuter(2)
        .paddingTop(12)
        .tile(d3.treemapSquarify.ratio(1))
        (root);

    // 5️⃣ Color Logic
    const scheme = window.currentColorScheme || { male: '#0ea5e9', female: '#ec4899' };
    const allBloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    const bloodTypeShade = d3.scalePoint()
        .domain(allBloodTypes)
        .range([0.95, 0.4]);

    // 6️⃣ Draw Cells
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

    // 7️⃣ Labels
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

    // ---- DATA PROCESSING ----
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

    // ---- COLOR SCHEME UPDATE (FIX) ----
    // Use window.currentColorScheme or fallback to getColorScheme()
    const scheme = (window.currentColorScheme) 
        ? window.currentColorScheme 
        : (typeof getColorScheme === 'function' ? getColorScheme() : null);

    // Default palette if scheme is missing
    const palette = (scheme && scheme.categorical) 
        ? scheme.categorical 
        : ['#3b82f6', '#93c5fd']; // Fallback Blues

    // Use distinct colors for Min vs Range (e.g., Dark Blue vs Light Blue)
    // We use index 0 and index 2 to ensure good contrast
    const barMinColor = palette[0]; 
    const barRangeColor = palette[2] || palette[1]; 

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

    // ---- BARS ----
    const barGroup = svg.selectAll('.year-group')
        .data(dataByYear)
        .enter()
        .append('g')
        .attr('class', 'year-group')
        .attr('transform', d => `translate(${x(d.year)},0)`);

    // Bottom segment: Min Billing
    barGroup.append('rect')
        .attr('class', 'bar-min')
        .attr('x', 0)
        .attr('y', d => y(d.min))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.min))
        .attr('fill', barMinColor)
        .attr('rx', 4)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.8);
            showTooltip(event, `
                <strong>${selectedHospital}</strong><br/>
                Year: ${d.year}<br/>
                Min Billing: $${(d.min || 0).toLocaleString()}<br/>
                Records: ${d.count}
            `);
        })
        .on('mouseout', function() { d3.select(this).attr('opacity', 1); hideTooltip(); });

    // Top segment: Range (Max - Min)
    barGroup.append('rect')
        .attr('class', 'bar-range')
        .attr('x', 0)
        .attr('y', d => y(d.max))
        .attr('width', x.bandwidth())
        .attr('fill', barRangeColor)
        .attr('height', d => y(d.min) - y(d.max))
        .attr('rx', 4)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.8);
            showTooltip(event, `
                <strong>${selectedHospital}</strong><br/>
                Year: ${d.year}<br/>
                Max Billing: $${(d.max || 0).toLocaleString()}<br/>
                Range: $${(d.range || 0).toLocaleString()}
            `);
        })
        .on('mouseout', function() { d3.select(this).attr('opacity', 1); hideTooltip(); });

    // ---- LABELS ----
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

    // 1. Clear previous chart
    container.selectAll('*').remove();
    
    // Safety check: ensure data exists
    if (!filteredData || filteredData.length === 0) {
        container.append('p')
            .style('text-align', 'center')
            .style('padding', '40px')
            .style('color', 'var(--text-secondary)')
            .text('No data available for current filters.');
        return;
    }

    // 2. Dimensions
    const margin = { top: 60, right: 120, bottom: 60, left: 120 };
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right || 800;
    const height = 600 - margin.top - margin.bottom;

    /* =====================================================
       3. Data Processing & Frequency Calculation
       ===================================================== */
    const diseaseFreq = d3.rollup(filteredData, v => v.length, d => d.medicalCondition);
    const medicationFreq = d3.rollup(filteredData, v => v.length, d => d.medication);

    // Sort and get Top Items
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

    // Calculate Relationships (Links)
    const relationshipCounts = d3.rollup(
        filteredData.filter(d =>
            topDiseases.includes(d.medicalCondition) &&
            topMedications.includes(d.medication)
        ),
        v => v.length,
        d => d.medicalCondition,
        d => d.medication
    );

    /* =====================================================
       4. Scales & Axes
       ===================================================== */
    const leftAxisX = 0; 
    const rightAxisX = width;
    const axisHeight = height;

    // Y Position Scales
    const diseaseScale = d3.scalePoint()
        .domain(topDiseases)
        .range([0, axisHeight])
        .padding(0.5);

    const medicationScale = d3.scalePoint()
        .domain(topMedications)
        .range([0, axisHeight])
        .padding(0.5);

    // Node Size Scales (Sqrt for area)
    const diseaseSizeScale = d3.scaleSqrt()
        .domain([0, d3.max(topDiseases.map(d => diseaseFreq.get(d))) || 1])
        .range([5, 18]);

    const medicationSizeScale = d3.scaleSqrt()
        .domain([0, d3.max(topMedications.map(m => medicationFreq.get(m))) || 1])
        .range([5, 18]);

    /* =====================================================
       5. Color Palettes
       ===================================================== */
    const scheme = window.currentColorScheme || (typeof getColorScheme === 'function' ? getColorScheme() : {});
    
    // Helper to cycle colors if items > palette size
    function getColorList(items, paletteSource) {
        const result = [];
        const basePalette = paletteSource || ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
        for (let i = 0; i < items.length; i++) {
            result.push(basePalette[i % basePalette.length]);
        }
        return result;
    }

    const fullPalette = scheme.categorical || ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
    
    // Disease Colors
    const diseaseColorScale = d3.scaleOrdinal()
        .domain(topDiseases)
        .range(getColorList(topDiseases, fullPalette));

    // Medication Colors (Reversed palette for distinction)
    const medicationPalette = [...fullPalette].reverse();
    const medicationColorScale = d3.scaleOrdinal()
        .domain(topMedications)
        .range(getColorList(topMedications, medicationPalette));

    /* =====================================================
       6. SVG Setup
       ===================================================== */
    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    /* =====================================================
       7. Draw Links (Arcs)
       ===================================================== */
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
        // Hover Interaction
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
        // Click to Filter (Defaults to Medical Condition)
        .on('click', (event, d) => setFilter('medicalCondition', d.disease));

    /* =====================================================
       8. Draw Disease Nodes (Left)
       ===================================================== */
    const diseaseNodes = g.selectAll('.disease-node')
        .data(topDiseases)
        .enter()
        .append('g')
        .attr('transform', d => `translate(${leftAxisX},${diseaseScale(d)})`)
        .style('cursor', 'pointer')
        .on('click', (event, d) => setFilter('medicalCondition', d));

    // Dots
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

    // Labels
    diseaseNodes.append('text')
        .attr('x', -20)
        .attr('y', 5)
        .attr('text-anchor', 'end')
        .text(d => d.length > 20 ? d.slice(0, 18) + '…' : d)
        .style('font-size', '12px')
        .style('fill', 'var(--text-primary)')
        .style('font-weight', '500');

    /* =====================================================
       9. Draw Medication Nodes (Right) - [Interactive]
       ===================================================== */
    const medicationNodes = g.selectAll('.medication-node')
        .data(topMedications)
        .enter()
        .append('g')
        .attr('transform', d => `translate(${rightAxisX},${medicationScale(d)})`)
        .style('cursor', 'pointer')
        // CLICK TO FILTER BY MEDICATION
        .on('click', (event, d) => setFilter('medication', d));

    // Dots
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

    // Labels
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

    // 1. Dimensions adapted for side-by-side layout
    const containerWidth = container.clientWidth || 500; 
    const height = 320; 
    
    const margin = { top: 20, right: 60, bottom: 40, left: 130 };
    const width = containerWidth - margin.left - margin.right;

    // 2. Data Processing
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

    // 3. Setup SVG
    const svg = d3.select('#insurance-cost-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`) 
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // 4. Scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.avgCost) * 1.1]) 
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(data.map(d => d.provider))
        .range([0, height])
        .padding(0.3);

    // ==========================================
    // 5. ACCESSIBILITY INTEGRATION
    // ==========================================
    // Get the current color scheme (Normal, Protanopia, etc.)
    const scheme = window.currentColorScheme || (typeof getColorScheme === 'function' ? getColorScheme() : { categorical: ['#2563eb'] });
    
    // Use the 'categorical' palette defined in your module
    // We map the data index to the palette index using modulo (%) to loop if needed
    const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d.provider))
        .range(data.map((_, i) => scheme.categorical[i % scheme.categorical.length]));

    // 6. Grid Lines (Dashed & Subtle)
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

    // 7. Draw Bars
    g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', d => y(d.provider))
        .attr('width', d => x(d.avgCost))
        .attr('height', y.bandwidth())
        .attr('fill', d => colorScale(d.provider)) // Uses the accessible color
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

    // 8. Value Labels 
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

    // 9. Y Axis (Provider Names)
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

    // 10. X Axis Label
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
    
    // Check for data
    if (!filteredData || filteredData.length === 0) {
        container.innerHTML = '<div class="no-data">No data available</div>';
        return;
    }
    
    // 1. Accessibility: Get Dynamic Colors
    // Use accessible palette if available, otherwise fallback to the reference image colors (Teal & Maroon)
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
        .slice(0, 5); // Keep top 5
    
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
    
    // Y-Axis 1: Money (Bars) - Starts at 0
    const yBilled = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.totalBilled) * 1.1])
        .range([height, 0]);

    // Y-Axis 2: Patients (Line) - "Zoomed In" Scale
    // We calculate the exact min and max to tighten the view
    const minP = d3.min(data, d => d.patientCount);
    const maxP = d3.max(data, d => d.patientCount);
    const rangeP = maxP - minP;
    
    // Add a dynamic buffer (20% of the range) so points don't touch the absolute top/bottom
    // If range is 0 (all values same), default to +/- 5%
    const buffer = rangeP === 0 ? minP * 0.05 : rangeP * 0.2;
    
    const yPatients = d3.scaleLinear()
        .domain([minP - buffer, maxP + buffer])
        .range([height, 0]);

    // 6. Grid Lines (for Money axis)
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

    // 7. Bars (Billed Amounts)
    g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.provider))
        .attr('y', d => yBilled(d.totalBilled))
        .attr('width', x.bandwidth())
        .attr('height', d => height - yBilled(d.totalBilled))
        .attr('fill', barColor)
        .attr('rx', 0)
        .style('transition', 'opacity 0.2s')
        // INTERACTIVITY: Tooltip for Bars
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

    // 8. Line Path (Patient Count)
    const lineGenerator = d3.line()
        .x(d => x(d.provider) + x.bandwidth() / 2)
        .y(d => yPatients(d.patientCount))
        .curve(d3.curveMonotoneX); // Add slight curve for smoothness

    g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', lineColor)
        .attr('stroke-width', 2.5) // Slightly thicker line
        .attr('d', lineGenerator);

    // 9. Line Points (Interactivity)
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
        // INTERACTIVITY: Tooltip for Line Points
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
    // Inside Bars (Money)
    g.selectAll('.label-money')
        .data(data)
        .enter()
        .append('text')
        .attr('x', d => x(d.provider) + x.bandwidth() / 2)
        .attr('y', d => yBilled(d.totalBilled) + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(255,255,255,0.9)')
        .attr('font-size', '10px')
        .style('pointer-events', 'none')
        .text(d => `$${(d.totalBilled / 1000000).toFixed(1)}M`);

    // Above Line Points (Patients)
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
    // X Axis
    g.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'rotate(-30)')
        .style('text-anchor', 'end')
        .style('font-size', '12px')
        .style('fill', 'var(--text-secondary, #4b5563)');

    // Y Axis Left (Money)
    g.append('g')
        .call(d3.axisLeft(yBilled).ticks(5).tickFormat(d => `${d/1000000}M`))
        .select('.domain').remove();

    // Y Axis Right (Patients)
    g.append('g')
        .attr('transform', `translate(${width}, 0)`)
        .call(d3.axisRight(yPatients).ticks(5).tickFormat(d => `${d/1000}k`))
        .select('.domain').remove();
        
    // Label for Right Axis
    g.append('text')
        .attr('transform', 'rotate(90)')
        .attr('y', -width - 45) // Adjust based on margin
        .attr('x', height / 2)
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('fill', lineColor)
        .style('font-size', '11px')
        .text('Total billed patients');

    // 12. Legend
    const legend = svg.append('g')
        .attr('transform', `translate(${margin.left}, 20)`);
    
    // Legend Item 1: Billed amounts
    legend.append('rect').attr('x', 0).attr('y', 0).attr('width', 12).attr('height', 12).attr('fill', barColor);
    legend.append('text').attr('x', 18).attr('y', 10).text('Billed amounts').style('font-size', '13px').style('fill', textColor);
    
    // Legend Item 2: Total billed patients
    const legend2X = 140;
    legend.append('line').attr('x1', legend2X).attr('x2', legend2X + 20).attr('y1', 6).attr('y2', 6).attr('stroke', lineColor).attr('stroke-width', 2);
    legend.append('circle').attr('cx', legend2X + 10).attr('cy', 6).attr('r', 3).attr('fill', lineColor);
    legend.append('text').attr('x', legend2X + 25).attr('y', 10).text('Total billed patients').style('font-size', '13px').style('fill', textColor);
}

// ===== Insurance Provider Performance: Bar + Line Chart =====
function drawInsurancePerformanceChart() {
    const container = document.getElementById('insurance-performance-chart');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Check for data
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
        .slice(0, 5); // Keep top 5
    
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
    
    // Y-Axis 1: Money (Bars) - "Zoomed In" Scale
    // Calculate min/max to adjust the scale, making differences more visible
    const minBilled = d3.min(data, d => d.totalBilled);
    const maxBilled = d3.max(data, d => d.totalBilled);
    const rangeBilled = maxBilled - minBilled;
    const bufferBilled = rangeBilled === 0 ? minBilled * 0.02 : rangeBilled * 0.1; // Add a small buffer

    const yBilled = d3.scaleLinear()
        .domain([minBilled - bufferBilled, maxBilled + bufferBilled])
        .range([height, 0]);

    // Y-Axis 2: Patients (Line) - "Zoomed In" Scale
    const minP = d3.min(data, d => d.patientCount);
    const maxP = d3.max(data, d => d.patientCount);
    const rangeP = maxP - minP;
    const bufferP = rangeP === 0 ? minP * 0.05 : rangeP * 0.2;
    
    const yPatients = d3.scaleLinear()
        .domain([minP - bufferP, maxP + bufferP])
        .range([height, 0]);

    // 6. Grid Lines (for Money axis)
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

    // 7. Bars (Billed Amounts)
    g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.provider))
        .attr('y', d => yBilled(d.totalBilled))
        .attr('width', x.bandwidth())
        // Ensure height is not negative if yBilled returns a value > height
        .attr('height', d => Math.max(0, height - yBilled(d.totalBilled)))
        .attr('fill', barColor)
        .attr('rx', 0)
        .style('transition', 'opacity 0.2s')
        // INTERACTIVITY: Tooltip for Bars
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

    // 8. Line Path (Patient Count)
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

    // 9. Line Points (Interactivity)
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
        // INTERACTIVITY: Tooltip for Line Points
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
    // Above Line Points (Patients) - REMOVED Bar labels
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
    // X Axis
    g.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'rotate(-30)')
        .style('text-anchor', 'end')
        .style('font-size', '12px')
        .style('fill', 'var(--text-secondary, #4b5563)');

    // Y Axis Left (Money)
    g.append('g')
        .call(d3.axisLeft(yBilled).ticks(5).tickFormat(d => `${(d/1000000).toFixed(1)}M`))
        .select('.domain').remove();

    // Y Axis Right (Patients)
    g.append('g')
        .attr('transform', `translate(${width}, 0)`)
        .call(d3.axisRight(yPatients).ticks(5).tickFormat(d => `${d/1000}k`))
        .select('.domain').remove();
        
    // Label for Right Axis
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
    
    // Legend Item 1: Billed amounts
    legend.append('rect').attr('x', 0).attr('y', 0).attr('width', 12).attr('height', 12).attr('fill', barColor);
    legend.append('text').attr('x', 18).attr('y', 10).text('Billed amounts').style('font-size', '13px').style('fill', textColor);
    
    // Legend Item 2: Total billed patients
    const legend2X = 140;
    legend.append('line').attr('x1', legend2X).attr('x2', legend2X + 20).attr('y1', 6).attr('y2', 6).attr('stroke', lineColor).attr('stroke-width', 2);
    legend.append('circle').attr('cx', legend2X + 10).attr('cy', 6).attr('r', 3).attr('fill', lineColor);
    legend.append('text').attr('x', legend2X + 25).attr('y', 10).text('Total billed patients').style('font-size', '13px').style('fill', textColor);
}

// ===== 6️⃣ Blood Type Distribution (Vision-Accessible + Consistent Tooltip) =====
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
        .range(categorical); // Maps colors in order

    // --- Generators ---
    const pie = d3.pie().value(d => d.count).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius - 10);
    const hoverArc = d3.arc().innerRadius(0).outerRadius(radius); // Pop effect

    // --- Draw Slices ---
    svg.selectAll('path')
        .data(pie(data))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => colorScale(d.data.type))
        .attr('stroke', scheme === 'achromatopsia' ? '#000' : '#fff') // Black border for mono, white otherwise
        .attr('stroke-width', 2)
        .attr('opacity', 0.9)
        .style('cursor', 'pointer')
        // --- 1. MOUSEOVER: Use global showTooltip ---
        .on('mouseover', function(event, d) {
            // Animation
            d3.select(this).transition().duration(200).attr('d', hoverArc).attr('opacity', 1);
            
            // Calculate Percentage
            const percent = ((d.data.count / filteredData.length) * 100).toFixed(1);
            
            // Call the shared tooltip function (Matches Donut Chart style)
            // You can use HTML here if your showTooltip supports it, or plain text
            showTooltip(event, `Type ${d.data.type}: ${d.data.count} (${percent}%)`);
        })
        // --- 2. MOUSEOUT: Use global hideTooltip ---
        .on('mouseout', function() {
            d3.select(this).transition().duration(200).attr('d', arc).attr('opacity', 0.9);
            hideTooltip();
        })
        .on('click', (event, d) => setFilter('bloodType', d.data.type));

    // --- Legend ---
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

    // 1️⃣ Get current vision-friendly color scheme
    const scheme = window.currentColorScheme || (typeof getColorScheme === 'function' ? getColorScheme() : { categorical: [] });

    // 2️⃣ Setup dimensions
    const margin = { top: 20, right: 140, bottom: 40, left: 50 }; // Increased left margin for Y-axis visibility
    const width = container.clientWidth - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    // ➤ INTERACTIVITY: Background Click to Clear Filter
    // We add this rect BEHIND everything else to catch clicks on empty space
    svg.append('rect')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('fill', 'transparent')
        .style('cursor', 'default')
        .on('click', () => {
            // Clear the medical condition filter when clicking empty space
            if (typeof setFilter === 'function') setFilter('medicalCondition', null);
        });

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // 3️⃣ Process data
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

    // 4️⃣ Dynamic Color Assignment
    const palette = scheme.categorical && scheme.categorical.length > 0 
        ? scheme.categorical 
        : ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
    
    const conditionColors = {};
    conditions.forEach((cond, i) => {
        conditionColors[cond] = palette[i % palette.length];
    });

    // 5️⃣ Prepare series data
    const seriesData = conditions.map(condition => {
        const conditionRecords = validRecords.filter(d => d.medicalCondition === condition);
        const values = allYears.map(year => ({
            year,
            count: conditionRecords.filter(d => d.dateOfAdmission.getFullYear() === year).length,
            condition
        }));
        return { name: condition, values };
    });

    // 6️⃣ Scales
    const xScale = d3.scaleLinear().domain([minYear, maxYear]).range([0, width]);

    // Calculate Zoomed Y-Scale
    const allCounts = seriesData.flatMap(s => s.values.map(d => d.count));
    const yMin = d3.min(allCounts) || 0;
    const yMax = d3.max(allCounts) || 10;
    
    // Add 10% buffer
    const range = yMax - yMin;
    const buffer = range === 0 ? (yMin * 0.1 || 1) : range * 0.1;

    const yScale = d3.scaleLinear()
        .domain([Math.max(0, yMin - buffer), yMax + buffer]) 
        .range([height, 0]);

    // 7️⃣ Axes (Explicitly drawing the Y Axis Line)
    
    // X-Axis
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(allYears.length).tickFormat(d3.format('d')))
        .attr('font-size', '11px')
        .attr('color', 'var(--text-secondary)');

    // Y-Axis
    const yAxisGroup = g.append('g')
        .call(d3.axisLeft(yScale).ticks(5));

    // ➤ VISUAL: Style the Y-Axis
    yAxisGroup.selectAll('text').attr('fill', 'var(--text-secondary)');
    yAxisGroup.selectAll('line').attr('stroke', 'var(--border-color)'); // Ticks
    yAxisGroup.select('.domain').attr('stroke', 'var(--border-color)').attr('stroke-width', 1); // Main Axis Line

    // Optional: Add horizontal grid lines for readability
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

    // ➤ INTERACTIVITY: Path Click
    lines.append('path')
        .attr('d', d => lineGenerator(d.values))
        .attr('fill', 'none')
        .attr('stroke', d => conditionColors[d.name]) 
        .attr('stroke-width', 3) // Thicker for easier clicking
        .attr('opacity', 0.9)
        .style('cursor', 'pointer')
        .on('mouseover', function() { d3.select(this).attr('stroke-width', 5); })
        .on('mouseout', function() { d3.select(this).attr('stroke-width', 3); })
        .on('click', (event, d) => {
            event.stopPropagation(); // Stop click from hitting the background
            if (typeof setFilter === 'function') setFilter('medicalCondition', d.name);
        });

    // 9️⃣ Draw dots
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

    // 🔟 Legend
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
    

}