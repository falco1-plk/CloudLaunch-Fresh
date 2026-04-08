const http = require("http");

http.createServer((req, res) => {
  res.end("CloudLaunch CI/CD Pipeline is LIVE 🚀");
}).listen(3000);
