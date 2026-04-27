# Local dev against Cloud SQL — developer setup

Use this once to get the proxy and cloud dev server running. All commands work on Windows, Mac, and Linux via `npm run`. Mac/Linux users can also use the equivalent `make` commands.

## Quick start (you already received DB credentials)

If the project owner has already sent you your Cloud SQL username and password, do this:

1. Install gcloud CLI (if needed): https://cloud.google.com/sdk/docs/install
2. Sign in:

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project cloud-computing-485217
gcloud config get-value project
```

The last command should print `cloud-computing-485217`.

3. From the repo root, create your local env file:

**Mac / Linux:**

```bash
cp .env.cloudsql.example .env.cloudsql
```

**Windows (PowerShell):**

```powershell
Copy-Item .env.cloudsql.example .env.cloudsql
```

4. Edit `.env.cloudsql` and set:

```
DB_USER=<your-assigned-username>
DB_PASSWORD=<your-assigned-password>
```

5. Install dependencies and proxy:

```bash
npm install
npm run install-proxy  # or: make install-proxy
```

6. Start the proxy in terminal 1:

```bash
npm run proxy  # or: make proxy
```

7. Optional one-time DB setup (schema/migrations) in terminal 2:

```bash
npm run cloud-setup  # or: make cloud-setup
```

8. Start the API in terminal 2:

```bash
npm run cloud-dev  # or: make cloud-dev
```

## Prerequisites

- Your Google account has IAM roles in GCP (Cloud SQL Client, Cloud Run Viewer, Cloud SQL Viewer).
- You have a Cloud SQL database username and password from the project owner.

If you don't have both of these, ask the project owner before continuing.

---

## Troubleshooting

| Symptom                                      | Likely cause                            | Fix                                                            |
| -------------------------------------------- | --------------------------------------- | -------------------------------------------------------------- |
| `proxy: permission denied`                   | Proxy binary not executable             | Re-run `npm run install-proxy`                                 |
| `Error: connect ECONNREFUSED 127.0.0.1:5434` | Proxy not running                       | Start `npm run proxy` in another terminal first                |
| `password authentication failed`             | Wrong DB_USER or DB_PASSWORD            | Check `.env.cloudsql` — use the credentials the admin gave you |
| `IAM permission denied`                      | Application default credentials not set | Re-run `gcloud auth application-default login`                 |
| `CLOUDSQL_INSTANCE is empty`                 | `.env.cloudsql` missing or malformed    | Check the file exists and `GCP_CLOUDSQL_INSTANCE=` is set      |
