// Import a recoverable local vendor override file without replacing database edits.
import fs from 'node:fs';import {PrismaClient} from '@prisma/client';import {PrismaPg} from '@prisma/adapter-pg';
const file=process.argv[2];if(!file)throw Error('Pass the path to a local vendor override JSON file.');
const input=JSON.parse(fs.readFileSync(file,'utf8'));if(!input.vendors || typeof input.vendors!=='object')throw Error('Invalid vendor archive.');
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
try{let imported=0;for(const [id,value] of Object.entries(input.vendors)){if(!value.fields || typeof value.fields.name!=='string')throw Error('Invalid vendor entry.');const r=await db.adminVendorOverride.createMany({data:[{id,fields:value.fields,detail:value.detail??{}}],skipDuplicates:true});imported+=r.count;}console.log({imported});}finally{await db.$disconnect();}
