"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { Barcode, Check, Download, FileImage, Link2, QrCode, RotateCcw, UserRound, Wifi } from "lucide-react";
import styles from "./CodeGeneratorSuite.module.css";

type SuiteMode = "qr" | "barcode";
type QrKind = "text" | "wifi" | "upi" | "vcard";
type BarcodeFormat = "CODE128" | "EAN13" | "UPC" | "CODE39";
type RecoveryState = { message: string; steps: string[] };

const barcodeLabels: Record<BarcodeFormat, string> = { CODE128: "Code 128", EAN13: "EAN-13", UPC: "UPC-A", CODE39: "Code 39" };

export function CodeGeneratorSuite() {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const barcodeSvgRef = useRef<SVGSVGElement>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<SuiteMode>("qr");
  const [qrKind, setQrKind] = useState<QrKind>("text");
  const [textValue, setTextValue] = useState("https://example.com");
  const [ssid, setSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiSecurity, setWifiSecurity] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [upiAddress, setUpiAddress] = useState("");
  const [upiName, setUpiName] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const [upiNote, setUpiNote] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [foreground, setForeground] = useState("#173f75");
  const [background, setBackground] = useState("#ffffff");
  const [errorCorrection, setErrorCorrection] = useState<"L" | "M" | "Q" | "H">("M");
  const [qrMargin, setQrMargin] = useState(3);
  const [logoData, setLogoData] = useState("");
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>("CODE128");
  const [barcodeValue, setBarcodeValue] = useState("123456789012");
  const [showBarcodeText, setShowBarcodeText] = useState(true);
  const [barcodeHeight, setBarcodeHeight] = useState(90);
  const [barWidth, setBarWidth] = useState(2);
  const [renderedQrSvg, setRenderedQrSvg] = useState("");
  const [renderedBarcodeSvg, setRenderedBarcodeSvg] = useState("");
  const [renderError, setRenderError] = useState<RecoveryState | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const qrPayload = useMemo(() => createQrPayload(qrKind, {
    textValue, ssid, wifiPassword, wifiSecurity, upiAddress, upiName, upiAmount, upiNote,
    firstName, lastName, contactPhone, contactEmail,
  }), [qrKind, textValue, ssid, wifiPassword, wifiSecurity, upiAddress, upiName, upiAmount, upiNote, firstName, lastName, contactPhone, contactEmail]);
  const barcodeError = useMemo(() => validateBarcode(barcodeFormat, barcodeValue), [barcodeFormat, barcodeValue]);
  const currentValidation = mode === "qr" ? qrPayload.error : barcodeError;
  const recovery = renderError ?? (currentValidation ? recoveryFor(new Error(currentValidation), mode === "qr" ? "QR code" : barcodeLabels[barcodeFormat]) : null);

  useEffect(() => {
    let cancelled = false;
    const canvas = qrCanvasRef.current;
    if (mode !== "qr" || !canvas || currentValidation || !qrPayload.value) return () => { cancelled = true; };
    void (async () => {
      try {
        const options = {
          width: 420,
          margin: qrMargin,
          errorCorrectionLevel: errorCorrection,
          color: { dark: foreground, light: background },
        } as const;
        await QRCode.toCanvas(canvas, qrPayload.value, options);
        const svg = await QRCode.toString(qrPayload.value, { ...options, type: "svg" });
        const svgWithLogo = logoData ? await addLogoToSvg(svg, logoData, background) : svg;
        if (cancelled) return;
        if (logoData) await drawLogoOnCanvas(canvas, logoData, background);
        if (cancelled) return;
        setRenderedQrSvg(svgWithLogo);
        setRenderError(null);
      } catch (error) {
        if (!cancelled) setRenderError(recoveryFor(error, "QR code"));
      }
    })();
    return () => { cancelled = true; };
  }, [mode, currentValidation, qrPayload, errorCorrection, qrMargin, foreground, background, logoData, retryToken]);

  useEffect(() => {
    let cancelled = false;
    const svg = barcodeSvgRef.current;
    const canvas = barcodeCanvasRef.current;
    if (mode !== "barcode" || !svg || !canvas || barcodeError || !barcodeValue) return () => { cancelled = true; };
    void (async () => {
      try {
        const options = { format: barcodeFormat, width: barWidth, height: barcodeHeight, displayValue: showBarcodeText, margin: 12, lineColor: foreground, background };
        JsBarcode(svg, barcodeValue, options);
        JsBarcode(canvas, barcodeValue, options);
        const svgMarkup = new XMLSerializer().serializeToString(svg);
        if (cancelled) return;
        setRenderedBarcodeSvg(svgMarkup);
        setRenderError(null);
      } catch (error) {
        if (!cancelled) setRenderError(recoveryFor(error, barcodeLabels[barcodeFormat]));
      }
    })();
    return () => { cancelled = true; };
  }, [mode, barcodeFormat, barcodeValue, barcodeHeight, barWidth, showBarcodeText, foreground, background, barcodeError, retryToken]);

  async function uploadLogo(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setRenderError({ message: "The logo file is not a supported image.", steps: ["Choose a PNG, JPEG, or WebP image.", "Try a smaller image under 2 MB."] });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setRenderError({ message: "The logo is larger than 2 MB and may exhaust browser canvas memory.", steps: ["Resize or compress the logo image.", "Upload a PNG, JPEG, or WebP image under 2 MB."] });
      return;
    }
    try {
      const dataUrl = await readImageFile(file);
      await loadImage(dataUrl);
      setLogoData(dataUrl);
      setRenderError(null);
    } catch (error) {
      setRenderError(recoveryFor(error, "logo image"));
    }
  }

  async function downloadQrPng() {
    if (currentValidation || !qrPayload.value) return;
    const canvas = document.createElement("canvas");
    try {
      await QRCode.toCanvas(canvas, qrPayload.value, {
        width: 2000,
        margin: qrMargin,
        errorCorrectionLevel: errorCorrection,
        color: { dark: foreground, light: background },
      });
      if (logoData) await drawLogoOnCanvas(canvas, logoData, background);
      downloadDataUrl(canvas.toDataURL("image/png"), "qr-code-2000px.png");
      setRenderError(null);
    } catch (error) {
      setRenderError(recoveryFor(error, "high-resolution QR export"));
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  async function downloadBarcodePng() {
    if (barcodeError || !barcodeValue) return;
    const source = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const canvas = document.createElement("canvas");
    try {
      JsBarcode(source, barcodeValue, { format: barcodeFormat, width: barWidth, height: barcodeHeight, displayValue: showBarcodeText, margin: 12, lineColor: foreground, background });
      const sourceSvg = new XMLSerializer().serializeToString(source);
      const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(sourceSvg)}`);
      const aspect = image.naturalHeight / image.naturalWidth;
      canvas.width = 2000;
      canvas.height = Math.round(2000 * aspect);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("This browser could not create an export canvas.");
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      downloadDataUrl(canvas.toDataURL("image/png"), "barcode-2000px.png");
      setRenderError(null);
    } catch (error) {
      setRenderError(recoveryFor(error, "high-resolution barcode export"));
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  function downloadSvg() {
    const svg = mode === "qr" ? renderedQrSvg : renderedBarcodeSvg;
    if (!svg) return;
    try {
      const sanitized = svg.includes("xmlns=") ? svg : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
      downloadBlob(new Blob([sanitized], { type: "image/svg+xml;charset=utf-8" }), mode === "qr" ? "qr-code.svg" : "barcode.svg");
      setRenderError(null);
    } catch (error) {
      setRenderError(recoveryFor(error, "SVG export"));
    }
  }

  function clearCurrentCode() {
    if (mode === "qr") {
      setTextValue("");
      setSsid("");
      setWifiPassword("");
      setUpiAddress("");
      setUpiName("");
      setUpiAmount("");
      setUpiNote("");
      setFirstName("");
      setLastName("");
      setContactPhone("");
      setContactEmail("");
      const canvas = qrCanvasRef.current;
      canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      setRenderedQrSvg("");
    } else {
      setBarcodeValue("");
      barcodeCanvasRef.current?.getContext("2d")?.clearRect(0, 0, barcodeCanvasRef.current.width, barcodeCanvasRef.current.height);
      barcodeSvgRef.current?.replaceChildren();
      setRenderedBarcodeSvg("");
    }
    setRenderError(null);
  }

  function retryRender() {
    setRenderError(null);
    setRetryToken((token) => token + 1);
  }

  function selectMode(next: SuiteMode) {
    setMode(next);
    setRenderError(null);
  }

  const previewSvg = mode === "qr" ? renderedQrSvg : renderedBarcodeSvg;
  const canDownload = mode === "qr" ? Boolean(qrPayload.value && !qrPayload.error && renderedQrSvg) : Boolean(barcodeValue && !barcodeError && renderedBarcodeSvg);

  return <section className={styles.suite}>
    <header className={styles.heading}>
      <div><p className="eyebrow">OFFLINE CODE GENERATOR</p><h1>Barcode &amp; QR Code Suite</h1><p>Generate print-ready codes in your browser. Your data stays on this device.</p></div>
      <div className={styles.modeSwitch} role="tablist" aria-label="Code type">
        <button role="tab" aria-selected={mode === "qr"} className={mode === "qr" ? styles.activeMode : ""} onClick={() => selectMode("qr")}><QrCode size={16} /> QR code</button>
        <button role="tab" aria-selected={mode === "barcode"} className={mode === "barcode" ? styles.activeMode : ""} onClick={() => selectMode("barcode")}><Barcode size={16} /> Barcode</button>
      </div>
    </header>

    <div className={styles.layout}>
      <section className={styles.controls} aria-label="Generator settings">
        {mode === "qr" ? <>
          <div className={styles.kindTabs} role="tablist" aria-label="QR code type">
            {(["text", "wifi", "upi", "vcard"] as const).map((kind) => <button key={kind} role="tab" aria-selected={qrKind === kind} className={qrKind === kind ? styles.selectedKind : ""} onClick={() => { setQrKind(kind); setRenderError(null); }}><KindIcon kind={kind} />{kind === "text" ? "URL / Text" : kind === "wifi" ? "Wi-Fi" : kind === "upi" ? "UPI" : "vCard"}</button>)}
          </div>
          <QrFields kind={qrKind} textValue={textValue} setTextValue={setTextValue} ssid={ssid} setSsid={setSsid} wifiPassword={wifiPassword} setWifiPassword={setWifiPassword} wifiSecurity={wifiSecurity} setWifiSecurity={setWifiSecurity} upiAddress={upiAddress} setUpiAddress={setUpiAddress} upiName={upiName} setUpiName={setUpiName} upiAmount={upiAmount} setUpiAmount={setUpiAmount} upiNote={upiNote} setUpiNote={setUpiNote} firstName={firstName} setFirstName={setFirstName} lastName={lastName} setLastName={setLastName} contactPhone={contactPhone} setContactPhone={setContactPhone} contactEmail={contactEmail} setContactEmail={setContactEmail} />
          <div className={styles.fieldGrid}>
            <ColorField label="Foreground" value={foreground} onChange={setForeground} />
            <ColorField label="Background" value={background} onChange={setBackground} />
            <label className={styles.field}>Error correction<select value={errorCorrection} onChange={(event) => setErrorCorrection(event.target.value as typeof errorCorrection)}><option value="L">L · 7%</option><option value="M">M · 15%</option><option value="Q">Q · 25%</option><option value="H">H · 30%</option></select></label>
            <label className={styles.field}>Quiet-zone margin <output>{qrMargin}</output><input type="range" min="0" max="10" value={qrMargin} onChange={(event) => setQrMargin(Number(event.target.value))} /></label>
          </div>
          <label className={styles.logoUpload}><FileImage size={16} /><span>{logoData ? "Replace center logo" : "Add center logo"}<small>PNG, JPEG, or WebP · max 2 MB</small></span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadLogo(event.target.files?.[0])} /></label>
          {logoData && <button className={styles.removeLogo} onClick={() => setLogoData("")}>Remove logo</button>}
        </> : <>
          <label className={styles.field}>Symbology<select value={barcodeFormat} onChange={(event) => { setBarcodeFormat(event.target.value as BarcodeFormat); setRenderError(null); }}><option value="CODE128">Code 128</option><option value="EAN13">EAN-13</option><option value="UPC">UPC-A</option><option value="CODE39">Code 39</option></select></label>
          <label className={styles.field}>Barcode data<input value={barcodeValue} onChange={(event) => { setBarcodeValue(event.target.value); setRenderError(null); }} placeholder={barcodeFormat === "EAN13" ? "13 digits including check digit" : barcodeFormat === "UPC" ? "12 digits including check digit" : "Enter barcode data"} aria-invalid={Boolean(barcodeError)} aria-describedby={barcodeError ? "barcode-validation" : undefined} /></label>
          {barcodeError && <p id="barcode-validation" className={styles.validation} role="alert">{barcodeError}</p>}
          <ColorField label="Bar color" value={foreground} onChange={setForeground} />
          <ColorField label="Background" value={background} onChange={setBackground} />
          <label className={styles.field}>Bar height <output>{barcodeHeight}px</output><input type="range" min="40" max="180" step="5" value={barcodeHeight} onChange={(event) => setBarcodeHeight(Number(event.target.value))} /></label>
          <label className={styles.field}>Bar width <output>{barWidth}px</output><input type="range" min="1" max="4" step="0.5" value={barWidth} onChange={(event) => setBarWidth(Number(event.target.value))} /></label>
          <label className={styles.checkbox}><input type="checkbox" checked={showBarcodeText} onChange={(event) => setShowBarcodeText(event.target.checked)} /><span>Show human-readable text</span></label>
        </>}
        {mode === "qr" && currentValidation && <p className={styles.validation} role="alert">{currentValidation}</p>}
        <div className={styles.actionRow}><button className={styles.secondaryButton} onClick={clearCurrentCode}><RotateCcw size={15} /> Clear code</button><span><Check size={14} /> Runs offline</span></div>
      </section>

      <section className={styles.previewPanel} aria-label="Live preview">
        <div className={styles.previewHeading}><div><p className="eyebrow">LIVE PREVIEW</p><h2>{mode === "qr" ? "QR code" : barcodeLabels[barcodeFormat]}</h2></div><span className={styles.localStatus}><span /> Local</span></div>
        <div className={styles.previewStage}>
          {mode === "qr" ? <div className={styles.qrPreview}><canvas ref={qrCanvasRef} aria-label="Generated QR code canvas" />{previewSvg && <Image className={styles.svgMini} src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(previewSvg)}`} alt="Vector SVG preview of the QR code" width={120} height={120} unoptimized />}{!canDownload && <span className={styles.emptyOverlay}>Enter valid details to generate</span>}</div> : <div className={styles.barcodePreview}><svg ref={barcodeSvgRef} aria-label="Generated barcode vector preview" /><canvas ref={barcodeCanvasRef} aria-label="Generated barcode canvas preview" />{!canDownload && <span className={styles.emptyOverlay}>Enter valid data to generate</span>}</div>}
        </div>
        <div className={styles.downloadRow}><button className={styles.downloadButton} onClick={() => mode === "qr" ? void downloadQrPng() : void downloadBarcodePng()} disabled={!canDownload}><Download size={16} /> Download PNG · 2000 px</button><button className={styles.secondaryButton} onClick={downloadSvg} disabled={!canDownload}><Download size={15} /> Download SVG</button></div>
        <RecoveryPanel recovery={recovery} onRetry={retryRender} onClear={clearCurrentCode} />
        <div className={styles.recoveryClause}><h3>Error Handling &amp; Recovery</h3><p>Rendering and export errors are caught and explained with next steps. Try a shorter payload, a supported format, a smaller logo, or retry after clearing the current code.</p></div>
      </section>
    </div>
  </section>;
}

