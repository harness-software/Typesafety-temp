# lts-typesafety-issue

## Issue One

The original issue was that `queryParams` from `useSearchHeaderStore` was a black box. That did not show the true type that it could be. Meaning it did not show all the properties that it could be included on the `queryParams` object.

`searchHeaderStore.ts` file `queryParams` was defined as below with the `setQueryParams` function that was used to set the `queryParams` object.

```ts
export const useSearchHeaderStore = defineStore("searchHeader", () => {
  // other refs
  const queryParams = ref({
    PageSize: PAGE_SIZE,
    PageNumber: 1,
  });

  function setQueryParams<T>(_queryParams: T) {
    queryParams.value = Object.assign(queryParams.value, _queryParams);
  }

  function setDefaultQueryParams() {
    queryParams.value = {
      PageSize: PAGE_SIZE,
      PageNumber: 1,
    };
  }

  return {
    // other refs
    queryParams,
    setQueryParams,
    setDefaultQueryParams,
  };
});
```

**NOTE**: In the `useSearchHeaderStore` function, if `queryParams` was referenced it only accessed `PageNumber` and `PageSize` properties. It did not expect or care if there were other properties on the `queryParams` object.

**Usage**:

`src/views/SDS/SDSListView.vue`

```vue
<script setup lang="ts">
import { onMounted, ref } from "vue";

const { search, queryParams, inputSearch } = storeToRefs(
  useSearchHeaderStore()
);
const {
  setHeaderOptions,
  setReload,
  setFiltersCount,
  setQueryParams,
  setSearch,
  showFilter,
} = useSearchHeaderStore();

async function loadListSDSSearch() {
  setReload(true);
  try {
    const safetyDataSheetsQuery: SafetyDataSheetsQuery =
      SafetyDataSheetsQuerySchema.parse({
        ...queryParams.value,
        keywords: inputSearch.value,
      });
    const response = await safetyDataSheetStore.getListSafetyDataSheet(
      safetyDataSheetsQuery
    );
    if (response) {
      totalItem.value = response.length;
      listSafetyDataSheet.value = response;
    }
  } finally {
    setReload(false);
  }
}

function setFilter() {
  showFilter();
  setQueryParams<SafetyDataSheetsQuery>(
    SafetyDataSheetsQuerySchema.parse({
      manufacturerIds: manufacturerSelect.value.map((x) => Number(x.value)),
      keywords: inputSearch.value,
    })
  );

  setSearch();
}
</script>
<template></template>
```

SDS Types

```ts
import { z } from "zod";

export const SafetyDataSheetsQuerySchema = z.object({
  keywords: z.string().optional(),
  manufacturerIds: z.array(z.number()).optional(),
  pageNumber: z.number().default(1),
  pageSize: z.number().default(PAGE_SIZE),
});

export type SafetyDataSheetsQuery = z.infer<typeof SafetyDataSheetsQuerySchema>;
```

When you would hover over the `queryParams` in the `loadListSDSSearch` function, it would show the type as below.

![image](./Screenshot%202024-01-04%20at%209.51.48%E2%80%AFAM.png)

So one would expect that **only** those properties are present and the final `param` object would be of type of only `PageNumber`, `PageSize`, and `keywords`. Whereas in reality, the `param` object would have _hidden_ properties that make up the `SafetyDataSheetsQuery` type.

As you can see below, the `param` object has the `manufacturerIds` property that is not shown in the type of `queryParams`. This is because the `queryParams` object is a black box and does not show the true type of the object. LTS was able to get around this by using a spread operator and was then leveraging the fact that the zod schema had optional properties. Therefore, it resulted in the `param` object looking like it has the right type, since less properties are still a subset of the type. However, in reality there were more properties on the `param` object that were not shown in the type.

![image2](./Screenshot%202024-01-04%20at%209.54.41%E2%80%AFAM.png)

You will also notice that because of this black box the properties do not even have the same casing.

## Issue Two

Then after a meeting LTS came back with the following.

`./src/axios/instances/equipmentApi.ts`

```ts
export class EquipmentApi {
  // other code

  public async getListEquipmentsByQuery(
    query: string
  ): Promise<EquipmentResultList> {
    try {
      const request = `${this.urlEquipment}?${query}`;
      const response = await this.axiosInstance.get(request);
      if (response && response.status === 200) {
        return EquipmentResultListSchema.parse(response.data);
      } else {
        throw new Error(`Failed to parse list ${this.name}`);
      }
    } catch (error) {
      console.error(
        `An unexpected error occurred attempting to retrieve the list ${this.name}.`,
        error
      );
      return [];
    }
  }
}
```

`./src/stores/searchHeaderStore.ts`

```ts
export const useEquipmentStore = defineStore("EquipmentStore", () => {
  const listEquipments = ref<EquipmentResultList>([]);
  const totalItems = ref<number>(0);
  const currentEquipment = ref<EquipmentDetailResult>();

  async function getListEquipments(): Promise<EquipmentResultList> {
    const res = await equipmentApi.getListEquipments(1, PAGE_SIZE_MAX);
    totalItems.value = res.length;
    listEquipments.value = res;
    return listEquipments.value;
  }

  async function getListEquipmentsByQuery(
    query: string
  ): Promise<EquipmentResultList> {
    const res = await equipmentApi.getListEquipmentsByQuery(query);
    totalItems.value = res.length;
    listEquipments.value = res;
    return listEquipments.value;
  }
});
```

