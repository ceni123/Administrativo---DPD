// commands/arquivar.js — Move o canal atual para a categoria de arquivados e remove acesso do autor

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ChannelType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("arquivar")
    .setDescription("Arquiva o canal atual movendo-o para a categoria de arquivados e remove o acesso do autor.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    // 🛡️ Verificação de permissão via ID de cargo
    const cargosPermitidosIDs = [
      "1222682312035143710", // Council 💠
      "1238253951535681536"  // Internal Investigation ⚖️
    ];

    const temPermissao = interaction.member.roles.cache.some(r =>
      cargosPermitidosIDs.includes(r.id)
    );

    if (!temPermissao) {
      return interaction.reply({
        content: "❌ Você não tem permissão para usar este comando. Apenas membros do **Council 💠** ou da **Internal Investigation ⚖️** podem utilizar.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // ✅ Confere se o BOT tem permissão para mover canais
    const me = interaction.guild.members.me;
    if (!me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({
        content: "❌ Não posso arquivar: estou sem a permissão **Gerenciar Canais**.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const canalAtual = interaction.channel;
      const guild = interaction.guild;

      // Garantir que é um canal de texto do servidor
      if (canalAtual.type !== ChannelType.GuildText) {
        return interaction.reply({
          content: "❌ Este comando deve ser usado em um **canal de texto do servidor** (não em thread/DM).",
          flags: MessageFlags.Ephemeral,
        });
      }

      // 🗂️ Categoria fixa (ID informado por você)
      const categoriaArquivadaId = "1345459676636119110";
      const categoriaArquivada = guild.channels.cache.get(categoriaArquivadaId);

      if (!categoriaArquivada || categoriaArquivada.type !== ChannelType.GuildCategory) {
        return interaction.reply({
          content: "❌ Categoria de arquivados não encontrada ou inválida. Verifique o ID **1345459676636119110**.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // 🧭 Move o canal para a categoria de arquivados
      await canalAtual.setParent(categoriaArquivada.id, { lockPermissions: false });

      // 🚫 Impede novas mensagens do @everyone
      await canalAtual.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: false,
      });

      // 👤 Remove os overwrites de USUÁRIOS (retira o acesso de quem abriu a denúncia)
      // Obs.: investigadores têm acesso por CARGO, então continuam vendo.
      for (const overwrite of canalAtual.permissionOverwrites.cache.values()) {
        // overwrite.type === 1 => Member (usuário) em discord.js v14
        if (overwrite.type === 1) {
          try {
            await canalAtual.permissionOverwrites.delete(overwrite.id);
          } catch (e) {
            // segue mesmo se um overwrite específico falhar
            console.warn(`Não foi possível remover overwrite do usuário ${overwrite.id}:`, e?.message ?? e);
          }
        }
      }

      await interaction.reply({
        content: `📁 O canal **${canalAtual.name}** foi movido para **${categoriaArquivada.name}** e o acesso do autor foi removido.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Erro ao arquivar canal:", error);
      await interaction.reply({
        content: "❌ Ocorreu um erro ao tentar arquivar este canal.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
