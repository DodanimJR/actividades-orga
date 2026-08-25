/* ===========================================================
   MOTOR: SIMULADOR DE COMPUERTAS (interruptores en vivo)
   Uso: IniciarSimulador(config) — ver README al final del archivo.
   =========================================================== */

const SIM_FORMAS = {
  AND: (id) => `<path d="M10 8 L38 8 A22 22 0 0 1 38 52 L10 52 Z" fill="none" stroke="currentColor" stroke-width="2.5"/>`,
  OR: (id) => `<path d="M8 8 Q26 30 8 52 Q42 46 60 30 Q42 14 8 8 Z" fill="none" stroke="currentColor" stroke-width="2.5"/>`,
  NOT: (id) => `<path d="M8 8 L8 52 L48 30 Z" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="54" cy="30" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/>`,
  NAND: (id) => `<path d="M10 8 L38 8 A22 22 0 0 1 38 52 L10 52 Z" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="66" cy="30" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/>`,
  NOR: (id) => `<path d="M8 8 Q26 30 8 52 Q42 46 60 30 Q42 14 8 8 Z" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="66" cy="30" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/>`,
  XOR: (id) => `<path d="M2 8 Q16 30 2 52" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M8 8 Q26 30 8 52 Q42 46 60 30 Q42 14 8 8 Z" fill="none" stroke="currentColor" stroke-width="2.5"/>`,
  ENABLE: (id) => `<path d="M10 8 L38 8 A22 22 0 0 1 38 52 L10 52 Z" fill="none" stroke="currentColor" stroke-width="2.5"/>`,
};

function IniciarSimulador(config) {
  const cont = document.getElementById(config.contenedorId || 'app');
  const nEntradas = config.numEntradas || 2;
  const etiquetas = config.etiquetasEntradas || (nEntradas === 1 ? ['A'] : ['A', 'B']);
  const tipo = config.tipo || 'AND';
  const forma = SIM_FORMAS[tipo] || SIM_FORMAS.AND;
  const anchoSVG = (tipo === 'NOT') ? 70 : (tipo === 'NAND' || tipo === 'NOR' || tipo === 'XOR') ? 80 : 68;

  let valores = new Array(nEntradas).fill(0);

  cont.innerHTML = `
    <div class="panel-control">
      <div class="marcador">🔌 Compuerta: <span>${config.nombreMostrar || tipo}</span></div>
      <div><button id="sm-btn-reproducir">▶️ Probar todas las combinaciones</button></div>
    </div>
    <div class="sm-circuito">
      <div class="sm-entradas" id="sm-entradas"></div>
      <svg class="sm-compuerta" viewBox="0 0 ${anchoSVG} 60">${forma()}</svg>
      <div class="sm-salida">
        <div class="sm-foco" id="sm-foco"></div>
        <div class="sm-valor-salida">Salida = <span id="sm-valor-salida">0</span></div>
      </div>
    </div>
    ${config.mostrarTabla !== false ? `<table class="sm-tabla" id="sm-tabla"></table>` : ''}
  `;

  const entradasDiv = cont.querySelector('#sm-entradas');
  const foco = cont.querySelector('#sm-foco');
  const valorSalidaEl = cont.querySelector('#sm-valor-salida');
  const tabla = cont.querySelector('#sm-tabla');
  const btnReproducir = cont.querySelector('#sm-btn-reproducir');

  function renderEntradas() {
    entradasDiv.innerHTML = valores.map((v, i) => `
      <button class="sm-switch ${v ? 'on' : ''}" data-idx="${i}">${etiquetas[i]} = ${v}</button>
    `).join('');
    entradasDiv.querySelectorAll('.sm-switch').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        valores[idx] = valores[idx] ? 0 : 1;
        actualizar();
      });
    });
  }

  function combinaciones() {
    const filas = [];
    const total = Math.pow(2, nEntradas);
    for (let i = 0; i < total; i++) {
      const combo = [];
      for (let b = nEntradas - 1; b >= 0; b--) combo.push((i >> b) & 1);
      filas.push(combo);
    }
    return filas;
  }

  function renderTabla() {
    if (!tabla) return;
    const filas = combinaciones();
    let html = '<tr>' + etiquetas.map(e => `<th>${e}</th>`).join('') + '<th>Salida</th></tr>';
    filas.forEach(fila => {
      const salida = config.funcion(...fila);
      const esActual = fila.every((v, i) => v === valores[i]);
      html += `<tr class="${esActual ? 'sm-fila-actual' : ''}">` +
        fila.map(v => `<td>${v}</td>`).join('') +
        `<td><strong>${salida}</strong></td></tr>`;
    });
    tabla.innerHTML = html;
  }

  function actualizar() {
    renderEntradas();
    const salida = config.funcion(...valores);
    valorSalidaEl.textContent = salida;
    foco.classList.toggle('encendido', !!salida);
    renderTabla();
  }

  let reproduciendo = false;
  btnReproducir.addEventListener('click', () => {
    if (reproduciendo) return;
    reproduciendo = true;
    const filas = combinaciones();
    let i = 0;
    const paso = () => {
      if (i >= filas.length) { reproduciendo = false; return; }
      valores = [...filas[i]];
      actualizar();
      i++;
      setTimeout(paso, 900);
    };
    paso();
  });

  renderEntradas();
  actualizar();
}

/* ===========================================================
   FORMATO DE CONFIGURACIÓN (config):
   {
     contenedorId: "app",
     tipo: "AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR" | "ENABLE",
     nombreMostrar: "AND",              // texto que se muestra (opcional, por defecto = tipo)
     numEntradas: 2,                     // 1 o 2
     etiquetasEntradas: ["A","B"],       // opcional
     funcion: (a, b) => (a && b) ? 1 : 0, // lógica de la compuerta
     mostrarTabla: true                  // opcional, por defecto true
   }
   =========================================================== */
