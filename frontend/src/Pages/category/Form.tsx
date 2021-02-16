import * as React from 'react';
import {TextField, Checkbox, FormControlLabel} from "@material-ui/core";
import categoryHttp from "../../util/http/category-http";
import * as yup from '../../util/vendor/yup';
import {useContext, useEffect, useState} from "react";
import {useParams, useHistory} from 'react-router'
import {useSnackbar} from "notistack";
import {Category} from "../../util/model";
import SubmitActions from "../../components/SubmitActions";
import {DefaultForm} from "../../components/DefaultForm";
import useForm from "react-hook-form";
import LoadingContext from "../../components/loading/LoadingContext";

const validationSchema  = yup.object().shape({
    name: yup.string()
        .label('Nome')
        .required()
        .max(255)
});

export const Form = () => {
    const {register,
           handleSubmit,
           getValues,
           setValue,
           errors,
           reset,
           watch,
           triggerValidation
    } = useForm({
            validationSchema,
        defaultValues:{
                name:'',
            is_active:true
        },
    });

    const {enqueueSnackbar} = useSnackbar();
    const history = useHistory();
    const {id} = useParams();
    const [category, setCategory] = useState< Category  | null>(null);
    const loading = useContext(LoadingContext);

    useEffect(() => {
        register({name: 'is_active'})
    },[register]);

    useEffect(() => {
        if(!id) {
            return;
        }
        async function getCategory(){
            try{
                const {data} = await categoryHttp.get(id);
                setCategory(data.data);
                reset(data.data);
            } catch(error) {
                enqueueSnackbar(
                    'Não foi possivel carregar as informações',
                    {variant: 'error',}
                )
            }
        }
        getCategory();
    }, [id, reset, enqueueSnackbar]);

    async function onSubmit(formData, event) {
        try {
            const http = !category
                ? categoryHttp.create(formData)
                : categoryHttp.update(category.id, formData)
            const {data} = await http;
            enqueueSnackbar('Categoria salva com sucesso', {
                variant: 'success'
            });
            setTimeout(() => {
                event
                    ? (
                        id ? history.replace(`/categories/${data.data.id}/edit`)
                            : history.push(`/categories/${data.data.id}/edit`)
                    )
                    : history.push('/categories')
            });
        } catch (error) {
            enqueueSnackbar(error.message,
                { variant: 'error'}
            )
        }
    }

    return (
        <DefaultForm GridItemProps={{xs:12, md:6}} onSubmit={handleSubmit(onSubmit)} >
            <TextField
            name="name"
            inputRef={register}
            label="Nome"
            fullWidth
            variant={"outlined"}
            disabled={loading}
            error={errors.name !== undefined}
            helperText={errors.name && errors.name.message}
            InputLabelProps={{shrink:true}}
            />
            <TextField
                name="description"
                inputRef={register}
                disabled={loading}
                label="Descrição"
                multiline
                rows={4}
                fullWidth
                variant={"outlined"}
                margin={"normal"}
                InputLabelProps={{shrink:true}}
            />
            <FormControlLabel
                control={
                    <Checkbox
                    name="is_active"
                    color={'primary'}
                    onChange={() => setValue('is_active', !getValues()['is_active'])}
                    checked={watch('is_active')}

                    />
                }
                label={'Ativo?'}
                labelPlacement={'end'}
            />
            <SubmitActions disabledButtons={loading}
                           handleSave={()=> triggerValidation().then(isValid => {
                               isValid  && onSubmit(getValues(),null)
                           })
                               } />
</DefaultForm>

    );
};
