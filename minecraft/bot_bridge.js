/**
 * FlyMind Mineflayer Bridge: Connects FlyMind Python Brain directly to ANY Minecraft Game!
 *
 * Joins a Minecraft server or singleplayer "Open to LAN" world as a player character,
 * measures proximity raycasts and target vectors, and opens a TCP socket on port 8085
 * for the FlyMind SNN brain (play.py).
 *
 * Usage:
 *   node minecraft/bot_bridge.js
 *   node minecraft/bot_bridge.js --host localhost --port 25565 --bridge-port 8085 --target-x 100 --target-z 200
 */

import net from 'net';
import mineflayer from 'mineflayer';

// Parse command line arguments
const args = process.argv.slice(2);
function getArg(name, defaultVal) {
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return defaultVal;
}

const mcHost = getArg('host', 'localhost');
const mcPort = parseInt(getArg('port', '25565'), 10);
const bridgePort = parseInt(getArg('bridge-port', '8085'), 10);
const botUsername = getArg('username', 'FlyMind_Bot');
let targetX = parseFloat(getArg('target-x', '0'));
let targetZ = parseFloat(getArg('target-z', '0'));
let hasCustomTarget = args.includes('--target-x');

console.log('================================================================');
console.log('  FlyMind Autonomous Minecraft Bot Bridge');
console.log('================================================================');
console.log(`Connecting bot '${botUsername}' to Minecraft server at ${mcHost}:${mcPort}...`);
console.log(`Bridge TCP server will listen on port ${bridgePort} for play.py`);
console.log('----------------------------------------------------------------');

// Create Mineflayer bot
const bot = mineflayer.createBot({
  host: mcHost,
  port: mcPort,
  username: botUsername,
  version: false, // auto-detect Minecraft version
});

let pythonClientSocket = null;
let tickCount = 0;

bot.on('spawn', () => {
  console.log(`\x1b[32m[+] Bot '${botUsername}' successfully spawned into the Minecraft world!\x1b[0m`);
  console.log(`    Current Position: X=${bot.entity.position.x.toFixed(1)}, Y=${bot.entity.position.y.toFixed(1)}, Z=${bot.entity.position.z.toFixed(1)}`);

  if (!hasCustomTarget) {
    // Default target: 30 blocks ahead of spawn
    targetX = bot.entity.position.x + 30;
    targetZ = bot.entity.position.z + 30;
    console.log(`    Auto-assigned target location: X=${targetX.toFixed(1)}, Z=${targetZ.toFixed(1)}`);
  } else {
    console.log(`    Target location: X=${targetX.toFixed(1)}, Z=${targetZ.toFixed(1)}`);
  }

  bot.chat('FlyMind Fruit Fly Connectome Brain activated!');
});

bot.on('kicked', (reason) => {
  console.log(`\x1b[31m[-] Bot kicked from Minecraft server: ${reason}\x1b[0m`);
});

bot.on('error', (err) => {
  console.log(`\x1b[31m[-] Minecraft connection error: ${err.message}\x1b[0m`);
  console.log('    Tip: If playing singleplayer, pause Minecraft, click "Open to LAN",');
  console.log('    and specify the port shown in chat using: node minecraft/bot_bridge.js --port <LAN_PORT>');
});

// Raycast helper to measure obstacle distances in blocks
function raycastDistance(angleOffsetDeg, maxDist = 12.0) {
  if (!bot.entity) return maxDist;
  const pos = bot.entity.position.offset(0, 1.0, 0); // eye level
  const yaw = bot.entity.yaw + (angleOffsetDeg * Math.PI) / 180;
  const dirX = -Math.sin(yaw);
  const dirZ = -Math.cos(yaw);

  const step = 0.5;
  for (let d = step; d <= maxDist; d += step) {
    const checkPos = pos.offset(dirX * d, 0, dirZ * d);
    const block = bot.blockAt(checkPos);
    if (block && block.boundingBox === 'block' && block.name !== 'air' && block.name !== 'water') {
      return d;
    }
  }
  return maxDist;
}

