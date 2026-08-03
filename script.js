/* ==========================================
   泽阳的科创主页 — 项目数据 & 气泡 & 弹窗 & 贪吃蛇
   ========================================== */


// ==================== 落叶飘散效果 ====================
(function() {
    var container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:hidden';
    document.body.insertBefore(container, document.body.firstChild);

    var colors = ['rgba(200,60,20,0.6)','rgba(220,140,30,0.5)','rgba(180,40,10,0.4)','rgba(240,180,40,0.5)','rgba(160,50,30,0.3)'];

    function createParticle() {
        var p = document.createElement('div');
        var size = 4 + Math.random() * 8;
        p.style.cssText = 'position:absolute;width:' + size + 'px;height:' + size + 'px;' +
            'background:' + colors[Math.floor(Math.random()*colors.length)] + ';' +
            'border-radius:2px;left:' + Math.random()*100 + '%;top:-20px;' +
            'animation:fall ' + (6+Math.random()*8) + 's linear infinite;' +
            'animation-delay:' + Math.random()*8 + 's;' +
            'transform:rotate(' + Math.random()*360 + 'deg);opacity:0.7';
        container.appendChild(p);
    }

    var style = document.createElement('style');
    style.textContent = '@keyframes fall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}' +
        '70%{opacity:0.6}100%{transform:translateY(105vh) rotate(720deg);opacity:0}}';
    document.head.appendChild(style);

    for (var i = 0; i < 25; i++) createParticle();
})();

// ==================== 登录验证 ====================
(function() {
    var overlay = document.getElementById('loginOverlay');
    var mainContent = document.getElementById('mainContent');
    if (!overlay || !mainContent) return;

    var userInput = document.getElementById('loginUser');
    var passInput = document.getElementById('loginPass');
    var loginBtn = document.getElementById('loginBtn');
    var errorEl = document.getElementById('loginError');

    // SHA-256 哈希（不存明文）
    var USER_HASH = '542a2b66e47a989ea89b6bd983fe40a0edc6611866d8ceeb8d4692ec159687ab';
    var PASS_HASH = '1b3c94fe9cb3018cab118238773f75ba264230e37f783c4220e56fb156ea9483';

    // 检查是否已登录过
    if (sessionStorage.getItem('loggedIn') === 'true') {
        overlay.classList.add('hidden');
        mainContent.style.display = 'block';
        return;
    }

    async function sha256(text) {
        var buf = new TextEncoder().encode(text);
        var hash = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hash)).map(function(b) {
            return b.toString(16).padStart(2, '0');
        }).join('');
    }

    
    // ==================== 面容登录（WebAuthn） ====================
    var faceBtn = document.getElementById('faceLoginBtn');
    if (faceBtn && window.PublicKeyCredential) {
        faceBtn.style.display = 'block';

        faceBtn.addEventListener('click', async function() {
            faceBtn.textContent = '⏳ 正在验证...';
            faceBtn.disabled = true;
            errorEl.textContent = '';

            try {
                var storedId = localStorage.getItem('faceCredId');
                if (storedId) {
                    await authenticateFace(storedId);
                } else {
                    await registerFace();
                }
                sessionStorage.setItem('loggedIn', 'true');
                overlay.classList.add('hidden');
                mainContent.style.display = 'block';
            } catch (err) {
                if (err.name === 'NotAllowedError') {
                    errorEl.textContent = '⚠ 操作已取消，请重试';
                } else if (err.name === 'NotSupportedError') {
                    errorEl.textContent = '⚠ 此设备不支持面容登录，请用暗号';
                } else {
                    errorEl.textContent = '⚠ 请在线上地址使用（非 file://）';
                }
                faceBtn.textContent = '🪞 面容登录';
                faceBtn.disabled = false;
            }
        });
    }

    async function registerFace() {
        var challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        var userId = new Uint8Array(16);
        crypto.getRandomValues(userId);
        var cred = await navigator.credentials.create({
            publicKey: {
                challenge: challenge,
                rp: { name: '泽阳的科创主页' },
                user: {
                    id: userId,
                    name: 'zeyang',
                    displayName: '泽阳'
                },
                pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    userVerification: 'required'
                },
                timeout: 60000,
                attestation: 'none'
            }
        });
        var rawId = btoa(String.fromCharCode.apply(null, new Uint8Array(cred.rawId)));
        localStorage.setItem('faceCredId', rawId);
        errorEl.textContent = '✅ 面容已注册！下次可直接面容登录';
        errorEl.style.color = '#48bb78';
    }

    async function authenticateFace(storedId) {
        var challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        var rawIdBytes = Uint8Array.from(atob(storedId), function(c) { return c.charCodeAt(0); });
        await navigator.credentials.get({
            publicKey: {
                challenge: challenge,
                allowCredentials: [{
                    id: rawIdBytes,
                    type: 'public-key'
                }],
                userVerification: 'required',
                timeout: 60000
            }
        });
    }

    async function doLogin() {
        var user = userInput.value.trim();
        var pass = passInput.value;
        var userH = await sha256(user);
        var passH = await sha256(pass);
        if (userH === USER_HASH && passH === PASS_HASH) {
            sessionStorage.setItem('loggedIn', 'true');
            overlay.classList.add('hidden');
            mainContent.style.display = 'block';
        } else {
            errorEl.textContent = '⚠ 用户名或暗号错误';
            passInput.value = '';
            passInput.focus();
        }
    }

    loginBtn.addEventListener('click', doLogin);
    passInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') doLogin();
    });
})();

