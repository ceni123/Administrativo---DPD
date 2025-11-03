// commands/acao.js — Registra ação, atualiza planilha e resumos (Tiroteio/Fuga)
// + persistência, backup e DESCRIÇÃO obrigatória (versão enxuta: sem oficial_1..10)
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

/* ========= Persistência ========= */
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
    { wch: 12 }, // Data
    { wch: 28 }, // Autor
    { wch: 12 }, // Resultado
    { wch: 12 }, // Tipo
    { wch: 24 }, // Ação
    { wch: 50 }, // Descrição
    { wch: 40 }, // Oficiais
    { wch: 18 }, // Boletim
    { wch: 22 }, // Registrado em
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
    const ws = XLSX.utils.aoa_to_sheet([
      ["Data","Autor","Resultado","Tipo","Ação","Descrição","Oficiais","Boletim","Registrado em"]
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

/* ========= Leitura + Resumos ========= */
function coletarTodasAcoes(workbook) {
  const todas = [];
  for (const name of workbook.SheetNames) {
    if (name.startsWith("Resumo")) continue;
    const ws = workbook.Sheets[name];
    if (!ws) continue;
    const linhas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    for (let i = 1; i < linhas.length; i++) {
      const l = linhas[i];
      if (!l || l.length < 9) continue; // 9 colunas com descrição
      const [data, autor, resultado, tipo, acaoAlvo, descricao, oficiais, boletim, registradoEm] = l;
      todas.push({ data, autor, resultado, tipo, acaoAlvo, descricao, oficiais, boletim, registradoEm });
    }
  }
  return todas;
}

/** ========= Split de oficiais usado nos RESUMOS (agora considera \n) */
function splitOficiaisCampo(txt) {
  return String(txt ?? "")
    .split(/[,\n;]+/g)     // <- vírgula, quebra de linha e ';'
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

    const nomesUnicos = Array.from(new Set(splitOficiaisCampo(ac.oficiais)));
    const r = String(ac.resultado).toLowerCase();
    const v = r.includes("vit");
    const d = r.includes("der");

    for (const nomeRaw of nomesUnicos) {
      const nome = nomeRaw.replace(/\s+/g, " ").trim(); // normaliza espaços
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

/* ========= Extrai lista de oficiais (menções/IDs -> apelidos), dedup e ordem de aparição ========= */
async function listarOficiais(guild, texto) {
  const nomes = [];
  const idsSet = new Set();
  const nomesSet = new Set();

  if (!texto) return [];

  // 1) Menções <@123> e <@!123>
  const mentionIds = [...texto.matchAll(/<@!?(\d+)>/g)].map(m => m[1]);
  for (const id of mentionIds) {
    if (idsSet.has(id)) continue;
    idsSet.add(id);
    let m = guild.members.cache.get(id);
    if (!m) { try { m = await guild.members.fetch(id); } catch {} }
    const nome = m?.nickname || m?.displayName || m?.user?.username;
    if (nome && !nomesSet.has(nome)) { nomesSet.add(nome); nomes.push(nome); }
  }

  // 2) IDs soltos (17–20 dígitos) que não estavam nas menções
  const idTokens = [...texto.matchAll(/\b(\d{17,20})\b/g)].map(m => m[1]);
  for (const id of idTokens) {
    if (idsSet.has(id)) continue;
    idsSet.add(id);
    let m = guild.members.cache.get(id);
    if (!m) { try { m = await guild.members.fetch(id); } catch {} }
    const nome = m?.nickname || m?.displayName || m?.user?.username || id;
    if (nome && !nomesSet.has(nome)) { nomesSet.add(nome); nomes.push(nome); }
  }

  // 3) Sobras do texto (retira menções/ids já processados) e separa por , ; ou \n
  const textoRestante = texto
    .replace(/<@!?(\d+)>/g, "")
    .replace(/\b(\d{17,20})\b/g, "")
    .trim();

  if (textoRestante) {
    const extras = textoRestante
      .split(/[,\n;]+/g)
      .map(s => s.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    for (const nome of extras) {
      if (!nomesSet.has(nome)) { nomesSet.add(nome); nomes.push(nome); }
    }
  }

  return nomes;
}

/* ========= Choices ========= */
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
    .setDescription("Registra ação policial (resultado, tipo, alvo, descrição, oficiais, data, boletim) + planilha.")
    // OBRIGATÓRIAS primeiro
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
    .addStringOption(o => o.setName("descricao").setDescription("Descreva brevemente a ocorrência").setRequired(true))
    .addStringOption(o => o.setName("boletim").setDescription("Número do boletim").setRequired(true))
    // OPCIONAIS depois
    .addStringOption(o => o.setName("data").setDescription("Data (DD/MM/AAAA ou AAAA-MM-DD)"))
    .addStringOption(o => o.setName("oficiais").setDescription("Oficiais (texto livre: @menções, IDs ou nomes)")),

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
      const descricao = interaction.options.getString("descricao", true);
      const boletim   = interaction.options.getString("boletim", true);
      const dataIn    = interaction.options.getString("data") || "";
      const dataBR    = parseDataFlex(dataIn) || hojeBR();
      const timestamp = new Date().toLocaleString("pt-BR");

      // Oficiais: texto livre — no EMBED mantém o que o usuário digitou (menções)
      const oficiaisTexto = interaction.options.getString("oficiais") || "";

      // EMBED
      const descricaoEmbed = String(descricao).slice(0, 1024) || "—";
      const embed = new EmbedBuilder()
        .setColor(resultado === "Vitória" ? "#00C853" : (resultado === "Derrota" ? "#E53935" : "#FBC02D"))
        .setTitle("📋 Relatório de Ação Policial")
        .addFields(
          { name: "Autor do Comando", value: autorMencao, inline: true },
          { name: "Resultado", value: resultado, inline: true },
          { name: "Tipo", value: tipo, inline: true },
          { name: "Ação", value: acaoAlvo, inline: true },
          { name: "Data", value: dataBR, inline: true },
          { name: "Boletim", value: `\`${boletim}\``, inline: true },
          { name: "Descrição", value: descricaoEmbed },
          { name: "Oficiais Presentes", value: oficiaisTexto || "—" }
        )
        .setFooter({ text: `Registrado por ${interaction.user.tag}` })
        .setTimestamp();
      await interaction.channel.send({ embeds: [embed] });

      // PLANILHA — extrai oficiais (menções/IDs/nome), dedup e salva um por linha
      const listaOficiais = await listarOficiais(interaction.guild, oficiaisTexto);
      const oficiaisParaPlanilha = (listaOficiais.length ? listaOficiais.join("\n") : "—");

      const wb = ensureWorkbook();
      const sheetName = ensureMonthSheet(wb, dataBR);

      appendRow(wb, sheetName, [
        dataBR,               // Data
        autorNome,            // Autor
        resultado,            // Resultado
        tipo,                 // Tipo
        acaoAlvo,             // Ação
        descricao,            // Descrição
        oficiaisParaPlanilha, // Oficiais (um por linha)
        boletim,              // Boletim
        timestamp,            // Registrado em
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
