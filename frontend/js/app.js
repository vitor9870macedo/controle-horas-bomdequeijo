/**
 * App.js - Lógica do Registro de Ponto para Funcionários
 * Gerencia entrada/saída e validação de PIN
 *
 * PILARES:
 * 1. CONFIABILIDADE: Salvamento offline + retry automático
 * 2. AUDITORIA: Log de todas as alterações
 */

import { supabase } from "./config.js";

// Elementos do DOM
const funcionarioSelect = document.getElementById("funcionario");
const pinInput = document.getElementById("pin");
const pontoForm = document.getElementById("pontoForm");
const messageDiv = document.getElementById("message");
const ultimoRegistroDiv = document.getElementById("ultimoRegistro");

// ============================================
// CONFIABILIDADE: Sistema Offline-First
// ============================================

// Chave para armazenamento local
const STORAGE_KEY = "registros_pendentes_bom_de_queijo";

// Salvar registro offline
function salvarRegistroOffline(registro) {
  try {
    const pendentes = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    pendentes.push({
      ...registro,
      timestamp: new Date().toISOString(),
      tentativas: 0,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendentes));
    console.log("💾 Registro salvo offline:", registro);
    return true;
  } catch (error) {
    console.error("❌ Erro ao salvar offline:", error);
    return false;
  }
}

// Obter registros pendentes
function obterRegistrosPendentes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

// Remover registro processado
function removerRegistroPendente(index) {
  try {
    const pendentes = obterRegistrosPendentes();
    pendentes.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendentes));
  } catch (error) {
    console.error("❌ Erro ao remover pendente:", error);
  }
}

// Sincronizar registros pendentes
async function sincronizarPendentes() {
  const pendentes = obterRegistrosPendentes();

  if (pendentes.length === 0) return;

  console.log(
    `🔄 Sincronizando ${pendentes.length} registro(s) pendente(s)...`,
  );

  for (let i = pendentes.length - 1; i >= 0; i--) {
    const registro = pendentes[i];

    // Limite de tentativas
    if (registro.tentativas >= 5) {
      console.warn("⚠️ Registro atingiu limite de tentativas:", registro);
      continue;
    }

    try {
      // Tentar enviar ao Supabase
      if (registro.tipo === "entrada") {
        const { error } = await supabase.from("registros_ponto").insert([
          {
            funcionario_id: registro.funcionario_id,
            data: registro.data,
            entrada: registro.entrada,
            saida: null,
            total_horas: null,
          },
        ]);

        if (error) throw error;
      } else if (registro.tipo === "saida") {
        const { error } = await supabase
          .from("registros_ponto")
          .update({
            saida: registro.saida,
            total_horas: registro.total_horas,
          })
          .eq("id", registro.registro_id);

        if (error) throw error;
      }

      // Sucesso: remover da fila
      removerRegistroPendente(i);
      console.log("✅ Registro sincronizado:", registro);
    } catch (error) {
      // Falha: incrementar tentativas
      pendentes[i].tentativas++;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendentes));
      console.error("❌ Erro ao sincronizar registro:", error);
    }
  }
}

// Verificar conexão e sincronizar
window.addEventListener("online", () => {
  console.log("🌐 Conexão restaurada!");
  showMessage("🌐 Conectado! Sincronizando registros...", "success");
  sincronizarPendentes();
});

// Sincronizar ao carregar página
document.addEventListener("DOMContentLoaded", () => {
  if (navigator.onLine) {
    sincronizarPendentes();
  }
});

