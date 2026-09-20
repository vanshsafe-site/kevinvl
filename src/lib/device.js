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
