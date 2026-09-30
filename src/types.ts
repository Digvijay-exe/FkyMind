export type Neurotransmitter = 'ACH' | 'GABA' | 'GLUT' | 'DOPAMINE' | 'SEROTONIN' | 'OCTOPAMINE' | 'UNKNOWN';

export type NeuropilRegion =
  | 'Ellipsoid_Body'
  | 'Protocerebral_Bridge'
  | 'Fan_Shaped_Body'
  | 'Gall'
  | 'Lobula'
  | 'Lobula_Plate'
  | 'Anterior_Optic_Tubercle'
  | 'Mushroom_Body'
  | 'Lateral_Accessory_Lobe'
  | 'Descending_Tract'
  | 'Antennal_Mechanosensory'
  | 'Subesophageal_Zone';

export interface ConnectomeNeuron {
  id: string;
  name: string;
  cell_type: string;
  neuropil: NeuropilRegion | string;
  neurotransmitter: Neurotransmitter;
  role: string;
  x: number;
  y: number;
  z: number;
}

export interface ConnectomeSynapse {
  source: string;
  target: string;
  count: number;
  neurotransmitter?: Neurotransmitter;
}

export interface ConnectomeMetadata {
  source: string;
  version: string;
  materialization?: string;
  doi: string;
  description: string;
  total_source_neurons: number;
  selected_neurons: number;
  synaptic_threshold: number;
}

export interface ConnectomeData {
  dataset_metadata: ConnectomeMetadata;
  neurons: ConnectomeNeuron[];
  synapses: ConnectomeSynapse[];
}

export type ActionIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ActionName =
  | 'NO_OP'
  | 'MOVE_FORWARD'
  | 'MOVE_BACKWARD'
  | 'TURN_LEFT'
  | 'TURN_RIGHT'
  | 'JUMP'
  | 'ATTACK'
  | 'INTERACT';

export type ModelType = 'flymind' | 'generic_snn' | 'ann' | 'random';

export type TopologyType = 'connectome_weighted' | 'binary' | 'random_rewired';

export interface RaycastReadings {
  front: number;
  left: number;
  right: number;
}

export interface MinecraftObsPacket {
  tick: number;
  position: { x: number; y: number; z: number };
  yaw: number;
  pitch: number;
  health: number;
  velocity: [number, number, number];
  target: { distance: number; angle: number };
  raycast: RaycastReadings;
}

export interface ObstacleBox {
  minX: number;
  minZ: number;
  maxX: number;
  maxZ: number;
}

export interface SimulationState {
  playerX: number;
  playerZ: number;
  playerYaw: number;
  playerHealth: number;
  targetX: number;
  targetZ: number;
  obstacles: ObstacleBox[];
  worldSize: [number, number];
  stepCount: number;
  totalReward: number;
  lastAction: ActionIndex;
  lastReward: number;
  terminated: boolean;
  truncated: boolean;
  success: boolean;
  collided: boolean;
  distToTarget: number;
  angleToTarget: number;
  raycasts: RaycastReadings;
  activeSpikingNeurons: number[];
  firingRateHz: number;
  neuronVoltages: number[];
}

export interface BenchmarkMetrics {
  num_episodes: number;
  success_rate: number;
  mean_reward: number;
  std_reward: number;
  mean_steps_to_goal: number;
  mean_collisions_per_episode: number;
  mean_firing_rate_hz: number;
  param_count?: number;
  latency_ms?: number;
}
