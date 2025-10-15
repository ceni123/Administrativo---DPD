// Importa a biblioteca principal do Discord
const { Client, GatewayIntentBits } = require('discord.js');

// Cria a instância do bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Quando o bot ligar
client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

// Comandos básicos
client.on('messageCreate', (message) => {
  if (message.content === '!ping') {
    message.reply('🏓 Pong!');
  }
  if (message.content === '!ajuda') {
    message.reply('📋 Comandos disponíveis: !ping | !ajuda | !boasvindas');
  }
  if (message.content === '!boasvindas') {
    message.reply('👮‍♂️ Bem-vindo à DPD! Servir e proteger!');
  }
});

// Login com token
client.login(process.env.BOT_TOKEN);
// Importa o Embed (caixa de mensagem bonita)
const { EmbedBuilder } = require('discord.js');

// Evento que escuta quando alguém interage com o bot
client.on('interactionCreate', async (interaction) => {
  // Se a interação não for o menu, o bot ignora
  if (!interaction.isStringSelectMenu()) return;

  // Verifica se o menu é o do comando /hierarquia
  if (interaction.customId === 'unidade_select') {
    const escolha = interaction.values[0]; // pega a opção escolhida

    // Cria um "Embed" (mensagem colorida e formatada)
    const embed = new EmbedBuilder()
      .setColor(0x003366) // cor azul escuro
      .setTitle('📋 Hierarquia DPD - ' + escolha.toUpperCase())
      .setFooter({ text: 'Departamento de Polícia de Detroit' })
      .setTimestamp(); // mostra a data/hora automática

    // Aqui estão as hierarquias de cada unidade
    switch (escolha) {
      case 'detective':
        embed.setDescription(`
👮‍♂️ **Detective Unit**
> • Chefe de Investigações  
> • Detetive Sênior  
> • Detetive  
> • Investigador  
> • Estagiário Forense
        `);
        break;

      case 'swat':
        embed.setDescription(`
💥 **SWAT**
> • Comandante SWAT  
> • Capitão Tático  
> • Operador de Elite  
> • Operador  
> • Recruta Tático
        `);
        break;

      case 'fast':
        embed.setDescription(`
🚓 **FAST**
> • Comandante FAST  
> • Supervisor  
> • Agente Sênior  
> • Agente  
> • Recruta FAST
        `);
        break;

      case 'daf':
        embed.setDescription(`
🎯 **DAF**
> • Diretor DAF  
> • Agente Fiscalizador  
> • Inspetor  
> • Analista  
> • Estagiário DAF
        `);
        break;

      case 'mary':
        embed.setDescription(`
🚨 **MARY**
> • Supervisor MARY  
> • Policial Sênior  
> • Policial  
> • Recruta
        `);
        break;

      case 'dafatiradores':
        embed.setDescription(`
🎯 **DAF Atiradores**
> • Líder de Snipers  
> • Sniper Especialista  
> • Atirador  
> • Estagiário de Tiro
        `);
        break;

      case 'internal':
        embed.setDescription(`
🕵️ **Internal Investigation (Corregedoria)**
> • Chefe da Corregedoria  
> • Corregedor Sênior  
> • Corregedor  
> • Analista Disciplinar  
> • Estagiário Interno
        `);
        break;

      default:
        embed.setDescription('❌ Unidade não encontrada.');
    }

    // Responde com o Embed formatado
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});
