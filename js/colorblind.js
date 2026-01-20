
const COLOR_SCHEMES = {
    normal: {
        Normal: '#22c55e',       
        Abnormal: '#ef4444',     
        Inconclusive: '#f59e0b', 
        male: '#0ea5e9',         
        female: '#ec4899',       
        categorical: [
            '#3b82f6', 
            '#ef4444', 
            '#10b981', 
            '#f59e0b', 
            '#8b5cf6', 
            '#ec4899', 
            '#06b6d4', 
            '#f97316', 
            '#6366f1', 
            '#84cc16'  
        ]
    },
    protanopia: {
        Normal: '#0ea5e9',      
        Abnormal: '#6b21a8',    
        Inconclusive: '#f59e0b', 
        male: '#0ea5e9',
        female: '#f59e0b',
        categorical: [
            '#0077b6', 
            '#ffd166', 
            '#0096c7', 
            '#48cae4', 
            '#ffb703', 
            '#6b21a8', 
            '#a0a0a0', 
            '#023e8a'  
        ]
    },
    deuteranopia: {
        Normal: '#0ea5e9',
        Abnormal: '#dc2626',
        Inconclusive: '#f59e0b',
        male: '#0ea5e9',
        female: '#dc2626',
        categorical: [
            '#0077b6', 
            '#ffc300', 
            '#00b4d8', 
            '#fb8500', 
            '#3d5a80', 
            '#e07a5f', 
            '#98c1d9', 
            '#293241'  
        ]
    },
    tritanopia: {
        Normal: '#008080',       
        Abnormal: '#dc2626',     
        Inconclusive: '#9333ea', 
        male: '#008080',
        female: '#dc2626',
        categorical: [
            '#d90429', 
            '#8d99ae', 
            '#2b2d42', 
            '#ef233c', 
            '#0081a7', 
            '#00afb9', 
            '#fdfcdc', 
            '#f07167'  
        ]
    },
    achromatopsia: {
        Normal: '#404040',
        Abnormal: '#000000',
        Inconclusive: '#9ca3af',
        male: '#1f2937',
        female: '#9ca3af',
        categorical: [
            '#000000', 
            '#525252', 
            '#a3a3a3', 
            '#d4d4d4', 
            '#262626', 
            '#737373', 
            '#e5e5e5', 
            '#171717'  
        ]
    }
};

function getVisionType() {
    return localStorage.getItem('visionType') || 'normal';
}

function getColorScheme() {
    const visionType = getVisionType();
    return COLOR_SCHEMES[visionType] || COLOR_SCHEMES.normal;
}

function setVisionType(visionType) {
    localStorage.setItem('visionType', visionType);
    updateAllChartColors();
}

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

function hideColorBlindModal() {
    const modal = document.getElementById('colorblind-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        modal.style.pointerEvents = 'none';
    }
}

function confirmVisionType() {
    const selected = document.querySelector('input[name="vision-type"]:checked');
    if (!selected) {
        return; 
    }
    
    const visionType = selected.value;
    const isFirstTime = !localStorage.getItem('visionType');
    
    hideColorBlindModal();
    
    setVisionType(visionType);
    
    if (isFirstTime) {
        loadData();
    }
}


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