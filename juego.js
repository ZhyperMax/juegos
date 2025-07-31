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
  return Array.from({ length: longitud }, () => colores[Math.floor(Math.random() * colores.length)]);
}

function ocultarFormularios() {
  document.getElementById("formulario").style.display = "none";
  document.getElementById("listaSalas").style.display = "none";
}

function mostrarBotonSalir(show = false) {
  document.getElementById("salirBtn").style.display = show ? "block" : "none";
}

// ---------------------- CREAR / UNIR SALA ------------------------

async function crearSala() {
  const nombre = document.getElementById("nombreCrear").value.trim();
  if (!nombre) return mostrarEstado("Ingresá tu nombre", "red");

  salaId = generarCodigoSala();
  secuenciaSala = generarSecuencia();

  await set(ref(db, "salas/" + salaId), {
    secuencia: secuenciaSala,
    jugadores: {
      [userId]: { nombre, intentosCount: 0, intentos: {} }
    },
    turno: userId,
    estadoJuego: "esperando"
  });

  mostrarEstado("Sala creada: " + salaId, "green");
  iniciarJuego(nombre);
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

  const jugadores = salaSnap.val().jugadores || {};
  if (Object.keys(jugadores).length >= 2) return mostrarEstado("Sala llena", "red");

  await set(ref(db, `salas/${salaId}/jugadores/${userId}`), { nombre, intentosCount: 0, intentos: {} });

  mostrarEstado("Unido a sala " + salaId);
  iniciarJuego(nombre);
  ocultarFormularios();
  mostrarBotonSalir(true);
  actualizarListaSalas();
}

// ---------------------- JUEGO ------------------------

function iniciarJuego(nombreJugador) {
  document.getElementById("formulario").style.display = "none";
  document.getElementById("juego").style.display = "block";
  document.getElementById("jugadorNombre").textContent = nombreJugador;
  document.getElementById("codigoSala").textContent = salaId;

  mostrarColores();
  escucharEstadoJuego();
  escucharTurno();
  escucharTodosLosIntentos();
  mostrarJugadoresEnSala();
  escucharChat();
  escucharJugadoresYActivarJuego(); // Nueva función centralizada para verificar jugadores

  get(ref(db, `salas/${salaId}/secuencia`)).then(snap => {
    if (snap.exists()) secuenciaSala = snap.val();
  });

  onDisconnect(ref(db, `salas/${salaId}/jugadores/${userId}`)).remove();
  document.querySelector("button[onclick='enviarIntento()']").disabled = true;
}

function escucharJugadoresYActivarJuego() {
  onValue(ref(db, `salas/${salaId}/jugadores`), async snap => {
    const jugadores = snap.val() || {};
    const jugadoresCount = Object.keys(jugadores).length;
    const estadoJuegoRef = ref(db, `salas/${salaId}/estadoJuego`);
    
    // Obtener el estado actual del juego
    const estadoSnap = await get(estadoJuegoRef);
    const estadoActual = estadoSnap.val();

    // Si hay dos jugadores y el juego no ha iniciado, lo inicia.
    if (jugadoresCount === 2 && estadoActual === "esperando") {
      await update(ref(db, `salas/${salaId}`), { estadoJuego: "jugando" });
      const primerJugadorId = Object.keys(jugadores)[0];
      await update(ref(db, `salas/${salaId}`), { turno: primerJugadorId });
    }
  });
}


function escucharEstadoJuego() {
  onValue(ref(db, `salas/${salaId}/estadoJuego`), snap => {
    const estado = snap.val();
    if (estado === "jugando") {
      mostrarEstado("¡El juego comenzó!");
    } else if (estado === "terminado") {
      mostrarEstado("Juego terminado", "blue");
      clearInterval(timerInterval);
    } else {
      mostrarEstado("Esperando a otro jugador...", "orange");
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
      mostrarEstado("Esperá tu turno", "orange");
      clearInterval(timerInterval);
      document.getElementById("tiempoRestante").textContent = "-";
    }
  });
}

function iniciarTemporizadorTurno() {
  tiempoRestante = 15;
  document.getElementById("tiempoRestante").textContent = tiempoRestante;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    tiempoRestante--;
    document.getElementById("tiempoRestante").textContent = tiempoRestante;
    if (tiempoRestante <= 0) {
      clearInterval(timerInterval);
      mostrarEstado("Se acabó el tiempo", "red");
      pasarTurno();
    }
  }, 1000);
}

