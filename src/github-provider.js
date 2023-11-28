const github = require("@actions/github");
const core = require("@actions/core");

export { GitHubProvider };

class GitHubProvider {
  constructor(token) {
    this.token = token;
    this.octokit = github.getOctokit(token);
    this.configContent = false;
  }

  async getCurrentUser() {
    const { data: currentUser } =
      await this.octokit.rest.users.getAuthenticated();
    return currentUser.login;
  }

  // check if the current authenticated user (login) has an active APPROVED review on the PR
  // returns true if the user has an active APPROVED review, false otherwise
  // note: if the user had an active APPROVED review but it was dismissed, this will return false
  async hasAlreadyApproved(prNumber) {
    // get the login of the current authenticated user
    const login = await this.getCurrentUser();

    const { data: reviews } = await this.octokit.rest.pulls.listReviews({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber,
    });

    // filter out all reviews that are not APPROVED
    const approvedReviews = reviews.filter(
      (review) => review.state === "APPROVED",
    );

    // filter out all reviews that are not by the current authenticated user via login
    const approvedReviewsByUser = approvedReviews.filter(
      (review) => review.user.login === login,
    );

    // if there are any reviews left, then login (this Action) has already approved the PR and we should not approve it again
    return approvedReviewsByUser.length > 0;
  }

  async createReview(prNumber, reviewEvent) {
    core.debug(`prNumber: ${prNumber}`);
    core.debug(`reviewEvent: ${reviewEvent}`);

    await this.octokit.rest.pulls.createReview({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber,
      event: reviewEvent,
    });
  }

  async getConfigContent() {
    const path = core.getInput("path", { required: true });
    core.info(`config path: ${path}`);

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
      },
    );
    return prLabels;
  }
}
