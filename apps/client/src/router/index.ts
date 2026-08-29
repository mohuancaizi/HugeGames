import { createRouter, createWebHistory } from "vue-router";
import AdventureView from "../views/AdventureView.vue";
import BattlePreviewView from "../views/BattlePreviewView.vue";
import CardsView from "../views/CardsView.vue";
import NeonDriftView from "../views/NeonDriftView.vue";
import MiniGameView from "../views/MiniGameView.vue";
import NotFoundView from "../views/NotFoundView.vue";
import SummonPreviewView from "../views/SummonPreviewView.vue";
import BootPage from "../views/BootPage.vue";
import OnboardingPage from "../views/OnboardingPage.vue";
import AdventureStageListPage from "../views/AdventureStageListPage.vue";
import StageDetailPage from "../views/StageDetailPage.vue";
import BattlePage from "../views/BattlePage.vue";
import BattleResultPage from "../views/BattleResultPage.vue";
import CardCollectionPage from "../views/CardCollectionPage.vue";
import CardDetailPage from "../views/CardDetailPage.vue";
import FormationEditorPage from "../views/FormationEditorPage.vue";
import SummonPage from "../views/SummonPage.vue";
import SummonResultPage from "../views/SummonResultPage.vue";
import TaskListPage from "../views/TaskListPage.vue";
import IdleRewardPage from "../views/IdleRewardPage.vue";
import MoreMenuPage from "../views/MoreMenuPage.vue";
import SettingsPage from "../views/SettingsPage.vue";
import OfflinePage from "../views/OfflinePage.vue";
import UpdateRequiredPage from "../views/UpdateRequiredPage.vue";
import PortalHomePage from "../views/portal/PortalHomePage.vue";
import PortalGamesPage from "../views/portal/PortalGamesPage.vue";
import PortalGameDetailPage from "../views/portal/PortalGameDetailPage.vue";
import PortalFavoritesPage from "../views/portal/PortalFavoritesPage.vue";
import CrazyGamesHotMetadataPage from "../views/CrazyGamesHotMetadataPage.vue";
import GameCatalogPage from "../views/GameCatalogPage.vue";
import CategoryGamesPage from "../views/CategoryGamesPage.vue";
import GameSearchPage from "../views/GameSearchPage.vue";
import NewGamesPage from "../views/NewGamesPage.vue";
import PopularGamesPage from "../views/PopularGamesPage.vue";
import GameDetailPage from "../views/GameDetailPage.vue";
import GameLaunchPage from "../views/GameLaunchPage.vue";
import FavoritesPage from "../views/FavoritesPage.vue";
import DeveloperServicePage from "../views/DeveloperServicePage.vue";
import AboutPage from "../views/AboutPage.vue";
import PrivacyPage from "../views/PrivacyPage.vue";
import TermsPage from "../views/TermsPage.vue";
import PortalNotFoundPage from "../views/PortalNotFoundPage.vue";

