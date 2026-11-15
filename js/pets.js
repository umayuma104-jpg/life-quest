// ペットのデータとドット絵
(function () {
  'use strict';
  // ---------- ペット ----------
  // follow=追撃（主人公のボスへのダメージの%を追加） / exp・gold=獲得+% / crit=会心率+% / def=被ダメージ−% / hp=最大HP+
  // regen=毎日HP回復 / burn=火傷（ボス最大HPの%） / revive=週に1度、HP0を1で踏みとどまる
  // base は Lv1 の値、grow は1レベルごとに増える値
  const PETS = {
    slime: { name: 'ぷちスライム', rarity: 3, type: '攻撃', desc: '最初の相棒。小さな体で精いっぱい体当たりする', base: { follow: 5, hp: 5 }, grow: { follow: 0.5, hp: 0.5 } },
    wolf: { name: '白狼', rarity: 4, type: '攻撃', desc: '主人公の攻撃に合わせて鋭く噛みつく', base: { follow: 12 }, grow: { follow: 1 } },
    cat: { name: '黒猫', rarity: 4, type: '支援', desc: '金目の物をかぎ分ける。急所も見抜く', base: { gold: 10, crit: 3 }, grow: { gold: 0.5, crit: 0.1 } },
    fairy: { name: '森の妖精', rarity: 4, type: '支援', desc: '経験を導き、毎日少しずつ傷を癒やす', base: { exp: 8, regen: 3 }, grow: { exp: 0.4, regen: 0.1 } },
    golem: { name: 'ゴーレムの子', rarity: 4, type: '守り', desc: '岩の体で攻撃を受け止める', base: { def: 10, hp: 10 }, grow: { def: 0.5, hp: 1 } },
    dragon: { name: '竜の子', rarity: 5, type: '攻撃', desc: '小さくても竜。炎の追撃でボスを焼く', base: { follow: 20, burn: 1 }, grow: { follow: 1.5, burn: 0.05 } },
    phoenix: { name: '不死鳥の雛', rarity: 5, type: '支援', desc: '週に1度、倒れそうな主人公をよみがえらせる', base: { exp: 10, regen: 5, revive: 1 }, grow: { exp: 0.5, regen: 0.2 } },
  };
  const ART = {"slime":{"pal":{"b":"#4fa0ff","d":"#2a6ad0","w":"#ffffff","k":"#1a1020","m":"#1a3a8a"},"rows":["............","............",".....bb.....","....bbbb....","...bwbbbb...","..bwbbbbbb..","..bkbbbbkb..",".bbbbbbbbbb.",".bbbbmmbbbb.","bbbbbbbbbbbb","dbbbbbbbbbbd",".dddddddddd."]},"wolf":{"pal":{"w":"#eef2ff","g":"#b8c0d8","k":"#3a3a5a","e":"#4fa0ff","n":"#1a1020"},"rows":["..k......k..",".kwk....kwk.",".kwgkkkkgwk.",".kwwwwwwwwk.","kwwewwwwewwk","kwwwwwwwwwwk",".kwwwnnwwwk.","..kwwggwwk..","..kwwwwwwk..",".kwwwwwwwwk.",".kwgk..kgwk.",".kkk....kkk."]},"cat":{"pal":{"k":"#2a2a40","K":"#12121f","y":"#ffef5a","p":"#ff9ab0","w":"#8a8aa8"},"rows":[".K........K.",".Kk......kK.",".Kkkkkkkkkk.","Kkkkkkkkkkkk","Kkyykkkkyykk","Kkkkkkkkkkkk",".Kkkwppwkkk.","..Kkkkkkkk..","..Kkkkkkkk..",".Kkkkkkkkkk.",".Kkk..kkk.kk",".KK...KK...k"]},"fairy":{"pal":{"p":"#ff7ad9","s":"#ffd2a8","e":"#1a1020","c":"#bff0ff","C":"#7ad8ff","y":"#ffef5a","g":"#9af0a0"},"rows":[".....y......","....pppp....","...pppppp...","cC.psssspC.c","ccCseesseCcc","cccsssssscc.",".cC.ssss.Cc.","....gggg....","...gggggg...","....gggg....","....s..s....","....s..s...."]},"golem":{"pal":{"s":"#9e9e9e","d":"#616161","l":"#cfcfcf","e":"#ffca28","k":"#2a2a2a","m":"#3cdc6c"},"rows":["............","...dssssd...","..dssssssd..","..slssssss..","..sessssess.","..ssssssss..","..sskkkkss..",".dssssssssd.","ssssslsssss.","sdsssssssds.","..ssd..dss..","..dd....dd.."]},"dragon":{"pal":{"r":"#e5534b","d":"#a12a24","y":"#ffd54f","w":"#ffffff","k":"#1a1020","o":"#ff9a2e","h":"#f4efe3"},"rows":["..h......h..","..hr....rh..","...rrrrrr...","..rrrrrrrr..","d.rwkrrwkr.d","dd.rrrrrr.dd","ddd.rooor.dd","...rryyrr...","..rryyyyrr..","..rryyyyrr..","...rr..rr..r","...dd..dd.rr"]},"phoenix":{"pal":{"o":"#ff9a2e","r":"#e5534b","y":"#ffef5a","k":"#1a1020","b":"#f2c14e","w":"#ffffff"},"rows":["....r.y.r...",".....ryr....","....oooo....","...oooooo...","..ookoookoo.","..oooobooo..","...oobbboo..","r..oyyyyoo.r","rr.oyyyyoorr",".rroyyyyorr.","....oooo....","....b..b...."]}};
  const GEAR_ART = {"hat_crown":{"pal":{"y":"#f2c14e","r":"#e5534b"},"rows":["....y.y.y...","....yyyyy...","....yryry..."]},"hat_wizard":{"pal":{"p":"#6a2a9a","y":"#f2c14e"},"rows":[".......p....","......pp....","....ppppy..."]},"hat_iron":{"pal":{"g":"#9aa7b8","l":"#cfd6e0"},"rows":["............","....gggg....","...glggggg.."]},"neck_fang":{"pal":{"w":"#f4efe3","k":"#5e3a1a"},"row":"...kwkkwk..."},"neck_gold":{"pal":{"y":"#f2c14e","o":"#c9952b"},"row":"...oyyyyo..."},"neck_heal":{"pal":{"g":"#3cdc6c","w":"#ffffff"},"row":"...ggwwgg..."}};

  // ---------- ペット装備（首飾り・帽子） ----------
  const GEAR = {
    neck_fang: { slot: 'neck', name: '牙の首飾り', fx: { follow: 5 } },
    neck_gold: { slot: 'neck', name: '金の首飾り', fx: { gold: 10 } },
    neck_heal: { slot: 'neck', name: '癒しの首飾り', fx: { regen: 3 } },
    hat_crown: { slot: 'hat', name: '小さな王冠', fx: { exp: 5 } },
    hat_wizard: { slot: 'hat', name: '魔法使いの帽子', fx: { crit: 3 } },
    hat_iron: { slot: 'hat', name: '鉄のかぶと', fx: { def: 5 } },
  };
  const GEAR_SLOTS = { neck: '首飾り', hat: '帽子' };

  // ---------- 餌 ----------
  const FOODS = {
    meat: { name: '干し肉', exp: 50, price: 100, icon: 'meat' },
    cookie: { name: '魔法のクッキー', exp: 150, price: 300, icon: 'cookie' },
    fruit: { name: '竜の果実', exp: 500, price: 900, icon: 'fruit' },
  };
  const MAX_LV = 30;
  const need = lv => 40 * lv;
  function levelOf(exp) {
    let lv = 1, rest = exp;
    while (lv < MAX_LV && rest >= need(lv)) { rest -= need(lv); lv++; }
    return { lv, rest, need: need(lv), max: lv >= MAX_LV };
  }
  function stats(id, lv, gear) {
    const p = PETS[id], s = { follow: 0, exp: 0, gold: 0, crit: 0, def: 0, hp: 0, regen: 0, burn: 0, revive: 0 };
    if (!p) return s;
    Object.keys(s).forEach(k => { s[k] = (p.base[k] || 0) + (p.grow[k] || 0) * (lv - 1); });
    Object.values(gear || {}).forEach(g => { const x = GEAR[g]; if (x) Object.entries(x.fx).forEach(([k, v]) => { s[k] += v; }); });
    Object.keys(s).forEach(k => { s[k] = Math.round(s[k] * 10) / 10; });
    return s;
  }
  function fxText(fx) {
    const t = [];
    if (fx.follow) t.push(`追撃${fx.follow}%`);
    if (fx.exp) t.push(`EXP+${fx.exp}%`);
    if (fx.gold) t.push(`ゴールド+${fx.gold}%`);
    if (fx.crit) t.push(`会心率+${fx.crit}%`);
    if (fx.def) t.push(`被ダメージ−${fx.def}%`);
    if (fx.hp) t.push(`最大HP+${Math.round(fx.hp)}`);
    if (fx.regen) t.push(`毎日HP+${Math.round(fx.regen)}`);
    if (fx.burn) t.push(`🔥火傷${fx.burn}%`);
    if (fx.revive) t.push('週1回よみがえり');
    return t.join('・');
  }

  // ---------- ペットガチャ（ゴールドでもジェムでも引ける） ----------
  const GACHA = {
    gold1: 500, gold10: 4500, gem1: 30, gem10: 270, pity: 40,
    // [種類, 中身, 重み]
    table: [['pet5', null, 2], ['pet4', null, 6], ['gear', null, 22], ['food', 'meat', 40], ['food', 'cookie', 22], ['food', 'fruit', 8]],
    dup: { pet: ['fruit', 2], gear: ['cookie', 2] },
  };

  // ---------- 描画 ----------
  function rectsOf(rows, pal, y0) {
    let r = '';
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) r += '<rect x="' + x + '" y="' + (y + (y0 || 0)) + '" width="1" height="1" fill="' + pal[ch] + '"/>'; }));
    return r;
  }
  function svg(id, size, gear, opts) {
    const a = ART[id]; if (!a) return '';
    let r = rectsOf(a.rows, opts && opts.silhouette ? Object.fromEntries(Object.keys(a.pal).map(k => [k, '#3a3a66'])) : a.pal);
    if (gear && gear.neck && GEAR_ART[gear.neck]) r += rectsOf([GEAR_ART[gear.neck].row], GEAR_ART[gear.neck].pal, 8);
    if (gear && gear.hat && GEAR_ART[gear.hat]) r += rectsOf(GEAR_ART[gear.hat].rows, GEAR_ART[gear.hat].pal, 0);
    return '<svg class="pet-sprite" width="' + size + '" height="' + size + '" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">' + r + '</svg>';
  }
  function gearSvg(gid, size) {
    const a = GEAR_ART[gid]; if (!a) return '';
    const rows = a.rows || [a.row];
    return '<svg width="' + size + '" height="' + size + '" viewBox="2 ' + (a.rows ? -3 : -4) + ' 8 8" shape-rendering="crispEdges" aria-hidden="true">' + rectsOf(rows, a.pal, 0) + '</svg>';
  }

  window.Pets = { PETS, GEAR, GEAR_SLOTS, FOODS, MAX_LV, need, levelOf, stats, fxText, GACHA, svg, gearSvg, ART, GEAR_ART, UNLOCK_LV: 5 };
})();
