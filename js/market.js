(function (T) {
  'use strict';
  const regimes = {
    NORMAL: { mu: .065, vol: .16, stay: .84, next: [['BULL',.08],['BEAR',.065],['CRISIS',.015]] },
    BULL:   { mu: .16, vol: .14, stay: .87, next: [['NORMAL',.10],['BEAR',.025],['CRISIS',.005]] },
    BEAR:   { mu: -.10, vol: .24, stay: .78, next: [['NORMAL',.14],['BULL',.03],['CRISIS',.05]] },
    CRISIS: { mu: -.24, vol: .40, stay: .52, next: [['BEAR',.28],['NORMAL',.17],['BULL',.03]] }
  };
  function normalRandom(rng=Math.random) {
    let u=0,v=0; while(!u) u=rng(); while(!v) v=rng();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }
  function nextRegime(current, rng) {
    const r = regimes[current], x=rng(); if(x<r.stay) return current;
    let n=(x-r.stay)/(1-r.stay), sum=0;
    for(const [name,p] of r.next){ sum += p/(1-r.stay); if(n<=sum) return name; }
    return 'NORMAL';
  }
  function rawPath(count, rng=Math.random) {
    let state='NORMAL', shock=.0; const returns=[];
    for(let i=0;i<count;i++){
      state=nextRegime(state,rng); const r=regimes[state];
      shock=.22*shock+Math.sqrt(1-.22*.22)*normalRandom(rng);
      returns.push(Math.max(-.42, r.mu/12 + r.vol/Math.sqrt(12)*shock));
    }
    return returns;
  }
  function indexes(returns) { const out=[100]; for(const r of returns) out.push(out[out.length-1]*(1+r)); return out; }
  function stats(returns) {
    const avg=returns.reduce((a,b)=>a+b,0)/returns.length;
    const variance=returns.reduce((a,b)=>a+(b-avg)**2,0)/Math.max(1,returns.length-1);
    const idx=indexes(returns); let peak=idx[0], dd=0;
    idx.forEach(v=>{peak=Math.max(peak,v);dd=Math.max(dd,1-v/peak);});
    return { volatility:Math.sqrt(variance*12), maxDrawdown:dd, minMonth:Math.min(...returns), maxMonth:Math.max(...returns), finalIndex:idx[idx.length-1] };
  }
  function generateFuture(config, rng=Math.random) {
    const g=config.generator, targetLog=config.years*Math.log1p(config.annualMarketReturn);
    for(let attempt=0;attempt<g.maxAttempts;attempt++){
      const raw=rawPath(config.months,rng);
      if(raw.some(r=>r<=-1)) continue;
      const log=raw.reduce((s,r)=>s+Math.log1p(r),0), c=(targetLog-log)/config.months;
      if(Math.abs(c)>g.maxAdjustment) continue;
      const adjusted=raw.map(r=>Math.exp(Math.log1p(r)+c)-1), s=stats(adjusted);
      if(s.volatility<g.minVolatility||s.volatility>g.maxVolatility||s.minMonth<g.minMonth||s.maxMonth>g.maxMonth||s.maxDrawdown>g.maxDrawdown) continue;
      return { returns:adjusted, indexes:indexes(adjusted), stats:s, attempts:attempt+1 };
    }
    throw new Error('Kunde inte skapa en godkänd marknadsbana. Justera generatorns gränsvärden.');
  }
  function generateHistory(config, rng=Math.random) {
    let returns=rawPath(config.historyMonths,rng).map(r=>Math.max(config.generator.minMonth,Math.min(config.generator.maxMonth,r)));
    const rawIndexes=indexes(returns), scale=100/rawIndexes[rawIndexes.length-1];
    const normalizedIndexes=rawIndexes.map(value=>value*scale);
    return { returns, indexes:normalizedIndexes, stats:stats(returns) };
  }
  function debugMany(config, count=1000) {
    const rows=Array.from({length:count},()=>generateFuture(config).stats);
    const mean=k=>rows.reduce((s,r)=>s+r[k],0)/rows.length;
    const report={count, meanVolatility:mean('volatility'), meanMaxDrawdown:mean('maxDrawdown'), worstMonth:Math.min(...rows.map(r=>r.minMonth)), bestMonth:Math.max(...rows.map(r=>r.maxMonth)), finalIndexRange:[Math.min(...rows.map(r=>r.finalIndex)),Math.max(...rows.map(r=>r.finalIndex))]};
    console.table(report); return report;
  }
  T.Market={generateFuture,generateHistory,indexes,stats,debugMany,rawPath};
})(window.TimeMarket = window.TimeMarket || {});
