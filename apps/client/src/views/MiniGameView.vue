<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { rememberRecent } from "../services/portalStorage";
import { kidsGameSlugs, kidsGameSpecs, type KidsGameMode } from "../data/kidsGameSpecs";
import { funGameSlugs, funGameSpecs, type FunGameMode, type FunQuestion, type FunGameSpec } from "../data/funGameSpecs";
import { clamp, floodRegion, isOrthogonalNeighbor, orthogonalNeighbors, rectanglesCollide, toggleCross, pipeConnected } from "../games/engines/utils";

type GameStatus = "idle" | "playing" | "paused" | "gameover";
type GameSlug = "riddle-master" | "lantern-riddles" | "idiom-picture" | "brain-teaser" | "who-am-i" | "story-order" | "true-or-funny" | "word-riddle" | "orbit-architect" | "wordsmith" | "pixel-punch" | "tiny-trails" | "last-light" | "color-switch" | "merge-2048" | "sky-hopper" | "garden-match" | "neon-memory" | "cannon-stack" | "fruit-slice" | "maze-escape" | "quick-tap" | "stack-tower" | "rocket-dodge" | "ring-runner" | "bubble-pop" | "number-chain" | "simon-grid" | "slide-puzzle" | "pipe-connect" | "sum-cross" | "meteor-guard" | "harbor-defense" | "shadow-hunt" | "laser-grid" | "drone-swarm" | "mini-farm" | "tower-balance" | "traffic-flow" | "island-builder" | "deep-dive" | "tap-rush" | "color-match" | "dont-touch-red" | "quick-draw" | "whack-mole" | "coin-catcher" | "target-range" | "button-memory" | "golf-putt" | "basket-shot" | "bowling-mini" | "fishing-cast" | "snowboard-dash" | "skate-line" | "paper-plane" | "odd-one-out" | "memory-pairs" | "lights-out" | "color-sort" | "word-scramble" | "math-blitz" | "pattern-lock" | "shape-fit" | "resource-route" | "market-merchant" | "campfire-keeper" | "colony-grid" | "flood-fill" | "bridge-builder" | "weather-planner" | (typeof kidsGameSlugs)[number];

type NewEntity = { id: number; x: number; y: number; value?: number; color?: string; hit?: boolean; kind?: string; size?: number };
type PipeCell = { id: number; rotation: number; shape: string };
type FarmPlot = { id: number; stage: number };
type OrbitPlanet = { name: string; color: string; radius: number; target: number; drift: number; error: number };
type NeonTile = { id: number; lit: boolean; clicked: boolean };
type CannonTarget = { id: number; x: number; y: number; size: number; speed: number };
type CannonBullet = { id: number; x: number; y: number };
type FruitEntity = { id: number; x: number; y: number; vx: number; vy: number; size: number; kind: "fruit" | "bomb"; sliced: boolean };
type MazePoint = { x: number; y: number };
type WordToken = { id: number; letter: string; used: boolean };
type ColorChoice = { name: string; value: string };
type SkyPlatform = { x: number; y: number; width: number };
type GardenCard = { id: number; value: string; flipped: boolean; matched: boolean };
type PixelTarget = { x: number; y: number; size: number };
type TrailPoint = { x: number; y: number };
type Enemy = { id: number; x: number; y: number; size: number; speed: number };

const route = useRoute();
const slug = computed(() => String(route.params.slug || route.name || ""));
const kidsSpec = computed(() => kidsGameSpecs[slug.value]);
const supportedSlugs: string[] = [...funGameSlugs, "orbit-architect", "wordsmith", "pixel-punch", "tiny-trails", "last-light", "color-switch", "merge-2048", "sky-hopper", "garden-match", "neon-memory", "cannon-stack", "fruit-slice", "maze-escape", "quick-tap", "stack-tower", "rocket-dodge", "ring-runner", "bubble-pop", "number-chain", "simon-grid", "slide-puzzle", "pipe-connect", "sum-cross", "meteor-guard", "harbor-defense", "shadow-hunt", "laser-grid", "drone-swarm", "mini-farm", "tower-balance", "traffic-flow", "island-builder", "deep-dive", "tap-rush", "color-match", "dont-touch-red", "quick-draw", "whack-mole", "coin-catcher", "target-range", "button-memory", "golf-putt", "basket-shot", "bowling-mini", "fishing-cast", "snowboard-dash", "skate-line", "paper-plane", "odd-one-out", "memory-pairs", "lights-out", "color-sort", "word-scramble", "math-blitz", "pattern-lock", "shape-fit", "resource-route", "market-merchant", "campfire-keeper", "colony-grid", "flood-fill", "bridge-builder", "weather-planner", ...kidsGameSlugs];
const configs: Record<string, { title: string; icon: string; description: string; instructions: string }> = {
  "orbit-architect": { title: "Orbit Architect", icon: "🪐", description: "让三颗行星保持在稳定轨道。", instructions: "点击轨道或使用 ← → 选择并调整轨道半径。三颗行星都在绿色稳定带内时持续得分。" },
  wordsmith: { title: "Wordsmith", icon: "🔤", description: "还原打乱的单词，保持连击。", instructions: "点击字母或用键盘输入，拼出正确单词。答错或超时会损失生命。" },
  "pixel-punch": { title: "Pixel Punch", icon: "🥊", description: "在目标消失前完成连环击打。", instructions: "点击发光目标，或按空格出拳。目标倒计时结束就会失去机会。" },
  "tiny-trails": { title: "Tiny Trails", icon: "🧩", description: "不重复走格，穿过越来越复杂的小世界。", instructions: "用方向键、WASD 或下方按钮移动。不能撞墙，也不能走过自己的路径。" },
  "last-light": { title: "Last Light", icon: "🔦", description: "守住信号塔，别让黑暗穿过防线。", instructions: "点击敌人或按数字键 1–3 攻击对应目标。漏掉敌人会损失生命。" },
  "color-switch": { title: "Color Switch", icon: "🎨", description: "匹配中心颜色，越快越高分。", instructions: "点击与中心目标相同的颜色，或按数字键 1–4。错选或倒计时结束会结束本局。" },
  "merge-2048": { title: "Merge 2048", icon: "🔢", description: "滑动数字方格，合成更大的数字。", instructions: "用方向键、WASD、滑动或下方按钮移动。相同数字会合并，棋盘无路可走时结束。" },
  "sky-hopper": { title: "Sky Hopper", icon: "🪽", description: "左右调整落点，持续跳上浮空平台。", instructions: "角色会自动弹跳，使用 A/D 或方向键控制左右，也可点击按钮。掉下平台即结束。" },
  "garden-match": { title: "Garden Match", icon: "🌼", description: "记住花园卡片，配对所有图案。", instructions: "点击翻开两张卡片。配对得分，不匹配会扣除机会并延迟翻回，配完全部卡片即可胜利。" },
  "neon-memory": { title: "Neon Memory", icon: "🧠", description: "记住霓虹灯牌的顺序，依次点亮它们。", instructions: "灯牌会短暂展示顺序，随后点击相同顺序的灯牌。答错即结束，完成一关后网格会升级。" },
  "cannon-stack": { title: "Cannon Stack", icon: "🚀", description: "左右移动炮台，击落不断下落的目标。", instructions: "使用 ← → 或触控按钮移动炮台，按空格或发射按钮开火。击中目标得分，漏掉目标会损失生命。" },
  "fruit-slice": { title: "Fruit Slice", icon: "🍉", description: "切开飞舞水果，但千万不要碰到炸弹。", instructions: "在水果上拖动或点击进行切割。碰到炸弹立即结束，倒计时结束前尽可能多得分。" },
  "maze-escape": { title: "Maze Escape", icon: "🧭", description: "穿过不断升级的迷宫，找到出口。", instructions: "使用方向键、WASD 或触控方向按钮移动。抵达终点即可过关，迷宫会逐关升级并计时。" },
  "quick-tap": { title: "Quick Tap", icon: "⚡", description: "限时点击不断出现的目标圆点。", instructions: "点击金色目标得分；目标消失或点击错误都会结束本局。" },
  "stack-tower": { title: "Stack Tower", icon: "🧱", description: "把移动平台精准堆成高塔。", instructions: "点击或按空格落下平台，重合越多分越高，偏移过大即失败。" },
  "rocket-dodge": { title: "Rocket Dodge", icon: "🚀", description: "左右移动火箭驾驶员躲避坠落火箭。", instructions: "使用方向键或下方按钮移动，撞到火箭结束，存活越久分数越高。" },
  "ring-runner": { title: "Ring Runner", icon: "💫", description: "在环形轨道内外圈切换躲避障碍。", instructions: "点击或按空格切换轨道，避开同圈障碍并坚持到终点。" },
  "bubble-pop": { title: "Bubble Pop", icon: "🫧", description: "只点击当前目标颜色的气泡。", instructions: "点击正确颜色得分；错色或气泡超时会扣生命，生命耗尽结束。" },
  "number-chain": { title: "Number Chain", icon: "🔟", description: "按 1 到 N 的顺序点击数字网格。", instructions: "依次点击数字，点错会扣生命，完成网格后进入更高等级。" },
  "simon-grid": { title: "Simon Grid", icon: "🎛️", description: "记住亮格序列并准确复现。", instructions: "先观察亮格，再按相同顺序点击；错误会结束本局。" },
  "slide-puzzle": { title: "Slide Puzzle", icon: "🧩", description: "滑动数字方块，把 1 到 8 排回原位。", instructions: "点击空格旁的数字方块移动，复原得分并结束本局。" },
  "pipe-connect": { title: "Pipe Connect", icon: "🔧", description: "旋转管道，把水源连到终点。", instructions: "点击管道顺时针旋转，连通蓝色起点和绿色终点即可过关。" },
  "sum-cross": { title: "Sum Cross", icon: "➕", description: "选择数字让总和正好达到目标。", instructions: "点击数字进行选择；正好命中目标得分，超过目标或倒计时结束会扣生命。" },
  "meteor-guard": { title: "Meteor Guard", icon: "☄️", description: "移动防线拦截落下的陨石。", instructions: "左右移动护盾并拦截陨石，漏掉三颗后结束。" },
  "harbor-defense": { title: "Harbor Defense", icon: "⚓", description: "点击靠近港口的目标保护船坞。", instructions: "点击红色目标得分，漏掉目标会扣生命，生命耗尽结束。" },
  "shadow-hunt": { title: "Shadow Hunt", icon: "🕶️", description: "记住短暂出现的正确目标并点中它。", instructions: "观察闪现的暗影，再点击正确格子；点错或超时会失败。" },
  "laser-grid": { title: "Laser Grid", icon: "🔆", description: "旋转反射板让激光击中目标。", instructions: "点击反射板改变方向，激光连到目标时完成关卡。" },
  "drone-swarm": { title: "Drone Swarm", icon: "🛸", description: "点击无人机清除蜂群。", instructions: "点击飞行中的无人机得分，漏掉三架后结束。" },
  "mini-farm": { title: "Mini Farm", icon: "🌱", description: "按顺序照料每块农田并收获。", instructions: "每块地依次浇水、等待生长、收获；错误操作会扣分，完成全部地块胜利。" },
  "tower-balance": { title: "Tower Balance", icon: "🏗️", description: "选择正确重量让塔保持平衡。", instructions: "点击与缺口匹配的重量，连续升层；选错会导致高塔倒塌。" },
  "traffic-flow": { title: "Traffic Flow", icon: "🚦", description: "切换信号灯让车辆安全通过路口。", instructions: "点击信号灯切换方向，避免冲突并累计通过车辆。" },
  "island-builder": { title: "Island Builder", icon: "🏝️", description: "放置地块连接岛屿并管理容量。", instructions: "点击相邻空格放置陆地，连接到主岛得分；超出容量结束。" },
  "deep-dive": { title: "Deep Dive", icon: "🤿", description: "上下驾驶潜艇收集宝藏并躲开暗礁。", instructions: "使用上下键或按钮控制潜艇，收集宝藏，撞到暗礁结束。" },
  "tap-rush": { title: "Tap Rush", icon: "⚡", description: "在目标消失前连续点击闪电。", instructions: "点击闪电目标得分；错过目标或点击空白会结束本局。" },
  "color-match": { title: "Color Match", icon: "🎨", description: "点击与中心颜色相同的色块。", instructions: "观察中心颜色并点击对应色块；选错或超时失败。" },
  "dont-touch-red": { title: "Don't Touch Red", icon: "🔴", description: "点击安全方块，避开红色陷阱。", instructions: "点击绿色安全方块得分，点到红色立即失败。" },
  "quick-draw": { title: "Quick Draw", icon: "🔫", description: "信号亮起后立即拔枪。", instructions: "等待 READY 变成 FIRE 后点击；提前点击会输掉对决。" },
  "whack-mole": { title: "Whack-a-Mole", icon: "🐹", description: "在鼹鼠钻回洞前敲中它。", instructions: "点击冒出的鼹鼠，空洞会变换位置；漏掉三只结束。" },
  "coin-catcher": { title: "Coin Catcher", icon: "🪙", description: "移动篮子接住金币，躲开炸弹。", instructions: "用左右键或按钮移动篮子，接住金币并避开炸弹。" },
  "target-range": { title: "Target Range", icon: "🎯", description: "瞄准靶心，连续打出高分。", instructions: "点击靶心位置；越靠近中心分越高，连续命中升级。" },
  "button-memory": { title: "Button Memory", icon: "🔘", description: "记住按钮亮起的顺序。", instructions: "先观察闪烁顺序，再按相同顺序点击按钮。" },
  "golf-putt": { title: "Golf Putt", icon: "⛳", description: "控制力度让球滚进球洞。", instructions: "选择力度后击球；力度越接近距离，球越容易进洞。" },
  "basket-shot": { title: "Basket Shot", icon: "🏀", description: "找准角度和力度投进篮筐。", instructions: "分别选择角度与力度，再投篮；两者都接近目标才能得分。" },
  "bowling-mini": { title: "Bowling Mini", icon: "🎳", description: "瞄准球瓶并选择合适力度。", instructions: "先选球道方向，再选力度滚球；偏差太大就会洗沟。" },
  "fishing-cast": { title: "Fishing Cast", icon: "🎣", description: "把鱼钩抛进移动的水波。", instructions: "在指针进入绿色区域时抛竿，时机准确才能钓到鱼。" },
  "snowboard-dash": { title: "Snowboard Dash", icon: "🏂", description: "左右滑行穿过雪坡旗门。", instructions: "用左右键或按钮控制滑板，穿过旗门并躲开岩石。" },
  "skate-line": { title: "Skate Line", icon: "🛹", description: "切换滑道躲开路障。", instructions: "用左右键或按钮换道；撞到路障会减少生命。" },
  "paper-plane": { title: "Paper Plane", icon: "✈️", description: "驾驶纸飞机穿越圆环。", instructions: "用上下键或按钮控制高度，穿过圆环并避开云团。" },
  "odd-one-out": { title: "Odd One Out", icon: "👁️", description: "从相似图案中找出唯一不同者。", instructions: "观察网格并点击颜色或形状不同的方块。" },
  "memory-pairs": { title: "Memory Pairs", icon: "🃏", description: "翻牌配对所有图案。", instructions: "每次翻开两张牌，配对成功得分，机会耗尽则失败。" },
  "lights-out": { title: "Lights Out", icon: "💡", description: "把所有亮灯都关掉。", instructions: "点击灯格会翻转自己和相邻灯格，全部熄灭即可过关。" },
  "color-sort": { title: "Color Sort", icon: "🧪", description: "把彩色液体倒进对应试管。", instructions: "点击源试管再点击目标试管；只能倒入同色或空管。" },
  "word-scramble": { title: "Word Scramble", icon: "🔤", description: "把打乱的字母拼回单词。", instructions: "点击字母组成答案，完成后提交；答错会损失生命。" },
  "math-blitz": { title: "Math Blitz", icon: "➗", description: "在闪电计时中解答算式。", instructions: "点击正确答案；答错或倒计时结束会扣除生命。" },
  "pattern-lock": { title: "Pattern Lock", icon: "🔐", description: "按顺序复现图案锁。", instructions: "记住亮起的节点顺序，再依次点击对应圆点。" },
  "shape-fit": { title: "Shape Fit", icon: "🔷", description: "把形状放入正确轮廓。", instructions: "先点击形状，再点击匹配的轮廓；配完全部形状过关。" },
  "resource-route": { title: "Resource Route", icon: "🗺️", description: "规划路线把物资送到营地。", instructions: "点击相邻地图节点铺设路线，避开山地并抵达营地。" },
  "market-merchant": { title: "Market Merchant", icon: "🛒", description: "低价进货，高价卖出。", instructions: "在市场价格低时买入，高价时卖出；赚到目标金币即可成功。" },
  "campfire-keeper": { title: "Campfire Keeper", icon: "🔥", description: "选择燃料让营火撑过黑夜。", instructions: "每回合选择一种燃料，平衡火力与库存，坚持到天亮。" },
  "colony-grid": { title: "Colony Grid", icon: "🏘️", description: "放置建筑发展方格殖民地。", instructions: "把住宅放在电站旁，把工坊放在住宅旁，满足人口目标。" },
  "flood-fill": { title: "Flood Fill", icon: "🌊", description: "换色填满整张棋盘。", instructions: "从左上角开始选择颜色，在限定步数内覆盖所有格子。" },
  "bridge-builder": { title: "Bridge Builder", icon: "🌉", description: "估算桥长跨过一道道峡谷。", instructions: "按住或点击长度按钮选择桥长，过短或过长都会坠落。" },
  "weather-planner": { title: "Weather Planner", icon: "🌤️", description: "根据天气安排正确活动。", instructions: "观察天气图标，选择最合适的活动；连续规划三天即可成功。" },
};
const fallback = { title: "未知游戏", icon: "?", description: "这个游戏暂时不可用。", instructions: "返回大厅浏览其他游戏。" };
const config = computed(() => funSpec.value ? { title: funSpec.value.title, icon: funSpec.value.icon, description: funSpec.value.prompt, instructions: funSpec.value.mode === "order" ? "点击相邻卡片交换位置，整理好后提交。答错会减少生命。" : "阅读题目并选择答案，答对有连击，答错会减少生命。" } : kidsSpec.value ? { title: kidsSpec.value.title, icon: kidsSpec.value.icon, description: kidsSpec.value.prompt, instructions: "点击大按钮完成每一题；答对得分，答错会减少一颗爱心。" } : configs[slug.value as GameSlug] ?? fallback);
const isSupported = computed(() => supportedSlugs.includes(slug.value as GameSlug));
const status = ref<GameStatus>("idle");
const score = ref(0);
const highScore = ref(0);
const lives = ref(3);
const combo = ref(0);
const level = ref(1);
const message = ref("");
const timerLabel = ref("");

let timer = 0;
let pulseTimer = 0;
let pulseRemaining = 0;
let pulseDueAt = 0;
let pulseCallback: (() => void) | null = null;
let animationFrame = 0;
let lastFrame = 0;
const elapsed = ref(0);
const storageKey = computed(() => `arcade-mini-game:${slug.value}:high-score`);

const orbitSelected = ref(0);
const orbitPlanets = ref<OrbitPlanet[]>([]);
const orbitStableSeconds = ref(0);

const wordAnswer = ref("");
const wordTokens = ref<WordToken[]>([]);
const wordTyped = ref("");
const wordRemaining = ref(10);
const wordRound = ref(0);
const wordBank = ["orbit", "pixel", "signal", "garden", "bright", "planet", "航行", "星光"];

const pixelTarget = ref<PixelTarget | null>(null);
const pixelRemaining = ref(0);
const pixelCombo = ref(0);

const trailRows = ref<string[]>([]);
const trailPlayer = ref<TrailPoint>({ x: 1, y: 1 });
const trailGoal = ref<TrailPoint>({ x: 5, y: 5 });
const trailVisited = ref<string[]>([]);
const trailGridSize = 7;
const trailLayouts = [
  ["#######", "#S....#", "###.#.#", "#...#.#", "#.#...#", "#....G#", "#######"],
  ["#######", "#S#...#", "#.#.#.#", "#...#.#", "###.#.#", "#....G#", "#######"],
  ["#######", "#S....#", "#.###.#", "#...#.#", "#.#.#.#", "#...#G#", "#######"],
];

const enemies = ref<Enemy[]>([]);
const enemyNextId = ref(0);
const enemyWave = ref(1);
const enemyKills = ref(0);
const towerPulse = ref(false);

const colorChoices: ColorChoice[] = [
  { name: "珊瑚", value: "#ff6b8b" }, { name: "金黄", value: "#f2b84b" },
  { name: "天蓝", value: "#72c8ff" }, { name: "薄荷", value: "#63d7bc" },
];
const colorTarget = ref<ColorChoice>(colorChoices[0]);
const colorRemaining = ref(3);
const colorCombo = ref(0);

const mergeGrid = ref<number[]>([]);
const mergeWon = ref(false);

const skyPlayer = ref({ x: 45, y: 76, vx: 0, vy: 0 });
const skyPlatforms = ref<SkyPlatform[]>([]);
const skyLeft = ref(false);
const skyRight = ref(false);
const skyHeight = ref(0);

const gardenCards = ref<GardenCard[]>([]);
const gardenFirst = ref<number | null>(null);
const gardenBusy = ref(false);
const gardenPairs = ref(0);
const gardenAttempts = ref(8);

const neonTiles = ref<NeonTile[]>([]);
const neonGridSize = ref(3);
const neonRows = ref(4);
const neonSequence = ref<number[]>([]);
const neonNext = ref(0);
const neonShowing = ref(false);

const cannonX = ref(50);
const cannonTargets = ref<CannonTarget[]>([]);
const cannonBullets = ref<CannonBullet[]>([]);
const cannonNextId = ref(0);
const cannonSpawnTimer = ref(0);

const fruitEntities = ref<FruitEntity[]>([]);
const fruitNextId = ref(0);
const fruitTimeLeft = ref(30);
const fruitPointerDown = ref(false);

const mazeRows = ref<string[]>([]);
const mazeSize = ref(9);
const mazePlayer = ref<MazePoint>({ x: 1, y: 1 });
const mazeGoal = ref<MazePoint>({ x: 7, y: 7 });
const mazeTimeLeft = ref(45);
const mergeTouchStart = ref<{ x: number; y: number } | null>(null);

