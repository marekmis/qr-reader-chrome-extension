(() => {
  // Clicking the icon again while the overlay is open just restarts selection.
  if (window.__qrReader) {
    window.__qrReader.startSelection();
    return;
  }

  const host = document.createElement("div");
  host.style.cssText = "all: initial; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;";
  const root = host.attachShadow({ mode: "closed" });
  root.innerHTML = `
    <style>
      * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
      .overlay { position: fixed; inset: 0; cursor: crosshair; pointer-events: auto;
        background: rgba(0, 0, 0, 0.25); }
      .hint { position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
        background: #111; color: #fff; padding: 8px 14px; border-radius: 6px; font-size: 13px;
        pointer-events: none; box-shadow: 0 2px 10px rgba(0,0,0,.3); }
      .rect { position: fixed; border: 2px dashed #4f8cff; background: rgba(79, 140, 255, 0.12);
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.25); pointer-events: none; }
      .panel { position: fixed; top: 16px; right: 16px; width: 360px; max-width: calc(100vw - 32px);
        background: #fff; color: #111; border-radius: 10px; padding: 14px; pointer-events: auto;
        box-shadow: 0 8px 30px rgba(0,0,0,.25); font-size: 13px; }
      .panel h3 { margin: 0 0 8px; font-size: 14px; font-weight: 600; }
      .value { width: 100%; min-height: 60px; max-height: 200px; resize: vertical; padding: 8px;
        border: 1px solid #ccc; border-radius: 6px; font: 12px/1.4 ui-monospace, Consolas, monospace;
        color: #111; background: #f7f7f7; word-break: break-all; }
      .error { color: #b3261e; margin: 0 0 4px; }
      .buttons { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
      button, a.btn { border: 1px solid #ccc; background: #fff; color: #111; border-radius: 6px;
        padding: 6px 12px; font-size: 13px; cursor: pointer; text-decoration: none; }
      button.primary { background: #4f8cff; border-color: #4f8cff; color: #fff; }
      button:hover, a.btn:hover { filter: brightness(0.95); }
      @media (prefers-color-scheme: dark) {
        .panel { background: #1f1f1f; color: #eee; }
        .value { background: #2a2a2a; color: #eee; border-color: #444; }
        button, a.btn { background: #2a2a2a; color: #eee; border-color: #444; }
        .error { color: #ff8a80; }
      }
    </style>`;
  document.documentElement.appendChild(host);

  let overlay = null;
  let panel = null;

  function onKey(e) {
    if (e.key === "Escape") destroy();
  }
  document.addEventListener("keydown", onKey, true);

  function destroy() {
    document.removeEventListener("keydown", onKey, true);
    host.remove();
    delete window.__qrReader;
  }

  function startSelection() {
    panel?.remove();
    panel = null;
    overlay?.remove();

    overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML = `<div class="hint">Drag a rectangle around the QR code &middot; Esc to cancel</div>`;
    const rect = document.createElement("div");
    rect.className = "rect";
    rect.hidden = true;
    overlay.appendChild(rect);
    root.appendChild(overlay);

    let start = null;
    let box = null;

    overlay.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      start = { x: e.clientX, y: e.clientY };
      overlay.style.background = "transparent"; // the rect's box-shadow dims the rest
      rect.hidden = false;
      update(e);
    });

    overlay.addEventListener("mousemove", (e) => {
      if (start) update(e);
    });

    overlay.addEventListener("mouseup", async (e) => {
      if (!start) return;
      update(e);
      start = null;
      if (box.w < 10 || box.h < 10) {
        // Treat as an accidental click; let the user try again.
        rect.hidden = true;
        overlay.style.background = "";
        return;
      }
      overlay.remove();
      overlay = null;
      await decodeRegion(box);
    });

    function update(e) {
      const x = Math.min(start.x, e.clientX);
      const y = Math.min(start.y, e.clientY);
      box = { x, y, w: Math.abs(e.clientX - start.x), h: Math.abs(e.clientY - start.y) };
      Object.assign(rect.style, { left: x + "px", top: y + "px", width: box.w + "px", height: box.h + "px" });
    }
  }

  async function decodeRegion(box) {
    // Wait for the overlay removal to be painted so it isn't in the screenshot.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30))));

    let response;
    try {
      response = await chrome.runtime.sendMessage({ type: "qr-capture" });
    } catch (err) {
      response = { error: err.message };
    }
    if (!response || response.error) {
      showResult(null, "Could not capture the page: " + (response?.error || "unknown error"));
      return;
    }

    const img = await loadImage(response.dataUrl);
    // The screenshot is in device pixels; the box is in CSS pixels.
    const scale = img.width / window.innerWidth;

    // Try the exact selection first, then progressively larger margins in case
    // the rectangle was drawn tight and clipped the QR code's quiet zone.
    for (const pad of [0, 12, 30]) {
      const code = decodeCrop(img, box, scale, pad);
      if (code) {
        showResult(code.data);
        return;
      }
    }
    showResult(null, "No QR code found in the selected area. Try drawing a slightly larger rectangle.");
  }

  function decodeCrop(img, box, scale, pad) {
    const sx = Math.max(0, Math.round((box.x - pad) * scale));
    const sy = Math.max(0, Math.round((box.y - pad) * scale));
    const sw = Math.min(img.width - sx, Math.round((box.w + pad * 2) * scale));
    const sh = Math.min(img.height - sy, Math.round((box.h + pad * 2) * scale));
    if (sw <= 0 || sh <= 0) return null;

    // Upscale small crops a bit; jsQR struggles with tiny codes.
    const up = Math.max(1, Math.min(4, Math.ceil(300 / Math.min(sw, sh))));
    const canvas = document.createElement("canvas");
    canvas.width = sw * up;
    canvas.height = sh * up;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function isUrl(text) {
    try {
      const u = new URL(text);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  function showResult(value, error) {
    panel?.remove();
    panel = document.createElement("div");
    panel.className = "panel";

    const title = document.createElement("h3");
    title.textContent = value != null ? "QR code decoded" : "QR Reader";
    panel.appendChild(title);

    if (value != null) {
      const field = document.createElement("textarea");
      field.className = "value";
      field.readOnly = true;
      field.value = value;
      panel.appendChild(field);
    } else {
      const p = document.createElement("p");
      p.className = "error";
      p.textContent = error;
      panel.appendChild(p);
    }

    const buttons = document.createElement("div");
    buttons.className = "buttons";

    if (value != null) {
      const copy = button("Copy", "primary", async () => {
        await copyText(value);
        copy.textContent = "Copied!";
        setTimeout(() => (copy.textContent = "Copy"), 1500);
      });
      buttons.appendChild(copy);

      if (isUrl(value)) {
        const open = document.createElement("a");
        open.className = "btn";
        open.textContent = "Open link";
        open.href = value;
        open.target = "_blank";
        open.rel = "noopener noreferrer";
        buttons.appendChild(open);
      }
    }

    buttons.appendChild(button("Select again", "", startSelection));
    buttons.appendChild(button("Close", "", destroy));
    panel.appendChild(buttons);
    root.appendChild(panel);
  }

  function button(label, cls, onClick) {
    const b = document.createElement("button");
    b.textContent = label;
    if (cls) b.className = cls;
    b.addEventListener("click", onClick);
    return b;
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for pages where the async clipboard API is blocked (e.g. plain http).
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position: fixed; opacity: 0;";
      root.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  }

  window.__qrReader = { startSelection };
  startSelection();
})();
