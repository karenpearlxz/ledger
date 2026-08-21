/** Every call goes through here so a 401 always means "show the lock screen". */
const listeners = new Set();

export const onLocked = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('you look offline', 0);
  }

  // A 401 from the unlock endpoint means "wrong passcode", not "your session
  // expired". Treating them the same swallowed the server's message and told
  // her the app was locked, which she already knew.
  if (res.status === 401 && path !== '/auth/unlock') {
    listeners.forEach((fn) => fn());
    throw new ApiError('locked', 401);
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = null; }
  }

  if (!res.ok) throw new ApiError(data?.error || `request failed (${res.status})`, res.status);
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  put: (path, body) => request('PUT', path, body ?? {}),
  patch: (path, body) => request('PATCH', path, body ?? {}),
  del: (path) => request('DELETE', path),
};
