<script setup lang="ts">
import { Search, X } from "lucide-vue-next"
import { ILLER } from "~/utils/turkey-locations"

const props = defineProps<{
  modelValue: string
  hasError?: boolean
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
  if (!query.value.trim()) return ILLER.slice(0, 8)
  const q = query.value.toLocaleLowerCase("tr")
  return ILLER.filter((il) => il.name.toLocaleLowerCase("tr").startsWith(q)).slice(0, 8)
})

watch(() => props.modelValue, (val) => {
  if (val !== query.value) query.value = val
})

const activeDescendant = computed(() =>
  open.value && activeIndex.value >= 0 ? `city-option-${activeIndex.value}` : undefined,
)

function select(name: string) {
  query.value = name
  emit("update:modelValue", name)
  open.value = false
  activeIndex.value = -1
}

function onInput() {
  open.value = true
  activeIndex.value = -1
  const exact = ILLER.find((il) => il.name === query.value)
  emit("update:modelValue", exact ? query.value : "")
}

function onFocus() {
  open.value = true
}

function onBlur() {
  setTimeout(() => {
    if (!rootRef.value?.contains(document.activeElement)) {
      open.value = false
      activeIndex.value = -1
      if (!props.modelValue) query.value = ""
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
  if (!open.value || filtered.value.length === 0) return
  if (e.key === "ArrowDown") {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % filtered.value.length
  } else if (e.key === "ArrowUp") {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + filtered.value.length) % filtered.value.length
  } else if (e.key === "Enter" && activeIndex.value >= 0) {
    e.preventDefault()
    select(filtered.value[activeIndex.value].name)
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
        :aria-expanded="open && filtered.length > 0"
        aria-controls="city-autocomplete-list"
        :aria-activedescendant="activeDescendant"
        placeholder="Şehir ara..."
        :class="[
          'w-full pl-8 pr-7 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 transition-colors',
          hasError ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-ring',
        ]"
        @input="query = ($event.target as HTMLInputElement).value; onInput()"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
      />
      <button
        v-if="query"
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
        v-if="open && filtered.length > 0"
        id="city-autocomplete-list"
        role="listbox"
        aria-label="Şehirler"
        class="absolute z-30 w-full mt-1 rounded-md border border-border bg-background shadow-lg max-h-52 overflow-y-auto py-1"
      >
        <li
          v-for="(il, i) in filtered"
          :id="`city-option-${i}`"
          :key="il.name"
          role="option"
          :aria-selected="il.name === modelValue"
          class="px-3 py-1.5 text-sm cursor-pointer hover:bg-muted transition-colors"
          :class="il.name === modelValue ? 'font-semibold text-foreground bg-muted' : 'text-foreground'"
          @mousedown.prevent="select(il.name)"
        >
          {{ il.name }}
        </li>
      </ul>
    </Transition>
  </div>
</template>
