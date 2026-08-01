/* ============================================================================
   Profit Cause Map — app.js (v1.1)
   ----------------------------------------------------------------------------
   All logic for index.html. No dependencies, no build step, plain ES2020.

   TWO VIEWS
     Map          — the cause-and-effect web (drag, pan, zoom, edit, link)
     Step by step — the same data read as a linear, plain-English story:
                    chapters (CHAPTERS below) → cards in teaching order →
                    each card lists what pushes it up / drags it down.

   DATA MODEL
     Node: { id, name, ws, kind, src, note, bench, x, y }
       ws    workspace: 'core' | 'shopify' | 'tiktok' | 'creators' | 'ops'
       kind  'outcome' (a result) | 'driver' (a lever) | 'cost' | 'health'
             (health = a ratio with a pass/fail rule — the check-ups)
       src   where the number comes from:
             'xero' | 'shopify' | 'tiktok' | 'meta' | 'derived' | 'manual'
       bench optional plain-English rule shown on the card
     Link: { id, from, to, sign, label }
       sign  '+' source pushes target the SAME direction (green solid)
             '-' source pushes target the OPPOSITE way (red dashed)
       Colour is direction of effect, NOT good/bad.

   The filled-out example lives in defaultGraph() below — edit it there, or
   edit live in the UI (autosaves to localStorage under 'kpi-map-v2';
   "Reset example" restores defaultGraph()).

   EXTENDING (for future AI/dev sessions):
     - Add a workspace: extend WS + CHAPTERS + add a filter chip in index.html.
     - Add a data source: extend SRCS.
     - Wire live data: give nodes a `value` field and render it in the card
       (see render()); health cards could compare value vs bench rule.
   ========================================================================= */

/* ================= data model ================= */
const WS = {
  core:{label:'Profit', color:'var(--core)'},
  shopify:{label:'Shopify', color:'var(--shopify)'},
  tiktok:{label:'TikTok', color:'var(--tiktok)'},
  creators:{label:'Creators & Staff', color:'var(--creators)'},
  ops:{label:'Product & Post', color:'var(--ops)'},
};
const KINDS = {outcome:'Result', driver:'Lever', cost:'Cost', health:'Check-up'};
const SRCS = {xero:'Xero', shopify:'Shopify', tiktok:'TikTok Shop', meta:'Meta Ads', derived:'Calculated', manual:'Manual'};

/* chapter order + intro text for the step-by-step view */
const CHAPTERS = [
  {ws:'core', title:'Did we actually make money?',
   story:'Start here every month, with one question: after every cost, how much did we keep? Everything further down this page exists only to explain this number.'},
  {ws:'shopify', title:'Shop 1 — the website (Shopify)',
   story:'Think of subscriptions as a bucket. New subscribers pour in at the top; cancellations leak out of the bottom. Ads fill the bucket — but only make sense if a subscriber ends up worth more than they cost to win.'},
  {ws:'tiktok', title:'Shop 2 — TikTok',
   story:'Videos bring views, views bring sales. But TikTok takes a cut of every sale and creators take commission — so £100 of TikTok sales is never £100 in the bank.'},
  {ws:'creators', title:'The people who make the videos',
   story:'Creators are paid two ways: a fixed monthly retainer, or commission on what they sell. The trap: retainers get paid whether or not the videos arrive. So never count videos — count what each video really cost.'},
  {ws:'ops', title:'Making and posting the product',
   story:'Every tub costs money to make, store and post before anyone sees profit. Margins in this industry are good — the quieter danger is cash locked up in stock.'},
];

const NODE_W = 176;
function nodeH(n){ return n.bench ? 92 : 62; }

