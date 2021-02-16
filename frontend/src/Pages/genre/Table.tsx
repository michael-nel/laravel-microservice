import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import format from "date-fns/format";
import parseISO from "date-fns/parseISO";
import {
  CastMemberTypeMap,
  Category,
  Genre,
  ListResponse,
} from "../../util/model";
import genreHttp from "../../util/http/genre-http";
import { IconButton, MuiThemeProvider } from "@material-ui/core";
import { Link } from "react-router-dom";
import EditIcon from "@material-ui/icons/Edit";
import DefaultTable, {
  makeActionStyles,
  TableColumn,
  TableComponent,
} from "../../components/Table";
import { useSnackbar } from "notistack";
import useFilter from "../../hooks/useFilter";
import * as yup from "../../util/vendor/yup";
import { FilterResetButton } from "../../components/Table/FilterResetButton";
import { BadgeNo, BadgeYes } from "../../components/Badge";
import categoryHttp from "../../util/http/category-http";
import { invert } from "lodash";

const columnsDefinitions: TableColumn[] = [
  {
    name: "id",
    label: "Id",
    width: "30%",
    options: {
      sort: false,
      filter: false,
    },
  },
  {
    name: "name",
    label: "Nome",
    width: "43%",
    options: {
      filter: false,
    },
  },
  {
    name: "is_active",
    label: "Ativo?",
    width: "4p%",
    options: {
      customBodyRender(value) {
        return value ? <BadgeYes /> : <BadgeNo />;
      },
    },
  },
  {
    name: "categories",
    label: "Categorias",
    width: "20%",
    options: {
      filterType: "multiselect",
      filterOptions: {
        names: [],
      },
      customBodyRender: (value, tableMeta, updateValue) => {
        return value.map((value) => value.name).join(", ");
      },
    },
  },
  {
    name: "created_at",
    label: "Criado em",
    options: {
      filter: false,
      customBodyRender(value, tableMeta, updateValue) {
        return <span>{format(parseISO(value), "dd/MM/yyyy")}</span>;
      },
    },
  },
  {
    name: "actions",
    label: "Ações",
    width: "13%",
    options: {
      filter: false,
      sort: false,
      customBodyRender: (value, tableMeta, updateValue) => {
        return (
          <span>
            <IconButton
              color={"secondary"}
              component={Link}
              to={`/genres/${tableMeta.rowData[0]}/edit`}
            >
              <EditIcon />
            </IconButton>
          </span>
        );
      },
    },
  },
];

const debounceTime = 300;
const debouncedSearchTime = 300;
const rowsPerPage = 15;
const rowsPerPageOptions = [15, 20, 50];

const Table = () => {
  const { enqueueSnackbar } = useSnackbar();
  const subscribed = useRef(true);
  const [data, setData] = useState<Genre[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>();
  const tableRef = useRef() as React.MutableRefObject<TableComponent>;

  const extraFilter = useMemo(
    () => ({
      createValidationSchema: () => {
        return yup.object().shape({
          categories: yup
            .mixed()
            .nullable()
            .transform((value) => {
              return !value || value === "" ? undefined : value.split(",");
            })
            .default(null),
        });
      },
      formatSearchParams: (debouncedState) => {
        return debouncedState.extraFilter
          ? {
              ...(debouncedState.extraFilter.type && {
                type: debouncedState.extraFilter.categories.join(","),
              }),
            }
          : undefined;
      },
      getStateFromURL: (queryParams) => {
        return {
          type: queryParams.get("categories"),
        };
      },
    }),
    []
  );

  const {
    columns,
    filterManager,
    cleanSearchText,
    filterState,
    debouncedFilterState,
    totalRecords,
    setTotalRecords,
  } = useFilter({
    columns: columnsDefinitions,
    debounceTime: debounceTime,
    rowsPerPage,
    rowsPerPageOptions,
    tableRef,
    extraFilter,
  });

  const searchText = cleanSearchText(filterState.search);
  const indexColumnCategories = columns.findIndex(
    (c) => c.name === "categories"
  );
  const columnCategories = columns[indexColumnCategories];
  const categoriesFilterValue =
    filterState.extraFilter && filterState.extraFilter.categories;

  (columnCategories.options as any).filterList = categoriesFilterValue
    ? categoriesFilterValue
    : [];
  const serverSideFilterList = columns.map((column) => []);
  if (categoriesFilterValue) {
    serverSideFilterList[indexColumnCategories] = categoriesFilterValue;
  }

  const getData = useCallback(
    async ({ search, page, per_page, sort, dir, type }) => {
      setLoading(true);
      try {
        const { data } = await genreHttp.list<ListResponse<Genre>>({
          queryParams: {
            search,
            page,
            per_page,
            sort,
            dir,
            ...(type && {
              type: invert(CastMemberTypeMap)[type],
            }),
          },
        });
        if (subscribed.current) {
          setData(data.data);
          setTotalRecords(data.meta.total);
        }
      } catch (error) {
        if (genreHttp.isCancelledRequest(error)) {
          return;
        }
        enqueueSnackbar("Não foi possivel carregar as informações", {
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [enqueueSnackbar, setTotalRecords]
  );

  useEffect(() => {
    let isSubscribed = true;
    (async () => {
      try {
        const { data } = await categoryHttp.list({ queryParams: { all: "" } });
        if (isSubscribed) {
          setCategories(data.data);
          (columnCategories.options as any).filterOptions.names = data.data.map(
            (category) => category.name
          );
        }
      } catch (error) {
        enqueueSnackbar("Não foi possivel carregas as informações", {
          variant: "error",
        });
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, []);

  useEffect(() => {
    subscribed.current = true;
    getData({
      search: searchText,
      page: filterState.pagination.page,
      per_page: filterState.pagination.per_page,
      sort: filterState.order.sort,
      dir: filterState.order.dir,
      ...(debouncedFilterState.extraFilter &&
        debouncedFilterState.extraFilter.type && {
          type: debouncedFilterState.extraFilter.type,
        }),
    });
    return () => {
      subscribed.current = false;
    };
  }, [
    getData,
    searchText,
    debouncedFilterState.pagination.page,
    debouncedFilterState.pagination.per_page,
    debouncedFilterState.order,
    debouncedFilterState.extraFilter,
  ]);

  return (
    <MuiThemeProvider theme={makeActionStyles(columnsDefinitions.length - 1)}>
      <DefaultTable
        title={""}
        columns={columns}
        data={data}
        isLoading={loading}
        debouncedSearchTime={debouncedSearchTime}
        ref={tableRef}
        options={{
          serverSideFilterList,
          serverSide: true,
          responsive: "scrollMaxHeight",
          searchText: filterState.search as any,
          page: filterState.pagination.page - 1,
          rowsPerPage: filterState.pagination.per_page,
          rowsPerPageOptions,
          count: totalRecords,
          onFilterChange: (column, filterList) => {
            const columnIndex = columns.findIndex((c) => c.name === column);
            filterManager.changeExtraFilter({
              [column]: filterList[columnIndex].length
                ? filterList[columnIndex]
                : null,
            });
          },
          customToolbar: () => (
            <FilterResetButton
              handleClick={() => filterManager.resetFilter()}
            />
          ),
          onSearchChange: (value) => filterManager.changeSearch(value),
          onChangePage: (page) => filterManager.changePage(page),
          onChangeRowsPerPage: (perPage) =>
            filterManager.changeRowsPerPage(perPage),
          onColumnSortChange: (changeColumn: string, direction: string) =>
            filterManager.changeColumnSort(changeColumn, direction),
        }}
      />
    </MuiThemeProvider>
  );
};

export default Table;
