#!/usr/bin/env node
var dateFormat = require('dateformat')
  , argv = require('optimist').boolean(['billable', 'b'])
                              .default('date', dateFormat(new Date(), 'yyyy-mm-dd'))
                              .default('hours', 8)
                              .default('description', '')
                              .argv
  , futures = require('futures')
  , config = require('../config')
  , intervals = require('../intervals')
  , utils = require('../utils')
;

/**
 * Add time for each dates specified
 */
function addTime(options, client) {
    return function(next, project) {
        var dates = options.dates;
        delete options.dates;
        var join = futures.join();
        join.add(dates.map(function(date) {
            var promise = futures.future();
            var opts = {};
            // we must clone to prevent options.date override
            for (var i in options) opts[i] = options[i];
            opts.date = date;
            console.log('Add '+ opts.time + ' ' +
                        (opts.billable ? 'billable' : 'non billable') +
                        ' hours for '+ opts.date);
            intervals.addTime(project, opts, client, function (err, res) {
                if (err) throw err;
                if (res.status != 201) throw res.body;
                console.log('Success! Time added.');
                promise.deliver();
            });
            return promise;
        }));
        join.when(function() {
            next(project);
        })
    };
}

function askForToken(callback) {
    config.read(function(err, value) {
        if (err) {
            if (err.code == 'ENOENT') {
                process.stdout.write('Please enter your token (go to https://xx.timetask.com/account/api/ and generate a new one): ');
                utils.readInput(function(input) {
                    config.write({token: input}, function(err) {
                        if (err) throw err;
                        console.log('token saved in '+ config.path);
                        callback({token: input});
                    });
                });
            } else {
                throw err;
            }
        } else {
            callback(value);
        }
    });
}

/**
 * Ask user to save the project
 */
function askForSave(conf) {
    return function(next, project) {
        process.stdout.write('Do you yant to save this project combinaison: (y/N)');
        utils.readInput(function(input) {
            if (input == 'y') {
                process.stdout.write('Name of this combinaison: ');
                utils.readInput(function(input) {
                    conf.projects ? '': conf.projects = [];
                    project.name = input;
                    conf.projects.push(project);
                    config.write(conf, function(err) {
                        if (err) throw err;
                        console.log('ok. You can add time to this combinaison with intervals --project '+ input);
                        next();
                    })
                });
            } else {
                next();
            }
        });
    }
}

/**
 * Extract options from argv
 */
function optionsFrom(argv) {
    var date     = argv.date,
        dates    = (Array.isArray(date)) ? date : [date],
        options  = { time: argv.hours,
                     dates: dates,
                     billable: argv.billable || argv.b,
                     description: argv.description };
    return options;
}

function loadProject(conf, argv) {
    return function(next) {
        for (var i in conf.projects) {
            if (conf.projects[i].name == argv.project) {
                var project = conf.projects[i];
                delete project.name;
                next(project);
            }
        }
    }
}

if (argv._.length > 1) {
    return require('../help')();
}
if (argv._.length == 0) {
    argv._.push('add-time');
}
var cmd = argv._[0];

if (argv.version || cmd == 'version' || argv.v) {
    return require('../version')();
} else if (argv.help || cmd == 'help') {
    return require('../help')();
} else if (cmd == 'list-projects') {
    askForToken(function(conf) {
        if (Array.isArray(conf.projects) && conf.projects.length) {
            conf.projects.forEach(function(project) {
                console.log(project.name, ":");
                console.log(config.toYaml(project.human, '  '));
            });
        } else {
            console.log('no projects found. Register a new one with intervals add-time');
        }
    });
} else if (cmd == 'add-time') {
    askForToken(function(conf) {
        var options  = optionsFrom(argv),
            sequence = null;

        console.log('Add '+ options.time + ' ' +
                    (options.billable ? 'billable' : 'non billable') +
                    ' hours for '+ options.dates.join(' and '));
        var client = intervals.createClient(conf.token);
        var sequence = futures.sequence();
        if (argv.project) {
            sequence.then(loadProject(conf, argv))
                    .then(addTime(options, client));
        } else {
            sequence.then(intervals.askForProject(client))
                    .then(addTime(options, client))
                    .then(askForSave(conf));
        }
    });
} else if (cmd == 'ls') {
    askForToken(function(conf) {
        require('../list')(conf, argv);
    });
} else {
    return require('../help')();
}
