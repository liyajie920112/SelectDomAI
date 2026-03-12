import { access, mkdir, readFile, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = process.cwd();

function getExtensionPackagePlan(rootDir, version) {
  const archiveFileName = `select-dom-ai-extension-v${version}.zip`;

  return {
    sourceDir: path.join(rootDir, 'dist', 'extension'),
    outputDir: path.join(rootDir, 'artifacts'),
    archiveFileName,
    archivePath: path.join(rootDir, 'artifacts', archiveFileName)
  };
}

async function readVersion() {
  const packageJsonPath = path.join(root, 'package.json');
  const content = await readFile(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(content);
  return packageJson.version;
}

async function ensureBuildOutput(sourceDir) {
  await access(sourceDir, constants.R_OK);
}

async function createZipArchive(plan) {
  await mkdir(plan.outputDir, { recursive: true });
  await rm(plan.archivePath, { force: true });

  await execFileAsync('zip', ['-rq', plan.archivePath, '.'], {
    cwd: plan.sourceDir
  });
}

async function main() {
  const version = await readVersion();
  const plan = getExtensionPackagePlan(root, version);

  await ensureBuildOutput(plan.sourceDir);
  await createZipArchive(plan);

  console.log(`Packaged extension to ${plan.archivePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
