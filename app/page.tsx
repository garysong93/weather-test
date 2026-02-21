import WeatherCard from './components/WeatherCard';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-blue-50 to-zinc-100 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 flex flex-col">
      <main className="container mx-auto py-8 px-4 flex-1">
        <div className="mb-8 text-center">
          <h1 className="container mx-auto text-4xl font-bold text-blue-600 bg-red-500 mb-2 px-4 rounded">
            global weather forecast
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Real-time weather information · 7 day forecast · 24 hour details · Support any city weather information
          </p>
        </div>
        <WeatherCard />
      </main>
      <footer className="mt-auto py-6 px-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            Weather data provided by{' '}
            <a
              href="https://openweathermap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              OpenWeatherMap
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
