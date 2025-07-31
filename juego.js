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

const estadoApp = document.getElementById("estadoApp");
const btnEnviarIntento = document.querySelector("button[onclick='enviarIntento()']");

let timerInterval = null;
let tiempoRestante = 15;


function mostrarEstado(msg, color = "green") {
  estadoApp.textContent = msg;
  estadoApp.style.color = color;
}

function generarCodigoSala() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789";
  return Array.from({ length: 5 }, () =>
    letras.charAt(Math.floor(Math.random() * letras.length))
  ).join("");
}

function generarSecuencia(longitud = 4) {
  return Array.from({ length: longitud }, () =>
    colores[Math.floor(Math.random() * colores.length)]
  );
}

async function crearSala() {
  const nombre = document.getElementById("nombreCrear").value.trim();
  if (!nombre) {
    mostrarEstado("Ingresá tu nombre para crear sala", "red");
    return;
  }

  salaId = generarCodigoSala();
  secuenciaSala = generarSecuencia();

  await set(ref(db, "salas/" + salaId), {
    secuencia: secuenciaSala,
    jugadores: {
      [userId]: {
        nombre,
        intentosCount: 0,
        intentos: {}
      }
    },
    turno: userId,  // el creador empieza
    estadoJuego: "esperando" // estados: esperando, jugando, terminado
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

  if (!nombre || !codigo) {
    mostrarEstado("Completa nombre y código para unirte", "red");
    return;
  }

  salaId = codigo;
  const salaSnap = await get(ref(db, "salas/" + salaId));

  if (!salaSnap.exists()) {
    mostrarEstado("Sala no existe", "red");
    return;
  }

  const salaData = salaSnap.val();
  const jugadores = salaData.jugadores || {};
  if (Object.keys(jugadores).length >= 2) {
    mostrarEstado("La sala ya tiene 2 jugadores", "red");
    return;
  }

  await set(ref(db, "salas/" + salaId + "/jugadores/" + userId), {
    nombre,
    intentosCount: 0,
    intentos: {}
  });

  // Si hay 2 jugadores, cambiar estado a jugando
  const jugadoresActualizadosSnap = await get(ref(db, "salas/" + salaId + "/jugadores"));
  const cantJugadores = Object.keys(jugadoresActualizadosSnap.val() || {}).length;

  if (cantJugadores === 2) {
    await update(ref(db, "salas/" + salaId), { estadoJuego: "jugando" });
  }

  mostrarEstado("Unido a sala " + salaId, "green");
  iniciarJuego(nombre);
  ocultarFormularios();
  mostrarBotonSalir(true);
  actualizarListaSalas();
}

function iniciarJuego(nombreJugador) {
  document.getElementById("formulario").style.display = "none";
  document.getElementById("listaSalas").style.display = "none";
  document.getElementById("juego").style.display = "block";
  document.getElementById("jugadorNombre").textContent = nombreJugador;
  document.getElementById("codigoSala").textContent = salaId;

  mostrarColores();
  escucharEstadoJuego();
  escucharTurno();
  escucharTodosLosIntentos();
  escucharJugadores();

  // Traer secuencia
  get(ref(db, "salas/" + salaId + "/secuencia")).then(snap => {
    if (snap.exists()) {
      secuenciaSala = snap.val();
    }
  });

  // Eliminar jugador si se desconecta
  const jugadorRef = ref(db, "salas/" + salaId + "/jugadores/" + userId);
  onDisconnect(jugadorRef).remove();

  btnEnviarIntento.disabled = true; // deshabilitar hasta que sea tu turno
}

// Escuchar si el juego está en "jugando" o "terminado"
function escucharEstadoJuego() {
  onValue(ref(db, "salas/" + salaId + "/estadoJuego"), (snap) => {
    const estado = snap.val();
    if (!estado) return;

    if (estado === "jugando") {
      mostrarEstado("¡El juego comenzó!", "green");
    } else if (estado === "terminado") {
      mostrarEstado("Juego terminado", "blue");
      btnEnviarIntento.disabled = true;
      clearInterval(timerInterval);
    } else if (estado === "esperando") {
      mostrarEstado("Esperando a que se unan 2 jugadores...", "orange");
      btnEnviarIntento.disabled = true;
    }
  });
}

let jugadorTurno = null;

function escucharTurno() {
  onValue(ref(db, "salas/" + salaId + "/turno"), (snap) => {
    jugadorTurno = snap.val();
    if (!jugadorTurno) return;

    if (jugadorTurno === userId) {
      mostrarEstado("Es tu turno. Tenés 15 segundos para jugar.", "green");
      btnEnviarIntento.disabled = false;
      iniciarTemporizadorTurno();
    } else {
      mostrarEstado("Turno del otro jugador. Esperá tu turno.", "orange");
      btnEnviarIntento.disabled = true;
      clearInterval(timerInterval);
      document.getElementById("tiempoRestante").textContent = "-";
    }
  });
}

function iniciarTemporizadorTurno() {
  tiempoRestante = 15;
  const tiempoSpan = document.getElementById("tiempoRestante");
  tiempoSpan.textContent = tiempoRestante;

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    tiempoRestante--;
    tiempoSpan.textContent = tiempoRestante;
    if (tiempoRestante <= 0) {
      clearInterval(timerInterval);
      mostrarEstado("Se acabó tu tiempo, pasando turno...", "red");
      pasarTurno();
    }
  }, 1000);
}

