/**
 * UZMOY — Modern Car Wash & Detailing Platform
 * Core Application Logic & Interactivity
 */

// Global State
const appState = {
  selectedTier: 'tier2', // default: Kompleks Premium (500,000 UZS)
  carType: {
    key: 'sedan',
    label: 'Sedan / Xetchbek',
    multiplier: 1.0
  },
  serviceMode: 'mobile', // 'mobile' (Sayyor) or 'station' (Filial)
  queueMode: 'immediate', // 'immediate' or 'scheduled'
  paymentMethod: 'payme',
  clientData: {
    name: 'Sardor Rahimov',
    phone: '90 123 45 67',
    carModel: 'Chevrolet Gentra',
    plateRegion: '01',
    plateSeries: 'A 777 AA',
    address: "Toshkent sh., Yunusobod tumani, Amir Temur shox ko'chasi 45",
    branch: 'amir_temur',
    lat: 41.3111,
    lng: 69.2797
  },
  activeTicket: null
};

// Packages Definition
const packagesData = {
  tier1: {
    name: 'Standart Ekspress',
    basePrice: 250000,
    currency: 'UZS',
    workers: 2,
    workersTitle: '2 nafar mutaxassis',
    duration: '35-45 daqiqa',
    avatars: ['fa-user-ninja', 'fa-user-gear']
  },
  tier2: {
    name: 'Kompleks Premium',
    basePrice: 500000,
    currency: 'UZS',
    workers: 3,
    workersTitle: '3 nafar tajribali usta',
    duration: '1 soat 15 daqiqa',
    avatars: ['fa-user-ninja', 'fa-user-shield', 'fa-user-gear']
  },
  tier3: {
    name: 'VIP Detailing Yuvish',
    basePrice: 800000,
    currency: 'UZS',
    workers: 4,
    workersTitle: '4 nafar professional usta',
    duration: '2 soat 30 daqiqa',
    avatars: ['fa-user-ninja', 'fa-user-shield', 'fa-user-gear', 'fa-user-tie']
  },
  tier4: {
    name: 'Ultra Pro & Nano-Himoya',
    basePrice: 1300000, // ~100 USD
    usdPrice: 100,
    currency: 'USD',
    workers: 5,
    workersTitle: '5 nafar oliy toifali usta',
    duration: '4-5 soat',
    avatars: ['fa-user-ninja', 'fa-user-shield', 'fa-user-gear', 'fa-user-tie', 'fa-gem']
  },
  tier5: {
    name: 'Prezident Royal 9H',
    basePrice: 3900000, // ~300 USD
    usdPrice: 300,
    currency: 'USD',
    workers: 6,
    workersTitle: '6 nafar sertifikatlangan deteyling masteri',
    duration: '8-12 soat (To\'liq kun)',
    avatars: ['fa-user-ninja', 'fa-user-shield', 'fa-user-gear', 'fa-user-tie', 'fa-gem', 'fa-crown']
  }
};

// Branch Data
const branchesData = {
  amir_temur: {
    name: 'Amir Temur filiali (Yunusobod)',
    address: 'Toshkent sh., Amir Temur shox ko\'chasi 107B',
    currentWaiting: '4 ta mashina',
    waitTime: '~15 min'
  },
  chilonzor: {
    name: 'Chilonzor Detailing Markazi (Qatortol)',
    address: 'Toshkent sh., Chilonzor tumani, Qatortol ko\'chasi 28',
    currentWaiting: '2 ta mashina',
    waitTime: '~10 min'
  },
  sergeli: {
    name: 'Sergeli Yangi Hayot Mega-Moyka',
    address: 'Toshkent sh., Sergeli tumani, Yangi Sergeli yo\'li 14',
    currentWaiting: '5 ta mashina',
    waitTime: '~25 min'
  },
  mirzo_ulugbek: {
    name: 'Mirzo Ulug\'bek (Buyuk Ipak Yo\'li)',
    address: 'Toshkent sh., Mirzo Ulug\'bek shox ko\'chasi 90A',
    currentWaiting: '3 ta mashina',
    waitTime: '~12 min'
  }
};

// Map Reference
let leafletMap = null;
let userMarker = null;

// Initialization on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMap();
  setupEventListeners();
  loadSavedTicket();
  updateOrderCalculations();
  startQueueSimulation();
});

/**
 * Initialize Interactive Map with Leaflet
 */
function initMap() {
  const mapContainer = document.getElementById('interactiveMap');
  if (!mapContainer) return;

  try {
    if (typeof L !== 'undefined') {
      const defaultCoords = [41.3111, 69.2797]; // Tashkent center
      leafletMap = L.map('interactiveMap').setView(defaultCoords, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap UZMOY',
        maxZoom: 19
      }).addTo(leafletMap);

      // Custom pulsing marker
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background:#00e5ff; width:18px; height:18px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 15px #00e5ff;"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      userMarker = L.marker(defaultCoords, { draggable: true, icon: customIcon }).addTo(leafletMap);

      userMarker.on('dragend', (e) => {
        const position = userMarker.getLatLng();
        updateLocationFromCoords(position.lat, position.lng);
      });

      leafletMap.on('click', (e) => {
        userMarker.setLatLng(e.latlng);
        updateLocationFromCoords(e.latlng.lat, e.latlng.lng);
      });
    } else {
      mapContainer.innerHTML = `<div style="padding:40px; text-align:center; color:#94a3b8;">
        <i class="fa-solid fa-map-location-dot" style="font-size:32px; color:#00e5ff; margin-bottom:10px;"></i>
        <p>Xarita yuklanmoqda... Lokatsiya: Toshkent shahar markazi</p>
      </div>`;
    }
  } catch (err) {
    console.warn('Map initialization note:', err);
  }
}

