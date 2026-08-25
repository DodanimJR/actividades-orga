/* ===========================================================
   MOTOR: EMPAREJAR (arrastrar/clic piezas hasta la casilla correcta)
   Uso: IniciarEmparejar(config) — ver README al final del archivo.
   =========================================================== */

function IniciarEmparejar(config) {
  const cont = document.getElementById(config.contenedorId || 'app');
  const total = config.slots.length;

  // --- Construir HTML ---
  cont.innerHTML = `
    <div class="panel-control">
      <div class="marcador">✅ Correctas: <span id="ep-contador">0</span> / ${total}</div>
      <div class="marcador">⏱️ Tiempo: <span id="ep-cronometro">00:00</span></div>
      <div>
        <button id="ep-btn-iniciar">Iniciar</button>
        <button id="ep-btn-reiniciar" class="secundario">Reiniciar</button>
      </div>
    </div>
    <p class="banco-titulo">Banco de piezas</p>
    <div id="ep-banco" class="ep-banco"></div>
    <div id="ep-tablero" class="ep-tablero"></div>
    <div id="ep-mensaje-final" class="mensaje-final">🎉 ¡Excelente! Completaste la actividad correctamente. 🎉</div>
  `;

  const banco = cont.querySelector('#ep-banco');
  const tablero = cont.querySelector('#ep-tablero');
  const contadorEl = cont.querySelector('#ep-contador');
  const cronometroEl = cont.querySelector('#ep-cronometro');
  const mensajeFinal = cont.querySelector('#ep-mensaje-final');
  const btnIniciar = cont.querySelector('#ep-btn-iniciar');
  const btnReiniciar = cont.querySelector('#ep-btn-reiniciar');

  function piezaHTML(p) {
    return `<div class="ep-pieza" draggable="true" data-tipo="${p.id}">
      <span class="ep-icono">${p.icono || '🔹'}</span>
      <span>${p.etiqueta}</span>
    </div>`;
  }

  function slotHTML(s) {
    return `<div class="ep-slot" data-correcto="${s.correcto}">
      <span class="ep-icono">${s.icono || '❔'}</span>
      <span>${s.pista}</span>
    </div>`;
  }

  // Mezclar piezas aleatoriamente para que no coincidan en orden con los slots
  const piezasMezcladas = [...config.piezas].sort(() => Math.random() - 0.5);
  banco.innerHTML = piezasMezcladas.map(piezaHTML).join('');
  tablero.innerHTML = config.slots.map(slotHTML).join('');

  const bancoOriginalHTML = banco.innerHTML;
  const slotsOriginalHTML = {};
  tablero.querySelectorAll('.ep-slot').forEach(s => slotsOriginalHTML[s.dataset.correcto] = s.innerHTML);

  let correctas = 0, segundos = 0, intervalo = null, piezaSeleccionada = null;

  function iniciarCronometro() {
    if (intervalo) return;
    intervalo = setInterval(() => {
      segundos++;
      const min = String(Math.floor(segundos / 60)).padStart(2, '0');
      const seg = String(segundos % 60).padStart(2, '0');
      cronometroEl.textContent = `${min}:${seg}`;
    }, 1000);
  }
  function detenerCronometro() { clearInterval(intervalo); intervalo = null; }
  btnIniciar.addEventListener('click', iniciarCronometro);

  function intentarColocar(pieza, slot) {
    if (slot.classList.contains('correcta')) return;
    iniciarCronometro();
    if (pieza.dataset.tipo === slot.dataset.correcto) {
      slot.innerHTML = pieza.innerHTML;
      slot.classList.add('correcta');
      pieza.remove();
      correctas++;
      contadorEl.textContent = correctas;
      if (correctas === total) {
        detenerCronometro();
        mensajeFinal.style.display = 'block';
        if (typeof config.alCompletar === 'function') config.alCompletar(segundos);
      }
    } else {
      slot.classList.add('incorrecta');
      setTimeout(() => slot.classList.remove('incorrecta'), 400);
    }
    if (piezaSeleccionada) { piezaSeleccionada.classList.remove('seleccionada'); piezaSeleccionada = null; }
  }

  banco.addEventListener('dragstart', (e) => {
    const pieza = e.target.closest('.ep-pieza');
    if (pieza) { e.dataTransfer.effectAllowed = 'move'; window._epPiezaArrastrada = pieza; }
  });

  tablero.querySelectorAll('.ep-slot').forEach(slot => {
    slot.addEventListener('dragover', (e) => e.preventDefault());
    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      const pieza = window._epPiezaArrastrada;
      if (pieza) intentarColocar(pieza, slot);
    });
    slot.addEventListener('click', () => {
      if (piezaSeleccionada) intentarColocar(piezaSeleccionada, slot);
    });
  });

  banco.addEventListener('click', (e) => {
    const pieza = e.target.closest('.ep-pieza');
    if (!pieza) return;
    if (piezaSeleccionada) piezaSeleccionada.classList.remove('seleccionada');
    if (piezaSeleccionada === pieza) { piezaSeleccionada = null; return; }
    piezaSeleccionada = pieza;
    pieza.classList.add('seleccionada');
  });

  btnReiniciar.addEventListener('click', () => {
    detenerCronometro();
    segundos = 0; correctas = 0; piezaSeleccionada = null;
    cronometroEl.textContent = '00:00';
    contadorEl.textContent = '0';
    mensajeFinal.style.display = 'none';
    banco.innerHTML = bancoOriginalHTML;
    tablero.querySelectorAll('.ep-slot').forEach(s => {
      s.innerHTML = slotsOriginalHTML[s.dataset.correcto];
      s.classList.remove('correcta', 'incorrecta');
    });
  });

  // Re-escanear slots tras reiniciar (delegación de eventos ya cubre drop/click porque están en 'tablero')
}

/* ===========================================================
   FORMATO DE CONFIGURACIÓN (config):
   {
     contenedorId: "app",           // id del <div> donde se dibuja la actividad
     piezas: [
       { id: "p1", etiqueta: "Texto de la pieza", icono: "🔢" }, ...
     ],
     slots: [
       { correcto: "p1", pista: "Descripción/pregunta que identifica a p1", icono: "❔" }, ...
     ],
     alCompletar: function(segundosTotales) { ... }   // opcional
   }
   Nota: el número de piezas debe ser igual al número de slots, y cada
   slot.correcto debe coincidir con el id de exactamente una pieza.
   =========================================================== */
