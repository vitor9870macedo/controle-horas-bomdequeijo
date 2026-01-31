/**
 * Admin.js - Painel Administrativo
 * Gerencia login, visualização de registros, relatórios e funcionários
 *
 * PILARES:
 * 1. CONFIABILIDADE: Sistema resiliente a falhas
 * 2. AUDITORIA: Log completo de todas as alterações
 */

import { supabase } from "./config.js";

// ============================================
// LOADING OVERLAY
// ============================================

let loadingOverlay = null;

/**
 * Mostrar loading
 */
function showLoading(message = "Carregando...") {
  if (!loadingOverlay) {
    loadingOverlay = document.createElement("div");
    loadingOverlay.id = "loadingOverlay";
    loadingOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      backdrop-filter: blur(4px);
    `;
    loadingOverlay.innerHTML = `
      <div style="text-align: center; color: var(--text-light);">
        <div class="spinner" style="
          width: 50px;
          height: 50px;
          border: 4px solid rgba(0, 217, 255, 0.3);
          border-top: 4px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        "></div>
        <p id="loadingMessage" style="font-size: 16px; font-weight: 500;">${message}</p>
      </div>
    `;
    document.body.appendChild(loadingOverlay);
  } else {
    loadingOverlay.style.display = "flex";
    loadingOverlay.querySelector("#loadingMessage").textContent = message;
  }
}

/**
 * Ocultar loading
 */
function hideLoading() {
  if (loadingOverlay) {
    loadingOverlay.style.display = "none";
  }
}

// ============================================
// FUNÇÕES DE AUDITORIA
// ============================================

/**
 * Registrar alteração no histórico
 */
async function registrarAlteracao(params) {
  const {
    tabela,
    registroId,
    funcionarioId,
    adminNome,
    campoAlterado,
    valorAnterior,
    valorNovo,
    motivo = null,
  } = params;

  try {
    const { data, error } = await supabase.rpc("registrar_alteracao_admin", {
      p_admin_nome: adminNome,
      p_campo_alterado: campoAlterado,
      p_funcionario_id: funcionarioId,
      p_motivo: motivo,
      p_registro_id: registroId,
      p_tabela: tabela,
      p_valor_anterior: valorAnterior,
      p_valor_novo: valorNovo,
    });

    if (error) throw error;

    console.log("✅ Alteração registrada no histórico:", data);
    return data;
  } catch (error) {
    console.error("❌ Erro ao registrar alteração:", error);
    throw error;
  }
}

/**
 * Obter histórico de um registro
 */
async function obterHistorico(tabela, registroId) {
  try {
    const { data, error } = await supabase.rpc("obter_historico_registro", {
      p_tabela: tabela,
      p_registro_id: registroId,
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("❌ Erro ao obter histórico:", error);
    return [];
  }
}

/**
 * Editar horário de entrada/saída com auditoria
 */
async function editarHorario(params) {
  const {
    registroId,
    funcionarioId,
    adminNome,
    campoAlterado,
    novoValor,
    valorAnterior,
    motivo,
  } = params;

  try {
    const updateData = {};
    updateData[campoAlterado] = novoValor;
    updateData.editado = true;
    updateData.editado_em = new Date().toISOString();
    updateData.editado_por = adminNome;

    if (campoAlterado === "entrada" || campoAlterado === "saida") {
      const { data: registro } = await supabase
        .from("registros_ponto")
        .select("entrada, saida")
        .eq("id", registroId)
        .single();

      if (registro) {
        const entrada =
          campoAlterado === "entrada"
            ? new Date(novoValor)
            : new Date(registro.entrada);
        const saida =
          campoAlterado === "saida"
            ? new Date(novoValor)
            : registro.saida
              ? new Date(registro.saida)
              : null;

        if (entrada && saida) {
          const diffMs = saida - entrada;
          const diffHours = diffMs / (1000 * 60 * 60);
          updateData.total_horas = diffHours.toFixed(2);
        }
      }
    }

    const { error: updateError } = await supabase
      .from("registros_ponto")
      .update(updateData)
      .eq("id", registroId);

    if (updateError) throw updateError;

    // Tentar registrar auditoria, mas não falhar se der erro
    try {
      await registrarAlteracao({
        tabela: "registros_ponto",
        registroId,
        funcionarioId,
        adminNome,
        campoAlterado,
        valorAnterior,
        valorNovo: novoValor,
        motivo,
      });
      console.log("✅ Auditoria registrada com sucesso");
    } catch (auditoriaError) {
      console.error(
        "⚠️ Alteração salva, mas auditoria falhou:",
        auditoriaError,
      );
      console.error("Detalhes do erro:", {
        message: auditoriaError.message,
        code: auditoriaError.code,
        details: auditoriaError.details,
        hint: auditoriaError.hint,
      });
      // Não lança erro - a edição foi salva com sucesso
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Erro ao editar horário:", error);
    throw error;
  }
}

/**
 * Mostrar modal de edição de horário
 */
function mostrarModalEdicao(registro, campo, adminNome, onSave) {
  const campoLabel = campo === "entrada" ? "Entrada" : "Saída";
  const valorAtual = registro[campo]
    ? new Date(registro[campo]).toLocaleString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Não registrado";

  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;

  modal.innerHTML = `
    <div style="background: var(--card-dark); padding: 24px; border-radius: 12px; max-width: 500px; width: 90%;">
      <h3 style="margin-top: 0; color: var(--warning);">✏️ Editar ${campoLabel}</h3>
      
      <p><strong>Funcionário:</strong> ${
        registro.funcionarios?.nome || "N/A"
      }</p>
      <p><strong>Data:</strong> ${new Date(
        registro.data + "T00:00:00",
      ).toLocaleDateString("pt-BR")}</p>
      <p><strong>Valor atual:</strong> ${valorAtual}</p>
      
      <div style="margin: 20px 0;">
        <label style="display: block; margin-bottom: 8px;"><strong>Novo horário:</strong></label>
        <input 
          type="datetime-local" 
          id="novoHorario" 
          style="width: 100%; padding: 10px; border: 1px solid var(--border-dark); border-radius: 6px; background: var(--bg-dark); color: var(--text-light);"
          value="${
            registro[campo]
              ? new Date(registro[campo]).toISOString().slice(0, 16)
              : ""
          }"
        >
      </div>
      
      <div style="margin: 20px 0;">
        <label style="display: block; margin-bottom: 8px;"><strong>Motivo da alteração:</strong></label>
        <textarea 
          id="motivoAlteracao" 
          placeholder="Ex: Ajuste solicitado pelo funcionário"
          style="width: 100%; padding: 10px; border: 1px solid var(--border-dark); border-radius: 6px; background: var(--bg-dark); color: var(--text-light); min-height: 80px;"
        ></textarea>
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="btnCancelar" style="padding: 10px 20px; background: var(--card-hover); border: none; border-radius: 6px; cursor: pointer; color: var(--text-light);">
          Cancelar
        </button>
        <button id="btnSalvar" style="padding: 10px 20px; background: var(--warning); border: none; border-radius: 6px; cursor: pointer; color: var(--bg-dark); font-weight: bold;">
          💾 Salvar Alteração
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#btnCancelar").onclick = () => {
    document.body.removeChild(modal);
  };

  modal.querySelector("#btnSalvar").onclick = async () => {
    const novoHorario = modal.querySelector("#novoHorario").value;
    const motivo = modal.querySelector("#motivoAlteracao").value.trim();

    if (!novoHorario) {
      alert("⚠️ Por favor, selecione um horário");
      return;
    }

    if (!motivo) {
      alert("⚠️ Por favor, informe o motivo da alteração (auditoria)");
      return;
    }

    try {
      const btnSalvar = modal.querySelector("#btnSalvar");
      btnSalvar.disabled = true;
      btnSalvar.textContent = "⏳ Salvando...";

      await editarHorario({
        registroId: registro.id,
        funcionarioId: registro.funcionario_id,
        adminNome,
        campoAlterado: campo,
        novoValor: new Date(novoHorario).toISOString(),
        valorAnterior: registro[campo] || "null",
        motivo,
      });

      // Fechar modal ANTES de recarregar para evitar erros
      document.body.removeChild(modal);

      // Atualizar UI imediatamente
      if (onSave) {
        await onSave();
      }

      alert(
        `✅ ${campoLabel} atualizado com sucesso!\n\nAlteração registrada no histórico de auditoria.`,
      );
    } catch (error) {
      console.error("Erro ao editar:", error);
      alert("❌ Erro ao salvar alteração: " + error.message);
      const btnSalvar = modal.querySelector("#btnSalvar");
      btnSalvar.disabled = false;
      btnSalvar.textContent = "💾 Salvar Alteração";
    }
  };

  modal.onclick = (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  };
}