// ==================== 项目数据 ====================
var projects = [
    {
        id: 'snake', emoji: '🐍', name: '贪吃蛇', gameType: 'snake',
        tag: 'HTML5 · 游戏', tagClass: 'card-tag--green',
        desc: '用纯 JavaScript + Canvas 实现的经典贪吃蛇游戏。方向键控制，吃到食物得分，撞墙或撞到自己则游戏结束。',
        code: '// === 贪吃蛇核心逻辑 ===\nconst canvas = document.getElementById(\"gameCanvas\");\nconst ctx = canvas.getContext(\"2d\");\nconst box = 20;\nlet snake = [{ x: 9 * box, y: 10 * box }];\nlet food = spawnFood();\nlet direction = \"RIGHT\";\nlet score = 0;\n\ndocument.addEventListener(\"keydown\", changeDirection);\n\nfunction changeDirection(e) {\n    if (e.key === \"ArrowUp\"    && direction !== \"DOWN\")  direction = \"UP\";\n    if (e.key === \"ArrowDown\"  && direction !== \"UP\")    direction = \"DOWN\";\n    if (e.key === \"ArrowLeft\"  && direction !== \"RIGHT\") direction = \"LEFT\";\n    if (e.key === \"ArrowRight\" && direction !== \"LEFT\")  direction = \"RIGHT\";\n}\n\nfunction spawnFood() {\n    return { x: Math.floor(Math.random() * 20) * box, y: Math.floor(Math.random() * 20) * box };\n}\n\nfunction draw() {\n    ctx.fillStyle = \"#1a202c\"; ctx.fillRect(0, 0, 400, 400);\n    ctx.fillStyle = \"#f56565\"; ctx.fillRect(food.x, food.y, box, box);\n    snake.forEach((seg, i) => { ctx.fillStyle = i === 0 ? \"#48bb78\" : \"#68d391\"; ctx.fillRect(seg.x, seg.y, box - 1, box - 1); });\n}\n\nfunction update() {\n    const head = { ...snake[0] };\n    if (direction === \"UP\") head.y -= box;\n    if (direction === \"DOWN\") head.y += box;\n    if (direction === \"LEFT\") head.x -= box;\n    if (direction === \"RIGHT\") head.x += box;\n    if (head.x < 0 || head.y < 0 || head.x >= 400 || head.y >= 400) return gameOver();\n    if (snake.some(s => s.x === head.x && s.y === head.y)) return gameOver();\n    snake.unshift(head);\n    if (head.x === food.x && head.y === food.y) { score++; food = spawnFood(); }\n    else { snake.pop(); }\n    draw();\n    setTimeout(() => update(), 120);\n}\n\nfunction gameOver() { ctx.fillStyle = \"#fff\"; ctx.font = \"24px sans-serif\"; ctx.fillText(\"Game Over! \" + score, 60, 200); }\n\nfunction startGame() { snake = [{ x: 9 * box, y: 10 * box }]; direction = \"RIGHT\"; score = 0; food = spawnFood(); update(); }',
        hasGame: true
    },
    {
        id: 'trash', emoji: '🤖', name: '智能分类垃圾桶', gameType: 'trash',
        tag: 'AI · 环保', tagClass: 'card-tag--green',
        desc: '基于图像识别的智能垃圾桶原型。树莓派 + 摄像头 + TensorFlow Lite，实时分类四类垃圾，自动开盖。市科创大赛一等奖。',
        code: '# === 智能分类垃圾桶 Python 核心 ===\nimport tensorflow as tf\nimport cv2\n\nmodel = tf.keras.models.load_model(\"trash_classifier.h5\")\nclass_names = [\"可回收\", \"厨余\", \"有害\", \"其他\"]\n\ndef classify_trash(image_path):\n    img = cv2.imread(image_path)\n    img = cv2.resize(img, (224, 224)) / 255.0\n    pred = model.predict(img.reshape(1, 224, 224, 3))\n    idx = pred.argmax()\n    return class_names[idx], pred[0][idx]\n\nresult, conf = classify_trash(\"trash.jpg\")\nprint(f\"结果: {result} (置信度: {conf:.2%})\")',
        hasGame: true
    },
    {
        id: 'plant', emoji: '🌱', name: '校园植物监测站', gameType: 'plant',
        tag: 'IoT · 生物', tagClass: 'card-tag--pink',
        desc: 'Arduino + ESP8266 物联网监测系统。土壤湿度、光照、温湿度实时采集，云端上传，自动浇水。学校温室稳定运行 6+ 月。',
        code: '// === Arduino 监测站核心 ===\n#include <ESP8266WiFi.h>\n#include <DHT.h>\n\nDHT dht(2, DHT11);\n\nvoid loop() {\n    float temp = dht.readTemperature();\n    float hum  = dht.readHumidity();\n    int soil   = analogRead(A0);\n    int light  = analogRead(A1);\n\n    if (soil < 400) {\n        digitalWrite(5, HIGH); delay(3000);\n        digitalWrite(5, LOW);\n    }\n    delay(60000);\n}',
        hasGame: true
    },
    {
        id: 'math', emoji: '🎮', name: '数学冒险岛', gameType: 'math',
        tag: '编程 · 教育', tagClass: 'card-tag--purple',
        desc: 'Pygame 趣味数学闯关游戏。50+ 关卡，解答四则运算解锁冒险，500+ 同学下载，校园编程之星。',
        code: '# === 数学冒险岛 Python 核心 ===\nimport pygame, random\n\npygame.init()\nscreen = pygame.display.set_mode((800, 600))\nfont = pygame.font.Font(None, 48)\nscore = 0; level = 1\n\ndef generate_q(level):\n    a = random.randint(1, level * 10)\n    b = random.randint(1, level * 10)\n    op = random.choice([\"+\", \"-\", \"*\"])\n    if op == \"+\": ans = a + b\n    elif op == \"-\": ans = a - b\n    else: ans = a * b\n    return f\"{a} {op} {b} = ?\", ans\n\nquestion, answer = generate_q(level)\n# ... 主循环处理输入与得分 ...',
        hasGame: true
    },
    {
        id: 'guess', emoji: '🔢', name: '猜数字', gameType: 'guess',
        tag: '逻辑 · 游戏', tagClass: 'card-tag--purple',
        desc: '经典猜数字游戏！系统随机生成 1-100 之间的数字，你来猜。每次猜测后提示太大或太小，看谁用最少次数猜中！',
        code: '# === 猜数字 Python 实现 ===\nimport random\n\nnumber = random.randint(1, 100)\nattempts = 0\n\nprint("我想了一个 1-100 之间的数字，猜猜看！")\n\nwhile True:\n    guess = int(input("你的猜测: "))\n    attempts += 1\n    if guess < number:\n        print("太小了，再大一点！")\n    elif guess > number:\n        print("太大了，再小一点！")\n    else:\n        print(f"猜对了！你用了 {attempts} 次")\n        break',
        hasGame: true
    }
];

