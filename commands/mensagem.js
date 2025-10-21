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
