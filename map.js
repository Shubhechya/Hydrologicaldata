// // Initialize the Leaflet map, centered on Nepal
// const map = L.map('map').setView([28.2, 83.9], 8);

// // --- Basemaps ---
// const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//   attribution: '&copy; OpenStreetMap contributors'
// });
// const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
//   attribution: 'ESRI Satellite'
// });
// const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
//   attribution: '&copy; OpenTopoMap contributors'
// });

// // Add OSM as default basemap
// osm.addTo(map);

// // Basemap control (radio buttons in sidebar will handle this)
// const basemaps = {
//   "OpenStreetMap": osm,
//   "Satellite": satellite,
//   "Topographic": topo
// };

// // Global variables for layers and data
// let riverLayer = null; // Will be assigned when data loads
// let districtLayer = null; // Will be assigned when data loads
// let precipLayer = null; // Layer for currently displayed precipitation points
// let stationMarkers = L.layerGroup(); // Layer group for all stations
// let precipitationData = null; // Stores ALL precipitation data once fetched
// let allStationData = null; // Stores ALL station data once fetched
// let bufferLayer = null;
// let intersectLayer = null;
// let pointsInPolygonLayer = null;
// let idwLayer = null;
// let currentPrecipitationLegend = null; // To manage precipitation legend
// let stationLegend = null; // To manage station legend

// // Helper for loading overlay
// function showLoadingOverlay() {
//     document.getElementById('loadingOverlay').classList.remove('hidden');
// }

// function hideLoadingOverlay() {
//     document.getElementById('loadingOverlay').classList.add('hidden');
// }

// // Helper for message box
// function showMessageBox(message) {
//     document.getElementById('messageBoxContent').innerText = message;
//     document.getElementById('messageBox').style.display = 'block';
// }

// function hideMessageBox() {
//     document.getElementById('messageBox').style.display = 'none';
// }

// document.getElementById('messageBoxOkButton').addEventListener('click', hideMessageBox);


// // --- Fetch GeoJSON and CSV Data ---
// showLoadingOverlay();
// Promise.all([
//     fetch('/static/data/geojson/dontriver.geojson').then(response => response.json()),
//     fetch('/static/data/geojson/districts.geojson').then(response => response.json()),
//     fetch('/data/precipitation').then(response => response.json()),
//     fetch('/data/stations').then(response => response.json())
// ])
// .then(([riverGeoJSON, districtGeoJSON, precipCSV, stationCSV]) => {
//     // Rivers
//     riverLayer = L.geoJson(riverGeoJSON, {
//         style: {
//             color: '#00BFFF', // Deep sky blue
//             weight: 2,
//             opacity: 0.7
//         }
//     }).addTo(map); // Add by default as checkbox is checked

//     // Districts
//     districtLayer = L.geoJson(districtGeoJSON, {
//         style: function(feature) {
//             return {
//                 fillColor: '#fdbe85', // Light orange-yellow
//                 weight: 1,
//                 opacity: 0.8,
//                 color: 'white',
//                 fillOpacity: 0.5
//             };
//         },
//         onEachFeature: function(feature, layer) {
//             if (feature.properties && feature.properties.DISTRICT) {
//                 layer.bindPopup(`<b>District:</b> ${feature.properties.DISTRICT}`);
//                 layer.on('click', function(e) {
//                     // Clear any previous selection highlight
//                     if (districtLayer) {
//                         districtLayer.eachLayer(function(l) {
//                             districtLayer.resetStyle(l);
//                         });
//                     }
//                     // Highlight selected district
//                     e.target.setStyle({
//                         weight: 3,
//                         color: '#666',
//                         dashArray: '',
//                         fillOpacity: 0.7
//                     });
//                     // Store selected district for spatial operations
//                     map.selectedDistrict = e.target.feature;
//                 });
//             }
//         }
//     }).addTo(map); // Add by default

//     // Store precipitation and station data globally
//     precipitationData = precipCSV;
//     allStationData = stationCSV;

//     // Add all stations to map initially (assuming 'toggleStations' is checked by default)
//     addStationMarkers(allStationData);
//     addStationLegend();

//     // Initial display of precipitation data for a default month/year
//     const initialYear = document.getElementById('yearSelect').value;
//     const initialMonth = document.getElementById('monthSelect').value;
//     displayPrecipitation(initialYear, initialMonth); // This will add precipLayer and its legend

//     hideLoadingOverlay();

// }).catch(error => {
//     console.error('Error loading data:', error);
//     showMessageBox('Failed to load map data. Please check the server and data files.');
//     hideLoadingOverlay();
// });


// // --- Basemap Toggling ---
// document.querySelectorAll('input[name="basemap"]').forEach(radio => {
//   radio.addEventListener('change', function() {
//     // Remove all basemaps
//     Object.values(basemaps).forEach(layer => map.removeLayer(layer));
//     // Add the selected basemap
//     basemaps[this.value === 'osm' ? 'OpenStreetMap' : this.value === 'satellite' ? 'Satellite' : 'Topographic'].addTo(map);
//   });
// });

