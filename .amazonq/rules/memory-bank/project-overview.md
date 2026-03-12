# BalanceAgentService - Memory Bank

## Project Overview

**BalanceAgentService** is a Windows service that reads weight measurements from RJ45-connected scales and exposes them via an HTTP API on port 5001.

**Language**: C# (.NET)  
**Type**: Windows Service  
**Primary Function**: Serial communication with scales + HTTP API endpoint

---

## Architecture

### Core Components

1. **BalanceAgentService.exe** - Main Windows service executable
2. **balances.ini** - Configuration file for scale definitions
3. **install.bat** - Automated service installation script

### Service Details

- **Service Name**: BalanceAgentService
- **Display Name**: Balance Agent Service RJ45
- **Startup Type**: Automatic
- **API Port**: 5001
- **Health Endpoint**: `http://localhost:5001/api/health`
- **Logging**: Windows Event Viewer (Application log)

---

## Configuration (balances.ini)

### Structure

```ini
[Balances]
NombreBalances=<number_of_scales>

[Balance<N>]
Nom=<scale_name>
PortCom=<COM_port>
BaudRate=<baud_rate>
DataBits=<data_bits>
Parity=<parity_type>
StopBits=<stop_bits>
Timeout=<timeout_ms>
Unite=<unit>
Decimales=<decimal_places>
```

### Current Configuration

- **1 Scale** named "reception"
- **COM Port**: COM1
- **Serial Settings**: 9600 baud, 8 data bits, No parity, 1 stop bit
- **Timeout**: 5000ms
- **Unit**: kg (kilograms)
- **Decimal Places**: 2

---

## Installation & Deployment

### Prerequisites

- Windows OS (service-based)
- Administrator privileges
- Serial COM port available for scale connection

### Installation Steps

1. Run `install.bat` as Administrator
2. Script creates Windows service with auto-start
3. Configures failure recovery (restart on failure)
4. Starts service automatically
5. Verify via Event Viewer or `http://localhost:5001/api/health`

### Service Management

```batch
net start BalanceAgentService    # Start service
net stop BalanceAgentService     # Stop service
sc query BalanceAgentService     # Check status
```

---

## Key Technical Details

### Serial Communication

- Reads weight data from scales via COM port
- Configurable baud rate, parity, stop bits
- Timeout handling for communication failures

### API Endpoints

- Health check: `GET /api/health`
- (Additional endpoints likely exist for reading scale data)

### Error Handling

- Service auto-restarts on failure (up to 3 attempts)
- Logs to Windows Event Viewer
- Graceful timeout handling

---

## Development Notes

- Configuration is INI-based (easy to modify without recompilation)
- Supports multiple scales (extensible via NombreBalances)
- French language comments/labels in configuration
- Service runs with system privileges
