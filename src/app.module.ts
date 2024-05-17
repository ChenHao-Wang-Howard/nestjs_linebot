import { Module } from '@nestjs/common';
import { Authmodule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';


@Module({
  imports: [Authmodule, PrismaModule],
  
})
export class AppModule {}