// // --- Layer Toggling ---
// document.getElementById('toggleRiver').addEventListener('change', function() {
//     if (this.checked) {
//         if (riverLayer) map.addLayer(riverLayer);
//     } else {
//         if (riverLayer) map.removeLayer(riverLayer);
//     }
// });

// document.getElementById('toggleDistrict').addEventListener('change', function() {
//     if (this.checked) {
//         if (districtLayer) map.addLayer(districtLayer);
//     } else {
//         if (districtLayer) map.removeLayer(districtLayer);
//     }
// });

// document.getElementById('toggleStations').addEventListener('change', function() {
//     if (this.checked) {
//         if (stationMarkers) map.addLayer(stationMarkers);
//         addStationLegend();
//     } else {
//         if (stationMarkers) map.removeLayer(stationMarkers);
//         removeStationLegend();
//     }
// });

// document.getElementById('togglePrecipitation').addEventListener('change', function() {
//     if (this.checked) {
//         if (precipLayer) map.addLayer(precipLayer);
//         // Re-add the current precipitation legend if it exists and layer is added
//         if (currentPrecipitationLegend) currentPrecipitationLegend.addTo(map);
//     } else {
//         if (precipLayer) map.removeLayer(precipLayer);
//         if (currentPrecipitationLegend) map.removeControl(currentPrecipitationLegend);
//     }
// });

// // --- Station Markers ---
// function addStationMarkers(stations) {
//     stationMarkers.clearLayers(); // Clear existing markers
//     stations.forEach(station => {
//         const marker = L.marker([station.Latitude, station.Longitude]);
//         marker.bindPopup(`
//             <b>Station:</b> ${station.Station}<br>
//             <b>District:</b> ${station.District}<br>
//             <b>Elevation:</b> ${station.Elevation} m<br>
//             <b>Type:</b> ${station.Type || 'N/A'}
//         `);
//         stationMarkers.addLayer(marker);
//     });
//     // Only add to map if checkbox is checked
//     if (document.getElementById('toggleStations').checked) {
//         map.addLayer(stationMarkers);
//     }
// }

// // --- Precipitation Data Display and Filtering ---
// function getColor(d) {
//     return d > 500 ? '#800026' :
//            d > 300 ? '#BD0026' :
//            d > 100 ? '#E31A1C' :
//            d > 50  ? '#FC4E2A' :
//            d > 0   ? '#FD8D3C' :
//                      '#FFEDA0';
// }

// function stylePrecipitation(feature) {
//     return {
//         radius: 6,
//         fillColor: getColor(feature.properties.precipitation),
//         color: "#000",
//         weight: 1,
//         opacity: 1,
//         fillOpacity: 0.8
//     };
// }

// function displayPrecipitation(year, month) {
//     if (!precipitationData) {
//         console.error("Precipitation data not loaded yet.");
//         showMessageBox("Precipitation data is not available. Please try again later.");
//         return;
//     }

//     if (precipLayer) {
//         map.removeLayer(precipLayer);
//         if (currentPrecipitationLegend) map.removeControl(currentPrecipitationLegend);
//     }

//     const filteredData = precipitationData.filter(d =>
//         d.year === parseInt(year) && d.month.toLowerCase() === month.toLowerCase()
//     );

//     if (filteredData.length === 0) {
//         console.warn(`No precipitation data found for ${month} ${year}`);
//         showMessageBox(`No precipitation data found for ${month} ${year}.`);
//         return;
//     }

//     const geojsonFeatures = filteredData.map(d => ({
//         type: "Feature",
//         geometry: {
//             type: "Point",
//             coordinates: [d.longitude, d.latitude]
//         },
//         properties: {
//             // Using .get() for robustness, though app.py sends lowercase keys.
//             // d.stationname will be 'N/A' if not present in the CSV
//             station: d.stationname || 'N/A', 
//             precipitation: d.precipitation,
//             year: d.year,
//             month: d.month,
//             district: d.district || 'Unknown'
//         }
//     }));

//     precipLayer = L.geoJson(geojsonFeatures, {
//         pointToLayer: function (feature, latlng) {
//             return L.circleMarker(latlng, stylePrecipitation(feature));
//         },
//         onEachFeature: function (feature, layer) {
//             layer.bindPopup(`
//                 <b>Station:</b> ${feature.properties.station}<br>
//                 <b>District:</b> ${feature.properties.district}<br>
//                 <b>Precipitation:</b> ${feature.properties.precipitation} mm<br>
//                 <b>Month:</b> ${feature.properties.month}, ${feature.properties.year}
//             `);
//         }
//     });

//     if (document.getElementById('togglePrecipitation').checked) {
//         precipLayer.addTo(map);
//     }
//     addPrecipitationLegend();
// }

// document.getElementById('applyFilterBtn').addEventListener('click', () => {
//     const selectedYear = document.getElementById('yearSelect').value;
//     const selectedMonth = document.getElementById('monthSelect').value;
//     displayPrecipitation(selectedYear, selectedMonth);
// });