// Compute observation frame for Python SNN
function getObservationFrame() {
  if (!bot.entity) {
    return {
      tick: tickCount++,
      position: { x: 0, y: 64, z: 0 },
      yaw: 0,
      pitch: 0,
      health: 20,
      velocity: [0, 0, 0],
      target: { distance: 10, angle: 0 },
      raycast: { front: 12, left: 12, right: 12 },
    };
  }

  const pos = bot.entity.position;
  const dx = targetX - pos.x;
  const dz = targetZ - pos.z;
  const targetDist = Math.sqrt(dx * dx + dz * dz);

  // Compute angle to target relative to yaw
  const targetYaw = Math.atan2(-dx, -dz); // Mineflayer yaw convention
  let angleDiff = ((targetYaw - bot.entity.yaw + Math.PI) % (2 * Math.PI)) - Math.PI;
  const angleDeg = (angleDiff * 180) / Math.PI;

  const yawDeg = ((bot.entity.yaw * 180) / Math.PI) % 360;

  return {
    tick: tickCount++,
    position: {
      x: parseFloat(pos.x.toFixed(2)),
      y: parseFloat(pos.y.toFixed(2)),
      z: parseFloat(pos.z.toFixed(2)),
    },
    yaw: parseFloat(yawDeg.toFixed(1)),
    pitch: parseFloat(((bot.entity.pitch * 180) / Math.PI).toFixed(1)),
    health: parseFloat((bot.health || 20).toFixed(1)),
    velocity: [
      parseFloat((bot.entity.velocity.x || 0).toFixed(3)),
      parseFloat((bot.entity.velocity.y || 0).toFixed(3)),
      parseFloat((bot.entity.velocity.z || 0).toFixed(3)),
    ],
    target: {
      distance: parseFloat(targetDist.toFixed(2)),
      angle: parseFloat(angleDeg.toFixed(1)),
    },
    raycast: {
      front: parseFloat(raycastDistance(0.0).toFixed(2)),
      left: parseFloat(raycastDistance(-45.0).toFixed(2)),
      right: parseFloat(raycastDistance(45.0).toFixed(2)),
    },
  };
}

// Apply actions to the bot
function applyAction(action) {
  if (!bot.entity) return;

  // Discrete action states
  bot.setControlState('forward', !!action.forward);
  bot.setControlState('back', !!action.back);
  bot.setControlState('left', !!action.left);
  bot.setControlState('right', !!action.right);
  bot.setControlState('jump', !!action.jump);

  // Smooth turning towards direction
  if (action.left) {
    bot.entity.yaw += 0.25;
  } else if (action.right) {
    bot.entity.yaw -= 0.25;
  }

  if (action.attack) {
    const entity = bot.nearestEntity(e => e.type === 'mob' || e.type === 'player');
    if (entity && bot.entity.position.distanceTo(entity.position) < 3.5) {
      bot.attack(entity);
    } else {
      bot.swingArm('right');
    }
  }

  if (action.interact) {
    const block = bot.blockAt(bot.entity.position.offset(0, 0, 1));
    if (block) {
      bot.activateBlock(block).catch(() => {});
    }
  }
}

// Start local TCP Server for Python Bridge (port 8085)
const server = net.createServer((socket) => {
  console.log(`\x1b[32m[+] FlyMind Brain (play.py) connected to bot bridge!\x1b[0m`);
  pythonClientSocket = socket;

  let buffer = '';

  socket.on('data', (data) => {
    buffer += data.toString('utf-8');
    while (buffer.includes('\n')) {
      const lineIndex = buffer.indexOf('\n');
      const line = buffer.slice(0, lineIndex).trim();
      buffer = buffer.slice(lineIndex + 1);

      if (!line) continue;

      try {
        const actionObj = JSON.parse(line);
        applyAction(actionObj);

        // Send back updated observation frame immediately
        const obs = getObservationFrame();
        socket.write(JSON.stringify(obs) + '\n');
      } catch (err) {
        console.error('Error handling brain action:', err.message);
      }
    }
  });

  socket.on('close', () => {
    console.log('[-] FlyMind Brain disconnected.');
    pythonClientSocket = null;
    if (bot.entity) {
      bot.clearControlStates();
    }
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err.message);
  });
});

server.listen(bridgePort, '127.0.0.1', () => {
  console.log(`\x1b[36m[✓] FlyMind Bot Bridge listening on 127.0.0.1:${bridgePort}\x1b[0m`);
  console.log(`    Now run: python3 play.py`);
});