async function enviarIntento() {
  const seleccionados = Array.from(document.querySelectorAll(".color-btn.selected"))
    .map(b => b.style.backgroundColor);
  if (seleccionados.length !== 4) return mostrarEstado("Elegí 4 colores", "red");
  if (jugadorTurno !== userId) return mostrarEstado("No es tu turno", "red");

  const jugadorRef = ref(db, `salas/${salaId}/jugadores/${userId}`);
  const snap = await get(jugadorRef);
  if (!snap.exists()) return mostrarEstado("Jugador no encontrado", "red");

  const data = snap.val();
  if (data.intentosCount >= 10) return mostrarEstado("Máximo 10 intentos", "red");

  const resultado = compararIntento(seleccionados, secuenciaSala);
  await push(ref(db, `salas/${salaId}/jugadores/${userId}/intentos`), {
    intento: seleccionados,
    aciertosColorPos: resultado.aciertosColorPos,
    aciertosColor: resultado.aciertosColor
  });

  await update(jugadorRef, { intentosCount: data.intentosCount + 1 });

  if (resultado.aciertosColorPos === 4) {
    await update(ref(db, `salas/${salaId}`), { estadoJuego: "terminado" });
    mostrarEstado("¡Ganaste!");
    return;
  }

  clearInterval(timerInterval);
  pasarTurno();
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
  const usada = Array(4).fill(false);

  for (let i = 0; i < 4; i++) {
    if (intento[i] === secuencia[i]) {
      aciertosColorPos++;
      usada[i] = true;
    }
  }

  for (let i = 0; i < 4; i++) {
    if (intento[i] !== secuencia[i]) {
      for (let j = 0; j < 4; j++) {
        if (!usada[j] && intento[i] === secuencia[j]) {
          aciertosColor++;
          usada[j] = true;
          break;
        }
      }
    }
  }

  return { aciertosColorPos, aciertosColor };
}

function escucharTodosLosIntentos() {
  onValue(ref(db, `salas/${salaId}/jugadores`), snap => {
    const data = snap.val();
    const historial = document.getElementById("historial");
    historial.innerHTML = "";

    for (let jugadorId in data) {
      const jugador = data[jugadorId];
      const nombre = jugador.nombre;
      const intentos = jugador.intentos || {};
      const intentosCount = jugador.intentosCount || 0;

      const titulo = document.createElement("p");
      titulo.textContent = `Intentos de ${nombre} (restantes: ${10 - intentosCount})`;
      historial.appendChild(titulo);

      Object.values(intentos).forEach(intentoData => {
        const div = document.createElement("div");
        div.className = "intento-container";
        intentoData.intento.forEach(c => {
          const box = document.createElement("div");
          box.className = "color-btn";
          box.style.backgroundColor = c;
          div.appendChild(box);
        });
        const resultados = document.createElement("p");
        resultados.textContent = `Posición: ${intentoData.aciertosColorPos}, Color: ${intentoData.aciertosColor}`;
        div.appendChild(resultados);
        historial.appendChild(div);
      });
    }
  });
}

function mostrarColores() {
  const contenedor = document.getElementById("coloresDisponibles");
  contenedor.innerHTML = "";
  colores.forEach(color => {
    const btn = document.createElement("div");
    btn.className = "color-btn";
    btn.style.backgroundColor = color;
    btn.onclick = () => {
      btn.classList.toggle("selected");
      if (contenedor.querySelectorAll(".selected").length > 4) {
        btn.classList.remove("selected");
      }
    };
    contenedor.appendChild(btn);
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

    for (let codigo in salas) {
      const jugadores = salas[codigo].jugadores || {};
      if (Object.keys(jugadores).length < 2) {
        const div = document.createElement("div");
        div.innerHTML = `Sala <b>${codigo}</b> (${Object.keys(jugadores).length}/2) 
          <button onclick="unirseDesdeLista('${codigo}')">Unirse</button>`;
        contenedor.appendChild(div);
      }
    }

    if (contenedor.innerHTML === "") {
      contenedor.innerHTML = "<i>No hay salas disponibles</i>";
    }
  });
}

async function unirseDesdeLista(codigo) {
  const nombre = document.getElementById("nombreLista").value.trim();
  if (!nombre) return alert("Ingresá tu nombre");
  salaId = codigo;

  await set(ref(db, `salas/${salaId}/jugadores/${userId}`), {
    nombre,
    intentosCount: 0,
    intentos: {}
  });

  mostrarEstado("Unido a sala " + salaId);
  iniciarJuego(nombre);
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

// ---------------------- EXPORTS ------------------------

window.crearSala = crearSala;
window.unirseSala = unirseSala;
window.unirseDesdeLista = unirseDesdeLista;
window.enviarIntento = enviarIntento;
window.salirDeSala = salirDeSala;
window.enviarMensaje = enviarMensaje;

window.onload = () => {
  actualizarListaSalas();
  mostrarBotonSalir(false);
  mostrarEstado("Listo para jugar", "green");
};