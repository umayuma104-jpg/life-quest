// 季節イベント：スマホの日付を見て、期間中だけ自動で開催される
(function () {
  'use strict';
  // 限定ボス（12x12）
  const BOSS_ART = {
    lion: { pal: { y: '#f2c14e', r: '#d23a3a', w: '#ffffff', k: '#1a1020', g: '#3a9a5a' }, rows: [
      '.yy.yyyy.yy.',
      'yrryrrrryrry',
      'yrrrrrrrrrry',
      'rrwkrrrrwkrr',
      'rrwwrrrrwwrr',
      'rrrrryyrrrrr',
      'rwwwwwwwwwwr',
      'rkkkkkkkkkkr',
      'rwwwwwwwwwwr',
      '.rrrrrrrrrr.',
      '.gggggggggg.',
      '.g.g.g.g.g..'] },
    choco: { pal: { c: '#3a2010', d: '#6a3a1a', w: '#ffffff', k: '#1a1020', m: '#2a1008', p: '#ff7ab0', P: '#ffc0d8' }, rows: [
      '...cccccc...',
      '..cddddddc..',
      '..dwkddwkd..',
      '..dddddddd..',
      '..ddmmmmdd..',
      'cccddddddccc',
      'dddpPdpPdddd',
      'dd.ppppp.dd.',
      'dd..ppp..dd.',
      '....ddd.....',
      '...dd.dd....',
      '..ccc.ccc...'] },
    worm: { pal: { o: '#d98a3a', w: '#ffffff', k: '#1a1020', r: '#a12a24', y: '#ffd54f', s: '#e8c070', S: '#c9a050' }, rows: [
      '....oooo....',
      '...owwwwo...',
      '..owkwwkwo..',
      '..oorrrroo..',
      '..owwwwwwo..',
      '...oooooo...',
      '....oooo....',
      '...ooyyoo...',
      '..oooyyooo..',
      '.oooyyyyooo.',
      'ssssssssssss',
      'sSsSsSsSsSsS'] },
    pumpking: { pal: { o: '#ff8a1a', d: '#c05a10', y: '#f2c14e', g: '#3a8a3a', k: '#1a1020', Y: '#ffef5a' }, rows: [
      '...y.y.y....',
      '...yyyyy....',
      '.....g......',
      '..odoooodo..',
      '.ooooooooooo',
      '.okYkookYkoo',
      '.oooooooooo.',
      '.okokokokoo.',
      '.ookkkkkkoo.',
      '..odoooodo..',
      '...oooooo...',
      '............'] },
    snowman: { pal: { w: '#f4f8ff', s: '#c8d8f0', k: '#1a1020', o: '#ff8a1a', r: '#d23a3a', y: '#f2c14e' }, rows: [
      '....y.y.y...',
      '....yyyyy...',
      '...wwwwwww..',
      '..wwkwwwkww.',
      '..wwwwowwww.',
      '..wwkkkkkww.',
      '...wwwwwww..',
      '..rrrrrrrrr.',
      '.wwwwwwwrrw.',
      'wwwwwkwwwwws',
      'wwwwwkwwwwws',
      '.sssssssss..'] },
  };
  // 限定ペット（12x12）
  const PET_ART = {
    pumpkin: { pal: { o: '#ff8a1a', g: '#3a8a3a', k: '#1a1020', w: '#f4f8ff', s: '#c8d8f0' }, rows: [
      '.....g......',
      '....gg......',
      '..oooooooo..',
      '.oooooooooo.',
      '.ookkookkoo.',
      '.oooooooooo.',
      '.okoookooko.',
      '..oooooooo..',
      '...wwwwww...',
      '..wwwwwwww..',
      '..wswwwwsw..',
      '..w.ww.ww.w.'] },
  };
  // 限定のペット装備（首飾りは8行目、帽子は0〜2行目）
  const GEAR_ART = {
    neck_bell: { pal: { y: '#f2c14e', k: '#8a5a10', r: '#d23a3a' }, row: '...rrykyrr..' },
    neck_heart: { pal: { p: '#ff7ab0', P: '#ffc0d8', w: '#ffffff' }, row: '...wwpPpww..' },
    hat_straw: { pal: { y: '#f2d27a', r: '#d23a3a' }, rows: ['............', '....yyyy....', '..yyrrrryy..'] },
    hat_santa: { pal: { r: '#d23a3a', w: '#ffffff' }, rows: ['.......w....', '.....rrr....', '...wwwwww...'] },
  };

  // [キー, 名前, 開始(月,日), 終了(月,日), 限定ボス, 特典, 限定品]
  const LIST = [
    { key: 'newyear', name: '正月', icon: '🎍', from: [1, 1], to: [1, 7], boss: { art: 'lion', name: '怠け獅子' },
      perk: { goldPct: 50 }, perkText: 'ゴールド+50%', reward: { type: 'petgear', id: 'neck_bell' }, color: '#f2c14e',
      intro: 'あけましておめでとう！ 怠け獅子が新年の誓いを邪魔しにきた。' },
    { key: 'valentine', name: 'バレンタイン', icon: '💝', from: [2, 7], to: [2, 14], boss: { art: 'choco', name: 'チョコゴーレム' },
      perk: { petExpX: 2 }, perkText: 'ペットの経験値2倍', reward: { type: 'petgear', id: 'neck_heart' }, food: 'choco', color: '#ff7ab0',
      intro: '甘い誘惑の季節。チョコゴーレムを倒してハートの首飾りを手に入れよう。' },
    { key: 'summer', name: '夏休み', icon: '🌻', from: [7, 20], to: [8, 31], boss: { art: 'worm', name: '灼熱のサンドワーム' },
      perk: { wakeX: 2 }, perkText: '早起きのEXP2倍', reward: { type: 'petgear', id: 'hat_straw' }, color: '#ffd54f',
      intro: '夏休みこそ生活リズムが勝負。早起きして灼熱のサンドワームに挑め！' },
    { key: 'halloween', name: 'ハロウィン', icon: '🎃', from: [10, 24], to: [10, 31], boss: { art: 'pumpking', name: 'かぼちゃ大王' },
      perk: { crit: 10 }, perkText: '会心率+10%', reward: { type: 'pet', id: 'pumpkin' }, color: '#ff8a1a',
      intro: 'かぼちゃ大王が現れた！ 倒すと「かぼちゃおばけ」が仲間になる。' },
    { key: 'xmas', name: 'クリスマス', icon: '🎄', from: [12, 18], to: [12, 25], boss: { art: 'snowman', name: '雪だるまキング' },
      perk: { dailyGold: 100 }, perkText: '記録した日は毎日100Gのプレゼント', reward: { type: 'petgear', id: 'hat_santa' }, color: '#d23a3a',
      intro: 'メリークリスマス！ 毎日記録するとプレゼントが届く。' },
  ];
  const pad = n => String(n).padStart(2, '0');
  // その日に開催中のイベント（なければ null）。年ごとに別の回として扱う
  function on(k) {
    const md = k.slice(5);
    const ev = LIST.find(e => md >= `${pad(e.from[0])}-${pad(e.from[1])}` && md <= `${pad(e.to[0])}-${pad(e.to[1])}`);
    if (!ev) return null;
    const y = k.slice(0, 4);
    return Object.assign({ id: `${ev.key}-${y}`, start: `${y}-${pad(ev.from[0])}-${pad(ev.from[1])}`, end: `${y}-${pad(ev.to[0])}-${pad(ev.to[1])}` }, ev);
  }
  // 次に始まるイベント
  function next(k) {
    const y = Number(k.slice(0, 4)), md = k.slice(5);
    const cands = LIST.map(e => ({ e, s: `${pad(e.from[0])}-${pad(e.from[1])}` }));
    const c = cands.find(x => x.s > md) || cands[0];
    return { ev: c.e, start: `${c.s > md ? y : y + 1}-${c.s}` };
  }
  function rects(rows, pal, y0) {
    let r = '';
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) r += '<rect x="' + x + '" y="' + (y + (y0 || 0)) + '" width="1" height="1" fill="' + pal[ch] + '"/>'; }));
    return r;
  }
  function bossSvg(art, size, opts) {
    const a = BOSS_ART[art];
    return '<svg class="boss-sprite" width="' + size + '" height="' + size + '" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">' + rects(a.rows, opts && opts.silhouette ? Object.fromEntries(Object.keys(a.pal).map(k => [k, '#3a3a66'])) : a.pal) + '</svg>';
  }
  // 限定のペット・ペット装備・餌を、ペットのデータに追加する（limited: 通常のガチャやショップには出ない）
  const P = window.Pets, S = window.Sprites;
  P.ART.pumpkin = PET_ART.pumpkin;
  P.PETS.pumpkin = { name: 'かぼちゃおばけ', rarity: 4, type: '攻撃', limited: 'ハロウィン', desc: 'ハロウィン限定。いたずら好きで、急所をよく狙う', base: { follow: 10, crit: 5 }, grow: { follow: 0.8, crit: 0.1 } };
  Object.assign(P.GEAR_ART, GEAR_ART);
  P.GEAR.neck_bell = { slot: 'neck', name: '金の鈴', fx: { gold: 15 }, limited: '正月' };
  P.GEAR.neck_heart = { slot: 'neck', name: 'ハートの首飾り', fx: { regen: 5 }, limited: 'バレンタイン' };
  P.GEAR.hat_straw = { slot: 'hat', name: '麦わら帽子', fx: { exp: 8 }, limited: '夏休み' };
  P.GEAR.hat_santa = { slot: 'hat', name: 'サンタ帽', fx: { gold: 15 }, limited: 'クリスマス' };
  P.FOODS.choco = { name: 'チョコ', exp: 300, price: 500, icon: 'choco', limited: 'valentine' };
  S.ICONS.choco = { pal: { c: '#5a2a10', d: '#7a3a1a', p: '#ff7ab0' }, rows: ['........', '.cccccc.', '.cdcdcd.', '.cdppdc.', '.cpppdc.', '.cdpdcd.', '.cccccc.', '........'] };

  window.Events = { LIST, on, next, bossSvg, BOSS_ART, PET_ART, GEAR_ART };
})();
