const apiKey = 'ec6da802be24d34a7400376f4a55114d'; // Insert your OpenWeather API key here
const geminiApiKey = 'AIzaSyC3_db0vfm8Vbjh76NP7nMkIfx4bRKPdJ8'; // Replace with your Gemini API Key

const apiUrlCurrent = 'https://api.openweathermap.org/data/2.5/weather?q=';
const apiUrlForecast = 'https://api.openweathermap.org/data/2.5/forecast?q=';
const geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + geminiApiKey;

const loadingElement = document.getElementById('loading');
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const forecastTableBody = document.getElementById('forecastTableBody');
const chatOutput = document.getElementById('chatOutput');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let weatherData = []; // Store the fetched weather data
let currentPage = 0; // Track the current page
const itemsPerPage = 5; // Number of items to display per page

// Add event listeners
searchBtn.addEventListener('click', () => fetchWeatherData(cityInput.value.trim()));
cityInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        fetchWeatherData(cityInput.value.trim());
    }
});
sendBtn.addEventListener('click', handleUserQuery);
userInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        handleUserQuery();
    }
});
prevBtn.addEventListener('click', showPrevPage);
nextBtn.addEventListener('click', showNextPage);

// Fetch weather data from the API
function fetchWeatherData(city) {
    if (!city) {
        displayError('No city found');
        return;
    }

    loadingElement.classList.remove('hidden');

    // Fetch current weather data
    fetch(`${apiUrlCurrent}${city}&appid=${apiKey}&units=metric`)
        .then(response => response.json())
        .then(data => updateWeatherWidget(data))
        .catch(error => console.error('Error fetching current weather:', error))
        .finally(() => loadingElement.classList.add('hidden'));

    // Fetch 5-day forecast data
    fetch(`${apiUrlForecast}${city}&appid=${apiKey}&units=metric`)
        .then(response => response.json())
        .then(data => {
            weatherData = data.list;
            currentPage = 0;
            updateTable();
        })
        .catch(error => console.error('Error fetching forecast:', error))
        .finally(() => loadingElement.classList.add('hidden'));
}

// Display an error in the table if no city is found
function displayError(message) {
    forecastTableBody.innerHTML = `
        <tr>
            <td class="p-2 border-b text-center" colspan="3">${message}</td>
        </tr>`;
}

// Update the weather widget
function updateWeatherWidget(data) {
    if (data.cod !== 200) {
        alert(data.message);
        return;
    }
    const weatherDescription = data.weather[0].description;
    const temperature = Math.round(data.main.temp);

    // Display current weather (you can customize this further)
    console.log(`Weather in ${data.name}: ${weatherDescription}, ${temperature}°C`);
}

// Update the weather forecast table based on the current page
function updateTable() {
    forecastTableBody.innerHTML = '';
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;

    // Populate table rows for the current page
    weatherData.slice(start, end).forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="p-2 border-b">${item.dt_txt}</td>
            <td class="p-2 border-b">${item.main.temp} °C</td>
            <td class="p-2 border-b">${item.weather[0].main}</td>
        `;
        forecastTableBody.appendChild(row);
    });

    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = end >= weatherData.length;
}

// Show previous page
function showPrevPage() {
    if (currentPage > 0) {
        currentPage--;
        updateTable();
    }
}

// Show next page
function showNextPage() {
    if ((currentPage + 1) * itemsPerPage < weatherData.length) {
        currentPage++;
        updateTable();
    }
}

// Handle user query (detect if it's weather-related or general)
function handleUserQuery() {
    const message = userInput.value.trim();
    if (!message) return;

    chatOutput.innerHTML += `<div class="text-right text-yellow-600 p-2">${message}</div>`;
    userInput.value = ''; // Clear input

    if (message.toLowerCase().includes('weather') || message.toLowerCase().includes('forecast')) {
        const city = message.split(' ').pop();
        fetchWeatherData(city);

        if (!city) {
            chatOutput.innerHTML += `<div class="text-left text-gray-600 p-2">Please provide a city name for the weather forecast.</div>`;
        }
    } else {
        sendChatMessageToGemini(message);
    }
}

// Send a chat message to Gemini API for non-weather-related queries
function sendChatMessageToGemini(message) {
    loadingElement.classList.remove('hidden');

    const requestBody = {
        contents: [{ parts: [{ text: message }] }]
    };

    fetch(geminiApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    })
        .then(response => response.json())
        .then(data => {
            const geminiResponse = data?.candidates?.[0]?.content.parts?.[0]?.text || "I couldn't find an answer.";
            chatOutput.innerHTML += `<div class="text-left text-gray-600 p-2">${geminiResponse}</div>`;
        })
        .catch(error => console.error('Error with Gemini API:', error))
        .finally(() => {
            loadingElement.classList.add('hidden');
            chatOutput.scrollTop = chatOutput.scrollHeight;
        });
}
