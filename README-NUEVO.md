# 🎨 Adivina Colores Online

Juego multijugador en tiempo real basado en Mastermind. Descifra secuencias de colores únicos, compite contra otros jugadores y escala el ranking global. Firebase sync, sin dependencias pesadas.

## ✨ Características

### 🎮 Modos de Juego
- **Solo:** Juega contra la máquina con presión de tiempo
- **Multijugador:** Hasta 2 jugadores por sala con turnos alternados
- Sistema de 10 intentos máximo por jugador
- Secuencias de 4 colores únicos (sin repetición)
- Cronómetro de 20 segundos por turno

### 🎯 Mecánicas de Juego
- **6 colores disponibles:** Rojo, Azul, Verde, Amarillo, Naranja, Violeta
- **Sistema de pistas inteligente:**
  - ✓ Color correcto en posición correcta
  - ⚬ Color correcto en posición incorrecta
  - ❌ Tiempo agotado (penalización)
- **Selección numérica:** Orden visual 1→2→3→4
- **Deselección fácil:** Click para remover colores
- **Validación automática:** No permite más de 4 colores

### 🏆 Sistema de Puntuación Integral
- **Base:** 1000 puntos por victoria
- **Bonus Precisión:** Hasta +500 puntos (menos intentos usados)
- **Bonus Velocidad:** Hasta +300 puntos (tiempo de resolución)
- **Bonus Perfecto:** +200 puntos (primer intento <15s)
- **Acumulación persistente:** Puntuación total guardada en Firebase
- **Display en vivo:** Contador visible durante la partida

### 📊 Ranking y Estadísticas
- **Top 50 global:** Tabla ordenada por puntuación total
- **Podio destacado:** Top 3 con insignias oro/plata/bronce
- **Métricas personales:**
  - Puntuación acumulada
  - Partidas ganadas
  - Tasa de victoria (%)
- **Historial detallado:** Últimas 20 partidas con puntos
- **Highlight de usuario:** Tu ranking resaltado en lista

### 🎭 Final de Partida
- **Victoria:**
  - 🎉 Confeti animado (50 partículas con física)
  - 🎵 Melodía ascendente (Do-Mi-Sol-Do)
  - 📊 Desglose detallado de puntos obtenidos
  - 🔄 Opción de revancha inmediata
  
- **Derrota:**
  - 🔍 Revelación de secuencia correcta con números
  - 🎵 Acorde descendente
  - 💡 Tooltips con nombres de colores
  - 🔄 Motivación para reintentar

### 🌐 Sistema Multijugador

#### 🏠 Gestión de Salas
- **Códigos únicos:** 5 caracteres alfanuméricos
- **Lista en tiempo real:** Salas disponibles actualizadas automáticamente
- **Filtros inteligentes:** Solo salas con espacio disponible
- **Información detallada:** Jugadores actuales/máximos visibles

#### 🔗 Invitaciones y Compartir
- **Enlaces directos:** URLs únicas por sala (`?sala=XXXXX`)
- **Botón "Compartir Sala":** Visible solo en modo multijugador
- **Redes sociales:** WhatsApp, Facebook, Telegram integrados
- **Copiado rápido:** Un click al portapapeles
- **Auto-ingreso:** Los invitados se unen automáticamente tras login
- **Detección URL:** Reconoce códigos de sala en parámetros

#### 👤 Gestión de Jugadores
- **Identificación clara:** Marcador "(Tú)" para usuario actual
- **Indicador de turno:** Display prominente mostrando quién juega
- **Historial separado:** Intentos individuales por jugador
- **Estados diferenciados:** Bordes azules para jugador activo
- **Resultados sincronizados:** Victoria/derrota personalizada para cada uno
- **Cambio automático de turnos:** Cuando un jugador agota sus intentos

#### 💬 Chat en Tiempo Real
- **Mensajes instantáneos:** Firebase Realtime Database
- **Historial ordenado:** Por timestamp ascendente
- **Scroll automático:** Nuevos mensajes siempre visibles
- **Entrada rápida:** Envío con tecla Enter

### 🔄 Sistema de Revancha

#### 🗳️ Votación Inteligente
- **Modo Solo:** Decisión personal inmediata
- **Modo Multijugador:** Requiere unanimidad de jugadores
- **Modal automático:** Aparece al terminar la partida
- **Voto único:** Cada jugador vota solo una vez
- **Feedback en vivo:** Contador de votos actualizado

#### ✅ Resultados de Votación
- **Nueva partida (todos "Sí"):**
  - Nueva secuencia generada
  - Intentos reseteados a 0
  - Historial limpio
  - Primer jugador reinicia
  
