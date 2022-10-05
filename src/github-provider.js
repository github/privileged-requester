const github = require("@actions/github");
const core = require("@actions/core");

export { GitHubProvider };

class GitHubProvider {
  constructor(token) {
    this.token = token;
    this.octokit = github.getOctokit(token);
  }

  async createReview(prNumber, reviewEvent) {
    await this.octokit.rest.pulls.createReview({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber,
      event: reviewEvent,
    });
  }

  async getConfigContent() {
    const { data: configContent } = await this.octokit.rest.repos.getContent({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      path: core.getInput("path"),
      mediaType: { format: "raw" },
    });
    return configContent;
  }

  async listPRCommits(prNumber) {
    const { data: prCommits } = await this.octokit.rest.pulls.listCommits({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber,
    });
    return prCommits;
  }

  async listLabelsOnPR(prNumber) {
    const { data: prLabels } = await this.octokit.rest.issues.listLabelsOnIssue(
      {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: prNumber,
      }
    );
    return prLabels;
  }
}
