export type KidsGameMode = "find" | "pairs" | "sequence" | "quiz" | "sort";
export type KidsGameSpec = { title: string; icon: string; mode: KidsGameMode; prompt: string; options: string[]; answer: number };

export function validateKidsGameSpec(slug: string, spec: KidsGameSpec): string[] {
  const errors: string[] = [];
  const options = Array.isArray(spec?.options) ? spec.options : [];
  if (!spec.title || !spec.icon || !spec.prompt) errors.push(`${slug}: title/icon/prompt must be non-empty`);
  if (options.length === 0 || options.some((option) => typeof option !== "string" || option.trim().length === 0)) errors.push(`${slug}: options must be non-empty`);
  if (!Number.isInteger(spec.answer) || spec.answer < 0 || spec.answer >= options.length) errors.push(`${slug}: answer index is out of range`);
  if (spec.mode === "find" && (!options[spec.answer] || !options.includes(spec.icon))) errors.push(`${slug}: find target is missing`);
  if (spec.mode === "pairs" && new Set(options).size < 2) errors.push(`${slug}: pairs need at least two distinct pairs`);
  if (spec.mode === "sequence" && options.length < 2) errors.push(`${slug}: sequence needs usable options`);
  return errors;
}

export function validateKidsGameSpecs(specs: Record<string, KidsGameSpec>): string[] {
  const errors = Object.entries(specs).flatMap(([slug, spec]) => validateKidsGameSpec(slug, spec));
  if (Object.keys(specs).length === 0) errors.push("kidsGameSpecs: at least one spec is required");
  return errors;
}

export const kidsGameSlugs = `find-star find-cat find-color find-shape find-fruit find-shadow find-number find-letter find-twin find-tail spot-dot spot-face spot-leaf spot-cloud spot-button odd-animal odd-food odd-vehicle odd-robot odd-flower animal-pairs fruit-pairs vehicle-pairs shape-pairs color-pairs sound-memory picture-memory star-memory toy-memory food-memory card-flip-kids memory-path emoji-sequence light-sequence animal-sequence train-memory rainbow-memory garden-memory space-memory ocean-memory count-apples count-stars count-balloons count-fish number-order number-match add-ten add-twenty minus-ten times-two compare-number more-or-less missing-number number-path shape-count coin-count-kids clock-kids calendar-kids math-balloons number-bingo color-paint color-order rainbow-sort shape-sort shape-rotate shape-shadow shape-build pattern-color pattern-shape pattern-size shadow-fit picture-puzzle tile-match-kids jigsaw-simple mirror-match left-right up-down inside-outside near-far same-different animal-home fruit-basket toy-box dress-up-order wash-hands brush-teeth plant-grow cook-soup sort-recycle safe-crossing traffic-color day-night hot-cold big-small long-short heavy-light happy-sad animal-food home-rooms simple-path`.split(" ") as string[];

