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
    let login;
    try {
      core.debug(
        `attempting to get current user via octokit.rest.users.getAuthenticated()`,
      );
      const { data: currentUser } =
        await this.octokit.rest.users.getAuthenticated();
      login = currentUser.login;
      core.debug(
        "obtained current user via octokit.rest.users.getAuthenticated()",
      );
    } catch (error) {
      core.debug(error);
      core.debug(
        `octokit.rest.users.getAuthenticated() failed, assuming the default input GITHUB_TOKEN is a github-actions[bot] token`,
      );
      core.debug(
        `since the GITHUB_TOKEN might be 'github-actions[bot]' we will use the default input option of 'handle' instead`,
      );
      login = core.getInput("handle", { required: true });
      core.debug(`handle value: ${login}`);
    }

    core.debug(`current user: ${login}`);
    return login;
  }

  // check if the current authenticated user (login) has an active APPROVED review on the PR
  // returns true if the user has an active APPROVED review, false otherwise
  // note: if the user had an active APPROVED review but it was dismissed, this will return false
  async hasAlreadyApproved(prNumber) {
    // get the login of the current authenticated user
    const login = await this.getCurrentUser();
    core.info(
      `checking if ${login} has already approved PR #${prNumber} in a previous workflow run`,
    );

    // get all reviews on the PR
    const { data: reviews } = await this.octokit.rest.pulls.listReviews({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber,
    });

    // filter the reviews to only those from the current user and sort them by date descending
    const userReviews = reviews
      .filter(
        (review) => review.user.login.toLowerCase() === login.toLowerCase(),
      )
      .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

    // attempt to get the latest review from the user (if there are no reviews from the user, this will be undefined)
    const latestReview = userReviews[0];

    // check if the latest review from the user is an APPROVED review and not undefined
    const approved = latestReview && latestReview.state === "APPROVED";

    // log the result
    if (approved) {
      core.info(
        `${login} has already approved PR #${prNumber} in a previous workflow run`,
      );
    }

    // return the result (true if the user has an active APPROVED review, false otherwise)
    return approved;
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
