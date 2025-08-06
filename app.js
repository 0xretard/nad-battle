// Enhanced Boss Battle Game JavaScript - FIXED VERSION
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

// Create animated stars and particles
function createStars() {
    const starsContainer = document.getElementById('stars');
    if (!starsContainer) return;
    
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        star.style.animationDuration = (Math.random() * 3 + 2) + 's';
        starsContainer.appendChild(star);
    }
}

function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '2px';
        particle.style.height = '2px';
        particle.style.backgroundColor = Math.random() > 0.5 ? '#ff6b35' : '#00d9ff';
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animation = `float ${Math.random() * 10 + 5}s ease-in-out infinite`;
        particle.style.animationDelay = Math.random() * 5 + 's';
        particle.style.opacity = '0.6';
        particlesContainer.appendChild(particle);
    }
}

async function init() {
    createStars();
    createParticles();
    
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
                await updateAllStats(); // Make sure this completes
                subscribeToEvents();
                enableGameControls();
                
                // Start real-time updates
                startRealTimeUpdates();
            } else {
                updateConnectionStatus();
                // Still update general stats even without wallet connection
                await updateGeneralStats();
            }
        } catch (error) {
            console.error("Auto-connect failed:", error);
            updateConnectionStatus();
            // Try to show general stats anyway
            await updateGeneralStats();
        }
    } else {
        updateConnectionStatus();
        // Try to show general stats anyway
        await updateGeneralStats();
    }
}

// Separate function for general stats that don't require wallet connection
async function updateGeneralStats() {
    if (!window.ethereum) return;
    
    try {
        // Create a temporary web3 instance just for reading public data
        const tempWeb3 = new Web3(window.ethereum);
        const tempContract = new tempWeb3.eth.Contract(contractABI, contractAddress);
        
        // Get general stats
        const hp = await tempContract.methods.currentHP().call();
        const totalAttacks = await tempContract.methods.getTotalAttacks().call();
        const totalDamage = await tempContract.methods.getTotalDamageDealt().call();
        const bossStatus = await tempContract.methods.getBossStatus().call();
        
        // Update HP display
        const formattedHP = parseInt(hp).toLocaleString();
        document.getElementById("hp-text").innerText = "HP: " + formattedHP;
        
        // Update HP percentage
        const maxHP = 10000000;
        const hpPercentage = Math.round((hp / maxHP) * 100);
        const hpPercentageElement = document.getElementById("hp-percentage");
        if (hpPercentageElement) {
            hpPercentageElement.innerText = hpPercentage + "%";
        }
        
        // Update HP bar
        const fillPercent = (hp / maxHP) * 100;
        document.getElementById("hp-fill").style.width = fillPercent + "%";
        
        // Change HP bar color based on percentage
        const hpFill = document.getElementById("hp-fill");
        if (hpPercentage > 60) {
            hpFill.style.background = "linear-gradient(90deg, #4ade80 0%, #22c55e 100%)";
        } else if (hpPercentage > 30) {
            hpFill.style.background = "linear-gradient(90deg, #f59e0b 0%, #ff6b35 100%)";
        } else {
            hpFill.style.background = "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)";
        }
        
        // Update global stats
        document.getElementById("global-attacks").textContent = parseInt(totalAttacks).toLocaleString();
        document.getElementById("total-damage").textContent = parseInt(totalDamage).toLocaleString();
        document.getElementById("boss-status").innerHTML = getStatusEmoji(bossStatus) + " " + bossStatus;
        
    } catch (error) {
        console.error("Error updating general stats:", error);
    }
}

function loadSavedUsername() {
    if (userAccount) {
        const savedName = localStorage.getItem(`username_${userAccount}`);
        if (savedName) {
            lastSavedUsername = savedName;
            const usernameInput = document.getElementById("username");
            if (usernameInput) {
                usernameInput.value = savedName;
            }
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
    const usernameInput = document.getElementById("username");
    const attackBtn = document.getElementById("attack-btn");
    
    if (usernameInput) usernameInput.disabled = false;
    if (attackBtn) attackBtn.disabled = false;
}

function disableGameControls() {
    const usernameInput = document.getElementById("username");
    const attackBtn = document.getElementById("attack-btn");
    
    if (usernameInput) usernameInput.disabled = true;
    if (attackBtn) attackBtn.disabled = true;
}

// Real-time updates every 10 seconds
let updateInterval;

function startRealTimeUpdates() {
    // Clear any existing interval
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    // Update every 8 seconds for better responsiveness
    updateInterval = setInterval(async () => {
        if (contract && userAccount) {
            await updateAllStats();
        } else {
            // Update general stats even without wallet
            await updateGeneralStats();
        }
    }, 8000);
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
            await updateAllStats(); // Wait for stats to load
            subscribeToEvents();
            enableGameControls();
            
            // Start real-time updates
            startRealTimeUpdates();
            
            console.log("Wallet connected successfully:", userAccount);
            
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            alert("❌ Failed to connect wallet: " + error.message);
        }
    } else {
        alert("⚠️ Please install MetaMask to join the battle!");
        window.open("https://metamask.io/", "_blank");
    }
}

