import {buildSearchIndex} from '../../lib/oscp-search-index.ts';
export async function GET(){return new Response(JSON.stringify(await buildSearchIndex()),{headers:{'Content-Type':'application/json; charset=utf-8'}});}
