<script setup lang="ts">
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "~/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border border-border text-foreground bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type BadgeVariants = VariantProps<typeof badgeVariants>

interface Props {
  variant?: BadgeVariants["variant"]
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: "default",
})
</script>

<template>
  <span :class="cn(badgeVariants({ variant }), props.class)">
    <slot />
  </span>
</template>
