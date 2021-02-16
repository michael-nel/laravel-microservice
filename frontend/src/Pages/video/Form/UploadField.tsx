import * as React from 'react';
import {
    Button,
    FormControl,
} from "@material-ui/core";
import {FormControlProps} from "@material-ui/core";
import InputFile, {InputFileComponent} from "../../../components/InputFile";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import {MutableRefObject, useImperativeHandle, useRef} from "react";

interface UploadFieldProps {
    accept: string;
    label: string;
    setValue: (value) => void;
    disabled?: boolean;
    error?: any;
    FormControlProps?: FormControlProps
}

export interface UploadFieldComponent {
    clear: () => void
}

const UploadField = React.forwardRef<UploadFieldComponent, UploadFieldProps>((props, ref) => {
    const fileRef = useRef() as MutableRefObject<InputFileComponent>;
    const {accept, label, setValue, disabled, error} = props;

    useImperativeHandle(ref, () => ({
        clear: () => fileRef.current.clear()
    }))

    return (
        <FormControl
            error={error !== undefined}
            disabled={disabled === true}
            fullWidth
            margin={"normal"}
            {...props.FormControlProps}
        >
            <InputFile
                ref={fileRef}
                TextFieldProps={{
                    label: label,
                    InputLabelProps: {shrink: true},
                    style:{backgroundColor: '#ffffff'}
                }}
                InputFileProps={{
                    accept,
                    onChange(event){
                        const files = event.target.files as any;
                        files.length && setValue(files[0])
                }}
                }
                ButtonFile={
                    <Button
                        endIcon={<CloudUploadIcon/>}
                        variant={'contained'}
                        color={'primary'}
                        onClick={() => fileRef.current.openWindow() }
                    >Adicionar
                    </Button>
                }/>
        </FormControl>
    );
});

export default UploadField;