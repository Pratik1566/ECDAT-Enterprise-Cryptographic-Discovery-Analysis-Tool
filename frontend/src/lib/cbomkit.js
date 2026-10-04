const proto = location.protocol === 'https:' ? 'wss' : 'ws';
const CBOMKIT_BASE_WS = `${proto}://${location.host}/cbomkit-ws/v1/scan`;

// export async function getLatestCommit(owner, repo, branch = 'main') {
//     const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${branch}`);
//     if (!res.ok) throw new Error('Could not fetch latest commit — check the repo URL');
//     const data = await res.json();
//     return data.sha;
// }

export function scanWithCbomkit(scanUrl, { onProgress } = {}) {

    return new Promise((resolve, reject) => {
        const sessionId = crypto.randomUUID(); // a fresh random ID for this scan
        const socket = new WebSocket(`${CBOMKIT_BASE_WS}/${sessionId}`);

        socket.onopen = () => {
            // socket.send(JSON.stringify({ scanUrl }));
            setTimeout(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ scanUrl }));
                }
            }, 500);
        };

        socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);

            if (msg.type === 'DETECTION' && onProgress) {
                const finding = JSON.parse(msg.message);
                onProgress(`Found: ${finding.name}`);
            }
            if (msg.type === 'CBOM') {
                resolve(JSON.parse(msg.message));
            }
            if (msg.type === 'LABEL' && msg.message === 'Finished') {
                socket.close();
            }
        };

        socket.onerror = (err) => reject(new Error('Could not connect to CBOMkit. Is it running?'));
        socket.onclose = () => reject(new Error('CBOMkit closed the connection before sending a CBOM.'));
    });
}

export async function scanRepo(owner, repo, { onProgress } = {}) {
    // const commit = await getLatestCommit(owner, repo);
    const scanUrl =  `https://github.com/${owner}/${repo}`;
    return scanWithCbomkit(scanUrl, { onProgress }); // your existing function
}