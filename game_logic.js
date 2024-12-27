/*****************************************************
 * CONFIGURATION - SETTINGS OBJECT
 *****************************************************/

// ================== SETTINGS OBJECT ==================
let settings = {
    // =============== GAME TIME SETTINGS =================
    gameDurationSeconds: 180, // Total game duration in real seconds (3 minutes)
    compressedMinutesPerSecond: 1440 / 180, // 24h / 3min => 8 min per real second
  
    // =============== ENVIRONMENT PARAMETERS =================
    temperatureAmplitude: 10, // Amplitude for temperature oscillation (±10°C)
    temperatureMidpoint: 5, // Midpoint temperature (°C)
    windBaselineAmplitude: 3, // Amplitude for wind speed oscillation (±3 m/s)
    windBaselineMidpoint: 5, // Midpoint wind speed (m/s)
    windSpeedMax: 10, // Maximum wind speed for power generation (m/s)
    windSpeedMin: 0, // Minimum wind speed (m/s)
  
    pvGenerationMaxGW: 5, // Maximum PV (solar) generation (GW)
    windGenerationMaxGW: 10, // Maximum Wind generation (GW)
    baselineGenerationGW: 40, // Baseline generation from non-renewable sources (GW)
  
    // =============== DEMAND PARAMETERS =================
    demandBaseGW: 50, // Baseline demand (GW)
    demandPeakMultiplierMorning: 1.2, // Morning peak demand multiplier
    demandPeakMultiplierEvening: 1.3, // Evening peak demand multiplier
    demandTemperatureFactor: 1, // Demand increase per °C below 0°C
  
    // =============== FREQUENCY PARAMETERS =================
    frequencyBase: 50.0, // Base frequency (Hz)
    frequencyChangeScaling: 0.005, // Scaling factor for frequency change per GW imbalance
    frequencyClamp: { // Frequency bounds to prevent extreme jumps
      min: 49.0,
      max: 51.0
    },
    frequencyNoiseRange: 0.02, // Random noise added to frequency (±0.02 Hz)
  
    // =============== FCR-N PARAMETERS =================
    fcrNSoCMin: 40, // Minimum State of Charge (%) to enable FCR-N
    fcrNSoCMax: 60, // Maximum State of Charge (%) to enable FCR-N
    fcrNFrequencyRange: { // Frequency range to enable FCR-N
      min: 49.5,
      max: 50.5
    },
    fcrNRevenuePerMW: 10, // Revenue earned per MW for FCR-N
    fcrNSoCChangePerMW: 0.3, // SoC change per MW commanded by FCR-N
  
    // =============== FCR-D PARAMETERS =================
    fcrDActivationThreshold: { // Frequency thresholds to activate FCR-D
      up: 49.9, // Below this, FCR-D Up can activate
      down: 50.1 // Above this, FCR-D Down can activate
    },
    fcrDRampTimePartial: 5, // Time in seconds to reach partial activation
    fcrDRampTimeFull: 30, // Time in seconds to reach full activation
    fcrDFrequencyImpactPartial: 0.03, // Frequency change per second at partial activation
    fcrDFrequencyImpactFull: 0.06, // Frequency change per second at full activation
    fcrDSoCImpactPartial: -1, // SoC change per second at partial activation
    fcrDSoCImpactFull: -2, // SoC change per second at full activation
    fcrDRevenuePerSecPartial: 5, // Revenue per second at partial activation
    fcrDRevenuePerSecFull: 10, // Revenue per second at full activation
  
    // =============== FFR PARAMETERS =================
    ffrActivationThreshold: 49.7, // Frequency threshold to trigger FFR (Hz)
    ffrActivationDuration: 1.0, // Duration to activate FFR (seconds)
    ffrSupportDuration: 1.0, // Support duration for FFR (seconds)
    ffrDeactivationTime: 1.0, // Time to deactivate FFR (seconds)
    ffrBufferTime: 10.0, // Buffer time after deactivation (seconds)
    ffrRecoveryTime: 900, // Recovery time after buffer (seconds)
  
    // =============== MARKET PRICES =================
    spotPriceBaseRates: { // Base spot prices based on time of day
      night1: 0.0555, // 00:00-06:00 EUR/kWh
      morningPeak: 0.011, // 06:00-09:00 EUR/kWh
      day: 0.2, // 09:00-21:00 EUR/kWh
      night2: 0.0084 // 21:00-24:00 EUR/kWh
    },
    spotPriceClamp: { // Spot price bounds
      min: 0.005,
      max: 0.5
    },
    spotPriceImbalanceUpperScale: 0.05, // Spot price increase per GW shortage
    spotPriceImbalanceLowerScale: 0.02, // Spot price decrease per GW surplus
  
    // =============== BATTERY PARAMETERS =================
    batteryInitialSoC: 50, // Initial State of Charge (%)
    batteryMaxSoC: 100, // Maximum SoC (%)
    batteryMinSoC: 0, // Minimum SoC (%)
    batteryCostPerMWh: 1, // Cost to charge per MWh
    batteryIncomePerMWh: 0.5, // Income from discharge per MWh
    batterySoCChangePerDischargeMWh: 5, // SoC change per discharge action
    batterySoCChangePerChargeMWh: 5, // SoC change per charge action
  
    // =============== UI PARAMETERS =================
    uiUpdateIntervalMs: 1000 // UI update interval (milliseconds)
  };
  
  /*****************************************************
   * GLOBAL VARIABLES - GAME STATE
   *****************************************************/
  
  // =============== GAME TIME =================
  let timeRemaining = settings.gameDurationSeconds; // Time left in the game (seconds)
  let timeOfDayMinutes = 0; // Current time of day in minutes (0..1440)
  
  // =============== ENVIRONMENT STATE =================
  let currentSunCondition = "Dark"; // Current sun condition
  let lastHourChecked = -1; // Last hour checked for sun condition updates
  let currentTemperature = 0; // Current temperature (°C)
  let currentWind = settings.windBaselineMidpoint; // Current wind speed (m/s)
  let currentDemand = settings.demandBaseGW; // Current power demand (GW)
  let currentGeneration = settings.baselineGenerationGW; // Current total power generation (GW)
  
  // =============== GENERATION STATE =================
  let windGenerationGW = 0; // Current wind power generation (GW)
  let pvGenerationGW = 0; // Current PV power generation (GW)
  
  // =============== FREQUENCY STATE =================
  let frequency = settings.frequencyBase; // Current grid frequency (Hz)
  
  // =============== BATTERY STATE =================
  let soc = settings.batteryInitialSoC; // Current State of Charge (%)
  let cycleCount = 0; // Number of charge/discharge cycles used
  let revenue = 0; // Total revenue earned
  
  // =============== FCR / FFR STATE =================
  let fcrNToggled = false; // Whether FCR-N is active
  let fcrDUpActive = false; // Whether FCR-D Up is active
  let fcrDDownActive = false; // Whether FCR-D Down is active
  let ffrActive = false; // Whether FFR is active
  let fcrNWasForcedOff = false; // Whether FCR-N was forced off due to FCR-D activation
  
  // =============== FFR TRACKING =================
  let ffrEnergyDischarged = 0; // Total energy discharged during FFR (MWh)
  let ffrRevenue = 0; // Total revenue earned from FFR (EUR)
  
  // FCR-D States
  const FCRD_UP_STATE = { INACTIVE: 'inactive', PARTIAL: 'partial', FULL: 'full' };
  const FCRD_DOWN_STATE = { INACTIVE: 'inactive', PARTIAL: 'partial', FULL: 'full' };
  let fcrDUpState = FCRD_UP_STATE.INACTIVE;
  let fcrDDownState = FCRD_DOWN_STATE.INACTIVE;
  let fcrDUpTimer = 0;
  let fcrDDownTimer = 0;
  
  // FFR States
  let ffrState = "idle"; // Current FFR state
  let ffrActivationTime = 0; // Timer for FFR activation
  let isBatteryAvailable = true; // Whether the battery is available for FFR
  let isFfrProfileWindow = false; // Whether FFR profile window is active
  let isFfrFlexOrdered = false; // Whether FFR is flex-ordered by TSO
  
  // Current Prices
  let currentSpotPrice = 0;
  let currentWholesalePrice = 0;
  
  /*****************************************************
   * DOM ELEMENTS
   *****************************************************/
  const elements = {
    frequencyArrow: document.getElementById('frequencyArrow'),
    frequencyValue: document.getElementById('frequencyValue'),
    batterySoc: document.getElementById('batterySoc'),
    batteryLabel: document.getElementById('batteryLabel'),
    status: document.getElementById('status'),
    timer: document.getElementById('timer'),
    revenue: document.getElementById('revenue'),
    cycleCount: document.getElementById('cycleCount'),
    lossMessage: document.getElementById('lossMessage'),
    batteryWarning: document.getElementById('batteryWarning'),
    timeOfDay: document.getElementById('timeOfDay'),
    temperature: document.getElementById('temperature'),
    wind: document.getElementById('wind'),
    sun: document.getElementById('sun'),
    spotPrice: document.getElementById('spotPrice'),
    wholesalePrice: document.getElementById('wholesalePrice'),
    gameConsole: document.getElementById('gameConsole'),
    demand: document.getElementById('demand'), // Newly added for currentDemand
    generation: document.getElementById('generation'), // Newly added for currentGeneration
    windGeneration: document.getElementById('windGeneration'),
    pvGeneration: document.getElementById('pvGeneration'),
    baselineGeneration: document.getElementById('baselineGeneration'), // Optional
    ffrEnergyDischarged: document.getElementById('ffrEnergyDischarged'), // For FFR Metrics
    ffrRevenue: document.getElementById('ffrRevenue'), // For FFR Metrics
    ffrIndicator: document.getElementById('ffrIndicator') // Optional
  };
  
  const buttons = {
    startGame: document.getElementById('startGame'),
    restartGame: document.getElementById('restartGame'),
    charge: document.getElementById('charge'),
    discharge: document.getElementById('discharge'),
    saveSettings: document.getElementById('saveSettings'),
    resetSettings: document.getElementById('resetSettings')
  };
  
  const toggles = {
    fcrNToggle: document.getElementById('fcrNToggle'),
    fcrDUpToggle: document.getElementById('fcrDUpToggle'),
    fcrDDownToggle: document.getElementById('fcrDDownToggle'),
    ffrToggle: document.getElementById('ffrToggle')
  };
  
  const settingsButton = document.getElementById('settingsButton');
  const settingsPanel = document.getElementById('settingsPanel');
  
  /*****************************************************
   * LOG TO CONSOLE
   *****************************************************/
  function logToConsole(msg) {
    if (elements.gameConsole) {
      const line = document.createElement("div");
      line.textContent = msg;
      elements.gameConsole.appendChild(line);
      elements.gameConsole.scrollTop = elements.gameConsole.scrollHeight;
    }
    
    // Also log to the browser console for debugging
    console.log(msg);
  }
  
  /*****************************************************
   * HELPER FUNCTIONS
   *****************************************************/
  
  /**
   * Format time from minutes to "HH:MM" format.
   * @param {number} tMinutes - Time in minutes.
   * @returns {string} Formatted time string.
   */
  function formatTime(tMinutes) {
    const hours = Math.floor(tMinutes / 60) % 24;
    const minutes = tMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // Accordion Functionality
  document.querySelectorAll('.accordion-button').forEach(button => {
    button.addEventListener('click', () => {
      const accordionItem = button.parentElement;
      const accordionContent = button.nextElementSibling;
      
      // Toggle active state
      accordionItem.classList.toggle('active');
      
      // Toggle display of content
      if (accordionItem.classList.contains('active')) {
        accordionContent.style.display = 'block';
      } else {
        accordionContent.style.display = 'none';
      }
    });
  });
  
  /*****************************************************
   * SETTINGS PANEL FUNCTIONALITY
   *****************************************************/
  
  // Function to open the settings panel
  function openSettingsPanel() {
    settingsPanel.classList.add('active');
  }
  
  // Function to close the settings panel
  function closeSettingsPanel() {
    settingsPanel.classList.remove('active');
  }
  
  // Toggle settings panel on button click
  settingsButton.addEventListener('click', () => {
    if (settingsPanel.classList.contains('active')) {
      closeSettingsPanel();
    } else {
      openSettingsPanel();
      loadSettingsToPanel();
    }
  });
  
  // Function to load current settings into the panel's input fields
  function loadSettingsToPanel() {
    // Game Time Settings
    document.getElementById('gameDurationSeconds').value = settings.gameDurationSeconds;
    document.getElementById('compressedMinutesPerSecond').value = settings.compressedMinutesPerSecond.toFixed(1);
  
    // Environment Parameters
    document.getElementById('temperatureAmplitude').value = settings.temperatureAmplitude;
    document.getElementById('temperatureMidpoint').value = settings.temperatureMidpoint;
    document.getElementById('windBaselineAmplitude').value = settings.windBaselineAmplitude;
    document.getElementById('windBaselineMidpoint').value = settings.windBaselineMidpoint;
    document.getElementById('windSpeedMax').value = settings.windSpeedMax;
    document.getElementById('windSpeedMin').value = settings.windSpeedMin;
    document.getElementById('pvGenerationMaxGW').value = settings.pvGenerationMaxGW;
    document.getElementById('windGenerationMaxGW').value = settings.windGenerationMaxGW;
    document.getElementById('baselineGenerationGW').value = settings.baselineGenerationGW;
  
    // Demand Parameters
    document.getElementById('demandBaseGW').value = settings.demandBaseGW;
    document.getElementById('demandPeakMultiplierMorning').value = settings.demandPeakMultiplierMorning;
    document.getElementById('demandPeakMultiplierEvening').value = settings.demandPeakMultiplierEvening;
    document.getElementById('demandTemperatureFactor').value = settings.demandTemperatureFactor;
  
    // Frequency Parameters
    document.getElementById('frequencyBase').value = settings.frequencyBase;
    document.getElementById('frequencyChangeScaling').value = settings.frequencyChangeScaling;
    document.getElementById('frequencyClampMin').value = settings.frequencyClamp.min;
    document.getElementById('frequencyClampMax').value = settings.frequencyClamp.max;
    document.getElementById('frequencyNoiseRange').value = settings.frequencyNoiseRange;
  
    // FCR-N Parameters
    document.getElementById('fcrNSoCMin').value = settings.fcrNSoCMin;
    document.getElementById('fcrNSoCMax').value = settings.fcrNSoCMax;
    document.getElementById('fcrNFrequencyRangeMin').value = settings.fcrNFrequencyRange.min;
    document.getElementById('fcrNFrequencyRangeMax').value = settings.fcrNFrequencyRange.max;
    document.getElementById('fcrNRevenuePerMW').value = settings.fcrNRevenuePerMW;
    document.getElementById('fcrNSoCChangePerMW').value = settings.fcrNSoCChangePerMW;
  
    // FCR-D Parameters
    document.getElementById('fcrDActivationThresholdUp').value = settings.fcrDActivationThreshold.up;
    document.getElementById('fcrDActivationThresholdDown').value = settings.fcrDActivationThreshold.down;
    document.getElementById('fcrDRampTimePartial').value = settings.fcrDRampTimePartial;
    document.getElementById('fcrDRampTimeFull').value = settings.fcrDRampTimeFull;
    document.getElementById('fcrDFrequencyImpactPartial').value = settings.fcrDFrequencyImpactPartial;
    document.getElementById('fcrDFrequencyImpactFull').value = settings.fcrDFrequencyImpactFull;
    document.getElementById('fcrDSoCImpactPartial').value = settings.fcrDSoCImpactPartial;
    document.getElementById('fcrDSoCImpactFull').value = settings.fcrDSoCImpactFull;
    document.getElementById('fcrDRevenuePerSecPartial').value = settings.fcrDRevenuePerSecPartial;
    document.getElementById('fcrDRevenuePerSecFull').value = settings.fcrDRevenuePerSecFull;
  
    // FFR Parameters
    document.getElementById('ffrActivationThreshold').value = settings.ffrActivationThreshold;
    document.getElementById('ffrActivationDuration').value = settings.ffrActivationDuration;
    document.getElementById('ffrSupportDuration').value = settings.ffrSupportDuration;
    document.getElementById('ffrDeactivationTime').value = settings.ffrDeactivationTime;
    document.getElementById('ffrBufferTime').value = settings.ffrBufferTime;
    document.getElementById('ffrRecoveryTime').value = settings.ffrRecoveryTime;
  
    // Market Prices
    document.getElementById('spotPriceNight1').value = settings.spotPriceBaseRates.night1;
    document.getElementById('spotPriceMorningPeak').value = settings.spotPriceBaseRates.morningPeak;
    document.getElementById('spotPriceDay').value = settings.spotPriceBaseRates.day;
    document.getElementById('spotPriceNight2').value = settings.spotPriceBaseRates.night2;
    document.getElementById('spotPriceClampMin').value = settings.spotPriceClamp.min;
    document.getElementById('spotPriceClampMax').value = settings.spotPriceClamp.max;
    document.getElementById('spotPriceImbalanceUpperScale').value = settings.spotPriceImbalanceUpperScale;
    document.getElementById('spotPriceImbalanceLowerScale').value = settings.spotPriceImbalanceLowerScale;
  
    // Battery Parameters
    document.getElementById('batteryInitialSoC').value = settings.batteryInitialSoC;
    document.getElementById('batteryMaxSoC').value = settings.batteryMaxSoC;
    document.getElementById('batteryMinSoC').value = settings.batteryMinSoC;
    document.getElementById('batteryCostPerMWh').value = settings.batteryCostPerMWh;
    document.getElementById('batteryIncomePerMWh').value = settings.batteryIncomePerMWh;
    document.getElementById('batterySoCChangePerDischargeMWh').value = settings.batterySoCChangePerDischargeMWh;
    document.getElementById('batterySoCChangePerChargeMWh').value = settings.batterySoCChangePerChargeMWh;
  }
  
  /**
   * Validate settings before saving.
   * @returns {boolean} True if valid, else false.
   */
  function validateSettings() {
    // Example validations
    let isValid = true;
    let errorMsg = "";
  
    // Ensure batteryMaxSoC >= batteryMinSoC
    if (settings.batteryMaxSoC < settings.batteryMinSoC) {
      isValid = false;
      errorMsg += "Battery Max SoC cannot be less than Battery Min SoC.\n";
    }
  
    // Ensure frequencyClamp.min < frequencyClamp.max
    if (settings.frequencyClamp.min >= settings.frequencyClamp.max) {
      isValid = false;
      errorMsg += "Frequency Clamp Min must be less than Frequency Clamp Max.\n";
    }
  
    // Ensure FCR-N SoC min < SoC max
    if (settings.fcrNSoCMin >= settings.fcrNSoCMax) {
      isValid = false;
      errorMsg += "FCR-N SoC Min must be less than FCR-N SoC Max.\n";
    }
  
    // Additional validations can be added here
  
    if (!isValid) {
      alert("Settings Validation Failed:\n" + errorMsg);
    }
  
    return isValid;
  }
  
  /**
   * Save settings from the panel to the settings object
   */
  function saveSettings() {
    // Parse and assign values from input fields
    // Game Time Settings
    settings.gameDurationSeconds = parseInt(document.getElementById('gameDurationSeconds').value, 10);
    settings.compressedMinutesPerSecond = 1440 / settings.gameDurationSeconds;
    document.getElementById('compressedMinutesPerSecond').value = settings.compressedMinutesPerSecond.toFixed(1);
  
    // Environment Parameters
    settings.temperatureAmplitude = parseFloat(document.getElementById('temperatureAmplitude').value);
    settings.temperatureMidpoint = parseFloat(document.getElementById('temperatureMidpoint').value);
    settings.windBaselineAmplitude = parseFloat(document.getElementById('windBaselineAmplitude').value);
    settings.windBaselineMidpoint = parseFloat(document.getElementById('windBaselineMidpoint').value);
    settings.windSpeedMax = parseFloat(document.getElementById('windSpeedMax').value);
    settings.windSpeedMin = parseFloat(document.getElementById('windSpeedMin').value);
    settings.pvGenerationMaxGW = parseFloat(document.getElementById('pvGenerationMaxGW').value);
    settings.windGenerationMaxGW = parseFloat(document.getElementById('windGenerationMaxGW').value);
    settings.baselineGenerationGW = parseFloat(document.getElementById('baselineGenerationGW').value);
  
    // Demand Parameters
    settings.demandBaseGW = parseFloat(document.getElementById('demandBaseGW').value);
    settings.demandPeakMultiplierMorning = parseFloat(document.getElementById('demandPeakMultiplierMorning').value);
    settings.demandPeakMultiplierEvening = parseFloat(document.getElementById('demandPeakMultiplierEvening').value);
    settings.demandTemperatureFactor = parseFloat(document.getElementById('demandTemperatureFactor').value);
  
    // Frequency Parameters
    settings.frequencyBase = parseFloat(document.getElementById('frequencyBase').value);
    settings.frequencyChangeScaling = parseFloat(document.getElementById('frequencyChangeScaling').value);
    settings.frequencyClamp.min = parseFloat(document.getElementById('frequencyClampMin').value);
    settings.frequencyClamp.max = parseFloat(document.getElementById('frequencyClampMax').value);
    settings.frequencyNoiseRange = parseFloat(document.getElementById('frequencyNoiseRange').value);
  
    // FCR-N Parameters
    settings.fcrNSoCMin = parseFloat(document.getElementById('fcrNSoCMin').value);
    settings.fcrNSoCMax = parseFloat(document.getElementById('fcrNSoCMax').value);
    settings.fcrNFrequencyRange.min = parseFloat(document.getElementById('fcrNFrequencyRangeMin').value);
    settings.fcrNFrequencyRange.max = parseFloat(document.getElementById('fcrNFrequencyRangeMax').value);
    settings.fcrNRevenuePerMW = parseFloat(document.getElementById('fcrNRevenuePerMW').value);
    settings.fcrNSoCChangePerMW = parseFloat(document.getElementById('fcrNSoCChangePerMW').value);
  
    // FCR-D Parameters
    settings.fcrDActivationThreshold.up = parseFloat(document.getElementById('fcrDActivationThresholdUp').value);
    settings.fcrDActivationThreshold.down = parseFloat(document.getElementById('fcrDActivationThresholdDown').value);
    settings.fcrDRampTimePartial = parseFloat(document.getElementById('fcrDRampTimePartial').value);
    settings.fcrDRampTimeFull = parseFloat(document.getElementById('fcrDRampTimeFull').value);
    settings.fcrDFrequencyImpactPartial = parseFloat(document.getElementById('fcrDFrequencyImpactPartial').value);
    settings.fcrDFrequencyImpactFull = parseFloat(document.getElementById('fcrDFrequencyImpactFull').value);
    settings.fcrDSoCImpactPartial = parseFloat(document.getElementById('fcrDSoCImpactPartial').value);
    settings.fcrDSoCImpactFull = parseFloat(document.getElementById('fcrDSoCImpactFull').value);
    settings.fcrDRevenuePerSecPartial = parseFloat(document.getElementById('fcrDRevenuePerSecPartial').value);
    settings.fcrDRevenuePerSecFull = parseFloat(document.getElementById('fcrDRevenuePerSecFull').value);
  
    // FFR Parameters
    settings.ffrActivationThreshold = parseFloat(document.getElementById('ffrActivationThreshold').value);
    settings.ffrActivationDuration = parseFloat(document.getElementById('ffrActivationDuration').value);
    settings.ffrSupportDuration = parseFloat(document.getElementById('ffrSupportDuration').value);
    settings.ffrDeactivationTime = parseFloat(document.getElementById('ffrDeactivationTime').value);
    settings.ffrBufferTime = parseFloat(document.getElementById('ffrBufferTime').value);
    settings.ffrRecoveryTime = parseFloat(document.getElementById('ffrRecoveryTime').value);
  
    // Market Prices
    settings.spotPriceBaseRates.night1 = parseFloat(document.getElementById('spotPriceNight1').value);
    settings.spotPriceBaseRates.morningPeak = parseFloat(document.getElementById('spotPriceMorningPeak').value);
    settings.spotPriceBaseRates.day = parseFloat(document.getElementById('spotPriceDay').value);
    settings.spotPriceBaseRates.night2 = parseFloat(document.getElementById('spotPriceNight2').value);
    settings.spotPriceClamp.min = parseFloat(document.getElementById('spotPriceClampMin').value);
    settings.spotPriceClamp.max = parseFloat(document.getElementById('spotPriceClampMax').value);
    settings.spotPriceImbalanceUpperScale = parseFloat(document.getElementById('spotPriceImbalanceUpperScale').value);
    settings.spotPriceImbalanceLowerScale = parseFloat(document.getElementById('spotPriceImbalanceLowerScale').value);
  
    // Battery Parameters
    settings.batteryInitialSoC = parseFloat(document.getElementById('batteryInitialSoC').value);
    settings.batteryMaxSoC = parseFloat(document.getElementById('batteryMaxSoC').value);
    settings.batteryMinSoC = parseFloat(document.getElementById('batteryMinSoC').value);
    settings.batteryCostPerMWh = parseFloat(document.getElementById('batteryCostPerMWh').value);
    settings.batteryIncomePerMWh = parseFloat(document.getElementById('batteryIncomePerMWh').value);
    settings.batterySoCChangePerDischargeMWh = parseFloat(document.getElementById('batterySoCChangePerDischargeMWh').value);
    settings.batterySoCChangePerChargeMWh = parseFloat(document.getElementById('batterySoCChangePerChargeMWh').value);
  
    // Validations
    if (!validateSettings()) {
      return;
    }
  
    // After saving, update any derived settings or game parameters
    updateDerivedSettings();
  
    // Close the settings panel
    closeSettingsPanel();
  
    // Save settings to local storage
    saveSettingsToLocalStorage();
  
    // Log the save action
    logToConsole("Settings saved");
  }
  
  /**
   * Reset settings to default values
   */
  function resetSettings() {
    // Reset settings object to default values
    settings = getDefaultSettings();
  
    // Load settings into the panel
    loadSettingsToPanel();
  
    // Save default settings to local storage
    saveSettingsToLocalStorage();
  
    // Close the settings panel
    closeSettingsPanel();
  
    // Log the reset action
    logToConsole("Settings reset to default");
  }
  
  // Event listener for Save button
  buttons.saveSettings.addEventListener('click', saveSettings);
  
  // Event listener for Reset button
  buttons.resetSettings.addEventListener('click', resetSettings);
  
  /**
   * Function to update derived settings or game parameters based on new settings
   */
  function updateDerivedSettings() {
    // Recalculate compressedMinutesPerSecond
    settings.compressedMinutesPerSecond = 1440 / settings.gameDurationSeconds;
    document.getElementById('compressedMinutesPerSecond').value = settings.compressedMinutesPerSecond.toFixed(1);
  
    // Update game loop interval if needed
    if (gameActive) {
      clearInterval(mainLoop);
      startMainLoop();
    }
  
    // Additional derived settings can be updated here
  }
  
  /*****************************************************
   * LOCAL STORAGE FUNCTIONALITY
   *****************************************************/
  
  /**
   * Save settings to local storage
   */
  function saveSettingsToLocalStorage() {
    localStorage.setItem('gameSettings', JSON.stringify(settings));
  }
  
  /**
   * Load settings from local storage
   */
  function loadSettingsFromLocalStorage() {
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      settings = JSON.parse(savedSettings);
    } else {
      settings = getDefaultSettings();
    }
  }
  
  /**
   * Get default settings
   * @returns {object} Default settings object
   */
  function getDefaultSettings() {
    return {
      // =============== GAME TIME SETTINGS =================
      gameDurationSeconds: 180,
      compressedMinutesPerSecond: 1440 / 180,
  
      // =============== ENVIRONMENT PARAMETERS =================
      temperatureAmplitude: 10,
      temperatureMidpoint: 5,
      windBaselineAmplitude: 3,
      windBaselineMidpoint: 5,
      windSpeedMax: 10,
      windSpeedMin: 0,
      pvGenerationMaxGW: 5,
      windGenerationMaxGW: 10,
      baselineGenerationGW: 40,
  
      // =============== DEMAND PARAMETERS =================
      demandBaseGW: 50,
      demandPeakMultiplierMorning: 1.2,
      demandPeakMultiplierEvening: 1.3,
      demandTemperatureFactor: 1,
  
      // =============== FREQUENCY PARAMETERS =================
      frequencyBase: 50.0,
      frequencyChangeScaling: 0.005,
      frequencyClamp: { min: 49.0, max: 51.0 },
      frequencyNoiseRange: 0.02,
  
      // =============== FCR-N PARAMETERS =================
      fcrNSoCMin: 40,
      fcrNSoCMax: 60,
      fcrNFrequencyRange: { min: 49.5, max: 50.5 },
      fcrNRevenuePerMW: 10,
      fcrNSoCChangePerMW: 0.3,
  
      // =============== FCR-D PARAMETERS =================
      fcrDActivationThreshold: { up: 49.9, down: 50.1 },
      fcrDRampTimePartial: 5,
      fcrDRampTimeFull: 30,
      fcrDFrequencyImpactPartial: 0.03,
      fcrDFrequencyImpactFull: 0.06,
      fcrDSoCImpactPartial: -1,
      fcrDSoCImpactFull: -2,
      fcrDRevenuePerSecPartial: 5,
      fcrDRevenuePerSecFull: 10,
  
      // =============== FFR PARAMETERS =================
      ffrActivationThreshold: 49.7,
      ffrActivationDuration: 1.0,
      ffrSupportDuration: 1.0,
      ffrDeactivationTime: 1.0,
      ffrBufferTime: 10.0,
      ffrRecoveryTime: 900,
  
      // =============== MARKET PRICES =================
      spotPriceBaseRates: {
        night1: 0.0555,
        morningPeak: 0.011,
        day: 0.2,
        night2: 0.0084
      },
      spotPriceClamp: { min: 0.005, max: 0.5 },
      spotPriceImbalanceUpperScale: 0.05,
      spotPriceImbalanceLowerScale: 0.02,
  
      // =============== BATTERY PARAMETERS =================
      batteryInitialSoC: 50,
      batteryMaxSoC: 100,
      batteryMinSoC: 0,
      batteryCostPerMWh: 1,
      batteryIncomePerMWh: 0.5,
      batterySoCChangePerDischargeMWh: 5,
      batterySoCChangePerChargeMWh: 5,
  
      // =============== UI PARAMETERS =================
      uiUpdateIntervalMs: 1000
    };
  }
  
  /*****************************************************
   * ENVIRONMENT CALCULATIONS
   *****************************************************/
  
  /**
   * Calculate temperature based on time of day.
   * @param {number} tMinutes - Current time in minutes (0..1440).
   * @returns {number} Temperature in °C.
   */
  function getTemperature(tMinutes) {
    const TWO_PI = 2 * Math.PI;
    const fractionOfDay = tMinutes / 1440; // 0..1
  
    const temp = settings.temperatureMidpoint + settings.temperatureAmplitude * Math.sin(TWO_PI * fractionOfDay - (TWO_PI * 0.2083 + Math.PI / 2));
    
    return temp; // -5..15°C
  }
  
  /**
   * Update sun condition once per hour.
   * @param {number} tMinutes - Current time in minutes (0..1440).
   */
  function maybeUpdateSunCondition(tMinutes) {
    const hour = Math.floor(tMinutes / 60);
    if (hour !== lastHourChecked) {
      lastHourChecked = hour;
  
      if (hour < 6 || hour >= 19) {
        // Nighttime
        currentSunCondition = "Dark";
      } else {
        // Daytime: Randomly select sun condition
        const possibleConditions = ["Sunny", "Partly Cloudy", "Cloudy"];
        const index = Math.floor(Math.random() * possibleConditions.length);
        currentSunCondition = possibleConditions[index];
      }
  
      logToConsole(`Sun condition updated to: ${currentSunCondition}`);
    }
  }
  
  /**
   * Calculate base wind speed based on time of day.
   * @param {number} tMinutes - Current time in minutes (0..1440).
   * @returns {number} Base wind speed in m/s.
   */
  function getBaseWind(tMinutes) {
    const TWO_PI = 2 * Math.PI;
    const fractionOfDay = tMinutes / 1440; // 0..1
  
    const baseWind = settings.windBaselineMidpoint + settings.windBaselineAmplitude * Math.sin(TWO_PI * fractionOfDay);
    
    return baseWind; // Varies smoothly over the day
  }
  
  /**
   * Update wind speed with a smooth random walk.
   * @param {number} tMinutes - Current time in minutes (0..1440).
   */
  function updateWind(tMinutes) {
    const baseWind = getBaseWind(tMinutes);
    
    // Random step: ±0.5 m/s
    const delta = (Math.random() - 0.5) * 1.0;
    
    // Smooth adjustment towards base wind
    currentWind += 0.3 * (baseWind - currentWind) + delta;
    
    // Clamp wind speed to defined limits
    currentWind = Math.max(settings.windSpeedMin, Math.min(settings.windSpeedMax, currentWind));
    
    logToConsole(`Wind speed updated to: ${currentWind.toFixed(1)} m/s`);
  }
  
  /**
   * Calculate power demand based on time of day and temperature.
   * @param {number} tMinutes - Current time in minutes (0..1440).
   * @returns {number} Power demand in GW.
   */
  function calculateDemand(tMinutes) {
    const hour = Math.floor(tMinutes / 60);
    let peakFactor = 1;
  
    if (hour >= 6 && hour < 9) { // Morning peak
      peakFactor = settings.demandPeakMultiplierMorning;
    } else if (hour >= 17 && hour < 20) { // Evening peak
      peakFactor = settings.demandPeakMultiplierEvening;
    }
  
    // Demand increases by demandTemperatureFactor per °C below 0°C
    const tempFactor = (currentTemperature < 0) ? Math.abs(currentTemperature) * settings.demandTemperatureFactor : 0;
    
    const demand = settings.demandBaseGW * peakFactor + tempFactor;
    
    logToConsole(`Demand calculated: ${demand.toFixed(1)} GW (Peak Factor: ${peakFactor}, Temp Factor: ${tempFactor})`);
    
    return demand;
  }
  
  /**
   * Update the environment: temperature, sun, wind, demand, and generation.
   * @param {number} tMinutes - Current time in minutes (0..1440).
   */
  function updateEnvironment(tMinutes) {
    // Update temperature
    currentTemperature = getTemperature(tMinutes);
    
    // Update sun condition
    maybeUpdateSunCondition(tMinutes);
    
    // Update wind speed
    updateWind(tMinutes);
    
    // Calculate demand
    currentDemand = calculateDemand(tMinutes);
    
    // Calculate power generation
    windGenerationGW = Math.min(currentWind, settings.windGenerationMaxGW); // 0-10 GW
    pvGenerationGW = (currentSunCondition === "Sunny" ? 1 :
                     currentSunCondition === "Partly Cloudy" ? 0.6 :
                     currentSunCondition === "Cloudy" ? 0.3 : 0) * settings.pvGenerationMaxGW; // 0-5 GW
    currentGeneration = windGenerationGW + pvGenerationGW + settings.baselineGenerationGW; // Total generation
  
    // Update UI elements
    elements.windGeneration.textContent = `${windGenerationGW.toFixed(1)} GW`;
    elements.pvGeneration.textContent = `${pvGenerationGW.toFixed(1)} GW`;
    elements.baselineGeneration.textContent = `${settings.baselineGenerationGW.toFixed(1)} GW`;
    elements.demand.textContent = `${currentDemand.toFixed(1)} GW`;
    elements.generation.textContent = `${currentGeneration.toFixed(1)} GW`;
    
    // Update additional UI elements
    elements.timeOfDay.textContent = formatTime(timeOfDayMinutes);
    elements.temperature.textContent = `${currentTemperature.toFixed(1)}°C`;
    elements.wind.textContent = `${currentWind.toFixed(1)} m/s`;
    elements.sun.textContent = currentSunCondition;
    
    logToConsole(`Environment updated: Time=${formatTime(tMinutes)}, Temp=${currentTemperature}°C, Wind=${currentWind} m/s, Sun=${currentSunCondition}`);
  }
  
  /*****************************************************
   * MARKET PRICE CALCULATIONS
   *****************************************************/
  
  /**
   * Determine base spot price based on time of day.
   * @param {number} tMinutes - Current time in minutes (0..1440).
   * @returns {number} Base spot price in EUR/kWh.
   */
  function getBaseSpotPrice(tMinutes) {
    if (tMinutes < 360) { // 00:00-06:00
      return settings.spotPriceBaseRates.night1;
    } else if (tMinutes < 540) { // 06:00-09:00
      return settings.spotPriceBaseRates.morningPeak;
    } else if (tMinutes < 1260) { // 09:00-21:00
      return settings.spotPriceBaseRates.day;
    } else { // 21:00-24:00
      return settings.spotPriceBaseRates.night2;
    }
  }
  
  /**
   * Update market prices based on net imbalance.
   * @param {number} tMinutes - Current time in minutes (0..1440).
   */
  function updatePrices(tMinutes) {
    const baseSpotPrice = getBaseSpotPrice(tMinutes);
    const netImbalance = currentGeneration - currentDemand; // GW
  
    let spotPrice = baseSpotPrice;
  
    if (netImbalance < 0) { // Shortage
      spotPrice += settings.spotPriceImbalanceUpperScale * Math.abs(netImbalance) / 50;
    } else { // Surplus
      spotPrice -= settings.spotPriceImbalanceLowerScale * netImbalance / 50;
    }
  
    // Clamp spot price
    spotPrice = Math.max(settings.spotPriceClamp.min, Math.min(settings.spotPriceClamp.max, spotPrice));
  
    // Calculate wholesale price
    const wholesalePrice = spotPrice * 0.5;
  
    // Update global prices
    currentSpotPrice = spotPrice;
    currentWholesalePrice = wholesalePrice;
  
    // Update UI elements
    elements.spotPrice.textContent = `€${spotPrice.toFixed(3)}/kWh`;
    elements.wholesalePrice.textContent = `€${wholesalePrice.toFixed(3)}/kWh`;
  
    logToConsole(`Prices updated: Spot Price=${spotPrice.toFixed(3)} EUR/kWh, Wholesale Price=${wholesalePrice.toFixed(3)} EUR/kWh`);
  }
  
  /*****************************************************
   * FREQUENCY MANAGEMENT
   *****************************************************/
  
  /**
   * Update grid frequency based on net imbalance.
   */
  function updateFrequency() {
    const netImbalance = currentGeneration - currentDemand; // GW
    
    // Calculate frequency change
    let freqChange = settings.frequencyChangeScaling * netImbalance; // Hz
  
    // Clamp frequency change to prevent extreme jumps
    freqChange = Math.max(-0.3, Math.min(0.3, freqChange));
  
    // Update frequency
    frequency += freqChange;
  
    // Add random noise
    frequency += (Math.random() - 0.5) * settings.frequencyNoiseRange;
  
    // **Remove clamping to allow frequency to go out of bounds**
  
    // Update UI
    const arrowPos = ((frequency - settings.frequencyClamp.min) / (settings.frequencyClamp.max - settings.frequencyClamp.min)) * 100;
    elements.frequencyArrow.style.left = `${arrowPos}%`;
    elements.frequencyValue.textContent = `${frequency.toFixed(2)} Hz`;
  
    logToConsole(`Frequency updated: ${frequency.toFixed(2)} Hz (Change: ${freqChange.toFixed(3)} Hz)`);
  }
  
  /*****************************************************
   * FREQUENCY CONTROL MECHANISMS
   *****************************************************/
  
  /**
   * Update FCR-N.
   */
  function updateFCRN() {
    if (!fcrNToggled) return;
  
    // Check if conditions to disable FCR-N are met
    if (
      soc < settings.fcrNSoCMin || soc > settings.fcrNSoCMax ||
      frequency < settings.fcrNFrequencyRange.min || frequency > settings.fcrNFrequencyRange.max ||
      fcrDUpActive || fcrDDownActive
    ) {
      if (fcrNToggled) {
        fcrNWasForcedOff = true;
        toggleFcrN(false);
        logToConsole("FCR-N disabled due to SoC/frequency out of range or FCR-D active");
      }
      return;
    }
  
    // Calculate power command based on frequency deviation
    const freqDeviation = frequency - settings.frequencyBase; // Hz
    let powerCommandMW = freqDeviation / 0.2; // ±1 MW at ±0.2 Hz
    powerCommandMW = Math.max(-1, Math.min(1, powerCommandMW));
  
    // Update State of Charge
    soc = Math.max(0, Math.min(100, soc + powerCommandMW * settings.fcrNSoCChangePerMW));
  
    // Update frequency to simulate FCR-N response
    frequency -= powerCommandMW * 0.02; // Frequency feedback
  
    // Update revenue
    revenue += Math.abs(powerCommandMW) * settings.fcrNRevenuePerMW;
  
    // Update cycle count based on power dispatched
    cycleCount += Math.abs(powerCommandMW) * 0.1; // Example: 0.1 cycles per MW
  
    // Logging
    logToConsole(`FCR-N active: Power Command=${powerCommandMW.toFixed(2)} MW, SoC=${soc.toFixed(1)}%, Frequency=${frequency.toFixed(2)} Hz, Cycle Count=${cycleCount.toFixed(1)}`);
  }
  
  /*****************************************************
   * FCR-D LOGIC
   *****************************************************/
  function updateFCRDUp(deltaTime) {
    if (!fcrDUpActive) {
      fcrDUpState = FCRD_UP_STATE.INACTIVE;
      return;
    }
  
    if (frequency >= settings.fcrDActivationThreshold.up) {
      if (fcrDUpState !== FCRD_UP_STATE.INACTIVE) {
        logToConsole("FCR-D Up deactivated (frequency back to normal)");
      }
      fcrDUpState = FCRD_UP_STATE.INACTIVE;
      fcrDUpTimer = 0;
      return;
    }
  
    // Increment timer
    fcrDUpTimer += deltaTime;
  
    // Determine activation state
    if (fcrDUpTimer >= settings.fcrDRampTimeFull) {
      if (fcrDUpState !== FCRD_UP_STATE.FULL) {
        fcrDUpState = FCRD_UP_STATE.FULL;
        logToConsole("FCR-D Up fully activated");
      }
    } else if (fcrDUpTimer >= settings.fcrDRampTimePartial) {
      if (fcrDUpState !== FCRD_UP_STATE.PARTIAL) {
        fcrDUpState = FCRD_UP_STATE.PARTIAL;
        logToConsole("FCR-D Up partially activated");
      }
    } else {
      if (fcrDUpState === FCRD_UP_STATE.INACTIVE) {
        fcrDUpState = FCRD_UP_STATE.PARTIAL;
        logToConsole("FCR-D Up ramping up");
      }
    }
  
    // Apply impacts based on activation state
    let freqImpact = 0;
    let socImpact = 0;
    let revImpact = 0;
    let cycleImpact = 0; // New variable for cycle impact
    if (fcrDUpState === FCRD_UP_STATE.PARTIAL) {
      freqImpact = settings.fcrDFrequencyImpactPartial * deltaTime;
      socImpact = settings.fcrDSoCImpactPartial * deltaTime;
      revImpact = settings.fcrDRevenuePerSecPartial * deltaTime;
      cycleImpact = 0.05 * deltaTime; // Example: 0.05 cycles per second at partial activation
    } else if (fcrDUpState === FCRD_UP_STATE.FULL) {
      freqImpact = settings.fcrDFrequencyImpactFull * deltaTime;
      socImpact = settings.fcrDSoCImpactFull * deltaTime;
      revImpact = settings.fcrDRevenuePerSecFull * deltaTime;
      cycleImpact = 0.1 * deltaTime; // Example: 0.1 cycles per second at full activation
    }
  
    // Update frequency and SoC
    frequency += freqImpact;
    soc = Math.max(0, Math.min(100, soc + socImpact));
    
    // Update revenue
    revenue += revImpact;
    
    // Update cycle count
    cycleCount += cycleImpact;
  
    logToConsole(`FCR-D Up: State=${fcrDUpState}, Frequency Change=${freqImpact.toFixed(3)} Hz, SoC Change=${socImpact.toFixed(1)}%, Revenue Change=€${revImpact.toFixed(2)}, Cycle Count Change=${cycleImpact.toFixed(2)}`);
  }
  
  function updateFCRDDown(deltaTime) {
    if (!fcrDDownActive) {
      fcrDDownState = FCRD_DOWN_STATE.INACTIVE;
      return;
    }
  
    if (frequency <= settings.fcrDActivationThreshold.down) {
      if (fcrDDownState !== FCRD_DOWN_STATE.INACTIVE) {
        logToConsole("FCR-D Down deactivated (frequency back to normal)");
      }
      fcrDDownState = FCRD_DOWN_STATE.INACTIVE;
      fcrDDownTimer = 0;
      return;
    }
  
    // Increment timer
    fcrDDownTimer += deltaTime;
  
    // Determine activation state
    if (fcrDDownTimer >= settings.fcrDRampTimeFull) {
      if (fcrDDownState !== FCRD_DOWN_STATE.FULL) {
        fcrDDownState = FCRD_DOWN_STATE.FULL;
        logToConsole("FCR-D Down fully activated");
      }
    } else if (fcrDDownTimer >= settings.fcrDRampTimePartial) {
      if (fcrDDownState !== FCRD_DOWN_STATE.PARTIAL) {
        fcrDDownState = FCRD_DOWN_STATE.PARTIAL;
        logToConsole("FCR-D Down partially activated");
      }
    } else {
      if (fcrDDownState === FCRD_DOWN_STATE.INACTIVE) {
        fcrDDownState = FCRD_DOWN_STATE.PARTIAL;
        logToConsole("FCR-D Down ramping up");
      }
    }
  
    // Apply impacts based on activation state
    let freqImpact = 0;
    let socImpact = 0;
    let revImpact = 0;
    let cycleImpact = 0; // New variable for cycle impact
    if (fcrDDownState === FCRD_DOWN_STATE.PARTIAL) {
      freqImpact = settings.fcrDFrequencyImpactPartial * deltaTime;
      socImpact = settings.fcrDSoCImpactPartial * deltaTime;
      revImpact = settings.fcrDRevenuePerSecPartial * deltaTime;
      cycleImpact = 0.05 * deltaTime; // Example: 0.05 cycles per second at partial activation
    } else if (fcrDDownState === FCRD_DOWN_STATE.FULL) {
      freqImpact = settings.fcrDFrequencyImpactFull * deltaTime;
      socImpact = settings.fcrDSoCImpactFull * deltaTime;
      revImpact = settings.fcrDRevenuePerSecFull * deltaTime;
      cycleImpact = 0.1 * deltaTime; // Example: 0.1 cycles per second at full activation
    }
  
    // Update frequency and SoC
    frequency += freqImpact;
    soc = Math.max(0, Math.min(100, soc + socImpact));
    
    // Update revenue
    revenue += revImpact;
    
    // Update cycle count
    cycleCount += cycleImpact;
  
    logToConsole(`FCR-D Down: State=${fcrDDownState}, Frequency Change=${freqImpact.toFixed(3)} Hz, SoC Change=${socImpact.toFixed(1)}%, Revenue Change=€${revImpact.toFixed(2)}, Cycle Count Change=${cycleImpact.toFixed(2)}`);
  }
  
  /*****************************************************
   * FFR LOGIC
   *****************************************************/
  function updateFFR(deltaTimeSec) {
    // Check if FFR can be activated
    isFfrProfileWindow = checkFfrProfileWindow();
    isFfrFlexOrdered = checkFfrFlexOrdered();
  
    if (!isBatteryAvailable) {
      ffrState = "idle";
      return;
    }
  
    const ffrAvailable = isFfrProfileWindow || isFfrFlexOrdered;
  
    if (frequency < settings.ffrActivationThreshold && ffrState === "idle" && ffrAvailable) {
      ffrState = "activated";
      ffrActive = true;
      ffrActivationTime = 0;
      logToConsole(`FFR activated at frequency ${frequency.toFixed(2)} Hz`);
    }
  
    switch(ffrState) {
      case "activated":
        ffrActivationTime += deltaTimeSec;
        if (ffrActivationTime >= settings.ffrActivationDuration + settings.ffrSupportDuration) {
          ffrState = "deactivating";
          ffrActivationTime = 0;
          logToConsole("FFR deactivating");
        }
        break;
      case "deactivating":
        ffrActivationTime += deltaTimeSec;
        if (ffrActivationTime >= settings.ffrDeactivationTime) {
          ffrState = "buffer";
          ffrActivationTime = 0;
          logToConsole("FFR buffer period started");
        }
        break;
      case "buffer":
        ffrActivationTime += deltaTimeSec;
        if (ffrActivationTime >= settings.ffrBufferTime) {
          ffrState = "recovering";
          ffrActivationTime = 0;
          logToConsole("FFR recovering");
        }
        break;
      case "recovering":
        ffrActivationTime += deltaTimeSec;
        if (ffrActivationTime >= settings.ffrRecoveryTime) {
          ffrState = "idle";
          ffrActive = false;
          logToConsole("FFR fully recovered and idle");
        }
        break;
      default:
        // "idle"
        break;
    }
  
    // Handle FFR Actions During Activation
    if (ffrState === "activated") {
      // Define how much energy FFR dispatches per second
      const ffrDischargeMW = 1; // Example: 1 MW per second
  
      // Calculate energy discharged (MW * hours)
      const energyDischarged = ffrDischargeMW * (deltaTimeSec / 3600); // Convert seconds to hours
      ffrEnergyDischarged += energyDischarged;
  
      // Update State of Charge (SoC)
      soc = Math.max(0, soc - (ffrDischargeMW * 0.1 * (deltaTimeSec / 3600))); // Assuming 0.1% SoC per MW per hour
  
      // Update Revenue (Assuming revenue per MWh)
      const revenueEarned = ffrDischargeMW * 0.1 * (deltaTimeSec / 3600); // Example: 0.1 EUR per MWh
      ffrRevenue += revenueEarned;
      revenue += revenueEarned;
  
      // Update Cycle Count
      cycleCount += 0.05 * deltaTimeSec; // Example: 0.05 cycles per second of FFR activation
  
      // Log FFR Activity
      logToConsole(`FFR active: Discharged ${ffrDischargeMW} MW, Energy Discharged=${energyDischarged.toFixed(3)} MWh, SoC=${soc.toFixed(1)}%, Revenue Earned=€${revenueEarned.toFixed(4)}, Total FFR Revenue=€${ffrRevenue.toFixed(2)}, Total FFR Energy Discharged=${ffrEnergyDischarged.toFixed(3)} MWh`);
  
      // Update FFR Indicator (Optional)
      if (elements.ffrIndicator) {
        elements.ffrIndicator.classList.remove('inactive');
        elements.ffrIndicator.classList.add('active');
        elements.ffrIndicator.textContent = "FFR: Active";
      }
    } else {
      // Update FFR Indicator to Inactive
      if (elements.ffrIndicator) {
        elements.ffrIndicator.classList.remove('active');
        elements.ffrIndicator.classList.add('inactive');
        elements.ffrIndicator.textContent = "FFR: Inactive";
      }
    }
  }
  
  /**
   * Check if current time is within FFR profile window.
   * @returns {boolean} True if within profile window, else false.
   */
  function checkFfrProfileWindow() {
    // Example condition: night time (22:00-07:00)
    const hour = Math.floor(timeOfDayMinutes / 60);
    const night = (hour >= 22 || hour < 7);
    return night;
  }
  
  /**
   * Check if FFR is flex-ordered by TSO.
   * @returns {boolean} True if flex-ordered, else false.
   */
  function checkFfrFlexOrdered() {
    // Placeholder: Implement actual logic or schedule
    return false;
  }
  
  /*****************************************************
   * MAIN GAME LOOP
   *****************************************************/
  let mainLoop = null;
  let gameActive = false; // Indicates whether the game is active
  
  function startMainLoop() {
    clearInterval(mainLoop);
    mainLoop = setInterval(() => {
      if (!gameActive) return;
  
      // 1) Advance compressed "day" time
      timeOfDayMinutes += settings.compressedMinutesPerSecond;
      if (timeOfDayMinutes >= 1440) {
        timeOfDayMinutes -= 1440; // Wrap to next day
      }
  
      // 2) Update environment
      updateEnvironment(timeOfDayMinutes);
  
      // 3) Update frequency based on net imbalance
      updateFrequency();
  
      // 4) Update FCR-N
      updateFCRN();
  
      // 5) Update FCR-D Up and Down
      updateFCRDUp(1); // deltaTime = 1 second
      updateFCRDDown(1); // deltaTime = 1 second
  
      // 6) Update FFR
      updateFFR(1);
  
      // 7) Update market prices
      updatePrices(timeOfDayMinutes);
  
      // 8) Update UI
      updateUI();
  
      // 9) Check for game over conditions
      checkGameOver();
  
      // 10) Decrement remaining time
      timeRemaining--;
      if (timeRemaining <= 0) {
        gameActive = false;
        timeRemaining = 0;
        checkGameOver();
        clearInterval(mainLoop);
      }
  
    }, settings.uiUpdateIntervalMs);
  }
  
  /*****************************************************
   * UI AND GAME OVER LOGIC
   *****************************************************/
  
  /**
   * Update all UI elements.
   */
  function updateUI() {
    // Frequency is updated within updateFrequency()
  
    // Update battery SoC display
    elements.batterySoc.style.height = `${soc}%`;
    elements.batterySoc.style.backgroundColor = (soc > 90 || soc < 10) ? 'red' : 'blue';
    elements.batteryLabel.textContent = `${soc.toFixed(1)}% State of Charge`;
  
    // Update revenue and cycle count
    elements.revenue.textContent = `EUR Earned: €${revenue.toFixed(2)}`;
    elements.cycleCount.textContent = `Battery Cycles: ${cycleCount.toFixed(1)}`;
  
    // Update FFR metrics
    if (elements.ffrEnergyDischarged) {
      elements.ffrEnergyDischarged.textContent = `${ffrEnergyDischarged.toFixed(3)} MWh`;
    }
    if (elements.ffrRevenue) {
      elements.ffrRevenue.textContent = `€${ffrRevenue.toFixed(2)}`;
    }
  
    // Update time remaining
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = String(timeRemaining % 60).padStart(2, '0');
    elements.timer.textContent = `TIME LEFT: ${minutes}:${seconds}`;
  
    // Log UI update
    logToConsole(`UI Updated: SoC=${soc}%, Revenue=€${revenue}, Cycles=${cycleCount}, Time Left=${minutes}:${seconds}`);
  }
  
  /**
   * Check if game over conditions are met.
   */
  function checkGameOver() {
    const frequencyOutOfBounds = (frequency < settings.frequencyClamp.min || frequency > settings.frequencyClamp.max);
    const socOutOfBounds = (soc < settings.batteryMinSoC || soc > settings.batteryMaxSoC);
    const excessiveCycles = (cycleCount > 30);
  
    if (frequencyOutOfBounds || socOutOfBounds || excessiveCycles) {
      gameActive = false;
      elements.lossMessage.textContent = "You failed! Game over!";
      logToConsole("Game Over: You failed!");
      clearInterval(mainLoop);
      return;
    }
  
    if (timeRemaining <= 0) {
      gameActive = false;
      if (revenue >= 50) {
        elements.lossMessage.textContent = "You did it! Congratulations!";
        logToConsole("Game Over: You did it!");
      } else {
        elements.lossMessage.textContent = "You failed! Game over!";
        logToConsole("Game Over: You failed!");
      }
      clearInterval(mainLoop);
      return;
    }
  
    // Optionally, add other win conditions
  }
  
  /*****************************************************
   * TOGGLE AND BUTTON EVENT HANDLERS
   *****************************************************/
  
  /**
   * Handle FCR-N toggle.
   */
  toggles.fcrNToggle.onchange = () => {
    if (toggles.fcrNToggle.checked) {
      toggleFcrN(true);
    } else {
      toggleFcrN(false);
    }
  };
  
  function toggleFcrN(state) {
    fcrNToggled = state;
    if (fcrNToggled) {
      logToConsole("FCR-N activated");
    } else {
      logToConsole("FCR-N deactivated");
    }
  }
  
  /**
   * Handle FCR-D Up toggle.
   */
  toggles.fcrDUpToggle.onchange = () => {
    if (toggles.fcrDUpToggle.checked) {
      activateFcrDUp(true);
    } else {
      activateFcrDUp(false);
    }
  };
  
  function activateFcrDUp(state) {
    fcrDUpActive = state;
    if (fcrDUpActive) {
      logToConsole("FCR-D Up activated");
      // Force FCR-N off if active
      if (fcrNToggled) {
        toggleFcrN(false);
        fcrNWasForcedOff = true;
        logToConsole("FCR-N forced off due to FCR-D Up activation");
      }
    } else {
      logToConsole("FCR-D Up deactivated");
      // Re-enable FCR-N if it was forced off and conditions are met
      if (fcrNWasForcedOff && soc >= settings.fcrNSoCMin && soc <= settings.fcrNSoCMax && frequency >= settings.fcrNFrequencyRange.min && frequency <= settings.fcrNFrequencyRange.max) {
        toggleFcrN(true);
        fcrNWasForcedOff = false;
        logToConsole("FCR-N reactivated after FCR-D Up deactivation");
      }
    }
  }
  
  /**
   * Handle FCR-D Down toggle.
   */
  toggles.fcrDDownToggle.onchange = () => {
    if (toggles.fcrDDownToggle.checked) {
      activateFcrDDown(true);
    } else {
      activateFcrDDown(false);
    }
  };
  
  function activateFcrDDown(state) {
    fcrDDownActive = state;
    if (fcrDDownActive) {
      logToConsole("FCR-D Down activated");
      // Force FCR-N off if active
      if (fcrNToggled) {
        toggleFcrN(false);
        fcrNWasForcedOff = true;
        logToConsole("FCR-N forced off due to FCR-D Down activation");
      }
    } else {
      logToConsole("FCR-D Down deactivated");
      // Re-enable FCR-N if it was forced off and conditions are met
      if (fcrNWasForcedOff && soc >= settings.fcrNSoCMin && soc <= settings.fcrNSoCMax && frequency >= settings.fcrNFrequencyRange.min && frequency <= settings.fcrNFrequencyRange.max) {
        toggleFcrN(true);
        fcrNWasForcedOff = false;
        logToConsole("FCR-N reactivated after FCR-D Down deactivation");
      }
    }
  }
  
  /**
   * Handle FFR toggle.
   */
  toggles.ffrToggle.onchange = () => {
    if (toggles.ffrToggle.checked) {
      ffrActive = true;
      logToConsole("FFR activated");
    } else {
      ffrActive = false;
      logToConsole("FFR deactivated");
    }
  }
  
  /**
   * Handle Start Game button.
   */
  buttons.startGame.onclick = () => {
    if (!gameActive) {
      gameActive = true;
      timeRemaining = settings.gameDurationSeconds;
      timeOfDayMinutes = 0;
      soc = settings.batteryInitialSoC;
      cycleCount = 0;
      revenue = 0;
      fcrNToggled = false;
      fcrDUpActive = false;
      fcrDDownActive = false;
      ffrActive = false;
      currentWind = settings.windBaselineMidpoint;
      currentSunCondition = "Dark";
      lastHourChecked = -1;
      currentDemand = settings.demandBaseGW;
      currentGeneration = settings.baselineGenerationGW;
      frequency = settings.frequencyBase;
      ffrEnergyDischarged = 0;
      ffrRevenue = 0;
  
      // Reset UI
      updateUI();
      elements.lossMessage.textContent = "";
  
      // Start the main loop
      startMainLoop();
      logToConsole("Game started");
    }
  };
  
  /**
   * Handle Restart Game button.
   */
  buttons.restartGame.onclick = () => {
    gameActive = false;
    clearInterval(mainLoop);
  
    // Reset all states to initial values
    timeRemaining = settings.gameDurationSeconds;
    timeOfDayMinutes = 0;
    soc = settings.batteryInitialSoC;
    cycleCount = 0;
    revenue = 0;
    fcrNToggled = false;
    fcrDUpActive = false;
    fcrDDownActive = false;
    ffrActive = false;
    currentWind = settings.windBaselineMidpoint;
    currentSunCondition = "Dark";
    lastHourChecked = -1;
    currentDemand = settings.demandBaseGW;
    currentGeneration = settings.baselineGenerationGW;
    frequency = settings.frequencyBase;
    ffrEnergyDischarged = 0;
    ffrRevenue = 0;
  
    // Reset UI
    updateUI();
    elements.lossMessage.textContent = "";
  
    // Start the main loop
    startMainLoop();
    logToConsole("Game restarted & state reset");
  };
  
  /**
   * Handle Battery Charge button.
   */
  buttons.charge.onclick = () => {
    if (soc >= settings.batteryMaxSoC) {
      logToConsole("Battery is already fully charged.");
      return;
    }
  
    // Calculate cost
    const cost = settings.batteryCostPerMWh * 0.05; // 50 kW for 1 second => 0.05 MWh
  
    // Update SoC and revenue
    soc = Math.min(settings.batteryMaxSoC, soc + settings.batterySoCChangePerChargeMWh);
    revenue -= cost;
    cycleCount += 1;
  
    // Impact frequency
    frequency += 0.1; // Small upward frequency impact
  
    // Update UI
    updateUI();
    logToConsole(`Battery charged: Cost €${cost.toFixed(4)}, SoC=${soc.toFixed(1)}%`);
  };
  
  /**
   * Handle Battery Discharge button.
   */
  buttons.discharge.onclick = () => {
    if (soc <= settings.batteryMinSoC) {
      logToConsole("Battery is already fully discharged.");
      return;
    }
  
    // Calculate income
    const income = settings.batteryIncomePerMWh * 0.05; // 50 kW for 1 second => 0.05 MWh
  
    // Update SoC and revenue
    soc = Math.max(settings.batteryMinSoC, soc - settings.batterySoCChangePerDischargeMWh);
    revenue += income;
    cycleCount += 1;
  
    // Impact frequency
    frequency -= 0.1; // Small downward frequency impact
  
    // Update UI
    updateUI();
    logToConsole(`Battery discharged: Earned €${income.toFixed(4)}, SoC=${soc.toFixed(1)}%`);
  };
  
  /*****************************************************
   * SETTINGS PANEL FUNCTIONALITY (CONTINUED)
   *****************************************************/
  
  /**
   * Load settings from local storage on page load
   */
  window.onload = () => {
    loadSettingsFromLocalStorage();
    updateDerivedSettings();
  };
  
  /*****************************************************
   * INITIALIZE UI
   *****************************************************/
  updateUI();
  
  /*****************************************************
   * COMPLETE JAVASCRIPT FILE
   *****************************************************/
  