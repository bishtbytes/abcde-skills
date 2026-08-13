#!/usr/bin/env node
/**
 * scripts/todo-index.mjs — the todo backlog reader.
 *
 * Scans every `docs/todo/*.md` for its YAML frontmatter (project / status / category /
 * priority / effort / tags / created — see docs/todo/README.md) and prints a
 * view to stdout. It is READ-ONLY: it never writes a file, so it is safe to run
 * concurrently from any number of sessions.
 *
 *   node scripts/todo-index.mjs               → full grouped view (Initiatives +
 *                                                status buckets, sorted by priority)
 *   node scripts/todo-index.mjs --list        → same full grouped view
 *   node scripts/todo-index.mjs --list <f>…   → flat table filtered by <f>
 *
 * The grouped view is what the old committed `INDEX.md` used to hold; it is now
 * generated on demand instead of stored — so there is no derived file to keep in
 * sync and no cross-session write race. It backs the /explore-todos skill and
 * quick CLI lookups. Frontmatter is the single source of truth — this script
 * only ever READS the todos. It never throws on a malformed/frontmatter-less
 * todo: those are surfaced in an "unclassified" bucket so a bad file can't wedge
 * the listing.
 *
 * Filters (repeatable, AND-combined) for --list:
 *   project:<p>  status:<s>  category:<c>  priority:<p>  tag:<t>  kind:<k>
 *   parent:<slug>
 *   e.g.  node scripts/todo-index.mjs --list status:ready tag:short-story
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// Resolve against the repo the skill is invoked FROM (cwd), not the script's own
// bundled location — the indexer ships inside the skill and is run from the
// user's project as `node ${CLAUDE_SKILL_DIR}/scripts/todo-index.mjs`.
const TODO_DIR = path.join(process.cwd(), "docs", "todo");

const STATUS_ORDER = ["ready", "needs-discussion", "blocked"];
const STATUS_LABEL = {
  ready: "Ready to build",
  "needs-discussion": "Needs discussion",
  blocked: "Blocked / waiting",
};
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

/** Minimal frontmatter parser — enough for the six flat/scalar + one list field.
 *  Returns {} when the file has no leading `---` block. */
function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) return {};
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return {};
  const body = raw.slice(3, end).trim();
  const out = {};
  for (const line of body.split("\n")) {
    const m = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      out[key] = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      out[key] = val.replace(/^["']|["']$/g, "");
    }
  }
  return out;
}

function loadTodos() {
  let entries;
  try {
    entries = readdirSync(TODO_DIR);
  } catch (err) {
    // No docs/todo/ in this repo → an empty backlog, not a crash. The renderers
    // print the plain "empty or missing" message (per SKILL.md).
    if (err.code === "ENOENT") return [];
    throw err;
  }
  const files = entries
    .filter((f) => f.endsWith(".md") && f !== "INDEX.md" && f !== "README.md")
    .sort();
  return files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = readFileSync(path.join(TODO_DIR, file), "utf8");
    const fm = parseFrontmatter(raw);
    // Title = first `# ` heading, falling back to the slug.
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    return {
      slug,
      file,
      title: titleMatch ? titleMatch[1].trim() : slug,
      project: fm.project || null,
      status: fm.status || null,
      category: fm.category || null,
      priority: fm.priority || null,
      effort: fm.effort || null,
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      created: fm.created || null,
      kind: fm.kind === "index" ? "index" : "task", // index todos group children
      parent: fm.parent || null, // child → its index todo's slug
    };
  });
}

function sortItems(a, b) {
  const pa = PRIORITY_RANK[a.priority] ?? 9;
  const pb = PRIORITY_RANK[b.priority] ?? 9;
  if (pa !== pb) return pa - pb;
  return (b.created || "").localeCompare(a.created || ""); // newest first
}

function matchesFilters(item, filters) {
  return filters.every(({ key, value }) => {
    if (key === "tag") return item.tags.includes(value);
    return (item[key] || "") === value;
  });
}

function parseFilters(args) {
  return args
    .filter((a) => a.includes(":"))
    .map((a) => {
      const [key, value] = a.split(":");
      return { key: key === "tags" ? "tag" : key, value };
    });
}

function capital(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : "—";
}

// A single-project repo would otherwise gain a column of identical values, so
// the Project column appears only when the backlog actually spans projects.
let SHOW_PROJECT = false;