const newEntities = ref<NewEntity[]>([]);
const newNextId = ref(0);
const newTarget = ref(0);
const newSelected = ref<number[]>([]);
const newGrid = ref<number[]>([]);
const newSequence = ref<number[]>([]);
const newSequenceNext = ref(0);
const newShowIndex = ref(-1);
const newShowing = ref(false);
const newPlayer = ref({ x: 50, y: 78, vx: 0, vy: 0, lane: 0 });
const newShieldX = ref(50);
const newLane = ref(0);
const newSignal = ref(0);
const newFarm = ref<FarmPlot[]>([]);
const newPipe = ref<PipeCell[]>([]);
const newPipeSolved = ref(false);
const newTowerTarget = ref(0);
const newTowerOptions = ref<number[]>([]);
const newTowerHeight = ref(0);
const newIsland = ref<number[]>([]);
const newIslandCapacity = ref(12);
const newDiveY = ref(50);
const newTreasureTaken = ref(false);
const newLaserRotations = ref<number[]>([]);
const newFloodMoves = ref(0);
const newRoundTime = ref(0);
const newPower = ref(50);
const newAngle = ref(50);
const newActive = ref(0);
const newQuickState = ref(0);
const newTargetColor = ref(0);
const newMemoryFirst = ref<number | null>(null);
const newMemorySecond = ref<number | null>(null);
const newMathQuestion = ref("2 + 3 = ?");
const newMathOptions = ref<number[]>([4, 5, 6]);
const newPattern = ref<number[]>([]);
const newPatternNext = ref(0);
const newWeather = ref(0);
const newMarketCash = ref(20);
const newMarketStock = ref(0);
const newFire = ref(50);

type KidsCard = { id: number; value: string; revealed: boolean; matched: boolean };
const kidsMode = computed<KidsGameMode | undefined>(() => kidsSpec.value?.mode);
const kidsOptions = ref<string[]>([]);
const kidsAnswer = ref(0);
const kidsRound = ref(0);
const kidsCards = ref<KidsCard[]>([]);
const kidsFirst = ref<number | null>(null);
const kidsSequence = ref<number[]>([]);
const kidsSequenceNext = ref(0);
const kidsShowing = ref(false);
const kidsBusy = ref(false);
type FunGameState = {
  spec: FunGameSpec;
  question: FunQuestion;
  questionIndex: number;
  clueIndex: number;
  orderItems: string[];
  answered: boolean;
  hintUsed: boolean;
};

const funSpec = computed(() => funGameSpecs[slug.value as (typeof funGameSlugs)[number]]);
const funMode = computed<FunGameMode | undefined>(() => funSpec.value?.mode);
const funGame = ref<FunGameState | null>(null);
const funFeedback = ref("");
const funHintVisible = ref(false);
function startKidsRound(): void {
  const spec = kidsSpec.value;
  if (!spec) return;
  kidsOptions.value = spec.options;
  kidsAnswer.value = spec.answer;
  kidsFirst.value = null;
  kidsBusy.value = false;
  if (spec.mode === "find") return;
  if (spec.mode === "pairs") {
    const values = spec.options.slice(0, 6);
    kidsCards.value = shuffle([...values, ...values]).map((value, id) => ({ id, value, revealed: false, matched: false }));
    return;
  }
  if (spec.mode === "sequence") {
    const length = Math.min(3 + Math.floor(kidsRound.value / 2), 6);
    kidsSequence.value = Array.from({ length }, () => Math.floor(Math.random() * spec.options.length));
    kidsSequenceNext.value = 0;
    kidsShowing.value = true;
    schedulePulse(1300 + length * 120, () => { kidsShowing.value = false; });
  }
}
function startKidsGame(): void { kidsRound.value = 0; kidsSequence.value = []; kidsCards.value = []; kidsShowing.value = false; lives.value = 3; status.value = "playing"; startKidsRound(); }
function kidsPick(index: number): void {
  const spec = kidsSpec.value;
  if (!spec || status.value !== "playing") return;
  if (spec.mode === "find") {
    if (index === kidsAnswer.value) { score.value += 10; kidsRound.value += 1; if (kidsRound.value >= 6) finishGame("观察小达人挑战完成"); else startKidsRound(); }
    else finishGame("找错啦，再仔细看一看");
    return;
  }
  if (spec.mode === "pairs") {
    const card = kidsCards.value[index];
    if (!card || card.matched || card.revealed || kidsBusy.value) return;
    card.revealed = true;
    if (kidsFirst.value === null) { kidsFirst.value = index; return; }
    const first = kidsCards.value[kidsFirst.value];
    kidsBusy.value = true;
    if (first && first.value === card.value) {
      first.matched = true; card.matched = true; score.value += 8; kidsFirst.value = null; kidsBusy.value = false;
      if (kidsCards.value.every((item) => item.matched)) { kidsRound.value += 1; if (kidsRound.value >= 2) finishGame("所有卡片都配对成功"); else startKidsRound(); }
    } else {
      lives.value -= 1;
      message.value = "这两张不一样，再找找看";
      if (lives.value <= 0) {
        finishGame("配对机会用完了");
        return;
      }
      schedulePulse(650, () => {
        if (first) first.revealed = false;
        card.revealed = false;
        kidsFirst.value = null;
        kidsBusy.value = false;
      });
    }
    return;
  }
  if (spec.mode === "sequence") {
    if (kidsShowing.value || index !== kidsSequence.value[kidsSequenceNext.value]) { finishGame("顺序记错了，再试一次"); return; }
    kidsSequenceNext.value += 1; score.value += 5;
    if (kidsSequenceNext.value >= kidsSequence.value.length) { kidsRound.value += 1; if (kidsRound.value >= 4) finishGame("记忆顺序挑战完成"); else startKidsRound(); }
    return;
  }
  if (index !== kidsAnswer.value) { lives.value -= 1; message.value = "再想一想"; if (lives.value <= 0) finishGame("小题目需要再练习"); return; }
  score.value += 7; kidsRound.value += 1; message.value = "答对啦！";
  if (kidsRound.value >= 6) finishGame("儿童益智挑战完成"); else { kidsAnswer.value = (kidsAnswer.value + 1) % spec.options.length; }
}

function startFunQuestion(): void {
  const spec = funSpec.value;
  if (!spec) return;
  const question = spec.questions[funGame.value?.questionIndex ?? 0];
  if (!question) { finishGame("趣味挑战完成"); return; }
  const orderItems = question.order ? shuffle(question.order.map((index) => question.options[index] ?? "")) : [];
  funGame.value = { spec, question, questionIndex: funGame.value?.questionIndex ?? 0, clueIndex: 0, orderItems, answered: false, hintUsed: false };
  funFeedback.value = "";
  funHintVisible.value = false;
  timerLabel.value = spec.mode === "clue" && slug.value === "who-am-i" ? "线索 1" : "";
}
function startFunGame(): void {
  const spec = funSpec.value;
  if (!spec) return;
  funGame.value = null;
  lives.value = 3;
  combo.value = 0;
  startFunQuestion();
  status.value = "playing";
}
function nextFunQuestion(): void {
  if (!funGame.value) return;
  if (funGame.value.questionIndex + 1 >= funGame.value.spec.questions.length) { finishGame("全部题目完成！"); return; }
  funGame.value.questionIndex += 1;
  startFunQuestion();
}
function answerFun(index: number): void {
  const game = funGame.value;
  if (!game || status.value !== "playing" || game.answered) return;
  if (game.spec.mode === "order") return;
  game.answered = true;
  const correct = index === game.question.answer;
  if (correct) {
    combo.value += 1;
    const clueBonus = slug.value === "who-am-i" ? Math.max(1, (game.question.clues?.length ?? 1) - game.clueIndex) : 0;
    score.value += 10 + combo.value * 2 + clueBonus;
    funFeedback.value = `答对啦！${game.question.explanation}`;
    if (game.questionIndex + 1 >= game.spec.questions.length) { finishGame("全部题目完成！"); return; }
    schedulePulse(1000, nextFunQuestion);
  } else {
    lives.value -= 1;
    combo.value = 0;
    funFeedback.value = `再想一想。${game.question.explanation}`;
    if (lives.value <= 0) { finishGame("生命用完了，再挑战一次吧"); return; }
    schedulePulse(1200, () => { if (funGame.value) { funGame.value.answered = false; funFeedback.value = ""; } });
  }
}
function revealFunClue(): void {
  const game = funGame.value;
  if (!game || status.value !== "playing" || game.answered) return;
  const clues = game.question.clues ?? [];
  if (game.clueIndex < clues.length - 1) game.clueIndex += 1;
  timerLabel.value = `线索 ${game.clueIndex + 1}`;
}
function useFunHint(): void {
  const game = funGame.value;
  if (!game || slug.value !== "lantern-riddles" || game.hintUsed || game.answered || status.value !== "playing") return;
  game.hintUsed = true;
  score.value = Math.max(0, score.value - 2);
  funHintVisible.value = true;
}
function moveStoryCard(index: number): void {
  const game = funGame.value;
  if (!game || game.answered || status.value !== "playing") return;
  const items = game.orderItems;
  if (index < 0 || index >= items.length - 1) return;
  [items[index], items[index + 1]] = [items[index + 1] ?? "", items[index] ?? ""];
}
function submitStoryOrder(): void {
  const game = funGame.value;
  if (!game || game.answered || status.value !== "playing") return;
  const expected = game.question.order?.map((index) => game.question.options[index]) ?? [];
  game.answered = true;
  if (game.orderItems.join("|") === expected.join("|")) {
    combo.value += 1;
    score.value += 12 + combo.value * 2;
    funFeedback.value = `顺序正确！${game.question.explanation}`;
    if (game.questionIndex + 1 >= game.spec.questions.length) { finishGame("故事全部整理完成！"); return; }
    schedulePulse(1000, nextFunQuestion);
  } else {
    lives.value -= 1;
    combo.value = 0;
    funFeedback.value = `顺序还可以再调整。${game.question.explanation}`;
    if (lives.value <= 0) { finishGame("生命用完了，再试一次吧"); return; }
    schedulePulse(1200, () => { if (funGame.value) { funGame.value.answered = false; funFeedback.value = ""; } });
  }
}

function handleMergeTouchStart(event: TouchEvent): void {
  const touch = event.touches[0];
  if (touch) mergeTouchStart.value = { x: touch.clientX, y: touch.clientY };
}
function handleMergeTouchEnd(event: TouchEvent): void {
  const start = mergeTouchStart.value;
  const touch = event.changedTouches[0];
  mergeTouchStart.value = null;
  if (!start || !touch) return;
  const dx = touch.clientX - start.x;
  const dy = touch.clientY - start.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) moveMerge(dx > 0 ? "right" : "left");
  else moveMerge(dy > 0 ? "down" : "up");
}

const statusLabel = computed(() => ({ idle: "准备开始", playing: "进行中", paused: "已暂停", gameover: "本局结束" })[status.value]);
const modeLabel = computed(() => funSpec.value ? `第 ${(funGame.value?.questionIndex ?? 0) + 1} 题 · 生命 ${lives.value}` : kidsSpec.value ? `第 ${kidsRound.value + 1} 题 · 生命 ${lives.value}` : slug.value === "wordsmith" ? `生命 ${lives.value}` : slug.value === "tiny-trails" ? `第 ${level.value} 关` : slug.value === "last-light" ? `波次 ${enemyWave.value}` : slug.value === "pixel-punch" ? `连击 ${pixelCombo.value}` : slug.value === "color-switch" ? `连击 ${colorCombo.value}` : slug.value === "merge-2048" ? (mergeWon.value ? "已达 2048" : "方格游戏") : slug.value === "sky-hopper" ? `高度 ${Math.floor(skyHeight.value)}` : slug.value === "garden-match" ? `机会 ${gardenAttempts.value}` : slug.value === "neon-memory" ? (neonShowing.value ? "观察中" : `顺序 ${neonNext.value + 1}`) : slug.value === "cannon-stack" ? `波次 ${enemyWave.value}` : slug.value === "fruit-slice" ? `${fruitTimeLeft.value}s` : slug.value === "maze-escape" ? `${mazeTimeLeft.value}s` : `${orbitStableSeconds.value.toFixed(1)}s 稳定`);

function readHighScore(): void {
  try { highScore.value = Number.parseInt(localStorage.getItem(storageKey.value) ?? "0", 10) || 0; } catch { highScore.value = 0; }
}
function saveHighScore(): void {
  if (score.value <= highScore.value) return;
  highScore.value = score.value;
  try { localStorage.setItem(storageKey.value, String(highScore.value)); } catch { /* 保留内存中的最高分 */ }
}
function schedulePulse(delay: number, callback: () => void): void {
  window.clearTimeout(pulseTimer);
  pulseRemaining = Math.max(0, delay);
  pulseDueAt = performance.now() + pulseRemaining;
  pulseCallback = callback;
  pulseTimer = window.setTimeout(() => {
    pulseTimer = 0;
    pulseRemaining = 0;
    pulseDueAt = 0;
    pulseCallback = null;
    if (status.value === "playing") callback();
  }, pulseRemaining);
}
function pausePulse(): void {
  if (!pulseTimer) return;
  pulseRemaining = Math.max(0, pulseDueAt - performance.now());
  window.clearTimeout(pulseTimer);
  pulseTimer = 0;
}
function resumePulse(): void {
  if (pulseCallback) schedulePulse(pulseRemaining, pulseCallback);
}
function clearScheduledPulse(): void {
  window.clearTimeout(pulseTimer);
  pulseTimer = 0;
  pulseRemaining = 0;
  pulseDueAt = 0;
  pulseCallback = null;
}
function clearLoops(): void {
  window.clearInterval(timer);
  timer = 0;
  window.cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  clearScheduledPulse();
}
function pauseLoops(): void {
  window.clearInterval(timer);
  timer = 0;
  window.cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  pausePulse();
}
function finishGame(text = "挑战完成"): void {
  if (status.value === "gameover") return;
  clearLoops();
  status.value = "gameover";
  message.value = text;
  skyLeft.value = false;
  skyRight.value = false;
  mergeTouchStart.value = null;
  saveHighScore();
}
function resetCommon(): void {
  clearLoops();
  status.value = "idle";
  score.value = 0;
  lives.value = 3;
  combo.value = 0;
  level.value = 1;
  message.value = "";
  timerLabel.value = "";
  elapsed.value = 0;
  skyLeft.value = false;
  skyRight.value = false;
  mergeTouchStart.value = null;
  funGame.value = null;
  funFeedback.value = "";
  funHintVisible.value = false;
}

function makeOrbitPlanets(): void {
  orbitPlanets.value = [
    { name: "A", color: "#f4bb63", radius: 29, target: 29, drift: 5.6, error: 0 },
    { name: "B", color: "#60d7c1", radius: 50, target: 50, drift: -4.2, error: 0 },
    { name: "C", color: "#bf8cff", radius: 71, target: 71, drift: 3.4, error: 0 },
  ];
  orbitSelected.value = 0;
  orbitStableSeconds.value = 0;
}
function orbitFrame(now: number): void {
  if (status.value !== "playing") return;
  const delta = Math.min((now - lastFrame) / 1000, 0.08);
  lastFrame = now;
  let stable = true;
  orbitPlanets.value.forEach((planet) => {
    planet.target += planet.drift * delta;
    planet.target = Math.max(19, Math.min(81, planet.target));
    planet.radius += (planet.target - planet.radius) * delta * 1.6;
    const distance = Math.abs(planet.radius - (29 + orbitPlanets.value.indexOf(planet) * 21));
    planet.error = Math.min(1, distance / 14);
    if (planet.error > 0.48) stable = false;
  });
  if (stable) { orbitStableSeconds.value += delta; score.value = Math.floor(orbitStableSeconds.value * 12); }
  else orbitStableSeconds.value = Math.max(0, orbitStableSeconds.value - delta * 0.3);
  if (orbitPlanets.value.some((planet) => planet.error >= 1)) { finishGame("轨道失衡，行星脱离引力场"); return; }
  animationFrame = window.requestAnimationFrame(orbitFrame);
}
function adjustOrbit(direction: -1 | 1): void {
  if (status.value === "idle" || status.value === "gameover") startGame();
  if (status.value !== "playing") return;
  const planet = orbitPlanets.value[orbitSelected.value];
  if (planet) planet.target = Math.max(19, Math.min(81, planet.target + direction * 4));
}
function selectOrbit(event: MouseEvent | PointerEvent): void {
  if (status.value === "idle" || status.value === "gameover") startGame();
  if (status.value !== "playing") return;
  const element = event.currentTarget as HTMLElement;
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width / 2;
  const y = event.clientY - rect.top - rect.height / 2;
  const distance = Math.sqrt(x * x + y * y) / (Math.min(rect.width, rect.height) / 2) * 100;
  orbitSelected.value = Math.max(0, Math.min(2, Math.round((distance - 29) / 21)));
  const planet = orbitPlanets.value[orbitSelected.value];
  if (planet) planet.target = Math.max(19, Math.min(81, distance));
}
function startOrbit(): void { makeOrbitPlanets(); status.value = "playing"; lastFrame = performance.now(); animationFrame = window.requestAnimationFrame(orbitFrame); }

function shuffle<T>(items: T[]): T[] { return [...items].sort(() => Math.random() - 0.5); }
function nextWord(): void {
  const answer = wordBank[wordRound.value % wordBank.length].toLowerCase();
  wordAnswer.value = answer;
  wordTokens.value = shuffle([...answer]).map((letter, id) => ({ id, letter, used: false }));
  wordTyped.value = "";
  wordRemaining.value = Math.max(5, 10 - Math.floor(wordRound.value / 3));
  timerLabel.value = `${wordRemaining.value}s`;
}
function submitWord(): void {
  if (wordTyped.value.length !== wordAnswer.value.length) return;
  if (wordTyped.value === wordAnswer.value) {
    combo.value += 1;
    score.value += 10 + combo.value * 2;
    wordRound.value += 1;
    nextWord();
  } else {
    lives.value -= 1;
    combo.value = 0;
    message.value = `答案是 ${wordAnswer.value}`;
    wordRound.value += 1;
    if (lives.value <= 0) finishGame("字母失去连接"); else nextWord();
  }
}
function pickWordLetter(token: WordToken): void {
  if (status.value !== "playing" || token.used) return;
  token.used = true;
  wordTyped.value += token.letter;
  if (wordTyped.value.length === wordAnswer.value.length) submitWord();
}
function wordTick(): void {
  if (status.value !== "playing") return;
  wordRemaining.value -= 1;
  timerLabel.value = `${wordRemaining.value}s`;
  if (wordRemaining.value > 0) return;
  lives.value -= 1;
  combo.value = 0;
  wordRound.value += 1;
  if (lives.value <= 0) finishGame("时间耗尽"); else nextWord();
}
function startWord(): void { wordRound.value = 0; nextWord(); status.value = "playing"; timer = window.setInterval(wordTick, 1000); }

function spawnPixelTarget(): void {
  pixelTarget.value = { x: 12 + Math.random() * 76, y: 13 + Math.random() * 70, size: 34 + Math.random() * 10 };
  pixelRemaining.value = Math.max(0.7, 1.8 - elapsed.value / 70);
  timerLabel.value = `${pixelRemaining.value.toFixed(1)}s`;
}
function pixelTick(): void {
  if (status.value !== "playing") return;
  const delta = 0.1;
  elapsed.value += delta;
  pixelRemaining.value -= delta;
  timerLabel.value = `${Math.max(0, pixelRemaining.value).toFixed(1)}s`;
  if (pixelRemaining.value <= 0) { finishGame("目标消失了"); return; }
  if (elapsed.value > 0 && Math.floor(elapsed.value * 10) % 30 === 0) spawnPixelTarget();
}
function hitPixel(): void {
  if (status.value !== "playing" || !pixelTarget.value) return;
  pixelCombo.value += 1;
  score.value += 5 + pixelCombo.value;
  elapsed.value += 0.05;
  spawnPixelTarget();
}
function startPixel(): void { elapsed.value = 0; pixelCombo.value = 0; spawnPixelTarget(); status.value = "playing"; timer = window.setInterval(pixelTick, 100); }

function pointKey(point: TrailPoint): string { return `${point.x},${point.y}`; }
function loadTrailLevel(): void {
  const rows = trailLayouts[(level.value - 1) % trailLayouts.length];
  trailRows.value = rows;
  const startY = rows.findIndex((row) => row.includes("S"));
  const startX = rows[startY]?.indexOf("S") ?? 1;
  const goalY = rows.findIndex((row) => row.includes("G"));
  const goalX = rows[goalY]?.indexOf("G") ?? 5;
  trailPlayer.value = { x: startX, y: startY };
  trailGoal.value = { x: goalX, y: goalY };
  trailVisited.value = [pointKey(trailPlayer.value)];
}
function moveTrail(dx: number, dy: number): void {
  if (status.value === "idle" || status.value === "gameover") startGame();
  if (status.value !== "playing") return;
  const next = { x: trailPlayer.value.x + dx, y: trailPlayer.value.y + dy };
  const tile = trailRows.value[next.y]?.[next.x] ?? "#";
  if (tile === "#" || trailVisited.value.includes(pointKey(next))) { finishGame("路径断裂：不能撞墙或回头"); return; }
  trailPlayer.value = next;
  trailVisited.value.push(pointKey(next));
  if (next.x === trailGoal.value.x && next.y === trailGoal.value.y) {
    score.value += 20 + level.value * 5;
    level.value += 1;
    loadTrailLevel();
  }
}
function startTrail(): void { loadTrailLevel(); status.value = "playing"; }

