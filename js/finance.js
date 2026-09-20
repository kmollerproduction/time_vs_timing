(function (T) {
  'use strict';
  const total = p => p.normalEquity + p.fixedInterest + p.lockedLeveraged;
  function createPortfolio(capital, equityShare, insuranceFee) {
    return {
      normalEquity: capital * equityShare,
      fixedInterest: capital * (1 - equityShare),
      lockedLeveraged: 0,
      currentInsuranceFee: insuranceFee,
      yearStartValue: capital,
      cumulativeNormalFundFees: 0,
      cumulativeLeveragedFundFees: 0,
      cumulativeInsuranceFees: 0,
      cumulativeTax: 0,
      transferReturnFactorNextMonth: null
    };
  }
  function deductProportionally(p, amount) {
    const before = total(p);
    if (!before || !amount) return;
    const factor = Math.max(0, (before - amount) / before);
    p.normalEquity *= factor; p.fixedInterest *= factor; p.lockedLeveraged *= factor;
  }
  function simulateMonth(source, marketReturn, monthNumber, config) {
    const p = { ...source };
    const factor = p.transferReturnFactorNextMonth == null ? 1 : p.transferReturnFactorNextMonth;
    p.transferReturnFactorNextMonth = null;
    p.normalEquity *= 1 + marketReturn * factor;
    p.lockedLeveraged *= Math.max(0, 1 + marketReturn * config.leverageMultiplier * factor);
    p.fixedInterest *= Math.pow(1 + config.annualFixedReturn, 1 / 12);
    const normalFee = p.normalEquity * config.normalFundFee / 12;
    const leverageFee = p.lockedLeveraged * config.leveragedFundFee / 12;
    p.normalEquity -= normalFee; p.lockedLeveraged -= leverageFee;
    p.cumulativeNormalFundFees += normalFee;
    p.cumulativeLeveragedFundFees += leverageFee;
    const insuranceFee = total(p) * p.currentInsuranceFee / 12;
    deductProportionally(p, insuranceFee);
    p.cumulativeInsuranceFees += insuranceFee;
    if (monthNumber % 12 === 0) {
      const tax = Math.min(total(p), p.yearStartValue * config.pensionTax);
      deductProportionally(p, tax); p.cumulativeTax += tax;
      p.yearStartValue = total(p);
    }
    return p;
  }
  function rebalanceUnlocked(source, equityShare) {
    const p = { ...source }, unlocked = p.normalEquity + p.fixedInterest;
    p.normalEquity = unlocked * equityShare; p.fixedInterest = unlocked * (1 - equityShare);
    return p;
  }
  function createLeverage(source, share) {
    const p = { ...source }, before = total(p), amount = before * share;
    const unlocked = p.normalEquity + p.fixedInterest;
    if (!unlocked || p.lockedLeveraged) return p;
    const factor = (unlocked - amount) / unlocked;
    p.normalEquity *= factor; p.fixedInterest *= factor; p.lockedLeveraged = amount;
    return p;
  }
  function moveUnlockedToFixed(source) {
    const p = { ...source }; p.fixedInterest += p.normalEquity; p.normalEquity = 0; return p;
  }
  function closeLeverageAndSplit(source, equityShare) {
    const p = { ...source }, value = total(p);
    p.lockedLeveraged = 0; p.normalEquity = value * equityShare; p.fixedInterest = value * (1 - equityShare); return p;
  }
  function allocations(p) {
    const value = total(p) || 1;
    return { equity: p.normalEquity/value, fixed: p.fixedInterest/value, leveraged: p.lockedLeveraged/value };
  }
  T.Finance = { total, createPortfolio, deductProportionally, simulateMonth, rebalanceUnlocked, createLeverage, moveUnlockedToFixed, closeLeverageAndSplit, allocations };
})(window.TimeMarket = window.TimeMarket || {});
