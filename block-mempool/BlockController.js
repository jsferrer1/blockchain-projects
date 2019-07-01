const SHA256 = require('crypto-js/sha256');
const _ = require('lodash');

const block = require('./Block.js');
const blockchain = require('./BlockChain.js');
const PrivateChain = new blockchain.Blockchain;

const mempool = require('./MemPool.js');
const Mempool = new mempool.MemPool;

/**
 * Star Object
 *
 */

class Star {
  constructor(data) {
    this.address = data.address;
    this.star = {
      ra: data.star.ra,
      dec: data.star.dec,
      mag: '',
      cen: '',
      story: Buffer(data.star.story).toString('hex')
    };
  }
}


/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockController {

  /**
   * Constructor to create a new BlockController, you need to initialize here all your endpoints
   * @param {*} app
   */
  constructor(app) {
    // attributes
    this.app = app;
    //this.blocks = new BlockChain();
    //this.mempool = new memPool.MemPool();

    // methods
    this.getBlockByIndex();
    this.postNewBlock();
    this.postNewBlock3();
    this.requestValidation();
    this.validateRequest();
    this.getMempool();
  }

  /**
   * Implement a GET Endpoint to retrieve a block by index, url: "/block/:index"
   */

  getBlockByIndex() {
    this.app.get("/block/:index", (req, res) => {
      // Add your code here
      let index = req.params.index;
      PrivateChain.getBlock(index)
        .then((block) => {
          console.log('block: ', JSON.stringify(block));
          res.status(200).send({ "data": block });
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

  //https://stackoverflow.com/questions/3745666/how-to-convert-from-hex-to-ascii-in-javascript
  hex2ascii(hexx) {
    let hex = hexx.toString(); //force conversion
    let str = '';
    for (let i = 0;
      (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
  };

  /**
   * Implement a POST Endpoint to add a new Block, url: "/block"
   */

  postNewBlock() {
    this.app.post("/block", (req, res) => {
      let self = this;
      // Add your code here
      console.log('postNewBlock: body: ', req.body);
      if (_.isEmpty(req.body)) {
        res.status(400).send({
          http_code: 400,
          status: 'ERROR',
          status_code: 101,
          status_message: 'Missing Resource: body'
        });
        return;
      }

      // verify the request from the mempool
      let body = req.body;
      let star = new Star(body);

      Mempool.verifyAddressRequest(star)
        .then(function(blockStatus) {
          // confirm that it's valid
          console.log('postNewBlock: blockStatus: ', blockStatus)
          if (blockStatus == true) {
            // append block to the Blockchain
            body.star.story = Buffer(body.star.story).toString('hex');
            let newBlock = new block.Block(body);
            console.log('postNewBlock: addBlock: ', newBlock)
            PrivateChain.addBlock(newBlock)
              .then(function(resBlock) {
                // convert the story from hex to ascii
                console.log('postNewBlock: resBlock: ', resBlock);
                resBlock.body.star.storyDecoded = self.hex2ascii(resBlock.body.star.story);

                //console.log(result);
                res.status(200).send({
                  http_code: 200,
                  status: 'SUCCESS',
                  status_code: 0,
                  body: resBlock
                });

                // remove address from the mempool
                console.log('postNewBlock: remove address: ', star.address);
                Mempool.removeValidation(star.address);
              })
              .catch(function(err) {
                console.log('postNewBlock: addBlock: error: ', err);
                res.status(500).send({
                  http_code: 500,
                  status: 'ERROR',
                  status_code: 101,
                  status_message: 'Cannot add block.'
                });
              });
          } else {
            res.status(500).send({
              http_code: 500,
              status: 'ERROR',
              status_code: 102,
              status_message: 'Star already exists.'
            });
          }
        })
        .catch(function(err) {
          if (err == 500) {
            res.status(500).send({
              http_code: 500,
              status: 'ERROR',
              status_code: 103,
              status_message: 'Cannot varify address.'
            });
          } else if (err == 400) {
            res.status(400).send({
              http_code: 400,
              status: 'ERROR',
              status_code: 101,
              status_message: 'Cannot find address in mempool. Please re-validate your address.'
            });
          };
        });

    });
  }

  /**
   * Implement a POST Endpoint to request for validation"
   */

  requestValidation() {
    this.app.post("/requestValidation", (req, res) => {
      // Add your code here
      console.log('start /requestValidation');
      if (_.isNil(req.body.address)) {
        res.status(400).send({
          http_code: 400,
          status: 'ERROR',
          status_code: 101,
          status_message: 'Missing resource: address'
        });
        return false;
      }

      let address = req.body.address;
      let mIndex = _.indexOf(Mempool, address);
      if (mIndex >= 0) {
        // duplicate address
        res.status(400).send({
          http_code: 400,
          status: 'ERROR',
          status_code: 101,
          status_message: 'Duplicate request: address'
        });
        return false;
      }

      // addRequestValidation
      Mempool.requestValidation(address)
        .then((requestObject) => {
          res.status(200).send({ "request": requestObject });
          return true;
        })
        .catch(function(err) {
          res.status(500).send({
            http_code: 500,
            status: 'ERROR',
            status_code: 101,
            status_message: 'Server cannot create a validation request.'
          });
          return false;
        });

    });
  }

  /**
   * Implement a GET Endpoint to retrieve a block by index, url: "/block/:index"
   */

  getMempool() {
    this.app.get("/mempool", (req, res) => {
      // Add your code here
      var mempool = [];
      var size = _.size(Mempool.mempool);
      console.log('mempool.size: ', size);
      for (var i = 0; i < size; i++) {
        console.log(`mempool[${i}]: `, Mempool.mempool[i]);
        mempool.push(i);
      }
      console.log('mempool: ', mempool);
      res.status(200).send({ "mempool": JSON.stringify(mempool) });
    });
  }

  /**
   * Implement a POST Endpoint to validate request"
   */

  validateRequest() {
    this.app.post("/message-signature/validate", (req, res) => {
      console.log('start /message-signature/validate');
      if (_.isNil(req.body.address) || _.isNil(req.body.signature)) {
        res.status(400).send({
          http_code: 400,
          status: 'ERROR',
          status_code: 101,
          status_message: 'Missing resource: address, signature'
        });
        return false;
      }

      // validateRequestByWallet
      let address = req.body.address;
      let signature = req.body.signature;
      Mempool.validateRequestByWallet(address, signature)
        .then((validReturn) => {
          res.status(200).send({ "valid": validReturn });
          return true;
        })
        .catch(function(err) {
          console.log('Error: ', err);
          res.status(500).send({
            http_code: 500,
            status: 'ERROR',
            status_code: 101,
            status_message: 'Server cannot create a validation request.'
          });
          return false;
        });
    });
  }
} // END

/**
 * Exporting the BlockController class
 * @param {*} app
 */
module.exports = (app) => { return new BlockController(app); }