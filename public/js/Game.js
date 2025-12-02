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
        const skyColor = 0x87CEEB;
        this.scene.background = new THREE.Color(skyColor);
        this.scene.fog = new THREE.Fog(skyColor, 20, 100);

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
        document.body.appendChild(this.renderer.domElement);

        // 4. 灯光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(20, 40, 20);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        // 5. 初始化各模块
        this.world = new World(this.scene);
        this.player = new Player(this.scene, this.world);
        this.network = new Network();
        this.ui = new UI();

        // 6. 创建世界
        this.world.createTerrain();
        this.world.generateDecorations(40);

        // 7. 设置 UI 回调（支持四种动物）
        this.ui.onStartGame = (name, type) => {
            this.startGame(name, type);
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
        this.network.on('currentPlayers', (players) => {
            Object.keys(players).forEach((id) => {
                if (id !== this.network.myId) {
                    this.player.addOtherPlayer(players[id]);
                }
            });
        });

        this.network.on('newPlayer', (playerInfo) => {
            if (playerInfo.id !== this.network.myId) {
                this.player.addOtherPlayer(playerInfo);
            }
        });

        this.network.on('playerMoved', (playerInfo) => {
            this.player.updateOtherPlayerPosition(playerInfo.id, playerInfo.x, playerInfo.z);
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
    }

    startGame(name, type) {
        this.isGameStarted = true;
        const startX = (Math.random() - 0.5) * 5;
        const startZ = (Math.random() - 0.5) * 5;
        const startY = this.world.getTerrainHeight(startX, startZ);

        this.player.createMyPlayer({
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
            });

            // 更新相机
            this.player.updateCamera(this.camera);

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
