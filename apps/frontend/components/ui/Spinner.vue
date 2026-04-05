<script setup lang="ts">
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-vue-next"
import { cn } from "~/utils/cn"

const spinnerVariants = cva("animate-spin text-muted-foreground", {
  variants: {
    size: {
      sm: "size-4",
      md: "size-6",
      lg: "size-8",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

type SpinnerVariants = VariantProps<typeof spinnerVariants>

interface Props {
  size?: SpinnerVariants["size"]
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: "md",
})
</script>

<template>
  <Loader2
    :class="cn(spinnerVariants({ size }), props.class)"
    aria-label="Yükleniyor"
    role="status"
  />
</template>