// ==================== 生成气泡 ====================

// ==================== 生成气泡（支持拖动） ====================
function createBubbles() {
    var cloud = document.getElementById('bubbleCloud');
    if (!cloud) return;

    var dragInfo = null;

    projects.forEach(function(proj) {
        var bubble = document.createElement('div');
        bubble.className = 'bubble bubble--' + proj.id;
        bubble.setAttribute('data-project', proj.id);
        bubble.innerHTML = '<span class="scroll-ribbon"></span>' +
            '<span class="scroll-curl"></span>' +
            '<span class="bubble-emoji">' + proj.emoji +
            '</span><span class="bubble-name">' + proj.name + '</span>';

        // 点击 vs 拖动判断
        var hasMoved = false;
        var startX, startY, origLeft, origTop;

        bubble.addEventListener('mousedown', function(e) {
            if (e.button !== 0) return;
            e.preventDefault();
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            origLeft = bubble.offsetLeft;
            origTop = bubble.offsetTop;
            bubble.style.zIndex = '20';
            bubble.style.transition = 'none';
            bubble.style.animation = 'none';
            bubble.style.cursor = 'grabbing';

            function onMove(ev) {
                var dx = ev.clientX - startX;
                var dy = ev.clientY - startY;
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;
                var newLeft = origLeft + dx;
                var newTop = origTop + dy;
                // 边界限制
                var maxLeft = cloud.clientWidth - bubble.offsetWidth;
                var maxTop = cloud.clientHeight - bubble.offsetHeight;
                newLeft = Math.max(0, Math.min(newLeft, maxLeft));
                newTop = Math.max(0, Math.min(newTop, maxTop));
                bubble.style.left = newLeft + 'px';
                bubble.style.top = newTop + 'px';
            }

            function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                bubble.style.zIndex = '';
                bubble.style.transition = '';
                bubble.style.animation = 'floatScroll 5s ease-in-out infinite';
                bubble.style.animationDelay = (Math.random() * 4) + 's';
                bubble.style.cursor = 'pointer';
            }

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });

        // 触摸支持
        bubble.addEventListener('touchstart', function(e) {
            if (e.touches.length !== 1) return;
            hasMoved = false;
            var t = e.touches[0];
            startX = t.clientX;
            startY = t.clientY;
            origLeft = bubble.offsetLeft;
            origTop = bubble.offsetTop;
            bubble.style.zIndex = '20';
            bubble.style.transition = 'none';
            bubble.style.animation = 'none';

            function onTouchMove(ev) {
                var t2 = ev.touches[0];
                var dx = t2.clientX - startX;
                var dy = t2.clientY - startY;
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved = true;
                var newLeft = origLeft + dx;
                var newTop = origTop + dy;
                var maxLeft = cloud.clientWidth - bubble.offsetWidth;
                var maxTop = cloud.clientHeight - bubble.offsetHeight;
                newLeft = Math.max(0, Math.min(newLeft, maxLeft));
                newTop = Math.max(0, Math.min(newTop, maxTop));
                bubble.style.left = newLeft + 'px';
                bubble.style.top = newTop + 'px';
            }

            function onTouchEnd() {
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
                bubble.style.zIndex = '';
                bubble.style.transition = '';
                bubble.style.animation = 'floatScroll 5s ease-in-out infinite';
                bubble.style.animationDelay = (Math.random() * 4) + 's';
            }

            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd);
        });

        // 只有没拖动时才触发点击
        bubble.addEventListener('click', function(e) {
            if (hasMoved) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            openModal(proj);
        });

        cloud.appendChild(bubble);
    });
}
// ==================== 弹窗 ====================
function openModal(proj) {
    var overlay = document.getElementById('modalOverlay');
    var body = document.getElementById('modalBody');
    if (!overlay || !body) return;
    var html = '<span class="modal-project-icon">' + proj.emoji + '</span>';
    html += '<h2 class="modal-project-title">' + proj.name + '</h2>';
    html += '<div style="text-align:center"><span class="modal-project-tag ' + proj.tagClass + '">' + proj.tag + '</span></div>';
    html += '<p class="modal-project-desc">' + proj.desc + '</p>';
    html += '<pre class="modal-code-block"><code>' + escapeHtml(proj.code) + '</code></pre>';
    html += '<div class="modal-actions">';
    html += '<button class="btn-run btn-run--outline" onclick="copyCode(\'' + proj.id + '\')">📋 复制代码</button>';
    html += '<button class="btn-run btn-run--primary" onclick="launchGame(\'' + proj.gameType + '\')">▶ 运行模拟</button>';
    html += '</div>';
    html += '<div class="game-container" id="gameArea" style="display:none"></div>';
    body.innerHTML = html;
    overlay.classList.add('active');
}

