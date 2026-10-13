/**
 * Приём заявок с сайта барбершопа и отправка их в Telegram.
 *
 * Настройка (один раз):
 * 1. Настройки проекта → Свойства скрипта → добавить TELEGRAM_TOKEN = ключ от @BotFather.
 * 2. Добавить бота в группу (или написать ему в личку) и отправить туда любое сообщение.
 * 3. Выбрать функцию findChat вверху и нажать «Выполнить». Она запомнит, куда слать заявки.
 * 4. Развернуть → Новое развертывание → Веб-приложение,
 *    «Выполнять как: я», «Доступ: все». Скопировать URL веб-приложения.
 */

const MAX_LEN = 120;

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    if (data.website) return json({ ok: true }); // скрытое поле-ловушка для ботов

    const name = clean(data.name);
    const phone = clean(data.phone);
    if (name.length < 2 || phone.replace(/\D/g, '').length < 10) {
      return json({ ok: false, error: 'Проверьте имя и телефон' });
    }

    const text = [
      '📅 Новая запись',
      '',
      '✂️ ' + clean(data.service),
      '👤 Мастер: ' + clean(data.barber),
      '🗓 ' + clean(data.date) + ' в ' + clean(data.time),
      '',
      'Клиент: ' + name,
      'Телефон: ' + phone,
    ].join('\n');

    send(text);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'Не удалось отправить заявку' });
  }
}

/** Находит последний чат, где боту написали, и запоминает его. */
function findChat() {
  const res = UrlFetchApp.fetch(api('getUpdates'));
  const updates = JSON.parse(res.getContentText()).result || [];
  const last = updates.reverse().find(u => u.message || u.my_chat_member);
  if (!last) throw new Error('Сначала напишите боту или в группу с ботом любое сообщение');
  const chat = (last.message || last.my_chat_member).chat;
  PropertiesService.getScriptProperties().setProperty('TELEGRAM_CHAT_ID', String(chat.id));
  send('✅ Готово! Сюда будут приходить заявки с сайта.');
  Logger.log('Чат сохранён: ' + (chat.title || chat.first_name));
}

function send(text) {
  const chatId = PropertiesService.getScriptProperties().getProperty('TELEGRAM_CHAT_ID');
  if (!chatId) throw new Error('Чат не настроен: запустите findChat');
  UrlFetchApp.fetch(api('sendMessage'), {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text: text }),
  });
}

function api(method) {
  const token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
  if (!token) throw new Error('Добавьте TELEGRAM_TOKEN в свойства скрипта');
  return 'https://api.telegram.org/bot' + token + '/' + method;
}

function clean(v) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, MAX_LEN);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
