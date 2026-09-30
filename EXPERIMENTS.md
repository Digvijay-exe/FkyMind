# FlyMind Experiments & Benchmark Protocols

This document details the standardized experimental protocols used to evaluate FlyMind against baseline models.

---

## 1. Experimental Setup & Controls

To ensure strict scientific control across all models:
- **Identical Observation Space:** 14 continuous channels (raycasts, relative target angle, distance, velocity, health).
- **Identical Action Space:** 8 discrete actions (NO_OP, FORWARD, BACKWARD, LEFT, RIGHT, JUMP, ATTACK, INTERACT).
- **Identical Reward Formulation:** Target reach (+100), distance delta (+1.0), step penalty (-0.05), collision (-2.0).
- **Identical Episode Horizons:** 250 steps maximum per episode.

---

## 2. Benchmark Suite

### Experiment 1: Multi-Model Navigation Comparison
Evaluates 4 architectures across identical randomized obstacle courses:
- **Random Agent** (Exploration baseline)
- **Conventional ANN** (MLP: 14 -> 64 -> 64 -> 8)
- **Generic SNN** (3-layer feedforward LIF without connectome topology)
- **FlyMind** (FlyWire-derived sparse recurrent LIF SNN)

### Experiment 2: Topology Ablation
Investigates whether biological connectivity specifically confers inductive bias:
- **Biological FlyWire Topology**
- **Binary Unweighted Topology**
- **Randomized Degree-Preserved Control** (targets randomly rewired while keeping identical in/out degree distribution)

### Experiment 3: Sensor Noise Robustness
Evaluates performance degradation when Gaussian noise $\mathcal{N}(0, \sigma^2)$ is added to observation channels ($\sigma \in \{0.0, 0.1, 0.25, 0.5\}$).

---

## 3. Measured Metrics

- **Success Rate (%):** Fraction of episodes reaching target radius ($r \le 1.5$ blocks).
- **Average Episode Reward:** Mean cumulative reward per episode.
- **Steps to Goal:** Trajectory length on successful completions.
- **Collision Rate:** Mean collisions with obstacles or boundaries per episode.
- **Mean Firing Rate (Hz):** Spikes per neuron per second.
- **Computational Latency:** Inference execution time per decision step.
