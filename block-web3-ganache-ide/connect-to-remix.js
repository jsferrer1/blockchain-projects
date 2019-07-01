// Step 1 - Configuration
var Web3 = require("web3")
var web3 = new Web3('http://127.0.0.1:7545')

web3.eth.getTransactionCount('0xb0Ad81450696e8f4C77e65F12E339C5aA00bc2AE').then(console.log)