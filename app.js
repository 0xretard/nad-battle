// Enhanced Boss Battle Game JavaScript
const contractAddress = "0x3b2628e38dd17fbe9e04d8a86272e26c111db06f";
const contractABI = [
    {
        "inputs": [{"internalType": "string","name": "username","type": "string"}],
        "name": "attack",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "currentHP",
        "outputs": [{"internalType": "uint256","name":"","type":"uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTotalAttacks",
        "outputs": [{"internalType": "uint256","name":"","type":"uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTotalDamageDealt", 
        "outputs": [{"internalType": "uint256","name":"","type":"uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address","name": "player","type": "address"}],
        "name": "getPlayerContribution",
        "outputs": [{"internalType": "uint256","name":"","type":"uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getBossStatus",
        "outputs": [{"internalType": "string","name":"","type":"string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": false,"internalType": "string","name": "username","type": "string"},
            {"indexed": false,"internalType": "uint256","name": "damage","type": "uint256"},
            {"indexed": false,"internalType": "uint256","name": "newHP","type": "uint256"},
            {"indexed": true,"internalType": "address","name": "attacker","type": "address"},
            {"indexed": false,"internalType": "uint256","name": "totalAttacksNow","type": "uint256"}
        ],
        "name": "AttackEvent",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": false,"internalType": "string","name": "finalAttacker","type": "string"},
            {"indexed": false,"internalType": "uint256","name": "totalAttacks","type": "uint256"},
            {"indexed": false,"internalType": "uint256","name": "totalDamage","type": "uint256"}
        ],
        "name": "BossDefeated",
        "type": "event"
    }
];

let web3;
let contract;
let userAccount = null;
let lastSavedUsername = "";

// Create animated stars
function createStars() {
    const starsContainer = document.getElementById('stars');
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
    }
}

async function init() {
    createStars();
    
    // Check if wallet was previously connected
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_accounts' // Gets accounts without prompting
            });
            
            if (accounts.length > 0) {
                // Auto-connect if previously connected
                web3 = new Web3(window.ethereum);
                userAccount = accounts[0];
                contract = new web3.eth.Contract(contractABI, contractAddress);
                
                // Load saved username
                loadSavedUsername();
                
                updateConnectionStatus();
                updateAllStats();
                subscribeToEvents();
                enableGameControls();
                
                // Start real-time updates
                startRealTimeUpdates();
            } else {
                updateConnectionStatus();
            }
        } catch (error) {
            console.error("Auto-connect failed:", error);
            updateConnectionStatus();
        }
    } else {
        updateConnectionStatus();
    }
}

function loadSavedUsername() {
    if (userAccount) {
        const savedName = localStorage.getItem(`username_${userAccount}`);
        if (savedName) {
            lastSavedUsername = savedName;
            document.getElementById("username").value = savedName;
        }
    }
}

function saveUsername(username) {
    if (userAccount && username) {
        localStorage.setItem(`username_${userAccount}`, username);
        lastSavedUsername = username;
    }
}

function enableGameControls() {
    document.getElementById("username").disabled = false;
    document.getElementById("attack-btn").disabled = false;
}

function disableGameControls() {
    document.getElementById("username").disabled = true;
    document.getElementById("attack-btn").disabled = true;
}

// Real-time updates every 10 seconds
let updateInterval;

function startRealTimeUpdates() {
    // Clear any existing interval
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    // Update every 10 seconds
    updateInterval = setInterval(() => {
        if (contract && userAccount) {
            updateAllStats();
        }
    }, 10000);
}

function stopRealTimeUpdates() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

async function connectWallet() {
    if (window.ethereum) {
        try {
            // Request account access
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            web3 = new Web3(window.ethereum);
            userAccount = accounts[0];
            
            // Initialize contract
            contract = new web3.eth.Contract(contractABI, contractAddress);
            
            // Load saved username
            loadSavedUsername();
            
            updateConnectionStatus();
            updateAllStats();
            subscribeToEvents();
            enableGameControls();
            
            // Start real-time updates
            startRealTimeUpdates();
            
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            alert("❌ Failed to connect wallet: " + error.message);
        }
    } else {
        alert("⚠️ Please install MetaMask to join the battle!");
        window.open("https://metamask.io/", "_blank");
    }
}

function updateConnectionStatus() {
    const statusElement = document.getElementById("wallet-status");
    const connectBtn = document.getElementById("connect-wallet-btn");
    
    if (userAccount) {
        statusElement.textContent = `Connected: ${userAccount.slice(0,6)}...${userAccount.slice(-4)}`;
        statusElement.className = "connected";
        connectBtn.textContent = "✅ WALLET CONNECTED";
        connectBtn.disabled = true;
    } else {
        statusElement.textContent = "Not Connected";
        statusElement.className = "disconnected";
        connectBtn.textContent = "🔗 CONNECT WALLET";
        connectBtn.disabled = false;
    }
}

