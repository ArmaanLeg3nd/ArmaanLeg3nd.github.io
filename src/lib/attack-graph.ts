import type { Investigation, InvestigationStep, StepStatus } from './investigation';
export const NODE_WIDTH = 284, NODE_HEIGHT = 150;
export interface GraphNode { step: InvestigationStep; x: number; y: number; index: number }
export function layoutInvestigation(document: Investigation, filter: StepStatus | 'all' = 'all') {
  const ordered = new Map(document.steps.map((s,i) => [s.id,i]));
  const steps = document.steps.filter(s => filter === 'all' || s.status === filter);
  const visible = new Set(steps.map(s => s.id));
  const edges = document.edges.filter(e => visible.has(e.from) && visible.has(e.to));
  const ranks = new Map<string,number>();
  // Only forward records establish rank. Explicit feedback/cycles stay visible as return edges.
  for (const step of steps) {
    const incoming = edges.filter(e => e.to === step.id && ordered.get(e.from)! < ordered.get(step.id)!);
    ranks.set(step.id,Math.max(0,...incoming.map(e => (ranks.get(e.from) || 0)+1)));
  }
  const rows = new Map<number,number>();
  const nodes: GraphNode[] = steps.map(step => {
    const rank = ranks.get(step.id) || 0, row = rows.get(rank) || 0; rows.set(rank,row+1);
    return {step,x:60+rank*370,y:75+row*220,index:ordered.get(step.id)!};
  });
  const byId = new Map(nodes.map(n => [n.step.id,n]));
  const connections = edges.map(edge => {
    const from=byId.get(edge.from)!,to=byId.get(edge.to)!;
    const backward = ordered.get(edge.to)! <= ordered.get(edge.from)!;
    let path: string, labelX: number, labelY: number;
    if (backward) {
      const lane=Math.max(20,Math.min(from.y,to.y)-35);
      path=`M ${from.x+NODE_WIDTH/2} ${from.y} C ${from.x+NODE_WIDTH/2} ${lane}, ${to.x+NODE_WIDTH/2} ${lane}, ${to.x+NODE_WIDTH/2} ${to.y}`;
      if (from.step.id === to.step.id) path=`M ${from.x+NODE_WIDTH-30} ${from.y} C ${from.x+NODE_WIDTH+75} ${from.y-70}, ${from.x+NODE_WIDTH+75} ${from.y+70}, ${from.x+NODE_WIDTH} ${from.y+50}`;
      labelX=(from.x+to.x+NODE_WIDTH)/2; labelY=lane-5;
    } else {
      const startX=from.x+NODE_WIDTH,startY=from.y+NODE_HEIGHT/2,endX=to.x,endY=to.y+NODE_HEIGHT/2;
      path=`M ${startX} ${startY} C ${startX+45} ${startY}, ${endX-45} ${endY}, ${endX} ${endY}`;
      labelX=(startX+endX)/2;labelY=(startY+endY)/2-10;
    }
    return {...edge,path,labelX,labelY,backward};
  });
  return { nodes, connections, width:Math.max(760,...nodes.map(n => n.x+NODE_WIDTH+100)), height:Math.max(430,...nodes.map(n => n.y+NODE_HEIGHT+80)) };
}
export function titleLines(title: string): string[] {
  const words=title.split(/\s+/),lines:string[]=[];let current='';
  for(const word of words) { if((current+' '+word).trim().length>31 && current) { lines.push(current);current=word; } else current=(current+' '+word).trim(); }
  if(current) lines.push(current);
  return lines.length>3 ? [...lines.slice(0,2),lines[2].slice(0,28)+'…'] : lines;
}
