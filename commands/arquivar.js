// commands/arquivar.js — Move o canal atual para "Ticket´s I.N.V Arquivado"

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("arquivar")
    .setDescription("Arquiva o canal atual movendo-o para 'Ticket´s I.N.V Arquivado'.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    try {
      const canalAtual = interaction.channel;
      const guild = interaction.guild;

      // Procura a categoria pelo nome (sem depender de ID)
      const categoriaArquivada = guild.channels.cache.find(
        (c) =>
          c.name.toLowerCase().includes("ticket´s i.n.v arquivado") &&
          c.type === 4 // 4 = Categoria
      );

      if (!categoriaArquivada) {
        await interaction.reply({
          content: '❌ Categoria **"Ticket´s I.N.V Arquivado"** não encontrada no servidor.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Move o canal
      await canalAtual.setParent(categoriaArquivada.id);

      // Ajusta as permissões para impedir novas mensagens
      await canalAtual.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: false,
      });

      await interaction.reply({
        content: `📁 O canal **${canalAtual.name}** foi movido para a categoria **Ticket´s I.N.V Arquivado**.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Erro ao arquivar canal:", error);
      await interaction.reply({
        content: "❌ Ocorreu um erro ao tentar arquivar este canal.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
