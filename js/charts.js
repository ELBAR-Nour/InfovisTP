// ---- Charts.js ----

// 1️⃣ Donut Chart: Test Results
function drawDonutChart() {
    const container = d3.select('#donut-chart');
    container.html('');
    const width = 280, height = 280, radius = Math.min(width, height) / 2 - 20;

    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width/2}, ${height/2})`);

    const resultCounts = d3.rollup(filteredData, v => v.length, d => d.testResults);
    const pieData = Array.from(resultCounts, ([key, value]) => ({ key, value }));
    
    if (pieData.length === 0) {
        svg.append('text')
            .attr('text-anchor','middle')
            .style('font-size','14px')
            .style('fill','#999')
            .text('No data');
        return;
    }
    
    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(radius*0.6).outerRadius(radius);
    const hoverArc = d3.arc().innerRadius(radius*0.6).outerRadius(radius + 15);

    const arcs = svg.selectAll('.arc')
        .data(pie(pieData), (d, i) => d.data ? d.data.key : i)
        .enter()
        .append('g').attr('class', 'arc');

    arcs.append('path')
        .attr('d', arc)
        .attr('fill', d => COLORS[d.data.key] || '#ccc')
        .style('cursor', 'pointer')
        .on('click', d => { if (d.data) setFilter('testResult', d.data.key); })
        .on('mouseover', function(event, d) {
            if (!d.data) return;
            d3.select(this)
                .transition()
                .duration(200)
                .attr('d', hoverArc);
            if (typeof showTooltip === 'function') {
                const total = d3.sum(pieData, p => p.value);
                const pct = ((d.data.value / total) * 100).toFixed(1);
                showTooltip(event, `${d.data.key}: ${d.data.value.toLocaleString()} (${pct}%)`);
            }
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('d', arc);
            if (typeof hideTooltip === 'function') hideTooltip();
        })
        .attr('stroke', d => d.data && filters.testResult === d.data.key ? '#000' : null)
        .attr('stroke-width', d => d.data && filters.testResult === d.data.key ? 2 : 0);

    svg.append('text')
        .attr('text-anchor','middle')
        .attr('dy','-0.2em')
        .style('font-size','2rem')
        .style('font-weight','700')
        .style('fill','#0f172a')
        .text(d3.sum(pieData,d=>d.value));

    svg.append('text')
        .attr('text-anchor','middle')
        .attr('dy','1.5em')
        .style('font-size','0.875rem')
        .style('fill','#64748b')
        .text('Total Tests');

    // Legend below chart
    const legend = d3.select('#donut-legend');
    legend.selectAll('*').remove();
    ['Normal', 'Abnormal', 'Inconclusive'].forEach(result => {
        const item = legend.append('div')
            .attr('class', 'legend-item')
            .style('display', 'inline-flex')
            .style('align-items', 'center')
            .style('gap', '8px')
            .style('padding', '8px 16px')
            .style('cursor', 'pointer')
            .style('border-radius', '6px')
            .style('transition', 'background 0.2s')
            .on('click', () => setFilter('testResult', result))
            .on('mouseover', function() {
                d3.select(this).style('background', '#f1f5f9');
            })
            .on('mouseout', function() {
                d3.select(this).style('background', 'none');
            });
        
        item.append('span')
            .style('width', '12px')
            .style('height', '12px')
            .style('border-radius', '2px')
            .style('background', COLORS[result] || '#ccc')
            .style('display', 'inline-block');
        
        item.append('span')
            .style('font-size', '14px')
            .style('font-weight', '500')
            .style('color', '#0f172a')
            .text(result);
    });
}

// 2️⃣ Conditions vs Test Results
function drawConditionsChart() {
    const container = d3.select('#conditions-chart');
    container.html('');
    const margin = {top: 20, right: 20, bottom: 60, left: 50};
    const width = container.node().clientWidth - margin.left - margin.right;
    const height = 260 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const conditions = [...new Set(allData.map(d=>d.medicalCondition))];
    const testResults = ['Normal','Abnormal','Inconclusive'];

    const groupedData = conditions.map(condition=>{
        const data = filteredData.filter(d=>d.medicalCondition===condition);
        return { condition, Normal: data.filter(d=>d.testResults==='Normal').length,
                 Abnormal: data.filter(d=>d.testResults==='Abnormal').length,
                 Inconclusive: data.filter(d=>d.testResults==='Inconclusive').length };
    });

    const x0 = d3.scaleBand().domain(groupedData.map(d=>d.condition))
        .range([0,width]).padding(0.2);
    const x1 = d3.scaleBand().domain(testResults).range([0,x0.bandwidth()]).padding(0.05);
    const y = d3.scaleLinear().domain([0,d3.max(groupedData,d=>Math.max(d.Normal,d.Abnormal,d.Inconclusive))||0])
        .nice().range([height,0]);

    svg.append('g').attr('transform',`translate(0,${height})`).call(d3.axisBottom(x0))
        .selectAll('text').attr('transform','rotate(-25)').style('text-anchor','end');
    svg.append('g').call(d3.axisLeft(y).ticks(5));

    const conditionGroups = svg.selectAll('.condition-group')
        .data(groupedData).enter()
        .append('g').attr('transform', d=>`translate(${x0(d.condition)},0)`);

    conditionGroups.selectAll('rect')
        .data(d=>testResults.map(r=>({result:r,value:d[r],condition:d.condition})))
        .enter().append('rect')
        .attr('x',d=>x1(d.result))
        .attr('y',d=>y(d.value))
        .attr('width',x1.bandwidth())
        .attr('height',d=>height-y(d.value))
        .attr('fill',d=>COLORS[d.result])
        .style('cursor','pointer')
        .on('click',d=>setFilter('medicalCondition',d.condition))
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.8);
            if (typeof showTooltip === 'function') showTooltip(event, `${d.condition} - ${d.result}: ${d.value}`);
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            if (typeof hideTooltip === 'function') hideTooltip();
        })
        .attr('stroke', d => filters.medicalCondition === d.condition ? '#000' : null)
        .attr('stroke-width', d => filters.medicalCondition === d.condition ? 2 : 0);
}

// 3️⃣ Billing Histogram
function drawBillingChart() {
    const container = d3.select('#billing-chart');
    container.html('');
    const margin = {top:20,right:30,bottom:50,left:70};
    const width = container.node().clientWidth - margin.left - margin.right;
    const height = 260 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width',width+margin.left+margin.right)
        .attr('height',height+margin.top+margin.bottom)
        .append('g')
        .attr('transform',`translate(${margin.left},${margin.top})`);

    const billing = filteredData.map(d=>d.billingAmount);
    const x = d3.scaleLinear().domain([0,d3.max(billing)||50000]).range([0,width]);
    const histogram = d3.bin().value(d=>d).domain(x.domain()).thresholds(x.ticks(20));
    const bins = histogram(billing);
    const y = d3.scaleLinear().domain([0,d3.max(bins,d=>d.length)||0]).nice().range([height,0]);

    // Grid lines
    svg.append('g')
        .attr('class','grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''));

    // X axis
    svg.append('g')
        .attr('transform',`translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d=>`$${(d/1000).toFixed(0)}k`))
        .style('font-size','12px');

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#64748b')
        .text('Billing Amount');

    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y).ticks(5))
        .style('font-size','12px');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#64748b')
        .text('Frequency');

    svg.selectAll('rect').data(bins).enter().append('rect')
        .attr('x',d=>x(d.x0)+1)
        .attr('y',d=>y(d.length))
        .attr('width',d=>Math.max(0,x(d.x1)-x(d.x0)-2))
        .attr('height',d=>height-y(d.length))
        .attr('fill','#0ea5e9')
        .attr('rx',2)
        .style('cursor','pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.8);
            if (typeof showTooltip === 'function') {
                showTooltip(event, `$${Math.round(d.x0).toLocaleString()} - $${Math.round(d.x1).toLocaleString()}: ${d.length} patients`);
            }
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            if (typeof hideTooltip === 'function') hideTooltip();
        });
}

