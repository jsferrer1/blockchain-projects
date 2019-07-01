/* ===== Persist data with LevelDB ==================
|  Learn more: level: https://github.com/Level/level |
/===================================================*/

const level = require('level');
const chainDB = './chaindata';

const db = level(chainDB);

class LevelSandbox {

  getBlockHeightLevel () {
    return new Promise((resolve, reject) => {
      let height = -1
      db.createReadStream().on('data', (data) => {
        height++
      }).on('error', (err) => {
        console.log('Unable to read data stream!', err)
        reject(err)
      }).on('close', () => {
        // console.log('Blockchain height is #' + height) // DEBUG
        resolve(height)
      })
    })
  }

  // Add data to levelDB with key/value pair
  addLevelDBData (key, value) {
    return new Promise((resolve, reject) => {
      db.put(key, value, (err) => {
        if (err) {
          console.log('Block ' + key + ' submission failed', err)
          reject(err)
        }
        else {
          console.log('Block #' + key + ' stored')
          resolve(value)
        }
      })
    })
  }

  // Get data from levelDB with key
  getLevelDBData (key) {
    return new Promise((resolve, reject) => {
      db.get(key, (err, value) => {
        if (err) {
          console.log('Not found!', err)
          reject(err)
        } else {
          // console.log('Value = ' + value)  // DEBUG
          resolve(value)
        }
      })
    })
  }      
}

module.exports.LevelSandbox = LevelSandbox;