/**
 * Mostrar histórico de alterações de um registro
 */
async function mostrarHistorico(registroId, funcionarioNome) {
  const historico = await obterHistorico("registros_ponto", registroId);

  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;

  let historicoHTML = "";
  if (historico.length === 0) {
    historicoHTML =
      '<p style="text-align: center; opacity: 0.7;">Nenhuma alteração registrada</p>';
  } else {
    historicoHTML = historico
      .map((h) => {
        // Formatar valores de data/hora
        const formatarValor = (valor) => {
          if (!valor || valor === "null") return "Não registrado";
          try {
            const data = new Date(valor);
            if (!isNaN(data.getTime())) {
              return data.toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
            }
          } catch (e) {}
          return valor;
        };

        return `
      <div style="padding: 12px; background: var(--bg-dark); border-radius: 8px; margin-bottom: 12px; border-left: 3px solid var(--warning);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <strong>${h.admin_nome}</strong>
          <small style="opacity: 0.7;">${new Date(h.created_at).toLocaleString(
            "pt-BR",
          )}</small>
        </div>
        <div><strong>Campo:</strong> ${h.campo_alterado}</div>
        <div><strong>De:</strong> ${formatarValor(h.valor_anterior)}</div>
        <div><strong>Para:</strong> ${formatarValor(h.valor_novo)}</div>
        ${
          h.motivo
            ? `<div style="margin-top: 8px; padding: 8px; background: var(--card-hover); border-radius: 4px;"><em>"${h.motivo}"</em></div>`
            : ""
        }
      </div>
    `;
      })
      .join("");
  }

  modal.innerHTML = `
    <div style="background: var(--card-dark); padding: 24px; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
      <h3 style="margin-top: 0;">📋 Histórico de Alterações</h3>
      <p><strong>Funcionário:</strong> ${funcionarioNome}</p>
      <hr style="border: 1px solid var(--border-dark); margin: 16px 0;">
      ${historicoHTML}
      <div style="text-align: right; margin-top: 20px;">
        <button id="btnFechar" style="padding: 10px 20px; background: var(--card-hover); border: none; border-radius: 6px; cursor: pointer; color: var(--text-light);">
          Fechar
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#btnFechar").onclick = () => {
    document.body.removeChild(modal);
  };

  modal.onclick = (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  };
}

// ============================================
// ELEMENTOS DO DOM E VARIÁVEIS
// ============================================

// Elementos do DOM
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const logoutBtn = document.getElementById("logoutBtn");

// Filtros
const filterFuncionario = document.getElementById("filterFuncionario");
const filterDataInicio = document.getElementById("filterDataInicio");
const filterDataFim = document.getElementById("filterDataFim");
const applyFiltersBtn = document.getElementById("applyFilters");

// Filtros de Pagamento
const filterPagamentoFunc = document.getElementById("filterPagamentoFunc");
const filterPagamentoPeriodo = document.getElementById(
  "filterPagamentoPeriodo",
);
const filterPagamentoStatus = document.getElementById("filterPagamentoStatus");
const applyPagamentoFiltersBtn = document.getElementById(
  "applyPagamentoFilters",
);

// Stats
const totalRegistrosEl = document.getElementById("totalRegistros");
const totalHorasEl = document.getElementById("totalHoras");
const funcionariosAtivosEl = document.getElementById("funcionariosAtivos");

// Tabelas
const registrosTableBody = document.getElementById("registrosTableBody");
const funcionariosTableBody = document.getElementById("funcionariosTableBody");

// Funcionários
const addFuncionarioBtn = document.getElementById("addFuncionarioBtn");
const addFuncionarioForm = document.getElementById("addFuncionarioForm");
const novoFuncionarioForm = document.getElementById("novoFuncionarioForm");
const cancelAddBtn = document.getElementById("cancelAddBtn");
const exportBtn = document.getElementById("exportBtn");

let currentUser = null;
let currentAdminName = "Administrador"; // Nome padrão

// Verificar sessão ao carregar
async function checkSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadAdminName();
    showDashboard();
  } else {
    showLogin();
  }
}

// Carregar nome do admin
async function loadAdminName() {
  try {
    const { data, error } = await supabase
      .from("funcionarios")
      .select("nome")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (data && data.nome) {
      currentAdminName = data.nome;
    }
  } catch (error) {
    console.log("Usando nome padrão de admin");
  }
}

// Mostrar login
function showLogin() {
  loginSection.style.display = "block";
  dashboardSection.style.display = "none";
}

// Mostrar dashboard
function showDashboard() {
  loginSection.style.display = "none";
  dashboardSection.style.display = "block";
  loadDashboardData();
}

// Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("adminEmail").value;
  const password = document.getElementById("adminPassword").value;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    currentUser = data.user;
    await loadAdminName();
    showMessage(loginMessage, "Login realizado com sucesso!", "success");

    setTimeout(() => {
      showDashboard();
    }, 1000);
  } catch (error) {
    console.error("Erro no login:", error);
    showMessage(loginMessage, "Email ou senha incorretos!", "error");
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  currentUser = null;
  showLogin();
});

// ==================== CONTROLE DE ABAS ====================
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabName = btn.getAttribute("data-tab");

    // Remover active de todos os botões e conteúdos
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.remove("active"));

    // Adicionar active no botão e conteúdo clicado
    btn.classList.add("active");
    document.getElementById(`tab-${tabName}`).classList.add("active");
  });
});

// Carregar dados do dashboard
async function loadDashboardData() {
  showLoading("Carregando dados...");
  try {
    await loadFuncionarios();
    await loadRegistros();
    await loadPagamentos();
    await updateStats();
  } finally {
    hideLoading();
  }
}

// Carregar funcionários
async function loadFuncionarios() {
  try {
    const { data, error } = await supabase
      .from("funcionarios")
      .select("*")
      .eq("ativo", true)
      .order("nome");

    if (error) throw error;

    // Preencher filtro
    filterFuncionario.innerHTML = '<option value="">Todos</option>';
    filterPagamentoFunc.innerHTML = '<option value="">Todos</option>';
    data.forEach((func) => {
      const option = document.createElement("option");
      option.value = func.id;
      option.textContent = func.nome;
      filterFuncionario.appendChild(option);

      const optionPagamento = document.createElement("option");
      optionPagamento.value = func.id;
      optionPagamento.textContent = func.nome;
      filterPagamentoFunc.appendChild(optionPagamento);
    });

    // Preencher tabela de funcionários
    funcionariosTableBody.innerHTML = "";
    data.forEach((func) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td data-label="Nome"><strong>${func.nome}</strong></td>
                <td data-label="Status">
                    <span class="status-badge ${
                      func.ativo ? "ativo" : "inativo"
                    }">
                        ${func.ativo ? "Ativo" : "Inativo"}
                    </span>
                </td>
                <td data-label="Valor/Hora">
                    <input type="number" 
                           value="${func.valor_hora || 0}" 
                           step="0.01" 
                           min="0"
                           onchange="updateValorHora('${func.id}', this.value)"
                           style="width: 100px; padding: 6px; background: var(--card-hover); color: var(--text-light); border: 1px solid var(--border-dark); border-radius: 6px;"
                    />
                </td>
                <td data-label="Ações">
                    <button class="btn btn-small ${
                      func.ativo ? "btn-danger" : "btn-success"
                    }" 
                            onclick="toggleFuncionarioStatus('${func.id}', ${
                              func.ativo
                            })">
                        ${func.ativo ? "Desativar" : "Ativar"}
                    </button>
                    <button class="btn btn-small btn-delete" 
                            onclick="deleteFuncionario('${func.id}', '${
                              func.nome
                            }')">
                        🗑️ Excluir
                    </button>
                </td>
            `;
      funcionariosTableBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar funcionários:", error);
  }
}

