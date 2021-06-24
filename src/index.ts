import creds from "./config/pickup-sync.json";
import {GoogleSpreadsheet} from "google-spreadsheet";
import {schedule} from  "node-cron";
import {getCurrentComments, getCurrentPlayers} from "./pickup";

const job = schedule("*/2 7-12 * * 1,2,3,4,5",main);
//call once to start.
main();
job.start();

async function main() {
    console.clear();
    console.log("Fetching players and syncing to spreadsheet...", new Date().toLocaleTimeString());
    const doc = new GoogleSpreadsheet("116AOmReGPhbloSp5yHLzJ2HbytOIiW6162CC_Vi1ZNs");
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo(); // loads document properties and worksheets

    const today = new Date();
    const month = `${(today.getMonth()+1)}`.padStart(2,'0');
    const todayString = `${today.getFullYear()}-${month}-${today.getDate()}`;
    const sheet = doc.sheetsByTitle["Players"];
    await sheet.clear();
    await sheet.setHeaderRow(["User ID", "Nickname", "Location", "Guests", "Status"]);
    const players = await getCurrentPlayers(todayString);
    const rows = players.map(p => [p.userid, p.nickname, p.location, p.guests, p.status]);
    await sheet.addRows(rows, {insert: false, raw:true});
    console.log(`Syncing ${rows.length} players.`);
    await sheet.loadCells("G1:G2");
    const countCell = sheet.getCell(1, 6);
    countCell.formula = "=COUNTA(A2:A)+SUM(D2:D)";
    await countCell.save();

    const countTitle = sheet.getCell(0, 6);
    countTitle.value = "Count";
    await countTitle.save();

    const commentSheet = doc.sheetsByTitle["Comments"];
    await commentSheet.clear();
    await commentSheet.setHeaderRow(["User ID", "Time", "Comment"]);
    const comments = await getCurrentComments(todayString);
    const commentRows = comments.map(c => [c.userid, c.time, c.comment]);
    await commentSheet.addRows(commentRows);
    console.log(`Syncing ${commentRows.length} comments.`);
}

