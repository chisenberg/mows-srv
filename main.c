#include <stdio.h>
#include <pigpiod_if2.h>
#define RF_PIN 18

#define ERROR_NIBBLE 0xFF

// gcc -Wall -pthread -o pulse433 main.c -lpigpiod_if2 -lrt

// data control
uint8_t data_n;
uint8_t data_bit_n;
uint8_t data[8];
uint8_t valid_msg;
char msg[100];
uint32_t last_pulse;
uint32_t last_tick;

int pi;

// declarations
uint8_t get_checksum(uint8_t* data);
// void interrupt(int gpio, int level, uint32_t tick);
void interrupt(int pi, uint32_t gpio, uint32_t level, uint32_t tick);

int main(int argc, char * argv[])
{
	pi = pigpio_start(0, 0);
	if (pi < 0)
	{
		fprintf(stderr, "pigpio initialisation failed (%d).\n", pi);
		return 1;
	}
	printf("Connected to pigpio daemon (%d).\n", pi);

	valid_msg = 0;
	set_mode(pi, RF_PIN, PI_INPUT);
	set_pull_up_down(pi, RF_PIN, PI_PUD_OFF);
	callback(pi, RF_PIN, FALLING_EDGE, interrupt);

	float battcoef = (3.3/256) * 1.445;
	float battfloat = 0x00;

	while (1)
	{
		if (valid_msg) 
		{
			battfloat = data[1];
			sprintf(msg,(char*)"(%u) 0x%X %.2f 0x%X volts\n",
			data[0],
			data[0],
			battfloat * battcoef,
			data[1]);

			printf("\n %s", msg);

			if(get_checksum(data) != data[7]) {
				printf(" ---  <!> CORRUPTED MSG <!>\n");
			}

			valid_msg = 0;
		}
		time_sleep(0.001f);
	}

	pigpio_stop(pi);
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
	// nibble
	uint8_t last_nibble = ERROR_NIBBLE;
	// calcula micros
	last_pulse = tick - last_tick;
	last_tick = tick;

	// 60 us scope. Tends to be longer tha excpected...
	if(last_pulse > 180 && last_pulse < 240) last_nibble = 0x00;
	else if(last_pulse > 280 && last_pulse < 340) last_nibble = 0x01;
	else if(last_pulse > 380 && last_pulse < 440) last_nibble = 0x02;
	else if(last_pulse > 480 && last_pulse < 540) last_nibble = 0x03;
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
		if(data_n == 8) {
			data_n = 0;
			// printf("\nRecebi aos %d segundos:", (tick/1000000) % 100);
			valid_msg = 1;
			return;
		}
	}

}

