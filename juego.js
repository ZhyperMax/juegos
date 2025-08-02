import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get, onValue, push, remove, onDisconnect, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBV5Er3cLo94tcGuNnGjNAsB9B0G1F4TnI",
  authDomain: "buscacolores.firebaseapp.com",
  projectId: "buscacolores",
  storageBucket: "buscacolores.appspot.com",
  messagingSenderId: "113743863860",
  appId: "1:113743863860:web:7833345b5189a16e392a61",
  measurementId: "G-HZXZ7HQ9H0",
  databaseURL: "https://buscacolores-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const colores = ["red", "blue", "green", "yellow", "orange", "purple"];
let salaId = "";
let userId = null; // Se asignará después del login/registro
let nombreUsuario = null; // Nombre del usuario autenticado
let pinUsuario = null; // PIN del usuario (solo en memoria durante la sesión)

// Configuración de administrador - Lista de nombres admin
const NOMBRES_ADMIN = ['beto', 'admin', 'administrador'];
let secuenciaSala = [];
let jugadorTurno = null;
let timerInterval = null;
let tiempoRestante = 20;
let jugadoresEnSala = {}; // Variable local para almacenar la información de los jugadores
let ordenSeleccion = []; // Array para mantener el orden de selección de colores
let juegoTerminado = false; // Flag para controlar el estado del juego
let inicioPartida = null; // Timestamp de inicio de la partida para calcular tiempo
let puntuacionJugador = 0; // Puntuación actual del jugador

// ---------------------- SISTEMA DE SONIDOS ------------------------

// Configuración de sonidos
let audioContext;
let sonidosHabilitados = true;

// Inicializar contexto de audio
function inicializarAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  } catch (error) {
    console.warn("Web Audio API no soportada:", error);
    sonidosHabilitados = false;
  }
}

// Función para crear y reproducir sonidos sintéticos
function reproducirSonido(tipo) {
  if (!sonidosHabilitados || !audioContext) return;
  
  try {
    const gainNode = audioContext.createGain();
    const oscillator = audioContext.createOscillator();
    
    gainNode.connect(audioContext.destination);
    oscillator.connect(gainNode);
    
    const ahora = audioContext.currentTime;
    
    switch (tipo) {
      case 'click':
        // Sonido de click suave
        oscillator.frequency.setValueAtTime(800, ahora);
        oscillator.frequency.exponentialRampToValueAtTime(600, ahora + 0.1);
        gainNode.gain.setValueAtTime(0.1, ahora);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ahora + 0.1);
        oscillator.type = 'sine';
        oscillator.start(ahora);
        oscillator.stop(ahora + 0.1);
        break;
        
      case 'acierto':
        // Sonido de acierto (nota ascendente)
        oscillator.frequency.setValueAtTime(440, ahora);
        oscillator.frequency.exponentialRampToValueAtTime(880, ahora + 0.3);
        gainNode.gain.setValueAtTime(0.15, ahora);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ahora + 0.3);
        oscillator.type = 'sine';
        oscillator.start(ahora);
        oscillator.stop(ahora + 0.3);
        break;
        
      case 'error':
        // Sonido de error (nota descendente)
        oscillator.frequency.setValueAtTime(300, ahora);
        oscillator.frequency.exponentialRampToValueAtTime(150, ahora + 0.2);
        gainNode.gain.setValueAtTime(0.1, ahora);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ahora + 0.2);
        oscillator.type = 'sawtooth';
        oscillator.start(ahora);
        oscillator.stop(ahora + 0.2);
        break;
        
      case 'victoria':
        // Melodía de victoria
        const frecuencias = [523, 659, 784, 1047]; // Do, Mi, Sol, Do octava
        frecuencias.forEach((freq, index) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.frequency.setValueAtTime(freq, ahora + index * 0.15);
          gain.gain.setValueAtTime(0.15, ahora + index * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, ahora + index * 0.15 + 0.3);
          
          osc.type = 'sine';
          osc.start(ahora + index * 0.15);
          osc.stop(ahora + index * 0.15 + 0.3);
        });
        break;
        
      case 'derrota':
        // Sonido de derrota (acorde descendente)
        const frecuenciasDerrota = [330, 277, 220, 165]; // Mi, Do#, La, Mi grave
        frecuenciasDerrota.forEach((freq, index) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.frequency.setValueAtTime(freq, ahora + index * 0.1);
          gain.gain.setValueAtTime(0.1, ahora + index * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, ahora + index * 0.1 + 0.4);
          
          osc.type = 'sine';
          osc.start(ahora + index * 0.1);
          osc.stop(ahora + index * 0.1 + 0.4);
        });
        break;
        
      case 'turno':
        // Sonido suave para indicar turno
        oscillator.frequency.setValueAtTime(660, ahora);
        oscillator.frequency.setValueAtTime(880, ahora + 0.1);
        gainNode.gain.setValueAtTime(0.08, ahora);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ahora + 0.2);
        oscillator.type = 'sine';
        oscillator.start(ahora);
        oscillator.stop(ahora + 0.2);
        break;
        
      case 'tiempo':
        // Sonido de advertencia de tiempo
        oscillator.frequency.setValueAtTime(1000, ahora);
        gainNode.gain.setValueAtTime(0.1, ahora);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ahora + 0.1);
        oscillator.type = 'square';
        oscillator.start(ahora);
        oscillator.stop(ahora + 0.1);
        break;
        
      case 'notificacion':
        // Sonido suave de notificación
        oscillator.frequency.setValueAtTime(800, ahora);
        oscillator.frequency.setValueAtTime(1000, ahora + 0.05);
        oscillator.frequency.setValueAtTime(800, ahora + 0.1);
        gainNode.gain.setValueAtTime(0.06, ahora);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ahora + 0.15);
        oscillator.type = 'sine';
        oscillator.start(ahora);
        oscillator.stop(ahora + 0.15);
        break;
    }
  } catch (error) {
    console.warn("Error al reproducir sonido:", error);
  }
}

// Función para alternar sonidos
function alternarSonidos() {
  sonidosHabilitados = !sonidosHabilitados;
  const estado = sonidosHabilitados ? "habilitados" : "deshabilitados";
  mostrarEstado(`🔊 Sonidos ${estado}`, sonidosHabilitados ? "green" : "orange");
  
  // Actualizar el botón visualmente
  const btnSonido = document.getElementById('sonidoBtn');
  if (btnSonido) {
    const icono = btnSonido.querySelector('.sonido-icon');
    if (sonidosHabilitados) {
      btnSonido.classList.remove('sonidos-deshabilitados');
      icono.textContent = '🔊';
    } else {
      btnSonido.classList.add('sonidos-deshabilitados');
      icono.textContent = '🔇';
    }
  }
  
  if (sonidosHabilitados) {
    reproducirSonido('notificacion');
  }
  
  // Guardar preferencia en localStorage
  localStorage.setItem('sonidosHabilitados', sonidosHabilitados);
}

// Cargar preferencia de sonidos al iniciar
function cargarPreferenciaSonidos() {
  const preferencia = localStorage.getItem('sonidosHabilitados');
  if (preferencia !== null) {
    sonidosHabilitados = preferencia === 'true';
  }
  
  // Actualizar el botón según la preferencia cargada
  setTimeout(() => {
    const btnSonido = document.getElementById('sonidoBtn');
    if (btnSonido) {
      const icono = btnSonido.querySelector('.sonido-icon');
      if (sonidosHabilitados) {
        btnSonido.classList.remove('sonidos-deshabilitados');
        icono.textContent = '🔊';
      } else {
        btnSonido.classList.add('sonidos-deshabilitados');
        icono.textContent = '🔇';
      }
    }
  }, 100);
}

// ---------------------- FUNCIONES BÁSICAS ------------------------

function mostrarEstado(msg, color = "green") {
  const estadoApp = document.getElementById("estadoApp");
  estadoApp.textContent = msg;
  estadoApp.style.color = color;
}

function generarCodigoSala() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
  return Array.from({ length: 5 }, () => letras[Math.floor(Math.random() * letras.length)]).join("");
}

function generarSecuencia(longitud = 4) {
  // Crear una copia de los colores disponibles
  const coloresDisponibles = [...colores];
  const secuencia = [];
  
  // Seleccionar colores únicos al azar
  for (let i = 0; i < longitud; i++) {
    const indiceAleatorio = Math.floor(Math.random() * coloresDisponibles.length);
    secuencia.push(coloresDisponibles[indiceAleatorio]);
    // Remover el color seleccionado para evitar repeticiones
    coloresDisponibles.splice(indiceAleatorio, 1);
  }
  
  return secuencia;
}

function ocultarFormularios() {
  document.getElementById("formulario").style.display = "none";
  document.getElementById("listaSalas").style.display = "none";
}

function mostrarBotonSalir(show = false) {
  document.getElementById("salirBtn").style.display = show ? "block" : "none";
}

// ---------------------- SISTEMA DE AUTENTICACIÓN ------------------------

function mostrarAuthStatus(mensaje, tipo = 'info') {
  const statusDiv = document.getElementById('auth-status');
  statusDiv.textContent = mensaje;
  statusDiv.className = `auth-status ${tipo}`;
  statusDiv.style.display = 'block';
  
  // Auto-hide después de 3 segundos para mensajes de éxito
  if (tipo === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

function validarPin(pin) {
  return /^\d{4}$/.test(pin);
}

function validarNombre(nombre) {
  return nombre.length >= 3 && nombre.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(nombre);
}

async function verificarNombreUnico(nombre) {
  try {
    const usuariosRef = ref(db, 'usuarios');
    const snapshot = await get(usuariosRef);
    
    if (snapshot.exists()) {
      const usuarios = snapshot.val();
      return !Object.values(usuarios).some(user => user.nombre.toLowerCase() === nombre.toLowerCase());
    }
    return true; // Si no hay usuarios, el nombre está disponible
  } catch (error) {
    console.error('Error verificando nombre único:', error);
    return false;
  }
}

async function registrarUsuario() {
  console.log('Función registrarUsuario llamada');
  const nombre = document.getElementById('registerNombre').value.trim();
  const pin = document.getElementById('registerPin').value.trim();
  const pinConfirm = document.getElementById('registerPinConfirm').value.trim();
  
  console.log('Datos del formulario:', { nombre, pin, pinConfirm });
  
  // Validaciones
  if (!nombre) {
    mostrarAuthStatus('Por favor ingresa un nombre de usuario', 'error');
    return;
  }
  
  if (!validarNombre(nombre)) {
    mostrarAuthStatus('El nombre debe tener 3-20 caracteres y solo usar letras, números, _ o -', 'error');
    return;
  }
  
  // Verificar que no sea un nombre reservado para admin
  const nombreLimpio = nombre.toLowerCase().trim();
  if (NOMBRES_ADMIN.includes(nombreLimpio)) {
    mostrarAuthStatus('Este nombre está reservado. Elige otro nombre.', 'error');
    return;
  }
  
  if (!validarPin(pin)) {
    mostrarAuthStatus('El PIN debe tener exactamente 4 dígitos', 'error');
    return;
  }
  
  if (pin !== pinConfirm) {
    mostrarAuthStatus('Los PINs no coinciden', 'error');
    return;
  }
  
  mostrarAuthStatus('Verificando disponibilidad del nombre...', 'info');
  
  // Verificar si el nombre ya existe
  const nombreDisponible = await verificarNombreUnico(nombre);
  if (!nombreDisponible) {
    mostrarAuthStatus('Este nombre ya está en uso. Elige otro.', 'error');
    return;
  }
  
  try {
    // Generar ID único para el usuario
    const nuevoUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    
    // Crear usuario en Firebase
    await set(ref(db, `usuarios/${nuevoUserId}`), {
      nombre: nombre,
      pin: pin, // En producción, esto debería estar hasheado
      fechaRegistro: Date.now(),
      ultimoAcceso: Date.now()
    });
    
    // Crear perfil inicial
    await set(ref(db, `perfiles/${nuevoUserId}`), {
      nombre: nombre,
      puntuacionTotal: 0,
      partidasGanadas: 0,
      partidasJugadas: 0
    });
    
    // Guardar en localStorage
    localStorage.setItem('usuarioAutenticado', JSON.stringify({
      userId: nuevoUserId,
      nombre: nombre,
      pin: pin
    }));
    
    // Establecer variables globales
    userId = nuevoUserId;
    nombreUsuario = nombre;
    pinUsuario = pin;
    
    mostrarAuthStatus('¡Cuenta creada exitosamente!', 'success');
    
    // Cerrar modal después de un delay
    setTimeout(() => {
      cerrarModalAuth();
      mostrarBienvenida();
      
      // Verificar si hay una invitación pendiente
      const salaInvitacion = localStorage.getItem('salaInvitacion');
      if (salaInvitacion) {
        setTimeout(() => {
          unirseSalaDirecta(salaInvitacion);
        }, 1000);
      }
    }, 1500);
    
  } catch (error) {
    console.error('Error registrando usuario:', error);
    mostrarAuthStatus('Error al crear la cuenta. Intenta de nuevo.', 'error');
  }
}

async function iniciarSesion() {
  console.log('Función iniciarSesion llamada');
  const nombre = document.getElementById('loginNombre').value.trim();
  const pin = document.getElementById('loginPin').value.trim();
  
  console.log('Datos del login:', { nombre, pin });
  
  if (!nombre) {
    mostrarAuthStatus('Por favor ingresa tu nombre de usuario', 'error');
    return;
  }
  
  if (!validarPin(pin)) {
    mostrarAuthStatus('El PIN debe tener exactamente 4 dígitos', 'error');
    return;
  }
  
  mostrarAuthStatus('Verificando credenciales...', 'info');
  
  try {
    // Buscar usuario en Firebase
    const usuariosRef = ref(db, 'usuarios');
    const snapshot = await get(usuariosRef);
    
    if (!snapshot.exists()) {
      mostrarAuthStatus('No hay usuarios registrados. ¿Quieres crear una cuenta?', 'error');
      setTimeout(() => cambiarPestanaAuth('register'), 2000);
      return;
    }
    
    const usuarios = snapshot.val();
    let usuarioEncontrado = null;
    let userIdEncontrado = null;
    
    // Buscar por nombre y PIN
    for (const [id, userData] of Object.entries(usuarios)) {
      if (userData.nombre.toLowerCase() === nombre.toLowerCase() && userData.pin === pin) {
        usuarioEncontrado = userData;
        userIdEncontrado = id;
        break;
      }
    }
    
    if (!usuarioEncontrado) {
      mostrarAuthStatus('Usuario no encontrado o PIN incorrecto. ¿Quieres crear una cuenta?', 'error');
      setTimeout(() => cambiarPestanaAuth('register'), 3000);
      return;
    }
    
    // Actualizar último acceso
    await update(ref(db, `usuarios/${userIdEncontrado}`), {
      ultimoAcceso: Date.now()
    });
    
    // Guardar en localStorage
    localStorage.setItem('usuarioAutenticado', JSON.stringify({
      userId: userIdEncontrado,
      nombre: usuarioEncontrado.nombre,
      pin: pin
    }));
    
    // Establecer variables globales
    userId = userIdEncontrado;
    nombreUsuario = usuarioEncontrado.nombre;
    pinUsuario = pin;
    
    mostrarAuthStatus('¡Bienvenido de vuelta!', 'success');
    
    // Cerrar modal después de un delay
    setTimeout(() => {
      cerrarModalAuth();
      mostrarBienvenida();
      
      // Verificar si hay una invitación pendiente
      const salaInvitacion = localStorage.getItem('salaInvitacion');
      if (salaInvitacion) {
        setTimeout(() => {
          unirseSalaDirecta(salaInvitacion);
        }, 1000);
      }
    }, 1500);
    
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    mostrarAuthStatus('Error al conectar. Intenta de nuevo.', 'error');
  }
}

function cerrarModalAuth() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.style.display = 'none';
  }
  document.body.style.overflow = 'auto';
}

