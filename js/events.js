(function (T) {
  'use strict';
  const pct=(n,d=2)=>(n*100).toLocaleString('sv-SE',{maximumFractionDigits:d})+' %';
  const definitions = [
    { id:'transfer', triggerMonth:24, title:'Ett billigare pensionsskal?',
      description:c=>`Du kan flytta kapitalet och sänka försäkringsavgiften från ${pct(c.insuranceFee)} till ${pct(c.newInsuranceFee)} per år. Flytten gör att börskapitalet bara får halva marknadsrörelsen under nästa månad. Du känner inte till den månadens utveckling.`,
      apply:(p,yes,c)=>{ if(!yes)return {...p}; return {...p,currentInsuranceFee:c.newInsuranceFee,transferReturnFactorNextMonth:.5}; } },
    { id:'leverage', triggerMonth:60, title:'Mer risk med 15 år kvar?',
      description:c=>`Du erbjuds att placera ${pct(c.leveragedOfferShare,0)} av nuvarande kapital i en fond med ${String(c.leverageMultiplier).replace('.',',')}× hävstång och ${pct(c.leveragedFundFee)} årlig avgift. Den delen låses och kan inte ändras med vanliga omviktningar.`,
      apply:(p,yes,c)=>yes?T.Finance.createLeverage(p,c.leveragedOfferShare):{...p} },
    { id:'fixed', triggerMonth:120, title:'Orolig marknad framöver?',
      description:(c,p)=>`Rådgivaren föreslår att allt tillgängligt kapital flyttas till ränta tills vidare.${p.lockedLeveraged>0?' Din hävstångsplacering är låst och kan inte flyttas.':''}`,
      apply:(p,yes)=>yes?T.Finance.moveUnlockedToFixed(p):{...p} },
    { id:'reduce', triggerMonth:204, title:'Tre år kvar – minska risken?',
      description:()=>`Rådgivaren rekommenderar 50 % av hela kapitalet på börsen och 50 % i ränta. Ett ja avslutar även en eventuell tidigare låst hävstångsplacering.`,
      apply:(p,yes)=>yes?T.Finance.closeLeverageAndSplit(p,.5):{...p} }
  ];
  const byMonth=new Map(definitions.map(e=>[e.triggerMonth,e]));
  const byId=new Map(definitions.map(e=>[e.id,e]));
  T.Events={definitions,atMonth:m=>byMonth.get(m)||null,byId:id=>byId.get(id)||null};
})(window.TimeMarket = window.TimeMarket || {});
