(function(){
  "use strict";
  // The renderer takes its data from window.__TRENDS_DATA__ if present (single-file build),
  // otherwise it fetches the JSON named by this script tag's data-src (static-site build),
  // defaulting to dashboard_data.json next to the page.
  var SELF = document.currentScript;
  var DATA_URL = (SELF && SELF.getAttribute('data-src')) || 'dashboard_data.json';

  function fillMeta(m){
    document.querySelectorAll('[data-meta]').forEach(function(el){
      var k = el.getAttribute('data-meta'); if (m[k] != null) el.textContent = m[k];
    });
    document.querySelectorAll('[data-meta-html]').forEach(function(el){
      var k = el.getAttribute('data-meta-html'); if (m[k] != null) el.innerHTML = m[k];
    });
  }

  function boot(payload){

const DATA = payload.data || {};
const PALETTE = payload.palette || [];
const COOC = payload.cooc || {nodes:[], edges:[]};
fillMeta(payload.meta || {});
const CAT_COLORS = {Domains:'#4CC9F0', Algorithms:'#F72585', Architectures:'#FB8500', Simulators:'#06D6A0', Hardware:'#B5179E'};
const $ = id => document.getElementById(id);

// Chart theme tokens, read from the #trends-root CSS variables (fall back to the dark defaults).
// Override the variables in your own CSS and the charts retheme along with the page chrome.
const _root = $('trends-root') || document.body;
const _cs = getComputedStyle(_root);
const _cssvar = (n, fb) => { const v = _cs.getPropertyValue(n).trim(); return v || fb; };
const THEME = {
  font:    _cssvar('--trends-text',   '#c8ccd8'),
  title:   _cssvar('--trends-title',  '#ffffff'),
  grid:    _cssvar('--trends-grid',   'rgba(255,255,255,.08)'),
  zero:    _cssvar('--trends-zero',   'rgba(255,255,255,.30)'),
  accent:  _cssvar('--trends-accent', '#4CC9F0'),
  outline: _cssvar('--trends-bg',     '#0f1117')
};
let MODE = 'cum';     // 'cum' | 'per'
let NORM = 'count';   // 'count' | 'share'
let RECENT = 3;       // recent-window (years) for movers + lifecycle
let NODE_COUNT = 16;  // co-occurrence nodes shown
let LAST = {rows:[], years:[], yi:0};

const catSel=$('catSel'), yearSlider=$('yearSlider'), topNSlider=$('topNSlider'),
      kwFilter=$('kwFilter'), yearLabel=$('yearLabel'), topNLabel=$('topNLabel');

Object.keys(DATA).forEach(c => { const o=document.createElement('option'); o.value=c; o.textContent=c; catSel.appendChild(o); });

const sum = a => a.reduce((x,y)=>x+y,0);
function cumsum(a){ let s=0; return a.map(v=>s+=v); }
function color(i){ return PALETTE[i % PALETTE.length]; }
const darkLayoutBase = { paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'rgba(0,0,0,0)', font:{color:THEME.font} };

// value series for a keyword, honoring MODE (cum/per) and NORM (count/% share)
function valSeries(cat, kw){
  const raw = MODE==='cum' ? cumsum(cat.perYear[kw]) : cat.perYear[kw].slice();
  if (NORM === 'share'){
    const den = MODE==='cum' ? cumsum(cat.totalPerYear) : cat.totalPerYear;
    return raw.map((v,i)=> den[i] ? v/den[i]*100 : 0);
  }
  return raw;
}
const fmt = v => NORM==='share' ? (v ? v.toFixed(1)+'%' : '') : (v ? Math.round(v) : '');
const unit = () => NORM==='share' ? '%' : '';

function onCategoryChange(){
  const cat = DATA[catSel.value];
  yearSlider.max = cat.years.length-1;
  yearSlider.value = cat.years.length-1;   // open on most recent year
  render();
}

function render(){
  const cat = DATA[catSel.value];
  const years = cat.years;
  let yi = Math.min(+yearSlider.value, years.length-1);
  const topN = +topNSlider.value;
  const filter = kwFilter.value.trim().toLowerCase();
  yearLabel.textContent = years[yi];
  topNLabel.textContent = topN;

  renderMovers(cat, filter);
  renderLifecycle(cat);
  renderSectorCompare(cat);

  let kws = cat.keywords.filter(k => !filter || k.toLowerCase().includes(filter));
  let rows = kws.map(kw => { const s=valSeries(cat,kw); return {kw, val:s[yi]||0, series:s}; })
                .filter(r => r.val>0)
                .sort((a,b)=>b.val-a.val)
                .slice(0, topN);
  LAST = {rows, years, yi};

  const measure = NORM==='share' ? '% share' : 'papers';
  // Ranked bar at the selected year
  Plotly.react('barChart', [{
    type:'bar', orientation:'h',
    x: rows.map(r=>r.val).reverse(),
    y: rows.map(r=>r.kw).reverse(),
    marker:{ color: rows.map((r,i)=>color(i)).reverse() },
    hovertemplate:'%{y}: %{x:.2f}'+unit()+'<extra></extra>'
  }], Object.assign({}, darkLayoutBase, {
    title:{ text:(MODE==='cum'?'Cumulative '+measure+' through ':measure+' in ')+years[yi], font:{color:THEME.title,size:14} },
    margin:{l:230,r:24,t:40,b:30}, height:480,
    xaxis:{gridcolor:THEME.grid, ticksuffix:unit()}, yaxis:{automargin:true}
  }), {displayModeBar:false, responsive:true});

  // Trend lines over time for those keywords
  const traces = rows.map((r,i)=>({ type:'scatter', mode:'lines', name:r.kw, x:years, y:r.series, line:{color:color(i),width:2} }));
  Plotly.react('lineChart', traces, Object.assign({}, darkLayoutBase, {
    title:{ text:(MODE==='cum'?'Cumulative ':'Per-year ')+measure+' over time', font:{color:THEME.title,size:14} },
    margin:{l:54,r:16,t:40,b:36}, height:480, showlegend:true, legend:{font:{size:10}},
    xaxis:{gridcolor:THEME.grid}, yaxis:{gridcolor:THEME.grid, ticksuffix:unit()},
    shapes:[{type:'line', x0:years[yi], x1:years[yi], y0:0, y1:1, yref:'paper', line:{color:THEME.accent,width:1,dash:'dot'}}]
  }), {displayModeBar:false, responsive:true});

  buildTable(rows, years, yi);
}

// What's heating up / cooling down: recent-N-years share vs prior-years share.
function renderMovers(cat, filter){
  const years = cat.years, n = years.length;
  const rn = Math.min(RECENT, n-1);
  const recentTot = sum(cat.totalPerYear.slice(n-rn)), priorTot = sum(cat.totalPerYear.slice(0, n-rn));
  let arr = cat.keywords
    .filter(k => !filter || k.toLowerCase().includes(filter))
    .map(kw => {
      const p = cat.perYear[kw];
      const rs = recentTot ? sum(p.slice(n-rn))/recentTot*100 : 0;
      const ps = priorTot ? sum(p.slice(0, n-rn))/priorTot*100 : 0;
      return {kw, delta: rs-ps, rs, ps};
    });
  const risers = arr.filter(d=>d.delta>0).sort((a,b)=>b.delta-a.delta).slice(0,8);
  const fallers = arr.filter(d=>d.delta<0).sort((a,b)=>a.delta-b.delta).slice(0,8);
  let m = fallers.concat(risers).sort((a,b)=>a.delta-b.delta);  // ascending → most-negative at bottom
  if (!m.length){ Plotly.react('moversChart', [], {}); return; }

  Plotly.react('moversChart', [{
    type:'bar', orientation:'h',
    x: m.map(d=>d.delta), y: m.map(d=>d.kw),
    marker:{ color: m.map(d=> d.delta<0 ? '#EF476F' : '#06D6A0') },
    customdata: m.map(d=>[d.rs, d.ps]),
    hovertemplate:'<b>%{y}</b><br>Δ %{x:+.2f} pts<br>recent %{customdata[0]:.2f}% vs prior %{customdata[1]:.2f}%<extra></extra>'
  }], Object.assign({}, darkLayoutBase, {
    title:{text:'last '+rn+' yrs vs earlier', font:{color:THEME.title,size:13}},
    margin:{l:230,r:24,t:36,b:34}, height: Math.max(300, 26*m.length+80),
    xaxis:{title:'share change (percentage points)', zeroline:true, zerolinecolor:THEME.zero, gridcolor:THEME.grid},
    yaxis:{automargin:true}
  }), {displayModeBar:false, responsive:true});
}

// Co-occurrence network — laid out client-side so node count is adjustable.
function renderCooc(){
  const POOL = COOC.nodes;
  if (!POOL || !POOL.length){ $('coocChart').innerHTML = '<p style="color:#666">No co-occurrence data</p>'; return; }
  const K = Math.min(NODE_COUNT, POOL.length);

  // top-K by frequency (POOL is pre-sorted desc), then grouped by category around the ring
  const chosen = POOL.slice(0, K);
  const order = [];
  Object.keys(CAT_COLORS).forEach(c => chosen.filter(n=>n.cat===c).forEach(n=>order.push(n)));
  const m = order.length;
  const pos = {};
  order.forEach((nd,i)=>{
    const ang = 2*Math.PI*i/m - Math.PI/2;       // start at top, go clockwise
    nd.ang = ang; nd.x = Math.cos(ang); nd.y = Math.sin(ang);
    pos[nd.kw] = nd;
  });
  const shown = new Set(order.map(n=>n.kw));

  // edges among the shown nodes (cap to the strongest 70 to avoid a hairball)
  let E = COOC.edges.filter(e => shown.has(POOL[e.a].kw) && shown.has(POOL[e.b].kw));
  E.sort((a,b)=>b.w-a.w); E = E.slice(0, 70);
  const maxw = Math.max.apply(null, E.map(e=>e.w).concat([1]));
  const buckets = [[],[],[]];
  E.forEach(e=>{ const t=e.w/maxw; buckets[t>0.66?2:(t>0.33?1:0)].push(e); });
  const eo=[0.30,0.52,0.80], ew=[1.2,2.4,3.6];
  const edgeTraces = buckets.map((bk,bi)=>{
    const xs=[], ys=[];
    bk.forEach(e=>{ const a=pos[POOL[e.a].kw], b=pos[POOL[e.b].kw]; xs.push(a.x,b.x,null); ys.push(a.y,b.y,null); });
    return {x:xs, y:ys, mode:'lines', type:'scatter', hoverinfo:'skip', showlegend:false,
            line:{color:'rgba(255,196,87,'+eo[bi]+')', width:ew[bi]}};
  });

  // invisible hover targets at each edge midpoint — Plotly can't hover a line
  // segment, so this surfaces the co-occurrence count when you hover an edge
  const mx=[], my=[], mcd=[];
  E.forEach(e=>{
    const a=pos[POOL[e.a].kw], b=pos[POOL[e.b].kw];
    mx.push((a.x+b.x)/2); my.push((a.y+b.y)/2); mcd.push([POOL[e.a].kw, POOL[e.b].kw, e.w]);
  });
  const edgeHover = {
    x:mx, y:my, mode:'markers', type:'scatter', showlegend:false,
    marker:{size:18, color:'rgba(255,196,87,0.001)'}, customdata:mcd,
    hovertemplate:'%{customdata[0]} ↔ %{customdata[1]}<br><b>%{customdata[2]}</b> papers use both<extra></extra>'
  };

  // bounded node sizes so big topics don't swallow neighbours
  const maxF = Math.max.apply(null, order.map(n=>n.freq).concat([1]));
  const nodeSize = f => 11 + 24*Math.sqrt(f/maxF);
  const nodeTraces = Object.keys(CAT_COLORS).map(cat=>{
    const ns = order.filter(n=>n.cat===cat);
    return {
      x:ns.map(n=>n.x), y:ns.map(n=>n.y), text:ns.map(n=>n.kw), name:cat, mode:'markers', type:'scatter',
      marker:{ size:ns.map(n=>nodeSize(n.freq)), color:CAT_COLORS[cat], line:{color:THEME.outline, width:1.5} },
      customdata:ns.map(n=>n.freq),
      hovertemplate:'<b>%{text}</b><br>'+cat+' · %{customdata} papers<extra></extra>'
    };
  });

  // labels as annotations placed just OUTSIDE each node, radiating outward by angle —
  // so text never sits on a node or on another label.
  const labelR = 1.12;
  const annotations = order.map(nd => ({
    x: Math.cos(nd.ang)*labelR, y: Math.sin(nd.ang)*labelR, text: nd.kw, showarrow:false,
    font:{size:12, color:THEME.font},
    xanchor: nd.x > 0.25 ? 'left' : (nd.x < -0.25 ? 'right' : 'center'),
    yanchor: nd.y > 0.25 ? 'bottom' : (nd.y < -0.25 ? 'top' : 'middle')
  }));

  Plotly.react('coocChart', edgeTraces.concat([edgeHover], nodeTraces), Object.assign({}, darkLayoutBase, {
    height:820, margin:{l:10,r:10,t:10,b:10}, showlegend:true,
    legend:{font:{size:12}, bgcolor:'rgba(0,0,0,0)', x:0.5, xanchor:'center', orientation:'h', y:1.06},
    xaxis:{visible:false, range:[-2.5,2.5]}, yaxis:{visible:false, range:[-2.1,2.1], scaleanchor:'x'},
    annotations: annotations
  }), {displayModeBar:false, responsive:true});
}

// Lifecycle map: one interactive scatter — prominence (x) vs momentum (y), bubble = volume.
// Upper-right = hot & rising, lower = fading, left = niche. Replaces the static bar lists.
function renderLifecycle(cat){
  const years=cat.years, n=years.length, rn=Math.min(RECENT,n-1);
  const recentTot=sum(cat.totalPerYear.slice(n-rn)), priorTot=sum(cat.totalPerYear.slice(0,n-rn));
  const pts = cat.keywords.map(kw=>{
    const p=cat.perYear[kw];
    const rs = recentTot ? sum(p.slice(n-rn))/recentTot*100 : 0;
    const ps = priorTot ? sum(p.slice(0,n-rn))/priorTot*100 : 0;
    return {kw, prominence:rs, momentum:rs-ps, vol:sum(p)};
  }).filter(d=>d.vol>0);
  // label the most notable points (largest absolute momentum) to avoid clutter
  const labelSet = new Set(pts.slice().sort((a,b)=>Math.abs(b.momentum)-Math.abs(a.momentum)).slice(0,14).map(d=>d.kw));

  Plotly.react('lifecycleChart', [{
    type:'scatter', mode:'markers+text',
    x: pts.map(d=>d.prominence), y: pts.map(d=>d.momentum),
    text: pts.map(d=> labelSet.has(d.kw) ? d.kw : ''),
    textposition:'top center', textfont:{size:10, color:THEME.font},
    marker:{ size: pts.map(d=>9+3.4*Math.sqrt(d.vol)), opacity:0.82,
             color: pts.map(d=>d.momentum), colorscale:[[0,'#EF476F'],[0.5,'#8a8fa3'],[1,'#06D6A0']],
             cmid:0, line:{color:THEME.outline, width:1} },
    customdata: pts.map(d=>[d.kw, d.vol]),
    hovertemplate:'<b>%{customdata[0]}</b><br>prominence %{x:.2f}%<br>momentum %{y:+.2f} pts<br>%{customdata[1]} papers<extra></extra>'
  }], Object.assign({}, darkLayoutBase, {
    height:560, margin:{l:64,r:24,t:16,b:52},
    xaxis:{title:'recent prominence (% share, last '+rn+'y)', gridcolor:THEME.grid},
    yaxis:{title:'momentum (share change, pts)', gridcolor:THEME.grid,
           zeroline:true, zerolinecolor:THEME.zero},
    annotations:[
      {x:1,y:1,xref:'paper',yref:'paper',text:'↗ hot & rising',showarrow:false,font:{color:'#06D6A0',size:12},xanchor:'right',yanchor:'top'},
      {x:1,y:0,xref:'paper',yref:'paper',text:'↘ fading',showarrow:false,font:{color:'#EF476F',size:12},xanchor:'right',yanchor:'bottom'}
    ]
  }), {displayModeBar:false, responsive:true});
}

// Academia vs. industry: per-keyword share difference (industry − academia).
function renderSectorCompare(cat){
  const el = $('sectorChart');
  const sec = cat.sector;
  if (!sec || (sec.totalA + sec.totalI) === 0){
    Plotly.purge(el);
    el.innerHTML = '<p style="color:#777; font-size:13px; padding:20px 4px;">No academia/industry data yet — run step 4 (<code>enrich_affiliations.py</code>) to populate this.</p>';
    return;
  }
  el.innerHTML = '';
  let rows = Object.keys(sec.kw).map(kw=>{
    const a = sec.totalA ? sec.kw[kw].A/sec.totalA*100 : 0;
    const i = sec.totalI ? sec.kw[kw].I/sec.totalI*100 : 0;
    return {kw, a, i, skew:i-a, vol:sec.kw[kw].A+sec.kw[kw].I};
  }).filter(r=>r.vol>0);
  rows.sort((x,y)=>x.skew-y.skew);
  // most academia-leaning + most industry-leaning
  let pick = rows.slice(0,10).concat(rows.slice(-10));
  const seen=new Set(); pick = pick.filter(r=> seen.has(r.kw)?false:(seen.add(r.kw),true));
  pick.sort((x,y)=>x.skew-y.skew);

  Plotly.react('sectorChart', [{
    type:'bar', orientation:'h', x:pick.map(r=>r.skew), y:pick.map(r=>r.kw),
    marker:{color: pick.map(r=> r.skew<0 ? '#4CC9F0' : '#FB8500')},   // blue=academia, orange=industry
    customdata: pick.map(r=>[r.a, r.i]),
    hovertemplate:'%{y}<br>academia %{customdata[0]:.1f}% · industry %{customdata[1]:.1f}%<br>skew %{x:+.1f} pts<extra></extra>'
  }], Object.assign({}, darkLayoutBase, {
    title:{text:'← academia-leaning      industry-leaning →', font:{color:THEME.title, size:13}},
    margin:{l:230,r:24,t:36,b:42}, height:Math.max(320, 26*pick.length+90),
    xaxis:{title:'share difference (industry − academia, pts)', zeroline:true,
           zerolinecolor:THEME.zero, gridcolor:THEME.grid},
    yaxis:{automargin:true}
  }), {displayModeBar:false, responsive:true});
}

function buildTable(rows, years, yi){
  let h='<table class="pivot"><thead><tr><th class="kw">Keyword</th>';
  years.forEach((y,idx)=> h+='<th class="'+(idx===yi?'sel':'')+'">'+y+'</th>');
  h+='<th>Total</th></tr></thead><tbody>';
  rows.forEach(r=>{
    h+='<tr><td class="kw" title="'+r.kw+'">'+r.kw+'</td>';
    r.series.forEach((v,idx)=> h+='<td class="'+(idx===yi?'sel':'')+'">'+fmt(v)+'</td>');
    h+='<td class="tot">'+fmt(MODE==='cum' ? r.series[r.series.length-1] : sum(r.series))+'</td></tr>';
  });
  h+='</tbody></table>';
  $('pivotTable').innerHTML = h;
}

function exportCSV(){
  const {rows, years} = LAST;
  let lines = ['Keyword,'+years.join(',')+',Total'];
  rows.forEach(r=>{
    const total = MODE==='cum' ? r.series[r.series.length-1] : sum(r.series);
    const cells = r.series.map(v => NORM==='share' ? (v||0).toFixed(2) : Math.round(v||0));
    lines.push('"'+r.kw.replace(/"/g,'""')+'",'+cells.join(',')+','+(NORM==='share'?total.toFixed(2):Math.round(total)));
  });
  const blob = new Blob([lines.join('\n')], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'trends_'+catSel.value+'_'+MODE+'_'+NORM+'.csv';
  a.click();
}

// wire controls
catSel.addEventListener('change', onCategoryChange);
yearSlider.addEventListener('input', render);
topNSlider.addEventListener('input', render);
kwFilter.addEventListener('input', render);
$('csvBtn').addEventListener('click', exportCSV);
document.querySelectorAll('#modeSeg button').forEach(b => b.addEventListener('click', ()=>{
  MODE = b.dataset.mode;
  document.querySelectorAll('#modeSeg button').forEach(x=>x.classList.toggle('on', x===b));
  render();
}));
document.querySelectorAll('#normSeg button').forEach(b => b.addEventListener('click', ()=>{
  NORM = b.dataset.norm;
  document.querySelectorAll('#normSeg button').forEach(x=>x.classList.toggle('on', x===b));
  render();
}));
document.querySelectorAll('#recentSeg button').forEach(b => b.addEventListener('click', ()=>{
  RECENT = +b.dataset.recent;
  document.querySelectorAll('#recentSeg button').forEach(x=>x.classList.toggle('on', x===b));
  render();
}));
$('nodeSlider').addEventListener('input', ()=>{
  NODE_COUNT = +$('nodeSlider').value;
  $('nodeLabel').textContent = NODE_COUNT;
  renderCooc();
});

renderCooc();
onCategoryChange();
  }  // ── end boot ──

  function start(){
    if (window.__TRENDS_DATA__){ boot(window.__TRENDS_DATA__); return; }
    fetch(DATA_URL)
      .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + DATA_URL); return r.json(); })
      .then(boot)
      .catch(function(err){
        console.error('[trends-dashboard] could not load ' + DATA_URL, err);
        var el = document.getElementById('trends-root');
        if (el){
          var p = document.createElement('p');
          p.style.cssText = 'color:#EF476F; text-align:center; padding:24px; font-family:sans-serif;';
          p.textContent = 'Could not load dashboard data (' + DATA_URL + '). See the browser console.';
          el.appendChild(p);
        }
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
