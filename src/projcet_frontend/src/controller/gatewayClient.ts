// Lightweight gateway HTTP helper used as a fallback when direct actor calls fail.
// This keeps changes minimal and low-risk: it does a POST to the local replica
// gateway canister http_call endpoint and returns parsed JSON.

export async function fetchViaGateway(path: string, body: any, targetCanister: string) {
  // Local replica endpoint for http_call
  const url = `/api/v2/canister/${targetCanister}/http_call`;

  const req = {
    method: 'POST',
    url: path,
    headers: [['content-type', 'application/json'], ['x-target-canister', targetCanister]],
    body: typeof body === 'string' ? body : JSON.stringify(body),
    certificate_version: null,
  };

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!resp.ok) {
      throw new Error(`Gateway HTTP error ${resp.status}`);
    }

    const text = await resp.text();
    try {
      return JSON.parse(text);
    } catch (_) {
      return text;
    }
  } catch (err) {
    console.error('fetchViaGateway error', err);
    throw err;
  }
}
