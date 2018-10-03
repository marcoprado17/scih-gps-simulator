const Web3 = require('web3');
const secrets = require('./secrets');
const HDWalletProvider = require('truffle-hdwallet-provider');
const SmartCarInsuranceContract = require('./ethereum/build/SmartCarInsuranceContract.json');
const configs = require('./configs');
const Tx = require('ethereumjs-tx')
const bip39 = require("bip39");
const hdkey = require('ethereumjs-wallet/hdkey');
const crypto = require('crypto');

const user_idx = parseInt(process.argv[2]);

const provider = new HDWalletProvider(
    secrets.mnemonic,
    secrets.infuraUrl,
    user_idx
);

const privKeyBuffer = provider.wallet._privKey;
const accountAddress = provider.address;
const web3 = new Web3(provider);
const smartCarInsuranceContract = new web3.eth.Contract(JSON.parse(SmartCarInsuranceContract.interface), configs.contractAddress);

let nTransactions = 0;
let currentLat = configs.minInitialLat + (configs.maxInitialLat-configs.minInitialLat)*Math.random();
let currentLong = configs.minInitialLong + (configs.maxInitialLong-configs.minInitialLong)*Math.random();

const gpsHdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(configs.gpsMnemonic));
// const wallet = gpsHdwallet.deriveChild(0).getWallet();
// console.log(wallet.getPrivateKey());
// console.log(wallet.getPublicKey());
// console.log(wallet.getAddress());
// console.log();
// console.log(gpsHdwallet.derivePath("m/0/0").getWallet());

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

        // TODO: Obter a child baseado no unix datetime
        const i = currentUnixTimestamp-946684800;
        const key = gpsHdwallet.deriveChild(i).getWallet().getPrivateKey();

        var cipher = crypto.createCipher("aes256", key)
        var encryptedGpsData = cipher.update(JSON.stringify(latLongData),'utf8','hex');

        const data = smartCarInsuranceContract.methods.pushGpsData(currentUnixTimestamp, encryptedGpsData).encodeABI();

        // TODO: Encriptar latLongData
        // get the number of transactions sent so far so we can create a fresh nonce
        web3.eth.getTransactionCount(accountAddress).then(txCount => {
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
    }, configs.sendLocationPeriodInMiliseconds);
}, Math.random() * configs.sendLocationPeriodInMiliseconds);
