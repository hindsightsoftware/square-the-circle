const assert = require('assert');
const getStats = require('../src/getStats');

describe('getStats', () => {
  const deploymentFilter = {'jobName': 'deploy'};
  describe('whene there is no data', () => {
    it('should return correct stats', done => {
      const builds = [];
      const fetchBatch = (offset, batchSize) => new Promise(resolve => resolve({ builds }))
      getStats(fetchBatch, deploymentFilter, new Date('2017-03-01'))
        .then(stats => assert.equal(stats.failedBuildsPercentage, 0))
        .then(done)
        .catch(done);
    })
  });
  describe('when the last element of the first batch is older than a given date', () => {
    it('should return correct stats', done => {
      const builds = [
        {
          'start_time': '2017-03-02T10:18:33.094Z',
          'status': 'success',
          'build_time_millis': 10,
          'build_parameters': { 'CIRCLE_JOB': 'deploy' },
        },
        {
          'start_time': '2017-03-02T10:18:33.094Z',
          'status': 'failed',
          'build_time_millis': 20,
        },
        {
          'start_time': '2017-02-02T10:18:33.094Z',
          'status': 'success',
          'build_time_millis': 30,
          'build_parameters': { 'CIRCLE_JOB': 'deploy' },
        },
      ];
      const fetchBatch = offset => new Promise(resolve => resolve({ builds }))
      getStats(fetchBatch, deploymentFilter, new Date('2017-03-01'))
        .then(stats => {
          assert.equal(stats.failedBuildsPercentage, 50);
          assert.equal(stats.codeDeploymentCount, 1);
          assert.equal(stats.averageBuildTime, 15);
        })
        .then(done)
        .catch(done);
    });
  });

  describe('when the last element of the first batch is younger than a given date', () => {
    describe('and the last element of the second batch is younger than a given date', () => {
      describe('and the last element of the third batch is older than given date', () => {
        it('should return correct stats', done => {
          const batchSize = 3;
          const builds = [
            {
              'start_time': '2017-03-02T10:18:33.094Z',
              'status': 'success',
              'build_time_millis': 5,
            },
            {
              'start_time': '2017-03-02T10:18:33.094Z',
              'status': 'success',
              'build_time_millis': 10,
            },
            {
              'start_time': '2017-03-02T10:18:33.094Z',
              'status': 'success',
              'build_time_millis': 15,
            },
            {
              'start_time': '2017-03-02T10:18:33.094Z',
              'status': 'success',
              'build_time_millis': 5,
            },
            {
              'start_time': '2017-03-02T10:18:33.094Z',
              'status': 'fixed',
              'build_time_millis': 10,
              'build_parameters': { 'CIRCLE_JOB': 'deploy' },
            },
            {
              'start_time': '2017-03-02T10:18:33.094Z',
              'status': 'failed',
              'build_time_millis': 15,
              'build_parameters': { 'CIRCLE_JOB': 'deploy' },
            },
            {
              'start_time': '2017-03-02T10:18:33.094Z',
              'status': 'canceled',
              'build_time_millis': 10,
              'build_parameters': { 'CIRCLE_JOB': 'deploy' },
            },
            {
              'start_time': '2017-03-02T10:18:33.094Z',
              'status': 'fixed',
              'build_time_millis': 10,
            },
            {
              'start_time': '2017-02-02T10:18:33.094Z',
              'status': 'success',
              'build_time_millis': 30,
              'build_parameters': { 'CIRCLE_JOB': 'deploy' },
            },
          ];
          const fetchBatch = offset => new Promise(resolve => resolve({ builds: builds.slice(offset, offset + batchSize), nextLimit: offset + batchSize }));
          getStats(fetchBatch, deploymentFilter, new Date('2017-03-01'))
            .then(stats => {
              assert.equal(stats.failedBuildsPercentage, 25);
              assert.equal(stats.codeDeploymentCount, 1);
              assert.equal(stats.averageBuildTime, 10);
            })
            .then(done)
            .catch(done);
        });
      })
    })
    describe('and the last element of the second batch is older than given date', () => {
      it('should return correct stats', done => {
        const batchSize = 3;
        const builds = [
          {
            'start_time': '2017-03-02T10:18:33.094Z',
            'status': 'success',
            'build_time_millis': 10,
          },
          {
            'start_time': '2017-03-02T10:18:33.094Z',
            'status': 'success',
            'build_time_millis': 20,
          },
          {
            'start_time': '2017-03-02T10:18:33.094Z',
            'status': 'success',
            'build_time_millis': 30,
          },
          {
            'start_time': '2017-03-02T10:18:33.094Z',
            'status': 'success',
            'build_time_millis': 10,
          },
          {
            'start_time': '2017-03-02T10:18:33.094Z',
            'status': 'success',
            'build_time_millis': 20,
          },
          {
            'start_time': '2017-03-02T10:18:33.094Z',
            'status': 'success',
            'build_time_millis': 30,
          },
          {
            'start_time': '2017-02-02T10:18:33.094Z',
            'status': 'failed',
            'build_time_millis': 40,
            'build_parameters': { 'CIRCLE_JOB': 'deploy' },
          },
        ];
        const fetchBatch = offset => new Promise(resolve => resolve({ builds: builds.slice(offset, offset + batchSize), nextLimit: offset + batchSize }));
        getStats(fetchBatch, deploymentFilter, new Date('2017-03-01'))
          .then(stats => {
            assert.equal(stats.failedBuildsPercentage, 0);
            assert.equal(stats.codeDeploymentCount, 0);
            assert.equal(stats.averageBuildTime, 20);
          })
          .then(done)
          .catch(done);
      });
    });
    describe('and there is no more data', () => {
      it('should return correct stats', done => {
        const batchSize = 3;
        const builds = [
          {
            'start_time': '2017-03-02T10:18:33.094Z',
            'status': 'failed',
            'build_time_millis': 10,
            'build_parameters': { 'CIRCLE_JOB': 'deploy' },
          },
          {
            'start_time': '2017-03-02T10:18:33.094Z',
            'status': 'failed',
            'build_time_millis': 20,
            'build_parameters': { 'CIRCLE_JOB': 'deploy' },
          },
          {
            'start_time': '2017-02-02T10:18:33.094Z',
            'status': 'failed',
            'build_time_millis': 30,
            'build_parameters': { 'CIRCLE_JOB': 'deploy' },
          },
        ];
        const fetchBatch = offset => new Promise(resolve => resolve({ builds: builds.slice(offset, batchSize), nextLimit: batchSize }));
        getStats(fetchBatch, deploymentFilter, new Date('2017-03-01'))
          .then(stats => {
            assert.equal(stats.failedBuildsPercentage, 100);
            assert.equal(stats.codeDeploymentCount, 0);
            assert.equal(stats.averageBuildTime, 15);
          })
          .then(done)
          .catch(done);
      });
    });
  });
  describe('and there is data for different CircleCI jobs', () => {
    describe('and a deploy job is defined', () => {
      it('should return correct stats', done => {
        const batchSize = 4;
        const builds = [
          {
            'committer_date': '2017-03-02T10:18:30.000Z',
            'start_time': '2017-03-02T10:18:33.094Z',
            'status': 'success',
            'stop_date': '2017-03-02T10:18:33.010Z',
            'build_time_millis': 10,
            'build_parameters': { 'CIRCLE_JOB': 'deploy' },
          },
          {
            'start_time': '2017-03-02T10:18:33.094Z',
            'status': 'success',
            'build_time_millis': 20,
            'build_parameters': { 'CIRCLE_JOB': 'unit' },
          },
          {
            'committer_date': '2017-02-02T10:18:30.000Z',
            'start_time': '2017-02-02T10:18:33.094Z',
            'status': 'success',
            'stop_date': '2017-02-02T10:18:33.010Z',
            'build_time_millis': 30,
            'build_parameters': { 'CIRCLE_JOB': 'deploy' },
          },
          {
            'start_time': '2017-02-02T10:18:33.094Z',
            'status': 'success',
            'build_time_millis': 30,
            'build_parameters': { 'CIRCLE_JOB': 'unit' },
          }
        ];
        const fetchBatch = offset => new Promise(resolve => resolve({ builds: builds.slice(offset, batchSize), nextLimit: batchSize }));
        getStats(fetchBatch, deploymentFilter, new Date('2017-02-01'))
          .then(stats => {
            assert.equal(stats.failedBuildsPercentage, 0);
            assert.equal(stats.codeDeploymentCount, 2);
            assert.equal(stats.averageBuildTime, 22.5);
            assert.equal(stats.meanCommitToDeployTime, 3010);
          })
          .then(done)
          .catch(done);
      });
    });    
  });
});
