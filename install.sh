#!/bin/bash

if [[ $(id -u) -ne 0 ]] ; then echo "Please run as root" ; exit 1 ; fi

echo -e \\n----- Installing prerequisites -----
apt-get install -y curl
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
apt-get install -y nodejs

echo -e \\n----- Creating Private Key and Certificate for HTTPS -----
openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout privateKey.key -out certificate.crt

echo -e \\n----- Done -----
echo Run \'node Server.js \&\' to start the server.