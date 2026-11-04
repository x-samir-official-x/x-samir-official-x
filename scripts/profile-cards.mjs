import { mkdirSync, writeFileSync, readFileSync } from "node:fs";

const LOGIN = process.env.PROFILE_LOGIN || "x-samir-official-x";
const OUT = process.env.OUT_DIR || "dist";

const C = {
  midnight: "#0B0906",
  dark: "#14100A",
  surface: "#1F180D",
  deep: "#3D2E14",
  accent: "#8A6A2B",
  gold: "#D4AF63",
  pale: "#EBD6A3",
  ivory: "#FBF7EE",
};
const LEVELS = [C.surface, C.deep, C.accent, "#B88F45", C.pale];
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const SERIF = "Georgia, 'Times New Roman', serif";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (n) => new Intl.NumberFormat("en-US").format(n);

async function fetchData() {
  if (process.env.MOCK_DATA) return JSON.parse(readFileSync(process.env.MOCK_DATA, "utf8"));
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required");
  const query = `query($login: String!) {
    user(login: $login) {
      followers { totalCount }
      repositories(ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false, first: 100) {
        totalCount
        nodes {
          stargazerCount
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name } } }
        }
      }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
      }
    }
  }`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "profile-cards" },
    body: JSON.stringify({ query, variables: { login: LOGIN } }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors || json));
  return json.data.user;
}