// 4️⃣ Age Pyramid
function drawPyramidChart() {
    const container = d3.select('#pyramid-chart');
    container.html('');
    const margin={top:20,right:60,bottom:30,left:60};
    const width=container.node().clientWidth-margin.left-margin.right;
    const height=260-margin.top-margin.bottom;

    const svg=container.append('svg')
        .attr('width',width+margin.left+margin.right)
        .attr('height',height+margin.top+margin.bottom)
        .append('g').attr('transform',`translate(${margin.left},${margin.top})`);

    const pyramidData = AGE_GROUPS.map(group=>{
        const gdata = filteredData.filter(d=>d.ageGroup===group);
        return {ageGroup:group,male:gdata.filter(d=>d.gender==='Male').length,female:gdata.filter(d=>d.gender==='Female').length};
    });

    const maxCount = d3.max(pyramidData,d=>Math.max(d.male,d.female))||0;
    const y = d3.scaleBand().domain(AGE_GROUPS).range([0,height]).padding(0.2);
    const xMale=d3.scaleLinear().domain([0,maxCount]).range([width/2,0]);
    const xFemale=d3.scaleLinear().domain([0,maxCount]).range([width/2,width]);

    // Center axis
    svg.append('line')
        .attr('x1',width/2).attr('y1',0).attr('x2',width/2).attr('y2',height)
        .attr('stroke','#e2e8f0').attr('stroke-width',2);

    // Male bars
    svg.selectAll('.male-bar').data(pyramidData).enter().append('rect')
        .attr('x',d=>xMale(d.male))
        .attr('y',d=>y(d.ageGroup))
        .attr('width',d=>Math.max(0, width/2-xMale(d.male)-25))
        .attr('height',y.bandwidth())
        .attr('fill','#0ea5e9')
        .attr('rx',4)
        .style('cursor','pointer')
        .on('click', d => setFilter('ageGroup', d.ageGroup))
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.8);
            if (typeof showTooltip === 'function') showTooltip(event, `${d.ageGroup} Male: ${d.male}`);
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            if (typeof hideTooltip === 'function') hideTooltip();
        })
        .attr('stroke', d => filters.ageGroup === d.ageGroup ? '#000' : null)
        .attr('stroke-width', d => filters.ageGroup === d.ageGroup ? 2 : 0);

    // Female bars
    svg.selectAll('.female-bar').data(pyramidData).enter().append('rect')
        .attr('x',width/2+25)
        .attr('y',d=>y(d.ageGroup))
        .attr('width',d=>Math.max(0, xFemale(d.female)-width/2-25))
        .attr('height',y.bandwidth())
        .attr('fill','#ec4899')
        .attr('rx',4)
        .style('cursor','pointer')
        .on('click', d => setFilter('ageGroup', d.ageGroup))
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.8);
            if (typeof showTooltip === 'function') showTooltip(event, `${d.ageGroup} Female: ${d.female}`);
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            if (typeof hideTooltip === 'function') hideTooltip();
        })
        .attr('stroke', d => filters.ageGroup === d.ageGroup ? '#000' : null)
        .attr('stroke-width', d => filters.ageGroup === d.ageGroup ? 2 : 0);
}

// ---- Update All Charts ----
function updateCharts() {
    drawDonutChart();
    drawConditionsChart();
    drawBillingChart();
    drawPyramidChart();
}