function cambiarPestanaAuth(pestana) {
  // Remover clase active de todos los botones y contenidos
  document.querySelectorAll('.auth-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.auth-tab-content').forEach(content => content.classList.remove('active'));
  
  // Activar el botón y contenido correspondiente
  const botonActivo = document.querySelector(`.auth-tabs .tab-btn:nth-child(${pestana === 'login' ? '1' : '2'})`);
  const contenidoActivo = document.getElementById(`auth-${pestana}`);
  
  if (botonActivo) botonActivo.classList.add('active');
  if (contenidoActivo) contenidoActivo.classList.add('active');
  
  // Limpiar mensajes de estado
  const statusDiv = document.getElementById('auth-status');
  if (statusDiv) {
    statusDiv.style.display = 'none';
  }
}

async function verificarSesionExistente() {
  const savedUserId = localStorage.getItem('userId');
  const savedNombre = localStorage.getItem('nombreUsuario');
  
  if (savedUserId && savedNombre) {
    try {
      // Verificar que el usuario aún existe en Firebase
      const userSnap = await get(ref(db, `usuarios/${savedUserId}`));
      
      if (userSnap.exists()) {
        // Usuario válido, restaurar sesión
        userId = savedUserId;
        nombreUsuario = savedNombre;
        
        // Actualizar último acceso
        await update(ref(db, `usuarios/${savedUserId}`), {
          ultimoAcceso: Date.now()
        });
        
        return true;
      } else {
        // Usuario no existe, limpiar localStorage
        localStorage.removeItem('userId');
        localStorage.removeItem('nombreUsuario');
      }
    } catch (error) {
      console.error('Error verificando sesión:', error);
    }
  }
  
  return false;
}

function crearContadorIntentosSupeior() {
  // Buscar si ya existe el contador
  let contadorExistente = document.getElementById("contador-intentos-superior");
  if (contadorExistente) {
    contadorExistente.remove();
  }

  // Crear el contenedor del contador
  const contadorContainer = document.createElement("div");
  contadorContainer.id = "contador-intentos-superior";
  contadorContainer.style.cssText = `
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    padding: 15px 20px;
    margin: 15px 0;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    border: 2px solid rgba(255, 255, 255, 0.2);
  `;

  // Información del jugador
  const infoJugador = document.createElement("div");
  infoJugador.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
  `;

  const iconoJugador = document.createElement("span");
  iconoJugador.textContent = "👤";
  iconoJugador.style.fontSize = "20px";

  const nombreDisplay = document.createElement("span");
  nombreDisplay.textContent = document.getElementById("jugadorNombre").textContent;
  nombreDisplay.style.fontSize = "16px";

  infoJugador.appendChild(iconoJugador);
  infoJugador.appendChild(nombreDisplay);

  // Contador de intentos
  const contadorIntentos = document.createElement("div");
  contadorIntentos.id = "contador-intentos-display";
  contadorIntentos.style.cssText = `
    background: rgba(255, 255, 255, 0.2);
    padding: 8px 15px;
    border-radius: 25px;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  contadorIntentos.innerHTML = `📊 0/10 intentos`;

  // Intentos restantes
  const intentosRestantes = document.createElement("div");
  intentosRestantes.id = "intentos-restantes-display";
  intentosRestantes.style.cssText = `
    background: rgba(255, 255, 255, 0.15);
    padding: 6px 12px;
    border-radius: 15px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.9);
  `;
  intentosRestantes.textContent = "10 restantes";

  // Puntuación del jugador
  const puntuacionContainer = document.createElement("div");
  puntuacionContainer.id = "puntuacion-display";
  puntuacionContainer.style.cssText = `
    background: rgba(255, 215, 0, 0.2);
    padding: 8px 15px;
    border-radius: 25px;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 2px solid rgba(255, 215, 0, 0.3);
  `;
  puntuacionContainer.innerHTML = `🏆 <span id="puntuacion-valor">0</span> pts`;

  contadorContainer.appendChild(infoJugador);
  contadorContainer.appendChild(contadorIntentos);
  contadorContainer.appendChild(puntuacionContainer);
  contadorContainer.appendChild(intentosRestantes);

  // Insertar después del header del juego y antes de la instrucción
  const gameHeader = document.querySelector(".game-header");
  const gameInstruction = document.querySelector(".game-instruction");
  
  if (gameHeader && gameInstruction) {
    gameHeader.parentNode.insertBefore(contadorContainer, gameInstruction);
  } else {
    // Fallback: insertar al inicio del div juego
    const juegoDiv = document.getElementById("juego");
    juegoDiv.insertBefore(contadorContainer, juegoDiv.firstChild);
  }
}

function actualizarContadorIntentosSupeior(intentosUsados) {
  const contadorDisplay = document.getElementById("contador-intentos-display");
  const intentosRestantesDisplay = document.getElementById("intentos-restantes-display");
  const contadorContainer = document.getElementById("contador-intentos-superior");
  
  if (contadorDisplay && intentosRestantesDisplay && contadorContainer) {
    const restantes = 10 - intentosUsados;
    
    // Actualizar texto
    contadorDisplay.innerHTML = `📊 ${intentosUsados}/10 intentos`;
    intentosRestantesDisplay.textContent = `${restantes} restantes`;
    
    // Cambiar colores según el progreso
    let colorFondo = '#007bff'; // Azul por defecto
    let colorContador = 'rgba(255, 255, 255, 0.2)';
    
    if (intentosUsados >= 8) {
      colorFondo = '#dc3545'; // Rojo para peligro
      colorContador = 'rgba(255, 255, 255, 0.3)';
    } else if (intentosUsados >= 6) {
      colorFondo = '#ffc107'; // Amarillo para precaución
      colorContador = 'rgba(0, 0, 0, 0.2)';
      contadorContainer.style.color = '#333';
    } else {
      contadorContainer.style.color = 'white';
    }
    
    contadorContainer.style.background = `linear-gradient(135deg, ${colorFondo} 0%, ${colorFondo}CC 100%)`;
    contadorDisplay.style.background = colorContador;
  }
}

async function actualizarPuntuacionDisplay() {
  const puntuacionValor = document.getElementById("puntuacion-valor");
  const puntuacionContainer = document.getElementById("puntuacion-display");
  
  if (puntuacionValor) {
    // Obtener puntuación actual del jugador
    const perfilRef = ref(db, `perfiles/${userId}`);
    const perfilSnap = await get(perfilRef);
    const perfil = perfilSnap.val();
    
    if (perfil && perfil.puntuacionTotal) {
      const nuevaPuntuacion = perfil.puntuacionTotal;
      const puntuacionAnterior = puntuacionJugador;
      
      puntuacionJugador = nuevaPuntuacion;
      puntuacionValor.textContent = nuevaPuntuacion.toLocaleString();
      
      // Animación si la puntuación aumentó
      if (nuevaPuntuacion > puntuacionAnterior && puntuacionContainer) {
        puntuacionContainer.classList.add('puntuacion-highlight');
        setTimeout(() => {
          puntuacionContainer.classList.remove('puntuacion-highlight');
        }, 2000);
      }
    } else {
      puntuacionValor.textContent = "0";
    }
  }
}

// ---------------------- CREAR / UNIR SALA ------------------------

async function crearSala() {
  if (!userId || !nombreUsuario) {
    mostrarEstado("Error: Usuario no autenticado", "red");
    return;
  }

  // Obtener el modo de juego seleccionado
  const modoJuego = document.querySelector('input[name="modoJuego"]:checked').value;
  const maxJugadores = modoJuego === "solo" ? 1 : 2;

  salaId = generarCodigoSala();
  secuenciaSala = generarSecuencia();

  await set(ref(db, "salas/" + salaId), {
    secuencia: secuenciaSala,
    jugadores: {
      [userId]: { nombre: nombreUsuario, intentosCount: 0, intentos: {} }
    },
    turno: userId,
    estadoJuego: modoJuego === "solo" ? "jugando" : "esperando",
    maxJugadores: maxJugadores,
    modoJuego: modoJuego
  });

  mostrarEstado("Sala creada: " + salaId, "green");
  console.log(`Sala creada en modo ${modoJuego}, estado: ${modoJuego === "solo" ? "jugando" : "esperando"}`);
  await iniciarJuego(nombreUsuario);
  
  // Para modo solo, asegurar que el turno esté habilitado inmediatamente
  if (modoJuego === "solo") {
    console.log("Modo solo: habilitando turno inmediatamente");
    setTimeout(() => {
      document.querySelector("button[onclick='enviarIntento()']").disabled = false;
      mostrarEstado("Es tu turno. Sin límite de tiempo.");
      document.getElementById("tiempoRestante").textContent = "∞";
    }, 500);
  }
  ocultarFormularios();
  mostrarBotonSalir(true);
  actualizarListaSalas();
}

async function unirseSala() {
  if (!userId || !nombreUsuario) {
    mostrarEstado("Error: Usuario no autenticado", "red");
    return;
  }

  const codigo = document.getElementById("codigoUnir").value.trim().toUpperCase();

  if (!codigo) return mostrarEstado("Ingresa el código de sala", "red");

  salaId = codigo;
  const salaSnap = await get(ref(db, "salas/" + salaId));
  if (!salaSnap.exists()) return mostrarEstado("Sala no existe", "red");

  const salaData = salaSnap.val();
  const jugadores = salaData.jugadores || {};
  const maxJugadores = salaData.maxJugadores || 2;
  const modoJuego = salaData.modoJuego || "dos";

  if (modoJuego === "solo") return mostrarEstado("Esta sala es solo para un jugador", "red");
  if (Object.keys(jugadores).length >= maxJugadores) return mostrarEstado("Sala llena", "red");

  await set(ref(db, `salas/${salaId}/jugadores/${userId}`), { nombre: nombreUsuario, intentosCount: 0, intentos: {} });

  mostrarEstado("Unido a sala " + salaId);
  await iniciarJuego(nombreUsuario);
  ocultarFormularios();
  mostrarBotonSalir(true);
  actualizarListaSalas();
}

// ---------------------- JUEGO ------------------------

async function iniciarJuego(nombreJugador) {
  document.getElementById("formulario").style.display = "none";
  document.getElementById("juego").style.display = "block";
  document.getElementById("jugadorNombre").textContent = nombreJugador;
  document.getElementById("codigoSala").textContent = salaId;

  // Limpiar orden de selección al iniciar
  ordenSeleccion = [];
  juegoTerminado = false; // Resetear flag de juego terminado
  inicioPartida = Date.now(); // Registrar inicio de la partida
  
  // Crear el contador de intentos en la parte superior
  crearContadorIntentosSupeior();
  
  // Cargar y actualizar puntuación del jugador
  await actualizarPuntuacionDisplay();
  
  // Obtener modo de juego y configurar UI según el modo
  const salaSnap = await get(ref(db, `salas/${salaId}`));
  const modoJuego = salaSnap.val()?.modoJuego || "dos";
  
  const chatContainer = document.getElementById("chat-container");
  const timerDisplay = document.querySelector(".timer-display");
  
  if (modoJuego === "solo") {
    chatContainer.style.display = "none";
    timerDisplay.style.display = "none";
    document.getElementById("compartirSalaBtn").style.display = "none";
  } else {
    chatContainer.style.display = "flex";
    timerDisplay.style.display = "block";
    document.getElementById("compartirSalaBtn").style.display = "inline-flex";
  }
  
  mostrarColores();
  escucharEstadoJuego();
  escucharTurno();
  escucharTodosLosIntentos();
  mostrarJugadoresEnSala();
  escucharChat();
  escucharJugadoresYActivarJuego(); 
  escucharSecuencia(); // Añadir listener para la secuencia
  escucharResultadosJuego(); // Escuchar resultados en multijugador

  // Obtener la secuencia de la sala y asegurar que esté disponible
  get(ref(db, `salas/${salaId}/secuencia`)).then(snap => {
    if (snap.exists()) {
      secuenciaSala = snap.val();
      console.log("Secuencia cargada al iniciar juego:", secuenciaSala);
    } else {
      console.error("No se encontró secuencia en la sala");
    }
  }).catch(error => {
    console.error("Error al cargar secuencia:", error);
  });

  onDisconnect(ref(db, `salas/${salaId}/jugadores/${userId}`)).remove();
  document.querySelector("button[onclick='enviarIntento()']").disabled = true;
  mostrarBotonSalir(true);
  ocultarFormularios();
  
  // Verificar estado del juego después de unirse
  setTimeout(async () => {
    try {
      const salaSnap = await get(ref(db, `salas/${salaId}`));
      const sala = salaSnap.val();
      
      if (!sala) {
        console.error("No se encontró la sala");
        return;
      }
      
      console.log("Verificando estado del juego...", {
        modoJuego,
        estadoJuego: sala.estadoJuego,
        turno: sala.turno,
        userId,
        jugadoresCount: Object.keys(sala.jugadores || {}).length
      });
      
      if (modoJuego === "solo") {
        // En modo solo, habilitar inmediatamente
        console.log("Modo solo: habilitando controles inmediatamente");
        document.querySelector("button[onclick='enviarIntento()']").disabled = false;
        mostrarEstado("¡Comenzá a jugar!");
        document.getElementById("tiempoRestante").textContent = "∞";
      } else if (sala.jugadores && Object.keys(sala.jugadores).length >= 2) {
        console.log("Dos jugadores presentes, verificando estado del juego...");
        
        // Asegurar que el timer sea visible para modo multijugador
        document.querySelector(".timer-display").style.display = "block";
        console.log("Timer display configurado como visible");
        
        if (sala.estadoJuego === "esperando") {
          await update(ref(db, `salas/${salaId}`), { estadoJuego: "jugando" });
          console.log("Estado del juego actualizado a 'jugando'");
        }
        
        // Si hay un turno establecido, actualizar la UI apropiadamente
        if (sala.turno) {
          if (sala.turno === userId) {
            document.querySelector("button[onclick='enviarIntento()']").disabled = false;
            console.log("Es tu turno, habilitando controles");
            mostrarEstado("Es tu turno. Tenés 20 segundos.");
            iniciarTemporizadorTurno(modoJuego);
          } else {
            document.getElementById("tiempoRestante").textContent = "-";
            const nombreOtroJugador = jugadoresEnSala[sala.turno]?.nombre || "otro jugador";
            mostrarEstado(`Es el turno de ${nombreOtroJugador}`, "orange");
            console.log("No es tu turno, mostrando '-' en timer");
          }
        }
      } else {
        // Modo multijugador pero solo hay un jugador
        mostrarEstado("Esperando a otro jugador...", "orange");
      }
    } catch (error) {
      console.error("Error al verificar estado del juego:", error);
    }
  }, 1000);
}

