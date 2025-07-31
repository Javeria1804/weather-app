class WeatherDashboard {
    constructor() {
        this.API_KEY = 'ec6da802be24d34a7400376f4a55114d';
        this.BASE_URL = 'https://api.openweathermap.org/data/2.5';
        this.currentUnit = 'metric';
        this.recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
        this.favorites = JSON.parse(localStorage.getItem('weatherFavorites')) || [];
        this.currentLocation = null;
        this.weatherData = {};
        this.currentWeatherData = null; // Store current weather data for timezone access
        this.timeInterval = null; // For real-time clock updates
        this.miniCharts = {};
        this.analyticsCharts = {};
        this.weatherMap = null;
        this.quickMap = null;
        this.currentPage = 'dashboard';
        this.forecastType = 'daily';
        this.forecastOffset = 0;
        this.maxForecastDays = 10;
        this.selectedLocation = null;
        this.settings = JSON.parse(localStorage.getItem('weatherSettings')) || {
            temperatureUnit: 'celsius',
            notifications: true,
            autoLocation: true,
            theme: 'auto'
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.setupForecastNavigation();
        this.setupModalHandlers();
        this.setupMobileMenu();
        this.displayRecentCities();
        this.loadFavorites();
        this.loadSettings();
        this.getCurrentLocation();
        this.createMiniCharts();
        
        // Initialize quick map after a delay to ensure DOM is ready
        setTimeout(() => {
            this.initializeQuickMap();
        }, 1000);
    }

    setupEventListeners() {
        // Search functionality
        const searchBtn = document.getElementById('search-btn');
        const cityInput = document.getElementById('city-search');
        const locationBtn = document.getElementById('location-btn');
        const favoriteBtn = document.getElementById('favorite-btn');

        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchCity());
        }

        if (cityInput) {
            cityInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.searchCity();
            });
        }

        if (locationBtn) {
            locationBtn.addEventListener('click', () => this.getCurrentLocation());
        }

        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => this.toggleFavorite());
        }

        // Forecast toggle buttons
        const dailyBtn = document.getElementById('daily-btn');
        const hourlyBtn = document.getElementById('hourly-btn');
        
        if (dailyBtn) {
            dailyBtn.addEventListener('click', () => this.switchForecastType('daily'));
        }
        
        if (hourlyBtn) {
            hourlyBtn.addEventListener('click', () => this.switchForecastType('hourly'));
        }
    }

    setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const page = link.getAttribute('data-page');
            this.showPage(page);
        });
    });
}


    showPage(page) {
    const allPages = ['dashboard', 'analytics', 'locations', 'map', 'settings'];

    allPages.forEach(id => {
        const section = document.getElementById(`${id}-content`);
        if (section) section.classList.add('hidden');
    });

    const activeSection = document.getElementById(`${page}-content`);
    if (activeSection) activeSection.classList.remove('hidden');

    this.currentPage = page;

    // Optional methods
    if (page === 'analytics') this.initializeAnalyticsCharts?.();
    if (page === 'map') setTimeout(() => this.initializeMap?.(), 200);
    if (page === 'locations') this.loadLocationsPage?.();
    if (page === 'settings') this.loadSettingsPage?.();
}

    setupForecastNavigation() {
        const prevBtn = document.getElementById('forecast-prev');
        const nextBtn = document.getElementById('forecast-next');
        const dailyBtn = document.getElementById('daily-btn');
        const hourlyBtn = document.getElementById('hourly-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.navigateForecast('prev'));
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.navigateForecast('next'));
        }

        if (dailyBtn) {
            dailyBtn.addEventListener('click', () => this.switchForecastType('daily'));
        }

        if (hourlyBtn) {
            hourlyBtn.addEventListener('click', () => this.switchForecastType('hourly'));
        }
    }

    navigateForecast(direction) {
        console.log('navigateForecast called:', direction, 'current offset:', this.forecastOffset);
        
        const maxOffset = this.forecastType === 'daily' ? 
            Math.max(0, this.maxForecastDays - 5) : 
            Math.max(0, 24 - 6);

        console.log('Max offset:', maxOffset, 'for type:', this.forecastType);

        if (direction === 'next' && this.forecastOffset < maxOffset) {
            this.forecastOffset += 1;
            console.log('Moving to next, new offset:', this.forecastOffset);
        } else if (direction === 'prev' && this.forecastOffset > 0) {
            this.forecastOffset -= 1;
            console.log('Moving to prev, new offset:', this.forecastOffset);
        } else {
            console.log('Navigation blocked - at boundary');
        }

        this.updateForecastDisplay();
    }

    switchForecastType(type) {
        this.forecastType = type;
        this.forecastOffset = 0;
        
        // Update button states
        document.getElementById('daily-btn').classList.toggle('active', type === 'daily');
        document.getElementById('hourly-btn').classList.toggle('active', type === 'hourly');
        
        // Show/hide containers
        const dailyContainer = document.getElementById('daily-forecast-container');
        const hourlyContainer = document.getElementById('hourly-forecast-container');
        
        if (type === 'daily') {
            if (dailyContainer) dailyContainer.classList.remove('hidden');
            if (hourlyContainer) hourlyContainer.classList.add('hidden');
        } else {
            if (dailyContainer) dailyContainer.classList.add('hidden');
            if (hourlyContainer) hourlyContainer.classList.remove('hidden');
        }
        
        this.updateForecastDisplay();
    }

    setupModalHandlers() {
        const addLocationBtn = document.getElementById('add-location-btn');
        const modal = document.getElementById('add-location-modal');
        const closeBtn = document.querySelector('.modal-close');
        const cancelBtn = document.getElementById('cancel-location');
        const addBtn = document.getElementById('add-location');
        const searchInput = document.getElementById('location-search');

        if (addLocationBtn) {
            addLocationBtn.addEventListener('click', () => this.showAddLocationModal());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideAddLocationModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideAddLocationModal());
        }

        if (addBtn) {
            addBtn.addEventListener('click', () => this.addSelectedLocation());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideAddLocationModal();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchLocations(e.target.value));
        }
    }

    setupMobileMenu() {
        // Close mobile menu when clicking on nav links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const sidebar = document.getElementById('sidebar');
                const overlay = document.querySelector('.mobile-overlay');
                const menuToggle = document.querySelector('.mobile-menu-toggle');
                
                if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('mobile-open')) {
                    sidebar.classList.remove('mobile-open');
                    overlay.classList.remove('active');
                    menuToggle.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.querySelector('.mobile-overlay');
            const menuToggle = document.querySelector('.mobile-menu-toggle');
            
            if (window.innerWidth > 768) {
                // Reset mobile menu state on desktop
                if (sidebar) sidebar.classList.remove('mobile-open');
                if (overlay) overlay.classList.remove('active');
                if (menuToggle) menuToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Add touch-friendly interactions
        document.addEventListener('touchstart', () => {}, {passive: true});
    }

    createMiniCharts() {
        const chartIds = ['uv-chart', 'humidity-chart', 'wind-chart', 'visibility-chart', 'pressure-chart'];
        
        chartIds.forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                
                // Sample data for demonstration
                const data = this.generateMiniChartData(id);
                
                this.miniCharts[id] = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['6h ago', '4h ago', '2h ago', 'Now'],
                        datasets: [{
                            data: data,
                            borderColor: this.getChartColor(id),
                            backgroundColor: this.getChartColor(id) + '20',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                            pointHoverRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            x: { display: false },
                            y: { display: false }
                        },
                        elements: {
                            line: { borderWidth: 2 }
                        }
                    }
                });
            }
        });
    }

    generateMiniChartData(chartId) {
        // Generate realistic sample data based on chart type
        switch(chartId) {
            case 'uv-chart':
                return [2, 4, 6, 5];
            case 'humidity-chart':
                return [60, 65, 68, 65];
            case 'wind-chart':
                return [12, 15, 18, 15];
            case 'visibility-chart':
                return [8, 9, 10, 10];
            case 'pressure-chart':
                return [1010, 1012, 1013, 1013];
            default:
                return [10, 20, 15, 25];
        }
    }

    getChartColor(chartId) {
        // Get current time to determine if it's day or night
        const hour = new Date().getHours();
        const isDay = hour >= 6 && hour < 20;
        
        // Enhanced colors for better visibility in both day and night modes
        const colors = {
            'uv-chart': isDay ? '#0465b4ff' : '#b0c4de',        // Darker orange for day
            'humidity-chart': isDay ? '#008b8b' : '#20b2aa',   // Darker teal for day
            'wind-chart': isDay ? '#ff4500' : '#ff6347',       // Darker blue for day
            'visibility-chart': isDay ? '#008b8b' : '#87ceeb', // Darker sky blue for day
            'pressure-chart': isDay ? '#9370db' : '#dda0dd',   // Darker purple for day
        };
        return colors[chartId] || (isDay ? '#333333' : '#ffffff');
    }

    initializeAnalyticsCharts() {
        // Only initialize if not already done
        if (Object.keys(this.analyticsCharts).length > 0) return;

        this.createTemperatureChart();
        this.createHumidityChart();
        this.createPressureChart();
        this.createWindChart();
        this.createUVVisibilityChart();
    }

    createTemperatureChart() {
        const ctx = document.getElementById('temperatureChart');
        if (!ctx) return;

        const unitSymbol = this.currentUnit === 'metric' ? '°C' : '°F';
        
        // Use real forecast data if available, otherwise use current weather with variations
        let temperatureData = [];
        let labels = [];
        
        if (this.weatherData?.forecast?.list) {
            // Use actual forecast data for next 8 periods (24 hours)
            const forecastData = this.weatherData.forecast.list.slice(0, 8);
            labels = forecastData.map(item => {
                const date = new Date(item.dt * 1000);
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            });
            temperatureData = forecastData.map(item => Math.round(item.main.temp));
        } else if (this.currentWeatherData) {
            // Generate realistic variations from current temperature
            const currentTemp = this.currentWeatherData.main.temp;
            labels = ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'];
            temperatureData = [
                Math.round(currentTemp - 4),
                Math.round(currentTemp - 6),
                Math.round(currentTemp - 3),
                Math.round(currentTemp),
                Math.round(currentTemp + 4),
                Math.round(currentTemp + 6),
                Math.round(currentTemp + 3),
                Math.round(currentTemp - 1)
            ];
        } else {
            // Fallback data
            labels = ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'];
            temperatureData = this.currentUnit === 'metric' ? [18, 16, 19, 22, 26, 28, 25, 21] : [64, 61, 66, 72, 79, 82, 77, 70];
        }

        // Enhanced colors for better visibility
        const borderColor = '#ff4757';
        const backgroundColor = 'rgba(255, 71, 87, 0.2)';

        this.analyticsCharts.temperature = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `Temperature (${unitSymbol})`,
                    data: temperatureData,
                    borderColor: borderColor,
                    backgroundColor: backgroundColor,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: borderColor,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        labels: { 
                            color: 'white',
                            font: { size: 14, weight: 'bold' }
                        } 
                    }
                },
                scales: {
                    x: { 
                        grid: { color: 'rgba(255, 255, 255, 0.2)' },
                        ticks: { 
                            color: 'white',
                            font: { size: 12, weight: 'bold' }
                        }
                    },
                    y: { 
                        grid: { color: 'rgba(255, 255, 255, 0.2)' },
                        ticks: { 
                            color: 'white',
                            font: { size: 12, weight: 'bold' }
                        }
                    }
                }
            }
        });
    }

    createHumidityChart() {
        const ctx = document.getElementById('humidityChart');
        if (!ctx) return;

        // Use real humidity data from current weather
        let humidityValue = 65; // Default
        if (this.currentWeatherData) {
            humidityValue = this.currentWeatherData.main.humidity;
        }

        this.analyticsCharts.humidity = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Humidity', 'Dry Air'],
                datasets: [{
                    data: [humidityValue, 100 - humidityValue],
                    backgroundColor: ['#20b2aa', 'rgba(255, 255, 255, 0.1)'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: 'white' } }
                }
            }
        });
    }

    createPressureChart() {
        const ctx = document.getElementById('pressureChart');
        if (!ctx) return;

        this.analyticsCharts.pressure = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Pressure (hPa)',
                    data: [1010, 1012, 1013, 1015, 1018, 1020, 1016],
                    backgroundColor: '#dda0dd',
                    borderColor: '#dda0dd',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        labels: { 
                            color: 'white',
                            font: { size: 14, weight: 'bold' }
                        } 
                    }
                },
                scales: {
                    x: { 
                        grid: { color: 'rgba(255, 255, 255, 0.2)' },
                        ticks: { 
                            color: 'white',
                            font: { size: 12, weight: 'bold' }
                        }
                    },
                    y: { 
                        grid: { color: 'rgba(255, 255, 255, 0.2)' },
                        ticks: { 
                            color: 'white',
                            font: { size: 12, weight: 'bold' }
                        }
                    }
                }
            }
        });
    }

    createWindChart() {
        const ctx = document.getElementById('windChart');
        if (!ctx) return;

        this.analyticsCharts.wind = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
                datasets: [{
                    label: 'Wind Speed (m/s)',
                    data: [5, 8, 3, 12, 15, 8, 6, 4],
                    borderColor: '#b0c4de',
                    backgroundColor: 'rgba(176, 196, 222, 0.2)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: 'white' } }
                },
                scales: {
                    r: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: { color: 'white' },
                        ticks: { color: 'white' }
                    }
                }
            }
        });
    }

    createUVVisibilityChart() {
        const ctx = document.getElementById('uvVisibilityChart');
        if (!ctx) return;

        this.analyticsCharts.uvVisibility = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'],
                datasets: [{
                    label: 'UV Index',
                    data: [1, 3, 6, 8, 4, 0],
                    borderColor: '#ff6347',
                    backgroundColor: 'rgba(255, 99, 71, 0.1)',
                    yAxisID: 'y'
                }, {
                    label: 'Visibility (km)',
                    data: [8, 9, 10, 9, 10, 10],
                    borderColor: '#87ceeb',
                    backgroundColor: 'rgba(135, 206, 235, 0.1)',
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: 'white' } }
                },
                scales: {
                    x: { 
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'white' }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'white' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { color: 'white' }
                    }
                }
            }
        });
    }

    initializeMap() {
        const mapContainer = document.getElementById('weatherMap');
        if (!mapContainer) {
            console.log('Map container not found');
            return;
        }

        // Remove existing map if any
        if (this.weatherMap) {
            this.weatherMap.remove();
            this.weatherMap = null;
        }

        // Wait a moment for container to be visible
        setTimeout(() => {
            try {
                // Initialize Leaflet map with default location
                const defaultLat = this.currentLocation ? this.currentLocation.lat : 40.7128;
                const defaultLon = this.currentLocation ? this.currentLocation.lon : -74.0060;
                
                this.weatherMap = L.map('weatherMap').setView([defaultLat, defaultLon], 6);

                // Add tile layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(this.weatherMap);

                // Add weather layer from OpenWeatherMap
                const weatherLayer = `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${this.API_KEY}`;
                L.tileLayer(weatherLayer, {
                    attribution: 'Weather data © OpenWeatherMap',
                    opacity: 0.6
                }).addTo(this.weatherMap);

                // Add precipitation layer
                const precipLayer = `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${this.API_KEY}`;
                L.tileLayer(precipLayer, {
                    attribution: 'Weather data © OpenWeatherMap',
                    opacity: 0.4
                }).addTo(this.weatherMap);

                // Add click listener for map interaction
                this.weatherMap.on('click', async (e) => {
                    const { lat, lng } = e.latlng;
                    console.log('Map clicked at:', lat, lng);
                    
                    // Add temporary marker
                    const tempMarker = L.marker([lat, lng]).addTo(this.weatherMap);
                    tempMarker.bindPopup('Loading weather data...').openPopup();
                    
                    try {
                        // Fetch weather for clicked location
                        await this.fetchWeatherByCoords(lat, lng);
                        
                        // Update marker popup with location name
                        if (this.currentWeatherData) {
                            tempMarker.setPopupContent(`
                                <div style="text-align: center;">
                                    <strong>${this.currentWeatherData.name}</strong><br>
                                    ${Math.round(this.currentWeatherData.main.temp)}°${this.currentUnit === 'metric' ? 'C' : 'F'}<br>
                                    ${this.currentWeatherData.weather[0].description}<br>
                                    <small style="color: #666;">Click to view dashboard</small>
                                </div>
                            `);
                            
                            // Navigate to dashboard when marker is clicked
                            tempMarker.on('click', () => {
                                this.showPage(0);
                                const navLinks = document.querySelectorAll('.nav-link');
                                navLinks.forEach(l => l.classList.remove('active'));
                                navLinks[0].classList.add('active');
                            });
                        }
                        
                        // Remove other temporary markers
                        this.weatherMap.eachLayer((layer) => {
                            if (layer instanceof L.Marker && layer !== tempMarker) {
                                // Only remove if it's a temporary marker (not favorite/current location)
                                if (!layer.options.permanent) {
                                    this.weatherMap.removeLayer(layer);
                                }
                            }
                        });
                        
                    } catch (error) {
                        console.error('Error fetching weather for map location:', error);
                        tempMarker.setPopupContent('Error loading weather data');
                        setTimeout(() => {
                            this.weatherMap.removeLayer(tempMarker);
                        }, 3000);
                    }
                });

                // Add current location marker if available
                if (this.currentLocation) {
                    const currentMarker = L.marker([this.currentLocation.lat, this.currentLocation.lon], {
                        permanent: true
                    }).addTo(this.weatherMap);
                    
                    currentMarker.bindPopup(`
                        <div style="text-align: center;">
                            <strong>Current Location</strong><br>
                            ${this.currentLocation.name}<br>
                            <small>Click to get weather details</small>
                        </div>
                    `);
                    
                    currentMarker.on('click', () => {
                        this.fetchWeatherByCoords(this.currentLocation.lat, this.currentLocation.lon);
                        this.showPage(0);
                        const navLinks = document.querySelectorAll('.nav-link');
                        navLinks.forEach(l => l.classList.remove('active'));
                        navLinks[0].classList.add('active');
                    });
                }

                // Add favorite locations as markers
                this.favorites.forEach((location, index) => {
                    if (location.coord && location.coord.lat && location.coord.lon) {
                        const favoriteMarker = L.marker([location.coord.lat, location.coord.lon], {
                            permanent: true
                        }).addTo(this.weatherMap);
                        
                        favoriteMarker.bindPopup(`
                            <div style="text-align: center;">
                                <strong>${location.name}</strong><br>
                                ${location.country ? location.country + '<br>' : ''}
                                <small>Favorite Location</small>
                            </div>
                        `);
                        
                        favoriteMarker.on('click', () => {
                            this.navigateToLocationWeather(location);
                        });
                    }
                });

                console.log('Interactive map initialized successfully');
            } catch (error) {
                console.error('Map initialization error:', error);
            }
        }, 100);
    }

    initializeQuickMap() {
        const quickMapContainer = document.getElementById('quickMap');
        if (!quickMapContainer) {
            console.log('Quick map container not found');
            return;
        }

        // Check if container is visible
        const isVisible = quickMapContainer.offsetParent !== null;
        console.log('Quick map container visible:', isVisible);

        setTimeout(() => {
            try {
                // Remove existing map if any
                if (this.quickMap) {
                    this.quickMap.remove();
                    this.quickMap = null;
                }

                // Initialize small map widget
                const defaultLat = this.currentLocation ? this.currentLocation.lat : 40.7128;
                const defaultLon = this.currentLocation ? this.currentLocation.lon : -74.0060;
                
                console.log('Initializing quick map at:', defaultLat, defaultLon);
                
                this.quickMap = L.map('quickMap', {
                    zoomControl: true,
                    scrollWheelZoom: true,
                    doubleClickZoom: true,
                    touchZoom: true
                }).setView([defaultLat, defaultLon], 4);

                // Add tile layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap',
                    maxZoom: 18
                }).addTo(this.quickMap);

                // Add weather layer
                const weatherLayer = `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${this.API_KEY}`;
                L.tileLayer(weatherLayer, {
                    attribution: 'Weather data © OpenWeatherMap',
                    opacity: 0.5,
                    maxZoom: 18
                }).addTo(this.quickMap);

                // Force map to invalidate size after a short delay
                setTimeout(() => {
                    if (this.quickMap) {
                        this.quickMap.invalidateSize();
                        console.log('Quick map size invalidated');
                    }
                }, 100);

                // Add click listener for quick location selection
                this.quickMap.on('click', async (e) => {
                    const { lat, lng } = e.latlng;
                    
                    // Show loading popup
                    const tempMarker = L.marker([lat, lng]).addTo(this.quickMap);
                    tempMarker.bindPopup('🌦️ Loading weather...').openPopup();
                    
                    try {
                        // Fetch weather for clicked location
                        await this.fetchWeatherByCoords(lat, lng);
                        
                        // Update popup with weather info
                        if (this.currentWeatherData) {
                            tempMarker.setPopupContent(`
                                <div style="text-align: center; min-width: 150px;">
                                    <strong>${this.currentWeatherData.name}</strong><br>
                                    <div style="font-size: 1.2rem; margin: 5px 0;">
                                        ${Math.round(this.currentWeatherData.main.temp)}°${this.currentUnit === 'metric' ? 'C' : 'F'}
                                    </div>
                                    <div style="text-transform: capitalize; color: #ccc;">
                                        ${this.currentWeatherData.weather[0].description}
                                    </div>
                                    <div style="margin-top: 8px; font-size: 0.8rem; color: #999;">
                                        Weather loaded in dashboard
                                    </div>
                                </div>
                            `);
                            
                            // Auto-close popup after 3 seconds
                            setTimeout(() => {
                                this.quickMap.removeLayer(tempMarker);
                            }, 3000);
                        }
                        
                        // Remove other temporary markers
                        this.quickMap.eachLayer((layer) => {
                            if (layer instanceof L.Marker && layer !== tempMarker && !layer.options.permanent) {
                                this.quickMap.removeLayer(layer);
                            }
                        });
                        
                    } catch (error) {
                        console.error('Error fetching weather for quick map location:', error);
                        tempMarker.setPopupContent('❌ Error loading weather');
                        setTimeout(() => {
                            this.quickMap.removeLayer(tempMarker);
                        }, 2000);
                    }
                });

                // Add current location marker if available
                if (this.currentLocation) {
                    const currentMarker = L.marker([this.currentLocation.lat, this.currentLocation.lon], {
                        permanent: true
                    }).addTo(this.quickMap);
                    currentMarker.bindPopup(`📍 Current Location<br><strong>${this.currentLocation.name}</strong>`);
                }

                console.log('Quick map initialized successfully');
            } catch (error) {
                console.error('Quick map initialization error:', error);
            }
        }, 200);
    }

    refreshQuickMap() {
        if (!this.quickMap || !this.currentLocation) {
            console.log('Quick map or current location not available for refresh');
            return;
        }

        try {
            // Update map view to current location
            this.quickMap.setView([this.currentLocation.lat, this.currentLocation.lon], 6);

            // Remove all existing markers
            this.quickMap.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    this.quickMap.removeLayer(layer);
                }
            });

            // Add current location marker
            const currentMarker = L.marker([this.currentLocation.lat, this.currentLocation.lon], {
                permanent: true
            }).addTo(this.quickMap);
            
            currentMarker.bindPopup(`
                <div style="text-align: center; min-width: 120px;">
                    📍 <strong>Current Location</strong><br>
                    ${this.currentLocation.name}<br>
                    <small style="color: #ccc;">Click anywhere on map for weather</small>
                </div>
            `);

            console.log('Quick map refreshed for location:', this.currentLocation.name);
        } catch (error) {
            console.error('Error refreshing quick map:', error);
            // Try to reinitialize if refresh fails
            setTimeout(() => {
                this.initializeQuickMap();
            }, 500);
        }
    }

    async getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser');
            return;
        }

        this.showLoading();

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await this.fetchWeatherByCoords(latitude, longitude);
            },
            (error) => {
                this.hideLoading();
                let message = 'Unable to retrieve your location';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Location access denied by user';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        message = 'Location request timed out';
                        break;
                }
                
                this.showError(message);
                // Load default city as fallback
                this.fetchWeatherByCity('London');
            }
        );
    }

    async searchCity() {
        const cityInput = document.getElementById('city-search');
        if (!cityInput) return;

        const city = cityInput.value.trim();
        if (!city) {
            this.showError('Please enter a city name');
            return;
        }

        await this.fetchWeatherByCity(city);
        cityInput.value = '';
    }

    async fetchWeatherByCity(city) {
        try {
            this.showLoading();
            
            // First get coordinates for the city
            const geoResponse = await axios.get(`https://api.openweathermap.org/geo/1.0/direct`, {
                params: {
                    q: city,
                    limit: 1,
                    appid: this.API_KEY
                }
            });

            if (!geoResponse.data || geoResponse.data.length === 0) {
                throw new Error('City not found');
            }

            const { lat, lon, name, country } = geoResponse.data[0];
            await this.fetchWeatherByCoords(lat, lon, `${name}, ${country}`);
            
        } catch (error) {
            this.hideLoading();
            this.showError('City not found. Please check the spelling and try again.');
            console.error('Search error:', error);
        }
    }

    async fetchWeatherByCoords(lat, lon, cityName = null) {
        try {
            this.showLoading();

            // Load current weather and forecast in parallel
            const [currentResponse, forecastResponse, airQualityResponse] = await Promise.all([
                axios.get(`${this.BASE_URL}/weather`, {
                    params: {
                        lat: lat,
                        lon: lon,
                        appid: this.API_KEY,
                        units: this.currentUnit
                    }
                }),
                axios.get(`${this.BASE_URL}/forecast`, {
                    params: {
                        lat: lat,
                        lon: lon,
                        appid: this.API_KEY,
                        units: this.currentUnit
                    }
                }),
                axios.get(`${this.BASE_URL}/air_pollution`, {
                    params: {
                        lat: lat,
                        lon: lon,
                        appid: this.API_KEY
                    }
                }).catch(() => null) // Air quality is optional
            ]);

            const currentWeather = currentResponse.data;
            const forecastData = forecastResponse.data;

            // Store current location for map
            this.currentLocation = { 
                lat, 
                lon, 
                name: currentWeather.name, 
                country: currentWeather.sys.country,
                coord: { lat, lon }
            };
            this.weatherData = {
                current: currentWeather,
                forecast: forecastData
            };

            console.log('Forecast data loaded:', forecastData.list.length, 'items');

            // Update UI
            this.displayCurrentWeather(currentWeather);
            this.displayWeatherDetails(currentWeather);
            this.displayForecast(forecastData);
            this.updateMiniCharts(currentWeather);
            
            if (airQualityResponse) {
                this.displayAirQuality(airQualityResponse.data);
            }

            // Save to recent cities
            this.addToRecentCities(cityName || currentWeather.name);
            
            // Refresh quick map with new location
            this.refreshQuickMap();
            
            this.hideLoading();
            
        } catch (error) {
            this.hideLoading();
            this.showError('Unable to load weather data. Please try again.');
            console.error('Weather loading error:', error);
        }
    }

    displayCurrentWeather(data) {
        // Store current weather data for timezone access
        this.currentWeatherData = data;
        
        const unitSymbol = this.currentUnit === 'metric' ? '°C' : '°F';
        
        // Update city and country
        this.updateElement('current-location', `${data.name}, ${data.sys.country}`);
        
        // Update local time
        this.updateLocalTime(data.timezone);
        
        // Start local time interval
        this.startLocalTimeUpdate(data.timezone);
        
        // Update temperature
        this.updateElement('current-temp', `${Math.round(data.main.temp)}${unitSymbol}`);
        
        // Update description
        this.updateElement('weather-description', data.weather[0].description);
        
        // Update feels like
        this.updateElement('feels-like', `${Math.round(data.main.feels_like)}${unitSymbol}`);
        
        // Update weather animation and background
        this.updateWeatherVisuals(data.weather[0]);
        
        // Update time-based background with location timezone
        this.updateTimeBackground(data.timezone);
        
        // Apply theme based on location's time (if auto theme is enabled)
        if (this.settings.theme === 'auto') {
            this.applyTheme();
        }
        
        // Check favorite status
        this.checkFavoriteStatus();
    }

    updateWeatherVisuals(weather) {
        const weatherAnimation = document.getElementById('weather-animation');
        const weatherIcon = document.getElementById('current-weather-icon');
        
        // Lottie animation URLs based on weather condition
        const lottieAnimations = {
            'clear sky': 'https://assets5.lottiefiles.com/packages/lf20_V9t630.json',
            'few clouds': 'https://assets5.lottiefiles.com/packages/lf20_UDux8f.json',
            'scattered clouds': 'https://assets5.lottiefiles.com/packages/lf20_UDux8f.json',
            'broken clouds': 'https://assets5.lottiefiles.com/packages/lf20_UDux8f.json',
            'overcast clouds': 'https://assets5.lottiefiles.com/packages/lf20_UDux8f.json',
            'shower rain': 'https://assets5.lottiefiles.com/packages/lf20_pKiwd6.json',
            'rain': 'https://assets5.lottiefiles.com/packages/lf20_pKiwd6.json',
            'light rain': 'https://assets5.lottiefiles.com/packages/lf20_pKiwd6.json',
            'thunderstorm': 'https://assets5.lottiefiles.com/packages/lf20_ydo1amjm.json',
            'snow': 'https://assets5.lottiefiles.com/packages/lf20_fy7AuB.json',
            'mist': 'https://assets5.lottiefiles.com/packages/lf20_UDux8f.json',
            'fog': 'https://assets5.lottiefiles.com/packages/lf20_UDux8f.json'
        };

        const condition = weather.description.toLowerCase();
        const animationUrl = lottieAnimations[condition] || lottieAnimations['clear sky'];

        if (weatherAnimation) {
            console.log('Loading weather animation for:', condition, 'URL:', animationUrl);
            
            // Clear any existing content and set attributes
            weatherAnimation.src = animationUrl;
            weatherAnimation.setAttribute('background', 'transparent');
            weatherAnimation.setAttribute('speed', '1');
            weatherAnimation.setAttribute('loop', 'true');
            weatherAnimation.setAttribute('autoplay', 'true');
            weatherAnimation.style.display = 'block';
            weatherAnimation.style.width = '150px';
            weatherAnimation.style.height = '150px';
            
            if (weatherIcon) weatherIcon.style.display = 'none';
            
            // Add event listeners for better error handling
            weatherAnimation.addEventListener('ready', () => {
                console.log('Weather animation loaded successfully');
                weatherAnimation.setAttribute('loaded', 'true');
                if (weatherIcon) weatherIcon.style.display = 'none';
            });
            
            weatherAnimation.addEventListener('error', () => {
                console.log('Animation failed to load, using fallback icon');
                this.showFallbackIcon(weather, weatherIcon, weatherAnimation);
            });
            
            // Fallback timeout
            setTimeout(() => {
                if (!weatherAnimation.hasAttribute('loaded')) {
                    console.log('Animation timeout, using fallback icon');
                    this.showFallbackIcon(weather, weatherIcon, weatherAnimation);
                }
            }, 5000);
        }
    }

    showFallbackIcon(weather, weatherIcon, weatherAnimation) {
        if (weatherIcon) {
            weatherIcon.src = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;
            weatherIcon.style.display = 'block';
            weatherIcon.style.filter = 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))';
        }
        if (weatherAnimation) weatherAnimation.style.display = 'none';
    }

    updateTimeBackground(timezone = null) {
    const backgroundElement = document.getElementById('weather-background');
    if (!backgroundElement) return;

    // Calculate local time for the searched location
    let hour;
    if (timezone) {
        const localTime = new Date(Date.now() + (timezone * 1000));
        hour = localTime.getUTCHours();
    } else {
        hour = new Date().getHours();
    }

    // Gradient backgrounds
    const dayGradient = 'linear-gradient(135deg, rgba(173, 216, 230, 0.95) 0%, rgba(135, 206, 250, 0.95) 30%, rgba(100, 149, 237, 0.95) 65%, rgba(80, 176, 254, 0.95) 100%)';

    const nightGradient = 'linear-gradient(135deg, rgba(35, 0, 70, 0.9) 0%, rgba(45, 0, 90, 0.9) 30%, rgba(40, 0, 110, 0.9) 60%, rgba(20, 0, 40, 0.9) 100%)';

    if (hour >= 6 && hour < 20) {
        // Daytime gradient background
        backgroundElement.style.backgroundImage = dayGradient;
        document.body.setAttribute('data-time', 'day');
    } else {
        // Nighttime gradient background
        backgroundElement.style.backgroundImage = nightGradient;
        document.body.setAttribute('data-time', 'night');
    }

    // Common background styling
    backgroundElement.style.backgroundSize = 'cover';
    backgroundElement.style.backgroundPosition = 'center';
    backgroundElement.style.backgroundRepeat = 'no-repeat';
    backgroundElement.style.backgroundAttachment = 'fixed';
}



    updateLocalTime(timezone) {
        const timeElement = document.getElementById('local-time');
        if (!timeElement) return;

        try {
            const now = new Date();
            const localTime = new Date(now.getTime() + (timezone * 1000));
            
            const hours = localTime.getUTCHours();
            const minutes = localTime.getUTCMinutes();
            const seconds = localTime.getUTCSeconds();
            
            // Format time in 12-hour format
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            const formattedTime = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${period}`;
            
            timeElement.textContent = formattedTime;
        } catch (error) {
            console.error('Error updating local time:', error);
            timeElement.textContent = '--:-- --';
        }
    }

    startLocalTimeUpdate(timezone) {
        // Clear existing interval if any
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
        
        // Update time every second
        this.timeInterval = setInterval(() => {
            this.updateLocalTime(timezone);
        }, 1000);
    }

    displayWeatherDetails(data) {
        this.updateElement('humidity', `${data.main.humidity}%`);
        
        // Convert wind speed based on unit
        const windSpeed = this.currentUnit === 'metric' ? 
            `${data.wind.speed} m/s` : 
            `${(data.wind.speed * 2.237).toFixed(1)} mph`;
        this.updateElement('wind-speed', windSpeed);
        
        // Convert pressure based on unit  
        const pressure = this.currentUnit === 'metric' ? 
            `${data.main.pressure} hPa` : 
            `${(data.main.pressure * 0.02953).toFixed(2)} inHg`;
        this.updateElement('pressure', pressure);
        
        // Convert visibility based on unit
        const visibility = this.currentUnit === 'metric' ? 
            `${(data.visibility / 1000).toFixed(1)} km` : 
            `${((data.visibility / 1000) * 0.621371).toFixed(1)} mi`;
        this.updateElement('visibility', visibility);
        
        // UV Index (placeholder - not available in current weather API)
        this.updateElement('uv-index', '5 (Moderate)');
    }

    displayForecast(data) {
        this.displayDailyForecast(data);
        this.displayHourlyForecast(data);
    }

    displayDailyForecast(data) {
        console.log('displayDailyForecast called with data:', data);
        const dailyContainer = document.getElementById('daily-forecast');
        if (!dailyContainer) {
            console.log('Daily container not found');
            return;
        }

        // Group forecast data by day
        const dailyData = this.groupForecastByDay(data ? data.list : []);
        console.log('Grouped daily data:', dailyData.length, 'days');
        
        if (dailyData.length === 0) {
            dailyContainer.innerHTML = '<div style="color: white; text-align: center; grid-column: 1/-1;">No forecast data available</div>';
            return;
        }
        
        // Apply pagination based on forecast offset
        const startIndex = this.forecastOffset;
        const endIndex = startIndex + 5;
        const displayData = dailyData.slice(startIndex, endIndex);
        console.log('Displaying daily data from', startIndex, 'to', endIndex, ':', displayData.length, 'items');
        
        dailyContainer.innerHTML = displayData.map(day => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const unitSymbol = this.currentUnit === 'metric' ? '°C' : '°F';
            
            return `
                <div class="forecast-card">
                    <div class="forecast-day">${dayName}</div>
                    <div style="font-size: 0.8rem; color: rgba(255,255,255,0.8);">${monthDay}</div>
                    <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" 
                         alt="${day.weather[0].description}" class="forecast-icon">
                    <div class="forecast-temps">
                        <span class="forecast-high">${Math.round(day.main.temp_max)}${unitSymbol}</span>
                        <span class="forecast-low">${Math.round(day.main.temp_min)}${unitSymbol}</span>
                    </div>
                    <div style="font-size: 0.8rem; color: rgba(255,255,255,0.7);">${day.weather[0].main}</div>
                </div>
            `;
        }).join('');
    }

    displayHourlyForecast(data) {
        console.log('displayHourlyForecast called with data:', data);
        const hourlyContainer = document.getElementById('hourly-forecast');
        if (!hourlyContainer) {
            console.log('Hourly container not found');
            return;
        }

        // Get hourly data with offset for navigation
        const hourlyData = data ? data.list : [];
        console.log('Hourly data length:', hourlyData.length);
        
        if (hourlyData.length === 0) {
            hourlyContainer.innerHTML = '<div style="color: white; text-align: center; grid-column: 1/-1;">No hourly data available</div>';
            return;
        }
        
        const startIndex = this.forecastOffset;
        const endIndex = startIndex + 6;
        const displayData = hourlyData.slice(startIndex, endIndex);
        console.log('Displaying hourly data from', startIndex, 'to', endIndex, ':', displayData.length, 'items');
        
        hourlyContainer.innerHTML = displayData.map(item => {
            const date = new Date(item.dt * 1000);
            const time = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const unitSymbol = this.currentUnit === 'metric' ? '°C' : '°F';
            
            return `
                <div class="forecast-card">
                    <div class="forecast-day">${dayName}</div>
                    <div style="font-size: 0.8rem; color: rgba(255,255,255,0.8);">${time}</div>
                    <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" 
                         alt="${item.weather[0].description}" class="forecast-icon">
                    <div class="forecast-temps">
                        <span class="forecast-high">${Math.round(item.main.temp)}${unitSymbol}</span>
                    </div>
                    <div style="font-size: 0.8rem; color: rgba(255,255,255,0.7);">${item.weather[0].main}</div>
                </div>
            `;
        }).join('');
    }

    displayAirQuality(data) {
        if (!data || !data.list || data.list.length === 0) return;

        const aqi = data.list[0];
        const components = aqi.components;

        this.updateElement('pm25', `${components.pm2_5?.toFixed(1) || '--'} μg/m³`);
        this.updateElement('pm10', `${components.pm10?.toFixed(1) || '--'} μg/m³`);
        this.updateElement('o3', `${components.o3?.toFixed(1) || '--'} μg/m³`);

        // Update AQI
        const aqiValue = aqi.main.aqi;
        const aqiElement = document.querySelector('.aqi-value');
        const aqiStatusElement = document.querySelector('.aqi-status');

        if (aqiElement) {
            aqiElement.textContent = aqiValue;
        }

        if (aqiStatusElement) {
            const aqiStatus = this.getAQIStatus(aqiValue);
            aqiStatusElement.textContent = aqiStatus.text;
            aqiStatusElement.style.color = aqiStatus.color;
        }
    }

    getAQIStatus(aqi) {
        const statuses = {
            1: { text: 'Good', color: '#00e400' },
            2: { text: 'Fair', color: '#ffff00' },
            3: { text: 'Moderate', color: '#ff7e00' },
            4: { text: 'Poor', color: '#d80a0aff' },
            5: { text: 'Very Poor', color: '#ea00ffff' }
        };
        
        return statuses[aqi] || { text: 'Unknown', color: '#666' };
    }

    groupForecastByDay(forecastList) {
        const grouped = {};
        
        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000).toDateString();
            
            if (!grouped[date]) {
                grouped[date] = {
                    dt: item.dt,
                    weather: item.weather,
                    main: {
                        temp_max: item.main.temp_max,
                        temp_min: item.main.temp_min
                    }
                };
            } else {
                grouped[date].main.temp_max = Math.max(grouped[date].main.temp_max, item.main.temp_max);
                grouped[date].main.temp_min = Math.min(grouped[date].main.temp_min, item.main.temp_min);
            }
        });
        
        return Object.values(grouped);
    }

    addToRecentCities(city) {
        if (!city) return;

        // Remove if already exists
        this.recentCities = this.recentCities.filter(c => c.toLowerCase() !== city.toLowerCase());
        
        // Add to beginning
        this.recentCities.unshift(city);
        
        // Keep only last 5 cities
        this.recentCities = this.recentCities.slice(0, 5);
        
        // Save to localStorage
        localStorage.setItem('recentCities', JSON.stringify(this.recentCities));
        
        // Update display
        this.displayRecentCities();
    }

    displayRecentCities() {
        const container = document.getElementById('recent-cities-list');
        if (!container) return;

        if (this.recentCities.length === 0) {
            container.innerHTML = '<p style="color: white; text-align: center;">No recent searches</p>';
            return;
        }

        container.innerHTML = this.recentCities.map(city => `
            <div class="recent-city-item" onclick="weatherDashboard.fetchWeatherByCity('${city}')">
                <span>${city}</span>
            </div>
        `).join('');
    }

    showDailyForecast() {
        const dailyForecast = document.getElementById('daily-forecast');
        const hourlyForecast = document.getElementById('hourly-forecast');
        const dailyBtn = document.getElementById('daily-btn');
        const hourlyBtn = document.getElementById('hourly-btn');

        if (dailyForecast) dailyForecast.classList.remove('hidden');
        if (hourlyForecast) hourlyForecast.classList.add('hidden');
        if (dailyBtn) dailyBtn.classList.add('active');
        if (hourlyBtn) hourlyBtn.classList.remove('active');
    }

    showHourlyForecast() {
        const dailyForecast = document.getElementById('daily-forecast');
        const hourlyForecast = document.getElementById('hourly-forecast');
        const dailyBtn = document.getElementById('daily-btn');
        const hourlyBtn = document.getElementById('hourly-btn');

        if (hourlyForecast) hourlyForecast.classList.remove('hidden');
        if (dailyForecast) dailyForecast.classList.add('hidden');
        if (hourlyBtn) hourlyBtn.classList.add('active');
        if (dailyBtn) dailyBtn.classList.remove('active');
    }

    loadFavorites() {
        // This is for the dashboard sidebar favorites (if any)
        const favoritesGrid = document.getElementById('favoritesGrid');
        if (favoritesGrid) {
            favoritesGrid.innerHTML = '';
            
            this.favorites.forEach((favorite, index) => {
                const card = document.createElement('div');
                card.className = 'favorite-card';
                card.onclick = () => this.navigateToLocationWeather(favorite);
                card.innerHTML = `
                    <button class="favorite-remove" onclick="weatherDashboard.removeFavorite(${index}, event)">
                        <i class="fas fa-times"></i>
                    </button>
                    <h3>${favorite.name}</h3>
                    <div class="forecast-temps">
                        <span class="forecast-high">${favorite.temp || '--°C'}</span>
                    </div>
                    <div class="forecast-day">${favorite.condition || 'Sunny'}</div>
                `;
                
                favoritesGrid.appendChild(card);
            });
        }
        
        // Update locations page if it exists
        this.loadLocationsPage();
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    showLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    showError(message) {
        const errorSection = document.getElementById('error-section');
        const errorMessage = document.getElementById('error-message');
        
        if (errorSection && errorMessage) {
            errorMessage.textContent = message;
            errorSection.style.display = 'flex';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorSection.style.display = 'none';
            }, 5000);
        }
    }

    removeFavorite(index, event) {
        if (event) event.stopPropagation();
        this.favorites.splice(index, 1);
        localStorage.setItem('weatherFavorites', JSON.stringify(this.favorites));
        this.loadFavorites();
    }
    
    updateMiniCharts(weatherData) {
        // Update charts with real weather data
        if (this.miniCharts['humidity-chart']) {
            const humidity = weatherData.main.humidity;
            this.miniCharts['humidity-chart'].data.datasets[0].data = [
                Math.max(0, humidity - 8),
                Math.max(0, humidity - 4),
                Math.max(0, humidity - 1),
                humidity
            ];
            // Update color based on current time
            this.miniCharts['humidity-chart'].data.datasets[0].borderColor = this.getChartColor('humidity-chart');
            this.miniCharts['humidity-chart'].data.datasets[0].backgroundColor = this.getChartColor('humidity-chart') + '20';
            this.miniCharts['humidity-chart'].update();
        }

        if (this.miniCharts['pressure-chart']) {
            const pressure = weatherData.main.pressure;
            this.miniCharts['pressure-chart'].data.datasets[0].data = [
                pressure - 4,
                pressure - 2,
                pressure + 1,
                pressure
            ];
            // Update color based on current time
            this.miniCharts['pressure-chart'].data.datasets[0].borderColor = this.getChartColor('pressure-chart');
            this.miniCharts['pressure-chart'].data.datasets[0].backgroundColor = this.getChartColor('pressure-chart') + '20';
            this.miniCharts['pressure-chart'].update();
        }

        if (this.miniCharts['wind-chart']) {
            const windSpeed = weatherData.wind?.speed || 0;
            this.miniCharts['wind-chart'].data.datasets[0].data = [
                Math.max(0, windSpeed - 3),
                Math.max(0, windSpeed - 1),
                windSpeed + 2,
                windSpeed
            ];
            // Update color based on current time
            this.miniCharts['wind-chart'].data.datasets[0].borderColor = this.getChartColor('wind-chart');
            this.miniCharts['wind-chart'].data.datasets[0].backgroundColor = this.getChartColor('wind-chart') + '20';
            this.miniCharts['wind-chart'].update();
        }

        if (this.miniCharts['visibility-chart']) {
            const visibility = (weatherData.visibility || 10000) / 1000; // Convert to km
            this.miniCharts['visibility-chart'].data.datasets[0].data = [
                Math.max(0, visibility - 2),
                Math.max(0, visibility - 1),
                visibility + 1,
                visibility
            ];
            // Update color based on current time
            this.miniCharts['visibility-chart'].data.datasets[0].borderColor = this.getChartColor('visibility-chart');
            this.miniCharts['visibility-chart'].data.datasets[0].backgroundColor = this.getChartColor('visibility-chart') + '20';
            this.miniCharts['visibility-chart'].update();
        }

        if (this.miniCharts['uv-chart']) {
            // Generate realistic UV data based on time and weather
            const hour = new Date().getHours();
            let uvIndex = 0;
            if (hour >= 6 && hour <= 18) {
                uvIndex = Math.max(1, Math.min(11, Math.round((hour - 6) / 2) + Math.random() * 2));
            }
            this.miniCharts['uv-chart'].data.datasets[0].data = [
                Math.max(0, uvIndex - 2),
                Math.max(0, uvIndex - 1),
                uvIndex + 1,
                uvIndex
            ];
            // Update color based on current time
            this.miniCharts['uv-chart'].data.datasets[0].borderColor = this.getChartColor('uv-chart');
            this.miniCharts['uv-chart'].data.datasets[0].backgroundColor = this.getChartColor('uv-chart') + '20';
            this.miniCharts['uv-chart'].update();
        }
    }

    toggleCurrentFavorite() {
        if (!this.weatherData.current) return;

        const cityName = this.weatherData.current.name;
        const favoriteBtn = document.getElementById('favorite-btn');
        const favoriteIcon = document.getElementById('favorite-icon');

        // Check if already in favorites
        const existingIndex = this.favorites.findIndex(fav => fav.name.toLowerCase() === cityName.toLowerCase());

        if (existingIndex > -1) {
            // Remove from favorites
            this.favorites.splice(existingIndex, 1);
            favoriteBtn.classList.remove('active');
            favoriteIcon.className = 'far fa-heart';
        } else {
            // Add to favorites
            const unitSymbol = this.currentUnit === 'metric' ? '°C' : '°F';
            this.favorites.push({
                name: cityName,
                temp: `${Math.round(this.weatherData.current.main.temp)}${unitSymbol}`,
                condition: this.weatherData.current.weather[0].main
            });
            favoriteBtn.classList.add('active');
            favoriteIcon.className = 'fas fa-heart';
        }

        localStorage.setItem('weatherFavorites', JSON.stringify(this.favorites));
        this.loadFavorites();
    }

    checkFavoriteStatus() {
        if (!this.weatherData.current) return;

        const cityName = this.weatherData.current.name;
        const favoriteBtn = document.getElementById('favorite-btn');
        const favoriteIcon = document.getElementById('favorite-icon');

        const isFavorite = this.favorites.some(fav => fav.name.toLowerCase() === cityName.toLowerCase());

        if (isFavorite) {
            favoriteBtn.classList.add('active');
            favoriteIcon.className = 'fas fa-heart';
        } else {
            favoriteBtn.classList.remove('active');
            favoriteIcon.className = 'far fa-heart';
        }
    }

    toggleFavorite() {
        if (!this.currentLocation) return;

        const locationKey = `${this.currentLocation.name},${this.currentLocation.country}`;
        const existingIndex = this.favorites.findIndex(fav => 
            `${fav.name},${fav.country}` === locationKey
        );

        if (existingIndex !== -1) {
            // Remove from favorites
            this.favorites.splice(existingIndex, 1);
        } else {
            // Add to favorites with proper temperature unit
            const unitSymbol = this.currentUnit === 'metric' ? '°C' : '°F';
            this.favorites.push({
                name: this.currentLocation.name,
                country: this.currentLocation.country,
                coord: this.currentLocation.coord,
                temp: this.weatherData.current?.main?.temp ? 
                    `${Math.round(this.weatherData.current.main.temp)}${unitSymbol}` : '--°C',
                condition: this.weatherData.current?.weather?.[0]?.main
            });
        }

        localStorage.setItem('weatherFavorites', JSON.stringify(this.favorites));
        this.updateFavoriteButton();
        this.loadLocationsPage();
    }

    removeFavorite(index, event) {
        if (event) event.stopPropagation();
        this.favorites.splice(index, 1);
        localStorage.setItem('weatherFavorites', JSON.stringify(this.favorites));
        this.loadFavorites();
        this.loadLocationsPage();
        this.updateFavoriteButton();
    }

    loadLocationsPage() {
        const favoritesContainer = document.getElementById('favorites-locations');

        if (favoritesContainer) {
            if (this.favorites.length === 0) {
                favoritesContainer.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.6); padding: 2rem;">
                        <i class="fas fa-map-marker-alt" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <h3>No favorite locations yet</h3>
                        <p>Add your first favorite location by clicking the + button above</p>
                    </div>
                `;
                return;
            }
            
            favoritesContainer.innerHTML = '';
            this.favorites.forEach((location, index) => {
                const card = this.createLocationCard(location, 'favorite', index);
                favoritesContainer.appendChild(card);
            });
        }
    }

    createLocationCard(location, type, index) {
        const card = document.createElement('div');
        card.className = 'location-card';
        card.onclick = () => this.navigateToLocationWeather(location);

        card.innerHTML = `
            <div class="location-card-header">
                <div>
                    <div class="location-name">${location.name}</div>
                    <div class="location-country">${location.country}</div>
                </div>
                <div class="location-temp">${location.temp || '--°C'}</div>
            </div>
            <div class="location-condition">
                <span>${location.condition || 'Unknown'}</span>
            </div>
            ${type === 'favorite' ? `<button class="location-remove" onclick="weatherDashboard.removeFavorite(${index}, event)"><i class="fas fa-times"></i></button>` : ''}
        `;

        return card;
    }

    navigateToLocationWeather(location) {
        // Navigate to dashboard first
        this.showPage(0);
        
        // Update navigation active state
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(l => l.classList.remove('active'));
        navLinks[0].classList.add('active');
        
        // Fetch weather for this location
        if (location.coord && location.coord.lat && location.coord.lon) {
            this.fetchWeatherByCoords(location.coord.lat, location.coord.lon, location.name);
        } else {
            this.fetchWeatherByCity(location.name);
        }
    }

    showAddLocationModal() {
        const modal = document.getElementById('add-location-modal');
        const addBtn = document.getElementById('add-location');
        
        if (modal) {
            modal.classList.add('show');
            this.selectedLocation = null;
            if (addBtn) addBtn.disabled = true;
            this.populateRecentChips();
        }
    }

    hideAddLocationModal() {
        const modal = document.getElementById('add-location-modal');
        if (modal) {
            modal.classList.remove('show');
        }
        document.getElementById('location-search').value = '';
        document.getElementById('location-search-results').innerHTML = '';
        this.selectedLocation = null;
        const addBtn = document.getElementById('add-location');
        if (addBtn) addBtn.disabled = true;
    }

    populateRecentChips() {
        const chipsContainer = document.getElementById('recent-chips');
        if (!chipsContainer || this.recentCities.length === 0) {
            if (chipsContainer) {
                chipsContainer.innerHTML = '<span style="color: rgba(255,255,255,0.6); font-size: 0.8rem;">No recent searches</span>';
            }
            return;
        }

        chipsContainer.innerHTML = this.recentCities.map(city => `
            <div class="chip" onclick="weatherDashboard.selectRecentCity('${city}')">
                <i class="fas fa-clock" style="font-size: 0.7rem;"></i>
                ${city}
            </div>
        `).join('');
    }

    selectRecentCity(city) {
        const searchInput = document.getElementById('location-search');
        const addBtn = document.getElementById('add-location');
        
        if (searchInput) {
            searchInput.value = city;
        }
        
        // Set this as selected location
        this.selectedLocation = { name: city, fromRecent: true };
        
        if (addBtn) {
            addBtn.disabled = false;
        }
        
        // Clear search results and highlight selected chip
        document.getElementById('location-search-results').innerHTML = '';
        document.querySelectorAll('.chip').forEach(chip => chip.classList.remove('selected'));
        event.target.classList.add('selected');
    }

    addSelectedLocation() {
        if (!this.selectedLocation) return;
        
        if (this.selectedLocation.fromRecent) {
            // Add from recent search
            this.addLocationToFavorites(this.selectedLocation.name);
        } else {
            // Add from search results
            this.addLocationToFavorites(this.selectedLocation.name, this.selectedLocation);
        }
        
        this.hideAddLocationModal();
    }

    addLocationToFavorites(cityName, locationData = null) {
        // Check if already in favorites
        const existingFavorite = this.favorites.find(fav => 
            fav.name.toLowerCase() === cityName.toLowerCase()
        );
        
        if (existingFavorite) {
            alert('This location is already in your favorites!');
            return;
        }
        
        if (locationData) {
            // Add with coordinates for future API calls
            this.favorites.push({
                name: locationData.name,
                country: locationData.country || '',
                coord: { lat: locationData.lat, lon: locationData.lon },
                temp: '--°C',
                condition: 'Unknown'
            });
        } else {
            // Add with just name (will need to fetch coordinates later)
            this.favorites.push({
                name: cityName,
                country: '',
                coord: null,
                temp: '--°C',
                condition: 'Unknown'
            });
        }
        
        localStorage.setItem('weatherFavorites', JSON.stringify(this.favorites));
        this.loadLocationsPage();
    }

    async searchLocations(query) {
        if (query.length < 3) {
            document.getElementById('location-search-results').innerHTML = '';
            this.selectedLocation = null;
            const addBtn = document.getElementById('add-location');
            if (addBtn) addBtn.disabled = true;
            return;
        }

        try {
            const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${this.API_KEY}`);
            const locations = await response.json();

            const resultsContainer = document.getElementById('location-search-results');
            resultsContainer.innerHTML = '';

            if (locations.length === 0) {
                resultsContainer.innerHTML = '<div style="color: rgba(255,255,255,0.6); text-align: center; padding: 1rem;">No locations found</div>';
                return;
            }

            locations.forEach(location => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `${location.name}, ${location.country}`;
                item.onclick = () => this.selectSearchLocation(location);
                resultsContainer.appendChild(item);
            });
        } catch (error) {
            console.error('Error searching locations:', error);
        }
    }

    selectSearchLocation(location) {
        const searchInput = document.getElementById('location-search');
        const addBtn = document.getElementById('add-location');
        
        if (searchInput) {
            searchInput.value = `${location.name}, ${location.country}`;
        }
        
        // Set this as selected location
        this.selectedLocation = {
            name: location.name,
            country: location.country,
            lat: location.lat,
            lon: location.lon,
            fromRecent: false
        };
        
        if (addBtn) {
            addBtn.disabled = false;
        }
        
        // Clear selection from chips
        document.querySelectorAll('.chip').forEach(chip => chip.classList.remove('selected'));
    }

    updateForecastDisplay() {
        console.log('updateForecastDisplay called, type:', this.forecastType, 'offset:', this.forecastOffset);
        if (!this.weatherData.forecast) {
            console.log('No forecast data available');
            return;
        }
        
        console.log('Forecast data has', this.weatherData.forecast.list.length, 'items');
        
        if (this.forecastType === 'daily') {
            this.displayDailyForecast(this.weatherData.forecast);
        } else {
            this.displayHourlyForecast(this.weatherData.forecast);
        }
    }

    loadSettingsPage() {
        // Load current settings into the UI
        const tempUnitSelector = this.settings.temperatureUnit === 'celsius' ? 'metric' : 'imperial';
        const tempUnit = document.querySelector(`input[name="tempUnit"][value="${tempUnitSelector}"]`);
        if (tempUnit) tempUnit.checked = true;

        const theme = document.querySelector(`input[name="theme"][value="${this.settings.theme}"]`);
        if (theme) theme.checked = true;

        const autoLocation = document.getElementById('autoLocation');
        if (autoLocation) autoLocation.checked = this.settings.autoLocation;

        // Setup event listeners for settings
        this.setupSettingsEventListeners();
    }

    setupSettingsEventListeners() {
        // Temperature unit change - Fix the selector to match HTML
        const tempRadios = document.querySelectorAll('input[name="tempUnit"]');
        tempRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.settings.temperatureUnit = e.target.value === 'metric' ? 'celsius' : 'fahrenheit';
                this.saveSettings();
                this.updateTemperatureUnit();
            });
        });

        // Theme change
        const themeRadios = document.querySelectorAll('input[name="theme"]');
        themeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.settings.theme = e.target.value;
                this.saveSettings();
                this.applyTheme();
            });
        });

        // Notifications toggle
        const notificationsToggles = document.querySelectorAll('input[type="checkbox"]');
        notificationsToggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                if (e.target.id === 'autoLocation') {
                    this.settings.autoLocation = e.target.checked;
                } else {
                    this.settings.notifications = e.target.checked;
                }
                this.saveSettings();
            });
        });

        // Clear data functions
        this.setupDataManagementListeners();
    }

    saveSettings() {
        localStorage.setItem('weatherSettings', JSON.stringify(this.settings));
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('weatherSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        this.updateTemperatureUnit();
    }

    updateTemperatureUnit() {
        if (this.settings.temperatureUnit === 'fahrenheit') {
            this.currentUnit = 'imperial';
        } else {
            this.currentUnit = 'metric';
        }

        // Update favorite temperatures to match new unit
        this.updateFavoriteTemperatures();

        // Refresh charts with new units
        this.destroyAnalyticsCharts();
        
        // Refresh current weather data if available
        if (this.currentLocation) {
            this.fetchWeatherByCoords(this.currentLocation.coord.lat, this.currentLocation.coord.lon);
        }
        
        // Reinitialize charts if on analytics page
        if (this.currentPage === 'analytics') {
            setTimeout(() => {
                this.initializeAnalyticsCharts();
            }, 100);
        }
    }

    updateFavoriteTemperatures() {
        // Update stored favorites with new temperature unit display
        this.favorites.forEach(favorite => {
            if (favorite.temp && favorite.temp !== '--°C' && favorite.temp !== '--°F') {
                // Extract numeric value and convert if needed
                const tempValue = parseFloat(favorite.temp);
                if (!isNaN(tempValue)) {
                    const unitSymbol = this.currentUnit === 'metric' ? '°C' : '°F';
                    favorite.temp = `${Math.round(tempValue)}${unitSymbol}`;
                }
            }
        });
        localStorage.setItem('weatherFavorites', JSON.stringify(this.favorites));
        this.loadLocationsPage();
    }

    destroyAnalyticsCharts() {
        Object.values(this.analyticsCharts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.analyticsCharts = {};
    }

    applyTheme() {
        const body = document.body;
        
        // Remove existing theme classes
        body.classList.remove('light-theme', 'dark-theme', 'morning', 'evening', 'night', 'day');
        
        if (this.settings.theme === 'light') {
            body.classList.add('light-theme');
        } else if (this.settings.theme === 'dark') {
            body.classList.add('dark-theme');
        } else {
            // Auto theme - based on location's local time
            let hour;
            if (this.currentWeatherData?.timezone) {
                // Use location's timezone
                const localTime = new Date(Date.now() + (this.currentWeatherData.timezone * 1000));
                hour = localTime.getUTCHours();
            } else {
                // Fallback to system time
                hour = new Date().getHours();
            }
            
            if (hour >= 6 && hour < 20) {
                // Day time - elegant pink/purple/blue theme
                body.classList.add('light-theme', 'day');
            } else {
                // Night time - deep blue theme
                body.classList.add('dark-theme', 'night');
            }
        }
        
        // Update time background after theme change (use current location's timezone if available)
        const currentTimezone = this.currentWeatherData?.timezone || null;
        this.updateTimeBackground(currentTimezone);
    }

    setupDataManagementListeners() {
        // These will be called by global functions
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            localStorage.removeItem('recentCities');
            localStorage.removeItem('weatherFavorites');
            localStorage.removeItem('weatherSettings');
            
            this.recentCities = [];
            this.favorites = [];
            this.settings = {
                temperatureUnit: 'celsius',
                notifications: true,
                autoLocation: true,
                theme: 'auto'
            };

            this.loadSettingsPage();
            this.loadLocationsPage();
            this.displayRecentCities();
            this.updateFavoriteButton();
            
            // Reset to default unit
            this.currentUnit = 'metric';
        }
    }

    // Initialize the app when DOM is loaded
    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.setupForecastNavigation();
        this.setupModalHandlers();
        this.displayRecentCities();
        this.loadFavorites();
        this.loadSettings();
        this.applyTheme(); // Apply theme on init
        this.getCurrentLocation();
        this.createMiniCharts();
    }
}

// Initialize the weather dashboard when the page loads
let weatherDashboard;

document.addEventListener('DOMContentLoaded', () => {
    weatherDashboard = new WeatherDashboard();
});

// Global functions for UI features
function switchForecast(type) {
    if (type === 'daily') {
        weatherDashboard.showDailyForecast();
    } else {
        weatherDashboard.showHourlyForecast();
    }
}

function switchChart(type) {
    // Chart switching functionality can be implemented here
    console.log(`Switching to ${type} chart`);
    
    // Update active tab
    document.querySelectorAll('.chart-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
}

function addFavorite() {
    const city = prompt('Enter city name:');
    if (city && city.trim()) {
        const newFavorite = {
            name: city.trim(),
            temp: `--°C`,
            condition: 'Unknown'
        };
        
        weatherDashboard.favorites.push(newFavorite);
        localStorage.setItem('weatherFavorites', JSON.stringify(weatherDashboard.favorites));
        weatherDashboard.loadFavorites();
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle i');
    
    if (sidebar && toggleBtn) {
        sidebar.classList.toggle('collapsed');
        
        if (sidebar.classList.contains('collapsed')) {
            toggleBtn.className = 'fas fa-chevron-right';
        } else {
            toggleBtn.className = 'fas fa-chevron-left';
        }
    }
}

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    
    if (sidebar && overlay && menuToggle) {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('active');
        menuToggle.classList.toggle('active');
        
        // Prevent body scroll when sidebar is open
        if (sidebar.classList.contains('mobile-open')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

function toggleMap() {
    const mapSection = document.getElementById('mapSection');
    if (mapSection) {
        const isVisible = mapSection.style.display !== 'none';
        mapSection.style.display = isVisible ? 'none' : 'block';
        
        // Initialize map when showing for the first time
        if (!isVisible && weatherDashboard) {
            setTimeout(() => {
                weatherDashboard.initializeMap();
            }, 100);
        }
    }
}

function clearRecentSearches() {
    if (confirm('Are you sure you want to clear all recent searches?')) {
        weatherDashboard.recentCities = [];
        localStorage.removeItem('recentCities');
        weatherDashboard.displayRecentCities();
        alert('Recent searches cleared successfully!');
    }
}

function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        weatherDashboard.clearAllData();
        alert('All data cleared successfully!');
    }
}

function toggleCurrentFavorite() {
    if (weatherDashboard) {
        weatherDashboard.toggleCurrentFavorite();
    }
}

// Chatbot functionality
let chatbotVisible = false;

function toggleChatbot() {
    const chatbot = document.getElementById('chatbotContainer');
    const toggle = document.getElementById('chatbotToggle');
    
    if (chatbot && toggle) {
        chatbotVisible = !chatbotVisible;
        
        if (chatbotVisible) {
            chatbot.style.display = 'flex';
            toggle.style.display = 'none';
        } else {
            chatbot.style.display = 'none';
            toggle.style.display = 'block';
        }
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const messages = document.getElementById('chatbotMessages');

    if (input && messages && input.value.trim()) {
        const userText = input.value.trim();

        // Show user message
        const userMessage = document.createElement('div');
        userMessage.className = 'user-message';
        userMessage.innerHTML = `<div class="message-avatar"><i class="fas fa-user"></i></div>
                                 <div class="message-content">${userText}</div>`;
        messages.appendChild(userMessage);
        input.value = '';
        messages.scrollTop = messages.scrollHeight;

        // Add loading message
        const loading = document.createElement('div');
        loading.className = 'bot-message';
        loading.innerHTML = `<div class="message-avatar"><i class="fas fa-robot"></i></div>
                             <div class="message-content">Getting weather information...</div>`;
        messages.appendChild(loading);
        messages.scrollTop = messages.scrollHeight;

        try {
            // Check if the user is asking for weather information
            const weatherKeywords = ['weather', 'temperature', 'rain', 'sunny', 'cloudy', 'wind', 'humidity', 'forecast', 'current weather', 'how is the weather', 'what is the weather'];
            const isWeatherQuery = weatherKeywords.some(keyword => userText.toLowerCase().includes(keyword));
            
            // Extract city name if mentioned
            let cityName = null;
            const cityPatterns = [
                /weather in ([^?]+)/i,
                /weather for ([^?]+)/i,
                /temperature in ([^?]+)/i,
                /current weather in ([^?]+)/i,
                /how is the weather in ([^?]+)/i,
                /what is the weather in ([^?]+)/i
            ];
            
            for (const pattern of cityPatterns) {
                const match = userText.match(pattern);
                if (match) {
                    cityName = match[1].trim();
                    break;
                }
            }

            if (isWeatherQuery) {
                // If no city specified, use current location or default
                if (!cityName) {
                    const currentLocationEl = document.querySelector('.current-weather h2');
                    cityName = currentLocationEl ? currentLocationEl.textContent.trim() : 'your location';
                }

                // Get weather data
                const weatherData = await getWeatherForCity(cityName);
                
                if (weatherData) {
                    const response = `Current weather in ${weatherData.name}, ${weatherData.sys.country}:

🌡️ **Temperature**: ${Math.round(weatherData.main.temp)}°C (feels like ${Math.round(weatherData.main.feels_like)}°C)
🌤️ **Condition**: ${weatherData.weather[0].description}
💧 **Humidity**: ${weatherData.main.humidity}%
💨 **Wind Speed**: ${weatherData.wind.speed} m/s
🌪️ **Pressure**: ${weatherData.main.pressure} hPa
👁️ **Visibility**: ${weatherData.visibility ? (weatherData.visibility / 1000).toFixed(1) + ' km' : 'N/A'}

Have a great day! ☀️`;

                    loading.querySelector('.message-content').innerHTML = response.replace(/\n/g, '<br>');
                } else {
                    loading.querySelector('.message-content').textContent = `Sorry, I couldn't find weather information for "${cityName}". Please check the city name and try again.`;
                }
            } else {
                // Use Gemini AI for non-weather queries
                const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-goog-api-key': 'AIzaSyAzJe6U_IK6xwP6-bPuyxYUL_HfjcxPSt4'
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    { text: `You are a helpful weather assistant. Please respond to this query: ${userText}. If it's not weather-related, provide a helpful general response.` }
                                ]
                            }
                        ]
                    })
                });

                const data = await response.json();
                const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here to help with weather information and general questions!";
                loading.querySelector('.message-content').textContent = reply;
            }

        } catch (err) {
            console.error("Error:", err);
            loading.querySelector('.message-content').textContent = "Sorry, I'm having trouble getting information right now. Please try again later.";
        }
    }
}

// Helper function to get weather data for a city
async function getWeatherForCity(cityName) {
    const API_KEY = 'ec6da802be24d34a7400376f4a55114d';
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`);
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
}


// Handle chatbot input on Enter key
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});
