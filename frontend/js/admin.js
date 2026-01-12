/**
 * Admin.js - Painel Administrativo
 * Gerencia login, visualização de registros, relatórios e funcionários
 */

import { supabase } from "./config.js";

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

// Verificar sessão ao carregar
async function checkSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    showDashboard();
  } else {
    showLogin();
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

// Carregar dados do dashboard
async function loadDashboardData() {
  await loadFuncionarios();
  await loadRegistros();
  await updateStats();
}

// Carregar funcionários
async function loadFuncionarios() {
  try {
    const { data, error } = await supabase
      .from("funcionarios")
      .select("*")
      .order("nome");

    if (error) throw error;

    // Preencher filtro
    filterFuncionario.innerHTML = '<option value="">Todos</option>';
    data.forEach((func) => {
      const option = document.createElement("option");
      option.value = func.id;
      option.textContent = func.nome;
      filterFuncionario.appendChild(option);
    });

    // Preencher tabela de funcionários
    funcionariosTableBody.innerHTML = "";
    data.forEach((func) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td><strong>${func.nome}</strong></td>
                <td>
                    <span class="status-badge ${
                      func.ativo ? "ativo" : "inativo"
                    }">
                        ${func.ativo ? "Ativo" : "Inativo"}
                    </span>
                </td>
                <td>
                    <button class="btn btn-small ${
                      func.ativo ? "btn-danger" : "btn-success"
                    }" 
                            onclick="toggleFuncionarioStatus('${func.id}', ${
        func.ativo
      })">
                        ${func.ativo ? "Desativar" : "Ativar"}
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
  try {
    let query = supabase
      .from("registros_ponto")
      .select("*, funcionarios(nome)")
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
        registro.data + "T00:00:00"
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
            (registro.total_horas - Math.floor(registro.total_horas)) * 60
          )}min`
        : "--";

      const status = registro.saida ? "completo" : "incompleto";
      const statusText = registro.saida ? "Completo" : "Em aberto";

      tr.innerHTML = `
                <td><strong>${registro.funcionarios.nome}</strong></td>
                <td>${dataFormatada}</td>
                <td>${entradaFormatada}</td>
                <td>${saidaFormatada}</td>
                <td><strong>${totalHoras}</strong></td>
                <td><span class="status-badge ${status}">${statusText}</span></td>
            `;
      registrosTableBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar registros:", error);
  }
}

// Atualizar estatísticas
async function updateStats() {
  try {
    // Total de registros
    const { count: totalRegistros } = await supabase
      .from("registros_ponto")
      .select("*", { count: "exact", head: true });

    totalRegistrosEl.textContent = totalRegistros || 0;

    // Total de horas
    const { data: registros } = await supabase
      .from("registros_ponto")
      .select("total_horas")
      .not("total_horas", "is", null);

    const totalHoras =
      registros?.reduce((sum, r) => sum + parseFloat(r.total_horas || 0), 0) ||
      0;
    totalHorasEl.textContent = `${Math.floor(totalHoras)}h`;

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
applyFiltersBtn.addEventListener("click", () => {
  const filtros = {
    funcionarioId: filterFuncionario.value || null,
    dataInicio: filterDataInicio.value || null,
    dataFim: filterDataFim.value || null,
  };
  loadRegistros(filtros);
});

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

  try {
    const { error } = await supabase.from("funcionarios").insert([
      {
        nome,
        pin,
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
  try {
    const { data, error } = await supabase
      .from("registros_ponto")
      .select("*, funcionarios(nome)")
      .order("data", { ascending: false });

    if (error) throw error;

    // Criar CSV
    let csv = "Funcionário,Data,Entrada,Saída,Total de Horas,Status\n";

    data.forEach((registro) => {
      const dataFormatada = new Date(
        registro.data + "T00:00:00"
      ).toLocaleDateString("pt-BR");
      const entradaFormatada = registro.entrada
        ? new Date(registro.entrada).toLocaleTimeString("pt-BR")
        : "";
      const saidaFormatada = registro.saida
        ? new Date(registro.saida).toLocaleTimeString("pt-BR")
        : "";
      const totalHoras = registro.total_horas || "";
      const status = registro.saida ? "Completo" : "Em aberto";

      csv += `"${registro.funcionarios.nome}","${dataFormatada}","${entradaFormatada}","${saidaFormatada}","${totalHoras}","${status}"\n`;
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

// Definir datas padrão nos filtros (últimos 30 dias)
const hoje = new Date();
const trintaDiasAtras = new Date(hoje);
trintaDiasAtras.setDate(hoje.getDate() - 30);

filterDataInicio.valueAsDate = trintaDiasAtras;
filterDataFim.valueAsDate = hoje;

// Inicializar
checkSession();
