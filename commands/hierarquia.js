// commands/hierarquia.js — Hierarquia automática por cargos (todas as divisões do DPD)

const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");

/* ===== DIVISÕES (como você já tinha) ===== */
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
    ],
  },

  daf: {
    titulo: "D.A.F 🛩️",
    cor: "#2751c3",
    brasao: "",
    patentes: [
      { titulo: "Supervisor D.A.F.", aliases: ["Supervisor D.A.F. 🛩️", "Supervisor D.A.F.", "Supervisor DAF"] },
      { titulo: "Manager D.A.F.",    aliases: ["Manager D.A.F. 🛩️", "Manager D.A.F.", "Manager DAF"] },
      { titulo: "Crew Chief",        aliases: ["(DAF) Crew Chief 🛩️", "(DAF) Crew Chief", "DAF Crew Chief"] },
      { titulo: "Captain",           aliases: ["(DAF) Captain 🛩️", "(DAF) Captain", "DAF Captain"] },
      { titulo: "Lead Pilot",        aliases: ["(DAF) Lead Pilot 🛩️", "(DAF) Lead Pilot", "DAF Lead Pilot"] },
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
    cor: "#8b0000",
    brasao: "",
    patentes: [
      { titulo: "Supervisor",            aliases: ["Supervisor Detective Unit 🔎", "Supervisor Detective Unit", "Detective Unit Supervisor"] },
      { titulo: "Manager",               aliases: ["Manager Detective Unit 🔎", "Manager Detective Unit", "Detective Unit Manager"] },
      { titulo: "Detective-Lieutenant",  aliases: ["(D.U.) Detective-Lieutenant 🔎", "(D.U.) Detective-Lieutenant", "Detective Lieutenant"] },
      { titulo: "Detective III",         aliases: ["(D.U.) Detective III 🔎", "(D.U.) Detective III", "Detective III"] },
      { titulo: "Detective II",          aliases: ["(D.U.) Detective II 🔎", "(D.U.) Detective II", "Detective II"] },
      { titulo: "Detective I",           aliases: ["(D.U.) Detective I 🔎", "(D.U.) Detective I", "Detective I"] },
      { titulo: "Prob. Detective",       aliases: ["(D.U.) Prob. Detective 🔎", "(D.U.) Prob. Detective", "Probationary Detective"] },
    ],
  },
};

/* ===== Tokens de divisão para fallback (pega variações como d.a.f / i.n.v / s.w.a.t) ===== */
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

/* ===== Normalização agressiva ===== */
const normalize = (str) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")     // acentos
    .replace(/[^\w\s]/g, "")             // emojis/símbolos
    .replace(/\s+/g, " ")                // espaços múltiplos
    .trim();

/* Divide um título em tokens de cargo (sem a divisão) */
function cargoTokensFromTitulo(titulo, unidade) {
  const t = normalize(titulo);
  // remove o nome da divisão do título, se existir nele
  const removedDiv = DIV_TOKENS[unidade].reduce((acc, tok) => acc.replace(normalize(tok), ""), t);
  return removedDiv.split(" ").filter(Boolean); // tokens do cargo
}

/* Verifica se 'name' contém todos os tokens */
const containsAll = (name, tokens) => tokens.every((tk) => name.includes(tk));

/* Busca role: 1) por aliases 2) por fallback (tokens de divisão + tokens do cargo) */
function findRoleEnhanced(guild, aliases, unidade, tituloPatente) {
  // 1) tentativa direta por aliases
  const target = aliases.map((a) => normalize(a));
  let found =
    guild.roles.cache.find((role) => {
      const name = normalize(role.name);
      return target.some((t) => name.includes(t));
    }) || null;
  if (found) return found;

  // 2) fallback por tokens
  const nameHasDiv = (name) => DIV_TOKENS[unidade].some((dv) => name.includes(normalize(dv)));
  const cargoTokens = cargoTokensFromTitulo(tituloPatente, unidade); // ex.: ["manager"], ["elite","pilot"]

  found =
    guild.roles.cache.find((role) => {
      const name = normalize(role.name);
      return nameHasDiv(name) && containsAll(name, cargoTokens);
    }) || null;

  return found;
}

/* Monta a descrição com um membro por linha */
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
    // Apenas Supervisores e Managers executam
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

/* Chamado pelo index.js quando a pessoa escolhe a divisão */
module.exports.gerarHierarquiaEmbed = async (guild, unidade) => {
  // Garante cache de membros
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
