(() => {
  'use strict';
  const S = window.Sprites;
  const CAT = window.Catalog;
  const G = window.Gear;
  const GOLD_PER_CLEAR = 20, GOLD_BOSS = 100, GOLD_LEVEL = 50;
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
      owned: [], buys: [], gearLog: [],
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
  const tiersOf = gear => Object.fromEntries(Object.entries(gear).map(([s, id]) => [s, (G.get(id) || { tier: 0 }).tier]));
  const heroSvg = (size, gear) => S.hero(tiersOf(gear || currentGear()), size);
  const owns = id => G.get(id).price === 0 || state.owned.includes(id);
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
  const bossIdx = ws => Math.floor(parseKey(ws).getTime() / (7 * 864e5)) % S.BOSSES.length;
  function bossFor(ws, byId) {
    let hp = 0;
    for (let i = 0; i < 7; i++) {
      const k = addDays(ws, i);
      if (k < state.start) continue;
      hp += schedIds(k).reduce((a, id) => a + (byId[id] ? byId[id].xp : 0), 0);
    }
    hp = Math.max(50, Math.round(hp * 0.7));
    const idx = bossIdx(ws);
    return { ws, idx, name: S.BOSSES[idx].name, hp, dmg: 0, defeated: null, reward: Math.round(hp * 0.3) };
  }
  function compute() {
    const tKey = todayKey();
    const byId = Object.fromEntries(state.tasks.map(t => [t.id, t]));
    const cat = { str: 0, int: 0, mnd: 0, vit: 0 };
    const perDay = {}, events = [], bosses = {};
    let total = 0, hp = MAX_HP, streak = 0, best = 0, freezes = 0;
    let clearedDays = 0, frozenDays = 0, knockouts = 0, bossWins = 0, boss = null;
    let earned = 0, maxHp = MAX_HP, lvNow = 1;
    let first = state.start;
    const logFirst = Object.keys(state.log).sort()[0];
    if (logFirst && logFirst < first) first = logFirst;
    for (let k = first; k <= tKey; k = addDays(k, 1)) {
      const ws = weekStart(k);
      if (!boss || boss.ws !== ws) { boss = bossFor(ws, byId); bosses[ws] = boss; }
      const entries = state.log[k] || {};
      const ids = schedIds(k).filter(id => byId[id]);
      const mult = bonusFor(streak);
      const gs = G.stats(gearOn(k));
      maxHp = MAX_HP + gs.hp; hp = Math.min(hp, maxHp);
      let dayXp = 0, done = 0, dayGold = 0;
      for (const id in entries) {
        const t = byId[id]; if (!t) continue;
        const c = completion(t, entries[id]);
        const g = Math.round(t.xp * c * mult);
        dayXp += g; cat[t.cat] += g;
        if (c >= 1 && ids.includes(id)) done++;
      }
      const count = ids.length, recorded = Object.keys(entries).length > 0;
      const cleared = count > 0 && done >= needFor(count);
      let status;
      total += dayXp;
      if (count === 0) status = 'rest';
      else if (cleared) {
        status = 'cleared'; streak++; clearedDays++; best = Math.max(best, streak);
        hp = Math.min(maxHp, hp + HEAL);
        dayGold += GOLD_PER_CLEAR;
        if (streak % FREEZE_EVERY === 0) { freezes++; events.push({ k, icon: '❄', title: '氷のお守りを手に入れた', text: `${streak}日連続で達成！ 氷のお守りを手に入れた（所持 ${freezes}個）` }); }
      } else if (k === tKey) status = 'pending';
      else if (freezes > 0) {
        freezes--; frozenDays++; status = 'frozen';
        events.push({ k, icon: '🧊', title: '氷のお守りが身を守った', text: `未達成だったが、氷のお守りが身を守った。連続${streak}日は継続（残り ${freezes}個）` });
      } else {
        const dmg = Math.round((recorded ? DMG_PARTIAL : DMG_NONE) * (1 - gs.def / 100));
        hp -= dmg; status = 'damage';
        const lost = streak; streak = 0;
        events.push({ k, icon: '💥', title: `${dmg}のダメージ`, text: `${recorded ? '未達成' : '記録なし'}… HPが${Math.max(0, hp)}に減った。${lost ? `連続${lost}日が途切れた。` : ''}` });
        if (hp <= 0) {
          const L = levelOf(total), lostXp = Math.floor(L.rest / 2);
          total -= lostXp; hp = maxHp; knockouts++;
          events.push({ k, icon: '☠', title: '戦闘不能', text: `力尽きた… ${lostXp}EXPを失った。HPは全回復した。` });
        }
      }
      const bossDmg = Math.round(dayXp * (1 + gs.atk / 100));
      boss.dmg += bossDmg;
      if (!boss.defeated && boss.dmg >= boss.hp) {
        boss.defeated = k; total += boss.reward; bossWins++; dayGold += GOLD_BOSS;
        events.push({ k, icon: '⚔', title: 'ボスを倒した', text: `${boss.name}を倒した！ ${boss.reward}EXPと${GOLD_BOSS}Gを獲得！` });
      }
      // ゴールド：獲得EXPの半分＋達成ボーナス＋ボス＋レベルアップ
      dayGold += Math.round(dayXp / 2);
      const lvEnd = levelOf(total).lv;
      if (lvEnd > lvNow) dayGold += (lvEnd - lvNow) * GOLD_LEVEL;
      lvNow = Math.max(lvNow, lvEnd);
      earned += dayGold;
      perDay[k] = { xp: dayXp, done, count, cleared, mult, status, hp, recorded, bossDmg, gold: dayGold };
    }
    const today = perDay[tKey];
    const spent = state.buys.reduce((a, b) => a + b.price, 0);
    return { total, cat, perDay, events, bosses, boss: bosses[weekStart(tKey)], streak, best, freezes, hp, maxHp,
      clearedDays, frozenDays, knockouts, bossWins, mult: today ? today.mult : bonusFor(streak),
      earned, gold: earned - spent, gearStats: G.stats(gearOn(tKey)) };
  }

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
    openSheet('ルール', `<ul class="rules">
      <li>その日のクエストを<span class="y">3分の2以上</span>クリアすると「達成」</li>
      <li>達成するとHP＋${HEAL}、🔥連続記録＋1</li>
      <li>🔥連続1日ごとにEXP＋5%（最大×1.5）</li>
      <li>🔥3日連続ごとに<span class="b">❄氷のお守り</span>を1個獲得</li>
      <li>未達成の日は❄を1個使って、ダメージと連続記録のリセットを防ぐ</li>
      <li>❄がない場合、未達成で<span class="r">HP−${DMG_PARTIAL}</span>、記録なしで<span class="r">HP−${DMG_NONE}</span>。連続記録は0に戻る</li>
      <li>HPが0になると戦闘不能。今のレベルで貯めたEXPの半分を失う</li>
      <li>毎週月曜にボスが出現。稼いだEXPがそのままダメージになる</li>
      <li>早起きは30分以内の遅れならEXP半分</li>
      <li>回数を増やすと獲得EXPも増える</li>
      <li>ゴールド：獲得EXPの半分＋達成で${GOLD_PER_CLEAR}G＋ボス討伐で${GOLD_BOSS}G＋レベルアップで${GOLD_LEVEL}G</li>
      <li>ショップで装備を買える。兜・ブーツ・剣はボスへのダメージ、鎧・レギンス・盾は最大HPや被ダメージ軽減</li>
      <li>日付の切り替えは午前3時</li></ul>`);
  }

  // ---------- 描画 ----------
  let C = null;
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
    $('streakNum').textContent = c.streak;
    $('freezeNum').textContent = c.freezes;
    $('multNum').textContent = c.mult.toFixed(2);
    renderBoss(c); renderToday(c, L); renderStats(c, L); renderShop(c); renderLog(c); renderBadge();
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

  function renderBoss(c) {
    const b = c.boss, t = todayKey();
    const left = Math.max(0, b.hp - b.dmg);
    const daysLeft = 6 - ((dow(t) + 6) % 7);
    $('bossCard').classList.toggle('dead', !!b.defeated);
    $('bossCard').innerHTML = `<div id="bossPic">${S.boss(b.idx, 52)}</div>
      <div class="grow">
        <div style="display:flex;justify-content:space-between;gap:8px"><span>${b.name}</span><span class="dim">${b.defeated ? '<span class="y">討伐済み</span>' : daysLeft ? `残り${daysLeft}日` : '今日まで'}</span></div>
        <div class="bar boss"><i style="width:${left / b.hp * 100}%"></i></div>
        <div class="dim">${b.defeated ? `報酬 ＋${b.reward}EXP 獲得` : `HP ${left}/${b.hp}`}</div>
      </div>`;
  }

  function renderToday(c, L) {
    const k = todayKey();
    const entries = state.log[k] || {};
    const tasks = currentIdsFor(k).map(id => state.tasks.find(t => t.id === id));
    const day = c.perDay[k] || { done: 0, recorded: false };
    const count = tasks.length;
    $('todayProg').textContent = count ? `${day.done}/${count}` : '';
    if (!count) {
      $('taskList').innerHTML = `<div class="dim" style="padding:8px 0">${activeTasks().length ? '今日は休みです。' : 'クエストがありません。'}</div>
        ${activeTasks().length ? '' : '<button class="btn full mt8" data-act="openQuests">クエストを追加</button>'}`;
    } else {
      $('taskList').innerHTML = tasks.map(t => {
        const v = entries[t.id], comp = completion(t, v), done = comp >= 1;
        let sub = '', act = '', extra = '';
        if (t.type === 'check' || t.type === 'bed') {
          sub = `＋${t.xp}EXP`;
          act = done ? `<button class="btn green act" data-act="toggle" data-id="${t.id}">✓ クリア</button>`
            : `<button class="btn act" data-act="toggle" data-id="${t.id}">やった！</button>`;
        } else if (t.type === 'count') {
          sub = `${fmt(t.target)}${esc(t.unit)} ・ ＋${t.xp}EXP`;
          act = done ? `<button class="btn green act" data-act="fill" data-id="${t.id}">✓ クリア</button>`
            : `<button class="btn act" data-act="fill" data-id="${t.id}">完了</button>`;
          extra = `<div class="counter">
            <button class="btn gray" data-act="minus" data-id="${t.id}" aria-label="減らす">−</button>
            <div class="val">${fmt(v || 0)}<small> / ${fmt(t.target)}${esc(t.unit)}</small></div>
            <button class="btn gray" data-act="plus" data-id="${t.id}" aria-label="増やす">＋${fmt(t.step)}</button>
            <button class="btn sm gray" data-act="editCount" data-id="${t.id}" aria-label="数値を入力">✎</button></div>`;
        } else {
          sub = `${t.wake}までに起床 ・ ＋${t.xp}EXP`;
          act = v ? `<button class="btn ${done ? 'green' : 'gray'} act" data-act="editWake" data-id="${t.id}">${done ? '✓' : comp > 0 ? '△' : '✗'} ${v}</button>`
            : `<button class="btn act" data-act="now" data-id="${t.id}">起きた！</button>`;
        }
        return `<div class="task ${done ? 'done' : ''}"><div class="top-row">
          <div class="ic">${iconHtml(t.icon)}</div>
          <div class="grow"><div class="tn">${esc(taskName(t))}</div><div class="sub">${sub}</div></div>
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
    $('equipList').innerHTML = S.SLOTS.map(sl => { const x = G.get(gear[sl]); return `<div class="gear-row">${S.gearIcon(sl, x.tier, 28)}
      <span class="dim gs">${G.SLOTS[sl].name}</span><span class="grow">${x.name}</span><span class="dim">${G.fxText(x)}</span></div>`; }).join('')
      + `<div class="gear-sum">攻撃 <span class="y">+${gs.atk}%</span>　最大HP <span class="y">${MAX_HP + gs.hp}</span>　被ダメージ <span class="y">−${gs.def}%</span></div>`;
    const max = Math.max(100, ...Object.values(c.cat));
    $('statList').innerHTML = Object.entries(CATS).map(([k, v]) => `<div class="stat"><span>${v.en}</span>
      <div class="bar"><i style="width:${c.cat[k] / max * 100}%;background:${v.color}"></i></div><span style="text-align:right">${Math.floor(c.cat[k] / 10)}</span></div>`).join('');
    $('kpis').innerHTML = [
      ['🔥 最長連続', `${c.best}日`], ['★ 達成日数', `${c.clearedDays}日`],
      ['⚔ ボス討伐', `${c.bossWins}体`], ['❄ 使用回数', `${c.frozenDays}回`],
      ['☠ 戦闘不能', `${c.knockouts}回`], ['累計EXP', c.total.toLocaleString()],
    ].map(([k, v]) => `<div>${k}<b>${v}</b></div>`).join('');
  }
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
    $('dex').innerHTML = S.BOSSES.map((b, i) => `<div>${S.boss(i, 42, !wins[i])}<div class="${wins[i] ? 'n' : ''}">${wins[i] ? b.name : seen[i] ? '？？？' : '・・・'}</div>${wins[i] > 1 ? `<div class="y">×${wins[i]}</div>` : ''}</div>`).join('');

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
    lines.push(`ボーナス <span class="y">${(to - from) * GOLD_LEVEL}G</span>`);
    $('lvHero').innerHTML = heroSvg(96);
    $('lvModalNum').textContent = to;
    $('lvModalInfo').innerHTML = lines.join('<br>') || '力がみなぎる！';
    $('lvShare').onclick = () => share(`Life QuestでLv${to}「${tNew}」になった！ 🔥${c.streak}日連続 #LifeQuest`);
    $('lvModal').classList.remove('hidden');
    addMail({ icon: '★', title: `Lv${to}になった`, text: lines.join('・').replace(/<[^>]+>/g, '') });
    flash(); SFX.level(); vibrate([80, 60, 80, 60, 200]);
  }
  $('lvClose').addEventListener('click', () => { SFX.tap(); $('lvModal').classList.add('hidden'); });

  // ---------- ショップ ----------
  let shopSlot = 'sword', tryOn = null;
  function renderShop(c) {
    const gear = currentGear();
    const preview = Object.assign({}, gear);
    if (tryOn) preview[G.get(tryOn).slot] = tryOn;
    const now = c.gearStats, after = G.stats(preview);
    const diff = (a, b, unit, sign = '+') => a === b ? '' : ` <span class="${b > a ? 'g' : 'r'}">${b > a ? '▲' : '▼'}${sign}${b}${unit}</span>`;
    $('shopHero').innerHTML = heroSvg(84, preview);
    $('shopGold').textContent = c.gold.toLocaleString();
    $('shopStats').innerHTML = `攻撃 +${now.atk}%${diff(now.atk, after.atk, '%')}<br>最大HP ${MAX_HP + now.hp}${diff(now.hp, after.hp, '', '')}<br>被ダメージ −${now.def}%${diff(now.def, after.def, '%', '−')}`;
    $('tryNote').innerHTML = tryOn ? `<span class="y">試着中：${G.get(tryOn).name}</span>` : '<span class="dim">装備をタップすると試着できます</span>';
    $('shopSlots').innerHTML = S.SLOTS.map(sl => `<button class="btn ${sl === shopSlot ? 'on' : ''}" data-slot="${sl}">${G.SLOTS[sl].name}</button>`).join('');
    $('shopList').innerHTML = `<div class="dim" style="margin:10px 2px 4px">${G.SLOTS[shopSlot].name}（${G.SLOTS[shopSlot].kind}）</div>` + G.LIST.filter(x => x.slot === shopSlot).map(x => {
      const own = owns(x.id), worn = gear[x.slot] === x.id;
      const btn = worn ? '<button class="btn sm green" disabled>装備中</button>'
        : own ? `<button class="btn sm blue" data-equip="${x.id}">装備する</button>`
        : `<button class="btn sm" data-buy="${x.id}" ${c.gold < x.price ? 'disabled' : ''}>${x.price}G</button>`;
      return `<div class="card item ${tryOn === x.id ? 'trying' : ''}" data-try="${x.id}">
        <div class="item-ic">${S.gearIcon(x.slot, x.tier, 40)}</div>
        <div class="grow"><div>${x.name}${own && !worn ? ' <span class="dim">所持</span>' : ''}</div><div class="dim">${G.fxText(x)}</div></div>${btn}</div>`;
    }).join('');
  }
  function equip(id) {
    const x = G.get(id), t = todayKey();
    state.gearLog = state.gearLog.filter(e => !(e.k === t && e.slot === x.slot));
    state.gearLog.push({ k: t, slot: x.slot, id });
    tryOn = null; save(); render();
  }
  $('tab-shop').addEventListener('click', e => {
    const el = e.target.closest('[data-slot],[data-equip],[data-buy],[data-try]'); if (!el) return;
    SFX.tap();
    const d = el.dataset;
    if (d.slot) { shopSlot = d.slot; tryOn = null; return renderShop(C); }
    if (d.equip) { equip(d.equip); say(`${G.get(d.equip).name}を装備した！`); return; }
    if (d.buy) {
      const x = G.get(d.buy);
      openSheet('購入の確認', `<div class="edit-head">${S.gearIcon(x.slot, x.tier, 40)}<span>${x.name}</span></div>
        <div class="dim mt8">${G.fxText(x)}</div>
        <div class="mt12">${x.price}Gで購入しますか？（所持 ${C.gold.toLocaleString()}G）</div>
        <div class="row mt12"><button class="btn gray" id="byNo">やめる</button><button class="btn" id="byYes">購入する</button></div>`, body => {
        body.querySelector('#byNo').onclick = closeSheet;
        body.querySelector('#byYes').onclick = () => {
          if (C.gold < x.price) { toast('ゴールドが足りません'); return; }
          state.owned.push(x.id); state.buys.push({ k: todayKey(), id: x.id, price: x.price });
          closeSheet(); equip(x.id);
          say(`${x.name}を手に入れた！<br>さっそく装備した。`); SFX.clear(); flash(); vibrate([40, 30, 80]);
        };
      });
      return;
    }
    if (d.try) { tryOn = tryOn === d.try ? null : d.try; renderShop(C); }
  });
  $('equipBtn').addEventListener('click', () => { SFX.tap(); showTab('shop'); });

  // ---------- 記録 ----------
  function setEntry(id, v) {
    const k = todayKey();
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
    const gd = after.earned - before.earned;
    const nowDone = isDone(t, (state.log[k] || {})[id]);
    const name = esc(state.name), bossName = after.boss.name;
    if (after.bossWins > before.bossWins) {
      say(`${name}の攻撃！<br>${bossName}を倒した！ ＋${after.boss.reward}EXP ＋${GOLD_BOSS}G`); SFX.boss(); vibrate([100, 50, 300]); flash();
    } else if (after.perDay[k]?.cleared && !before.perDay[k]?.cleared) {
      say(`今日のクエストを達成！<br>HP＋${HEAL}${after.freezes > before.freezes ? '・❄氷のお守りを手に入れた！' : ''}`);
      SFX.clear(); if (after.freezes > before.freezes) setTimeout(SFX.freeze, 450); vibrate([60, 40, 120]);
    } else if (nowDone && !wasDone) {
      say(`${esc(taskName(t))}をやり遂げた！ <span class="y">＋${gd}G</span><br>${bossName}に<span class="r">${bd}</span>のダメージ！`); SFX.done(); vibrate(40);
    } else if (diff > 0) {
      say(`${bossName}に<span class="r">${bd}</span>のダメージ！`); SFX.hit(); vibrate(20);
    } else if (diff < 0) SFX.undo();
    render();
    if (diff > 0) { const p = document.querySelector('#bossPic svg'); if (p) { p.classList.remove('hit'); void p.offsetWidth; p.classList.add('hit'); } }
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
    ['♪', 'サウンド・振動', () => openSound()],
    ['⏰', '通知', () => openReminder()],
    ['📦', 'バックアップ・復元', () => openBackup()],
    ['📲', 'インストール', () => openInstall()],
    ['？', 'ルール', () => openHelp()],
    ['⚠', 'データを全て削除', () => openReset(), 'danger'],
  ];
  $('menuList').innerHTML = MENU.map(([ic, label, , cls], i) => `<button class="btn ${cls || ''}" data-menu="${i}"><span class="mi">${ic}</span>${label}<span class="arrow">▶</span></button>`).join('');
  $('menuList').addEventListener('click', e => { const b = e.target.closest('[data-menu]'); if (b) { SFX.tap(); MENU[b.dataset.menu][2](); } });

  function openName() {
    openSheet('名前の変更', `<input id="nm" maxlength="12" value="${esc(state.name)}"><div class="row mt12"><button class="btn" id="nmOk">保存</button></div>`, body => {
      body.querySelector('#nmOk').onclick = () => { state.name = body.querySelector('#nm').value.trim() || '冒険者'; save(); closeSheet(); render(); };
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
  }

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

  // ---------- 起動 ----------
  let lastKey = todayKey();
  setInterval(() => { if (todayKey() !== lastKey) { lastKey = todayKey(); render(); } checkNotify(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { render(); checkNotify(); } });

  state.lastLevel = state.lastLevel || levelOf(compute().total).lv;
  save();
  render();
  checkNotify();
  if (!state.onboarded) {
    if (!Object.keys(state.log).length) startOnboarding(false);
    else {
      openSheet('お知らせ', `<div>質問に答えて、自分に合ったクエストを選び直しますか？</div><div class="dim mt8">レベルとEXPはそのまま残ります。</div>
        <div class="row mt12"><button class="btn gray" id="askNo">いいえ</button><button class="btn" id="askYes">はい</button></div>`, body => {
        body.querySelector('#askYes').onclick = () => startOnboarding(true);
        body.querySelector('#askNo').onclick = () => { closeSheet(); state.onboarded = true; save(); render(); };
      });
    }
  }
})();
