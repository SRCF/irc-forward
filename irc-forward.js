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

client.write(`NICK ${NICK}\r\n`);
client.write(`USER ${NICK} ${NICK} ${NICK} :${NICK}\r\n`);
client.write(`PRIVMSG NickServ :IDENTIFY ${PASSWORD}\r\n`);
client.write(`JOIN ${CHANNEL}\r\n`);

const rl = readline.createInterface({
    input: client,
});
rl.on('line', line => {
    if (line.startsWith('PING :')) {
        client.write(`PONG ${line.slice(5)}`);
    }
});

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
            client.write(`PRIVMSG ${CHANNEL} :${part}\r\n`);
        }
    });
    lines.on('close', () => {
        res.writeHead(200);
        res.end('');
    });
}).listen(LISTEN_PORT, 'localhost');
