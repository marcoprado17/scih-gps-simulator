require('babel-register')({
    presets: [ 'env' ]
});

const configs = require('./configs');
const web3 = require('./ethereum/web3').default;
const smartCarInsuranceContract = require('./ethereum/smart_car_insurance_contract').default;

let nTransactionByUser = {};

[...Array(configs.nUsers).keys()].map((idx) => {
    setTimeout(() => {
        setInterval(async () => {
            nTransactionByUser[idx] = (nTransactionByUser[idx] || 0) + 1;
            const accounts = await web3.eth.getAccounts();
            console.log(`Sending transaction ${nTransactionByUser[idx]} for user ${idx}`);
            smartCarInsuranceContract.methods.addGpsLocation("1", Math.random().toString()).send(
                {
                    gas: '1000000', 
                    from: accounts[0]
                }
            )
                .then((transactionData) => {
                    console.log("-----------------------------------------------------------------------");
                    console.log(`Transaction ${nTransactionByUser[idx]} of user ${idx} finished successfuly:`);
                    console.log(transactionData);
                })
                .catch((err) => {
                    console.log("-----------------------------------------------------------------------");
                    console.log(`Transaction ${nTransactionByUser[idx]} of user ${idx} finished with ERROR:`);
                    console.log(err);
                });
        }, configs.sendLocationPeriodInMiliseconds);
    }, Math.random() * configs.sendLocationPeriodInMiliseconds)
});
