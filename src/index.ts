import creds from "./config/pickup-sync.json";
import {GoogleSpreadsheet} from "google-spreadsheet";
import {schedule} from  "node-cron";
import {getCurrentComments, getCurrentPlayers, syncPlayers} from "./pickup";
import {cleanup} from "./db";

//Main sync
schedule("*/2 7-12 * * 1,2,3,4,5",main);
//Clear guests first thing in the morning
schedule("0 0 3 * * 1,2,3,4,5", clearGuests);
//call once to start.
main();

let cache = {};

async function main() {
    console.clear();
    console.log("Fetching players and syncing to spreadsheet...", new Date().toLocaleTimeString());
    const doc = new GoogleSpreadsheet("116AOmReGPhbloSp5yHLzJ2HbytOIiW6162CC_Vi1ZNs");
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo(); // loads document properties and worksheets

    //Sync the players from the sheet
    const guestSheet = doc.sheetsByTitle["Guests"];
    const rows = await guestSheet.getRows();
    const guests = rows.map(r => ({
        userid: r['User Id'],
        inOut: r['In/Out'],
        nickname: r['Nickname'],
        status: r['Status']
    }));
    await syncPlayers(guests);

    //Check cache
    const today = new Date();
    const todayString = getTodayString(today);
    const players = await getCurrentPlayers(todayString);
    const comments = await getCurrentComments(todayString);
    const newCache = {
        players,
        comments
    };

    const sheet = doc.sheetsByTitle["Players"];

    if(JSON.stringify(newCache) !== JSON.stringify(cache)) {
        //Sync to the sheet if needed
        await sheet.clear();
        await sheet.setHeaderRow(["User ID", "Nickname", "Location", "Guests", "Status"]);

        const rows = players.map(p => [p.userid, p.nickname, p.location, p.guests, p.status]);
        await sheet.addRows(rows, {insert: false, raw:true});
        console.log(`Syncing ${rows.length} players.`);
        await sheet.loadCells("G1:G5");
        const countCell = sheet.getCell(1, 6);
        countCell.formula = "=COUNTA(A2:A)+SUM(D2:D)";
        await countCell.save();

        const countTitle = sheet.getCell(0, 6);
        countTitle.value = "Count";
        await countTitle.save();

        const commentSheet = doc.sheetsByTitle["Comments"];
        await commentSheet.clear();
        await commentSheet.setHeaderRow(["User ID", "Time", "Comment"]);

        const commentRows = comments.map(c => [c.userid, c.time, c.comment]);
        await commentSheet.addRows(commentRows);
        console.log(`Syncing ${commentRows.length} comments.`);
        cache = newCache;
    } else {
        console.log(`Caches matched. Not doing any more sheet work.`);
    }

    //Set the updated at no matter what
    const timeTitle = sheet.getCell(3, 6);
    timeTitle.value = "Updated At";
    await timeTitle.save();
    const timeCell = sheet.getCell(4, 6);
    timeCell.value = today.toLocaleString();
    await timeCell.save();

    cleanup();
}

async function clearGuests() {
    console.log("Clearing guests...");
    const doc = new GoogleSpreadsheet("116AOmReGPhbloSp5yHLzJ2HbytOIiW6162CC_Vi1ZNs");
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo(); // loads document properties and worksheets

    //Sync the players from the sheet
    const guestSheet = doc.sheetsByTitle["Guests"];
    const rows = await guestSheet.getRows();
    for(const row of rows) {
        if(row.rowIndex === 0) continue;
        row['In/Out'] = "Out";
        row['Status'] = "";
        await row.save();
    }
}

export function getTodayString(today:Date) {
    const month = `${today.getMonth()+1}`.padStart(2,'0');
    const day = `${today.getDate()}`.padStart(2,'0');
    return `${today.getFullYear()}-${month}-${day}`;
}

export function getTimestamp(today:Date) {
    const month = `${today.getMonth()+1}`.padStart(2,'0');
    const day = `${today.getDate()}`.padStart(2,'0');
    const hours = `${today.getHours()}`.padStart(2,'0');
    const minutes = `${today.getMinutes()}`.padStart(2,'0');
    const seconds = `${today.getSeconds()}`.padStart(2,'0');
    return `${day}/${month}/${today.getFullYear()} ${hours}:${minutes}:${seconds}`;
}