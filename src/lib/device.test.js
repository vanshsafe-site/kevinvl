import test from 'node:test';
import assert from 'node:assert/strict';

import { chooseDevice, shouldRetryWithWasm } from './device.js';

test('falls back to wasm on an unsupported mobile GPU adapter', async () => {
  const nav = {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    gpu: {
      async requestAdapter() {
        return {
          features: new Set(),
          async requestDevice() {
            throw new Error('Unsupported GPU');
          },
        };
      },
    },
  };

  const device = await chooseDevice({ navigatorRef: nav });
  assert.equal(device, 'wasm');
});

test('uses webgpu when a mobile adapter passes a real device request', async () => {
  const nav = {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    gpu: {
      async requestAdapter() {
        return {
          features: new Set(['shader-f16']),
          async requestDevice() {
            return {};
          },
        };
      },
    },
  };

  const device = await chooseDevice({ navigatorRef: nav });
  assert.equal(device, 'webgpu');
});

test('detects WebGPU startup errors that should retry on wasm', () => {
  assert.equal(shouldRetryWithWasm('webgpu', new Error('WebGPU is not supported on this device')), true);
  assert.equal(shouldRetryWithWasm('webgpu', new Error('Random network issue')), false);
  assert.equal(shouldRetryWithWasm('wasm', new Error('WebGPU is not supported on this device')), false);
});
