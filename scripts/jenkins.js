/*jslint plusplus: true */
/*jslint unparam: true, node: true */
'use strict';

var jenkinsBuild, jenkinsBuildById, jenkinsDescribe, jenkinsLast, jenkinsList, jobList, querystring;

querystring = require('querystring');

jobList = [];

jenkinsBuildById = function (msg) {
    var job;
    job = jobList[parseInt(msg.match[1], 10) - 1];
    if (job) {
        msg.match[1] = job;
        return jenkinsBuild(msg);
    }

    return msg.reply("I couldn't find that job. Try `jenkins list` to get a list.");
};

jenkinsBuild = function (msg, buildWithEmptyParameters) {
    var auth, command, job, params, path, req, url;
    url = process.env.HUBOT_JENKINS_URL;
    job = querystring.escape(msg.match[1]);
    params = msg.match[3];
    command = buildWithEmptyParameters ? "buildWithParameters" : "build";
    path = params ? url + "/job/" + job + "/buildWithParameters?" + params : url + "/job/" + job + "/" + command;
    req = msg.http(path);

    if (process.env.HUBOT_JENKINS_AUTH) {
        auth = new Buffer(process.env.HUBOT_JENKINS_AUTH).toString('base64');
        req.headers({
            Authorization: "Basic " + auth
        });
    }
    req.header('Content-Length', 0);

    return req.post(function (err, res, body) {
        if (err) {
            return msg.reply("Jenkins says: " + err);
        }
        if (200 <= res.statusCode && res.statusCode < 400) {
            return msg.reply("(" + res.statusCode + ") Build started for " + job + " " + url + "/job/" + job);
        }
        if (400 === res.statusCode) {
            return jenkinsBuild(msg, true);
        }
        return msg.reply("Jenkins says: Status " + res.statusCode + " " + body);
    });
};

jenkinsDescribe = function (msg) {
    var auth, job, path, req, url;
    url = process.env.HUBOT_JENKINS_URL;
    job = msg.match[1];
    path = url + "/job/" + job + "/api/json";
    req = msg.http(path);
    if (process.env.HUBOT_JENKINS_AUTH) {
        auth = new Buffer(process.env.HUBOT_JENKINS_AUTH).toString('base64');
        req.headers({
            Authorization: "Basic " + auth
        });
    }
    req.header('Content-Length', 0);

    return req.get(function (err, res, body) {
        var content, error, i, item, j, k, len, len1, len2, param, parameters, ref, ref1, ref2, report, response, tmpDefault, tmpDescription, tmpReport;
        if (err) {
            return msg.send("Jenkins says: " + err);
        }
        response = "";
        try {
            content = JSON.parse(body);
            response += "JOB: " + content.displayName + "\n";
            response += "URL: " + content.url + "\n";
            if (content.description) {
                response += "DESCRIPTION: " + content.description + "\n";
            }
            response += "ENABLED: " + content.buildable + "\n";
            response += "STATUS: " + content.color + "\n";
            tmpReport = "";

            if (content.healthReport.length > 0) {
                ref = content.healthReport;
                for (i = 0, len = ref.length; i < len; i++) {
                    report = ref[i];
                    tmpReport += "\n  " + report.description;
                }
            } else {
                tmpReport = " unknown";
            }

            response += "HEALTH: " + tmpReport + "\n";
            parameters = "";
            ref1 = content.actions;
            for (j = 0, len1 = ref1.length; j < len1; j++) {
                item = ref1[j];
                if (item.parameterDefinitions) {
                    ref2 = item.parameterDefinitions;
                    for (k = 0, len2 = ref2.length; k < len2; k++) {
                        param = ref2[k];
                        tmpDescription = param.description ? " - " + param.description + " " : "";
                        tmpDefault = param.defaultParameterValue ? " (default=" + param.defaultParameterValue.value + ")" : "";
                        parameters += "\n  " + param.name + tmpDescription + tmpDefault;
                    }
                }
            }
            if (parameters !== "") {
                response += "PARAMETERS: " + parameters + "\n";
            }
            msg.send(response);
            if (!content.lastBuild) {
                return;
            }
            path = url + "/job/" + job + "/" + content.lastBuild.number + "/api/json";
            req = msg.http(path);
            if (process.env.HUBOT_JENKINS_AUTH) {
                auth = new Buffer(process.env.HUBOT_JENKINS_AUTH).toString('base64');
                req.headers({
                    Authorization: "Basic " + auth
                });
            }
            req.header('Content-Length', 0);
            return req.get(function (err, res, body) {
                var jobdate, jobstatus;
                if (err) {
                    return msg.send("Jenkins says: " + err);
                }
                response = "";
                try {
                    content = JSON.parse(body);
                    console.log(JSON.stringify(content, null, 4));
                    jobstatus = content.result || 'PENDING';
                    jobdate = new Date(content.timestamp);
                    response += "LAST JOB: " + jobstatus + ", " + jobdate + "\n";
                    return msg.send(response);

                } catch (e) {
                    error = e;
                    return msg.send(error);
                }
            });
        } catch (e) {
            error = e;
            return msg.send(error);
        }
    });
};

