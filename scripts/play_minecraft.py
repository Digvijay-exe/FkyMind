#!/usr/bin/env python3
"""
FlyMind Runner Script in scripts/ directory.
Delegates directly to play.py.
"""

import os
import sys

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, root_dir)

from play import run_minecraft_brain, argparse

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run FlyMind brain autonomously in Minecraft")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Minecraft bridge host")
    parser.add_argument("--port", type=int, default=8085, help="Minecraft bridge TCP port")
    parser.add_argument("--mode", type=str, default="auto", choices=["auto", "fabric", "bot", "mock"], help="Connection mode")
    parser.add_argument("--target-x", type=float, default=None, help="Custom target X coordinate in Minecraft")
    parser.add_argument("--target-z", type=float, default=None, help="Custom target Z coordinate in Minecraft")
    parser.add_argument("--delay", type=float, default=0.06, help="Tick delay in seconds")
    args = parser.parse_args()

    target = [args.target_x, args.target_z] if args.target_x is not None and args.target_z is not None else None
    run_minecraft_brain(
        host=args.host,
        port=args.port,
        mode=args.mode,
        target_coords=target,
        tick_delay=args.delay,
    )
