You are now responsible for the **Application Distribution Phase**.

The project is fully implemented and verified.
All phases from the planning document have already been completed and validated.

Your task is to **prepare the application for public distribution**, so that users can download and install it like a normal Windows application.

The goal is that a user can:

1. Download the installer (.exe or .msi)
2. Run the installer
3. Go through an Install Wizard
4. Install the dashboard application
5. Install and configure the BalanceAgentService
6. Launch the application normally from Start Menu or Desktop

Do **NOT implement code signing yet**. Skip the digital signature step for now.

---

# OBJECTIVE

Create a complete Windows installer system for the Electron application.

The installer must:

* install the Electron Dashboard
* install BalanceAgentService
* ensure the service is registered
* ensure configuration files exist
* create shortcuts
* allow uninstall

---

# PACKAGING TOOL

Use:

electron-builder

Configure it properly inside package.json.

The installer targets must be:

* NSIS (primary installer)
* MSI (secondary)

---

# REQUIRED OUTPUT

The build process must generate:

dist/

* Industrial-Weighing-Dashboard-Setup.exe
* Industrial-Weighing-Dashboard.msi
* win-unpacked/

Users will download:

Industrial-Weighing-Dashboard-Setup.exe

---

# INSTALLER REQUIREMENTS

The installer wizard must include standard Windows installer pages:

Welcome
Install location selection
Install progress
Finish screen

It must also:

* create Start Menu shortcut
* create optional Desktop shortcut
* install required application files
* prepare the configuration environment

---

# SERVICE INSTALLATION

During installation:

BalanceAgentService must be installed automatically.

Use Windows service commands such as:

sc create
sc start

The service must be installed only if it does not already exist.

If already installed:

* skip installation
* ensure it is running

---

# CONFIGURATION FILE

Ensure that balances.ini exists.

If missing:

create it automatically during installation.

Location preference:

C:\Windows\SysWOW64\balances.ini

Fallback for dev environments allowed.

---

# FIREWALL (OPTIONAL)

If needed, allow HTTP communication on port 5001.

Only implement if necessary.

---

# APPLICATION SHORTCUTS

Create shortcuts:

Start Menu:
Industrial Weighing Dashboard

Optional Desktop shortcut.

---

# UNINSTALL SUPPORT

Ensure that uninstall:

* removes the dashboard
* optionally stops the service
* does not break existing configuration unless requested

---

# BUILD COMMANDS

Ensure the project supports:

npm run build
npm run dist

The dist command must produce the installer automatically.

---

# TESTING

Verify locally that:

1. Installer builds successfully
2. Installer runs without errors
3. Application launches
4. Service control works
5. Dashboard can connect to the balance API
6. Uninstall works

Fix any issue before finishing.

---

# IMPORTANT

Skip code signing for now.

Do not add certificate configuration.

Focus only on creating a working installer.

---

# FINAL RESULT

At the end of this task, the project must produce a **fully installable Windows application** that behaves like a professional desktop product.

Users must be able to download and install it without needing Node.js, npm, or development tools.