- **Fin de sesión (alguien "No"):**
  - Mensaje de despedida personalizado
  - Auto-cierre del modal en 10s

### 🎵 Experiencia Audiovisual

#### 🔊 Sistema de Audio Web
- **Web Audio API:** Sonidos generados dinámicamente
- **8 tipos de sonidos:**
  - Click, acierto, error, victoria
  - Derrota, turno, tiempo, notificación
- **Control de usuario:** Botón para habilitar/deshabilitar
- **Persistencia:** Preferencia guardada en localStorage
- **Compatibilidad:** Funciona sin audio si no está soportado

#### 🎨 Animaciones y Efectos
- **Confeti animado:** Física realista con gravedad
- **Transiciones suaves:** CSS animations/transitions
- **Gradientes dinámicos:** Fondo con degradado
- **Loading states:** Indicadores visuales elegantes
- **Efectos hover:** Feedback interactivo en botones

### 📱 Diseño Responsivo
- **Desktop (1200px+):** Grid espaciado óptimo, gráfico amplio
- **Tablet (769-1199px):** Ajustes de espaciado, reflow automático
- **Mobile (480-768px):** Stack vertical, scroll horizontal en tablas
- **Small Mobile (<480px):** Ultra compacto, fuentes optimizadas

### 📚 Modal de Información Integrado
- **Acceso rápido:** Botón "ℹ️ Info del Juego"
- **Documentación completa:** Reglas, características, estrategias
- **Diseño responsivo:** Adaptado para todos los dispositivos
- **Overlay con blur:** Fondo desenfocado para enfoque
- **Controles intuitivos:** Cerrar con X, Escape o click fuera

## 🛠️ Tecnologías

### Frontend
- **HTML5** - Estructura semántica moderna
- **CSS3** - Diseño modular
  - CSS Grid y Flexbox
  - Variables CSS para temas
  - Animaciones con GPU
  - Media queries responsive
  - **10 archivos modulares** (base, juego, botones, modales, etc.)

- **JavaScript (ES6+ Vanilla)**
  - Módulos ES6 (import/export)
  - Async/await para Firebase
  - Event delegation eficiente
  - Web Audio API integrada
  - Canvas para confeti

### Backend/Base de Datos
- **Firebase Realtime Database** - Sincronización en tiempo real
- **Firebase SDK v10.12.2** - Última versión estable
- **onDisconnect** - Limpieza automática de jugadores
- **Listeners en tiempo real** - onValue para actualizaciones
- **Persistencia offline** - Funciona temporalmente sin conexión

### APIs Web
- **Web Audio API** - Generación de sonidos sintéticos
- **DOM API** - Manipulación avanzada de elementos
- **CSS Animation API** - Efectos visuales fluidos
- **Clipboard API** - Copiado de enlaces de invitación

## 📁 Estructura de Carpetas

```
juegos/
├── index.html              # HTML principal
├── juego.js                # Lógica completa del juego
├── juego.css               # Estilos legacy (pre-modular)
├── README.md               # Documentación original
├── README-estructura.md    # Guía de arquitectura
├── README-NUEVO.md         # Este archivo
│
├── css/                    # Estilos modulares
│   ├── main.css            # Importa todos los módulos
│   ├── base.css            # Estilos base y variables
│   ├── formularios.css     # Forms de crear/unir sala
│   ├── juego.css           # Área de juego y colores
│   ├── botones.css         # Estilos de botones
│   ├── modales.css         # Modales y overlays
│   ├── chat.css            # Sistema de chat
│   ├── autenticacion.css   # Login/registro
│   ├── ranking.css         # Sistema de ranking
│   └── responsivo.css      # Media queries
│
├── js/                     # JavaScript organizado
│   ├── juego-original.js   # Respaldo del código
│   ├── juego-limpio.js     # Versión comentada
│   ├── main.js             # Modular (en desarrollo)
│   └── config.js           # Variables de config
│
└── img/                    # Recursos visuales
    ├── icon.ico            # Favicon
    └── logo.png            # Logo del juego
```

## 🚀 Cómo Usar

### 1. Abrir Localmente

**Opción 1 - Archivo directo:**
```bash
# Simplemente abre index.html en tu navegador
# Funciona directamente con Firebase
```

**Opción 2 - Servidor local (recomendado):**
```bash
# Python 3
python -m http.server 5500

# Node.js (con http-server instalado)
npx http-server -p 5500

# VS Code - Live Server
# Click derecho en index.html → "Open with Live Server"

# Luego abre en navegador
# http://localhost:5500
```

