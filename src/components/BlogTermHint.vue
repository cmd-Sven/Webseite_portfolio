<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { getBlogGlossaryEntry } from '../data/blogGlossary'

const props = defineProps<{
  termKey: string
}>()

const entry = computed(() => getBlogGlossaryEntry(props.termKey))
const open = ref(false)
const coords = ref<{ top: number; left: number; maxWidth: number } | null>(null)
const btnRef = ref<HTMLButtonElement | null>(null)
const tipRef = ref<HTMLDivElement | null>(null)
const tipId = `blog-term-tip-${Math.random().toString(36).slice(2, 9)}`

const VIEWPORT_PAD = 12
const GAP = 8

function place() {
  const btn = btnRef.value
  const tip = tipRef.value
  if (!btn || !tip) return

  const rect = btn.getBoundingClientRect()
  const tipRect = tip.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const maxWidth = Math.min(288, vw - VIEWPORT_PAD * 2)

  let top = rect.bottom + GAP
  let left = rect.left + rect.width / 2 - tipRect.width / 2

  if (top + tipRect.height > vh - VIEWPORT_PAD) {
    top = rect.top - tipRect.height - GAP
  }
  if (top < VIEWPORT_PAD) {
    top = VIEWPORT_PAD
  }

  left = Math.max(VIEWPORT_PAD, Math.min(left, vw - tipRect.width - VIEWPORT_PAD))
  coords.value = { top, left, maxWidth }
}

let ro: ResizeObserver | null = null

function cleanupListeners() {
  ro?.disconnect()
  ro = null
  window.removeEventListener('resize', place)
  window.removeEventListener('scroll', place, true)
  document.removeEventListener('keydown', onKey)
  document.removeEventListener('mousedown', onPointer)
  document.removeEventListener('touchstart', onPointer)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    open.value = false
    btnRef.value?.focus()
  }
}

function onPointer(e: MouseEvent | TouchEvent) {
  const target = e.target as Node
  if (btnRef.value?.contains(target) || tipRef.value?.contains(target)) return
  open.value = false
}

watch(open, async (isOpen) => {
  cleanupListeners()
  if (!isOpen) {
    coords.value = null
    return
  }

  await nextTick()
  place()
  if (tipRef.value) {
    ro = new ResizeObserver(place)
    ro.observe(tipRef.value)
  }
  window.addEventListener('resize', place)
  window.addEventListener('scroll', place, true)
  document.addEventListener('keydown', onKey)
  document.addEventListener('mousedown', onPointer)
  document.addEventListener('touchstart', onPointer)
})

onBeforeUnmount(cleanupListeners)

function toggle(e: MouseEvent) {
  e.stopPropagation()
  open.value = !open.value
}
</script>

<template>
  <template v-if="!entry">{{ termKey }}</template>
  <span v-else class="blog-term-hint">
    <span class="blog-term-hint__label">
      <slot>{{ entry.term }}</slot>
    </span>
    <button
      ref="btnRef"
      type="button"
      class="blog-term-hint__btn"
      :aria-label="`Erklärung zu ${entry.term}`"
      :aria-expanded="open"
      :aria-controls="tipId"
      @click="toggle"
    >
      <svg
        class="blog-term-hint__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    </button>
    <Teleport to="body">
      <div
        v-if="open"
        :id="tipId"
        ref="tipRef"
        role="tooltip"
        class="blog-term-hint__tooltip"
        :style="
          coords
            ? {
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                maxWidth: `${coords.maxWidth}px`,
                visibility: 'visible',
              }
            : { visibility: 'hidden', top: '0', left: '0' }
        "
      >
        <strong class="blog-term-hint__tooltip-term">{{ entry.term }}</strong>
        <p class="blog-term-hint__tooltip-text">{{ entry.description }}</p>
      </div>
    </Teleport>
  </span>
</template>
