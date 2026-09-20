(function (T) {
  'use strict';
  function simulate(config, marketReturns, decisions, options={}) {
    const ignored=options.ignoreDecisionTypes||new Set(), overrides=options.eventOverrides||{};
    const initial=decisions.find(d=>d.type==='initial');
    const initialShare=ignored.has('manual')?1:(initial?initial.equityShare:1);
    let p=T.Finance.createPortfolio(config.startingCapital,initialShare,config.insuranceFee);
    const timeline=[T.Finance.total(p)];
    for(let month=1;month<=marketReturns.length;month++){
      p=T.Finance.simulateMonth(p,marketReturns[month-1],month,config);
      const monthDecisions=decisions.filter(d=>d.month===month&&d.type!=='initial');
      for(const d of monthDecisions){
        if(d.type==='manual') { if(!ignored.has('manual')) p=T.Finance.rebalanceUnlocked(p,d.equityShare); }
        else if(d.type==='event') {
          const event=T.Events.byId(d.eventId); if(event){ const answer=Object.prototype.hasOwnProperty.call(overrides,d.eventId)?overrides[d.eventId]:d.accepted; p=event.apply(p,answer,config); }
        }
      }
      timeline.push(T.Finance.total(p));
    }
    return { portfolio:p, finalValue:T.Finance.total(p), timeline };
  }
  function buyAndHold(config, marketReturns) {
    const decisions=[{month:0,type:'initial',equityShare:1}];
    T.Events.definitions.forEach(e=>decisions.push({month:e.triggerMonth,type:'event',eventId:e.id,accepted:false}));
    return simulate(config,marketReturns,decisions);
  }
  function counterfactuals(config, returns, decisions, actual) {
    const effects={};
    for(const e of T.Events.definitions){
      const chosen=decisions.find(d=>d.type==='event'&&d.eventId===e.id);
      const alternate=simulate(config,returns,decisions,{eventOverrides:{[e.id]:!(chosen&&chosen.accepted)}});
      effects[e.id]={alternateFinal:alternate.finalValue,effect:actual.finalValue-alternate.finalValue};
    }
    const noManual=simulate(config,returns,decisions,{ignoreDecisionTypes:new Set(['manual'])});
    effects.manual={alternateFinal:noManual.finalValue,effect:actual.finalValue-noManual.finalValue};
    const noTransfer=simulate(config,returns,decisions,{eventOverrides:{transfer:false}});
    effects.insuranceSavings=noTransfer.portfolio.cumulativeInsuranceFees-actual.portfolio.cumulativeInsuranceFees;
    return effects;
  }
  T.Replay={simulate,buyAndHold,counterfactuals};
})(window.TimeMarket = window.TimeMarket || {});
