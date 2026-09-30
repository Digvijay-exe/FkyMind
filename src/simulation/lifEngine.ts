import { ConnectomeData, TopologyType, ActionIndex } from '../types';

export interface LIFConfig {
  vRest: number;    // mV (-65.0)
  vReset: number;   // mV (-70.0)
  vThresh: number;  // mV (-50.0)
  tauM: number;     // ms (20.0)
  tRef: number;     // ms (2.0)
  dt: number;       // ms (1.0)
  rMembrane: number;// MOhm (10.0)
}

export const DEFAULT_LIF_CONFIG: LIFConfig = {
  vRest: -65.0,
  vReset: -70.0,
  vThresh: -50.0,
  tauM: 20.0,
  tRef: 2.0,
  dt: 1.0,
  rMembrane: 10.0,
};

export class ClientLIFEngine {
  public config: LIFConfig;
  public nNeurons: number;
  public voltages: number[];
  public refractoryCounters: number[];
  public refractoryLimit: number;
  public lastSpikes: number[];
  public alpha: number;

  // Synaptic adjacency: targetIdx -> list of { sourceIdx, weight }
  public incomingEdges: Array<Array<{ source: number; weight: number }>>;
  public outgoingEdges: Array<Array<{ target: number; weight: number }>>;
  public synapticTraces: number[];
  public synapticDecay: number;

  // Mapping
  public neuronIdToIdx: Map<string, number>;
  public idxToNeuronId: Map<number, string>;
  public sensoryIndices: number[];
  public motorIndices: number[];

  // Biases for policy readout
  public actionBiases: number[];

  constructor(connectome: ConnectomeData, topology: TopologyType = 'connectome_weighted', config: LIFConfig = DEFAULT_LIF_CONFIG) {
    this.config = config;
    this.nNeurons = connectome.neurons.length;
    this.alpha = Math.exp(-config.dt / config.tauM);
    this.refractoryLimit = Math.round(config.tRef / config.dt);
    this.synapticDecay = 0.8;

    this.voltages = new Array(this.nNeurons).fill(config.vRest);
    this.refractoryCounters = new Array(this.nNeurons).fill(0);
    this.lastSpikes = new Array(this.nNeurons).fill(0);
    this.synapticTraces = new Array(this.nNeurons).fill(0.0);
    this.actionBiases = [0.0, 1.2, -0.5, 0.0, 0.0, 0.2, -0.8, -0.8]; // Goal-directed prior

    this.neuronIdToIdx = new Map();
    this.idxToNeuronId = new Map();
    connectome.neurons.forEach((n, idx) => {
      this.neuronIdToIdx.set(n.id, idx);
      this.idxToNeuronId.set(idx, n.id);
    });

    this.sensoryIndices = [];
    this.motorIndices = [];
    connectome.neurons.forEach((n, idx) => {
      const r = n.role.toLowerCase();
      if (r.includes('sensory') || n.neuropil.toLowerCase().includes('optic')) {
        this.sensoryIndices.push(idx);
      }
      if (r.includes('action') || r.includes('motor') || n.neuropil.toLowerCase().includes('descending')) {
        this.motorIndices.push(idx);
      }
    });

    // Build sparse adjacency
    this.incomingEdges = Array.from({ length: this.nNeurons }, () => []);
    this.outgoingEdges = Array.from({ length: this.nNeurons }, () => []);
    this._buildEdges(connectome, topology);
  }

  private _buildEdges(connectome: ConnectomeData, topology: TopologyType) {
    const maxCount = Math.max(...connectome.synapses.map(s => s.count), 1);

    connectome.synapses.forEach(s => {
      const src = this.neuronIdToIdx.get(s.source);
      const tgt = this.neuronIdToIdx.get(s.target);
      if (src === undefined || tgt === undefined) return;

      const srcNeuron = connectome.neurons[src];
      let sign = 1.0;
      if (srcNeuron.neurotransmitter === 'GABA' || srcNeuron.neurotransmitter === 'GLUT') {
        sign = -1.0;
      }

      let weight = 0.5 * sign;
      if (topology === 'connectome_weighted') {
        const norm = Math.log1p(s.count) / Math.log1p(maxCount);
        weight = sign * (0.2 + 0.8 * norm) * 1.5;
      } else if (topology === 'binary') {
        weight = sign * 0.8;
      } else if (topology === 'random_rewired') {
        // preserve degree, randomize target
        const randTgt = Math.floor(Math.random() * this.nNeurons);
        this.outgoingEdges[src].push({ target: randTgt, weight: weight * 0.8 });
        this.incomingEdges[randTgt].push({ source: src, weight: weight * 0.8 });
        return;
      }

      this.outgoingEdges[src].push({ target: tgt, weight });
      this.incomingEdges[tgt].push({ source: src, weight });
    });
  }

