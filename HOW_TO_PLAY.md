# How to Let FlyMind Play Autonomously in Minecraft

FlyMind can control a player character in real Minecraft in two ways:
1. **Method 1 (Zero-Mod LAN Bot - Fastest & Recommended):** Works on ANY Minecraft Java Edition installation (unmodded vanilla, Paper, or singleplayer LAN).
2. **Method 2 (Fabric Mod):** Runs directly inside Minecraft via the Fabric mod loader.
3. **Method 3 (Mock Mode):** Simulates Minecraft in your terminal with zero dependencies.

---

## ⚡ Method 1: Zero-Mod LAN Bot (Recommended: 1 Minute Setup)

You don't need to install or compile any mods! The brain connects as a real player character (`FlyMind_Bot`) to your game.

### Step 1: Start your Minecraft World
1. Open Minecraft Java Edition (any version 1.18 to 1.20.4+).
2. Load any singleplayer world.
3. Press **Escape** → Click **"Open to LAN"** → Click **"Start LAN World"**.
4. Note the port number printed in the game chat (e.g. `Local game hosted on port 51234` or default `25565`).

### Step 2: Launch the Bot Bridge
In your terminal, run:
```bash
# If your LAN port was 51234:
node minecraft/bot_bridge.js --port 51234

# Or if running a local dedicated server on default 25565:
node minecraft/bot_bridge.js
```
You will immediately see:
`[+] Bot 'FlyMind_Bot' successfully spawned into the Minecraft world!`
Look in your Minecraft game—you will see `FlyMind_Bot` standing in your world!

### Step 3: Launch the FlyMind Drosophila Brain
In a second terminal window, run:
```bash
python3 play.py
```
**That's it!** The biological connectome SNN will instantly take control of the character in Minecraft:
- **Central Complex EPG ring attractor** computes the compass heading.
- **Fan-Shaped Body (FB)** integrates the goal direction.
- **PFL3 steering circuits** drive turning and forward motion.
- **LC11/LPLC2 looming neurons** trigger obstacle avoidance.

---

## 🎮 Method 2: Minecraft Fabric Mod

If you prefer to run FlyMind directly on your own player character using the Fabric mod:

### Step 1: Install the Fabric Mod
1. Install **Fabric Loader 0.15.11** for Minecraft **1.20.4**.
2. Put the `fabric-api-0.97.0+1.20.4.jar` and the built `flymind-bridge-1.0.0.jar` into your `.minecraft/mods` folder.
3. Launch Minecraft 1.20.4. When the game loads, you will see in the Minecraft logs:
   `FlyMind observation server listening on TCP port 8085`

### Step 2: Start the FlyMind Brain
Run:
```bash
python3 play.py --mode fabric
```
The brain connects to port 8085 and begins streaming actions to your Minecraft player!

---

## 🕹️ Custom Target Coordinates

To give the brain a specific coordinate in Minecraft to navigate towards:
```bash
# Navigate to X=150, Z=-80
python3 play.py --target-x 150 --target-z -80
```

---

## 🖥️ Method 3: Instant Terminal Mock Mode

To verify the brain's real-time navigation without running Minecraft:
```bash
python3 play.py --mode mock
```
This runs the full LIF Leaky Integrate-and-Fire simulation against our 3D Minecraft spatial simulator with a live ASCII telemetry HUD in your terminal!