function disconnectWallet() {
    // Clear user session
    userAccount = null;
    web3 = null;
    contract = null;
    lastSavedUsername = "";
    
    // Clear username input
    const usernameInput = document.getElementById("username");
    if (usernameInput) {
        usernameInput.value = "";
    }
    
    // Reset user damage display
    const userDamageElement = document.getElementById("user-damage");
    if (userDamageElement) {
        userDamageElement.textContent = "0";
    }
    
    // Update UI
    updateConnectionStatus();
    disableGameControls();
    stopRealTimeUpdates();
    
    // Continue showing general stats
    updateGeneralStats();
    
    console.log("Wallet disconnected");
}

function updateConnectionStatus() {
    const statusElement = document.getElementById("wallet-status");
    const connectBtn = document.getElementById("connect-wallet-btn");
    const disconnectBtn = document.getElementById("disconnect-wallet-btn");
    
    if (userAccount && statusElement && connectBtn) {
        statusElement.textContent = `Connected: ${userAccount.slice(0,6)}...${userAccount.slice(-4)}`;
        statusElement.className = "wallet-status connected";
        
        connectBtn.style.display = "none";
        if (disconnectBtn) disconnectBtn.style.display = "flex";
        
        // Update button text to show connected status
        connectBtn.innerHTML = `
            <span class="btn-icon">✅</span>
            <span class="btn-text">WALLET CONNECTED</span>
        `;
        connectBtn.disabled = true;
    } else if (statusElement && connectBtn) {
        statusElement.textContent = "Not Connected";
        statusElement.className = "wallet-status disconnected";
        
        connectBtn.style.display = "flex";
        if (disconnectBtn) disconnectBtn.style.display = "none";
        
        connectBtn.innerHTML = `
            <span class="btn-icon">🔗</span>
            <span class="btn-text">CONNECT WALLET</span>
        `;
        connectBtn.disabled = false;
    }
}

