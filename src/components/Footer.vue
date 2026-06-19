<script setup lang="ts">
import type { VersionInfo } from '@/utils/api'
import { computed, onMounted, ref } from 'vue'
import { DataTooltip } from '@/components/ui/data-tooltip'
import { useAppStore } from '@/stores/app'
import { getSharedApi } from '@/utils/api'

const appStore = useAppStore()
const api = getSharedApi()

const buildVersion = __BUILD_VERSION__
const buildGitHash = __BUILD_GIT_HASH__

const serverVersion = ref<VersionInfo | null>(null)

onMounted(async () => {
  try {
    serverVersion.value = await api.getVersion()
  }
  catch {
    // 静默失败
  }
})

const formattedServerVersion = computed(() => serverVersion.value?.version ?? null)

const showIcp = computed(() => appStore.icpEnabled && appStore.icpNumber)
const showPolice = computed(() => appStore.policeEnabled && appStore.policeNumber)
const showFiling = computed(() => showIcp.value || showPolice.value)
const showPoweredBy = computed(() => appStore.footerPoweredByEnabled)
const showThemeCredit = computed(() => appStore.footerThemeCreditEnabled)
const showFooterCredits = computed(() => showPoweredBy.value || showThemeCredit.value)
const showFooter = computed(() => showFooterCredits.value || showFiling.value)
const showPoweredByContent = computed(() => Boolean(appStore.footerPoweredByPrefix || appStore.footerPoweredByText))
const showThemeCreditContent = computed(() => Boolean(appStore.footerThemeCreditPrefix || appStore.footerThemeCreditText))
</script>

<template>
  <footer v-if="showFooter" class="w-full sm:flex-row sm:gap-4 sm:items-center sm:justify-between max-w-[1280px] mx-auto p-4">
    <div v-if="showFooterCredits" class="flex flex-row text-xs text-muted-foreground">
      <div v-if="showPoweredBy && showPoweredByContent" class="flex gap-1 items-center">
        <span v-if="appStore.footerPoweredByPrefix">{{ appStore.footerPoweredByPrefix }}</span>
        <DataTooltip
          v-if="appStore.footerPoweredByText"
          as="span"
          placement="top"
          :content="formattedServerVersion ?? ''"
        >
          <a
            v-if="appStore.footerPoweredByUrl"
            :href="appStore.footerPoweredByUrl" target="_blank" rel="noopener noreferrer"
            class="transition-opacity hover:opacity-80"
          >
            <span class="font-medium text-foreground">{{ appStore.footerPoweredByText }}</span>
          </a>
          <span v-else class="font-medium text-foreground">{{ appStore.footerPoweredByText }}</span>
        </DataTooltip>
      </div>
      <div class="flex-1" />
      <div v-if="showThemeCredit && showThemeCreditContent" class="flex flex-wrap gap-1 items-center">
        <span v-if="appStore.footerThemeCreditPrefix">{{ appStore.footerThemeCreditPrefix }}</span>
        <DataTooltip
          v-if="appStore.footerThemeCreditText"
          as="span"
          placement="top"
          :content="`v${buildVersion}\n${buildGitHash}`"
        >
          <a
            v-if="appStore.footerThemeCreditUrl"
            :href="appStore.footerThemeCreditUrl" target="_blank" rel="noopener noreferrer"
            class="transition-opacity hover:opacity-80"
          >
            <span class="font-medium text-foreground">{{ appStore.footerThemeCreditText }}</span>
          </a>
          <span v-else class="font-medium text-foreground">{{ appStore.footerThemeCreditText }}</span>
        </DataTooltip>
      </div>
    </div>

    <div v-if="showFiling" class="flex flex-wrap gap-2 items-center justify-center sm:flex-shrink-0">
      <a
        v-if="showIcp" :href="appStore.icpUrl" target="_blank" rel="noopener noreferrer"
        class="transition-opacity hover:opacity-70"
      >
        <span class="text-xs text-muted-foreground">{{ appStore.icpNumber || '' }}</span>
      </a>
      <span v-if="showIcp && showPolice" class="opacity-50 text-xs text-muted-foreground">·</span>
      <template v-if="showPolice">
        <a
          v-if="appStore.policeUrl" :href="appStore.policeUrl" target="_blank" rel="noopener noreferrer"
          class="transition-opacity hover:opacity-70"
        >
          <span class="text-xs text-muted-foreground">{{ appStore.policeNumber || '' }}</span>
        </a>
        <span v-else class="text-xs text-muted-foreground">{{ appStore.policeNumber || '' }}</span>
      </template>
    </div>
  </footer>
</template>
