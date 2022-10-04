const github = require('@actions/github');
const core = require('@actions/core');

async function run() {
  const myToken = core.getInput('myToken');

  const octokit = github.getOctokit(myToken)

  const { data: configContent } = await octokit.rest.repos.getContent({
    owner: core.getInput('owner'),
    repo: core.getInput('repo'),
    path: core.getInput('path'),
  });

  console.log(configContent);
}

run();
