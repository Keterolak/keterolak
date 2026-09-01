/* ============================================
   KETEROLAK - app.js
   Lógica general del sitio.
   Incluye la base para "Continuar leyendo":
   guarda en localStorage el último capítulo
   (y el scroll) que el usuario estaba leyendo.
   ============================================ */

(function () {
  "use strict";

  var STORAGE_KEY = "keterolak_progreso";

  function guardarProgreso(articulo) {
    var data = {
      story: articulo.dataset.story,
      chapter: articulo.dataset.chapter,
      path: window.location.pathname,
      scroll: window.scrollY,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      /* localStorage no disponible: se ignora silenciosamente */
    }
  }

  function leerProgreso() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function inicializarCapitulo() {
    var articulo = document.querySelector(
      'article.capitulo[data-continuar-leyendo="true"]'
    );
    if (!articulo) return;

    // Guarda progreso periódicamente mientras se scrollea.
    var guardando = false;
    window.addEventListener("scroll", function () {
      if (guardando) return;
      guardando = true;
      window.requestAnimationFrame(function () {
        guardarProgreso(articulo);
        guardando = false;
      });
    });

    // Guarda también al salir de la página.
    window.addEventListener("beforeunload", function () {
      guardarProgreso(articulo);
    });
  }

  function inicializarIndex() {
    var boton = document.querySelector(".boton-continuar-leyendo");
    var progreso = leerProgreso();
    if (!boton || !progreso) return;

    boton.style.display = "inline-block";
    boton.setAttribute("href", progreso.path);
  }

  document.addEventListener("DOMContentLoaded", function () {
    inicializarCapitulo();
    inicializarIndex();
  });
})();
