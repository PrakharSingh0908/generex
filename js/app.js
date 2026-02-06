/**
 * Generex — Generative Topographic Art Creator
 * Particles follow noise-based flow fields to create organic brand visuals.
 */

// ── Color Palettes ──────────────────────────────────────────────────────────
const PALETTES = [
  {
    name: 'Neural',
    colors: ['#4ECDC4', '#FF6B6B', '#FFE66D', '#95E862', '#F4A261']
  },
  {
    name: 'Ocean',
    colors: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#48CAE4']
  },
  {
    name: 'Sunset',
    colors: ['#FF6B6B', '#FFA07A', '#FFD93D', '#FF8E72', '#C44569']
  },
  {
    name: 'Neon',
    colors: ['#00F5D4', '#00BBF9', '#FEE440', '#F15BB5', '#9B5DE5']
  },
  {
    name: 'Mono',
    colors: ['#FFFFFF', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#F5F5F5']
  },
  {
    name: 'Earth',
    colors: ['#D4A373', '#CCD5AE', '#FAEDCD', '#E9EDC9', '#A3B18A']
  },
  {
    name: 'Aurora',
    colors: ['#7400B8', '#6930C3', '#5390D9', '#4EA8DE', '#48BFE3']
  },
  {
    name: 'Ember',
    colors: ['#FFBA08', '#FAA307', '#F48C06', '#E85D04', '#DC2F02']
  }
];

// ── Utility ─────────────────────────────────────────────────────────────────
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Main Application ────────────────────────────────────────────────────────
class GenerexApp {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');

    this.params = {
      seed: Math.floor(Math.random() * 100000),
      scale: 0.003,
      octaves: 4,
      persistence: 0.5,
      particleCount: 10000,
      particleSize: 1.5,
      speed: 1.5,
      opacity: 0.75,
      fadeTrails: false,
      fadeAmount: 0.02,
      paletteIndex: 0,
      canvasWidth: 1920,
      canvasHeight: 1080,
      bgMode: 'black'
    };

    this.particles = [];
    this.flowField = [];
    this.cellSize = 5;
    this.cols = 0;
    this.rows = 0;
    this.running = true;
    this.frameCount = 0;
    this.animId = null;

    this.init();
  }

  init() {
    this.setupCanvas();
    this.buildPaletteUI();
    this.bindControls();
    this.syncControlsToUI();
    this.generate();
    this.animate();
  }

  // ── Canvas ──────────────────────────────────────────────────────────────
  setupCanvas() {
    this.canvas.width = this.params.canvasWidth;
    this.canvas.height = this.params.canvasHeight;
    this.cols = Math.ceil(this.canvas.width / this.cellSize);
    this.rows = Math.ceil(this.canvas.height / this.cellSize);
  }

  clearCanvas() {
    if (this.params.bgMode === 'black') {
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  // ── Flow Field ──────────────────────────────────────────────────────────
  computeFlowField() {
    const noise = new SimplexNoise(this.params.seed);
    const total = this.cols * this.rows;
    this.flowField = new Float32Array(total);

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const px = x * this.cellSize;
        const py = y * this.cellSize;
        const n = noise.fbm(
          px * this.params.scale,
          py * this.params.scale,
          this.params.octaves,
          this.params.persistence
        );
        this.flowField[x + y * this.cols] = n * Math.PI * 2;
      }
    }
  }

  // ── Particles ───────────────────────────────────────────────────────────
  createParticles() {
    const palette = PALETTES[this.params.paletteIndex].colors;
    const count = this.params.particleCount;
    this.particles = new Array(count);

    for (let i = 0; i < count; i++) {
      this.particles[i] = this.spawnParticle(palette);
    }
  }

  spawnParticle(palette) {
    const life = 60 + Math.floor(Math.random() * 260);
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      colorIndex: Math.floor(Math.random() * palette.length),
      size: this.params.particleSize * (0.4 + Math.random() * 0.8),
      life: life,
      maxLife: life
    };
  }

  // ── Generate ────────────────────────────────────────────────────────────
  generate() {
    this.setupCanvas();
    this.computeFlowField();
    this.createParticles();
    this.clearCanvas();
    this.frameCount = 0;
    this.updateFrameCounter();
  }

  // ── Animation Loop ──────────────────────────────────────────────────────
  animate() {
    if (this.running) {
      const ctx = this.ctx;
      const palette = PALETTES[this.params.paletteIndex].colors;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const speed = this.params.speed;
      const cellSize = this.cellSize;
      const cols = this.cols;
      const rows = this.rows;
      const flowField = this.flowField;

      // Optional fade trails
      if (this.params.fadeTrails) {
        ctx.fillStyle = `rgba(0,0,0,${this.params.fadeAmount})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Update particles
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const col = Math.floor(p.x / cellSize);
        const row = Math.floor(p.y / cellSize);

        if (col >= 0 && col < cols && row >= 0 && row < rows) {
          const angle = flowField[col + row * cols];
          p.x += Math.cos(angle) * speed;
          p.y += Math.sin(angle) * speed;
        }

        p.life--;

        if (p.life <= 0 || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) {
          const respawned = this.spawnParticle(palette);
          this.particles[i] = respawned;
        }
      }

      // Draw particles — batched by color for performance
      for (let c = 0; c < palette.length; c++) {
        ctx.fillStyle = hexToRgba(palette[c], this.params.opacity);
        ctx.beginPath();

        for (let i = 0; i < this.particles.length; i++) {
          const p = this.particles[i];
          if (p.colorIndex !== c) continue;
          ctx.moveTo(p.x + p.size, p.y);
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }

        ctx.fill();
      }

      this.frameCount++;
      if (this.frameCount % 30 === 0) this.updateFrameCounter();
    }

    this.animId = requestAnimationFrame(() => this.animate());
  }

  updateFrameCounter() {
    const el = document.getElementById('frameCount');
    if (el) el.textContent = this.frameCount;
  }

  // ── Controls ────────────────────────────────────────────────────────────
  buildPaletteUI() {
    const container = document.getElementById('palettes');
    container.innerHTML = '';

    PALETTES.forEach((pal, index) => {
      const option = document.createElement('div');
      option.className = 'palette-option' + (index === this.params.paletteIndex ? ' selected' : '');
      option.dataset.index = index;

      const swatches = document.createElement('div');
      swatches.className = 'palette-swatches';
      pal.colors.forEach(color => {
        const dot = document.createElement('span');
        dot.className = 'swatch';
        dot.style.backgroundColor = color;
        swatches.appendChild(dot);
      });

      const name = document.createElement('span');
      name.className = 'palette-name';
      name.textContent = pal.name;

      option.appendChild(swatches);
      option.appendChild(name);
      container.appendChild(option);

      option.addEventListener('click', () => {
        container.querySelectorAll('.palette-option').forEach(el => el.classList.remove('selected'));
        option.classList.add('selected');
        this.params.paletteIndex = index;
        // Recolor existing particles
        const palette = PALETTES[index].colors;
        for (let i = 0; i < this.particles.length; i++) {
          this.particles[i].colorIndex = Math.floor(Math.random() * palette.length);
        }
      });
    });
  }

  syncControlsToUI() {
    document.getElementById('seed').value = this.params.seed;
    document.getElementById('scale').value = this.params.scale;
    document.getElementById('scaleVal').textContent = this.params.scale;
    document.getElementById('octaves').value = this.params.octaves;
    document.getElementById('octavesVal').textContent = this.params.octaves;
    document.getElementById('count').value = this.params.particleCount;
    document.getElementById('countVal').textContent = this.params.particleCount.toLocaleString();
    document.getElementById('size').value = this.params.particleSize;
    document.getElementById('sizeVal').textContent = this.params.particleSize;
    document.getElementById('speed').value = this.params.speed;
    document.getElementById('speedVal').textContent = this.params.speed;
    document.getElementById('opacity').value = this.params.opacity;
    document.getElementById('opacityVal').textContent = this.params.opacity;
    document.getElementById('fadeTrails').checked = this.params.fadeTrails;
    document.getElementById('fadeAmount').value = this.params.fadeAmount;
    document.getElementById('fadeAmountVal').textContent = this.params.fadeAmount;
    document.getElementById('canvasSize').value = `${this.params.canvasWidth}x${this.params.canvasHeight}`;
    document.getElementById('bgMode').value = this.params.bgMode;
  }

  bindControls() {
    const $ = id => document.getElementById(id);
    let regenTimer;
    const scheduleRegen = () => {
      clearTimeout(regenTimer);
      regenTimer = setTimeout(() => this.generate(), 250);
    };

    // Seed
    $('seed').addEventListener('change', e => {
      this.params.seed = parseInt(e.target.value) || 0;
      scheduleRegen();
    });

    $('randomSeed').addEventListener('click', () => {
      this.params.seed = Math.floor(Math.random() * 100000);
      $('seed').value = this.params.seed;
      this.generate();
    });

    // Flow field — requires regeneration
    $('scale').addEventListener('input', e => {
      this.params.scale = parseFloat(e.target.value);
      $('scaleVal').textContent = this.params.scale;
      scheduleRegen();
    });

    $('octaves').addEventListener('input', e => {
      this.params.octaves = parseInt(e.target.value);
      $('octavesVal').textContent = this.params.octaves;
      scheduleRegen();
    });

    // Particles — live update
    $('count').addEventListener('input', e => {
      const newCount = parseInt(e.target.value);
      $('countVal').textContent = newCount.toLocaleString();
      this.params.particleCount = newCount;
      const palette = PALETTES[this.params.paletteIndex].colors;
      while (this.particles.length < newCount) {
        this.particles.push(this.spawnParticle(palette));
      }
      if (this.particles.length > newCount) {
        this.particles.length = newCount;
      }
    });

    $('size').addEventListener('input', e => {
      this.params.particleSize = parseFloat(e.target.value);
      $('sizeVal').textContent = this.params.particleSize;
    });

    $('speed').addEventListener('input', e => {
      this.params.speed = parseFloat(e.target.value);
      $('speedVal').textContent = this.params.speed;
    });

    $('opacity').addEventListener('input', e => {
      this.params.opacity = parseFloat(e.target.value);
      $('opacityVal').textContent = this.params.opacity;
    });

    // Fade trails
    $('fadeTrails').addEventListener('change', e => {
      this.params.fadeTrails = e.target.checked;
      document.getElementById('fadeControls').style.display = e.target.checked ? 'block' : 'none';
    });

    $('fadeAmount').addEventListener('input', e => {
      this.params.fadeAmount = parseFloat(e.target.value);
      $('fadeAmountVal').textContent = this.params.fadeAmount;
    });

    // Canvas size — requires regeneration
    $('canvasSize').addEventListener('change', e => {
      const [w, h] = e.target.value.split('x').map(Number);
      this.params.canvasWidth = w;
      this.params.canvasHeight = h;
      this.generate();
    });

    // Background
    $('bgMode').addEventListener('change', e => {
      this.params.bgMode = e.target.value;
      this.generate();
    });

    // Action buttons
    $('regenerate').addEventListener('click', () => this.generate());

    $('pause').addEventListener('click', () => {
      this.running = !this.running;
      $('pause').textContent = this.running ? 'Pause' : 'Play';
      $('pause').classList.toggle('paused', !this.running);
    });

    $('clear').addEventListener('click', () => {
      this.clearCanvas();
      this.frameCount = 0;
      this.updateFrameCounter();
    });

    $('exportPng').addEventListener('click', () => this.exportPNG());
    $('exportSvg').addEventListener('click', () => this.exportSVG());
  }

  // ── Export ──────────────────────────────────────────────────────────────
  exportPNG() {
    const link = document.createElement('a');
    link.download = `generex-${this.params.seed}-${this.params.canvasWidth}x${this.params.canvasHeight}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }

  exportSVG() {
    // Capture current canvas state as an embedded image SVG
    // This preserves full quality and is editable in Figma
    const w = this.canvas.width;
    const h = this.canvas.height;
    const dataUrl = this.canvas.toDataURL('image/png');
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <image width="${w}" height="${h}" xlink:href="${dataUrl}"/>
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = `generex-${this.params.seed}-${w}x${h}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.app = new GenerexApp();
});
