const github = require("@actions/github");
const core = require("@actions/core");

export { GitHubProvider };

class GitHubProvider {
  constructor(token) {
    this.token = token;
    this.octokit = github.getOctokit(token);
    this.configContent = false;
  }

  async createReview(prNumber, reviewEvent) {
    core.debug(`prNumber: ${prNumber}`)
    core.debug(`reviewEvent: ${reviewEvent}`)

    await this.octokit.rest.pulls.createReview({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber,
      event: reviewEvent,
    });
  }

  async getConfigContent() {
    const path = core.getInput("path", { required: true })
    core.info(`config path: ${path}`)

    // getContent defaults to the main branch
    const { data: configContent } = await this.octokit.rest.repos.getContent({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      path: path,
      mediaType: { format: "raw" },
    });
    return configContent;
  }

  async getPRDiff(prNumber) {
    const { data: prDiff } = await this.octokit.rest.pulls.get({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber,
      mediaType: {
        format: "diff",
      },
    });
    return prDiff;
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
