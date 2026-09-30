package ai.flymind;

import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.util.math.Vec3d;
import org.json.JSONObject;

public class PlayerController {
    private static double targetX = 100.0;
    private static double targetZ = 100.0;

    public static void setTarget(double x, double z) {
        targetX = x;
        targetZ = z;
    }

    public static String buildObservationJson(ServerPlayerEntity player, int tick) {
        Vec3d pos = player.getPos();
        float yaw = player.getYaw();
        float pitch = player.getPitch();
        float health = player.getHealth();
        Vec3d vel = player.getVelocity();

        double dx = targetX - pos.x;
        double dz = targetZ - pos.z;
        double dist = Math.sqrt(dx * dx + dz * dz);

        double targetYaw = Math.toDegrees(Math.atan2(-dx, dz));
        double angleDiff = ((targetYaw - yaw + 180.0) % 360.0) - 180.0;

        double frontRay = RaycastHelper.castRay(player, 0.0f, 12.0);
        double leftRay = RaycastHelper.castRay(player, -45.0f, 12.0);
        double rightRay = RaycastHelper.castRay(player, 45.0f, 12.0);

        JSONObject json = new JSONObject();
        json.put("tick", tick);

        JSONObject posObj = new JSONObject();
        posObj.put("x", Math.round(pos.x * 100.0) / 100.0);
        posObj.put("y", Math.round(pos.y * 100.0) / 100.0);
        posObj.put("z", Math.round(pos.z * 100.0) / 100.0);
        json.put("position", posObj);

        json.put("yaw", Math.round(yaw * 10.0) / 10.0);
        json.put("pitch", Math.round(pitch * 10.0) / 10.0);
        json.put("health", health);

        json.put("velocity", new double[]{
                Math.round(vel.x * 1000.0) / 1000.0,
                Math.round(vel.y * 1000.0) / 1000.0,
                Math.round(vel.z * 1000.0) / 1000.0
        });

        JSONObject tgtObj = new JSONObject();
        tgtObj.put("distance", Math.round(dist * 100.0) / 100.0);
        tgtObj.put("angle", Math.round(angleDiff * 10.0) / 10.0);
        json.put("target", tgtObj);

        JSONObject rayObj = new JSONObject();
        rayObj.put("front", Math.round(frontRay * 100.0) / 100.0);
        rayObj.put("left", Math.round(leftRay * 100.0) / 100.0);
        rayObj.put("right", Math.round(rightRay * 100.0) / 100.0);
        json.put("raycast", rayObj);

        return json.toString();
    }

    public static void applyActionJson(ServerPlayerEntity player, String actionJsonStr) {
        if (actionJsonStr == null || actionJsonStr.isEmpty()) return;

        try {
            JSONObject action = new JSONObject(actionJsonStr);
            boolean forward = action.optBoolean("forward", false);
            boolean back = action.optBoolean("back", false);
            boolean left = action.optBoolean("left", false);
            boolean right = action.optBoolean("right", false);
            boolean jump = action.optBoolean("jump", false);
            boolean attack = action.optBoolean("attack", false);

            float speed = 0.22f;
            float yawRad = (float) Math.toRadians(player.getYaw());

            double motionX = 0;
            double motionZ = 0;

            if (forward) {
                motionX += -Math.sin(yawRad) * speed;
                motionZ += Math.cos(yawRad) * speed;
            }
            if (back) {
                motionX -= -Math.sin(yawRad) * (speed * 0.6);
                motionZ -= Math.cos(yawRad) * (speed * 0.6);
            }
            if (left) {
                player.setYaw(player.getYaw() - 15.0f);
            }
            if (right) {
                player.setYaw(player.getYaw() + 15.0f);
            }
            if (jump && player.isOnGround()) {
                player.jump();
            }

            if (motionX != 0 || motionZ != 0) {
                player.setVelocity(motionX, player.getVelocity().y, motionZ);
                player.velocityModified = true;
            }
        } catch (Exception e) {
            FlyMindMod.LOGGER.warn("Failed to apply action to player", e);
        }
    }
}
