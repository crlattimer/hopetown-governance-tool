// POST /api/auth { password } -> 200 if matches ACCESS_PASSWORD env var, else 401.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expected = process.env.ACCESS_PASSWORD;
  if (!expected) {
    return res.status(500).json({ error: 'Server is not configured.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body.' });
    }
  }

  const provided = body && typeof body.password === 'string' ? body.password : '';
  if (!provided) {
    return res.status(400).json({ error: 'Password required.' });
  }

  // Constant-time comparison.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  let mismatch = a.length !== b.length ? 1 : 0;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    mismatch |= (a[i] || 0) ^ (b[i] || 0);
  }

  if (mismatch !== 0) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  return res.status(200).json({ ok: true });
}