function escucharJugadoresYActivarJuego() {
  onValue(ref(db, `salas/${salaId}/jugadores`), async snap => {
    const jugadores = snap.val() || {};
    jugadoresEnSala = jugadores; // Almacenamos la lista de jugadores localmente
    const jugadoresCount = Object.keys(jugadores).length;
    
    // Obtener información completa de la sala
    const salaSnap = await get(ref(db, `salas/${salaId}`));
    const salaData = salaSnap.val();
    if (!salaData) return;
    
    const maxJugadores = salaData.maxJugadores || 2;
    const modoJuego = salaData.modoJuego || "dos";
    const estadoActual = salaData.estadoJuego || "esperando";

    console.log(`Jugadores en sala: ${jugadoresCount}/${maxJugadores}, Estado actual: ${estadoActual}, Modo: ${modoJuego}`);

    if (modoJuego === "dos" && jugadoresCount === maxJugadores && estadoActual === "esperando") {
      console.log("Condiciones cumplidas para iniciar juego automáticamente...");
      
      try {
        // Cambiar estado a jugando
        await update(ref(db, `salas/${salaId}`), { estadoJuego: "jugando" });
        console.log("Estado cambiado a 'jugando'");
        
        // Asignar turno al primer jugador
        const jugadoresList = Object.keys(jugadores);
        const primerJugadorId = jugadoresList[0];
        await update(ref(db, `salas/${salaId}`), { turno: primerJugadorId });
        console.log(`Turno asignado a: ${primerJugadorId}`);
        
        // Mostrar mensaje de inicio
        mostrarEstado("¡Juego iniciado! Esperando turno...", "green");
        
        // Asegurar que el timer sea visible
        document.querySelector(".timer-display").style.display = "block";
        
      } catch (error) {
        console.error("Error al iniciar juego automáticamente:", error);
      }
    } else if (modoJuego === "dos" && jugadoresCount < maxJugadores) {
      mostrarEstado(`Esperando jugadores... (${jugadoresCount}/${maxJugadores})`, "orange");
    }
      
    // Asegurar que el timer sea visible para modo multijugador
    if (modoJuego === "dos") {
      document.querySelector(".timer-display").style.display = "block";
    }
  });
}

function escucharSecuencia() {
  onValue(ref(db, `salas/${salaId}/secuencia`), snap => {
    if (snap.exists()) {
      secuenciaSala = snap.val();
      console.log("Secuencia actualizada:", secuenciaSala);
    }
  });
}

function escucharEstadoJuego() {
  onValue(ref(db, `salas/${salaId}/estadoJuego`), async snap => {
    const estado = snap.val();
    
    // Obtener información de la sala
    const salaSnap = await get(ref(db, `salas/${salaId}`));
    const salaData = salaSnap.val();
    if (!salaData) return;
    
    const modoJuego = salaData.modoJuego || "dos";
    const maxJugadores = salaData.maxJugadores || 2;
    const turnoActual = salaData.turno;
    
    console.log(`Estado del juego cambió a: ${estado}, Modo: ${modoJuego}, Turno: ${turnoActual}`);
    
    if (estado === "jugando") {
      mostrarEstado(modoJuego === "solo" ? "¡Comenzá a jugar!" : "¡El juego comenzó!");
      
      // Asegurar que el timer sea visible para modo multijugador
      if (modoJuego === "dos") {
        document.querySelector(".timer-display").style.display = "block";
      }
      
      // Si es el turno del usuario actual, habilitar controles
      if (turnoActual === userId) {
        if (modoJuego === "solo") {
          document.querySelector("button[onclick='enviarIntento()']").disabled = false;
          document.getElementById("tiempoRestante").textContent = "∞";
          mostrarEstado("Es tu turno. Sin límite de tiempo.");
        } else {
          document.querySelector("button[onclick='enviarIntento()']").disabled = false;
          mostrarEstado("Es tu turno. Tenés 20 segundos.");
        }
      } else if (modoJuego === "dos") {
        document.querySelector("button[onclick='enviarIntento()']").disabled = true;
        const nombreOtroJugador = jugadoresEnSala[turnoActual]?.nombre || "otro jugador";
        mostrarEstado(`Es el turno de ${nombreOtroJugador}`, "orange");
      }
      
    } else if (estado === "terminado") {
      mostrarEstado("Juego terminado", "blue");
      clearInterval(timerInterval);
    } else {
      if (modoJuego === "solo") {
        mostrarEstado("Sala individual creada", "green");
      } else {
        mostrarEstado("Esperando a otro jugador...", "orange");
      }
    }
  });
}

function escucharTurno() {
  onValue(ref(db, `salas/${salaId}/turno`), async snap => {
    jugadorTurno = snap.val();
    const salaSnap = await get(ref(db, `salas/${salaId}`));
    const sala = salaSnap.val();
    if (!sala) return;

    const modoJuego = sala.modoJuego || "dos";
    
    console.log(`Turno actual: ${jugadorTurno}, Estado juego: ${sala.estadoJuego}, Usuario actual: ${userId}`);

    // Si el juego no está en curso, no procesar el turno (excepto en modo solo)
    if (sala.estadoJuego !== "jugando" && modoJuego !== "solo") {
      console.log("Juego no está en curso, no se procesa el turno");
      return;
    }

    // En modo solo, siempre asegurar que el juego esté en estado "jugando"
    if (modoJuego === "solo" && sala.estadoJuego !== "jugando") {
      console.log("Modo solo: forzando estado a 'jugando'");
      await update(ref(db, `salas/${salaId}`), { estadoJuego: "jugando" });
    }

    // Asegurar que el timer sea visible para modo multijugador
    if (modoJuego === "dos") {
      document.querySelector(".timer-display").style.display = "block";
    }

    if (jugadorTurno === userId) {
      // Verificar si este jugador ya agotó sus intentos
      const jugadorData = sala.jugadores?.[userId];
      const intentosUsados = jugadorData?.intentosCount || 0;
      
      if (intentosUsados >= 10) {
        // Este jugador ya no puede jugar, mostrar mensaje de espera
        mostrarEstado("Has agotado tus intentos. Esperando a que termine el otro jugador...", "orange");
        document.querySelector("button[onclick='enviarIntento()']").disabled = true;
        clearInterval(timerInterval);
        document.getElementById("tiempoRestante").textContent = "-";
        return;
      }
      
      if (modoJuego === "solo") {
        console.log("Modo solo: habilitando turno del usuario");
        reproducirSonido('turno'); // Sonido de turno en modo solo
        mostrarEstado("Es tu turno. Sin límite de tiempo.");
        document.querySelector("button[onclick='enviarIntento()']").disabled = false;
        // En modo solo, no iniciar temporizador
        clearInterval(timerInterval);
        document.getElementById("tiempoRestante").textContent = "∞";
      } else {
        reproducirSonido('turno'); // Sonido de turno en multijugador
        mostrarEstado("Es tu turno. Tenés 20 segundos.");
        document.querySelector("button[onclick='enviarIntento()']").disabled = false;
        iniciarTemporizadorTurno(modoJuego);
        console.log("Es tu turno, timer iniciado");
      }
    } else {
      const nombreOtroJugador = jugadoresEnSala[jugadorTurno]?.nombre || "otro jugador";
      mostrarEstado(`Es el turno de ${nombreOtroJugador}`, "orange");
      clearInterval(timerInterval);
      document.getElementById("tiempoRestante").textContent = "-";
      document.querySelector("button[onclick='enviarIntento()']").disabled = true;
      console.log(`Es el turno de ${nombreOtroJugador}`);
    }
    
    // Actualizar indicador de turno
    actualizarIndicadorTurno();
  });
}

function iniciarTemporizadorTurno(modoJuego = "dos") {
  // En modo solo no hay temporizador
  if (modoJuego === "solo") {
    document.getElementById("tiempoRestante").textContent = "∞";
    clearInterval(timerInterval); // Limpiar cualquier timer existente
    return;
  }

  // En modo multijugador: 20 segundos
  tiempoRestante = 20;
  document.getElementById("tiempoRestante").textContent = tiempoRestante;
  clearInterval(timerInterval);
  timerInterval = setInterval(async () => {
    tiempoRestante--;
    document.getElementById("tiempoRestante").textContent = tiempoRestante;
    
    // Sonido de advertencia cuando quedan 5 segundos o menos
    if (tiempoRestante <= 5 && tiempoRestante > 0) {
      reproducirSonido('tiempo');
    }
    
    if (tiempoRestante <= 0) {
      clearInterval(timerInterval);
      reproducirSonido('error'); // Sonido de tiempo agotado
      mostrarEstado("Se acabó el tiempo", "red");
      
      // Verificar si es modo solo
      const salaSnap = await get(ref(db, `salas/${salaId}`));
      const salaData = salaSnap.val();
      const modoJuegoActual = salaData?.modoJuego || "dos";
      
      // Solo en modo multijugador contar como intento perdido o pasar turno
      if (modoJuegoActual === "dos") {
        await contarIntentoTiempoAgotado();
      }
    }
  }, 1000);
}

async function contarIntentoTiempoAgotado() {
  const jugadorRef = ref(db, `salas/${salaId}/jugadores/${userId}`);
  const snap = await get(jugadorRef);
  if (!snap.exists()) return;

  const data = snap.val();
  
  // Agregar intento fallido por tiempo
  await push(ref(db, `salas/${salaId}/jugadores/${userId}/intentos`), {
    intento: ["tiempo", "agotado", "", ""],
    aciertosColorPos: 0,
    aciertosColor: 0,
    tiempoAgotado: true
  });

  const nuevosIntentos = data.intentosCount + 1;
  await update(jugadorRef, { intentosCount: nuevosIntentos });

  // Actualizar contador superior inmediatamente
  actualizarContadorIntentosSupeior(nuevosIntentos);

  // Limpiar selección
  ordenSeleccion = [];
  document.querySelectorAll(".color-btn.selected").forEach(btn => {
    btn.classList.remove("selected");
    const numero = btn.querySelector(".numero-orden");
    if (numero) numero.remove();
  });

  // Verificar si alcanzó el máximo de intentos
  if (nuevosIntentos >= 10) {
    // En lugar de terminar inmediatamente, verificar si es multijugador
    const salaSnap = await get(ref(db, `salas/${salaId}`));
    const salaData = salaSnap.val();
    const modoJuego = salaData?.modoJuego || "dos";
    
    if (modoJuego === "solo") {
      // En modo solo, terminar inmediatamente
      await update(ref(db, `salas/${salaId}`), { estadoJuego: "terminado" });
      juegoTerminado = true;
      await manejarResultadoJuego("derrota_tiempo");
      return;
    } else {
      // En modo multijugador, marcar que este jugador terminó y verificar si ambos terminaron
      await verificarFinJuegoMultijugador();
      return;
    }
  }

  // Reiniciar el temporizador para el siguiente intento
  mostrarEstado("¡Intentá de nuevo! Seleccioná más rápido.");
  document.querySelector("button[onclick='enviarIntento()']").disabled = false;
  
  // Obtener el modo de juego para el temporizador
  const salaSnap = await get(ref(db, `salas/${salaId}`));
  const salaData = salaSnap.val();
  const modoJuego = salaData?.modoJuego || "dos";
  iniciarTemporizadorTurno(modoJuego);
}

async function enviarIntento() {
  // Usar el orden de selección en lugar de elementos seleccionados
  if (ordenSeleccion.length !== 4) return mostrarEstado("Elegí 4 colores", "red");
  if (jugadorTurno !== userId) return mostrarEstado("No es tu turno", "red");

  const jugadorRef = ref(db, `salas/${salaId}/jugadores/${userId}`);
  const snap = await get(jugadorRef);
  if (!snap.exists()) return mostrarEstado("Jugador no encontrado", "red");

  const data = snap.val();
  if (data.intentosCount >= 10) return mostrarEstado("Máximo 10 intentos", "red");

  const resultado = compararIntento(ordenSeleccion, secuenciaSala);
  await push(ref(db, `salas/${salaId}/jugadores/${userId}/intentos`), {
    intento: ordenSeleccion,
    aciertosColorPos: resultado.aciertosColorPos,
    aciertosColor: resultado.aciertosColor
  });

  const nuevosIntentos = data.intentosCount + 1;
  await update(jugadorRef, { intentosCount: nuevosIntentos });

  // Actualizar contador superior inmediatamente
  actualizarContadorIntentosSupeior(nuevosIntentos);

  if (resultado.aciertosColorPos === 4) {
    reproducirSonido('victoria'); // Sonido de victoria
    await update(ref(db, `salas/${salaId}`), { estadoJuego: "terminado" });
    juegoTerminado = true;
    // Usar la nueva función para manejar victoria en multijugador
    await manejarResultadoJuego("victoria", userId);
    clearInterval(timerInterval);
    return;
  }

  // Reproducir sonido según el resultado
  if (resultado.aciertosColorPos > 0 || resultado.aciertosColor > 0) {
    reproducirSonido('acierto'); // Sonido de acierto parcial
  } else {
    reproducirSonido('error'); // Sonido de error (sin aciertos)
  }

  // Verificar si alcanzó el máximo de intentos
  if (nuevosIntentos >= 10) {
    // En lugar de terminar inmediatamente, verificar si es multijugador
    const salaSnap = await get(ref(db, `salas/${salaId}`));
    const salaData = salaSnap.val();
    const modoJuego = salaData?.modoJuego || "dos";
    
    if (modoJuego === "solo") {
      // En modo solo, terminar inmediatamente
      await update(ref(db, `salas/${salaId}`), { estadoJuego: "terminado" });
      juegoTerminado = true;
      await manejarResultadoJuego("derrota_intentos");
      clearInterval(timerInterval);
      return;
    } else {
      // En modo multijugador, marcar que este jugador terminó y verificar si ambos terminaron
      await verificarFinJuegoMultijugador();
      return;
    }
  }

  // Limpiar selección para el siguiente intento
  ordenSeleccion = [];
  document.querySelectorAll(".color-btn.selected").forEach(btn => {
    btn.classList.remove("selected");
    const numero = btn.querySelector(".numero-orden");
    if (numero) numero.remove();
  });

  clearInterval(timerInterval);
  
  // Verificar si es modo solo o multijugador
  const salaSnap = await get(ref(db, `salas/${salaId}`));
  const salaData = salaSnap.val();
  const modoJuego = salaData?.modoJuego || "dos";
  
  if (modoJuego === "solo") {
    // En modo solo, el jugador puede seguir jugando
    mostrarEstado("¡Intentá de nuevo!");
    document.querySelector("button[onclick='enviarIntento()']").disabled = false;
    iniciarTemporizadorTurno(modoJuego);
  } else {
    // En modo multijugador, pasar turno
    pasarTurno();
  }
}

