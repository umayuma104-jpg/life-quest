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
  const SLOT_LV = [[1, 3], [3, 4], [5, 5], [8, 6], [12, 7], [16, 8], [20, 9], [25, 10]];
  const slotsFor = lv => SLOT_LV.filter(s => lv >= s[0]).pop()[1];
  const nextSlotLv = lv => (SLOT_LV.find(s => s[0] > lv) || [null])[0];
  const FRAMES = [[1, '#ffffff'], [10, '#5ac8ff'], [20, '#fce35a'], [30, '#ff7ad9'], [50, '#3cdc6c']];
  const frameFor = lv => FRAMES.filter(f => lv >= f[0]).pop()[1];

  // ---------- クエストのカタログ ----------
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
      name: 'ぼうけんしゃ', tasks: [], log: {}, sched: {}, inbox: [], lastLevel: 1, start: t, seenUntil: addDays(t, -1),
      onboarded: false, sound: true, vibe: true, lastBackup: null, backupMailed: null,
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
    });
    if (!s.start) s.start = Object.keys(s.log).sort()[0] || t;
    if (!s.seenUntil) s.seenUntil = addDays(t, -1);
    if (!s.notify) s.notify = { on: false, morning: '07:00', evening: '21:00', sent: {} };
    if (!s.notify.sent) s.notify.sent = {};
    if (s.sound === undefined) s.sound = true;
    if (s.vibe === undefined) s.vibe = true;
    if (!Array.isArray(s.inbox)) s.inbox = [];
    if (s.name === '冒険者') s.name = 'ぼうけんしゃ';
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
      const count = ids.length, recorded = Object.keys(entries).length > 0;
      const cleared = count > 0 && done >= needFor(count);
      let status;
      total += dayXp;
      if (count === 0) status = 'rest';
      else if (cleared) {
        status = 'cleared'; streak++; clearedDays++; best = Math.max(best, streak);
        hp = Math.min(MAX_HP, hp + HEAL);
        if (streak % FREEZE_EVERY === 0) { freezes++; events.push({ k, icon: '❄', title: '❄を てにいれた', text: `れんぞく ${streak}にち たっせい！ こおりの おまもりを てにいれた（${freezes}こ）` }); }
      } else if (k === tKey) status = 'pending';
      else if (freezes > 0) {
        freezes--; frozenDays++; status = 'frozen';
        events.push({ k, icon: '🧊', title: '❄が みを まもった', text: `たっせい できなかったが ❄が みを まもった。れんぞく ${streak}にちは ぶじ（のこり ${freezes}こ）` });
      } else {
        const dmg = recorded ? DMG_PARTIAL : DMG_NONE;
        hp -= dmg; status = 'damage';
        const lost = streak; streak = 0;
        events.push({ k, icon: '💥', title: `${dmg}の ダメージ`, text: `${recorded ? 'たっせい できなかった' : 'なにも きろく しなかった'}… HPが ${Math.max(0, hp)} に へった。${lost ? `れんぞく ${lost}にちが とぎれた。` : ''}` });
        if (hp <= 0) {
          const L = levelOf(total), lostXp = Math.floor(L.rest / 2);
          total -= lostXp; hp = MAX_HP; knockouts++;
          events.push({ k, icon: '☠', title: 'せんとうふのう', text: `ちからつきた… ${lostXp}の EXPを うしなった。HPは ぜんかい した。` });
        }
      }
      boss.dmg += dayXp;
      if (!boss.defeated && boss.dmg >= boss.hp) {
        boss.defeated = k; total += boss.reward; bossWins++;
        events.push({ k, icon: '⚔', title: 'ボスを たおした', text: `${boss.name}を たおした！ ${boss.reward}の EXPを かくとく！` });
      }
      perDay[k] = { xp: dayXp, done, count, cleared, mult, status, hp, recorded };
    }
    const today = perDay[tKey];
    return { total, cat, perDay, events, bosses, boss: bosses[weekStart(tKey)], streak, best, freezes, hp,
      clearedDays, frozenDays, knockouts, bossWins, mult: today ? today.mult : bonusFor(streak) };
  }

  // ---------- サウンド・しんどう ----------
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
  const fmt = n => Number.isInteger(Number(n)) ? String(Number(n)) : String(Math.round(n * 10) / 10);
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    document.body.appendChild(el); setTimeout(() => el.remove(), 2300);
  }
  // RPG風のメッセージ。しばらくすると消える
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

  // ---------- おしらせ（ポスト） ----------
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
        ${m.action === 'backup' ? '<div class="mb"><button class="btn sm" data-mail-act="backup">いま バックアップ する</button></div>' : ''}
      </div>`).join('') : '<div class="dim center" style="padding:20px">おしらせは ありません</div>';
    openSheet('おしらせ', html, body => {
      body.onclick = e => { if (e.target.closest('[data-mail-act]')) backup(); };
    });
    state.inbox.forEach(m => { m.read = true; }); save(); renderBadge();
  }
  $('mailBtn').addEventListener('click', openMail);
  $('helpBtn').addEventListener('click', () => { SFX.tap(); openHelp(); });
  function openHelp() {
    openSheet('ルール', `<ul class="rules">
      <li>クエストを <span class="y">3ぶんの2</span> いじょう クリアで「たっせい」</li>
      <li>たっせいで HP＋${HEAL}・🔥れんぞく＋1</li>
      <li>🔥1にち ごとに EXP＋5%（さいだい ×1.5）</li>
      <li>🔥3にち ごとに <span class="b">❄おまもり</span> を 1こ ゲット</li>
      <li>たっせい できない日は ❄を 1こ つかって まもる</li>
      <li>❄が ないと <span class="r">HP−${DMG_PARTIAL}</span>（きろく なしは <span class="r">−${DMG_NONE}</span>）、🔥は 0に</li>
      <li>HP 0で せんとうふのう：いまの レベルの EXPが はんぶんに</li>
      <li>まいしゅう げつようびに ボスが でる。かせいだ EXPが ダメージに</li>
      <li>はやおきは 30ぷん いないの ちこくなら EXP はんぶん</li>
      <li>日付の きりかえは ごぜん3じ</li></ul>`);
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
    $('avatar').insertAdjacentHTML('afterbegin', S.hero(L.lv, 40));
    $('lvNum').textContent = L.lv;
    $('heroName').textContent = state.name;
    $('xpBar').style.width = (L.rest / L.need * 100) + '%';
    $('xpTxt').textContent = `EXP ${L.rest}/${L.need}`;
    $('hpBar').style.width = (c.hp / MAX_HP * 100) + '%';
    $('hpTxt').textContent = `HP ${c.hp}/${MAX_HP}`;
    $('streakNum').textContent = c.streak;
    $('freezeNum').textContent = c.freezes;
    $('multNum').textContent = c.mult.toFixed(2);
    renderBoss(c); renderToday(c, L); renderStats(c, L); renderLog(c); renderBadge();
    if (L.lv > (state.lastLevel || 1)) levelUp(state.lastLevel || 1, L.lv, c);
    if (L.lv !== state.lastLevel) { state.lastLevel = L.lv; save(); }
    collectNews(c);
  }

  // 前回から確定した日の出来事や、バックアップのおすすめをポストに入れる
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
      addMail({ icon: '📦', title: 'バックアップの おすすめ', text: since === null ? 'きろくは この たんまつの なかだけに あります。きえる まえに ほぞん しておこう。' : `さいごの バックアップから ${since}にち たっています。`, action: 'backup' });
      state.backupMailed = t; added++;
    }
    if (added) { save(); renderBadge(); setTimeout(() => { toast(`📬 おしらせが ${added}けん`); SFX.mail(); }, 400); }
  }

  function renderBoss(c) {
    const b = c.boss, t = todayKey();
    const left = Math.max(0, b.hp - b.dmg);
    const daysLeft = 6 - ((dow(t) + 6) % 7);
    $('bossCard').classList.toggle('dead', !!b.defeated);
    $('bossCard').innerHTML = `<div id="bossPic">${S.boss(b.idx, 52)}</div>
      <div class="grow">
        <div style="display:flex;justify-content:space-between;gap:8px"><span>${b.name}</span><span class="dim">${b.defeated ? '<span class="y">とうばつ！</span>' : daysLeft ? `のこり${daysLeft}にち` : 'きょうまで'}</span></div>
        <div class="bar boss"><i style="width:${left / b.hp * 100}%"></i></div>
        <div class="dim">${b.defeated ? `ほうしゅう ＋${b.reward}EXP ゲット` : `HP ${left}/${b.hp}`}</div>
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
      $('taskList').innerHTML = `<div class="dim" style="padding:8px 0">${activeTasks().length ? 'きょうは やすみ。' : 'クエストが ありません'}</div>
        ${activeTasks().length ? '' : '<button class="btn full mt8" data-act="openQuests">クエストを ふやす</button>'}`;
    } else {
      $('taskList').innerHTML = tasks.map(t => {
        const v = entries[t.id], comp = completion(t, v), done = comp >= 1;
        let sub = '', act = '', extra = '';
        if (t.type === 'check') {
          sub = `＋${t.xp}EXP`;
          act = done ? `<button class="btn green act" data-act="toggle" data-id="${t.id}">✓ クリア</button>`
            : `<button class="btn act" data-act="toggle" data-id="${t.id}">やった！</button>`;
        } else if (t.type === 'count') {
          sub = `${fmt(t.target)}${esc(t.unit)} ・ ＋${t.xp}EXP`;
          act = done ? `<button class="btn green act" data-act="fill" data-id="${t.id}">✓ クリア</button>`
            : `<button class="btn act" data-act="fill" data-id="${t.id}">ぜんぶ やった</button>`;
          extra = `<div class="counter">
            <button class="btn gray" data-act="minus" data-id="${t.id}" aria-label="へらす">−</button>
            <div class="val">${fmt(v || 0)}<small> / ${fmt(t.target)}${esc(t.unit)}</small></div>
            <button class="btn gray" data-act="plus" data-id="${t.id}" aria-label="ふやす">＋${fmt(t.step)}</button>
            <button class="btn sm gray" data-act="editCount" data-id="${t.id}" aria-label="すうじを にゅうりょく">✎</button></div>`;
        } else {
          sub = `${t.wake}までに ・ ＋${t.xp}EXP`;
          act = v ? `<button class="btn ${done ? 'green' : 'gray'} act" data-act="editWake" data-id="${t.id}">${done ? '✓' : comp > 0 ? '△' : '✗'} ${v}</button>`
            : `<button class="btn act" data-act="now" data-id="${t.id}">おきた！</button>`;
        }
        return `<div class="task ${done ? 'done' : ''}"><div class="top-row">
          <div class="ic">${iconHtml(t.icon)}</div>
          <div class="grow"><div class="tn">${esc(t.name)}</div><div class="sub">${sub}</div></div>
          ${act}</div>${extra}</div>`;
      }).join('');
    }
    let left = '', right = '';
    if (count) {
      if (day.cleared) {
        left = `<span class="y">★ たっせい！</span>`;
        right = `<button class="btn sm blue" id="shareDay">Xで シェア</button>`;
      } else {
        left = `あと <span class="y">${needFor(count) - day.done}こ</span> で たっせい`;
        const dmg = day.recorded ? DMG_PARTIAL : DMG_NONE;
        right = c.freezes > 0 ? `<span class="b">❄が まもる</span>` : `<span class="r">おわると HP−${dmg}</span>`;
      }
    }
    $('dayLine').innerHTML = `<span>${left}</span>${right}`;
    $('dayLine').classList.toggle('hidden', !count);
    const sb = $('shareDay');
    if (sb) sb.onclick = () => share(`きょうの クエストを クリア！ Lv${L.lv}「${titleOf(L.lv)}」 🔥れんぞく${c.streak}にち #LifeQuest`);
  }

  function renderStats(c, L) {
    $('heroBig').innerHTML = S.hero(L.lv, 84);
    $('heroName2').textContent = state.name;
    $('titleTxt').textContent = `Lv${L.lv} ${titleOf(L.lv)}`;
    $('equipList').innerHTML = S.EQUIP.map(([lv, n]) => `<div class="eq ${L.lv >= lv ? '' : 'lock'}"><span>${L.lv >= lv ? n : '？？？'}</span><span>Lv${lv}</span></div>`).join('');
    const max = Math.max(100, ...Object.values(c.cat));
    $('statList').innerHTML = Object.entries(CATS).map(([k, v]) => `<div class="stat"><span>${v.en}</span>
      <div class="bar"><i style="width:${c.cat[k] / max * 100}%;background:${v.color}"></i></div><span style="text-align:right">${Math.floor(c.cat[k] / 10)}</span></div>`).join('');
    $('kpis').innerHTML = [
      ['🔥 さいちょう', `${c.best}にち`], ['★ たっせい日', `${c.clearedDays}にち`],
      ['⚔ ボス とうばつ', `${c.bossWins}たい`], ['❄ つかった', `${c.frozenDays}かい`],
      ['☠ せんとうふのう', `${c.knockouts}かい`], ['EXP ごうけい', c.total.toLocaleString()],
    ].map(([k, v]) => `<div>${k}<b>${v}</b></div>`).join('');
  }
  $('titlesBtn').addEventListener('click', () => {
    SFX.tap();
    const lv = levelOf(C.total).lv;
    openSheet('しょうごう', TITLES.map(([l, n]) => `<div class="eq ${lv >= l ? '' : 'lock'}" style="font-size:15px;padding:6px 0"><span>${lv >= l ? '★ ' + n : '？？？'}</span><span>Lv${l}</span></div>`).join(''));
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
    $('legend').innerHTML = [['var(--g)', 'ぜんぶ'], ['#1f8a4c', 'たっせい'], ['#1e5a8a', '❄'], ['#8a1f2c', 'ダメージ']].map(([c2, n]) => `<span><i style="background:${c2}"></i>${n}</span>`).join('');

    const wins = Array(S.BOSSES.length).fill(0), seen = Array(S.BOSSES.length).fill(false);
    Object.values(c.bosses).forEach(b => { seen[b.idx] = true; if (b.defeated) wins[b.idx]++; });
    $('dexCount').textContent = `${wins.filter(Boolean).length}/${S.BOSSES.length}`;
    $('dex').innerHTML = S.BOSSES.map((b, i) => `<div>${S.boss(i, 42, !wins[i])}<div class="${wins[i] ? 'n' : ''}">${wins[i] ? b.name : seen[i] ? '？？？' : '・・・'}</div>${wins[i] > 1 ? `<div class="y">×${wins[i]}</div>` : ''}</div>`).join('');

    const wakeTask = state.tasks.find(x => x.type === 'wake' && !x.archivedAt) || state.tasks.find(x => x.type === 'wake');
    const svg = $('wakeChart');
    if (!wakeTask) { svg.closest('.card').classList.add('hidden'); return; }
    svg.closest('.card').classList.remove('hidden');
    const pts = [];
    for (let i = 13; i >= 0; i--) { const k = addDays(t, -i); const v = state.log[k]?.[wakeTask.id]; pts.push({ k, m: v ? toMin(v) : null }); }
    const goal = toMin(wakeTask.wake);
    const vals = pts.filter(p => p.m != null).map(p => p.m).concat(goal);
    const lo = Math.floor((Math.min(...vals) - 30) / 60) * 60, hi = Math.ceil((Math.max(...vals) + 30) / 60) * 60;
    const X = i => 34 + i * (276 / 13), Y = m => 10 + (m - lo) / (hi - lo) * 110;
    const step = hi - lo > 360 ? 120 : 60;
    let s = '';
    for (let h = lo; h <= hi; h += step) s += `<line x1="34" x2="310" y1="${Y(h)}" y2="${Y(h)}" stroke="#ffffff22"/><text x="28" y="${Y(h) + 4}" fill="#9a9ad0" font-size="10" text-anchor="end">${h / 60}じ</text>`;
    s += `<line x1="34" x2="310" y1="${Y(goal)}" y2="${Y(goal)}" stroke="#fce35a" stroke-dasharray="4 3"/>`;
    pts.forEach((p, i) => { if (p.m != null) s += `<rect x="${X(i) - 4}" y="${Y(p.m) - 4}" width="8" height="8" fill="${p.m <= goal ? '#3cdc6c' : '#ff4a4a'}"/>`; });
    s += `<text x="34" y="136" fill="#9a9ad0" font-size="9">${md(pts[0].k)}</text><text x="310" y="136" fill="#9a9ad0" font-size="9" text-anchor="end">きょう</text>`;
    svg.innerHTML = s;
  }

  function levelUp(from, to, c) {
    const lines = [];
    const tNew = titleOf(to);
    if (tNew !== titleOf(from)) lines.push(`しょうごう「<span class="y">${tNew}</span>」`);
    if (slotsFor(to) > slotsFor(from)) lines.push(`クエストわく <span class="y">${slotsFor(to)}</span> に ふえた`);
    S.EQUIP.filter(([lv]) => lv > from && lv <= to).forEach(([, n]) => lines.push(`そうび「<span class="y">${n}</span>」`));
    $('lvHero').innerHTML = S.hero(to, 96);
    $('lvModalNum').textContent = to;
    $('lvModalInfo').innerHTML = lines.join('<br>') || 'ちからが みなぎる！';
    $('lvShare').onclick = () => share(`Life Quest で Lv${to}「${tNew}」に なった！ 🔥れんぞく${c.streak}にち #LifeQuest`);
    $('lvModal').classList.remove('hidden');
    addMail({ icon: '★', title: `Lv${to}に なった`, text: lines.join('・').replace(/<[^>]+>/g, '') });
    flash(); SFX.level(); vibrate([80, 60, 80, 60, 200]);
  }
  $('lvClose').addEventListener('click', () => { SFX.tap(); $('lvModal').classList.add('hidden'); });

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
    const nowDone = isDone(t, (state.log[k] || {})[id]);
    const name = esc(state.name), bossName = after.boss.name;
    if (after.bossWins > before.bossWins) {
      say(`${name}の こうげき！<br>${bossName}を たおした！ ＋${after.boss.reward}EXP`); SFX.boss(); vibrate([100, 50, 300]); flash();
    } else if (after.perDay[k]?.cleared && !before.perDay[k]?.cleared) {
      say(`きょうの クエスト たっせい！<br>HP＋${HEAL}${after.freezes > before.freezes ? '・❄を てにいれた！' : ''}`);
      SFX.clear(); if (after.freezes > before.freezes) setTimeout(SFX.freeze, 450); vibrate([60, 40, 120]);
    } else if (nowDone && !wasDone) {
      say(`${esc(t.name)}を やりとげた！<br>${bossName}に <span class="r">${diff}</span>の ダメージ！`); SFX.done(); vibrate(40);
    } else if (diff > 0) {
      say(`${bossName}に <span class="r">${diff}</span>の ダメージ！`); SFX.hit(); vibrate(20);
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
      case 'editCount': SFX.tap(); openSheet(t.name, `<label class="lb">きょうの きろく（${esc(t.unit)}）</label>
          <input id="eNum" type="number" inputmode="decimal" min="0" step="any" value="${cur ?? ''}" placeholder="0">
          <div class="dim mt8">もくひょう ${fmt(t.target)}${esc(t.unit)}</div>
          <div class="row mt12"><button class="btn gray" id="eClear">けす</button><button class="btn" id="eOk">けってい</button></div>`, body => {
            const inp = body.querySelector('#eNum'); setTimeout(() => inp.focus(), 50);
            body.querySelector('#eOk').onclick = () => { closeSheet(); setEntry(id, inp.value === '' ? null : Math.max(0, Number(inp.value))); };
            body.querySelector('#eClear').onclick = () => { closeSheet(); setEntry(id, null); };
          }); break;
      case 'editWake': SFX.tap(); openSheet(t.name, `<label class="lb">おきた じかん</label>
          <input id="eTime" type="time" value="${cur ?? ''}">
          <div class="dim mt8">もくひょう ${t.wake}</div>
          <div class="row mt12"><button class="btn gray" id="eClear">けす</button><button class="btn" id="eOk">けってい</button></div>`, body => {
            body.querySelector('#eOk').onclick = () => { const v = body.querySelector('#eTime').value; closeSheet(); setEntry(id, v || null); };
            body.querySelector('#eClear').onclick = () => { closeSheet(); setEntry(id, null); };
          }); break;
    }
  });

  // タブ
  document.querySelectorAll('.tabs .ti').forEach(el => { el.innerHTML = S.icon(el.dataset.icon, 22); });
  $('mailIcon').innerHTML = S.icon('mail', 24);
  function showTab(name) {
    document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x.dataset.tab === name));
    ['today', 'stats', 'log', 'menu'].forEach(n => $('tab-' + n).classList.toggle('hidden', n !== name));
    $('say').classList.add('hidden');
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => { SFX.tap(); showTab(b.dataset.tab); }));

  // ---------- メニュー ----------
  const MENU = [
    ['📜', 'クエストの へんしゅう', () => openQuests()],
    ['💬', 'しつもんに こたえなおす', () => startOnboarding(true)],
    ['✎', 'なまえ', () => openName()],
    ['♪', 'サウンド・しんどう', () => openSound()],
    ['⏰', 'リマインダー', () => openReminder()],
    ['📦', 'バックアップ・ふっかつ', () => openBackup()],
    ['📲', 'アプリを インストール', () => openInstall()],
    ['？', 'ルール', () => openHelp()],
    ['⚠', 'さいしょから やりなおす', () => openReset(), 'danger'],
  ];
  $('menuList').innerHTML = MENU.map(([ic, label, , cls], i) => `<button class="btn ${cls || ''}" data-menu="${i}"><span class="mi">${ic}</span>${label}<span class="arrow">▶</span></button>`).join('');
  $('menuList').addEventListener('click', e => { const b = e.target.closest('[data-menu]'); if (b) { SFX.tap(); MENU[b.dataset.menu][2](); } });

  function openName() {
    openSheet('なまえ', `<input id="nm" maxlength="12" value="${esc(state.name)}"><div class="row mt12"><button class="btn" id="nmOk">けってい</button></div>`, body => {
      body.querySelector('#nmOk').onclick = () => { state.name = body.querySelector('#nm').value.trim() || 'ぼうけんしゃ'; save(); closeSheet(); render(); };
    });
  }
  function openSound() {
    openSheet('サウンド・しんどう', `
      <label class="lb">こうかおん</label><div class="seg"><button class="btn ${state.sound ? 'on' : ''}" data-s="1">ON</button><button class="btn ${!state.sound ? 'on' : ''}" data-s="0">OFF</button></div>
      <label class="lb">しんどう（Androidのみ）</label><div class="seg"><button class="btn ${state.vibe ? 'on' : ''}" data-v="1">ON</button><button class="btn ${!state.vibe ? 'on' : ''}" data-v="0">OFF</button></div>`, body => {
      body.onclick = e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.s) state.sound = b.dataset.s === '1';
        if (b.dataset.v) state.vibe = b.dataset.v === '1';
        save(); SFX.tap(); vibrate(40); openSound();
      };
    });
  }

  // ---------- クエストの へんしゅう ----------
  function openQuests() {
    const L = levelOf(C.total), act = activeTasks(), slots = slotsFor(L.lv), nx = nextSlotLv(L.lv);
    const full = act.length >= slots;
    openSheet(`クエスト ${act.length}/${slots}`, `${act.map(t => {
        const days = t.days.length === 7 ? 'まいにち' : ALL_DAYS.filter(d => t.days.includes(d)).map(d => WD[d]).join('');
        return `<div class="list-row"><div class="ic">${iconHtml(t.icon, 22)}</div>
          <div class="grow">${esc(t.name)}<div class="dim">${days}${t.from && t.from > todayKey() ? ' ・ <span class="y">あしたから</span>' : ''}</div></div>
          <button class="btn sm gray" data-q="up" data-id="${t.id}" aria-label="うえへ">↑</button>
          <button class="btn sm blue" data-q="edit" data-id="${t.id}">へんしゅう</button></div>`;
      }).join('') || '<div class="dim">クエストが ありません</div>'}
      <button class="btn full mt12" data-q="add" ${full ? 'disabled' : ''}>＋ クエストを ふやす</button>
      ${full ? `<div class="dim center mt8">わくが いっぱい${nx ? `（Lv${nx}で ふえる）` : ''}</div>` : ''}`, body => {
      body.onclick = e => {
        const b = e.target.closest('[data-q]'); if (!b || b.disabled) return;
        SFX.tap();
        const i = state.tasks.findIndex(t => t.id === b.dataset.id);
        if (b.dataset.q === 'add') openTaskForm(-1);
        if (b.dataset.q === 'edit') openTaskForm(i);
        if (b.dataset.q === 'up') {
          const a = activeTasks(), pos = a.indexOf(state.tasks[i]);
          if (pos > 0) { const j = state.tasks.indexOf(a[pos - 1]); [state.tasks[j], state.tasks[i]] = [state.tasks[i], state.tasks[j]]; save(); render(); openQuests(); }
        }
      };
    });
  }
  function openTaskForm(i) {
    const editing = i >= 0;
    let t = editing ? JSON.parse(JSON.stringify(state.tasks[i])) : { icon: 'star', name: '', type: 'check', cat: 'str', xp: 20, target: 10, unit: '回', wake: '06:30', days: ALL_DAYS.slice() };
    const used = new Set(activeTasks().map(x => x.tpl));
    const draw = () => openSheet(editing ? 'クエストを へんしゅう' : 'クエストを ふやす', `
      ${editing ? '' : `<label class="lb">おすすめから えらぶ</label><div class="chips">${CATALOG.filter(x => !used.has(x.key)).map(x => `<button class="btn sm gray" data-tpl="${x.key}">${S.icon(x.icon, 14)}${x.name}</button>`).join('')}</div>`}
      <label class="lb">なまえ</label><input id="fName" maxlength="20" value="${esc(t.name)}" placeholder="れい：ストレッチ">
      <label class="lb">アイコン</label><div class="icons">${S.ICON_KEYS.map(k => `<button class="btn ${k === t.icon ? 'on' : ''}" data-icon="${k}">${S.icon(k, 20)}</button>`).join('')}</div>
      <label class="lb">しゅるい</label><div class="seg">${[['check', 'やった？'], ['count', 'かいすう'], ['wake', 'きしょう']].map(([v, n]) => `<button class="btn ${t.type === v ? 'on' : ''}" data-type="${v}">${n}</button>`).join('')}</div>
      ${t.type === 'count' ? `<div class="row"><div><label class="lb">もくひょう</label><input id="fTarget" type="number" inputmode="decimal" min="0.1" step="any" value="${t.target ?? 10}"></div>
        <div><label class="lb">たんい</label><input id="fUnit" maxlength="6" value="${esc(t.unit ?? '回')}"></div></div>` : ''}
      ${t.type === 'wake' ? `<label class="lb">もくひょうの じかん</label><input id="fWake" type="time" value="${t.wake ?? '06:30'}">` : ''}
      <label class="lb">のうりょく</label><div class="seg">${Object.entries(CATS).map(([k, v]) => `<button class="btn ${t.cat === k ? 'on' : ''}" data-cat="${k}">${v.en}</button>`).join('')}</div>
      <label class="lb">EXP</label><div class="seg">${[10, 15, 20, 30].map(x => `<button class="btn ${t.xp === x ? 'on' : ''}" data-xp="${x}">${x}</button>`).join('')}</div>
      <label class="lb">やる ようび</label><div class="days">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button class="btn ${t.days.includes(d) ? 'on' : ''}" data-day="${d}">${WD[d]}</button>`).join('')}</div>
      <div class="row mt12">${editing ? '<button class="btn red" id="fDel">けす</button>' : ''}<button class="btn" id="fSave">けってい</button></div>`, body => {
      const keep = () => {
        const n = body.querySelector('#fName'); if (n) t.name = n.value;
        const tg = body.querySelector('#fTarget'); if (tg) t.target = Number(tg.value) || t.target;
        const u = body.querySelector('#fUnit'); if (u) t.unit = u.value;
        const w = body.querySelector('#fWake'); if (w) t.wake = w.value || t.wake;
      };
      body.onclick = e => {
        const b = e.target.closest('button'); if (!b) return;
        keep(); SFX.tap();
        const d = b.dataset;
        if (d.tpl) { const x = CATALOG.find(c => c.key === d.tpl); t = Object.assign(fromTemplate(x, prefs()), { days: t.days }); return draw(); }
        if (d.icon) { t.icon = d.icon; return draw(); }
        if (d.type) { t.type = d.type; return draw(); }
        if (d.cat) { t.cat = d.cat; return draw(); }
        if (d.xp) { t.xp = Number(d.xp); return draw(); }
        if (d.day) { const n = Number(d.day); t.days = t.days.includes(n) ? t.days.filter(x => x !== n) : t.days.concat(n); return draw(); }
        if (b.id === 'fDel') {
          if (confirm(`「${state.tasks[i].name}」を けしますか？（かせいだ EXPは のこります）`)) { state.tasks[i].archivedAt = todayKey(); save(); render(); openQuests(); }
          return;
        }
        if (b.id === 'fSave') {
          t.name = (t.name || '').trim();
          if (!t.name) { draw(); $('sheetBody').querySelector('#fName').focus(); return; }
          if (!t.days.length) { alert('ようびを 1つ いじょう えらんでください'); return; }
          const out = { id: editing ? state.tasks[i].id : uid(), tpl: t.tpl || null, icon: t.icon, name: t.name, type: t.type, cat: t.cat, xp: t.xp, days: t.days.slice().sort() };
          if (editing && state.tasks[i].from) out.from = state.tasks[i].from;
          if (t.type === 'count') { out.target = Math.max(0.1, Number(t.target) || 1); out.unit = (t.unit || '').trim(); out.step = t.step && t.step < out.target ? t.step : autoStep(out.target, out.unit); }
          if (t.type === 'wake') out.wake = t.wake || '06:30';
          if (editing) state.tasks[i] = out; else state.tasks.push(out);
          save(); SFX.done(); render(); openQuests();
        }
      };
    });
    draw();
  }

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
      .map(x => ({ x, score: goals.reduce((a, g) => a + (x.goals[g] || 0), 0) * 2 + 1 + (x.key === 'wake' && p.wakeAsked ? 4 : 0) }))
      .sort((a, b) => b.score - a.score);
    const picks = [], cats = {};
    let used = 0;
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
    closeSheet();
    const L = levelOf(C ? C.total : 0);
    ob = { step: 0, redo, name: state.name, goals: [], fit: null, time: null, wakeH: null, picks: [], order: [], slots: slotsFor(L.lv) };
    $('ob').classList.remove('hidden');
    renderOb();
  }
  const OB_STEPS = 6;
  const WAKES = [['5じだい', '05:30'], ['6じだい', '06:30'], ['7じだい', '07:30'], ['8じ いこう', '08:30'], ['きまって いない', null]];
  function obPrefs() {
    const usual = ob.wakeH != null ? WAKES[ob.wakeH][1] : null;
    return { fit: ob.fit ?? 1, time: ob.time ?? 1, goals: ob.goals, wake: usual ? fromMin(toMin(usual) - 30) : '07:00', wakeAsked: !!usual };
  }
  function renderOb() {
    const back = ob.step > 0 ? '<button class="btn gray" data-ob="back">もどる</button>' : (ob.redo ? '<button class="btn gray" data-ob="close">やめる</button>' : '');
    const choice = (attr, items, sel) => `<div class="choices">${items.map(([a, b], i) => `<button class="btn ${sel === i ? 'on' : ''}" ${attr}="${i}">${a}${b ? `<small>${b}</small>` : ''}</button>`).join('')}</div>`;
    let talk = '', body = '', next = '';
    switch (ob.step) {
      case 0:
        talk = ob.redo ? 'しつもんに こたえて、いまの きみに あった クエストを えらびなおそう。' : 'ようこそ、ぼうけんしゃよ！ まいにちの しゅうかんで つよくなる せかいへ。まずは なまえを おしえてほしい。';
        body = `<input id="obName" maxlength="12" value="${esc(ob.name)}">`;
        next = '<button class="btn" data-ob="next">つぎへ</button>';
        break;
      case 1:
        talk = `${ob.name}よ、なにを めざして いる？（3つまで）`;
        body = `<div class="choices">${Object.entries(GOALS).map(([k, v]) => `<button class="btn ${ob.goals.includes(k) ? 'on' : ''}" data-goal="${k}">${ob.goals.includes(k) ? '✓ ' : ''}${v}</button>`).join('')}</div>`;
        next = `<button class="btn" data-ob="next" ${ob.goals.length ? '' : 'disabled'}>つぎへ</button>`;
        break;
      case 2:
        talk = 'ふだん、うんどうは している？';
        body = choice('data-fit', [['ほとんど しない', 'これから はじめたい'], ['しゅうに 1〜2かい', 'たまに からだを うごかす'], ['しゅうに 3かい いじょう', 'しゅうかんに なっている']], ob.fit);
        break;
      case 3:
        talk = '1にちに どれくらい じかんを つかえる？';
        body = choice('data-time', [['15ふん くらい'], ['30ふん くらい'], ['1じかん いじょう']], ob.time);
        break;
      case 4:
        talk = 'ふだん なんじごろ おきている？';
        body = choice('data-wake', WAKES.map(([a, v]) => [a, `もくひょう ${v ? fromMin(toMin(v) - 30) : '07:00'}`]), ob.wakeH);
        break;
      case 5: {
        talk = `${ob.name}に おすすめの クエストだ！ さいしょは ${ob.slots}こ。レベルが あがると ふやせる。`;
        const p = obPrefs();
        body = `<div class="dim" style="margin-bottom:8px">えらんだ ${ob.picks.length}/${ob.slots}（タップで いれかえ）</div><div class="choices">${ob.order.map(key => {
          const x = CATALOG.find(c => c.key === key), t = fromTemplate(x, p), on = ob.picks.includes(key);
          const what = t.type === 'count' ? `${fmt(t.target)}${t.unit}` : t.type === 'wake' ? `${t.wake}までに` : 'まいにち';
          return `<button class="btn ${on ? 'on' : ''}" data-pick="${key}" ${!on && ob.picks.length >= ob.slots ? 'style="opacity:.5"' : ''}>
            <span class="pick">${on ? '✓' : '　'} ${S.icon(x.icon, 20)} ${x.name}</span><small>${what} ・ ＋${x.xp}EXP</small></button>`;
        }).join('')}</div>`;
        next = `<button class="btn" data-ob="finish" ${ob.picks.length ? '' : 'disabled'}>はじめる！</button>`;
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
    if (d.ob === 'next') { if (ob.step === 0) ob.name = ($('obName').value.trim() || 'ぼうけんしゃ').slice(0, 12); ob.step++; return renderOb(); }
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
      const t = { id: uid(), ...fromTemplate(CATALOG.find(c => c.key === key), p) };
      if (when !== today) t.from = when;
      state.tasks.push(t);
    });
    const first = !state.onboarded;
    state.onboarded = true;
    if (first) addMail({ icon: '🗡', title: 'ぼうけんの はじまり', text: 'クエストを こなすと EXPが もらえて、ボスにも ダメージを あたえられる。こまったら みぎうえの「？」を みてね。' });
    save();
    $('ob').classList.add('hidden');
    showTab('today');
    render();
    say(when === today ? `${esc(state.name)}の ぼうけんが はじまった！` : 'あたらしい クエストは あしたから！');
    SFX.clear(); flash();
  }

  // ---------- リマインダー ----------
  const canNotify = () => 'Notification' in window;
  function openReminder() {
    const n = state.notify;
    openSheet('リマインダー', `
      <label class="lb">つうち</label><div class="seg"><button class="btn ${n.on ? 'on' : ''}" data-n="1">ON</button><button class="btn ${!n.on ? 'on' : ''}" data-n="0">OFF</button></div>
      <div class="row"><div><label class="lb">あさ</label><input type="time" id="nM" value="${n.morning}"></div><div><label class="lb">よる</label><input type="time" id="nE" value="${n.evening}"></div></div>
      <div class="dim mt8">アプリを とじていると とどかない ことが あります</div>
      <button class="btn blue full mt12" id="icsBtn">カレンダーに とうろく（かくじつ）</button>`, body => {
      body.querySelector('#nM').onchange = e => { n.morning = e.target.value || '07:00'; delete n.sent.morning; save(); };
      body.querySelector('#nE').onchange = e => { n.evening = e.target.value || '21:00'; delete n.sent.evening; save(); };
      body.querySelector('#icsBtn').onclick = exportIcs;
      body.querySelectorAll('[data-n]').forEach(b => b.onclick = async () => {
        SFX.tap();
        if (b.dataset.n === '0') { n.on = false; save(); return openReminder(); }
        if (!canNotify()) { alert('この ブラウザは つうちに たいおう していません。iPhoneは ホームがめんに ついか してから ためしてください。'); return; }
        const p = await Notification.requestPermission();
        if (p !== 'granted') { alert('つうちが きょか されませんでした。'); return; }
        n.on = true;
        const now = new Date(), hm = now.getHours() * 60 + now.getMinutes();
        ['morning', 'evening'].forEach(type => { if (hm >= toMin(n[type])) n.sent[type] = todayKey(); });
        save(); notify('Life Quest', 'つうちを ONに しました'); openReminder();
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
      if (type === 'morning') notify('きょうの クエスト', count ? `${count}この クエストが まっている` : 'きょうは やすみ');
      else if (count && !day.cleared) notify('まだ まにあう！', `あと ${needFor(count) - day.done}こで たっせい`);
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
      ...ev('morning', state.notify.morning, 'Life Quest：きょうの クエスト'), ...ev('evening', state.notify.evening, 'Life Quest：やりのこし チェック'), 'END:VCALENDAR'];
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
    if (ok) { state.lastBackup = todayKey(); save(); toast('バックアップ しました'); }
  }
  function openBackup() {
    openSheet('バックアップ・ふっかつ', `
      <div class="dim">${state.lastBackup ? `さいご：${md(state.lastBackup)}（${daysBetween(state.lastBackup, todayKey())}にち まえ）` : 'まだ バックアップ していません'}</div>
      <button class="btn full mt12" id="bkSave">ファイルに ほぞん</button>
      <button class="btn gray full mt12" id="bkLoad">ファイルから ふっかつ</button>`, body => {
      body.querySelector('#bkSave').onclick = async () => { await backup(); openBackup(); };
      body.querySelector('#bkLoad').onclick = () => $('importFile').click();
    });
  }
  $('importFile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const s = JSON.parse(await f.text());
      if (!Array.isArray(s.tasks) || typeof s.log !== 'object') throw 0;
      if (!confirm('いまの きろくを うわがき します。よろしいですか？')) return;
      state = migrate(s); state.onboarded = true; state.seenUntil = addDays(todayKey(), -1); state.lastLevel = levelOf(compute().total).lv;
      save(); closeSheet(); render(); toast('ふっかつ しました');
    } catch (err) { alert('ファイルを よみこめませんでした'); }
    e.target.value = '';
  });
  function openReset() {
    openSheet('さいしょから やりなおす', `<div>すべての きろくが きえます。もとに もどせません。</div>
      <div class="row mt12"><button class="btn gray" id="rsNo">やめる</button><button class="btn red" id="rsYes">けす</button></div>`, body => {
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
    const msg = standalone() ? 'インストール ずみ です'
      : installEvt ? 'ホームがめんに ついか できます'
      : isIOS ? 'Safariの きょうゆう ボタン →「ホーム画面に追加」' : 'ブラウザの メニュー →「アプリを インストール」';
    openSheet('アプリを インストール', `<div>${msg}</div>${installEvt && !standalone() ? '<button class="btn full mt12" id="instBtn">ついか する</button>' : ''}`, body => {
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
      openSheet('おしらせ', `<div>しつもんに こたえて、きみに あった クエストを えらびなおしますか？</div><div class="dim mt8">レベルや EXPは そのまま のこります</div>
        <div class="row mt12"><button class="btn gray" id="askNo">いいえ</button><button class="btn" id="askYes">はい</button></div>`, body => {
        body.querySelector('#askYes').onclick = () => startOnboarding(true);
        body.querySelector('#askNo').onclick = () => { closeSheet(); state.onboarded = true; save(); render(); };
      });
    }
  }
})();
