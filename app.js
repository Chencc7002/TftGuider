const metaReference = [
  {
    name: "Syndicate Flex",
    tier: "S",
    keywords: ["Syndicate", "Dominator", "Bruiser"],
    note: "当前版本高容错运营体系，适合中期稳血后转强力四费。",
  },
  {
    name: "Strategist Fast 8",
    tier: "S",
    keywords: ["Strategist", "Techie", "Bastion"],
    note: "上 8 后通过双核提升上限，适合有经济基础的玩家。",
  },
  {
    name: "Nitro Reroll",
    tier: "A",
    keywords: ["Nitro", "Rapidfire", "Slayer"],
    note: "节奏快，适合装备命中后早早锁血。",
  },
  {
    name: "Exotech Board",
    tier: "A",
    keywords: ["Exotech", "Marksman", "Vanguard"],
    note: "对站位与装备要求较高，但中后期上限稳定。",
  },
];

const COMP_TIER_COLORS = {
  S: "#79e36a",
  A: "#f1c84c",
  B: "#52c7ff",
  C: "#7b8199",
};

const COMP_DONUT_COLORS = ["#6f6cff", "#24c8dd", "#a065ff", "#ff4fa3", "#1db9aa", "#ff8b2c", "#8ba0bd", "#f1c84c"];
const demoTemplates = [
  {
    comp: "Syndicate / Dominator",
    traits: ["Syndicate", "Dominator", "Bruiser"],
    units: ["Braum", "Miss Fortune", "Twisted Fate", "Darius", "Shaco", "Jarvan IV", "Leona", "Ziggs"],
    augments: ["Cybernetic Uplink", "Spoils of War", "Pandora's Items"],
  },
  {
    comp: "Strategist / Techie",
    traits: ["Strategist", "Techie", "Bastion"],
    units: ["Seraphine", "Ekko", "Rumble", "Morgana", "Azir", "Garen", "Illaoi", "Ryze"],
    augments: ["Hedge Fund", "Healing Orbs", "Jeweled Lotus"],
  },
  {
    comp: "Nitro / Rapidfire",
    traits: ["Nitro", "Rapidfire", "Slayer"],
    units: ["Draven", "Jinx", "Sejuani", "Vi", "Senna", "Aatrox", "Rhaast", "Rell"],
    augments: ["Combat Caster", "Lategame Specialist", "Item Collector"],
  },
  {
    comp: "Exotech / Marksman",
    traits: ["Exotech", "Marksman", "Vanguard"],
    units: ["Ezreal", "Varus", "Leona", "Jarvan IV", "Mordekaiser", "Jhin", "Yuumi", "Rakan"],
    augments: ["Portable Forge", "Component Buffet", "Big Grab Bag"],
  },
  {
    comp: "Street Demon / Slayer",
    traits: ["Street Demon", "Slayer", "Bruiser"],
    units: ["Kayn", "Morgana", "Darius", "Ekko", "Dr. Mundo", "Katarina", "Vex", "Rengar"],
    augments: ["Heroic Grab Bag", "Harmacist", "Patient Study"],
  },
];

function createDemoBundle() {
  const placements = [4, 3, 2, 6, 5, 3, 1, 2, 4, 3, 8, 6, 3, 2, 1, 5, 4, 7, 3, 2, 6, 4, 1, 3, 5, 2, 4, 2, 3, 1];
  const matches = placements.map((placement, index) => {
    const template = demoTemplates[index % demoTemplates.length];
    const playedAt = new Date(Date.UTC(2026, 1, 8 + index, 12 + (index % 7), 20)).toISOString();
    const level = placement <= 2 ? 9 : placement <= 4 ? 8 : 7;
    const playersEliminated = Math.max(0, 7 - placement);
    const totalDamageToPlayers = 60 + (9 - placement) * 9 + (index % 4) * 4;
    return {
      matchId: `DEMO_MATCH_${index + 1}`,
      queueType: 1100,
      playedAt,
      placement,
      lpChange: [40, 32, 24, 14, -12, -18, -31, -45][placement - 1],
      level,
      lastRound: 20 + (9 - placement) * 2,
      playersEliminated,
      totalDamageToPlayers,
      goldLeft: placement <= 4 ? 14 + (index % 6) : 4 + (index % 3),
      augments: template.augments,
      traits: template.traits.map((name, traitIndex) => ({
        name,
        numUnits: 2 + ((index + traitIndex) % 4),
        tierCurrent: 1 + ((index + traitIndex) % 3),
        tierTotal: 3,
      })),
      units: template.units.map((name, unitIndex) => ({
        name,
        tier: unitIndex < 2 && placement <= 4 ? 2 : 1,
        rarity: unitIndex < 2 ? 4 : 2,
        items: unitIndex < 3 ? ["Infinity Edge", "Guardbreaker", "Last Whisper"].slice(0, 1 + ((index + unitIndex) % 3)) : [],
      })),
      goldTrend: null,
      levelUpTimeline: null,
    };
  });

  return {
    player: {
      gameName: "chencc",
      tagLine: "1215",
      puuid: "demo-puuid",
      summonerId: "demo-summoner",
      profileIconId: 1,
      summonerLevel: 412,
      region: { label: "韩服 KR" },
      rank: {
        tier: "CHALLENGER",
        rank: "I",
        leaguePoints: 1020,
        wins: 188,
        losses: 124,
      },
    },
    matches,
    unavailableFields: ["goldTrend", "levelUpTimeline"],
  };
}