/* ---- the filled-out example map ---- */
function defaultGraph(){
  const N = (id,name,ws,kind,src,x,y,note='',bench='') => ({id,name,ws,kind,src,x,y,note,bench});
  const L = (from,to,sign,label='') => ({id:'l_'+from+'_'+to, from,to,sign,label});
  return {
    nodes:[
      /* ---- profit core ---- */
      N('net_profit','Money we keep (net profit)','core','outcome','xero',1050,90,'Sales minus every cost. This is the number the whole map explains. It comes from Xero, because the bank feed catches every cost — including the ones the Shopify and TikTok dashboards never show.'),
      N('net_margin','Pence kept per £1 of sales','core','health','derived',1300,70,'Money kept ÷ money in. If sales grow but this shrinks, growth is costing more than it brings in.','Watch the trend: sales up but pence-per-£ down = buying growth'),
      N('cash','Cash in the bank','core','outcome','xero',1560,90,'Profit and cash are not the same thing. Retainers and stock are paid up front; subscription money arrives bit by bit. You can be profitable on paper and still run out of cash.'),
      N('revenue','Money in (all sales)','core','outcome','xero',810,250,'Both shops added together. Check it against Xero — the platforms pay out only after taking their cut.'),
      N('total_costs','Money out (all costs)','core','cost','xero',1290,250,'Every cost line feeds this. If it is not in Xero, it is not counted — which is why the bank feed is the backbone of the whole system.'),
      N('channel_mix','Are we leaning on one shop?','core','health','derived',1050,420,'A great month that all came from one place is fragile, not strong. Balanced is stable.','Warning if one shop is over 75% of sales'),

      /* ---- Shopify ---- */
      N('shopify_rev','Shopify sales','shopify','outcome','shopify',330,250,'Subscriptions plus one-off orders, after refunds and discounts.'),
      N('sub_rev','Subscription sales (repeat)','shopify','driver','shopify',120,400,'The most valuable money in the business — it repeats every month without new ad spend.'),
      N('oneoff_rev','One-off orders','shopify','driver','shopify',400,400,'First-time and gift orders. Their real job is to turn buyers into subscribers.'),
      N('active_subs','People currently subscribed','shopify','driver','shopify',120,540,'The water level in the bucket: new subscribers pour in, cancellations leak out.'),
      N('aov','Average order size (£)','shopify','driver','shopify',430,540,'Bigger bundles and multi-flavour packs raise this. Raising it makes every other number work harder — without spending a penny more on ads.'),
      N('churn','Cancellations each month (%)','shopify','driver','shopify',60,700,'The quiet killer of subscription businesses. A small rise here can wipe out a great month of ads.','Normal for products like this: 5–8% a month. Worry above 9%'),
      N('new_subs','New subscribers each month','shopify','driver','shopify',300,700,'Mostly comes from ads. Always read next to cancellations — the real number is subscribers gained minus subscribers lost.'),
      N('discounts','Intro discounts','shopify','driver','manual',520,780,'Gets more people to try, but cheapens the first order and can attract bargain-hunters who cancel fast.'),
      N('meta_spend','Facebook & Instagram ad spend','shopify','cost','meta',300,880,'The biggest cost we choose on this side. Ad prices keep rising, so getting better at ads matters more than spending more on them.'),
      N('creative_perf','Ad quality (do people click & buy?)','shopify','driver','meta',80,880,'When ads go stale, each new customer quietly gets more expensive — even though spend looks the same.'),
      N('cac','Cost to win one customer','shopify','health','derived',290,1030,'Everything spent on winning customers ÷ customers won. Count agency and content costs too, not just the ads themselves.','Typical: £60–120. Worry if it rises two months running'),
      N('ltv','What a subscriber is worth (lifetime)','shopify','health','derived',60,1030,'Profit per order × how many orders before they cancel. Cancellations and order size move this — ads do not.','Typical for products like this: £100–240 over a year'),
      N('ltv_cac','Worth vs cost to win','shopify','health','derived',170,1190,'The single most important ads question. Below 3×, "growth" is really buying customers at a loss.','Healthy: a customer is worth at least 3× what they cost to win'),
      N('payback','Months to earn the ad money back','shopify','health','derived',400,1190,'How long a new subscriber takes to repay what they cost to win. The shorter this is, the faster you can safely spend more.','Healthy: under 6 months'),

      /* ---- TikTok ---- */
      N('tiktok_rev','TikTok Shop sales','tiktok','outcome','tiktok',1810,250,'Sales before TikTok takes its cut. The payout that lands in the bank is smaller — reconcile with Xero.'),
      N('views','Video views','tiktok','driver','tiktok',2070,400,'Views are rented attention, not owned. They only matter if viewers buy.'),
      N('tt_conv','Do viewers actually buy? (%)','tiktok','driver','tiktok',2070,540,'Video → product page → checkout. If this is weak, big view numbers are just vanity.'),
      N('videos','Videos posted','tiktok','driver','tiktok',1810,540,'More videos usually means more sales — but never read this number alone. Read it with "what each video really costs".'),
      N('tt_fees','TikTok’s cut (~11%)','tiktok','cost','tiktok',1570,400,'9% commission plus card fees on every sale, and optional TikTok ad programmes on top. It grows automatically as sales grow — a cost nobody ever signs off.'),
      N('aff_comm','Commission paid to creators (10–20%)','tiktok','cost','tiktok',1930,690,'We set the rate. Higher commission attracts more creators (good) and eats margin (bad) — a negative in one place that is a positive in another.'),
      N('samples','Free product sent to creators','tiktok','cost','xero',2180,690,'Cheap per unit, but it is real product and real money — it must be recorded, not vanish.'),

      /* ---- creators & staff ---- */
      N('active_creators','Creators who posted this month','creators','driver','tiktok',1930,860,'Only count creators who actually posted — not everyone we have ever signed.'),
      N('new_creators','New creators joining','creators','driver','manual',2180,860,'The pipeline. If this dries up now, sales dry up next quarter.'),
      N('retainers','Monthly retainers paid','creators','cost','xero',1660,860,'Fixed pay for promised videos. The catch: it does not shrink when the videos do not get made.'),
      N('staff_cost','Staff wages','creators','cost','xero',1420,860,'The people who find and look after creators. More good managers → more creators looked after properly.'),
      N('cost_per_video','What each video really costs','creators','health','derived',1660,1030,'Retainers ÷ videos posted. "59 videos, up 9%" sounds great — but if retainer spend doubled, each video cost far more than last month. This is the honest version of the video count.','Typical: £25–120 a video. Worry if this rises while videos don’t'),
      N('delivery','Do we get the videos we pay for? (%)','creators','health','derived',1420,1030,'Videos delivered ÷ videos promised, per creator. Catches paying for work that never arrives.','Healthy: at least 90% of promised videos delivered'),
      N('rev_per_creator','Sales each creator brings in','creators','health','derived',1930,1030,'Sort highest to lowest: this list decides who earns a retainer and who stays commission-only.','Compare against what that creator costs in total'),
      N('concentration','How much rests on one creator?','creators','health','derived',2180,1030,'Profit up 100% looks great — but if 80% of it came from one person, one falling-out ruins a quarter. Strong and stable are different things.','Warning if one creator drives over 30% of TikTok sales'),
      N('mgr_capacity','Creators per staff member','creators','health','derived',1420,1190,'Overloaded managers → neglected creators → missed videos later. This predicts problems before they show up.','Roughly 25–40 creators each is manageable'),

      /* ---- product & post ---- */
      N('cogs','Cost to make one unit','ops','cost','xero',700,960,'Powder, sachets or tub, factory fee, shipping it in. Gets cheaper per unit as orders grow — worth renegotiating at volume.','Typical: £3–7 a unit for a £25–60 product'),
      N('inventory','Cash sitting in stock','ops','cost','xero',480,960,'Factories make you order big batches. Growing sales means bigger batches — cash gets locked in boxes even while the business is profitable.'),
      N('fulfilment','Cost to pack & post an order','ops','cost','xero',700,1130,'Every order pays this. Subscription orders are predictable, so they are cheaper to handle than one-offs.'),
      N('gross_margin','Profit after making the product (%)','ops','health','derived',940,880,'What is left after the product itself is paid for. Good in this industry — the real fight is lower down, after ads and fees.','Normal for supplements: 65–80%'),
      N('contribution','Profit on a typical order, after everything','ops','health','derived',950,1060,'After product, postage, platform fees AND the cost of winning the customer. The truest "are we making money per order" number.','Healthy: 35–60p kept per £1. Under 30p, growth won’t pay'),
    ],
    links:[
      /* core */
      L('revenue','net_profit','+'), L('total_costs','net_profit','-'),
      L('net_profit','net_margin','+'), L('net_profit','cash','+'),
      L('shopify_rev','revenue','+'), L('tiktok_rev','revenue','+'),
      L('shopify_rev','channel_mix','+'), L('tiktok_rev','channel_mix','+'),
      /* shopify chain */
      L('sub_rev','shopify_rev','+'), L('oneoff_rev','shopify_rev','+'),
      L('active_subs','sub_rev','+'), L('aov','sub_rev','+'),
      L('new_subs','active_subs','+'), L('churn','active_subs','-'),
      L('meta_spend','new_subs','+'), L('meta_spend','total_costs','+'),
      L('discounts','new_subs','+'), L('discounts','aov','-'),
      L('meta_spend','cac','+'), L('creative_perf','cac','-'),
      L('churn','ltv','-'), L('aov','ltv','+'), L('gross_margin','ltv','+'),
      L('ltv','ltv_cac','+'), L('cac','ltv_cac','-'),
      L('cac','payback','+'), L('aov','payback','-'),
      /* tiktok chain */
      L('videos','views','+'), L('views','tiktok_rev','+'), L('tt_conv','tiktok_rev','+'),
      L('tiktok_rev','tt_fees','+','grows with sales'), L('tt_fees','total_costs','+'),
      L('tiktok_rev','aff_comm','+'), L('aff_comm','total_costs','+'),
      L('aff_comm','active_creators','+','higher rate attracts'),
      L('samples','active_creators','+'), L('samples','total_costs','+'),
      /* creators */
      L('active_creators','videos','+'), L('new_creators','active_creators','+'),
      L('retainers','videos','+','promised volume'), L('retainers','total_costs','+'),
      L('staff_cost','active_creators','+','looked after'), L('staff_cost','total_costs','+'),
      L('retainers','cost_per_video','+'), L('videos','cost_per_video','-'),
      L('videos','delivery','+'),
      L('tiktok_rev','rev_per_creator','+'), L('active_creators','rev_per_creator','-'),
      L('tiktok_rev','concentration','+','split per creator'),
      L('active_creators','mgr_capacity','+'), L('staff_cost','mgr_capacity','-'),
      L('mgr_capacity','delivery','-','overload hurts'),
      /* product & post */
      L('cogs','gross_margin','-'), L('aov','gross_margin','+'),
      L('cogs','total_costs','+'), L('fulfilment','total_costs','+'),
      L('gross_margin','contribution','+'), L('fulfilment','contribution','-'),
      L('cac','contribution','-'), L('tt_fees','contribution','-'), L('aff_comm','contribution','-'),
      L('inventory','cash','-','batches lock cash'),
      L('discounts','gross_margin','-'),
    ],
  };
}

