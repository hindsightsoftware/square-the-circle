'use strict'

const fetchBuilds = (offset, fetchBatch, fromDate) => {
  return new Promise((resolve, reject) => {
    fetchBatch(offset)
      .then(({ builds, nextLimit }) => {
        if(shouldFetchMore(builds, fromDate)) {
          fetchBuilds(nextLimit, fetchBatch, fromDate)
            .then(previousBuilds => {
              resolve(builds.concat(previousBuilds));
            })
        } else {
          resolve(builds);
        }
      });
  });
}

const shouldFetchMore = (builds, fromDate) => (
  builds.length !==0 && recentBuilds(builds, fromDate).length === builds.length
);

const recentBuilds = (builds, fromDate) => (
  builds.filter(build => !build.start_time || new Date(build.start_time) > fromDate)
);

const relevantBuilds = (builds, projectFilter) => (
  builds.filter(build => 
    new RegExp(projectFilter.reponame).test(build.reponame) &&
    new RegExp(projectFilter.branch).test(build.branch)
  )
);

const getFailedBuildsPercentage = builds => (
  failedBuilds(builds).length / (builds.length || 1) * 100
);

const getAverageBuildTime = builds => (
  totalBuildTime(builds) / (builds.length || 1)
);

const getCodeDeploymentCount = (builds, deploymentFilter) => (
  builds.filter((build) => isSuccessfulDeployment(build, deploymentFilter)).length
);

const failedBuilds = builds => (
  builds.filter(({ status }) => status === 'failed' || status === 'canceled')
);

const totalBuildTime = builds => (
  builds.reduce((totalTime, build) => totalTime += build.build_time_millis , 0)
);

const isSuccessfulDeployment = (build, deploymentFilter) => (
  deploymentFilter.jobName &&
  build.build_parameters &&
  build.build_parameters.CIRCLE_JOB &&
  new RegExp(deploymentFilter.jobName).test(build.build_parameters.CIRCLE_JOB) &&
  build.status !== 'failed' && build.status !== 'canceled'
);

const getMeanCommitToDeployTime = (builds, deploymentFilter) => (
  calcMeanCommitToDeployTime(builds.filter((build) => isSuccessfulDeployment(build, deploymentFilter)))
);

const calcMeanCommitToDeployTime = deployments => (
  deployments.reduce((totalTime, build) => totalTime += commitToDeployTime(build), 0) / deployments.length
);

const commitToDeployTime = build => (
  Date.parse(build.stop_time) - Date.parse(build.committer_date)
);

module.exports = (fetchBatch, projectFilter, deploymentFilter, fromDate) => (
  fetchBuilds(0, fetchBatch, fromDate)
  .then(builds => recentBuilds(builds, fromDate))
  .then(builds => relevantBuilds(builds, projectFilter))
  .then(builds => ({
    failedBuildsPercentage: getFailedBuildsPercentage(builds),
    codeDeploymentCount: getCodeDeploymentCount(builds, deploymentFilter),
    averageBuildTime: getAverageBuildTime(builds),
    meanCommitToDeployTime: getMeanCommitToDeployTime(builds, deploymentFilter),
    }
  ))
);
