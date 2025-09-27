# ------- Frontend build stage -------
FROM node:21.6 AS frontend-build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# ------- Base stage -------
FROM php:8.3-apache AS base
WORKDIR /var/www/html
ADD --chmod=0755 https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/

ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf
RUN a2enmod rewrite headers

# ------- Prod stage -------
FROM base AS prod

# Install PHP extensions
RUN install-php-extensions pdo pdo_mysql zip

# Install composer dependencies (separate layer to leverage Docker cache)
COPY composer.json composer.lock ./
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN composer install --no-dev --no-scripts --no-autoloader --optimize-autoloader

# Application code
COPY . .

# Copy frontend assets
COPY --from=frontend-build /app/node_modules/bootstrap-icons/font/fonts /var/www/html/public/assets/fonts
COPY --from=frontend-build /app/public/build /var/www/html/public/build

# Optimized autoloader
RUN composer dump-autoload --optimize

# Framework environment
ENV MAKO_ENV=prod

# Permissions for storage
RUN chown -R www-data:www-data /var/www/html/app/storage \
 && chmod -R 775 /var/www/html/app/storage

# Entrypoint and start
COPY docker/backend/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]
CMD ["apache2-foreground"]

# ------- Dev stage -------
FROM base AS dev

# Install system dependencies manually for zip so they stick around for composer commands
# (install-php-extensions cleans up installs after itself)
RUN apt update && apt install -y zip unzip libzip-dev \
 && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN install-php-extensions pdo pdo_mysql zip xdebug

# Framework environment
ENV MAKO_ENV=docker

# Entrypoint and start
COPY docker/backend/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]
CMD ["apache2-foreground"]