function launchGame(gameType) {
    stopAllGames();
    var gameArea = document.getElementById('gameArea');
    var codeBlock = document.querySelector('.modal-code-block');
    if (codeBlock) codeBlock.style.display = 'none';
    gameArea.style.display = 'block';
    gameArea.innerHTML = '';
    if (gameType === 'snake') launchSnakeGame();
    else if (gameType === 'trash') launchTrashGame();
    else if (gameType === 'plant') launchPlantSim();
    else if (gameType === 'math') launchMathGame();
    else if (gameType === 'guess') launchGuessGame();
    else if (gameType === 'custom') launchCustomProject();
}

function stopAllGames() {
    stopSnakeGame();
    stopTrashGame();
    stopPlantSim();
    stopMathGame();
    stopGuessGame();
}

function closeModal() {
    var overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
    stopAllGames();
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function copyCode(projectId) {
    var proj = projects.find(function(p) { return p.id === projectId; });
    if (!proj) return;
    navigator.clipboard.writeText(proj.code).then(function() {
        alert('✅ 代码已复制到剪贴板！');
    }).catch(function() {
        alert('复制失败，请手动选择代码复制');
    });
}

// ==================== 弹窗关闭事件 ====================
document.addEventListener('DOMContentLoaded', function() {
    var overlay = document.getElementById('modalOverlay');
    var closeBtn = document.getElementById('modalClose');
    if (overlay) overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
});

// ==================== 智能分类垃圾桶模拟 ====================
var trashInterval = null;
var trashState = null;

function launchTrashGame() {
    var gameArea = document.getElementById('gameArea');
    gameArea.innerHTML =
        '<div style="background:rgba(102,126,234,0.1);border-radius:12px;padding:14px 18px;margin-bottom:14px;text-align:left;font-size:13px;color:#4a5568;line-height:1.8">' +
        '<b>🎮 玩法说明：</b><br>' +
        '垃圾从上方掉落，点击下方对应的<b>分类桶</b>来接住它！<br>' +
        '分类规则：♻可回收（塑料瓶/废纸）| 🍂厨余（苹果核/剩饭）| ☣有害（电池/灯泡）| 🗑其他（陶瓷/卫生纸）<br>' +
        '接对 +1分 · 接错或漏接 算失误 · <b>5次失误游戏结束</b></div>' +
        '<div class="game-score" id="gameScore">得分: 0</div>' +
        '<canvas id="gameCanvas" width="400" height="420"></canvas>';
    var canvas = document.getElementById('gameCanvas');
    var ctx = canvas.getContext('2d');
    var scoreEl = document.getElementById('gameScore');
    var items = [
        { name: '塑料瓶', icon: '🧴', bin: 0 }, { name: '废纸', icon: '📄', bin: 0 },
        { name: '苹果核', icon: '🍎', bin: 1 }, { name: '剩饭', icon: '🍚', bin: 1 },
        { name: '电池', icon: '🔋', bin: 2 }, { name: '灯泡', icon: '💡', bin: 2 },
        { name: '陶瓷碗', icon: '🍶', bin: 3 }, { name: '卫生纸', icon: '🧻', bin: 3 }
    ];
    var bins = ['♻ 可回收', '🍂 厨余', '☣ 有害', '🗑 其他'];
    var binColors = ['#48bb78', '#ed8936', '#f56565', '#a0aec0'];
    var fallingItem = null;
    var score = 0;
    var missed = 0;
    trashState = { canvas: canvas, ctx: ctx, scoreEl: scoreEl, running: true };

    function spawnItem() {
        var item = items[Math.floor(Math.random() * items.length)];
        fallingItem = { x: 40 + Math.random() * 320, y: 0, item: item, speed: 0.5 + Math.random() * 0.3 };
    }

    function draw() {
        ctx.clearRect(0, 0, 400, 420);
        if (fallingItem) {
            ctx.font = '44px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(fallingItem.item.icon, fallingItem.x, fallingItem.y);
            ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#fff';
            ctx.fillText(fallingItem.item.name, fallingItem.x, fallingItem.y + 30);
            ctx.fillStyle = '#000'; ctx.textAlign = 'start';
        }
        for (var i = 0; i < 4; i++) {
            var bx = i * 100 + 5;
            ctx.fillStyle = binColors[i]; ctx.fillRect(bx, 358, 90, 55);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(bins[i], bx + 45, 388); ctx.textAlign = 'start';
        }
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
        ctx.fillText('失误: ' + missed + '/5', 10, 22);
    }

    function update() {
        if (!trashState || !trashState.running) return;
        if (!fallingItem) spawnItem();
        fallingItem.y += fallingItem.speed;
        if (fallingItem.y > 420) {
            missed++;
            if (missed >= 5) {
                ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, 400, 420);
                ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('游戏结束！', 200, 170); ctx.fillText('最终得分: ' + score, 200, 210);
                ctx.font = '16px sans-serif'; ctx.fillText('点击画布重新开始', 200, 250); ctx.textAlign = 'start';
                trashState.running = false; return;
            }
            fallingItem = null;
        }
        draw();
        trashInterval = requestAnimationFrame(update);
    }

    canvas.onclick = function(e) {
        if (!trashState || !trashState.running) {
            missed = 0; score = 0; trashState.running = true; fallingItem = null;
            scoreEl.textContent = '得分: 0'; update(); return;
        }
        if (!fallingItem) return;
        var rect = canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left, my = e.clientY - rect.top;
        var binIdx = Math.floor(mx / 100);
        if (binIdx >= 0 && binIdx < 4 && my > 350 && my < 420) {
            if (binIdx === fallingItem.item.bin) { score++; scoreEl.textContent = '得分: ' + score; }
            else { missed++; }
            if (missed >= 5) {
                trashState.running = false; draw();
                ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, 400, 420);
                ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('游戏结束！', 200, 170); ctx.fillText('最终得分: ' + score, 200, 210);
                ctx.font = '16px sans-serif'; ctx.fillText('点击画布重新开始', 200, 250); ctx.textAlign = 'start';
            }
            fallingItem = null;
        }
    };
    update();
}

