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
let userId = "user_" + Math.random().toString(36).slice(2, 10);
let secuenciaSala = [];
let jugadorTurno = null;
let timerInterval = null;
let tiempoRestante = 15;
let jugadoresEnSala = {}; // Variable local para almacenar la información de los jugadores
let ordenSeleccion = []; // Array para mantener el orden de selección de colores
let juegoTerminado = false; // Flag para controlar el estado del juego
let inicioPartida = null; // Timestamp de inicio de la partida para calcular tiempo
let puntuacionJugador = 0; // Puntuación actual del jugador

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
  const nombre = document.getElementById("nombreCrear").value.trim();
  if (!nombre) return mostrarEstado("Ingresá tu nombre", "red");

  // Obtener el modo de juego seleccionado
  const modoJuego = document.querySelector('input[name="modoJuego"]:checked').value;
  const maxJugadores = modoJuego === "solo" ? 1 : 2;

  salaId = generarCodigoSala();
  secuenciaSala = generarSecuencia();

  await set(ref(db, "salas/" + salaId), {
    secuencia: secuenciaSala,
    jugadores: {
      [userId]: { nombre, intentosCount: 0, intentos: {} }
    },
    turno: userId,
    estadoJuego: modoJuego === "solo" ? "jugando" : "esperando",
    maxJugadores: maxJugadores,
    modoJuego: modoJuego
  });

  mostrarEstado("Sala creada: " + salaId, "green");
  await iniciarJuego(nombre);
  ocultarFormularios();
  mostrarBotonSalir(true);
  actualizarListaSalas();
}

async function unirseSala() {
  const nombre = document.getElementById("nombreUnir").value.trim();
  const codigo = document.getElementById("codigoUnir").value.trim().toUpperCase();

  if (!nombre || !codigo) return mostrarEstado("Completá todos los campos", "red");

  salaId = codigo;
  const salaSnap = await get(ref(db, "salas/" + salaId));
  if (!salaSnap.exists()) return mostrarEstado("Sala no existe", "red");

  const salaData = salaSnap.val();
  const jugadores = salaData.jugadores || {};
  const maxJugadores = salaData.maxJugadores || 2;
  const modoJuego = salaData.modoJuego || "dos";

  if (modoJuego === "solo") return mostrarEstado("Esta sala es solo para un jugador", "red");
  if (Object.keys(jugadores).length >= maxJugadores) return mostrarEstado("Sala llena", "red");

  await set(ref(db, `salas/${salaId}/jugadores/${userId}`), { nombre, intentosCount: 0, intentos: {} });

  mostrarEstado("Unido a sala " + salaId);
  await iniciarJuego(nombre);
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
  
  mostrarColores();
  escucharEstadoJuego();
  escucharTurno();
  escucharTodosLosIntentos();
  mostrarJugadoresEnSala();
  escucharChat();
  escucharJugadoresYActivarJuego(); 
  escucharSecuencia(); // Añadir listener para la secuencia

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
}

