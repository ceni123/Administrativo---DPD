// commands/hierarquia.js — Hierarquia automática por cargos (layout completo e com menções)

const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");

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

// ======= GERA HIERARQUIA =======
module.exports.gerarHierarquiaEmbed = async (guild, unidade) => {
  const divisaoConfig = {
    fast: {
      titulo: "FAST ⚡",
      cor: "#0055ff",
      brasao: "https://link-do-brasao-fast.png",
      cargos: [
        "Supervisor FAST",
        "Manager FAST",
        "Sub-Manager FAST",
        "Counselor FAST",
        "Elite Pilot FAST",
        "Veteran Pilot FAST",
        "Official Pilot FAST",
        "Probationary Pilot FAST",
      ],
    },
    mary: {
      titulo: "MARY 🏍️",
      cor: "#0099ff",
      brasao: "https://link-do-brasao-mary.png",
      cargos: [
        "Supervisor MARY",
        "Manager MARY",
        "Sub-Manager MARY",
        "Counselor MARY",
        "Elite Pilot MARY",
        "Veteran Pilot MARY",
        "Official Pilot MARY",
        "Probationary Pilot MARY",
      ],
    },
    swat: {
      titulo: "S.W.A.T ☠️",
      cor: "#000000",
      brasao: "https://link-do-brasao-swat.png",
      cargos: [
        "Supervisor SWAT",
        "Manager SWAT",
        "Coordinator SWAT",
        "Instructor SWAT",
        "Operator SWAT",
        "Probationary SWAT",
      ],
    },
    daf: {
      titulo: "D.A.F 🛩️",
      cor: "#3366cc",
      brasao: "https://link-do-brasao-daf.png",
      cargos: [
        "Supervisor DAF",
        "Manager DAF",
        "Crew Chief DAF",
        "Captain DAF",
        "Lead Pilot DAF",
        "Senior Pilot DAF",
        "Official Pilot DAF",
        "Cadet Pilot DAF",
      ],
    },
    daf_shooter: {
      titulo: "DAF Shooter 🎯",
      cor: "#1e90ff",
      brasao: "https://link-do-brasao-daf-shooter.png",
      cargos: [
        "Shooter Captain DAF",
        "Lead Shooter DAF",
        "Senior Shooter DAF",
        "Official Shooter DAF",
        "Cadet Shooter DAF",
      ],
    },
    cot: {
      titulo: "C.O.T 🛡️",
      cor: "#004080",
      brasao: "https://link-do-brasao-cot.png",
      cargos: [
        "Director COT",
        "Chief Officer COT",
        "Supervisor COT",
        "Agent COT",
      ],
    },
    inv: {
      titulo: "Internal Investigation ⚖️",
      cor: "#800000",
      brasao: "https://link-do-brasao-inv.png",
      cargos: [
        "Supervisor INV",
        "Manager INV",
        "Counselor INV",
        "Senior INV",
        "Official INV",
        "Cadet INV",
        "Probationary INV",
      ],
    },
    detective: {
      titulo: "Detective Unit 🔎",
      cor: "#8b0000",
      brasao: "https://link-do-brasao-detective.png",
      cargos: [
        "Supervisor Detective",
        "Manager Detective",
        "Detective-Lieutenant",
        "Detective III",
        "Detective II",
        "Detective I",
        "Probationary Detective",
      ],
    },
  };

  const config = divisaoConfig[unidade];
  if (!config) return null;

  const embed = new EmbedBuilder()
    .setColor(config.cor)
    .setTitle(`📋 Hierarquia - ${config.titulo}`)
    .setThumbnail(config.brasao)
    .setFooter({ text: "Departamento de Polícia de Detroit" })
    .setTimestamp();

  // Monta a lista de cargos e membros automaticamente
  let descricao = "";
  for (const cargoNome of config.cargos) {
    const cargo = guild.roles.cache.find(
      (r) => r.name.toLowerCase() === cargoNome.toLowerCase()
    );
    if (!cargo) {
      descricao += `\n**${cargoNome}:**\n*(Cargo não encontrado no servidor)*\n`;
      continue;
    }

    const membros = cargo.members.map((m) => `<@${m.id}>`).join(", ");
    descricao += `\n**${cargoNome}:**\n${membros || "*Vazio*"}\n`;
  }

  embed.setDescription(descricao);
  return embed;
};
