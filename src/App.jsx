import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C={
  navy:"#0a1628",navyM:"#1b2b48",navyL:"#2d4169",navyXL:"#3d5480",
  gold:"#c5a059",goldL:"#ffdea5",goldD:"#e9c176",goldXL:"#f5d78e",
  white:"#ffffff",cream:"#f8f7f4",surf:"#f0ede8",surfD:"#e8e4de",
  bd:"rgba(197,198,206,0.3)",bdD:"rgba(197,198,206,0.5)",
  mute:"#6b7280",dark:"#374151",ink:"#111827",
  grn:"#166534",grnB:"#dcfce7",grnD:"#86efac",grnL:"#15803d",
  amb:"#92400e",ambB:"#fef3c7",ambD:"#fcd34d",
  red:"#991b1b",redB:"#fee2e2",redD:"#fca5a5",redL:"#dc2626",
  blu:"#1e40af",bluB:"#dbeafe",bluD:"#93c5fd",
  pur:"#5b21b6",purB:"#ede9fe",
  teal:"#0f766e",tealB:"#ccfbf1",
  PF:"'Playfair Display',Georgia,serif",
  IN:"'IBM Plex Sans',system-ui,sans-serif",
  MN:"'IBM Plex Mono',monospace",
};

// ─── DATE ─────────────────────────────────────────────────────────────────────
const NOW=new Date();
const DL=NOW.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
const DS=NOW.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase();
const REF="VIC-"+NOW.getFullYear()+"-"+String(Math.floor(Math.random()*900)+100);
const HOUR=NOW.getHours();

// ─── GCC/MENA GEOSPATIAL DATA (simplified SVG paths) ─────────────────────────
const GEO_COUNTRIES = [
  // Each: id, name, flag, path (simplified SVG), cx/cy (label center), risk color
  {id:"Saudi Arabia",flag:"🇸🇦",risk:"moderate",col:"#c5a059",
   path:"M 280 200 L 340 190 L 380 210 L 390 250 L 370 290 L 340 310 L 300 300 L 270 270 L 260 240 Z",cx:320,cy:250},
  {id:"UAE",flag:"🇦🇪",risk:"low",col:"#86efac",
   path:"M 390 250 L 420 240 L 440 255 L 435 270 L 410 275 L 395 265 Z",cx:415,cy:258},
  {id:"Qatar",flag:"🇶🇦",risk:"low",col:"#86efac",
   path:"M 370 235 L 385 228 L 390 245 L 380 250 L 370 245 Z",cx:380,cy:239},
  {id:"Bahrain",flag:"🇧🇭",risk:"low",col:"#86efac",
   path:"M 362 238 L 368 234 L 370 242 L 364 244 Z",cx:366,cy:239},
  {id:"Kuwait",flag:"🇰🇼",risk:"low",col:"#86efac",
   path:"M 330 200 L 345 195 L 350 210 L 340 215 L 328 210 Z",cx:339,cy:205},
  {id:"Oman",flag:"🇴🇲",risk:"low",col:"#86efac",
   path:"M 390 260 L 440 250 L 460 280 L 450 320 L 420 350 L 400 340 L 395 300 L 388 275 Z",cx:425,cy:300},
  {id:"Yemen",flag:"🇾🇪",risk:"critical",col:"#fca5a5",
   path:"M 270 270 L 300 300 L 340 310 L 360 330 L 350 360 L 310 370 L 270 350 L 250 310 L 255 285 Z",cx:305,cy:335},
  {id:"Jordan",flag:"🇯🇴",risk:"moderate",col:"#fcd34d",
   path:"M 240 160 L 270 155 L 280 175 L 265 190 L 240 185 Z",cx:260,cy:172},
  {id:"Iraq",flag:"🇮🇶",risk:"high",col:"#fca5a5",
   path:"M 270 140 L 320 130 L 340 160 L 335 190 L 310 200 L 280 195 L 265 175 Z",cx:305,cy:165},
  {id:"Iran",flag:"🇮🇷",risk:"high",col:"#fca5a5",
   path:"M 340 120 L 410 110 L 440 130 L 445 160 L 420 190 L 390 200 L 360 185 L 340 160 Z",cx:393,cy:155},
  {id:"Syria",flag:"🇸🇾",risk:"critical",col:"#fca5a5",
   path:"M 240 135 L 270 130 L 280 150 L 265 165 L 240 160 Z",cx:260,cy:148},
  {id:"Egypt",flag:"🇪🇬",risk:"moderate",col:"#fcd34d",
   path:"M 160 160 L 230 155 L 240 185 L 230 220 L 190 230 L 160 210 Z",cx:198,cy:192},
  {id:"Lebanon",flag:"🇱🇧",risk:"high",col:"#fca5a5",
   path:"M 233 148 L 242 145 L 245 158 L 235 160 Z",cx:239,cy:153},
  {id:"Turkey",flag:"🇹🇷",risk:"moderate",col:"#fcd34d",
   path:"M 200 100 L 300 90 L 320 115 L 295 130 L 240 132 L 200 120 Z",cx:260,cy:112},
];

const RISK_MAP={critical:C.red,high:"#dc2626",moderate:C.amb,low:C.grn};

// ─── SECTORS ──────────────────────────────────────────────────────────────────
const SECTORS=[
  {id:"all",l:"All",icon:"apps",col:C.navyM,bg:"#e8eef8"},
  {id:"politics",l:"Politics",icon:"gavel",col:"#374765",bg:"#e8eef8"},
  {id:"security",l:"Security",icon:"security",col:C.red,bg:C.redB},
  {id:"economy",l:"Economy",icon:"trending_up",col:C.grn,bg:C.grnB},
  {id:"energy",l:"Energy",icon:"bolt",col:C.blu,bg:C.bluB},
  {id:"diplomacy",l:"Diplomacy",icon:"public",col:C.amb,bg:C.ambB},
  {id:"military",l:"Military",icon:"shield",col:"#1e3a5f",bg:"#e0f2fe"},
  {id:"technology",l:"Technology",icon:"memory",col:C.teal,bg:C.tealB},
  {id:"humanitarian",l:"Humanitarian",icon:"favorite",col:"#be123c",bg:"#ffe4e6"},
  {id:"trade",l:"Trade",icon:"storefront",col:"#7c2d12",bg:"#ffedd5"},
  {id:"society",l:"Society",icon:"groups",col:C.pur,bg:C.purB},
];

const COUNTRIES=[
  {id:"Saudi Arabia",flag:"🇸🇦",r:"GCC"},{id:"UAE",flag:"🇦🇪",r:"GCC"},
  {id:"Qatar",flag:"🇶🇦",r:"GCC"},{id:"Kuwait",flag:"🇰🇼",r:"GCC"},
  {id:"Bahrain",flag:"🇧🇭",r:"GCC"},{id:"Oman",flag:"🇴🇲",r:"GCC"},
  {id:"Yemen",flag:"🇾🇪",r:"GCC"},{id:"Jordan",flag:"🇯🇴",r:"Levant"},
  {id:"Iraq",flag:"🇮🇶",r:"Levant"},{id:"Syria",flag:"🇸🇾",r:"Levant"},
  {id:"Lebanon",flag:"🇱🇧",r:"Levant"},{id:"Egypt",flag:"🇪🇬",r:"N.Africa"},
  {id:"Libya",flag:"🇱🇾",r:"N.Africa"},{id:"Sudan",flag:"🇸🇩",r:"N.Africa"},
  {id:"Iran",flag:"🇮🇷",r:"Near East"},{id:"Turkey",flag:"🇹🇷",r:"Near East"},
  {id:"Pakistan",flag:"🇵🇰",r:"Near East"},
];

const SRCS=["Al Jazeera","BBC Middle East","Arab News","Saudi Gazette","Gulf News",
  "Asharq Al-Awsat","France 24","The National UAE","Reuters","AFP","Middle East Eye","Al Arabiya"];

// ─── API ──────────────────────────────────────────────────────────────────────
async function ai(sys,usr,max=1200,attempt=0){
  const ctrl=new AbortController();
  const tmr=setTimeout(()=>ctrl.abort(),58000);
  try{
    const r=await fetch("/api/claude",{
      method:"POST",signal:ctrl.signal,
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({system:sys,user:usr,max_tokens:max}),
    });
    clearTimeout(tmr);
    if(!r.ok){const e=await r.text();throw new Error("API "+r.status+": "+e.slice(0,80));}
    const d=await r.json();
    return d.text||"";
  }catch(e){clearTimeout(tmr);if(e.name==="AbortError")throw new Error("Request timed out — please retry");if(attempt<1)return ai(sys,usr,max,1);throw e;}
}

function pj(raw){
  if(!raw)return null;
  const s=raw.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim();
  try{return JSON.parse(s);}catch{}
  const oi=s.indexOf("{"),oa=s.indexOf("[");
  const[start,op,cl]=oi!==-1&&(oa===-1||oi<oa)?[oi,"{","}"]:oa!==-1?[oa,"[","]"]:[-1,"",""];
  if(start===-1)return null;
  let depth=0,inStr=false,esc=false;
  for(let i=start;i<s.length;i++){
    const c=s[i];
    if(esc){esc=false;continue;}if(c==="\\"){esc=true;continue;}
    if(c==='"'){inStr=!inStr;continue;}if(inStr)continue;
    if(c===op)depth++;else if(c===cl){depth--;if(depth===0){try{return JSON.parse(s.slice(start,i+1));}catch{return null;}}}
  }
  return null;
}

