/* ===========================================================
   MOTOR: QUIZ (opción múltiple con cronómetro y puntaje)
   Uso: IniciarQuiz(config) — ver README al final del archivo.
   =========================================================== */

function IniciarQuiz(config) {
  const cont = document.getElementById(config.contenedorId || 'app');
  const preguntas = config.preguntas;
  const total = preguntas.length;

  let indice = 0, aciertos = 0, segundos = 0, intervalo = null, respondida = false;

  cont.innerHTML = `
    <div class="panel-control">
      <div class="marcador">📋 Pregunta: <span id="qz-actual">1</span> / ${total}</div>
      <div class="marcador">✅ Aciertos: <span id="qz-aciertos">0</span></div>
      <div class="marcador">⏱️ Tiempo: <span id="qz-cronometro">00:00</span></div>
    </div>
    <div id="qz-pregunta-caja" class="qz-caja"></div>
    <div id="qz-mensaje-final" class="mensaje-final"></div>
  `;

  const cajaPregunta = cont.querySelector('#qz-pregunta-caja');
  const actualEl = cont.querySelector('#qz-actual');
  const aciertosEl = cont.querySelector('#qz-aciertos');
  const cronometroEl = cont.querySelector('#qz-cronometro');
  const mensajeFinal = cont.querySelector('#qz-mensaje-final');

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

  function renderPregunta() {
    respondida = false;
    const p = preguntas[indice];
    actualEl.textContent = indice + 1;
    cajaPregunta.innerHTML = `
      <h3 class="qz-pregunta">${p.pregunta}</h3>
      <div id="qz-opciones"></div>
      <button id="qz-siguiente" style="display:none; margin-top:10px;">
        ${indice === total - 1 ? 'Ver resultado final' : 'Siguiente pregunta'}
      </button>
    `;
    const opcionesDiv = cajaPregunta.querySelector('#qz-opciones');
    opcionesDiv.innerHTML = p.opciones.map((op, i) =>
      `<button class="opcion" data-idx="${i}">${op}</button>`
    ).join('');

    opcionesDiv.querySelectorAll('.opcion').forEach(btn => {
      btn.addEventListener('click', () => {
        if (respondida) return;
        respondida = true;
        iniciarCronometro();
        const idx = parseInt(btn.dataset.idx, 10);
        opcionesDiv.querySelectorAll('.opcion').forEach((b, i) => {
          b.disabled = true;
          if (i === p.correcta) b.classList.add('correcta');
          else if (i === idx) b.classList.add('incorrecta');
        });
        if (idx === p.correcta) { aciertos++; aciertosEl.textContent = aciertos; }
        cajaPregunta.querySelector('#qz-siguiente').style.display = 'inline-block';
      });
    });

    cajaPregunta.querySelector('#qz-siguiente').addEventListener('click', () => {
      indice++;
      if (indice < total) renderPregunta();
      else finalizar();
    });
  }

  function finalizar() {
    detenerCronometro();
    cajaPregunta.style.display = 'none';
    const porcentaje = Math.round((aciertos / total) * 100);
    mensajeFinal.style.display = 'block';
    mensajeFinal.innerHTML = `🎉 ¡Quiz completado! Obtuviste ${aciertos} de ${total} (${porcentaje}%) en ${cronometroEl.textContent}. 🎉`;
    if (typeof config.alCompletar === 'function') config.alCompletar(aciertos, total, segundos);
  }

  renderPregunta();
}

/* ===========================================================
   FORMATO DE CONFIGURACIÓN (config):
   {
     contenedorId: "app",
     preguntas: [
       { pregunta: "¿...?", opciones: ["A", "B", "C", "D"], correcta: 2 }, ...
     ],
     alCompletar: function(aciertos, total, segundos) { ... }  // opcional
   }
   =========================================================== */
