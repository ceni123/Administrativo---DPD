const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anonimo')
    .setDescription('Envia uma mensagem anônima no privado de um usuário.')
    .addUserOption(option =>
      option
        .setName('destinatario')
        .setDescription('Selecione o usuário que receberá a mensagem.')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('mensagem')
        .setDescription('Digite a mensagem que será enviada de forma anônima.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const destinatario = interaction.options.getUser('destinatario');
    const mensagem = interaction.options.getString('mensagem');

    try {
      // Envia DM ao destinatário
      await destinatario.send(`📩 **Mensagem Oficial DPD:**\n> ${mensagem}`);

      // Responde de forma privada ao autor do comando
      await interaction.reply({
        content: `✅ Mensagem anônima enviada com sucesso para **${destinatario.tag}**.`,
        ephemeral: true,
      });

      console.log(`Mensagem anônima enviada para ${destinatario.tag} por ${interaction.user.tag}`);
    } catch (error) {
      console.error('Erro ao enviar mensagem anônima:', error);
      await interaction.reply({
        content:
          '❌ Não consegui enviar a mensagem. O usuário pode ter o recebimento de mensagens privadas desativado.',
        ephemeral: true,
      });
    }
  },
};
