# MANÁ Bienes Raíces · Mapa inmersivo de El Salvador

Experiencia web de MANÁ Bienes Raíces: mapa de El Salvador por departamentos → mapa de calles del departamento con marcadores de casa (estilo Airbnb) → vuelo entre nubes → vista de dron → recorrido 360° dentro de la casa.

- HTML/CSS/JS sin build. Leaflet (mapa), GSAP (animación), Pannellum (visor 360°).
- Identidad según el manual de marca MANÁ: logo vectorial, azul #024C7E, verde #69B12F, Montserrat + Nunito Sans.
- Precarga en la pantalla de carga; videos y primer panorama de cada casa se descargan al entrar a su departamento.
- Responsive (móvil, tablet, escritorio), giroscopio en móviles, `prefers-reduced-motion`.

## Agregar o editar casas
Arreglo `PROPS` al inicio de `assets/js/mana.js` (departamento, coordenadas, precio, video y escenas 360°).

## Créditos
Cartografía: Natural Earth · Mapas: © colaboradores de OpenStreetMap · Panoramas 360°: Poly Haven (CC0) · Videos de dron: Coverr. Propiedades, precios y medidas son ilustrativos.
