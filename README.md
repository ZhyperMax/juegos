# 🎨 Adivina Colores Online

Un juego interactivo multijugador donde debes adivinar la secuencia correcta de colores en tiempo real.

## 🎮 Descripción

**Adivina Colores Online** es una versión moderna del clásico juego Mastermind, donde los jugadores deben descifrar una secuencia secreta de 4 colores únicos. El juego combina estrategia, lógica y presión de tiempo en una experiencia multijugador fluida.

## ✨ Características Principales

### 🎯 Mecánicas de Juego
- **Objetivo**: Adivinar una secuencia de 4 colores únicos
- **Colores disponibles**: 6 opciones (Rojo, Azul, Verde, Amarillo, Naranja, Violeta)
- **Sistema de intentos**: Máximo 10 intentos por jugador
- **Secuencias únicas**: Sin colores repetidos en cada partida
- **Sistema de pistas**: Indicadores de posiciones y colores correctos

### 🎲 Modos de Juego

#### 🧑‍💻 Modo Solo
- Juego individual contra la máquina
- **Presión de tiempo**: 15 segundos por intento
- **Penalización**: El tiempo agotado cuenta como intento perdido
- **Reinicio automático**: Nuevo cronómetro después de cada intento

#### 👥 Modo Multijugador
- Hasta 2 jugadores por sala
- **Sistema de turnos**: Alternancia automática entre jugadores
- **Tiempo por turno**: 15 segundos para cada jugador
- **Sincronización en tiempo real**: Actualizaciones instantáneas

### 🖱️ Interfaz y Controles

#### 🎨 Selección de Colores Intuitiva
- **Orden visual**: Números 1, 2, 3, 4 muestran el orden de selección
- **Deselección fácil**: Click para quitar colores del intento
- **Límite visual**: No permite seleccionar más de 4 colores
- **Reordenamiento**: Los números se actualizan automáticamente al deseleccionar

#### 📊 Contador de Intentos Prominente
- **Ubicación superior**: Visible antes de la selección de colores
- **Información completa**: "X/10 intentos" + intentos restantes
- **Indicadores visuales**:
  - 🟢 Verde: 0-5 intentos (seguro)
  - 🟡 Amarillo: 6-7 intentos (precaución)
  - 🔴 Rojo: 8-10 intentos (peligro)
- **Actualización en tiempo real**: Cambios instantáneos

### 🏆 Sistema de Retroalimentación

#### 📈 Indicadores de Progreso
- **✓ Posiciones correctas**: Colores en la posición exacta
- **⚬ Colores correctos**: Colores presentes pero mal ubicados
- **❌ Tiempo agotado**: Intentos perdidos por tiempo
- **🏆 Victoria**: 4 posiciones correctas

#### 🎭 Mensajes de Final de Juego

##### 🎉 Victoria
- **Celebración visual**: Mensaje con emojis y animaciones
- **Efecto confeti**: 50 partículas de colores cayendo
- **Sonido de victoria**: Melodía musical (Do, Mi, Sol, Do alto)
- **Mensaje motivacional**: Invitación a jugar otra partida

##### 💔 Derrota
- **Revelación de secuencia**: Muestra la combinación correcta
- **Colores numerados**: Orden exacto con posiciones 1, 2, 3, 4
- **Tooltips informativos**: Nombres de colores en español
- **Sonido de derrota**: Tono descendente
- **Mensaje motivacional**: Ánimo para intentar de nuevo

### 🌐 Sistema Multijugador

#### 🏠 Gestión de Salas
- **Códigos únicos**: Salas identificadas con códigos de 5 caracteres
- **Lista en tiempo real**: Salas disponibles actualizadas automáticamente
- **Filtros inteligentes**: Solo muestra salas con espacio disponible
- **Información detallada**: Jugadores actuales/máximos por sala

#### 👤 Gestión de Jugadores
- **Identificación clara**: Marcador "(Tú)" para el jugador actual
- **Historial individual**: Intentos separados por jugador
- **Estados diferenciados**: Bordes azules para el jugador actual
- **Lista de participantes**: Nombres visibles en la sala