function QrFields(props: {
  kind: QrKind; textValue: string; setTextValue: (value: string) => void; ssid: string; setSsid: (value: string) => void;
  wifiPassword: string; setWifiPassword: (value: string) => void; wifiSecurity: "WPA" | "WEP" | "nopass"; setWifiSecurity: (value: "WPA" | "WEP" | "nopass") => void;
  upiAddress: string; setUpiAddress: (value: string) => void; upiName: string; setUpiName: (value: string) => void; upiAmount: string; setUpiAmount: (value: string) => void; upiNote: string; setUpiNote: (value: string) => void;
  firstName: string; setFirstName: (value: string) => void; lastName: string; setLastName: (value: string) => void; contactPhone: string; setContactPhone: (value: string) => void; contactEmail: string; setContactEmail: (value: string) => void;
}) {
  if (props.kind === "text") return <label className={styles.field}>URL or text<textarea rows={4} value={props.textValue} onChange={(event) => props.setTextValue(event.target.value)} placeholder="https://example.com or any text" /></label>;
  if (props.kind === "wifi") return <div className={styles.formFields}><label className={styles.field}>Network name (SSID)<input value={props.ssid} onChange={(event) => props.setSsid(event.target.value)} autoComplete="off" /></label><label className={styles.field}>Security<select value={props.wifiSecurity} onChange={(event) => props.setWifiSecurity(event.target.value as typeof props.wifiSecurity)}><option value="WPA">WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">Open network</option></select></label>{props.wifiSecurity !== "nopass" && <label className={styles.field}>Password<input type="password" value={props.wifiPassword} onChange={(event) => props.setWifiPassword(event.target.value)} autoComplete="new-password" /></label>}</div>;
  if (props.kind === "upi") return <div className={styles.formFields}><label className={styles.field}>UPI ID<input value={props.upiAddress} onChange={(event) => props.setUpiAddress(event.target.value)} placeholder="name@bank" /></label><label className={styles.field}>Payee name<input value={props.upiName} onChange={(event) => props.setUpiName(event.target.value)} /></label><div className={styles.fieldGrid}><label className={styles.field}>Amount (INR)<input type="number" min="0.01" step="0.01" value={props.upiAmount} onChange={(event) => props.setUpiAmount(event.target.value)} /></label><label className={styles.field}>Payment note<input value={props.upiNote} onChange={(event) => props.setUpiNote(event.target.value)} /></label></div></div>;
  return <div className={styles.formFields}><div className={styles.fieldGrid}><label className={styles.field}>First name<input value={props.firstName} onChange={(event) => props.setFirstName(event.target.value)} /></label><label className={styles.field}>Last name<input value={props.lastName} onChange={(event) => props.setLastName(event.target.value)} /></label></div><label className={styles.field}>Phone<input type="tel" value={props.contactPhone} onChange={(event) => props.setContactPhone(event.target.value)} /></label><label className={styles.field}>Email<input type="email" value={props.contactEmail} onChange={(event) => props.setContactEmail(event.target.value)} /></label></div>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className={styles.colorField}><span>{label}</span><input type="color" value={value} onChange={(event) => onChange(event.target.value)} /><code>{value.toUpperCase()}</code></label>;
}