const icons = ["⭐", "🐱", "🎨", "🔷", "🍎", "🌙", "🔢", "🔤", "👯", "🦊", "🔎", "🙂", "🍃", "☁️", "🔘", "🦄", "🍕", "🚗", "🤖", "🌸", "🐾", "🍓", "🚲", "🔺", "🟣", "🔔", "🖼️", "🌟", "🧸", "🍪", "🃏", "🛤️", "😀", "💡", "🐶", "🚂", "🌈", "🌱", "🚀", "🐳", "🍎", "⭐", "🎈", "🐟", "🔢", "🔗", "➕", "🔟", "➖", "✖️", "⚖️", "↔️", "❓", "🛣️", "🔺", "🪙", "🕒", "📅", "🎈", "🎯", "🖌️", "🌈", "🔷", "🔄", "🌑", "🧩", "🎨", "🔺", "🧱", "🔍", "🧩", "🧱", "🪞", "⬅️", "⬆️", "📦", "📏", "⚪", "🏠", "🍎", "🧸", "👕", "🧼", "🪥", "🌱", "🍲", "♻️", "🚸", "🚦", "🌞", "🌡️", "↕️", "📏", "⚖️", "🙂", "🐶", "🚪", "🧭"];
const prefixes: Record<string, string> = { find: "找一找", spot: "发现小细节", odd: "找出不同", animal: "动物小课堂", fruit: "水果小课堂", vehicle: "交通小课堂", shape: "形状小课堂", color: "颜色小课堂", sound: "声音记忆", picture: "图片记忆", star: "星星记忆", toy: "玩具记忆", food: "食物记忆", card: "翻牌记忆", memory: "记忆小达人", emoji: "表情顺序", light: "灯光顺序", train: "火车记忆", rainbow: "彩虹记忆", garden: "花园记忆", space: "太空记忆", ocean: "海洋记忆", count: "数一数", number: "数字小课堂", add: "加法小能手", minus: "减法小能手", times: "乘法小能手", compare: "数字比一比", more: "多少大挑战", missing: "找缺数字", pattern: "图案规律", shadow: "影子配对", tile: "方块配对", jigsaw: "简单拼图", mirror: "镜子游戏", left: "左右方向", up: "上下方向", inside: "里外判断", near: "远近判断", same: "相同不同", dress: "穿衣排序", wash: "洗手步骤", brush: "刷牙步骤", plant: "种植步骤", cook: "煮汤步骤", sort: "环保分类", safe: "安全过马路", traffic: "交通颜色", day: "白天黑夜", hot: "冷热判断", big: "大小判断", long: "长短判断", heavy: "轻重判断", happy: "心情小课堂", home: "房间分类", simple: "简单路线" };
const modeFor = (slug: string): KidsGameMode => /^(find|spot|odd)-/.test(slug) ? "find" : /(pairs|card-flip)/.test(slug) ? "pairs" : /(memory|sequence|path)/.test(slug) ? "sequence" : /^(count|number|add|minus|times|compare|more|missing|shape-count|coin-count|clock|calendar|math|number-bingo)(-|$)/.test(slug) ? "quiz" : "sort";
const titleFor = (slug: string): string => `${prefixes[slug.split("-")[0]] ?? "儿童益智"} · ${slug.replace(/-/g, " ")}`;
const findOptions = ["⭐", "🐱", "🍎", "🚗", "🌈", "🧸", "🔺", "🐳", "🌸"];
const sortOptions = ["正确", "再想想", "换一个", "先等等"];

function makeFindOptions(icon: string, answer: number): string[] {
  const targetIndex = Math.min(8, Math.max(0, answer));
  const distractors = findOptions.filter((item) => item !== icon).slice(0, 8);
  distractors.splice(targetIndex, 0, icon);
  return distractors;
}

export const kidsGameSpecs: Record<string, KidsGameSpec> = Object.fromEntries(kidsGameSlugs.map((slug, index) => {
  const mode = modeFor(slug);
  const icon = icons[index] ?? "⭐";
  const answer = index % 4;
  const options = mode === "find" ? makeFindOptions(icon, index % 9) : mode === "pairs" || mode === "sequence" ? [icon, icons[(index + 1) % icons.length] ?? "🌟", icons[(index + 2) % icons.length] ?? "🍀", icons[(index + 3) % icons.length] ?? "🌈", icons[(index + 4) % icons.length] ?? "🦋", icons[(index + 5) % icons.length] ?? "🐝", icons[(index + 6) % icons.length] ?? "🍓", icons[(index + 7) % icons.length] ?? "🚂", icons[(index + 8) % icons.length] ?? "☀️"] : mode === "quiz" ? [String((index % 5) + 1), String((index % 5) + 2), String((index % 5) + 3), String((index % 5) + 4)] : [sortOptions[index % sortOptions.length], "不合适", "还可以", "不确定"];
  return [slug, { title: titleFor(slug), icon, mode, prompt: mode === "find" ? `请找到唯一的${icon}` : mode === "pairs" ? `翻牌找出相同的${icon}` : mode === "sequence" ? `记住${icon}出现的顺序` : mode === "quiz" ? `${icon} 小问题：请选择正确答案` : `${icon} 小问题：哪一个最合适？`, options, answer: mode === "find" ? Math.min(8, index % 9) : answer } satisfies KidsGameSpec];
})) as Record<string, KidsGameSpec>;

const kidsGameSpecErrors = validateKidsGameSpecs(kidsGameSpecs);
if (kidsGameSpecErrors.length > 0) throw new Error(`Invalid kids game data:\n${kidsGameSpecErrors.join("\n")}`);
