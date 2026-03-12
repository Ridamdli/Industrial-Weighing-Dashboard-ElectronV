# System Context – Balance Service Installation

This document explains how the provided Balance Service is currently installed and configured in the system.
The AI agent must understand this context before implementing any installer or setup wizard.

---

## Provided Files

The internship supervisor provided a compressed package containing three important files:

BalenceAgentService.exe
balance.ini
install.bat

These files are used to install and configure the balance service that communicates with an industrial weighing scale.

---

## Purpose of the Service

BalenceAgentService is a Windows service written in .NET.

Its responsibilities are:

* Reading weight data from an industrial scale via Serial COM port
* Processing incoming data
* Sending results through an HTTP API
* Running continuously as a Windows service

Architecture:

Scale Device (or Simulator)
→ Serial COM
→ BalenceAgentService (.NET Windows Service)
→ HTTP API
→ Client Applications (including the Electron dashboard)

---

## Testing Environment

For development and testing purposes, a **Python scale simulator** is used.

The simulator sends fake weight data through serial ports.

Example configuration:

COM8 → sends simulated weight
COM7 → received by BalenceAgentService

The service listens to COM7 and processes the incoming weight values.

---

## Current Manual Installation Process

The service is currently installed manually using the following steps.

Step 1 – Configure the COM port

Open the file:

balance.ini

Modify the COM port parameter to match the port connected to the scale.

Example:

port=COM7

---

Step 2 – Place configuration file

The balance.ini file must be copied to the following Windows directory:

C:\Windows\SysWOW64

The service expects to find its configuration in this location.

---

Step 3 – Create application directory

Create the following directory:

C:\inetpub\SDI

This folder is used to store the service executable and installation files.

---

Step 4 – Extract service files

Extract the provided package contents into:

C:\inetpub\SDI

This folder will contain:

BalenceAgentService.exe
install.bat
balance.ini (optional backup)

---

Step 5 – Install the service

Run the following file with administrator privileges:

install.bat

This script installs and registers the Windows service.

The script likely performs operations such as:

* creating the Windows service
* configuring the service path
* starting the service

Administrator privileges are required for this step.

---

## Important Notes

The service reads its configuration from:

C:\Windows\SysWOW64\balance.ini

The copy of balance.ini inside the SDI folder may only serve as a backup.

The install.bat script must be executed with "Run as Administrator".

---

## Goal for the Electron Application

The Electron desktop application being developed should provide a better and more user-friendly way to manage this system.

Instead of performing manual installation steps, the application should provide an **Installation Wizard** that automates the process.

# Installation Strategy – Industrial Weighing Dashboard

This document clarifies the responsibilities of the **Installer Wizard** and the **Dashboard Application**.

The installer must remain minimal and focused only on installing the service.

---

## Installer Wizard Responsibility

The installer wizard is responsible ONLY for installing the Balance service.

It must NOT perform any system configuration or hardware setup.

Its job is limited to:

1. Extracting or placing the required service files
2. Installing the Windows service
3. Verifying that the service was installed successfully
4. Reporting installation success or failure

The installer must remain simple and reliable.

---

## What the Installer MUST NOT do

The installer wizard must NOT:

* detect COM ports
* test scale connections
* modify port configuration
* change balance.ini settings
* start/stop the service for configuration purposes
* interact with hardware devices

All of these operations belong to the **Dashboard application**.

---

## Installer Tasks

The installer wizard should automate the manual installation process currently used.

Manual process:

1. Copy configuration file

balance.ini → C:\Windows\SysWOW64

2. Create service directory

C:\inetpub\SDI

3. Place service files inside

BalenceAgentService.exe
install.bat

4. Run install.bat as Administrator

5. Verify the Windows service is correctly installed

---

## Installation Verification

After installation the installer should verify:

* the Windows service exists
* the service can be queried
* no installation errors occurred

Example verification command:

sc query BalenceAgentService

If the service exists, installation is successful.

---

## Dashboard Responsibilities

All system configuration and management must be handled by the **Electron Dashboard GUI**, not the installer.

The dashboard will later provide:

* service start / stop
* editing balance.ini
* COM port configuration
* logs visualization
* system status monitoring
* error diagnostics

---

## Design Principle

The system must follow this separation:

Installer Wizard
→ installs the service

Dashboard Application
→ manages configuration and runtime behavior

This ensures the installer remains stable and avoids unnecessary complexity.

---

## AI Agent Instruction

When implementing the installer, keep it minimal and robust.

Do not add additional configuration logic inside the installer.

Focus only on reliable service installation and verification.


---

## AI Agent Objective

The AI agent must analyze this system context and design the most appropriate installation experience.

Possible solutions may include:

* a step-by-step installer wizard
* an automated setup process
* an improved service installation workflow

The goal is to create a **complete and reliable desktop application for managing the industrial weighing system**.

The AI agent should decide the best implementation approach while keeping compatibility with the existing Balance Service.
