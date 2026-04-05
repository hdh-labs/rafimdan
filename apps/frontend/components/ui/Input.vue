<script setup lang="ts">
import { cn } from "~/utils/cn"

interface Props {
  label?: string
  error?: string
  disabled?: boolean
  placeholder?: string
  type?: string
  modelValue?: string
  class?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: "text",
  disabled: false,
})

const emit = defineEmits<{
  "update:modelValue": [value: string]
}>()

const inputId = props.id ?? `input-${Math.random().toString(36).slice(2, 9)}`
</script>

<template>
  <div class="flex flex-col gap-1 w-full">
    <label
      v-if="label"
      :for="inputId"
      class="text-sm font-medium text-foreground"
    >
      {{ label }}
    </label>
    <input
      :id="inputId"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :value="modelValue"
      :class="cn(
        'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive focus-visible:ring-destructive',
        props.class
      )"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="text-xs text-destructive">{{ error }}</p>
  </div>
</template>
