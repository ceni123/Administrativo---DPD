// commands/verificar_roles.js — Mostra no Discord os cargos que o bot consegue enxergar e quantos membros há em cada um

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verificar_roles")
    .setDescription("Verifica se o bot consegue ler os cargos e quantos membros existem em cada um (debug interno)."),

  async execute(interaction) {
    // 🛡️ Verificação de permissão via ID de cargo
    const cargosPermitidosIDs = [
      "1222682312035143710", // Council 💠
      "1238253951535681536"  // Internal Investigation ⚖️
    ];

    const temPermissao = interaction.member.roles.cache.some(r =>
      cargosPermitidosIDs.includes(r.id)
    );

    if (!temPermissao) {
      return interaction.reply({
        content: "❌ Você não tem permissão para usar este comando. Apenas membros do **Council 💠** ou da **Internal Investigation ⚖️** podem utilizar.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const guild = interaction.guild;

      // 🔥 Garante que todos os membros estão carregados
      await guild.members.fetch();

      // Monta a lista de cargos (ignorando @everyone)
      const rolesInfo = guild.roles.cache
        .filter(r => r.name !== "@everyone")
        .sort((a, b) => b.position - a.position)
        .map(r => `• **${r.name}** — ${r.members.size} membro(s)`)
        .slice(0, 50); // limita para evitar embed gigante

      const embed = new EmbedBuilder()
        .setColor("#2b2d31")
        .setTitle("🧩 Verificação de Cargos")
        .setDescription(
          rolesInfo.length
            ? rolesInfo.join("\n")
            : "❌ Nenhum cargo encontrado (o bot pode não ter permissão de leitura)."
        )
        .setFooter({ text: "Departamento de Polícia de Detroit" })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error("Erro ao verificar roles:", err);
      await interaction.reply({
        content: "❌ Ocorreu um erro ao tentar verificar os cargos. Veja o console para mais detalhes.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
