<script setup lang="ts">
// Variante A: lesen. Variante B: starten. p-Wert: subjektiv hoch — Feature, kein Zufall.
import { computed, onBeforeUnmount, ref } from 'vue'
import BlogTermHint from './BlogTermHint.vue'

type Phase = 'idle' | 'running' | 'ready' | 'analysis' | 'conclusion' | 'experience'

interface VariantMetrics {
  visitors: number
  clicks: number
  cr: number
  history: number[]
}

const DURATION_MS = 10_000
const TICK_MS = 80

/** Zielwerte nach 10s – B leicht überlegen, Chi²-signifikant */
const TARGET_A = { visitors: 4820, clicks: 312, cr: 6.47 }
const TARGET_B = { visitors: 4795, clicks: 368, cr: 7.68 }

const phase = ref<Phase>('idle')
const progress = ref(0)
const statusMessage = ref('Bereit für A/B-Simulation')

const metricsA = ref<VariantMetrics>({ visitors: 0, clicks: 0, cr: 0, history: [] })
const metricsB = ref<VariantMetrics>({ visitors: 0, clicks: 0, cr: 0, history: [] })

let rafId = 0
let startTs = 0
let lastTick = 0

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const showMetrics = computed(
  () =>
    phase.value === 'analysis' ||
    phase.value === 'conclusion' ||
    phase.value === 'experience',
)
const showConclusion = computed(
  () => phase.value === 'conclusion' || phase.value === 'experience',
)
const showExperience = computed(() => phase.value === 'experience')
const showWinnerFrame = computed(() => showConclusion.value)

const uplift = computed(() => {
  if (metricsA.value.cr <= 0) return 0
  return ((metricsB.value.cr - metricsA.value.cr) / metricsA.value.cr) * 100
})

const conversionsA = computed(() => Math.round(metricsA.value.clicks))
const conversionsB = computed(() => Math.round(metricsB.value.clicks))

const ctaLabel = computed(() => {
  switch (phase.value) {
    case 'idle':
      return 'Simulation starten'
    case 'running':
      return 'Läuft…'
    case 'ready':
      return 'Ergebnisse analysieren'
    case 'analysis':
      return 'Ergebnis / Fazit'
    case 'conclusion':
      return 'Warum dieses Ergebnis?'
    case 'experience':
      return 'Experience erklärt'
    default:
      return 'Simulation starten'
  }
})

const ctaDisabled = computed(
  () => phase.value === 'running' || phase.value === 'experience',
)

function formatNumber(n: number) {
  return new Intl.NumberFormat('de-DE').format(Math.round(n))
}

function formatCr(n: number) {
  return `${n.toFixed(2)}%`
}

