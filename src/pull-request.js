export { PullRequest };

class PullRequest {
  constructor(provider) {
    const core = require("@actions/core");
    this.github = provider;
    this.prCreator = core.getInput("prCreator").toLowerCase();
    this.prNumber = core.getInput("prNumber");
    this.prCommits = false;
    this.prLabels = false;
  }

  async approve() {
    try {
      console.log("Approving the PR for a privileged reviewer.");
      await this.github.createReview(this.prNumber, "APPROVE");
      console.log("PR approved, all set!");
    } catch (err) {
      console.log(err.message);
      console.log("PR not approved.");
    }
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