function escucharJugadoresYActivarJuego() {
  onValue(ref(db, `salas/${salaId}/jugadores`), async snap => {
    const jugadores = snap.val() || {};
    jugadoresEnSala = jugadores; // Almacenamos la lista de jugadores localmente
    const jugadoresCount = Object.keys(jugadores).length;
    const estadoJuegoRef = ref(db, `salas/${salaId}/estadoJuego`);
    
    const estadoSnap = await get(estadoJuegoRef);
    const estadoActual = estadoSnap.val();

    // Obtener información de la sala para verificar maxJugadores
    const salaSnap = await get(ref(db, `salas/${salaId}`));
    const salaData = salaSnap.val();
    const maxJugadores = salaData.maxJugadores || 2;

    if (jugadoresCount === maxJugadores && estadoActual === "esperando") {
      await update(ref(db, `salas/${salaId}`), { estadoJuego: "jugando" });
      const primerJugadorId = Object.keys(jugadores)[0];
      await update(ref(db, `salas/${salaId}`), { turno: primerJugadorId });
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
    const modoJuego = salaData?.modoJuego || "dos";
    const maxJugadores = salaData?.maxJugadores || 2;
    
    if (estado === "jugando") {
      mostrarEstado(modoJuego === "solo" ? "¡Comenzá a jugar!" : "¡El juego comenzó!");
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
    if (!sala || sala.estadoJuego !== "jugando") return;

    if (jugadorTurno === userId) {
      mostrarEstado("Es tu turno. Tenés 15 segundos.");
      document.querySelector("button[onclick='enviarIntento()']").disabled = false;
      iniciarTemporizadorTurno();
    } else {
      const nombreOtroJugador = jugadoresEnSala[jugadorTurno]?.nombre || "otro jugador";
      mostrarEstado(`Es el turno de ${nombreOtroJugador}`, "orange");
      clearInterval(timerInterval);
      document.getElementById("tiempoRestante").textContent = "-";
      document.querySelector("button[onclick='enviarIntento()']").disabled = true;
    }
  });
}

function iniciarTemporizadorTurno() {
  tiempoRestante = 15;
  document.getElementById("tiempoRestante").textContent = tiempoRestante;
  clearInterval(timerInterval);
  timerInterval = setInterval(async () => {
    tiempoRestante--;
    document.getElementById("tiempoRestante").textContent = tiempoRestante;
    if (tiempoRestante <= 0) {
      clearInterval(timerInterval);
      mostrarEstado("Se acabó el tiempo", "red");
      
      // Verificar si es modo solo
      const salaSnap = await get(ref(db, `salas/${salaId}`));
      const salaData = salaSnap.val();
      const modoJuego = salaData?.modoJuego || "dos";
      
      if (modoJuego === "solo") {
        // En modo solo, contar como intento perdido
        await contarIntentoTiempoAgotado();
      } else {
        // En modo multijugador, pasar turno
        pasarTurno();
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
    await update(ref(db, `salas/${salaId}`), { estadoJuego: "terminado" });
    juegoTerminado = true;
    mostrarCombinacionCorrecta();
    return;
  }

  // Reiniciar el temporizador para el siguiente intento
  mostrarEstado("¡Intentá de nuevo! Seleccioná más rápido.");
  document.querySelector("button[onclick='enviarIntento()']").disabled = false;
  iniciarTemporizadorTurno();
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
    await update(ref(db, `salas/${salaId}`), { estadoJuego: "terminado" });
    juegoTerminado = true;
    mostrarMensajeVictoria();
    clearInterval(timerInterval);
    return;
  }

  // Verificar si alcanzó el máximo de intentos
  if (nuevosIntentos >= 10) {
    await update(ref(db, `salas/${salaId}`), { estadoJuego: "terminado" });
    juegoTerminado = true;
    mostrarCombinacionCorrecta();
    clearInterval(timerInterval);
    return;
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
    iniciarTemporizadorTurno();
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
    salaId: salaId
  });
  
  // Actualizar puntuación total del jugador
  const perfilRef = ref(db, `perfiles/${userId}`);
  const perfilSnap = await get(perfilRef);
  const perfilActual = perfilSnap.val() || { 
    nombre: jugadorNombre, 
    puntuacionTotal: 0, 
    partidasGanadas: 0,
    partidasJugadas: 0
  };
  
  await update(perfilRef, {
    nombre: jugadorNombre,
    puntuacionTotal: (perfilActual.puntuacionTotal || 0) + puntuacionData.total,
    partidasGanadas: (perfilActual.partidasGanadas || 0) + 1,
    partidasJugadas: (perfilActual.partidasJugadas || 0) + 1,
    ultimaPartida: timestamp
  });
  
  puntuacionJugador = (perfilActual.puntuacionTotal || 0) + puntuacionData.total;
}

async function actualizarPartidasJugadas() {
  const jugadorNombre = document.getElementById("jugadorNombre").textContent;
  const timestamp = Date.now();
  
  // Solo actualizar partidasJugadas si perdió (no ganó)
  const perfilRef = ref(db, `perfiles/${userId}`);
  const perfilSnap = await get(perfilRef);
  const perfilActual = perfilSnap.val() || { 
    nombre: jugadorNombre, 
    puntuacionTotal: 0, 
    partidasGanadas: 0,
    partidasJugadas: 0
  };
  
  await update(perfilRef, {
    nombre: jugadorNombre,
    puntuacionTotal: perfilActual.puntuacionTotal || 0,
    partidasGanadas: perfilActual.partidasGanadas || 0,
    partidasJugadas: (perfilActual.partidasJugadas || 0) + 1,
    ultimaPartida: timestamp
  });
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

      // Mostrar intentos del jugador
      Object.values(intentos).forEach(intentoData => {
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
        div.innerHTML = `Sala <b>${codigo}</b> (${jugadoresCount}/${maxJugadores}) 
          <button onclick="unirseDesdeLista('${codigo}')">Unirse</button>`;
        contenedor.appendChild(div);
      }
    }

    if (!haySalasDisponibles) {
      contenedor.innerHTML = "<i>No hay salas disponibles</i>";
    }
  });
}

async function unirseDesdeLista(codigo) {
  const nombre = document.getElementById("nombreLista").value.trim();
  if (!nombre) return alert("Ingresá tu nombre");
  
  salaId = codigo;
  const salaSnap = await get(ref(db, "salas/" + salaId));
  if (!salaSnap.exists()) return mostrarEstado("Sala no existe", "red");

  const salaData = salaSnap.val();
  const modoJuego = salaData.modoJuego || "dos";
  
  if (modoJuego === "solo") return mostrarEstado("Esta sala es solo para un jugador", "red");

  await set(ref(db, `salas/${salaId}/jugadores/${userId}`), {
    nombre,
    intentosCount: 0,
    intentos: {}
  });

  mostrarEstado("Unido a sala " + salaId);
  await iniciarJuego(nombre);
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
  onValue(ref(db, `salas/${salaId}/chat`), snap => {
    const data = snap.val() || {};
    contenedor.innerHTML = "";
    Object.values(data)
      .sort((a, b) => a.timestamp - b.timestamp)
      .forEach(m => {
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
      partidasJugadas: 0
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
        <div class="stat-value">${perfil.partidasGanadas}</div>
        <div class="stat-label">Partidas Ganadas</div>
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
      
      item.innerHTML = `
        <div>
          <div class="history-score">${puntuacion.puntuacion.toLocaleString()} puntos</div>
          <div class="history-date">${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}</div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #6c757d;">
          ${puntuacion.detalles.intentos} intento${puntuacion.detalles.intentos !== 1 ? 's' : ''} • 
          ${puntuacion.detalles.tiempoSegundos}s
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
  actualizarListaSalas();
  mostrarBotonSalir(false);
  mostrarEstado("Listo para jugar", "green");
};

// Cerrar modal con tecla Escape
document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {
    cerrarModalInfo();
    cerrarModalRanking();
  }
});
