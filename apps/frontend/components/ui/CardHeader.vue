<script setup lang="ts">
import { cn } from "~/utils/cn"

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="cn('flex flex-col gap-1.5 p-6', props.class)">
    <slot />
  </div>
</template>