// // --- Legends ---
// function addPrecipitationLegend() {
//     if (currentPrecipitationLegend) map.removeControl(currentPrecipitationLegend);

//     currentPrecipitationLegend = L.control({ position: 'bottomright' });

//     currentPrecipitationLegend.onAdd = function (map) {
//         const div = L.DomUtil.create('div', 'info legend');
//         const grades = [0, 50, 100, 300, 500];
//         const labels = [];
//         let from, to;

//         // Loop through our density intervals and generate a label with a colored square for each interval
//         for (let i = 0; i < grades.length; i++) {
//             from = grades[i];
//             to = grades[i + 1];

//             labels.push(
//                 '<span style="background:' + getColor(from + 1) + '"></span> ' +
//                 (from === 0 ? '≤ ' + grades[1] : from + (to ? '&ndash;' + to : '+')) + ' mm'
//             );
//         }
//         // Special label for the lowest range if it starts at 0
//         labels[0] = '<span style="background:' + getColor(0) + ';"></span> ≤ ' + grades[1] + ' mm';


//         div.innerHTML = '<h4>Precipitation (mm)</h4>' + labels.join('<br>');
//         return div;
//     };
//     if (document.getElementById('togglePrecipitation').checked) {
//         currentPrecipitationLegend.addTo(map);
//     }
// }

// function addStationLegend() {
//     if (stationLegend) map.removeControl(stationLegend);

//     stationLegend = L.control({ position: 'bottomright' });

//     stationLegend.onAdd = function (map) {
//         const div = L.DomUtil.create('div', 'info legend');
//         div.innerHTML = '<h4>Station Type</h4>' +
//                         '<span style="background:orange; width:18px; height:18px; display:inline-block; margin-right:8px; opacity:0.7;"></span> Meteorological Station<br>';
//         return div;
//     };

//     if (document.getElementById('toggleStations').checked) {
//         stationLegend.addTo(map);
//     }
// }

// function removeStationLegend() {
//     if (stationLegend) {
//         map.removeControl(stationLegend);
//         stationLegend = null;
//     }
// }

// // --- Spatial Operations ---
// document.getElementById('clearSpatialResultsBtn').addEventListener('click', () => {
//     if (bufferLayer) { map.removeLayer(bufferLayer); bufferLayer = null; }
//     if (intersectLayer) { map.removeLayer(intersectLayer); intersectLayer = null; }
//     if (pointsInPolygonLayer) { map.removeLayer(pointsInPolygonLayer); pointsInPolygonLayer = null; }
//     if (idwLayer) { map.removeLayer(idwLayer); idwLayer = null; }
//     if (currentPrecipitationLegend && !document.getElementById('togglePrecipitation').checked) {
//         map.removeControl(currentPrecipitationLegend);
//     }
//     // Reset district selection highlight
//     if (districtLayer) {
//         districtLayer.eachLayer(function(l) {
//             districtLayer.resetStyle(l);
//         });
//         map.selectedDistrict = null;
//     }
// });


// document.getElementById('bufferBtn').addEventListener('click', () => {
//     if (!precipLayer || !precipLayer.getLayers().length) {
//         showMessageBox("No precipitation data displayed to buffer.");
//         return;
//     }
//     if (bufferLayer) { map.removeLayer(bufferLayer); } // Clear previous buffer

//     const highRainPoints = precipLayer.toGeoJSON().features.filter(f => f.properties.precipitation > 300); // Example threshold
//     if (highRainPoints.length === 0) {
//         showMessageBox("No high precipitation stations ( > 300mm) found for buffering in the current view.");
//         return;
//     }

//     const bufferedFeatures = [];
//     highRainPoints.forEach(point => {
//         try {
//             const buffered = turf.buffer(point, 5, { units: 'kilometers' }); // 5 km buffer
//             bufferedFeatures.push(buffered);
//         } catch (e) {
//             console.error("Error buffering point:", point, e);
//         }
//     });

//     if (bufferedFeatures.length > 0) {
//         bufferLayer = L.geoJson({
//             type: 'FeatureCollection',
//             features: bufferedFeatures
//         }, {
//             style: {
//                 fillColor: 'blue',
//                 weight: 2,
//                 opacity: 0.8,
//                 color: 'blue',
//                 fillOpacity: 0.3
//             }
//         }).addTo(map);
//         showMessageBox(`Buffered ${bufferedFeatures.length} high rain stations (5km radius).`);
//     } else {
//          showMessageBox("Failed to create any buffers.");
//     }
// });


// document.getElementById('intersectBtn').addEventListener('click', () => {
//     if (!bufferLayer) {
//         showMessageBox("Please buffer high rain stations first.");
//         return;
//     }
//     if (!districtLayer) {
//         showMessageBox("District layer not loaded.");
//         return;
//     }
//     if (intersectLayer) { map.removeLayer(intersectLayer); } // Clear previous intersect

