/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import AsyncAutocomplete, {AsyncAutocompleteComponent} from "../../../components/AsyncAutocomplete";
import GridSelected from "../../../components/GridSelected";
import GridSelectedItem from "../../../components/GridSelectedItem";
import {FormControl, FormHelperText, Grid, Typography} from "@material-ui/core";
import useHttpHandled from "../../../hooks/useHttpHandled";
import genreHttp from "../../../util/http/genre-http";
import useCollectionManager from "../../../hooks/useCollectionManager";
import {FormControlProps} from "@material-ui/core";
import {getGenresFromCategory} from "../../../util/model-filters";
import {MutableRefObject, RefAttributes, useImperativeHandle, useRef} from "react";

interface GenreFieldProps extends RefAttributes<GenreFieldComponent> {
    genres: any[],
    setGenres: (genres) => void,
    categories: any[],
    setCategories: (categories) => void,
    error: any,
    disabled?: boolean;
    FormControlProps?: FormControlProps
}

export interface GenreFieldComponent {
    clear: () => void
}

const GenreField = React.forwardRef<GenreFieldComponent, GenreFieldProps>((props, ref) => {
    const {
        genres,
        setGenres,
        categories,
        setCategories,
        error,
        disabled
    } = props;
    const autocompleteHttp = useHttpHandled();
    const {addItem, removeItem} = useCollectionManager(genres, setGenres);
    const {removeItem: removeCategory} = useCollectionManager(categories, setCategories);
    const autocompleteRef = useRef() as MutableRefObject<AsyncAutocompleteComponent>;

    const fetchOptions = (searchText) => autocompleteHttp(
        genreHttp
            .list({
                queryParams: {
                    search: searchText, all: ""
                }
            })
    ).then(data => data.data);

    useImperativeHandle(ref, () => ({
        clear: () => autocompleteRef.current.clear()
    }));

    return (
        <>
            <AsyncAutocomplete
                ref={autocompleteRef}
                fetchOptions={fetchOptions}
                AutocompleteProps={{
                    //autoSelect: true,
                    clearOnEscape: true,
                    freeSolo: true,
                    getOptionSelected: (option, value) => option.id === value.id,
                    getOptionLabel: option => option.name,
                    onChange: (event, value) => addItem(value),
                    disabled
                }}
                TextFieldProps={{
                    label: 'Gêneros',
                    error: error !== undefined
                }}
            />
            <FormHelperText style={{height: '24px'}}>
                Escolha os gêneros dos vídeos
            </FormHelperText>
            <FormControl
                margin={"normal"}
                fullWidth
                error={error !== undefined}
                disabled={disabled === true}
                {...props.FormControlProps}
            >
                <GridSelected>
                    {genres.map((genre, key) => (
                        <GridSelectedItem key={key}
                                          onDelete={() => {
                                              const categoriesWithOneGenre = categories
                                                  .filter(category => {
                                                      const genresFroMCategory = getGenresFromCategory(genres, category);
                                                      return genresFroMCategory.length === 1 && genres[0].id === genre.id
                                                  });
                                              categoriesWithOneGenre.forEach(cat => removeCategory(cat))
                                              removeItem(genre)
                                          }} xs={12}>
                            <Typography noWrap={true}>
                                {genre.name}
                            </Typography>
                        </GridSelectedItem>
                    ))
                    }
                </GridSelected>
                {
                    error && <FormHelperText>{error.message}</FormHelperText>
                }
            </FormControl>
        </>
    );
});

export default GenreField;