/* ================= state ================= */
const STORE_KEY = 'kpi-map-v2';
let state = load();
let view = {x:0, y:0, s:1};
let sel = null;            // {type:'node'|'link', id}
let filter = 'all';
let linkMode = false, pendingFrom = null;
let viewMode = 'map';      // 'map' | 'linear'
let idSeq = Date.now();

function load(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw){ const g = JSON.parse(raw); if(g.nodes && g.links) return g; }
  }catch(e){}
  return defaultGraph();
}
let saveT = null;
function save(){ clearTimeout(saveT); saveT = setTimeout(()=>localStorage.setItem(STORE_KEY, JSON.stringify(state)), 300); }
function node(id){ return state.nodes.find(n=>n.id===id); }
function link(id){ return state.links.find(l=>l.id===id); }

/* ================= rendering (map) ================= */
const svg = document.getElementById('svg');
const world = document.getElementById('world');
const edgeLayer = document.getElementById('edgeLayer');
const nodeLayer = document.getElementById('nodeLayer');
const wrap = document.getElementById('canvasWrap');
const NS = 'http://www.w3.org/2000/svg';

function nodeOpacity(n){
  if(filter==='all') return 1;
  if(filter==='health') return n.kind==='health' ? 1 : .13;
  return n.ws===filter ? 1 : .13;
}
function applyView(){ world.setAttribute('transform', `translate(${view.x},${view.y}) scale(${view.s})`); }

