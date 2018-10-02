const Web3 = require('web3');
const secrets = require('./secrets');
const HDWalletProvider = require('truffle-hdwallet-provider');
const SmartCarInsuranceContract = require('./ethereum/build/SmartCarInsuranceContract.json');
const configs = require('./configs');
const Tx = require('ethereumjs-tx')

const user_idx = parseInt(process.argv[2]);
let nTransactions = 0;

const provider = new HDWalletProvider(
    secrets.mnemonic,
    secrets.infuraUrl,
    user_idx
);

// console.log(provider);
// console.log(provider.hdwallet._hdkey._privateKey);
// console.log(provider.hdwallet._hdkey._publicKey);

const privKeyBuffer = provider.wallet._privKey;
const pubKeyBuffer = provider.wallet._pubKey;
const accountAddress = provider.address;

// console.log(accountAddress);
// console.log(pubKeyBuffer.toString("hex"));

const web3 = new Web3(provider);
const smartCarInsuranceContract = new web3.eth.Contract(JSON.parse(SmartCarInsuranceContract.interface), configs.contractAddress);

let currentLat = configs.minInitialLat + (configs.maxInitialLat-configs.minInitialLat)*Math.random();
let currentLong = configs.minInitialLong + (configs.maxInitialLong-configs.minInitialLong)*Math.random();



function sendSigned(txData,  cb) {
    const transaction = new Tx(txData);
    transaction.sign(privKeyBuffer);
    const serializedTx = transaction.serialize().toString('hex');
    web3.eth.sendSignedTransaction('0x' + serializedTx, cb);
}

setTimeout(() => {
    setInterval(async () => {
        let thisTransaction = nTransactions++;
        const currentUnixTimestamp = Math.floor(Date.now()/1000);
        console.log(`Sending transaction ${thisTransaction} for user ${user_idx} (${accountAddress}) at ${currentUnixTimestamp}`);
        latLongData = {
            lat: currentLat,
            long: currentLong
        }
        currentLat += (Math.random() > 0.5 ? 1 : -1)*Math.random()*configs.maxCoordinateDeltaBetweenCalls;
        currentLong += (Math.random() > 0.5 ? 1 : -1)*Math.random()*configs.maxCoordinateDeltaBetweenCalls;

        const data = smartCarInsuranceContract.methods.pushGpsData(currentUnixTimestamp, JSON.stringify(latLongData)).encodeABI();
        // console.log(data);

        // TODO: Encriptar latLongData
        // get the number of transactions sent so far so we can create a fresh nonce
        web3.eth.getTransactionCount(accountAddress).then(txCount => {
            // console.log(`txCount for ${accountAddress} is ${txCount}`);
            const txData = {
                nonce: web3.utils.toHex(txCount),
                gasLimit: web3.utils.toHex(250000),
                gasPrice: web3.utils.toHex(1e9), // 1 Gwei
                to: configs.contractAddress,
                from: accountAddress,
                data: data
            }
            // fire away!
            sendSigned(txData, function(err, result) {
                if (err) return console.log('error', err);
                console.log('sent', result);
            });
        })

        // smartCarInsuranceContract.methods.pushGpsData(currentUnixTimestamp, JSON.stringify(latLongData)).send(
        //     {
        //         gas: '1000000',
        //         from: accounts[0]
        //     }
        // )
        //     .then((transactionData) => {
        //         console.log("-----------------------------------------------------------------------");
        //         console.log(`Transaction ${thisTransaction} of user ${user_idx} finished successfuly:`);
        //         console.log(transactionData);
                
        //     })
        //     .catch((err) => {
        //         console.log("-----------------------------------------------------------------------");
        //         console.log(`Transaction ${thisTransaction} of user ${user_idx} finished with ERROR:`);
        //         console.log(err);
        //     });
    }, configs.sendLocationPeriodInMiliseconds);
}, Math.random() * configs.sendLocationPeriodInMiliseconds);
