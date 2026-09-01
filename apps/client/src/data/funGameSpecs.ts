export type FunGameMode = "quiz" | "clue" | "order";

export type FunQuestion = {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  hint?: string;
  clues?: string[];
  display?: string;
  order?: number[];
};

export type FunGameSpec = {
  title: string;
  icon: string;
  mode: FunGameMode;
  prompt: string;
  questions: FunQuestion[];
};

export function validateFunGameSpec(slug: string, spec: FunGameSpec): string[] {
  const errors: string[] = [];
  if (!spec.title || !spec.icon || !spec.prompt || spec.questions.length === 0) errors.push(`${slug}: basic fields/questions are required`);
  spec.questions.forEach((question, index) => {
    if (!question.prompt || !question.explanation || question.options.length === 0) errors.push(`${slug}[${index}]: prompt/options/explanation are required`);
    if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.options.length) errors.push(`${slug}[${index}]: answer index is out of range`);
    if (spec.mode === "order") {
      const order = question.order ?? [];
      if (order.length !== question.options.length || new Set(order).size !== order.length || order.some((item) => item < 0 || item >= question.options.length)) errors.push(`${slug}[${index}]: order must be a permutation of options`);
    }
    if (spec.mode === "clue" && (!question.clues || question.clues.length === 0) && !question.hint) errors.push(`${slug}[${index}]: clue question needs clues or a hint`);
  });
  return errors;
}

export function validateFunGameSpecs(specs: Record<string, FunGameSpec>): string[] {
  return Object.entries(specs).flatMap(([slug, spec]) => validateFunGameSpec(slug, spec));
}

export const funGameSlugs = [
  "riddle-master",
  "lantern-riddles",
  "idiom-picture",
  "brain-teaser",
  "who-am-i",
  "story-order",
  "true-or-funny",
  "word-riddle",
] as const;

