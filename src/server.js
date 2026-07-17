const http = require("http");
const { randomBytes, randomUUID } = require("crypto");

const service = "orders";
const resourcePath = "/orders";
const idField = "orderId";
let items = [{"orderId":"ord-101","status":"pending","customerId":"cus-101","total":149.99,"currency":"USD","lineItemCount":3,"createdAt":"2026-07-16T20:00:00Z","updatedAt":"2026-07-16T20:00:00Z"}];

function send(res, status, body) {
  const headers = { "Content-Type": "application/json", "X-Request-Id": `req-${randomUUID()}` };
  res.writeHead(status, headers);
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => { raw += chunk; });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (error) { reject(error); }
    });
    req.on("error", reject);
  });
}

function outboundTraceparent(inbound) {
  const match = String(inbound || "").match(/^([0-9a-f]{2})-([0-9a-f]{32})-[0-9a-f]{16}-([0-9a-f]{2})$/i);
  const version = match ? match[1] : "00";
  const traceId = match ? match[2] : randomBytes(16).toString("hex");
  const flags = match ? match[3] : "01";
  return `${version}-${traceId}-${randomBytes(8).toString("hex")}-${flags}`;
}

function callDependency(url, traceparent) {
  return new Promise(resolve => {
    const request = http.get(url, { headers: { traceparent } }, response => {
      response.resume();
      response.on("end", resolve);
    });
    request.setTimeout(1000, () => request.destroy());
    request.on("error", resolve);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/health" && req.method === "GET") return send(res, 200, { status: "ok", service, version: "1.0.0" });

  if (url.pathname === resourcePath && req.method === "GET") {
    const traceparent = outboundTraceparent(req.headers.traceparent);
    await Promise.allSettled([
      callDependency("http://demo-fresh-inventory-api/products", traceparent),
      callDependency("http://demo-fresh-payments-api/transactions", traceparent),
      callDependency("http://demo-fresh-recommendations-api/recommendations", traceparent),
      callDependency("http://demo-fresh-shipping-api/shipments", traceparent)
    ]);
    const status = url.searchParams.get("status");
    const data = status ? items.filter(item => item.status === status) : items;
    return send(res, 200, { data, meta: { limit: 20, count: data.length, nextCursor: null } });
  }

  if (url.pathname === resourcePath && req.method === "POST") {
    try {
      const input = await readJson(req);
      const now = new Date().toISOString();
      const created = { [idField]: `ord-${Date.now()}`, status: "pending", ...input, createdAt: now, updatedAt: now };
      items.push(created);
      return send(res, 201, created);
    } catch (error) { return send(res, 400, { code: "invalid_json", message: error.message, requestId: `req-${randomUUID()}` }); }
  }

  const match = url.pathname.match(new RegExp(`^${resourcePath}/([^/]+)$`));
  if (match) {
    const index = items.findIndex(item => item[idField] === decodeURIComponent(match[1]));
    if (index < 0) return send(res, 404, { code: "not_found", message: "The requested resource was not found", requestId: `req-${randomUUID()}` });
    if (req.method === "GET") return send(res, 200, items[index]);
    if (req.method === "PATCH") {
      try {
        const input = await readJson(req);
        items[index] = { ...items[index], ...input, [idField]: items[index][idField], updatedAt: new Date().toISOString() };
        return send(res, 200, items[index]);
      } catch (error) { return send(res, 400, { code: "invalid_json", message: error.message, requestId: `req-${randomUUID()}` }); }
    }
    if (req.method === "DELETE") { items.splice(index, 1); res.writeHead(204); return res.end(); }
  }

  return send(res, 404, { code: "not_found", message: "The requested route was not found", requestId: `req-${randomUUID()}` });
});

server.listen(Number(process.env.PORT || 3000), () => console.log(`${service} listening`));
