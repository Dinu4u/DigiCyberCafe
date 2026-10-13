"use client";

import { useEffect, useRef, useState } from "react";

export type ExamPhotoPreset = "ssc-upsc" | "passport" | "custom";
export type ExamPhotoSource = File | Blob | HTMLImageElement | null;
export type PhotoDimensions = { width: number; height: number };
export type PhotoCanvasError = { title: string; message: string; steps: string[] };

export const EXAM_PHOTO_PRESETS: Record<Exclude<ExamPhotoPreset, "custom">, PhotoDimensions> = {
  "ssc-upsc": { width: 413, height: 531 },
  passport: { width: 600, height: 600 },
};

export function useExamPhotoCanvas({
  source,
  name,
  date,
  labelPrefix,
  preset,
  customWidth,
  customHeight,
  fontSizeOffset,
}: {
  source: ExamPhotoSource;
  name: string;
  date: string;
  labelPrefix: "DOP:" | "DATE:" | "";
  preset: ExamPhotoPreset;
  customWidth: number;
  customHeight: number;
  fontSizeOffset: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState<PhotoDimensions>(EXAM_PHOTO_PRESETS["ssc-upsc"]);
  const [renderError, setRenderError] = useState<PhotoCanvasError | null>(null);
  const [renderVersion, setRenderVersion] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!source || !canvas) {
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
      setReady(false);
      setRenderError(null);
      return;
    }

    let active = true;
    let bitmap: ImageBitmap | null = null;
    void (async () => {
      try {
        if (source instanceof HTMLImageElement) {
          if (!source.complete) await source.decode();
        } else {
          bitmap = await createImageBitmap(source);
        }
        if (!active) return;
        const image = source instanceof HTMLImageElement ? source : bitmap;
        if (!image) throw new Error("The selected photo could not be decoded.");
        const imageWidth = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
        const imageHeight = image instanceof HTMLImageElement ? image.naturalHeight : image.height;
        if (imageWidth < 200 || imageHeight < 200) {
          setRenderError({
            title: "Low image resolution",
            message: "The uploaded photo is too small and may appear blurry on print.",
            steps: ["Upload a clear photo of at least 400 x 400 pixels.", "Use the original image rather than a thumbnail or screenshot.", "Try generating the photo again."],
          });
          setReady(false);
          return;
        }
        if (name.trim().length > 60) {
          setRenderError({
            title: "Name exceeds printable space",
            message: "This name cannot fit in the date strip at a readable font size.",
            steps: ["Shorten middle names or use initials.", "For example, use ‘A. K. Sharma’.", "Retry after shortening the name."],
          });
          setReady(false);
          return;
        }

        const outputDimensions = preset === "custom"
          ? { width: customWidth, height: customHeight }
          : EXAM_PHOTO_PRESETS[preset];
        if (!Number.isInteger(outputDimensions.width) || !Number.isInteger(outputDimensions.height) || outputDimensions.width < 100 || outputDimensions.height < 100 || outputDimensions.width > 4000 || outputDimensions.height > 4000 || outputDimensions.width * outputDimensions.height > 16_000_000) {
          setRenderError({
            title: "Custom dimensions are out of range",
            message: "The selected canvas dimensions are not safe to render in this browser.",
            steps: ["Use width and height between 100 and 4000 pixels.", "Keep the total canvas below 16 megapixels.", "Choose the SSC/UPSC or passport preset to continue."],
          });
          setReady(false);
          return;
        }

        canvas.width = outputDimensions.width;
        canvas.height = outputDimensions.height;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("This browser could not create a photo canvas.");
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, canvas.width, canvas.height);

        const scale = Math.max(canvas.width / imageWidth, canvas.height / imageHeight);
        const cropWidth = canvas.width / scale;
        const cropHeight = canvas.height / scale;
        const cropX = (imageWidth - cropWidth) / 2;
        const cropY = (imageHeight - cropHeight) / 2;
        context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);

        const footerHeight = Math.round(canvas.height * 0.2);
        const footerTop = canvas.height - footerHeight;
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, footerTop, canvas.width, footerHeight);
        context.strokeStyle = "#E5E7EB";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(0, footerTop + 0.5);
        context.lineTo(canvas.width, footerTop + 0.5);
        context.stroke();

        const safeName = name.trim().toLocaleUpperCase();
        const dateLine = [labelPrefix, formatExamDate(date)].filter(Boolean).join(" ");
        const horizontalPadding = Math.max(12, Math.round(canvas.width * 0.03));
        let nameFontSize = Math.max(10, Math.round(canvas.width * 0.06) + fontSizeOffset);
        context.font = `700 ${nameFontSize}px Arial, sans-serif`;
        while (safeName && context.measureText(safeName).width > canvas.width - horizontalPadding * 2 && nameFontSize > 10) {
          nameFontSize -= 1;
          context.font = `700 ${nameFontSize}px Arial, sans-serif`;
        }
        if (safeName && context.measureText(safeName).width > canvas.width - horizontalPadding * 2) {
          setRenderError({
            title: "Name exceeds printable space",
            message: "This name cannot fit in the date strip at a readable font size.",
            steps: ["Shorten middle names or use initials.", "For example, use ‘A. K. Sharma’.", "Retry after shortening the name."],
          });
          setReady(false);
          return;
        }

        const dateFontSize = Math.max(10, Math.min(15, Math.round(nameFontSize * 0.62)));
        const nameLineHeight = safeName ? nameFontSize + 2 : 0;
        const dateLineHeight = dateLine ? dateFontSize + 2 : 0;
        const lineGap = safeName && dateLine ? Math.max(2, Math.round(footerHeight * 0.05)) : 0;
        const blockHeight = nameLineHeight + lineGap + dateLineHeight;
        let textY = footerTop + (footerHeight - blockHeight) / 2;
        context.textAlign = "center";
        context.textBaseline = "top";
        context.fillStyle = "#111827";
        if (safeName) {
          context.font = `700 ${nameFontSize}px Arial, sans-serif`;
          context.fillText(safeName, canvas.width / 2, textY, canvas.width - horizontalPadding * 2);
          textY += nameLineHeight + lineGap;
        }
        if (dateLine) {
          context.font = `400 ${dateFontSize}px Arial, sans-serif`;
          context.fillText(dateLine, canvas.width / 2, textY, canvas.width - horizontalPadding * 2);
        }

        if (!active) return;
        setDimensions(outputDimensions);
        setRenderError(null);
        setReady(true);
        setRenderVersion((version) => version + 1);
      } catch (error) {
        if (!active) return;
        setRenderError({
          title: "Could not render this image",
          message: error instanceof Error ? error.message : "The image could not be prepared in this browser.",
          steps: ["Check that the file is a valid JPG, PNG, or WebP image.", "Try a smaller image or one of the standard presets.", "Clear the photo and upload it again."],
        });
        setReady(false);
      } finally {
        bitmap?.close();
      }
    })();

    return () => {
      active = false;
      bitmap?.close();
    };
  }, [source, name, date, labelPrefix, preset, customWidth, customHeight, fontSizeOffset]);

  return { canvasRef, dimensions, renderError, renderVersion, ready };
}

function formatExamDate(value: string) {
  if (!value) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}
