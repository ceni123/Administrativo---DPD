// index.js — BOT DPD COMPLETO (v1.4.1)
// Hierarquia + Anônimo + Mensagem + Denúncia + Arquivar + Intimar + Log
// + Registro por guild + Verificar Roles + Ação + Planilha + Gráfico + Limpar Ações
// + Limpeza de comandos globais legados

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
const acao = require("./commands/acao.js");
const planilha = require("./commands/planilha.js");
const grafico = require("./commands/grafico.js");
const limparacoes = require("./commands/limparacoes.js");

[
  hierarquia,
  anonimo,
  mensagem,
  denuncia,
  arquivar,
  intimar,
  verificar_roles,
  acao,
  planilha,
  grafico,
  limparacoes,
].forEach((cmd) => {
  if (cmd?.data?.name) client.commands.set(cmd.data.name, cmd);
});

// ======= 3) REGISTRO DE COMANDOS =======
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Bot conectado como ${c.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

  // Limpa comandos globais antigos (evita duplicação quando você usa registro por guild)
  try {
    await rest.put(Routes.applicationCommands(process.env.APP_ID), { body: [] });
    console.log("🧹 Comandos globais antigos removidos com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao limpar comandos globais:", err?.message || err);
  }

  // Monta o JSON dos comandos automaticamente
  const commandsJson = Array.from(client.commands.values())
    .map((c) => c.data?.toJSON?.())
    .filter(Boolean);

  const servidores = [process.env.GUILD_ID_1, process.env.GUILD_ID_2].filter(Boolean);

  if (servidores.length === 0) {
    console.warn("⚠️ Nenhuma GUILD_ID_* definida. Defina GUILD_ID_1/GUILD_ID_2 nas variáveis de ambiente.");
    return;
  }

  try {
    for (const guildId of servidores) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.APP_ID, guildId),
        { body: commandsJson }
      );
      console.log(`✅ Comandos (${commandsJson.length}) registrados no servidor: ${guildId}`);
    }
    console.log("⚙️ Registro concluído nas guilds definidas!");
  } catch (err) {
    console.error("❌ Erro ao registrar comandos nas guilds:", err?.message || err);
  }
});

// ======= 4) INTERAÇÕES =======
client.on(Events.InteractionCreate, async (interaction) => {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);

      // Log automático
      const logChannel = interaction.guild.channels.cache.find(
        (c) =>
          c.type === ChannelType.GuildText &&
          c.name.toLowerCase().includes("log-botdpd")
      );

      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor("#EFB84A")
          .setTitle("📜 Registro de Comando")
          .setDescription(
            `**Usuário:** ${interaction.user} | ${interaction.user.tag}\n` +
            `**Comando:** \`/${interaction.commandName}\`\n` +
            `**Ação:** ✅ Executado com sucesso\n` +
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
      const payload = { content: "❌ Erro ao executar o comando.", flags: MessageFlags.Ephemeral };
      if (interaction.deferred || interaction.replied) await interaction.followUp(payload);
      else await interaction.reply(payload);
    }
    return;
  }

  // Select menu de hierarquia
  if (interaction.isStringSelectMenu() && interaction.customId === "unidade_select") {
    await interaction.deferUpdate();
    const unidade = interaction.values[0];
    const embed = await hierarquia.gerarHierarquiaEmbed(interaction.guild, unidade);
    if (!embed) return interaction.channel.send("❌ Unidade não encontrada.");
    await interaction.channel.send({ embeds: [embed] });
  }

  // Botão de denúncia
  if (interaction.isButton() && interaction.customId === "abrir_denuncia") {
    const categoriaId = "1345458805449818112";
    const categoria = interaction.guild.channels.cache.get(categoriaId);

    if (!categoria) {
      return interaction.reply({
        content: "❌ Categoria de denúncias não encontrada no servidor (verifique o ID).",
        flags: MessageFlags.Ephemeral,
      });
    }

    const invRoleId = "1238253951535681536";     // Internal Investigation ⚖️
    const councilRoleId = "1222682312035143710"; // Council 💠 (opcional)

    const randomId = Math.floor(Math.random() * 100000);

    const canal = await interaction.guild.channels.create({
      name: `denuncia-${interaction.user.username}-${randomId}`,
      type: ChannelType.GuildText,
      parent: categoria.id,
      topic: `Denúncia aberta por ${interaction.user.tag}`,
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: invRoleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
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
