import * as core from "@actions/core";

export { PrivilegedRequester };

const yaml = require("js-yaml");

class PrivilegedRequester {
  constructor(provider) {
    this.github = provider;
    this.requesters = false;
  }

  async getRequesters() {
    if (this.requesters === false) {
      try {
        const config = await this.github.getConfigContent();
        this.configContents = yaml.load(config);
        this.requesters = this.configContents["requesters"];
      } catch (err) {
        core.error(
          "There was a problem with the privileged requester configuration."
        );
        core.setFailed(err.message);
        return false;
      }
    }
    return this.requesters;
  }
}
