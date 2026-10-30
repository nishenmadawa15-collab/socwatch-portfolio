/* Decide whether to load the WebGL hero. hero3d.js statically imports Three.js
   (~118KB), whose parse/eval + shader compile is the main contributor to Total
   Blocking Time on a throttled mobile CPU. On phones and tablets (<=880px) the
   globe is only a faint background anyway, so we show the static SVG fallback
   (CSS) and never load Three there — keeping mobile fast. Large screens with the
   room for the full animation load it as before.
   Using min-width:881px mirrors the 880px CSS breakpoint that swaps the canvas
   for the static SVG, so the two can never disagree. */
(function () {
  "use strict";
  if (window.matchMedia && window.matchMedia("(min-width: 881px)").matches) {
    import("./hero3d.js");
  }
})();
