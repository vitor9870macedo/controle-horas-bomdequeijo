/**
 * App.js - Lógica do Registro de Ponto para Funcionários
 * Gerencia entrada/saída e validação de PIN
 */

import { supabase } from "./config.js";

// Elementos do DOM
const funcionarioSelect = document.getElementById("funcionario");
const pinInput = document.getElementById("pin");
const pontoForm = document.getElementById("pontoForm");
const messageDiv = document.getElementById("message");
const ultimoRegistroDiv = document.getElementById("ultimoRegistro");

// Função para obter horário de Brasília
function getBrasiliaTime() {
  const now = new Date();
  return new Date(
    now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
}

// Carregar funcionários ativos
async function loadFuncionarios() {
  try {
    const { data, error } = await supabase
      .from("funcionarios")
      .select("*")
      .eq("ativo", true)
      .order("nome");

    if (error) throw error;

    funcionarioSelect.innerHTML =
      '<option value="">Escolha seu nome...</option>';
    data.forEach((func) => {
      const option = document.createElement("option");
      option.value = func.id;
      option.textContent = func.nome;
      funcionarioSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar funcionários:", error);
    showMessage("Erro ao carregar funcionários", "error");
  }
}

// Verificar último registro do funcionário
async function checkUltimoRegistro(funcionarioId) {
  try {
    const hoje = getBrasiliaTime().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("registros_ponto")
      .select("*, funcionarios(nome)")
      .eq("funcionario_id", funcionarioId)
      .eq("data", hoje)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      const registro = data[0];
      const entradaFormatada = registro.entrada
        ? new Date(registro.entrada).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--";
      const saidaFormatada = registro.saida
        ? new Date(registro.saida).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--";

      ultimoRegistroDiv.innerHTML = `
                <strong>📋 Último registro de hoje:</strong><br>
                Entrada: ${entradaFormatada} | Saída: ${saidaFormatada}
            `;
    } else {
      ultimoRegistroDiv.innerHTML = "<strong>ℹ️ Nenhum registro hoje</strong>";
    }
  } catch (error) {
    console.error("Erro ao verificar último registro:", error);
  }
}

// Verificar PIN
async function verificarPin(funcionarioId, pin) {
  try {
    const { data, error } = await supabase
      .from("funcionarios")
      .select("pin")
      .eq("id", funcionarioId)
      .single();

    if (error) throw error;

    return data.pin === pin;
  } catch (error) {
    console.error("Erro ao verificar PIN:", error);
    return false;
  }
}

// Registrar ponto
async function registrarPonto(funcionarioId, acao) {
  try {
    const brasiliaTime = getBrasiliaTime();
    const hoje = brasiliaTime.toISOString().split("T")[0];
    const agora = brasiliaTime.toISOString();

    // Buscar registro de hoje
    const { data: registroExistente, error: searchError } = await supabase
      .from("registros_ponto")
      .select("*")
      .eq("funcionario_id", funcionarioId)
      .eq("data", hoje)
      .order("created_at", { ascending: false })
      .limit(1);

    if (searchError) throw searchError;

    if (acao === "entrada") {
      // Verificar se já tem entrada sem saída
      if (
        registroExistente &&
        registroExistente.length > 0 &&
        registroExistente[0].entrada &&
        !registroExistente[0].saida
      ) {
        showMessage(
          "❌ Você já registrou entrada hoje. Registre a saída primeiro!",
          "error"
        );
        return;
      }

      // Criar novo registro de entrada
      const { error: insertError } = await supabase
        .from("registros_ponto")
        .insert([
          {
            funcionario_id: funcionarioId,
            data: hoje,
            entrada: agora,
            saida: null,
            total_horas: null,
          },
        ]);

      if (insertError) throw insertError;
      showMessage("✅ Entrada registrada com sucesso!", "success");
    } else if (acao === "saida") {
      // Verificar se tem entrada sem saída
      if (
        !registroExistente ||
        registroExistente.length === 0 ||
        !registroExistente[0].entrada ||
        registroExistente[0].saida
      ) {
        showMessage("❌ Você precisa registrar a entrada primeiro!", "error");
        return;
      }

      const registro = registroExistente[0];
      const entrada = new Date(registro.entrada);
      const saida = new Date(agora);

      // Calcular horas trabalhadas
      const diffMs = saida - entrada;
      const diffHours = diffMs / (1000 * 60 * 60);

      // Atualizar registro com saída
      const { error: updateError } = await supabase
        .from("registros_ponto")
        .update({
          saida: agora,
          total_horas: diffHours.toFixed(2),
        })
        .eq("id", registro.id);

      if (updateError) throw updateError;

      const horasFormatadas = Math.floor(diffHours);
      const minutosFormatados = Math.round((diffHours - horasFormatadas) * 60);
      showMessage(
        `✅ Saída registrada! Você trabalhou ${horasFormatadas}h ${minutosFormatados}min hoje.`,
        "success"
      );
    }

    // Atualizar último registro
    await checkUltimoRegistro(funcionarioId);

    // Limpar formulário
    pinInput.value = "";
  } catch (error) {
    console.error("Erro ao registrar ponto:", error);
    showMessage("❌ Erro ao registrar ponto. Tente novamente.", "error");
  }
}

// Mostrar mensagem
function showMessage(text, type) {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;

  setTimeout(() => {
    messageDiv.className = "message";
    messageDiv.textContent = "";
  }, 5000);
}

// Event Listeners
funcionarioSelect.addEventListener("change", async (e) => {
  if (e.target.value) {
    await checkUltimoRegistro(e.target.value);
  } else {
    ultimoRegistroDiv.innerHTML = "";
  }
});

pontoForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const funcionarioId = funcionarioSelect.value;
  const pin = pinInput.value;
  const acao = e.submitter.dataset.action;

  if (!funcionarioId || !pin) {
    showMessage("❌ Preencha todos os campos!", "error");
    return;
  }

  // Verificar PIN
  const pinValido = await verificarPin(funcionarioId, pin);
  if (!pinValido) {
    showMessage("❌ PIN incorreto!", "error");
    pinInput.value = "";
    return;
  }

  // Registrar ponto
  await registrarPonto(funcionarioId, acao);
});

// Inicializar
loadFuncionarios();
