// index.js — BOT DPD COMPLETO (Hierarquia Automática + Anônimo + Mensagem + Denúncia + Arquivar + Intimar + Log + Registro em 2 Servidores)

const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  REST,
  Routes,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} = require("discord.js");

// ======= 1) CLIENT =======
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

// ======= 2) IMPORTA OS COMANDOS =======
const hierarquia = require("./commands/hierarquia.js");
const anonimo = require("./commands/anonimo.js");
const mensagem = require("./commands/mensagem.js");
const denuncia = require("./commands/denuncia.js");
const arquivar = require("./commands/arquivar.js");
const intimar = require("./commands/intimar.js");

client.commands.set(hierarquia.data.name, hierarquia);
client.commands.set(anonimo.data.name, anonimo);
client.commands.set(mensagem.data.name, mensagem);
client.commands.set(denuncia.data.name, denuncia);
client.commands.set(arquivar.data.name, arquivar);
client.commands.set(intimar.data.name, intimar);

// ======= 3) REGISTRO DE COMANDOS (APENAS EM 2 SERVIDORES) =======
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Bot conectado como ${c.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
  const commandsJson = [
    hierarquia.data.toJSON(),
    anonimo.data.toJSON(),
    mensagem.data.toJSON(),
    denuncia.data.toJSON(),
    arquivar.data.toJSON(),
    intimar.data.toJSON(),
  ];

  // IDs dos servidores autorizados (definidos no Render → Environment)
  const servidores = [
    process.env.GUILD_ID_1, // Servidor principal (DPD)
    process.env.GUILD_ID_2, // Servidor de testes
  ];

  try {
    for (const guildId of servidores) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.APP_ID, guildId),
        { body: commandsJson }
      );
      console.log(`✅ Comandos registrados no servidor: ${guildId}`);
    }
    console.log("⚙️ Comandos registrados nos servidores definidos com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao registrar comandos nas guilds:", err);
  }
});

// ======= 4) INTERAÇÕES =======
client.on(Events.InteractionCreate, async (interaction) => {
  // ===== SLASH COMMANDS =====
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);

      // ===== LOG AUTOMÁTICO =====
      const logChannel = interaction.guild.channels.cache.find(
        (c) =>
          c.name.toLowerCase().includes("log-botdpd") &&
          c.type === ChannelType.GuildText
      );

      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor("#EFB84A")
          .setTitle("📜 Registro de Comando")
          .setDescription(
            `**Usuário:** ${interaction.user} | ${interaction.user.tag}\n` +
            `**Comando:** \`/${interaction.commandName}\`\n` +
            `**Ação:** ✅ Comando executado com sucesso.\n` +
            `**Canal:** ${interaction.channel}`
          )
          .setFooter({ text: "Departamento de Polícia de Detroit" })
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      } else {
        console.warn("⚠️ Canal de log '⭐│log-botdpd' não encontrado.");
      }
    } catch (err) {
      console.error("❌ Erro ao executar comando:", err);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: "❌ Erro ao executar o comando.",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "❌ Erro ao executar o comando.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
    return;
  }

  // ===== SELECT MENU DE HIERARQUIA =====
  if (interaction.isStringSelectMenu() && interaction.customId === "unidade_select") {
    await interaction.deferUpdate();
    const unidade = interaction.values[0];
    const embed = await hierarquia.gerarHierarquiaEmbed(interaction.guild, unidade);

    if (!embed) {
      await interaction.channel.send("❌ Unidade não encontrada.");
      return;
    }

    await interaction.channel.send({ embeds: [embed] });
  }

  // ===== BOTÃO DE DENÚNCIA =====
  if (interaction.isButton() && interaction.customId === "abrir_denuncia") {
    const categoria = interaction.guild.channels.cache.find(
      (c) =>
        c.name.toLowerCase().includes("ticket´s i.n.v") &&
        c.type === ChannelType.GuildCategory
    );

    if (!categoria) {
      await interaction.reply({
        content: '❌ Categoria **"Ticket´s I.N.V"** não encontrada no servidor.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const randomId = Math.floor(Math.random() * 100000);

    const canal = await interaction.guild.channels.create({
      name: `denuncia-${interaction.user.username}-${randomId}`,
      type: ChannelType.GuildText,
      parent: categoria.id,
      topic: `Denúncia aberta por ${interaction.user.tag}`,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ],
    });

    await canal.send(
      `📢 **Denúncia iniciada por:** ${interaction.user}\n\nPor favor, descreva a denúncia abaixo com o máximo de detalhes possíveis.`
    );

    await interaction.reply({
      content: `✅ Canal de denúncia criado com sucesso: ${canal}`,
      flags: MessageFlags.Ephemeral,
    });
  }
});

// ======= 5) LOGIN + KEEP ALIVE =======
client.login(process.env.BOT_TOKEN);

setInterval(() => {
  console.log("✅ Bot ativo e conectado...");
}, 60000);
