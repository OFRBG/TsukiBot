const api = require('etherscan-api').init(keys.etherscan);

const getEtherBalance = (address, action = 'b') => {
  if (action === 'b') {
    api.account
      .balance(address)
      .then(
        res =>
          `The total ether registered for \`${address}\` is: \`${res.result /
            1000000000000000000} ETH\`.`
      );
  } else {
    const block = api.proxy.eth_blockNumber();
    const tx = api.proxy.eth_getTransactionByHash(address);

    tx.then(res => {
      if (res.result) {
        if (res.result.blockNumber) {
          block
            .then(blockres =>
              `Transaction included in block \`${web3.utils.hexToNumber(
                res.result.blockNumber
              )}\`.${blockres.result}`
                ? ` Confirmations: \`${1 +
                    web3.utils.hexToNumber(blockres.result) -
                    web3.utils.hexToNumber(res.result.blockNumber)}\``
                : ''
            )
            .catch(
              () =>
                `Transaction included in block \`${web3.utils.hexToNumber(
                  res.result.blockNumber
                )}\`.`
            );
        } else {
          return 'Transaction still not mined.';
        }
      } else {
        return 'Transaction not found. (Neither mined nor broadcasted.)';
      }
    });
  }
};

module.exports = { getEtherBalance };
