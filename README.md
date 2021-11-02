The following documents the usage of this datalogger, and how it can be replicated. It includes all relevant hardware and software components in use. 

OVERVIEW:
This datalogger is based on a Raspberry Pi, running on Ubuntu Server. It runs an access point using hostAPD, DNS and DHCP servers using dnsmasq, and a node JS server that hosts the web socket server. Nginx proxies the web socket on 192.168.1.10/ws and serves the html index page on 192.168.1.10. 

The following will explain how each library and server is set up, as well as the Raspberry Pi setup. 

SETUP:

Raspberry Pi: 

You will need to use an SD card at least 16GB in volume. 

Download the Raspberry Pi imager software from https://www.raspberrypi.com/software/.
Run the imager on the SD card, selecting "other general purpose OS", "Ubuntu", and "Ubuntu server".
Select the SD card, and select write to start the imaging. 

It will run and create the iamge of ubuntu, and verify its installation. Move the SD card to the Raspberry Pi, and connect an HDMI cable, keyboard, and power the Pi over micro USB. 


ssh:


HostAPD:


dnsmasq:


Nginx:


Node JS:
