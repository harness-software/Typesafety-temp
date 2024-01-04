import { ref } from "vue";
import { acceptHMRUpdate, defineStore } from "pinia";

export const PAGE_SIZE = 10;

enum TabSlot {
  FIRST = "first",
  SECOND = "second",
  THIRD = "third",
}

type SearchHeaderData = {};
type HeaderOptions = {};

export const useSearchHeaderStore = defineStore("searchHeader", () => {
  const changeTabs = ref(TabSlot.FIRST);
  const inputSearch = ref("");
  const displayFilter = ref(false);
  const search = ref(0);
  const oldQuery = ref("");
  const totalItem = ref(0);
  const pageSize = ref(PAGE_SIZE);
  const pageNumber = ref(1);
  const isReloading = ref(false);
  const totalFilters = ref(0);
  const totalResponseItem = ref(0);
  const queryParams = ref({
    PageSize: PAGE_SIZE,
    PageNumber: 1,
  });
  const isScrollBottom = ref(false);
  const listTabsData = ref<SearchHeaderData[]>([]);
  const pendingCallAPI = ref(0); //end call pendingCallAPI =2
  const searchQueryDefault = ref(
    `&PageNumber=${pageNumber.value}&PageSize=${pageSize.value}`
  );
  const searchQuery = ref(searchQueryDefault.value);

  const headerOptions = ref<HeaderOptions>({
    title: "",
    includeTabsButton: true,
    displayReloadButton: true,
    useExtendThirdSlot: false,
    titleSlotFirst: "List",
    titleSlotSecond: "Drafts",
    titleSlotThird: "Reports",
    fabRouterName: "",
    sidebarWidth: "300px",
    placeholder: "Search",
  });

  function updateSearch(_inputSearch: string) {
    if (_inputSearch === "") {
      clearSearch();
    } else if (_inputSearch && _inputSearch.length >= 4) {
      inputSearch.value = _inputSearch;
      if (oldQuery.value !== "") {
        setSearchQuery(oldQuery.value);
      } else {
        setSearchQuery("");
      }
    }
  }
  function setReload(_isReloading: boolean) {
    isReloading.value = _isReloading;
  }
  function showFilter() {
    displayFilter.value = !displayFilter.value;
  }
  function clearSearch() {
    inputSearch.value = "";
    if (oldQuery.value !== "") {
      setSearchQuery(oldQuery.value);
    } else {
      setSearchQuery("");
    }
  }
  function setCurrentTab(newTab: TabSlot) {
    const dataSearch: SearchHeaderData = {
      currentTab: changeTabs.value,
      inputSearch: inputSearch.value,
      displayFilter: displayFilter.value,
      search: search.value,
      oldQuery: oldQuery.value,
      totalItem: totalItem.value,
      pageSize: pageSize.value,
      pageNumber: pageNumber.value,
      isReloading: isReloading.value,
      totalFilters: totalFilters.value,
    };

    let data = listTabsData.value.find(
      (x) => x.currentTab === changeTabs.value
    );
    if (!data) {
      listTabsData.value.push(dataSearch);
    } else {
      data = dataSearch;
    }

    const cacheTabData = listTabsData.value.find(
      (x) => x.currentTab === newTab
    );

    if (cacheTabData) {
      inputSearch.value = cacheTabData.inputSearch;
      displayFilter.value = cacheTabData.displayFilter;
      search.value = cacheTabData.search;
      oldQuery.value = cacheTabData.oldQuery;
      totalItem.value = cacheTabData.totalItem;
      pageSize.value = cacheTabData.pageSize;
      pageNumber.value = cacheTabData.pageNumber;
      isReloading.value = cacheTabData.isReloading;
      totalFilters.value = cacheTabData.totalFilters;
    }

    changeTabs.value = newTab;
    updateSearch(inputSearch.value);
  }

  function setFiltersCount(_totalFilters: number) {
    totalFilters.value = _totalFilters;
  }
  function setSearchQuery(query: string) {
    oldQuery.value = query;
    searchQuery.value = searchQueryDefault.value;
    if (query) {
      searchQuery.value = searchQuery.value + query;
    }
    if (inputSearch.value !== "") {
      searchQuery.value = searchQuery.value + `&Keywords=${inputSearch.value}`;
    }
  }
  //for infinite scroll

  function getQueryUrlMoreDataOnScroll() {
    const newDefaultQuery = `&PageNumber=${pageNumber.value}&PageSize=${pageSize.value}`;
    return `${newDefaultQuery + oldQuery.value}&Keywords=${inputSearch.value}`;
  }

  function getSearchAction() {
    return search;
  }
  function setHeaderOptions(headerOption: HeaderOptions) {
    headerOptions.value = headerOption;
    //clear cache store data
    inputSearch.value = "";
    displayFilter.value = false;
    search.value = 0;
    oldQuery.value = "";
    totalItem.value = 0;
    pageSize.value = PAGE_SIZE;
    pageNumber.value = 1;
    isReloading.value = false;
    totalFilters.value = 0;
    queryParams.value = {
      PageSize: PAGE_SIZE,
      PageNumber: 1,
    };
  }
  function setQueryParams<T>(_queryParams: T) {
    queryParams.value = Object.assign(queryParams.value, _queryParams);
  }

  function setDefaultQueryParams() {
    queryParams.value = {
      PageSize: PAGE_SIZE,
      PageNumber: 1,
    };
  }

  function setScrollBottom(_isScrollBottom: boolean) {
    isScrollBottom.value = _isScrollBottom;
    if (isScrollBottom.value && pendingCallAPI.value !== 2)
      pendingCallAPI.value = 1;
    if (pendingCallAPI.value === 1) {
      const newQuery = {
        PageNumber: queryParams.value.PageNumber + 1,
        PageSize: PAGE_SIZE,
      };
      setQueryParams(newQuery);
      setSearch();
    }
  }

  //set total end call API
  function setTotalResponseItem(_totalResponseItem: number) {
    totalResponseItem.value = _totalResponseItem;
    if (totalResponseItem.value <= queryParams.value.PageSize)
      pendingCallAPI.value = 2; //end call api
    else pendingCallAPI.value = 0;
  }

  //active search
  function setSearch() {
    debounce(() => {
      search.value++;
    }, 500);
  }
  return {
    queryParams,
    oldQuery,
    headerOptions,
    changeTabs,
    displayFilter,
    inputSearch,
    searchQuery,
    search,
    isReloading,
    totalFilters,
    pageNumber,
    pageSize,
    totalItem,
    isScrollBottom,
    totalResponseItem,
    getQueryUrlMoreDataOnScroll,
    setSearchQuery,
    setCurrentTab,
    showFilter,
    updateSearch,
    clearSearch, // clear search
    setSearch, //active search
    getSearchAction,
    setHeaderOptions,
    setReload,
    setFiltersCount,
    setQueryParams,
    setScrollBottom,
    setTotalResponseItem,
    setDefaultQueryParams,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(useSearchHeaderStore, import.meta.hot)
  );
}
