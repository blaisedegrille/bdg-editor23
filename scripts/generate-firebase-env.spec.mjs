import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { generateFirebaseEnvironment } from './generate-firebase-env.mjs';

const temporaryDirectories = [];
const config = {
  apiKey: 'test-api-key',
  authDomain: 'test.firebaseapp.com',
  projectId: 'test-project',
  storageBucket: 'test.appspot.com',
  messagingSenderId: '123456',
  appId: '1:123456:web:test',
  measurementId: 'G-TEST',
};

function workspace() {
  const root = mkdtempSync(join(tmpdir(), 'firebase-env-'));
  temporaryDirectories.push(root);
  mkdirSync(join(root, 'src/environments'), { recursive: true });
  writeFileSync(join(root, 'src/environments/environment.example.ts'),
    'export const environment = { firebase: { apiKey: "EXAMPLE_API_KEY" } };\n');
  return root;
}

function generated(root) {
  return readFileSync(join(root, 'src/environments/environment.ts'), 'utf8');
}

afterEach(() => {
  for (const root of temporaryDirectories.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('generateFirebaseEnvironment', () => {
  it('writes the env-var config without logging its values', () => {
    const root = workspace();
    const message = generateFirebaseEnvironment({ root, configJson: JSON.stringify(config) });
    const output = generated(root);
    assert.match(output, /test-api-key/);
    assert.match(output, /satisfies FirebaseOptions/);
    assert.ok(!message.includes('test-api-key'));
  });

  it('prefers the env var over a local file', () => {
    const root = workspace();
    writeFileSync(join(root, 'firebase.web-config.local.json'),
      JSON.stringify({ ...config, apiKey: 'local-key' }));
    generateFirebaseEnvironment({ root, configJson: JSON.stringify(config) });
    assert.match(generated(root), /test-api-key/);
  });

  it('uses the gitignored local file when no env var is set', () => {
    const root = workspace();
    writeFileSync(join(root, 'firebase.web-config.local.json'), JSON.stringify(config));
    generateFirebaseEnvironment({ root, configJson: undefined });
    assert.match(generated(root), /test-api-key/);
  });

  it('falls back to the example so a fresh clone still compiles', () => {
    const root = workspace();
    const message = generateFirebaseEnvironment({ root, configJson: undefined });
    assert.match(generated(root), /EXAMPLE_API_KEY/);
    assert.match(message, /WARNING/);
  });

  it('keeps an existing environment file on a non-strict run without config', () => {
    const root = workspace();
    writeFileSync(join(root, 'src/environments/environment.ts'), '// keep me\n');
    generateFirebaseEnvironment({ root, configJson: undefined });
    assert.equal(generated(root), '// keep me\n');
  });

  it('fails strict mode when no config is available', () => {
    assert.throws(() => generateFirebaseEnvironment({ root: workspace(), strict: true }),
      /Missing FIREBASE_WEB_CONFIG/);
  });

  it('fails strict mode on placeholder values', () => {
    assert.throws(() => generateFirebaseEnvironment({
      root: workspace(), strict: true, configJson: JSON.stringify({ ...config, apiKey: 'EXAMPLE_API_KEY' }),
    }), /Placeholder Firebase config field: apiKey/);
  });

  it('rejects malformed JSON without echoing the input', () => {
    const input = '{ apiKey: "do-not-echo-this"';
    assert.throws(() => generateFirebaseEnvironment({ root: workspace(), configJson: input }),
      (error) => error.message === 'Firebase web config must be valid JSON.');
  });

  it('rejects missing required fields', () => {
    assert.throws(() => generateFirebaseEnvironment({
      root: workspace(), configJson: JSON.stringify({ ...config, apiKey: '' }),
    }), /Invalid Firebase config field: apiKey/);
  });

  it('allow-lists fields so credentials are never copied into the environment', () => {
    const root = workspace();
    generateFirebaseEnvironment({
      root,
      configJson: JSON.stringify({ ...config, private_key: 'must-not-appear', client_email: 'a@b.example' }),
    });
    assert.ok(!generated(root).includes('must-not-appear'));
    assert.ok(!generated(root).includes('client_email'));
  });
});
