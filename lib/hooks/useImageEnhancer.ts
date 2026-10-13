"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ImageEnhancerSettings = {
  brightness: number;
  contrast: number;
  clarity: number;
  exposure: number;
  saturation: number;
  temperature: number;
  denoise: boolean;
};
export type SettingKey = keyof ImageEnhancerSettings;
export type ExportFormat = "image/jpeg" | "image/png" | "image/webp";
export type EnhancerError = {
  scenario: "memory" | "artifacts" | "timeout" | "corrupt" | "unsupported" | "processing";
  title: string;
  message: string;
  steps: string[];
};
export type EnhancerPreset = "auto" | "portrait" | "document" | "landscape";

type EnhancementSnapshot = { settings: ImageEnhancerSettings; autoEnhance: boolean };
type WorkerFailureKind = EnhancerError["scenario"];
type WorkerResponse =
  | { type: "success"; blob: Blob; width: number; height: number; sourceWidth: number; sourceHeight: number }
  | { type: "failure"; kind: WorkerFailureKind; message: string };
type WorkerPayload = {
  type: "process" | "export";
  bitmap: ImageBitmap;
  settings: ImageEnhancerSettings;
  autoEnhance: boolean;
  autoDownscale: boolean;
  upscale: boolean;
  format: ExportFormat;
  quality: number;
};
type WorkerSuccess = Extract<WorkerResponse, { type: "success" }>;

export const DEFAULT_ENHANCER_SETTINGS: ImageEnhancerSettings = {
  brightness: 100,
  contrast: 100,
  clarity: 28,
  exposure: 0,
  saturation: 100,
  temperature: 0,
  denoise: false,
};

const HISTORY_LIMIT = 40;
const WORKER_TIMEOUT_MS = 10_000;
const PREVIEW_DEBOUNCE_MS = 160;