function frame(width, height, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<defs>
  <linearGradient id="pc-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.midnight}"/><stop offset="1" stop-color="${C.dark}"/></linearGradient>
</defs>
<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="14" fill="url(#pc-bg)" stroke="${C.deep}"/>
${body}
</svg>`;
}

function heatmap(user) {
  const cal = user.contributionsCollection.contributionCalendar;
  const weeks = cal.weeks;
  const max = Math.max(1, ...weeks.flatMap((w) => w.contributionDays.map((d) => d.contributionCount)));
  const level = (n) => (n === 0 ? 0 : Math.max(1, Math.min(4, Math.ceil((Math.log(n + 1) / Math.log(max + 1)) * 4))));
  const cell = 13, gap = 3, left = 46, top = 74;
  const width = left + weeks.length * (cell + gap) + 30;
  const lg = width - 64;
  const height = top + 7 * (cell + gap) + 52;
  let cells = "", months = "", lastMonth = -1;
  weeks.forEach((w, wi) => {
    const first = new Date(w.contributionDays[0].date + "T00:00:00Z");
    if (first.getUTCMonth() !== lastMonth && wi < weeks.length - 1) {
      lastMonth = first.getUTCMonth();
      months += `<text x="${left + wi * (cell + gap)}" y="${top - 10}" font-family="${MONO}" font-size="10" fill="${C.gold}" opacity="0.8">${first.toLocaleString("en-US", { month: "short", timeZone: "UTC" })}</text>`;
    }
    w.contributionDays.forEach((d) => {
      const dow = new Date(d.date + "T00:00:00Z").getUTCDay();
      const delay = (wi * 0.025).toFixed(3);
      cells += `<rect class="c" style="animation-delay:${delay}s" x="${left + wi * (cell + gap)}" y="${top + dow * (cell + gap)}" width="${cell}" height="${cell}" rx="3" fill="${LEVELS[level(d.contributionCount)]}"><title>${d.date}: ${d.contributionCount} contributions</title></rect>`;
    });
  });
  const days = ["Mon", "Wed", "Fri"].map((t, i) => `<text x="${left - 34}" y="${top + (1 + i * 2) * (cell + gap) + 10}" font-family="${MONO}" font-size="10" fill="${C.gold}" opacity="0.7">${t}</text>`).join("");
  const legend = LEVELS.map((c, i) => `<rect x="${lg - (5 - i) * (cell + gap)}" y="${height - 32}" width="${cell}" height="${cell}" rx="3" fill="${c}"/>`).join("");
  const body = `<style>.c{animation:pc-in .6s ease-out both}@keyframes pc-in{from{opacity:0}to{opacity:1}}@media (prefers-reduced-motion: reduce){.c{animation:none}}</style>
<text x="${left - 34}" y="38" font-family="${SERIF}" font-size="20" fill="${C.ivory}">${fmt(cal.totalContributions)} contributions in the last year</text>
${months}${days}${cells}
<text x="${left - 34}" y="${height - 21}" font-family="${MONO}" font-size="10" fill="${C.gold}" opacity="0.7">Live data from GitHub · updated daily</text>
<text x="${lg - 5 * (cell + gap) - 34}" y="${height - 21}" font-family="${MONO}" font-size="10" fill="${C.gold}" opacity="0.7">Less</text>${legend}
<text x="${lg + 4}" y="${height - 21}" font-family="${MONO}" font-size="10" fill="${C.gold}" opacity="0.7">More</text>`;
  return frame(width, height, body, `${cal.totalContributions} GitHub contributions in the last year`);
}

function stats(user) {
  const repos = user.repositories;
  const stars = repos.nodes.reduce((s, r) => s + r.stargazerCount, 0);
  const cc = user.contributionsCollection;
  const items = [
    ["Public repositories", repos.totalCount],
    ["Stars earned", stars],
    ["Followers", user.followers.totalCount],
    ["Contributions · last year", cc.contributionCalendar.totalContributions],
    ["Commits · last year", cc.totalCommitContributions],
    ["Pull requests · last year", cc.totalPullRequestContributions],
  ];
  const width = 440, height = 250;
  const rows = items.map(([label, value], i) => {
    const y = 84 + i * 26;
    return `<text x="28" y="${y}" font-family="${MONO}" font-size="13" fill="${C.pale}">${esc(label)}</text>
<text x="${width - 28}" y="${y}" text-anchor="end" font-family="${MONO}" font-size="14" font-weight="700" fill="${C.ivory}">${fmt(value)}</text>
<line x1="28" y1="${y + 9}" x2="${width - 28}" y2="${y + 9}" stroke="${C.deep}" stroke-width="0.8"/>`;
  }).join("");
  const body = `<text x="28" y="44" font-family="${SERIF}" font-size="20" fill="${C.ivory}">GitHub Stats</text>${rows}`;
  return frame(width, height, body, "GitHub statistics");
}

function languages(user) {
  const totals = {};
  for (const r of user.repositories.nodes) for (const e of r.languages.edges) totals[e.node.name] = (totals[e.node.name] || 0) + e.size;
  const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const palette = [C.pale, C.gold, "#B88F45", C.accent, "#6B5224", C.deep];
  const width = 440, height = 250, barX = 28, barW = width - 56;
  let x = barX;
  const bar = top.map(([, size], i) => {
    const w = Math.max(2, (size / sum) * barW);
    const r = `<rect x="${x.toFixed(1)}" y="68" width="${w.toFixed(1)}" height="10" fill="${palette[i]}"/>`;
    x += w;
    return r;
  }).join("");
  const list = top.map(([name, size], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const lx = 28 + col * 200, ly = 118 + row * 34;
    return `<circle cx="${lx + 5}" cy="${ly - 4}" r="5" fill="${palette[i]}"/>
<text x="${lx + 18}" y="${ly}" font-family="${MONO}" font-size="13" fill="${C.ivory}">${esc(name)}</text>
<text x="${lx + 180}" y="${ly}" text-anchor="end" font-family="${MONO}" font-size="12" fill="${C.gold}">${((size / sum) * 100).toFixed(1)}%</text>`;
  }).join("");
  const body = `<text x="28" y="44" font-family="${SERIF}" font-size="20" fill="${C.ivory}">Top Languages</text>
<clipPath id="pc-bar"><rect x="${barX}" y="68" width="${barW}" height="10" rx="5"/></clipPath><g clip-path="url(#pc-bar)">${bar}</g>${list}
<text x="28" y="${height - 18}" font-family="${MONO}" font-size="10" fill="${C.gold}" opacity="0.7">By code size across public repositories</text>`;
  return frame(width, height, body, "Top languages");
}

const user = await fetchData();
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/heatmap.svg`, heatmap(user));
writeFileSync(`${OUT}/stats.svg`, stats(user));
writeFileSync(`${OUT}/languages.svg`, languages(user));
console.log("Profile cards written to", OUT);
