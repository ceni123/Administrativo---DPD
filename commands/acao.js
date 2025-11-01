// commands/acao.js — Registra ação, atualiza planilha e resumos (Tiroteio/Fuga) + persistência e backup
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

/* ========= Config de persistência ========= */
// Use um volume persistente e aponte DATA_DIR para lá (ex.: /var/data)
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const LEGACY_FILE_PATH = path.join(__dirname, "../acoes_dpd.xlsx"); // antigo (no código)
const FILE_PATH = path.join(DATA_DIR, "acoes_dpd.xlsx");            // novo (persistente)

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(LEGACY_FILE_PATH) && !fs.existsSync(FILE_PATH)) {
    try { fs.copyFileSync(LEGACY_FILE_PATH, FILE_PATH); } catch (e) { console.warn("⚠️ Falha ao migrar XLSX legado:", e); }
  }
}
function safeWriteFile(workbook) {
  const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
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
// aceita "DD/MM/AAAA", "DD-MM-AAAA" ou "AAAA-MM-DD"
function parseDataFlex(input) {
  if (!input) return null;
  const t = String(input).trim();
  let m = t.match(/^(\d{4})[-\/.](\d{2})[-\/.](\d{2})$/);
  if (m) return `${m[3].padStart(2, "0")}/${m[2].padStart(2, "0")}/${m[1]}`;
  m = t.match(/^(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})$/);
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
  return fs.existsSync(FILE_PATH) ? XLSX.readFile(FILE_PATH) : XLSX.utils.book_new();
}
function ensureMonthSheet(workbook, dateStrBR) {
  let mesIndex, ano;
  const m = String(dateStrBR).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) { mesIndex = parseInt(m[2], 10) - 1; ano = m[3]; }
  else { const now = new Date(); mesIndex = now.getMonth(); ano = now.getFullYear(); }
  const sheetName = `${MESES[mesIndex]} ${ano}`;
  if (!workbook.SheetNames.includes(sheetName)) {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Data","Autor","Resultado","Tipo","Ação","Oficiais","Boletim","Registrado em"]
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
function coletarTodasAcoes(workbook) {
  const todas = [];
  for (const name of workbook.SheetNames) {
    if (name.startsWith("Resumo")) continue;
    const ws = workbook.Sheets[name];
    if (!ws) continue;
    const linhas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    for (let i = 1; i < linhas.length; i++) {
      const l = linhas[i]; if (!l || l.length < 8) continue;
      const [data, autor, resultado, tipo, acaoAlvo, oficiais, boletim, registradoEm] = l;
      todas.push({ data, autor, resultado, tipo, acaoAlvo, oficiais, boletim, registradoEm });
    }
  }
  return todas;
}

/* ========= Split de oficiais p/ RESUMO =========
   ⚠️ NÃO divide por '|' nem por espaço. Apenas vírgula/; para preservar apelidos compostos.
*/
function splitOficiaisCampo(txt) {
  return String(txt ?? "")
    .split(/[;,]+/g)         // apenas vírgula ou ponto-e-vírgula
    .map(s => s.trim())
    .filter(Boolean);
}

/* ========= Resumos por tipo (duas abas) ========= */
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
    const rows = [["Oficial","Presenças","Vitórias","Derrotas"]];
    Object.entries(mapas[tipo])
      .sort((a,b)=> b[1].presencas - a[1].presencas || b[1].vitorias - a[1].vitorias || a[0].localeCompare(b[0]))
      .forEach(([nome,s]) => rows.push([nome, s.presencas, s.vitorias, s.derrotas]));
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 36 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
    const sheetName = `Resumo - ${tipo}`;
    if (workbook.SheetNames.includes(sheetName)) workbook.Sheets[sheetName] = ws;
    else XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  }
}

/* ========= Menções/IDs -> apelidos (NORMALIZA p/ CSV) =========
   - Se houver menções (<@id>), busca apelidos e retorna "nome1, nome2, ..."
   - Se o usuário já digitar com vírgula/; mantém e normaliza.
   - Se for um único nome sem separador, retorna como está.
*/
async function normalizarOficiaisParaCSV(guild, texto) {
  const raw = String(texto || "").trim();
  const mentionIds = [...raw.matchAll(/<@!?(\d+)>/g)].map(m => m[1]);

  if (mentionIds.length) {
    const nomes = [];
    for (const id of mentionIds) {
      let m = guild.members.cache.get(id);
      if (!m) { try { m = await guild.members.fetch(id); } catch {} }
      nomes.push(m?.nickname || m?.displayName || m?.user?.username || id);
    }
    return nomes.join(", ");
  }

  // usuário já passou como texto; se tiver vírgula/; usa como CSV
  if (/[;,]/.test(raw)) {
    return raw
      .split(/[;,]+/g)
      .map(s => s.trim())
      .filter(Boolean)
      .join(", ");
  }

  // Sem menções e sem separador: um único nome
  return raw;
}

