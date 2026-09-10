# Fabtech — Semiconductor cleanroom hero

## Open immediately
Double-click **OPEN_ME.html** in a modern browser. All frontend code, libraries and Poppins fonts are embedded. No installation, internet connection or server required.

Scroll down to assemble and up to disassemble. Stop to hold the model. The right-side numbers jump to system stages. Home / End and Page Up / Page Down also work. The bottom-left control advances assembly or returns to the exploded view.

Use WebGL2 with hardware acceleration for the intended materials, reflections and shadows. If WebGL is disabled, a clearly labeled Three.js SVG compatibility view preserves the geometry and interaction with simplified appearance.

## Source
`index.html` contains the page, `style.css` the responsive typography and labels, and `scene.js` the readable Three.js geometry and GSAP timeline. `app.bundle.js` is prebuilt. `vendor/` and `fonts/` contain local dependencies. `build.mjs` rebuilds the bundle and OPEN_ME.html.

To edit: install Node.js, run `npm install`, edit the source, then `npm run build`. You can also serve the folder using `python -m http.server 8000` and open http://localhost:8000. This is optional static file serving, not an application backend.

## Animation
The independent THREE.Group names are HVAC_SYSTEM, TGRID_CEILING, CLEANROOM_PANELS_DOORS and RAISED_FLOORING. Geometry is batched by material only within each system. Perforations are instanced. Mobile reduces detail and caps pixel ratio.

GSAP ScrollTrigger maps the 560vh page scroll to a paused timeline with scrub:true. No autoplay, loop or time-based smoothing. Only scroll/resize/font/context events request rendering. The camera uses the same scroll state.

0–20% exploded hold; 20–45% initial convergence; 45–70% progressive assembly; 70–90% close gaps and transition camera; 90–97.5% precise docking; 97.5–100% headline reveal and final camera push-in.

Final group Y values are 3.05 / 2.80 / 0.50 / 0.00. Walls are 2.30 high, meeting the ceiling at 2.80 and floor tile tops at 0.50. This is reference-inspired prototype geometry, not a certified construction model.

## QA and limitations
Browser-inspected at 1363×936 and in a 390×844 responsive viewport. Checked endpoints, stage navigation, reverse assembly, frozen intermediate transforms, final headline, and mobile layout. Corrected mobile label overlap and headline spacing.

The QA browser disables WebGL. Geometry and interaction checks used the compatibility renderer. GPU reflections, shadows and frame rate are implemented but NOT visually/performance-verified. Automated wheel gestures timed out, although resulting page progress was observed. Keyboard and navigation-driven scrolling were tested.

The Fabtech text treatment is not an official logo asset; replace it with an approved brand SVG before production. No API, analytics, database, CMS or backend is included. Upstream dependency licenses are in `licenses/`.
