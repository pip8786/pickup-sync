import creds from "./config/pickup-sync.json";
import {GoogleSpreadsheet} from "google-spreadsheet";
import {cleanup} from "./db";
import {getCurrentComments, getCurrentPlayers} from "./pickup";

(async function() {
    const doc = new GoogleSpreadsheet("116AOmReGPhbloSp5yHLzJ2HbytOIiW6162CC_Vi1ZNs");
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo(); // loads document properties and worksheets

    const sheet = doc.sheetsByTitle["Players"];
    await sheet.clear();
    await sheet.setHeaderRow(["User ID", "Nickname", "Location", "Guests", "Status"]);
    const players = await getCurrentPlayers();
    const rows = players.map(p => [p.userid, p.nickname, p.location, p.guests, p.status]);
    await sheet.addRows(rows);
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
    const comments = await getCurrentComments();
    const commentRows = comments.map(c => [c.userid, c.time, c.comment]);
    await commentSheet.addRows(commentRows);

    cleanup();
}());

