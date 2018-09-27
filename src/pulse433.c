// gcc -Wall -pthread -o pulse433 main.c -lpigpiod_if2 -lrt

#include <pigpiod_if2.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define RF_PIN 18
#define ERROR_NIBBLE 0xFF
#define THRESHOLD 40

// pigpiod instance
int pigpiod;

// data control
char msg[100];
uint8_t data[8];
uint8_t valid_msg;
uint32_t last_pulse;
uint32_t last_tick;
uint32_t *buffer;
uint32_t buffer_pos;

// declarations
uint8_t get_checksum(uint8_t* data);
void interrupt(int pi, uint32_t gpio, uint32_t level, uint32_t tick);
void decode();

// the decode process
uint32_t nimble_1 = 0x00;
uint32_t nimble_2 = 0x00;
uint32_t nimble_3 = 0x00;
uint32_t nimble_4 = 0x00;
uint8_t last_nibble;
uint32_t pulse;
uint32_t data_n = 0;
uint32_t data_bit_n;

int main(int argc, char * argv[])
{
	buffer = (uint32_t*)calloc(64,sizeof(uint32_t));
	buffer_pos = 0;

	// disables buffer
	setvbuf(stdout, NULL, _IOLBF, 0);

	pigpiod = pigpio_start(0, 0);
	if (pigpiod < 0)
	{
		fprintf(stderr, "pigpio initialisation failed (%d).\n", pigpiod);
		return 1;
	}

	valid_msg = 0;
	set_mode(pigpiod, RF_PIN, PI_INPUT);
	set_pull_up_down(pigpiod, RF_PIN, PI_PUD_OFF);
	callback(pigpiod, RF_PIN, FALLING_EDGE, interrupt);

	while (1)
	{
		// if (valid_msg && get_checksum(data) == data[7]) 
		if (valid_msg) 
		{


			sprintf(msg,(char*)"0x%02X;0x%02X;0x%02X;0x%02X;0x%02X;0x%02X;0x%02X",
			// sprintf(msg,(char*)"\n0x%02X 0x%02X 0x%02X 0x%02X 0x%02X 0x%02X 0x%02X",
				data[0],
				data[1],
				data[2],
				data[3],
				data[4],
				data[5],
				data[6]
			);
			printf("%s", msg);
			fflush(stdout);
		}
		valid_msg = 0;
		time_sleep(0.001f);
	}

	pigpio_stop(pigpiod);
	return 0;
}

uint8_t get_checksum(uint8_t* data) {
	uint8_t result = 0;
	for(uint8_t i=0; i<7; i++)
		result += data[i];
	return result;
}

void interrupt(int pi, uint32_t gpio, uint32_t level, uint32_t tick){

	// just low pulse
	if(level == 1) return;
	// store pulse duration
	last_pulse = tick - last_tick;
	last_tick = tick;

	if(last_pulse > 50 && last_pulse < 600 && buffer_pos < 64) {
		buffer[buffer_pos++] = last_pulse;
	} else if (last_pulse > 800 && buffer_pos >= 28) {
		decode();
		buffer_pos = 0;
	} else {
		buffer_pos = 0;
	}
}

/**
 * Check if value is near the other
 */
uint8_t near(uint32_t first, uint32_t second, uint32_t threshold) {
	return (first > (second - threshold) && first < (second + threshold));
}

void decode(){

	// sets the nimbbles for this message
	nimble_1 = buffer[0]; // 00
	nimble_2 = buffer[1]; // 01
	nimble_3 = buffer[2]; // 10
	nimble_4 = buffer[3]; // 11

	// 	sprintf(msg,(char*)"\n\n[%u %u %u %u]",
	// 	nimble_1,
	// 	nimble_2,
	// 	nimble_3,
	// 	nimble_4
	// );
	// printf("%s", msg);
	// fflush(stdout);

	// clear data
	memset(data, 0, 8);
	data_n = 0;
	data_bit_n = 0;
	data[data_n] = 0x00;

	for (int i=4; i<buffer_pos; i++) {

		pulse = buffer[i];

		if(near(pulse, nimble_1, THRESHOLD)){ last_nibble = 0x00; }
		else if(near(pulse, nimble_2, THRESHOLD)){ last_nibble = 0x01; }
		else if(near(pulse, nimble_3, THRESHOLD)){ last_nibble = 0x02; }
		else if(near(pulse, nimble_4, THRESHOLD)){ last_nibble = 0x03; }
		else {
			last_nibble = ERROR_NIBBLE;
			data_n = 0;
			data_bit_n = 0;
			data[data_n] = 0x00;
		}

		if(last_nibble != ERROR_NIBBLE){
			// stores bit received
			data[data_n] = data[data_n] | last_nibble << data_bit_n;

			// increments data counter
			data_bit_n+=2;
			if(data_bit_n == 8){
				data_n++;
				data_bit_n = 0;
				data[data_n] = 0x00;
			}

			// received all 8 bytes
			if(data_n == 7) {
				valid_msg = 1;
				return;
			}
		}
	}

	
}

