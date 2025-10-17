// commands/hierarquia.js — versão completa com todas as divisões DPD

const {
  SlashCommandBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hierarquia")
    .setDescription("Exibe a hierarquia completa das divisões do DPD."),

  async execute(interaction) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId("unidade_select")
      .setPlaceholder("Escolha a unidade para ver a hierarquia:")
      .addOptions([
        { label: "FAST ⚡", value: "fast" },
        { label: "MARY 🚁", value: "mary" },
        { label: "S.W.A.T ☠️", value: "swat" },
        { label: "D.A.F 🛩️", value: "daf" },
        { label: "DAF Shooter 🛩️", value: "daf_shooter" },
        { label: "C.O.T 🛡️", value: "cot" },
        { label: "Internal Investigation ⚖️", value: "inv" },
        { label: "Detective Unit 🔎", value: "detective" },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    const embed = new EmbedBuilder()
      .setColor("#003366")
      .setTitle("📋 Hierarquia DPD")
      .setDescription("Selecione abaixo a unidade para visualizar a hierarquia completa.")
      .setFooter({ text: "Departamento de Polícia de Detroit" })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  },
};

// ======= REAÇÃO AO SELETOR (index.js já usa esta função) =======
module.exports.gerarHierarquiaEmbed = (unidade) => {
  const embed = new EmbedBuilder()
    .setColor("#0A1931")
    .setTimestamp()
    .setFooter({ text: "Departamento de Polícia de Detroit" });

  switch (unidade) {
    // ===== FAST =====
    case "fast":
      embed
        .setTitle("Hierarquia - FAST ⚡")
        .setDescription(`
**Supervisor Fast:**  
@Supervisor Fast ⚡  

**Manager FAST:**  
@Manager FAST ⚡  

**FAST Sub-Manager:**  
@(FAST) Sub-Manager ⚡  

**FAST Counselor:**  
@(FAST) Counselor ⚡  

**FAST Elite Pilot:**  
@(FAST) Elite Pilot ⚡  

**FAST Veteran Pilot:**  
@(FAST) Veteran Pilot ⚡  

**FAST Official Pilot:**  
@(FAST) Official Pilot ⚡  

**FAST Probationary Pilot:**  
@(FAST) Probationary Pilot ⚡  

**FAST Co-Pilot:**  
@(FAST) Co-Pilot ⚡
        `);
      break;

    // ===== MARY =====
    case "mary":
      embed
        .setTitle("Hierarquia - MARY 🚁")
        .setDescription(`
**Supervisor MARY:**  
@Supervisor MARY 🚁  

**Manager MARY:**  
@Manager MARY 🚁  

**(MARY) Sub-Manager:**  
@(MARY) Sub-Manager 🚁  

**(MARY) Conselheiro:**  
@(MARY) Conselheiro 🚁  

**(MARY) Braço Direito:**  
@(MARY) Braço Direito 🚁  

**(MARY) Piloto Elite:**  
@(MARY) Piloto Elite 🚁  

**(MARY) Piloto Veterano:**  
@(MARY) Piloto Veterano 🚁  

**(MARY) Piloto Oficial:**  
@(MARY) Piloto Oficial 🚁  

**(MARY) Piloto Probatório:**  
@(MARY) Piloto Probatório 🚁
        `);
      break;

    // ===== SWAT =====
    case "swat":
      embed
        .setTitle("Hierarquia - S.W.A.T ☠️")
        .setDescription(`
**(S.W.A.T) Supervisor:**  
@(S.W.A.T) Supervisor ☠️  

**(S.W.A.T) Gestor:**  
@(S.W.A.T) Gestor ☠️  

**(S.W.A.T) Coordenador:**  
@(S.W.A.T) Coordenador ☠️  

**(S.W.A.T) Instrutor:**  
@(S.W.A.T) Instrutor ☠️  

**(S.W.A.T) Operador:**  
@(S.W.A.T) Operador ☠️  

**(S.W.A.T) Probatório:**  
@(S.W.A.T) Probatório ☠️
        `);
      break;

    // ===== DAF =====
    case "daf":
      embed
        .setTitle("Hierarquia - D.A.F 🛩️")
        .setDescription(`
**Supervisor D.A.F:**  
@Supervisor D.A.F 🛩️  

**Manager D.A.F:**  
@Manager D.A.F 🛩️  

**(DAF) Crew Chief:**  
@(DAF) Crew Chief 🛩️  

**(DAF) Captain:**  
@(DAF) Captain 🛩️  

**(DAF) Lead Pilot:**  
@(DAF) Lead Pilot 🛩️  

**(DAF) Senior Pilot:**  
@(DAF) Senior Pilot 🛩️  

**(DAF) Officer Pilot:**  
@(DAF) Officer Pilot 🛩️  

**(DAF) Cadet Pilot:**  
@(DAF) Cadet Pilot 🛩️
        `);
      break;

    // ===== DAF SHOOTER =====
    case "daf_shooter":
      embed
        .setTitle("Hierarquia - DAF Shooter 🛩️")
        .setDescription(`
**(DAF) Shooter Captain:**  
@(DAF) Shooter Captain 🛩️  

**(DAF) Lead Shooter:**  
@(DAF) Lead Shooter 🛩️  

**(DAF) Senior Shooter:**  
@(DAF) Senior Shooter 🛩️  

**(DAF) Officer Shooter:**  
@(DAF) Officer Shooter 🛩️  

**(DAF) Cadet Shooter:**  
@(DAF) Cadet Shooter 🛩️
        `);
      break;

    // ===== COT =====
    case "cot":
      embed
        .setTitle("Hierarquia - C.O.T 🛡️")
        .setDescription(`
**(COT) Director:**  
@(COT) Director 🛡️  

**(COT) Chief Officer:**  
@(COT) Chief Officer 🛡️  

**(COT) Supervisor:**  
@(COT) Supervisor 🛡️  

**(COT) Agent:**  
@(COT) Agent 🛡️
        `);
      break;

    // ===== INV =====
    case "inv":
      embed
        .setTitle("Hierarquia - Internal Investigation ⚖️")
        .setDescription(`
**Supervisor Internal Investigation:**  
@Supervisor Internal Investigation ⚖️  

**Manager Internal Investigation:**  
@Manager Internal Investigation ⚖️  

**(I.N.V) Counselor:**  
@(I.N.V) Counselor ⚖️  

**(I.N.V) Senior:**  
@(I.N.V) Senior ⚖️  

**(I.N.V) Official:**  
@(I.N.V) Official ⚖️  

**(I.N.V) Cadet:**  
@(I.N.V) Cadet ⚖️  

**(I.N.V) Probationary:**  
@(I.N.V) Probationary ⚖️
        `);
      break;

    // ===== DETECTIVE UNIT =====
    case "detective":
      embed
        .setTitle("Hierarquia - Detective Unit 🔎")
        .setDescription(`
**Supervisor Detective Unit:**  
@Supervisor Detective Unit 🔎  

**Manager Detective Unit:**  
@Manager Detective Unit 🔎  

**(D.U.) Detective-Lieutenant:**  
@(D.U.) Detective-Lieutenant 🔎  

**(D.U.) Detective III:**  
@(D.U.) Detective III 🔎  

**(D.U.) Detective II:**  
@(D.U.) Detective II 🔎  

**(D.U.) Detective I:**  
@(D.U.) Detective I 🔎  

**(D.U.) Prob. Detective:**  
@(D.U.) Prob. Detective 🔎
        `);
      break;

    default:
      embed.setDescription("❌ Unidade não encontrada.");
  }

  return embed;
};
