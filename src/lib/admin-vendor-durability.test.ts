import {it,expect,vi,beforeEach} from 'vitest';
const state=vi.hoisted(()=>({row:null as null|{id:string;fields:unknown;detail:unknown},findUnique:vi.fn(),findMany:vi.fn(),upsert:vi.fn()}));
vi.mock('./prisma',()=>({getPrismaClient:async()=>({adminVendorOverride:{findUnique:state.findUnique,findMany:state.findMany,upsert:state.upsert}})}));
import {saveOverseasVendorOverride,getOverseasVendorDetailOverrides,normalizeVendorSaveInput,applyOverseasVendorOverrides} from './admin-vendor-overrides';
import type {OverseasVendor} from './admin-vendors';
beforeEach(()=>{vi.resetAllMocks();state.row=null;state.findUnique.mockImplementation(async()=>state.row);state.findMany.mockImplementation(async()=>state.row?[state.row]:[]);state.upsert.mockImplementation(async({create,update})=>state.row=state.row?{...state.row,...update}:create);});
it('saves and reloads vendor edits from the database independently of filesystem state',async()=>{await saveOverseasVendorOverride('qa',normalizeVendorSaveInput({fields:{name:'Saved QA'},detail:{rfqRows:[{id:'qa-rfq'}]}}));expect((await applyOverseasVendorOverrides([{id:'qa',name:'Original'} as OverseasVendor]))[0].name).toBe('Saved QA');expect((await getOverseasVendorDetailOverrides('qa')).rfqRows?.[0].id).toBe('qa-rfq');});
it('fails closed when durable persistence is unavailable',async()=>{state.upsert.mockRejectedValue(new Error('Database unavailable'));await expect(saveOverseasVendorOverride('qa',normalizeVendorSaveInput({fields:{name:'QA'}}))).rejects.toThrow('Database unavailable');});
