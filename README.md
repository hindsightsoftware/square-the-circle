# Square the circle

Regurlay report key Lean Software and DevOps metrics from CircleCI 2.0 to Slack.

In the book 'Accelerate: The Science of Lean Software and DevOps' key metrics were idenified for high performing companies and teams.
This serverless AWS lambda caclautes some of these key metrics from the data in CircleCI and publishes them to a specified Slack 
channel so they can be tracked.

At the moment we derive from theCircleCI API the following stats:
* Percentage of failed builds
* Number of code deployments
* Average Build time
* Commit to deploy lead time

## Forked from Red Badger

This is a fork from Red Badgers 'Square the circle' and kudos should go to them for the orignal lambda and idea. This fork was created because we want to 
track the key metrics for software development teams working with microservices using CircleCI

### Changes

* Support for CircleCI 2.0 Workflows and Jobs
* Introduced the `Commit to deploy lead time` metric
* Enabled a group group of repositoes and builds to be tracked - esential if you are developing microservies


## Configuration

Make sure your AWS credentials are properly configured on your machine. For more information head to [this page](https://serverless.com/framework/docs/providers/aws/guide/credentials/).

Copy `src/config.example.js` to `src/config.js`
```
cp src/config.example.js src/config.js
```

Edit `src/config.js` and set your config variables
```javascript
config.circleCItoken = '123abc';
config.slackEndpoint = 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX';
config.timeSpan = 7; // Report time span. 7 means weekly

config.projects = {};
config.projects.reponame = 'behave-pro-*'; // regular expression to match the git reposiotres you are interested in.
config.projects.branch = 'master'; // The main project of the project to avoid branches distuacting the metrics

config.deploymentJobName = 'deploy_*'; // regular expression to idenitfy jobs within the CircleCI that perform deployments
```

CircleCI token can be obtained [here](https://circleci.com/account/api).
For Slack webook endpoint head to [this page](https://api.slack.com/incoming-webhooks)

By default the report is scheduled every week on Monday at 9:00 am. If you want to change it you should head to `serverless.yml` file. The schedule is configured in [AWS cron format](http://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html#CronExpressions).

```
functions:
  stats:
    handler: dist/index.handler
    events:
      - schedule: cron(0 9 ? * 2 *)
```

### Number of code deployments

CircleCI 2.0 introduced workflows and jobs. To distinguish deployments from the usual builds you specificy a regular expressions in the `config.deploymentJobName` configuration property to identify the deployment jobs.

```
config.deploymentJobName = 'deploy_*';
```

## Setup

Run:
```
npm install
npm run deploy
```

The expected result should be similar to:
```
src/config.js -> dist/config.js
src/getStats.js -> dist/getStats.js
src/index.js -> dist/index.js
Serverless: Packaging service...
Serverless: Uploading CloudFormation file to S3...
Serverless: Uploading service .zip file to S3 (14.24 MB)...
Serverless: Updating Stack...
Serverless: Checking Stack update progress...
.........
Serverless: Stack update finished...
Serverless: Removing old service versions...
Service Information
service: square-the-circle
stage: dev
region: us-east-1
api keys:
  None
endpoints:
  None
functions:
  stats: square-the-circle-dev-stats

```

After that your new scheduled lambda is ready.
