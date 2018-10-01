import Web3 from 'web3';
const secrets = require('../secrets');
const HDWalletProvider = require('truffle-hdwallet-provider');

const provider = new HDWalletProvider(
    secrets.mnemonic,
    secrets.infuraUrl,
    0
);

let web3 = new Web3(provider);

export default web3;
