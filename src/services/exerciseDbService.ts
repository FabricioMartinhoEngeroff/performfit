import { termoBuscaGif } from "../data/exerciseAliases";

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY as string;
const RAPIDAPI_HOST = "exercisedb.p.rapidapi.com";
const BASE_URL = "https://exercisedb.p.rapidapi.com";

function headers() {
  return { "X-RapidAPI-Key": RAPIDAPI_KEY, "X-RapidAPI-Host": RAPIDAPI_HOST };
}

// In-memory cache — survives navigation within the session, cleared on page reload.
const gifCache = new Map<string, string>();

export async function fetchExerciseGif(portugueseName: string): Promise<string | null> {
  if (gifCache.has(portugueseName)) return gifCache.get(portugueseName)!;

  const searchTerm = termoBuscaGif(portugueseName);
  if (!searchTerm || !RAPIDAPI_KEY) return null;

  const searchRes = await fetch(
    `${BASE_URL}/exercises/name/${encodeURIComponent(searchTerm)}?limit=1&offset=0`,
    { headers: headers() }
  );
  if (!searchRes.ok) return null;

  const searchData = await searchRes.json();
  const exercises: Array<Record<string, unknown>> = Array.isArray(searchData)
    ? searchData
    : Array.isArray(searchData?.data)
    ? searchData.data
    : [];

  // The ExerciseDB API returns gifUrl directly in the search result — a stable
  // https:// CDN URL that works on all platforms (no blob URL needed).
  const gifUrl = (exercises[0]?.gifUrl as string) || null;
  if (gifUrl) gifCache.set(portugueseName, gifUrl);
  return gifUrl;
}