function stopTrashGame() {
    if (trashInterval) cancelAnimationFrame(trashInterval);
    trashInterval = null; trashState = null;
}

// ==================== 校园植物监测站模拟 ====================
var plantInterval = null;
var plantState = null;

function launchPlantSim() {
    var gameArea = document.getElementById('gameArea');
    gameArea.innerHTML = '<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;justify-content:center">' +
        '<canvas id="gameCanvas" width="200" height="280"></canvas>' +
        '<div style="color:#2d3748;font-size:14px;line-height:2.2">' +
        '<div>🌡 温度: <b id="valTemp">25°C</b></div>' +
        '<div>💧 土壤湿度: <b id="valMoist">60%</b></div>' +
        '<div>☀ 光照: <b id="valLight">800 lux</b></div>' +
        '<button id="btnWater" style="margin-top:10px;padding:8px 20px;background:#48bb78;color:#fff;border:none;border-radius:20px;cursor:pointer;font-weight:700">💧 浇水</button>' +
        '</div></div>' +
        '<p class="game-hint">点击浇水按钮保持植物健康！湿度太低植物会枯萎。</p>';
    var canvas = document.getElementById('gameCanvas');
    var ctx = canvas.getContext('2d');
    var moisture = 60;
    plantState = { canvas: canvas, ctx: ctx, running: true, moisture: moisture };

    function drawPlant() {
        ctx.clearRect(0, 0, 200, 280);
        var wilt = Math.max(0, 1 - moisture / 30);
        ctx.fillStyle = '#c05621'; ctx.fillRect(60, 200, 80, 50);
        ctx.fillStyle = '#9c4221'; ctx.fillRect(55, 195, 90, 10);
        var stemBend = wilt * 20;
        ctx.strokeStyle = '#48bb78'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(100, 195);
        ctx.quadraticCurveTo(100 + stemBend, 140, 100 + stemBend * 1.5, 100); ctx.stroke();
        ctx.fillStyle = moisture < 15 ? '#c6a700' : '#68d391';
        ctx.beginPath(); ctx.ellipse(70 + stemBend, 140, 20, 10, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(130 + stemBend, 120, 22, 10, 0.3, 0, Math.PI * 2); ctx.fill();
        var cx = 100 + stemBend * 1.5, cy = 100;
        var petalColor = moisture < 15 ? '#a0aec0' : '#fbb6ce';
        for (var i = 0; i < 6; i++) {
            var angle = (i / 6) * Math.PI * 2;
            ctx.fillStyle = petalColor;
            ctx.beginPath(); ctx.arc(cx + Math.cos(angle) * 14, cy + Math.sin(angle) * 14, 8, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#fbd38d'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8B6914'; ctx.fillRect(62, 210, 76, 35);
    }

    function updateSim() {
        if (!plantState || !plantState.running) return;
        moisture -= 0.15;
        if (moisture < 0) moisture = 0;
        var temp = 24 + Math.sin(Date.now() / 5000) * 4;
        var light = 700 + Math.sin(Date.now() / 3000) * 200;
        document.getElementById('valMoist').textContent = Math.round(moisture) + '%';
        document.getElementById('valMoist').style.color = moisture < 20 ? '#e53e3e' : '#2d3748';
        document.getElementById('valTemp').textContent = Math.round(temp) + '°C';
        document.getElementById('valLight').textContent = Math.round(light) + ' lux';
        plantState.moisture = moisture;
        drawPlant();
        plantInterval = requestAnimationFrame(updateSim);
    }
    document.getElementById('btnWater').onclick = function() { moisture = Math.min(100, moisture + 25); };
    drawPlant(); updateSim();
}

function stopPlantSim() {
    if (plantInterval) cancelAnimationFrame(plantInterval);
    plantInterval = null; plantState = null;
}

// ==================== 数学冒险岛模拟 ====================
var mathState = null;

function generateMathQuestion() {
    if (!mathState) return null;
    var a = Math.floor(Math.random() * mathState.level * 8) + 1;
    var b = Math.floor(Math.random() * mathState.level * 8) + 1;
    var ops = ['+', '-', '×'];
    var op = ops[Math.floor(Math.random() * 3)];
    var answer, symbol;
    if (op === '+') { answer = a + b; symbol = '+'; }
    else if (op === '-') { answer = Math.max(a, b) - Math.min(a, b); symbol = '-'; if (a < b) { var t = a; a = b; b = t; } }
    else { answer = a * b; symbol = '×'; }
    var options = [answer];
    while (options.length < 4) {
        var wrong = answer + (Math.floor(Math.random() * 10) - 5) * (mathState.level + 1);
        if (wrong !== answer && wrong >= 0 && options.indexOf(wrong) === -1) options.push(wrong);
    }
    options.sort(function() { return Math.random() - 0.5; });
    return { question: a + ' ' + symbol + ' ' + b + ' = ?', answer: answer, options: options };
}

function launchMathGame() {
    var gameArea = document.getElementById('gameArea');
    gameArea.innerHTML = '<div style="text-align:center">' +
        '<div class="game-score" id="gameScore">得分: 0 | 关卡: 1</div>' +
        '<div style="font-size:32px;font-weight:800;color:#2d3748;margin:20px 0" id="mathQuestion"></div>' +
        '<div id="mathOptions" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:300px;margin:0 auto"></div>' +
        '<div id="mathFeedback" style="margin-top:16px;font-size:18px;font-weight:700;min-height:28px"></div>' +
        '</div><p class="game-hint">选择正确答案，连续答对升级！</p>';
    mathState = { score: 0, level: 1, combo: 0, running: true };
    function generateQuestion() {
        var a = Math.floor(Math.random() * mathState.level * 8) + 1;
        var b = Math.floor(Math.random() * mathState.level * 8) + 1;
        var ops = ['+', '-', '×'];
        var op = ops[Math.floor(Math.random() * 3)];
        var answer, symbol;
        if (op === '+') { answer = a + b; symbol = '+'; }
        else if (op === '-') { answer = Math.max(a, b) - Math.min(a, b); symbol = '-'; if (a < b) { var t = a; a = b; b = t; } }
        else { answer = a * b; symbol = '×'; }
        var options = [answer];
        while (options.length < 4) {
            var wrong = answer + (Math.floor(Math.random() * 10) - 5) * (mathState.level + 1);
            if (wrong !== answer && wrong >= 0 && options.indexOf(wrong) === -1) options.push(wrong);
        }
        options.sort(function() { return Math.random() - 0.5; });
        return { question: a + ' ' + symbol + ' ' + b + ' = ?', answer: answer, options: options };
    }
    buildRound(generateQuestion());
}

function buildRound(q) {
    document.getElementById('mathQuestion').textContent = q.question;
    var optDiv = document.getElementById('mathOptions');
    optDiv.innerHTML = '';
    q.options.forEach(function(opt) {
        var btn = document.createElement('button');
        btn.className = 'btn-run btn-run--outline';
        btn.textContent = opt;
        btn.style.cssText = 'font-size:20px;padding:14px';
        btn.onclick = function() {
            if (!mathState || !mathState.running) return;
            var fb = document.getElementById('mathFeedback');
            mathState.running = false;
            if (opt === q.answer) {
                mathState.score += 10 + mathState.combo * 2; mathState.combo++;
                if (mathState.combo >= 5) { mathState.level++; mathState.combo = 0; }
                fb.textContent = '✅ 正确！'; fb.style.color = '#48bb78';
            } else {
                mathState.combo = 0;
                fb.textContent = '❌ 答案是 ' + q.answer; fb.style.color = '#e53e3e';
            }
            document.getElementById('gameScore').textContent = '得分: ' + mathState.score + ' | 关卡: ' + mathState.level;
            setTimeout(function() {
                if (!mathState) return;
                fb.textContent = '';
                var newQ = generateMathQuestion();
                document.getElementById('mathQuestion').textContent = newQ.question;
                buildRound(newQ);
            }, 800);
        };
        optDiv.appendChild(btn);
    });
}

function stopMathGame() { mathState = null; }

// ==================== 猜数字模拟 ====================
var guessState = null;

function launchGuessGame() {
    var gameArea = document.getElementById('gameArea');
    gameArea.innerHTML =
        '<div style="text-align:center">' +
        '<div class="game-score" id="gameScore">已猜次数: 0</div>' +
        '<div style="font-size:48px;margin:16px 0" id="guessEmoji">🤔</div>' +
        '<div style="font-size:15px;color:#718096;margin-bottom:12px">我想了一个 <b>1-100</b> 之间的数字</div>' +
        '<input id="guessInput" type="number" min="1" max="100" placeholder="输入你的猜测..." ' +
        'style="width:200px;padding:12px 16px;font-size:22px;border:2px solid #e2e8f0;border-radius:12px;text-align:center;outline:none" autofocus>' +
        '<br><button id="guessBtn" class="btn-run btn-run--primary" style="margin-top:14px;font-size:18px">🎯 猜测！</button>' +
        '<div id="guessHint" style="margin-top:16px;font-size:20px;font-weight:700;min-height:32px;color:#4a5568"></div>' +
        '<div id="guessHistory" style="margin-top:12px;font-size:13px;color:#a0aec0;max-height:120px;overflow-y:auto"></div>' +
        '</div>' +
        '<p class="game-hint">输入数字点击猜测，看谁用最少次数猜中！</p>';

    var target = Math.floor(Math.random() * 100) + 1;
    var attempts = 0;
    var history = [];
    guessState = { running: true, target: target, attempts: attempts };

    var input = document.getElementById('guessInput');
    var btn = document.getElementById('guessBtn');
    var hint = document.getElementById('guessHint');
    var emoji = document.getElementById('guessEmoji');
    var scoreEl = document.getElementById('gameScore');
    var histEl = document.getElementById('guessHistory');

    function doGuess() {
        if (!guessState || !guessState.running) return;
        var val = parseInt(input.value);
        if (isNaN(val) || val < 1 || val > 100) {
            hint.textContent = '⚠ 请输入 1-100 之间的数字';
            hint.style.color = '#e53e3e';
            return;
        }
        if (history.indexOf(val) !== -1) {
            hint.textContent = '⚠ 这个数字已经猜过了！';
            hint.style.color = '#e53e3e';
            return;
        }
        guessState.attempts++;
        history.push(val);
        scoreEl.textContent = '已猜次数: ' + guessState.attempts;
        histEl.textContent = '历史: ' + history.join(' → ');

        if (val < guessState.target) {
            hint.textContent = '📈 太小了，再大一点！';
            hint.style.color = '#3182ce';
            emoji.textContent = '📈';
        } else if (val > guessState.target) {
            hint.textContent = '📉 太大了，再小一点！';
            hint.style.color = '#e53e3e';
            emoji.textContent = '📉';
        } else {
            hint.textContent = '🎉 猜对了！答案是 ' + guessState.target + '！';
            hint.style.color = '#48bb78';
            emoji.textContent = '🎉';
            guessState.running = false;
            btn.textContent = '🔄 再来一局';
            btn.onclick = function() { launchGuessGame(); };
        }
        input.value = '';
        input.focus();
    }

    btn.onclick = doGuess;
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') doGuess();
    });
    setTimeout(function() { input.focus(); }, 100);
}

function stopGuessGame() {
    guessState = null;
}

// ==================== Python 运行器（Pyodide） ====================
var pyodideReady = null;

async function getPyodide() {
    if (pyodideReady) return pyodideReady;
    pyodideReady = (async function() {
        var pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
        });
        return pyodide;
    })();
    return pyodideReady;
}

