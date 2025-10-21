// commands/mensagem.js — Envia uma mensagem no canal atual
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mensagem')
    .setDescription('Faz o bot enviar uma mensagem no canal atual.')
    .addStringOption(o =>
      o.setName('texto')
        .setDescription('Mensagem a ser enviada')
        .setRequired(true)
    ),

  async execute(interaction) {
    // 🛡️ Verificação de permissão via ID de cargo
    const cargosPermitidosIDs = [
      "1222682312035143710", // Council 💠
      "1238253951535681536"  // Internal Investigation ⚖️
    ];

    const temPermissao = interaction.member.roles.cache.some(r =>
      cargosPermitidosIDs.includes(r.id)
    );

    if (!temPermissao) {
      return interaction.reply({
        content: "❌ Você não tem permissão para usar este comando. Apenas membros do **Council 💠** ou da **Internal Investigation ⚖️** podem utilizar.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // 🔹 Executa o envio da mensagem
    const texto = interaction.options.getString('texto', true);
    await interaction.channel.send(texto);

    // 🔸 Confirmação visível apenas para quem executou o comando
    await interaction.reply({
      content: '✅ Mensagem enviada com sucesso.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
