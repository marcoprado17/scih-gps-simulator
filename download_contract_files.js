const request = require("sync-request");
const fs = require('fs');
const path = require('path');

const reqOpts = {
    retry: true,
    retryDelay: 1000,
    maxRetries: 5
};

let res = request("GET", "https://raw.githubusercontent.com/marcoprado17/scife-contracts/master/ethereum/build/SmartCarInsuranceContract.json", reqOpts);
fs.writeFileSync(path.resolve(__dirname, 'ethereum', 'build', 'SmartCarInsuranceContract.json'), JSON.stringify(JSON.parse(res.body), null, 2), 'utf-8');