function RecoveryPanel({ recovery, onRetry, onClear }: { recovery: RecoveryState | null; onRetry: () => void; onClear: () => void }) {
  if (!recovery) return null;
  return <section className={styles.recoveryPanel} role="alert"><h3>What went wrong</h3><p>{recovery.message}</p><h4>What to do next</h4><ol>{recovery.steps.map((step) => <li key={step}>{step}</li>)}</ol><div><button className={styles.secondaryButton} onClick={onClear}>Clear code/canvas</button><button className={styles.secondaryButton} onClick={onRetry}>Retry render</button></div></section>;
}

function KindIcon({ kind }: { kind: QrKind }) {
  if (kind === "wifi") return <Wifi size={15} />;
  if (kind === "upi") return <Link2 size={15} />;
  if (kind === "vcard") return <UserRound size={15} />;
  return <QrCode size={15} />;
}

function createQrPayload(kind: QrKind, values: {
  textValue: string; ssid: string; wifiPassword: string; wifiSecurity: string; upiAddress: string; upiName: string; upiAmount: string; upiNote: string;
  firstName: string; lastName: string; contactPhone: string; contactEmail: string;
}) {
  let value = "";
  let error = "";
  if (kind === "text") {
    value = values.textValue.trim();
    if (!value) error = "Enter a URL or text to make a QR code.";
  } else if (kind === "wifi") {
    if (!values.ssid.trim()) error = "Enter the Wi-Fi network name (SSID).";
    else if (values.wifiSecurity !== "nopass" && !values.wifiPassword) error = "Enter a password or choose an open Wi-Fi network.";
    else if (values.wifiSecurity === "WPA" && values.wifiPassword.length < 8) error = "WPA passwords must be at least 8 characters.";
    else value = `WIFI:T:${values.wifiSecurity};S:${wifiEscape(values.ssid.trim())};${values.wifiSecurity === "nopass" ? "" : `P:${wifiEscape(values.wifiPassword)};`};;`;
  } else if (kind === "upi") {
    if (!/^[\w.-]+@[\w.-]+$/.test(values.upiAddress.trim())) error = "Enter a valid UPI ID, such as name@bank.";
    else if (!values.upiName.trim()) error = "Enter the payee name for this UPI payment link.";
    else if (!values.upiAmount || !Number.isFinite(Number(values.upiAmount)) || Number(values.upiAmount) <= 0) error = "Enter a payment amount greater than zero.";
    else {
      const params = new URLSearchParams({ pa: values.upiAddress.trim(), pn: values.upiName.trim(), am: Number(values.upiAmount).toFixed(2), cu: "INR" });
      if (values.upiNote.trim()) params.set("tn", values.upiNote.trim());
      value = `upi://pay?${params.toString()}`;
    }
  } else {
    const fullName = `${values.firstName.trim()} ${values.lastName.trim()}`.trim();
    if (!fullName) error = "Enter a first or last name for the contact card.";
    else {
      const lines = ["BEGIN:VCARD", "VERSION:3.0", `N:${vcardEscape(values.lastName)};${vcardEscape(values.firstName)};;;`, `FN:${vcardEscape(fullName)}`];
      if (values.contactPhone.trim()) lines.push(`TEL;TYPE=CELL:${vcardEscape(values.contactPhone)}`);
      if (values.contactEmail.trim()) lines.push(`EMAIL:${vcardEscape(values.contactEmail)}`);
      lines.push("END:VCARD");
      value = lines.join("\r\n");
    }
  }
  if (!error && new TextEncoder().encode(value).length > 5000) error = "This QR payload is too large for reliable scanning.";
  return { value, error };
}

