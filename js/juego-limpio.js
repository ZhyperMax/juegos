/*
==================== ADIVINA COLORES ONLINE - VERSIÓN ORGANIZADA ====================

🎮 Juego de adivinanza de colores multijugador con Firebase
📁 Estructura organizada en secciones para mejor mantenimiento
👥 Soporte para modo solo y multijugador
🔐 Sistema de autenticación y ranking
🛡️ Sistema de administración seguro

Secciones:
1. Configuración y Variables
2. Funciones Básicas
3. Sistema de Autenticación  
4. Gestión de Salas
5. Lógica del Juego
6. Sistema de Puntuación
7. Chat y Comunicación
8. Sistema de Revancha
9. Ranking y Estadísticas
10. Modales e Interfaz
11. Sistema de Invitaciones
12. Administración
13. Inicialización

*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get, onValue, push, remove, onDisconnect, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ==================== 1. CONFIGURACIÓN Y VARIABLES ====================

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

// Constantes del juego
const colores = ["red", "blue", "green", "yellow", "orange", "purple"];

// Variables de usuario
let salaId = "";
let userId = null;
let nombreUsuario = null;
let pinUsuario = null;

// Configuración de administrador
const NOMBRES_ADMIN = ['beto', 'admin', 'administrador'];

// Variables de juego
let secuenciaSala = [];
let jugadorTurno = null;
let timerInterval = null;
let tiempoRestante = 20;
let jugadoresEnSala = {};
let ordenSeleccion = [];
let juegoTerminado = false;
let inicioPartida = null;
let puntuacionJugador = 0;

console.log("🎮 Juego Adivina Colores - Versión Organizada Cargada");

// ==================== 2. FUNCIONES BÁSICAS ====================

function mostrarEstado(mensaje, color = "blue") {
  const estado = document.getElementById("estadoApp");
  estado.textContent = mensaje;
  estado.className = `estado-${color === 'green' ? 'success' : color === 'red' ? 'error' : color === 'orange' ? 'warning' : 'info'}`;
  console.log("📢 Estado:", mensaje);
}

function ocultarFormularios() {
  document.getElementById("formulario").style.display = "none";
  document.getElementById("juego").style.display = "block";
}

function mostrarFormularios() {
  document.getElementById("formulario").style.display = "grid";
  document.getElementById("juego").style.display = "none";
}

function mostrarBotonSalir(mostrar) {
  const boton = document.getElementById("salirBtn");
  if (boton) {
    boton.style.display = mostrar ? "block" : "none";
  }
}

function generarSecuencia() {
  const secuencia = [];
  for (let i = 0; i < 4; i++) {
    secuencia.push(colores[Math.floor(Math.random() * colores.length)]);
  }
  console.log("🎯 Secuencia generada:", secuencia);
  return secuencia;
}

function generarCodigoSala() {
  return Math.random().toString(36).substr(2, 5).toUpperCase();
}

// ==================== NOTA ====================
/*
El resto del código se mantiene igual que en juego.js
pero se puede organizar en estas secciones para mejor legibilidad.

Para evitar duplicar todo el código aquí, 
voy a actualizar el HTML para usar el archivo original
pero con mejor organización de archivos CSS.
*/
