// index.js — BOT DPD com hierarquia dinâmica
const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  REST,
  Routes,
  EmbedBuilder,
} = require('discord.js');

// ======= 1) CONFIGURAÇÃO DO CLIENT =======
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // Necessário para ler cargos
  ],
});

client.commands = new Collection();

// ======= 2) IMPORTA O COMANDO /hierarquia =======
const hierarquia = require('./commands/hierarquia.js');
client.commands.set(hierarquia.data.name, hierarquia);

// ======= 3) REGISTRA O COMANDO =======
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Bot conectado como ${c.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
  const commandsJson = [hierarquia.data.toJSON()];

  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
      { body: commandsJson }
    );
    console.log('✅ /hierarquia registrado com sucesso.');
  } catch (err) {
    console.error('❌ Erro ao registrar comandos:', err);
  }
});

// ======= 4) FUNÇÃO: GERA HIERARQUIA AUTOMÁTICA =======
async function gerarHierarquia(guild, unidade) {
  // Ajuste os nomes dos cargos conforme seu servidor
  const divisaoCargos = {
    FAST: [
      'Supervisor FAST',
      'Manager FAST',
      'Sub-Manager FAST',
      'Counselor FAST',
      'Elite Pilot FAST',
      'Veteran Pilot FAST',
      'Official Pilot FAST',
      'Probationary Pilot FAST',
    ],
    SWAT: [
      'Supervisor SWAT',
      'Manager SWAT',
      'Sub-Manager SWAT',
      'Operador SWAT',
      'Recruta SWAT',
    ],
    DAF: [
      'Supervisor DAF',
      'Manager DAF',
      'Sub-Manager DAF',
      'Agente DAF',
      'Recruta DAF',
    ],
  };

  const cargos = divisaoCargos[unidade.toUpperCase()];
  if (!cargos) return null;

  let descricao = '';

  for (const nomeCargo of cargos) {
    const cargo = guild.roles.cache.find(r => r.name === nomeCargo);
    if (!cargo) {
      descricao += `**${nomeCargo}:**\n_Cargo não encontrado_\n\n`;
      continue;
    }

    const membros = cargo.members.map(m => `${m.user}`).join('\n');
    descricao += `**${nomeCargo}:**\n${membros || '_Vazio_'}\n\n`;
  }

  const embed = new EmbedBuilder()
    .setColor(0x003366)
    .setTitle(`📋 Hierarquia - ${unidade}`)
    .setDescription(descricao)
    .setFooter({ text: 'Departamento de Polícia de Detroit' })
    .setTimestamp();

  return embed;
}

// ======= 5) TRATA INTERAÇÕES =======
client.on(Events.InteractionCreate, async (interaction) => {
  // Slash commands
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

  // Menu de seleção do /hierarquia
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
});

// ======= 6) LOGIN =======
client.login(process.env.BOT_TOKEN);
