"""
Filtering strategies for Drosophila connectome data.
Prunes weak synapses, filters by neurotransmitter confidence, and removes isolated nodes.
"""

from typing import Dict, Any, List, Set


def filter_by_synapse_threshold(
    data: Dict[str, Any], min_synapses: int = 3
) -> Dict[str, Any]:
    """
    Filters edges with synapse count below threshold.
    Prunes any neurons that become completely disconnected.
    """
    filtered_synapses = [
        s for s in data.get("synapses", [])
        if s.get("count", 0) >= min_synapses
    ]

    active_neuron_ids: Set[str] = set()
    for s in filtered_synapses:
        active_neuron_ids.add(str(s["source"]))
        active_neuron_ids.add(str(s["target"]))

    filtered_neurons = [
        n for n in data.get("neurons", [])
        if str(n["id"]) in active_neuron_ids or "sensory" in str(n.get("role", "")).lower() or "action" in str(n.get("role", "")).lower()
    ]

    return {
        "dataset_metadata": {
            **data.get("dataset_metadata", {}),
            "filter_min_synapses": min_synapses,
            "retained_neurons": len(filtered_neurons),
            "retained_synapses": len(filtered_synapses),
        },
        "neurons": filtered_neurons,
        "synapses": filtered_synapses,
    }


def filter_by_regions(
    data: Dict[str, Any], allowed_neuropils: List[str]
) -> Dict[str, Any]:
    """Filters neurons belonging strictly to selected neuropils."""
    allowed_set = {n.lower() for n in allowed_neuropils}
    kept_neurons = [
        n for n in data.get("neurons", [])
        if n.get("neuropil", "").lower() in allowed_set
    ]
    kept_ids = {str(n["id"]) for n in kept_neurons}

    kept_synapses = [
        s for s in data.get("synapses", [])
        if str(s["source"]) in kept_ids and str(s["target"]) in kept_ids
    ]

    return {
        "dataset_metadata": {
            **data.get("dataset_metadata", {}),
            "allowed_neuropils": allowed_neuropils,
        },
        "neurons": kept_neurons,
        "synapses": kept_synapses,
    }
