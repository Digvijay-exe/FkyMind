"""
TCP Socket communication bridge to Minecraft Fabric Mod server.
Sends action packets and receives observation streams synchronously or asynchronously.
"""

from typing import Dict, Any, Optional
import socket
import json
import logging
from minecraft.protocol import encode_action_packet, decode_observation_packet

logger = logging.getLogger("flymind.minecraft.bridge")


class MinecraftBridge:
    """Manages the network socket connection to the Minecraft Fabric mod observation server."""

    def __init__(self, host: str = "127.0.0.1", port: int = 8085, timeout: float = 3.0):
        self.host = host
        self.port = port
        self.timeout = timeout
        self.sock: Optional[socket.socket] = None
        self.is_connected = False

    def connect(self) -> bool:
        """Attempts to connect to the Fabric mod observation server."""
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.settimeout(self.timeout)
            self.sock.connect((self.host, self.port))
            self.is_connected = True
            logger.info(f"Connected to Minecraft Fabric Mod at {self.host}:{self.port}")
            return True
        except (socket.error, ConnectionRefusedError) as e:
            logger.warning(f"Could not connect to Minecraft at {self.host}:{self.port}: {e}")
            self.is_connected = False
            self.sock = None
            return False

    def send_action(self, action_dict: Dict[str, bool]):
        """Transmits an action packet to Minecraft."""
        if not self.is_connected or not self.sock:
            raise ConnectionError("Not connected to Minecraft Fabric mod.")
        packet = encode_action_packet(action_dict)
        self.sock.sendall(packet.encode("utf-8"))

    def receive_observation(self) -> Dict[str, Any]:
        """Reads next line-delimited JSON observation packet from Minecraft."""
        if not self.is_connected or not self.sock:
            raise ConnectionError("Not connected to Minecraft Fabric mod.")
        
        buffer = ""
        while "\n" not in buffer:
            chunk = self.sock.recv(1024).decode("utf-8")
            if not chunk:
                raise ConnectionResetError("Minecraft server closed socket connection.")
            buffer += chunk
            
        line, _ = buffer.split("\n", 1)
        return decode_observation_packet(line)

    def close(self):
        """Closes the socket cleanly."""
        if self.sock:
            try:
                self.sock.close()
            except Exception:
                pass
        self.is_connected = False
        self.sock = None
