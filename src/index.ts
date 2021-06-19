import {GoogleSpreadsheet} from "google-spreadsheet";

const doc = new GoogleSpreadsheet("116AOmReGPhbloSp5yHLzJ2HbytOIiW6162CC_Vi1ZNs");

await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
});

await doc.loadInfo(); // loads document properties and worksheets
console.log(doc.title);
await doc.updateProperties({ title: 'renamed doc' });

const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
console.log(sheet.title);
console.log(sheet.rowCount);

// adding / removing sheets
const newSheet = await doc.addSheet({ title: 'hot new sheet!' });
await newSheet.delete();