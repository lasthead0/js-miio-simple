'use strict';

const yargs = require('yargs');
const {hideBin} = require('yargs/helpers');

const miioProtocol = require('./miio-protocol');

/* RegExp patterns */
const testIP = new RegExp(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.{0,1}){4}$/gm);
const testToken = new RegExp(/^[A-Fa-f0-9]{32}$/gm);

(async () => {
    /* CLI usage description */
    const argv = yargs(hideBin(process.argv))
    // .usage('Usage: $0 <command> [options]')
    // .command('discover <ip>', 'Check device availability')
    // .command('send <ip> <token> <cmd>', 'Send command to device')
    .string(['ip', 'token', 'cmd'])
    .boolean(['debug'])
    .nargs('ip', 1)
    .nargs('token', 1)
    .usage('$0 --ip ip --token token --cmd cmd', 'Send command to device.')
    .usage('$0 --ip ip', 'Check device availability')
    .usage('$0', 'CLI for simple NodeJS miIO protocol lib')
    .describe('ip', 'Device IP address')
    .describe('token', 'Device token')
    .describe('cmd', 'Command to device')
    .describe('debug', 'Enable debug mode for verbose output')
    .help('h')
    .alias('h', 'help')
    .argv;

    /* */
    const {ip, token, cmd, debug} = argv;

    /* if --cmd is not set */
    if (cmd == undefined) {
        if (ip != undefined && testIP.test(ip) == true) {
            const miIO = new miioProtocol(ip, token);

            if (debug) console.log("sending HELLO message.");

            const [res, msg] = await miIO.discover();
            if (res) {
                if (debug) console.log(msg[0]);
                console.log(`Device (${ip}) is available.`);
            } else {
                console.error(msg.stack);
            }
        } else if (ip == undefined || testIP.test(ip) != true) {
            console.error("Argument --ip is not set or it is incorrect.");
            process.exit(-1);
        }
    }

    /* if --cmd is set */
    if (cmd != undefined) {
        if (ip == undefined || testIP.test(ip) != true) {
            console.error("You set --cmd, but --ip is not set or it is incorrect.")
            process.exit(-1)
        }
        if (token == undefined || testToken.test(token) != true) {
            console.error("You set --cmd, but --token is not set or it is incorrect.")
            process.exit(-1)
        }

        const miIO = new miioProtocol(ip, token);

        const [res, msg] = await miIO.discover();
        if (res) {
            if (debug) console.log(msg[0]);
        } else {
            console.error(msg.stack);
        }

        const [res1, msg1] = await miIO.cmdSend(cmd);
        if (res1) {
            if (debug) console.log(msg1[0]);
            console.log(`Device (${ip}) is available and answered:`);
            console.log(msg1[1]);
        } else {
            console.error(msg1.stack);
        }
    }
})();