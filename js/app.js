(() => {
  'use strict';
  const S = window.Sprites;
  const KEY = 'lifeQuest.v1';
  const DAY_START_HOUR = 3;
  const MAX_HP = 100, HEAL = 10, DMG_PARTIAL = 15, DMG_NONE = 25;
  const FREEZE_EVERY = 3;
  const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
  const WD = '日月火水木金土';
  const APP_URL = 'https://umayuma104-jpg.github.io/life-quest/';
  const CATS = {
    str: { en: 'STR', name: 'たいりょく', color: 'var(--r)' },
    int: { en: 'INT', name: 'ちりょく', color: 'var(--b)' },
    mnd: { en: 'MND', name: 'せいしん', color: 'var(--p)' },
    vit: { en: 'VIT', name: 'せいかつ', color: 'var(--g)' },
  };
  const TITLES = [
    [1, '見習い'], [3, '駆け出しの冒険者'], [5, '規律の挑戦者'], [8, '鍛錬の戦士'],
    [12, '習慣の騎士'], [16, '鋼の意志'], [20, '自己の支配者'], [25, '覚醒者'],
    [30, '英雄'], [40, '伝説'], [50, '人生の到達者'],
  ];
  // レベルで増えるクエスト枠
  const SLOT_LV = [[1, 3], [3, 4], [5, 5], [8, 6], [12, 7], [16, 8], [20, 9], [25, 10]];
  const slotsFor = lv => SLOT_LV.filter(s => lv >= s[0]).pop()[1];
  const nextSlotLv = lv => (SLOT_LV.find(s => s[0] > lv) || [null])[0];
  // 枠の色（見た目の変化）
  const FRAMES = [[1, '#ffffff'], [10, '#5ac8ff'], [20, '#fce35a'], [30, '#ff7ad9'], [50, '#3cdc6c']];
  const frameFor = lv => FRAMES.filter(f => lv >= f[0]).pop()[1];

  // ---------- クエストのカタログ（はじめての しつもん / テンプレート） ----------
  // goals: その目的にどれだけ合うか / scale: 目標値を何で変えるか
  const GOALS = {
    fit: 'たいりょくを つけたい', slim: 'やせたい・ひきしめたい', wake: 'はやおき したい',
    study: 'べんきょう・じことうし', mind: 'こころを ととのえたい', rhythm: 'せいかつリズムを ととのえたい',
  };
  const CATALOG = [
    { key: 'wake', icon: 'sun', name: '早起き', type: 'wake', cat: 'vit', xp: 30, goals: { wake: 6, rhythm: 3 }, time: 0 },
    { key: 'pushup', icon: 'dumbbell', name: '腕立て伏せ', type: 'count', cat: 'str', xp: 20, unit: '回', targets: [10, 20, 40], steps: [5, 5, 10], scale: 'fit', goals: { fit: 4, slim: 2 }, time: 5 },
    { key: 'squat', icon: 'dumbbell', name: 'スクワット', type: 'count', cat: 'str', xp: 20, unit: '回', targets: [15, 30, 50], steps: [5, 10, 10], scale: 'fit', goals: { fit: 3, slim: 4 }, time: 5 },
    { key: 'plank', icon: 'plank', name: 'プランク', type: 'count', cat: 'str', xp: 15, unit: '秒', targets: [20, 45, 90], steps: [10, 15, 30], scale: 'fit', goals: { fit: 3, slim: 2 }, time: 3 },
    { key: 'walk', icon: 'shoe', name: 'ウォーキング', type: 'count', cat: 'str', xp: 20, unit: '分', targets: [15, 30, 45], steps: [5, 5, 5], scale: 'time', goals: { slim: 4, fit: 2, mind: 1, rhythm: 1 }, timeIsTarget: true, maxFit: 1 },
    { key: 'run', icon: 'shoe', name: 'ランニング', type: 'count', cat: 'str', xp: 30, unit: '分', targets: [10, 20, 30], steps: [5, 5, 5], scale: 'time', goals: { fit: 5, slim: 4 }, timeIsTarget: true, minFit: 1 },
    { key: 'stretch', icon: 'star', name: 'ストレッチ', type: 'count', cat: 'str', xp: 10, unit: '分', targets: [5, 10, 15], steps: [5, 5, 5], scale: 'time', goals: { fit: 1, mind: 2, slim: 1 }, timeIsTarget: true },
    { key: 'water', icon: 'drop', name: '水を飲む', type: 'count', cat: 'vit', xp: 10, unit: 'L', targets: [1.5, 2, 2], steps: [0.5, 0.5, 0.5], scale: 'fit', goals: { slim: 3, rhythm: 2 }, time: 0 },
    { key: 'read', icon: 'book', name: '読書', type: 'count', cat: 'int', xp: 20, unit: 'ページ', targets: [10, 20, 40], steps: [5, 5, 10], scale: 'time', goals: { study: 5, mind: 1 }, time: [10, 20, 40] },
    { key: 'study', icon: 'pen', name: '勉強', type: 'count', cat: 'int', xp: 25, unit: '分', targets: [15, 30, 60], steps: [5, 10, 15], scale: 'time', goals: { study: 6 }, timeIsTarget: true },
    { key: 'meditate', icon: 'lotus', name: '瞑想', type: 'count', cat: 'mnd', xp: 15, unit: '分', targets: [3, 5, 10], steps: [1, 5, 5], scale: 'time', goals: { mind: 6, rhythm: 1 }, timeIsTarget: true },
    { key: 'journal', icon: 'pen', name: '日記を書く', type: 'check', cat: 'mnd', xp: 15, goals: { mind: 3, study: 1 }, time: 5 },
    { key: 'nophone', icon: 'phone', name: '寝る前1時間スマホを見ない', type: 'check', cat: 'mnd', xp: 20, goals: { mind: 3, rhythm: 4, wake: 3 }, time: 0 },
    { key: 'sleep', icon: 'moon', name: '23時までに寝る', type: 'check', cat: 'vit', xp: 20, goals: { rhythm: 5, wake: 4 }, time: 0 },
    { key: 'sunlight', icon: 'sun', name: '朝日を浴びる', type: 'check', cat: 'vit', xp: 10, goals: { rhythm: 3, mind: 2, wake: 2 }, time: 5 },
    { key: 'tidy', icon: 'broom', name: '部屋を片付ける', type: 'check', cat: 'vit', xp: 10, goals: { mind: 2, rhythm: 2 }, time: 10 },
    { key: 'nosnack', icon: 'apple', name: '間食しない', type: 'check', cat: 'vit', xp: 15, goals: { slim: 5 }, time: 0 },
  ];
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
      name: 'ぼうけんしゃ', tasks: [], log: {}, sched: {}, lastLevel: 1, start: t, seenUntil: addDays(t, -1),
      onboarded: false, sound: true, vibe: true, lastBackup: null, backupSnooze: null,
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
    });
    if (!s.start) s.start = Object.keys(s.log).sort()[0] || t;
    if (!s.seenUntil) s.seenUntil = addDays(t, -1);
    if (!s.notify) s.notify = { on: false, morning: '07:00', evening: '21:00', sent: {} };
    if (!s.notify.sent) s.notify.sent = {};
    if (s.sound === undefined) s.sound = true;
    if (s.vibe === undefined) s.vibe = true;
    if (s.name === '冒険者') s.name = 'ぼうけんしゃ';
    // 過去の日の「その日にやる予定だったクエスト」を記録（後でクエストを変えても過去の判定が変わらないように）
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

  // ---------- 計算 ----------
  function completion(task, v) {
    if (v == null || v === '' || v === false) return 0;
    if (task.type === 'check') return v ? 1 : 0;
    if (task.type === 'count') return Math.max(0, Math.min(1, Number(v) / (task.target || 1)));
    if (task.type === 'wake') {
      const diff = toMin(v) - toMin(task.wake);
      return diff <= 0 ? 1 : diff <= 30 ? 0.5 : 0;
    }
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

  // 開始日から今日まで1日ずつ再生して、すべての数値を計算する
  function compute() {
    const tKey = todayKey();
    const byId = Object.fromEntries(state.tasks.map(t => [t.id, t]));
    const cat = { str: 0, int: 0, mnd: 0, vit: 0 };
    const perDay = {}, events = [], bosses = {};
    let total = 0, hp = MAX_HP, streak = 0, best = 0, freezes = 0;
    let clearedDays = 0, frozenDays = 0, knockouts = 0, bossWins = 0;
    let boss = null;
    let first = state.start;
    const logFirst = Object.keys(state.log).sort()[0];
    if (logFirst && logFirst < first) first = logFirst;

    for (let k = first; k <= tKey; k = addDays(k, 1)) {
      const ws = weekStart(k);
      if (!boss || boss.ws !== ws) { boss = bossFor(ws, byId); bosses[ws] = boss; }
      const entries = state.log[k] || {};
      const ids = schedIds(k).filter(id => byId[id]);
      const mult = bonusFor(streak);
      let dayXp = 0, done = 0;
      for (const id in entries) {
        const t = byId[id]; if (!t) continue;
        const c = completion(t, entries[id]);
        const g = Math.round(t.xp * c * mult);
        dayXp += g; cat[t.cat] += g;
        if (c >= 1 && ids.includes(id)) done++;
      }
      const count = ids.length;
      const recorded = Object.keys(entries).length > 0;
      const cleared = count > 0 && done >= needFor(count);
      let status;
      total += dayXp;
      if (count === 0) status = 'rest';
      else if (cleared) {
        status = 'cleared'; streak++; clearedDays++; best = Math.max(best, streak);
        hp = Math.min(MAX_HP, hp + HEAL);
        if (streak % FREEZE_EVERY === 0) {
          freezes++;
          events.push({ k, t: 'freeze', text: `れんぞく ${streak}にち たっせい！ ❄こおりの おまもりを てにいれた（${freezes}こ）` });
        }
      } else if (k === tKey) status = 'pending';
      else if (freezes > 0) {
        freezes--; frozenDays++; status = 'frozen';
        events.push({ k, t: 'frozen', text: `たっせい ならず… ❄が みをまもった！ れんぞく ${streak}にちは ぶじ（のこり ${freezes}こ）` });
      } else {
        const dmg = recorded ? DMG_PARTIAL : DMG_NONE;
        hp -= dmg; status = 'damage';
        const lost = streak; streak = 0;
        events.push({ k, t: 'damage', text: `${recorded ? 'たっせい ならず' : 'サボって しまった'}… ${dmg}の ダメージ！（HP ${Math.max(0, hp)}）${lost ? ` れんぞく ${lost}にちが とぎれた` : ''}` });
        if (hp <= 0) {
          const L = levelOf(total);
          const lostXp = Math.floor(L.rest / 2);
          total -= lostXp; hp = MAX_HP; knockouts++;
          events.push({ k, t: 'ko', text: `ぼうけんしゃは ちからつきた… ${lostXp}の EXPを うしなった` });
        }
      }
      boss.dmg += dayXp;
      if (!boss.defeated && boss.dmg >= boss.hp) {
        boss.defeated = k; total += boss.reward; bossWins++;
        events.push({ k, t: 'boss', text: `${boss.name}を たおした！ ${boss.reward}の EXPを かくとく！` });
      }
      perDay[k] = { xp: dayXp, done, count, cleared, mult, status, hp, recorded };
    }
    const today = perDay[tKey];
    return {
      total, cat, perDay, events, bosses, boss: bosses[weekStart(tKey)], streak, best, freezes, hp,
      clearedDays, frozenDays, knockouts, bossWins, mult: today ? today.mult : bonusFor(streak),
    };
  }

  // ---------- サウンド・しんどう ----------
  let actx = null;
  function audio() {
    if (!state.sound) return null;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      return actx;
    } catch (e) { return null; }
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
    damage: () => { noise(0.25, 0.15); tones([[196, 0.05, 0.3]], 'sawtooth', 0.05); },
  };
  // ブラウザは画面に触れる前の振動を禁止しているので、最初のタップまでは振動しない
  let touched = false;
  window.addEventListener('pointerdown', () => { touched = true; }, { once: true, capture: true });
  const vibrate = p => { if (touched && state.vibe && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} };

  // ---------- 描画 ----------
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const iconHtml = (key, size = 26) => S.icon(key, size) || `<span>${esc(key || '⭐')}</span>`;
  const fmt = n => Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
  let C = null, lastMsg = null;

  function render() {
    const tKey = todayKey();
    // 今日の予定を記録（翌日以降はこの記録で判定する）
    const ids = currentIdsFor(tKey);
    if (JSON.stringify(state.sched[tKey]) !== JSON.stringify(ids)) { state.sched[tKey] = ids; save(); }

    const c = C = compute();
    const L = levelOf(c.total);
    document.documentElement.style.setProperty('--frame', frameFor(L.lv));
    $('heroPic').innerHTML = S.hero(L.lv, 56);
    $('heroName').textContent = state.name;
    $('lvNum').textContent = L.lv;
    $('titleTxt').textContent = `しょうごう：${titleOf(L.lv)}`;
    $('hpTxt').textContent = `${c.hp}/${MAX_HP}`;
    $('hpBar').style.width = (c.hp / MAX_HP * 100) + '%';
    $('xpTxt').textContent = `${L.rest}/${L.need}`;
    $('xpBar').style.width = (L.rest / L.need * 100) + '%';
    $('streakChip').textContent = `🔥れんぞく ${c.streak}にち`;
    $('freezeChip').textContent = `❄×${c.freezes}`;
    $('bonusChip').textContent = `EXP×${c.mult.toFixed(2)}`;

    renderBackup(c);
    renderBoss(c);
    renderToday(c, L);
    renderStats(c, L);
    renderLog(c);
    renderSettings(L);

    if (L.lv > (state.lastLevel || 1)) levelUp(state.lastLevel || 1, L.lv, c);
    if (L.lv !== state.lastLevel) { state.lastLevel = L.lv; save(); }
    showReport(c);
  }

  function renderBackup(c) {
    const t = todayKey();
    const days = Object.keys(state.log).length;
    const since = state.lastBackup ? daysBetween(state.lastBackup, t) : null;
    const snoozed = state.backupSnooze && daysBetween(state.backupSnooze, t) < 3;
    const show = days >= 3 && !snoozed && (since === null || since >= 7);
    $('backupWin').classList.toggle('hidden', !show);
    if (show) $('backupMsg').textContent = since === null
      ? 'ぼうけんの きろくは この たんまつの なかだけに あります。きえる まえに バックアップ しておこう！'
      : `さいごの バックアップから ${since}にち たっています。`;
  }

  function renderBoss(c) {
    const b = c.boss, t = todayKey();
    const left = Math.max(0, b.hp - b.dmg);
    const daysLeft = 6 - ((dow(t) + 6) % 7);
    $('bossWin').classList.toggle('dead', !!b.defeated);
    $('bossWin').innerHTML = `<h3>こんしゅうの まもの</h3>
      <div class="boss"><div id="bossPic">${S.boss(b.idx, 64)}</div>
        <div class="grow">
          <div class="between"><span>${b.name}</span><span class="small ${b.defeated ? 'y' : 'dim'}">${b.defeated ? 'とうばつ！' : daysLeft ? `のこり ${daysLeft}にち` : 'きょうまで！'}</span></div>
          <div class="pbar boss"><i style="width:${left / b.hp * 100}%"></i></div>
          <div class="small dim">${b.defeated ? `${md(b.defeated)}に たおした！ ＋${b.reward}EXP` : `HP ${left}/${b.hp} ・ ほうしゅう ${b.reward}EXP`}</div>
        </div></div>`;
  }

  function renderToday(c, L) {
    const k = todayKey();
    const entries = state.log[k] || {};
    const ids = currentIdsFor(k);
    const tasks = ids.map(id => state.tasks.find(t => t.id === id));
    const day = c.perDay[k] || { done: 0, xp: 0, recorded: false };
    const count = tasks.length;
    $('todayTitle').textContent = `きょうの クエスト ${day.done}/${count}（${md(k)} ${WD[dow(k)]}）`;

    if (!count) {
      $('taskList').innerHTML = `<div class="dim">${activeTasks().length ? 'きょうは やすみの 日。ゆっくり やすもう。' : 'クエストが ありません。せっていから ふやそう。'}</div>`;
    } else {
      $('taskList').innerHTML = tasks.map(t => {
        const v = entries[t.id];
        const comp = completion(t, v);
        const done = comp >= 1;
        const gain = Math.round(t.xp * comp * c.mult);
        let meta = '', act = '', ctl = '';
        if (t.type === 'check') {
          meta = `${t.xp}EXP`;
          act = `<button class="pbtn act ${done ? 'done' : ''}" data-act="toggle" data-id="${t.id}">${done ? '✓クリア' : 'やった！'}</button>`;
        } else if (t.type === 'count') {
          meta = `もくひょう ${fmt(t.target)}${esc(t.unit)} ・ ${t.xp}EXP`;
          act = `<button class="pbtn act ${done ? 'done' : ''}" data-act="fill" data-id="${t.id}">${done ? '✓クリア' : 'たっせい'}</button>`;
          ctl = `<div class="ctl">
            <button class="pbtn" data-act="minus" data-id="${t.id}">−${fmt(t.step)}</button>
            <label class="val"><input type="number" inputmode="decimal" min="0" step="any" data-act="count" data-id="${t.id}" value="${v ?? ''}" placeholder="0"><span>/ ${fmt(t.target)}${esc(t.unit)}</span></label>
            <button class="pbtn" data-act="plus" data-id="${t.id}">＋${fmt(t.step)}</button></div>`;
        } else {
          meta = `${t.wake}までに おきる ・ ${t.xp}EXP`;
          act = `<button class="pbtn act ${done ? 'done' : v ? '' : ''}" data-act="now" data-id="${t.id}">${v ? (done ? '✓クリア' : comp > 0 ? '△はんぶん' : '✗ちこく') : 'おきた！'}</button>`;
          ctl = `<div class="ctl"><span class="small dim">おきた じかん</span><input type="time" data-act="wake" data-id="${t.id}" value="${v ?? ''}"></div>`;
        }
        return `<div class="task ${done ? 'done' : ''}">
          <div class="top"><div class="ic">${iconHtml(t.icon)}</div>
            <div class="grow"><div class="tn">${done ? '✓ ' : ''}${esc(t.name)}</div>
              <div class="meta">${CATS[t.cat].en} ・ ${meta}${gain ? ` <span class="g">＋${gain}</span>` : ''}</div></div>
            ${act}</div>${ctl}</div>`;
      }).join('');
    }

    // ペナルティの予告
    const needN = needFor(count);
    let foot = '';
    if (!count) foot = '<span class="dim">やすみの 日は ペナルティ なし</span>';
    else if (day.cleared) {
      const toNext = FREEZE_EVERY - (c.streak % FREEZE_EVERY);
      foot = `<span class="y">★ きょうは たっせい！</span> HP＋${HEAL}・れんぞく ${c.streak}にち ${c.streak % FREEZE_EVERY === 0 ? '・❄ゲット！' : `・つぎの ❄まで ${toNext}にち`}
        <button class="pbtn share" id="shareDay">Xで シェア</button>`;
    } else {
      const left = needN - day.done;
      const dmg = day.recorded ? DMG_PARTIAL : DMG_NONE;
      const warn = c.freezes > 0
        ? `<span class="b">このまま 1日が おわると ❄を 1こ つかう</span>`
        : c.hp - dmg <= 0
          ? `<span class="r">このまま おわると HP−${dmg} で せんとうふのう！</span>`
          : `<span class="r">このまま 1日が おわると HP−${dmg}・れんぞく が 0 に</span>`;
      foot = `あと <span class="y">${left}こ</span> クリアで たっせい！<br>${warn}`;
    }
    $('dayFoot').innerHTML = foot;
    const sb = $('shareDay');
    if (sb) sb.onclick = () => share(`きょうの クエストを クリア！ Lv${L.lv}「${titleOf(L.lv)}」 🔥れんぞく${c.streak}にち #LifeQuest`);

    // メッセージ
    if (!lastMsg) {
      const b = c.boss;
      lastMsg = !count ? 'きょうは やすみの 日だ。からだを やすめよう。'
        : day.cleared ? `${esc(state.name)}は きょうの つとめを はたした！`
        : b.defeated ? `${esc(state.name)}は きょうも ぼうけんに でかけた。`
        : `${b.name}が あらわれた！<br>クエストを こなして たおそう！`;
    }
    $('msgWin').innerHTML = `<span class="cursor"></span>${lastMsg}`;
  }

  function renderStats(c, L) {
    $('heroBig').innerHTML = S.hero(L.lv, 96);
    $('equipList').innerHTML = S.EQUIP.map(([lv, n]) => `<div class="eq ${L.lv >= lv ? '' : 'lock'}"><span>${L.lv >= lv ? '▶' : '　'}${L.lv >= lv ? n : '？？？'}</span><span>Lv${lv}</span></div>`).join('');
    const max = Math.max(100, ...Object.values(c.cat));
    $('statList').innerHTML = Object.entries(CATS).map(([k, v]) => `<div class="stat"><span>${v.en}</span>
      <div class="pbar"><i style="width:${c.cat[k] / max * 100}%;background:${v.color}"></i></div><span class="y" style="text-align:right">${Math.floor(c.cat[k] / 10)}</span></div>`).join('');
    $('kpis').innerHTML = [
      ['れんぞく', `${c.streak}にち`], ['さいちょう れんぞく', `${c.best}にち`],
      ['たっせい日', `${c.clearedDays}にち`], ['❄ もち / つかった', `${c.freezes} / ${c.frozenDays}`],
      ['ボス とうばつ', `${c.bossWins}たい`], ['せんとうふのう', `${c.knockouts}かい`],
      ['クエストわく', `${slotsFor(L.lv)}`], ['そうけい EXP', c.total.toLocaleString()],
    ].map(([k, v]) => `<div><span class="dim small">${k}</span><b>${v}</b></div>`).join('');
    $('titleList').innerHTML = TITLES.map(([lv, n]) => `<div class="eq ${L.lv >= lv ? '' : 'lock'}"><span>${L.lv >= lv ? '★ ' + n : '　？？？'}</span><span>Lv${lv}</span></div>`).join('');
  }

  function renderLog(c) {
    const t = todayKey();
    const end = addDays(t, 6 - dow(t));
    const start = addDays(end, -34);
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

    // まもの ずかん
    const wins = Array(S.BOSSES.length).fill(0), seen = Array(S.BOSSES.length).fill(false);
    Object.values(c.bosses).forEach(b => { seen[b.idx] = true; if (b.defeated) wins[b.idx]++; });
    $('dex').innerHTML = S.BOSSES.map((b, i) => `<div>${S.boss(i, 44, !wins[i])}<div class="${wins[i] ? 'n' : ''}">${wins[i] ? b.name : seen[i] ? '？？？' : '・・・'}</div>${wins[i] ? `<div class="y">×${wins[i]}</div>` : ''}</div>`).join('');

    // 起床時刻
    const wakeTask = state.tasks.find(x => x.type === 'wake' && !x.archivedAt) || state.tasks.find(x => x.type === 'wake');
    const svg = $('wakeChart');
    if (!wakeTask) svg.innerHTML = '<text x="160" y="70" fill="#9a9ad0" font-size="12" text-anchor="middle">はやおき クエストが ありません</text>';
    else {
      const pts = [];
      for (let i = 13; i >= 0; i--) { const k = addDays(t, -i); const v = state.log[k]?.[wakeTask.id]; pts.push({ k, m: v ? toMin(v) : null }); }
      const goal = toMin(wakeTask.wake);
      const vals = pts.filter(p => p.m != null).map(p => p.m).concat(goal);
      const lo = Math.floor((Math.min(...vals) - 30) / 60) * 60, hi = Math.ceil((Math.max(...vals) + 30) / 60) * 60;
      const X = i => 34 + i * (276 / 13), Y = m => 10 + (m - lo) / (hi - lo) * 110;
      const step = hi - lo > 360 ? 120 : 60;
      let s = '';
      for (let h = lo; h <= hi; h += step) s += `<line x1="34" x2="310" y1="${Y(h)}" y2="${Y(h)}" stroke="#ffffff22"/><text x="28" y="${Y(h) + 4}" fill="#9a9ad0" font-size="10" text-anchor="end">${h / 60}じ</text>`;
      s += `<line x1="34" x2="310" y1="${Y(goal)}" y2="${Y(goal)}" stroke="#fce35a" stroke-dasharray="4 3"/><text x="310" y="${Y(goal) - 3}" fill="#fce35a" font-size="9" text-anchor="end">もくひょう ${wakeTask.wake}</text>`;
      pts.forEach((p, i) => { if (p.m != null) s += `<rect x="${X(i) - 4}" y="${Y(p.m) - 4}" width="8" height="8" fill="${p.m <= goal ? '#3cdc6c' : '#ff4a4a'}"/>`; });
      s += `<text x="34" y="136" fill="#9a9ad0" font-size="9">${md(pts[0].k)}</text><text x="310" y="136" fill="#9a9ad0" font-size="9" text-anchor="end">きょう</text>`;
      svg.innerHTML = s;
    }

    const ev = c.events.slice(-12).reverse();
    $('recent').innerHTML = ev.length ? ev.map(e => `<div class="ev"><span class="dt">${md(e.k)}</span><span>${esc(e.text)}</span></div>`).join('')
      : '<div class="dim">まだ なにも おきていない。ぼうけんは これからだ！</div>';
  }

  function renderSettings(L) {
    if (document.activeElement !== $('nameInput')) $('nameInput').value = state.name;
    const act = activeTasks(), slots = slotsFor(L.lv), nx = nextSlotLv(L.lv);
    $('slotTitle').textContent = `クエスト ${act.length}/${slots}`;
    $('editList').innerHTML = act.map(t => {
      const i = state.tasks.indexOf(t);
      const days = t.days.length === 7 ? 'まいにち' : ALL_DAYS.filter(d => t.days.includes(d)).map(d => WD[d]).join('');
      return `<div class="edit-row"><div class="ic">${iconHtml(t.icon, 22)}</div>
        <div class="grow">${esc(t.name)}<div class="small dim">${CATS[t.cat].en} ${t.xp}EXP ・ ${days}${t.from && t.from > todayKey() ? ' ・ <span class="y">あしたから</span>' : ''}</div></div>
        <button class="pbtn" data-act="up" data-i="${i}">↑</button>
        <button class="pbtn" data-act="edit" data-i="${i}">へんしゅう</button>
        <button class="pbtn danger" data-act="del" data-i="${i}">けす</button></div>`;
    }).join('') || '<div class="dim">クエストが ありません</div>';
    const full = act.length >= slots;
    $('addBtn').disabled = full;
    $('slotNote').textContent = full ? (nx ? `わくが いっぱい！ Lv${nx}で わくが ふえる。` : 'わくが いっぱい！') : `あと ${slots - act.length}こ ふやせる。`;
    const n = state.notify;
    setToggle('notifyBtn', n.on); setToggle('soundBtn', state.sound); setToggle('vibeBtn', state.vibe);
    if (document.activeElement !== $('nMorning')) $('nMorning').value = n.morning;
    if (document.activeElement !== $('nEvening')) $('nEvening').value = n.evening;
    $('backupInfo').textContent = state.lastBackup
      ? `さいごの バックアップ：${md(state.lastBackup)}（${daysBetween(state.lastBackup, todayKey())}にち まえ）`
      : 'まだ バックアップ していません。ファイルに ほぞんして おけば、きろくが きえても ふっかつ できます。';
  }
  function setToggle(id, on) { $(id).textContent = on ? 'ON' : 'OFF'; $(id).classList.toggle('on', !!on); }

  function levelUp(from, to, c) {
    const lines = [];
    const tNew = titleOf(to);
    if (tNew !== titleOf(from)) lines.push(`しょうごう「<span class="y">${tNew}</span>」を てにいれた！`);
    if (slotsFor(to) > slotsFor(from)) lines.push(`クエストわくが <span class="y">${slotsFor(to)}</span> に ふえた！`);
    S.EQUIP.filter(([lv]) => lv > from && lv <= to).forEach(([, n]) => lines.push(`そうび「<span class="y">${n}</span>」を てにいれた！`));
    if (frameFor(to) !== frameFor(from)) lines.push('ウィンドウの いろが かわった！');
    $('lvHero').innerHTML = S.hero(to, 96);
    $('lvModalNum').textContent = to;
    $('lvModalInfo').innerHTML = lines.join('<br>') || 'からだに ちからが みなぎる！';
    $('lvShare').onclick = () => share(`Life Quest で Lv${to}「${tNew}」に なった！ 🔥れんぞく${c.streak}にち #LifeQuest`);
    $('lvModal').classList.remove('hidden');
    flash(); SFX.level(); vibrate([80, 60, 80, 60, 200]);
  }
  function flash() { const f = $('flash'); f.classList.add('hidden'); void f.offsetWidth; f.classList.remove('hidden'); setTimeout(() => f.classList.add('hidden'), 700); }

  function showReport(c) {
    const y = addDays(todayKey(), -1);
    if (!state.onboarded || state.seenUntil >= y) return;
    const evs = c.events.filter(e => e.k > state.seenUntil && e.k <= y);
    state.seenUntil = y; save();
    if (!evs.length) return;
    $('reportList').innerHTML = evs.map(e => `<div class="ev"><span class="dt">${md(e.k)}</span><span>${esc(e.text)}</span></div>`).join('');
    $('reportModal').classList.remove('hidden');
    if (evs.some(e => e.t === 'damage' || e.t === 'ko')) { SFX.damage(); vibrate(200); } else if (evs.some(e => e.t === 'frozen')) SFX.freeze();
  }

  // ---------- 操作 ----------
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
    const nowDone = isDone(t, (state.log[k] || {})[id]);
    const name = esc(state.name), bossName = after.boss.name;

    if (after.bossWins > before.bossWins) {
      lastMsg = `${name}の こうげき！ ${bossName}を たおした！<br>${after.boss.reward}の EXPを かくとく！`;
      SFX.boss(); vibrate([100, 50, 300]); flash();
    } else if (after.perDay[k]?.cleared && !before.perDay[k]?.cleared) {
      lastMsg = `${name}は きょうの つとめを はたした！<br>HPが ${HEAL} かいふく した！${after.freezes > before.freezes ? '<br>❄こおりの おまもりを てにいれた！' : ''}`;
      after.freezes > before.freezes ? (SFX.clear(), setTimeout(SFX.freeze, 450)) : SFX.clear();
      vibrate([60, 40, 120]);
    } else if (nowDone && !wasDone) {
      lastMsg = `${name}は ${esc(t.name)}を やりとげた！<br><span class="g">${diff}</span>の けいけんちを かくとく！<br>${bossName}に <span class="r">${diff}</span>の ダメージ！`;
      SFX.done(); vibrate(40);
    } else if (diff > 0) {
      lastMsg = `${name}の こうげき！ ${bossName}に <span class="r">${diff}</span>の ダメージ！`;
      SFX.hit(); vibrate(20);
    } else if (diff < 0) {
      lastMsg = `${esc(t.name)}の きろくを もどした。`;
      SFX.undo();
    }
    render();
    if (diff > 0) { const p = document.querySelector('#bossPic svg'); if (p) { p.classList.remove('hit'); void p.offsetWidth; p.classList.add('hit'); } }
  }
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    document.body.appendChild(el); setTimeout(() => el.remove(), 1900);
  }
  function share(text) {
    SFX.tap();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(APP_URL)}`;
    window.open(url, '_blank', 'noopener');
  }

  $('taskList').addEventListener('click', e => {
    const b = e.target.closest('button[data-act]'); if (!b) return;
    const id = b.dataset.id, t = state.tasks.find(x => x.id === id);
    const cur = (state.log[todayKey()] || {})[id];
    const num = Number(cur) || 0;
    switch (b.dataset.act) {
      case 'toggle': setEntry(id, !cur); break;
      case 'fill': setEntry(id, isDone(t, cur) ? null : t.target); break;
      case 'plus': setEntry(id, Math.round((num + t.step) * 100) / 100); break;
      case 'minus': setEntry(id, Math.max(0, Math.round((num - t.step) * 100) / 100) || null); break;
      case 'now': {
        if (cur) setEntry(id, null);
        else { const d = new Date(); setEntry(id, `${pad(d.getHours())}:${pad(d.getMinutes())}`); }
      }
    }
  });
  $('taskList').addEventListener('change', e => {
    const el = e.target; if (!el.dataset.act) return;
    if (el.dataset.act === 'count') setEntry(el.dataset.id, el.value === '' ? null : Math.max(0, Number(el.value)));
    if (el.dataset.act === 'wake') setEntry(el.dataset.id, el.value || null);
  });

  document.querySelectorAll('nav button').forEach(b => b.addEventListener('click', () => {
    SFX.tap();
    document.querySelectorAll('nav button').forEach(x => x.classList.toggle('on', x === b));
    ['today', 'stats', 'log', 'settings'].forEach(n => $('tab-' + n).classList.toggle('hidden', n !== b.dataset.tab));
    window.scrollTo(0, 0);
  }));
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => { SFX.tap(); b.closest('.modal').classList.add('hidden'); }));
  $('nameInput').addEventListener('input', e => { state.name = e.target.value.trim() || 'ぼうけんしゃ'; save(); $('heroName').textContent = state.name; });
  $('soundBtn').addEventListener('click', () => { state.sound = !state.sound; save(); render(); SFX.tap(); });
  $('vibeBtn').addEventListener('click', () => { state.vibe = !state.vibe; save(); render(); vibrate(40); });

  // ---------- クエストの へんしゅう ----------
  let editing = -1, formDays = ALL_DAYS.slice(), formIcon = 'star', formStep = null, formTpl = null;
  function renderDays() {
    $('fDays').innerHTML = [1, 2, 3, 4, 5, 6, 0].map(d => `<button type="button" data-d="${d}" class="${formDays.includes(d) ? 'on' : ''}">${WD[d]}</button>`).join('');
  }
  function renderIcons() {
    $('iconPick').innerHTML = S.ICON_KEYS.map(k => `<button type="button" data-k="${k}" class="${k === formIcon ? 'on' : ''}">${S.icon(k, 22)}</button>`).join('');
  }
  $('fDays').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const d = Number(b.dataset.d);
    formDays = formDays.includes(d) ? formDays.filter(x => x !== d) : formDays.concat(d);
    renderDays();
  });
  $('iconPick').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; formIcon = b.dataset.k; renderIcons(); });
  function fillForm(t) {
    $('fName').value = t.name; $('fType').value = t.type; $('fCat').value = t.cat; $('fXp').value = t.xp;
    $('fTarget').value = t.target ?? 10; $('fUnit').value = t.unit ?? '回'; $('fWake').value = t.wake ?? '06:30';
    formIcon = t.icon || 'star'; formStep = t.step || null; formDays = (t.days || ALL_DAYS).slice();
    renderIcons(); renderDays(); syncForm();
  }
  function openForm(i) {
    editing = i; formTpl = null;
    $('formTitle').textContent = i >= 0 ? 'クエストを へんしゅう' : 'クエストを ついか';
    const used = new Set(activeTasks().map(t => t.tpl));
    $('tplList').innerHTML = CATALOG.filter(x => !used.has(x.key)).map(x => `<button type="button" class="pbtn" data-tpl="${x.key}">${S.icon(x.icon, 14)}${x.name}</button>`).join('');
    $('tplList').previousElementSibling.classList.toggle('hidden', i >= 0);
    $('tplList').classList.toggle('hidden', i >= 0);
    fillForm(i >= 0 ? state.tasks[i] : { icon: 'star', name: '', type: 'check', cat: 'str', xp: 20, target: 10, unit: '回', wake: '06:30' });
    $('taskForm').classList.remove('hidden');
    $('taskForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('tplList').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const x = CATALOG.find(c => c.key === b.dataset.tpl);
    formTpl = x.key;
    fillForm(fromTemplate(x, prefs()));
  });
  function syncForm() {
    $('fCountRow').classList.toggle('hidden', $('fType').value !== 'count');
    $('fWakeRow').classList.toggle('hidden', $('fType').value !== 'wake');
  }
  $('fType').addEventListener('change', syncForm);
  $('addBtn').addEventListener('click', () => { SFX.tap(); openForm(-1); });
  $('cancelBtn').addEventListener('click', () => $('taskForm').classList.add('hidden'));
  $('saveBtn').addEventListener('click', () => {
    const name = $('fName').value.trim();
    if (!name) { $('fName').focus(); return; }
    if (!formDays.length) { alert('ようびを 1つ いじょう えらんでください'); return; }
    const prev = editing >= 0 ? state.tasks[editing] : null;
    const t = {
      id: prev ? prev.id : uid(), tpl: prev ? prev.tpl : formTpl, icon: formIcon, name,
      type: $('fType').value, cat: $('fCat').value,
      xp: Math.max(1, Math.min(500, Number($('fXp').value) || 10)), days: formDays.slice().sort(),
    };
    if (t.type === 'count') {
      t.target = Math.max(0.1, Number($('fTarget').value) || 1); t.unit = $('fUnit').value.trim();
      t.step = formStep && formStep < t.target ? formStep : autoStep(t.target, t.unit);
    }
    if (t.type === 'wake') t.wake = $('fWake').value || '06:30';
    if (prev) state.tasks[editing] = t; else state.tasks.push(t);
    save(); $('taskForm').classList.add('hidden'); SFX.done(); render();
  });
  $('editList').addEventListener('click', e => {
    const b = e.target.closest('button[data-act]'); if (!b) return;
    const i = Number(b.dataset.i);
    if (b.dataset.act === 'edit') openForm(i);
    if (b.dataset.act === 'up') {
      const act = activeTasks(), pos = act.indexOf(state.tasks[i]);
      if (pos > 0) { const j = state.tasks.indexOf(act[pos - 1]); [state.tasks[j], state.tasks[i]] = [state.tasks[i], state.tasks[j]]; save(); render(); }
    }
    if (b.dataset.act === 'del' && confirm(`「${state.tasks[i].name}」を けしますか？\n（これまでに かせいだ EXPは のこります）`)) {
      state.tasks[i].archivedAt = todayKey(); save(); render();
    }
  });

  // ---------- はじめての しつもん ----------
  let ob = null;
  function prefs() { return state.prefs || { fit: 1, time: 1, wake: '06:30' }; }
  function fromTemplate(x, p) {
    const idx = x.scale === 'time' ? p.time : p.fit;
    const t = { tpl: x.key, icon: x.icon, name: x.name, type: x.type, cat: x.cat, xp: x.xp, days: ALL_DAYS.slice() };
    if (x.type === 'count') { t.target = x.targets[idx]; t.unit = x.unit; t.step = x.steps[idx]; }
    if (x.type === 'wake') t.wake = p.wake || '06:30';
    return t;
  }
  function timeOf(x, p) {
    if (x.timeIsTarget) return x.targets[x.scale === 'time' ? p.time : p.fit];
    return Array.isArray(x.time) ? x.time[p.time] : (x.time || 0);
  }
  function recommend(p, slots) {
    const budget = [15, 30, 60][p.time];
    const goals = p.goals.length ? p.goals : Object.keys(GOALS);
    const pool = CATALOG.filter(x => !(x.minFit && p.fit < x.minFit) && !(x.maxFit !== undefined && p.fit > x.maxFit))
      // 目的に合わないものも「よい習慣」として少しだけ点を持たせ、枠が埋まらないことを防ぐ
      .map(x => ({ x, score: goals.reduce((a, g) => a + (x.goals[g] || 0), 0) * 2 + 1 + (x.key === 'wake' && p.wakeAsked ? 4 : 0) }))
      .sort((a, b) => b.score - a.score);
    const picks = [], cats = {};
    let used = 0;
    // カテゴリが偏らないように、同じ能力は少し減点しながら選ぶ。
    // 1回目は使える時間の中で、2回目は時間がかからないものを優先して残りの枠を埋める
    for (const strict of [true, false]) {
      while (picks.length < slots) {
        let best = null;
        for (const r of pool) {
          if (picks.includes(r)) continue;
          const tm = timeOf(r.x, p);
          if (strict && tm > 0 && used + tm > budget) continue;
          const s = r.score - (cats[r.x.cat] || 0) * 5 - (strict ? 0 : tm / 5);
          if (!best || s > best.s) best = { r, s };
        }
        if (!best) break;
        picks.push(best.r); cats[best.r.x.cat] = (cats[best.r.x.cat] || 0) + 1; used += timeOf(best.r.x, p);
      }
    }
    const rest = pool.filter(r => !picks.includes(r));
    return { picks: picks.map(r => r.x.key), order: picks.concat(rest).map(r => r.x.key) };
  }

  function startOnboarding(redo) {
    const L = levelOf(C ? C.total : 0);
    ob = { step: 0, redo, name: state.name, goals: [], fit: null, time: null, wakeH: null, picks: [], order: [], slots: slotsFor(L.lv) };
    $('ob').classList.remove('hidden');
    renderOb();
  }
  const OB_STEPS = 6;
  function obFrame(title, body, foot) {
    return `<div class="progress">${'■'.repeat(ob.step + 1)}${'□'.repeat(OB_STEPS - ob.step - 1)}</div>
      <div class="win msg"><span class="typing" id="obSay"></span></div>
      ${body ? `<div class="win"><h3>${title}</h3>${body}</div>` : ''}
      <div class="btns">${foot}</div>`;
  }
  function typeText(el, text) {
    el.textContent = '';
    let i = 0;
    const tick = () => { if (i <= text.length) { el.textContent = text.slice(0, i++); if (i % 3 === 0) SFX.tap(); setTimeout(tick, 22); } };
    tick();
  }
  function renderOb() {
    const box = $('obBox');
    const back = ob.step > 0 ? '<button class="pbtn" data-ob="back">もどる</button>' : (ob.redo ? '<button class="pbtn" data-ob="close">やめる</button>' : '');
    let say = '', html = '';
    switch (ob.step) {
      case 0:
        say = ob.redo ? 'しつもんに こたえて、いまの きみに あった クエストを えらびなおそう。'
          : 'ようこそ、ぼうけんしゃよ！ ここは まいにちの しゅうかんで つよくなる せかい。まずは なまえを おしえてほしい。';
        html = obFrame('なまえ', `<input id="obName" maxlength="12" class="full" value="${esc(ob.name)}">`, `${back}<button class="pbtn primary" data-ob="next">つぎへ</button>`);
        break;
      case 1:
        say = `${ob.name}よ、きみは なにを めざして いる？（3つまで えらべる）`;
        html = obFrame('もくてき', Object.entries(GOALS).map(([k, v]) => `<button class="choice ${ob.goals.includes(k) ? 'on' : ''}" data-goal="${k}">${v}</button>`).join(''),
          `${back}<button class="pbtn primary" data-ob="next" ${ob.goals.length ? '' : 'disabled'}>つぎへ</button>`);
        break;
      case 2:
        say = 'ふだん、うんどうは している？';
        html = obFrame('うんどう', [['ほとんど しない', 'これから はじめたい'], ['しゅうに 1〜2かい', 'たまに からだを うごかす'], ['しゅうに 3かい いじょう', 'うんどうは しゅうかんに なっている']]
          .map(([a, b], i) => `<button class="choice ${ob.fit === i ? 'on' : ''}" data-fit="${i}">${a}<span class="sub">${b}</span></button>`).join(''), back);
        break;
      case 3:
        say = '1にちに どれくらい じかんを つかえる？';
        html = obFrame('じかん', [['15ふん くらい', 'すきま じかんで'], ['30ふん くらい', 'すこし じかんを とれる'], ['1じかん いじょう', 'しっかり とりくみたい']]
          .map(([a, b], i) => `<button class="choice ${ob.time === i ? 'on' : ''}" data-time="${i}">${a}<span class="sub">${b}</span></button>`).join(''), back);
        break;
      case 4:
        say = 'ふだん なんじごろ おきている？ もくひょうを きめよう。';
        html = obFrame('おきる じかん', [['5じだい', '05:30'], ['6じだい', '06:30'], ['7じだい', '07:30'], ['8じ いこう', '08:30'], ['きまって いない', null]]
          .map(([a, v], i) => `<button class="choice ${ob.wakeH === i ? 'on' : ''}" data-wake="${i}" data-v="${v || ''}">${a}${v ? `<span class="sub">→ もくひょう ${fromMin(toMin(v) - 30)}</span>` : '<span class="sub">→ もくひょう 07:00</span>'}</button>`).join(''), back);
        break;
      case 5: {
        say = `${ob.name}に おすすめの クエストは これだ！ さいしょは ${ob.slots}こ から はじめよう。レベルが あがると ふやせる。`;
        const p = obPrefs();
        const list = ob.order.map(key => {
          const x = CATALOG.find(c => c.key === key), t = fromTemplate(x, p);
          const on = ob.picks.includes(key), off = !on && ob.picks.length >= ob.slots;
          const what = t.type === 'count' ? `${fmt(t.target)}${t.unit}` : t.type === 'wake' ? `${t.wake}までに` : 'まいにち';
          return `<div class="pick ${on ? 'on' : ''} ${off ? 'off' : ''}" data-pick="${key}"><span class="box">${on ? '✓' : ''}</span>${S.icon(x.icon, 22)}
            <span class="grow"><span class="pn">${x.name}</span><br><span class="small dim">${what} ・ ${CATS[x.cat].en} ・ ${x.xp}EXP</span></span></div>`;
        }).join('');
        html = obFrame(`えらんだ クエスト ${ob.picks.length}/${ob.slots}`, list,
          `${back}<button class="pbtn primary" data-ob="finish" ${ob.picks.length ? '' : 'disabled'}>ぼうけんを はじめる</button>`);
        break;
      }
    }
    box.innerHTML = html;
    typeText($('obSay'), say);
    window.scrollTo(0, 0); $('ob').scrollTop = 0;
  }
  function obPrefs() {
    const wakeVals = ['05:30', '06:30', '07:30', '08:30', null];
    const usual = wakeVals[ob.wakeH];
    return { fit: ob.fit ?? 1, time: ob.time ?? 1, goals: ob.goals, wake: usual ? fromMin(toMin(usual) - 30) : '07:00', wakeAsked: !!usual };
  }
  $('obBox').addEventListener('click', e => {
    const b = e.target.closest('[data-ob],[data-goal],[data-fit],[data-time],[data-wake],[data-pick]'); if (!b) return;
    SFX.tap();
    const d = b.dataset;
    if (d.ob === 'close') { $('ob').classList.add('hidden'); return; }
    if (d.ob === 'back') { ob.step--; renderOb(); return; }
    if (d.ob === 'next') {
      if (ob.step === 0) ob.name = ($('obName').value.trim() || 'ぼうけんしゃ').slice(0, 12);
      ob.step++; renderOb(); return;
    }
    if (d.goal) {
      ob.goals = ob.goals.includes(d.goal) ? ob.goals.filter(g => g !== d.goal) : ob.goals.length < 3 ? ob.goals.concat(d.goal) : ob.goals;
      renderOb(); return;
    }
    if (d.fit) { ob.fit = Number(d.fit); ob.step++; renderOb(); return; }
    if (d.time) { ob.time = Number(d.time); ob.step++; renderOb(); return; }
    if (d.wake) {
      ob.wakeH = Number(d.wake);
      const r = recommend(obPrefs(), ob.slots);
      ob.picks = r.picks; ob.order = r.order;
      ob.step++; renderOb(); return;
    }
    if (d.pick) {
      if (ob.picks.includes(d.pick)) ob.picks = ob.picks.filter(k => k !== d.pick);
      else if (ob.picks.length < ob.slots) ob.picks.push(d.pick);
      renderOb(); return;
    }
    if (d.ob === 'finish') finishOnboarding();
  });
  function finishOnboarding() {
    const p = obPrefs();
    state.prefs = p;
    state.name = ob.name;
    // きょう もう きろくが あるなら、あたらしい クエストは あしたから（きょうの たっせいを こわさない）
    const today = todayKey();
    const when = state.log[today] ? addDays(today, 1) : today;
    activeTasks().forEach(t => { t.archivedAt = when; });
    ob.order.filter(k => ob.picks.includes(k)).forEach(key => {
      const t = { id: uid(), ...fromTemplate(CATALOG.find(c => c.key === key), p) };
      if (when !== today) t.from = when;
      state.tasks.push(t);
    });
    state.onboarded = true;
    save();
    $('ob').classList.add('hidden');
    lastMsg = when === today
      ? `${esc(state.name)}の ぼうけんが はじまった！<br>まずは きょうの クエストに いどもう。`
      : `あたらしい クエストは あしたから はじまる！<br>きょうは いまの クエストを つづけよう。`;
    SFX.clear(); flash();
    document.querySelector('nav button[data-tab=today]').click();
    render();
  }
  $('redoOb').addEventListener('click', () => startOnboarding(true));

  // ---------- リマインダー ----------
  const canNotify = () => 'Notification' in window;
  $('notifyBtn').addEventListener('click', async () => {
    if (state.notify.on) { state.notify.on = false; save(); render(); return; }
    if (!canNotify()) { alert('この ブラウザは つうちに たいおう していません。iPhoneは ホームがめんに ついか してから ためしてください。'); return; }
    const p = await Notification.requestPermission();
    if (p !== 'granted') { alert('つうちが きょか されませんでした。せっていアプリから きょか してください。'); return; }
    state.notify.on = true;
    const now = new Date(), hm = now.getHours() * 60 + now.getMinutes();
    ['morning', 'evening'].forEach(type => { if (hm >= toMin(state.notify[type])) state.notify.sent[type] = todayKey(); });
    save(); render();
    notify('Life Quest', 'つうちを ONに しました');
  });
  ['nMorning', 'nEvening'].forEach((id, i) => $(id).addEventListener('change', e => {
    const type = i ? 'evening' : 'morning';
    state.notify[type] = e.target.value || (i ? '21:00' : '07:00');
    delete state.notify.sent[type]; save();
  }));
  function notify(title, body) {
    const opts = { body, tag: 'life-quest', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' };
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(r => r.showNotification(title, opts)).catch(() => {});
      return;
    }
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
      if (type === 'morning') notify('きょうの クエスト', count ? `${count}この クエストが まっている。${c.boss.name}の HPは のこり ${Math.max(0, c.boss.hp - c.boss.dmg)}` : 'きょうは やすみの 日');
      else if (count && !day.cleared) notify('まだ まにあう！', `あと ${needFor(count) - day.done}こで たっせい。${c.freezes ? 'このままだと ❄を 1こ つかう' : `このままだと HPが へる（いま ${c.hp}）`}`);
    }
  }
  $('icsBtn').addEventListener('click', () => {
    const t = parseKey(addDays(todayKey(), 1));
    const ymd = `${t.getFullYear()}${pad(t.getMonth() + 1)}${pad(t.getDate())}`;
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const ev = (id, time, summary, desc) => ['BEGIN:VEVENT', `UID:lifequest-${id}-${uid()}@lifequest.local`, `DTSTAMP:${stamp}`,
      `DTSTART:${ymd}T${time.replace(':', '')}00`, 'DURATION:PT10M', 'RRULE:FREQ=DAILY', `SUMMARY:${summary}`, `DESCRIPTION:${desc}`, `URL:${APP_URL}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${summary}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT'];
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Life Quest//JA', 'CALSCALE:GREGORIAN',
      ...ev('morning', state.notify.morning, 'Life Quest：きょうの クエスト', `${APP_URL} を ひらいて クエストを かくにん`),
      ...ev('evening', state.notify.evening, 'Life Quest：やりのこし チェック', 'たっせい まで あと なんこ？'),
      'END:VCALENDAR'];
    saveFile(new Blob([lines.join('\r\n')], { type: 'text/calendar' }), 'life-quest-reminder.ics');
  });

  // ---------- バックアップ ----------
  async function saveFile(blob, name) {
    // iPhone のホーム画面アプリではダウンロードできないので、共有シート（「ファイルに保存」）を使う
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
    if (ok) { state.lastBackup = todayKey(); save(); render(); toast('バックアップ しました'); }
  }
  $('exportBtn').addEventListener('click', backup);
  $('backupNow').addEventListener('click', backup);
  $('backupLater').addEventListener('click', () => { state.backupSnooze = todayKey(); save(); render(); });
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const s = JSON.parse(await f.text());
      if (!Array.isArray(s.tasks) || typeof s.log !== 'object') throw 0;
      if (!confirm('いまの きろくを バックアップの ないようで うわがき します。よろしいですか？')) return;
      state = migrate(s); state.onboarded = true; state.seenUntil = addDays(todayKey(), -1); state.lastLevel = levelOf(compute().total).lv;
      save(); render(); toast('ふっかつ しました');
    } catch (err) { alert('ファイルを よみこめませんでした'); }
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (confirm('すべての きろくを けして さいしょから やりなおします。よろしいですか？')) {
      state = freshState(); save(); lastMsg = null; render(); startOnboarding(false);
    }
  });

  // ---------- PWA ----------
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW', err));
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  let installEvt = null;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function renderInstall() {
    $('installBtn').classList.toggle('hidden', !installEvt || standalone());
    $('installMsg').innerHTML = standalone() ? 'インストール ずみ です。オフラインでも つかえます。'
      : installEvt ? 'ホームがめんに ついか すると アプリの ように つかえます。'
      : isIOS ? 'Safariの きょうゆう ボタン →「ホーム画面に追加」で インストール できます。つうちを つかうには インストールが ひつようです。'
      : 'ブラウザの メニューから「アプリを インストール」を えらんでください。';
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; renderInstall(); });
  window.addEventListener('appinstalled', () => { installEvt = null; renderInstall(); toast('インストール しました'); });
  $('installBtn').addEventListener('click', async () => {
    if (!installEvt) return;
    installEvt.prompt(); await installEvt.userChoice.catch(() => {});
    installEvt = null; renderInstall();
  });
  renderInstall();

  // ---------- 起動 ----------
  let lastKey = todayKey();
  setInterval(() => { if (todayKey() !== lastKey) { lastKey = todayKey(); lastMsg = null; render(); } checkNotify(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { render(); checkNotify(); } });

  state.lastLevel = state.lastLevel || levelOf(compute().total).lv;
  save();
  render();
  checkNotify();

  if (!state.onboarded) {
    if (!Object.keys(state.log).length) startOnboarding(false);
    else {
      // すでに遊んでいる人には、えらびなおすか きく
      $('askMsg').innerHTML = 'あたらしい ぼうけんの はじめかたが できました。<br>しつもんに こたえて、きみに あった クエストを えらびなおしますか？<br><span class="small dim">（これまでの EXPや レベルは そのまま のこります）</span>';
      $('askModal').classList.remove('hidden');
      $('askYes').onclick = () => { $('askModal').classList.add('hidden'); startOnboarding(true); };
      $('askNo').onclick = () => { $('askModal').classList.add('hidden'); state.onboarded = true; save(); render(); };
    }
  }
})();