async function pasarTurno() {
  const snap = await get(ref(db, `salas/${salaId}`));
  const jugadores = Object.keys(snap.val().jugadores || {});
  if (jugadores.length < 2) return;

  const siguiente = jugadores.find(id => id !== jugadorTurno);
  if (siguiente) await update(ref(db, `salas/${salaId}`), { turno: siguiente });
}

function compararIntento(intento, secuencia) {
  let aciertosColorPos = 0, aciertosColor = 0;

  // Contar posiciones exactas
  for (let i = 0; i < 4; i++) {
    if (intento[i] === secuencia[i]) {
      aciertosColorPos++;
    }
  }

  // Contar todos los colores correctos (sin importar posición)
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (intento[i] === secuencia[j]) {
        aciertosColor++;
        break; // Solo contar una vez por color del intento
      }
    }
  }

  return { aciertosColorPos, aciertosColor };
}

function mostrarCombinacionCorrecta() {
  // Crear el mensaje de derrota
  mostrarEstado("No adivinaste el color, perdiste", "red");
  juegoTerminado = true;
  
  // Actualizar estadísticas de partidas jugadas (sin puntos por perder)
  actualizarPartidasJugadas();
  
  console.log("Mostrando combinación correcta. Secuencia:", secuenciaSala);
  
  // Verificar que tengamos la secuencia
  if (!secuenciaSala || secuenciaSala.length === 0) {
    console.error("Error: secuenciaSala está vacía o no definida");
    // Intentar obtener la secuencia de Firebase
    get(ref(db, `salas/${salaId}/secuencia`)).then(snap => {
      if (snap.exists()) {
        secuenciaSala = snap.val();
        console.log("Secuencia obtenida de Firebase:", secuenciaSala);
        // Llamar con la secuencia correcta
        mostrarColoresRespaldo(secuenciaSala);
      } else {
        console.error("No se pudo obtener la secuencia de Firebase");
      }
    });
    return;
  }
  
  mostrarColoresRespaldo(secuenciaSala);
}

function mostrarColoresRespaldo(secuencia) {
  console.log("Creando colores de respaldo garantizados...");
  const historial = document.getElementById("historial");
  
  const respaldo = document.createElement("div");
  respaldo.innerHTML = `
    <div style="
      background: rgba(255, 255, 255, 0.95);
      border: 3px solid #333;
      border-radius: 15px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    ">
      <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">💔 ¡No adivinaste la combinación!</h3>
      <p style="color: #333; margin: 0 0 15px 0; font-weight: bold;">🎯 La combinación correcta era:</p>
      <div style="display: flex; gap: 15px; justify-content: center; margin: 15px 0; flex-wrap: wrap;">
        ${secuencia.map((color, i) => `
          <div style="
            width: 60px; 
            height: 60px; 
            background-color: ${color}; 
            border: 3px solid #333;
            border-radius: 12px;
            display: inline-block;
            position: relative;
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
          " title="${obtenerNombreColor(color)}">
            <div style="
              position: absolute;
              top: -8px;
              right: -8px;
              background: white;
              color: #333;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: bold;
              border: 2px solid #333;
            ">${i + 1}</div>
            <div style="
              position: absolute;
              bottom: -25px;
              left: 50%;
              transform: translateX(-50%);
              font-size: 10px;
              color: #333;
              font-weight: bold;
              text-align: center;
              white-space: nowrap;
            ">${obtenerNombreColor(color)}</div>
          </div>
        `).join('')}
      </div>
      <p style="color: #333; margin: 15px 0 0 0; font-size: 14px; font-style: italic;">💪 ¡Inténtalo de nuevo en una nueva partida!</p>
    </div>
  `;
  
  historial.insertBefore(respaldo, historial.firstChild);
  console.log("Colores de respaldo creados exitosamente");
  
  // Deshabilitar el botón de enviar intento
  document.querySelector("button[onclick='enviarIntento()']").disabled = true;
  
  // Mostrar botón de revancha después de un delay más largo para ver los colores
  setTimeout(() => {
    mostrarBotonRevancha();
  }, 5000); // Aumentado de 2000 a 5000ms (5 segundos)
}

function obtenerNombreColor(color) {
  const coloresNombres = {
    'red': 'Rojo',
    'blue': 'Azul', 
    'green': 'Verde',
    'yellow': 'Amarillo',
    'orange': 'Naranja',
    'purple': 'Violeta'
  };
  return coloresNombres[color] || color;
}

// ---------------------- SISTEMA DE PUNTUACIÓN ------------------------

function calcularPuntuacion(intentosUsados, tiempoTranscurrido) {
  let puntuacionBase = 1000; // Puntuación base por ganar
  
  // Bonus por pocos intentos (máximo 500 puntos)
  const bonusIntentos = Math.max(0, 500 - (intentosUsados - 1) * 50);
  
  // Bonus por velocidad (máximo 300 puntos)
  // Menos puntos por cada segundo que pase de 30 segundos
  const tiempoEnSegundos = Math.floor(tiempoTranscurrido / 1000);
  const bonusVelocidad = Math.max(0, 300 - Math.max(0, tiempoEnSegundos - 30) * 5);
  
  // Bonus perfecto (200 puntos extra si se gana en el primer intento y menos de 15 segundos)
  const bonusPerfecto = (intentosUsados === 1 && tiempoEnSegundos <= 15) ? 200 : 0;
  
  const puntuacionTotal = puntuacionBase + bonusIntentos + bonusVelocidad + bonusPerfecto;
  
  return {
    total: puntuacionTotal,
    base: puntuacionBase,
    bonusIntentos: bonusIntentos,
    bonusVelocidad: bonusVelocidad,
    bonusPerfecto: bonusPerfecto,
    tiempoSegundos: tiempoEnSegundos,
    intentos: intentosUsados
  };
}

async function guardarPuntuacion(puntuacionData) {
  const jugadorNombre = document.getElementById("jugadorNombre").textContent;
  const timestamp = Date.now();
  
  // Guardar puntuación individual del jugador
  await push(ref(db, `puntuaciones/${userId}`), {
    puntuacion: puntuacionData.total,
    detalles: puntuacionData,
    jugador: jugadorNombre,
    fecha: timestamp,
    salaId: salaId,
    intentos: puntuacionData.intentos,
    tiempoSegundos: puntuacionData.tiempoSegundos,
    modo: "victoria"
  });
  
  // Actualizar puntuación total del jugador
  const perfilRef = ref(db, `perfiles/${userId}`);
  const perfilSnap = await get(perfilRef);
  const perfilActual = perfilSnap.val() || { 
    nombre: jugadorNombre, 
    puntuacionTotal: 0, 
    partidasGanadas: 0,
    partidasJugadas: 0,
    partidasPerdidas: 0
  };
  
  await update(perfilRef, {
    nombre: jugadorNombre,
    puntuacionTotal: (perfilActual.puntuacionTotal || 0) + puntuacionData.total,
    partidasGanadas: (perfilActual.partidasGanadas || 0) + 1,
    partidasJugadas: (perfilActual.partidasJugadas || 0) + 1,
    partidasPerdidas: perfilActual.partidasPerdidas || 0, // Mantener las perdidas actuales
    ultimaPartida: timestamp
  });
  
  puntuacionJugador = (perfilActual.puntuacionTotal || 0) + puntuacionData.total;
}

async function actualizarPartidasJugadas(perdida = true) {
  const jugadorNombre = document.getElementById("jugadorNombre").textContent;
  const timestamp = Date.now();
  
  const perfilRef = ref(db, `perfiles/${userId}`);
  const perfilSnap = await get(perfilRef);
  const perfilActual = perfilSnap.val() || { 
    nombre: jugadorNombre, 
    puntuacionTotal: 0, 
    partidasGanadas: 0,
    partidasJugadas: 0,
    partidasPerdidas: 0
  };
  
  // Actualizar estadísticas
  const datosActualizados = {
    nombre: jugadorNombre,
    puntuacionTotal: perfilActual.puntuacionTotal || 0,
    partidasGanadas: perfilActual.partidasGanadas || 0,
    partidasJugadas: (perfilActual.partidasJugadas || 0) + 1,
    partidasPerdidas: perdida ? (perfilActual.partidasPerdidas || 0) + 1 : (perfilActual.partidasPerdidas || 0),
    ultimaPartida: timestamp
  };
  
  await update(perfilRef, datosActualizados);
  
  // Guardar en historial de puntuaciones (incluso si perdió con 0 puntos)
  if (perdida) {
    const puntuacionRef = push(ref(db, `puntuaciones/${userId}`));
    await set(puntuacionRef, {
      puntuacion: 0,
      fecha: timestamp,
      intentos: 10, // Máximo intentos alcanzados
      tiempoSegundos: 0,
      modo: "derrota"
    });
  }
}

function mostrarDetallesPuntuacion(puntuacionData) {
  const { total, base, bonusIntentos, bonusVelocidad, bonusPerfecto, tiempoSegundos, intentos } = puntuacionData;
  
  const detallesDiv = document.createElement("div");
  detallesDiv.className = "detalles-puntuacion";
  detallesDiv.style.cssText = `
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid #28a745;
    border-radius: 12px;
    padding: 20px;
    margin: 15px 0;
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
  `;
  
  detallesDiv.innerHTML = `
    <div style="text-align: center;">
      <h3 style="color: #28a745; margin: 0 0 15px 0; font-size: 20px;">
        🏆 ¡Puntuación Obtenida: ${total.toLocaleString()} puntos!
      </h3>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid #007bff;">
          <strong style="color: #007bff;">⭐ Puntuación Base</strong><br>
          <span style="font-size: 18px; font-weight: bold;">${base}</span> puntos
        </div>
        
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid ${bonusIntentos > 0 ? '#28a745' : '#6c757d'};">
          <strong style="color: ${bonusIntentos > 0 ? '#28a745' : '#6c757d'};">🎯 Bonus Precisión</strong><br>
          <span style="font-size: 18px; font-weight: bold;">${bonusIntentos}</span> puntos<br>
          <small>${intentos} intento${intentos !== 1 ? 's' : ''} usado${intentos !== 1 ? 's' : ''}</small>
        </div>
        
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid ${bonusVelocidad > 0 ? '#ffc107' : '#6c757d'};">
          <strong style="color: ${bonusVelocidad > 0 ? '#ffc107' : '#6c757d'};">⚡ Bonus Velocidad</strong><br>
          <span style="font-size: 18px; font-weight: bold;">${bonusVelocidad}</span> puntos<br>
          <small>${tiempoSegundos} segundo${tiempoSegundos !== 1 ? 's' : ''}</small>
        </div>
        
        ${bonusPerfecto > 0 ? `
        <div style="background: linear-gradient(45deg, #ff6b6b, #feca57); padding: 12px; border-radius: 8px; color: white;">
          <strong>🎊 ¡PERFECTO!</strong><br>
          <span style="font-size: 18px; font-weight: bold;">${bonusPerfecto}</span> puntos<br>
          <small>¡Increíble!</small>
        </div>
        ` : ''}
      </div>
      
      <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 15px; border-radius: 10px; margin-top: 15px;">
        <strong style="font-size: 16px;">💎 Puntuación Total Acumulada</strong><br>
        <span style="font-size: 24px; font-weight: bold;">${puntuacionJugador.toLocaleString()}</span> puntos
      </div>
    </div>
  `;
  
  const historial = document.getElementById("historial");
  historial.insertBefore(detallesDiv, historial.firstChild);
}

function convertirRGBaNombre(rgbColor) {
  // Normalizar el color quitando espacios
  const colorLimpio = rgbColor.replace(/\s/g, '');
  
  // Mapeo de colores RGB a nombres
  const mapaColores = {
    'rgb(255,0,0)': 'red',
    'red': 'red',
    'rgb(0,0,255)': 'blue', 
    'blue': 'blue',
    'rgb(0,128,0)': 'green',
    'green': 'green',
    'rgb(255,255,0)': 'yellow',
    'yellow': 'yellow',
    'rgb(255,165,0)': 'orange',
    'orange': 'orange',
    'rgb(128,0,128)': 'purple',
    'purple': 'purple'
  };
  
  return mapaColores[colorLimpio] || colorLimpio;
}

function reproducirSonidoDerrota() {
  // Crear un sonido simple usando Web Audio API
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    // Si no se puede reproducir sonido, continuar sin él
    console.log('Audio no disponible');
  }
}

function mostrarMensajeVictoria() {
  mostrarEstado("¡Ganaste!", "green");
  juegoTerminado = true;
  
  // Calcular puntuación
  const tiempoTranscurrido = Date.now() - inicioPartida;
  const jugadorRef = ref(db, `salas/${salaId}/jugadores/${userId}`);
  
  get(jugadorRef).then(async (snap) => {
    if (snap.exists()) {
      const data = snap.val();
      const intentosUsados = data.intentosCount || 1;
      
      // Calcular puntuación
      const puntuacionData = calcularPuntuacion(intentosUsados, tiempoTranscurrido);
      
      // Guardar puntuación
      await guardarPuntuacion(puntuacionData);
      
      // Mostrar detalles de puntuación
      mostrarDetallesPuntuacion(puntuacionData);
      
      // Actualizar display de puntuación
      await actualizarPuntuacionDisplay();
    }
  });
  
  const historial = document.getElementById("historial");
  
  const mensajeDiv = document.createElement("div");
  mensajeDiv.className = "mensaje-victoria";
  
  const titulo = document.createElement("h3");
  titulo.innerHTML = "🎉 ¡Felicitaciones, ganaste!";
  mensajeDiv.appendChild(titulo);
  
  const subtitulo = document.createElement("p");
  subtitulo.innerHTML = "🏆 ¡Adivinaste la combinación correcta!";
  mensajeDiv.appendChild(subtitulo);
  
  const mensajeMotivacional = document.createElement("p");
  mensajeMotivacional.innerHTML = "✨ ¡Excelente trabajo! ¿Listo para otra partida?";
  mensajeMotivacional.style.cssText = `
    margin: 15px 0 0 0 !important;
    font-size: 14px !important;
    opacity: 0.9 !important;
    font-style: italic !important;
  `;
  mensajeDiv.appendChild(mensajeMotivacional);
  
  historial.insertBefore(mensajeDiv, historial.firstChild);
  
  document.querySelector("button[onclick='enviarIntento()']").disabled = true;
  
  // Agregar efecto de confeti
  crearConfeti();
  
  reproducirSonidoVictoria();
  
  // Mostrar botón de revancha después del confeti y tiempo para disfrutar la victoria
  setTimeout(() => {
    mostrarBotonRevancha();
  }, 5000); // Aumentado de 3000 a 5000ms
}

