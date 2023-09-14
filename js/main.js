
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const OPENWEATHER_API_KEY  = '7dfe309afec3ee637c6130947b96f76b';

const weatherContainer = document.querySelector('#weatherContainer');
const searchFormNode = document.querySelector('#searchForm');
const userSearchInput = document.querySelector('#searchText');
const errorMessageNode = document.querySelector('#errorMessage');
const searchResultContainer = document.querySelector( '#resultContainer' );
const weatherImageNode = document.querySelector('#weatherIcon');
const nowTag = document.querySelector('#now');
const temperatureNode = document.querySelector('#temperature');
const cityNode = document.querySelector('#city');
const feelsLikeNode = document.querySelector('#feelsLike');
const humidityNode = document.querySelector('#humidity');
const windNode = document.querySelector('#wind');
const timeNode = document.querySelector('#time');
const todayMinNode = document.querySelector('#todayMin');
const todayMaxNode = document.querySelector('#todayMax');
const tomorrowMinNode = document.querySelector('#tomorrowMin');
const tomorrowMaxNode = document.querySelector('#tomorrowMax');
const forecastButton = document.querySelector('#forecastButton');
const forecastContainer = document.querySelector('#forecastContainer');
const backButtonContainer = document.querySelector('#backButtonContainer');
const backButton = document.querySelector('#backButton');


// Perform a search when the user submits the form
searchFormNode.addEventListener( 'submit', ev => {
  ev.preventDefault(); // Stop the form submit from reloading the page
  const newCityQuery = userSearchInput.value;
  if(newCityQuery.trim().length === 0) {
    errorMessageNode.innerHTML = 'Please enter a city name.'
    errorMessageNode.style.display = 'block';
    return;
  }
  loadSearchResults(newCityQuery); // Give the user's input text to our AJAX function
});

// When user start typing on the input field, the previous error message disappear
userSearchInput.addEventListener('input', ev => {
  if(ev.target.value.trim().length > 0){
    errorMessageNode.innerHTML = '';
  }
});

// Searching weather data based on the text input
const loadSearchResults = (searchText) => {
  axios.get( OPENWEATHER_BASE_URL, {
    params: {
      q: searchText,
      appid: OPENWEATHER_API_KEY,
      units: 'metric'
    }
  })
  .then( res => {
    renderSearchResult(res.data);
  })
  .catch( err => {
    console.warn( 'Error loading search results:', err );
    if(err.response.status === 404) {
      handleCityNotFound();
      return;
    }
  });
  // Page is updated every minute
  setInterval(() => {
    loadSearchResults(searchText);
  }, 60000);
}; // loadSearchResults()

const handleCityNotFound = () => {
  errorMessageNode.innerHTML = 'City is not found';
  errorMessageNode.style.display = 'block';
  searchResultContainer.style.display = 'none';
};

// Display the current weather of the searched city
const renderSearchResult = (data) => {
  forecastContainer.style.display = 'none';
  backButtonContainer.style.display = 'none';
  errorMessageNode.style.display = 'none';
  setWeatherIcon(data);
  temperatureNode.innerHTML = Math.round(data.main.temp) + '°C';
  cityNode.innerHTML = `${data.name}, ${data.sys.country}`;
  feelsLikeNode.innerHTML = Math.round(data.main.feels_like) + '°C';
  humidityNode.innerHTML = data.main.humidity + '%';
  windNode.innerHTML = data.wind.speed + 'km/h';
  searchResultContainer.style.display = 'block';
  // get the current date and time at the searched city
  const nd = getLocalTime(data.timezone);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  timeNode.innerHTML = `${months[nd.getMonth()]} ${nd.getDate()}, ${nd.getHours()}:${nd.getMinutes()}`;

  todayMinNode.innerHTML = `Min: ${data.main.temp_min}°C`;
  todayMaxNode.innerHTML = `Max: ${data.main.temp_max}°C`;

  forecastButton.addEventListener('click', () => {
    show10DayForecast(data.coord.lat, data.coord.lon, data.name);
  });
};

