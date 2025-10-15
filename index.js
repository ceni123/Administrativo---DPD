// index.js — BOT DPD com hierarquias automáticas
const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  REST,
  Routes,
  EmbedBuilder,
} = require('discord.js');

// ======= 1) CLIENT =======
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

// ======= 4) FUNÇÃO: GERAR HIERARQUIA AUTOMÁTICA =======
async function gerarHierarquia(guild, unidade) {
  const divisaoCargos = {
    FAST: [
      'Supervisor Fast ⚡',
      'Manager FAST ⚡',
      '(FAST) Sub-Manager ⚡',
      '(FAST) Counselor ⚡',
      '(FAST) Elite Pilot ⚡',
      '(FAST) Veteran Pilot ⚡',
      '(FAST) Official Pilot ⚡',
      '(FAST) Probationary Pilot ⚡',
      '(FAST) Co-Pilot ⚡',
    ],
    SWAT: [
      '(S.W.A.T) Supervisor ☠️',
      '(S.W.A.T) Gestor ☠️',
      '(S.W.A.T) Coordenador ☠️',
      '(S.W.A.T) Instrutor ☠️',
      '(S.W.A.T) Operador ☠️',
      '(S.W.A.T) Probatorio ☠️',
    ],
    DAF: [
      'Supervisor D.A.F. 🏅',
      'Manager D.A.F. 🏅',
      '(DAF) Crew Chief 🏅',
      '(DAF) Captain 🏅',
      '(DAF) Lead Pilot 🏅',
      '(DAF) Senior Pilot 🏅',
      '(DAF) Officer Pilot 🏅',
      '(DAF) Cadet Pilot 🏅',
    ],
    DAF_SHOOTERS: [
      '(DAF) Shooter Captain 🏅',
      '(DAF) Lead Shooter 🏅',
      '(DAF) Senior Shooter 🏅',
      '(DAF) Officer Shooter 🏅',
      '(DAF) Cadet Shooter 🏅',
    ],
    MARY: [
      'Supervisor MARY 🏍️',
      'Manager MARY 🏍️',
      '(MARY) Sub-Manager 🏍️',
      '(MARY) Conselheiro 🏍️',
      '(MARY) Braço Direito 🏍️',
      '(MARY) Piloto Elite 🏍️',
      '(MARY) Piloto Veterano 🏍️',
      '(MARY) Piloto Oficial 🏍️',
      '(MARY) Piloto Probatorio 🏍️',
    ],
    DETECTIVE: [
      'Supervisor Detective Unit 🔍',
      'Manager Detective Unit 🔍',
      '(D.U.) Detective-Lieutenant 🔍',
      '(D.U.) Detective III 🔍',
      '(D.U.) Detective II 🔍',
      '(D.U.) Detective I 🔍',
      '(D.U.) Prob. Detective 🔍',
    ],
    COT: [
      '(COT) Director',
      '(COT) Chief Officer',
      '(COT) Supervisor',
      '(COT) Agent',
    ],
    INTERNAL: [
      'Supervisor Internal investigation ⚖️',
      'Manager Internal investigation ⚖️',
      '(I.N.V) Counselor ⚖️',
      '(I.N.V) Senior ⚖️',
      '(I.N.V) Official ⚖️',
      '(I.N.V) Cadet ⚖️',
      '(I.N.V) Probationary ⚖️',
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

  const cores = {
    FAST: '#ff0000',
    SWAT: '#000000',
    DAF: '#007bff',
    DAF_SHOOTERS: '#004080',
    MARY: '#8000ff',
    DETECTIVE: '#800080',
    COT: '#ffcc00',
    INTERNAL: '#ff6600',
  };

  const embed = new EmbedBuilder()
    .setColor(cores[unidade.toUpperCase()] || '#003366')
    .setTitle(`📋 Hierarquia - ${unidade}`)
    .setDescription(descricao)
    .setFooter({ text: 'Departamento de Polícia de Detroit' })
    .setTimestamp();

  return embed;
}

// ======= 5) INTERAÇÕES =======
client.on(Events.InteractionCreate, async (interaction) => {
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
