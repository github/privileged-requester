import {GitHubProvider} from "./modules/github-provider";
import {PrivilegedRequester} from "./modules/privileged-requester";
import {PullRequest} from "./modules/pull-request";
import {Runner} from "./modules/runner";

const core = require('@actions/core');
const myToken = core.getInput('myToken');
const provider = new GitHubProvider(myToken);
const pullRequest = new PullRequest(provider);
const privilegedRequester = new PrivilegedRequester(provider);
const runner = new Runner(pullRequest, privilegedRequester)
await runner.run();
