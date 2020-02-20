import { flags, SfdxCommand } from "@salesforce/command";
import { Messages } from "@salesforce/core";
import { AnyJson } from "@salesforce/ts-types";
import { OptionsWithUri } from "request-promise";
import requestPromise = require("request-promise");

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages("quickcommands", "call");

export default class Execute extends SfdxCommand {
  public static description = messages.getMessage("commandDescription");

  public static examples = [
    `$ sfdx qc:call:execute --url "/services/data/v48.0/tooling" --targetusername myOrg@example.com
    {
      "tooling": "/services/data/v48.0/tooling",
      "metadata": "/services/data/v48.0/metadata"
    }
  `
  ];

  public static args = [{ name: "file" }];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    url: flags.string({char: "e", description: messages.getMessage("endpoint"), required: false}),
    method: flags.string({char: "m", description: messages.getMessage("httpmethod"), required: false}),
    body: flags.string({char: 'b', description: messages.getMessage("httpbody"), required: false})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    const conn = this.org.getConnection();
    const uri: string = this.flags.url || '/';

    let url: string;
    if(uri.startsWith('/services')) {
      url = conn.instanceUrl.concat(uri);
    } else {
      url = conn.baseUrl().concat(uri);
    }
    
    let options: OptionsWithUri = {
      method: 'GET',
      uri: url,
      headers: {
        "Authorization": "Bearer " + conn.accessToken
      },
      json: true // Automatically parses the JSON string in the response
    };

    const callResponse = await requestPromise(options).then( body => {
      return body;
    }).catch(async err => {
      if(err.statusCode === 401) {
        this.org.refreshAuth();
        options.headers = {"Authorization": "Bearer " + conn.accessToken};
        await requestPromise(options).then(res => {
          return res;
        }).catch(err2 => {
          return err2;
        });
      }
      return err;
    });

    this.ux.styledJSON(callResponse);

    // Return an object to be displayed with --json
    return { callResponse };
  }
}
