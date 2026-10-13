type GoogleTimeZoneResponse = {
  status?: string;
  timeZoneId?: string;
};

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const latitude = Number(params.get("latitude"));
  const longitude = Number(params.get("longitude"));
  if (
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90 ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180
  ) {
    return Response.json({ error: "Select a valid city before resolving its time zone." }, { status: 400 });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return Response.json({ error: "City lookup is not configured. Add GOOGLE_MAPS_API_KEY on the server." }, { status: 503 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/timezone/json");
  url.searchParams.set("location", `${latitude},${longitude}`);
  url.searchParams.set("timestamp", String(Math.floor(Date.now() / 1000)));
  url.searchParams.set("key", key);
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) {
    return Response.json({ error: "The time-zone service is temporarily unavailable." }, { status: 502 });
  }

  const data = (await response.json()) as GoogleTimeZoneResponse;
  if (data.status !== "OK" || !data.timeZoneId) {
    return Response.json({ error: "Google could not determine this city's time zone." }, { status: 502 });
  }

  return Response.json({ timezone: data.timeZoneId });
}
