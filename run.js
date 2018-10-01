const spawn = require('child_process').spawn;
const configs = require('./configs');

[...Array(configs.nUsers).keys()].map(user_idx => {
    let command = spawn("node", ["run_for_user.js", user_idx]);
    command.stdout.on('data', function (data) {
        process.stdout.write(data.toString());
    });
    
    command.stderr.on('data', function (data) {
        console.log("*** STDERR ***");
        process.stdout.write(data.toString());
    });
    
    command.on('exit', function (code) {
        console.log('child process exited with code ' + code.toString());
    });
});
