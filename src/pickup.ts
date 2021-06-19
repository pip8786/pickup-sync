import {getConnection} from "./db";

export async function getCurrentPlayers():Promise<PlayerRow[]> {
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
		"ORDER BY p.location, p.time, p.id ",
		[1, "2021-06-08"]);
	return rows as PlayerRow[];
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