/**
 * Reverse Geocode simulation / Coords update
 */
function updateLocationFromCoords(lat, lng) {
  appState.clientData.lat = lat;
  appState.clientData.lng = lng;
  const coordsLabel = document.getElementById('coordsDisplay');
  if (coordsLabel) {
    coordsLabel.textContent = `Toshkent (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`;
  }
}

/**
 * Detect user location via GPS
 */
function detectUserLocation() {
  const btn = document.getElementById('detectGpsBtn');
  if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Aniqlanmoqda...';

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (leafletMap && userMarker) {
          leafletMap.setView([lat, lng], 15);
          userMarker.setLatLng([lat, lng]);
        }
        updateLocationFromCoords(lat, lng);
        document.getElementById('userAddressInput').value = "Aniqlangan lokatsiyangiz (GPS bo'yicha)";
        if (btn) btn.innerHTML = '<i class="fa-solid fa-check text-green"></i> Aniqlandi';
        setTimeout(() => {
          if (btn) btn.innerHTML = '<i class="fa-solid fa-crosshairs"></i> GPS Aniqlash';
        }, 3000);
      },
      (err) => {
        // Fallback for permissions
        alert("GPS ruxsati berilmadi yoki mavjud emas. Toshkent shahar markazi tanlandi.");
        if (btn) btn.innerHTML = '<i class="fa-solid fa-crosshairs"></i> GPS Aniqlash';
      },
      { timeout: 7000 }
    );
  } else {
    alert("Brauzeringizda geolokatsiya qo'llab-quvvatlanmaydi.");
    if (btn) btn.innerHTML = '<i class="fa-solid fa-crosshairs"></i> GPS Aniqlash';
  }
}

/**
 * Setup Event Listeners for inputs, plates, cards
 */
function setupEventListeners() {
  // License Plate inputs sync
  const regionInput = document.getElementById('plateRegionInput');
  const seriesInput = document.getElementById('plateSeriesInput');

  if (regionInput && seriesInput) {
    regionInput.addEventListener('input', () => {
      regionInput.value = regionInput.value.replace(/[^0-9]/g, '');
      if (regionInput.value.length === 2) {
        seriesInput.focus();
      }
      syncPlateDisplay();
    });

    seriesInput.addEventListener('input', () => {
      seriesInput.value = seriesInput.value.toUpperCase();
      syncPlateDisplay();
    });
  }

  // Phone input auto-formatter
  const phoneInput = document.getElementById('phoneInput');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let val = phoneInput.value.replace(/\D/g, '');
      if (val.length > 9) val = val.substring(0, 9);
      
      // format as 90 123 45 67
      let formatted = '';
      if (val.length > 0) formatted += val.substring(0, 2);
      if (val.length > 2) formatted += ' ' + val.substring(2, 5);
      if (val.length > 5) formatted += ' ' + val.substring(5, 7);
      if (val.length > 7) formatted += ' ' + val.substring(7, 9);

      phoneInput.value = formatted;
    });
  }

  // Credit Card number auto-formatter & bank detector
  const cardInput = document.getElementById('cardNumberInput');
  if (cardInput) {
    cardInput.addEventListener('input', (e) => {
      let raw = cardInput.value.replace(/\D/g, '').substring(0, 16);
      let formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
      cardInput.value = formatted;

      // Detect card type
      const detector = document.getElementById('cardDetector');
      if (detector) {
        if (raw.startsWith('8600')) {
          detector.textContent = 'Uzcard';
          detector.style.color = '#00e5ff';
        } else if (raw.startsWith('9860')) {
          detector.textContent = 'Humo';
          detector.style.color = '#f59e0b';
        } else if (raw.startsWith('4')) {
          detector.textContent = 'Visa';
          detector.style.color = '#38bdf8';
        } else if (raw.startsWith('5')) {
          detector.textContent = 'Mastercard';
          detector.style.color = '#ec4899';
        } else {
          detector.textContent = 'Karta';
          detector.style.color = '#94a3b8';
        }
      }
    });
  }

  // Card Expiry auto-formatter MM/YY
  const expiryInput = document.getElementById('cardExpiryInput');
  if (expiryInput) {
    expiryInput.addEventListener('input', () => {
      let raw = expiryInput.value.replace(/\D/g, '').substring(0, 4);
      if (raw.length > 2) {
        expiryInput.value = raw.substring(0, 2) + '/' + raw.substring(2, 4);
      } else {
        expiryInput.value = raw;
      }
    });
  }

  // Car model input sync
  const carModelInput = document.getElementById('carModelInput');
  if (carModelInput) {
    carModelInput.addEventListener('input', () => {
      updateSummaryDetails();
    });
  }

  // Quick book btn scroll
  const quickBookBtn = document.getElementById('quickBookBtn');
  if (quickBookBtn) {
    quickBookBtn.addEventListener('click', () => {
      document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' });
    });
  }
}

/**
 * Synchronize Plate Number Display
 */
function syncPlateDisplay() {
  const reg = document.getElementById('plateRegionInput')?.value || '01';
  const ser = document.getElementById('plateSeriesInput')?.value || 'A 777 AA';

  // Live Plate on Booking Form
  const previewRegion = document.getElementById('previewRegion');
  const previewSeries = document.getElementById('previewSeries');
  if (previewRegion) previewRegion.textContent = reg || '01';
  if (previewSeries) previewSeries.textContent = ser || 'A 777 AA';

  // Hero Preview Plate
  const heroReg = document.getElementById('heroPlateRegion');
  const heroSer = document.getElementById('heroPlateNumber');
  if (heroReg) heroReg.textContent = reg || '01';
  if (heroSer) heroSer.textContent = ser || 'A 777 AA';

  updateSummaryDetails();
}

