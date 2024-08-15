const apiKey = '4c110904c378eee8a1af70609eb1f4eb'; 

const searchButton = document.getElementById('search-button');
const cityInput = document.getElementById('city-input');
const cityName = document.getElementById('city-name');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const humidity = document.getElementById('humidity');
const errorMessage = document.getElementById('error-message');

const getWeather = async () => {
    const city = cityInput.value.trim();
    if (!city) {
        errorMessage.textContent = 'Please enter a city name';
        return;
    }

    errorMessage.textContent = '';

    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        cityName.textContent = `City: ${data.name}`;
        temperature.textContent = `Temperature: ${data.main.temp}°C`;
        description.textContent = `Description: ${data.weather[0].description}`;
        humidity.textContent = `Humidity: ${data.main.humidity}%`;
    } catch (error) {
        errorMessage.textContent = `Error: ${error.message}`;
    }
};

searchButton.addEventListener('click', getWeather);
