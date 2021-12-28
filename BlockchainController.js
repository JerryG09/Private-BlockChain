class BlockchainController {
    //The constructor receive the instance of the express.js app and the Blockchain class
    constructor(app, blockchainObj) {
        this.app = app;
        this.blockchain = blockchainObj;
        // All the endpoints methods needs to be called in the constructor to initialize the route.
        this.getBlockByHeight();
        this.getValidChain();
    }

    // Enpoint to Get a Block by Height (GET Endpoint)
    getBlockByHeight() {
        this.app.get("/block/height/:height", async (req, res) => {
            if(req.params.height) {
                const height = parseInt(req.params.height);
                let block = await this.blockchain.getBlockByHeight(height);
                if(block){
                    return res.status(200).json(block);
                } else {
                    return res.status(404).send("Block Not Found!");
                }
            } else {
                return res.status(404).send("Block Not Found! Review the Parameters!");
            }
            
        });
    }

    // Endpoint to Get a valid chain
    getValidChain() {
        this.app.get("/blockchain/:chain", async (req, res) => {
            if(req.params.chain) {
                const chain = req.params.chain;
                let blockChain = await this.blockchain.validateChain(chain);
                if(blockChain){
                    return res.status(200).json(blockChain);
                } else {
                    return res.status(404).send("BlockChain Not Valid!");
                }
            } else {
                return res.status(404).send("BlockChain Not Found! Review the Parameters!");
            }
            
        });
    }

}

module.exports = (app, blockchainObj) => { return new BlockchainController(app, blockchainObj);}