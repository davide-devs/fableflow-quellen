import http from "node:http";
import os from "node:os";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function lanIpv4s() {
  try {
    const out = [];
    for (const addrs of Object.values(os.networkInterfaces())) {
      if (!addrs) continue;
      for (const a of addrs) {
        const v4 = a.family === "IPv4" || a.family === 4;
        if (v4 && !a.internal) out.push(a.address);
      }
    }
    return out;
  } catch {
    // If network interface lookup fails, keep localhost server running.
    return [];
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// "::" akzeptiert IPv6 und (typischerweise) auch IPv4 — wichtig, weil
// Browser "localhost" oft zuerst als ::1 aufloesen.
const host = process.env.HOST || "::";
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = http.createServer(async (req, res) => {
  try {
    const requestPath = req.url === "/" ? "/index.html" : req.url;
    const normalizedPath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(rootDir, normalizedPath);
    const ext = path.extname(filePath).toLowerCase();

    const data = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream"
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
  }
});

server.listen({ port, host, ipv6Only: false }, () => {
  console.log(`Lokaler Server laeuft auf http://localhost:${port}`);
  console.log(`Alternativ: http://127.0.0.1:${port}`);
  const ips = lanIpv4s();
  if (ips.length) {
    console.log("Im selben WLAN vom Handy (nicht localhost):");
    for (const ip of ips) {
      console.log(`  http://${ip}:${port}`);
    }
  } else {
    console.log(
      "Keine LAN-IPv4 gefunden — am Handy die Mac-IP aus den Netzwerk-Einstellungen eintragen."
    );
  }
  console.log("Beenden mit Ctrl+C");
});
