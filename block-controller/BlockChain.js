const SHA256 = require('crypto-js/sha256')
const Block = require('./Block.js');
const LevelSandbox = require('./LevelSandbox.js');

class Blockchain {
  constructor () {
    // CRITERION: Genesis block persist as the first block in the blockchain using LevelDB.
    this.bd = new LevelSandbox.LevelSandbox();
    this.getBlockHeight().then((height) => {
      // console.log(height)  // DEBUG
      if (height === -1) this.addBlock(new Block('Genesis block')).then(() => console.log('Genesis block stored!'))
    })
  }

  // Add new block
  // CRITERION: addBlock(newBlock) function includes a method to store newBlock with LevelDB.
  async addBlock (newBlock) {
    // previous block height
    let previousBlockHeight = parseInt(await this.getBlockHeight())
    // Block height
    newBlock.height = previousBlockHeight + 1
    // UTC timestamp
    newBlock.time = new Date().getTime().toString().slice(0, -3)
    // previous block hash
    if (newBlock.height > 0) {
      let previousBlock = await this.getBlock(previousBlockHeight)
      newBlock.previousBlockHash = previousBlock.hash
    }
    // Block hash with SHA256 using newBlock and converting to a string
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString()

    // Adding block object to levelDB
    await this.bd.addLevelDBData(newBlock.height, JSON.stringify(newBlock))
  }

  // Get block height
  // CRITERION: Modify getBlockHeight() function to retrieve current block height within the LevelDB chain.
  async getBlockHeight () {
    return await this.bd.getBlockHeightLevel()
  }

  // get block
  // CRITERION: Modify getBlock() function to retrieve a block by it's block heigh within the LevelDB chain.
  async getBlock (blockHeight) {
    // return object as a single string
    return JSON.parse(await this.bd.getLevelDBData(blockHeight))
  }

  // validate block
  // CRITERION: Modify the validateBlock() function to validate a block stored within levelDB
  async validateBlock (blockHeight) {
    // get block object
    let block = await this.getBlock(blockHeight)
    // get block hash
    let blockHash = block.hash
    // remove block hash to test block integrity
    block.hash = ''

    // generate block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString()

    // Compare
    if (blockHash === validBlockHash) {
      // return true if block is valid
      return true
    } else {
      console.log('Block #' + blockHeight + ' invalid hash:\n' + blockHash + '<>' + validBlockHash)
      return false
    }
  }

  // Validate blockchain
  // CRITERION: Modify the validateChain() function to validate blockchain stored within levelDB
  async validateChain () {
    let errorLog = []
    let blockChainHeight = await this.getBlockHeight()

    for (let i = 0; i < blockChainHeight; i++) {

      // validate a single block
      if (!this.validateBlock(i)) errorLog.push(i)

      // compare blocks hash link
      let blockHash = this.getBlock(i).hash
      let previousHash = this.getBlock(i + 1).previousBlockHash
      if (blockHash !== previousHash) {
        errorLog.push(i)
      }

    }

    if (errorLog.length > 0) {
      console.log('Block errors = ' + errorLog.length)
      console.log('Blocks: ' + errorLog)
    } else {
      console.log('No errors detected')
    }
  }

  // Utility Method to Tamper a Block for Test Validation
  // This method is for testing purpose
  _modifyBlock(height, block) {
    let self = this;
    return new Promise( (resolve, reject) => {
      self.bd.addLevelDBData(height, JSON.stringify(block).toString())
      .then((blockModified) => {
          resolve(blockModified);
      }).catch((err) => { 
        console.log(err); reject(err)
      });
    });
  }

}

module.exports = Blockchain;