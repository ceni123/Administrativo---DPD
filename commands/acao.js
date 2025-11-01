// commands/acao.js — Registra ação, atualiza planilha e resumos (Tiroteio/Fuga) + persistência e backup
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

/* ========= Config de persistência ========= */
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const LEGACY_FILE_PATH = path.join(__dirname, "../acoes_dpd.xlsx");
const FILE_PATH = path.join(DATA_DIR, "acoes_dpd.xlsx");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(LEGACY_FILE_PATH) && !fs.existsSync(FILE_PATH)) {
    try { fs.copyFileSync(LEGACY_FILE_PATH, FILE_PATH); } catch (e) { console.warn("⚠️ Falha ao migrar XLSX legado:", e); }
  }
}
function safeWriteFile(workbook) {
  const stamp = new Date().toISOString().slice(0, 10);
  const backupPath = path.join(DATA_DIR, `acoes_dpd.${stamp}.bak.xlsx`);
  try {
    if (fs.existsSync(FILE_PATH) && !fs.existsSync(backupPath)) fs.copyFileSync(FILE_PATH, backupPath);
  } catch (e) { console.warn("⚠️ Falha ao criar backup do XLSX:", e); }
  XLSX.writeFile(workbook, FILE_PATH);
}

/* ========= Datas ========= */
function hojeBR() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
function parseDataFlex(input) {
  if (!input) return null;
  const txt = String(input).trim();
  let m = txt.match(/^(\d{4})[-\/.](\d{2})[-\/.](\d{2})$/);
  if (m) return `${m[3].padStart(2, "0")}/${m[2].padStart(2, "0")}/${m[1]}`;
  m = txt.match(/^(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})$/);
  if (m) return `${m[1]}/${m[2]}/${m[3]}`;
  return null;
}

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

