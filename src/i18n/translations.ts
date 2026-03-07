import type { BaseTranslation } from "typesafe-i18n";

const ja = {
  locales: {
    ja: "日本語",
    en: "English",
    pseudo: "Pseudo",
  },
  app: {
    title: "Brick Breaker",
    pauseHint: "Pキーで一時停止",
  },
  actions: {
    start: "ゲーム開始",
    continue: "続行",
    resume: "再開",
    retry: "もう一度",
    backToTitle: "タイトルへ戻る",
    reload: "再読み込み",
    next: "次へ",
  },
  overlay: {
    message: {
      start: "ブロック崩し",
      story: "ステージ演出",
      paused: "一時停止中",
      gameover: "ゲームオーバー",
      playing: "",
      clear: "全ステージクリア！",
      stageclear: "ステージクリア！",
      error: "エラーが発生しました",
    },
    sub: {
      start: "マウスでバーを移動してボールをたたき返してください。",
      story: "物語テキスト",
      paused: "Pキーで再開できます。",
      clear: "キャンペーン結果",
      stageclear: "次のステージへ進みます。",
      error: "画面を再読み込みして再開してください。",
      gameover: "最終スコア {score:number} / 残機 {lives:number}",
      clearSummary: "{stageLabel} {score:number}点{hasTime:boolean|  ・総時間 {clearTime} |}",
      stageclearSummary:
        "{stageLabel} {score:number}点 / 評価 {stars} ({ratingScore:number}) ・時間 {clearTime} ・被弾 {hitsTaken:number} ・残機 {livesLeft:number} ・ミッション {missionSummary}",
    },
    stageResultsTitle: "ステージ別結果",
    rogueTitle: "ラン強化（3回まで）",
    noResults: "結果データがありません。",
    rogueRemaining: "残り{count:number}回",
    dailyLabel: "今日のデイリー",
    dailySummary: "{label} ({key}): {objective}",
  },
  startSettings: {
    sections: {
      basic: "基本設定",
      debug: "デバッグ設定",
    },
    fields: {
      language: "言語",
      mode: "モード",
      difficulty: "難易度",
      initialLives: "初期残機",
      speed: "速度",
      route: "ルート選択",
      multiballMax: "マルチ上限",
      challengeMode: "チャレンジ固定シード",
      dailyMode: "デイリーモード",
      riskMode: "リスク倍率モード",
      newItemStacks: "新アイテムのスタック",
      stickyItem: "Stickyアイテム有効",
      ghostReplay: "ゴースト再生",
      bgm: "BGM",
      sfx: "効果音",
      debugEnabled: "有効化",
      debugStartStage: "開始ステージ",
      debugScenario: "シナリオ",
      debugItemPreset: "アイテムプリセット",
      debugRecordResults: "結果記録",
      customStageJsonEnabled: "カスタムステージJSON",
      customStageJson: "ステージJSON",
      seedCode: "シードコード（任意）",
    },
    placeholders: {
      seedCode: "例: C03-BOSS-777",
      customStageJson: '[{"id":1,"speedScale":1,"layout":[[1,0]],"elite":[]}]',
    },
    debugNote: "デバッグモードをONにすると検証用オプションを表示します。",
    loadDefaultStageJson: "現在の標準ステージJSONを読み込む",
    values: {
      gameMode: {
        campaign: "キャンペーン",
        endless: "エンドレス",
        boss_rush: "ボスラッシュ",
      },
      difficulty: {
        casual: "カジュアル",
        standard: "スタンダード",
        hard: "ハード",
      },
      routePreference: {
        auto: "自動",
        A: "Aルート",
        B: "Bルート",
      },
      debugScenario: {
        normal: "通常",
        enemy_check: "敵確認（9面）",
        boss_check: "ボス確認（12面）",
      },
      debugItemPreset: {
        none: "なし",
        combat_check: "戦闘確認",
        boss_check: "ボス確認",
      },
      debugRecordResults: {
        false: "記録しない",
        true: "記録する",
      },
    },
  },
  hud: {
    labels: {
      score: "スコア",
      lives: "残機",
      time: "時間",
      combo: "コンボ",
      items: "アイテム",
      bossHp: "ボスHP",
      upgrades: "強化",
      route: "ルート",
      modifier: "修飾",
      warpLegend: "ワープ: 青=入口 / 黄=出口",
    },
    stageMode: {
      campaign: "ステージ",
      endless: "エンドレス",
      boss_rush: "ボスラッシュ",
    },
    debug: {
      on: "🧪DEBUG",
      off: "🧪DEBUG(記録OFF)",
      badgeOn: "DEBUG",
      badgeOff: "DEBUG 記録OFF",
    },
    effect: {
      hazardBoost: "⚠危険加速中",
      pierceSlow: "✨貫通+1",
      risk: "🔥リスク x1.35",
      magicReady: "✨魔法:準備OK",
      magicCooldown: "✨魔法:{seconds}s",
    },
    comboValue: "x{value}",
    stageCounter: "{current:number}/{total:number}",
    endlessStageCounter: "{current:number} (∞)",
    routeValue: "ルート {route}",
    modifierValue: "{label}",
    bossValue: "{hp:number}/{maxHp:number} {phase}",
    phase: "P{phase:number}",
    rogueProgress: "{taken:number}/{max:number}",
  },
  shop: {
    title: "ショップ",
    status: {
      oneTime: "ショップ: 1回限定",
      purchased: "ショップ: このステージは購入済み",
    },
    price: "価格",
    choiceA: "選択肢A",
    choiceB: "選択肢B",
    points: "{amount:number}点",
  },
  items: {
    paddle_plus: {
      name: "パドル+",
      short: "幅",
      hud: "🟦幅増加",
      description: "パドル幅を増やす",
    },
    slow_ball: {
      name: "スロー",
      short: "遅",
      hud: "🐢スロー",
      description: "ボール速度を下げる",
    },
    shield: {
      name: "シールド",
      short: "盾",
      hud: "🛡シールド",
      description: "落球を1回防ぐ",
    },
    multiball: {
      name: "マルチ",
      short: "多",
      hud: "🎱マルチ",
      description: "ボール数を増やす",
    },
    pierce: {
      name: "貫通",
      short: "貫",
      hud: "🗡貫通",
      description: "ブロックを貫通する",
    },
    bomb: {
      name: "ボム",
      short: "爆",
      hud: "💣ボム",
      description: "直撃時に範囲破壊",
    },
    laser: {
      name: "レーザー",
      short: "砲",
      hud: "🔫レーザー",
      description: "自動でレーザーを発射",
    },
    sticky: {
      name: "スティッキー",
      short: "粘",
      hud: "🧲スティッキー",
      description: "ボールを一時保持して自動発射",
    },
    homing: {
      name: "ホーミング",
      short: "追",
      hud: "🛰ホーミング",
      description: "ボール軌道を近くのブロックへ補正",
    },
    rail: {
      name: "レール",
      short: "線",
      hud: "⚡レール",
      description: "レーザーが複数のブロックを貫く",
    },
    stack: "{label}×{count:number}",
  },
  stageModifiers: {
    warp_zone: "ワープゾーン",
    speed_ball: "高速球",
    enemy_flux: "浮遊敵+フラックス",
    flux: "フラックス",
  },
  story: {
    stage4: "第4ステージ: 深層ゲートに到達。ここから先は分岐ルートで攻略が変化します。",
    stage8: "第8ステージ: 重力レンズ地帯に突入。球速と軌道が大きく変わる危険域です。",
    stage12: "最終ステージ: コア・ガーディアン起動。すべての強化を使って突破してください。",
  },
  daily: {
    objectives: {
      no_miss_stage_clear: "ノーミスで1ステージクリア",
      combo_x2: "コンボ x2.0 を達成",
      collect_three_items: "アイテムを3個以上取得",
    },
  },
  rogue: {
    paddle_core: "幅コア",
    speed_core: "速度コア",
    score_core: "スコアコア",
  },
  stageMission: {
    achieved: "達成",
    failed: "未達",
    targetSeconds: "{seconds:number}秒以内",
    time_limit: "制限時間",
    no_shop: "ショップ未使用",
  },
  results: {
    rating: "評価",
    time: "時間",
    hitsTaken: "被弾",
    livesLeft: "残機",
    mission: "ミッション",
    summaryRow:
      "ステージ {stageNumber:number}: {stars} ({ratingScore:number}) / 時間 {clearTime} / 残機 {livesLeft:number} / ミッション {missionSummary}",
  },
  errors: {
    initialization: "初期化中に問題が発生しました。",
    gameStart: "ゲーム開始時に問題が発生しました。",
    startAction: "開始処理に失敗しました。",
    shopPurchase: "ショップ購入に失敗しました。",
    runtime: "実行中にエラーが発生しました。",
  },
  floating: {
    reinforce: "REINFORCE",
    split: "SPLIT!",
    summon: "SUMMON",
    thorns: "THORNS!",
    spell: "SPELL",
    bossPhase2: "BOSS PHASE 2",
  },
} as const satisfies BaseTranslation;

