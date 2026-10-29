
# ECDAT — Enterprise Cryptographic Discovery & Analysis Tool

**SIH 2026 · Problem Statement 26164**
Organization: National Technical Research Organisation (NTRO)

ECDAT scans source code for cryptographic assets, assesses their risk against future quantum computers using Mosca's theorem, and recommends post-quantum (PQC) replacements — all through an interactive dashboard.

---

## The problem, in one line

Organizations don't know where vulnerable cryptography lives in their systems — and even when they find it, they don't know how urgent it is to fix.

Quantum computers will eventually break widely-used encryption like RSA and ECC (via Shor's algorithm). Attackers can already steal encrypted data today and decrypt it later once quantum computers mature ("harvest now, decrypt later"). ECDAT helps organizations find their vulnerable cryptography and prioritize what to migrate first.

---

## What this prototype does

1. **Scans** a codebase for cryptographic usage (algorithms, key sizes, hashes) — via a Cryptography Bill of Materials (CBOM), the CycloneDX-based open standard.
2. **Classifies** each finding as quantum-vulnerable, weakened, already-broken, or safe.
3. **Calculates urgency** using **Mosca's theorem**: compares how long data must stay secret (X) plus how long migration takes (Y), against how soon a cryptographically-relevant quantum computer is expected to exist (Z).
4. **Recommends** a NIST-standardized PQC or hybrid replacement (e.g. ML-KEM, ML-DSA) with trade-off notes.
5. **Displays** everything on a dashboard: risk-ranked findings table, charts, and a per-finding drill-down with a Mosca timeline visual.

---

## Architecture

```
Source code repo ──▶ PQCA CBOMkit (Hyperion/Theia) ──▶ CBOM (CycloneDX JSON)
                                                              │
                                                              ▼
                                          ┌───────────────────────────────────┐
                                          │   Risk & Recommendation Engine    │
                                          │   (Java / Spring Boot — ours)     │
                                          │                                   │
                                          │  CBOM Parser → Classifier →       │
                                          │  Mosca Calculator → Recommender   │
                                          └───────────────────┬───────────────┘
                                                              │  REST API
                                                              ▼
                                          Dashboard (React + Recharts — ours)
                                          Upload → Overview → Details
```

We build on **[PQCA CBOMkit](https://github.com/cbomkit/cbomkit)** (Linux Foundation) for scanning. Our contribution is the risk engine — in particular, a **per-asset Mosca's-theorem urgency calculation**, which no other CBOM tool we researched (IBM, Binarly, JFrog, SCANOSS) currently provides.

---

## Repository structure

```
.
├── backend/     Spring Boot API — parser, classifier, Mosca calculator, recommender
├── frontend/    React + Vite dashboard (Upload → Overview → Details)
├── samples/     Sample CBOM files used for testing/demo
└── docs/        Supporting docs (API contract, this README's source, etc.)
```

---

## Running it locally

You'll need **Java 17+** (JDK 21 recommended), **Maven**, **Node.js 18+**, and **npm**.

### 1. Backend

```bash
cd backend
mvn spring-boot:run
```

Starts on `http://localhost:8080`. Health check: `http://localhost:8080/api/health` should return `ok`.

### 2. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Starts on `http://localhost:5173`. Open this in your browser.

### 3. Try it

1. Open `http://localhost:5173`.
2. Upload a sample CBOM file from `samples/` (e.g. `vulnerable-java-app.cbom.json`).
3. Choose a **Profile** (e.g. Defense) and a **Scenario** (e.g. Conservative).
4. Click **Run scan** and explore the Overview and Details pages.

**Try this to see the core idea in action:** run the same file once with **Defense** and once with **Generic** as the profile. The same RSA finding will show as **CRITICAL** under Defense and **LOW** under Generic — same code, same algorithm, different urgency, based on what data it protects.

---

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/scans` | Upload a CBOM file + profile + scenario (Z), runs the risk analysis |
| `GET` | `/api/scans/{id}` | Retrieve results for a previous scan |
| `GET` | `/api/health` | Health check |

---

## Tech stack

| Layer | Technology |
|---|---|
| Scanning | [PQCA CBOMkit](https://github.com/cbomkit/cbomkit) (Hyperion for source code, Theia for binaries/containers/certs) |
| Backend | Java 21, Spring Boot, Jackson |
| CBOM format | CycloneDX (JSON) |
| Frontend | React 18, Vite 5, Recharts 2 |
| Storage | In-memory (prototype) — designed to move to PostgreSQL/SQLite |

---

## Current scope & known limitations (prototype stage)

This is a hackathon prototype built in a short timeframe. Honest limitations:

- **Scanning input:** the demo uses a hand-authored sample CBOM (`samples/vulnerable-java-app.cbom.json`) matching a small Java test file with known crypto usage, in place of a live CBOMkit scan. The parser and downstream pipeline accept any valid CBOM, including real CBOMkit output — this is a data-source choice made under time constraints, not an architectural limitation.
- **Single-file upload:** the current API accepts one CBOM file per scan.
- **Binary/container scanning:** the architecture accounts for this (via CBOMkit's Theia), but the prototype demo only exercises the source-code path.
- **Storage:** in-memory only; scan results don't persist across a backend restart.
- **Severity nuance:** all non-quantum-safe algorithms currently affect Mosca urgency similarly; differentiating "weakened" (e.g. AES-128) from "broken" (e.g. RSA) more granularly is a planned refinement.

## Planned next steps

- Live CBOMkit integration (source repo URL → automatic scan)
- Binary and container image scanning support
- Multi-file / multi-repo scans with an organization-wide view
- Persistent storage (PostgreSQL)
- Per-asset user overrides for data lifetime and migration time

---

## Team

THE ERRORS

## Demo video

https://drive.google.com/file/d/15L5f2ehVATitA73Ka5N_JnEIBFZLWH8z/view?usp=drive_link

# ECDAT-Enterprise-Cryptographic-Discovery-Analysis-Tool