function spawnEnemy(): void {
  const side = Math.floor(Math.random() * 4);
  const point = side === 0 ? { x: Math.random() * 100, y: -8 } : side === 1 ? { x: 108, y: Math.random() * 100 } : side === 2 ? { x: Math.random() * 100, y: 108 } : { x: -8, y: Math.random() * 100 };
  enemies.value.push({ id: enemyNextId.value++, ...point, size: 18 + Math.random() * 8, speed: 2.4 + enemyWave.value * 0.35 });
}
function lastLightTick(): void {
  if (status.value !== "playing") return;
  if (Math.random() < Math.min(0.22, 0.08 + enemyWave.value * 0.012)) spawnEnemy();
  const next: Enemy[] = [];
  for (const enemy of enemies.value) {
    const dx = 50 - enemy.x;
    const dy = 50 - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    enemy.x += dx / distance * enemy.speed * 0.1;
    enemy.y += dy / distance * enemy.speed * 0.1;
    if (distance < 8) {
      lives.value -= 1;
      towerPulse.value = true;
      schedulePulse(180, () => { towerPulse.value = false; });
    }
    else next.push(enemy);
  }
  enemies.value = next;
  if (lives.value <= 0) { finishGame("信号塔熄灭了"); return; }
  if (enemyKills.value >= enemyWave.value * 8) { enemyWave.value += 1; score.value += 15; }
  timerLabel.value = `敌人 ${enemies.value.length}`;
}
function attackEnemy(id?: number): void {
  if (status.value !== "playing") return;
  const target = id === undefined ? enemies.value[0] : enemies.value.find((enemy) => enemy.id === id);
  if (!target) return;
  enemies.value = enemies.value.filter((enemy) => enemy.id !== target.id);
  enemyKills.value += 1;
  combo.value += 1;
  score.value += 8 + combo.value;
}
function startLastLight(): void { enemies.value = []; enemyNextId.value = 0; enemyWave.value = 1; enemyKills.value = 0; lives.value = 5; status.value = "playing"; timer = window.setInterval(lastLightTick, 100); }

function nextColor(): void {
  const choices = colorChoices.filter((choice) => choice.value !== colorTarget.value.value);
  colorTarget.value = choices[Math.floor(Math.random() * choices.length)] ?? colorChoices[0];
  colorRemaining.value = Math.max(0.55, 2.5 - colorCombo.value * 0.08);
  timerLabel.value = `${colorRemaining.value.toFixed(1)}s`;
}
function colorTick(): void {
  if (status.value !== "playing") return;
  colorRemaining.value -= 0.1;
  timerLabel.value = `${Math.max(0, colorRemaining.value).toFixed(1)}s`;
  if (colorRemaining.value <= 0) finishGame("颜色切换太快了");
}
function chooseColor(index: number): void {
  if (status.value === "idle" || status.value === "gameover") startGame();
  if (status.value !== "playing") return;
  if (colorChoices[index]?.value !== colorTarget.value.value) { colorCombo.value = 0; finishGame("颜色匹配失败"); return; }
  colorCombo.value += 1;
  combo.value = colorCombo.value;
  score.value += 5 + colorCombo.value * 2;
  nextColor();
}
function startColor(): void { colorCombo.value = 0; combo.value = 0; nextColor(); status.value = "playing"; timer = window.setInterval(colorTick, 100); }

function emptyMergeGrid(): number[] { return Array.from({ length: 16 }, () => 0); }
function spawnMergeTile(): void {
  const empty = mergeGrid.value.map((value, index) => value === 0 ? index : -1).filter((index) => index >= 0);
  const index = empty[Math.floor(Math.random() * empty.length)];
  if (index !== undefined) mergeGrid.value[index] = Math.random() < 0.9 ? 2 : 4;
}
function mergeLine(line: number[]): { values: number[]; gained: number } {
  const compact = line.filter((value) => value > 0);
  const result: number[] = [];
  let gained = 0;
  for (let index = 0; index < compact.length; index += 1) {
    if (compact[index] === compact[index + 1]) { const merged = compact[index] * 2; result.push(merged); gained += merged; index += 1; }
    else result.push(compact[index]);
  }
  while (result.length < 4) result.push(0);
  return { values: result, gained };
}
function moveMerge(direction: "up" | "down" | "left" | "right"): void {
  if (status.value === "idle" || status.value === "gameover") startGame();
  if (status.value !== "playing") return;
  const before = mergeGrid.value.join(",");
  const next = emptyMergeGrid();
  let gained = 0;
  for (let line = 0; line < 4; line += 1) {
    const source = direction === "left" || direction === "right" ? [0, 1, 2, 3].map((column) => mergeGrid.value[line * 4 + column]) : [0, 1, 2, 3].map((row) => mergeGrid.value[row * 4 + line]);
    const oriented = direction === "right" || direction === "down" ? source.reverse() : source;
    const merged = mergeLine(oriented);
    gained += merged.gained;
    const values = direction === "right" || direction === "down" ? merged.values.reverse() : merged.values;
    values.forEach((value, index) => { if (direction === "left" || direction === "right") next[line * 4 + index] = value; else next[index * 4 + line] = value; });
  }
  if (next.join(",") === before) { if (!mergeGrid.value.some((value, index) => value === 0 || (index % 4 < 3 && value === mergeGrid.value[index + 1]) || (index < 12 && value === mergeGrid.value[index + 4]))) finishGame("棋盘已无路可走"); return; }
  mergeGrid.value = next;
  score.value += gained;
  if (mergeGrid.value.some((value) => value >= 2048) && !mergeWon.value) { mergeWon.value = true; message.value = "2048 达成！继续挑战更高数字"; }
  spawnMergeTile();
}
function startMerge(): void { mergeGrid.value = emptyMergeGrid(); mergeWon.value = false; spawnMergeTile(); spawnMergeTile(); status.value = "playing"; }

function makeSkyPlatforms(): void {
  skyPlatforms.value = [
    { x: 38, y: 86, width: 25 }, { x: 10, y: 70, width: 24 }, { x: 56, y: 55, width: 23 },
    { x: 25, y: 40, width: 22 }, { x: 68, y: 25, width: 24 }, { x: 44, y: 10, width: 25 },
  ];
  skyPlayer.value = { x: 46, y: 78, vx: 0, vy: 0 };
  skyHeight.value = 0;
}
function skyFrame(now: number): void {
  if (status.value !== "playing") return;
  const delta = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  const player = skyPlayer.value;
  const previousBottom = player.y + 7;
  player.vx += ((skyRight.value ? 1 : 0) - (skyLeft.value ? 1 : 0)) * delta * 150;
  player.vx *= 0.88;
  player.vx = Math.max(-42, Math.min(42, player.vx));
  player.x = Math.max(0, Math.min(93, player.x + player.vx * delta));
  player.vy += 62 * delta;
  player.y += player.vy * delta;
  for (const platform of skyPlatforms.value) {
    if (player.vy > 0 && previousBottom <= platform.y && player.y + 7 >= platform.y && player.x + 7 >= platform.x && player.x <= platform.x + platform.width) { player.y = platform.y - 7; player.vy = -34; skyHeight.value = Math.max(skyHeight.value, 86 - platform.y); score.value = Math.max(score.value, Math.floor(skyHeight.value * 3)); }
  }
  if (player.y > 104) { finishGame("没有接住下一块平台"); return; }
  timerLabel.value = `${Math.floor(skyHeight.value)}m`;
  animationFrame = window.requestAnimationFrame(skyFrame);
}
function setSkyControl(direction: "left" | "right", active: boolean): void { if (direction === "left") skyLeft.value = active; else skyRight.value = active; }
function startSky(): void { makeSkyPlatforms(); status.value = "playing"; lastFrame = performance.now(); animationFrame = window.requestAnimationFrame(skyFrame); }

function startGarden(): void {
  const symbols = ["🌷", "🌿", "🍎", "🐝", "🍄", "🌱", "🦋", "🌻"];
  gardenCards.value = shuffle([...symbols, ...symbols]).map((value, id) => ({ id, value, flipped: false, matched: false }));
  gardenFirst.value = null; gardenBusy.value = false; gardenPairs.value = 0; gardenAttempts.value = 8; status.value = "playing";
}

function beginNeonRound(): void {
  neonGridSize.value = level.value >= 3 ? 4 : 3;
  neonRows.value = level.value >= 3 ? 4 : 4;
  const count = neonGridSize.value * neonRows.value;
  neonSequence.value = shuffle(Array.from({ length: count }, (_, index) => index)).slice(0, Math.min(3 + level.value, count));
  neonNext.value = 0;
  neonTiles.value = Array.from({ length: count }, (_, id) => ({ id, lit: neonSequence.value.includes(id), clicked: false }));
  neonShowing.value = true;
  schedulePulse(Math.max(850, 1500 - level.value * 80), () => {
    neonTiles.value.forEach((tile) => { tile.lit = false; });
    neonShowing.value = false;
  });
}
function clickNeon(tile: NeonTile): void {
  if (status.value === "idle" || status.value === "gameover") startGame();
  if (status.value !== "playing" || neonShowing.value || tile.clicked) return;
  if (tile.id !== neonSequence.value[neonNext.value]) { finishGame("灯牌顺序记错了"); return; }
  tile.clicked = true; tile.lit = true; neonNext.value += 1; score.value += 4 + level.value;
  if (neonNext.value === neonSequence.value.length) {
    level.value += 1; score.value += level.value * 5;
    message.value = "记忆升级";
    schedulePulse(420, beginNeonRound);
  }
}
function startNeon(): void { status.value = "playing"; beginNeonRound(); }

function moveCannon(direction: -1 | 1): void { if (status.value === "idle" || status.value === "gameover") startGame(); if (status.value === "playing") cannonX.value = Math.max(8, Math.min(92, cannonX.value + direction * 8)); }
function fireCannon(): void { if (status.value === "idle" || status.value === "gameover") startGame(); if (status.value !== "playing") return; cannonBullets.value.push({ id: cannonNextId.value++, x: cannonX.value, y: 88 }); }
function spawnCannonTarget(): void { cannonTargets.value.push({ id: cannonNextId.value++, x: 8 + Math.random() * 84, y: -8, size: 6 + Math.random() * 3, speed: 11 + enemyWave.value * 2 + Math.random() * 5 }); }
function cannonFrame(now: number): void {
  if (status.value !== "playing") return;
  const delta = Math.min((now - lastFrame) / 1000, 0.06); lastFrame = now; cannonSpawnTimer.value -= delta;
  if (cannonSpawnTimer.value <= 0) { spawnCannonTarget(); cannonSpawnTimer.value = Math.max(0.34, 1.05 - enemyWave.value * 0.06); }
  cannonBullets.value.forEach((bullet) => { bullet.y -= 65 * delta; });
  cannonTargets.value.forEach((target) => { target.y += target.speed * delta; });
  const hitTargetIds = new Set<number>();
  for (const bullet of cannonBullets.value) {
    const target = cannonTargets.value.find((item) => !hitTargetIds.has(item.id) && Math.abs(item.x - bullet.x) < item.size && Math.abs(item.y - bullet.y) < item.size);
    if (target) { hitTargetIds.add(target.id); bullet.y = -20; score.value += 10 + enemyWave.value; enemyKills.value += 1; }
  }
  cannonTargets.value = cannonTargets.value.filter((target) => !hitTargetIds.has(target.id));
  const missed = cannonTargets.value.filter((target) => target.y > 102).length;
  if (missed) { lives.value -= missed; cannonTargets.value = cannonTargets.value.filter((target) => target.y <= 102); }
  cannonTargets.value = cannonTargets.value.filter((target) => target.y <= 110);
  cannonBullets.value = cannonBullets.value.filter((bullet) => bullet.y > -10);
  if (enemyKills.value >= enemyWave.value * 8) { enemyWave.value += 1; score.value += 20; }
  timerLabel.value = `生命 ${lives.value}`;
  if (lives.value <= 0) { finishGame("目标突破防线"); return; }
  animationFrame = window.requestAnimationFrame(cannonFrame);
}
function startCannon(): void { cannonX.value = 50; cannonTargets.value = []; cannonBullets.value = []; cannonNextId.value = 0; cannonSpawnTimer.value = 0.2; enemyWave.value = 1; enemyKills.value = 0; lives.value = 3; status.value = "playing"; lastFrame = performance.now(); animationFrame = window.requestAnimationFrame(cannonFrame); }

function spawnFruit(): void { fruitEntities.value.push({ id: fruitNextId.value++, x: 12 + Math.random() * 76, y: 105, vx: (Math.random() - 0.5) * 22, vy: -(42 + Math.random() * 18), size: 7 + Math.random() * 3, kind: Math.random() < 0.16 ? "bomb" : "fruit", sliced: false }); }
function sliceFruitEntity(target: FruitEntity): void {
  if (status.value === "idle" || status.value === "gameover") startGame();
  if (status.value !== "playing" || target.sliced) return;
  target.sliced = true;
  if (target.kind === "bomb") { finishGame("碰到了炸弹"); return; }
  score.value += 8; combo.value += 1;
}
function sliceFruitAt(event: PointerEvent): void {
  if (status.value === "idle" || status.value === "gameover") startGame();
  if (status.value !== "playing") return;
  const arena = event.currentTarget as HTMLElement; const rect = arena.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width * 100; const y = (event.clientY - rect.top) / rect.height * 100;
  const target = fruitEntities.value.find((item) => !item.sliced && Math.hypot(item.x - x, item.y - y) < item.size + 5);
  if (target) sliceFruitEntity(target);
}
function fruitFrame(now: number): void {
  if (status.value !== "playing") return;
  const delta = Math.min((now - lastFrame) / 1000, 0.06); lastFrame = now; elapsed.value += delta;
  fruitTimeLeft.value = Math.max(0, 30 - Math.floor(elapsed.value));
  if (Math.random() < delta * (1.2 + level.value * 0.08)) spawnFruit();
  fruitEntities.value.forEach((item) => { item.x += item.vx * delta; item.vy += 46 * delta; item.y += item.vy * delta; });
  fruitEntities.value = fruitEntities.value.filter((item) => !item.sliced && item.y < 115);
  timerLabel.value = `${fruitTimeLeft.value}s`;
  if (fruitTimeLeft.value <= 0) { finishGame("时间到"); return; }
  animationFrame = window.requestAnimationFrame(fruitFrame);
}
function startFruit(): void { fruitEntities.value = []; fruitNextId.value = 0; fruitTimeLeft.value = 30; elapsed.value = 0; combo.value = 0; status.value = "playing"; lastFrame = performance.now(); animationFrame = window.requestAnimationFrame(fruitFrame); }

function buildMaze(): void {
  mazeSize.value = Math.min(15, 9 + Math.floor((level.value - 1) / 2) * 2);
  const rows = Array.from({ length: mazeSize.value }, () => Array.from({ length: mazeSize.value }, () => "#"));
  for (let y = 1; y < mazeSize.value - 1; y += 1) {
    if (y % 2 === 1) for (let x = 1; x < mazeSize.value - 1; x += 1) rows[y][x] = ".";
    else rows[y][y % 4 === 0 ? mazeSize.value - 2 : 1] = ".";
  }
  rows[1][1] = "S"; rows[mazeSize.value - 2][mazeSize.value - 2] = "G";
  mazeRows.value = rows.map((row) => row.join("")); mazePlayer.value = { x: 1, y: 1 }; mazeGoal.value = { x: mazeSize.value - 2, y: mazeSize.value - 2 }; mazeTimeLeft.value = Math.max(22, 48 - level.value * 2); timerLabel.value = `${mazeTimeLeft.value}s`;
}
function mazeTick(): void { if (status.value !== "playing") return; mazeTimeLeft.value -= 1; timerLabel.value = `${Math.max(0, mazeTimeLeft.value)}s`; if (mazeTimeLeft.value <= 0) finishGame("迷宫计时结束"); }
function moveMaze(dx: number, dy: number): void {
  if (status.value === "idle" || status.value === "gameover") startGame(); if (status.value !== "playing") return;
  const next = { x: mazePlayer.value.x + dx, y: mazePlayer.value.y + dy }; const tile = mazeRows.value[next.y]?.[next.x] ?? "#";
  if (tile === "#") return; mazePlayer.value = next;
  if (next.x === mazeGoal.value.x && next.y === mazeGoal.value.y) { score.value += 30 + level.value * 8; level.value += 1; buildMaze(); }
}
function startMaze(): void { buildMaze(); status.value = "playing"; timer = window.setInterval(mazeTick, 1000); }
function flipGarden(card: GardenCard): void {
  if (status.value !== "playing" || gardenBusy.value || card.flipped || card.matched) return;
  card.flipped = true;
  if (gardenFirst.value === null) { gardenFirst.value = card.id; return; }
  const first = gardenCards.value.find((item) => item.id === gardenFirst.value);
  gardenBusy.value = true;
  const matched = Boolean(first && first.value === card.value);
  if (matched) {
    if (first) first.matched = true;
    card.matched = true; gardenPairs.value += 1; score.value += 12; gardenFirst.value = null; gardenBusy.value = false;
    if (gardenPairs.value === 8) finishGame("花园里的花朵全部配对成功");
  } else {
    gardenAttempts.value -= 1; combo.value = 0;
    schedulePulse(650, () => {
      if (first) first.flipped = false;
      card.flipped = false;
      gardenFirst.value = null;
      gardenBusy.value = false;
      if (gardenAttempts.value <= 0) finishGame("记忆机会用完了");
    });
  }
}

