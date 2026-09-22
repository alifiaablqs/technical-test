package config

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

func ConnectDB() *sql.DB {
	dsn := "root:@tcp(127.0.0.1:3306)/technical_test_cs1?parseTime=true"

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Gagal membuka koneksi database:", err)
	}

	if err := db.Ping(); err != nil {
		log.Fatal("Gagal terhubung ke database:", err)
	}

	fmt.Println("Database connected!")

	return db
}