function stopCustomProject() {}

function launchCustomProject() {
    var gameArea = document.getElementById('gameArea');
    gameArea.innerHTML =
        '<div style="text-align:center">' +
        '<div id="pyStatus" style="font-size:14px;color:#d4a574;margin-bottom:12px">⏳ 正在加载 Python 运行时...</div>' +
        '<div id="pyOutput" style="background:#0a0806;color:#48bb78;border-radius:12px;padding:20px;' +
        'font-family:Consolas,monospace;font-size:13px;text-align:left;min-height:200px;max-height:350px;' +
        'overflow-y:auto;white-space:pre-wrap;line-height:1.6;display:none"></div>' +
        '<button id="pyRunBtn" class="btn-run btn-run--primary" style="margin-top:14px;display:none">▶ 运行</button>' +
        '</div>' +
        '<p class="game-hint">首次加载需要下载 Python 运行时（约10MB），之后会缓存</p>';

    // 找到自定义项目的 Python 代码
    var customProj = projects.find(function(p) { return p.id === 'custom'; });
    if (!customProj) return;

    getPyodide().then(function(py) {
        document.getElementById('pyStatus').textContent = '✅ Python 就绪！';
        document.getElementById('pyOutput').style.display = 'block';
        document.getElementById('pyRunBtn').style.display = 'inline-block';

        document.getElementById('pyRunBtn').onclick = function() {
            var output = document.getElementById('pyOutput');
            output.textContent = '>>> 运行中...\n';
            try {
                // 用 Pyodide 执行 Python 代码
                py.runPython("import sys\nfrom io import StringIO\nsys.stdout = StringIO()");
                py.runPython(customProj.code);
                var result = py.runPython("sys.stdout.getvalue()");
                py.runPython("sys.stdout = sys.__stdout__");
                output.textContent = result || '(无输出)';
                output.style.color = '#48bb78';
            } catch (err) {
                output.textContent = '❌ 错误:\n' + err.message;
                output.style.color = '#f56565';
            }
        };
    }).catch(function(err) {
        document.getElementById('pyStatus').textContent = '❌ 加载失败: ' + err.message;
    });
}
// ==================== 贪吃蛇游戏 ====================
var snakeInterval = null;
var snakeState = null;