// Carregar registros
async function loadRegistros(filtros = {}) {
  showLoading("Carregando registros...");
  try {
    let query = supabase
      .from("registros_ponto")
      .select("*, funcionarios(nome, valor_hora)")
      .order("data", { ascending: false })
      .order("entrada", { ascending: false });

    if (filtros.funcionarioId) {
      query = query.eq("funcionario_id", filtros.funcionarioId);
    }

    if (filtros.dataInicio) {
      query = query.gte("data", filtros.dataInicio);
    }

    if (filtros.dataFim) {
      query = query.lte("data", filtros.dataFim);
    }

    // Filtro de status de pagamento
    if (filtros.statusPagamento === "pago") {
      query = query.eq("pago", true);
    } else if (filtros.statusPagamento === "nao_pago") {
      query = query.eq("pago", false);
    }

    const { data, error } = await query;

    if (error) throw error;

    registrosTableBody.innerHTML = "";

    if (data.length === 0) {
      registrosTableBody.innerHTML =
        '<tr><td colspan="6" style="text-align: center;">Nenhum registro encontrado</td></tr>';
      return;
    }

    data.forEach((registro) => {
      const tr = document.createElement("tr");

      const dataFormatada = new Date(
        registro.data + "T00:00:00",
      ).toLocaleDateString("pt-BR");
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

      const totalHoras = registro.total_horas
        ? `${Math.floor(registro.total_horas)}h ${Math.round(
            (registro.total_horas - Math.floor(registro.total_horas)) * 60,
          )}min`
        : "--";

      const valorHora = parseFloat(registro.funcionarios?.valor_hora || 0);
      const horas = parseFloat(registro.total_horas || 0);
      const valorReceber =
        horas > 0 && valorHora > 0
          ? `R$ ${(horas * valorHora).toFixed(2)}`
          : "--";

      const status = registro.saida ? "completo" : "incompleto";
      const statusText = registro.saida ? "Completo" : "Em aberto";

      const pagoStatus = registro.pago ? "pago" : "nao-pago";
      const pagoText = registro.pago ? "✅ Pago" : "⏳ Pendente";
      const btnPagoText = registro.pago
        ? "Marcar como Não Pago"
        : "✅ Marcar como Pago";
      const btnPagoClass = registro.pago ? "btn-secondary" : "btn-success";

      // Indicador de edição
      const editadoIndicador = registro.editado
        ? `<span style="color: var(--warning); font-size: 0.85em;" title="Editado por ${
            registro.editado_por
          } em ${new Date(registro.editado_em).toLocaleString(
            "pt-BR",
          )}">✏️</span>`
        : "";

      tr.innerHTML = `
                <td data-label="Funcionário"><strong>${registro.funcionarios.nome}</strong></td>
                <td data-label="Data">${dataFormatada} ${editadoIndicador}</td>
                <td data-label="Entrada">${entradaFormatada}</td>
                <td data-label="Saída">${saidaFormatada}</td>
                <td data-label="Total"><strong>${totalHoras}</strong></td>
                <td data-label="Valor"><strong style="color: var(--success);">${valorReceber}</strong></td>
                <td data-label="Status"><span class="status-badge ${status}">${statusText}</span></td>
                <td data-label="Ações">
                  <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                    <button class="btn btn-small btn-warning btn-editar-entrada" title="Editar entrada">✏️ Entrada</button>
                    <button class="btn btn-small btn-warning btn-editar-saida" title="Editar saída">✏️ Saída</button>
                    <button class="btn btn-small btn-secondary btn-historico" title="Ver histórico">📋 Histórico</button>
                  </div>
                </td>
            `;

      console.log("✅ Botões criados para registro:", registro.id);

      // Armazenar dados completos do registro no elemento
      tr.dataset.registro = JSON.stringify(registro);

      registrosTableBody.appendChild(tr);
    });

    // Adicionar event listeners para edição de entrada
    document.querySelectorAll(".btn-editar-entrada").forEach((btn) => {
      btn.onclick = function () {
        const tr = this.closest("tr");
        const registro = JSON.parse(tr.dataset.registro);

        mostrarModalEdicao(registro, "entrada", currentAdminName, () => {
          loadRegistros();
          updateStats();
        });
      };
    });

    // Adicionar event listeners para edição de saída
    document.querySelectorAll(".btn-editar-saida").forEach((btn) => {
      btn.onclick = function () {
        const tr = this.closest("tr");
        const registro = JSON.parse(tr.dataset.registro);

        mostrarModalEdicao(registro, "saida", currentAdminName, () => {
          loadRegistros();
          updateStats();
        });
      };
    });

    // Adicionar event listeners para histórico
    document.querySelectorAll(".btn-historico").forEach((btn) => {
      btn.onclick = function () {
        const tr = this.closest("tr");
        const registro = JSON.parse(tr.dataset.registro);
        mostrarHistorico(registro.id, registro.funcionarios.nome);
      };
    });
  } catch (error) {
    console.error("Erro ao carregar registros:", error);
  } finally {
    hideLoading();
  }
}

