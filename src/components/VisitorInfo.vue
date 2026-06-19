<script setup lang="ts">
import type { Directive } from 'vue'
import { Icon } from '@iconify/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAppStore } from '@/stores/app'

interface VisitorData {
  ip: string
  city: string
  region: string
  country: string
  org: string
}

const show = ref(false)
const dismissed = ref(false)
const visitor = ref<VisitorData | null>(null)
const appStore = useAppStore()

const showVisitorBar = computed(() => appStore.visitorBarEnabled)
const showVisitorCard = computed(() => appStore.visitorCardEnabled)
const shouldFetchVisitor = computed(() => showVisitorBar.value || showVisitorCard.value)

const VISITOR_CARD_SIZE_KEY = 'komari_visitor_card_size'
const VISITOR_CARD_MIN_WIDTH = 192
const VISITOR_CARD_MIN_HEIGHT = 168
const VISITOR_CARD_DEFAULT_WIDTH = 224
const VISITOR_CARD_DEFAULT_HEIGHT = 226
const VISITOR_CARD_VIEWPORT_GAP = 12
const VISITOR_CARD_BOTTOM_OFFSET = 64

const visitorCardSize = ref({
  width: VISITOR_CARD_DEFAULT_WIDTH,
  height: VISITOR_CARD_DEFAULT_HEIGHT,
})

type ResizeDirection = 'top' | 'right' | 'top-right'

interface ResizeState {
  direction: ResizeDirection
  startX: number
  startY: number
  startWidth: number
  startHeight: number
}

let resizeState: ResizeState | null = null

const visitorCardStyle = computed(() => ({
  width: `${visitorCardSize.value.width}px`,
  height: `${visitorCardSize.value.height}px`,
}))

const windowsPattern = /Windows/i
const macPattern = /Mac/i
const androidPattern = /Android/i
const iosPattern = /iPhone|iPad/i
const edgPattern = /Edg/i
const chromePattern = /Chrome/i
const firefoxPattern = /Firefox/i
const safariPattern = /Safari/i
const macOsPattern = /Mac OS X/i
const linuxPattern = /Linux/i

const autoScrollObservers = new WeakMap<HTMLElement, ResizeObserver>()
const autoScrollFrameIds = new WeakMap<HTMLElement, number>()

function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function getVisitorCardMaxWidth(): number {
  if (typeof window === 'undefined')
    return VISITOR_CARD_DEFAULT_WIDTH
  return Math.max(VISITOR_CARD_MIN_WIDTH, window.innerWidth - VISITOR_CARD_VIEWPORT_GAP * 2)
}

function getVisitorCardMaxHeight(): number {
  if (typeof window === 'undefined')
    return VISITOR_CARD_DEFAULT_HEIGHT
  return Math.max(VISITOR_CARD_MIN_HEIGHT, window.innerHeight - VISITOR_CARD_BOTTOM_OFFSET - VISITOR_CARD_VIEWPORT_GAP)
}

function normalizeVisitorCardSize(width: number, height: number) {
  return {
    width: Math.round(clampValue(width, VISITOR_CARD_MIN_WIDTH, getVisitorCardMaxWidth())),
    height: Math.round(clampValue(height, VISITOR_CARD_MIN_HEIGHT, getVisitorCardMaxHeight())),
  }
}

function readVisitorCardSize() {
  try {
    const raw = localStorage.getItem(VISITOR_CARD_SIZE_KEY)
    if (!raw)
      return
    const parsed = JSON.parse(raw) as { width?: unknown, height?: unknown }
    if (typeof parsed.width !== 'number' || typeof parsed.height !== 'number')
      return
    visitorCardSize.value = normalizeVisitorCardSize(parsed.width, parsed.height)
  }
  catch {
    // Ignore invalid persisted size.
  }
}

function writeVisitorCardSize() {
  try {
    localStorage.setItem(VISITOR_CARD_SIZE_KEY, JSON.stringify(visitorCardSize.value))
  }
  catch {
    // Persisting the preferred card size is optional.
  }
}

function handleVisitorCardResizeMove(event: PointerEvent) {
  if (!resizeState)
    return

  const deltaX = event.clientX - resizeState.startX
  const deltaY = event.clientY - resizeState.startY
  let width = resizeState.startWidth
  let height = resizeState.startHeight

  if (resizeState.direction.includes('right'))
    width += deltaX
  if (resizeState.direction.includes('top'))
    height -= deltaY

  visitorCardSize.value = normalizeVisitorCardSize(width, height)
}