export function useImageEnhancer() {
  const sourceBitmapRef = useRef<ImageBitmap | null>(null);
  const sourceUrlRef = useRef("");
  const enhancedUrlRef = useRef("");
  const historyRef = useRef<EnhancementSnapshot[]>([{ settings: DEFAULT_ENHANCER_SETTINGS, autoEnhance: false }]);
  const historyIndexRef = useRef(0);
  const historyGroupRef = useRef<{ key: SettingKey; time: number } | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceVersion, setSourceVersion] = useState(0);
  const [enhancedUrl, setEnhancedUrl] = useState("");
  const [settings, setSettings] = useState(DEFAULT_ENHANCER_SETTINGS);
  const settingsRef = useRef(settings);
  const [autoEnhance, setAutoEnhance] = useState(false);
  const autoEnhanceRef = useRef(autoEnhance);
  const [autoDownscale, setAutoDownscale] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "processing" | "ready" | "exporting">("idle");
  const [error, setError] = useState<EnhancerError | null>(null);
  const [notice, setNotice] = useState("");
  const [historyIndex, setHistoryIndex] = useState(0);
  const [historyLength, setHistoryLength] = useState(1);

  const commitSnapshot = useCallback((next: EnhancementSnapshot, groupKey?: SettingKey) => {
    const current = historyRef.current[historyIndexRef.current];
    const now = Date.now();
    const mergeGroup = groupKey && historyGroupRef.current?.key === groupKey && now - historyGroupRef.current.time < 500;
    if (mergeGroup) {
      historyRef.current[historyIndexRef.current] = next;
      historyGroupRef.current = { key: groupKey, time: now };
    } else {
      const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
      if (JSON.stringify(current) !== JSON.stringify(next)) nextHistory.push(next);
      if (nextHistory.length > HISTORY_LIMIT) nextHistory.shift();
      historyRef.current = nextHistory;
      historyIndexRef.current = nextHistory.length - 1;
      historyGroupRef.current = groupKey ? { key: groupKey, time: now } : null;
    }
    setHistoryIndex(historyIndexRef.current);
    setHistoryLength(historyRef.current.length);
  }, []);

  const applySnapshot = useCallback((snapshot: EnhancementSnapshot) => {
    settingsRef.current = snapshot.settings;
    autoEnhanceRef.current = snapshot.autoEnhance;
    setSettings(snapshot.settings);
    setAutoEnhance(snapshot.autoEnhance);
  }, []);

  const updateSetting = useCallback(<K extends SettingKey>(key: K, value: ImageEnhancerSettings[K]) => {
    const nextSettings = { ...settingsRef.current, [key]: value };
    const next = { settings: nextSettings, autoEnhance: false };
    settingsRef.current = nextSettings;
    autoEnhanceRef.current = false;
    setSettings(nextSettings);
    setAutoEnhance(false);
    commitSnapshot(next, key);
  }, [commitSnapshot]);

  const applyPreset = useCallback((preset: EnhancerPreset) => {
    const nextByPreset: Record<EnhancerPreset, EnhancementSnapshot> = {
      auto: { settings: { ...DEFAULT_ENHANCER_SETTINGS, clarity: 24 }, autoEnhance: true },
      portrait: { settings: { ...DEFAULT_ENHANCER_SETTINGS, brightness: 104, contrast: 104, clarity: 16, exposure: 0.15, saturation: 104, temperature: 4 }, autoEnhance: true },
      document: { settings: { ...DEFAULT_ENHANCER_SETTINGS, contrast: 122, clarity: 78, saturation: 92 }, autoEnhance: false },
      landscape: { settings: { ...DEFAULT_ENHANCER_SETTINGS, contrast: 108, clarity: 36, saturation: 122, temperature: -2 }, autoEnhance: true },
    };
    const next = nextByPreset[preset];
    applySnapshot(next);
    commitSnapshot(next);
    setError(null);
  }, [applySnapshot, commitSnapshot]);

  const resetRecommended = useCallback(() => {
    const next = { settings: DEFAULT_ENHANCER_SETTINGS, autoEnhance: false };
    applySnapshot(next);
    commitSnapshot(next);
    setError(null);
  }, [applySnapshot, commitSnapshot]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    applySnapshot(historyRef.current[historyIndexRef.current]);
    setHistoryIndex(historyIndexRef.current);
    setError(null);
  }, [applySnapshot]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    applySnapshot(historyRef.current[historyIndexRef.current]);
    setHistoryIndex(historyIndexRef.current);
    setError(null);
  }, [applySnapshot]);

  const loadFile = useCallback(async (file: File) => {
    setError(null);
    setNotice("");
    setStatus("loading");
    const validMime = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
    const validExtension = /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!validMime && !validExtension) {
      setError(createEnhancerError("corrupt"));
      setStatus("idle");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      if (!bitmap.width || !bitmap.height) {
        bitmap.close();
        throw new Error("The decoded image has no usable pixels.");
      }
      sourceBitmapRef.current?.close();
      sourceBitmapRef.current = bitmap;
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
      if (enhancedUrlRef.current) URL.revokeObjectURL(enhancedUrlRef.current);
      sourceUrlRef.current = URL.createObjectURL(file);
      enhancedUrlRef.current = "";
      setSourceUrl(sourceUrlRef.current);
      setEnhancedUrl("");
      setSourceVersion((version) => version + 1);
      setAutoDownscale(false);
      applySnapshot({ settings: DEFAULT_ENHANCER_SETTINGS, autoEnhance: false });
      historyRef.current = [{ settings: DEFAULT_ENHANCER_SETTINGS, autoEnhance: false }];
      historyIndexRef.current = 0;
      historyGroupRef.current = null;
      setHistoryIndex(0);
      setHistoryLength(1);
      setStatus("processing");
    } catch (caught) {
      setError(caught instanceof Error && /memory|allocation|quota|too large/i.test(caught.message)
        ? createEnhancerError("memory")
        : createEnhancerError("corrupt"));
      setStatus("idle");
    }
  }, [applySnapshot]);

  const clearImage = useCallback(() => {
    sourceBitmapRef.current?.close();
    sourceBitmapRef.current = null;
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    if (enhancedUrlRef.current) URL.revokeObjectURL(enhancedUrlRef.current);
    sourceUrlRef.current = "";
    enhancedUrlRef.current = "";
    setSourceUrl("");
    setEnhancedUrl("");
    setSourceVersion((version) => version + 1);
    setStatus("idle");
    setError(null);
    setNotice("");
  }, []);

  useEffect(() => () => {
    sourceBitmapRef.current?.close();
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    if (enhancedUrlRef.current) URL.revokeObjectURL(enhancedUrlRef.current);
  }, []);

  useEffect(() => {
    const sourceBitmap = sourceBitmapRef.current;
    if (!sourceBitmap) return;
    let active = true;
    let worker: Worker | null = null;
    const timer = window.setTimeout(() => {
      setStatus("processing");
      setError(null);
      void createImageBitmap(sourceBitmap).then((bitmap) => {
        if (!active) {
          bitmap.close();
          return null;
        }
        return runEnhancerWorker({
          type: "process",
          bitmap,
          settings,
          autoEnhance,
          autoDownscale,
          upscale: false,
          format: "image/jpeg",
          quality: 0.86,
        }, (createdWorker) => { worker = createdWorker; });
      }).then((result) => {
        if (!active || !result) return;
        if (enhancedUrlRef.current) URL.revokeObjectURL(enhancedUrlRef.current);
        enhancedUrlRef.current = URL.createObjectURL(result.blob);
        setEnhancedUrl(enhancedUrlRef.current);
        setStatus("ready");
        if (autoDownscale && (result.width < result.sourceWidth || result.height < result.sourceHeight)) {
          setNotice(`Enhanced preview optimized to ${result.width} × ${result.height}px to protect browser memory.`);
        } else {
          setNotice("");
        }
      }).catch((caught: unknown) => {
        if (!active) return;
        setError(errorForCaught(caught));
        setStatus("idle");
      });
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      active = false;
      window.clearTimeout(timer);
      worker?.terminate();
    };
  }, [sourceVersion, settings, autoEnhance, autoDownscale]);

  const autoDownscaleAndEnhance = useCallback(() => {
    setAutoDownscale(true);
    applyPreset("auto");
    setError(null);
  }, [applyPreset]);

  const exportImage = useCallback(async (options: { upscale: boolean; format: ExportFormat; quality: number }) => {
    const sourceBitmap = sourceBitmapRef.current;
    if (!sourceBitmap) throw new Error("Upload a photo before exporting.");
    setStatus("exporting");
    setError(null);
    try {
      const bitmap = await createImageBitmap(sourceBitmap);
      const result = await runEnhancerWorker({
        type: "export",
        bitmap,
        settings: settingsRef.current,
        autoEnhance: autoEnhanceRef.current,
        autoDownscale,
        upscale: options.upscale,
        format: options.format,
        quality: options.quality,
      });
      setStatus("ready");
      return result;
    } catch (caught) {
      const enhancerError = errorForCaught(caught);
      setError(enhancerError);
      setStatus(enhancedUrlRef.current ? "ready" : "idle");
      throw new Error(enhancerError.message);
    }
  }, [autoDownscale]);

  return {
    sourceUrl,
    enhancedUrl,
    settings,
    autoEnhance,
    status,
    error,
    notice,
    historyIndex,
    historyLength,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < historyLength - 1,
    loadFile,
    clearImage,
    updateSetting,
    applyPreset,
    resetRecommended,
    undo,
    redo,
    autoDownscaleAndEnhance,
    exportImage,
    clearError: () => setError(null),
  };
}