// Atualizar estatísticas
async function updateStats(filtros = {}) {
  try {
    // Construir query com filtros
    let query = supabase
      .from("registros_ponto")
      .select("total_horas, funcionarios(valor_hora)", { count: "exact" })
      .not("total_horas", "is", null);

    // Aplicar filtros se existirem
    if (filtros.funcionarioId) {
      query = query.eq("funcionario_id", filtros.funcionarioId);
    }
    if (filtros.dataInicio) {
      query = query.gte("data", filtros.dataInicio);
    }
    if (filtros.dataFim) {
      query = query.lte("data", filtros.dataFim);
    }

    const { data: registros, count: totalRegistros } = await query;

    totalRegistrosEl.textContent = totalRegistros || 0;

    // Total de horas
    const totalHoras =
      registros?.reduce((sum, r) => sum + parseFloat(r.total_horas || 0), 0) ||
      0;
    totalHorasEl.textContent = `${Math.floor(totalHoras)}h`;

    // Calcular total a pagar
    const totalPagar =
      registros?.reduce((sum, r) => {
        const horas = parseFloat(r.total_horas || 0);
        const valorHora = parseFloat(r.funcionarios?.valor_hora || 0);
        return sum + horas * valorHora;
      }, 0) || 0;

    const totalPagarEl = document.getElementById("totalPagar");
    if (totalPagarEl) {
      totalPagarEl.textContent = `R$ ${totalPagar.toFixed(2)}`;
    }

    // Funcionários ativos
    const { count: funcionariosAtivos } = await supabase
      .from("funcionarios")
      .select("*", { count: "exact", head: true })
      .eq("ativo", true);

    funcionariosAtivosEl.textContent = funcionariosAtivos || 0;
  } catch (error) {
    console.error("Erro ao atualizar stats:", error);
  }
}

