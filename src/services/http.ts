const DEFAULT_TIMEOUT_MS = 12000;
const RETRY_DELAY_MS = 800;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.status >= 500 && attempt === 0) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
      }

      return response;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (attempt === 0 && !isAbort) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      if (attempt === 0 && isAbort) {
        // Retry once on timeout
        await sleep(RETRY_DELAY_MS);
        continue;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Network request failed');
}

export async function fetchJson<T>(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const res = await fetchWithRetry(url, { headers: { Accept: 'application/json' } }, timeoutMs);
  return (await res.json()) as T;
}

export async function fetchText(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<string> {
  const res = await fetchWithRetry(url, {}, timeoutMs);
  return await res.text();
}
