// World.js - 负责地形生成、环境创建（塞尔达风格优化版）
import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.mapSize = 100;
        this.terrainMesh = null;
        this.decorations = []; // 存储所有装饰物，方便管理
    }

    // 简化的噪声函数（用于生成自然地形）
    noise(x, z) {
        return Math.sin(x * 0.1) * Math.cos(z * 0.1) + 
               Math.sin(x * 0.05) * Math.cos(z * 0.05) * 0.5 +
               Math.sin(x * 0.2 + 2.5) * Math.sin(z * 0.2 + 1.2) * 0.3;
    }

    getTerrainHeight(x, z) {
        // 使用多层噪声生成更自然的地形
        const y1 = this.noise(x, z) * 3; // 主要地形起伏
        const y2 = this.noise(x * 2, z * 2) * 1; // 细节起伏
        const y3 = this.noise(x * 0.5, z * 0.5) * 2; // 大范围变化
        
        let y = y1 + y2 + y3;
        
        // 中心区域稍微平坦
        const dist = Math.sqrt(x*x + z*z);
        if (dist < 10) {
            y = y * (dist / 10);
        }
        
        return y;
    }

    createTerrain() {
        // 创建更精细的地形网格
        const segments = 128; // 增加细分，让地形更平滑
        const geometry = new THREE.PlaneGeometry(this.mapSize, this.mapSize, segments, segments);
        const count = geometry.attributes.position.count;
        
        for (let i = 0; i < count; i++) {
            const x = geometry.attributes.position.getX(i);
            const y = geometry.attributes.position.getY(i);
            geometry.attributes.position.setZ(i, this.getTerrainHeight(x, y));
        }
        
        geometry.computeVertexNormals();
        
        // 使用 Toon Material（塞尔达风格）
        const material = new THREE.MeshToonMaterial({ 
            color: 0x7CB342, // 更柔和的绿色
            gradientMap: null, // 可以添加渐变贴图增强效果
            flatShading: false // 平滑着色
        });
        
        this.terrainMesh = new THREE.Mesh(geometry, material);
        this.terrainMesh.rotation.x = -Math.PI / 2;
        this.terrainMesh.receiveShadow = true;
        this.terrainMesh.castShadow = false;
        this.scene.add(this.terrainMesh);

        // 创建水体（更真实的水面）
        const waterGeometry = new THREE.PlaneGeometry(this.mapSize, this.mapSize, 32, 32);
        // 给水面添加轻微波动
        const waterPositions = waterGeometry.attributes.position;
        for (let i = 0; i < waterPositions.count; i++) {
            const x = waterPositions.getX(i);
            const z = waterPositions.getZ(i);
            const wave = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.1;
            waterPositions.setZ(i, wave);
        }
        waterGeometry.computeVertexNormals();
        
        const waterMaterial = new THREE.MeshToonMaterial({ 
            color: 0x4FC3F7, // 更柔和的蓝色
            transparent: true, 
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.y = -1.5;
        water.receiveShadow = true;
        this.scene.add(water);
    }

    // 创建草地（使用实例化渲染提高性能）
    createGrass() {
        const grassCount = 2000;
        const grassGeometry = new THREE.PlaneGeometry(0.3, 0.3);
        const grassMaterial = new THREE.MeshToonMaterial({ 
            color: 0x66BB6A,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        
        const grassInstances = new THREE.InstancedMesh(grassGeometry, grassMaterial, grassCount);
        
        const matrix = new THREE.Matrix4();
        for (let i = 0; i < grassCount; i++) {
            const x = (Math.random() - 0.5) * 90;
            const z = (Math.random() - 0.5) * 90;
            const y = this.getTerrainHeight(x, z);
            
            // 只在地面（不在水中）生成草
            if (y > -1.3) {
                matrix.makeTranslation(x, y + 0.05, z);
                matrix.makeRotationY(Math.random() * Math.PI * 2);
                const scale = 0.5 + Math.random() * 0.5;
                matrix.scale(new THREE.Vector3(scale, scale, scale));
                grassInstances.setMatrixAt(i, matrix);
            }
        }
        
        grassInstances.instanceMatrix.needsUpdate = true;
        this.scene.add(grassInstances);
        this.decorations.push(grassInstances);
    }

    // 创建花朵
    createFlowers() {
        const flowerCount = 300;
        const flowerColors = [0xFF6B9D, 0xFFC107, 0x9C27B0, 0xFF5722, 0x4CAF50];
        
        for (let i = 0; i < flowerCount; i++) {
            const x = (Math.random() - 0.5) * 90;
            const z = (Math.random() - 0.5) * 90;
            const y = this.getTerrainHeight(x, z);
            
            if (y > -1.3) {
                const flowerGroup = new THREE.Group();
                
                // 花瓣（多个小平面）
                const petalCount = 5;
                const petalGeometry = new THREE.CircleGeometry(0.08, 8);
                const petalColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
                const petalMaterial = new THREE.MeshToonMaterial({ 
                    color: petalColor,
                    side: THREE.DoubleSide
                });
                
                for (let p = 0; p < petalCount; p++) {
                    const petal = new THREE.Mesh(petalGeometry, petalMaterial);
                    const angle = (p / petalCount) * Math.PI * 2;
                    petal.position.set(
                        Math.cos(angle) * 0.05,
                        0.1,
                        Math.sin(angle) * 0.05
                    );
                    petal.rotation.x = Math.PI / 2;
                    flowerGroup.add(petal);
                }
                
                // 花心
                const center = new THREE.Mesh(
                    new THREE.CircleGeometry(0.03, 8),
                    new THREE.MeshToonMaterial({ color: 0xFFEB3B, side: THREE.DoubleSide })
                );
                center.position.y = 0.1;
                center.rotation.x = Math.PI / 2;
                flowerGroup.add(center);
                
                // 花茎
                const stem = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.01, 0.01, 0.1, 4),
                    new THREE.MeshToonMaterial({ color: 0x4CAF50 })
                );
                stem.position.y = 0.05;
                flowerGroup.add(stem);
                
                flowerGroup.position.set(x, y, z);
                flowerGroup.rotation.y = Math.random() * Math.PI * 2;
                this.scene.add(flowerGroup);
                this.decorations.push(flowerGroup);
            }
        }
    }

    // 创建蘑菇
    createMushrooms() {
        const mushroomCount = 150;
        
        for (let i = 0; i < mushroomCount; i++) {
            const x = (Math.random() - 0.5) * 90;
            const z = (Math.random() - 0.5) * 90;
            const y = this.getTerrainHeight(x, z);
            
            if (y > -1.3) {
                const mushroomGroup = new THREE.Group();
                
                // 蘑菇帽（红色带白点）
                const cap = new THREE.Mesh(
                    new THREE.SphereGeometry(0.15, 8, 8),
                    new THREE.MeshToonMaterial({ color: 0xE53935 })
                );
                cap.scale.set(1, 0.5, 1);
                cap.position.y = 0.2;
                mushroomGroup.add(cap);
                
                // 白点
                for (let d = 0; d < 3; d++) {
                    const dot = new THREE.Mesh(
                        new THREE.CircleGeometry(0.02, 6),
                        new THREE.MeshToonMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide })
                    );
                    dot.position.set(
                        (Math.random() - 0.5) * 0.1,
                        0.2 + Math.random() * 0.05,
                        (Math.random() - 0.5) * 0.1
                    );
                    dot.rotation.x = Math.PI / 2;
                    mushroomGroup.add(dot);
                }
                
                // 蘑菇茎
                const stem = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.04, 0.05, 0.15, 6),
                    new THREE.MeshToonMaterial({ color: 0xFFF9C4 })
                );
                stem.position.y = 0.075;
                mushroomGroup.add(stem);
                
                const scale = 0.7 + Math.random() * 0.6;
                mushroomGroup.scale.set(scale, scale, scale);
                mushroomGroup.position.set(x, y, z);
                this.scene.add(mushroomGroup);
                this.decorations.push(mushroomGroup);
            }
        }
    }

    // 创建灌木丛
    createBushes() {
        const bushCount = 200;
        
        for (let i = 0; i < bushCount; i++) {
            const x = (Math.random() - 0.5) * 90;
            const z = (Math.random() - 0.5) * 90;
            const y = this.getTerrainHeight(x, z);
            
            if (y > -1.3) {
                const bushGroup = new THREE.Group();
                
                // 多个球体组成灌木
                const sphereCount = 3 + Math.floor(Math.random() * 3);
                for (let s = 0; s < sphereCount; s++) {
                    const sphere = new THREE.Mesh(
                        new THREE.SphereGeometry(0.3, 6, 6),
                        new THREE.MeshToonMaterial({ color: 0x558B2F })
                    );
                    sphere.position.set(
                        (Math.random() - 0.5) * 0.4,
                        Math.random() * 0.2,
                        (Math.random() - 0.5) * 0.4
                    );
                    sphere.scale.set(
                        0.8 + Math.random() * 0.4,
                        0.6 + Math.random() * 0.4,
                        0.8 + Math.random() * 0.4
                    );
                    bushGroup.add(sphere);
                }
                
                const scale = 0.8 + Math.random() * 0.6;
                bushGroup.scale.set(scale, scale, scale);
                bushGroup.position.set(x, y, z);
                this.scene.add(bushGroup);
                this.decorations.push(bushGroup);
            }
        }
    }

    // 创建树木（多种样式）
    createTrees() {
        const treeCount = 80;
        const treeStyles = ['normal', 'tall', 'wide', 'small'];
        
        for (let i = 0; i < treeCount; i++) {
            const x = (Math.random() - 0.5) * 90;
            const z = (Math.random() - 0.5) * 90;
            const y = this.getTerrainHeight(x, z);
            
            // 不在水中生成树
            if (y < -1.3) continue;
            
            const style = treeStyles[Math.floor(Math.random() * treeStyles.length)];
            const treeGroup = this.createTree(style);
            
            const scale = 0.8 + Math.random() * 0.6;
            treeGroup.scale.set(scale, scale, scale);
            treeGroup.position.set(x, y, z);
            treeGroup.rotation.y = Math.random() * Math.PI * 2;
            this.scene.add(treeGroup);
            this.decorations.push(treeGroup);
        }
    }

    // 创建单棵树
    createTree(style = 'normal') {
        const group = new THREE.Group();
        
        let trunkHeight = 1.2;
        let leavesSize = 1.5;
        let leavesHeight = 3;
        
        // 根据样式调整
        switch(style) {
            case 'tall':
                trunkHeight = 1.8;
                leavesSize = 1.8;
                leavesHeight = 4;
                break;
            case 'wide':
                trunkHeight = 1.0;
                leavesSize = 2.2;
                leavesHeight = 2.5;
                break;
            case 'small':
                trunkHeight = 0.8;
                leavesSize = 1.2;
                leavesHeight = 2;
                break;
        }
        
        // 树干
        const trunkMat = new THREE.MeshToonMaterial({ color: 0x6D4C41 });
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.3, trunkHeight, 8),
            trunkMat
        );
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        group.add(trunk);
        
        // 树叶（多层，更自然）
        const leavesMat = new THREE.MeshToonMaterial({ color: 0x2E7D32 });
        const leaves1 = new THREE.Mesh(
            new THREE.ConeGeometry(leavesSize, leavesHeight, 8),
            leavesMat
        );
        leaves1.position.y = trunkHeight + leavesHeight * 0.5;
        leaves1.castShadow = true;
        group.add(leaves1);
        
        // 第二层树叶（更小）
        const leaves2 = new THREE.Mesh(
            new THREE.ConeGeometry(leavesSize * 0.7, leavesHeight * 0.6, 8),
            leavesMat
        );
        leaves2.position.y = trunkHeight + leavesHeight * 0.8;
        leaves2.castShadow = true;
        group.add(leaves2);
        
        return group;
    }

    // 创建石头（多种样式）
    createRocks() {
        const rockCount = 120;
        const rockShapes = ['dodecahedron', 'octahedron', 'tetrahedron', 'sphere'];
        
        for (let i = 0; i < rockCount; i++) {
            const x = (Math.random() - 0.5) * 90;
            const z = (Math.random() - 0.5) * 90;
            const y = this.getTerrainHeight(x, z);
            
            if (y < -1.2) {
                // 水中的石头
                const shape = rockShapes[Math.floor(Math.random() * rockShapes.length)];
                let geometry;
                
                switch(shape) {
                    case 'dodecahedron':
                        geometry = new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.3);
                        break;
                    case 'octahedron':
                        geometry = new THREE.OctahedronGeometry(0.4 + Math.random() * 0.3);
                        break;
                    case 'tetrahedron':
                        geometry = new THREE.TetrahedronGeometry(0.4 + Math.random() * 0.3);
                        break;
                    default:
                        geometry = new THREE.SphereGeometry(0.4 + Math.random() * 0.3, 6, 6);
                }
                
                const rock = new THREE.Mesh(
                    geometry,
                    new THREE.MeshToonMaterial({ color: 0x757575 })
                );
                rock.position.set(x, y + 0.5, z);
                rock.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                rock.castShadow = true;
                this.scene.add(rock);
                this.decorations.push(rock);
            } else {
                // 陆地上的石头
                const rock = new THREE.Mesh(
                    new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.4),
                    new THREE.MeshToonMaterial({ color: 0x9E9E9E })
                );
                rock.position.set(x, y, z);
                rock.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                rock.castShadow = true;
                this.scene.add(rock);
                this.decorations.push(rock);
            }
        }
    }

    // 生成所有装饰物
    generateDecorations(count) {
        console.log('生成塞尔达风格环境...');
        
        // 创建各种环境元素
        this.createGrass();
        this.createFlowers();
        this.createMushrooms();
        this.createBushes();
        this.createTrees();
        this.createRocks();
        
        console.log(`环境生成完成，共 ${this.decorations.length} 个装饰物`);
    }
}
