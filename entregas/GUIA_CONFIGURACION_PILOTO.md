# Guía Paso a Paso — Piloto de Entregas Digitales
## Organización Computacional (IS-237) — Ciclo III-2026

Esta guía conecta las 2 páginas piloto (Semana 2 y Semana 7) con tu propia Hoja de Cálculo de Google, de forma gratuita y sin límite de respuestas.

---

## Paso 1 — Crear la Hoja de Cálculo

1. Ve a **https://sheets.google.com** con tu cuenta de Google.
2. Crea una hoja en blanco y nómbrala, por ejemplo: **"Respuestas — Organización Computacional III-2026"**.

## Paso 2 — Pegar el código del backend

1. En esa hoja, ve a **Extensiones → Apps Script**.
2. Se abrirá un editor con un archivo `Código.gs` vacío (o con una función `myFunction` de ejemplo). **Borra todo su contenido.**
3. Abre el archivo `CODIGO_APPS_SCRIPT.gs.txt` (está en la carpeta `12_Actividades_Web/entregas/`), copia **todo** su contenido y pégalo en el editor de Apps Script.
4. Guarda con el ícono de disquete (o Ctrl+S). Puedes ponerle un nombre al proyecto, ej. "Backend Entregas IS-237".

## Paso 3 — Implementar como Aplicación Web

1. Arriba a la derecha, clic en **Implementar → Nueva implementación**.
2. En "Seleccionar tipo", haz clic en el ícono de engranaje ⚙️ y elige **"Aplicación web"**.
3. Configura:
   - **Descripción:** (opcional) "v1"
   - **Ejecutar como:** Yo (tu correo)
   - **Quién tiene acceso:** **Cualquier usuario**
4. Clic en **Implementar**.
5. Google te pedirá **autorizar permisos** (porque el script va a crear pestañas y guardar archivos en tu Drive). Aparecerá una pantalla de advertencia "Google no verificó esta app" — es normal porque es tu propio script. Clic en **Configuración avanzada** → **Ir a "Backend Entregas IS-237" (no seguro)** → **Permitir**.
6. Copia la **URL que termina en `/exec`** que te muestra (algo como `https://script.google.com/macros/s/AKfycbXXXXXXXXXXXXXXXXXXXX/exec`).

## Paso 4 — Conectar la URL al sitio web

1. Abre el archivo `12_Actividades_Web/entregas/assets/config.js`.
2. Reemplaza la línea:
   ```js
   const APPS_SCRIPT_URL = "PEGAR_AQUI_LA_URL_DE_TU_WEB_APP";
   ```
   por tu URL real, por ejemplo:
   ```js
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbXXXXXXXXXXXXXXXXXXXX/exec";
   ```
3. Guarda el archivo.

> 💡 Si prefieres, dame la URL cuando la tengas y yo hago este cambio por ti.

## Paso 5 — Publicar el cambio en GitHub Pages

Como el sitio ya está en `https://dodanimjr.github.io/actividades-orga/`, solo falta subir los archivos nuevos de la carpeta `12_Actividades_Web/entregas/` al mismo repositorio (misma forma en que subiste el resto):

- Si usas el navegador: sube la carpeta `entregas/` (con su subcarpeta `assets/`, `semana-02/`, `semana-07/`) al repositorio, en la raíz (al mismo nivel que `index.html` y `assets/`).
- Si usas Git:
  ```powershell
  cd "C:\Users\PatrickDodanimCastil\Documents\Orga\12_Actividades_Web"
  git add entregas index.html
  git commit -m "Piloto de entregas digitales (Semana 2 y 7)"
  git push
  ```

## Paso 6 — Probar que todo funciona

1. Abre `https://dodanimjr.github.io/actividades-orga/entregas/semana-02/index.html`.
2. Llena el campo de nombre y una o dos respuestas de prueba.
3. Clic en **"Enviar mis respuestas"**.
4. Ve a tu Hoja de Cálculo — debe haber aparecido una nueva pestaña llamada **"Semana 2"** con una fila con tu prueba.
5. Repite la prueba en la página de Semana 7, adjuntando una foto cualquiera, y verifica que en la hoja aparezca el enlace a la imagen (y que la imagen se vea bien al abrir el enlace).
6. Borra la fila de prueba antes de compartir el enlace con los estudiantes.

## Cómo revisar las respuestas

- Cada semana piloto tiene **su propia pestaña** en la Hoja de Cálculo.
- Cada fila = una entrega de un estudiante, con fecha/hora automática.
- Puedes ordenar/filtrar por nombre, agregar una columna extra de "Nota" o "Revisado ✅" para tu control manual.
- Los enlaces de fotos abren directo en Google Drive (carpeta "Entregas - Organizacion Computacional").

## Límites y consideraciones (para que no haya sorpresas)

- **Gratis y sin límite práctico** para el tamaño de un curso universitario (Google Apps Script permite decenas de miles de solicitudes al día en cuentas gratuitas).
- **No hay verificación de identidad**: cualquiera que tenga el enlace puede enviar una respuesta con cualquier nombre. Es una decisión consciente para mantenerlo simple (sin pedir inicio de sesión).
- El estudiante **no ve confirmación 100% garantizada** de que llegó (por una limitación técnica de cómo se conectan sitios estáticos con Apps Script) — por eso cada página muestra un mensaje de "¡Enviado!" tras el envío y ofrece un botón de "Descargar respaldo" como plan B.
- Si en algún momento cambias de cuenta de Google o necesitas una nueva URL, solo repite el Paso 3 y actualiza `config.js`.

## Siguientes pasos (después del piloto)

Si el piloto funciona bien, avísame y replico el mismo patrón para las 13 semanas restantes — cada una solo necesita su propia carpeta `semana-XX/index.html` con la lista de preguntas (reutilizando el mismo motor y el mismo backend).
