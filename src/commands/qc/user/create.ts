import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError, User, UserFields, Org } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { readFileSync } from 'fs';
import { TableColumn } from 'cli-ux/lib/styled/table';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('quickcommands', 'user');

export default class Create extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx qc:user:create --jsonfile config-cpq/SBQQ__ErrorCondition__c.json --sobject SBQQ__ErrorCondition__c --externalid ExternalId__c --targetusername myOrg@example.com
  Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  My hub org id is: 00Dxx000000001234
  `
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    jsonfile: flags.filepath({char: 'f', description: messages.getMessage('jsonfile'), required: true})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {

    interface UserRecord {
      alias: string;
      lastName: string;
      firstName: string;
      username: string;
      email: string;
      profile: string;
      role: string;
      timeZoneSidKey: string;
      localeSidKey: string;
      emailEncodingKey: string;
      languageLocaleKey: string;
      active: boolean;
    }

    // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    const conn = this.org.getConnection();
    const jsonfile = this.flags.jsonfile;

    const fileContent = readFileSync(jsonfile, 'utf-8');
    
    const records: UserRecord[] = JSON.parse(fileContent);
    
    if(!records) {
      throw new SfdxError(messages.getMessage('errorNoRecordsInFile', [jsonfile]));
    }

    const profileMap: Map<String, String> = new Map<String, String>();
    const roleMap: Map<String, String> = new Map<String, String>();

    records.forEach( user => {
        profileMap.set(user.profile, null);
        roleMap.set(user.role, null);
    });

    const qResultProfiles = await conn.query(`SELECT Id, Name FROM Profile WHERE Name IN ('${records.map(user => user.profile).join('\',\'')}') `);
    const profileMapper = qResultProfiles.records;

    const qResultRoles = await conn.query(`SELECT Id, Name FROM UserRole WHERE Name IN ('${records.map(user => user.role).join('\',\'')}') `);
    const roleMapper = qResultRoles.records;

    const orgValues = this.org.getFields([Org.Fields.ALIAS, Org.Fields.CREATED, Org.Fields.ORG_ID, Org.Fields.STATUS, Org.Fields.INSTANCE_URL]);
    
    
    let sandboxAlias;
    try {
      sandboxAlias = orgValues.instanceUrl.toString();
      sandboxAlias = sandboxAlias.split('--')[1];
      sandboxAlias= sandboxAlias.split('.')[0];
      
    } catch (error) {
      //FIXME: 
    }

    const sfdcUsers: UserFields[] = records.map(user => {
      const profileObj: any = profileMapper.find((elem, val, idx) => {return (elem as any).Name === user.profile});
      const roleObj: any = roleMapper.find((elem, val, idx) => {return (elem as any).Name === user.role});
      const username = sandboxAlias ? user.username.concat('.',sandboxAlias) : user.username;
      
      return {
        id: null,
        username: username,
        lastName: user.lastName,
        firstName: user.firstName,
        alias: user.alias,
        timeZoneSidKey: user.timeZoneSidKey,
        localeSidKey: user.localeSidKey,
        emailEncodingKey: user.emailEncodingKey,
        profileId: profileObj? profileObj.Id: null,
        languageLocaleKey: user.languageLocaleKey,
        email: user.email,
        userRoleId: roleObj ? roleObj.Id : null,
        isActive: user.active
      }
    });

    const result: any[] = new Array();
    for (let i = 0; i < sfdcUsers.length; i++) {
      const sfdcUser = sfdcUsers[i];
      try {
        const userResult = await conn.create('User', sfdcUser);
        console.log(JSON.stringify(userResult));
        result.push({
          username: sfdcUser.username,
          success: (userResult as any).success
        });
  
      } catch (error) {
        result.push({
          username: sfdcUser.username,
          errors: `${error.errorCode}  ${JSON.stringify(error.fields)}`
        });
      }
      
    }

    const outputColumns: Partial<TableColumn>[] = [{key: 'username', label: 'Username'}, {key: 'success', label: 'Success'},{key: 'errors', label: 'Errors'}];
    
    //TODO: Use better outputs
    this.ux.table(result, {colSep: '|', columns: outputColumns});

    // Return an object to be displayed with --json
    return { users: result };
  }
}
