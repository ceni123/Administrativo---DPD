// commands/acao.js — Registro completo de ações em planilha mensal
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

function hojeBR() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const CAMINHO_PLANILHA = path.join(__dirname, "../acoes_dpd.xlsx");

// 🔹 Cria ou atualiza a planilha
function registrarAcao({ autor, resultado, tipo, oficiais, data, boletim }) {
  const mesAtual = MESES[new Date().getMonth()];
  let workbook;

  if (fs.existsSync(CAMINHO_PLANILHA)) {
    workbook = XLSX.readFile(CAMINHO_PLANILHA);
  } else {
    workbook = XLSX.utils.book_new();
  }

  // Se a aba do mês não existir, cria
  if (!workbook.SheetNames.includes(mesAtual)) {
    const novaAba = XLSX.utils.aoa_to_sheet([
      ["Data", "Autor", "Resultado", "Tipo", "Oficiais", "Boletim"]
    ]);
    XLSX.utils.book_append_sheet(workbook, novaAba, mesAtual);
  }

  const aba = workbook.Sheets[mesAtual];
  const dados = XLSX.utils.sheet_to_json(aba, { header: 1 });
  dados.push([data, autor, resultado, tipo, oficiais, boletim]);
  const novaAba = XLSX.utils.aoa_to_sheet(dados);
  workbook.Sheets[mesAtual] = novaAba;

  // Atualiza o resumo geral
  atualizarResumo(workbook);

  XLSX.writeFile(workbook, CAMINHO_PLANILHA);
}

// 🔸 Cria aba “Resumo” com ranking
function atualizarResumo(workbook) {
  const todasAcoes = [];

  workbook.SheetNames.forEach(nome => {
    if (nome === "Resumo") return;
    const aba = workbook.Sheets[nome];
    const linhas = XLSX.utils.sheet_to_json(aba, { header: 1, defval: "" });
    linhas.slice(1).forEach(l => {
      if (l.length >= 6) {
        todasAcoes.push({
          data: l[0],
          autor: l[1],
          resultado: l[2],
          tipo: l[3],
          oficiais: l[4],
          boletim: l[5],
        });
      }
    });
  });

  // Calcula estatísticas
  const ranking = {};
  for (const acao of todasAcoes) {
    const nomes = acao.oficiais.split(/[,;@]/).map(n => n.trim()).filter(Boolean);
    for (const nome of nomes) {
      if (!ranking[nome]) ranking[nome] = { presencas: 0, vitorias: 0, derrotas: 0 };
      ranking[nome].presencas++;
      if (acao.resultado.toLowerCase().includes("vitoria")) ranking[nome].vitorias++;
      if (acao.resultado.toLowerCase().includes("derrota")) ranking[nome].derrotas++;
    }
  }

  const linhasResumo = [["Oficial", "Presenças", "Vitórias", "Derrotas"]];
  Object.entries(ranking)
    .sort((a, b) => b[1].presencas - a[1].presencas)
    .forEach(([nome, stats]) => {
      linhasResumo.push([nome, stats.presencas, stats.vitorias, stats.derrotas]);
    });

  const abaResumo = XLSX.utils.aoa_to_sheet(linhasResumo);
  if (workbook.SheetNames.includes("Resumo")) {
    workbook.Sheets["Resumo"] = abaResumo;
  } else {
    XLSX.utils.book_append_sheet(workbook, abaResumo, "Resumo");
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ação")
    .setDescription("Registra uma ação e salva na planilha mensal de operações.")
    .addUserOption(o =>
      o.setName("autor")
        .setDescription("Quem executou o comando /ação")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("resultado")
        .setDescription("Resultado da ação")
        .setRequired(true)
        .addChoices(
          { name: "Vitória", value: "Vitória" },
          { name: "Derrota", value: "Derrota" },
          { name: "Empate",  value: "Empate" }
        )
    )
    .addStringOption(o =>
      o.setName("tipo")
        .setDescription("Tipo da ação")
        .setRequired(true)
        .addChoices(
          { name: "Fuga", value: "Fuga" },
          { name: "Tiro", value: "Tiro" }
        )
    )
    .addStringOption(o =>
      o.setName("oficiais")
        .setDescription("Oficiais presentes (@menções ou nomes separados por vírgula)")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("data")
        .setDescription("Data da ação (DD/MM/AAAA) — padrão: hoje")
        .setRequired(false)
    )
    .addStringOption(o =>
      o.setName("boletim")
        .setDescription("Número do boletim da prisão")
        .setRequired(true)
    ),

  async execute(interaction) {
    const autorUser = interaction.options.getUser("autor", true);
    const autor = `<@${autorUser.id}>`;
    const resultado = interaction.options.getString("resultado", true);
    const tipo = interaction.options.getString("tipo", true);
    const oficiais = interaction.options.getString("oficiais", true);
    const data = interaction.options.getString("data") || hojeBR();
    const boletim = interaction.options.getString("boletim", true);

    registrarAcao({ autor, resultado, tipo, oficiais, data, boletim });

    const embed = new EmbedBuilder()
      .setColor(resultado === "Vitória" ? "#1DB954" : resultado === "Derrota" ? "#E53935" : "#FBC02D")
      .setTitle(`📄 Registro de Ação — ${resultado}`)
      .addFields(
        { name: "Autor do Comando", value: autor, inline: true },
        { name: "Tipo", value: tipo, inline: true },
        { name: "Data", value: data, inline: true },
        { name: "Boletim", value: boletim, inline: true },
        { name: "Oficiais Presentes", value: oficiais }
      )
      .setFooter({ text: "Departamento de Polícia de Detroit — Registro Diário" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
