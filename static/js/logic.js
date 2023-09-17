// Create the tile layer that will be the background of the map.
let worldMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Create a layer to hold the earthquake data.
let earthquakeLayer = L.layerGroup(); 

// Create a legend control 
let legend_info = L.control({ position: "bottomright" });

// When the legend control is added, insert a new div with the class of "legend".
legend_info.onAdd = function () {
  let div = L.DomUtil.create("div", "legend");
  let limits = ["90+", "70-90", "50-70", "30-50", "10-30", "-10-10"];
  let colors = ["#481845", "#900C3F", "#C70039", "#FF5733", "#FFC30F", "#FDED80"];
  let labels = [];

  // Loop through the limits and colors to create legend items
  for (let i = 0; i < limits.length; i++) {
    labels.push(
      '<div class="legend-item"><i style="background:' + colors[i] + '"></i>' + limits[i] + '</div>'
    );
  }
  
  div.innerHTML = labels.join('');
  return div;
};

// Function to choose color based on quake_depth
function chooseColor(quake_depth) {
  if (quake_depth >= 90) return "#481845";
  else if (quake_depth >= 70 && quake_depth < 90) return "#900C3F";
  else if (quake_depth >= 50 && quake_depth < 70) return "#C70039";
  else if (quake_depth >= 30 && quake_depth < 50) return "#FF5733";
  else if (quake_depth >= 10 && quake_depth < 30) return "#FFC30F";
  else return "#FDED80";
}

// Perform an API call to the USGS API to get the earthquake information. Call createMarkers when it completes.
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson").then(function (response) {
  createMarkers(response);
});

// Function to create markers to add to the map
function createMarkers(response) {
  // Pull the earthquake data
  let quakes = response.features;
  // Loop through the earthquake data
  for (let index = 0; index < quakes.length; index++) {
    let quake = quakes[index];
    // Get earthquake properties
    //let quake_location = quake.geometry.coordinates.slice(0, 2);
    let quake_lon = quake.geometry.coordinates[0];
    let quake_lat = quake.geometry.coordinates[1];
    let quake_location = [quake_lat, quake_lon];
    let quake_time = new Date(quake.properties.time).toLocaleString();
    let quake_mag = quake.properties.mag;
    // Check if the magnitude is a valid number (not NaN) and greater than or equal to zero
    if (!isNaN(quake_mag) && quake_mag >= 0) {
      let magnitude = parseFloat(quake_mag);
      let quake_depth = quake.geometry.coordinates[2];

      // Check if any of the properties is NaN - assistance from AskBCS
      if (!isNaN(quake_lat) && !isNaN(quake_lon) && !isNaN(quake_depth) && !isNaN(magnitude)) {
        // Create the marker and add it to the earthquake layer
        let quakeMarker = L.circle(quake_location, {
          color: chooseColor(quake_depth),
          radius: quake.properties.mag * 30000,
          fillOpacity: 1,
        }).bindPopup("<h3>" + quake.properties.place + "</h3><h3>Magnitude: " + quake_mag + "</h3><h3>Depth: " + quake_depth + "</h3><h3>Latitude: " + quake_lat + "</h3><h3>Longitude: " + quake_lon + "</h3><h3>Date/Time: " + quake_time + "</h3>");

        earthquakeLayer.addLayer(quakeMarker);
      }
    }
  }
}

// Create a layer to hold the tectonic data.
let tectplatesLayer = L.layerGroup(); 

// Create a variable to hold URL for tectonic plates
let tectonic_url = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

// Style the map

let mapStyle = {
  color: "#2C30A2",
  weight: 1.2,
  dashArray: "3, 3" 
};

// Retrieve the tectonic plate GeoJson data 
d3.json(tectonic_url).then(function(tectonic_Data) {
  // Creating a GeoJSON layer with the retrieved data
  L.geoJson(tectonic_Data, {
    style: mapStyle
  }).addTo(tectplatesLayer);
});

// CREATE LOAD THE MAP

// Create a map object  earthquake layer, and tectonic plates layer
let map = L.map("map", {
  center: [23.24, 94.08,],
  zoom: 2.6,
  layers: [worldMap, earthquakeLayer, tectplatesLayer] 
});

// Create a baseMaps object to hold the world map layer.
let baseMaps = {
  "World Map": worldMap
};

// Create an overlayMaps object to hold the earthquake layer.
let overlayMaps = {
  "Earthquakes": earthquakeLayer
};

// Create an overlayMaps object to hold the earthquake layer.
let overlayMaps2 = {
  "Tectonic Plates": tectplatesLayer
};


// Create a layer control, and pass the baseMaps and overlayMaps to it, then add the layer control to the map.
L.control.layers(baseMaps, { "Earthquakes": earthquakeLayer, "Tectonic Plates": tectplatesLayer },{
  collapsed: false
}).addTo(map);

// Add the legend control to the map.
legend_info.addTo(map);
