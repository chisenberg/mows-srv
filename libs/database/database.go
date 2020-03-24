package database

import (
	"database/sql"
	"fmt"
	"mows-svr/libs/rf"
	"time"

	// justificando
	_ "github.com/mattn/go-sqlite3"
)

func connect() *sql.DB {
	db, err := sql.Open("sqlite3", "./database.db")
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
	_, err := statement.Exec()
	if err != nil {
		fmt.Println(err.Error())
	}
}

// Record --
func Record(msg *rf.MowsMsg) {

	t := time.Now()

	db := connect()
	statement, err := db.Prepare("INSERT OR REPLACE INTO LOG VALUES (?, ?, ?, ?, ?, ?, ?)")
	if err != nil {
		fmt.Println(err.Error())
	}
	_, err = statement.Exec(
		t.Format("200601021504"),
		msg.Temperature,
		msg.Humidity,
		msg.Rain,
		nil,
		msg.WindSpd,
		nil,
	)

	if err != nil {
		fmt.Println(err.Error())
	}

	// rows, _ := db.Query("SELECT id, firstname, lastname FROM people")
	// var id int
	// var firstname string
	// var lastname string
	// for rows.Next() {
	// 	rows.Scan(&id, &firstname, &lastname)
	// 	fmt.Println(strconv.Itoa(id) + ": " + firstname + " " + lastname)
	// }
}