function newEntity(x: number, y: number, value?: number, kind = "target", color?: string): NewEntity { return { id: newNextId.value++, x, y, value, kind, color, size: kind === "bubble" ? 8 : 6 }; }
function resetNewEntities(): void { newEntities.value = []; newNextId.value = 0; newSelected.value = []; newRoundTime.value = 0; newTarget.value = 0; newSequence.value = []; newSequenceNext.value = 0; newShowIndex.value = -1; newShowing.value = false; newLaserRotations.value = []; newFloodMoves.value = 0; newTreasureTaken.value = false; newFarm.value = []; newPipe.value = []; newPower.value = 50; newAngle.value = 50; newActive.value = 0; newQuickState.value = 0; newTargetColor.value = 0; newMemoryFirst.value = null; newMemorySecond.value = null; newMarketCash.value = 20; newMarketStock.value = 0; newFire.value = 50; }
function newGridClick(index: number): void {
  if (status.value !== "playing" || index < 0 || index >= newGrid.value.length) return;
  if (slug.value === "lights-out") {
    newGrid.value = toggleCross(newGrid.value, index, 5);
    score.value += 1;
    if (newGrid.value.every((item) => item === 0)) finishGame("所有灯格已熄灭");
  } else if (slug.value === "odd-one-out") {
    if (index === newTarget.value) { score.value += 15; level.value += 1; startOddOne(); } else finishGame("找错了不同方块");
  } else if (slug.value === "pattern-lock") {
    if (newShowing.value || index !== newPattern.value[newPatternNext.value]) { finishGame("图案顺序错误"); return; }
    newPatternNext.value += 1; score.value += 5;
    if (newPatternNext.value === newPattern.value.length) { level.value += 1; score.value += 15; finishGame("图案锁已解开"); }
  } else if (slug.value === "shape-fit") {
    if (newSelected.value.length === 0) { newSelected.value = [index]; return; }
    const source = newSelected.value[0];
    if (source % 4 === index) { newGrid.value[source] = 0; newGrid.value[index] = 2; score.value += 10; newSelected.value = []; if (newGrid.value.filter((item) => item === 2).length >= 4) finishGame("形状全部归位"); }
    else { newSelected.value = []; lives.value -= 1; if (lives.value <= 0) finishGame("形状放置失败"); }
  } else if (slug.value === "color-sort") {
    if (newSelected.value.length === 0) { newSelected.value = [index]; return; }
    const source = newSelected.value[0];
    if (newGrid.value[source] === newGrid.value[index] && source !== index) { newGrid.value[source] = 0; newGrid.value[index] = 2; score.value += 8; newSelected.value = []; if (newGrid.value.filter((item) => item === 2).length >= 4) finishGame("颜色全部分拣完成"); }
    else { newSelected.value = []; lives.value -= 1; if (lives.value <= 0) finishGame("试管混色失败"); }
  } else if (slug.value === "colony-grid") {
    if (newGrid.value[index] !== 0) return;
    const neighbors = orthogonalNeighbors(index, 5, newGrid.value.length);
    if (!neighbors.some((item) => newGrid.value[item] > 0)) return;
    newGrid.value[index] = newActive.value + 1; score.value += 5;
    if (newGrid.value.filter((item) => item === 1).length >= 3 && newGrid.value.filter((item) => item === 2).length >= 2) finishGame("殖民地运转成功");
  }
}
function startOddOne(): void { newTarget.value = Math.floor(Math.random() * 16); newGrid.value = Array.from({ length: 16 }, (_, index) => index === newTarget.value ? 1 : 0); }
function chooseNewColor(index: number): void { if (status.value !== "playing") return; if (index !== newTargetColor.value) { finishGame("颜色匹配错误"); return; } score.value += 8; newTargetColor.value = Math.floor(Math.random() * 4); newRoundTime.value = 2; }
function startPhysics(): void { newPower.value = 50; newAngle.value = 50; newRoundTime.value = 0; }
function setPower(value: number): void { if (status.value !== "playing") return; newPower.value = value; }
function setAngle(value: number): void { if (status.value !== "playing") return; newAngle.value = value; }
function setRangePower(event: Event): void { setPower(Number((event.target as HTMLInputElement).value)); }
function setRangeAngle(event: Event): void { setAngle(Number((event.target as HTMLInputElement).value)); }
function launchPhysics(): void {
  if (status.value !== "playing") return;
  const target = slug.value === "golf-putt" ? 55 : slug.value === "basket-shot" ? 68 : slug.value === "bowling-mini" ? 42 : 58;
  const hit = Math.abs(newPower.value - target) < 12 && (slug.value === "golf-putt" || Math.abs(newAngle.value - 55) < 18);
  if (hit) { score.value += 20 + level.value * 5; level.value += 1; message.value = "漂亮命中！"; if (level.value >= 4) finishGame("物理挑战完成"); else startPhysics(); }
  else { lives.value -= 1; message.value = "力度或角度偏了"; if (lives.value <= 0) finishGame("球路失误"); }
}
function moveNewVertical(direction: -1 | 1): void { if (status.value === "idle" || status.value === "gameover") startGame(); if (status.value === "playing") newPlayer.value.y = Math.max(12, Math.min(86, newPlayer.value.y + direction * 8)); }
function marketAction(action: "buy" | "sell"): void { if (status.value !== "playing") return; const price = newTarget.value; if (action === "buy" && newMarketCash.value >= price) { newMarketCash.value -= price; newMarketStock.value += 1; } else if (action === "sell" && newMarketStock.value > 0) { newMarketStock.value -= 1; newMarketCash.value += price; score.value = Math.max(score.value, newMarketCash.value); if (newMarketCash.value >= 45) finishGame("商路经营成功"); } }
function campfireAction(value: number): void { if (status.value !== "playing") return; newFire.value += value; newRoundTime.value += 1; if (newFire.value < 15 || newFire.value > 95) { finishGame("营火熄灭或失控"); return; } score.value += 4; if (elapsed.value >= 18) finishGame("平安守到天亮"); }
function routePlace(index: number): void {
  if (status.value !== "playing" || index < 0 || index >= newGrid.value.length || newGrid.value[index]) return;
  const neighbors = orthogonalNeighbors(index, 5, newGrid.value.length);
  if (!neighbors.some((item) => newGrid.value[item] === 1)) {
    message.value = "路线必须从相邻节点继续";
    return;
  }
  newGrid.value[index] = 1;
  score.value += 5;
  if (index === 24) finishGame("物资抵达营地");
}
function floodPick(color: number): void { if (status.value !== "playing") return; newTargetColor.value = color; const old = newGrid.value[0]; newGrid.value = newGrid.value.map((item) => item === old ? color : item); score.value += 2; if (newGrid.value.every((item) => item === color)) finishGame("棋盘填色完成"); }
function bridgePick(length: number): void { if (status.value !== "playing") return; const gap = newTarget.value; if (Math.abs(length - gap) > 8) finishGame("桥长不合适"); else { score.value += 12; newTarget.value = 28 + Math.floor(Math.random() * 42); if (score.value >= 48) finishGame("成功跨过所有峡谷"); } }
function weatherPick(index: number): void { if (status.value !== "playing") return; if (index !== newWeather.value) { lives.value -= 1; if (lives.value <= 0) finishGame("天气计划失误"); return; } score.value += 10; level.value += 1; newWeather.value = Math.floor(Math.random() * 3); if (level.value >= 4) finishGame("三日计划完成"); }
function toggleBuilding(): void { if (status.value === "playing") newActive.value = newActive.value === 0 ? 1 : 0; }
function startNewGameFrame(): void { lastFrame = performance.now(); animationFrame = window.requestAnimationFrame(newFrame); }
function startNewMode(): void {
  resetNewEntities(); status.value = "playing"; lives.value = 3; newPlayer.value = { x: 50, y: 78, vx: 0, vy: 0, lane: 0 }; newShieldX.value = 50; newLane.value = 0; newSignal.value = 0; newIslandCapacity.value = 12; newPipeSolved.value = false; newTowerHeight.value = 0;
  if (slug.value === "quick-tap") { newEntities.value = [newEntity(50, 50, undefined, "quick", "#ffd166")]; newRoundTime.value = 1.5; }
  else if (slug.value === "stack-tower") newEntities.value = [newEntity(50, 88, 28, "platform", "#f59e0b")];
  else if (["rocket-dodge", "meteor-guard", "deep-dive"].includes(slug.value)) { newEntities.value = []; newRoundTime.value = 0; }
  else if (slug.value === "ring-runner") { newLane.value = 0; newEntities.value = [newEntity(50, -10, 0, "ring-obstacle", "#b692ff")]; }
  else if (slug.value === "bubble-pop") { newTarget.value = 0; newEntities.value = Array.from({ length: 5 }, (_, index) => newEntity(12 + index * 19, 22 + Math.random() * 60, undefined, "bubble", ["#5dd6e8", "#ff78a8", "#ffd166"][Math.floor(Math.random() * 3)])); newRoundTime.value = 2; }
  else if (slug.value === "number-chain") { newGrid.value = shuffle(Array.from({ length: 16 }, (_, index) => index + 1)); newTarget.value = 1; newRoundTime.value = 18; }
  else if (slug.value === "simon-grid") beginNewSimon();
  else if (slug.value === "slide-puzzle") { newGrid.value = [1, 2, 3, 4, 5, 6, 0, 7, 8]; newRoundTime.value = 45; }
  else if (slug.value === "pipe-connect") { newPipe.value = Array.from({ length: 9 }, (_, id) => ({ id, rotation: Math.floor(Math.random() * 4), shape: id === 4 ? "cross" : "corner" })); newRoundTime.value = 30; }
  else if (slug.value === "sum-cross") { newTarget.value = 18 + Math.floor(Math.random() * 14); newEntities.value = Array.from({ length: 12 }, (_, index) => newEntity(15 + (index % 4) * 23, 23 + Math.floor(index / 4) * 23, 2 + Math.floor(Math.random() * 9), "sum", "#7da8ff")); newRoundTime.value = 15; }
  else if (["harbor-defense", "drone-swarm", "shadow-hunt"].includes(slug.value)) { newEntities.value = []; newRoundTime.value = 0; if (slug.value === "shadow-hunt") spawnShadow(); }
  else if (slug.value === "laser-grid") { newLaserRotations.value = [1, 2, 3, 1, 2, 0, 3, 1, 2]; newRoundTime.value = 30; }
  else if (slug.value === "mini-farm") newFarm.value = Array.from({ length: 6 }, (_, id) => ({ id, stage: 0 }));
  else if (slug.value === "tower-balance") chooseTowerRound();
  else if (slug.value === "traffic-flow") { newSignal.value = 0; newEntities.value = [newEntity(0, 35, 0, "car", "#6fb6d9"), newEntity(100, 65, 1, "car", "#e5b76b")]; }
  else if (slug.value === "island-builder") newIsland.value = Array.from({ length: 25 }, (_, index) => index === 12 ? 1 : 0);
  else if (["tap-rush", "whack-mole", "target-range"].includes(slug.value)) { newEntities.value = [newEntity(50, 45, undefined, slug.value === "whack-mole" ? "mole" : "tap", slug.value === "target-range" ? "#ef7893" : "#ffd166")]; newRoundTime.value = 1.5; }
  else if (slug.value === "color-match") { newTargetColor.value = Math.floor(Math.random() * 4); newRoundTime.value = 2; }
  else if (slug.value === "dont-touch-red") { newEntities.value = Array.from({ length: 9 }, (_, index) => newEntity(18 + (index % 3) * 32, 28 + Math.floor(index / 3) * 24, index === Math.floor(Math.random() * 9) ? 1 : 0, "safe", index === newTarget.value ? "#e56b6f" : "#63d7bc")); }
  else if (slug.value === "quick-draw") { newQuickState.value = 1; newRoundTime.value = 1.2 + Math.random() * 1.5; }
  else if (slug.value === "button-memory") { newSequence.value = [Math.floor(Math.random() * 9), Math.floor(Math.random() * 9), Math.floor(Math.random() * 9)]; newSequenceNext.value = 0; newGrid.value = Array.from({ length: 9 }, () => 0); newShowing.value = true; schedulePulse(1100, () => { newShowing.value = false; }); }
  else if (["golf-putt", "basket-shot", "bowling-mini", "fishing-cast"].includes(slug.value)) startPhysics();
  else if (["snowboard-dash", "skate-line", "paper-plane", "coin-catcher"].includes(slug.value)) { newEntities.value = []; newRoundTime.value = 0; newPlayer.value = { x: 50, y: 78, vx: 0, vy: 0, lane: 1 }; }
  else if (slug.value === "odd-one-out") startOddOne();
  else if (slug.value === "memory-pairs") { newGrid.value = shuffle([0, 0, 1, 1, 2, 2, 3, 3]); newSelected.value = []; newMemoryFirst.value = null; }
  else if (slug.value === "lights-out") newGrid.value = [1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1];
  else if (slug.value === "color-sort") newGrid.value = [1, 2, 1, 2, 3, 3, 0, 0];
  else if (slug.value === "word-scramble") { wordRound.value = 0; nextWord(); newRoundTime.value = 8; }
  else if (slug.value === "math-blitz") { newTarget.value = 5; newMathQuestion.value = "2 + 3 = ?"; newMathOptions.value = [4, 5, 6]; newRoundTime.value = 3; }
  else if (slug.value === "pattern-lock") { newPattern.value = shuffle(Array.from({ length: 9 }, (_, index) => index)).slice(0, 4); newPatternNext.value = 0; newShowing.value = true; schedulePulse(1000, () => { newShowing.value = false; }); }
  else if (slug.value === "shape-fit") newGrid.value = [0, 1, 2, 3, 0, 0, 0, 0];
  else if (slug.value === "resource-route") { newGrid.value = Array.from({ length: 25 }, (_, index) => index === 0 ? 1 : 0); }
  else if (slug.value === "market-merchant") { newTarget.value = 4; newMarketCash.value = 20; newMarketStock.value = 0; newRoundTime.value = 2; }
  else if (slug.value === "campfire-keeper") { newFire.value = 50; newRoundTime.value = 0; }
  else if (slug.value === "colony-grid") { newGrid.value = Array.from({ length: 25 }, (_, index) => index === 12 ? 1 : 0); newActive.value = 0; }
  else if (slug.value === "flood-fill") newGrid.value = [0, 1, 2, 1, 0, 1, 2, 0, 2, 1, 0, 2, 1, 2, 0, 1];
  else if (slug.value === "bridge-builder") { newTarget.value = 35; newRoundTime.value = 0; }
  else if (slug.value === "weather-planner") { newWeather.value = Math.floor(Math.random() * 3); }
  lastFrame = performance.now(); animationFrame = window.requestAnimationFrame(newFrame);
}
function spawnShadow(): void { newTarget.value = Math.floor(Math.random() * 16); newEntities.value = [newEntity(8 + (newTarget.value % 4) * 28, 12 + Math.floor(newTarget.value / 4) * 20, newTarget.value, "shadow", "#bd8ce0")]; newShowing.value = true; newRoundTime.value = 1.1; schedulePulse(600, () => { newShowing.value = false; }); }
function beginNewSimon(): void { newSequence.value = [...newSequence.value, Math.floor(Math.random() * 16)]; newSequenceNext.value = 0; newShowIndex.value = 0; newGrid.value = Array.from({ length: 16 }, (_, index) => index); newShowing.value = true; const showNext = (): void => { if (newShowIndex.value >= newSequence.value.length) { newShowing.value = false; newShowIndex.value = -1; return; } schedulePulse(Math.max(260, 520 - level.value * 20), () => { newShowIndex.value += 1; showNext(); }); }; showNext(); }
function chooseTowerRound(): void { newTowerTarget.value = 2 + Math.floor(Math.random() * 7); newTowerOptions.value = shuffle([newTowerTarget.value - 1, newTowerTarget.value, newTowerTarget.value + 1]); }
function pipePorts(shape: string): number[] {
  if (shape === "straight") return [1, 3];
  if (shape === "cross") return [0, 1, 2, 3];
  if (shape === "end") return [1];
  return [0, 1];
}
function rotatePipe(id: number): void {
  if (status.value !== "playing") return;
  const cell = newPipe.value.find((item) => item.id === id);
  if (!cell) return;
  cell.rotation = (cell.rotation + 1) % 4;
  const connected = pipeConnected(newPipe.value.map((item) => ({ rotation: item.rotation, ports: pipePorts(item.shape) })), 3, 0, 8);
  if (connected) {
    newPipeSolved.value = true;
    score.value += 50;
    finishGame("管道已连通");
  } else {
    message.value = "水路尚未接通，继续旋转管道";
  }
}
function isLiveEntity(entity: NewEntity): boolean {
  return newEntities.value.some((item) => item.id === entity.id);
}
function newClick(entity: NewEntity): void {
  if (status.value === "idle" || status.value === "gameover") startGame();
  if (status.value !== "playing") return;
  const entityModes = ["quick-tap", "bubble-pop", "harbor-defense", "drone-swarm", "tap-rush", "whack-mole", "target-range", "dont-touch-red"];
  if (entityModes.includes(slug.value) && !isLiveEntity(entity)) return;
  if (slug.value === "quick-tap") { score.value += 5 + combo.value++; if (combo.value >= 20) { finishGame("快速点击挑战完成"); return; } newEntities.value = [newEntity(10 + Math.random() * 80, 12 + Math.random() * 70, undefined, "quick", "#ffd166")]; newRoundTime.value = Math.max(.45, 1.5 - score.value / 180); return; }
  if (slug.value === "bubble-pop") { if (entity.color !== ["#5dd6e8", "#ff78a8", "#ffd166"][newTarget.value]) { lives.value -= 1; } else { score.value += 6; newTarget.value = (newTarget.value + 1) % 3; newEntities.value = newEntities.value.filter((item) => item.id !== entity.id); if (score.value >= 90) { finishGame("泡泡颜色挑战完成"); return; } } if (lives.value <= 0) finishGame("泡泡颜色混乱"); return; }
  if (slug.value === "number-chain") { if (entity.value !== newTarget.value) { lives.value -= 1; if (lives.value <= 0) finishGame("数字顺序出错"); return; } score.value += 4; newTarget.value += 1; if (newTarget.value > 16) { level.value += 1; score.value += 20; finishGame("数字链完成"); } return; }
  if (slug.value === "simon-grid") { if (newShowing.value || entity.value !== newSequence.value[newSequenceNext.value]) { finishGame("记忆顺序错误"); return; } newSequenceNext.value += 1; score.value += 3; if (newSequenceNext.value === newSequence.value.length) { level.value += 1; newSequence.value = []; pulseTimer = window.setTimeout(beginNewSimon, 350); } return; }
  if (["harbor-defense", "drone-swarm"].includes(slug.value)) { score.value += 8; newEntities.value = newEntities.value.filter((item) => item.id !== entity.id); return; }
  if (slug.value === "shadow-hunt") { if (newShowing.value || entity.value !== newTarget.value) finishGame("暗影判断失误"); else { score.value += 15; spawnShadow(); } return; }
  if (["tap-rush", "whack-mole", "target-range"].includes(slug.value)) {
    if (slug.value === "target-range") { const distance = Math.hypot(entity.x - 50, entity.y - 50); score.value += Math.max(4, 20 - Math.floor(distance / 4)); }
    else score.value += 6 + combo.value;
    combo.value += 1; newEntities.value = [newEntity(10 + Math.random() * 80, 18 + Math.random() * 65, undefined, slug.value === "whack-mole" ? "mole" : "tap", slug.value === "target-range" ? "#ef7893" : "#ffd166")]; newRoundTime.value = Math.max(.45, 1.5 - combo.value * .04); if (combo.value >= 12) finishGame("反应街机挑战完成"); return;
  }
  if (slug.value === "dont-touch-red") { if (entity.value === 1) finishGame("碰到了红色陷阱"); else { score.value += 5; newEntities.value = newEntities.value.map((item) => ({ ...item, value: Math.random() < .2 ? 1 : 0, color: Math.random() < .2 ? "#e56b6f" : "#63d7bc" })); } return; }
  if (slug.value === "quick-draw") { if (newQuickState.value !== 2) { finishGame("拔枪太早了"); return; } score.value += 30; finishGame("快速拔枪胜出"); return; }
  if (slug.value === "button-memory") { if (newShowing.value || entity.id !== newSequence.value[newSequenceNext.value]) { finishGame("按钮顺序记错了"); return; } newSequenceNext.value += 1; score.value += 8; if (newSequenceNext.value >= newSequence.value.length) finishGame("按钮记忆完成"); return; }
  if (slug.value === "memory-pairs") { if (newMemoryFirst.value === null) { newMemoryFirst.value = entity.id; newSelected.value = [entity.id]; return; } if (newGrid.value[newMemoryFirst.value] === newGrid.value[entity.id] && newMemoryFirst.value !== entity.id) { newGrid.value[newMemoryFirst.value] = 9; newGrid.value[entity.id] = 9; score.value += 12; newMemoryFirst.value = null; if (newGrid.value.every((item) => item === 9)) finishGame("所有卡牌已配对"); } else { lives.value -= 1; newMemoryFirst.value = null; newSelected.value = []; if (lives.value <= 0) finishGame("配对机会用完了"); } return; }
  if (slug.value === "math-blitz") { if (entity.value !== newTarget.value) { lives.value -= 1; } else { score.value += 10; newTarget.value = 3 + Math.floor(Math.random() * 12); newMathQuestion.value = `${newTarget.value - 2} + 2 = ?`; newMathOptions.value = shuffle([newTarget.value - 1, newTarget.value, newTarget.value + 1]); newRoundTime.value = 3; } if (lives.value <= 0) finishGame("心算挑战失败"); return; }
}
function moveNew(direction: -1 | 1): void { if (status.value === "idle" || status.value === "gameover") startGame(); if (status.value !== "playing") return; if (slug.value === "meteor-guard") newShieldX.value = Math.max(8, Math.min(92, newShieldX.value + direction * 8)); else newPlayer.value.x = Math.max(8, Math.min(92, newPlayer.value.x + direction * 8)); }
function addMovementEntity(): void { newEntities.value.push(newEntity(8 + Math.random() * 84, -8, Math.random() < .2 ? 1 : 0, "movement", "#f0c75e")); }
function moveMovement(direction: -1 | 1): void { if (status.value === "idle" || status.value === "gameover") startGame(); if (status.value !== "playing") return; if (slug.value === "coin-catcher") newPlayer.value.x = Math.max(8, Math.min(92, newPlayer.value.x + direction * 8)); else if (slug.value === "snowboard-dash" || slug.value === "skate-line") newPlayer.value.x = Math.max(10, Math.min(90, newPlayer.value.x + direction * 16)); else newPlayer.value.y = Math.max(12, Math.min(86, newPlayer.value.y + direction * 8)); }
function rotateLaser(index: number): void { if (status.value !== "playing") return; newLaserRotations.value[index] = (newLaserRotations.value[index] + 1) % 4; if (newLaserRotations.value.every((rotation) => rotation === 0)) { score.value += 50; finishGame("激光命中目标"); } }
function moveDive(direction: -1 | 1): void { if (status.value === "idle" || status.value === "gameover") startGame(); if (status.value === "playing") newDiveY.value = Math.max(15, Math.min(85, newDiveY.value + direction * 8)); }
function toggleRing(): void { if (status.value === "idle" || status.value === "gameover") startGame(); if (status.value === "playing") newLane.value = newLane.value ? 0 : 1; }
function stackPlatform(): void { if (status.value === "idle" || status.value === "gameover") startGame(); if (status.value !== "playing") return; const top = newEntities.value[newEntities.value.length - 1]; if (!top) return; const width = top.value ?? 20; const overlap = Math.max(0, width - Math.abs(top.x - 50)); if (overlap < 5) { finishGame("高塔偏移倒塌"); return; } score.value += Math.floor(overlap); newEntities.value.push(newEntity(50, Math.max(12, 88 - newEntities.value.length * 10), Math.max(12, overlap - 1), "platform", "#f59e0b")); }
function selectSum(entity: NewEntity): void { if (status.value !== "playing") return; if (newSelected.value.includes(entity.id)) return; newSelected.value.push(entity.id); newTarget.value -= entity.value ?? 0; if (newTarget.value === 0) { score.value += 20; finishGame("刚好凑出目标和"); } else if (newTarget.value < 0) { lives.value -= 1; newSelected.value = []; newTarget.value = 18 + Math.floor(Math.random() * 14); if (lives.value <= 0) finishGame("总和超过目标"); } }
function slideTile(index: number): void { if (status.value !== "playing") return; const empty = newGrid.value.indexOf(0); if (Math.abs(empty - index) !== 1 && Math.abs(empty - index) !== 3) return; [newGrid.value[empty], newGrid.value[index]] = [newGrid.value[index], newGrid.value[empty]]; score.value += 1; if (newGrid.value.join(",") === "1,2,3,4,5,6,7,8,0") finishGame("滑块拼图完成"); }
function farmAction(plot: FarmPlot): void { if (status.value !== "playing") return; if (plot.stage === 0) plot.stage = 1; else if (plot.stage === 1) { plot.stage = 2; } else if (plot.stage === 2) { plot.stage = 3; score.value += 10; } else return; if (newFarm.value.every((item) => item.stage === 3)) finishGame("农场收获完成"); }
function towerPick(weight: number): void { if (status.value !== "playing") return; if (weight !== newTowerTarget.value) { finishGame("重量选择失误，高塔倒塌"); return; } newTowerHeight.value += 1; level.value = newTowerHeight.value; score.value += 10 + newTowerHeight.value; if (newTowerHeight.value >= 8) finishGame("平衡高塔建成"); else chooseTowerRound(); }
function toggleSignal(): void { if (status.value !== "playing") return; newSignal.value = newSignal.value ? 0 : 1; score.value += 1; }
function islandPlace(index: number): void { if (status.value !== "playing" || newIsland.value[index]) return; const neighbors = [index - 1, index + 1, index - 5, index + 5].filter((item) => item >= 0 && item < 25); if (!neighbors.some((item) => newIsland.value[item])) return; newIsland.value[index] = 1; score.value += 5; newIslandCapacity.value -= 1; if (newIslandCapacity.value <= 0) finishGame("岛屿容量耗尽"); }
function newFrame(now: number): void {
  if (status.value !== "playing") return; const delta = Math.min((now - lastFrame) / 1000, .06); lastFrame = now; newRoundTime.value -= delta; elapsed.value += delta;
  if (["quick-tap", "tap-rush", "whack-mole", "target-range"].includes(slug.value) && newRoundTime.value <= 0) { finishGame("目标消失了"); return; }
  if (["color-match", "math-blitz"].includes(slug.value) && newRoundTime.value <= 0) { lives.value -= 1; newRoundTime.value = 2; if (lives.value <= 0) { finishGame("反应时间耗尽"); return; } }
  if (slug.value === "quick-draw" && newQuickState.value === 1 && elapsed.value >= newRoundTime.value) { newQuickState.value = 2; newRoundTime.value = 99; message.value = "现在开火！"; }
  if (slug.value === "stack-tower") { const top = newEntities.value[newEntities.value.length - 1]; if (top) top.x = 50 + Math.sin(elapsed.value * 3) * 36; }
  if (["coin-catcher", "snowboard-dash", "skate-line", "paper-plane"].includes(slug.value)) {
    if (Math.random() < delta * 1.5) addMovementEntity();
    newEntities.value.forEach((item) => { item.y += (slug.value === "paper-plane" ? 19 : 26) * delta; });
    const player = newPlayer.value;
    const hit = newEntities.value.find((item) => Math.abs(item.x - player.x) < 12 && Math.abs(item.y - player.y) < 14);
    if (hit) {
      if (slug.value === "coin-catcher" && hit.value === 0) { score.value += 10; newEntities.value = newEntities.value.filter((item) => item.id !== hit.id); }
      else if (slug.value === "coin-catcher") { lives.value -= 1; newEntities.value = newEntities.value.filter((item) => item.id !== hit.id); }
      else if (hit.value === 1) { lives.value -= 1; newEntities.value = newEntities.value.filter((item) => item.id !== hit.id); }
    }
    const missed = newEntities.value.filter((item) => item.y > 105).length;
    if (missed) { lives.value -= missed; newEntities.value = newEntities.value.filter((item) => item.y <= 105); }
    if (lives.value <= 0) { finishGame("移动碰撞失败"); return; }
    score.value += Math.floor(delta * 3);
    if (elapsed.value >= 25) { finishGame("成功完成移动挑战"); return; }
  }
  if (slug.value === "campfire-keeper") { newFire.value -= delta * 2.4; if (newFire.value <= 0) { finishGame("营火熄灭了"); return; } if (elapsed.value >= 18) { score.value += 40; finishGame("平安守到天亮"); return; } }
  if (slug.value === "market-merchant" && newRoundTime.value <= 0) { newTarget.value = Math.max(2, Math.min(12, newTarget.value + (Math.random() > .5 ? 2 : -2))); newRoundTime.value = 2; }
  if (slug.value === "word-scramble" && newRoundTime.value <= 0) { lives.value -= 1; newRoundTime.value = 8; if (lives.value <= 0) finishGame("单词挑战失败"); else { nextWord(); newRoundTime.value = 8; } }
  if (["rocket-dodge", "meteor-guard", "deep-dive"].includes(slug.value)) {
    if (Math.random() < delta * 1.4) newEntities.value.push(newEntity(8 + Math.random() * 84, -8, undefined, slug.value === "deep-dive" ? "reef" : "falling", slug.value === "deep-dive" ? "#e56f6e" : "#ff8c69"));
    newEntities.value.forEach((item) => { item.y += (slug.value === "deep-dive" ? 16 : 23) * delta; });
    const collision = newEntities.value.find((item) => item.y > 70 && (slug.value === "deep-dive" ? Math.abs(item.x - 20) < 12 && Math.abs(item.y - newDiveY.value) < 14 : Math.abs(item.x - (slug.value === "meteor-guard" ? newShieldX.value : newPlayer.value.x)) < 10));
    if (slug.value === "meteor-guard") {
      if (collision) { score.value += 12; newEntities.value = newEntities.value.filter((item) => item.id !== collision.id); }
      const missed = newEntities.value.filter((item) => item.y > 104).length;
      if (missed) { lives.value -= missed; newEntities.value = newEntities.value.filter((item) => item.y <= 104); }
      if (lives.value <= 0) { finishGame("陨石突破防线"); return; }
    } else {
      if (collision) { finishGame(slug.value === "deep-dive" ? "潜艇撞上暗礁" : "撞上了下落物"); return; }
      newEntities.value = newEntities.value.filter((item) => item.y < 108);
    }
    score.value += Math.floor(delta * (slug.value === "deep-dive" ? 3 : 2));
    if (elapsed.value >= 25) { finishGame(slug.value === "deep-dive" ? "成功完成深海潜航" : "成功守住防线"); return; }
  }
  if (slug.value === "ring-runner") { newEntities.value.forEach((item) => { item.y += 25 * delta; }); const hit = newEntities.value.find((item) => item.y > 38 && item.y < 64 && item.value === newLane.value); if (hit) { finishGame("撞上轨道障碍"); return; } if (newEntities.value.every((item) => item.y > 100)) { newEntities.value = [newEntity(50, -8, Math.random() < .5 ? 0 : 1, "ring-obstacle", "#b692ff")]; score.value += 8; } }
  if (slug.value === "bubble-pop") { if (newRoundTime.value <= 0) { lives.value -= 1; newRoundTime.value = 2; if (lives.value <= 0) { finishGame("泡泡全部消失"); return; } } if (newEntities.value.length < 5) newEntities.value.push(newEntity(8 + Math.random() * 84, 10 + Math.random() * 78, undefined, "bubble", ["#5dd6e8", "#ff78a8", "#ffd166"][Math.floor(Math.random() * 3)])); }
  if (["harbor-defense", "drone-swarm"].includes(slug.value)) { if (Math.random() < delta * 1.1) newEntities.value.push(newEntity(8 + Math.random() * 84, -8, undefined, "threat", slug.value === "drone-swarm" ? "#8dd47e" : "#5eb4d8")); newEntities.value.forEach((item) => { item.y += 16 * delta; }); const missed = newEntities.value.filter((item) => item.y > 94); if (missed.length) { lives.value -= missed.length; newEntities.value = newEntities.value.filter((item) => item.y <= 94); } if (lives.value <= 0) { finishGame("港口防线失守"); return; } }
  if (slug.value === "shadow-hunt" && newRoundTime.value <= 0 && newShowing.value) { newShowing.value = false; }
  if (slug.value === "sum-cross" && newRoundTime.value <= 0) { lives.value -= 1; newRoundTime.value = 15; if (lives.value <= 0) { finishGame("没有凑出目标和"); return; } }
  if (slug.value === "number-chain" && newRoundTime.value <= 0) { finishGame("数字链超时"); return; }
  if (slug.value === "slide-puzzle" && newRoundTime.value <= 0) { finishGame("滑块拼图超时"); return; }
  if (slug.value === "pipe-connect" && newRoundTime.value <= 0) { finishGame("管道连接超时"); return; }
  if (slug.value === "laser-grid" && newRoundTime.value <= 0) { finishGame("激光没有命中目标"); return; }
  if (slug.value === "traffic-flow") { newEntities.value.forEach((item) => { item.x += (item.value === 0 ? 18 : -18) * delta; }); if (newEntities.value.some((item) => item.x > 48 && item.x < 52 && item.value === newSignal.value)) finishGame("车辆发生冲突"); if (newEntities.value.every((item) => item.x < -5 || item.x > 105)) { score.value += 10; newEntities.value = [newEntity(0, 35, 0, "car", "#6fb6d9"), newEntity(100, 65, 1, "car", "#e5b76b")]; } }
  if (slug.value === "island-builder" && elapsed.value > 2) score.value += Math.floor(delta);
  timerLabel.value = `${Math.max(0, newRoundTime.value).toFixed(1)}s`; animationFrame = window.requestAnimationFrame(newFrame);
}

