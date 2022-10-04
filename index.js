const github = require('@actions/github');
const core = require('@actions/core');
const yaml = require('js-yaml');

async function run() {
  const myToken = core.getInput('myToken');
  const octokit = github.getOctokit(myToken)

  const { data: configContent } = await octokit.rest.repos.getContent({
    owner: core.getInput('owner'),
    repo: core.getInput('repo'),
    path: core.getInput('path'),
    mediaType: { format: "raw" }
  });

  const prCreator = core.getInput('prCreator').toLowerCase();
  const contents = yaml.load(configContent);
  const requesters = contents["requesters"];

  for (const [privileged_requester_username, privileged_requester_config] of Object.entries(requesters)) {
    // console.log(privileged_requester_username);
    // If privileged_requester_username is not the creator of the PR, move on
    // If privileged_requester_username is the creator of the PR, check the remaining config
    if (prCreator === privileged_requester_username) {
      console.log("Privileged requester found. Checking PR criteria against the privileged requester configuration.");
      // Check all commits of the PR to verify that they are all from the privileged requester, otherwise Fail? or at least, return
      // Check labels of the PR to make sure that they match the privileged_requester_config
    } else {
      console.log("Not privileged requester!");
    }
  }
}

run();