function initSnakeState() {
    var box = 20;
    return {
        snake: [{ x: 9 * box, y: 10 * box }],
        food: { x: Math.floor(Math.random() * 20) * box, y: Math.floor(Math.random() * 20) * box },
        direction: 'RIGHT', score: 0, running: true, box: box
    };
}

function launchSnakeGame() {
    var gameArea = document.getElementById('gameArea');
    gameArea.innerHTML = '<div class="game-score" id="gameScore">得分: 0</div>' +
        '<canvas id="gameCanvas" width="400" height="400"></canvas>' +
        '<p class="game-hint">⬆⬇⬅➡ 方向键控制 · 点击画布重新开始</p>';
    var canvas = document.getElementById('gameCanvas');
    var scoreEl = document.getElementById('gameScore');

    snakeState = initSnakeState();
    var ctx = canvas.getContext('2d');
    var box = snakeState.box;

    function snakeKeyHandler(e) {
        if (e.key === 'ArrowUp'    && snakeState.direction !== 'DOWN')  snakeState.direction = 'UP';
        if (e.key === 'ArrowDown'  && snakeState.direction !== 'UP')    snakeState.direction = 'DOWN';
        if (e.key === 'ArrowLeft'  && snakeState.direction !== 'RIGHT') snakeState.direction = 'LEFT';
        if (e.key === 'ArrowRight' && snakeState.direction !== 'LEFT')  snakeState.direction = 'RIGHT';
    }
    document.addEventListener('keydown', snakeKeyHandler);

    function drawSnake() {
        ctx.fillStyle = '#1a202c'; ctx.fillRect(0, 0, 400, 400);
        ctx.fillStyle = '#f56565'; ctx.shadowColor = '#f56565'; ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(snakeState.food.x + box / 2, snakeState.food.y + box / 2, box / 2 - 2, 0, Math.PI * 2);
        ctx.fill(); ctx.shadowBlur = 0;

        snakeState.snake.forEach(function(seg, i) {
            ctx.fillStyle = i === 0 ? '#48bb78' : '#68d391';
            ctx.fillRect(seg.x + 1, seg.y + 1, box - 2, box - 2);
            if (i === 0) {
                ctx.fillStyle = '#fff';
                var cx = seg.x + box / 2, cy = seg.y + box / 2, r = 3;
                var ex1, ey1, ex2, ey2;
                if (snakeState.direction === 'RIGHT')      { ex1 = cx + 4; ey1 = cy - 4; ex2 = cx + 4; ey2 = cy + 4; }
                else if (snakeState.direction === 'LEFT')  { ex1 = cx - 4; ey1 = cy - 4; ex2 = cx - 4; ey2 = cy + 4; }
                else if (snakeState.direction === 'UP')    { ex1 = cx - 4; ey1 = cy - 4; ex2 = cx + 4; ey2 = cy - 4; }
                else                                        { ex1 = cx - 4; ey1 = cy + 4; ex2 = cx + 4; ey2 = cy + 4; }
                ctx.beginPath(); ctx.arc(ex1, ey1, r, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(ex2, ey2, r, 0, Math.PI * 2); ctx.fill();
            }
        });
    }

    function gameLoop() {
        if (!snakeState.running) return;
        var head = { x: snakeState.snake[0].x, y: snakeState.snake[0].y };
        if (snakeState.direction === 'UP')    head.y -= box;
        if (snakeState.direction === 'DOWN')  head.y += box;
        if (snakeState.direction === 'LEFT')  head.x -= box;
        if (snakeState.direction === 'RIGHT') head.x += box;
        if (head.x < 0 || head.y < 0 || head.x >= 400 || head.y >= 400) return endGame('撞墙了！');
        if (snakeState.snake.some(function(s) { return s.x === head.x && s.y === head.y; })) return endGame('咬到自己了！');
        snakeState.snake.unshift(head);
        if (head.x === snakeState.food.x && head.y === snakeState.food.y) {
            snakeState.score++;
            scoreEl.textContent = '得分: ' + snakeState.score;
            do {
                snakeState.food = {
                    x: Math.floor(Math.random() * 20) * box,
                    y: Math.floor(Math.random() * 20) * box
                };
            } while (snakeState.snake.some(function(s) { return s.x === snakeState.food.x && s.y === snakeState.food.y; }));
        } else {
            snakeState.snake.pop();
        }
        drawSnake();
        snakeInterval = setTimeout(gameLoop, 100);
    }

    function endGame(msg) {
        snakeState.running = false;
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, 400, 400);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(msg, 200, 180);
        ctx.fillText('得分: ' + snakeState.score, 200, 220);
        ctx.font = '16px sans-serif';
        ctx.fillText('点击此处重新开始', 200, 300);
        ctx.textAlign = 'start';
    }

    drawSnake();
    snakeInterval = setTimeout(gameLoop, 100);

    canvas.onclick = function() {
        clearTimeout(snakeInterval);
        document.removeEventListener('keydown', snakeKeyHandler);
        snakeState = initSnakeState();
        scoreEl.textContent = '得分: 0';
        drawSnake();
        snakeInterval = setTimeout(gameLoop, 100);
    };
}

