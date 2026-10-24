<script lang="ts">
  import { onMount } from 'svelte';
  let { edges }: {edges: {from:string;to:string;label?:string}[]} = $props();
  let svg: SVGSVGElement;
  let width = $state(1), height = $state(1);
  let paths = $state<{d:string;x:number;y:number;label?:string}[]>([]);
  onMount(() => {
    const tree=svg.parentElement!;
    let frame=0;
    function draw() {
      const r=tree.getBoundingClientRect();if(!r.width || !r.height)return;
      width=r.width;height=r.height;
      const box=(id:string)=>{const el=tree.querySelector<HTMLElement>(`[data-map-node="${id}"]`);if(!el)return;const b=el.getBoundingClientRect();return {x:b.left-r.left,y:b.top-r.top,w:b.width,h:b.height};};
      paths=edges.flatMap(edge=>{
        const a=box(edge.from),b=box(edge.to);if(!a || !b)return [];
        const sameRow=Math.abs(a.y-b.y)<2;
        const stacked=tree.clientWidth<540;
        const start=a.x+a.w/2,end=b.x+b.w/2;
        if(sameRow)return [{d:`M${a.x+a.w},${a.y+a.h/2}H${b.x}`,x:(a.x+a.w+b.x)/2,y:a.y+a.h/2-9,label:edge.label}];
        if(stacked && edge.from!== 'usable-access' && tree.dataset.mapKind==='overview')return [{d:`M${start},${a.y+a.h}V${b.y}`,x:start+23,y:(a.y+a.h+b.y)/2+4,label:edge.label}];
        if(stacked)return [{d:`M${start},${a.y+a.h}V${a.y+a.h+14}H8V${b.y+b.h/2}H${b.x}`,x:b.x+16,y:b.y-9,label:edge.label}];
        const mid=a.y+a.h+22;
        return [{d:`M${start},${a.y+a.h}V${mid}H${end}V${b.y}`,x:end+16,y:b.y-9,label:edge.label}];
      });
    }
    const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);};
    const observer=new ResizeObserver(schedule);observer.observe(tree);
    tree.querySelectorAll('[data-map-node]').forEach(el=>observer.observe(el));
    window.addEventListener('resize',schedule);schedule();
    return ()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',schedule);};
  });
</script>

<svg class="map-lines" bind:this={svg} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
  {#each paths as path}<path d={path.d}/>{#if path.label}<text x={path.x} y={path.y} text-anchor="middle">{path.label}</text>{/if}{/each}
</svg>

<style>
  .map-lines { position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible; }
  path { fill:none;stroke:var(--line-strong);stroke-width:1.3; }
  text { fill:var(--cyan-soft);font:11px var(--mono); }
</style>
