const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hierarquia')
    .setDescription('Mostra a hierarquia das unidades da DPD'),

  async execute(interaction) {
    // Cria o menu suspenso
    const menu = new StringSelectMenuBuilder()
      .setCustomId('unidade_select')
      .setPlaceholder('Selecione a unidade para ver a hierarquia')
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
      content: 'Escolha a unidade abaixo para ver a hierarquia completa:',
      components: [row],
      ephemeral: true
    });
  },
};