// Aplicar filtros
applyFiltersBtn.addEventListener("click", async () => {
  const statusPagamento =
    document.getElementById("filterPagamento")?.value || null;
  const filtros = {
    funcionarioId: filterFuncionario.value || null,
    dataInicio: filterDataInicio.value || null,
    dataFim: filterDataFim.value || null,
    statusPagamento: statusPagamento,
  };
  await loadRegistros(filtros);
  await updateStats(filtros);
});

// Aplicar filtros de pagamento
applyPagamentoFiltersBtn.addEventListener("click", () => {
  const filtros = {
    funcionarioId: filterPagamentoFunc.value || null,
    periodo: filterPagamentoPeriodo.value || null,
    status: filterPagamentoStatus.value || null,
  };
  loadPagamentos(filtros);
});

// Marcar/desmarcar pagamento
window.togglePagamento = async (registroId, statusAtual) => {
  try {
    const novoPago = !statusAtual;
    const agora = new Date().toISOString();

    const { error } = await supabase
      .from("registros_ponto")
      .update({
        pago: novoPago,
        data_pagamento: novoPago ? agora : null,
      })
      .eq("id", registroId);

    if (error) throw error;

    // Recarregar dados
    await loadPagamentos();
    await loadRegistros();
    await updateStats();
  } catch (error) {
    console.error("Erro ao atualizar pagamento:", error);
    alert("❌ Erro ao atualizar status de pagamento");
  }
};

// Atualizar valor/hora do funcionário
window.updateValorHora = async (funcionarioId, valorHora) => {
  try {
    const valor = parseFloat(valorHora);
    if (isNaN(valor) || valor < 0) {
      alert("❌ Valor inválido!");
      await loadFuncionarios();
      return;
    }

    const { error } = await supabase
      .from("funcionarios")
      .update({ valor_hora: valor })
      .eq("id", funcionarioId);

    if (error) throw error;

    await loadRegistros();
    await updateStats();
  } catch (error) {
    console.error("Erro ao atualizar valor/hora:", error);
    alert("❌ Erro ao atualizar valor/hora");
  }
};

// Toggle status do funcionário
window.toggleFuncionarioStatus = async (funcionarioId, statusAtual) => {
  try {
    const { error } = await supabase
      .from("funcionarios")
      .update({ ativo: !statusAtual })
      .eq("id", funcionarioId);

    if (error) throw error;

    await loadFuncionarios();
    await updateStats();
  } catch (error) {
    console.error("Erro ao atualizar funcionário:", error);
    alert("Erro ao atualizar funcionário");
  }
};

// Excluir funcionário
window.deleteFuncionario = async (funcionarioId, nome) => {
  if (
    !confirm(
      `⚠️ Deseja realmente excluir o funcionário "${nome}"?\n\nO funcionário será desativado e não poderá mais registrar ponto.`,
    )
  ) {
    return;
  }

  try {
    // Soft delete - apenas desativa ao invés de excluir
    const { error } = await supabase
      .from("funcionarios")
      .update({ ativo: false })
      .eq("id", funcionarioId);

    if (error) throw error;

    alert("✅ Funcionário desativado com sucesso!");
    await loadFuncionarios();
    await updateStats();
    await loadRegistros();
  } catch (error) {
    console.error("Erro ao excluir funcionário:", error);
    alert("❌ Erro ao desativar funcionário: " + error.message);
  }
};

