// Predicción armónica de mareas (método clásico de las tablas oficiales).
// h(t) = Z0 + Σ f·A·cos(V(t) + u − g), con argumentos astronómicos y correcciones nodales.
// Lo usan la app (navegador) y scripts/armonicos.mjs (Node).

// Números de Doodson: τ, s, h, p, N', p1 · velocidad de referencia en °/h (para verificar)
// n: corrección nodal como potencias de M2 / K1 / O1, o una fórmula propia (x)
const D = (d, ref, n = {}) => ({ d, ref, n });
export const CONST = {
  Sa:   D([0, 0, 1, 0, 0, 0], 0.0410686),
  Ssa:  D([0, 0, 2, 0, 0, 0], 0.0821373),
  Mm:   D([0, 1, 0, -1, 0, 0], 0.5443747, { x: 'Mm' }),
  MSf:  D([0, 2, -2, 0, 0, 0], 1.0158958, { m: -1 }),
  Mf:   D([0, 2, 0, 0, 0, 0], 1.0980331, { x: 'Mf' }),
  '2Q1':D([1, -3, 0, 2, 0, 0], 12.8542862, { o: 1 }),
  Q1:   D([1, -2, 0, 1, 0, 0], 13.3986609, { o: 1 }),
  RHO1: D([1, -2, 2, -1, 0, 0], 13.4715145, { o: 1 }),
  O1:   D([1, -1, 0, 0, 0, 0], 13.9430356, { o: 1 }),
  P1:   D([1, 1, -2, 0, 0, 0], 14.9589314),
  K1:   D([1, 1, 0, 0, 0, 0], 15.0410686, { k: 1 }),
  J1:   D([1, 2, 0, -1, 0, 0], 15.5854433, { x: 'J1' }),
  OO1:  D([1, 3, 0, 0, 0, 0], 16.1391017, { x: 'OO1' }),
  MNS2: D([2, -3, 2, 1, 0, 0], 27.4238337, { m: 2 }),
  '2N2':D([2, -2, 0, 2, 0, 0], 27.8953548, { m: 1 }),
  MU2:  D([2, -2, 2, 0, 0, 0], 27.9682084, { m: 1 }),
  N2:   D([2, -1, 0, 1, 0, 0], 28.4397295, { m: 1 }),
  NU2:  D([2, -1, 2, -1, 0, 0], 28.5125831, { m: 1 }),
  M2:   D([2, 0, 0, 0, 0, 0], 28.9841042, { m: 1 }),
  L2:   D([2, 1, 0, -1, 0, 0], 29.5284789, { m: 1 }),
  T2:   D([2, 2, -3, 0, 0, 1], 29.9589333),
  S2:   D([2, 2, -2, 0, 0, 0], 30.0000000),
  K2:   D([2, 2, 0, 0, 0, 0], 30.0821373, { x: 'K2' }),
  '2SM2':D([2, 4, -4, 0, 0, 0], 31.0158958, { m: -1 }),
  '2MK3':D([3, -1, 0, 0, 0, 0], 42.9271398, { m: 2, k: -1 }),
  M3:   D([3, 0, 0, 0, 0, 0], 43.4761563, { m: 1.5 }),
  MK3:  D([3, 1, 0, 0, 0, 0], 44.0251729, { m: 1, k: 1 }),
  MN4:  D([4, -1, 0, 1, 0, 0], 57.4238337, { m: 2 }),
  M4:   D([4, 0, 0, 0, 0, 0], 57.9682084, { m: 2 }),
  MS4:  D([4, 2, -2, 0, 0, 0], 58.9841042, { m: 1 }),
  S4:   D([4, 4, -4, 0, 0, 0], 60.0000000),
  '2MN6':D([6, -1, 0, 1, 0, 0], 86.4079380, { m: 3 }),
  M6:   D([6, 0, 0, 0, 0, 0], 86.9523127, { m: 3 }),
  '2MS6':D([6, 2, -2, 0, 0, 0], 87.9682084, { m: 2 }),
  M8:   D([8, 0, 0, 0, 0, 0], 115.9364166, { m: 4 }),
};

