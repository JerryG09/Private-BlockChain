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

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
          let messageTime = parseInt(message.split(':')[1])
          let currenTime = parseInt(new Date().getTime().toString().slice(0, -3));
          if ((currenTime - messageTime) > 300) {
            reject(new Error("Five Minutes Elapsed"));
            return;
          }
          if (!bitcoinMessage.verify(message, address, signature)) {
            reject(new Error("Invalid Message Bubus"));
          }
          let data = { address, message, signature, star };
          let block = new BlockClass.Block(data);
          await self._addBlock(block);
          resolve(block);
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
           let block = self.chain.filter(p => p.hash === hash)[0];
           if (block) {
               return resolve(block);
           } else {
               resolve(null);
           }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.find(p => p.height === height);
            if(block){
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * @param {*} address 
     */
     getStarsByWalletAddress (address) {
        let self = this;
        let stars = [];
        return new Promise((resolve, reject) => {
            let newChain = [];
            if (self.chain.length >= 1) {
                newChain = self.chain.slice(1, self.chain.length);
            }
            newChain.forEach(async(block) => {
                let blockDecoded = await block.getBData();
                if(blockDecoded.address === address){
                    stars.push(blockDecoded);
                }
                else {
                    reject(new Error('Address not found.'));
                }
                resolve(stars);
            });
        })
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     */
     validateChain(){
        let self = this;
        return new Promise(async (resolve, reject) => {
            let errorLog = self.chain.reduce(async(acc, currentBlock, index) => {
                if (index === 0) {
                    // console.log('Genesis Block')
                    return;
                }
                let prevBlock = self.chain[index - 1];
                let isCurrentBlockValid = await currentBlock.validate();
                let isPreviousBlockValid = await prevBlock.validate();
                let prevBlockHash = prevBlock.hash;
                let currentBlockPrevHash = currentBlock.previousBlockHash;
                if (isCurrentBlockValid && isPreviousBlockValid) {
                    if (prevBlockHash !== currentBlockPrevHash) {
                        acc.push({err: new Error('Link is Invalid')})
                    }
                } else {
                    acc.push({err: new Error('Link is Invalid')})
                }
                return acc;
            }, []);
            if (errorLog.length > 0 ) {
                resolve(errorLog)
            }else {
                resolve('No error')
            }
        })
    }
}

module.exports.Blockchain = Blockchain;   