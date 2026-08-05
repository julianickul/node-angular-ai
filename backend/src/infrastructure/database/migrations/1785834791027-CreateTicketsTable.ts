import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTicketsTable1785834791027 implements MigrationInterface {
    name = 'CreateTicketsTable1785834791027'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`auth_tokens\` ADD CONSTRAINT \`FK_9691367d446cd8b18f462c191b3\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_67714d39d16d1ea5a234b05b094\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_dff6e2b44c9b5e177114588772f\` FOREIGN KEY (\`assignee_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP FOREIGN KEY \`FK_dff6e2b44c9b5e177114588772f\``);
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP FOREIGN KEY \`FK_67714d39d16d1ea5a234b05b094\``);
        await queryRunner.query(`ALTER TABLE \`auth_tokens\` DROP FOREIGN KEY \`FK_9691367d446cd8b18f462c191b3\``);
    }

}
