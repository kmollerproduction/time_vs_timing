(function (T) {
  'use strict';
  class GameController {
    constructor(config,onChange){this.config=config;this.onChange=onChange||(()=>{});this.raf=0;this.lastTime=0;this.state={currentScreen:'admin'};}
    emit(){this.onChange(this.state);}
    prepare(){
      const future=T.Market.generateFuture(this.config),history=T.Market.generateHistory(this.config);
      this.state={currentScreen:'start',currentMonth:0,visualProgress:0,marketPath:future.returns,marketIndexes:future.indexes,marketHistory:history.indexes,portfolio:null,buyHold:null,decisionLog:[],pendingEvent:null,pendingManual:false,running:false,activeElapsed:0,results:null,generatorStats:future.stats};this.emit();
    }
    start(equityShare){
      this.state.portfolio=T.Finance.createPortfolio(this.config.startingCapital,equityShare,this.config.insuranceFee);
      this.state.buyHold=T.Finance.createPortfolio(this.config.startingCapital,1,this.config.insuranceFee);
      this.state.decisionLog=[{month:0,type:'initial',equityShare}];this.state.currentScreen='game';this.resume();
    }
    resume(){this.state.running=true;this.state.pendingManual=false;this.lastTime=performance.now();cancelAnimationFrame(this.raf);this.raf=requestAnimationFrame(t=>this.tick(t));this.emit();}
    requestManual(){if(!this.state.running)return;this.state.pendingManual=true;this.emit();}
    tick(now){
      if(!this.state.running)return;const dt=Math.min(.1,(now-this.lastTime)/1000);this.lastTime=now;this.state.activeElapsed+=dt;
      const exact=Math.min(this.config.months,this.state.activeElapsed/this.config.gameDurationSeconds*this.config.months);
      const target=Math.floor(exact);
      while(this.state.currentMonth<target&&this.state.running)this.advanceMonth();
      this.state.visualProgress=this.state.running?Math.max(0,exact-this.state.currentMonth):0;
      this.emit();if(this.state.running)this.raf=requestAnimationFrame(t=>this.tick(t));
    }
    advanceMonth(){
      const month=this.state.currentMonth+1,r=this.state.marketPath[month-1];
      this.state.portfolio=T.Finance.simulateMonth(this.state.portfolio,r,month,this.config);
      this.state.buyHold=T.Finance.simulateMonth(this.state.buyHold,r,month,this.config);
      this.state.currentMonth=month;this.state.visualProgress=0;
      if(month>=this.config.months){this.finish();return;}
      const event=T.Events.atMonth(month);
      if(event){this.pause();this.state.pendingEvent=event;this.state.currentScreen='event';return;}
      if(this.state.pendingManual){this.pause();this.state.currentScreen='manual';}
    }
    pause(){this.state.running=false;cancelAnimationFrame(this.raf);}
    chooseManual(equityShare){
      this.state.portfolio=T.Finance.rebalanceUnlocked(this.state.portfolio,equityShare);
      this.state.decisionLog.push({month:this.state.currentMonth,type:'manual',equityShare});this.state.currentScreen='game';this.resume();
    }
    chooseEvent(accepted){
      const e=this.state.pendingEvent;this.state.portfolio=e.apply(this.state.portfolio,accepted,this.config);
      this.state.decisionLog.push({month:this.state.currentMonth,type:'event',eventId:e.id,accepted});
      this.state.pendingEvent=null;this.state.currentScreen='game';this.resume();
    }
    finish(){
      this.pause();const actual=T.Replay.simulate(this.config,this.state.marketPath,this.state.decisionLog);
      const buy=T.Replay.buyAndHold(this.config,this.state.marketPath);
      this.state.portfolio=actual.portfolio;this.state.buyHold=buy.portfolio;
      this.state.results={actual,buy,effects:T.Replay.counterfactuals(this.config,this.state.marketPath,this.state.decisionLog,actual)};
      this.state.currentScreen='result';this.emit();
    }
  }
  T.GameController=GameController;
})(window.TimeMarket = window.TimeMarket || {});
