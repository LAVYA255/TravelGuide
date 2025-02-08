const OPENWEATHER_API_KEY = "da32149e8c7e8fc1f9285cf7a439697e";
const FOURSQUARE_API_KEY = "fsq3tIrwYtEFLiQcpgXK9SWsGW4OcDlTpS1o5PM8+NRo27U=";
const PEXELS_API_KEY =
  "msjj52FNlxFvSj5QprU2t2cBaWIyPzrj8C6BhttGguFhJ2kbBRdzCwGz";

let map;
let marker;

// Initialize map
function initMap() {
  map = L.map("map").setView([40.7128, -74.006], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);
}

// Search location and update background
async function searchLocation() {
  const location = document.getElementById("location-input").value;
  if (!location) return;

  try {
    // Show loading state
    document.body.style.opacity = "0.9";

    // Fetch location data
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        location
      )}`
    );
    const data = await response.json();

    if (data.length === 0) {
      alert("Location not found");
      document.body.style.opacity = "1";
      return;
    }

    const { lat, lon } = data[0];

    // Update map and fetch data
    updateMap(parseFloat(lat), parseFloat(lon));
    await Promise.all([
      fetchWeather(lat, lon),
      fetchNearbyPlaces(lat, lon),
      fetchLocationBackground(location),
    ]);

    document.body.style.opacity = "1";
  } catch (error) {
    console.error("Error:", error);
    alert("Error fetching location data");
    document.body.style.opacity = "1";
  }
}

// Update map marker
function updateMap(lat, lng) {
  map.setView([lat, lng], 13);
  if (marker) marker.remove();
  marker = L.marker([lat, lng]).addTo(map);
}

// Fetch weather data
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

// Fetch nearby places
// Fetch nearby places
// Fetch nearby places
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
        <div class="place-item" data-lat="${
          place.geocodes.main.latitude
        }" data-lng="${place.geocodes.main.longitude}" data-name="${
        place.name
      }">
          <div class="place-info">
            <h3>${place.name}</h3>
            <p>${place.location.address || "Address not available"}</p>
          </div>
        </div>
      `
    )
    .join("");

  const placesList = document.getElementById("places-list");
  placesList.innerHTML = placesHTML;

  // Attach event listeners to each place
  document.querySelectorAll(".place-item").forEach((item) => {
    item.addEventListener("click", function () {
      const newLat = this.getAttribute("data-lat");
      const newLng = this.getAttribute("data-lng");
      const placeName = this.getAttribute("data-name");

      // Update search input field
      document.getElementById("location-input").value = placeName;

      // Show place name in translucent white box
      showPlaceOverlay(placeName);

      // Update the map and fetch data (but skip background update)
      updateMap(parseFloat(newLat), parseFloat(newLng));
      fetchWeather(newLat, newLng);
      fetchNearbyPlaces(newLat, newLng);
    });
  });
}
// Function to show translucent white box with place name
function showPlaceOverlay(placeName) {
  let overlay = document.getElementById("place-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "place-overlay";
    document.body.appendChild(overlay);
  }

  overlay.innerText = placeName;
  overlay.style.display = "block";

  // Hide the overlay after 3 seconds
  setTimeout(() => {
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.style.display = "none";
    }, 500); // Delay to allow fade out animation
  }, 3000);
}

// Fetch and set background image
async function fetchLocationBackground(location) {
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        location
      )}&orientation=landscape&per_page=5`, // Ensure at least 5 images are requested
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch background image");
    }

    const data = await response.json();

    if (data.photos && data.photos.length > 0) {
      // Ensure the index is within bounds
      let x = Math.floor(Math.random() * data.photos.length);
      const photo = data.photos[x];

      if (photo && photo.src && photo.src.original) {
        // Preload image
        const img = new Image();
        img.onload = function () {
          document.body.style.backgroundImage = `url(${photo.src.original})`;
          document.body.style.backgroundSize = "cover";
          document.body.style.backgroundPosition = "center";
          document.body.style.backgroundRepeat = "no-repeat";
          document.body.style.backgroundAttachment = "fixed";
        };
        img.src = photo.src.original;
      } else {
        console.error("Invalid photo data from Pexels API");
      }
    } else {
      console.error("No photos found in Pexels API response");
    }
  } catch (error) {
    console.error("Error fetching background:", error);
  }
}

// Event listener for Enter key
document
  .getElementById("location-input")
  .addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      searchLocation();
    }
  });

// Initialize map on load
initMap();

// Add necessary styles to your CSS
const styles = `
body {
    transition: background-image 0.5s ease-in-out;
}

/* Add semi-transparent overlay to containers for better readability */
.search-container,
.card {
    background: rgba(255, 255, 255, 0.95);
}
`;

// Create and append style element
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
