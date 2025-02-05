const OPENWEATHER_API_KEY = "da32149e8c7e8fc1f9285cf7a439697e";
const FOURSQUARE_API_KEY = "fsq3tIrwYtEFLiQcpgXK9SWsGW4OcDlTpS1o5PM8+NRo27U=";

let map;
let marker;
function initMap() {
  map = L.map("map").setView([40.7128, -74.006], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);
}

async function searchLocation() {
  const location = document.getElementById("location-input").value;
  if (!location) return;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        location
      )}`
    );
    const data = await response.json();

    if (data.length === 0) {
      alert("Location not found");
      return;
    }

    const { lat, lon } = data[0];
    updateMap(parseFloat(lat), parseFloat(lon));
    await Promise.all([fetchWeather(lat, lon), fetchNearbyPlaces(lat, lon)]);
  } catch (error) {
    console.error("Error:", error);
    alert("Error fetching location data");
  }
}

function updateMap(lat, lng) {
  map.setView([lat, lng], 13);
  if (marker) marker.remove();
  marker = L.marker([lat, lng]).addTo(map);
}

async function fetchWeather(lat, lng) {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${OPENWEATHER_API_KEY}`
  );
  const data = await response.json();

  document.getElementById("weather-info").innerHTML = `
          <div class="temperature">${Math.round(data.main.temp)}°C</div>
          <p>${data.weather[0].description}</p>
          <div class="weather-details">
              <div class="weather-detail-item">
                  <p>Humidity</p>
                  <strong>${data.main.humidity}%</strong>
              </div>
              <div class="weather-detail-item">
                  <p>Wind</p>
                  <strong>${Math.round(data.wind.speed)} km/h</strong>
              </div>
          </div>
      `;
}

async function fetchNearbyPlaces(lat, lng) {
  const response = await fetch(
    `https://api.foursquare.com/v3/places/search?ll=${lat},${lng}&radius=5000&categories=16000&limit=5`,
    {
      headers: {
        Authorization: FOURSQUARE_API_KEY,
        Accept: "application/json",
      },
    }
  );
  const data = await response.json();

  const placesHTML = data.results
    .map(
      (place) => `
          <div class="place-item">
              <div class="place-info">
                  <h3>${place.name}</h3>
                  <p>${place.location.address || "Address not available"}</p>
              </div>
              
          </div>
      `
    )
    .join("");

  document.getElementById("places-list").innerHTML = placesHTML;
}

initMap();
