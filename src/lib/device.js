export async function chooseDevice({ navigatorRef = navigator } = {}) {
  if (!navigatorRef || !("gpu" in navigatorRef)) return "wasm";

  try {
    await navigatorRef.gpu.requestAdapter?.();
    return "webgpu";
  } catch {
    return "webgpu";
  }
}

export function shouldRetryWithWasm(device, error) {
  if (device !== "webgpu") return false;
  if (!error) return false;

  const message = error instanceof Error ? error.message : String(error);
  return /webgpu|gpu|adapter|device|unsupported|not supported|not available|shader|failed|invalid/i.test(message);
}