function crearConfeti() {
  const coloresConfeti = ['#ff416c', '#ff4b2b', '#00c851', '#007bff', '#ffc107', '#6f42c1'];
  
  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      const confeti = document.createElement('div');
      confeti.style.cssText = `
        position: fixed;
        top: -10px;
        left: ${Math.random() * 100}vw;
        width: 10px;
        height: 10px;
        background: ${coloresConfeti[Math.floor(Math.random() * coloresConfeti.length)]};
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        animation: caerConfeti 3s linear forwards;
      `;
      
      document.body.appendChild(confeti);
      
      setTimeout(() => {
        if (confeti.parentNode) {
          confeti.parentNode.removeChild(confeti);
        }
      }, 3000);
    }, i * 100);
  }
}

function reproducirSonidoVictoria() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Crear una melodía de victoria simple
    const notas = [523.25, 659.25, 783.99, 1046.50]; // Do, Mi, Sol, Do alto
    const duracion = 0.2;
    
    notas.forEach((frecuencia, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frecuencia, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + index * duracion);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + (index + 1) * duracion);
      
      oscillator.start(audioContext.currentTime + index * duracion);
      oscillator.stop(audioContext.currentTime + (index + 1) * duracion);
    });
  } catch (error) {
    console.log('Audio no disponible');
  }
}

function escucharTodosLosIntentos() {
  onValue(ref(db, `salas/${salaId}/jugadores`), async snap => {
    const data = snap.val();
    const historial = document.getElementById("historial");
    
    // Guardar mensajes especiales si existen
    const mensajeDerrota = historial.querySelector('.mensaje-derrota');
    const mensajeVictoria = historial.querySelector('.mensaje-victoria');
    
    historial.innerHTML = "";
    
    // Restaurar mensajes especiales si existían
    if (mensajeVictoria) {
      historial.appendChild(mensajeVictoria);
    }
    if (mensajeDerrota) {
      historial.appendChild(mensajeDerrota);
    }

    let todosAgotaronIntentos = true;
    let hayJugadores = false;

    for (let jugadorId in data) {
      const jugador = data[jugadorId];
      const nombre = jugador.nombre;
      const intentos = jugador.intentos || {};
      const intentosCount = jugador.intentosCount || 0;
      hayJugadores = true;

      // Verificar si este jugador aún tiene intentos
      if (intentosCount < 10) {
        todosAgotaronIntentos = false;
      }

      // Actualizar el contador superior para el jugador actual
      if (jugadorId === userId) {
        actualizarContadorIntentosSupeior(intentosCount);
      }

      // Crear sección del jugador con estadísticas mejoradas (simplificada para el historial)
      const seccionJugador = document.createElement("div");
      seccionJugador.style.cssText = `
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 8px;
        padding: 10px;
        margin: 10px 0;
        border: 1px solid ${jugadorId === userId ? '#007bff' : '#dee2e6'};
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      `;

      const nombreJugador = document.createElement("h4");
      nombreJugador.textContent = `${nombre} ${jugadorId === userId ? '(Tú)' : ''} - ${intentosCount}/10 intentos`;
      nombreJugador.style.cssText = `
        margin: 0 0 8px 0;
        color: #495057;
        font-size: 14px;
        font-weight: 600;
      `;

      seccionJugador.appendChild(nombreJugador);
      historial.appendChild(seccionJugador);

      // Mostrar intentos del jugador en orden cronológico (más reciente al final)
      const intentosArray = Object.values(intentos).sort((a, b) => a.timestamp - b.timestamp);
      intentosArray.forEach(intentoData => {
        const div = document.createElement("div");
        div.className = "intento-container";
        div.style.cssText = `
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 8px 0;
          padding: 10px;
          background: ${intentoData.tiempoAgotado ? '#fff3cd' : '#f8f9fa'};
          border-radius: 8px;
          border-left: 4px solid ${intentoData.tiempoAgotado ? '#ffc107' : '#007bff'};
        `;
        
        const coloresDiv = document.createElement("div");
        coloresDiv.style.cssText = `
          display: flex;
          gap: 5px;
        `;
        
        if (intentoData.tiempoAgotado) {
          // Mostrar indicador de tiempo agotado
          const tiempoBox = document.createElement("div");
          tiempoBox.style.cssText = `
            width: 120px;
            height: 30px;
            border-radius: 6px;
            background: linear-gradient(45deg, #ffc107, #ff9800);
            border: 2px solid #ff9800;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: bold;
          `;
          tiempoBox.textContent = "⏰ TIEMPO AGOTADO";
          coloresDiv.appendChild(tiempoBox);
        } else {
          // Mostrar colores normales
          intentoData.intento.forEach(c => {
            const box = document.createElement("div");
            box.className = "color-btn";
            box.style.cssText = `
              width: 30px;
              height: 30px;
              border-radius: 6px;
              background-color: ${c};
              border: 2px solid #dee2e6;
            `;
            coloresDiv.appendChild(box);
          });
        }
        
        const resultados = document.createElement("div");
        resultados.style.cssText = `
          flex: 1;
          font-size: 14px;
          color: #495057;
        `;
        
        if (intentoData.tiempoAgotado) {
          resultados.innerHTML = `
            <span style="color: #dc3545; font-weight: bold;">❌ Intento perdido por tiempo</span>
          `;
        } else {
          resultados.innerHTML = `
            <span style="color: #28a745; font-weight: bold;">✓ ${intentoData.aciertosColorPos}</span> posición correcta |
            <span style="color: #ffc107; font-weight: bold;">⚬ ${intentoData.aciertosColor}</span> color correcto
          `;
        }
        
        div.appendChild(coloresDiv);
        div.appendChild(resultados);
        historial.appendChild(div);
      });
    }

    // En modo multijugador, verificar si todos agotaron intentos
    if (hayJugadores && todosAgotaronIntentos) {
      const salaSnap = await get(ref(db, `salas/${salaId}`));
      const salaData = salaSnap.val();
      const estadoJuego = salaData?.estadoJuego;
      const modoJuego = salaData?.modoJuego || "dos";
      
      // Solo mostrar derrota si el juego no ha terminado por victoria y no hay mensajes ya
      if (estadoJuego !== "terminado" && modoJuego === "dos" && !mensajeDerrota && !mensajeVictoria) {
        await update(ref(db, `salas/${salaId}`), { estadoJuego: "terminado" });
        juegoTerminado = true;
        mostrarCombinacionCorrecta();
        clearInterval(timerInterval);
      }
    }
  });
}

