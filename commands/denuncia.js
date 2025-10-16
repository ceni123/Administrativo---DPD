// commands/denuncia.js
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('denuncia')
    .setDescription('Abrir painel de denúncias para a corregedoria (Internal Investigation).'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('Central do Internal Investigation')
      .setDescription('Nessa seção, você pode realizar denúncias para a corregedoria.')
      // TROQUE a URL abaixo pela do seu banner (a mesma que você usou no exemplo)
      .setImage('https://SEU-LINK-DA-IMAGEM.png')
      .setFooter({ text: 'Departamento de Polícia de Detroit' });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('denuncia_menu') // <-- usaremos esse ID no index.js
      .setPlaceholder('Selecione uma opção...')
      .addOptions([
        {
          label: 'Denúncia contra oficiais',
          description: 'Abrir um ticket para denunciar um oficial do departamento.',
          value: 'contra_oficial',
          emoji: '⚖️',
        },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    // Mensagem pública (todo mundo com acesso ao canal vê)
    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
