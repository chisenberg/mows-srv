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
	rfPin = 18;
	errorNibble = uint8(0xFF);
	threshold = uint32(40);
	pigpio C.int;

	// Buffer and pulse length
	lastPulse C.uint32_t;
	lastTick C.uint32_t;
	buffer [64]uint32;
	bufferPos uint8;

	// Output channel
	outputChannel chan MowsMsg
)

// InitPulse433 starts to listen
func InitPulse433() (chan MowsMsg, error){
	pigpio = C.pigpio_start(nil, nil);
	if (pigpio < 0) {
		return nil, fmt.Errorf("Pigpiod not initialized.")
	}

	outputChannel = make(chan MowsMsg) 

	C.set_mode(pigpio, C.uint(rfPin), C.PI_INPUT);
	C.set_pull_up_down(pigpio, C.uint(rfPin), C.PI_PUD_OFF);
	C.pulse433_register_callback(pigpio, C.uint(rfPin));

	return outputChannel, nil
}

//export pulse433_go_interrupt
func pulse433_go_interrupt(pigpio C.int, gpio C.uint32_t, level C.uint32_t, tick C.uint32_t){

	// just low pulse
	if(level == 1) {
		return;
	}
	// store pulse duration
	lastPulse = tick - lastTick;
	lastTick = tick;

	if(lastPulse > 50 && lastPulse < 600 && bufferPos < 64) {
		buffer[bufferPos] = uint32(lastPulse);
		bufferPos++;
	} else if (lastPulse > 800 && bufferPos >= 28 && buffer[0] < buffer[1]) {
		decode();
		bufferPos = 0;
	} else {
		bufferPos = 0;
	}
}

func near(first uint32, second uint32, threshold uint32) bool {
	return (first > (second - threshold) && first < (second + threshold));
}

func decode() {
	// sets the nibbles for this message
	nibble1 := buffer[0]; // 00
	nibble2 := buffer[1]; // 01
	nibble3 := buffer[2]; // 10
	nibble4 := buffer[3]; // 11

	var (
		data [32]uint8;
		dataCounter uint8;
		dataBitCount uint8;
		lastNibble uint8;
		pulse uint32;
	)

	// clear data
	for i := range data {
        data[i] = 0;
    }
	dataCounter = 0;
	dataBitCount = 0;
	data[dataCounter] = 0x00;

	for i:=uint8(4); i < bufferPos; i++ {

		pulse = buffer[i];

		if near(pulse, nibble1, threshold){
			lastNibble = 0x00; 
		} else if near(pulse, nibble2, threshold){
			lastNibble = 0x01; 
		} else if near(pulse, nibble3, threshold){
			lastNibble = 0x02;
		} else if near(pulse, nibble4, threshold){
		 	lastNibble = 0x03;
		} else {
			lastNibble = errorNibble;
			dataCounter = 0;
			dataBitCount = 0;
			data[dataCounter] = 0x00;
		}

		if(lastNibble != errorNibble){
			// stores bits received
			data[dataCounter] = data[dataCounter] | lastNibble << dataBitCount;

			// increments data counter
			dataBitCount+=2;
			if(dataBitCount == 8){
				dataCounter++;
				dataBitCount = 0;
				data[dataCounter] = 0x00;
			}

			// received all 8 bytes
			if(dataCounter == 8) {
				outputChannel <- DecodeData(data);
				return;
			}
		}
	}
}