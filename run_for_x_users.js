const Web3 = require('web3');
const secrets = require('./secrets');
const HDWalletProvider = require('truffle-hdwallet-provider');
const SmartCarInsuranceContract = require('./ethereum/build/SmartCarInsuranceContract.json');
const configs = require('./configs');
const Tx = require('ethereumjs-tx');
const bip39 = require("bip39");
const hdkey = require('ethereumjs-wallet/hdkey');
const crypto = require('crypto');
const axios = require('axios');
const ethereumjs = require('ethereumjs-util');

const processIdx = parseInt(process.argv[2]);
const nUsersPerProcess = configs.nUsersPerProcess;
const firstUserIdx = processIdx*nUsersPerProcess;
const lastUserIdx = firstUserIdx + nUsersPerProcess - 1;

const gpsHdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(secrets.gpsMnemonic));

let idx = 0;

for(let userIdx = firstUserIdx; userIdx <= lastUserIdx; userIdx++){
    (async function(){
        const provider = new HDWalletProvider(
            secrets.mnemonic,
            secrets.infuraUrl,
            userIdx
        );
        
        const accountAddress = provider.address;
        const privKeyBuffer = provider.wallet.getPrivateKey();
        const pubKeyBuffer = provider.wallet.getPublicKey();
        const web3 = new Web3(provider);
        const smartCarInsuranceContract = new web3.eth.Contract(JSON.parse(SmartCarInsuranceContract.interface), configs.contractAddress);
        
        let nTransactions = 0;
        let currentLat = configs.minInitialLat + (configs.maxInitialLat-configs.minInitialLat)*Math.random();
        let currentLong = configs.minInitialLong + (configs.maxInitialLong-configs.minInitialLong)*Math.random();
    
        // console.log(accountAddress);
        // console.log(privKeyBuffer.toString('hex'));
        // console.log(privKeyBuffer.toString('hex').length);
        // console.log(pubKeyBuffer.toString('hex'));
        // console.log(pubKeyBuffer.toString('hex').length);

        setTimeout(() => {
            setInterval( async () => {
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

                // console.log("encryptedGpsData", encryptedGpsData);

                let data = {
                    encryptedGpsData,
                    creationUnixTimestamp: currentUnixTimestamp
                }

                let dataHash = await ethereumjs.sha3(JSON.stringify(data));
                let {v, r, s} = await ethereumjs.ecsign(new Buffer(dataHash), privKeyBuffer);

                // console.log("sig", {v, r, s});

                // const {v, r, s} = await ethereumjs.fromRpcSig(sig);
                // console.log(ethereumjs.isValidSignature(v, r, s));
                const pubKey  = ethereumjs.ecrecover(ethereumjs.toBuffer(dataHash), v, r, s);
                const addrBuf = ethereumjs.pubToAddress(pubKey);
                const addr    = ethereumjs.bufferToHex(addrBuf);
                // console.log("accountAddress", accountAddress);
                // console.log("addr", addr);

                let thisIdx = idx++;

                let reportData = {
                    thisIdx,
                    accountAddress,
                    encryptedGpsData,
                    contractAddress: configs.contractAddress,
                    startRequestUnixTimestampInMs: Math.floor(new Date()),
                }

                axios.post(`http://35.239.45.68:81/api/accounts/${accountAddress}/contracts/${configs.contractAddress}/gps-data`, {
                    data,
                    v,
                    r,
                    s,
                    from: accountAddress
                })
                .then(function (response) {
                    let latencyInMs = new Date() - reportData.startRequestUnixTimestampInMs;
                    // console.log(response);
                    console.log([
                        reportData.thisIdx,
                        reportData.startRequestUnixTimestampInMs,
                        latencyInMs,
                        response.status,
                        "",
                        reportData.accountAddress,
                        reportData.encryptedGpsData,
                        reportData.contractAddress,
                    ].join(','))
                })
                .catch(function (err) {
                    let latencyInMs = new Date() - reportData.startRequestUnixTimestampInMs;
                    console.log([
                        reportData.thisIdx,
                        reportData.startRequestUnixTimestampInMs,
                        latencyInMs,
                        "FALHOU",
                        err.message,
                        reportData.accountAddress,
                        reportData.encryptedGpsData,
                        reportData.contractAddress,
                    ].join(','))
                    // console.log(err);
                });
            }, configs.sendLocationPeriodInMiliseconds);
        }, Math.random() * configs.sendLocationPeriodInMiliseconds);
    })();
}