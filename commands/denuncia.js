const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('denuncia')
    .setDescription('Abre o painel para realizar denúncias à Internal Investigation.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('Central do Internal Investigation')
      .setDescription('Nessa seção, você pode realizar denúncias para a corregedoria.')
      .setImage('https://cdn.discordapp.com/attachments/1285453283634579530/1306796828758622248/banner_inv.png?ex=67398c26&is=67383aa6&hm=41f1b4ab902210fbc2343a1d3242216307c5e2e7e4aa54b6e1c6ff67f0e2859b&');

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('denuncia_menu')
        .setPlaceholder('Selecione uma opção...')
        .addOptions([
          {
            label: 'Denúncia contra oficiais',
            description: 'Registrar uma denúncia contra um membro da corporação.',
            value: 'contra_oficial',
            emoji: '⚖️',
          },
        ])
    );

    await interaction.reply({ embeds: [embed], components: [menu] });
  },
};
