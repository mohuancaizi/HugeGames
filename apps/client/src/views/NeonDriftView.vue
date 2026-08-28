<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

 type GameStatus = "idle" | "playing" | "paused" | "gameover";
 type Obstacle = { lane: number; y: number; width: number; height: number; hue: number };

 const canvas = ref<HTMLCanvasElement | null>(null);
 const status = ref<GameStatus>("idle");
 const score = ref(0);
 const highScore = ref(0);
 const speed = ref(1);
 const elapsed = ref(0);
 const statusLabel = computed(() => ({ idle: "准备出发", playing: "高速漂移中", paused: "已暂停", gameover: "撞击结束" }[status.value]));

 let animationFrame = 0;
 let lastFrame = 0;
 let spawnTimer = 0;
 let lastSpawnLane = -1;
 let resizeObserver: ResizeObserver | undefined;
 let obstacles: Obstacle[] = [];
 let playerLane = 1;

 const storageKey = "neon-drift-high-score";

 function readHighScore(): void {
   try {
     highScore.value = Number.parseInt(localStorage.getItem(storageKey) ?? "0", 10) || 0;
   } catch {
     highScore.value = 0;
   }
 }

 function saveHighScore(): void {
   if (score.value <= highScore.value) return;
   highScore.value = score.value;
   try {
     localStorage.setItem(storageKey, String(highScore.value));
   } catch {
     // 本地存储不可用时，仍保留本局最高分。
   }
 }

 function resizeCanvas(): void {
   const element = canvas.value;
   if (!element) return;
   const width = Math.max(280, Math.floor(element.clientWidth));
   const height = Math.max(440, Math.floor(element.clientHeight));
   const ratio = Math.min(window.devicePixelRatio || 1, 2);
   element.width = Math.floor(width * ratio);
   element.height = Math.floor(height * ratio);
   const context = element.getContext("2d");
   context?.setTransform(ratio, 0, 0, ratio, 0, 0);
   draw();
 }

 function laneMetrics(): { width: number; height: number; laneWidth: number } | null {
   const element = canvas.value;
   if (!element) return null;
   return { width: element.clientWidth, height: element.clientHeight, laneWidth: element.clientWidth / 3 };
 }

 function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
   const safeRadius = Math.min(radius, width / 2, height / 2);
   context.beginPath();
   context.moveTo(x + safeRadius, y);
   context.arcTo(x + width, y, x + width, y + height, safeRadius);
   context.arcTo(x + width, y + height, x, y + height, safeRadius);
   context.arcTo(x, y + height, x, y, safeRadius);
   context.arcTo(x, y, x + width, y, safeRadius);
   context.closePath();
 }

 function draw(): void {
   const context = canvas.value?.getContext("2d");
   const metrics = laneMetrics();
   if (!context || !metrics) return;
   const { width, height, laneWidth } = metrics;
   context.clearRect(0, 0, width, height);

   const background = context.createLinearGradient(0, 0, 0, height);
   background.addColorStop(0, "#0b1728");
   background.addColorStop(1, "#071016");
   context.fillStyle = background;
   context.fillRect(0, 0, width, height);

   context.strokeStyle = "rgba(91, 228, 193, .08)";
   context.lineWidth = 1;
   for (let y = 30; y < height; y += 42) {
     context.beginPath();
     context.moveTo(0, y);
     context.lineTo(width, y);
     context.stroke();
   }
   for (let lane = 1; lane < 3; lane += 1) {
     context.setLineDash([12, 14]);
     context.strokeStyle = "rgba(178, 255, 240, .22)";
     context.beginPath();
     context.moveTo(lane * laneWidth, 0);
     context.lineTo(lane * laneWidth, height);
     context.stroke();
   }
   context.setLineDash([]);

   for (const obstacle of obstacles) {
     const x = obstacle.lane * laneWidth + (laneWidth - obstacle.width) / 2;
     context.save();
     context.shadowBlur = 18;
     context.shadowColor = `hsl(${obstacle.hue} 90% 60%)`;
     context.fillStyle = `hsl(${obstacle.hue} 72% 47%)`;
     roundedRect(context, x, obstacle.y, obstacle.width, obstacle.height, 8);
     context.fill();
     context.shadowBlur = 0;
     context.strokeStyle = `hsl(${obstacle.hue} 100% 80%)`;
     context.lineWidth = 2;
     roundedRect(context, x + 2, obstacle.y + 2, obstacle.width - 4, obstacle.height - 4, 6);
     context.stroke();
     context.restore();
   }

   const playerWidth = laneWidth * 0.52;
   const playerHeight = 42;
   const playerX = playerLane * laneWidth + (laneWidth - playerWidth) / 2;
   const playerY = height - 70;
   context.save();
   context.shadowBlur = 22;
   context.shadowColor = "#5be4c1";
   context.fillStyle = "#5be4c1";
   context.beginPath();
   context.moveTo(playerX + playerWidth / 2, playerY - 8);
   context.lineTo(playerX + playerWidth, playerY + playerHeight);
   context.lineTo(playerX, playerY + playerHeight);
   context.closePath();
   context.fill();
   context.fillStyle = "#e8b64a";
   context.beginPath();
   context.moveTo(playerX + playerWidth / 2, playerY + 3);
   context.lineTo(playerX + playerWidth * 0.72, playerY + playerHeight - 5);
   context.lineTo(playerX + playerWidth * 0.28, playerY + playerHeight - 5);
   context.closePath();
   context.fill();
   context.restore();
 }

 function spawnObstacle(): void {
   const metrics = laneMetrics();
   if (!metrics) return;
   const availableLanes = [0, 1, 2].filter((lane) => lane !== lastSpawnLane || Math.random() > 0.45);
   const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)] ?? 1;
   lastSpawnLane = lane;
   obstacles.push({ lane, y: -52, width: metrics.laneWidth * 0.56, height: 42, hue: Math.random() > 0.5 ? 342 : 28 });
 }

 function finishGame(): void {
   status.value = "gameover";
   saveHighScore();
   draw();
 }

 function intersectsPlayer(obstacle: Obstacle, height: number, laneWidth: number): boolean {
   if (obstacle.lane !== playerLane) return false;
   const playerY = height - 70;
   const playerWidth = laneWidth * 0.52;
   const playerLeft = playerLane * laneWidth + (laneWidth - playerWidth) / 2;
   const obstacleLeft = obstacle.lane * laneWidth + (laneWidth - obstacle.width) / 2;
   return obstacle.y < playerY + 42 && obstacle.y + obstacle.height > playerY && obstacleLeft < playerLeft + playerWidth && obstacleLeft + obstacle.width > playerLeft;
 }

 function gameLoop(timestamp: number): void {
   if (status.value !== "playing") return;
   const metrics = laneMetrics();
   if (!metrics) return;
   const delta = Math.min((timestamp - lastFrame) / 1000, 0.05);
   lastFrame = timestamp;
   elapsed.value += delta;
   score.value = Math.floor(elapsed.value * 10);
   speed.value = Math.min(3.8, 1 + elapsed.value / 22);
   spawnTimer += delta * 1000;
   const spawnInterval = Math.max(430, 920 - elapsed.value * 13);
   if (spawnTimer >= spawnInterval) {
     spawnTimer = 0;
     spawnObstacle();
   }
   const pixelsPerSecond = 175 + elapsed.value * 8;
   obstacles = obstacles.filter((obstacle) => {
     obstacle.y += pixelsPerSecond * delta;
     return obstacle.y < metrics.height + obstacle.height;
   });
   if (obstacles.some((obstacle) => intersectsPlayer(obstacle, metrics.height, metrics.laneWidth))) {
     finishGame();
     return;
   }
   draw();
   animationFrame = requestAnimationFrame(gameLoop);
 }

 function startGame(): void {
   cancelAnimationFrame(animationFrame);
   playerLane = 1;
   obstacles = [];
   lastSpawnLane = -1;
   spawnTimer = 0;
   elapsed.value = 0;
   score.value = 0;
   speed.value = 1;
   status.value = "playing";
   lastFrame = performance.now();
   animationFrame = requestAnimationFrame(gameLoop);
 }

 function togglePause(): void {
   if (status.value === "playing") {
     status.value = "paused";
     cancelAnimationFrame(animationFrame);
     draw();
   } else if (status.value === "paused") {
     status.value = "playing";
     lastFrame = performance.now();
     animationFrame = requestAnimationFrame(gameLoop);
   }
 }

 function movePlayer(direction: -1 | 1): void {
   if (status.value === "idle" || status.value === "gameover") startGame();
   if (status.value !== "playing") return;
   playerLane = Math.max(0, Math.min(2, playerLane + direction));
   draw();
 }

 function handleKeydown(event: KeyboardEvent): void {
   if (!["ArrowLeft", "ArrowRight", "a", "A", "d", "D", "p", "P", "Enter"].includes(event.key)) return;
   event.preventDefault();
   if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") movePlayer(-1);
   else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") movePlayer(1);
   else if (event.key === "p" || event.key === "P") togglePause();
   else if (event.key === "Enter" && (status.value === "idle" || status.value === "gameover")) startGame();
 }

 onMounted(() => {
   readHighScore();
   window.addEventListener("keydown", handleKeydown, { passive: false });
   window.addEventListener("resize", resizeCanvas);
   if (canvas.value) {
     resizeObserver = new ResizeObserver(resizeCanvas);
     resizeObserver.observe(canvas.value);
   }
   resizeCanvas();
 });

 onBeforeUnmount(() => {
   cancelAnimationFrame(animationFrame);
   window.removeEventListener("keydown", handleKeydown);
   window.removeEventListener("resize", resizeCanvas);
   resizeObserver?.disconnect();
 });
