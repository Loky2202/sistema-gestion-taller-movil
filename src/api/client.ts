// ============================================================
// CLIENTE HTTP - Comunicación con el backend FastAPI
// ============================================================

// En desarrollo se usa el proxy de Vite y en producción el de Nginx,
// así que la ruta relativa funciona en ambos casos.
export const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

const TOKEN_KEY = 'taller_token';
const UNAUTHORIZED_EVENT = 'taller:unauthorized';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
};

async function request<T>(path: string, { method = 'GET', body, auth = true }: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;

  // Timeout de 10 segundos para evitar peticiones colgadas
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e: any) {
    if (e.name === 'AbortError') {
      throw new ApiError('El servidor tardó demasiado en responder. Intenta de nuevo.', 408);
    }
    throw new ApiError(
      'No se pudo conectar con el servidor. Verifica que la PC del taller esté encendida y en la misma red.',
      0
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401 && auth) {
    setToken(null);
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  if (!response.ok) {
    let detail = `Error ${response.status}`;
    try {
      const data = await response.json();
      if (typeof data?.detail === 'string') detail = data.detail;
      else if (Array.isArray(data?.detail)) {
        detail = data.detail.map((d: any) => d.msg).join(', ');
      }
    } catch {
      // Respuesta sin cuerpo JSON
    }
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  /** Login: no requiere token previo */
  login: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body, auth: false }),
};

export { request, UNAUTHORIZED_EVENT };