async function updateAllStats() {
    try {
        console.log("Updating all stats..."); // Debug log
        
        if (!contract) {
            console.log("No contract available, updating general stats only");
            await updateGeneralStats();
            return;
        }
        
        // Get all stats from contract
        const [hp, totalAttacks, totalDamage, bossStatus] = await Promise.all([
            contract.methods.currentHP().call(),
            contract.methods.getTotalAttacks().call(),
            contract.methods.getTotalDamageDealt().call(),
            contract.methods.getBossStatus().call()
        ]);
        
        // Update HP display
        const formattedHP = parseInt(hp).toLocaleString();
        const hpTextElement = document.getElementById("hp-text");
        if (hpTextElement) {
            hpTextElement.innerText = "HP: " + formattedHP;
        }
        
        // Update HP percentage
        const maxHP = 10000000;
        const hpPercentage = Math.round((hp / maxHP) * 100);
        const hpPercentageElement = document.getElementById("hp-percentage");
        if (hpPercentageElement) {
            hpPercentageElement.innerText = hpPercentage + "%";
        }
        
        // Update HP bar
        const fillPercent = (hp / maxHP) * 100;
        const hpFillElement = document.getElementById("hp-fill");
        if (hpFillElement) {
            hpFillElement.style.width = fillPercent + "%";
            
            // Change HP bar color based on percentage
            if (hpPercentage > 60) {
                hpFillElement.style.background = "linear-gradient(90deg, #4ade80 0%, #22c55e 100%)";
            } else if (hpPercentage > 30) {
                hpFillElement.style.background = "linear-gradient(90deg, #f59e0b 0%, #ff6b35 100%)";
            } else {
                hpFillElement.style.background = "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)";
            }
        }
        
        // Update global stats
        const globalAttacksElement = document.getElementById("global-attacks");
        const totalDamageElement = document.getElementById("total-damage");
        const bossStatusElement = document.getElementById("boss-status");
        
        if (globalAttacksElement) {
            globalAttacksElement.textContent = parseInt(totalAttacks).toLocaleString();
        }
        if (totalDamageElement) {
            totalDamageElement.textContent = parseInt(totalDamage).toLocaleString();
        }
        if (bossStatusElement) {
            bossStatusElement.innerHTML = getStatusEmoji(bossStatus) + " " + bossStatus;
        }
        
        // Update user contribution if connected and wallet available
        if (userAccount && contract) {
            console.log("Updating user contribution for:", userAccount); // Debug log
            try {
                const userContribution = await contract.methods.getPlayerContribution(userAccount).call();
                const userDamageElement = document.getElementById("user-damage");
                if (userDamageElement) {
                    const formattedContribution = parseInt(userContribution).toLocaleString();
                    userDamageElement.textContent = formattedContribution;
                    console.log("User contribution updated:", formattedContribution); // Debug log
                }
            } catch (error) {
                console.error("Error getting user contribution:", error);
                // Don't fail the whole update if user contribution fails
                const userDamageElement = document.getElementById("user-damage");
                if (userDamageElement && userDamageElement.textContent === "") {
                    userDamageElement.textContent = "0";
                }
            }
        }
        
        console.log("Stats updated successfully"); // Debug log
        
    } catch (error) {
        console.error("Error updating stats:", error);
        // Fallback to general stats if full update fails
        await updateGeneralStats();
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
    if (!contract) return;
    
    try {
        // Listen for attack events
        contract.events.AttackEvent().on("data", (event) => {
            const { username, damage, newHP, attacker, totalAttacksNow } = event.returnValues;
            
            console.log("Attack event received:", { username, damage, attacker }); // Debug log
            
            // Show damage indicator
            showDamageIndicator(damage);
            
            // Shake boss on hit
            shakeBoss();
            
            // Create screen shake effect
            createScreenShake();
            
            // Update all stats immediately when event received
            setTimeout(async () => {
                await updateAllStats();
            }, 2000); // Increased delay to ensure blockchain state is updated
        });
        
        // Listen for boss defeated event
        contract.events.BossDefeated().on("data", (event) => {
            const { finalAttacker, totalAttacks, totalDamage } = event.returnValues;
            showVictoryBanner(finalAttacker);
            // Update stats after victory
            setTimeout(async () => {
                await updateAllStats();
            }, 2000);
        });
        
        console.log("Event listeners set up successfully");
        
    } catch (error) {
        console.error("Error setting up event listeners:", error);
    }
}

function showDamageIndicator(damage) {
    const bossContainer = document.querySelector('.boss-container');
    if (!bossContainer) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'damage-indicator';
    indicator.textContent = `-${parseInt(damage).toLocaleString()}`;
    indicator.style.left = (Math.random() * 300 + 100) + 'px';
    indicator.style.top = '200px';
    bossContainer.appendChild(indicator);
    
    setTimeout(() => indicator.remove(), 2000);
}

function shakeBoss() {
    const boss = document.getElementById("boss-image");
    if (!boss) return;
    
    const originalAnimation = boss.style.animation;
    
    boss.style.animation = "none";
    boss.style.transform = "translateX(-15px)";
    
    setTimeout(() => {
        boss.style.transform = "translateX(15px)";
    }, 50);
    
    setTimeout(() => {
        boss.style.transform = "translateX(-10px)";
    }, 100);
    
    setTimeout(() => {
        boss.style.transform = "translateX(10px)";
    }, 150);
    
    setTimeout(() => {
        boss.style.transform = "translateX(0)";
        boss.style.animation = originalAnimation;
    }, 200);
}

function createScreenShake() {
    const gameContainer = document.getElementById("game-container");
    if (!gameContainer) return;
    
    gameContainer.style.animation = "screenShake 0.3s ease-in-out";
    
    setTimeout(() => {
        gameContainer.style.animation = "";
    }, 300);
}

function showVictoryBanner(username) {
    const banner = document.getElementById("winner-banner");
    if (!banner) return;
    
    banner.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 10px;">🏆 VICTORY! 🏆</div>
        <div style="font-size: 1.2rem;">${username} delivered the final blow!</div>
        <div style="font-size: 0.9rem; margin-top: 10px; opacity: 0.8;">The boss has been defeated!</div>
    `;
    banner.style.display = "block";
    
    // Add celebration effect
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const celebration = document.createElement('div');
            celebration.textContent = ['🎉', '🎊', '✨', '🌟', '💫'][Math.floor(Math.random() * 5)];
            celebration.style.position = 'fixed';
            celebration.style.left = Math.random() * window.innerWidth + 'px';
            celebration.style.top = '-50px';
            celebration.style.fontSize = '2rem';
            celebration.style.animation = 'damageFloat 4s ease-out forwards';
            celebration.style.zIndex = '1001';
            celebration.style.pointerEvents = 'none';
            document.body.appendChild(celebration);
            
            setTimeout(() => celebration.remove(), 4000);
        }, i * 150);
    }
    
    setTimeout(() => {
        banner.style.display = "none";
    }, 10000);
}

// Enhanced attack function with better feedback
async function performAttack() {
    if (!userAccount) {
        alert("⚠️ Please connect your wallet first!");
        return;
    }
    
    if (!contract) {
        alert("⚠️ Contract not initialized. Please refresh and try again.");
        return;
    }
    
    const usernameInput = document.getElementById("username");
    if (!usernameInput) {
        alert("⚠️ Username input not found!");
        return;
    }
    
    const username = usernameInput.value.trim();
    if (!username) {
        alert("⚠️ Enter your battle name to attack!");
        return;
    }
    
    // Save username for next time
    saveUsername(username);
    
    const button = document.getElementById("attack-btn");
    if (!button) return;
    
    const originalHTML = button.innerHTML;
    
    // Enhanced loading state
    button.innerHTML = `
        <span class="attack-icon">⚔️</span>
        <span class="attack-text">ATTACKING...</span>
        <div class="loading"></div>
    `;
    button.disabled = true;
    button.style.transform = "scale(0.98)";
    
    try {
        console.log("Sending attack transaction..."); // Debug log
        
        const tx = await contract.methods.attack(username).send({ from: userAccount });
        console.log("Attack successful:", tx);
        
        // Success feedback
        button.innerHTML = `
            <span class="attack-icon">✅</span>
            <span class="attack-text">HIT CONFIRMED!</span>
        `;
        
        // Force immediate update after successful transaction
        setTimeout(async () => {
            await updateAllStats();
        }, 3000); // Increased delay for better reliability
        
    } catch (error) {
        console.error("Attack failed:", error);
        
        // Error feedback
        button.innerHTML = `
            <span class="attack-icon">❌</span>
            <span class="attack-text">ATTACK FAILED</span>
        `;
        
        // Show detailed error message
        let errorMessage = "Attack failed! ";
        if (error.message.includes("User denied")) {
            errorMessage += "Transaction was cancelled.";
        } else if (error.message.includes("insufficient funds")) {
            errorMessage += "Insufficient gas fees.";
        } else {
            errorMessage += error.message;
        }
        alert("❌ " + errorMessage);
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.disabled = false;
            button.style.transform = "";
        }, 2000);
        return;
    }
    
    // Reset button after success
    setTimeout(() => {
        button.innerHTML = originalHTML;
        button.disabled = false;
        button.style.transform = "";
    }, 2000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Connect wallet button
    const connectBtn = document.getElementById("connect-wallet-btn");
    if (connectBtn) {
        connectBtn.onclick = connectWallet;
    }
    
    // Disconnect wallet button
    const disconnectBtn = document.getElementById("disconnect-wallet-btn");
    if (disconnectBtn) {
        disconnectBtn.onclick = disconnectWallet;
    }
    
    // Attack button
    const attackBtn = document.getElementById("attack-btn");
    if (attackBtn) {
        attackBtn.onclick = performAttack;
    }

    // Enhanced enter key support
    const usernameInput = document.getElementById("username");
    if (usernameInput) {
        usernameInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                performAttack();
            }
        });
        
        // Add focus effects to input
        usernameInput.addEventListener("focus", () => {
            usernameInput.style.transform = "scale(1.02)";
        });
        
        usernameInput.addEventListener("blur", () => {
            usernameInput.style.transform = "scale(1)";
        });
    }
});

// Enhanced wallet event listeners
if (window.ethereum) {
    window.ethereum.on('accountsChanged', async (accounts) => {
        console.log("Accounts changed:", accounts); // Debug log
        
        if (accounts.length === 0) {
            // User disconnected
            disconnectWallet();
        } else {
            // User switched accounts
            userAccount = accounts[0];
            
            if (contract) {
                loadSavedUsername();
                await updateAllStats();
                startRealTimeUpdates();
            }
            updateConnectionStatus();
        }
    });

    // Listen for network changes
    window.ethereum.on('chainChanged', (chainId) => {
        console.log("Network changed:", chainId);
        // Reload page on network change to avoid issues
        window.location.reload();
    });
    
    // Listen for connection events
    window.ethereum.on('connect', (connectInfo) => {
        console.log('Wallet connected:', connectInfo);
    });
    
    window.ethereum.on('disconnect', (error) => {
        console.log('Wallet disconnected:', error);
        disconnectWallet();
    });
}

// Add CSS animation for screen shake
const style = document.createElement('style');
style.textContent = `
    @keyframes screenShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(180deg); }
    }
`;
document.head.appendChild(style);

// Initialize the game
window.onload = init;