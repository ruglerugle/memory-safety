/* ============================================================
   片付けを忘れたサーバー 図解の共通部品（グローバル VZ）
   コマ送りの図：VZ.steps(id, {w, h, frames, draw}) で、
   ◀ 戻る／次へ ▶／最初から／自動再生 のボタンと説明文つきの SVG を作る。
   ============================================================ */
(function (global) {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }

  function text(parent, x, y, str, attrs) {
    var a = { x: x, y: y, "text-anchor": "middle", "font-size": 12, "font-weight": 800, fill: "#2a2522" };
    Object.keys(attrs || {}).forEach(function (k) { a[k] = attrs[k]; });
    var t = el("text", a, parent);
    t.textContent = str;
    return t;
  }

  // 棚：cells は [{fill, label, sub, stroke, dash}]、上に番地（start から）を振る
  function shelf(parent, x, y, cells, o) {
    o = o || {};
    var w = o.w || 56, h = o.h || 44, gap = o.gap || 4, start = o.start;
    cells.forEach(function (c, i) {
      var cx = x + i * (w + gap);
      el("rect", { x: cx, y: y, width: w, height: h, rx: 6, fill: c.fill || "#fff",
        stroke: c.stroke || "#9a8f86", "stroke-width": c.sw || 1.4, "stroke-dasharray": c.dash || "" }, parent);
      if (start != null) text(parent, cx + w / 2, y - 7, String(start + i), { "font-size": o.numFs || 10.5, fill: "#7a716a" });
      if (c.label) text(parent, cx + w / 2, y + h / 2 + (c.sub ? -2 : 4), c.label, { "font-size": c.fs || 12, fill: c.color || "#2a2522" });
      if (c.sub) text(parent, cx + w / 2, y + h / 2 + (o.subFs ? 18 : 13), c.sub, { "font-size": o.subFs || 9.5, fill: c.subColor || "#7a716a" });
    });
    return { x: function (i) { return x + i * (w + gap) + w / 2; }, w: w, h: h, y: y };
  }

  function arrow(parent, x1, y1, x2, y2, color, dash) {
    var id = "ah" + Math.random().toString(36).slice(2, 8);
    var defs = el("defs", {}, parent);
    var m = el("marker", { id: id, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
    el("path", { d: "M0,0 L10,5 L0,10 z", fill: color || "#a63a33" }, m);
    return el("line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: color || "#a63a33", "stroke-width": 2,
      "stroke-dasharray": dash || "", "marker-end": "url(#" + id + ")" }, parent);
  }

  function reducedMotion() {
    return global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function steps(id, opt) {
    var box = document.getElementById(id);
    if (!box) return;
    var wrap = document.createElement("div"); wrap.className = "viz";
    var svg = el("svg", { viewBox: "0 0 " + opt.w + " " + opt.h, role: "img", "aria-label": opt.label || "", "class": opt.narrow ? "narrow" : "" });
    wrap.appendChild(svg);
    var ctl = document.createElement("div"); ctl.className = "viz-ctl";
    ctl.innerHTML = '<button type="button" data-a="first">⟲ 最初から</button>' +
      '<button type="button" data-a="prev">◀ 戻る</button>' +
      '<span class="viz-count"></span>' +
      '<button type="button" data-a="next">次へ ▶</button>' +
      '<button type="button" data-a="play" aria-pressed="false">▶ 自動再生</button>';
    var msg = document.createElement("div"); msg.className = "viz-msg"; msg.setAttribute("aria-live", "polite");
    box.insertBefore(msg, box.firstChild);
    box.insertBefore(ctl, msg);
    box.insertBefore(wrap, ctl);
    var i = 0, timer = null, n = opt.frames.length;
    var bPrev = ctl.querySelector('[data-a="prev"]'), bNext = ctl.querySelector('[data-a="next"]'),
      bPlay = ctl.querySelector('[data-a="play"]'), cnt = ctl.querySelector(".viz-count");
    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      el("rect", { x: 0, y: 0, width: opt.w, height: opt.h, rx: 10, fill: "#fdfbf7" }, svg);
      opt.draw(svg, opt.frames[i], i);
      msg.innerHTML = opt.frames[i].msg || "";
      cnt.textContent = (i + 1) + " / " + n;
      bPrev.disabled = i === 0; bNext.disabled = i === n - 1;
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } bPlay.textContent = "▶ 自動再生"; bPlay.setAttribute("aria-pressed", "false"); }
    ctl.addEventListener("click", function (e) {
      var a = e.target.getAttribute && e.target.getAttribute("data-a");
      if (!a) return;
      if (a === "play") {
        if (timer) { stop(); return; }
        if (i === n - 1) i = 0;
        render();
        bPlay.textContent = "■ 止める"; bPlay.setAttribute("aria-pressed", "true");
        timer = setInterval(function () { if (i < n - 1) { i++; render(); } else stop(); }, opt.interval || 2200);
        return;
      }
      stop();
      if (a === "first") i = 0;
      if (a === "prev" && i > 0) i--;
      if (a === "next" && i < n - 1) i++;
      render();
    });
    render();
  }

  global.VZ = { el: el, text: text, shelf: shelf, arrow: arrow, steps: steps, reducedMotion: reducedMotion };
})(window);