  public reset() {
    this.voltages.fill(this.config.vRest);
    this.refractoryCounters.fill(0);
    this.lastSpikes.fill(0);
    this.synapticTraces.fill(0.0);
  }

  public step(externalCurrents: number[]): { spikes: number[]; voltages: number[] } {
    const spikes = new Array(this.nNeurons).fill(0);
    const newV = new Array(this.nNeurons).fill(this.config.vRest);

    // 1. Update synaptic traces with decay and previous spikes
    for (let i = 0; i < this.nNeurons; i++) {
      this.synapticTraces[i] *= this.synapticDecay;
    }
    for (let src = 0; src < this.nNeurons; src++) {
      if (this.lastSpikes[src] === 1) {
        for (const edge of this.outgoingEdges[src]) {
          this.synapticTraces[edge.target] += edge.weight;
        }
      }
    }

    // 2. LIF Membrane update
    for (let i = 0; i < this.nNeurons; i++) {
      if (this.refractoryCounters[i] > 0) {
        this.refractoryCounters[i]--;
        newV[i] = this.config.vReset;
        continue;
      }

      const totalCurrent = this.synapticTraces[i] + (externalCurrents[i] || 0.0);
      const leak = this.config.vRest + (this.voltages[i] - this.config.vRest) * this.alpha;
      const inputDrive = totalCurrent * this.config.rMembrane * (1.0 - this.alpha);
      const vTentative = leak + inputDrive;

      if (vTentative >= this.config.vThresh) {
        spikes[i] = 1;
        newV[i] = this.config.vReset;
        this.refractoryCounters[i] = this.refractoryLimit;
      } else {
        newV[i] = vTentative;
      }
    }

    this.voltages = newV;
    this.lastSpikes = spikes;
    return { spikes, voltages: [...this.voltages] };
  }

  public processObservation(obsVector: number[], timeSteps: number = 8): {
    action: ActionIndex;
    actionProbs: number[];
    activeSpikes: number[];
    firingRateHz: number;
    voltageSnapshot: number[];
  } {
    const accumulatedSpikes = new Array(this.nNeurons).fill(0);

    for (let t = 0; t < timeSteps; t++) {
      const extCurrents = new Array(this.nNeurons).fill(0.0);
      // Rate encode inputs: probability proportional to obs
      for (let f = 0; f < obsVector.length; f++) {
        const val = Math.max(0, Math.min(1, obsVector[f]));
        const p = val * 0.15; // rate factor
        if (Math.random() < p && f < this.sensoryIndices.length) {
          const targetNeuron = this.sensoryIndices[f];
          extCurrents[targetNeuron] += 25.0; // deliver depolarizing current
        }
      }

      const { spikes } = this.step(extCurrents);
      for (let i = 0; i < this.nNeurons; i++) {
        accumulatedSpikes[i] += spikes[i];
      }
    }

    // Readout motor spike counts
    const motorCounts = this.motorIndices.slice(0, 8).map(idx => accumulatedSpikes[idx]);
    while (motorCounts.length < 8) motorCounts.push(0);

    // Compute action logits
    const logits = motorCounts.map((count, a) => count * 0.5 + (this.actionBiases[a] || 0.0));
    const maxLogit = Math.max(...logits);
    const expLogits = logits.map(l => Math.exp(l - maxLogit));
    const sumExp = expLogits.reduce((a, b) => a + b, 0);
    const probs = expLogits.map(e => e / (sumExp || 1));

    // Sample or pick argmax with temperature
    let chosenAction: ActionIndex = 0;
    const r = Math.random();
    let cum = 0;
    for (let a = 0; a < probs.length; a++) {
      cum += probs[a];
      if (r <= cum) {
        chosenAction = a as ActionIndex;
        break;
      }
    }

    const totalSpikes = accumulatedSpikes.reduce((a, b) => a + b, 0);
    const firingRate = totalSpikes / (this.nNeurons * timeSteps * (this.config.dt / 1000));
    const activeSpikes = accumulatedSpikes.map((c, idx) => (c > 0 ? idx : -1)).filter(idx => idx !== -1);

    return {
      action: chosenAction,
      actionProbs: probs,
      activeSpikes,
      firingRateHz: firingRate,
      voltageSnapshot: [...this.voltages],
    };
  }
}
