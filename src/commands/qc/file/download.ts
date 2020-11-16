import { flags, SfdxCommand } from "@salesforce/command";
import { Messages } from "@salesforce/core";
import { AnyJson } from "@salesforce/ts-types";
import { writeFileSync } from "fs";
import { OptionsWithUri } from "request-promise";
import requestPromise = require("request-promise");

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages("quickcommands", "download");

export default class Download extends SfdxCommand {
  public static description = messages.getMessage("commandDescription");

  public static examples = [
    `$ sfdx qc:file:download --jsonfile config-cpq/SBQQ__ErrorCondition__c.json --sobject SBQQ__ErrorCondition__c --externalid ExternalId__c --targetusername myOrg@example.com
  Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  My hub org id is: 00Dxx000000001234
  `,
  ];

  public static args = [{ name: "file" }];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    sfdcfilename: flags.string({
      char: "n",
      description: messages.getMessage("filename"),
      required: true,
    }),
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {

    interface ContentVersionResult {
      Id: string;
      Title: string;
      VersionData: string;
      FileExtension: string;
    }

    // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    const conn = this.org.getConnection();

    const sfdcFileName = this.flags.sfdcfilename;
    console.log(`Name to search ${sfdcFileName}`);

    const contentVersionData = await conn.query(
      `SELECT Id, Title, VersionData, FileExtension from ContentVersion WHERE Title LIKE '%${sfdcFileName}%'`
    );
    if (
      contentVersionData.done &&
      contentVersionData.records &&
      contentVersionData.records.length > 0
    ) {
      const contentVersionDataRecord: Partial<ContentVersionResult> =
        contentVersionData.records[0];

      const url = conn.instanceUrl.concat(contentVersionDataRecord.VersionData);

      let options: OptionsWithUri = {
        method: "GET",
        uri: url,
        headers: {
          Authorization: "Bearer " + conn.accessToken,
        },
        encoding: null,
        json: false, // Automatically parses the JSON string in the response
      };

      const getFileBody = await requestPromise(options)
        .then((body) => {
          return body;
        })
        .catch(async (err) => {
          if (err.statusCode === 401) {
            this.org.refreshAuth();
            options.headers = { Authorization: "Bearer " + conn.accessToken };
            await requestPromise(options)
              .then((res) => {
                return res;
              })
              .catch((err2) => {
                return err2;
              });
          }
          return err;
        });

        writeFileSync(`${contentVersionDataRecord.Title}.${contentVersionDataRecord.FileExtension}`, getFileBody, {encoding: 'utf8'});
    }

    // Return an object to be displayed with --json
    return { file_name: sfdcFileName };
  }
}
