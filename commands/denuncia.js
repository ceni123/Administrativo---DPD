// commands/denuncia.js — Painel público com botão reutilizável
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('denuncia')
    .setDescription('Exibe o painel de denúncias da corregedoria.'),

  async execute(interaction) {
    // 🛡️ Verificação de permissão para usar o comando
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

    // 🔹 Criação do painel
    const embed = new EmbedBuilder()
      .setColor('#D32F2F')
      .setTitle('Central do Internal Investigation')
      .setDescription(
        'Nessa seção, você pode realizar denúncias para a corregedoria.\n\nClique no botão abaixo para abrir um **ticket de denúncia**.'
      )
      .setFooter({ text: 'Departamento de Polícia de Detroit' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('abrir_denuncia')
        .setLabel('⚖️ Abrir denúncia contra oficiais')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
