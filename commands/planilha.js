// commands/planilha.js — Envia a planilha de resultados (acesso restrito por cargo)
const { SlashCommandBuilder, AttachmentBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");

const ARQUIVO = path.join(__dirname, "../acoes_dpd.xlsx");

// ✅ Cargos autorizados (IDs informados pelo Felipe)
const CARGOS_AUTORIZADOS = [
  "1222682312035143710",
  "1252739005301260299",
  "1350233551894745119",
  "1198305745272328384",
  "1308201707246850099",
  "1350234270362505317",
  "1198305746429956207",
  "1350234141349646376",
  "1198305742684434502",
  "1350233318469271672",
  "1222764111570403429",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("planilha")
    .setDescription("Anexa no canal a planilha de resultados (acesso restrito)."),

  async execute(interaction) {
    try {
      // 🛡️ Verificação de permissão por cargo (ID)
      const temPermissao = interaction.member.roles.cache.some((r) =>
        CARGOS_AUTORIZADOS.includes(r.id)
      );

      if (!temPermissao) {
        return interaction.reply({
          content:
            "❌ Você não tem permissão para usar este comando.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // 📄 Verifica se o arquivo existe
      if (!fs.existsSync(ARQUIVO)) {
        return interaction.reply({
          content:
            "⚠️ Ainda não há planilha gerada. Registre uma ação com `/acao` para criar `acoes_dpd.xlsx`.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // 📎 Anexa a planilha no canal
      const attachment = new AttachmentBuilder(ARQUIVO, { name: "acoes_dpd.xlsx" });

      await interaction.reply({
        content: "📊 Aqui está a planilha de resultados atual:",
        files: [attachment],
      });
    } catch (err) {
      console.error("Erro no /planilha:", err);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: "❌ Ocorreu um erro ao enviar a planilha.",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "❌ Ocorreu um erro ao enviar a planilha.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
