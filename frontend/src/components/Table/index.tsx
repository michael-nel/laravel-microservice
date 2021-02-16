import * as React from 'react';
import MUIDataTable, {
    MUIDataTableColumn,
    MUIDataTableOptions,
    MUIDataTableProps
} from "mui-datatables";
import {merge, omit, cloneDeep} from 'lodash';
import {MuiThemeProvider, Theme, useMediaQuery, useTheme} from "@material-ui/core";
import DebounceTableSearch from './DebouncedTableSearch'
import {RefAttributes} from "react";

const makeDefaultOptions = (debouncedSearchTime?):  MUIDataTableOptions => ({
    print: false,
    download: false,
    textLabels: {
        body: {
            noMatch: "Nenhum registro encontrado",
            toolTip: "Classificar",
        },
        pagination: {
            next: "Próxima página",
            previous: "Página anterior",
            rowsPerPage: "Por páginas",
            displayRows: "de",
        },
        toolbar: {
            search: "Busca",
            downloadCsv: "Dowload CSV",
            print: "Imprimir",
            viewColumns: "Ver Colunas",
            filterTable: "Filtrar Tabelas",
        },
        filter: {
            all: "Todos",
            title: "FILTROS",
            reset: "LIMPAR"
        },
        viewColumns: {
            title: "Ver Colunas",
            titleAria: "Ver/Esconder Colunas da Tabela",
        },
        selectedRows: {
            text: "registros(s) selecionados",
            delete: "Excluir",
            deleteAria: "Excluir registros selecionados",
        },
    },
    customSearchRender: (searchText: string,
                         handleSearch: any,
                         hideSearch: any,
                         options: any) => {
        return <DebounceTableSearch
        searchText={searchText}
        onSearch={handleSearch}
        hideSearch={hideSearch}
        options={options}
        debounceTime={debouncedSearchTime}
        />
    }
});
export interface TableColumn extends MUIDataTableColumn {
    width?: string
}

export interface TableComponent {
    changePage: (page: number) => void;
    changeRowsPerPage: (rowsPerPage: number) => void;
    clear: () => void;
}

export interface TableProps extends MUIDataTableProps,RefAttributes<TableComponent> {
     columns: TableColumn[];
     isLoading?: boolean;
     debouncedSearchTime?: number;
}

const Table = React.forwardRef<TableComponent, TableProps>((props, ref) => {

    const theme = cloneDeep<Theme>(useTheme());
    const isSmOrDown = useMediaQuery(theme.breakpoints.down('sm'));
    const defaultOptions = makeDefaultOptions(props.debouncedSearchTime);
    const newProps = merge(
        { options: cloneDeep(defaultOptions)},
        props,
        {columns: extractMuiDataTableColumns(props.columns)},
    );

    function applyResponse() {
        newProps.options.responsive = isSmOrDown  ? 'stacked' : 'scrollMaxHeight';
    }

    function extractMuiDataTableColumns(columns: TableColumn[]) : MUIDataTableColumn[] {
        setColumnsWidth(columns);
        return columns.map(column => omit(column, 'width'))
    }

    function setColumnsWidth(columns: TableColumn[]){
        columns.forEach((column, key) => {
            if(column.width){
                let overrides = theme.overrides as any;
                overrides.MUIDataTableHeadCell.fixedHeader[`&:nth-child(${key + 2})`] = {
                    width: column.width
                }
            }
        })
    }

    function applyLoading(){
        const textLabels = (newProps.options as any).textLabels;
        textLabels.body.noMatch = newProps.isLoading === true
            ? 'Carregando...'
            :  textLabels.body.noMatch;
    }

    function getOriginalMuiDataTableProps(){
        return {
            ...omit(newProps,'isLoading'),
             ref }
    }

    applyLoading();
    applyResponse();
    const originalProps = getOriginalMuiDataTableProps();

    return (
        <MuiThemeProvider theme={theme}>
            <MUIDataTable {...originalProps}/>
        </MuiThemeProvider>
    );
});

export default Table;

export function makeActionStyles(column) {
    return theme => {
        const copyTheme = cloneDeep(theme);
        const selector = `&[data-testid^="MuiDataTableBodyCell-${column.length-1}"]`;
        (copyTheme.overrides as any).MUIDataTableBodyCell.root[selector] = {
            paddingTop: '0px',
            paddingBottom: '0px'
        };
        return copyTheme;
    }
}
