import {GitHubProvider} from "./src/github-provider";
import {PrivilegedRequester} from "./src/privileged-requester";
import {PullRequest} from "./src/pull-request";
import {Runner} from "./src/runner";

const core = require('@actions/core');
const myToken = core.getInput('myToken');
const provider = new GitHubProvider(myToken);
const pullRequest = new PullRequest(provider);
const privilegedRequester = new PrivilegedRequester(provider);
const runner = new Runner(pullRequest, privilegedRequester)
await runner.run();
