export type RuntimeSupportOptions = {
  requireWorker?: boolean;
  requireWebAssembly?: boolean;
  requireOffscreenCanvas?: boolean;
  requireImageBitmap?: boolean;
};

export function getLocalProcessingSupportIssue(options: RuntimeSupportOptions = {}): string | null {
  if (typeof window === "undefined" && typeof self === "undefined") {
    return "This feature can only run in a browser context.";
  }
  if (options.requireWorker && typeof Worker === "undefined") {
    return "This browser does not support Web Workers, which are required for local processing.";
  }
  if (options.requireWebAssembly && typeof WebAssembly === "undefined") {
    return "This browser does not support WebAssembly, which is required for the local AI/FFmpeg runtime.";
  }
  if (options.requireOffscreenCanvas && typeof OffscreenCanvas === "undefined") {
    return "This browser cannot create OffscreenCanvas objects, which are required for local image processing.";
  }
  if (options.requireImageBitmap && typeof createImageBitmap !== "function") {
    return "This browser does not support ImageBitmap, which is required for local image processing.";
  }
  return null;
}