async function updateAllStats() {
    try {
        // Get all stats from contract
        const hp = await contract.methods.currentHP().call();
        const totalAttacks = await contract.methods.getTotalAttacks().call();
        const totalDamage = await contract.methods.getTotalDamageDealt().call();
        const bossStatus = await contract.methods.getBossStatus().call();
        
        // Update HP display
        const formattedHP = parseInt(hp).toLocaleString();
        document.getElementById("hp-text").innerText = "HP: " + formattedHP;
        const fillPercent = (hp / 10000000) * 100;
        document.getElementById("hp-fill").style.width = fillPercent + "%";
        
        // Update global stats
        document.getElementById("global-attacks").textContent = parseInt(totalAttacks).toLocaleString();
        document.getElementById("total-damage").textContent = parseInt(totalDamage).toLocaleString();
        document.getElementById("boss-status").innerHTML = getStatusEmoji(bossStatus) + " " + bossStatus;
        
        // Update user contribution if connected
        if (userAccount) {
            const userContribution = await contract.methods.getPlayerContribution(userAccount).call();
            document.getElementById("user-damage").textContent = parseInt(userContribution).toLocaleString();
        }
        
    } catch (error) {
        console.error("Error updating stats:", error);
    }
}

function getStatusEmoji(status) {
    switch(status) {
        case "RAGING": return "🔥";
        case "ANGRY": return "😤"; 
        case "WEAKENING": return "😰";
        case "CRITICAL": return "💀";
        case "DEFEATED": return "☠️";
        default: return "🔥";
    }
}

function subscribeToEvents() {
    // Listen for attack events
    contract.events.AttackEvent().on("data", (event) => {
        const { username, damage, newHP, attacker, totalAttacksNow } = event.returnValues;
        
        // Show damage indicator
        showDamageIndicator(damage);
        
        // Shake boss on hit
        shakeBoss();
        
        // Update all stats immediately when event received
        setTimeout(() => updateAllStats(), 1000); // Small delay to ensure blockchain is updated
    });
    
    // Listen for boss defeated event
    contract.events.BossDefeated().on("data", (event) => {
        const { finalAttacker, totalAttacks, totalDamage } = event.returnValues;
        showVictoryBanner(finalAttacker);
        // Update stats after victory
        setTimeout(() => updateAllStats(), 1000);
    });
}

function showDamageIndicator(damage) {
    const indicator = document.createElement('div');
    indicator.className = 'damage-indicator';
    indicator.textContent = `-${parseInt(damage).toLocaleString()}`;
    indicator.style.left = (Math.random() * 300 + 100) + 'px';
    indicator.style.top = '200px';
    document.querySelector('.boss-container').appendChild(indicator);
    
    setTimeout(() => indicator.remove(), 2000);
}

function shakeBoss() {
    const boss = document.getElementById("boss-image");
    boss.style.animation = "none";
    boss.style.transform = "translateX(-10px)";
    
    setTimeout(() => {
        boss.style.transform = "translateX(10px)";
    }, 50);
    
    setTimeout(() => {
        boss.style.transform = "translateX(0)";
        boss.style.animation = "bossFloat 3s ease-in-out infinite, bossGlow 4s ease-in-out infinite";
    }, 100);
}

function showVictoryBanner(username) {
    const banner = document.getElementById("winner-banner");
    banner.innerHTML = `🏆 ${username} WON! 🏆<br>🗡️ DELIVERED THE FINAL BLOW! 🗡️`;
    banner.style.display = "block";
    
    // Add celebration effect
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const celebration = document.createElement('div');
            celebration.textContent = '🎉';
            celebration.style.position = 'fixed';
            celebration.style.left = Math.random() * window.innerWidth + 'px';
            celebration.style.top = '-50px';
            celebration.style.fontSize = '2rem';
            celebration.style.animation = 'damageFloat 3s ease-out forwards';
            celebration.style.zIndex = '1001';
            document.body.appendChild(celebration);
            
            setTimeout(() => celebration.remove(), 3000);
        }, i * 100);
    }
    
    setTimeout(() => {
        banner.style.display = "none";
    }, 8000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("connect-wallet-btn").onclick = connectWallet;

    document.getElementById("attack-btn").onclick = async () => {
        if (!userAccount) {
            alert("⚠️ Please connect your wallet first!");
            return;
        }
        
        const username = document.getElementById("username").value.trim();
        if (!username) {
            alert("⚠️ Enter your battle name to attack!");
            return;
        }
        
        // Save username for next time
        saveUsername(username);
        
        const button = document.getElementById("attack-btn");
        const originalText = button.innerHTML;
        button.innerHTML = '⚔️ ATTACKING... <div class="loading"></div>';
        button.disabled = true;
        
        try {
            const tx = await contract.methods.attack(username).send({ from: userAccount });
            console.log("Attack successful:", tx);
            
            // Force immediate update after successful transaction
            setTimeout(() => updateAllStats(), 2000);
            
        } catch (error) {
            console.error("Attack failed:", error);
            alert("❌ Attack failed! " + error.message);
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    };

    // Enhanced enter key support
    document.getElementById("username").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            document.getElementById("attack-btn").click();
        }
    });
});

// Listen for account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            // User disconnected
            userAccount = null;
            disableGameControls();
            stopRealTimeUpdates();
            // Clear saved data for disconnected state
            document.getElementById("username").value = "";
        } else {
            // User switched accounts
            userAccount = accounts[0];
            loadSavedUsername();
            if (contract) {
                updateAllStats();
                startRealTimeUpdates();
            }
        }
        updateConnectionStatus();
    });

    // Listen for network changes
    window.ethereum.on('chainChanged', (chainId) => {
        // Reload page on network change to avoid issues
        window.location.reload();
    });
}

window.onload = init;