// Initialize npoint with all 20 default players
// Run: node init-npoint.mjs

const NPOINT_URL = "https://api.npoint.io/8ff602c321d69974b882";

function createPlayer(id) {
    return {
        id,
        username: `VB-${id}`,
        status: "idle",
        difficulty: null,
        language: null,
        points: 0,
        assignedProblemId: null,
        completionTime: null,
        startTime: null,
        dragsRemaining: 0,
        totalDrags: 0,
        inCooldown: false,
        cooldownEnd: null,
    };
}

const players = [];
for (let i = 1; i <= 20; i++) {
    players.push(createPlayer(String(i).padStart(3, "0")));
}

const payload = {
    players,
    config: {
        timerDurationSec: 600,
        roundActive: false,
        roundStartTime: null,
        qualifyCount: 10,
    },
};

async function init() {
    const res = await fetch(NPOINT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log("npoint updated:", JSON.stringify(data, null, 2));
}

init();
