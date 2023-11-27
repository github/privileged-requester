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
        core.debug(`config: ${config}`);

        this.configContents = yaml.load(config);
        this.requesters = this.configContents["requesters"];

        // set the key (which is the requester name) to lowercase
        if (this.requesters) {
          this.requesters = Object.keys(this.requesters).reduce((acc, key) => {
            acc[key.toLowerCase()] = this.requesters[key];
            return acc;
          }, {});
        }
      } catch (err) {
        core.error(
          `There was a problem with the privileged requester configuration.\n${err}\n${err.stack}`,
        );
        core.setFailed(err.message);
        return false;
      }
    }
    return this.requesters;
  }
}
