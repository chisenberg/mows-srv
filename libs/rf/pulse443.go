package rf

//#cgo LDFLAGS: -lpigpiod_if2 -lrt -pthread
//#include <pigpiod_if2.h>
//#include <stdint.h>
/*
extern void pulse433_go_interrupt(int pigpio, uint32_t gpio, uint32_t level, uint32_t tick);
static void pulse433_register_callback(int pigpio, uint32_t rfpin) {
	callback(pigpio, rfpin, FALLING_EDGE, pulse433_go_interrupt);
}
*/
import "C"

import (
	"fmt"
)

var (
	// Defines
	rfPin      = 18
	errordibit = uint8(0xFF)
	threshold  = uint32(65)
	pigpio     C.int

	// Buffer and pulse length
	lastPulse uint32
	lastTick  uint32
	buffer    [64]uint32
	bufferPos uint8

	// Output channel
	outputChannel chan MowsMsg
)

// InitPulse433 starts to listen
func InitPulse433() (chan MowsMsg, error) {
	pigpio = C.pigpio_start(nil, nil)
	if pigpio < 0 {
		return nil, fmt.Errorf("Pigpiod not initialized")
	}

	outputChannel = make(chan MowsMsg)

	C.set_mode(pigpio, C.uint(rfPin), C.PI_INPUT)
	C.set_pull_up_down(pigpio, C.uint(rfPin), C.PI_PUD_OFF)
	C.pulse433_register_callback(pigpio, C.uint(rfPin))

	return outputChannel, nil
}

//export pulse433_go_interrupt
func pulse433_go_interrupt(pigpio C.int, gpio C.uint32_t, level C.uint32_t, tick C.uint32_t) {

	// just low pulse
	if level == 1 {
		return
	}
	// store pulse duration
	lastPulse = uint32(tick) - uint32(lastTick)
	lastTick = uint32(tick)

	if isValidPulse(lastPulse) && bufferPos < 62 {
		buffer[bufferPos] = lastPulse
		bufferPos++
	} else if isEndPulse(lastPulse) && areDibitsSorted() && bufferPos > 36 {
		decode()
		bufferPos = 0
	} else {
		bufferPos = 0
	}
}

// check if received pulse is at least 2x the largest dibit
func isEndPulse(pulse uint32) bool {
	return pulse > (buffer[3] * 2)
}

// first 4 pulses (dibits) are sorted
func areDibitsSorted() bool {
	return buffer[0] < buffer[1] && buffer[1] < buffer[2] && buffer[2] < buffer[3]
}

// pulses out of this range are garbage or end of message
func isValidPulse(pulse uint32) bool {
	return pulse > 50 && pulse < 600
}

func near(first uint32, second uint32, threshold uint32) bool {
	return (first > (second-threshold) && first < (second+threshold))
}

func decode() {
	// sets the dibits for this message
	dibit1 := buffer[0] // 00
	dibit2 := buffer[1] // 01
	dibit3 := buffer[2] // 10
	dibit4 := buffer[3] // 11

	// fmt.Println(dibit1, dibit2, dibit3, dibit4)
	fmt.Printf("\n\n")

	var (
		data         [32]uint8
		dataCounter  uint8
		dataBitCount uint8
		lastdibit    uint8
		pulse        uint32
	)

	// clear data
	for i := range data {
		data[i] = 0
	}
	dataCounter = 0
	dataBitCount = 0
	data[dataCounter] = 0x00

	for i := uint8(4); i < bufferPos; i++ {

		pulse = buffer[i]

		if near(pulse, dibit1, threshold) {
			lastdibit = 0x00
		} else if near(pulse, dibit2, threshold) {
			lastdibit = 0x01
		} else if near(pulse, dibit3, threshold) {
			lastdibit = 0x02
		} else if near(pulse, dibit4, threshold) {
			lastdibit = 0x03
		} else {
			lastdibit = errordibit
			dataCounter = 0
			dataBitCount = 0
			data[dataCounter] = 0x00
		}

		if lastdibit != errordibit {
			// stores bits received
			data[dataCounter] = data[dataCounter] | lastdibit<<dataBitCount

			// increments data counter
			dataBitCount += 2
			if dataBitCount == 8 {
				dataCounter++
				dataBitCount = 0
				data[dataCounter] = 0x00
			}

			// received all 9 bytes
			if dataCounter == 9 {
				outputChannel <- DecodeData(data)
				return
			}
		}
	}
}
