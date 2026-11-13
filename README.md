# Sal de la caverna

Juego de repaso de Filosofía (4.º ESO) para jugar en clase con una pantalla táctil y los móviles del alumnado.

- `host.html`: pantalla principal (pizarra/PIM). Muestra un QR y dirige la partida.
- `index.html`: mando para el móvil. Se entra escaneando el QR.

Seis rondas por equipos: test, duelos relámpago, tableros táctiles, detectores de bulos (con búsqueda de información), dilemas con debate y «¿quién soy?».

La sincronización usa un canal en tiempo real (Supabase Realtime, solo mensajes efímeros). No hay base de datos ni se guarda ningún dato de los participantes. La lista de clase, si se usa, vive solo en el navegador del docente.

Música y efectos generados con WebAudio; sin recursos de terceros salvo `supabase-js`, `qrcode-generator` y `three.js` (MIT), incluidos en `vendor/`. La pantalla principal dibuja una escena 3D (la caverna de Platón) que se desactiva sola en equipos poco potentes.
