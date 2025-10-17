// commands/hierarquia.js — Hierarquia automática por cargos (todas as divisões do DPD)
// Lê os cargos reais do servidor, formata o embed e menciona automaticamente os membros.

const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");

/* ========== AJUDA: como o bot encontra os cargos ==========
  Para cada “patente”, definimos um array de possíveis nomes/variações
  (com/sem acentos, emojis, pontos, etc.). O bot procura por qualquer
  uma das variações (case-insensitive, usa includes para tolerar detalhes).
*/

const DIVISOES = {
  fast: {
    titulo: "FAST ⚡",
    cor: "#0b6ef3",
    brasao: "", // opcional: URL do brasão
    patentes: [
      { titulo: "Supervisor Fast", aliases: ["Supervisor Fast ⚡", "Supervisor Fast"] },
      { titulo: "Manager FAST", aliases: ["Manager FAST ⚡", "Manager FAST"] },
      { titulo: "Sub-Manager", aliases: ["(FAST) Sub-Manager ⚡", "(FAST) Sub-Manager"] },
      { titulo: "Counselor", aliases: ["(FAST) Counselor ⚡", "(FAST) Counselor"] },
      { titulo: "Elite Pilot", aliases: ["(FAST) Elite Pilot ⚡", "(FAST) Elite Pilot"] },
      { titulo: "Veteran Pilot", aliases: ["(FAST) Veteran Pilot ⚡", "(FAST) Veteran Pilot"] },
      { titulo: "Official Pilot", aliases: ["(FAST) Official Pilot ⚡", "(FAST) Official Pilot"] },
      { titulo: "Probationary Pilot", aliases: ["(FAST) Probationary Pilot ⚡", "(FAST) Probationary Pilot"] },
      { titulo: "Co-Pilot", aliases: ["(FAST) Co-Pilot ⚡", "(FAST) Co-Pilot"] },
    ],
  },

  mary: {
    titulo: "MARY 🚁",
    cor: "#0aa1ff",
    brasao: "",
    patentes: [
      { titulo: "Supervisor MARY", aliases: ["Supervisor MARY 🏍️", "Supervisor MARY"] },
      { titulo: "Manager MARY", aliases: ["Manager MARY 🏍️", "Manager MARY"] },
      { titulo: "Sub-Manager", aliases: ["(MARY) Sub-Manager 🏍️", "(MARY) Sub-Manager"] },
      { titulo: "Conselheiro", aliases: ["(MARY) Conselheiro 🏍️", "(MARY) Conselheiro", "(MARY) Conselheiro"] },
      { titulo: "Braço Direito", aliases: ["(MARY) Braço Direito 🏍️", "(MARY) Braço Direito"] },
      { titulo: "Piloto Elite", aliases: ["(MARY) Piloto Elite 🏍️", "(MARY) Piloto Elite"] },
      { titulo: "Piloto Veterano", aliases: ["(MARY) Piloto Veterano 🏍️", "(MARY) Piloto Veterano"] },
      { titulo: "Piloto Oficial", aliases: ["(MARY) Piloto Oficial 🏍️", "(MARY) Piloto Oficial"] },
      { titulo: "Piloto Probatório", aliases: ["(MARY) Piloto Probatório 🏍️", "(MARY) Piloto Probatório"] },
    ],
  },

  swat: {
    titulo: "S.W.A.T ☠️",
    cor: "#111111",
    brasao: "",
    patentes: [
      { titulo: "Supervisor",  aliases: ["(S.W.A.T) Supervisor ☠️", "(S.W.A.T) Supervisor"] },
      { titulo: "Gestor",      aliases: ["(S.W.A.T) Gestor ☠️", "(S.W.A.T) Gestor"] },
      { titulo: "Coordenador", aliases: ["(S.W.A.T) Coordenador ☠️", "(S.W.A.T) Coordenador"] },
      { titulo: "Instrutor",   aliases: ["(S.W.A.T) Instrutor ☠️", "(S.W.A.T) Instrutor"] },
      { titulo: "Operador",    aliases: ["(S.W.A.T) Operador ☠️", "(S.W.A.T) Operador"] },
      { titulo: "Probatório",  aliases: ["(S.W.A.T) Probatório ☠️", "(S.W.A.T) Probatório"] },
    ],
  },

  daf: {
    titulo: "D.A.F 🛩️",
    cor: "#2751c3",
    brasao: "",
    patentes: [
      { titulo: "Supervisor D.A.F.", aliases: ["Supervisor D.A.F. 🛩️", "Supervisor D.A.F.", "Supervisor DAF"] },
      { titulo: "Manager D.A.F.",    aliases: ["Manager D.A.F. 🛩️", "Manager D.A.F.", "Manager DAF"] },
      { titulo: "Crew Chief",        aliases: ["(DAF) Crew Chief 🛩️", "(DAF) Crew Chief"] },
      { titulo: "Captain",           aliases: ["(DAF) Captain 🛩️", "(DAF) Captain"] },
      { titulo: "Lead Pilot",        aliases: ["(DAF) Lead Pilot 🛩️", "(DAF) Lead Pilot"] },
      { titulo: "Senior Pilot",      aliases: ["(DAF) Senior Pilot 🛩️", "(DAF) Senior Pilot"] },
      { titulo: "Officer Pilot",     aliases: ["(DAF) Officer Pilot 🛩️", "(DAF) Officer Pilot"] },
      { titulo: "Cadet Pilot",       aliases: ["(DAF) Cadet Pilot 🛩️", "(DAF) Cadet Pilot"] },
    ],
  },

  daf_shooter: {
    titulo: "DAF Shooter 🎯",
    cor: "#1e90ff",
    brasao: "",
    patentes: [
      { titulo: "Shooter Captain",  aliases: ["(DAF) Shooter Captain 🛩️", "(DAF) Shooter Captain"] },
      { titulo: "Lead Shooter",     aliases: ["(DAF) Lead Shooter 🛩️", "(DAF) Lead Shooter"] },
      { titulo: "Senior Shooter",   aliases: ["(DAF) Senior Shooter 🛩️", "(DAF) Senior Shooter"] },
      { titulo: "Officer Shooter",  aliases: ["(DAF) Officer Shooter 🛩️", "(DAF) Officer Shooter"] },
      { titulo: "Cadet Shooter",    aliases: ["(DAF) Cadet Shooter 🛩️", "(DAF) Cadet Shooter"] },
    ],
  },

  cot: {
    titulo: "C.O.T 🛡️",
    cor: "#074e8c",
    brasao: "",
    patentes: [
      { titulo: "Director",     aliases: ["(COT) Director 🛡️", "(COT) Director"] },
      { titulo: "Chief Officer",aliases: ["(COT) Chief Officer 🛡️", "(COT) Chief Officer"] },
      { titulo: "Supervisor",   aliases: ["(COT) Supervisor 🛡️", "(COT) Supervisor"] },
      { titulo: "Agent",        aliases: ["(COT) Agent 🛡️", "(COT) Agent"] },
    ],
  },

  inv: {
    titulo: "Internal Investigation ⚖️",
    cor: "#8a1b1b",
    brasao: "",
    patentes: [
      { titulo: "Supervisor",   aliases: ["Supervisor Internal investigation", "Supervisor Internal investigation ⚖️"] },
      { titulo: "Manager",      aliases: ["Manager Internal investigation", "Manager Internal investigation ⚖️"] },
      { titulo: "Counselor",    aliases: ["(I.N.V) Counselor ⚖️", "(I.N.V) Counselor"] },
      { titulo: "Senior",       aliases: ["(I.N.V) Senior ⚖️", "(I.N.V) Senior"] },
      { titulo: "Official",     aliases: ["(I.N.V) Official ⚖️", "(I.N.V) Official"] },
      { titulo: "Cadet",        aliases: ["(I.N.V) Cadet ⚖️", "(I.N.V) Cadet"] },
      { titulo: "Probationary", aliases: ["(I.N.V) Probationary ⚖️", "(I.N.V) Probationary"] },
    ],
  },

  detective: {
    titulo: "Detective Unit 🔎",
    cor: "#8b0000",
    brasao: "",
    patentes: [
      { titulo: "Supervisor",            aliases: ["Supervisor Detective Unit", "Supervisor Detective Unit 🔎"] },
      { titulo: "Manager",               aliases: ["Manager Detective Unit", "Manager Detective Unit 🔎"] },
      { titulo: "Detective-Lieutenant",  aliases: ["(D.U.) Detective-Lieutenant 🔎", "(D.U.) Detective-Lieutenant"] },
      { titulo: "Detective III",         aliases: ["(D.U.) Detective III 🔎", "(D.U.) Detective III"] },
      { titulo: "Detective II",          aliases: ["(D.U.) Detective II 🔎", "(D.U.) Detective II"] },
      { titulo: "Detective I",           aliases: ["(D.U.) Detective I 🔎", "(D.U.) Detective I"] },
      { titulo: "Prob. Detective",       aliases: ["(D.U.) Prob. Detective 🔎", "(D.U.) Prob. Detective"] },
    ],
  },
};

