import { createHash } from "node:crypto";
import { chmod, mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const executableName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
const releaseAssetName = {
  win32: "yt-dlp.exe",
  linux: "yt-dlp_linux",
  darwin: "yt-dlp_macos",
}[process.platform];

if (!releaseAssetName) {
  throw new Error(`yt-dlp is not packaged for platform "${process.platform}".`);
}

const executablePath = join(projectRoot, "node_modules", ".cache", "yt-dlp", executableName);
try {
  const existing = await stat(executablePath);
  if (existing.isFile() && existing.size > 0) {
    process.exit(0);
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "digicybercafe-build",
};

async function fetchOk(url, accept = headers.Accept) {
  const response = await fetch(url, { headers: { ...headers, Accept: accept } });
  if (!response.ok) {
    throw new Error(`yt-dlp download failed (${response.status} ${response.statusText}).`);
  }
  return response;
}

const release = await (await fetchOk("https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest")).json();
const binaryAsset = release.assets?.find((asset) => asset.name === releaseAssetName);
const checksumAsset = release.assets?.find((asset) => asset.name === "SHA2-256SUMS");
if (!binaryAsset || !checksumAsset) {
  throw new Error(`The latest yt-dlp release is missing ${releaseAssetName} or its checksum file.`);
}

const [checksumResponse, binaryResponse] = await Promise.all([
  fetchOk(checksumAsset.browser_download_url, "text/plain"),
  fetchOk(binaryAsset.browser_download_url, "application/octet-stream"),
]);
const checksumText = await checksumResponse.text();
const checksumLine = checksumText
  .split(/\r?\n/)
  .map((line) => line.trim())
  .find((line) => line.endsWith(` ${releaseAssetName}`) || line.endsWith(` *${releaseAssetName}`));
const expectedHash = checksumLine?.match(/^([a-f0-9]{64})\s+/i)?.[1]?.toLowerCase();
if (!expectedHash) {
  throw new Error(`Could not find the SHA-256 checksum for ${releaseAssetName}.`);
}

const binary = Buffer.from(await binaryResponse.arrayBuffer());
const actualHash = createHash("sha256").update(binary).digest("hex");
if (actualHash !== expectedHash) {
  throw new Error("The downloaded yt-dlp executable failed its SHA-256 checksum.");
}

await mkdir(dirname(executablePath), { recursive: true });
const temporaryPath = `${executablePath}.download`;
try {
  await writeFile(temporaryPath, binary);
  if (process.platform !== "win32") {
    await chmod(temporaryPath, 0o755);
  }
  await rename(temporaryPath, executablePath);
} catch (error) {
  await unlink(temporaryPath).catch(() => {});
  throw error;
}

const installed = await readFile(executablePath);
if (installed.length !== binary.length) {
  throw new Error("The installed yt-dlp executable is incomplete.");
}
console.log(`Installed verified yt-dlp ${release.tag_name} for ${process.platform}.`);
