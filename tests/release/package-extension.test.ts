import { describe, expect, it } from 'vitest';
import { getExtensionPackagePlan } from '../../src/release/package-extension';

describe('getExtensionPackagePlan', () => {
  it('packages the built extension into a versioned zip inside artifacts', () => {
    const plan = getExtensionPackagePlan('/workspace/select-dom-ai', '0.1.0');

    expect(plan.sourceDir).toBe('/workspace/select-dom-ai/dist/extension');
    expect(plan.outputDir).toBe('/workspace/select-dom-ai/artifacts');
    expect(plan.archivePath).toBe('/workspace/select-dom-ai/artifacts/select-dom-ai-extension-v0.1.0.zip');
    expect(plan.archiveFileName).toBe('select-dom-ai-extension-v0.1.0.zip');
  });
});
