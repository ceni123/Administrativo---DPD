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
