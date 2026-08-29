import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder
} from "discord.js";

export const ARCADE_PANEL_MARKER = "arcade_panel_v4";

export const DEV_ROLE_ID = "1510305056468238558";
export const VERIFIED_ROLE_ID = "1507464092875493527";

/*
 * ============================================================================
 * ARCADE DATA
 * ============================================================================
 */

export const arcadePrizes = [
  {
    id: "premium_1_week",
    name: "1 Week Premium",
    cost: 250,
    description: "One week of premium perks.",
    claimType: "support_ticket"
  },
  {
    id: "custom_badge",
    name: "Custom Badge",
    cost: 500,
    description: "A custom arcade badge role.",
    claimType: "support_ticket"
  },
  {
    id: "dev_ticket",
    name: "Priority Help Ticket",
    cost: 750,
    description: "Priority support access for one ticket.",
    claimType: "support_ticket"
  }
];

export const arcadePoints = new Map();

/*
 * ============================================================================
 * HELPERS
 * ============================================================================
 */

export function hasRole(member, roleId) {
  return Boolean(member?.roles?.cache?.has(roleId));
}

export function isDeveloper(member) {
  return hasRole(member, DEV_ROLE_ID);
}

export function isVerified(member) {
  return hasRole(member, VERIFIED_ROLE_ID);
}

export function getArcadePoints(userId) {
  return arcadePoints.get(userId) ?? 0;
}

export function addArcadePoints(userId, amount) {
  const next = Math.max(
    0,
    (arcadePoints.get(userId) ?? 0) + Number(amount || 0)
  );

  arcadePoints.set(userId, next);

  return next;
}

export function createArcadePrize({
  name,
  cost,
  description
}) {
  const prize = {
    id: `custom_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`,

    name: String(name).trim(),

    cost: Math.max(
      1,
      Number(cost) || 0
    ),

    description: String(
      description || "Custom arcade reward."
    ).trim(),

    claimType: "support_ticket"
  };

  arcadePrizes.push(prize);

  return prize;
}

export function getArcadePrize(prizeId) {
  return arcadePrizes.find(
    (prize) => prize.id === prizeId
  );
}

/*
 * ============================================================================
 * COMPONENTS V2
 * ============================================================================
 */

export const ARCADE_V2_FLAGS =
  MessageFlags.IsComponentsV2;

/*
 * ============================================================================
 * BUTTON HELPER
 * ============================================================================
 */

function arcadeButton(
  customId,
  label,
  emoji,
  style = ButtonStyle.Secondary
) {
  return new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setEmoji(emoji)
    .setStyle(style);
}

/*
 * ============================================================================
 * MAIN ARCADE PANEL
 * ============================================================================
 */

