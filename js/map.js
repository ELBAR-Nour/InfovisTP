// ===== map.js =====
// Save reference to native JavaScript Map constructor before ArcGIS modules load
const NativeMap = window.Map;

// Use IIFE to prevent multiple initialization and scope issues
(function() {
  // Wait for DOM and ArcGIS API to be ready
  function initMap() {
    // Check if already initializing or initialized
    if (window.mapInitialized === true) {
      return;
    }
    
    // Check if require is available (ArcGIS API loaded)
    if (typeof require === 'undefined') {
      console.warn('ArcGIS API not loaded yet, retrying...');
      setTimeout(initMap, 100);
      return;
    }
    
    // Check if map container exists
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.warn('Map container not found, retrying...');
      setTimeout(initMap, 100);
      return;
    }
    
    // Mark as initializing to prevent multiple require calls
    window.mapInitialized = true;
    
    require([
      "esri/Map",
      "esri/views/MapView",
      "esri/Graphic",
      "esri/layers/GraphicsLayer",
      "esri/rest/locator"
    ], function (EsriMap, MapView, Graphic, GraphicsLayer, locator) {

      const map = new EsriMap({ basemap: "topo-vector" });

      const view = new MapView({
        container: "map",
        map: map,
        center: [-98, 38],
        zoom: 4
      });

      const hospitalsLayer = new GraphicsLayer();
      map.add(hospitalsLayer);

      // Function to update map legend based on current COLORS
      window.updateMapLegend = function() {
        const legendDiv = document.getElementById('map-legend');
        if (legendDiv) {
          legendDiv.innerHTML = `
            <div style="background: white; padding: 16px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-family: Arial, sans-serif; font-size: 13px;">
              <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold; color: #1f2937;">Hospital Test Results</h4>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 12px; height: 12px; border-radius: 50%; background: ${COLORS.Normal}; border: 2px solid white;"></div>
                  <span>Normal Results</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 12px; height: 12px; border-radius: 50%; background: ${COLORS.Abnormal}; border: 2px solid white;"></div>
                  <span>Abnormal Results</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 12px; height: 12px; border-radius: 50%; background: ${COLORS.Inconclusive}; border: 2px solid white;"></div>
                  <span>Inconclusive Results</span>
                </div>
              </div>
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                <strong>💡 Tip:</strong> Click hospitals to filter data
              </div>
            </div>
          `;
        }
      };

      // Map Legend (Shneiderman: Overview First)
      const legendDiv = document.createElement('div');
      legendDiv.id = 'map-legend';
      legendDiv.innerHTML = `
        <div style="background: white; padding: 16px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-family: Arial, sans-serif; font-size: 13px;">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold; color: #1f2937;">Hospital Test Results</h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: ${COLORS.Normal}; border: 2px solid white;"></div>
              <span>Normal Results</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: ${COLORS.Abnormal}; border: 2px solid white;"></div>
              <span>Abnormal Results</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: ${COLORS.Inconclusive}; border: 2px solid white;"></div>
              <span>Inconclusive Results</span>
            </div>
          </div>
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <strong>💡 Tip:</strong> Click hospitals to filter data
          </div>
        </div>
      `;
      view.ui.add(legendDiv, 'top-right');

      // Handle graphic clicks
      view.on("click", async (event) => {
        const hitTestResults = await view.hitTest(event, { include: hospitalsLayer });
        if (hitTestResults.results.length > 0) {
          const graphic = hitTestResults.results[0].graphic;
          if (graphic && graphic.attributes && graphic.attributes.hospitalName) {
            setFilter("hospital", graphic.attributes.hospitalName);
          }
        }
      });

      const GEOCODER_URL =
        "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";

      // Cache geocoded hospitals (VERY IMPORTANT)
      // Use NativeMap (saved reference to native JavaScript Map) to avoid conflict with esri/Map
      const hospitalLocationCache = new NativeMap();

      // ---- Public hook (called from data.js) ----
      window.updateHospitalMap = async function () {
        if (!filteredData || filteredData.length === 0) return;
        await drawHospitals();
      };

      async function drawHospitals() {
        hospitalsLayer.removeAll();

        // Group data by hospital
        const hospitals = d3.group(filteredData, d => d.hospital);

        for (const [hospitalName, records] of hospitals.entries()) {
          if (!hospitalName || hospitalName === "Unknown") continue;

          let location = hospitalLocationCache.get(hospitalName);

          // ---- Geocode if not cached ----
          if (!location) {
            try {
              const result = await locator.addressToLocations(GEOCODER_URL, {
                address: { SingleLine: `${hospitalName}, USA` },
                maxLocations: 1
              });

              if (!result.length) continue;

              location = result[0].location;
              hospitalLocationCache.set(hospitalName, location);

            } catch (err) {
              console.warn("Geocoding failed:", hospitalName);
              continue;
            }
          }

          // ---- Stats ----
          const totalPatients = records.length;
          const avgBilling =
            d3.mean(records, d => d.billingAmount) || 0;

          const dominantResult = d3.rollups(
            records,
            v => v.length,
            d => d.testResults
          ).sort((a, b) => b[1] - a[1])[0][0];

          const graphic = new Graphic({
            geometry: {
              type: "point",
              longitude: location.longitude,
              latitude: location.latitude
            },
            symbol: {
              type: "simple-marker",
              size: 12,
              color: COLORS[dominantResult],
              outline: { color: "#fff", width: 1 }
            },
            attributes: {
              hospitalName,
              totalPatients,
              avgBilling: Math.round(avgBilling),
              dominantResult
            },
            popupTemplate: {
              title: "{hospitalName}",
              content: `
                <b>Patients:</b> {totalPatients}<br>
                <b>Avg Billing:</b> ${"{avgBilling}"}<br>
                <b>Dominant Test Result:</b> {dominantResult}
              `
            }
          });

          hospitalsLayer.add(graphic);
        }
      }
    });
  }
  
  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    // DOM already loaded, start initialization
    initMap();
  }
})();
