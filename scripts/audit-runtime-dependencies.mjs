import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const found = new Map();
const missing = new Set();

const locate = (name, from) => {
  let current = from;
  while (true) {
    const file = path.join(current, 'node_modules', name, 'package.json');
    if (fs.existsSync(file)) return fs.realpathSync(file);
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
};
const visit = (name, from, optional = false) => {
  const file = locate(name, from);
  if (!file) { if (!optional) missing.add(name); return; }
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  const key = `${pkg.name}@${pkg.version}`;
  if (found.has(key)) return;
  const folder = path.dirname(file);
  const licenseFiles = fs.readdirSync(folder).filter((entry) => /^(licen[cs]e|copying|notice)(\.|$)/i.test(entry));
  found.set(key, {
    name: pkg.name, version: pkg.version,
    declaredLicense: pkg.license ?? pkg.licenses ?? null,
    repository: pkg.repository ?? null,
    licenseFiles,
  });
  for (const dependency of Object.keys(pkg.dependencies ?? {})) visit(dependency, folder);
  for (const dependency of Object.keys(pkg.optionalDependencies ?? {})) visit(dependency, folder, true);
};
for (const name of Object.keys(manifest.dependencies)) visit(name, root);
const packages = [...found.values()].sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
const report = {
  scope: 'Installed dependency graph starting from package.json dependencies; declarations, not a legal opinion. Native Maven/Gradle artifacts are outside this report.',
  packageCount: packages.length,
  missing: [...missing].sort(),
  missingLicense: packages.filter((pkg) => !pkg.declaredLicense).map((pkg) => `${pkg.name}@${pkg.version}`),
  packages,
};
fs.mkdirSync('build', { recursive: true });
fs.writeFileSync('build/runtime-dependencies.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ packageCount: report.packageCount, missing: report.missing, missingLicense: report.missingLicense }));
