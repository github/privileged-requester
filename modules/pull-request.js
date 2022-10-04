import core from "@actions/core";

export { PullRequest };

class PullRequest {
    constructor(provider) {
        const core = require('@actions/core');
        this.github = provider;
        this.prCreator = core.getInput('prCreator').toLowerCase();
        this.prNumber = core.getInput('prNumber');
        this.prCommits = false
        this.prLabels = false
    }

    async approve() {
        await this.github.createReview(this.prNumber, "APPROVE")
    }

    async listCommits() {
        if (this.prCommits === false) {
            this.prCommits = await this.github.listPRCommits(this.prNumber)
        }
        return this.prCommits
    }

    async listLabels() {
        if (this.prLabels === false) {
            this.prLabels = await this.github.listLabelsOnPR(this.prNumber)
        }
        return this.prLabels
    }
}