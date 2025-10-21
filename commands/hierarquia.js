// commands/hierarquia.js — Hierarquia automática por cargos (todas as divisões do DPD)

const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");

/* ===== DIVISÕES ===== */
const DIVISOES = {
  fast: {
    titulo: "FAST ⚡",
    cor: "#0b6ef3",
    brasao: "",
    patentes: [
      { titulo: "Supervisor Fast", aliases: ["Supervisor Fast ⚡", "Supervisor Fast"] },
      { titulo: "Manager FAST", aliases: ["Manager FAST ⚡", "Manager FAST", "(FAST) Manager ⚡", "(FAST) Manager", "Manager Fast"] },
      { titulo: "Sub-Manager", aliases: ["(FAST) Sub-Manager ⚡", "(FAST) Sub-Manager", "Sub Manager FAST"] },
      { titulo: "Counselor", aliases: ["(FAST) Counselor ⚡", "(FAST) Counselor"] },
      { titulo: "Elite Pilot", aliases: ["(FAST) Elite Pilot ⚡", "(FAST) Elite Pilot"] },
      { titulo: "Veteran Pilot", aliases: ["(FAST) Veteran Pilot ⚡", "(FAST) Veteran Pilot"] },
      { titulo: "Official Pilot", aliases: ["(FAST) Official Pilot ⚡", "(FAST) Official Pilot"] },
      { titulo: "Probationary Pilot", aliases: ["(FAST) Probationary Pilot ⚡", "(FAST) Probationary Pilot"] },
      { titulo: "Co-Pilot", aliases: ["(FAST) Co-Pilot ⚡", "(FAST) Co-Pilot"] },
    ],
  },

  mary: {
    titulo: "MARY 🏍️",
    cor: "#0aa1ff",
    brasao: "",
    patentes: [
      { titulo: "Supervisor MARY", aliases: ["Supervisor MARY 🏍️", "Supervisor MARY"] },
      { titulo: "Manager MARY", aliases: ["Manager MARY 🏍️", "Manager MARY"] },
      { titulo: "Sub-Manager", aliases: ["(MARY) Sub-Manager 🏍️", "(MARY) Sub-Manager", "Sub Manager MARY"] },
      { titulo: "Conselheiro", aliases: ["(MARY) Conselheiro 🏍️", "(MARY) Conselheiro"] },
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
      { titulo: "Supervisor",  aliases: ["(S.W.A.T) Supervisor ☠️", "(S.W.A.T) Supervisor", "SWAT Supervisor"] },
      { titulo: "Gestor",      aliases: ["(S.W.A.T) Gestor ☠️", "(S.W.A.T) Gestor", "SWAT Gestor"] },
      { titulo: "Coordenador", aliases: ["(S.W.A.T) Coordenador ☠️", "(S.W.A.T) Coordenador", "SWAT Coordenador"] },
      { titulo: "Instrutor",   aliases: ["(S.W.A.T) Instrutor ☠️", "(S.W.A.T) Instrutor", "SWAT Instrutor"] },
      { titulo: "Operador",    aliases: ["(S.W.A.T) Operador ☠️", "(S.W.A.T) Operador", "SWAT Operador"] },
      { titulo: "Probatório",  aliases: ["(S.W.A.T) Probatório ☠️", "(S.W.A.T) Probatório", "SWAT Probatório"] },
      { titulo: "(S.W.A.T.) CIT", aliases: ["(S.W.A.T.) CIT ☠️", "(S.W.A.T.) CIT", "SWAT CIT", "CIT", "C I T"] },
    ],
  },

  daf: {
    titulo: "D.A.F 🛩️",
    cor: "#2751c3",
    brasao: "",
    patentes: [
      { titulo: "Supervisor D.A.F.", aliases: ["Supervisor D.A.F. 🛩️", "Supervisor D.A.F.", "Supervisor DAF"] },
      { titulo: "Manager D.A.F.",    aliases: ["Manager D.A.F. 🛩️", "Manager D.A.F.", "Manager DAF"] },
      { titulo: "(DAF) Sub-Manager", aliases: ["(DAF) Sub-Manager", "(DAF) Sub Manager", "Sub Manager DAF", "Crew Chief", "(DAF) Crew Chief 🛩️", "(DAF) Crew Chief", "DAF Crew Chief"] },
      { titulo: "(DAF) Captain",     aliases: ["(DAF) Captain 🛩️", "(DAF) Captain", "DAF Captain"] },
      { titulo: "(DAF) Instrutor",   aliases: ["(DAF) Instrutor", "Instrutor DAF", "Lead Pilot", "(DAF) Lead Pilot 🛩️", "(DAF) Lead Pilot", "DAF Lead Pilot"] },
      { titulo: "Senior Pilot",      aliases: ["(DAF) Senior Pilot 🛩️", "(DAF) Senior Pilot", "DAF Senior Pilot"] },
      { titulo: "Officer Pilot",     aliases: ["(DAF) Officer Pilot 🛩️", "(DAF) Officer Pilot", "DAF Officer Pilot"] },
      { titulo: "Cadet Pilot",       aliases: ["(DAF) Cadet Pilot 🛩️", "(DAF) Cadet Pilot", "DAF Cadet Pilot"] },
    ],
  },

  daf_shooter: {
    titulo: "DAF Shooter 🎯",
    cor: "#1e90ff",
    brasao: "",
    patentes: [
      { titulo: "Shooter Captain",  aliases: ["(DAF) Shooter Captain 🛩️", "(DAF) Shooter Captain", "DAF Shooter Captain"] },
      { titulo: "Lead Shooter",     aliases: ["(DAF) Lead Shooter 🛩️", "(DAF) Lead Shooter", "DAF Lead Shooter"] },
      { titulo: "Senior Shooter",   aliases: ["(DAF) Senior Shooter 🛩️", "(DAF) Senior Shooter", "DAF Senior Shooter"] },
      { titulo: "Officer Shooter",  aliases: ["(DAF) Officer Shooter 🛩️", "(DAF) Officer Shooter", "DAF Officer Shooter"] },
      { titulo: "Cadet Shooter",    aliases: ["(DAF) Cadet Shooter 🛩️", "(DAF) Cadet Shooter", "DAF Cadet Shooter"] },
    ],
  },

  cot: {
    titulo: "C.O.T 🛡️",
    cor: "#074e8c",
    brasao: "",
    patentes: [
      { titulo: "Director",     aliases: ["(COT) Director 🛡️", "(COT) Director", "COT Director"] },
      { titulo: "Chief Officer",aliases: ["(COT) Chief Officer 🛡️", "(COT) Chief Officer", "COT Chief Officer"] },
      { titulo: "Supervisor",   aliases: ["(COT) Supervisor 🛡️", "(COT) Supervisor", "COT Supervisor"] },
      { titulo: "Agent",        aliases: ["(COT) Agent 🛡️", "(COT) Agent", "COT Agent"] },
    ],
  },

  inv: {
    titulo: "Internal Investigation ⚖️",
    cor: "#8a1b1b",
    brasao: "",
    patentes: [
      { titulo: "Supervisor",   aliases: ["Supervisor Internal investigation ⚖️", "Supervisor Internal investigation", "Internal Investigation Supervisor"] },
      { titulo: "Manager",      aliases: ["Manager Internal investigation ⚖️", "Manager Internal investigation", "Internal Investigation Manager"] },
      { titulo: "Counselor",    aliases: ["(I.N.V) Counselor ⚖️", "(I.N.V) Counselor", "INV Counselor"] },
      { titulo: "Senior",       aliases: ["(I.N.V) Senior ⚖️", "(I.N.V) Senior", "INV Senior"] },
      { titulo: "Official",     aliases: ["(I.N.V) Official ⚖️", "(I.N.V) Official", "INV Official"] },
      { titulo: "Cadet",        aliases: ["(I.N.V) Cadet ⚖️", "(I.N.V) Cadet", "INV Cadet"] },
      { titulo: "Probationary", aliases: ["(I.N.V) Probationary ⚖️", "(I.N.V) Probationary", "INV Probationary"] },
    ],
  },

  detective: {
    titulo: "Detective Unit 🔎",
    cor: "#8d00ff",
    brasao: "",
    patentes: [
      { titulo: "Supervisor",           aliases: ["Supervisor Detective Unit 🔎", "Supervisor Detective Unit", "Detective Unit Supervisor"] },
      { titulo: "Manager",              aliases: ["Manager Detective Unit 🔎", "Manager Detective Unit", "Detective Unit Manager"] },
      { titulo: "(D.U.) Detective Braço Direito", aliases: ["(D.U.) Detective Braço Direito 🔎", "(D.U.) Detective Braço Direito", "Detective Braço Direito", "Braco Direito Detective", "Detective-Lieutenant", "(D.U.) Detective-Lieutenant 🔎", "(D.U.) Detective-Lieutenant", "Detective Lieutenant"] },
      { titulo: "(D.U.) Coordenador", aliases: ["(D.U.) Coordenador 🔎", "(D.U.) Coordenador", "Detective Coordenador", "Detective III", "(D.U.) Detective III 🔎", "(D.U.) Detective III", "Detective III"] },
      { titulo: "(D.U.) Detective Chefe", aliases: ["(D.U.) Detective Chefe 🔎", "(D.U.) Detective Chefe", "Detective Chefe", "Detective II", "(D.U.) Detective II 🔎", "(D.U.) Detective II", "Detective II"] },
      { titulo: "(D.U.) Detective Operacional", aliases: ["(D.U.) Detective Operacional 🔎", "(D.U.) Detective Operacional", "Detective Operacional", "Detective I", "(D.U.) Detective I 🔎", "(D.U.) Detective I", "Detective I"] },
      { titulo: "(D.U.) Detective Probatorio", aliases: ["(D.U.) Detective Probatorio 🔎", "(D.U.) Detective Probatorio", "Detective Probatorio", "Prob. Detective", "(D.U.) Prob. Detective 🔎", "(D.U.) Prob. Detective", "Probationary Detective"] },
    ],
  },
};

