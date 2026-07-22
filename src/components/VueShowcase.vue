<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import TermHint from './TermHint.vue'
import { getAnalyticsSettings, setAnalyticsSettings } from '../lib/analyticsSettingsStore'

const initial = getAnalyticsSettings()
const traffic = ref(initial.traffic)
const conversionRate = ref(initial.conversionRate)
const avgOrderValue = ref(initial.avgOrderValue)
const uxLift = ref(initial.uxLift)

watch(
  [traffic, conversionRate, avgOrderValue, uxLift],
  () => {
    setAnalyticsSettings({
      traffic: traffic.value,
      conversionRate: conversionRate.value,
      avgOrderValue: avgOrderValue.value,
      uxLift: uxLift.value,
    })
  },
  { immediate: true, flush: 'sync' },
)

function pushSettings() {
  setAnalyticsSettings({
    traffic: traffic.value,
    conversionRate: conversionRate.value,
    avgOrderValue: avgOrderValue.value,
    uxLift: uxLift.value,
  })
}

const currentConversions = computed(() => {
  return Math.round((traffic.value * conversionRate.value) / 100)
})

const currentRevenue = computed(() => {
  return currentConversions.value * avgOrderValue.value
})

const optimizedConversionRate = computed(() => {
  const rate = conversionRate.value * (1 + uxLift.value / 100)
  return parseFloat(rate.toFixed(2))
})

const optimizedConversions = computed(() => {
  return Math.round((traffic.value * optimizedConversionRate.value) / 100)
})

const optimizedRevenue = computed(() => {
  return optimizedConversions.value * avgOrderValue.value
})

const incrementalRevenue = computed(() => {
  return optimizedRevenue.value - currentRevenue.value
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val)
}

const formatNumber = (val: number) => {
  return new Intl.NumberFormat('de-DE').format(val)
}
</script>

<template>
  <div class="card-glow card-glow--violet-fuchsia rounded-2xl w-full">
    <div class="glass-panel portfolio-card portfolio-card--violet rounded-2xl w-full text-slate-100 transition-all duration-300">
      <div class="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div>
          <h4 class="heading-display font-bold text-lg">
            Vue.js Micro-Frontend
          </h4>
          <p class="text-xs text-slate-400">Gesteuert über Vue 3 Composition API</p>
        </div>
        <div class="badge badge-secondary badge-outline gap-1 text-xs">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Vue Aktiv
        </div>
      </div>

      <h3 class="heading-section text-xl font-bold mb-4">
        <TermHint glossary-key="uxLift">UX-LIFT & UMSATZ-RECHNER</TermHint>
      </h3>

      <div class="vue-showcase-layout flex flex-col gap-5">
        <div class="space-y-4 min-w-0">
          <div>
            <label class="label pb-1">
              <TermHint glossary-key="traffic" class="label-text text-slate-300 text-xs">
                Monatlicher Traffic (Besucher)
              </TermHint>
              <span class="label-text-alt text-cyan-400 font-mono text-xs">{{ formatNumber(traffic) }}</span>
            </label>
            <input type="range" min="1000" max="100000" step="1000" v-model.number="traffic" class="range range-primary range-xs" @input="pushSettings" />
          </div>

          <div>
            <label class="label pb-1">
              <TermHint glossary-key="conversionRate" class="label-text text-slate-300 text-xs">
                Aktuelle Conversion-Rate (%)
              </TermHint>
              <span class="label-text-alt text-cyan-400 font-mono text-xs">{{ conversionRate }}%</span>
            </label>
            <input type="range" min="0.1" max="10" step="0.1" v-model.number="conversionRate" class="range range-primary range-xs" @input="pushSettings" />
          </div>

          <div>
            <label class="label pb-1">
              <TermHint glossary-key="avgOrderValue" class="label-text text-slate-300 text-xs">
                Durchschnittlicher Warenkorb (€)
              </TermHint>
              <span class="label-text-alt text-cyan-400 font-mono text-xs">{{ avgOrderValue }} €</span>
            </label>
            <input type="range" min="5" max="250" step="5" v-model.number="avgOrderValue" class="range range-primary range-xs" @input="pushSettings" />
          </div>

          <div>
            <label class="label pb-1">
              <TermHint glossary-key="uxLift" class="label-text text-slate-300 text-xs">
                Erwarteter UX-Design Lift (%)
              </TermHint>
              <span class="label-text-alt text-violet-400 font-mono text-xs font-bold">+{{ uxLift }}%</span>
            </label>
            <input type="range" min="5" max="100" step="5" v-model.number="uxLift" class="range range-secondary range-xs" @input="pushSettings" />
          </div>
        </div>

        <div class="card-glow card-glow--compact card-glow--cyan-violet rounded-xl min-w-0">
          <div class="glass-panel portfolio-card portfolio-card-sm rounded-xl flex flex-col justify-between transition-all duration-300">
            <div class="space-y-3">
              <div class="flex justify-between items-center text-xs">
                <span class="text-slate-400">Aktueller Umsatz:</span>
                <span class="font-mono text-slate-300">{{ formatCurrency(currentRevenue) }} / Monat</span>
              </div>

              <div class="flex justify-between items-center text-xs">
                <span class="text-slate-400">Optimierte Conversion Rate:</span>
                <span class="font-mono text-emerald-400 font-semibold">{{ optimizedConversionRate }}%</span>
              </div>

              <div class="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                <span class="text-slate-400">Optimierte Conversions:</span>
                <span class="font-mono text-slate-300">{{ formatNumber(optimizedConversions) }} (+{{ optimizedConversions - currentConversions }})</span>
              </div>
            </div>

            <div class="mt-4 pt-4 border-t border-slate-800 text-center">
              <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Zusätzlicher Umsatz durch UX-Optimierung</p>
              <p class="heading-display text-3xl font-black font-mono animate-pulse">
                +{{ formatCurrency(incrementalRevenue) }}
              </p>
              <p class="text-[10px] text-slate-500 mt-1">
                *Berechnet basierend auf statistischen
                <TermHint glossary-key="cro" placement="tooltip-top">CRO</TermHint>-Durchschnittswerten
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
