package main

import (
	"fmt"
	db "mows-svr/libs/database"
	"mows-svr/libs/rf"
	"time"
)

func main() {
	msgChannel, err := rf.InitPulse433()
	if err != nil {
		fmt.Print(err.Error())
		return
	}

	db.CreateTable()

	for {
		select {
		case msg := <-msgChannel:
			fmt.Printf("%+v\n", msg)
			db.Record(&msg)
		default:
			time.Sleep(200 * time.Millisecond)
		}
	}
}
