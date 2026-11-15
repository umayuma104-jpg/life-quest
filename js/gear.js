// 装備の一覧
// 攻撃系（兜・ブーツ・剣）: atk = ボスに与えるダメージ +%
// 守り系（鎧・レギンス・盾）: hp = 最大HP +、def = 受けるダメージ −%
(function () {
  'use strict';
  const SLOTS = {
    head: { name: '兜', kind: '攻撃' },
    chest: { name: '鎧', kind: '守り' },
    legs: { name: 'レギンス', kind: '守り' },
    feet: { name: 'ブーツ', kind: '攻撃' },
    sword: { name: '剣', kind: '攻撃' },
    shield: { name: '盾', kind: '守り' },
  };
  // [部位, 段階, 名前, 値段, 効果]
  const LIST = [
    ['head', 0, '布のバンダナ', 0, {}], ['head', 1, '革の帽子', 150, { atk: 5 }], ['head', 2, '鉄の兜', 400, { atk: 10 }], ['head', 3, '騎士の兜', 800, { atk: 15 }],
    ['chest', 0, '布の服', 0, {}], ['chest', 1, '革の鎧', 150, { hp: 10 }], ['chest', 2, '鉄の鎧', 400, { hp: 20 }], ['chest', 3, '騎士の鎧', 800, { hp: 30, def: 5 }],
    ['legs', 0, '布のズボン', 0, {}], ['legs', 1, '革のレギンス', 150, { hp: 5, def: 5 }], ['legs', 2, '鉄のレギンス', 400, { hp: 10, def: 5 }], ['legs', 3, '騎士のレギンス', 800, { hp: 15, def: 10 }],
    ['feet', 0, '布の靴', 0, {}], ['feet', 1, '革のブーツ', 150, { atk: 5 }], ['feet', 2, '鉄のブーツ', 400, { atk: 10 }], ['feet', 3, '騎士のブーツ', 800, { atk: 15 }],
    ['sword', 0, '木の剣', 0, {}], ['sword', 1, '銅の剣', 200, { atk: 10 }], ['sword', 2, '鉄の剣', 500, { atk: 20 }], ['sword', 3, '騎士の剣', 1000, { atk: 30 }],
    ['shield', 0, '木の盾', 0, {}], ['shield', 1, '革の盾', 150, { def: 10 }], ['shield', 2, '鉄の盾', 400, { def: 15 }], ['shield', 3, '騎士の盾', 800, { def: 20 }],
  ].map(([slot, tier, name, price, fx]) => ({ id: slot + tier, slot, tier, name, price, hp: fx.hp || 0, def: fx.def || 0, atk: fx.atk || 0 }));

  const get = id => LIST.find(x => x.id === id);
  const STARTER = { head: 'head0', chest: 'chest0', legs: 'legs0', feet: 'feet0', sword: 'sword0', shield: 'shield0' };
  // 装備一式の合計効果
  function stats(gear) {
    const s = { hp: 0, def: 0, atk: 0 };
    Object.values(gear).forEach(id => { const x = get(id); if (x) { s.hp += x.hp; s.def += x.def; s.atk += x.atk; } });
    s.def = Math.min(50, s.def);
    return s;
  }
  function fxText(x) {
    const t = [];
    if (x.atk) t.push(`攻撃+${x.atk}%`);
    if (x.hp) t.push(`最大HP+${x.hp}`);
    if (x.def) t.push(`被ダメージ−${x.def}%`);
    return t.join('・') || '効果なし';
  }
  window.Gear = { SLOTS, LIST, get, STARTER, stats, fxText };
})();
