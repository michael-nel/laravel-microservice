/* eslint-disable @typescript-eslint/no-unused-vars */

import * as React from 'react';
import AsyncAutocomplete, {AsyncAutocompleteComponent} from "../../../components/AsyncAutocomplete";
import GridSelected from "../../../components/GridSelected";
import GridSelectedItem from "../../../components/GridSelectedItem";
import {FormControl, FormHelperText, Grid, Theme, Typography} from "@material-ui/core";
import useHttpHandled from "../../../hooks/useHttpHandled";
import categoryHttp from "../../../util/http/category-http";
import useCollectionManager from "../../../hooks/useCollectionManager";
import {Genre} from '../../../util/model'
import {FormControlProps} from "@material-ui/core";
import {getGenresFromCategory} from "../../../util/model-filters";
import {makeStyles} from "@material-ui/core/styles";
import {grey} from "@material-ui/core/colors";
import {MutableRefObject, RefAttributes, useImperativeHandle, useRef} from "react";

const useStyles = makeStyles((theme: Theme) => ({
    genresSubTitle: {
        color: grey['800'],
        fontSize: '0.8rem'
    }
}));

interface CategoryFieldProps extends RefAttributes<CategoryFieldComponent> {
    categories: any[],
    setCategories: (categories) => void
    genres: Genre[]
    error: any
    disabled?: boolean;
    FormControlProps?: FormControlProps
}

export interface CategoryFieldComponent {
    clear: () => void
}

const CategoryField = React.forwardRef<CategoryFieldComponent, CategoryFieldProps>((props, ref) => {
    const {categories, setCategories, genres, error, disabled} = props;
    const classes = useStyles();
    const autocompleteHttp = useHttpHandled();
    const {addItem, removeItem} = useCollectionManager(categories, setCategories);
    const autocompleteRef = useRef() as MutableRefObject<AsyncAutocompleteComponent>;

    const fetchOptions = (searchText) => autocompleteHttp(
        categoryHttp
            .list({
                queryParams: {
                    genres: genres.map(genre => genre.id).join(','), all: ""
                }
            })
    ).then(data => data.data);

    useImperativeHandle(ref, () => ({
        clear: () => autocompleteRef.current.clear()
    }))

    return (
        <>
            <AsyncAutocomplete
                ref={autocompleteRef}
                fetchOptions={fetchOptions}
                AutocompleteProps={{
                    freeSolo: false,
                    getOptionLabel: option => option.name,
                    onChange: (event, value) => addItem(value),
                    disabled: disabled === true || !genres.length

                }}
                TextFieldProps={{
                    label: 'Categorias',
                    error: error !== undefined
                }}
            />
            <FormHelperText style={{height: '24px'}}>
                Escolha pelo menos uma categoria de cada gênero
            </FormHelperText>
            <FormControl
                error={error !== undefined}
                disabled={disabled === true}
                {...props.FormControlProps}
            >
                <GridSelected>
                    {categories.map((category, key) => {
                        const genresFromCategory = getGenresFromCategory(genres, category)
                            .map(genre => genre.name)
                            .join(',');
                        return (<GridSelectedItem
                                key={key}
                                onDelete={() => removeItem(category)} xs={12}>
                                <Typography noWrap={true}>
                                    {category.name}
                                </Typography>
                                <Typography noWrap={true} className={classes.genresSubTitle}>
                                    Generos: {genresFromCategory}
                                </Typography>
                            </GridSelectedItem>
                        )
                    })
                    }
                </GridSelected>
                {
                    error && <FormHelperText>{error.message}</FormHelperText>
                }
            </FormControl>
        </>
    );
    ;
});

export default CategoryField;