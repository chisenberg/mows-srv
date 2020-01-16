package main

import (
	"fmt"
	"time"
	"mows-svr/libs/rf"
)

func main() {
	msgChannel, err := rf.InitPulse433();
	if err != nil {
		fmt.Print(err.Error())
		return
	}

	for{
		select {
		case msg := <-msgChannel:
			fmt.Printf("%+v\n",msg)
		default:
			time.Sleep(200 * time.Millisecond)
		}
	}
}