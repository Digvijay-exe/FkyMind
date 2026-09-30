package ai.flymind;

import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.util.hit.BlockHitResult;
import net.minecraft.util.hit.HitResult;
import net.minecraft.util.math.MathHelper;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.RaycastContext;
import net.minecraft.world.World;

public class RaycastHelper {

    public static double castRay(PlayerEntity player, float angleOffsetDeg, double maxDistance) {
        World world = player.getWorld();
        Vec3d eyePos = player.getEyePos();

        float yaw = player.getYaw() + angleOffsetDeg;
        float pitch = player.getPitch();

        float f = -MathHelper.sin(yaw * 0.017453292F) * MathHelper.cos(pitch * 0.017453292F);
        float g = -MathHelper.sin(pitch * 0.017453292F);
        float h = MathHelper.cos(yaw * 0.017453292F) * MathHelper.cos(pitch * 0.017453292F);
        Vec3d direction = new Vec3d(f, g, h).normalize();

        Vec3d endPos = eyePos.add(direction.multiply(maxDistance));

        BlockHitResult hit = world.raycast(new RaycastContext(
                eyePos,
                endPos,
                RaycastContext.ShapeType.OUTLINE,
                RaycastContext.FluidHandling.NONE,
                player
        ));

        if (hit.getType() == HitResult.Type.BLOCK) {
            return eyePos.distanceTo(hit.getPos());
        }

        return maxDistance;
    }
}