// Carregar pagamentos agrupados por funcionário
async function loadPagamentos(filtros = {}) {
  showLoading("Carregando pagamentos...");
  try {
    let query = supabase
      .from("registros_ponto")
      .select(
        `
        *,
        funcionarios (id, nome, valor_hora)
      `,
      )
      .not("saida", "is", null)
      .order("data", { ascending: false });

    // Aplicar filtro de funcionário
    if (filtros.funcionarioId) {
      query = query.eq("funcionario_id", filtros.funcionarioId);
    }

    // Aplicar filtro de período
    if (filtros.periodo) {
      const hoje = new Date();
      let dataInicio;

      if (filtros.periodo === "mes_atual") {
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      } else if (filtros.periodo === "mes_anterior") {
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        query = query.lte("data", dataFim.toISOString().split("T")[0]);
      } else if (filtros.periodo === "7dias") {
        dataInicio = new Date(hoje);
        dataInicio.setDate(dataInicio.getDate() - 7);
      } else if (filtros.periodo === "30dias") {
        dataInicio = new Date(hoje);
        dataInicio.setDate(dataInicio.getDate() - 30);
      }

      if (dataInicio) {
        query = query.gte("data", dataInicio.toISOString().split("T")[0]);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filtrar por status de pagamento se necessário
    let registrosFiltrados = data;
    if (filtros.status === "pendente") {
      registrosFiltrados = data.filter((r) => !r.pago);
    } else if (filtros.status === "pago") {
      registrosFiltrados = data.filter((r) => r.pago);
    }

    // Agrupar registros por funcionário
    const registrosPorFuncionario = {};
    registrosFiltrados.forEach((registro) => {
      const funcId = registro.funcionarios.id;
      if (!registrosPorFuncionario[funcId]) {
        registrosPorFuncionario[funcId] = {
          funcionario: registro.funcionarios,
          registros: [],
          totalHoras: 0,
          totalPagar: 0,
          totalPendente: 0,
        };
      }

      const horas = parseFloat(registro.total_horas || 0);
      const valorHora = parseFloat(registro.funcionarios.valor_hora || 0);
      const valorReceber = horas * valorHora;

      registrosPorFuncionario[funcId].registros.push(registro);
      registrosPorFuncionario[funcId].totalHoras += horas;
      registrosPorFuncionario[funcId].totalPagar += valorReceber;

      if (!registro.pago) {
        registrosPorFuncionario[funcId].totalPendente += valorReceber;
      }
    });

    // Renderizar interface de pagamentos
    const pagamentosContainer = document.getElementById("pagamentosContainer");
    pagamentosContainer.innerHTML = "";

    if (Object.keys(registrosPorFuncionario).length === 0) {
      pagamentosContainer.innerHTML =
        '<p style="text-align: center; color: var(--text-muted);">Nenhum registro encontrado</p>';
      return;
    }

    Object.values(registrosPorFuncionario).forEach((grupo) => {
      const funcionarioCard = document.createElement("div");
      funcionarioCard.className = "funcionario-pagamento-card";

      const registrosPendentes = grupo.registros.filter((r) => !r.pago);
      const registrosPagos = grupo.registros.filter((r) => r.pago);

      funcionarioCard.innerHTML = `
        <div class="funcionario-pagamento-header" onclick="toggleFuncionarioPagamento('${
          grupo.funcionario.id
        }')">
          <div>
            <h3>${grupo.funcionario.nome}</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">
              ${
                grupo.registros.length
              } registro(s) • ${grupo.totalHoras.toFixed(1)}h trabalhadas
            </p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.2rem; color: var(--success); font-weight: 600;">
              R$ ${grupo.totalPagar.toFixed(2)}
            </div>
            <div style="font-size: 0.9rem; color: var(--warning); margin-top: 4px;">
              ${
                registrosPendentes.length > 0
                  ? `⏳ R$ ${grupo.totalPendente.toFixed(2)} pendente`
                  : "✅ Tudo pago"
              }
            </div>
          </div>
        </div>
        <div class="funcionario-pagamento-body" id="pagamento-body-${
          grupo.funcionario.id
        }" style="display: none;">
          ${
            registrosPendentes.length > 0
              ? `
            <div class="pagamento-section">
              <h4 style="color: var(--warning); margin-bottom: 12px;">⏳ Pendentes (${
                registrosPendentes.length
              })</h4>
              ${registrosPendentes
                .map((r) => renderRegistroPagamento(r, grupo.funcionario))
                .join("")}
            </div>
          `
              : ""
          }
          ${
            registrosPagos.length > 0
              ? `
            <div class="pagamento-section">
              <h4 style="color: var(--success); margin-bottom: 12px;">✅ Pagos (${
                registrosPagos.length
              })</h4>
              ${registrosPagos
                .map((r) => renderRegistroPagamento(r, grupo.funcionario))
                .join("")}
            </div>
          `
              : ""
          }
        </div>
      `;

      pagamentosContainer.appendChild(funcionarioCard);
    });
  } catch (error) {
    console.error("Erro ao carregar pagamentos:", error);
  } finally {
    hideLoading();
  }
}

// Renderizar um registro de pagamento
function renderRegistroPagamento(registro, funcionario) {
  const dataFormatada = new Date(
    registro.data + "T00:00:00",
  ).toLocaleDateString("pt-BR");
  const horas = parseFloat(registro.total_horas || 0);
  const valorHora = parseFloat(funcionario.valor_hora || 0);
  const valorReceber = horas * valorHora;

  const dataPagamento = registro.data_pagamento
    ? new Date(registro.data_pagamento).toLocaleDateString("pt-BR")
    : "";

  return `
    <div class="registro-pagamento-item ${registro.pago ? "pago" : ""}">
      <div class="registro-pagamento-info">
        <div>
          <strong>${dataFormatada}</strong>
          <span style="color: var(--text-muted); margin-left: 8px;">
            ${horas.toFixed(1)}h × R$ ${valorHora.toFixed(2)}/h
          </span>
        </div>
        <div style="color: var(--success); font-weight: 600; font-size: 1.1rem;">
          R$ ${valorReceber.toFixed(2)}
        </div>
      </div>
      <div class="registro-pagamento-actions">
        ${
          registro.pago
            ? `
          <span class="status-badge pago" style="margin-right: 8px;">✅ Pago em ${dataPagamento}</span>
          <button class="btn btn-small btn-secondary" onclick="togglePagamento('${registro.id}', true)">
            Marcar como Não Pago
          </button>
        `
            : `
          <button class="btn btn-small btn-success" onclick="togglePagamento('${registro.id}', false)">
            ✅ Marcar como Pago
          </button>
        `
        }
      </div>
    </div>
  `;
}

// Toggle expansão do funcionário
window.toggleFuncionarioPagamento = (funcionarioId) => {
  const body = document.getElementById(`pagamento-body-${funcionarioId}`);
  if (body.style.display === "none") {
    body.style.display = "block";
  } else {
    body.style.display = "none";
  }
};

// Adicionar funcionário
addFuncionarioBtn.addEventListener("click", () => {
  addFuncionarioForm.style.display = "block";
});

cancelAddBtn.addEventListener("click", () => {
  addFuncionarioForm.style.display = "none";
  novoFuncionarioForm.reset();
});

novoFuncionarioForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("novoNome").value;
  const pin = document.getElementById("novoPin").value;
  const valorHora = parseFloat(document.getElementById("novoValorHora").value);

  if (isNaN(valorHora) || valorHora < 0) {
    alert("❌ Valor/hora inválido!");
    return;
  }

  try {
    const { error } = await supabase.from("funcionarios").insert([
      {
        nome,
        pin,
        valor_hora: valorHora,
        role: "funcionario",
        ativo: true,
      },
    ]);

    if (error) throw error;

    alert("✅ Funcionário adicionado com sucesso!");
    addFuncionarioForm.style.display = "none";
    novoFuncionarioForm.reset();
    await loadFuncionarios();
    await updateStats();
  } catch (error) {
    console.error("Erro ao adicionar funcionário:", error);
    alert("❌ Erro ao adicionar funcionário");
  }
});

