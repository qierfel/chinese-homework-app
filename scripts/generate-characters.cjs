/**
 * 生成完整汉字数据库
 * 数据来源：
 *   - 笔画数：hanzi-writer-data
 *   - 拼音/组词：hanzi (CC-CEDICT)
 *   - 偏旁：hanzi.decompose()
 */

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

  // 偏旁（取第一层分解的第一个部件）
  let radical = '';
  try {
    const decomp = hanzi.decompose(char, 1);
    if (decomp && decomp.components && decomp.components.length > 0) {
      radical = decomp.components[0];
      if (radical === 'No glyph available' || radical.length > 2) radical = '';
    }
  } catch (e) {}

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
