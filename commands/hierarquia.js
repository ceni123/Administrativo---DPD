// Importa as ferramentas do Discord.js
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

// Exporta o comando para o bot reconhecer
module.exports = {
  // Cria o comando /hierarquia
  data: new SlashCommandBuilder()
    .setName('hierarquia')
    .setDescription('Escolha a unidade da DPD para ver a hierarquia'),

  // O que o bot faz quando o comando é usado
  async execute(interaction) {
    // Cria o menu suspenso (dropdown)
    const menu = new StringSelectMenuBuilder()
      .setCustomId('unidade_select')
      .setPlaceholder('Escolha a unidade') // texto que aparece antes de escolher
      .addOptions([
        { label: 'Detective Unit', value: 'detective' },
        { label: 'SWAT', value: 'swat' },
        { label: 'FAST', value: 'fast' },
        { label: 'DAF', value: 'daf' },
        { label: 'MARY', value: 'mary' },
        { label: 'DAF Atiradores', value: 'dafatiradores' },
        { label: 'Internal Investigation', value: 'internal' },
      ]);

    // Coloca o menu dentro de uma “linha” para o Discord entender
    const row = new ActionRowBuilder().addComponents(menu);

    // Manda a mensagem com o menu
    await interaction.reply({
      content: 'Escolha abaixo a unidade para ver a hierarquia:',
      components: [row],
      ephemeral: false, // deixa visível para todos
    });
  },
};
