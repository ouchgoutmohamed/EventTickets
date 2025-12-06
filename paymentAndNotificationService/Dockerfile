# Dockerfile pour Payment and Notification Service (Laravel)
# Optimisé pour utiliser le cache Docker

FROM php:8.4-fpm

WORKDIR /var/www/html

# 1. Installer les dépendances système
RUN apt-get update \
    && apt-get install -y git zip unzip libpng-dev libonig-dev libxml2-dev libzip-dev librabbitmq-dev libssl-dev \
    && docker-php-ext-install pdo_mysql mysqli mbstring zip exif pcntl bcmath gd sockets \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Installer Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 3. Copier uniquement composer.json et composer.lock d'abord pour le cache
COPY composer.json composer.lock ./

# 4. Installer les dépendances PHP (cette étape est mise en cache si composer.* ne change pas)
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# 5. Copier le reste des fichiers du projet
COPY . .

# 6. Create minimal .env file for Laravel (actual values come from docker-compose environment)
# DB_CONNECTION must be set here because Laravel reads it before environment variables are merged
RUN echo "APP_KEY=\nDB_CONNECTION=mysql" > .env

# 7. Finaliser l'installation (exécuter les scripts post-install)
RUN composer dump-autoload --optimize

# 8. Définir les permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
