const https = require("https");
const fs = require("fs");
const { execSync } = require("child_process");

const VERSION = "v2.14.3";
const BASE_URL = `https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/${VERSION}/cloud-sql-proxy`;

function getSuffix() {
  const { platform, arch } = process;
  if (platform === "win32") return ".windows.amd64.exe";
  if (platform === "darwin")
    return arch === "arm64" ? ".darwin.arm64" : ".darwin.amd64";
  return ".linux.amd64";
}

const suffix = getSuffix();
const url = BASE_URL + suffix;
const outFile =
  process.platform === "win32" ? "cloud-sql-proxy.exe" : "cloud-sql-proxy";

console.log(`Downloading ${url}`);
console.log(`Saving as: ${outFile}`);

const file = fs.createWriteStream(outFile);

https
  .get(url, (res) => {
    if (res.statusCode === 302 || res.statusCode === 301) {
      https.get(res.headers.location, (res2) => res2.pipe(file));
    } else {
      res.pipe(file);
    }

    file.on("finish", () => {
      file.close();
      if (process.platform !== "win32") {
        execSync(`chmod +x ${outFile}`);
      }
      console.log(`Done. Run: npm run proxy`);
    });
  })
  .on("error", (err) => {
    fs.unlink(outFile, () => {});
    console.error("Download failed:", err.message);
    process.exit(1);
  });