/**
 * Package / Tier Selection Handler
 */
function selectPackage(tierKey) {
  if (!packagesData[tierKey]) return;
  appState.selectedTier = tierKey;

  // Highlight selected pricing card
  const cards = document.querySelectorAll('.pricing-card');
  cards.forEach(card => {
    if (card.dataset.package === tierKey) {
      card.classList.add('selected-card');
    } else {
      card.classList.remove('selected-card');
    }
  });

  updateOrderCalculations();

  // Smooth scroll to booking form
  const bookingSec = document.getElementById('booking-section');
  if (bookingSec) {
    bookingSec.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Car Type Selection Handler
 */
function updateCarType(typeKey, typeLabel, multiplier) {
  appState.carType = {
    key: typeKey,
    label: typeLabel,
    multiplier: multiplier
  };

  // Update active state in UI
  const labels = document.querySelectorAll('.car-type-option');
  labels.forEach(lbl => {
    const radio = lbl.querySelector('input');
    if (radio && radio.value === typeKey) {
      lbl.classList.add('active');
    } else {
      lbl.classList.remove('active');
    }
  });

  updateOrderCalculations();
}

/**
 * Service Mode Selection (Mobile vs Station)
 */
function toggleServiceMode(mode) {
  appState.serviceMode = mode;

  const tabMobile = document.getElementById('tabMobileWash');
  const tabStation = document.getElementById('tabStationWash');
  const mobileBox = document.getElementById('mobileLocationBox');
  const stationBox = document.getElementById('stationBranchBox');

  if (mode === 'mobile') {
    tabMobile?.classList.add('active');
    tabStation?.classList.remove('active');
    if (mobileBox) mobileBox.style.display = 'block';
    if (stationBox) stationBox.style.display = 'none';
    if (leafletMap) {
      setTimeout(() => leafletMap.invalidateSize(), 200);
    }
  } else {
    tabMobile?.classList.remove('active');
    tabStation?.classList.add('active');
    if (mobileBox) mobileBox.style.display = 'none';
    if (stationBox) stationBox.style.display = 'block';
  }

  updateSummaryDetails();
}

/**
 * Branch change handler
 */
function handleBranchChange() {
  const branchSelect = document.getElementById('branchSelect');
  const bKey = branchSelect?.value || 'amir_temur';
  appState.clientData.branch = bKey;

  const bData = branchesData[bKey];
  const infoCard = document.getElementById('branchInfoCard');
  if (infoCard && bData) {
    infoCard.innerHTML = `
      <div class="branch-address"><i class="fa-solid fa-location-dot text-cyan"></i> <span>${bData.address}</span></div>
      <div class="branch-queue-now"><i class="fa-solid fa-car-tunnel text-gold"></i> <span>Hozirda bokslarda: <strong>${bData.currentWaiting}</strong> | Kutilish: <strong>${bData.waitTime}</strong></span></div>
    `;
  }

  updateSummaryDetails();
}

/**
 * Queue Mode Selection (Immediate vs Scheduled)
 */
function toggleQueueMode(mode) {
  appState.queueMode = mode;
  const scheduleInputs = document.getElementById('scheduleInputs');

  const cards = document.querySelectorAll('.queue-option-card');
  cards.forEach(card => {
    const radio = card.querySelector('input');
    if (radio && radio.value === mode) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  if (scheduleInputs) {
    scheduleInputs.style.display = (mode === 'scheduled') ? 'block' : 'none';
  }

  updateSummaryDetails();
}

/**
 * Payment Method Selection
 */
function selectPaymentMethod(methodKey) {
  appState.paymentMethod = methodKey;

  const cards = document.querySelectorAll('.pay-method-card');
  cards.forEach(card => {
    const radio = card.querySelector('input');
    if (radio && radio.value === methodKey) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  const cardPanel = document.getElementById('cardDetailsPanel');
  if (cardPanel) {
    cardPanel.style.display = (methodKey === 'cash') ? 'none' : 'block';
  }

  updateSummaryDetails();
}

/**
 * Order Calculation & Summary Updates
 */
function updateOrderCalculations() {
  const pkg = packagesData[appState.selectedTier];
  if (!pkg) return;

  const multiplier = appState.carType.multiplier || 1.0;
  const rawPrice = Math.round(pkg.basePrice * multiplier);

  // Format price
  let displayPrice = '';
  let unit = 'so\'m';

  if (pkg.currency === 'USD') {
    const usdRaw = Math.round(pkg.usdPrice * multiplier);
    displayPrice = `${usdRaw} $ (~${rawPrice.toLocaleString('ru-RU')} so'm)`;
    unit = '';
  } else {
    displayPrice = rawPrice.toLocaleString('ru-RU');
    unit = 'so\'m';
  }

  // Update summary elements
  const summaryTier = document.getElementById('summaryTierName');
  const summaryWorkers = document.getElementById('summaryWorkers');
  const summaryTotalPrice = document.getElementById('summaryTotalPrice');
  const summaryPriceUnit = document.getElementById('summaryPriceUnit');

  if (summaryTier) summaryTier.textContent = `${pkg.name} (${appState.carType.label})`;
  if (summaryWorkers) summaryWorkers.textContent = `${pkg.workers} nafar mutaxassis`;
  if (summaryTotalPrice) summaryTotalPrice.textContent = displayPrice;
  if (summaryPriceUnit) summaryPriceUnit.textContent = unit;

  // Update Hero preview card
  const heroSelectedService = document.getElementById('heroSelectedService');
  const heroWorkerBadge = document.getElementById('heroWorkerBadge');
  const heroWorkerAvatars = document.getElementById('heroWorkerAvatars');

  if (heroSelectedService) heroSelectedService.textContent = pkg.name;
  if (heroWorkerBadge) heroWorkerBadge.textContent = `${pkg.workers} nafar mutaxassis`;

  if (heroWorkerAvatars) {
    heroWorkerAvatars.innerHTML = pkg.avatars.map(icon => `
      <span class="worker-avatar"><i class="fa-solid ${icon}"></i></span>
    `).join('');
  }

  updateSummaryDetails();
}

/**
 * Update textual summary fields
 */
function updateSummaryDetails() {
  const carModel = document.getElementById('carModelInput')?.value || 'Chevrolet Gentra';
  const reg = document.getElementById('plateRegionInput')?.value || '01';
  const ser = document.getElementById('plateSeriesInput')?.value || 'A 777 AA';

  const summaryCarPlate = document.getElementById('summaryCarPlate');
  if (summaryCarPlate) {
    summaryCarPlate.textContent = `${carModel} (${reg} ${ser})`;
  }

  const summaryServiceMode = document.getElementById('summaryServiceMode');
  if (summaryServiceMode) {
    if (appState.serviceMode === 'mobile') {
      summaryServiceMode.textContent = "Sayyor Moyka (Sizning manzilingizga borish)";
    } else {
      const bData = branchesData[appState.clientData.branch] || branchesData.amir_temur;
      summaryServiceMode.textContent = `Filial: ${bData.name}`;
    }
  }

  const summaryPayment = document.getElementById('summaryPaymentMethod');
  if (summaryPayment) {
    const payNames = {
      payme: 'Payme (Karta orqali)',
      click: 'Click Up (Karta orqali)',
      uzum: 'Uzum Bank (0% to\'lov)',
      uzcard: 'Uzcard Milliy kartasi',
      humo: 'Humo Kontaktsiz kartasi',
      visa: 'Visa / Mastercard (Xalqaro)',
      cash: 'Xizmat joyida Naqd / Terminal'
    };
    summaryPayment.textContent = payNames[appState.paymentMethod] || 'Karta orqali';
  }
}

/**
 * Handle Booking Form Submit
 */
function handleBookingSubmit(event) {
  event.preventDefault();

  const pkg = packagesData[appState.selectedTier];
  const clientName = document.getElementById('clientNameInput')?.value || 'Mijoz';
  const phone = document.getElementById('phoneInput')?.value || '90 123 45 67';
  const carModel = document.getElementById('carModelInput')?.value || 'Chevrolet Gentra';
  const reg = document.getElementById('plateRegionInput')?.value || '01';
  const ser = document.getElementById('plateSeriesInput')?.value || 'A 777 AA';
  const fullPlate = `${reg} ${ser}`;

  // Generate unique order ID
  const orderId = 'UZM-' + Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const multiplier = appState.carType.multiplier || 1.0;
  const finalPrice = Math.round(pkg.basePrice * multiplier);
  const priceFormatted = pkg.currency === 'USD' 
    ? `${Math.round(pkg.usdPrice * multiplier)} $ (~${finalPrice.toLocaleString('ru-RU')} so'm)`
    : `${finalPrice.toLocaleString('ru-RU')} so'm`;

  const ticketData = {
    orderId: orderId,
    date: dateStr,
    clientName: clientName,
    phone: `+998 ${phone}`,
    carModel: `${carModel} (${appState.carType.label})`,
    plate: fullPlate,
    tierName: pkg.name,
    workers: `${pkg.workers} nafar mutaxassis`,
    serviceMode: appState.serviceMode === 'mobile' ? 'Sayyor Moyka (Manzilga borish)' : `Filial: ${branchesData[appState.clientData.branch]?.name}`,
    location: appState.serviceMode === 'mobile' ? document.getElementById('userAddressInput')?.value : branchesData[appState.clientData.branch]?.address,
    paymentMethod: appState.paymentMethod.toUpperCase(),
    totalPrice: priceFormatted,
    queueNumber: '#3',
    queueWait: '~20 min'
  };

  appState.activeTicket = ticketData;

  // Save to localStorage
  try {
    localStorage.setItem('uzmoy_active_ticket', JSON.stringify(ticketData));
  } catch (e) {
    console.warn(e);
  }

  // Update Live Queue Monitor & My Ticket Widget
  showActiveTicketInUI(ticketData);

  // Add to in-progress or waiting list dynamically
  addCustomerToLiveQueue(ticketData);

  // Open Receipt Modal
  populateReceiptModal(ticketData);
  openReceiptModal();
}

/**
 * Add customer into live queue UI
 */
function addCustomerToLiveQueue(ticket) {
  const waitingList = document.getElementById('waitingList');
  if (waitingList) {
    const newItem = document.createElement('div');
    newItem.className = 'queue-item waiting';
    newItem.style.borderColor = '#00e5ff';
    newItem.innerHTML = `
      <div class="qi-plate text-cyan">${ticket.plate} (SIZ)</div>
      <div class="qi-details">
        <span class="qi-model">${ticket.carModel} • ${ticket.tierName}</span>
        <span class="qi-wait">Kutilish: ${ticket.queueWait}</span>
      </div>
      <span class="qi-badge" style="background:rgba(0,229,255,0.2); color:#00e5ff;">Navbatingiz ${ticket.orderId}</span>
    `;
    waitingList.prepend(newItem);
  }
}

/**
 * Display user's active ticket in sidebar
 */
function showActiveTicketInUI(ticket) {
  const box = document.getElementById('myTicketBox');
  if (!box) return;

  box.style.display = 'block';
  document.getElementById('ticketNumberDisplay').textContent = '#' + ticket.orderId;
  document.getElementById('ticketPlateDisplay').textContent = ticket.plate;
  document.getElementById('ticketStatusDisplay').textContent = 'Qabul qilindi • Navbatda (#3)';
  document.getElementById('ticketWorkersDisplay').textContent = ticket.workers;
}

/**
 * Populate thermal receipt
 */
function populateReceiptModal(ticket) {
  document.getElementById('receiptCode').textContent = `BUYURTMA: #${ticket.orderId}`;
  document.getElementById('receiptDate').textContent = ticket.date;
  document.getElementById('rClientName').textContent = ticket.clientName;
  document.getElementById('rPhone').textContent = ticket.phone;
  document.getElementById('rPlate').textContent = ticket.plate;
  document.getElementById('rModel').textContent = ticket.carModel;
  document.getElementById('rTier').textContent = ticket.tierName;
  document.getElementById('rWorkers').textContent = ticket.workers;
  document.getElementById('rMode').textContent = ticket.serviceMode;
  document.getElementById('rLocation').textContent = ticket.location;
  document.getElementById('rQueue').textContent = `Navbat ${ticket.queueNumber} • ${ticket.queueWait}`;
  document.getElementById('rPayment').textContent = `${ticket.paymentMethod} orqali`;
  document.getElementById('rTotal').textContent = ticket.totalPrice;
}

/**
 * Open / Close Receipt Modal
 */
function openReceiptModal() {
  const modal = document.getElementById('receiptModal');
  if (modal) modal.classList.add('active');
}

function closeReceiptModal() {
  const modal = document.getElementById('receiptModal');
  if (modal) modal.classList.remove('active');
}

/**
 * Load saved ticket from localStorage
 */
function loadSavedTicket() {
  try {
    const saved = localStorage.getItem('uzmoy_active_ticket');
    if (saved) {
      const ticket = JSON.parse(saved);
      appState.activeTicket = ticket;
      showActiveTicketInUI(ticket);
    }
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Real-time queue simulation ticker
 */
function startQueueSimulation() {
  let progressVal = 75;
  setInterval(() => {
    progressVal += 5;
    if (progressVal > 100) progressVal = 30;

    const bar = document.querySelector('.qi-progress .progress-bar');
    if (bar) {
      bar.style.width = progressVal + '%';
    }
  }, 4000);
}

// Register Service Worker for Android PWA / Offline support with auto-update
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js?v=2.2')
      .then((reg) => {
        console.log('[UZMOY] Service Worker muvaffaqiyatli ro\'yxatga olindi:', reg.scope);
        // Yangi versiyani tekshirish
        reg.update();
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showToast("UZMOY yangilandi! Eng so'nggi versiya faollashdi 🚀", "success");
              }
            };
          }
        };
      })
      .catch((err) => console.warn('Service Worker registration skipped:', err));
  });
}

// Global keshni tozalash va majburiy yangilash yordamchisi
window.forceRefreshApp = function() {
  if ('caches' in window) {
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => caches.delete(name)));
    }).then(() => {
      window.location.reload(true);
    });
  } else {
    window.location.reload(true);
  }
};

