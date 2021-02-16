import * as React from 'react';
import {Form} from './Form';
import {Page} from '../../components/Page';
import {useParams} from 'react-router'

const PageForm = () => {
    const {id} = useParams();
    return (
        <div>
            <Page title={ !id ?'Criar categoria': 'Editar Categoria'}>
                <Form/>
            </Page>
        </div>
    );
};

export default PageForm;