function stopVisitorCardResize() {
  if (!resizeState)
    return

  resizeState = null
  document.removeEventListener('pointermove', handleVisitorCardResizeMove)
  document.removeEventListener('pointerup', stopVisitorCardResize)
  document.removeEventListener('pointercancel', stopVisitorCardResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  writeVisitorCardSize()
}

function startVisitorCardResize(direction: ResizeDirection, event: PointerEvent) {
  event.preventDefault()
  event.stopPropagation()

  resizeState = {
    direction,
    startX: event.clientX,
    startY: event.clientY,
    startWidth: visitorCardSize.value.width,
    startHeight: visitorCardSize.value.height,
  }

  document.addEventListener('pointermove', handleVisitorCardResizeMove)
  document.addEventListener('pointerup', stopVisitorCardResize)
  document.addEventListener('pointercancel', stopVisitorCardResize)
  document.body.style.cursor = direction === 'top' ? 'ns-resize' : direction === 'right' ? 'ew-resize' : 'nesw-resize'
  document.body.style.userSelect = 'none'
}

function updateAutoScroll(el: HTMLElement) {
  const inner = el.querySelector<HTMLElement>('.auto-scroll-text__inner')
  if (!inner)
    return

  inner.style.transform = 'translateX(0)'
  const distance = Math.ceil(inner.scrollWidth - el.clientWidth)
  const scrollable = distance > 2

  el.dataset.scrollable = scrollable ? 'true' : 'false'
  el.style.setProperty('--scroll-distance', `${Math.max(distance, 0)}px`)
  el.style.setProperty('--scroll-duration', `${clampValue(distance / 20, 4, 14)}s`)
}

function scheduleAutoScrollUpdate(el: HTMLElement) {
  const currentFrameId = autoScrollFrameIds.get(el)
  if (currentFrameId !== undefined)
    cancelAnimationFrame(currentFrameId)

  const frameId = requestAnimationFrame(() => {
    autoScrollFrameIds.delete(el)
    updateAutoScroll(el)
  })
  autoScrollFrameIds.set(el, frameId)
}

const vAutoScroll: Directive<HTMLElement> = {
  mounted(el) {
    scheduleAutoScrollUpdate(el)

    if (typeof ResizeObserver === 'undefined')
      return

    const observer = new ResizeObserver(() => scheduleAutoScrollUpdate(el))
    observer.observe(el)
    const inner = el.querySelector<HTMLElement>('.auto-scroll-text__inner')
    if (inner)
      observer.observe(inner)
    autoScrollObservers.set(el, observer)
  },
  updated(el) {
    scheduleAutoScrollUpdate(el)
  },
  beforeUnmount(el) {
    const frameId = autoScrollFrameIds.get(el)
    if (frameId !== undefined)
      cancelAnimationFrame(frameId)
    autoScrollFrameIds.delete(el)
    autoScrollObservers.get(el)?.disconnect()
    autoScrollObservers.delete(el)
  },
}

onMounted(async () => {
  readVisitorCardSize()

  if (!shouldFetchVisitor.value)
    return

  try {
    const res = await fetch('https://ipapi.co/json/')
    const data = await res.json()
    visitor.value = {
      ip: data.ip,
      city: data.city,
      region: data.region,
      country: data.country_name,
      org: data.org,
    }
  }
  catch {
    visitor.value = null
  }
  finally {
    setTimeout(() => {
      show.value = true
    }, 600)
  }
})

onBeforeUnmount(() => {
  stopVisitorCardResize()
})

function dismiss() {
  dismissed.value = true
}

function getOsIcon(): string {
  const ua = navigator.userAgent
  if (windowsPattern.test(ua))
    return 'icon-park-outline:windows'
  if (macPattern.test(ua))
    return 'icon-park-outline:mac'
  if (androidPattern.test(ua))
    return 'icon-park-outline:android'
  if (iosPattern.test(ua))
    return 'icon-park-outline:apple'
  return 'icon-park-outline:laptop'
}

function getBrowserName(): string {
  const ua = navigator.userAgent
  if (edgPattern.test(ua))
    return 'Edge Browser'
  if (chromePattern.test(ua))
    return 'Chrome Browser'
  if (firefoxPattern.test(ua))
    return 'Firefox Browser'
  if (safariPattern.test(ua))
    return 'Safari Browser'
  return 'Unknown Browser'
}

function getOsName(): string {
  const ua = navigator.userAgent
  if (windowsPattern.test(ua))
    return 'Windows'
  if (macOsPattern.test(ua))
    return 'macOS'
  if (androidPattern.test(ua))
    return 'Android'
  if (iosPattern.test(ua))
    return 'iOS'
  if (linuxPattern.test(ua))
    return 'Linux'
  return 'Unknown OS'
}

function formatDate(): string {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 站点名（访客卡片头部显示用）
const siteName = '访客'
</script>

<template>
  <!-- 底部居中 IP 条（桌面+手机都显示） -->
  <Transition name="slide-up">
    <div
      v-if="showVisitorBar && show && !dismissed && visitor"
      class="visitor-ip-bar fixed bottom-4 left-1/2 -translate-x-1/2 z-50
             flex min-w-0 max-w-[calc(100vw-1rem)] items-center gap-2 overflow-hidden px-4 py-1.5 rounded-full
             bg-white/55 dark:bg-black/50
             backdrop-blur-md
             border border-white/40 dark:border-white/10
             shadow-lg text-[13px] select-none whitespace-nowrap"
    >
      <Icon icon="icon-park-outline:earth" :width="14" :height="14" class="text-blue-500 shrink-0" />
      <span class="text-muted-foreground">Your IP:</span>
      <span class="font-semibold text-foreground">{{ visitor.ip }}</span>
      <span class="text-muted-foreground/40">|</span>
      <span v-auto-scroll class="auto-scroll-text visitor-bar-country text-muted-foreground">
        <span class="auto-scroll-text__inner">{{ visitor.country }}</span>
      </span>
      <span class="text-muted-foreground/40">|</span>
      <span v-auto-scroll class="auto-scroll-text visitor-bar-org text-muted-foreground">
        <span class="auto-scroll-text__inner">{{ visitor.org }}</span>
      </span>
    </div>
  </Transition>

  <!-- 左下角详情卡片 — 模仿图二样式 -->
  <Transition name="slide-left">
    <div
      v-if="showVisitorCard && show && !dismissed && visitor"
      class="visitor-card fixed bottom-16 left-3 z-50 rounded-2xl
             bg-white/70 dark:bg-neutral-900/70
             backdrop-blur-xl
             border border-white/40 dark:border-white/10
             shadow-2xl"
      :style="visitorCardStyle"
    >
      <div class="visitor-resize-handle visitor-resize-handle--top" @pointerdown="startVisitorCardResize('top', $event)" />
      <div class="visitor-resize-handle visitor-resize-handle--right" @pointerdown="startVisitorCardResize('right', $event)" />
      <div class="visitor-resize-handle visitor-resize-handle--top-right" @pointerdown="startVisitorCardResize('top-right', $event)" />

      <!-- 顶部：头像 + 名字 + 关闭 -->
      <div class="flex min-w-0 items-center justify-between gap-2 px-4 pt-4 pb-1">
        <div class="flex min-w-0 items-center gap-2.5">
          <!-- 渐变头像圆 -->
          <div class="size-9 rounded-full bg-gradient-to-br from-violet-400 via-blue-400 to-cyan-400 flex items-center justify-center shrink-0 shadow-md">
            <Icon icon="icon-park-outline:user" :width="18" :height="18" class="text-white" />
          </div>
          <div class="flex min-w-0 flex-col leading-tight">
            <span v-auto-scroll class="auto-scroll-text text-[14px] font-bold text-violet-500 dark:text-violet-400">
              <span class="auto-scroll-text__inner">{{ siteName }}</span>
            </span>
            <span v-auto-scroll class="auto-scroll-text text-[11px] text-muted-foreground">
              <span class="auto-scroll-text__inner">{{ visitor.city }}, {{ visitor.region }}</span>
            </span>
          </div>
        </div>
        <button
          class="size-6 shrink-0 rounded-full flex items-center justify-center
                 hover:bg-black/8 dark:hover:bg-white/10 transition-colors"
          @click="dismiss"
        >
          <Icon icon="icon-park-outline:close" :width="13" :height="13" class="text-muted-foreground" />
        </button>
      </div>

      <!-- Welcome 文字 -->
      <div class="px-4 pb-2">
        <span v-auto-scroll class="auto-scroll-text text-[12px] text-foreground/70">
          <span class="auto-scroll-text__inner">Welcome from {{ visitor.city }}!</span>
        </span>
      </div>

      <!-- 分割线 -->
      <div class="mx-4 border-t border-black/6 dark:border-white/8 mb-2" />

      <!-- 信息行 -->
      <div class="px-4 pb-4 flex flex-col gap-2">
        <div class="visitor-info-row flex min-w-0 items-center gap-2.5 text-[12px] text-foreground/75">
          <Icon :icon="getOsIcon()" :width="14" :height="14" class="text-muted-foreground shrink-0" />
          <span v-auto-scroll class="auto-scroll-text">
            <span class="auto-scroll-text__inner">{{ getOsName() }}</span>
          </span>
        </div>
        <div class="visitor-info-row flex min-w-0 items-center gap-2.5 text-[12px] text-foreground/75">
          <Icon icon="icon-park-outline:browser-chrome" :width="14" :height="14" class="text-muted-foreground shrink-0" />
          <span v-auto-scroll class="auto-scroll-text">
            <span class="auto-scroll-text__inner">{{ getBrowserName() }}</span>
          </span>
        </div>
        <div class="visitor-info-row flex min-w-0 items-center gap-2.5 text-[12px] text-foreground/75">
          <Icon icon="icon-park-outline:local" :width="14" :height="14" class="text-blue-500 shrink-0" />
          <span v-auto-scroll class="auto-scroll-text font-mono">
            <span class="auto-scroll-text__inner">{{ visitor.ip }}</span>
          </span>
        </div>
        <div class="visitor-info-row flex min-w-0 items-center gap-2.5 text-[12px] text-foreground/75">
          <Icon icon="icon-park-outline:protect" :width="14" :height="14" class="text-muted-foreground shrink-0" />
          <span v-auto-scroll class="auto-scroll-text">
            <span class="auto-scroll-text__inner">{{ visitor.org }}</span>
          </span>
        </div>
        <div class="visitor-info-row flex min-w-0 items-center gap-2.5 text-[12px] text-foreground/75">
          <Icon icon="icon-park-outline:time" :width="14" :height="14" class="text-muted-foreground shrink-0" />
          <span v-auto-scroll class="auto-scroll-text">
            <span class="auto-scroll-text__inner">{{ formatDate() }}</span>
          </span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.visitor-card {
  min-width: 192px;
  min-height: 168px;
  max-width: calc(100vw - 24px);
  max-height: calc(100vh - 76px);
  overflow: auto;
  resize: both;
  scrollbar-width: thin;
  scrollbar-color: rgb(148 163 184 / 0.45) transparent;
}

.visitor-card::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.visitor-card::-webkit-scrollbar-thumb {
  background: rgb(148 163 184 / 0.45);
  border-radius: 999px;
}

.visitor-resize-handle {
  position: absolute;
  z-index: 2;
}

.visitor-resize-handle--top {
  top: 0;
  right: 14px;
  left: 0;
  height: 8px;
  cursor: ns-resize;
}

.visitor-resize-handle--right {
  top: 14px;
  right: 0;
  bottom: 0;
  width: 8px;
  cursor: ew-resize;
}

.visitor-resize-handle--top-right {
  top: 0;
  right: 0;
  width: 18px;
  height: 18px;
  cursor: nesw-resize;
}

.visitor-info-row {
  min-height: 18px;
}

.visitor-info-row .auto-scroll-text {
  flex: 1 1 auto;
}

.visitor-ip-bar {
  min-width: min(100vw - 1rem, 240px);
}

.visitor-bar-country {
  flex: 0 1 auto;
  max-width: 24vw;
}

.visitor-bar-org {
  flex: 1 1 auto;
  max-width: min(42vw, 260px);
}

.auto-scroll-text {
  display: block;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.auto-scroll-text__inner {
  display: inline-block;
  max-width: none;
  min-width: 100%;
  transform: translateX(0);
  will-change: transform;
}

.auto-scroll-text[data-scrollable='true'] .auto-scroll-text__inner {
  padding-right: 1.5rem;
  animation: auto-scroll-text var(--scroll-duration, 8s) linear infinite alternate;
}

.auto-scroll-text[data-scrollable='true']:hover .auto-scroll-text__inner {
  animation-play-state: paused;
}

@keyframes auto-scroll-text {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(calc(-1 * var(--scroll-distance, 0px)));
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.slide-left-enter-from,
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
