import { ObstacleBox, RaycastReadings, SimulationState, ActionIndex } from '../types';

export class ClientMinecraftSimulator {
  public worldW: number;
  public worldH: number;
  public playerX: number;
  public playerZ: number;
  public playerYaw: number;
  public playerHealth: number;
  public targetX: number;
  public targetZ: number;
  public obstacles: ObstacleBox[];
  public stepCount: number;
  public totalReward: number;
  public maxSteps: number;
  public prevDist: number;

  constructor(worldW: number = 32.0, worldH: number = 32.0, numObstacles: number = 10, seed: number = 42) {
    this.worldW = worldW;
    this.worldH = worldH;
    this.playerX = 4.0;
    this.playerZ = 4.0;
    this.playerYaw = 45.0;
    this.playerHealth = 20.0;
    this.targetX = worldW - 5.0;
    this.targetZ = worldH - 5.0;
    this.obstacles = [];
    this.stepCount = 0;
    this.totalReward = 0.0;
    this.maxSteps = 250;
    this.prevDist = 0.0;

    this.reset(seed, numObstacles);
  }

  public reset(seed: number = 42, numObstacles: number = 10): SimulationState {
    this.stepCount = 0;
    this.totalReward = 0.0;
    this.playerX = 4.0;
    this.playerZ = 4.0;
    this.playerYaw = (seed * 37) % 360;
    this.playerHealth = 20.0;
    this.targetX = this.worldW - 4.5;
    this.targetZ = this.worldH - 4.5;

    // Deterministic pseudo-random generation of obstacles based on seed
    this.obstacles = [];
    let prng = seed;
    const nextRand = () => {
      prng = (prng * 1664525 + 1013904223) % 4294967296;
      return prng / 4294967296;
    };

    for (let i = 0; i < numObstacles; i++) {
      const ox = 7.0 + nextRand() * (this.worldW - 14.0);
      const oz = 7.0 + nextRand() * (this.worldH - 14.0);
      const w = 1.8 + nextRand() * 2.2;
      const h = 1.8 + nextRand() * 2.2;
      this.obstacles.push({ minX: ox, minZ: oz, maxX: ox + w, maxZ: oz + h });
    }

    this.prevDist = this.distToTarget();
    return this.getState(0, 0, false, false, false);
  }

  public distToTarget(): number {
    const dx = this.targetX - this.playerX;
    const dz = this.targetZ - this.playerZ;
    return Math.sqrt(dx * dx + dz * dz);
  }

  public angleToTarget(): number {
    const dx = this.targetX - this.playerX;
    const dz = this.targetZ - this.playerZ;
    const tgtDeg = (Math.atan2(dz, dx) * 180) / Math.PI;
    let diff = (tgtDeg - this.playerYaw + 180) % 360 - 180;
    return diff;
  }

  public raycast(angleOffsetDeg: number, maxDist: number = 12.0): number {
    const rad = ((this.playerYaw + angleOffsetDeg) * Math.PI) / 180;
    const dirX = Math.cos(rad);
    const dirZ = Math.sin(rad);

    const stepSz = 0.4;
    let d = 0.0;
    while (d < maxDist) {
      d += stepSz;
      const rx = this.playerX + dirX * d;
      const rz = this.playerZ + dirZ * d;

      // Arena boundary collision
      if (rx <= 0 || rx >= this.worldW || rz <= 0 || rz >= this.worldH) {
        return d;
      }

      // Obstacle collision
      for (const box of this.obstacles) {
        if (rx >= box.minX && rx <= box.maxX && rz >= box.minZ && rz <= box.maxZ) {
          return d;
        }
      }
    }
    return maxDist;
  }

  public getRaycasts(): RaycastReadings {
    return {
      front: this.raycast(0.0),
      left: this.raycast(-45.0),
      right: this.raycast(45.0),
    };
  }

