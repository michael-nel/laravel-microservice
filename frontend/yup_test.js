const yup = require('yup')

// const schema = yup.object().shape({
//     name: yup
//         .string()
//         .required()
// });
//
// schema
//     .isValid({ name: ''})
//     .then(isValid => console.log(isValid));

let columns = [];

const schema = yup.object().shape({
    search: yup.string()
        .transform(value => !value ? undefined : value)
        .default(''),
    pagination: yup.object().shape(({
        page: yup.number()
            .transform(value => isNaN(value) || parseInt(value) < 1 ? undefined : value)
            .default(1),
        per_page: yup.number()
            .oneOf([10, 15, 10])
            .transform(value => isNaN(value) ? undefined : value)
            .default(15),
    })),
    order: yup.object().shape({
        sort: yup.string()
            .nullable()
            .transform(value => {
                const columnsName = columns.filter(column => !column.options || column.options.sort !== false)
                    .map(column => column.name)
                return columnsName.includes(value) ? value : undefined;
            })
            .default(null),
        dir: yup.string()
            .nullable()
            .transform(value => !value || ['asc, 'desc].includes(value.toLowerCase()) ? undefined : value)
            .default(null),
    }),
});
