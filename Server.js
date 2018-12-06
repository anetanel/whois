const http = require('http');
const net = require('net');

const WHOIS_ROOT = 'whois.iana.org';
const PORT = 43;
const USER_PASS = {"netanel": "1234", "admin": "admin", "hax0r": "password"};

http.createServer((req, res) => { // Start http server and call wClient for each request
    if (authenticate(req, res)) {
        let target = req.url.substr(1);
        wClient(WHOIS_ROOT, target, res)
    }
}).listen(8080);

function authenticate(req, res) {
    let auth = req.headers['authorization'];
    console.log("Authorization Header is: ", auth);
    if (!auth) {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
        res.end('Need some creds son');
        return false;
    } else if (auth) {
        let tmp = auth.split(' ');   // Split on a space, the original auth looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part
        let buf = Buffer.from(tmp[1], 'base64');
        let plain_auth = buf.toString();        // read it back out as a string

        console.log("Decoded Authorization ", plain_auth);
        let creds = plain_auth.split(':');      // split on a ':'
        let username = creds[0];
        let password = creds[1];

        if (USER_PASS[username] === password) {   // Is the username/password correct?
            res.statusCode = 200;  // OK
            return true;
        } else {
            // res.statusCode = 401; // Force them to retry authentication
            // res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');

            res.statusCode = 403;   // or alternatively just reject them altogether with a 403 Forbidden

            res.end('You shall not pass\n');
            return false;
        }
    }
}

function wClient(refer, target, res) {
    let data = '';
    let socket = new net.Socket();

    socket.on('data', chunk => { // accumulate data from server
        data += chunk;
    });

    socket.on('end', () => { // Got all data from the server
        let pretty_data = data.replace(/[%#].*\n/g, '').replace(/\n{2,}/g, "\n");
        res.write('\n---------------START----------------\n');
        res.write(pretty_data);
        res.write('\n---------------END------------------\n');
        console.log(data);

        if (data.search('refer:') > 0) { // found refer in data string
            let next_refer = data.toString().match('refer:.*\n')[0].split(":")[1].trim() // isolate fefer address
            console.log(`got next refer: ${next_refer}`);
            wClient(next_refer, target, res)
        } else {
            console.log('made it to the end..');
            socket.destroy();
            res.end();
        }
    });

    socket.on('close', () => {
        console.log('Connection closed');
    });

    socket.on('error', err => {
        console.error('error: ', err);
        res.write(`Error getting ${target} whois information.\n${err.toString()}`);
        res.end();
    });

    socket.connect(PORT, refer, () => {
        console.log(`whois server: ${refer}, target: ${target}`);
        socket.write(target + '\r\n');
    });
}

