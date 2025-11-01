// commands/planilha.js — Envia a planilha de resultados (persistente + acesso restrito por cargo)
const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

/* ========= Persistência (MESMA DO /acao) ========= */
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const LEGACY_FILE_PATH = path.join(__dirname, "../acoes_dpd.xlsx"); // caminho antigo (no código)
const FILE_PATH = path.join(DATA_DIR, "acoes_dpd.xlsx");            // caminho persistente

function ensureDataDirAndMigrate() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(LEGACY_FILE_PATH) && !fs.existsSync(FILE_PATH)) {
    try { fs.copyFileSync(LEGACY_FILE_PATH, FILE_PATH); }
    catch (e) { console.warn("⚠️ Falha ao migrar XLSX legado:", e); }
  }
}

/* ========= Cargos autorizados ========= */
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
    .setDescription("Anexa no canal a planilha de resultados (acesso restrito por cargo)."),

  async execute(interaction) {
    try {
      ensureDataDirAndMigrate();

      // 🛡️ Permissão por cargo
      const temPermissao = interaction.member?.roles?.cache?.some((r) =>
        CARGOS_AUTORIZADOS.includes(r.id)
      );
      if (!temPermissao) {
        await interaction.reply({
          content: "❌ Você não tem permissão para usar este comando.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // 📄 Arquivo existe?
      if (!fs.existsSync(FILE_PATH)) {
        await interaction.reply({
          content: "⚠️ Ainda não há planilha gerada. Registre uma ação com `/acao` para criar **acoes_dpd.xlsx**.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // (Opcional) valida se abre como XLSX
      try { XLSX.readFile(FILE_PATH); } catch (e) {
        console.warn("⚠️ XLSX com problema:", e);
      }

      // 📎 Envia no canal (público). Se quiser privado, adicione flags: MessageFlags.Ephemeral.
      await interaction.reply({
        content: "📊 Aqui está a planilha de resultados atual:",
        files: [{ attachment: FILE_PATH, name: "acoes_dpd.xlsx" }],
      });
    } catch (err) {
      console.error("Erro no /planilha:", err);
      const payload = {
        content: "❌ Ocorreu um erro ao enviar a planilha.",
        flags: MessageFlags.Ephemeral,
      };
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  },
};
