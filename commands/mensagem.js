const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mensagem')
    .setDescription('Faz o bot enviar uma mensagem neste canal.')
    .addStringOption(option =>
      option
        .setName('texto')
        .setDescription('Digite a mensagem que o bot deve enviar.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const texto = interaction.options.getString('texto');

    try {
      // Envia a mensagem no canal onde o comando foi executado
      await interaction.channel.send(texto);

      // Confirma de forma privada ao autor do comando
      await interaction.reply({
        content: '✅ Mensagem enviada com sucesso!',
        ephemeral: true,
      });

      console.log(`Mensagem enviada por ${interaction.user.tag}: ${texto}`);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao tentar enviar a mensagem.',
        ephemeral: true,
      });
    }
  },
};
