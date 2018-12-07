const https = require('https');
const net = require('net');
const fs = require('fs');

const WHOIS_ROOT = 'whois.iana.org';
const WHOIS_PORT = 43;
const USER_PASS = {
    'netanel': '1234',
    'admin': 'admin',
    'hax0r': 'password',
    'user': 'pass'
};
const WEB_PORT = 8443;

const options = {
    key: fs.readFileSync('privateKey.key'),
    cert: fs.readFileSync('certificate.crt')
};

server = https.createServer(options, (req, res) => { // Start https server and call wClient for each request
    if (!authenticate(req, res)) return;

    let target = getIpFromUrl(req.url);
    if (target) {
        res.write(`IP in url is '${target}'\n`);
        wClient(WHOIS_ROOT, target, res)
    } else {
        res.end(`Could not find a valid IP address in '${req.url}'\n`);
    }
}).listen(WEB_PORT);

server.on('listening', () => console.log(`listening on secure port ${WEB_PORT}`));
server.on('error', err => console.error(err.toString()));

function authenticate(req, res) {
    let auth = req.headers['authorization'];
    // console.log('Authorization Header is: ', auth);

    if (!auth) { // no authentication given
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
        res.end(`No authentication given\nTry 'username:password@${req.headers.host}${req.url}'\n`);
        return false;
    }

    let tmp = auth.split(' ');   // Split on a space, the original auth looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part
    let buf = Buffer.from(tmp[1], 'base64');
    let plainAuth = buf.toString();

    // console.log('Decoded Authorization ', plainAuth);
    let creds = plainAuth.split(':');
    let username = creds[0];
    let password = creds[1];

    if (USER_PASS[username] !== password) {
        res.statusCode = 403;
        res.end('You shall not pass\n');
        return false;
    }
    res.statusCode = 200;
    return true;
}

function wClient(refer, target, res) {
    let data = '';
    let socket = new net.Socket();

    socket.on('data', chunk => { // accumulate data from server
        data += chunk;
    });

    socket.on('end', () => { // Got all data from the server
        let prettyData = data.replace(/[%#].*\n/g, '')
            .replace(/\n+/g, '\n')
            .replace(/^\n|\n$/g, ''); // remove comments and empty lines

        res.write('\n---------------START----------------\n');
        res.write(prettyData);
        res.write('\n---------------END------------------\n');
        // console.log(data);

        if (data.search('refer:') > 0) { // found refer: in data string, so querying it for our target ip
            let nextRefer = data.match('refer:.*\n')[0].split(':')[1].trim(); // isolate refer address
            // console.log(`got next refer: ${nextRefer}`);
            wClient(nextRefer, target, res);
        } else if (prettyData.search(':') < 0) { // data does not look like key-value. query again with handle/id instead of IP
            // console.log('digging deeper...');
            let nextTarget = prettyData.split('\n').slice(-1)[0].split(/[()]/)[1]; // extract handle/id from parentheses of last entry
            // console.log(`nextTarget = ${nextTarget}`);
            wClient(refer, nextTarget, res);
        } else {
            // console.log('made it to the end..');
            socket.destroy();
            res.end();
        }
    });

    // socket.on('close', () => {
    //     console.log('Connection closed');
    // });

    socket.on('error', err => {
        console.error('error: ', err);
        res.end(`Error getting ${target} whois information.\n${err.toString()}\n`);
    });

    socket.connect(WHOIS_PORT, refer, () => {
        // console.log(`whois server: ${refer}, target: ${target}`);
        socket.write(target + '\r\n');
    });
}

function getIpFromUrl(url) {
    let ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\b/; // check https://www.regular-expressions.info/ip.html
    let ip = url.match(ipRegex);
    return ip === null ? false : ip[0];
}

