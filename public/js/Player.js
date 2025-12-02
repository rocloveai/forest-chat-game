// Player.js - 负责玩家模型、移动、控制
import * as THREE from 'three';
import { AnimalModels } from './AnimalModels.js';
import { CollisionDetector } from './CollisionDetector.js';

export class Player {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.myPlayer = null;
        this.otherPlayers = {};
        this.moveSpeed = 0.2;
        this.keys = { w: false, a: false, s: false, d: false, space: false };
        this.cameraOffset = new THREE.Vector3(0, 8, 12);
        
        // 物理系统
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.isGrounded = true;
        this.jumpPower = 8;
        this.gravity = -20;
        this.jumpCooldown = 0;
        
        // 碰撞检测
        this.collisionDetector = new CollisionDetector();
    }

    createPlayerMesh(color, type) {
        // 使用新的动物模型系统
        const group = AnimalModels.create(type);
        return group;
    }

    createNameLabel(name) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, 256, 64);
        ctx.font = 'Bold 36px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, 128, 32);
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
        sprite.scale.set(2, 0.5, 1);
        return sprite;
    }

    createMyPlayer(info) {
        if(this.myPlayer) this.scene.remove(this.myPlayer);
        this.myPlayer = this.createPlayerMesh(info.color, info.modelType);
        const y = (info.y !== undefined) ? info.y : this.world.getTerrainHeight(info.x, info.z);
        this.myPlayer.position.set(info.x, y + 0.5, info.z);
        const label = this.createNameLabel(info.name);
        label.position.y = 1.5;
        this.myPlayer.add(label);
        this.scene.add(this.myPlayer);
    }

    addOtherPlayer(info) {
        if(this.otherPlayers[info.id]) {
            this.scene.remove(this.otherPlayers[info.id]);
        }
        const mesh = this.createPlayerMesh(info.color, info.modelType);
        const y = this.world.getTerrainHeight(info.x, info.z);
        mesh.position.set(info.x, y + 0.5, info.z);
        const label = this.createNameLabel(info.name || "Player");
        label.position.y = 1.5;
        mesh.add(label);
        this.scene.add(mesh);
        this.otherPlayers[info.id] = mesh;
    }

    removeOtherPlayer(id) {
        if(this.otherPlayers[id]) {
            this.scene.remove(this.otherPlayers[id]);
            delete this.otherPlayers[id];
        }
    }

    update(deltaTime, onMove) {
        if (!this.myPlayer) return;

        // 更新跳跃冷却
        if (this.jumpCooldown > 0) {
            this.jumpCooldown -= deltaTime;
        }

        // 处理跳跃
        if (this.keys.space && this.isGrounded && this.jumpCooldown <= 0) {
            this.velocity.y = this.jumpPower;
            this.isGrounded = false;
            this.jumpCooldown = 0.3; // 防止连续跳跃
        }

        // 应用重力
        this.velocity.y += this.gravity * deltaTime;

        // 水平移动
        let moveX = 0;
        let moveZ = 0;
        let moved = false;

        if (this.keys.w) { moveZ -= this.moveSpeed; moved = true; }
        if (this.keys.s) { moveZ += this.moveSpeed; moved = true; }
        if (this.keys.a) { moveX -= this.moveSpeed; moved = true; }
        if (this.keys.d) { moveX += this.moveSpeed; moved = true; }

        // 计算新位置
        let nextX = this.myPlayer.position.x + moveX;
        let nextZ = this.myPlayer.position.z + moveZ;

        // 边界限制
        if(nextX < -45) nextX = -45;
        if(nextX > 45) nextX = 45;
        if(nextZ < -45) nextZ = -45;
        if(nextZ > 45) nextZ = 45;

        // 碰撞检测：检查与其他玩家的碰撞
        const newPos = { x: nextX, z: nextZ };
        const currentPos = { 
            x: this.myPlayer.position.x, 
            z: this.myPlayer.position.z 
        };

        if (this.collisionDetector.checkMoveCollision(currentPos, newPos, this.otherPlayers, null)) {
            // 如果碰撞，尝试推开
            for (const [id, otherPlayer] of Object.entries(this.otherPlayers)) {
                const otherPos = { x: otherPlayer.position.x, z: otherPlayer.position.z };
                const push = this.collisionDetector.resolveCollision(newPos, otherPos);
                nextX += push.x;
                nextZ += push.z;
            }
        }

        // 应用水平移动
        if (moved) {
            this.myPlayer.position.x = nextX;
            this.myPlayer.position.z = nextZ;
            if (onMove) onMove({ x: nextX, z: nextZ });
        }

        // 应用垂直速度（跳跃/重力）
        this.myPlayer.position.y += this.velocity.y * deltaTime;

        // 检查是否着地
        const terrainY = this.world.getTerrainHeight(this.myPlayer.position.x, this.myPlayer.position.z);
        const groundLevel = terrainY + 0.5;
        
        if (this.myPlayer.position.y <= groundLevel) {
            this.myPlayer.position.y = groundLevel;
            this.velocity.y = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }
    }

    updateCamera(camera) {
        if (!this.myPlayer) return;
        const targetCam = this.myPlayer.position.clone().add(this.cameraOffset);
        const camTerrainY = this.world.getTerrainHeight(targetCam.x, targetCam.z);
        if (targetCam.y < camTerrainY + 1.5) targetCam.y = camTerrainY + 1.5;
        camera.position.lerp(targetCam, 0.1);
        camera.lookAt(this.myPlayer.position);
    }

    updateOtherPlayerPosition(id, x, z) {
        const other = this.otherPlayers[id];
        if (other) {
            // 检查与其他玩家的碰撞
            const newPos = { x, z };
            for (const [otherId, otherPlayer] of Object.entries(this.otherPlayers)) {
                if (otherId === id) continue;
                const otherPos = { 
                    x: otherPlayer.position.x, 
                    z: otherPlayer.position.z 
                };
                if (this.collisionDetector.checkPlayerCollision(newPos, otherPos)) {
                    // 如果碰撞，推开
                    const push = this.collisionDetector.resolveCollision(newPos, otherPos);
                    x += push.x;
                    z += push.z;
                }
            }
            
            other.position.x = x;
            other.position.z = z;
            const y = this.world.getTerrainHeight(x, z);
            other.position.y = y + 0.5;
        }
    }
}
