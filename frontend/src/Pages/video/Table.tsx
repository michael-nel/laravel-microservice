import * as React from 'react';
import DefaultTable, {makeActionStyles, TableColumn, TableComponent} from "../../components/Table";
import format from "date-fns/format";
import parseISO from "date-fns/parseISO";
import {IconButton, MuiThemeProvider} from "@material-ui/core";
import {Link} from "react-router-dom";
import EditIcon from "@material-ui/icons/Edit";
import {useSnackbar} from "notistack";
import {useEffect, useRef, useState} from "react";
import {ListResponse, Video} from "../../util/model";
import useDeleteCollection from "../../hooks/useDeleteCollection";
import videoHttp from "../../util/http/video-http";
import {FilterResetButton} from "../../components/Table/FilterResetButton";
import DeleteDialog from "../../components/DeleteDialog";
import useFilter from "../../hooks/useFilter";

const columnsDefinitions: TableColumn[] = [
    {
        name: "id",
        label: "Id",
        width: '30%',
        options: {
            sort: false,
            filter: false
        }
    },
    {
        name: "title",
        label:"Título",
        width: '20%',
        options: {
            filter: false
        }
    },
    {
        name: 'genres',
        label: "Gêneros",
        width: "13%",
        options: {
            sort: false,
            filter: false,
            customBodyRender(value,){
                return value.map(value => value.name).join(', ');
            }
        }
    },
    {
        name: "categories",
        label: "Categorias",
        width: '12%',
        options: {
            sort:false,
            filter:false,
            customBodyRender: (value, tableMeta, updateValue) => {
                return value.map(value => value.name).join(', ');
            }
        }
    },
    {
        name: "created_at",
        label: "Criado em",
        options: {
            filter: false,
            customBodyRender(value, tableMeta, updateValue) {
                return <span>{format(parseISO(value), 'dd/MM/yyyy')}</span>
            }
        }
    },
    {
        name: 'actions',
        label: 'Ações',
        width: '13%',
        options: {
            filter: false,
            sort: false,
            customBodyRender: (value, tableMeta, updateValue) => {
                return (
                    <span>
                        <IconButton
                            color={'secondary'}
                            component={Link}
                            to={`/videos/${tableMeta.rowData[0]}/edit`}
                        >
                            <EditIcon/>
                        </IconButton>
                    </span>
                )
            }
        }
    }
];

const debounceTime = 300;
const debouncedSearchTime = 300;
const rowsPerPage = 15;
const rowsPerPageOptions = [15,25,50];
const Table = () => {
    const snackbar = useSnackbar();
    const subscribed = useRef(true);
    const [data, setData] = useState<Video[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const {openDeleteDialog, setOpenDeleteDialog, rowsToDelete, setRowsToDelete} = useDeleteCollection();
    const tableRef = useRef() as React.MutableRefObject<TableComponent>;

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
        tableRef
    });

    useEffect( () => {
        subscribed.current = true;
        getData();
        return () => {
            subscribed.current = false;
        }
    }, [
        cleanSearchText(debouncedFilterState.search),
        debouncedFilterState.pagination.page,
        debouncedFilterState.pagination.per_page,
        debouncedFilterState.order
    ]);

    async function getData() {
        setLoading(true);
        try {
            const {data} = await videoHttp.list<ListResponse<Video>>({
                queryParams: {
                    search: cleanSearchText(debouncedFilterState.search),
                    page: debouncedFilterState.pagination.page,
                    per_page: debouncedFilterState.pagination.per_page,
                    sort: debouncedFilterState.order.sort,
                    dir: debouncedFilterState.order.dir,
                }
            });
            if(subscribed.current) {
                setData(data.data);
                setTotalRecords(data.meta.total);
                if(openDeleteDialog) {
                    setOpenDeleteDialog(false);
                }
            }
        } catch (error) {
            if(videoHttp.isCancelledRequest(error)) {
                return ;
            }
            snackbar.enqueueSnackbar(
                'Não foi possivel carregar as informações',
                {variant: 'error',}
            )
        } finally {
            setLoading(false);
        }
    }

    function deleteRows(confirmed: boolean) {
        if(!confirmed) {
            setOpenDeleteDialog(false);
            return;
        }
        const ids = rowsToDelete
            .data
            .map((value) => data[value.index].id)
            .join(',');
        videoHttp
            .deleteCollection({ids})
            .then(response => {
                snackbar.enqueueSnackbar(
                    'Registros excluidos salvo com sucesso',
                    {variant: 'success'}
                );
                if(rowsToDelete.data.length === filterState.pagination.per_page
                && filterState.pagination.page > 1){
                    const page = filterState.pagination.page - 2;
                    filterManager.changePage(page);
                } else {
                    getData()
                }
            })
            .catch((error) => {
                console.error(error);
                snackbar.enqueueSnackbar(
                    'Não foi possivel excluir os registros',
                    {variant: 'error',}
                )
            })
    }

    return (
        <MuiThemeProvider theme={makeActionStyles(columnsDefinitions.length - 1)}>
            <DeleteDialog open={openDeleteDialog} handleClose={deleteRows}/>
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
                    onChangeRowsPerPage: (perPage) => filterManager.changeRowsPerPage(perPage),
                    onColumnSortChange: (changeColumn: string, direction: string) =>
                        filterManager.changeColumnSort(changeColumn, direction),
                    onRowsDelete: (rowsDeleted: any[]) => {
                        console.log(rowsDeleted);
                        setRowsToDelete(rowsDeleted as any);
                        return false;
                    }
                }}
            />
        </MuiThemeProvider>
    );
};

export default Table;