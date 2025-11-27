# ---------- 1. Use PHP with necessary extensions ----------
FROM php:8.3-fpm

# Set working directory
WORKDIR /var/www/html

# ---------- 2. Install system dependencies ----------
RUN apt-get update \
    && apt-get install -y git curl zip unzip libpng-dev libonig-dev libxml2-dev libzip-dev \
    && docker-php-ext-install pdo_mysql mysqli mbstring zip exif pcntl bcmath gd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ---------- 3. Install Composer ----------
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ---------- 4. Copy project files ----------
COPY . .

# ---------- 5. Install dependencies ----------
RUN composer install --no-dev --optimize-autoloader

# ---------- 6. Set permissions ----------
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# ---------- 7. Expose port and start PHP-FPM ----------
EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