/* ===================================================================
   THEME SWITCHER MANAGEMENT (TUNGI VA KUNDUZGI REJIM)
   =================================================================== */
function initTheme() {
  const savedTheme = localStorage.getItem('uzmoy_theme') || 'dark';
  applyTheme(savedTheme, false);
}

function setTheme(theme, showNotification = true) {
  applyTheme(theme, showNotification);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
  applyTheme(newTheme, true);
}

function applyTheme(theme, showNotification = true) {
  const activeTheme = (theme === 'light') ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', activeTheme);
  localStorage.setItem('uzmoy_theme', activeTheme);

  // Segmented Switcher tugmalarini faollashtirish (Desktop va Mobil)
  const lightBtns = document.querySelectorAll('.theme-light-btn');
  const darkBtns = document.querySelectorAll('.theme-dark-btn');
  const themeIcon = document.getElementById('themeIcon');
  const themeText = document.getElementById('themeText');

  if (activeTheme === 'light') {
    lightBtns.forEach((btn) => btn.classList.add('active'));
    darkBtns.forEach((btn) => btn.classList.remove('active'));

    // Fallback yakka tugma uchun
    if (themeIcon) {
      themeIcon.className = 'fa-solid fa-sun';
      themeIcon.style.color = '#f59e0b';
    }
    if (themeText) themeText.textContent = 'Kunduzgi rejim';

    // Mobil brauzer status bari rangi
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) metaThemeColor.setAttribute('content', '#ffffff');

    if (showNotification) showToast("Kunduzgi rejim yoqildi ☀️", "info");
  } else {
    lightBtns.forEach((btn) => btn.classList.remove('active'));
    darkBtns.forEach((btn) => btn.classList.add('active'));

    // Fallback yakka tugma uchun
    if (themeIcon) {
      themeIcon.className = 'fa-solid fa-moon';
      themeIcon.style.color = '#00e5ff';
    }
    if (themeText) themeText.textContent = 'Tungi rejim';

    // Mobil brauzer status bari rangi
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) metaThemeColor.setAttribute('content', '#07090e');

    if (showNotification) showToast("Tungi rejim yoqildi 🌙", "info");
  }
}

