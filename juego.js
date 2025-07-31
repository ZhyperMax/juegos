import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get, onValue, push } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

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
const debug = document.getElementById("debug");

function debugLog(msg) {
  debug.textContent += msg + "\n";
}

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

function crearSala() {
  const nombre = document.getElementById("nombre").value.trim();
  if (!nombre) {
    mostrarEstado("Ingresá tu nombre", "red");
    return;
  }

  salaId = generarCodigoSala();
  const secuencia = generarSecuencia();

  set(ref(db, "salas/" + salaId), {
    secuencia,
    jugadores: {
      [userId]: {
        nombre,
        intentos: {}
      }
    }
  }).then(() => {
    mostrarEstado("Sala creada: " + salaId, "green");
    debugLog("Secuencia generada: " + JSON.stringify(secuencia));
    iniciarJuego(nombre);
  }).catch(err => {
    mostrarEstado("Error al crear sala", "red");
    debugLog("Error crear sala: " + err.message);
  });
}

function unirseSala() {
  const nombre = document.getElementById("nombre").value.trim();
  const codigo = document.getElementById("codigoUnir").value.trim().toUpperCase();
  if (!nombre || !codigo) {
    mostrarEstado("Completa nombre y código", "red");
    return;
  }

  salaId = codigo;
  const jugadorRef = ref(db, "salas/" + salaId + "/jugadores/" + userId);

  get(ref(db, "salas/" + salaId)).then(snap => {
    if (!snap.exists()) {
      mostrarEstado("Sala no existe", "red");
      debugLog("Sala " + salaId + " no encontrada");
      return;
    }

    set(jugadorRef, {
      nombre,
      intentos: {}
    }).then(() => {
      mostrarEstado("Unido a sala " + salaId, "green");
      iniciarJuego(nombre);
    }).catch(err => {
      mostrarEstado("Error al unirse", "red");
      debugLog("Error unirse: " + err.message);
    });
  });
}

function iniciarJuego(nombreJugador) {
  document.getElementById("formulario").style.display = "none";
  document.getElementById("juego").style.display = "block";
  document.getElementById("jugadorNombre").textContent = nombreJugador;
  document.getElementById("codigoSala").textContent = salaId;

  mostrarColores();
  escucharTodosLosIntentos();
  escucharJugadores();
  iniciarTemporizador();

  const secuenciaRef = ref(db, "salas/" + salaId + "/secuencia");
  get(secuenciaRef).then(snap => {
    if (snap.exists()) {
      secuenciaSala = snap.val();
      debugLog("Secuencia secreta: " + JSON.stringify(secuenciaSala));
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

function enviarIntento() {
  const seleccionados = Array.from(document.querySelectorAll(".color-btn.selected"))
    .map(btn => btn.style.backgroundColor);

  if (seleccionados.length !== 4) {
    mostrarEstado("Elegí 4 colores", "red");
    return;
  }

  const intentosRef = ref(db, "salas/" + salaId + "/jugadores/" + userId + "/intentos");
  push(intentosRef, seleccionados).then(() => {
    mostrarEstado("Intento enviado", "green");
  }).catch(err => {
    mostrarEstado("Error enviando intento", "red");
    debugLog("Error enviar intento: " + err.message);
  });
}

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
          resTexto.textContent = `✔ ${resultado.aciertosColorPos} posición, 🎯 ${resultado.aciertosColor} color`;
          div.appendChild(resTexto);

          if (resultado.aciertosColorPos === 4) {
            mostrarEstado("¡Ganaste!", "green");
            clearInterval(timerInterval);
            document.querySelector("button[onclick='enviarIntento()']").disabled = true;
          }
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

let tiempoRestante = 60;
let timerInterval = null;

function iniciarTemporizador() {
  const tiempoSpan = document.getElementById("tiempoRestante");
  tiempoSpan.textContent = tiempoRestante;

  timerInterval = setInterval(() => {
    tiempoRestante--;
    tiempoSpan.textContent = tiempoRestante;
    if (tiempoRestante <= 0) {
      clearInterval(timerInterval);
      mostrarEstado("¡Se acabó el tiempo!", "red");
      document.querySelector("button[onclick='enviarIntento()']").disabled = true;
    }
  }, 1000);
}

// Exponer funciones
window.crearSala = crearSala;
window.unirseSala = unirseSala;
window.enviarIntento = enviarIntento;

// Error global
window.onerror = (msg, url, line, col, error) => {
  debugLog(`Error: ${msg} (línea ${line})`);
};

mostrarEstado("Conectado al servidor ✔");
