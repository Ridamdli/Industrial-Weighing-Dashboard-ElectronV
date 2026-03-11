# Industrial Weighing System ⚖️

A comprehensive solution for real-time industrial weighing, consisting of a robust Windows background service and a modern Electron-based monitoring dashboard.

## 🚀 Overview

The **Industrial Weighing System** is designed to bridge the gap between physical industrial scales and digital processing systems. It captures weight measurements from serial/RJ45-connected scales and provides a high-performance interface for monitoring, configuration, and service management.

### System Components

| Component | Technology | Description |
|-----------|------------|-------------|
| **BalanceAgentService** | .NET (C#) | Background Windows service that handles direct serial communication and exposes a REST API. |
| **Monitoring Dashboard** | Electron + React | Desktop application for real-time visualization, advanced configuration, and log inspection. |

---

## ✨ Key Features

### 📊 Real-time Monitoring
- **Live Gauge**: High-contrast, industrial-grade weight display with unit precision.
- **Historical Chart**: 60-second rolling history of weight measurements for trend analysis.
- **Status Indicators**: Instant visual feedback on service and scale connectivity.

### 🛠️ Service Management
- **One-Click Controls**: Start, stop, and restart the Windows service directly from the UI.
- **Service Installer**: Integrated wizard to install/re-install the background service automatically.
- **Auto-Elevation**: Handles UAC requests to ensure administrative tasks perform reliably.

### ⚙️ Configuration & Diagnostics
- **INI Manager**: User-friendly editor for the `balances.ini` configuration file.
- **COM Port Detector**: Integrated scanner to identify and test active system serial ports.
- **Log Viewer**: Real-time streaming of Windows Event Log entries filtered for the system.

---

## 🛠️ Tech Stack

- **Dashboard**: Electron, Vite, React, TypeScript.
- **Styling**: Tailwind CSS, Shadcn UI, Lucide Icons.
- **State Management**: Zustand.
- **Backend Service**: .NET (C#) Windows Service.
- **Communication**: Electron IPC + REST API.

---

## 🚀 Getting Started

### Prerequisites

- **OS**: Windows 10/11 (Administrator privileges required).
- **Scale**: Serial or RJ45-connected industrial scale.
- **Runtime**: Node.js (for development), .NET Framework (for service).

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd BalanceAgentService/balance-dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

### Production Build

To package the application into a Windows installer:
```bash
npm run build
npm run package
```
The installer will be generated in `release/`.

---

## 📂 Project Structure

```bash
├── BalanceAgentService.exe  # Compiled Windows service
├── install.bat              # Manual installation script
├── balances.ini             # System configuration
└── balance-dashboard/       # Electron Dashboard Source
    ├── electron/            # Main & Preload processes
    ├── src/                 # React Renderer (UI Code)
    └── package.json         # Project dependencies
```

---

## 📞 Support & Logging

The system logs all significant events to the **Windows Event Viewer**. Filter by the source `BalanceAgentService` to troubleshoot connectivity or scale communication issues.

---

## 📄 License

MIT License - Copyright (c) 2026 Industrial Weighing Solutions.
