// index.js — BOT DPD COMPLETO (Hierarquia Automática + Anônimo + Mensagem + Denúncia)

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

client.commands.set(hierarquia.data.name, hierarquia);
client.commands.set(anonimo.data.name, anonimo);
client.commands.set(mensagem.data.name, mensagem);
client.commands.set(denuncia.data.name, denuncia);

// ======= 3) REGISTRO DE COMANDOS =======
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Bot conectado como ${c.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
  const commandsJson = [
    hierarquia.data.toJSON(),
    anonimo.data.toJSON(),
    mensagem.data.toJSON(),
    denuncia.data.toJSON(),
  ];

  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
      { body: commandsJson }
    );
    console.log("✅ Todos os comandos foram registrados na guild com sucesso.");
  } catch (err) {
    console.error("❌ Erro ao registrar comandos:", err);
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
    } catch (err) {
      console.error(err);
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
