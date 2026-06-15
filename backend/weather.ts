import dotenv from 'dotenv';
dotenv.config();

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

interface WeatherData {
  temp: number;
  weatherText: string;
  windSpeed: number;
  humidity: number;
  weatherMultiplier: number;
  weatherFactor: number;
  rainChance: number;
  temperature: number;
  condition: string;
  windKph: number;
  isDay: boolean;
}

interface WeatherCacheEntry {
  data: WeatherData;
  timestamp: number;
}

const weatherCache: Record<string, WeatherCacheEntry> = {};

const getCacheKey = (lat: number, lng: number) => {
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
};

export const getWeatherData = async (lat: number, lng: number): Promise<WeatherData> => {
  const cacheKey = getCacheKey(lat, lng);
  const cached = weatherCache[cacheKey];

  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.data;
  }

  // Fallback defaults
  const fallback: WeatherData = {
    temp: 28,
    weatherText: 'Clear',
    windSpeed: 10,
    humidity: 55,
    weatherMultiplier: 1.0,
    weatherFactor: 0,
    rainChance: 0,
    temperature: 28,
    condition: 'Clear',
    windKph: 10,
    isDay: true
  };

  if (!WEATHER_API_KEY) {
    console.warn('[WeatherService] No WEATHER_API_KEY set, using simulation defaults.');
    return fallback;
  }

  try {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lng}&days=1&aqi=no`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`WeatherAPI responded with status ${response.status}`);
    }
    const data = await response.json();
    
    const temp = data.current?.temp_c ?? fallback.temp;
    const weatherText = data.current?.condition?.text ?? fallback.weatherText;
    const windSpeed = data.current?.wind_kph ?? fallback.windSpeed;
    const humidity = data.current?.humidity ?? fallback.humidity;
    const rainChance = data.forecast?.forecastday?.[0]?.day?.daily_chance_of_rain ?? fallback.rainChance;
    const isDay = data.current?.is_day === 1;

    // Map weather conditions to surcharges and multipliers
    let weatherMultiplier = 1.0;
    let weatherFactor = 0; // Surcharge

    const wt = weatherText.toLowerCase();
    if (wt.includes('overcast') || wt.includes('cloud') || wt.includes('mist') || wt.includes('haze') || wt.includes('fog')) {
      weatherMultiplier = 1.1;
      weatherFactor = 10;
    } else if (wt.includes('rain') || wt.includes('drizzle') || wt.includes('shower')) {
      weatherMultiplier = 1.25;
      weatherFactor = 30;
    } else if (wt.includes('storm') || wt.includes('thunder') || wt.includes('snow') || wt.includes('blizzard')) {
      weatherMultiplier = 1.5;
      weatherFactor = 50;
    }

    const result: WeatherData = {
      temp,
      weatherText,
      windSpeed,
      humidity,
      weatherMultiplier,
      weatherFactor,
      rainChance,
      temperature: temp,
      condition: weatherText,
      windKph: windSpeed,
      isDay
    };

    weatherCache[cacheKey] = {
      data: result,
      timestamp: Date.now()
    };

    return result;
  } catch (err) {
    console.error('[WeatherService] Error retrieving weather details:', err);
    return fallback;
  }
};
