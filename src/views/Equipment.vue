<script setup lang="ts">
// import type { HeaderOptions } from "@/types/searchHeader";

import { onMounted, ref, watch } from "vue";
// import SearchHeader from "@/components/common/SearchHeader.vue";
// import { useEquipmentStore } from "@/stores/equipmentStore";
import { PAGE_SIZE, useSearchHeaderStore } from "@/stores/searchHeaderStore";
// import { ROUTENAME } from "@/utils/routeNames";
// import { library } from "@fortawesome/fontawesome-svg-core";
// import { faMemo } from "@fortawesome/pro-light-svg-icons";
// import { faForklift } from "@fortawesome/pro-regular-svg-icons";
// import { faLanguage, faPlus } from "@fortawesome/pro-solid-svg-icons";
// import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { storeToRefs } from "pinia";

// import CardEquipment from "./CardEquipment.vue";
// import EquipmentFilter from "./EquipmentFilter.vue";
import { z } from "zod";

export const EquipmentQueryParamSchema = z.object({
  Keywords: z.string().optional(),
  OverdueInDays: EquipmentInspectionIntervalSchema.optional(),
  InService: z.boolean().optional(),
  ManufacturerIds: z.array(z.number()).optional(),
  TagIds: z.array(z.number()).optional(),
  InspectionIntervals: z.array(z.number()).optional(),
  WorkerIds: z.array(z.number()).optional(),
  DocumentIds: z.array(z.number()).optional(),
  ProjectIds: z.array(z.number()).optional(),
  CompanyIds: z.array(z.number()).optional(),
  DivisionIds: z.array(z.number()).optional(),
  PageNumber: z.number().default(1),
  PageSize: z.number().default(PAGE_SIZE),
});

export type EquipmentQueryParam = z.infer<typeof EquipmentQueryParamSchema>;
library.add(faMemo, faPlus, faLanguage, faForklift);

const { search, inputSearch, queryParams } = storeToRefs(
  useSearchHeaderStore()
);
const {
  setHeaderOptions,
  setReload,
  setQueryParams,
  setTotalResponseItem,
  setDefaultQueryParams,
} = useSearchHeaderStore();
const { totalItems } = storeToRefs(useEquipmentStore());
const equipmentStore = useEquipmentStore();

const options = ref<HeaderOptions>({
  title: "Equipment",
  includeTabsButton: false,
  displayReloadButton: false,
  useExtendThirdSlot: false,
  titleSlotFirst: "",
  titleSlotSecond: "",
  titleSlotThird: "",
  fabRouterName: ROUTENAME.CREATE_EQUIPMENT_ROUTENAME,
  sidebarWidth: "400px",
  placeholder: "Search",
});

onMounted(async () => {
  setHeaderOptions(options.value);
  await loadListEquipments();
});

watch(
  () => search.value,
  async () => {
    await loadListEquipments();
  }
);

async function loadListEquipments() {
  setReload(true);
  if (inputSearch.value && inputSearch.value.length >= 4) {
    setDefaultQueryParams();
  }
  const param: EquipmentQueryParam = {
    ...queryParams.value,
    Keywords: inputSearch.value,
  };
  setQueryParams(param);
  await equipmentStore.getListEquipments(param);
  setTotalResponseItem(totalItems.value);
  setReload(false);
}
</script>

<template>
  <div>
    <SearchHeader ref="shqSearchHeader">
      <template #filters> <EquipmentFilter /> </template>
      <template #icon>
        <FontAwesomeIcon
          :icon="['far', 'forklift']"
          size="lg"
          class="icon-color"
        />
      </template>
      <template #slotFirst>
        <CardEquipment :listEquipments="equipmentStore.listEquipments" />
      </template>
      <template #fab-icon>
        <FontAwesomeIcon :icon="['fas', 'plus']" size="lg" />
      </template>
    </SearchHeader>
  </div>
</template>

<style scoped lang="scss">
.button-circle {
  width: 36px;
  height: 36px;
  border-color: #437e48;
}

.icon-color {
  color: #437e48;
}
</style>
