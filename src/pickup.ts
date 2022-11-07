import {getConnection} from "./db";
import {getTimestamp, getTodayString} from "./index";
import {CurrentConfig} from "./config";

export async function getCurrentPlayers(dateString:string):Promise<PlayerRow[]> {
	const connection = await getConnection();
	const [rows,fields] = await connection.execute(
		"SELECT p.id, p.userid, p.date, p.timestamp, p.timeid, p.locationid, p.guests, l.location, t.time, n.nickname, n.status " +
		"FROM " +
		"    PLAYER p " +
		"        JOIN PROFILE n ON p.userid = n.userid " +
		"        JOIN TIME t ON t.id = p.timeid " +
		"        JOIN LOCATION l ON l.id = p.locationid " +
		"WHERE " +
		"    p.sportid=? and date=? " +
		"GROUP BY p.userid " +
		"ORDER BY p.location, p.time, p.id ",
		[CurrentConfig.sportId, dateString]);
	return rows as PlayerRow[];
}

export async function getCurrentComments(dateString:string):Promise<CommentRow[]> {
	const connection = await getConnection();
	const [rows, fields] = await connection.execute("SELECT c.*, p.nickname FROM COMMENT c JOIN PROFILE p on c.userid = p.userid WHERE c.sportid=? AND c.date=? ORDER BY c.time",[CurrentConfig.sportId, dateString]);
	return rows as CommentRow[];
}

export async function syncPlayers(guestPlayers: GuestPlayer[]) {
	const connection = await getConnection();
	const today = new Date();
	const formattedDate = getTodayString(today);
	for(const player of guestPlayers) {
		let nicknameUpdate = "";
		if(player.nickname?.length > 0) {
			//Only update nickname if it's set
			nicknameUpdate = ", nickname=:nickname";
		}
		await connection.execute(`INSERT INTO PROFILE (userid, status, nickname) VALUES (:userid, :status, :nickname) ON DUPLICATE KEY UPDATE status=:status${nicknameUpdate}`, player);
		const [rows] = await connection.execute("SELECT count(*) as count FROM PLAYER WHERE userid=:userid AND date=:today AND sportid=:sportid", {
			sportid: CurrentConfig.sportId,
			today: formattedDate,
			userid: player.userid
		});
		const countRows = rows as {count:number}[];
		if(countRows[0].count === 1) {
			if(player.inOut === "Out") {
				await connection.execute("DELETE FROM PLAYER WHERE userid=:userid AND date=:today AND sportid=:sportid", {
					sportid: CurrentConfig.sportId,
					today: formattedDate,
					userid: player.userid
				});
			}
		} else {
			if(player.inOut === "In") {
				const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
				const dayName = days[today.getDay()];
				const [rows, fields] = await connection.query("SELECT id FROM TIME WHERE sportid = ? AND time = ? AND day = ?", [CurrentConfig.sportId, CurrentConfig.sportTime, dayName])
				if(Array.isArray(rows) && rows.length) {
					const timeId = (rows[0] as any).id;
					//20/09/22 10:06:35
					const timestamp = getTimestamp(today);

					await connection.execute("INSERT INTO PLAYER (sportid, userid, date, guests, timestamp, timeid, locationid)  VALUES (:sportid, :userid, :date, :guests, :timestamp, :timeid, :locationid)", {
						sportid: CurrentConfig.sportId,
						date: formattedDate,
						timestamp,
						userid: player.userid,
						guests: 0,
						timeid: timeId,
						locationid: CurrentConfig.locationId
					});
				}
			}
		}
	}
}

export interface GuestPlayer {
	userid: string
	inOut: "In" | "Out"
	nickname: string
	status: string
}

export interface CommentRow {
	id: number;
	sportid: number;
	userid: string;
	date: string;
	time: string;
	comment: string;
}

export interface PlayerRow {
	id: number;
	userid: string;
	date: string;
	timestamp: string;
	timeid: number;
	locationid: number;
	guests: number;
	location: string;
	time: string;
	nickname: string;
	status: string;
}