function mostrarColores() {
  const contenedor = document.getElementById("coloresDisponibles");
  contenedor.innerHTML = "";
  ordenSeleccion = []; // Reiniciar el orden de selección
  
  colores.forEach(color => {
    const btn = document.createElement("div");
    btn.className = "color-btn";
    btn.style.backgroundColor = color;
    btn.style.position = "relative"; // Para posicionar el número
    
    btn.onclick = () => {
      reproducirSonido('click'); // Sonido de click al seleccionar color
      const colorNombre = convertirRGBaNombre(btn.style.backgroundColor);
      
      if (btn.classList.contains("selected")) {
        // Deseleccionar: remover del orden y quitar número
        btn.classList.remove("selected");
        const index = ordenSeleccion.indexOf(colorNombre);
        if (index > -1) {
          ordenSeleccion.splice(index, 1);
        }
        
        // Remover el número
        const numero = btn.querySelector(".numero-orden");
        if (numero) numero.remove();
        
        // Actualizar números de los colores restantes
        actualizarNumerosOrden();
        
      } else if (ordenSeleccion.length < 4) {
        // Seleccionar: agregar al orden y mostrar número
        btn.classList.add("selected");
        ordenSeleccion.push(colorNombre);
        
        // Agregar número de orden
        const numeroDiv = document.createElement("div");
        numeroDiv.className = "numero-orden";
        numeroDiv.textContent = ordenSeleccion.length;
        numeroDiv.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          background: white;
          color: #333;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          border: 2px solid #007bff;
        `;
        btn.appendChild(numeroDiv);
      }
    };
    contenedor.appendChild(btn);
  });
}

function actualizarNumerosOrden() {
  // Actualizar los números de orden después de deseleccionar
  document.querySelectorAll(".color-btn.selected").forEach(btn => {
    const colorNombre = convertirRGBaNombre(btn.style.backgroundColor);
    const posicion = ordenSeleccion.indexOf(colorNombre) + 1;
    
    const numeroDiv = btn.querySelector(".numero-orden");
    if (numeroDiv) {
      numeroDiv.textContent = posicion;
    }
  });
}

function mostrarJugadoresEnSala() {
  const container = document.getElementById("jugadoresSala") || document.createElement("div");
  container.id = "jugadoresSala";
  document.getElementById("juego").prepend(container);

  onValue(ref(db, `salas/${salaId}/jugadores`), snap => {
    const data = snap.val();
    if (!data) return;
    container.textContent = "Jugadores en sala: " + Object.values(data).map(j => j.nombre).join(", ");
  });
}

// ---------------------- SALAS / LISTA ------------------------

function actualizarListaSalas() {
  const contenedor = document.getElementById("contenedorSalas");
  onValue(ref(db, "salas"), snap => {
    const salas = snap.val() || {};
    contenedor.innerHTML = "";
    let haySalasDisponibles = false;

    for (let codigo in salas) {
      const salaData = salas[codigo];
      const jugadores = salaData.jugadores || {};
      const jugadoresCount = Object.keys(jugadores).length;
      const maxJugadores = salaData.maxJugadores || 2;
      const modoJuego = salaData.modoJuego || "dos";
      
      // Solo mostrar salas multijugador que no estén llenas
      if (modoJuego === "dos" && jugadoresCount < maxJugadores) {
        haySalasDisponibles = true;
        const div = document.createElement("div");
        
        let htmlSala = `Sala <b>${codigo}</b> (${jugadoresCount}/${maxJugadores}) 
          <button onclick="unirseDesdeLista('${codigo}')">Unirse</button>`;
        
        // Agregar botón de eliminar si eres admin
        if (esUsuarioAdmin()) {
          htmlSala += ` <button onclick="eliminarSala('${codigo}')" style="background-color: #dc3545; margin-left: 10px;">🗑️ Eliminar</button>`;
        }
        
        div.innerHTML = htmlSala;
        contenedor.appendChild(div);
      }
    }

    if (!haySalasDisponibles) {
      contenedor.innerHTML = "<i>No hay salas disponibles</i>";
    }
  });
}

async function unirseDesdeLista(codigo) {
  // Usar el nombre de usuario actual
  if (!nombreUsuario) {
    alert("Error: No hay usuario activo");
    return;
  }
  
  salaId = codigo;
  const salaSnap = await get(ref(db, "salas/" + salaId));
  if (!salaSnap.exists()) return mostrarEstado("Sala no existe", "red");

  const salaData = salaSnap.val();
  const modoJuego = salaData.modoJuego || "dos";
  
  if (modoJuego === "solo") return mostrarEstado("Esta sala es solo para un jugador", "red");

  await set(ref(db, `salas/${salaId}/jugadores/${userId}`), {
    nombre: nombreUsuario,
    intentosCount: 0,
    intentos: {}
  });

  mostrarEstado("Unido a sala " + salaId);
  await iniciarJuego(nombreUsuario);
  ocultarFormularios();
  mostrarBotonSalir(true);
  actualizarListaSalas();
}

// ---------------------- SALIR / LIMPIEZA ------------------------

async function salirDeSala() {
  if (!salaId || !userId) return;
  const salaRef = ref(db, `salas/${salaId}`);

  await remove(ref(db, `salas/${salaId}/jugadores/${userId}`));

  // Obtener la lista actualizada de jugadores
  const snap = await get(ref(db, `salas/${salaId}/jugadores`));
  const jugadores = snap.val();

  // Si no hay jugadores o la propiedad es nula, eliminar la sala
  if (!jugadores || Object.keys(jugadores).length === 0) {
    await remove(salaRef);
  }

  salaId = "";
  userId = "user_" + Math.random().toString(36).slice(2, 10);
  secuenciaSala = [];
  ordenSeleccion = []; // Limpiar orden de selección

  // Limpiar contador superior
  const contadorSuperior = document.getElementById("contador-intentos-superior");
  if (contadorSuperior) {
    contadorSuperior.remove();
  }

  document.getElementById("juego").style.display = "none";
  document.getElementById("formulario").style.display = "block";
  document.getElementById("listaSalas").style.display = "block";
  mostrarEstado("Saliste de la sala", "gray");
  actualizarListaSalas();
  mostrarBotonSalir(false);
}

// ---------------------- CHAT ------------------------

function enviarMensaje() {
  const input = document.getElementById("mensajeInput");
  const msg = input.value.trim();
  if (!msg) return;

  const jugadorNombre = document.getElementById("jugadorNombre").textContent;
  push(ref(db, `salas/${salaId}/chat`), {
    usuario: jugadorNombre,
    texto: msg,
    timestamp: Date.now()
  });

  input.value = "";
}

function escucharChat() {
  const contenedor = document.getElementById("mensajes");
  let mensajesAnteriores = 0;
  
  onValue(ref(db, `salas/${salaId}/chat`), snap => {
    const data = snap.val() || {};
    const mensajes = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
    
    // Reproducir sonido si hay nuevos mensajes
    if (mensajes.length > mensajesAnteriores && mensajesAnteriores > 0) {
      // Solo reproducir si el último mensaje no es del usuario actual
      const ultimoMensaje = mensajes[mensajes.length - 1];
      if (ultimoMensaje && ultimoMensaje.usuario !== nombreUsuario) {
        reproducirSonido('notificacion');
      }
    }
    mensajesAnteriores = mensajes.length;
    
    contenedor.innerHTML = "";
    mensajes.forEach(m => {
      const div = document.createElement("div");
      div.innerHTML = `<b>${m.usuario}:</b> ${m.texto}`;
      contenedor.appendChild(div);
    });
    contenedor.scrollTop = contenedor.scrollHeight;
  });
}

// ---------------------- SISTEMA DE REVANCHA ------------------------

async function mostrarBotonRevancha() {
  // Verificar si el juego está terminado
  if (!juegoTerminado) return;
  
  // Obtener información de la sala
  const salaSnap = await get(ref(db, `salas/${salaId}`));
  const salaData = salaSnap.val();
  const modoJuego = salaData?.modoJuego || "dos";
  
  // Obtener la secuencia correcta para mostrarla en el modal
  const secuenciaCorrecta = secuenciaSala || salaData?.secuencia || [];
  
  // Remover modal existente si existe
  const modalExistente = document.getElementById("modal-revancha");
  if (modalExistente) {
    modalExistente.remove();
  }
  
  // Crear modal de revancha
  const modalRevancha = document.createElement("div");
  modalRevancha.id = "modal-revancha";
  modalRevancha.className = "modal-revancha";
  
  const modalContent = document.createElement("div");
  modalContent.className = "modal-revancha-content";
  
  // Botón de cerrar
  const btnCerrar = document.createElement("button");
  btnCerrar.className = "modal-revancha-close";
  btnCerrar.innerHTML = "×";
  btnCerrar.onclick = () => {
    modalRevancha.classList.remove("active");
    setTimeout(() => modalRevancha.remove(), 300);
  };
  
  // Título
  const titulo = document.createElement("h2");
  if (modoJuego === "solo") {
    titulo.innerHTML = "🎮 ¿Querés volver a jugar?";
  } else {
    titulo.innerHTML = "🤝 ¿Querés la revancha?";
  }
  
  // Mostrar la combinación correcta en el modal si estamos después de una derrota
  let seccionColores = null;
  if (secuenciaCorrecta && secuenciaCorrecta.length === 4) {
    seccionColores = document.createElement("div");
    seccionColores.style.cssText = `
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 15px;
      margin: 15px 0;
      border: 2px solid rgba(255, 255, 255, 0.3);
    `;
    
    const tituloColores = document.createElement("p");
    tituloColores.innerHTML = "🎯 La combinación correcta era:";
    tituloColores.style.cssText = `
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      text-align: center;
    `;
    seccionColores.appendChild(tituloColores);
    
    const coloresContainer = document.createElement("div");
    coloresContainer.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    `;
    
    secuenciaCorrecta.forEach((color, index) => {
      const colorBox = document.createElement("div");
      colorBox.style.cssText = `
        width: 50px;
        height: 50px;
        background-color: ${color};
        border: 3px solid rgba(255, 255, 255, 0.8);
        border-radius: 10px;
        display: inline-block;
        position: relative;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
      `;
      colorBox.title = obtenerNombreColor(color);
      
      // Número de posición
      const numeroPos = document.createElement("div");
      numeroPos.textContent = index + 1;
      numeroPos.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        background: white;
        color: #333;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      `;
      colorBox.appendChild(numeroPos);
      
      // Nombre del color
      const nombreDiv = document.createElement("div");
      nombreDiv.textContent = obtenerNombreColor(color);
      nombreDiv.style.cssText = `
        position: absolute;
        bottom: -22px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 9px;
        color: rgba(255, 255, 255, 0.8);
        font-weight: 600;
        text-align: center;
        white-space: nowrap;
      `;
      colorBox.appendChild(nombreDiv);
      
      coloresContainer.appendChild(colorBox);
    });
    
    seccionColores.appendChild(coloresContainer);
  }
  
  // Descripción
  const descripcion = document.createElement("p");
  if (modoJuego === "solo") {
    descripcion.innerHTML = "¡Nueva partida con una secuencia diferente te espera!";
  } else {
    descripcion.innerHTML = "Ambos jugadores deben estar de acuerdo para iniciar una nueva partida.";
  }
  
  // Contenedor de botones
  const contenedorBotones = document.createElement("div");
  contenedorBotones.className = "modal-revancha-buttons";
  
  // Botón Sí
  const botonSi = document.createElement("button");
  botonSi.className = "btn-modal-revancha btn-modal-si";
  botonSi.innerHTML = "✅ ¡Sí, vamos!";
  botonSi.onclick = () => votarRevancha(true);
  
  // Botón No
  const botonNo = document.createElement("button");
  botonNo.className = "btn-modal-revancha btn-modal-no";
  botonNo.innerHTML = "❌ No, gracias";
  botonNo.onclick = () => votarRevancha(false);
  
  // Ensamblar modal
  contenedorBotones.appendChild(botonSi);
  contenedorBotones.appendChild(botonNo);
  
  modalContent.appendChild(btnCerrar);
  modalContent.appendChild(titulo);
  
  // Agregar sección de colores si existe
  if (seccionColores) {
    modalContent.appendChild(seccionColores);
  }
  
  modalContent.appendChild(descripcion);
  modalContent.appendChild(contenedorBotones);
  
  modalRevancha.appendChild(modalContent);
  
  // Agregar al DOM
  document.body.appendChild(modalRevancha);
  
  // Mostrar modal con animación
  setTimeout(() => {
    modalRevancha.classList.add("active");
  }, 10);
  
  // Cerrar modal al hacer clic en el fondo
  modalRevancha.addEventListener("click", (e) => {
    if (e.target === modalRevancha) {
      modalRevancha.classList.remove("active");
      setTimeout(() => modalRevancha.remove(), 300);
    }
  });
  
  // Inicializar sistema de votación
  await inicializarSistemaVotacion();
  
  // Escuchar votos
  escucharVotosRevancha();
}

async function inicializarSistemaVotacion() {
  // Limpiar votos anteriores y inicializar nueva votación
  await set(ref(db, `salas/${salaId}/revancha`), {
    votosRevancha: {},
    estado: "votando",
    timestamp: Date.now()
  });
}

async function votarRevancha(voto) {
  // Registrar el voto del jugador
  await set(ref(db, `salas/${salaId}/revancha/votosRevancha/${userId}`), {
    voto: voto,
    nombre: document.getElementById("jugadorNombre").textContent,
    timestamp: Date.now()
  });
  
  // Actualizar estado visual del botón
  actualizarEstadoBotonesRevancha();
}

function actualizarEstadoBotonesRevancha() {
  const modal = document.getElementById("modal-revancha");
  const botonSi = document.querySelector(".btn-modal-si");
  const botonNo = document.querySelector(".btn-modal-no");
  
  if (modal && botonSi && botonNo) {
    // Deshabilitar botones después de votar
    botonSi.disabled = true;
    botonNo.disabled = true;
    botonSi.style.opacity = "0.7";
    botonNo.style.opacity = "0.7";
    botonSi.style.cursor = "not-allowed";
    botonNo.style.cursor = "not-allowed";
    
    // Cambiar el estilo del modal para mostrar estado de votación
    const modalContent = modal.querySelector(".modal-revancha-content");
    if (modalContent) {
      modalContent.classList.add("modal-revancha-votacion");
      
      // Actualizar título
      const titulo = modalContent.querySelector("h2");
      if (titulo) {
        titulo.innerHTML = "⏳ Voto registrado";
      }
      
      // Actualizar descripción
      const descripcion = modalContent.querySelector("p");
      if (descripcion) {
        descripcion.innerHTML = "✅ Tu voto ha sido registrado. Esperando a otros jugadores...";
      }
    }
  }
}

function escucharVotosRevancha() {
  onValue(ref(db, `salas/${salaId}/revancha/votosRevancha`), async (snap) => {
    const votos = snap.val() || {};
    
    // Obtener información de la sala
    const salaSnap = await get(ref(db, `salas/${salaId}`));
    const salaData = salaSnap.val();
    const modoJuego = salaData?.modoJuego || "dos";
    const jugadores = salaData?.jugadores || {};
    const totalJugadores = Object.keys(jugadores).length;
    
    // Contar votos
    const votosArray = Object.values(votos);
    const votosSi = votosArray.filter(v => v.voto === true).length;
    const votosNo = votosArray.filter(v => v.voto === false).length;
    const totalVotos = votosArray.length;
    
    // Actualizar display de votos
    actualizarDisplayVotos(votosSi, votosNo, totalVotos, totalJugadores, modoJuego);
    
    // Verificar si todos han votado o si hay decisión
    if (modoJuego === "solo") {
      // En modo solo, solo necesita el voto del jugador
      if (totalVotos >= 1) {
        const miVoto = votos[userId];
        if (miVoto) {
          if (miVoto.voto) {
            await iniciarNuevaPartida();
          } else {
            mostrarMensajeFinRevancha("Has decidido no jugar otra partida. ¡Gracias por jugar!");
          }
        }
      }
    } else {
      // En modo multijugador
      if (totalVotos >= totalJugadores) {
        // Todos han votado
        if (votosSi === totalJugadores) {
          await iniciarNuevaPartida();
        } else {
          mostrarMensajeFinRevancha(`No todos quieren la revancha. Votos: ${votosSi} Sí, ${votosNo} No`);
        }
      } else if (votosNo > 0 && (votosNo + votosSi >= totalJugadores)) {
        // Si alguien vota que no y es suficiente para decidir
        mostrarMensajeFinRevancha(`La revancha ha sido rechazada. Votos: ${votosSi} Sí, ${votosNo} No`);
      }
    }
  });
}

function actualizarDisplayVotos(votosSi, votosNo, totalVotos, totalJugadores, modoJuego) {
  const modal = document.getElementById("modal-revancha");
  const modalContent = modal?.querySelector(".modal-revancha-content");
  if (!modal || !modalContent) return;
  
  // Actualizar descripción con el conteo de votos
  const descripcion = modalContent.querySelector("p");
  if (descripcion) {
    if (modoJuego === "solo") {
      descripcion.innerHTML = "✅ Tu voto ha sido registrado.";
    } else {
      descripcion.innerHTML = `📊 Votos actuales: ${votosSi} Sí, ${votosNo} No (${totalVotos}/${totalJugadores})`;
    }
  }
}

async function iniciarNuevaPartida() {
  mostrarEstado("🎉 ¡Nueva partida iniciada!", "green");
  
  // Limpiar estado del juego
  juegoTerminado = false;
  inicioPartida = Date.now(); // Nuevo tiempo de inicio
  
  // Generar nueva secuencia
  secuenciaSala = generarSecuencia();
  await set(ref(db, `salas/${salaId}/secuencia`), secuenciaSala);
  
  // Resetear intentos de todos los jugadores
  const jugadoresRef = ref(db, `salas/${salaId}/jugadores`);
  const jugadoresSnap = await get(jugadoresRef);
  const jugadores = jugadoresSnap.val() || {};
  
  for (const jugadorId in jugadores) {
    await update(ref(db, `salas/${salaId}/jugadores/${jugadorId}`), {
      intentosCount: 0,
      intentos: {}
    });
  }
  
  // Limpiar chat de revancha y votos
  await remove(ref(db, `salas/${salaId}/revancha`));
  
  // Establecer estado del juego
  await update(ref(db, `salas/${salaId}`), { 
    estadoJuego: "jugando",
    turno: Object.keys(jugadores)[0] // Primer jugador comienza
  });
  
  // Limpiar interfaz
  const historial = document.getElementById("historial");
  historial.innerHTML = "";
  
  // Remover modal de revancha
  const modalRevancha = document.getElementById("modal-revancha");
  if (modalRevancha) {
    modalRevancha.remove();
  }
  
  // Resetear colores seleccionados
  ordenSeleccion = [];
  document.querySelectorAll(".color-btn.selected").forEach(btn => {
    btn.classList.remove("selected");
    const numero = btn.querySelector(".numero-orden");
    if (numero) numero.remove();
  });
  
  // Actualizar contador superior
  actualizarContadorIntentosSupeior(0);
  
  // Habilitar botón de enviar intento
  document.querySelector("button[onclick='enviarIntento()']").disabled = true; // Se habilitará cuando sea el turno
  
  // Asegurar que se active la escucha del turno
  escucharTurno();
  
  mostrarEstado("🚀 ¡Nueva partida en curso! ¡Buena suerte!");
}

function mostrarMensajeFinRevancha(mensaje) {
  const modal = document.getElementById("modal-revancha");
  if (!modal) return;
  
  const modalContent = modal.querySelector(".modal-revancha-content");
  if (!modalContent) return;
  
  // Cambiar estilo a mensaje final
  modalContent.className = "modal-revancha-content modal-revancha-votacion";
  modalContent.style.background = "linear-gradient(135deg, #6c757d 0%, #495057 100%)";
  
  // Limpiar contenido y crear mensaje final
  modalContent.innerHTML = "";
  
  // Botón de cerrar
  const btnCerrar = document.createElement("button");
  btnCerrar.className = "modal-revancha-close";
  btnCerrar.innerHTML = "×";
  btnCerrar.onclick = () => {
    modal.classList.remove("active");
    setTimeout(() => modal.remove(), 300);
  };
  
  // Icono
  const icono = document.createElement("div");
  icono.style.cssText = `
    font-size: 48px;
    margin-bottom: 20px;
  `;
  icono.textContent = "🏁";
  
  // Título
  const titulo = document.createElement("h2");
  titulo.innerHTML = "Votación finalizada";
  titulo.style.color = "white";
  
  // Mensaje
  const texto = document.createElement("p");
  texto.innerHTML = mensaje;
  texto.style.cssText = `
    color: rgba(255, 255, 255, 0.9);
    font-size: 16px;
    line-height: 1.5;
    margin: 0 0 30px 0;
  `;
  
  // Botón de cerrar modal
  const botonCerrar = document.createElement("button");
  botonCerrar.className = "btn-modal-revancha btn-modal-no";
  botonCerrar.innerHTML = "✅ Entendido";
  botonCerrar.onclick = () => {
    modal.classList.remove("active");
    setTimeout(() => modal.remove(), 300);
  };
  
  // Ensamblar
  modalContent.appendChild(btnCerrar);
  modalContent.appendChild(icono);
  modalContent.appendChild(titulo);
  modalContent.appendChild(texto);
  modalContent.appendChild(botonCerrar);
  
  // Auto-cerrar después de 5 segundos
  setTimeout(() => {
    if (modal && modal.classList.contains("active")) {
      modal.classList.remove("active");
      setTimeout(() => modal.remove(), 300);
    }
  }, 5000);
}

// ---------------------- EXPORTS ------------------------

window.crearSala = crearSala;
window.unirseSala = unirseSala;
window.unirseDesdeLista = unirseDesdeLista;
window.enviarIntento = enviarIntento;
window.salirDeSala = salirDeSala;
window.enviarMensaje = enviarMensaje;
window.mostrarInfoJuego = mostrarInfoJuego;
window.cerrarModalInfo = cerrarModalInfo;
window.votarRevancha = votarRevancha;
window.mostrarRanking = mostrarRanking;
window.cerrarModalRanking = cerrarModalRanking;
window.mostrarTabRanking = mostrarTabRanking;

// ---------------------- MODAL DE INFORMACIÓN ------------------------

function mostrarInfoJuego() {
  const modal = document.getElementById("modalInfo");
  modal.classList.add("active");
  
  // Prevenir scroll del body cuando el modal está abierto
  document.body.style.overflow = "hidden";
}

function cerrarModalInfo() {
  const modal = document.getElementById("modalInfo");
  modal.classList.remove("active");
  
  // Restaurar scroll del body
  document.body.style.overflow = "auto";
}

// ---------------------- SISTEMA DE RANKING ------------------------

async function mostrarRanking() {
  const modal = document.getElementById("modalRanking");
  modal.classList.add("active");
  
  // Prevenir scroll del body cuando el modal está abierto
  document.body.style.overflow = "hidden";
  
  // Cargar ranking global por defecto
  await cargarRankingGlobal();
}

function cerrarModalRanking() {
  const modal = document.getElementById("modalRanking");
  modal.classList.remove("active");
  
  // Restaurar scroll del body
  document.body.style.overflow = "auto";
}

function mostrarBienvenida() {
  mostrarEstado(`¡Bienvenido de vuelta, ${nombreUsuario}!`, "green");
  // Mostrar información del usuario autenticado en la interfaz si es necesario
  const userDisplay = document.getElementById('userDisplay');
  if (userDisplay) {
    userDisplay.style.display = 'block';
    const currentUserName = document.getElementById('currentUserName');
    if (currentUserName) {
      currentUserName.textContent = nombreUsuario;
    }
  }
}

function cerrarSesion() {
  // Limpiar datos del usuario
  userId = null;
  nombreUsuario = null;
  pinUsuario = null;
  
  // Limpiar localStorage
  localStorage.removeItem('usuarioAutenticado');
  
  // Mostrar modal de autenticación
  document.getElementById('authModal').style.display = 'flex';
  const userDisplay = document.getElementById('userDisplay');
  if (userDisplay) {
    userDisplay.style.display = 'none';
  }
  
  // Limpiar formularios
  const elementos = ['loginNombre', 'loginPin', 'registerNombre', 'registerPin', 'registerConfirmPin'];
  elementos.forEach(id => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.value = '';
  });
  
  // Cambiar a pestaña de login
  cambiarPestanaAuth('login');
  
  mostrarEstado("Sesión cerrada correctamente", "blue");
}

function mostrarTabRanking(tab, element) {
  // Cambiar pestañas activas
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.ranking-tab-content').forEach(content => content.classList.remove('active'));
  
  // Si se pasa el elemento, lo activamos; si no, buscamos por el tab
  if (element) {
    element.classList.add('active');
  } else {
    document.querySelector(`[onclick*="${tab}"]`).classList.add('active');
  }
  document.getElementById(`ranking-${tab}`).classList.add('active');
  
  // Cargar contenido según la pestaña
  if (tab === 'global') {
    cargarRankingGlobal();
  } else if (tab === 'personal') {
    cargarEstadisticasPersonales();
  }
}

async function cargarRankingGlobal() {
  const listaContainer = document.getElementById("ranking-lista");
  listaContainer.innerHTML = '<div class="loading">Cargando ranking...</div>';
  
  try {
    // Obtener todos los perfiles de jugadores
    const perfilesSnap = await get(ref(db, 'perfiles'));
    const perfiles = perfilesSnap.val() || {};
    
    // Convertir a array y ordenar por puntuación
    const jugadores = Object.entries(perfiles)
      .map(([id, perfil]) => ({ id, ...perfil }))
      .filter(jugador => jugador.puntuacionTotal > 0)
      .sort((a, b) => b.puntuacionTotal - a.puntuacionTotal)
      .slice(0, 50); // Top 50
    
    if (jugadores.length === 0) {
      listaContainer.innerHTML = '<div class="loading">No hay puntuaciones registradas aún.</div>';
      return;
    }
    
    listaContainer.innerHTML = '';
    
    jugadores.forEach((jugador, index) => {
      const posicion = index + 1;
      const item = document.createElement('div');
      item.className = `ranking-item ${posicion <= 3 ? `top-${posicion}` : ''}`;
      
      // Calcular estadísticas
      const winRate = jugador.partidasJugadas > 0 
        ? Math.round((jugador.partidasGanadas / jugador.partidasJugadas) * 100) 
        : 0;
      
      const promedioIntentos = jugador.partidasGanadas > 0 
        ? Math.round(jugador.puntuacionTotal / jugador.partidasGanadas)
        : 0;
      
      // Obtener emoji de posición
      let posicionEmoji = `${posicion}°`;
      if (posicion === 1) posicionEmoji = '🥇';
      else if (posicion === 2) posicionEmoji = '🥈';
      else if (posicion === 3) posicionEmoji = '🥉';
      
      item.innerHTML = `
        <div class="ranking-info">
          <div class="ranking-position">${posicionEmoji}</div>
          <div class="ranking-player">${jugador.nombre}</div>
        </div>
        <div class="ranking-stats">
          <div class="ranking-score">${jugador.puntuacionTotal.toLocaleString()} pts</div>
          <div class="ranking-details">
            ${jugador.partidasGanadas}W/${jugador.partidasJugadas}J (${winRate}%)
          </div>
        </div>
      `;
      
      // Highlight del jugador actual
      if (jugador.id === userId) {
        item.style.border = '2px solid #28a745';
        item.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
      }
      
      listaContainer.appendChild(item);
    });
    
  } catch (error) {
    console.error('Error cargando ranking:', error);
    listaContainer.innerHTML = '<div class="loading">Error cargando el ranking.</div>';
  }
}

async function cargarEstadisticasPersonales() {
  const statsContainer = document.getElementById("estadisticas-personales");
  const historialContainer = document.getElementById("historial-lista");
  
  statsContainer.innerHTML = '<div class="loading">Cargando estadísticas...</div>';
  historialContainer.innerHTML = '<div class="loading">Cargando historial...</div>';
  
  try {
    // Cargar perfil del jugador
    const perfilSnap = await get(ref(db, `perfiles/${userId}`));
    const perfil = perfilSnap.val() || {
      puntuacionTotal: 0,
      partidasGanadas: 0,
      partidasJugadas: 0,
      partidasPerdidas: 0
    };
    
    // Calcular estadísticas
    const winRate = perfil.partidasJugadas > 0 
      ? Math.round((perfil.partidasGanadas / perfil.partidasJugadas) * 100) 
      : 0;
    
    const promedioIntentos = perfil.partidasGanadas > 0 
      ? Math.round(perfil.puntuacionTotal / perfil.partidasGanadas)
      : 0;
    
    // Mostrar estadísticas
    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${perfil.puntuacionTotal.toLocaleString()}</div>
        <div class="stat-label">Puntuación Total</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">
        <div class="stat-value">${perfil.partidasGanadas || 0}</div>
        <div class="stat-label">Partidas Ganadas</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);">
        <div class="stat-value">${perfil.partidasPerdidas || 0}</div>
        <div class="stat-label">Partidas Perdidas</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%);">
        <div class="stat-value">${perfil.partidasJugadas || 0}</div>
        <div class="stat-label">Total Jugadas</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);">
        <div class="stat-value">${winRate}%</div>
        <div class="stat-label">Tasa de Victoria</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%);">
        <div class="stat-value">${promedioIntentos}</div>
        <div class="stat-label">Promedio por Victoria</div>
      </div>
    `;
    
    // Cargar historial de puntuaciones
    const puntuacionesSnap = await get(ref(db, `puntuaciones/${userId}`));
    const puntuaciones = puntuacionesSnap.val() || {};
    
    const historialArray = Object.values(puntuaciones)
      .sort((a, b) => b.fecha - a.fecha)
      .slice(0, 20); // Últimas 20 partidas
    
    if (historialArray.length === 0) {
      historialContainer.innerHTML = '<div class="loading">No hay historial de puntuaciones.</div>';
      return;
    }
    
    historialContainer.innerHTML = '';
    
    historialArray.forEach(puntuacion => {
      const fecha = new Date(puntuacion.fecha);
      const item = document.createElement('div');
      item.className = 'history-item';
      
      const esVictoria = puntuacion.modo === "victoria" || puntuacion.puntuacion > 0;
      const tipoPartida = esVictoria ? "Victoria" : "Derrota";
      const colorFondo = esVictoria ? "#28a745" : "#dc3545";
      const icono = esVictoria ? "🏆" : "💔";
      
      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="background: ${colorFondo}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px;">
            ${icono}
          </div>
          <div>
            <div class="history-score" style="color: ${colorFondo};">
              ${esVictoria ? `${puntuacion.puntuacion.toLocaleString()} puntos` : tipoPartida}
            </div>
            <div class="history-date">${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}</div>
          </div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #6c757d;">
          ${puntuacion.intentos || puntuacion.detalles?.intentos || 'N/A'} intento${(puntuacion.intentos || puntuacion.detalles?.intentos || 0) !== 1 ? 's' : ''} • 
          ${puntuacion.tiempoSegundos || puntuacion.detalles?.tiempoSegundos || 0}s
        </div>
      `;
      
      historialContainer.appendChild(item);
    });
    
  } catch (error) {
    console.error('Error cargando estadísticas personales:', error);
    statsContainer.innerHTML = '<div class="loading">Error cargando estadísticas.</div>';
    historialContainer.innerHTML = '<div class="loading">Error cargando historial.</div>';
  }
}

