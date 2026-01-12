/**
 * Clock.js - Módulo de Relógio em Tempo Real
 * Exibe horário sincronizado com o fuso de Brasília (America/Sao_Paulo)
 */

function updateClock() {
  const now = new Date();

  // Converte para horário de Brasília (GMT-3)
  const brasiliaTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );

  const timeString = brasiliaTime.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateString = brasiliaTime.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeElement = document.getElementById("currentTime");
  const dateElement = document.getElementById("currentDate");

  if (timeElement) timeElement.textContent = timeString;
  if (dateElement) dateElement.textContent = dateString;
}

// Atualiza o relógio imediatamente e a cada segundo
updateClock();
setInterval(updateClock, 1000);
