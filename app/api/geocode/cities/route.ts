type GoogleGeocodeResult = {
  formatted_address?: string;
  address_components?: Array<{ long_name: string; types: string[] }>;
  geometry?: { location?: { lat: number; lng: number } };
};

type GoogleGeocodeResponse = {
  status?: string;
  results?: GoogleGeocodeResult[];
};

export async function GET(request: Request) {
  const city = new URL(request.url).searchParams.get("name")?.trim();
  if (!city || city.length < 2 || city.length > 120) {
    return Response.json({ error: "Enter a city name between 2 and 120 characters." }, { status: 400 });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return Response.json({ error: "City lookup is not configured. Add GOOGLE_MAPS_API_KEY on the server." }, { status: 503 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", city);
  url.searchParams.set("key", key);
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) {
    return Response.json({ error: "The city lookup service is temporarily unavailable." }, { status: 502 });
  }

  const data = (await response.json()) as GoogleGeocodeResponse;
  if (data.status === "ZERO_RESULTS") return Response.json({ results: [] });
  if (data.status !== "OK") {
    return Response.json({ error: "Google city lookup failed. Check the API key and enabled services." }, { status: 502 });
  }

  const results = (data.results ?? [])
    .map((place) => {
      const location = place.geometry?.location;
      const components = place.address_components ?? [];
      const component = (type: string) => components.find((item) => item.types.includes(type))?.long_name;
      const name =
        component("locality") ??
        component("postal_town") ??
        component("administrative_area_level_2") ??
        place.formatted_address;
      if (
        !name ||
        !location ||
        !Number.isFinite(location?.lat) ||
        !Number.isFinite(location?.lng)
      ) {
        return null;
      }
      return {
        name,
        latitude: location.lat,
        longitude: location.lng,
        admin1: component("administrative_area_level_1"),
        country: component("country") ?? "",
      };
    })
    .filter((place) => place !== null);

  return Response.json({ results });
}
