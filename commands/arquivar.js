// commands/arquivar.js — Move o canal atual para a categoria de arquivados e remove acesso do autor

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  ChannelType,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("arquivar")
    .setDescription("Arquiva o canal atual movendo-o para a categoria de arquivados e remove o acesso do autor.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    // 🛡️ Verificação de permissão via ID de cargo
    const cargosPermitidosIDs = [
      "1222682312035143710", // Council 💠
      "1238253951535681536", // Internal Investigation ⚖️
    ];

    const temPermissao = interaction.member.roles.cache.some((r) =>
      cargosPermitidosIDs.includes(r.id)
    );

    if (!temPermissao) {
      return interaction.reply({
        content:
          "❌ Você não tem permissão para usar este comando. Apenas membros do **Council 💠** ou da **Internal Investigation ⚖️** podem utilizar.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // ✅ Confere se o BOT tem permissão para mover/editar canal
    const me = interaction.guild.members.me;
    const canalAtual = interaction.channel;

    if (canalAtual.type !== ChannelType.GuildText) {
      return interaction.reply({
        content:
          "❌ Este comando deve ser usado em um **canal de texto do servidor** (não em thread/DM).",
        flags: MessageFlags.Ephemeral,
      });
    }

    const precisa = [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageRoles, // para editar overwrites
    ];

    const tenhoNoCanal = me.permissionsIn(canalAtual).has(precisa, true);
    if (!tenhoNoCanal) {
      return interaction.reply({
        content:
          "❌ Não posso arquivar: meu cargo não tem **permissões suficientes neste canal** (preciso: Ver Canal, Gerenciar Canais e Gerenciar Permissões).",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const guild = interaction.guild;

      // 🗂️ Categoria ALVO fixa (ID informado por você)
      const categoriaArquivadaId = "1345459676636119110";
      const categoriaArquivada = guild.channels.cache.get(categoriaArquivadaId);

      if (
        !categoriaArquivada ||
        categoriaArquivada.type !== ChannelType.GuildCategory
      ) {
        return interaction.reply({
          content:
            "❌ Categoria de arquivados não encontrada ou inválida. Verifique o ID **1345459676636119110**.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const tenhoNaCategoria = me.permissionsIn(categoriaArquivada).has(
        PermissionFlagsBits.ViewChannel | PermissionFlagsBits.ManageChannels,
        true
      );

      if (!tenhoNaCategoria) {
        return interaction.reply({
          content:
            "❌ Não posso arquivar: meu cargo não tem permissão **na categoria de arquivados** (preciso de Ver Canal e Gerenciar Canais lá).",
          flags: MessageFlags.Ephemeral,
        });
      }

      // 1) 🧭 Mover o canal para a categoria de arquivados
      try {
        await canalAtual.setParent(categoriaArquivada.id, {
          lockPermissions: false, // não sincroniza (vamos controlar overwrites abaixo)
          reason: "Arquivar ticket",
        });
      } catch (e) {
        console.error("Falha em setParent:", e);
        return interaction.reply({
          content: "❌ Erro ao mover o canal para a categoria de arquivados.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // 2) 🚫 Impedir novas mensagens de @everyone
      try {
        await canalAtual.permissionOverwrites.edit(guild.roles.everyone, {
          SendMessages: false,
        });
      } catch (e) {
        console.error("Falha ao negar SendMessages para everyone:", e);
        return interaction.reply({
          content:
            "❌ O canal foi movido, mas falhei ao ajustar as permissões de mensagens para @everyone.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // 3) 👤 Remover overwrites de USUÁRIOS (retira acesso do autor e de qualquer usuário individual)
      try {
        const overwrites = [...canalAtual.permissionOverwrites.cache.values()];
        for (const ow of overwrites) {
          // type === 1 => Member (usuário) em discord.js v14
          if (ow.type === 1) {
            try {
              await canalAtual.permissionOverwrites.delete(ow.id, "Arquivado: remover acesso do autor/usuários");
            } catch (e) {
              console.warn(`Não removi overwrite do usuário ${ow.id}:`, e?.message ?? e);
            }
          }
        }
      } catch (e) {
        console.error("Falha ao limpar overwrites de usuários:", e);
        // segue mesmo assim
      }

      // 4) ✅ Resposta final
      await interaction.reply({
        content: `📁 O canal **${canalAtual.name}** foi movido para **${categoriaArquivada.name}** e o acesso do autor foi removido.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Erro ao arquivar canal (catch externo):", error);
      await interaction.reply({
        content:
          "❌ Ocorreu um erro ao tentar arquivar este canal. Veja os logs do console para o ponto exato (setParent/overwrites).",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