function borderPoint(n, tx, ty){
  const w = NODE_W/2 + 6, h = nodeH(n)/2 + 6;
  const cx = n.x + NODE_W/2, cy = n.y + nodeH(n)/2;
  let dx = tx - cx, dy = ty - cy;
  if(dx===0 && dy===0) return {x:cx, y:cy};
  const k = 1/Math.max(Math.abs(dx)/w, Math.abs(dy)/h);
  return {x:cx + dx*k, y:cy + dy*k};
}

function edgePath(a, b){
  const ca = {x:a.x+NODE_W/2, y:a.y+nodeH(a)/2}, cb = {x:b.x+NODE_W/2, y:b.y+nodeH(b)/2};
  const p1 = borderPoint(a, cb.x, cb.y), p2 = borderPoint(b, ca.x, ca.y);
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  let c1, c2;
  if(Math.abs(dx) > Math.abs(dy)){
    c1 = {x:p1.x + dx*0.45, y:p1.y}; c2 = {x:p2.x - dx*0.45, y:p2.y};
  }else{
    c1 = {x:p1.x, y:p1.y + dy*0.45}; c2 = {x:p2.x, y:p2.y - dy*0.45};
  }
  const mid = { // bezier point at t=0.5
    x:(p1.x + 3*c1.x + 3*c2.x + p2.x)/8,
    y:(p1.y + 3*c1.y + 3*c2.y + p2.y)/8,
  };
  return {d:`M${p1.x},${p1.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`, mid};
}

