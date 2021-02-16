import * as React from 'react';
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import format from 'date-fns/format'
import parseISO from 'date-fns/parseISO'
import {CastMember, ListResponse, CastMemberTypeMap} from "../../util/model";
import {IconButton, MuiThemeProvider} from "@material-ui/core";
import {Link} from "react-router-dom";
import EditIcon from "@material-ui/icons/Edit";
import DefaultTable, {makeActionStyles, TableColumn, TableComponent} from "../../components/Table";
import {useSnackbar} from "notistack";
import useFilter from "../../hooks/useFilter";
import {FilterResetButton} from "../../components/Table/FilterResetButton";
import * as yup from '../../util/vendor/yup';
import castMemberHttp from "../../util/http/cast-member-http";
import {invert} from 'lodash';

const castMemberNames = Object.values(CastMemberTypeMap);

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
        name: "name",
        label: "Nome",
        width: '43%',
        options: {
            filter: false
        }
    },
    {
        name: "type",
        label: "Tipo",
        width: '4%',
        options: {
            filterOptions: {
                names: castMemberNames
            },
            customBodyRender: (value, tableMeta, updateValue) => {
                return CastMemberTypeMap[value];
            }
        }
    },
    {
        name: "created_at",
        label: "Criado em",
        width: '10%',
        options: {
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
            sort: false,
            customBodyRender: (value, tableMeta, updateValue) => {
                return (
                    <span>
                        <IconButton
                            color={'secondary'}
                            component={Link}
                            to={`/cast-members/${tableMeta.rowData[0]}/edit`}
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
const rowsPerPageOptions = [15, 20, 50];

const Table = () => {
        const {enqueueSnackbar} = useSnackbar();
        const subscribed = useRef(true);
        const [data, setData] = useState<CastMember[]>([]);
        const [loading, setLoading] = useState<boolean>(false);
        const tableRef = useRef() as React.MutableRefObject<TableComponent>;

        const extraFilter = useMemo(() => ({
            createValidationSchema: () => {
                return yup.object().shape({
                    type: yup.string()
                        .nullable()
                        .oneOf(castMemberNames)
                        .transform(value => {
                            return !value || !castMemberNames.includes(value) ? undefined : value;
                        })
                        .default(null)
                })
            },
            formatSearchParams: (debouncedState) => {
                return debouncedState.extraFilter ? {
                    ...(
                        debouncedState.extraFilter.type &&
                        {type: debouncedState.extraFilter.type}
                    ),
                } : undefined
            },
            getStateFromURL: (queryParams) => {
                return {
                    type: queryParams.get('type')
                }
            }
        }), []);

        const {
            columns,
            filterManager,
            cleanSearchText,
            filterState,
            debouncedFilterState,
            totalRecords,
            setTotalRecords
        } = useFilter({
            columns: columnsDefinitions,
            debounceTime: debounceTime,
            rowsPerPage,
            rowsPerPageOptions,
            tableRef,
            extraFilter
        });

        const searchText = cleanSearchText(filterState.search);
        const indexColumnType = columns.findIndex(c => c.name === 'type');
        const columnType = columns[indexColumnType];
        const typeFilterValue = filterState.extraFilter && filterState.extraFilter.type as never;
        (columnType.options as any).filterList = typeFilterValue ? [typeFilterValue] : [];

        const serverSideFilterList = columns.map(column => []);
        if (typeFilterValue) {
            serverSideFilterList[indexColumnType] = [typeFilterValue]
        }
        const getData = useCallback(async ({search, page, per_page, sort, dir, type}) => {
                setLoading(true);
                try {
                    const {data} = await castMemberHttp.list<ListResponse<CastMember>>({
                        queryParams: {
                            search,
                            page,
                            per_page,
                            sort,
                            dir,
                            ...(type && {
                                type: invert(CastMemberTypeMap)[
                                    type
                                    ],
                            }),
                        },
                    });
                    if (subscribed.current) {
                        setData(data.data);
                        setTotalRecords(data.meta.total)
                    }
                } catch
                    (error) {
                    if (castMemberHttp.isCancelledRequest(error)) {
                        return;
                    }
                    enqueueSnackbar(
                        'Não foi possivel carregar as informações',
                        {variant: 'error',}
                    )
                } finally {
                    setLoading(false);
                }
            },
            [enqueueSnackbar, setTotalRecords]
            );

        useEffect(() => {
            subscribed.current = true;
            getData({

                search: searchText,
                page: filterState.pagination.page,
                per_page: filterState.pagination.per_page,
                sort: filterState.order.sort,
                dir: filterState.order.dir,
                ...(debouncedFilterState.extraFilter &&
                    debouncedFilterState.extraFilter.type &&
                    {
                        type: debouncedFilterState.extraFilter.type
                    }),
            });
            return () => {
                subscribed.current = false;
            }
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
                        onFilterChange: (column, filterList, type) => {
                            const columnIndex = columns.findIndex(c => c.name === column);
                            filterManager.changeExtraFilter({
                                [column as any]: filterList[columnIndex].length ? filterList[columnIndex][0] : null
                            })
                        },
                        customToolbar: () => (
                            <FilterResetButton
                                handleClick={() => filterManager.resetFilter()}
                            />
                        ),
                        onSearchChange: (value) => filterManager.changeSearch(value),
                        onChangePage: (page) => filterManager.changePage(page),
                        onChangeRowsPerPage: (perPage) => filterManager.changeRowsPerPage(perPage),
                        onColumnSortChange: (changeColumn: string, direction: string) =>
                            filterManager.changeColumnSort(changeColumn, direction)
                    }}
                />
            </MuiThemeProvider>
        );
    }
;

export default Table;
