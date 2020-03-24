package database

import (
	"database/sql"
	"fmt"
	"mows-svr/libs/rf"

	// justificando
	_ "github.com/mattn/go-sqlite3"
)

/*
CREATE TABLE IF NOT EXISTS 'log' (
	'time'  TEXT NOT NULL,
	'temperature'  INTEGER,
	'humidity'  INTEGER,
	'rain'  REAL,
	'pressure'  INTEGER,
	'wind_speed'  INTEGER,
	'wind_dir'  INTEGER,
	PRIMARY KEY ('time')
);
*/

func connect() *sql.DB {
	db, err := sql.Open("sqlite3", "./database2.db")
	if err != nil {
		fmt.Println("Error opening database file. Err msg: " + err.Error())
		return nil
	}

	return db
}

// CreateTable --
func CreateTable() {
	db := connect()
	statement, _ := db.Prepare(`
        CREATE TABLE IF NOT EXISTS log (
            'time' TEXT NOT NULL,
            'temperature' INTEGER,
            'humidity'  INTEGER,
            'rain'  REAL,
            'pressure'  INTEGER,
            'wind_speed'  INTEGER,
            'wind_dir'  INTEGER,
            PRIMARY KEY ('time')
        )`)
	statement.Exec()
}

// Record --
func Record(msg *rf.MowsMsg) {
	db := connect()
	statement, _ := db.Prepare("INSERT OR REPLACE INTO LOG VALUES (?, ?, ?, ?, ?, ?, ?)")
	statement.Exec("Nic", "Raboy")
	// rows, _ := db.Query("SELECT id, firstname, lastname FROM people")
	// var id int
	// var firstname string
	// var lastname string
	// for rows.Next() {
	// 	rows.Scan(&id, &firstname, &lastname)
	// 	fmt.Println(strconv.Itoa(id) + ": " + firstname + " " + lastname)
	// }
}
