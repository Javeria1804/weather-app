// Get elements from the DOM
const cityInput = document.getElementById('city-input');
const getWeatherBtn = document.getElementById('get-weather-btn');
const weatherDataElement = document.getElementById('weather-data');
const weatherWidget = document.getElementById('weather-widget');
const weatherIcon = document.getElementById('weather-icon');

const apiKey = 'ec6da802be24d34a7400376f4a55114d';  // Replace this with your OpenWeather API key

// Function to fetch current weather data
function getWeatherData(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.cod === 200) {
                // Parse and display weather data
                const temp = data.main.temp;
                const weatherDescription = data.weather[0].description;
                const weatherMain = data.weather[0].main; // Primary weather condition (Clear, Rain, etc.)
                const cityName = data.name;
                const icon = data.weather[0].icon; // Weather icon code

                weatherDataElement.innerHTML = `
                    <h3>${cityName}</h3>
                    <p>Temperature: ${temp} °C</p>
                    <p>Weather: ${weatherDescription}</p>
                `;

                // Update the weather icon
                weatherIcon.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
                weatherIcon.style.display = 'block';

                // Update the background based on weather condition
                updateWeatherWidgetBackground(weatherMain);

                // Update charts
                updateCharts(city);
            } else {
                weatherDataElement.textContent = 'City not found. Please try again.';
                resetWeatherWidget();
            }
        })
        .catch(error => {
            weatherDataElement.textContent = 'Error fetching data. Please try again.';
            resetWeatherWidget();
            console.error(error);
        });
}

// Function to update the weather widget background color based on the weather condition
function updateWeatherWidgetBackground(weatherMain) {
    const colorClasses = {
        'Clear': 'bg-blue-200',
        'Clouds': 'bg-gray-300',
        'Rain': 'bg-blue-400',
        'Drizzle': 'bg-blue-300',
        'Snow': 'bg-white',
        'Thunderstorm': 'bg-gray-600',
        'Mist': 'bg-gray-400',
        'Smoke': 'bg-gray-500',
        'Haze': 'bg-gray-400',
        'Dust': 'bg-yellow-300',
        'Fog': 'bg-gray-500',
        'Sand': 'bg-yellow-300',
        'Ash': 'bg-gray-500',
        'Squall': 'bg-gray-700',
        'Tornado': 'bg-red-600'
    };

    // Reset background classes
    weatherWidget.className = 'p-6 rounded-lg mb-4';

    // Apply new background color based on weather condition
    const newClass = colorClasses[weatherMain] || 'bg-gray-300'; // Default color
    weatherWidget.classList.add(newClass);
}

// Reset weather widget background and icon
function resetWeatherWidget() {
    weatherWidget.className = 'p-6 rounded-lg mb-4 bg-gray-300';
    weatherIcon.style.display = 'none';
}

// Function to fetch 5-day forecast and update charts
function updateCharts(city) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

    fetch(forecastUrl)
        .then(response => response.json())
        .then(data => {
            const tempData = [];
            const labels = [];
            const weatherConditions = {
                sunny: 0,
                cloudy: 0,
                rainy: 0
            };

            // Loop through the forecast data to extract temperatures and conditions
            for (let i = 0; i < data.list.length; i += 8) {
                const temp = data.list[i].main.temp;
                const condition = data.list[i].weather[0].main;

                // Map weather condition to categories
                if (condition === 'Clear') weatherConditions.sunny++;
                if (condition === 'Clouds') weatherConditions.cloudy++;
                if (condition === 'Rain') weatherConditions.rainy++;

                labels.push(new Date(data.list[i].dt_txt).toLocaleDateString());
                tempData.push(temp);
            }

            // Update charts with new data
            updateBarChart(tempData, labels);
            updateDoughnutChart(weatherConditions);
            updateLineChart(tempData, labels);
        });
}

// Function to update bar chart
function updateBarChart(tempData, labels) {
    new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: tempData,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            animation: {
                delay: 500
            }
        }
    });
}

// Function to update doughnut chart
function updateDoughnutChart(weatherConditions) {
    new Chart(document.getElementById('doughnutChart'), {
        type: 'doughnut',
        data: {
            labels: ['Sunny', 'Cloudy', 'Rainy'],
            datasets: [{
                data: [weatherConditions.sunny, weatherConditions.cloudy, weatherConditions.rainy],
                backgroundColor: ['#FFCE56', '#36A2EB', '#FF6384']
            }]
        },
        options: {
            animation: {
                delay: 500
            }
        }
    });
}

// Function to update line chart
function updateLineChart(tempData, labels) {
    new Chart(document.getElementById('lineChart'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: tempData,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            animation: {
                duration: 1000,
                easing: 'easeOutBounce'
            }
        }
    });
}

// Function to get weather data when the button is clicked
function handleGetWeatherData() {
    const city = cityInput.value;
    console.log(city);
    if (city) {
        getWeatherData(city);
    } else {
        weatherDataElement.textContent = 'Please enter a city.';
    }
}

// Add event listener to the button
getWeatherBtn.addEventListener('click', handleGetWeatherData);
// Add Event Key Listener
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleGetWeatherData();
    }
});