### 2. Personalización Básica

**En `index.html`:**
- Edita el título en `<title>`
- Cambia el logo en `img/logo.png`
- Personaliza textos del modal de información

**Colores y estilos en `css/base.css`:**
```css
:root {
    --primary-color: #6a5acd;   /* Violeta principal */
    --accent-color: #ff6347;    /* Tomate para destacados */
    --bg-gradient-1: #667eea;   /* Inicio del gradiente */
    --bg-gradient-2: #764ba2;   /* Fin del gradiente */
    /* Cambia estos para tu marca */
}
```

### 3. Configuración de Firebase

En `juego.js`, actualiza las credenciales:
```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com"
};
```

**Configurar Firebase Console:**
1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilitar **Realtime Database**
3. Configurar reglas de seguridad:
   ```json
   {
     "rules": {
       ".read": "auth != null",
       ".write": "auth != null"
     }
   }
   ```
4. Copiar credenciales del proyecto

### 4. Agregar Más Colores

En `juego.js`, modifica el array:
```javascript
const colores = [
  "red", "blue", "green", 
  "yellow", "orange", "purple",
  "pink", "brown"  // Nuevos colores
];
```

Agrega estilos en `css/juego.css`:
```css
.color-box.pink { background-color: #ff69b4; }
.color-box.brown { background-color: #8b4513; }
```

### 5. Ajustar Dificultad

En `juego.js`, modifica constantes:
```javascript
const INTENTOS_MAXIMOS = 12;        // Por defecto: 10
const TIEMPO_POR_TURNO = 30;        // Por defecto: 20
const COLORES_EN_SECUENCIA = 5;     // Por defecto: 4
```

## 🔧 Configuración Avanzada

### Sistema de Puntuación
```javascript
// En juego.js - Función calcularPuntuacion()
const PUNTUACION_BASE = 1000;
const BONUS_PRECISION_MAX = 500;
const BONUS_VELOCIDAD_MAX = 300;
const BONUS_PERFECTO = 200;
const TIEMPO_BONUS_PERFECTO = 15;
```

### Administradores
```javascript
// En juego.js - Lista de nombres admin
const NOMBRES_ADMIN = ['beto', 'admin', 'administrador'];
```

Los admins pueden:
- 🗑️ Eliminar salas
- 📊 Ver estadísticas del servidor
- 👑 Tienen indicador visual especial

### Cache y Estado Local
```javascript
// Variables de estado en memoria
let salaId = "";                  // ID de sala actual
let userId = null;                // ID de usuario autenticado
let secuenciaSala = [];           // Secuencia de colores de la sala
let ordenSeleccion = [];          // Colores seleccionados por usuario
let juegoTerminado = false;       // Flag de fin de partida
let puntuacionJugador = 0;        // Puntos acumulados
```

## 🎯 Reglas del Juego

### Objetivo
Descifrar una secuencia secreta de **4 colores únicos** en máximo **10 intentos**.

### Cómo Jugar

1. **Autenticarse**
   - Registrarse o iniciar sesión
   - Elegir nombre de usuario

2. **Crear/Unirse a Sala**
   - Modo Solo: Juego contra la máquina
   - Modo Multijugador: Esperar a otro jugador

3. **Seleccionar Colores**
   - Click en los colores disponibles
   - Orden de selección mostrado (1→4)
   - Click de nuevo para deseleccionar

4. **Enviar Intento**
   - Presionar "Enviar intento"
   - Máximo 20 segundos por turno
   - Tiempo agotado cuenta como intento perdido

5. **Interpretar Pistas**
   - ✓ **Verde:** Posición y color correctos
   - ⚬ **Amarillo:** Color correcto, posición incorrecta
   - Total de pistas indica progreso

6. **Ganar/Perder**
   - **Victoria:** 4 pistas verdes (✓✓✓✓)
   - **Derrota:** Agotar 10 intentos sin adivinar
   - Ver puntuación obtenida
   - Opción de revancha

### Estrategias Recomendadas

✅ **Primer intento:**
- Usar 4 colores diferentes
- Obtener máxima información de pistas

✅ **Análisis de pistas:**
- Combinar información de posiciones
- Descartar colores sin pistas amarillas/verdes

✅ **Eliminación:**
- Marcar colores que definitivamente no están
- Enfocarse en colores confirmados

✅ **Gestión de tiempo:**
- Planificar antes de seleccionar
- En modo solo, usar los 20s estratégicamente
- En multijugador, pensar durante el turno del oponente

## 💡 Tips Profesionales

