FROM php:7.3.6-fpm-alpine3.10

RUN apk add --no-cache shadow openssl bash mysql-client nodejs npm freetype-dev libjpeg-turbo-dev libpng-dev git libzip-dev
RUN docker-php-ext-install pdo pdo_mysql bcmath zip sockets
RUN docker-php-ext-configure gd --with-gd --with-freetype-dir=/usr/include/ --with-jpeg-dir=/usr/include/ --with-png-dir=/usr/include/
RUN docker-php-ext-install -j$(nproc) gd

RUN touch /home/www-data/.bashrc | echo "PS1='\w\$ '" >> /home/www-data/.bashrc

ENV DOCKERIZE_VERSION v0.6.1
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

RUN usermod -u 1000 www-data

COPY ./.docker/php/custom.ini /usr/local/etc/php/conf.d/custom.ini

WORKDIR /var/www

RUN rm -rf /var/www/html && ln -s public html

USER www-data

EXPOSE 9000