type WidenTranslation<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly WidenTranslation<U>[]
    : T extends Record<string, unknown>
      ? { [K in keyof T]: WidenTranslation<T[K]> }
      : T;

type Translation = WidenTranslation<typeof ja>;

const en: Translation = {
  locales: {
    ja: "Japanese",
    en: "English",
    pseudo: "Pseudo",
  },
  app: {
    title: "Brick Breaker",
    pauseHint: "Press P to pause",
  },
  actions: {
    start: "Start Game",
    continue: "Continue",
    resume: "Resume",
    retry: "Retry",
    backToTitle: "Back to Title",
    reload: "Reload",
    next: "Next",
  },
  overlay: {
    message: {
      start: "Brick Breaker",
      story: "Stage Story",
      paused: "Paused",
      gameover: "Game Over",
      playing: "",
      clear: "All Stages Cleared!",
      stageclear: "Stage Cleared!",
      error: "An Error Occurred",
    },
    sub: {
      start: "Move the paddle with the mouse and send the ball back.",
      story: "Story text",
      paused: "Press P to resume.",
      clear: "Campaign Results",
      stageclear: "Advance to the next stage.",
      error: "Reload the page to continue.",
      gameover: "Final score {score:number} / Lives {lives:number}",
      clearSummary: "{stageLabel} {score:number} pts{hasTime:boolean|  / Total time {clearTime} |}",
      stageclearSummary:
        "{stageLabel} {score:number} pts / Rating {stars} ({ratingScore:number}) / Time {clearTime} / Hits {hitsTaken:number} / Lives {livesLeft:number} / Missions {missionSummary}",
    },
    stageResultsTitle: "Stage Results",
    rogueTitle: "Run Upgrades (up to 3)",
    noResults: "No result data available.",
    rogueRemaining: "{count:number} remaining",
    dailyLabel: "Daily Challenge",
    dailySummary: "{label} ({key}): {objective}",
  },
  startSettings: {
    sections: {
      basic: "Basic Settings",
      debug: "Debug Settings",
    },
    fields: {
      language: "Language",
      mode: "Mode",
      difficulty: "Difficulty",
      initialLives: "Initial Lives",
      speed: "Speed",
      route: "Route",
      multiballMax: "Multiball Cap",
      challengeMode: "Fixed challenge seed",
      dailyMode: "Daily mode",
      riskMode: "Risk multiplier mode",
      newItemStacks: "New item stacking",
      stickyItem: "Enable Sticky item",
      ghostReplay: "Ghost replay",
      bgm: "BGM",
      sfx: "SFX",
      debugEnabled: "Enabled",
      debugStartStage: "Start stage",
      debugScenario: "Scenario",
      debugItemPreset: "Item preset",
      debugRecordResults: "Save results",
      customStageJsonEnabled: "Custom stage JSON",
      customStageJson: "Stage JSON",
      seedCode: "Seed code (optional)",
    },
    placeholders: {
      seedCode: "Example: C03-BOSS-777",
      customStageJson: '[{"id":1,"speedScale":1,"layout":[[1,0]],"elite":[]}]',
    },
    debugNote: "Turn debug mode on to reveal verification options.",
    loadDefaultStageJson: "Load the current default stage JSON",
    values: {
      gameMode: {
        campaign: "Campaign",
        endless: "Endless",
        boss_rush: "Boss Rush",
      },
      difficulty: {
        casual: "Casual",
        standard: "Standard",
        hard: "Hard",
      },
      routePreference: {
        auto: "Auto",
        A: "Route A",
        B: "Route B",
      },
      debugScenario: {
        normal: "Normal",
        enemy_check: "Enemy check (Stage 9)",
        boss_check: "Boss check (Stage 12)",
      },
      debugItemPreset: {
        none: "None",
        combat_check: "Combat check",
        boss_check: "Boss check",
      },
      debugRecordResults: {
        false: "Do not save",
        true: "Save",
      },
    },
  },
  hud: {
    labels: {
      score: "Score",
      lives: "Lives",
      time: "Time",
      combo: "Combo",
      items: "Items",
      bossHp: "Boss HP",
      upgrades: "Upgrades",
      route: "Route",
      modifier: "Modifier",
      warpLegend: "Warp: blue=in / yellow=out",
    },
    stageMode: {
      campaign: "Stage",
      endless: "Endless",
      boss_rush: "Boss Rush",
    },
    debug: {
      on: "🧪DEBUG",
      off: "🧪DEBUG(no save)",
      badgeOn: "DEBUG",
      badgeOff: "DEBUG no save",
    },
    effect: {
      hazardBoost: "⚠ Hazard speed boost",
      pierceSlow: "✨ Pierce +1",
      risk: "🔥 Risk x1.35",
      magicReady: "✨ Magic ready",
      magicCooldown: "✨ Magic:{seconds}s",
    },
    comboValue: "x{value}",
    stageCounter: "{current:number}/{total:number}",
    endlessStageCounter: "{current:number} (∞)",
    routeValue: "Route {route}",
    modifierValue: "{label}",
    bossValue: "{hp:number}/{maxHp:number} {phase}",
    phase: "P{phase:number}",
    rogueProgress: "{taken:number}/{max:number}",
  },
  shop: {
    title: "Shop",
    status: {
      oneTime: "Shop: one purchase only",
      purchased: "Shop: already used this stage",
    },
    price: "Price",
    choiceA: "Choice A",
    choiceB: "Choice B",
    points: "{amount:number} pts",
  },
  items: {
    paddle_plus: {
      name: "Paddle+",
      short: "WID",
      hud: "🟦 Width",
      description: "Increase paddle width",
    },
    slow_ball: {
      name: "Slow",
      short: "SLO",
      hud: "🐢 Slow",
      description: "Reduce ball speed",
    },
    shield: {
      name: "Shield",
      short: "SHD",
      hud: "🛡 Shield",
      description: "Prevent one miss",
    },
    multiball: {
      name: "Multiball",
      short: "MLT",
      hud: "🎱 Multi",
      description: "Increase the number of balls",
    },
    pierce: {
      name: "Pierce",
      short: "PRC",
      hud: "🗡 Pierce",
      description: "Pierce through bricks",
    },
    bomb: {
      name: "Bomb",
      short: "BMB",
      hud: "💣 Bomb",
      description: "Area explosion on hit",
    },
    laser: {
      name: "Laser",
      short: "LSR",
      hud: "🔫 Laser",
      description: "Fire lasers automatically",
    },
    sticky: {
      name: "Sticky",
      short: "STK",
      hud: "🧲 Sticky",
      description: "Hold the ball briefly then auto-fire",
    },
    homing: {
      name: "Homing",
      short: "HOM",
      hud: "🛰 Homing",
      description: "Bend the ball toward nearby bricks",
    },
    rail: {
      name: "Rail",
      short: "RIL",
      hud: "⚡ Rail",
      description: "Let lasers pierce multiple bricks",
    },
    stack: "{label}×{count:number}",
  },
  stageModifiers: {
    warp_zone: "Warp Zone",
    speed_ball: "Speed Ball",
    enemy_flux: "Enemy + Flux",
    flux: "Flux Field",
  },
  story: {
    stage4: "Stage 4: You reached the deep gate. Route choices start to matter from here.",
    stage8: "Stage 8: You enter the gravity lens zone. Ball speed and trajectories become unstable here.",
    stage12: "Final Stage: Core Guardian engaged. Use every upgrade you have to break through.",
  },
  daily: {
    objectives: {
      no_miss_stage_clear: "Clear one stage without missing",
      combo_x2: "Reach combo x2.0",
      collect_three_items: "Collect at least 3 items",
    },
  },
  rogue: {
    paddle_core: "Paddle Core",
    speed_core: "Speed Core",
    score_core: "Score Core",
  },
  stageMission: {
    achieved: "Complete",
    failed: "Failed",
    targetSeconds: "within {seconds:number}s",
    time_limit: "Time Limit",
    no_shop: "No Shop",
  },
  results: {
    rating: "Rating",
    time: "Time",
    hitsTaken: "Hits",
    livesLeft: "Lives",
    mission: "Missions",
    summaryRow:
      "Stage {stageNumber:number}: {stars} ({ratingScore:number}) / Time {clearTime} / Lives {livesLeft:number} / Missions {missionSummary}",
  },
  errors: {
    initialization: "A problem occurred during initialization.",
    gameStart: "A problem occurred while starting the game.",
    startAction: "Failed to start the session.",
    shopPurchase: "Failed to purchase from the shop.",
    runtime: "A runtime error occurred.",
  },
  floating: {
    reinforce: "REINFORCE",
    split: "SPLIT!",
    summon: "SUMMON",
    thorns: "THORNS!",
    spell: "SPELL",
    bossPhase2: "BOSS PHASE 2",
  },
};

