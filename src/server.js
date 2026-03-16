const http = require("http");

const server = http.createServer((req, res) => {
  if (req.url === "/orders" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify([{ id: "ord-101", status: "pending" }]));
    return;
  }

  if (req.url === "/orders" && req.method === "POST") {
    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ created: true }));
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(3000);
