// ==================== CONFIGURACIÓN Y VARIABLES GLOBALES ====================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get, onValue, push, remove, onDisconnect, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Configuración de Firebase
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

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Constantes del juego
const colores = ["red", "blue", "green", "yellow", "orange", "purple"];

// Variables de usuario
let userId = null; // Se asignará después del login/registro
let nombreUsuario = null; // Nombre del usuario autenticado
let pinUsuario = null; // PIN del usuario (solo en memoria durante la sesión)

// Configuración de administrador
const NOMBRES_ADMIN = ['beto', 'admin', 'administrador'];

// Variables de sala y juego
let salaId = "";
let secuenciaSala = [];
let jugadorTurno = null;
let timerInterval = null;
let tiempoRestante = 20;
let jugadoresEnSala = {}; // Variable local para almacenar la información de los jugadores
let ordenSeleccion = []; // Array para mantener el orden de selección de colores
let juegoTerminado = false; // Flag para controlar el estado del juego
let inicioPartida = null; // Timestamp de inicio de la partida para calcular tiempo
let puntuacionJugador = 0; // Puntuación actual del jugador

// Exportar para uso en otros módulos
window.gameConfig = {
  db,
  colores,
  userId,
  nombreUsuario,
  pinUsuario,
  NOMBRES_ADMIN,
  salaId,
  secuenciaSala,
  jugadorTurno,
  timerInterval,
  tiempoRestante,
  jugadoresEnSala,
  ordenSeleccion,
  juegoTerminado,
  inicioPartida,
  puntuacionJugador
};

// Referencias de Firebase exportadas
window.firebaseRefs = { ref, set, get, onValue, push, remove, onDisconnect, update };
