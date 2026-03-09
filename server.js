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

function stripTags(value) {
  return decodeHtml(String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function normalizeTrait(trait) {
  return {
    name: titleize(trait.name),
    tierCurrent: trait.tier_current,
    tierTotal: trait.tier_total,
    numUnits: trait.num_units,
    style: trait.style,
  };
}

function normalizeUnit(unit) {
  return {
    name: titleize(unit.character_id),
    tier: unit.tier,
    rarity: unit.rarity,
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

async function fetchCurrentMetaSet() {
  const homepage = await fetchText("https://metabot.gg/en/TFT");
  const match = homepage.match(/href="\/en\/TFT\/(\d+)\/comps\/8\/pickRate"/i);
  return match?.[1] || "16";
}

function extractCellNumber(cellHtml) {
  const valueMatch = String(cellHtml || "").match(/class="[^"]*value[^"]*"[^>]*>\s*([0-9]+(?:\.[0-9]+)?)%?\s*<\/div>/i);
  if (valueMatch) {
    return Number(valueMatch[1]);
  }

  const fallbackMatch = String(cellHtml || "").match(/>\s*([0-9]+(?:\.[0-9]+)?)%?\s*<\/(?:div|span)>/i);
  return fallbackMatch ? Number(fallbackMatch[1]) : null;
}

function parseMetaBotComps(html, setNumber) {
  const rowMatches = [...html.matchAll(/<tr class="index-module__F48gGq__clickableRow">([\s\S]*?)<\/tr>/g)];
  const rows = rowMatches.map((match) => match[0]);
  const comps = rows.map((rowHtml) => {
    const compUrlMatch = rowHtml.match(/href="(\/en\/TFT\/comp\/[^"]+\/overview)"/i);
    if (!compUrlMatch) {
      return null;
    }

    const cells = [...rowHtml.matchAll(/<td\b[\s\S]*?<\/td>/g)].map((match) => match[0]);
    if (cells.length < 8) {
      return null;
    }

    const primaryCell = cells[0];
    const unitsCell = cells[1];
    const traitsCell = cells[3];
    const avgCell = cells[4];
    const winCell = cells[5];
    const firstCell = cells[6];
    const pickCell = cells[7];

    const primaryTraits = unique(
      [...primaryCell.matchAll(/<img[^>]+alt="([^"]+)"/g)].map((match) => stripTags(match[1]))
    );
    const traits = unique(
      [...traitsCell.matchAll(/<img[^>]+alt="([^"]+)"/g)].map((match) => stripTags(match[1]))
    ).slice(0, 5);
    const units = unique(
      [...unitsCell.matchAll(/<img[^>]+alt="([^"]+)"/g)]
        .map((match) => stripTags(match[1]))
        .filter((name) => name && !/build$/i.test(name))
    ).slice(0, 8);

    const namingTraits = traits.length ? traits : primaryTraits;
    const avgPlacement = extractCellNumber(avgCell);
    const winRate = extractCellNumber(winCell);
    const firstPlaceRate = extractCellNumber(firstCell);
    const pickRate = extractCellNumber(pickCell);
    const name = namingTraits.slice(0, 2).join("/") || units.slice(0, 2).join(" + ") || "Meta Comp";

    return {
      name,
      traits,
      units,
      avgPlacement,
      winRate,
      firstPlaceRate,
      pickRate,
      url: `https://metabot.gg${compUrlMatch[1]}`,
    };
  }).filter(Boolean);

  const lastUpdatedMatch = html.match(/Last Updated:[\s\S]*?<time[^>]*>([^<]+)<\/time>/i);
  return {
    source: {
      name: "MetaBot.GG",
      url: `https://metabot.gg/en/TFT/${setNumber}/comps/8/pickRate`,
      methodologyUrl: "https://metabot.gg/en/data-methodology",
      set: `Set ${setNumber}`,
      updatedAt: lastUpdatedMatch ? stripTags(lastUpdatedMatch[1]) : null,
      queueScope: "8-champion comps · All ranks",
    },
    comps: comps.slice(0, 12),
  };
}

async function getMetaBenchmark() {
  if (metaBenchmarkCache.value && Date.now() - metaBenchmarkCache.fetchedAt < META_CACHE_TTL_MS) {
    return metaBenchmarkCache.value;
  }

  try {
    const setNumber = await fetchCurrentMetaSet();
    const html = await fetchText(`https://metabot.gg/en/TFT/${setNumber}/comps/8/pickRate`);
    const benchmark = parseMetaBotComps(html, setNumber);
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