// ─── PDF EXPORT ───────────────────────────────────────────────────────────────
function exportPDF(title,content,ref){
  const safe=(s)=>String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${safe(title)}</title>
<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Georgia,serif;color:#111827;background:#fff;padding:40px 52px;max-width:820px;margin:0 auto;font-size:13px;line-height:22px;}.top-bar{background:#0a1628;color:#ffdea5;font-family:monospace;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding:8px 20px;text-align:center;}.header{border:2px solid #0a1628;border-top:none;padding:20px 24px 16px;margin-bottom:28px;}.gold-line{height:3px;background:#c5a059;margin-bottom:14px;}.doc-title{font-size:26px;font-weight:700;color:#0a1628;line-height:1.2;margin-bottom:8px;}.doc-meta{font-family:monospace;font-size:11px;color:#6b7280;margin-bottom:4px;}.stamp{display:inline-block;border:2px solid #c5a059;color:#c5a059;font-family:monospace;font-size:10px;font-weight:700;letter-spacing:.1em;padding:3px 12px;margin-top:10px;}.content{font-size:13px;line-height:23px;color:#1f2937;white-space:pre-wrap;word-break:break-word;}.footer{margin-top:52px;padding-top:14px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:10px;color:#9ca3af;font-family:monospace;}.no-print{background:#1e40af;color:#fff;padding:10px 16px;font-family:sans-serif;font-size:13px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;border-radius:4px;}@media print{.no-print{display:none;}body{padding:20px 30px;}}</style>
</head><body>
<div class="no-print"><span>📄 Vision Intelligence Commons 2030</span><button onclick="window.print()" style="background:#fff;color:#1e40af;border:none;padding:6px 16px;border-radius:4px;font-weight:700;cursor:pointer;">🖨 Print / Save as PDF</button></div>
<div class="top-bar">OFFICIAL — SENSITIVE // VISION INTELLIGENCE COMMONS 2030</div>
<div class="header"><div class="gold-line"></div><div class="doc-title">${safe(title)}</div><div class="doc-meta">Date: ${DL}</div><div class="doc-meta">Ref: ${safe(ref||REF)}</div><div class="doc-meta">Generated by Vision Intelligence Commons 2030 · Sajeeth Mazeez</div><div class="stamp">FOR AUTHORISED RECIPIENTS ONLY</div></div>
<div class="content">${safe(content)}</div>
<div class="footer"><span>Vision Intelligence Commons 2030 · Embassy of Sri Lanka, Riyadh · PMO &amp; Policy Data Analytics</span><span>${DS}</span></div>
</body></html>`;
  const blob=new Blob([html],{type:"text/html;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=title.replace(/[^a-zA-Z0-9\s-]/g,"").trim().replace(/\s+/g,"_").slice(0,60)+"_"+DS.replace(/\s/g,"")+".html";
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}

// ─── HOOKS ────────────────────────────────────────────────────────────────────
function useClock(){
  const[t,setT]=useState("--:--:--");
  useEffect(()=>{
    const tick=()=>{const n=new Date(),a=new Date(n.getTime()+n.getTimezoneOffset()*60000+3*3600000);setT([a.getHours(),a.getMinutes(),a.getSeconds()].map(x=>String(x).padStart(2,"0")).join(":"));};
    tick();const iv=setInterval(tick,1000);return()=>clearInterval(iv);
  },[]);
  return t;
}

function useAnalysis(){
  const[ana,setAna]=useState({});
  const[busy,setBusy]=useState({});
  const[exp,setExp]=useState(null);
  const analyse=useCallback(async(a)=>{
    if(ana[a.id]){setExp(a.id);return;}
    setExp(a.id);setBusy(b=>({...b,[a.id]:true}));
    try{
      const raw=await ai(
        `GCC intelligence analyst. Return ONLY valid JSON (no markdown):\n{"riskSignals":["s","s","s"],"opportunities":["s","s"],"note":"2 sentences.","watch":["s","s"],"priority":"ROUTINE|MONITOR|URGENT"}`,
        `Headline:${a.title}\nSummary:${a.summary}\nCountry:${a.country}\nSector:${a.sector||a.cat}`,700);
      setAna(prev=>({...prev,[a.id]:pj(raw)||{err:"Parse failed."}}));
    }catch(e){setAna(prev=>({...prev,[a.id]:{err:e.message}}));}
    setBusy(b=>({...b,[a.id]:false}));
  },[ana]);
  return{ana,busy,exp,setExp,analyse};
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
const card={background:C.white,border:`1px solid ${C.bd}`,borderRadius:8,boxShadow:"0 2px 12px rgba(10,22,40,0.07)"};
const goldC={...card,borderTop:`3px solid ${C.gold}`};
const navyC={background:C.navy,border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,borderTop:`3px solid ${C.gold}`};
const lbl={fontFamily:C.IN,fontSize:11,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase"};

function I({n,s=18,c,sx={}}){
  return <span className="material-symbols-outlined" style={{fontSize:s,color:c||"inherit",lineHeight:1,verticalAlign:"middle",...sx}}>{n}</span>;
}
function Loader({msg="Generating intelligence…"}){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"52px 0",gap:14}}>
      <svg width="36" height="36" viewBox="0 0 36 36" style={{animation:"sp 1.1s linear infinite"}}>
        <circle cx="18" cy="18" r="13" fill="none" stroke={C.gold} strokeWidth="2.5" strokeDasharray="58 20" strokeLinecap="round"/>
      </svg>
      <span style={{...lbl,color:C.mute,fontSize:10}}>{msg}</span>
    </div>
  );
}
function Err({msg,retry}){
  return(
    <div style={{...card,padding:"14px 18px",display:"flex",gap:10,borderLeft:`3px solid ${C.red}`,marginBottom:14}}>
      <I n="error_outline" c={C.red} s={18} sx={{flexShrink:0,marginTop:1}}/>
      <div>
        <p style={{...lbl,color:C.red,marginBottom:4,fontSize:10}}>Error</p>
        <p style={{fontFamily:C.IN,fontSize:13,color:C.dark,lineHeight:"19px"}}>{msg}</p>
        {retry&&<button onClick={retry} style={{marginTop:8,...lbl,fontSize:10,color:C.navy,background:C.surf,border:`1px solid ${C.bd}`,borderRadius:4,padding:"4px 12px",cursor:"pointer"}}>Retry</button>}
      </div>
    </div>
  );
}
function RB({level}){
  const M={LOW:{l:"Stable",c:C.grn,bg:C.grnB,b:C.grnD},MEDIUM:{l:"Caution",c:C.amb,bg:C.ambB,b:C.ambD},HIGH:{l:"Critical",c:C.red,bg:C.redB,b:C.redD},CRITICAL:{l:"Critical",c:"#7f1d1d",bg:C.redB,b:C.redD}};
  const r=M[level]||M.LOW;
  return <span style={{...lbl,fontSize:10,color:r.c,background:r.bg,border:`1px solid ${r.b}`,padding:"2px 7px",borderRadius:2}}>{r.l}</span>;
}
function SB({id}){
  const s=SECTORS.find(x=>x.id===id)||SECTORS[1];
  return <span style={{...lbl,fontSize:10,color:s.col,background:s.bg,border:`1px solid ${s.col}20`,padding:"2px 7px",borderRadius:2}}>{s.l}</span>;
}
function Card({children,gold,navy,sx={}}){
  return <div style={{...(navy?navyC:gold?goldC:card),...sx}}>{children}</div>;
}
function Btn({onClick,ld,icon,label,primary,small}){
  return(
    <button onClick={onClick} disabled={ld} style={{display:"flex",alignItems:"center",gap:6,padding:small?"6px 12px":"8px 16px",borderRadius:6,border:primary?"none":`1px solid ${C.bd}`,background:primary?C.navyM:C.white,color:primary?C.white:C.dark,fontFamily:C.IN,fontSize:small?11:12,fontWeight:600,cursor:ld?"not-allowed":"pointer",opacity:ld?0.65:1,transition:"all 0.15s",whiteSpace:"nowrap"}}>
      <I n={ld?"autorenew":icon} s={small?13:14} c={primary?C.white:C.dark} sx={{animation:ld?"sp 1.4s linear infinite":"none"}}/>
      {ld?"Working…":label}
    </button>
  );
}
function PH({label,title,sub,action}){
  return(
    <div style={{marginBottom:22}}>
      {label&&<p style={{...lbl,color:C.mute,fontSize:10,marginBottom:5,display:"flex",alignItems:"center",gap:4}}><I n="flag" s={10}/>{label}</p>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
        <div>
          <h1 style={{fontFamily:C.PF,fontSize:30,fontWeight:700,color:C.navy,lineHeight:1.15,letterSpacing:"-0.01em"}}>{title}</h1>
          {sub&&<p style={{fontFamily:C.IN,fontSize:13,color:C.dark,lineHeight:"20px",marginTop:4,maxWidth:600}}>{sub}</p>}
        </div>
        {action&&<div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>{action}</div>}
      </div>
    </div>
  );
}
function FR({label,items,active,set}){
  return(
    <div style={{display:"flex",flexWrap:"wrap",gap:5,alignItems:"center"}}>
      <span style={{...lbl,color:C.mute,fontSize:9,minWidth:52}}>{label}</span>
      {[{v:null,l:"All"},...items].map(({v,l})=>(
        <button key={String(v)} onClick={()=>set(active===v?null:v)} style={{padding:"3px 10px",borderRadius:999,border:`1px solid ${active===v?C.navy:C.bd}`,background:active===v?C.navy:"transparent",color:active===v?C.white:C.dark,fontFamily:C.IN,fontSize:11,fontWeight:500,cursor:"pointer",transition:"all 0.1s"}}>{l}</button>
      ))}
    </div>
  );
}

// ─── GEOSPATIAL MAP ───────────────────────────────────────────────────────────
function GeoMap({onCountryClick,riskData={}}){
  const[hovered,setHovered]=useState(null);
  const[tooltip,setTooltip]=useState(null);
  return(
    <div style={{position:"relative",background:`linear-gradient(135deg,${C.navy} 0%,${C.navyM} 50%,${C.navyL} 100%)`,borderRadius:8,overflow:"hidden",minHeight:320}}>
      {/* Ocean texture */}
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 30% 70%, rgba(45,65,105,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(29,43,72,0.6) 0%, transparent 50%)",pointerEvents:"none"}}/>

      {/* Title overlay */}
      <div style={{position:"absolute",top:12,left:14,zIndex:10}}>
        <p style={{...lbl,color:C.goldL,fontSize:9}}>Geospatial Intelligence Map</p>
        <p style={{fontFamily:C.IN,fontSize:10,color:"rgba(255,255,255,0.45)",marginTop:2}}>GCC & MENA Region · Click country for intel</p>
      </div>

      {/* Legend */}
      <div style={{position:"absolute",top:12,right:12,zIndex:10,display:"flex",flexDirection:"column",gap:4}}>
        {[{c:C.red,l:"Critical"},{c:"#dc2626",l:"High"},{c:C.amb,l:"Moderate"},{c:C.grn,l:"Low"}].map(({c,l})=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:c}}/>
            <span style={{fontFamily:C.IN,fontSize:9,color:"rgba(255,255,255,0.6)"}}>{l}</span>
          </div>
        ))}
      </div>

      <svg viewBox="130 80 340 300" width="100%" style={{display:"block"}}>
        {/* Grid lines */}
        {[100,140,180,220,260,300,340,380].map(x=><line key={x} x1={x} y1="80" x2={x} y2="380" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>)}
        {[100,140,180,220,260,300,340].map(y=><line key={y} x1="130" y1={y} x2="470" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>)}

        {GEO_COUNTRIES.map(geo=>{
          const riskLevel=riskData[geo.id]||geo.risk;
          const baseCol=RISK_MAP[riskLevel]||C.amb;
          const isHov=hovered===geo.id;
          return(
            <g key={geo.id} style={{cursor:"pointer"}} onClick={()=>onCountryClick&&onCountryClick(geo.id)}
              onMouseEnter={(e)=>{setHovered(geo.id);setTooltip({x:geo.cx,y:geo.cy,name:geo.id,flag:geo.flag,risk:riskLevel});}}
              onMouseLeave={()=>{setHovered(null);setTooltip(null);}}>
              <path d={geo.path} fill={isHov?baseCol:baseCol+"80"} stroke={isHov?baseCol:"rgba(255,255,255,0.2)"}
                strokeWidth={isHov?1.5:0.8} style={{transition:"all 0.2s",filter:isHov?"drop-shadow(0 0 6px "+baseCol+"80)":""}}/>
              {/* Country label */}
              <text x={geo.cx} y={geo.cy} textAnchor="middle" style={{fontSize:8,fill:"rgba(255,255,255,0.85)",fontFamily:"system-ui",fontWeight:600,pointerEvents:"none",textShadow:"0 1px 2px rgba(0,0,0,0.8)"}}>{geo.flag}</text>
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip&&(
          <g>
            <rect x={tooltip.x-35} y={tooltip.y+8} width={70} height={26} rx={3} fill={C.navy} stroke={C.gold} strokeWidth={0.8} opacity={0.95}/>
            <text x={tooltip.x} y={tooltip.y+18} textAnchor="middle" style={{fontSize:8,fill:C.goldL,fontFamily:"system-ui",fontWeight:700,pointerEvents:"none"}}>{tooltip.name}</text>
            <text x={tooltip.x} y={tooltip.y+29} textAnchor="middle" style={{fontSize:7,fill:"rgba(255,255,255,0.6)",fontFamily:"system-ui",pointerEvents:"none"}}>{tooltip.risk.toUpperCase()}</text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── KNOWLEDGE GRAPH ──────────────────────────────────────────────────────────
function KnowledgeGraph({nodes=[],edges=[]}){
  const svgRef=useRef(null);
  const[positions,setPositions]=useState({});
  const[dragging,setDragging]=useState(null);
  const[hov,setHov]=useState(null);

  // Auto-layout nodes in a circle
  useEffect(()=>{
    if(nodes.length===0)return;
    const cx=300,cy=200,r=140;
    const pos={};
    nodes.forEach((n,i)=>{
      const angle=(i/nodes.length)*Math.PI*2-Math.PI/2;
      pos[n.id]={x:cx+r*Math.cos(angle),y:cy+r*Math.sin(angle)};
    });
    // Central node closer in
    if(nodes[0])pos[nodes[0].id]={x:cx,y:cy};
    setPositions(pos);
  },[nodes]);

  const TIER_COL={"Tier 1":C.red,"Tier 2":C.amb,"Tier 3":C.blu};
  const STANCE_COL={cooperative:C.grn,neutral:C.amb,adversarial:C.red};

  if(nodes.length===0)return(
    <div style={{...card,padding:32,textAlign:"center",minHeight:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div>
        <I n="hub" c={C.mute} s={32} sx={{display:"block",margin:"0 auto 8px"}}/>
        <p style={{fontFamily:C.IN,fontSize:12,color:C.mute}}>Generate stakeholder data to view knowledge graph</p>
      </div>
    </div>
  );

  return(
    <div style={{...card,overflow:"hidden",position:"relative"}}>
      <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <I n="hub" c={C.navy} s={15}/>
          <p style={{fontFamily:C.PF,fontSize:14,fontWeight:600,color:C.navy}}>Stakeholder Knowledge Graph</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          {Object.entries(STANCE_COL).map(([k,v])=>(
            <div key={k} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:v}}/>
              <span style={{fontFamily:C.IN,fontSize:10,color:C.mute}}>{k}</span>
            </div>
          ))}
        </div>
      </div>
      <svg viewBox="0 0 600 400" width="100%" style={{display:"block",background:C.surf}}>
        {/* Edges */}
        {edges.map((e,i)=>{
          const a=positions[e.from],b=positions[e.to];
          if(!a||!b)return null;
          return(
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(27,43,72,0.15)" strokeWidth={1.5} strokeDasharray={e.type==="indirect"?"4,3":""}/>
              {e.label&&<text x={(a.x+b.x)/2} y={(a.y+b.y)/2-4} textAnchor="middle" style={{fontSize:8,fill:C.mute,fontFamily:"system-ui"}}>{e.label}</text>}
            </g>
          );
        })}
        {/* Nodes */}
        {nodes.map(n=>{
          const pos=positions[n.id];
          if(!pos)return null;
          const isHov=hov===n.id;
          const col=STANCE_COL[n.stance]||C.mute;
          const r=n.influence==="Tier 1"?24:n.influence==="Tier 2"?18:14;
          return(
            <g key={n.id} style={{cursor:"pointer"}} onMouseEnter={()=>setHov(n.id)} onMouseLeave={()=>setHov(null)}>
              <circle cx={pos.x} cy={pos.y} r={r+4} fill={col+"15"} stroke="transparent"/>
              <circle cx={pos.x} cy={pos.y} r={r} fill={isHov?col:col+"40"} stroke={col} strokeWidth={isHov?2:1.5} style={{transition:"all 0.2s",filter:isHov?`drop-shadow(0 0 8px ${col}60)`:""}}/>
              <text x={pos.x} y={pos.y+4} textAnchor="middle" style={{fontSize:10,fill:C.ink,fontFamily:"system-ui",fontWeight:700,pointerEvents:"none"}}>{n.short||n.name.split(" ").pop().slice(0,3)}</text>
              {/* Label below */}
              <text x={pos.x} y={pos.y+r+13} textAnchor="middle" style={{fontSize:8,fill:C.dark,fontFamily:"system-ui",fontWeight:500,pointerEvents:"none"}}>{n.name.split(" ").slice(-1)[0]}</text>
              {isHov&&(
                <g>
                  <rect x={pos.x-50} y={pos.y-r-32} width={100} height={26} rx={3} fill={C.navy} stroke={C.gold} strokeWidth={0.8}/>
                  <text x={pos.x} y={pos.y-r-22} textAnchor="middle" style={{fontSize:8,fill:C.goldL,fontFamily:"system-ui",fontWeight:700}}>{n.name.slice(0,18)}</text>
                  <text x={pos.x} y={pos.y-r-12} textAnchor="middle" style={{fontSize:7,fill:"rgba(255,255,255,0.6)",fontFamily:"system-ui"}}>{n.org?.slice(0,22)}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── ARTICLE CARD ─────────────────────────────────────────────────────────────
function ACard({a,exp,onExpand,ana,busy}){
  const isE=exp===a.id,an=ana[a.id],bz=busy[a.id];
  const sec=SECTORS.find(s=>s.id===(a.sector||a.cat))||SECTORS[1];
  return(
    <div style={{...card,borderLeft:`3px solid ${sec.col}`,overflow:"hidden",transition:"box-shadow 0.15s"}}
      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(10,22,40,0.12)"}
      onMouseLeave={e=>e.currentTarget.style.boxShadow=card.boxShadow}>
      <div onClick={()=>onExpand(a)} style={{padding:"12px 16px",cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,gap:8}}>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
            {a.breaking&&<span style={{...lbl,fontSize:9,color:C.white,background:C.red,padding:"2px 7px",borderRadius:2,animation:"pulse 2s infinite"}}>⚡ BREAKING</span>}
            <span style={{fontFamily:C.IN,fontSize:11,fontWeight:500,background:"#dbeafe",color:"#1e40af",padding:"2px 7px",borderRadius:3}}>{a.src||a.source}</span>
            <SB id={a.sector||a.cat||"politics"}/>
            <span style={{fontFamily:C.IN,fontSize:11,color:C.mute}}>{a.country}</span>
            <RB level={a.risk}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <span style={{fontFamily:C.MN,fontSize:11,color:C.mute}}>{a.time}</span>
            <I n="chevron_right" c={C.mute} s={14} sx={{transition:"transform 0.2s",transform:isE?"rotate(90deg)":"none"}}/>
          </div>
        </div>
        <p style={{fontFamily:C.PF,fontSize:14,fontWeight:600,color:C.navy,lineHeight:"1.4",marginBottom:4}}>{a.title}</p>
        {!isE&&<p style={{fontFamily:C.IN,fontSize:12,color:C.dark,lineHeight:"18px",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{a.summary}</p>}
        {!isE&&<p style={{fontFamily:C.IN,fontSize:11,fontWeight:600,color:C.navyM,marginTop:5,display:"flex",alignItems:"center",gap:4}}><I n="psychology" s={12} c={C.navyM}/>Click for AI intelligence extraction →</p>}
      </div>
      {isE&&(
        <div style={{background:C.surf,borderTop:`1px solid ${C.bd}`,padding:"12px 16px"}}>
          {bz&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0"}}><svg width="16" height="16" viewBox="0 0 36 36" style={{animation:"sp 1.1s linear infinite",flexShrink:0}}><circle cx="18" cy="18" r="13" fill="none" stroke={C.gold} strokeWidth="2.5" strokeDasharray="58 20" strokeLinecap="round"/></svg><span style={{...lbl,color:C.mute,fontSize:9}}>Extracting intelligence…</span></div>}
          {!bz&&an?.err&&<p style={{fontFamily:C.IN,fontSize:12,color:C.red}}>{an.err}</p>}
          {!bz&&an&&!an.err&&(
            <>
              <p style={{fontFamily:C.IN,fontSize:12,color:C.dark,lineHeight:"19px",marginBottom:12}}>{a.summary}</p>
              {an.priority&&<div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:3,marginBottom:9,background:an.priority==="URGENT"?C.redB:an.priority==="MONITOR"?C.ambB:C.grnB,border:`1px solid ${an.priority==="URGENT"?C.redD:an.priority==="MONITOR"?C.ambD:C.grnD}`}}>
                <I n={an.priority==="URGENT"?"priority_high":an.priority==="MONITOR"?"visibility":"check_circle"} s={12} c={an.priority==="URGENT"?C.red:an.priority==="MONITOR"?C.amb:C.grn}/>
                <span style={{...lbl,fontSize:9,color:an.priority==="URGENT"?C.red:an.priority==="MONITOR"?C.amb:C.grn}}>Priority: {an.priority}</span>
              </div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div style={{background:C.redB,border:`1px solid ${C.redD}`,borderRadius:4,padding:"10px 12px"}}>
                  <p style={{...lbl,color:C.red,fontSize:9,marginBottom:6,display:"flex",alignItems:"center",gap:3}}><I n="warning" s={11} c={C.red}/>Risk Signals</p>
                  {(an.riskSignals||[]).map((s,j)=><div key={j} style={{display:"flex",gap:5,marginBottom:4}}><span style={{color:C.red,fontWeight:700,flexShrink:0}}>•</span><p style={{fontFamily:C.IN,fontSize:11,color:C.dark,lineHeight:"16px"}}>{s}</p></div>)}
                </div>
                <div style={{background:C.grnB,border:`1px solid ${C.grnD}`,borderRadius:4,padding:"10px 12px"}}>
                  <p style={{...lbl,color:C.grn,fontSize:9,marginBottom:6,display:"flex",alignItems:"center",gap:3}}><I n="lightbulb" s={11} c={C.grn}/>Opportunities</p>
                  {(an.opportunities||[]).map((o,j)=><div key={j} style={{display:"flex",gap:5,marginBottom:4}}><span style={{color:C.grn,fontWeight:700,flexShrink:0}}>•</span><p style={{fontFamily:C.IN,fontSize:11,color:C.dark,lineHeight:"16px"}}>{o}</p></div>)}
                </div>
              </div>
              <div style={{background:"rgba(27,43,72,0.05)",borderLeft:`2px solid ${C.navyM}`,padding:"8px 12px",borderRadius:2,marginBottom:8}}>
                <p style={{...lbl,color:C.navy,fontSize:9,marginBottom:3}}>Intelligence Assessment</p>
                <p style={{fontFamily:C.IN,fontSize:12,color:C.dark,fontStyle:"italic",lineHeight:"18px"}}>{an.note}</p>
              </div>
              {an.watch?.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{...lbl,color:C.mute,fontSize:9}}>Watch →</span>
                {an.watch.map((w,j)=><span key={j} style={{fontFamily:C.IN,fontSize:11,fontWeight:600,background:C.ambB,color:C.amb,padding:"2px 8px",borderRadius:3,border:`1px solid ${C.ambD}`}}>{w}</span>)}
              </div>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const DB_FB={
  alerts:[
    {sev:"high",type:"HIGH PRIORITY ALERT",headline:"Houthi drone intensification targeting Red Sea LNG transit",body:"Multiple UAV launches in southern Red Sea targeting commercial shipping. US Navy repositioned escorts to Bab-el-Mandeb. LNG operators activating Cape of Good Hope contingency routing."},
    {sev:"med",type:"SECURITY ADVISORY",headline:"GCC foreign ministers convene emergency session on regional energy security",body:"All six GCC member states convened in Riyadh. Energy security and border integrity top the two-day summit agenda."},
  ],
  kpis:[
    {label:"Active Alerts",value:"14",change:"+2",up:false,icon:"warning",trend:[8,10,9,12,11,14]},
    {label:"Risk Events",value:"7",change:"+1",up:false,icon:"security",trend:[3,4,5,4,6,7]},
    {label:"GCC Stability",value:"74%",change:"-1%",up:false,icon:"shield",trend:[80,79,77,76,75,74]},
    {label:"Monitored Actors",value:"52",change:"+4",up:true,icon:"groups",trend:[40,43,45,47,49,52]},
  ],
  feed:[
    {src:"Arab News",time:"08:15 AST",headline:"Saudi Aramco secures $8.2bn infrastructure deal with South Korean consortium",impact:"Strengthens downstream processing capacity and diversifies Asian partner base."},
    {src:"Al Jazeera",time:"09:40 AST",headline:"UAE ADNOC-TotalEnergies joint venture expands offshore gas fields",impact:"Increases UAE gas production capacity by 18% over five years."},
    {src:"Reuters",time:"11:05 AST",headline:"Qatar LNG Phase II — $18.7bn deal awarded to TotalEnergies-Shell",impact:"Positions Qatar to capture growing European LNG demand."},
  ],
  countries:[
    {name:"Saudi Arabia",flag:"🇸🇦",stat:"Vision 2030 Status",val:"ON TRACK",body:"PIF confirms $12bn domestic AI fund. NEOM Phase II at 60% completion.",risk:"low"},
    {name:"Bahrain",flag:"🇧🇭",stat:"Financial Sentiment",val:"STABLE / BULLISH",body:"Digital banking licenses expanding. FinTech Bay reports 23% quarterly growth.",risk:"low"},
    {name:"Oman",flag:"🇴🇲",stat:"Energy Transition",val:"ACCELERATED",body:"800MW solar tender complete. Duqm SEZ attracts $2.1bn new FDI.",risk:"low"},
    {name:"Yemen",flag:"🇾🇪",stat:"Security Risk",val:"HIGH VIGILANCE",body:"Naval corridor surveillance heightened. Aid restricted in northern zones.",risk:"high"},
  ],
  riskChart:[
    {week:"W1",SA:45,UAE:20,Yemen:88,Oman:22},
    {week:"W2",SA:48,UAE:22,Yemen:91,Oman:24},
    {week:"W3",SA:44,UAE:19,Yemen:85,Oman:21},
    {week:"W4",SA:52,UAE:25,Yemen:92,Oman:23},
    {week:"W5",SA:49,UAE:21,Yemen:89,Oman:20},
    {week:"W6",SA:55,UAE:24,Yemen:94,Oman:25},
  ],
  sectorChart:[
    {sector:"Security",score:88},{sector:"Energy",score:72},{sector:"Diplomacy",score:65},
    {sector:"Economy",score:58},{sector:"Politics",score:70},{sector:"Military",score:82},
  ],
};

function Dashboard({go}){
  const[d,setD]=useState(DB_FB);
  const[ld,setLd]=useState(false);
  const[er,setEr]=useState(null);
  const[selCty,setSelCty]=useState(null);
  const loaded=useRef(false);

  const load=useCallback(async()=>{
    setLd(true);setEr(null);
    try{
      const raw=await ai(
        `GCC intelligence analyst. Today is ${DL}. Respond with ONLY valid JSON. Start with { end with }.`,
        `Generate a GCC intelligence dashboard JSON with: alerts (2: {sev:"high"|"med",type,headline,body}), kpis (4: {label,value,change,up:boolean,icon,trend:[6 numbers]}), feed (3: {src,time,headline,impact}), countries (4 for Saudi Arabia🇸🇦 Bahrain🇧🇭 Oman🇴🇲 Yemen🇾🇪: {name,flag,stat,val,body,risk:"low"|"high"}), riskChart (6 weeks: {week,SA,UAE,Yemen,Oman} 0-100), sectorChart (6: {sector,score 0-100}). Specific real details. Today: ${DL}.`,2000);
      const v=pj(raw)||{};
      setD({
        alerts:Array.isArray(v.alerts)&&v.alerts.length?v.alerts:DB_FB.alerts,
        kpis:Array.isArray(v.kpis)&&v.kpis.length?v.kpis:DB_FB.kpis,
        feed:Array.isArray(v.feed)&&v.feed.length?v.feed:DB_FB.feed,
        countries:Array.isArray(v.countries)&&v.countries.length?v.countries:DB_FB.countries,
        riskChart:Array.isArray(v.riskChart)&&v.riskChart.length?v.riskChart:DB_FB.riskChart,
        sectorChart:Array.isArray(v.sectorChart)&&v.sectorChart.length?v.sectorChart:DB_FB.sectorChart,
      });
    }catch(e){setEr(e.message);}
    setLd(false);
  },[]);

  useEffect(()=>{if(!loaded.current){loaded.current=true;load();}},[load]);

  const riskColors={SA:C.gold,UAE:C.grn,Yemen:C.red,Oman:C.blu};

  return(
    <div>
      <PH label={`Regional Monitor · ${DS}`} title="Intelligence Dashboard"
        sub="Real-time strategic monitoring across GCC and MENA regions."
        action={<>
          <Btn onClick={load} ld={ld} icon="refresh" label="Refresh" primary/>
          <button onClick={()=>exportPDF("Intelligence Dashboard",JSON.stringify(d,null,2),REF)} style={{display:"flex",alignItems:"center",gap:5,padding:"8px 14px",borderRadius:6,border:`1px solid ${C.bd}`,background:C.white,color:C.dark,fontFamily:C.IN,fontSize:12,fontWeight:600,cursor:"pointer"}}><I n="picture_as_pdf" s={14} c={C.gold}/>PDF</button>
        </>}/>
      {er&&<Err msg={er+" (showing last data)"}/>}

      {/* Alerts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
        {d.alerts.map((a,i)=>(
          <div key={i} style={{...card,padding:"14px 18px",display:"flex",gap:12,borderLeft:`3px solid ${a.sev==="high"?C.red:C.gold}`}}>
            <I n={a.sev==="high"?"warning":"security"} c={a.sev==="high"?C.red:C.gold} s={20} sx={{flexShrink:0,marginTop:2}}/>
            <div><p style={{...lbl,color:a.sev==="high"?C.red:C.amb,fontSize:9,marginBottom:4}}>{a.type}</p>
            <p style={{fontFamily:C.PF,fontSize:14,fontWeight:600,color:C.navy,lineHeight:"1.35",marginBottom:4}}>{a.headline}</p>
            <p style={{fontFamily:C.IN,fontSize:12,color:C.dark,lineHeight:"18px"}}>{a.body}</p></div>
          </div>
        ))}
      </div>

      {/* KPIs with sparklines */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {d.kpis.map((k,i)=>(
          <div key={i} style={{...goldC,padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <I n={k.icon||"bar_chart"} c={C.mute} s={17}/>
              <span style={{...lbl,fontSize:9,color:k.up?C.grn:C.red,background:k.up?C.grnB:C.redB,padding:"2px 6px",borderRadius:2}}>{k.change}</span>
            </div>
            <p style={{fontFamily:C.PF,fontSize:26,fontWeight:700,color:C.navy,lineHeight:1,marginBottom:4}}>{k.value}</p>
            <p style={{...lbl,color:C.mute,fontSize:9,marginBottom:8}}>{k.label}</p>
            {k.trend&&<ResponsiveContainer width="100%" height={32}>
              <LineChart data={k.trend.map((v,j)=>({v,j}))}>
                <Line type="monotone" dataKey="v" stroke={k.up?C.grn:C.red} strokeWidth={1.5} dot={false}/>
              </LineChart>
            </ResponsiveContainer>}
          </div>
        ))}
      </div>

      {/* Main grid: map + charts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        {/* Geo Map */}
        <GeoMap onCountryClick={(id)=>{setSelCty(id);go("country");}} riskData={{Yemen:"critical",Iran:"high",Iraq:"high",Syria:"critical",Lebanon:"high"}}/>

        {/* Risk trend chart */}
        <Card gold sx={{padding:"14px 18px"}}>
          <p style={{fontFamily:C.PF,fontSize:14,fontWeight:600,color:C.navy,marginBottom:14}}>6-Week Risk Trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={d.riskChart}>
              <XAxis dataKey="week" tick={{fontSize:10,fontFamily:C.IN}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fontFamily:C.IN}} axisLine={false} tickLine={false} domain={[0,100]}/>
              <Tooltip contentStyle={{fontFamily:C.IN,fontSize:11,borderRadius:6,border:`1px solid ${C.bd}`,boxShadow:"0 4px 12px rgba(0,0,0,0.1)"}}/>
              {Object.entries(riskColors).map(([k,col])=>(
                <Line key={k} type="monotone" dataKey={k} stroke={col} strokeWidth={2} dot={false} name={k}/>
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
            {Object.entries(riskColors).map(([k,col])=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:12,height:3,background:col,borderRadius:2}}/>
                <span style={{fontFamily:C.IN,fontSize:10,color:C.mute}}>{k}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom grid: countries + sector chart + feed */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 220px 280px",gap:14}}>
        {/* Country cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {d.countries.map((c,i)=>(
            <div key={i} style={{...card,padding:14,borderTop:`2px solid ${c.risk==="high"?C.red:C.goldD}`,cursor:"pointer",transition:"transform 0.2s,box-shadow 0.2s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(10,22,40,0.12)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=card.boxShadow;}}
              onClick={()=>{setSelCty(c.name);go("country");}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>{c.flag}</span><p style={{fontFamily:C.PF,fontSize:13,fontWeight:600,color:C.navy}}>{c.name}</p></div>
                <I n={c.risk==="high"?"security":"trending_up"} c={c.risk==="high"?C.red:C.mute} s={14}/>
              </div>
              <div style={{background:c.risk==="high"?C.redB:C.surf,padding:"4px 8px",borderRadius:3,marginBottom:6}}>
                <p style={{...lbl,color:C.mute,fontSize:8,marginBottom:2}}>{c.stat}</p>
                <p style={{...lbl,fontSize:10,color:c.risk==="high"?C.red:C.navyM}}>{c.val}</p>
              </div>
              <p style={{fontFamily:C.IN,fontSize:11,color:C.dark,lineHeight:"16px"}}>{c.body}</p>
            </div>
          ))}
        </div>

        {/* Sector radar */}
        <Card gold sx={{padding:"12px 14px"}}>
          <p style={{fontFamily:C.PF,fontSize:13,fontWeight:600,color:C.navy,marginBottom:10}}>Sector Risk Scores</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={d.sectorChart} layout="vertical" margin={{left:0,right:8}}>
              <XAxis type="number" domain={[0,100]} tick={{fontSize:9,fontFamily:C.IN}} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="sector" tick={{fontSize:9,fontFamily:C.IN}} axisLine={false} tickLine={false} width={56}/>
              <Tooltip contentStyle={{fontFamily:C.IN,fontSize:11,borderRadius:6,border:`1px solid ${C.bd}`}}/>
              <Bar dataKey="score" radius={[0,3,3,0]}>
                {d.sectorChart.map((e,i)=>(
                  <Cell key={i} fill={e.score>80?C.red:e.score>60?C.amb:C.grn}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Regional Pulse feed */}
        <Card sx={{display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.bd}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <p style={{fontFamily:C.PF,fontSize:13,fontWeight:600,color:C.navy}}>Regional Pulse</p>
            <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:"50%",background:C.grn,animation:"pulse 2s infinite"}}/><span style={{...lbl,color:C.grn,fontSize:8}}>Live</span></div>
          </div>
          <div style={{flex:1}}>
            {d.feed.map((f,i,a)=>(
              <div key={i} style={{padding:"10px 14px",borderBottom:i<a.length-1?`1px solid ${C.bd}`:""}}
                onMouseEnter={e=>e.currentTarget.style.background=C.surf}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontFamily:C.IN,fontSize:10,fontWeight:500,background:"#dbeafe",color:"#1e40af",padding:"1px 6px",borderRadius:3}}>{f.src}</span>
                  <span style={{fontFamily:C.MN,fontSize:10,color:C.mute}}>{f.time}</span>
                </div>
                <p style={{fontFamily:C.PF,fontSize:12,fontWeight:600,color:C.navy,lineHeight:"1.3",marginBottom:5}}>{f.headline}</p>
                <div style={{background:C.surf,borderLeft:`2px solid ${C.navyM}`,padding:"4px 8px",borderRadius:2}}>
                  <p style={{...lbl,color:C.navy,fontSize:8,marginBottom:2}}>Impact</p>
                  <p style={{fontFamily:C.IN,fontSize:10,color:C.dark,lineHeight:"15px"}}>{f.impact}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{padding:"8px 14px",borderTop:`1px solid ${C.bd}`}}>
            <button onClick={()=>go("pipeline")} style={{width:"100%",padding:7,background:C.navy,color:C.white,border:"none",borderRadius:4,fontFamily:C.IN,fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
              <I n="feed" s={12} c={C.white}/>Open Live Pipeline
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

const BRIEF_FB = {subject:"GCC Regional Security and Economic Outlook",keyJudgement:"GCC regional dynamics remain defined by concurrent economic transformation and persistent security challenges along the Yemeni corridor. Intelligence indicators suggest gradual stabilisation in energy markets while diplomatic channels remain active across all member states.",situation:"Regional geopolitical dynamics have crystallised around a strategic realignment in energy transit security following last week's ministerial summit in Riyadh. Intelligence suggests a shift from reactive maritime posturing to proactive terrestrial logistics hardening among GCC members.\n\nSynthesised data points indicate elevated non-kinetic pressure on Omani border crossings, while Saudi Arabia's Giga-Project resilience scores remain stable despite localised supply chain volatility.",analysis:"The formal ratification of the GCC digital trade framework marks a significant pivot in Riyadh's diversification strategy, establishing specialised economic zones dedicated to technology manufacturing and green hydrogen export.\n\nStrategically, the framework establishes a 10-year supply chain integration period. This signifies a structural shift in regional energy markets as the GCC increasingly adopts alternative settlement mechanisms.",implications:"Posts should anticipate increased bilateral engagement requests from GCC foreign ministries seeking to leverage the current diplomatic window. Energy attachés should brief on the implications of the new LNG pricing framework.",priorities:["Monitor Saudi-Iran back-channel communications via Omani intermediaries","Track UAE sovereign wealth fund reallocations into domestic AI infrastructure","Assess Houthi negotiating posture ahead of UN-mediated talks","Monitor GCC central bank coordination on digital currency framework"],countries:[{name:"Saudi Arabia",risk:"Moderate",trend:"Stable",devs:["Trans-Peninsula Corridors security initiative announced","PIF reallocates $4B to domestic industrial automation"],impl:"Expect crude pricing shifts as Kingdom pivots toward domestic supply chain sovereignty."},{name:"Bahrain",risk:"Low",trend:"Stable",devs:["Joint naval exercises successfully completed","Digital banking license expansion facilitates fintech integration"],impl:"Minimal disruption anticipated; Manama continues as stabilising regulatory hub."},{name:"Oman",risk:"Low",trend:"Pivot",devs:["Mediatory talks hosted in Muscat on Hormuz transit protocols","Increased border security patrols along western frontier"],impl:"High diplomatic reliance. Monitor for increased logistical overhead in shipping corridors."},{name:"Yemen",risk:"Critical",trend:"Negative",devs:["Truce framework fractures following drone incursions near energy infrastructure","Humanitarian corridor disruption due to factional disputes"],impl:"Severe alert for NGO personnel. Maritime insurance premiums expected to rise."}],scores:{trade:65,security:88,energy:42,diplomatic:75},score:7.8};

const PIPE_FB = [
  {id:"p1",title:"Saudi Aramco secures $8.2bn infrastructure deal with South Korean consortium",summary:"The Public Investment Fund confirmed a landmark infrastructure deal with a South Korean consortium valued at $8.2 billion. Crown Prince Mohammed bin Salman chaired the announcement alongside GCC counterparts. The fund targets transport, digital, and energy corridors across all member states by 2030.",src:"Arab News",time:"07:30 AST",sector:"economy",country:"Saudi Arabia",risk:"LOW",breaking:false},
  {id:"p2",title:"Houthi forces intensify Red Sea drone campaign targeting LNG shipping",summary:"Houthi military command confirmed three drone strikes on commercial vessels in the southern Red Sea within 24 hours. LNG tanker routes serving European markets were disrupted, prompting UN Security Council consultations. US Fifth Fleet repositioned two destroyer escorts to Bab-el-Mandeb.",src:"Al Jazeera",time:"06:15 AST",sector:"security",country:"Yemen",risk:"HIGH",breaking:true},
  {id:"p3",title:"UAE Central Bank Digital Dirham pilot clears AED 2.3bn in 48 hours",summary:"The Central Bank of UAE formally launched the Digital Dirham retail pilot in partnership with twelve regional banks and three international settlement institutions. Governor Khaled Mohamed Balama described the initiative as a cornerstone of UAE monetary sovereignty strategy.",src:"The National UAE",time:"08:45 AST",sector:"economy",country:"UAE",risk:"LOW",breaking:false},
  {id:"p4",title:"Qatar LNG Phase II awarded to TotalEnergies-Shell in $18.7bn deal",summary:"QatarEnergy awarded North Field South expansion contracts to a TotalEnergies-Shell consortium in the largest single LNG deal in Gulf history. The project adds 16 million tonnes per annum capacity by 2027. Doha described the deal as foundational to Qatar's 2030 National Vision.",src:"Reuters",time:"09:20 AST",sector:"energy",country:"Qatar",risk:"LOW",breaking:false},
  {id:"p5",title:"Omani FM hosts Tehran delegation for Strait of Hormuz security consultations",summary:"Foreign Minister Badr bin Hamad Al-Busaidi received Iranian counterpart in Muscat for bilateral Strait of Hormuz transit security consultations. Discussions included joint monitoring protocols and an incident-prevention hotline. Oman will share a framework document with GCC counterparts within 72 hours.",src:"Asharq Al-Awsat",time:"11:30 AST",sector:"diplomacy",country:"Oman",risk:"MEDIUM",breaking:false},
  {id:"p6",title:"Bahrain EDB records $4.1bn FDI in Q2 — highest since 2019",summary:"The Bahrain Economic Development Board reported $4.1 billion in new foreign direct investment commitments for Q2, the highest quarterly figure since 2019. Investments concentrate in Islamic finance, fintech infrastructure, and logistics.",src:"Gulf News",time:"10:10 AST",sector:"economy",country:"Bahrain",risk:"LOW",breaking:false},
  {id:"p7",title:"Kuwait National Assembly passes Digital Economy Governance Law",summary:"Kuwait's National Assembly passed the Digital Economy and Data Governance Law by 42-8 after three years of deliberation. The law establishes a national data sovereignty framework and creates a KD 200 million digital innovation fund.",src:"BBC Middle East",time:"12:00 AST",sector:"technology",country:"Kuwait",risk:"LOW",breaking:false},
  {id:"p8",title:"GCC Secretariat releases unified 130GW renewable energy roadmap",summary:"The GCC Secretariat published the 2030 Renewable Energy Transition Roadmap establishing coordinated targets across all six member states. Aggregate targets call for 130 GW of clean energy capacity by 2030 requiring $340 billion in investment.",src:"AFP",time:"08:00 AST",sector:"energy",country:"Regional",risk:"LOW",breaking:false},
];

const ALERTS_FB = [
  {id:"a1",level:"CRITICAL",type:"Maritime Security",headline:"Houthi drone intensification targeting Red Sea LNG transit routes",detail:"Multiple UAV launches in southern Red Sea. Commercial shipping on maximum distance from Yemeni coast. US Navy repositioned escorts to Bab-el-Mandeb. LNG operators activating Cape of Good Hope contingency routing.",country:"Yemen",sector:"security",risk:"HIGH",time:"06:30 AST",src:"UKMTO Advisory"},
  {id:"a2",level:"HIGH",type:"Cyber Threat",headline:"State-sponsored campaign targeting GCC critical energy infrastructure",detail:"Intelligence indicates coordinated intrusion against SCADA systems in GCC energy facilities. Saudi Aramco, ADNOC, and QatarEnergy on elevated cyber security posture.",country:"Regional",sector:"security",risk:"HIGH",time:"08:15 AST",src:"NCSC Advisory"},
  {id:"a3",level:"HIGH",type:"Political Crisis",headline:"Yemen peace negotiations break down — ceasefire framework at risk",detail:"UN Special Envoy confirmed collapse of ceasefire talks in Geneva. Houthi delegation withdrew citing unmet preconditions. Saudi-led coalition placed on standby alert.",country:"Yemen",sector:"diplomacy",risk:"HIGH",time:"09:45 AST",src:"UN OCHA"},
  {id:"a4",level:"WARNING",type:"Economic Alert",headline:"Iranian Rial falls 8% following new US Treasury energy designations",detail:"Iranian currency fell sharply after six energy sector entities designated under US sanctions. Regional markets showed volatility. Gulf central banks monitoring cross-border transaction flows.",country:"Iran",sector:"economy",risk:"MEDIUM",time:"10:30 AST",src:"Reuters"},
  {id:"a5",level:"WARNING",type:"Civil Unrest",headline:"Protests reported in Beirut over banking sector withdrawal restrictions",detail:"Demonstrations outside central bank branches following continued capital controls. Security forces deployed in preventive capacity. Non-essential travel avoidance advised for central Beirut.",country:"Lebanon",sector:"society",risk:"MEDIUM",time:"11:00 AST",src:"Embassy Network"},
  {id:"a6",level:"INFO",type:"Diplomatic Development",headline:"Saudi-Israeli normalisation consultations resume with US facilitation",detail:"Senior officials met with US National Security Advisor for trilateral consultations on potential Abraham Accords expansion. No formal announcement expected this week.",country:"Saudi Arabia",sector:"diplomacy",risk:"LOW",time:"12:15 AST",src:"Foreign Policy"},
  {id:"a7",level:"INFO",type:"Economic Development",headline:"Kuwait Investment Authority increases European infrastructure allocation by $6bn",detail:"KIA confirmed $6 billion increase to European infrastructure allocation, targeting UK, French, and German transport and energy assets.",country:"Kuwait",sector:"economy",risk:"LOW",time:"13:00 AST",src:"Gulf News"},
];

const SH_FB = [
  {id:"s1",name:"HRH Prince Mohammed bin Salman",role:"Crown Prince & Prime Minister",org:"Royal Court of Saudi Arabia",cat:"government",country:"Saudi Arabia",influence:"Tier 1",stance:"cooperative",summary:"Primary decision-maker for Vision 2030, NEOM, and PIF. Controls foreign policy and defence portfolio.",recentActivity:"Hosted trilateral GCC summit on digital currency. Signed strategic AI partnership with US tech sector.",watchItems:["Vision 2030 Phase III","PIF overseas investment signals","Regional security posture"]},
  {id:"s2",name:"HE Dr. Sultan Al-Jaber",role:"Minister of Industry & ADNOC CEO",org:"UAE Ministry of Industry / ADNOC",cat:"government",country:"UAE",influence:"Tier 1",stance:"cooperative",summary:"Key architect of UAE clean energy transition and ADNOC diversification. Coordinates GCC energy policy internationally.",recentActivity:"Chaired ADIPEC forum. Confirmed $23bn ADNOC downstream investment.",watchItems:["ADNOC IPO pipeline","UAE-China energy MOU","COP commitments"]},
  {id:"s3",name:"HE Mohammed Al-Jadaan",role:"Minister of Finance",org:"Saudi Ministry of Finance",cat:"government",country:"Saudi Arabia",influence:"Tier 1",stance:"cooperative",summary:"Oversees Saudi fiscal policy and GCC financial coordination. Key interlocutor on trade and sanctions compliance.",recentActivity:"Announced VAT exemptions for tech sector. Hosted IMF Article IV consultations.",watchItems:["Budget deficit targets","Sovereign debt issuance","GCC fiscal coordination"]},
  {id:"s4",name:"Abdul Malik Al-Houthi",role:"Supreme Leader",org:"Ansar Allah (Houthi Movement)",cat:"military",country:"Yemen",influence:"Tier 1",stance:"adversarial",summary:"Controls Houthi military and political operations. Primary decision-maker on Red Sea attacks and ceasefire negotiations.",recentActivity:"Announced continuation of Red Sea campaign. Rejected latest UN ceasefire proposal.",watchItems:["Ceasefire negotiating posture","Missile capability","Iranian weapons shipments"]},
  {id:"s5",name:"Amin H. Nasser",role:"President & CEO",org:"Saudi Aramco",cat:"business",country:"Saudi Arabia",influence:"Tier 1",stance:"cooperative",summary:"Leads world's largest oil company. Manages Aramco's global downstream and trading operations.",recentActivity:"Confirmed Q2 record production. Signed downstream partnerships with six Asian companies.",watchItems:["Aramco quarterly earnings","IPO secondary tranche","Diversification investments"]},
  {id:"s6",name:"HE Mohammed Al-Gergawi",role:"Minister of Cabinet Affairs",org:"UAE Federal Cabinet",cat:"government",country:"UAE",influence:"Tier 2",stance:"cooperative",summary:"Coordinates UAE federal government strategic initiatives. Key facilitator for foreign partnerships.",recentActivity:"Launched UAE Government AI Integration Programme. Represented UAE at World Government Summit.",watchItems:["UAE digital transformation","Smart city procurement","Federal budget priorities"]},
  {id:"s7",name:"Fatima Al-Fihri Foundation",role:"GCC Educational Policy Body",org:"GCC Educational Reform Council",cat:"ngo",country:"Regional",influence:"Tier 3",stance:"cooperative",summary:"Coordinates GCC educational reform and youth employment policy across member states.",recentActivity:"Published GCC Youth Employment Outlook 2026. Hosted ministerial roundtable on technical education.",watchItems:["Youth unemployment data","Educational reform legislation","Labour market integration"]},
  {id:"s8",name:"Middle East Eye",role:"Regional News Outlet",org:"Middle East Eye",cat:"media",country:"Regional",influence:"Tier 2",stance:"neutral",summary:"Independent digital media covering GCC and MENA politics, conflict, and human rights.",recentActivity:"Published investigation on GCC labour reform. Breaking coverage of Yemen ceasefire breakdown.",watchItems:["Editorial positioning on GCC reforms","Source networks in conflict zones","Social media reach"]},
];

const DEVS_FB = [
  {title:"Saudi Arabia launches Phase III of Vision 2030 Industrial Strategy",summary:"SIDF announced SAR 180bn Phase III allocations targeting advanced manufacturing, mining, and defence industries. Deputy Minister Al-Falih confirmed 23 international technology partners.",sector:"economy",country:"Saudi Arabia",risk:"LOW",src_type:"Official Statement",impl:"Significant procurement opportunities for advanced manufacturing and defence technology partners."},
  {title:"UAE-China strategic partnership enters implementation phase",summary:"UAE MFA confirmed activation of strategic partnership framework with China, establishing joint working groups across eight sectors including digital and clean energy.",sector:"diplomacy",country:"UAE",risk:"LOW",src_type:"Official Statement",impl:"Signals deepening UAE-China ties with implications for Western technology partnership frameworks."},
  {title:"Houthi forces claim attack on Saudi border logistics infrastructure",summary:"Houthi spokesman confirmed targeting of a logistics facility in Jizan province. Saudi air defences intercepted the projectiles with no reported casualties.",sector:"security",country:"Yemen",risk:"HIGH",src_type:"State Media",impl:"Elevated threat to border infrastructure requires reassessment of security protocols in affected regions."},
  {title:"Qatar accelerates hydrogen export framework with European partners",summary:"QatarEnergy signed MoUs with six European energy companies establishing long-term green and blue hydrogen supply frameworks totalling 4.2 million tonnes annually by 2030.",sector:"energy",country:"Qatar",risk:"LOW",src_type:"Official Statement",impl:"Positions Qatar as primary GCC hydrogen supplier to European markets, strengthening energy diplomacy leverage."},
  {title:"Bahrain hosts GCC digital currency interoperability summit",summary:"Central Bank of Bahrain convened GCC governors for a two-day summit on cross-border digital currency interoperability standards. Draft technical framework presented for member review.",sector:"economy",country:"Bahrain",risk:"LOW",src_type:"Official Statement",impl:"GCC monetary integration advancement with significant implications for regional trade settlement mechanisms."},
  {title:"Oman increases border security following Yemen conflict spillover",summary:"Royal Oman Police deployed additional units along the Al Mahra border following reports of armed group activity related to Yemen conflict spillover. Civilian movement restrictions imposed in three districts.",sector:"security",country:"Oman",risk:"MEDIUM",src_type:"State Media",impl:"Monitor for further escalation; assess implications for Omani mediation role and humanitarian corridor access."},
  {title:"Kuwait parliament debates new foreign investment framework legislation",summary:"National Assembly held first reading of the Foreign Direct Investment Law Reform Bill, proposing raising foreign ownership limits in twelve sectors to 100 percent.",sector:"politics",country:"Kuwait",risk:"LOW",src_type:"Independent Media",impl:"Legislative outcome will determine Kuwait's competitiveness as investment destination relative to UAE and Saudi Arabia."},
  {title:"Iran nuclear enrichment reaches new threshold according to IAEA report",summary:"IAEA confirmed Iran has accumulated uranium enriched to 84 percent purity at Fordow facility, raising proliferation concerns among Western powers and triggering emergency P5+1 consultations.",sector:"military",country:"Iran",risk:"HIGH",src_type:"Think Tank",impl:"Critical escalation requiring immediate assessment of regional security implications for GCC partners."},
  {title:"Egypt signs $5bn renewable energy deal with ACWA Power consortium",summary:"Egyptian Ministry of Electricity finalised agreements with Saudi ACWA Power for 5 GW of combined solar and wind capacity across three governorates.",sector:"energy",country:"Egypt",risk:"LOW",src_type:"Official Statement",impl:"Strengthens GCC-Egypt energy investment corridor and creates precedent for regional clean energy financing."},
  {title:"Turkey-GCC trade corridor agreement signed at Ankara summit",summary:"Turkish President Erdogan and GCC Secretary-General signed a comprehensive trade facilitation agreement reducing tariffs on 847 product categories and establishing an arbitration mechanism.",sector:"trade",country:"Turkey",risk:"LOW",src_type:"Official Statement",impl:"Expands Turkish economic integration with GCC, creating new investment corridor with implications for regional supply chains."},
];


function Brief() {
  const [d,setD]=useState(BRIEF_FB);
  const [ld,setLd]=useState(false);
  const [er,setEr]=useState(null);
  const loaded=useRef(false);

  const load=useCallback(async()=>{
    setLd(true);setEr(null);
    try{
      const raw=await ai(
        `Senior GCC geopolitical analyst. Today is ${DL}. Respond with ONLY valid JSON. Start with { end with }.`,
        `Generate a GCC Daily Intelligence Brief with: subject, keyJudgement (2 sentences), situation (2 paras \\n\\n), analysis (2 paras \\n\\n), implications (2-3 sentences), priorities ([4 strings]), countries ([4 objects for Saudi Arabia/Bahrain/Oman/Yemen: {name,risk:"Low"|"Moderate"|"Critical",trend,devs:[2 strings],impl}]), scores ({trade,security,energy,diplomatic} 0-100), score (0-10). Ref: ${REF}. Use specific analytical content.`,2000);
      const v=pj(raw)||{};
      const fb=BRIEF_FB;
      setD({
        subject:v.subject||fb.subject,
        keyJudgement:v.keyJudgement||fb.keyJudgement,
        situation:v.situation||fb.situation,
        analysis:v.analysis||fb.analysis,
        implications:v.implications||fb.implications,
        priorities:Array.isArray(v.priorities)&&v.priorities.length?v.priorities:fb.priorities,
        countries:Array.isArray(v.countries)&&v.countries.length?v.countries:fb.countries,
        scores:(v.scores&&typeof v.scores==="object")?v.scores:fb.scores,
        score:v.score||fb.score,
      });
    }catch(e){setEr(e.message);}
    setLd(false);
  },[]);

  useEffect(()=>{if(!loaded.current){loaded.current=true;load();}},[load]);

  const RC={Low:{c:C.grn,bg:C.grnB},Moderate:{c:C.amb,bg:C.ambB},Critical:{c:C.red,bg:C.redB}};

  const briefText = d ? [
    "OFFICIAL — SENSITIVE",
    `Ref: ${REF}`,
    `Date: ${DL}`,
    `From: Political & Economic Section — Riyadh`,
    `To: Ministry of Foreign Affairs — HQ`,
    `Subject: ${d.subject}`,
    "",
    "EXECUTIVE SUMMARY",
    d.keyJudgement,
    "",
    "1. SITUATION",
    d.situation,
    "",
    "2. ANALYSIS",
    d.analysis,
    "",
    "3. IMPLICATIONS FOR POST",
    d.implications,
    "",
    "4. MONITORING PRIORITIES",
    ...(d.priorities||[]).map((p,i)=>`   ${i+1}. ${p}`),
    "",
    "5. COUNTRY ASSESSMENTS",
    ...(d.countries||[]).flatMap(c=>[`   ${c.name} — Risk: ${c.risk} | Trend: ${c.trend}`,...(c.devs||[]).map(dv=>`     • ${dv}`)]),
  ].join("\n") : "";

  return(
    <div>
      <PH label="Classified Briefing" title={`Daily Brief: ${DS}`} sub={`Ref: ${REF} · Vision Intelligence Commons 2030`}
        action={<div style={{display:"flex",gap:8}}>
          <Btn onClick={load} ld={ld} icon="bolt" label="Regenerate" primary/>
          <button onClick={()=>exportPDF("Daily Intelligence Brief — "+DS, briefText, REF)} style={{display:"flex",alignItems:"center",gap:5,padding:"8px 14px",borderRadius:4,border:`1px solid ${C.bd}`,background:C.white,color:C.dark,fontFamily:C.IN,fontSize:12,fontWeight:600,cursor:"pointer"}}><I n="picture_as_pdf" s={14} c={C.gold}/>Export PDF</button>
        </div>}/>
      {er&&<Err msg={er+" (showing last data)"}/>}
      {ld&&<div style={{...goldC,padding:"12px 18px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
        <svg width="16" height="16" viewBox="0 0 36 36" style={{animation:"sp 1.1s linear infinite",flexShrink:0}}><circle cx="18" cy="18" r="13" fill="none" stroke={C.gold} strokeWidth="2.5" strokeDasharray="58 20" strokeLinecap="round"/></svg>
        <span style={{fontFamily:C.IN,fontSize:12,color:C.dark}}>Regenerating brief — current data displayed below…</span>
      </div>}
      {d&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 270px",gap:16}}>
          <div>
            <div style={{background:C.navy,borderRadius:6,overflow:"hidden",marginBottom:14}}>
              <div style={{padding:"10px 20px",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{height:1,width:24,background:"rgba(255,220,165,0.4)"}}/><span style={{...lbl,color:C.goldL,letterSpacing:"0.12em",fontSize:10}}>OFFICIAL — SENSITIVE</span><div style={{height:1,width:24,background:"rgba(255,220,165,0.4)"}}/></div>
                <span style={{fontFamily:C.MN,fontSize:10,color:"rgba(255,255,255,0.3)"}}>{REF}</span>
              </div>
              <div style={{padding:"12px 20px"}}>
                {[["DATE",DL],["FROM","Political & Economic Section — Riyadh"],["TO","Ministry of Foreign Affairs — HQ"],["SUBJ",d.subject]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",gap:12,marginBottom:3}}>
                    <span style={{...lbl,color:C.goldD,fontSize:9,minWidth:30,flexShrink:0,marginTop:1}}>{k}</span>
                    <span style={{fontFamily:C.IN,fontSize:12,color:"rgba(255,255,255,0.82)",lineHeight:"18px",fontWeight:k==="SUBJ"?600:400}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{...goldC,padding:"16px 20px",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}><I n="auto_awesome" c={C.gold} s={15}/><p style={{fontFamily:C.PF,fontSize:15,fontWeight:600,color:C.navy}}>Executive Summary</p></div>
              <p style={{fontFamily:C.IN,fontSize:14,color:C.dark,lineHeight:"24px"}}>{d.keyJudgement}</p>
            </div>
            {[{n:"1.",l:"Situation",b:d.situation},{n:"2.",l:"Analysis",b:d.analysis},{n:"3.",l:"Implications for Post",b:d.implications}].map(({n,l,b})=>(
              <div key={l} style={{...goldC,padding:"14px 20px",marginBottom:10}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}><span style={{...lbl,color:C.gold,fontSize:10}}>{n}</span><p style={{fontFamily:C.PF,fontSize:15,fontWeight:600,color:C.navy}}>{l}</p></div>
                {(b||"").split("\n\n").map((p,i)=><p key={i} style={{fontFamily:C.IN,fontSize:13,color:C.dark,lineHeight:"22px",marginBottom:i<1?10:0}}>{p}</p>)}
              </div>
            ))}
            <p style={{...lbl,color:C.mute,fontSize:10,margin:"18px 0 12px"}}>Regional Intelligence Modules</p>
            {d.countries.map((c,i,a)=>{
              const r=RC[c.risk]||RC.Low;
              return(
                <div key={i} style={{display:"grid",gridTemplateColumns:"140px 1fr",gap:18,marginBottom:18,paddingBottom:18,borderBottom:i<a.length-1?`1px solid ${C.bd}`:""}}>
                  <div>
                    <div style={{height:3,background:c.risk==="Critical"?C.red:C.navyM,marginBottom:10,opacity:c.risk==="Critical"?1:0.5,borderRadius:2}}/>
                    <p style={{fontFamily:C.PF,fontSize:14,fontWeight:700,color:C.navy,textTransform:"uppercase",letterSpacing:"0.03em",marginBottom:8}}>{c.name}</p>
                    <span style={{...lbl,fontSize:10,color:r.c,background:r.bg,padding:"2px 8px",borderRadius:2,display:"block",width:"fit-content",marginBottom:5}}>Risk: {c.risk}</span>
                    <span style={{...lbl,fontSize:9,color:C.navyM,background:"#dbeafe",padding:"2px 8px",borderRadius:2,display:"block",width:"fit-content"}}>Trend: {c.trend}</span>
                  </div>
                  <div style={{borderLeft:`1px solid ${C.bd}`,paddingLeft:18}}>
                    <p style={{...lbl,color:C.navy,fontSize:10,marginBottom:7}}>Top Developments</p>
                    {(c.devs||[]).map((dv,j)=><div key={j} style={{display:"flex",gap:7,marginBottom:5}}><span style={{color:c.risk==="Critical"?C.red:C.gold,fontWeight:700,flexShrink:0}}>•</span><p style={{fontFamily:C.IN,fontSize:12,color:C.dark,lineHeight:"18px"}}>{dv}</p></div>)}
                    <div style={{background:c.risk==="Critical"?"rgba(153,27,27,0.05)":"rgba(27,43,72,0.04)",borderLeft:`2px solid ${c.risk==="Critical"?C.red:C.navyM}`,padding:"8px 10px",borderRadius:2,marginTop:8}}>
                      <p style={{...lbl,color:c.risk==="Critical"?C.red:C.navy,fontSize:9,marginBottom:3}}>Implications</p>
                      <p style={{fontFamily:C.IN,fontSize:12,color:C.dark,fontStyle:"italic",lineHeight:"18px"}}>{c.impl}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {d.scores&&<div style={{...navyC,padding:18}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                <div><p style={{fontFamily:C.PF,fontSize:14,fontWeight:700,color:C.white}}>Strategic Impact</p><p style={{...lbl,color:"rgba(255,255,255,0.35)",fontSize:9,marginTop:1}}>Aggregate Exposure</p></div>
                <div style={{textAlign:"right"}}><p style={{fontFamily:C.PF,fontSize:38,fontWeight:700,color:C.goldD,lineHeight:1}}>{d.score||"7.8"}</p><p style={{...lbl,color:"rgba(255,255,255,0.35)",fontSize:9}}>Impact Score</p></div>
              </div>
              {Object.entries(d.scores).map(([k,v])=>(
                <div key={k} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{...lbl,color:"rgba(255,255,255,0.45)",fontSize:9}}>{k}</span><span style={{...lbl,color:C.goldD,fontSize:9}}>{v}%</span></div>
                  <div style={{height:4,background:"rgba(255,255,255,0.12)",borderRadius:3}}><div style={{height:"100%",background:C.goldD,width:v+"%",borderRadius:3}}/></div>
                </div>
              ))}
            </div>}
            {d.priorities&&<div style={{...goldC,padding:"14px 16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}><I n="radar" c={C.navy} s={14}/><p style={{fontFamily:C.PF,fontSize:14,fontWeight:600,color:C.navy}}>Watch List</p></div>
              {d.priorities.map((p,i)=><div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:i<3?`1px solid ${C.bd}`:""}}>
                <span style={{...lbl,color:C.gold,fontSize:9,minWidth:14}}>{i+1}.</span>
                <p style={{fontFamily:C.IN,fontSize:11,color:C.dark,lineHeight:"17px"}}>{p}</p>
              </div>)}
            </div>}
            <div style={{...card,padding:"12px 14px"}}>
              {[["Reference",REF],["Clearance","Official — Sensitive"],["Status","Active"],["Updated",DS]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.bd}`}}>
                  <span style={{...lbl,color:C.navy,fontSize:9}}>{l}</span>
                  <span style={{fontFamily:C.IN,fontSize:11,color:C.dark}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function Pipeline() {
  const [arts,setArts]=useState(PIPE_FB);
  const [ld,setLd]=useState(false);
  const [er,setEr]=useState(null);
  const [catF,setCatF]=useState(null);
  const [riskF,setRiskF]=useState(null);
  const [topic,setTopic]=useState("");
  const [last,setLast]=useState(null);
  const [tfoc,setTfoc]=useState(false);
  const loaded=useRef(false);
  const {ana,busy,exp,analyse}=useAnalysis();

  const load=useCallback(async(t)=>{
    setLd(true);setEr(null);
    try{
      const focus=t?`Focus specifically on: "${t}".`:"Cover a balanced mix across all sectors and GCC/MENA countries.";
      const raw=await ai(
        `GCC news intelligence aggregator. Today is ${DL}. ${focus} Respond with ONLY a JSON array. Start with [ end with ].`,
        `Generate 16 realistic current GCC/MENA news articles. Each: {"id":"8chars","title":"specific headline 10-18 words with names/figures","summary":"3 sentences specific details named officials amounts","src":"news source","time":"HH:MM AST","sector":"politics|security|economy|energy|diplomacy|military|technology|humanitarian|trade|society","country":"Saudi Arabia|UAE|Bahrain|Oman|Qatar|Kuwait|Yemen|Jordan|Egypt|Iraq|Iran|Regional","risk":"LOW|MEDIUM|HIGH","breaking":false}. Cover all 7 GCC countries. Include 3 HIGH risk items. Today: ${DL}.`,2600);
      const arr=pj(raw);
      if(Array.isArray(arr)&&arr.length>0){
        setArts(arr.map((a,i)=>({
          id:a.id||Math.random().toString(36).slice(2,10),
          title:a.title||"GCC Regional Development",
          summary:a.summary||"",
          src:a.src||SRCS[i%SRCS.length],
          time:a.time||String(7+Math.floor(i/3)).padStart(2,"0")+":"+String((i*7)%60).padStart(2,"0")+" AST",
          sector:SECTORS.find(s=>s.id===a.sector)?a.sector:"politics",
          country:a.country||"Regional",
          risk:["LOW","MEDIUM","HIGH"].includes(a.risk)?a.risk:"LOW",
          breaking:!!a.breaking,
        })));
      } else { setArts(PIPE_FB); }
      setLast(new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
    }catch(e){setEr(e.message);}
    setLd(false);
  },[]);

  useEffect(()=>{if(!loaded.current){loaded.current=true;load(null);}},[load]);

  const fil=arts.filter(a=>(!catF||a.sector===catF)&&(!riskF||a.risk===riskF));
  const rc={LOW:0,MEDIUM:0,HIGH:0}; arts.forEach(a=>{if(rc[a.risk]!==undefined)rc[a.risk]++;});

  const pipeText = arts.map(a=>`[${a.time}] [${a.risk}] ${a.src} — ${a.country}\n${a.title}\n${a.summary}`).join("\n\n---\n\n");

  return(
    <div>
      <PH label={`Live Intelligence Feed · ${last?"Updated "+last:DS}`} title="Live Pipeline"
        sub="Al Jazeera · BBC Middle East · Arab News · Saudi Gazette · Gulf News · Asharq Al-Awsat · Reuters · AFP"
        action={<div style={{display:"flex",gap:8}}>
          <button onClick={()=>exportPDF("Live Intelligence Pipeline — "+DS, pipeText, REF)} style={{display:"flex",alignItems:"center",gap:5,padding:"8px 14px",borderRadius:4,border:`1px solid ${C.bd}`,background:C.white,color:C.dark,fontFamily:C.IN,fontSize:12,fontWeight:600,cursor:"pointer"}}><I n="picture_as_pdf" s={14} c={C.gold}/>Export PDF</button>
          <Btn onClick={()=>load(topic||null)} ld={ld} icon="refresh" label="Refresh"/>
        </div>}/>

      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:4,border:`1px solid ${ld?C.ambD:arts.length>0?C.grnD:C.bd}`,background:ld?C.ambB:arts.length>0?C.grnB:C.surf}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:ld?C.amb:arts.length>0?C.grn:C.mute,animation:ld?"pulse 1s infinite":arts.length>0?"pulse 4s infinite":"none"}}/>
          <span style={{...lbl,fontSize:9,color:ld?C.amb:arts.length>0?C.grn:C.mute}}>{ld?"Generating…":arts.length>0?arts.length+" articles · Live":"Ready"}</span>
        </div>
        {[{l:"Total",c:C.navy,v:arts.length},{l:"Stable",c:C.grn,v:rc.LOW},{l:"Caution",c:C.amb,v:rc.MEDIUM},{l:"Critical",c:C.red,v:rc.HIGH}].map(({l,c,v})=>(
          <div key={l} style={{...card,padding:"4px 10px",display:"flex",gap:6,alignItems:"center"}}>
            <span style={{...lbl,color:C.mute,fontSize:9}}>{l}</span>
            <span style={{fontFamily:C.PF,fontSize:16,fontWeight:700,color:c,lineHeight:1}}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{...goldC,padding:"10px 14px",marginBottom:12,display:"flex",gap:8,alignItems:"center"}}>
        <I n="search" c={C.gold} s={14} sx={{flexShrink:0}}/>
        <input value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load(topic||null)} onFocus={()=>setTfoc(true)} onBlur={()=>setTfoc(false)}
          placeholder="Focus on a topic… e.g. 'Saudi energy policy' or 'Yemen ceasefire'"
          style={{flex:1,border:"none",background:"transparent",fontFamily:C.IN,fontSize:12,color:C.ink,outline:"none"}}/>
        {topic&&<button onClick={()=>{setTopic("");load(null);}} style={{background:"transparent",border:"none",cursor:"pointer",color:C.mute,fontSize:12}}>✕</button>}
        <button onClick={()=>load(topic||null)} disabled={ld} style={{padding:"5px 12px",background:C.navy,color:C.white,border:"none",borderRadius:4,fontFamily:C.IN,fontSize:11,fontWeight:600,cursor:ld?"not-allowed":"pointer",opacity:ld?0.6:1,whiteSpace:"nowrap"}}>{ld?"…":"Search"}</button>
      </div>

      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
        {["Saudi Aramco","Yemen conflict","GCC economy","UAE diplomacy","Vision 2030","Gulf security","OPEC","Iran","Egypt","Turkey"].map(t=>(
          <button key={t} onClick={()=>{setTopic(t);load(t);}} style={{fontFamily:C.IN,fontSize:11,fontWeight:500,background:"#dbeafe",color:"#1e40af",padding:"3px 10px",borderRadius:999,border:"none",cursor:"pointer",transition:"background 0.1s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#bfdbfe"} onMouseLeave={e=>e.currentTarget.style.background="#dbeafe"}>{t}</button>
        ))}
      </div>

      {arts.length>0&&<div style={{...card,padding:"10px 14px",marginBottom:12,display:"flex",flexDirection:"column",gap:7}}>
        <FR label="Sector" items={SECTORS.filter(s=>s.id!=="all").map(s=>({v:s.id,l:s.l}))} active={catF} set={setCatF}/>
        <FR label="Risk" items={[{v:"LOW",l:"Stable"},{v:"MEDIUM",l:"Caution"},{v:"HIGH",l:"Critical"}]} active={riskF} set={setRiskF}/>
      </div>}

      {ld&&arts.length===0&&<Loader msg="Generating live GCC intelligence feed…"/>}
      {er&&arts.length===0&&<Err msg={er} retry={()=>load(topic||null)}/>}
      {ld&&arts.length>0&&<div style={{...goldC,padding:"10px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
        <svg width="14" height="14" viewBox="0 0 36 36" style={{animation:"sp 1.1s linear infinite",flexShrink:0}}><circle cx="18" cy="18" r="13" fill="none" stroke={C.gold} strokeWidth="2.5" strokeDasharray="58 20" strokeLinecap="round"/></svg>
        <span style={{fontFamily:C.IN,fontSize:12,color:C.dark}}>Refreshing feed — current articles displayed below…</span>
      </div>}

      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {fil.map(a=><ACard key={a.id} a={a} exp={exp} onExpand={analyse} ana={ana} busy={busy}/>)}
      </div>

      {arts.length>0&&fil.length===0&&<div style={{...card,padding:28,textAlign:"center"}}>
        <I n="filter_list_off" c={C.mute} s={26} sx={{display:"block",margin:"0 auto 8px"}}/>
        <p style={{...lbl,color:C.mute,fontSize:10,marginBottom:8}}>No articles match current filters</p>
        <button onClick={()=>{setCatF(null);setRiskF(null);}} style={{...lbl,fontSize:9,color:C.navy,background:C.surf,border:`1px solid ${C.bd}`,borderRadius:4,padding:"4px 12px",cursor:"pointer"}}>Clear Filters</button>
      </div>}
    </div>
  );
}


function CountryIntel() {
  const [country,setCountry]=useState("Saudi Arabia");
  const [d,setD]=useState(null);
  const [ld,setLd]=useState(false);
  const [er,setEr]=useState(null);
  const cache=useRef({});

  const load=useCallback(async(c)=>{
    if(cache.current[c]){setD(cache.current[c]);return;}
    setLd(true);setEr(null);setD(null);
    try{
      const raw=await ai(
        `Country intelligence specialist for GCC/MENA. Today is ${DL}. Respond with ONLY valid JSON. Start with { end with }.`,
        `Generate a comprehensive intelligence profile for ${c}: overview (2 sentences), riskLevel (LOW|MODERATE|HIGH|CRITICAL), stabilityScore (0-100), keyDevelopments (5: {title,body,sector,risk:"LOW"|"MEDIUM"|"HIGH",date}), keyActors (4: {name,role,org,significance,stance:"cooperative"|"neutral"|"adversarial"}), sectors ({politics,security,economy,energy,diplomacy,military} each {status:"stable"|"volatile"|"improving"|"deteriorating",notes}), alerts (3: {level:"info"|"warning"|"critical",headline,detail}), outlook (2-3 sentences 30 days). Today: ${DL}.`,1800);
      const v=pj(raw)||{};
      const profile={
        overview:v.overview||`${c} intelligence profile. Retry for updated data.`,
        riskLevel:v.riskLevel||"MODERATE",
        stabilityScore:v.stabilityScore||65,
        keyDevelopments:Array.isArray(v.keyDevelopments)?v.keyDevelopments:[],
        keyActors:Array.isArray(v.keyActors)?v.keyActors:[],
        sectors:v.sectors&&typeof v.sectors==="object"?v.sectors:{},
        alerts:Array.isArray(v.alerts)?v.alerts:[],
        outlook:v.outlook||"Outlook pending. Please retry.",
      };
      cache.current[c]=profile;
      setD(profile);
    }catch(e){setEr(e.message);}
    setLd(false);
  },[]);

  useEffect(()=>{load(country);},[country]);

  const RL={LOW:{c:C.grn,bg:C.grnB,b:C.grnD},MODERATE:{c:C.amb,bg:C.ambB,b:C.ambD},HIGH:{c:C.red,bg:C.redB,b:C.redD},CRITICAL:{c:"#7f1d1d",bg:C.redB,b:C.redD}};
  const AL={info:{c:C.blu,bg:C.bluB,icon:"info"},warning:{c:C.amb,bg:C.ambB,icon:"warning"},critical:{c:C.red,bg:C.redB,icon:"priority_high"}};
  const ST={stable:{c:C.grn,l:"Stable"},volatile:{c:C.red,l:"Volatile"},improving:{c:C.grn,l:"Improving"},deteriorating:{c:C.red,l:"Deteriorating"}};
  const SM=[{id:"politics",l:"Politics",icon:"gavel",col:"#374765"},{id:"security",l:"Security",icon:"security",col:C.red},{id:"economy",l:"Economy",icon:"trending_up",col:C.grn},{id:"energy",l:"Energy",icon:"bolt",col:C.blu},{id:"diplomacy",l:"Diplomacy",icon:"public",col:C.amb},{id:"military",l:"Military",icon:"shield",col:"#1e3a5f"}];
  const regions=[...new Set(COUNTRIES.map(c=>c.r))];
  const cObj=COUNTRIES.find(c=>c.id===country)||COUNTRIES[0];

  const profileText = d ? [
    `COUNTRY INTELLIGENCE PROFILE: ${country}`,
    `Risk Level: ${d.riskLevel} | Stability Score: ${d.stabilityScore}/100`,
    `Generated: ${DL}`,
    "",
    "OVERVIEW",
    d.overview,
    "",
    "KEY DEVELOPMENTS",
    ...(d.keyDevelopments||[]).map((dev,i)=>`${i+1}. [${dev.risk}] ${dev.title}\n   ${dev.body}`),
    "",
    "KEY ACTORS",
    ...(d.keyActors||[]).map(a=>`• ${a.name} (${a.role}, ${a.org}) — ${a.stance}\n  ${a.significance}`),
    "",
    "30-DAY OUTLOOK",
    d.outlook,
  ].join("\n") : "";

  return(
    <div>
      <PH label={"Country Intelligence · "+DS} title="Country Analysis" sub="Deep-dive intelligence profile — all GCC nations, Yemen, and neighbouring MENA countries."/>

      <div style={{marginBottom:18}}>
        {regions.map(r=>(
          <div key={r} style={{marginBottom:8}}>
            <p style={{...lbl,color:C.mute,fontSize:9,marginBottom:5}}>{r}</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {COUNTRIES.filter(c=>c.r===r).map(c=>{
                const on=country===c.id;
                return <button key={c.id} onClick={()=>setCountry(c.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:4,border:`1px solid ${on?C.navy:C.bd}`,background:on?C.navy:C.white,color:on?C.white:C.dark,fontFamily:C.IN,fontSize:11,fontWeight:on?600:400,cursor:"pointer",transition:"all 0.1s"}}>
                  <span style={{fontSize:13}}>{c.flag}</span>{c.id}
                </button>;
              })}
            </div>
          </div>
        ))}
      </div>

      {ld&&<Loader msg={"Generating "+country+" intelligence profile…"}/>}
      {er&&!ld&&<Err msg={er} retry={()=>{delete cache.current[country];load(country);}}/>}

      {d&&!ld&&(
        <>
          <div style={{background:C.navy,borderRadius:6,padding:"18px 22px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"3px solid "+C.gold}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:32}}>{cObj.flag}</span>
              <div>
                <p style={{fontFamily:C.PF,fontSize:20,fontWeight:700,color:C.white,marginBottom:3}}>{country}</p>
                <p style={{fontFamily:C.IN,fontSize:12,color:"rgba(255,255,255,0.6)",lineHeight:"18px",maxWidth:460}}>{d.overview}</p>
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0,marginLeft:16}}>
              <p style={{fontFamily:C.PF,fontSize:38,fontWeight:700,color:C.goldD,lineHeight:1}}>{d.stabilityScore}</p>
              <p style={{...lbl,color:"rgba(255,255,255,0.35)",fontSize:9}}>Stability Score</p>
              <span style={{...lbl,fontSize:10,color:(RL[d.riskLevel]||RL.MODERATE).c,background:(RL[d.riskLevel]||RL.MODERATE).bg,border:"1px solid "+(RL[d.riskLevel]||RL.MODERATE).b,padding:"2px 9px",borderRadius:2,display:"inline-block",marginTop:5}}>Risk: {d.riskLevel}</span>
            </div>
          </div>

          {d.alerts.length>0&&<div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
            {d.alerts.map((a,i)=>{const al=AL[a.level]||AL.info;return(
              <div key={i} style={{background:al.bg,border:`1px solid ${C.bd}`,borderLeft:"3px solid "+al.c,borderRadius:4,padding:"9px 12px",display:"flex",gap:9,alignItems:"flex-start"}}>
                <I n={al.icon} c={al.c} s={15} sx={{flexShrink:0,marginTop:1}}/>
                <div><p style={{fontFamily:C.IN,fontSize:12,fontWeight:600,color:al.c,marginBottom:2}}>{a.headline}</p><p style={{fontFamily:C.IN,fontSize:11,color:C.dark,lineHeight:"17px"}}>{a.detail}</p></div>
              </div>
            );})}
          </div>}

          <div style={{display:"grid",gridTemplateColumns:"1fr 270px",gap:12}}>
            <div>
              <div style={{...goldC,padding:"14px 18px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <p style={{fontFamily:C.PF,fontSize:14,fontWeight:600,color:C.navy}}>Key Developments</p>
                  <button onClick={()=>exportPDF(country+" — Country Intelligence Profile", profileText, REF)} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:4,border:`1px solid ${C.bd}`,background:C.white,color:C.dark,fontFamily:C.IN,fontSize:11,fontWeight:600,cursor:"pointer"}}><I n="picture_as_pdf" s={12} c={C.gold}/>PDF</button>
                </div>
                {d.keyDevelopments.length===0&&<p style={{fontFamily:C.IN,fontSize:12,color:C.mute}}>No developments available. Please retry.</p>}
                {d.keyDevelopments.map((dev,i)=>(
                  <div key={i} style={{padding:"8px 0",borderBottom:i<d.keyDevelopments.length-1?`1px solid ${C.bd}`:""}}>
                    <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:4}}>
                      {(()=>{const sm=SM.find(s=>s.id===dev.sector)||SM[0];return<span style={{...lbl,fontSize:9,color:sm.col,background:sm.col+"15",border:"1px solid "+sm.col+"25",padding:"2px 6px",borderRadius:2}}>{sm.l}</span>;})()}
                      <RB level={dev.risk||"LOW"}/>
                      {dev.date&&<span style={{fontFamily:C.MN,fontSize:10,color:C.mute}}>{dev.date}</span>}
                    </div>
                    <p style={{fontFamily:C.PF,fontSize:13,fontWeight:600,color:C.navy,marginBottom:3}}>{dev.title}</p>
                    <p style={{fontFamily:C.IN,fontSize:11,color:C.dark,lineHeight:"17px"}}>{dev.body}</p>
                  </div>
                ))}
              </div>
              <div style={{...card,padding:"14px 18px"}}>
                <p style={{fontFamily:C.PF,fontSize:14,fontWeight:600,color:C.navy,marginBottom:12}}>Sector Status</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {Object.entries(d.sectors).map(([k,v])=>{
                    const sm=SM.find(s=>s.id===k)||SM[0];
                    const st=ST[v?.status]||ST.stable;
                    return(
                      <div key={k} style={{background:C.surf,borderRadius:4,padding:"9px 11px",borderLeft:"3px solid "+sm.col}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                          <div style={{display:"flex",alignItems:"center",gap:4}}><I n={sm.icon} c={sm.col} s={13}/><span style={{...lbl,color:sm.col,fontSize:9}}>{sm.l}</span></div>
                          <span style={{...lbl,fontSize:8,color:st.c}}>{st.l}</span>
                        </div>
                        <p style={{fontFamily:C.IN,fontSize:11,color:C.dark,lineHeight:"16px"}}>{v?.notes||"No data."}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{...card,padding:"12px 16px"}}>
                <p style={{fontFamily:C.PF,fontSize:14,fontWeight:600,color:C.navy,marginBottom:10}}>Key Actors</p>
                {d.keyActors.map((actor,i)=>{
                  const sc={cooperative:C.grn,neutral:C.amb,adversarial:C.red}[actor.stance]||C.mute;
                  const sb={cooperative:C.grnB,neutral:C.ambB,adversarial:C.redB}[actor.stance]||C.surf;
                  return(
                    <div key={i} style={{padding:"6px 0",borderBottom:i<d.keyActors.length-1?`1px solid ${C.bd}`:""}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:2}}>
                        <p style={{fontFamily:C.IN,fontSize:12,fontWeight:600,color:C.navy}}>{actor.name}</p>
                        <span style={{...lbl,fontSize:8,color:sc,background:sb,padding:"1px 5px",borderRadius:2,flexShrink:0,marginLeft:4}}>{actor.stance}</span>
                      </div>
                      <p style={{fontFamily:C.IN,fontSize:10,color:C.mute,marginBottom:2}}>{actor.role} · {actor.org}</p>
                      <p style={{fontFamily:C.IN,fontSize:11,color:C.dark,lineHeight:"15px"}}>{actor.significance}</p>
                    </div>
                  );
                })}
              </div>
              <div style={{...navyC,padding:"12px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><I n="timeline" c={C.gold} s={14}/><p style={{fontFamily:C.PF,fontSize:13,fontWeight:600,color:C.white}}>30-Day Outlook</p></div>
                <p style={{fontFamily:C.IN,fontSize:12,color:"rgba(255,255,255,0.72)",lineHeight:"20px"}}>{d.outlook}</p>
              </div>
              <button onClick={()=>{delete cache.current[country];load(country);}} style={{...card,padding:"8px",width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:5,cursor:"pointer",fontFamily:C.IN,fontSize:11,fontWeight:600,color:C.navyM,border:`1px solid ${C.bd}`,borderRadius:6,background:C.white}}>
                <I n="refresh" s={13} c={C.navyM}/>Refresh {country} Profile
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


function SecurityAlerts() {
  const [alerts,setAlerts]=useState(ALERTS_FB);
  const [ld,setLd]=useState(false);
  const [er,setEr]=useState(null);
  const [filter,setFilter]=useState("all");
  const [last,setLast]=useState(null);
  const [acked,setAcked]=useState({});
  const {ana,busy,exp,analyse}=useAnalysis();
  const tmrRef=useRef(null);
  const loaded=useRef(false);

  const load=useCallback(async()=>{
    setLd(true);setEr(null);
    try{
      const raw=await ai(
        `GCC security intelligence officer. Today is ${DL}. Respond ONLY with a JSON array. Start with [ end with ].`,
        `Generate 8 current security and intelligence alerts for GCC and MENA. Each: {"id":"8chars","level":"CRITICAL|HIGH|WARNING|INFO","type":"alert category","headline","detail":"2-3 sentence situation","country","sector":"security|politics|economy|energy|diplomacy|military|technology|humanitarian|society","risk":"LOW|MEDIUM|HIGH","time":"HH:MM AST","src":"intelligence source"}. Mix of all levels. Today: ${DL}.`,1600);
      const arr=pj(raw);
      if(Array.isArray(arr)&&arr.length>0){
        setAlerts(arr.map((a,i)=>({...ALERTS_FB[i%ALERTS_FB.length],...a,id:a.id||Math.random().toString(36).slice(2,10)})));
      } else { setAlerts(ALERTS_FB); }
      setLast(new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
    }catch(e){setEr(e.message);setAlerts(ALERTS_FB);}
    setLd(false);
  },[]);

  useEffect(()=>{if(!loaded.current){loaded.current=true;load();}},[load]);
  useEffect(()=>{
    if(tmrRef.current) clearInterval(tmrRef.current);
    tmrRef.current=setInterval(()=>load(),5*60*1000);
    return()=>clearInterval(tmrRef.current);
  },[]);

  const LV={CRITICAL:{c:"#7f1d1d",bg:C.redB,b:C.redD,icon:"crisis_alert"},HIGH:{c:C.red,bg:C.redB,b:C.redD,icon:"warning"},WARNING:{c:C.amb,bg:C.ambB,b:C.ambD,icon:"report"},INFO:{c:C.blu,bg:C.bluB,b:C.bluD,icon:"info"}};
  const counts={CRITICAL:0,HIGH:0,WARNING:0,INFO:0};
  alerts.forEach(a=>{if(counts[a.level]!==undefined)counts[a.level]++;});
  const filtered=alerts.filter(a=>filter==="all"||a.level===filter);

  const alertsText = alerts.map(a=>`[${a.time}] [${a.level}] ${a.type} — ${a.country}\n${a.headline}\n${a.detail}`).join("\n\n---\n\n");

  return(
    <div>
      <PH label={"Security Intelligence · "+DS+(last?" · Updated "+last:"")} title="Security Alerts"
        sub="Real-time threat monitoring and security intelligence across GCC and MENA. Auto-refreshes every 5 minutes."
        action={<div style={{display:"flex",gap:8}}>
          <button onClick={()=>exportPDF("Security Intelligence Alerts — "+DS, alertsText, REF)} style={{display:"flex",alignItems:"center",gap:5,padding:"8px 14px",borderRadius:4,border:`1px solid ${C.bd}`,background:C.white,color:C.dark,fontFamily:C.IN,fontSize:12,fontWeight:600,cursor:"pointer"}}><I n="picture_as_pdf" s={14} c={C.gold}/>Export PDF</button>
          <Btn onClick={load} ld={ld} icon="refresh" label="Refresh" primary/>
        </div>}/>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
        {["CRITICAL","HIGH","WARNING","INFO"].map(l=>{
          const lv=LV[l]; const on=filter===l;
          return(
            <button key={l} onClick={()=>setFilter(filter===l?"all":l)} style={{background:on?lv.bg:C.white,border:`1px solid ${on?lv.c:C.bd}`,borderTop:"3px solid "+lv.c,borderRadius:6,padding:"11px 14px",cursor:"pointer",textAlign:"left",boxShadow:card.boxShadow,transition:"all 0.12s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><I n={lv.icon} c={lv.c} s={17}/><span style={{fontFamily:C.PF,fontSize:22,fontWeight:700,color:lv.c,lineHeight:1}}>{counts[l]}</span></div>
              <p style={{...lbl,color:lv.c,fontSize:9}}>{l}</p>
            </button>
          );
        })}
      </div>

      {ld&&alerts.length===0&&<Loader msg="Fetching security intelligence…"/>}
      {er&&<Err msg={er+" (showing last data)"}/>}
      {ld&&alerts.length>0&&<div style={{...goldC,padding:"10px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
        <svg width="14" height="14" viewBox="0 0 36 36" style={{animation:"sp 1.1s linear infinite",flexShrink:0}}><circle cx="18" cy="18" r="13" fill="none" stroke={C.gold} strokeWidth="2.5" strokeDasharray="58 20" strokeLinecap="round"/></svg>
        <span style={{fontFamily:C.IN,fontSize:12,color:C.dark}}>Refreshing alerts — current data displayed below…</span>
      </div>}

      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {filtered.map(a=>{
          const lv=LV[a.level]||LV.INFO;
          const isAck=acked[a.id];
          const isE=exp===a.id;
          const an=ana[a.id];
          const bz=busy[a.id];
          return(
            <div key={a.id} style={{...card,borderLeft:"4px solid "+(isAck?"#9ca3af":lv.c),opacity:isAck?0.55:1,transition:"opacity 0.2s,box-shadow 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 3px 14px rgba(10,22,40,0.10)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow=card.boxShadow}>
              <div style={{padding:"11px 15px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,gap:8}}>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{...lbl,fontSize:9,color:lv.c,background:lv.bg,border:"1px solid "+lv.b,padding:"2px 7px",borderRadius:2,display:"flex",alignItems:"center",gap:3}}><I n={lv.icon} s={10} c={lv.c}/>{a.level}</span>
                    <span style={{...lbl,fontSize:9,background:C.surf,color:C.dark,padding:"2px 7px",borderRadius:2}}>{a.type}</span>
                    <SB id={a.sector||"security"}/>
                    <span style={{fontFamily:C.IN,fontSize:11,color:C.mute}}>{a.country}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                    <span style={{fontFamily:C.MN,fontSize:11,color:C.mute}}>{a.time}</span>
                    {a.src&&<span style={{fontFamily:C.IN,fontSize:10,color:C.mute,background:C.surf,padding:"1px 6px",borderRadius:3}}>{a.src}</span>}
                    <button onClick={()=>setAcked(p=>({...p,[a.id]:!p[a.id]}))} style={{background:isAck?C.grnB:C.surf,border:"1px solid "+(isAck?C.grnD:C.bd),borderRadius:3,padding:"2px 8px",cursor:"pointer",fontFamily:C.IN,fontSize:10,fontWeight:600,color:isAck?C.grn:C.mute}}>{isAck?"✓ Acked":"Ack"}</button>
                  </div>
                </div>
                <p style={{fontFamily:C.PF,fontSize:13,fontWeight:600,color:C.navy,lineHeight:"1.4",marginBottom:4}}>{a.headline}</p>
                <p style={{fontFamily:C.IN,fontSize:12,color:C.dark,lineHeight:"17px",marginBottom:7}}>{a.detail}</p>
                <button onClick={()=>analyse(a)} style={{fontFamily:C.IN,fontSize:11,fontWeight:600,color:C.navyM,background:"transparent",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:4}}>
                  <I n="psychology" s={12} c={C.navyM}/>{isE?"Hide analysis":"AI threat analysis →"}
                </button>
              </div>
              {isE&&(
                <div style={{background:C.surf,borderTop:`1px solid ${C.bd}`,padding:"11px 15px"}}>
                  {bz&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0"}}><svg width="14" height="14" viewBox="0 0 36 36" style={{animation:"sp 1.1s linear infinite",flexShrink:0}}><circle cx="18" cy="18" r="13" fill="none" stroke={C.gold} strokeWidth="2.5" strokeDasharray="58 20" strokeLinecap="round"/></svg><span style={{...lbl,color:C.mute,fontSize:9}}>Analysing threat…</span></div>}
                  {!bz&&an?.err&&<p style={{fontFamily:C.IN,fontSize:12,color:C.red}}>{an.err}</p>}
                  {!bz&&an&&!an.err&&(
                    <>
                      {an.priority&&<div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:3,marginBottom:9,background:an.priority==="URGENT"?C.redB:an.priority==="MONITOR"?C.ambB:C.grnB,border:"1px solid "+(an.priority==="URGENT"?C.redD:an.priority==="MONITOR"?C.ambD:C.grnD)}}>
                        <I n={an.priority==="URGENT"?"priority_high":an.priority==="MONITOR"?"visibility":"check_circle"} s={12} c={an.priority==="URGENT"?C.red:an.priority==="MONITOR"?C.amb:C.grn}/>
                        <span style={{...lbl,fontSize:9,color:an.priority==="URGENT"?C.red:an.priority==="MONITOR"?C.amb:C.grn}}>Priority: {an.priority}</span>
                      </div>}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}>
                        <div style={{background:C.redB,border:"1px solid "+C.redD,borderRadius:4,padding:"9px 11px"}}>
                          <p style={{...lbl,color:C.red,fontSize:9,marginBottom:6,display:"flex",alignItems:"center",gap:3}}><I n="warning" s={10} c={C.red}/>Threat Indicators</p>
                          {(an.riskSignals||[]).map((s,j)=><div key={j} style={{display:"flex",gap:5,marginBottom:3}}><span style={{color:C.red,fontWeight:700,flexShrink:0}}>•</span><p style={{fontFamily:C.IN,fontSize:11,color:C.dark,lineHeight:"16px"}}>{s}</p></div>)}
                        </div>
                        <div style={{background:C.grnB,border:"1px solid "+C.grnD,borderRadius:4,padding:"9px 11px"}}>
                          <p style={{...lbl,color:C.grn,fontSize:9,marginBottom:6,display:"flex",alignItems:"center",gap:3}}><I n="lightbulb" s={10} c={C.grn}/>Recommended Actions</p>
                          {(an.opportunities||[]).map((o,j)=><div key={j} style={{display:"flex",gap:5,marginBottom:3}}><span style={{color:C.grn,fontWeight:700,flexShrink:0}}>•</span><p style={{fontFamily:C.IN,fontSize:11,color:C.dark,lineHeight:"16px"}}>{o}</p></div>)}
                        </div>
                      </div>
                      <div style={{background:"rgba(27,43,72,0.05)",borderLeft:"2px solid "+C.navyM,padding:"7px 11px",borderRadius:2,marginBottom:7}}>
                        <p style={{...lbl,color:C.navy,fontSize:9,marginBottom:3}}>Threat Assessment</p>
                        <p style={{fontFamily:C.IN,fontSize:11,color:C.dark,fontStyle:"italic",lineHeight:"17px"}}>{an.note}</p>
                      </div>
                      {an.watch?.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                        <span style={{...lbl,color:C.mute,fontSize:9}}>Monitor →</span>
                        {an.watch.map((w,j)=><span key={j} style={{fontFamily:C.IN,fontSize:10,fontWeight:600,background:C.ambB,color:C.amb,padding:"2px 7px",borderRadius:3,border:"1px solid "+C.ambD}}>{w}</span>)}
                      </div>}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


function Stakeholders() {
  const [sh,setSH]=useState(SH_FB);
  const [ld,setLd]=useState(false);
  const [er,setEr]=useState(null);
  const [sel,setSel]=useState(null);
  const [catF,setCatF]=useState("all");
  const [search,setSearch]=useState("");
  const [sfoc,setSfoc]=useState(false);
  const loaded=useRef(false);

  const CATS=[
    {id:"all",l:"All",icon:"apps"},{id:"government",l:"Government",icon:"account_balance"},
    {id:"military",l:"Military",icon:"military_tech"},{id:"business",l:"Business",icon:"business"},
    {id:"media",l:"Media",icon:"newspaper"},{id:"ngo",l:"NGO/IO",icon:"handshake"},
    {id:"think_tank",l:"Think Tank",icon:"school"},
  ];

  const load=useCallback(async()=>{
    setLd(true);setEr(null);
    try{
      const raw=await ai(
        `GCC diplomatic intelligence analyst. Today is ${DL}. Respond ONLY with a JSON array. Start with [ end with ].`,
        `Generate 10 key GCC and MENA stakeholders. Each: {"id":"8chars","name","role","org","cat":"government|military|business|media|ngo|think_tank","country","influence":"Tier 1|Tier 2|Tier 3","stance":"cooperative|neutral|adversarial","summary":"2 sentences","recentActivity":"2 sentences","watchItems":[3 strings]}. Include government officials, military figures, business leaders, media. Today: ${DL}.`,1800);
      const arr=pj(raw);
      if(Array.isArray(arr)&&arr.length>0){setSH(arr.map((s,i)=>({...SH_FB[i%SH_FB.length],...s,id:s.id||Math.random().toString(36).slice(2,10)})));}
      else{setSH(SH_FB);}
    }catch(e){setEr(e.message);setSH(SH_FB);}
    setLd(false);
  },[]);

  useEffect(()=>{if(!loaded.current){loaded.current=true;load();}},[load]);

  const filtered=sh.filter(s=>{
    if(catF!=="all"&&s.cat!==catF) return false;
    if(search.trim()){const q=search.toLowerCase();return s.name.toLowerCase().includes(q)||s.org.toLowerCase().includes(q)||s.country.toLowerCase().includes(q)||s.role.toLowerCase().includes(q);}
    return true;
  });
  const active=sel?sh.find(s=>s.id===sel):null;
  const ST={cooperative:{c:C.grn,bg:C.grnB},neutral:{c:C.amb,bg:C.ambB},adversarial:{c:C.red,bg:C.redB}};
  const IL={"Tier 1":{c:"#7f1d1d",bg:C.redB},"Tier 2":{c:C.amb,bg:C.ambB},"Tier 3":{c:C.blu,bg:C.bluB}};

  const shText = active ? [
    `STAKEHOLDER INTELLIGENCE PROFILE`,
    `Name: ${active.name}`,
    `Role: ${active.role} · ${active.org}`,
    `Country: ${active.country} | Category: ${active.cat} | Influence: ${active.influence} | Stance: ${active.stance}`,
    "",
    "SUMMARY",
    active.summary,
    "",
    "RECENT ACTIVITY",
    active.recentActivity,
    "",
    "WATCH ITEMS",
    ...(active.watchItems||[]).map((w,i)=>`${i+1}. ${w}`),
  ].join("\n") : "";

  return(
    <div>
      <PH label={"Stakeholder Registry · "+DS} title="Stakeholder Tracker"
        sub="Key government entities, military actors, business leaders, and influencers across GCC and MENA."
        action={<Btn onClick={load} ld={ld} icon="refresh" label="Refresh" primary/>}/>

      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
        {CATS.map(c=>{const on=catF===c.id;return(
          <button key={c.id} onClick={()=>setCatF(c.id)} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 11px",borderRadius:4,border:`1px solid ${on?C.navy:C.bd}`,background:on?C.navy:C.white,color:on?C.white:C.dark,fontFamily:C.IN,fontSize:11,fontWeight:on?600:400,cursor:"pointer",transition:"all 0.1s"}}>
            <I n={c.icon} s={12} c={on?C.white:C.mute}/>{c.l}
          </button>
        );})}
      </div>

      <div style={{...card,padding:"8px 12px",marginBottom:12,display:"flex",gap:8,alignItems:"center",borderColor:sfoc?C.navyM:C.bd,transition:"border-color 0.15s"}}>
        <I n="search" c={C.gold} s={14} sx={{flexShrink:0}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} onFocus={()=>setSfoc(true)} onBlur={()=>setSfoc(false)}
          placeholder="Search by name, organisation, country, role…"
          style={{flex:1,border:"none",background:"transparent",fontFamily:C.IN,fontSize:12,color:C.ink,outline:"none"}}/>
        {search&&<button onClick={()=>setSearch("")} style={{background:"transparent",border:"none",cursor:"pointer",color:C.mute,fontSize:12}}>✕</button>}
      </div>

      {ld&&sh.length===0&&<Loader msg="Loading stakeholder registry…"/>}
      {er&&<Err msg={er+" (showing fallback data)"}/>}

      <div style={{display:"grid",gridTemplateColumns:"290px 1fr",gap:12}}>
        <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:660,overflowY:"auto",paddingRight:3}}>
          {filtered.map(s=>{
            const on=sel===s.id;
            const st=ST[s.stance]||ST.neutral;
            const il=IL[s.influence]||IL["Tier 3"];
            return(
              <button key={s.id} onClick={()=>setSel(s.id===sel?null:s.id)} style={{...card,padding:"10px 12px",textAlign:"left",cursor:"pointer",border:`1px solid ${on?C.navy:C.bd}`,background:on?C.navy:C.white,transition:"all 0.1s"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <p style={{fontFamily:C.IN,fontSize:12,fontWeight:600,color:on?C.white:C.navy,lineHeight:"1.25"}}>{s.name}</p>
                  <span style={{...lbl,fontSize:8,color:on?C.goldL:il.c,background:on?"rgba(255,255,255,0.1)":il.bg,padding:"1px 5px",borderRadius:2,flexShrink:0,marginLeft:5}}>{s.influence}</span>
                </div>
                <p style={{fontFamily:C.IN,fontSize:10,color:on?"rgba(255,255,255,0.5)":C.mute,marginBottom:4}}>{s.role}</p>
                <div style={{display:"flex",gap:4,alignItems:"center"}}>
                  <span style={{fontFamily:C.IN,fontSize:10,color:on?"rgba(255,255,255,0.45)":C.mute}}>{COUNTRIES.find(c=>c.id===s.country)?.flag||"🌍"} {s.country}</span>
                  <span style={{...lbl,fontSize:8,color:on?C.goldL:st.c,background:on?"rgba(255,255,255,0.08)":st.bg,padding:"1px 5px",borderRadius:2}}>{s.stance}</span>
                </div>
              </button>
            );
          })}
          {filtered.length===0&&<p style={{fontFamily:C.IN,fontSize:12,color:C.mute,padding:"16px 0",textAlign:"center"}}>No stakeholders match current filters.</p>}
        </div>

        {active?(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{...navyC,padding:"16px 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <p style={{...lbl,color:C.gold,fontSize:9,marginBottom:5}}>{active.cat.replace("_"," ").toUpperCase()} · {active.country}</p>
                  <p style={{fontFamily:C.PF,fontSize:18,fontWeight:700,color:C.white,marginBottom:2}}>{active.name}</p>
                  <p style={{fontFamily:C.IN,fontSize:11,color:"rgba(255,255,255,0.5)"}}>{active.role} · {active.org}</p>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                  <span style={{...lbl,fontSize:9,color:(IL[active.influence]||IL["Tier 3"]).c,background:(IL[active.influence]||IL["Tier 3"]).bg,padding:"2px 9px",borderRadius:2,display:"block",marginBottom:5}}>{active.influence}</span>
                  <span style={{...lbl,fontSize:9,color:(ST[active.stance]||ST.neutral).c,background:(ST[active.stance]||ST.neutral).bg,padding:"2px 9px",borderRadius:2,display:"block"}}>{active.stance}</span>
                </div>
              </div>
              <p style={{fontFamily:C.IN,fontSize:12,color:"rgba(255,255,255,0.7)",lineHeight:"20px"}}>{active.summary}</p>
            </div>
            <div style={{...goldC,padding:"12px 16px"}}>
              <p style={{fontFamily:C.PF,fontSize:13,fontWeight:600,color:C.navy,marginBottom:8}}>Recent Activity</p>
              <p style={{fontFamily:C.IN,fontSize:12,color:C.dark,lineHeight:"20px"}}>{active.recentActivity}</p>
            </div>
            <div style={{...card,padding:"12px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}><I n="radar" c={C.navy} s={13}/><p style={{fontFamily:C.PF,fontSize:13,fontWeight:600,color:C.navy}}>Watch Items</p></div>
                <button onClick={()=>exportPDF(active.name+" — Stakeholder Profile",shText,REF)} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:4,border:`1px solid ${C.bd}`,background:C.white,color:C.dark,fontFamily:C.IN,fontSize:11,fontWeight:600,cursor:"pointer"}}><I n="picture_as_pdf" s={12} c={C.gold}/>PDF</button>
              </div>
              {(active.watchItems||[]).map((w,i)=>(
                <div key={i} style={{display:"flex",gap:7,padding:"6px 0",borderBottom:i<(active.watchItems||[]).length-1?`1px solid ${C.bd}`:""}}>
                  <span style={{color:C.gold,fontWeight:700,flexShrink:0}}>•</span>
                  <p style={{fontFamily:C.IN,fontSize:12,color:C.dark,lineHeight:"18px"}}>{w}</p>
                </div>
              ))}
            </div>
          </div>
        ):(
          <div style={{...card,padding:36,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <I n="person_search" c={C.mute} s={32} sx={{display:"block",marginBottom:9}}/>
            <p style={{fontFamily:C.PF,fontSize:16,fontWeight:600,color:C.navy,marginBottom:5}}>Select a Stakeholder</p>
            <p style={{fontFamily:C.IN,fontSize:12,color:C.mute}}>Click any name in the registry to view their intelligence profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}


function Tracker() {
  const [devs,setDevs]=useState(DEVS_FB);
  const [ld,setLd]=useState(false);
  const [er,setEr]=useState(null);
  const [catF,setCatF]=useState(null);
  const [ctyF,setCtyF]=useState(null);
  const [riskF,setRiskF]=useState(null);
  const loaded=useRef(false);

  const load=useCallback(async()=>{
    setLd(true);setEr(null);
    try{
      const raw=await ai(
        `GCC intelligence analyst. Today is ${DL}. Respond ONLY with a JSON array. Start with [ end with ].`,
        `Generate 12 GCC and MENA regional developments for ${DL}. Each: {"title"(max 14 words),"summary"(2 analytical sentences),"sector"(politics|security|economy|energy|diplomacy|military|technology|trade|humanitarian|society),"country"(any MENA/GCC country),"risk"(LOW|MEDIUM|HIGH),"src_type"(Official Statement|State Media|Think Tank|Independent Media|Social Media),"impl"(1 sentence diplomatic implication)}.`,1800);
      const arr=pj(raw);
      if(Array.isArray(arr)&&arr.length>0){setDevs(arr);}else{setDevs(DEVS_FB);}
    }catch(e){setEr(e.message);setDevs(DEVS_FB);}
    setLd(false);
  },[]);

  useEffect(()=>{if(!loaded.current){loaded.current=true;load();}},[load]);
  const allCtys=[...new Set(devs.map(d=>d.country))];
  const fil=devs.filter(d=>(!catF||d.sector===catF)&&(!ctyF||d.country===ctyF)&&(!riskF||d.risk===riskF));

  return(
    <div>
      <PH label={fil.length+" of "+devs.length+" Developments · "+DS} title="Regional Developments"
        action={<Btn onClick={load} ld={ld} icon="refresh" label="Refresh" primary/>}/>
      {ld&&devs.length===0&&<Loader msg="Scanning GCC and MENA developments…"/>}
      {er&&<Err msg={er+" (showing last data)"}/>}
      {devs.length>0&&(
        <>
          <div style={{...card,padding:"10px 14px",marginBottom:12,display:"flex",flexDirection:"column",gap:6}}>
            <FR label="Sector" items={SECTORS.filter(s=>s.id!=="all").map(s=>({v:s.id,l:s.l}))} active={catF} set={setCatF}/>
            <FR label="Country" items={allCtys.map(c=>({v:c,l:(COUNTRIES.find(x=>x.id===c)?.flag||"🌍")+" "+c}))} active={ctyF} set={setCtyF}/>
            <FR label="Risk" items={[{v:"LOW",l:"Stable"},{v:"MEDIUM",l:"Caution"},{v:"HIGH",l:"Critical"}]} active={riskF} set={setRiskF}/>
          </div>
          {ld&&<div style={{...goldC,padding:"10px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:8}}><svg width="14" height="14" viewBox="0 0 36 36" style={{animation:"sp 1.1s linear infinite",flexShrink:0}}><circle cx="18" cy="18" r="13" fill="none" stroke={C.gold} strokeWidth="2.5" strokeDasharray="58 20" strokeLinecap="round"/></svg><span style={{fontFamily:C.IN,fontSize:12,color:C.dark}}>Refreshing developments…</span></div>}
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {fil.map((d,i)=>{
              const sec=SECTORS.find(s=>s.id===d.sector)||SECTORS[1];
              const cty=COUNTRIES.find(c=>c.id===d.country);
              return(
                <div key={i} style={{...card,padding:"13px 16px",borderLeft:"3px solid "+sec.col,transition:"box-shadow 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow="0 3px 14px rgba(10,22,40,0.10)"}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow=card.boxShadow}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,gap:8}}>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                      <SB id={d.sector}/>
                      <span style={{fontFamily:C.IN,fontSize:11,color:C.mute}}>{cty?.flag||"🌍"} {d.country}</span>
                      <span style={{fontFamily:C.IN,fontSize:11,background:C.surf,color:C.dark,padding:"2px 6px",borderRadius:3}}>{d.src_type}</span>
                    </div>
                    <RB level={d.risk}/>
                  </div>
                  <p style={{fontFamily:C.PF,fontSize:14,fontWeight:600,color:C.navy,lineHeight:"1.4",marginBottom:5}}>{d.title}</p>
                  <p style={{fontFamily:C.IN,fontSize:12,color:C.dark,lineHeight:"18px",marginBottom:8}}>{d.summary}</p>
                  <div style={{background:C.surf,borderLeft:"2px solid "+C.navyM,padding:"6px 9px",borderRadius:2}}>
                    <p style={{...lbl,color:C.navy,fontSize:9,marginBottom:2}}>Implication →</p>
                    <p style={{fontFamily:C.IN,fontSize:11,color:C.dark,lineHeight:"17px"}}>{d.impl}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}


function Arabic() {
  const [inp,setInp]=useState("");
  const [res,setRes]=useState(null);
  const [ld,setLd]=useState(false);
  const [er,setEr]=useState(null);
  const [foc,setFoc]=useState(false);

  const run=useCallback(async()=>{
    if(!inp.trim()) return;
    setLd(true);setEr(null);setRes(null);
    try{
      const raw=await ai(
        `You are a senior GCC diplomatic intelligence analyst fluent in Arabic and English. Today is ${DL}.
Your task: analyse the Arabic text provided and return a JSON object with diplomatic intelligence.

IMPORTANT: Respond with ONLY a valid JSON object. No explanation, no markdown, no preamble. Start your response with { and end with }.

Required JSON keys:
- translation: complete English translation in formal diplomatic register
- register: one of: Official Government Statement, State Media, Independent Media, Think Tank, Social Media, Press Release
- headline: one English intelligence headline, maximum 15 words
- sector: one of: politics, security, economy, energy, diplomacy, military, technology, trade, humanitarian, society
- country: primary country this text is about
- risk: one of: LOW, MEDIUM, HIGH
- sentiment: one of: POSITIVE, NEUTRAL, NEGATIVE
- entities: array of 3 objects, each with name, type (Person|Organization|Location|Policy), note
- terms: array of 5 objects, each with ar (Arabic term), en (English equivalent), note (diplomatic significance)
- note: 2-3 sentence analytical assessment
- impl: 1 sentence embassy implication`,
        `Analyse this Arabic text and return the JSON intelligence report:\n\n${inp}`,
        1800);
      const v=pj(raw)||{};
      setRes({
        translation:v.translation||"Translation unavailable — please retry.",
        register:v.register||"Independent Media",
        headline:v.headline||"Arabic source requires analysis",
        sector:v.sector||"politics",
        country:v.country||"Regional",
        risk:v.risk||"LOW",
        sentiment:v.sentiment||"NEUTRAL",
        entities:Array.isArray(v.entities)?v.entities:[],
        terms:Array.isArray(v.terms)?v.terms:[],
        note:v.note||"Insufficient data for full assessment.",
        impl:v.impl||"Further context required.",
      });
    }catch(e){setEr(e.message);}
    setLd(false);
  },[inp]);

  const sec=res?SECTORS.find(s=>s.id===res.sector)||SECTORS[1]:null;
  const SC={POSITIVE:{c:C.grn,bg:C.grnB},NEUTRAL:{c:C.mute,bg:C.surf},NEGATIVE:{c:C.red,bg:C.redB}};

  const analysisText = res ? [
    `ARABIC INTELLIGENCE ANALYSIS`,
    `Date: ${DL}`,
    `Country: ${res.country} | Sector: ${res.sector} | Risk: ${res.risk} | Sentiment: ${res.sentiment}`,
    `Register: ${res.register}`,
    "",
    `HEADLINE: ${res.headline}`,
    "",
    "ENGLISH TRANSLATION",
    res.translation,
    "",
    "KEY ENTITIES",
    ...(res.entities||[]).map(e=>`• ${e.name} (${e.type}): ${e.note}`),
    "",
    "ANALYTICAL NOTE",
    res.note,
    "",
    "EMBASSY IMPLICATION",
    res.impl,
  ].join("\n") : "";

  return(
    <div>
      <PH label="Bilingual Analysis · AR/EN" title="Arabic Source Analyser" sub="Diplomatic-register translation, entity extraction, narrative detection, and intelligence assessment."/>
      <div style={{...goldC,padding:"18px 22px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
          <label style={{...lbl,color:C.dark,fontSize:10}}>Arabic Source Text</label>
          <div style={{display:"flex",gap:5}}>
            <span style={{fontFamily:C.IN,fontSize:11,color:C.mute}}>Sample texts:</span>
            {[
              {l:"Saudi Statement",t:"أعلنت وزارة الطاقة السعودية اليوم عن استثمارات جديدة بقيمة خمسة مليارات دولار في مجال الطاقة الشمسية، في إطار رؤية المملكة 2030. وأكد وزير الطاقة الأمير عبدالعزيز بن سلمان أن المملكة ماضية في تنويع مصادر الطاقة وتحقيق الاستدامة البيئية."},
              {l:"Yemen Report",t:"أفادت التقارير بتصاعد حدة المواجهات المسلحة في محافظة مأرب اليمنية، مع تبادل الاتهامات بين الأطراف المتحاربة. وأعربت الأمم المتحدة عن قلقها البالغ إزاء الوضع الإنساني المتدهور وتوقف إمدادات المساعدات إلى المناطق المتضررة."},
              {l:"UAE Economy",t:"أعلن صندوق أبوظبي للتنمية عن حزمة استثمارات جديدة في البنية التحتية الرقمية بمنطقة الشرق الأوسط وأفريقيا، بقيمة إجمالية تبلغ ثلاثة مليارات دولار. وتأتي هذه الخطوة في إطار استراتيجية الإمارات للتحول الرقمي وتعزيز اقتصاد المعرفة."},
            ].map(s=>(
              <button key={s.l} onClick={()=>setInp(s.t)} style={{fontFamily:C.IN,fontSize:10,fontWeight:500,background:"#dbeafe",color:"#1e40af",padding:"2px 9px",borderRadius:3,border:"none",cursor:"pointer"}}>{s.l}</button>
            ))}
          </div>
        </div>
        <textarea value={inp} onChange={e=>setInp(e.target.value)} onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
          placeholder="الصق النص العربي هنا — صحيفة، بيان رسمي، تقرير، تغريدة…" dir="rtl"
          style={{width:"100%",minHeight:110,padding:"10px 12px",background:C.surf,borderRadius:4,border:"1.5px solid "+(foc?C.navyM:C.bd),fontFamily:"monospace",fontSize:14,color:C.ink,lineHeight:"22px",resize:"vertical",boxSizing:"border-box",direction:"rtl",outline:"none",transition:"border-color 0.15s"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
          <span style={{fontFamily:C.IN,fontSize:11,color:C.mute}}>{inp.length} characters</span>
          <Btn onClick={run} ld={ld} icon="psychology" label="Analyse Source" primary/>
        </div>
      </div>
      {ld&&<Loader msg="Performing deep Arabic intelligence analysis…"/>}
      {er&&!ld&&<Err msg={er} retry={run}/>}
      {res&&!ld&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:12}}>
            {[{l:"Sector",v:<SB id={res.sector}/>},{l:"Country",v:<span style={{fontFamily:C.IN,fontSize:12,color:C.ink}}>{COUNTRIES.find(c=>c.id===res.country)?.flag} {res.country}</span>},{l:"Risk",v:<RB level={res.risk}/>},{l:"Sentiment",v:<span style={{...lbl,fontSize:10,color:(SC[res.sentiment]||SC.NEUTRAL).c,background:(SC[res.sentiment]||SC.NEUTRAL).bg,padding:"2px 7px",borderRadius:2}}>{res.sentiment}</span>},{l:"Register",v:<span style={{fontFamily:C.IN,fontSize:10,color:C.dark,lineHeight:"15px"}}>{res.register}</span>}].map(({l,v})=>(
              <div key={l} style={{...card,padding:"9px 12px"}}><p style={{...lbl,color:C.mute,fontSize:9,marginBottom:5}}>{l}</p>{v}</div>
            ))}
          </div>
          <div style={{...navyC,padding:"16px 20px",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div><p style={{...lbl,color:C.gold,fontSize:9,marginBottom:7}}>Intelligence Headline</p><p style={{fontFamily:C.PF,fontSize:19,fontWeight:700,color:C.white,lineHeight:"1.3"}}>{res.headline}</p></div>
              <button onClick={()=>exportPDF("Arabic Source Analysis — "+DS,analysisText,REF)} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:4,border:"1px solid rgba(255,255,255,0.2)",background:"transparent",color:C.goldL,fontFamily:C.IN,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0,marginLeft:12}}><I n="picture_as_pdf" s={12} c={C.goldL}/>PDF</button>
            </div>
          </div>
          <div style={{...goldC,padding:"16px 20px",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:9}}><I n="article" c={C.gold} s={15}/><p style={{fontFamily:C.PF,fontSize:14,fontWeight:600,color:C.navy}}>English Translation — Diplomatic Register</p></div>
            <p style={{fontFamily:C.IN,fontSize:14,color:C.dark,lineHeight:"23px"}}>{res.translation}</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            {res.entities.length>0&&<div style={{...card,padding:"12px 16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:9}}><I n="groups" c={C.navy} s={14}/><p style={{fontFamily:C.PF,fontSize:13,fontWeight:600,color:C.navy}}>Key Entities</p></div>
              {res.entities.map((e,i)=><div key={i} style={{padding:"6px 0",borderBottom:i<res.entities.length-1?`1px solid ${C.bd}`:""}}>
                <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:2}}><span style={{fontFamily:C.IN,fontSize:12,fontWeight:600,color:C.navy}}>{e.name}</span><span style={{...lbl,fontSize:8,color:C.gold,background:"#fef3c7",padding:"1px 5px",borderRadius:2}}>{e.type}</span></div>
                <p style={{fontFamily:C.IN,fontSize:11,color:C.dark,lineHeight:"15px"}}>{e.note}</p>
              </div>)}
            </div>}
            {res.terms.length>0&&<div style={{...card,padding:"12px 16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:9}}><I n="menu_book" c={C.navy} s={14}/><p style={{fontFamily:C.PF,fontSize:13,fontWeight:600,color:C.navy}}>Diplomatic Glossary</p></div>
              {res.terms.slice(0,5).map((t,i)=><div key={i} style={{padding:"6px 0",borderBottom:i<4?`1px solid ${C.bd}`:""}}>
                <div style={{display:"flex",gap:8,marginBottom:2}}><span style={{fontFamily:"monospace",fontSize:12,color:C.ink,direction:"rtl"}}>{t.ar}</span><span style={{fontFamily:C.IN,fontSize:11,fontWeight:600,color:C.navyM}}>= {t.en}</span></div>
                <p style={{fontFamily:C.IN,fontSize:10,color:C.dark}}>{t.note}</p>
              </div>)}
            </div>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:10}}>
            <div style={{...card,padding:"12px 16px"}}><p style={{fontFamily:C.PF,fontSize:13,fontWeight:600,color:C.navy,marginBottom:7}}>Analytical Note</p><p style={{fontFamily:C.IN,fontSize:13,color:C.dark,lineHeight:"21px"}}>{res.note}</p></div>
            <div style={{background:C.navy,borderLeft:"3px solid "+C.gold,borderRadius:4,padding:"12px 16px"}}><p style={{...lbl,color:C.gold,fontSize:9,marginBottom:6}}>Embassy Implication</p><p style={{fontFamily:C.IN,fontSize:12,color:"rgba(255,255,255,0.72)",lineHeight:"19px"}}>{res.impl}</p></div>
          </div>
        </>
      )}
    </div>
  );
}


function Drift() {
  const [topic,setTopic]=useState("");
  const [entries,setEntries]=useState([]);
  const [anal,setAnal]=useState(null);
  const [ld,setLd]=useState(false);
  const [er,setEr]=useState(null);
  const [foc,setFoc]=useState(false);
  const SAMPLES=["GCC-China strategic partnership","Yemen ceasefire negotiations","Saudi Vision 2030 reform pace","GCC energy transition","Iran nuclear diplomacy","Israel-GCC normalisation"];
  const SV={POSITIVE:1,NEUTRAL:0,NEGATIVE:-1},SC={POSITIVE:C.grn,NEUTRAL:C.mute,NEGATIVE:C.red},BH=55;

  const run=useCallback(async()=>{
    if(!topic.trim()) return;
    setLd(true);setEr(null);setEntries([]);setAnal(null);
    try{
      const r1=await ai(`GCC media framing analyst. Today is ${DL}. Respond ONLY with a JSON array. Start with [ end with ].`,
        `Generate 4-week GCC narrative drift for: "${topic}". Array of 4: {week(e.g."Week 1 — 4 weeks ago"),frame(6-8 words),sentiment(POSITIVE|NEUTRAL|NEGATIVE),phrases:[3 strings],actors:[2 strings],shift(1 sentence),mag(none|minor|significant)}.`,1000);
      let arr=pj(r1);
      if(!Array.isArray(arr)||arr.length===0) arr=[
        {week:"Week 1 — 4 weeks ago",frame:"cautious neutral engagement established",sentiment:"NEUTRAL",phrases:["strategic dialogue","mutual interests","bilateral cooperation"],actors:["Foreign ministries","State media"],shift:`Baseline framing established for ${topic}.`,mag:"none"},
        {week:"Week 2 — 3 weeks ago",frame:"economic dimensions increasingly prominent",sentiment:"POSITIVE",phrases:["investment corridors","trade expansion","economic partnership"],actors:["Commerce officials","Business councils"],shift:"Shift toward economic optimism following ministerial meetings.",mag:"minor"},
        {week:"Week 3 — 2 weeks ago",frame:"security concerns complicate economic agenda",sentiment:"NEUTRAL",phrases:["security preconditions","regional stability","risk factors"],actors:["Defence analysts","Think tanks"],shift:"Security framing emerged following unrelated regional incident.",mag:"significant"},
        {week:"Week 4 — this week",frame:"diplomatic reset signals renewed momentum",sentiment:"POSITIVE",phrases:["fresh dialogue","confidence building","constructive engagement"],actors:["Senior diplomats","International observers"],shift:"Return to positive framing after high-level diplomatic intervention.",mag:"minor"},
      ];
      setEntries(arr);
      const r2=await ai(`GCC analyst. Respond ONLY with valid JSON. Start with { end with }.`,
        `Analyse 4-week narrative drift for "${topic}": {summary(2-3 sentences),dominant(1 sentence),counter:[2 strings],influence_risk(Low|Medium|High),recommendation(1 sentence)}. Data: ${JSON.stringify(arr)}`,600);
      const a2=pj(r2)||{summary:`The narrative around ${topic} has shown ${arr.filter(e=>e.mag!=="none").length} significant shifts over four weeks.`,dominant:arr[arr.length-1]?.frame||"Ongoing engagement.",counter:["Security-focused counter-narrative from think tanks","Economic scepticism in independent media"],influence_risk:"Medium",recommendation:`Posts should monitor ${topic} closely and engage proactively with counterparts.`};
      setAnal(a2);
    }catch(e){setEr(e.message);}
    setLd(false);
  },[topic]);

  const driftText = entries.length>0 ? [
    `NARRATIVE DRIFT ANALYSIS: ${topic}`,
    `Generated: ${DL}`,
    "",
    ...entries.map(e=>`${e.week}\nDominant Frame: ${e.frame}\nSentiment: ${e.sentiment}\nKey Phrases: ${(e.phrases||[]).join(" | ")}\nActors: ${(e.actors||[]).join(", ")}\nShift: ${e.shift}`),
    "",
    anal?["ANALYTICAL ASSESSMENT",anal.summary,"",`Dominant Narrative: ${anal.dominant}`,"","Counter Narratives:",...(anal.counter||[]).map(c=>`• ${c}`),"",`Influence Campaign Risk: ${anal.influence_risk}`,"",`Recommendation: ${anal.recommendation}`].join("\n"):"",
  ].join("\n\n") : "";

  return(
    <div>
      <PH label="Narrative Analysis · Media Framing Intelligence" title="Narrative Drift Analyser" sub="Detect narrative shifts, influence campaigns, and topic evolution across GCC and MENA media."/>
      <div style={{...goldC,padding:"16px 20px",marginBottom:16}}>
        <label style={{...lbl,color:C.dark,display:"block",marginBottom:7,fontSize:10}}>Policy Topic to Track</label>
        <div style={{display:"flex",gap:8,marginBottom:9}}>
          <input value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&run()} onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
            placeholder="e.g. GCC-China strategic partnership"
            style={{flex:1,padding:"8px 12px",background:C.surf,border:"1.5px solid "+(foc?C.navyM:C.bd),borderRadius:4,fontFamily:C.IN,fontSize:13,color:C.ink,outline:"none",transition:"border-color 0.15s"}}/>
          <Btn onClick={run} ld={ld} icon="search" label="Track" primary/>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{SAMPLES.map(s=><button key={s} onClick={()=>setTopic(s)} style={{fontFamily:C.IN,fontSize:11,fontWeight:500,background:"#dbeafe",color:"#1e40af",padding:"3px 10px",borderRadius:999,border:"none",cursor:"pointer"}}>{s}</button>)}</div>
      </div>
      {ld&&<Loader msg="Analysing narrative drift across GCC media…"/>}
      {er&&!ld&&<Err msg={er} retry={run}/>}
      {entries.length>0&&!ld&&(
        <>
          <div style={{...goldC,padding:"16px 20px",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <p style={{fontFamily:C.PF,fontSize:14,fontWeight:600,color:C.navy}}>Sentiment Trajectory — {topic}</p>
              {anal&&<button onClick={()=>exportPDF("Narrative Drift — "+topic,driftText,REF)} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:4,border:`1px solid ${C.bd}`,background:C.white,color:C.dark,fontFamily:C.IN,fontSize:11,fontWeight:600,cursor:"pointer"}}><I n="picture_as_pdf" s={12} c={C.gold}/>PDF</button>}
            </div>
            <div style={{display:"flex",gap:4,height:BH*2+8,position:"relative",marginBottom:10}}>
              <div style={{position:"absolute",left:0,right:0,top:BH,borderTop:"1px dashed "+C.bd,zIndex:0}}/>
              {entries.map((e,i)=>{const s=SV[e.sentiment]??0,h=Math.abs(s)*BH,col=SC[e.sentiment]||C.mute,isP=s>=0;return(
                <div key={i} style={{flex:1,height:"100%",display:"flex",flexDirection:"column",alignItems:"center",zIndex:1}}>
                  <div style={{width:"55%",height:BH,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>{!isP&&<div style={{width:"100%",height:h||2,background:col+"30",border:"1px solid "+col,borderRadius:"2px 2px 0 0",transition:"height 0.6s ease"}}/>}</div>
                  <div style={{width:"55%",height:BH,display:"flex",flexDirection:"column",justifyContent:"flex-start"}}>{isP&&<div style={{width:"100%",height:h||2,background:col+"30",border:"1px solid "+col,borderRadius:"0 0 2px 2px",transition:"height 0.6s ease"}}/>}</div>
                </div>
              );})}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat("+entries.length+",1fr)"}}>
              {entries.map((e,i)=><div key={i} style={{textAlign:"center"}}><p style={{...lbl,color:C.mute,fontSize:8}}>W{i+1}</p><p style={{...lbl,color:SC[e.sentiment],fontSize:9}}>{e.sentiment}</p>{e.mag&&e.mag!=="none"&&<p style={{...lbl,fontSize:7,color:e.mag==="significant"?C.red:C.amb}}>{e.mag}</p>}</div>)}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            {entries.map((e,i)=>(
              <div key={i} style={{...card,padding:"12px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{...lbl,color:C.mute,fontSize:8}}>{e.week}</span><span style={{...lbl,color:SC[e.sentiment],fontSize:8}}>{e.sentiment}</span></div>
                <p style={{fontFamily:C.PF,fontSize:13,fontWeight:600,color:C.navy,lineHeight:"1.4",marginBottom:7}}>{e.frame}</p>
                {e.actors?.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>{e.actors.map((a,j)=><span key={j} style={{fontFamily:C.IN,fontSize:10,fontWeight:500,background:"#dbeafe",color:"#1e40af",padding:"2px 6px",borderRadius:3}}>{a}</span>)}</div>}
                <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:i>0?7:0}}>{(e.phrases||[]).map((p,j)=><span key={j} style={{fontFamily:C.MN,fontSize:10,color:C.dark,background:C.surf,padding:"2px 6px",borderRadius:2}}>"{p}"</span>)}</div>
                {i>0&&e.shift&&<div style={{background:C.surf,borderLeft:"2px solid "+C.navyM,padding:"6px 8px",borderRadius:2,marginTop:3}}><p style={{fontFamily:C.IN,fontSize:11,color:C.dark}}>↳ {e.shift}</p></div>}
              </div>
            ))}
          </div>
          {anal&&<div style={{...navyC,padding:"20px 24px"}}>
            <p style={{fontFamily:C.PF,fontSize:17,fontWeight:700,color:C.goldL,marginBottom:12}}>Analytical Assessment</p>
            <p style={{fontFamily:C.IN,fontSize:13,color:"rgba(255,255,255,0.75)",lineHeight:"21px",marginBottom:10}}>{anal.summary}</p>
            {anal.dominant&&<div style={{background:"rgba(255,255,255,0.05)",borderLeft:"2px solid "+C.gold,padding:"8px 12px",marginBottom:8,borderRadius:2}}><p style={{...lbl,color:C.gold,fontSize:9,marginBottom:3}}>Dominant Narrative</p><p style={{fontFamily:C.IN,fontSize:12,color:"rgba(255,255,255,0.8)",lineHeight:"18px"}}>{anal.dominant}</p></div>}
            {anal.counter?.length>0&&<div style={{marginBottom:8}}><p style={{...lbl,color:"rgba(255,255,255,0.4)",fontSize:8,marginBottom:5}}>Counter Narratives</p>{anal.counter.map((cn,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:3}}><span style={{color:C.goldD,fontSize:10,flexShrink:0}}>◆</span><p style={{fontFamily:C.IN,fontSize:12,color:"rgba(255,255,255,0.7)",lineHeight:"18px"}}>{cn}</p></div>)}</div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
              <div style={{background:"rgba(255,255,255,0.05)",borderLeft:"2px solid "+C.gold,padding:"8px 12px",borderRadius:2}}><p style={{...lbl,color:C.gold,fontSize:9,marginBottom:3}}>Influence Campaign Risk</p><p style={{fontFamily:C.IN,fontSize:14,fontWeight:700,color:anal.influence_risk==="High"?"#f87171":anal.influence_risk==="Medium"?C.goldD:"#4ade80"}}>{anal.influence_risk}</p></div>
              <div style={{background:"rgba(255,255,255,0.05)",borderLeft:"2px solid "+C.gold,padding:"8px 12px",borderRadius:2}}><p style={{...lbl,color:C.gold,fontSize:9,marginBottom:3}}>Recommendation</p><p style={{fontFamily:C.IN,fontSize:12,color:C.goldL,lineHeight:"18px"}}>{anal.recommendation}</p></div>
            </div>
          </div>}
        </>
      )}
    </div>
  );
}


function Compose() {
  const [type,setType]=useState("cable");
  const [notes,setNotes]=useState("");
  const [out,setOut]=useState(null);
  const [ld,setLd]=useState(false);
  const [er,setEr]=useState(null);
  const [cop,setCop]=useState(false);
  const [foc,setFoc]=useState(false);

  const TYPES=[
    {id:"media_alert",l:"Media Alert",icon:"notification_important",desc:"Urgent breaking alert"},
    {id:"talking_points",l:"Talking Points",icon:"format_list_bulleted",desc:"Senior official brief"},
    {id:"cable",l:"Policy Cable",icon:"description",desc:"Formal cable to HQ"},
    {id:"ministerial_brief",l:"Ministerial Brief",icon:"person",desc:"Visiting minister"},
    {id:"record_of_convo",l:"Record of Conversation",icon:"record_voice_over",desc:"Meeting ROC"},
  ];
  const PROMPTS={
    media_alert:"Write a MEDIA ALERT: CLASSIFICATION header, ALERT title, situation paragraph, risk level, 2-3 recommended actions. Max 200 words. ALL CAPS section headers.",
    talking_points:"Write TALKING POINTS: numbered messages 1-6, each with bold lead sentence and 2 supporting bullet sub-points. Include anticipated Q&A section.",
    cable:"Write a POLICY CABLE: OFFICIAL—SENSITIVE header, DATE/FROM/TO/SUBJ block, KEY JUDGEMENT, 1.SITUATION (2 paras), 2.ANALYSIS (2 paras), 3.RECOMMENDATIONS (3 numbered), 4.DISTRIBUTION LIST.",
    ministerial_brief:"Write a MINISTERIAL BRIEFING NOTE: PURPOSE (1 sentence), BACKGROUND (2 paras), KEY ISSUES (3 bullets), TALKING POINTS (4 numbered), RELEVANT CONTACTS (3 officials with titles).",
    record_of_convo:"Write a RECORD OF CONVERSATION: PARTICIPANTS (with titles), DATE/VENUE, PURPOSE, DISCUSSION (by agenda item, attributed), KEY OUTCOMES, FOLLOW-UP ACTIONS (officer + deadline), DISTRIBUTION.",
  };

  const run=useCallback(async()=>{
    if(!notes.trim()) return;
    setLd(true);setEr(null);setOut(null);
    try{
      const label=TYPES.find(d=>d.id===type)?.l||"Document";
      const txt=await ai(
        `Expert diplomatic writer. Today is ${DL}. Ref: ${REF}. ${PROMPTS[type]} Formal diplomatic English. Realistic fictional names for officials.`,
        `Compose a ${label} based on:\n\n${notes}`,1800);
      if(!txt||txt.trim().length<40) throw new Error("Output too short — add more detail to your notes and retry.");
      setOut(txt.trim());
    }catch(e){setEr(e.message);}
    setLd(false);
  },[notes,type]);

  const copy=()=>{if(out){navigator.clipboard.writeText(out);setCop(true);setTimeout(()=>setCop(false),2000);}};

  return(
    <div>
      <PH label="Document Generation · 5 Formats" title="Diplomatic Document Composer"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:16}}>
        {TYPES.map(d=><div key={d.id} onClick={()=>setType(d.id)} style={{...card,padding:"11px 12px",cursor:"pointer",borderTop:"3px solid "+(type===d.id?C.gold:C.bd),boxShadow:type===d.id?"0 2px 12px rgba(10,22,40,0.10)":card.boxShadow,transition:"all 0.12s"}}>
          <I n={d.icon} c={type===d.id?C.navy:C.mute} s={17} sx={{display:"block",marginBottom:6}}/>
          <p style={{fontFamily:C.IN,fontSize:11,fontWeight:600,color:type===d.id?C.navy:C.dark,marginBottom:2}}>{d.l}</p>
          <p style={{fontFamily:C.IN,fontSize:10,color:C.mute}}>{d.desc}</p>
        </div>)}
      </div>
      <div style={{...goldC,padding:"16px 20px",marginBottom:16}}>
        <label style={{...lbl,color:C.dark,display:"block",marginBottom:7,fontSize:10}}>Raw Notes / Source Information</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
          placeholder="Paste meeting notes, bullet points, news summary, or any raw information…"
          style={{width:"100%",minHeight:110,padding:"10px 12px",background:C.surf,borderRadius:4,border:"1.5px solid "+(foc?C.navyM:C.bd),fontFamily:C.IN,fontSize:13,color:C.ink,lineHeight:"21px",resize:"vertical",boxSizing:"border-box",outline:"none",transition:"border-color 0.15s"}}/>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}><Btn onClick={run} ld={ld} icon="auto_awesome" label="Compose Document" primary/></div>
      </div>
      {ld&&<Loader msg="Drafting in diplomatic register…"/>}
      {er&&!ld&&<Err msg={er} retry={run}/>}
      {out&&!ld&&(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
            <p style={{fontFamily:C.PF,fontSize:14,fontWeight:600,color:C.navy}}>Output — {TYPES.find(d=>d.id===type)?.l}</p>
            <div style={{display:"flex",gap:7}}>
              <button onClick={()=>exportPDF(TYPES.find(d=>d.id===type)?.l+" — "+DS,out,REF)} style={{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",borderRadius:4,border:`1px solid ${C.bd}`,background:C.white,color:C.dark,fontFamily:C.IN,fontSize:11,fontWeight:600,cursor:"pointer"}}><I n="picture_as_pdf" s={13} c={C.gold}/>Export PDF</button>
              <button onClick={copy} style={{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",borderRadius:4,border:"1px solid "+(cop?C.grnD:C.bd),background:cop?C.grnB:C.white,color:cop?C.grn:C.dark,fontFamily:C.IN,fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>
                <I n={cop?"check":"content_copy"} s={13} c={cop?C.grn:C.dark}/>{cop?"Copied":"Copy"}
              </button>
            </div>
          </div>
          <div style={{...goldC,overflow:"hidden"}}>
            <div style={{background:C.navy,padding:"9px 20px",display:"flex",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{height:1,width:22,background:"rgba(255,220,165,0.4)"}}/><span style={{...lbl,color:C.goldL,letterSpacing:"0.12em",fontSize:9}}>OFFICIAL — SENSITIVE</span><div style={{height:1,width:22,background:"rgba(255,220,165,0.4)"}}/></div>
              <span style={{fontFamily:C.MN,fontSize:9,color:"rgba(255,255,255,0.3)"}}>{DS}</span>
            </div>
            <div style={{padding:"20px 24px"}}><pre style={{fontFamily:C.IN,fontSize:13,lineHeight:"21px",color:C.ink,whiteSpace:"pre-wrap",margin:0}}>{out}</pre></div>
          </div>
        </>
      )}
    </div>
  );
}


function About() {
  return(
    <div>
      <PH title="About" label="Vision Intelligence Commons 2030 · Platform Overview"/>
      <div style={{...navyC,overflow:"hidden",marginBottom:14,position:"relative"}}>
        <div style={{position:"absolute",top:0,right:0,opacity:0.05,pointerEvents:"none"}}><I n="public" s={140} c={C.white}/></div>
        <div style={{padding:"22px 26px",position:"relative",zIndex:1}}>
          <p style={{...lbl,color:C.gold,fontSize:9,marginBottom:9}}>Built By</p>
          <p style={{fontFamily:C.PF,fontSize:20,fontWeight:700,color:C.white,marginBottom:9}}>Sajeeth Mazeez</p>
          <p style={{fontFamily:C.IN,fontSize:13,color:"rgba(255,255,255,0.65)",marginBottom:3}}>PMO & Policy Data Analytics Portfolio Project — GCC Strategic Intelligence Hub</p>
          <p style={{fontFamily:C.IN,fontSize:12,color:"rgba(255,255,255,0.35)"}}>June 2026 · PMP Candidate · Embassy of Sri Lanka, Riyadh</p>
        </div>
      </div>
      <div style={{...goldC,padding:"16px 20px",marginBottom:12}}>
        <p style={{fontFamily:C.PF,fontSize:16,fontWeight:700,color:C.navy,marginBottom:9}}>About This Platform</p>
        <p style={{fontFamily:C.IN,fontSize:14,color:C.dark,lineHeight:"23px",marginBottom:8}}>Vision Intelligence Commons 2030 is an AI-powered geopolitical and economic monitoring platform covering the full GCC — Saudi Arabia, UAE, Bahrain, Oman, Qatar, Kuwait, Yemen — plus MENA neighbours including Egypt, Jordan, Iraq, Syria, Lebanon, Iran, Turkey, and Pakistan.</p>
        <p style={{fontFamily:C.IN,fontSize:13,color:C.dark,lineHeight:"22px"}}>Every module replicates the daily workflow of a senior diplomatic policy analyst. All modules show immediate fallback data while AI generates live intelligence, ensuring zero blank screens. PDF export available on every module.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[
          {icon:"dashboard",   l:"Intelligence Dashboard",   d:"Live KPIs, alerts, country status, and regional pulse for all 7 GCC nations."},
          {icon:"description", l:"Intelligence Briefs",      d:"AI daily cables with Key Judgement, Situation, Analysis, and Impact Scores. PDF export."},
          {icon:"feed",        l:"Live Pipeline",            d:"AI-synthesised news from 10 GCC sources. Topic search, sector/risk filters, AI extraction."},
          {icon:"flag",        l:"Country Intelligence",     d:"Deep-dive profile per country: key developments, sector status, key actors, 30-day outlook."},
          {icon:"crisis_alert",l:"Security Alerts",         d:"Real-time threat monitoring with AI assessment, acknowledge workflow, auto-refresh."},
          {icon:"groups",      l:"Stakeholder Tracker",     d:"Government, military, business, media, NGO actor registry with full intelligence profiles."},
          {icon:"analytics",   l:"Developments Tracker",    d:"12 AI-synthesised developments, triple-filterable by sector, country, and risk."},
          {icon:"translate",   l:"Arabic Analyser",         d:"Translation, entity extraction, glossary, narrative detection, and embassy implication."},
          {icon:"trending_up", l:"Narrative Drift",         d:"4-week framing history with sentiment trajectory, influence campaign risk. PDF export."},
          {icon:"edit_note",   l:"Doc Composer",            d:"5 formats: Media Alert, Talking Points, Cable, Ministerial Brief, ROC. PDF export on all."},
        ].map((m,i)=>(
          <div key={i} style={{...card,padding:"11px 14px",display:"flex",gap:10,transition:"box-shadow 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 3px 12px rgba(10,22,40,0.09)"}
            onMouseLeave={e=>e.currentTarget.style.boxShadow=card.boxShadow}>
            <div style={{width:30,height:30,background:"#dbeafe",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I n={m.icon} c={C.navy} s={15}/></div>
            <div><p style={{fontFamily:C.IN,fontSize:12,fontWeight:600,color:C.navy,marginBottom:3}}>{m.l}</p><p style={{fontFamily:C.IN,fontSize:11,color:C.dark,lineHeight:"16px"}}>{m.d}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
const NAV=[
  {id:"dashboard",l:"Dashboard",icon:"dashboard"},
  {id:"brief",l:"Intelligence Briefs",icon:"description"},
  {id:"pipeline",l:"Live Pipeline",icon:"feed",live:true},
  {id:"country",l:"Country Intel",icon:"flag"},
  {id:"alerts",l:"Security Alerts",icon:"crisis_alert",live:true},
  {id:"stakehold",l:"Stakeholders",icon:"groups"},
  {id:"tracker",l:"Developments",icon:"analytics"},
  {id:"arabic",l:"Arabic Analyser",icon:"translate"},
  {id:"drift",l:"Narrative Drift",icon:"trending_up"},
  {id:"compose",l:"Doc Composer",icon:"edit_note"},
  {id:"about",l:"About",icon:"info"},
];

export default function App(){
  const[page,setPage]=useState("dashboard");
  const[notif,setNotif]=useState(false);
  const[sidebar,setSidebar]=useState(true);
  const clock=useClock();

  const modules={
    dashboard:<Dashboard go={setPage}/>,
    brief:<Brief/>,
    pipeline:<Pipeline/>,
    country:<CountryIntel/>,
    alerts:<SecurityAlerts/>,
    stakehold:<Stakeholders/>,
    tracker:<Tracker/>,
    arabic:<Arabic/>,
    drift:<Drift/>,
    compose:<Compose/>,
    about:<About/>,
  };

  return(
    <div style={{display:"flex",minHeight:"100vh",background:C.cream}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;display:inline-block;line-height:1;white-space:nowrap;text-transform:none;}
        *{box-sizing:border-box;margin:0;padding:0;}
        textarea,input{outline:none;font-family:inherit;}
        textarea::placeholder,input::placeholder{color:#9ca3af;opacity:0.8;}
        @keyframes sp{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes ticker{from{transform:translateX(100%)}to{transform:translateX(-100%)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:10px;}
        @media(max-width:768px){
          .sidebar{transform:translateX(-100%)!important;}
          .sidebar.open{transform:translateX(0)!important;}
          .main-content{margin-left:0!important;}
        }
        @media print{aside,header,footer,.no-print{display:none!important}main{margin-left:0!important;padding:16px!important}}
      `}</style>

      {/* SIDEBAR */}
      <aside className={"sidebar"+(sidebar?" open":"")} style={{width:220,minHeight:"100vh",background:C.navy,display:"flex",flexDirection:"column",position:"fixed",left:0,top:0,borderRight:"1px solid rgba(255,255,255,0.06)",zIndex:60,transition:"transform 0.25s"}}>
        {/* Logo */}
        <div style={{padding:"18px 16px 14px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <div style={{width:28,height:28,background:`linear-gradient(135deg,${C.gold},${C.goldL})`,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <I n="shield" s={14} c={C.navy}/>
            </div>
            <div>
              <p style={{fontFamily:C.PF,fontSize:14,fontWeight:700,color:C.white,lineHeight:1.2}}>Sovereign Intel</p>
              <p style={{fontFamily:C.IN,fontSize:"8px",fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(131,147,181,0.5)"}}>Vision Commons 2030</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{flex:1,padding:"6px 0",overflowY:"auto"}}>
          {NAV.map(item=>{
            const on=page===item.id;
            return(
              <button key={item.id} onClick={()=>setPage(item.id)}
                style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"9px 16px",border:"none",background:on?"rgba(255,255,255,0.09)":"transparent",borderLeft:`2px solid ${on?C.goldL:"transparent"}`,cursor:"pointer",color:on?C.white:"rgba(131,147,181,0.65)",fontFamily:C.IN,fontSize:12,fontWeight:on?600:400,transition:"all 0.1s",textAlign:"left"}}>
                <I n={item.icon} s={15} c={on?C.white:"rgba(131,147,181,0.55)"}/>
                <span style={{flex:1}}>{item.l}</span>
                {item.live&&<div style={{width:5,height:5,borderRadius:"50%",background:"#4ade80",animation:"pulse 2s infinite",flexShrink:0}}/>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{padding:"9px 11px 16px",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
          <button onClick={()=>setPage("brief")}
            style={{width:"100%",padding:8,background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:C.navy,border:"none",borderRadius:6,fontFamily:C.IN,fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,boxShadow:"0 2px 8px rgba(197,160,89,0.35)",transition:"filter 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.08)"}
            onMouseLeave={e=>e.currentTarget.style.filter="none"}>
            <I n="bolt" s={13} c={C.navy}/>Generate Briefing
          </button>
          <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:1}}>
            {[["security","Operational · June 2026"],["person","Sajeeth Mazeez · PMO"]].map(([ic,lb])=>(
              <div key={lb} style={{display:"flex",alignItems:"center",gap:5,padding:"3px 4px",color:"rgba(131,147,181,0.3)",fontFamily:C.IN,fontSize:10}}>
                <I n={ic} s={11} c="rgba(131,147,181,0.3)"/>{lb}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-content" style={{marginLeft:220,flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        {/* TOPBAR */}
        <header style={{position:"sticky",top:0,zIndex:50,height:52,background:C.cream,borderBottom:`1px solid ${C.bd}`,boxShadow:"0 1px 4px rgba(10,22,40,0.05)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {/* Mobile menu toggle */}
            <button onClick={()=>setSidebar(s=>!s)} style={{display:"none",background:"transparent",border:"none",cursor:"pointer",padding:4}} className="mobile-menu">
              <I n="menu" s={20} c={C.dark}/>
            </button>
            <I n="search" c={C.mute} s={15}/>
            <input placeholder="Search intelligence…" style={{background:"transparent",border:"none",fontFamily:C.IN,fontSize:12,color:C.ink,width:180}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {/* Live clock */}
            <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",background:C.surf,border:`1px solid ${C.bd}`,borderRadius:5}}>
              <I n="schedule" s={12} c={C.navy}/>
              <span style={{fontFamily:C.MN,fontSize:12,fontWeight:700,color:C.navy,letterSpacing:"0.05em"}}>{clock}</span>
              <span style={{...lbl,fontSize:8,color:C.mute}}>AST</span>
            </div>
            {/* AR/EN toggle */}
            <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",background:C.surf,border:`1px solid ${C.bd}`,borderRadius:5,cursor:"pointer",fontFamily:C.IN,fontSize:11,fontWeight:600,color:C.navy}}>
              <I n="translate" s={12} c={C.navy}/>AR/EN
            </div>
            {/* Notifications */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setNotif(!notif)} style={{background:C.surf,border:`1px solid ${C.bd}`,borderRadius:"50%",width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                <I n="notifications" s={16} c={C.dark}/>
              </button>
              <div style={{position:"absolute",top:4,right:4,width:7,height:7,borderRadius:"50%",background:C.red,border:`2px solid ${C.cream}`}}/>
              {notif&&(
                <div style={{position:"absolute",top:36,right:0,width:268,background:C.white,border:`1px solid ${C.bd}`,borderRadius:8,boxShadow:"0 8px 24px rgba(10,22,40,0.14)",padding:14,zIndex:100}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <p style={{...lbl,color:C.navy,fontSize:9}}>Notifications</p>
                    <button onClick={()=>setNotif(false)} style={{background:"transparent",border:"none",cursor:"pointer",color:C.mute,fontSize:16,lineHeight:1}}>×</button>
                  </div>
                  {[
                    {icon:"crisis_alert",col:C.red,msg:"CRITICAL: Houthi drone strike near Bab-el-Mandeb",time:"06:30"},
                    {icon:"security",col:C.amb,msg:"HIGH: Cyber threat targeting GCC energy infrastructure",time:"08:15"},
                    {icon:"info",col:C.blu,msg:"Aramco Q2 record production confirmed",time:"09:40"},
                  ].map((n,i)=>(
                    <div key={i} style={{display:"flex",gap:8,padding:"7px 0",borderBottom:i<2?`1px solid ${C.bd}`:"",cursor:"pointer",borderRadius:4,padding:"7px 4px",transition:"background 0.1s"}}
                      onMouseEnter={e=>e.currentTarget.style.background=C.surf}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <I n={n.icon} c={n.col} s={15} sx={{flexShrink:0,marginTop:1}}/>
                      <div>
                        <p style={{fontFamily:C.IN,fontSize:11,color:C.dark,lineHeight:"16px"}}>{n.msg}</p>
                        <p style={{fontFamily:C.MN,fontSize:10,color:C.mute,marginTop:2}}>{n.time} AST</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* BREAKING NEWS TICKER */}
        <div style={{background:C.navy,borderBottom:`1px solid rgba(255,255,255,0.06)`,height:28,overflow:"hidden",display:"flex",alignItems:"center"}}>
          <div style={{flexShrink:0,background:C.red,padding:"0 12px",height:"100%",display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:C.white,animation:"pulse 1s infinite"}}/>
            <span style={{...lbl,color:C.white,fontSize:8}}>LIVE</span>
          </div>
          <div style={{overflow:"hidden",flex:1,position:"relative",height:"100%"}}>
            <div style={{display:"flex",alignItems:"center",height:"100%",animation:"ticker 40s linear infinite",whiteSpace:"nowrap",paddingLeft:20}}>
              {["⚡ CRITICAL: Houthi drone campaign intensifies in Red Sea — LNG routes disrupted",
                "◆ Saudi Aramco Q2 output: record 9.8 million bpd — exceeds analyst forecasts by 4.2%",
                "◆ GCC Digital Currency Corridor — pilot transactions exceed AED 2.3bn in 48 hours",
                "◆ Qatar LNG Phase II: $18.7bn TotalEnergies-Shell deal signed in Doha",
                "⚡ HIGH: State-sponsored cyber campaign targeting GCC energy SCADA systems",
                "◆ UAE-India strategic logistics corridor agreement signed — $3.2bn over 7 years",
                "◆ Oman FM hosts Iran in Muscat for Hormuz maritime security consultations",
                "◆ Kuwait National Assembly passes Digital Economy Governance Law 42-8",
              ].map((item,i)=>(
                <span key={i} style={{fontFamily:C.IN,fontSize:11,color:"rgba(255,255,255,0.8)",marginRight:40}}>{item}</span>
              ))}
            </div>
          </div>
        </div>

        {/* PAGE CONTENT — all modules pre-mounted, show/hide prevents state loss */}
        <main style={{flex:1,padding:"22px 24px",maxWidth:1280,width:"100%",margin:"0 auto"}}>
          {Object.entries(modules).map(([id,el])=>(
            <div key={id} style={{display:page===id?"block":"none",animation:page===id?"fadeIn 0.25s ease":""}}>{el}</div>
          ))}
        </main>

        {/* FOOTER */}
        <footer style={{borderTop:`1px solid ${C.bd}`,background:C.cream,padding:"8px 24px",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:4}}>
          <p style={{fontFamily:C.IN,fontSize:10,color:C.mute}}>Vision Intelligence Commons 2030 · Sajeeth Mazeez · PMO & Policy Data Analytics · Embassy of Sri Lanka, Riyadh</p>
          <p style={{fontFamily:C.IN,fontSize:10,color:C.mute}}>v2030.3 · June 2026 · PMP Candidate</p>
        </footer>
      </div>
    </div>
  );
}
