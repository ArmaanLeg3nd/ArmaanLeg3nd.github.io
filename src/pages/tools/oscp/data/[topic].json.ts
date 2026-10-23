import { catalog, topicMethods } from '../../../../lib/oscp';
import type { APIRoute } from 'astro';
export function getStaticPaths() { return catalog.topics.map(topic => ({ params: { topic: topic.id } })); }
export const GET: APIRoute = async ({ params }) => new Response(JSON.stringify(await topicMethods(params.topic!)), { headers: { 'Content-Type': 'application/json' } });
