const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hierarquia')
    .setDescription('Exibe a hierarquia de uma unidade do DPD.'),

  async execute(interaction) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId('unidade_select')
      .setPlaceholder('Selecione uma unidade...')
      .addOptions([
        { label: 'FAST', value: 'fast', description: 'Força Aérea Especial' },
        { label: 'SWAT', value: 'swat', description: 'Unidade Tática' },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    const embed = new EmbedBuilder()
      .setColor('#003366')
      .setTitle('📋 Hierarquia DPD')
      .setDescription('Selecione abaixo a unidade para visualizar a hierarquia.')
      .setFooter({ text: 'Departamento de Polícia de Detroit' });

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
