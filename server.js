const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 4173;
const ROOT = __dirname;
const META_CACHE_TTL_MS = 30 * 60 * 1000;

loadEnvFile(path.join(ROOT, ".env.local"));
loadEnvFile(path.join(ROOT, ".env"));

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const metaBenchmarkCache = {
  value: null,
  fetchedAt: 0,
};

const REGION_MAP = {
  KR: { platform: "kr", routing: "asia", label: "韩服 KR" },
  JP1: { platform: "jp1", routing: "asia", label: "日服 JP1" },
  NA1: { platform: "na1", routing: "americas", label: "美服 NA1" },
  EUW1: { platform: "euw1", routing: "europe", label: "欧服 EUW1" },
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function loadEnvFile(filepath) {
  if (!fs.existsSync(filepath)) {
    return;
  }

  const content = fs.readFileSync(filepath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      return;
    }
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = rest.join("=").trim();
    }
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filepath) {
  const ext = path.extname(filepath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  fs.readFile(filepath, (error, content) => {
    if (error) {
      sendJson(res, 404, { error: "FILE_NOT_FOUND" });
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
}

function titleize(value) {
  return String(value || "")
    .replace(/^TFT\d+_/, "")
    .replace(/^TFT_/, "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function stripTags(value) {
  return decodeHtml(String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function normalizeTrait(trait) {
  return {
    name: titleize(trait.name),
    apiName: trait.name || null,
    tierCurrent: trait.tier_current,
    tierTotal: trait.tier_total,
    numUnits: trait.num_units,
    style: trait.style,
  };
}

function normalizeUnit(unit) {
  return {
    name: titleize(unit.character_id),
    apiName: unit.character_id || null,
    tier: unit.tier,
    rarity: unit.rarity,
    itemIds: Array.isArray(unit.itemNames) ? unit.itemNames.slice() : [],
    items: Array.isArray(unit.itemNames) ? unit.itemNames.map(titleize) : [],
  };
}

function normalizeMatch(match, puuid) {
  const participant = match.info.participants.find((entry) => entry.puuid === puuid);
  if (!participant) {
    return null;
  }

  return {
    matchId: match.metadata.match_id,
    queueType: match.info.queue_id,
    playedAt: new Date(match.info.game_datetime).toISOString(),
    placement: participant.placement,
    lpChange: null,
    level: participant.level,
    lastRound: participant.last_round,
    playersEliminated: participant.players_eliminated,
    totalDamageToPlayers: participant.total_damage_to_players,
    goldLeft: participant.gold_left ?? null,
    augments: (participant.augments || []).map(titleize),
    traits: (participant.traits || []).map(normalizeTrait),
    units: (participant.units || []).map(normalizeUnit),
    goldTrend: null,
    levelUpTimeline: null,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url, headers = {}, attempt = 0) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TFTGuider/0.1 (+https://local-app)",
      ...headers,
    },
  });

  if (!response.ok) {
    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      const retryAfter = Number(response.headers.get("Retry-After") || 1);
      await sleep(Math.max(retryAfter, 1) * 1000);
      return fetchText(url, headers, attempt + 1);
    }

    const detail = await response.text();
    const error = new Error(detail || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.text();
}

async function fetchJson(url, headers = {}, attempt = 0) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TFTGuider/0.1 (+https://local-app)",
      ...headers,
    },
  });

  if (!response.ok) {
    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      const retryAfter = Number(response.headers.get("Retry-After") || 1);
      await sleep(Math.max(retryAfter, 1) * 1000);
      return fetchJson(url, headers, attempt + 1);
    }

    const detail = await response.text();
    const error = new Error(detail || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function riotRequest(hostType, regionKey, pathname, attempt = 0) {
  if (!RIOT_API_KEY) {
    const error = new Error("Missing RIOT_API_KEY");
    error.status = 500;
    throw error;
  }

  const region = REGION_MAP[regionKey] || REGION_MAP.KR;
  const host = hostType === "platform" ? region.platform : region.routing;
  const base = `https://${host}.api.riotgames.com`;
  const response = await fetch(`${base}${pathname}`, {
    headers: { "X-Riot-Token": RIOT_API_KEY },
  });

  if (!response.ok) {
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("Retry-After") || 1);
      await sleep(Math.max(retryAfter, 1) * 1000);
      return riotRequest(hostType, regionKey, pathname, attempt + 1);
    }

    const detail = await response.text();
    const error = new Error(detail || `Riot API ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function splitMetaNames(value, { removeTraitTier = false } = {}) {
  return unique(
    String(value || "")
      .split(",")
      .map((item) => titleize(item.trim()))
      .map((item) => removeTraitTier ? item.replace(/\s+\d+$/, "").trim() : item)
      .filter(Boolean)
  );
}

function inferMetaCompName(detail) {
  const scoredNames = Array.isArray(detail?.name)
    ? detail.name
        .slice()
        .sort((left, right) => (right.score || 0) - (left.score || 0))
        .map((entry) => titleize(entry.name))
        .filter(Boolean)
    : [];
  const traitNames = splitMetaNames(detail?.traits_string, { removeTraitTier: true });
  const unitNames = splitMetaNames(detail?.units_string);

  return unique(scoredNames).slice(0, 2).join(" / ")
    || traitNames.slice(0, 2).join(" / ")
    || unitNames.slice(0, 2).join(" + ")
    || "Meta Comp";
}

function computeMetaStrengthScore({ avgPlacement, top4Rate, firstPlaceRate, count }) {
  const sampleConfidence = Math.min(count / 25000, 1) * 5;
  return clamp(
    Math.round(top4Rate * 70 + firstPlaceRate * 120 + ((8 - avgPlacement) / 7) * 25 + sampleConfidence),
    1,
    100
  );
}

function buildMetaTftBenchmark(statsPayload, compsPayload, patchPayload) {
  const statsResults = Array.isArray(statsPayload?.results) ? statsPayload.results : [];
  const clusterDetails = compsPayload?.results?.data?.cluster_details || {};
  const totalAnalyzed = Number(
    statsResults.find((entry) => !entry.cluster)?.places?.[0]
    || statsResults[0]?.places?.[0]
    || 0
  );
  const setMatch = String(compsPayload?.results?.data?.tft_set || "").match(/(\d+)/);
  const setLabel = setMatch ? `Set ${setMatch[1]} · Patch ${patchPayload?.patch || "current"}` : `Patch ${patchPayload?.patch || "current"}`;

  const comps = statsResults
    .filter((entry) => entry?.cluster && Array.isArray(entry.places) && entry.places.length >= 8 && clusterDetails[entry.cluster])
    .map((entry) => {
      const detail = clusterDetails[entry.cluster];
      const placeCounts = entry.places.slice(0, 8).map((value) => Number(value) || 0);
      const count = Number(entry.count) || placeCounts.reduce((sum, value) => sum + value, 0);
      if (!count) {
        return null;
      }

      const firstPlaceRate = (placeCounts[0] || 0) / count;
      const top4Rate = placeCounts.slice(0, 4).reduce((sum, value) => sum + value, 0) / count;
      const avgPlacement = placeCounts.reduce((sum, value, index) => sum + value * (index + 1), 0) / count;
      const pickRate = totalAnalyzed ? (count / totalAnalyzed) * 100 : null;
      const strengthScore = computeMetaStrengthScore({ avgPlacement, top4Rate, firstPlaceRate, count });

      return {
        name: inferMetaCompName(detail),
        traits: splitMetaNames(detail?.traits_string, { removeTraitTier: true }).slice(0, 5),
        units: splitMetaNames(detail?.units_string).slice(0, 8),
        avgPlacement: Number(avgPlacement.toFixed(2)),
        top4Rate: Number((top4Rate * 100).toFixed(1)),
        winRate: Number((firstPlaceRate * 100).toFixed(1)),
        firstPlaceRate: Number((firstPlaceRate * 100).toFixed(1)),
        pickRate: pickRate == null ? null : Number(pickRate.toFixed(2)),
        strengthScore,
        sampleSize: count,
        url: "https://www.metatft.com/comps",
      };
    })
    .filter((comp) => comp && comp.sampleSize >= 2500)
    .sort((left, right) =>
      right.strengthScore - left.strengthScore
      || right.top4Rate - left.top4Rate
      || right.firstPlaceRate - left.firstPlaceRate
      || right.sampleSize - left.sampleSize
      || left.avgPlacement - right.avgPlacement
    )
    .slice(0, 12);

  return {
    source: {
      name: "MetaTFT",
      url: "https://www.metatft.com/comps",
      set: setLabel,
      updatedAt: null,
      queueScope: `Ranked · Platinum+ to Challenger · 最近 3 天 · ${totalAnalyzed.toLocaleString("en-US")} 局样本`,
    },
    comps,
  };
}

async function getMetaBenchmark() {
  if (metaBenchmarkCache.value && Date.now() - metaBenchmarkCache.fetchedAt < META_CACHE_TTL_MS) {
    return metaBenchmarkCache.value;
  }

  try {
    const [patchPayload, statsPayload, compsPayload] = await Promise.all([
      fetchJson("https://api-hc.metatft.com/tft-stat-api/patch"),
      fetchJson("https://api-hc.metatft.com/tft-comps-api/comps_stats?queue=1100&patch=current&days=3&rank=CHALLENGER,DIAMOND,EMERALD,GRANDMASTER,MASTER,PLATINUM&permit_filter_adjustment=true"),
      fetchJson("https://api-hc.metatft.com/tft-comps-api/comps_data?queue=1100"),
    ]);
    const benchmark = buildMetaTftBenchmark(statsPayload, compsPayload, patchPayload);
    if (benchmark?.comps?.length) {
      metaBenchmarkCache.value = benchmark;
      metaBenchmarkCache.fetchedAt = Date.now();
      return benchmark;
    }
  } catch (error) {
    if (metaBenchmarkCache.value) {
      return metaBenchmarkCache.value;
    }
  }

  return null;
}

async function getPlayerBundle({ regionKey, gameName, tagLine, count }) {
  const metaBenchmarkPromise = getMetaBenchmark();
  const account = await riotRequest(
    "routing",
    regionKey,
    `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  );
  const summoner = await riotRequest("platform", regionKey, `/tft/summoner/v1/summoners/by-puuid/${account.puuid}`);
  const leagueEntries = await riotRequest("platform", regionKey, `/tft/league/v1/by-puuid/${account.puuid}`);
  const ranked = Array.isArray(leagueEntries)
    ? leagueEntries.find((entry) => entry.queueType === "RANKED_TFT") || leagueEntries[0] || null
    : null;
  const matchIds = await riotRequest(
    "routing",
    regionKey,
    `/tft/match/v1/matches/by-puuid/${account.puuid}/ids?start=0&count=${count}`
  );

  const matchesRaw = await mapWithConcurrency(
    matchIds,
    4,
    (matchId) => riotRequest("routing", regionKey, `/tft/match/v1/matches/${matchId}`)
  );
  const matches = matchesRaw
    .map((match) => normalizeMatch(match, account.puuid))
    .filter(Boolean)
    .sort((left, right) => new Date(left.playedAt) - new Date(right.playedAt));
  const metaBenchmark = await metaBenchmarkPromise;

  return {
    player: {
      gameName: account.gameName,
      tagLine: account.tagLine,
      puuid: account.puuid,
      profileIconId: summoner.profileIconId,
      summonerLevel: summoner.summonerLevel,
      region: REGION_MAP[regionKey] || REGION_MAP.KR,
      rank: ranked
        ? {
            tier: ranked.tier,
            rank: ranked.rank,
            leaguePoints: ranked.leaguePoints,
            wins: ranked.wins,
            losses: ranked.losses,
          }
        : null,
    },
    matches,
    metaBenchmark,
    unavailableFields: ["lpChange", "goldTrend", "levelUpTimeline"],
  };
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === "/api/tft/analyze") {
    const regionKey = (requestUrl.searchParams.get("region") || "KR").toUpperCase();
    const gameName = requestUrl.searchParams.get("gameName") || "chencc";
    const tagLine = requestUrl.searchParams.get("tagLine") || "1215";
    const count = Math.min(Math.max(Number(requestUrl.searchParams.get("count") || 30), 1), 30);

    try {
      const payload = await getPlayerBundle({ regionKey, gameName, tagLine, count });
      sendJson(res, 200, payload);
    } catch (error) {
      sendJson(res, error.status || 500, {
        error: "RIOT_FETCH_FAILED",
        message: error.message,
      });
    }
    return;
  }

  const safePath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const filepath = path.join(ROOT, path.normalize(safePath).replace(/^([.][.][/\\])+/, ""));

  if (!filepath.startsWith(ROOT)) {
    sendJson(res, 403, { error: "FORBIDDEN" });
    return;
  }

  fs.stat(filepath, (error, stat) => {
    if (error || !stat.isFile()) {
      sendJson(res, 404, { error: "NOT_FOUND" });
      return;
    }
    sendFile(res, filepath);
  });
});

server.listen(PORT, () => {
  console.log(`TFTGuider running at http://localhost:${PORT}`);
});

