import test from 'node:test';
import assert from 'node:assert/strict';

import { chooseDevice, shouldRetryWithWasm } from './device.js';

test('prefers webgpu whenever an adapter exists, leaving unsupported startup errors to runtime fallback', async () => {
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
  assert.equal(device, 'webgpu');
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

test('tries webgpu first even when a compatible adapter rejects requestDevice early', async () => {
  const nav = {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    gpu: {
      async requestAdapter() {
        return {
          features: new Set(['shader-f16']),
          async requestDevice() {
            throw new Error('Not ready yet');
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
