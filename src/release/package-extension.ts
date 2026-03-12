export function getExtensionPackagePlan(rootDir: string, version: string) {
  const normalizedRoot = rootDir.replace(/[\\/]+$/, '');
  const archiveFileName = `select-dom-ai-extension-v${version}.zip`;

  return {
    sourceDir: `${normalizedRoot}/dist/extension`,
    outputDir: `${normalizedRoot}/artifacts`,
    archiveFileName,
    archivePath: `${normalizedRoot}/artifacts/${archiveFileName}`
  };
}
