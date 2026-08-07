<script setup lang="ts">
// Bundle-Größe ist selten ein Feature — außer hier, wo sie absichtlich das Feature ist.
import { computed, ref } from 'vue'
import BlogTermHint from './BlogTermHint.vue'

/** Defaults: mittelgroßes Bundle, moderate Latenz, unoptimierte Bilder */
const bundleKb = ref(850)
const latencyMs = ref(280)
const imageOpt = ref(15) // 0 = unkomprimiert, 100 = WebP/Modern
const showWhy = ref(false)

const BUNDLE_MIN = 100
const BUNDLE_MAX = 5120

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function formatBundle(kb: number) {
  if (kb >= 1024) return `${(kb / 1024).toFixed(kb >= 2048 ? 1 : 2)} MB`
  return `${Math.round(kb)} KB`
}

function formatMs(ms: number) {
  return `${Math.round(ms)} ms`
}

function formatSec(s: number) {
  return `${s.toFixed(1)} s`
}

function formatPct(n: number) {
  return `${n.toFixed(0)} %`
}

/** Geschätzte Ladezeit aus Bundle, TTFB und Bildgewicht */
const loadTimeSec = computed(() => {
  const ttfb = latencyMs.value / 1000
  // ~0,85 s Download+Parse je MB JS (vereinfachtes Modell)
  const jsCost = (bundleKb.value / 1024) * 0.85
  // Unkomprimiert ~2,4 s Extra, WebP/Modern ~0,35 s
  const imageCost = 2.4 - (imageOpt.value / 100) * 2.05
  // Latenz verstärkt nachgelagerte Requests leicht
  const cascade = ttfb * 0.35
  return clamp(ttfb + jsCost + imageCost + cascade, 0.4, 18)
})

const lighthouseScore = computed(() => {
  const bundlePenalty = ((bundleKb.value - BUNDLE_MIN) / (BUNDLE_MAX - BUNDLE_MIN)) * 42
  const latencyPenalty = ((latencyMs.value - 50) / 950) * 28
  const imagePenalty = (1 - imageOpt.value / 100) * 18
  // Ladezeit ab 2,5 s zusätzlich bestrafen
  const loadPenalty = Math.max(0, loadTimeSec.value - 2.5) * 6
  return Math.round(clamp(100 - bundlePenalty - latencyPenalty - imagePenalty - loadPenalty, 0, 100))
})

/** Bounce steigt ab ~2,5 s exponentiell */
const bounceRate = computed(() => {
  const t = loadTimeSec.value
  const base = 18
  const delay = Math.max(0, t - 2.5)
  const exponential = Math.pow(delay, 1.65) * 9.5
  const earlyBump = t < 2.5 ? (t / 2.5) * 6 : 6
  return clamp(base + earlyBump + exponential, 18, 92)
})

const frustration = computed(() => {
  // 0–100 Frust-Meter, gekoppelt an Bounce und Ladezeit
  const fromBounce = ((bounceRate.value - 18) / (92 - 18)) * 85
  const fromLoad = clamp(((loadTimeSec.value - 1) / 8) * 100, 0, 100)
  return Math.round(clamp(fromBounce * 0.65 + fromLoad * 0.35, 0, 100))
})

type StatusTone = 'good' | 'ok' | 'bad'

const status = computed((): StatusTone => {
  if (lighthouseScore.value >= 85 && loadTimeSec.value < 2.5) return 'good'
  if (lighthouseScore.value >= 50 && loadTimeSec.value < 4.5) return 'ok'
  return 'bad'
})

const statusLabel = computed(() => {
  switch (status.value) {
    case 'good':
      return 'Gut'
    case 'ok':
      return 'Kritisch'
    default:
      return 'Schlecht'
  }
})

const statusColor = computed(() => {
  switch (status.value) {
    case 'good':
      return '#34d399'
    case 'ok':
      return '#fbbf24'
    default:
      return '#f87171'
  }
})

