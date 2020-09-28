#!/usr/bin/env node
// Requires node >= 1.0

// IRC config options
const NICK = process.env["NICK"];
const HOST = process.env["HOST"];
const PORT = process.env["PORT"];
const CHANNEL = process.env["CHANNEL"];
const PASSWORD = process.env["PASSWORD"];

// Port for incoming http requests
const LISTEN_PORT = process.env["LISTEN_PORT"];

// irc client
const net = require("net");
const readline = require("readline");

const client = net.connect({
    host: HOST,
    port: PORT
});

function send(msg) {
    console.log(msg);
    client.write(msg + '\r\n');
}
send(`NICK ${NICK}`);
send(`USER ${NICK} 0 * :${NICK}`);
// Don't leak password to log
console.log(`PRIVMSG NickServ :IDENTIFY hunter2`);
client.write(`PRIVMSG NickServ :IDENTIFY ${PASSWORD}\r\n`);
send(`JOIN ${CHANNEL}`);

const rl = readline.createInterface({
    input: client,
});
rl.on('line', line => {
    if (line.startsWith('PING :')) {
        client.write(`PONG ${line.slice(5)}\r\n`);
    } else {
        console.log(line);
    }
});
client.on('close', () => process.exit(1));

// http server
const http = require('http');

// IRC messages have a max length of 512 bytes
const MAX_LENGTH = 512 - `PRIVMSG ${CHANNEL} :\r\n`.length;
const LENGTH_REGEX = new RegExp(`.{1,${MAX_LENGTH}}`, 'g');

http.createServer((req, res) => {
    const lines = readline.createInterface({
        input: req
    });
    lines.on('line', line => {
        if (line === '') {
            return;
        }
        for (const part of line.match(LENGTH_REGEX)) {
            send(`PRIVMSG ${CHANNEL} :${part}`);
        }
    });
    lines.on('close', () => {
        res.writeHead(200);
        res.end('');
    });
}).listen(LISTEN_PORT, 'localhost');
