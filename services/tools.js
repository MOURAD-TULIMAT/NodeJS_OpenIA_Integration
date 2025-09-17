export async function getWeather(location) {
  return {
    temp: "44°C",
    feelsLike: "52°C",
    condition: "Sunny",
    location,
    chanceOfRain: "0",
    humidityPercentage: "70%",
  };
}

export const tools = [
  {
    name: "get_weather",
    description: "Get the current weather for a city, to help decide clothing",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string", description: "City name" },
      },
      required: ["location"],
    },
  },
];
