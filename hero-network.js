/* ===========================================================
   Zipline Hero — animated career-page network
   Company nodes (career pages) feed jobs along cables
   into a central Zipline hub.
   =========================================================== */
(function () {
  var canvas = document.getElementById('netCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);

  // Brand
  var PINE = '#0B5D3B', GLOW = '#16B47C', BRIGHT = '#1FA971', LINE = '#CFE0D7', INK = '#07261B';

  // Company nodes (career pages) — initial + brand-ish color
  var companies = [
    { label: 'S', color: '#635BFF' },  // Stripe
    { label: 'F', color: '#0D0D0D' },  // Figma
    { label: 'N', color: '#111111' },  // Notion
    { label: 'L', color: '#5E6AD2' },  // Linear
    { label: 'V', color: '#111111' },  // Vercel
    { label: 'A', color: '#FF5A5F' },  // Airbnb
    { label: 'D', color: '#6C40BE' },  // Datadog
    { label: 'R', color: '#1A1A1A' }   // Ramp
  ];

  var nodes = [], hub = { x: 0, y: 0, r: 30 }, packets = [], t = 0;

  function layout() {
    var rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // hub sits right-of-center
    hub.x = W * 0.62;
    hub.y = H * 0.50;

    // distribute company nodes on the left arc around the hub
    nodes = [];
    var n = companies.length;
    var rx = Math.min(W * 0.46, 300);
    var ry = Math.min(H * 0.42, 210);
    for (var i = 0; i < n; i++) {
      // spread across an arc that opens toward the left
      var a = Math.PI * 0.62 + (i / (n - 1)) * Math.PI * 0.76;
      var x = hub.x + Math.cos(a) * rx;
      var y = hub.y + Math.sin(a) * ry;
      nodes.push({
        x: x, y: y, label: companies[i].label, color: companies[i].color,
        phase: Math.random() * Math.PI * 2, r: 19,
        // control point for the cable curve
        cx: (x + hub.x) / 2 + (Math.random() * 30 - 15),
        cy: (y + hub.y) / 2 - 26 - Math.random() * 18
      });
    }
    packets = [];
  }

  function bez(p0, p1, p2, s) {
    var u = 1 - s;
    return {
      x: u * u * p0.x + 2 * u * s * p1.x + s * s * p2.x,
      y: u * u * p0.y + 2 * u * s * p1.y + s * s * p2.y
    };
  }

  function spawn() {
    if (packets.length > 14) return;
    var i = Math.floor(Math.random() * nodes.length);
    packets.push({ node: i, s: 0, speed: 0.0045 + Math.random() * 0.004 });
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw() {
    t += 1;
    ctx.clearRect(0, 0, W, H);

    // --- cables ---
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      var p0 = { x: nd.x, y: nd.y }, p1 = { x: nd.cx, y: nd.cy }, p2 = { x: hub.x, y: hub.y };
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    // --- packets traveling along cables ---
    for (var k = packets.length - 1; k >= 0; k--) {
      var pk = packets[k];
      pk.s += pk.speed;
      if (pk.s >= 1) { packets.splice(k, 1); continue; }
      var nd2 = nodes[pk.node];
      var pos = bez({ x: nd2.x, y: nd2.y }, { x: nd2.cx, y: nd2.cy }, { x: hub.x, y: hub.y }, pk.s);
      // glow trail
      var tg = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 11);
      tg.addColorStop(0, 'rgba(31,169,113,0.55)');
      tg.addColorStop(1, 'rgba(31,169,113,0)');
      ctx.fillStyle = tg;
      ctx.beginPath(); ctx.arc(pos.x, pos.y, 11, 0, Math.PI * 2); ctx.fill();
      // packet dot
      ctx.fillStyle = pk.s > 0.85 ? BRIGHT : GLOW;
      ctx.beginPath(); ctx.arc(pos.x, pos.y, 3.4, 0, Math.PI * 2); ctx.fill();
    }

    // --- company nodes ---
    for (var j = 0; j < nodes.length; j++) {
      var c = nodes[j];
      var pulse = 1 + Math.sin(t * 0.04 + c.phase) * 0.04;
      var r = c.r * pulse;
      // soft shadow
      ctx.save();
      ctx.shadowColor = 'rgba(7,38,27,0.16)';
      ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#fff';
      roundRect(c.x - r, c.y - r, r * 2, r * 2, r * 0.42); ctx.fill();
      ctx.restore();
      // colored inner
      ctx.fillStyle = c.color;
      var ir = r * 0.72;
      roundRect(c.x - ir, c.y - ir, ir * 2, ir * 2, ir * 0.42); ctx.fill();
      // label
      ctx.fillStyle = '#fff';
      ctx.font = '700 ' + Math.round(r * 0.82) + "px 'Schibsted Grotesk', sans-serif";
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(c.label, c.x, c.y + 0.5);
    }

    // --- central hub (Zipline) ---
    var hpulse = 1 + Math.sin(t * 0.05) * 0.05;
    var hr = hub.r * hpulse;
    // outer ring glow
    var ringG = ctx.createRadialGradient(hub.x, hub.y, hr * 0.6, hub.x, hub.y, hr * 2.3);
    ringG.addColorStop(0, 'rgba(31,169,113,0.28)');
    ringG.addColorStop(1, 'rgba(31,169,113,0)');
    ctx.fillStyle = ringG;
    ctx.beginPath(); ctx.arc(hub.x, hub.y, hr * 2.3, 0, Math.PI * 2); ctx.fill();
    // rotating ring
    ctx.save();
    ctx.translate(hub.x, hub.y); ctx.rotate(t * 0.01);
    ctx.strokeStyle = 'rgba(22,180,124,0.5)'; ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 7]);
    ctx.beginPath(); ctx.arc(0, 0, hr + 9, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    // hub body
    var hg = ctx.createLinearGradient(hub.x - hr, hub.y - hr, hub.x + hr, hub.y + hr);
    hg.addColorStop(0, PINE); hg.addColorStop(1, BRIGHT);
    ctx.save();
    ctx.shadowColor = 'rgba(11,93,59,0.4)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.arc(hub.x, hub.y, hr, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // zipline glyph inside hub (cable + 2 nodes + package)
    ctx.save();
    ctx.translate(hub.x, hub.y); ctx.scale(hr / 30, hr / 30);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-11, -7); ctx.quadraticCurveTo(0, 0, 11, 7); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-11, -7, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(11, 7, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.rotate(0.55);
    roundRect(-4, -2.4, 8.4, 7, 2); ctx.fill();
    ctx.restore();
    ctx.restore();

    requestAnimationFrame(draw);
  }

  layout();
  window.addEventListener('resize', layout);
  setInterval(spawn, 520);
  for (var s = 0; s < 4; s++) spawn();
  draw();
})();
