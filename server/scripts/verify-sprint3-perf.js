const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const PERF_DB = process.env.PERF_DB_NAME || "room_rental_perf";
assert.notEqual(PERF_DB, "room_rental_dev", "Benchmark verification must not run against room_rental_dev!");
process.env.MONGODB_DB_NAME = PERF_DB;
process.env.UPLOAD_DIR = process.env.PERF_UPLOAD_DIR || "uploads-perf";

const { getCollections, closeDb } = require("../src/db/mongo");

const SERVER_ROOT = path.resolve(__dirname, "..");
const CLIENT_DIST = path.resolve(__dirname, "../../client/dist");
const API_PORT = Number(process.env.PERF_API_PORT || 3101);
const WEB_PORT = Number(process.env.PERF_WEB_PORT || 4173);

const MIME_BY_EXT = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".json": "application/json; charset=utf-8",
};

function findChromiumExecutable() {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
  const root = path.join(localAppData, "ms-playwright");
  if (fs.existsSync(root)) {
    const dirs = fs.readdirSync(root);
    for (const prefix of ["chromium_headless_shell-", "chromium-"]) {
      const match = dirs.find((name) => name.startsWith(prefix));
      if (!match) continue;
      const candidate = prefix.startsWith("chromium_headless_shell")
        ? path.join(root, match, "chrome-headless-shell-win64", "chrome-headless-shell.exe")
        : path.join(root, match, "chrome-win64", "chrome.exe");
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  if (fs.existsSync(edge)) return edge;
  throw new Error("Could not find Chromium or Edge executable for CDP benchmark.");
}

function getWinningPlanStages(plan, stages = []) {
  if (!plan || typeof plan !== "object") return stages;
  if (plan.stage) stages.push(plan.stage);
  if (plan.inputStage) getWinningPlanStages(plan.inputStage, stages);
  if (Array.isArray(plan.inputStages)) {
    plan.inputStages.forEach((child) => getWinningPlanStages(child, stages));
  }
  if (plan.queryPlan) getWinningPlanStages(plan.queryPlan, stages);
  if (plan.winningPlan) getWinningPlanStages(plan.winningPlan, stages);
  return stages;
}

async function startPerfBackend() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["src/server.js"], {
      cwd: SERVER_ROOT,
      env: {
        ...process.env,
        PORT: String(API_PORT),
        HOST: "127.0.0.1",
        MONGODB_DB_NAME: PERF_DB,
        UPLOAD_DIR: process.env.PERF_UPLOAD_DIR || "uploads-perf",
        CLIENT_ORIGIN: `http://127.0.0.1:${WEB_PORT}`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    const timer = setTimeout(() => reject(new Error(`Perf backend startup timeout: ${stderr}`)), 10000);
    child.stdout.on("data", (chunk) => {
      if (String(chunk).includes(`127.0.0.1:${API_PORT}`)) {
        clearTimeout(timer);
        resolve(child);
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("exit", (code) => {
      if (code !== null && code !== 0) {
        clearTimeout(timer);
        reject(new Error(`Perf backend exited with code ${code}: ${stderr}`));
      }
    });
  });
}

function startStaticAndProxyServer() {
  const server = http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url, `http://127.0.0.1:${WEB_PORT}`);

    if (reqUrl.pathname.startsWith("/api/")) {
      try {
        const targetUrl = `http://127.0.0.1:${API_PORT}${reqUrl.pathname}${reqUrl.search}`;
        const forwardHeaders = {};
        if (req.headers["if-none-match"]) forwardHeaders["if-none-match"] = req.headers["if-none-match"];
        if (req.headers.accept) forwardHeaders.accept = req.headers.accept;
        const upstream = await fetch(targetUrl, { method: req.method, headers: forwardHeaders });
        const body = Buffer.from(await upstream.arrayBuffer());
        const outHeaders = {};
        upstream.headers.forEach((value, key) => {
          if (key !== "transfer-encoding" && key !== "connection") {
            outHeaders[key] = value;
          }
        });
        res.writeHead(upstream.status, outHeaders);
        res.end(body);
      } catch {
        if (!res.headersSent) {
          res.writeHead(502);
          res.end("Upstream unavailable");
        }
      }
      return;
    }

    const decodedPath = decodeURIComponent(reqUrl.pathname);
    let candidate = path.resolve(CLIENT_DIST, `.${decodedPath}`);
    if (!candidate.startsWith(CLIENT_DIST)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    let stat = await fsp.stat(candidate).catch(() => null);
    if (!stat || stat.isDirectory()) {
      candidate = path.join(CLIENT_DIST, "index.html");
      stat = await fsp.stat(candidate);
    }

    const ext = path.extname(candidate).toLowerCase();
    const content = await fsp.readFile(candidate);
    res.writeHead(200, {
      "Content-Type": MIME_BY_EXT[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600",
    });
    res.end(content);
  });

  return new Promise((resolve) => {
    server.listen(WEB_PORT, "127.0.0.1", () => resolve(server));
  });
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.id) {
        const waiter = this.pending.get(msg.id);
        if (waiter) {
          this.pending.delete(msg.id);
          if (msg.error) waiter.reject(new Error(`${msg.error.code}: ${msg.error.message}`));
          else waiter.resolve(msg.result);
        }
      } else if (msg.method) {
        const handlers = this.listeners.get(msg.method) || [];
        handlers.forEach((fn) => fn(msg.params));
      }
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
    });
  }

  on(method, fn) {
    const list = this.listeners.get(method) || [];
    list.push(fn);
    this.listeners.set(method, list);
  }

  close() {
    this.ws.close();
  }
}

