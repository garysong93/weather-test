'use client';

import { useEffect, useState } from 'react';

interface WeatherData {
  city: string;
  latitude: number;
  longitude: number;
  current_weather: {
    temperature: number;
    weathercode: number;
    windspeed: number;
    winddirection: number;
    time: string;
  };
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    weathercode: number[];
  };
}

// Weather code descriptions and icons
const weatherCodes: Record<number, { desc: string; emoji: string }> = {
  0: { desc: 'Clear sky', emoji: '☀️' },
  1: { desc: 'Mainly clear', emoji: '🌤️' },
  2: { desc: 'Partly cloudy', emoji: '⛅' },
  3: { desc: 'Overcast', emoji: '☁️' },
  45: { desc: 'Fog', emoji: '🌫️' },
  48: { desc: 'Depositing rime fog', emoji: '🌫️' },
  51: { desc: 'Light drizzle', emoji: '🌦️' },
  53: { desc: 'Moderate drizzle', emoji: '🌦️' },
  55: { desc: 'Dense drizzle', emoji: '🌧️' },
  56: { desc: 'Light freezing drizzle', emoji: '🌨️' },
  57: { desc: 'Dense freezing drizzle', emoji: '🌨️' },
  61: { desc: 'Slight rain', emoji: '🌦️' },
  63: { desc: 'Moderate rain', emoji: '🌧️' },
  65: { desc: 'Heavy rain', emoji: '🌧️' },
  66: { desc: 'Light freezing rain', emoji: '🌨️' },
  67: { desc: 'Heavy freezing rain', emoji: '🌨️' },
  71: { desc: 'Slight snow', emoji: '❄️' },
  73: { desc: 'Moderate snow', emoji: '❄️' },
  75: { desc: 'Heavy snow', emoji: '❄️' },
  77: { desc: 'Snow grains', emoji: '❄️' },
  80: { desc: 'Slight rain showers', emoji: '🌦️' },
  81: { desc: 'Moderate rain showers', emoji: '🌧️' },
  82: { desc: 'Violent rain showers', emoji: '⛈️' },
  85: { desc: 'Slight snow showers', emoji: '❄️' },
  86: { desc: 'Heavy snow showers', emoji: '❄️' },
  95: { desc: 'Thunderstorm', emoji: '⛈️' },
  96: { desc: 'Thunderstorm with hail', emoji: '⛈️' },
  99: { desc: 'Heavy thunderstorm with hail', emoji: '⛈️' },
};

// Popular cities list
const popularCities = [
  'Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Hangzhou', 'Chengdu', 'Chongqing', 'Xi\'an',
  'Nanjing', 'Wuhan', 'Tianjin', 'Suzhou', 'Changsha', 'Zhengzhou', 'Dongguan', 'Qingdao',
  'Shenyang', 'Ningbo', 'Kunming', 'Dalian', 'Xiamen', 'Hefei', 'Foshan', 'Fuzhou',
  'Harbin', 'Jinan', 'Wenzhou', 'Shijiazhuang', 'Quanzhou', 'Changchun', 'Guiyang', 'Nanchang',
  'London', 'New York', 'Tokyo', 'Paris', 'Sydney', 'Singapore', 'Seoul', 'Bangkok'
];

function getWeatherInfo(code: number) {
  return weatherCodes[code] || { desc: 'Unknown', emoji: '❓' };
}

