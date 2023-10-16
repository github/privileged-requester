import { GitHubProvider } from "../src/github-provider";
import { PrivilegedRequester } from "../src/privileged-requester";

import * as core from "@actions/core";

jest.spyOn(core, "debug").mockImplementation(() => {});
jest.spyOn(core, "info").mockImplementation(() => {});

test("We receive the expected config content", async () => {
  let configContent = `---
requesters:
  robot:
    labels:
      - testing
  robot_two:
    labels:
      - dependencies
      - github_actions    
    `;
  let provider = new GitHubProvider("token");
  jest
    .spyOn(provider, "getConfigContent")
    .mockImplementation(() => configContent);
  expect(provider.getConfigContent()).toBe(configContent);

  let privilegedRequester = new PrivilegedRequester(provider);
  let requesters = await privilegedRequester.getRequesters();
  expect(requesters).toStrictEqual({
    robot: { labels: ["testing"] },
    robot_two: { labels: ["dependencies", "github_actions"] },
  });
});

test("We do not receive the expected config content", async () => {
  let provider = new GitHubProvider("token");
  jest
    .spyOn(provider, "getConfigContent")
    .mockImplementation(() => false);
  expect(provider.getConfigContent()).toBe(false);

  let privilegedRequester = new PrivilegedRequester(provider);
  let requesters = await privilegedRequester.getRequesters();
  expect(requesters).toStrictEqual(undefined);
});

test("We receive malformed yaml from the config content", async () => {
  let configContent = `---
requeaklfsdhjalkfhlakhfkahlkfah`;
  let provider = new GitHubProvider("token");
  jest
    .spyOn(provider, "getConfigContent")
    .mockImplementation(() => configContent);
  expect(provider.getConfigContent()).toBe(configContent);

  let privilegedRequester = new PrivilegedRequester(provider);
  let requesters = await privilegedRequester.getRequesters();
  expect(requesters).toStrictEqual(undefined);
});
