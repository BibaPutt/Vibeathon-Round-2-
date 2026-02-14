// Initialize JSONBin with all 20 default players
// Run: node init-bin.mjs

const BIN_ID = "6990d154ae596e708f2b0cfd";
const MASTER_KEY = "$2a$10$eB.huE9bnUtgIZzlOXcqu.1ZWzbJGvJb0tAoLibUbdmWdrYsXLcES";

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
        loggedIn: false,
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
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-Master-Key": MASTER_KEY,
        },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log("Bin updated:", JSON.stringify(data, null, 2));
}

init();
