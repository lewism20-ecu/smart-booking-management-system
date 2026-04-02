const { spawnSync } = require("child_process");
const fs = require("fs");

const envFile = ".env.cloudsql";
if (!fs.existsSync(envFile)) {
  console.error(
    `Error: ${envFile} not found. Copy .env.cloudsql.example and fill in your credentials.`,
  );
  process.exit(1);
}

const content = fs.readFileSync(envFile, "utf8");
const match = content.match(/^GCP_CLOUDSQL_INSTANCE=(.+)$/m);
if (!match) {
  console.error("Error: GCP_CLOUDSQL_INSTANCE not found in .env.cloudsql");
  process.exit(1);
}
const instance = match[1].trim();

const binary =
  process.platform === "win32" ? "cloud-sql-proxy.exe" : "./cloud-sql-proxy";
console.log(`Connecting to Cloud SQL instance: ${instance}`);

const result = spawnSync(binary, ["--port", "5434", instance], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
