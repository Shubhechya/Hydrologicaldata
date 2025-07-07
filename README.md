# Hydrologicaldata
# Nepal Geo-Climate & Spatial Analysis Portal

This is a Web GIS portal developed using Flask and Leaflet to visualize and analyze precipitation, rivers, districts, and meteorological station data across Nepal for the years 2020–2024.

## 🌐 Features

- Interactive base maps (OSM, Satellite, Topographic)
- Layer toggling (Rivers, Districts, Stations, Precipitation)
- Filter precipitation by **year**, **month**, and **station**
- Popups with detailed station and rainfall info
- Legends for rainfall and station data
- 🔍 **Spatial Analysis Tools**:
  - Buffer High Rain Stations (2 km)
  - Stations in Selected District
  - Intersect Districts with buffer
  - IDW Interpolation of Precipitation
  - Clear all analysis layers

## 🛠️ Technologies Used

- **Frontend**: Leaflet.js, Turf.js, HTML/CSS/JS
- **Backend**: Flask (Python)
- **Data**: GeoJSON (districts, rivers), CSV (stations, precipitation)
- **Visualization**: Circle markers, colored layers, legends