function render(){
  edgeLayer.innerHTML = '';
  nodeLayer.innerHTML = '';

  for(const l of state.links){
    const a = node(l.from), b = node(l.to);
    if(!a || !b) continue;
    const {d, mid} = edgePath(a, b);
    const op = Math.min(nodeOpacity(a), nodeOpacity(b));
    const g = document.createElementNS(NS,'g');
    g.setAttribute('opacity', op);
    const hit = document.createElementNS(NS,'path');
    hit.setAttribute('d', d); hit.setAttribute('class','edgeHit');
    hit.addEventListener('mousedown', e=>{ e.stopPropagation(); select('link', l.id); });
    const p = document.createElementNS(NS,'path');
    p.setAttribute('d', d);
    p.setAttribute('class', 'edge ' + (l.sign==='+'?'pos':'neg') + (sel && sel.type==='link' && sel.id===l.id ? ' sel':''));
    p.setAttribute('marker-end', l.sign==='+' ? 'url(#arrowPos)' : 'url(#arrowNeg)');
    const badge = document.createElementNS(NS,'g');
    badge.setAttribute('class','signBadge ' + (l.sign==='+'?'pos':'neg'));
    const c = document.createElementNS(NS,'circle');
    c.setAttribute('cx',mid.x); c.setAttribute('cy',mid.y); c.setAttribute('r',8.5);
    const t = document.createElementNS(NS,'text');
    t.setAttribute('x',mid.x); t.setAttribute('y',mid.y+4); t.textContent = l.sign==='+' ? '+' : '−';
    badge.append(c,t);
    g.append(hit,p,badge);
    if(l.label){
      const lt = document.createElementNS(NS,'text');
      lt.setAttribute('class','edgeLabel'); lt.setAttribute('x',mid.x); lt.setAttribute('y',mid.y-13);
      lt.textContent = l.label; g.append(lt);
    }
    edgeLayer.append(g);
  }

  for(const n of state.nodes){
    const g = document.createElementNS(NS,'g');
    g.setAttribute('class','node');
    g.setAttribute('transform',`translate(${n.x},${n.y})`);
    g.setAttribute('opacity', nodeOpacity(n));
    const fo = document.createElementNS(NS,'foreignObject');
    fo.setAttribute('width', NODE_W); fo.setAttribute('height', nodeH(n));
    const div = document.createElement('div');
    div.className = 'nodeCard' + (n.kind==='health'?' health':'')
      + (sel && sel.type==='node' && sel.id===n.id ? ' sel':'')
      + (pendingFrom===n.id ? ' pendingFrom':'');
    div.style.setProperty('--acc', (WS[n.ws]||{color:'#999'}).color);
    div.style.height = nodeH(n)+'px';
    div.innerHTML = `<div class="nName">${esc(n.name)}</div>
      <div class="nMeta"><span class="tag kind-${n.kind}">${n.kind==='health'?'★ check':esc(KINDS[n.kind]||n.kind)}</span><span class="tag src">${esc(SRCS[n.src]||n.src)}</span></div>`
      + (n.bench ? `<div class="nBench">${esc(n.bench)}</div>` : '');
    fo.append(div);
    g.append(fo);
    attachNodeEvents(g, n);
    nodeLayer.append(g);
  }
  applyView();
  renderSidebar();
  if(viewMode==='linear') renderLinear();
}
function esc(s){ return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

/* ================= rendering (step-by-step) ================= */
const linearView = document.getElementById('linearView');
const KIND_ORDER = {outcome:0, driver:1, cost:2, health:3};

function linChips(label, cls, items){
  if(!items.length) return '';
  return `<div class="linChips"><span class="cLab ${cls}">${label}</span>`
    + items.map(n=>`<button class="linkChip" data-jump="${n.id}">${esc(n.name)}</button>`).join('')
    + `</div>`;
}

function linCard(n){
  const ups = state.links.filter(l=>l.to===n.id && l.sign==='+').map(l=>node(l.from)).filter(Boolean);
  const downs = state.links.filter(l=>l.to===n.id && l.sign==='-').map(l=>node(l.from)).filter(Boolean);
  const outs = state.links.filter(l=>l.from===n.id).map(l=>node(l.to)).filter(Boolean);
  return `<div class="linCard${n.kind==='health'?' health':''}" id="lin_${n.id}" style="--acc:${(WS[n.ws]||{color:'#999'}).color}">
    <div class="linTop">
      <div class="linName">${esc(n.name)}</div>
      <div class="linTags"><span class="tag kind-${n.kind}">${n.kind==='health'?'★ check':esc(KINDS[n.kind]||n.kind)}</span><span class="tag src">${esc(SRCS[n.src]||n.src)}</span><button class="mapJump" data-map="${n.id}">Map ↗</button></div>
    </div>
    ${n.note ? `<div class="linNote">${esc(n.note)}</div>` : ''}
    ${n.bench ? `<div class="linBench">Rule of thumb: ${esc(n.bench)}</div>` : ''}
    ${linChips('⬆ Pushed up by','up',ups)}
    ${linChips('⬇ Dragged down by','down',downs)}
    ${linChips('→ Feeds into','out',outs)}
  </div>`;
}

function renderLinear(){
  let html = `<div class="linWrap">
    <div class="linIntro">
      <h2>How this business makes (or loses) money</h2>
      <p>Read top to bottom — one question at a time: did we keep money, where did it come from, what did it cost, and what should we check every month. Each card is one number worth tracking; under it you can see, in words, what pushes it up and what drags it down. Click any name to jump to it, or "Map ↗" to see it in the full picture.</p>
    </div>`;
  let chNum = 0;
  for(const ch of CHAPTERS){
    const ns = state.nodes.filter(n=>n.ws===ch.ws)
      .sort((a,b)=>(KIND_ORDER[a.kind]-KIND_ORDER[b.kind]) || (a.y-b.y) || (a.x-b.x));
    if(!ns.length) continue;
    chNum++;
    html += `<div class="chHead"><div class="chNum">${chNum}</div><h2>${esc(ch.title)}</h2></div>
      <p class="chStory">${esc(ch.story)}</p>`
      + ns.map(linCard).join('');
  }
  /* final recap: every check-up in one place */
  const checks = [];
  for(const ch of CHAPTERS){
    for(const n of state.nodes.filter(n=>n.ws===ch.ws && n.kind==='health')
      .sort((a,b)=>(a.y-b.y)||(a.x-b.x))) checks.push(n);
  }
  if(checks.length){
    chNum++;
    html += `<div class="chHead"><div class="chNum">${chNum}</div><h2>The monthly check-up</h2></div>
      <p class="chStory">All the check questions in one place. Raw numbers brag; these ratios tell the truth. If they all pass, the business isn’t just doing well — it’s stable.</p>`
      + checks.map(n=>`<button class="checkRow" data-jump="${n.id}"><b>${esc(n.name)}</b><span>${esc(n.bench||'')}</span></button>`).join('');
  }
  html += `</div>`;
  linearView.innerHTML = html;

  linearView.querySelectorAll('[data-jump]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const t = document.getElementById('lin_'+el.dataset.jump);
      if(!t) return;
      t.scrollIntoView({behavior:'smooth', block:'center'});
      t.classList.add('flash');
      setTimeout(()=>t.classList.remove('flash'), 1200);
    });
  });
  linearView.querySelectorAll('[data-map]').forEach(el=>{
    el.addEventListener('click', e=>{ e.stopPropagation(); showOnMap(el.dataset.map); });
  });
}

