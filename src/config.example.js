const config = {};

config.circleCItoken = '';
config.slackEndpoint = '';
config.timeSpan = 7;

config.projects = {};
config.projects.reponame = '.*';
config.projects.branch = 'master';

config.deploymentJobName = 'deploy';

module.exports = config;
