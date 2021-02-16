/* eslint-disable no-template-curly-in-string */
import {addMethod, LocaleObject, number, NumberSchema, setLocale} from 'yup';

const ptBR: LocaleObject = {
    mixed:{
        required: '${path} é requerido',
        notType: '${path} é inválido'
    },
    string: {
        max: '${path} precisa ter no máximo ${max} caracteres'
    },
    number:{
        min: '$path} precisa ser no mínimo ${min}'
    }
}
setLocale(ptBR);

addMethod<NumberSchema>(number, 'xpto', function(){
    return this.test({
        message: 'message error',
        test: (value) => {
            return true;
        }
    })
})

export * from 'yup';
