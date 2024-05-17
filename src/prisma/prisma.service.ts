import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
    constructor() {
        super({
            datasources: {
                db: {
                    url: "postgresql://postgres:123@postgres:5432/nest?schema=public?connect_timeout=300"
                }
            }
        })
    }
}
