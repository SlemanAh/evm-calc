export const readNumber = (el) => {
  const v = parseFloat(el.value);
  return Number.isFinite(v) ? v : null;
};

export function calculate(bacEl, pvEl, evEl, acEl, eacModel) {
  const bac = readNumber(bacEl);
  const pv = readNumber(pvEl);
  const ev = readNumber(evEl);
  const ac = readNumber(acEl);

  if ([bac, pv, ev, ac].some(v => v === null)) {
    alert("Please fill all numeric fields.");
    return null;
  }

  const cv = ev - ac;
  const sv = ev - pv;
  const cpi = ac === 0 ? 0 : ev / ac;
  const spi = pv === 0 ? 0 : ev / pv;

  let eac = bac;
  const model = eacModel;
  if (model === "EAC_AC_plus_BAC_minus_EV") {
    eac = ac + (bac - ev);
  } else if (model === "EAC_BAC_over_CPI") {
    eac = cpi ? bac / cpi : Infinity;
  } else if (model === "EAC_BAC_over_CPIxSPI") {
    const cpiSpi = cpi * spi;
    eac = cpiSpi ? bac / cpiSpi : Infinity;
  }

  const etc = eac - ac;
  const vac = bac - eac;
  const tcpi = (eac - ac) === 0 ? Infinity : (bac - ev) / (eac - ac);

  return {
    earnedValue: ev, costVariance: cv, scheduleVariance: sv,
    costPerformanceIndex: cpi, schedulePerformanceIndex: spi,
    estimateAtCompletion: eac, estimateToComplete: etc,
    varianceAtCompletion: vac, toCompletePerformanceIndex: tcpi
  };
}