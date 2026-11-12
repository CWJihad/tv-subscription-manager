// Usage: node snapshot.js <output.md> <file|dir> [file|dir ...]
// Bundles source files into ONE markdown file for Project knowledge.
// Skips .env files (but keeps .env.example), node_modules, locks, logs, images.
// Check the output for secrets before uploading.
const fs = require("fs");
const path = require("path");

const [out, ...inputs] = process.argv.slice(2);
if (!out || inputs.length === 0) {
  console.error("Usage: node snapshot.js <output.md> <file|dir> [file|dir ...]");
  process.exit(1);
}

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage", "uploads"]);
const SKIP_FILE = /^(\.env(?!\.example$).*|.*\.log|.*-lock\.json|.*\.(png|jpe?g|gif|webp|svg|ico|pdf|zip))$/i;
const MAX_BYTES = 60 * 1024;

const files = [];
const walk = (p) => {
  if (!fs.existsSync(p)) {
    console.warn("Not found: " + p);
    return;
  }
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    if (SKIP_DIRS.has(path.basename(p))) return;
    fs.readdirSync(p).sort().forEach((name) => walk(path.join(p, name)));
  } else if (!SKIP_FILE.test(path.basename(p)) && stat.size <= MAX_BYTES) {
    files.push(p);
  }
};
inputs.forEach(walk);

let md = "# Code snapshot\nGenerated: " + new Date().toISOString() + "\n\n";
for (const file of files) {
  const ext = path.extname(file).slice(1) || "txt";
  const rel = file.split(path.sep).join("/");
  const content = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  md += "## " + rel + "\n\n```" + ext + "\n" + content + "\n```\n\n";
}
fs.writeFileSync(out, md, "utf8");
console.log("Wrote " + out + " (" + files.length + " files)");
