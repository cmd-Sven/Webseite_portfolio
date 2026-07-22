<script setup lang="ts">
import { computed } from 'vue'
import { ANALYTICS_GLOSSARY, type AnalyticsGlossaryKey } from '../data/analyticsGlossary'

const props = withDefaults(
  defineProps<{
    glossaryKey: AnalyticsGlossaryKey
    placement?: string
  }>(),
  { placement: 'tooltip-right' },
)

const entry = computed(() => ANALYTICS_GLOSSARY[props.glossaryKey])
</script>

<template>
  <span
    class="tooltip term-hint"
    :class="placement"
    :data-tip="entry.description"
  >
    <span class="term-hint__label border-b border-dashed border-slate-500/60 cursor-help">
      <slot>{{ entry.term }}</slot>
    </span>
  </span>
</template>
