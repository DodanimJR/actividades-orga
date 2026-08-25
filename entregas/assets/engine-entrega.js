/* ===========================================================
   MOTOR: ENTREGA (formulario de respuestas -> Google Sheets)
   Uso: IniciarEntrega(config) — ver README al final del archivo.
   Requiere que assets/config.js se cargue ANTES que este archivo,
   definiendo la constante APPS_SCRIPT_URL.
   =========================================================== */

function IniciarEntrega(config) {
  const cont = document.getElementById(config.contenedorId || 'app');
  const preguntas = config.preguntas;

  function campoHTML(p, idx) {
    const numero = idx + 1;
    if (p.tipo === 'foto') {
      return `
        <div class="ent-campo">
          <label for="ent-${p.id}">${numero}. ${p.texto}</label>
          <textarea id="ent-${p.id}" rows="3" placeholder="Puede describir aquí su respuesta y/o adjuntar una foto abajo"></textarea>
          <input type="file" id="ent-${p.id}-foto" accept="image/*" capture="environment">
          <span class="ent-ayuda">📷 Puede tomar una foto de su hoja/pantalla o subir una imagen ya guardada (opcional si ya describió su respuesta en el texto).</span>
        </div>`;
    }
    return `
      <div class="ent-campo">
        <label for="ent-${p.id}">${numero}. ${p.texto}</label>
        <textarea id="ent-${p.id}" rows="3" placeholder="Escriba su respuesta aquí"></textarea>
      </div>`;
  }

  cont.innerHTML = `
    <form id="ent-form">
      <div class="ent-campo ent-campo-nombre">
        <label for="ent-nombre">Nombre completo *</label>
        <input type="text" id="ent-nombre" required placeholder="Escriba su nombre completo">
      </div>
      ${preguntas.map(campoHTML).join('')}
      <div class="ent-botones">
        <button type="submit" id="ent-btn-enviar">📤 Enviar mis respuestas</button>
        <button type="button" id="ent-btn-descargar" class="secundario">💾 Descargar respaldo (.txt)</button>
      </div>
    </form>
    <div id="ent-mensaje" class="mensaje-final"></div>
  `;

  const form = cont.querySelector('#ent-form');
  const mensaje = cont.querySelector('#ent-mensaje');
  const btnDescargar = cont.querySelector('#ent-btn-descargar');
  const btnEnviar = cont.querySelector('#ent-btn-enviar');

  function recolectarTexto() {
    let texto = `Nombre: ${cont.querySelector('#ent-nombre').value}\nSemana: ${config.semana}\nFecha: ${new Date().toLocaleString()}\n\n`;
    preguntas.forEach((p, idx) => {
      texto += `${idx + 1}. ${p.texto}\n${cont.querySelector('#ent-' + p.id).value}\n\n`;
    });
    return texto;
  }

  btnDescargar.addEventListener('click', () => {
    const blob = new Blob([recolectarTexto()], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const nombreArchivo = (cont.querySelector('#ent-nombre').value || 'estudiante').replace(/[^a-zA-Z0-9 ]/g, '');
    a.download = `Respuestas_${config.semana.replace(/\s+/g, '_')}_${nombreArchivo}.txt`;
    a.click();
  });

  function comprimirImagen(file, maxSize = 1000, calidad = 0.7) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > h && w > maxSize) { h = h * (maxSize / w); w = maxSize; }
          else if (h >= w && h > maxSize) { w = w * (maxSize / h); h = maxSize; }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', calidad));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = cont.querySelector('#ent-nombre').value.trim();
    if (!nombre) {
      alert('Por favor escriba su nombre completo.');
      return;
    }
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf('PEGAR_AQUI') !== -1) {
      alert('Este formulario todavía no está conectado. Avise al profesor (falta configurar assets/config.js).');
      return;
    }

    btnEnviar.disabled = true;
    btnEnviar.textContent = '⏳ Enviando...';

    try {
      const respuestas = {};
      const fotos = {};
      for (const p of preguntas) {
        respuestas[p.texto] = cont.querySelector('#ent-' + p.id).value.trim();
        if (p.tipo === 'foto') {
          const fileInput = cont.querySelector('#ent-' + p.id + '-foto');
          if (fileInput.files && fileInput.files[0]) {
            fotos[p.texto] = await comprimirImagen(fileInput.files[0]);
          }
        }
      }

      const payload = { nombre, semana: config.semana, respuestas, fotos };

      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      form.style.display = 'none';
      mensaje.style.display = 'block';
      mensaje.textContent = `✅ ¡Enviado! Gracias, ${nombre}. Sus respuestas de "${config.semana}" fueron registradas.`;
    } catch (err) {
      alert('Hubo un problema de conexión. Use el botón "Descargar respaldo" y envíe ese archivo al profesor por correo, o intente de nuevo en unos minutos.');
      btnEnviar.disabled = false;
      btnEnviar.textContent = '📤 Enviar mis respuestas';
    }
  });
}

/* ===========================================================
   FORMATO DE CONFIGURACIÓN (config):
   {
     contenedorId: "app",
     semana: "Semana 2",              // debe coincidir con el nombre que quiere ver como pestaña en la Hoja
     preguntas: [
       { id: "p1", texto: "Enunciado de la pregunta...", tipo: "texto" },
       { id: "p2", texto: "Dibuje su circuito...", tipo: "foto" },   // agrega un campo de foto además del texto
       ...
     ]
   }
   =========================================================== */
