// index.js — versão completa e corrigida
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
  intents: [GatewayIntentBits.Guilds], // Slash commands precisam apenas de Guilds
});

// Mapeamento de comandos
client.commands = new Collection();

// ======= 2) IMPORTA O COMANDO /hierarquia =======
const hierarquia = require('./commands/hierarquia.js');
client.commands.set(hierarquia.data.name, hierarquia);

// ======= 3) REGISTRA OS SLASH COMMANDS AO INICIAR =======
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Bot conectado como ${c.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
  const commandsJson = [hierarquia.data.toJSON()];

  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
      { body: commandsJson }
    );
    console.log('✅ /hierarquia registrado na guild com sucesso.');
  } catch (err) {
    console.error('❌ Erro ao registrar comandos:', err);
  }
});

// ======= 4) TRATA INTERAÇÕES =======
client.on(Events.InteractionCreate, async (interaction) => {
  // 4.a) Slash commands (/hierarquia)
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

  // 4.b) Seleção do menu /hierarquia
  if (interaction.isStringSelectMenu() && interaction.customId === 'unidade_select') {
    await interaction.deferUpdate(); // Fecha a interação ephemeral

    const escolha = interaction.values[0];
    const embed = new EmbedBuilder()
      .setColor(0x003366)
      .setTitle('📋 Hierarquia DPD - ' + escolha.toUpperCase())
      .setFooter({ text: 'Departamento de Polícia de Detroit' })
      .setTimestamp();

    switch (escolha) {
      case 'fast':
        embed
          .setTitle('Hierarquia - FAST')
          .setColor('#ff0000')
          .setThumbnail('https://i.imgur.com/lpM5G52.png') // substitua pelo brasão correto
          .setDescription(`
**Supervisor Fast:**  
@Insp. Julio Montenegro | 10052

**Manager FAST:**  
@Capt. Lyra Black | 10822

**FAST Sub-Manager:**  
@Sgt.II Hector Jones | 11037

**FAST Counselor:**  
@Sgt.I Aiden Caldwell | 9270  
@Sgt.II Deckard S. | 6203

**FAST Elite Pilot:**  
@Sgt.II Pedro Escobar | 11337

**FAST Veteran Pilot:**  
Vazio

**FAST Official Pilot:**  
@Sgt.I Will Toussaint | 8581  
<@1049297322045091940>

**FAST Probationary Pilot:**  
@Sgt.I Tonho Marreta | 8820  
@Sgt.I Iris Deck Thomaz | 5931  
@Ofc.III Renato Contardo | 10328  
@Ofc.III Lima D. Deck | 35488
          `);
        break;

      // Adicione as outras unidades (SWAT, DAF, MARY etc.) no mesmo formato
      default:
        embed.setDescription('❌ Unidade não encontrada.');
    }

    // Envia a resposta no canal (visível para todos)
    await interaction.channel.send({ embeds: [embed] });
  }
});

// ======= 5) LOGIN =======
client.login(process.env.BOT_TOKEN);
