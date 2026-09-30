"""
Annotation and cell-type ontology tools for the Drosophila connectome.
Maps FlyWire cell classes and neurotransmitters to computational roles in SNNs.
"""

from typing import Dict, Any, List

# Neuropil anatomical divisions
NEUROPIL_DIVISIONS = {
    "Central_Complex": ["Ellipsoid_Body", "Protocerebral_Bridge", "Fan_Shaped_Body", "Noduli", "Gall"],
    "Mushroom_Body": ["Mushroom_Body", "Calyx", "Alpha_Lobe", "Beta_Lobe"],
    "Optic_Lobe": ["Lobula", "Lobula_Plate", "Medulla", "Anterior_Optic_Tubercle"],
    "Motor_Descending": ["Lateral_Accessory_Lobe", "Descending_Tract", "Subesophageal_Zone"],
}

# Neurotransmitter sign mapping (Dale's principle)
# ACH = Acetylcholine (+1 Excitatory)
# GABA = gamma-Aminobutyric acid (-1 Inhibitory)
# GLUT = Glutamate (-1 Inhibitory in Drosophila CNS via GluCl receptors)
# DOPAMINE = Neuromodulator (scaled / plastic)
TRANSMITTER_POLARITY = {
    "ACH": 1.0,
    "GABA": -1.0,
    "GLUT": -1.0,
    "DOPAMINE": 0.5,
    "SEROTONIN": 0.5,
    "OCTOPAMINE": 1.0,
    "UNKNOWN": 1.0,
}


def get_transmitter_sign(transmitter_str: str) -> float:
    """Returns +1.0 for excitatory, -1.0 for inhibitory, or custom weight multiplier."""
    return TRANSMITTER_POLARITY.get(str(transmitter_str).upper(), 1.0)


def categorize_neuron_by_region(neuropil: str) -> str:
    """Classifies a neuropil into a major functional brain region."""
    for region, neuropils in NEUROPIL_DIVISIONS.items():
        if any(np.lower() in neuropil.lower() for np in neuropils):
            return region
    return "Other"


def extract_sensory_and_motor_ids(neurons: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    """
    Categorizes neurons into sensory (input), motor (output), and interneuron populations.
    """
    sensory = []
    motor = []
    interneurons = []

    for n in neurons:
        nid = str(n["id"])
        role = str(n.get("role", "")).lower()
        if "sensory" in role or "optic" in n.get("neuropil", "").lower():
            sensory.append(nid)
        elif "motor" in role or "action" in role or "descending" in n.get("neuropil", "").lower():
            motor.append(nid)
        else:
            interneurons.append(nid)

    return {
        "sensory": sensory,
        "interneuron": interneurons,
        "motor": motor,
    }