/* ========= Opções de "Ação/Alvo" ========= */
const ACAO_CHOICES = [
  { name:"Distribuidora", value:"Distribuidora" },
  { name:"Joalheria", value:"Joalheria" },
  { name:"Ammu Nation", value:"Ammu Nation" },
  { name:"Burger Shot", value:"Burger Shot" },
  { name:"Estação de Trem", value:"Estação de Trem" },
  { name:"Conveniência", value:"Conveniência" },
  { name:"Tatuagem", value:"Tatuagem" },
  { name:"Pier 45", value:"Pier 45" },
  { name:"Fleeca", value:"Fleeca" },
  { name:"Venda de Drogas", value:"Venda de Drogas" },
  { name:"Caixa eletrônico/Registradora", value:"Caixa eletrônico/Registradora" },
];

/* ========= Comando ========= */
module.exports = {
  data: new SlashCommandBuilder()
    .setName("acao")
    .setDescription("Registra ação policial (resultado, tipo, alvo, oficiais, data, boletim) + planilha.")
    .addUserOption(o => o.setName("autor").setDescription("Quem está registrando a ação (mencione com @)").setRequired(true))
    .addStringOption(o => o.setName("resultado").setDescription("Resultado da ação").setRequired(true).addChoices(
      { name:"Vitória 🟢", value:"Vitória" },
      { name:"Derrota 🔴", value:"Derrota" },
      { name:"Empate 🟡", value:"Empate" }
    ))
    .addStringOption(o => o.setName("tipo").setDescription("Tipo da ação").setRequired(true).addChoices(
      { name:"Fuga 🚔", value:"Fuga" },
      { name:"Tiroteio 🔫", value:"Tiroteio" }
    ))
    .addStringOption(o => o.setName("acao_alvo").setDescription("Qual foi a Ação/Alvo").setRequired(true).addChoices(...ACAO_CHOICES))
    .addStringOption(o => o.setName("oficiais").setDescription("Oficiais presentes (use @menções ou nomes, separados por vírgula)").setRequired(true))
    .addStringOption(o => o.setName("boletim").setDescription("Número do boletim da prisão").setRequired(true))
    .addStringOption(o => o.setName("data").setDescription("Data da ação (DD/MM/AAAA, DD-MM-AAAA ou AAAA-MM-DD). Vazio = hoje.").setRequired(false)),

  async execute(interaction) {
    try {
      // Autor: salva NOME (apelido/displayName preferencial; fallback username)
      const autorUser = interaction.options.getUser("autor", true);
      const autorMember =
        interaction.guild.members.cache.get(autorUser.id) ||
        await interaction.guild.members.fetch(autorUser.id).catch(() => null);
      const autorNome = autorMember?.nickname || autorMember?.displayName || autorUser.username;
      const autorMencao = `<@${autorUser.id}>`;

      const resultado   = interaction.options.getString("resultado", true);
      const tipo        = interaction.options.getString("tipo", true);
      const acaoAlvo    = interaction.options.getString("acao_alvo", true);
      const oficiaisRaw = interaction.options.getString("oficiais", true);
      const boletim     = interaction.options.getString("boletim", true);
      const dataIn      = interaction.options.getString("data") || "";
      const dataBR      = parseDataFlex(dataIn) || hojeBR();
      const timestamp   = new Date().toLocaleString("pt-BR");

      // Normaliza oficiais -> CSV de apelidos
      const oficiaisCSV = await normalizarOficiaisParaCSV(interaction.guild, oficiaisRaw);

      // Embed público (mantém o texto original com menções)
      const color =
        resultado === "Vitória" ? "#00C853" :
        resultado === "Derrota" ? "#E53935" : "#FBC02D";

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
          { name: "Oficiais Presentes", value: oficiaisRaw }
        )
        .setFooter({ text: `Registrado por ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.channel.send({ embeds: [embed] });

      // Planilha + Resumos
      const wb = ensureWorkbook();
      const sheetName = ensureMonthSheet(wb, dataBR);

      appendRow(wb, sheetName, [
        dataBR,        // Data
        autorNome,     // Autor (apelido/displayName)
        resultado,     // Resultado
        tipo,          // Tipo
        acaoAlvo,      // Ação
        oficiaisCSV,   // Oficiais (CSV de apelidos)
        boletim,       // Boletim
        timestamp,     // Registrado em
      ]);

      atualizarResumosPorTipo(wb);
      safeWriteFile(wb);

      await interaction.reply({
        content: "✅ Ação registrada, planilha atualizada e resumos separados (Tiroteio/Fuga) recalculados.",
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
