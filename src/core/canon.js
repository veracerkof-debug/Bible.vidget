// Канон: 66 книг в обычном (протестантском) порядке, коды eBible.org — как в Melete (src/core/bible.js).
// Названия — на трёх языках интерфейса. Число глав — по KJV/WEB; в тексте перевода берётся фактическое.
// [код, глав, ru, ru-сокр., en, en-сокр., id, id-сокр.]
const RAW = [
  ['GEN', 50, 'Бытие', 'Быт', 'Genesis', 'Gen', 'Kejadian', 'Kej'], ['EXO', 40, 'Исход', 'Исх', 'Exodus', 'Exo', 'Keluaran', 'Kel'],
  ['LEV', 27, 'Левит', 'Лев', 'Leviticus', 'Lev', 'Imamat', 'Ima'], ['NUM', 36, 'Числа', 'Чис', 'Numbers', 'Num', 'Bilangan', 'Bil'],
  ['DEU', 34, 'Второзаконие', 'Втор', 'Deuteronomy', 'Deu', 'Ulangan', 'Ula'], ['JOS', 24, 'Иисус Навин', 'Нав', 'Joshua', 'Jos', 'Yosua', 'Yos'],
  ['JDG', 21, 'Судьи', 'Суд', 'Judges', 'Jdg', 'Hakim-hakim', 'Hak'], ['RUT', 4, 'Руфь', 'Руф', 'Ruth', 'Rut', 'Rut', 'Rut'],
  ['1SA', 31, '1 Царств', '1Цар', '1 Samuel', '1Sa', '1 Samuel', '1Sam'], ['2SA', 24, '2 Царств', '2Цар', '2 Samuel', '2Sa', '2 Samuel', '2Sam'],
  ['1KI', 22, '3 Царств', '3Цар', '1 Kings', '1Ki', '1 Raja-raja', '1Raj'], ['2KI', 25, '4 Царств', '4Цар', '2 Kings', '2Ki', '2 Raja-raja', '2Raj'],
  ['1CH', 29, '1 Паралипоменон', '1Пар', '1 Chronicles', '1Ch', '1 Tawarikh', '1Taw'], ['2CH', 36, '2 Паралипоменон', '2Пар', '2 Chronicles', '2Ch', '2 Tawarikh', '2Taw'],
  ['EZR', 10, 'Ездра', 'Езд', 'Ezra', 'Ezr', 'Ezra', 'Ezr'], ['NEH', 13, 'Неемия', 'Неем', 'Nehemiah', 'Neh', 'Nehemia', 'Neh'],
  ['EST', 10, 'Есфирь', 'Есф', 'Esther', 'Est', 'Ester', 'Est'], ['JOB', 42, 'Иов', 'Иов', 'Job', 'Job', 'Ayub', 'Ayb'],
  ['PSA', 150, 'Псалтирь', 'Пс', 'Psalms', 'Psa', 'Mazmur', 'Mzm'], ['PRO', 31, 'Притчи', 'Притч', 'Proverbs', 'Pro', 'Amsal', 'Ams'],
  ['ECC', 12, 'Екклесиаст', 'Еккл', 'Ecclesiastes', 'Ecc', 'Pengkhotbah', 'Pkh'], ['SOL', 8, 'Песнь песней', 'Песн', 'Song of Songs', 'Son', 'Kidung Agung', 'Kid'],
  ['ISA', 66, 'Исаия', 'Ис', 'Isaiah', 'Isa', 'Yesaya', 'Yes'], ['JER', 52, 'Иеремия', 'Иер', 'Jeremiah', 'Jer', 'Yeremia', 'Yer'],
  ['LAM', 5, 'Плач Иеремии', 'Плач', 'Lamentations', 'Lam', 'Ratapan', 'Rat'], ['EZE', 48, 'Иезекииль', 'Иез', 'Ezekiel', 'Eze', 'Yehezkiel', 'Yeh'],
  ['DAN', 12, 'Даниил', 'Дан', 'Daniel', 'Dan', 'Daniel', 'Dan'], ['HOS', 14, 'Осия', 'Ос', 'Hosea', 'Hos', 'Hosea', 'Hos'],
  ['JOE', 3, 'Иоиль', 'Иоил', 'Joel', 'Joe', 'Yoel', 'Yoe'], ['AMO', 9, 'Амос', 'Ам', 'Amos', 'Amo', 'Amos', 'Am'],
  ['OBA', 1, 'Авдий', 'Авд', 'Obadiah', 'Oba', 'Obaja', 'Oba'], ['JON', 4, 'Иона', 'Ион', 'Jonah', 'Jon', 'Yunus', 'Yun'],
  ['MIC', 7, 'Михей', 'Мих', 'Micah', 'Mic', 'Mikha', 'Mik'], ['NAH', 3, 'Наум', 'Наум', 'Nahum', 'Nah', 'Nahum', 'Nah'],
  ['HAB', 3, 'Аввакум', 'Авв', 'Habakkuk', 'Hab', 'Habakuk', 'Hab'], ['ZEP', 3, 'Софония', 'Соф', 'Zephaniah', 'Zep', 'Zefanya', 'Zef'],
  ['HAG', 2, 'Аггей', 'Агг', 'Haggai', 'Hag', 'Hagai', 'Hag'], ['ZEC', 14, 'Захария', 'Зах', 'Zechariah', 'Zec', 'Zakharia', 'Zak'],
  ['MAL', 4, 'Малахия', 'Мал', 'Malachi', 'Mal', 'Maleakhi', 'Mal'],
  ['MAT', 28, 'От Матфея', 'Мф', 'Matthew', 'Mat', 'Matius', 'Mat'], ['MAR', 16, 'От Марка', 'Мк', 'Mark', 'Mar', 'Markus', 'Mrk'],
  ['LUK', 24, 'От Луки', 'Лк', 'Luke', 'Luk', 'Lukas', 'Luk'], ['JOH', 21, 'От Иоанна', 'Ин', 'John', 'Joh', 'Yohanes', 'Yoh'],
  ['ACT', 28, 'Деяния', 'Деян', 'Acts', 'Act', 'Kisah Para Rasul', 'Kis'], ['ROM', 16, 'Римлянам', 'Рим', 'Romans', 'Rom', 'Roma', 'Rm'],
  ['1CO', 16, '1 Коринфянам', '1Кор', '1 Corinthians', '1Co', '1 Korintus', '1Kor'], ['2CO', 13, '2 Коринфянам', '2Кор', '2 Corinthians', '2Co', '2 Korintus', '2Kor'],
  ['GAL', 6, 'Галатам', 'Гал', 'Galatians', 'Gal', 'Galatia', 'Gal'], ['EPH', 6, 'Ефесянам', 'Еф', 'Ephesians', 'Eph', 'Efesus', 'Ef'],
  ['PHI', 4, 'Филиппийцам', 'Флп', 'Philippians', 'Php', 'Filipi', 'Flp'], ['COL', 4, 'Колоссянам', 'Кол', 'Colossians', 'Col', 'Kolose', 'Kol'],
  ['1TH', 5, '1 Фессалоникийцам', '1Фес', '1 Thessalonians', '1Th', '1 Tesalonika', '1Tes'], ['2TH', 3, '2 Фессалоникийцам', '2Фес', '2 Thessalonians', '2Th', '2 Tesalonika', '2Tes'],
  ['1TI', 6, '1 Тимофею', '1Тим', '1 Timothy', '1Ti', '1 Timotius', '1Tim'], ['2TI', 4, '2 Тимофею', '2Тим', '2 Timothy', '2Ti', '2 Timotius', '2Tim'],
  ['TIT', 3, 'Титу', 'Тит', 'Titus', 'Tit', 'Titus', 'Tit'], ['PHM', 1, 'Филимону', 'Флм', 'Philemon', 'Phm', 'Filemon', 'Flm'],
  ['HEB', 13, 'Евреям', 'Евр', 'Hebrews', 'Heb', 'Ibrani', 'Ibr'], ['JAM', 5, 'Иакова', 'Иак', 'James', 'Jas', 'Yakobus', 'Yak'],
  ['1PE', 5, '1 Петра', '1Пет', '1 Peter', '1Pe', '1 Petrus', '1Ptr'], ['2PE', 3, '2 Петра', '2Пет', '2 Peter', '2Pe', '2 Petrus', '2Ptr'],
  ['1JO', 5, '1 Иоанна', '1Ин', '1 John', '1Jn', '1 Yohanes', '1Yoh'], ['2JO', 1, '2 Иоанна', '2Ин', '2 John', '2Jn', '2 Yohanes', '2Yoh'],
  ['3JO', 1, '3 Иоанна', '3Ин', '3 John', '3Jn', '3 Yohanes', '3Yoh'], ['JUD', 1, 'Иуды', 'Иуд', 'Jude', 'Jud', 'Yudas', 'Yud'],
  ['REV', 22, 'Откровение', 'Откр', 'Revelation', 'Rev', 'Wahyu', 'Why'],
];
const LANGS = ['ru', 'en', 'id'];
export const BOOKS = RAW.map(([code, chapters, ...n], i) => ({
  code, chapters, i, nt: i >= 39,
  name: { ru: n[0], en: n[2], id: n[4] }, abbr: { ru: n[1], en: n[3], id: n[5] },
}));
export const bookOf = (code) => BOOKS.find((b) => b.code === code) || null;
export const bookName = (code, lang = 'en', short = false) => {
  const b = bookOf(code); if (!b) return code;
  return (short ? b.abbr : b.name)[LANGS.includes(lang) ? lang : 'en'];
};
export const TOTAL_CHAPTERS = BOOKS.reduce((n, b) => n + b.chapters, 0); // 1189