function formatTime(timeString: string) {
  const date = new Date(timeString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(timeString: string) {
  const date = new Date(timeString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCity, setCurrentCity] = useState('Shenzhen');
  const [inputCity, setInputCity] = useState('');
  const [cityIndex, setCityIndex] = useState(0);

  const fetchWeather = async (city: string) => {
    setLoading(true);
    setError(null);
    
    let cancelled = false;

    try {
      console.log('Fetching weather data for city:', city);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('API response status:', response.status, response.ok);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}` };
        }
        console.error('API error:', errorData);
        if (!cancelled) {
          throw new Error(errorData.message || errorData.error || `Failed to fetch weather data: ${response.status}`);
        }
        return;
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      if (cancelled) return;
      
      if (!data.current_weather) {
        console.error('Missing current_weather:', data);
        throw new Error('Data format error: Missing current weather data');
      }
      if (!data.daily) {
        console.error('Missing daily:', data);
        throw new Error('Data format error: Missing daily data');
      }
      if (!data.hourly) {
        console.error('Missing hourly:', data);
        throw new Error('Data format error: Missing hourly data');
      }
      
      console.log('Data validation passed, setting weather data');
      if (!cancelled) {
        setWeather(data);
        setCurrentCity(data.city || city);
      }
    } catch (err) {
      if (cancelled) return;
      
      console.error('Failed to fetch weather data:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timeout, please check your network connection');
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }

    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    fetchWeather(currentCity);
  }, []);

  const handleNextCity = () => {
    const nextIndex = (cityIndex + 1) % popularCities.length;
    setCityIndex(nextIndex);
    const nextCity = popularCities[nextIndex];
    setCurrentCity(nextCity);
    fetchWeather(nextCity);
  };

  const handleSearchCity = () => {
    if (inputCity.trim()) {
      setCurrentCity(inputCity.trim());
      fetchWeather(inputCity.trim());
      setInputCity('');
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-zinc-600 dark:text-zinc-400">Loading weather data...</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">{currentCity}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-lg mb-4 text-red-500">❌ {error}</p>
            <button
              onClick={() => fetchWeather(currentCity)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const current = weather.current_weather;
  const currentWeather = getWeatherInfo(current.weathercode);
  const todayMax = weather.daily.temperature_2m_max[0];
  const todayMin = weather.daily.temperature_2m_min[0];

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* City search and navigation */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={inputCity}
              onChange={(e) => setInputCity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchCity()}
              placeholder="Enter city name..."
              className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearchCity}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
            >
              Search
            </button>
          </div>
          <button
            onClick={handleNextCity}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap"
          >
            Next City →
          </button>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 text-center">
          Current: {weather.city} | Next: {popularCities[(cityIndex + 1) % popularCities.length]}
        </p>
      </div>

      {/* Current weather */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{weather.city}</h1>
            <p className="text-blue-100">{formatTime(current.time)}</p>
          </div>
          <div className="text-right">
            <div className="text-6xl mb-2">{currentWeather.emoji}</div>
            <p className="text-lg">{currentWeather.desc}</p>
          </div>
        </div>
        
        <div className="flex items-end gap-4">
          <div className="text-7xl font-bold">{Math.round(current.temperature)}°</div>
          <div className="mb-2">
            <div className="text-xl">
              <span className="font-semibold">{Math.round(todayMax)}°</span>
              <span className="text-blue-200"> / {Math.round(todayMin)}°</span>
            </div>
            <div className="text-sm text-blue-100 mt-1">
              Wind: {current.windspeed} km/h
            </div>
          </div>
        </div>
      </div>

      {/* 7 day forecast */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">7 Day Forecast</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {weather.daily.time.slice(0, 7).map((date, index) => {
            const weatherInfo = getWeatherInfo(weather.daily.weathercode[index]);
            const maxTemp = weather.daily.temperature_2m_max[index];
            const minTemp = weather.daily.temperature_2m_min[index];
            const isToday = index === 0;

            return (
              <div
                key={date}
                className={`p-4 rounded-xl ${
                  isToday
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                    : 'bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
                }`}
              >
                <div className="text-center">
                  <p className={`font-semibold mb-2 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {isToday ? 'Today' : formatDate(date)}
                  </p>
                  <div className="text-4xl mb-2">{weatherInfo.emoji}</div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    {weatherInfo.desc}
                  </p>
                  <div className="text-sm">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {Math.round(maxTemp)}°
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {' '}/ {Math.round(minTemp)}°
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 24 hour forecast */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">24 Hour Forecast</h2>
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {weather.hourly.time.slice(0, 24).map((time, index) => {
              const temp = weather.hourly.temperature_2m[index];
              const humidity = weather.hourly.relative_humidity_2m[index];
              const weatherCode = weather.hourly.weathercode[index];
              const weatherInfo = getWeatherInfo(weatherCode);
              const date = new Date(time);
              const isNow = index === 0;

              return (
                <div
                  key={time}
                  className={`flex-shrink-0 w-20 p-3 rounded-lg text-center ${
                    isNow
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                      : 'bg-zinc-50 dark:bg-zinc-800'
                  }`}
                >
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                    {date.getHours()}:00
                  </p>
                  <div className="text-2xl mb-1">{weatherInfo.emoji}</div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {Math.round(temp)}°
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {humidity}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
