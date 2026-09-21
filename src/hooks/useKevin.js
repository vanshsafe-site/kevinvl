import { useCallback, useEffect, useRef, useState } from "react";
import { MODEL_ID } from "../config.js";
import { chooseDevice } from "../lib/device.js";

const INITIAL = { phase: "idle", device: null, progress: 0, text: "", detail: "", error: null, tps: null };

/** Owns the Web Worker and exposes load / generate / stop. */
export function useKevin() {
  const workerRef = useRef(null);
  const handlers = useRef(new Map());
  const nextId = useRef(1);
  const [state, setState] = useState(INITIAL);
  const patch = useCallback((p) => setState((s) => ({ ...s, ...p })), []);

  const failAll = useCallback((message) => {
    for (const h of handlers.current.values()) h.onError?.(message);
    handlers.current.clear();
  }, []);

  const ensureWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    const worker = new Worker(new URL("../worker/kevin.worker.js", import.meta.url), { type: "module" });

    worker.onmessage = ({ data }) => {
      switch (data.type) {
        case "status":
          patch({ text: data.text });
          break;
        case "progress":
          patch({ progress: Math.max(0, Math.min(100, data.progress ?? 0)), detail: data.detail || "" });
          break;
        case "ready":
          patch({ phase: "ready", device: data.device, progress: 100, error: null });
          break;
        case "token":
          handlers.current.get(data.id)?.onToken?.(data.text);
          break;
        case "done": {
          const h = handlers.current.get(data.id);
          handlers.current.delete(data.id);
          if (data.tps) patch({ tps: data.tps });
          h?.onDone?.(data);
          break;
        }
        case "error": {
          const h = data.id != null ? handlers.current.get(data.id) : null;
          if (h) {
            handlers.current.delete(data.id);
            h.onError?.(data.message);
          } else {
            patch({ phase: "error", error: data.message });
          }
          break;
        }
      }
    };

    worker.onerror = (e) => {
      patch({ phase: "error", error: e.message || "The background worker stopped unexpectedly." });
      failAll("The background worker stopped unexpectedly.");
      worker.terminate();
      workerRef.current = null;
    };

    workerRef.current = worker;
    return worker;
  }, [patch, failAll]);

  const load = useCallback(async (preferredDevice = "gpu") => {
    if (state.phase === "checking" || state.phase === "loading") return;

    let device = preferredDevice;
    if (device === "auto") {
      device = "gpu";
    }
    if (device === "gpu") {
      device = "webgpu";
    } else {
      device = "wasm";
    }

    setState({
      ...INITIAL,
      phase: "loading",
      device,
      text: device === "webgpu"
        ? "Using your GPU for faster replies."
        : preferredDevice === "cpu"
          ? "Using your CPU. You can switch back to GPU in settings."
          : "No supported GPU access found, so K.E.V.I.N will run on your CPU. Replies may be slower.",
    });
    ensureWorker().postMessage({ type: "load", modelId: MODEL_ID, device });
  }, [state.phase, ensureWorker]);

  const generate = useCallback(
    ({ system, messages, options }, cbs) => {
      const id = nextId.current++;
      handlers.current.set(id, cbs);
      ensureWorker().postMessage({ type: "generate", id, modelId: MODEL_ID, system, messages, options });
      return id;
    },
    [ensureWorker]
  );

  const stop = useCallback(() => workerRef.current?.postMessage({ type: "stop" }), []);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    []
  );

  return { ...state, load, generate, stop };
}
