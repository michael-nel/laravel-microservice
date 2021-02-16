import * as React from 'react';
import {Page} from "../../components/Page";
import {Form} from "../genre/Form";

type Props = {

};
const PageForm = (props: Props) => {
    return (
        <div>
            <div>
                <Page title={'Criar Gêneros'}>
                    <Form/>
                </Page>
            </div>
        </div>
    );
};

export default PageForm;
