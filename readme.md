# Input Text Matcher - Extensión de Chrome

## Descripción
Input Text Matcher es una extensión de Chrome diseñada para automatizar la búsqueda y selección de elementos input en páginas web basándose en el texto de sus etiquetas asociadas. Esta herramienta es especialmente útil para formularios largos donde necesitas marcar múltiples casillas basadas en texto específico.

## Tecnologías Utilizadas
- **Manifest V3**: La extensión está construida utilizando la última versión del sistema de manifiestos de Chrome.
- **JavaScript Vanilla**: Implementación pura de JavaScript sin dependencias externas.
- **Chrome Extension API**: Utilización de las APIs nativas de Chrome para:
  - Comunicación entre scripts (chrome.runtime)
  - Manipulación de pestañas (chrome.tabs)
  - Almacenamiento local (chrome.storage)
- **CSS**: Estilos personalizados para la interfaz de usuario

## Estructura del Proyecto
```plaintext
webexte/
├── manifest.json        # Configuración de la extensión
├── popup.html          # Interfaz principal de la extensión
├── popup.js           # Lógica de la interfaz de usuario
├── content.js         # Script de contenido para interactuar con la página web
├── background.js      # Script de fondo para la gestión de eventos
├── styles.css         # Estilos de la interfaz
└── icons/             # Iconos de la extensión