// commands/limparacoes.js — Apaga o histórico da planilha com segurança (apenas 705943670897246228)
const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "acoes_dpd.xlsx");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("limparacoes")
    .setDescription("Apaga todo o histórico da planilha de ações (apenas autorizado)."),

  async execute(interaction) {
    try {
      // ✅ Permissão por ID único
      const ALLOWED_ID = "705943670897246228";
      if (interaction.user.id !== ALLOWED_ID) {
        return interaction.reply({
          content: "❌ Você não tem permissão para usar este comando.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // Garante diretório
      try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}

      // 📄 Remove o arquivo principal, se existir
      if (fs.existsSync(FILE_PATH)) {
        fs.unlinkSync(FILE_PATH);
      }

      // 🧹 (Opcional) Remove backups acoes_dpd.YYYY-MM-DD.bak.xlsx
      try {
        const entries = fs.readdirSync(DATA_DIR);
        for (const name of entries) {
          if (/^acoes_dpd\.\d{4}-\d{2}-\d{2}\.bak\.xlsx$/.test(name)) {
            try { fs.unlinkSync(path.join(DATA_DIR, name)); } catch {}
          }
        }
      } catch {}

      await interaction.reply({
        content: "🧹 Histórico apagado. O próximo `/acao` recriará a planilha automaticamente.",
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error("Erro no /limparacoes:", err);
      try {
        await interaction.reply({
          content: "❌ Ocorreu um erro ao limpar o histórico.",
          flags: MessageFlags.Ephemeral,
        });
      } catch {}
    }
  },
};