const dom = {
  authStatus: document.getElementById("authStatus"),
  queryHint: document.getElementById("queryHint"),
  regionSelect: document.getElementById("regionSelect"),
  gameNameInput: document.getElementById("gameNameInput"),
  tagLineInput: document.getElementById("tagLineInput"),
  analyzeButton: document.getElementById("analyzeButton"),
  refreshButton: document.getElementById("refreshButton"),
  profileCard: document.getElementById("profileCard"),
  summaryStrip: document.getElementById("summaryStrip"),
  placementTrendLabel: document.getElementById("placementTrendLabel"),
  lpTrendLabel: document.getElementById("lpTrendLabel"),
  placementChart: document.getElementById("placementChart"),
  lpChart: document.getElementById("lpChart"),
  distributionChart: document.getElementById("distributionChart"),
  compCards: document.getElementById("compCards"),
  compTable: document.getElementById("compTable"),
  compDonut: document.getElementById("compDonut"),
  compBubble: document.getElementById("compBubble"),
  unitBars: document.getElementById("unitBars"),
  synergyHeatmap: document.getElementById("synergyHeatmap"),
  styleTags: document.getElementById("styleTags"),
  styleMetrics: document.getElementById("styleMetrics"),
  confidenceBadge: document.getElementById("confidenceBadge"),
  metaAlignmentLabel: document.getElementById("metaAlignmentLabel"),
  metaPanel: document.getElementById("metaPanel"),
  recommendations: document.getElementById("recommendations"),
  matchesMeta: document.getElementById("matchesMeta"),
  matchList: document.getElementById("matchList"),
  replayModal: document.getElementById("replayModal"),
  replayBackdrop: document.getElementById("replayBackdrop"),
  replayCloseButton: document.getElementById("replayCloseButton"),
  replayTitle: document.getElementById("replayTitle"),
  replayMeta: document.getElementById("replayMeta"),
  replayContent: document.getElementById("replayContent"),
};

