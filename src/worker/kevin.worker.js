import {
  pipeline,
  TextStreamer,
  InterruptableStoppingCriteria,
} from "@huggingface/transformers";

let generatorPromise = null;
let activeDevice = null;
let stopping = null;
let stopRequested = false;
let sawTotalProgress = false;

const post = (msg) => self.postMessage(msg);
const mb = (n) => (n / 1024 / 1024).toFixed(0);

function reportProgress(info) {
  switch (info.status) {
    case "initiate":
      post({ type: "status", text: "Preparing model files…" });
      break;
    case "download":
      post({ type: "status", text: "Downloading the model from Hugging Face…" });
      break;
    case "progress_total":
      sawTotalProgress = true;
      post({
        type: "progress",
        progress: info.progress ?? 0,
        detail: info.total
          ? `${mb(info.loaded)} of ${mb(info.total)} MB downloaded`
          : "Downloading model files…",
      });
      break;
    case "progress":
      // Per-file progress is only a fallback when the aggregate isn't reported.
      if (!sawTotalProgress) {
        post({
          type: "progress",
          progress: info.progress ?? 0,
          detail: info.file ? `${info.file} — ${Math.round(info.progress ?? 0)}%` : "Downloading…",
        });
      }
      break;
    case "ready":
      post({ type: "status", text: "Starting the model…" });
      break;
  }
}

async function getGenerator(modelId, device) {
  if (!generatorPromise) {
    activeDevice = device;
    sawTotalProgress = false;
    post({
      type: "status",
      text: device === "webgpu" ? "Starting up with your GPU…" : "Starting up on your CPU…",
    });

    generatorPromise = pipeline("text-generation", modelId, {
      device,
      // q4f16 is a good browser-sized choice for WebGPU; q8 is the conservative WASM/CPU choice.
      dtype: device === "webgpu" ? "q4f16" : "q8",
      progress_callback: reportProgress,
    });
  }
  try {
    return await generatorPromise;
  } catch (error) {
    generatorPromise = null;
    throw error;
  }
}

async function generate({ id, modelId, system, messages, options }) {
  const generator = await getGenerator(modelId, activeDevice);

  stopping = new InterruptableStoppingCriteria();
  stopRequested = false;

  let full = "";
  let tokenCount = 0;
  let startedAt = 0;

  const streamer = new TextStreamer(generator.tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function: (text) => {
      if (!startedAt) startedAt = performance.now();
      full += text;
      post({ type: "token", id, text });
    },
    token_callback_function: (tokens) => {
      tokenCount += Array.isArray(tokens) ? tokens.length : 1;
    },
  });

  try {
    await generator([{ role: "system", content: system }, ...messages], {
      max_new_tokens: options.maxNewTokens ?? 256,
      do_sample: true,
      temperature: options.temperature ?? 0.7,
      top_p: options.topP ?? 0.9,
      repetition_penalty: 1.05,
      streamer,
      stopping_criteria: stopping,
    });

    const seconds = startedAt ? (performance.now() - startedAt) / 1000 : 0;
    post({
      type: "done",
      id,
      text: full,
      stopped: stopRequested,
      tps: seconds > 0.3 && tokenCount > 1 ? tokenCount / seconds : null,
    });
  } finally {
    stopping = null;
  }
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === "load") {
      await getGenerator(data.modelId, data.device);
      post({ type: "ready", device: activeDevice });
    } else if (data.type === "stop") {
      stopRequested = true;
      stopping?.interrupt();
    } else if (data.type === "generate") {
      await generate(data);
    }
  } catch (error) {
    post({
      type: "error",
      id: data?.id ?? null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