/* ===================================================================
   MOBILE NAVIGATION DRAWER
   =================================================================== */
function toggleMobileMenu() {
  const drawer = document.getElementById('mobileNavDrawer');
  const icon = document.getElementById('mobileMenuIcon');
  if (!drawer) return;

  drawer.classList.toggle('open');
  if (icon) {
    if (drawer.classList.contains('open')) {
      icon.className = 'fa-solid fa-xmark';
    } else {
      icon.className = 'fa-solid fa-bars';
    }
  }
}

function closeMobileMenu() {
  const drawer = document.getElementById('mobileNavDrawer');
  const icon = document.getElementById('mobileMenuIcon');
  if (drawer) drawer.classList.remove('open');
  if (icon) icon.className = 'fa-solid fa-bars';
}

/* ===================================================================
   NEWS ARTICLES DATA & LOGIC (YANGILIKLAR BO'LIMI)
   =================================================================== */
const newsArticlesData = {
  1: {
    id: 1,
    title: "UZMOY 9H Nano-Keramika: Bo'yoqni quyosh va tirnalishlardan 3 yilgacha himoyalash",
    category: "tech",
    badgeLabel: "Yangi Texnologiya",
    badgeClass: "tag-tech",
    icon: "fa-shield-virus",
    date: "13-Oktyabr, 2026",
    readTime: "3 daqiqa",
    author: "Akmal Karimov (Bosh deteyler)",
    likes: 89,
    content: `
      <p>O'zbekistonning issiq iqlimi avtomobil bo'yoq qatlami (LKP) uchun jiddiy sinovdir: yozgi 45°C gacha bo'lgan jazirama, kuchli quyosh nurlari va qishda yo'llarga sepiladigan xlorid tuzlari lokni 1-2 yil ichida xiralashtirib qo'yadi.</p>
      
      <h4>9H Nano-Keramika o'zi nima va u qanday ishlaydi?</h4>
      <p>9H darajasi qalam qattiqligi shkalasi (Mohs) bo'yicha eng yuqori ko'rsatkichdir. Bu suyuq kvars (SiO2) asosidagi eritma bo'lib, avtomobil lokining mikroskopik g'ovaklariga chuqur singib, uning yuzasida qattiq shisha kristalli himoya qatlamini hosil qiladi.</p>
      
      <h4>UZMOY 3 Qatlamli Protsedurasi:</h4>
      <ul>
        <li><strong>1-qavat:</strong> Birlamchi nano-primer va yopishqoqlik bog'lovchisi (Base Coat).</li>
        <li><strong>2-qavat:</strong> 9H qattiqlikdagi kvars kristall qatlami — mayda tirnalishlar va kimyoviy moddalardan qalqon.</li>
        <li><strong>3-qavat:</strong> Ultra-gidrofob 'Top Coat' — suv va kirlar mashina yuzasida turmay, tomchi shaklida oqib tushadi.</li>
      </ul>

      <h4>Mijozlarimiz uchun afzalliklari:</h4>
      <p>Keramika qoplangan avtomobilni yuvish 2 barobar tez va oson bo'ladi, chang yopishmaydi va avtomobil har doim ko'rgazma zalidan endi chiqqandek ko'zni qamashtiruvchi jilo (Mirror Finish) beradi.</p>
    `
  },
  2: {
    id: 2,
    title: "Kuzgi Maxsus Taklif: Kompleks Premiumga 20% keshbek va salon ozonatsiyasi BEPUL!",
    category: "promos",
    badgeLabel: "Aksiya & Chegirma",
    badgeClass: "tag-promo",
    icon: "fa-gift",
    date: "11-Oktyabr, 2026",
    readTime: "2 daqiqa",
    author: "UZMOY Marketing",
    likes: 144,
    content: `
      <p>Avtomobilingizni yangi mavsumga tayyorlash vaqti keldi! UZMOY jamoasi barcha haydovchilar uchun ajoyib kuzgi aksiyani e'lon qiladi.</p>

      <h4>Aksiya shartlari:</h4>
      <ul>
        <li>Istalgan filialimizda yoki Sayyor moykada <strong>Kompleks Premium (500 000 so'm)</strong> yoki undan yuqori tarifga buyurtma bering.</li>
        <li>Har bir buyurtmadan <strong>20% keshbek</strong> darhol to'lov kartangizga yoki hisobingizga qaytariladi!</li>
        <li>Salonni virus, bakteriya va yoqimsiz hidlardan tozalovchi professional <strong>Ozonatsiya xizmati (qiymati 150 000 so'm) BEPUL</strong> sovg'a qilinadi!</li>
      </ul>

      <h4>Salon Ozonatsiyasi nima beradi?</h4>
      <p>Ozon (O3) gazi avtomobil konditsioneri va havo o'tkazgichlarining eng chuqur burchaklarigacha kirib boradi. U mog'or, sigaret hidi, hayvonlar juni va respirator viruslarni 99.9% gacha yo'q qiladi. Ayniqsa yosh bolali oilalar uchun juda foydali!</p>
    `
  },
  3: {
    id: 3,
    title: "Toshkent bo'ylab 10 ta yangi sayyor moyka ekipajlari ishga tushirildi",
    category: "tech",
    badgeLabel: "Platforma Yangiligi",
    badgeClass: "tag-platform",
    icon: "fa-van-shuttle",
    date: "08-Oktyabr, 2026",
    readTime: "4 daqiqa",
    author: "Logistika & Servis",
    likes: 72,
    content: `
      <p>Toshkent shahridagi tirbandliklar vaqtida moykaga borish, navbat kutish va qaytish uchun kamida 2-3 soat vaqt sarflanadi. UZMOY platformasi bu muammoni to'liq hal qilmoqda!</p>

      <h4>Yangi Sayyor Ekipajlar Imkoniyatlari:</h4>
      <ul>
        <li><strong>Germaniya Karcher HD texnologiyasi:</strong> Suv bosimi bo'yoqqa ziyon yetkazmasdan barcha kirlarni oson yuvadi.</li>
        <li><strong>Avtonom toza suv va elektr:</strong> Furgonda 500 litr filtrlangan yumshoq suv va zamonaviy shovqinsiz generator mavjud.</li>
        <li><strong>Tezkor yetib borish:</strong> Chilonzor, Yunusobod, Mirzo Ulug'bek, Yakkasaroy, Yashnobod va Sergeli hududlariga o'rtacha 15-25 daqiqa ichida yetib kelamiz.</li>
        <li><strong>Har bir ekipajda 2-3 nafar tajribali usta:</strong> Mashinangiz 40 daqiqa ichida oynadek top-toza holatga keltiriladi.</li>
      </ul>

      <p>Siz uyda yoki ofisda o'tirib qahva ichasiz, biz esa mashinangizni ko'z oldingizda yuvib beramiz!</p>
    `
  },
  4: {
    id: 4,
    title: "Elektromobillar (BYD, Zeekr, Li Auto) parvarishi bo'yicha maxsus deteyling sirlari",
    category: "tips",
    badgeLabel: "Avto-Maslahat",
    badgeClass: "tag-tips",
    icon: "fa-charging-station",
    date: "05-Oktyabr, 2026",
    readTime: "5 daqiqa",
    author: "EV Detailing Laboratoriyasi",
    likes: 125,
    content: `
      <p>So'nggi yillarda O'zbekiston ko'chalarida BYD, Zeekr, Li Auto, Avatr va boshqa elektromobillar soni keskin ortdi. Oddiy benzinli avtomobillardan farqli o'laroq, elektrokar va gibridlarni yuvishda o'ziga xos ehtiyotkorlik talab etiladi.</p>

      <h4>Elektromobil egalari nimalarni bilishi shart?</h4>
      <ul>
        <li><strong>Zaryadlash portlari (GB/T yoki CCS2):</strong> Yuqori bosimli suv oqimini hech qachon to'g'ridan-to'g'ri zaryad lyuki tomon yo'naltirish mumkin emas. UZMOY ustalari portlarni maxsus rezina himoya qoplamalari bilan himoyalaydi.</li>
        <li><strong>Kameralar va Lidar sensorlari:</strong> 360° ko'rinish beruvchi optik sensorlar qattiq cho'tka bilan artilsa, mikro-tirnalish paydo bo'lib, avtopilot xato ishlay boshlaydi. Biz faqat ultra-yumshoq mikrofibra sochiqlardan foydalanamiz.</li>
        <li><strong>Dvigatel bo'limi (Kaput osti):</strong> Yuqori voltli to'q sariq (Orange) kabellar va invertorlar mavjud bo'lgani sababli oddiy suv bilan yuvish taqiqlanadi. UZMOY faqat xavfsiz dielektrik quruq bug' va antistatik tozalagichlardan foydalanadi.</li>
      </ul>
    `
  }
};