const RATE = [14.4920521, 0.5490165, 0.0410686, 0.0046418, 0.0022064, 0.0000020];   // °/h
export const speed = k => CONST[k].d.reduce((s, x, i) => s + x * RATE[i], 0);

// argumentos astronómicos medios (Meeus), t en ms UTC
export function astro(t) {
  const T = (t / 864e5 + 2440587.5 - 2451545) / 36525;
  const s = 218.3164477 + 481267.88123421 * T, h = 280.46646 + 36000.76983 * T;
  const p = 83.3532465 + 4069.0137287 * T, N = 125.04452 - 1934.136261 * T, p1 = 282.93768 + 1.71946 * T;
  const tau = 15 * ((t % 864e5 + 864e5) % 864e5) / 3600e3 + 180 + h - s;
  const a = { arg: [tau, s, h, p, -N, p1], N: ((N % 360) + 360) % 360 };
  for (const k in CONST) { const d = CONST[k].d; CONST[k].V ||= x => d.reduce((v, n, i) => v + n * x.arg[i], 0); }
  return a;
}

// correcciones nodales (Schureman): factor f y ángulo u en grados
const rad = Math.PI / 180;
function base(N) {
  const c = Math.cos(N * rad), c2 = Math.cos(2 * N * rad), c3 = Math.cos(3 * N * rad);
  const s = Math.sin(N * rad), s2 = Math.sin(2 * N * rad), s3 = Math.sin(3 * N * rad);
  return {
    M2: [1.0004 - 0.0373 * c + 0.0002 * c2, -2.14 * s],
    K1: [1.0060 + 0.1150 * c - 0.0088 * c2 + 0.0006 * c3, -8.86 * s + 0.68 * s2 - 0.07 * s3],
    O1: [1.0089 + 0.1871 * c - 0.0147 * c2 + 0.0014 * c3, 10.80 * s - 1.34 * s2 + 0.19 * s3],
    K2: [1.0241 + 0.2863 * c + 0.0083 * c2 - 0.0015 * c3, -17.74 * s + 0.68 * s2 - 0.04 * s3],
    J1: [1.1029 + 0.1676 * c - 0.0170 * c2 + 0.0016 * c3, -12.94 * s + 1.34 * s2 - 0.19 * s3],
    OO1:[1.1027 + 0.6504 * c + 0.0317 * c2 - 0.0014 * c3, -36.68 * s + 4.02 * s2 - 0.57 * s3],
    Mf: [1.0429 + 0.4135 * c - 0.0040 * c2, -23.74 * s + 2.68 * s2 - 0.38 * s3],
    Mm: [1.0000 - 0.1300 * c + 0.0013 * c2, 0],
  };
}
let cacheN = null, cacheB = null;
export function nodal(k, N) {
  if (N !== cacheN) { cacheN = N; cacheB = base(N); }
  const n = CONST[k].n, B = cacheB;
  if (n.x) return { f: B[n.x][0], u: B[n.x][1] };
  const m = n.m || 0, kk = n.k || 0, o = n.o || 0;
  return {
    f: Math.abs(B.M2[0] ** Math.abs(m) * B.K1[0] ** Math.abs(kk) * B.O1[0] ** Math.abs(o)),
    u: m * B.M2[1] + kk * B.K1[1] + o * B.O1[1],
  };
}

// predictor rápido para un lugar: recalcula f/u cada 6 h (cambian en años)
export function predictor(arm) {
  const ks = Object.keys(arm).filter(k => k !== 'z0' && CONST[k]);
  const w = ks.map(k => speed(k) * rad / 3600e3);    // rad/ms
  let blk = null, ph = null, amp = null;
  return t => {
    const b = Math.floor(t / 216e5);
    if (b !== blk) {
      blk = b; const t0 = b * 216e5, a = astro(t0);
      ph = ks.map(k => (CONST[k].V(a) + nodal(k, a.N).u - arm[k][1]) * rad - w[ks.indexOf(k)] * t0);
      amp = ks.map(k => nodal(k, a.N).f * arm[k][0]);
    }
    let h = arm.z0;
    for (let i = 0; i < ks.length; i++) h += amp[i] * Math.cos(w[i] * t + ph[i]);
    return h;
  };
}
