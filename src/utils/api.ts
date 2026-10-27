const SESSION_STORAGE_KEY = 'messmate_session_id';
const CSRF_STORAGE_KEY = 'messmate_csrf_token';

export function setAuthTokens(sessionId: string | null, csrfToken: string | null) {
  if (sessionId) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } else {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
  if (csrfToken) {
    sessionStorage.setItem(CSRF_STORAGE_KEY, csrfToken);
  } else {
    sessionStorage.removeItem(CSRF_STORAGE_KEY);
  }
}

export function getCsrfToken(): string | null {
  return sessionStorage.getItem(CSRF_STORAGE_KEY);
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T }> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  const sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
  const csrfToken = sessionStorage.getItem(CSRF_STORAGE_KEY);
  if (sessionId) {
    headers.set('X-MessMate-Session', sessionId);
  }
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  const data = (await response.json().catch(() => ({}))) as T;
  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}
