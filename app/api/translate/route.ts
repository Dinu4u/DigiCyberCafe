type TranslationRequest = {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
};

type MyMemoryResponse = {
  quotaFinished?: boolean;
  responseData?: { translatedText?: string };
  responseStatus?: number;
};

const supportedLanguages = new Set([
  "en", "hi", "es", "fr", "de", "bn", "mr", "ar", "pt", "it", "ru", "ja", "zh", "ta", "te",
]);

function jsonResponse(body: object, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "The translation request is invalid." }, 400);
  }

  if (typeof body !== "object" || body === null) {
    return jsonResponse({ error: "The translation request is invalid." }, 400);
  }

  const { text, sourceLanguage, targetLanguage } = body as Partial<TranslationRequest>;
  if (typeof text !== "string" || !text.trim() || text.length > 500) {
    return jsonResponse({ error: "Text to translate must be between 1 and 500 characters." }, 400);
  }
  if (
    typeof sourceLanguage !== "string" ||
    typeof targetLanguage !== "string" ||
    !supportedLanguages.has(sourceLanguage) ||
    !supportedLanguages.has(targetLanguage) ||
    sourceLanguage === targetLanguage
  ) {
    return jsonResponse({ error: "Choose two different supported languages." }, 400);
  }

  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${sourceLanguage}|${targetLanguage}`);

  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "TimeoutError";
    return jsonResponse(
      { error: isTimeout ? "The translation service timed out. Please try again." : "Could not reach the translation service. Check your connection and try again." },
      502,
    );
  }

  if (response.status === 429) {
    return jsonResponse({ error: "The translation service is temporarily rate-limited. Please try again later." }, 429);
  }
  if (!response.ok) {
    return jsonResponse({ error: "The translation service is temporarily unavailable. Please try again later." }, 502);
  }

  let result: MyMemoryResponse;
  try {
    result = (await response.json()) as MyMemoryResponse;
  } catch {
    return jsonResponse({ error: "The translation service returned an invalid response. Please try again." }, 502);
  }

  if (result.quotaFinished) {
    return jsonResponse({ error: "The free translation quota has been reached. Please try again later." }, 429);
  }
  const translatedText = result.responseData?.translatedText?.trim();
  if (result.responseStatus !== 200 || !translatedText || translatedText.startsWith("MYMEMORY WARNING")) {
    return jsonResponse({ error: "The translation service could not translate this text. Please try again later." }, 502);
  }

  return jsonResponse({ translatedText });
}
