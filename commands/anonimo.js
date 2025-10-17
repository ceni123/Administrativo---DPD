// commands/anonimo.js — envia UMA mensagem anônima para o destinatário

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anonimo')
    .setDescription('Envia uma mensagem anônima no DM de um usuário.')
    .addUserOption(o =>
      o.setName('para')
        .setDescription('Destinatário da mensagem')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('mensagem')
        .setDescription('Conteúdo a ser enviado de forma anônima')
        .setRequired(true)
    ),

  async execute(interaction) {
    const destino = interaction.options.getUser('para', true);
    const texto = interaction.options.getString('mensagem', true);

    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setTitle('📩 Mensagem anônima')
      .setDescription(texto)
      .setFooter({ text: 'Departamento de Polícia de Detroit' })
      .setTimestamp();

    try {
      // 👉 Envia UMA ÚNICA mensagem ao destinatário
      await destino.send({ embeds: [embed] });

      // Confirmação só para quem executou o comando
      await interaction.reply({
        content: `✅ Mensagem anônima enviada para **${destino.tag}**.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error('Erro ao enviar DM:', err);
      await interaction.reply({
        content: `❌ Não consegui enviar DM para **${destino.tag}** (provavelmente está fechado).`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
