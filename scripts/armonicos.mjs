// Calcula las constantes armónicas de cada lugar a partir de ~400 días de datos horarios
// de Open-Meteo y las guarda en lugares.js, para que la app prediga cualquier fecha sin internet.
//   node scripts/armonicos.mjs              -> todos los lugares
//   node scripts/armonicos.mjs nao aucar    -> solo esos (los demás se conservan)
//   node scripts/armonicos.mjs --dry        -> no escribe nada
// Conviene correrlo cada ~3 meses (el nivel medio y los bancos de arena cambian).
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { ajustar, predictor } from '../marea-calc.js';

const BASE = JSON.parse(readFileSync(new URL('../lugares.base.json', import.meta.url), 'utf8'));
const OUT = new URL('../lugares.js', import.meta.url);
const DRY = process.argv.includes('--dry');
const SOLO = process.argv.slice(2).filter(a => !a.startsWith('--'));
const H = 3600e3, DAY = 24 * H;
const ymd = t => new Date(t).toISOString().slice(0, 10);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const previos = {};
if (existsSync(OUT)) {
  try { const s = readFileSync(OUT, 'utf8'); for (const l of JSON.parse(s.slice(s.indexOf('['), s.lastIndexOf(']') + 1))) previos[l.id] = l; } catch {}
}

async function serie(lat, lon, q) {
  const u = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}` +
            `&hourly=sea_level_height_msl&timeformat=unixtime&timezone=GMT&cell_selection=sea&${q}`;
  for (let i = 0; i < 4; i++) {
    const r = await fetch(u); const j = await r.json();
    if (j.error) { if (/limit/i.test(j.reason)) { await sleep(20000); continue; } throw new Error(j.reason); }
    const out = [];
    j.hourly.time.forEach((t, k) => { const v = j.hourly.sea_level_height_msl[k]; if (v != null) out.push([t * 1000, v]); });
    return { datos: out, lat: j.latitude, lon: j.longitude };
  }
  throw new Error('límite de la API');
}

function errores(fn, datos) {
  let se = 0, sb = 0; for (const [t, h] of datos) { const e = fn(t) - h; se += e * e; sb += e; }
  return { rms: Math.sqrt(se / datos.length), sesgo: sb / datos.length };
}

// percentil del límite calibrado de Nao: sirve de límite aproximado para pasos sin calibrar
let pNao = null;
const fraccionBajo = (fn, thr) => { let n = 0, b = 0; const t0 = Date.UTC(2026, 0, 1); for (let i = 0; i < 24 * 365; i++, n++) if (fn(t0 + i * H) < thr) b++; return b / n; };
const cuantil = (fn, p) => { const v = []; const t0 = Date.UTC(2026, 0, 1); for (let i = 0; i < 24 * 365; i++) v.push(fn(t0 + i * H)); v.sort((a, b) => a - b); return v[Math.floor(p * v.length)]; };

const hoy = Date.now() - (Date.now() % DAY);
const salida = [];
for (const L of BASE) {
  if (SOLO.length && !SOLO.includes(L.id) && previos[L.id]) { salida.push({ ...L, ...pick(previos[L.id]) }); continue; }
  try {
    // en fiordos el modelo no siempre tiene celda de mar en el punto: se busca la más cercana con datos
    let lat = L.lat, lon = L.lon, hist = null;
    for (const [dy, dx] of [[0, 0], ...[.1, .2, .3].flatMap(r => [[0, -r], [-r, 0], [r, 0], [0, r], [-r, -r], [r, -r], [-r, r], [r, r]])]) {
      const p = await serie(L.lat + dy, L.lon + dx / Math.cos(L.lat * Math.PI / 180) * .7, `start_date=${ymd(hoy - 30 * DAY)}&end_date=${ymd(hoy - 29 * DAY)}`);
      if (p.datos.length) { lat = L.lat + dy; lon = L.lon + dx / Math.cos(L.lat * Math.PI / 180) * .7; break; }
      await sleep(250);
    }
    hist = await serie(lat, lon, `start_date=${ymd(hoy - 400 * DAY)}&end_date=${ymd(hoy - DAY)}`);
    const fut = await serie(lat, lon, 'forecast_days=16');
    if (hist.datos.length < 24 * 200) throw new Error(`pocos datos (${hist.datos.length} h)`);
    const c = ajustar(hist.datos), f0 = predictor(c);
    const pron = fut.datos.filter(d => d[0] >= hoy);
    // el nivel medio se mueve de un año a otro: se ancla al pronóstico actual
    const { sesgo } = errores(f0, fut.datos); c.z0 = +(c.z0 - sesgo).toFixed(4);
    const f = predictor(c), e = errores(f, pron);
    let rango = 0; { let lo = 9, hi = -9; for (let i = 0; i < 24 * 30; i++) { const h = f(hoy + i * H); lo = Math.min(lo, h); hi = Math.max(hi, h); } rango = hi - lo; }
    const r = { ...L, armonicos: c, ajustado: ymd(hoy), celda: [+hist.lat.toFixed(3), +hist.lon.toFixed(3)], rango: +rango.toFixed(2), rms: +e.rms.toFixed(3) };
    if (L.paso && L.id === 'nao' && L.paso.umbral != null) pNao = fraccionBajo(f, L.paso.umbral);
    salida.push(r);
    console.log(`${L.id.padEnd(16)} celda ${r.celda.join(', ').padEnd(18)} rango ${rango.toFixed(1)} m · error vs pronóstico ${(e.rms * 100).toFixed(1)} cm`);
  } catch (err) {
    console.warn(`${L.id.padEnd(16)} ✗ ${err.message}${previos[L.id] ? ' (se conserva el anterior)' : ' (se omite)'}`);
    if (previos[L.id]) salida.push({ ...L, ...pick(previos[L.id]) });
  }
  await sleep(400);
}
function pick(p) { const { armonicos, ajustado, celda, rango, rms } = p; return { armonicos, ajustado, celda, rango, rms, paso: p.paso }; }

// pasos sin calibrar: mismo % del tiempo seco que el paso de Nao (calibrado en terreno)
if (pNao == null) { const n = salida.find(l => l.id === 'nao'); if (n) pNao = fraccionBajo(predictor(n.armonicos), n.paso.umbral); }
for (const l of salida) {
  if (!l.paso) continue;
  const base = BASE.find(b => b.id === l.id).paso;
  l.paso = { ...base };
  if (!base.calibrado && pNao != null) l.paso.umbral = +cuantil(predictor(l.armonicos), pNao).toFixed(2);
}
console.log(`\nLímite aproximado para pasos sin calibrar: seco el ${(pNao * 100).toFixed(0)} % del tiempo (como Nao).`);

if (!DRY) {
  writeFileSync(OUT, '// Generado por scripts/armonicos.mjs — constantes armónicas (amplitud m, fase °) por lugar.\n' +
    'self.LUGARES = ' + JSON.stringify(salida) + ';\n');
  console.log(`lugares.js: ${salida.length} lugares`);
}
