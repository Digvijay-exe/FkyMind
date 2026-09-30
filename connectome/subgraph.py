"""
Task-relevant subgraph extraction for Drosophila FlyWire connectome.
Extracts connected subgraphs linking sensory inputs to descending motor neurons.
"""

from typing import Dict, Any, List, Set
from collections import deque
from connectome.annotations import extract_sensory_and_motor_ids


def extract_sensorimotor_subgraph(
    data: Dict[str, Any], max_hops: int = 4, target_size: int = 500
) -> Dict[str, Any]:
    """
    Extracts a task-relevant subgraph linking sensory neurons to descending motor neurons.
    Traverses forward from sensory nodes and backward from motor nodes.
    """
    pop = extract_sensory_and_motor_ids(data.get("neurons", []))
    sensory_set = set(pop["sensory"])
    motor_set = set(pop["motor"])

    # Build adjacency lists
    adj_out: Dict[str, List[str]] = {}
    adj_in: Dict[str, List[str]] = {}
    for n in data.get("neurons", []):
        nid = str(n["id"])
        adj_out[nid] = []
        adj_in[nid] = []

    for s in data.get("synapses", []):
        src = str(s["source"])
        tgt = str(s["target"])
        if src in adj_out:
            adj_out[src].append(tgt)
        if tgt in adj_in:
            adj_in[tgt].append(src)

    # BFS from sensory forward
    visited_forward: Set[str] = set(sensory_set)
    queue = deque([(nid, 0) for nid in sensory_set])
    while queue:
        curr, dist = queue.popleft()
        if dist >= max_hops:
            continue
        for nxt in adj_out.get(curr, []):
            if nxt not in visited_forward:
                visited_forward.add(nxt)
                queue.append((nxt, dist + 1))

    # BFS from motor backward
    visited_backward: Set[str] = set(motor_set)
    queue = deque([(nid, 0) for nid in motor_set])
    while queue:
        curr, dist = queue.popleft()
        if dist >= max_hops:
            continue
        for prev in adj_in.get(curr, []):
            if prev not in visited_backward:
                visited_backward.add(prev)
                queue.append((prev, dist + 1))

    # Intersection + sensory + motor
    selected_ids = (visited_forward & visited_backward) | sensory_set | motor_set

    # Filter neurons and synapses
    sub_neurons = [n for n in data.get("neurons", []) if str(n["id"]) in selected_ids]
    sub_synapses = [
        s for s in data.get("synapses", [])
        if str(s["source"]) in selected_ids and str(s["target"]) in selected_ids
    ]

    return {
        "dataset_metadata": {
            **data.get("dataset_metadata", {}),
            "subgraph_extraction": "sensorimotor_bidirectional_bfs",
            "max_hops": max_hops,
            "neuron_count": len(sub_neurons),
            "synapse_count": len(sub_synapses),
        },
        "neurons": sub_neurons,
        "synapses": sub_synapses,
    }
