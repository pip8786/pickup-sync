import creds from "./config/pickup-sync.json";
import {GoogleSpreadsheet} from "google-spreadsheet";
import {cleanup} from "./db";
import {getCurrentPlayers} from "./pickup";

(async function() {
    const doc = new GoogleSpreadsheet("116AOmReGPhbloSp5yHLzJ2HbytOIiW6162CC_Vi1ZNs");
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo(); // loads document properties and worksheets

    const sheet = doc.sheetsByTitle["Players"];
    await sheet.clear();
    await sheet.setHeaderRow(["Nickname", "Location", "Status"]);
    const players = await getCurrentPlayers();
    const rows = players.map(p => [p.nickname, p.location, p.status]);
    await sheet.addRows(rows);
    cleanup();
}());

