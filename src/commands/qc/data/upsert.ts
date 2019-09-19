import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson, toAnyJson } from '@salesforce/ts-types';
import { readFileSync } from 'fs';
import { TableColumn } from 'cli-ux/lib/styled/table';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('quickcommands', 'upsert');

export default class Upsert extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx qc:data:upsert --jsonfile config-cpq/SBQQ__ErrorCondition__c.json --sobject SBQQ__ErrorCondition__c --externalid ExternalId__c --targetusername myOrg@example.com
  Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  My hub org id is: 00Dxx000000001234
  `
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    jsonfile: flags.filepath({char: 'f', description: messages.getMessage('jsonfile'), required: true}),
    sobject: flags.string({char: 's', description: messages.getMessage('sobject'), required: true}),
    externalid: flags.string({char: 'i', description: messages.getMessage('externalid'), required: true})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {

    interface LookupResolver {
      externalApiName: string;
      value: string;
    }

    interface UpsertResult {
      id: string;
      success: boolean;
      errors: any[];
      created: boolean;
    }

    interface QueryResult {
      Id: string;
    }

    // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    const conn = this.org.getConnection();
    const jsonfile = this.flags.jsonfile;
    const sobject = this.flags.sobject;
    const externalId = this.flags.externalid;

    const fileContent = readFileSync(jsonfile, 'utf-8');
    /*const records = {
        "Name": "VS_NotAvailable",
        "SBQQ__Active__c": true,
        "SBQQ__AdvancedCondition__c": null,
        "SBQQ__ConditionsMet__c": "All",
        "SBQQ__ErrorMessage__c": "VendiloSubito is not available",
        "SBQQ__EvaluationEvent__c": "Always",
        "SBQQ__EvaluationOrder__c": null,
        "SBQQ__LookupMessageField__c": null,
        "SBQQ__LookupObject__c": null,
        "SBQQ__LookupProductField__c": null,
        "SBQQ__LookupRequiredField__c": null,
        "SBQQ__LookupTypeField__c": null,
        "SBQQ__Scope__c": "Quote",
        "SBQQ__Type__c": "Validation",
        "ExternalId__c": "VS_NotAvailable"
      };*/
    
    const records = JSON.parse(fileContent);
    
    if(!records) {
      throw new SfdxError(messages.getMessage('errorNoRecordsInFile', [jsonfile]));
    }
    
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

    // Return an object to be displayed with --json
    return { sobject:sobject, records: toAnyJson(outputs) };
  }
}
