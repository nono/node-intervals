var spore = require('spore')
  , futures = require('futures')
;

/**
 * Set Accept header
 */
function accept(accept) {
    return function(method, request, next) {
        request.headers['Accept'] = accept;
        next();
    }
}
/**
 * Set Content-type header
 */
function contentType(contentType) {
    return function(method, request, next) {
        request.headers['Content-type'] = contentType;
        next();
    };
}

var sporeDesc = exports.description = require('./description');

/**
 * Read stdin
 */
var readInput = exports.readInput = function(callback) {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', function (chunk) {
        process.stdin.pause(); // pause stdin after input
        process.stdin.removeAllListeners('data');
        process.stdin.removeAllListeners('end');
        callback(chunk.trim());
    });
    process.stdin.on('end', function () {});
}
/**
 * Create Spore client
 */
var createClient = exports.createClient = function(token) {
    var client = spore.createClient(sporeDesc);
    client.enable(spore.middlewares.basic(token, 'X'));
    client.enable(spore.middlewares.json());
    client.enable(accept('application/json'));
    client.enable(contentType('application/json'));
    return client;
}

function formatList(array, propertyName) {
    for (var i = 0; i < array.length; i++) {
        console.log(' '+ i + '. '+ array[i][propertyName]);
    }
}

function chooseIn(list, propertyName, callback) {
    formatList(list, propertyName);
    process.stdout.write('enter your choice: ');
    readInput(function(v) {
        var index = parseInt(v, 10);
        if (list.length > index) callback(index);
        else chooseIn(list, propertyName, callback);
    });
}

/**
 * Ask user in interactive mode
 * client: spore client
 * Return the futures.sequence
 */
exports.askForProject = function(client) {
    var project = {
        personid: null,
        projectid: null,
        moduleid: null,
        worktypeid: null
    };
    var sequence = futures.sequence();
    sequence.then(function(next) {
        client.me(function(err, res) {
            if (err) throw err;
            project.personid = res.body.personid;
            next();
        });
    }).then(function(next) {
        client.client({active: 't',
                       // projectsonly parameter seems buggy,
                       // but hopefully doesn't throw 500 error in API
                       limit: 40,
                       projectsonly: 't'},
                      function(err, res) {
                          console.log('Choose client:');
                          if (err) throw err;
                          chooseIn(res.body.client, 'name', function(index) {
                              var clientId = res.body.client[index].id;
                              next(clientId);
                          });
                      });
    }).then(function(next, clientId) {
        client.project({active: 't',
                        clientid: clientId},
                       function(err, res) {
                           console.log('Choose a project:');
                           if (err) throw err;
                           chooseIn(res.body.project, 'name', function(index) {
                               project.projectid = res.body.project[index].id;
                               next();
                           });
                       });
    }).then(function(next) {
        client.project_module({projectid: project.projectid}, function(err, res) {
            console.log('Choose a module:');
            if (err) throw err;
            chooseIn(res.body.projectmodule, 'modulename', function(index) {
                project.moduleid = res.body.projectmodule[index].moduleid;
                next();
            });
        });
    }).then(function(next) {
        client.project_worktype({projectid: project.projectid}, function(err, res) {
            console.log('Choose a worktype:');
            if (err) throw err;
            chooseIn(res.body.projectworktype, 'worktype', function(index) {
                project.worktypeid = res.body.projectworktype[index].worktypeid;
                next(project);
            });
        });
    });
    return sequence;
};
/**
 * Add time
 * project:
 *  - personid
 *  - projectid
 *  - moduleid
 *  - worktypeid
 * options with keys:
 *  - time
 *  - date
 *  - billable
 *  - description
 * client: spore client
 * callback
 */
exports.addTime = function(project, options, client, callback) {
    var time = {
        time: options.time,
        date: options.date,
        billable : options.billable ? 't': 'f',
        description: options.description,
        personid: project.personid,
        projectid: project.projectid,
        moduleid: project.moduleid,
        worktypeid: project.worktypeid
    };
    client.add_time(JSON.stringify(time), function(err, res) {
        callback(err, res);
    });
}
