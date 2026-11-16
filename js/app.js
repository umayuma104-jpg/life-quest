(() => {
  'use strict';
  const S = window.Sprites;
  const CAT = window.Catalog;
  const G = window.Gear;
  const P = window.Pets;
  const E = window.Events;
  const EV_GEMS = 100;
  // イベント報酬で手に入れたもの（compute が日付順に記録する）
  let GRANTS = [];
  const GOLD_PER_CLEAR = 20, GOLD_BOSS = 100, GOLD_LEVEL = 50;
  const GEM_CLEAR = 5, GEM_BOSS = 30, GEM_LEVEL = 10, GEM_ACH = 20;
  const KEY = 'lifeQuest.v1';
  const DAY_START_HOUR = 3;
  const MAX_HP = 100, HEAL = 10, DMG_PARTIAL = 15, DMG_NONE = 25;
  const FREEZE_EVERY = 3;
  const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
  const WD = '日月火水木金土';
  const APP_URL = 'https://umayuma104-jpg.github.io/life-quest/';
  const CATS = {
    str: { en: 'STR', name: '体力', color: 'var(--r)' },
    int: { en: 'INT', name: '知力', color: 'var(--b)' },
    mnd: { en: 'MND', name: '精神', color: 'var(--p)' },
    vit: { en: 'VIT', name: '生活', color: 'var(--g)' },
  };
  const TITLES = [
    [1, '見習い'], [3, '駆け出しの冒険者'], [5, '規律の挑戦者'], [8, '鍛錬の戦士'],
    [12, '習慣の騎士'], [16, '鋼の意志'], [20, '自己の支配者'], [25, '覚醒者'],
    [30, '英雄'], [40, '伝説'], [50, '人生の到達者'],
  ];
  const SLOT_LV = [[1, 3], [3, 4], [5, 5], [8, 6], [12, 7], [16, 8], [20, 9], [25, 10]];
  const slotsFor = lv => SLOT_LV.filter(s => lv >= s[0]).pop()[1];
  const nextSlotLv = lv => (SLOT_LV.find(s => s[0] > lv) || [null])[0];
  const FRAMES = [[1, '#ffffff'], [10, '#5ac8ff'], [20, '#fce35a'], [30, '#ff7ad9'], [50, '#3cdc6c']];
  const frameFor = lv => FRAMES.filter(f => lv >= f[0]).pop()[1];
  const GOALS = {
    fit: '体力をつけたい', slim: '痩せたい・引き締めたい', wake: '早起きしたい',
    study: '勉強・自己投資', mind: '心を整えたい', rhythm: '生活リズムを整えたい',
  };
  const EMOJI_TO_ICON = { '🌅': 'sun', '💪': 'dumbbell', '🏃': 'shoe', '🚶': 'shoe', '💧': 'drop', '📚': 'book', '🧘': 'lotus', '📵': 'phone', '🧹': 'broom', '⭐': 'star' };

  // ---------- 日付 ----------
  const pad = n => String(n).padStart(2, '0');
  const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function todayKey() { const d = new Date(); d.setHours(d.getHours() - DAY_START_HOUR); return keyOf(d); }
  function parseKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
  function addDays(k, n) { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); }
  const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 864e5);
  const dow = k => parseKey(k).getDay();
  const weekStart = k => addDays(k, -((dow(k) + 6) % 7));
  const md = k => `${+k.slice(5, 7)}/${+k.slice(8)}`;
  const toMin = t => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fromMin = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

  // ---------- データ ----------
  const uid = () => Math.random().toString(36).slice(2, 10);
  const autoStep = (target, unit) => unit === 'L' ? 0.5 : target <= 10 ? 1 : target <= 30 ? 5 : target <= 100 ? 10 : Math.round(target / 5);
  function freshState() {
    const t = todayKey();
    return {
      name: '冒険者', tasks: [], log: {}, sched: {}, inbox: [], lastLevel: 1, start: t, seenUntil: addDays(t, -1),
      onboarded: false, sound: true, vibe: true, lastBackup: null, backupMailed: null,
      owned: [], buys: [], gearLog: [], look: { hair: 'short', color: 0, skin: 0 },
      pulls: [], gachaLog: [], itemBuys: [], uses: [],
      feeds: [], petLog: [], petGearLog: [], foodBuys: [], petGachaLog: [], retro: [], weeklyDone: [], fontScale: 1,
      notify: { on: false, morning: '07:00', evening: '21:00', sent: {} },
    };
  }
  function migrate(s) {
    const t = todayKey();
    s.log = s.log || {};
    s.tasks.forEach(x => {
      if (!Array.isArray(x.days) || !x.days.length) x.days = ALL_DAYS.slice();
      if (EMOJI_TO_ICON[x.icon]) x.icon = EMOJI_TO_ICON[x.icon];
      if (x.type === 'count' && !x.step) x.step = autoStep(x.target, x.unit);
      if (x.archived && !x.archivedAt) { x.archivedAt = t; delete x.archived; }
      if (x.tpl === 'sleep') { x.tpl = 'bed'; x.type = 'bed'; x.bedtime = '23:00'; }
    });
    if (!s.start) s.start = Object.keys(s.log).sort()[0] || t;
    if (!s.seenUntil) s.seenUntil = addDays(t, -1);
    if (!s.notify) s.notify = { on: false, morning: '07:00', evening: '21:00', sent: {} };
    if (!s.notify.sent) s.notify.sent = {};
    if (s.sound === undefined) s.sound = true;
    if (s.vibe === undefined) s.vibe = true;
    if (!Array.isArray(s.inbox)) s.inbox = [];
    if (!Array.isArray(s.owned)) s.owned = [];
    if (!Array.isArray(s.buys)) s.buys = [];
    if (!Array.isArray(s.gearLog)) s.gearLog = [];
    ['pulls', 'gachaLog', 'itemBuys', 'uses', 'feeds', 'petLog', 'petGearLog', 'foodBuys', 'petGachaLog', 'retro', 'weeklyDone'].forEach(k => { if (!Array.isArray(s[k])) s[k] = []; });
    if (!s.fontScale) s.fontScale = 1;
    if (!s.look) s.look = { hair: 'short', color: 0, skin: 0 };
    if (s.name === 'ぼうけんしゃ') s.name = '冒険者';
    if (!s.sched) {
      s.sched = {};
      for (let k = s.start; k < t; k = addDays(k, 1))
        s.sched[k] = s.tasks.filter(x => !x.archivedAt && x.days.includes(dow(k))).map(x => x.id);
    }
    if (s.onboarded === undefined) s.onboarded = false;
    return s;
  }
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.tasks)) return migrate(s); } catch (e) {}
    return freshState();
  }
  let state = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  // archivedAt: その日から使わない / from: その日から使う（どちらも過去の記録とEXPは残る）
  const activeTasks = () => state.tasks.filter(t => !t.archivedAt);
  const activeOn = (t, k) => (!t.from || t.from <= k) && (!t.archivedAt || t.archivedAt > k);
  const currentIdsFor = k => state.tasks.filter(t => activeOn(t, k) && t.days.includes(dow(k))).map(t => t.id);
  const schedIds = k => (k < todayKey() && state.sched[k]) || currentIdsFor(k);
  const needFor = n => Math.ceil(n * 2 / 3);

  // ---------- 装備 ----------
  // 装備の付け替えは日付つきで記録し、その日以降にだけ効果が出る（過去の結果は変わらない）
  function gearOn(k) {
    const g = Object.assign({}, G.STARTER);
    state.gearLog.forEach(e => { if (e.k <= k) g[e.slot] = e.id; });
    return g;
  }
  const currentGear = () => gearOn(todayKey());
  const artOf = gear => Object.fromEntries(Object.entries(gear).map(([s, id]) => [s, (G.get(id) || { art: '0' }).art]));
  const heroSvg = (size, gear, look) => { const g = gear || currentGear(); return S.hero(artOf(g), size, look || state.look, G.stats(g).aura); };
  const owns = id => { const x = G.get(id); return (x.price === 0 && !x.gacha) || state.owned.includes(id); };
  // 持ち物の数 = ガチャで出た数 + 買った数 − 使った数
  const itemCount = id => state.pulls.filter(p => p.type === 'item' && p.id === id).length
    + state.itemBuys.filter(b => b.id === id).length - state.uses.filter(u => u.id === id).length;
  const usedToday = id => state.uses.some(u => u.id === id && u.k === todayKey());
  const taskName = t => t.type === 'bed' ? `${t.bedtime || '23:00'}までに寝る` : t.name;

  // ---------- 適性と目標 ----------
  // 運動習慣（fit）や使える時間（time）から、その人に合う目標を決める。自分で変えられるのはこの範囲内だけ
  const prefs = () => state.prefs || { fit: 1, time: 1, goals: [], wake: '06:30' };
  const idxFor = (x, p = prefs()) => x.scale === 'time' ? p.time : x.scale === 'none' ? 1 : p.fit;
  const recTarget = (x, p) => x.targets[idxFor(x, p)];
  const stepOf = (x, p) => x.steps[idxFor(x, p)];
  function rangeFor(x, p) {
    if (x.range) return x.range;
    const rec = recTarget(x, p), st = stepOf(x, p);
    const min = Math.max(st, Math.floor(rec * 0.5 / st) * st);
    const max = Math.max(rec + st, Math.ceil(rec * 1.5 / st) * st);
    return [min, max];
  }
  const xpFor = (x, target) => x.type === 'count' ? Math.max(1, Math.round(x.xp * target / x.targets[1])) : x.xp;
  function makeTask(x, p, over = {}) {
    const t = { id: uid(), tpl: x.key, icon: x.icon, name: x.name, type: x.type, cat: x.cat, xp: x.xp, days: ALL_DAYS.slice() };
    if (x.type === 'count') { t.unit = x.unit; t.step = stepOf(x, p); t.target = recTarget(x, p); }
    if (x.type === 'wake') t.wake = p.wake || x.wake;
    if (x.type === 'bed') t.bedtime = x.bedtime;
    Object.assign(t, over);
    if (x.type === 'count') t.xp = xpFor(x, t.target);
    return t;
  }

  // ---------- 計算 ----------
  function completion(task, v) {
    if (v == null || v === '' || v === false) return 0;
    if (task.type === 'check' || task.type === 'bed') return v ? 1 : 0;
    if (task.type === 'count') return Math.max(0, Math.min(1, Number(v) / (task.target || 1)));
    if (task.type === 'wake') { const diff = toMin(v) - toMin(task.wake); return diff <= 0 ? 1 : diff <= 30 ? 0.5 : 0; }
    return 0;
  }
  const isDone = (t, v) => completion(t, v) >= 1;
  const bonusFor = streak => Math.min(1.5, 1 + streak * 0.05);
  const need = lv => Math.round(80 * Math.pow(lv, 1.35));
  function levelOf(xp) {
    let lv = 1, rest = Math.max(0, xp);
    while (rest >= need(lv)) { rest -= need(lv); lv++; }
    return { lv, rest, need: need(lv) };
  }
  const titleOf = lv => TITLES.filter(t => lv >= t[0]).pop()[1];
  // ---------- 乱数（日付から決まるので、何度計算しても同じ結果になる） ----------
  function hash(str) { let x = 2166136261; for (let i = 0; i < str.length; i++) x = Math.imul(x ^ str.charCodeAt(i), 16777619); return x >>> 0; }
  // 今日のボーナス：その日のクエストのうち1つが EXP2倍
  const bonusIdOf = (k, ids) => ids.length ? ids.slice().sort()[hash('bonus' + k) % ids.length] : null;
  // 会心の一撃：完了したクエストの15%でボスへのダメージ2倍
  const isCrit = (k, id, bonus = 0) => hash('crit' + k + id) % 100 < 15 + bonus;

  // ---------- 実績 ----------
  // [キー, 名前, 数える値, 目標, 報酬G]
  const ACH = [
    ['streak3', '3日連続で達成', 'best', 3, 50], ['streak7', '7日連続で達成', 'best', 7, 100],
    ['streak14', '14日連続で達成', 'best', 14, 200], ['streak30', '30日連続で達成', 'best', 30, 500],
    ['streak100', '100日連続で達成', 'best', 100, 2000],
    ['clear10', '達成日数 10日', 'clearedDays', 10, 100], ['clear50', '達成日数 50日', 'clearedDays', 50, 300],
    ['clear100', '達成日数 100日', 'clearedDays', 100, 800],
    ['perfect1', '初めての全クリア', 'perfect', 1, 50], ['perfect10', '全クリア 10回', 'perfect', 10, 200],
    ['perfect50', '全クリア 50回', 'perfect', 50, 600],
    ['boss1', '初めてのボス討伐', 'bossWins', 1, 100], ['boss5', 'ボス討伐 5体', 'bossWins', 5, 300],
    ['boss20', 'ボス討伐 20体', 'bossWins', 20, 1000],
    ['wake10', '早起き 10回', 'wakes', 10, 100], ['wake50', '早起き 50回', 'wakes', 50, 400],
    ['reps1000', '累計 1,000回', 'reps', 1000, 200], ['reps10000', '累計 10,000回', 'reps', 10000, 1000],
    ['lv5', 'Lv5に到達', 'lv', 5, 100], ['lv10', 'Lv10に到達', 'lv', 10, 300], ['lv20', 'Lv20に到達', 'lv', 20, 800],
    ['buy1', '初めての買い物', 'buys', 1, 50], ['set1', '革・銅の装備を全部位そろえる', 'tierSet', 1, 300],
    ['set2', '鉄の装備を全部位そろえる', 'tierSet', 2, 600], ['set3', '騎士の装備を全部位そろえる', 'tierSet', 3, 1500],
  ].map(([key, name, stat, goal, reward]) => ({ key, name, stat, goal, reward }));
  // その日までに持っている装備で、全部位がそろっている段階
  function tierSetOn(k) {
    const best = { head: 0, chest: 0, legs: 0, feet: 0, sword: 0, shield: 0 };
    state.buys.forEach(b => { if (b.k <= k) { const x = G.get(b.id); if (x) best[x.slot] = Math.max(best[x.slot], x.tier); } });
    return Math.min(...Object.values(best));
  }

  // ---------- ボス ----------
  // 開始から何週目かで決まる。弱い順に1体ずつ登場し、週を重ねるほどHPと報酬が上がる。20体で一巡すると強化版
  function bossFor(ws, byId, firstWs) {
    const n = Math.max(0, Math.round(daysBetween(firstWs, ws) / 7));
    let base = 0, days = 0;
    for (let i = 0; i < 7; i++) {
      const k = addDays(ws, i);
      if (k < state.start) continue;
      days++;
      base += schedIds(k).reduce((a, id) => a + (byId[id] ? byId[id].xp : 0), 0);
    }
    // 週の途中から始めた場合も、最低4日分のHPにする（1回の記録で倒せないように）
    if (days > 0 && days < 4) base = base / days * 4;
    const scale = Math.min(2, 1 + 0.04 * n);
    const hp = Math.max(50, Math.round(base * 0.7 * scale));
    const idx = S.BOSS_ORDER[n % S.BOSS_ORDER.length];
    const loop = Math.floor(n / S.BOSS_ORDER.length);
    return { ws, n, idx, name: (loop ? '強化・' : '') + S.BOSSES[idx].name, hp, dmg: 0, defeated: null,
      reward: Math.round(hp * 0.3), gold: GOLD_BOSS + 10 * Math.min(n, 40) };
  }

  // ---------- 週間クエスト・今月の目標 ----------
  // 週間クエストは毎週月曜に5個。3種類から日付で決まる組み合わせで選ぶ（何度計算しても同じ）
  //   強化：いつものクエストを多めに（記録から自動判定）
  //   回数：いつものクエストを週に何回かクリア（記録から自動判定）
  //   たまに：毎日は難しいけど、たまにはやった方がいいこと（「やった！」で記録）
  const GOAL_REWARD = { month: [400, 40] };
  const WQ_REWARD = { boost: { xp: 30, g: 80, gem: 5 }, times: { xp: 20, g: 60, gem: 5 }, occ: { xp: 40, g: 100, gem: 10 } };
  const WQ_KIND = { boost: '強化', times: '回数', occ: 'たまに' };
  const OCCASIONAL = [
    ['bigclean', '部屋の大掃除をする', 'broom'], ['longmove', 'いつもより長く体を動かす（45分以上）', 'shoe'],
    ['finishbook', '本を1冊読み終える', 'book'], ['mealprep', '作り置きの料理をする', 'apple'],
    ['contact', '家族や友人に連絡する', 'heart'], ['detox', 'スマホを見ない半日をつくる', 'phone'],
    ['review', '1週間の振り返りを書く', 'pen'], ['newwalk', '行ったことのない場所を散歩する', 'shoe'],
    ['longstretch', '30分以上ストレッチ・ヨガをする', 'lotus'], ['earlybed', '22時前に寝る日をつくる', 'moon'],
    ['futon', '布団を干して部屋を換気する', 'sun'], ['declutter', '使っていない物を3つ手放す', 'broom'],
  ];
  function weeklyQuests(ws) {
    let h = hash('wq' + ws);
    const take = list => { if (!list.length) return null; const x = list.splice(h % list.length, 1)[0]; h = Math.floor(h / 7) + 101; return x; };
    const tasks = activeTasks();
    const boosts = [], times = [];
    tasks.forEach(t => {
      if (t.type === 'count') {
        const st = t.step || autoStep(t.target, t.unit);
        const n = Math.max(t.target + st, Math.round(t.target * 2.5 / st) * st);
        boosts.push({ key: 'max_' + t.id, kind: 'boost', icon: t.icon, name: `${t.name}を1日で${fmtNum(n)}${t.unit}`, stat: 'max_' + t.id, goal: n });
      }
      if (t.type === 'wake') {
        const early = fromMin(Math.max(240, toMin(t.wake) - 30));
        boosts.push({ key: 'early_' + t.id, kind: 'boost', icon: t.icon, name: `いつもより30分早く起きる（${early}まで）`, stat: 'early_' + t.id, goal: 1, wakeId: t.id, early });
      }
      if (t.days.length >= 3) times.push({ key: 'times_' + t.id, kind: 'times', icon: t.icon, name: `${taskName(t)}を週3回クリア`, stat: 'done_' + t.id, goal: 3 });
    });
    const occ = OCCASIONAL.map(([key, name, icon]) => ({ key: 'occ_' + key, kind: 'occ', icon, name, stat: 'm_occ_' + key, goal: 1, manual: true }));
    const out = [];
    for (let i = 0; i < 2; i++) { const x = take(boosts); if (x) out.push(x); }
    const tm = take(times); if (tm) out.push(tm);
    while (out.length < 5) out.push(take(occ));
    return out.map(q => Object.assign(q, WQ_REWARD[q.kind]));
  }
  const monthGoals = () => [
    { key: 'm_clear', name: '達成 20日', stat: 'clear', goal: 20 },
    { key: 'm_boss', name: 'ボス討伐 3体', stat: 'boss', goal: 3 },
  ];
  const fmtNum = n => Number.isInteger(n) ? n : Math.round(n * 10) / 10;
  const monthOf = k => k.slice(0, 7);

  // 開始日から今日まで1日ずつ再生して、すべての数値を計算する
  function compute() {
    const tKey = todayKey();
    const byId = Object.fromEntries(state.tasks.map(t => [t.id, t]));
    const cat = { str: 0, int: 0, mnd: 0, vit: 0 };
    const perDay = {}, events = [], bosses = {}, ach = {};
    let total = 0, hp = MAX_HP, streak = 0, freezes = 0, boss = null;
    let earned = 0, maxHp = MAX_HP, lvNow = 1, gems = 0, poison = 0, guardWeek = null, reviveWeek = null;
    const st = { best: 0, clearedDays: 0, perfect: 0, bossWins: 0, wakes: 0, reps: 0, lv: 1, buys: 0, tierSet: 0, frozenDays: 0, knockouts: 0 };
    // ペット
    const petExp = {}, foodLv = { meat: 0, cookie: 0, fruit: 0 };
    let petUnlock = null;
    // 目標
    let wk = null, mo = null;
    const goalsDone = {};
    // 季節イベント
    GRANTS = [];
    const evBosses = {}, evDefeated = {};
    let first = state.start;
    const logFirst = Object.keys(state.log).sort()[0];
    if (logFirst && logFirst < first) first = logFirst;
    const firstWs = weekStart(first);
    for (let k = first; k <= tKey; k = addDays(k, 1)) {
      const ws = weekStart(k);
      if (!boss || boss.ws !== ws) { boss = bossFor(ws, byId, firstWs); bosses[ws] = boss; poison = 0; }
      if (!wk || wk.ws !== ws) wk = { ws, goals: weeklyQuests(ws), c: {} };
      // 「たまに」の週間クエストは、やった日に記録されている
      state.weeklyDone.forEach(e => { if (e.ws === ws && e.k === k) wk.c['m_' + e.key] = 1; });
      if (!mo || mo.m !== monthOf(k)) mo = { m: monthOf(k), goals: monthGoals(), c: {} };
      const entries = state.log[k] || {};
      const ids = schedIds(k).filter(id => byId[id]);
      const bonusId = bonusIdOf(k, ids);
      const mult = bonusFor(streak);
      const gs = G.stats(gearOn(k));
      // 季節イベント（その日に開催中なら）
      const ev = E.on(k), perk = ev ? ev.perk : {};
      let evb = null;
      if (ev) {
        evb = evBosses[ev.id];
        if (!evb) {
          let base = 0, days = 0;
          for (let d = ev.start > state.start ? ev.start : state.start; d <= ev.end; d = addDays(d, 1)) { days++; base += schedIds(d).reduce((a, id) => a + (byId[id] ? byId[id].xp : 0), 0); }
          if (days > 0 && days < 4) base = base / days * 4;
          const hpE = Math.max(80, Math.round(base * 0.8 * Math.min(2, 1 + 0.04 * boss.n)));
          evb = evBosses[ev.id] = { ev, hp: hpE, dmg: 0, defeated: null };
          events.push({ k, icon: ev.icon, title: `${ev.name}イベント開催`, text: `${md(ev.start)}〜${md(ev.end)}。${ev.intro} 期間中は${ev.perkText}。` });
        }
      }
      const petExpX = perk.petExpX || 1;
      // ペット：その日に連れているペットと、餌の経験値
      state.feeds.filter(f => f.k === k).forEach(f => { petExp[f.pet] = (petExp[f.pet] || 0) + P.FOODS[f.food].exp * petExpX; });
      const pet = petOn(k, petUnlock);
      const pf = pet ? P.stats(pet, P.levelOf(petExp[pet] || 0).lv, petGearOn(k)) : P.stats(null);
      maxHp = MAX_HP + gs.hp + Math.round(pf.hp); hp = Math.min(hp, maxHp);
      if (pf.regen) hp = Math.min(maxHp, hp + Math.round(pf.regen));
      const expPct = gs.exp + pf.exp, goldPct = gs.gold + pf.gold + (perk.goldPct || 0), critPct = gs.crit + pf.crit + (perk.crit || 0), defPct = Math.min(70, gs.def + pf.def);
      // その日に使ったアイテム
      const used = state.uses.filter(u => u.k === k);
      const bookX = used.some(u => u.id === 'xpbook') ? 1.5 : 1;
      used.forEach(u => {
        if (u.id === 'potion') hp = Math.min(maxHp, hp + 30);
        if (u.id === 'charm') freezes++;
        if (u.id === 'bomb') boss.dmg += Math.round(boss.hp * 0.2);
      });
      let dayXp = 0, done = 0, dayGold = 0, bossDmg = 0, dotDmg = 0, petDmg = 0;
      for (const id in entries) {
        const t = byId[id]; if (!t) continue;
        const c = completion(t, entries[id]);
        const g = Math.round(t.xp * c * mult * (id === bonusId ? 2 : 1) * (1 + expPct / 100) * bookX * (t.type === 'wake' && perk.wakeX ? perk.wakeX : 1));
        dayXp += g; cat[t.cat] += g;
        const hit = Math.round(g * (1 + gs.atk / 100) * (c >= 1 && isCrit(k, id, critPct) ? 2 : 1));
        bossDmg += hit;
        petDmg += Math.round(hit * pf.follow / 100);
        if (c >= 1 && ids.includes(id)) done++;
        if (t.type === 'wake' && c >= 1) st.wakes++;
        if (c >= 1) wk.c['done_' + id] = (wk.c['done_' + id] || 0) + 1;
        if (t.type === 'count') wk.c['max_' + id] = Math.max(wk.c['max_' + id] || 0, Number(entries[id]) || 0);
        if (t.type === 'wake') wk.goals.forEach(q => { if (q.wakeId === id && toMin(entries[id]) <= toMin(q.early)) wk.c['early_' + id] = 1; });
        if (t.type === 'count' && t.unit === '回') st.reps += Number(entries[id]) || 0;
      }
      const count = ids.length, recorded = Object.keys(entries).length > 0;
      const cleared = count > 0 && done >= needFor(count);
      let status;
      total += dayXp;
      if (count === 0) status = 'rest';
      else if (cleared) {
        status = 'cleared'; streak++; st.clearedDays++; st.best = Math.max(st.best, streak);
        wk.c.clear = (wk.c.clear || 0) + 1; mo.c.clear = (mo.c.clear || 0) + 1;
        if (done >= count) { st.perfect++; wk.c.perfect = (wk.c.perfect || 0) + 1; }
        hp = Math.min(maxHp, hp + HEAL);
        dayGold += GOLD_PER_CLEAR;
        if (streak % FREEZE_EVERY === 0) { freezes++; events.push({ k, icon: '❄', title: '氷のお守りを手に入れた', text: `${streak}日連続で達成！ 氷のお守りを手に入れた（所持 ${freezes}個）` }); }
      } else if (k === tKey) status = 'pending';
      else if (gs.guard && guardWeek !== ws) {
        guardWeek = ws; status = 'frozen';
        events.push({ k, icon: '🛡', title: '氷竜の加護', text: `未達成だったが、氷竜の加護が${boss.name}の攻撃を防いだ（週に1度）` });
      } else if (freezes > 0) {
        freezes--; st.frozenDays++; status = 'frozen';
        events.push({ k, icon: '🧊', title: '氷のお守りが身を守った', text: `未達成だったが、氷のお守りが身を守った。連続${streak}日は継続（残り ${freezes}個）` });
      } else {
        const dmg = Math.round((recorded ? DMG_PARTIAL : DMG_NONE) * (1 - defPct / 100));
        hp -= dmg; status = 'damage';
        const lost = streak; streak = 0;
        events.push({ k, icon: '💥', title: `${boss.name}の攻撃 ${dmg}ダメージ`, text: `${recorded ? '未達成' : '記録なし'}の隙を突かれた… HPが${Math.max(0, hp)}に減った。${lost ? `連続${lost}日が途切れた。` : ''}` });
        if (hp <= 0 && pf.revive && reviveWeek !== ws) {
          reviveWeek = ws; hp = 1;
          events.push({ k, icon: '🔥', title: '不死鳥の加護', text: `力尽きかけたが、${P.PETS[pet].name}の炎でよみがえった！（HP1）` });
        } else if (hp <= 0) {
          const L = levelOf(total), lostXp = Math.floor(L.rest / 2);
          total -= lostXp; hp = maxHp; st.knockouts++;
          events.push({ k, icon: '☠', title: '戦闘不能', text: `力尽きた… ${lostXp}EXPを失った。HPは全回復した。` });
        }
      }
      // 火傷・毒：その日にクエストをこなしていれば、ボスに持続ダメージ
      if (dayXp > 0 && !boss.defeated) {
        const burn = gs.burn + pf.burn;
        if (burn) dotDmg += Math.round(boss.hp * burn / 100);
        if (gs.poison) { poison = Math.min(7, poison + 1); dotDmg += Math.round(boss.hp * gs.poison * poison / 100); }
      }
      boss.dmg += bossDmg + dotDmg + petDmg;
      if (evb) {
        evb.dmg += bossDmg + petDmg + (dayXp > 0 ? Math.round(evb.hp * (gs.burn + pf.burn) / 100) : 0);
        state.uses.filter(u => u.k === k && u.id === 'bomb').forEach(() => { evb.dmg += Math.round(evb.hp * 0.2); });
        if (!evb.defeated && evb.dmg >= evb.hp) {
          evb.defeated = k; gems += EV_GEMS; evDefeated[ev.key] = k;
          const rw = ev.reward;
          const have = rw.type === 'pet' ? ownedPets(k, petUnlock).includes(rw.id) : petGearOwned().includes(rw.id);
          if (!have) GRANTS.push({ k, type: rw.type, id: rw.id });
          const rwName = rw.type === 'pet' ? P.PETS[rw.id].name : P.GEAR[rw.id].name;
          events.push({ k, icon: ev.icon, title: `${ev.boss.name}を倒した`, text: `${EV_GEMS}💎${have ? '' : `と「${rwName}」`}を手に入れた！${rw.type === 'pet' && !have ? ' 新しい仲間だ！' : ''}` });
        }
      }
      if (perk.dailyGold && recorded) dayGold += perk.dailyGold;
      if (!boss.defeated && boss.dmg >= boss.hp) {
        boss.defeated = k; total += boss.reward; st.bossWins++; dayGold += boss.gold; gems += GEM_BOSS;
        wk.c.boss = 1; mo.c.boss = (mo.c.boss || 0) + 1;
        if (gs.freezeOnBoss) freezes += gs.freezeOnBoss;
        events.push({ k, icon: '⚔', title: `${boss.name}を倒した`, text: `${boss.reward}EXP・${boss.gold}G・${GEM_BOSS}💎を獲得！${gs.freezeOnBoss ? ` 氷竜の斧の力で❄+${gs.freezeOnBoss}` : ''}` });
      }
      if (cleared) gems += GEM_CLEAR;
      dayGold += Math.round(dayXp / 2);
      dayGold = Math.round(dayGold * (1 + goldPct / 100));
      wk.goals.forEach(q => {
        const gk = `week:${wk.ws}:${q.key}`;
        if (!goalsDone[gk] && (wk.c[q.stat] || 0) >= q.goal) {
          goalsDone[gk] = k; total += q.xp; dayGold += q.g; gems += q.gem;
          events.push({ k, icon: '📜', title: `週間クエスト「${q.name}」`, text: `クリア！ 報酬 ${q.xp}EXP・${q.g}G・${q.gem}💎` });
        }
      });
      const lvEnd = levelOf(total).lv;
      if (lvEnd > lvNow) {
        const n = lvEnd - lvNow;
        dayGold += n * GOLD_LEVEL; gems += n * GEM_LEVEL;
        // レベルアップ報酬：ペットの餌（5の倍数で竜の果実）
        foodLv.meat += 2 * n;
        for (let l = lvNow + 1; l <= lvEnd; l++) if (l % 5 === 0) foodLv.fruit++;
      }
      lvNow = Math.max(lvNow, lvEnd);
      if (!petUnlock && lvNow >= P.UNLOCK_LV) {
        petUnlock = k;
        events.push({ k, icon: '🐾', title: 'ペットが仲間になった', text: `Lv${P.UNLOCK_LV}に到達！ ${P.PETS.slime.name}が仲間になった。ステータス画面で育てよう。` });
      }
      // 連れているペットは、主人公が稼いだEXPの半分を経験値にする
      if (pet && dayXp > 0) petExp[pet] = (petExp[pet] || 0) + Math.round(dayXp / 2) * petExpX;
      st.lv = lvNow;
      st.buys = state.buys.filter(b => b.k <= k).length;
      st.tierSet = tierSetOn(k);
      ACH.forEach(a => {
        if (!ach[a.key] && st[a.stat] >= a.goal) {
          ach[a.key] = k; dayGold += a.reward; gems += GEM_ACH;
          events.push({ k, icon: '🏆', title: `実績「${a.name}」`, text: `実績を達成した！ 報酬 ${a.reward}G・${GEM_ACH}💎` });
        }
      });
      // 目標の達成チェック
      [['month', mo.m, mo]].forEach(([kind, id, box]) => box.goals.forEach(g => {
        const gk = `${kind}:${id}:${g.key}`;
        if (!goalsDone[gk] && (box.c[g.stat] || 0) >= g.goal) {
          goalsDone[gk] = k;
          const [gg, gm] = GOAL_REWARD[kind];
          dayGold += gg; gems += gm;
          events.push({ k, icon: '🎯', title: `今月の目標「${g.name}」`, text: `目標を達成した！ 報酬 ${gg}G・${gm}💎` });
        }
      }));
      earned += dayGold;
      perDay[k] = { xp: dayXp, done, count, cleared, mult, status, hp, recorded, bossDmg, dotDmg, petDmg, poison, gold: dayGold, bonusId, pet };
    }
    const today = perDay[tKey];
    const spent = state.buys.reduce((a, b) => a + b.price, 0) + state.itemBuys.reduce((a, b) => a + b.price, 0)
      + state.foodBuys.reduce((a, b) => a + b.price, 0) + state.petGachaLog.filter(g => g.cur === 'gold').reduce((a, g) => a + g.cost, 0);
    const bags = state.pulls.filter(p => p.type === 'gold').reduce((a, p) => a + p.amount, 0);
    const gemNow = gems + state.pulls.reduce((a, p) => a + (p.refund || 0), 0) - state.gachaLog.reduce((a, g) => a + g.cost, 0)
      - state.petGachaLog.filter(g => g.cur === 'gem').reduce((a, g) => a + g.cost, 0);
    const petNow = petOn(tKey, petUnlock);
    const goalView = (kind, box) => box.goals.map(g => ({ ...g, cur: box.c[g.stat] || 0, done: goalsDone[`${kind}:${kind === 'week' ? box.ws : box.m}:${g.key}`] }));
    return { gems: Math.max(0, gemNow), poison, total, cat, perDay, events, bosses, boss: bosses[weekStart(tKey)], streak, best: st.best, freezes, hp, maxHp,
      clearedDays: st.clearedDays, frozenDays: st.frozenDays, knockouts: st.knockouts, bossWins: st.bossWins, st, ach,
      mult: today ? today.mult : bonusFor(streak), earned: earned + bags, gold: Math.max(0, earned + bags - spent), gearStats: G.stats(gearOn(tKey)),
      evNow: E.on(tKey), evBoss: E.on(tKey) ? evBosses[E.on(tKey).id] : null, evDefeated,
      petUnlock, petExp, pet: petNow, petFx: petNow ? P.stats(petNow, P.levelOf(petExp[petNow] || 0).lv, petGearOn(tKey)) : null, foodLv,
      goals: { week: goalView('week', wk), month: goalView('month', mo) } };
  }

  // ---------- ペットの持ち物と状態 ----------
  // 持っているペット：最初のスライム（Lv5で解放）＋ガチャで出たペット
  function ownedPets(k, unlock) {
    const list = [];
    if (unlock && unlock <= k) list.push('slime');
    state.pulls.forEach(p => { if (p.type === 'pet' && p.k <= k && !list.includes(p.id)) list.push(p.id); });
    GRANTS.forEach(g => { if (g.type === 'pet' && g.k <= k && !list.includes(g.id)) list.push(g.id); });
    return list;
  }
  function petOn(k, unlock) {
    const own = ownedPets(k, unlock);
    if (!own.length) return null;
    let cur = own[0];
    state.petLog.forEach(e => { if (e.k <= k && own.includes(e.id)) cur = e.id; });
    return cur;
  }
  function petGearOn(k) {
    const g = {};
    state.petGearLog.forEach(e => { if (e.k <= k) g[e.slot] = e.id; });
    return g;
  }
  const petGearOwned = () => [...new Set(state.pulls.filter(p => p.type === 'petgear').map(p => p.id).concat(GRANTS.filter(g => g.type === 'petgear').map(g => g.id)))];
  const foodCount = id => (C ? C.foodLv[id] : 0) + state.pulls.filter(p => p.type === 'food' && p.id === id).reduce((a, p) => a + (p.n || 1), 0)
    + state.foodBuys.filter(b => b.id === id).length - state.feeds.filter(f => f.food === id).length;

  // ---------- サウンド・振動 ----------
  let actx = null;
  function audio() {
    if (!state.sound) return null;
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); return actx; } catch (e) { return null; }
  }
  function tones(seq, type = 'square', vol = 0.06) {
    const a = audio(); if (!a) return;
    const t0 = a.currentTime + 0.01;
    seq.forEach(([f, at, d]) => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(vol, t0 + at); g.gain.exponentialRampToValueAtTime(0.001, t0 + at + d);
      o.connect(g).connect(a.destination); o.start(t0 + at); o.stop(t0 + at + d + 0.02);
    });
  }
  function noise(dur = 0.15, vol = 0.12) {
    const a = audio(); if (!a) return;
    const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = a.createBufferSource(), g = a.createGain(); g.gain.value = vol;
    s.buffer = buf; s.connect(g).connect(a.destination); s.start();
  }
  const SFX = {
    tap: () => tones([[880, 0, 0.04]], 'square', 0.03),
    done: () => tones([[660, 0, 0.07], [880, 0.07, 0.07], [1320, 0.14, 0.14]]),
    undo: () => tones([[440, 0, 0.06], [330, 0.06, 0.1]]),
    hit: () => noise(0.12, 0.1),
    clear: () => tones([[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.3]]),
    level: () => tones([[523, 0, 0.1], [523, 0.12, 0.1], [523, 0.24, 0.1], [698, 0.36, 0.45], [622, 0.84, 0.15], [698, 1.0, 0.15], [784, 1.16, 0.6]]),
    boss: () => { noise(0.4, 0.15); tones([[392, 0.3, 0.12], [523, 0.42, 0.12], [659, 0.54, 0.12], [784, 0.66, 0.5]]); },
    freeze: () => tones([[1568, 0, 0.08], [2093, 0.08, 0.08], [2637, 0.16, 0.2]], 'triangle', 0.08),
    mail: () => tones([[988, 0, 0.08], [1319, 0.1, 0.16]], 'triangle', 0.07),
  };
  let touched = false;
  window.addEventListener('pointerdown', () => { touched = true; }, { once: true, capture: true });
  const vibrate = p => { if (touched && state.vibe && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} };

  // ---------- 小物 ----------
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const iconHtml = (key, size = 26) => S.icon(key, size) || `<span>${esc(key || '⭐')}</span>`;
  const fmt = n => Number.isInteger(Number(n)) ? Number(n).toLocaleString() : String(Math.round(n * 10) / 10);
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    document.body.appendChild(el); setTimeout(() => el.remove(), 2300);
  }
  let sayTimer = null;
  function say(html) {
    const el = $('say');
    el.innerHTML = html; el.classList.remove('hidden', 'out');
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => { el.classList.add('out'); setTimeout(() => el.classList.add('hidden'), 300); }, 3200);
  }
  function flash() { const f = $('flash'); f.classList.add('hidden'); void f.offsetWidth; f.classList.remove('hidden'); setTimeout(() => f.classList.add('hidden'), 700); }
  function share(text) {
    SFX.tap();
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(APP_URL)}`, '_blank', 'noopener');
  }

  // ---------- 小窓 ----------
  function openSheet(title, html, mount) {
    $('sheetTitle').textContent = title;
    $('sheetBody').innerHTML = html;
    $('sheetBody').onclick = null;
    $('sheet').classList.remove('hidden');
    $('sheet').querySelector('.sheet-box').scrollTop = 0;
    if (mount) mount($('sheetBody'));
  }
  function closeSheet() { $('sheet').classList.add('hidden'); }
  $('sheetClose').addEventListener('click', () => { SFX.tap(); closeSheet(); });
  $('sheet').addEventListener('click', e => { if (e.target === $('sheet')) closeSheet(); });

  // ---------- お知らせ ----------
  function addMail(m) {
    state.inbox.unshift({ id: uid(), k: m.k || todayKey(), icon: m.icon || '✉', title: m.title, text: m.text || '', action: m.action || null, read: false });
    state.inbox = state.inbox.slice(0, 60);
  }
  const unread = () => state.inbox.filter(m => !m.read).length;
  function renderBadge() {
    const n = unread();
    $('mailBadge').textContent = n > 99 ? '99+' : n;
    $('mailBadge').classList.toggle('hidden', !n);
  }
  function openMail() {
    SFX.tap();
    const html = state.inbox.length ? state.inbox.map(m => `<div class="mail">
        <div class="mt">${m.read ? '<span style="width:8px"></span>' : '<span class="dot"></span>'}<span>${m.icon} ${esc(m.title)}</span><span class="md">${md(m.k)}</span></div>
        ${m.text ? `<div class="mb">${esc(m.text)}</div>` : ''}
        ${m.action === 'backup' ? '<div class="mb"><button class="btn sm" data-mail-act="backup">今すぐバックアップ</button></div>' : ''}
      </div>`).join('') : '<div class="dim center" style="padding:20px">お知らせはありません</div>';
    openSheet('お知らせ', html, body => { body.onclick = e => { if (e.target.closest('[data-mail-act]')) backup(); }; });
    state.inbox.forEach(m => { m.read = true; }); save(); renderBadge();
  }
  $('mailBtn').addEventListener('click', openMail);
  $('helpBtn').addEventListener('click', () => { SFX.tap(); openHelp(); });
  function openHelp() {
    const sec = (title, items) => `<div class="rule-sec"><div class="rule-h">${title}</div><ul class="rules">${items.map(i => `<li>${i}</li>`).join('')}</ul></div>`;
    openSheet('ルール', [
      sec('達成と連続記録', [`その日のクエストを<span class="y">3分の2以上</span>クリアで「達成」`, `達成でHP＋${HEAL}・🔥連続＋1`, '🔥連続1日ごとにEXP＋5%（最大×1.5）', `毎日1つのクエストが<span class="y">★EXP2倍</span>`]),
      sec('サボったとき', [`🔥3日連続ごとに<span class="b">❄氷のお守り</span>を1個獲得`, '未達成の日は❄を1個使って守る', `❄がないと<span class="r">HP−${DMG_PARTIAL}</span>（記録なしは<span class="r">−${DMG_NONE}</span>）、🔥は0に`, 'HP0で戦闘不能：今のレベルのEXPが半分に']),
      sec('ボス', ['毎週月曜に出現。全20体、週を重ねるほど強くなる', '稼いだEXPがそのままダメージになる', `クエスト完了時、たまに<span class="y">会心の一撃</span>（ダメージ2倍）`]),
      sec('報酬', [`ゴールド：EXPの半分＋達成${GOLD_PER_CLEAR}＋ボス${GOLD_BOSS}〜＋レベルアップ${GOLD_LEVEL}＋実績`, `💎ジェム：達成${GEM_CLEAR}・ボス${GEM_BOSS}・実績${GEM_ACH}・レベルアップ${GEM_LEVEL}`]),
      sec('装備・ガチャ・アイテム', ['頭・足・武器は攻撃、体・脚・サブは守り', 'ガチャ限定装備は火傷・毒などの特殊能力つき。同じセットを3・6部位そろえるとセット効果', 'アイテムは右上の👜から使う']),
      sec('ペット', [`Lv${P.UNLOCK_LV}で仲間になる。連れているペットは追撃やステータスで手伝ってくれる`, '餌やクエストで経験値がたまり、レベルが上がるほど強くなる', '首飾りと帽子を装備できる。ペットガチャはゴールドでもジェムでも引ける']),
      sec('季節イベント', ['正月・バレンタイン・夏休み・ハロウィン・クリスマスの期間中は自動で開催', '限定ボスを倒すと100💎と限定品（かぼちゃおばけ・限定のペット装備）', '期間中だけの特典あり。ペットガチャに限定品が出やすくなる']),
      sec('週間クエスト・目標', ['週間クエストは毎週月曜に5個。「強化」（いつもより多く）と「回数」（週に何回か）は記録から自動、「たまに」（大掃除など）は「やった！」で記録', `今月の目標2つ（各${GOAL_REWARD.month[0]}G・${GOAL_REWARD.month[1]}💎）`, `記録し忘れた昨日の分は、週に${RETRO_MAX}回まで追加・修正できる`]),
      sec('その他', ['早起きは30分以内の遅れならEXP半分', '回数を増やすと獲得EXPも増える', '日付の切り替えは午前3時']),
    ].join(''));
  }

  // ---------- 描画 ----------
  let C = null, knownAch = null;
  function render() {
    const tKey = todayKey();
    const ids = currentIdsFor(tKey);
    if (JSON.stringify(state.sched[tKey]) !== JSON.stringify(ids)) { state.sched[tKey] = ids; save(); }
    const c = C = compute();
    const L = levelOf(c.total);
    document.documentElement.style.setProperty('--frame', frameFor(L.lv));
    const old = $('avatar').querySelector('svg'); if (old) old.remove();
    $('avatar').insertAdjacentHTML('afterbegin', heroSvg(38));
    $('lvNum').textContent = L.lv;
    $('heroName').textContent = state.name;
    $('xpBar').style.width = (L.rest / L.need * 100) + '%';
    $('xpTxt').textContent = `EXP ${L.rest}/${L.need}`;
    $('hpBar').style.width = (c.hp / c.maxHp * 100) + '%';
    $('hpTxt').textContent = `HP ${c.hp}/${c.maxHp}`;
    $('goldNum').textContent = c.gold.toLocaleString();
    $('gemNum').textContent = c.gems.toLocaleString();
    $('streakNum').textContent = c.streak;
    $('freezeNum').textContent = c.freezes;
    $('multNum').textContent = c.mult.toFixed(2).replace(/0$/, '');
    renderEvent(c); renderBoss(c); renderToday(c, L); renderGoals(c); renderStats(c, L); renderPet(c); renderShop(c); renderLog(c); renderBadge();
    // 新しく達成した実績を知らせる
    const got = Object.keys(c.ach);
    if (knownAch) got.filter(k2 => !knownAch.has(k2)).forEach((k2, i) => {
      const a = ACH.find(x => x.key === k2);
      setTimeout(() => { toast(`🏆 実績「${a.name}」 +${a.reward}G`); SFX.freeze(); }, 600 + i * 900);
    });
    knownAch = new Set(got);
    if (L.lv > (state.lastLevel || 1)) levelUp(state.lastLevel || 1, L.lv, c);
    if (L.lv !== state.lastLevel) { state.lastLevel = L.lv; save(); }
    collectNews(c);
  }

  function collectNews(c) {
    if (!state.onboarded) return;
    const t = todayKey(), y = addDays(t, -1);
    let added = 0;
    if (state.seenUntil < y) {
      c.events.filter(e => e.k > state.seenUntil && e.k <= y).forEach(e => { addMail(e); added++; });
      state.seenUntil = y;
    }
    const days = Object.keys(state.log).length;
    const since = state.lastBackup ? daysBetween(state.lastBackup, t) : null;
    const mailedAgo = state.backupMailed ? daysBetween(state.backupMailed, t) : 999;
    if (days >= 3 && (since === null || since >= 7) && mailedAgo >= 7) {
      addMail({ icon: '📦', title: 'バックアップのおすすめ', text: since === null ? '記録はこの端末の中にしかありません。消える前に保存しておきましょう。' : `最後のバックアップから${since}日経っています。`, action: 'backup' });
      state.backupMailed = t; added++;
    }
    if (added) { save(); renderBadge(); setTimeout(() => { toast(`📬 お知らせが${added}件あります`); SFX.mail(); }, 400); }
  }

  // ---------- 戦闘画面（主人公とボスが向き合う） ----------
  const STAGES = ['grass', 'cave', 'night', 'castle'];
  // 季節イベントの表示（開催中ならバナー、なければ次のイベント）
  function renderEvent(c) {
    const el = $('eventBar'), t = todayKey();
    const ev = c.evNow;
    if (ev) {
      const left = daysBetween(t, ev.end);
      el.className = 'event-bar on';
      el.style.borderColor = ev.color;
      el.innerHTML = `<span class="ev-ic">${ev.icon}</span><span class="grow"><b style="color:${ev.color}">${ev.name}イベント開催中</b><br><span class="small">${ev.perkText} ・ ${left ? `あと${left}日` : '今日まで'}</span></span><span class="arrow">▶</span>`;
    } else {
      const nx = E.next(t);
      el.className = 'event-bar';
      el.style.borderColor = '';
      el.innerHTML = `<span class="ev-ic">${nx.ev.icon}</span><span class="grow small dim">次のイベント：${nx.ev.name}（${md(nx.start)}から）</span><span class="arrow">▶</span>`;
    }
  }
  function openEvent() {
    SFX.tap();
    const t = todayKey(), ev = C.evNow;
    const rows = E.LIST.map(e => {
      const rw = e.reward.type === 'pet' ? P.PETS[e.reward.id].name : P.GEAR[e.reward.id].name;
      const now = ev && ev.key === e.key;
      return `<div class="card ${now ? 'ev-now' : ''}" style="${now ? `border-color:${e.color}` : ''}">
        <div class="ev-row">${E.bossSvg(e.boss.art, 48)}<div class="grow"><div><span>${e.icon}</span> <b style="color:${e.color}">${e.name}</b> <span class="dim small">${e.from[0]}/${e.from[1]}〜${e.to[0]}/${e.to[1]}</span>${now ? ' <span class="state-label on">開催中</span>' : ''}</div>
          <div class="small">限定ボス：${e.boss.name}</div><div class="small">特典：${e.perkText}</div><div class="small">討伐報酬：${EV_GEMS}💎・${rw}${C.evDefeated[e.key] ? ' <span class="g">（入手済み）</span>' : ''}</div></div></div></div>`;
    }).join('');
    openSheet('季節イベント', `${ev ? `<div class="mt8">${ev.intro}</div>` : '<div class="dim">今は開催中のイベントはありません。期間になると自動で始まります。</div>'}
      <div class="dim small mt8">期間中は限定ボスが現れ、いつもの週ボスにも同じダメージが入る。ペットガチャには限定品が出やすくなる。</div><div class="mt12">${rows}</div>`);
  }
  $('eventBar').addEventListener('click', openEvent);

  function renderBoss(c) {
    if (c.evNow && c.evBoss) return renderEventBoss(c);
    $('bossCard').style.borderColor = '';
    const b = c.boss, t = todayKey();
    const left = Math.max(0, b.hp - b.dmg);
    const daysLeft = 6 - ((dow(t) + 6) % 7);
    const gs = c.gearStats;
    $('bossCard').className = `card stage-card st-${STAGES[b.n % STAGES.length]} ${b.defeated ? 'dead' : ''}`;
    $('bossCard').innerHTML = `
      <div class="st-head"><span><span class="dim">${b.n + 1}体目</span> ${b.name}</span><span class="dim">${b.defeated ? '<span class="y">討伐済み</span>' : daysLeft ? `残り${daysLeft}日` : '今日まで'}</span></div>
      <div class="bar boss"><i style="width:${left / b.hp * 100}%"></i></div>
      <div class="st-sub"><span>HP ${left}/${b.hp}</span>
        <span>${!b.defeated && gs.burn ? `<span class="burn">🔥毎日−${Math.round(b.hp * gs.burn / 100)}</span> ` : ''}${!b.defeated && gs.poison ? `<span class="pois">☠毒${c.poison}</span> ` : ''}報酬 ${b.reward}EXP ${b.gold}G</span></div>
      <div class="stage" id="stage">
        ${c.pet ? `<div class="st-pet">${P.svg(c.pet, 34, petGearOn(t))}</div>` : ''}
        <div class="st-hero">${heroSvg(60)}</div>
        <div class="st-boss" id="bossPic">${S.boss(b.idx, 76)}</div>
        <div class="st-ground"></div>
        ${b.defeated ? '<div class="st-win">討伐！</div>' : ''}
      </div>`;
  }
  function renderEventBoss(c) {
    const ev = c.evNow, eb = c.evBoss, b = c.boss, t = todayKey();
    const left = Math.max(0, eb.hp - eb.dmg), wl = Math.max(0, b.hp - b.dmg);
    $('bossCard').className = `card stage-card st-ev-${ev.key} ${eb.defeated ? 'dead' : ''}`;
    $('bossCard').style.borderColor = ev.color;
    $('bossCard').innerHTML = `
      <div class="st-head"><span><span style="color:${ev.color}">${ev.icon}限定</span> ${ev.boss.name}</span><span class="dim">${eb.defeated ? '<span class="y">討伐済み</span>' : `${md(ev.end)}まで`}</span></div>
      <div class="bar boss evbar"><i style="width:${left / eb.hp * 100}%;background:${ev.color}"></i></div>
      <div class="st-sub"><span>HP ${left}/${eb.hp}</span><span>報酬 ${EV_GEMS}💎・限定品</span></div>
      <div class="stage" id="stage">
        ${c.pet ? `<div class="st-pet">${P.svg(c.pet, 34, petGearOn(t))}</div>` : ''}
        <div class="st-hero">${heroSvg(60)}</div>
        <div class="st-boss" id="bossPic">${E.bossSvg(ev.boss.art, 76)}</div>
        <div class="st-ground"></div>
        ${eb.defeated ? '<div class="st-win">討伐！</div>' : ''}
      </div>
      <div class="st-week small dim">今週のボス：${b.name} ${b.defeated ? '<span class="y">討伐済み</span>' : `HP ${wl}/${b.hp}`}</div>`;
  }
  // 攻撃の演出：主人公が踏み込み → 斬撃 → ボスがよろめく → ダメージの数字
  // 戦闘画面が、上のバーと下のタブの間に全部見えているか
  function stageInView(st) {
    const r = st.getBoundingClientRect();
    const top = document.querySelector('.top').getBoundingClientRect().bottom;
    const bottom = document.querySelector('.tabs').getBoundingClientRect().top;
    return r.height > 0 && r.top >= top - 4 && r.bottom <= bottom + 4;
  }
  // 見えていないときは、戦闘画面の複製を画面の真ん中に出して、そこで演出する
  function popupStage() {
    const card = $('bossCard'), src = $('stage');
    const pop = document.createElement('div');
    pop.className = 'battle-pop';
    const box = document.createElement('div');
    box.className = card.className + ' bp-card';
    box.style.borderColor = card.style.borderColor;
    const head = card.querySelector('.st-head'), bar = card.querySelector('.bar');
    if (head) box.appendChild(head.cloneNode(true));
    if (bar) box.appendChild(bar.cloneNode(true));
    const st = src.cloneNode(true);
    st.removeAttribute('id');
    st.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    st.querySelectorAll('.st-win').forEach(el => el.remove());
    box.appendChild(st);
    pop.appendChild(box);
    document.body.appendChild(pop);
    setTimeout(() => { pop.classList.add('out'); setTimeout(() => pop.remove(), 300); }, 1900);
    return st;
  }
  function playAttack(dmg, opts = {}) {
    let st = $('stage'); if (!st || dmg <= 0) return;
    if (!stageInView(st)) st = popupStage();
    const hero = st.querySelector('.st-hero'), boss = st.querySelector('.st-boss');
    const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
    if (opts.bomb) {
      const fx = document.createElement('div'); fx.className = 'st-boom'; st.appendChild(fx);
      setTimeout(() => fx.remove(), 700);
    } else restart(hero, 'atk');
    setTimeout(() => {
      if (!opts.bomb) { const sl = document.createElement('div'); sl.className = 'st-slash' + (opts.crit ? ' crit' : ''); st.appendChild(sl); setTimeout(() => sl.remove(), 400); }
      restart(boss, 'hit');
      const n = document.createElement('div');
      n.className = 'st-dmg' + (opts.crit ? ' crit' : '') + (opts.bomb ? ' bomb' : '');
      n.innerHTML = (opts.crit ? '<small>会心！</small>' : '') + dmg;
      st.appendChild(n); setTimeout(() => n.remove(), 1100);
      if (opts.crit || opts.bomb) restart(st, 'quake');
      if (opts.pet > 0) {
        const pt = st.querySelector('.st-pet');
        setTimeout(() => {
          if (pt) restart(pt, 'atk');
          const pn = document.createElement('div'); pn.className = 'st-dmg pet'; pn.textContent = '+' + opts.pet;
          st.appendChild(pn); setTimeout(() => pn.remove(), 1100);
        }, 380);
      }
      if (opts.killed) {
        restart(boss, 'dying');
        setTimeout(() => { if (!st.querySelector('.st-win')) { const w = document.createElement('div'); w.className = 'st-win'; w.textContent = '討伐！'; st.appendChild(w); } }, 500);
      }
    }, opts.bomb ? 120 : 220);
  }

  function renderToday(c, L) {
    const k = todayKey();
    const entries = state.log[k] || {};
    const tasks = currentIdsFor(k).map(id => state.tasks.find(t => t.id === id));
    const day = c.perDay[k] || { done: 0, recorded: false };
    const count = tasks.length;
    const bonusId = day.bonusId !== undefined ? day.bonusId : bonusIdOf(k, tasks.map(t => t.id));
    $('todayProg').textContent = count ? `${day.done}/${count}` : '';
    if (!count) {
      $('taskList').innerHTML = `<div class="dim" style="padding:8px 0">${activeTasks().length ? '今日は休みです。' : 'クエストがありません。'}</div>
        ${activeTasks().length ? '' : '<button class="btn full mt8" data-act="openQuests">クエストを追加</button>'}`;
    } else {
      $('taskList').innerHTML = tasks.map(t => {
        const v = entries[t.id], comp = completion(t, v), done = comp >= 1;
        const isBonus = t.id === bonusId, xpShow = t.xp * (isBonus ? 2 : 1);
        let sub = '', act = '', extra = '';
        if (t.type === 'check' || t.type === 'bed') {
          sub = `＋${xpShow}EXP`;
          act = done ? `<button class="btn green act" data-act="toggle" data-id="${t.id}">✓ クリア</button>`
            : `<button class="btn act" data-act="toggle" data-id="${t.id}">やった！</button>`;
        } else if (t.type === 'count') {
          sub = `${fmt(t.target)}${esc(t.unit)} ・ ＋${xpShow}EXP`;
          act = done ? `<button class="btn green act" data-act="fill" data-id="${t.id}">✓ クリア</button>`
            : `<button class="btn act" data-act="fill" data-id="${t.id}">完了</button>`;
          extra = `<div class="counter">
            <button class="btn gray" data-act="minus" data-id="${t.id}" aria-label="減らす">−</button>
            <div class="val">${fmt(v || 0)}<small> / ${fmt(t.target)}${esc(t.unit)}</small></div>
            <button class="btn gray" data-act="plus" data-id="${t.id}" aria-label="増やす">＋${fmt(t.step)}</button>
            <button class="btn sm gray" data-act="editCount" data-id="${t.id}" aria-label="数値を入力">✎</button></div>`;
        } else {
          sub = `${t.wake}までに起床 ・ ＋${xpShow}EXP`;
          act = v ? `<button class="btn ${done ? 'green' : 'gray'} act" data-act="editWake" data-id="${t.id}">${done ? '✓' : comp > 0 ? '△' : '✗'} ${v}</button>`
            : `<button class="btn act" data-act="now" data-id="${t.id}">起きた！</button>`;
        }
        return `<div class="task ${done ? 'done' : ''}"><div class="top-row">
          <div class="ic">${iconHtml(t.icon)}</div>
          <div class="grow"><div class="tn">${esc(taskName(t))}${isBonus ? ' <span class="bonus">★EXP2倍</span>' : ''}</div><div class="sub">${sub}</div></div>
          ${act}</div>${extra}</div>`;
      }).join('');
    }
    // 状況（1行）
    let left = '', right = '';
    if (count) {
      if (day.cleared) {
        left = `現在：<span class="y">達成</span>`;
        right = `<button class="btn sm blue" id="shareDay">Xでシェア</button>`;
      } else {
        const dmg = Math.round((day.recorded ? DMG_PARTIAL : DMG_NONE) * (1 - c.gearStats.def / 100));
        left = `現在：<span class="r">未達成</span>${c.freezes > 0 ? '<span class="b">（❄で回避）</span>' : `<span class="r">（HP−${dmg}）</span>`}`;
        right = `<span>あと<span class="y">${needFor(count) - day.done}個</span>で達成</span>`;
      }
    }
    $('dayLine').innerHTML = `<span>${left}</span>${right}`;
    $('dayLine').classList.toggle('hidden', !count);
    const sb = $('shareDay');
    if (sb) sb.onclick = () => share(`今日のクエストを達成！ Lv${L.lv}「${titleOf(L.lv)}」 🔥${c.streak}日連続 #LifeQuest`);
  }

  function renderStats(c, L) {
    $('heroBig').innerHTML = heroSvg(84);
    $('heroName2').textContent = state.name;
    $('titleTxt').textContent = `Lv${L.lv} ${titleOf(L.lv)}`;
    const gear = currentGear(), gs = c.gearStats;
    $('equipList').innerHTML = S.SLOTS.map(sl => { const x = G.get(gear[sl]); return `<div class="gear-row">${S.gearIcon(sl, x.art, 28, state.look)}
      <span class="dim gs">${G.SLOTS[sl].name}</span><span class="grow">${x.name}</span><span class="dim">${G.fxText(x)}</span></div>`; }).join('')
      + `<div class="gear-sum">攻撃 <span class="y">+${gs.atk}%</span>　最大HP <span class="y">${MAX_HP + gs.hp}</span>　被ダメージ <span class="y">−${gs.def}%</span>`
      + [gs.crit && `会心率+${gs.crit}%`, gs.exp && `EXP+${gs.exp}%`, gs.gold && `ゴールド+${gs.gold}%`, gs.burn && `🔥火傷${gs.burn}%`, gs.poison && `☠毒${gs.poison}%`, gs.freezeOnBoss && 'ボス討伐で❄', gs.guard && '氷竜の加護']
          .filter(Boolean).map(t => `<span class="chip-fx">${t}</span>`).join('')
      + Object.entries(gs.sets).map(([k, n]) => `<div class="small" style="color:${G.SETS[k].color}">${G.SETS[k].name} ${n}/6${n >= 3 ? `：${G.SETS[k].text3}` : ''}${n >= 6 ? `・${G.SETS[k].text6}` : ''}</div>`).join('') + '</div>';
    const max = Math.max(100, ...Object.values(c.cat));
    $('statList').innerHTML = Object.entries(CATS).map(([k, v]) => `<div class="stat"><span>${v.en}</span>
      <div class="bar"><i style="width:${c.cat[k] / max * 100}%;background:${v.color}"></i></div><span style="text-align:right">${Math.floor(c.cat[k] / 10)}</span></div>`).join('');
    $('kpis').innerHTML = [
      ['🔥 最長連続', `${c.best}日`], ['★ 達成日数', `${c.clearedDays}日`],
      ['⚔ ボス討伐', `${c.bossWins}体`], ['❄ 使用回数', `${c.frozenDays}回`],
      ['☠ 戦闘不能', `${c.knockouts}回`], ['累計EXP', c.total.toLocaleString()],
    ].map(([k, v]) => `<div>${k}<b>${v}</b></div>`).join('');
  }
  $('achBtn').addEventListener('click', () => {
    SFX.tap();
    const got = Object.keys(C.ach).length;
    openSheet(`実績（${got}/${ACH.length}）`, ACH.map(a => {
      const when = C.ach[a.key], cur = Math.min(C.st[a.stat], a.goal);
      return `<div class="ach ${when ? 'got' : ''}"><span class="ai">${when ? '🏆' : '・'}</span>
        <span class="grow">${a.name}<br><span class="dim">${when ? `${md(when)} 達成` : `${fmt(cur)} / ${fmt(a.goal)}`}</span></span>
        <span class="${when ? 'dim' : 'y'}">${a.reward}G</span></div>`;
    }).join(''));
  });
  $('titlesBtn').addEventListener('click', () => {
    SFX.tap();
    const lv = levelOf(C.total).lv;
    openSheet('称号一覧', TITLES.map(([l, n]) => `<div class="eq ${lv >= l ? '' : 'lock'}" style="font-size:15px;padding:6px 0"><span>${lv >= l ? '★ ' + n : '？？？'}</span><span>Lv${l}</span></div>`).join(''));
  });

  function renderLog(c) {
    const t = todayKey();
    const end = addDays(t, 6 - dow(t)), start = addDays(end, -34);
    let html = WD.split('').map(w => `<div class="h">${w}</div>`).join('');
    for (let i = 0; i < 35; i++) {
      const k = addDays(start, i), p = c.perDay[k];
      let bg = '', fg = '', label = parseKey(k).getDate();
      if (p) {
        if (p.status === 'cleared') { bg = p.done >= p.count ? 'var(--g)' : '#1f8a4c'; fg = '#000'; }
        else if (p.status === 'frozen') { bg = '#1e5a8a'; fg = '#fff'; label = '❄'; }
        else if (p.status === 'damage') { bg = '#8a1f2c'; fg = '#fff'; }
        else if (p.status === 'rest') bg = '#2a2a4a';
      }
      html += `<div class="d" style="${bg ? `background:${bg};` : ''}${fg ? `color:${fg};` : ''}${k > t ? 'opacity:.25;' : ''}${k === t ? 'outline:2px solid var(--y);' : ''}">${label}</div>`;
    }
    $('cal').innerHTML = html;
    $('legend').innerHTML = [['var(--g)', '全クリア'], ['#1f8a4c', '達成'], ['#1e5a8a', '❄で回避'], ['#8a1f2c', 'ダメージ']].map(([c2, n]) => `<span><i style="background:${c2}"></i>${n}</span>`).join('');

    const wins = Array(S.BOSSES.length).fill(0), seen = Array(S.BOSSES.length).fill(false);
    Object.values(c.bosses).forEach(b => { seen[b.idx] = true; if (b.defeated) wins[b.idx]++; });
    $('dexCount').textContent = `${wins.filter(Boolean).length}/${S.BOSSES.length}`;
    $('evDex').innerHTML = E.LIST.map(e => `<div>${E.bossSvg(e.boss.art, 42, { silhouette: !c.evDefeated[e.key] })}<div class="${c.evDefeated[e.key] ? 'n' : ''}">${c.evDefeated[e.key] ? e.boss.name : `${e.icon}${e.name}`}</div></div>`).join('');
    $('dex').innerHTML = S.BOSS_ORDER.map((i, no) => `<div><div class="dim">No.${no + 1}</div>${S.boss(i, 42, !wins[i])}<div class="${wins[i] ? 'n' : ''}">${wins[i] ? S.BOSSES[i].name : seen[i] ? '？？？' : '・・・'}</div>${wins[i] > 1 ? `<div class="y">×${wins[i]}</div>` : ''}</div>`).join('');

    const wakeTask = state.tasks.find(x => x.type === 'wake' && !x.archivedAt) || state.tasks.find(x => x.type === 'wake');
    const svg = $('wakeChart');
    if (!wakeTask) { svg.closest('.card').classList.add('hidden'); return; }
    svg.closest('.card').classList.remove('hidden');
    const pts = [];
    for (let i = 13; i >= 0; i--) {
      const k = addDays(t, -i);
      const v = state.tasks.filter(x => x.type === 'wake').map(x => state.log[k]?.[x.id]).find(Boolean);
      pts.push({ k, m: v ? toMin(v) : null });
    }
    const goal = toMin(wakeTask.wake);
    const vals = pts.filter(p => p.m != null).map(p => p.m).concat(goal);
    const lo = Math.floor((Math.min(...vals) - 30) / 60) * 60, hi = Math.ceil((Math.max(...vals) + 30) / 60) * 60;
    const X = i => 34 + i * (276 / 13), Y = m => 10 + (m - lo) / (hi - lo) * 110;
    const step = hi - lo > 360 ? 120 : 60;
    let s = '';
    for (let h = lo; h <= hi; h += step) s += `<line x1="34" x2="310" y1="${Y(h)}" y2="${Y(h)}" stroke="#ffffff22"/><text x="28" y="${Y(h) + 4}" fill="#9a9ad0" font-size="10" text-anchor="end">${h / 60}時</text>`;
    s += `<line x1="34" x2="310" y1="${Y(goal)}" y2="${Y(goal)}" stroke="#fce35a" stroke-dasharray="4 3"/>`;
    pts.forEach((p, i) => { if (p.m != null) s += `<rect x="${X(i) - 4}" y="${Y(p.m) - 4}" width="8" height="8" fill="${p.m <= goal ? '#3cdc6c' : '#ff4a4a'}"/>`; });
    s += `<text x="34" y="136" fill="#9a9ad0" font-size="9">${md(pts[0].k)}</text><text x="310" y="136" fill="#9a9ad0" font-size="9" text-anchor="end">今日</text>`;
    svg.innerHTML = s;
  }

  function levelUp(from, to, c) {
    const lines = [];
    const tNew = titleOf(to);
    if (tNew !== titleOf(from)) lines.push(`称号「<span class="y">${tNew}</span>」`);
    if (slotsFor(to) > slotsFor(from)) lines.push(`クエスト枠が<span class="y">${slotsFor(to)}</span>に増えた`);
    lines.push(`ボーナス <span class="y">${(to - from) * GOLD_LEVEL}G・${(to - from) * GEM_LEVEL}💎</span>`);
    const fruits = Array.from({ length: to - from }, (_, i) => from + 1 + i).filter(l => l % 5 === 0).length;
    lines.push(`ペットの餌 <span class="y">干し肉×${(to - from) * 2}${fruits ? `・竜の果実×${fruits}` : ''}</span>`);
    if (from < P.UNLOCK_LV && to >= P.UNLOCK_LV) lines.push(`<span class="y">${P.PETS.slime.name}が仲間になった！</span>`);
    $('lvHero').innerHTML = heroSvg(96);
    $('lvModalNum').textContent = to;
    $('lvModalInfo').innerHTML = lines.join('<br>') || '力がみなぎる！';
    $('lvShare').onclick = () => share(`Life QuestでLv${to}「${tNew}」になった！ 🔥${c.streak}日連続 #LifeQuest`);
    $('lvModal').classList.remove('hidden');
    addMail({ icon: '★', title: `Lv${to}になった`, text: lines.join('・').replace(/<[^>]+>/g, '') });
    flash(); SFX.level(); vibrate([80, 60, 80, 60, 200]);
  }
  $('lvClose').addEventListener('click', () => { SFX.tap(); $('lvModal').classList.add('hidden'); });

  // ---------- ショップ（装備・アイテム・ガチャ・ジェム） ----------
  let shopTab = 'gear', shopSlot = 'sword', tryOn = null;
  const stars = r => '★'.repeat(r);
  function renderShop(c) {
    const gear = currentGear();
    const preview = Object.assign({}, gear);
    if (tryOn) preview[G.get(tryOn).slot] = tryOn;
    const now = c.gearStats, after = G.stats(preview);
    const diff = (a, b, unit, sign = '+') => a === b ? '' : ` <span class="${b > a ? 'g' : 'r'}">${b > a ? '▲' : '▼'}${sign}${b}${unit}</span>`;
    $('shopHero').innerHTML = heroSvg(84, preview);
    $('shopGold').textContent = c.gold.toLocaleString();
    $('shopGems').textContent = c.gems.toLocaleString();
    $('shopTabs').innerHTML = [['gear', '装備'], ['item', 'アイテム'], ['gacha', 'ガチャ'], ['pet', 'ペット'], ['gem', 'ジェム']]
      .map(([k, n]) => `<button class="btn ${k === shopTab ? 'on' : ''}" data-stab="${k}">${n}</button>`).join('');
    $('shopStats').innerHTML = shopTab === 'gear'
      ? `攻撃 +${now.atk}%${diff(now.atk, after.atk, '%')}<br>最大HP ${MAX_HP + now.hp}${diff(now.hp, after.hp, '', '')}<br>被ダメージ −${now.def}%${diff(now.def, after.def, '%', '−')}`
      : '';
    $('tryNote').innerHTML = shopTab !== 'gear' ? '' : tryOn ? `<span class="y">試着中：${G.get(tryOn).name}</span>` : '<span class="dim">装備をタップすると試着できます</span>';
    let html = '';
    if (shopTab === 'gear') {
      html = `<div class="seg wrap-seg mt8">${S.SLOTS.map(sl => `<button class="btn ${sl === shopSlot ? 'on' : ''}" data-slot="${sl}">${G.SLOTS[sl].name}</button>`).join('')}</div>`;
      html += `<div class="dim" style="margin:10px 2px 4px">${G.SLOTS[shopSlot].name}（${G.SLOTS[shopSlot].kind}）</div>` + G.LIST.filter(x => x.slot === shopSlot).map(x => {
        const own = owns(x.id), worn = gear[x.slot] === x.id;
        const btn = worn ? '<span class="state-label on">装備中</span>'
          : own ? `<button class="btn sm blue" data-equip="${x.id}">装備する</button>`
          : x.gacha ? '<span class="dim small">ガチャ限定</span>'
          : `<button class="btn sm" data-buy="${x.id}" ${c.gold < x.price ? 'disabled' : ''}>${x.price}G</button>`;
        const rare = x.gacha ? `<span class="rare r${x.rarity}">${stars(x.rarity)}</span> ` : '';
        return `<div class="card item ${tryOn === x.id ? 'trying' : ''} ${x.gacha && !own ? 'locked' : ''}" data-try="${x.id}">
          <div class="item-ic ${x.gacha ? 'r' + x.rarity : ''}">${S.gearIcon(x.slot, x.art, 40, state.look)}</div>
          <div class="grow"><div>${rare}${x.name}${own && !worn && !x.gacha ? ' <span class="dim">所持</span>' : ''}</div><div class="dim">${G.fxText(x)}</div>${x.set ? `<div class="setname" style="color:${G.SETS[x.set].color}">${G.SETS[x.set].name}セット</div>` : ''}</div>${btn}</div>`;
      }).join('');
    } else if (shopTab === 'item') {
      html = `<div class="dim" style="margin:10px 2px 4px">買ったアイテムは右上の👜から使えます</div>` + Object.entries(G.ITEMS).map(([id, it]) => `<div class="card item">
        <div class="item-ic">${S.icon(it.icon, 32)}</div>
        <div class="grow"><div>${it.name} <span class="dim">所持 ${itemCount(id)}</span></div><div class="dim">${it.desc}</div></div>
        <button class="btn sm" data-ibuy="${id}" ${c.gold < it.price ? 'disabled' : ''}>${it.price}G</button></div>`).join('');
    } else if (shopTab === 'pet') {
      if (!c.petUnlock) html = `<div class="card center"><div>${P.svg('slime', 64, null, { silhouette: true })}</div><div class="mt8">Lv${P.UNLOCK_LV}でペットが仲間になると使えます</div></div>`;
      else {
        const Q = P.GACHA;
        html = `<div class="card gacha-banner pet-banner"><div class="gb-title">ペットガチャ</div>
          <div class="pet-line">${Object.keys(P.PETS).filter(id => P.PETS[id].rarity >= 4).map(id => `<div>${P.svg(id, 40)}<div class="rare r${P.PETS[id].rarity}">${stars(P.PETS[id].rarity)}</div></div>`).join('')}</div>
          <div class="dim small center">ペット ${Q.table[0][2] + Q.table[1][2]}%・ペット装備 ${Q.table[2][2]}%・餌 ${Q.table.slice(3).reduce((a, t) => a + t[2], 0)}%　／　ペット確定まであと<span class="y">${Q.pity - petPityCount()}</span>回</div>
          <div class="row mt12"><button class="btn" data-ppull="1:gold" ${c.gold < Q.gold1 ? 'disabled' : ''}>1回 ${S.icon('coin', 14)}${Q.gold1}</button>
            <button class="btn" data-ppull="10:gold" ${c.gold < Q.gold10 ? 'disabled' : ''}>10回 ${S.icon('coin', 14)}${Q.gold10}</button></div>
          <div class="row mt8"><button class="btn blue" data-ppull="1:gem" ${c.gems < Q.gem1 ? 'disabled' : ''}>1回 ${S.icon('gem', 14)}${Q.gem1}</button>
            <button class="btn blue" data-ppull="10:gem" ${c.gems < Q.gem10 ? 'disabled' : ''}>10回 ${S.icon('gem', 14)}${Q.gem10}</button></div>
          <div class="row mt8"><button class="btn sm gray" data-prates="1">提供割合</button><button class="btn sm gray" data-phist="1">履歴</button></div></div>
          <div class="dim" style="margin:10px 2px 4px">餌</div>`
          + (c.evNow ? `<div class="card ev-note" style="border-color:${c.evNow.color}">${c.evNow.icon} ${c.evNow.name}イベント中：「${c.evNow.reward.type === 'pet' ? P.PETS[c.evNow.reward.id].name : P.GEAR[c.evNow.reward.id].name}」がガチャで出やすい</div>` : '')
          + Object.entries(P.FOODS).filter(([, f]) => !f.limited || (c.evNow && c.evNow.food && P.FOODS[c.evNow.food] === f)).map(([fid, f]) => `<div class="card item"><div class="item-ic">${S.icon(f.icon, 32)}</div>
            <div class="grow"><div>${f.name} <span class="dim">所持 ${foodCount(fid)}</span></div><div class="dim">ペットの経験値+${f.exp}</div></div>
            <button class="btn sm" data-fbuy="${fid}" ${c.gold < f.price ? 'disabled' : ''}>${f.price}G</button></div>`).join('');
      }
    } else if (shopTab === 'gacha') {
      const pity = G.GACHA.pity - pityCount();
      html = `<div class="card gacha-banner">
          <div class="gb-title">伝説の装備ガチャ</div>
          <div class="gb-heroes">${['fire', 'dark', 'ice'].map(k => `<div>${S.hero({ head: k, chest: k, legs: k, feet: k, sword: k, shield: k }, 64, state.look, k)}<div class="small" style="color:${G.SETS[k].color}">${G.SETS[k].name}</div></div>`).join('')}</div>
          <div class="dim small center">★5 ${G.GACHA.rates[5]}%・★4 ${G.GACHA.rates[4]}%・★3 ${G.GACHA.rates[3]}%　／　★5確定まであと<span class="y">${pity}</span>回</div>
          <div class="row mt12"><button class="btn blue" data-pull="1" ${c.gems < G.GACHA.cost1 ? 'disabled' : ''}>1回 ${S.icon('gem', 14)}${G.GACHA.cost1}</button>
            <button class="btn" data-pull="10" ${c.gems < G.GACHA.cost10 ? 'disabled' : ''}>10連 ${S.icon('gem', 14)}${G.GACHA.cost10}</button></div>
          <div class="dim small center mt8">10連は★4以上が1つ確定</div>
          <div class="row mt8"><button class="btn sm gray" data-rates="1">提供割合</button><button class="btn sm gray" data-sets="1">セット効果</button><button class="btn sm gray" data-hist="1">履歴</button></div>
        </div>`;
    } else {
      html = `<div class="card"><div class="dim">ジェムは、達成した日（${GEM_CLEAR}💎）・ボス討伐（${GEM_BOSS}💎）・実績（${GEM_ACH}💎）・レベルアップ（${GEM_LEVEL}💎）でも手に入ります。</div></div>`
        + PACKS.map(p => `<div class="card item"><div class="item-ic">${S.icon(p.icon, 32)}</div>
          <div class="grow"><div>${p.name}</div><div class="dim">${p.desc}</div></div>
          <button class="btn sm" disabled>${p.yen}</button></div>`).join('')
        + '<div class="dim center small mt8">購入機能は準備中です（ログイン機能と一緒に追加予定）</div>';
    }
    $('shopList').innerHTML = html;
  }
  // 課金パック（購入は準備中）
  const PACKS = [
    { icon: 'gem', name: 'ジェム 100', desc: 'ガチャ2回分', yen: '¥160' },
    { icon: 'gem', name: 'ジェム 500', desc: 'ガチャ10回分＋α', yen: '¥800' },
    { icon: 'gem', name: 'ジェム 1,200', desc: 'お得パック', yen: '¥1,600' },
    { icon: 'goldbag', name: 'ゴールド 3,000', desc: '装備やアイテムの購入に', yen: '¥320' },
  ];
  function equip(id) {
    const x = G.get(id), t = todayKey();
    state.gearLog = state.gearLog.filter(e => !(e.k === t && e.slot === x.slot));
    state.gearLog.push({ k: t, slot: x.slot, id });
    tryOn = null; save(); render();
  }
  $('tab-shop').addEventListener('click', e => {
    const el = e.target.closest('[data-stab],[data-slot],[data-equip],[data-buy],[data-ibuy],[data-pull],[data-rates],[data-sets],[data-hist],[data-ppull],[data-fbuy],[data-prates],[data-phist],[data-try]'); if (!el) return;
    if (el.disabled) return;
    SFX.tap();
    const d = el.dataset;
    if (d.stab) { shopTab = d.stab; tryOn = null; return renderShop(C); }
    if (d.slot) { shopSlot = d.slot; tryOn = null; return renderShop(C); }
    if (d.equip) { equip(d.equip); say(`${G.get(d.equip).name}を装備した！`); return; }
    if (d.buy) {
      const x = G.get(d.buy);
      return confirmBuy(S.gearIcon(x.slot, x.art, 40, state.look), x.name, G.fxText(x), x.price, () => {
        state.owned.push(x.id); state.buys.push({ k: todayKey(), id: x.id, price: x.price });
        equip(x.id);
        say(`${x.name}を手に入れた！<br>さっそく装備した。`); SFX.clear(); flash(); vibrate([40, 30, 80]);
      });
    }
    if (d.ibuy) {
      const it = G.ITEMS[d.ibuy];
      return confirmBuy(S.icon(it.icon, 40), it.name, it.desc, it.price, () => {
        state.itemBuys.push({ k: todayKey(), id: d.ibuy, price: it.price }); save(); render();
        say(`${it.name}を買った！`); SFX.done();
      });
    }
    if (d.pull) return pullGacha(Number(d.pull));
    if (d.ppull) { const [n, cur] = d.ppull.split(':'); return pullPet(Number(n), cur); }
    if (d.fbuy) {
      const f = P.FOODS[d.fbuy];
      return confirmBuy(S.icon(f.icon, 40), f.name, `ペットの経験値+${f.exp}`, f.price, () => {
        state.foodBuys.push({ k: todayKey(), id: d.fbuy, price: f.price }); save(); render(); say(`${f.name}を買った！`); SFX.done();
      });
    }
    if (d.prates) {
      const T = P.GACHA.table, tot = T.reduce((a, t) => a + t[2], 0);
      const p5 = Object.keys(P.PETS).filter(id => P.PETS[id].rarity === 5), p4 = Object.keys(P.PETS).filter(id => P.PETS[id].rarity === 4), gl = Object.keys(P.GEAR);
      return openSheet('ペットガチャの提供割合', `<div class="dim">${P.GACHA.pity}回引くとペット確定。持っているペット・装備が出たら餌に変わる（ペット→竜の果実×2、装備→魔法のクッキー×2）。</div>
        <div class="card-h mt12"><span>★5 ペット</span></div>${p5.map(id => `<div class="eq"><span>${P.PETS[id].name}</span><span>${(T[0][2] / tot * 100 / p5.length).toFixed(2)}%</span></div>`).join('')}
        <div class="card-h mt12"><span>★4 ペット</span></div>${p4.map(id => `<div class="eq"><span>${P.PETS[id].name}</span><span>${(T[1][2] / tot * 100 / p4.length).toFixed(2)}%</span></div>`).join('')}
        <div class="card-h mt12"><span>ペット装備</span></div>${gl.map(id => `<div class="eq"><span>${P.GEAR[id].name}</span><span>${(T[2][2] / tot * 100 / gl.length).toFixed(2)}%</span></div>`).join('')}
        <div class="card-h mt12"><span>餌</span></div>${T.slice(3).map(t => `<div class="eq"><span>${P.FOODS[t[1]].name}</span><span>${(t[2] / tot * 100).toFixed(2)}%</span></div>`).join('')}`);
    }
    if (d.phist) {
      const list = state.pulls.filter(p => p.gacha === 'pet').slice(-50).reverse();
      return openSheet('ペットガチャ履歴', list.length ? list.map(p => `<div class="eq"><span>${resultName(p)}</span><span class="dim">${md(p.k)}</span></div>`).join('') : '<div class="dim">まだ引いていません</div>');
    }
    if (d.rates) return openRates();
    if (d.sets) return openSets();
    if (d.hist) return openHistory();
    if (d.try) { const x = G.get(d.try); if (x.gacha && !owns(x.id)) { tryOn = tryOn === d.try ? null : d.try; return renderShop(C); } tryOn = tryOn === d.try ? null : d.try; renderShop(C); }
  });
  function confirmBuy(icon, name, desc, price, done) {
    openSheet('購入の確認', `<div class="edit-head">${icon}<span>${name}</span></div>
      <div class="dim mt8">${desc}</div>
      <div class="mt12">${price}Gで購入しますか？（所持 ${C.gold.toLocaleString()}G）</div>
      <div class="row mt12"><button class="btn gray" id="byNo">やめる</button><button class="btn" id="byYes">購入する</button></div>`, body => {
      body.querySelector('#byNo').onclick = closeSheet;
      body.querySelector('#byYes').onclick = () => {
        if (C.gold < price) { toast('ゴールドが足りません'); return; }
        closeSheet(); done();
      };
    });
  }
  $('equipBtn').addEventListener('click', () => { SFX.tap(); shopTab = 'gear'; showTab('shop'); });

  // ---------- ガチャ ----------
  // 最後に★5が出てから何回引いたか（天井用）
  function pityCount() {
    let n = 0;
    const list = state.pulls.filter(p => p.gacha !== 'pet');
    for (let i = list.length - 1; i >= 0; i--) { if (list[i].r === 5) break; n++; }
    return n;
  }
  function rollOne(minRarity) {
    const R = G.GACHA.rates;
    let x = Math.random() * 100;
    let r = x < R[5] ? 5 : x < R[5] + R[4] ? 4 : 3;
    if (pityCount() + 1 >= G.GACHA.pity) r = 5;
    if (minRarity && r < minRarity) r = minRarity;
    if (r >= 4) {
      const pool = G.gachaGear(r);
      const g = pool[Math.floor(Math.random() * pool.length)];
      const dup = state.owned.includes(g.id) || state.pulls.some(p => p.id === g.id);
      return { k: todayKey(), r, type: 'gear', id: g.id, refund: dup ? G.GACHA.dupGems[r] : 0 };
    }
    const tbl = G.GACHA.r3, total = tbl.reduce((a, t) => a + t[2], 0);
    let y = Math.random() * total;
    for (const [type, val, w] of tbl) {
      if ((y -= w) < 0) return type === 'gold' ? { k: todayKey(), r: 3, type: 'gold', amount: val } : { k: todayKey(), r: 3, type: 'item', id: val };
    }
    return { k: todayKey(), r: 3, type: 'gold', amount: 300 };
  }
  function pullGacha(n) {
    const cost = n === 10 ? G.GACHA.cost10 : G.GACHA.cost1;
    if (C.gems < cost) { toast('ジェムが足りません'); return; }
    const res = [];
    for (let i = 0; i < n; i++) {
      const need4 = n === 10 && i === n - 1 && !res.some(p => p.r >= 4);
      const p = rollOne(need4 ? 4 : 0);
      state.pulls.push(p); res.push(p);
      if (p.type === 'gear' && !p.refund) state.owned.push(p.id);
    }
    state.gachaLog.push({ k: todayKey(), n, cost });
    save();
    showGachaResult(res);
    render();
  }
  const resultIcon = (p, size) => p.type === 'pet' ? P.svg(p.id, size) : p.type === 'petgear' ? P.gearSvg(p.id, size) : p.type === 'food' ? S.icon(P.FOODS[p.id].icon, size)
    : p.type === 'gear' ? S.gearIcon(G.get(p.id).slot, G.get(p.id).art, size, state.look)
    : p.type === 'gold' ? S.icon('goldbag', size) : S.icon(G.ITEMS[p.id].icon, size);
  const resultName = p => p.type === 'pet' ? P.PETS[p.id].name : p.type === 'petgear' ? P.GEAR[p.id].name
    : p.type === 'food' ? `${P.FOODS[p.id].name}${p.n > 1 ? '×' + p.n : ''}`
    : p.type === 'gear' ? G.get(p.id).name : p.type === 'gold' ? `${p.amount}ゴールド` : G.ITEMS[p.id].name;
  const resultNote = p => p.refund ? `<div class="g-dup">重複→${p.refund}💎</div>`
    : p.dupPet ? `<div class="g-dup">${P.PETS[p.dupPet].name}（重複）</div>` : p.dupGear ? `<div class="g-dup">${P.GEAR[p.dupGear].name}（重複）</div>`
    : ['gear', 'pet', 'petgear'].includes(p.type) ? '<div class="g-new">NEW</div>' : '';
  function showGachaResult(res) {
    const best = Math.max(...res.map(p => p.r));
    const box = $('gachaBox');
    $('gacha').className = `gacha best${best}`;
    box.innerHTML = `<div class="g-chest">${S.icon('chest', 96)}</div><div class="dim center mt12">タップで開ける</div>`;
    SFX.tap();
    let opened = false;
    const open = () => {
      if (opened) return; opened = true;
      $('gacha').classList.add('open');
      if (best === 5) { SFX.level(); vibrate([80, 40, 80, 40, 300]); } else if (best === 4) { SFX.clear(); vibrate([60, 40, 120]); } else SFX.done();
      flash();
      setTimeout(() => {
        box.innerHTML = `<div class="g-title">${res.some(p => p.type === 'pet') ? 'ペットが仲間になった！' : best === 5 ? '★5 伝説の装備！' : best === 4 ? '★4 獲得！' : 'ガチャ結果'}</div>
          <div class="g-grid ${res.length === 1 ? 'one' : ''}">${res.map((p, i) => `<div class="g-card r${p.r}" style="animation-delay:${i * 90}ms">
            <div class="g-ic">${resultIcon(p, res.length === 1 ? 72 : 40)}</div>
            <div class="g-st">${stars(p.r)}</div><div class="g-nm">${resultName(p)}</div>
            ${resultNote(p)}</div>`).join('')}</div>
          <div class="row mt12">${res.some(p => p.type === 'gear' && !p.refund) ? '<button class="btn blue" id="gEquip">装備を見る</button>' : ''}<button class="btn" id="gClose">閉じる</button></div>`;
        const ge = $('gEquip');
        if (ge) ge.onclick = () => { const p = res.find(q => q.type === 'gear' && !q.refund); $('gacha').classList.add('hidden'); shopTab = 'gear'; shopSlot = G.get(p.id).slot; tryOn = p.id; renderShop(C); };
        $('gClose').onclick = () => { $('gacha').classList.add('hidden'); SFX.tap(); };
      }, 500);
    };
    box.onclick = open;
    setTimeout(open, 1600);
  }
  function openRates() {
    const R = G.GACHA.rates, t3 = G.GACHA.r3.reduce((a, t) => a + t[2], 0);
    const g5 = G.gachaGear(5), g4 = G.gachaGear(4);
    openSheet('提供割合', `<div class="dim">★5 ${R[5]}% ／ ★4 ${R[4]}% ／ ★3 ${R[3]}%。${G.GACHA.pity}回引くと★5確定。10連は★4以上が1つ確定。同じ装備が出たらジェムに変換（★5は${G.GACHA.dupGems[5]}💎、★4は${G.GACHA.dupGems[4]}💎）。</div>
      <div class="card-h mt12"><span>★5</span></div>${g5.map(x => `<div class="eq"><span>${x.name}</span><span>${(R[5] / g5.length).toFixed(2)}%</span></div>`).join('')}
      <div class="card-h mt12"><span>★4</span></div>${g4.map(x => `<div class="eq"><span>${x.name}</span><span>${(R[4] / g4.length).toFixed(2)}%</span></div>`).join('')}
      <div class="card-h mt12"><span>★3</span></div>${G.GACHA.r3.map(([type, v, w]) => `<div class="eq"><span>${type === 'gold' ? v + 'ゴールド' : G.ITEMS[v].name}</span><span>${(R[3] * w / t3).toFixed(2)}%</span></div>`).join('')}`);
  }
  function openSets() {
    openSheet('セット効果', Object.entries(G.SETS).map(([k, st]) => `<div class="card" style="border-color:${st.color}">
      <div style="display:flex;gap:10px;align-items:center">${S.hero({ head: k, chest: k, legs: k, feet: k, sword: k, shield: k }, 60, state.look, k)}
      <div class="grow"><div style="color:${st.color}">${st.name}</div><div class="small">3部位：${st.text3}</div><div class="small">6部位：${st.text6}</div></div></div></div>`).join(''));
  }
  function openHistory() {
    const list = state.pulls.filter(p => p.gacha !== 'pet').slice(-50).reverse();
    openSheet('ガチャ履歴', list.length ? list.map(p => `<div class="eq"><span><span class="rare r${p.r}">${stars(p.r)}</span> ${resultName(p)}${p.refund ? ` <span class="dim">（${p.refund}💎）</span>` : ''}</span><span class="dim">${md(p.k)}</span></div>`).join('') : '<div class="dim">まだ引いていません</div>');
  }

  // ---------- 週間クエスト・今月の目標 ----------
  function renderGoals(c) {
    const t = todayKey(), left = 6 - ((dow(t) + 6) % 7);
    const wrow = q => {
      const rw = `+${q.xp}EXP・${q.g}G・${q.gem}💎`;
      const right = q.manual
        ? (q.done ? `<button class="btn sm green" data-wq="${q.key}">✓ 完了</button>` : `<button class="btn sm" data-wq="${q.key}">やった！</button>`)
        : `<span class="dim">${q.done ? '<span class="g">✓ クリア</span>' : `${fmtNum(Math.min(q.cur, q.goal))}/${fmtNum(q.goal)}`}</span>`;
      return `<div class="wq ${q.done ? 'done' : ''}"><div class="ic">${iconHtml(q.icon, 22)}</div>
        <div class="grow"><div class="wq-name"><span class="wq-kind k-${q.kind}">${WQ_KIND[q.kind]}</span>${esc(q.name)}</div>
          ${q.manual ? '' : `<div class="bar goalbar"><i style="width:${Math.min(100, q.cur / q.goal * 100)}%"></i></div>`}
          <div class="goal-rw">${q.done ? '<span class="dim">報酬を受け取った</span>' : rw}</div></div>${right}</div>`;
    };
    const mrow = g => {
      const [gg, gm] = GOAL_REWARD.month;
      return `<div class="goal ${g.done ? 'done' : ''}"><div class="goal-top"><span>${g.done ? '✓ ' : ''}${esc(g.name)}</span>
        <span class="dim">${g.done ? '達成' : `${fmtNum(Math.min(g.cur, g.goal))}/${fmtNum(g.goal)}`}</span></div>
        <div class="bar goalbar"><i style="width:${Math.min(100, g.cur / g.goal * 100)}%"></i></div>
        <div class="goal-rw">${g.done ? '<span class="dim">報酬を受け取った</span>' : `報酬 ${gg}G・${gm}💎`}</div></div>`;
    };
    const doneN = c.goals.week.filter(q => q.done).length;
    $('goalCard').innerHTML = `<div class="card-h"><span>週間クエスト <span class="prog">${doneN}/${c.goals.week.length}</span></span><span class="dim">${left ? `あと${left}日` : '今日まで'}</span></div>${c.goals.week.map(wrow).join('')}
      <div class="card-h mt12"><span>今月の目標</span></div>${c.goals.month.map(mrow).join('')}`;
  }
  // 「たまに」の週間クエストを記録・取り消し（同じ週の間だけ）
  $('goalCard').addEventListener('click', e => {
    const b = e.target.closest('[data-wq]'); if (!b) return;
    const t = todayKey(), ws = weekStart(t), key = b.dataset.wq;
    const i = state.weeklyDone.findIndex(x => x.ws === ws && x.key === key);
    if (i >= 0) state.weeklyDone.splice(i, 1); else state.weeklyDone.push({ ws, key, k: t });
    save(); render();
    const q = C.goals.week.find(x => x.key === key);
    if (i < 0) { say(`週間クエスト「${esc(q.name)}」クリア！<br>+${q.xp}EXP・${q.g}G・${q.gem}💎`); SFX.clear(); vibrate([40, 30, 80]); }
    else SFX.undo();
  });

  // ---------- 昨日の記録（週に2回まで） ----------
  const RETRO_MAX = 2;
  function retroLeft() {
    const t = todayKey(), ws = weekStart(t);
    if (state.retro.some(r => r.k === t)) return { left: RETRO_MAX - state.retro.filter(r => weekStart(r.k) === ws).length, usedToday: true };
    return { left: RETRO_MAX - state.retro.filter(r => weekStart(r.k) === ws).length, usedToday: false };
  }
  function openRetro() {
    SFX.tap();
    const y = addDays(todayKey(), -1);
    if (y < state.start) { toast('昨日はまだ冒険を始めていません'); return; }
    const ids = (state.sched[y] || currentIdsFor(y)).filter(id => state.tasks.some(t => t.id === id));
    const r = retroLeft();
    const can = r.usedToday || r.left > 0;
    const e = state.log[y] || {};
    openSheet(`昨日（${md(y)}）の記録`, `<div class="dim">記録し忘れた分を追加・修正できます。${r.usedToday ? '今日はもう使っているので、続けて修正できます。' : `今週はあと<span class="y">${Math.max(0, r.left)}回</span>使えます（週に${RETRO_MAX}回まで）。`}</div>
      ${ids.map(id => {
        const t = state.tasks.find(x => x.id === id), v = e[id], done = isDone(t, v);
        let ctl = '';
        if (t.type === 'check' || t.type === 'bed') ctl = `<button class="btn sm ${done ? 'green' : ''}" data-r="toggle" data-id="${id}" ${can ? '' : 'disabled'}>${done ? '✓ クリア' : 'やった'}</button>`;
        else if (t.type === 'count') ctl = `<input type="number" inputmode="decimal" min="0" step="any" class="rinput" data-r="count" data-id="${id}" value="${v ?? ''}" placeholder="0" ${can ? '' : 'disabled'}><span class="dim">/${fmt(t.target)}${esc(t.unit)}</span>`;
        else ctl = `<input type="time" class="rinput" data-r="wake" data-id="${id}" value="${v ?? ''}" ${can ? '' : 'disabled'}>`;
        return `<div class="list-row"><div class="ic">${iconHtml(t.icon, 22)}</div><div class="grow">${esc(taskName(t))}</div>${ctl}</div>`;
      }).join('') || '<div class="dim">昨日のクエストはありません</div>'}
      ${can ? '' : '<div class="r center mt8">今週はもう使えません</div>'}`, body => {
      const apply = (id, v) => {
        if (!retroLeft().usedToday) state.retro.push({ k: todayKey(), day: y });
        setEntry(id, v, y);
        openRetro();
      };
      body.onclick = ev => { const b = ev.target.closest('[data-r=toggle]'); if (b && !b.disabled) apply(b.dataset.id, !(state.log[y] || {})[b.dataset.id]); };
      body.onchange = ev => {
        const el = ev.target; if (!el.dataset.r) return;
        if (el.dataset.r === 'count') apply(el.dataset.id, el.value === '' ? null : Math.max(0, Number(el.value)));
        if (el.dataset.r === 'wake') apply(el.dataset.id, el.value || null);
      };
    });
  }
  $('retroBtn').addEventListener('click', openRetro);

  // ---------- ペット（ステータス画面） ----------
  function renderPet(c) {
    const card = $('petCard');
    if (!c.petUnlock) {
      card.innerHTML = `<div class="card-h"><span>ペット</span></div>
        <div class="pet-row">${P.svg('slime', 64, null, { silhouette: true })}<div class="grow"><div>？？？</div><div class="dim">Lv${P.UNLOCK_LV}で仲間になる</div></div></div>`;
      return;
    }
    const id = c.pet, p = P.PETS[id], L = P.levelOf(c.petExp[id] || 0);
    card.innerHTML = `<div class="card-h"><span>ペット</span><span class="dim">${ownedPets(todayKey(), c.petUnlock).length}/${Object.keys(P.PETS).length}匹</span></div>
      <div class="pet-row"><div class="pet-pic">${P.svg(id, 72, petGearOn(todayKey()))}</div>
        <div class="grow"><div><span class="rare r${p.rarity}">${stars(p.rarity)}</span> ${p.name} <span class="y">Lv${L.lv}</span></div>
          <div class="dim">${p.type}型・${p.desc}</div>
          <div class="bar petbar"><i style="width:${L.max ? 100 : L.rest / L.need * 100}%"></i></div>
          <div class="dim">${L.max ? 'レベル最大' : `次のレベルまで ${L.need - L.rest}`}</div></div></div>
      <div class="pet-fx">${P.fxText(c.petFx)}</div>
      <div class="row mt8"><button class="btn sm" id="feedBtn">餌をあげる</button><button class="btn sm blue" id="petListBtn">ペット変更</button><button class="btn sm blue" id="petGearBtn">ペット装備</button></div>`;
    $('feedBtn').onclick = openFeed;
    $('petListBtn').onclick = openPetList;
    $('petGearBtn').onclick = openPetGear;
  }
  function openFeed() {
    SFX.tap();
    const id = C.pet, L = P.levelOf(C.petExp[id] || 0);
    openSheet(`${P.PETS[id].name}に餌をあげる`, `<div class="center">${P.svg(id, 72, petGearOn(todayKey()))}<div>Lv${L.lv}　${L.max ? 'レベル最大' : `次まで ${L.need - L.rest}`}</div></div>
      ${Object.entries(P.FOODS).map(([fid, f]) => `<div class="list-row"><div class="item-ic">${S.icon(f.icon, 30)}</div>
        <div class="grow">${f.name} <span class="y">×${foodCount(fid)}</span><div class="dim">経験値+${f.exp}</div></div>
        <button class="btn sm" data-feed="${fid}" ${!foodCount(fid) || L.max ? 'disabled' : ''}>あげる</button></div>`).join('')}
      <div class="dim center mt8">餌はレベルアップ報酬・ショップ・ペットガチャで手に入る。連れているペットは、クエストでも経験値がたまる</div>`, body => {
      body.onclick = e => {
        const b = e.target.closest('[data-feed]'); if (!b || b.disabled) return;
        const before = P.levelOf(C.petExp[id] || 0).lv;
        state.feeds.push({ k: todayKey(), pet: id, food: b.dataset.feed }); save(); render();
        const after = P.levelOf(C.petExp[id] || 0).lv;
        if (after > before) { say(`${P.PETS[id].name}のレベルが${after}に上がった！`); SFX.level(); flash(); } else { say(`${P.PETS[id].name}は${P.FOODS[b.dataset.feed].name}を食べた！`); SFX.done(); }
        openFeed();
      };
    });
  }
  function openPetList() {
    SFX.tap();
    const own = ownedPets(todayKey(), C.petUnlock);
    openSheet('ペット変更', Object.entries(P.PETS).map(([id, p]) => {
      const has = own.includes(id), cur = C.pet === id, lv = P.levelOf(C.petExp[id] || 0).lv;
      return `<div class="list-row"><div class="item-ic">${P.svg(id, 36, null, { silhouette: !has })}</div>
        <div class="grow">${has ? `<span class="rare r${p.rarity}">${stars(p.rarity)}</span> ${p.name} <span class="y">Lv${lv}</span><div class="dim">${P.fxText(P.stats(id, lv, petGearOn(todayKey())))}</div>` : `？？？<div class="dim">${p.limited ? `${p.limited}イベント限定` : p.rarity === 3 ? '' : 'ペットガチャで出会える'}</div>`}</div>
        ${cur ? '<span class="state-label on">連れている</span>' : has ? `<button class="btn sm blue" data-pet="${id}">連れていく</button>` : ''}</div>`;
    }).join(''), body => {
      body.onclick = e => {
        const b = e.target.closest('[data-pet]'); if (!b) return;
        const t = todayKey();
        state.petLog = state.petLog.filter(x => x.k !== t); state.petLog.push({ k: t, id: b.dataset.pet });
        save(); render(); say(`${P.PETS[b.dataset.pet].name}を連れていくことにした！`); SFX.done(); openPetList();
      };
    });
  }
  function openPetGear() {
    SFX.tap();
    const cur = petGearOn(todayKey()), own = petGearOwned();
    openSheet('ペット装備', Object.entries(P.GEAR_SLOTS).map(([slot, sn]) => `<div class="card-h mt8"><span>${sn}</span></div>` +
      (Object.entries(P.GEAR).filter(([, g]) => g.slot === slot).map(([gid, g]) => {
        const has = own.includes(gid), worn = cur[slot] === gid;
        return `<div class="list-row"><div class="item-ic">${P.gearSvg(gid, 30)}</div>
          <div class="grow">${has ? g.name : '？？？'}<div class="dim">${has ? P.fxText(Object.assign({}, g.fx)) : g.limited ? `${g.limited}イベント限定` : 'ペットガチャで手に入る'}</div></div>
          ${worn ? `<button class="btn sm gray" data-unequip="${slot}">外す</button>` : has ? `<button class="btn sm blue" data-pgear="${gid}">装備する</button>` : ''}</div>`;
      }).join(''))).join(''), body => {
      body.onclick = e => {
        const b = e.target.closest('[data-pgear],[data-unequip]'); if (!b) return;
        const t = todayKey();
        const slot = b.dataset.unequip || P.GEAR[b.dataset.pgear].slot;
        state.petGearLog = state.petGearLog.filter(x => !(x.k === t && x.slot === slot));
        state.petGearLog.push({ k: t, slot, id: b.dataset.pgear || null });
        save(); render(); SFX.done(); openPetGear();
      };
    });
  }

  // ---------- ペットガチャ ----------
  function petPityCount() {
    let n = 0;
    const list = state.pulls.filter(p => p.gacha === 'pet');
    for (let i = list.length - 1; i >= 0; i--) { if (list[i].type === 'pet' || list[i].pet) break; n++; }
    return n;
  }
  function rollPet() {
    const T = P.GACHA.table;
    let kind;
    if (petPityCount() + 1 >= P.GACHA.pity) kind = Math.random() < 0.25 ? ['pet5'] : ['pet4'];
    else {
      let y = Math.random() * T.reduce((a, t) => a + t[2], 0);
      kind = T.find(t => (y -= t[2]) < 0) || T[T.length - 1];
    }
    const base = { k: todayKey(), gacha: 'pet' };
    if (kind[0] === 'pet5' || kind[0] === 'pet4') {
      const r = kind[0] === 'pet5' ? 5 : 4;
      const pool = Object.keys(P.PETS).filter(id => P.PETS[id].rarity === r && !P.PETS[id].limited);
      const evRw = C.evNow && C.evNow.reward.type === 'pet' && P.PETS[C.evNow.reward.id].rarity === r ? C.evNow.reward.id : null;
      const id = evRw && Math.random() < 0.4 ? evRw : pool[Math.floor(Math.random() * pool.length)];
      const has = ownedPets(todayKey(), C.petUnlock).includes(id);
      if (has) return { ...base, r, type: 'food', id: P.GACHA.dup.pet[0], n: P.GACHA.dup.pet[1], pet: id, dupPet: id };
      return { ...base, r, type: 'pet', id };
    }
    if (kind[0] === 'gear') {
      const ids = Object.keys(P.GEAR).filter(g => !P.GEAR[g].limited);
      const evRw = C.evNow && C.evNow.reward.type === 'petgear' ? C.evNow.reward.id : null;
      const id = evRw && Math.random() < 0.4 ? evRw : ids[Math.floor(Math.random() * ids.length)];
      if (petGearOwned().includes(id)) return { ...base, r: 3, type: 'food', id: P.GACHA.dup.gear[0], n: P.GACHA.dup.gear[1], dupGear: id };
      return { ...base, r: 3, type: 'petgear', id };
    }
    // バレンタイン中は、餌の一部がチョコになる
    if (C.evNow && C.evNow.food && Math.random() < 0.3) return { ...base, r: 3, type: 'food', id: C.evNow.food, n: 1 };
    return { ...base, r: 2, type: 'food', id: kind[1], n: 1 };
  }
  function pullPet(n, cur) {
    const cost = cur === 'gold' ? (n === 10 ? P.GACHA.gold10 : P.GACHA.gold1) : (n === 10 ? P.GACHA.gem10 : P.GACHA.gem1);
    if ((cur === 'gold' ? C.gold : C.gems) < cost) { toast(cur === 'gold' ? 'ゴールドが足りません' : 'ジェムが足りません'); return; }
    const res = [];
    for (let i = 0; i < n; i++) { const p = rollPet(); state.pulls.push(p); res.push(p); }
    state.petGachaLog.push({ k: todayKey(), n, cur, cost });
    save();
    showGachaResult(res);
    render();
  }

  // ---------- 持ち物 ----------
  function openBag() {
    SFX.tap();
    openSheet('持ち物', Object.entries(G.ITEMS).map(([id, it]) => {
      const n = itemCount(id), once = id === 'xpbook' && usedToday(id), noBoss = id === 'bomb' && C.boss.defeated;
      return `<div class="list-row"><div class="item-ic">${S.icon(it.icon, 30)}</div>
        <div class="grow">${it.name} <span class="y">×${n}</span><div class="dim">${it.desc}</div></div>
        ${once || noBoss ? `<span class="state-label">${once ? '使用済み' : '討伐済み'}</span>` : `<button class="btn sm" data-use="${id}" ${!n ? 'disabled' : ''}>使う</button>`}</div>`;
    }).join('') + '<div class="dim center mt12">アイテムはショップやガチャで手に入ります</div>', body => {
      body.onclick = e => {
        const b = e.target.closest('[data-use]'); if (!b || b.disabled) return;
        const id = b.dataset.use, before = C;
        state.uses.push({ k: todayKey(), id }); save(); render();
        const msg = { potion: `HPが${Math.min(30, C.hp - before.hp)}回復した！`, bomb: `爆弾が炸裂！ ${C.boss.name}に${Math.round(C.boss.hp * 0.2)}のダメージ！`,
          xpbook: '今日のEXPが1.5倍になった！', charm: '❄氷のお守りを1個手に入れた！' }[id];
        if (id === 'bomb') {
          // 爆発が見えるようにクエスト画面へ
          closeSheet(); showTab('today');
          say(`${G.ITEMS[id].name}を使った！<br>${msg}`);
          noise(0.4, 0.2); vibrate(200);
          setTimeout(() => playAttack(Math.round(C.boss.hp * 0.2), { bomb: true, killed: C.bossWins > before.bossWins }), 150);
          return;
        }
        say(`${G.ITEMS[id].name}を使った！<br>${msg}`);
        SFX.freeze();
        openBag();
      };
    });
  }
  $('bagBtn').addEventListener('click', openBag);

  // ---------- 見た目 ----------
  function openLook() {
    const lk = Object.assign({}, state.look);
    const draw = () => openSheet('見た目の変更', `<div class="center">${heroSvg(110, null, lk)}</div>
      <label class="lb">髪型</label><div class="seg wrap-seg">${S.HAIR_STYLES.map(([k, n]) => `<button class="btn ${lk.hair === k ? 'on' : ''}" data-hair="${k}">${n}</button>`).join('')}</div>
      <label class="lb">髪の色</label><div class="swatches">${S.HAIR_COLORS.map(([n, c], i) => `<button class="sw ${lk.color === i ? 'on' : ''}" data-color="${i}" style="background:${c}" aria-label="${n}"></button>`).join('')}</div>
      <label class="lb">肌の色</label><div class="swatches">${S.SKINS.map((sk, i) => `<button class="sw ${lk.skin === i ? 'on' : ''}" data-skin="${i}" style="background:${sk.s}" aria-label="肌${i + 1}"></button>`).join('')}</div>
      <div class="row mt12"><button class="btn gray" id="lkNo">やめる</button><button class="btn" id="lkOk">保存</button></div>`, body => {
      body.onclick = e => {
        const b = e.target.closest('button'); if (!b) return;
        SFX.tap();
        if (b.dataset.hair) { lk.hair = b.dataset.hair; return draw(); }
        if (b.dataset.color) { lk.color = Number(b.dataset.color); return draw(); }
        if (b.dataset.skin) { lk.skin = Number(b.dataset.skin); return draw(); }
        if (b.id === 'lkNo') return closeSheet();
        if (b.id === 'lkOk') { state.look = lk; save(); closeSheet(); render(); say('見た目を変更した！'); }
      };
    });
    draw();
  }
  $('lookBtn').addEventListener('click', () => { SFX.tap(); openLook(); });

  // ---------- 記録 ----------
  function setEntry(id, v, day) {
    const k = day || todayKey(), isToday = k === todayKey();
    const t = state.tasks.find(x => x.id === id);
    const before = C || compute();
    const wasDone = isDone(t, (state.log[k] || {})[id]);
    state.log[k] = state.log[k] || {};
    if (v === null || v === '' || v === false || v === 0) delete state.log[k][id]; else state.log[k][id] = v;
    if (!Object.keys(state.log[k]).length) delete state.log[k];
    save();
    const after = compute();
    const diff = after.total - before.total;
    const bd = (after.perDay[k]?.bossDmg || 0) - (before.perDay[k]?.bossDmg || 0);
    const pd = (after.perDay[k]?.petDmg || 0) - (before.perDay[k]?.petDmg || 0);
    const gd = after.earned - before.earned;
    const nowDone = isDone(t, (state.log[k] || {})[id]);
    const name = esc(state.name), bossName = after.boss.name;
    const evKilled = !!(after.evBoss && after.evBoss.defeated && !(before.evBoss && before.evBoss.defeated));
    const killed = after.bossWins > before.bossWins || evKilled;
    if (!isToday) {
      say(`昨日（${md(k)}）の記録を更新した。${killed ? `<br>${bossName}を倒した！` : ''}`); SFX.done();
      render(); return;
    }
    const critHit = nowDone && !wasDone && isCrit(k, id, after.gearStats.crit);
    if (evKilled) {
      const rw = after.evNow.reward, rwName = rw.type === 'pet' ? P.PETS[rw.id].name : P.GEAR[rw.id].name;
      say(`${name}の攻撃！<br>${after.evNow.boss.name}を倒した！ ＋${EV_GEMS}💎・${rwName}`); SFX.boss(); setTimeout(SFX.level, 600); vibrate([100, 50, 300]); flash();
    } else if (killed) {
      say(`${name}の攻撃！<br>${bossName}を倒した！ ＋${after.boss.reward}EXP ＋${after.boss.gold}G`); SFX.boss(); vibrate([100, 50, 300]); flash();
    } else if (after.perDay[k]?.cleared && !before.perDay[k]?.cleared) {
      say(`今日のクエストを達成！<br>HP＋${HEAL}${after.freezes > before.freezes ? '・❄氷のお守りを手に入れた！' : ''}`);
      SFX.clear(); if (after.freezes > before.freezes) setTimeout(SFX.freeze, 450); vibrate([60, 40, 120]);
    } else if (nowDone && !wasDone) {
      const crit = isCrit(k, id, after.gearStats.crit);
      say(`${esc(taskName(t))}をやり遂げた！ <span class="y">＋${gd}G</span><br>${crit ? '<span class="y">会心の一撃！</span> ' : ''}${bossName}に<span class="r">${bd}</span>のダメージ！`);
      if (crit) { noise(0.2, 0.15); setTimeout(SFX.done, 120); flash(); vibrate([30, 30, 80]); } else { SFX.done(); vibrate(40); }
    } else if (diff > 0) {
      say(`${bossName}に<span class="r">${bd}</span>のダメージ！`); SFX.hit(); vibrate(20);
    } else if (diff < 0) SFX.undo();
    render();
    if (bd > 0) playAttack(bd, { crit: critHit, killed, pet: pd });
  }

  $('taskList').addEventListener('click', e => {
    const b = e.target.closest('button[data-act]'); if (!b) return;
    if (b.dataset.act === 'openQuests') { openQuests(); return; }
    const id = b.dataset.id, t = state.tasks.find(x => x.id === id);
    const cur = (state.log[todayKey()] || {})[id];
    const num = Number(cur) || 0;
    switch (b.dataset.act) {
      case 'toggle': setEntry(id, !cur); break;
      case 'fill': setEntry(id, isDone(t, cur) ? null : t.target); break;
      case 'plus': setEntry(id, Math.round((num + t.step) * 100) / 100); break;
      case 'minus': setEntry(id, Math.max(0, Math.round((num - t.step) * 100) / 100) || null); break;
      case 'now': { const d = new Date(); setEntry(id, `${pad(d.getHours())}:${pad(d.getMinutes())}`); break; }
      case 'editCount': SFX.tap(); openSheet(taskName(t), `<label class="lb">今日の記録（${esc(t.unit)}）</label>
          <input id="eNum" type="number" inputmode="decimal" min="0" step="any" value="${cur ?? ''}" placeholder="0">
          <div class="dim mt8">目標 ${fmt(t.target)}${esc(t.unit)}</div>
          <div class="row mt12"><button class="btn gray" id="eClear">記録を消す</button><button class="btn" id="eOk">保存</button></div>`, body => {
            const inp = body.querySelector('#eNum'); setTimeout(() => inp.focus(), 50);
            body.querySelector('#eOk').onclick = () => { closeSheet(); setEntry(id, inp.value === '' ? null : Math.max(0, Number(inp.value))); };
            body.querySelector('#eClear').onclick = () => { closeSheet(); setEntry(id, null); };
          }); break;
      case 'editWake': SFX.tap(); openSheet(taskName(t), `<label class="lb">起床時刻</label>
          <input id="eTime" type="time" value="${cur ?? ''}">
          <div class="dim mt8">目標 ${t.wake}</div>
          <div class="row mt12"><button class="btn gray" id="eClear">記録を消す</button><button class="btn" id="eOk">保存</button></div>`, body => {
            body.querySelector('#eOk').onclick = () => { const v = body.querySelector('#eTime').value; closeSheet(); setEntry(id, v || null); };
            body.querySelector('#eClear').onclick = () => { closeSheet(); setEntry(id, null); };
          }); break;
    }
  });

  // タブ
  document.querySelectorAll('.tabs .ti').forEach(el => { el.innerHTML = S.icon(el.dataset.icon, 22); });
  $('mailIcon').innerHTML = S.icon('mail', 24);
  $('coinIcon').innerHTML = S.icon('coin', 14);
  $('coinIcon2').innerHTML = S.icon('coin', 22);
  $('gemIcon').innerHTML = S.icon('gem', 14);
  $('gemIcon2').innerHTML = S.icon('gem', 22);
  $('bagIcon').innerHTML = S.icon('bag', 24);
  function showTab(name) {
    document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x.dataset.tab === name));
    ['today', 'stats', 'shop', 'log', 'menu'].forEach(n => $('tab-' + n).classList.toggle('hidden', n !== name));
    if (name !== 'shop') { tryOn = null; }
    $('say').classList.add('hidden');
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => { SFX.tap(); showTab(b.dataset.tab); }));

  // ---------- メニュー ----------
  const MENU = [
    ['📜', 'クエスト編集', () => openQuests()],
    ['💬', '質問に答え直す', () => startOnboarding(true)],
    ['✎', '名前の変更', () => openName()],
    ['👤', '見た目の変更', () => openLook()],
    ['♪', 'サウンド・振動', () => openSound()],
    ['Ａ', '文字の大きさ', () => openFont()],
    ['⏰', '通知', () => openReminder()],
    ['📦', 'バックアップ・復元', () => openBackup()],
    ['📲', 'インストール', () => openInstall()],
    ['？', 'ルール', () => openHelp()],
    ['🎓', 'チュートリアル', () => startTutorial()],
    ['⚠', 'データを全て削除', () => openReset(), 'danger'],
  ];
  $('menuList').innerHTML = MENU.map(([ic, label, , cls], i) => `<button class="btn ${cls || ''}" data-menu="${i}"><span class="mi">${ic}</span>${label}<span class="arrow">▶</span></button>`).join('');
  $('menuList').addEventListener('click', e => { const b = e.target.closest('[data-menu]'); if (b) { SFX.tap(); MENU[b.dataset.menu][2](); } });

  function openName() {
    openSheet('名前の変更', `<input id="nm" maxlength="12" value="${esc(state.name)}"><div class="row mt12"><button class="btn" id="nmOk">保存</button></div>`, body => {
      body.querySelector('#nmOk').onclick = () => { state.name = body.querySelector('#nm').value.trim() || '冒険者'; save(); closeSheet(); render(); };
    });
  }
  const FONT_SCALES = [[1, '標準'], [1.1, '大'], [1.2, '特大']];
  const applyFont = () => { document.body.style.zoom = state.fontScale || 1; };
  function openFont() {
    openSheet('文字の大きさ', `<div class="seg">${FONT_SCALES.map(([v, n]) => `<button class="btn ${state.fontScale === v ? 'on' : ''}" data-fs="${v}">${n}</button>`).join('')}</div>
      <div class="dim mt12">画面全体が大きくなります</div>`, body => {
      body.onclick = e => { const b = e.target.closest('[data-fs]'); if (!b) return; state.fontScale = Number(b.dataset.fs); save(); applyFont(); SFX.tap(); openFont(); };
    });
  }
  function openSound() {
    openSheet('サウンド・振動', `
      <label class="lb">効果音</label><div class="seg"><button class="btn ${state.sound ? 'on' : ''}" data-s="1">ON</button><button class="btn ${!state.sound ? 'on' : ''}" data-s="0">OFF</button></div>
      <label class="lb">振動（Androidのみ）</label><div class="seg"><button class="btn ${state.vibe ? 'on' : ''}" data-v="1">ON</button><button class="btn ${!state.vibe ? 'on' : ''}" data-v="0">OFF</button></div>`, body => {
      body.onclick = e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.s) state.sound = b.dataset.s === '1';
        if (b.dataset.v) state.vibe = b.dataset.v === '1';
        save(); SFX.tap(); vibrate(40); openSound();
      };
    });
  }

  // ---------- クエスト編集 ----------
  function openQuests() {
    const L = levelOf(C.total), act = activeTasks(), slots = slotsFor(L.lv), nx = nextSlotLv(L.lv);
    const full = act.length >= slots;
    openSheet(`クエスト編集（${act.length}/${slots}）`, `${act.map(t => {
        const days = t.days.length === 7 ? '毎日' : ALL_DAYS.filter(d => t.days.includes(d)).map(d => WD[d]).join('');
        const what = t.type === 'count' ? `${fmt(t.target)}${esc(t.unit)}` : t.type === 'wake' ? `${t.wake}起床` : '';
        return `<div class="list-row"><div class="ic">${iconHtml(t.icon, 22)}</div>
          <div class="grow">${esc(taskName(t))}<div class="dim">${[what, days, `${t.xp}EXP`].filter(Boolean).join(' ・ ')}${t.from && t.from > todayKey() ? ' ・ <span class="y">明日から</span>' : ''}</div></div>
          <button class="btn sm gray" data-q="up" data-id="${t.id}" aria-label="上へ">↑</button>
          <button class="btn sm blue" data-q="edit" data-id="${t.id}">編集</button></div>`;
      }).join('') || '<div class="dim">クエストがありません</div>'}
      <button class="btn full mt12" data-q="add" ${full ? 'disabled' : ''}>＋ クエストを追加</button>
      ${full ? `<div class="dim center mt8">枠がいっぱいです${nx ? `（Lv${nx}で増加）` : ''}</div>` : ''}`, body => {
      body.onclick = e => {
        const b = e.target.closest('[data-q]'); if (!b || b.disabled) return;
        SFX.tap();
        const i = state.tasks.findIndex(t => t.id === b.dataset.id);
        if (b.dataset.q === 'add') openPicker('muscle');
        if (b.dataset.q === 'edit') openTaskEdit(state.tasks[i]);
        if (b.dataset.q === 'up') {
          const a = activeTasks(), pos = a.indexOf(state.tasks[i]);
          if (pos > 0) { const j = state.tasks.indexOf(a[pos - 1]); [state.tasks[j], state.tasks[i]] = [state.tasks[i], state.tasks[j]]; save(); render(); openQuests(); }
        }
      };
    });
  }

  // 一覧から選ぶ（自分で新しく作ることはできない）
  function openPicker(group) {
    const p = prefs();
    const used = new Set(activeTasks().map(t => t.tpl));
    const list = CAT.LIST.filter(x => x.group === group);
    openSheet('クエストを追加', `<div class="seg wrap-seg">${Object.entries(CAT.GROUPS).map(([g, n]) => `<button class="btn ${g === group ? 'on' : ''}" data-g="${g}">${n}</button>`).join('')}</div>
      <div class="mt8">${list.map(x => {
        const has = used.has(x.key);
        const what = x.type === 'count' ? `${fmt(recTarget(x, p))}${x.unit} ・ ` : '';
        return `<button class="btn gray full pick-row" data-k="${x.key}" ${has ? 'disabled' : ''}>${S.icon(x.icon, 20)}<span class="grow" style="text-align:left">${x.name}<br><small class="dim">${has ? '追加済み' : `${what}＋${xpFor(x, x.type === 'count' ? recTarget(x, p) : 0)}EXP`}</small></span><span class="arrow">▶</span></button>`;
      }).join('')}</div>`, body => {
      body.onclick = e => {
        const b = e.target.closest('button'); if (!b || b.disabled) return;
        SFX.tap();
        if (b.dataset.g) return openPicker(b.dataset.g);
        if (b.dataset.k) openTaskEdit(null, CAT.get(b.dataset.k));
      };
    });
  }

  // 編集：回数は適性の範囲内のみ。EXPは回数から自動。時刻は自由
  function openTaskEdit(task, tplForNew) {
    const p = prefs();
    const x = tplForNew || CAT.get(task.tpl);
    const isNew = !task;
    const draft = isNew ? makeTask(x, p) : JSON.parse(JSON.stringify(task));
    const legacy = !x;
    const range = x && x.type === 'count' ? rangeFor(x, p) : null;
    if (range) draft.target = Math.min(range[1], Math.max(range[0], draft.target));
    const draw = () => {
      if (x && x.type === 'count') draft.xp = xpFor(x, draft.target);
      openSheet(isNew ? 'クエストを追加' : 'クエストを編集', `
        <div class="edit-head">${iconHtml(draft.icon, 32)}<span>${esc(taskName(draft))}</span></div>
        ${legacy ? '<div class="dim mt8">このクエストは目標を変更できません（曜日と削除のみ）</div>' : ''}
        ${!legacy && draft.type === 'count' ? `<label class="lb">目標（適性の範囲：${fmt(range[0])}〜${fmt(range[1])}${x.unit}）</label>
          <div class="stepper"><button class="btn gray" data-t="-" ${draft.target <= range[0] ? 'disabled' : ''}>−</button>
            <div class="sv">${fmt(draft.target)}<small>${x.unit}</small></div>
            <button class="btn gray" data-t="+" ${draft.target >= range[1] ? 'disabled' : ''}>＋</button></div>` : ''}
        ${!legacy && draft.type === 'wake' ? `<label class="lb">起床の目標時刻</label><input id="fWake" type="time" value="${draft.wake}">` : ''}
        ${!legacy && draft.type === 'bed' ? `<label class="lb">就寝の目標時刻</label><input id="fBed" type="time" value="${draft.bedtime}">` : ''}
        <div class="xpline">獲得EXP <span class="y">＋${draft.xp}</span>${!legacy && draft.type === 'count' ? '<span class="dim">（回数に比例）</span>' : ''}</div>
        <label class="lb">実施する曜日</label><div class="days">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button class="btn ${draft.days.includes(d) ? 'on' : ''}" data-day="${d}">${WD[d]}</button>`).join('')}</div>
        <div class="row mt12">${isNew ? '<button class="btn gray" id="fBack">戻る</button>' : '<button class="btn red" id="fDel">削除</button>'}<button class="btn" id="fSave">${isNew ? '追加' : '保存'}</button></div>`, body => {
        const keep = () => {
          const w = body.querySelector('#fWake'); if (w && w.value) draft.wake = w.value;
          const bd = body.querySelector('#fBed'); if (bd && bd.value) draft.bedtime = bd.value;
        };
        body.onclick = e => {
          const b = e.target.closest('button'); if (!b || b.disabled) return;
          keep(); SFX.tap();
          const d = b.dataset;
          if (d.t) { const st = draft.step || stepOf(x, p); draft.target = Math.round((draft.target + (d.t === '+' ? st : -st)) * 100) / 100; draft.target = Math.min(range[1], Math.max(range[0], draft.target)); return draw(); }
          if (d.day) { const n = Number(d.day); draft.days = draft.days.includes(n) ? draft.days.filter(v => v !== n) : draft.days.concat(n); return draw(); }
          if (b.id === 'fBack') return openPicker(x.group);
          if (b.id === 'fDel') {
            openSheet('クエストを削除', `<div>「${esc(taskName(task))}」を削除します。これまでに獲得したEXPは残ります。</div>
              <div class="row mt12"><button class="btn gray" id="dNo">やめる</button><button class="btn red" id="dYes">削除</button></div>`, bb => {
              bb.querySelector('#dNo').onclick = () => openTaskEdit(task);
              bb.querySelector('#dYes').onclick = () => { task.archivedAt = todayKey(); save(); render(); openQuests(); };
            });
            return;
          }
          if (b.id === 'fSave') {
            if (!draft.days.length) { toast('曜日を1つ以上選んでください'); return; }
            draft.days.sort();
            if (isNew) state.tasks.push(draft);
            else saveEdit(task, draft);
            save(); SFX.done(); render(); openQuests();
          }
        };
      });
    };
    draw();
  }
  // 目標を変えたときは、過去の記録の判定が変わらないよう「新しいクエスト」として今日から切り替える
  function saveEdit(task, draft) {
    const scoring = task.target !== draft.target || task.wake !== draft.wake || task.bedtime !== draft.bedtime;
    const t = todayKey();
    const hasPast = Object.keys(state.log).some(k => k < t && state.log[k][task.id] != null);
    if (!scoring || !hasPast) { Object.assign(task, draft); return; }
    const nt = Object.assign({}, draft, { id: uid(), from: t });
    delete nt.archivedAt;
    task.archivedAt = t;
    if (state.log[t] && state.log[t][task.id] != null) { state.log[t][nt.id] = state.log[t][task.id]; delete state.log[t][task.id]; }
    state.tasks.splice(state.tasks.indexOf(task) + 1, 0, nt);
  }

  // ---------- 最初の質問 ----------
  let ob = null;
  function recommend(p, slots) {
    const budget = [15, 30, 60][p.time];
    const goals = p.goals.length ? p.goals : Object.keys(GOALS);
    const timeOf = x => Array.isArray(x.time) ? x.time[idxFor(x, p)] : (x.time || 0);
    const pool = CAT.LIST.filter(x => !x.eq && !(x.minFit && p.fit < x.minFit) && !(x.maxFit !== undefined && p.fit > x.maxFit))
      .map(x => ({ x, score: goals.reduce((a, g) => a + (x.goals[g] || 0), 0) * 2 + 1 + (x.key === 'wake' && p.wakeAsked ? 4 : 0)
        - Math.max(0, (x.d || 1) - 1 - p.fit) * 8 }))
      .sort((a, b) => b.score - a.score);
    const picks = [], groups = {};
    let used = 0;
    for (const strict of [true, false]) {
      while (picks.length < slots) {
        let best = null;
        for (const r of pool) {
          if (picks.includes(r)) continue;
          const tm = timeOf(r.x);
          if (strict && tm > 0 && used + tm > budget) continue;
          const s = r.score - (groups[r.x.group] || 0) * 5 - (strict ? 0 : tm / 5);
          if (!best || s > best.s) best = { r, s };
        }
        if (!best) break;
        picks.push(best.r); groups[best.r.x.group] = (groups[best.r.x.group] || 0) + 1; used += timeOf(best.r.x);
      }
    }
    const rest = pool.filter(r => !picks.includes(r)).slice(0, 12);
    return { picks: picks.map(r => r.x.key), order: picks.concat(rest).map(r => r.x.key) };
  }
  function startOnboarding(redo) {
    closeSheet();
    const L = levelOf(C ? C.total : 0);
    ob = { step: 0, redo, name: state.name, goals: [], fit: null, time: null, wakeH: null, picks: [], order: [], slots: slotsFor(L.lv) };
    $('ob').classList.remove('hidden');
    renderOb();
  }
  const OB_STEPS = 6;
  const WAKES = [['5時台', '05:30'], ['6時台', '06:30'], ['7時台', '07:30'], ['8時以降', '08:30'], ['決まっていない', null]];
  function obPrefs() {
    const usual = ob.wakeH != null ? WAKES[ob.wakeH][1] : null;
    return { fit: ob.fit ?? 1, time: ob.time ?? 1, goals: ob.goals, wake: usual ? fromMin(toMin(usual) - 30) : '07:00', wakeAsked: !!usual };
  }
  function renderOb() {
    const back = ob.step > 0 ? '<button class="btn gray" data-ob="back">戻る</button>' : (ob.redo ? '<button class="btn gray" data-ob="close">やめる</button>' : '');
    const choice = (attr, items, sel) => `<div class="choices">${items.map(([a, b], i) => `<button class="btn ${sel === i ? 'on' : ''}" ${attr}="${i}">${a}${b ? `<small>${b}</small>` : ''}</button>`).join('')}</div>`;
    let talk = '', body = '', next = '';
    switch (ob.step) {
      case 0:
        talk = ob.redo ? '質問に答えて、今の自分に合ったクエストを選び直そう。' : 'ようこそ、冒険者よ！ ここは毎日の習慣で強くなる世界。まずは名前を教えてほしい。';
        body = `<input id="obName" maxlength="12" value="${esc(ob.name)}">`;
        next = '<button class="btn" data-ob="next">次へ</button>';
        break;
      case 1:
        talk = `${ob.name}よ、何を目指している？（3つまで選べる）`;
        body = `<div class="choices">${Object.entries(GOALS).map(([k, v]) => `<button class="btn ${ob.goals.includes(k) ? 'on' : ''}" data-goal="${k}">${ob.goals.includes(k) ? '✓ ' : ''}${v}</button>`).join('')}</div>`;
        next = `<button class="btn" data-ob="next" ${ob.goals.length ? '' : 'disabled'}>次へ</button>`;
        break;
      case 2:
        talk = '普段、運動はしている？';
        body = choice('data-fit', [['ほとんどしない', 'これから始めたい'], ['週に1〜2回', 'たまに体を動かす'], ['週に3回以上', '習慣になっている']], ob.fit);
        break;
      case 3:
        talk = '1日にどれくらい時間を使える？';
        body = choice('data-time', [['15分くらい'], ['30分くらい'], ['1時間以上']], ob.time);
        break;
      case 4:
        talk = '普段、何時ごろに起きている？';
        body = choice('data-wake', WAKES.map(([a, v]) => [a, `目標 ${v ? fromMin(toMin(v) - 30) : '07:00'}`]), ob.wakeH);
        break;
      case 5: {
        talk = `${ob.name}におすすめのクエストだ！ 最初は${ob.slots}個から。レベルが上がると増やせる。`;
        const p = obPrefs();
        body = `<div class="dim" style="margin-bottom:8px">選択中 ${ob.picks.length}/${ob.slots}（タップで入れ替え）</div><div class="choices">${ob.order.map(key => {
          const x = CAT.get(key), t = makeTask(x, p), on = ob.picks.includes(key);
          const what = t.type === 'count' ? `${fmt(t.target)}${t.unit}` : t.type === 'wake' ? `${t.wake}までに起床` : t.type === 'bed' ? '' : '毎日';
          return `<button class="btn ${on ? 'on' : ''}" data-pick="${key}" ${!on && ob.picks.length >= ob.slots ? 'style="opacity:.5"' : ''}>
            <span class="pick">${on ? '✓' : '　'} ${S.icon(x.icon, 20)} ${esc(taskName(t))}</span><small>${[what, `＋${t.xp}EXP`].filter(Boolean).join(' ・ ')}</small></button>`;
        }).join('')}</div>`;
        next = `<button class="btn" data-ob="finish" ${ob.picks.length ? '' : 'disabled'}>冒険を始める</button>`;
        break;
      }
    }
    $('obBox').innerHTML = `<div class="progress">${'■'.repeat(ob.step + 1)}${'□'.repeat(OB_STEPS - ob.step - 1)}</div>
      <div class="talk"><span class="typing" id="obSay"></span></div>${body}<div class="nav">${back}${next}</div>`;
    typeText($('obSay'), talk);
    $('ob').scrollTop = 0;
  }
  function typeText(el, text) {
    let i = 0;
    const tick = () => { if (i <= text.length && el.isConnected) { el.textContent = text.slice(0, i++); if (i % 3 === 0) SFX.tap(); setTimeout(tick, 22); } };
    tick();
  }
  $('obBox').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    SFX.tap();
    const d = b.dataset;
    if (d.ob === 'close') { $('ob').classList.add('hidden'); return; }
    if (d.ob === 'back') { ob.step--; return renderOb(); }
    if (d.ob === 'next') { if (ob.step === 0) ob.name = ($('obName').value.trim() || '冒険者').slice(0, 12); ob.step++; return renderOb(); }
    if (d.goal) { ob.goals = ob.goals.includes(d.goal) ? ob.goals.filter(g => g !== d.goal) : ob.goals.length < 3 ? ob.goals.concat(d.goal) : ob.goals; return renderOb(); }
    if (d.fit) { ob.fit = Number(d.fit); ob.step++; return renderOb(); }
    if (d.time) { ob.time = Number(d.time); ob.step++; return renderOb(); }
    if (d.wake) { ob.wakeH = Number(d.wake); const r = recommend(obPrefs(), ob.slots); ob.picks = r.picks; ob.order = r.order; ob.step++; return renderOb(); }
    if (d.pick) {
      if (ob.picks.includes(d.pick)) ob.picks = ob.picks.filter(k => k !== d.pick);
      else if (ob.picks.length < ob.slots) ob.picks.push(d.pick);
      return renderOb();
    }
    if (d.ob === 'finish') finishOnboarding();
  });
  function finishOnboarding() {
    const p = obPrefs();
    state.prefs = p; state.name = ob.name;
    const today = todayKey();
    const when = state.log[today] ? addDays(today, 1) : today;
    activeTasks().forEach(t => { t.archivedAt = when; });
    ob.order.filter(k => ob.picks.includes(k)).forEach(key => {
      const t = makeTask(CAT.get(key), p);
      if (when !== today) t.from = when;
      state.tasks.push(t);
    });
    const first = !state.onboarded;
    state.onboarded = true;
    if (first) addMail({ icon: '🗡', title: '冒険の始まり', text: 'クエストをこなすとEXPが手に入り、ボスにもダメージを与えられる。ルールは右上の「？」で確認できる。' });
    save();
    $('ob').classList.add('hidden');
    showTab('today');
    render();
    say(when === today ? `${esc(state.name)}の冒険が始まった！` : '新しいクエストは明日から始まる！');
    SFX.clear(); flash();
    if (!state.tutorialDone) setTimeout(startTutorial, 1200);
  }

  // ---------- チュートリアル（画面の要所を光らせて順番に説明） ----------
  const TUT = [
    ['#bossCard', '毎週、ボスが現れる。クエストをこなすと、主人公がボスに攻撃する。'],
    ['#taskList .task', 'クエストをやったら、右のボタンを押して記録しよう。回数のクエストは「＋」で少しずつ記録できる。'],
    ['#dayLine', 'その日のクエストを3分の2以上クリアすると「達成」。達成できないと、ボスの攻撃でHPが減る。'],
    ['.who', 'EXPが貯まるとレベルアップ。HPが0になると戦闘不能になり、EXPを失う。'],
    ['.pills', '🔥は連続達成日数。続けるほどEXPが増え、3日ごとに❄（身代わりのお守り）がもらえる。右はゴールドとジェム。'],
    ['.top-btns', '👜アイテム、📬お知らせ、？ルール。迷ったら「？」を見よう。'],
    ['.tabs', '装備やガチャは「ショップ」、カレンダーや魔物図鑑は「記録」、設定は「メニュー」にある。'],
    [null, '準備は整った。さあ、冒険を始めよう！'],
  ];
  let tutStep = -1;
  function startTutorial() {
    closeSheet(); showTab('today');
    document.documentElement.classList.add('tut-lock');
    tutStep = 0; $('tut').classList.remove('hidden');
    showTut();
  }
  function showTut() {
    const [sel, text] = TUT[tutStep];
    const el = sel ? document.querySelector(sel) : null;
    const hole = $('tutHole'), box = $('tutBox');
    box.innerHTML = `<div class="tut-step">${tutStep + 1} / ${TUT.length}</div><div class="tut-text">${text}</div>
      <div class="row mt12">${tutStep < TUT.length - 1 ? '<button class="btn gray" id="tutSkip">スキップ</button>' : ''}<button class="btn" id="tutNext">${tutStep < TUT.length - 1 ? '次へ' : '冒険を始める'}</button></div>`;
    $('tutNext').onclick = () => { SFX.tap(); tutStep++; if (tutStep >= TUT.length) endTutorial(); else showTut(); };
    const sk = $('tutSkip'); if (sk) sk.onclick = () => { SFX.tap(); endTutorial(); };
    if (!el) { hole.style.cssText = 'left:50%;top:40%;width:0;height:0'; box.style.cssText = 'top:42%;bottom:auto'; return; }
    const fixed = getComputedStyle(el).position === 'fixed' || el.closest('.top, .tabs');
    if (!fixed) el.scrollIntoView({ block: 'center' });
    setTimeout(() => {
      const r = el.getBoundingClientRect(), pad = 6;
      hole.style.cssText = `left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px`;
      if (r.top + r.height / 2 < innerHeight / 2) box.style.cssText = `top:${Math.min(r.bottom + 16, innerHeight - 200)}px;bottom:auto`;
      else box.style.cssText = `bottom:${Math.min(innerHeight - r.top + 16, innerHeight - 200)}px;top:auto`;
    }, fixed ? 0 : 250);
  }
  function endTutorial() {
    $('tut').classList.add('hidden'); tutStep = -1;
    document.documentElement.classList.remove('tut-lock');
    state.tutorialDone = true; save();
    window.scrollTo(0, 0);
    say(`${esc(state.name)}の冒険が始まる！`);
  }
  window.addEventListener('resize', () => { if (tutStep >= 0) showTut(); });
  // 説明の「次へ」「スキップ」以外は、触っても何も起きないようにする（スクロールも止める）
  const tutBlock = e => { if (tutStep >= 0 && !(e.target.closest && e.target.closest('.tut-box button'))) { e.preventDefault(); e.stopPropagation(); } };
  ['click', 'pointerdown', 'touchstart', 'touchmove', 'wheel', 'contextmenu'].forEach(type => $('tut').addEventListener(type, tutBlock, { passive: false }));
  window.addEventListener('keydown', e => { if (tutStep >= 0 && ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) e.preventDefault(); }, { passive: false });

  // ---------- 通知 ----------
  const canNotify = () => 'Notification' in window;
  function openReminder() {
    const n = state.notify;
    openSheet('通知', `
      <label class="lb">通知</label><div class="seg"><button class="btn ${n.on ? 'on' : ''}" data-n="1">ON</button><button class="btn ${!n.on ? 'on' : ''}" data-n="0">OFF</button></div>
      <div class="row"><div><label class="lb">朝（今日のクエスト）</label><input type="time" id="nM" value="${n.morning}"></div><div><label class="lb">夜（やり残し）</label><input type="time" id="nE" value="${n.evening}"></div></div>
      <div class="dim mt8">アプリを完全に閉じていると届かない場合があります。</div>
      <button class="btn blue full mt12" id="icsBtn">カレンダーに登録（確実に届く）</button>`, body => {
      body.querySelector('#nM').onchange = e => { n.morning = e.target.value || '07:00'; delete n.sent.morning; save(); };
      body.querySelector('#nE').onchange = e => { n.evening = e.target.value || '21:00'; delete n.sent.evening; save(); };
      body.querySelector('#icsBtn').onclick = exportIcs;
      body.querySelectorAll('[data-n]').forEach(b => b.onclick = async () => {
        SFX.tap();
        if (b.dataset.n === '0') { n.on = false; save(); return openReminder(); }
        if (!canNotify()) { toast('このブラウザは通知に対応していません'); return; }
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') { toast('通知が許可されませんでした'); return; }
        n.on = true;
        const now = new Date(), hm = now.getHours() * 60 + now.getMinutes();
        ['morning', 'evening'].forEach(type => { if (hm >= toMin(n[type])) n.sent[type] = todayKey(); });
        save(); notify('Life Quest', '通知をONにしました'); openReminder();
      });
    });
  }
  function notify(title, body) {
    const opts = { body, tag: 'life-quest', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' };
    if (navigator.serviceWorker && navigator.serviceWorker.controller) { navigator.serviceWorker.ready.then(r => r.showNotification(title, opts)).catch(() => {}); return; }
    try { new Notification(title, opts); } catch (e) {}
  }
  function checkNotify() {
    const n = state.notify;
    if (!n.on || !canNotify() || Notification.permission !== 'granted') return;
    const now = new Date(), hm = now.getHours() * 60 + now.getMinutes(), k = todayKey();
    const c = C || compute();
    const count = currentIdsFor(k).length, day = c.perDay[k] || { done: 0 };
    for (const type of ['morning', 'evening']) {
      const at = toMin(n[type]);
      if (n.sent[type] === k || hm < at || hm > at + 120) continue;
      n.sent[type] = k; save();
      if (type === 'morning') notify('今日のクエスト', count ? `${count}個のクエストが待っている` : '今日は休みです');
      else if (count && !day.cleared) notify('まだ間に合う！', `あと${needFor(count) - day.done}個で達成`);
    }
  }
  function exportIcs() {
    const t = parseKey(addDays(todayKey(), 1));
    const ymd = `${t.getFullYear()}${pad(t.getMonth() + 1)}${pad(t.getDate())}`;
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const ev = (id, time, summary) => ['BEGIN:VEVENT', `UID:lifequest-${id}-${uid()}@lifequest.local`, `DTSTAMP:${stamp}`,
      `DTSTART:${ymd}T${time.replace(':', '')}00`, 'DURATION:PT10M', 'RRULE:FREQ=DAILY', `SUMMARY:${summary}`, `URL:${APP_URL}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${summary}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT'];
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Life Quest//JA', 'CALSCALE:GREGORIAN',
      ...ev('morning', state.notify.morning, 'Life Quest：今日のクエスト'), ...ev('evening', state.notify.evening, 'Life Quest：やり残しチェック'), 'END:VCALENDAR'];
    saveFile(new Blob([lines.join('\r\n')], { type: 'text/calendar' }), 'life-quest-reminder.ics');
  }

  // ---------- バックアップ ----------
  async function saveFile(blob, name) {
    try {
      const file = new File([blob], name, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return true; }
    } catch (e) { if (e && e.name === 'AbortError') return false; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return true;
  }
  async function backup() {
    const ok = await saveFile(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }), `life-quest-${todayKey()}.json`);
    if (ok) { state.lastBackup = todayKey(); save(); toast('バックアップしました'); }
  }
  function openBackup() {
    openSheet('バックアップ・復元', `
      <div class="dim">${state.lastBackup ? `最終バックアップ：${md(state.lastBackup)}（${daysBetween(state.lastBackup, todayKey())}日前）` : 'まだバックアップしていません'}</div>
      <button class="btn full mt12" id="bkSave">ファイルに保存</button>
      <button class="btn gray full mt12" id="bkLoad">ファイルから復元</button>`, body => {
      body.querySelector('#bkSave').onclick = async () => { await backup(); openBackup(); };
      body.querySelector('#bkLoad').onclick = () => $('importFile').click();
    });
  }
  $('importFile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const s = JSON.parse(await f.text());
      if (!Array.isArray(s.tasks) || typeof s.log !== 'object') throw 0;
      if (!confirm('現在の記録を上書きします。よろしいですか？')) return;
      state = migrate(s); state.onboarded = true; state.seenUntil = addDays(todayKey(), -1); state.lastLevel = levelOf(compute().total).lv;
      save(); closeSheet(); render(); toast('復元しました');
    } catch (err) { toast('ファイルを読み込めませんでした'); }
    e.target.value = '';
  });
  function openReset() {
    openSheet('データを全て削除', `<div>すべての記録が消えます。元に戻せません。</div>
      <div class="row mt12"><button class="btn gray" id="rsNo">やめる</button><button class="btn red" id="rsYes">削除</button></div>`, body => {
      body.querySelector('#rsNo').onclick = closeSheet;
      body.querySelector('#rsYes').onclick = () => { state = freshState(); save(); closeSheet(); render(); startOnboarding(false); };
    });
  }

  // ---------- PWA ----------
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW', err));
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  let installEvt = null;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
  function openInstall() {
    const msg = standalone() ? 'インストール済みです。'
      : installEvt ? 'ホーム画面に追加できます。'
      : isIOS ? 'Safariの共有ボタン →「ホーム画面に追加」' : 'ブラウザのメニュー →「アプリをインストール」';
    openSheet('インストール', `<div>${msg}</div>${installEvt && !standalone() ? '<button class="btn full mt12" id="instBtn">追加する</button>' : ''}`, body => {
      const b = body.querySelector('#instBtn');
      if (b) b.onclick = async () => { installEvt.prompt(); await installEvt.userChoice.catch(() => {}); installEvt = null; closeSheet(); };
    });
  }

  // 初めて開いた時：冒険を始める前にホーム画面への追加をすすめる
  // （iPhoneはSafariとホーム画面のアプリで記録が別々になるので、先に追加してもらう）
  const isAndroid = /android/i.test(navigator.userAgent);
  const inAppBrowser = /Line\/|FBAN|FBAV|Instagram/i.test(navigator.userAgent);
  const SHARE_ICON = '<svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true" style="vertical-align:-3px"><path d="M8 1v10M4 5l4-4 4 4M3 8H1v9h14V8h-2" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  function needInstallGate() {
    return !state.onboarded && !Object.keys(state.log).length && !standalone() && (isIOS || isAndroid) && !state.installSkipped;
  }
  function showInstallGate() {
    let talk, body, main = '';
    if (inAppBrowser) {
      talk = 'LINEなどのアプリ内ブラウザでは、ホーム画面に追加できない。右上のメニューから「ブラウザで開く」を選んでほしい。';
      body = `<ol class="inst-steps"><li>右上の「…」や「︙」を押す</li><li>「${isIOS ? 'Safari' : 'ブラウザ'}で開く」を押す</li><li>開いたページでホーム画面に追加する</li></ol>`;
    } else if (isIOS) {
      talk = '冒険を始める前に、このアプリをホーム画面に追加しておこう。全画面で開けて、毎日の記録も消えにくくなる。';
      body = `<ol class="inst-steps"><li>画面下（iPadは右上）の共有ボタン ${SHARE_ICON} を押す</li><li>「ホーム画面に追加」を押す（見つからない時は下にスクロール）</li><li>右上の「追加」を押す</li><li>ホーム画面の Life Quest のアイコンから開き直す</li></ol>
        <div class="inst-warn">⚠ iPhoneでは、Safariで遊んだ記録はホーム画面のアプリに引き継がれません。先に追加してから始めてください。</div>`;
    } else {
      talk = '冒険を始める前に、このアプリをホーム画面に追加しておこう。全画面で開けて、通知も届きやすくなる。';
      body = installEvt ? '<button class="btn full" id="instGo">ホーム画面に追加する</button>'
        : '<ol class="inst-steps"><li>右上のメニュー（︙）を押す</li><li>「ホーム画面に追加」または「アプリをインストール」を押す</li><li>ホーム画面のアイコンから開き直す</li></ol>';
    }
    $('obBox').innerHTML = `<div class="talk"><span class="typing" id="obSay"></span></div>${body}
      <div class="nav"><button class="btn gray" id="instSkip">追加せずに始める</button></div>`;
    $('ob').classList.remove('hidden');
    typeText($('obSay'), talk);
    const go = $('instGo');
    if (go) go.onclick = async () => {
      installEvt.prompt();
      const r = await installEvt.userChoice.catch(() => null);
      installEvt = null;
      if (r && r.outcome === 'accepted') {
        $('obBox').innerHTML = '<div class="talk">追加できた！ このままでも、ホーム画面のアイコンからでも記録は同じ。さあ、冒険を始めよう。</div><div class="nav"><button class="btn" id="instSkip">冒険を始める</button></div>';
        $('instSkip').onclick = () => { state.installSkipped = true; save(); startOnboarding(false); };
      } else showInstallGate();
    };
    $('instSkip').onclick = () => { state.installSkipped = true; save(); startOnboarding(false); };
  }
  // Androidでは追加ボタンの準備が少し遅れて届くので、届いたら画面を作り直す
  window.addEventListener('beforeinstallprompt', () => { if (!$('ob').classList.contains('hidden') && $('instSkip') && !$('instGo') && !inAppBrowser) showInstallGate(); });

  // ---------- 起動 ----------
  let lastKey = todayKey();
  setInterval(() => { if (todayKey() !== lastKey) { lastKey = todayKey(); render(); } checkNotify(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { render(); checkNotify(); } });

  state.lastLevel = state.lastLevel || levelOf(compute().total).lv;
  applyFont();
  save();
  render();
  checkNotify();
  // すでに遊んでいる人にも、チュートリアルを1回だけ見せる
  // 他の小窓（レベルアップなど）が開いている間は待って、閉じてから表示する
  const tryTutorial = () => {
    if (state.tutorialDone || tutStep >= 0) return;
    const busy = ['lvModal', 'sheet', 'ob', 'gacha'].some(id => !$(id).classList.contains('hidden'));
    if (busy) setTimeout(tryTutorial, 1000); else startTutorial();
  };
  if (state.onboarded && !state.tutorialDone) setTimeout(tryTutorial, 1500);
  if (!state.onboarded) {
    if (needInstallGate()) showInstallGate();
    else if (!Object.keys(state.log).length) startOnboarding(false);
    else {
      openSheet('お知らせ', `<div>質問に答えて、自分に合ったクエストを選び直しますか？</div><div class="dim mt8">レベルとEXPはそのまま残ります。</div>
        <div class="row mt12"><button class="btn gray" id="askNo">いいえ</button><button class="btn" id="askYes">はい</button></div>`, body => {
        body.querySelector('#askYes').onclick = () => startOnboarding(true);
        body.querySelector('#askNo').onclick = () => { closeSheet(); state.onboarded = true; save(); render(); };
      });
    }
  }
})();
