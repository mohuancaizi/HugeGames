export type CardData = {
  id: string;
  name: string;
  role: string;
  assetId: `HOME-CARD-00${1 | 2 | 3 | 4}`;
  assetPath: string;
  frameAssetId: `HOME-FRAME-00${1 | 2 | 3 | 4}`;
  framePath: string;
  rarity: "SSR" | "SR";
  faction: string;
  accent: "gold" | "teal" | "ice" | "rose";
};

export const teamCards: CardData[] = [
  { id: "dawn-bastion", name: "曙光壁垒", role: "守护", assetId: "HOME-CARD-001", assetPath: "/assets/characters/character-dawn-bastion.svg", frameAssetId: "HOME-FRAME-001", framePath: "/assets/cards/card-frame-gold.svg", rarity: "SSR", faction: "玄甲营", accent: "gold" },
  { id: "starstring-ranger", name: "星弦射手", role: "远程", assetId: "HOME-CARD-002", assetPath: "/assets/characters/character-starstring-ranger.svg", frameAssetId: "HOME-FRAME-002", framePath: "/assets/cards/card-frame-teal.svg", rarity: "SSR", faction: "星弦司", accent: "teal" },
  { id: "holy-priest", name: "圣辉祭司", role: "辅助", assetId: "HOME-CARD-003", assetPath: "/assets/characters/character-holy-priest.svg", frameAssetId: "HOME-FRAME-003", framePath: "/assets/cards/card-frame-ice.svg", rarity: "SR", faction: "太清院", accent: "ice" },
  { id: "night-crow", name: "暗鸦", role: "刺客", assetId: "HOME-CARD-004", assetPath: "/assets/characters/character-night-crow.svg", frameAssetId: "HOME-FRAME-004", framePath: "/assets/cards/card-frame-rose.svg", rarity: "SSR", faction: "夜行司", accent: "rose" },
];

export const quickEntries = [
  { label: "冒险", description: "推进主线", path: "/adventure", icon: "/assets/icons/icon-nav-adventure.svg", assetId: "HOME-NAV-002", tone: "teal" },
  { label: "卡牌", description: "4 张上阵", path: "/cards", icon: "/assets/icons/icon-nav-cards.svg", assetId: "HOME-NAV-003", tone: "ice" },
  { label: "召唤", description: "星辉召唤", path: "/summon-preview", icon: "/assets/icons/icon-nav-more.svg", assetId: "HOME-NAV-004", tone: "rose" },
  { label: "任务", description: "1 项可领", path: "/tasks", icon: "/assets/icons/icon-idle-reward.svg", assetId: "HOME-REWARD-001", tone: "gold" },
  { label: "游戏库", description: "探索小游戏", path: "/zh/games", icon: "/assets/icons/icon-nav-more.svg", assetId: "HOME-NAV-004", tone: "teal" },
] as const;
