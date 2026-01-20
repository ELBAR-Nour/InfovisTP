
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
    zoom: 4,
    popup: {
      dockEnabled: false, 
      defaultPopupTemplateEnabled: false,
      collapseEnabled: false
    }
  });

  view.popup.autoOpenEnabled = false;

  const hospitalsLayer = new GraphicsLayer();
  map.add(hospitalsLayer);

  
  
  
  window.updateMapLegend = function() {
    const legendDiv = document.getElementById('map-legend');
    if (legendDiv) {
      legendDiv.innerHTML = `
        <div style="background: white; padding: 12px 16px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-family: 'Inter', sans-serif; font-size: 13px;">
          <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #1f2937;">Hospital Outcomes</h4>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 10px; height: 10px; border-radius: 50%; background: ${COLORS.Normal}; border: 2px solid white; box-shadow: 0 0 2px rgba(0,0,0,0.3);"></div>
              <span>Normal</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 10px; height: 10px; border-radius: 50%; background: ${COLORS.Abnormal}; border: 2px solid white; box-shadow: 0 0 2px rgba(0,0,0,0.3);"></div>
              <span>Abnormal</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 10px; height: 10px; border-radius: 50%; background: ${COLORS.Inconclusive}; border: 2px solid white; box-shadow: 0 0 2px rgba(0,0,0,0.3);"></div>
              <span>Inconclusive</span>
            </div>
          </div>
        </div>
      `;
    }
  };

  
  const legendDiv = document.createElement('div');
  legendDiv.id = 'map-legend';
  view.ui.add(legendDiv, 'top-right');

  
  window.updateMapLegend(); 

  
  
  
  view.when(() => {
    console.log("MapView ready");
    
    setTimeout(() => {
      if (window.filteredData && window.filteredData.length > 0) {
        window.updateHospitalMap();
      }
      window.dispatchEvent(new Event('resize'));
    }, 200);
  });

  

  let isPopupPinned = false;

  view.popup.watch("selectedFeature", (graphic) => {
    if (isPopupPinned && graphic && graphic.attributes) {
       setFilter("hospital", graphic.attributes.hospitalName);
    }
  });

  view.popup.watch("visible", (visible) => {
    if (!visible) {
      isPopupPinned = false;
      document.getElementById("map").style.cursor = "default";
    }
  });

  view.on("pointer-move", function(event) {
    if (isPopupPinned) return; 

    view.hitTest(event).then(function(response) {
      const hitResults = response.results.filter(r => r.graphic.layer === hospitalsLayer);
      
      if (hitResults.length > 0) {
        const graphics = hitResults.map(r => r.graphic);
        document.getElementById("map").style.cursor = "pointer";
        view.popup.open({
          location: graphics[0].geometry,
          features: graphics 
        });
      } else {
        view.popup.close();
        document.getElementById("map").style.cursor = "default";
      }
    });
  });

  view.on("click", async (event) => {
    const response = await view.hitTest(event, { include: hospitalsLayer });
    const graphics = response.results.map(r => r.graphic);

    if (graphics.length > 0) {
      isPopupPinned = true;
      view.popup.open({
        location: graphics[0].geometry,
        features: graphics
      });

      if (view.popup.selectedFeature) {
          setFilter("hospital", view.popup.selectedFeature.attributes.hospitalName);
      } else {
          setFilter("hospital", graphics[0].attributes.hospitalName);
      }
    } else {
      isPopupPinned = false;
      view.popup.close();
    }
  });

  
  
  
  const GEOCODER_URL = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";
  const hospitalLocationCache = new Map();
  let renderCounter = 0;

  window.updateHospitalMap = async function () {
    if (!view.ready || !filteredData || filteredData.length === 0) return;
    
    renderCounter++;
    await drawHospitals(renderCounter);
    
    
    if (typeof window.updateMapLegend === 'function') window.updateMapLegend();
  };

  async function drawHospitals(requestId) {
    hospitalsLayer.removeAll();
    const hospitals = d3.group(filteredData, d => (d.hospital || 'Unknown').trim());

    for (const [hospitalName, records] of hospitals.entries()) {
      if (!hospitalName || hospitalName === "Unknown") continue;
      if (requestId !== renderCounter) return;

      let location = hospitalLocationCache.get(hospitalName);
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

      if (requestId !== renderCounter) return;

      const totalPatients = records.length;
      const avgBilling = d3.mean(records, d => d.billingAmount) || 0;
      const resultCounts = d3.rollups(records, v => v.length, d => d.testResults).sort((a, b) => b[1] - a[1]);
      const dominantResult = resultCounts.length > 0 ? resultCounts[0][0] : "Unknown";
      
      const fmtBilling = new Intl.NumberFormat('en-US', { 
          style: 'currency', currency: 'USD', maximumFractionDigits: 0 
      }).format(avgBilling);

      const graphic = new Graphic({
        geometry: {
          type: "point",
          longitude: location.longitude,
          latitude: location.latitude
        },
        symbol: {
          type: "simple-marker",
          size: 14,
          color: COLORS[dominantResult] || "#999",
          outline: { color: "#fff", width: 1.5 }
        },
        attributes: {
          hospitalName,
          totalPatients,
          fmtBilling,
          dominantResult
        },
        popupTemplate: {
          title: "{hospitalName}",
          content: `
            <div style="font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.6;">
              <div><strong>Patients:</strong> {totalPatients}</div>
              <div><strong>Avg Bill:</strong> {fmtBilling}</div>
              <div><strong>Outcome:</strong> <span style="color:${COLORS[dominantResult]}; font-weight:bold;">{dominantResult}</span></div>
            </div>
          `
        }
      });

      hospitalsLayer.add(graphic);
    }
  }
});