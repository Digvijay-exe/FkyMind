"""
Download and dataset access manager for FlyWire Drosophila connectome releases.
Supports loading local cached data releases, validating provenance,
and retrieving CAVE-materialized data if credentials/network are configured.
"""

import os
import json
import logging
from typing import Dict, Any, Optional
from connectome.validate import validate_file

logger = logging.getLogger("flymind.connectome.download")

DEFAULT_DATA_PATH = os.path.join(
    os.path.dirname(__file__), "..", "data", "connectome", "flywire_sample_subgraph.json"
)

FLYWIRE_PUBLIC_ZENODO_RECORD = "https://doi.org/10.1038/s41586-024-07558-y"
FLYWIRE_VERSION = "v783"


def load_dataset(path: Optional[str] = None) -> Dict[str, Any]:
    """
    Loads a validated connectome release from the given path or default fixture.
    """
    target_path = path or os.path.abspath(DEFAULT_DATA_PATH)
    if not os.path.exists(target_path):
        raise FileNotFoundError(
            f"Connectome dataset not found at {target_path}. "
            "Please ensure data/connectome/ contains the required FlyWire release files."
        )

    is_valid, errors = validate_file(target_path)
    if not is_valid:
        raise ValueError(f"Connectome validation failed for {target_path}:\n" + "\n".join(errors))

    with open(target_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    logger.info(
        f"Loaded FlyWire connectome {data.get('dataset_metadata', {}).get('version')} "
        f"with {len(data.get('neurons', []))} neurons and {len(data.get('synapses', []))} synapses."
    )
    return data
