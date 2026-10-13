/* ===========================================================
   MOTOR: ENTREGA (formulario de respuestas -> Google Sheets)
   Uso: IniciarEntrega(config) — ver README al final del archivo.
   Requiere que assets/config.js se cargue ANTES que este archivo,
   definiendo la constante APPS_SCRIPT_URL.
   =========================================================== */

function IniciarEntrega(config) {
  const cont = document.getElementById(config.contenedorId || 'app');
  const preguntas = config.preguntas;
  const ACEPTA_ARCHIVOS = '.jpg,.jpeg,.png,image/jpeg,image/png,.pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const EXT_PERMITIDAS = ['jpg', 'jpeg', 'png', 'pdf', 'docx'];
  const MAX_MB_ARCHIVO = 8;     // límite por archivo (PDF/DOCX; las imágenes se comprimen antes de enviar)
  const MAX_MB_TOTAL = 30;      // límite total por envío (el Web App de Google acepta ~50 MB)

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
    if (p.tipo === 'archivos') {
      return `
        <div class="ent-campo">
          <label for="ent-${p.id}">${numero}. ${p.texto}</label>
          <textarea id="ent-${p.id}" rows="3" placeholder="Escriba su respuesta aquí (opcional si adjunta archivos o un enlace)"></textarea>
          <input type="url" id="ent-${p.id}-enlace" class="ent-enlace" placeholder="Enlace (opcional): CircuitVerse, Google Drive, OneDrive...">
          <input type="file" id="ent-${p.id}-archivos" multiple accept="${ACEPTA_ARCHIVOS}">
          <ul class="ent-lista-archivos" id="ent-${p.id}-lista"></ul>
          <span class="ent-ayuda">📎 Puede adjuntar uno o varios archivos: imágenes (JPG o PNG), Word (DOCX) o PDF. Máximo ${MAX_MB_ARCHIVO} MB por archivo.</span>
        </div>`;
    }
    if (p.tipo === 'clasificacion') {
      return `
        <div class="ent-campo ent-clasificacion" id="ent-clasif-${p.id}">
          <label>${numero}. ${p.texto}</label>
          <button type="button" class="ent-btn-cargar" data-target="${p.id}">🔄 Cargar mis términos de la pregunta anterior</button>
          <span class="ent-ayuda">Haga clic en un término para seleccionarlo y luego haga clic en la categoría donde desea clasificarlo. Puede hacer clic en un término ya clasificado para devolverlo a la lista.</span>
          <div class="ent-clasif-pool" id="ent-pool-${p.id}"></div>
          <div class="ent-clasif-categorias" id="ent-cats-${p.id}"></div>
          <textarea id="ent-${p.id}" rows="3" style="display:none" readonly></textarea>
        </div>`;
    }
    return `
      <div class="ent-campo">
        <label for="ent-${p.id}">${numero}. ${p.texto}</label>
        <textarea id="ent-${p.id}" rows="3" placeholder="Escriba su respuesta aquí"></textarea>
      </div>`;
  }

  function setupClasificacion(p) {
    const pool = cont.querySelector('#ent-pool-' + p.id);
    const catsContainer = cont.querySelector('#ent-cats-' + p.id);
    const hidden = cont.querySelector('#ent-' + p.id);
    const btnCargar = cont.querySelector('.ent-btn-cargar[data-target="' + p.id + '"]');

    let terminos = [];
    let asignaciones = {};
    let seleccionado = null;

    catsContainer.innerHTML = p.categorias.map(cat => `
      <div class="ent-clasif-categoria" data-cat="${cat}">
        <h4>${cat}</h4>
        <div class="ent-clasif-lista" data-cat-lista="${cat}"></div>
      </div>`).join('');

    function actualizarHidden() {
      const partes = Object.entries(asignaciones).map(([t, c]) => `${t} → ${c}`);
      hidden.value = partes.length ? partes.join('; ') : '';
    }

    function renderPool() {
      const pendientes = terminos.filter(t => !(t in asignaciones));
      pool.innerHTML = pendientes.length
        ? pendientes.map(t => `<button type="button" class="ent-chip${t === seleccionado ? ' ent-chip-seleccionado' : ''}" data-term="${t}">${t}</button>`).join('')
        : '<span class="ent-ayuda">✅ Ya clasificó todos sus términos.</span>';
    }

    function renderAsignados() {
      p.categorias.forEach(cat => {
        const lista = catsContainer.querySelector('[data-cat-lista="' + cat + '"]');
        const terms = Object.entries(asignaciones).filter(([, c]) => c === cat).map(([t]) => t);
        lista.innerHTML = terms.map(t => `<button type="button" class="ent-chip ent-chip-asignado" data-term="${t}">${t} ✕</button>`).join('');
      });
    }

    function refrescar() {
      renderPool();
      renderAsignados();
      actualizarHidden();
    }

    btnCargar.addEventListener('click', () => {
      const origenTextarea = cont.querySelector('#ent-' + p.origenId);
      const valor = origenTextarea ? origenTextarea.value : '';
      const nuevos = valor.split(/[,;\n]+/).map(t => t.trim()).filter(Boolean);
      // Conserva las asignaciones de términos que sigan presentes; descarta las demás.
      const nuevasAsignaciones = {};
      nuevos.forEach(t => { if (t in asignaciones) nuevasAsignaciones[t] = asignaciones[t]; });
      terminos = [...new Set(nuevos)];
      asignaciones = nuevasAsignaciones;
      seleccionado = null;
      refrescar();
    });

    pool.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-term]');
      if (!btn) return;
      const term = btn.getAttribute('data-term');
      seleccionado = (seleccionado === term) ? null : term;
      renderPool();
    });

    catsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.ent-chip-asignado');
      if (chip) {
        delete asignaciones[chip.getAttribute('data-term')];
        refrescar();
        return;
      }
      const categoriaDiv = e.target.closest('.ent-clasif-categoria');
      if (categoriaDiv && seleccionado) {
        asignaciones[seleccionado] = categoriaDiv.getAttribute('data-cat');
        seleccionado = null;
        refrescar();
      }
    });

    refrescar();
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

  function extension(nombre) {
    const partes = String(nombre).toLowerCase().split('.');
    return partes.length > 1 ? partes.pop() : '';
  }

  function setupArchivos(p) {
    const input = cont.querySelector('#ent-' + p.id + '-archivos');
    const lista = cont.querySelector('#ent-' + p.id + '-lista');
    input.addEventListener('change', () => {
      const rechazados = [];
      const validos = Array.from(input.files).filter(f => {
        const okTipo = EXT_PERMITIDAS.indexOf(extension(f.name)) !== -1;
        const okTam = f.size <= MAX_MB_ARCHIVO * 1024 * 1024;
        if (!okTipo) rechazados.push(`${f.name} (tipo no permitido)`);
        else if (!okTam) rechazados.push(`${f.name} (pesa más de ${MAX_MB_ARCHIVO} MB)`);
        return okTipo && okTam;
      });
      if (rechazados.length) {
        alert('Estos archivos no se pueden adjuntar:\n- ' + rechazados.join('\n- ') + '\n\nSolo se aceptan JPG, PNG, DOCX o PDF de hasta ' + MAX_MB_ARCHIVO + ' MB.');
      }
      input._validos = validos;
      lista.innerHTML = validos.map(f => `<li>📄 ${f.name} <span class="ent-ayuda">(${(f.size / 1024 / 1024).toFixed(1)} MB)</span></li>`).join('');
    });
  }

  preguntas.forEach(p => {
    if (p.tipo === 'clasificacion') setupClasificacion(p);
    if (p.tipo === 'archivos') setupArchivos(p);
  });

  function recolectarTexto() {
    let texto = `Nombre: ${cont.querySelector('#ent-nombre').value}\nSemana: ${config.semana}\nFecha: ${new Date().toLocaleString()}\n\n`;
    preguntas.forEach((p, idx) => {
      texto += `${idx + 1}. ${p.texto}\n${cont.querySelector('#ent-' + p.id).value}\n`;
      if (p.tipo === 'archivos') {
        const enlace = cont.querySelector('#ent-' + p.id + '-enlace').value.trim();
        const archivos = cont.querySelector('#ent-' + p.id + '-archivos')._validos || [];
        if (enlace) texto += `Enlace: ${enlace}\n`;
        if (archivos.length) texto += `Archivos (adjúntelos al correo): ${archivos.map(f => f.name).join(', ')}\n`;
      }
      texto += '\n';
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

  function leerComoDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
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

    for (const p of preguntas) {
      if (p.tipo !== 'archivos') continue;
      const enlace = cont.querySelector('#ent-' + p.id + '-enlace').value.trim();
      if (enlace && !/^https?:\/\/\S+$/i.test(enlace)) {
        alert('El enlace de la pregunta "' + p.texto.substring(0, 60) + '..." no es válido. Debe empezar con http:// o https://');
        return;
      }
    }

    btnEnviar.disabled = true;
    btnEnviar.textContent = '⏳ Enviando...';

    try {
      const respuestas = {};
      const fotos = {};
      const nombresArchivo = {};
      let bytesTotales = 0;
      for (const p of preguntas) {
        respuestas[p.texto] = cont.querySelector('#ent-' + p.id).value.trim();
        if (p.tipo === 'foto') {
          const fileInput = cont.querySelector('#ent-' + p.id + '-foto');
          if (fileInput.files && fileInput.files[0]) {
            fotos[p.texto] = await comprimirImagen(fileInput.files[0]);
          }
        }
        if (p.tipo === 'archivos') {
          const enlace = cont.querySelector('#ent-' + p.id + '-enlace').value.trim();
          if (enlace) respuestas[p.texto + ' (enlace)'] = enlace;
          const archivos = cont.querySelector('#ent-' + p.id + '-archivos')._validos || [];
          for (let i = 0; i < archivos.length; i++) {
            const f = archivos[i];
            const ext = extension(f.name);
            const esImagen = ext === 'jpg' || ext === 'jpeg' || ext === 'png';
            const dataUrl = esImagen ? await comprimirImagen(f, 1600, 0.8) : await leerComoDataURL(f);
            bytesTotales += dataUrl.length;
            // Cada archivo va con su propia clave para que el Web App lo guarde en Drive.
            const clave = `${p.texto} (archivo ${i + 1})`;
            fotos[clave] = dataUrl;
            nombresArchivo[clave] = esImagen ? f.name.replace(/\.[^.]+$/, '') + '.jpg' : f.name;
          }
        }
      }

      if (bytesTotales > MAX_MB_TOTAL * 1024 * 1024 * 1.37) {
        alert(`Los archivos adjuntos suman más de ${MAX_MB_TOTAL} MB. Quite algunos, comprima los PDF o comparta un enlace de Drive en su lugar.`);
        btnEnviar.disabled = false;
        btnEnviar.textContent = '📤 Enviar mis respuestas';
        return;
      }

      const payload = { nombre, semana: config.semana, respuestas, fotos, nombresArchivo };

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
       { id: "p3", texto: "Entregue su circuito...", tipo: "archivos" }, // texto + enlace + varios archivos (JPG, PNG, DOCX, PDF)
       ...
     ]
   }
   =========================================================== */
