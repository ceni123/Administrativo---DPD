// commands/intimar.js — Cria canal privado de intimação oficial
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, MessageFlags } = require("discord.js");

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
        flags: MessageFlags.Ephemeral,
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
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // 🔹 Gera nome único pro canal
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

    // ✅ Confirmação privada
    await interaction.reply({
      content: `✅ Canal de intimação criado com sucesso: ${canal}`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
