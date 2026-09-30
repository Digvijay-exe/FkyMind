# FlyMind Setup & Installation Guide

This guide covers installing the FlyMind environment, verifying Python dependencies, running unit tests, and configuring the mock simulator or Minecraft Fabric bridge.

---

## 1. System Requirements

- **Operating System:** Linux (Ubuntu/Debian tested), macOS, or Windows WSL2.
- **Python:** Python 3.9+ (Python 3.10+ recommended).
- **Memory:** Minimum 4 GB RAM (8 GB recommended).
- **Compute:** CPU-only mode fully supported; optional CUDA acceleration.
- **Java (Optional for Minecraft):** OpenJDK 17 LTS for building the Fabric mod.

---

## 2. Python Environment Setup

Clone the repository and install requirements:

```bash
# Clone the repository
git clone https://github.com/flymind/flymind.git
cd flymind

# Optional: Create a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

## 3. Verifying the Installation

Execute the test suite to verify the mathematical implementation of the LIF biophysics, sparse spike propagation, dataset validation, and observation protocols:

```bash
python3 -m unittest discover tests
```

Expected output:
```text
Ran 13 tests in 0.004s
OK
```

---

## 4. Running Offline Mock Mode (No Minecraft Needed)

FlyMind includes a built-in mock simulator that mimics Minecraft navigation physics, raycasts, obstacle fields, and collision mechanics without needing Minecraft installed:

```bash
# Run a quick training cycle
python3 training/train_flymind.py --episodes 20 --lr 0.01

# Run the comparative benchmarks
python3 experiments/navigation.py
```

---

## 5. Web Dashboard & Interactive Research Studio

To launch the web interface:

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to interact with the real-time LIF neural simulation, view Drosophila connectome 3D graphs, inspect live Minecraft agent navigation, and compare model benchmarks.
