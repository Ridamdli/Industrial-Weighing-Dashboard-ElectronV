We need to implement several fixes and improvements to the Balance Agent Dashboard after the first successful distribution build.

Please read the project context before making any changes.

IMPORTANT:
This must be implemented without breaking the existing service integration or installer.

---

ISSUE 1 — CONFIG FILE DUPLICATION

The installer currently creates two files:

C:\Windows\SysWOW64\balances.ini
C:\Windows\SysWOW64\balances.ini

This is incorrect.

The system must use only ONE configuration file:

C:\Windows\SysWOW64\balances.ini

Required changes:

1. The Electron dashboard must read configuration ONLY from:

C:\Windows\SysWOW64\balances.ini

2. The dashboard must write configuration ONLY to that file.

3. Remove any references to:

* blence.ini
* balances.ini

4. The installer must only create balances.ini.

5. The .NET service already reads balances.ini and must remain unchanged.

---

ISSUE 2 — API HOST DETECTION

Currently the API configuration defaults to:

host = localhost

This is incorrect because the API actually runs on the machine's network IP.

Example:

http://192.168.1.111:5001/api/balance/reception

The application must help the user detect the correct host.

Implement:

1. Automatic detection of available IPv4 addresses using Node.js:

os.networkInterfaces()

2. Filter:

* IPv4
* non-internal

3. Provide a dropdown list in the API configuration UI similar to the COM port selector.

Example:

Host:
[ 192.168.1.111 ▼ ]

Port:
5001

4. Add a button:

Detect API Host

When clicked it should:

Test each detected IP with:

GET http://IP:5001/api/health

The first successful response should be suggested as the API host.

---

ISSUE 3 — CONFIG SAVE BEHAVIOR

When the user presses Save in the dashboard:

1. All settings must be written to:

C:\Windows\SysWOW64\balances.ini

2. After saving configuration, the application must:

restart BalanceAgentService

This ensures the service reloads the new configuration.

---

ISSUE 4 — APPLICATION UPDATE SYSTEM

Add a new section in the dashboard:

Check for Updates

Implement automatic updates using:

electron-updater

The system must support:

Check for updates
Download updates
Install updates
Restart application

The update source should be GitHub Releases.

UI flow:

Help → Check for Updates

Possible states:

Checking for updates
No updates available
Downloading update
Restart to install update

---

VALIDATION

After implementing the changes:

1. Ensure the installer still works correctly.
2. Ensure only balances.ini exists.
3. Verify that configuration updates affect the running service.
4. Verify API host detection works.
5. Verify update system works without breaking packaging.

Fix any issues found.

---

Goal:

Improve reliability, user experience, and maintainability of the distributed application.
