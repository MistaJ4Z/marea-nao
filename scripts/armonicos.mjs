// Calcula las constantes armónicas de la marea de un lugar a partir de ~1 año de
// datos horarios de Open-Meteo, y las guarda en lugares.js para que la app pueda
// predecir cualquier fecha sin internet.
//   node scripts/armonicos.mjs            -> ajusta, valida y escribe lugares.js
//   node scripts/armonicos.mjs --dry      -> solo ajusta y muestra la validación
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { CONST, astro, nodal, speed } from '../marea-calc.js';

const LUGARES = JSON.parse(readFileSync(new URL('../lugares.base.json', import.meta.url), 'utf8'));
const DRY = process.argv.includes('--dry');
const H = 3600e3, DAY = 24 * H;

const ymd = t => new Date(t).toISOString().slice(0, 10);
async function serie(lat, lon, q) {
  const u = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}` +
            `&hourly=sea_level_height_msl&timeformat=unixtime&timezone=GMT&${q}`;
  const j = await (await fetch(u)).json();
  if (j.error) throw new Error(j.reason);
  const out = [];
  j.hourly.time.forEach((t, i) => { const v = j.hourly.sea_level_height_msl[i]; if (v != null) out.push([t * 1000, v]); });
  return out;
}

// mínimos cuadrados: h = Z0 + Σ f [a cos(V+u) + b sin(V+u)]
function ajustar(datos, nombres) {
  const m = 1 + 2 * nombres.length, A = Array.from({ length: m }, () => new Float64Array(m)), y = new Float64Array(m);
  const row = new Float64Array(m);
  for (const [t, h] of datos) {
    const ast = astro(t);
    row[0] = 1;
    nombres.forEach((k, i) => {
      const { f, u } = nodal(k, ast.N), arg = (CONST[k].V(ast) + u) * Math.PI / 180;
      row[1 + 2 * i] = f * Math.cos(arg); row[2 + 2 * i] = f * Math.sin(arg);
    });
    for (let r = 0; r < m; r++) { y[r] += row[r] * h; for (let c = r; c < m; c++) A[r][c] += row[r] * row[c]; }
  }
  for (let r = 0; r < m; r++) for (let c = 0; c < r; c++) A[r][c] = A[c][r];
  // eliminación gaussiana con pivoteo
  for (let c = 0; c < m; c++) {
    let p = c; for (let r = c + 1; r < m; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]]; [y[c], y[p]] = [y[p], y[c]];
    for (let r = c + 1; r < m; r++) { const k = A[r][c] / A[c][c]; if (!k) continue; for (let j = c; j < m; j++) A[r][j] -= k * A[c][j]; y[r] -= k * y[c]; }
  }
  const x = new Float64Array(m);
  for (let r = m - 1; r >= 0; r--) { let s = y[r]; for (let j = r + 1; j < m; j++) s -= A[r][j] * x[j]; x[r] = s / A[r][r]; }
  const c = { z0: +x[0].toFixed(4) };
  nombres.forEach((k, i) => {
    const a = x[1 + 2 * i], b = x[2 + 2 * i];
    c[k] = [+Math.hypot(a, b).toFixed(4), +((Math.atan2(b, a) * 180 / Math.PI + 360) % 360).toFixed(2)];
  });
  return c;
}

function predecir(c, t) {
  const ast = astro(t); let h = c.z0;
  for (const k in c) if (k !== 'z0') { const { f, u } = nodal(k, ast.N); h += f * c[k][0] * Math.cos((CONST[k].V(ast) + u - c[k][1]) * Math.PI / 180); }
  return h;
}
function extremos(fn, a, b) {
  const out = []; let p2 = fn(a - 60e3), p1 = fn(a);
  for (let t = a + 60e3; t <= b; t += 60e3) { const h = fn(t); if ((p1 > p2 && p1 >= h) || (p1 < p2 && p1 <= h)) out.push({ t: t - 60e3, h: p1, high: p1 > p2 }); p2 = p1; p1 = h; }
  return out;
}
function comparar(etq, c, datos) {
  let se = 0, mx = 0, sb = 0;
  for (const [t, h] of datos) { const e = predecir(c, t) - h; se += e * e; sb += e; mx = Math.max(mx, Math.abs(e)); }
  // error en horas y alturas de pleamares/bajamares (interpolando los datos horarios)
  const t0 = datos[0][0], v = datos.map(d => d[1]);
  const obs = t => { let x = (t - t0) / H; const i = Math.max(1, Math.min(v.length - 3, Math.floor(x))), f = x - i;
    const [p0, p1, p2, p3] = [v[i - 1], v[i], v[i + 1], v[i + 2]];
    return .5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f); };
  const a = t0 + 2 * H, b = datos.at(-1)[0] - 2 * H;
  const eo = extremos(obs, a, b), ep = extremos(t => predecir(c, t), a, b);
  let dt = [], dh = [];
  for (const e of eo) { const q = ep.find(p => p.high === e.high && Math.abs(p.t - e.t) < 3 * H); if (q) { dt.push(Math.abs(q.t - e.t) / 60e3); dh.push(Math.abs(q.h - e.h)); } }
  const prom = a => a.reduce((s, x) => s + x, 0) / a.length;
  console.log(`  ${etq}: sesgo ${(sb/datos.length*100).toFixed(1)} cm · RMS ${(Math.sqrt(se / datos.length) * 100).toFixed(1)} cm · máx ${(mx * 100).toFixed(0)} cm · ` +
    `${dt.length}/${eo.length} extremos · hora ±${prom(dt).toFixed(0)} min (máx ${Math.max(...dt).toFixed(0)}) · altura ±${(prom(dh) * 100).toFixed(1)} cm`);
}

// verificación de velocidades contra la tabla estándar
for (const k in CONST) if (CONST[k].ref && Math.abs(speed(k) - CONST[k].ref) > 1e-5) console.warn(`¡velocidad de ${k}: ${speed(k)} vs ${CONST[k].ref}!`);

const salida = [];
for (const L of LUGARES) {
  console.log(`\n${L.nombre} (${L.lat}, ${L.lon})`);
  const hoy = Date.now() - (Date.now() % DAY);
  const ini = hoy - 400 * DAY, finAjuste = hoy - 30 * DAY;
  const hist = await serie(L.lat, L.lon, `start_date=${ymd(ini)}&end_date=${ymd(hoy - DAY)}`);
  const futuro = await serie(L.lat, L.lon, 'forecast_days=16');
  const ajuste = hist.filter(d => d[0] < finAjuste), prueba = hist.filter(d => d[0] >= finAjuste);
  const nombres = Object.keys(CONST);
  const c1 = ajustar(ajuste, nombres);
  console.log(`  ajuste con ${ajuste.length} horas (${ymd(ajuste[0][0])} → ${ymd(ajuste.at(-1)[0])}), ${nombres.length} componentes`);
  comparar('mismo periodo   ', c1, ajuste);
  comparar('últimos 30 días ', c1, prueba);
  comparar('pronóstico 10 d ', c1, futuro.filter(d => d[0] >= hoy));
  const c = ajustar(hist, nombres);    // final: con todo el historial
  comparar('final, pronóst. ', c, futuro.filter(d => d[0] >= hoy));
  // el nivel medio se mueve de un año a otro: se ancla al pronóstico actual (contra él se calibra el paso)
  const ref = futuro.filter(d => d[0] >= hoy - 15 * DAY);
  const sesgo = ref.reduce((s, [t, h]) => s + h - predecir(c, t), 0) / ref.length;
  c.z0 = +(c.z0 + sesgo).toFixed(4);
  comparar('anclado, pron.  ', c, futuro.filter(d => d[0] >= hoy));
  const top = nombres.map(k => [k, c[k][0]]).sort((a, b) => b[1] - a[1]).slice(0, 8);
  console.log('  principales:', top.map(([k, a]) => `${k} ${(a * 100).toFixed(1)}cm`).join(', '));
  salida.push({ ...L, armonicos: c, ajustado: ymd(hoy) });
}

if (!DRY) {
  writeFileSync(new URL('../lugares.js', import.meta.url),
    '// Generado por scripts/armonicos.mjs — constantes armónicas (amplitud m, fase °) por lugar.\n' +
    'self.LUGARES = ' + JSON.stringify(salida, null, 1) + ';\n');
  console.log('\nlugares.js actualizado');
}
