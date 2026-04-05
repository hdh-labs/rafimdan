<script setup lang="ts">
import { cn } from "~/utils/cn"

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="cn('rounded-lg border border-border bg-background shadow-sm', props.class)">
    <slot />
  </div>
</template>