window.onload = () => {
  // Inicializar sistema de audio
  inicializarAudio();
  cargarPreferenciaSonidos();
  
  // Si no hay usuario, crear uno temporal para que el juego funcione
  if (!userId || !nombreUsuario) {
    const numeroAleatorio = Math.floor(Math.random() * 1000);
    userId = `user_${Date.now()}_${numeroAleatorio}`;
    nombreUsuario = `Jugador${numeroAleatorio}`;
    pinUsuario = "0000";
    
    // Ocultar modal de auth si existe
    const authModal = document.getElementById('authModal');
    if (authModal) {
      authModal.style.display = 'none';
    }
    
    console.log("Usuario temporal creado:", nombreUsuario);
  }
  
  actualizarListaSalas();
  mostrarBotonSalir(false);
  
  // Mostrar estado con indicador de admin
  const estadoTexto = esUsuarioAdmin() ? 
    `Listo para jugar - Usuario: ${nombreUsuario} 👑 (ADMIN)` : 
    `Listo para jugar - Usuario: ${nombreUsuario}`;
  
  mostrarEstado(estadoTexto, "green");
  
  // Si eres admin, mostrar estadísticas en consola
  if (esUsuarioAdmin()) {
    console.log("🔑 Modo administrador activado para usuario registrado: " + nombreUsuario);
    mostrarEstadisticasAdmin();
  }
};

// Inicialización de la página
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si hay un usuario autenticado en localStorage
  const usuarioGuardado = localStorage.getItem('usuarioAutenticado');
  if (usuarioGuardado) {
    const datosUsuario = JSON.parse(usuarioGuardado);
    userId = datosUsuario.userId;
    nombreUsuario = datosUsuario.nombre;
    pinUsuario = datosUsuario.pin;
    
    // Ocultar modal de autenticación y mostrar interfaz principal
    document.getElementById('authModal').style.display = 'none';
    mostrarBienvenida();
  } else {
    // Mostrar modal de autenticación
    document.getElementById('authModal').style.display = 'flex';
  }
});

// Cerrar modal con tecla Escape
document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {
    cerrarModalInfo();
    cerrarModalRanking();
    cerrarModalAuth();
    cerrarModalCompartir();
  }
});

// Exponer funciones globalmente
window.registrarUsuario = registrarUsuario;
window.iniciarSesion = iniciarSesion;
window.cambiarPestanaAuth = cambiarPestanaAuth;

// Sistema de Invitaciones
function compartirSala() {
  const linkInvitacion = `${window.location.origin}${window.location.pathname}?sala=${salaId}`;
  document.getElementById("linkInvitacion").value = linkInvitacion;
  document.getElementById("modalCompartir").style.display = "flex";
}

function cerrarModalCompartir() {
  document.getElementById("modalCompartir").style.display = "none";
}

async function copiarLink() {
  const linkInput = document.getElementById("linkInvitacion");
  const btnCopiar = document.querySelector(".btn-copiar");
  const textoOriginal = btnCopiar.innerHTML;
  
  try {
    await navigator.clipboard.writeText(linkInput.value);
    btnCopiar.innerHTML = '<span class="copiar-icon">✅</span><span class="copiar-text">¡Copiado!</span>';
    btnCopiar.style.background = "linear-gradient(135deg, #28a745 0%, #20c997 100%)";
    
    setTimeout(() => {
      btnCopiar.innerHTML = textoOriginal;
      btnCopiar.style.background = "linear-gradient(135deg, #17a2b8 0%, #138496 100%)";
    }, 2000);
  } catch (error) {
    // Fallback para navegadores que no soportan clipboard API
    linkInput.select();
    document.execCommand('copy');
    btnCopiar.innerHTML = '<span class="copiar-icon">✅</span><span class="copiar-text">¡Copiado!</span>';
    btnCopiar.style.background = "linear-gradient(135deg, #28a745 0%, #20c997 100%)";
    
    setTimeout(() => {
      btnCopiar.innerHTML = textoOriginal;
      btnCopiar.style.background = "linear-gradient(135deg, #17a2b8 0%, #138496 100%)";
    }, 2000);
  }
}

function compartirWhatsApp() {
  const link = document.getElementById("linkInvitacion").value;
  const mensaje = `¡Hola! Te invito a jugar Adivina Colores Online conmigo. Únete a mi sala: ${link}`;
  const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  window.open(urlWhatsApp, '_blank');
}

function compartirFacebook() {
  const link = document.getElementById("linkInvitacion").value;
  const urlFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
  window.open(urlFacebook, '_blank');
}

