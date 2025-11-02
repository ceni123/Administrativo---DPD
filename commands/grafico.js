// commands/grafico.js — Gera gráficos de pizza (Vitória/Empate/Derrota) por tipo e período
const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const QuickChart = require("quickchart-js");

/* ========= Persistência: igual ao /acao e /planilha ========= */
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const LEGACY_FILE_PATH = path.join(__dirname, "../acoes_dpd.xlsx"); // arquivo antigo, dentro do código
const FILE_PATH = path.join(DATA_DIR, "acoes_dpd.xlsx");            // arquivo persistente

function ensureDataDirAndMigrate() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  // migra automaticamente o legado se ainda não existir o arquivo persistente
  if (fs.existsSync(LEGACY_FILE_PATH) && !fs.existsSync(FILE_PATH)) {
    try { fs.copyFileSync(LEGACY_FILE_PATH, FILE_PATH); } catch {}
  }
}

/* ========= Leitura das ações ========= */
function carregarAcoes(periodoMMYYYY) {
  ensureDataDirAndMigrate();
  if (!fs.existsSync(FILE_PATH)) return [];

  const wb = XLSX.readFile(FILE_PATH);
  const acoes = [];

  let alvoMes = null, alvoAno = null;
  if (periodoMMYYYY) {
    const m = periodoMMYYYY.match(/^(\d{2})\/(\d{4})$/);
    if (m) { alvoMes = m[1]; alvoAno = m[2]; }
  }

  for (const name of wb.SheetNames) {
    // Ignora quaisquer abas de resumo
    if (name.toLowerCase().startsWith("resumo")) continue;

    const ws = wb.Sheets[name];
    if (!ws) continue;

    const linhas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    for (let i = 1; i < linhas.length; i++) {
      const l = linhas[i];
      if (!l || l.length < 8) continue;

      const [data, autor, resultado, tipo, acaoAlvo, oficiais] = l;

      // Filtra por período (MM/AAAA) se fornecido
      if (alvoMes && alvoAno) {
        const dm = String(data).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!dm) continue;
        const mes = dm[2], ano = dm[3];
        if (mes !== alvoMes || ano !== alvoAno) continue;
      }

      acoes.push({ data, autor, resultado, tipo, acaoAlvo, oficiais });
    }
  }
  return acoes;
}

/* ========= Cálculo de percentuais ========= */
function computarPercentuais(acoes, filtroTipo /* 'Tiroteio' | 'Fuga' | 'Ambos' */) {
  const base = { v: 0, e: 0, d: 0, total: 0 };

  for (const ac of acoes) {
    const tipo = String(ac.tipo || "");
    if (filtroTipo !== "Ambos" && tipo !== filtroTipo) continue;

    const r = String(ac.resultado).toLowerCase();
    base.total++;
    if (r.includes("vit")) base.v++;
    else if (r.includes("emp")) base.e++;
    else if (r.includes("der")) base.d++;
  }

  const t = base.total || 1; // evita divisão por zero
  return {
    v: +(base.v * 100 / t).toFixed(1),
    e: +(base.e * 100 / t).toFixed(1),
    d: +(base.d * 100 / t).toFixed(1),
    total: base.total
  };
}

/* ========= Gráfico (QuickChart) ========= */
async function chartURL(titulo, { v, e, d }) {
  const chart = new QuickChart();
  chart.setConfig({
    type: "pie",
    data: {
      labels: ["Vitória", "Empate", "Derrota"],
      datasets: [{ data: [v, e, d] }]
    },
    options: {
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: titulo }
      }
    }
  });
  return await chart.getShortUrl();
}

/* ========= Slash command ========= */
module.exports = {
  data: new SlashCommandBuilder()
    .setName("grafico")
    .setDescription("Mostra gráfico(s) de pizza por tipo: Tiroteio, Fuga ou Ambos.")
    .addStringOption(o =>
      o.setName("tipo")
        .setDescription("Escolha o tipo")
        .setRequired(true)
        .addChoices(
          { name: "Ambos", value: "Ambos" },
          { name: "Tiroteio", value: "Tiroteio" },
          { name: "Fuga", value: "Fuga" },
        )
    )
    .addStringOption(o =>
      o.setName("periodo")
        .setDescription("Filtrar por MM/AAAA (ex.: 11/2025)")
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const tipo = interaction.options.getString("tipo", true);
      const periodo = interaction.options.getString("periodo") || "";

      const acoes = carregarAcoes(periodo);
      if (acoes.length === 0) {
        await interaction.reply({
          content: "⚠️ Nenhum dado encontrado para gerar gráficos.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const respostas = [];

      if (tipo === "Ambos") {
        const pctTiro = computarPercentuais(acoes, "Tiroteio");
        const pctFuga = computarPercentuais(acoes, "Fuga");

        const urlTiro = await chartURL(`Tiroteio — ${pctTiro.total} ações${periodo ? ` (${periodo})` : ""}`, pctTiro);
        const urlFuga = await chartURL(`Fuga — ${pctFuga.total} ações${periodo ? ` (${periodo})` : ""}`, pctFuga);

        respostas.push(
          `📊 **Tiroteio:** ${pctTiro.v}% vitória • ${pctTiro.e}% empate • ${pctTiro.d}% derrota\n${urlTiro}`,
          `📊 **Fuga:** ${pctFuga.v}% vitória • ${pctFuga.e}% empate • ${pctFuga.d}% derrota\n${urlFuga}`,
        );
      } else {
        const pct = computarPercentuais(acoes, tipo);
        const url = await chartURL(`${tipo} — ${pct.total} ações${periodo ? ` (${periodo})` : ""}`, pct);
        respostas.push(`📊 **${tipo}:** ${pct.v}% vitória • ${pct.e}% empate • ${pct.d}% derrota\n${url}`);
      }

      await interaction.reply(respostas.join("\n\n"));
    } catch (err) {
      console.error("Erro no /grafico:", err);
      try {
        await interaction.reply({
          content: "❌ Erro ao gerar gráficos. Verifique os logs.",
          flags: MessageFlags.Ephemeral,
        });
      } catch {}
    }
  },
};
