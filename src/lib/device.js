export async function chooseDevice({ navigatorRef = navigator } = {}) {
  if (!navigatorRef || !("gpu" in navigatorRef)) return "wasm";
  return "webgpu";
}

export function shouldRetryWithWasm(device, error) {
  if (device !== "webgpu") return false;
  return Boolean(error);
}
