const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mensagem')
    .setDescription('Faz o bot enviar uma mensagem no canal atual.')
    .addStringOption(o =>
      o.setName('texto').setDescription('Mensagem a ser enviada').setRequired(true)),

  async execute(interaction) {
    const texto = interaction.options.getString('texto', true);
    await interaction.channel.send(texto);
    await interaction.reply({
      content: '✅ Mensagem enviada com sucesso.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