// Переводы: тексты лежат в public/bible/<id>/<КОД>.json (массив глав → массив стихов), см. tools/import-bible.mjs
export const TRANSLATIONS = [
  { id: 'rst', lang: 'ru', name: 'Синодальный', full: 'Синодальный перевод (1876)', license: 'public domain' },
  { id: 'kjv', lang: 'en', name: 'KJV', full: 'King James Version', license: 'public domain' },
  { id: 'web', lang: 'en', name: 'WEB', full: 'World English Bible', license: 'public domain' },
  { id: 'ayt', lang: 'id', name: 'AYT', full: 'Alkitab Yang Terbuka', license: '© YLSA-AYT, бесплатное некоммерческое использование' },
];
export const translationsFor = (lang) => TRANSLATIONS.filter((t) => t.lang === lang);
export const defaultTranslation = (lang) => (translationsFor(lang)[0] || TRANSLATIONS[1]).id;

// ключ главы: «JOH.3»
export const chKey = (code, ch) => code + '.' + ch;
export const parseKey = (k) => { const [code, c] = String(k).split('.'); return { code, ch: +c }; };

// Ссылка прохода: { b:'JOH', c:3, v1?:16, v2?:18, c2?:5 } → «Ин 3:16–18», «Ин 3–5»
export function refLabel(ref, lang = 'en', short = true) {
  if (!ref || !ref.b) return '';
  const name = bookName(ref.b, lang, short);
  const { c, c2, v1, v2 } = ref;
  if (c2 && c2 !== c) return `${name} ${c}–${c2}`;
  if (v1) return `${name} ${c}:${v1}${v2 && v2 !== v1 ? '–' + v2 : ''}`;
  return `${name} ${c}`;
}
// главы, которые покрывает проход: ['JOH.3', 'JOH.4']
export function refChapters(ref) {
  if (!ref || !ref.b) return [];
  const to = ref.c2 && ref.c2 > ref.c ? ref.c2 : ref.c;
  const out = [];
  for (let k = ref.c; k <= to; k++) out.push(chKey(ref.b, k));
  return out;
}

// Номера стихов: «16–18, 20»
export function versesLabel(vs) {
  vs = [...new Set(vs)].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < vs.length;) {
    let j = i; while (j + 1 < vs.length && vs[j + 1] === vs[j] + 1) j++;
    out.push(vs[i] + (j > i ? '–' + vs[j] : '')); i = j + 1;
  }
  return out.join(', ');
}
