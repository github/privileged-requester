import * as core from "@actions/core";

export { PullRequest };

class PullRequest {
  constructor(provider) {
    const core = require("@actions/core");
    this.github = provider;
    this.prCreator = core.getInput("prCreator").toLowerCase();
    this.prNumber = core.getInput("prNumber");
    this.diff = false;
    this.prCommits = false;
    this.prLabels = false;
  }

  async approve() {
    try {
      // before we approved the PR, check to see if this workflow has already approved the PR in a previous run
      if (await this.github.hasAlreadyApproved(this.prNumber)) {
        core.info(
          "PR has already been approved by this Action, skipping duplicate approval.",
        );
        core.setOutput("approved", "true"); // set to true as we have already approved the PR at some point
        return;
      }

      core.info("Approving the PR for a privileged reviewer.");
      await this.github.createReview(this.prNumber, "APPROVE");
      core.info("PR approved, all set!");
      core.setOutput("approved", "true");
    } catch (err) {
      core.error("PR not approved.");
      core.setFailed(err.message);
    }
  }

  async getDiff() {
    if (this.diff === false) {
      this.diff = await this.github.getPRDiff(this.prNumber);
    }
    return this.diff;
  }

  async listCommits() {
    if (this.prCommits === false) {
      this.prCommits = await this.github.listPRCommits(this.prNumber);
    }
    return this.prCommits;
  }

  async listLabels() {
    if (this.prLabels === false) {
      this.prLabels = await this.github.listLabelsOnPR(this.prNumber);
    }
    return this.prLabels;
  }
}