function pseudoifyText(value: string): string {
  const placeholders: string[] = [];
  const preserved = value.replace(/\{[^}]+\}/g, (match) => {
    const token = `__PSEUDO_${placeholders.length.toString()}__`;
    placeholders.push(match);
    return token;
  });

  const expanded = preserved
    .replace(/[aeiouAEIOU]/g, (char) => `${char}${char.toLowerCase()}`)
    .replace(/[A-Za-z]/g, (char) => {
      const map: Record<string, string> = {
        a: "à",
        b: "ƀ",
        c: "ç",
        d: "đ",
        e: "ë",
        f: "ƒ",
        g: "ğ",
        h: "ĥ",
        i: "ï",
        j: "ĵ",
        k: "ķ",
        l: "ľ",
        m: "m",
        n: "ñ",
        o: "õ",
        p: "ƥ",
        q: "ʠ",
        r: "ř",
        s: "š",
        t: "ŧ",
        u: "ü",
        v: "ṽ",
        w: "ŵ",
        x: "ẋ",
        y: "ÿ",
        z: "ž",
      };
      const lower = map[char.toLowerCase()] ?? char;
      return char === char.toUpperCase() ? lower.toUpperCase() : lower;
    });

  const restored = placeholders.reduce(
    (text, placeholder, index) => text.replace(`__PSEUDO_${index.toString()}__`, placeholder),
    expanded,
  );

  return `⟪${restored}⟫`;
}

function buildPseudoTranslation<T>(value: T): T {
  if (typeof value === "string") {
    return pseudoifyText(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => buildPseudoTranslation(entry)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, buildPseudoTranslation(entry)]),
    ) as T;
  }
  return value;
}

const pseudo: Translation = buildPseudoTranslation(en);

export const translationCatalog = {
  ja,
  en,
  pseudo,
} as const;

export type TranslationSchema = Translation;
