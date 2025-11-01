// commands/arquivar.js — Arquiva ticket com fallback de categoria e remove acesso do autor

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
    // 🛡️ Permissão do executor
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

    // 🔐 Permissões do BOT
    const me = interaction.guild.members.me;
    const canalAtual = interaction.channel;
    if (canalAtual.type !== ChannelType.GuildText) {
      return interaction.reply({
        content: "❌ Use este comando em um **canal de texto do servidor** (não em thread/DM).",
        flags: MessageFlags.Ephemeral,
      });
    }
    const precisa = [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageRoles, // editar overwrites
    ];
    if (!me.permissionsIn(canalAtual).has(precisa, true)) {
      return interaction.reply({
        content:
          "❌ Não posso arquivar: meu cargo não tem **permissões suficientes neste canal** (Ver Canal, Gerenciar Canais e Gerenciar Permissões).",
        flags: MessageFlags.Ephemeral,
      });
    }

    // 🗂️ Categoria primária (fixa)
    const primaryCategoryId = "1345459676636119110";

    try {
      const guild = interaction.guild;

      // Garante que a categoria principal existe (fetch fora do cache, se preciso)
      const primaryCategory = await guild.channels
        .fetch(primaryCategoryId)
        .catch(() => null);

      if (!primaryCategory || primaryCategory.type !== ChannelType.GuildCategory) {
        return interaction.reply({
          content:
            "❌ Categoria de arquivados não encontrada ou inválida. Verifique o ID **1345459676636119110**.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // Função util: conta quantos canais estão dentro da categoria
      const countChildren = (catId) =>
        guild.channels.cache.filter((c) => c.parentId === catId).size;

      // 1) Tenta usar a categoria principal se tiver vaga
      let targetCategory = primaryCategory;
      if (countChildren(primaryCategory.id) >= 50) {
        // 2) Procura outra categoria com mesmo prefixo que tenha vaga
        const baseName = primaryCategory.name; // ex.: "Ticket´s I.N.V Arquivado"
        const normalize = (s) =>
          s
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim();

        const baseNorm = normalize(baseName);

        // varre categorias do servidor que começam com o mesmo prefixo
        const candidatas = guild.channels.cache
          .filter(
            (c) =>
              c.type === ChannelType.GuildCategory &&
              normalize(c.name).startsWith(baseNorm)
          )
          .sort((a, b) => a.name.localeCompare(b.name)); // ordem por nome

        // acha alguma com < 50 canais
        for (const cat of candidatas.values()) {
          if (countChildren(cat.id) < 50) {
            targetCategory = cat;
            break;
          }
        }

        // 3) Se não achou vaga, cria nova automaticamente (ex.: "Ticket´s I.N.V Arquivado 2/3/4...")
        if (countChildren(targetCategory.id) >= 50) {
          // detecta maior sufixo numérico existente
          let maxSuffix = 1;
          for (const cat of candidatas.values()) {
            const m = cat.name.match(/(\d+)\s*$/);
            if (m) {
              const n = parseInt(m[1], 10);
              if (n > maxSuffix) maxSuffix = n;
            }
          }
          const newName =
            maxSuffix === 1 ? `${baseName} 2` : `${baseName} ${maxSuffix + 1}`;

          targetCategory = await guild.channels.create({
            name: newName,
            type: ChannelType.GuildCategory,
            reason: "Criar nova categoria de arquivados (categoria cheia)",
          });
        }
      }

      // 4) Mover canal para a categoria escolhida
      try {
        await canalAtual.setParent(targetCategory.id, {
          lockPermissions: false, // não sincroniza — controlaremos overwrites abaixo
          reason: "Arquivar ticket",
        });
      } catch (e) {
        console.error("Falha em setParent:", e);
        return interaction.reply({
          content:
            "❌ Erro ao mover o canal para a categoria de arquivados (verifique a hierarquia do cargo do bot e permissões na categoria).",
          flags: MessageFlags.Ephemeral,
        });
      }

      // 5) Bloqueia novas mensagens de @everyone
      try {
        await canalAtual.permissionOverwrites.edit(guild.roles.everyone, {
          SendMessages: false,
        });
      } catch (e) {
        console.warn("Falha ao negar SendMessages para everyone:", e?.message ?? e);
      }

      // 6) Remove overwrites de USUÁRIOS (tira acesso do autor e de qualquer usuário individual)
      try {
        const overs = [...canalAtual.permissionOverwrites.cache.values()];
        for (const ow of overs) {
          // type 1 => Member (usuário) em discord.js v14
          if (ow.type === 1) {
            try {
              await canalAtual.permissionOverwrites.delete(
                ow.id,
                "Arquivado: remover acesso de usuários"
              );
            } catch (e) {
              console.warn(
                `Não removi overwrite do usuário ${ow.id}:`,
                e?.message ?? e
              );
            }
          }
        }
      } catch (e) {
        console.warn("Falha ao limpar overwrites de usuários:", e?.message ?? e);
      }

      await interaction.reply({
        content: `📁 O canal **${canalAtual.name}** foi movido para **${targetCategory.name}** e o acesso do autor foi removido.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Erro ao arquivar canal:", error);
      await interaction.reply({
        content:
          "❌ Ocorreu um erro ao tentar arquivar este canal. Verifique os logs para detalhes.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
