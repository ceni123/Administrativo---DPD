const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anonimo')
    .setDescription('Envia uma mensagem anônima no DM de alguém.')
    .addUserOption(o =>
      o.setName('para').setDescription('Destinatário').setRequired(true))
    .addStringOption(o =>
      o.setName('mensagem').setDescription('Conteúdo a ser enviado').setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('para', true);
    const texto = interaction.options.getString('mensagem', true);

    try {
      await user.send(`📩 **Mensagem Oficial DPD:**\n${texto}`);
      await interaction.reply({
        content: `✅ Mensagem enviada no DM de **${user.tag}**.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch {
      await interaction.reply({
        content: `❌ Não foi possível enviar DM para **${user.tag}** (provavelmente fechado).`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
