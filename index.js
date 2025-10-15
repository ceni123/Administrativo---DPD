// index.js — versão completa com registro automático do /hierarquia
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
  intents: [GatewayIntentBits.Guilds], // para slash commands basta Guilds
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
    // Registro rápido NA GUILD (aparece em segundos)
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
  // 4.a) Slash commands (ex: /hierarquia)
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction); // Executa o commands/hierarquia.js
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

  // 4.b) Select menu do /hierarquia
  if (interaction.isStringSelectMenu() && interaction.customId === 'unidade_select') {
    const escolha = interaction.values[0];

    const embed = new EmbedBuilder()
      .setColor(0x003366)
      .setTitle('📋 Hierarquia DPD - ' + escolha.toUpperCase())
      .setFooter({ text: 'Departamento de Polícia de Detroit' })
      .setTimestamp();

    switch (escolha) {
      case 'detective':
        embed.setDescription(`👮‍♂️ **Detective Unit**
> • Chefe de Investigações  
> • Detetive Sênior  
> • Detetive  
> • Investigador  
> • Estagiário Forense`);
        break;
      case 'swat':
        embed.setDescription(`💥 **SWAT**
> • Comandante SWAT  
> • Capitão Tático  
> • Operador de Elite  
> • Operador  
> • Recruta Tático`);
        break;
      case 'fast':
        embed.setDescription(`🚓 **FAST**
> • Comandante FAST  
> • Supervisor  
> • Agente Sênior  
> • Agente  
> • Recruta FAST`);
        break;
      case 'daf':
        embed.setDescription(`🎯 **DAF**
> • Diretor DAF  
> • Agente Fiscalizador  
> • Inspetor  
> • Analista  
> • Estagiário DAF`);
        break;
      case 'mary':
        embed.setDescription(`🚨 **MARY**
> • Supervisor MARY  
> • Policial Sênior  
> • Policial  
> • Recruta`);
        break;
      case 'dafatiradores':
        embed.setDescription(`🎯 **DAF Atiradores**
> • Líder de Snipers  
> • Sniper Especialista  
> • Atirador  
> • Estagiário de Tiro`);
        break;
      case 'internal':
        embed.setDescription(`🕵️ **Internal Investigation (Corregedoria)**
> • Chefe da Corregedoria  
> • Corregedor Sênior  
> • Corregedor  
> • Analista Disciplinar  
> • Estagiário Interno`);
        break;
      default:
        embed.setDescription('❌ Unidade não encontrada.');
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

// ======= 5) LOGIN =======
client.login(process.env.BOT_TOKEN);
