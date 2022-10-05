import {GitHubProvider} from "./github-provider";
import {PrivilegedRequester} from "./privileged-requester";

test('We receive the expected config content', async() => {
    let configContent = `---
requesters:
  robot:
    labels:
      - testing
  robot_two:
    labels:
      - dependencies
      - github_actions    
    `
    let provider = new GitHubProvider('token');
    let spy = jest.spyOn(provider, 'getConfigContent').mockImplementation(() => configContent);
    expect(provider.getConfigContent()).toBe(configContent);

    let privilegedRequester = new PrivilegedRequester(provider)
    let requesters = await privilegedRequester.getRequesters()
    expect(requesters).toStrictEqual({"robot": {"labels": ["testing"]}, "robot_two": {"labels": ["dependencies", "github_actions"]}})
});



