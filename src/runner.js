import * as core from "@actions/core";

export { Runner };

class Runner {
  constructor(pullRequest, privilegedRequesters) {
    this.pullRequest = pullRequest;
    this.privilegedRequesters = privilegedRequesters;
  }

  async processCommits(privileged_requester_username) {
    // Check all commits of the PR to verify that they are all from the privileged requester, otherwise return from the check
    for (const [, commit] of Object.entries(this.pullRequest.listCommits())) {
      let commitAuthor = commit.author.login.toLowerCase();

      if (commitAuthor !== privileged_requester_username) {
        core.warning(
          `Unexpected commit author found by ${commitAuthor}! Commits should be authored by ${privileged_requester_username} I will not proceed with the privileged reviewer process.`
        );
        return false;
      }
    }
    return true;
  }

  labelsEqual(prLabels, configuredLabels) {
    return (
      Array.isArray(prLabels) &&
      Array.isArray(configuredLabels) &&
      prLabels.length === configuredLabels.length &&
      prLabels.every((val, index) => val === configuredLabels[index])
    );
  }

  async processLabels(privileged_requester_config) {
    // Check labels of the PR to make sure that they match the privileged_requester_config, otherwise return from the check
    const prLabels = await this.pullRequest.listLabels();
    const prLabelArray = [];

    for (const [, prLabel] of Object.entries(prLabels)) {
      let prLabelName = prLabel.name;
      prLabelArray.push(prLabelName);
    }

    core.info(
      `Comparing the PR Labels: ${prLabelArray} with the privileged requester labels: ${privileged_requester_config.labels}`
    );
    if (
      this.labelsEqual(prLabelArray, privileged_requester_config.labels) ===
      false
    ) {
      core.warning(
        `Invalid label(s) found. I will not proceed with the privileged reviewer process.`
      );
      return false;
    }
    return true;
  }

  async run() {
    const requesters = await this.privilegedRequesters.getRequesters();
    if (requesters === false) {
      return;
    }
    for (const [
      privileged_requester_username,
      privileged_requester_config,
    ] of Object.entries(requesters)) {
      // console.log(privileged_requester_username);
      // If privileged_requester_username is not the creator of the PR, move on
      // If privileged_requester_username is the creator of the PR, check the remaining config
      core.info(
        `PR creator is ${this.pullRequest.prCreator}. Testing against ${privileged_requester_username}`
      );
      if (this.pullRequest.prCreator !== privileged_requester_username) {
        continue;
      }
      await this.processPrivilegedReviewer(
        privileged_requester_username,
        privileged_requester_config
      );
    }
  }

  async processPrivilegedReviewer(
    privileged_requester_username,
    privileged_requester_config
  ) {
    core.info(
      `Privileged requester ${privileged_requester_username} found. Checking PR criteria against the privileged requester configuration.`
    );

    let commits = await this.processCommits(privileged_requester_username);
    if (commits === false) {
      return false;
    }

    let labels = await this.processLabels(privileged_requester_config);
    if (labels === false) {
      return false;
    }

    // If we've gotten this far, the commits are all from the privileged requestor and the labels are correct
    // We can now approve the PR
    await this.pullRequest.approve();
    return true;
  }
}
