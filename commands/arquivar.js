// commands/arquivar.js — Corrigido com ID fixo da categoria e remoção do autor

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("arquivar")
    .setDescription("Arquiva o canal atual movendo-o para 'Ticket´s I.N.V Arquivado'.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
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

    const canalAtual = interaction.channel;
    const guild = interaction.guild;
    const categoriaID = "1345459676636119110";

    try {
      const categoria = await guild.channels.fetch(categoriaID);
      if (!categoria) {
        return interaction.reply({
          content: '❌ Categoria de arquivados não encontrada (verifique se o ID está correto).',
          flags: MessageFlags.Ephemeral,
        });
      }

      // 🔄 Move o canal para a nova categoria
      await canalAtual.setParent(categoria.id);

      // ❌ Remove a permissão do autor (quem abriu o canal)
      const mensagens = await canalAtual.messages.fetch({ limit: 10 });
      const primeiraMsg = mensagens.last(); // pega a mais antiga
      const autor = primeiraMsg?.author;

      if (autor) {
        await canalAtual.permissionOverwrites.edit(autor.id, {
          ViewChannel: false,
        });
      }

      // 🔒 Impede novas mensagens do @everyone
      await canalAtual.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: false,
      });

      await interaction.reply({
        content: `📁 O canal **${canalAtual.name}** foi movido com sucesso para a categoria de arquivados.`,
        flags: MessageFlags.Ephemeral,
      });

    } catch (error) {
      console.error("❌ Erro ao arquivar canal:", error);
      await interaction.reply({
        content: `❌ Erro ao mover o canal para a categoria de arquivados.\n\n**Erro técnico:** ${error.message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
