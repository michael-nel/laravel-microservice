import * as React from 'react';
import {makeStyles, Theme} from "@material-ui/core/styles";
import {useEffect, useState} from "react";
import castMemberHttp from "../../util/http/cast-member-http";
import {useParams, useHistory} from 'react-router'
import {
    Box,
    Button,
    ButtonProps,
    FormControl,
    FormControlLabel, FormHelperText,
    FormLabel,
    Radio,
    RadioGroup,
    TextField
} from "@material-ui/core";

import useForm from "react-hook-form";
import * as yup from "../../util/vendor/yup";
import {useSnackbar} from "notistack";
import {CastMember} from "../../util/model";

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
    type: yup.number()
        .label('Tipo')
        .required(),
});

export const Form = () => {
    const {register, handleSubmit, getValues, setValue, errors, reset, watch} = useForm({
        validationSchema,
    });

    const classes = useStyles();
    const {enqueueSnackbar} = useSnackbar();
    const history = useHistory();
    const {id} = useParams();
    const [castMember, setCastMember] = useState< CastMember | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const buttonProps: ButtonProps ={
        className: classes.submit,
        color: 'secondary',
        variant: "contained",
        disabled: loading
    };

    useEffect(() => {
        if(!id){
            return;
        }

        async function getCastMember(){
            setLoading(true);
            try{
                const {data} = await castMemberHttp.get(id)
                setCastMember(data.data);
                reset(data.data);
            } catch(error) {
                enqueueSnackbar(
                    'Não foi possivel carregas as informações',
                    { variant: 'error',}
                )
            } finally {
                setLoading(false);
            }
        }
        getCastMember();
    }, [id, reset, enqueueSnackbar])

    useEffect(() => {
        register({name: 'type'})
    }, [register]);

    async function onSubmit(formData, event) {
        setLoading(true);

        try{
            const http = !castMember
                ?castMemberHttp.create({})
                : castMemberHttp.update(castMember.id, formData);
            const {data} = await http;
            enqueueSnackbar(
                'Membro de elenco salvo com sucesso',
                {variant: 'success'}
            );
            setTimeout( () =>{
               event
               ?(
                   id
                   ? history.replace(`/cast-members/${data.data.id}/edit`)
                       : history.push(`/cast-members/${data.data.id}/edit`)
                   )
                   : history.push('/cast-members')
            });
        } catch(error) {
            enqueueSnackbar(
                'Não foi possivel salvar o membro de elenco',
                {variant: 'error'}
            )
        } finally {
            setLoading(false)
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

            <FormControl
                margin={"normal"}
                error={errors.type !== undefined}
                disabled={loading}
            >
            <FormLabel component={'legend'}>Tipo</FormLabel>
            <RadioGroup
                name={'type'}
                onChange={(e) => {
                    setValue('type', parseInt(e.target.value));
                }}
                value={watch('type') + ""}
            >
                <FormControlLabel value={'0'} control={<Radio color={'primary'}/>} label={"Diretor"}/>
                <FormControlLabel value={'1'} control={<Radio color={'primary'}/>} label={'Ator'}/>
            </RadioGroup>
                {
                    errors.type
                    ? <FormHelperText id="type-helper-text">{errors.type.message}</FormHelperText>
                        : null
                }
            </FormControl>
        <Box dir={'rtl'}>
            <Button {...buttonProps} onClick={()=> onSubmit(getValues(),null)}>Salvar</Button>
            <Button {...buttonProps} type="submit">Salvar e continuar editando</Button>
        </Box>
        </form>
    );
};