</script>

<template>
  <div class="neon-drift-page">
    <header class="neon-drift-header">
      <RouterLink class="neon-back-link" to="/zh">‹ 返回大厅</RouterLink>
      <div class="neon-title"><p class="eyebrow">街机试炼 · NEON ARCADE</p><h1>Neon Drift</h1></div>
      <span class="neon-status-dot" :class="`is-${status}`" aria-label="游戏状态"></span>
    </header>

    <section class="neon-scoreboard" aria-label="游戏数据">
      <div><span>当前分数</span><strong>{{ score }}</strong></div>
      <div><span>最高分</span><strong>{{ highScore }}</strong></div>
      <div><span>速度</span><strong>{{ speed.toFixed(1) }}x</strong><small>{{ statusLabel }}</small></div>
    </section>

    <section class="neon-game-card">
      <div class="neon-canvas-wrap">
        <canvas ref="canvas" class="neon-canvas" aria-label="Neon Drift 三车道游戏画布"></canvas>
        <div v-if="status !== 'playing'" class="neon-overlay">
          <p class="eyebrow">{{ status === "gameover" ? "信号中断" : "三车道躲避" }}</p>
          <h2>{{ status === "gameover" ? `本局得分 ${score}` : status === "paused" ? "漂移已暂停" : "准备好了吗？" }}</h2>
          <p>{{ status === "gameover" ? `最高分 ${highScore} · 躲得越久，速度越快` : "左右移动飞船，避开迎面而来的能量障碍。" }}</p>
          <button class="primary-button" type="button" @click="status === 'paused' ? togglePause() : startGame()">{{ status === "gameover" ? "重新开始" : status === "paused" ? "继续漂移" : "开始游戏" }} <span>→</span></button>
        </div>
      </div>
      <div class="neon-controls" aria-label="移动控制">
        <button class="neon-control-button" type="button" aria-label="向左移动" @click="movePlayer(-1)">← <small>A</small></button>
        <button class="neon-pause-button" type="button" :disabled="status === 'idle' || status === 'gameover'" @click="togglePause">{{ status === "paused" ? "继续" : "暂停" }}</button>
        <button class="neon-control-button" type="button" aria-label="向右移动" @click="movePlayer(1)"><small>D</small> →</button>
      </div>
    </section>

    <div class="neon-footer"><span>键盘：← → / A D 移动 · P 暂停</span><button v-if="status === 'gameover'" class="neon-replay-link" type="button" @click="startGame">再玩一次</button></div>
  </div>
