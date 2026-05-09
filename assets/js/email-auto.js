// email-auto.js — Автоматическая отправка email-уведомлений после регистрации
// Без плагинов и WordPress, только JS + внешний SMTP API (например, https://smtpjs.com/ или любой REST SMTP)

// Конфиг SMTP API (пример для smtpjs.com)
const SMTP_CONFIG = {
  SecureToken: "ВАШ_SMTPJS_SECURE_TOKEN", // получите на smtpjs.com
  To: "",
  From: "noreply@davronmarket.com",
  Subject: "",
  Body: ""
};

// Отправка email через SMTP API
function sendEmail(to, subject, body) {
  const payload = { ...SMTP_CONFIG, To: to, Subject: subject, Body: body };
  return fetch("https://smtpjs.com/v3/smtpjs.aspx?", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then(r => r.text());
}

// Вызов после успешной регистрации пользователя
function notifyAfterRegister(user) {
  // 1. Уведомление владельцу
  sendEmail(
    "owner@davronmarket.com",
    "🆕 Новый пользователь на DavronMarket",
    `Пользователь зарегистрирован: <br>Имя: ${user.name}<br>Email: ${user.email}<br>Телефон: ${user.phone}`
  );
  // 2. Уведомление самому пользователю
  sendEmail(
    user.email,
    "Добро пожаловать на DavronMarket!",
    `Здравствуйте, ${user.name}!<br>Вы успешно зарегистрировались на DavronMarket.<br>Спасибо за выбор нашего сервиса.`
  );
}

// Пример интеграции: вызовите notifyAfterRegister(user) после регистрации
// Пример:
// Auth.register(...).then(res => { if(res.ok) notifyAfterRegister(res.user); });

// Для интеграции: импортируйте этот файл в engine.js и вызовите notifyAfterRegister(user) после успешной регистрации.
