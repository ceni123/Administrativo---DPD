// commands/acao.js — Registro de ações com planilha mensal, Resumo e gráficos de pizza (tiro/fuga)
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const QuickChart = require("quickchart-js");

/* ========= Utilidades de data ========= */
function hojeBR() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// aceita "DD/MM/AAAA", "DD-MM-AAAA" ou "AAAA-MM-DD"
function parseDataFlex(input) {
  if (!input) return null;
  const txt = String(input).trim();

  // AAAA-MM-DD
  let m = txt.match(/^(\d{4})[-\/.](\d{2})[-\/.](\d{2})$/);
  if (m) return `${m[3].padStart(2, "0")}/${m[2].padStart(2, "0")}/${m[1]}`;

  // DD/MM/AAAA ou DD-MM-AAAA
  m = txt.match(/^(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})$/);
  if (m) return `${m[1]}/${m[2]}/${m[3]}`;

  return null;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const FILE_PATH = path.join(__dirname, "../acoes_dpd.xlsx");

/* ========= Helpers de planilha ========= */
function applyColumnWidths(ws) {
  // Larguras em 'caracteres' (wch) para cada coluna
  ws["!cols"] = [
    { wch: 12 }, // Data
    { wch: 28 }, // Autor (nome)
    { wch: 12 }, // Resultado
    { wch: 12 }, // Tipo
    { wch: 24 }, // Ação
    { wch: 40 }, // Oficiais
    { wch: 18 }, // Boletim
    { wch: 22 }, // Registrado em
  ];
}

function ensureWorkbook() {
  if (fs.existsSync(FILE_PATH)) {
    return XLSX.readFile(FILE_PATH);
  }
  return XLSX.utils.book_new();
}

function ensureMonthSheet(workbook, dateStrBR) {
  // extrai mês/ano da data BR (DD/MM/AAAA) — se falhar, usa mês atual
  let mesIndex, ano;
  const m = String(dateStrBR).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    mesIndex = parseInt(m[2], 10) - 1;
    ano = m[3];
  } else {
    const now = new Date();
    mesIndex = now.getMonth();
    ano = now.getFullYear();
  }
  const sheetName = `${MESES[mesIndex]} ${ano}`;

  if (!workbook.SheetNames.includes(sheetName)) {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Data", "Autor", "Resultado", "Tipo", "Ação", "Oficiais", "Boletim", "Registrado em"]
    ]);
    applyColumnWidths(ws);
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  }
  return sheetName;
}

function appendRow(workbook, sheetName, row) {
  const wsOld = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(wsOld, { header: 1, defval: "" });
  data.push(row);
  const wsNew = XLSX.utils.aoa_to_sheet(data);
  applyColumnWidths(wsNew); // garante largura após reescrita
  workbook.Sheets[sheetName] = wsNew;
}

