/* ===========================================================
   MOTOR: MEMORAMA (voltear cartas para encontrar parejas)
   Uso: IniciarMemorama(config) — ver README al final del archivo.
   =========================================================== */

function IniciarMemorama(config) {
  const cont = document.getElementById(config.contenedorId || 'app');
  const totalParejas = config.parejas.length;

  cont.innerHTML = `
    <div class="panel-control">
      <div class="marcador">✅ Parejas: <span id="mm-contador">0</span> / ${totalParejas}</div>
      <div class="marcador">🔁 Intentos: <span id="mm-intentos">0</span></div>
      <div class="marcador">⏱️ Tiempo: <span id="mm-cronometro">00:00</span></div>
      <div><button id="mm-btn-reiniciar" class="secundario">Reiniciar</button></div>
    </div>
    <div id="mm-tablero" class="mm-tablero"></div>
    <div id="mm-mensaje-final" class="mensaje-final">🎉 ¡Muy bien! Encontraste todas las parejas. 🎉</div>
  `;

  const tablero = cont.querySelector('#mm-tablero');
  const contadorEl = cont.querySelector('#mm-contador');
  const intentosEl = cont.querySelector('#mm-intentos');
  const cronometroEl = cont.querySelector('#mm-cronometro');
  const mensajeFinal = cont.querySelector('#mm-mensaje-final');
  const btnReiniciar = cont.querySelector('#mm-btn-reiniciar');

  let cartas, parejasEncontradas, intentos, segundos, intervalo, volteadas, bloqueado;

  function construirCartas() {
    let arr = [];
    config.parejas.forEach((p, i) => {
      arr.push({ pareja: i, texto: p.a, icono: p.iconoA || '🔹' });
      arr.push({ pareja: i, texto: p.b, icono: p.iconoB || '🔸' });
    });
    return arr.sort(() => Math.random() - 0.5);
  }

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

  function render() {
    tablero.innerHTML = cartas.map((c, idx) => `
      <div class="mm-carta" data-idx="${idx}">
        <div class="mm-cara mm-frente">❔</div>
        <div class="mm-cara mm-reverso"><span class="mm-icono">${c.icono}</span><span>${c.texto}</span></div>
      </div>
    `).join('');

    tablero.querySelectorAll('.mm-carta').forEach(el => {
      el.addEventListener('click', () => manejarClic(el));
    });
  }

  function manejarClic(el) {
    const idx = parseInt(el.dataset.idx, 10);
    if (bloqueado || el.classList.contains('volteada') || el.classList.contains('resuelta')) return;
    iniciarCronometro();
    el.classList.add('volteada');
    volteadas.push({ el, idx });

    if (volteadas.length === 2) {
      intentos++;
      intentosEl.textContent = intentos;
      bloqueado = true;
      const [c1, c2] = volteadas;
      if (cartas[c1.idx].pareja === cartas[c2.idx].pareja) {
        setTimeout(() => {
          c1.el.classList.add('resuelta');
          c2.el.classList.add('resuelta');
          parejasEncontradas++;
          contadorEl.textContent = parejasEncontradas;
          volteadas = [];
          bloqueado = false;
          if (parejasEncontradas === totalParejas) {
            detenerCronometro();
            mensajeFinal.style.display = 'block';
            if (typeof config.alCompletar === 'function') config.alCompletar(segundos, intentos);
          }
        }, 500);
      } else {
        setTimeout(() => {
          c1.el.classList.remove('volteada');
          c2.el.classList.remove('volteada');
          volteadas = [];
          bloqueado = false;
        }, 900);
      }
    }
  }

  function reiniciar() {
    detenerCronometro();
    cartas = construirCartas();
    parejasEncontradas = 0; intentos = 0; segundos = 0; volteadas = []; bloqueado = false;
    contadorEl.textContent = '0';
    intentosEl.textContent = '0';
    cronometroEl.textContent = '00:00';
    mensajeFinal.style.display = 'none';
    render();
  }

  btnReiniciar.addEventListener('click', reiniciar);
  reiniciar();
}

/* ===========================================================
   FORMATO DE CONFIGURACIÓN (config):
   {
     contenedorId: "app",
     parejas: [
       { a: "AND", b: "Salida 1 solo si ambas entradas son 1", iconoA: "🔷", iconoB: "📘" }, ...
     ],
     alCompletar: function(segundosTotales, intentos) { ... }   // opcional
   }
   =========================================================== */