function compartirTelegram() {
  const link = document.getElementById("linkInvitacion").value;
  const mensaje = `¡Hola! Te invito a jugar Adivina Colores Online conmigo. Únete a mi sala: ${link}`;
  const urlTelegram = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(mensaje)}`;
  window.open(urlTelegram, '_blank');
}

// Detectar código de sala en URL al cargar
function verificarInvitacionEnURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const codigoSala = urlParams.get('sala');
  
  if (codigoSala) {
    // Guardar código de sala para usarlo después del login/registro
    localStorage.setItem('salaInvitacion', codigoSala);
    
    // Si ya está autenticado, unirse directamente
    if (userId) {
      unirseSalaDirecta(codigoSala);
    }
    // Si no está autenticado, se manejará después del login
  }
}

async function unirseSalaDirecta(codigo) {
  try {
    // Verificar que la sala existe
    const salaSnapshot = await get(ref(db, `salas/${codigo}`));
    if (!salaSnapshot.exists()) {
      mostrarEstado("La sala no existe o ha expirado", "red");
      return;
    }
    
    const salaInfo = salaSnapshot.val();
    const jugadoresList = salaInfo.jugadores || {};
    const totalJugadores = Object.keys(jugadoresList).length;
    const maximoJugadores = salaInfo.modoJuego === "solo" ? 1 : 2;
    
    if (totalJugadores >= maximoJugadores) {
      mostrarEstado("La sala está llena", "red");
      return;
    }
    
    if (jugadoresList[userId]) {
      mostrarEstado("Ya estás en esta sala", "orange");
      return;
    }
    
    // Unirse a la sala
    salaId = codigo;
    const jugadorNombre = document.getElementById("currentUserName").textContent;
    
    await set(ref(db, `salas/${salaId}/jugadores/${userId}`), {
      nombre: jugadorNombre,
      intentos: {},
      intentosCount: 0
    });
    
    // Verificar y activar el estado del juego si es necesario
    const salaActualizada = await get(ref(db, `salas/${salaId}`));
    const datosActualizados = salaActualizada.val();
    const jugadoresActualizados = datosActualizados.jugadores || {};
    const conteoJugadores = Object.keys(jugadoresActualizados).length;
    const limiteJugadores = datosActualizados.maxJugadores || (datosActualizados.modoJuego === "solo" ? 1 : 2);
    const estadoActual = datosActualizados.estadoJuego;
    
    // Si tenemos suficientes jugadores y el juego está esperando, activarlo
    if (conteoJugadores >= limiteJugadores && estadoActual === "esperando") {
      await update(ref(db, `salas/${salaId}`), { estadoJuego: "jugando" });
      
      // Establecer el primer jugador como turno inicial si no hay turno
      if (!datosActualizados.turno) {
        const primerJugadorId = Object.keys(jugadoresActualizados)[0];
        await update(ref(db, `salas/${salaId}`), { turno: primerJugadorId });
      }
    }
    
    // Limpiar URL
    window.history.replaceState({}, document.title, window.location.pathname);
    localStorage.removeItem('salaInvitacion');
    
    // Iniciar juego y asegurar que los listeners estén activos
    iniciarJuego(jugadorNombre);
    mostrarBotonSalir(true); // Asegurar que el botón salir esté visible
    ocultarFormularios(); // Ocultar formularios de unión
    mostrarEstado(`Te uniste a la sala ${salaId}`, "green");
    
    // Dar tiempo para que Firebase se sincronice y los listeners se activen
    setTimeout(async () => {
      // Verificar el estado del juego después de unirse
      const salaSnapFinal = await get(ref(db, `salas/${salaId}`));
      const salaDataFinal = salaSnapFinal.val();
      
      // Forzar actualización del estado de juego para ambos jugadores
      if (salaDataFinal.estadoJuego === "jugando") {
        const modoJuego = salaDataFinal.modoJuego || "dos";
        
        // Asegurar que el temporizador y controles estén configurados correctamente
        if (modoJuego === "dos") {
          document.getElementById("compartirSalaBtn").style.display = "inline-flex";
          document.querySelector(".timer-display").style.display = "block";
          document.getElementById("chat-container").style.display = "flex";
        }
        
        // Si es el turno del jugador, habilitar controles
        if (salaDataFinal.turno === userId) {
          document.querySelector("button[onclick='enviarIntento()']").disabled = false;
          if (modoJuego === "dos") {
            mostrarEstado("Es tu turno. Tenés 20 segundos.");
            iniciarTemporizadorTurno(modoJuego);
          } else {
            mostrarEstado("Es tu turno. Sin límite de tiempo.");
          }
        } else {
          document.querySelector("button[onclick='enviarIntento()']").disabled = true;
          mostrarEstado("Esperando tu turno...");
        }
      }
    }, 1500);
    
  } catch (error) {
    console.error("Error al unirse a la sala:", error);
    mostrarEstado("Error al unirse a la sala", "red");
  }
}

// Modificar la función de inicialización para verificar invitaciones
window.addEventListener('load', () => {
  verificarInvitacionEnURL();
});

// Exponer funciones de compartir globalmente
window.compartirSala = compartirSala;
window.cerrarModalCompartir = cerrarModalCompartir;
window.copiarLink = copiarLink;
window.compartirWhatsApp = compartirWhatsApp;
window.compartirFacebook = compartirFacebook;
window.compartirTelegram = compartirTelegram;
window.cerrarSesion = cerrarSesion;

// ====== SISTEMA DE ADMINISTRACIÓN ======

// Función para verificar si el usuario actual es admin
function esUsuarioAdmin() {
  if (!nombreUsuario || !userId) return false;
  
  // Solo el usuario registrado "beto" puede ser admin
  // No usuarios temporales ni otros
  const nombreLimpio = nombreUsuario.toLowerCase().trim();
  return nombreLimpio === 'beto' && userId.startsWith('user_') && !nombreUsuario.startsWith('Jugador');
}

// Función para eliminar una sala (solo admin)
async function eliminarSala(salaIdAEliminar) {
  if (!esUsuarioAdmin()) {
    alert("No tienes permisos para eliminar salas");
    return;
  }
  
  if (!confirm(`¿Estás seguro de eliminar la sala ${salaIdAEliminar}?`)) {
    return;
  }
  
  try {
    const salaRef = ref(db, `salas/${salaIdAEliminar}`);
    await remove(salaRef);
    
    console.log(`Sala ${salaIdAEliminar} eliminada por admin`);
    alert(`Sala ${salaIdAEliminar} eliminada exitosamente`);
    
    // Actualizar la lista de salas
    actualizarListaSalas();
    
  } catch (error) {
    console.error("Error al eliminar sala:", error);
    alert("Error al eliminar la sala: " + error.message);
  }
}

// Función para mostrar estadísticas de admin
async function mostrarEstadisticasAdmin() {
  if (!esUsuarioAdmin()) {
    console.log("No eres admin");
    return;
  }
  
  try {
    const salasRef = ref(db, 'salas');
    const snapshot = await get(salasRef);
    
    if (snapshot.exists()) {
      const salas = snapshot.val();
      const totalSalas = Object.keys(salas).length;
      let salasActivas = 0;
      let jugadoresTotal = 0;
      
      Object.values(salas).forEach(sala => {
        if (sala.estadoJuego === 'esperando' || sala.estadoJuego === 'jugando') {
          salasActivas++;
        }
        if (sala.jugadores) {
          jugadoresTotal += Object.keys(sala.jugadores).length;
        }
      });
      
      console.log(`📊 ESTADÍSTICAS ADMIN:
      • Total de salas: ${totalSalas}
      • Salas activas: ${salasActivas}
      • Jugadores conectados: ${jugadoresTotal}`);
      
    } else {
      console.log("No hay salas en la base de datos");
    }
    
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
  }
}

// Exponer funciones de admin globalmente
window.eliminarSala = eliminarSala;
window.mostrarEstadisticasAdmin = mostrarEstadisticasAdmin;

// ---------------------- MEJORAS MULTIJUGADOR ------------------------

// Función para actualizar el indicador de turno
function actualizarIndicadorTurno() {
  const indicador = document.getElementById('indicador-turno');
  if (!indicador) return;

  // Obtener información del jugador actual
  const jugadorActual = jugadoresEnSala[jugadorTurno];
  if (!jugadorActual) {
    indicador.style.display = 'none';
    return;
  }

  // Mostrar indicador solo en modo multijugador
  const salaRef = ref(db, `salas/${salaId}`);
  get(salaRef).then(snap => {
    const salaData = snap.val();
    const modoJuego = salaData?.modoJuego || "dos";
    
    if (modoJuego === "solo") {
      indicador.style.display = 'none';
      return;
    }

    indicador.style.display = 'flex';
    
    if (jugadorTurno === userId) {
      indicador.innerHTML = `
        <span class="turno-icono">🎯</span>
        <span class="turno-texto">¡Tu turno!</span>
      `;
      indicador.className = 'indicador-turno mi-turno';
    } else {
      indicador.innerHTML = `
        <span class="turno-icono">⏳</span>
        <span class="turno-texto">Turno de ${jugadorActual.nombre}</span>
      `;
      indicador.className = 'indicador-turno turno-otro';
    }
  });
}

// Función para manejar el resultado del juego en multijugador
async function manejarResultadoJuego(tipoResultado, ganadorId = null) {
  try {
    const salaRef = ref(db, `salas/${salaId}`);
    const salaSnap = await get(salaRef);
    const salaData = salaSnap.val();
    
    if (!salaData) return;
    
    const modoJuego = salaData.modoJuego || "dos";
    const jugadores = salaData.jugadores || {};
    
    // En modo solo, manejar normalmente
    if (modoJuego === "solo") {
      if (tipoResultado === "victoria") {
        reproducirSonido('victoria'); // Sonido de victoria en modo solo
        mostrarMensajeVictoria();
      } else {
        reproducirSonido('derrota'); // Sonido de derrota en modo solo
        mostrarCombinacionCorrecta();
      }
      return;
    }
    
    // En modo multijugador, notificar a todos los jugadores
    const resultadoData = {
      tipo: tipoResultado,
      ganador: ganadorId,
      timestamp: Date.now(),
      secuenciaCorrecta: secuenciaSala || salaData.secuencia
    };
    
    // Guardar el resultado en Firebase para que todos los jugadores lo vean
    await set(ref(db, `salas/${salaId}/resultado`), resultadoData);
    
  } catch (error) {
    console.error("Error al manejar resultado del juego:", error);
  }
}

// Función para escuchar resultados del juego en multijugador
function escucharResultadosJuego() {
  onValue(ref(db, `salas/${salaId}/resultado`), (snap) => {
    const resultado = snap.val();
    if (!resultado) return;
    
    const tipoResultado = resultado.tipo;
    const ganadorId = resultado.ganador;
    const secuenciaCorrecta = resultado.secuenciaCorrecta;
    
    // Actualizar secuencia local si es necesario
    if (secuenciaCorrecta && !secuenciaSala) {
      secuenciaSala = secuenciaCorrecta;
    }
    
    // Determinar si este jugador ganó o perdió
    if (tipoResultado === "victoria") {
      if (ganadorId === userId) {
        // Este jugador ganó
        juegoTerminado = true;
        mostrarMensajeVictoria();
      } else {
        // Este jugador perdió (el otro ganó)
        juegoTerminado = true;
        mostrarMensajeDerrota(`${jugadoresEnSala[ganadorId]?.nombre || 'El otro jugador'} ganó la partida`);
      }
    } else if (tipoResultado === "derrota_tiempo" || tipoResultado === "derrota_intentos") {
      // Ambos jugadores perdieron
      juegoTerminado = true;
      mostrarCombinacionCorrecta();
    }
    
    // Limpiar el timer
    clearInterval(timerInterval);
    
    // Mostrar modal de revancha después de un delay
    setTimeout(() => {
      mostrarModalRevancha();
    }, 3000);
  });
}

// Función para mostrar mensaje de derrota personalizado
function mostrarMensajeDerrota(mensajePersonalizado = null) {
  const historial = document.getElementById("historial");
  
  // Crear mensaje de derrota
  const mensajeDiv = document.createElement("div");
  mensajeDiv.className = "mensaje-derrota";
  
  const icono = document.createElement("div");
  icono.className = "icono-derrota";
  icono.innerHTML = "😔";
  
  const texto = document.createElement("div");
  texto.className = "texto-derrota";
  texto.innerHTML = mensajePersonalizado || "¡Mejor suerte la próxima vez!";
  
  mensajeDiv.appendChild(icono);
  mensajeDiv.appendChild(texto);
  
  historial.appendChild(mensajeDiv);
  historial.scrollTop = historial.scrollHeight;
  
  // Reproducir sonido de derrota
  reproducirSonidoDerrota();
}

// Función para mostrar modal de revancha mejorado
async function mostrarModalRevancha() {
  // Verificar si el juego está terminado
  if (!juegoTerminado) return;
  
  // Obtener información de la sala
  const salaSnap = await get(ref(db, `salas/${salaId}`));
  const salaData = salaSnap.val();
  const modoJuego = salaData?.modoJuego || "dos";
  
  // En modo multijugador, asegurar que el modal aparezca para ambos jugadores
  if (modoJuego !== "solo") {
    // Escuchar votos de revancha
    escucharVotosRevancha();
  }
  
  // Mostrar el modal de revancha
  await mostrarBotonRevancha();
}

// Función para verificar si el juego debe terminar en multijugador
async function verificarFinJuegoMultijugador() {
  try {
    const salaRef = ref(db, `salas/${salaId}`);
    const salaSnap = await get(salaRef);
    const salaData = salaSnap.val();
    
    if (!salaData || !salaData.jugadores) return;
    
    const jugadores = Object.keys(salaData.jugadores);
    let todosTerminaron = true;
    let jugadoresConIntentos = [];
    
    console.log("=== VERIFICANDO FIN DE JUEGO MULTIJUGADOR ===");
    
    // Verificar el estado de todos los jugadores
    for (const jugadorId of jugadores) {
      const jugadorData = salaData.jugadores[jugadorId];
      const intentosCount = jugadorData.intentosCount || 0;
      console.log(`Jugador ${jugadorId}: ${intentosCount}/10 intentos`);
      
      if (intentosCount < 10) {
        todosTerminaron = false;
        jugadoresConIntentos.push(jugadorId);
      }
    }
    
    console.log(`Todos terminaron: ${todosTerminaron}`);
    console.log(`Jugadores con intentos restantes:`, jugadoresConIntentos);
    
    if (todosTerminaron) {
      // Todos los jugadores agotaron sus intentos, terminar el juego
      console.log("Terminando juego - todos agotaron intentos");
      await update(salaRef, { estadoJuego: "terminado" });
      juegoTerminado = true;
      await manejarResultadoJuego("derrota_intentos");
      clearInterval(timerInterval);
    } else {
      // Aún hay jugadores con intentos disponibles
      const miData = salaData.jugadores[userId];
      const misIntentos = miData?.intentosCount || 0;
      
      console.log(`Mis intentos: ${misIntentos}/10`);
      
      if (misIntentos >= 10) {
        // Este jugador agotó sus intentos
        console.log("He agotado mis intentos, buscando siguiente jugador");
        mostrarEstado("Has agotado tus intentos. Esperando a que termine el otro jugador...", "orange");
        document.querySelector("button[onclick='enviarIntento()']").disabled = true;
        clearInterval(timerInterval);
        
        // Encontrar el siguiente jugador que puede continuar
        const siguienteJugador = jugadoresConIntentos.find(id => id !== userId);
        
        if (siguienteJugador) {
          console.log(`Cambiando turno inmediatamente a: ${siguienteJugador}`);
          await update(ref(db, `salas/${salaId}`), { turno: siguienteJugador });
        } else {
          console.log("No hay siguiente jugador disponible");
        }
      }
    }
    
  } catch (error) {
    console.error("Error al verificar fin del juego:", error);
  }
}
