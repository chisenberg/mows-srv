package rf

var batteryConstant = float32((3.3/256) * 1.404);

// MowsMsg weather station message
type MowsMsg struct{
	Rain int32
	Temperature float32
	Humidity float32
	Battery float32
}

// DecodeData decodes the station message
func DecodeData(data [32]uint8) MowsMsg {
	return MowsMsg {
		// Rain: int32(data[1]),
		Temperature: float32(int(data[2]) * 256 + int(data[3])) / 10,
		Humidity: float32(int(data[4]) * 256 + int(data[5])) / 10,
		Battery: float32(data[1]) * float32(batteryConstant),
	};
}