Which got used in `./src/view/Equipment/EquipmentFilter.vue`

```ts
async function handleSetFilters() {
  const data = {
    OverdueInDays:
      EquipmentOverdueInDaysSchema.parse(filters.value.overdues?.value) ??
      EquipmentOverdueInDays.OVERDUE,
    ManufacturerIds: filters.value.manufacturers
      ? filters.value.manufacturers.map((x) => x.manufacturerId)
      : [],
    InService: filters.value.status?.value === "true" ?? false,
    TagIds: filters.value.tags ? filters.value.tags.map((x) => x.tagId) : [],
    InspectionIntervals: filters.value.inspectionIntervals
      ? filters.value.inspectionIntervals.map((x) => Number.parseInt(x.value))
      : [],
    WorkerIds: filters.value.workers
      ? filters.value.workers.map((x) => x.workerId)
      : [],
    DocumentIds: filters.value.documents
      ? filters.value.documents.map((x) => x.documentId)
      : [],
    ProjectIds: filters.value.projects
      ? filters.value.projects.map((x) => x.projectId)
      : [],
    CompanyIds: filters.value.companies
      ? filters.value.companies.map((x) => x.companyId)
      : [],
    DivisionIds: filters.value.divisions
      ? filters.value.divisions.map((x) => x.divisionId)
      : [],
  };
  const validData = await EquipmentQueryParamSchema.safeParseAsync(data);
  if (validData.success) {
    filterData.value = {
      ...filterData.value,
      ...validData.data,
    };
    const query = convertToStringQueryParam(filterData.value);
    if (query) {
      setSearchQuery(query);
    }
    setFiltersCount(totalQueryParam(filterData.value));
    setSearch();
    showFilter();
  }
}

function convertToStringQueryParam(data: EquipmentQueryParam) {
  if (!data) return null;

  const keyValuePairArray = Object.entries(data).map((c) => ({
    key: c[0],
    value: c[1],
  }));
  return keyValuePairArray
    .map((obj) =>
      Array.isArray(obj.value)
        ? obj.value.map((v) => `${obj.key}=${v}`).join("&")
        : `${obj.key}=${obj.value}`
    )
    .join("&")
    .replace(/&{2,}/, "");
}

function totalQueryParam(data: EquipmentQueryParam) {
  let total = 0;
  if (!data) return total;
  const keyValuePairArray = Object.entries(data).map((c) => ({
    key: c[0],
    value: c[1],
  }));
  keyValuePairArray.forEach((obj) =>
    Array.isArray(obj.value) ? (total += obj.value.length) : total++
  );
  return total;
}
```

This change made is so instead of a `queryParams` black box we now had a `string` black box. Whereas the value given to `getListEquipmentsByQuery` was a `string` and not an object. This meant that it was up to the programmer to ensure the correct `string` shape for query params was given to the store function.

My suggestion was to type the store's function argument as `EquipmentQueryParams` and inside the equipment store covert the object to a real url search string with the help of `URLSearchParams`. This would ensure the developer passes in the expected query params to the store function and the store is setup to handle the conversion from the `EquipmentQueryParams` object to the `string` url search params.

We would also make the helper functions `convertToStringQueryParam` and `totalQueryParam` work on `Record<string, unknown>` types so they could be used in other stores.

```ts
function convertObjectToSearchParams(
  data: Record<string, unknown>
): URLSearchParams | null {
  if (!data) return null;

  const result = new URLSearchParams();

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string") {
      result.set(key, value);
    } else if (typeof value === "number") {
      result.set(key, value.toString());
    } else if (typeof value === "boolean") {
      result.set(key, value.toString());
    } else if (Array.isArray(value)) {
      value.forEach((item) => {
        result.append(key, item.toString());
      });
    } else {
      result.set(key, JSON.stringify(value));
    }
  }

  return result;
}

export const useEquipmentStore = defineStore("EquipmentStore", () => {
  const listEquipments = ref<EquipmentResultList>([]);
  const totalItems = ref<number>(0);
  const currentEquipment = ref<EquipmentDetailResult>();

  async function getListEquipments(): Promise<EquipmentResultList> {
    const res = await equipmentApi.getListEquipments(1, PAGE_SIZE_MAX);
    totalItems.value = res.length;
    listEquipments.value = res;
    return listEquipments.value;
  }

  async function getListEquipmentsByQuery(
    params: EquipmentQueryParams
  ): Promise<EquipmentResultList> {
    const query = convertObjectToSearchParams(params); // convert to URLSearchParams inside the store

    const res = await equipmentApi.getListEquipmentsByQuery(query);
    totalItems.value = res.length;
    listEquipments.value = res;
    return listEquipments.value;
  }
});
```
