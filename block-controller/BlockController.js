const SHA256 = require('crypto-js/sha256');
const Block = require('./Block.js');
const BlockChain = require('./BlockChain.js');
const _ = require('lodash');

/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockController {

    /**
     * Constructor to create a new BlockController, you need to initialize here all your endpoints
     * @param {*} app
     */
    constructor(app) {
        this.app = app;
        this.blocks = new BlockChain();
        this.initializeData();
        this.getBlockByIndex();
        this.postNewBlock();
    }

    /**
     * Implement a GET Endpoint to retrieve a block by index, url: "/block/:index"
     */
    getBlockByIndex() {
        this.app.get("/block/:index", (req, res) => {
            // Add your code here
            let index = req.params.index;
            this.blocks.getBlock(index)
            .then((block) => {
                console.log('block: ', JSON.stringify(block));
                res.status(200).send({"data":block});
            })
            .catch((err) => {
                console.log(err);
                res.status(400).send({
                    http_code: 400,
                    status: 'ERROR',
                    status_code: 101,
                    status_message: 'Block Not Found'
                });
            });
        });
    }

    /**
     * Implement a POST Endpoint to add a new Block, url: "/block"
     */
    postNewBlock() {
        this.app.post("/block", (req, res) => {
            // Add your code here
            console.log('postNewBlock: body: ', req.body);
            if (_.isEmpty(req.body)) {
                res.status(400).send({
                    http_code: 400,
                    status: 'ERROR',
                    status_code: 102,
                    status_message: 'No Data Found'
                });
                return;
            }

            if (_.isNil(req.body.body)) {
                res.status(400).send({
                    http_code: 400,
                    status: 'ERROR',
                    status_code: 103,
                    status_message: 'No Data Found'
                });
                return;
            }

            let data = req.body.body;
            let newBlock = new Block(data);
            this.blocks.addBlock(newBlock)
            .then((result) => {
                //console.log(result);
                res.status(200).send({
                    http_code: 200,
                    status: 'SUCCESS',
                    status_code: 0,
                    body: result
                });
            });
        });
    }

    /**
     * Help method to inizialized Mock dataset, adds 10 test blocks to the blocks array
     */
    initializeData() {}


    /**
     * Help method to inizialized Mock dataset, adds 10 test blocks to the blocks array
     */
    /*
    initializeData() {
        setTimeout(function () {
            console.log("Waiting...")
        }, 10000);

        (function theLoop (i) {
            setTimeout(function () {
                let newBlock = new Block("Test Block - " + (i + 1));
                // Be careful this only will work if your method 'addBlock' in the Blockchain.js file return a Promise
                this.blocks.addBlock(newBlock).then((result) => {
                    //console.log(result);
                    i++;
                    if (i < 10) theLoop(i);
                });
            }, 500); // 10000
          })(0);
    }
    */

    /**
     * Help method to inizialized Mock dataset, adds 10 test blocks to the blocks array
     */
    /**
    initializeMockData() {
        if(this.blocks.length === 0){
            for (let index = 0; index < 10; index++) {
                let blockAux = new BlockClass.Block(`Test Data #${index}`);
                blockAux.height = index;
                blockAux.hash = SHA256(JSON.stringify(blockAux)).toString();
                this.blocks.push(blockAux);
            }
        }
    }
    **/

}

/**
 * Exporting the BlockController class
 * @param {*} app
 */
module.exports = (app) => { return new BlockController(app); }