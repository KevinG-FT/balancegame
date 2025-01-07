
function loadSettingsToPanel() {
  // -------------------------
  // GAME TIME
  // -------------------------
  const gameDurationInput = document.getElementById('gameDurationInput');
  if (gameDurationInput) {
    gameDurationInput.value = settings.gameDurationSeconds;
  }
  
  // -------------------------
  // ENVIRONMENT
  // -------------------------
  const temperatureAmplitudeInput = document.getElementById('temperatureAmplitudeInput');
  if (temperatureAmplitudeInput) {
    temperatureAmplitudeInput.value = settings.temperatureAmplitude;
  }

  const temperatureMidpointInput = document.getElementById('temperatureMidpointInput');
  if (temperatureMidpointInput) {
    temperatureMidpointInput.value = settings.temperatureMidpoint;
  }

  const windBaselineAmplitudeInput = document.getElementById('windBaselineAmplitudeInput');
  if (windBaselineAmplitudeInput) {
    windBaselineAmplitudeInput.value = settings.windBaselineAmplitude;
  }

  const windBaselineMidpointInput = document.getElementById('windBaselineMidpointInput');
  if (windBaselineMidpointInput) {
    windBaselineMidpointInput.value = settings.windBaselineMidpoint;
  }

  const windSpeedMaxInput = document.getElementById('windSpeedMaxInput');
  if (windSpeedMaxInput) {
    windSpeedMaxInput.value = settings.windSpeedMax;
  }

  const windSpeedMinInput = document.getElementById('windSpeedMinInput');
  if (windSpeedMinInput) {
    windSpeedMinInput.value = settings.windSpeedMin;
  }

  // -------------------------
  // CAPACITIES & GAS
  // -------------------------
  const pvGenerationMaxMWInput = document.getElementById('pvGenerationMaxMWInput');
  if (pvGenerationMaxMWInput) {
    pvGenerationMaxMWInput.value = settings.pvGenerationMaxMW;
  }

  const windGenerationMaxMWInput = document.getElementById('windGenerationMaxMWInput');
  if (windGenerationMaxMWInput) {
    windGenerationMaxMWInput.value = settings.windGenerationMaxMW;
  }

  const gasGenerationMaxMWInput = document.getElementById('gasGenerationMaxMWInput');
  if (gasGenerationMaxMWInput) {
    gasGenerationMaxMWInput.value = settings.gasGenerationMaxMW;
  }

  const initialGasMWInput = document.getElementById('initialGasMWInput');
  if (initialGasMWInput) {
    initialGasMWInput.value = settings.initialGasMW;
  }

  const gasGenerationMWInput = document.getElementById('gasGenerationMWInput');
  if (gasGenerationMWInput) {
    gasGenerationMWInput.value = settings.gasGenerationMW;
  }

  // -------------------------
  // DEMAND
  // -------------------------
  const demandBaseMWInput = document.getElementById('demandBaseMWInput');
  if (demandBaseMWInput) {
    demandBaseMWInput.value = settings.demandBaseMW;
  }

  const demandPeakMultiplierMorningInput = document.getElementById('demandPeakMultiplierMorningInput');
  if (demandPeakMultiplierMorningInput) {
    demandPeakMultiplierMorningInput.value = settings.demandPeakMultiplierMorning;
  }

  const demandPeakMultiplierEveningInput = document.getElementById('demandPeakMultiplierEveningInput');
  if (demandPeakMultiplierEveningInput) {
    demandPeakMultiplierEveningInput.value = settings.demandPeakMultiplierEvening;
  }

  const demandTemperatureFactorInput = document.getElementById('demandTemperatureFactorInput');
  if (demandTemperatureFactorInput) {
    demandTemperatureFactorInput.value = settings.demandTemperatureFactor;
  }

  // -------------------------
  // FREQUENCY
  // -------------------------
  const frequencyBaseInput = document.getElementById('frequencyBaseInput');
  if (frequencyBaseInput) {
    frequencyBaseInput.value = settings.frequencyBase;
  }

  const frequencyChangeScalingInput = document.getElementById('frequencyChangeScalingInput');
  if (frequencyChangeScalingInput) {
    frequencyChangeScalingInput.value = settings.frequencyChangeScaling;
  }

  const frequencyClampMinInput = document.getElementById('frequencyClampMinInput');
  if (frequencyClampMinInput) {
    frequencyClampMinInput.value = settings.frequencyClamp.min;
  }

  const frequencyClampMaxInput = document.getElementById('frequencyClampMaxInput');
  if (frequencyClampMaxInput) {
    frequencyClampMaxInput.value = settings.frequencyClamp.max;
  }

  const frequencyNoiseRangeInput = document.getElementById('frequencyNoiseRangeInput');
  if (frequencyNoiseRangeInput) {
    frequencyNoiseRangeInput.value = settings.frequencyNoiseRange;
  }

  // -------------------------
  // FCR-N
  // -------------------------
  const fcrNSoCMinInput = document.getElementById('fcrNSoCMinInput');
  if (fcrNSoCMinInput) {
    fcrNSoCMinInput.value = settings.fcrNSoCMin;
  }

  const fcrNSoCMaxInput = document.getElementById('fcrNSoCMaxInput');
  if (fcrNSoCMaxInput) {
    fcrNSoCMaxInput.value = settings.fcrNSoCMax;
  }

  const fcrNFrequencyRangeMinInput = document.getElementById('fcrNFrequencyRangeMinInput');
  if (fcrNFrequencyRangeMinInput) {
    fcrNFrequencyRangeMinInput.value = settings.fcrNFrequencyRange.min;
  }

  const fcrNFrequencyRangeMaxInput = document.getElementById('fcrNFrequencyRangeMaxInput');
  if (fcrNFrequencyRangeMaxInput) {
    fcrNFrequencyRangeMaxInput.value = settings.fcrNFrequencyRange.max;
  }

  const fcrNRevenuePerMWInput = document.getElementById('fcrNRevenuePerMWInput');
  if (fcrNRevenuePerMWInput) {
    fcrNRevenuePerMWInput.value = settings.fcrNRevenuePerMW;
  }

  const fcrNSoCChangePerMWInput = document.getElementById('fcrNSoCChangePerMWInput');
  if (fcrNSoCChangePerMWInput) {
    fcrNSoCChangePerMWInput.value = settings.fcrNSoCChangePerMW;
  }

  // -------------------------
  // FCR-D
  // -------------------------
  const fcrDActivationThresholdUpInput = document.getElementById('fcrDActivationThresholdUpInput');
  if (fcrDActivationThresholdUpInput) {
    fcrDActivationThresholdUpInput.value = settings.fcrDActivationThreshold.up;
  }

  const fcrDActivationThresholdDownInput = document.getElementById('fcrDActivationThresholdDownInput');
  if (fcrDActivationThresholdDownInput) {
    fcrDActivationThresholdDownInput.value = settings.fcrDActivationThreshold.down;
  }

  const fcrDRampTimePartialInput = document.getElementById('fcrDRampTimePartialInput');
  if (fcrDRampTimePartialInput) {
    fcrDRampTimePartialInput.value = settings.fcrDRampTimePartial;
  }

  const fcrDRampTimeFullInput = document.getElementById('fcrDRampTimeFullInput');
  if (fcrDRampTimeFullInput) {
    fcrDRampTimeFullInput.value = settings.fcrDRampTimeFull;
  }

  const fcrDFrequencyImpactPartialInput = document.getElementById('fcrDFrequencyImpactPartialInput');
  if (fcrDFrequencyImpactPartialInput) {
    fcrDFrequencyImpactPartialInput.value = settings.fcrDFrequencyImpactPartial;
  }

  const fcrDFrequencyImpactFullInput = document.getElementById('fcrDFrequencyImpactFullInput');
  if (fcrDFrequencyImpactFullInput) {
    fcrDFrequencyImpactFullInput.value = settings.fcrDFrequencyImpactFull;
  }

  const fcrDSoCImpactPartialInput = document.getElementById('fcrDSoCImpactPartialInput');
  if (fcrDSoCImpactPartialInput) {
    fcrDSoCImpactPartialInput.value = settings.fcrDSoCImpactPartial;
  }

  const fcrDSoCImpactFullInput = document.getElementById('fcrDSoCImpactFullInput');
  if (fcrDSoCImpactFullInput) {
    fcrDSoCImpactFullInput.value = settings.fcrDSoCImpactFull;
  }

  const fcrDRevenuePerSecPartialInput = document.getElementById('fcrDRevenuePerSecPartialInput');
  if (fcrDRevenuePerSecPartialInput) {
    fcrDRevenuePerSecPartialInput.value = settings.fcrDRevenuePerSecPartial;
  }

  const fcrDRevenuePerSecFullInput = document.getElementById('fcrDRevenuePerSecFullInput');
  if (fcrDRevenuePerSecFullInput) {
    fcrDRevenuePerSecFullInput.value = settings.fcrDRevenuePerSecFull;
  }

  // -------------------------
  // FFR
  // -------------------------
  const ffrActivationThresholdInput = document.getElementById('ffrActivationThresholdInput');
  if (ffrActivationThresholdInput) {
    ffrActivationThresholdInput.value = settings.ffrActivationThreshold;
  }

  const ffrActivationDurationInput = document.getElementById('ffrActivationDurationInput');
  if (ffrActivationDurationInput) {
    ffrActivationDurationInput.value = settings.ffrActivationDuration;
  }

  const ffrSupportDurationInput = document.getElementById('ffrSupportDurationInput');
  if (ffrSupportDurationInput) {
    ffrSupportDurationInput.value = settings.ffrSupportDuration;
  }

  const ffrDeactivationTimeInput = document.getElementById('ffrDeactivationTimeInput');
  if (ffrDeactivationTimeInput) {
    ffrDeactivationTimeInput.value = settings.ffrDeactivationTime;
  }

  const ffrBufferTimeInput = document.getElementById('ffrBufferTimeInput');
  if (ffrBufferTimeInput) {
    ffrBufferTimeInput.value = settings.ffrBufferTime;
  }

  const ffrRecoveryTimeInput = document.getElementById('ffrRecoveryTimeInput');
  if (ffrRecoveryTimeInput) {
    ffrRecoveryTimeInput.value = settings.ffrRecoveryTime;
  }

  // -------------------------
  // MARKET PRICES
  // -------------------------
  const spotPriceBaseRatesNight1Input = document.getElementById('spotPriceBaseRatesNight1Input');
  if (spotPriceBaseRatesNight1Input) {
    spotPriceBaseRatesNight1Input.value = settings.spotPriceBaseRates.night1;
  }

  const spotPriceBaseRatesMorningPeakInput = document.getElementById('spotPriceBaseRatesMorningPeakInput');
  if (spotPriceBaseRatesMorningPeakInput) {
    spotPriceBaseRatesMorningPeakInput.value = settings.spotPriceBaseRates.morningPeak;
  }

  const spotPriceBaseRatesDayInput = document.getElementById('spotPriceBaseRatesDayInput');
  if (spotPriceBaseRatesDayInput) {
    spotPriceBaseRatesDayInput.value = settings.spotPriceBaseRates.day;
  }

  const spotPriceBaseRatesNight2Input = document.getElementById('spotPriceBaseRatesNight2Input');
  if (spotPriceBaseRatesNight2Input) {
    spotPriceBaseRatesNight2Input.value = settings.spotPriceBaseRates.night2;
  }

  const spotPriceClampMinInput = document.getElementById('spotPriceClampMinInput');
  if (spotPriceClampMinInput) {
    spotPriceClampMinInput.value = settings.spotPriceClamp.min;
  }

  const spotPriceClampMaxInput = document.getElementById('spotPriceClampMaxInput');
  if (spotPriceClampMaxInput) {
    spotPriceClampMaxInput.value = settings.spotPriceClamp.max;
  }

  const spotPriceImbalanceUpperScaleInput = document.getElementById('spotPriceImbalanceUpperScaleInput');
  if (spotPriceImbalanceUpperScaleInput) {
    spotPriceImbalanceUpperScaleInput.value = settings.spotPriceImbalanceUpperScale;
  }

  const spotPriceImbalanceLowerScaleInput = document.getElementById('spotPriceImbalanceLowerScaleInput');
  if (spotPriceImbalanceLowerScaleInput) {
    spotPriceImbalanceLowerScaleInput.value = settings.spotPriceImbalanceLowerScale;
  }

  // -------------------------
  // BATTERY
  // -------------------------
  const batteryInitialSoCInput = document.getElementById('batteryInitialSoCInput');
  if (batteryInitialSoCInput) {
    batteryInitialSoCInput.value = settings.batteryInitialSoC;
  }

  const batteryMaxSoCInput = document.getElementById('batteryMaxSoCInput');
  if (batteryMaxSoCInput) {
    batteryMaxSoCInput.value = settings.batteryMaxSoC;
  }

  const batteryMinSoCInput = document.getElementById('batteryMinSoCInput');
  if (batteryMinSoCInput) {
    batteryMinSoCInput.value = settings.batteryMinSoC;
  }

  const batteryCostPerMWhInput = document.getElementById('batteryCostPerMWhInput');
  if (batteryCostPerMWhInput) {
    batteryCostPerMWhInput.value = settings.batteryCostPerMWh;
  }

  const batteryIncomePerMWhInput = document.getElementById('batteryIncomePerMWhInput');
  if (batteryIncomePerMWhInput) {
    batteryIncomePerMWhInput.value = settings.batteryIncomePerMWh;
  }

  const batterySoCChangePerDischargeMWhInput = document.getElementById('batterySoCChangePerDischargeMWhInput');
  if (batterySoCChangePerDischargeMWhInput) {
    batterySoCChangePerDischargeMWhInput.value = settings.batterySoCChangePerDischargeMWh;
  }

  const batterySoCChangePerChargeMWhInput = document.getElementById('batterySoCChangePerChargeMWhInput');
  if (batterySoCChangePerChargeMWhInput) {
    batterySoCChangePerChargeMWhInput.value = settings.batterySoCChangePerChargeMWh;
  }

  // -------------------------
  // UI SETTINGS
  // -------------------------
  const uiUpdateIntervalMsInput = document.getElementById('uiUpdateIntervalMsInput');
  if (uiUpdateIntervalMsInput) {
    uiUpdateIntervalMsInput.value = settings.uiUpdateIntervalMs;
  }
}