/* ================= view switching ================= */
function setViewMode(mode){
  viewMode = mode;
  document.body.classList.toggle('linear', mode==='linear');
  document.getElementById('viewMapBtn').classList.toggle('on', mode==='map');
  document.getElementById('viewLinearBtn').classList.toggle('on', mode==='linear');
  if(mode==='linear'){ setLinkMode(false); renderLinear(); }
}
document.getElementById('viewMapBtn').onclick = ()=> setViewMode('map');
document.getElementById('viewLinearBtn').onclick = ()=> setViewMode('linear');

function showOnMap(id){
  const n = node(id); if(!n) return;
  setViewMode('map');
  sel = {type:'node', id};
  const r = wrap.getBoundingClientRect();
  view.s = Math.max(view.s, 0.85);
  view.x = r.width/2 - (n.x + NODE_W/2)*view.s;
  view.y = r.height/2 - (n.y + nodeH(n)/2)*view.s;
  render();
}

/* ================= interactions (map) ================= */
function toWorld(e){
  const r = wrap.getBoundingClientRect();
  return {x:(e.clientX - r.left - view.x)/view.s, y:(e.clientY - r.top - view.y)/view.s};
}

function attachNodeEvents(g, n){
  g.addEventListener('mousedown', e=>{
    e.stopPropagation();
    if(linkMode){
      if(!pendingFrom){ pendingFrom = n.id; render(); }
      else if(pendingFrom !== n.id){
        const exists = state.links.find(l=>l.from===pendingFrom && l.to===n.id);
        if(exists){ select('link', exists.id); }
        else{
          const nl = {id:'l'+(idSeq++), from:pendingFrom, to:n.id, sign:'+', label:''};
          state.links.push(nl); save(); select('link', nl.id);
        }
        pendingFrom = null; render();
      }
      return;
    }
    select('node', n.id);
    const start = toWorld(e), ox = n.x, oy = n.y;
    let moved = false;
    const mv = ev=>{
      const p = toWorld(ev);
      n.x = ox + (p.x - start.x); n.y = oy + (p.y - start.y);
      moved = true; renderQuietMove();
    };
    const up = ()=>{ window.removeEventListener('mousemove',mv); window.removeEventListener('mouseup',up); if(moved) save(); };
    window.addEventListener('mousemove',mv); window.addEventListener('mouseup',up);
  });
}
let moveT = null;
function renderQuietMove(){ if(moveT) return; moveT = requestAnimationFrame(()=>{ moveT=null; render(); }); }

/* pan + zoom */
wrap.addEventListener('mousedown', e=>{
  if(e.target.closest('.node') || e.target.closest('.docHandle')) return;
  select(null);
  const sx = e.clientX, sy = e.clientY, ox = view.x, oy = view.y;
  const mv = ev=>{ view.x = ox + ev.clientX - sx; view.y = oy + ev.clientY - sy; applyView(); };
  const up = ()=>{ window.removeEventListener('mousemove',mv); window.removeEventListener('mouseup',up); };
  window.addEventListener('mousemove',mv); window.addEventListener('mouseup',up);
});
wrap.addEventListener('wheel', e=>{
  e.preventDefault();
  const r = wrap.getBoundingClientRect();
  const mx = e.clientX - r.left, my = e.clientY - r.top;
  const f = e.deltaY < 0 ? 1.12 : 1/1.12;
  const ns = Math.min(2.2, Math.max(.22, view.s * f));
  view.x = mx - (mx - view.x) * (ns/view.s);
  view.y = my - (my - view.y) * (ns/view.s);
  view.s = ns; applyView();
}, {passive:false});

wrap.addEventListener('dblclick', e=>{
  if(e.target.closest('.node') || e.target.closest('.docHandle')) return;
  const p = toWorld(e);
  addNode(p.x - NODE_W/2, p.y - 30);
});

document.addEventListener('keydown', e=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
  if(e.key==='Escape'){ pendingFrom=null; setLinkMode(false); select(null); }
  if((e.key==='Delete' || e.key==='Backspace') && sel && viewMode==='map'){ deleteSelection(); }
});

/* ================= actions ================= */
function select(type, id){ sel = type ? {type, id} : null; render(); }

function addNode(x, y){
  const n = {id:'n'+(idSeq++), name:'New number', ws: filter!=='all' && filter!=='health' ? filter : 'core',
             kind:'driver', src:'manual', note:'', bench:'', x:Math.round(x), y:Math.round(y)};
  state.nodes.push(n); save(); select('node', n.id);
  setTimeout(()=>{ const i = document.getElementById('f_name'); if(i){ i.focus(); i.select(); } }, 30);
}

function deleteSelection(){
  if(!sel) return;
  if(sel.type==='node'){
    state.links = state.links.filter(l=>l.from!==sel.id && l.to!==sel.id);
    state.nodes = state.nodes.filter(n=>n.id!==sel.id);
  }else{
    state.links = state.links.filter(l=>l.id!==sel.id);
  }
  sel = null; save(); render();
}