const noNavigation = { hideNavigation: true };
const noIndex = { robots: "noindex,follow" };
const portal = { portal: true };

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/zh" },
    { path: "/home", redirect: "/zh" },
    { path: "/zh", name: "portal-home", component: PortalHomePage, meta: portal },
    { path: "/zh/games", name: "portal-games", component: PortalGamesPage, meta: portal },
    { path: "/zh/category/:slug", name: "portal-category", component: CategoryGamesPage, meta: portal },
    { path: "/zh/search", name: "portal-search", component: GameSearchPage, meta: { ...portal, ...noIndex } },
    { path: "/zh/new", name: "portal-new", component: NewGamesPage, meta: portal },
    { path: "/zh/popular", name: "portal-popular", component: PopularGamesPage, meta: portal },
    { path: "/zh/game/:slug/play", name: "portal-game-play", component: GameLaunchPage, meta: { ...portal, ...noIndex, ...noNavigation, immersive: true } },
    { path: "/zh/game/:slug", name: "portal-game-detail", component: PortalGameDetailPage, meta: portal },
    { path: "/zh/favorites", name: "portal-favorites", component: PortalFavoritesPage, meta: { ...portal, ...noIndex } },
    { path: "/zh/crazygames-hot-metadata", name: "crazygames-hot-metadata", component: CrazyGamesHotMetadataPage, meta: { ...portal, robots: "noindex,nofollow" } },
    { path: "/zh/developer", name: "portal-developer", component: DeveloperServicePage, meta: portal },
    { path: "/zh/about", name: "portal-about", component: AboutPage, meta: portal },
    { path: "/zh/privacy", name: "portal-privacy", component: PrivacyPage, meta: portal },
    { path: "/zh/terms", name: "portal-terms", component: TermsPage, meta: portal },
    { path: "/zh/:pathMatch(.*)*", name: "portal-not-found", component: PortalNotFoundPage, meta: { ...portal, ...noIndex } },
    { path: "/boot", name: "boot", component: BootPage, meta: noNavigation },
    { path: "/onboarding", name: "onboarding", component: OnboardingPage, meta: noNavigation },
    { path: "/adventure", name: "adventure", component: AdventureStageListPage },
    { path: "/adventure/stages/:stageId", name: "stage-detail", component: StageDetailPage, meta: noNavigation },
    { path: "/battle/:battleId", name: "battle", component: BattlePage, meta: noNavigation },
    { path: "/battle/:battleId/result", name: "battle-result", component: BattleResultPage, meta: noNavigation },
    { path: "/cards", name: "cards", component: CardCollectionPage },
    { path: "/cards/:cardId", name: "card-detail", component: CardDetailPage, meta: noNavigation },
    { path: "/formation", name: "formation", component: FormationEditorPage, meta: noNavigation },
    { path: "/summon", name: "summon", component: SummonPage },
    { path: "/summon/result/:requestId", name: "summon-result", component: SummonResultPage, meta: noNavigation },
    { path: "/tasks", name: "tasks", component: TaskListPage },
    { path: "/idle-rewards", name: "idle-rewards", component: IdleRewardPage },
    { path: "/more", name: "more", component: MoreMenuPage },
    { path: "/games", redirect: "/zh/games" },
    { path: "/settings", name: "settings", component: SettingsPage, meta: noNavigation },
    { path: "/offline", name: "offline", component: OfflinePage, meta: noNavigation },
    { path: "/update-required", name: "update-required", component: UpdateRequiredPage, meta: noNavigation },
    { path: "/not-found", name: "not-found", component: NotFoundView, meta: noNavigation },
    { path: "/battle", redirect: "/adventure" },
    { path: "/battle-preview", name: "battle-preview", component: BattlePreviewView, meta: noNavigation },
    { path: "/summon-preview", name: "summon-preview", component: SummonPreviewView, meta: noNavigation },
    { path: "/games/neon-drift", name: "neon-drift", component: NeonDriftView, meta: noNavigation },
    { path: "/games/orbit-architect", name: "orbit-architect", component: MiniGameView, meta: noNavigation },
    { path: "/games/wordsmith", name: "wordsmith", component: MiniGameView, meta: noNavigation },
    { path: "/games/pixel-punch", name: "pixel-punch", component: MiniGameView, meta: noNavigation },
    { path: "/games/tiny-trails", name: "tiny-trails", component: MiniGameView, meta: noNavigation },
    { path: "/games/last-light", name: "last-light", component: MiniGameView, meta: noNavigation },
    { path: "/games/color-switch", name: "color-switch", component: MiniGameView, meta: noNavigation },
    { path: "/games/merge-2048", name: "merge-2048", component: MiniGameView, meta: noNavigation },
    { path: "/games/sky-hopper", name: "sky-hopper", component: MiniGameView, meta: noNavigation },
    { path: "/games/garden-match", name: "garden-match", component: MiniGameView, meta: noNavigation },
    { path: "/games/neon-memory", name: "neon-memory", component: MiniGameView, meta: noNavigation },
    { path: "/games/cannon-stack", name: "cannon-stack", component: MiniGameView, meta: noNavigation },
    { path: "/games/fruit-slice", name: "fruit-slice", component: MiniGameView, meta: noNavigation },
    { path: "/games/maze-escape", name: "maze-escape", component: MiniGameView, meta: noNavigation },
    { path: "/games/quick-tap", name: "quick-tap", component: MiniGameView, meta: noNavigation },
    { path: "/games/stack-tower", name: "stack-tower", component: MiniGameView, meta: noNavigation },
    { path: "/games/rocket-dodge", name: "rocket-dodge", component: MiniGameView, meta: noNavigation },
    { path: "/games/ring-runner", name: "ring-runner", component: MiniGameView, meta: noNavigation },
    { path: "/games/bubble-pop", name: "bubble-pop", component: MiniGameView, meta: noNavigation },
    { path: "/games/number-chain", name: "number-chain", component: MiniGameView, meta: noNavigation },
    { path: "/games/simon-grid", name: "simon-grid", component: MiniGameView, meta: noNavigation },
    { path: "/games/slide-puzzle", name: "slide-puzzle", component: MiniGameView, meta: noNavigation },
    { path: "/games/pipe-connect", name: "pipe-connect", component: MiniGameView, meta: noNavigation },
    { path: "/games/sum-cross", name: "sum-cross", component: MiniGameView, meta: noNavigation },
    { path: "/games/meteor-guard", name: "meteor-guard", component: MiniGameView, meta: noNavigation },
    { path: "/games/harbor-defense", name: "harbor-defense", component: MiniGameView, meta: noNavigation },
    { path: "/games/shadow-hunt", name: "shadow-hunt", component: MiniGameView, meta: noNavigation },
    { path: "/games/laser-grid", name: "laser-grid", component: MiniGameView, meta: noNavigation },
    { path: "/games/drone-swarm", name: "drone-swarm", component: MiniGameView, meta: noNavigation },
    { path: "/games/mini-farm", name: "mini-farm", component: MiniGameView, meta: noNavigation },
    { path: "/games/tower-balance", name: "tower-balance", component: MiniGameView, meta: noNavigation },
    { path: "/games/traffic-flow", name: "traffic-flow", component: MiniGameView, meta: noNavigation },
    { path: "/games/island-builder", name: "island-builder", component: MiniGameView, meta: noNavigation },
    { path: "/games/deep-dive", name: "deep-dive", component: MiniGameView, meta: noNavigation },
    { path: "/games/tap-rush", name: "tap-rush", component: MiniGameView, meta: noNavigation },
    { path: "/games/color-match", name: "color-match", component: MiniGameView, meta: noNavigation },
    { path: "/games/dont-touch-red", name: "dont-touch-red", component: MiniGameView, meta: noNavigation },
    { path: "/games/quick-draw", name: "quick-draw", component: MiniGameView, meta: noNavigation },
    { path: "/games/whack-mole", name: "whack-mole", component: MiniGameView, meta: noNavigation },
    { path: "/games/coin-catcher", name: "coin-catcher", component: MiniGameView, meta: noNavigation },
    { path: "/games/target-range", name: "target-range", component: MiniGameView, meta: noNavigation },
    { path: "/games/button-memory", name: "button-memory", component: MiniGameView, meta: noNavigation },
    { path: "/games/golf-putt", name: "golf-putt", component: MiniGameView, meta: noNavigation },
    { path: "/games/basket-shot", name: "basket-shot", component: MiniGameView, meta: noNavigation },
    { path: "/games/bowling-mini", name: "bowling-mini", component: MiniGameView, meta: noNavigation },
    { path: "/games/fishing-cast", name: "fishing-cast", component: MiniGameView, meta: noNavigation },
    { path: "/games/snowboard-dash", name: "snowboard-dash", component: MiniGameView, meta: noNavigation },
    { path: "/games/skate-line", name: "skate-line", component: MiniGameView, meta: noNavigation },
    { path: "/games/paper-plane", name: "paper-plane", component: MiniGameView, meta: noNavigation },
    { path: "/games/odd-one-out", name: "odd-one-out", component: MiniGameView, meta: noNavigation },
    { path: "/games/memory-pairs", name: "memory-pairs", component: MiniGameView, meta: noNavigation },
    { path: "/games/lights-out", name: "lights-out", component: MiniGameView, meta: noNavigation },
    { path: "/games/color-sort", name: "color-sort", component: MiniGameView, meta: noNavigation },
    { path: "/games/word-scramble", name: "word-scramble", component: MiniGameView, meta: noNavigation },
    { path: "/games/math-blitz", name: "math-blitz", component: MiniGameView, meta: noNavigation },
    { path: "/games/pattern-lock", name: "pattern-lock", component: MiniGameView, meta: noNavigation },
    { path: "/games/shape-fit", name: "shape-fit", component: MiniGameView, meta: noNavigation },
    { path: "/games/resource-route", name: "resource-route", component: MiniGameView, meta: noNavigation },
    { path: "/games/market-merchant", name: "market-merchant", component: MiniGameView, meta: noNavigation },
    { path: "/games/campfire-keeper", name: "campfire-keeper", component: MiniGameView, meta: noNavigation },
    { path: "/games/colony-grid", name: "colony-grid", component: MiniGameView, meta: noNavigation },
    { path: "/games/flood-fill", name: "flood-fill", component: MiniGameView, meta: noNavigation },
    { path: "/games/bridge-builder", name: "bridge-builder", component: MiniGameView, meta: noNavigation },
    { path: "/games/weather-planner", name: "weather-planner", component: MiniGameView, meta: noNavigation },
    { path: "/games/riddle-master", name: "riddle-master", component: MiniGameView, meta: noNavigation },
    { path: "/games/lantern-riddles", name: "lantern-riddles", component: MiniGameView, meta: noNavigation },
    { path: "/games/idiom-picture", name: "idiom-picture", component: MiniGameView, meta: noNavigation },
    { path: "/games/brain-teaser", name: "brain-teaser", component: MiniGameView, meta: noNavigation },
    { path: "/games/who-am-i", name: "who-am-i", component: MiniGameView, meta: noNavigation },
    { path: "/games/story-order", name: "story-order", component: MiniGameView, meta: noNavigation },
    { path: "/games/true-or-funny", name: "true-or-funny", component: MiniGameView, meta: noNavigation },
    { path: "/games/word-riddle", name: "word-riddle", component: MiniGameView, meta: noNavigation },
    { path: "/games/find-star", name: "find-star", component: MiniGameView, meta: noNavigation },
    { path: "/games/find-cat", name: "find-cat", component: MiniGameView, meta: noNavigation },
    { path: "/games/find-color", name: "find-color", component: MiniGameView, meta: noNavigation },
    { path: "/games/find-shape", name: "find-shape", component: MiniGameView, meta: noNavigation },
    { path: "/games/find-fruit", name: "find-fruit", component: MiniGameView, meta: noNavigation },
    { path: "/games/find-shadow", name: "find-shadow", component: MiniGameView, meta: noNavigation },
    { path: "/games/find-number", name: "find-number", component: MiniGameView, meta: noNavigation },
    { path: "/games/find-letter", name: "find-letter", component: MiniGameView, meta: noNavigation },
    { path: "/games/find-twin", name: "find-twin", component: MiniGameView, meta: noNavigation },
    { path: "/games/find-tail", name: "find-tail", component: MiniGameView, meta: noNavigation },
    { path: "/games/spot-dot", name: "spot-dot", component: MiniGameView, meta: noNavigation },
    { path: "/games/spot-face", name: "spot-face", component: MiniGameView, meta: noNavigation },
    { path: "/games/spot-leaf", name: "spot-leaf", component: MiniGameView, meta: noNavigation },
    { path: "/games/spot-cloud", name: "spot-cloud", component: MiniGameView, meta: noNavigation },
    { path: "/games/spot-button", name: "spot-button", component: MiniGameView, meta: noNavigation },
    { path: "/games/odd-animal", name: "odd-animal", component: MiniGameView, meta: noNavigation },
    { path: "/games/odd-food", name: "odd-food", component: MiniGameView, meta: noNavigation },
    { path: "/games/odd-vehicle", name: "odd-vehicle", component: MiniGameView, meta: noNavigation },
    { path: "/games/odd-robot", name: "odd-robot", component: MiniGameView, meta: noNavigation },
    { path: "/games/odd-flower", name: "odd-flower", component: MiniGameView, meta: noNavigation },
    { path: "/games/animal-pairs", name: "animal-pairs", component: MiniGameView, meta: noNavigation },
    { path: "/games/fruit-pairs", name: "fruit-pairs", component: MiniGameView, meta: noNavigation },
    { path: "/games/vehicle-pairs", name: "vehicle-pairs", component: MiniGameView, meta: noNavigation },
    { path: "/games/shape-pairs", name: "shape-pairs", component: MiniGameView, meta: noNavigation },
    { path: "/games/color-pairs", name: "color-pairs", component: MiniGameView, meta: noNavigation },
    { path: "/games/sound-memory", name: "sound-memory", component: MiniGameView, meta: noNavigation },
    { path: "/games/picture-memory", name: "picture-memory", component: MiniGameView, meta: noNavigation },
    { path: "/games/star-memory", name: "star-memory", component: MiniGameView, meta: noNavigation },
    { path: "/games/toy-memory", name: "toy-memory", component: MiniGameView, meta: noNavigation },
    { path: "/games/food-memory", name: "food-memory", component: MiniGameView, meta: noNavigation },
    { path: "/games/card-flip-kids", name: "card-flip-kids", component: MiniGameView, meta: noNavigation },
    { path: "/games/memory-path", name: "memory-path", component: MiniGameView, meta: noNavigation },
    { path: "/games/emoji-sequence", name: "emoji-sequence", component: MiniGameView, meta: noNavigation },
    { path: "/games/light-sequence", name: "light-sequence", component: MiniGameView, meta: noNavigation },
    { path: "/games/animal-sequence", name: "animal-sequence", component: MiniGameView, meta: noNavigation },
    { path: "/games/train-memory", name: "train-memory", component: MiniGameView, meta: noNavigation },
    { path: "/games/rainbow-memory", name: "rainbow-memory", component: MiniGameView, meta: noNavigation },
    { path: "/games/garden-memory", name: "garden-memory", component: MiniGameView, meta: noNavigation },
    { path: "/games/space-memory", name: "space-memory", component: MiniGameView, meta: noNavigation },
    { path: "/games/ocean-memory", name: "ocean-memory", component: MiniGameView, meta: noNavigation },
    { path: "/games/count-apples", name: "count-apples", component: MiniGameView, meta: noNavigation },
    { path: "/games/count-stars", name: "count-stars", component: MiniGameView, meta: noNavigation },
    { path: "/games/count-balloons", name: "count-balloons", component: MiniGameView, meta: noNavigation },
    { path: "/games/count-fish", name: "count-fish", component: MiniGameView, meta: noNavigation },
    { path: "/games/number-order", name: "number-order", component: MiniGameView, meta: noNavigation },
    { path: "/games/number-match", name: "number-match", component: MiniGameView, meta: noNavigation },
    { path: "/games/add-ten", name: "add-ten", component: MiniGameView, meta: noNavigation },
    { path: "/games/add-twenty", name: "add-twenty", component: MiniGameView, meta: noNavigation },
    { path: "/games/minus-ten", name: "minus-ten", component: MiniGameView, meta: noNavigation },
    { path: "/games/times-two", name: "times-two", component: MiniGameView, meta: noNavigation },
    { path: "/games/compare-number", name: "compare-number", component: MiniGameView, meta: noNavigation },
    { path: "/games/more-or-less", name: "more-or-less", component: MiniGameView, meta: noNavigation },
    { path: "/games/missing-number", name: "missing-number", component: MiniGameView, meta: noNavigation },
    { path: "/games/number-path", name: "number-path", component: MiniGameView, meta: noNavigation },
    { path: "/games/shape-count", name: "shape-count", component: MiniGameView, meta: noNavigation },
    { path: "/games/coin-count-kids", name: "coin-count-kids", component: MiniGameView, meta: noNavigation },
    { path: "/games/clock-kids", name: "clock-kids", component: MiniGameView, meta: noNavigation },
    { path: "/games/calendar-kids", name: "calendar-kids", component: MiniGameView, meta: noNavigation },
    { path: "/games/math-balloons", name: "math-balloons", component: MiniGameView, meta: noNavigation },
    { path: "/games/number-bingo", name: "number-bingo", component: MiniGameView, meta: noNavigation },
    { path: "/games/color-paint", name: "color-paint", component: MiniGameView, meta: noNavigation },
    { path: "/games/color-order", name: "color-order", component: MiniGameView, meta: noNavigation },
    { path: "/games/rainbow-sort", name: "rainbow-sort", component: MiniGameView, meta: noNavigation },
    { path: "/games/shape-sort", name: "shape-sort", component: MiniGameView, meta: noNavigation },
    { path: "/games/shape-rotate", name: "shape-rotate", component: MiniGameView, meta: noNavigation },
    { path: "/games/shape-shadow", name: "shape-shadow", component: MiniGameView, meta: noNavigation },
    { path: "/games/shape-build", name: "shape-build", component: MiniGameView, meta: noNavigation },
    { path: "/games/pattern-color", name: "pattern-color", component: MiniGameView, meta: noNavigation },
    { path: "/games/pattern-shape", name: "pattern-shape", component: MiniGameView, meta: noNavigation },
    { path: "/games/pattern-size", name: "pattern-size", component: MiniGameView, meta: noNavigation },
    { path: "/games/shadow-fit", name: "shadow-fit", component: MiniGameView, meta: noNavigation },
    { path: "/games/picture-puzzle", name: "picture-puzzle", component: MiniGameView, meta: noNavigation },
    { path: "/games/tile-match-kids", name: "tile-match-kids", component: MiniGameView, meta: noNavigation },
    { path: "/games/jigsaw-simple", name: "jigsaw-simple", component: MiniGameView, meta: noNavigation },
    { path: "/games/mirror-match", name: "mirror-match", component: MiniGameView, meta: noNavigation },
    { path: "/games/left-right", name: "left-right", component: MiniGameView, meta: noNavigation },
    { path: "/games/up-down", name: "up-down", component: MiniGameView, meta: noNavigation },
    { path: "/games/inside-outside", name: "inside-outside", component: MiniGameView, meta: noNavigation },
    { path: "/games/near-far", name: "near-far", component: MiniGameView, meta: noNavigation },
    { path: "/games/same-different", name: "same-different", component: MiniGameView, meta: noNavigation },
    { path: "/games/animal-home", name: "animal-home", component: MiniGameView, meta: noNavigation },
    { path: "/games/fruit-basket", name: "fruit-basket", component: MiniGameView, meta: noNavigation },
    { path: "/games/toy-box", name: "toy-box", component: MiniGameView, meta: noNavigation },
    { path: "/games/dress-up-order", name: "dress-up-order", component: MiniGameView, meta: noNavigation },
    { path: "/games/wash-hands", name: "wash-hands", component: MiniGameView, meta: noNavigation },
    { path: "/games/brush-teeth", name: "brush-teeth", component: MiniGameView, meta: noNavigation },
    { path: "/games/plant-grow", name: "plant-grow", component: MiniGameView, meta: noNavigation },
    { path: "/games/cook-soup", name: "cook-soup", component: MiniGameView, meta: noNavigation },
    { path: "/games/sort-recycle", name: "sort-recycle", component: MiniGameView, meta: noNavigation },
    { path: "/games/safe-crossing", name: "safe-crossing", component: MiniGameView, meta: noNavigation },
    { path: "/games/traffic-color", name: "traffic-color", component: MiniGameView, meta: noNavigation },
    { path: "/games/day-night", name: "day-night", component: MiniGameView, meta: noNavigation },
    { path: "/games/hot-cold", name: "hot-cold", component: MiniGameView, meta: noNavigation },
    { path: "/games/big-small", name: "big-small", component: MiniGameView, meta: noNavigation },
    { path: "/games/long-short", name: "long-short", component: MiniGameView, meta: noNavigation },
    { path: "/games/heavy-light", name: "heavy-light", component: MiniGameView, meta: noNavigation },
    { path: "/games/happy-sad", name: "happy-sad", component: MiniGameView, meta: noNavigation },
    { path: "/games/animal-food", name: "animal-food", component: MiniGameView, meta: noNavigation },
    { path: "/games/home-rooms", name: "home-rooms", component: MiniGameView, meta: noNavigation },
    { path: "/games/simple-path", name: "simple-path", component: MiniGameView, meta: noNavigation },
    { path: "/:pathMatch(.*)*", redirect: "/not-found" },
  ],
});

router.afterEach((to) => {
  const robots = document.querySelector('meta[name="robots"]') || document.createElement("meta");
  robots.setAttribute("name", "robots"); robots.setAttribute("content", typeof to.meta.robots === "string" ? to.meta.robots : "index,follow"); document.head.appendChild(robots);
  const canonical = document.querySelector('link[rel="canonical"]') || document.createElement("link");
  const basePath = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  canonical.setAttribute("rel", "canonical"); canonical.setAttribute("href", new URL(`${basePath}${to.path.replace(/^\/+/, "")}`, window.location.origin).href); document.head.appendChild(canonical);
});
export default router;
