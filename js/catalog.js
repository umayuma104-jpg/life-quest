// 選べるクエストの一覧
// targets: 適性ごとの目標 [初心者, 中級, 上級]  steps: ＋ボタン1回分
// xp: 中級の目標をこなしたときのEXP（回数に比例して増減）
// scale: 目標を何で決めるか（fit=運動習慣 / time=使える時間 / none=固定）
// goals: 質問の「目的」との相性  time: 1日にかかる目安（分）
// eq: 道具や施設が必要（自動のおすすめには出さない）  d: きつさ（2=中, 3=高。初心者には出にくい）
(function () {
  'use strict';
  const GROUPS = { muscle: '筋トレ', cardio: '有酸素', flex: 'ストレッチ', mind: '学び・心', life: '生活' };

  const C = [];
  const add = (group, list) => list.forEach(([key, name, icon, unit, targets, steps, xp, goals, opt]) =>
    C.push(Object.assign({ key, name, icon, group, type: unit ? 'count' : 'check', unit, targets, steps, xp, goals,
      cat: group === 'mind' ? 'int' : group === 'life' ? 'vit' : group === 'flex' ? 'mnd' : 'str',
      scale: 'fit', time: unit === '分' ? null : 5 }, opt || {})));

  add('muscle', [
    ['pushup', '腕立て伏せ', 'dumbbell', '回', [10, 20, 40], [5, 5, 10], 20, { fit: 4, slim: 2 }],
    ['kneepush', '膝つき腕立て伏せ', 'dumbbell', '回', [10, 20, 30], [5, 5, 10], 15, { fit: 3, slim: 1 }, { maxFit: 1 }],
    ['diamond', 'ダイヤモンド腕立て伏せ', 'dumbbell', '回', [5, 10, 20], [1, 5, 5], 20, { fit: 3 }, { minFit: 1, d: 3 }],
    ['pike', 'パイクプッシュアップ', 'dumbbell', '回', [5, 10, 20], [1, 5, 5], 20, { fit: 3 }, { minFit: 1, d: 3 }],
    ['squat', 'スクワット', 'dumbbell', '回', [15, 30, 50], [5, 10, 10], 20, { fit: 3, slim: 4 }],
    ['widesquat', 'ワイドスクワット', 'dumbbell', '回', [15, 30, 50], [5, 10, 10], 20, { fit: 2, slim: 4 }],
    ['jumpsquat', 'ジャンプスクワット', 'dumbbell', '回', [10, 20, 30], [5, 5, 10], 25, { fit: 4, slim: 4 }, { minFit: 1, d: 3 }],
    ['lunge', 'ランジ', 'dumbbell', '回', [10, 20, 30], [5, 5, 10], 20, { fit: 3, slim: 3 }],
    ['sidelunge', 'サイドランジ', 'dumbbell', '回', [10, 20, 30], [5, 5, 10], 20, { fit: 2, slim: 3 }],
    ['bulgarian', 'ブルガリアンスクワット', 'dumbbell', '回', [10, 20, 30], [5, 5, 10], 25, { fit: 4, slim: 3 }, { minFit: 1, d: 3 }],
    ['calf', 'カーフレイズ', 'dumbbell', '回', [20, 40, 60], [10, 10, 20], 10, { fit: 2, slim: 2 }],
    ['hiplift', 'ヒップリフト', 'dumbbell', '回', [15, 30, 50], [5, 10, 10], 15, { fit: 2, slim: 3 }],
    ['donkey', 'ドンキーキック', 'dumbbell', '回', [15, 30, 50], [5, 10, 10], 15, { slim: 3, fit: 1 }],
    ['crunch', '腹筋（クランチ）', 'dumbbell', '回', [15, 30, 50], [5, 10, 10], 20, { fit: 3, slim: 4 }],
    ['situp', '上体起こし', 'dumbbell', '回', [10, 20, 30], [5, 5, 10], 20, { fit: 3, slim: 3 }, { d: 2 }],
    ['legraise', 'レッグレイズ', 'dumbbell', '回', [10, 20, 30], [5, 5, 10], 20, { fit: 3, slim: 4 }, { d: 2 }],
    ['bicycle', 'バイシクルクランチ', 'dumbbell', '回', [20, 30, 50], [10, 10, 10], 20, { slim: 4, fit: 2 }],
    ['russian', 'ロシアンツイスト', 'dumbbell', '回', [20, 30, 50], [10, 10, 10], 20, { slim: 4, fit: 2 }],
    ['vsit', 'V字腹筋', 'dumbbell', '回', [5, 15, 25], [5, 5, 5], 25, { fit: 3, slim: 3 }, { minFit: 1, d: 3 }],
    ['back', '背筋（バックエクステンション）', 'dumbbell', '回', [15, 30, 50], [5, 10, 10], 20, { fit: 3, mind: 1 }],
    ['superman', 'スーパーマン', 'dumbbell', '回', [10, 20, 30], [5, 5, 10], 15, { fit: 2 }],
    ['pullup', '懸垂', 'dumbbell', '回', [2, 5, 10], [1, 1, 2], 30, { fit: 5 }, { minFit: 1, eq: true }],
    ['dips', 'ディップス', 'dumbbell', '回', [5, 10, 20], [1, 5, 5], 25, { fit: 4 }, { minFit: 1, eq: true }],
    ['curl', 'ダンベルカール', 'dumbbell', '回', [10, 20, 30], [5, 5, 10], 15, { fit: 3 }, { eq: true }],
    ['press', 'ショルダープレス', 'dumbbell', '回', [10, 20, 30], [5, 5, 10], 15, { fit: 3 }, { eq: true }],
    ['burpee', 'バーピー', 'heart', '回', [5, 10, 20], [1, 5, 5], 30, { fit: 5, slim: 5 }, { d: 3 }],
    ['climber', 'マウンテンクライマー', 'heart', '回', [20, 40, 60], [10, 10, 20], 20, { slim: 4, fit: 3 }, { d: 2 }],
    ['jack', 'ジャンピングジャック', 'heart', '回', [20, 50, 100], [10, 10, 20], 15, { slim: 4, fit: 2 }],
    ['rope', 'なわとび', 'heart', '回', [100, 300, 500], [50, 50, 100], 25, { slim: 5, fit: 3 }, { eq: true }],
    ['plank', 'プランク', 'plank', '秒', [20, 45, 90], [10, 15, 30], 15, { fit: 3, slim: 2 }, { time: 3 }],
    ['sideplank', 'サイドプランク', 'plank', '秒', [15, 30, 60], [5, 10, 15], 15, { fit: 2, slim: 3 }, { time: 3 }],
    ['wallsit', '空気椅子', 'plank', '秒', [20, 45, 90], [10, 15, 30], 15, { fit: 3, slim: 2 }, { time: 3 }],
  ]);
  add('cardio', [
    ['walk', 'ウォーキング', 'shoe', '分', [15, 30, 45], [5, 5, 5], 20, { slim: 4, fit: 2, mind: 1, rhythm: 1 }, { scale: 'time', maxFit: 1 }],
    ['steps', '歩数', 'shoe', '歩', [5000, 8000, 10000], [500, 1000, 1000], 20, { slim: 4, fit: 2, rhythm: 2 }, { time: 0 }],
    ['run', 'ランニング', 'shoe', '分', [10, 20, 30], [5, 5, 5], 30, { fit: 5, slim: 4 }, { minFit: 1, d: 2 }],
    ['cycle', 'サイクリング', 'shoe', '分', [15, 30, 60], [5, 5, 10], 25, { fit: 3, slim: 4 }, { eq: true }],
    ['swim', '水泳', 'drop', '分', [10, 20, 40], [5, 5, 10], 30, { fit: 4, slim: 4 }, { eq: true }],
    ['stepup', '踏み台昇降', 'shoe', '分', [5, 10, 20], [5, 5, 5], 20, { slim: 4, fit: 2 }],
    ['hiit', 'HIIT（タバタ式）', 'heart', '分', [4, 8, 12], [4, 4, 4], 30, { fit: 4, slim: 5 }, { minFit: 1, d: 3 }],
    ['shadow', 'シャドーボクシング', 'heart', '分', [3, 5, 10], [1, 1, 5], 20, { fit: 3, slim: 3, mind: 1 }, { d: 2 }],
  ]);
  add('flex', [
    ['stretch', 'ストレッチ', 'lotus', '分', [5, 10, 15], [5, 5, 5], 10, { fit: 1, mind: 2, slim: 1 }, { scale: 'time' }],
    ['yoga', 'ヨガ', 'lotus', '分', [10, 15, 30], [5, 5, 10], 15, { mind: 4, fit: 1, slim: 1 }, { scale: 'time' }],
    ['foamroll', 'フォームローラー', 'lotus', '分', [5, 10, 15], [5, 5, 5], 10, { fit: 1, mind: 1 }, { scale: 'time', eq: true }],
    ['radio', 'ラジオ体操', 'star', null, null, null, 15, { fit: 1, rhythm: 3, wake: 1 }, { time: 5 }],
    ['stairs', '階段を使う', 'shoe', null, null, null, 10, { slim: 2, fit: 1 }, { time: 0 }],
  ]);
  add('mind', [
    ['read', '読書', 'book', 'ページ', [10, 20, 40], [5, 5, 10], 20, { study: 5, mind: 1 }, { scale: 'time', time: [10, 20, 40] }],
    ['study', '勉強', 'pen', '分', [15, 30, 60], [5, 10, 15], 25, { study: 6 }, { scale: 'time' }],
    ['vocab', '英単語', 'pen', '個', [10, 20, 30], [5, 5, 10], 15, { study: 4 }, { scale: 'time', time: [5, 10, 15] }],
    ['meditate', '瞑想', 'lotus', '分', [3, 5, 10], [1, 5, 5], 15, { mind: 6, rhythm: 1 }, { scale: 'time' }],
    ['journal', '日記を書く', 'pen', null, null, null, 15, { mind: 3, study: 1 }, { time: 5 }],
    ['gratitude', '感謝を3つ書く', 'heart', null, null, null, 10, { mind: 3 }, { time: 3 }],
  ]);
  add('life', [
    ['wake', '早起き', 'sun', null, null, null, 30, { wake: 6, rhythm: 3 }, { type: 'wake', time: 0, wake: '06:30' }],
    ['bed', '就寝', 'moon', null, null, null, 20, { rhythm: 5, wake: 4 }, { type: 'bed', time: 0, bedtime: '23:00' }],
    ['nophone', '寝る前1時間スマホを見ない', 'phone', null, null, null, 20, { mind: 3, rhythm: 4, wake: 3 }, { time: 0 }],
    ['sunlight', '朝日を浴びる', 'sun', null, null, null, 10, { rhythm: 3, mind: 2, wake: 2 }, { time: 5 }],
    ['water', '水を飲む', 'drop', 'L', [2, 2, 2], [0.5, 0.5, 0.5], 10, { slim: 3, rhythm: 2 }, { scale: 'none', range: [1, 3], time: 0 }],
    ['tidy', '部屋を片付ける', 'broom', null, null, null, 10, { mind: 2, rhythm: 2 }, { time: 10 }],
    ['nosnack', '間食しない', 'apple', null, null, null, 15, { slim: 5 }, { time: 0 }],
    ['cook', '自炊する', 'apple', null, null, null, 15, { slim: 2, rhythm: 2 }, { time: 30 }],
    ['bath', '湯船につかる', 'drop', null, null, null, 10, { mind: 2, rhythm: 2 }, { time: 0 }],
  ]);

  // 目標の目安（回数・時間）。分の種目はその時間がかかる
  C.forEach(x => { if (x.time === null) x.time = x.scale === 'time' ? x.targets : x.targets; });

  window.Catalog = { LIST: C, GROUPS, get: key => C.find(x => x.key === key) };
})();