</template>

<style scoped>
.neon-drift-page { width: min(100% - 32px, 480px); min-height: 100vh; margin: 0 auto; padding: 24px 0 calc(32px + env(safe-area-inset-bottom)); color: var(--text); }
.neon-drift-header { display: flex; align-items: center; gap: 10px; min-height: 58px; }
.neon-back-link { color: var(--teal); font-size: 11px; text-decoration: none; white-space: nowrap; }
.neon-title { flex: 1; text-align: center; }.neon-title .eyebrow { margin-bottom: 3px; color: var(--gold); }.neon-title h1 { margin: 0; color: #f8f1d8; font-size: 24px; letter-spacing: .04em; }
.neon-status-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--muted); }.neon-status-dot.is-playing { background: var(--teal); box-shadow: 0 0 12px var(--teal); }.neon-status-dot.is-gameover { background: var(--red); }.neon-status-dot.is-paused { background: var(--gold); }
.neon-scoreboard { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 16px 0 12px; }.neon-scoreboard > div { min-height: 64px; padding: 10px; border: 1px solid var(--line); border-radius: var(--radius-md); background: rgba(16, 28, 41, .84); }.neon-scoreboard span, .neon-scoreboard small { display: block; color: var(--muted); font-size: 9px; }.neon-scoreboard strong { display: block; margin: 4px 0 1px; color: var(--gold-soft); font-size: 20px; }.neon-scoreboard small { color: var(--teal); }
.neon-game-card { padding: 10px; border: 1px solid var(--line-bright); border-radius: var(--radius-lg); background: linear-gradient(145deg, rgba(20, 43, 58, .92), rgba(8, 17, 27, .96)); box-shadow: 0 14px 40px rgba(0, 0, 0, .32); }.neon-canvas-wrap { position: relative; height: min(68vh, 620px); min-height: 440px; overflow: hidden; border: 1px solid rgba(91, 228, 193, .28); border-radius: var(--radius-md); }.neon-canvas { display: block; width: 100%; height: 100%; }.neon-overlay { position: absolute; inset: 0; display: flex; align-items: center; flex-direction: column; justify-content: center; padding: 28px; background: rgba(5, 12, 19, .74); text-align: center; }.neon-overlay h2 { margin: 0 0 10px; color: #f8f1d8; font-size: 25px; }.neon-overlay p:not(.eyebrow) { max-width: 250px; margin: 0 0 20px; color: #9fb4bf; font-size: 11px; line-height: 1.6; }.neon-overlay .eyebrow { color: var(--teal); }
.neon-controls { display: grid; grid-template-columns: 1fr 86px 1fr; gap: 8px; margin-top: 10px; }.neon-control-button, .neon-pause-button { min-height: 46px; border: 1px solid var(--line-bright); border-radius: var(--radius-sm); color: var(--teal-soft); background: #122534; font-size: 23px; font-weight: 700; }.neon-control-button small { color: var(--muted); font-size: 9px; font-weight: 500; }.neon-pause-button { color: var(--gold-soft); font-size: 11px; }.neon-pause-button:disabled { cursor: not-allowed; opacity: .45; }.neon-control-button:active, .neon-pause-button:active { transform: scale(.97); }
.neon-footer { display: flex; justify-content: space-between; gap: 12px; margin-top: 13px; color: var(--muted); font-size: 10px; }.neon-replay-link { padding: 0; border: 0; color: var(--gold); background: transparent; font-size: 10px; }
@media (max-width: 380px) { .neon-drift-page { width: calc(100% - 20px); }.neon-canvas-wrap { min-height: 400px; }.neon-title h1 { font-size: 20px; }.neon-scoreboard strong { font-size: 17px; } }
</style>
