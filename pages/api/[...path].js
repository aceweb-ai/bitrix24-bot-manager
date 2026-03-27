// pages/api/[...path].js
export default async function handler(req, res) {
  console.log('=== HANDLER CALLED ===');
  console.log('Method:', req.method);
  console.log('Path:', req.query.path);
  console.log('Headers:', req.headers);

  // Проверка авторизации (отладочная версия)
  const authHeader = req.headers.authorization;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  console.log('=== DEBUG AUTH ===');
  console.log('authHeader:', authHeader);
  console.log('expectedPassword:', expectedPassword);

  if (!expectedPassword) {
    console.error('ADMIN_PASSWORD not set');
    return res.status(500).json({ error: 'ADMIN_PASSWORD not set' });
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('No Bearer token, authHeader:', authHeader);
    return res.status(401).json({
      error: 'Unauthorized',
      debug: { authHeader, expected: expectedPassword }
    });
  }

  const token = authHeader.slice(7);
  console.log('token extracted:', token);
  console.log('token length:', token.length);
  console.log('expected length:', expectedPassword.length);

  if (token !== expectedPassword) {
    console.error('Token mismatch');
    return res.status(403).json({
      error: 'Forbidden',
      debug: {
        expected: expectedPassword,
        received: token,
        expectedLength: expectedPassword.length,
        receivedLength: token.length
      }
    });
  }
  console.log('Auth OK');

  // Разрешаем только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const webhookUrl = process.env.BITRIX24_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'BITRIX24_WEBHOOK_URL not set' });
  }

  // путь: /api/imbot.bot.list -> path = ['imbot.bot.list']
  const { path } = req.query;
  const methodPath = path.join('/'); // например, 'imbot.bot.list'
  const url = `${webhookUrl}${methodPath}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Proxy request failed' });
  }
}
