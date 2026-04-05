<script setup lang="ts">
import { cn } from "~/utils/cn"

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div
    :class="cn('animate-pulse rounded-md bg-muted', props.class)"
    aria-hidden="true"
  />
</template>
