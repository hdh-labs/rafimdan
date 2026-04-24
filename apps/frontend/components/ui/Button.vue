<script setup lang="ts">
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-vue-next"
import { cn } from "~/utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90",
        brand: "bg-brand text-brand-foreground hover:opacity-90",
        outline: "border border-border bg-background hover:bg-muted text-foreground",
        ghost: "hover:bg-muted text-foreground",
        destructive: "bg-destructive text-white hover:opacity-90",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        xl: "h-12 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

type ButtonVariants = VariantProps<typeof buttonVariants>

interface Props {
  variant?: ButtonVariants["variant"]
  size?: ButtonVariants["size"]
  loading?: boolean
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: "default",
  size: "md",
  loading: false,
  disabled: false,
  type: "button",
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <Loader2 v-if="loading" class="size-4 animate-spin" />
    <slot />
  </button>
</template>
