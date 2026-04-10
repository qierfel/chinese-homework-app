/**
 * 生成完整汉字数据库
 * 数据来源：
 *   - 笔画数：hanzi-writer-data
 *   - 拼音/组词：hanzi (CC-CEDICT)
 *   - 偏旁：hanzi.decompose() level 2（部首分解）+ 人工修正表
 */

// 拼音人工修正表 —— CC-CEDICT 首条读音为姓氏/虚词/生僻音时，改为小学常用音
const PINYIN_OVERRIDES = {
  '万': 'wàn',   // CC-CEDICT 首条为姓氏 Mò
  '地': 'dì',    // CC-CEDICT 首条为结构助词 de
  '上': 'shàng', // CC-CEDICT 首条为古音 shǎng
  '重': 'zhòng', // CC-CEDICT 首条为 chóng（重复），小学先学"重量"义
  '长': 'cháng', // CC-CEDICT 首条为 zhǎng，但常用义先是"长度"
  '强': 'qiáng', // CC-CEDICT 首条可能为 qiǎng
  '数': 'shù',   // CC-CEDICT 首条可能为 shǔ（数一数）
  '好': 'hǎo',   // CC-CEDICT 首条可能为 hào（爱好）
  '乐': 'lè',    // CC-CEDICT 首条可能为 yuè（音乐）
  '觉': 'jiào',  // CC-CEDICT 首条可能为 jué（感觉）
  '着': 'zhe',   // CC-CEDICT 首条可能为 zháo
  '了': 'le',    // CC-CEDICT 首条可能为 liǎo
  '得': 'de',    // 助词
};

