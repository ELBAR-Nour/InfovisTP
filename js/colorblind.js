// ===== Color Blindness Accessibility Module =====

// Optimized color palettes for different vision types
const COLOR_SCHEMES = {
    normal: {
        Normal: '#22c55e',
        Abnormal: '#ef4444',
        Inconclusive: '#f59e0b',
        male: '#0ea5e9',
        female: '#ec4899'
    },
    protanopia: {
        // Red-blind: Use blue, yellow, purple instead of red/green
        Normal: '#0ea5e9',
        Abnormal: '#6b21a8',
        Inconclusive: '#f59e0b',
        male: '#0ea5e9',
        female: '#f59e0b'
    },
    deuteranopia: {
        // Green-blind: Use blue, red, yellow instead
        Normal: '#0ea5e9',
        Abnormal: '#dc2626',
        Inconclusive: '#f59e0b',
        male: '#0ea5e9',
        female: '#dc2626'
    },
    tritanopia: {
        // Blue-yellow blind: Use blue, red, purple
        Normal: '#0ea5e9',
        Abnormal: '#dc2626',
        Inconclusive: '#9333ea',
        male: '#0ea5e9',
        female: '#dc2626'
    },
    achromatopsia: {
        // Complete color blindness: Use grayscale with clear contrasts
        Normal: '#404040',
        Abnormal: '#1f2937',
        Inconclusive: '#9ca3af',
        male: '#1f2937',
        female: '#9ca3af'
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
        
        // Update global COLORS object immediately
        if (typeof COLORS !== 'undefined') {
            COLORS.Normal = scheme.Normal;
            COLORS.Abnormal = scheme.Abnormal;
            COLORS.Inconclusive = scheme.Inconclusive;
        }
        
        // Check if app is visible and ready
        const app = document.getElementById('app');
        if (!app || app.style.display === 'none') {
            // App not ready yet, colors will be applied when data loads
            return;
        }
        
        // Update charts asynchronously to avoid blocking UI
        // Use setTimeout with 0 delay to allow browser to process pending events
        setTimeout(() => {
            try {
                // Refresh all charts if they exist and are ready
                if (typeof updateCharts === 'function' && typeof filteredData !== 'undefined') {
                    updateCharts();
                }
            } catch (error) {
                console.error('Error updating charts:', error);
            }
            
            // Refresh map legend if it exists
            try {
                if (typeof updateMapLegend === 'function') {
                    updateMapLegend();
                }
            } catch (error) {
                console.error('Error updating map legend:', error);
            }
            
            // Refresh map asynchronously (it's already async)
            try {
                if (typeof updateHospitalMap === 'function') {
                    updateHospitalMap();
                }
            } catch (error) {
                console.error('Error updating hospital map:', error);
            }
        }, 10); // Small delay to ensure UI is responsive
    } catch (error) {
        console.error('Error in updateAllChartColors:', error);
    }
}

// Show color blindness modal
function showColorBlindModal() {
    const modal = document.getElementById('colorblind-modal');
    if (modal) {
        // Ensure pointer events are enabled
        modal.style.pointerEvents = 'auto';
        modal.classList.add('active');
        // Set the modal to be displayed on top
        modal.style.zIndex = '9999';
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
        
        // Set the currently selected vision type in the radio buttons
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
        // Restore body scrolling
        document.body.style.overflow = 'auto';
        // Ensure pointer events are disabled when hidden
        modal.style.pointerEvents = 'none';
    }
}

// Confirm vision type and proceed
function confirmVisionType() {
    const selected = document.querySelector('input[name="vision-type"]:checked');
    if (!selected) {
        return; // No selection made
    }
    
    const visionType = selected.value;
    const isFirstTime = !localStorage.getItem('visionType');
    
    // Close modal first to restore UI responsiveness
    hideColorBlindModal();
    
    // Update vision type and colors
    setVisionType(visionType);
    
    // Only load data on first time (initial modal)
    // After that, just update colors without reloading data
    if (isFirstTime) {
        loadData();
    }
    // Colors are already updated by setVisionType -> updateAllChartColors()
}

// Allow user to change vision type from header
function openVisionSettings() {
    // Always allow opening the modal, even if updates are in progress
    try {
        showColorBlindModal();
    } catch (error) {
        console.error('Error opening vision settings:', error);
        // Fallback: try to show modal directly
        const modal = document.getElementById('colorblind-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
}
