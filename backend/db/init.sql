CREATE DATABASE IF NOT EXISTS technical_test_cs1;
USE technical_test_cs1;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL
);

INSERT INTO users (id, name, role) VALUES
(1, 'Client Demo', 'CLIENT'),
(2, 'Admin Dispatcher', 'ADMIN'),
(3, 'Technician A', 'TECHNICIAN'),
(4, 'Technician B', 'TECHNICIAN')
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role);

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(100) NOT NULL UNIQUE,
    client_id BIGINT UNSIGNED DEFAULT NULL,
    technician_id BIGINT UNSIGNED DEFAULT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'TO DO',
    version INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_status_histories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

INSERT INTO orders (id, order_number, client_id, technician_id, description, status, version) VALUES
(1, 'ORD-001', 1, 3, 'Perbaikan Sistem HVAC Kantor Utama', 'TO DO', 1),
(2, 'ORD-002', 1, 4, 'Maintenance Server & Network Switch', 'IN PROGRESS', 2),
(3, 'ORD-003', 1, NULL, 'Instalasi Kabel Fiber Optik Lantai 3', 'TO DO', 1),
(4, 'ORD-004', 1, 3, 'Pemeriksaan Rutin UPS & Generator Backup', 'DONE', 3)
ON DUPLICATE KEY UPDATE
order_number=VALUES(order_number),
client_id=VALUES(client_id),
technician_id=VALUES(technician_id),
description=VALUES(description),
status=VALUES(status),
version=VALUES(version);

INSERT INTO order_status_histories (id, order_id, status, created_at) VALUES
(1, 1, 'TO DO', NOW() - INTERVAL 3 HOUR),
(2, 2, 'TO DO', NOW() - INTERVAL 2 HOUR),
(3, 2, 'IN PROGRESS', NOW() - INTERVAL 1 HOUR),
(4, 3, 'TO DO', NOW() - INTERVAL 2 HOUR),
(5, 4, 'TO DO', NOW() - INTERVAL 5 HOUR),
(6, 4, 'IN PROGRESS', NOW() - INTERVAL 4 HOUR),
(7, 4, 'DONE', NOW() - INTERVAL 3 HOUR)
ON DUPLICATE KEY UPDATE
order_id=VALUES(order_id),
status=VALUES(status),
created_at=VALUES(created_at);

