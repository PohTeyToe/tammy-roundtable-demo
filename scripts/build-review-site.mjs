import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const sourceSiteDir = path.join(projectRoot, 'site');
const sourcePacketPath = path.join(projectRoot, 'docs', 'TAMMY-REVIEW-PACKET.html');
const sourceFallbackDir = path.join(projectRoot, 'assets', 'fallback', 'generated');
const outputDir = path.join(projectRoot, 'dist', 'review-site');
const outputPacketDir = path.join(outputDir, 'packet');
const outputFallbackDir = path.join(outputDir, 'assets', 'fallback', 'generated');

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

copyDir(sourceSiteDir, outputDir);
fs.mkdirSync(outputPacketDir, { recursive: true });
fs.copyFileSync(sourcePacketPath, path.join(outputPacketDir, 'index.html'));
copyDir(sourceFallbackDir, outputFallbackDir);

fs.writeFileSync(
  path.join(outputDir, 'manifest.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      packet: 'packet/index.html',
      fallbackManifest: 'assets/fallback/generated/manifest.json',
      note: 'Static review site for Tammy-facing preview hosting. Presentation-safe only; not proof of a live Google-authenticated run.',
    },
    null,
    2
  ),
  'utf8'
);

console.log(`Review site built at ${outputDir}`);

function copyDir(sourceDir, destinationDir) {
  fs.mkdirSync(destinationDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, destinationPath);
    } else {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}
