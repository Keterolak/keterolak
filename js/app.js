/* ============================================
   KETEROLAK - app.js
   Lógica general del sitio.

   Sistema de "Continuar leyendo":
   guarda en localStorage el progreso de lectura
   (capítulo, ruta y posición de scroll) de forma
   INDEPENDIENTE por cada historia/temporada, para
   que el usuario pueda tener distintos progresos en
   paralelo (Temporada 1, Orígenes, Especiales, etc).

   El progreso se guarda en un único objeto con esta
   forma:
   {
     "t1":        { chapter, path, scroll, timestamp },
     "origenes":  { chapter, path, scroll, timestamp },
     ...
   }

   La clave de cada historia es el valor de
   data-story del <article class="capitulo"> del
   capítulo (ej: "t1", "t2", "origenes", "especiales").
   ============================================ */

(function () {
  "use strict";

  var STORAGE_KEY = "keterolak_progreso_historias";
  var STORAGE_KEY_LEGACY = "keterolak_progreso";

  function obtenerMapaProgreso() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function guardarMapaProgreso(mapa) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapa));
    } catch (e) {
      /* localStorage no disponible: se ignora silenciosamente */
    }
  }

  // Migra un progreso guardado con el sistema anterior
  // (una sola historia, sin distinguir por temporada)
  // para que no se pierda al actualizar el sitio.
  function migrarProgresoAnterior() {
    var mapa = obtenerMapaProgreso();
    try {
      var raw = localStorage.getItem(STORAGE_KEY_LEGACY);
      if (!raw) return mapa;

      var anterior = JSON.parse(raw);
      if (anterior && anterior.story && !mapa[anterior.story]) {
        mapa[anterior.story] = {
          chapter: anterior.chapter,
          path: anterior.path,
          scroll: anterior.scroll,
          timestamp: anterior.timestamp || Date.now()
        };
        guardarMapaProgreso(mapa);
      }
      localStorage.removeItem(STORAGE_KEY_LEGACY);
    } catch (e) {
      /* Si algo falla en la migración, seguimos sin romper nada */
    }
    return mapa;
  }

  function guardarProgreso(articulo) {
    var story = articulo.dataset.story;
    if (!story) return;

    var mapa = obtenerMapaProgreso();
    mapa[story] = {
      chapter: articulo.dataset.chapter,
      path: window.location.pathname,
      scroll: window.scrollY,
      timestamp: Date.now()
    };
    guardarMapaProgreso(mapa);
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

  // De todas las historias con progreso guardado,
  // devuelve la más reciente (para el botón "global"
  // de la portada, que no pertenece a ninguna historia
  // en particular).
  function entradaMasReciente(mapa) {
    var claves = Object.keys(mapa);
    if (!claves.length) return null;

    var masReciente = null;
    claves.forEach(function (clave) {
      var entrada = mapa[clave];
      if (!masReciente || (entrada.timestamp || 0) > (masReciente.timestamp || 0)) {
        masReciente = entrada;
      }
    });
    return masReciente;
  }

  // Activa cada botón ".boton-continuar-leyendo" que haya
  // en la página. Si el botón tiene data-continuar-scope
  // con el id de una historia (ej: "t1"), solo se activa
  // si esa historia puntual tiene progreso guardado. Si el
  // scope es "global" (o no tiene), se activa con el
  // progreso más reciente entre todas las historias.
  function inicializarBotonesContinuar(mapa) {
    var botones = document.querySelectorAll(".boton-continuar-leyendo");
    if (!botones.length) return;

    botones.forEach(function (boton) {
      var alcance = boton.getAttribute("data-continuar-scope");
      var entrada;

      if (alcance && alcance !== "global") {
        entrada = mapa[alcance];
      } else {
        entrada = entradaMasReciente(mapa);
      }

      if (!entrada || !entrada.path) return;

      boton.style.display = "inline-block";
      boton.setAttribute("href", entrada.path);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    inicializarCapitulo();
    var mapa = migrarProgresoAnterior();
    inicializarBotonesContinuar(mapa);
  });
})();
