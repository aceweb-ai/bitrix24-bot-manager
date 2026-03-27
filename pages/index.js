import { useState, useEffect } from 'react';

const API_BASE = '/api';

async function callBitrix(method, params = {}, httpMethod = 'POST') {
  const url = `${API_BASE}/${method}`;
  const options = {
    method: httpMethod,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('adminPassword')}`,
    },
  };
  if (httpMethod === 'POST') {
    options.body = JSON.stringify(params);
  } else if (httpMethod === 'GET' && Object.keys(params).length) {
    // для GET параметры добавляем в URL
    const query = new URLSearchParams(params).toString();
    return fetch(`${url}?${query}`, options);
  }
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

export default function Home() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updateId, setUpdateId] = useState('');
  const [updateName, setUpdateName] = useState('');
  const [updatePosition, setUpdatePosition] = useState('');
  const [updateColor, setUpdateColor] = useState('GREEN');
  const [message, setMessage] = useState('');

  const login = () => {
    if (!password) return;
    localStorage.setItem('adminPassword', password);
    setAuthenticated(true);
    fetchBots();
  };

  const fetchBots = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await callBitrix('imbot.bot.list', {}, 'GET');
      if (data.result) {
        setBots(data.result);
      } else {
        setError('Не удалось получить список ботов');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteBot = async (botId) => {
    if (!confirm(`Удалить бота с ID ${botId}?`)) return;
    setLoading(true);
    try {
      await callBitrix('imbot.unregister', { BOT_ID: botId });
      setMessage(`Бот ${botId} удалён`);
      fetchBots(); // обновляем список
    } catch (err) {
      setError(`Ошибка удаления: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateBot = async () => {
    if (!updateId) return;
    setLoading(true);
    const fields = {};
    if (updateName) fields.PROPERTIES = { ...fields.PROPERTIES, NAME: updateName };
    if (updatePosition) fields.PROPERTIES = { ...fields.PROPERTIES, WORK_POSITION: updatePosition };
    if (updateColor) fields.PROPERTIES = { ...fields.PROPERTIES, COLOR: updateColor };
    if (Object.keys(fields).length === 0) {
      setError('Укажите хотя бы одно поле для обновления');
      setLoading(false);
      return;
    }
    try {
      await callBitrix('imbot.update', { BOT_ID: parseInt(updateId), FIELDS: fields });
      setMessage(`Бот ${updateId} обновлён`);
      fetchBots();
      setUpdateId(''); setUpdateName(''); setUpdatePosition(''); setUpdateColor('GREEN');
    } catch (err) {
      setError(`Ошибка обновления: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('adminPassword');
    if (stored) {
      setPassword(stored);
      setAuthenticated(true);
      fetchBots();
    }
  }, []);

  if (!authenticated) {
    return (
      <div style={{ maxWidth: 400, margin: '100px auto', textAlign: 'center' }}>
        <h2>Вход в панель управления ботами</h2>
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: 8, marginBottom: 10 }}
        />
        <button onClick={login} style={{ padding: '8px 16px' }}>Войти</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Управление ботами Битрикс24</h1>
      {error && <div style={{ color: 'red', background: '#ffeeee', padding: 10, marginBottom: 10 }}>{error}</div>}
      {message && <div style={{ color: 'green', background: '#eeffee', padding: 10, marginBottom: 10 }}>{message}</div>}
      
      <h2>Список ботов</h2>
      {loading && <div>Загрузка...</div>}
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th><th>Имя</th><th>Код</th><th>Должность</th><th>Цвет</th><th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {bots.map(bot => (
            <tr key={bot.id}>
              <td>{bot.id}</td>
              <td>{bot.name} {bot.last_name}</td>
              <td>{bot.code}</td>
              <td>{bot.work_position}</td>
              <td>{bot.color}</td>
              <td>
                <button onClick={() => deleteBot(bot.id)} disabled={loading}>Удалить</button>
                <button onClick={() => {
                  setUpdateId(bot.id);
                  setUpdateName(bot.name);
                  setUpdatePosition(bot.work_position || '');
                  setUpdateColor(bot.color || 'GREEN');
                }} style={{ marginLeft: 8 }}>Редактировать</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />
      <h2>Редактирование бота</h2>
      <div>
        <label>ID бота: <input type="number" value={updateId} onChange={e => setUpdateId(e.target.value)} /></label><br />
        <label>Новое имя: <input value={updateName} onChange={e => setUpdateName(e.target.value)} /></label><br />
        <label>Новая должность: <input value={updatePosition} onChange={e => setUpdatePosition(e.target.value)} /></label><br />
        <label>Цвет:
          <select value={updateColor} onChange={e => setUpdateColor(e.target.value)}>
            <option>GREEN</option><option>RED</option><option>BLUE</option><option>PURPLE</option>
          </select>
        </label><br />
        <button onClick={updateBot} disabled={loading}>Обновить</button>
      </div>
    </div>
  );
}