/* ========= Planilha ========= */
function applyColumnWidths(ws) {
  ws["!cols"] = [
    { wch: 12 }, { wch: 28 }, { wch: 12 }, { wch: 12 },
    { wch: 24 }, { wch: 40 }, { wch: 18 }, { wch: 22 },
  ];
}
function ensureWorkbook() {
  ensureDataDir();
  if (fs.existsSync(FILE_PATH)) return XLSX.readFile(FILE_PATH);
  return XLSX.utils.book_new();
}
function ensureMonthSheet(workbook, dateStrBR) {
  let mesIndex, ano;
  const m = String(dateStrBR).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) { mesIndex = parseInt(m[2], 10) - 1; ano = m[3]; }
  else { const now = new Date(); mesIndex = now.getMonth(); ano = now.getFullYear(); }
  const sheetName = `${MESES[mesIndex]} ${ano}`;
  if (!workbook.SheetNames.includes(sheetName)) {
    const ws = XLSX.utils.aoa_to_sheet([["Data","Autor","Resultado","Tipo","Ação","Oficiais","Boletim","Registrado em"]]);
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
function coletarTodasAcoes(workbook) {
  const todas = [];
  for (const name of workbook.SheetNames) {
    if (name.startsWith("Resumo")) continue;
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
function splitOficiaisCampo(txt) {
  return String(txt ?? "")
    .split(/[,;|/•]+|\s{2,}/g)
    .map(t => t.trim())
    .filter(Boolean);
}
function atualizarResumosPorTipo(workbook) {
  const todas = coletarTodasAcoes(workbook);
  const mapas = { "Tiroteio": Object.create(null), "Fuga": Object.create(null) };
  for (const ac of todas) {
    const tipo = String(ac.tipo || "");
    const alvo = tipo.includes("Tiro") ? "Tiroteio" : (tipo.includes("Fuga") ? "Fuga" : null);
    if (!alvo) continue;
    const nomes = splitOficiaisCampo(ac.oficiais);
    const r = String(ac.resultado).toLowerCase();
    const v = r.includes("vit");
    const d = r.includes("der");
    for (const nome of nomes) {
      if (!mapas[alvo][nome]) mapas[alvo][nome] = { presencas: 0, vitorias: 0, derrotas: 0 };
      mapas[alvo][nome].presencas++;
      if (v) mapas[alvo][nome].vitorias++;
      if (d) mapas[alvo][nome].derrotas++;
    }
  }
  for (const tipo of ["Tiroteio","Fuga"]) {
    const mapa = mapas[tipo];
    const rows = [["Oficial","Presenças","Vitórias","Derrotas"]];
    Object.entries(mapa)
      .sort((a,b)=> b[1].presencas - a[1].presencas || b[1].vitorias - a[1].vitorias || a[0].localeCompare(b[0]))
      .forEach(([nome,stats])=>rows.push([nome,stats.presencas,stats.vitorias,stats.derrotas]));
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 36 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
    const sheetName = `Resumo - ${tipo}`;
    if (workbook.SheetNames.includes(sheetName)) workbook.Sheets[sheetName] = ws;
    else XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  }
}

/* ========= Converte menções/IDs do texto para apelidos ========= */
async function oficiaisParaApelidos(texto, guild) {
  if (!texto) return "";
  let resultado = texto;
  const idsMencoes = [...texto.matchAll(/<@!?(\d+)>/g)].map(m => m[1]);
  const idsSoltos  = [...texto.matchAll(/\b(\d{17,20})\b/g)].map(m => m[1]);
  const ids = Array.from(new Set([...idsMencoes, ...idsSoltos]));
  const mapa = {};
  for (const id of ids) {
    let membro = guild.members.cache.get(id);
    if (!membro) { try { membro = await guild.members.fetch(id); } catch {} }
    if (membro) mapa[id] = membro.nickname || membro.displayName || membro.user?.username || id;
  }
  for (const id of ids) {
    if (!mapa[id]) continue;
    resultado = resultado
      .replace(new RegExp(`<@!?${id}>`, "g"), mapa[id])
      .replace(new RegExp(`\\b${id}\\b`, "g"), mapa[id]);
  }
  return resultado;
}

/* ========= Opções ========= */
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
    .setName("acao")
    .setDescription("Registra ação policial (resultado, tipo, alvo, oficiais, data, boletim) + planilha.")
    .addUserOption(o => o.setName("autor").setDescription("Quem está registrando a ação").setRequired(true))
    .addStringOption(o =>
      o.setName("resultado").setDescription("Resultado").setRequired(true).addChoices(
        { name: "Vitória 🟢", value: "Vitória" },
        { name: "Derrota 🔴", value: "Derrota" },
        { name: "Empate 🟡", value: "Empate" }
      )
    )
    .addStringOption(o =>
      o.setName("tipo").setDescription("Tipo").setRequired(true).addChoices(
        { name: "Fuga 🚔", value: "Fuga" },
        { name: "Tiroteio 🔫", value: "Tiroteio" }
      )
    )
    .addStringOption(o => o.setName("acao_alvo").setDescription("Ação/Alvo").setRequired(true).addChoices(...ACAO_CHOICES))
    // 🆕 Até 10 usuários selecionáveis no picker do Discord + fallback em texto
    .addUserOption(o => o.setName("oficial_1").setDescription("Oficial 1").setRequired(false))
    .addUserOption(o => o.setName("oficial_2").setDescription("Oficial 2").setRequired(false))
    .addUserOption(o => o.setName("oficial_3").setDescription("Oficial 3").setRequired(false))
    .addUserOption(o => o.setName("oficial_4").setDescription("Oficial 4").setRequired(false))
    .addUserOption(o => o.setName("oficial_5").setDescription("Oficial 5").setRequired(false))
    .addUserOption(o => o.setName("oficial_6").setDescription("Oficial 6").setRequired(false))
    .addUserOption(o => o.setName("oficial_7").setDescription("Oficial 7").setRequired(false))
    .addUserOption(o => o.setName("oficial_8").setDescription("Oficial 8").setRequired(false))
    .addUserOption(o => o.setName("oficial_9").setDescription("Oficial 9").setRequired(false))
    .addUserOption(o => o.setName("oficial_10").setDescription("Oficial 10").setRequired(false))
    .addStringOption(o => o.setName("oficiais").setDescription("Oficiais (texto livre: menções/IDs/nomes)").setRequired(false))
    .addStringOption(o => o.setName("boletim").setDescription("Número do boletim").setRequired(true))
    .addStringOption(o => o.setName("data").setDescription("Data (DD/MM/AAAA ou AAAA-MM-DD)").setRequired(false)),

  async execute(interaction) {
    try {
      // Autor (apelido/displayName preferencial)
      const autorUser = interaction.options.getUser("autor", true);
      const autorMember =
        interaction.guild.members.cache.get(autorUser.id) ||
        await interaction.guild.members.fetch(autorUser.id).catch(() => null);
      const autorNome = autorMember?.nickname || autorMember?.displayName || autorUser.username;
      const autorMencao = `<@${autorUser.id}>`;

      const resultado = interaction.options.getString("resultado", true);
      const tipo      = interaction.options.getString("tipo", true);
      const acaoAlvo  = interaction.options.getString("acao_alvo", true);
      const boletim   = interaction.options.getString("boletim", true);
      const dataIn    = interaction.options.getString("data") || "";
      const dataBR    = parseDataFlex(dataIn) || hojeBR();
      const timestamp = new Date().toLocaleString("pt-BR");

      // ===== Oficiais: coleta dos 10 pickers + texto livre =====
      const oficiaisSelecionados = [];
      for (let i = 1; i <= 10; i++) {
        const u = interaction.options.getUser(`oficial_${i}`);
        if (u) oficiaisSelecionados.push(u);
      }
      const oficiaisTexto = interaction.options.getString("oficiais") || "";

      // Para o EMBED: menções dos selecionados + o que vier no texto
      const mencoesSelecionados = oficiaisSelecionados.map(u => `<@${u.id}>`);
      const embedOficiaisValue =
        [ ...mencoesSelecionados, oficiaisTexto ].filter(Boolean).join(", ").trim() || "—";

      // Para a PLANILHA: nomes (apelidos) dos selecionados + conversão do texto para apelidos
      const nomesSelecionados = [];
      for (const u of oficiaisSelecionados) {
        const m =
          interaction.guild.members.cache.get(u.id) ||
          await interaction.guild.members.fetch(u.id).catch(() => null);
        nomesSelecionados.push(m?.nickname || m?.displayName || u.username);
      }
      const nomesDoTexto = await oficiaisParaApelidos(oficiaisTexto, interaction.guild);
      const oficiaisParaPlanilha = [ ...nomesSelecionados, nomesDoTexto ]
        .filter(Boolean)
        .join(", ")
        .trim();

      // ===== Embed público =====
      const color = resultado === "Vitória" ? "#00C853" : (resultado === "Derrota" ? "#E53935" : "#FBC02D");
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
          { name: "Oficiais Presentes", value: embedOficiaisValue }
        )
        .setFooter({ text: `Registrado por ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.channel.send({ embeds: [embed] });

      // ===== Planilha =====
      const wb = ensureWorkbook();
      const sheetName = ensureMonthSheet(wb, dataBR);

      appendRow(wb, sheetName, [
        dataBR,                   // Data
        autorNome,                // Autor
        resultado,                // Resultado
        tipo,                     // Tipo
        acaoAlvo,                 // Ação
        oficiaisParaPlanilha || "—", // Oficiais (nomes)
        boletim,                  // Boletim
        timestamp,                // Registrado em
      ]);

      atualizarResumosPorTipo(wb);
      safeWriteFile(wb);

      await interaction.reply({
        content: "✅ Ação registrada, planilha atualizada e resumos recalculados.",
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error("Erro no /acao:", err);
      try {
        await interaction.reply({
          content: "❌ Ocorreu um erro ao registrar a ação.",
          flags: MessageFlags.Ephemeral,
        });
      } catch {}
    }
  },
};
