// PHYSICS GALAXY - 3D Physics Simulation Engine

class PhysicsGalaxy {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.setupCanvas();
        this.initializePhysics();
        this.initializeUI();
        this.initializeAudio();
        this.bindEvents();
        
        this.gameLoop();
    }
    
    setupCanvas() {
        const resizeCanvas = () => {
            const container = this.canvas.parentElement;
            const rect = container.getBoundingClientRect();
            
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            
            this.canvasWidth = this.canvas.width;
            this.canvasHeight = this.canvas.height;
            this.centerX = this.canvasWidth / 2;
            this.centerY = this.canvasHeight / 2;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    initializePhysics() {
        // 物理エンジン設定
        this.physics = {
            gravity: 9.8,
            friction: 0.3,
            restitution: 0.8,
            airResistance: 0.01,
            timeStep: 1/60,
            simulationSpeed: 1.0
        };
        
        // 3D空間設定
        this.camera = {
            x: 0,
            y: 0,
            z: -10,
            rotX: 0,
            rotY: 0,
            fov: 60,
            near: 0.1,
            far: 1000
        };
        
        // ワールド設定
        this.world = {
            boundaries: {
                width: 20,
                height: 15,
                depth: 20
            },
            floor: true,
            walls: true
        };
        
        // オブジェクト管理
        this.objects = [];
        this.springs = [];
        this.constraints = [];
        this.forces = [];
        this.trails = [];
        
        // インタラクション
        this.selectedObject = null;
        this.dragging = false;
        this.mouseStart = { x: 0, y: 0 };
        this.mousePos = { x: 0, y: 0 };
        
        // 統計
        this.stats = {
            objectCount: 0,
            totalEnergy: 0,
            fps: 60
        };
        
        // シミュレーション状態
        this.running = false;
        this.showTrails = true;
        this.showVelocity = false;
        this.showForces = false;
        
        // オブジェクト作成設定
        this.createSettings = {
            type: 'sphere',
            size: 1.0,
            mass: 1.0,
            material: 'metal'
        };
        
        // マテリアル設定
        this.materials = {
            metal: { density: 7.8, friction: 0.6, restitution: 0.3, color: '#C0C0C0' },
            rubber: { density: 1.2, friction: 0.8, restitution: 0.9, color: '#FF6B6B' },
            glass: { density: 2.5, friction: 0.4, restitution: 0.1, color: '#4ECDC4' },
            wood: { density: 0.6, friction: 0.7, restitution: 0.4, color: '#DEB887' },
            ice: { density: 0.9, friction: 0.1, restitution: 0.2, color: '#87CEEB' }
        };
        
        // FPS計測
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fpsUpdateTime = 0;
        
        // ID生成
        this.nextObjectId = 1;
    }
    
    initializeUI() {
        // UI要素の参照を取得
        this.ui = {
            // 物理設定
            gravitySlider: document.getElementById('gravitySlider'),
            gravityValue: document.getElementById('gravityValue'),
            frictionSlider: document.getElementById('frictionSlider'),
            frictionValue: document.getElementById('frictionValue'),
            restitutionSlider: document.getElementById('restitutionSlider'),
            restitutionValue: document.getElementById('restitutionValue'),
            airResistanceSlider: document.getElementById('airResistanceSlider'),
            airResistanceValue: document.getElementById('airResistanceValue'),
            
            // オブジェクト設定
            sizeSlider: document.getElementById('sizeSlider'),
            sizeValue: document.getElementById('sizeValue'),
            massSlider: document.getElementById('massSlider'),
            massValue: document.getElementById('massValue'),
            materialSelect: document.getElementById('materialSelect'),
            
            // シミュレーション制御
            speedSlider: document.getElementById('speedSlider'),
            speedValue: document.getElementById('speedValue'),
            showTrailsToggle: document.getElementById('showTrailsToggle'),
            showVelocityToggle: document.getElementById('showVelocityToggle'),
            showForcesToggle: document.getElementById('showForcesToggle'),
            
            // 統計表示
            fpsDisplay: document.getElementById('fpsDisplay'),
            objectCount: document.getElementById('objectCount'),
            gravityDisplay: document.getElementById('gravityDisplay'),
            totalEnergy: document.getElementById('totalEnergy'),
            
            // 詳細パネル
            infoPanel: document.getElementById('infoPanel'),
            positionVector: document.getElementById('positionVector'),
            velocityVector: document.getElementById('velocityVector'),
            accelerationVector: document.getElementById('accelerationVector'),
            kineticEnergy: document.getElementById('kineticEnergy'),
            potentialEnergy: document.getElementById('potentialEnergy')
        };
        
        this.updateUI();
    }
    
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.1;
        } catch (e) {
            console.warn('Audio context not available');
        }
    }
    
    bindEvents() {
        // キャンバスイベント
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // 物理設定のイベント
        this.ui.gravitySlider.addEventListener('input', (e) => {
            this.physics.gravity = parseFloat(e.target.value);
            this.ui.gravityValue.textContent = this.physics.gravity.toFixed(1);
            this.ui.gravityDisplay.textContent = this.physics.gravity.toFixed(1);
        });
        
        this.ui.frictionSlider.addEventListener('input', (e) => {
            this.physics.friction = parseFloat(e.target.value);
            this.ui.frictionValue.textContent = this.physics.friction.toFixed(2);
        });
        
        this.ui.restitutionSlider.addEventListener('input', (e) => {
            this.physics.restitution = parseFloat(e.target.value);
            this.ui.restitutionValue.textContent = this.physics.restitution.toFixed(2);
        });
        
        this.ui.airResistanceSlider.addEventListener('input', (e) => {
            this.physics.airResistance = parseFloat(e.target.value);
            this.ui.airResistanceValue.textContent = this.physics.airResistance.toFixed(3);
        });
        
        // オブジェクト設定
        this.ui.sizeSlider.addEventListener('input', (e) => {
            this.createSettings.size = parseFloat(e.target.value);
            this.ui.sizeValue.textContent = this.createSettings.size.toFixed(1);
        });
        
        this.ui.massSlider.addEventListener('input', (e) => {
            this.createSettings.mass = parseFloat(e.target.value);
            this.ui.massValue.textContent = this.createSettings.mass.toFixed(1);
        });
        
        this.ui.materialSelect.addEventListener('change', (e) => {
            this.createSettings.material = e.target.value;
        });
        
        // オブジェクトタイプ選択
        document.querySelectorAll('.object-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.object-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.createSettings.type = btn.dataset.type;
            });
        });
        
        // シミュレーション制御
        document.getElementById('playBtn').addEventListener('click', () => this.startSimulation());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseSimulation());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetSimulation());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        
        this.ui.speedSlider.addEventListener('input', (e) => {
            this.physics.simulationSpeed = parseFloat(e.target.value);
            this.ui.speedValue.textContent = `${this.physics.simulationSpeed.toFixed(1)}x`;
        });
        
        // 表示オプション
        this.ui.showTrailsToggle.addEventListener('change', (e) => {
            this.showTrails = e.target.checked;
        });
        
        this.ui.showVelocityToggle.addEventListener('change', (e) => {
            this.showVelocity = e.target.checked;
        });
        
        this.ui.showForcesToggle.addEventListener('change', (e) => {
            this.showForces = e.target.checked;
        });
        
        // シナリオボタン
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.loadScenario(btn.dataset.scenario);
            });
        });
        
        // ヘルプ
        document.getElementById('helpBtn').addEventListener('click', () => {
            document.getElementById('helpOverlay').classList.add('active');
        });
        
        document.getElementById('closeHelpBtn').addEventListener('click', () => {
            document.getElementById('helpOverlay').classList.remove('active');
        });
        
        // 詳細パネル
        document.getElementById('closePanelBtn').addEventListener('click', () => {
            this.ui.infoPanel.classList.remove('active');
            this.selectedObject = null;
        });
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
    }
    
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
        this.mouseStart = { ...this.mousePos };
        
        if (e.button === 0) { // 左クリック
            if (e.shiftKey) {
                // オブジェクト選択
                this.selectObject(this.mousePos);
            } else {
                // オブジェクト作成
                this.createObject(this.mousePos);
            }
        } else if (e.button === 2) { // 右クリック
            // ドラッグ開始
            const obj = this.getObjectAt(this.mousePos);
            if (obj) {
                this.selectedObject = obj;
                this.dragging = true;
            }
        }
    }
    
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
        
        if (this.dragging && this.selectedObject) {
            // 力を可視化
            this.updateForcePreview();
        }
    }
    
    onMouseUp(e) {
        if (this.dragging && this.selectedObject) {
            // 力を適用
            this.applyForce();
            this.dragging = false;
        }
    }
    
    onWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
        this.camera.z *= zoomFactor;
        this.camera.z = Math.max(-50, Math.min(-2, this.camera.z));
    }
    
    onKeyDown(e) {
        switch (e.key) {
            case ' ':
                e.preventDefault();
                this.running ? this.pauseSimulation() : this.startSimulation();
                break;
            case 'r':
            case 'R':
                this.resetSimulation();
                break;
            case 'c':
            case 'C':
                this.clearAll();
                break;
            case 'Escape':
                this.selectedObject = null;
                this.ui.infoPanel.classList.remove('active');
                break;
        }
    }
    
    createObject(mousePos) {
        // マウス位置を3D座標に変換
        const worldPos = this.screenToWorld(mousePos);
        
        const material = this.materials[this.createSettings.material];
        const size = this.createSettings.size;
        const mass = this.createSettings.mass * material.density;
        
        const object = {
            id: this.nextObjectId++,
            type: this.createSettings.type,
            position: { x: worldPos.x, y: worldPos.y, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            acceleration: { x: 0, y: 0, z: 0 },
            size: size,
            mass: mass,
            material: this.createSettings.material,
            color: material.color,
            friction: material.friction,
            restitution: material.restitution,
            trail: [],
            forces: []
        };
        
        // 形状固有の設定
        switch (this.createSettings.type) {
            case 'sphere':
                object.radius = size;
                object.moment = (2/5) * mass * size * size; // 球の慣性モーメント
                break;
            case 'cube':
                object.width = object.height = object.depth = size;
                object.moment = (1/6) * mass * size * size; // 立方体の慣性モーメント
                break;
            case 'cylinder':
                object.radius = size;
                object.height = size * 2;
                object.moment = (1/2) * mass * size * size; // 円柱の慣性モーメント
                break;
        }
        
        this.objects.push(object);
        this.stats.objectCount = this.objects.length;
        
        // 作成効果音
        this.playSound('create', 440);
        
        this.updateUI();
    }
    
    selectObject(mousePos) {
        const object = this.getObjectAt(mousePos);
        if (object) {
            this.selectedObject = object;
            this.ui.infoPanel.classList.add('active');
            this.updateObjectInfo();
        }
    }
    
    getObjectAt(mousePos) {
        const worldPos = this.screenToWorld(mousePos);
        
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            const distance = Math.sqrt(
                Math.pow(worldPos.x - obj.position.x, 2) +
                Math.pow(worldPos.y - obj.position.y, 2)
            );
            
            if (distance < obj.size) {
                return obj;
            }
        }
        
        return null;
    }
    
    screenToWorld(screenPos) {
        // 簡易的な2D変換（3D投影の逆変換を簡略化）
        const x = (screenPos.x - this.centerX) / 30 - this.camera.x;
        const y = -(screenPos.y - this.centerY) / 30 - this.camera.y;
        
        return { x, y, z: 0 };
    }
    
    worldToScreen(worldPos) {
        // 3D座標を2D画面座標に変換
        const distance = Math.abs(this.camera.z);
        const scale = 1000 / (distance + worldPos.z);
        
        const x = (worldPos.x + this.camera.x) * 30 * scale + this.centerX;
        const y = -(worldPos.y + this.camera.y) * 30 * scale + this.centerY;
        
        return { x, y, scale };
    }
    
    updateForcePreview() {
        // 力のプレビューを更新（ここでは単純化）
        const dx = this.mousePos.x - this.mouseStart.x;
        const dy = this.mousePos.y - this.mouseStart.y;
        const force = Math.sqrt(dx * dx + dy * dy) * 0.1;
        
        // 力ベクトルの可視化はrenderで行う
    }
    
    applyForce() {
        if (!this.selectedObject) return;
        
        const dx = this.mousePos.x - this.mouseStart.x;
        const dy = this.mousePos.y - this.mouseStart.y;
        
        const forceX = dx * 0.01;
        const forceY = -dy * 0.01; // Y軸反転
        
        this.selectedObject.velocity.x += forceX / this.selectedObject.mass;
        this.selectedObject.velocity.y += forceY / this.selectedObject.mass;
        
        // 力適用効果音
        this.playSound('force', 220);
    }
    
    startSimulation() {
        this.running = true;
        document.getElementById('playBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
    }
    
    pauseSimulation() {
        this.running = false;
        document.getElementById('playBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }
    
    resetSimulation() {
        this.running = false;
        
        // オブジェクトの物理状態をリセット
        this.objects.forEach(obj => {
            obj.velocity = { x: 0, y: 0, z: 0 };
            obj.acceleration = { x: 0, y: 0, z: 0 };
            obj.trail = [];
            obj.forces = [];
        });
        
        this.trails = [];
        this.forces = [];
        
        document.getElementById('playBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }
    
    clearAll() {
        this.objects = [];
        this.springs = [];
        this.constraints = [];
        this.forces = [];
        this.trails = [];
        this.selectedObject = null;
        this.stats.objectCount = 0;
        
        this.ui.infoPanel.classList.remove('active');
        this.updateUI();
        
        this.pauseSimulation();
    }
    
    loadScenario(scenarioName) {
        this.clearAll();
        
        switch (scenarioName) {
            case 'gravity':
                this.loadGravityDemo();
                break;
            case 'pendulum':
                this.loadPendulumDemo();
                break;
            case 'collision':
                this.loadCollisionDemo();
                break;
            case 'orbital':
                this.loadOrbitalDemo();
                break;
            case 'spring':
                this.loadSpringDemo();
                break;
            case 'fluid':
                this.loadFluidDemo();
                break;
        }
    }
    
    loadGravityDemo() {
        // 重力実験：異なる質量の球を落下
        const masses = [0.5, 1.0, 2.0];
        masses.forEach((mass, i) => {
            const obj = {
                id: this.nextObjectId++,
                type: 'sphere',
                position: { x: -3 + i * 3, y: 8, z: 0 },
                velocity: { x: 0, y: 0, z: 0 },
                acceleration: { x: 0, y: 0, z: 0 },
                size: Math.sqrt(mass),
                mass: mass,
                material: 'metal',
                color: '#C0C0C0',
                friction: 0.6,
                restitution: 0.3,
                trail: [],
                forces: []
            };
            obj.radius = obj.size;
            obj.moment = (2/5) * obj.mass * obj.size * obj.size;
            this.objects.push(obj);
        });
        
        this.stats.objectCount = this.objects.length;
        this.updateUI();
    }
    
    loadPendulumDemo() {
        // 振り子デモ：チェーンで吊るされた球
        const pendulum = {
            id: this.nextObjectId++,
            type: 'sphere',
            position: { x: 0, y: -2, z: 0 },
            velocity: { x: 3, y: 0, z: 0 },
            acceleration: { x: 0, y: 0, z: 0 },
            size: 0.8,
            mass: 1.0,
            material: 'metal',
            color: '#C0C0C0',
            friction: 0.1,
            restitution: 0.9,
            trail: [],
            forces: []
        };
        
        pendulum.radius = pendulum.size;
        pendulum.moment = (2/5) * pendulum.mass * pendulum.size * pendulum.size;
        
        this.objects.push(pendulum);
        this.stats.objectCount = this.objects.length;
        this.updateUI();
    }
    
    loadCollisionDemo() {
        // 衝突実験：2つの球が衝突
        const ball1 = {
            id: this.nextObjectId++,
            type: 'sphere',
            position: { x: -5, y: 0, z: 0 },
            velocity: { x: 5, y: 0, z: 0 },
            acceleration: { x: 0, y: 0, z: 0 },
            size: 1.0,
            mass: 1.0,
            material: 'rubber',
            color: '#FF6B6B',
            friction: 0.8,
            restitution: 0.9,
            trail: [],
            forces: []
        };
        
        const ball2 = {
            id: this.nextObjectId++,
            type: 'sphere',
            position: { x: 5, y: 0, z: 0 },
            velocity: { x: -3, y: 0, z: 0 },
            acceleration: { x: 0, y: 0, z: 0 },
            size: 1.2,
            mass: 2.0,
            material: 'metal',
            color: '#C0C0C0',
            friction: 0.6,
            restitution: 0.3,
            trail: [],
            forces: []
        };
        
        [ball1, ball2].forEach(ball => {
            ball.radius = ball.size;
            ball.moment = (2/5) * ball.mass * ball.size * ball.size;
        });
        
        this.objects.push(ball1, ball2);
        this.stats.objectCount = this.objects.length;
        this.updateUI();
    }
    
    loadOrbitalDemo() {
        // 軌道運動：中心の重い物体の周りを回る軽い物体
        const sun = {
            id: this.nextObjectId++,
            type: 'sphere',
            position: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            acceleration: { x: 0, y: 0, z: 0 },
            size: 2.0,
            mass: 10.0,
            material: 'metal',
            color: '#FFD700',
            friction: 0.1,
            restitution: 0.1,
            trail: [],
            forces: [],
            fixed: true // 固定オブジェクト
        };
        
        const planet = {
            id: this.nextObjectId++,
            type: 'sphere',
            position: { x: 6, y: 0, z: 0 },
            velocity: { x: 0, y: 4, z: 0 },
            acceleration: { x: 0, y: 0, z: 0 },
            size: 0.6,
            mass: 0.5,
            material: 'ice',
            color: '#87CEEB',
            friction: 0.1,
            restitution: 0.2,
            trail: [],
            forces: []
        };
        
        [sun, planet].forEach(obj => {
            obj.radius = obj.size;
            obj.moment = (2/5) * obj.mass * obj.size * obj.size;
        });
        
        this.objects.push(sun, planet);
        this.stats.objectCount = this.objects.length;
        this.updateUI();
    }
    
    loadSpringDemo() {
        // バネ振動：バネで接続された物体
        const anchor = {
            id: this.nextObjectId++,
            type: 'cube',
            position: { x: 0, y: 5, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            acceleration: { x: 0, y: 0, z: 0 },
            size: 0.5,
            mass: 1000, // 非常に重い（実質固定）
            material: 'metal',
            color: '#696969',
            friction: 1.0,
            restitution: 0.1,
            trail: [],
            forces: [],
            fixed: true
        };
        
        const weight = {
            id: this.nextObjectId++,
            type: 'sphere',
            position: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            acceleration: { x: 0, y: 0, z: 0 },
            size: 1.0,
            mass: 1.0,
            material: 'metal',
            color: '#C0C0C0',
            friction: 0.6,
            restitution: 0.3,
            trail: [],
            forces: []
        };
        
        [anchor, weight].forEach(obj => {
            if (obj.type === 'sphere') {
                obj.radius = obj.size;
                obj.moment = (2/5) * obj.mass * obj.size * obj.size;
            } else {
                obj.width = obj.height = obj.depth = obj.size;
                obj.moment = (1/6) * obj.mass * obj.size * obj.size;
            }
        });
        
        this.objects.push(anchor, weight);
        
        // バネを作成
        this.springs.push({
            obj1: anchor,
            obj2: weight,
            restLength: 3,
            stiffness: 50,
            damping: 0.8
        });
        
        this.stats.objectCount = this.objects.length;
        this.updateUI();
    }
    
    loadFluidDemo() {
        // 流体力学：水中に落ちる物体
        this.physics.airResistance = 0.1; // 水の抵抗
        this.ui.airResistanceSlider.value = 0.1;
        this.ui.airResistanceValue.textContent = '0.100';
        
        const objects = [
            { material: 'metal', x: -2, size: 0.8 },
            { material: 'wood', x: 0, size: 1.2 },
            { material: 'ice', x: 2, size: 1.0 }
        ];
        
        objects.forEach(({ material, x, size }) => {
            const mat = this.materials[material];
            const obj = {
                id: this.nextObjectId++,
                type: 'sphere',
                position: { x, y: 8, z: 0 },
                velocity: { x: 0, y: 0, z: 0 },
                acceleration: { x: 0, y: 0, z: 0 },
                size: size,
                mass: size * mat.density,
                material: material,
                color: mat.color,
                friction: mat.friction,
                restitution: mat.restitution,
                trail: [],
                forces: []
            };
            
            obj.radius = obj.size;
            obj.moment = (2/5) * obj.mass * obj.size * obj.size;
            
            this.objects.push(obj);
        });
        
        this.stats.objectCount = this.objects.length;
        this.updateUI();
    }
    
    updatePhysics(deltaTime) {
        if (!this.running) return;
        
        const dt = deltaTime * this.physics.simulationSpeed;
        
        this.objects.forEach(obj => {
            if (obj.fixed) return;
            
            // 重力適用
            obj.acceleration.y = -this.physics.gravity;
            
            // 空気抵抗
            const velocity = Math.sqrt(obj.velocity.x ** 2 + obj.velocity.y ** 2);
            if (velocity > 0) {
                const drag = this.physics.airResistance * velocity * velocity;
                const dragX = -drag * (obj.velocity.x / velocity);
                const dragY = -drag * (obj.velocity.y / velocity);
                
                obj.acceleration.x += dragX / obj.mass;
                obj.acceleration.y += dragY / obj.mass;
            }
            
            // バネ力の計算
            this.springs.forEach(spring => {
                if (spring.obj1 === obj || spring.obj2 === obj) {
                    this.updateSpringForce(spring, dt);
                }
            });
            
            // 軌道力（万有引力のシミュレーション）
            if (this.objects.length > 1) {
                this.objects.forEach(other => {
                    if (other !== obj && other.mass > 5) { // 重い物体のみ引力源
                        const dx = other.position.x - obj.position.x;
                        const dy = other.position.y - obj.position.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance > 0.1) { // 距離が近すぎない場合
                            const force = (other.mass * obj.mass) / (distance * distance) * 0.1;
                            const fx = force * (dx / distance);
                            const fy = force * (dy / distance);
                            
                            obj.acceleration.x += fx / obj.mass;
                            obj.acceleration.y += fy / obj.mass;
                        }
                    }
                });
            }
            
            // 速度と位置の更新（ベルレ積分）
            obj.velocity.x += obj.acceleration.x * dt;
            obj.velocity.y += obj.acceleration.y * dt;
            obj.velocity.z += obj.acceleration.z * dt;
            
            obj.position.x += obj.velocity.x * dt;
            obj.position.y += obj.velocity.y * dt;
            obj.position.z += obj.velocity.z * dt;
            
            // 境界での反射
            this.handleBoundaryCollision(obj);
            
            // 軌跡の更新
            if (this.showTrails) {
                obj.trail.push({ ...obj.position });
                if (obj.trail.length > 50) {
                    obj.trail.shift();
                }
            }
        });
        
        // オブジェクト間衝突
        this.handleCollisions();
        
        // 統計更新
        this.updateStats();
    }
    
    updateSpringForce(spring, dt) {
        const dx = spring.obj2.position.x - spring.obj1.position.x;
        const dy = spring.obj2.position.y - spring.obj1.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const displacement = distance - spring.restLength;
            const force = spring.stiffness * displacement;
            
            const fx = force * (dx / distance);
            const fy = force * (dy / distance);
            
            // オブジェクト1への力
            if (!spring.obj1.fixed) {
                spring.obj1.acceleration.x += fx / spring.obj1.mass;
                spring.obj1.acceleration.y += fy / spring.obj1.mass;
            }
            
            // オブジェクト2への力（反対方向）
            if (!spring.obj2.fixed) {
                spring.obj2.acceleration.x -= fx / spring.obj2.mass;
                spring.obj2.acceleration.y -= fy / spring.obj2.mass;
            }
            
            // ダンピング
            const relativeVelocityX = spring.obj2.velocity.x - spring.obj1.velocity.x;
            const relativeVelocityY = spring.obj2.velocity.y - spring.obj1.velocity.y;
            
            const dampingForceX = spring.damping * relativeVelocityX;
            const dampingForceY = spring.damping * relativeVelocityY;
            
            if (!spring.obj1.fixed) {
                spring.obj1.acceleration.x += dampingForceX / spring.obj1.mass;
                spring.obj1.acceleration.y += dampingForceY / spring.obj1.mass;
            }
            
            if (!spring.obj2.fixed) {
                spring.obj2.acceleration.x -= dampingForceX / spring.obj2.mass;
                spring.obj2.acceleration.y -= dampingForceY / spring.obj2.mass;
            }
        }
    }
    
    handleBoundaryCollision(obj) {
        const bounds = this.world.boundaries;
        const halfWidth = bounds.width / 2;
        const halfHeight = bounds.height / 2;
        
        // 床との衝突
        if (obj.position.y - obj.size < -halfHeight) {
            obj.position.y = -halfHeight + obj.size;
            obj.velocity.y = -obj.velocity.y * this.physics.restitution;
            obj.velocity.x *= (1 - this.physics.friction);
            
            this.playSound('bounce', 330);
        }
        
        // 壁との衝突
        if (obj.position.x - obj.size < -halfWidth) {
            obj.position.x = -halfWidth + obj.size;
            obj.velocity.x = -obj.velocity.x * this.physics.restitution;
        } else if (obj.position.x + obj.size > halfWidth) {
            obj.position.x = halfWidth - obj.size;
            obj.velocity.x = -obj.velocity.x * this.physics.restitution;
        }
        
        // 天井との衝突
        if (obj.position.y + obj.size > halfHeight) {
            obj.position.y = halfHeight - obj.size;
            obj.velocity.y = -obj.velocity.y * this.physics.restitution;
        }
    }
    
    handleCollisions() {
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = i + 1; j < this.objects.length; j++) {
                const obj1 = this.objects[i];
                const obj2 = this.objects[j];
                
                if (this.checkCollision(obj1, obj2)) {
                    this.resolveCollision(obj1, obj2);
                }
            }
        }
    }
    
    checkCollision(obj1, obj2) {
        const dx = obj2.position.x - obj1.position.x;
        const dy = obj2.position.y - obj1.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (obj1.size + obj2.size);
    }
    
    resolveCollision(obj1, obj2) {
        const dx = obj2.position.x - obj1.position.x;
        const dy = obj2.position.y - obj1.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return; // 同じ位置の場合は無視
        
        // 正規化された衝突ベクトル
        const nx = dx / distance;
        const ny = dy / distance;
        
        // オブジェクトを分離
        const overlap = (obj1.size + obj2.size) - distance;
        const separationX = overlap * nx * 0.5;
        const separationY = overlap * ny * 0.5;
        
        if (!obj1.fixed) {
            obj1.position.x -= separationX;
            obj1.position.y -= separationY;
        }
        
        if (!obj2.fixed) {
            obj2.position.x += separationX;
            obj2.position.y += separationY;
        }
        
        // 相対速度
        const relativeVelocityX = obj2.velocity.x - obj1.velocity.x;
        const relativeVelocityY = obj2.velocity.y - obj1.velocity.y;
        
        // 法線方向の相対速度
        const relativeVelocityInNormal = relativeVelocityX * nx + relativeVelocityY * ny;
        
        // オブジェクトが分離中の場合は何もしない
        if (relativeVelocityInNormal > 0) return;
        
        // 反発係数
        const restitution = Math.min(obj1.restitution, obj2.restitution);
        
        // 衝突インパルス
        const impulse = -(1 + restitution) * relativeVelocityInNormal;
        const totalMass = obj1.fixed ? obj2.mass : (obj2.fixed ? obj1.mass : obj1.mass + obj2.mass);
        const impulseScalar = impulse / totalMass;
        
        // 速度更新
        if (!obj1.fixed) {
            obj1.velocity.x -= impulseScalar * obj2.mass * nx;
            obj1.velocity.y -= impulseScalar * obj2.mass * ny;
        }
        
        if (!obj2.fixed) {
            obj2.velocity.x += impulseScalar * obj1.mass * nx;
            obj2.velocity.y += impulseScalar * obj1.mass * ny;
        }
        
        // 衝突音
        const impactForce = Math.abs(impulse);
        if (impactForce > 0.1) {
            this.playSound('collision', 200 + impactForce * 100);
        }
    }
    
    updateStats() {
        let totalKineticEnergy = 0;
        let totalPotentialEnergy = 0;
        
        this.objects.forEach(obj => {
            if (!obj.fixed) {
                // 運動エネルギー
                const velocity = Math.sqrt(obj.velocity.x ** 2 + obj.velocity.y ** 2 + obj.velocity.z ** 2);
                totalKineticEnergy += 0.5 * obj.mass * velocity * velocity;
                
                // 位置エネルギー
                totalPotentialEnergy += obj.mass * this.physics.gravity * (obj.position.y + this.world.boundaries.height / 2);
            }
        });
        
        this.stats.totalEnergy = totalKineticEnergy + totalPotentialEnergy;
    }
    
    updateUI() {
        // 統計表示
        this.ui.objectCount.textContent = this.stats.objectCount;
        this.ui.totalEnergy.textContent = this.stats.totalEnergy.toFixed(1);
        
        // 選択されたオブジェクトの詳細情報
        if (this.selectedObject) {
            this.updateObjectInfo();
        }
    }
    
    updateObjectInfo() {
        if (!this.selectedObject) return;
        
        const obj = this.selectedObject;
        
        // 位置
        this.ui.positionVector.textContent = 
            `${obj.position.x.toFixed(2)}, ${obj.position.y.toFixed(2)}, ${obj.position.z.toFixed(2)}`;
        
        // 速度
        this.ui.velocityVector.textContent = 
            `${obj.velocity.x.toFixed(2)}, ${obj.velocity.y.toFixed(2)}, ${obj.velocity.z.toFixed(2)}`;
        
        // 加速度
        this.ui.accelerationVector.textContent = 
            `${obj.acceleration.x.toFixed(2)}, ${obj.acceleration.y.toFixed(2)}, ${obj.acceleration.z.toFixed(2)}`;
        
        // エネルギー
        const velocity = Math.sqrt(obj.velocity.x ** 2 + obj.velocity.y ** 2 + obj.velocity.z ** 2);
        const kineticEnergy = 0.5 * obj.mass * velocity * velocity;
        const potentialEnergy = obj.mass * this.physics.gravity * (obj.position.y + this.world.boundaries.height / 2);
        
        this.ui.kineticEnergy.textContent = `${kineticEnergy.toFixed(2)} J`;
        this.ui.potentialEnergy.textContent = `${potentialEnergy.toFixed(2)} J`;
    }
    
    render() {
        // キャンバスクリア
        this.ctx.fillStyle = 'rgba(10, 10, 26, 0.1)';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // グリッド描画
        this.drawGrid();
        
        // バネ描画
        this.drawSprings();
        
        // オブジェクト描画
        this.drawObjects();
        
        // 軌跡描画
        if (this.showTrails) {
            this.drawTrails();
        }
        
        // 速度ベクトル描画
        if (this.showVelocity) {
            this.drawVelocityVectors();
        }
        
        // 力ベクトル描画
        if (this.showForces && this.dragging && this.selectedObject) {
            this.drawForceVector();
        }
        
        // 境界描画
        this.drawBoundaries();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(50, 130, 184, 0.2)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 1;
        const bounds = this.world.boundaries;
        
        // 垂直線
        for (let x = -bounds.width/2; x <= bounds.width/2; x += gridSize) {
            const screenPos = this.worldToScreen({ x, y: 0, z: 0 });
            this.ctx.beginPath();
            this.ctx.moveTo(screenPos.x, 0);
            this.ctx.lineTo(screenPos.x, this.canvasHeight);
            this.ctx.stroke();
        }
        
        // 水平線
        for (let y = -bounds.height/2; y <= bounds.height/2; y += gridSize) {
            const screenPos = this.worldToScreen({ x: 0, y, z: 0 });
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenPos.y);
            this.ctx.lineTo(this.canvasWidth, screenPos.y);
            this.ctx.stroke();
        }
    }
    
    drawBoundaries() {
        this.ctx.strokeStyle = 'rgba(50, 130, 184, 0.8)';
        this.ctx.lineWidth = 3;
        
        const bounds = this.world.boundaries;
        const corners = [
            { x: -bounds.width/2, y: -bounds.height/2 },
            { x: bounds.width/2, y: -bounds.height/2 },
            { x: bounds.width/2, y: bounds.height/2 },
            { x: -bounds.width/2, y: bounds.height/2 }
        ];
        
        this.ctx.beginPath();
        corners.forEach((corner, i) => {
            const screenPos = this.worldToScreen({ ...corner, z: 0 });
            if (i === 0) {
                this.ctx.moveTo(screenPos.x, screenPos.y);
            } else {
                this.ctx.lineTo(screenPos.x, screenPos.y);
            }
        });
        this.ctx.closePath();
        this.ctx.stroke();
    }
    
    drawObjects() {
        this.objects.forEach(obj => {
            const screenPos = this.worldToScreen(obj.position);
            
            this.ctx.save();
            
            // 選択されたオブジェクトのハイライト
            if (obj === this.selectedObject) {
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = '#00d4ff';
            }
            
            this.ctx.fillStyle = obj.color;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            
            const size = obj.size * 30 * screenPos.scale;
            
            switch (obj.type) {
                case 'sphere':
                    this.ctx.beginPath();
                    this.ctx.arc(screenPos.x, screenPos.y, size, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();
                    
                    // 3D効果のためのハイライト
                    const gradient = this.ctx.createRadialGradient(
                        screenPos.x - size/3, screenPos.y - size/3, 0,
                        screenPos.x, screenPos.y, size
                    );
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.fill();
                    break;
                    
                case 'cube':
                    this.ctx.fillRect(screenPos.x - size/2, screenPos.y - size/2, size, size);
                    this.ctx.strokeRect(screenPos.x - size/2, screenPos.y - size/2, size, size);
                    break;
                    
                case 'cylinder':
                    // 楕円として描画
                    this.ctx.save();
                    this.ctx.translate(screenPos.x, screenPos.y);
                    this.ctx.scale(1, 0.6);
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, size, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();
                    this.ctx.restore();
                    break;
            }
            
            this.ctx.restore();
            
            // オブジェクトID表示
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(obj.id.toString(), screenPos.x, screenPos.y + 4);
        });
    }
    
    drawTrails() {
        this.objects.forEach(obj => {
            if (obj.trail.length < 2) return;
            
            this.ctx.strokeStyle = obj.color;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.6;
            
            this.ctx.beginPath();
            for (let i = 0; i < obj.trail.length; i++) {
                const screenPos = this.worldToScreen(obj.trail[i]);
                
                if (i === 0) {
                    this.ctx.moveTo(screenPos.x, screenPos.y);
                } else {
                    this.ctx.lineTo(screenPos.x, screenPos.y);
                }
                
                // 徐々に透明に
                this.ctx.globalAlpha = 0.6 * (i / obj.trail.length);
            }
            this.ctx.stroke();
            
            this.ctx.globalAlpha = 1;
        });
    }
    
    drawVelocityVectors() {
        this.objects.forEach(obj => {
            if (obj.fixed) return;
            
            const velocity = Math.sqrt(obj.velocity.x ** 2 + obj.velocity.y ** 2);
            if (velocity < 0.1) return;
            
            const screenPos = this.worldToScreen(obj.position);
            const scale = 20;
            const endX = screenPos.x + obj.velocity.x * scale;
            const endY = screenPos.y - obj.velocity.y * scale; // Y軸反転
            
            this.ctx.strokeStyle = '#4ade80';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([]);
            
            // 矢印本体
            this.ctx.beginPath();
            this.ctx.moveTo(screenPos.x, screenPos.y);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            
            // 矢印の頭
            const angle = Math.atan2(endY - screenPos.y, endX - screenPos.x);
            const headLength = 10;
            
            this.ctx.beginPath();
            this.ctx.moveTo(endX, endY);
            this.ctx.lineTo(
                endX - headLength * Math.cos(angle - Math.PI/6),
                endY - headLength * Math.sin(angle - Math.PI/6)
            );
            this.ctx.moveTo(endX, endY);
            this.ctx.lineTo(
                endX - headLength * Math.cos(angle + Math.PI/6),
                endY - headLength * Math.sin(angle + Math.PI/6)
            );
            this.ctx.stroke();
        });
    }
    
    drawForceVector() {
        if (!this.selectedObject) return;
        
        const screenPos = this.worldToScreen(this.selectedObject.position);
        
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(screenPos.x, screenPos.y);
        this.ctx.lineTo(this.mousePos.x, this.mousePos.y);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }
    
    drawSprings() {
        this.springs.forEach(spring => {
            const pos1 = this.worldToScreen(spring.obj1.position);
            const pos2 = this.worldToScreen(spring.obj2.position);
            
            this.ctx.strokeStyle = '#fbbf24';
            this.ctx.lineWidth = 3;
            
            // バネの描画（波線）
            const segments = 10;
            const dx = pos2.x - pos1.x;
            const dy = pos2.y - pos1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            this.ctx.beginPath();
            this.ctx.moveTo(pos1.x, pos1.y);
            
            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                const x = pos1.x + dx * t;
                const y = pos1.y + dy * t;
                
                // 波形の振幅
                const amplitude = 10 * Math.sin(t * Math.PI * 4);
                const perpX = -dy / length * amplitude;
                const perpY = dx / length * amplitude;
                
                this.ctx.lineTo(x + perpX, y + perpY);
            }
            
            this.ctx.lineTo(pos2.x, pos2.y);
            this.ctx.stroke();
        });
    }
    
    playSound(type, frequency) {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            const duration = type === 'collision' ? 0.2 : 0.1;
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            // 音声エラーは無視
        }
    }
    
    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // FPS計算
        this.frameCount++;
        this.fpsUpdateTime += deltaTime;
        
        if (this.fpsUpdateTime >= 1) {
            this.stats.fps = Math.round(this.frameCount / this.fpsUpdateTime);
            this.ui.fpsDisplay.textContent = this.stats.fps;
            this.frameCount = 0;
            this.fpsUpdateTime = 0;
        }
        
        // 物理更新
        this.updatePhysics(deltaTime);
        
        // 描画
        this.render();
        
        // UI更新
        this.updateUI();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ゲーム初期化
document.addEventListener('DOMContentLoaded', () => {
    const game = new PhysicsGalaxy();
    
    // デバッグ用
    window.physicsGalaxy = game;
});