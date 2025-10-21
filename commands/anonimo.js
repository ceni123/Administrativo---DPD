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
    // 🛡️ Verificação de permissão
    const cargosPermitidos = ["Council 💠", "Internal Investigation ⚖️"];
    const temPermissao = interaction.member.roles.cache.some(r =>
      cargosPermitidos.includes(r.name)
    );

    if (!temPermissao) {
      return interaction.reply({
        content: "❌ Você não tem permissão para usar este comando. Apenas membros do **Council 💠** ou da **Internal Investigation ⚖️** podem utilizar.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // 🔹 Se passou na verificação, continua normalmente
    const destino = interaction.options.getUser('para', true);
    const texto = interaction.options.getString('mensagem', true);

    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setTitle('📩 Mensagem anônima')
      .setDescription(texto)
      .setFooter({ text: 'Departamento de Polícia de Detroit' })
      .setTimestamp();

    try {
      await destino.send({ embeds: [embed] });

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
