The following documents the usage of this datalogger, and how it can be replicated. It includes all relevant hardware and software components in use. 

This datalogger is based on a Raspberry Pi, running on Ubuntu Server. It runs an access point using hostAPD, DNS and DHCP servers using dnsmasq, and a node JS server that hosts the web socket server. Nginx hosts the web socket on 192.168.1.10/ws and serves the html index page on 192.168.1.10. 

The following will explain how each library and server is set up, as well as the Raspberry Pi setup. 
