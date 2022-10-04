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
      for (const [, commit] of Object.entries(prCommits)) {
        let commitAuthor = commit.author.login.toLowerCase();
        let commitCommitter = commit.committer.login.toLowerCase();
        // Each commit returns a "committer" and an "author". In all cases I've tested, they are the same.
        // However, since they could be different, lets check both
        if (commitAuthor !== privileged_requester_username || commitCommitter !== privileged_requester_username) {
          console.log("Unexpected commit found! I will not proceed with the privileged reviewer process.");
          return 0;
        }
      }

      // Check labels of the PR to make sure that they match the privileged_requester_config
      const { data: prLabels } = await octokit.rest.issues.listLabelsOnIssue({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: prNumber
      });

      const prLabelArray = [];

      for (const [, prLabel] of Object.entries(prLabels)) {
        let prLabelName = prLabel.name;
        prLabelArray.push(prLabelName);
      }

      let difference = prLabelArray.filter(x => !privileged_requester_config.labels.includes(x));
      if (difference.length === 0) {
        console.log("Invalid label found. I will not proceed with the privileged reviewer process.");
        return 0;
      }

      // If we've gotten this far, the commits are all from the privileged requestor and the labels are correct
      // We can now approve the PR
      console.log("Approving the PR for a privileged reviewer.")
      await octokit.rest.pulls.createReview({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: prNumber,
        event: "APPROVE"
      });
      console.log("PR approved, all set!")
    } else {
      return 0;
    }
  }
}

run();