const state = {
  source: "demo",
  bundle: createDemoBundle(),
  replayMatch: null,
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stddev(values) {
  if (!values.length) return 0;
  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatPlacement(value) {
  return `${value.toFixed(2)} 平均名次`;
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function openReplayTodo(match) {
  state.replayMatch = match;
  const compName = inferBoardSummary(match);
  const lpLabel = typeof match.lpChange === "number"
    ? `${match.lpChange > 0 ? "+" : ""}${match.lpChange} LP`
    : "Riot 官方无单局 LP";

  dom.replayTitle.textContent = `${match.placement} 名 · ${compName}`;
  dom.replayMeta.innerHTML = [
    { label: "对局时间", value: formatDate(match.playedAt) },
    { label: "对局 ID", value: match.matchId || "暂不可得" },
    { label: "当前占位", value: lpLabel },
  ].map((item) => `
    <article class="replay-meta-card">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
    </article>
  `).join("");

  dom.replayContent.innerHTML = `
    <div class="replay-content">
      <h3>录像入口待接入</h3>
      <p>这里已经预留了逐局录像查看入口，后续我们只需要把真实回放源接进来，就可以从这张卡片直接跳转或播放。</p>
      <ul class="replay-todo-list">
        <li>当前可用于绑定回放的关键字段：<strong>${escapeHtml(match.matchId || "暂不可得")}</strong>、服务器 <strong>${escapeHtml(dom.regionSelect.value)}</strong>、对局时间 <strong>${escapeHtml(formatDate(match.playedAt))}</strong>。</li>
        <li>后续可商定的回放来源包括：第三方战绩站回放页、录屏文件索引，或自建回放快照服务。</li>
        <li>正式接入前，这里先作为 TODO 面板使用，方便逐局标记哪些对局值得回看。</li>
      </ul>
    </div>
  `;

  dom.replayModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeReplayTodo() {
  state.replayMatch = null;
  dom.replayModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function toDisplayRank(rank) {
  if (!rank) return "未获取排位";
  return `${rank.tier} ${rank.rank} · ${rank.leaguePoints} LP`;
}

function getActiveTraits(match) {
  return (match.traits || [])
    .filter((trait) => (trait.tierCurrent || 0) > 0 && (trait.numUnits || 0) > 0)
    .sort((left, right) => (right.numUnits || 0) - (left.numUnits || 0) || (right.tierCurrent || 0) - (left.tierCurrent || 0));
}

function getKeyUnits(match) {
  return (match.units || [])
    .slice()
    .sort((left, right) => (right.items?.length || 0) - (left.items?.length || 0) || (right.tier || 0) - (left.tier || 0) || (right.rarity || 0) - (left.rarity || 0))
    .slice(0, 2)
    .map((unit) => unit.name);
}

function inferBoardBucket(match) {
  const activeTraits = getActiveTraits(match).slice(0, 2).map((trait) => trait.name);
  if (activeTraits.length) return activeTraits.join(" / ");
  const keyUnits = getKeyUnits(match);
  return keyUnits.join(" + ") || "未识别骨架";
}

function inferBoardSummary(match) {
  const activeTraits = getActiveTraits(match).slice(0, 2).map((trait) => `${trait.name} ${trait.numUnits}`);
  const keyUnits = getKeyUnits(match);
  if (activeTraits.length && keyUnits.length) {
    return `${activeTraits.join(" / ")} · ${keyUnits.join(" + ")}`;
  }
  return activeTraits.join(" / ") || keyUnits.join(" + ") || "未识别对局摘要";
}

function summarizeTraits(match) {
  return getActiveTraits(match)
    .slice(0, 4)
    .map((trait) => `${trait.name} ${trait.numUnits}`);
}

function countBy(items) {
  return items.reduce((map, item) => {
    map.set(item, (map.get(item) || 0) + 1);
    return map;
  }, new Map());
}

function traitNameFromSummary(label) {
  return String(label || "").replace(/\s+\d+$/, "").trim();
}

function buildDemoMetaComps() {
  return metaReference.map((reference) => ({
    name: reference.name,
    traits: reference.keywords,
    units: [],
    avgPlacement: null,
    winRate: null,
    firstPlaceRate: null,
    pickRate: null,
    note: reference.note,
    url: null,
  }));
}

function scoreCompAgainstMetaComp(comp, metaComp) {
  const playerTraits = new Set((comp.traitNames || []).map((trait) => traitNameFromSummary(trait)));
  const metaTraits = [...new Set((metaComp.traits || []).map((trait) => traitNameFromSummary(trait)))];
  const playerUnits = new Set(comp.keyUnits || []);
  const metaUnits = [...new Set(metaComp.units || [])];

  const traitOverlap = metaTraits.filter((trait) => playerTraits.has(trait)).length;
  const unitOverlap = metaUnits.filter((unit) => playerUnits.has(unit)).length;
  const traitBase = Math.max(Math.min(metaTraits.length, 3), 1);
  const unitBase = Math.max(Math.min(metaUnits.length, 2), 1);
  const rawScore = ((traitOverlap / traitBase) * 0.75) + ((unitOverlap / unitBase) * 0.25);
  return clamp(Math.round(rawScore * 100), 0, 100);
}

function analyzeBundle(bundle, source = "demo") {
  const matches = bundle.matches || [];
  const placements = matches.map((match) => match.placement);
  const avgPlacement = average(placements);
  const top4Rate = matches.filter((match) => match.placement <= 4).length / Math.max(matches.length, 1);
  const winRate = matches.filter((match) => match.placement === 1).length / Math.max(matches.length, 1);
  const placementStd = stddev(placements);
  const recent10 = matches.slice(-10);
  const prev20 = matches.slice(0, Math.max(matches.length - 10, 0));
  const recent10Avg = average(recent10.map((match) => match.placement));
  const prev20Avg = prev20.length ? average(prev20.map((match) => match.placement)) : recent10Avg;
  const trendDelta = prev20Avg - recent10Avg;

  const distribution = Array.from({ length: 8 }, (_, index) => ({
    placement: index + 1,
    count: matches.filter((match) => match.placement === index + 1).length,
  }));

  const hasRealLpChanges = matches.some((match) => typeof match.lpChange === "number");
  const lpValues = matches.map((match, index) => {
    if (typeof match.lpChange === "number") {
      return match.lpChange;
    }
    return (9 - match.placement) * 10 + (match.playersEliminated || 0) * 3 - 25 + index * 0.2;
  });
  const lpLabel = hasRealLpChanges
    ? "真实 LP 变化"
    : "Riot 官方接口未返回单局 LP，以下为名次动量（非真实 LP）";

  let cumulative = bundle.player.rank?.leaguePoints || 0;
  const lpTrendSeries = matches.map((match, index) => {
    const delta = lpValues[index];
    cumulative += delta;
    return { label: formatDate(match.playedAt), value: Math.round(cumulative) };
  });

  const compMap = new Map();
  for (const match of matches) {
    const bucketKey = inferBoardBucket(match);
    if (!compMap.has(bucketKey)) {
      compMap.set(bucketKey, {
        bucketKey,
        name: inferBoardSummary(match),
        matches: [],
        traits: summarizeTraits(match),
        traitNames: getActiveTraits(match).map((trait) => trait.name),
        keyUnits: getKeyUnits(match),
      });
    }
    compMap.get(bucketKey).matches.push(match);
  }

  const compStats = [...compMap.values()]
    .map((entry) => {
      const entryPlacements = entry.matches.map((match) => match.placement);
      const avgPlacement = average(entryPlacements);
      const top4Rate = entry.matches.filter((match) => match.placement <= 4).length / entry.matches.length;
      const winRate = entry.matches.filter((match) => match.placement === 1).length / entry.matches.length;
      const eighthRate = entry.matches.filter((match) => match.placement === 8).length / entry.matches.length;
      const playRate = entry.matches.length / Math.max(matches.length, 1);
      const strengthScore = clamp(
        Math.round(((6.7 - avgPlacement) / 5.7) * 42 + top4Rate * 33 + winRate * 18 + playRate * 20),
        18,
        98
      );
      const tier = strengthScore >= 78 ? "S" : strengthScore >= 64 ? "A" : strengthScore >= 50 ? "B" : "C";

      return {
        name: entry.name,
        bucketKey: entry.bucketKey,
        count: entry.matches.length,
        avgPlacement,
        top4Rate,
        winRate,
        eighthRate,
        playRate,
        strengthScore,
        tier,
        tierColor: COMP_TIER_COLORS[tier],
        traits: entry.traits,
        traitNames: entry.traitNames,
        keyUnits: entry.keyUnits,
      };
    })
    .sort((left, right) => right.count - left.count || left.avgPlacement - right.avgPlacement);

  const unitFrequency = new Map();
  matches.forEach((match) => {
    (match.units || []).forEach((unit) => {
      unitFrequency.set(unit.name, (unitFrequency.get(unit.name) || 0) + 1);
    });
  });
  const topUnits = [...unitFrequency.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 10);

  const heatmapUnits = topUnits.slice(0, 8).map((unit) => unit.name);
  const synergyMatrix = heatmapUnits.map((rowUnit) =>
    heatmapUnits.map((colUnit) => {
      const together = matches.filter((match) => {
        const names = new Set((match.units || []).map((unit) => unit.name));
        return names.has(rowUnit) && names.has(colUnit);
      }).length;
      return Math.round((together / Math.max(matches.length, 1)) * 100);
    })
  );

  const uniqueCompCount = compStats.length;
  const topCompShare = compStats[0] ? compStats[0].count / Math.max(matches.length, 1) : 0;
  const avgLevel = average(matches.map((match) => match.level || 0));
  const lowLevelRate = matches.filter((match) => (match.level || 0) <= 7).length / Math.max(matches.length, 1);
  const stabilityScore = clamp(Math.round((1 - placementStd / 3.2) * 100), 18, 95);
  const flexibilityScore = clamp(Math.round((uniqueCompCount / 8) * 100), 20, 96);
  const tempoScore = clamp(Math.round(((avgLevel - 6.8) / 2.2) * 100), 18, 92);
  const rerollScore = clamp(Math.round(lowLevelRate * 100), 10, 95);

  const hasLiveMetaBenchmark = Boolean(bundle.metaBenchmark?.comps?.length);
  const metaSourceComps = hasLiveMetaBenchmark
    ? bundle.metaBenchmark.comps
    : source === "demo"
    ? buildDemoMetaComps()
    : [];
  const metaAvailable = metaSourceComps.length > 0;
  const metaMatches = metaAvailable
    ? compStats.map((comp) => {
        const candidates = metaSourceComps
          .map((metaComp) => ({
            metaComp,
            score: scoreCompAgainstMetaComp(comp, metaComp),
          }))
          .sort((left, right) => right.score - left.score || (right.metaComp.pickRate || 0) - (left.metaComp.pickRate || 0));
        const best = candidates[0] || null;
        return {
          comp: comp.name,
          count: comp.count,
          matchScore: best?.score || 0,
          matched: best?.score >= 45 ? best.metaComp : null,
        };
      })
    : [];

  const matchedWeight = metaMatches.reduce((sum, entry) => sum + (entry.count * entry.matchScore) / 100, 0);
  const metaAlignmentScore = metaAvailable ? clamp(Math.round((matchedWeight / Math.max(matches.length, 1)) * 100), 0, 100) : null;
  const metaSourceLabel = hasLiveMetaBenchmark
    ? `${bundle.metaBenchmark.source.name} ${bundle.metaBenchmark.source.set}`
    : source === "demo"
    ? "本地演示样例"
    : "未接入环境基准";
  const metaCardSub = metaAvailable
    ? metaAlignmentScore >= 60
      ? `对照 ${metaSourceLabel}`
      : `偏离 ${metaSourceLabel}`
    : "未接真实环境基准";

  const styleTags = [];
  styleTags.push(topCompShare > 0.35 ? "强玩单骨架倾向" : "切换骨架相对健康");
  styleTags.push(avgLevel >= 8.1 ? "偏运营上限型" : "7 级停留偏久");
  styleTags.push(stabilityScore >= 68 ? "吃分稳定性较好" : "名次波动较大");
  styleTags.push(metaAvailable ? "环境对照已启用" : "未接入环境基准");

  const styleMetrics = [
    {
      label: "灵活度",
      value: flexibilityScore,
      copy: topCompShare > 0.35 ? "最近同一类羁绊骨架占比较高，说明转型空间偏小。" : "近期羁绊骨架分布较均衡，说明有一定转型能力。",
    },
    {
      label: "运营节奏",
      value: tempoScore,
      copy: avgLevel >= 8.1 ? "平均终盘等级较高，说明你愿意为后期上限投资。" : "平均终盘等级偏低，说明你在 7 级阶段停留时间较长。",
    },
    {
      label: "D 牌倾向",
      value: rerollScore,
      copy: lowLevelRate >= 0.45 ? "较多对局在 7 级前后就定型，偏向中期 D 牌找质量。" : "更多通过拉人口补强，D 牌时机相对克制。",
    },
    {
      label: "稳定性",
      value: stabilityScore,
      copy: stabilityScore >= 68 ? "低分局较少，说明锁血与止损能力不错。" : "高低名次差距大，说明有吃鸡潜力但容错率不高。",
    },
  ];

  const recommendations = [];
  if (topCompShare > 0.35) {
    recommendations.push(`最近同一类羁绊骨架占比约 ${(topCompShare * 100).toFixed(0)}%，若装备和强化不匹配，建议更早转向第二选择。`);
  }
  if (avgLevel < 8.1) {
    recommendations.push("中性或连胜开局时，优先把 4-2 左右拉 8 作为默认线，别在 7 级长时间停留导致后期上限不足。");
  }
  if (trendDelta < -0.25) {
    recommendations.push("最近 10 场平均名次比前 20 场更差，建议缩短贪经济回合，在血量低于 55 时更早补出两星前排。");
  } else {
    recommendations.push("最近 10 场状态较前段回暖，继续保持中期稳血思路，把优势局转化为更多前二而不只是前四。");
  }
  if (hasLiveMetaBenchmark && metaAlignmentScore < 45) {
    const topMetaNames = metaSourceComps.slice(0, 3).map((comp) => comp.name).join("、");
    recommendations.push(`你最近的高频骨架与 ${metaSourceLabel} 当前热门骨架重合度偏低，可重点观察 ${topMetaNames} 的成型思路和转型节点。`);
  }
  if (!hasRealLpChanges) {
    recommendations.push("当前 Riot 官方接口不直接返回单局 LP 变化，因此趋势图展示的是名次动量，而不是真实胜点差值。");
  }

  return {
    matches,
    avgPlacement,
    top4Rate,
    winRate,
    placementStd,
    recent10Avg,
    prev20Avg,
    trendDelta,
    distribution,
    lpLabel,
    lpTrendSeries,
    hasRealLpChanges,
    compStats,
    topUnits,
    heatmapUnits,
    synergyMatrix,
    styleTags,
    styleMetrics,
    metaAvailable,
    metaAlignmentScore,
    metaMatches: metaMatches.slice(0, 3),
    metaSourceLabel,
    metaCardSub,
    metaExplanation: hasLiveMetaBenchmark
      ? `${metaSourceLabel} · ${bundle.metaBenchmark.source.queueScope}${bundle.metaBenchmark.source.updatedAt ? ` · 更新于 ${bundle.metaBenchmark.source.updatedAt}` : ""}`
      : source === "demo"
      ? "当前仅使用本地演示样例做版本对照，不代表真实全服环境。"
      : "当前未接入真实版本环境数据，因此本页建议只基于你自己的近 30 场，不做全服热门阵容对比。",
    recommendations: recommendations.slice(0, 5),
  };
}
function buildLineChart(values, options = {}) {
  const width = 640;
  const height = 260;
  const padding = { top: 18, right: 18, bottom: 34, left: 38 };
  const min = options.min ?? Math.min(...values.map((item) => item.value));
  const max = options.max ?? Math.max(...values.map((item) => item.value));
  const safeMax = max === min ? max + 1 : max;
  const stepX = (width - padding.left - padding.right) / Math.max(values.length - 1, 1);
  const points = values.map((item, index) => {
    const x = padding.left + stepX * index;
    const y = padding.top + ((safeMax - item.value) / (safeMax - min)) * (height - padding.top - padding.bottom);
    return { x, y, label: item.label, value: item.value };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  const gridLines = 4;
  const grid = Array.from({ length: gridLines + 1 }, (_, index) => {
    const y = padding.top + ((height - padding.top - padding.bottom) / gridLines) * index;
    const labelValue = Math.round(safeMax - ((safeMax - min) / gridLines) * index);
    return `
      <line class="grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line>
      <text class="axis-label" x="8" y="${y + 4}">${labelValue}</text>
    `;
  }).join("");
  const dots = points.map((point) => `
    <circle cx="${point.x}" cy="${point.y}" r="4" fill="${options.color}">
      <title>${point.label}: ${point.value}</title>
    </circle>
  `).join("");
  const xLabels = points.filter((_, index) => index % Math.ceil(values.length / 6) === 0 || index === values.length - 1).map((point) => `
    <text class="axis-label" x="${point.x}" y="${height - 8}" text-anchor="middle">${escapeHtml(point.label)}</text>
  `).join("");

  let extra = "";
  if (options.area) {
    const areaPath = `${path} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;
    extra += `<path class="area-secondary" d="${areaPath}"></path>`;
  }

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="chart">
      ${grid}
      ${extra}
      <path class="${options.className}" d="${path}"></path>
      ${dots}
      ${xLabels}
    </svg>
  `;
}

function buildCompDonut(compStats, totalMatches) {
  if (!compStats.length) {
    return '<div class="empty-state">暂无足够阵容数据</div>';
  }

  const slices = compStats.slice(0, 7).map((comp, index) => ({
    ...comp,
    color: COMP_DONUT_COLORS[index % COMP_DONUT_COLORS.length],
  }));
  const remainingRate = Math.max(0, 1 - slices.reduce((sum, comp) => sum + comp.playRate, 0));
  if (remainingRate > 0.001) {
    slices.push({
      name: '其他骨架',
      playRate: remainingRate,
      count: Math.max(totalMatches - slices.reduce((sum, comp) => sum + comp.count, 0), 0),
      color: '#5d6880',
    });
  }

  let current = 0;
  const gradient = slices.map((slice) => {
    const start = (current * 100).toFixed(2);
    current += slice.playRate;
    const end = (current * 100).toFixed(2);
    return `${slice.color} ${start}% ${end}%`;
  }).join(', ');

  return `
    <div class="donut-layout">
      <div class="donut-visual">
        <div class="donut-chart" style="background: conic-gradient(${gradient})">
          <div class="donut-hole">
            <strong>${compStats.length}</strong>
            <span>个骨架</span>
          </div>
        </div>
      </div>
      <div class="donut-legend">
        ${slices.map((slice) => `
          <div class="donut-legend-row">
            <span class="legend-swatch" style="background:${slice.color}"></span>
            <div class="donut-legend-copy">
              <strong>${escapeHtml(slice.name)}</strong>
              <span>${slice.count} 场 · ${formatPercent(slice.playRate)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function buildCompBubbleChart(compStats) {
  if (!compStats.length) {
    return '<div class="empty-state">暂无足够阵容数据</div>';
  }

  const width = 920;
  const height = 330;
  const padding = { top: 22, right: 20, bottom: 42, left: 54 };
  const minPlacement = Math.max(1.8, Math.min(...compStats.map((comp) => comp.avgPlacement)) - 0.35);
  const maxPlacement = Math.min(6.8, Math.max(...compStats.map((comp) => comp.avgPlacement)) + 0.45);
  const placementSpan = Math.max(maxPlacement - minPlacement, 1.2);
  const maxCount = Math.max(...compStats.map((comp) => comp.count), 1);
  const avgPlacementLine = average(compStats.map((comp) => comp.avgPlacement));
  const avgTop4Line = average(compStats.map((comp) => comp.top4Rate)) * 100;

  const xFor = (value) => padding.left + ((maxPlacement - value) / placementSpan) * (width - padding.left - padding.right);
  const yFor = (value) => padding.top + ((100 - value) / 100) * (height - padding.top - padding.bottom);
  const rFor = (count) => 10 + (count / maxCount) * 20;

  const gridY = [0, 25, 50, 75, 100].map((tick) => {
    const y = yFor(tick);
    return `
      <line class="scatter-grid" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line>
      <text class="scatter-axis-text" x="12" y="${y + 4}">${tick}</text>
    `;
  }).join('');

  const gridXValues = Array.from({ length: 6 }, (_, index) => Number((maxPlacement - (placementSpan / 5) * index).toFixed(1)));
  const gridX = gridXValues.map((tick) => {
    const x = xFor(tick);
    return `
      <line class="scatter-grid" x1="${x}" y1="${padding.top}" x2="${x}" y2="${height - padding.bottom}"></line>
      <text class="scatter-axis-text" x="${x}" y="${height - 10}" text-anchor="middle">${tick.toFixed(1)}</text>
    `;
  }).join('');

  const guideLines = `
    <line class="scatter-guide" x1="${xFor(avgPlacementLine)}" y1="${padding.top}" x2="${xFor(avgPlacementLine)}" y2="${height - padding.bottom}"></line>
    <line class="scatter-guide" x1="${padding.left}" y1="${yFor(avgTop4Line)}" x2="${width - padding.right}" y2="${yFor(avgTop4Line)}"></line>
  `;

  const labels = compStats.slice(0, 6).map((comp) => `
    <text class="scatter-point-label" x="${xFor(comp.avgPlacement)}" y="${yFor(comp.top4Rate * 100) - rFor(comp.count) - 8}" text-anchor="middle">${escapeHtml(comp.name)}</text>
  `).join('');

  const points = compStats.map((comp) => `
    <g>
      <circle cx="${xFor(comp.avgPlacement)}" cy="${yFor(comp.top4Rate * 100)}" r="${rFor(comp.count)}" fill="${comp.tierColor}" fill-opacity="0.78" stroke="rgba(255,255,255,0.22)" stroke-width="1.5">
        <title>${comp.name} · ${comp.count} 场 · 均名 ${comp.avgPlacement.toFixed(2)} · 前四率 ${formatPercent(comp.top4Rate)} · 吃鸡率 ${formatPercent(comp.winRate)}</title>
      </circle>
      <text class="scatter-point-count" x="${xFor(comp.avgPlacement)}" y="${yFor(comp.top4Rate * 100) + 4}" text-anchor="middle">${comp.count}</text>
    </g>
  `).join('');

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="comp-bubble-chart">
      ${gridY}
      ${gridX}
      ${guideLines}
      ${points}
      ${labels}
      <text class="scatter-axis-label" x="${width / 2}" y="${height - 2}" text-anchor="middle">平均名次（越往右越好）</text>
      <text class="scatter-axis-label" x="16" y="${height / 2}" transform="rotate(-90 16 ${height / 2})" text-anchor="middle">前四率 (%)</text>
    </svg>
  `;
}

function renderCompInsights(analysis) {
  const compRows = analysis.compStats.slice(0, 10);
  if (!compRows.length) {
    dom.compTable.innerHTML = '<div class="empty-state">暂无足够阵容数据</div>';
    dom.compDonut.innerHTML = '<div class="empty-state">暂无足够阵容数据</div>';
    dom.compBubble.innerHTML = '<div class="empty-state">暂无足够阵容数据</div>';
    return;
  }

  dom.compTable.innerHTML = `
    <table class="comp-table">
      <thead>
        <tr>
          <th>阵容</th>
          <th>评级</th>
          <th>场次</th>
          <th>出场率</th>
          <th>均名</th>
          <th>前四率</th>
          <th>吃鸡率</th>
          <th>第八率</th>
        </tr>
      </thead>
      <tbody>
        ${compRows.map((comp) => `
          <tr>
            <td>
              <div class="comp-table-name">${escapeHtml(comp.name)}</div>
              <div class="comp-table-sub">${escapeHtml((comp.keyUnits || []).join(' + ') || '核心单位待补充')}</div>
            </td>
            <td><span class="comp-tier-chip tier-${comp.tier.toLowerCase()}">${comp.tier}</span></td>
            <td>${comp.count}</td>
            <td>${formatPercent(comp.playRate)}</td>
            <td class="numeric good">${comp.avgPlacement.toFixed(2)}</td>
            <td class="numeric">${formatPercent(comp.top4Rate)}</td>
            <td class="numeric warn">${formatPercent(comp.winRate)}</td>
            <td class="numeric muted-cell">${formatPercent(comp.eighthRate)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  dom.compDonut.innerHTML = buildCompDonut(compRows, analysis.matches.length);
  dom.compBubble.innerHTML = buildCompBubbleChart(compRows);
}
function renderProfile(bundle, analysis, source) {
  const rank = bundle.player.rank;
  const totalGames = (rank?.wins || 0) + (rank?.losses || 0);
  const rankWinRate = totalGames ? formatPercent((rank.wins || 0) / totalGames) : "--";
  dom.profileCard.innerHTML = `
    <div class="profile-header">
      <div class="avatar-orb">${escapeHtml((bundle.player.gameName || "?").slice(0, 1).toUpperCase())}</div>
      <div>
        <h2 class="profile-name">${escapeHtml(bundle.player.gameName || "Unknown")}<span class="profile-tag">#${escapeHtml(bundle.player.tagLine || "----")}</span></h2>
        <p class="subhead">${escapeHtml(bundle.player.region?.label || "未知服务器")}</p>
      </div>
    </div>
    <div class="profile-rank">${source === "live" ? "实时 Riot 数据" : "演示数据回退"}</div>
    <div class="metric-card">
      <div class="metric-label">当前段位</div>
      <div class="metric-value">${escapeHtml(toDisplayRank(rank))}</div>
      <div class="metric-sub">${rank ? `总场次 ${totalGames} · 排位胜率 ${rankWinRate}` : "未拿到段位数据"}</div>
    </div>
    <div class="profile-stats">
      <div class="metric-card">
        <div class="metric-label">平均名次</div>
        <div class="metric-value">${analysis.avgPlacement.toFixed(2)}</div>
        <div class="metric-sub">近 30 场</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">前四率</div>
        <div class="metric-value positive">${formatPercent(analysis.top4Rate)}</div>
        <div class="metric-sub">稳定吃分能力</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">吃鸡率</div>
        <div class="metric-value warn">${formatPercent(analysis.winRate)}</div>
        <div class="metric-sub">强势对局转化</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">波动指数</div>
        <div class="metric-value ${analysis.placementStd <= 1.7 ? "positive" : "warn"}">${analysis.placementStd.toFixed(2)}</div>
        <div class="metric-sub">标准差越低越稳</div>
      </div>
    </div>
  `;
}

function renderSummary(analysis) {
  const cards = [
    {
      label: "最近 10 场",
      value: analysis.recent10Avg.toFixed(2),
      tone: analysis.recent10Avg <= analysis.prev20Avg ? "good" : "bad",
      sub: analysis.recent10Avg <= analysis.prev20Avg ? "状态回暖" : "需要止损",
    },
    {
      label: "前 20 场",
      value: analysis.prev20Avg.toFixed(2),
      tone: "warn",
      sub: "基准阶段",
    },
    {
      label: "骨架集中度",
      value: `${Math.round((analysis.compStats[0]?.count || 0) / Math.max(analysis.matches.length, 1) * 100)}%`,
      tone: (analysis.compStats[0]?.count || 0) / Math.max(analysis.matches.length, 1) > 0.35 ? "bad" : "good",
      sub: `${analysis.compStats[0]?.name || "暂无"}`,
    },
    {
      label: "环境对照",
      value: analysis.metaAvailable ? `${analysis.metaAlignmentScore}` : "--",
      tone: analysis.metaAvailable ? (analysis.metaAlignmentScore >= 60 ? "good" : "warn") : "warn",
      sub: analysis.metaCardSub,
    },
  ];

  dom.summaryStrip.innerHTML = cards.map((card) => `
    <article class="summary-card">
      <div class="summary-label">${escapeHtml(card.label)}</div>
      <div class="summary-value ${card.tone}">${escapeHtml(card.value)}</div>
      <div class="metric-sub">${escapeHtml(card.sub)}</div>
    </article>
  `).join("");
}

function renderCharts(analysis) {
  const placementSeries = analysis.matches.map((match) => ({ label: formatDate(match.playedAt), value: match.placement }));
  dom.placementChart.innerHTML = buildLineChart(placementSeries, {
    min: 1,
    max: 8,
    color: "#f4c96c",
    className: "line-primary",
  });
  dom.placementTrendLabel.textContent = analysis.trendDelta >= 0 ? "近 10 场优于前 20 场" : "近 10 场低于前 20 场";

  dom.lpChart.innerHTML = buildLineChart(analysis.lpTrendSeries, {
    color: "#56d2ff",
    className: "line-secondary",
    area: true,
  });
  dom.lpTrendLabel.textContent = analysis.lpLabel;

  const maxDist = Math.max(...analysis.distribution.map((item) => item.count), 1);
  dom.distributionChart.innerHTML = analysis.distribution.map((item) => {
    const height = Math.max(12, (item.count / maxDist) * 180);
    return `
      <div class="dist-bar-wrap">
        <span class="dist-count">${item.count}</span>
        <div class="dist-bar ${item.placement <= 4 ? "" : "alt"}" style="height:${height}px"></div>
        <div class="dist-label">${item.placement} 名</div>
      </div>
    `;
  }).join("");
}

function renderComps(analysis) {
  dom.compCards.innerHTML = analysis.compStats.slice(0, 4).map((comp, index) => `
    <article class="comp-card">
      <div class="comp-title">
        <div>
          <h3>${escapeHtml(comp.name)}</h3>
          <div class="metric-sub">高频第 ${index + 1} 骨架</div>
        </div>
        <span class="tier-badge">${comp.count} 场</span>
      </div>
      <div class="comp-stats">
        <div class="comp-stat">
          <div class="summary-label">平均名次</div>
          <span class="comp-stat-value">${comp.avgPlacement.toFixed(2)}</span>
        </div>
        <div class="comp-stat">
          <div class="summary-label">前四率</div>
          <span class="comp-stat-value positive">${formatPercent(comp.top4Rate)}</span>
        </div>
        <div class="comp-stat">
          <div class="summary-label">吃鸡率</div>
          <span class="comp-stat-value warn">${formatPercent(comp.winRate)}</span>
        </div>
        <div class="comp-stat">
          <div class="summary-label">使用次数</div>
          <span class="comp-stat-value">${comp.count}</span>
        </div>
      </div>
      <div class="comp-traits">
        ${comp.traits.map((trait) => `<span class="trait-chip">${escapeHtml(trait)}</span>`).join("")}
      </div>
    </article>
  `).join("");

  const maxUnitCount = Math.max(...analysis.topUnits.map((unit) => unit.count), 1);
  dom.unitBars.innerHTML = analysis.topUnits.map((unit) => `
    <div class="unit-row">
      <strong>${escapeHtml(unit.name)}</strong>
      <div class="unit-bar-track"><div class="unit-bar-fill" style="width:${(unit.count / maxUnitCount) * 100}%"></div></div>
      <span>${unit.count}</span>
    </div>
  `).join("");

  if (!analysis.heatmapUnits.length) {
    dom.synergyHeatmap.innerHTML = '<div class="empty-state">暂无可展示的高频单位协同数据</div>';
    return;
  }

  const head = `
    <div class="heatmap-row">
      <div class="heatmap-head"></div>
      ${analysis.heatmapUnits.map((unit) => `<div class="heatmap-head">${escapeHtml(unit)}</div>`).join("")}
    </div>
  `;
  const rows = analysis.heatmapUnits.map((rowUnit, rowIndex) => `
    <div class="heatmap-row">
      <div class="heatmap-head">${escapeHtml(rowUnit)}</div>
      ${analysis.synergyMatrix[rowIndex].map((value) => {
        const bg = `rgba(${255 - value}, ${90 + Math.round(value * 0.8)}, ${255 - Math.round(value * 0.5)}, ${0.16 + value / 180})`;
        return `<div class="heatmap-cell" style="background:${bg}">${value}%</div>`;
      }).join("")}
    </div>
  `).join("");

  dom.synergyHeatmap.innerHTML = `<div class="heatmap-grid">${head}${rows}</div>`;
}

function renderStyle(bundle, analysis) {
  dom.styleTags.innerHTML = analysis.styleTags.map((tag) => `<div class="style-tag">${escapeHtml(tag)}</div>`).join("");
  dom.styleMetrics.innerHTML = analysis.styleMetrics.map((metric) => `
    <article class="style-metric">
      <div class="mini-title-row">
        <h3>${escapeHtml(metric.label)}</h3>
        <span>${metric.value}/100</span>
      </div>
      <div class="meter-track"><div class="meter-fill" style="width:${metric.value}%"></div></div>
      <p class="style-copy">${escapeHtml(metric.copy)}</p>
    </article>
  `).join("");

  dom.metaAlignmentLabel.textContent = analysis.metaAvailable ? `${analysis.metaAlignmentScore}/100` : "未接入";
  dom.confidenceBadge.textContent = bundle.unavailableFields?.length ? `Riot 原始缺失 · ${bundle.unavailableFields.join(" / ")}` : "全部来自 Riot 数据";

  if (analysis.metaAvailable) {
    dom.metaPanel.innerHTML = `
      <div class="meta-score"><strong>${analysis.metaAlignmentScore}</strong><span>环境对照分</span></div>
      <div class="style-copy">${escapeHtml(analysis.metaExplanation)}</div>
      <ul class="meta-list">
        ${analysis.metaMatches.map((entry) => `
          <li class="meta-row">
            <div class="meta-copy">
              <h4>${escapeHtml(entry.comp)}</h4>
              <p>${escapeHtml(entry.matched
                ? `匹配 ${entry.matched.name} · 相似度 ${entry.matchScore}/100${entry.matched.pickRate != null ? ` · Pick ${entry.matched.pickRate}%` : ""}${entry.matched.winRate != null ? ` · Win ${entry.matched.winRate}%` : ""}`
                : `未命中稳定热门骨架 · 当前相似度 ${entry.matchScore}/100`)} </p>
            </div>
            <span class="meta-badge">${entry.count} 场</span>
          </li>
        `).join("")}
      </ul>
    `;
  } else {
    dom.metaPanel.innerHTML = `
      <div class="meta-score"><strong>--</strong><span>环境基准未接入</span></div>
      <div class="style-copy">${escapeHtml(analysis.metaExplanation)}</div>
      <ul class="meta-list">
        <li class="meta-row">
          <div class="meta-copy">
            <h4>当前状态</h4>
            <p>已关闭跨玩家热门阵容判断，当前只基于你自己的近 30 场做个人复盘。</p>
          </div>
          <span class="meta-badge">仅个人数据</span>
        </li>
      </ul>
    `;
  }

  dom.recommendations.innerHTML = analysis.recommendations.map((item, index) => `
    <li class="recommendation-item">
      <div class="recommendation-index">${index + 1}</div>
      <div>${escapeHtml(item)}</div>
    </li>
  `).join("");
}

function renderMatches(analysis) {
  const renderedMatches = analysis.matches.slice().reverse();
  dom.matchesMeta.textContent = `显示近 ${analysis.matches.length} 场`;
  dom.matchList.innerHTML = renderedMatches.map((match) => {
    const placementClass = match.placement <= 2 ? "good" : match.placement <= 4 ? "" : "bad";
    const compName = inferBoardSummary(match);
    const units = (match.units || []).slice(0, 6).map((unit) => unit.name).join("、");
    const traits = summarizeTraits(match).join("、");
    const augments = (match.augments || []).slice(0, 3).join("、") || "暂无海克斯信息";
    const insight = match.placement <= 2
      ? "这局成功把前期优势转成了高上限终盘。"
      : match.placement <= 4
      ? "中段稳血尚可，但仍有进一步冲前二的空间。"
      : "中期强度或转型节奏偏慢，导致后期容错不足。";

    return `
      <article class="match-card" data-match-card data-match-id="${escapeHtml(match.matchId)}">
        <div class="match-top">
          <div class="match-summary">
            <span class="match-placement ${placementClass}">${match.placement} 名</span>
            <div>
              <div class="match-comp">${escapeHtml(compName)}</div>
              <div class="match-line">${escapeHtml(formatDate(match.playedAt))} · 等级 ${match.level} · 淘汰 ${match.playersEliminated || 0} 人</div>
            </div>
          </div>
          <div class="match-stats">
            <div class="metric-sub">${typeof match.lpChange === "number" ? `${match.lpChange > 0 ? "+" : ""}${match.lpChange} LP` : "Riot 官方无单局 LP"}</div>
            <div class="match-actions">
              <button class="match-replay-button" type="button">查看录像</button>
              <button class="match-detail-toggle" type="button">展开详情</button>
            </div>
          </div>
        </div>
        <p class="match-note">${escapeHtml(insight)}</p>
        <div class="match-detail">
          <div class="match-detail-grid">
            <div class="detail-box">
              <h4>对局摘要</h4>
              <ul>
                <li>${escapeHtml(units || "暂无单位数据")}</li>
                <li>${escapeHtml(traits || "暂无羁绊数据")}</li>
              </ul>
            </div>
            <div class="detail-box">
              <h4>关键增强</h4>
              <ul>
                <li>${escapeHtml(augments)}</li>
                <li>${match.goldLeft == null ? "经济曲线：暂不可得" : `结束剩余金币 ${match.goldLeft}`}</li>
              </ul>
            </div>
            <div class="detail-box">
              <h4>复盘结论</h4>
              <ul>
                <li>${escapeHtml(match.placement <= 4 ? "命中自己的舒适节奏，稳血表现合格。" : "需要更早判断是否继续冲本命阵容。")}</li>
                <li>${escapeHtml(match.level >= 8 ? "终盘等级达标，说明经济线还可以。" : "终盘等级偏低，后期上限受到影响。")}</li>
              </ul>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");

  dom.matchList.querySelectorAll("[data-match-card]").forEach((card) => {
    const button = card.querySelector(".match-detail-toggle");
    const replayButton = card.querySelector(".match-replay-button");
    const match = renderedMatches.find((item) => item.matchId === card.dataset.matchId);

    button.addEventListener("click", () => {
      card.classList.toggle("expanded");
      button.textContent = card.classList.contains("expanded") ? "收起详情" : "展开详情";
    });

    replayButton.addEventListener("click", () => {
      if (match) {
        openReplayTodo(match);
      }
    });
  });
}

function render(bundle, source) {
  state.bundle = bundle;
  state.source = source;
  const analysis = analyzeBundle(bundle, source);
  renderProfile(bundle, analysis, source);
  renderSummary(analysis);
  renderCharts(analysis);
  renderComps(analysis);
  renderCompInsights(analysis);
  renderStyle(bundle, analysis);
  renderMatches(analysis);
}

function setLoading(loading) {
  dom.analyzeButton.disabled = loading;
  dom.refreshButton.disabled = loading;
  dom.analyzeButton.textContent = loading ? "分析中..." : "分析近 30 场";
  dom.refreshButton.textContent = loading ? "同步中..." : "重新分析";
}

function toFriendlyRiotError(message, region, gameName, tagLine, status) {
  const rawMessage = String(message || "");

  try {
    const parsed = JSON.parse(rawMessage);
    const errorCode = parsed?.errorCode || parsed?.status?.errorCode;
    const statusCode = status || parsed?.status?.status_code;
    const detail = parsed?.status?.message || parsed?.message || rawMessage;

    if (errorCode === "NOT_FOUND" || statusCode === 404) {
      return `未找到召唤师：请检查 ${region} 区服下的昵称 ${gameName}#${tagLine} 是否正确。`;
    }
    if (errorCode === "FORBIDDEN" || statusCode === 403) {
      return "Riot API key 无效或已过期，请更新 `.env.local` 中的 RIOT_API_KEY。";
    }
    if (errorCode === "RATE_LIMIT_EXCEEDED" || statusCode === 429 || String(detail).toLowerCase().includes("rate limit")) {
      return "Riot API 触发限流，请等待 1 到 2 分钟后重试。当前页面会保留上一次成功的数据。";
    }
  } catch (error) {
    // Keep the original message when it is not JSON.
  }

  if (rawMessage.includes("Missing RIOT_API_KEY")) {
    return "未检测到 RIOT_API_KEY，请检查项目根目录下的 `.env.local`。";
  }
  if (rawMessage.toLowerCase().includes("rate limit")) {
    return "Riot API 触发限流，请等待 1 到 2 分钟后重试。当前页面会保留上一次成功的数据。";
  }

  return `Riot API 请求失败：${rawMessage}`;
}
async function loadLiveData() {
  const region = dom.regionSelect.value;
  const gameName = dom.gameNameInput.value.trim();
  const tagLine = dom.tagLineInput.value.trim();
  if (!gameName || !tagLine) {
    dom.queryHint.textContent = "请输入完整的游戏昵称和 Tag。";
    return;
  }

  setLoading(true);
  dom.authStatus.textContent = "正在读取 Riot API...";
  dom.queryHint.textContent = "正在拉取近 30 场并重新聚合图表...";

  try {
    const response = await fetch(`/api/tft/analyze?region=${encodeURIComponent(region)}&gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}&count=30`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "未知错误" }));
      throw new Error(toFriendlyRiotError(error.message || "Riot API 请求失败", region, gameName, tagLine, response.status));
    }
    const bundle = await response.json();
    render(bundle, "live");
    dom.authStatus.textContent = "Riot 实时数据已加载";
    dom.queryHint.textContent = `已完成 ${bundle.matches.length} 场对局分析。若部分字段未提供，会自动降级展示。`;
  } catch (error) {
    const keepCurrentData = state.bundle?.matches?.length;
    if (!keepCurrentData) {
      render(createDemoBundle(), "demo");
    }
    dom.authStatus.textContent = state.source === "live" ? "同步失败，已保留上次成功结果" : "API 失败，当前显示演示数据";
    dom.queryHint.textContent = keepCurrentData
      ? error.message
      : `${error.message} 当前显示本地演示数据，便于继续完善 UI 与分析逻辑。`;
  } finally {
    setLoading(false);
  }
}

dom.analyzeButton.addEventListener("click", loadLiveData);
dom.refreshButton.addEventListener("click", loadLiveData);
dom.replayCloseButton.addEventListener("click", closeReplayTodo);
dom.replayBackdrop.addEventListener("click", closeReplayTodo);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !dom.replayModal.hidden) {
    closeReplayTodo();
  }
});

render(state.bundle, state.source);
dom.authStatus.textContent = "等待查询";
dom.queryHint.textContent = "输入 Riot ID 后点击“分析近 30 场”开始拉取真实数据；当前先展示本地演示数据。";