#### 💬 Chat Integrado
- **Comunicación en tiempo real**: Mensajes instantáneos
- **Historial persistente**: Mensajes ordenados por timestamp
- **Scroll automático**: Nuevos mensajes siempre visibles
- **Entrada rápida**: Envío con Enter

### 📚 Sistema de Información Integrado

#### ℹ️ Modal de Ayuda Interactivo
- **Acceso rápido**: Botón "Info del Juego" en esquina superior derecha
- **Documentación completa**: Todas las reglas y características explicadas
- **Diseño responsivo**: Adaptado para móvil y desktop
- **Navegación fácil**: Scroll suave y organización por secciones

#### 📖 Contenido del Modal
- **Objetivo del juego**: Explicación clara del objetivo principal
- **Modos de juego**: Comparación detallada entre Solo y Multijugador
- **Colores disponibles**: Showcase visual de los 6 colores
- **Sistema de pistas**: Explicación de ✓, ⚬ y ❌
- **Cómo jugar**: Pasos numerados para nuevos usuarios
- **Características destacadas**: Lista de funcionalidades principales
- **Estrategias recomendadas**: Consejos para mejorar el gameplay

#### 🎨 Características del Modal
- **Overlay con blur**: Fondo desenfocado para mejor enfoque
- **Animaciones suaves**: Entrada con fade-in y slide-in
- **Controles intuitivos**: Cerrar con X, Escape o click fuera
- **Prevención de scroll**: El cuerpo se bloquea cuando está abierto
- **Diseño coherente**: Misma paleta de colores que el juego

### 🔄 Sistema de Revancha

#### 🎮 Votación Inteligente
- **Modo Solo**: Decisión personal de volver a jugar
- **Modo Multijugador**: Votación democrática entre jugadores
- **Interfaz intuitiva**: Botones "✅ ¡Sí, vamos!" y "❌ No, gracias"
- **Feedback en tiempo real**: Contador de votos visible

#### 🗳️ Mecánica de Votación
- **Aparición automática**: Botón aparece 2-3 segundos después del final
- **Solo mode**: Basta con un voto (del único jugador)
- **Multiplayer mode**: Requiere unanimidad (todos deben votar "Sí")
- **Voto único**: Cada jugador puede votar solo una vez

#### 🎯 Resultados Automáticos
- **Nueva partida**: Si todos votan "Sí"
  - Nueva secuencia generada automáticamente
  - Intentos reseteados a 0 para todos
  - Primer jugador comienza nuevamente
  - Historial limpio para nueva partida
- **Fin de sesión**: Si alguien vota "No"
  - Mensaje de despedida personalizado
  - Agradecimiento por jugar
  - Botón desaparece después de 10 segundos

#### ✨ Características del Sistema
- **Estado sincronizado**: Votos en tiempo real via Firebase
- **Prevención de duplicados**: Sistema que evita votos múltiples
- **Limpieza automática**: Reseteo completo del estado del juego
- **Mensajes contextuales**: Diferentes textos para solo vs multijugador
- **Diseño responsivo**: Funciona perfecto en móvil y desktop

### 🎵 Experiencia Audiovisual

#### 🔊 Sistema de Audio
- **Web Audio API**: Sonidos generados dinámicamente
- **Victoria**: Melodía ascendente en 4 notas
- **Derrota**: Tono descendente con fade out
- **Compatibilidad**: Funciona sin audio si no está disponible

#### 🎨 Animaciones y Efectos
- **Confeti animado**: 50 partículas con física realista
- **Transiciones suaves**: Elementos con animaciones CSS
- **Colores correctos**: Animación de aparición secuencial
- **Feedback visual**: Cambios de color según el estado

### 📱 Diseño Responsivo
- **Adaptable**: Funciona en desktop, tablet y móvil
- **Fuente moderna**: Poppins de Google Fonts
- **Gradientes atractivos**: Fondo con degradado dinámico
- **Logo corporativo**: Esquina superior izquierda

