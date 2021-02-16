import * as React from "react";
import { useContext, useEffect, useRef, useState } from "react";
import format from "date-fns/format";
import parseISO from "date-fns/parseISO";
import categoryHttp from "../../util/http/category-http";
import { BadgeNo, BadgeYes } from "../../components/Badge";
import { ListResponse, Category } from "../../util/model";
import DefaultTable, {
  makeActionStyles,
  TableColumn,
  TableComponent,
} from "../../components/Table";
import { useSnackbar } from "notistack";
import { IconButton, MuiThemeProvider } from "@material-ui/core";
import { Link } from "react-router-dom";
import EditIcon from "@material-ui/icons/Edit";
import { FilterResetButton } from "../../components/Table/FilterResetButton";
import useFilter from "../../hooks/useFilter";
import LoadingContext from "../../components/loading/LoadingContext";

const columnsDefinitions: TableColumn[] = [
  {
    name: "id",
    label: "ID",
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
    width: "4%",
    options: {
      filterOptions: {
        names: ["Sim", "Não"],
      },
      customBodyRender(value, tableMeta, updateValue) {
        return value ? <BadgeYes /> : <BadgeNo />;
      },
    },
  },
  {
    name: "created_at",
    label: "Criado em",
    width: "10%",
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
      sort: false,
      filter: false,
      customBodyRender: (value, tableMeta, updateValue) => {
        return (
          <span>
            <IconButton
              color={"secondary"}
              component={Link}
              to={`/categories/${tableMeta.rowData[0]}/edit`}
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
  const snackbar = useSnackbar();
  const subscribed = useRef(true);
  const [data, setData] = useState<Category[]>([]);
  const loading = useContext(LoadingContext);
  const tableRef = useRef() as React.MutableRefObject<TableComponent>;

  const {
    columns,
    filterManager,
    cleanSearchText,
    filterState,
    debouncedFilterState,
    dispatch,
    totalRecords,
    setTotalRecords,
  } = useFilter({
    columns: columnsDefinitions,
    debounceTime: debounceTime,
    rowsPerPage,
    rowsPerPageOptions,
    tableRef,
  });

  useEffect(() => {
    subscribed.current = true;
    getData();
    return () => {
      subscribed.current = false;
    };
  }, [
    cleanSearchText(debouncedFilterState.search),
    debouncedFilterState.pagination.page,
    debouncedFilterState.pagination.per_page,
    debouncedFilterState.order,
  ]);

  async function getData() {
    try {
      const { data } = await categoryHttp.list<ListResponse<Category>>({
        queryParams: {
          search: cleanSearchText(filterState.search),
          page: filterState.pagination.page,
          per_page: filterState.pagination.per_page,
          sort: filterState.order.sort,
          dir: filterState.order.dir,
        },
      });
      if (subscribed.current) {
        setData(data.data);
        setTotalRecords(data.meta.total);
      }
    } catch (error) {
      if (categoryHttp.isCancelledRequest(error)) {
        return;
      }
      snackbar.enqueueSnackbar("Não foi possivel carregar as informações", {
        variant: "error",
      });
    }
  }

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
          serverSide: true,
          responsive: "scrollMaxHeight",
          searchText: filterState.search as any,
          page: filterState.pagination.page - 1,
          rowsPerPage: filterState.pagination.per_page,
          rowsPerPageOptions,
          count: totalRecords,
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
