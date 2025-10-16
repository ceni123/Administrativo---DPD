// index.js — BOT DPD (Hierarquia + Anônimo + Mensagem + Denúncia com BOTÃO reutilizável)

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
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

// ======= 1) CLIENT =======
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // Necessário para ler cargos
  ],
});

client.commands = new Collection();

// ======= 2) IMPORTA OS COMANDOS =======
const hierarquia = require('./commands/hierarquia.js');
const anonimo = require('./commands/anonimo.js');
const mensagem = require('./commands/mensagem.js');
const denuncia = require('./commands/denuncia.js');

client.commands.set(hierarquia.data.name, hierarquia);
client.commands.set(anonimo.data.name, anonimo);
client.commands.set(mensagem.data.name, mensagem);
client.commands.set(denuncia.data.name, denuncia);

// ======= 3) REGISTRO DE COMANDOS =======
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Bot conectado como ${c.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
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
    console.log('✅ Todos os comandos foram registrados na guild com sucesso.');
  } catch (err) {
    console.error('❌ Erro ao registrar comandos:', err);
  }
});

// ======= 4) FUNÇÃO AUXILIAR (hierarquia) =======
async function gerarHierarquia(guild, unidade) {
  const embed = new EmbedBuilder()
    .setColor('#003366')
    .setTitle(`📋 Hierarquia DPD - ${unidade.toUpperCase()}`)
    .setDescription(`Lista automática de cargos da unidade ${unidade}`)
    .setFooter({ text: 'Departamento de Polícia de Detroit' })
    .setTimestamp();

  return embed;
}

// ======= 5) INTERAÇÕES =======
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
        await interaction.followUp({ content: '❌ Erro ao executar o comando.', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ Erro ao executar o comando.', ephemeral: true });
      }
    }
    return;
  }

  // ===== BOTÃO DE DENÚNCIA =====
  if (interaction.isButton() && interaction.customId === 'abrir_denuncia') {
    const categoria = interaction.guild.channels.cache.find(
      (c) =>
        c.name.toLowerCase().includes("ticket´s i.n.v") &&
        c.type === ChannelType.GuildCategory
    );

    if (!categoria) {
      await interaction.reply({
        content: '❌ Categoria **"Ticket´s I.N.V"** não encontrada no servidor.',
        ephemeral: true,
      });
      return;
    }

    const randomId = Math.floor(Math.random() * 100000);

    // Cria canal de denúncia
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
      ephemeral: true,
    });
  }
});

// ======= 6) COMANDO /denuncia MOSTRA O PAINEL FIXO =======
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'denuncia') return;

  const embed = new EmbedBuilder()
    .setColor('#D32F2F')
    .setTitle('Central do Internal Investigation')
    .setDescription(
      'Nessa seção, você pode realizar denúncias para a corregedoria.\n\nClique no botão abaixo para abrir um ticket de denúncia.'
    )
    .setFooter({ text: 'Departamento de Polícia de Detroit' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('abrir_denuncia')
      .setLabel('⚖️ Abrir denúncia contra oficiais')
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({ embeds: [embed], components: [row] });
});

// ======= 7) LOGIN + KEEP ALIVE =======
client.login(process.env.BOT_TOKEN);

setInterval(() => {
  console.log('✅ Bot ativo e conectado...');
}, 60000);