function atualizarResumo(workbook) {
  const todas = [];
  for (const name of workbook.SheetNames) {
    if (name === "Resumo") continue;
    const ws = workbook.Sheets[name];
    if (!ws) continue;
    const linhas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    for (let i = 1; i < linhas.length; i++) {
      const l = linhas[i];
      if (!l || l.length < 8) continue;
      const [data, autor, resultado, tipo, acaoAlvo, oficiais, boletim, registradoEm] = l;
      todas.push({ data, autor, resultado, tipo, acaoAlvo, oficiais, boletim, registradoEm });
    }
  }

  // ranking por oficiais citados
  const mapa = {}; // { nome: { presencas, vitorias, derrotas } }
  for (const ac of todas) {
    let nomes = String(ac.oficiais).split(/[,;]\s*/).filter(Boolean);
    if (nomes.length === 0) {
      const fallback = String(ac.oficiais).split(/\s+/).filter(Boolean);
      if (fallback.length) nomes = fallback;
    }

    for (let nome of nomes) {
      nome = nome.trim();
      if (!nome) continue;
      if (!mapa[nome]) mapa[nome] = { presencas: 0, vitorias: 0, derrotas: 0 };
      mapa[nome].presencas++;
      const r = String(ac.resultado).toLowerCase();
      if (r.includes("vit")) mapa[nome].vitorias++;
      if (r.includes("der")) mapa[nome].derrotas++;
    }
  }

  const rows = [["Oficial", "Presenças", "Vitórias", "Derrotas"]];
  Object.entries(mapa)
    .sort((a, b) => b[1].presencas - a[1].presencas || b[1].vitorias - a[1].vitorias)
    .forEach(([nome, stats]) => {
      rows.push([nome, stats.presencas, stats.vitorias, stats.derrotas]);
    });

  const resumoWS = XLSX.utils.aoa_to_sheet(rows);
  resumoWS["!cols"] = [{ wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
  if (workbook.SheetNames.includes("Resumo")) {
    workbook.Sheets["Resumo"] = resumoWS;
  } else {
    XLSX.utils.book_append_sheet(workbook, resumoWS, "Resumo");
  }
}

/* ========= Estatísticas para gráficos ========= */
function coletarTodasAcoes(workbook) {
  const todas = [];
  for (const name of workbook.SheetNames) {
    if (name === "Resumo") continue;
    const ws = workbook.Sheets[name];
    if (!ws) continue;
    const linhas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    for (let i = 1; i < linhas.length; i++) {
      const l = linhas[i];
      if (!l || l.length < 8) continue;
      const [data, autor, resultado, tipo, acaoAlvo, oficiais, boletim, registradoEm] = l;
      todas.push({ data, autor, resultado, tipo, acaoAlvo, oficiais, boletim, registradoEm });
    }
  }
  return todas;
}

function computarPercentuaisPorTipo(acoes) {
  const base = {
    Tiroteio: { v: 0, e: 0, d: 0, total: 0 },
    Fuga: { v: 0, e: 0, d: 0, total: 0 },
  };

  for (const ac of acoes) {
    const tipo = String(ac.tipo);
    const r = String(ac.resultado).toLowerCase();
    const alvo = (tipo.includes("Tiro") ? "Tiroteio" : tipo.includes("Fuga") ? "Fuga" : null);
    if (!alvo) continue;

    base[alvo].total++;
    if (r.includes("vit")) base[alvo].v++;
    else if (r.includes("emp")) base[alvo].e++;
    else if (r.includes("der")) base[alvo].d++;
  }

  // retorna em porcentagens (0-100) com 1 casa decimal
  const pct = {};
  for (const k of Object.keys(base)) {
    const t = base[k].total || 1; // evita divisão por zero
    pct[k] = {
      v: +(base[k].v * 100 / t).toFixed(1),
      e: +(base[k].e * 100 / t).toFixed(1),
      d: +(base[k].d * 100 / t).toFixed(1),
      total: base[k].total
    };
  }
  return pct;
}

async function gerarChartPizzaURL(titulo, { v, e, d }) {
  const chart = new QuickChart();
  chart.setConfig({
    type: "pie",
    data: {
      labels: ["Vitória", "Empate", "Derrota"],
      datasets: [{
        data: [v, e, d]
      }]
    },
    options: {
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: titulo },
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}%` }
        }
      }
    }
  });
  return await chart.getShortUrl();
}

/* ========= Opções de "Ação/Alvo" ========= */
const ACAO_CHOICES = [
  { name: "Distribuidora", value: "Distribuidora" },
  { name: "Joalheria", value: "Joalheria" },
  { name: "Ammu Nation", value: "Ammu Nation" },
  { name: "Burger Shot", value: "Burger Shot" },
  { name: "Estação de Trem", value: "Estação de Trem" },
  { name: "Conveniência", value: "Conveniência" },
  { name: "Tatuagem", value: "Tatuagem" },
  { name: "Pier 45", value: "Pier 45" },
  { name: "Fleeca", value: "Fleeca" },
  { name: "Venda de Drogas", value: "Venda de Drogas" },
  { name: "Caixa eletrônico/Registradora", value: "Caixa eletrônico/Registradora" },
];

/* ========= Comando ========= */
module.exports = {
  data: new SlashCommandBuilder()
    .setName("acao") // <- sem acento
    .setDescription("Registra ação policial (resultado, tipo, alvo, oficiais, data, boletim) + planilha e gráficos.")
    // OBRIGATÓRIAS:
    .addUserOption(o =>
      o.setName("autor")
        .setDescription("Quem está registrando a ação (mencione com @)")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("resultado")
        .setDescription("Resultado da ação")
        .setRequired(true)
        .addChoices(
          { name: "Vitória 🟢", value: "Vitória" },
          { name: "Derrota 🔴", value: "Derrota" },
          { name: "Empate 🟡", value: "Empate" }
        )
    )
    .addStringOption(o =>
      o.setName("tipo")
        .setDescription("Tipo da ação")
        .setRequired(true)
        .addChoices(
          { name: "Fuga 🚔", value: "Fuga" },
          { name: "Tiroteio 🔫", value: "Tiroteio" }
        )
    )
    .addStringOption(o =>
      o.setName("acao_alvo")
        .setDescription("Qual foi a Ação/Alvo")
        .setRequired(true)
        .addChoices(...ACAO_CHOICES)
    )
    .addStringOption(o =>
      o.setName("oficiais")
        .setDescription("Oficiais presentes (use @menções ou nomes, separados por espaço/vírgula)")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("boletim")
        .setDescription("Número do boletim da prisão")
        .setRequired(true)
    )
    // OPCIONAL:
    .addStringOption(o =>
      o.setName("data")
        .setDescription("Data da ação (DD/MM/AAAA, DD-MM-AAAA ou AAAA-MM-DD). Vazio = hoje.")
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      // === Autor: salva NOME na planilha (displayName preferencial; fallback username) ===
      const autorUser = interaction.options.getUser("autor", true);
      const autorMember =
        interaction.guild.members.cache.get(autorUser.id) ||
        await interaction.guild.members.fetch(autorUser.id).catch(() => null);
      const autorNome = autorMember?.displayName ?? autorUser.username; // <- Nome para planilha
      const autorMencao = `<@${autorUser.id}>`; // <- Para embed no canal

      const resultado = interaction.options.getString("resultado", true);
      const tipo = interaction.options.getString("tipo", true);
      const acaoAlvo = interaction.options.getString("acao_alvo", true);
      const oficiais = interaction.options.getString("oficiais", true);
      const boletim = interaction.options.getString("boletim", true);
      const dataIn = interaction.options.getString("data") || "";
      const dataBR = parseDataFlex(dataIn) || hojeBR();
      const timestamp = new Date().toLocaleString("pt-BR");

      // ===== Embed público no canal =====
      const color =
        resultado === "Vitória" ? "#00C853" :
        resultado === "Derrota" ? "#E53935" :
        "#FBC02D";

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle("📋 Relatório de Ação Policial")
        .addFields(
          { name: "Autor do Comando", value: autorMencao, inline: true },
          { name: "Resultado", value: resultado, inline: true },
          { name: "Tipo", value: tipo, inline: true },
          { name: "Ação", value: acaoAlvo, inline: true },
          { name: "Data", value: dataBR, inline: true },
          { name: "Boletim", value: `\`${boletim}\``, inline: true },
          { name: "Oficiais Presentes", value: oficiais }
        )
        .setFooter({ text: `Registrado por ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.channel.send({ embeds: [embed] });

      // ===== Planilha (mensal + resumo) =====
      const wb = ensureWorkbook();
      const sheetName = ensureMonthSheet(wb, dataBR);

      // Grava NOME do autor (não o ID/menção) na planilha
      appendRow(wb, sheetName, [
        dataBR,            // Data
        autorNome,         // Autor (nome/apelido no servidor)
        resultado,         // Resultado
        tipo,              // Tipo
        acaoAlvo,          // Ação
        oficiais,          // Oficiais
        boletim,           // Boletim
        timestamp,         // Registrado em
      ]);

      atualizarResumo(wb);
      XLSX.writeFile(wb, FILE_PATH);

      // ===== Gráficos de pizza (porcentagens por tipo) =====
      const todas = coletarTodasAcoes(wb);
      const pct = computarPercentuaisPorTipo(todas);

      const urlTiro = await gerarChartPizzaURL(
        `Tiroteio — ${pct.Tiroteio.total} ações`,
        { v: pct.Tiroteio.v, e: pct.Tiroteio.e, d: pct.Tiroteio.d }
      );

      const urlFuga = await gerarChartPizzaURL(
        `Fuga — ${pct.Fuga.total} ações`,
        { v: pct.Fuga.v, e: pct.Fuga.e, d: pct.Fuga.d }
      );

      await interaction.channel.send({
        content:
          `📊 **Desempenho (porcentagens)**\n` +
          `**Tiroteio:** ${pct.Tiroteio.v}% vitória • ${pct.Tiroteio.e}% empate • ${pct.Tiroteio.d}% derrota\n${urlTiro}\n\n` +
          `**Fuga:** ${pct.Fuga.v}% vitória • ${pct.Fuga.e}% empate • ${pct.Fuga.d}% derrota\n${urlFuga}`
      });

      // Confirmação privada
      await interaction.reply({
        content: "✅ Ação registrada, planilha atualizada, resumo recalculado e gráficos publicados no canal.",
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error("Erro no /acao:", err);
      try {
        await interaction.reply({
          content: "❌ Ocorreu um erro ao registrar a ação. Verifique os logs.",
          flags: MessageFlags.Ephemeral,
        });
      } catch {}
    }
  },
};
