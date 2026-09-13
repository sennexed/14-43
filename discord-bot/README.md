# 🛡️ Discord Sentinel AI - Hybrid Moderation Bot for Termux

A high-performance, memory-optimized Discord.js v14 hybrid moderation bot engineered specifically to run 24/7 on an Android device inside **Termux** without choking memory or crashing.

---

## 🚀 Key Architectural Highlights

1. **Dual-Layer Moderation Matrix**:
   - **Layer 1 (<0.2ms)**: Local RegExp engine to immediately catch phishing links, scam tokens, Discord invites, zalgo, and severe slurs. Consumes **0 API tokens** and eliminates latency.
   - **Layer 2 (Decoupled Async)**: Contextual toxicity, harassment, and threat evaluation powered by the Google Gen AI SDK (`@google/genai`) using Gemini Flash.
2. **True Event Loop Decoupling**:
   - All AI calls are dispatched to a non-blocking background queue with worker concurrency limits (`maxConcurrency = 2`). Slash commands and general messages never freeze or lag.
3. **Low-Memory In-Memory Strike Store**:
   - Eliminates heavy databases (Postgres, Mongo, SQLite) that waste RAM and disk I/O on mobile.
   - Native JavaScript `Map` with automatic TTL pruning and 10-minute sweepers.
4. **Discord.js Memory Pruning**:
   - Strips presence caches, message cache limited to 50 items, sweeps idle objects every 5 minutes.
   - Configured to run with `--max-old-space-size=128` (keeps footprint ~60-90MB).
5. **10-Minute Health & Status Watchdog**:
   - Regularly logs RSS, heap consumption, queue throughput, and active strikes to stdout.

---

## 📱 Termux Android Setup Guide

### Step 1: Install Termux
> ⚠️ **Important**: Do **NOT** install Termux from Google Play Store (it is abandoned and has broken repositories). Install it from **F-Droid** or GitHub Releases.

### Step 2: Update Packages & Install Node.js
Open Termux on your phone and run:
```bash
pkg update && pkg upgrade -y
pkg install nodejs-lts git -y
```

Verify your Node version (v20+ recommended):
```bash
node -v
npm -v
```

### Step 3: Acquire Termux Wake Lock (Crucial)
Prevent Android from killing Termux when your phone screen turns off:
```bash
termux-wake-lock
```
*(Also disable Battery Optimization for Termux in Android Settings > Apps > Termux > Battery > Unrestricted).*

### Step 4: Clone / Copy the Codebase
Navigate to your project directory:
```bash
mkdir -p ~/discord-bot
cd ~/discord-bot
```
Copy these project files into `~/discord-bot/` (using `micro`, `nano`, or SFTP/Git).

### Step 5: Install Dependencies
```bash
npm install
```

### Step 6: Configure Environment (.env)
Create your `.env` file:
```bash
cp .env.example .env
nano .env
```
Fill in:
- `DISCORD_TOKEN`: Your Discord bot token from the Discord Developer Portal.
- `CLIENT_ID`: Your Discord application ID.
- `GEMINI_API_KEY`: Your Gemini API key from Google AI Studio.

### Step 7: Deploy Slash Commands
```bash
npm run deploy-commands
```

### Step 8: Start the Bot
#### Development Mode:
```bash
npm run dev
```

#### Production Mode (Compiles to JS & Enforces 128MB Memory Cap):
```bash
npm run build
npm start
```

---

## 🔄 24/7 Background Hosting with PM2 (Optional)
To keep the bot running automatically in the background on your phone:
```bash
npm install -g pm2
pm2 start dist/index.js --name "discord-bot" --node-args="--max-old-space-size=128"
pm2 save
```
Check logs anytime:
```bash
pm2 logs discord-bot
```