## 🚀 Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica moderna
- **CSS3**: Flexbox, Grid, gradientes, animaciones
- **JavaScript ES6+**: Módulos, async/await, arrow functions

### Backend/Base de Datos
- **Firebase Realtime Database**: Sincronización en tiempo real
- **Firebase SDK v10**: Última versión estable
- **Persistencia offline**: Funciona sin conexión temporal

### APIs Web
- **Web Audio API**: Generación de sonidos dinámicos
- **DOM API**: Manipulación avanzada de elementos
- **CSS Animation API**: Efectos visuales fluidos

## 🛠️ Instalación y Configuración

### Requisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet para Firebase
- JavaScript habilitado

### Configuración
1. **Clonar el repositorio**
   ```bash
   git clone [URL-del-repositorio]
   cd juegos
   ```

2. **Configurar Firebase**
   - Las credenciales ya están configuradas en `juego.js`
   - La base de datos está lista para usar

3. **Ejecutar localmente**
   - Abrir `index.html` en un navegador
   - O usar un servidor local como Live Server

## 📁 Estructura del Proyecto

```
juegos/
├── index.html          # Página principal
├── juego.js           # Lógica del juego y Firebase
├── juego.css          # Estilos y animaciones
├── README.md          # Documentación
└── img/
    ├── icon.ico       # Favicon
    └── logo.png       # Logo del juego
```

## 🎯 Reglas del Juego

### Objetivo
Adivinar la secuencia secreta de 4 colores únicos en máximo 10 intentos.

### Cómo Jugar
1. **Crear o unirse** a una sala
2. **Seleccionar** 4 colores en el orden deseado
3. **Enviar** el intento antes de que se agote el tiempo
4. **Interpretar** las pistas:
   - ✓ = Color correcto en posición correcta
   - ⚬ = Color correcto en posición incorrecta
5. **Ajustar** la estrategia según las pistas
6. **Ganar** adivinando la secuencia exacta

### Estrategias Recomendadas
- **Primer intento**: Usar 4 colores diferentes para obtener información
- **Análisis de pistas**: Combinar información de colores y posiciones
- **Eliminación**: Descartar colores que no aparecen en las pistas
- **Tiempo**: Planificar antes de seleccionar en modo solo

## 📊 Historial de Actualizaciones

### 🆕 Versión Actual (Agosto 2025)

#### ✨ Características Implementadas

**🎮 Sistema de Juego**
- ✅ Modo solo con penalización de tiempo
- ✅ Modo multijugador con turnos
- ✅ Secuencias sin colores repetidos
- ✅ Sistema de 10 intentos máximo
- ✅ Cronómetro de 15 segundos por turno

**🖱️ Interfaz de Usuario**
- ✅ Selección de colores con orden numérico
- ✅ Contador de intentos prominente en la parte superior
- ✅ Deselección fácil de colores
- ✅ Indicadores visuales de progreso
- ✅ **Botón de información del juego con modal interactivo**

**🏆 Fin de Juego**
- ✅ Mensajes de victoria con confeti y sonido
- ✅ Mensajes de derrota con secuencia correcta
- ✅ Colores mostrados con números de posición
- ✅ Efectos de sonido para ambos casos
- ✅ **Sistema de revancha/volver a jugar con votación**

**🌐 Multijugador**
- ✅ Creación y unión a salas
- ✅ Chat en tiempo real
- ✅ Lista de salas disponibles
- ✅ Sincronización automática de estados

**📱 Experiencia**
- ✅ Diseño responsivo
- ✅ Animaciones fluidas
- ✅ Retroalimentación audiovisual
- ✅ Manejo de errores elegante
- ✅ **Modal informativo con documentación completa del juego**

#### 🔧 Funcionalidades Técnicas
- ✅ Firebase Realtime Database integrado
- ✅ Sistema de desconexión automática
- ✅ Limpieza de salas vacías
- ✅ Estados de juego sincronizados
- ✅ Manejo de turnos automático

