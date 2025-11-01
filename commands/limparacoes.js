// commands/limparacoes.js — Limpa toda a planilha (somente o dono autorizado)
const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

// ID autorizado (Felipe)
const DONO_ID = "705943670897246228";

// Diretório e arquivo
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "acoes_dpd.xlsx");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("limparacoes")
    .setDescription("🧹 Limpa completamente a planilha de ações (somente autorizado)."),

  async execute(interaction) {
    try {
      // 🔒 Verifica se o usuário é o autorizado
      if (interaction.user.id !== DONO_ID) {
        return interaction.reply({
          content: "❌ Você não tem permissão para usar este comando.",
          flags: MessageFlags.Ephemeral,
        });
      }

      ensureDataDir();

      // Se a planilha existir, faz backup antes de limpar
      if (fs.existsSync(FILE_PATH)) {
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
        const backupPath = path.join(DATA_DIR, `acoes_dpd.backup-${stamp}.xlsx`);
        fs.copyFileSync(FILE_PATH, backupPath);
      }

      // Cria uma nova planilha limpa
      const wb = XLSX.utils.book_new();
      XLSX.writeFile(wb, FILE_PATH);

      await interaction.reply({
        content: "✅ Planilha **limpa com sucesso!** (backup automático gerado em `/data`).",
        flags: MessageFlags.Ephemeral,
      });

      console.log(`🧹 ${interaction.user.tag} limpou a planilha em ${new Date().toLocaleString("pt-BR")}`);
    } catch (err) {
      console.error("Erro no /limparacoes:", err);
      await interaction.reply({
        content: "❌ Ocorreu um erro ao limpar a planilha. Verifique os logs.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
