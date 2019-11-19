package rf

//#cgo LDFLAGS: -lpigpiod_if2 -lrt -pthread
//#include <pigpiod_if2.h>
//#include <stdint.h>
//#include "pulse433.h"
//typedef void (*closure)(); // bruxaria do mal
import "C"
import (
	"fmt"
)

var rfPin = 18
var errorNibble = 0xFF
var threshold = 40

// The Pulse433 struct
type Pulse433 struct {
	pigpio C.int
	// data control
	msg [100]uint8;
	data [8]uint8;
	validMsg bool;
	lastPulse uint32;
	lastTick uint32;
	buffer [64]uint32;
	bufferPos uint8;
}

// Init the Pulse433
func (p *Pulse433) Init() {
	p.pigpio = C.pigpio_start(nil, nil);
	if (p.pigpio < 0) {
		fmt.Printf("pigpio initialisation failed (%d).\n", p.pigpio);
		return;
	}

	p.validMsg = false;
	C.set_mode(p.pigpio, C.uint(rfPin), C.PI_INPUT);
	C.set_pull_up_down(p.pigpio, C.uint(rfPin), C.PI_PUD_OFF);
	C.callback(p.pigpio, C.uint(rfPin), C.FALLING_EDGE, C.closure(C.PULSE433_c_interrupt));
}

//export pulse433_go_interrupt
func pulse433_go_interrupt(pigpio C.int, gpio C.uint32_t, level C.uint32_t, tick C.uint32_t){

	// just low pulse
	if(level == 1) {
		return;
	}
	// store pulse duration
	last_pulse = tick - last_tick;
	last_tick = tick;

	// if(last_pulse > 50 && last_pulse < 600 && buffer_pos < 64) {
	// 	buffer[buffer_pos++] = last_pulse;
	// } else if (last_pulse > 800 && buffer_pos >= 28) {
	// 	decode();
	// 	buffer_pos = 0;
	// } else {
	// 	buffer_pos = 0;
	// }
}