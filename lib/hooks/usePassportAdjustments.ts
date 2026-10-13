import { useCallback, useEffect, useMemo, useState } from "react";

export type PassportPresetKey = "india" | "us" | "europe" | "custom";

export type PassportPresetConfig = {
  id: PassportPresetKey;
  label: string;
  width: number;
  height: number;
  dpi: number;
  description: string;
};

export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const PASSPORT_PRESETS: Record<PassportPresetKey, PassportPresetConfig> = {
  india: {
    id: "india",
    label: "India (3.5 × 4.5 cm)",
    width: 413,
    height: 531,
    dpi: 300,
    description: "413 × 531 px · 300 DPI",
  },
  us: {
    id: "us",
    label: "US / Visa / Schengen",
    width: 600,
    height: 600,
    dpi: 300,
    description: "600 × 600 px · 300 DPI",
  },
  europe: {
    id: "europe",
    label: "Europe / UK / Australia",
    width: 413,
    height: 531,
    dpi: 300,
    description: "413 × 531 px · 300 DPI",
  },
  custom: {
    id: "custom",
    label: "Custom dimensions",
    width: 413,
    height: 531,
    dpi: 300,
    description: "User-defined size",
  },
};

export function usePassportAdjustments() {
  const [presetKey, setPresetKey] = useState<PassportPresetKey>("india");
  const [customWidth, setCustomWidth] = useState(413);
  const [customHeight, setCustomHeight] = useState(531);
  const [densityDpi, setDensityDpi] = useState(300);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [aspectLock, setAspectLock] = useState(true);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0.16, y: 0.16, width: 0.68, height: 0.68 });

  const selectedPreset = useMemo<PassportPresetConfig>(() => {
    if (presetKey === "custom") {
      return {
        id: "custom",
        label: "Custom dimensions",
        width: Number.isFinite(customWidth) && customWidth > 0 ? customWidth : 413,
        height: Number.isFinite(customHeight) && customHeight > 0 ? customHeight : 531,
        dpi: Number.isFinite(densityDpi) && densityDpi > 0 ? densityDpi : 300,
        description: `Custom · ${Number.isFinite(customWidth) && customWidth > 0 ? customWidth : 413} × ${Number.isFinite(customHeight) && customHeight > 0 ? customHeight : 531} px`,
      };
    }
    return PASSPORT_PRESETS[presetKey];
  }, [customHeight, customWidth, densityDpi, presetKey]);

  const resetAdjustments = useCallback(() => {
    setRotation(0);
    setZoom(100);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setFlipHorizontal(false);
  }, []);

  const replaceImage = useCallback((file: File) => {
    const nextUrl = URL.createObjectURL(file);
    if (sourceUrl) {
      URL.revokeObjectURL(sourceUrl);
    }
    if (bitmap) {
      bitmap.close();
    }
    setSourceFile(file);
    setSourceUrl(nextUrl);
    setBitmap(null);
    setCropRect({ x: 0.16, y: 0.16, width: 0.68, height: 0.68 });
  }, [bitmap, sourceUrl]);

  const clearImage = useCallback(() => {
    if (sourceUrl) {
      URL.revokeObjectURL(sourceUrl);
    }
    if (bitmap) {
      bitmap.close();
    }
    setSourceUrl("");
    setSourceFile(null);
    setBitmap(null);
    setCropRect({ x: 0.16, y: 0.16, width: 0.68, height: 0.68 });
  }, [bitmap, sourceUrl]);

  useEffect(() => () => {
    if (sourceUrl) {
      URL.revokeObjectURL(sourceUrl);
    }
  }, [sourceUrl]);

  return {
    presetKey,
    setPresetKey,
    customWidth,
    setCustomWidth,
    customHeight,
    setCustomHeight,
    densityDpi,
    setDensityDpi,
    rotation,
    setRotation,
    zoom,
    setZoom,
    brightness,
    setBrightness,
    contrast,
    setContrast,
    saturation,
    setSaturation,
    flipHorizontal,
    setFlipHorizontal,
    aspectLock,
    setAspectLock,
    sourceFile,
    setSourceFile,
    sourceUrl,
    setSourceUrl,
    bitmap,
    setBitmap,
    cropRect,
    setCropRect,
    selectedPreset,
    resetAdjustments,
    replaceImage,
    clearImage,
  };
}
