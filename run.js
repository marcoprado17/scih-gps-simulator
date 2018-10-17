const spawn = require('child_process').spawn;
const configs = require('./configs');

[...Array(configs.nProcess).keys()].map(processIdx => {
    let command = spawn("node", ["run_for_x_users.js", processIdx]);
    command.stdout.on('data', function (data) {
        process.stdout.write(data.toString());
    });
    
    command.stderr.on('data', function (data) {
        process.stderr.write(data.toString());
    });
    
    command.on('exit', function (code) {
        process.stdout(`child process ${processIdx} exited with code ${code.toString()}`);
    });
});