// function to get local time based on timezone
const getLocalTime = (timezone) => {
  const d = new Date();
  const localTime = d.getTime();
  const localOffset = d.getTimezoneOffset() * 60000;
  const utc = localTime + localOffset;
  const city = utc + (1000 * timezone);
  return new Date(city);
};

// function to set the weather icon (only have five for now)
const setWeatherIcon = (data) => {
  if(data.weather[0].main === 'Clear') {
    weatherImageNode.src = 'images/clear.png';
  } else if(data.weather[0].main === 'Clouds') {
    weatherImageNode.src = 'images/clouds.png';
  } else if(data.weather[0].main === 'Rain') {
    weatherImageNode.src = 'images/rain.png';
  } else if(data.weather[0].main === 'Drizzle') {
    weatherImageNode.src = 'images/drizzle.png';
  } else if(data.weather[0].main === 'Mist') {
    weatherImageNode.src = 'images/mist.png';
  } 
  nowTag.innerHTML = data.weather[0].main
};

// function to load forecast for the next 10 days using open-meteo api
const show10DayForecast = (lat, lon, city) => {
  // I used openmeteo api for displaying daily forecast because it's free unlike openweathermap
  axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=10`)
  .then( res => {
    displayForecast(res.data, city);
  })
  .catch( err => {
    console.warn( 'Error loading search results:', err );
  });
};

// function to render the 10 day forecast (it could be broken down into smaller functions)
const displayForecast = (data, city) => {
  searchResultContainer.style.display = 'none';
  forecastContainer.innerHTML = '';
  backButtonContainer.style.display = 'none';

  const currentDate = getLocalTime(data.utc_offset_seconds);
  // Loop over each day data result
  for(let i = 0; i < 10; i++)
  {
    const divTag = document.createElement('div');
    divTag.className = 'day';
    divTag.style.width = '140px';
    
    const pTag = document.createElement('p');
    pTag.className = 'date';

    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + i + 1);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    pTag.innerHTML = `${months[nextDate.getMonth()]}, ${nextDate.getDate()}`;
    
    divTag.appendChild(pTag);

    const imgTag = document.createElement('img');
    imgTag.className = 'weather-icon';
    const percipitation = data.daily.precipitation_probability_max[i];
    const maxTemp = data.daily.temperature_2m_max[i];
    // Choose the image to display based on the weather (Not that accurate / just for fun)
    if( percipitation > 5 && maxTemp <= 0) {
      imgTag.src = 'images/snow.png';
      imgTag.alt = 'snow';
    } else if(percipitation > 20) {
      imgTag.src = 'images/rain.png';
      imgTag.alt = 'rain';
    } else {
      imgTag.src = 'images/clear.png';
      imgTag.alt = 'clear';
    }
    divTag.appendChild(imgTag);

    const minTempTag = document.createElement('p');
    minTempTag.className = 'dailyDetails';
    minTempTag.innerHTML = `Min: ${data.daily.temperature_2m_min[i]}°C`;
    divTag.appendChild(minTempTag);
    const maxTempTag = document.createElement('p');
    maxTempTag.className = 'dailyDetails';
    maxTempTag.innerHTML = `Max: ${data.daily.temperature_2m_max[i]}°C`;
    divTag.appendChild(maxTempTag);
    const rainChanceTag = document.createElement('p');
    rainChanceTag.className = 'dailyDetails';
    rainChanceTag.innerHTML = `Chance of rain: ${data.daily.precipitation_probability_max[i]}%`;
    divTag.appendChild(rainChanceTag);

    forecastContainer.appendChild(divTag);
  }
  
  forecastContainer.style.display = 'grid';
  forecastContainer.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr';
  forecastContainer.style.gridGap = '20px';
  forecastContainer.style.padding = '30px 100px';

  backButtonContainer.style.display = 'block';

  backButton.addEventListener('click', () => {
    forecastContainer.style.display = 'none';
    backButtonContainer.style.display = 'none';
    searchResultContainer.style.display = 'block';
  });
};