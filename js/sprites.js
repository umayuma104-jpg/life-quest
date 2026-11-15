// ドット絵素材：文字1つ = 1ドット。'.' は透明。
(function () {
  'use strict';

  // 横に同じ色が続く部分をまとめて <rect> にする
  function svg(rows, pal, size, opts = {}) {
    const h = rows.length, w = Math.max(...rows.map(r => r.length));
    let rects = '';
    rows.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const ch = row[x];
        if (ch === '.' || ch === ' ' || !pal[ch]) { x++; continue; }
        let n = 1;
        while (row[x + n] === ch) n++;
        const fill = opts.silhouette ? '#3a3a66' : pal[ch];
        rects += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${fill}"/>`;
        x += n;
      }
    });
    const ph = size * h / w;
    const cls = opts.cls ? ` class="${opts.cls}"` : '';
    return `<svg${cls} width="${size}" height="${ph}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
  }

  // 複数レイヤーを重ねる（後のレイヤーが上）
  function layer(...grids) {
    const h = Math.max(...grids.map(g => g.length));
    const w = Math.max(...grids.flat().map(r => r.length));
    const out = Array.from({ length: h }, () => Array(w).fill('.'));
    grids.forEach(g => g.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') out[y][x] = ch; })));
    return out.map(r => r.join(''));
  }

  // ---------- ボス（12x12） ----------
  const BOSSES = [
    { name: '怠惰のスライム', pal: { g: '#3cdc6c', d: '#1f8a3e', w: '#ffffff', k: '#0b1a10', m: '#0b4a1c' }, rows: [
      '............',
      '.....gg.....',
      '....gggg....',
      '...gwgggg...',
      '..gwgggggg..',
      '..gggggggg..',
      '.ggkkggkkgg.',
      '.ggkwggkwgg.',
      '.gggggggggg.',
      'ggggmmmmgggg',
      'dggggggggggd',
      '.dddddddddd.'] },
    { name: '二度寝ゴブリン', pal: { b: '#3d5afe', w: '#ffffff', g: '#7bc043', d: '#4a7a24', k: '#111', o: '#8d5a2b', m: '#5a2a10' }, rows: [
      '.......bbw..',
      '.....bbbb...',
      '....bbbbbb..',
      '...gggggggg.',
      'gg.gkkggkkg.gg',
      '.g.gggggggg.g',
      '...ggmmmmgg.',
      '....gggggg..',
      '...oooooooo.',
      '..gooooooog.',
      '...oo....oo.',
      '...dd....dd.'] },
    { name: '夜更かしの吸血鬼', pal: { k: '#1a1030', s: '#e8e0f0', r: '#c0182c', e: '#ff3355', w: '#fff', p: '#3a1450' }, rows: [
      '....kkkk....',
      '...kkkkkk...',
      '..kksssskk..',
      '..ksessesk..',
      '..kssssssk..',
      '...swssws...',
      'rr..ssss..rr',
      'rrrpppppprrr',
      'rrrppwwpprrr',
      'rr.pppppp.rr',
      'r...pppp...r',
      '....kk.kk...'] },
    { name: 'ジャンクフード・オーク', pal: { g: '#6aa84f', d: '#38761d', k: '#111', w: '#fff', b: '#c98b3a', l: '#7ed321', r: '#e53935', y: '#ffd54f', o: '#5d4037' }, rows: [
      '...gggggg...',
      '..gggggggg..',
      '..gkggggkg..',
      '..gggddggg..',
      '..gwggggwg..',
      '...gggggg...',
      '.oooooooobb.',
      'goooooooylll',
      'goooooooorrr',
      '.oooooooobbb',
      '..oo...oo...',
      '..dd...dd...'] },
    { name: 'スマホ中毒の亡霊', pal: { w: '#eef3ff', s: '#b8c4e0', k: '#1a1a2e', p: '#222', c: '#4fe3ff' }, rows: [
      '....wwww....',
      '...wwwwww...',
      '..wwwwwwww..',
      '..wkkwwkkw..',
      '..wkkwwkkw..',
      '..wwwkkwww..',
      '.wwwwwwwwppp',
      'wwwwwwwwwpcp',
      'swwwwwwwwpcp',
      '.wwwwwwwwppp',
      '.wsww.wwsw..',
      '..s.w..s.w..'] },
    { name: '三日坊主ゴーレム', pal: { s: '#9e9e9e', d: '#616161', l: '#cfcfcf', e: '#ffca28', k: '#212121' }, rows: [
      '...dssssd...',
      '...seksek...',
      '...ssssss...',
      '...sdkkds...',
      'ddssssssssdd',
      'sslssssslsss',
      'ssdssssssdss',
      'ss.ssllss.ss',
      'dd.ssssss.dd',
      '...ssdss....',
      '..sss..sss..',
      '..ddd..ddd..'] },
    { name: 'ダラダラ蝙蝠', pal: { p: '#7a3cff', d: '#4a1fb0', r: '#ff4a4a', w: '#fff' }, rows: [
      '............',
      'p..........p',
      'pp.p....p.pp',
      'ppp.pppp.ppp',
      'pppppppppppp',
      'ddppprrppppd'.replace('rr', 'rp').replace('pppp', 'prpp'),
      '.dppppppppd.',
      '..dpwppwpd..',
      '...dppppd...',
      '....dppd....',
      '.....dd.....',
      '............'] },
    { name: '言い訳クラーケン', pal: { r: '#e5534b', d: '#a12a24', w: '#fff', k: '#111', p: '#ff9a8a' }, rows: [
      '....rrrr....',
      '...rrrrrr...',
      '..rrprrrrr..',
      '..rrrrrrrr..',
      '..rwkrrwkr..',
      '..rrrrrrrr..',
      '...rrddrr...',
      '.rr.rrrr.rr.',
      'r..rr..rr..r',
      'r.r..rr..r.r',
      '.r.r.r.r.r..',
      '..d...d...d.'] },
    { name: '先延ばしドラゴン', pal: { g: '#2e7d32', l: '#66bb6a', y: '#ffd54f', r: '#ff7043', k: '#111', w: '#fff', o: '#ff9800' }, rows: [
      '.......gg...',
      '......gggg..',
      '.l...gwkggrr',
      '.ll..gggggo.',
      '.lll.ggg....',
      '.llggggg....',
      '..gggyggg...',
      '.ggggyyggg..',
      'gg.gggyggg..',
      '...gggggggg.',
      '...gg..gg.gg',
      '...gg..gg...'] },
    { name: '惰性の魔王', pal: { k: '#1a0a24', p: '#5b2a86', d: '#2d1243', y: '#fce35a', r: '#ff2a4a', h: '#bdbdbd', c: '#8e24aa' }, rows: [
      'h..y.yy.y..h',
      'h..yyyyyy..h',
      '.h.kkkkkk.h.',
      '..kpppppppk.',
      '..kprpprpk..',
      '..kppppppk..',
      'cccpkkkkpccc',
      'ccddppppddcc',
      'ccdddyyddddc',
      'c.dddddddd.c',
      '..ddd..ddd..',
      '..kkk..kkk..'] },
  ];

  // ---------- 主人公（16x16）：レベルで装備が増える ----------
  const HERO_PAL = {
    h: '#5a3a1a', s: '#ffd2a8', e: '#111111', c: '#3d7bd9', b: '#8d5a2b', p: '#3a3a5a', k: '#5a3a1a',
    w: '#e0e0e0', g: '#c9a227', S: '#8d5a2b', E: '#fce35a', r: '#c0182c', y: '#fce35a', a: '#fce35a55',
  };
  const HERO = {
    base: [
      '................',
      '.....hhhhhh.....',
      '....hhhhhhhh....',
      '....hssssssh....',
      '....ssessess....',
      '....ssssssss....',
      '.....ssssss.....',
      '......cccc......',
      '....cccccccc....',
      '...sccccccccs...',
      '...sccbbbbccs...',
      '....cccccccc....',
      '....ccc..ccc....',
      '....ppp..ppp....',
      '....kkk..kkk....',
      '................'],
    sword: [
      '................',
      '................',
      '..............w.',
      '..............w.',
      '..............w.',
      '..............w.',
      '..............w.',
      '..............w.',
      '.............gwg',
      '..............b.',
      '.............s..',
      '................'],
    shield: [
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '.SSS............',
      'SSESS...........',
      'SEEES...........',
      'SSESS...........',
      '.SSS............'],
    cape: [
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '....rrrrrrrr....',
      '...rrrrrrrrrr...',
      '...rrrrrrrrrr...',
      '...rrrrrrrrrr...',
      '...rrrrrrrrrr...',
      '...rrrrrrrrrr...',
      '...rrr....rrr...'],
    crown: [
      '.....y.yy.y.....',
      '.....yyyyyy.....'],
    aura: [
      '..aa........aa..',
      '.a............a.',
      'a..............a',
      'a..............a',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      'a..............a',
      'a..............a',
      '.a............a.',
      '..aa........aa..'],
  };

  const EQUIP = [
    [1, 'ぬののふく'], [5, 'てつのつるぎ'], [8, 'きのたて'], [12, 'はがねのよろい'],
    [20, 'えいゆうのマント'], [30, 'おうじゃのかんむり'], [50, 'でんせつのオーラ'],
  ];
  function hero(lv, size) {
    const grids = [];
    if (lv >= 50) grids.push(HERO.aura);
    if (lv >= 20) grids.push(HERO.cape);
    grids.push(HERO.base);
    if (lv >= 5) grids.push(HERO.sword);
    if (lv >= 8) grids.push(HERO.shield);
    if (lv >= 30) grids.push(HERO.crown);
    const pal = Object.assign({}, HERO_PAL);
    if (lv >= 12) { pal.c = '#9aa7b8'; pal.b = '#5a6472'; }          // はがねのよろい
    return svg(layer(...grids), pal, size, { cls: 'hero-sprite' });
  }

  // ---------- クエスト用アイコン（8x8） ----------
  const ICONS = {
    sun: { pal: { y: '#fce35a', o: '#ff9d2e' }, rows: ['...y....', '.y.oo.y.', '..oooo..', 'yooooooy', '.oooooo.', '..oooo..', '.y.oo.y.', '....y...'] },
    dumbbell: { pal: { g: '#9aa7b8', d: '#5a6472' }, rows: ['........', 'dd....dd', 'gd....dg', 'gdggggdg', 'gdggggdg', 'gd....dg', 'dd....dd', '........'] },
    shoe: { pal: { r: '#ff4a4a', w: '#ffffff', d: '#8a1a1a' }, rows: ['........', '.rr.....', '.rrw....', '.rrrw...', '.rrrrrr.', 'rrrrrrrr', 'dddddddd', '........'] },
    drop: { pal: { b: '#5ac8ff', w: '#ffffff', d: '#1a6fa8' }, rows: ['...b....', '...bb...', '..bbbb..', '.bwbbbb.', '.bwbbbb.', '.bbbbbd.', '..bbdd..', '........'] },
    book: { pal: { r: '#c0392b', w: '#f4efe3', d: '#7a1f15' }, rows: ['........', '.rrrrrr.', '.rwwwwr.', '.rwddwr.', '.rwwwwr.', '.rwddwr.', '.rrrrrr.', '.dddddd.'] },
    lotus: { pal: { p: '#ff7ad9', l: '#ffc2ee', g: '#3cdc6c' }, rows: ['........', '...pp...', '..plp...'.replace('plp..', 'pllp.'), '.p.pp.p.', 'pplpplpp', '.pppppp.', 'gggggggg', '........'] },
    phone: { pal: { k: '#cccccc', s: '#4fe3ff', r: '#ff4a4a' }, rows: ['r.kkkk.r', '.rkssk r'.replace(' ', '.'), '.ksrrs..', '.kssrk..', '.ksssrk.', '.kkkkkr.', '.kk.kk.r', '........'] },
    broom: { pal: { b: '#8d5a2b', y: '#fce35a', d: '#c9a227' }, rows: ['......b.', '.....b..', '....b...', '...b....', '..yyy...', '.yyyyy..', 'ydydydy.', '........'] },
    moon: { pal: { y: '#fce35a', s: '#ffffff' }, rows: ['..yyy...', '.yy.....', 'yy....s.', 'yy......', 'yy......', 'yyy...y.', '.yyyyyy.', '..yyyy..'] },
    pen: { pal: { y: '#fce35a', k: '#555', w: '#ffffff', p: '#ff7ad9' }, rows: ['......pp', '.....ypp', '....yyy.', '...yyy..', '..yyy...', '.wyy....', '.kw.....', 'k.......'] },
    apple: { pal: { r: '#ff4a4a', g: '#3cdc6c', b: '#8d5a2b', w: '#ffffff' }, rows: ['....b...', '...bg...', '.rr.rr..', 'rrrrrrr.', 'rwrrrrr.', 'rrrrrrr.', '.rrrrr..', '..r.r...'] },
    star: { pal: { y: '#fce35a', o: '#ff9d2e' }, rows: ['...yy...', '...yy...', 'yyyyyyyy', '.yyyyyy.', '..yyyy..', '.yyooyy.', '.yo..oy.', '........'] },
    heart: { pal: { r: '#ff4a4a', w: '#ffffff' }, rows: ['........', '.rr.rr..', 'rwrrrrr.', 'rrrrrrr.', '.rrrrr..', '..rrr...', '...r....', '........'] },
    plank: { pal: { s: '#ffd2a8', c: '#3d7bd9', k: '#5a6472' }, rows: ['........', '........', 's.......', 'sccccccc'.replace('cccccccc', 'ccccccc'), '.kccccck'.replace('kccccck', 'cccccck'), 's.......'.replace('s', 's'), 'kkkkkkkk', '........'] },
  };
  const ICON_KEYS = Object.keys(ICONS);
  function icon(key, size = 28) {
    const ic = ICONS[key];
    if (!ic) return null;
    return svg(ic.rows, ic.pal, size, { cls: 'px-icon' });
  }
  function boss(i, size, silhouette) {
    const b = BOSSES[i % BOSSES.length];
    return svg(b.rows, b.pal, size, { cls: 'boss-sprite', silhouette });
  }

  window.Sprites = { svg, layer, hero, icon, boss, BOSSES, ICONS, ICON_KEYS, EQUIP };
})();
