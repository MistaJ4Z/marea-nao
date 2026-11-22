// Robot de avisos: calcula la marea y programa notificaciones en ntfy.
// Lo ejecuta GitHub Actions cada 30 min. Prueba local sin enviar nada:
//   node scripts/avisos.mjs --dry --horas 30 --umbral -0.5
import { readFileSync, writeFileSync } from 'node:fs';

const LAT = -41.9085, LON = -72.8827, TZ = 'America/Santiago';
const APP = 'https://mistaj4z.github.io/marea-nao/';
const SILENCIO = [23, 7];          // sin avisos entre las 23:00 y las 07:00
const AVISO_CIERRE_MIN = 45;       // aviso antes de que el agua tape el paso
const HORIZONTE_MIN = 120;         // cuánto hacia adelante se programa en cada ejecución
const H = 3600e3, MIN = 60e3;

const arg = n => { const i = process.argv.indexOf('--' + n); return i < 0 ? null : process.argv[i + 1] ?? true; };
const DRY = !!arg('dry');
const TOPIC = process.env.NTFY_TOPIC;
if (!TOPIC && !DRY) { console.error('Falta NTFY_TOPIC'); process.exit(1); }

let estado = {};
try { estado = JSON.parse(readFileSync('estado.json', 'utf8')); } catch {}
const now = Date.now();

/* ---- sugerencias de lugares: ntfy las guarda solo 12 h, aquí se archivan en sugerencias.json ---- */
const SUGERENCIAS = 'bajamar-sug-e510f4450bb6';
if (!DRY) {
  let lista = [];
  try { lista = JSON.parse(readFileSync('sugerencias.json', 'utf8')); } catch {}
  try {
    const r = await fetch(`https://ntfy.sh/${SUGERENCIAS}/json?poll=1&since=${estado.sugDesde || '12h'}`);
    let nuevas = 0;
    for (const ln of (await r.text()).split('\n')) {
      try {
        const m = JSON.parse(ln); if (m.event !== 'message' || lista.some(s => s.id === m.id)) continue;
        lista.push({ id: m.id, fecha: new Date(m.time * 1000).toISOString(), titulo: m.title, texto: m.message, mapa: m.click || null });
        estado.sugDesde = m.id; nuevas++;
      } catch {}
    }
    writeFileSync('sugerencias.json', JSON.stringify(lista, null, 1));
    console.log(`Sugerencias: ${nuevas} nuevas, ${lista.length} en total`);
  } catch (e) { console.warn('No se pudieron leer las sugerencias:', e.message); }
}

/* ---- límite de cruce: lo publica la app al calibrar ---- */
if (TOPIC) {
  try {
    const r = await fetch(`https://ntfy.sh/${TOPIC}-cfg/json?poll=1&since=12h`);
    for (const ln of (await r.text()).split('\n')) {
      try {
        const m = JSON.parse(ln); if (m.event !== 'message') continue;
        const c = JSON.parse(m.message);
        if (typeof c.umbral === 'number' && c.t > (estado.umbralT || 0)) { estado.umbral = c.umbral; estado.umbralT = c.t; }
      } catch {}
    }
  } catch (e) { console.warn('No se pudo leer el límite:', e.message); }
}
if (arg('umbral') != null) estado.umbral = +arg('umbral');
const thr = typeof estado.umbral === 'number' ? estado.umbral : null;

/* ---- marea ---- */
const api = `https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}` +
            `&hourly=sea_level_height_msl&timeformat=unixtime&timezone=GMT&past_days=1&forecast_days=4`;
const j = await (await fetch(api)).json();
const t0 = j.hourly.time[0] * 1000, v = [];
for (const x of j.hourly.sea_level_height_msl) { if (x == null) break; v.push(x); }
if (v.length < 48) throw new Error('Sin datos de marea');

function hAt(ms) {
  let x = (ms - t0) / H; x = Math.max(0, Math.min(v.length - 1.0001, x));
  const i = Math.floor(x), f = x - i;
  const p0 = v[Math.max(0, i - 1)], p1 = v[i], p2 = v[i + 1], p3 = v[Math.min(v.length - 1, i + 2)];
  return .5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
}
const n = (v.length - 1) * 60 + 1, S = new Float32Array(n);
for (let i = 0; i < n; i++) S[i] = hAt(t0 + i * MIN);
const EXT = [], CROSS = [];
for (let i = 1; i < n - 1; i++) {
  if (S[i] > S[i - 1] && S[i] >= S[i + 1]) EXT.push({ t: t0 + i * MIN, h: S[i], high: true });
  else if (S[i] < S[i - 1] && S[i] <= S[i + 1]) EXT.push({ t: t0 + i * MIN, h: S[i], high: false });
}
if (thr != null) for (let i = 1; i < n; i++) {
  const a = S[i - 1] - thr, b = S[i] - thr;
  if ((a < 0) !== (b < 0)) CROSS.push({ t: t0 + (i - 1 + a / (a - b)) * MIN, opens: b < 0 });
}

