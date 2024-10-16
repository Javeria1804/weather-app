# Weather Forecast and Chatbot Web Application

This project is a dynamic web application that provides real-time weather forecasts and a chatbot feature. It integrates the **OpenWeather API** for fetching current and forecasted weather data, and utilizes the **Google Gemini API** for AI-driven chatbot responses. Users can search for city-specific weather information and engage with the chatbot for general inquiries.

## Key Features

### Weather Data
- **Current Conditions**: Displays real-time temperature and weather descriptions for any searched city.
- **5-Day Forecast**: Shows a detailed forecast in a tabular format, with pagination for smooth navigation.
- **Dynamic Background**: Automatically updates the background based on weather conditions like sunny, rainy, or cloudy skies.
- **Charts & Visualizations**: Uses **Chart.js** to render interactive charts (bar, line, doughnut) that visualize weather trends such as temperature fluctuations over the forecasted days.
- **Sorting & Filtering**:
  - **Sort by Temperature**: Organize temperatures in ascending or descending order.
  - **Rainy Day Filter**: View only the days with rainy forecasts.
  - **Show Highest Temperature Day**: Highlight the day with the highest temperature forecast.
  - All filtering and sorting options retain pagination for a seamless user experience.

### Chatbot
- **Context-Aware Responses**: The chatbot intelligently responds to weather-related queries, fetching relevant weather data based on user inputs.
- **General Queries**: Powered by the **Google Gemini API**, the chatbot also answers non-weather-related questions with AI-generated responses.

## Prerequisites

Ensure you have the following tools to run this project:
- A code editor or IDE (e.g., **VSCode**).
- A modern web browser (e.g., **Chrome**, **Firefox**, **Edge**).
- A local development server (e.g., **Live Server** in **VSCode**) for enhanced development experience.

### API Key Setup

You will need two API keys:
1. **OpenWeather API Key**: Get it from [OpenWeatherMap](https://openweathermap.org/).
2. **Google Gemini API Key**: Obtain from [Google Cloud](https://ai.google.dev/aistudio).

Add these keys to the 'js' file:

```js
const apiKey = 'YOUR_OPENWEATHER_API_KEY';
const geminiApiKey = 'YOUR_GOOGLE_GEMINI_API_KEY';
```

## Running the Project Locally

To get the project up and running on your local machine, follow these steps:

1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/Javeria1804/weather-app.git
   cd weather-app
   ```

2. **Insert API Keys**:
   Replace the placeholder API keys in the 'js' file:
   ```js
   const apiKey = 'YOUR_OPENWEATHER_API_KEY';
   const geminiApiKey = 'YOUR_GOOGLE_GEMINI_API_KEY';
   ```

3. **Run the Application**:
   Open the `index.html` file in a browser, or use **Live Server** for auto-refresh during development.

4. **Use the Weather Search Feature**:
   - Type a city name and click "Search" or hit Enter.
   - The current weather and 5-day forecast will be displayed, complete with visual representations.

5. **Chat with the Bot**:
   - Enter a query into the chatbot and click "Send" or hit Enter.
   - The bot will reply with weather data if weather-related terms are detected or with AI responses for general queries.

6. **Utilize Sorting and Filtering**:
   - Sort temperatures, filter rainy days, and find the day with the highest temperature, while keeping pagination in place for easy browsing.

## Project File Structure

```bash
weather-chat-bot/
├── index.html               # Main HTML file
├── forecast.html            # Chatbot with forecast table
├── dashboard.js             # Logic for main dashboard
├── forecast.js              # Logic for forecast table with chatbot integration
├── README.md                # Project documentation
└── assets/                  # Static assets (images, icons, etc.)
```

## Libraries & Dependencies

- **Chart.js**: Utilized for creating dynamic weather visualizations.
- **Fetch API**: JavaScript's native tool for making HTTP requests to external APIs.
- **Google Gemini API**: Powers the chatbot with natural language processing for handling non-weather queries.

## Potential Future Enhancements

- **Error Handling**: Improve error feedback for user inputs and API requests.
- **Chat History**: Implement a more sophisticated system for storing and displaying conversation history.
- **Enhanced Charting**: Add more chart interactivity and transitions for a smoother user experience.

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for more information.
