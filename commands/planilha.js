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
};// commands/planilha.js — Envia a planilha XLSX (usa o mesmo diretório persistente do /acao)
const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

/* ========= Config de persistência (MESMA DO /acao) ========= */
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const LEGACY_FILE_PATH = path.join(__dirname, "../acoes_dpd.xlsx");   // arquivo antigo (na pasta do projeto)
const FILE_PATH = path.join(DATA_DIR, "acoes_dpd.xlsx");              // arquivo válido (persistente)

function ensureDataDirAndMigrate() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  // se existir o legado e não existir o persistente, copia
  if (fs.existsSync(LEGACY_FILE_PATH) && !fs.existsSync(FILE_PATH)) {
    try { fs.copyFileSync(LEGACY_FILE_PATH, FILE_PATH); } catch (e) { console.warn("⚠️ Falha ao migrar XLSX legado:", e); }
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("planilha")
    .setDescription("Baixar a planilha de ações (acoes_dpd.xlsx)."),

  async execute(interaction) {
    try {
      ensureDataDirAndMigrate();

      // Se ainda não existe, avisa para registrar uma ação primeiro
      if (!fs.existsSync(FILE_PATH)) {
        await interaction.reply({
          content: "⚠️ Ainda não há planilha gerada. Registre uma ação com `/acao` para criar **acoes_dpd.xlsx**.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // (Opcional) Valida se o arquivo é um XLSX abrível
      try { XLSX.readFile(FILE_PATH); } catch (e) {
        console.warn("⚠️ XLSX corrompido/inalcansável:", e);
      }

      await interaction.reply({
        content: "📎 Aqui está a planilha atual:",
        files: [{ attachment: FILE_PATH, name: "acoes_dpd.xlsx" }],
        flags: MessageFlags.Ephemeral, // troque para enviar público, se preferir
      });
    } catch (err) {
      console.error("Erro no /planilha:", err);
      try {
        await interaction.reply({
          content: "❌ Ocorreu um erro ao enviar a planilha.",
          flags: MessageFlags.Ephemeral,
        });
      } catch {}
    }
  },
};