function formatUplift(n: number) {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

function noise(scale: number) {
  return (Math.random() - 0.5) * 2 * scale
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

function sampleAt(t: number, target: typeof TARGET_A, bias = 1): VariantMetrics {
  const e = easeOutCubic(Math.min(1, Math.max(0, t)))
  const visitors = Math.max(0, target.visitors * e + noise(12 * bias))
  const clicks = Math.max(0, target.clicks * e + noise(2.2 * bias))
  const cr =
    visitors > 0
      ? Math.max(0, (clicks / visitors) * 100 + noise(0.08 * bias))
      : 0
  return { visitors, clicks, cr, history: [] }
}

function sparklinePath(history: number[], w: number, h: number): string {
  if (history.length < 2) return ''
  const min = Math.min(...history)
  const max = Math.max(...history)
  const range = max - min || 1
  const step = w / (history.length - 1)
  return history
    .map((v, i) => {
      const x = i * step
      const y = h - ((v - min) / range) * (h - 4) - 2
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

const sparkA = computed(() => sparklinePath(metricsA.value.history, 160, 36))
const sparkB = computed(() => sparklinePath(metricsB.value.history, 160, 36))

function pushHistory(a: VariantMetrics, b: VariantMetrics) {
  const histA = [...metricsA.value.history, a.cr]
  const histB = [...metricsB.value.history, b.cr]
  if (histA.length > 48) histA.shift()
  if (histB.length > 48) histB.shift()
  metricsA.value = { ...a, history: histA }
  metricsB.value = { ...b, history: histB }
}

function stopLoop() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}

function finishSimulation() {
  stopLoop()
  progress.value = 100
  metricsA.value = {
    visitors: TARGET_A.visitors,
    clicks: TARGET_A.clicks,
    cr: TARGET_A.cr,
    history: metricsA.value.history.length
      ? [...metricsA.value.history, TARGET_A.cr]
      : [TARGET_A.cr * 0.4, TARGET_A.cr * 0.7, TARGET_A.cr],
  }
  metricsB.value = {
    visitors: TARGET_B.visitors,
    clicks: TARGET_B.clicks,
    cr: TARGET_B.cr,
    history: metricsB.value.history.length
      ? [...metricsB.value.history, TARGET_B.cr]
      : [TARGET_B.cr * 0.4, TARGET_B.cr * 0.72, TARGET_B.cr],
  }
  phase.value = 'ready'
  statusMessage.value = 'Simulation abgeschlossen – Ergebnisse bereit zur Analyse'
}

function tick(now: number) {
  const elapsed = now - startTs
  const t = Math.min(1, elapsed / DURATION_MS)
  progress.value = t * 100

  if (now - lastTick >= TICK_MS || prefersReducedMotion()) {
    lastTick = now
    const a = sampleAt(t, TARGET_A, 1)
    const b = sampleAt(t, TARGET_B, 0.85)
    // B leicht performanter während des Streams
    b.cr = Math.max(b.cr, a.cr * (1.08 + t * 0.1) + noise(0.05))
    b.clicks = Math.max(b.clicks, (b.visitors * b.cr) / 100)
    pushHistory(a, b)
  }

  if (t >= 1) {
    finishSimulation()
    return
  }
  rafId = requestAnimationFrame(tick)
}

function startSimulation() {
  stopLoop()
  phase.value = 'running'
  progress.value = 0
  metricsA.value = { visitors: 0, clicks: 0, cr: 0, history: [] }
  metricsB.value = { visitors: 0, clicks: 0, cr: 0, history: [] }
  statusMessage.value = 'Daten werden gesammelt (Traffic-Stream läuft...)'
  startTs = performance.now()
  lastTick = 0

  if (prefersReducedMotion()) {
    // Kurzer Stream, dann Finale – ohne lange Animation
    const steps = 8
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const a = sampleAt(t, TARGET_A, 0.3)
      const b = sampleAt(t, TARGET_B, 0.25)
      b.cr = Math.max(b.cr, a.cr * (1.08 + t * 0.1))
      b.clicks = (b.visitors * b.cr) / 100
      pushHistory(a, b)
      progress.value = t * 100
    }
    finishSimulation()
    return
  }

  rafId = requestAnimationFrame(tick)
}

function analyze() {
  phase.value = 'analysis'
  statusMessage.value = 'Metriken ausgewertet – Fazit noch ausstehend'
}

function revealConclusion() {
  phase.value = 'conclusion'
  statusMessage.value =
    'Fazit: Variante B ist statistisch signifikanter Gewinner (Chi-Quadrat, p < 0.05)'
}

function revealExperience() {
  phase.value = 'experience'
  statusMessage.value = 'Experience-Blick: Warum B gewinnt – jenseits der Statistik'
}

function reset() {
  stopLoop()
  phase.value = 'idle'
  progress.value = 0
  metricsA.value = { visitors: 0, clicks: 0, cr: 0, history: [] }
  metricsB.value = { visitors: 0, clicks: 0, cr: 0, history: [] }
  statusMessage.value = 'Bereit für A/B-Simulation'
}

function onPrimaryClick() {
  if (phase.value === 'idle') startSimulation()
  else if (phase.value === 'ready') analyze()
  else if (phase.value === 'analysis') revealConclusion()
  else if (phase.value === 'conclusion') revealExperience()
}

onBeforeUnmount(stopLoop)
</script>

<template>
  <div class="ab-sim card-glow card-glow--emerald-cyan rounded-2xl w-full">
    <div
      class="glass-panel portfolio-card portfolio-card--emerald rounded-2xl w-full transition-colors duration-300"
      style="color: var(--text-primary)"
    >
      <!-- Header -->
      <div
        class="flex items-start justify-between gap-3 mb-5 pb-3"
        style="border-bottom: 1px solid var(--surface-border)"
      >
        <div>
          <h4 class="heading-display font-bold text-lg">A/B-Test Simulator</h4>
          <p class="text-xs mt-0.5" style="color: var(--text-muted)">
            Control vs. Challenger · Vue 3 Composition API
          </p>
        </div>
        <div
          class="badge badge-outline gap-1 text-[10px] font-mono shrink-0"
          style="border-color: var(--surface-border); color: var(--text-muted)"
        >
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="phase === 'running' ? 'bg-emerald-400 ab-sim__pulse' : 'bg-slate-500'"
          />
          {{ phase === 'running' ? 'Live' : 'Idle' }}
        </div>
      </div>

      <!-- Varianten -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <!-- A Control -->
        <article
          class="ab-sim__variant rounded-xl overflow-hidden"
          style="border: 1px solid var(--surface-border); background: var(--surface)"
        >
          <div
            class="px-3 py-1.5 flex items-center gap-x-2 text-[10px] font-mono uppercase tracking-wider"
            style="border-bottom: 1px solid var(--surface-border); color: var(--text-muted)"
          >
            <span class="shrink-0">A · Control</span>
          </div>
          <!-- Screenshot-Look: feste hell/weiß Chrome, theme-isoliert -->
          <div class="ab-sim__preview" data-appearance="light" style="color-scheme: light">
            <div class="ab-sim__hero p-4 sm:p-5">
              <p class="ab-sim__preview-eyebrow text-[10px] font-mono uppercase tracking-widest mb-2">
                Product
              </p>
              <h5 class="ab-sim__preview-title text-sm font-bold mb-1.5 leading-snug">
                Starte smarter.
              </h5>
              <p class="ab-sim__preview-copy text-[11px] mb-4 leading-relaxed">
                Klassischer Hero mit Standard-CTA.
              </p>
              <button
                type="button"
                tabindex="-1"
                aria-hidden="true"
                class="ab-sim__cta ab-sim__cta--blue text-xs font-semibold px-3.5 py-2 rounded-md"
              >
                Jetzt starten
              </button>
            </div>
          </div>

          <!-- Live metrics / Raw stream -->
          <div
            class="px-3 py-2.5 grid grid-cols-3 gap-2 text-center"
            style="border-top: 1px solid var(--surface-border)"
            :class="{ 'ab-sim__raw': phase === 'running' }"
          >
            <div>
              <p class="text-[9px] uppercase tracking-wider font-mono" style="color: var(--text-muted)">
                Besucher
              </p>
              <p class="font-mono text-xs mt-0.5 tabular-nums">
                {{ phase === 'idle' ? '—' : formatNumber(metricsA.visitors) }}
              </p>
            </div>
            <div>
              <p class="text-[9px] uppercase tracking-wider font-mono" style="color: var(--text-muted)">
                Klicks
              </p>
              <p class="font-mono text-xs mt-0.5 tabular-nums">
                {{ phase === 'idle' ? '—' : formatNumber(metricsA.clicks) }}
              </p>
            </div>
            <div>
              <p class="text-[9px] uppercase tracking-wider font-mono" style="color: var(--text-muted)">
                CR
              </p>
              <p class="font-mono text-xs mt-0.5 tabular-nums">
                {{ phase === 'idle' ? '—' : formatCr(metricsA.cr) }}
              </p>
            </div>
          </div>
        </article>

        <!-- B Challenger -->
        <article
          class="ab-sim__variant rounded-xl overflow-hidden"
          style="border: 1px solid var(--surface-border); background: var(--surface)"
        >
          <div
            class="px-3 py-1.5 flex items-center gap-x-2 text-[10px] font-mono uppercase tracking-wider"
            style="border-bottom: 1px solid var(--surface-border); color: var(--text-muted)"
          >
            <span class="shrink-0">B · Challenger</span>
          </div>
          <div
            class="ab-sim__preview"
            :class="{ 'ab-sim__preview--winner': showWinnerFrame }"
            data-appearance="light"
            style="color-scheme: light"
          >
            <div class="ab-sim__hero p-4 sm:p-5">
              <p class="ab-sim__preview-eyebrow text-[10px] font-mono uppercase tracking-widest mb-2">
                Product
              </p>
              <h5 class="ab-sim__preview-title text-sm font-bold mb-1.5 leading-snug">
                Starte smarter.
              </h5>
              <p class="ab-sim__preview-copy text-[11px] mb-4 leading-relaxed">
                Gleicher Hero, akzentuierter CTA.
              </p>
              <button
                type="button"
                tabindex="-1"
                aria-hidden="true"
                class="ab-sim__cta ab-sim__cta--green text-xs font-semibold px-3.5 py-2 rounded-md"
              >
                Jetzt starten
              </button>
            </div>
          </div>

          <div
            class="px-3 py-2.5 grid grid-cols-3 gap-2 text-center"
            style="border-top: 1px solid var(--surface-border)"
            :class="{ 'ab-sim__raw': phase === 'running' }"
          >
            <div>
              <p class="text-[9px] uppercase tracking-wider font-mono" style="color: var(--text-muted)">
                Besucher
              </p>
              <p class="font-mono text-xs mt-0.5 tabular-nums">
                {{ phase === 'idle' ? '—' : formatNumber(metricsB.visitors) }}
              </p>
            </div>
            <div>
              <p class="text-[9px] uppercase tracking-wider font-mono" style="color: var(--text-muted)">
                Klicks
              </p>
              <p class="font-mono text-xs mt-0.5 tabular-nums">
                {{ phase === 'idle' ? '—' : formatNumber(metricsB.clicks) }}
              </p>
            </div>
            <div>
              <p class="text-[9px] uppercase tracking-wider font-mono" style="color: var(--text-muted)">
                CR
              </p>
              <p class="font-mono text-xs mt-0.5 tabular-nums text-emerald-400/90">
                {{ phase === 'idle' ? '—' : formatCr(metricsB.cr) }}
              </p>
            </div>
          </div>
        </article>
      </div>

      <!-- Analyse: eigener Abschnitt unter den Varianten-Monitoren -->
      <section
        v-if="showMetrics"
        class="ab-sim__analysis mt-5 pt-5"
        aria-labelledby="ab-sim-analysis-heading"
      >
        <div class="flex items-baseline justify-between gap-3 mb-3">
          <h5
            id="ab-sim-analysis-heading"
            class="text-[11px] font-mono uppercase tracking-wider"
            style="color: var(--text-muted)"
          >
            Analyse
          </h5>
          <span class="text-[10px] font-mono" style="color: var(--text-muted)">
            CR-Verlauf · Finale Metriken
          </span>
        </div>

        <div
          class="ab-sim__analysis-panel rounded-xl overflow-hidden grid grid-cols-1 sm:grid-cols-2"
          style="border: 1px solid var(--surface-border); background: var(--surface)"
        >
          <!-- A Analyse -->
          <div class="ab-sim__analysis-col p-3 sm:p-4 space-y-2.5">
            <p class="text-[10px] font-mono uppercase tracking-wider" style="color: var(--text-muted)">
              A · Control
            </p>
            <svg
              class="w-full h-9"
              viewBox="0 0 160 36"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                :d="sparkA"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="opacity-50"
                style="color: var(--text-muted)"
              />
            </svg>
            <dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <dt style="color: var(--text-muted)">Finale CR</dt>
              <dd class="font-mono text-right tabular-nums">{{ formatCr(TARGET_A.cr) }}</dd>
              <dt style="color: var(--text-muted)">Conversions</dt>
              <dd class="font-mono text-right tabular-nums">{{ formatNumber(conversionsA) }}</dd>
            </dl>
          </div>

          <!-- B Analyse -->
          <div class="ab-sim__analysis-col p-3 sm:p-4 space-y-2.5">
            <p class="text-[10px] font-mono uppercase tracking-wider" style="color: var(--text-muted)">
              B · Challenger
            </p>
            <svg
              class="w-full h-9"
              viewBox="0 0 160 36"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                :d="sparkB"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-emerald-400/80"
              />
            </svg>
            <dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <dt style="color: var(--text-muted)">Finale CR</dt>
              <dd class="font-mono text-right tabular-nums text-emerald-400/90">
                {{ formatCr(TARGET_B.cr) }}
              </dd>
              <dt style="color: var(--text-muted)">Conversions</dt>
              <dd class="font-mono text-right tabular-nums">{{ formatNumber(conversionsB) }}</dd>
              <dt style="color: var(--text-muted)">Uplift</dt>
              <dd class="font-mono text-right tabular-nums text-emerald-400/90">
                {{ formatUplift(uplift) }}
              </dd>
            </dl>
          </div>
        </div>

        <!-- Fazit-Block -->
        <div
          v-if="showConclusion"
          class="ab-sim__conclusion mt-3 rounded-xl px-4 py-3 text-center"
          style="border: 1px solid color-mix(in srgb, #34d399 25%, var(--surface-border)); background: color-mix(in srgb, #34d399 6%, var(--surface))"
        >
          <p class="text-[10px] font-mono uppercase tracking-wider mb-1 text-emerald-400/80">
            Wissenschaftliches Ergebnis
          </p>
          <p class="text-sm font-semibold leading-snug" style="color: var(--text-primary)">
            Challenger B gewinnt signifikant
          </p>
          <p class="text-[11px] mt-1 leading-relaxed" style="color: var(--text-muted)">
            <BlogTermHint term-key="Chi-Quadrat" /> ·
            <BlogTermHint term-key="p" /> &lt; 0.05 ·
            <BlogTermHint term-key="Uplift" /> {{ formatUplift(uplift) }} gegenüber Control
          </p>
        </div>

        <!-- Experience-Statement -->
        <div
          v-if="showExperience"
          class="ab-sim__experience mt-3 rounded-xl px-4 py-3.5"
          style="border: 1px solid var(--surface-border); background: color-mix(in srgb, var(--surface) 88%, transparent)"
          role="region"
          aria-labelledby="ab-sim-experience-heading"
        >
          <p
            id="ab-sim-experience-heading"
            class="text-[10px] font-mono uppercase tracking-wider mb-1.5"
            style="color: var(--text-muted)"
          >
            Experience · Warum B gewinnt
          </p>
          <p class="text-sm leading-relaxed" style="color: var(--text-primary)">
            Hier unterscheidet sich nur die Button-Farbe – und genau dort greifen
            <BlogTermHint term-key="Semantik" /> und Aufmerksamkeit. Grün trägt kulturell oft die
            Bedeutung von „Go“, Bestätigung und Erfolg: Der
            <BlogTermHint term-key="CTA" /> signalisiert eher „fortfahren ist okay“ als neutrales
            Primärblau. Nach dem
            <BlogTermHint term-key="Von-Restorff-Effekt" />
            (<BlogTermHint term-key="Isolation Effect" />) hebt sich der akzentuierte Grünton
            stärker vom typischen Blau-UI-Muster ab und gewinnt dadurch
            <BlogTermHint term-key="Salienz" /> auf dem Hero-<BlogTermHint term-key="CTA" />.
            Dazu kommt eine Vertrauensheuristik im Sinne des
            <BlogTermHint term-key="Aesthetic-Usability Effect">Aesthetic-Usability Effects</BlogTermHint>:
            Das vertraute „Go“-Signal senkt Unsicherheit vor dem Klick. Das ist kein Naturgesetz
            „Grün schlägt Blau“ – in diesem Conversion-Kontext wirken
            <BlogTermHint term-key="Semantik" /> und
            <BlogTermHint term-key="Salienz" />
            zusammen; und genau das prüft man empirisch.
          </p>
        </div>
      </section>

      <!-- Controls -->
      <div class="mt-5 space-y-3">
        <div
          v-if="phase === 'running'"
          class="space-y-1.5"
          role="progressbar"
          :aria-valuenow="Math.round(progress)"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Simulationsfortschritt"
        >
          <div
            class="h-1 w-full rounded-full overflow-hidden"
            style="background: color-mix(in srgb, var(--surface-border) 80%, transparent)"
          >
            <div
              class="h-full rounded-full ab-sim__bar"
              :style="{ width: `${progress}%` }"
            />
          </div>
          <p class="text-[10px] font-mono text-center" style="color: var(--text-muted)">
            Raw Data Stream · {{ Math.round(progress) }}%
          </p>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            type="button"
            class="ab-sim__primary flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-45 disabled:cursor-not-allowed"
            :disabled="ctaDisabled"
            :aria-busy="phase === 'running'"
            @click="onPrimaryClick"
          >
            <svg
              v-if="phase === 'idle'"
              class="w-3.5 h-3.5"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M4 2.5v11l9-5.5-9-5.5z" />
            </svg>
            {{ ctaLabel }}
          </button>

          <button
            v-if="phase === 'analysis' || phase === 'ready' || phase === 'conclusion' || phase === 'experience'"
            type="button"
            class="text-xs px-3 py-2 rounded-lg transition-colors"
            style="color: var(--text-muted)"
            @click="reset"
          >
            Test zurücksetzen
          </button>
        </div>

        <p
          class="text-[11px] text-center leading-relaxed"
          style="color: var(--text-muted)"
          role="status"
          aria-live="polite"
        >
          {{ statusMessage }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Screenshot-Look: feste hell/weiß Chrome, unabhängig vom App-Theme */
.ab-sim__preview {
  color-scheme: light;
  background: #ffffff;
  color: #000000;
  isolation: isolate;
  box-sizing: border-box;
  transition: box-shadow 0.35s ease, outline-color 0.35s ease;
}

.ab-sim__preview--winner {
  outline: 2px solid #34d399;
  outline-offset: -2px;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #34d399 55%, transparent);
}

.ab-sim__preview .ab-sim__hero,
.ab-sim__hero {
  background: #ffffff;
  color: #000000;
}

.ab-sim__preview-eyebrow {
  color: #6b7280;
}

.ab-sim__preview-title {
  color: #000000;
}

.ab-sim__preview-copy {
  color: #4b5563;
}

.ab-sim__cta--blue {
  background: #2563eb;
  color: #ffffff;
}

.ab-sim__cta--green {
  background: #059669;
  color: #ffffff;
}

.ab-sim__primary {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
}

.ab-sim__primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent) 28%, transparent);
}

.ab-sim__bar {
  background: linear-gradient(90deg, var(--accent), #34d399);
  transition: width 80ms linear;
}

.ab-sim__raw {
  opacity: 0.55;
  filter: saturate(0.7);
}

.ab-sim__raw p.font-mono {
  font-variant-numeric: tabular-nums;
}

.ab-sim__analysis {
  border-top: 1px solid var(--surface-border);
  animation: ab-sim-fade 0.45s ease-out both;
}

.ab-sim__analysis-col:first-child {
  border-bottom: 1px solid var(--surface-border);
}

@media (min-width: 640px) {
  .ab-sim__analysis-col:first-child {
    border-bottom: none;
    border-right: 1px solid var(--surface-border);
  }
}

.ab-sim__conclusion,
.ab-sim__experience {
  animation: ab-sim-fade 0.45s ease-out both;
}

.ab-sim__pulse {
  animation: ab-sim-pulse 1.4s ease-in-out infinite;
}

@keyframes ab-sim-fade {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ab-sim-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ab-sim__analysis,
  .ab-sim__conclusion,
  .ab-sim__experience {
    animation: none;
  }
  .ab-sim__preview {
    transition: none;
  }
  .ab-sim__pulse {
    animation: none;
  }
  .ab-sim__bar {
    transition: none;
  }
}
</style>
