import { scanRepo } from './cbomkit';
const API_URL = 'http://localhost:8080';

function inferType(asset) {
    const n = asset.name.toUpperCase();
    if (n.includes('AES')) return 'Symmetric';
    if (n.includes('RSA') || n.includes('ECDSA') || n.includes('ECDH') || n.includes('DSA') || n === 'EC' || n.startsWith('DH')) return 'Asymmetric';
    if (n.includes('SHA') || n.includes('MD5')) return 'Hash';
    return 'Other';
}

function describeMargin(asset) {
    if(asset.status === 'BROKEN') {
        return 'Already insecure today. Quantum timeing does not matter here.'
    }

    if (!asset.quantumVulnerable) {
        return 'Not affected by quantum attacks, so no migration deadline applies.';
    }
    const m = asset.moscaMargin; // (X + Y) - Z
    return m > 0
        ? `Data and migration outlast quantum arrival by ${m} yrs.`
        : `${-m} yrs of slack before quantum arrival.`;
}
// Converts one backend AssetRisk into the shape sampleResults.json uses,

function toFinding(asset, index) {
    return {
        id: `F-${String(index + 1).padStart(3, '0')}`,
        algorithm: asset.name,
        type: inferType(asset), // refine later if backend adds a real type
        file: asset.location,        // backend doesn't send location yet — see note below
        line: asset.line,
        library: '—',
        severity: mapRiskToSeverity(asset.risk),
        quantum_vulnerable: asset.quantumVulnerable,
        quantum_threat: asset.reason,
        description: `${asset.name} detected in ${asset.location}`,
        snippet: '',
        recommendation: asset.recommendation
            ? {
                algorithm: asset.recommendation.primary,
                family: asset.recommendation.hybrid,
                note: asset.recommendation.tradeoff,
                effort: '—',
            }
            : null,
        // Pre-computed by the backend — the frontend must NOT recalculate this.
        mosca: {
            X: asset.dataLifetimeYears,
            Y: asset.migrationYears,
            Z: asset.yearsToCrqc,
            urgency: {
                key: mapRiskToUrgencyKey(asset.risk),
                label: asset.risk,
                detail: describeMargin(asset),
            },
        },
    };
}

function mapRiskToSeverity(risk) {
    return risk.toLowerCase(); // CRITICAL -> critical, matches SEVERITY_COLORS keys
}

function mapRiskToUrgencyKey(risk) {
    if (risk === 'CRITICAL' || risk === 'HIGH') return 'now';
    if (risk === 'MEDIUM') return 'plan';
    return 'monitor';
}

export async function runScan(files, profile, scenario) {
    const formData = new FormData();
    files.forEach((f) => formData.append('file', f));
    formData.append('profile', profile.id.toUpperCase()); // DEFENSE / FINANCIAL / etc.
    formData.append('z', scenario.Z);

    const res = await fetch(`${API_URL}/api/scans`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`Scan failed: ${res.status}`);
    const data = await res.json();

    return {
        scan_id: `SCAN-${data.id}`,
        scan_metadata: { files_scanned: files.length },
        findings: data.assets.map(toFinding),
    };
}

export async function runScanFromGithub(owner, repo, profile, scenario) {
    const cbom = await scanRepo(owner, repo);
    const blob = new Blob([JSON.stringify(cbom)], { type: 'application/json' });
    const file = new File([blob], 'scan.cbom.json');
    return runScan([file], profile, scenario); // your already-working function, untouched
}