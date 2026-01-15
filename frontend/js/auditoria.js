/**
 * Auditoria.js - Sistema de Auditoria e Edição de Registros
 * Registra todas as alterações feitas pelos administradores
 */

import { supabase } from "./config.js";

/**
 * Registrar alteração no histórico
 */
export async function registrarAlteracao(params) {
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
      p_tabela: tabela,
      p_registro_id: registroId,
      p_funcionario_id: funcionarioId,
      p_admin_nome: adminNome,
      p_campo_alterado: campoAlterado,
      p_valor_anterior: valorAnterior,
      p_valor_novo: valorNovo,
      p_motivo: motivo,
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
export async function obterHistorico(tabela, registroId) {
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
export async function editarHorario(params) {
  const {
    registroId,
    funcionarioId,
    adminNome,
    campoAlterado, // 'entrada' ou 'saida'
    novoValor,
    valorAnterior,
    motivo,
  } = params;

  try {
    // 1. Atualizar o registro
    const updateData = {};
    updateData[campoAlterado] = novoValor;
    updateData.editado = true;
    updateData.editado_em = new Date().toISOString();
    updateData.editado_por = adminNome;

    // Se mudou entrada ou saída, recalcular total_horas
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

    // 2. Registrar no histórico de auditoria
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

    return { success: true };
  } catch (error) {
    console.error("❌ Erro ao editar horário:", error);
    throw error;
  }
}

/**
 * Mostrar modal de edição de horário
 */
export function mostrarModalEdicao(registro, campo, adminNome, onSave) {
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

  // Criar modal
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
    <div style="background: var(--card); padding: 24px; border-radius: 12px; max-width: 500px; width: 90%;">
      <h3 style="margin-top: 0; color: var(--warning);">✏️ Editar ${campoLabel}</h3>
      
      <p><strong>Funcionário:</strong> ${
        registro.funcionarios?.nome || "N/A"
      }</p>
      <p><strong>Data:</strong> ${new Date(
        registro.data + "T00:00:00"
      ).toLocaleDateString("pt-BR")}</p>
      <p><strong>Valor atual:</strong> ${valorAtual}</p>
      
      <div style="margin: 20px 0;">
        <label style="display: block; margin-bottom: 8px;"><strong>Novo horário:</strong></label>
        <input 
          type="datetime-local" 
          id="novoHorario" 
          style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-dark); color: var(--text);"
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
          style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-dark); color: var(--text); min-height: 80px;"
        ></textarea>
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="btnCancelar" style="padding: 10px 20px; background: var(--bg-secondary); border: none; border-radius: 6px; cursor: pointer; color: var(--text);">
          Cancelar
        </button>
        <button id="btnSalvar" style="padding: 10px 20px; background: var(--warning); border: none; border-radius: 6px; cursor: pointer; color: var(--bg-dark); font-weight: bold;">
          💾 Salvar Alteração
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Eventos
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

      document.body.removeChild(modal);

      if (onSave) onSave();

      alert(
        `✅ ${campoLabel} atualizado com sucesso!\n\nAlteração registrada no histórico de auditoria.`
      );
    } catch (error) {
      alert("❌ Erro ao salvar alteração: " + error.message);
      const btnSalvar = modal.querySelector("#btnSalvar");
      btnSalvar.disabled = false;
      btnSalvar.textContent = "💾 Salvar Alteração";
    }
  };

  // Fechar ao clicar fora
  modal.onclick = (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  };
}

/**
 * Mostrar histórico de alterações de um registro
 */
export async function mostrarHistorico(registroId, funcionarioNome) {
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
      .map(
        (h) => `
      <div style="padding: 12px; background: var(--bg-dark); border-radius: 8px; margin-bottom: 12px; border-left: 3px solid var(--warning);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <strong>${h.admin_nome}</strong>
          <small style="opacity: 0.7;">${new Date(h.created_at).toLocaleString(
            "pt-BR"
          )}</small>
        </div>
        <div><strong>Campo:</strong> ${h.campo_alterado}</div>
        <div><strong>De:</strong> ${h.valor_anterior}</div>
        <div><strong>Para:</strong> ${h.valor_novo}</div>
        ${
          h.motivo
            ? `<div style="margin-top: 8px; padding: 8px; background: var(--bg-secondary); border-radius: 4px;"><em>"${h.motivo}"</em></div>`
            : ""
        }
      </div>
    `
      )
      .join("");
  }

  modal.innerHTML = `
    <div style="background: var(--card); padding: 24px; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
      <h3 style="margin-top: 0;">📋 Histórico de Alterações</h3>
      <p><strong>Funcionário:</strong> ${funcionarioNome}</p>
      <hr style="border: 1px solid var(--border); margin: 16px 0;">
      ${historicoHTML}
      <div style="text-align: right; margin-top: 20px;">
        <button id="btnFechar" style="padding: 10px 20px; background: var(--bg-secondary); border: none; border-radius: 6px; cursor: pointer; color: var(--text);">
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
