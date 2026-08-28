import type { GameInfo } from "@arcade/shared";

const updatedAt = "2026-08-28T00:00:00.000Z";
const slugs = `find-star find-cat find-color find-shape find-fruit find-shadow find-number find-letter find-twin find-tail spot-dot spot-face spot-leaf spot-cloud spot-button odd-animal odd-food odd-vehicle odd-robot odd-flower animal-pairs fruit-pairs vehicle-pairs shape-pairs color-pairs sound-memory picture-memory star-memory toy-memory food-memory card-flip-kids memory-path emoji-sequence light-sequence animal-sequence train-memory rainbow-memory garden-memory space-memory ocean-memory count-apples count-stars count-balloons count-fish number-order number-match add-ten add-twenty minus-ten times-two compare-number more-or-less missing-number number-path shape-count coin-count-kids clock-kids calendar-kids math-balloons number-bingo color-paint color-order rainbow-sort shape-sort shape-rotate shape-shadow shape-build pattern-color pattern-shape pattern-size shadow-fit picture-puzzle tile-match-kids jigsaw-simple mirror-match left-right up-down inside-outside near-far same-different animal-home fruit-basket toy-box dress-up-order wash-hands brush-teeth plant-grow cook-soup sort-recycle safe-crossing traffic-color day-night hot-cold big-small long-short heavy-light happy-sad animal-food home-rooms simple-path`.split(" ");
const icons = ["⭐", "🐱", "🎨", "🔷", "🍎", "🌙", "🔢", "🔤", "👯", "🦊", "🔎", "🙂", "🍃", "☁️", "🔘", "🦄", "🍕", "🚗", "🤖", "🌸", "🐾", "🍓", "🚲", "🔺", "🟣", "🔔", "🖼️", "🌟", "🧸", "🍪", "🃏", "🛤️", "😀", "💡", "🐶", "🚂", "🌈", "🌱", "🚀", "🐳", "🍎", "⭐", "🎈", "🐟", "🔢", "🔗", "➕", "🔟", "➖", "✖️", "⚖️", "↔️", "❓", "🛣️", "🔺", "🪙", "🕒", "📅", "🎈", "🎯", "🖌️", "🌈", "🔷", "🔄", "🌑", "🧩", "🎨", "🔺", "🧱", "🔍", "🧩", "🧱", "🪞", "⬅️", "⬆️", "📦", "📏", "⚪", "🏠", "🍎", "🧸", "👕", "🧼", "🪥", "🌱", "🍲", "♻️", "🚸", "🚦", "🌞", "🌡️", "↕️", "📏", "⚖️", "🙂", "🐶", "🚪", "🧭"];
const prefixes: Record<string, string> = { find: "找一找", spot: "发现小细节", odd: "找出不同", animal: "动物小课堂", fruit: "水果小课堂", vehicle: "交通小课堂", shape: "形状小课堂", color: "颜色小课堂", sound: "声音记忆", picture: "图片记忆", star: "星星记忆", toy: "玩具记忆", food: "食物记忆", card: "翻牌记忆", memory: "记忆小达人", emoji: "表情顺序", light: "灯光顺序", train: "火车记忆", rainbow: "彩虹记忆", garden: "花园记忆", space: "太空记忆", ocean: "海洋记忆", count: "数一数", number: "数字小课堂", add: "加法小能手", minus: "减法小能手", times: "乘法小能手", compare: "数字比一比", more: "多少大挑战", missing: "找缺数字", pattern: "图案规律", shadow: "影子配对", tile: "方块配对", jigsaw: "简单拼图", mirror: "镜子游戏", left: "左右方向", up: "上下方向", inside: "里外判断", near: "远近判断", same: "相同不同", dress: "穿衣排序", wash: "洗手步骤", brush: "刷牙步骤", plant: "种植步骤", cook: "煮汤步骤", sort: "环保分类", safe: "安全过马路", traffic: "交通颜色", day: "白天黑夜", hot: "冷热判断", big: "大小判断", long: "长短判断", heavy: "轻重判断", happy: "心情小课堂", home: "房间分类", simple: "简单路线" };
const modeText: Record<string, [string, string]> = {
  find: ["找到唯一目标", "观察九个大图案，点击唯一正确的目标。点错会结束本局。"],
  pairs: ["翻牌配对", "点击两张卡片找相同图案，配完所有卡片即可得分。"],
  sequence: ["记忆顺序", "先看短暂出现的顺序，再按相同顺序点击。"],
  quiz: ["选择答案", "读一读题目，点击正确的大按钮，连续答对可以得分。"],
  sort: ["生活小判断", "观察题目，点击最合适的图案或答案完成挑战。"],
};
function modeFor(slug: string): keyof typeof modeText {
  if (/^(find|spot|odd)-/.test(slug)) return "find";
  if (/(pairs|card-flip)/.test(slug)) return "pairs";
  if (/(memory|sequence|path)/.test(slug)) return "sequence";
  if (/^(count|number|add|minus|times|compare|more|missing|shape-count|coin-count|clock|calendar|math|number-bingo)(-|$)/.test(slug)) return "quiz";
  return "sort";
}
function titleFor(slug: string): string { const prefix = prefixes[slug.split("-")[0]] ?? "儿童益智"; return `${prefix} · ${slug.replaceAll("-", " ")}`; }
export const kidsGames: GameInfo[] = slugs.map((slug, index) => {
  const mode = modeFor(slug); const [modeName, modeDescription] = modeText[mode];
  return { slug, title: titleFor(slug), description: `${modeDescription} 和${icons[index % icons.length] ?? "⭐"}一起玩得开心，练习观察、记忆和思考。`, category: "Puzzle", icon: icons[index % icons.length] ?? "⭐", accent: `hsl(${(index * 37 + 186) % 360} 62% 62%)`, players: "1 player", status: "published", developerName: "星屿儿童益智工坊", supportedLocales: ["zh-CN"], orientation: "portrait", inputModes: ["touch", "mouse"], deviceSupport: ["mobile", "tablet", "desktop"], launchMode: "same-origin", tags: ["儿童", "益智", modeName], updatedAt };
});