//     let intersections = [];
//     districtLayer.eachLayer(districtLyr => {
//         bufferLayer.eachLayer(bufferLyr => {
//             try {
//                 const intersection = turf.intersect(districtLyr.feature, bufferLyr.feature);
//                 if (intersection) {
//                     intersections.push(intersection);
//                 }
//             } catch (e) {
//                 console.error("Error performing intersection:", e);
//             }
//         });
//     });

//     if (intersections.length > 0) {
//         intersectLayer = L.geoJson({
//             type: 'FeatureCollection',
//             features: intersections
//         }, {
//             style: {
//                 fillColor: 'purple',
//                 weight: 2,
//                 opacity: 0.8,
//                 color: 'red',
//                 fillOpacity: 0.5
//             }
//         }).addTo(map);
//         showMessageBox(`Found ${intersections.length} intersections between buffers and districts.`);
//     } else {
//         showMessageBox("No intersections found between buffered stations and districts.");
//     }
// });


// document.getElementById('pointsInPolygonBtn').addEventListener('click', () => {
//     if (!map.selectedDistrict) {
//         showMessageBox("Please click on a district on the map to select it first.");
//         return;
//     }
//     if (!stationMarkers || !stationMarkers.getLayers().length) {
//         showMessageBox("No meteorological stations loaded on the map.");
//         return;
//     }
//     if (pointsInPolygonLayer) { map.removeLayer(pointsInPolygonLayer); } // Clear previous results

//     const selectedDistrictPoly = map.selectedDistrict;
//     const allStations = stationMarkers.toGeoJSON();

//     const stationsInDistrict = turf.pointsWithinPolygon(allStations, {
//         type: 'FeatureCollection',
//         features: [selectedDistrictPoly]
//     });

//     if (stationsInDistrict.features.length > 0) {
//         pointsInPolygonLayer = L.geoJson(stationsInDistrict, {
//             pointToLayer: function (feature, latlng) {
//                 return L.marker(latlng, {
//                     icon: L.divIcon({
//                         className: 'custom-div-icon',
//                         html: '<div style="background-color:orange; width:20px; height:20px; border-radius:50%; border:2px solid white; display:flex; justify-content:center; align-items:center;"><span style="color:white; font-weight:bold;">S</span></div>',
//                         iconSize: [20, 20],
//                         iconAnchor: [10, 10]
//                     })
//                 }).bindPopup(`<b>Station in ${selectedDistrictPoly.properties.DISTRICT}:</b> ${feature.properties.Station || 'N/A'}`);
//             }
//         }).addTo(map);
//         showMessageBox(`Found ${stationsInDistrict.features.length} stations in ${selectedDistrictPoly.properties.DISTRICT}.`);
//     } else {
//         showMessageBox(`No stations found in ${selectedDistrictPoly.properties.DISTRICT}.`);
//     }
// });


// document.getElementById('interpolateBtn').addEventListener('click', () => {
//     if (!precipLayer || !precipLayer.getLayers().length) {
//         showMessageBox("No precipitation data displayed to interpolate.");
//         return;
//     }
//     if (idwLayer) { map.removeLayer(idwLayer); } // Clear previous IDW layer

//     const currentPrecipitationPoints = precipLayer.toGeoJSON();

//     if (currentPrecipitationPoints.features.length < 3) { // IDW requires at least 3 points
//         showMessageBox("Not enough precipitation data points for interpolation (need at least 3).");
//         return;
//     }

//     try {
//         // Prepare data for interpolation
//         const points = turf.featureCollection(currentPrecipitationPoints.features.map(f => {
//             return turf.point(f.geometry.coordinates, { value: f.properties.precipitation });
//         }));

//         // Define a grid over the current map bounds
//         const bbox = map.getBounds().toBBoxString().split(',').map(Number);
//         const cellSide = 0.5; // kilometers for grid cell size, adjust as needed for resolution vs performance
//         const options = { units: 'kilometers', properties: { value: 0 } };
//         const grid = turf.squareGrid(bbox, cellSide, options);

//         // Perform IDW interpolation
//         const interpolatedGrid = turf.interpolate(points, {
//             grid: grid,
//             field: 'value', // The property field to interpolate
//             units: 'kilometers',
//             weight: 2 // Inverse distance weighting power (2 is common)
//         });

//         // Add interpolated grid as a heatmap or colored polygons
//         idwLayer = L.geoJson(interpolatedGrid, {
//             style: function(feature) {
//                 const value = feature.properties.value;
//                 return {
//                     fillColor: getColor(value), // Use the same color scheme as precipitation points
//                     weight: 0,
//                     fillOpacity: 0.6
//                 };
//             }
//         }).addTo(map);

//         showMessageBox("Precipitation interpolated using IDW. Remove this layer to see original points.");

//     } catch (e) {
//         console.error("Error during interpolation:", e);
//         showMessageBox("Failed to perform interpolation. Error: " + e.message);
//     }
// });


