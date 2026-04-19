<script setup lang="ts">
import { Search, X } from "lucide-vue-next"

const props = defineProps<{
  modelValue: string
  options: string[]
  disabled?: boolean
  inputId?: string
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string]
}>()

const query = ref(props.modelValue)
const open = ref(false)
const activeIndex = ref(-1)
const rootRef = ref<HTMLDivElement | null>(null)

const filtered = computed(() => {
  if (!query.value.trim()) return props.options
  const q = query.value.toLocaleLowerCase("tr")
  return props.options.filter((d) => d.toLocaleLowerCase("tr").startsWith(q))
})

const activeDescendant = computed(() =>
  open.value && activeIndex.value >= 0 ? `district-option-${activeIndex.value}` : undefined,
)

watch(() => props.modelValue, (val) => {
  if (val !== query.value) query.value = val
})

watch(() => props.options, () => {
  if (query.value && !props.options.includes(query.value)) {
    query.value = ""
    emit("update:modelValue", "")
  }
  activeIndex.value = -1
})

function select(name: string) {
  query.value = name
  emit("update:modelValue", name)
  open.value = false
  activeIndex.value = -1
}

function onInput() {
  open.value = true
  activeIndex.value = -1
  const exact = props.options.find((d) => d === query.value)
  emit("update:modelValue", exact ? query.value : "")
}

function onFocus() {
  if (!props.disabled) open.value = true
}

function onBlur() {
  setTimeout(() => {
    if (!rootRef.value?.contains(document.activeElement)) {
      open.value = false
      activeIndex.value = -1
      query.value = props.modelValue || ""
    }
  }, 120)
}

function clear() {
  query.value = ""
  emit("update:modelValue", "")
  open.value = false
  activeIndex.value = -1
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  if (!open.value || filtered.value.length === 0) return
  if (e.key === "ArrowDown") {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % filtered.value.length
  } else if (e.key === "ArrowUp") {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + filtered.value.length) % filtered.value.length
  } else if (e.key === "Enter" && activeIndex.value >= 0) {
    e.preventDefault()
    select(filtered.value[activeIndex.value])
  } else if (e.key === "Escape") {
    open.value = false
    activeIndex.value = -1
  }
}
</script>

<template>
  <div ref="rootRef" class="relative">
    <div class="relative">
      <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
      <input
        :id="inputId"
        :value="query"
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        :aria-expanded="open && filtered.length > 0 && !disabled"
        aria-controls="district-autocomplete-list"
        :aria-activedescendant="activeDescendant"
        :placeholder="disabled ? 'Önce şehir seçin' : 'İlçe ara...'"
        :disabled="disabled"
        :class="[
          'w-full pl-8 pr-7 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 transition-colors',
          'border-border focus:ring-ring',
          disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-text',
        ]"
        @input="query = ($event.target as HTMLInputElement).value; onInput()"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
      />
      <button
        v-if="query && !disabled"
        type="button"
        tabindex="-1"
        class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
        @mousedown.prevent="clear"
      >
        <X class="size-3.5" />
      </button>
    </div>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <ul
        v-if="open && filtered.length > 0 && !disabled"
        id="district-autocomplete-list"
        role="listbox"
        aria-label="İlçeler"
        class="absolute z-30 w-full mt-1 rounded-md border border-border bg-background shadow-lg max-h-52 overflow-y-auto py-1"
      >
        <li
          v-for="(district, i) in filtered"
          :id="`district-option-${i}`"
          :key="district"
          role="option"
          :aria-selected="district === modelValue"
          class="px-3 py-1.5 text-sm cursor-pointer hover:bg-muted transition-colors"
          :class="[
            district === modelValue ? 'font-semibold text-foreground bg-muted' : 'text-foreground',
            i === activeIndex ? 'bg-muted' : '',
          ]"
          @mousedown.prevent="select(district)"
        >
          {{ district }}
        </li>
      </ul>
    </Transition>
  </div>
</template>