export function buildArcadePanel({
  liveGames = []
} = {}) {
  /*
   * Live multiplayer text
   */
  const liveGamesText =
    liveGames.length > 0
      ? liveGames
          .map((game) => `• ${game}`)
          .join("\n")
      : "• None";

  /*
   * --------------------------------------------------------------------------
   * TITLE
   * --------------------------------------------------------------------------
   */

  const title =
    new TextDisplayBuilder()
      .setContent(
        "# 🕹️ NexusAI Arcade\n" +
        "> earn points by playing games and spend them on real perks"
      );

  /*
   * --------------------------------------------------------------------------
   * TOP BUTTONS
   * --------------------------------------------------------------------------
   */

  const topButtons =
    new ActionRowBuilder()
      .addComponents(
        arcadeButton(
          "arcade_claim_daily",
          "Claim Daily",
          "🎁"
        ),

        arcadeButton(
          "arcade_profile",
          "Profile",
          "👤"
        ),

        arcadeButton(
          "arcade_shop",
          "Shop",
          "🛒"
        )
      );

  /*
   * --------------------------------------------------------------------------
   * LEADERBOARD
   * --------------------------------------------------------------------------
   */

  const leaderboardRow =
    new ActionRowBuilder()
      .addComponents(
        arcadeButton(
          "arcade_leaderboard",
          "Leaderboard",
          "🏅"
        )
      );

  /*
   * --------------------------------------------------------------------------
   * QUESTS / STATS
   * --------------------------------------------------------------------------
   */

  const questStatsRow =
    new ActionRowBuilder()
      .addComponents(
        arcadeButton(
          "arcade_quests",
          "Quests",
          "❓"
        ),

        arcadeButton(
          "arcade_stats",
          "Stats",
          "📈"
        )
      );

  /*
   * --------------------------------------------------------------------------
   * SEPARATOR
   * --------------------------------------------------------------------------
   */

  const separator1 =
    new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(
        SeparatorSpacingSize.Small
      );

  /*
   * --------------------------------------------------------------------------
   * ARCADE LINKS
   * --------------------------------------------------------------------------
   */

  const links =
    new TextDisplayBuilder()
      .setContent(
        "• **Go to Arcade Commands »**\n" +
        "• **Go to Arcade Chat »**\n" +
        "• **Go to Arcade Logs »**"
      );

  /*
 * --------------------------------------------------------------------------
 * LIVE MULTIPLAYER
 * --------------------------------------------------------------------------
 *
 * [ 🔴 ]  Live Multiplayer Games
 *         • None
 */

const liveStatusRow =
  new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("arcade_live_status")
        .setEmoji("🔴")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

const liveGamesDisplay =
  new TextDisplayBuilder()
    .setContent(
      `### Live Multiplayer Games\n${liveGamesText}`
    );

  /*
   * --------------------------------------------------------------------------
   * SEPARATOR
   * --------------------------------------------------------------------------
   */

  const separator2 =
    new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(
        SeparatorSpacingSize.Small
      );

  /*
   * --------------------------------------------------------------------------
   * BOTTOM BUTTONS
   * --------------------------------------------------------------------------
   */

  const separator3 =
    new SeparatorBuilder()
      .setDivider(true)
      .setSpacing(
        SeparatorSpacingSize.Small
      );

  const bottomButtons =
    new ActionRowBuilder()
      .addComponents(
        arcadeButton(
          "arcade_quick_play",
          "Quick Play",
          "🕹️",
          ButtonStyle.Primary
        ),

        arcadeButton(
          "arcade_settings",
          "Settings",
          "⚙️"
        ),

        arcadeButton(
          "arcade_help",
          "Help",
          "❔"
        )
      );

  /*
   * --------------------------------------------------------------------------
   * CONTAINER
   * --------------------------------------------------------------------------
   */

  const container =
    new ContainerBuilder()
      .setAccentColor(0x5865F2)

      .addTextDisplayComponents(
        title
      )

      .addSeparatorComponents(
        separator1
      )

      .addActionRowComponents(
        topButtons
      )

      .addActionRowComponents(
        leaderboardRow
      )

      .addActionRowComponents(
        questStatsRow
      )

      .addTextDisplayComponents(
        links
      )

      .addSeparatorComponents(
        separator2
      )

      .addActionRowComponents(
  liveStatusRow
)

.addTextDisplayComponents(
  liveGamesDisplay
)

      .addSeparatorComponents(
        separator3
      )

      .addActionRowComponents(
        bottomButtons
      );

  return {
    flags: ARCADE_V2_FLAGS,

    components: [
      container
    ]
  };
}

/*
 * ============================================================================
 * QUICK PLAY PANEL
 * ============================================================================
 */

export function buildQuickPlayPanel() {
  const container =
    new ContainerBuilder()
      .setAccentColor(0x5865F2)

      /*
       * TITLE
       */
      .addTextDisplayComponents(
        new TextDisplayBuilder()
          .setContent(
            "# 🕹️ Quick Play\n" +
            "pick a game. it runs right here, only you can see it"
          )
      )

      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(
            SeparatorSpacingSize.Small
          )
      )

      /*
       * SINGLEPLAYER
       */
      .addTextDisplayComponents(
        new TextDisplayBuilder()
          .setContent(
            "### Singleplayer"
          )
      )

      .addActionRowComponents(
        new ActionRowBuilder()
          .addComponents(
            arcadeButton(
              "arcade_game_crime",
              "Crime",
              "🗡️"
            ),

            arcadeButton(
              "arcade_game_search",
              "Search",
              "🔍"
            ),

            arcadeButton(
              "arcade_game_highlow",
              "High-Low",
              "📈"
            )
          )
      )

      .addActionRowComponents(
        new ActionRowBuilder()
          .addComponents(
            arcadeButton(
              "arcade_game_fish",
              "Fish",
              "🐟"
            )
          )
      )

      .addActionRowComponents(
        new ActionRowBuilder()
          .addComponents(
            arcadeButton(
              "arcade_game_mines",
              "Mines",
              "💣"
            ),

            arcadeButton(
              "arcade_game_minesweeper",
              "Minesweeper",
              "🙂"
            )
          )
      )

      .addActionRowComponents(
        new ActionRowBuilder()
          .addComponents(
            arcadeButton(
              "arcade_game_memory",
              "Memory",
              "💫"
            ),

            arcadeButton(
              "arcade_game_wordle",
              "Wordle",
              "🟩"
            )
          )
      )

      .addActionRowComponents(
        new ActionRowBuilder()
          .addComponents(
            arcadeButton(
              "arcade_game_minecraft",
              "Minecraft",
              "🟫"
            )
          )
      )

      /*
       * MULTIPLAYER
       */
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(
            SeparatorSpacingSize.Small
          )
      )

      .addTextDisplayComponents(
        new TextDisplayBuilder()
          .setContent(
            "### Multiplayer"
          )
      )

      .addActionRowComponents(
        new ActionRowBuilder()
          .addComponents(
            arcadeButton(
              "arcade_game_fight",
              "Fight",
              "⚔️"
            ),

            arcadeButton(
              "arcade_game_tictactoe",
              "Tic Tac Toe",
              "❌"
            )
          )
      )

      .addActionRowComponents(
        new ActionRowBuilder()
          .addComponents(
            arcadeButton(
              "arcade_game_connect4",
              "Connect Four",
              "🔴"
            ),

            arcadeButton(
              "arcade_game_rps",
              "RPS",
              "✂️"
            )
          )
      )

      /*
       * BACK
       */
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(
            SeparatorSpacingSize.Small
          )
      )

      .addActionRowComponents(
        new ActionRowBuilder()
          .addComponents(
            arcadeButton(
              "arcade_back",
              "Back",
              "‹"
            )
          )
      );

  return {
    flags: ARCADE_V2_FLAGS,

    components: [
      container
    ]
  };
}

