import {core, flags } from '@salesforce/command';
import { SfdxCommand } from "@salesforce/command";
import {join} from 'path';
import { AnyJson } from '@salesforce/ts-types';
import { CsvConverter } from '../../../../lib/csvConverter';
import { FileWriter } from '../../../../lib/fileWriter';

core.Messages.importMessagesDirectory(join(__dirname));
const messages = core.Messages.loadMessages('quickcommands', 'query');

export default class Query extends SfdxCommand {

  public static description = messages.getMessage('description');
  public static examples = [messages.getMessage('example')];

  protected static flagsConfig = {
    query : flags.string({char: 'q', description : messages.getMessage('query'), required : true}),
    resultformat: flags.string({ char: 'r', description: messages.getMessage('resultformatFlagDescription'), default: 'json', options: ['json', 'csv'] }),
    outputdir: flags.string({char: 'd', description: messages.getMessage('outputDirDescription')}),
  };

  protected static requiresUsername = true;

  public async run(): Promise<AnyJson> {
    const conn = this.org.getConnection();
    conn.version = '50.0';

    const query = this.flags.query;
    let resultset = new Array();

    resultset = resultset.concat(await this.retrieveBulkRecords(query, conn) || [])

    // this.ux.log(`resultset: ${resultset}`);

    let outDir;
    if (this.flags.outputdir) {
      outDir = this.flags.outputdir;
    } else {
      outDir = '.';
    }

    if (this.flags.resultformat === 'csv') {
      const csvConverter = new CsvConverter(['Id', 'CreatedById', 'CreatedDate', 'SystemModstamp', 'changeType__c', 'channelName__c', 'commitTimestamp__c', 'entityName__c', 'replayId__c', 'transactionKey__c']);
      const csv_resultset = csvConverter.toCsvFormat(resultset);
      FileWriter.writeFile(outDir, 'export.csv', csv_resultset);
    } else {
      FileWriter.writeFile(outDir, 'export.json', resultset);
    }

    // All commands should support --json
    return null;
  }

  private async retrieveBulkRecords<T>(query: string, conn: core.Connection) {
    return (await conn.bulk.query(query)
      .on('record', function (rec) {
        console.log(rec);
        return rec
      }))
      .on('error', function (err) {
        console.error(err);
      });
  }

}
