import { GitHubProvider } from "./src/github-provider";
import { PrivilegedRequester } from "./src/privileged-requester";
import { PullRequest } from "./src/pull-request";
import { Runner } from "./src/runner";

const core = require("@actions/core");
let myToken = core.getInput("myToken");
const robotUserToken = core.getInput("robotUserToken");
if (robotUserToken !== "") {
  core.info("Robot User configured. I will use that PAT instead.");
  myToken = robotUserToken;
}
const provider = new GitHubProvider(myToken);
const pullRequest = new PullRequest(provider);
const privilegedRequester = new PrivilegedRequester(provider);
const runner = new Runner(pullRequest, privilegedRequester);
runner.run();
