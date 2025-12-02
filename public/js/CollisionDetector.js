// CollisionDetector.js - 负责碰撞检测
import * as THREE from 'three';

export class CollisionDetector {
    constructor() {
        this.playerRadius = 0.6; // 玩家碰撞半径
    }

    // AABB 碰撞检测（轴对齐包围盒）
    checkPlayerCollision(player1Pos, player2Pos, radius = this.playerRadius) {
        const dx = player1Pos.x - player2Pos.x;
        const dz = player1Pos.z - player2Pos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        return distance < radius * 2;
    }

    // 检查移动后是否会碰撞
    checkMoveCollision(currentPos, newPos, otherPlayers, myId) {
        for (const [id, otherPlayer] of Object.entries(otherPlayers)) {
            if (id === myId) continue;
            
            const otherPos = {
                x: otherPlayer.position.x,
                z: otherPlayer.position.z
            };

            if (this.checkPlayerCollision(newPos, otherPos)) {
                return true; // 碰撞了
            }
        }
        return false; // 没有碰撞
    }

    // 解决碰撞：将玩家推开
    resolveCollision(playerPos, otherPlayerPos, radius = this.playerRadius) {
        const dx = playerPos.x - otherPlayerPos.x;
        const dz = playerPos.z - otherPlayerPos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < radius * 2 && distance > 0) {
            // 计算推开方向
            const pushDistance = (radius * 2 - distance) * 0.5;
            const angle = Math.atan2(dz, dx);
            
            return {
                x: Math.cos(angle) * pushDistance,
                z: Math.sin(angle) * pushDistance
            };
        }
        return { x: 0, z: 0 };
    }
}
