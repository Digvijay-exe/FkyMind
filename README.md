# FlyMind: A Connectome-Inspired Spiking Neural Agent for Autonomous Minecraft Gameplay

> **"From a fruit-fly brain to a Minecraft agent."**
> An embodied computational neuroscience & reinforcement learning research platform investigating whether structural connectivity from the *Drosophila melanogaster* FlyWire connectome can function as the neural architecture of a goal-directed game-playing agent.

---

## 1. Executive Summary

FlyMind investigates whether structural wiring from biological brains can be translated into functional spiking neural network (SNN) architectures for embodied artificial intelligence. Using the proofread **FlyWire Drosophila whole-brain connectome** (containing 139,255 neurons and ~54.5 million synapses), FlyMind extracts a computationally manageable, task-relevant sensorimotor subgraph.

This biological graph is translated into a sparse recurrent SNN governed by **Leaky Integrate-and-Fire (LIF)** neuron dynamics and Dale's principle (synaptic polarity derived from predicted neurotransmitters: Acetylcholine, GABA, and Glutamate). The SNN receives continuous observations from Minecraft (or a high-fidelity built-in 2D/3D mock environment simulator), processes them across recurrent biological loops (Central Complex heading compass, Fan-Shaped Body goal integration, and Mushroom Body valence readout), and generates motor actions.

### Central Research Question
> **Can a connectome-inspired spiking neural architecture derived from the *Drosophila* brain learn goal-directed behavior in Minecraft, and how does its learning and computational profile compare to conventional ANN and generic SNN baselines?**

---

## 2. Architecture & Pipeline

```text
FlyWire Whole-Brain Connectome (v783)
                 │
                 ▼
  Biological Cell-Type & Neurotransmitter Filtering
  (Lobula/Optic, Central Complex CX, Mushroom Body MB, Descending DN)
                 │
                 ▼
  Task-Relevant Sensorimotor Subgraph
                 │
                 ▼
   Sparse Recurrent LIF Spiking Neural Network
  (Membrane decay, Refractory clamp, Dale's Law polarity)
                 │
                 ▼
  Abstract Sensorimotor Mapping & Rate Encoding
                 │
                 ▼
  Policy & Value Readout (PPO / Policy Gradient)
                 │
                 ▼
    Minecraft Java Edition (Fabric Mod Bridge) / Mock Simulator
```

---

## 3. Key Experimental Baselines

FlyMind is benchmarked across identical tasks and training budgets against:
1. **Random Agent**: Uniform random exploration baseline.
2. **Conventional ANN**: Multi-Layer Perceptron (MLP) with ReLU activations.
3. **Generic SNN**: 3-layer feedforward LIF network without biological topology.
4. **FlyMind**: FlyWire connectome-derived sparse recurrent SNN.
5. **Topology Ablation**: Shuffled degree-preserved control and binary unweighted connectivity.

---

## 4. Repository Layout

```text
FlyMind/
├── README.md                  # Project documentation & overview
├── SETUP.md                   # Installation & quickstart instructions
├── MINECRAFT_SETUP.md         # Fabric mod build & server connection instructions
├── CONNECTOME.md              # FlyWire dataset provenance & subgraph extraction
├── EXPERIMENTS.md             # Scientific evaluation protocols & benchmarks
├── RESEARCH_NOTES.md          # Scientific integrity notes & theoretical analysis
├── pyproject.toml             # Python packaging configuration
├── requirements.txt           # Python dependency manifest
├── configs/                   # YAML configurations (base, minecraft, flymind, training, reward)
├── data/                      # Biological dataset fixtures & processed graphs
├── connectome/                # FlyWire loaders, validators, filtering & graph statistics
├── brain/                     # LIF neurons, sparse synapses, rate encoders, action decoders
├── baselines/                 # Random, ANN, and generic SNN models
├── minecraft/                 # Protocol, observation/action normalizers, mock env, bridge
├── minecraft_mod/             # Fabric Java mod source (Minecraft 1.20.4)
├── training/                  # Training scripts (FlyMind, ANN, SNN) & evaluator
├── experiments/               # Navigation, topology ablation, and noise robustness scripts
├── tests/                     # Unit test suite (LIF biophysics, SNN, connectome, protocol)
├── server.ts                  # Full-stack dev server for interactive visualization studio
└── src/                       # Production web dashboard & interactive laboratory UI
```

---

## 5. Quickstart

### Running Unit Tests
```bash
python3 -m unittest discover tests
```

### Preprocessing Connectome Data
```bash
python3 scripts/prepare_connectome.py
```

### Running Model Benchmarks & Experiments
```bash
# Compare Random vs ANN vs Generic SNN vs FlyMind
python3 experiments/navigation.py

# Run Topology Ablation (Biological vs Binary vs Shuffled)
python3 experiments/ablation.py

# Run Sensory Noise Robustness
python3 experiments/robustness.py
```

### Training FlyMind Agent
```bash
python3 training/train_flymind.py --episodes 30 --lr 0.01 --seed 42
```

---

## 6. Scientific Integrity & Disclaimers

1. **No Biological Equivalence**: FlyMind is an *inspired* computational model, not a complete simulation of a living fly brain or consciousness.
2. **Empirical Results**: All reported success rates, firing frequencies, and trajectories are derived from reproducible simulations under recorded seeds.
3. **Attribution**: Built on FlyWire Drosophila melanogaster connectome research (Dorkenwald et al., Nature 2024 / Schlegel et al., Nature 2024).
