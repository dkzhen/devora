// test.js
fetch("https://api.telegram.org/bot/getMe")
  .then(r => r.text())
  .then(console.log)
  .catch(err => console.error("ERROR:", err));