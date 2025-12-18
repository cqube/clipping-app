# Cómo Agregar Google Alerts al Clipping

Este documento explica cómo configurar Google Alerts para alimentar el dashboard de clipping de pesca.

## Paso 1: Crear Google Alerts

1. Ve a [google.com/alerts](https://www.google.com/alerts)
2. Inicia sesión con tu cuenta de Google
3. Crea alertas para las palabras clave que te interesen. Ejemplos:
   - "pesca Chile"
   - "ley de pesca"
   - "pesca artesanal"
   - "salmoneras"
   - "acuicultura Chile"

## Paso 2: Configurar para RSS

Para cada alerta:

1. Haz clic en "Mostrar opciones" (Show options)
2. En "Enviar a" (Deliver to), selecciona **RSS feed**
3. Haz clic en "Crear alerta" (Create Alert)

## Paso 3: Obtener la URL del RSS

1. Verás un ícono de RSS junto a tu alerta creada
2. Haz clic derecho en el ícono de RSS
3. Selecciona "Cop iar dirección del enlace" (Copy link address)
4. La URL se verá como: `https://www.google.com/alerts/feeds/YOUR_USER_ID/YOUR_ALERT_ID`

## Paso 4: Agregar al Scraper

1. Abre el archivo `services/scraper.js`
2. Busca la sección `GOOGLE_ALERTS_FEEDS` (línea ~18)
3. Agrega tus URLs de RSS:

\`\`\`javascript
const GOOGLE_ALERTS_FEEDS = [
    'https://www.google.com/alerts/feeds/12345/67890',
    'https://www.google.com/alerts/feeds/12345/67891',
    'https://www.google.com/alerts/feeds/08397670603095634428/18119852156385057077',
    'https://www.google.com/alerts/feeds/08397670603095634428/10693748374007497326',
    'https://www.google.com/alerts/feeds/08397670603095634428/10693748374007497326',
    'https://www.google.com/alerts/feeds/08397670603095634428/330466514247678387',
    'https://www.google.com/alerts/feeds/08397670603095634428/16468006218765930623',
    'https://www.google.com/alerts/feeds/08397670603095634428/2590044238413771770',
    'https://www.google.com/alerts/feeds/08397670603095634428/18339820440676763392',
    'https://www.google.com/alerts/feeds/08397670603095634428/10693748374007497711',
    'https://www.google.com/alerts/feeds/08397670603095634428/16468006218765934227',
    'https://www.google.com/alerts/feeds/08397670603095634428/10693748374007498663',
    'https://www.google.com/alerts/feeds/08397670603095634428/10693748374007498275',

   // Agrega más URLs aquí
];
\`\`\`

## Paso 5: Reiniciar y Probar

1. Reinicia el servidor si está corriendo
2. Haz clic en "Forzar Actualización" en el dashboard
3. Los artículos de Google Alerts aparecerán con la fuente "Google Alerts"

## Notas

- Las alertas pueden tardar unos minutos en poblarse con contenido después de crearlas
- El scraper solo guardará artículos que contengan palabras clave relacionadas con pesca
- Los artículos se clasificarán automáticamente en las categorías del dashboard