async function enviarIntento() {
  const seleccionados = Array.from(document.querySelectorAll(".color-btn.selected"))
    .map(btn => btn.style.backgroundColor);

  if (seleccionados.length !== 4) {
    mostrarEstado("Elegí 4 colores", "red");
    return;
  }

  // Comprobar si es tu turno
  if (jugadorTurno !== userId) {
    mostrarEstado("No es tu turno", "red");
    return;
  }

  // Obtener intentos actuales para este jugador
  const jugadorRef = ref(db, `salas/${salaId}/jugadores/${userId}`);
  const snapJugador = await get(jugadorRef);
  if (!snapJugador.exists()) {
    mostrarEstado("Error: Jugador no encontrado", "red");
    return;
  }
  const jugadorData = snapJugador.val();
  if (jugadorData.intentosCount >= 10) {
    mostrarEstado("Llegaste al límite de 10 intentos", "red");
    btnEnviarIntento.disabled = true;
    return;
  }

  // Guardar intento y aumentar contador
  const intentosRef = ref(db, `salas/${salaId}/jugadores/${userId}/intentos`);
  await push(intentosRef, seleccionados);
  await update(jugadorRef, { intentosCount: jugadorData.intentosCount + 1 });

  mostrarEstado("Intento enviado", "green");

  // Revisar si ganó
  const resultado = compararIntento(seleccionados, secuenciaSala);
  if (resultado.aciertosColorPos === 4) {
    mostrarEstado("¡Ganaste!", "green");
    await update(ref(db, `salas/${salaId}`), { estadoJuego: "terminado" });
    btnEnviarIntento.disabled = true;
    clearInterval(timerInterval);
    return;
  }

  // Si llegó a 10 intentos, deshabilitar botón
  if (jugadorData.intentosCount + 1 >= 10) {
    mostrarEstado("Has agotado tus 10 intentos.", "red");
    btnEnviarIntento.disabled = true;
  }

  clearInterval(timerInterval);
  pasarTurno();
}

// Cambiar turno al otro jugador
async function pasarTurno() {
  const salaSnap = await get(ref(db, `salas/${salaId}`));
  if (!salaSnap.exists()) return;

  const salaData = salaSnap.val();
  const jugadores = salaData.jugadores || {};
  const jugadoresIds = Object.keys(jugadores);
  if (jugadoresIds.length < 2) return; // no hay dos jugadores aún

  // Elegir el otro jugador
  const otroJugador = jugadoresIds.find(id => id !== jugadorTurno);
  if (!otroJugador) return;

  // Cambiar turno
  await update(ref(db, `salas/${salaId}`), { turno: otroJugador });
}

// Escuchar intentos y mostrar historial
function escucharTodosLosIntentos() {
  const jugadoresRef = ref(db, "salas/" + salaId + "/jugadores");
  onValue(jugadoresRef, snap => {
    const data = snap.val();
    if (!data) return;

    const historial = document.getElementById("historial");
    historial.innerHTML = "";

    for (let jugadorId in data) {
      const jugador = data[jugadorId];
      const nombre = jugador.nombre;
      const intentos = jugador.intentos;
      if (!intentos) continue;

      const titulo = document.createElement("p");
      titulo.textContent = "Intentos de " + nombre;
      historial.appendChild(titulo);

      Object.values(intentos).forEach(intento => {
        const div = document.createElement("div");
        intento.forEach(color => {
          const colorDiv = document.createElement("div");
          colorDiv.className = "color-btn";
          colorDiv.style.backgroundColor = color;
          div.appendChild(colorDiv);
        });

        if (jugadorId === userId && secuenciaSala.length === 4) {
          const resultado = compararIntento(intento, secuenciaSala);
          const resTexto = document.createElement("div");
          resTexto.textContent = `✔ ${resultado.aciertosColorPos} posición, 🎯 ${resultado.aciertosColor}`;
          div.appendChild(resTexto);
        }

        historial.appendChild(div);
      });
    }
  });
}

