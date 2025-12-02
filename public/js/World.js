// World.js - 负责地形生成、环境创建
import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.mapSize = 100;
        this.terrainMesh = null;
    }

    getTerrainHeight(x, z) {
        const y1 = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2;
        const y2 = Math.sin(x * 0.3 + 2.5) * Math.sin(z * 0.3 + 1.2) * 0.5;
        let y = y1 + y2;
        const dist = Math.sqrt(x*x + z*z);
        if (dist < 8) y = y * (dist / 8);
        return y;
    }

    createTerrain() {
        const geometry = new THREE.PlaneGeometry(this.mapSize, this.mapSize, 64, 64);
        const count = geometry.attributes.position.count;
        for (let i = 0; i < count; i++) {
            const x = geometry.attributes.position.getX(i);
            const y = geometry.attributes.position.getY(i);
            geometry.attributes.position.setZ(i, this.getTerrainHeight(x, y));
        }
        geometry.computeVertexNormals();
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x5DA130, 
            side: THREE.DoubleSide, 
            flatShading: true 
        });
        this.terrainMesh = new THREE.Mesh(geometry, material);
        this.terrainMesh.rotation.x = -Math.PI / 2;
        this.terrainMesh.receiveShadow = true;
        this.scene.add(this.terrainMesh);

        // 水面
        const water = new THREE.Mesh(
            new THREE.PlaneGeometry(this.mapSize, this.mapSize),
            new THREE.MeshLambertMaterial({ color: 0x00BFFF, transparent: true, opacity: 0.6 })
        );
        water.rotation.x = -Math.PI / 2;
        water.position.y = -1.2;
        this.scene.add(water);
    }

    generateDecorations(count) {
        const treeMat = new THREE.MeshLambertMaterial({ color: 0x2E8B57 });
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const rockMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;
            const y = this.getTerrainHeight(x, z);

            if (y < -1.2) {
                if(Math.random() > 0.7) {
                    const rock = new THREE.Mesh(
                        new THREE.DodecahedronGeometry(0.5 + Math.random()), 
                        rockMat
                    );
                    rock.position.set(x, y + 0.5, z);
                    this.scene.add(rock);
                }
                continue;
            }

            const group = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.2, 6), trunkMat);
            trunk.position.y = 0.6;
            const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 6), treeMat);
            leaves.position.y = 2.1;
            group.add(trunk, leaves);
            const s = 0.8 + Math.random() * 0.6;
            group.scale.set(s, s, s);
            group.position.set(x, y, z);
            this.scene.add(group);
        }
    }
}
