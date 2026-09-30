# FlyMind Research Notes & Theoretical Analysis

## 1. Inductive Bias of the Drosophila Connectome

Conventional neural networks are topologically isotropic: fully connected layers have no spatial, rotational, or modular architectural priors. In contrast, the fruit fly brain possesses specialized circuit motifs refined by hundreds of millions of years of evolutionary selection for flight and walking navigation:

1. **Ring Attractor Dynamics in EPG Compass:**
   The circular projection between Ellipsoid Body (EB) and Protocerebral Bridge (PB) maintains a localized "bump" of neuronal activity encoding current heading. Cross-inhibition by Delta7 neurons ensures a single stable heading representation.

2. **Goal-Vector Subtraction in Fan-Shaped Body (FB):**
   FB columnar neurons integrate compass heading with stored goal orientations, effectively computing the angular error $\Delta \theta = \theta_{\text{goal}} - \theta_{\text{head}}$.

3. **Pre-Motor PFL3 Bilateral Steering:**
   PFL3 neurons receive inputs from FB and project asymmetrically to the Lateral Accessory Lobes (LAL). When the agent deviates to the left of the goal vector, right PFL3 neurons fire at higher rates, driving right-turning descending motor commands.

---

## 2. Scientific Integrity Principles

- **No Anthropomorphic or Biological Exaggeration:**
  We explicitly state that FlyMind does not emulate a whole living insect, insect subjective experience, or general intelligence. It is a computational spiking network instantiated on a biological topology.
- **Empirical Reproducibility:**
  All seeds, parameter sets, and graph extraction thresholds are recorded in configuration files. Reported metrics are derived from executed simulation batches.
- **Fair Baseline Parity:**
  The ANN and Generic SNN baselines use equivalent parameter budgets and receive identical input/output formats.
