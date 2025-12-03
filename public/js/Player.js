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
        
        // 动画系统
        this.myPlayerMixer = null;
        this.myPlayerActions = {};
        this.otherPlayerMixers = {};
        this.otherPlayerActions = {};
        this.isMoving = false;
        this.walkAnimationTime = 0; // 用于程序化动画
        
        // 咬住机制
        this.myPlayerType = null; // 当前玩家的类型
        this.otherPlayerTypes = {}; // 其他玩家的类型 {id: type}
        this.isCaught = false; // 我是否被咬住（如果是卷心菜）
        this.caughtBy = null; // 被谁咬住（玩家ID）
        this.catchTimer = 0; // 咬住倒计时
        this.isEating = false; // 我是否在吃菜（如果是动物）
        this.eatingTarget = null; // 正在吃哪个玩家（玩家ID）
        this.eatingTimer = 0; // 吃菜倒计时
    }

    async createPlayerMeshAsync(color, type) {
        // 尝试加载外部模型，如果失败则使用代码生成的模型
        try {
            const result = await AnimalModels.createAsync(type);
            if (result && result.model) {
                return result; // 返回包含 model, animations, hasAnimations 的对象
            }
        } catch (error) {
            console.warn('模型加载失败，使用默认模型:', error);
        }
        // 回退到代码生成的模型
        return {
            model: AnimalModels.create(type),
            animations: [],
            hasAnimations: false
        };
    }

    createPlayerMesh(color, type) {
        // 同步版本（当前使用）
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

    async createMyPlayer(info) {
        try {
            if(this.myPlayer) {
                // 清理旧的动画混合器
                if (this.myPlayerMixer) {
                    this.myPlayerMixer.stopAllAction();
                    this.myPlayerMixer = null;
                }
                this.scene.remove(this.myPlayer);
            }
            
            // 尝试异步加载外部模型
            const result = await this.createPlayerMeshAsync(info.color, info.modelType);
            
            if (!result || !result.model) {
                console.error('无法创建玩家模型');
                return;
            }
            
            this.myPlayer = result.model;
            this.myPlayerType = info.modelType; // 保存玩家类型
            const y = (info.y !== undefined) ? info.y : this.world.getTerrainHeight(info.x, info.z);
            this.myPlayer.position.set(info.x, y + 0.5, info.z);
            const label = this.createNameLabel(info.name);
            label.position.y = 1.5;
            this.myPlayer.add(label);
            this.scene.add(this.myPlayer);
            
            // 设置动画
            this.setupPlayerAnimation(this.myPlayer, result.animations, result.hasAnimations, true);
        } catch (error) {
            console.error('创建玩家失败:', error);
            // 即使失败也尝试创建默认模型
            this.myPlayer = this.createPlayerMesh(info.color, info.modelType);
            this.myPlayerType = info.modelType; // 保存玩家类型
            const y = (info.y !== undefined) ? info.y : this.world.getTerrainHeight(info.x, info.z);
            this.myPlayer.position.set(info.x, y + 0.5, info.z);
            const label = this.createNameLabel(info.name);
            label.position.y = 1.5;
            this.myPlayer.add(label);
            this.scene.add(this.myPlayer);
            // 默认模型没有动画
            this.setupPlayerAnimation(this.myPlayer, [], false, true);
        }
    }

    async addOtherPlayer(info) {
        try {
            if(this.otherPlayers[info.id]) {
                // 清理旧的动画混合器
                if (this.otherPlayerMixers[info.id]) {
                    this.otherPlayerMixers[info.id].stopAllAction();
                    delete this.otherPlayerMixers[info.id];
                }
                this.scene.remove(this.otherPlayers[info.id]);
            }
            // 尝试异步加载外部模型
            const result = await this.createPlayerMeshAsync(info.color, info.modelType);
            let mesh;
            let animations = [];
            let hasAnimations = false;
            
            if (!result || !result.model) {
                console.warn('无法创建其他玩家模型，使用默认模型');
                mesh = this.createPlayerMesh(info.color, info.modelType);
            } else {
                mesh = result.model;
                animations = result.animations || [];
                hasAnimations = result.hasAnimations || false;
            }
            const y = this.world.getTerrainHeight(info.x, info.z);
            mesh.position.set(info.x, y + 0.5, info.z);
            const label = this.createNameLabel(info.name || "Player");
            label.position.y = 1.5;
            mesh.add(label);
            this.scene.add(mesh);
            this.otherPlayers[info.id] = mesh;
            this.otherPlayerTypes[info.id] = info.modelType; // 保存其他玩家类型
            
            // 设置动画
            this.setupPlayerAnimation(mesh, animations, hasAnimations, false, info.id);
        } catch (error) {
            console.error('添加其他玩家失败:', error);
            // 失败时使用默认模型
            const mesh = this.createPlayerMesh(info.color, info.modelType);
            const y = this.world.getTerrainHeight(info.x, info.z);
            mesh.position.set(info.x, y + 0.5, info.z);
            const label = this.createNameLabel(info.name || "Player");
            label.position.y = 1.5;
            mesh.add(label);
            this.scene.add(mesh);
            this.otherPlayers[info.id] = mesh;
            this.otherPlayerTypes[info.id] = info.modelType; // 保存其他玩家类型
            // 默认模型没有动画
            this.setupPlayerAnimation(mesh, [], false, false, info.id);
        }
    }

    removeOtherPlayer(id) {
        if(this.otherPlayers[id]) {
            // 清理动画混合器
            if (this.otherPlayerMixers[id]) {
                this.otherPlayerMixers[id].stopAllAction();
                delete this.otherPlayerMixers[id];
            }
            if (this.otherPlayerActions[id]) {
                delete this.otherPlayerActions[id];
            }
            // 清理咬住状态
            if (this.caughtBy === id) {
                this.isCaught = false;
                this.caughtBy = null;
                this.catchTimer = 0;
            }
            if (this.eatingTarget === id) {
                this.isEating = false;
                this.eatingTarget = null;
                this.eatingTimer = 0;
            }
            delete this.otherPlayerTypes[id];
            this.scene.remove(this.otherPlayers[id]);
            delete this.otherPlayers[id];
        }
    }
    
    // 设置玩家动画
    setupPlayerAnimation(model, animations, hasAnimations, isMyPlayer, playerId = null) {
        if (hasAnimations && animations.length > 0) {
            // 使用 GLB 模型自带的动画
            const mixer = new THREE.AnimationMixer(model);
            const actions = {};
            
            console.log(`模型有 ${animations.length} 个动画:`, animations.map(a => a.name));
            
            // 查找行走动画（通常命名为 walk, run, move 等）
            let walkAction = null;
            const walkNames = ['walk', 'run', 'move', 'walking', 'running'];
            
            for (const clip of animations) {
                const action = mixer.clipAction(clip);
                actions[clip.name] = action;
                
                // 检查是否是行走动画
                if (walkNames.some(name => clip.name.toLowerCase().includes(name))) {
                    walkAction = action;
                    console.log(`找到行走动画: ${clip.name}`);
                }
            }
            
            // 如果没有找到行走动画，使用第一个动画
            if (!walkAction && animations.length > 0) {
                walkAction = actions[animations[0].name];
                console.log(`使用第一个动画: ${animations[0].name}`);
            }
            
            if (walkAction) {
                walkAction.setLoop(THREE.LoopRepeat);
                walkAction.setEffectiveTimeScale(1.0);
                walkAction.play();
                console.log(`播放动画: ${walkAction.getClip().name}`);
            }
            
            if (isMyPlayer) {
                this.myPlayerMixer = mixer;
                this.myPlayerActions = actions;
            } else if (playerId) {
                this.otherPlayerMixers[playerId] = mixer;
                this.otherPlayerActions[playerId] = actions;
            }
        } else {
            // 没有内置动画，使用程序化动画
            console.log('模型没有内置动画，使用程序化动画');
            model.userData.needsProceduralAnimation = true;
            model.userData.animationTime = 0;
            
            // 保存原始旋转状态（用于重置）
            model.traverse((child) => {
                if (child.isMesh) {
                    child.userData.originalRotation = {
                        x: child.rotation.x,
                        y: child.rotation.y,
                        z: child.rotation.z
                    };
                }
            });
        }
    }
    
    // 更新程序化行走动画（简单的腿部摆动和身体起伏）
    updateProceduralAnimation(model, deltaTime, isMoving) {
        if (!model.userData.needsProceduralAnimation) return;
        
        // 初始化动画时间
        if (model.userData.animationTime === undefined) {
            model.userData.animationTime = 0;
            model.userData.originalPosition = model.position.clone();
        }
        
        if (isMoving) {
            model.userData.animationTime += deltaTime * 10; // 移动时动画更快
            
            // 查找腿部和身体部件（通过遍历子对象）
            const bodyParts = [];
            const legParts = [];
            model.traverse((child) => {
                if (child.isMesh && child.name) {
                    const name = child.name.toLowerCase();
                    // 查找可能的腿部部件
                    if (name.includes('leg') || name.includes('foot') || name.includes('paw') || 
                        name.includes('thigh') || name.includes('calf')) {
                        legParts.push({ mesh: child, index: legParts.length });
                    } else if (name.includes('body') || name.includes('torso') || name.includes('chest')) {
                        bodyParts.push({ mesh: child, type: 'body' });
                    }
                }
            });
            
            // 如果有命名的腿部部件，对它们应用动画
            if (legParts.length > 0) {
                legParts.forEach((part, index) => {
                    // 前后腿交替摆动
                    const phase = (index % 2 === 0) ? 0 : Math.PI;
                    const swing = Math.sin(model.userData.animationTime + phase) * 0.4;
                    part.mesh.rotation.x = swing;
                });
            }
            
            // 身体起伏动画（更明显）
            if (bodyParts.length > 0) {
                bodyParts.forEach((part) => {
                    const bounce = Math.sin(model.userData.animationTime * 2) * 0.1;
                    part.mesh.rotation.z = bounce * 0.3;
                    // 轻微的上下移动（相对于原始位置）
                    const verticalBounce = Math.abs(Math.sin(model.userData.animationTime * 2)) * 0.05;
                    part.mesh.position.y = verticalBounce;
                });
            } else {
                // 如果没有找到命名部件，对整个模型应用简单的动画
                // 身体轻微的前后倾斜
                const tilt = Math.sin(model.userData.animationTime) * 0.15;
                model.rotation.x = tilt;
                
                // 轻微的左右摆动
                const sway = Math.sin(model.userData.animationTime * 0.5) * 0.1;
                model.rotation.z = sway;
            }
        } else {
            // 静止时，重置动画状态
            model.userData.animationTime = 0;
            // 重置旋转（但保持 Y 轴旋转，因为那是朝向）
            if (model.rotation.x !== undefined) {
                model.rotation.x += (0 - model.rotation.x) * 0.1;
            }
            if (model.rotation.z !== undefined) {
                model.rotation.z += (0 - model.rotation.z) * 0.1;
            }
            
            // 重置所有子部件的旋转
            model.traverse((child) => {
                if (child.isMesh && child.userData.originalRotation) {
                    child.rotation.x += (child.userData.originalRotation.x - child.rotation.x) * 0.1;
                    child.rotation.z += (child.userData.originalRotation.z - child.rotation.z) * 0.1;
                }
            });
        }
    }

    update(deltaTime, onMove, onCatchEvent) {
        if (!this.myPlayer) return;

        // 更新动画混合器
        if (this.myPlayerMixer) {
            this.myPlayerMixer.update(deltaTime);
        }
        
        // 更新其他玩家的动画混合器
        for (const [id, mixer] of Object.entries(this.otherPlayerMixers)) {
            mixer.update(deltaTime);
        }

        // 更新咬住倒计时
        if (this.isCaught && this.catchTimer > 0) {
            this.catchTimer -= deltaTime;
            if (this.catchTimer <= 0) {
                // 释放
                this.isCaught = false;
                this.caughtBy = null;
                if (onCatchEvent) {
                    onCatchEvent({ type: 'release', targetId: null });
                }
            }
        }
        
        // 更新吃菜倒计时
        if (this.isEating && this.eatingTimer > 0) {
            this.eatingTimer -= deltaTime;
            if (this.eatingTimer <= 0) {
                // 停止吃菜
                this.isEating = false;
                this.eatingTarget = null;
            }
        }

        // 更新跳跃冷却
        if (this.jumpCooldown > 0) {
            this.jumpCooldown -= deltaTime;
        }

        // 处理跳跃（被咬住时无法跳跃）
        if (this.keys.space && this.isGrounded && this.jumpCooldown <= 0 && !this.isCaught) {
            this.velocity.y = this.jumpPower;
            this.isGrounded = false;
            this.jumpCooldown = 0.3; // 防止连续跳跃
        }

        // 应用重力
        this.velocity.y += this.gravity * deltaTime;

        // 检测动物和卷心菜的碰撞
        this.checkCatchCollision(onCatchEvent);

        // 水平移动（被咬住时无法移动）
        let moveX = 0;
        let moveZ = 0;
        let moved = false;

        if (!this.isCaught) { // 被咬住时无法移动
            if (this.keys.w) { moveZ -= this.moveSpeed; moved = true; }
            if (this.keys.s) { moveZ += this.moveSpeed; moved = true; }
            if (this.keys.a) { moveX -= this.moveSpeed; moved = true; }
            if (this.keys.d) { moveX += this.moveSpeed; moved = true; }
        }
        
        // 更新移动状态（用于动画）
        this.isMoving = moved && !this.isCaught;

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

        // 检查碰撞，但特殊处理动物和卷心菜的碰撞
        let shouldPush = true;
        const animalTypes = ['pig', 'rabbit', 'cat', 'dog'];
        const isAnimal = this.myPlayerType && animalTypes.includes(this.myPlayerType);
        
        for (const [id, otherPlayer] of Object.entries(this.otherPlayers)) {
            const otherPos = { x: otherPlayer.position.x, z: otherPlayer.position.z };
            const otherType = this.otherPlayerTypes[id];
            
            if (this.collisionDetector.checkPlayerCollision(newPos, otherPos)) {
                // 如果是动物碰到卷心菜，不推开，而是触发咬住（如果还没咬住）
                if (isAnimal && otherType === 'cabbage' && !this.isEating) {
                    shouldPush = false;
                    // 咬住检测会在后面执行，这里只是阻止推开
                } else if (this.isCaught && this.caughtBy === id) {
                    // 如果我是卷心菜且被这个动物咬住，不推开
                    shouldPush = false;
                } else if (this.isEating && this.eatingTarget === id) {
                    // 如果我正在吃这个卷心菜，不推开
                    shouldPush = false;
                } else {
                    // 其他情况正常推开
                    const push = this.collisionDetector.resolveCollision(newPos, otherPos);
                    nextX += push.x;
                    nextZ += push.z;
                }
            }
        }

        // 应用水平移动（被咬住时不能移动）
        if (moved && !this.isCaught) {
            this.myPlayer.position.x = nextX;
            this.myPlayer.position.z = nextZ;
            
            // 根据移动方向旋转模型
            const moveDirection = Math.atan2(moveX, moveZ);
            // 平滑旋转到目标方向
            let targetRotation = moveDirection;
            let currentRotation = this.myPlayer.rotation.y;
            
            // 计算角度差（处理 -π 到 π 的边界）
            let angleDiff = targetRotation - currentRotation;
            if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            // 平滑插值旋转
            this.myPlayer.rotation.y = currentRotation + angleDiff * 0.2;
        }

        // 应用垂直速度（跳跃/重力）
        const oldY = this.myPlayer.position.y;
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
        
        // 发送位置更新（包括 Y 坐标，用于同步跳跃）
        // 只在有移动或 Y 坐标变化时发送（减少网络流量）
        const yChanged = Math.abs(this.myPlayer.position.y - oldY) > 0.01;
        if (onMove && (moved || yChanged)) {
            onMove({ 
                x: this.myPlayer.position.x, 
                y: this.myPlayer.position.y,
                z: this.myPlayer.position.z 
            });
        }
        
        // 更新吃菜动画（必须在位置更新之后）
        if (this.isEating && this.myPlayer) {
            this.updateEatingAnimation(this.myPlayer, deltaTime);
        } else if (this.myPlayer && this.myPlayer.userData.eatingTime !== undefined) {
            // 停止吃菜时重置动画状态
            this.myPlayer.rotation.x = 0;
            this.myPlayer.rotation.z = 0;
            if (this.myPlayer.userData.originalZ !== undefined) {
                this.myPlayer.position.z = this.myPlayer.userData.originalZ;
            }
        }
        
        // 如果我是卷心菜且被咬住，跟随咬住我的动物
        if (this.isCaught && this.caughtBy && this.myPlayer && this.otherPlayers[this.caughtBy]) {
            const animal = this.otherPlayers[this.caughtBy];
            // 卷心菜跟随动物，稍微偏移（在动物前方）
            const offset = 0.4; // 偏移距离
            const angle = animal.rotation.y;
            this.myPlayer.position.x = animal.position.x + Math.sin(angle) * offset;
            this.myPlayer.position.z = animal.position.z + Math.cos(angle) * offset;
            this.myPlayer.position.y = animal.position.y; // 保持相同高度
            
            // 卷心菜朝向动物
            const direction = Math.atan2(
                animal.position.x - this.myPlayer.position.x,
                animal.position.z - this.myPlayer.position.z
            );
            this.myPlayer.rotation.y = direction;
        }
        
        // 更新程序化动画（如果没有内置动画）
        if (this.myPlayer && !this.myPlayerMixer) {
            this.updateProceduralAnimation(this.myPlayer, deltaTime, this.isMoving && !this.isEating);
        }
        
        // 更新其他玩家的程序化动画
        for (const [id, otherPlayer] of Object.entries(this.otherPlayers)) {
            if (!this.otherPlayerMixers[id]) {
                // 简单判断其他玩家是否在移动（通过位置变化）
                // 这里可以优化：记录上次位置来判断是否移动
                const isOtherEating = this.otherPlayerTypes[id] !== 'cabbage' && 
                                     this.otherPlayers[id].userData?.isEating;
                this.updateProceduralAnimation(otherPlayer, deltaTime, !isOtherEating);
            }
        }
        
        // 更新行走动画速度（根据移动状态）
        if (this.myPlayerActions && this.myPlayerMixer) {
            for (const action of Object.values(this.myPlayerActions)) {
                if (action.isRunning()) {
                    // 移动时正常速度，静止时暂停，吃菜时播放吃菜动画
                    if (this.isEating) {
                        action.timeScale = 1.5; // 吃菜时动画更快
                    } else {
                        action.timeScale = this.isMoving ? 1.0 : 0.0;
                    }
                }
            }
        }
        
        // 更新其他玩家的动画
        for (const [id, actions] of Object.entries(this.otherPlayerActions)) {
            if (this.otherPlayerMixers[id]) {
                const isOtherEating = this.otherPlayers[id].userData?.isEating;
                for (const action of Object.values(actions)) {
                    if (action.isRunning()) {
                        action.timeScale = isOtherEating ? 1.5 : 1.0;
                    }
                }
            }
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

    // 检测动物和卷心菜的碰撞
    checkCatchCollision(onCatchEvent) {
        if (!this.myPlayer || !this.myPlayerType) return;
        
        const animalTypes = ['pig', 'rabbit', 'cat', 'dog'];
        const isAnimal = animalTypes.includes(this.myPlayerType);
        
        // 如果我是动物，检查是否碰到卷心菜
        if (isAnimal && !this.isEating) {
            for (const [id, otherPlayer] of Object.entries(this.otherPlayers)) {
                const otherType = this.otherPlayerTypes[id];
                if (otherType === 'cabbage') {
                    const myPos = { x: this.myPlayer.position.x, z: this.myPlayer.position.z };
                    const otherPos = { x: otherPlayer.position.x, z: otherPlayer.position.z };
                    
                    // 使用稍大的碰撞半径，确保更容易触发
                    const distance = Math.sqrt(
                        Math.pow(myPos.x - otherPos.x, 2) + 
                        Math.pow(myPos.z - otherPos.z, 2)
                    );
                    
                    if (distance < 1.5) { // 碰撞距离（比普通碰撞稍大）
                        // 检查卷心菜是否已经被咬住
                        if (!otherPlayer.userData?.isCaught) {
                            // 触发咬住
                            console.log('触发咬住！', id);
                            this.isEating = true;
                            this.eatingTarget = id;
                            this.eatingTimer = 2.0; // 2秒
                            
                            if (onCatchEvent) {
                                onCatchEvent({ 
                                    type: 'catch', 
                                    animalId: null, // 我的ID会在服务器端填充
                                    cabbageId: id 
                                });
                            }
                            break;
                        }
                    }
                }
            }
        }
    }
    
    // 更新吃菜动画
    updateEatingAnimation(model, deltaTime) {
        if (!model.userData.eatingTime) {
            model.userData.eatingTime = 0;
        }
        model.userData.eatingTime += deltaTime * 8; // 吃菜动画速度（更快更明显）
        
        // 头部上下摆动（模拟咀嚼）- 更明显的动画
        const headBounce = Math.sin(model.userData.eatingTime) * 0.25;
        model.rotation.x = headBounce;
        
        // 轻微的前后移动（模拟咬的动作）
        const forwardBounce = Math.sin(model.userData.eatingTime * 2) * 0.1;
        // 保存原始位置，避免累积偏移
        if (!model.userData.originalZ) {
            model.userData.originalZ = model.position.z;
        }
        model.position.z = model.userData.originalZ + forwardBounce;
        
        // 轻微的左右摆动
        const sideSway = Math.sin(model.userData.eatingTime * 1.5) * 0.05;
        model.rotation.z = sideSway;
        
        // 查找可能的头部或嘴巴部件
        model.traverse((child) => {
            if (child.isMesh && child.name) {
                const name = child.name.toLowerCase();
                if (name.includes('head') || name.includes('mouth') || name.includes('jaw') || 
                    name.includes('snout') || name.includes('nose')) {
                    const chew = Math.sin(model.userData.eatingTime * 3) * 0.3;
                    if (!child.userData.originalRotationX) {
                        child.userData.originalRotationX = child.rotation.x;
                    }
                    child.rotation.x = child.userData.originalRotationX + chew;
                }
            }
        });
    }
    
    // 设置其他玩家的咬住状态（从服务器同步）
    setOtherPlayerCaught(cabbageId, animalId, isCaught) {
        if (this.otherPlayers[cabbageId]) {
            this.otherPlayers[cabbageId].userData.isCaught = isCaught;
            this.otherPlayers[cabbageId].userData.caughtBy = isCaught ? animalId : null;
        }
        if (this.otherPlayers[animalId]) {
            this.otherPlayers[animalId].userData.isEating = isCaught;
            this.otherPlayers[animalId].userData.eatingTarget = isCaught ? cabbageId : null;
        }
    }
    
    // 更新其他玩家的跟随逻辑（在 animate 中调用）
    updateOtherPlayersFollow(deltaTime) {
        for (const [id, otherPlayer] of Object.entries(this.otherPlayers)) {
            // 更新其他玩家的吃菜动画
            if (otherPlayer.userData?.isEating) {
                this.updateEatingAnimation(otherPlayer, deltaTime);
            } else if (otherPlayer.userData?.eatingTime !== undefined) {
                // 停止吃菜时重置动画
                otherPlayer.rotation.x = 0;
                otherPlayer.rotation.z = 0;
                if (otherPlayer.userData.originalZ !== undefined) {
                    otherPlayer.position.z = otherPlayer.userData.originalZ;
                }
            }
            
            // 卷心菜跟随动物
            if (otherPlayer.userData?.isCaught && otherPlayer.userData?.caughtBy) {
                const animalId = otherPlayer.userData.caughtBy;
                const animal = this.otherPlayers[animalId];
                if (animal) {
                    // 卷心菜跟随动物，稍微偏移（在动物前方）
                    const offset = 0.4;
                    const angle = animal.rotation.y;
                    otherPlayer.position.x = animal.position.x + Math.sin(angle) * offset;
                    otherPlayer.position.z = animal.position.z + Math.cos(angle) * offset;
                    otherPlayer.position.y = animal.position.y;
                    
                    // 卷心菜朝向动物
                    const direction = Math.atan2(
                        animal.position.x - otherPlayer.position.x,
                        animal.position.z - otherPlayer.position.z
                    );
                    otherPlayer.rotation.y = direction;
                }
            }
        }
    }
    
    updateOtherPlayerPosition(id, x, y, z) {
        const other = this.otherPlayers[id];
        if (other) {
            // 如果其他玩家被咬住（卷心菜），不允许移动
            if (other.userData?.isCaught) {
                return; // 不更新位置
            }
            
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
            
            // 计算移动方向并旋转模型
            const oldX = other.position.x;
            const oldZ = other.position.z;
            const moveX = x - oldX;
            const moveZ = z - oldZ;
            
            if (Math.abs(moveX) > 0.01 || Math.abs(moveZ) > 0.01) {
                // 有移动，计算方向并旋转
                const moveDirection = Math.atan2(moveX, moveZ);
                let currentRotation = other.rotation.y;
                
                // 计算角度差（处理 -π 到 π 的边界）
                let angleDiff = moveDirection - currentRotation;
                if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                // 平滑插值旋转
                other.rotation.y = currentRotation + angleDiff * 0.3;
            }
            
            // 更新位置（使用服务器传来的 Y 坐标，用于同步跳跃）
            other.position.x = x;
            other.position.z = z;
            
            // 如果服务器传来了 Y 坐标，使用它（用于跳跃同步）
            // 否则使用地形高度
            if (y !== undefined && y !== null) {
                // 确保 Y 不会低于地面
                const terrainY = this.world.getTerrainHeight(x, z);
                const groundLevel = terrainY + 0.5;
                other.position.y = Math.max(y, groundLevel);
            } else {
                // 如果没有 Y 坐标，使用地形高度
                const terrainY = this.world.getTerrainHeight(x, z);
                other.position.y = terrainY + 0.5;
            }
        }
    }
}