async function launchChromiumCdp(executablePath) {
  const userDataDir = await fsp.mkdtemp(path.join(os.tmpdir(), "s3-cdp-"));
  const proc = spawn(
    executablePath,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--remote-debugging-port=0",
      `--user-data-dir=${userDataDir}`,
      "about:blank",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  const wsUrl = await new Promise((resolve, reject) => {
    let logs = "";
    const timeout = setTimeout(() => reject(new Error(`Browser DevTools URL timeout: ${logs}`)), 10000);
    const onData = (chunk) => {
      logs += String(chunk);
      const match = logs.match(/DevTools listening on (ws:\/\/[^\r\n]+)/i);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1].trim());
      }
    };
    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
  });

  const cdp = new CdpClient(wsUrl);
  await cdp.connect();
  const { targetInfos } = await cdp.send("Target.getTargets");
  let pageTarget = targetInfos.find((t) => t.type === "page");
  if (!pageTarget) {
    const created = await cdp.send("Target.createTarget", { url: "about:blank" });
    pageTarget = { targetId: created.targetId };
  }
  const { sessionId } = await cdp.send("Target.attachToTarget", {
    targetId: pageTarget.targetId,
    flatten: true,
  });

  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("Network.enable", {}, sessionId);

  const consoleErrors = [];
  cdp.on("Runtime.exceptionThrown", (params) => {
    consoleErrors.push(params.exceptionDetails?.text || "Runtime exception");
  });
  cdp.on("Runtime.consoleAPICalled", (params) => {
    if (params.type === "error") {
      const text = (params.args || []).map((a) => a.value || a.description || "").join(" ");
      if (!text.includes("ERR_INTERNET_DISCONNECTED") && !text.includes("Failed to load resource")) {
        consoleErrors.push(text || "console.error");
      }
    }
  });

  return {
    cdp,
    sessionId,
    consoleErrors,
    async eval(expression) {
      const res = await cdp.send(
        "Runtime.evaluate",
        { expression, awaitPromise: true, returnByValue: true },
        sessionId,
      );
      if (res.exceptionDetails) {
        throw new Error(`Browser eval error: ${res.exceptionDetails.text}`);
      }
      return res.result?.value;
    },
    async screenshot(filePath) {
      if (!filePath) return;
      const { data } = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
      await fsp.mkdir(path.dirname(filePath), { recursive: true });
      await fsp.writeFile(filePath, Buffer.from(data, "base64"));
    },
    async close() {
      cdp.close();
      proc.kill();
      await fsp.rm(userDataDir, { recursive: true, force: true }).catch(() => {});
    },
  };
}