// // Initial map setup: Add layers if their checkboxes are checked
// document.addEventListener('DOMContentLoaded', () => {
//     // Legends are added/removed based on layer visibility in their respective functions
// });
// Initialize the Leaflet map, centered on Nepal
const map = L.map('map').setView([28.2, 83.9], 8);

// --- Basemaps ---
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
});
const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'ESRI Satellite'
});
const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenTopoMap contributors'
});

// Add OSM as default basemap
osm.addTo(map);

const basemaps = {
    "OpenStreetMap": osm,
    "Satellite": satellite,
    "Topographic": topo
};

// Global variables for layers and data
let riverLayer = null;
let districtLayer = null;
let precipLayer = null;
let stationMarkers = L.layerGroup();
let precipitationData = null; // Stores ALL precipitation data
let allStationData = null; // Stores ALL station data
let bufferLayer = null,
    intersectLayer = null,
    pointsInPolygonLayer = null,
    idwLayer = null;
let currentPrecipitationLegend = null;
let stationLegend = null;

// --- Helper Functions ---
function showLoadingOverlay() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showMessageBox(message) {
    document.getElementById('messageBoxContent').innerText = message;
    document.getElementById('messageBox').style.display = 'block';
}

function hideMessageBox() {
    document.getElementById('messageBox').style.display = 'none';
}
document.getElementById('messageBoxOkButton').addEventListener('click', hideMessageBox);


// --- Initial Data Loading ---
showLoadingOverlay();
Promise.all([
    fetch('/static/data/geojson/dontriver.geojson').then(res => res.json()),
    fetch('/static/data/geojson/districts.geojson').then(res => res.json()),
    fetch('/data/precipitation').then(res => res.json()),
    fetch('/data/stations').then(res => res.json()),
    fetch('/data/station_names').then(res => res.json()) // Fetch the new station names list
]).then(([riverGeoJSON, districtGeoJSON, precipCSV, stationCSV, stationNames]) => {
    // Check for errors from backend
    if (precipCSV.error || stationCSV.error || stationNames.error) {
        throw new Error(`Data loading failed: 
            Precip: ${precipCSV.error || 'OK'}, 
            Stations: ${stationCSV.error || 'OK'}, 
            Names: ${stationNames.error || 'OK'}`);
    }

    // Store data globally
    precipitationData = precipCSV;
    allStationData = stationCSV;

    // Populate the new station dropdown
    const stationSelect = document.getElementById('stationSelect');
    stationNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        stationSelect.appendChild(option);
    });

    // Initialize Layers
    initLayers(riverGeoJSON, districtGeoJSON);
    addStationMarkers(allStationData);
    addStationLegend();

    // Initial display of precipitation data
    applyFilters();

    hideLoadingOverlay();
}).catch(error => {
    console.error('CRITICAL ERROR loading data:', error);
    showMessageBox(`Failed to load critical map data. Please check the server logs and data files. Error: ${error.message}`);
    hideLoadingOverlay();
});

function initLayers(riverGeoJSON, districtGeoJSON) {
    // Rivers
    riverLayer = L.geoJson(riverGeoJSON, {
        style: { color: '#00BFFF', weight: 2, opacity: 0.7 }
    }).addTo(map);

    // Districts
    districtLayer = L.geoJson(districtGeoJSON, {
        style: feature => ({
            fillColor: '#fdbe85',
            weight: 1,
            opacity: 0.8,
            color: 'white',
            fillOpacity: 0.5
        }),
        onEachFeature: (feature, layer) => {
            if (feature.properties && feature.properties.DISTRICT) {
                layer.bindPopup(`<b>District:</b> ${feature.properties.DISTRICT}`);
                layer.on('click', e => {
                    districtLayer.eachLayer(l => districtLayer.resetStyle(l));
                    e.target.setStyle({ weight: 3, color: '#666', fillOpacity: 0.7 });
                    map.selectedDistrict = e.target.feature;
                });
            }
        }
    }).addTo(map);
}


// --- Event Listeners for Controls ---
document.querySelectorAll('input[name="basemap"]').forEach(radio => {
    radio.addEventListener('change', function() {
        Object.values(basemaps).forEach(layer => map.removeLayer(layer));
        map.addLayer(basemaps[this.value === 'osm' ? 'OpenStreetMap' : this.value === 'satellite' ? 'Satellite' : 'Topographic']);
    });
});

document.getElementById('toggleRiver').addEventListener('change', e => toggleLayer(riverLayer, e.target.checked));
document.getElementById('toggleDistrict').addEventListener('change', e => toggleLayer(districtLayer, e.target.checked));
document.getElementById('togglePrecipitation').addEventListener('change', e => {
    toggleLayer(precipLayer, e.target.checked);
    if (currentPrecipitationLegend) {
        e.target.checked ? currentPrecipitationLegend.addTo(map) : map.removeControl(currentPrecipitationLegend);
    }
});

document.getElementById('toggleStations').addEventListener('change', function(e) {
    toggleLayer(stationMarkers, e.target.checked);
    if (e.target.checked) {
        addStationLegend();
    } else {
        removeStationLegend();
    }
});

