import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTicketHistoryTable1785848356905 implements MigrationInterface {
    name = 'CreateTicketHistoryTable1785848356905'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`ticket_history\` (\`id\` int NOT NULL AUTO_INCREMENT, \`ticket_id\` int NOT NULL, \`message\` text NOT NULL, \`changed_by_id\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`ticket_history\` ADD CONSTRAINT \`FK_369eedc575788b9f9e8667017b6\` FOREIGN KEY (\`ticket_id\`) REFERENCES \`tickets\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ticket_history\` ADD CONSTRAINT \`FK_eb61169cf6cf03ef81d71a3eaad\` FOREIGN KEY (\`changed_by_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`ticket_history\` DROP FOREIGN KEY \`FK_eb61169cf6cf03ef81d71a3eaad\``);
        await queryRunner.query(`ALTER TABLE \`ticket_history\` DROP FOREIGN KEY \`FK_369eedc575788b9f9e8667017b6\``);
        await queryRunner.query(`DROP TABLE \`ticket_history\``);
    }

}
