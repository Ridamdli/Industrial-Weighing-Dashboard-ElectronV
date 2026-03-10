# Scale Simulator for BalanceAgentService

Simulate a physical scale device for testing the BalanceAgentService without hardware.

## Quick Start

### Prerequisites
- Python 3.7+
- pyserial library
- Virtual COM port pair (COM7 ↔ COM8) via com0com

### Installation

```bash
pip install -r requirements.txt
```

### Setup Virtual COM Ports

1. Download and install [com0com](https://sourceforge.net/projects/com0com/)
2. Open com0com Setup Command Prompt as Administrator
3. Run:
```bash
install PortName=COM7 PortName=COM8
enable CNCA2
enable CNCB2
list
```

### Run Simulator

```bash
python scale_simulator.py
```

## Configuration

Edit `scale_simulator.py` to customize:
- `PORT_NAME`: COM port (default: COM8)
- `MIN_WEIGHT`: Minimum weight (default: 0.0 kg)
- `MAX_WEIGHT`: Maximum weight (default: 50.0 kg)
- `INTERVAL_MS`: Send interval (default: 1000ms)

## Data Format

Sends: `XX.XX kg\r\n`

Example: `23.45 kg\r\n`

## Testing

Check API response:
```bash
curl http://localhost:5001/api/balance/reception
```

Expected response:
```json
{
  "balanceName": "reception",
  "weight": 23.45,
  "unit": "kg",
  "timestamp": "2026-03-10T21:07:18Z"
}
```

## Troubleshooting

- **"Port not found"**: Verify COM8 exists in Device Manager
- **Service shows "not found"**: Ensure simulator is running continuously
- **No data received**: Check balances.ini has `PortCom=COM7`
