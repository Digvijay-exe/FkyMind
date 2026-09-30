package ai.flymind;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.minecraft.server.network.ServerPlayerEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FlyMindMod implements ModInitializer {
    public static final String MOD_ID = "flymind-bridge";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);
    private static ObservationServer server;
    private static int tickCounter = 0;

    @Override
    public void onInitialize() {
        LOGGER.info("Initializing FlyMind Connectome Bridge Mod for Minecraft 1.20.4...");
        try {
            server = new ObservationServer(8085);
            server.start();
            LOGGER.info("FlyMind observation server listening on TCP port 8085");
        } catch (Exception e) {
            LOGGER.error("Failed to start FlyMind observation server", e);
        }

        // Register Server Tick Event to stream observations and execute brain actions
        ServerTickEvents.END_SERVER_TICK.register(minecraftServer -> {
            if (server == null) return;
            tickCounter++;

            // Every 2 ticks (~10 Hz action cycle)
            if (tickCounter % 2 == 0) {
                for (ServerPlayerEntity player : minecraftServer.getPlayerManager().getPlayerList()) {
                    // Send observation to Python FlyMind brain
                    String obsJson = PlayerController.buildObservationJson(player, tickCounter);
                    server.sendObservationJson(obsJson);

                    // Check for incoming brain action
                    try {
                        String actionJson = server.readActionJson();
                        if (actionJson != null) {
                            PlayerController.applyActionJson(player, actionJson);
                        }
                    } catch (Exception e) {
                        LOGGER.debug("No action ready this tick", e);
                    }
                    break; // Control primary player
                }
            }
        });
    }
}
