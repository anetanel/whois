#!/bin/bash

if [[ $(id -u) -ne 0 ]] ; then echo "Please run as root" ; exit 1 ; fi

echo 'This installer will do the following:'
echo '* install curl'
echo '* download and run an installation script from deb.nodesource.com to install the NodeSource Node.js 10.x repo'
echo '* install nodejs'
echo '* create a private key and certificate to use with the HTTPS server'
echo
read -p "Do you wish to continue? (y/n)" -n 1 -r
if [[ ! $REPLY =~ ^[Yy]$ ]] ; then echo;exit 1 ; fi

echo -e \\n----- Installing prerequisites -----
apt-get install -y curl
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
apt-get install -y nodejs

echo -e \\n----- Creating Private Key and Certificate for HTTPS -----
openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout privateKey.key -out certificate.crt

echo -e \\n----- Done -----
echo 'Set env. variable WEB_PORT to change default port (8443).'
echo Run \'node Server.js \&\' to start the server.