function startGame(): void {
  if (!isSupported.value) return;
  resetCommon();
  if (funSpec.value) startFunGame();
  else if (slug.value === "orbit-architect") startOrbit();
  else if (slug.value === "wordsmith") startWord();
  else if (slug.value === "pixel-punch") startPixel();
  else if (slug.value === "tiny-trails") startTrail();
  else if (slug.value === "last-light") startLastLight();
  else if (slug.value === "color-switch") startColor();
  else if (slug.value === "merge-2048") startMerge();
  else if (slug.value === "sky-hopper") startSky();
  else if (slug.value === "neon-memory") startNeon();
  else if (slug.value === "cannon-stack") startCannon();
  else if (slug.value === "fruit-slice") startFruit();
  else if (slug.value === "maze-escape") startMaze();
  else if (kidsSpec.value) startKidsGame();
  else startNewMode();
}
function resumeGameLoop(): void {
  if (slug.value === "orbit-architect") { lastFrame = performance.now(); animationFrame = window.requestAnimationFrame(orbitFrame); }
  else if (slug.value === "wordsmith") timer = window.setInterval(wordTick, 1000);
  else if (slug.value === "pixel-punch") timer = window.setInterval(pixelTick, 100);
  else if (slug.value === "last-light") timer = window.setInterval(lastLightTick, 100);
  else if (slug.value === "color-switch") timer = window.setInterval(colorTick, 100);
  else if (slug.value === "sky-hopper") { lastFrame = performance.now(); animationFrame = window.requestAnimationFrame(skyFrame); }
  else if (slug.value === "cannon-stack") { lastFrame = performance.now(); animationFrame = window.requestAnimationFrame(cannonFrame); }
  else if (slug.value === "fruit-slice") { lastFrame = performance.now(); animationFrame = window.requestAnimationFrame(fruitFrame); }
  else if (slug.value === "maze-escape") timer = window.setInterval(mazeTick, 1000);
  else if (!funSpec.value && !kidsSpec.value && supportedSlugs.slice(13).includes(slug.value as GameSlug)) { lastFrame = performance.now(); animationFrame = window.requestAnimationFrame(newFrame); }
  resumePulse();
}
function togglePause(): void {
  if (status.value === "playing") {
    pauseLoops();
    status.value = "paused";
  } else if (status.value === "paused") {
    status.value = "playing";
    resumeGameLoop();
  }
}
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === "p" || event.key === "P") { event.preventDefault(); togglePause(); return; }
  if (["Enter", " "].includes(event.key) && (status.value === "idle" || status.value === "gameover")) { event.preventDefault(); startGame(); return; }
  if (status.value !== "playing") return;
  if (funSpec.value && funGame.value?.spec.mode !== "order" && /^[1-9]$/.test(event.key)) { event.preventDefault(); answerFun(Number(event.key) - 1); return; }
  if (slug.value === "orbit-architect" && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); if (event.key === "ArrowLeft") adjustOrbit(-1); else adjustOrbit(1); }
  else if (slug.value === "wordsmith" && /^[a-zA-Z]$/.test(event.key)) { const token = wordTokens.value.find((item) => !item.used && item.letter === event.key.toLowerCase()); if (token) pickWordLetter(token); }
  else if (slug.value === "pixel-punch" && event.key === " ") { event.preventDefault(); hitPixel(); }
  else if (slug.value === "tiny-trails") {
    const moves: Record<string, [number, number]> = { ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0] };
    const move = moves[event.key]; if (move) { event.preventDefault(); moveTrail(move[0], move[1]); }
  } else if (slug.value === "last-light" && /^[1-3]$/.test(event.key)) attackEnemy(enemies.value[Number(event.key) - 1]?.id);
  else if (slug.value === "color-switch" && /^[1-4]$/.test(event.key)) { event.preventDefault(); chooseColor(Number(event.key) - 1); }
  else if (slug.value === "merge-2048") {
    const directions: Record<string, "up" | "down" | "left" | "right"> = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
    const direction = directions[event.key]; if (direction) { event.preventDefault(); moveMerge(direction); }
  } else if (slug.value === "cannon-stack") {
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") { event.preventDefault(); moveCannon(-1); }
    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") { event.preventDefault(); moveCannon(1); }
    if (event.key === " ") { event.preventDefault(); fireCannon(); }
  } else if (slug.value === "maze-escape") {
    const moves: Record<string, [number, number]> = { ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0] };
    const move = moves[event.key]; if (move) { event.preventDefault(); moveMaze(move[0], move[1]); }
  } else if (slug.value === "sky-hopper") {
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") { event.preventDefault(); skyLeft.value = true; }
    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") { event.preventDefault(); skyRight.value = true; }
  } else if (["rocket-dodge", "meteor-guard"].includes(slug.value)) {
    if (["ArrowLeft", "a", "A"].includes(event.key)) { event.preventDefault(); moveNew(-1); }
    if (["ArrowRight", "d", "D"].includes(event.key)) { event.preventDefault(); moveNew(1); }
  } else if (slug.value === "deep-dive") {
    if (["ArrowUp", "w", "W"].includes(event.key)) { event.preventDefault(); moveDive(-1); }
    if (["ArrowDown", "s", "S"].includes(event.key)) { event.preventDefault(); moveDive(1); }
  } else if (["quick-tap", "stack-tower", "ring-runner"].includes(slug.value) && event.key === " ") {
    event.preventDefault(); if (slug.value === "quick-tap") { const target = newEntities.value[0]; if (target) newClick(target); } else if (slug.value === "stack-tower") stackPlatform(); else toggleRing();
  } else if (["tap-rush", "whack-mole", "target-range", "dont-touch-red", "quick-draw", "button-memory"].includes(slug.value) && event.key === " ") {
    event.preventDefault(); const target = newEntities.value[0]; newClick(target ?? { id: 0, x: 0, y: 0 });
  } else if (["color-match", "math-blitz"].includes(slug.value) && /^[1-4]$/.test(event.key)) {
    event.preventDefault(); const index = Number(event.key) - 1; if (slug.value === "color-match") chooseNewColor(index); else newClick({ id: index, value: newMathOptions.value[index] ?? 0, x: 0, y: 0 });
  } else if (["coin-catcher", "snowboard-dash", "skate-line"].includes(slug.value)) {
    if (["ArrowLeft", "a", "A"].includes(event.key)) { event.preventDefault(); moveMovement(-1); }
    if (["ArrowRight", "d", "D"].includes(event.key)) { event.preventDefault(); moveMovement(1); }
  } else if (["paper-plane"].includes(slug.value)) {
    if (["ArrowUp", "w", "W"].includes(event.key)) { event.preventDefault(); moveMovement(-1); }
    if (["ArrowDown", "s", "S"].includes(event.key)) { event.preventDefault(); moveMovement(1); }
  } else if (slug.value === "colony-grid" && event.key === " ") {
    event.preventDefault(); toggleBuilding();
  }
}
function handleKeyup(event: KeyboardEvent): void {
  if (slug.value !== "sky-hopper") return;
  if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") skyLeft.value = false;
  if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") skyRight.value = false;
}
function trailClass(x: number, y: number): string[] {
  const point = pointKey({ x, y });
  return [trailRows.value[y]?.[x] === "#" ? "wall" : "open", trailVisited.value.includes(point) ? "visited" : "", trailPlayer.value.x === x && trailPlayer.value.y === y ? "player" : "", trailGoal.value.x === x && trailGoal.value.y === y ? "goal" : ""];
}
function resetRouteGame(): void { resetCommon(); readHighScore(); if (isSupported.value) rememberRecent(slug.value); }

watch(slug, () => resetRouteGame());
onMounted(() => { readHighScore(); if (isSupported.value) rememberRecent(slug.value); window.addEventListener("keydown", handleKeydown, { passive: false }); window.addEventListener("keyup", handleKeyup); });
onBeforeUnmount(() => { clearLoops(); window.removeEventListener("keydown", handleKeydown); window.removeEventListener("keyup", handleKeyup); });
</script>

<template>
  <main class="mini-game-page" :data-game="slug">
    <header class="mini-header">
      <RouterLink class="mini-back" to="/zh">← 返回大厅</RouterLink>
      <div class="mini-heading"><span>{{ config.icon }} · MINI ARCADE</span><h1>{{ config.title }}</h1></div>
      <span class="mini-state" :class="`is-${status}`" aria-label="游戏状态"></span>
    </header>

    <section v-if="isSupported" class="mini-scoreboard" aria-label="游戏数据">
      <div><small>当前分数</small><strong>{{ score }}</strong></div>
      <div><small>最高分</small><strong>{{ highScore }}</strong></div>
      <div><small>{{ slug === "wordsmith" ? "生命" : slug === "tiny-trails" ? "关卡" : "状态" }}</small><strong>{{ slug === "wordsmith" ? lives : slug === "tiny-trails" ? level : modeLabel }}</strong></div>
    </section>

    <section v-if="isSupported" class="mini-card">
      <div v-if="funSpec" class="mini-arena fun-arena">
        <template v-if="funGame">
          <div class="fun-progress"><span>第 {{ funGame.questionIndex + 1 }} / {{ funGame.spec.questions.length }} 题</span><span>生命 {{ lives }} · 连击 {{ combo }}</span></div>
          <div class="fun-prompt"><span v-if="funGame.question.display" class="fun-display">{{ funGame.question.display }}</span><strong>{{ funGame.question.prompt }}</strong></div>
          <div v-if="slug === 'who-am-i'" class="fun-clues"><p v-for="(clue, index) in funGame.question.clues" :key="clue" v-show="index <= funGame.clueIndex">线索 {{ index + 1 }}：{{ clue }}</p><button type="button" :disabled="funGame.clueIndex >= (funGame.question.clues?.length ?? 1) - 1 || funGame.answered" @click="revealFunClue">揭示下一条线索</button></div>
          <div v-if="slug === 'lantern-riddles'" class="fun-tools"><button type="button" :disabled="funGame.hintUsed || funGame.answered" @click="useFunHint">提示（-2 分）</button><span v-if="funHintVisible">提示：{{ funGame.question.hint }}</span></div>
          <div v-if="funGame.spec.mode !== 'order'" class="fun-options"><button v-for="(option, index) in funGame.question.options" :key="`${option}-${index}`" type="button" :disabled="funGame.answered" @click="answerFun(index)">{{ option }}</button></div>
          <div v-else class="fun-order"><p>点击相邻卡片交换位置：</p><div class="fun-order-list"><button v-for="(item, index) in funGame.orderItems" :key="`${item}-${index}`" type="button" :disabled="funGame.answered" @click="moveStoryCard(index)">{{ index + 1 }} · {{ item }}</button></div><button class="fun-submit" type="button" :disabled="funGame.answered" @click="submitStoryOrder">提交顺序</button></div>
          <p class="fun-feedback" aria-live="polite">{{ funFeedback || `生命 ${lives} · 连续答对会增加连击` }}</p>
        </template>
        <div v-else class="fun-waiting">准备好开始趣味挑战吧！</div>
        <div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : status === 'paused' ? '游戏暂停' : config.title }}</b><p>{{ status === 'gameover' ? `本局 ${score} 分，最高 ${highScore} 分` : config.description }}</p><button class="mini-primary" type="button" @click="startGame">{{ status === 'gameover' ? '重新开始' : '开始游戏' }}</button></div>
      </div>
      <div v-else-if="slug === 'orbit-architect'" class="mini-arena orbit-arena" @pointerdown="selectOrbit">
        <div class="orbit-sun">✦</div>
        <div v-for="(planet, index) in orbitPlanets" :key="planet.name" class="orbit-ring" :class="{ selected: orbitSelected === index, unstable: planet.error > .48 }" :style="{ width: `${planet.radius * 2}%`, height: `${planet.radius * 2}%` }"><i class="orbit-planet" :style="{ background: planet.color, '--planet-angle': `${(index * 120 + elapsed * planet.drift * 8) % 360}deg`, '--planet-distance': `${planet.radius * 2}px` }">{{ planet.name }}</i></div>
        <div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '轨道失衡' : status === 'paused' ? '系统暂停' : '建立平衡' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">{{ status === 'gameover' ? '重新开始' : '开始游戏' }}</button></div>
      </div>
      <div v-else-if="slug === 'wordsmith'" class="mini-arena word-arena">
        <div class="word-timer">倒计时 {{ wordRemaining }}s · {{ wordRound + 1 }} / ∞</div><p class="word-hint">把字母排列成一个完整单词</p><div class="word-answer" aria-live="polite">{{ wordTyped || "_ _ _ _ _ _" }}</div>
        <div class="word-tiles"><button v-for="token in wordTokens" :key="token.id" class="word-tile" :class="{ used: token.used }" type="button" :disabled="token.used || status !== 'playing'" @click="pickWordLetter(token)">{{ token.letter }}</button></div>
        <div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '本局结束' : status === 'paused' ? '字谜暂停' : '准备拼词' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">{{ status === 'gameover' ? '重新开始' : '开始游戏' }}</button></div>
      </div>
      <div v-else-if="slug === 'pixel-punch'" class="mini-arena pixel-arena">
        <div class="pixel-grid"></div><button v-if="pixelTarget && status === 'playing'" class="pixel-target" type="button" :style="{ left: `${pixelTarget.x}%`, top: `${pixelTarget.y}%`, width: `${pixelTarget.size}px`, height: `${pixelTarget.size}px` }" aria-label="击打目标" @pointerdown.stop="hitPixel">✦</button><span v-if="status === 'playing'" class="pixel-countdown">{{ timerLabel }}</span>
        <div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '目标逃脱' : status === 'paused' ? '擂台暂停' : '准备出拳' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">{{ status === 'gameover' ? '重新开始' : '开始游戏' }}</button></div>
      </div>
      <div v-else-if="slug === 'tiny-trails'" class="mini-arena trail-arena">
        <div class="trail-grid" :style="{ gridTemplateColumns: `repeat(${trailGridSize}, 1fr)` }"><template v-for="y in trailGridSize" :key="y"><span v-for="x in trailGridSize" :key="`${x}-${y}`" class="trail-cell" :class="trailClass(x - 1, y - 1)">{{ trailRows[y - 1]?.[x - 1] === 'G' ? '◆' : trailRows[y - 1]?.[x - 1] === 'S' ? '●' : '' }}</span></template></div>
        <div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '路径结束' : status === 'paused' ? '小径暂停' : '寻找出口' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">{{ status === 'gameover' ? '重新开始' : '开始游戏' }}</button></div>
      </div>
      <div v-else-if="slug === 'color-switch'" class="mini-arena color-arena">
        <div class="color-target" :style="{ background: colorTarget.value }"><span>{{ timerLabel }}</span></div>
        <div class="color-choices"><button v-for="(choice, index) in colorChoices" :key="choice.value" type="button" :style="{ '--choice-color': choice.value }" :aria-label="`选择${choice.name}`" @click="chooseColor(index)">{{ index + 1 }}</button></div>
        <div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '颜色失配' : status === 'paused' ? '色彩暂停' : '找到相同颜色' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">{{ status === 'gameover' ? '重新开始' : '开始游戏' }}</button></div>
      </div>
      <div v-else-if="slug === 'merge-2048'" class="mini-arena merge-arena" @touchstart.passive="handleMergeTouchStart" @touchend="handleMergeTouchEnd">
        <div class="merge-grid"><button v-for="(tile, index) in mergeGrid" :key="index" type="button" class="merge-tile" :class="`tile-${tile}`" @click="moveMerge(index % 4 < 2 ? 'left' : 'right')">{{ tile || '' }}</button></div>
        <div v-if="mergeWon" class="merge-notice">2048 达成！</div>
        <div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '方格结束' : status === 'paused' ? '数字暂停' : '合成 2048' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">{{ status === 'gameover' ? '重新开始' : '开始游戏' }}</button></div>
      </div>
      <div v-else-if="slug === 'sky-hopper'" class="mini-arena sky-arena">
        <div v-for="(platform, index) in skyPlatforms" :key="index" class="sky-platform" :style="{ left: `${platform.x}%`, top: `${platform.y}%`, width: `${platform.width}%` }"></div><div class="sky-player" :style="{ left: `${skyPlayer.x}%`, top: `${skyPlayer.y}%` }">🪽</div>
        <div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '掉出云端' : status === 'paused' ? '天空暂停' : '开始跳跃' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">{{ status === 'gameover' ? '重新开始' : '开始游戏' }}</button></div>
      </div>
      <div v-else-if="slug === 'garden-match'" class="mini-arena garden-arena">
        <div class="garden-grid"><button v-for="card in gardenCards" :key="card.id" type="button" class="garden-card" :class="{ flipped: card.flipped || card.matched, matched: card.matched }" @click="flipGarden(card)">{{ card.flipped || card.matched ? card.value : '✦' }}</button></div>
        <div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? (gardenPairs === 8 ? '花园盛开' : '记忆耗尽') : status === 'paused' ? '花园暂停' : '翻开花朵' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">{{ status === 'gameover' ? '重新开始' : '开始游戏' }}</button></div>
      </div>
      <div v-else-if="slug === 'neon-memory'" class="mini-arena neon-memory-arena">
        <div class="neon-memory-grid" :style="{ gridTemplateColumns: `repeat(${neonGridSize}, 1fr)` }"><button v-for="tile in neonTiles" :key="tile.id" type="button" class="neon-memory-tile" :class="{ lit: tile.lit, clicked: tile.clicked }" :disabled="status !== 'playing' || neonShowing" @click="clickNeon(tile)">{{ tile.lit ? '✦' : '' }}</button></div>
        <div v-if="status !== 'playing' || neonShowing" class="mini-overlay"><b>{{ status === 'gameover' ? '记忆断线' : status === 'paused' ? '灯牌暂停' : neonShowing ? '观察顺序' : '点亮记忆' }}</b><p>{{ status === 'gameover' ? message : neonShowing ? '记住闪烁的灯牌顺序' : config.description }}</p><button v-if="!neonShowing" class="mini-primary" type="button" @click="startGame">{{ status === 'gameover' ? '重新开始' : '开始游戏' }}</button></div>
      </div>
      <div v-else-if="slug === 'cannon-stack'" class="mini-arena cannon-arena">
        <div v-for="target in cannonTargets" :key="target.id" class="cannon-target" :style="{ left: `${target.x}%`, top: `${target.y}%`, width: `${target.size * 2}px`, height: `${target.size * 2}px` }">◆</div><div v-for="bullet in cannonBullets" :key="bullet.id" class="cannon-bullet" :style="{ left: `${bullet.x}%`, top: `${bullet.y}%` }"></div><div class="cannon-base" :style="{ left: `${cannonX}%` }">🚀</div>
        <div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '炮台失守' : status === 'paused' ? '炮台暂停' : '准备开火' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">{{ status === 'gameover' ? '重新开始' : '开始游戏' }}</button></div>
      </div>
      <div v-else-if="slug === 'fruit-slice'" class="mini-arena fruit-slice-arena" @pointerdown="fruitPointerDown = true; sliceFruitAt($event)" @pointermove="fruitPointerDown && sliceFruitAt($event)" @pointerup="fruitPointerDown = false" @pointercancel="fruitPointerDown = false">
        <button v-for="fruit in fruitEntities" :key="fruit.id" type="button" class="fruit-entity" :class="fruit.kind" :style="{ left: `${fruit.x}%`, top: `${fruit.y}%`, fontSize: `${fruit.size * 2.2}px` }" @pointerdown.stop="sliceFruitEntity(fruit)">{{ fruit.kind === 'bomb' ? '💣' : '🍉' }}</button><span v-if="status === 'playing'" class="fruit-timer">{{ fruitTimeLeft }}s</span>
        <div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '切水果结束' : status === 'paused' ? '切水果暂停' : '准备挥刀' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">{{ status === 'gameover' ? '重新开始' : '开始游戏' }}</button></div>
      </div>
      <div v-else-if="slug === 'maze-escape'" class="mini-arena maze-arena">
        <div class="maze-grid" :style="{ gridTemplateColumns: `repeat(${mazeSize}, 1fr)` }"><span v-for="(row, y) in mazeRows" :key="y"><i v-for="(tile, x) in row" :key="`${x}-${y}`" class="maze-cell" :class="{ wall: tile === '#', goal: x === mazeGoal.x && y === mazeGoal.y, player: x === mazePlayer.x && y === mazePlayer.y }">{{ tile === '#' ? '' : x === mazeGoal.x && y === mazeGoal.y ? '◆' : '' }}</i></span></div>
        <div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '迷宫挑战结束' : status === 'paused' ? '迷宫暂停' : '寻找出口' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">{{ status === 'gameover' ? '重新开始' : '开始游戏' }}</button></div>
      </div>
      <div v-else-if="['tap-rush','whack-mole','target-range'].includes(slug)" class="mini-arena new-arena reaction-arena"><div class="reaction-grid"></div><button v-for="entity in newEntities" :key="entity.id" class="new-target reaction-target" :class="entity.kind" type="button" :style="{ left: `${entity.x}%`, top: `${entity.y}%`, background: entity.color }" @click="newClick(entity)">{{ slug === 'whack-mole' ? '🐹' : slug === 'target-range' ? '🎯' : '⚡' }}</button><span class="arena-timer">连击 {{ combo }} · {{ timerLabel }}</span><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : config.title }}</b><p>{{ status === 'gameover' ? '本局结束' : config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'color-match'" class="mini-arena color-match-arena"><div class="match-orb" :style="{ background: colorChoices[newTargetColor]?.value }">{{ timerLabel }}</div><div class="match-options"><button v-for="(choice, index) in colorChoices" :key="choice.value" type="button" :style="{ background: choice.value }" @click="chooseNewColor(index)">{{ index + 1 }}</button></div><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'dont-touch-red'" class="mini-arena new-arena safe-arena"><div class="safe-grid"><button v-for="entity in newEntities" :key="entity.id" type="button" :class="{ danger: entity.value === 1 }" @click="newClick(entity)">{{ entity.value === 1 ? '×' : '✓' }}</button></div><span class="arena-timer">安全点击 · {{ score }}</span><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'quick-draw'" class="mini-arena new-arena draw-arena"><div class="draw-signal" :class="{ fire: newQuickState === 2 }">{{ newQuickState === 2 ? 'FIRE!' : 'READY' }}</div><button class="draw-button" type="button" @click="newClick({ id: 0, x: 0, y: 0 })">拔枪</button><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'button-memory'" class="mini-arena new-arena button-memory-arena"><div class="button-memory-grid"><button v-for="(_, index) in 9" :key="index" type="button" :class="{ lit: newShowing && newSequence[newSequenceNext] === index }" @click="newClick({ id: index, x: 0, y: 0 })">{{ newShowing && newSequence.includes(index) ? '✦' : '' }}</button></div><div class="arena-timer">顺序 {{ newSequenceNext + 1 }} / {{ newSequence.length }}</div><div v-if="status !== 'playing' || newShowing" class="mini-overlay"><b>{{ newShowing ? '观察按钮' : status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button v-if="!newShowing" class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="['golf-putt','basket-shot','bowling-mini','fishing-cast'].includes(slug)" class="mini-arena new-arena physics-arena"><div class="physics-scene"><span class="physics-ball">{{ slug === 'golf-putt' ? '⚪' : slug === 'basket-shot' ? '🏀' : slug === 'bowling-mini' ? '🎳' : '🎣' }}</span><span class="physics-goal">{{ slug === 'basket-shot' ? '🧺' : slug === 'fishing-cast' ? '🐟' : '◎' }}</span></div><label>力度 {{ newPower }}<input type="range" min="0" max="100" :value="newPower" @input="setRangePower"></label><label v-if="slug !== 'golf-putt'">角度 {{ newAngle }}<input type="range" min="0" max="100" :value="newAngle" @input="setRangeAngle"></label><button class="physics-launch" type="button" @click="launchPhysics">{{ slug === 'fishing-cast' ? '抛竿' : '出手' }}</button><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="['coin-catcher','snowboard-dash','skate-line','paper-plane'].includes(slug)" class="mini-arena new-arena movement-arena"><div class="movement-lanes"></div><div class="new-player" :style="{ left: `${newPlayer.x}%`, top: `${newPlayer.y}%` }">{{ slug === 'coin-catcher' ? '🧺' : slug === 'snowboard-dash' ? '🏂' : slug === 'skate-line' ? '🛹' : '✈️' }}</div><span v-for="entity in newEntities" :key="entity.id" class="movement-entity" :style="{ left: `${entity.x}%`, top: `${entity.y}%` }">{{ slug === 'coin-catcher' ? '🪙' : '◆' }}</span><span class="arena-timer">{{ slug === 'coin-catcher' ? '接住金币' : '存活 ' + Math.floor(elapsed) + 's' }}</span><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'odd-one-out'" class="mini-arena new-arena odd-arena"><div class="odd-grid"><button v-for="(_, index) in 16" :key="index" type="button" :class="{ odd: newGrid[index] === 1 }" @click="newGridClick(index)">{{ newGrid[index] === 1 ? '◆' : '◇' }}</button></div><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'memory-pairs'" class="mini-arena new-arena pairs-arena"><div class="pairs-grid"><button v-for="(card, index) in newGrid" :key="index" type="button" :class="{ revealed: card === 9 || newMemoryFirst === index }" @click="newClick({ id: index, value: card, x: 0, y: 0 })">{{ card === 9 || newMemoryFirst === index ? ['🌙','⭐','☀️','☁️'][card] : '？' }}</button></div><span class="arena-timer">机会 {{ lives }}</span><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'lights-out'" class="mini-arena new-arena lights-arena"><div class="lights-grid"><button v-for="(light, index) in newGrid" :key="index" type="button" :class="{ on: light }" @click="newGridClick(index)">{{ light ? '✦' : '' }}</button></div><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'color-sort'" class="mini-arena new-arena sort-arena"><div class="sort-grid"><button v-for="(drop, index) in newGrid" :key="index" type="button" :class="`drop-${drop}`" @click="newGridClick(index)">{{ drop ? '●' : '○' }}</button></div><span class="arena-timer">先选来源，再选试管</span><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'word-scramble'" class="mini-arena new-arena word-scramble-arena"><p class="scramble-word">{{ wordTokens.map((token) => token.letter).join(' ') }}</p><div class="word-tiles"><button v-for="token in wordTokens" :key="token.id" class="word-tile" :class="{ used: token.used }" type="button" @click="pickWordLetter(token)">{{ token.letter }}</button></div><span class="arena-timer">{{ wordTyped || '拼出单词' }}</span><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'math-blitz'" class="mini-arena new-arena math-arena"><strong class="math-question">{{ newMathQuestion }}</strong><div class="math-options"><button v-for="option in newMathOptions" :key="option" type="button" @click="newClick({ id: option, value: option, x: 0, y: 0 })">{{ option }}</button></div><span class="arena-timer">生命 {{ lives }} · {{ timerLabel }}</span><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'pattern-lock'" class="mini-arena new-arena pattern-arena"><div class="pattern-grid"><button v-for="(_, index) in 9" :key="index" type="button" :class="{ lit: newShowing && newPattern.includes(index) }" @click="newGridClick(index)">{{ newShowing && newPattern.includes(index) ? '•' : '' }}</button></div><span class="arena-timer">节点 {{ newPatternNext + 1 }} / {{ newPattern.length }}</span><div v-if="status !== 'playing' || newShowing" class="mini-overlay"><b>{{ newShowing ? '记住图案' : status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button v-if="!newShowing" class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'shape-fit'" class="mini-arena new-arena shape-arena"><div class="shape-grid"><button v-for="(shape, index) in newGrid" :key="index" type="button" :class="{ placed: shape === 2, selected: newSelected.includes(index) }" @click="newGridClick(index)">{{ shape === 2 ? '✓' : shape ? ['◆','●','▲','■'][shape - 1] : '○' }}</button></div><span class="arena-timer">点击形状，再点轮廓</span><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="['resource-route','colony-grid','flood-fill'].includes(slug)" class="mini-arena new-arena strategy-grid-arena"><div class="strategy-grid"><button v-for="(cell, index) in newGrid" :key="index" type="button" :class="[`cell-${cell}`, { selected: newSelected.includes(index) }]" @click="slug === 'resource-route' ? routePlace(index) : slug === 'colony-grid' ? newGridClick(index) : null">{{ slug === 'resource-route' ? (index === 0 ? '📦' : index === 24 ? '🏕️' : cell ? '·' : '') : slug === 'colony-grid' ? (cell === 1 ? '🏠' : cell === 2 ? '⚡' : cell ? '·' : '') : cell }}</button></div><div v-if="slug === 'flood-fill'" class="strategy-actions"><button v-for="color in 3" :key="color" type="button" @click="floodPick(color)">{{ color }}</button></div><span class="arena-timer">{{ slug === 'resource-route' ? '铺路到营地' : slug === 'colony-grid' ? '住宅与电站相邻' : '选择颜色填充' }}</span><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'market-merchant'" class="mini-arena new-arena market-arena"><div class="market-chart"><strong>今日价格 {{ newTarget }}G</strong><span :style="{ height: `${newTarget * 2}%` }"></span></div><p>金币 {{ newMarketCash }} · 库存 {{ newMarketStock }}</p><div class="market-actions"><button type="button" @click="marketAction('buy')">买入</button><button type="button" @click="marketAction('sell')">卖出</button></div><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'campfire-keeper'" class="mini-arena new-arena campfire-arena"><div class="campfire">🔥</div><div class="fire-meter"><i :style="{ width: `${newFire}%` }"></i></div><p>火力 {{ newFire }}%</p><div class="fuel-actions"><button type="button" @click="campfireAction(12)">木柴 +</button><button type="button" @click="campfireAction(-8)">节省 -</button></div><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'bridge-builder'" class="mini-arena new-arena bridge-arena"><div class="bridge-gap"><span>起点</span><i :style="{ width: `${Math.min(newTarget, 70)}%` }"></i><span>终点</span></div><p>峡谷宽度 {{ newTarget }}m</p><div class="bridge-actions"><button v-for="length in [25,35,45,55,65]" :key="length" type="button" @click="bridgePick(length)">{{ length }}m</button></div><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'weather-planner'" class="mini-arena new-arena weather-arena"><div class="weather-icon">{{ ['☀️','🌧️','❄️'][newWeather] }}</div><p>今天适合什么？</p><div class="weather-actions"><button v-for="(activity, index) in ['野餐','读书','滑雪']" :key="activity" type="button" @click="weatherPick(index)">{{ activity }}</button></div><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? message : config.title }}</b><p>{{ config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'stack-tower'" class="mini-arena new-arena tower-arena"><div v-for="entity in newEntities" :key="entity.id" class="stack-platform" :style="{ left: `${entity.x}%`, top: `${entity.y}%`, width: `${entity.value}%` }"></div><button class="stack-drop" type="button" @click="stackPlatform">点击堆叠</button><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '高塔倒塌' : '堆出高塔' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="['rocket-dodge','meteor-guard'].includes(slug)" class="mini-arena new-arena dodge-arena"><div class="new-player" :style="{ left: `${slug === 'meteor-guard' ? newShieldX : newPlayer.x}%`, bottom: '12%' }">{{ slug === 'meteor-guard' ? '🛡️' : '🚀' }}</div><span v-for="entity in newEntities" :key="entity.id" class="falling-entity" :style="{ left: `${entity.x}%`, top: `${entity.y}%` }">☄️</span><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '防线失守' : '准备闪避' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'ring-runner'" class="mini-arena new-arena ring-arena"><div class="runner-ring outer"></div><div class="runner-ring inner"></div><div class="runner-orb" :class="`lane-${newLane}`">💫</div><span v-for="entity in newEntities" :key="entity.id" class="ring-obstacle" :class="`lane-${entity.value}`" :style="{ top: `${entity.y}%` }">◆</span><button class="arena-action" type="button" @click="toggleRing">切换轨道</button><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '轨道碰撞' : '进入环轨' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'bubble-pop'" class="mini-arena new-arena bubble-arena"><button v-for="entity in newEntities" :key="entity.id" class="bubble" type="button" :style="{ left: `${entity.x}%`, top: `${entity.y}%`, background: entity.color }" @click="newClick(entity)">●</button><span class="arena-timer">目标色 {{ ['蓝','粉','黄'][newTarget] }} · {{ lives }}♥</span><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '泡泡结束' : '找对颜色' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'number-chain'" class="mini-arena new-arena number-arena"><div class="number-grid"><button v-for="number in newGrid" :key="number" type="button" :class="{ next: number === newTarget }" @click="newClick({ id: number, value: number, x: 0, y: 0 })">{{ number }}</button></div><span class="arena-timer">下一个：{{ newTarget }}</span><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '数字链结束' : '按顺序点击' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'simon-grid'" class="mini-arena new-arena simon-arena"><div class="number-grid"><button v-for="number in 16" :key="number" type="button" :class="{ lit: newShowing && newSequence[newShowIndex] === number - 1 }" @click="newClick({ id: number - 1, value: number - 1, x: 0, y: 0 })">{{ newShowing && newSequence[newShowIndex] === number - 1 ? '✦' : '' }}</button></div><div v-if="status !== 'playing' || newShowing" class="mini-overlay"><b>{{ newShowing ? '记住亮格' : status === 'gameover' ? '记忆失败' : '开始记忆' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button v-if="!newShowing" class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'slide-puzzle'" class="mini-arena new-arena number-arena"><div class="number-grid puzzle-grid"><button v-for="(number, index) in newGrid" :key="index" type="button" :class="{ empty: !number }" @click="slideTile(index)">{{ number || '' }}</button></div><span class="arena-timer">{{ timerLabel }}</span><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '拼图结算' : '滑动复原' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'pipe-connect'" class="mini-arena new-arena pipe-arena"><div class="pipe-grid"><button v-for="cell in newPipe" :key="cell.id" type="button" class="pipe-cell" :class="[`rotate-${cell.rotation}`, cell.id === 0 ? 'source' : cell.id === 8 ? 'goal' : '']" @click="rotatePipe(cell.id)">╰</button></div><span class="arena-timer">旋转全部管道 · {{ timerLabel }}</span><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '管道结算' : '连接水源' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'sum-cross'" class="mini-arena new-arena number-arena"><strong class="sum-target">目标 {{ newTarget }}</strong><div class="sum-grid"><button v-for="entity in newEntities" :key="entity.id" type="button" :class="{ selected: newSelected.includes(entity.id) }" @click="selectSum(entity)">{{ entity.value }}</button></div><span class="arena-timer">生命 {{ lives }}</span><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '算式结算' : '凑出目标和' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="['harbor-defense','drone-swarm'].includes(slug)" class="mini-arena new-arena defense-arena"><button v-for="entity in newEntities" :key="entity.id" class="new-target defense-target" type="button" :style="{ left: `${entity.x}%`, top: `${entity.y}%`, color: entity.color }" @click="newClick(entity)">{{ slug === 'drone-swarm' ? '🛸' : '⚓' }}</button><div class="harbor-line">港口 · {{ lives }}♥</div><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '防守失败' : '守住港口' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'shadow-hunt'" class="mini-arena new-arena shadow-arena"><div class="number-grid"><button v-for="number in 16" :key="number" type="button" :class="{ shadow: newShowing && newTarget === number - 1 }" @click="newClick({ id: number - 1, value: number - 1, x: 0, y: 0 })">{{ newShowing && newTarget === number - 1 ? '◉' : '?' }}</button></div><div v-if="status !== 'playing' || newShowing" class="mini-overlay"><b>{{ newShowing ? '观察暗影' : status === 'gameover' ? '追踪失败' : '寻找目标' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button v-if="!newShowing" class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'laser-grid'" class="mini-arena new-arena laser-arena"><div class="laser-line"></div><div class="laser-grid"><button v-for="(rotation, index) in newLaserRotations" :key="index" type="button" class="reflector" :style="{ transform: `rotate(${rotation * 45}deg)` }" @click="rotateLaser(index)">╱</button><span class="laser-goal">◎</span></div><span class="arena-timer">旋转反射板 · {{ timerLabel }}</span><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '激光熄灭' : '接通激光' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'mini-farm'" class="mini-arena new-arena farm-arena"><div class="farm-grid"><button v-for="plot in newFarm" :key="plot.id" type="button" :class="`farm-stage-${plot.stage}`" @click="farmAction(plot)">{{ ['＋','💧','🌿','🌾'][plot.stage] }}</button></div><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '农场结算' : '照料农田' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'tower-balance'" class="mini-arena new-arena tower-balance-arena"><div class="balance-tower" :style="{ height: `${newTowerHeight * 30}px` }">🏗️</div><p>平衡重量 {{ newTowerTarget }}</p><div class="weight-options"><button v-for="weight in newTowerOptions" :key="weight" type="button" @click="towerPick(weight)">{{ weight }} kg</button></div><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '高塔结算' : '建造平衡塔' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'traffic-flow'" class="mini-arena new-arena traffic-arena"><button class="traffic-light" type="button" :class="{ go: newSignal }" @click="toggleSignal">{{ newSignal ? '↕' : '↔' }}</button><span v-for="entity in newEntities" :key="entity.id" class="car" :style="{ left: `${entity.x}%`, top: `${entity.y}%` }">🚙</span><span class="traffic-cross">＋</span><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '交通事故' : '调度路口' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'island-builder'" class="mini-arena new-arena island-arena"><div class="island-grid"><button v-for="(tile, index) in newIsland" :key="index" type="button" :class="{ land: tile }" @click="islandPlace(index)">{{ tile ? '🌿' : '·' }}</button></div><span class="arena-timer">可用地块 {{ newIslandCapacity }}</span><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '岛屿结算' : '扩建岛屿' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="slug === 'deep-dive'" class="mini-arena new-arena dive-arena"><div class="submarine" :style="{ top: `${newDiveY}%` }">🤿</div><span v-for="entity in newEntities" :key="entity.id" class="reef" :style="{ left: `${entity.x}%`, top: `${entity.y}%` }">🪨</span><button class="dive-treasure" type="button" @click="score += 10">💎</button><div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '潜航结束' : '开始潜航' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">开始游戏</button></div></div>
      <div v-else-if="kidsSpec" class="mini-arena kids-arena">
        <div class="kids-prompt"><span class="kids-icon">{{ kidsSpec.icon }}</span><strong>{{ kidsSpec.prompt }}</strong><small>{{ kidsMode === 'find' ? '找出唯一不同的图案' : kidsMode === 'pairs' ? '翻开两张卡片找相同图案' : kidsMode === 'sequence' ? (kidsShowing ? '请记住闪亮的顺序' : '按刚才的顺序点击') : '选择你认为正确的答案' }}</small></div>
        <div v-if="kidsMode === 'find'" class="kids-grid find-grid"><button v-for="(option, index) in kidsOptions" :key="`${option}-${index}`" type="button" @click="kidsPick(index)">{{ index === kidsAnswer ? kidsSpec.icon : option }}</button></div>
        <div v-else-if="kidsMode === 'pairs'" class="kids-grid pair-grid"><button v-for="card in kidsCards" :key="card.id" type="button" :class="{ revealed: card.revealed || card.matched, matched: card.matched }" @click="kidsPick(card.id)">{{ card.revealed || card.matched ? card.value : '？' }}</button></div>
        <div v-else-if="kidsMode === 'sequence'" class="kids-grid sequence-grid"><button v-for="(option, index) in kidsSpec.options" :key="`${option}-${index}`" type="button" :class="{ shining: kidsShowing && kidsSequence.includes(index) }" @click="kidsPick(index)">{{ kidsShowing && kidsSequence.includes(index) ? option : '●' }}</button></div>
        <div v-else class="kids-options"><button v-for="(option, index) in kidsOptions" :key="`${option}-${index}`" type="button" :class="{ correct: message === '答对啦！' && index === kidsAnswer }" @click="kidsPick(index)">{{ option }}</button></div>
        <div class="kids-feedback" aria-live="polite">{{ message || `生命 ${lives} · 第 ${kidsRound + 1} 题` }}</div>
        <div v-if="status !== 'playing' || kidsShowing" class="mini-overlay"><b>{{ kidsShowing ? '记忆时间' : status === 'gameover' ? message : config.title }}</b><p>{{ status === 'gameover' ? '再试一次，你会越来越棒！' : config.description }}</p><button v-if="!kidsShowing" class="mini-primary" type="button" @click="startGame">{{ status === 'gameover' ? '重新开始' : '开始游戏' }}</button></div>
      </div>
      <div v-else class="mini-arena light-arena">
        <div class="light-vignette"></div><div class="signal-tower" :class="{ pulse: towerPulse }">⌂<small>LIGHT</small></div><button v-for="(enemy, index) in enemies" :key="enemy.id" class="enemy" type="button" :style="{ left: `${enemy.x}%`, top: `${enemy.y}%`, width: `${enemy.size}px`, height: `${enemy.size}px` }" @pointerdown.stop="attackEnemy(enemy.id)"><small>{{ index + 1 }}</small></button>
        <div v-if="status !== 'playing'" class="mini-overlay"><b>{{ status === 'gameover' ? '信号中断' : status === 'paused' ? '防线暂停' : '守住最后的光' }}</b><p>{{ status === 'gameover' ? message : config.description }}</p><button class="mini-primary" type="button" @click="startGame">{{ status === 'gameover' ? '重新开始' : '开始游戏' }}</button></div>
      </div>
      <div v-if="status === 'playing' || status === 'paused'" class="mini-controls">
        <template v-if="slug === 'orbit-architect'"><button type="button" @click="adjustOrbit(-1)">← 调低轨道</button><button type="button" @click="adjustOrbit(1)">调高轨道 →</button></template>
        <template v-else-if="slug === 'tiny-trails'"><button type="button" @click="moveTrail(0, -1)">↑</button><div><button type="button" @click="moveTrail(-1, 0)">←</button><button type="button" @click="moveTrail(0, 1)">↓</button><button type="button" @click="moveTrail(1, 0)">→</button></div></template>
        <template v-else-if="slug === 'pixel-punch'"><button class="wide-control" type="button" @click="hitPixel">空格 · 出拳</button></template>
        <template v-else-if="slug === 'last-light'"><button class="wide-control" type="button" @click="attackEnemy()">攻击最近目标</button></template>
        <template v-else-if="slug === 'color-switch'"><button v-for="(choice, index) in colorChoices" :key="choice.value" class="color-control" type="button" :style="{ '--choice-color': choice.value }" @click="chooseColor(index)">{{ index + 1 }}</button></template>
        <template v-else-if="slug === 'merge-2048'"><button type="button" @click="moveMerge('up')">↑</button><div><button type="button" @click="moveMerge('left')">←</button><button type="button" @click="moveMerge('down')">↓</button><button type="button" @click="moveMerge('right')">→</button></div></template>
        <template v-else-if="slug === 'sky-hopper'"><button type="button" @pointerdown="setSkyControl('left', true)" @pointerup="setSkyControl('left', false)" @pointerleave="setSkyControl('left', false)">←</button><button type="button" @pointerdown="setSkyControl('right', true)" @pointerup="setSkyControl('right', false)" @pointerleave="setSkyControl('right', false)">→</button></template>
        <template v-else-if="slug === 'cannon-stack'"><button type="button" @click="moveCannon(-1)">←</button><button class="wide-control" type="button" @click="fireCannon">发射</button><button type="button" @click="moveCannon(1)">→</button></template>
        <template v-else-if="slug === 'maze-escape'"><button type="button" @click="moveMaze(0, -1)">↑</button><div><button type="button" @click="moveMaze(-1, 0)">←</button><button type="button" @click="moveMaze(0, 1)">↓</button><button type="button" @click="moveMaze(1, 0)">→</button></div></template>
        <template v-else-if="['rocket-dodge','meteor-guard'].includes(slug)"><button type="button" @click="moveNew(-1)">←</button><button type="button" @click="moveNew(1)">→</button></template>
        <template v-else-if="slug === 'deep-dive'"><button type="button" @click="moveDive(-1)">↑</button><button type="button" @click="moveDive(1)">↓</button></template>
        <template v-else-if="slug === 'quick-tap'"><button class="wide-control" type="button" @click="newEntities[0] && newClick(newEntities[0])">点击目标</button></template>
        <template v-else-if="slug === 'stack-tower'"><button class="wide-control" type="button" @click="stackPlatform">落下平台</button></template>
        <template v-else-if="slug === 'ring-runner'"><button class="wide-control" type="button" @click="toggleRing">切换内外圈</button></template>
        <template v-else-if="slug === 'traffic-flow'"><button class="wide-control" type="button" @click="toggleSignal">切换信号灯</button></template>
        <template v-else-if="['coin-catcher','snowboard-dash','skate-line'].includes(slug)"><button type="button" @click="moveMovement(-1)">←</button><button type="button" @click="moveMovement(1)">→</button></template>
        <template v-else-if="slug === 'paper-plane'"><button type="button" @click="moveMovement(-1)">↑</button><button type="button" @click="moveMovement(1)">↓</button></template>
        <template v-else-if="['golf-putt','basket-shot','bowling-mini','fishing-cast'].includes(slug)"><button class="wide-control" type="button" @click="launchPhysics">{{ slug === 'fishing-cast' ? '抛竿' : '出手' }}</button></template>
        <template v-else-if="slug === 'colony-grid'"><button class="wide-control" type="button" @click="toggleBuilding">切换建筑</button></template>
      </div>
      <div class="mini-bottom-actions"><button type="button" :disabled="status === 'idle' || status === 'gameover'" @click="togglePause">{{ status === 'paused' ? '继续' : '暂停' }}</button><button type="button" @click="startGame">重新开始</button></div>
    </section>

    <section v-if="isSupported" class="mini-instructions"><strong>操作说明</strong><p>{{ config.instructions }}</p></section>
    <section v-else class="mini-card mini-not-found"><strong>暂时找不到这款游戏</strong><p>请返回大厅选择可玩的游戏。</p><RouterLink class="mini-primary" to="/zh">返回大厅</RouterLink></section>
    <footer class="mini-footer"><span>{{ statusLabel }}<template v-if="message"> · {{ message }}</template></span><span v-if="status === 'gameover'">本局 {{ score }} 分 · 最高 {{ highScore }} 分</span></footer>
  </main>
</template>

<style scoped>
.mini-game-page{width:min(calc(100% - 24px),480px);min-height:100vh;margin:0 auto;padding:calc(14px + env(safe-area-inset-top)) 0 calc(24px + env(safe-area-inset-bottom));color:#e8f4ef;background:#061017;font-family:"PingFang SC","Noto Sans SC",sans-serif;touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}.mini-header{display:flex;align-items:center;gap:9px;min-height:54px}.mini-back{color:#91e5cf;font-size:11px;text-decoration:none;white-space:nowrap}.mini-heading{flex:1;text-align:center}.mini-heading span{color:#65d8bc;font-size:9px;letter-spacing:.12em}.mini-heading h1{margin:3px 0 0;color:#f2e8bc;font-size:22px;letter-spacing:.02em}.mini-state{width:9px;height:9px;border-radius:50%;background:#81918c}.mini-state.is-playing{background:#62e0be;box-shadow:0 0 14px #62e0be}.mini-state.is-paused{background:#f0bf5d}.mini-state.is-gameover{background:#e77c87}.mini-scoreboard{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:13px 0 10px}.mini-scoreboard div{min-height:62px;padding:9px;border:1px solid #244c4c;border-radius:7px;background:#0b1d24}.mini-scoreboard small{display:block;color:#88a8a3;font-size:9px}.mini-scoreboard strong{display:block;margin-top:6px;color:#f3d982;font-size:19px}.mini-card{padding:9px;border:1px solid #315d5b;border-radius:10px;background:linear-gradient(145deg,#10272e,#071219);box-shadow:0 16px 36px #0007}.mini-arena{position:relative;min-height:390px;overflow:hidden;border:1px solid #285452;border-radius:7px;background:#071319}.mini-overlay{position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:24px;background:#061017cf;text-align:center}.mini-overlay b{color:#f5e9bb;font-size:24px}.mini-overlay p{max-width:250px;margin:9px 0 17px;color:#a1bbb5;font-size:11px;line-height:1.6}.mini-primary{display:inline-grid;place-items:center;min-height:44px;padding:0 20px;border:1px solid #63d7bc;border-radius:5px;color:#061017;background:#63d7bc;font-size:12px;font-weight:700;text-decoration:none}.mini-controls{display:flex;justify-content:center;gap:8px;margin-top:9px}.mini-controls button,.mini-bottom-actions button{min-height:42px;border:1px solid #326e69;border-radius:5px;color:#b7f1df;background:#0d2b31;font-size:11px}.mini-controls button{flex:1}.mini-controls>div{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:100%}.mini-controls>div button{min-width:0;font-size:19px}.mini-controls .wide-control{width:100%;color:#f5d875;border-color:#8c7133}.mini-bottom-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}.mini-bottom-actions button:disabled{cursor:not-allowed;opacity:.4}.mini-instructions{margin-top:11px;padding:12px 13px;border-left:2px solid #d4ac55;background:#0b1c22}.mini-instructions strong{color:#e8cf81;font-size:11px}.mini-instructions p{margin:6px 0 0;color:#8ea9a5;font-size:10px;line-height:1.65}.mini-footer{display:flex;justify-content:space-between;gap:8px;margin-top:10px;color:#789591;font-size:9px}.orbit-arena{background:radial-gradient(circle at center,#173b3d 0 5%,#0d242a 6% 42%,#071319 70%)}.orbit-sun{position:absolute;top:50%;left:50%;z-index:2;color:#ffe296;font-size:28px;transform:translate(-50%,-50%);text-shadow:0 0 25px #f6bd52}.orbit-ring{position:absolute;top:50%;left:50%;border:1px solid #4a9185aa;border-radius:50%;transform:translate(-50%,-50%);transition:border-color .2s}.orbit-ring.selected{border:2px solid #e8ca69;box-shadow:0 0 16px #e8ca6955}.orbit-ring.unstable{border-color:#e77c87;box-shadow:0 0 15px #e77c8744}.orbit-planet{position:absolute;top:50%;left:50%;display:grid;place-items:center;width:27px;height:27px;border-radius:50%;color:#071319;font-size:9px;font-style:normal;font-weight:800;transform:translate(-50%,-50%) rotate(var(--planet-angle)) translateX(var(--planet-distance));transform-origin:center;box-shadow:0 0 15px currentColor}.word-arena{display:flex;align-items:center;justify-content:center;flex-direction:column;padding:22px}.word-timer{color:#f3d982;font-size:12px}.word-hint{margin:30px 0 9px;color:#8eaaa5;font-size:11px}.word-answer{min-height:38px;color:#f5edc8;font-size:24px;letter-spacing:.17em;text-align:center}.word-tiles{display:flex;flex-wrap:wrap;justify-content:center;gap:7px;margin-top:25px}.word-tile{display:grid;place-items:center;width:44px;height:45px;border:1px solid #589b8d;border-radius:5px;color:#b8f2dc;background:#112f35;font-size:18px;font-weight:700}.word-tile.used{border-color:#263d3e;color:#58716d;background:#0a191e}.pixel-arena{background:#081821}.pixel-grid{position:absolute;inset:0;background:linear-gradient(#56d6bd15 1px,transparent 1px),linear-gradient(90deg,#56d6bd15 1px,transparent 1px);background-size:28px 28px}.pixel-countdown{position:absolute;top:12px;right:13px;color:#f5d875;font-size:13px}.pixel-target{position:absolute;z-index:2;display:grid;place-items:center;padding:0;border:2px solid #ffe899;border-radius:50%;color:#081821;background:#ec78bc;box-shadow:0 0 20px #ec78bc,0 0 0 7px #ec78bc33;font-size:17px;transform:translate(-50%,-50%);animation:target-pulse 1s ease-in-out infinite alternate}.trail-arena{display:grid;place-items:center;padding:20px;background:#0b1b20}.trail-grid{display:grid;width:min(100%,340px);aspect-ratio:1;border:2px solid #356b65;gap:2px;background:#356b65}.trail-cell{display:grid;place-items:center;min-width:0;color:#f6e69f;background:#112a31;font-size:12px}.trail-cell.wall{background:#050f15}.trail-cell.visited{background:#20584f;box-shadow:inset 0 0 0 2px #4bc9a7}.trail-cell.player{border:2px solid #ffe18a;color:#061017;background:#f0c660}.trail-cell.goal{color:#081017;background:#bf8cff}.light-arena{background:radial-gradient(circle at center,#1c473e,#0b2028 35%,#050b12 76%)}.light-vignette{position:absolute;inset:0;background:radial-gradient(circle at center,transparent 0 23%,#02070bb8 76%);pointer-events:none}.signal-tower{position:absolute;top:50%;left:50%;z-index:2;display:flex;align-items:center;justify-content:center;flex-direction:column;width:64px;height:64px;border:2px solid #f5d875;border-radius:50%;color:#ffe9a6;background:#312918;box-shadow:0 0 25px #f5c96088;font-size:27px;transform:translate(-50%,-50%)}.signal-tower small{font-size:7px;letter-spacing:.12em}.signal-tower.pulse{box-shadow:0 0 35px #ed7189,0 0 0 8px #ed718933}.enemy{position:absolute;z-index:3;padding:0;border:1px solid #f0809b;border-radius:50%;color:#fce4b2;background:#9c3f64;box-shadow:0 0 13px #df5b88;transform:translate(-50%,-50%)}.enemy small{font-size:9px}.mini-not-found{text-align:center}.mini-not-found strong{display:block;margin:28px 0 7px;color:#f5e8ba}.mini-not-found p{margin:0 0 17px;color:#9db5af;font-size:11px}@keyframes target-pulse{to{transform:translate(-50%,-50%) scale(1.12)}}@media(max-width:370px){.mini-game-page{width:calc(100% - 16px)}.mini-heading h1{font-size:19px}.mini-arena{min-height:350px}.word-tile{width:38px;height:42px}.mini-scoreboard strong{font-size:16px}}@media(prefers-reduced-motion:reduce){.orbit-ring,.pixel-target{transition:none;animation:none}}
.color-arena{background:radial-gradient(circle at 50% 38%,#142a35,#071319 62%)}.color-target{display:grid;place-items:center;width:125px;height:125px;margin:72px auto 45px;border:8px solid #ffffff22;border-radius:50%;box-shadow:0 0 35px currentColor;font-weight:700}.color-target span{padding:4px 7px;border-radius:4px;color:#fff;background:#061017aa;font-size:13px}.color-choices{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:0 14px}.color-choices button,.color-control{min-width:44px;min-height:44px;border:2px solid #ffffff44;border-radius:50%;color:#fff;background:var(--choice-color);font-weight:800;box-shadow:0 5px 14px #0005}.merge-arena{display:grid;place-items:center;background:#8c7655}.merge-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;width:min(92%,350px);aspect-ratio:1;padding:7px;border-radius:8px;background:#6f5c43}.merge-tile{min-width:0;border:0;border-radius:5px;color:#4a3928;background:#b8a78e;font-size:clamp(17px,7vw,30px);font-weight:800}.merge-tile:not(:empty){background:#f3d9a0}.merge-tile.tile-4{background:#f2b84b}.merge-tile.tile-8,.merge-tile.tile-16{color:#fff;background:#e98c61}.merge-tile.tile-32,.merge-tile.tile-64{color:#fff;background:#e96565}.merge-tile.tile-128,.merge-tile.tile-256{color:#fff;background:#c46ed8}.merge-tile.tile-512,.merge-tile.tile-1024,.merge-tile.tile-2048{color:#fff;background:#6c8ee8}.merge-notice{position:absolute;top:18px;padding:7px 12px;border-radius:5px;color:#281d15;background:#f2b84b;font-size:12px;font-weight:800}.sky-arena{background:linear-gradient(#102e52,#8edcff 70%,#d8f5ff)}.sky-platform{position:absolute;height:10px;border-radius:8px;background:#fff;box-shadow:0 3px 0 #4d9ac5}.sky-player{position:absolute;z-index:2;font-size:25px;line-height:1;transform:translateY(-100%)}.garden-arena{display:grid;place-items:center;background:linear-gradient(145deg,#1d3927,#0a1711)}.garden-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:min(92%,350px);aspect-ratio:1}.garden-card{min-width:0;min-height:44px;border:1px solid #527c42;border-radius:7px;color:#d8f3bd;background:#274d35;font-size:clamp(20px,8vw,34px);transition:transform .2s,background .2s}.garden-card.flipped{background:#d9efbd}.garden-card.matched{color:#31532a;background:#9bd36a}.mini-controls button{min-width:44px;min-height:44px}.color-control{border-radius:7px}.mini-game-page button{touch-action:manipulation}.mini-game-page button:focus-visible{outline:2px solid #f2e8bc;outline-offset:2px}@media (max-width:360px){.mini-game-page{width:calc(100% - 16px)}.mini-heading h1{font-size:18px}.mini-arena{min-height:350px}.color-choices{gap:6px;padding:0 7px}}@media (prefers-reduced-motion:reduce){.mini-game-page *,.mini-game-page *::before,.mini-game-page *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}
.neon-memory-arena{display:grid;place-items:center;background:radial-gradient(circle,#241d45,#071319 70%)}.neon-memory-grid{display:grid;gap:9px;width:min(86%,350px);aspect-ratio:1}.neon-memory-tile{min-width:0;border:1px solid #7654a8;border-radius:7px;color:#e7d7ff;background:#182235;box-shadow:inset 0 0 0 1px #ffffff08;transition:background .18s,box-shadow .18s}.neon-memory-tile.lit,.neon-memory-tile.clicked{color:#241333;background:#c69cff;box-shadow:0 0 24px #c69cff}.cannon-arena{background:linear-gradient(#101d3b,#061018 75%)}.cannon-target{position:absolute;z-index:2;display:grid;place-items:center;border-radius:50%;color:#ff9966;background:#ff9966;box-shadow:0 0 16px #ff9966;font-size:13px}.cannon-bullet{position:absolute;z-index:3;width:6px;height:18px;border-radius:5px;background:#ffe3a3;box-shadow:0 0 12px #ffe3a3;transform:translate(-50%,-50%)}.cannon-base{position:absolute;z-index:3;bottom:10px;transform:translateX(-50%);font-size:32px;transition:left .1s}.fruit-slice-arena{touch-action:none;background:linear-gradient(#162a3d,#071319 74%,#10291f)}.fruit-entity{position:absolute;z-index:2;padding:5px;border:0;background:transparent;line-height:1;transform:translate(-50%,-50%);touch-action:none}.fruit-entity.bomb{filter:drop-shadow(0 0 8px #ff6f91)}.fruit-timer{position:absolute;top:15px;right:17px;z-index:3;padding:5px 8px;border-radius:4px;color:#fff;background:#061017aa;font-weight:800}.maze-arena{display:grid;place-items:center;background:radial-gradient(circle,#163b3b,#071319 72%)}.maze-grid{display:grid;grid-auto-rows:1fr;width:min(92%,360px);aspect-ratio:1;padding:5px;border:2px solid #63c7a6;border-radius:7px;background:#0b2729;box-shadow:0 0 22px #63c7a644}.maze-grid>span{display:contents}.maze-cell{display:grid;place-items:center;min-width:0;border:1px solid #ffffff05;color:#f4e7a0;background:#123b3b;font-style:normal;font-size:clamp(8px,3vw,16px)}.maze-cell.wall{background:#061719;border-color:#061719}.maze-cell.goal{color:#63c7a6;background:#1e5d52;box-shadow:inset 0 0 13px #63c7a6}.maze-cell.player{background:#c69cff;box-shadow:0 0 15px #c69cff}.mini-controls button{min-width:44px;min-height:44px}@media (max-width:360px){.mini-game-page{width:calc(100% - 16px)}.mini-arena{min-height:350px}.mini-heading h1{font-size:18px}.mini-scoreboard div{padding:7px}.mini-scoreboard strong{font-size:16px}.neon-memory-grid{gap:5px;width:90%}.maze-grid{width:92%}}@media (prefers-reduced-motion:reduce){.neon-memory-tile,.cannon-base{transition:none}.mini-arena *{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important}}
.new-arena{background:radial-gradient(circle at 50% 35%,#163742,#071319 72%);touch-action:manipulation}.arena-timer{position:absolute;top:14px;left:50%;z-index:3;transform:translateX(-50%);padding:6px 10px;border-radius:999px;color:#f8e6ae;background:#061017bb;font-size:12px;font-weight:700;white-space:nowrap}.new-target{position:absolute;z-index:2;display:grid;place-items:center;min-width:48px;min-height:48px;border:2px solid #fff8;border-radius:50%;transform:translate(-50%,-50%);font-size:22px;box-shadow:0 0 22px currentColor}.quick-target{color:#44300b}.quick-arena{background:radial-gradient(circle,#5d4d27,#071319 70%)}.tower-arena{display:flex;align-items:center;justify-content:center;background:linear-gradient(#112b39,#081318)}.stack-platform{position:absolute;height:22px;transform:translateX(-50%);border:2px solid #ffd166;border-radius:5px;background:#f59e0b;box-shadow:0 0 15px #f59e0b88}.stack-drop,.arena-action{position:absolute;bottom:17px;z-index:3;min-height:48px;padding:0 18px;border:1px solid #ffd166;border-radius:8px;color:#261b08;background:#ffd166;font-weight:800}.dodge-arena{background:repeating-linear-gradient(90deg,#0a1e2b 0 12%,#0d2936 12% 13%)}.new-player{position:absolute;z-index:3;transform:translateX(-50%);font-size:34px;filter:drop-shadow(0 0 10px #fff6)}.falling-entity{position:absolute;z-index:2;transform:translate(-50%,-50%);font-size:25px;filter:drop-shadow(0 0 8px #ff8c69)}.ring-arena{display:grid;place-items:center;background:radial-gradient(circle,#241b42,#071319 70%)}.runner-ring{position:absolute;border:2px solid #b692ff66;border-radius:50%;aspect-ratio:1}.runner-ring.outer{width:78%}.runner-ring.inner{width:45%}.runner-orb{position:absolute;z-index:2;font-size:28px;transform:translateX(-50%)}.runner-orb.lane-0{top:12%}.runner-orb.lane-1{top:29%}.ring-obstacle{position:absolute;z-index:2;left:50%;transform:translate(-50%,-50%);color:#ff7dba;font-size:28px}.ring-obstacle.lane-0{margin-top:-91px}.ring-obstacle.lane-1{margin-top:-48px}.bubble-arena{background:radial-gradient(circle,#123f52,#071319 72%)}.bubble{position:absolute;z-index:2;display:grid;place-items:center;width:54px;height:54px;padding:0;border:3px solid #fff8;border-radius:50%;transform:translate(-50%,-50%);color:#fff8;font-size:36px;box-shadow:inset -8px -8px 12px #0002,0 0 18px currentColor}.number-arena{display:grid;place-items:center;background:linear-gradient(145deg,#14293e,#071319)}.number-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:min(90%,340px);aspect-ratio:1}.number-grid button{min-width:44px;min-height:44px;border:1px solid #41627b;border-radius:8px;color:#d9ebff;background:#102434;font-size:20px;font-weight:800}.number-grid button.next,.number-grid button.lit{color:#14220e;background:#82d173;box-shadow:0 0 18px #82d173}.number-grid button.empty{border-color:transparent;background:#071319}.puzzle-grid button{color:#422f14;background:#e6bd6b}.puzzle-grid button.empty{background:#071319}.simon-arena{background:radial-gradient(circle,#30234b,#071319 70%)}.pipe-arena{display:grid;place-items:center;background:linear-gradient(145deg,#173b3e,#071319)}.pipe-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;width:min(88%,310px);aspect-ratio:1}.pipe-cell{min-width:44px;min-height:44px;border:1px solid #5f9d91;border-radius:8px;color:#aee8d6;background:#12413e;font-size:42px;line-height:1;transition:transform .18s}.pipe-cell.rotate-1{transform:rotate(90deg)}.pipe-cell.rotate-2{transform:rotate(180deg)}.pipe-cell.rotate-3{transform:rotate(270deg)}.pipe-cell.source{color:#7ddcff;box-shadow:0 0 18px #7ddcff}.pipe-cell.goal{color:#9de889;box-shadow:0 0 18px #9de889}.sum-target{position:absolute;top:48px;color:#d7e5ff;font-size:24px}.sum-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:min(90%,340px)}.sum-grid button{min-height:58px;border:1px solid #6289c7;border-radius:8px;color:#e5edff;background:#18335c;font-size:21px;font-weight:800}.sum-grid button.selected{color:#122037;background:#7da8ff;box-shadow:0 0 16px #7da8ff}.defense-arena{background:linear-gradient(#132d42,#071319 75%)}.defense-target{background:#183243aa}.harbor-line{position:absolute;right:0;bottom:0;left:0;padding:15px;color:#d9f5ff;background:#15506c;font-weight:800;text-align:center}.shadow-arena{background:radial-gradient(circle,#352849,#071319 72%)}.number-grid button.shadow{color:#fff;background:#bd8ce0;box-shadow:0 0 22px #bd8ce0}.laser-arena{background:linear-gradient(145deg,#321d35,#071319)}.laser-line{position:absolute;top:50%;right:0;left:0;height:3px;background:#f06f9f;box-shadow:0 0 12px #f06f9f}.laser-grid{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;width:min(88%,320px);aspect-ratio:1}.reflector{min-width:54px;min-height:54px;border:2px solid #f06f9f;border-radius:8px;color:#ffd8e7;background:#5e2747;font-size:34px;box-shadow:0 0 12px #f06f9f88}.laser-goal{position:absolute;right:-4%;top:46%;color:#fff;font-size:32px}.farm-arena{display:grid;place-items:center;background:linear-gradient(#24482b,#0b1a11)}.farm-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(88%,320px)}.farm-grid button{min-height:76px;border:1px solid #7fab64;border-radius:10px;color:#eaffd6;background:#37613a;font-size:28px}.farm-grid .farm-stage-0{background:#593d2c}.farm-grid .farm-stage-1{background:#1f5a57}.farm-grid .farm-stage-2{background:#367a45}.farm-grid .farm-stage-3{background:#8b7b3b}.tower-balance-arena{display:flex;align-items:center;justify-content:flex-end;flex-direction:column;padding-bottom:24px;background:linear-gradient(#3b2e20,#101713)}.balance-tower{display:grid;place-items:center;min-width:70px;color:#f5d694;font-size:28px;background:#9b6d38;transition:height .2s}.tower-balance-arena p{margin:12px;color:#f5d694}.weight-options{display:flex;gap:8px}.weight-options button,.traffic-light{min-height:48px;padding:0 12px;border:1px solid #e5b76b;border-radius:8px;color:#34240e;background:#e5b76b;font-weight:800}.traffic-arena{background:linear-gradient(90deg,#192b33 49%,#405057 50% 51%,#192b33 52%)}.traffic-light{position:absolute;top:18px;left:50%;z-index:3;transform:translateX(-50%);background:#e05252}.traffic-light.go{background:#72d486}.traffic-cross{position:absolute;top:50%;left:50%;color:#d8d3aa;font-size:60px;transform:translate(-50%,-50%)}.car{position:absolute;z-index:2;transform:translate(-50%,-50%);font-size:25px}.island-arena{display:grid;place-items:center;background:linear-gradient(#63c7db,#287a8a)}.island-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;width:min(90%,330px);aspect-ratio:1}.island-grid button{min-width:44px;min-height:44px;border:1px solid #ffffff33;border-radius:6px;color:#bce9e6;background:#3b9eaa;font-size:20px}.island-grid button.land{background:#73c4a5;box-shadow:0 0 10px #73c4a566}.dive-arena{background:linear-gradient(#0b4264,#071827 55%,#061017)}.submarine{position:absolute;left:20%;z-index:3;transform:translate(-50%,-50%);font-size:32px}.reef{position:absolute;z-index:2;transform:translate(-50%,-50%);font-size:28px}.dive-treasure{position:absolute;top:40%;right:20%;z-index:2;min-width:52px;min-height:52px;border:0;border-radius:50%;background:#f2ce62;font-size:25px;box-shadow:0 0 20px #f2ce62}.mini-controls button{min-height:44px;min-width:44px}@media (max-width:360px){.mini-game-page{width:calc(100% - 16px)}.mini-heading h1{font-size:18px}.mini-arena{min-height:350px}.mini-scoreboard strong{font-size:16px}.mini-controls{gap:5px}.mini-controls button{padding:0 8px}}@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}
.reaction-arena{background:radial-gradient(circle at 50% 45%,#382d31,#071319 72%)}.reaction-grid{position:absolute;inset:0;background:linear-gradient(135deg,#ffffff05 25%,transparent 25% 50%,#ffffff04 50% 75%,transparent 75%);background-size:34px 34px}.reaction-target{z-index:2}.reaction-target.mole{border-radius:12px;background:#c98c62;box-shadow:0 0 18px #c98c62}.color-match-arena{display:grid;place-items:center;background:radial-gradient(circle,#39283b,#071319 70%)}.match-orb{display:grid;place-items:center;width:150px;height:150px;border:8px solid #ffffff33;border-radius:50%;box-shadow:0 0 40px currentColor;color:#fff;font-size:15px;font-weight:800}.match-options{position:absolute;bottom:48px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:calc(100% - 28px)}.match-options button,.safe-grid button,.button-memory-grid button,.odd-grid button,.pairs-grid button,.lights-grid button,.sort-grid button,.shape-grid button,.strategy-grid button,.math-options button,.weather-actions button,.bridge-actions button,.market-actions button,.fuel-actions button{min-width:44px;min-height:44px;border:1px solid #ffffff33;border-radius:8px;color:#fff;background:#19303a;font-weight:800}.safe-arena{display:grid;place-items:center;background:radial-gradient(circle,#203b36,#071319 70%)}.safe-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(88%,330px)}.safe-grid button{height:76px;color:#10251e;background:#63d7bc;box-shadow:0 0 14px #63d7bc55}.safe-grid button.danger{color:#fff;background:#e56b6f;box-shadow:0 0 18px #e56b6f88}.draw-arena{display:grid;place-items:center;background:linear-gradient(145deg,#2f2735,#071319)}.draw-signal{padding:18px 26px;border:2px solid #f4c95d;border-radius:12px;color:#f4c95d;background:#3a2e23;font-size:28px;font-weight:900}.draw-signal.fire{color:#fff;background:#d45362;box-shadow:0 0 32px #e56b6f}.draw-button{position:absolute;bottom:40px;min-width:110px;min-height:54px;border:0;border-radius:50%;color:#fff;background:#b74e67;font-weight:900}.button-memory-arena,.lights-arena,.pattern-arena{display:grid;place-items:center;background:radial-gradient(circle,#1d3150,#071319 72%)}.button-memory-grid,.lights-grid,.pattern-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(82%,320px);aspect-ratio:1}.button-memory-grid button{border-radius:50%;background:#213952}.button-memory-grid button.lit,.pattern-grid button.lit{color:#172035;background:#7bb7ff;box-shadow:0 0 22px #7bb7ff}.physics-arena{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:15px;background:linear-gradient(#183c36,#071319)}.physics-scene{display:flex;align-items:center;justify-content:space-between;width:78%;padding:28px 10px;border-bottom:3px solid #9ed36a;background:linear-gradient(90deg,#ffffff08 1px,transparent 1px);background-size:28px 28px;font-size:42px}.physics-goal{color:#f7d774;font-size:34px}.physics-arena label{display:grid;grid-template-columns:52px 1fr;align-items:center;width:76%;color:#b7d7cb;font-size:11px}.physics-arena input{width:100%;accent-color:#9ed36a}.physics-launch{min-width:110px;min-height:48px;border:1px solid #9ed36a;border-radius:8px;color:#13251e;background:#9ed36a;font-weight:900}.movement-arena{background:repeating-linear-gradient(110deg,#142e3c 0 18px,#102733 18px 36px)}.movement-lanes{position:absolute;inset:0;background:linear-gradient(90deg,transparent 32%,#ffffff18 32% 33%,transparent 33% 65%,#ffffff18 65% 66%,transparent 66%)}.movement-entity{position:absolute;z-index:2;transform:translate(-50%,-50%);font-size:28px;filter:drop-shadow(0 0 8px #f0c75e)}.odd-arena,.pairs-arena,.sort-arena,.shape-arena{display:grid;place-items:center;background:radial-gradient(circle,#27334b,#071319 72%)}.odd-grid,.pairs-grid,.shape-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:min(88%,340px);aspect-ratio:1}.odd-grid button{color:#c29cff;background:#243253;font-size:24px}.odd-grid button.odd{color:#fff;background:#c29cff;box-shadow:0 0 20px #c29cff}.pairs-grid button{color:#f2a6c2;background:#23334a;font-size:25px}.pairs-grid button.revealed{color:#242137;background:#f2a6c2}.lights-grid{width:min(78%,300px)}.lights-grid button{border-radius:50%;background:#142332}.lights-grid button.on{color:#423713;background:#f7d774;box-shadow:0 0 24px #f7d774}.sort-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:min(82%,320px)}.sort-grid button{height:92px;border-radius:40% 40% 12px 12px}.sort-grid .drop-1{color:#fff;background:#d96a95}.sort-grid .drop-2{color:#fff;background:#6f9de1}.sort-grid .drop-3{color:#fff;background:#71d1bd}.word-scramble-arena,.math-arena{display:grid;place-items:center;gap:20px;background:radial-gradient(circle,#3b3030,#071319 72%)}.scramble-word{color:#f5b46b;font-size:30px;font-weight:900;letter-spacing:.2em}.math-question{color:#86a8f4;font-size:36px}.math-options{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:75%}.math-options button{color:#17243e;background:#86a8f4;font-size:22px}.pattern-grid button{border-radius:50%;color:#d18be9;background:#25304b}.shape-grid button{color:#7fd4e7;background:#1b3440;font-size:25px}.shape-grid button.placed{color:#17322b;background:#7fd4e7}.shape-grid button.selected{outline:3px solid #fff}.strategy-grid-arena{display:grid;place-items:center;background:radial-gradient(circle,#263f3d,#071319 72%)}.strategy-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;width:min(84%,320px);aspect-ratio:1}.strategy-grid button{min-width:44px;min-height:44px;border-radius:5px;color:#9dbeb2;background:#18332f}.strategy-grid button.cell-1{color:#10231c;background:#7dcc9d}.strategy-grid button.cell-2{color:#1c2a3b;background:#8cb9e8}.strategy-actions{display:flex;gap:8px}.strategy-actions button{min-width:44px;min-height:44px;border:1px solid #70c8d5;border-radius:50%;color:#071319;background:#70c8d5;font-weight:900}.market-arena{display:grid;place-items:center;gap:14px;background:linear-gradient(#3c3322,#071319)}.market-chart{position:relative;width:72%;height:180px;padding:14px;border:1px solid #f1b969;border-radius:8px;background:linear-gradient(transparent 24%,#ffffff14 25% 26%,transparent 26% 49%,#ffffff14 50% 51%,transparent 51% 74%,#ffffff14 75% 76%,transparent 76%)}.market-chart strong{position:absolute;top:10px;color:#f1b969}.market-chart span{position:absolute;right:24%;bottom:0;width:36px;border-radius:5px 5px 0 0;background:#f1b969;box-shadow:0 0 18px #f1b969}.market-actions,.fuel-actions,.bridge-actions,.weather-actions{display:flex;gap:8px}.market-actions button,.fuel-actions button,.bridge-actions button,.weather-actions button{padding:0 13px;color:#211a0d;background:#f1b969}.campfire-arena{display:grid;place-items:center;gap:14px;background:radial-gradient(circle,#542d20,#071319 70%)}.campfire{font-size:80px;filter:drop-shadow(0 0 30px #ed956b)}.fire-meter{width:72%;height:18px;border:2px solid #ed956b;border-radius:99px;overflow:hidden}.fire-meter i{display:block;height:100%;background:#ed956b;transition:width .2s}.bridge-arena{display:grid;place-items:center;gap:18px;background:linear-gradient(#233b4b,#071319)}.bridge-gap{display:flex;align-items:center;justify-content:space-between;width:82%;color:#c69a73;font-weight:800}.bridge-gap i{display:block;height:12px;border-top:4px solid #c69a73;border-bottom:4px solid #c69a73;background:#9b785c}.weather-arena{display:grid;place-items:center;gap:18px;background:linear-gradient(#40536f,#071319)}.weather-icon{font-size:76px}.weather-actions button{color:#152134;background:#9cbded}@media (max-width:360px){.mini-arena{min-height:340px}.mini-heading h1{font-size:18px}.strategy-grid{width:92%}}@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}
.kids-arena{display:flex;flex-direction:column;align-items:center;gap:16px;padding:24px 14px;background:radial-gradient(circle at 50% 25%,#244d59,#071319 75%);touch-action:manipulation}.kids-prompt{display:flex;flex-direction:column;align-items:center;gap:7px;text-align:center}.kids-icon{font-size:clamp(42px,14vw,70px);line-height:1}.kids-prompt strong{color:#f8e6ae;font-size:clamp(18px,5vw,25px)}.kids-prompt small{color:#a8c8c1;font-size:12px}.kids-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(100%,350px)}.kids-grid button,.kids-options button{min-width:44px;min-height:64px;border:2px solid #ffffff33;border-radius:14px;color:#f5f8ef;background:#17343d;font-size:clamp(22px,8vw,38px);font-weight:800;touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}.find-grid button{background:linear-gradient(145deg,#285666,#16323d);box-shadow:0 5px 0 #0a2029}.find-grid button:active,.pair-grid button:active,.sequence-grid button:active{transform:translateY(2px)}.pair-grid button{font-size:30px;background:#214755}.pair-grid button.revealed{color:#17323b;background:#ffe6a6}.pair-grid button.matched{color:#17323b;background:#8ed7b5}.sequence-grid button{font-size:24px}.sequence-grid button.shining{color:#17323b;background:#ffd166;box-shadow:0 0 24px #ffd166}.kids-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;width:min(100%,350px)}.kids-options button{padding:10px;color:#17323b;background:#9bd9c9;font-size:clamp(18px,5vw,26px)}.kids-options button:nth-child(2){background:#f4c95d}.kids-options button:nth-child(3){background:#9fc5ef}.kids-options button:nth-child(4){background:#ef9eb4}.kids-options button.correct{box-shadow:0 0 0 4px #fff,0 0 22px #63d7bc}.kids-feedback{min-height:24px;color:#f8e6ae;font-size:14px;font-weight:700}@media (max-width:360px){.kids-arena{gap:11px;padding:18px 9px}.kids-grid{gap:7px}.kids-grid button,.kids-options button{min-height:58px}.kids-prompt strong{font-size:17px}}
.fun-arena{display:flex;flex-direction:column;align-items:center;gap:14px;padding:22px 14px;background:radial-gradient(circle at 50% 18%,#284a54,#071319 72%);touch-action:manipulation}.fun-progress{display:flex;justify-content:space-between;width:100%;color:#9bc7bf;font-size:12px}.fun-prompt{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;min-height:104px;text-align:center}.fun-prompt strong{max-width:390px;color:#f8e6ae;font-size:clamp(20px,5vw,28px);line-height:1.45}.fun-display{padding:12px 16px;border:1px solid #ffffff33;border-radius:12px;color:#fff6c9;background:#183943;font-size:clamp(28px,9vw,48px);letter-spacing:.08em}.fun-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;width:min(100%,390px)}.fun-options button,.fun-tools button,.fun-clues button,.fun-order-list button,.fun-submit{min-width:44px;min-height:52px;padding:8px 10px;border:1px solid #ffffff3d;border-radius:10px;color:#17323b;background:#a9dfcd;font-size:clamp(16px,4.5vw,21px);font-weight:800;touch-action:manipulation}.fun-options button:nth-child(2n){background:#f4cb76}.fun-options button:nth-child(3n){background:#a8c5f2}.fun-options button:disabled,.fun-tools button:disabled,.fun-clues button:disabled,.fun-order-list button:disabled,.fun-submit:disabled{opacity:.7}.fun-tools,.fun-clues{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;color:#f8e6ae;font-size:13px;text-align:center}.fun-tools button,.fun-clues button,.fun-submit{min-height:44px;padding:8px 16px;color:#17323b;background:#f0c46c;font-size:14px}.fun-clues p{width:100%;margin:0;padding:7px 10px;border-left:3px solid #c79ae8;color:#d8eae4;background:#ffffff0b;text-align:left}.fun-order{width:100%;text-align:center}.fun-order>p{margin:0 0 8px;color:#a8c8c1;font-size:13px}.fun-order-list{display:flex;flex-direction:column;gap:8px}.fun-order-list button{width:100%;color:#f5f8ef;background:#315c67;text-align:left}.fun-order-list button:nth-child(2n){background:#396b68}.fun-submit{margin-top:12px}.fun-feedback{min-height:42px;width:100%;margin:0;color:#f8e6ae;font-size:14px;line-height:1.5;text-align:center}.fun-waiting{display:grid;place-items:center;min-height:300px;color:#b9d8d0;font-size:18px;text-align:center}@media (max-width:360px){.fun-arena{gap:11px;padding:18px 9px}.fun-prompt{min-height:92px}.fun-options{gap:7px}.fun-options button{min-height:50px;padding:7px 5px;font-size:16px}.fun-order-list{gap:6px}.fun-order-list button{min-height:48px;padding:7px;font-size:15px}}@media (prefers-reduced-motion:reduce){.fun-arena *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
</style>
