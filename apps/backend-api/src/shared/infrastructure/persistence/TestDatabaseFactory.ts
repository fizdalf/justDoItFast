import {Connection, createConnection} from "mysql2/promise";
import {tableIndex} from "./table-index";
import {ConfigService} from "@nestjs/config";

let connection: Connection = null;

let clients = [];

export async function DatabaseConnectionFactory(config: ConfigService): Promise<Connection> {
    clients.push(1);
    if (!connection) {
        connection = await createConnection({
            host: config.get('TEST_DATABASE_HOST'),
            user: config.get('TEST_DATABASE_USER'),
            password: config.get('TEST_DATABASE_PASSWORD'),
            database: config.get('TEST_DATABASE_NAME'),
            port: config.get('TEST_DATABASE_PORT'),
        });
    }
    console.log('should clear database ')
    await connection.query('SET FOREIGN_KEY_CHECKS=0;');
    for (const tableName of tableIndex) {
        await connection.query(`TRUNCATE TABLE ${tableName};`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS=1;');
    console.log('should have cleared the database');
    return connection;
}

export async function DatabaseConnectionCloseFactory(): Promise<void> {
    clients.pop();
    if (clients.length === 0 && connection) {
        await connection.end();
        connection = null;
    }
}