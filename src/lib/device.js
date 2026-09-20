export async function chooseDevice({ navigatorRef = navigator } = {}) {
  if (!navigatorRef || !("gpu" in navigatorRef)) return "wasm";

  try {
    const adapter = await navigatorRef.gpu.requestAdapter();
    if (!adapter) return "wasm";

    const device = await adapter.requestDevice?.();
    if (!device) return "wasm";

    return "webgpu";
  } catch {
    return "wasm";
  }
}

export function shouldRetryWithWasm(device, error) {
  if (device !== "webgpu") return false;
  if (!error) return false;

  const message = error instanceof Error ? error.message : String(error);
  return /webgpu|gpu|adapter|device|unsupported|not supported|not available|shader|failed|invalid/i.test(message);
}
