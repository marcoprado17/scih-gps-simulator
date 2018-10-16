const Web3 = require('web3');
const secrets = require('./secrets');
const HDWalletProvider = require('truffle-hdwallet-provider');
const SmartCarInsuranceContract = require('./ethereum/build/SmartCarInsuranceContract.json');
const configs = require('./configs');
const bip39 = require("bip39");
const hdkey = require('ethereumjs-wallet/hdkey');
const crypto = require('crypto');

const provider = new HDWalletProvider(
    secrets.mnemonic,
    secrets.infuraUrl,
    0
);

const myWeb3 = new Web3(provider);
const smartCarInsuranceContract = new myWeb3.eth.Contract(JSON.parse(SmartCarInsuranceContract.interface), configs.contractAddress);

const gpsHdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(secrets.gpsMnemonic));
console.log("gpsHdwallet", gpsHdwallet);

(async function(){
    const accounts = await myWeb3.eth.getAccounts();
    const address = accounts[0];
    console.log(accounts);
    console.log(address);
    let length = await smartCarInsuranceContract.methods.getLengthOfGpsData(address).call();
    console.log(length);
    data = [];
    for(let i = 1248; i < 1261; i++) {
        console.log(i);
        let gpsData = await smartCarInsuranceContract.methods.gpsDataByUserAddress(address, i).call();
        data.push(gpsData);
    }
    console.log(data);

    data.map((gpsData) => {
        const i = gpsData.creationUnixTimestamp-946684800;
        try {
            console.log("child idx: ", i);
            const key = gpsHdwallet.deriveChild(i).getWallet().getPrivateKey();
            console.log("key: ", key);
            console.log("key.toString('hex'): ", key.toString('hex'));
            let bufferFromHexString = new Buffer(key.toString('hex'), 'hex');
            console.log("bufferFromHexString", bufferFromHexString);
            const decipher = crypto.createDecipher("aes256", key);
            let decrypted = decipher.update(gpsData.encryptedLatLong, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            console.log(decrypted);
        }
        catch(err){
            console.log(err);
        }
    })
}());
