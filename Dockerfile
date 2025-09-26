# Backend Dockerfile

# Environment
FROM php:8.3-apache
ADD --chmod=0755 https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/

# Apache configs
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf
RUN a2enmod rewrite headers

# Install PHP extensions
RUN install-php-extensions zip xdebug
RUN docker-php-ext-install pdo pdo_mysql

# Composer install
WORKDIR /var/www/html
COPY composer.json composer.lock ./
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN composer install --no-scripts --no-autoloader

# Copy app code
COPY . .

# Run composer autoloader dump after code is copied
RUN composer dump-autoload --optimize

# Mako app env
ENV MAKO_ENV docker

# Set permissions
RUN chown -R www-data:www-data /var/www/html/app/storage
RUN chmod -R 775 /var/www/html/app/storage

# Runtime configs
COPY docker/docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]
CMD ["apache2-foreground"]