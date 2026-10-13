/**
 * Онлайн-запись барбершопа: занятые слоты, защита от двойной брони и отмена кнопкой в Telegram.
 *
 * Хранилище — свойства скрипта (никаких таблиц):
 *   slot|2026-10-15|daniyar|14:00 → {"n":"Арман","p":"+7…","s":"Стрижка","m":123}
 *
 * Настройка (один раз):
 * 1. Свойства скрипта: TELEGRAM_TOKEN = ключ от @BotFather.
 * 2. Добавить бота в группу, написать туда сообщение, запустить findChat.
 * 3. Запустить setup — он включит проверку кнопок «Отменить» раз в минуту.
 * 4. Развернуть как веб-приложение («Выполнять как: я», «Доступ: все»).
 */

const MAX_LEN = 120;
const SLOT_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const ID_RE = /^[a-z0-9_-]{1,32}$/;

/* ---------- сайт: какие слоты заняты ---------- */

function doGet(e) {
  const date = String(e.parameter.date || '');
  const barber = String(e.parameter.barber || '');
  if (!SLOT_RE.test(date) || !ID_RE.test(barber)) return json({ ok: false, error: 'Неверный запрос' });
  const prefix = 'slot|' + date + '|' + barber + '|';
  const taken = Object.keys(props().getProperties())
    .filter(k => k.indexOf(prefix) === 0)
    .map(k => k.slice(prefix.length));
  return json({ ok: true, taken: taken });
}

/* ---------- сайт: новая запись ---------- */

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents || '{}'); } catch (err) { return json({ ok: false, error: 'Неверный запрос' }); }
  if (data.website) return json({ ok: true }); // поле-ловушка для ботов

  const name = clean(data.name);
  const phone = clean(data.phone);
  const dateIso = String(data.dateIso || '');
  const barberId = String(data.barberId || '');
  const time = String(data.time || '');
  if (name.length < 2 || phone.replace(/\D/g, '').length < 10) return json({ ok: false, error: 'Проверьте имя и телефон' });
  if (!SLOT_RE.test(dateIso) || !ID_RE.test(barberId) || !TIME_RE.test(time)) return json({ ok: false, error: 'Выберите день и время' });
  if (dateIso < today()) return json({ ok: false, error: 'Этот день уже прошёл' });

  const key = 'slot|' + dateIso + '|' + barberId + '|' + time;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return json({ ok: false, error: 'Сервер занят, попробуйте ещё раз' });
  try {
    if (props().getProperty(key)) return json({ ok: false, taken: true, error: 'Это время только что заняли' });
    props().setProperty(key, JSON.stringify({ n: name, p: phone, s: clean(data.service), m: 0 }));
  } finally {
    lock.releaseLock();
  }

  const text = bookingText(data, name, phone);
  try {
    const msg = send(text, cancelKeyboard(key));
    const rec = JSON.parse(props().getProperty(key));
    rec.m = msg.message_id;
    props().setProperty(key, JSON.stringify(rec));
  } catch (err) {
    props().deleteProperty(key); // не смогли уведомить — не держим слот
    return json({ ok: false, error: 'Не удалось отправить заявку' });
  }
  return json({ ok: true });
}

function bookingText(data, name, phone) {
  return [
    '📅 Новая запись',
    '',
    '✂️ ' + clean(data.service),
    '👤 Мастер: ' + clean(data.barber),
    '🗓 ' + clean(data.date) + ' в ' + clean(data.time),
    '',
    'Клиент: ' + name,
    'Телефон: ' + phone,
  ].join('\n');
}

function cancelKeyboard(key) {
  // callback_data ограничен 64 байтами; ключ вида slot|2026-10-15|daniyar|14:00 укладывается
  return { inline_keyboard: [[{ text: '❌ Отменить запись', callback_data: 'c|' + key.slice(5) }]] };
}

/* ---------- Telegram: кнопка «Отменить» (проверка раз в минуту) ---------- */

function pollTelegram() {
  const offset = Number(props().getProperty('TG_OFFSET') || 0);
  const res = UrlFetchApp.fetch(api('getUpdates') + '?timeout=0&allowed_updates=%5B%22callback_query%22%5D&offset=' + offset);
  const updates = JSON.parse(res.getContentText()).result || [];
  const chatId = props().getProperty('TELEGRAM_CHAT_ID');

  updates.forEach(u => {
    props().setProperty('TG_OFFSET', String(u.update_id + 1));
    const q = u.callback_query;
    if (!q || !q.data || q.data.indexOf('c|') !== 0) return;
    if (!q.message || String(q.message.chat.id) !== chatId) return; // только из своей группы

    const key = 'slot|' + q.data.slice(2);
    const existed = props().getProperty(key);
    if (existed) props().deleteProperty(key);

    call('editMessageText', {
      chat_id: chatId,
      message_id: q.message.message_id,
      text: q.message.text + '\n\n❌ Запись отменена (' + (q.from.first_name || 'админ') + '). Время снова свободно.',
    });
    call('answerCallbackQuery', { callback_query_id: q.id, text: existed ? 'Запись отменена' : 'Уже отменено' });
  });

  cleanupOld();
}

/** Удаляет записи на прошедшие дни, чтобы хранилище не переполнялось. */
function cleanupOld() {
  const t = today();
  const all = props().getProperties();
  Object.keys(all).forEach(k => {
    if (k.indexOf('slot|') === 0 && k.split('|')[1] < t) props().deleteProperty(k);
  });
}

/** Запустить один раз: включает проверку кнопок раз в минуту. */
function setup() {
  ScriptApp.getProjectTriggers()
    .filter(tr => tr.getHandlerFunction() === 'pollTelegram')
    .forEach(tr => ScriptApp.deleteTrigger(tr));
  ScriptApp.newTrigger('pollTelegram').timeBased().everyMinutes(1).create();
  call('deleteWebhook', {});
  Logger.log('Готово: кнопки «Отменить» проверяются раз в минуту');
}

/** Находит последний чат, где боту написали, и запоминает его. */
function findChat() {
  const res = UrlFetchApp.fetch(api('getUpdates'));
  const updates = JSON.parse(res.getContentText()).result || [];
  const last = updates.reverse().find(u => u.message || u.my_chat_member);
  if (!last) throw new Error('Сначала напишите боту или в группу с ботом любое сообщение');
  const chat = (last.message || last.my_chat_member).chat;
  props().setProperty('TELEGRAM_CHAT_ID', String(chat.id));
  send('✅ Готово! Сюда будут приходить заявки с сайта.');
  Logger.log('Чат сохранён: ' + (chat.title || chat.first_name));
}

/* ---------- помощники ---------- */

function send(text, keyboard) {
  const chatId = props().getProperty('TELEGRAM_CHAT_ID');
  if (!chatId) throw new Error('Чат не настроен: запустите findChat');
  const body = { chat_id: chatId, text: text };
  if (keyboard) body.reply_markup = keyboard;
  return call('sendMessage', body);
}

function call(method, body) {
  const res = UrlFetchApp.fetch(api(method), {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true,
  });
  const out = JSON.parse(res.getContentText());
  if (!out.ok && method === 'sendMessage') throw new Error(out.description);
  return out.result;
}

function api(method) {
  const token = props().getProperty('TELEGRAM_TOKEN');
  if (!token) throw new Error('Добавьте TELEGRAM_TOKEN в свойства скрипта');
  return 'https://api.telegram.org/bot' + token + '/' + method;
}

function props() { return PropertiesService.getScriptProperties(); }

function today() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'); }

function clean(v) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, MAX_LEN);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