function validateBarcode(format: BarcodeFormat, value: string) {
  if (!value.trim()) return "Enter barcode data to preview and download.";
  if (format === "EAN13") {
    if (!/^\d{13}$/.test(value)) return "EAN-13 requires exactly 13 digits, including its check digit.";
    if (!validCheckDigit(value, 3)) return "The EAN-13 check digit is invalid. Check the first 12 digits or correct the final digit.";
  }
  if (format === "UPC") {
    if (!/^\d{12}$/.test(value)) return "UPC-A requires exactly 12 digits, including its check digit.";
    if (!validCheckDigit(value, 1)) return "The UPC-A check digit is invalid. Check the first 11 digits or correct the final digit.";
  }
  if (format === "CODE39" && !/^[0-9A-Z .\-$\/+%]+$/.test(value)) return "Code 39 accepts uppercase A-Z, digits, spaces, and these symbols: - . $ / + %.";
  if (format === "CODE128" && !/^[\x20-\x7E]+$/.test(value)) return "Code 128 accepts printable ASCII characters only.";
  return "";
}

function validCheckDigit(value: string, weight: 1 | 3) {
  const digits = value.slice(0, -1).split("").map(Number);
  const sum = digits.reduce((total, digit, index) => total + digit * (weight === 3 ? index % 2 === 0 ? 1 : 3 : index % 2 === 0 ? 3 : 1), 0);
  return (10 - sum % 10) % 10 === Number(value.at(-1));
}

