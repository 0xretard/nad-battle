// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

contract BossBattle {
    uint256 public constant MAX_HP = 10000000;
    uint256 public constant DAMAGE_PER_ATTACK = 100;
    
    uint256 public currentHP = MAX_HP;
    uint256 public totalAttacks = 0;
    uint256 public totalDamageDealt = 0;
    bool public bossDefeated = false;
    string public finalBlowDealer = "";
    
    // Track individual player contributions
    mapping(address => uint256) public playerDamage;
    mapping(address => string) public playerNames;
    
    event AttackEvent(
        string username, 
        uint256 damage, 
        uint256 newHP,
        address indexed attacker,
        uint256 totalAttacksNow
    );
    
    event BossDefeated(
        string finalAttacker, 
        uint256 totalAttacks, 
        uint256 totalDamage
    );
    
    function attack(string memory username) public {
        require(!bossDefeated, "Boss already defeated!");
        require(bytes(username).length > 0, "Username required");
        require(bytes(username).length <= 32, "Username too long");
        
        uint256 damage = DAMAGE_PER_ATTACK;
        
        // Apply damage
        if (damage >= currentHP) {
            damage = currentHP;
            currentHP = 0;
            bossDefeated = true;
            finalBlowDealer = username;
            
            // Update final stats
            totalAttacks++;
            totalDamageDealt += damage;
            playerDamage[msg.sender] += damage;
            playerNames[msg.sender] = username;
            
            emit AttackEvent(username, damage, currentHP, msg.sender, totalAttacks);
            emit BossDefeated(username, totalAttacks, totalDamageDealt);
        } else {
            currentHP -= damage;
            
            // Update stats
            totalAttacks++;
            totalDamageDealt += damage;
            playerDamage[msg.sender] += damage;
            playerNames[msg.sender] = username;
            
            emit AttackEvent(username, damage, currentHP, msg.sender, totalAttacks);
        }
    }
    
    // Getter functions for frontend
    function getTotalAttacks() public view returns (uint256) {
        return totalAttacks;
    }
    
    function getTotalDamageDealt() public view returns (uint256) {
        return totalDamageDealt;
    }
    
    function getPlayerContribution(address player) public view returns (uint256) {
        return playerDamage[player];
    }
    
    function getBossStatus() public view returns (string memory) {
        if (bossDefeated) return "DEFEATED";
        if (currentHP > 7500000) return "RAGING";
        if (currentHP > 5000000) return "ANGRY"; 
        if (currentHP > 2500000) return "WEAKENING";
        return "CRITICAL";
    }
    
    // Reset function (only if you want to restart the battle)
    function resetBoss() public {
        require(bossDefeated, "Boss not defeated yet");
        currentHP = MAX_HP;
        totalAttacks = 0;
        totalDamageDealt = 0;
        bossDefeated = false;
        finalBlowDealer = "";
    }
}