var Web3 = require('web3');

var url = 'http://127.0.0.1:7545'; // 8545 if using ganache-cli

var web3 = new Web3(url);

web3.eth.getAccounts()
.then(accounts => {
  console.log(accounts);
  console.log('');

  var account = accounts[0];
  console.log('explore account: ', account);

  web3.eth.getBalance(account)
  .then((balance) => {
    console.log('balance WEI: ', balance);

    var balanceETH = web3.utils.fromWei(balance, 'ether');
    console.log('balance ETH: ', balanceETH);
  });
});