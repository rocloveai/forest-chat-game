// ModelLoader.js - 负责加载外部 GLTF 模型
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class ModelLoader {
    constructor() {
        this.loader = new GLTFLoader();
        this.modelCache = {}; // 缓存已加载的模型
    }

    // 从 URL 加载模型
    async loadFromURL(url, type) {
        // 如果已缓存，克隆模型和动画
        if (this.modelCache[type] && this.modelCache[type].gltf) {
            const model = this.modelCache[type].gltf.scene.clone();
            model.castShadow = true;
            model.receiveShadow = true;
            return {
                model: model,
                animations: this.modelCache[type].gltf.animations || [],
                hasAnimations: this.modelCache[type].hasAnimations
            };
        }

        return new Promise((resolve, reject) => {
            this.loader.load(
                url,
                (gltf) => {
                    const model = gltf.scene.clone();
                    // 调整模型大小和位置
                    model.scale.set(1, 1, 1);
                    model.castShadow = true;
                    model.receiveShadow = true;
                    
                    // 检查是否有动画
                    const animations = gltf.animations || [];
                    const hasAnimations = animations.length > 0;
                    
                    // 返回模型和动画信息
                    const result = {
                        model: model,
                        animations: animations,
                        hasAnimations: hasAnimations
                    };
                    
                    // 缓存原始 gltf 数据（用于后续克隆）
                    if (!this.modelCache[type]) {
                        this.modelCache[type] = {
                            gltf: gltf,
                            hasAnimations: hasAnimations
                        };
                    }
                    
                    resolve(result);
                },
                (progress) => {
                    console.log(`加载 ${type} 模型进度: ${(progress.loaded / progress.total * 100)}%`);
                },
                (error) => {
                    console.error(`加载 ${type} 模型失败:`, error);
                    reject(error);
                }
            );
        });
    }

    // 从本地文件加载（需要放在 public/assets/models/ 目录下）
    async loadLocal(type) {
        const modelPaths = {
            pig: '/assets/models/pig.glb',
            rabbit: '/assets/models/rabbit.glb',
            cat: '/assets/models/cat.glb',
            dog: '/assets/models/dog.glb',
            cabbage: '/assets/models/cabbage.glb'
        };

        const path = modelPaths[type];
        if (!path) {
            console.warn(`未找到 ${type} 的模型路径，使用默认模型`);
            return null;
        }

        return this.loadFromURL(path, type);
    }
}
