// DOM elements
const cityInput = document.getElementById('city-input');
const getForecastBtn = document.getElementById('get-forecast-btn');
const forecastTableBody = document.getElementById('forecast-table-body');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendMessageBtn = document.getElementById('send-message-btn');

const openWeatherApiKey = 'ec6da802be24d34a7400376f4a55114d';  // Replace with your OpenWeather API key

let forecastData = [];
let currentPage = 1;
const entriesPerPage = 10;

// Function to fetch 5-day forecast data
function getForecastData(city) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${openWeatherApiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.cod === "200") {
                forecastData = data.list;
                currentPage = 1; // Reset to first page
                displayForecast();
            } else {
                forecastTableBody.innerHTML = '<tr><td colspan="3" class="text-center">City not found.</td></tr>';
            }
        })
        .catch(error => {
            forecastTableBody.innerHTML = '<tr><td colspan="3" class="text-center">Error fetching data.</td></tr>';
            console.error(error);
        });
}

// Function to display forecast data in the table
function displayForecast() {
    const start = (currentPage - 1) * entriesPerPage;
    const end = start + entriesPerPage;
    const paginatedData = forecastData.slice(start, end);

    // Clear existing data
    forecastTableBody.innerHTML = '';

    paginatedData.forEach(entry => {
        const date = new Date(entry.dt_txt).toLocaleDateString();
        const temp = entry.main.temp;
        const condition = entry.weather[0].description;

        const row = `
            <tr>
                <td class="px-4 py-2">${date}</td>
                <td class="px-4 py-2">${temp} °C</td>
                <td class="px-4 py-2 capitalize">${condition}</td>
            </tr>
        `;
        forecastTableBody.innerHTML += row;
    });

    // Manage pagination buttons
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = end >= forecastData.length;
}

// Event listeners for pagination
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayForecast();
    }
});

nextPageBtn.addEventListener('click', () => {
    if ((currentPage * entriesPerPage) < forecastData.length) {
        currentPage++;
        displayForecast();
    }
});

function handleGetForecast() {
    const city = cityInput.value;
    if (city) {
        getForecastData(city);
    } else {
        forecastTableBody.innerHTML = '<tr><td colspan="3" class="text-center">Please enter a city.</td></tr>';
    }
}

// Event listener for getting forecast
getForecastBtn.addEventListener('click', handleGetForecast);
// Add Enter key event listener
cityInput.addEventListener('keypress', event => {
    if (event.key === 'Enter') {
        handleGetForecast();
    }
});

// Chatbot interaction
sendMessageBtn.addEventListener('click', () => {
    const userMessage = userInput.value;
    if (userMessage) {
        addMessageToChat('You', userMessage);
        handleUserQuery(userMessage);
        userInput.value = '';
    }
});

// Use Enter key to send message
userInput.addEventListener('keyup', event => {
    if (event.key === 'Enter') {
        sendMessageBtn.click();
    }
});

// Function to add messages to chat window
function addMessageToChat(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = `${sender}: ${message}`;
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight; // Auto-scroll to the bottom
}

// Function to detect if user query is related to weather
function isWeatherQuery(message) {
    const weatherKeywords = ['weather', 'forecast', 'temperature'];
    return weatherKeywords.some(keyword => message.toLowerCase().includes(keyword));
}

// Function to handle user queries
function handleUserQuery(message) {
    if (isWeatherQuery(message)) {
        const city = message.split(' ').pop(); // Assuming the city is the last word
        getForecastData(city);
        if (forecastData.length === 0) {
            addMessageToChat('Chatbot', 'Sorry, I could not find the weather for that city. Please enter the city name at the end of your message.');
        }
    } else {
        getChatbotResponse(message);
    }
}

// Function to get response from Gemini API
async function getChatbotResponse(message) {
    const apiKey = 'AIzaSyC3_db0vfm8Vbjh76NP7nMkIfx4bRKPdJ8'; // Replace with your Gemini API key
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        text: message // The user's message
                    }
                ]
            }
        ]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            const data = await response.json();
            const chatbotMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I didn't understand that.";
            addMessageToChat('Chatbot', chatbotMessage);
        } else {
            addMessageToChat('Chatbot', 'Sorry, there was an error getting the response.');
        }
    } catch (error) {
        console.error('Error fetching Gemini API:', error);
        addMessageToChat('Chatbot', 'Sorry, an error occurred while connecting to the chatbot.');
    }
}
// DOM elements for buttons
const sortAscendingBtn = document.getElementById('sort-ascending-btn');
const sortDescendingBtn = document.getElementById('sort-descending-btn');
const filterRainBtn = document.getElementById('filter-rain-btn');
const highestTempBtn = document.getElementById('highest-temp-btn');

// Event Listener: Sort temperatures in ascending order
sortAscendingBtn.addEventListener('click', () => {
    forecastData.sort((a, b) => a.main.temp - b.main.temp);
    displayForecast();
});

// Event Listener: Sort temperatures in descending order
sortDescendingBtn.addEventListener('click', () => {
    forecastData.sort((a, b) => b.main.temp - a.main.temp);
    displayForecast();
});

// Event Listener: Filter out days without rain
filterRainBtn.addEventListener('click', () => {
    const rainyDays = forecastData.filter(entry => entry.weather[0].description.includes('rain'));
    displayFilteredForecast(rainyDays);
});

// Event Listener: Show the day with the highest temperature
highestTempBtn.addEventListener('click', () => {
    const highestTempDay = forecastData.reduce((prev, current) => {
        return (prev.main.temp > current.main.temp) ? prev : current;
    });
    displayFilteredForecast([highestTempDay]);
});

// Function to display filtered forecast data
function displayFilteredForecast(filteredData) {
    // Clear existing data
    forecastTableBody.innerHTML = '';

    filteredData.forEach(entry => {
        const date = new Date(entry.dt_txt).toLocaleDateString();
        const temp = entry.main.temp;
        const condition = entry.weather[0].description;

        const row = `
            <tr>
                <td class="px-4 py-2">${date}</td>
                <td class="px-4 py-2">${temp} °C</td>
                <td class="px-4 py-2 capitalize">${condition}</td>
            </tr>
        `;
        forecastTableBody.innerHTML += row;
    });
}