function percentile75(sortedAsc) {
  const idx = Math.ceil(0.75 * sortedAsc.length) - 1;
  return sortedAsc[Math.max(0, Math.min(sortedAsc.length - 1, idx))];
}

async function runApiAndExplainChecks(apiBase) {
  const { roomListings } = await getCollections();
  const count500 = await roomListings.countDocuments({ publishStatus: "PUBLISHED", deletedAt: null });
  assert.equal(count500, 500, `Expected 500 PUBLISHED rooms in ${PERF_DB}, got ${count500}`);

  // 1. Kiểm tra .explain("executionStats") tránh COLLSCAN trên các bộ lọc chính
  const explainChecks = [
    {
      name: "ward_2026_exact",
      filter: { publishStatus: "PUBLISHED", deletedAt: null, ward: "Phường Gia Định" },
    },
    {
      name: "type_and_price",
      filter: { publishStatus: "PUBLISHED", deletedAt: null, roomType: "Phòng studio", priceVnd: { $gte: 2500000, $lte: 5500000 } },
    },
    {
      name: "area_range",
      filter: { publishStatus: "PUBLISHED", deletedAt: null, areaM2: { $gte: 18, $lte: 32 } },
    },
    {
      name: "amenities_all",
      filter: { publishStatus: "PUBLISHED", deletedAt: null, amenities: { $all: ["Máy lạnh", "Thang máy"] } },
    },
  ];

  const explainSummary = [];
  for (const check of explainChecks) {
    const exp = await roomListings.find(check.filter).explain("executionStats");
    const stages = getWinningPlanStages(exp.queryPlanner?.winningPlan);
    assert.ok(stages.includes("IXSCAN"), `Query ${check.name} must use IXSCAN, got stages: ${stages.join(" -> ")}`);
    assert.ok(!stages.includes("COLLSCAN"), `Query ${check.name} must NOT perform COLLSCAN`);
    explainSummary.push(`${check.name}: ${stages.join("->")} (examined ${exp.executionStats.totalDocsExamined} docs / ${exp.executionStats.nReturned} returned)`);
  }

  // 2. Kiểm tra API /categories, amenities filter & ETag / 304
  const catRes = await fetch(`${apiBase}/public/categories`);
  assert.equal(catRes.status, 200);
  const cats = await catRes.json();
  assert.ok(cats.amenities.includes("Thang máy") && !cats.amenities.includes("Máy giặt"));
  assert.equal(cats.wards.length, 5);

  const listAllRes = await fetch(`${apiBase}/public/rooms`);
  assert.equal(listAllRes.status, 200);
  const listAll = await listAllRes.json();
  assert.equal(listAll.totalItems, 500, "Must expose 500 PUBLISHED rooms and hide 10 non-public records");

  const multiFilterRes = await fetch(
    `${apiBase}/public/rooms?ward=${encodeURIComponent("Phường Bình Lợi Trung")}&amenities=${encodeURIComponent("Máy lạnh,Thang máy")}&minPriceVnd=2200000&maxPriceVnd=6500000&minAreaM2=18`,
  );
  assert.equal(multiFilterRes.status, 200);
  const multiFilter = await multiFilterRes.json();
  assert.ok(multiFilter.totalItems > 0);
  assert.ok(
    multiFilter.items.every(
      (item) =>
        item.ward === "Phường Bình Lợi Trung" &&
        item.amenities.includes("Máy lạnh") &&
        item.amenities.includes("Thang máy") &&
        item.priceVnd >= 2200000 &&
        item.priceVnd <= 6500000 &&
        item.areaM2 >= 18,
    ),
  );

  const invalidAmenity = await fetch(`${apiBase}/public/rooms?amenities=${encodeURIComponent("Máy giặt")}`);
  assert.equal(invalidAmenity.status, 400);
  const invalidJson = await invalidAmenity.json();
  assert.equal(invalidJson.error.code, "INVALID_QUERY");
  assert.ok(invalidJson.error.fieldErrors.amenities);

  // ETag + 304 Not Modified check
  const sampleImageUrl = listAll.items[0].coverImageUrl.replace(/^\/api\/v1/, "");
  const img1 = await fetch(`${apiBase}${sampleImageUrl}`);
  assert.equal(img1.status, 200);
  const etag = img1.headers.get("etag");
  assert.ok(etag, "Image stream response must include ETag header");
  assert.match(img1.headers.get("cache-control") || "", /max-age=60/);
  const img304 = await fetch(`${apiBase}${sampleImageUrl}`, { headers: { "If-None-Match": etag } });
  assert.equal(img304.status, 304, "Matching If-None-Match must return 304 Not Modified");

  // 3. Đo API latency (20 calls)
  const apiTimings = [];
  for (let i = 0; i < 20; i += 1) {
    const t0 = performance.now();
    const res = await fetch(`${apiBase}/public/rooms?page=${(i % 5) + 1}&ward=${encodeURIComponent("Phường Gia Định")}`);
    await res.json();
    apiTimings.push(performance.now() - t0);
  }
  apiTimings.sort((a, b) => a - b);
  const apiP75 = percentile75(apiTimings);

  return { explainSummary, apiP75: Number(apiP75.toFixed(1)) };
}

