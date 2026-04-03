/**
 * 生成完整汉字数据库
 * 数据来源：
 *   - 笔画数：hanzi-writer-data
 *   - 拼音/组词：hanzi (CC-CEDICT)
 *   - 偏旁：hanzi.decompose() level 2（部首分解）+ 人工修正表
 */

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
  // 偏旁为 儿 的字
  '兄': '儿', '光': '儿', '先': '儿', '元': '儿', '儿': '儿',
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
  // raw like "ni3 hao3" or "de/di2/di4" -> take first
  const first = raw.split('/')[0].split(' ')[0];
  return first.replace(/([aeiouüv])(\d)/g, (_, vowel, tone) => {
    const t = parseInt(tone);
    const map = TONE_MAP[vowel.toLowerCase()];
    if (!map) return vowel;
    const result = t >= 1 && t <= 5 ? map[t - 1] : vowel;
    return vowel === vowel.toUpperCase() ? result.toUpperCase() : result;
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

  // 拼音
  let pinyin = '';
  const defs = hanzi.definitionLookup(char, 's');
  if (defs && defs.length > 0) {
    pinyin = convertPinyin(defs[0].pinyin);
  } else {
    pinyin = '';
    noDefinition++;
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
