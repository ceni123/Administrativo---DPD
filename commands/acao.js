// commands/acao.js — Registro de ações com planilha mensal e aba de Resumo (presenças, vitórias, derrotas)
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

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

/* ========= Funções de planilha ========= */
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
      ["Data", "Autor", "Resultado", "Tipo", "Oficiais", "Boletim", "Registrado em"]
    ]);
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  }
  return sheetName;
}

function appendRow(workbook, sheetName, row) {
  const ws = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  data.push(row);
  workbook.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(data);
}

function atualizarResumo(workbook) {
  // agrega todas as abas exceto "Resumo"
  const todas = [];
  for (const name of workbook.SheetNames) {
    if (name === "Resumo") continue;
    const ws = workbook.Sheets[name];
    if (!ws) continue;
    const linhas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    // pula cabeçalho
    for (let i = 1; i < linhas.length; i++) {
      const l = linhas[i];
      if (!l || l.length < 7) continue;
      const [data, autor, resultado, tipo, oficiais, boletim, registradoEm] = l;
      todas.push({ data, autor, resultado, tipo, oficiais, boletim, registradoEm });
    }
  }

  // ranking por oficiais citados em "Oficiais"
  const mapa = {}; // { nome: { presencas, vitorias, derrotas } }
  for (const ac of todas) {
    // separa por @, vírgula, ponto e vírgula ou quebra de linha
    const nomes = String(ac.oficiais)
      .split(/[\s]*[,;]\s*|(\s)(?=@)/g) // separa em vírgula/; ou mantém @menções juntas
      .filter(Boolean);

    // alternativa robusta: também quebra por espaços mas preserva @menções inteiras
    // se a linha vier com " @A @B @C " também funciona
    if (nomes.length === 0) {
      const fallback = String(ac.oficiais).split(/\s+/).filter(Boolean);
      if (fallback.length) nomes.push(...fallback);
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
  if (workbook.SheetNames.includes("Resumo")) {
    workbook.Sheets["Resumo"] = resumoWS;
  } else {
    XLSX.utils.book_append_sheet(workbook, resumoWS, "Resumo");
  }
}

/* ========= Comando ========= */
module.exports = {
  data: new SlashCommandBuilder()
    .setName("acao") // <- sem acento (Discord exige a-z0-9_-)
    .setDescription("Registra uma ação policial (resultado, tipo, oficiais, data e boletim) com planilha e resumo.")
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
          { name: "Empate 🟡", value: "Empate" },
        )
    )
    .addStringOption(o =>
      o.setName("tipo")
        .setDescription("Tipo da ação")
        .setRequired(true)
        .addChoices(
          { name: "Fuga 🚔", value: "Fuga" },
          { name: "Tiroteio 🔫", value: "Tiroteio" },
        )
    )
    .addStringOption(o =>
      o.setName("oficiais")
        .setDescription("Oficiais presentes (use @menções ou nomes, separados por espaço/vírgula)")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("data")
        .setDescription("Data da ação (DD/MM/AAAA, DD-MM-AAAA ou AAAA-MM-DD). Vazio = hoje.")
        .setRequired(false)
    )
    .addStringOption(o =>
      o.setName("boletim")
        .setDescription("Número do boletim da prisão")
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const autorUser = interaction.options.getUser("autor", true);
      const autor = `<@${autorUser.id}>`;

      const resultado = interaction.options.getString("resultado", true);
      const tipo = interaction.options.getString("tipo", true);
      const oficiais = interaction.options.getString("oficiais", true);
      const dataIn = interaction.options.getString("data") || "";
      const boletim = interaction.options.getString("boletim", true);

      const dataBR = parseDataFlex(dataIn) || hojeBR();
      const timestamp = new Date().toLocaleString("pt-BR");

      // ===== Embed no canal =====
      const color =
        resultado === "Vitória" ? "#00C853" :
        resultado === "Derrota" ? "#E53935" :
        "#FBC02D";

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle("📋 Relatório de Ação Policial")
        .addFields(
          { name: "Autor do Comando", value: autor, inline: true },
          { name: "Resultado", value: resultado, inline: true },
          { name: "Tipo", value: tipo, inline: true },
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

      appendRow(wb, sheetName, [
        dataBR,            // Data
        autor,             // Autor
        resultado,         // Resultado
        tipo,              // Tipo
        oficiais,          // Oficiais
        boletim,           // Boletim
        timestamp,         // Registrado em
      ]);

      atualizarResumo(wb);
      XLSX.writeFile(wb, FILE_PATH);

      // Confirmação privada
      await interaction.reply({
        content: "✅ Ação registrada, planilha atualizada e resumo recalculado.",
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error("Erro no /acao:", err);
      await interaction.reply({
        content: "❌ Ocorreu um erro ao registrar a ação. Verifique os logs.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
