// pages/api/[...path].js
export default async function handler(req, res) {
  // Проверка авторизации
  const authHeader = req.headers.authorization;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD not set' });
  }
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  if (token !== expectedPassword) {
    return res.status(403).json({ error: 'Forbidden' });
  }

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
