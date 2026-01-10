// ===== Color Blindness Accessibility Module =====

// Optimized color palettes for different vision types
// ===== Color Blindness Accessibility Module =====

const COLOR_SCHEMES = {
    normal: {
        // Standard Semantic Colors
        Normal: '#22c55e',       // Green
        Abnormal: '#ef4444',     // Red
        Inconclusive: '#f59e0b', // Amber
        male: '#0ea5e9',         // Blue
        female: '#ec4899',       // Pink
        // New: 10 Distinct Colors for Charts (Diseases, Blood Types, etc.)
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
        Abnormal: '#6b21a8',     // Purple (replaces Red)
        Inconclusive: '#f59e0b', // Yellow
        male: '#0ea5e9',
        female: '#f59e0b',
        // High contrast Blue/Yellow/Gray palette
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
        // Green-blind: Similar to Protanopia, focus on Blue/Gold.
        Normal: '#0ea5e9',
        Abnormal: '#dc2626',
        Inconclusive: '#f59e0b',
        male: '#0ea5e9',
        female: '#dc2626',
        // Distinct Blues and Yellows/Browns
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
        // Blue-blind: Avoid Blue/Yellow. Use Red/Teal/Pink.
        Normal: '#008080',       // Teal (replaces Blue)
        Abnormal: '#dc2626',     // Red
        Inconclusive: '#9333ea', // Purple
        male: '#008080',
        female: '#dc2626',
        // Red vs Cyan palette
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
        // Complete color blindness: Use distinct Grayscale Steps
        Normal: '#404040',
        Abnormal: '#000000',
        Inconclusive: '#9ca3af',
        male: '#1f2937',
        female: '#9ca3af',
        // High contrast shades
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
        
        // Update global COLORS object immediately
        if (typeof COLORS !== 'undefined') {
            COLORS.Normal = scheme.Normal;
            COLORS.Abnormal = scheme.Abnormal;
            COLORS.Inconclusive = scheme.Inconclusive;
            // Also store gender colors for pyramid chart
            COLORS.male = scheme.male;
            COLORS.female = scheme.female;
        }
        
        // Store color scheme globally for other charts to access
        window.currentColorScheme = scheme;
        
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