function row(item) {
  const pri = capital(item.priority);
  const tags = item.tags.length ? item.tags.join(", ") : "—";
  // Mark index todos (📑) and initiative children (↳) so a flat table still
  // shows the structure the Initiatives section renders in full.
  const mark = item.kind === "index" ? "📑 " : item.parent ? "↳ " : "";
  const project = SHOW_PROJECT ? ` ${item.project || "—"} |` : "";
  return `| ${pri} | ${item.effort || "—"} | ${item.category || "—"} |${project} ${mark}[${item.title}](./${item.file}) | ${tags} |`;
}

function tableHead() {
  return SHOW_PROJECT
    ? "| Priority | Effort | Category | Project | Todo | Tags |\n|---|---|---|---|---|---|"
    : "| Priority | Effort | Category | Todo | Tags |\n|---|---|---|---|---|";
}

/** The "Initiatives" section — one block per `kind: index` todo, with its
 *  children (todos whose `parent` is that index's slug) nested beneath. */
function renderInitiatives(indexes, all) {
  if (!indexes.length) return "";
  const parts = [`## Initiatives (${indexes.length})\n`];
  for (const idx of indexes.slice().sort(sortItems)) {
    const children = all.filter((t) => t.parent === idx.slug).sort(sortItems);
    const n = children.length;
    parts.push(
      `### [${idx.title}](./${idx.file}) — ${idx.status || "—"} · ${n} todo${n === 1 ? "" : "s"}`,
    );
    if (n) {
      parts.push(
        children
          .map((c, i) => {
            const meta = [c.status || "—", capital(c.priority), c.effort]
              .filter(Boolean)
              .join(" · ");
            return `${i + 1}. [${c.title}](./${c.file}) — ${meta}`;
          })
          .join("\n"),
      );
    } else {
      parts.push(`_(no child todos yet — add \`parent: ${idx.slug}\` to them)_`);
    }
    parts.push("");
  }
  return parts.join("\n");
}

function renderGroups(items) {
  const buckets = new Map(STATUS_ORDER.map((s) => [s, []]));
  const unclassified = [];
  for (const it of items) {
    if (it.status && buckets.has(it.status)) buckets.get(it.status).push(it);
    else unclassified.push(it);
  }
  const parts = [];
  for (const status of STATUS_ORDER) {
    const list = buckets.get(status).sort(sortItems);
    if (!list.length) continue;
    parts.push(`## ${STATUS_LABEL[status]} (${list.length})\n`);
    parts.push(tableHead());
    parts.push(list.map(row).join("\n"));
    parts.push("");
  }
  if (unclassified.length) {
    parts.push(`## Unclassified — missing/invalid frontmatter (${unclassified.length})\n`);
    parts.push(tableHead());
    parts.push(unclassified.sort(sortItems).map(row).join("\n"));
    parts.push("");
  }
  return parts.join("\n");
}

/** The full grouped view (Initiatives + status buckets), printed to stdout.
 *  This is what the old committed INDEX.md held — now generated on demand. */
function renderFull(items) {
  // Index todos are meta (they group children) — surfaced in their own
  // Initiatives section and kept OUT of the status buckets + the open-todo count.
  const indexes = items.filter((i) => i.kind === "index");
  const tasks = items.filter((i) => i.kind !== "index");
  const total = tasks.length;
  const counts = STATUS_ORDER.map((s) => {
    const n = tasks.filter((i) => i.status === s).length;
    return `${STATUS_LABEL[s]}: ${n}`;
  }).join(" · ");
  const initiativeNote = indexes.length ? ` · Initiatives: ${indexes.length}` : "";
  const header = `# Todos — ${total} open · ${counts}${initiativeNote}\n`;
  const initiatives = renderInitiatives(indexes, items);
  process.stdout.write(
    header + "\n" + (initiatives ? initiatives + "\n" : "") + renderGroups(tasks) + "\n",
  );
}

function printList(items, filters) {
  const filtered = items.filter((i) => matchesFilters(i, filters)).sort(sortItems);
  const label = filters.map((f) => `${f.key}:${f.value}`).join(" ");
  if (!filtered.length) {
    process.stdout.write(`No todos match — ${label}\n`);
    return;
  }
  process.stdout.write(`# Todos — ${label} (${filtered.length})\n\n${tableHead()}\n`);
  process.stdout.write(filtered.map(row).join("\n") + "\n");
}

const args = process.argv.slice(2);
const items = loadTodos();
SHOW_PROJECT = new Set(items.map((t) => t.project).filter(Boolean)).size > 1;
// `--list` with filters → flat filtered table; anything else (bare invocation
// or `--list` with no filters) → the full grouped view. No file is ever written.
const filterArgs = args[0] === "--list" ? args.slice(1) : args;
const filters = parseFilters(filterArgs);
if (filters.length) {
  printList(items, filters);
} else {
  renderFull(items);
}