// Exportar para Excel
exportBtn.addEventListener("click", async () => {
  showLoading("Gerando relatório...");
  try {
    const { data, error } = await supabase
      .from("registros_ponto")
      .select("*, funcionarios(nome, valor_hora)")
      .order("data", { ascending: false });

    if (error) throw error;

    // Criar CSV
    let csv =
      "Funcionário,Data,Entrada,Saída,Total de Horas,Valor a Receber,Status\n";

    data.forEach((registro) => {
      const dataFormatada = new Date(
        registro.data + "T00:00:00",
      ).toLocaleDateString("pt-BR");
      const entradaFormatada = registro.entrada
        ? new Date(registro.entrada).toLocaleTimeString("pt-BR")
        : "";
      const saidaFormatada = registro.saida
        ? new Date(registro.saida).toLocaleTimeString("pt-BR")
        : "";
      const totalHoras = registro.total_horas || "";
      const valorReceber =
        registro.total_horas && registro.funcionarios.valor_hora
          ? (registro.total_horas * registro.funcionarios.valor_hora).toFixed(2)
          : "";
      const status = registro.saida ? "Completo" : "Em aberto";

      csv += `"${registro.funcionarios.nome}","${dataFormatada}","${entradaFormatada}","${saidaFormatada}","${totalHoras}","R$ ${valorReceber}","${status}"\n`;
    });

    // Download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `registros_ponto_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  } catch (error) {
    console.error("Erro ao exportar:", error);
    alert("Erro ao exportar dados");
  } finally {
    hideLoading();
  }
});

