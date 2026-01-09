// ===== map.js =====
require([
  "esri/Map",
  "esri/views/MapView",
  "esri/Graphic",
  "esri/layers/GraphicsLayer",
  "esri/rest/locator"
], function (Map, MapView, Graphic, GraphicsLayer, locator) {

  const map = new Map({ basemap: "topo-vector" });

  const view = new MapView({
    container: "map",
    map,
    center: [-98, 38],
    zoom: 4
  });

  const hospitalsLayer = new GraphicsLayer();
  map.add(hospitalsLayer);

  // Map Legend (Shneiderman: Overview First)
  const legendDiv = document.createElement('div');
  legendDiv.id = 'map-legend';
  legendDiv.innerHTML = `
    <div style="background: white; padding: 16px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-family: Arial, sans-serif; font-size: 13px;">
      <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold; color: #1f2937;">Hospital Test Results</h4>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #22c55e; border: 2px solid white;"></div>
          <span>Normal Results</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #ef4444; border: 2px solid white;"></div>
          <span>Abnormal Results</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #f59e0b; border: 2px solid white;"></div>
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
  const hospitalLocationCache = new Map();

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

      // ---- Stats (REAL from CSV) ----
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
