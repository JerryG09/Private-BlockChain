/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because an array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     */
    async initializeChain() {
        if( this.height === -1){
            let block = new BlockClass.Block({data: 'Genesis Block'});
            await this._addBlock(block);
        }
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
     requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
          resolve(`${address}:${new Date().getTime().toString().slice(0,-3)}:starRegistry`);
        });
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     */
    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {
           if (self.chain[self.height]) {
            block.previousBlockHash = self.chain[self.height].hash;
           } else {
             block.previousBlockHash = null;
           }
           block.time = new Date().getTime().toString().slice(0, -3);
           block.height = self.chain.length;
           block.hash = await SHA256(JSON.stringify(block)).toString();
           const isValid = await this.validateChain(this.chain);
           if(isValid === "No error") {
               self.chain.push(block);
               self.height += 1;
               let newChain = this.chain;
               resolve(block);
           } else {
               reject(new Error('Invalid Chain...'))
           }
        });
    }

}

module.exports.Blockchain = Blockchain;   