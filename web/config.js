// ID проекта из кабинета VK Play. Не секрет. Укажите число вместо null.
// Пока ID отсутствует, игра работает в автономном тестовом режиме.
window.VKPLAY_CONFIG = Object.freeze({ gmrid: null, sdkTimeoutMs: 10000 });
// Serve web/ from the matchmaking server: leave endpoint empty for same-origin /online.
// Separate HTTPS hosting: set an explicit wss:// YOUR server /online URL.
window.ONLINE_CONFIG=Object.freeze({version:'0.6.1',endpoint:'',autoEndpoint:true,connectTimeoutMs:90000});
