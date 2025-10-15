const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hierarquia')
    .setDescription('Escolha a unidade para ver a hierarquia'),

  async execute(interaction) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId('unidade_select')
      .setPlaceholder('Escolha a unidade')
      .addOptions([
        { label: 'Detective Unit', value: 'detective' },
        { label: 'SWAT', value: 'swat' },
        { label: 'FAST', value: 'fast' },
        { label: 'DAF', value: 'daf' },
        { label: 'MARY', value: 'mary' },
        { label: 'DAF Atiradores', value: 'dafatiradores' },
        { label: 'Internal Investigation', value: 'internal' },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      content: 'Escolha a unidade para visualizar a hierarquia:',
      components: [row],
      ephemeral: true, // só visível pra quem usou o comando
    });
  },
};
