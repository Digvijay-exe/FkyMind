# Drosophila Connectome Data & Pipeline Documentation

This document explains the biological provenance, filtering principles, and graph translation techniques used in FlyMind.

---

## 1. Biological Data Source

FlyMind utilizes connectomic data from the **FlyWire whole-brain reconstruction of adult Drosophila melanogaster** (v783 release / Nature 2024).

- **Total Proofread Neurons in Whole Brain:** 139,255
- **Total Synaptic Connections:** ~54.5 million
- **Annotations:** Proofread cell types, hemispheric symmetry, predicted neurotransmitters (Eckstein et al., 2024).

---

## 2. Sensorimotor Subgraph Selection

Simulating all 139,255 biological neurons in real time is computationally prohibitive on standard student hardware. Therefore, FlyMind extracts a task-relevant sensorimotor subgraph:

1. **Visual Sensory Circuit:**
   - **LC11 & LPLC2:** Lobula and Lobula Plate projection neurons tuned to optical expansion and looming obstacles.
   - **Anterior Optic Tubercle (AOTU):** Target and landmark orientation vectors.
2. **Central Complex (CX) Heading & Steering:**
   - **EPG Neurons:** Internal compass ring-attractor representing heading angle.
   - **PEN & PEG Neurons:** Angular velocity integration and compass update during turns.
   - **Delta7 Interneurons:** Ring-attractor stabilization and cross-inhibition.
   - **Fan-Shaped Body (FB):** Columnar units holding goal vectors and computing difference vectors.
   - **PFL3 & PFL2 Steering Neurons:** Pre-motor steering outputs delivering differential excitation to descending motor tracts.
3. **Mushroom Body (MB) Associative Valence:**
   - **Kenyon Cells (KC):** Sparse associative representation.
   - **MBONs:** Approach vs. avoidance action bias modulation.
   - **DANs:** Dopaminergic reward and punishment signaling.
4. **Descending Motor Tract (DN):**
   - Direct projection to thoracic motor centers (turn left, turn right, move forward, jump).

---

## 3. Computational Translation & Dale's Principle

Every biological connection is assigned:
- **Topology:** Directed edge $(u \to v)$ based on proofread synaptic contacts.
- **Synaptic Weight:** Normalized biological synapse count ($w \propto \log(1 + \text{synapses})$).
- **Polarity (Dale's Law):**
  - **Acetylcholine (ACH):** Excitatory ($+1$)
  - **GABA:** Inhibitory ($-1$)
  - **Glutamate (GLUT):** Inhibitory in insect CNS via GluCl channels ($-1$)
  - **Dopamine:** Neuromodulatory / reinforcement scaling
