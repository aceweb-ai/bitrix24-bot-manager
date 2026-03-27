// pages/api/[...path].js
export default async function handler(req, res) {
  // 1. Проверка авторизации (пароль из заголовка Authorization: Bearer <password>)
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

  // 2. Собираем URL Битрикс24
  const webhookUrl = process.env.BITRIX24_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'BITRIX24_WEBHOOK_URL not set' });
  }

  // путь, который был передан после /api/
  const { path } = req.query; // массив частей пути
  const methodPath = path.join('/'); // например, 'imbot.bot.list'
  
  // 3. Определяем метод REST (GET или POST)
  let url;
  let fetchOptions = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
  
  if (req.method === 'GET') {
    // для GET запросов используем query string
    const query = new URLSearchParams(req.query).toString();
    url = `${webhookUrl}${methodPath}?${query}`;
    fetchOptions.method = 'GET';
  } else {
    // POST: тело запроса передаётся как JSON
    url = `${webhookUrl}${methodPath}`;
    fetchOptions.body = JSON.stringify(req.body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Proxy request failed' });
  }
}