/** Bounce-Kurve für SVG (Ladezeit 0–10 s → Bounce) */
const bounceCurvePath = computed(() => {
  const w = 200
  const h = 64
  const points: string[] = []
  for (let i = 0; i <= 40; i++) {
    const t = (i / 40) * 10
    const delay = Math.max(0, t - 2.5)
    const bounce = clamp(18 + (t < 2.5 ? (t / 2.5) * 6 : 6) + Math.pow(delay, 1.65) * 9.5, 18, 92)
    const x = (i / 40) * w
    const y = h - ((bounce - 18) / (92 - 18)) * (h - 4) - 2
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return points.join(' ')
})

const markerX = computed(() => clamp((loadTimeSec.value / 10) * 200, 0, 200))
const markerY = computed(() => {
  const h = 64
  return h - ((bounceRate.value - 18) / (92 - 18)) * (h - 4) - 2
})

const imageOptLabel = computed(() => {
  if (imageOpt.value < 30) return 'Unkomprimiert'
  if (imageOpt.value < 70) return 'Teilweise'
  return 'WebP / Modern'
})
</script>

<template>
  <div class="perf-sim card-glow card-glow--cyan-teal rounded-2xl w-full">
    <div
      class="glass-panel portfolio-card portfolio-card--cyan rounded-2xl w-full transition-colors duration-300"
      style="color: var(--text-primary)"
    >
      <!-- Header -->
      <div
        class="flex items-start justify-between gap-3 mb-5 pb-3"
        style="border-bottom: 1px solid var(--surface-border)"
      >
        <div>
          <h4 class="heading-display font-bold text-lg">Performance & Speed-Impact</h4>
          <p class="text-xs mt-0.5" style="color: var(--text-muted)">
            Bundle · Latenz · Bilder → Core Web Vitals & Bounce
          </p>
        </div>
        <div
          class="badge badge-outline gap-1.5 text-[10px] font-mono shrink-0"
          :style="{ borderColor: statusColor, color: statusColor }"
        >
          <span
            class="w-1.5 h-1.5 rounded-full"
            :style="{ background: statusColor }"
          />
          {{ statusLabel }}
        </div>
      </div>

      <div class="perf-sim__layout grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
        <!-- Regler -->
        <div class="space-y-4 min-w-0">
          <p
            class="text-[10px] font-mono uppercase tracking-wider"
            style="color: var(--text-muted)"
          >
            Steuerung
          </p>

          <div>
            <label class="label pb-1">
              <span class="label-text text-xs" style="color: var(--text-muted)">
                JS-Bundle-Größe
              </span>
              <span class="label-text-alt font-mono text-xs text-cyan-400">
                {{ formatBundle(bundleKb) }}
              </span>
            </label>
            <input
              v-model.number="bundleKb"
              type="range"
              :min="BUNDLE_MIN"
              :max="BUNDLE_MAX"
              step="50"
              class="range range-primary range-xs"
              aria-label="JS-Bundle-Größe"
            />
            <div
              class="flex justify-between text-[9px] font-mono mt-1"
              style="color: var(--text-muted)"
            >
              <span>100 KB</span>
              <span>5 MB</span>
            </div>
          </div>

          <div>
            <label class="label pb-1">
              <span class="label-text text-xs" style="color: var(--text-muted)">
                Netzwerk-Latenz / TTFB
              </span>
              <span class="label-text-alt font-mono text-xs text-cyan-400">
                {{ formatMs(latencyMs) }}
              </span>
            </label>
            <input
              v-model.number="latencyMs"
              type="range"
              min="50"
              max="1000"
              step="10"
              class="range range-primary range-xs"
              aria-label="Netzwerk-Latenz TTFB"
            />
            <div
              class="flex justify-between text-[9px] font-mono mt-1"
              style="color: var(--text-muted)"
            >
              <span>50 ms</span>
              <span>1000 ms</span>
            </div>
          </div>

          <div>
            <label class="label pb-1">
              <span class="label-text text-xs" style="color: var(--text-muted)">
                Bildoptimierung
              </span>
              <span class="label-text-alt font-mono text-xs text-teal-400">
                {{ imageOptLabel }}
              </span>
            </label>
            <input
              v-model.number="imageOpt"
              type="range"
              min="0"
              max="100"
              step="5"
              class="range range-secondary range-xs"
              aria-label="Bildoptimierung"
            />
            <div
              class="flex justify-between text-[9px] font-mono mt-1"
              style="color: var(--text-muted)"
            >
              <span>Unkomprimiert</span>
              <span>WebP / Modern</span>
            </div>
          </div>
        </div>

        <!-- Live-Auswertung -->
        <div class="min-w-0 space-y-3">
          <p
            class="text-[10px] font-mono uppercase tracking-wider"
            style="color: var(--text-muted)"
          >
            Live-Auswertung
          </p>

          <div
            class="rounded-xl p-4 space-y-4"
            style="border: 1px solid var(--surface-border); background: var(--surface)"
          >
            <!-- Lighthouse + Ladezeit -->
            <div class="grid grid-cols-2 gap-3">
              <div class="text-center">
                <p class="text-[9px] uppercase tracking-wider font-mono" style="color: var(--text-muted)">
                  Lighthouse
                </p>
                <p
                  class="heading-display text-3xl font-black font-mono tabular-nums mt-1 transition-colors duration-300"
                  :style="{ color: statusColor }"
                >
                  {{ lighthouseScore }}
                </p>
                <p class="text-[9px] font-mono mt-0.5" style="color: var(--text-muted)">Score</p>
              </div>
              <div class="text-center">
                <p class="text-[9px] uppercase tracking-wider font-mono" style="color: var(--text-muted)">
                  Ladezeit
                </p>
                <p
                  class="heading-display text-3xl font-black font-mono tabular-nums mt-1 transition-colors duration-300"
                  :style="{ color: statusColor }"
                >
                  {{ formatSec(loadTimeSec) }}
                </p>
                <p class="text-[9px] font-mono mt-0.5" style="color: var(--text-muted)">geschätzt</p>
              </div>
            </div>

            <!-- Frust-Meter -->
            <div>
              <div class="flex justify-between items-baseline mb-1.5">
                <span class="text-[10px] font-mono uppercase tracking-wider" style="color: var(--text-muted)">
                  Frust-Meter
                </span>
                <span class="text-xs font-mono tabular-nums" :style="{ color: statusColor }">
                  {{ frustration }} / 100
                </span>
              </div>
              <div
                class="h-2 w-full rounded-full overflow-hidden"
                style="background: color-mix(in srgb, var(--surface-border) 80%, transparent)"
                role="meter"
                :aria-valuenow="frustration"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="Frust-Meter"
              >
                <div
                  class="h-full rounded-full perf-sim__frust-bar transition-[width,background] duration-200"
                  :style="{ width: `${frustration}%`, background: statusColor }"
                />
              </div>
            </div>

            <!-- Bounce -->
            <div>
              <div class="flex justify-between items-baseline mb-1.5">
                <span class="text-[10px] font-mono uppercase tracking-wider" style="color: var(--text-muted)">
                  Bounce-Rate
                </span>
                <span class="text-xs font-mono tabular-nums font-semibold" :style="{ color: statusColor }">
                  {{ formatPct(bounceRate) }}
                </span>
              </div>
              <svg
                class="w-full h-16"
                viewBox="0 0 200 64"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <!-- 2,5-s-Schwelle -->
                <line
                  x1="50"
                  y1="0"
                  x2="50"
                  y2="64"
                  stroke="currentColor"
                  stroke-width="1"
                  stroke-dasharray="3 3"
                  class="opacity-30"
                  style="color: var(--text-muted)"
                />
                <path
                  :d="bounceCurvePath"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="opacity-70"
                  :style="{ color: statusColor }"
                />
                <circle
                  :cx="markerX"
                  :cy="markerY"
                  r="4"
                  :fill="statusColor"
                  class="perf-sim__marker"
                />
              </svg>
              <div
                class="flex justify-between text-[9px] font-mono mt-0.5"
                style="color: var(--text-muted)"
              >
                <span>0 s</span>
                <span>~2,5 s</span>
                <span>10 s</span>
              </div>
            </div>
          </div>

          <p class="text-[11px] leading-relaxed" style="color: var(--text-muted)">
            Code-Effizienz und Bildgewicht bestimmen Ladezeit und Core Web Vitals —
            ab ~2,5&nbsp;s steigt die Bounce-Rate exponentiell und frisst Conversion.
          </p>
        </div>
      </div>

      <!-- Experience: Warum ist das so? -->
      <div class="mt-5 space-y-3">
        <div
          v-if="showWhy"
          id="perf-sim-experience"
          class="perf-sim__experience rounded-xl px-4 py-3.5"
          style="border: 1px solid var(--surface-border); background: color-mix(in srgb, var(--surface) 88%, transparent)"
          role="region"
          aria-labelledby="perf-sim-experience-heading"
        >
          <p
            id="perf-sim-experience-heading"
            class="text-[10px] font-mono uppercase tracking-wider mb-1.5"
            style="color: var(--text-muted)"
          >
            Experience · Warum Wartezeit Conversion frisst
          </p>
          <p class="text-sm leading-relaxed" style="color: var(--text-primary)">
            Wartezeiten sind fatal: Geduld schrumpft, Vertrauen bricht, Frust steigt – und die Seite
            wirkt schnell „kaputt“ oder egal. Unter ~400&nbsp;ms (
            <BlogTermHint term-key="Doherty Threshold" />) fühlt sich Interaktion „instant“ an;
            für den Full-Page-Load liegt die Schwelle des Annehmbaren eher bei 2–3&nbsp;Sekunden.
            Genau dort – ab ~2,5&nbsp;s – knickt im Simulator die
            <BlogTermHint term-key="Bounce-Rate" /> hoch; das deckt sich mit dem, was Google und
            UX-Forschung seit Jahren messen. Verhindert man das von Anfang an:
            <BlogTermHint term-key="Bundle" /> klein halten, Bilder modern (
            <BlogTermHint term-key="WebP" />), Latenz/<BlogTermHint term-key="TTFB" /> im Griff,
            <BlogTermHint term-key="Core Web Vitals" /> als Design-Anforderung – und
            <BlogTermHint term-key="Lighthouse" /> als Frühwarnung, nicht als Afterthought nach dem
            Launch.
          </p>
        </div>

        <button
          type="button"
          class="perf-sim__why w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-45 disabled:cursor-not-allowed"
          :disabled="showWhy"
          :aria-expanded="showWhy"
          aria-controls="perf-sim-experience"
          @click="showWhy = true"
        >
          {{ showWhy ? 'Experience erklärt' : 'Warum ist das so?' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perf-sim__marker {
  transition: cx 0.15s ease, cy 0.15s ease;
}

.perf-sim__why {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
}

.perf-sim__why:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent) 28%, transparent);
}

.perf-sim__experience {
  animation: perf-sim-fade 0.45s ease-out both;
}

@keyframes perf-sim-fade {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .perf-sim__frust-bar,
  .perf-sim__marker {
    transition: none;
  }
  .perf-sim__experience {
    animation: none;
  }
}
</style>
