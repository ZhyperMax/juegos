// ==================== JUEGO ADIVINA COLORES - VERSIÓN ORGANIZADA ====================
// Archivo principal reorganizado en secciones claras para mejor mantenimiento

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get, onValue, push, remove, onDisconnect, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

console.log("🎮 Iniciando Adivina Colores v2.0 - Organizado");

// ==================== CONFIGURACIÓN Y VARIABLES GLOBALES ====================