jenkinsLast = function (msg) {
    var auth, job, path, req, url;
    url = process.env.HUBOT_JENKINS_URL;
    job = msg.match[1];
    path = url + "/job/" + job + "/lastBuild/api/json";
    req = msg.http(path);
    if (process.env.HUBOT_JENKINS_AUTH) {
        auth = new Buffer(process.env.HUBOT_JENKINS_AUTH).toString('base64');
        req.headers({
            Authorization: "Basic " + auth
        });
    }
    req.header('Content-Length', 0);
    return req.get(function (err, res, body) {
        var content, response;
        if (err) {
            return msg.send("Jenkins says: " + err);
        }

        response = "";
        try {
            content = JSON.parse(body);
            response += "NAME: " + content.fullDisplayName + "\n";
            response += "URL: " + content.url + "\n";
            if (content.description) {
                response += "DESCRIPTION: " + content.description + "\n";
            }
            response += "BUILDING: " + content.building + "\n";
            return msg.send(response);
        } catch (ignore) {}
    });
};

jenkinsList = function (msg) {
    var auth, filter, req, url;
    url = process.env.HUBOT_JENKINS_URL;
    filter = new RegExp(msg.match[2], 'i');
    req = msg.http(url + "/api/json");
    if (process.env.HUBOT_JENKINS_AUTH) {
        auth = new Buffer(process.env.HUBOT_JENKINS_AUTH).toString('base64');
        req.headers({
            Authorization: "Basic " + auth
        });
    }
    return req.get(function (err, res, body) {
        var content, error, i, index, job, len, ref, response, state;

        response = "";
        if (err) {
            return msg.send("Jenkins says: " + err);
        }
        try {
            content = JSON.parse(body);
            ref = content.jobs;
            for (i = 0, len = ref.length; i < len; i++) {
                job = ref[i];
                index = jobList.indexOf(job.name);
                if (index === -1) {
                    jobList.push(job.name);
                    index = jobList.indexOf(job.name);
                }
                state = job.color === "red" ? "FAIL" : "PASS";
                if (filter.test(job.name)) {
                    response += "[" + (index + 1) + "] " + state + " " + job.name + "\n";
                }
            }
            return msg.send(response);
        } catch (e) {
            error = e;
            return msg.send(error);
        }
    });
};

module.exports = function (robot) {
    robot.respond(/build ([\w\.\-_ ]+)(, (.+))?/i, function(msg) {
        return jenkinsBuild(msg, false);
    });
    robot.respond(/j(?:enkins)? b (\d+)/i, function (msg) {
        return jenkinsBuildById(msg);
    });
    robot.respond(/j(?:enkins)? list( (.+))?/i, function (msg) {
        return jenkinsList(msg);
    });
    robot.respond(/j(?:enkins)? describe (.*)/i, function (msg) {
        return jenkinsDescribe(msg);
    });
    robot.respond(/j(?:enkins)? last (.*)/i, function (msg) {
        return jenkinsLast(msg);
    });

    robot.jenkins = {
        list: jenkinsList,
        build: jenkinsBuild,
        describe: jenkinsDescribe,
        last: jenkinsLast
    };

    return robot.jenkins;
};