function stopSnakeGame() {
    clearTimeout(snakeInterval);
    snakeInterval = null;
    snakeState = null;
}


// ==================== 上传 .py 文件 ====================
var uploadIdCounter = 0;

function setupUpload() {
    var uploadBtn = document.getElementById('uploadBtn');
    var fileInput = document.getElementById('pyFileInput');
    if (!uploadBtn || !fileInput) return;

    uploadBtn.addEventListener('click', function() { fileInput.click(); });

    fileInput.addEventListener('change', function() {
        var files = fileInput.files;
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (!file.name.endsWith('.py')) continue;
            var reader = new FileReader();
            reader.onload = (function(f) {
                return function(e) {
                    var code = e.target.result;
                    var name = f.name.replace('.py', '');
                    addUploadedProject(name, code, f.name);
                };
            })(file);
            reader.readAsText(file);
        }
        fileInput.value = '';
    });
}

function addUploadedProject(name, code, filename) {
    var id = 'upload_' + (++uploadIdCounter);
    var emojis = ['💻','⚡','🔥','🧪','🔬','🎯','💡','🛠️','📊','🧩'];
    var emoji = emojis[Math.floor(Math.random() * emojis.length)];

    var proj = {
        id: id, emoji: emoji, name: name, gameType: 'custom',
        tag: 'Python · 上传', tagClass: 'card-tag--green',
        desc: '从 ' + filename + ' 上传的自定义 Python 项目。',
        code: code, hasGame: true
    };

    // 加入项目列表
    projects.push(proj);

    // 创建卷轴气泡
    var cloud = document.getElementById('bubbleCloud');
    var bubble = document.createElement('div');
    bubble.className = 'bubble bubble--custom';
    bubble.setAttribute('data-project', id);

    // 随机位置
    var maxLeft = 700, maxTop = 420;
    bubble.style.left = (10 + Math.random() * (maxLeft - 100)) + 'px';
    bubble.style.top = (10 + Math.random() * (maxTop - 160)) + 'px';
    bubble.style.animationDelay = (Math.random() * 4) + 's';

    bubble.innerHTML = '<span class="scroll-ribbon"></span>' +
        '<span class="scroll-curl"></span>' +
        '<span class="bubble-emoji">' + emoji +
        '</span><span class="bubble-name">' + name + '</span>';

    // 拖动支持
    var hasMoved = false, startX, startY, origLeft, origTop;
    bubble.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        e.preventDefault();
        hasMoved = false;
        startX = e.clientX; startY = e.clientY;
        origLeft = bubble.offsetLeft; origTop = bubble.offsetTop;
        bubble.style.zIndex = '20'; bubble.style.transition = 'none'; bubble.style.animation = 'none';
        bubble.style.cursor = 'grabbing';
        function onMove(ev) {
            var dx = ev.clientX - startX, dy = ev.clientY - startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;
            var nl = Math.max(0, Math.min(origLeft + dx, cloud.clientWidth - bubble.offsetWidth));
            var nt = Math.max(0, Math.min(origTop + dy, cloud.clientHeight - bubble.offsetHeight));
            bubble.style.left = nl + 'px'; bubble.style.top = nt + 'px';
        }
        function onUp() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            bubble.style.zIndex = ''; bubble.style.transition = '';
            bubble.style.animation = 'floatScroll 5s ease-in-out infinite';
            bubble.style.animationDelay = (Math.random() * 4) + 's'; bubble.style.cursor = 'grab';
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
    bubble.addEventListener('click', function(e) {
        if (hasMoved) { e.preventDefault(); e.stopPropagation(); return; }
        openModal(proj);
    });

    cloud.appendChild(bubble);
}

// 初始化上传
document.addEventListener('DOMContentLoaded', function() {
    setupUpload();
});

// ==================== 启动 ====================
createBubbles();
console.log('🚀 泽阳的科创主页已就绪 — 共 ' + projects.length + ' 个项目');