/* ===== Tokens, normalização e funções auxiliares ===== */
const DIV_TOKENS = {
  fast: ["fast"],
  mary: ["mary"],
  swat: ["swat", "s w a t", "s.w.a.t"],
  daf: ["daf", "d a f", "d.a.f"],
  daf_shooter: ["daf", "d a f", "d.a.f", "shooter"],
  cot: ["cot", "c o t", "c.o.t"],
  inv: ["inv", "i n v", "i.n.v", "internal investigation", "investigation"],
  detective: ["detective", "d u", "d.u.", "d u.", "d.u"],
};

const normalize = (str) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function cargoTokensFromTitulo(titulo, unidade) {
  const t = normalize(titulo);
  const removedDiv = DIV_TOKENS[unidade].reduce((acc, tok) => acc.replace(normalize(tok), ""), t);
  return removedDiv.split(" ").filter(Boolean);
}

const containsAll = (name, tokens) => tokens.every((tk) => name.includes(tk));

function findRoleEnhanced(guild, aliases, unidade, tituloPatente) {
  const target = aliases.map((a) => normalize(a));
  let found =
    guild.roles.cache.find((role) => {
      const name = normalize(role.name);
      return target.some((t) => name.includes(t));
    }) || null;
  if (found) return found;

  const nameHasDiv = (name) => DIV_TOKENS[unidade].some((dv) => name.includes(normalize(dv)));
  const cargoTokens = cargoTokensFromTitulo(tituloPatente, unidade);

  found =
    guild.roles.cache.find((role) => {
      const name = normalize(role.name);
      return nameHasDiv(name) && containsAll(name, cargoTokens);
    }) || null;

  return found;
}

