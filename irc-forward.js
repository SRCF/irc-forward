#!/usr/bin/env node
// Requires node >= 1.0

// IRC config options
const NICK = process.env["NICK"];
const HOST = process.env["HOST"];
const PORT = process.env["PORT"] || 6667;
const CHANNEL = process.env["CHANNEL"];
const PASSWORD = process.env["PASSWORD"];

// Port for incoming messages
const LISTEN_PORT = process.env["LISTEN_PORT"];

// irc client
const net = require("net");
const readline = require("readline");

const client = net.connect({
    host: HOST,
    port: PORT
});

function send(msg, log=true) {
    if (log) {
        console.log(msg);
    }
    client.write(msg + '\r\n');
}
send(`NICK ${NICK}`);
send(`USER ${NICK} 0 * :${NICK}`);
if (PASSWORD !== undefined) {
    send(`PRIVMSG NickServ :IDENTIFY ${PASSWORD}`, false);
}
send(`JOIN ${CHANNEL}`);

const rl = readline.createInterface({
    input: client,
});
rl.on('line', line => {
    if (line.startsWith('PING :')) {
        send(`PONG ${line.slice(5)}`, false);
    } else {
        console.log(line);
    }
});
client.on('close', () => process.exit(1));

// Listening server

// IRC messages have a max length of 512 bytes
const MAX_LENGTH = 512 - `PRIVMSG ${CHANNEL} :  \r\n`.length;
const LENGTH_REGEX = new RegExp(`.{1,${MAX_LENGTH}}`, 'g');

net.createServer(socket => {
    const lines = readline.createInterface({
        input: socket
    });
    let first = true;
    lines.on('line', line => {
        for (const part of line.trim().match(LENGTH_REGEX)) {
            if (first)
                send(`PRIVMSG ${CHANNEL} :${part}`);
            else
                send(`PRIVMSG ${CHANNEL} :  ${part}`);
            first = false;
        }
    });
}).listen(LISTEN_PORT, 'localhost');