#### 🎨 Mejoras Visuales
- ✅ Gradientes y sombras modernas
- ✅ Iconos y emojis descriptivos
- ✅ Colores según el estado del juego
- ✅ Animaciones CSS personalizadas

---

## 🚧 Roadmap de Futuras Actualizaciones

### 📋 Próximas Características
- [ ] **Sistema de puntuación**: Puntos basados en intentos y tiempo
- [ ] **Ranking global**: Tabla de mejores jugadores
- [ ] **Dificultades**: Fácil (3 colores), Normal (4), Difícil (5)
- [ ] **Salas privadas**: Contraseñas para salas exclusivas
- [ ] **Espectadores**: Modo observador sin participar
- [ ] **Estadísticas**: Historial de partidas y porcentaje de victoria

### 🎮 Mejoras de Gameplay
- [ ] **Modo torneo**: Eliminación entre múltiples jugadores
- [ ] **Pistas opcionales**: Sistema de ayudas limitadas
- [ ] **Tiempo variable**: Diferentes duraciones de cronómetro
- [ ] **Colores personalizados**: Selección de paleta por sala

### 🌟 Funciones Sociales
- [ ] **Perfiles de usuario**: Nombres persistentes y avatares
- [ ] **Sistema de amigos**: Lista de contactos frecuentes
- [ ] **Invitaciones**: Compartir salas por link o código QR
- [ ] **Mensajes privados**: Chat directo entre jugadores

### 📱 Mejoras Técnicas
- [ ] **PWA**: Instalación como app móvil
- [ ] **Modo offline**: Juego contra IA sin internet
- [ ] **Sincronización optimizada**: Reducir latencia
- [ ] **Notificaciones**: Alertas de turno y mensajes

---

## 🤝 Contribuciones

### Cómo Contribuir
1. **Fork** del repositorio
2. **Crear** una rama para la nueva característica
3. **Implementar** los cambios
4. **Probar** exhaustivamente
5. **Crear** Pull Request con descripción detallada

### Reportar Bugs
- Usar el sistema de Issues de GitHub
- Incluir pasos para reproducir el problema
- Especificar navegador y versión
- Adjuntar screenshots si es posible

### Sugerir Características
- Abrir un Issue con la etiqueta "enhancement"
- Describir el caso de uso
- Explicar el beneficio para los usuarios
- Proponer implementación si es posible

---

## 📞 Soporte

### Contacto
- **GitHub Issues**: Para bugs y sugerencias
- **Email**: [tu-email@ejemplo.com]
- **Discord**: [Servidor de la comunidad]

### FAQ

**❓ ¿Por qué no puedo seleccionar más de 4 colores?**
R: El juego está diseñado para secuencias de exactamente 4 colores únicos.

**❓ ¿Qué pasa si se va mi conexión a internet?**
R: Firebase maneja la reconexión automáticamente. Los datos se sincronizan al volver la conexión.

**❓ ¿Por qué cuenta como intento cuando se agota el tiempo?**
R: En modo solo, esto añade presión estratégica. En multijugador, solo pasa al siguiente jugador.

**❓ ¿Puedo jugar en móvil?**
R: Sí, el juego es completamente responsivo y funciona en todos los dispositivos.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 🎉 Agradecimientos

- **Firebase** por la infraestructura de base de datos en tiempo real
- **Google Fonts** por la tipografía Poppins
- **Comunidad de desarrolladores** por las pruebas y feedback
- **Jugadores beta** por ayudar a perfeccionar la experiencia

---

## 📈 Estadísticas del Proyecto

- **Líneas de código**: ~1,500+ (JavaScript, HTML, CSS)
- **Funciones principales**: 25+
- **Características implementadas**: 30+
- **Tiempo de desarrollo**: En progreso continuo
- **Dispositivos compatibles**: Desktop, Tablet, Móvil

---

**¡Disfruta jugando Adivina Colores Online! 🎨🎮**

*Última actualización: Agosto 2025*
