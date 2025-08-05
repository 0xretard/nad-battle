# nad Boss Fight

## How It Works
- Boss starts with 10,000,000 HP.
- Each attack reduces HP by 100.
- When HP hits 0, the attacker is declared the winner and the boss resets.

## Setup
1. Deploy `solidity` on a testnet (using Remix or whatever you use).
2. Copy the deployed contract address into `app.js` (replace YOUR_CONTRACT_ADDRESS).
3. Place `boss.png` (e.g., Monad logo) in the same folder.
4. Open `index.html` in a browser with MetaMask connected to the testnet.

## Features
- Real-time updates using event subscriptions.
- Displays winner’s username when boss is defeated.
- Automatically resets boss HP after a win.

## Requirements
- MetaMask
- Web3.js (already loaded via CDN)