function toggleLayer(layer, isChecked) {
    if (!layer) return;
    if (isChecked) {
        map.addLayer(layer);
    } else {
        map.removeLayer(layer);
    }
}

// Attach event listeners for filtering
document.getElementById('applyFilterBtn').addEventListener('click', applyFilters);
document.getElementById('stationSelect').addEventListener('change', applyFilters);


// --- Core Functionality ---

function applyFilters() {
    const selectedYear = document.getElementById('yearSelect').value;
    const selectedMonth = document.getElementById('monthSelect').value;
    const selectedStation = document.getElementById('stationSelect').value;
    displayPrecipitation(selectedYear, selectedMonth, selectedStation);
}

function displayPrecipitation(year, month, stationName) {
    if (!precipitationData) {
        showMessageBox("Precipitation data is not yet available.");
        return;
    }

    if (precipLayer) map.removeLayer(precipLayer);
    if (currentPrecipitationLegend) map.removeControl(currentPrecipitationLegend);

    // *** THE FIX IS HERE ***
    // Filter by year (as number), month (as lowercase string), and station name
    // const filteredData = precipitationData.filter(d => {
    //     const yearMatch = d.year === parseInt(year);
    //     // Compare lowercase month from dropdown with lowercase month from data
    //     const monthMatch =String(d.month).toLowerCase() ===String(month).toLowerCase();
    //     // Check station name if "All Stations" is not selected
    //     const stationMatch = (stationName === 'all') || (d.stationname && d.stationname.toLowerCase() === stationName.toLowerCase());
    //     return yearMatch && monthMatch && stationMatch;
    // });
   const filteredData = precipitationData.filter(d => {
    const yearMatch = parseInt(d.year) === parseInt(year);
    const monthMatch = parseInt(d.month) === parseInt(month);
    const stationMatch = 
        stationName === 'all' || 
        (d.stationname && d.stationname.toLowerCase() === stationName.toLowerCase());
    return yearMatch && monthMatch && stationMatch;
});

    if (filteredData.length === 0) {
        showMessageBox(`No precipitation data found for the selected filters (${stationName}, ${month} ${year}).`);
        // Remove the old layer from the map if it exists
        if(precipLayer) map.removeLayer(precipLayer);
        precipLayer = null; // Set to null so other functions know it's empty
        return;
    }

    const geojsonFeatures = filteredData.map(d => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [d.longitude, d.latitude] },
        properties: {
            station: d.stationname || 'N/A',
            precipitation: d.precipitation,
            year: d.year,
            month: d.month,
            district: d.district || 'Unknown'
        }
    }));

    precipLayer = L.geoJson(geojsonFeatures, {
        pointToLayer: (feature, latlng) => L.circleMarker(latlng, stylePrecipitation(feature)),
        onEachFeature: (feature, layer) => {
            layer.bindPopup(`
                <b>Station:</b> ${feature.properties.station}<br>
                <b>District:</b> ${feature.properties.district}<br>
                <b>Precipitation:</b> ${feature.properties.precipitation} mm<br>
                <b>Date:</b> ${feature.properties.month}, ${feature.properties.year}
            `);
        }
    });

    if (document.getElementById('togglePrecipitation').checked) {
        precipLayer.addTo(map);
    }
    addPrecipitationLegend();
}


function addStationMarkers(stations) {
    stationMarkers.clearLayers();
    stations.forEach(station => {
        // Use the renamed keys from app.py
        const marker = L.marker([station.Latitude, station.Longitude]);
        marker.bindPopup(`
            <b>Station:</b> ${station.Station}<br>
            <b>District:</b> ${station.District}<br>
            <b>Elevation:</b> ${station.Elevation} m<br>
            <b>Type:</b> ${station.Type || 'N/A'}
        `);
        stationMarkers.addLayer(marker);
    });
    if (document.getElementById('toggleStations').checked) {
        map.addLayer(stationMarkers);
    }
}


// --- Styling and Legends ---

function getColor(d) {
    return d > 500 ? '#800026' :
           d > 300 ? '#BD0026' :
           d > 100 ? '#E31A1C' :
           d > 50  ? '#FC4E2A' :
           d > 0   ? '#FD8D3C' :
                     '#FFEDA0';
}

function stylePrecipitation(feature) {
    return {
        radius: 6,
        fillColor: getColor(feature.properties.precipitation),
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
}


function addPrecipitationLegend() {
    if (currentPrecipitationLegend) map.removeControl(currentPrecipitationLegend);

    currentPrecipitationLegend = L.control({ position: 'bottomright' });
    currentPrecipitationLegend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = [0, 50, 100, 300, 500];
        let labels = ['<h4>Precipitation (mm)</h4>'];
        for (let i = 0; i < grades.length; i++) {
            const from = grades[i];
            const to = grades[i + 1];
            labels.push(
                '<i style="background:' + getColor(from + 1) + '"></i> ' +
                from + (to ? '&ndash;' + to : '+'));
        }
        div.innerHTML = labels.join('<br>');
        return div;
    };
    if (document.getElementById('togglePrecipitation').checked) {
        currentPrecipitationLegend.addTo(map);
    }
}


