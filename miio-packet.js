'use strict';

const crypto = require('crypto');

/* MD5 function */
function md5(s) {
    return crypto.createHash('md5').update(s).digest('hex');
}

/* Buffer from hex */
function b(h) {
    return Buffer.from(h, 'hex');
}

/* All data in class fields stored as HEX string */
module.exports = class miioPacket {
    #magic = '2131';
    #length = 0;
    #unknown = '00000000';
    #devicetype = '0000';
    #deviceid = '0000';
    #ts = '00000000';
    #checksum = '';
    #data = '';

    #tsdiff = 0;

    #token = '';
    #key = '';
    #iv = '';

    /* set token and create key and init vector from token */
    set token(token) {
        if (typeof token == 'string' && RegExp(/^[A-Fa-f0-9]{32}$/gm).test(token) == true) {
            this.#token = token;
            this.#key = md5(b(this.#token));
            this.#iv = md5(b(this.#key + this.#token));
        } else {
            this.#token = '';
            this.#key = '';
            this.#iv = '';
        }
    }

    /* get token */
    get token() {
        return this.#token;
    }

    /* Encrypt data */
    encryptData(data) {
        if (this.#key.length == 32 && this.#iv.length == 32) {
            const cipher = crypto.createCipheriv('aes-128-cbc', b(this.#key), b(this.#iv));
            return Buffer.concat([cipher.update(data, 'hex'), cipher.final()]).toString('hex');
        } else {
            return undefined;
        }
    }

    /* Decrypt data */
    decryptData(data) {
        if (this.#key.length == 32 && this.#iv.length == 32) {
            const decipher = crypto.createDecipheriv('aes-128-cbc', b(this.#key), b(this.#iv));
            return Buffer.concat([decipher.update(data, 'hex'), decipher.final()]).toString('utf8');
        } else {
            return undefined;
        }
    }

    /* */
    messagePack(cmd) {
        this.#data = this.encryptData(cmd);

        this.#length = parseInt(this.#data.length / 2 + 32, 10).toString(16).padStart(4, '0');
        this.#ts = (parseInt(Math.round(Date.now() / 1000), 10) + this.#tsdiff).toString(16).padStart(8, '0');

        const packet = [this.#magic, this.#length, this.#unknown, this.#devicetype, this.#deviceid, this.#ts, this.#token, this.#data];
        this.#checksum = md5(b(packet.join('')));
        packet[6] = this.#checksum;

        return packet.join('');
    }

    /* */
    messageUnpack(msg) {
        this.#magic = String(msg).substr(0, 4);
        this.#length = String(msg).substr(4, 4);
        this.#unknown = String(msg).substr(8, 8);
        this.#devicetype = String(msg).substr(16, 4);
        this.#deviceid = String(msg).substr(20, 4);
        this.#ts = String(msg).substr(24, 8);
        this.#checksum = String(msg).substr(32, 32);

        if ((this.#length == '0020') && (String(msg).length == 64)) {
            if (RegExp(/^[Ff]{32}$/gm).test(this.#checksum) == false) {
                this.token = this.#checksum;
            }
            this.#tsdiff = parseInt(this.#ts, 16) - parseInt(Math.round(Date.now() / 1000), 10);
        } else {
            const d_length = String(msg).length - 64;
            if (d_length > 0) {
                this.#data = String(msg).substr(64, d_length);
            }
        }
    }

    /* */
    printHeader() {
        const header = [
            `magic: ${this.#magic}`, 
            `length: ${this.#length}`, 
            `unknown: ${this.#unknown}`, 
            `devicetype: ${this.#devicetype}`, 
            `deviceid: ${this.#deviceid}`, 
            `ts: ${this.#ts}`,
            `checksum: ${this.#checksum}`
        ].join('; ');

        return header;
    }

    /* */
    printData() {
        return this.#data != '' ? this.decryptData(this.#data) : '';
    }

    /* */
    printPacket() {
        return [this.printHeader(), this.printData()];
    }
};
