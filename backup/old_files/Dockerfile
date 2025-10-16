# PHP-FPM için temel imajı belirle
FROM php:8.1-fpm

# Gerekli PHP eklentilerini ve araçları kur
RUN apt-get update && apt-get install -y \
    libxml2-dev \
    libcurl4-openssl-dev \
    libfcgi-bin \
    && docker-php-ext-install \
    pdo_mysql \
    sockets \
    curl \
    xmlwriter

# PHP-FPM timeout ayarlarını yapılandır
RUN echo "request_terminate_timeout = 300s" >> /usr/local/etc/php-fpm.d/www.conf && \
    echo "max_execution_time = 300" >> /usr/local/etc/php/php.ini && \
    echo "max_input_time = 300" >> /usr/local/etc/php/php.ini && \
    echo "memory_limit = 512M" >> /usr/local/etc/php/php.ini && \
    echo "default_socket_timeout = 300" >> /usr/local/etc/php/php.ini

# Çalışma dizinini ayarla
WORKDIR /var/www/html
