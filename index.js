// index.js — BOT DPD completo (Hierarquia + Anônimo + Mensagem + Denúncia)

const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  REST,
  Routes,
  EmbedBuilder,
  PermissionFlagsBits,
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
  // Aqui você pode adaptar para ler cargos do servidor
  // ou usar embeds prontos por unidade
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

  // ===== SELECT MENU DE HIERARQUIA =====
  if (interaction.isStringSelectMenu() && interaction.customId === 'unidade_select') {
    await interaction.deferUpdate();
    const unidade = interaction.values[0];
    const embed = await gerarHierarquia(interaction.guild, unidade);

    if (!embed) {
      await interaction.channel.send('❌ Unidade não encontrada.');
      return;
    }

    await interaction.channel.send({ embeds: [embed] });
  }

  // ===== SELECT MENU DE DENÚNCIA =====
  if (interaction.isStringSelectMenu() && interaction.customId === 'denuncia_menu') {
    const escolha = interaction.values[0];

    if (escolha === 'contra_oficial') {
      // Procura categoria "Ticket´s I.N.V"
      const categoria = interaction.guild.channels.cache.find(
        (c) => c.name === "Ticket´s I.N.V" && c.type === 4 // type 4 = categoria
      );

      if (!categoria) {
        await interaction.reply({
          content: '❌ Categoria "Ticket´s I.N.V" não encontrada no servidor.',
          ephemeral: true,
        });
        return;
      }

      // Cria canal privado
      const canal = await interaction.guild.channels.create({
        name: `denuncia-${interaction.user.username}`,
        type: 0, // Canal de texto
        parent: categoria.id,
        permissionOverwrites: [
          {
            id: interaction.guild.id, // Todos
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id, // Autor
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
      });

      // Mensagem inicial no canal
      await canal.send(
        `📢 **Denúncia iniciada por:** ${interaction.user}\n\nPor favor, descreva a denúncia abaixo com o máximo de detalhes possíveis.`
      );

      await interaction.reply({
        content: `✅ Canal criado com sucesso: ${canal}`,
        ephemeral: true,
      });
    }
  }
});

// ======= 6) LOGIN =======
client.login(process.env.BOT_TOKEN);
// Mantém o bot ativo no Render (impede que o Render desligue o processo)
setInterval(() => {
  console.log('✅ Bot ativo e conectado...');
}, 60000); // repete a cada 60 segundos (1 minuto)

