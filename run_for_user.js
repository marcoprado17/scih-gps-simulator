const Web3 = require('web3');
const secrets = require('./secrets');
const HDWalletProvider = require('truffle-hdwallet-provider');
const SmartCarInsuranceContract = require('./ethereum/build/SmartCarInsuranceContract.json');
const configs = require('./configs');

const user_idx = parseInt(process.argv[2]);
let nTransactions = 0;

const provider = new HDWalletProvider(
    secrets.mnemonic,
    secrets.infuraUrl,
    user_idx
);

const myWeb3 = new Web3(provider);
const smartCarInsuranceContract = new myWeb3.eth.Contract(JSON.parse(SmartCarInsuranceContract.interface), configs.contractAddress);

setTimeout(() => {
    setInterval(async () => {
        const accounts = await myWeb3.eth.getAccounts();
        let thisTransaction = nTransactions++;
        console.log(`Sending transaction ${thisTransaction} for user ${user_idx} (${accounts[0]})`);
        smartCarInsuranceContract.methods.addGpsLocation("1", Math.random().toString()).send(
            {
                gas: '1000000',
                from: accounts[0]
            }
        )
            .then((transactionData) => {
                console.log("-----------------------------------------------------------------------");
                console.log(`Transaction ${thisTransaction} of user ${user_idx} finished successfuly:`);
                console.log(transactionData);
                
            })
            .catch((err) => {
                console.log("-----------------------------------------------------------------------");
                console.log(`Transaction ${thisTransaction} of user ${user_idx} finished with ERROR:`);
                console.log(err);
            });
    }, configs.sendLocationPeriodInMiliseconds);
}, Math.random() * configs.sendLocationPeriodInMiliseconds);
