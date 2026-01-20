const tooltip = document.getElementById('tooltip');

function showTooltip(event, content) {
    tooltip.innerHTML = content;
    tooltip.className = 'tooltip visible';
    tooltip.style.left = (event.pageX + 10) + 'px';
    tooltip.style.top = (event.pageY - 10) + 'px';
}

function hideTooltip() {
    tooltip.className = 'tooltip';
}