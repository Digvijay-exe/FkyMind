# FlyMind Minecraft Java Edition & Fabric Mod Setup

This guide details how to build and install the FlyMind Fabric mod bridge into Minecraft Java Edition to enable real-time autonomous gameplay.

---

## 1. Pinned Component Versions

To ensure reproducibility across environments:

| Software | Version |
|:---|:---|
| **Minecraft Java Edition** | `1.20.4` |
| **Fabric Loader** | `0.15.11` |
| **Fabric API** | `0.97.0+1.20.4` |
| **Java JDK** | `17 LTS` |
| **Port** | `TCP 8085` |

---

## 2. Building the Fabric Mod

1. Navigate to the `minecraft_mod/` directory:
   ```bash
   cd minecraft_mod
   ```
2. Build the mod using the Gradle wrapper:
   ```bash
   ./gradlew build
   ```
3. The compiled `.jar` file will be generated in:
   `minecraft_mod/build/libs/flymind-bridge-1.0.0.jar`

---

## 3. Installing into Minecraft

1. Download and install the **Fabric Loader 0.15.11** for Minecraft **1.20.4**.
2. Download the matching **Fabric API** jar (`fabric-api-0.97.0+1.20.4.jar`).
3. Place both the Fabric API jar and `flymind-bridge-1.0.0.jar` into your Minecraft `.minecraft/mods/` folder.
4. Launch Minecraft using the Fabric profile.
5. Create a Superflat creative world (e.g. peaceful mode, day locked).

---

## 4. Connecting FlyMind Python Agent

Once Minecraft is running and loaded into the world:

1. Update `configs/minecraft.yaml`:
   ```yaml
   runtime:
     mode: "fabric"
   connection:
     host: "127.0.0.1"
     port: 8085
   ```
2. Run the agent:
   ```bash
   python3 -c "
   from minecraft.environment import FlyMindMinecraftEnv
   from brain.flymind import FlyMindAgent

   env = FlyMindMinecraftEnv(mode='fabric')
   agent = FlyMindAgent()
   obs, _ = env.reset()
   action, val, tel = agent.act(obs)
   obs, rew, term, trunc, info = env.step(action)
   print('Executed step in Minecraft, reward:', rew)
   "
   ```
