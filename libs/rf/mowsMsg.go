package rf

var batteryConstant = float32((3.3/256) * 1.404);

// MowsMsg weather station message
type MowsMsg struct{
	Rain int32
	Temperature float32
	Humidity float32
	Battery float32
	WindSpd int32
}

// DecodeData decodes the station message
func DecodeData(data [32]uint8) MowsMsg {
	return MowsMsg {
		Battery: float32(data[0]) * float32(batteryConstant),
		Rain: int32(int(data[1]) * 256 + int(data[2])),
		Temperature: float32(int(data[3]) * 256 + int(data[4])) / 10,
		Humidity: float32(int(data[5]) * 256 + int(data[6])) / 10,
		WindSpd: int32(int(data[7]) * 256 + int(data[8])),
	};
}