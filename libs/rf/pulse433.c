#include "pulse433.h"

void PULSE433_c_interrupt(int pigpio, uint32_t gpio, uint32_t level, uint32_t tick){
    pulse433_go_interrupt(pigpio, gpio, level, tick);
}