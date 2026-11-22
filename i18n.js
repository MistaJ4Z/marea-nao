// Idiomas de Bajamar. El texto de la app está escrito en español; en otro idioma, este archivo
// traduce lo que aparece en pantalla (textos fijos, textos generados y atributos accesibles).
//   - EXACTO: frases completas.            - PATRONES: frases con datos (horas, alturas, días).
//   - TROZOS: fragmentos dentro de textos largos (pie de página, mensajes).
// Para sumar un idioma: agregarlo a IDIOMAS y crear sus tres tablas.
(() => {
  const IDIOMAS = { es: 'Español', en: 'English' };
  let lang = null;
  try { lang = localStorage.getItem('mareas.idioma'); } catch {}
  if (!IDIOMAS[lang]) lang = (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
  self.IDIOMAS = IDIOMAS;
  self.LANG = lang;
  self.LOCALE = lang === 'en' ? 'en-GB' : 'es-CL';
  self.DEC = lang === 'en' ? '.' : ',';
  document.documentElement.lang = lang;

  const EXACTO = { en: {
    // general
    'hoy': 'today', 'mañana': 'tomorrow', 'ayer': 'yesterday', 'ahora': 'now',
    'Mareas': 'Tides', 'Paso': 'Crossing', 'Compartir': 'Share', 'Elegir lugar': 'Choose place',
    'Marea ahora': 'Tide now', 'Calculando mareas': 'Calculating tides', 'Listo': 'Ready',
    'Cargando marea…': 'Loading tide…', 'Tabla de 7 días': '7-day table', 'Toca la curva': 'Tap the curve',
    'Otra fecha': 'Other date', 'Día anterior': 'Previous day', 'Día siguiente': 'Next day', 'Cerrar': 'Close',
    'marea viva': 'spring tide', 'marea muerta': 'neap tide', 'viva': 'spring', 'muerta': 'neap',
    'Próxima pleamar': 'Next high tide', 'Próxima bajamar': 'Next low tide',
    'Subiendo': 'Rising', 'Bajando': 'Falling', 'Casi quieta, cambiando de dirección': 'Almost still, turning',
    'casi quieta': 'almost still', '↑ subiendo': '↑ rising', '↓ bajando': '↓ falling',
    'Pronóstico oceánico (Open-Meteo)': 'Ocean forecast (Open-Meteo)', 'Cálculo astronómico · ±3 min, ±5 cm': 'Astronomical calculation · ±3 min, ±5 cm',
    'Zona sombreada: noche': 'Shaded area: night', 'AHORA': 'NOW', 'LÍMITE DEL PASO': 'LIMIT',
    'Curva de marea del día elegido': 'Tide curve for the chosen day',
    'Curva de marea del día con las ventanas para cruzar': 'Tide curve with the crossing windows',
    'Vista del paso con el nivel actual del agua': 'View of the crossing with the current water level',
    // tipos de lugar y calibración
    'Paso a pie': 'Walking crossing', 'Camino con marea baja': 'Low-tide road', 'Orilla y marisqueo': 'Shore and shellfishing',
    'Ciudad costera': 'Coastal town', 'Tu punto': 'Your spot', 'Mi punto': 'My spot',
    'Falta calibrar': 'Not calibrated', 'Revisar calibración': 'Check calibration', 'Calibrado': 'Calibrated', 'aproximado': 'approximate',
    'Ver horarios del paso': 'See crossing times', 'Ver en el mapa': 'Show on map', 'Ocultar mapa': 'Hide map', 'Cómo llegar': 'Directions',
    'Límite aproximado: falta calibrar en terreno.': 'Approximate limit: not yet calibrated on site.',
    ' Se estimó para que el paso quede seco el mismo porcentaje del tiempo que en Isla Nao. Los horarios pueden variar; si vas, calíbralo abajo.':
      ' It was estimated so the crossing is dry the same share of time as at Isla Nao. Times may vary; if you go, calibrate it below.',
    'Revisa la calibración.': 'Check the calibration.', 'Sigue calzando': 'Still matches',
    // paso
    'Paso abierto': 'Crossing open', 'Paso cubierto': 'Crossing covered', 'Paso por cerrarse': 'Crossing about to close',
    'Puedes cruzar': 'You can cross', 'No cruces': "Don't cross", 'Se está cerrando': 'Closing soon',
    'El agua tapa el paso a las': 'The water covers the crossing at', '· quedan': '· time left:',
    'Se despeja a las': 'It clears at', '· en': '· in', 'El paso sigue seco por días.': 'The crossing stays dry for days.',
    'La marea no baja lo suficiente en los próximos días.': "The tide doesn't drop low enough in the coming days.",
    'paso seco': 'crossing dry', 'Ventanas para cruzar': 'Crossing windows', 'gratis en la prueba': 'free during the trial',
    'Ese día la marea no baja del límite: el paso no se despeja.': "That day the tide doesn't drop below the limit: the crossing doesn't clear.",
    'Las ventanas de días futuros son parte de la versión completa.': 'Future-day windows are part of the full version.',
    'se puede cruzar · línea punteada: límite del paso': 'crossable · dashed line: crossing limit',
    'Distancias a escala aproximada: el paso mide unos 500–600 m y la isla unos 450 m de ancho y 30 m de alto. La altura de la marea está ampliada para poder leerla.':
      'Distances roughly to scale: the crossing is about 500–600 m long and the island about 450 m wide and 30 m high. Tide height is exaggerated so it can be read.',
    'Límite de cruce': 'Crossing limit',
    'Es la altura de marea bajo la cual el paso queda seco. Si ves que el paso recién se despeja (o recién se tapa), pulsa el botón y la app queda calibrada.':
      'The tide height below which the crossing is dry. If you see the crossing just clearing (or just covering), press the button and the app is calibrated.',
    'Usar el nivel de ahora': 'Use the current level', 'Límite de cruce en metros': 'Crossing limit in metres',
    // avisos
    'Avisos en el teléfono': 'Phone alerts', 'Guardar': 'Save', 'nombre del canal': 'channel name', 'Copiar': 'Copy', 'Copiado ✓': 'Copied ✓',
    'Los avisos llegan por': 'Alerts arrive through', 'a un canal personal. Si tienes uno, pégalo aquí:': 'to a personal channel. If you have one, paste it here:',
    'Llegan por': 'They arrive through', ', una app gratuita de notificaciones. Se configura una sola vez:': ', a free notification app. Set it up once:',
    'Instala ntfy:': 'Install ntfy:', 'Copia el nombre de tu canal:': 'Copy your channel name:',
    'Abre ntfy, toca el botón': 'Open ntfy, tap the', ', pega el nombre en "tema" y toca': ' button, paste the name as "topic" and tap',
    'Suscribirse': 'Subscribe', '. Acepta el permiso de notificaciones si lo pide.': '. Accept the notification permission if asked.',
    'En Android también puedes probar abrirlo directo.': 'On Android you can also try opening it directly.',
    'Vuelve aquí y prueba:': 'Come back and test:', 'Enviar aviso de prueba': 'Send test alert', 'Enviando…': 'Sending…',
    'Enviado ✓ Si ya te suscribiste en ntfy (paso 3), llega en segundos.': 'Sent ✓ If you subscribed in ntfy (step 3), it arrives in seconds.',
    'Sin conexión.': 'No connection.', 'Mantén pulsado el nombre para copiarlo': 'Long-press the name to copy it',
    'Límite en': 'Limit at',
    ': recibirás bajamar, pleamar, el momento en que se despeja el paso y un aviso 45 min antes de que se cierre. Silencio de 23:00 a 07:00.':
      ': you will get low tide, high tide, the moment the crossing clears and an alert 45 min before it closes. Quiet from 23:00 to 07:00.',
    // compartir y acerca de
    'Pásale la app a alguien': 'Share the app with someone', 'Compartir enlace': 'Share link', 'Descargar app Android': 'Download Android app',
    'Que escanee el código con la cámara del teléfono. En Android se descarga la app; en iPhone se abre la versión web, que se puede agregar a la pantalla de inicio.':
      'Scan the code with the phone camera. On Android the app downloads; on iPhone the web version opens and can be added to the home screen.',
    '¿Conoces un lugar que depende de la marea?': 'Know a place that depends on the tide?',
    'Un paso a una isla, un camino por la playa, una zona para mariscar o una rampa para botes. Cuéntanos y lo calibramos para la app.':
      'A walk to an island, a beach road, a shellfishing area or a boat ramp. Tell us and we will calibrate it for the app.',
    'Sugerir un lugar': 'Suggest a place', 'Cómo se calcula la marea': 'How the tide is calculated', 'Idioma': 'Language',
    // lugares
    'Usar mi ubicación': 'Use my location', 'Buscar ciudad, isla, comuna o región': 'Search town, island, district or region', 'Buscar lugar': 'Search place',
    'Cerca de ti': 'Near you', 'Recientes': 'Recent', 'Pasos y orillas': 'Crossings and shores', 'En Bajamar': 'In Bajamar', 'Otras localidades': 'Other places',
    'calcular': 'calculate', 'Buscando localidades…': 'Searching places…', 'Buscando tu ubicación…': 'Finding your location…', 'Buscando…': 'Searching…',
    'Escribe una ciudad, localidad o región de cualquier país para ver su marea.': 'Type a town, place or region in any country to see its tide.',
    'Sin conexión: solo se buscan los lugares guardados.': 'Offline: only saved places are searched.',
    'No encontramos ese lugar. Prueba con otra escritura, usa tu ubicación o sugiérelo.': "We couldn't find that place. Try another spelling, use your location or suggest it.",
    'Lo más cercano en Bajamar es': 'The closest place in Bajamar is',
    ' También puedo calcular la marea en tu punto exacto (descarga un año de datos, unos segundos).': ' I can also calculate the tide at your exact spot (downloads a year of data, a few seconds).',
    'Calcular en mi punto': 'Calculate at my spot', 'Calculando las componentes de la marea…': 'Calculating the tidal components…',
    'Descargando un año de mareas para': 'Downloading a year of tides for',
    'El modelo oceánico no tiene datos de mar cerca de este punto.': 'The ocean model has no sea data near this point.',
    'Este dispositivo no entrega ubicación.': "This device doesn't provide location.", 'No diste permiso de ubicación.': "You didn't allow location access.",
    'No se pudo obtener la ubicación.': "Couldn't get the location.",
    // calendario
    'Elegir fecha': 'Choose date', 'Mes anterior': 'Previous month', 'Mes siguiente': 'Next month', 'Ir a hoy': 'Go to today',
    'La barra bajo cada día muestra el tamaño de la marea: más larga es marea viva (bajamares más bajas).': 'The bar under each day shows the tidal range: longer means spring tide (lower low tides).',
    // sugerencias
    'Nombre del lugar': 'Place name', 'Ej.: paso a Isla Tabón': 'E.g.: walk to Isla Tabón', '¿Qué se puede hacer con la marea?': 'What can you do with the tide?',
    'Cruzar a pie a una isla': 'Walk to an island', 'Camino o playa que solo se pasa con marea baja': 'Road or beach passable only at low tide',
    'Mariscar u orillar': 'Shellfishing or shore walking', 'Bajar o varar botes': 'Launching or beaching boats', 'Otro': 'Other',
    '¿Dónde queda?': 'Where is it?', 'Comuna, sector o cómo llegar': 'Town, area or how to get there',
    'Cuéntanos más (opcional)': 'Tell us more (optional)', 'Desde qué hora se puede pasar, qué tan seguro es, qué hay que saber…': 'From what time you can cross, how safe it is, what to know…',
    'Tu nombre o contacto (opcional)': 'Your name or contact (optional)', 'Por si necesitamos preguntarte algo': 'In case we need to ask you something',
    'Enviar sugerencia': 'Send suggestion', 'Indica dónde queda o usa tu ubicación': 'Say where it is or use your location',
    '¡Gracias! Recibimos la sugerencia. Si el lugar sirve, aparecerá en la app con un límite aproximado hasta calibrarlo.': 'Thanks! We got your suggestion. If the place works, it will appear in the app with an approximate limit until calibrated.',
    'No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.': "Couldn't send. Check your connection and try again.",
    // notas de lugares
    'Paso de arena entre Rolecha e Isla Nao que queda seco con marea baja.': 'Sand crossing between Rolecha and Isla Nao that dries at low tide.',
    'Se cruza siempre por la pasarela de madera (~500 m), con cualquier marea. Con marea baja además se puede caminar por el fondo marino entre las rocas.':
      'Always crossable by the wooden footbridge (~500 m), at any tide. At low tide you can also walk on the seabed among the rocks.',
    'Isla con conexión por tierra. Por confirmar si el paso depende de la marea.': 'Island with a land connection. To be confirmed whether the crossing depends on the tide.',
    'Antes la unía a Chiloé un banco de arena que aparecía con marea baja. Por confirmar si hoy se puede cruzar.': 'A sandbar used to join it to Chiloé at low tide. To be confirmed whether it can be crossed today.',
    'Con mareas grandes queda descubierto un fondo de unos 400 m, muy usado para mariscar.': 'Big tides expose about 400 m of seabed, popular for shellfishing.',
    'Algunas islas del grupo se unen entre sí según la marea.': 'Some islands of the group join each other depending on the tide.',
    'Un tramo del camino solo se puede pasar con marea baja.': 'A stretch of the road can only be passed at low tide.',
    // premium
    'El plan gratis muestra la marea de los próximos 7 días. Con Premium ves cualquier fecha, las ventanas para cruzar de todo el año y avisos ilimitados.':
      'The free plan shows the tide for the next 7 days. With Premium you see any date, the crossing windows for the whole year and unlimited alerts.',
    'Muy pronto. Los colaboradores que calibran lugares lo reciben gratis.': 'Coming soon. Contributors who calibrate places get it free.',
    // bienvenida
    'Bienvenido a Bajamar': 'Welcome to Bajamar', 'Continuar': 'Continue', 'Buscar manualmente': 'Search manually',
    'Mareas de cualquier día, sin internet, y los horarios para cruzar a pie a islas y orillas que dependen de la marea.':
      'Tides for any day, offline, and the times to walk to islands and shores that depend on the tide.',
    '¿Dónde quieres ver la marea?': 'Where do you want to see the tide?',
    'Con tu ubicación buscamos la playa o localidad más cercana. No se guarda ni se envía a nadie.': "With your location we find the nearest beach or town. It isn't stored or sent to anyone.",
  } };

  const PATRONES = { en: [
    [/^en (\d+) días$/, 'in $1 days'], [/^hace (\d+) días$/, '$1 days ago'],
    [/^(hoy|mañana|ayer|en \d+ días|hace \d+ días) · rango (.+) m$/, (m, d, r) => `${tr(d)} · range ${r} m`],
    [/^en (\d.*)$/, 'in $1'], [/^· (\d+) cm por hora$/, '· $1 cm per hour'], [/^(↑|↓) (subiendo|bajando) · (\d+) cm\/h$/, (m, a, b, c) => `${a} ${b === 'subiendo' ? 'rising' : 'falling'} · ${c} cm/h`],
    [/^paso seco · (\d+) cm sobre el agua$/, 'crossing dry · $1 cm above water'], [/^(\d+) cm de agua sobre el paso$/, '$1 cm of water over the crossing'],
    [/^(\d+) cm sobre el paso$/, '$1 cm over the crossing'], [/^· (.+)$/, (m, a) => '· ' + tr(a)],
    [/^ahora – (.*)$/, 'now – $1'], [/^(.*)mín (.+)$/, '$1min $2'],
    [/^Paso a (.+)$/, 'Crossing to $1'], [/^desde (.+)$/, (m, a) => 'from ' + tr(a)], [/^calibrado el (.+)$/, 'calibrated on $1'],
    [/^a (.+) de ti$/, '$1 from you'], [/^cerca de (.+)$/, 'near $1'], [/^, a (.+)\.$/, ', $1 away.'],
    [/^Avisos programados hasta las (.+)\.$/, 'Alerts scheduled until $1.'], [/^ ?Avisos programados hasta las (.+)\.$/, ' Alerts scheduled until $1.'],
    [/^(hoy|mañana|ayer) (\d\d:\d\d)$/, (m, d, h) => `${tr(d)} ${h}`],
    [/^(hoy|mañana|ayer)( · .*)$/, (m, d, r) => tr(d) + r.replace(' · viva', ' · spring').replace(' · muerta', ' · neap')],
    [/^(.+) · (viva|muerta)$/, (m, a, b) => `${a} · ${b === 'viva' ? 'spring' : 'neap'}`],
    [/^La última fue el (.+) \(hace (\d+) meses\)\. Los bancos de arena cambian: comprueba si el paso se sigue despejando a (.+)\.$/,
      ' The last one was on $1 ($2 months ago). Sandbanks shift: check whether the crossing still clears at $3.'],
    [/^Marea calculada en el teléfono con un año de datos del modelo oceánico \(punto de mar a (.+)\)\.(.*)$/,
      (m, d, r) => `Tide calculated on the phone from a year of ocean-model data (sea point ${d} away).${r ? ' Being far away, times may differ by a few minutes.' : ''}`],
    [/^(.+) queda a (.+) del mar más cercano que cubre el modelo\. Elige una localidad costera\.$/, '$1 is $2 from the nearest sea covered by the model. Choose a coastal place.'],
    [/^No se pudo enviar \((\d+)\)\.$/, "Couldn't send ($1)."], [/^Enlace copiado: (.+)$/, 'Link copied: $1'],
    [/^Los avisos de marea de (.+) funcionan\.$/, 'Tide alerts for $1 are working.'],
  ] };

  const TROZOS = { en: [
    ['Sin pronóstico descargado: todo se muestra con el cálculo astronómico. ', 'No forecast downloaded: everything uses the astronomical calculation. '],
    ['Pronóstico descargado ', 'Forecast downloaded '], [', válido hasta ', ', valid until '], ['No se pudo actualizar (', 'Could not update ('],
    ['Punto: ', 'Point: '], ['Hora local: ', 'Local time: '], ['Constantes ajustadas el ', 'Constants fitted on '],
  ] };

  const norm = s => s.replace(/\s+/g, ' ').trim();
  function tr(s) {
    if (lang === 'es' || !s) return s;
    const ex = EXACTO[lang] || {}, k = norm(s);
    if (ex[k] != null) return s.replace(k, ex[k]).replace(/^\s+|\s+$/g, m => m);
    for (const [re, to] of PATRONES[lang] || []) if (re.test(k)) return s.replace(k, k.replace(re, to));
    let o = s; for (const [a, b] of TROZOS[lang] || []) o = o.split(a).join(b);
    return o.replace(/\b(hoy|mañana|ayer)\b/g, w => ex[w] || w);
  }
  self.tr = tr;

  // traducción de lo que aparece en pantalla
  const SKIP = new Set(['SCRIPT', 'STYLE', 'CODE', 'TEXTAREA', 'INPUT']);
  const ATTRS = ['placeholder', 'aria-label', 'title'];
  function node(n) {
    if (n.nodeType === 3) {
      const p = n.parentNode; if (!p || SKIP.has(p.nodeName) || p.closest?.('[data-no-tr]')) return;
      const v = n.nodeValue; if (!/[a-záéíóúñ¿¡]{2}/i.test(v)) return;
      const t = tr(v); if (t !== v) n.nodeValue = t;
    } else if (n.nodeType === 1) {
      if (SKIP.has(n.nodeName) && n.nodeName !== 'INPUT' && n.nodeName !== 'TEXTAREA') return;
      for (const a of ATTRS) if (n.hasAttribute(a)) { const v = n.getAttribute(a), t = tr(v); if (t !== v) n.setAttribute(a, t); }
      if (n.nodeName === 'INPUT' || n.nodeName === 'TEXTAREA') return;
      for (const c of n.childNodes) node(c);
    }
  }
  if (lang !== 'es') {
    const mo = new MutationObserver(ms => {
      for (const m of ms) {
        if (m.type === 'characterData') node(m.target);
        else if (m.type === 'attributes') node(m.target);
        else for (const a of m.addedNodes) node(a);
      }
    });
    mo.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    document.addEventListener('DOMContentLoaded', () => node(document.body));
  }
  // párrafos con formato (data-i18n="clave"): se reemplazan completos
  self.I18N_HTML = { en: {
    calc1: 'For the next <b>10 days</b> the app uses the Open-Meteo ocean model forecast, downloaded when the app opens.',
    calc2: 'For any other date the tide is <b>calculated</b> from its astronomical components (the Moon and the Sun), like official tide tables. The constants come from more than a year of data at each point and are recalculated periodically. Compared with the forecast, high and low tide times match within about <b>±3 minutes</b> and heights within about <b>±5 cm</b>. Works offline.',
    calc3: 'Wind and pressure can shift the real tide by a few centimetres or minutes. This is not an official tide table: cross with a margin and keep an eye on the water.',
  } };
  self.setLang = l => { try { localStorage.setItem('mareas.idioma', l); } catch {} location.reload(); };
})();
