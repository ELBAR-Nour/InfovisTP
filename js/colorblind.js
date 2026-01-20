// ===== Color Blindness Accessibility Module =====

const COLOR_SCHEMES = {
    normal: {
        // Standard Semantic Colors
        Normal: '#22c55e',       // Green
        Abnormal: '#ef4444',     // Red
        Inconclusive: '#f59e0b', // Amber
        male: '#0ea5e9',         // Blue
        female: '#ec4899',       // Pink
        categorical: [
            '#3b82f6', // Bright Blue
            '#ef4444', // Red
            '#10b981', // Emerald
            '#f59e0b', // Amber
            '#8b5cf6', // Violet
            '#ec4899', // Pink
            '#06b6d4', // Cyan
            '#f97316', // Orange
            '#6366f1', // Indigo
            '#84cc16'  // Lime
        ]
    },
    protanopia: {
        // Red-blind: Avoid Red/Green. Use Blue/Yellow/Grays.
        Normal: '#0ea5e9',       // Blue
        Abnormal: '#6b21a8',     // Purple 
        Inconclusive: '#f59e0b', // Yellow
        male: '#0ea5e9',
        female: '#f59e0b',
        categorical: [
            '#0077b6', // Deep Blue
            '#ffd166', // Soft Yellow
            '#0096c7', // Cyan-Blue
            '#48cae4', // Sky Blue
            '#ffb703', // Gold
            '#6b21a8', // Deep Purple
            '#a0a0a0', // Gray
            '#023e8a'  // Navy
        ]
    },
    deuteranopia: {
        Normal: '#0ea5e9',
        Abnormal: '#dc2626',
        Inconclusive: '#f59e0b',
        male: '#0ea5e9',
        female: '#dc2626',
        categorical: [
            '#0077b6', // Strong Blue
            '#ffc300', // Vivid Yellow
            '#00b4d8', // Light Blue
            '#fb8500', // Orange-Gold
            '#3d5a80', // Dark Blue-Gray
            '#e07a5f', // Terra Cotta
            '#98c1d9', // Pale Blue
            '#293241'  // Dark Gunmetal
        ]
    },
    tritanopia: {
        Normal: '#008080',       // Teal 
        Abnormal: '#dc2626',     // Red
        Inconclusive: '#9333ea', // Purple
        male: '#008080',
        female: '#dc2626',
        categorical: [
            '#d90429', // Vivid Red
            '#8d99ae', // Cool Gray
            '#2b2d42', // Dark Gray/Black
            '#ef233c', // Pinkish Red
            '#0081a7', // Teal
            '#00afb9', // Cyan
            '#fdfcdc', // Very Light Beige (Contrast)
            '#f07167'  // Salmon
        ]
    },
    achromatopsia: {
        Normal: '#404040',
        Abnormal: '#000000',
        Inconclusive: '#9ca3af',
        male: '#1f2937',
        female: '#9ca3af',
        categorical: [
            '#000000', // Black
            '#525252', // Dark Gray
            '#a3a3a3', // Mid Gray
            '#d4d4d4', // Light Gray
            '#262626', // Almost Black
            '#737373', // Mid-Dark Gray
            '#e5e5e5', // Very Light Gray
            '#171717'  // Ink
        ]
    }
};

// Get current vision type from localStorage or default to normal
function getVisionType() {
    return localStorage.getItem('visionType') || 'normal';
}

// Get color scheme for current vision type
function getColorScheme() {
    const visionType = getVisionType();
    return COLOR_SCHEMES[visionType] || COLOR_SCHEMES.normal;
}

// Set vision type and update colors
function setVisionType(visionType) {
    localStorage.setItem('visionType', visionType);
    updateAllChartColors();
}

// Update COLORS object and refresh all charts
function updateAllChartColors() {
    try {
        const scheme = getColorScheme();
        
        if (typeof COLORS !== 'undefined') {
            COLORS.Normal = scheme.Normal;
            COLORS.Abnormal = scheme.Abnormal;
            COLORS.Inconclusive = scheme.Inconclusive;
            COLORS.male = scheme.male;
            COLORS.female = scheme.female;
        }
        
        window.currentColorScheme = scheme;
        
        const app = document.getElementById('app');
        if (!app || app.style.display === 'none') {
            return;
        }
        

        setTimeout(() => {
            try {
                if (typeof updateCharts === 'function' && typeof filteredData !== 'undefined') {
                    updateCharts();
                }
            } catch (error) {
                console.error('Error updating charts:', error);
            }
            
            try {
                if (typeof updateMapLegend === 'function') {
                    updateMapLegend();
                }
            } catch (error) {
                console.error('Error updating map legend:', error);
            }
            
            try {
                if (typeof updateHospitalMap === 'function') {
                    updateHospitalMap();
                }
            } catch (error) {
                console.error('Error updating hospital map:', error);
            }
        }, 10); 
    } catch (error) {
        console.error('Error in updateAllChartColors:', error);
    }
}

// Show color blindness modal
function showColorBlindModal() {
    const modal = document.getElementById('colorblind-modal');
    if (modal) {
        modal.style.pointerEvents = 'auto';
        modal.classList.add('active');
        modal.style.zIndex = '9999';
        document.body.style.overflow = 'hidden';
        
        const currentVision = getVisionType();
        const radio = document.querySelector(`input[name="vision-type"][value="${currentVision}"]`);
        if (radio) {
            radio.checked = true;
        }
    }
}

// Hide color blindness modal
function hideColorBlindModal() {
    const modal = document.getElementById('colorblind-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        modal.style.pointerEvents = 'none';
    }
}

// Confirm vision type and proceed
function confirmVisionType() {
    const selected = document.querySelector('input[name="vision-type"]:checked');
    if (!selected) {
        return; 
    }
    
    const visionType = selected.value;
    const isFirstTime = !localStorage.getItem('visionType');
    hideColorBlindModal();
    
    // Update vision type and colors
    setVisionType(visionType);
    
    if (isFirstTime) {
        loadData();
    }
}

// Allow user to change vision type from header
function openVisionSettings() {
    try {
        showColorBlindModal();
    } catch (error) {
        console.error('Error opening vision settings:', error);
        const modal = document.getElementById('colorblind-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
}
