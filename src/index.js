'use strict'

const request = require('request');
const config = require('./config');
const getStats = require('./getStats');

const circleCIFetchBatch = (offset) => {
  const endpoint = `https://circleci.com/api/v1.1/project/github/${config.organisationName}/${config.projectName}`;
  const batchSize = 30;
  const options = {
    method: 'GET',
    uri: endpoint,
    json: true,
    qs: {
      'circle-token': config.circleCItoken,
      limit: batchSize,
      offset: offset,
    }
  }
  return new Promise(resolve => {
    request(options, (err, response, builds) => {
      resolve({ builds, nextLimit: offset + batchSize });
    });
  })
}

const formatTime = millis => {
  const d = new Date(millis);
  return `${d.getUTCMinutes()}:${('0' + d.getUTCSeconds()).slice(-2)}`
}

const sendToSlack = weekAgo => stats => {
  const report = `
*CircleCI builds scorecard*
*from* _${weekAgo.toLocaleDateString()}_ *to* _${new Date().toLocaleDateString()}_
*Failed builds*: ${stats.failedBuildsPercentage.toFixed(2)}%
*Code deployments*: ${stats.codeDeploymentCount}
*Average build time*: ${formatTime(stats.averageBuildTime)}
*Mean commit to deploy time*: ${formatTime(stats.meanCommitToDeployTime)}
`
  const options = {
    method: 'POST',
    uri: config.slackEndpoint,
    json: {
      'text': report
    }
  }
  request(options);
}

const deploymentFilter = {'jobName': 'deploy'};

module.exports.handler = (event, context) => {
  const fromDate = new Date(new Date().setDate(new Date().getDate() - config.timeSpan));
  getStats(circleCIFetchBatch, deploymentFilter, fromDate)
    .then(sendToSlack(fromDate));
}
