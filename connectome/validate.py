"""
Validation module for Drosophila FlyWire connectome datasets.
Ensures biological data integrity, schema compliance, and provenance tracking.
"""

from typing import Dict, List, Tuple, Any, Optional
import os
import json


REQUIRED_NEURON_FIELDS = {"id", "name", "cell_type", "neuropil", "neurotransmitter"}
REQUIRED_SYNAPSE_FIELDS = {"source", "target", "count"}
ALLOWED_TRANSMITTERS = {"ACH", "GABA", "GLUT", "DOPAMINE", "SEROTONIN", "OCTOPAMINE", "UNKNOWN"}


class ConnectomeValidationError(Exception):
    """Raised when connectome data fails structural or biological validation."""
    pass


def validate_connectome_dict(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validates an in-memory dictionary representing a FlyWire connectome extract.
    Returns (is_valid, error_list).
    """
    errors: List[str] = []
    
    if "dataset_metadata" not in data:
        errors.append("Missing 'dataset_metadata' block.")
    else:
        meta = data["dataset_metadata"]
        for required_key in ["source", "version"]:
            if required_key not in meta:
                errors.append(f"Metadata missing required key: {required_key}")
                
    if "neurons" not in data or not isinstance(data["neurons"], list):
        errors.append("Missing or invalid 'neurons' array.")
        return False, errors

    if "synapses" not in data or not isinstance(data["synapses"], list):
        errors.append("Missing or invalid 'synapses' array.")
        return False, errors

    neuron_ids = set()
    for idx, neuron in enumerate(data["neurons"]):
        if not isinstance(neuron, dict):
            errors.append(f"Neuron at index {idx} is not an object.")
            continue
        missing = REQUIRED_NEURON_FIELDS - set(neuron.keys())
        if missing:
            errors.append(f"Neuron {idx} ({neuron.get('id', 'unknown')}) missing fields: {missing}")
        nid = str(neuron.get("id", ""))
        if nid in neuron_ids:
            errors.append(f"Duplicate neuron ID found: {nid}")
        neuron_ids.add(nid)

        tx = str(neuron.get("neurotransmitter", "UNKNOWN")).upper()
        if tx not in ALLOWED_TRANSMITTERS:
            errors.append(f"Neuron {nid} has unrecognized transmitter '{tx}'")

    for s_idx, syn in enumerate(data["synapses"]):
        if not isinstance(syn, dict):
            errors.append(f"Synapse at index {s_idx} is not an object.")
            continue
        missing = REQUIRED_SYNAPSE_FIELDS - set(syn.keys())
        if missing:
            errors.append(f"Synapse {s_idx} missing fields: {missing}")
            continue
        src = str(syn["source"])
        tgt = str(syn["target"])
        if src not in neuron_ids:
            errors.append(f"Synapse {s_idx} source '{src}' does not exist in neuron table.")
        if tgt not in neuron_ids:
            errors.append(f"Synapse {s_idx} target '{tgt}' does not exist in neuron table.")
        count = syn.get("count", 0)
        if not isinstance(count, (int, float)) or count <= 0:
            errors.append(f"Synapse {s_idx} count must be positive, got {count}")

    is_valid = len(errors) == 0
    return is_valid, errors


def validate_file(file_path: str) -> Tuple[bool, List[str]]:
    """Loads and validates a local connectome file (JSON format)."""
    if not os.path.exists(file_path):
        return False, [f"File not found: {file_path}"]
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return validate_connectome_dict(data)
    except Exception as e:
        return False, [f"JSON parsing error: {str(e)}"]
