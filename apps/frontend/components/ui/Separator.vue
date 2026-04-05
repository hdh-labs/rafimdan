<script setup lang="ts">
import { cn } from "~/utils/cn"

interface Props {
  orientation?: "horizontal" | "vertical"
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  orientation: "horizontal",
})
</script>

<template>
  <div
    role="separator"
    :aria-orientation="orientation"
    :class="cn(
      'bg-border shrink-0',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      props.class
    )"
  />
</template>