function addStationLegend() {
    if (stationLegend) return; // Don't add if it already exists
    stationLegend = L.control({ position: 'bottomright' });
    stationLegend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend');
        div.innerHTML = '<h4>Station</h4><i style="background:url(https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png); background-repeat: no-repeat; width: 18px; height: 18px; display: inline-block;"></i> Meteorological Station';
        return div;
    };
    if (document.getElementById('toggleStations').checked) {
        stationLegend.addTo(map);
    }
}

function removeStationLegend() {
    if (stationLegend) {
        map.removeControl(stationLegend);
        stationLegend = null;
    }
}


// --- Spatial Operations ---
document.getElementById('clearSpatialResultsBtn').addEventListener('click', () => {
    if (bufferLayer) map.removeLayer(bufferLayer);
    if (intersectLayer) map.removeLayer(intersectLayer);
    if (pointsInPolygonLayer) map.removeLayer(pointsInPolygonLayer);
    if (idwLayer) map.removeLayer(idwLayer);
    if (districtLayer) {
        districtLayer.eachLayer(l => districtLayer.resetStyle(l));
        map.selectedDistrict = null;
    }
});


document.getElementById('bufferBtn').addEventListener('click', () => {
    if (!precipLayer || precipLayer.getLayers().length === 0) {
        showMessageBox("No precipitation data is displayed to buffer.");
        return;
    }
    
const points = [];
    precipLayer.eachLayer(layer => {
        const latlng = layer.getLatLng();
        const feature = turf.point([latlng.lng, latlng.lat]);
        points.push(feature);
    });

    // Create a FeatureCollection of those points
    const featureCollection = turf.featureCollection(points);

    // Apply buffer of 2 km
    const buffered = turf.buffer(featureCollection, 2, { units: 'kilometers' });

    // Remove previous buffer if exists
    if (bufferLayer) {
        map.removeLayer(bufferLayer);
    }
    // Add new buffer to map
    bufferLayer = L.geoJSON(buffered, {
        style: { color: '#000000;', fillOpacity: 0.3, weight: 1 }
    }).addTo(map);

    showMessageBox("Buffered 2 km around precipitation points.");
});

// document.getElementById('idwBtn').addEventListener('click', () => {
//   if (!precipitationData || precipitationData.length === 0) {
//     showMessageBox("No precipitation data loaded.");
//     return;
//   }

//   const selectedYear = parseInt(document.getElementById('yearSelect').value);
//   const selectedMonth = parseInt(document.getElementById('monthSelect').value);

//   // Debug sample
//   console.log("🔍 Sample row:", precipitationData[0]);
//   console.log("✅ Selected Year:", selectedYear, "Month:", selectedMonth);

//   const availableDates = precipitationData.map(d => `${d.Year}-${d.Month}`);
//   console.log("🗂 Available Year-Months:", [...new Set(availableDates)]);

//   const filteredData = precipitationData.filter(d =>
//     parseInt(d.Year) === selectedYear &&
//     parseInt(d.Month) === selectedMonth
//   );

//   console.log("🎯 Filtered Data Points:", filteredData.length);

//   if (filteredData.length === 0) {
//     showMessageBox(`⚠️ No precipitation data for ${selectedMonth}/${selectedYear}.`);
//     return;
//   }

//   const features = filteredData.map(d => {
//     const lat = parseFloat(d.Latitude);
//     const lng = parseFloat(d.Longitude);
//     const value = parseFloat(d.Precipitation);
//     if (isNaN(lat) || isNaN(lng) || isNaN(value)) return null;
//     return turf.point([lng, lat], { precipitation: value });
//   }).filter(f => f !== null);

//   console.log("✅ Turf-ready features:", features.length);

//   if (features.length === 0) {
//     showMessageBox("No valid precipitation points to interpolate.");
//     return;
//   }

//   const points = turf.featureCollection(features);

//   // Optional: zoom to bounding box
//   const bbox = turf.bbox(points);
//   map.fitBounds([
//     [bbox[1], bbox[0]],
//     [bbox[3], bbox[2]]
//   ]);

//   const grid = turf.interpolate(points, 2, {
//     gridType: 'points',
//     property: 'precipitation',
//     units: 'kilometers'
//   });

//   console.log("🟩 Interpolated grid features:", grid.features.length);

//   if (idwLayer) map.removeLayer(idwLayer);

//   idwLayer = L.geoJSON(grid, {
//     pointToLayer: (feature, latlng) => {
//       const value = feature.properties.precipitation;
//       return L.circleMarker(latlng, {
//         radius: 6,
//         fillColor: getColor(value),
//         fillOpacity: 0.7,
//         color: '#000',
//         weight: 0.5
//       }).bindPopup(`Precipitation: ${value.toFixed(2)} mm`);
//     }
//   }).addTo(map);

