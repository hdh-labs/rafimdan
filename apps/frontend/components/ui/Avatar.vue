<script setup lang="ts">
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "~/utils/cn"

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted",
  {
    variants: {
      size: {
        sm: "size-7 text-xs",
        md: "size-9 text-sm",
        lg: "size-12 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

type AvatarVariants = VariantProps<typeof avatarVariants>

interface Props {
  src?: string
  alt?: string
  fallback?: string
  size?: AvatarVariants["size"]
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: "md",
})

const imageError = ref(false)

const initials = computed(() => {
  if (!props.fallback) return "?"
  return props.fallback
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
})
</script>

<template>
  <span :class="cn(avatarVariants({ size }), props.class)">
    <img
      v-if="src && !imageError"
      :src="src"
      :alt="alt ?? fallback ?? ''"
      class="size-full object-cover"
      @error="imageError = true"
    />
    <span v-else class="font-medium text-muted-foreground select-none">
      {{ initials }}
    </span>
  </span>
</template>
