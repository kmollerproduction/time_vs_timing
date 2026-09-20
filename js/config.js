(function (T) {
  'use strict';
  const defaults = Object.freeze({
    startingCapital: 100000, years: 20, months: 240, historyMonths: 60,
    annualMarketReturn: 0.085, annualFixedReturn: 0.02,
    insuranceFee: 0.0065, newInsuranceFee: 0,
    normalFundFee: 0.01, leveragedFundFee: 0.015,
    leverageMultiplier: 1.5, leveragedOfferShare: 0.25,
    pensionTax: 0.0035, gameDurationSeconds: 90,
    debug: false,
    generator: {
      targetVolatility: 0.21, minVolatility: 0.18, maxVolatility: 0.24,
      maxAdjustment: 0.012, minMonth: -0.30, maxMonth: 0.25,
      maxDrawdown: 0.62, maxAttempts: 4000
    }
  });
  const key = 'timeInMarket.settings.v1';
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function merge(base, saved) {
    const out = clone(base);
    Object.keys(saved || {}).forEach(k => {
      if (k === 'generator') Object.assign(out.generator, saved.generator || {});
      else if (k in out && typeof saved[k] === typeof out[k]) out[k] = saved[k];
    });
    return out;
  }
  function load() {
    try { return merge(defaults, JSON.parse(localStorage.getItem(key) || '{}')); }
    catch (_) { return clone(defaults); }
  }
  function save(config) { localStorage.setItem(key, JSON.stringify(config)); }
  function reset() { localStorage.removeItem(key); return clone(defaults); }
  T.Config = { defaults, load, save, reset, clone };
})(window.TimeMarket = window.TimeMarket || {});
