// commands/intimar.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("intimar")
    .setDescription("Emite uma intimação oficial da I.N.V.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuário a ser intimado")
        .setRequired(true)
    ),

  async execute(interaction) {
    const usuario = interaction.options.getUser("usuario");

    // 🔍 Busca a categoria de INTIMAÇÕES
    const categoria = interaction.guild.channels.cache.find(
      (c) =>
        c.name.toLowerCase().includes("intimações i.n.v") &&
        c.type === ChannelType.GuildCategory
    );

    if (!categoria) {
      await interaction.reply({
        content: '❌ Categoria **"INTIMAÇÕES I.N.V"** não encontrada no servidor.',
        ephemeral: true,
      });
      return;
    }

    // 🔍 Busca o cargo da I.N.V.
    const invRole = interaction.guild.roles.cache.find(
      (r) => r.name.toLowerCase().includes("internal investigation")
    );

    if (!invRole) {
      await interaction.reply({
        content: '❌ Cargo **"Internal Investigation ⚖️"** não encontrado no servidor.',
        ephemeral: true,
      });
      return;
    }

    // Gera nome único pro canal
    const nomeCanal = `intimacao-${usuario.username}`;

    // 🏗️ Cria o canal privado
    const canal = await interaction.guild.channels.create({
      name: nomeCanal,
      type: ChannelType.GuildText,
      parent: categoria.id,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone, // Bloqueia todos
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: usuario.id, // Intimado
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: invRole.id, // Investigadores I.N.V.
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ],
    });

    // 📜 Mensagem de intimação
    const embed = new EmbedBuilder()
      .setColor("#EFB84A")
      .setTitle("📜 Intimação Oficial - Internal Investigation ⚖️")
      .setDescription(
        `Olá, ${usuario}.\n\nVocê está sendo **intimado para esclarecimento de fatos**. Solicitamos que informe uma **data e horário** em que esteja em QRV, para que os devidos esclarecimentos sejam prestados.\n\nPermanecemos à disposição para alinhar o atendimento.`
      )
      .setFooter({ text: "Departamento de Polícia de Detroit" })
      .setTimestamp();

    await canal.send({ embeds: [embed] });

    // ✅ Confirmação para quem executou o comando
    await interaction.reply({
      content: `✅ Canal de intimação criado com sucesso: ${canal}`,
      ephemeral: true,
    });
  },
};
