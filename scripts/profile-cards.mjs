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

function glance(user) {
  const cal = user.contributionsCollection.contributionCalendar;
  const days = cal.weeks.flatMap((w) => w.contributionDays);
  const active = days.filter((d) => d.contributionCount > 0).length;
  let longest = 0, run = 0;
  for (const d of days) { run = d.contributionCount > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
  const busiest = days.reduce((a, b) => (b.contributionCount > a.contributionCount ? b : a), days[0] || { date: "", contributionCount: 0 });
  const busiestLabel = busiest.date ? new Date(busiest.date + "T00:00:00Z").toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : "—";
  const cc = user.contributionsCollection;
  const nums = [
    [fmt(cal.totalContributions), "contributions", "last 12 months"],
    [fmt(active), "active days", "at least one commit"],
    [`${longest}d`, "longest streak", "consecutive days"],
    [fmt(busiest.contributionCount), "busiest day", busiestLabel],
    [fmt(cc.totalCommitContributions), "commits", "last 12 months"],
    [fmt(cc.totalPullRequestContributions), "pull requests", "last 12 months"],
  ];
  const W = 1200, H = 300;
  let cells = "";
  nums.forEach(([big, label, sub], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 52 + col * 210, y = 92 + row * 100;
    cells += `<circle cx="${x + 3}" cy="${y - 40}" r="3" fill="${C.gold}"/>
<text x="${x}" y="${y - 16}" font-family="${MONO}" font-size="11" letter-spacing="3" fill="${C.gold}">${esc(label.toUpperCase())}</text>
<text x="${x}" y="${y + 20}" font-family="${SERIF}" font-size="34" fill="${C.ivory}">${esc(big)}</text>
<text x="${x}" y="${y + 40}" font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="12" fill="#B8AA8F">${esc(sub)}</text>`;
  });
  const totals = {};
  for (const r of user.repositories.nodes) for (const e of r.languages.edges) totals[e.node.name] = (totals[e.node.name] || 0) + e.size;
  const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const pal = [C.pale, C.gold, "#B88F45", C.accent, "#6B5224"];
  const bx = 720, bw = 430;
  let x = bx, bar = "";
  top.forEach(([, size], i) => { const w = Math.max(2, (size / sum) * bw); bar += `<rect x="${x.toFixed(1)}" y="96" width="${w.toFixed(1)}" height="8" fill="${pal[i]}"/>`; x += w; });
  const list = top.map(([name, size], i) => {
    const y = 140 + i * 28;
    return `<circle cx="${bx + 5}" cy="${y - 4}" r="4.5" fill="${pal[i]}"/>
<text x="${bx + 20}" y="${y}" font-family="${SERIF}" font-size="17" fill="${C.ivory}">${esc(name)}</text>
<text x="${bx + bw}" y="${y}" text-anchor="end" font-family="${MONO}" font-size="12" fill="${C.gold}">${((size / sum) * 100).toFixed(1)}%</text>`;
  }).join("");
  const body = `<defs><radialGradient id="gl-glow" cx="0.15" cy="0" r="0.9"><stop offset="0" stop-color="${C.accent}" stop-opacity="0.35"/><stop offset="1" stop-color="${C.deep}" stop-opacity="0"/></radialGradient>
<clipPath id="gl-bar"><rect x="${bx}" y="96" width="${bw}" height="8" rx="4"/></clipPath></defs>
<rect width="${W}" height="${H}" rx="14" fill="url(#gl-glow)"/>
<rect x="28" y="0" width="160" height="1.5" fill="${C.pale}" opacity="0.75"/>
<text x="52" y="44" font-family="${MONO}" font-size="11" letter-spacing="3" fill="#B8AA8F">GITHUB AT A GLANCE · PUBLIC ACTIVITY</text>
${cells}
<line x1="690" y1="40" x2="690" y2="${H - 40}" stroke="${C.deep}"/>
<text x="${bx}" y="74" font-family="${MONO}" font-size="11" letter-spacing="3" fill="${C.gold}">TOP LANGUAGES · BY CODE SIZE</text>
<g clip-path="url(#gl-bar)">${bar}</g>${list}
<text x="${W - 40}" y="${H - 18}" text-anchor="end" font-family="${MONO}" font-size="10" letter-spacing="2" fill="#B8AA8F">LIVE DATA · RE-RENDERED DAILY</text>`;
  return frame(W, H, body, `GitHub at a glance: ${cal.totalContributions} contributions, ${active} active days, longest streak ${longest} days.`);
}

const user = await fetchData();
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/heatmap.svg`, heatmap(user));
writeFileSync(`${OUT}/stats.svg`, stats(user));
writeFileSync(`${OUT}/languages.svg`, languages(user));
writeFileSync(`${OUT}/glance.svg`, glance(user));
console.log("Profile cards written to", OUT);
