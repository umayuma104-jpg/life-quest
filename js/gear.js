// 装備・アイテム・ガチャのデータ
(function () {
  'use strict';
  const SLOTS = {
    head: { name: '頭', kind: '攻撃' },
    chest: { name: '体', kind: '守り' },
    legs: { name: '脚', kind: '守り' },
    feet: { name: '足', kind: '攻撃' },
    sword: { name: '武器', kind: '攻撃' },
    shield: { name: 'サブ', kind: '守り' },
  };

  // ---------- 装備 ----------
  // 効果: atk=ボスへのダメージ+% / hp=最大HP+ / def=被ダメージ−% / crit=会心率+% / exp=EXP+% / gold=ゴールド+%
  //       burn=火傷（毎日ボスの最大HPの%を削る） / poison=毒（1段階ごとに最大HPの%。日ごとに1段階たまる）
  //       freezeOnBoss=ボスを倒すと❄を獲得 / guard=週に1度、未達成のダメージを無効
  const LIST = [];
  const add = (slot, tier, name, price, fx, extra) => LIST.push(Object.assign({ id: slot + tier, slot, tier: String(tier), art: String(tier), name, price, fx }, extra || {}));
  // ショップの装備（初期装備＋3段階）
  [['head', ['布のバンダナ', '革の帽子', '鉄の兜', '騎士の兜'], [{}, { atk: 5 }, { atk: 10 }, { atk: 15 }]],
   ['chest', ['布の服', '革の鎧', '鉄の鎧', '騎士の鎧'], [{}, { hp: 10 }, { hp: 20 }, { hp: 30, def: 5 }]],
   ['legs', ['布のズボン', '革のレギンス', '鉄のレギンス', '騎士のレギンス'], [{}, { hp: 5, def: 5 }, { hp: 10, def: 5 }, { hp: 15, def: 10 }]],
   ['feet', ['布の靴', '革のブーツ', '鉄のブーツ', '騎士のブーツ'], [{}, { atk: 5 }, { atk: 10 }, { atk: 15 }]],
   ['sword', ['木の剣', '銅の剣', '鉄の剣', '騎士の剣'], [{}, { atk: 10 }, { atk: 20 }, { atk: 30 }]],
   ['shield', ['木の盾', '革の盾', '鉄の盾', '騎士の盾'], [{}, { def: 10 }, { def: 15 }, { def: 20 }]],
  ].forEach(([slot, names, fxs]) => names.forEach((n, i) => add(slot, i, n, slot === 'sword' ? [0, 200, 500, 1000][i] : [0, 150, 400, 800][i], fxs[i])));

  // ガチャ限定のセット装備
  const SETS = {
    fire: { name: '炎の魔導士', color: '#ff7a3a',
      bonus3: { exp: 10 }, bonus6: { burnX2: true }, text3: 'EXP+10%', text6: '火傷ダメージ2倍・炎のオーラ' },
    dark: { name: '毒牙の暗殺者', color: '#b07af0',
      bonus3: { gold: 20 }, bonus6: { poisonX2: true, crit: 10 }, text3: 'ゴールド+20%', text6: '毒ダメージ2倍・会心率+10%・闇のオーラ' },
    ice: { name: '氷竜の騎士', color: '#4fe3ff',
      bonus3: { hp: 20 }, bonus6: { guard: 1 }, text3: '最大HP+20', text6: '週に1度、未達成のダメージを無効・氷のオーラ' },
  };
  const gacha = (set, slot, rarity, name, fx, desc) => LIST.push({ id: set + '_' + slot, slot, tier: set, art: set, set, rarity, name, price: 0, gacha: true, fx, desc });
  gacha('fire', 'sword', 5, '炎の杖', { atk: 25, burn: 4 }, '先端の宝玉が燃え続ける杖。攻撃した相手に火傷を負わせる');
  gacha('fire', 'shield', 4, '炎の魔導書', { atk: 5, burn: 2 }, '宙に浮かぶ魔導書。火傷の炎をさらに強める');
  gacha('fire', 'head', 4, '炎の三角帽', { atk: 15, exp: 5 }, '炎の魔導士が代々受け継ぐ帽子');
  gacha('fire', 'chest', 4, '紅蓮のローブ', { hp: 25, def: 5 }, '炎を編み込んだ深紅のローブ');
  gacha('fire', 'legs', 4, '炎のタイツ', { hp: 15, def: 10 }, '熱に強い布で織られたタイツ');
  gacha('fire', 'feet', 4, '炎の靴', { atk: 15 }, '歩くたびに火の粉が舞う靴');
  gacha('dark', 'sword', 5, '毒牙の短剣', { atk: 20, poison: 2, crit: 10 }, '刃から毒がしたたる短剣。毒は日を追うごとに回る');
  gacha('dark', 'shield', 4, '暗器の手甲', { atk: 10, crit: 10 }, '隠し爪の付いた手甲。急所を狙いやすくなる');
  gacha('dark', 'head', 4, '影のフード', { atk: 15, gold: 10 }, '顔を隠す覆面付きのフード');
  gacha('dark', 'chest', 4, '影の装束', { hp: 20, def: 10 }, '闇に溶け込む軽い装束');
  gacha('dark', 'legs', 4, '影のレギンス', { hp: 15, def: 10 }, '音を立てない布で巻かれたレギンス');
  gacha('dark', 'feet', 4, '忍び足のブーツ', { atk: 15 }, '足音を消すブーツ');
  gacha('ice', 'sword', 5, '氷竜の斧', { atk: 25, freezeOnBoss: 1 }, '氷竜の牙から削り出した斧。ボスを倒すと氷のお守りが手に入る');
  gacha('ice', 'shield', 4, '氷竜の大盾', { hp: 10, def: 25 }, '氷竜の鱗を張った大盾');
  gacha('ice', 'head', 4, '氷竜の兜', { atk: 15, hp: 10 }, '氷竜の角を模した兜');
  gacha('ice', 'chest', 4, '氷竜の鎧', { hp: 35, def: 5 }, '氷の鱗で覆われた鎧');
  gacha('ice', 'legs', 4, '氷竜の脚甲', { hp: 20, def: 10 }, '冷気をまとう脚甲');
  gacha('ice', 'feet', 4, '氷竜の具足', { atk: 15 }, '氷の上でも滑らない具足');

  const get = id => LIST.find(x => x.id === id);
  const STARTER = { head: 'head0', chest: 'chest0', legs: 'legs0', feet: 'feet0', sword: 'sword0', shield: 'shield0' };

  // 装備一式の合計効果（セット効果を含む）
  function stats(gear) {
    const s = { hp: 0, def: 0, atk: 0, crit: 0, exp: 0, gold: 0, burn: 0, poison: 0, freezeOnBoss: 0, guard: 0, sets: {}, aura: null };
    Object.values(gear).forEach(id => {
      const x = get(id); if (!x) return;
      Object.entries(x.fx).forEach(([k, v]) => { s[k] = (s[k] || 0) + v; });
      if (x.set) s.sets[x.set] = (s.sets[x.set] || 0) + 1;
    });
    Object.entries(s.sets).forEach(([k, n]) => {
      const set = SETS[k];
      if (n >= 3) Object.entries(set.bonus3).forEach(([a, v]) => { s[a] = (s[a] || 0) + v; });
      if (n >= 6) {
        Object.entries(set.bonus6).forEach(([a, v]) => { if (typeof v === 'number') s[a] = (s[a] || 0) + v; });
        if (set.bonus6.burnX2) s.burn *= 2;
        if (set.bonus6.poisonX2) s.poison *= 2;
        s.aura = k;
      }
    });
    s.def = Math.min(60, s.def);
    return s;
  }
  function fxText(x) {
    const f = x.fx || {}, t = [];
    if (f.atk) t.push(`攻撃+${f.atk}%`);
    if (f.hp) t.push(`最大HP+${f.hp}`);
    if (f.def) t.push(`被ダメージ−${f.def}%`);
    if (f.crit) t.push(`会心率+${f.crit}%`);
    if (f.exp) t.push(`EXP+${f.exp}%`);
    if (f.gold) t.push(`ゴールド+${f.gold}%`);
    if (f.burn) t.push(`🔥火傷 毎日${f.burn}%`);
    if (f.poison) t.push(`☠毒 1段階${f.poison}%`);
    if (f.freezeOnBoss) t.push(`ボス討伐で❄+${f.freezeOnBoss}`);
    return t.join('・') || '効果なし';
  }

  // ---------- 使うアイテム ----------
  const ITEMS = {
    potion: { name: '回復薬', icon: 'potion', price: 100, desc: 'HPを30回復する' },
    bomb: { name: '爆弾', icon: 'bomb', price: 200, desc: '今週のボスに最大HPの20%のダメージ' },
    xpbook: { name: '経験の書', icon: 'xpbook', price: 300, desc: '今日獲得するEXPが1.5倍になる（1日1回）' },
    charm: { name: '氷のお守り', icon: 'charm', price: 400, desc: '❄を1個追加する' },
  };

  // ---------- ガチャ ----------
  const GACHA = {
    cost1: 50, cost10: 450, pity: 80,
    rates: { 5: 3, 4: 17, 3: 80 },
    // ★3の中身（重み）
    r3: [['item', 'potion', 30], ['item', 'bomb', 20], ['item', 'xpbook', 15], ['item', 'charm', 10], ['gold', 300, 25]],
    dupGems: { 5: 50, 4: 15 },
  };
  const gachaGear = r => LIST.filter(x => x.gacha && x.rarity === r);

  window.Gear = { SLOTS, LIST, SETS, get, STARTER, stats, fxText, ITEMS, GACHA, gachaGear };
})();
