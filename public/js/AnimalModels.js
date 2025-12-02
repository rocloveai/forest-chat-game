// AnimalModels.js - 负责创建逼真的动物模型（增强版）
import * as THREE from 'three';

export class AnimalModels {
    static createPig() {
        const group = new THREE.Group();
        
        // 主身体（更圆润的椭圆形）
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.55, 20, 20),
            new THREE.MeshLambertMaterial({ color: 0xFFB6C1 })
        );
        body.scale.set(1.1, 0.85, 1.3);
        group.add(body);

        // 头部（独立球体，更精细）
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.38, 20, 20),
            new THREE.MeshLambertMaterial({ color: 0xFFB6C1 })
        );
        head.position.set(0, 0.35, 0.65);
        group.add(head);

        // 鼻子（更立体的椭圆形）
        const nose = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 16, 16),
            new THREE.MeshLambertMaterial({ color: 0xFF69B4 })
        );
        nose.position.set(0, 0.25, 0.8);
        nose.scale.set(1.3, 0.9, 1.1);
        group.add(nose);

        // 鼻孔（两个小洞）
        const nostrilGeo = new THREE.SphereGeometry(0.04, 10, 10);
        const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const leftNostril = new THREE.Mesh(nostrilGeo, nostrilMat);
        leftNostril.position.set(-0.06, 0.25, 0.85);
        const rightNostril = new THREE.Mesh(nostrilGeo, nostrilMat);
        rightNostril.position.set(0.06, 0.25, 0.85);
        group.add(leftNostril, rightNostril);

        // 眼睛（更大更圆）
        const eyeGeo = new THREE.SphereGeometry(0.1, 14, 14);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const lEye = new THREE.Mesh(eyeGeo, eyeMat);
        lEye.position.set(-0.18, 0.45, 0.68);
        const rEye = new THREE.Mesh(eyeGeo, eyeMat);
        rEye.position.set(0.18, 0.45, 0.68);
        group.add(lEye, rEye);

        // 眼白（增加真实感）
        const eyeWhiteGeo = new THREE.SphereGeometry(0.12, 12, 12);
        const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        const lEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
        lEyeWhite.position.set(-0.18, 0.45, 0.66);
        const rEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
        rEyeWhite.position.set(0.18, 0.45, 0.66);
        group.add(lEyeWhite, rEyeWhite);
        group.add(lEye, rEye); // 眼睛在眼白之上

        // 耳朵（更大更自然的下垂）
        const earGeo = new THREE.ConeGeometry(0.22, 0.35, 10);
        const earMat = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 });
        const lEar = new THREE.Mesh(earGeo, earMat);
        lEar.rotation.z = -0.6;
        lEar.rotation.x = 0.2;
        lEar.position.set(-0.35, 0.55, 0.45);
        const rEar = new THREE.Mesh(earGeo, earMat);
        rEar.rotation.z = 0.6;
        rEar.rotation.x = 0.2;
        rEar.position.set(0.35, 0.55, 0.45);
        group.add(lEar, rEar);

        // 尾巴（螺旋状，更生动）
        const tail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.025, 0.35, 10),
            new THREE.MeshLambertMaterial({ color: 0xFFB6C1 })
        );
        tail.rotation.x = Math.PI / 2;
        tail.rotation.z = 0.3;
        tail.position.set(0, 0.25, -0.75);
        group.add(tail);

        // 四条腿（更明显）
        const legGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.4, 12);
        const legMat = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 });
        const legPositions = [
            { x: -0.3, z: 0.3 },
            { x: 0.3, z: 0.3 },
            { x: -0.3, z: -0.3 },
            { x: 0.3, z: -0.3 }
        ];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(pos.x, -0.15, pos.z);
            group.add(leg);
        });

        group.castShadow = true;
        group.receiveShadow = true;
        return group;
    }

    static createRabbit() {
        const group = new THREE.Group();
        
        // 身体（更圆润）
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.45, 20, 20),
            new THREE.MeshLambertMaterial({ color: 0xF5F5DC })
        );
        body.scale.set(1.05, 0.95, 1.15);
        group.add(body);

        // 头部
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.32, 18, 18),
            new THREE.MeshLambertMaterial({ color: 0xF5F5DC })
        );
        head.position.set(0, 0.25, 0.55);
        group.add(head);

        // 超长耳朵（兔子的标志）
        const earGeo = new THREE.CylinderGeometry(0.1, 0.14, 0.7, 14);
        const earMat = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
        const lEar = new THREE.Mesh(earGeo, earMat);
        lEar.rotation.z = -0.25;
        lEar.position.set(-0.18, 0.7, 0.25);
        const rEar = new THREE.Mesh(earGeo, earMat);
        rEar.rotation.z = 0.25;
        rEar.position.set(0.18, 0.7, 0.25);
        group.add(lEar, rEar);

        // 耳朵内部（粉色）
        const earInnerGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.65, 12);
        const earInnerMat = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 });
        const lEarInner = new THREE.Mesh(earInnerGeo, earInnerMat);
        lEarInner.rotation.z = -0.25;
        lEarInner.position.set(-0.18, 0.7, 0.25);
        const rEarInner = new THREE.Mesh(earInnerGeo, earInnerMat);
        rEarInner.rotation.z = 0.25;
        rEarInner.position.set(0.18, 0.7, 0.25);
        group.add(lEarInner, rEarInner);

        // 红色眼睛（更明显）
        const eyeGeo = new THREE.SphereGeometry(0.08, 14, 14);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
        const lEye = new THREE.Mesh(eyeGeo, eyeMat);
        lEye.position.set(-0.12, 0.3, 0.62);
        const rEye = new THREE.Mesh(eyeGeo, eyeMat);
        rEye.position.set(0.12, 0.3, 0.62);
        group.add(lEye, rEye);

        // 鼻子（更精致）
        const nose = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xFF69B4 })
        );
        nose.position.set(0, 0.2, 0.68);
        group.add(nose);

        // 嘴巴（小三角形）
        const mouth = new THREE.Mesh(
            new THREE.ConeGeometry(0.03, 0.05, 6),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        mouth.rotation.x = Math.PI;
        mouth.position.set(0, 0.15, 0.7);
        group.add(mouth);

        // 短尾巴（毛球状）
        const tail = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 14, 14),
            new THREE.MeshLambertMaterial({ color: 0xF5F5DC })
        );
        tail.position.set(0, 0.15, -0.65);
        group.add(tail);

        // 前腿（站立）
        const frontLegGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 10);
        const frontLegMat = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
        const lFrontLeg = new THREE.Mesh(frontLegGeo, frontLegMat);
        lFrontLeg.position.set(-0.2, -0.1, 0.4);
        const rFrontLeg = new THREE.Mesh(frontLegGeo, frontLegMat);
        rFrontLeg.position.set(0.2, -0.1, 0.4);
        group.add(lFrontLeg, rFrontLeg);

        // 后腿（更强壮）
        const backLegGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.35, 12);
        const backLegMat = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
        const lBackLeg = new THREE.Mesh(backLegGeo, backLegMat);
        lBackLeg.position.set(-0.25, -0.12, -0.3);
        const rBackLeg = new THREE.Mesh(backLegGeo, backLegMat);
        rBackLeg.position.set(0.25, -0.12, -0.3);
        group.add(lBackLeg, rBackLeg);

        group.castShadow = true;
        group.receiveShadow = true;
        return group;
    }

    static createCat() {
        const group = new THREE.Group();
        
        // 身体（更流线型）
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.48, 20, 20),
            new THREE.MeshLambertMaterial({ color: 0xFFA500 })
        );
        body.scale.set(1.15, 0.9, 1.4);
        group.add(body);

        // 头部（更圆）
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 18, 18),
            new THREE.MeshLambertMaterial({ color: 0xFFA500 })
        );
        head.position.set(0, 0.3, 0.6);
        group.add(head);

        // 尖耳朵（三角形，更明显）
        const earGeo = new THREE.ConeGeometry(0.18, 0.3, 8);
        const earMat = new THREE.MeshLambertMaterial({ color: 0xFF8C00 });
        const lEar = new THREE.Mesh(earGeo, earMat);
        lEar.rotation.z = -0.5;
        lEar.position.set(-0.22, 0.55, 0.4);
        const rEar = new THREE.Mesh(earGeo, earMat);
        rEar.rotation.z = 0.5;
        rEar.position.set(0.22, 0.55, 0.4);
        group.add(lEar, rEar);

        // 耳朵内部（粉色）
        const earInnerGeo = new THREE.ConeGeometry(0.1, 0.25, 6);
        const earInnerMat = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 });
        const lEarInner = new THREE.Mesh(earInnerGeo, earInnerMat);
        lEarInner.rotation.z = -0.5;
        lEarInner.position.set(-0.22, 0.55, 0.4);
        const rEarInner = new THREE.Mesh(earInnerGeo, earInnerMat);
        rEarInner.rotation.z = 0.5;
        rEarInner.position.set(0.22, 0.55, 0.4);
        group.add(lEarInner, rEarInner);

        // 绿色眼睛（更亮）
        const eyeGeo = new THREE.SphereGeometry(0.09, 14, 14);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
        const lEye = new THREE.Mesh(eyeGeo, eyeMat);
        lEye.position.set(-0.15, 0.35, 0.65);
        const rEye = new THREE.Mesh(eyeGeo, eyeMat);
        rEye.position.set(0.15, 0.35, 0.65);
        group.add(lEye, rEye);

        // 瞳孔
        const pupilGeo = new THREE.SphereGeometry(0.04, 10, 10);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const lPupil = new THREE.Mesh(pupilGeo, pupilMat);
        lPupil.position.set(-0.15, 0.35, 0.67);
        const rPupil = new THREE.Mesh(pupilGeo, pupilMat);
        rPupil.position.set(0.15, 0.35, 0.67);
        group.add(lPupil, rPupil);

        // 鼻子（倒三角形）
        const nose = new THREE.Mesh(
            new THREE.ConeGeometry(0.05, 0.08, 3),
            new THREE.MeshBasicMaterial({ color: 0xFF69B4 })
        );
        nose.rotation.x = Math.PI;
        nose.position.set(0, 0.25, 0.7);
        group.add(nose);

        // 胡须（六根）
        const whiskerGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.2, 6);
        const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        for (let i = 0; i < 3; i++) {
            const lWhisker = new THREE.Mesh(whiskerGeo, whiskerMat);
            lWhisker.rotation.z = -0.3 + i * 0.3;
            lWhisker.position.set(-0.2, 0.2 + i * 0.1, 0.65);
            group.add(lWhisker);
            const rWhisker = new THREE.Mesh(whiskerGeo, whiskerMat);
            rWhisker.rotation.z = 0.3 - i * 0.3;
            rWhisker.position.set(0.2, 0.2 + i * 0.1, 0.65);
            group.add(rWhisker);
        }

        // 长尾巴（弯曲，更生动）
        const tail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.1, 0.55, 14),
            new THREE.MeshLambertMaterial({ color: 0xFF8C00 })
        );
        tail.rotation.x = Math.PI / 3;
        tail.rotation.z = 0.2;
        tail.position.set(0, 0.2, -0.75);
        group.add(tail);

        // 尾巴尖（白色）
        const tailTip = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 10, 10),
            new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
        );
        tailTip.position.set(0.1, 0.1, -0.95);
        group.add(tailTip);

        // 四条腿
        const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.35, 12);
        const legMat = new THREE.MeshLambertMaterial({ color: 0xFF8C00 });
        const legPositions = [
            { x: -0.25, z: 0.35 },
            { x: 0.25, z: 0.35 },
            { x: -0.25, z: -0.25 },
            { x: 0.25, z: -0.25 }
        ];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(pos.x, -0.15, pos.z);
            group.add(leg);
        });

        group.castShadow = true;
        group.receiveShadow = true;
        return group;
    }

    static createDog() {
        const group = new THREE.Group();
        
        // 身体（更健壮）
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(0.52, 20, 20),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        body.scale.set(1.2, 0.95, 1.5);
        group.add(body);

        // 头部（更大）
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.38, 18, 18),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        head.position.set(0, 0.35, 0.65);
        head.scale.set(1.15, 1.05, 1.15);
        group.add(head);

        // 下垂的耳朵（更自然）
        const earGeo = new THREE.BoxGeometry(0.22, 0.45, 0.06);
        const earMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const lEar = new THREE.Mesh(earGeo, earMat);
        lEar.rotation.z = 0.4;
        lEar.rotation.x = 0.1;
        lEar.position.set(-0.28, 0.15, 0.5);
        const rEar = new THREE.Mesh(earGeo, earMat);
        rEar.rotation.z = -0.4;
        rEar.rotation.x = 0.1;
        rEar.position.set(0.28, 0.15, 0.5);
        group.add(lEar, rEar);

        // 棕色眼睛（更友好）
        const eyeGeo = new THREE.SphereGeometry(0.1, 14, 14);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x654321 });
        const lEye = new THREE.Mesh(eyeGeo, eyeMat);
        lEye.position.set(-0.18, 0.4, 0.68);
        const rEye = new THREE.Mesh(eyeGeo, eyeMat);
        rEye.position.set(0.18, 0.4, 0.68);
        group.add(lEye, rEye);

        // 黑色鼻子（更大）
        const nose = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 14, 14),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        nose.position.set(0, 0.3, 0.75);
        group.add(nose);

        // 嘴巴（张开，更友好）
        const mouth = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.08, 0.05),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        mouth.position.set(0, 0.2, 0.72);
        group.add(mouth);

        // 舌头（红色）
        const tongue = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 10, 10),
            new THREE.MeshBasicMaterial({ color: 0xFF1493 })
        );
        tongue.position.set(0, 0.18, 0.75);
        tongue.scale.set(1, 0.6, 0.8);
        group.add(tongue);

        // 摇摆的尾巴（更粗）
        const tail = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.12, 0.45, 14),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        tail.rotation.x = Math.PI / 4;
        tail.rotation.z = 0.1;
        tail.position.set(0, 0.25, -0.8);
        group.add(tail);

        // 四条强壮的腿
        const legGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.4, 14);
        const legMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const legPositions = [
            { x: -0.3, z: 0.4 },
            { x: 0.3, z: 0.4 },
            { x: -0.3, z: -0.35 },
            { x: 0.3, z: -0.35 }
        ];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(pos.x, -0.15, pos.z);
            group.add(leg);
        });

        group.castShadow = true;
        group.receiveShadow = true;
        return group;
    }

    static create(type) {
        switch(type) {
            case 'pig': return this.createPig();
            case 'rabbit': return this.createRabbit();
            case 'cat': return this.createCat();
            case 'dog': return this.createDog();
            default: return this.createPig();
        }
    }
}