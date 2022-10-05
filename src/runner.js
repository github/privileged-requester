export {Runner};

class Runner {
    constructor(pullRequest, privilegedRequesters) {
        this.pullRequest = pullRequest
        this.privilegedRequesters = privilegedRequesters
    }


    async processCommits(privileged_requester_username) {
        // Check all commits of the PR to verify that they are all from the privileged requester, otherwise return from the check
        for (const [, commit] of Object.entries(this.pullRequest.listCommits())) {
            let commitAuthor = commit.author.login.toLowerCase();

            if (commitAuthor !== privileged_requester_username) {
                console.log(`Unexpected commit author found by ${commitAuthor}! Commits should be authored by ${privileged_requester_username} I will not proceed with the privileged reviewer process.`);
                return false;
            }
        }
        return true;
    }

    async processLabels(privileged_requester_config) {
        // Check labels of the PR to make sure that they match the privileged_requester_config, otherwise return from the check
        const prLabels = await this.pullRequest.listLabels()
        const prLabelArray = [];

        for (const [, prLabel] of Object.entries(prLabels)) {
            let prLabelName = prLabel.name;
            prLabelArray.push(prLabelName);
        }

        console.log(`Comparing the PR Labels: ${prLabelArray} with the privileged requester labels: ${privileged_requester_config.labels}`)
        let differences = prLabelArray.filter(x => !privileged_requester_config.labels.includes(x));
        if (differences.length !== 0) {
            console.log(`Invalid label(s) found: ${differences}. I will not proceed with the privileged reviewer process.`);
            return false;
        }
        return true;
    }

    async run() {
        const requesters = await this.privilegedRequesters.getRequesters()
        for (const [privileged_requester_username, privileged_requester_config] of Object.entries(requesters)) {
            // console.log(privileged_requester_username);
            // If privileged_requester_username is not the creator of the PR, move on
            // If privileged_requester_username is the creator of the PR, check the remaining config
            console.log(`PR creator is ${this.pullRequest.prCreator}. Testing against ${privileged_requester_username}`)
            if (this.pullRequest.prCreator !== privileged_requester_username) {
                continue;
            }
            await this.processPrivilegedReviewer(privileged_requester_username, privileged_requester_config)
        }
    }

    async processPrivilegedReviewer(privileged_requester_username, privileged_requester_config) {

        console.log(`Privileged requester ${privileged_requester_username} found. Checking PR criteria against the privileged requester configuration.`);

        let commits = await this.processCommits(privileged_requester_username)
        if (commits === false) {
            return 0;
        }

        let labels = await this.processLabels(privileged_requester_config)
        if (labels === false) {
            return 0;
        }

        // If we've gotten this far, the commits are all from the privileged requestor and the labels are correct
        // We can now approve the PR
        console.log("Approving the PR for a privileged reviewer.")
        await this.pullRequest.approve()
        console.log("PR approved, all set!")
    }
}