/* Busca role por qualquer uma das variações (case-insensitive, usando includes) */
function findRole(guild, aliases) {
  const target = aliases.map(a => a.toLowerCase());
  return guild.roles.cache.find(role => {
    const name = role.name.toLowerCase();
    return target.some(t => name.includes(t));
  }) || null;
}

/* Monta a listagem “**Patente:** @membro, @membro / Vazio ” */
function buildDescricao(guild, config) {
  let out = "";
  for (const pat of config.patentes) {
    const role = findRole(guild, pat.aliases);
    const membros = role ? role.members.map(m => `<@${m.id}>`).join(", ") : "";
    out += `\n**${pat.titulo}:**\n${membros || "*Vazio*"}\n`;
  }
  return out;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hierarquia")
    .setDescription("Exibe automaticamente a hierarquia de cada divisão do DPD com base nos cargos do servidor."),

  async execute(interaction) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId("unidade_select")
      .setPlaceholder("Selecione uma divisão do DPD")
      .addOptions([
        { label: "FAST ⚡", value: "fast" },
        { label: "MARY 🚁", value: "mary" },
        { label: "S.W.A.T ☠️", value: "swat" },
        { label: "D.A.F 🛩️", value: "daf" },
        { label: "DAF Shooter 🎯", value: "daf_shooter" },
        { label: "C.O.T 🛡️", value: "cot" },
        { label: "I.N.V ⚖️", value: "inv" },
        { label: "Detective Unit 🔎", value: "detective" },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    const embed = new EmbedBuilder()
      .setColor("#003366")
      .setTitle("📋 Hierarquia DPD")
      .setDescription("Selecione abaixo a divisão que deseja consultar a hierarquia completa.")
      .setFooter({ text: "Departamento de Polícia de Detroit" })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  },
};

/* Usado pelo index.js quando a pessoa escolhe a divisão no select */
module.exports.gerarHierarquiaEmbed = async (guild, unidade) => {
  const config = DIVISOES[unidade];
  if (!config) return null;

  const embed = new EmbedBuilder()
    .setColor(config.cor)
    .setTitle(`📋 Hierarquia - ${config.titulo}`)
    .setFooter({ text: "Departamento de Polícia de Detroit" })
    .setTimestamp();

  if (config.brasao) embed.setThumbnail(config.brasao);

  const descricao = buildDescricao(guild, config);
  embed.setDescription(descricao);
  return embed;
};