// ============================================
// GERAR PDF - FOLHA DE PAGAMENTO
// ============================================
document.getElementById("gerarPdfBtn").addEventListener("click", async () => {
  showLoading("Gerando PDF...");
  try {
    // Pegar filtros atuais
    const funcionarioId = filterFuncionario.value || null;
    const dataInicio = filterDataInicio.value || null;
    const dataFim = filterDataFim.value || null;

    // Buscar dados filtrados
    let query = supabase
      .from("registros_ponto")
      .select("*, funcionarios(nome, valor_hora)")
      .not("saida", "is", null)
      .order("data", { ascending: false });

    if (funcionarioId) {
      query = query.eq("funcionario_id", funcionarioId);
    }
    if (dataInicio) {
      query = query.gte("data", dataInicio);
    }
    if (dataFim) {
      query = query.lte("data", dataFim);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      alert("⚠️ Nenhum registro encontrado com os filtros aplicados!");
      return;
    }

    // Gerar PDF
    gerarPDFFolhaPagamento(data, {
      funcionarioId,
      dataInicio,
      dataFim,
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    alert("❌ Erro ao gerar PDF");
  }
});

/**
 * Gerar PDF da folha de pagamento
 */
function gerarPDFFolhaPagamento(registros, filtros) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Configurações
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 20;

  // ========== CABEÇALHO ==========
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DE PAGAMENTO", pageWidth / 2, yPos, { align: "center" });

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Informações do relatório
  const hoje = new Date().toLocaleDateString("pt-BR");
  doc.text(`Data de emissão: ${hoje}`, 14, yPos);

  yPos += 6;

  // Mostrar filtros aplicados
  if (filtros.funcionarioId) {
    const funcionarioNome = registros[0]?.funcionarios?.nome || "N/A";
    doc.text(`Funcionário: ${funcionarioNome}`, 14, yPos);
    yPos += 6;
  } else {
    doc.text(`Funcionário: Todos`, 14, yPos);
    yPos += 6;
  }

  if (filtros.dataInicio || filtros.dataFim) {
    const inicio = filtros.dataInicio
      ? new Date(filtros.dataInicio + "T00:00:00").toLocaleDateString("pt-BR")
      : "Início";
    const fim = filtros.dataFim
      ? new Date(filtros.dataFim + "T00:00:00").toLocaleDateString("pt-BR")
      : "Hoje";
    doc.text(`Período: ${inicio} a ${fim}`, 14, yPos);
    yPos += 6;
  }

  yPos += 5;

  // ========== VERIFICAR SE É UM FUNCIONÁRIO OU TODOS ==========
  if (filtros.funcionarioId) {
    // ========== UM FUNCIONÁRIO ESPECÍFICO ==========
    const tableData = registros.map((r) => {
      const data = new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR");
      const entrada = r.entrada
        ? new Date(r.entrada).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--";
      const saida = r.saida
        ? new Date(r.saida).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--";
      const horas = r.total_horas ? r.total_horas.toFixed(2) : "0.00";
      const valorHora = parseFloat(r.funcionarios?.valor_hora || 0);
      const valor = (parseFloat(horas) * valorHora).toFixed(2);

      return [data, entrada, saida, `${horas}h`, `R$ ${valor}`];
    });

    doc.autoTable({
      head: [["Data", "Entrada", "Saída", "Horas", "Valor"]],
      body: tableData,
      startY: yPos,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: 50,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 30 }, // Data
        1: { cellWidth: 25, halign: "center" }, // Entrada
        2: { cellWidth: 25, halign: "center" }, // Saída
        3: { cellWidth: 25, halign: "center" }, // Horas
        4: { cellWidth: 40, halign: "right" }, // Valor
      },
    });

    // Totalizadores do funcionário
    const finalY = doc.lastAutoTable.finalY;
    yPos = finalY + 10;

    const totalHoras = registros.reduce(
      (sum, r) => sum + parseFloat(r.total_horas || 0),
      0,
    );
    const totalValor = registros.reduce((sum, r) => {
      const horas = parseFloat(r.total_horas || 0);
      const valorHora = parseFloat(r.funcionarios?.valor_hora || 0);
      return sum + horas * valorHora;
    }, 0);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setLineWidth(0.5);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 8;

    doc.setTextColor(0, 0, 0);
    doc.text("TOTAIS:", 14, yPos);
    doc.text(`Total de Horas:`, 100, yPos);
    doc.text(`${totalHoras.toFixed(2)}h`, 140, yPos);

    yPos += 8;
    doc.setFontSize(13);
    doc.setTextColor(0, 128, 0);
    doc.text("Total a Pagar:", 100, yPos);
    doc.text(`R$ ${totalValor.toFixed(2)}`, 140, yPos);
  } else {
    // ========== TODOS OS FUNCIONÁRIOS - AGRUPADO ==========

    // Agrupar registros por funcionário
    const registrosPorFuncionario = {};
    registros.forEach((r) => {
      const funcNome = r.funcionarios.nome;
      if (!registrosPorFuncionario[funcNome]) {
        registrosPorFuncionario[funcNome] = {
          nome: funcNome,
          valorHora: r.funcionarios.valor_hora,
          registros: [],
        };
      }
      registrosPorFuncionario[funcNome].registros.push(r);
    });

    // Ordenar funcionários por nome
    const funcionariosOrdenados = Object.keys(registrosPorFuncionario).sort();

    // Totais gerais
    let totalGeralHoras = 0;
    let totalGeralValor = 0;

    // Gerar tabela para cada funcionário
    funcionariosOrdenados.forEach((nomeFuncionario, index) => {
      const grupo = registrosPorFuncionario[nomeFuncionario];

      // Verificar se precisa de nova página
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      // Nome do funcionário
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(41, 128, 185);
      doc.text(`${nomeFuncionario}`, 14, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 2;

      // Tabela do funcionário
      const tableData = grupo.registros.map((r) => {
        const data = new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR");
        const entrada = r.entrada
          ? new Date(r.entrada).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "--:--";
        const saida = r.saida
          ? new Date(r.saida).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "--:--";
        const horas = r.total_horas ? r.total_horas.toFixed(2) : "0.00";
        const valorHora = parseFloat(r.funcionarios?.valor_hora || 0);
        const valor = (parseFloat(horas) * valorHora).toFixed(2);

        return [data, entrada, saida, `${horas}h`, `R$ ${valor}`];
      });

      doc.autoTable({
        head: [["Data", "Entrada", "Saída", "Horas", "Valor"]],
        body: tableData,
        startY: yPos,
        theme: "grid",
        headStyles: {
          fillColor: [52, 152, 219],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: 50,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25, halign: "center" },
          2: { cellWidth: 25, halign: "center" },
          3: { cellWidth: 25, halign: "center" },
          4: { cellWidth: 40, halign: "right" },
        },
      });

      // Calcular totais do funcionário
      const totalHorasFuncionario = grupo.registros.reduce(
        (sum, r) => sum + parseFloat(r.total_horas || 0),
        0,
      );
      const totalValorFuncionario = grupo.registros.reduce((sum, r) => {
        const horas = parseFloat(r.total_horas || 0);
        const valorHora = parseFloat(r.funcionarios?.valor_hora || 0);
        return sum + horas * valorHora;
      }, 0);

      totalGeralHoras += totalHorasFuncionario;
      totalGeralValor += totalValorFuncionario;

      // Subtotal do funcionário
      yPos = doc.lastAutoTable.finalY + 5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`Subtotal ${nomeFuncionario}:`, 90, yPos);
      doc.text(`${totalHorasFuncionario.toFixed(2)}h`, 130, yPos);
      doc.setTextColor(0, 128, 0);
      doc.text(`R$ ${totalValorFuncionario.toFixed(2)}`, 155, yPos);
      doc.setTextColor(0, 0, 0);

      yPos += 10;
    });

    // ========== TOTAIS GERAIS ==========
    // Verificar se precisa de nova página para totais
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setLineWidth(0.8);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 8;

    doc.setTextColor(0, 0, 0);
    doc.text("TOTAIS GERAIS:", 14, yPos);
    doc.text(`Total de Horas:`, 100, yPos);
    doc.text(`${totalGeralHoras.toFixed(2)}h`, 140, yPos);

    yPos += 8;
    doc.setFontSize(14);
    doc.setTextColor(0, 128, 0);
    doc.text("Total a Pagar:", 100, yPos);
    doc.text(`R$ ${totalGeralValor.toFixed(2)}`, 140, yPos);
  }

  // ========== RODAPÉ ==========
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "italic");
  const rodape = `Relatório gerado em ${new Date().toLocaleString("pt-BR")} - Sistema VTek`;
  doc.text(rodape, pageWidth / 2, doc.internal.pageSize.height - 10, {
    align: "center",
  });

  // ========== DOWNLOAD ==========
  const nomeArquivo = filtros.funcionarioId
    ? `relatorio_pagamento_${registros[0]?.funcionarios?.nome.replace(/\s+/g, "_")}_${hoje.replace(/\//g, "-")}.pdf`
    : `relatorio_pagamento_geral_${hoje.replace(/\//g, "-")}.pdf`;

  doc.save(nomeArquivo);

  alert("✅ PDF gerado com sucesso!");
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    alert("❌ Erro ao gerar PDF: " + error.message);
  } finally {
    hideLoading();
  }
});

// Mostrar mensagem
function showMessage(element, text, type) {
  element.textContent = text;
  element.className = `message ${type}`;

  setTimeout(() => {
    element.className = "message";
    element.textContent = "";
  }, 3000);
}

// Inicializar
checkSession();