  public getObservationVector(noiseStd: number = 0.0): number[] {
    const rays = this.getRaycasts();
    const dTarget = this.distToTarget();
    const aTarget = this.angleToTarget();

    const maxRay = 12.0;
    const maxTgt = 40.0;

    let vec = [
      rays.front / maxRay,
      rays.left / maxRay,
      rays.right / maxRay,
      (aTarget + 180) / 360,
      Math.min(1.0, dTarget / maxTgt),
      this.playerHealth / 20.0,
      0.2, // velocity forward
      0.0, // velocity lateral
      1.0 - rays.front / maxRay,
      1.0 - rays.left / maxRay,
      1.0 - rays.right / maxRay,
      Math.abs(aTarget) < 25 ? 1.0 : 0.0,
      dTarget < 3.0 ? 1.0 : 0.0,
      Math.min(1.0, Math.abs(aTarget) / 180.0),
    ];

    if (noiseStd > 0) {
      vec = vec.map(v => {
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1 || 0.001)) * Math.cos(2.0 * Math.PI * u2);
        return Math.max(0, Math.min(1, v + z0 * noiseStd));
      });
    }

    return vec;
  }

  public step(action: ActionIndex): SimulationState {
    this.stepCount++;
    let collided = false;
    const stepSize = 0.9;
    const turnRate = 18.0;

    if (action === 1) { // MOVE_FORWARD
      const rad = (this.playerYaw * Math.PI) / 180;
      const nx = this.playerX + Math.cos(rad) * stepSize;
      const nz = this.playerZ + Math.sin(rad) * stepSize;
      if (this.isValidPos(nx, nz)) {
        this.playerX = nx;
        this.playerZ = nz;
      } else {
        collided = true;
      }
    } else if (action === 2) { // MOVE_BACKWARD
      const rad = (this.playerYaw * Math.PI) / 180;
      const nx = this.playerX - Math.cos(rad) * (stepSize * 0.5);
      const nz = this.playerZ - Math.sin(rad) * (stepSize * 0.5);
      if (this.isValidPos(nx, nz)) {
        this.playerX = nx;
        this.playerZ = nz;
      } else {
        collided = true;
      }
    } else if (action === 3) { // TURN_LEFT
      this.playerYaw = (this.playerYaw - turnRate + 360) % 360;
    } else if (action === 4) { // TURN_RIGHT
      this.playerYaw = (this.playerYaw + turnRate) % 360;
    } else if (action === 5) { // JUMP (boost forward)
      const rad = (this.playerYaw * Math.PI) / 180;
      const nx = this.playerX + Math.cos(rad) * (stepSize * 1.3);
      const nz = this.playerZ + Math.sin(rad) * (stepSize * 1.3);
      if (this.isValidPos(nx, nz)) {
        this.playerX = nx;
        this.playerZ = nz;
      } else {
        collided = true;
      }
    }

    const currDist = this.distToTarget();
    let stepReward = -0.05; // Time penalty

    const distDelta = this.prevDist - currDist;
    if (distDelta > 0) {
      stepReward += distDelta * 1.0 + 0.1;
    } else {
      stepReward += distDelta * 1.0;
    }

    if (collided) {
      stepReward -= 2.0;
    }

    const reached = currDist <= 1.6;
    if (reached) {
      stepReward += 100.0;
    }

    this.prevDist = currDist;
    this.totalReward += stepReward;

    const truncated = this.stepCount >= this.maxSteps;
    const terminated = reached;

    return this.getState(action, stepReward, collided, terminated, truncated);
  }

  private isValidPos(x: number, z: number): boolean {
    const r = 0.5;
    if (x - r <= 0 || x + r >= this.worldW) return false;
    if (z - r <= 0 || z + r >= this.worldH) return false;
    for (const b of this.obstacles) {
      if (x >= b.minX - r && x <= b.maxX + r && z >= b.minZ - r && z <= b.maxZ + r) {
        return false;
      }
    }
    return true;
  }

  public getState(
    action: ActionIndex = 0,
    reward: number = 0,
    collided: boolean = false,
    terminated: boolean = false,
    truncated: boolean = false
  ): SimulationState {
    const dTarget = this.distToTarget();
    const aTarget = this.angleToTarget();
    const rays = this.getRaycasts();

    return {
      playerX: this.playerX,
      playerZ: this.playerZ,
      playerYaw: this.playerYaw,
      playerHealth: this.playerHealth,
      targetX: this.targetX,
      targetZ: this.targetZ,
      obstacles: [...this.obstacles],
      worldSize: [this.worldW, this.worldH],
      stepCount: this.stepCount,
      totalReward: this.totalReward,
      lastAction: action,
      lastReward: reward,
      terminated,
      truncated,
      success: dTarget <= 1.6,
      collided,
      distToTarget: dTarget,
      angleToTarget: aTarget,
      raycasts: rays,
      activeSpikingNeurons: [],
      firingRateHz: 0.0,
      neuronVoltages: [],
    };
  }
}
