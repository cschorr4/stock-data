// lib/fetch-helpers.ts

export const RETRY_DELAY = 1000;
export const MAX_RETRIES = 3;

export const fetchWithRetry = async (
  url: string, 
  options: RequestInit = {}, 
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<Response> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 2);
  }
};