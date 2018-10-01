import web3 from './web3';
import SmartCarInsuranceContract from './build/SmartCarInsuranceContract.json';

const configs = require('../configs');

let smartCarInsuranceContract = new web3.eth.Contract(JSON.parse(SmartCarInsuranceContract.interface), configs.contractAddress);

export default smartCarInsuranceContract;
