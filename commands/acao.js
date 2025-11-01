// commands/acao.js — Registra ação, atualiza planilha e resumo (SEM gráficos)
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

/* ========= Helpers de planilha ========= */
function applyColumnWidths(ws) {
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
  applyColumnWidths(wsNew);
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

/* ========= Util: substituir menções/IDs por apelidos ========= */
async function oficiaisParaApelidos(texto, guild) {
  if (!texto) return "";
  let resultado = texto;

  // 1) Coleta IDs em menções <@123> ou <@!123>
  const idsMencoes = [...texto.matchAll(/<@!?(\d+)>/g)].map(m => m[1]);

  // 2) Coleta IDs "soltos" (17-20 dígitos)
  const idsSoltos = [...texto.matchAll(/\b(\d{17,20})\b/g)].map(m => m[1]);

  const ids = Array.from(new Set([...idsMencoes, ...idsSoltos]));
  const mapa = {};

  for (const id of ids) {
    let membro = guild.members.cache.get(id);
    if (!membro) {
      try { membro = await guild.members.fetch(id); } catch {}
    }
    if (membro) {
      mapa[id] = membro.nickname || membro.displayName || membro.user?.username || id;
    }
  }

  // Substitui menções completas por nome
  for (const id of ids) {
    if (!mapa[id]) continue;
    resultado = resultado
      .replace(new RegExp(`<@!?${id}>`, "g"), mapa[id])  // menções
      .replace(new RegExp(`\\b${id}\\b`, "g"), mapa[id]); // ids soltos
  }

  return resultado;
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
    .setDescription("Registra ação policial (resultado, tipo, alvo, oficiais, data, boletim) + planilha.")
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
      // === Autor: salva NOME na planilha (apelido/displayName preferencial; fallback username) ===
      const autorUser = interaction.options.getUser("autor", true);
      const autorMember =
        interaction.guild.members.cache.get(autorUser.id) ||
        await interaction.guild.members.fetch(autorUser.id).catch(() => null);
      const autorNome = autorMember?.nickname || autorMember?.displayName || autorUser.username; // Nome para planilha
      const autorMencao = `<@${autorUser.id}>`; // Para embed no canal

      const resultado = interaction.options.getString("resultado", true);
      const tipo = interaction.options.getString("tipo", true);
      const acaoAlvo = interaction.options.getString("acao_alvo", true);
      const oficiaisInput = interaction.options.getString("oficiais", true);
      const boletim = interaction.options.getString("boletim", true);
      const dataIn = interaction.options.getString("data") || "";
      const dataBR = parseDataFlex(dataIn) || hojeBR();
      const timestamp = new Date().toLocaleString("pt-BR");

      // Converte menções/IDs dos oficiais para apelidos antes de ir à planilha
      const oficiaisNomes = await oficiaisParaApelidos(oficiaisInput, interaction.guild);

      // ===== Embed público no canal (mantém menções) =====
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
          { name: "Oficiais Presentes", value: oficiaisInput } // mantém menções no canal
        )
        .setFooter({ text: `Registrado por ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.channel.send({ embeds: [embed] });

      // ===== Planilha (mensal + resumo) =====
      const wb = ensureWorkbook();
      const sheetName = ensureMonthSheet(wb, dataBR);

      appendRow(wb, sheetName, [
        dataBR,        // Data
        autorNome,     // Autor (apelido/displayName)
        resultado,     // Resultado
        tipo,          // Tipo
        acaoAlvo,      // Ação
        oficiaisNomes, // Oficiais (convertidos para nomes)
        boletim,       // Boletim
        timestamp,     // Registrado em
      ]);

      atualizarResumo(wb);
      XLSX.writeFile(wb, FILE_PATH);

      // Confirmação privada
      await interaction.reply({
        content: "✅ Ação registrada, planilha atualizada (apelidos) e resumo recalculado.",
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
