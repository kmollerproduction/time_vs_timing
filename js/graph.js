(function (T) {
  'use strict';
  class MarketGraph {
    constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');}
    draw(state){
      const c=this.canvas,box=c.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
      if(c.width!==Math.round(box.width*dpr)||c.height!==Math.round(box.height*dpr)){c.width=Math.round(box.width*dpr);c.height=Math.round(box.height*dpr);}
      const x=this.ctx;x.setTransform(dpr,0,0,dpr,0,0);const w=box.width,h=box.height;x.clearRect(0,0,w,h);
      const history=state.marketHistory||[];let combined=history.slice();
      if(state.currentMonth>0)combined=combined.concat(state.marketIndexes.slice(1,state.currentMonth+1));
      if(state.visualProgress>0&&state.currentMonth<state.marketIndexes.length-1){const a=state.marketIndexes[state.currentMonth],b=state.marketIndexes[state.currentMonth+1];combined.push(a+(b-a)*state.visualProgress);}
      const visible=combined.slice(-61),pad={l:20,r:18,t:28,b:30};if(visible.length<2)return;
      let lo=Math.min(...visible),hi=Math.max(...visible);const gap=Math.max(1,(hi-lo)*.15);lo-=gap;hi+=gap;
      const px=i=>pad.l+i/(visible.length-1)*(w-pad.l-pad.r),py=v=>pad.t+(hi-v)/(hi-lo)*(h-pad.t-pad.b);
      x.strokeStyle='rgba(20,35,43,.10)';x.lineWidth=1;for(let i=0;i<4;i++){const yy=pad.t+i*(h-pad.t-pad.b)/3;x.beginPath();x.moveTo(pad.l,yy);x.lineTo(w-pad.r,yy);x.stroke();}
      const grad=x.createLinearGradient(0,pad.t,0,h-pad.b);grad.addColorStop(0,'rgba(38,137,116,.22)');grad.addColorStop(1,'rgba(38,137,116,0)');
      x.beginPath();visible.forEach((v,i)=>i?x.lineTo(px(i),py(v)):x.moveTo(px(i),py(v)));x.lineTo(px(visible.length-1),h-pad.b);x.lineTo(px(0),h-pad.b);x.closePath();x.fillStyle=grad;x.fill();
      x.beginPath();visible.forEach((v,i)=>i?x.lineTo(px(i),py(v)):x.moveTo(px(i),py(v)));x.strokeStyle='#16846f';x.lineWidth=3;x.lineJoin='round';x.stroke();
      x.fillStyle='#16846f';x.beginPath();x.arc(px(visible.length-1),py(visible.at(-1)),5,0,Math.PI*2);x.fill();
      x.font='600 12px system-ui';x.fillText('5 ÅR SEDAN',pad.l,h-8);x.textAlign='right';x.fillText('NU',w-pad.r,h-8);x.textAlign='left';
    }
  }
  T.MarketGraph=MarketGraph;
})(window.TimeMarket = window.TimeMarket || {});
