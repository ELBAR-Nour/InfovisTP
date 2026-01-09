// ===== map.js =====
require([
  "esri/Map",
  "esri/views/MapView",
  "esri/Graphic",
  "esri/layers/GraphicsLayer"
], function(Map, MapView, Graphic, GraphicsLayer) {

    const map = new Map({ basemap: "topo-vector" });
    const view = new MapView({
        container: "map",
        map: map,
        center: [-98, 38], // USA center example
        zoom: 4
    });

    const hospitalsLayer = new GraphicsLayer();
    map.add(hospitalsLayer);

    // Example hospital coordinates
    const hospitalLocations = [
        {name:"City General", coords:[-77.0369,38.9072]},
        {name:"St. Marys Hospital", coords:[-87.6298,41.8781]},
        {name:"University Hospital", coords:[-122.4194,37.7749]}
    ];

    function drawHospitals() {
        hospitalsLayer.removeAll();
        hospitalLocations.forEach(h=>{
            const hospitalData = filteredData.filter(d=>d.hospital===h.name);
            const totalPatients = hospitalData.length;
            const avgBilling = totalPatients>0 ? hospitalData.reduce((s,d)=>s+d.billingAmount,0)/totalPatients : 0;
            const dominantResult = ['Normal','Abnormal','Inconclusive'].reduce((a,b)=>hospitalData.filter(d=>d.testResults===b).length>hospitalData.filter(d=>d.testResults===a).length?b:a,'Normal');

            const point = { type:"point", longitude:h.coords[0], latitude:h.coords[1] };
            const symbol = { type:"simple-marker", color:COLORS[dominantResult], size:12 };
            const attributes = { name:h.name, totalPatients, avgBilling:Math.round(avgBilling), dominantResult };
            const popupTemplate = { title:"{name}", content:"Patients: {totalPatients}<br>Avg Billing: ${avgBilling}<br>Dominant Test Result: {dominantResult}" };

            const graphic = new Graphic({ geometry: point, symbol, attributes, popupTemplate });
            hospitalsLayer.add(graphic);

            // Click updates charts
            graphic.on("click", ()=>setFilter('hospital',h.name));
        });
    }

    drawHospitals();
});