function buildDescricao(guild, unidade, config) {
  let out = "";
  for (const pat of config.patentes) {
    const role = findRoleEnhanced(guild, pat.aliases, unidade, pat.titulo);
    const membros = role ? role.members.map((m) => `<@${m.id}>`).join("\n") : "";
    out += `\n**${pat.titulo}:**\n${membros || "*Vazio*"}\n`;
  }
  return out;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hierarquia")
    .setDescription("Exibe automaticamente a hierarquia de cada divisão do DPD com base nos cargos do servidor."),

  async execute(interaction) {
    const temPermissao = interaction.member.roles.cache.some((r) => {
      const n = r.name.toLowerCase();
      return n.includes("supervisor") || n.includes("manager");
    });

    if (!temPermissao) {
      return interaction.reply({
        content: "❌ Apenas **Supervisores** e **Managers** das divisões podem usar este comando.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId("unidade_select")
      .setPlaceholder("Selecione uma divisão do DPD")
      .addOptions([
        { label: "FAST ⚡", value: "fast" },
        { label: "MARY 🏍️", value: "mary" },
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

module.exports.gerarHierarquiaEmbed = async (guild, unidade) => {
  await guild.members.fetch();
  const config = DIVISOES[unidade];
  if (!config) return null;

  const embed = new EmbedBuilder()
    .setColor(config.cor)
    .setTitle(`📋 Hierarquia - ${config.titulo}`)
    .setFooter({ text: "Departamento de Polícia de Detroit" })
    .setTimestamp();

  if (config.brasao) embed.setThumbnail(config.brasao);

  const descricao = buildDescricao(guild, unidade, config);
  embed.setDescription(descricao);

  return embed;
};