async function runBrowser4gBenchmarkAndUiChecks() {
  const executablePath = findChromiumExecutable();
  const browser = await launchChromiumCdp(executablePath);
  const { cdp, sessionId } = browser;

  try {
    // Thiết bị di động đại diện 360x800 + mạng 4G nhất quán (latency 70ms, 4 Mbps down, 1.5 Mbps up)
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: 360, height: 800, deviceScaleFactor: 2, mobile: true },
      sessionId,
    );
    await cdp.send(
      "Network.emulateNetworkConditions",
      {
        offline: false,
        latency: 70,
        downloadThroughput: Math.round((4 * 1024 * 1024) / 8),
        uploadThroughput: Math.round((1.5 * 1024 * 1024) / 8),
        connectionType: "cellular4g",
      },
      sessionId,
    );

    const observerScript = `
      window.__s3Perf = { lcp: 0, fcp: 0, cls: 0 };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            window.__s3Perf.lcp = entry.startTime;
          }
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            window.__s3Perf.fcp = entry.startTime;
          }
          if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            window.__s3Perf.cls += entry.value;
          }
        }
      }).observe({ entryTypes: ['largest-contentful-paint', 'paint', 'layout-shift'] });
    `;
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: observerScript }, sessionId);

    const runs = [];
    for (let run = 1; run <= 5; run += 1) {
      await cdp.send("Network.clearBrowserCache", {}, sessionId);
      await cdp.send("Network.clearBrowserCookies", {}, sessionId);

      const t0 = performance.now();
      await cdp.send("Page.navigate", { url: `http://127.0.0.1:${WEB_PORT}/rooms` }, sessionId);

      // Đợi đủ 12 thẻ phòng + 3 ảnh đầu hoàn tất decode
      await browser.eval(`
        new Promise((resolve, reject) => {
          const started = performance.now();
          const tick = () => {
            const cards = document.querySelectorAll('.public-room-card');
            const imgs = Array.from(document.querySelectorAll('.public-room-card img')).slice(0, 3);
            const imgsReady = imgs.length === 3 && imgs.every((img) => img.complete && img.naturalWidth > 0);
            if (cards.length === 12 && imgsReady) {
              requestAnimationFrame(() => setTimeout(resolve, 60));
              return;
            }
            if (performance.now() - started > 15000) {
              reject(new Error('Timeout waiting for initial catalog render'));
              return;
            }
            setTimeout(tick, 30);
          };
          tick();
        })
      `);
      const mainReadyMs = performance.now() - t0;

      const metrics = await browser.eval(`
        (() => {
          const nav = performance.getEntriesByType('navigation')[0];
          const scrollOverflow = document.documentElement.scrollWidth > window.innerWidth;
          return {
            fcp: window.__s3Perf.fcp || 0,
            lcp: window.__s3Perf.lcp || 0,
            cls: Number((window.__s3Perf.cls || 0).toFixed(4)),
            ttfb: nav ? nav.responseStart : 0,
            scrollOverflow,
          };
        })()
      `);
      assert.equal(metrics.scrollOverflow, false, `Mobile 360px horizontal overflow detected on run ${run}`);

      runs.push({
        run,
        mainReadyMs: Number(mainReadyMs.toFixed(1)),
        lcpMs: Number((metrics.lcp || mainReadyMs).toFixed(1)),
        fcpMs: Number((metrics.fcp || 0).toFixed(1)),
        cls: metrics.cls,
      });
    }

    const sortedReady = [...runs].map((r) => r.mainReadyMs).sort((a, b) => a - b);
    const p75ReadyMs = percentile75(sortedReady);
    const maxCls = Math.max(...runs.map((r) => r.cls));

    assert.ok(p75ReadyMs <= 3000, `NFR-13/AT-40 FAILED: p75=${p75ReadyMs}ms > 3000ms`);
    assert.ok(maxCls < 0.1, `CLS FAILED: maxCls=${maxCls} >= 0.1`);

    // Kiểm tra tương tác bộ lọc nâng cao trên mobile (mở MobileFilterDrawer, chọn Thang máy, Áp dụng, chuyển trang 2 giữ filter)
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    }, sessionId);

    await browser.eval(`
      (() => {
        const filterBtn = Array.from(document.querySelectorAll('.mobile-filter-actions button'))
          .find((b) => b.textContent.includes('Bộ lọc'));
        if (!filterBtn) throw new Error('Mobile filter button missing');
        filterBtn.click();
      })()
    `);

    await browser.eval(`
      new Promise((resolve, reject) => {
        const started = performance.now();
        const waitOpen = () => {
          const drawer = document.querySelector('.filter-drawer');
          if (drawer) {
            const elevatorBtn = Array.from(drawer.querySelectorAll('.filter-chip'))
              .find((b) => b.textContent.trim() === 'Thang máy');
            if (!elevatorBtn) {
              reject(new Error('Thang máy filter chip missing in drawer'));
              return;
            }
            elevatorBtn.click();
            const waitCommitted = () => {
              if (elevatorBtn.classList.contains('is-active')) {
                resolve();
                return;
              }
              if (performance.now() - started > 3000) {
                reject(new Error('Timeout waiting for Thang máy chip active state'));
                return;
              }
              setTimeout(waitCommitted, 20);
            };
            setTimeout(waitCommitted, 20);
            return;
          }
          if (performance.now() - started > 3000) {
            reject(new Error('MobileFilterDrawer did not open'));
            return;
          }
          setTimeout(waitOpen, 20);
        };
        waitOpen();
      })
    `);

    const screenshotDir = process.env.PERF_SCREENSHOT_DIR || "";
    if (screenshotDir) {
      await browser.screenshot(path.join(screenshotDir, "s3-mobile-drawer.png"));
    }

    await browser.eval(`
      (() => {
        const applyBtn = document.querySelector('.filter-drawer button[type="submit"]');
        if (!applyBtn) throw new Error('Drawer submit button missing');
        applyBtn.click();
      })()
    `);

    await browser.eval(`
      new Promise((resolve, reject) => {
        const started = performance.now();
        const tick = () => {
          if (
            window.location.search.includes('amenities=') &&
            document.querySelectorAll('.active-chip').length > 0 &&
            document.querySelectorAll('.public-room-card').length > 0
          ) {
            resolve();
            return;
          }
          if (performance.now() - started > 5000) {
            reject(new Error('Timeout waiting for Thang máy filtered results'));
            return;
          }
          setTimeout(tick, 30);
        };
        tick();
      })
    `);

    // Chuyển trang 2 & xác nhận URL giữ nguyên amenities (AT-18)
    await browser.eval(`
      (() => {
        const page2 = Array.from(document.querySelectorAll('.page-num-btn'))
          .find((b) => b.textContent.trim() === '2');
        if (!page2) throw new Error('Expected page 2 for Thang máy results');
        page2.click();
      })()
    `);

    await browser.eval(`
      new Promise((resolve, reject) => {
        const started = performance.now();
        const tick = () => {
          if (window.location.search.includes('page=2') && window.location.search.includes('amenities=')) {
            resolve();
            return;
          }
          if (performance.now() - started > 5000) {
            reject(new Error('Pagination dropped amenities filter (AT-18)'));
            return;
          }
          setTimeout(tick, 30);
        };
        tick();
      })
    `);

    // Kiểm tra Desktop 1280x800: Lọc nâng cao + Thang máy + Chi tiết -> Quay lại giữ filter + Lỗi mạng Thử lại
    await cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false },
      sessionId,
    );
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${WEB_PORT}/rooms` }, sessionId);
    await browser.eval(`
      new Promise((resolve, reject) => {
        const started = performance.now();
        const tick = () => {
          if (document.querySelectorAll('.public-room-card').length === 12) {
            resolve();
            return;
          }
          if (performance.now() - started > 5000) {
            reject(new Error('Timeout waiting desktop rooms load'));
            return;
          }
          setTimeout(tick, 30);
        };
        tick();
      })
    `);

    const desktopOverflow = await browser.eval("document.documentElement.scrollWidth > window.innerWidth");
    assert.equal(desktopOverflow, false, "Desktop 1280px horizontal overflow detected");

    // Mở panel Lọc nâng cao và chọn Thang máy
    await browser.eval(`
      (() => {
        const advBtn = Array.from(document.querySelectorAll('.filter-primary-row button'))
          .find((b) => b.textContent.includes('Lọc nâng cao'));
        if (!advBtn) throw new Error('Advanced filter button missing on desktop');
        advBtn.click();
      })()
    `);
    await browser.eval(`
      new Promise((resolve, reject) => {
        setTimeout(() => {
          const panel = document.querySelector('.advanced-filter-panel');
          if (!panel) return reject(new Error('Advanced filter panel did not open'));
          const labels = Array.from(panel.querySelectorAll('.amenity-filter-grid .filter-chip')).map((b) => b.textContent.trim());
          if (!labels.includes('Thang máy') || labels.includes('Máy giặt')) {
            return reject(new Error('Amenity chips mismatch: ' + labels.join(', ')));
          }
          const elevatorBtn = Array.from(panel.querySelectorAll('.amenity-filter-grid .filter-chip'))
            .find((b) => b.textContent.trim() === 'Thang máy');
          elevatorBtn.click();
          resolve();
        }, 60);
      })
    `);
    await browser.eval(`
      new Promise((resolve, reject) => {
        const started = performance.now();
        const tick = () => {
          const chips = Array.from(document.querySelectorAll('.active-chip')).map((c) => c.textContent);
          if (window.location.search.includes('amenities=') && chips.some((c) => c.includes('Thang máy'))) {
            resolve();
            return;
          }
          if (performance.now() - started > 5000) {
            reject(new Error('Desktop Thang máy filter failed to update active chips/URL'));
            return;
          }
          setTimeout(tick, 30);
        };
        tick();
      })
    `);
    if (screenshotDir) {
      await new Promise((resolve) => setTimeout(resolve, 220));
      await browser.screenshot(path.join(screenshotDir, "s3-desktop-filters.png"));
    }

    // Vào chi tiết phòng -> bấm Quay lại danh sách phòng -> xác nhận giữ nguyên amenities
    await browser.eval("document.querySelector('.public-room-card .card-detail-cta').click()");
    await browser.eval(`
      new Promise((resolve, reject) => {
        const started = performance.now();
        const tick = () => {
          if (window.location.pathname.startsWith('/rooms/') && document.querySelector('.detail-summary-card h1')) {
            resolve();
            return;
          }
          if (performance.now() - started > 5000) {
            reject(new Error('Timeout opening room detail'));
            return;
          }
          setTimeout(tick, 30);
        };
        tick();
      })
    `);
    await browser.eval("document.querySelector('.detail-breadcrumb .back-link').click()");
    await browser.eval(`
      new Promise((resolve, reject) => {
        const started = performance.now();
        const tick = () => {
          if (window.location.pathname === '/rooms' && window.location.search.includes('amenities=')) {
            resolve();
            return;
          }
          if (performance.now() - started > 5000) {
            reject(new Error('Back navigation lost amenities filter (AT-18)'));
            return;
          }
          setTimeout(tick, 30);
        };
        tick();
      })
    `);

    // Kiểm tra trạng thái lỗi mạng + nút Thử lại giữ nguyên filter trên URL (NFR-05, AT-10)
    await cdp.send("Network.emulateNetworkConditions", {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    }, sessionId);
    await browser.eval(`
      (() => {
        const chipBtn = Array.from(document.querySelectorAll('.quick-price-chips .filter-chip'))
          .find((b) => b.textContent.includes('3,5 – 5 triệu'));
        if (!chipBtn) throw new Error('Quick price chip missing');
        chipBtn.click();
      })()
    `);
    await browser.eval(`
      new Promise((resolve, reject) => {
        const started = performance.now();
        const tick = () => {
          const alertEl = document.querySelector('.empty-state[role="alert"]');
          if (alertEl && alertEl.textContent.includes('Thử lại')) {
            resolve();
            return;
          }
          if (performance.now() - started > 5000) {
            reject(new Error('Offline network error recovery UI did not appear'));
            return;
          }
          setTimeout(tick, 30);
        };
        tick();
      })
    `);
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    }, sessionId);
    await browser.eval(`
      (() => {
        const retryBtn = Array.from(document.querySelectorAll('.empty-state[role="alert"] button'))
          .find((b) => b.textContent.includes('Thử lại'));
        retryBtn.click();
      })()
    `);
    await browser.eval(`
      new Promise((resolve, reject) => {
        const started = performance.now();
        const tick = () => {
          if (
            document.querySelectorAll('.public-room-card').length > 0 &&
            window.location.search.includes('amenities=') &&
            window.location.search.includes('minPriceVnd=3500000')
          ) {
            resolve();
            return;
          }
          if (performance.now() - started > 5000) {
            reject(new Error('Retry button did not recover filtered results'));
            return;
          }
          setTimeout(tick, 30);
        };
        tick();
      })
    `);

    assert.equal(browser.consoleErrors.length, 0, `Unexpected browser console/runtime errors: ${browser.consoleErrors.join(" | ")}`);

    return { runs, p75ReadyMs, maxCls };
  } finally {
    await browser.close();
  }
}

async function main() {
  assert.ok(fs.existsSync(path.join(CLIENT_DIST, "index.html")), "Run client build before verify-sprint3-perf.js");

  const backendProc = await startPerfBackend();
  const webServer = await startStaticAndProxyServer();

  try {
    const apiBase = `http://127.0.0.1:${API_PORT}/api/v1`;
    const apiResult = await runApiAndExplainChecks(apiBase);
    const browserResult = await runBrowser4gBenchmarkAndUiChecks();

    console.log("SPRINT_3_PERF_AND_FILTER_VERIFICATION_PASSED");
    console.log(` - DB: ${PERF_DB} (500 PUBLISHED + 10 non-public isolated)`);
    console.log(` - Explain Plans:\n     * ${apiResult.explainSummary.join("\n     * ")}`);
    console.log(` - API /public/rooms p75 latency (20 calls): ${apiResult.apiP75} ms`);
    console.log(" - Mobile 360x800 @ 4G (70ms RTT, 4 Mbps down / 1.5 Mbps up) — 5 Cold Runs:");
    browserResult.runs.forEach((r) => {
      console.log(`     * Run ${r.run}: mainReady=${r.mainReadyMs} ms, LCP=${r.lcpMs} ms, FCP=${r.fcpMs} ms, CLS=${r.cls}`);
    });
    console.log(` - RESULT p75=${browserResult.p75ReadyMs} ms (<= 3000 ms PASS), maxCLS=${browserResult.maxCls} (< 0.1 PASS)`);
    console.log(" - UI Filter Flow: MobileFilterDrawer 'Thang máy' + Desktop Lọc nâng cao + Back nav URL preserved + Offline Retry PASS (0 console errors)");
  } finally {
    webServer.closeAllConnections?.();
    await new Promise((resolve) => webServer.close(resolve));
    backendProc.kill();
    await closeDb();
  }
}

main().catch((error) => {
  console.error("Sprint 3 verification failed:", error);
  process.exitCode = 1;
});
