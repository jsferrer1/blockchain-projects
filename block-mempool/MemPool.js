// Bitcoin libraries

const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

/**
 * MemPool class
 */

class validationBlock {
  constructor(data) {
    this.walletAddress = data;
    this.requestTimeStamp = new Date().getTime().toString().slice(0, -3);
    this.message = this.walletAddress.toString() + ":" + this.requestTimeStamp.toString() + ":starRegistry";
    this.validationWindow = 300;
  }
}

/**
 * validation status class
 * used in mempool, as JSON object sent to client after validation
 */

class validationStatus {
    constructor(sign, validBlock) {
        this.registerStar = sign;
        this.status = {
            "address": validBlock.walletAddress,
            "requestTimeStamp": validBlock.requestTimeStamp,
            "message": validBlock.message,
            "validationWindow": validBlock.validationWindow,
            "messageSignature": sign
        };
    }
}

/**
 * MemPool class
 */

class MemPool {

  constructor() {
    this.mempool = [];
    this.timeoutRequest = [];
  };

  async TimeTracker(index) {
    let self = this;
    var prev = self.mempool[index].request;
    let timeElapse = (new Date().getTime().toString().slice(0, -3)) - prev.requestTimeStamp;
    let timeLeft = (5 * 60 * 1000 / 1000) - timeElapse; // 5 minutes
    prev.validationWindow = timeLeft;
  };

  /**
   * Help method to add the request to the mempool
   */

  requestValidation(address) {
    let self = this;
    //Add your code here
    return new Promise(function(resolve, reject){
      const TimingWindow = 5*60*1000; // 5 minutes
      var index = self.mempool.findIndex(x => x.id === address);
      if (index != -1) { // not found
        self.TimeTracker(index,TimingWindow);
        resolve(self.mempool[index].request);
      } else { // found
        var request = new validationBlock(address);
        console.log(`Validate ${address} in ${TimingWindow/(60*1000)} minutes.`);
        console.log(`Validate request: `, request);

        // mempool data [{id: adddress, request}, {...}]
        self.mempool.push({id:request.walletAddress, request},
          setTimeout(function() {
            self.removeValidation(request.walletAddress);
          }, TimingWindow)); // auto removing in 5 min from mempool
        resolve(request);
      }

    }).catch(function(err){
        reject(500);
    });

  }

  // removes validation block from mempool by address
  removeValidation(address) {
    let self = this;
    // Add your code here
    var valueToRemove = self.mempool.findIndex(x => x.id === address);
    console.log(`Removing: address ${address} valueToRemove ${valueToRemove}`);
    self.mempool.splice(valueToRemove, 1);
    console.log('mempool: ', self.mempool);
  };

  /**
   *
   */

  validateRequestByWallet(address, signature) {
    let self = this;
    // Add your code here
    return new Promise(function(resolve, reject) {
      try {
        // Find the request in mempool using the wallet address
        console.log('validate: mempool: ', self.mempool);
        var index = self.mempool.findIndex(x => x.id === address);
        console.log('validate: address: index: ', index);
        if (index != -1) { // not found
          // check block
          if (self.mempool[index].Block == undefined) {
            console.log('Block == undefined');
            let message = self.mempool[index].request.message;
            let isValid = bitcoinMessage.verify(message, address, signature);

            self.TimeTracker(index);

            let Block = new validationStatus(isValid, self.mempool[index].request);
            console.log('Block: ', Block);
            self.mempool[index]['Block'] = (Block);
            resolve(Block)
          } else {
            self.TimeTracker(index);
            self.mempool[index].Block.status.validationWindow = self.mempool[index].request.validationWindow;
            resolve(self.mempool[index].Block);
          }
        } else { // found
          reject(410);
        }

      } catch(err) {
        console.log('validateRequestByWallet: Error: ', err);
        reject(500);
      }
    });
  } // validateRequestByWallet

  // verify star.address request
  verifyAddressRequest(star) {
    let self = this;
    // Add your code here
    return new Promise(function(resolve, reject) {
      try {
        console.log('verifyAddressRequest: star.address: ', star.address);
        var index = self.mempool.findIndex(x => x.id === star.address);
        if (index != -1) { // found
          let isValid = self.mempool[index].Block.status.messageSignature;
          if (isValid == true) {
            resolve(true);
          } else {
            resolve(false);
          }
        } else {
          reject(400);
        }
      } catch (err) {
        reject(500);
      }

    });

  } // verifyAddressRequest

} // MemPool


module.exports.MemPool = MemPool;

