The GUI is not working as expected. 
i have this errors in the GUI:
1. In Contrôle du Service
Gérer le service Windows .NET (BalanceAgentService) en arrière-plan.

État du service
État actuel du processus d'arrière-plan

when i try to turn it (Arrêter) of i get this error:
[SC] OpenService FAILED 5: Access is denied.

Even if i try in Administrator Command Prompt to stop the service it can't stop it.
´´´cmd (Administrator)
>net stop BalanceAgentService
The Balance Agent Service RJ45 service is stopping........
The Balance Agent Service RJ45 service could not be stopped.
´´´

2. In Configuration
Gérer les paramètres du service et la connexion à la balance (balances.ini).

When i put Paramètres Serveur API
Hôte (Host) from localhost to [IP_ADDRESS] and click on Enregistrer i get this error:

EPERM: operation not permitted, open 'C:\Windows\SysWOW64\balances.ini.tmp'

3. In Tableau de Bord
Vue d'ensemble en temps réel du système de pesage industriel. 

I got this error:
API Balance
Erreur / Déconnectée
fetch failed
Even if python scale_simulator.py is running on port 5001

when i try to test the API "http://[IP_ADDRESS]/api/balance/reception" to in postman i receive the data that comes from the scale_simulator.py