function compararIntento(intento, secuencia) {
  let aciertosColorPos = 0;
  let aciertosColor = 0;
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

function escucharJugadores() {
  const jugadoresRef = ref(db, "salas/" + salaId + "/jugadores");
  let yaMostrados = new Set();

  onValue(jugadoresRef, snap => {
    const jugadores = snap.val();
    if (!jugadores) return;

    for (let id in jugadores) {
      if (!yaMostrados.has(id)) {
        yaMostrados.add(id);
        if (id !== userId) {
          mostrarEstado("🧑‍🤝‍🧑 Se unió " + jugadores[id].nombre, "blue");
        }
      }
    }
  });
}

function mostrarColores() {
  const container = document.getElementById("coloresDisponibles");
  container.innerHTML = "";
  colores.forEach(color => {
    const btn = document.createElement("div");
    btn.className = "color-btn";
    btn.style.backgroundColor = color;
    btn.onclick = () => {
      btn.classList.toggle("selected");
      if (container.querySelectorAll(".selected").length > 4) {
        btn.classList.remove("selected");
      }
    };
    container.appendChild(btn);
  });
}

function actualizarListaSalas() {
  const contenedor = document.getElementById("contenedorSalas");
  contenedor.innerHTML = "";
  onValue(ref(db, "salas"), (snap) => {
    const salas = snap.val() || {};
    contenedor.innerHTML = "";

    let haySalas = false;
    for (const codigo in salas) {
      const jugadores = salas[codigo].jugadores || {};
      if (Object.keys(jugadores).length < 2) {
        haySalas = true;
        const div = document.createElement("div");
        div.innerHTML = `
          Sala <b>${codigo}</b> (${Object.keys(jugadores).length}/2) 
          <button onclick="unirseDesdeLista('${codigo}')">Unirse</button>
        `;
        contenedor.appendChild(div);
      }
    }
    if (!haySalas) contenedor.innerHTML = "<i>No hay salas disponibles</i>";
  });
}

async function unirseDesdeLista(codigo) {
  const nombre = document.getElementById("nombreLista").value.trim();
  if (!nombre) {
    alert("Ingresá tu nombre para unirte");
    return;
  }

  salaId = codigo;

  await set(ref(db, "salas/" + salaId + "/jugadores/" + userId), {
    nombre,
    intentosCount: 0,
    intentos: {}
  });

  // Si hay 2 jugadores, cambiar estado a jugando
  const jugadoresActualizadosSnap = await get(ref(db, "salas/" + salaId + "/jugadores"));
  const cantJugadores = Object.keys(jugadoresActualizadosSnap.val() || {}).length;

  if (cantJugadores === 2) {
    await update(ref(db, "salas/" + salaId), { estadoJuego: "jugando" });
  }

  mostrarEstado("Unido a sala " + salaId, "green");
  iniciarJuego(nombre);
  ocultarFormularios();
  mostrarBotonSalir(true);
  actualizarListaSalas();
}

async function salirDeSala() {
  if (!salaId || !userId) return;

  await remove(ref(db, `salas/${salaId}/jugadores/${userId}`));

  const jugadoresSnap = await get(ref(db, `salas/${salaId}/jugadores`));
  if (!jugadoresSnap.exists() || Object.keys(jugadoresSnap.val()).length === 0) {
    await remove(ref(db, `salas/${salaId}`));
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

function mostrarBotonSalir(show = false) {
  const btn = document.getElementById("salirBtn");
  if (btn) btn.style.display = show ? "block" : "none";
}

function ocultarFormularios() {
  document.getElementById("formulario").style.display = "none";
  document.getElementById("listaSalas").style.display = "none";
}

window.crearSala = crearSala;
window.unirseSala = unirseSala;
window.unirseDesdeLista = unirseDesdeLista;
window.enviarIntento = enviarIntento;
window.salirDeSala = salirDeSala;


window.onload = () => {
  actualizarListaSalas();
  mostrarBotonSalir(false);
  mostrarEstado("Listo para jugar", "green");
};
