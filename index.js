// index.js — BOT DPD COMPLETO (Hierarquia Automática + Anônimo + Mensagem + Denúncia + Arquivar + Intimar + Log + Registro em 2 Servidores + Verificar Roles + Limpeza de Comandos Duplicados)

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
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
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
const verificar_roles = require("./commands/verificar_roles.js");
const acao = require("./commands/acao.js"); // 🆕 /ação

client.commands.set(hierarquia.data.name, hierarquia);
client.commands.set(anonimo.data.name, anonimo);
client.commands.set(mensagem.data.name, mensagem);
client.commands.set(denuncia.data.name, denuncia);
client.commands.set(arquivar.data.name, arquivar);
client.commands.set(intimar.data.name, intimar);
client.commands.set(verificar_roles.data.name, verificar_roles);
client.commands.set(acao.data.name, acao); // 🆕 registra /ação

// ======= 3) REGISTRO DE COMANDOS (E LIMPEZA GLOBAL) =======
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Bot conectado como ${c.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

  // 🔥 Limpa comandos globais antigos (para remover duplicações)
  try {
    await rest.put(Routes.applicationCommands(process.env.APP_ID), { body: [] });
    console.log("🧹 Comandos globais antigos removidos com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao limpar comandos globais:", err);
  }

  // 💾 Registra comandos apenas nas guilds autorizadas
  const commandsJson = [
    hierarquia.data.toJSON(),
    anonimo.data.toJSON(),
    mensagem.data.toJSON(),
    denuncia.data.toJSON(),
    arquivar.data.toJSON(),
    intimar.data.toJSON(),
    verificar_roles.data.toJSON(),
    acao.data.toJSON(), // 🆕 inclui /ação
  ];

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
    console.log("⚙️ Comandos registrados com sucesso nas guilds definidas!");
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
    // ✅ Categoria fixa por ID
    const categoriaId = "1345458805449818112";
    const categoria = interaction.guild.channels.cache.get(categoriaId);

    if (!categoria) {
      await interaction.reply({
        content: "❌ Categoria de denúncias não encontrada no servidor (verifique o ID).",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // ✅ Cargos que devem ver e falar no ticket
    const invRoleId = "1238253951535681536";     // Internal Investigation ⚖️
    const councilRoleId = "1222682312035143710"; // Council 💠 (opcional; remova se quiser só I.N.V.)

    const randomId = Math.floor(Math.random() * 100000);

    const canal = await interaction.guild.channels.create({
      name: `denuncia-${interaction.user.username}-${randomId}`,
      type: ChannelType.GuildText,
      parent: categoria.id,
      topic: `Denúncia aberta por ${interaction.user.tag}`,
      permissionOverwrites: [
        // Bloqueia todos
        {
          id: interaction.guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        // Autor da denúncia
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        // ✅ Internal Investigation: ver e conversar
        {
          id: invRoleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        // ✅ Council (opcional) — remova este bloco se quiser exclusivo da I.N.V.
        {
          id: councilRoleId,
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
}, 120000); // 2 minutos

// ======= 6) MONITORAMENTO DE ERROS =======
process.on("unhandledRejection", (reason, p) => {
  console.error("🚨 Promessa rejeitada:", p, "Motivo:", reason);
});
