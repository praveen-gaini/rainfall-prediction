// Weather App JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const weatherForm = document.getElementById('weather-form');
    const cityInput = document.getElementById('city-input');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error-message');
    const weatherResults = document.getElementById('weather-results');

    // Weather icon mapping
    const weatherIcons = {
        'clear sky': 'fas fa-sun',
        'few clouds': 'fas fa-cloud-sun',
        'scattered clouds': 'fas fa-cloud',
        'broken clouds': 'fas fa-cloud',
        'overcast clouds': 'fas fa-cloud',
        'light rain': 'fas fa-cloud-rain',
        'moderate rain': 'fas fa-cloud-rain',
        'heavy intensity rain': 'fas fa-cloud-showers-heavy',
        'very heavy rain': 'fas fa-cloud-showers-heavy',
        'extreme rain': 'fas fa-cloud-showers-heavy',
        'freezing rain': 'fas fa-cloud-rain',
        'light intensity shower rain': 'fas fa-cloud-rain',
        'shower rain': 'fas fa-cloud-rain',
        'heavy intensity shower rain': 'fas fa-cloud-showers-heavy',
        'ragged shower rain': 'fas fa-cloud-rain',
        'thunderstorm': 'fas fa-bolt',
        'thunderstorm with light rain': 'fas fa-bolt',
        'thunderstorm with rain': 'fas fa-bolt',
        'thunderstorm with heavy rain': 'fas fa-bolt',
        'light thunderstorm': 'fas fa-bolt',
        'heavy thunderstorm': 'fas fa-bolt',
        'ragged thunderstorm': 'fas fa-bolt',
        'thunderstorm with light drizzle': 'fas fa-bolt',
        'thunderstorm with drizzle': 'fas fa-bolt',
        'thunderstorm with heavy drizzle': 'fas fa-bolt',
        'light intensity drizzle': 'fas fa-cloud-drizzle',
        'drizzle': 'fas fa-cloud-drizzle',
        'heavy intensity drizzle': 'fas fa-cloud-drizzle',
        'light intensity drizzle rain': 'fas fa-cloud-drizzle',
        'drizzle rain': 'fas fa-cloud-drizzle',
        'heavy intensity drizzle rain': 'fas fa-cloud-drizzle',
        'shower rain and drizzle': 'fas fa-cloud-drizzle',
        'heavy shower rain and drizzle': 'fas fa-cloud-drizzle',
        'shower drizzle': 'fas fa-cloud-drizzle',
        'light snow': 'fas fa-snowflake',
        'snow': 'fas fa-snowflake',
        'heavy snow': 'fas fa-snowflake',
        'sleet': 'fas fa-snowflake',
        'light shower sleet': 'fas fa-snowflake',
        'shower sleet': 'fas fa-snowflake',
        'light rain and snow': 'fas fa-snowflake',
        'rain and snow': 'fas fa-snowflake',
        'light shower snow': 'fas fa-snowflake',
        'shower snow': 'fas fa-snowflake',
        'heavy shower snow': 'fas fa-snowflake',
        'mist': 'fas fa-smog',
        'smoke': 'fas fa-smog',
        'haze': 'fas fa-smog',
        'sand/dust whirls': 'fas fa-smog',
        'fog': 'fas fa-smog',
        'sand': 'fas fa-smog',
        'dust': 'fas fa-smog',
        'volcanic ash': 'fas fa-smog',
        'squalls': 'fas fa-wind',
        'tornado': 'fas fa-tornado'
    };

    // Initialize form handler
    if (weatherForm) {
        weatherForm.addEventListener('submit', handleWeatherSubmit);
    }

    async function handleWeatherSubmit(e) {
        e.preventDefault();
        
        const city = cityInput.value.trim();
        if (!city) {
            showError('Please enter a city name');
            return;
        }

        showLoading();
        hideError();
        hideWeatherResults();

        try {
            const response = await fetch('/weather', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `city=${encodeURIComponent(city)}`
            });

            const data = await response.json();
            hideLoading();

            if (data.error) {
                showError(data.error);
                return;
            }

            displayWeatherResults(data);
        } catch (error) {
            hideLoading();
            showError('Failed to fetch weather data. Please try again.');
            console.error('Error:', error);
        }
    }

    function showLoading() {
        if (loadingDiv) {
            loadingDiv.classList.remove('hidden');
        }
    }

    function hideLoading() {
        if (loadingDiv) {
            loadingDiv.classList.add('hidden');
        }
    }

    function showError(message) {
        if (errorDiv) {
            const errorText = document.getElementById('error-text');
            if (errorText) {
                errorText.textContent = message;
            }
            errorDiv.classList.remove('hidden');
        }
    }

    function hideError() {
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }

    function hideWeatherResults() {
        if (weatherResults) {
            weatherResults.classList.add('hidden');
        }
    }

    function displayWeatherResults(data) {
        if (!weatherResults) return;

        const { current, predictions } = data;
        
        // Display current weather
        displayCurrentWeather(current);
        
        // Display predictions
        displayPredictions(predictions);
        
        // Display forecast
        if (data.forecast && data.forecast.list) {
            displayForecast(data.forecast.list);
        }
        
        // Show results
        weatherResults.classList.remove('hidden');
    }

    function displayCurrentWeather(current) {
        // Update current weather elements
        updateElement('current-city', current.name);
        updateElement('current-date', new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));
        updateElement('current-temp', Math.round(current.main.temp));
        updateElement('feels-like', Math.round(current.main.feels_like));
        updateElement('humidity', current.main.humidity);
        updateElement('wind-speed', current.wind.speed);
        updateElement('pressure', current.main.pressure);
        updateElement('weather-condition', current.weather[0].description);

        // Update weather icon
        const iconElement = document.getElementById('current-icon');
        if (iconElement) {
            const description = current.weather[0].description.toLowerCase();
            const iconClass = weatherIcons[description] || 'fas fa-sun';
            iconElement.className = iconClass;
        }
    }

    function displayPredictions(predictions) {
        const container = document.getElementById('predictions-container');
        if (!container || !predictions) return;

        container.innerHTML = '';

        predictions.forEach(prediction => {
            const predictionCard = document.createElement('div');
            predictionCard.className = 'prediction-card';
            
            const probabilityClass = getProbabilityClass(prediction.probability);
            
            predictionCard.innerHTML = `
                <h4>${prediction.day}</h4>
                ${prediction.date ? `<p class="prediction-date">${prediction.date}</p>` : ''}
                <div class="rain-probability ${probabilityClass}">
                    ${Math.round(prediction.probability)}%
                </div>
                <p class="prediction-label">Rain Chance</p>
                <p class="prediction-condition">${prediction.condition}</p>
                <div class="probability-bar">
                    <div class="probability-fill ${probabilityClass}" style="width: ${prediction.probability}%"></div>
                </div>
            `;
            
            container.appendChild(predictionCard);
        });
    }

    function displayForecast(forecastList) {
        const container = document.getElementById('forecast-container');
        if (!container || !forecastList) return;

        container.innerHTML = '';

        // Take first 5 items (next 5 days)
        const dailyForecasts = forecastList.slice(0, 5);

        dailyForecasts.forEach((forecast, index) => {
            const forecastCard = document.createElement('div');
            forecastCard.className = 'forecast-card';
            
            const date = new Date(forecast.dt * 1000);
            const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const description = forecast.weather[0].description.toLowerCase();
            const iconClass = weatherIcons[description] || 'fas fa-sun';
            
            forecastCard.innerHTML = `
                <h4>${dayName}</h4>
                <p class="forecast-date">${dateStr}</p>
                <div class="forecast-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="forecast-temp">${Math.round(forecast.main.temp)}°</div>
                <p class="forecast-condition">${forecast.weather[0].description}</p>
                <div class="forecast-details">
                    <small>
                        <i class="fas fa-tint"></i> ${forecast.main.humidity}%
                        <i class="fas fa-wind"></i> ${forecast.wind.speed} m/s
                    </small>
                </div>
            `;
            
            container.appendChild(forecastCard);
        });
    }

    function getProbabilityClass(probability) {
        if (probability < 30) return 'low-chance';
        if (probability < 70) return 'medium-chance';
        return 'high-chance';
    }

    function updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // Add some interactive animations
    function addInteractiveAnimations() {
        // Animate cards on hover
        const cards = document.querySelectorAll('.weather-card, .prediction-card, .forecast-card, .feature-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Animate buttons
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            });
        });
    }

    // Initialize animations after DOM is loaded
    setTimeout(addInteractiveAnimations, 100);

    // Auto-refresh weather data every 10 minutes if on dashboard
    if (window.location.pathname === '/dashboard') {
        setInterval(() => {
            const lastCity = cityInput?.value?.trim();
            if (lastCity) {
                // Silently refresh data
                fetch('/weather', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `city=${encodeURIComponent(lastCity)}`
                })
                .then(response => response.json())
                .then(data => {
                    if (!data.error) {
                        displayWeatherResults(data);
                    }
                })
                .catch(error => {
                    console.log('Auto-refresh failed:', error);
                });
            }
        }, 600000); // 10 minutes
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Alt + S to focus search
        if (e.altKey && e.key === 's' && cityInput) {
            e.preventDefault();
            cityInput.focus();
            cityInput.select();
        }
        
        // Enter to submit form when input is focused
        if (e.key === 'Enter' && document.activeElement === cityInput) {
            e.preventDefault();
            weatherForm?.dispatchEvent(new Event('submit'));
        }
        
        // Escape to clear search and hide results
        if (e.key === 'Escape') {
            if (cityInput) {
                cityInput.value = '';
            }
            hideWeatherResults();
            hideError();
        }
    });

    // Add geolocation support
    function getCurrentLocation() {
        if ('geolocation' in navigator) {
            const geoButton = document.getElementById('geo-button');
            if (geoButton) {
                geoButton.addEventListener('click', function() {
                    this.disabled = true;
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting location...';
                    
                    navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            const { latitude, longitude } = position.coords;
                            
                            try {
                                const response = await fetch('/weather/coordinates', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ lat: latitude, lon: longitude })
                                });
                                
                                const data = await response.json();
                                
                                if (data.error) {
                                    showError(data.error);
                                } else {
                                    displayWeatherResults(data);
                                    if (cityInput && data.current?.name) {
                                        cityInput.value = data.current.name;
                                    }
                                }
                            } catch (error) {
                                showError('Failed to get weather for your location');
                                console.error('Geolocation weather error:', error);
                            }
                            
                            this.disabled = false;
                            this.innerHTML = '<i class="fas fa-location-arrow"></i> Use My Location';
                        },
                        (error) => {
                            showError('Unable to get your location. Please enter a city manually.');
                            console.error('Geolocation error:', error);
                            
                            this.disabled = false;
                            this.innerHTML = '<i class="fas fa-location-arrow"></i> Use My Location';
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 600000 // 10 minutes
                        }
                    );
                });
            }
        }
    }

    // Initialize geolocation
    getCurrentLocation();

    // Add search suggestions
    let searchTimeout;
    if (cityInput) {
        cityInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            
            if (query.length >= 2) {
                searchTimeout = setTimeout(() => {
                    fetchCitySuggestions(query);
                }, 300);
            } else {
                hideSuggestions();
            }
        });
    }

    async function fetchCitySuggestions(query) {
        try {
            const response = await fetch(`/cities/search?q=${encodeURIComponent(query)}`);
            const suggestions = await response.json();
            
            if (suggestions && suggestions.length > 0) {
                displaySuggestions(suggestions);
            } else {
                hideSuggestions();
            }
        } catch (error) {
            console.error('Error fetching city suggestions:', error);
            hideSuggestions();
        }
    }

    function displaySuggestions(suggestions) {
        let suggestionsList = document.getElementById('city-suggestions');
        
        if (!suggestionsList) {
            suggestionsList = document.createElement('ul');
            suggestionsList.id = 'city-suggestions';
            suggestionsList.className = 'city-suggestions';
            cityInput.parentNode.appendChild(suggestionsList);
        }

        suggestionsList.innerHTML = '';
        
        suggestions.slice(0, 5).forEach(city => {
            const li = document.createElement('li');
            li.className = 'suggestion-item';
            li.textContent = `${city.name}, ${city.country}`;
            
            li.addEventListener('click', function() {
                cityInput.value = city.name;
                hideSuggestions();
                weatherForm?.dispatchEvent(new Event('submit'));
            });
            
            suggestionsList.appendChild(li);
        });
        
        suggestionsList.style.display = 'block';
    }

    function hideSuggestions() {
        const suggestionsList = document.getElementById('city-suggestions');
        if (suggestionsList) {
            suggestionsList.style.display = 'none';
        }
    }

    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!cityInput?.contains(e.target)) {
            hideSuggestions();
        }
    });

    // Add weather alerts functionality
    function checkWeatherAlerts(data) {
        if (data.alerts && data.alerts.length > 0) {
            displayWeatherAlerts(data.alerts);
        }
    }

    function displayWeatherAlerts(alerts) {
        const alertsContainer = document.getElementById('weather-alerts');
        if (!alertsContainer) return;

        alertsContainer.innerHTML = '';
        
        alerts.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.className = `weather-alert alert-${alert.severity || 'info'}`;
            
            alertDiv.innerHTML = `
                <div class="alert-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>${alert.event || 'Weather Alert'}</strong>
                </div>
                <p class="alert-description">${alert.description}</p>
                <small class="alert-time">
                    Valid: ${new Date(alert.start * 1000).toLocaleString()} - 
                    ${new Date(alert.end * 1000).toLocaleString()}
                </small>
            `;
            
            alertsContainer.appendChild(alertDiv);
        });
        
        alertsContainer.style.display = 'block';
    }

    // Add theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            
            // Save theme preference
            try {
                localStorage.setItem('weather-app-theme', isDark ? 'dark' : 'light');
            } catch (e) {
                // Handle localStorage not available
                console.log('Theme preference not saved - localStorage unavailable');
            }
            
            // Update toggle icon
            const icon = this.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
        });
        
        // Load saved theme
        try {
            const savedTheme = localStorage.getItem('weather-app-theme');
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
                const icon = themeToggle.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-sun';
                }
            }
        } catch (e) {
            // Handle localStorage not available
            console.log('Could not load saved theme');
        }
    }

    // Initialize all components
    console.log('Weather app initialized successfully');
});