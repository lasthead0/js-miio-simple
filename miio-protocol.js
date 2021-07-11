'use strict';

const dgram = require('dgram');
const miioPacket = require('./miio-packet');

const HELLO_MESSAGE = '21310020ffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

const dl = msg => console.dir(msg, {depth: null});

module.exports = class miioProtocol {
    #LOGGER = undefined;
    #ip = '';
    #timeout = 0;

    #miPacket = undefined;

    constructor(ip, token, logger = dl, timeout = 5000) {
        if (typeof logger == 'function') {
            this.#LOGGER = logger;
            this.#timeout = timeout;
        }
        if (typeof logger == 'number') {
            this.#LOGGER = dl;
            this.#timeout = logger;
        }

        this.#ip = ip;

        this.#miPacket = new miioPacket();
        this.#miPacket.token = token;
    }

    /* */
    socketSendRecv(cmd, ip, port = 54321, timeout = this.#timeout) {
        var timeout1 = undefined;
        return new Promise((resolve, reject) => {
            try {
                const socket = dgram.createSocket('udp4');

                socket.on('error', err => {
                    socket.close();
                    reject(err);
                });
        
                socket.on('message', msg => {
                    socket.disconnect();
                    socket.close();

                    resolve(Buffer.from(msg, 'binary').toString('hex'));
                });
        
                socket.connect(port, ip, () => {
                    socket.send(Buffer.from(cmd, 'hex'), () => {
                        timeout1 = setTimeout(() => {
                            socket.close();
                            reject(new Error('Device did not answer in time.'));
                        }, timeout);
                    });
                });
            } catch (error) {
                this.#LOGGER(error.stack);
            }
        })
        .then(msg => msg)
        .catch(error => error)
        .finally(() => {
            clearTimeout(timeout1);
        });
    }

    /* */
    recvAnswer(msg) {
        if (msg instanceof Error) {
            return [false, msg];
        } else if (typeof msg == 'string') {
            this.#miPacket.messageUnpack(msg);
            return [true, this.#miPacket.printPacket()];
        }
    }

    /* */
    async discover() {
        const msg = await this.socketSendRecv(HELLO_MESSAGE, this.#ip);
        return this.recvAnswer(msg);
    }

    /* */
    async cmdSend(cmd) {
        let cmd1 = '';
        this.#LOGGER(cmd);
        if (typeof cmd == 'object') {
            cmd.id = Math.floor(Math.random() * 99998) + 1;
            cmd1 = JSON.stringify(cmd);
            this.#LOGGER(cmd1);
        } else {
            return [false, new Error('Incorrect command format')];
        }
        const msg1 = this.#miPacket.messagePack(Buffer.from(cmd1, 'utf8').toString('hex'));
        const msg = await this.socketSendRecv(msg1, this.#ip);

        return this.recvAnswer(msg);
    }
};
