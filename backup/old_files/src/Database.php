<?php

namespace App;

use PDO;
use PDOException;

class Database {
    private static $pdo;

    public static function getConnection() {
        if (self::$pdo === null) {
            self::createConnection();
        } else {
            // Bağlantının hala aktif olup olmadığını kontrol et
            try {
                self::$pdo->query('SELECT 1');
            } catch (PDOException $e) {
                // Bağlantı kopmuşsa yeniden oluştur
                self::$pdo = null;
                self::createConnection();
            }
        }
        return self::$pdo;
    }

    private static function createConnection() {
        $config = require __DIR__ . '/../config/database.php';
        $dsn = "mysql:host={$config['host']};dbname={$config['dbname']};charset={$config['charset']}";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_TIMEOUT            => 60, // 60 seconds timeout
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8 COLLATE utf8_general_ci",
        ];
        try {
            self::$pdo = new PDO($dsn, $config['user'], $config['password'], $options);
            
            // MySQL 5.1.73 için optimize edilmiş ayarlar
            self::$pdo->exec("SET NAMES utf8 COLLATE utf8_general_ci");
            self::$pdo->exec("SET CHARACTER SET utf8");
            self::$pdo->exec("SET SESSION wait_timeout = 28800"); // 8 saat
            self::$pdo->exec("SET SESSION interactive_timeout = 28800"); // 8 saat
            self::$pdo->exec("SET SESSION net_read_timeout = 600"); // 10 dakika
            self::$pdo->exec("SET SESSION net_write_timeout = 600"); // 10 dakika
            // self::$pdo->exec("SET SESSION max_allowed_packet = 268435456"); // 256MB - SADECE GLOBAL
            
        } catch (PDOException $e) {
            throw new PDOException($e->getMessage(), (int)$e->getCode());
        }
    }

    /**
     * Bağlantının aktif olup olmadığını kontrol eder
     */
    public static function checkConnection() {
        try {
            self::getConnection()->query('SELECT 1');
            return true;
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * Bağlantıyı yeniden oluşturur
     */
    public static function reconnect() {
        self::$pdo = null;
        return self::getConnection();
    }
}

