const http = require('http');

const serverUrl = 'https://ews-tgbot.onrender.com';

function keepServerAwake() {
  setInterval(() => {
    http.get(serverUrl);
    console.log(serverUrl);
  }, 300);
}

keepServerAwake()