// Game.js - 游戏主控类，负责初始化、循环、协调各模块
import * as THREE from 'three';
import { World } from './World.js';
import { Player } from './Player.js';
import { Network } from './Network.js';
import { UI } from './UI.js';

export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = null;
        this.player = null;
        this.network = null;
        this.ui = null;
        this.isGameStarted = false;
        this.prevTime = performance.now();
    }

    init() {
        // 1. 创建场景
        this.scene = new THREE.Scene();
        // 塞尔达风格的渐变天空
        const skyColorTop = 0x87CEEB; // 天蓝色
        const skyColorBottom = 0xE0F2F1; // 浅青色
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(skyColorTop) },
                bottomColor: { value: new THREE.Color(skyColorBottom) },
                offset: { value: 0.5 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
        
        // 柔和的雾效
        this.scene.fog = new THREE.FogExp2(skyColorBottom, 0.015);

        // 2. 创建相机
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 20, 20);
        this.camera.lookAt(0, 0, 0);

        // 3. 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 软阴影
        this.renderer.setClearColor(0x87CEEB, 1);
        document.body.appendChild(this.renderer.domElement);

        // 4. 灯光（塞尔达风格的柔和光照）
        // 环境光（更柔和）
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        
        // 主光源（模拟太阳）
        const dirLight = new THREE.DirectionalLight(0xFFF8E1, 1.0);
        dirLight.position.set(30, 50, 20);
        dirLight.castShadow = true;
        
        // 阴影设置（更清晰的阴影）
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 200;
        dirLight.shadow.camera.left = -50;
        dirLight.shadow.camera.right = 50;
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = -50;
        dirLight.shadow.bias = -0.0001;
        this.scene.add(dirLight);
        
        // 补充光源（模拟天空光）
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x4A5D23, 0.4);
        this.scene.add(hemiLight);

        // 5. 初始化各模块
        this.world = new World(this.scene);
        this.player = new Player(this.scene, this.world);
        this.network = new Network();
        this.ui = new UI();

        // 6. 创建世界（塞尔达风格）
        this.world.createTerrain();
        this.world.generateDecorations(100); // 增加装饰物数量

        // 7. 设置 UI 回调（支持四种动物）
        this.ui.onStartGame = async (name, type) => {
            try {
                await this.startGame(name, type);
            } catch (error) {
                console.error('启动游戏失败:', error);
                alert('启动游戏失败，请刷新重试');
            }
        };

        // 8. 设置输入
        this.ui.setupInputs(() => {
            this.ui.sendMessage(this.network);
        });

        // 9. 设置键盘监听（给 Player 模块）
        this.setupKeyboard();

        // 10. 设置网络事件
        this.setupNetwork();

        // 11. 窗口调整
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (document.activeElement === document.getElementById('chat-input')) {
                return;
            }
            const key = e.key.toLowerCase();
            if (this.player.keys.hasOwnProperty(key)) {
                this.player.keys[key] = true;
            }
            if (e.code === 'Space') {
                this.player.keys.space = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (this.player.keys.hasOwnProperty(key)) {
                this.player.keys[key] = false;
            }
            if (e.code === 'Space') {
                this.player.keys.space = false;
            }
        });
    }

    setupNetwork() {
        this.network.on('currentPlayers', async (players) => {
            for (const id of Object.keys(players)) {
                if (id !== this.network.myId) {
                    await this.player.addOtherPlayer(players[id]);
                }
            }
        });

        this.network.on('newPlayer', async (playerInfo) => {
            if (playerInfo.id !== this.network.myId) {
                await this.player.addOtherPlayer(playerInfo);
            }
        });

        this.network.on('playerMoved', (playerInfo) => {
            this.player.updateOtherPlayerPosition(playerInfo.id, playerInfo.x, playerInfo.y, playerInfo.z);
        });

        this.network.on('disconnectPlayer', (id) => {
            this.player.removeOtherPlayer(id);
            this.ui.removeBubble(id);
        });

        this.network.on('chatMessage', (data) => {
            this.ui.showBubble(
                data.id, 
                data.text, 
                this.camera, 
                this.player.myPlayer, 
                this.player.otherPlayers, 
                this.network.myId
            );
        });
        
        // 咬住事件
        this.network.on('cabbageCaught', (data) => {
            // data: { animalId, cabbageId }
            this.player.setOtherPlayerCaught(data.cabbageId, data.animalId, true);
        });
        
        this.network.on('cabbageReleased', (data) => {
            // data: { animalId, cabbageId }
            this.player.setOtherPlayerCaught(data.cabbageId, data.animalId, false);
        });
    }

    async startGame(name, type) {
        this.isGameStarted = true;
        const startX = (Math.random() - 0.5) * 5;
        const startZ = (Math.random() - 0.5) * 5;
        const startY = this.world.getTerrainHeight(startX, startZ);

        // 异步创建玩家（等待模型加载）
        await this.player.createMyPlayer({
            id: this.network.myId,
            name: name,
            modelType: type,
            color: Math.random() * 0xffffff,
            x: startX,
            y: startY,
            z: startZ
        });

        if (this.network.socket && this.network.socket.connected) {
            this.network.emit('joinGame', { name, type });
        }
    }


    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = performance.now();
        const deltaTime = (time - this.prevTime) / 1000;
        this.prevTime = time;

        if (this.isGameStarted) {
            // 更新玩家
            this.player.update(deltaTime, (moveData) => {
                this.network.emit('playerMove', moveData);
            }, (catchEvent) => {
                // 处理咬住事件
                if (catchEvent.type === 'catch') {
                    this.network.emit('catchCabbage', {
                        animalId: this.network.myId,
                        cabbageId: catchEvent.cabbageId
                    });
                } else if (catchEvent.type === 'release') {
                    this.network.emit('releaseCabbage', {
                        animalId: this.network.myId,
                        cabbageId: catchEvent.targetId
                    });
                }
            });

            // 更新相机
            this.player.updateCamera(this.camera);
            
            // 更新其他玩家的跟随逻辑（被咬住的卷心菜跟随动物）
            this.player.updateOtherPlayersFollow(deltaTime);

            // 更新气泡位置
            this.ui.updateBubblesPosition(
                this.camera,
                this.player.myPlayer,
                this.player.otherPlayers,
                this.network.myId
            );
        }

        this.renderer.render(this.scene, this.camera);
    }
}
