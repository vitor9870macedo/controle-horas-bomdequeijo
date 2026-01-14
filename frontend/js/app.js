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

// Carregar funcionários ativos (RLS permite leitura)
async function loadFuncionarios() {
  try {
    const { data, error } = await supabase
      .from("funcionarios")
      .select("nome")
      .eq("ativo", true)
      .eq("role", "funcionario")
      .order("nome");

    if (error) throw error;

    funcionarioSelect.innerHTML =
      '<option value="">Escolha seu nome...</option>';

    if (data && data.length > 0) {
      const nomesUnicos = [...new Set(data.map((f) => f.nome))];
      nomesUnicos.forEach((nome) => {
        const option = document.createElement("option");
        option.value = nome;
        option.textContent = nome;
        funcionarioSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Erro ao carregar funcionários:", error);
    showMessage("Erro ao carregar lista. Recarregue a página.", "error");
  }
}

// Validar PIN usando função segura do banco
async function verificarPin(nomeFuncionario, pin) {
  try {
    const { data, error } = await supabase.rpc("validar_pin_funcionario", {
      nome_input: nomeFuncionario,
      pin_input: pin,
    });

    if (error) throw error;

    // Se retornar dados, PIN está correto
    if (data && data.length > 0) {
      return data[0]; // Retorna { id, nome, valor_hora, ativo }
    }

    return null; // PIN incorreto
  } catch (error) {
    console.error("Erro ao verificar PIN:", error);
    return null;
  }
}

// Registrar ponto
async function registrarPonto(funcionarioId, acao, botaoClicado) {
  // Desabilitar botões e mostrar loading
  const botoes = document.querySelectorAll('button[data-action]');
  botoes.forEach(btn => btn.disabled = true);
  
  const iconeOriginal = botaoClicado.querySelector('.btn-icon').textContent;
  const textoOriginal = botaoClicado.childNodes[2].textContent.trim();
  
  botaoClicado.querySelector('.btn-icon').textContent = '⏳';
  botaoClicado.childNodes[2].textContent = acao === 'entrada' ? ' Registrando entrada...' : ' Registrando saída...';
  
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
  } finally {
    // Reabilitar botões e restaurar estado original
    const botoes = document.querySelectorAll('button[data-action]');
    botoes.forEach(btn => btn.disabled = false);
    
    botaoClicado.querySelector('.btn-icon').textContent = iconeOriginal;
    botaoClicado.childNodes[2].textContent = ' ' + textoOriginal;
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
    // Não mostramos registros sem validar PIN (segurança)
    ultimoRegistroDiv.innerHTML =
      "<strong>ℹ️ Digite seu PIN para continuar</strong>";
  } else {
    ultimoRegistroDiv.innerHTML = "";
  }
});

pontoForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nomeFuncionario = funcionarioSelect.value; // Agora é NOME, não ID
  const pin = pinInput.value;
  const acao = e.submitter.dataset.action;
  const botaoClicado = e.submitter;

  if (!nomeFuncionario || !pin) {
    showMessage("❌ Preencha todos os campos!", "error");
    return;
  }

  // Verificar PIN usando função segura
  const funcionario = await verificarPin(nomeFuncionario, pin);
  if (!funcionario) {
    showMessage("❌ Nome ou PIN incorreto!", "error");
    pinInput.value = "";
    return;
  }

  // Registrar ponto com o ID retornado pela função segura
  await registrarPonto(funcionario.id, acao, botaoClicado);
});

// Inicializar
loadFuncionarios();
