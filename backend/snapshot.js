// Usage: node snapshot.js <output.md> <file-or-folder> [more files or folders...]
// Example: node snapshot.js backend-code-snapshot.md src package.json .env.example
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const [output, ...inputs] = process.argv.slice(2);

if (!output || inputs.length === 0) {
  console.error("Usage: node snapshot.js <output.md> <file-or-folder> [more...]");
  process.exit(1);
}

const EXTENSIONS = new Set([".js", ".ts", ".tsx", ".json", ".md", ".yml", ".yaml", ".css", ".example"]);
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "logs", "coverage", "dist", "public"]);
const SKIP_NAMES = new Set([".env", "package-lock.json", "snapshot.js", path.basename(output)]);
const MAX_BYTES = 200 * 1024;
const LANG = { ".js": "js", ".ts": "ts", ".tsx": "tsx", ".json": "json", ".md": "md", ".yml": "yaml", ".yaml": "yaml", ".css": "css" };

const posix = (p) => p.split(path.sep).join("/");
const rel = (f) => posix(path.relative(ROOT, f));

const isWanted = (file) => {
  const name = path.basename(file);
  if (SKIP_NAMES.has(name)) return false;
  return EXTENSIONS.has(path.extname(name)) || name.startsWith(".env.");
};

const walk = (target) => {
  if (!fs.existsSync(target)) {
    console.warn(`Not found: ${rel(target)}`);
    return [];
  }
  if (fs.statSync(target).isFile()) return isWanted(target) ? [target] : [];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(target, entry.name);
    if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : walk(full);
    return isWanted(full) ? [full] : [];
  });
};

const SECRET_LINE = /^(\s*(?:JWT_SECRET|SMTP_PASSWORD|WHATSAPP_TOKEN|SEED_ADMIN_PASSWORD|MONGODB_URL)\s*=).*$/gm;
const redact = (text) => text.replace(SECRET_LINE, "$1<hidden>");

const files = [...new Set(inputs.flatMap((i) => walk(path.resolve(ROOT, i))))].sort((a, b) =>
  posix(a).localeCompare(posix(b))
);

const out = ["# Code snapshot", `Generated: ${new Date().toISOString()}`, `Files: ${files.length}`, "", "## File list"];
files.forEach((f) => out.push(`- ${rel(f)}`));
out.push("");

const skipped = [];
files.forEach((file) => {
  const size = fs.statSync(file).size;
  if (size > MAX_BYTES) return skipped.push(`${rel(file)} (${Math.round(size / 1024)} kB)`);
  const content = redact(fs.readFileSync(file, "utf8")).replace(/\s+$/, "");
  out.push(`## ${rel(file)}`, "````" + (LANG[path.extname(file)] || ""), content, "````", "");
});

if (skipped.length) {
  out.push("## Skipped (too large)");
  skipped.forEach((s) => out.push(`- ${s}`));
}

fs.writeFileSync(path.resolve(ROOT, output), out.join("\n"), "utf8");
console.log(`Wrote ${output}: ${files.length} files, ${Math.round(fs.statSync(output).size / 1024)} kB`);