export const funGameSpecs: Record<(typeof funGameSlugs)[number], FunGameSpec> = {
  "riddle-master": {
    title: "脑筋急转弯",
    icon: "🧠",
    mode: "quiz",
    prompt: "转个小弯，看看谁的点子最妙！",
    questions: [
      { prompt: "什么东西有脚却不会走路？", options: ["桌子", "小狗", "蜗牛", "雨伞"], answer: 0, explanation: "桌子的四条腿叫桌脚，但它只能稳稳站着。" },
      { prompt: "小雨从不淋湿谁？", options: ["彩虹", "正在睡觉的人", "小鱼", "路灯"], answer: 2, explanation: "小鱼本来就生活在水里，雨水不会让它更湿。" },
      { prompt: "什么门永远关不上？", options: ["校门", "球门", "大门", "心门"], answer: 1, explanation: "球门没有门扇，球可以从里面穿过去。" },
      { prompt: "一只没有电池的钟，为什么每天还能走两次？", options: ["它会跑步", "它停在正确时间", "有人推它", "它有魔法"], answer: 1, explanation: "停住的钟每天也会在同一个时间点显示正确两次。" },
      { prompt: "什么东西越洗越脏？", options: ["毛巾", "白云", "水", "玻璃"], answer: 0, explanation: "毛巾把别的东西擦干净，自己反而吸收了污渍。" },
      { prompt: "哪一种书最喜欢旅行？", options: ["相册", "课本", "地图册", "字典"], answer: 2, explanation: "地图册画着许多地方，打开它就像开始一趟旅行。" },
      { prompt: "什么线不能用来缝衣服，却能帮助小朋友排队？", options: ["毛线", "直线", "电线", "风筝线"], answer: 1, explanation: "大家沿着地上的直线站好，就能排得整齐。" },
      { prompt: "小猫为什么不喜欢玩捉迷藏？", options: ["它不会跑", "它的胡须太长会露出来", "它怕黑", "它只会游泳"], answer: 1, explanation: "这是逗趣的想象题：长胡须可能先把它的位置暴露啦。" },
    ],
  },
  "lantern-riddles": {
    title: "猜灯谜",
    icon: "🏮",
    mode: "clue",
    prompt: "读一读谜面，猜出藏在灯笼里的答案。",
    questions: [
      { prompt: "谜面：白天不见，晚上出来；一闪一闪，挂满天边。", options: ["星星", "萤火虫", "路灯", "雪花"], answer: 0, hint: "它们在很高很远的地方。", explanation: "星星白天常被阳光遮住，夜里像小灯一样闪烁。" },
      { prompt: "谜面：身穿绿衣裳，肚里水汪汪，夏天切一刀，大家抢着尝。", options: ["黄瓜", "西瓜", "青苹果", "青豆"], answer: 1, hint: "它是夏天解暑的大圆果。", explanation: "西瓜外皮常是绿色，果肉多汁又清甜。" },
      { prompt: "谜面：一座小房子，天天背着走；遇到下雨天，打开头顶盖。", options: ["书包", "帐篷", "雨伞", "帽子"], answer: 2, hint: "它能在手里撑开。", explanation: "雨伞收起来像小房子，打开后可以挡雨。" },
      { prompt: "谜面：四四方方一张脸，身上数字排成行；每天告诉你，时间跑多快。", options: ["日历", "钟表", "棋盘", "课表"], answer: 1, hint: "指针会在它的脸上转圈。", explanation: "钟表的表盘像一张脸，数字和指针一起报时。" },
      { prompt: "谜面：没有翅膀会飞，没有嘴巴会唱，风一吹来就在天上摇晃。", options: ["风筝", "气球", "纸飞机", "树叶"], answer: 0, hint: "它常牵着一根长长的线。", explanation: "风筝借着风力升上天空，线让人能把它牵回来。" },
      { prompt: "谜面：小小身体白又亮，写完字后帮你忙；轻轻一擦，错误躲起来。", options: ["橡皮", "粉笔", "蜡笔", "尺子"], answer: 0, hint: "它常和铅笔一起住在文具盒里。", explanation: "橡皮可以擦去铅笔留下的痕迹。" },
      { prompt: "谜面：一片叶子水上飘，底下藏着小青蛙；圆圆脸儿不怕雨。", options: ["荷叶", "茶叶", "树叶", "菜叶"], answer: 0, hint: "它常和荷花一起出现。", explanation: "荷叶浮在池塘水面，青蛙还会把它当成小平台。" },
      { prompt: "谜面：身子长长一条龙，肚里装着小乘客；一站一站向前跑。", options: ["火车", "蜈蚣", "铅笔", "彩带"], answer: 0, hint: "它在铁轨上旅行。", explanation: "火车由许多车厢连接而成，能载着乘客到不同车站。" },
    ],
  },
  "idiom-picture": {
    title: "看图猜成语",
    icon: "🧩",
    mode: "quiz",
    prompt: "观察 emoji 组合，猜一猜对应的成语。",
    questions: [
      { display: "🐮  +  🎵", prompt: "这组图画想到哪个成语？", options: ["对牛弹琴", "牛气冲天", "九牛一毛", "汗牛充栋"], answer: 0, explanation: "对着牛弹琴，就是对不懂道理的人讲深奥的道理。" },
      { display: "🐲  +  🐯  +  斗", prompt: "这组图画想到哪个成语？", options: ["龙飞凤舞", "龙争虎斗", "虎头蛇尾", "画龙点睛"], answer: 1, explanation: "龙和虎争斗，表示双方力量相当、竞争激烈。" },
      { display: "🌱  +  🚀", prompt: "小苗一下冲得很高，想到哪个成语？", options: ["拔苗助长", "根深蒂固", "开花结果", "雨后春笋"], answer: 0, explanation: "把苗拔高来帮它长，是拔苗助长，提醒我们不能急于求成。" },
      { display: "🐴  +  👀  +  🌸", prompt: "骑马经过花丛，只匆匆看一眼，是什么成语？", options: ["马到成功", "走马观花", "老马识途", "一马当先"], answer: 1, explanation: "走马观花比喻观察得不仔细，只是匆匆看过。" },
      { display: "🦊  +  🐯  +  👑", prompt: "狐狸借老虎的威风，是什么成语？", options: ["狐假虎威", "如虎添翼", "狐朋狗友", "虎背熊腰"], answer: 0, explanation: "狐狸借着老虎的威势吓唬别人，就是狐假虎威。" },
      { display: "🌧️  +  🌸  +  🌱", prompt: "雨后花草变得更有生气，最接近哪个成语？", options: ["春风化雨", "雨过天晴", "生机勃勃", "花言巧语"], answer: 2, explanation: "花草充满活力、精神十足，可以说生机勃勃。" },
      { display: "👂  +  8️⃣  +  方", prompt: "耳朵听八个方向，是什么成语？", options: ["四面八方", "耳听八方", "八面玲珑", "七嘴八舌"], answer: 1, explanation: "耳听八方形容人十分机警，能注意各处的动静。" },
      { display: "🖌️  +  🐉  +  👁️", prompt: "画龙最后添上眼睛，是什么成语？", options: ["画蛇添足", "点石成金", "画龙点睛", "栩栩如生"], answer: 2, explanation: "画龙点睛比喻在关键地方加上一笔，让整体更精彩。" },
    ],
  },
  "brain-teaser": {
    title: "小小脑力王",
    icon: "💭",
    mode: "quiz",
    prompt: "用常识和逻辑，找出最合理的答案。",
    questions: [
      { prompt: "小明有 3 个红球和 2 个蓝球，至少拿出几个才能保证有一个蓝球？", options: ["1 个", "2 个", "3 个", "4 个"], answer: 3, explanation: "最坏情况先拿到 3 个红球，再拿第 4 个就一定是蓝球。" },
      { prompt: "一杯水和一杯牛奶一样多，把牛奶倒进水里，杯子里的液体会变成什么？", options: ["只有水", "只有牛奶", "水和牛奶的混合物", "空气"], answer: 2, explanation: "两种液体混在一起，会变成水和牛奶的混合物。" },
      { prompt: "小鸟站在树上，树下有一只猫。怎样让小鸟安全到另一棵树？", options: ["请猫闭眼", "等猫走开再飞", "让树长高", "把树搬走"], answer: 1, explanation: "等危险离开再行动，是更安全又简单的办法。" },
      { prompt: "一周里，哪一天最适合整理书包？", options: ["每天放学后", "只在周末", "考试当天", "从来不整理"], answer: 0, explanation: "每天放学后整理，第二天就更容易找到需要的东西。" },
      { prompt: "四个角各坐一只小熊，每只小熊都看见另外三只，一共有几只？", options: ["3 只", "4 只", "7 只", "12 只"], answer: 1, explanation: "四个角上的小熊彼此相望，总数还是四只。" },
      { prompt: "冰块放在太阳下会怎样？", options: ["变成石头", "慢慢融化", "长出叶子", "变得更冷"], answer: 1, explanation: "冰块吸收热量后会融化成水。" },
      { prompt: "小华从家到公园要经过一座桥，桥上写着‘慢慢走’，最应该怎么做？", options: ["闭眼跑", "慢慢走并扶好栏杆", "跳着走", "倒着走"], answer: 1, explanation: "遵守提示、稳稳行走，才是安全的选择。" },
      { prompt: "盒子里有苹果、梨和橙子，闭眼拿水果，至少拿几个才能保证有两个同样的？", options: ["2 个", "3 个", "4 个", "6 个"], answer: 2, explanation: "先拿到三种各一个，第四个无论是什么都会和其中一个相同。" },
    ],
  },
  "who-am-i": {
    title: "我是谁",
    icon: "🕵️",
    mode: "clue",
    prompt: "线索会一条条出现，越早猜中得分越高。",
    questions: [
      { prompt: "根据线索猜猜我是谁？", clues: ["我有两只长耳朵。", "我喜欢吃清脆的胡萝卜。", "我跑起来一蹦一跳。"], options: ["兔子", "松鼠", "企鹅", "长颈鹿"], answer: 0, explanation: "长耳朵、爱吃胡萝卜又会跳着跑的是兔子。" },
      { prompt: "根据线索猜猜我是谁？", clues: ["我有一把长长的伞。", "我在天空中慢慢飘。", "我下雨时常来帮忙。"], options: ["云朵", "雨伞", "风筝", "帆船"], answer: 1, explanation: "能撑开挡雨的长柄伞就是雨伞。" },
      { prompt: "根据线索猜猜我是谁？", clues: ["我住在池塘边。", "我会把尾巴摇来摇去。", "长大后我会变成青蛙。"], options: ["小蝌蚪", "小鱼", "鸭子", "蜻蜓"], answer: 0, explanation: "小蝌蚪经过成长会变成青蛙。" },
      { prompt: "根据线索猜猜我是谁？", clues: ["我有很多彩色的格子。", "我可以把远处的地方画在纸上。", "旅行前看看我会更方便。"], options: ["地图", "画板", "窗户", "棋盘"], answer: 0, explanation: "地图用图画和符号表示地点，能帮助我们规划旅行。" },
      { prompt: "根据线索猜猜我是谁？", clues: ["我有一条长长的鼻子。", "我喜欢用鼻子喷水。", "我的耳朵像两把小扇子。"], options: ["大象", "河马", "海豹", "犀牛"], answer: 0, explanation: "长鼻子、大耳朵和喷水本领都是大象的特点。" },
      { prompt: "根据线索猜猜我是谁？", clues: ["我白天在天空发光。", "我让大地暖洋洋。", "晚上大家看不见我。"], options: ["月亮", "太阳", "星星", "云朵"], answer: 1, explanation: "太阳白天照亮并温暖地球，晚上会落到地平线下。" },
      { prompt: "根据线索猜猜我是谁？", clues: ["我有黑白相间的琴键。", "手指按下我，就会唱歌。", "我常在音乐教室里。"], options: ["钢琴", "鼓", "口琴", "小提琴"], answer: 0, explanation: "有黑白琴键、按键发声的乐器是钢琴。" },
      { prompt: "根据线索猜猜我是谁？", clues: ["我有一张大大的嘴。", "我能把纸张变成小碎片。", "使用我时要请大人帮忙。"], options: ["剪刀", "碎纸机", "订书机", "胶水"], answer: 1, explanation: "能把纸张切成碎片的机器叫碎纸机，使用时要注意安全。" },
    ],
  },
  "story-order": {
    title: "故事排序",
    icon: "📚",
    mode: "order",
    prompt: "点击卡片调整顺序，让小故事顺利发生。",
    questions: [
      { prompt: "请按‘种下一粒豆子’的合理顺序排列：", options: ["浇水照料", "种下种子", "长出嫩芽", "结出豆荚"], answer: 0, order: [1, 0, 2, 3], explanation: "先种下种子，再浇水照料，种子长出嫩芽，最后结出豆荚。" },
      { prompt: "请按‘做一杯温水’的合理顺序排列：", options: ["端起杯子喝水", "把水倒进杯子", "确认水温合适", "准备一个杯子"], answer: 0, order: [3, 1, 2, 0], explanation: "先准备杯子，再倒水，确认温度合适后就能饮用。" },
      { prompt: "请按‘雨天出门’的合理顺序排列：", options: ["撑开雨伞", "穿好雨鞋", "看见窗外下雨", "走出家门"], answer: 0, order: [2, 1, 0, 3], explanation: "先发现下雨，穿好雨鞋、撑伞，准备妥当才能出门。" },
      { prompt: "请按‘借书阅读’的合理顺序排列：", options: ["归还图书", "挑选喜欢的书", "在安静处阅读", "办理借阅"], answer: 0, order: [1, 3, 2, 0], explanation: "挑好书后办理借阅，找安静处阅读，读完按时归还。" },
      { prompt: "请按‘做水果沙拉’的合理顺序排列：", options: ["把水果切小块", "洗净水果", "拌在一起", "放进碗里"], answer: 0, order: [1, 0, 3, 2], explanation: "水果先洗净，再切块放入碗中，最后拌匀。" },
      { prompt: "请按‘小鸟回巢’的合理顺序排列：", options: ["小鸟飞回树枝", "天色渐渐变暗", "小鸟找到鸟巢", "它在巢里休息"], answer: 0, order: [1, 0, 2, 3], explanation: "天色变暗后，小鸟飞回树枝找到鸟巢，最后在巢里休息。" },
      { prompt: "请按‘准备上体育课’的合理顺序排列：", options: ["来到操场集合", "换上运动鞋", "听老师讲规则", "下课收好物品"], answer: 0, order: [1, 0, 2, 3], explanation: "先换鞋到操场集合，听完规则开始活动，下课再收好物品。" },
      { prompt: "请按‘制作纸飞机’的合理顺序排列：", options: ["试飞纸飞机", "拿一张纸", "折出机翼", "压平折痕"], answer: 0, order: [1, 2, 3, 0], explanation: "先拿纸，再折出机翼、压平折痕，完成后才能试飞。" },
    ],
  },
  "true-or-funny": {
    title: "真假小侦探",
    icon: "🔍",
    mode: "quiz",
    prompt: "判断小知识是真是假，并读读为什么。",
    questions: [
      { prompt: "鱼可以在水里用鳃呼吸。", options: ["正确", "错误"], answer: 0, explanation: "正确。鱼鳃能从水中吸收氧气，帮助鱼呼吸。" },
      { prompt: "月亮会自己发出像太阳一样的光。", options: ["正确", "错误"], answer: 1, explanation: "错误。月亮主要是反射太阳光，所以我们能看见它。" },
      { prompt: "植物的根通常长在土里，可以帮助吸收水分。", options: ["正确", "错误"], answer: 0, explanation: "正确。根固定植物，也能从土壤中吸收水和部分养分。" },
      { prompt: "所有的鸟都能飞得很高。", options: ["正确", "错误"], answer: 1, explanation: "错误。有些鸟不会飞或飞得不高，比如企鹅和鸵鸟。" },
      { prompt: "冰遇到足够的热会融化成水。", options: ["正确", "错误"], answer: 0, explanation: "正确。冰是固态的水，吸收热量后会变成液态的水。" },
      { prompt: "彩虹通常出现在完全没有水滴的干燥空气中。", options: ["正确", "错误"], answer: 1, explanation: "错误。阳光穿过空气中的小水滴，才容易形成彩虹。" },
      { prompt: "蜜蜂会用花蜜帮助制作蜂蜜。", options: ["正确", "错误"], answer: 0, explanation: "正确。蜜蜂采集花蜜，经过储存和加工，形成蜂蜜。" },
      { prompt: "在图书馆里大声唱歌，通常是礼貌又合适的做法。", options: ["正确", "错误"], answer: 1, explanation: "错误。图书馆需要安静，轻声交流才能不打扰别人阅读。" },
    ],
  },
  "word-riddle": {
    title: "字谜乐园",
    icon: "🀄",
    mode: "quiz",
    prompt: "看字谜线索，选出藏起来的汉字。",
    questions: [
      { prompt: "字谜：一口咬掉牛尾巴。猜一个字。", options: ["告", "午", "口", "牛"], answer: 0, explanation: "‘牛’去掉尾巴的一竖，再和‘口’组合，可组成‘告’。" },
      { prompt: "字谜：人在树旁边。猜一个字。", options: ["休", "林", "体", "位"], answer: 0, explanation: "‘人’靠在‘木’旁边，就是‘休’，有休息的意思。" },
      { prompt: "字谜：日月一起出现。猜一个字。", options: ["明", "朋", "晴", "朗"], answer: 0, explanation: "‘日’和‘月’合在一起，组成‘明’。" },
      { prompt: "字谜：三个人一起走。猜一个字。", options: ["众", "从", "品", "森"], answer: 0, explanation: "三个‘人’合在一起，像人群一样，就是‘众’。" },
      { prompt: "字谜：一边是水，一边是青。猜一个字。", options: ["清", "晴", "情", "请"], answer: 0, explanation: "‘氵’表示水，右边是‘青’，合起来是‘清’。" },
      { prompt: "字谜：大口套小口。猜一个字。", options: ["回", "吕", "国", "品"], answer: 0, explanation: "一个‘口’里面套着另一个‘口’，看起来就是‘回’。" },
      { prompt: "字谜：木头旁边站着眼睛。猜一个字。", options: ["相", "想", "看", "睛"], answer: 0, explanation: "‘木’旁边加‘目’（眼睛），组成‘相’。" },
      { prompt: "字谜：两座山叠在一起。猜一个字。", options: ["出", "山", "岳", "峰"], answer: 0, explanation: "两个‘山’上下叠放，组成‘出’字。" },
    ],
  },
};

const funGameSpecErrors = validateFunGameSpecs(funGameSpecs);
if (funGameSpecErrors.length > 0) throw new Error(`Invalid fun game data:\n${funGameSpecErrors.join("\n")}`);
