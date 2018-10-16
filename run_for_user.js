const Web3 = require('web3');
const secrets = require('./secrets');
const HDWalletProvider = require('truffle-hdwallet-provider');
const SmartCarInsuranceContract = require('./ethereum/build/SmartCarInsuranceContract.json');
const configs = require('./configs');
const Tx = require('ethereumjs-tx');
const bip39 = require("bip39");
const hdkey = require('ethereumjs-wallet/hdkey');
const crypto = require('crypto');
const fs = require('fs');

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

const gpsHdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(secrets.gpsMnemonic));

let report = {};
report.configs = configs;
report.data = [];

let initialNonce = 0;

let decodeHexStringToByteArray = function(hexString) {
    // console.log(hexString);
    var result = [];
    while (hexString.length >= 2) { 
        result.push(parseInt(hexString.substring(0, 2), 16));
        hexString = hexString.substring(2, hexString.length);
    }
    // console.log(result);
    return result;
};

(async function(){
    initialNonce = await web3.eth.getTransactionCount(accountAddress);

    console.log(`initialNonce: ${initialNonce}`);

    setTimeout(() => {
        setInterval(async () => {
            try {
                let thisTransaction = nTransactions++;
    
                const currentUnixTimestamp = Math.floor(Date.now()/1000);
        
                latLongData = {
                    lat: currentLat,
                    long: currentLong
                }
                currentLat += (Math.random() > 0.5 ? 1 : -1)*Math.random()*configs.maxCoordinateDeltaBetweenCalls;
                currentLong += (Math.random() > 0.5 ? 1 : -1)*Math.random()*configs.maxCoordinateDeltaBetweenCalls;
        
                let thisLat = currentLat;
                let thisLong = currentLong;

                const i = currentUnixTimestamp-946684800;
                const key = gpsHdwallet.deriveChild(i).getWallet().getPrivateKey();
        
                const cipher = crypto.createCipher("aes256", key)
                let encryptedGpsData = cipher.update(JSON.stringify(latLongData),'utf8','hex');
                encryptedGpsData += cipher.final('hex');
        
                const data = smartCarInsuranceContract.methods.pushGpsData(currentUnixTimestamp, encryptedGpsData).encodeABI();
                let dataAsByteArray = decodeHexStringToByteArray(data.substr(2));
                let nNonZeroBytes = 0;
                let nZeroBytes = 0;
                dataAsByteArray.map((byte) => {
                    if(byte == 0){
                        nZeroBytes++;
                    }
                    else{
                        nNonZeroBytes++;
                    }
                });
                // console.log(`nZeroBytes: ${nZeroBytes}`);
                // console.log(`nNonZeroBytes: ${nNonZeroBytes}`);

                const nonce = initialNonce + thisTransaction;
        
                const txData = {
                    nonce: web3.utils.toHex(nonce),
                    gasLimit: web3.utils.toHex(1000000),
                    gasPrice: web3.utils.toHex(1e9), // 1 Gwei
                    to: configs.contractAddress,
                    from: accountAddress,
                    data: data
                };

                // console.log(txData);
        
                const transaction = new Tx(txData);
                transaction.sign(privKeyBuffer);
                const serializedTx = transaction.serialize().toString('hex');
                const sendTxUnixTimestamp = Math.floor(Date.now()/1000);
                web3.eth.sendSignedTransaction('0x' + serializedTx)
                    .once('transactionHash', function(hash) {
                        console.log(hash);
                    })
                    .on('error', function(err) {
                        let msg = "";
                        msg += `Sending transaction ${thisTransaction}/${nonce} for user ${user_idx} (${accountAddress}) at ${currentUnixTimestamp}\n`;
                        msg += `ERROR: ${err.message}`;
                        console.log(msg);

                        const finishTxUnixTimestamp = Math.floor(Date.now()/1000);
                        report.data.push({
                            idx: thisTransaction,
                            status: "ERROR",
                            message: err.message,
                            creationUnixTimestamp: currentUnixTimestamp,
                            lat: thisLat,
                            long: thisLong,
                            encryptedGpsData: encryptedGpsData,
                            sendTxUnixTimestamp: sendTxUnixTimestamp,
                            finishTxUnixTimestamp: finishTxUnixTimestamp,
                            latency: (finishTxUnixTimestamp-sendTxUnixTimestamp),
                            txData: txData,
                            nNonZeroBytes: nNonZeroBytes,
                            nZeroBytes: nZeroBytes
                        });
                    })
                    .then(function(result) {
                        let msg = "";
                        msg += `Sending transaction ${thisTransaction}/${nonce} for user ${user_idx} (${accountAddress}) at ${currentUnixTimestamp}\n`;
                        msg += `SUCCESS:\n`;
                        msg += `${JSON.stringify(result, null, 4)}`;
                        console.log(msg);

                        const finishTxUnixTimestamp = Math.floor(Date.now()/1000);
                        report.data.push({
                            idx: thisTransaction,
                            status: "OK",
                            creationUnixTimestamp: currentUnixTimestamp,
                            lat: thisLat,
                            long: thisLong,
                            encryptedGpsData: encryptedGpsData,
                            sendTxUnixTimestamp: sendTxUnixTimestamp,
                            finishTxUnixTimestamp: finishTxUnixTimestamp,
                            latency: (finishTxUnixTimestamp-sendTxUnixTimestamp),
                            txData: txData,
                            result: result,
                            nNonZeroBytes: nNonZeroBytes,
                            nZeroBytes: nZeroBytes
                        });
                    });
            }
            catch(err){
                console.error(err);
            }
        }, configs.sendLocationPeriodInMiliseconds);
    }, Math.random() * configs.sendLocationPeriodInMiliseconds);
}());

setInterval(function(){
    const currentUnixTimestamp = Math.floor(Date.now()/1000);
    console.log(`Saving report (${currentUnixTimestamp}.json)...`);
    let stringfiedReport = JSON.stringify(report, null, '\t');
    console.log("report.data.length", report.data.length);
    console.log("Report stringfied");
    // console.log(stringfiedReport);
    fs.writeFileSync(`./temp_reports/${currentUnixTimestamp}.json`, stringfiedReport, 'utf-8');
    console.log(`Report ${currentUnixTimestamp}.json saved`);
}, 15000);
