#!/bin/bash

#On error no such file entrypoint.sh, execute in terminal - dos2unix .docker\entrypoint.sh
### FRONT-END
npm config set cache /var/www/.npm-cache --global
cd /var/www/frontend && npm install && cd ..
### BACK-END
cd backend
cp .env.example .env
cp .env.testing.example .env.testing
composer install
php artisan key:generate
php artisan migrate --seed
php-fpm

