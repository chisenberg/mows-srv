#ifndef PULSE433_H
#define PULSE433_H

#include <stdint.h>

extern void pulse433_go_interrupt(int pigpio, uint32_t gpio, uint32_t level, uint32_t tick);

void PULSE433_c_interrupt(int pigpio, uint32_t gpio, uint32_t level, uint32_t tick);

#endif