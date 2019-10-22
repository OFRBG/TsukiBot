const web3 = require('web3');

const Web3 = new web3(
  new web3.providers.HttpProvider(`https://kovan.infura.io/${keys.infura}`)
); // eslint-disable-line new-cap

const abi = require('./abi');

module.exports = {
  ProductRegister: new Web3.eth.Contract(
    abi,
    '0x27659AB24B40461Bdc9DC3817683CC0508f74c42'
  )
};
