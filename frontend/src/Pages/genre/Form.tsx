import * as React from 'react';
import {makeStyles, Theme} from "@material-ui/core/styles";
import {Box, Button, ButtonProps, MenuItem, TextField} from "@material-ui/core";
import useForm from "react-hook-form";
import {useContext, useEffect, useState} from "react";
import genreHttp from "../../util/http/genre-http";
import categoryHttp from "../../util/http/category-http";
import * as yup from "../../util/vendor/yup";
import {useParams, useHistory} from 'react-router'
import {useSnackbar} from "notistack";
import {Category, Genre} from "../../util/model";
import LoadingContext from "../../components/loading/LoadingContext";

const useStyles = makeStyles((theme: Theme) => {
    return {
        submit: {
            margin: theme.spacing(1)
        }
    }
});

const validationSchema  = yup.object().shape({
    name: yup.string()
        .label('Nome')
        .required()
        .max(255),
    categories_id: yup.array()
        .label('Categorias')
        .required(),
});

export const Form = () => {
    const {register, handleSubmit, getValues, setValue,reset, errors, watch} = useForm({
        validationSchema,
        defaultValues: {
            name:'',
            categories_id: []
        }
    });

    const classes = useStyles();
    const {enqueueSnackbar} = useSnackbar();
    const history = useHistory();
    const {id} = useParams();
    const [genre, setGenre] = useState< Genre | null>(null);
    const[categories, setCategories] = useState<Category[]>([]);
    const loading = useContext(LoadingContext);

    const buttonProps: ButtonProps ={
        className: classes.submit,
        color: 'secondary',
        variant: "contained",
        disabled: loading
    };

    useEffect( () => {
        let isSubscribed = true;
        (async function loadData() {
            const promises = [categoryHttp.list({queryParams: {all: ''}})];
            if (id){
                promises.push(genreHttp.get(id));
                console.log(promises);
            }
            try {
                const [categoriesReponse, genreResponse] = await Promise.all(promises);
                if(isSubscribed) {
                    setCategories(categoriesReponse.data.data);
                    if (id) {
                        setGenre(genreResponse.data.data);
                        reset({
                            ...genreResponse.data.data,
                            categories_id: genreResponse.data.data.categories.map(category => category.id)
                        });
                    }
                }
            } catch(error){
                enqueueSnackbar(
                    'Não foi possivel carregar as informações',
                    {variant: 'error',}
                )
            }
        })();

        return () => {
            isSubscribed = false;
        }
    }, [id, reset, enqueueSnackbar]);

    useEffect(() => {
        register({name: "categories_id"})
    }, [register]);

    async function onSubmit(formData, event) {
        try {
            const http = !genre
            ? genreHttp.create({})
                : genreHttp.update(genre.id, formData);
            const {data} = await http;
            enqueueSnackbar(
                'Genero salvo com sucesso',
                {variant: 'success'}
            );
            setTimeout( () => {
                event
                ? (
                    id
                    ? history.replace(`/genres/${data.data.id}/edit`)
                        : history.push(`/genres/${data.data.id}/edit`)
                    )
                    : history.push( '/genres')
            });
        } catch(error) {
            enqueueSnackbar(
                'Não foi possivel salvar o genero',
                { variant: 'error'}
            )
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
                name='name'
                label='Nome'
                fullWidth
                variant={'outlined'}
                inputRef={register}
                disabled={loading}
                error={errors.name !== undefined}
                helperText={errors.name && errors.name.message}
                InputLabelProps={{shrink: true}}
            />
            <TextField
                select
                name='categories_id'
                value={watch('categories_id')}
                label='Categorias'
                margin={'normal'}
                variant={'outlined'}
                fullWidth
                onChange={(e) => {
                    setValue('categories_id', e.target.value as any);
                }}
                SelectProps={{multiple:true}}
                disabled={loading}
                error={errors.categories_id !== undefined}
                helperText ={errors.categories_id}
                InputLabelProps={{shrink:true}}
            >
                <MenuItem value="" disabled>
                    <em>Selecione categories</em>
                </MenuItem>
                {
                    categories.map(
                        (category, key) => (
                            <MenuItem key={key} value={category.id}>{category.name}</MenuItem>
                        )
                    )
                }
            </TextField>
            <Box dir={"rtl"}>
                <Button {...buttonProps} onClick={()=> onSubmit(getValues(),null)}>Salvar</Button>
                <Button {...buttonProps} type="submit">Salvar e continuar editando</Button>
            </Box>
        </form>
    );
};