/*
 * ============================================================================
 * SHOP PANEL
 * ============================================================================
 */

export function buildShopPanel() {
  const container =
    new ContainerBuilder()
      .setAccentColor(0xFEE75C)

      .addTextDisplayComponents(
        new TextDisplayBuilder()
          .setContent(
            "# 🛒 Arcade Shop\n" +
            "spend your arcade points on real perks"
          )
      )

      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(
            SeparatorSpacingSize.Small
          )
      );

  /*
   * NO REWARDS
   */
  if (arcadePrizes.length === 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(
          "There are currently no rewards available."
        )
    );
  }

  /*
   * REWARDS
   */
  else {
    container.addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(
          "### Available Rewards"
        )
    );

    for (
      let i = 0;
      i < arcadePrizes.length;
      i += 2
    ) {
      const rewardsRow =
        new ActionRowBuilder();

      const rewards =
        arcadePrizes.slice(
          i,
          i + 2
        );

      for (const prize of rewards) {
        rewardsRow.addComponents(
          new ButtonBuilder()
            .setCustomId(
              `arcade_claim_${prize.id}`
            )
            .setLabel(
              `${prize.name} • ${prize.cost}`
            )
            .setEmoji("🎁")
            .setStyle(
              ButtonStyle.Primary
            )
        );
      }

      container.addActionRowComponents(
        rewardsRow
      );
    }
  }

  /*
   * FOOTER
   */

  container

    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(
          SeparatorSpacingSize.Small
        )
    )

    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(
          "Rewards are created by the **NexusAI development team**."
        )
    )

    .addActionRowComponents(
      new ActionRowBuilder()
        .addComponents(
          arcadeButton(
            "arcade_back",
            "Back",
            "‹"
          )
        )
    );

  return {
    flags: ARCADE_V2_FLAGS,

    components: [
      container
    ]
  };
}

/*
 * ============================================================================
 * DEVELOPER PRIZE HUB
 * ============================================================================
 */

export function buildPrizeHubPanel() {
  const container =
    new ContainerBuilder()
      .setAccentColor(0xED4245)

      .addTextDisplayComponents(
        new TextDisplayBuilder()
          .setContent(
            "# 🛠️ Developer Prize Hub\n" +
            "Manage the rewards available in the NexusAI Arcade."
          )
      )

      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(
            SeparatorSpacingSize.Small
          )
      )

      .addTextDisplayComponents(
        new TextDisplayBuilder()
          .setContent(
            `🔐 Developer role: <@&${DEV_ROLE_ID}>`
          )
      );

  /*
   * CURRENT REWARDS
   */

  if (arcadePrizes.length > 0) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(
          "### Current Rewards"
        )
    );

    for (
      let i = 0;
      i < arcadePrizes.length;
      i += 2
    ) {
      const rewardsRow =
        new ActionRowBuilder();

      for (
        const prize of arcadePrizes.slice(
          i,
          i + 2
        )
      ) {
        rewardsRow.addComponents(
          new ButtonBuilder()
            .setCustomId(
              `arcade_dev_view_${prize.id}`
            )
            .setLabel(
              `${prize.name} • ${prize.cost}`
            )
            .setStyle(
              ButtonStyle.Secondary
            )
        );
      }

      container.addActionRowComponents(
        rewardsRow
      );
    }
  }

  /*
   * CREATE / BACK
   */

  container

    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(
          SeparatorSpacingSize.Small
        )
    )

    .addActionRowComponents(
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(
              "arcade_create_prize"
            )
            .setLabel(
              "Create Prize"
            )
            .setEmoji("➕")
            .setStyle(
              ButtonStyle.Success
            ),

          arcadeButton(
            "arcade_back",
            "Back",
            "‹"
          )
        )
    );

  return {
    flags: ARCADE_V2_FLAGS,

    components: [
      container
    ]
  };
}

/*
 * ============================================================================
 * DEFAULT EXPORT
 * ============================================================================
 */

export default buildArcadePanel;