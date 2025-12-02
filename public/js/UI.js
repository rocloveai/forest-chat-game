// UI.js - 负责登录界面、聊天界面、气泡显示
import * as THREE from 'three';

export class UI {
    constructor() {
        this.playerBubbles = {};
        this.selectedType = 'pig'; // 默认选择小猪
        // 延迟初始化，确保 DOM 已加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupLoginUI());
        } else {
            this.setupLoginUI();
        }
    }

    setupLoginUI() {
        // 绑定动物选择事件
        const options = document.querySelectorAll('.avatar-option');
        options.forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                options.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                this.selectedType = opt.dataset.type;
                console.log('选择了:', this.selectedType);
            });
        });

        // 绑定开始按钮（防止重复绑定）
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            // 移除旧的事件监听器
            const newBtn = startBtn.cloneNode(true);
            startBtn.parentNode.replaceChild(newBtn, startBtn);
            
            newBtn.addEventListener('click', () => {
                const name = document.getElementById('nickname-input').value.trim() || "无名氏";
                console.log('开始游戏:', name, this.selectedType);
                document.getElementById('login-screen').style.display = 'none';
                if (this.onStartGame) {
                    this.onStartGame(name, this.selectedType);
                }
            });
        }
    }

    setupInputs(onSendMessage) {
        document.addEventListener('keydown', (e) => {
            if (document.activeElement === document.getElementById('chat-input')) {
                if (e.key === 'Enter') {
                    if (onSendMessage) onSendMessage();
                }
                return;
            }
        });
        document.getElementById('send-btn').addEventListener('click', () => {
            if (onSendMessage) onSendMessage();
        });
    }

    sendMessage(network) {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text || !network) return;
        network.emit('chatMessage', text);
        input.value = '';
        input.blur();
    }

    showBubble(playerId, text, camera, myPlayer, otherPlayers, myId) {
        if (this.playerBubbles[playerId]) {
            this.playerBubbles[playerId].element.remove();
            clearTimeout(this.playerBubbles[playerId].timeout);
        }

        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.innerText = text;
        document.body.appendChild(bubble);

        this.playerBubbles[playerId] = {
            element: bubble,
            timeout: setTimeout(() => {
                bubble.remove();
                delete this.playerBubbles[playerId];
            }, 3000)
        };
    }

    updateBubblesPosition(camera, myPlayer, otherPlayers, myId) {
        Object.keys(this.playerBubbles).forEach(id => {
            const bubbleData = this.playerBubbles[id];
            let target = (id === myId) ? myPlayer : otherPlayers[id];
            if (target) {
                const pos = this.getScreenPosition(target, camera);
                if (pos.z < 1) {
                    bubbleData.element.style.display = 'block';
                    bubbleData.element.style.left = pos.x + 'px';
                    bubbleData.element.style.top = pos.y + 'px';
                } else {
                    bubbleData.element.style.display = 'none';
                }
            }
        });
    }

    getScreenPosition(object3D, camera) {
        const vector = new THREE.Vector3();
        vector.setFromMatrixPosition(object3D.matrixWorld);
        vector.y += 2.0;
        vector.project(camera);
        const x = (vector.x * .5 + .5) * window.innerWidth;
        const y = (-(vector.y * .5) + .5) * window.innerHeight;
        return { x, y, z: vector.z };
    }

    removeBubble(playerId) {
        if (this.playerBubbles[playerId]) {
            this.playerBubbles[playerId].element.remove();
            delete this.playerBubbles[playerId];
        }
    }
}
