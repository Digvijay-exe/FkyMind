# FlyMind Minecraft Integration Versions

To ensure scientific reproducibility and runtime stability, all versions of Minecraft Java Edition, mod loaders, and libraries are explicitly pinned below.

| Component | Pinned Version | Notes |
|:---|:---|:---|
| **Minecraft Java Edition** | `1.20.4` | Stable release with mature Fabric API support |
| **Fabric Loader** | `0.15.11` | Runtime mod loader |
| **Fabric API** | `0.97.0+1.20.4` | Hook and networking library |
| **Java JDK** | `Java 17 (LTS)` | Recommended for Minecraft 1.20.4 |
| **Communication Bridge** | WebSocket / TCP Socket | Port `8085` |
| **Protocol Version** | `v1.2-flymind` | JSON-encoded observation & action frames |
| **Gymnasium Target** | `gymnasium >= 0.28.0` | Standard reinforcement learning environment API |

## Dependency Compatibility Policy
Do not automatically update to newly released Minecraft versions without running full regression tests against the socket bridge protocol, player raycast routines, and tick synchronizer.