// 新华字典人工修正表（优先级最高，覆盖自动识别的错误）
// 来源：新华字典2011版部首查字表
const RADICAL_OVERRIDES = {
  // 𠂇 系列（decompose 误识别为 𠂇 的常用字）
  '友': '又', '左': '工', '右': '口', '有': '月', '在': '土',
  // 偏旁为 木 的字被误识别
  '果': '木', '桌': '木', '林': '木', '森': '木', '架': '木',
  '枝': '木', '根': '木', '棵': '木', '植': '木', '树': '木',
  '样': '木', '板': '木', '梯': '木', '橡': '木', '棒': '木',
  '朵': '木', '东': '木',
  // 偏旁为 日 的字
  '春': '日', '晨': '日', '暮': '日', '暖': '日', '晴': '日',
  '星': '日', '明': '日', '是': '日', '时': '日', '昨': '日',
  '昏': '日', '显': '日', '晚': '日', '早': '日', '昔': '日',
  '映': '日', '普': '日', '景': '日', '温': '日',
  // 偏旁为 月 的字（肉旁写作月）
  '朋': '月', '肾': '月', '脸': '月', '胸': '月', '背': '月',
  '腿': '月', '肚': '月', '胆': '月', '腰': '月', '肩': '月',
  '臂': '月', '脑': '月', '脖': '月', '胳': '月',
  // 偏旁为 子 的字
  '学': '子', '孩': '子', '孙': '子', '孢': '子',
  // 偏旁为 弓 的字
  '弟': '弓', '弯': '弓', '弹': '弓', '强': '弓', '弱': '弓',
  '张': '弓', '弦': '弓',
  // 偏旁为 又 的字
  '双': '又', '难': '又', '叔': '又', '取': '又', '受': '又',
  '对': '又', '观': '又',
  // 偏旁为 儿 的字
  '兄': '儿', '光': '儿', '先': '儿', '元': '儿', '儿': '儿',
  '克': '儿', '党': '儿',
  // 偏旁为 巾 的字
  '师': '巾', '帮': '巾', '带': '巾', '希': '巾', '幕': '巾',
  '帽': '巾', '幸': '干',
  // 偏旁为 乙 的字
  '书': '乙', '也': '乙', '乙': '乙',
  // 夂 系列
  '夏': '夂', '复': '夂', '各': '夂',
  // 灬（火）系列
  '灵': '火', '热': '火', '煮': '火', '熟': '火', '蒸': '火',
  '烹': '火', '燃': '火', '炎': '火', '焦': '火', '然': '火',
  // 虫 系列
  '蠢': '虫', '蛋': '虫', '蚁': '虫', '蛙': '虫', '虾': '虫',
  '蛇': '虫', '螃': '虫', '蟹': '虫', '蚊': '虫', '蜂': '虫',
  '蝴': '虫', '蝶': '虫', '蜻': '虫', '蜓': '虫',
  // 其他常见误识别
  '鼻': '自', '朝': '月', '勇': '力', '男': '田',
  '思': '心', '恩': '心', '忘': '心', '感': '心', '意': '心',
  '总': '心', '想': '心', '态': '心', '忙': '心', '怕': '心',
  '性': '心', '情': '心', '慢': '心', '快': '心', '怀': '心',
  '爱': '爪', '受': '又', '彩': '彡', '影': '彡',
  '数': '攴', '教': '攴', '救': '攴', '放': '攴',
  '动': '力', '助': '力', '加': '力', '努': '力', '劳': '力',
  '别': '刀', '利': '刀', '列': '刀', '到': '刀', '制': '刀',
  '刻': '刀', '则': '刀', '初': '刀', '前': '刀',
  // 偏旁为 一 的字（常被误识别）
  '上': '一', '丑': '一', '世': '一', '丘': '一', '丙': '一',
  '业': '一', '专': '一', '且': '一', '与': '一', '万': '一',
  '天': '一', '不': '一', '开': '一', '平': '一',
  // 偏旁为 口 的字
  '吃': '口', '喝': '口', '叫': '口', '唱': '口', '说': '口',
  '听': '口', '问': '口', '告': '口', '哭': '口', '笑': '口',
  '叶': '口', '号': '口', '名': '口', '只': '口', '可': '口',
  // 偏旁为 氵(水) 的字
  '海': '氵', '河': '氵', '湖': '氵', '江': '氵', '泳': '氵',
  '浪': '氵', '流': '氵', '洗': '氵', '泡': '氵', '澡': '氵',
  '清': '氵', '浅': '氵', '深': '氵', '满': '氵', '泪': '氵',
  '法': '氵', '活': '氵', '注': '氵', '游': '氵', '漂': '氵',
  // 偏旁为 讠(言) 的字
  '说': '讠', '话': '讠', '读': '讠', '语': '讠', '请': '讠',
  '谢': '讠', '认': '讠', '识': '讠', '课': '讠', '词': '讠',
  // 偏旁为 阝(阜) 的字（左耳旁）
  '阴': '阝', '阳': '阝', '际': '阝', '队': '阝', '陆': '阝',
  '院': '阝', '除': '阝', '陈': '阝',
  // 偏旁为 宀 的字
  '家': '宀', '字': '宀', '宝': '宀', '宫': '宀', '室': '宀',
  '安': '宀', '定': '宀', '宽': '宀', '容': '宀', '完': '宀',
  // 偏旁为 土 的字
  '地': '土', '场': '土', '坐': '土', '块': '土', '城': '土',
  '坏': '土', '型': '土', '均': '土', '基': '土',
  // 偏旁为 人(亻) 的字
  '你': '亻', '他': '亻', '们': '亻', '作': '亻', '住': '亻',
  '位': '亻', '休': '亻', '体': '亻', '借': '亻', '像': '亻',
  '信': '亻', '做': '亻', '停': '亻', '健': '亻', '保': '亻',
  // 偏旁为 鸟 的字
  '鸡': '鸟', '鸭': '鸟', '鹅': '鸟', '鸽': '鸟', '鹤': '鸟',
  '燕': '鸟', '鸦': '鸟', '鹰': '鸟',
  // 偏旁为 草(艹) 的字
  '花': '艹', '草': '艹', '芽': '艹', '苗': '艹', '苹': '艹',
  '菜': '艹', '茶': '艹', '荷': '艹', '莲': '艹', '蒲': '艹',
  '薄': '艹', '蓝': '艹', '芬': '艹', '芳': '艹',
};

const fs = require('fs');
const path = require('path');
const hanzi = require('hanzi');

hanzi.start();

// 数字声调转符号
const TONE_MAP = {
  a: ['ā','á','ǎ','à','a'],
  e: ['ē','é','ě','è','e'],
  i: ['ī','í','ǐ','ì','i'],
  o: ['ō','ó','ǒ','ò','o'],
  u: ['ū','ú','ǔ','ù','u'],
  ü: ['ǖ','ǘ','ǚ','ǜ','ü'],
  v: ['ǖ','ǘ','ǚ','ǜ','ü'],
};

