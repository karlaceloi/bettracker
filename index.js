const functions = require(“firebase-functions”);
const https = require(“https”);

// Cole sua Anthropic API key aqui (a nova que você gerou após regenerar)
const ANTHROPIC_KEY = “COLE_SUA_ANTHROPIC_KEY_AQUI”;

exports.askAI = functions.https.onRequest((req, res) => {
// Permite chamadas do seu domínio GitHub Pages
res.set(“Access-Control-Allow-Origin”, “*”);
res.set(“Access-Control-Allow-Methods”, “POST, OPTIONS”);
res.set(“Access-Control-Allow-Headers”, “Content-Type”);

if (req.method === “OPTIONS”) {
res.status(204).send(””);
return;
}

if (req.method !== “POST”) {
res.status(405).send(“Method Not Allowed”);
return;
}

const { prompt } = req.body;
if (!prompt) {
res.status(400).json({ error: “prompt is required” });
return;
}

const payload = JSON.stringify({
model: “claude-sonnet-4-20250514”,
max_tokens: 3000,
messages: [{ role: “user”, content: prompt }]
});

const options = {
hostname: “api.anthropic.com”,
path: “/v1/messages”,
method: “POST”,
headers: {
“Content-Type”: “application/json”,
“x-api-key”: ANTHROPIC_KEY,
“anthropic-version”: “2023-06-01”,
“Content-Length”: Buffer.byteLength(payload)
}
};

const apiReq = https.request(options, (apiRes) => {
let data = “”;
apiRes.on(“data”, chunk => { data += chunk; });
apiRes.on(“end”, () => {
try {
const parsed = JSON.parse(data);
const text = (parsed.content || []).map(i => i.text || “”).join(””);
const clean = text.replace(/`json[\s\S]*?`|```/g, “”).trim();
const result = JSON.parse(clean);
res.status(200).json(result);
} catch (e) {
res.status(500).json({ error: “Parse error”, detail: e.message });
}
});
});

apiReq.on(“error”, (e) => {
res.status(500).json({ error: “API error”, detail: e.message });
});

apiReq.write(payload);
apiReq.end();
});