function filterNews(category, btnElement) {
  const buttons = document.querySelectorAll('.news-tab-btn');
  buttons.forEach(b => b.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  const cards = document.querySelectorAll('.news-card');
  cards.forEach(card => {
    if (category === 'all' || card.dataset.category === category) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

function openNewsModal(articleId) {
  const article = newsArticlesData[articleId];
  if (!article) return;

  const contentContainer = document.getElementById('newsModalContent');
  if (contentContainer) {
    contentContainer.innerHTML = `
      <div class="news-modal-header-visual" style="background: linear-gradient(135deg, #091e3a 0%, #173b6c 100%);">
        <i class="fa-solid ${article.icon}" style="font-size: 70px; color: #00e5ff;"></i>
      </div>
      <span class="news-badge-tag ${article.badgeClass}">${article.badgeLabel}</span>
      <h2 class="news-modal-title">${article.title}</h2>
      <div class="news-modal-meta">
        <span><i class="fa-solid fa-calendar"></i> ${article.date}</span>
        <span><i class="fa-solid fa-clock"></i> ${article.readTime}</span>
        <span><i class="fa-solid fa-user-pen"></i> ${article.author}</span>
      </div>
      <div class="news-modal-content">
        ${article.content}
      </div>
      <div class="news-reaction-bar">
        <button class="reaction-btn" id="newsLikeBtn" onclick="likeArticle(${article.id})">
          <i class="fa-solid fa-heart"></i> Yoqdi (<span id="likesCountDisplay">${article.likes}</span>)
        </button>
        <button class="reaction-btn" onclick="copyArticleLink()">
          <i class="fa-solid fa-share-nodes"></i> Ulashish
        </button>
        <button class="btn btn-sm btn-primary" onclick="closeNewsModal(); document.getElementById('booking-section').scrollIntoView({behavior: 'smooth'})" style="margin-left: auto;">
          <i class="fa-solid fa-bolt"></i> Shu xizmatga yozilish
        </button>
      </div>
    `;
  }

  const modal = document.getElementById('newsModal');
  if (modal) modal.classList.add('active');
}

function closeNewsModal() {
  const modal = document.getElementById('newsModal');
  if (modal) modal.classList.remove('active');
}

function likeArticle(id) {
  const article = newsArticlesData[id];
  const btn = document.getElementById('newsLikeBtn');
  const counter = document.getElementById('likesCountDisplay');
  if (!article || !btn) return;

  if (btn.classList.contains('liked')) {
    article.likes--;
    btn.classList.remove('liked');
  } else {
    article.likes++;
    btn.classList.add('liked');
    showToast("Maqola sizga ma'qul keldi! ❤️", "success");
  }
  if (counter) counter.textContent = article.likes;
}

function copyArticleLink() {
  navigator.clipboard?.writeText(window.location.href);
  showToast("Maqola havolasi nusxalandi!", "success");
}

/* ===================================================================
   CUSTOMER REVIEWS LOGIC (MIJOZLAR FIKRLARI)
   =================================================================== */
let currentReviewRating = 5;

function openReviewModal() {
  const modal = document.getElementById('reviewModal');
  if (modal) modal.classList.add('active');
}

function closeReviewModal() {
  const modal = document.getElementById('reviewModal');
  if (modal) modal.classList.remove('active');
}

function setRating(val) {
  currentReviewRating = val;
  const stars = document.querySelectorAll('#starRatingSelect i');
  stars.forEach((star, idx) => {
    if (idx < val) {
      star.classList.add('active');
      star.style.color = '#f59e0b';
    } else {
      star.classList.remove('active');
      star.style.color = '#64748b';
    }
  });
}

function handleReviewSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('revNameInput')?.value || 'Mijoz';
  const car = document.getElementById('revCarInput')?.value || 'Avtomobil';
  const text = document.getElementById('revTextInput')?.value || 'Ajoyib servis!';

  // Initials
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MZ';

  const reviewsGrid = document.getElementById('reviewsGrid');
  if (reviewsGrid) {
    const newCard = document.createElement('div');
    newCard.className = 'review-card';
    newCard.style.borderColor = '#00e5ff';
    newCard.innerHTML = `
      <div class="review-card-top">
        <div class="reviewer-meta">
          <div class="reviewer-avatar" style="background: rgba(0, 229, 255, 0.2);">${initials}</div>
          <div>
            <div class="reviewer-name">${name}</div>
            <div class="reviewer-car">${car}</div>
          </div>
        </div>
        <span class="review-verified"><i class="fa-solid fa-shield-check"></i> Yangi fikr</span>
      </div>
      <div class="review-stars">
        ${'<i class="fa-solid fa-star"></i>'.repeat(currentReviewRating)}
      </div>
      <p class="review-text">"${text}"</p>
      <span class="review-service-badge"><i class="fa-solid fa-circle-check"></i> Tasdiqlangan mijoz</span>
    `;
    reviewsGrid.prepend(newCard);
  }

  closeReviewModal();
  showToast("Fikringiz muvaffaqiyatli qabul qilindi! Rahmat!", "success");

  // Reset fields
  document.getElementById('revNameInput').value = '';
  document.getElementById('revCarInput').value = '';
  document.getElementById('revTextInput').value = '';
}

/* ===================================================================
   FAQ ACCORDION
   =================================================================== */
function toggleFaq(questionElement) {
  const item = questionElement.closest('.faq-item');
  if (!item) return;

  const isActive = item.classList.contains('active');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));

  if (!isActive) {
    item.classList.add('active');
  }
}

/* ===================================================================
   BRANCHES & PLAN COMPARISON MODALS
   =================================================================== */
function openBranchesModal() {
  const modal = document.getElementById('branchesModal');
  if (modal) modal.classList.add('active');
}

function closeBranchesModal() {
  const modal = document.getElementById('branchesModal');
  if (modal) modal.classList.remove('active');
}

function selectStationBranch(branchKey) {
  toggleServiceMode('station');
  const select = document.getElementById('branchSelect');
  if (select) {
    select.value = branchKey;
    handleBranchChange();
  }
  document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' });
  showToast(`Filial tanlandi: ${branchesData[branchKey]?.name || branchKey}`, "success");
}

function openPlanComparisonModal() {
  const modal = document.getElementById('compareModal');
  if (modal) modal.classList.add('active');
}

function closePlanComparisonModal() {
  const modal = document.getElementById('compareModal');
  if (modal) modal.classList.remove('active');
}

function openContactModal() {
  const modal = document.getElementById('contactModal');
  if (modal) modal.classList.add('active');
}

function closeContactModal() {
  const modal = document.getElementById('contactModal');
  if (modal) modal.classList.remove('active');
}

/* ===================================================================
   PRESET ADDRESSES & FOCUS
   =================================================================== */
function setPresetAddress(addressText, lat, lng) {
  const input = document.getElementById('userAddressInput');
  if (input) input.value = addressText;

  updateLocationFromCoords(lat, lng);
  if (leafletMap && userMarker) {
    leafletMap.setView([lat, lng], 15);
    userMarker.setLatLng([lat, lng]);
  }
  showToast(`Manzil tanlandi: ${addressText}`, "info");
}

function focusPlateInput() {
  const booking = document.getElementById('booking-section');
  if (booking) booking.scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => {
    const input = document.getElementById('plateSeriesInput');
    if (input) {
      input.focus();
      input.style.borderColor = '#00e5ff';
      setTimeout(() => input.style.borderColor = '', 1500);
    }
  }, 400);
}

/* ===================================================================
   TOAST NOTIFICATION HELPER
   =================================================================== */
let toastTimeout = null;

function showToast(message, type = 'info') {
  const toast = document.getElementById('uzmoyToast');
  const msgEl = document.getElementById('toastMessage');
  const iconEl = document.getElementById('toastIcon');

  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  if (iconEl) {
    if (type === 'success') {
      iconEl.className = 'fa-solid fa-circle-check text-green';
    } else if (type === 'info') {
      iconEl.className = 'fa-solid fa-circle-info text-cyan';
    } else {
      iconEl.className = 'fa-solid fa-bell text-gold';
    }
  }

  toast.classList.add('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

