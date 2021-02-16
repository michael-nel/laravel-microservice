import * as React from 'react';
import {Form} from "../cast-member/Form";
import {Page} from "../../components/Page";

type Props = {

};
const PageForm = (props: Props) => {
    return (
        <div>
            <Page title={'Criar Membros de Elenco'}>
                <Form/>
            </Page>
        </div>
    );
};

export default PageForm;