/* ---- formato ---- */
const fT = new Intl.DateTimeFormat('es-CL', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const fHr = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' });
const hhmm = t => fT.format(t);
const fmtH = h => (h < 0 ? '−' : '+') + Math.abs(h).toFixed(1).replace('.', ',') + ' m';
const dur = ms => { const m = Math.round(ms / MIN), h = Math.floor(m / 60); return h ? `${h} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}` : `${m} min`; };
const quiet = t => { const h = +fHr.format(t); return SILENCIO[0] > SILENCIO[1] ? (h >= SILENCIO[0] || h < SILENCIO[1]) : (h >= SILENCIO[0] && h < SILENCIO[1]); };
const nextCross = (t, opens) => CROSS.find(c => c.t > t && c.opens === opens);
const prevCross = t => CROSS.filter(c => c.t <= t).pop();

/* ---- eventos del tramo (desde, hasta] ---- */
const horas = arg('horas');
const desde = horas ? now : Math.max(estado.hasta || 0, now - 20 * MIN);
const hasta = now + (horas ? +horas * 60 : HORIZONTE_MIN) * MIN;
const dentro = t => t > desde && t <= hasta;
const ev = [];

for (const e of EXT) {
  if (!dentro(e.t)) continue;
  if (e.high) {
    const o = nextCross(e.t, true);
    ev.push({ t: e.t, title: 'Marea en su punto más alto', tags: ['ocean'], priority: 3,
      message: `Pleamar de ${fmtH(e.h)}. Desde ahora baja` + (o ? `; el paso se despeja a las ${hhmm(o.t)}.` : '.') });
  } else {
    const c = thr != null && e.h < thr ? nextCross(e.t, false) : null;
    ev.push({ t: e.t, title: 'Marea en su punto más bajo', tags: ['arrow_down'], priority: 3,
      message: `Bajamar de ${fmtH(e.h)}. Desde ahora sube` + (c ? `; el paso se cierra a las ${hhmm(c.t)}.` : '.') });
  }
}
for (const c of CROSS) {
  if (c.opens && dentro(c.t)) {
    const end = nextCross(c.t, false), low = EXT.find(e => !e.high && e.t > c.t && (!end || e.t < end.t));
    ev.push({ t: c.t, title: '¡Buen momento para cruzar a Nao!', tags: ['white_check_mark'], priority: 4,
      message: 'El paso quedó despejado.' + (end ? ` Tienes hasta las ${hhmm(end.t)} (${dur(end.t - c.t)}).` : '') +
               (low ? ` Bajamar a las ${hhmm(low.t)} (${fmtH(low.h)}).` : '') });
  }
  if (!c.opens) {
    const w = c.t - AVISO_CIERRE_MIN * MIN, o = prevCross(c.t - 1);
    if (dentro(w) && (!o || w - o.t > 20 * MIN))
      ev.push({ t: w, title: `El paso se cierra en ${AVISO_CIERRE_MIN} min`, tags: ['warning'], priority: 4,
        message: `El agua tapa el paso a las ${hhmm(c.t)}. Si estás en la isla, es hora de volver.` });
  }
}
ev.sort((a, b) => a.t - b.t);

/* ---- envío ---- */
let enviados = 0;
for (const e of ev) {
  const q = quiet(e.t);
  console.log(`${new Date(e.t).toISOString()} (${hhmm(e.t)})${q ? ' [silencio]' : ''} ${e.title} — ${e.message}`);
  if (q || DRY) continue;
  const body = { topic: TOPIC, title: e.title, message: e.message, tags: e.tags, priority: e.priority, click: APP };
  if (e.t > now + 30e3) body.delay = String(Math.floor(e.t / 1000));
  const r = await fetch('https://ntfy.sh/', { method: 'POST', body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`ntfy respondió ${r.status}: ${await r.text()}`);
  enviados++;
}
console.log(`Límite: ${thr ?? 'sin calibrar'} · eventos: ${ev.length} · programados: ${enviados} · tramo hasta ${hhmm(hasta)}`);

if (!DRY) {
  estado.hasta = hasta; estado.ejecutado = now;
  writeFileSync('estado.json', JSON.stringify(estado));
}