function setLinkMode(on){
  linkMode = on; pendingFrom = null;
  document.getElementById('linkBtn').classList.toggle('linking', on);
  document.getElementById('linkBtn').textContent = on ? '⤳ Click source, then target… (Esc)' : '⤳ Link mode';
  wrap.classList.toggle('linkmode', on);
  render();
}

function fitView(){
  if(!state.nodes.length) return;
  const r = wrap.getBoundingClientRect();
  if(!r.width || !r.height) return; // canvas hidden (step-by-step view)
  const xs = state.nodes.map(n=>n.x), ys = state.nodes.map(n=>n.y);
  const x2 = state.nodes.map(n=>n.x+NODE_W), y2 = state.nodes.map(n=>n.y+nodeH(n));
  const bx = Math.min(...xs)-40, by = Math.min(...ys)-40;
  const bw = Math.max(...x2)-bx+40, bh = Math.max(...y2)-by+40;
  view.s = Math.min(r.width/bw, r.height/bh, 1.15);
  view.x = (r.width - bw*view.s)/2 - bx*view.s;
  view.y = (r.height - bh*view.s)/2 - by*view.s;
  applyView();
}

/* ================= sidebar ================= */
const sidebar = document.getElementById('sidebar');

function renderSidebar(){
  if(sel && sel.type==='node'){ renderNodeEditor(node(sel.id)); return; }
  if(sel && sel.type==='link'){ renderLinkEditor(link(sel.id)); return; }
  renderHelp();
}

function renderNodeEditor(n){
  if(!n){ sel=null; renderHelp(); return; }
  sidebar.innerHTML = `
    <h2>Edit this number</h2>
    <div class="field"><label>Name</label><input id="f_name" value="${esc(n.name)}"></div>
    <div class="row2">
      <div class="field"><label>Group</label><select id="f_ws">${Object.entries(WS).map(([k,v])=>`<option value="${k}" ${n.ws===k?'selected':''}>${v.label}</option>`).join('')}</select></div>
      <div class="field"><label>Type</label><select id="f_kind">${Object.entries(KINDS).map(([k,v])=>`<option value="${k}" ${n.kind===k?'selected':''}>${v}</option>`).join('')}</select></div>
    </div>
    <div class="field"><label>Where the number comes from</label><select id="f_src">${Object.entries(SRCS).map(([k,v])=>`<option value="${k}" ${n.src===k?'selected':''}>${v}</option>`).join('')}</select></div>
    <div class="field"><label>Rule of thumb (shown on card)</label><input id="f_bench" value="${esc(n.bench||'')}" placeholder="e.g. Healthy: under 6 months"></div>
    <div class="field"><label>Notes</label><textarea id="f_note">${esc(n.note||'')}</textarea></div>
    <div class="sideBtns">
      <button class="btn" id="f_linkfrom">⤳ Link from this</button>
      <button class="btn danger" id="f_del">Delete</button>
    </div>
    <h3>Connections</h3>
    <div class="help" id="f_conns"></div>`;
  const bind = (id, key)=>{ document.getElementById(id).addEventListener('input', e=>{ n[key]=e.target.value; save();
    if(id==='f_ws'||id==='f_kind'||id==='f_bench') render(); }); };
  bind('f_name','name'); bind('f_ws','ws'); bind('f_kind','kind'); bind('f_src','src'); bind('f_bench','bench'); bind('f_note','note');
  document.getElementById('f_name').addEventListener('change', ()=>render());
  document.getElementById('f_src').addEventListener('change', ()=>render());
  document.getElementById('f_linkfrom').onclick = ()=>{ setLinkMode(true); pendingFrom = n.id; render(); };
  document.getElementById('f_del').onclick = deleteSelection;
  const ins = state.links.filter(l=>l.to===n.id).map(l=>`<li>${l.sign==='+'?'🟢':'🔴'} ← <b>${esc((node(l.from)||{}).name||'?')}</b></li>`);
  const outs = state.links.filter(l=>l.from===n.id).map(l=>`<li>${l.sign==='+'?'🟢':'🔴'} → <b>${esc((node(l.to)||{}).name||'?')}</b></li>`);
  document.getElementById('f_conns').innerHTML =
    (ins.length? `<ul>${ins.join('')}</ul>`:'<p style="margin-bottom:6px">Nothing feeds this yet.</p>') +
    (outs.length? `<ul>${outs.join('')}</ul>`:'<p>This feeds nothing yet.</p>');
}

