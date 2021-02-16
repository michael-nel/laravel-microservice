import * as React from 'react';
import LoadingContext from './LoadingContext';
import {useState, useMemo, useEffect} from "react";
import {omit} from 'lodash'
import {
    addGlobalRequestInterceptor,
    addGlobalResponseInterceptor,
    removeGlobalRequestInterceptor,
    removeGlobalResponseInterceptor
} from "../../util/http";

export const LoadingProvider = (props) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [countRequest, setCountRequest] = useState(0);

    useMemo(() => {
        let isSubscribed = true;
        const requestIds = addGlobalRequestInterceptor((config) => {
            if (isSubscribed && !config.headers.hasOwnProperty('ignoredLoading')) {
                setLoading(true);
                setCountRequest((prevCountRequest) => prevCountRequest + 1);
            }
            config.headers = omit(config.headers,'ignoreLoading')
            return config;
        })

        const responseIds = addGlobalResponseInterceptor(
            (response) => {
                if (isSubscribed && !response.config.headers.hasOwnProperty('ignoredLoading')) {
                    decrementCountRequest();
                }
                return response;
            }, (error) => {
                if (isSubscribed && !error.config.headers.hasOwnProperty('ignoredLoading')) {
                    decrementCountRequest();
                }
                return Promise.reject(error);
            });
        return () => {
            isSubscribed = false;
            removeGlobalRequestInterceptor(requestIds);
            removeGlobalResponseInterceptor(responseIds);
        }
    }, [true]);

    useEffect( () => {
        if(!countRequest){
            setLoading(false);
        }
    },[countRequest])

    function decrementCountRequest() {
        setCountRequest((prevCountRequest) => prevCountRequest - 1);
    }

    return (
        <LoadingContext.Provider value={loading}>
            {props.children}
        </LoadingContext.Provider>
    );
};