✅ **Haz:**
- Probar en diferentes navegadores (Chrome, Firefox, Safari)
- Verificar que Firebase esté configurado correctamente
- Mantener backups de `juego.js` antes de cambios mayores
- Documentar modificaciones en comentarios
- Probar modo solo y multijugador regularmente

❌ **Evita:**
- Modificar la estructura de Firebase sin actualizar reglas
- Hardcodear nombres de usuarios administradores en producción
- Eliminar los archivos de respaldo (`juego-original.js`)
- Cambiar variables globales sin verificar dependencias
- Ignorar errores de la consola del navegador

## ⚡ Performance

- **No usa librerías pesadas** - Vanilla JS puro
- **Gráficos SVG** - No canvas pesado (excepto confeti)
- **Firebase optimizado** - Listeners específicos, no queries globales
- **CSS modular** - Solo carga los estilos necesarios
- **Animaciones GPU** - Usa `transform` y `opacity` para 60fps
- **Load times** - <2s en conexión normal
- **Bundle size** - ~150KB total (HTML+CSS+JS)

## 🔒 Seguridad

✅ Este juego:
- **No almacena contraseñas** - Solo nombres de usuario y PINs hasheados
- **Firebase con reglas** - Autenticación requerida para leer/escribir
- **No tracking** - No recolecta datos de usuario
- **Solo APIs oficiales** - Firebase SDK v10 desde CDN oficial
- **CORS-safe** - Todos los recursos desde dominios permitidos

⚠️ **Consideraciones:**
- Los códigos PIN se almacenan en memoria durante la sesión
- Firebase credentials son públicas (protegidas por reglas)
- Admin names están hardcodeados (cambiar en producción)

## 📊 Próximos Pasos

### 🚀 Roadmap

1. **Sistema de dificultades** - Fácil (3 colores), Normal (4), Difícil (5)
2. **Salas privadas** - Contraseñas para partidas exclusivas
3. **Modo torneo** - Eliminación entre múltiples jugadores
4. **PWA** - Instalación como app móvil nativa
5. **Modo offline** - Juego contra IA sin internet
6. **Sistema de logros** - Achievements por performance
7. **Perfiles de usuario** - Avatares y biografías
8. **Sistema de amigos** - Lista de contactos frecuentes
9. **Notificaciones** - Alertas de turno y mensajes
10. **Analytics** - Stats detalladas de partidas

## 📝 Licencia

Uso libre y personal. Puedes modificar y distribuir.

---

## 🎮 Qué Editar Si Querés Cambiar Algo

### Ajustes Visuales
- **Colores/temas:** Editar [css/base.css](css/base.css)
- **Botones:** Editar [css/botones.css](css/botones.css)
- **Juego:** Editar [css/juego.css](css/juego.css)
- **Modales:** Editar [css/modales.css](css/modales.css)

### Lógica de Juego
- **Mecánicas:** Editar [juego.js](juego.js) - Funciones `enviarIntento()`, `verificarVictoria()`
- **Firebase:** Editar [juego.js](juego.js) - `firebaseConfig` y listeners
- **Puntuación:** Editar [juego.js](juego.js) - Función `calcularPuntuacion()`
- **Sonidos:** Editar [juego.js](juego.js) - Función `reproducirSonido()`

### Estructura HTML
- **Layout principal:** Editar [index.html](index.html)
- **Modales:** Editar [index.html](index.html) - Secciones con `modal-overlay`
- **Formularios:** Editar [index.html](index.html) - Divs `formularioCrear` y `formularioUnir`

## 👥 Créditos

**Programado por:** Beto  
**Año:** 2025  
**Versión:** 1.0  

**Inspirado en:** Mastermind (juego de mesa clásico)  
**Powered by:** Firebase Realtime Database  
**Fuentes:** Google Fonts - Poppins

## 🤝 Contribuciones

Si querés contribuir:
1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añade nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request con descripción detallada

**Reportar bugs:** Abre un Issue con pasos para reproducir el problema

## 📈 Estadísticas del Proyecto

- **Líneas de código:** ~3,500+ (JavaScript, HTML, CSS)
- **Archivos CSS modulares:** 10 archivos especializados
- **Funciones principales:** 35+
- **Características implementadas:** 40+
- **Modos de juego:** 2 (Solo, Multijugador)
- **Colores disponibles:** 6
- **Intentos máximos:** 10
- **Tiempo por turno:** 20 segundos
- **Jugadores por sala:** Hasta 2
- **Sistema de puntuación:** 4 tipos de bonus

---

**¡Disfruta jugando Adivina Colores Online! 🎨🎮**

*Creado: Febrero 2025*  
*Última actualización: Febrero 2025*