function renderLinkEditor(l){
  if(!l){ sel=null; renderHelp(); return; }
  const a = node(l.from), b = node(l.to);
  sidebar.innerHTML = `
    <h2>Edit link</h2>
    <div class="fromTo"><b>${esc(a?a.name:'?')}</b><br>↓<br><b>${esc(b?b.name:'?')}</b></div>
    <div class="field"><label>When the top one goes up…</label>
      <div class="signToggle">
        <button id="f_pos" class="pos ${l.sign==='+'?'on':''}">…this goes up too</button>
        <button id="f_neg" class="neg ${l.sign==='-'?'on':''}">…this goes down</button>
      </div>
    </div>
    <div class="field"><label>Label (optional)</label><input id="f_label" value="${esc(l.label||'')}" placeholder="e.g. grows with sales"></div>
    <div class="sideBtns">
      <button class="btn" id="f_flip">⇄ Reverse arrow</button>
      <button class="btn danger" id="f_del">Delete link</button>
    </div>
    <div class="help" style="margin-top:14px">🟢 solid = they move <b>together</b> (more ad spend → more cost). 🔴 dashed = they move <b>opposite ways</b> (more cancellations → fewer subscribers). Colour shows direction, not good or bad.</div>`;
  document.getElementById('f_pos').onclick = ()=>{ l.sign='+'; save(); render(); };
  document.getElementById('f_neg').onclick = ()=>{ l.sign='-'; save(); render(); };
  document.getElementById('f_label').addEventListener('input', e=>{ l.label=e.target.value; save(); });
  document.getElementById('f_label').addEventListener('change', ()=>render());
  document.getElementById('f_flip').onclick = ()=>{ const f=l.from; l.from=l.to; l.to=f; save(); render(); };
  document.getElementById('f_del').onclick = deleteSelection;
}

function renderHelp(){
  const counts = {};
  for(const n of state.nodes) counts[n.src] = (counts[n.src]||0)+1;
  sidebar.innerHTML = `
    <h2>How to read this map</h2>
    <div class="help">
      Every card is a number worth tracking. Arrows show <b>cause</b>:
      <div style="margin:8px 0">
        <div class="legendRow"><div class="lineSw"></div> they move <b>together</b></div>
        <div class="legendRow"><div class="lineSw neg"></div> they move <b>opposite ways</b></div>
      </div>
      Colour shows direction, <b>not</b> good or bad — "ad spend → money out" is green because more spend really does mean more cost.
      <p style="margin-top:8px">New to this? Switch to <b>☰ Step by step</b> at the top — same content, read like a story.</p>
    </div>
    <div class="callout"><b>★ The check-ups are the point.</b> Raw numbers brag: "59 videos, up 9%" sounds great — until you learn retainer spend doubled. Every amber card divides a raw number by what it cost, and comes with a rule of thumb. These are what the app should show first.</div>
    <h3>Groups</h3>
    ${Object.entries(WS).map(([k,v])=>`<div class="legendRow"><div class="swatch" style="background:${v.color}"></div>${v.label}</div>`).join('')}
    <h3>Where the numbers come from</h3>
    <div class="srcCounts">${Object.entries(SRCS).map(([k,v])=>`${v}: <b>${counts[k]||0}</b>`).join(' &nbsp;·&nbsp; ')}</div>
    <div class="help" style="margin-top:6px">This list <i>is</i> the shopping list for the app: connect these sources and every card becomes a live number. Xero is the backbone — the bank feed catches every cost the platform dashboards hide.</div>
    <h3>Editing</h3>
    <div class="help"><ul>
      <li><b>Drag</b> cards to move, drag the background to pan, scroll to zoom</li>
      <li><b>Double-click</b> empty space (or + Card) to add a number</li>
      <li><b>⤳ Link mode</b>: click the cause, then the effect</li>
      <li>Click a card or arrow to edit it here; <span class="kbd">Del</span> removes it</li>
      <li>Changes save automatically in this browser. <b>Export</b> to share</li>
    </ul></div>`;
}

/* ================= toolbar ================= */
document.getElementById('addNodeBtn').onclick = ()=>{
  const r = wrap.getBoundingClientRect();
  const p = {x:(r.width/2 - view.x)/view.s, y:(r.height/2 - view.y)/view.s};
  addNode(p.x - NODE_W/2, p.y - 30);
};
document.getElementById('linkBtn').onclick = ()=> setLinkMode(!linkMode);
document.getElementById('fitBtn').onclick = fitView;
document.getElementById('exportBtn').onclick = ()=>{
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'profit-cause-map.json'; a.click();
  URL.revokeObjectURL(a.href);
};
document.getElementById('importBtn').onclick = ()=> document.getElementById('importFile').click();
document.getElementById('importFile').addEventListener('change', e=>{
  const f = e.target.files[0]; if(!f) return;
  const rd = new FileReader();
  rd.onload = ()=>{ try{
      const g = JSON.parse(rd.result);
      if(!g.nodes || !g.links) throw 0;
      state = g; sel = null; save(); render(); fitView();
    }catch(err){ alert('Not a valid map file.'); } };
  rd.readAsText(f);
  e.target.value = '';
});
document.getElementById('resetBtn').onclick = ()=>{
  if(!confirm('Replace the current map with the built-in example? Your edits will be lost (Export first if you want to keep them).')) return;
  state = defaultGraph(); sel = null; save(); render(); fitView();
};
document.querySelectorAll('#filterChips .chip').forEach(ch=>{
  ch.addEventListener('click', ()=>{
    document.querySelectorAll('#filterChips .chip').forEach(c=>c.classList.remove('on'));
    ch.classList.add('on');
    filter = ch.dataset.ws;
    render();
  });
});
/* document handle → open the help/about panel (map view) */
document.getElementById('docHandle').onclick = ()=> select(null);

/* ================= boot ================= */
render();
fitView();