function convertPinyin(raw) {
  // raw like "ni3 hao3" or "de/di2/di4" -> take first, lowercase
  const first = raw.split('/')[0].split(' ')[0].toLowerCase();
  // normalize u: -> ü (CC-CEDICT uses u: for ü)
  const normalized = first.replace(/u:/g, 'ü');

  // Replace each syllable+tone-number with proper tone mark
  // Tone mark placement rules:
  //   1. If syllable has 'a' or 'e', it takes the mark
  //   2. In 'ou', 'o' takes the mark
  //   3. Otherwise the last vowel (i/o/u/ü) takes the mark
  return normalized.replace(/([a-züv]+)([1-5])/g, (_, syllable, toneStr) => {
    const t = parseInt(toneStr);
    const s = syllable;
    let idx = -1;

    // Rule 1
    for (let i = 0; i < s.length; i++) {
      if (s[i] === 'a' || s[i] === 'e') { idx = i; break; }
    }
    // Rule 2
    if (idx === -1) {
      const ouPos = s.indexOf('ou');
      if (ouPos !== -1) idx = ouPos;
    }
    // Rule 3
    if (idx === -1) {
      for (let i = s.length - 1; i >= 0; i--) {
        if ('iouüv'.includes(s[i])) { idx = i; break; }
      }
    }

    // Neutral tone (5) or no vowel: return syllable without the number
    if (idx === -1 || t < 1 || t > 4) return s;

    const key = s[idx] === 'v' ? 'v' : s[idx];
    const map = TONE_MAP[key];
    if (!map) return s;
    return s.substring(0, idx) + map[t - 1] + s.substring(idx + 1);
  });
}

const writerDataDir = path.join(__dirname, '../node_modules/hanzi-writer-data');
const files = fs.readdirSync(writerDataDir).filter(f => {
  if (!f.endsWith('.json') || f === 'package.json') return false;
  const char = f.replace('.json', '');
  const code = char.codePointAt(0);
  // 常用CJK统一汉字 + 扩展A区
  return (code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF);
});

console.log(`处理 ${files.length} 个汉字...`);

const result = {};
let processed = 0;
let noDefinition = 0;

for (const file of files) {
  const char = file.replace('.json', '');

  // 笔画数
  let strokeCount = 0;
  try {
    const data = JSON.parse(fs.readFileSync(path.join(writerDataDir, file), 'utf8'));
    strokeCount = data.strokes ? data.strokes.length : 0;
  } catch (e) {
    continue;
  }

  // 拼音：优先使用人工修正表，否则取 CC-CEDICT 首条读音
  let pinyin = '';
  if (PINYIN_OVERRIDES[char]) {
    pinyin = PINYIN_OVERRIDES[char];
  } else {
    const defs = hanzi.definitionLookup(char, 's');
    if (defs && defs.length > 0) {
      pinyin = convertPinyin(defs[0].pinyin);
    } else {
      pinyin = '';
      noDefinition++;
    }
  }

  // 偏旁：优先使用人工修正表，否则用 level 2 部首分解
  let radical = '';
  if (RADICAL_OVERRIDES[char]) {
    radical = RADICAL_OVERRIDES[char];
  } else {
    try {
      const decomp = hanzi.decompose(char, 2);
      if (decomp && decomp.components && decomp.components.length > 0) {
        radical = decomp.components[0];
        if (radical === 'No glyph available' || radical.length > 2) radical = '';
      }
    } catch (e) {}
  }

  // 组词（取含该字的2字简体词，最多6个）
  const words = [];
  try {
    const examples = hanzi.getExamples(char);
    if (examples && Array.isArray(examples)) {
      for (const group of examples) {
        if (!Array.isArray(group)) continue;
        for (const entry of group) {
          const w = entry.simplified || entry.traditional;
          if (w && w.length === 2 && w.includes(char)) {
            words.push(w);
            if (words.length >= 6) break;
          }
        }
        if (words.length >= 6) break;
      }
    }
  } catch (e) {}

  // 跳过无拼音的生僻字
  if (!pinyin) continue;

  result[char] = {
    pinyin,
    radical,
    strokes: strokeCount,
    words,
  };

  processed++;
  if (processed % 500 === 0) {
    console.log(`  ${processed}/${files.length}...`);
  }
}

console.log(`完成！共 ${processed} 个字，${noDefinition} 个无拼音数据`);

// 输出为 JS 模块
const output = `// 自动生成 - 汉字数据库
// 共 ${processed} 个字，来源：hanzi-writer-data + CC-CEDICT
// 生成时间：${new Date().toISOString()}

const characters = ${JSON.stringify(result, null, 2)};

export default characters;
`;

const outPath = path.join(__dirname, '../src/data/characters.js');
fs.writeFileSync(outPath, output, 'utf8');
console.log(`已写入：${outPath}`);
console.log(`文件大小：${(fs.statSync(outPath).size / 1024 / 1024).toFixed(2)} MB`);