// Função para obter horário de Brasília
function getBrasiliaTime() {
  const now = new Date();
  return new Date(
    now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
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

// Registrar ponto com sistema offline-first
async function registrarPonto(funcionarioId, acao, botaoClicado) {
  console.log("🔵 registrarPonto chamado:", { funcionarioId, acao });

  // Desabilitar botões e mostrar loading
  const botoes = document.querySelectorAll("button[data-action]");
  botoes.forEach((btn) => (btn.disabled = true));

  // Guardar estado original do botão
  const htmlOriginal = botaoClicado.innerHTML;

  // Mostrar loading
  const textoLoading =
    acao === "entrada"
      ? '<span class="btn-icon">⏳</span> Registrando entrada...'
      : '<span class="btn-icon">⏳</span> Registrando saída...';
  botaoClicado.innerHTML = textoLoading;

  try {
    const brasiliaTime = getBrasiliaTime();
    const hoje = brasiliaTime.toISOString().split("T")[0];
    const agora = brasiliaTime.toISOString();

    if (acao === "entrada") {
      // Buscar último registro sem saída (qualquer data) - para evitar duplicatas
      const { data: registroAberto, error: searchError } = await supabase
        .from("registros_ponto")
        .select("*")
        .eq("funcionario_id", funcionarioId)
        .is("saida", null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (searchError) {
        // Se erro de rede, salvar offline
        if (!navigator.onLine || searchError.message.includes("fetch")) {
          salvarRegistroOffline({
            tipo: "entrada",
            funcionario_id: funcionarioId,
            data: hoje,
            entrada: agora,
          });
          showMessage(
            "📴 Sem conexão! Entrada salva offline e será sincronizada.",
            "warning",
          );
          return;
        }
        throw searchError;
      }

      // Verificar se já tem entrada sem saída
      if (registroAberto && registroAberto.length > 0) {
        showMessage(
          "❌ Você já tem um registro de entrada aberto. Registre a saída primeiro!",
          "error",
        );
        return;
      }

      // Tentar criar novo registro de entrada
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

      if (insertError) {
        // Se erro de rede, salvar offline
        if (!navigator.onLine || insertError.message.includes("fetch")) {
          salvarRegistroOffline({
            tipo: "entrada",
            funcionario_id: funcionarioId,
            data: hoje,
            entrada: agora,
          });
          showMessage(
            "📴 Sem conexão! Entrada salva offline e será sincronizada.",
            "warning",
          );
          return;
        }
        throw insertError;
      }

      showMessage("✅ Entrada registrada com sucesso!", "success");
    } else if (acao === "saida") {
      // Buscar último registro sem saída (independente da data) - permite turno noturno
      const { data: registroAberto, error: searchError } = await supabase
        .from("registros_ponto")
        .select("*")
        .eq("funcionario_id", funcionarioId)
        .is("saida", null)
        .order("entrada", { ascending: false })
        .limit(1);

      if (searchError) {
        console.error("Erro ao buscar registro:", searchError);
        // Se erro de rede, não podemos buscar - informar usuário
        if (!navigator.onLine || searchError.message.includes("fetch")) {
          showMessage(
            "📴 Sem conexão! Não foi possível verificar entrada. Tente novamente.",
            "error",
          );
          return;
        }
        throw searchError;
      }

      console.log("Registros encontrados:", registroAberto);

      // Verificar se tem entrada sem saída
      if (!registroAberto || registroAberto.length === 0) {
        showMessage("❌ Você precisa registrar a entrada primeiro!", "error");
        return;
      }

      const registro = registroAberto[0];
      console.log("Registro a ser fechado:", registro);

      const entrada = new Date(registro.entrada);
      const saida = new Date(agora);

      // Calcular horas trabalhadas (funciona mesmo atravessando meia-noite)
      const diffMs = saida - entrada;
      const diffHours = diffMs / (1000 * 60 * 60);

      // Validar se o tempo é positivo (saída depois da entrada)
      if (diffHours < 0) {
        showMessage(
          "❌ Erro: horário de saída anterior à entrada. Contate o administrador.",
          "error",
        );
        return;
      }

      // Atualizar registro com saída
      const { error: updateError } = await supabase
        .from("registros_ponto")
        .update({
          saida: agora,
          total_horas: diffHours.toFixed(2),
        })
        .eq("id", registro.id);

      if (updateError) {
        // Se erro de rede, salvar offline
        if (!navigator.onLine || updateError.message.includes("fetch")) {
          salvarRegistroOffline({
            tipo: "saida",
            registro_id: registro.id,
            funcionario_id: funcionarioId,
            saida: agora,
            total_horas: diffHours.toFixed(2),
          });
          showMessage(
            "📴 Sem conexão! Saída salva offline e será sincronizada.",
            "warning",
          );
          return;
        }
        throw updateError;
      }

      const horasFormatadas = Math.floor(diffHours);
      const minutosFormatados = Math.round((diffHours - horasFormatadas) * 60);

      // Verificar se trabalhou em turno noturno (passou da meia-noite)
      const dataEntrada = new Date(registro.entrada).toLocaleDateString(
        "pt-BR",
      );
      const dataSaida = saida.toLocaleDateString("pt-BR");
      const mensagemTurno =
        dataEntrada !== dataSaida
          ? ` (turno noturno: ${dataEntrada} → ${dataSaida})`
          : "";

      showMessage(
        `✅ Saída registrada! Você trabalhou ${horasFormatadas}h ${minutosFormatados}min${mensagemTurno}.`,
        "success",
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
    const botoes = document.querySelectorAll("button[data-action]");
    botoes.forEach((btn) => (btn.disabled = false));

    botaoClicado.innerHTML = htmlOriginal;
  }
}

// Verificar e mostrar último registro do funcionário
async function checkUltimoRegistro(funcionarioId) {
  try {
    const { data, error } = await supabase
      .from("registros_ponto")
      .select("*")
      .eq("funcionario_id", funcionarioId)
      .order("entrada", { ascending: false })
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      const registro = data[0];
      const entrada = new Date(registro.entrada);
      const entradaFormatada = entrada.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      if (!registro.saida) {
        // Registro em aberto - calcular tempo decorrido
        const agora = getBrasiliaTime();
        const diffMs = agora - entrada;
        const diffHours = diffMs / (1000 * 60 * 60);
        const horas = Math.floor(diffHours);
        const minutos = Math.round((diffHours - horas) * 60);

        ultimoRegistroDiv.innerHTML = `
          <div style="background: var(--warning); color: var(--bg-dark); padding: 12px; border-radius: 8px; margin-top: 10px;">
            <strong>⚠️ VOCÊ TEM UM PONTO EM ABERTO</strong><br>
            <small>Entrada: ${entradaFormatada}</small><br>
            <small>Tempo decorrido: ${horas}h ${minutos}min</small><br>
            <small style="opacity: 0.8;">👉 Registre sua saída quando terminar</small>
          </div>
        `;
      } else {
        // Último registro completo
        const saida = new Date(registro.saida);
        const saidaFormatada = saida.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const totalHoras = parseFloat(registro.total_horas || 0);
        const horas = Math.floor(totalHoras);
        const minutos = Math.round((totalHoras - horas) * 60);

        ultimoRegistroDiv.innerHTML = `
          <div style="background: var(--card); padding: 10px; border-radius: 8px; margin-top: 10px; border-left: 3px solid var(--success);">
            <strong>✅ Último registro completo</strong><br>
            <small>Entrada: ${entradaFormatada}</small><br>
            <small>Saída: ${saidaFormatada}</small><br>
            <small>Total: ${horas}h ${minutos}min</small>
          </div>
        `;
      }
    } else {
      ultimoRegistroDiv.innerHTML = `
        <div style="padding: 10px; margin-top: 10px; text-align: center; opacity: 0.7;">
          <small>Nenhum registro encontrado</small>
        </div>
      `;
    }
  } catch (error) {
    console.error("Erro ao verificar último registro:", error);
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
    const nomeSelecionado = e.target.value;

    try {
      // Buscar ID do funcionário pelo nome
      const { data: funcionario, error } = await supabase
        .from("funcionarios")
        .select("id")
        .eq("nome", nomeSelecionado)
        .eq("ativo", true)
        .single();

      if (error) throw error;

      if (funcionario) {
        // Mostrar último registro imediatamente
        await checkUltimoRegistro(funcionario.id);
      }
    } catch (error) {
      console.error("Erro ao buscar funcionário:", error);
      ultimoRegistroDiv.innerHTML =
        "<div style='padding: 10px; text-align: center; opacity: 0.8;'><strong>ℹ️ Digite seu PIN para continuar</strong></div>";
    }
  } else {
    ultimoRegistroDiv.innerHTML = "";
  }
});

pontoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("🟢 Form submetido");

  const nomeFuncionario = funcionarioSelect.value; // Agora é NOME, não ID
  const pin = pinInput.value;
  const acao = e.submitter.dataset.action;
  const botaoClicado = e.submitter;

  console.log("📝 Dados do form:", { nomeFuncionario, pin: "****", acao });

  if (!nomeFuncionario || !pin) {
    showMessage("❌ Preencha todos os campos!", "error");
    return;
  }

  console.log("🔐 Verificando PIN...");
  // Verificar PIN usando função segura
  const funcionario = await verificarPin(nomeFuncionario, pin);
  console.log(
    "🔐 Resultado verificação:",
    funcionario ? "✅ OK" : "❌ Inválido",
  );

  if (!funcionario) {
    showMessage("❌ Nome ou PIN incorreto!", "error");
    pinInput.value = "";
    return;
  }

  // Mostrar último registro antes de registrar (para que o usuário veja se tem ponto aberto)
  await checkUltimoRegistro(funcionario.id);

  // Registrar ponto com o ID retornado pela função segura
  await registrarPonto(funcionario.id, acao, botaoClicado);
});

// Inicializar
loadFuncionarios();
