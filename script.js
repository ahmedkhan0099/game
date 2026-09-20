const container = document.getElementById('game-container');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const accuracyEl = document.getElementById('accuracy');
const highScoreEl = document.getElementById('high-score');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg = document.getElementById('overlay-msg');
const startBtn = document.getElementById('start-btn');

let score = 0;
let timeLeft = 30;
let totalShots = 0;
let hits = 0;
let gameInterval = null;
let targetInterval = null;
let isGameRunning = false;

// High Score load karein
let highScore = localStorage.getItem('sharp_shooter_highscore') || 0;
highScoreEl.innerText = highScore;

// Start Button Click Event
startBtn.addEventListener('click', startGame);

// Gunshot Sounds (Web Audio API)
function playShootSound(type = 'shot') {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        if (type === 'shot') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        } else if (type === 'hit') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        } else if (type === 'bomb') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(100, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
        // Audio fallback
    }
}

// Missed Shots Detection
container.addEventListener('click', (e) => {
    if (!isGameRunning) return;
    if (e.target === container) {
        totalShots++;
        playShootSound('shot');
        updateAccuracy();
    }
});

function startGame() {
    score = 0;
    timeLeft = 30;
    totalShots = 0;
    hits = 0;
    isGameRunning = true;

    scoreEl.innerText = score;
    timerEl.innerText = timeLeft + 's';
    accuracyEl.innerText = '100%';
    
    overlay.style.display = 'none';

    // Clear old targets
    document.querySelectorAll('.target').forEach(t => t.remove());

    // Timers setup
    gameInterval = setInterval(updateTimer, 1000);
    targetInterval = setInterval(spawnTarget, 700);
    spawnTarget();
}

function updateTimer() {
    timeLeft--;
    timerEl.innerText = timeLeft + 's';

    if (timeLeft <= 0) {
        endGame();
    }
}

function spawnTarget() {
    if (!isGameRunning) return;

    const target = document.createElement('div');
    target.classList.add('target');

    const rand = Math.random();
    let size = 50;
    let points = 10;
    let type = 'normal';

    if (rand > 0.85) {
        type = 'fast';
        target.classList.add('target-fast');
        size = 35;
        points = 25;
    } else if (rand > 0.75) {
        type = 'bomb';
        target.classList.add('target-bomb');
        size = 45;
        points = -15;
    } else {
        target.classList.add('target-normal');
    }

    target.style.width = size + 'px';
    target.style.height = size + 'px';

    const maxX = container.clientWidth - size;
    const maxY = container.clientHeight - size;
    const x = Math.floor(Math.random() * maxX);
    const y = Math.floor(Math.random() * maxY);

    target.style.left = x + 'px';
    target.style.top = y + 'px';

    target.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isGameRunning) return;

        totalShots++;
        hits++;

        score += points;
        if (score < 0) score = 0;
        scoreEl.innerText = score;

        if (type === 'bomb') {
            playShootSound('bomb');
            showEffect(x, y, '-15', '#ef4444');
        } else {
            playShootSound('hit');
            showEffect(x, y, '+' + points, type === 'fast' ? '#eab308' : '#22c55e');
        }

        updateAccuracy();
        target.remove();
    });

    container.appendChild(target);

    setTimeout(() => {
        if (target.parentNode) {
            target.remove();
        }
    }, type === 'fast' ? 1000 : 1500);
}

function showEffect(x, y, text, color) {
    const effect = document.createElement('div');
    effect.classList.add('hit-effect');
    effect.innerText = text;
    effect.style.left = x + 'px';
    effect.style.top = y + 'px';
    effect.style.color = color;
    container.appendChild(effect);

    setTimeout(() => effect.remove(), 600);
}

function updateAccuracy() {
    if (totalShots === 0) return;
    const acc = Math.round((hits / totalShots) * 100);
    accuracyEl.innerText = acc + '%';
}

function endGame() {
    isGameRunning = false;
    clearInterval(gameInterval);
    clearInterval(targetInterval);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('sharp_shooter_highscore', highScore);
        highScoreEl.innerText = highScore;
    }

    overlayTitle.innerText = "Game Over!";
    overlayMsg.innerHTML = `Aapka Score: <b>${score}</b> <br> Accuracy: <b>${accuracyEl.innerText}</b>`;
    startBtn.innerText = "Play Again";
    overlay.style.display = 'flex';
}