import creds from "./config/db.json";
import mysql, {Connection} from "mysql2/promise";

let conn:Connection|undefined;

export async function getConnection():Promise<Connection> {
	if(conn === undefined) {
		conn = await mysql.createConnection({
			host: creds.host,
			user: creds.username,
			database: creds.dbname,
			password: creds.password,
			port: creds.port,
			namedPlaceholders: true
		});
	}
	return conn;
}

export function cleanup() {
	console.log("Cleaning up database connection.");
	conn?.destroy();
	conn = undefined;
}