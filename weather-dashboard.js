const apiKey = 'ec6da802be24d34a7400376f4a55114d'; // Insert your OpenWeather API key here
const apiUrlCurrent = 'https://api.openweathermap.org/data/2.5/weather?q=';
const apiUrlForecast = 'https://api.openweathermap.org/data/2.5/forecast?q=';

const weatherWidget = document.getElementById('weatherWidget');
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const cityNameElement = document.getElementById('cityName');
const weatherConditionElement = document.getElementById('weatherCondition');
const temperatureElement = document.getElementById('temperature');
const weatherIconElement = document.getElementById('weatherIcon');
const forecastTableBody = document.getElementById('forecastTableBody');
const loadingElement = document.getElementById('loading');

// Add event listeners to the Search button
document.getElementById('searchBtn').addEventListener('click', fetchWeatherData);
// Also add Enter key event listener
document.getElementById('cityInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        fetchWeatherData();
    }
});

function fetchWeatherData() {
    const city = cityInput.value;
    if (!city) {
        alert('Please enter a city name');
        return;
    }

    // Show loading spinner
    loadingElement.classList.remove('hidden');

    // Fetch Current Weather Data
    fetch(`${apiUrlCurrent}${city}&appid=${apiKey}&units=metric`)
        .then(response => response.json())
        .then(data => {
            updateWeatherWidget(data);
        })
        .catch(error => {
            console.error('Error fetching current weather:', error)
            alert('City not found. Please try again!');
            // clear the widget
            cityNameElement.classList.add('hidden');
            weatherConditionElement.classList.add('hidden');
            temperatureElement.classList.add('hidden');
            weatherIconElement.classList.add('hidden');
            weatherWidget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(200, 200, 200, 1) 100%)'; // Default fallback
            // hide the charts
            document.getElementById('tempBarChart').style.display = 'none';
            document.getElementById('weatherDoughnutChart').style.display = 'none';
            document.getElementById('tempLineChart').style.display = 'none';

            // clear the input field
            cityInput.value = '';

        })
        .finally(() => loadingElement.classList.add('hidden')); // Hide loading spinner

    // Fetch 5-Day Forecast Data
    fetch(`${apiUrlForecast}${city}&appid=${apiKey}&units=metric`)
        .then(response => response.json())
        .then(data => {
            updateCharts(data);
            updateTable(data);
        })
        .catch(error => console.error('Error fetching forecast:', error))
        .finally(() => loadingElement.classList.add('hidden')); // Hide loading spinner
}

function updateWeatherWidget(data) {
    // remove the hidden classes
    cityNameElement.classList.remove('hidden');
    weatherConditionElement.classList.remove('hidden');
    temperatureElement.classList.remove('hidden');
    weatherIconElement.classList.remove('hidden');

    cityNameElement.textContent = data.name;
    weatherConditionElement.textContent = data.weather[0].description;
    temperatureElement.textContent = `${Math.round(data.main.temp)}°C`;
    weatherIconElement.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    // Update background based on weather condition
    updateBackground(data.weather[0].main);
}

function updateBackground(weatherCondition) {
    let backgroundGradient = '';
    switch (weatherCondition) {
        case 'Clear':
            backgroundGradient = 'linear-gradient(135deg, rgba(255, 204, 128, 1) 0%, rgba(255, 159, 64, 1) 100%)'; // Sunny colors
            break;
        case 'Clouds':
            backgroundGradient = 'linear-gradient(135deg, rgba(200, 200, 200, 1) 0%, rgba(150, 150, 150, 1) 100%)'; // Cloudy colors
            break;
        case 'Rain':
            backgroundGradient = 'linear-gradient(135deg, rgba(135, 206, 250, 1) 0%, rgba(70, 130, 180, 1) 100%)'; // Rainy colors
            break;
        case 'Snow':
            backgroundGradient = 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(192, 192, 192, 1) 100%)'; // Snow colors
            break;
        case 'Thunderstorm':
            backgroundGradient = 'linear-gradient(135deg, rgba(105, 105, 105, 1) 0%, rgba(47, 79, 79, 1) 100%)'; // Thunderstorm colors
            break;
        case 'Drizzle':
            backgroundGradient = 'linear-gradient(135deg, rgba(173, 216, 230, 1) 0%, rgba(100, 149, 237, 1) 100%)'; // Drizzle colors
            break;
        case 'Mist':
            backgroundGradient = 'linear-gradient(135deg, rgba(169, 169, 169, 1) 0%, rgba(119, 136, 153, 1) 100%)'; // Mist colors
            break;
        default:
            backgroundGradient = 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(200, 200, 200, 1) 100%)'; // Default fallback
    }

    // Apply the dynamic gradient background to the widget
    weatherWidget.style.background = backgroundGradient;
}


function updateCharts(data) {
    const tempData = [];
    const weatherData = {};

    data.list.slice(0, 5).forEach(item => {
        tempData.push(item.main.temp);
        const condition = item.weather[0].main;

        weatherData[condition] = (weatherData[condition] || 0) + 1;
    });

    // Bar chart
    new Chart(document.getElementById('tempBarChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'],
            datasets: [{
                label: 'Temperature (°C)',
                data: tempData,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            animation: {
                delay: 1000
            }
        }
    });

    // Doughnut chart
    new Chart(document.getElementById('weatherDoughnutChart').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(weatherData),
            datasets: [{
                label: 'Weather Conditions',
                data: Object.values(weatherData),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
            }]
        },
        options: {
            animation: {
                delay: 1000
            }
        }
    });

    // Line chart
    new Chart(document.getElementById('tempLineChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'],
            datasets: [{
                label: 'Temperature (°C)',
                data: tempData,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
            }]
        },
        options: {
            animation: {
                drop: true
            }
        }
    });
}

function updateTable(data) {
    const tableBody = document.getElementById('forecastTableBody');
    tableBody.innerHTML = '';

    data.list.slice(0, 5).forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-2 border-b">${item.dt_txt}</td>
            <td class="p-2 border-b">${item.main.temp} °C</td>
            <td class="p-2 border-b">${item.weather[0].main}</td>
        `;
        tableBody.appendChild(row);
    });
}
