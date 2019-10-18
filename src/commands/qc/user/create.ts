import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError, User, UserFields } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { readFileSync } from 'fs';

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
      username: string;
      email: string;
      profile: string;
      role: string;
      timeZoneSidKey: string;
      localeSidKey: string;
      emailEncodingKey: string;
      languageLocaleKey: string;
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

    const sfdcUsers: UserFields[] = records.map(user => {
      const profileObj: any = profileMapper.find((elem, val, idx) => {return (elem as any).Name === user.profile});
      const roleObj: any = roleMapper.find((elem, val, idx) => {return (elem as any).Name === user.role});
      console.log("profile", user.profile, "profile mapped",profileObj, user.role, "role mapped", roleObj);

      return {
        id: null,
        username: user.username,
        lastName: "pippo",
        alias: "p",
        timeZoneSidKey: user.timeZoneSidKey,
        localeSidKey: user.localeSidKey,
        emailEncodingKey: user.emailEncodingKey,
        profileId: profileObj.Id,
        languageLocaleKey: user.languageLocaleKey,
        email: user.email,
        userRoleId: roleObj ? roleObj.Id : null
      }
    });

    const userResult = await conn.create('User', sfdcUsers);
    console.log(JSON.stringify(userResult));
    
    /*
    const describeSobject = await conn.describe(sobject);

    if (!describeSobject) {
      throw new SfdxError(messages.getMessage('errorNoDescribeSobject', [sobject]));
    }
    
    const lookupFields = [];
    describeSobject.fields.forEach(field => {
      if (field.type === 'reference') {
        lookupFields.push(field);
      }
    });
    

    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      for (let j = 0; j < lookupFields.length; j++) {
        const field = lookupFields[j];
        const transcodeObj = record[field.relationshipName];
        if (transcodeObj) {
          delete transcodeObj['attributes'];
          const externalIdField = Object.keys(transcodeObj)[0];
          const externalIdValue = transcodeObj[externalIdField];
          const idResolved = await conn.query(`SELECT Id FROM ${field.referenceTo[0]} WHERE ${externalIdField} = '${externalIdValue}'`);
          if (idResolved.done && idResolved.records && idResolved.records.length > 0) {
            const idResult: Partial<QueryResult> = idResolved.records[0];
            record[field.name] = idResult.Id;
            delete record[field.relationshipName];
          }
        } else if (transcodeObj === null) {
          delete record[field.relationshipName];
        }
      }
    }

    //3. Upsert records 
    // FIXME: is not allowed to change maxRequest (ref https://salesforce.stackexchange.com/questions/275145/how-to-set-maxrequest-in-sfdx-plugin-error-exceeded-max-limit-of-concurrent-ca) so this is a WA
    const _maxRequest = conn.maxRequest;
    let result: Partial<UpsertResult>[] = [];
    let recordProcessed = 0;
    while (recordProcessed < records.length) {
      const upsertRecords = records.slice(recordProcessed, recordProcessed + _maxRequest);
      const partialResult: Partial<UpsertResult> | Partial<UpsertResult>[] = await conn.upsert(sobject, upsertRecords, externalId);
      if (Array.isArray(partialResult)) {
        result = result.concat(partialResult);
      } else {
        result.push(partialResult);
      }
      recordProcessed += _maxRequest;
    }


    const outputColumns: Partial<TableColumn>[] = [{key: 'id', label: 'ID'}, {key: 'success', label: 'Success'},{key: 'errors', label: 'Errors'}, {key: 'created', label: 'Created'}];
    
    const outputs: UpsertResult[] = [];
    
    //FIXME: Manage better!
    result.forEach(res => {
      outputs.push({
        id: res.id,
        success: res.success,
        errors: res.errors,
        created: res.created
      });
    });
    
    //TODO: Use better outputs
    this.ux.log(`#### [${outputs.length}] records processed on ${sobject}`);
    this.ux.table(outputs, {colSep: '|', columns: outputColumns});

    */
    // Return an object to be displayed with --json
    return { };
  }
}