function runEnhancerWorker(payload: WorkerPayload, onWorker?: (worker: Worker) => void): Promise<WorkerSuccess> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    let settled = false;
    const timeout = { id: 0 };
    try {
      worker = new Worker(new URL("../workers/imageEnhancer.worker.ts", import.meta.url), { type: "module" });
      onWorker?.(worker);
    } catch {
      payload.bitmap.close();
      reject(new Error("The image processing worker could not be started."));
      return;
    }
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout.id);
      worker.terminate();
      callback();
    };
    timeout.id = window.setTimeout(() => finish(() => reject(new EnhancerRuntimeError("timeout"))), WORKER_TIMEOUT_MS);
    worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      if (data.type === "failure") {
        finish(() => reject(new EnhancerRuntimeError(data.kind, data.message)));
        return;
      }
      finish(() => resolve(data));
    };
    worker.onerror = () => finish(() => reject(new EnhancerRuntimeError("processing")));
    worker.onmessageerror = () => finish(() => reject(new EnhancerRuntimeError("processing")));
    try {
      worker.postMessage(payload, [payload.bitmap]);
    } catch {
      payload.bitmap.close();
      finish(() => reject(new EnhancerRuntimeError("memory")));
    }
  });
}

class EnhancerRuntimeError extends Error {
  constructor(readonly scenario: WorkerFailureKind, message?: string) {
    super(message ?? createEnhancerError(scenario).message);
    this.name = "EnhancerRuntimeError";
  }
}

function errorForCaught(caught: unknown): EnhancerError {
  if (caught instanceof EnhancerRuntimeError) return createEnhancerError(caught.scenario, caught.message);
  if (caught instanceof Error && /memory|allocation|quota|too large/i.test(caught.message)) return createEnhancerError("memory");
  return createEnhancerError("processing", caught instanceof Error ? caught.message : undefined);
}

export function createEnhancerError(scenario: WorkerFailureKind, detail?: string): EnhancerError {
  if (scenario === "memory") return {
    scenario,
    title: "Canvas Pixel Buffer Overflow / Allocation Failed",
    message: "Image is too large to enhance at full resolution in browser memory.",
    steps: ["Click Auto-Downscale & Enhance to automatically optimize dimensions.", "Or manually resize the image below 3000px before uploading."],
  };
  if (scenario === "artifacts") return {
    scenario,
    title: "Over-Processing / Extreme Artifacts Detected",
    message: "Extreme contrast or sharpening applied.",
    steps: ["The current settings may cause heavy grain or blowout.", "Click Reset to Recommended to restore balanced clarity."],
  };
  if (scenario === "timeout") return {
    scenario,
    title: "Worker Thread Inactivity or Timeout",
    message: "Image processing timed out.",
    steps: ["The operation took too long. Try disabling Denoise or 2× Upscale.", "Reload the page and try again if the timeout continues."],
  };
  if (scenario === "corrupt") return {
    scenario,
    title: "Unsupported or Corrupted Image",
    message: "Could not read image file.",
    steps: ["Ensure the file is an uncorrupted JPEG, PNG, or WebP photo.", "Try opening the image on your computer to verify it is intact."],
  };
  if (scenario === "unsupported") return {
    scenario,
    title: "Unsupported Browser Feature",
    message: detail ?? "This browser could not encode the requested image format.",
    steps: ["Choose JPG, PNG, or WebP and try again.", "Update your browser if the issue continues."],
  };
  return {
    scenario: "processing",
    title: "Image Processing Failed",
    message: detail ?? "The image could not be enhanced in this browser.",
    steps: ["Try a smaller JPEG, PNG, or WebP photo.", "Reset the adjustments and try again."],
  };
}