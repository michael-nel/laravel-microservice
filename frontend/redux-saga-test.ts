
const {createStore, applyMiddleware} = require('redux')
const {default: createSagaMiddleware} = require('redux-saga');
const {take, put, call} = require('redux-saga/effects');
const axios = require('axios');

function reducer(state, action) {
    if (action.type === 'acaoX') {
        return {value: action.value}
    }
}

function* helloWorldSaga() {
    console.log('Hello!!!!')
    while (true) {
        const action = yield take('acaoY');
        const search = action.value;
        console.log('valor procura' + search)
        const response = yield call(
            () => axios.get('http://localhost:8000/api/videos?search='+search));
        console.log(response);
        const value = 'novo valor' + Math.random();
        console.log(value);
        yield  put({
            type: 'acaoX',
            value: 'novo valor'
        })
    }
}

const sagaMiddleware = createSagaMiddleware();
const store = createStore(
    reducer,
    applyMiddleware(sagaMiddleware)
);
sagaMiddleware.run(helloWorldSaga);
const action = (type, value) => store.dispatch({type, value});

action('acaoY', 'a');
action('acaoY', 'a');
action('acao2', 'a');
console.log(store.getState());