function wifiEscape(value: string) {
  return value.replace(/[\\;,:\"]/g, "\\$&");
}

function vcardEscape(value: string) {
  return value.trim().replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

async function addLogoToSvg(svg: string, logoData: string, background: string) {
  const match = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!match) throw new Error("The QR renderer returned an unsupported SVG format.");
  const width = Number(match[1]);
  const height = Number(match[2]);
  const size = Math.min(width, height) * 0.2;
  const x = (width - size) / 2;
  const y = (height - size) / 2;
  const logo = `<rect x="${x - size * 0.12}" y="${y - size * 0.12}" width="${size * 1.24}" height="${size * 1.24}" rx="${size * 0.12}" fill="${background}"/><image href="${logoData}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
  return svg.replace("</svg>", `${logo}</svg>`);
}

async function drawLogoOnCanvas(canvas: HTMLCanvasElement, logoData: string, background: string) {
  const image = await loadImage(logoData);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not open a canvas context for the logo.");
  const size = Math.round(Math.min(canvas.width, canvas.height) * 0.2);
  const x = Math.round((canvas.width - size) / 2);
  const y = Math.round((canvas.height - size) / 2);
  const padding = Math.round(size * 0.12);
  context.fillStyle = background;
  context.fillRect(x - padding, y - padding, size + padding * 2, size + padding * 2);
  context.drawImage(image, x, y, size, size);
}

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("The browser could not read this image file."));
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The uploaded logo had no readable image data."));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = document.createElement("img");
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The image could not be decoded. Try exporting it as PNG or JPEG."));
    image.src = source;
  });
}

function recoveryFor(error: unknown, action: string): RecoveryState {
  const message = error instanceof Error ? error.message : String(error || "Unknown rendering error.");
  if (/too large|overflow|out of memory|memory|quota/i.test(message)) return { message: `${action} could not be rendered because the payload or image exceeded browser memory limits.`, steps: ["Shorten the text or remove optional fields.", "Remove the center logo or upload a smaller image.", "Choose error correction L or M for a smaller QR code, then retry."] };
  if (/format|character|invalid|digits|length/i.test(message)) return { message: `${action} data does not match the selected format. ${message}`, steps: ["Check the required character set and digit count.", "Select a compatible symbology or QR type.", "Correct the data and retry the render."] };
  if (/canvas|context|tainted|security/i.test(message)) return { message: `The browser could not render ${action} to canvas. ${message}`, steps: ["Clear the current code and retry.", "Use a supported browser with canvas enabled.", "If a logo is used, upload a local PNG or JPEG under 2 MB."] };
  return { message: `${action} failed to render. ${message}`, steps: ["Check the entered data and selected format.", "Clear the current code and retry.", "If it continues, reduce the payload or logo dimensions."] };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}