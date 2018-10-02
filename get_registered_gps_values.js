const Web3 = require('web3');
const secrets = require('./secrets');
const HDWalletProvider = require('truffle-hdwallet-provider');
const SmartCarInsuranceContract = require('./ethereum/build/SmartCarInsuranceContract.json');
const configs = require('./configs');

const provider = new HDWalletProvider(
    secrets.mnemonic,
    secrets.infuraUrl,
    0
);

const myWeb3 = new Web3(provider);
const smartCarInsuranceContract = new myWeb3.eth.Contract(JSON.parse(SmartCarInsuranceContract.interface), configs.contractAddress);

(async function(){
    const accounts = await myWeb3.eth.getAccounts();
    const address = accounts[0];
    console.log(accounts);
    console.log(address);
    let r = await smartCarInsuranceContract.methods.gpsLocationsByUserAddress(address, 0).call();
    console.log(r);
}());