function saveSettingsFromPanel() {
  // GAME TIME
  const gameDurationInput = document.getElementById('gameDurationInput');
  if (gameDurationInput) {
    settings.gameDurationSeconds = parseFloat(gameDurationInput.value);
  }

  // ENVIRONMENT
  const temperatureAmplitudeInput = document.getElementById('temperatureAmplitudeInput');
  if (temperatureAmplitudeInput) {
    settings.temperatureAmplitude = parseFloat(temperatureAmplitudeInput.value);
  }

  const temperatureMidpointInput = document.getElementById('temperatureMidpointInput');
  if (temperatureMidpointInput) {
    settings.temperatureMidpoint = parseFloat(temperatureMidpointInput.value);
  }

  const windBaselineAmplitudeInput = document.getElementById('windBaselineAmplitudeInput');
  if (windBaselineAmplitudeInput) {
    settings.windBaselineAmplitude = parseFloat(windBaselineAmplitudeInput.value);
  }

  const windBaselineMidpointInput = document.getElementById('windBaselineMidpointInput');
  if (windBaselineMidpointInput) {
    settings.windBaselineMidpoint = parseFloat(windBaselineMidpointInput.value);
  }

  const windSpeedMaxInput = document.getElementById('windSpeedMaxInput');
  if (windSpeedMaxInput) {
    settings.windSpeedMax = parseFloat(windSpeedMaxInput.value);
  }

  const windSpeedMinInput = document.getElementById('windSpeedMinInput');
  if (windSpeedMinInput) {
    settings.windSpeedMin = parseFloat(windSpeedMinInput.value);
  }

  // CAPACITIES & GAS
  const pvGenerationMaxMWInput = document.getElementById('pvGenerationMaxMWInput');
  if (pvGenerationMaxMWInput) {
    settings.pvGenerationMaxMW = parseFloat(pvGenerationMaxMWInput.value);
  }

  const windGenerationMaxMWInput = document.getElementById('windGenerationMaxMWInput');
  if (windGenerationMaxMWInput) {
    settings.windGenerationMaxMW = parseFloat(windGenerationMaxMWInput.value);
  }

  const gasGenerationMaxMWInput = document.getElementById('gasGenerationMaxMWInput');
  if (gasGenerationMaxMWInput) {
    settings.gasGenerationMaxMW = parseFloat(gasGenerationMaxMWInput.value);
  }

  const initialGasMWInput = document.getElementById('initialGasMWInput');
  if (initialGasMWInput) {
    settings.initialGasMW = parseFloat(initialGasMWInput.value);
  }

  const gasGenerationMWInput = document.getElementById('gasGenerationMWInput');
  if (gasGenerationMWInput) {
    settings.gasGenerationMW = parseFloat(gasGenerationMWInput.value);
  }

  // DEMAND
  const demandBaseMWInput = document.getElementById('demandBaseMWInput');
  if (demandBaseMWInput) {
    settings.demandBaseMW = parseFloat(demandBaseMWInput.value);
  }

  const demandPeakMultiplierMorningInput = document.getElementById('demandPeakMultiplierMorningInput');
  if (demandPeakMultiplierMorningInput) {
    settings.demandPeakMultiplierMorning = parseFloat(demandPeakMultiplierMorningInput.value);
  }

  const demandPeakMultiplierEveningInput = document.getElementById('demandPeakMultiplierEveningInput');
  if (demandPeakMultiplierEveningInput) {
    settings.demandPeakMultiplierEvening = parseFloat(demandPeakMultiplierEveningInput.value);
  }

  const demandTemperatureFactorInput = document.getElementById('demandTemperatureFactorInput');
  if (demandTemperatureFactorInput) {
    settings.demandTemperatureFactor = parseFloat(demandTemperatureFactorInput.value);
  }

  // FREQUENCY
  const frequencyBaseInput = document.getElementById('frequencyBaseInput');
  if (frequencyBaseInput) {
    settings.frequencyBase = parseFloat(frequencyBaseInput.value);
  }

  const frequencyChangeScalingInput = document.getElementById('frequencyChangeScalingInput');
  if (frequencyChangeScalingInput) {
    settings.frequencyChangeScaling = parseFloat(frequencyChangeScalingInput.value);
  }

  const frequencyClampMinInput = document.getElementById('frequencyClampMinInput');
  if (frequencyClampMinInput) {
    settings.frequencyClamp.min = parseFloat(frequencyClampMinInput.value);
  }

  const frequencyClampMaxInput = document.getElementById('frequencyClampMaxInput');
  if (frequencyClampMaxInput) {
    settings.frequencyClamp.max = parseFloat(frequencyClampMaxInput.value);
  }

  const frequencyNoiseRangeInput = document.getElementById('frequencyNoiseRangeInput');
  if (frequencyNoiseRangeInput) {
    settings.frequencyNoiseRange = parseFloat(frequencyNoiseRangeInput.value);
  }

  // FCR-N
  const fcrNSoCMinInput = document.getElementById('fcrNSoCMinInput');
  if (fcrNSoCMinInput) {
    settings.fcrNSoCMin = parseFloat(fcrNSoCMinInput.value);
  }

  const fcrNSoCMaxInput = document.getElementById('fcrNSoCMaxInput');
  if (fcrNSoCMaxInput) {
    settings.fcrNSoCMax = parseFloat(fcrNSoCMaxInput.value);
  }

  const fcrNFrequencyRangeMinInput = document.getElementById('fcrNFrequencyRangeMinInput');
  if (fcrNFrequencyRangeMinInput) {
    settings.fcrNFrequencyRange.min = parseFloat(fcrNFrequencyRangeMinInput.value);
  }

  const fcrNFrequencyRangeMaxInput = document.getElementById('fcrNFrequencyRangeMaxInput');
  if (fcrNFrequencyRangeMaxInput) {
    settings.fcrNFrequencyRange.max = parseFloat(fcrNFrequencyRangeMaxInput.value);
  }

  const fcrNRevenuePerMWInput = document.getElementById('fcrNRevenuePerMWInput');
  if (fcrNRevenuePerMWInput) {
    settings.fcrNRevenuePerMW = parseFloat(fcrNRevenuePerMWInput.value);
  }

  const fcrNSoCChangePerMWInput = document.getElementById('fcrNSoCChangePerMWInput');
  if (fcrNSoCChangePerMWInput) {
    settings.fcrNSoCChangePerMW = parseFloat(fcrNSoCChangePerMWInput.value);
  }

  // FCR-D
  const fcrDActivationThresholdUpInput = document.getElementById('fcrDActivationThresholdUpInput');
  if (fcrDActivationThresholdUpInput) {
    settings.fcrDActivationThreshold.up = parseFloat(fcrDActivationThresholdUpInput.value);
  }

  const fcrDActivationThresholdDownInput = document.getElementById('fcrDActivationThresholdDownInput');
  if (fcrDActivationThresholdDownInput) {
    settings.fcrDActivationThreshold.down = parseFloat(fcrDActivationThresholdDownInput.value);
  }

  const fcrDRampTimePartialInput = document.getElementById('fcrDRampTimePartialInput');
  if (fcrDRampTimePartialInput) {
    settings.fcrDRampTimePartial = parseFloat(fcrDRampTimePartialInput.value);
  }

  const fcrDRampTimeFullInput = document.getElementById('fcrDRampTimeFullInput');
  if (fcrDRampTimeFullInput) {
    settings.fcrDRampTimeFull = parseFloat(fcrDRampTimeFullInput.value);
  }

  const fcrDFrequencyImpactPartialInput = document.getElementById('fcrDFrequencyImpactPartialInput');
  if (fcrDFrequencyImpactPartialInput) {
    settings.fcrDFrequencyImpactPartial = parseFloat(fcrDFrequencyImpactPartialInput.value);
  }

  const fcrDFrequencyImpactFullInput = document.getElementById('fcrDFrequencyImpactFullInput');
  if (fcrDFrequencyImpactFullInput) {
    settings.fcrDFrequencyImpactFull = parseFloat(fcrDFrequencyImpactFullInput.value);
  }

  const fcrDSoCImpactPartialInput = document.getElementById('fcrDSoCImpactPartialInput');
  if (fcrDSoCImpactPartialInput) {
    settings.fcrDSoCImpactPartial = parseFloat(fcrDSoCImpactPartialInput.value);
  }

  const fcrDSoCImpactFullInput = document.getElementById('fcrDSoCImpactFullInput');
  if (fcrDSoCImpactFullInput) {
    settings.fcrDSoCImpactFull = parseFloat(fcrDSoCImpactFullInput.value);
  }

  const fcrDRevenuePerSecPartialInput = document.getElementById('fcrDRevenuePerSecPartialInput');
  if (fcrDRevenuePerSecPartialInput) {
    settings.fcrDRevenuePerSecPartial = parseFloat(fcrDRevenuePerSecPartialInput.value);
  }

  const fcrDRevenuePerSecFullInput = document.getElementById('fcrDRevenuePerSecFullInput');
  if (fcrDRevenuePerSecFullInput) {
    settings.fcrDRevenuePerSecFull = parseFloat(fcrDRevenuePerSecFullInput.value);
  }

  // FFR
  const ffrActivationThresholdInput = document.getElementById('ffrActivationThresholdInput');
  if (ffrActivationThresholdInput) {
    settings.ffrActivationThreshold = parseFloat(ffrActivationThresholdInput.value);
  }

  const ffrActivationDurationInput = document.getElementById('ffrActivationDurationInput');
  if (ffrActivationDurationInput) {
    settings.ffrActivationDuration = parseFloat(ffrActivationDurationInput.value);
  }

  const ffrSupportDurationInput = document.getElementById('ffrSupportDurationInput');
  if (ffrSupportDurationInput) {
    settings.ffrSupportDuration = parseFloat(ffrSupportDurationInput.value);
  }

  const ffrDeactivationTimeInput = document.getElementById('ffrDeactivationTimeInput');
  if (ffrDeactivationTimeInput) {
    settings.ffrDeactivationTime = parseFloat(ffrDeactivationTimeInput.value);
  }

  const ffrBufferTimeInput = document.getElementById('ffrBufferTimeInput');
  if (ffrBufferTimeInput) {
    settings.ffrBufferTime = parseFloat(ffrBufferTimeInput.value);
  }

  const ffrRecoveryTimeInput = document.getElementById('ffrRecoveryTimeInput');
  if (ffrRecoveryTimeInput) {
    settings.ffrRecoveryTime = parseFloat(ffrRecoveryTimeInput.value);
  }

  // MARKET PRICES
  const spotPriceBaseRatesNight1Input = document.getElementById('spotPriceBaseRatesNight1Input');
  if (spotPriceBaseRatesNight1Input) {
    settings.spotPriceBaseRates.night1 = parseFloat(spotPriceBaseRatesNight1Input.value);
  }

  const spotPriceBaseRatesMorningPeakInput = document.getElementById('spotPriceBaseRatesMorningPeakInput');
  if (spotPriceBaseRatesMorningPeakInput) {
    settings.spotPriceBaseRates.morningPeak = parseFloat(spotPriceBaseRatesMorningPeakInput.value);
  }

  const spotPriceBaseRatesDayInput = document.getElementById('spotPriceBaseRatesDayInput');
  if (spotPriceBaseRatesDayInput) {
    settings.spotPriceBaseRates.day = parseFloat(spotPriceBaseRatesDayInput.value);
  }

  const spotPriceBaseRatesNight2Input = document.getElementById('spotPriceBaseRatesNight2Input');
  if (spotPriceBaseRatesNight2Input) {
    settings.spotPriceBaseRates.night2 = parseFloat(spotPriceBaseRatesNight2Input.value);
  }

  const spotPriceClampMinInput = document.getElementById('spotPriceClampMinInput');
  if (spotPriceClampMinInput) {
    settings.spotPriceClamp.min = parseFloat(spotPriceClampMinInput.value);
  }

  const spotPriceClampMaxInput = document.getElementById('spotPriceClampMaxInput');
  if (spotPriceClampMaxInput) {
    settings.spotPriceClamp.max = parseFloat(spotPriceClampMaxInput.value);
  }

  const spotPriceImbalanceUpperScaleInput = document.getElementById('spotPriceImbalanceUpperScaleInput');
  if (spotPriceImbalanceUpperScaleInput) {
    settings.spotPriceImbalanceUpperScale = parseFloat(spotPriceImbalanceUpperScaleInput.value);
  }

  const spotPriceImbalanceLowerScaleInput = document.getElementById('spotPriceImbalanceLowerScaleInput');
  if (spotPriceImbalanceLowerScaleInput) {
    settings.spotPriceImbalanceLowerScale = parseFloat(spotPriceImbalanceLowerScaleInput.value);
  }

  // BATTERY
  const batteryInitialSoCInput = document.getElementById('batteryInitialSoCInput');
  if (batteryInitialSoCInput) {
    settings.batteryInitialSoC = parseFloat(batteryInitialSoCInput.value);
  }

  const batteryMaxSoCInput = document.getElementById('batteryMaxSoCInput');
  if (batteryMaxSoCInput) {
    settings.batteryMaxSoC = parseFloat(batteryMaxSoCInput.value);
  }

  const batteryMinSoCInput = document.getElementById('batteryMinSoCInput');
  if (batteryMinSoCInput) {
    settings.batteryMinSoC = parseFloat(batteryMinSoCInput.value);
  }

  const batteryCostPerMWhInput = document.getElementById('batteryCostPerMWhInput');
  if (batteryCostPerMWhInput) {
    settings.batteryCostPerMWh = parseFloat(batteryCostPerMWhInput.value);
  }

  const batteryIncomePerMWhInput = document.getElementById('batteryIncomePerMWhInput');
  if (batteryIncomePerMWhInput) {
    settings.batteryIncomePerMWh = parseFloat(batteryIncomePerMWhInput.value);
  }

  const batterySoCChangePerDischargeMWhInput = document.getElementById('batterySoCChangePerDischargeMWhInput');
  if (batterySoCChangePerDischargeMWhInput) {
    settings.batterySoCChangePerDischargeMWh = parseFloat(batterySoCChangePerDischargeMWhInput.value);
  }

  const batterySoCChangePerChargeMWhInput = document.getElementById('batterySoCChangePerChargeMWhInput');
  if (batterySoCChangePerChargeMWhInput) {
    settings.batterySoCChangePerChargeMWh = parseFloat(batterySoCChangePerChargeMWhInput.value);
  }

  // UI SETTINGS
  const uiUpdateIntervalMsInput = document.getElementById('uiUpdateIntervalMsInput');
  if (uiUpdateIntervalMsInput) {
    settings.uiUpdateIntervalMs = parseFloat(uiUpdateIntervalMsInput.value);
  }

  // ---- Final Steps ----
  updateDerivedSettings();             // e.g., recalc compressedMinutesPerSecond
  // localStorage.setItem("someKey", JSON.stringify(settings));  // (optional) store in localStorage
  logToConsole("Player updated settings and saved them");
}