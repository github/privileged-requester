const github = require('@actions/github');
const core = require('@actions/core');
const yaml = require('js-yaml');

async function run() {
  const myToken = core.getInput('myToken');
  const octokit = github.getOctokit(myToken);

  const { data: configContent } = await octokit.rest.repos.getContent({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path: core.getInput('path'),
    mediaType: { format: "raw" }
  });

  const prCreator = core.getInput('prCreator').toLowerCase();
  const prNumber = core.getInput('prNumber');
  const contents = yaml.load(configContent);
  const requesters = contents["requesters"];

  for (const [privileged_requester_username, privileged_requester_config] of Object.entries(requesters)) {
    // console.log(privileged_requester_username);
    // If privileged_requester_username is not the creator of the PR, move on
    // If privileged_requester_username is the creator of the PR, check the remaining config
    if (prCreator === privileged_requester_username) {
      console.log("Privileged requester found. Checking PR criteria against the privileged requester configuration.");
      // Check all commits of the PR to verify that they are all from the privileged requester, otherwise Fail? or at least, return
      const { data: prCommits } = await octokit.rest.pulls.listCommits({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: prNumber
      });
      prCommits.forEach(function (commit) {
        let commitAuthor = commit.author.login.toLowerCase();
        let commitCommitter = commit.committer.login.toLowerCase();
        // Each commit returns a "committer" and an "author". In all cases I've tested, they are the same.
        // However, since they could be different, lets check both
        if (commitAuthor !== privileged_requester_username || commitCommitter !== privileged_requester_username) {
          console.log("Unexpected commit found! Exiting.");
          return 0;
        }
      });
      // Check labels of the PR to make sure that they match the privileged_requester_config
      const { data: prLabels } = await octokit.rest.issues.listLabelsOnIssue({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: prNumber
      });
      prLabels.forEach(function (prLabel) {
        let prLabelName = prLabel.name;
        if (privileged_requester_config.labels.includes(prLabelName)) {
          console.log("Valid label found.");
        } else {
          console.log("Invalid label found.");
          return 0;
        }
      });
    } else {
      return;
    }
  }
}

run();