//   showMessageBox("✅ IDW interpolation completed.");
// });
document.getElementById('idwBtn').addEventListener('click', () => {
  if (!precipitationData || precipitationData.length === 0) {
    showMessageBox("No precipitation data loaded.");
    return;
  }

  const selectedYear = parseInt(document.getElementById('yearSelect').value);
  const selectedMonth = parseInt(document.getElementById('monthSelect').value);

  const filteredData = precipitationData.filter(d =>
    parseInt(d.year) === selectedYear &&
    parseInt(d.month) === selectedMonth
  );

  console.log("🎯 Filtered Data Points:", filteredData.length);

  if (filteredData.length === 0) {
    showMessageBox(`⚠️ No precipitation data for ${selectedMonth}/${selectedYear}.`);
    return;
  }

  const features = filteredData.map(d => {
    const lat = parseFloat(d.latitude);
    const lng = parseFloat(d.longitude);
    const value = parseFloat(d.precipitation);
    if (isNaN(lat) || isNaN(lng) || isNaN(value)) return null;
    return turf.point([lng, lat], { precipitation: value });
  }).filter(f => f !== null);

  console.log("✅ Turf-ready features:", features.length);

  if (features.length === 0) {
    showMessageBox("No valid precipitation points to interpolate.");
    return;
  }

  const points = turf.featureCollection(features);

  const bbox = turf.bbox(points);
  map.fitBounds([
    [bbox[1], bbox[0]],
    [bbox[3], bbox[2]]
  ]);

  const grid = turf.interpolate(points, 30, {
    gridType: 'points',
    property: 'precipitation',
    units: 'kilometers'
  });

  console.log("🟩 Interpolated grid features:", grid.features.length);

  if (idwLayer) map.removeLayer(idwLayer);

  idwLayer = L.geoJSON(grid, {
    pointToLayer: (feature, latlng) => {
      const value = feature.properties.precipitation;
      return L.circleMarker(latlng, {
        radius: 6,
        fillColor: getColor(value),
        fillOpacity: 0.7,
        color: '#000',
        weight: 0.5
      }).bindPopup(`Precipitation: ${value.toFixed(2)} mm`);
    }
  }).addTo(map);

  showMessageBox("✅ IDW interpolation completed.");
});
document.getElementById('pointsInPolygonBtn').addEventListener('click', () => {
    if (!map.selectedDistrict) {
        showMessageBox("Please click a district on the map first.");
        return;
    }

    if (!allStationData || allStationData.length === 0) {
        showMessageBox("Station data not loaded.");
        return;
    }

    // Create Turf Polygon from selected district
    const selectedDistrictPolygon = map.selectedDistrict;

    // Create Turf points from stations
    const stationPoints = turf.featureCollection(allStationData.map(s => {
        return turf.point([s.Longitude, s.Latitude], {
            station: s.Station,
            district: s.District,
            elevation: s.Elevation
        });
    }));

    // Perform spatial query
    const stationsInside = turf.pointsWithinPolygon(stationPoints, selectedDistrictPolygon);

    // Remove previous result layer
    if (pointsInPolygonLayer) {
        map.removeLayer(pointsInPolygonLayer);
    }

    // Display matched stations
    pointsInPolygonLayer = L.geoJSON(stationsInside, {
        pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, {
                radius: 7,
                fillColor: "#28a745",
                fillOpacity: 0.8,
                color: "#000",
                weight: 1
            }).bindPopup(`
                <b>Station:</b> ${feature.properties.station}<br>
                <b>District:</b> ${feature.properties.district}<br>
                <b>Elevation:</b> ${feature.properties.elevation} m
            `);
        }
    }).addTo(map);

    showMessageBox(`✅ Found ${stationsInside.features.length} station(s) in ${selectedDistrictPolygon.properties.DISTRICT}.`);
});
document.getElementById('intersectBtn').addEventListener('click', () => {
    if (!bufferLayer || !districtLayer) {
        showMessageBox("Run the buffer operation first.");
        return;
    }

    const bufferGeoJSON = bufferLayer.toGeoJSON();
    const intersectFeatures = [];

    districtLayer.eachLayer(district => {
        const districtGeom = district.feature;
        const intersection = turf.intersect(districtGeom, bufferGeoJSON);
        if (intersection) {
            intersection.properties = {
                district: districtGeom.properties.DISTRICT
            };
            intersectFeatures.push(intersection);
        }
    });

    if (intersectLayer) map.removeLayer(intersectLayer);

    if (intersectFeatures.length > 0) {
        intersectLayer = L.geoJSON(intersectFeatures, {
            style: {
                color: 'red',
                fillOpacity: 0.5,
                weight: 2
            },
            onEachFeature: (feature, layer) => {
                layer.bindPopup(`<b>Intersected District:</b> ${feature.properties.district}`);
            }
        }).addTo(map);
        showMessageBox(`✅ Found ${intersectFeatures.length} intersected district(s).`);
    } else {
        showMessageBox("⚠️ No districts intersected with the buffer zones.");
    }
});

