import React from 'react';
import { BookOpen, ShieldAlert, Sparkles } from 'lucide-react';

export const ResearchNotesTab: React.FC = () => {
  return (
    <div className="space-y-6 py-2 max-w-4xl">
      <div className="border-b-2 border-[#1c1a18] pb-4">
        <h2 className="font-pixel text-sm text-[#ffffff] mc-shadow">
          [6] ENCHANTED RESEARCH CODEX & BIOPHYSICAL LAWS
        </h2>
        <p className="text-xs text-[#888888] mt-1">
          Theoretical neuroscience principles, mathematical biophysics, and scientific integrity protocols.
        </p>
      </div>

      {/* Section 1: LIF Differential Equations */}
      <div className="mc-panel p-5 space-y-3">
        <h3 className="font-pixel text-xs text-[#ffff55] mc-shadow-gold flex items-center gap-2">
          <span>§ 1.</span>
          <span>LEAKY INTEGRATE-AND-FIRE (LIF) MEMBRANE PHYSICS</span>
        </h3>
        <p className="text-xs text-[#c8c0b5] leading-relaxed">
          The subthreshold membrane potential V_i(t) of each biological neuron evolves according to the standard RC circuit equation:
        </p>
        <div className="mc-slot p-3 bg-[#0d0c0b] font-mono text-xs text-[#55ffff] overflow-x-auto border-2 border-[#1e1c1a]">
          τ_m · (dV_i / dt) = -(V_i - V_rest) + R_m · I_syn,i(t) + R_m · I_ext,i(t)
        </div>
        <p className="text-xs text-[#9a9287] leading-relaxed">
          When the membrane potential crosses threshold <strong className="text-white">V_thresh = -50 mV</strong>,
          an action potential (spike) is fired, delivering synaptic charge to postsynaptic targets. The voltage is clamped to
          <strong className="text-white"> V_reset = -70 mV</strong> for the absolute refractory period
          <strong className="text-white"> t_ref = 2.0 ms</strong>.
        </p>
      </div>

      {/* Section 2: Dale's Principle & Polarity */}
      <div className="mc-panel p-5 space-y-3">
        <h3 className="font-pixel text-xs text-[#55ffff] mc-shadow-aqua flex items-center gap-2">
          <span>§ 2.</span>
          <span>DALE'S PRINCIPLE & PREDICTED NEUROTRANSMITTERS</span>
        </h3>
        <p className="text-xs text-[#c8c0b5] leading-relaxed">
          In strict adherence to biological neuroscience, FlyMind assigns every neuron a single physiological polarity based on FlyWire proofread predictions:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-pixel text-[10px]">
          <div className="mc-slot p-3 bg-[#151412] border-2 border-[#55ffff]/30">
            <div className="text-[#55ffff] font-bold">💎 ACETYLCHOLINE (ACh)</div>
            <div className="text-[#888888] text-[9px] mt-1 font-mono">Excitatory (+1.0) · Visual inputs, EPG compass, PFL3 motor drive</div>
          </div>
          <div className="mc-slot p-3 bg-[#151412] border-2 border-[#ff5555]/30">
            <div className="text-[#ff5555] font-bold">🔴 GABA</div>
            <div className="text-[#888888] text-[9px] mt-1 font-mono">Inhibitory (-1.0) · Lateral cross-inhibition, MBON avoidance</div>
          </div>
          <div className="mc-slot p-3 bg-[#151412] border-2 border-[#ffaa00]/30">
            <div className="text-[#ffaa00] font-bold">🟡 GLUTAMATE (GluCl)</div>
            <div className="text-[#888888] text-[9px] mt-1 font-mono">Inhibitory (-1.0) in insect CNS · Delta7 ring attractor stabilizer</div>
          </div>
        </div>
      </div>

      {/* Section 3: Central Complex Vector Steering */}
      <div className="mc-panel p-5 space-y-3">
        <h3 className="font-pixel text-xs text-[#55ff55] mc-shadow-green flex items-center gap-2">
          <span>§ 3.</span>
          <span>CENTRAL COMPLEX VECTOR STEERING IN MINECRAFT</span>
        </h3>
        <p className="text-xs text-[#c8c0b5] leading-relaxed">
          Goal navigation utilizes the Central Complex (CX) circuit motif. EPG compass neurons in the Ellipsoid Body form an 8-wedge
          topographic ring tracking Steve's yaw heading. The Fan-Shaped Body (FB) computes the angular delta between heading and goal beacon.
        </p>
        <p className="text-xs text-[#9a9287] leading-relaxed">
          When the beacon is to Steve's left, the left PFL3 steering neuron fires at a higher rate than the right PFL3 neuron,
          producing asymmetric excitation at descending motor neuron DNp01 to execute a TURN_LEFT command in Minecraft.
        </p>
      </div>

      {/* Section 4: Scientific Integrity Boundaries */}
      <div className="mc-panel p-5 space-y-3">
        <h3 className="font-pixel text-xs text-[#ffaa00] mc-shadow-gold flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-[#ffaa00]" />
          <span>SCIENTIFIC INTEGRITY & ATTRIBUTION</span>
        </h3>
        <ul className="space-y-1.5 text-xs text-[#c8c0b5] list-disc list-inside">
          <li><strong className="text-white">No Living Animal Equivalence:</strong> FlyMind is an artificial embodied model instantiated on biological topology, not a sentient living fly.</li>
          <li><strong className="text-white">FlyWire Attribution:</strong> Based on the FlyWire whole-brain connectome publication (Dorkenwald et al., Nature 2024 / Schlegel et al., Nature 2024).</li>
          <li><strong className="text-white">Direct Reproducibility:</strong> All simulation results and training curves are reproducible with the included Python unit test suite and scripts.</li>
        </ul>
      </div>
    </div>
  );
};
