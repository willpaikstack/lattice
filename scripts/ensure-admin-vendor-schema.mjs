import fs from 'node:fs';
import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
if(process.env.LATTICE_VENDOR_SCHEMA_MIGRATION_ENABLED==='true'){
 const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
 try{await db.$executeRawUnsafe(fs.readFileSync(new URL('./p1-vendor-schema-2026-10-14.sql',import.meta.url),'utf8'));console.log('Durable vendor schema verified.');}finally{await db.$disconnect();}
}
