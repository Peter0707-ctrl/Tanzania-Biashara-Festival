// Tanzania Biashara Festival (TBF) — Auto-Changing Business Showcase, Cookie Analytics & Bilingual Engine (Monochrome Icons Only)

const TBF_DEBUG = false;
function debugLog(...args) {
  if (TBF_DEBUG && typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn(...args);
  }
}

// ==============================================================================
// AJIRA MARKET-STYLE MODERN FLOATING TOAST NOTIFICATION ENGINE
// ==============================================================================
function showToast(message, type = 'info', title = null, durationMs = 4500) {
  if (!message) return;
  let container = document.getElementById('tbf-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'tbf-toast-container';
    container.className = 'fixed top-5 right-5 z-[999999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'pointer-events-auto transform transition-all duration-300 translate-y-[-16px] opacity-0 shadow-2xl rounded-2xl border backdrop-blur-md p-4 flex flex-col gap-2 relative overflow-hidden';

  const typeConfig = {
    success: {
      bg: 'bg-emerald-950/95 text-emerald-100 border-emerald-500/50',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      barBg: 'bg-emerald-400',
      defaultTitle: appState && appState.lang === 'sw' ? 'Imefanikiwa' : (appState && appState.lang === 'zh' ? '成功' : 'Success'),
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>'
    },
    error: {
      bg: 'bg-rose-950/95 text-rose-100 border-rose-500/50',
      iconBg: 'bg-rose-500/20 text-rose-400',
      barBg: 'bg-rose-400',
      defaultTitle: appState && appState.lang === 'sw' ? 'Hitilafu' : (appState && appState.lang === 'zh' ? '错误' : 'Notice'),
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>'
    },
    warning: {
      bg: 'bg-amber-950/95 text-amber-100 border-amber-500/50',
      iconBg: 'bg-amber-500/20 text-amber-400',
      barBg: 'bg-amber-400',
      defaultTitle: appState && appState.lang === 'sw' ? 'Tahadhari' : (appState && appState.lang === 'zh' ? '提示' : 'Attention'),
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>'
    },
    info: {
      bg: 'bg-slate-900/95 text-slate-100 border-slate-700/70',
      iconBg: 'bg-teal-500/20 text-teal-300',
      barBg: 'bg-teal-400',
      defaultTitle: appState && appState.lang === 'sw' ? 'Taarifa' : (appState && appState.lang === 'zh' ? '信息' : 'Information'),
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    }
  };

  const cfg = typeConfig[type] || typeConfig.info;
  const toastTitle = title || cfg.defaultTitle;

  toast.className += ` ${cfg.bg}`;
  toast.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="shrink-0 rounded-xl p-1.5 ${cfg.iconBg}">
        ${cfg.icon}
      </div>
      <div class="flex-1 min-w-0 pt-0.5">
        <div class="font-bold text-xs uppercase tracking-wider opacity-90">${toastTitle}</div>
        <div class="text-sm font-medium leading-snug mt-0.5 text-white/95 break-words">${message}</div>
      </div>
      <button type="button" class="shrink-0 p-1 text-white/60 hover:text-white transition rounded-lg" aria-label="Close">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
    <div class="absolute bottom-0 left-0 h-1 ${cfg.barBg} transition-all" style="width: 100%; transition: width ${durationMs}ms linear;"></div>
  `;

  const closeBtn = toast.querySelector('button');
  const removeToast = () => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-[-16px]', 'opacity-0');
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
  };

  if (closeBtn) closeBtn.addEventListener('click', removeToast);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-[-16px]', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    const bar = toast.querySelector('.absolute.bottom-0');
    if (bar) requestAnimationFrame(() => { bar.style.width = '0%'; });
  });

  const timer = setTimeout(removeToast, durationMs);
  toast.addEventListener('mouseenter', () => clearTimeout(timer));
}

window.showToast = showToast;
// Automatically intercept any legacy alert call and display an Ajira Market toast instead
window.alert = function(msg) {
  showToast(String(msg || ''), 'warning');
};

function sanitizeMediaSrc(src) {
  const s = String(src || '').trim();
  if (/^\/images\/[a-zA-Z0-9_.\-/]+$/.test(s)) return s;
  if (/^https:\/\/[^\s"'<>]+$/.test(s)) return s;
  return '/images/biz1.jpg';
}

function sanitizeTelHref(phone) {
  const cleaned = String(phone || '+255767053250').replace(/[^+\d]/g, '');
  return cleaned || '+255767053250';
}

let holdCountdownInterval = null;

const TANZANIA_ALL_REGIONS = [
  'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera',
  'Kaskazini Pemba', 'Kaskazini Unguja', 'Katavi', 'Kigoma', 'Kilimanjaro',
  'Kusini Pemba', 'Kusini Unguja', 'Lindi', 'Manyara', 'Mara', 'Mbeya',
  'Mjini Magharibi (Zanzibar)', 'Morogoro', 'Mtwara', 'Mwanza', 'Njombe',
  'Pwani', 'Rukwa', 'Ruvuma', 'Shinyanga', 'Simiyu', 'Singida',
  'Songwe', 'Tabora', 'Tanga'
];

let appState = {
  lang: 'en',
  activeSectorFilter: 'ALL',
  activeUpdateFilter: 'ALL',
  activeRegionId: 'mwanza',
  activeMapView: 'venue',
  destination: {
    regionId: 'mwanza',
    regionName: 'Mwanza',
    zone: 'Kanda ya Ziwa (Lake Zone Commercial Hub)',
    venue: 'Rock City / Furahisha Exhibition Grounds',
    venueLocation: 'Barabara ya Nyerere, Ilemela, Mwanza',
    eventDates: 'Tarehe 15 - 20 Julai 2026',
    notes: 'Viwanja rasmi vya wazi vya maonyesho na minada ya wazi, karibu na Rock City Mall.',
    pinX: 260,
    pinY: 210
  },
  selectedBookingCities: ['Mwanza'],
  selectedPackageId: 'standard-booth',
  selectedBoothCode: '',
  bookingStep: 1,
  selectedSponsorRegions: [...TANZANIA_ALL_REGIONS],
  sponsorRegionSearch: '',
  registeredExhibitor: null,
  activeHolds: [],
  currentHold: null,
  isAdminAuthenticated: false,
  adminUser: null,
  adminOverview: null,
  activeLookupContext: null,
  heroSlideIndex: 0,
  cardImageTick: 0,
  regions: [],
  boothPackages: [],
  bookings: [],
  sponsors: [],
  announcements: [],
  liveStats: {
    totalCookieVisitors: 71997,
    totalRegisteredAttendees: 6997,
    totalBusinessesShowcased: 499,
    totalPartnersAndInvestors: 150
  }
};

const HERO_BUSINESS_SLIDES = [
  {
    img: '/images/sabasaba_event.jpg',
    badgeSw: 'JUKWAA KUU LA BIASHARA, UBUNIFU & UWEKEZAJI',
    badgeEn: "TANZANIA'S PREMIER PLATFORM FOR BUSINESS & INVESTMENT",
    badgeZh: '坦桑尼亚商业、创新与投资综合平台',
    titleSw: 'KARIBU TANZANIA BIASHARA FESTIVAL',
    titleEn: 'WELCOME TO TANZANIA BIASHARA FESTIVAL',
    titleZh: '欢迎来到坦桑尼亚商业节 (TBF)',
    subSw: 'Ungana nasi katika tamasha kubwa la kibiashara linalozunguka nchi nzima. Kila biashara ina nafasi yake, kila mji una fursa yake!',
    subEn: 'Join us at Tanzania’s roving premier business fair. Every business has a place, every city has an opportunity!',
    subZh: '与我们一同加入遍布坦桑尼亚各省的盛大商贸巡回博览会。每家企业皆有其位，每座城市皆有机遇！',
    animType: 'zoom'
  },
  {
    img: '/images/market_tents_aisle.jpg',
    badgeSw: 'MINADA YA WAZI & BEI NAFUU ZA KIWANDANI',
    badgeEn: 'OPEN AUCTIONS & DIRECT FACTORY PRICES',
    badgeZh: '各省公开拍卖会与厂家直销底价',
    titleSw: 'SHUHUDIA MINADA MIKUBWA YA WAZI MIKOANI',
    titleEn: 'DISCOVER REGIONAL OPEN AUCTIONS & WHOLESALE MARKETS',
    titleZh: '见证各省大型开放式展销与拍卖盛会',
    subSw: 'Fursa ya pekee ya kununua na kuuza bidhaa za viwanda, mazao ya kilimo, teknolojia na vifaa kwa bei ya minada bila madalali!',
    subEn: 'Experience dynamic open-air auctions for agricultural produce, manufactured goods, and equipment without middlemen!',
    subZh: '绝佳商机！直接采购工农业产品、机械设备与先进技术，省去中间商，尊享直销拍卖底价！',
    animType: 'split'
  },
  {
    img: '/images/african_market_stalls.jpg',
    badgeSw: 'HIFADHI BANDA LAKO • ONYESHA & UZA',
    badgeEn: 'BOOK EXHIBITION BOOTH • SHOWCASE & SELL',
    badgeZh: '锁定展位席位 • 现场展出与热销',
    titleSw: 'ONYESHA NA UZA BIDHAA ZAKO KWA MAELFU YA WANANCHI',
    titleEn: 'SHOWCASE & SELL DIRECTLY TO THOUSANDS OF BUYERS',
    titleZh: '向全坦桑尼亚数万采购商与民众展示并销售您的产品',
    subSw: 'Usikose wateja wa mikoani! Kodisha banda lako la kisasa uongeze mauzo, utambulishe nembo yako, na upate mawakala wapya.',
    subEn: 'Don’t miss regional buyers! Rent a modern booth to accelerate sales, promote your brand, and secure new wholesale distributors.',
    subZh: '千万别错过各省庞大购买力！租赁现代化展位提升销量、打响品牌知名度并签约新省级代理商。',
    animType: 'drop'
  },
  {
    img: '/images/expo5.jpg',
    badgeSw: 'MAKONGAMANO YA UWEKEZAJI & ONE-STOP CLINIC',
    badgeEn: 'INVESTMENT FORUMS & ONE-STOP CLINICS',
    badgeZh: '区域投资论坛与一站式现场政企服务',
    titleSw: 'KUTANA NA WAWEKEZAJI, MABENKI NA WAFADHILI',
    titleEn: 'CONNECT WITH INVESTORS, FINANCIERS & REGULATORS',
    titleZh: '对接海内外投资者、金融银行与官方监管机构',
    subSw: 'Jadili mikataba ya kibiashara, jifunze fursa za masoko, na upate huduma za leseni, mikopo na viwango vya TBS/BRELA uwanjani.',
    subEn: 'Negotiate strategic trade deals, unlock enterprise capital, and access regulatory licenses, standards, and bank financing on site.',
    subZh: '深入洽谈经贸大单，对接企业发展资金，并在展会现场直接办理企业执照、质量认证与银行融资。',
    animType: 'rise'
  },
  {
    img: '/images/expo2.jpg',
    badgeSw: 'DAR • MWANZA • ARUSHA • DODOMA • MBEYA • ZANZIBAR',
    badgeEn: 'DAR • MWANZA • ARUSHA • DODOMA • MBEYA • ZANZIBAR',
    badgeZh: '达累斯萨拉姆 • 姆万扎 • 阿鲁沙 • 多多马 • 姆贝亚 • 桑给巴尔',
    titleSw: 'MSAFARA WA BIASHARA UNATEMBELEA MKOA WAKO',
    titleEn: 'THE NATIONWIDE BUSINESS CARAVAN IS COMING TO YOUR CITY',
    titleZh: '全国巡回商业大篷车即将抵达您的城市',
    subSw: 'Mji wako, fursa yako! Jiunge na safari ya kiuchumi inayofungua fursa za masoko katika kila ukanda wa Jamhuri ya Muungano wa Tanzania.',
    subEn: 'Your city, your opportunity! Be part of Tanzania’s roving economic movement unlocking wealth and market access in every region.',
    subZh: '您的城市，您的商机！加入遍及坦桑尼亚联合共和国各大经济带的财富创造之旅。',
    animType: 'blur'
  }
];

const NEWS_CARD_IMAGES = [
  '/images/expo5.jpg',
  '/images/market_tents_aisle.jpg',
  '/images/african_market_stalls.jpg',
  '/images/sabasaba_event.jpg',
  '/images/expo2.jpg',
  '/images/african_crafts_stalls.jpg'
];

const NEWS_GALLERY_PHOTOS = [
  {
    src: '/images/sabasaba_event.jpg',
    cat: 'stalls',
    titleEn: 'Main Fairgrounds Pavilion & Visitor Walkways',
    titleSw: 'Mabanda Makuu ya Maonyesho na Njia za Wateja',
    titleZh: '主展馆广场与参观主通道'
  },
  {
    src: '/images/market_tents_aisle.jpg',
    cat: 'auctions',
    titleEn: 'Regional SME Exhibition Tents & Open Buying',
    titleSw: 'Mahema ya Wajasiriamali na Ununuzi wa Moja kwa Moja',
    titleZh: '各省中小企业展棚与现场采购区'
  },
  {
    src: '/images/african_market_stalls.jpg',
    cat: 'stalls',
    titleEn: 'Agro-Processing, Produce & Direct Factory Goods',
    titleSw: 'Bidhaa za Kilimo-Biashara na Bei za Viwandani',
    titleZh: '农产品加工与工厂直销摊位'
  },
  {
    src: '/images/expo5.jpg',
    cat: 'forums',
    titleEn: 'Investor Forums, B2B Networking & Policy Clinic',
    titleSw: 'Majukwaa ya Uwekezaji, B2B na Huduma za Leseni',
    titleZh: '投融资论坛、企业对接与一站式政务窗口'
  },
  {
    src: '/images/african_crafts_stalls.jpg',
    cat: 'lifestyle',
    titleEn: 'Handicrafts, Creative Makers & Cultural Showcase',
    titleSw: 'Sanaa za Mikono, Ubunifu wa Asili na Maonyesho',
    titleZh: '手工艺品、创意手作与文化展台'
  },
  {
    src: '/images/african_clothes_stalls.jpg',
    cat: 'lifestyle',
    titleEn: 'Tanzanian Fashion, Textiles & Lifestyle Market',
    titleSw: 'Mavazi, Vitenge na Bidhaa za Maisha',
    titleZh: '坦桑尼亚时尚服饰、纺织品与生活市集'
  },
  {
    src: '/images/expo2.jpg',
    cat: 'auctions',
    titleEn: 'High-Footfall Trade Arena & Wholesale Deal Desk',
    titleSw: 'Uwanja wa Mauzo ya Jumla na Minada ya Wazi',
    titleZh: '高人气商贸展区与批发签约专席'
  },
  {
    src: '/images/expo4.jpg',
    cat: 'forums',
    titleEn: 'One-Stop SME Support: BRELA, TBS, TRA & Banking',
    titleSw: 'Kliniki ya Biashara: BRELA, TBS, TRA na Mabenki',
    titleZh: '中小企业服务诊所：税务、标准局与银行专窗'
  }
];

const FESTIVAL_DAILY_TIMETABLE = [
  {
    time: '08:00 - 09:30',
    titleEn: 'Gate Opening, Exhibitor QR Check-in & Pavilion Readiness',
    titleSw: 'Ufunguzi wa Milango, Uhakiki wa QR & Maandalizi ya Mabanda',
    titleZh: '开馆入场、展商扫码核验与展位就位',
    descEn: 'Exhibitors scan verified Booth QR Pass at entry while morning buyers tour all zones.',
    descSw: 'Washiriki wanaskani QR Pass langoni huku wanunuzi wakianza kutembelea mabanda.',
    descZh: '参展商凭已付款二维码凭证核验入场，采购观众进入展区参观对接。'
  },
  {
    time: '09:30 - 12:30',
    titleEn: 'One-Stop Business Clinic (BRELA, TBS, TRA, NSSF & Finance)',
    titleSw: 'Kliniki ya Biashara (BRELA, TBS, TRA, NSSF & Mikopo)',
    titleZh: '一站式企业服务窗口（工商、标准认证、税务与金融授信）',
    descEn: 'Direct on-site business registration, standards certification advice, and SME credit desks.',
    descSw: 'Huduma za papo kwa papo za usajili wa biashara, viwango vya TBS na mikopo nafuu.',
    descZh: '现场集中办理企业注册、质量认证指导及中小企业普惠信贷咨询。'
  },
  {
    time: '12:30 - 15:00',
    titleEn: 'Open Factory Auctions & Regional Distributor Matchmaking',
    titleSw: 'Minada ya Wazi ya Viwandani & Mikutano ya Mawakala',
    titleZh: '工厂直销公开拍卖与省级经销商对接会',
    descEn: 'Bulk buyers and regional distributors lock factory pricing without middlemen.',
    descSw: 'Wanunuzi wa jumla na mawakala wanakutana moja kwa moja na wazalishaji.',
    descZh: '各地批发商与省级代理商直连生产厂家，省去中间环节锁定出厂价格。'
  },
  {
    time: '15:00 - 17:00',
    titleEn: 'Investment Roundtable & Youth SME Innovation Pitch',
    titleSw: 'Jukwaa la Wawekezaji & Mashindano ya Wajasiriamali Vijana',
    titleZh: '区域投融资圆桌会议与青年双创项目路演',
    descEn: 'Startups and growth enterprises pitch live before equity investors and commercial banks.',
    descSw: 'Startups na kampuni zinazokua zinawasilisha miradi mbele ya wawekezaji na mabenki.',
    descZh: '初创与成长型企业登台路演，直面海内外投资机构与商业银行。'
  },
  {
    time: '17:00 - 19:00',
    titleEn: 'Food Court, Cultural Arena & Evening Public Showcase',
    titleSw: 'Uwanja wa Chakula, Utamaduni & Mauzo ya Jioni',
    titleZh: '美食广场、文化展演与傍晚公众热销专场',
    descEn: 'Family-friendly evening market featuring food stands, artisan booths, and live showcases.',
    descSw: 'Soko la jioni kwa familia yote lenye vyakula, vinywaji na maonyesho ya wazi.',
    descZh: '面向家庭与大众的晚间市集，集结美食餐饮、手工艺品及现场推介。'
  }
];

const DEFAULT_BIZ_IMAGES = [
  ['/images/expo2.jpg', '/images/biz1.jpg', '/images/biz5.jpg'],
  ['/images/biz2.jpg', '/images/sabasaba_event.jpg', '/images/market_tents_aisle.jpg'],
  ['/images/biz1.jpg', '/images/african_crafts_stalls.jpg', '/images/biz3.jpg'],
  ['/images/biz4.jpg', '/images/expo5.jpg', '/images/sabasaba_event.jpg'],
  ['/images/biz5.jpg', '/images/expo2.jpg', '/images/african_market_stalls.jpg'],
  ['/images/african_crafts_stalls.jpg', '/images/african_clothes_stalls.jpg', '/images/biz3.jpg']
];

const I18N = {
  sw: {
    // Brand & Header
    topProposalLink: 'Fungua Official Proposal (PDF)',
    brandSubtitle: 'Kila biashara ina nafasi yake, kila mji una fursa yake',
    navHome: 'NYUMBANI',
    navAbout: 'KUHUSU SISI',
    navBooking: 'MABANDA',
    navSponsors: 'WADHAMINI',
    navNews: 'HABARI',
    navSubAllNews: 'HABARI ZOTE (ALL)',
    navSubGallery: 'PICHA (GALLERY)',
    navSubLatestNews: 'HABARI MPYA',
    navSubEventsSchedule: 'MATUKIO & RATIBA',
    navSubAds: 'MATANGAZO YA BIASHARA',
    navSubOfficialNews: 'TAARIFA RASMI',
    navSubSponsors: 'WADHAMINI & WASHIRIKA',
    navContacts: 'MAWASILIANO',
    navLogin: 'INGIA',
    langLabel: 'LUGHA:',
    langBtn: 'LUGHA',

    cardBtnGallery: 'Tazama Picha (Gallery)',
    cardBtnAction: 'Hifadhi Banda →',

    // Hero Buttons
    heroBtnBook: '+ HIFADHI BANDA LAKO SASA',
    heroBtnAbout: 'KUHUSU TAMASHA',
    heroBtnContact: 'WASILIANA NASI',

    // Home 3 Action Cards
    card1Title: 'HIFADHI BANDA LA MAONYESHO',
    card1Desc: 'Hifadhi banda lako la maonyesho uje kuonyesha na kuuza bidhaa zako kwenye mzunguko wa mikoa.',
    card1Btn: 'Hifadhi Sasa →',
    card2Title: 'DIRA NA DHAMIRA YETU',
    card2Desc: 'Kuwa jukwaa kuu Tanzania linalounganisha watu, biashara, na wawekezaji katika kila mkoa.',
    card2Btn: 'Gundua Kuhusu Sisi →',
    card3Title: 'WADHAMINI NA WASHIRIKA',
    card3Desc: 'Shirikiana nasi kama mdhamini mkuu, benki, au taasisi kwenye makongamano ya mikoa.',
    card3Btn: 'Kuwa Mshirika Nasi →',

    // Destination & Map Section
    destSecBadge: 'MZUNGUKO WA MIKOA 2026/2027 • NATIONAL TOUR',
    destSecTitle: 'Eneo Rasmi la Tamasha & Ramani Halisi',
    destSecSub: 'Tazama viwanja vya maonyesho na ramani halisi ya mkoa tunaoenda.',
    destSecBtn: '+ Hifadhi Banda Lako →',
    destBadgeUpcoming: 'Mkoa Tunaoenda',
    destLabelVenue: 'Uwanja / Viwanja',
    destLabelLocation: 'Mahali',
    destLabelDates: 'Tarehe za Tamasha',
    destPhotosHeading: 'Picha za Eneo la Tamasha',
    destPhotosClick: 'Bonyeza kuona',
    destBookBtnPrefix: '+ Hifadhi Banda',
    destGoogleMapsBtn: 'Google Maps ↗',

    // Regional Showcase Section (Carousel / Moving Regions)
    homeUpdatesBadge: 'MAONYESHO YA MIKOA • REGIONAL HUBS',
    homeUpdatesHeading: 'MAONYESHO YA MIKOA YOTE YA TANZANIA',
    homeUpdatesSubtitle: 'Mzunguko wa kibiashara unaotembelea kila mkoa. Gundua fursa za biashara, mabanda ya kisasa na viwanja rasmi vya maonyesho nchini kote.',
    homeUpdatesViewAll: 'Tazama Mzunguko wa Mikoa Yote →',
    newsReadMore: 'Soma Zaidi →',

    // Testimonials
    usersSayBadge: 'MAONI YA WASHIRIKI • WHAT OUR USERS SAY',
    usersSayHeading: 'Maneno ya Wajasiriamali na Washiriki wa Tamasha',
    usersSaySubtitle: 'Gundua jinsi Tanzania Biashara Festival inavyosaidia biashara kufungua masoko mapya, kupata wawekezaji, na kuuza bidhaa moja kwa moja kwa maelfu ya wananchi kila mkoa.',
    testActionTitle: 'Jiunge Na Mamia ya Wajasiriamali Kwenye Tamasha',
    testActionSub: 'Hifadhi banda lako sasa uonyeshe na kuuza bidhaa zako kwa maelfu ya wananchi kila mkoa.',
    testActionBtn: 'Hifadhi Banda la Maonyesho →',

    // Live Stats Banner
    statLabelVisitors: 'Watembeleaji wa Tovuti',
    statLabelAttendees: 'Wahudhuriaji wa Mikoa',
    statLabelInvestors: 'Wadhamini na Wawekezaji',
    statLabelBusinesses: 'Mabanda ya Maonyesho',

    // About Us Page
    aboutBadge: 'KUHUSU SISI • TANZANIA BIASHARA FESTIVAL',
    aboutTitle: 'Jukwaa Kuu la Biashara, Uwekezaji na Utangazaji Tanzania Nzima',
    aboutDesc: 'Tanzania Biashara Festival (TBF) ni tamasha kubwa la kitaifa la kibiashara, uwekezaji, na fursa za kiuchumi linalozunguka Tanzania nzima kulingana na ratiba ya mikoa tunayopanga. Lengo letu ni kuwapa wafanyabiashara jukwaa la kutangaza chapa zao na kuuza moja kwa moja kwa wananchi, huku wawekezaji wakipata miradi na kampuni halisi za kuwekeza ndani ya mikoa husika.',
    aboutMottoTitle: 'Motto Yetu',
    aboutMottoQuote: '"Kila biashara ina nafasi yake, kila mji una fursa yake."',
    aboutMottoSub: 'Kila biashara ina nafasi yake, kila mji nchini Tanzania una fursa yake ya kibiashara na uwekezaji.',
    aboutVisionTitle: 'Dira Yetu (Vision)',
    aboutVisionBody: 'Kuwa jukwaa kuu na bora zaidi nchini Tanzania kwa kukuza biashara, chapa, ubunifu, na fursa za uwekezaji katika kila mkoa.',
    aboutMissionTitle: 'Dhamira Yetu (Mission)',
    aboutMissionBody: 'Kutengeneza jukwaa jumuishi linalounganisha wafanyabiashara, wanunuzi, na wawekezaji kupitia fursa halisi za masoko zinazochochea ukuaji endelevu wa uchumi.',
    aboutHowItWorksBadge: 'INAFANYAJE KAZI KWA KINA • TZ NZIMA',
    aboutHowItWorksTitle: 'Jinsi Tanzania Biashara Festival Inavyofanya Kazi Mikoani',
    aboutHowItWorksDesc: 'Tamasha halijafungwa katika idadi ndogo ya mikoa — linaendeshwa kwa mfumo wa mzunguko wa kitaifa unaoweza kutembelea mkoa wowote Tanzania Bara na Visiwani kadri tunavyopanga ratiba ya soko. Kila mkoa tunaofika huandaliwa uwanja wa kisasa, mfumo wa kidijitali wa kutangaza biashara mapema, na programu za moja kwa moja uwanjani.',
    aboutPillar1Title: '01. Upangaji wa Mkoa & Uwanja',
    aboutPillar1Desc: 'Sekretarieti hupanga mkoa unaofuata, kuweka uwanja wa maonyesho, mabanda ya kisasa, umeme, na usalama kamili.',
    aboutPillar2Title: '02. Utangazaji wa Mapema (Online)',
    aboutPillar2Desc: 'Ukishahifadhi banda, biashara yako inaonekana mbele kwenye tovuti ya TBF kabla hata tamasha halijaanza uwanjani.',
    aboutPillar3Title: '03. Mauzo, Minada & Promosheni',
    aboutPillar3Desc: 'Uwanjani kunafanyika mauzo ya rejareja na jumla, minada ya wazi ya bei nafuu, uzinduzi wa bidhaa, na burudani.',
    aboutPillar4Title: '04. B2B, Wawekezaji & Mawakala',
    aboutPillar4Desc: 'Vikao vya wawekezaji, pitch za miradi mipya, na kuunganishwa na mawakala wa kusambaza bidhaa katika mikoa mingine.',
    aboutBookBtn: 'Hifadhi Banda Sasa →',
    aboutContactBtn: 'Wasiliana Nasi →',
    aboutHeroStat1Val: 'TZ Nzima',
    aboutHeroStat1: 'Mzunguko wa Mikoa Tunayopanga',
    aboutHeroStat2Val: 'B2B & B2C',
    aboutHeroStat2: 'Wanunuzi, Chapa & Wawekezaji',
    aboutHeroStat3Val: 'Mtandaoni & Uwanjani',
    aboutHeroStat3: 'Uwanja wa Kisasa + Digital Hub',
    aboutValuesTitle: 'Misingi Yetu Mikuu & Utambulisho',
    aboutValuesSub: 'Kila kielelezo cha Tanzania Biashara Festival kimejengwa kuhakikisha kila mfanyabiashara anatangazika, anauza, na anafikiwa na wawekezaji.',
    aboutEcosystemBadge: 'INAHUSISHA NANI NA INAFANYA NINI',
    aboutEcosystemTitle: 'Kwa Wafanyabiashara, Wawekezaji & Wananchi Wote',
    aboutEcosystemDesc: 'Iwe unataka kutangaza biashara yako ikue kitaifa au wewe ni mwekezaji unayetafuta fursa zenye tija, hivi ndivyo TBF inavyokufaa.',
    aboutExhibitTag: 'WAFANYABIASHARA WANAOTAKA KUTANGAZA BIASHARA',
    aboutExhibitTitle: 'Tangaza Chapa Yako, Uza Moja kwa Moja & Pata Mawakala',
    aboutExhibitBody: 'Wafanyabiashara wadogo, wa kati, viwanda, na kampuni za huduma wanapata jukwaa lenye mvuto mkubwa wa umati uwanjani na mtandaoni kutangaza bidhaa mpya, kufanya maonyesho ya jukwaani, na kuongeza mauzo kwa kasi.',
    aboutExhibitPt1: 'Matangazo ya chapa uwanjani na kuorodheshwa mbele kwenye tovuti ya TBF',
    aboutExhibitPt2: 'Uzinduzi wa bidhaa mpya (brand activations), minada ya hadhara & mauzo ya jumla',
    aboutExhibitPt3: 'Kupata wasambazaji na mawakala wapya katika kila mkoa tutakaopanga kwenda',
    aboutBuyerTag: 'WAWEKEZAJI (INVESTORS) WANAOHITAJI KUWEKEZA',
    aboutBuyerTitle: 'Wekeza Kwenye Miradi Halisi, Viwanda & Biashara Zinazokua',
    aboutBuyerBody: 'TBF si soko la mauzo tu — ni kituo cha mitaji na ubia. Wawekezaji wa ndani na nje hukutana ana kwa ana na wamiliki wa biashara zinazoonyesha matokeo uwanjani, Startups bunifu, na miradi mikubwa inayohitaji nguvu ya mtaji ili kupanuka.',
    aboutBuyerPt1: 'Investment Forums & Deal Rooms kati ya wawekezaji na wamiliki wa miradi',
    aboutBuyerPt2: 'Business Innovation Pitch kwa startups na wabunifu wanaotafuta ufadhili au ubia',
    aboutBuyerPt3: 'Uchambuzi wa soko halisi na fursa za kipekee za kibiashara katika kila ukanda wa Tanzania',
    aboutCrowdTag: 'WANUNUZI, VIJANA & JAMII KWA UJUMLA',
    aboutCrowdTitle: 'Soko Huria la Bidhaa Bora, Ofa, Mafunzo & Burudani',
    aboutCrowdBody: 'Kwa wakazi wa mkoa unaopokea tamasha, TBF ni fursa ya kupata bidhaa halisi moja kwa moja kutoka kwa wazalishaji kwa bei nafuu, kuhudhuria minada ya wazi, kupata elimu ya ujasiriamali, na kufurahia vyakula na burudani.',
    aboutCrowdPt1: 'Bidhaa halisi za viwandani, kilimo na teknolojia kwa bei ya ofa na minada',
    aboutCrowdPt2: 'Vipindi vya mafunzo ya ujasiriamali, masoko na usimamizi wa fedha uwanjani',
    aboutCrowdPt3: 'Eneo maalum la vyakula, vinywaji (Food Court), utamaduni na burudani ya familia',
    aboutSectorsBadge: 'MAMBO YALIYOMO NDANI YA TAMASHA • WHAT WE COVER',
    aboutSectorsTitle: 'Sekta & Shughuli Mbalimbali Zilizomo Kwenye TBF',
    aboutSectorsDesc: 'Tamasha linakusanya pamoja kila aina ya biashara halali, huduma za kisasa, ubunifu na fursa za kiuchumi ndani ya uwanja mmoja.',
    aboutSec1Title: 'Viwanda, Kilimo-Biashara & Bidhaa za Kila Siku',
    aboutSec1Desc: 'Nafaka, usindikaji wa vyakula, vinywaji, mavazi, vifaa vya ujenzi, vipodozi na bidhaa za majumbani moja kwa moja kutoka kiwandani.',
    aboutSec2Title: 'Teknolojia, Fintech & Nishati Safi',
    aboutSec2Desc: 'Mifumo ya malipo ya kidijitali, programu za biashara, huduma za mtandao, umeme wa jua (solar), na ubunifu wa startups.',
    aboutSec3Title: 'Sanaa, Utalii, Ukarimu & Food Court',
    aboutSec3Desc: 'Bidhaa za ngozi na sanaa za Kitanzania, vifaa vya utalii, migahawa, kahawa, na shughuli za kiutamaduni zinazoleta uhai uwanjani.',
    aboutTrustBadge: 'UDHAMINI & USHIRIKIANO WA KIBIASHARA',
    aboutTrustTitle: 'Kuwa Mdhamini (Sponsor) au Mshirika wa Tanzania Biashara Festival',
    aboutTrustBody: 'Makampuni makubwa, mabenki, mitandao ya simu, bima, na taasisi zinazotaka nguvu ya juu ya utangazaji Tanzania nzima zinaweza kudhamini mzunguko mzima au mkoa mahsusi kwa kupata haki za kipekee uwanjani na mtandaoni.',
    aboutTrustBtn: 'Tazama Vifurushi vya Udhamini →',

    // Booking Page
    bookingBadge: 'USAJILI WA MABANDA & WASHIRIKI',
    bookingTitle: 'Hifadhi Nafasi ya Banda Lako la Maonyesho',
    bookingDesc: 'Chagua banda unalopenda kwanza kwenye ramani kuona bei yake, kisha jaza taarifa za biashara, na umalizie malipo hatua kwa hatua.',
    bookingDiscount: 'Punguzo la 15% Ukichagua Mikoa 2 au Zaidi!',
    bookingTabBook: 'Weka Booking Mpya',
    bookingTabRetrieve: 'Kagua / Badili Booking (PIN)',
    wizStep1: 'Chagua Banda',
    wizStep2: 'Taarifa Zako',
    wizStep3: 'Malipo',
    wizActiveCityLbl: 'Mkoa & Tarehe ya Maonyesho',
    wizScheduledByAdmin: 'Sasa Wazi Kwa Uhifadhi',
    wizPickRegion: '1A. Chagua Mkoa / Mikoa',
    wizPickPackage: '1B. Daraja la Banda',
    wizStep1Prompt: 'Bonyeza banda lolote lililo wazi hapa juu kuchagua na kuona gharama.',
    btnNextStep2: 'Endelea: Jaza Taarifa →',
    btnBackStep1: '← Rudi: Chagua Banda',
    btnNextStep3: 'Endelea: Malipo →',
    btnBackStep2: '← Rudi: Taarifa Zako',
    bookingRetrieveTitle: 'Angalia Booking Yako, Fungua Control Number & Badili Banda',
    bookingRetrieveDesc: 'Weka Kumbukumbu (Booking ID au Control Number) na Namba ya Simu kuona muhtasari, kisha weka PIN ya tarakimu 6 kufungua risiti kamili au kubadili banda.',
    bookingRetrieveRefLbl: 'Booking ID au Control Number *',
    bookingRetrievePhoneLbl: 'Namba ya Simu Iliyosajiliwa *',
    bookingRetrieveBtn: 'Tafuta Booking Yako →',
    bookingStep1Title: 'Chagua Mkoa / Mikoa Unayotaka Kushiriki',
    bookingStep1Note: 'Tarehe rasmi zinatangazwa kupitia Events & News',
    bookingStep2Title: 'Chagua Daraja la Banda (Booth Category)',
    bookingStep3Title: 'Ramani ya Mabanda — Bonyeza Banda Unalopenda',
    legendAvailable: 'Wazi',
    legendSelected: 'Chaguo Lako',
    legendHeld: 'Limeshikwa',
    legendBooked: 'Imechukuliwa',
    bookingHoldHint: 'Banda litashikwa kwa dakika 10 moja kwa moja unapoendelea kujaza taarifa.',
    bookingHoldBtn: 'Shikilia Banda Dakika 10',
    bookingStep2WizardTitle: 'Hatua ya 2: Jaza Taarifa za Biashara Yako',
    bookingStep2WizardDesc: 'Weka taarifa za biashara yako kisha uendelee kwenye malipo.',
    bookingStep3WizardTitle: 'Hatua ya 3: Malipo & Pata Control Number',
    bookingStep3WizardDesc: 'Hakiki chaguo lako, chagua njia ya malipo, na uthibitishe kupokea Control Number na PIN yako ya usalama.',
    bookingStep4Title: 'Taarifa za Biashara & Njia ya Malipo',
    bookingStep4Desc: 'Jaza taarifa zako hapa chini kupata Control Number na PIN ya usalama.',
    lblBizName: 'Jina la Biashara / Kampuni *',
    lblSector: 'Sekta ya Biashara (Sector) *',
    lblTagline: 'Maelezo Mafupi ya Bidhaa / Huduma Zako (Tagline) *',
    lblContactPerson: 'Jina la Mwakilishi (Contact Person) *',
    lblPhone: 'Simu ya Biashara (WhatsApp / Call) *',
    lblEmail: 'Barua Pepe (Email) *',
    lblPayment: 'Njia ya Malipo *',
    sumHeader: 'Muhtasari wa Usajili',
    sumTitle: 'Risiti ya Kidijitali',
    sumOfficialPass: 'KIBALI RASMI CHA TBF',
    sumSelectPrompt: 'Bonyeza banda lolote kwenye ramani kuona daraja la banda na gharama zake.',
    sumUnitPrice: 'Bei ya Banda:',
    sumCityCount: 'Mkoa wa Maonyesho:',
    sumDiscount: 'Punguzo la Mzunguko (15%):',
    sumTotal: 'Jumla ya Kulipia:',
    sumSubmitBtn: 'Thibitisha & Pata Control Number',

    // Sponsors Page
    spTitle: 'Shirikiana Nasi: Partners & Sponsors',
    spDesc: 'Weka chapa ya kampuni au taasisi yako mbele ya maelfu ya wafanyabiashara na wananchi kwenye mzunguko wa mikoa yote ya Tanzania. Wasiliana nasi moja kwa moja kupitia +255 767 053 250.',
    spProposalBtn: 'Fungua & Chapisha Festival Overview (PDF) →',
    spRoleSponsor: 'Sponsor (Mdhamini)',
    spRolePartner: 'Partner (Mshirika)',
    spCurrentTitle: 'Wadhamini & Washirika Wetu Rasmi',
    spCurrentDesc: 'Makampuni na taasisi zinazoshirikiana nasi kufanikisha maonyesho na teknolojia nchini Tanzania. Bofya nembo kutembelea tovuti yao rasmi.',
    spRelianceRole: 'Mshirika Rasmi wa Teknolojia & Mifumo ya Kidijitali',
    spFormTitle: 'Omba Kuwa Mdhamini au Mshirika',
    spFormDesc: 'Weka taarifa za kampuni au taasisi yako hapa chini ili timu yetu iwasiliane nawe.',
    spOrgLabel: 'Jina la Kampuni / Taasisi *',
    spContactLabel: 'Jina la Afisa Mhusika *',
    spPhoneLabel: 'Simu / WhatsApp *',
    spEmailLabel: 'Barua Pepe Rasmi *',
    spTierLabel: 'Aina ya Ushirikiano',
    spRegionLabel: 'Mikoa / Eneo la Ushirikiano',
    spRegionSelectAll: 'Chagua Mikoa Yote (Select All — 31)',
    spRegionDone: 'Tayari',
    spSubmitBtn: 'Tuma Maombi ya Ushirikiano',
    spSuccessHeading: 'Maombi Yamepokelewa!',
    spAnotherBtn: 'Tuma Ombi Jingine',
    spSuccessMsg: 'Asante! Maombi yako yamepokelewa. Timu yetu (+255 767 053 250) itawasiliana nawe.',

    // Events Page
    evBadge: 'Taarifa Mpya • Bila Tarehe za Kudumu',
    evTitle: 'Matukio, Habari na Matangazo ya Biashara',
    evDesc: 'Kwa kuwa tarehe za kila mkoa zinapangwa kulingana na mzunguko, hapa ndipo tunapotangaza na ku-update Tarehe za Matukio (Events), Habari Rasmi (News), na Matangazo ya Biashara (Advertisements) muda wowote.',
    evFilterAll: 'Zote',
    evFilterEvents: 'Matukio Yajayo & Ratiba',
    evFilterGallery: 'Picha (Gallery)',
    evFilterAds: 'Matangazo ya Biashara',
    evFilterNews: 'Habari & Taarifa',
    evUpdatesSubheading: 'Habari Mpya, Matukio & Matangazo ya Biashara',
    evPublishTitle: '+ Chapisha Event Update, News au Tangazo la Biashara',
    evTypeLabel: 'Aina ya Chapisho (Type)',
    evRegionLabel: 'Mkoa Unaohusika (Region)',
    evStatusLabel: 'Update Tarehe/Status ya Mkoa (Hiari)',
    evPublishBtn: 'Chapisha Sasa (Publish Update / Ad)',

    // Contacts Page
    ctBadge: 'MAWASILIANO RASMI • CONTACT US',
    ctTitle: 'Wasiliana na Tanzania Biashara Festival',
    ctDesc: 'Kwa maswali ya kuhifadhi mabanda ya maonyesho, fursa za udhamini (sponsorship), ushirikiano au taarifa za mzunguko wa mikoa, wasiliana nasi moja kwa moja:',
    ctCard1Title: 'Piga Simu / WhatsApp',
    ctCard1Sub: 'Inapatikana kwa maongezi ya simu na ujumbe wa WhatsApp kwa msaada wa haraka wa usajili wa mabanda.',
    ctCard1Btn: 'Chat WhatsApp Sasa →',
    ctCard2Title: 'Barua Pepe Rasmi (Email)',
    ctCard2Sub: 'Tuma barua pepe kwa mawasiliano rasmi ya kibiashara, ushirikiano wa kitaasisi, na maombi ya udhamini.',
    ctCard2Btn: 'Tuma Email Sasa →',
    ctCard3Title: 'Ofisi & Mzunguko',
    ctCard3Value: 'Mikoa Yote ya Tanzania',
    ctCard3Sub: 'Dar es Salaam • Mwanza • Arusha • Dodoma • Mbeya • Zanzibar (Viwanja Maalum vya Maonyesho).',
    ctCard3Hours: 'Saa za Kazi: Jumatatu - Jumamosi (08:00 - 18:00)',
    ctFormBadge: 'FOMU YA MAWASILIANO',
    ctFormTitle: 'Tuma Ujumbe au Swali Lako',
    ctFormDesc: 'Jaza fomu hii fupi na timu yetu itawasiliana nawe ndani ya muda mfupi.',
    ctNameLabel: 'Jina Lako Kamili *',
    ctPhoneLabel: 'Namba ya Simu *',
    ctEmailLabel: 'Barua Pepe (Email)',
    ctTypeLabel: 'Aina ya Swali / Ushiriki *',
    ctMsgLabel: 'Ujumbe Wako *',
    ctSubmitBtn: 'Tuma Ujumbe Sasa →',
    ctSuccessMsg: 'Asante! Ujumbe wako umepokelewa. Tutawasiliana nawe kupitia simu / email uliyoweka.',

    // Login Page
    loginHeading: 'Ingia',
    loginSubheading: 'Ingia kwa barua pepe yako kuona uhifadhi au akaunti yako.',
    exLoginEmailLabel: 'Barua Pepe *',
    exLoginEmailPlaceholder: 'barua@kampuni.co.tz',
    exLoginRefLabel: 'Booking ID / Control #',
    exLoginRefPlaceholder: 'TBF-BIZ-... au 99104...',
    exLoginPinLabel: 'PIN / Nenosiri',
    exLoginPinPlaceholder: '••••••••',
    exLoginBtn: 'Ingia →',
    exRegisterTitle: 'Mshiriki mpya? Hifadhi banda lako leo.',
    exRegisterBtn: 'Jisajili →',

    // Admin Page
    adminBadge: 'Organizer Backoffice & Visitor Analytics Dashboard',
    adminTitle: 'Mfumo wa Usimamizi (Admin & Regional Attendance Statistics)',
    adminBookingsTitle: 'Orodha ya Washiriki Waliohifadhi Mabanda (Booked Exhibition Booths)',
    adminAddNewsBtn: '+ Weka Tangazo / News',
    adminLogoutBtn: 'Ondoka (Logout)',
    adminDestTitle: 'Eneo Tunapoenda & Ramani (Admin Destination Spotlight)',
    adminDestDesc: 'Chagua mkoa, uwanja, mahali, na tarehe zitakazoonekana kwenye ukurasa wa mbele.',
    adminDestSaveBtn: 'Hifadhi Mkoa Tunaoenda & Eneo Kwenye Ramani',
    adminDestSuccess: 'Mkoa na Eneo Vimesasishwa Kikamilifu Kwenye Ramani!',

    // Modals & Cookies
    modalBookingConfirmed: 'Namba ya Malipo Imetolewa • Subiri Malipo',
    modalBookingTitle: 'Risiti ya Banda na Control Number',
    modalBookingSub: 'Tumia Control Number hapa chini kukamilisha malipo yako. Kwa msaada piga +255 767 053 250.',
    modalDownloadBtn: 'Pakua QR Pass & Risiti (PNG)',
    modalPrintBtn: 'Chapisha',
    modalHomeBtn: 'Ona Biashara Yako Kwenye Ukurasa wa Mbele →',
    modalCloseBtn: '✕ Funga',
    receiptBackBookingBtn: 'Rudi Kwenye Mabanda',
    cookieTitle: 'Tunathamini Faragha Yako',
    cookieText: 'Tunatumia cookies kuboresha huduma zetu na kukumbuka wewe ni nani pamoja na mapendeleo yako ya lugha na matumizi ya tovuti. Kwa kubonyeza "Kubali Cookies Zote", unakubali matumizi ya cookies.',
    cookieAcceptBtn: 'Kubali Cookies Zote',
    cookieEssentialBtn: 'Muhimu Pekee',
    cookieManageBtn: 'Mapendeleo',
    footerCookieSettings: 'Mipangilio ya Cookies',
    cookieModalTitle: 'Mipangilio ya Faragha & Cookies',
    cookieModalSubtitle: 'Chagua aina ya cookies unazoruhusu kutumika kwenye kifaa chako.',
    cookieCatEssentialTitle: 'Cookies Muhimu za Mfumo (Essential)',
    cookieAlwaysActiveBadge: 'Daima Wazi',
    cookieCatEssentialDesc: 'Zinahitajika kwa ajili ya usalama wa akaunti, kuzuia kuingiliana kwa mabanda wakati wa usajili (booth lock), na uthibitishaji. Haziwezi kuzimwa.',
    cookieCatPrefTitle: 'Mapendeleo ya Tovuti (Preferences)',
    cookieCatPrefDesc: 'Huruhusu mfumo kukumbuka lugha uliyochagua (Kiswahili/English/Chinese) na mkoa unaotaka kuangalia kwenye ramani ya maonyesho.',
    cookieCatAnalyticsTitle: 'Takwimu za Wageni (Analytics)',
    cookieCatAnalyticsDesc: 'Hutusaidia kurekodi idadi ya wageni wanaotembelea tovuti kiuhalisia na kuboresha utendaji bila kushiriki data yako na makampuni ya matangazo ya nje.',
    cookieSavePreferencesBtn: 'Hifadhi Mapendeleo',
    cookieAcceptAllBtn: 'Kubali Zote',

    // Footer
    footerMotto: '"Kila biashara ina nafasi yake, kila mji una fursa yake."',
    footerDesc: 'Tamasha la kibiashara linalozunguka mikoa yote ya Tanzania, likiwaunganisha wajasiriamali, viwanda na wawekezaji na masoko ya moja kwa moja.',
    footerLinksTitle: 'Viungo vya Haraka',
    footerLinkFeatured: 'Mwanzo & Ziara ya Mikoa',
    footerLinkAbout: 'Kuhusu Sisi (About TBF)',
    footerLinkBooking: 'Sajili Biashara & Banda',
    footerLinkProposal: 'Andiko Rasmi (Proposal PDF)',
    footerProgramsTitle: 'Programu za TBF',
    footerLinkSponsors: 'Wadhamini & Washirika',
    footerLinkEvents: 'Matukio & Ratiba',
    footerLinkAds: 'Matangazo ya Biashara',
    footerLinkNews: 'Habari & Taarifa Rasmi',
    footerContactTitle: 'Mawasiliano Rasmi',
    footerTourText: 'Mzunguko wa Mikoa Yote ya Tanzania',
    footerCopyright: '© Tanzania Biashara Festival (TBF). Haki zote zimehifadhiwa.',
    footerPowered: 'Inaendeshwa na Jukwaa la Kidijitali la TBF',
    // Dropdown & Global
    langBtn: 'Lugha',
    langSwLabel: 'Kiswahili',
    langEnLabel: 'English',
    langZhLabel: '中文 (Chinese)',

    // Booking Select Options
    optSectorAgri: 'Kilimo-Biashara & Chakula (Agribusiness)',
    optSectorMfg: 'Viwanda & Bidhaa (Manufacturing & FMCG)',
    optSectorTech: 'Teknolojia, Ubunifu & Startups',
    optSectorMining: 'Madini, Ujenzi & Nishati',
    optSectorFinance: 'Fedha, Bima & Uwekezaji',
    optSectorTourism: 'Utalii, Vito, Sanaa & Mavazi',
    optSectorFood: 'Huduma za Chakula (Food Court)',

    optPayMobile: 'M-Pesa / Mixx by Yas / Airtel Money',
    optPayBank: 'CRDB / NMB Bank Control Number',
    optPayCard: 'Visa / Mastercard Online',

    // Contact Form Select Options
    ctOptBooth: 'Kuhifadhi Banda (Booth Booking)',
    ctOptSponsor: 'Fursa za Udhamini (Sponsorship)',
    ctOptSchedule: 'Ratiba ya Mkoa (Festival Schedule)',
    ctOptOther: 'Mengineyo (General Inquiry)',

    // Events Form Select Options
    evTypeOptEvent: 'EVENT (Tangazo la Tarehe / Ratiba ya Mkoa)',
    evTypeOptAd: 'ADVERTISEMENT (Tangazo la Biashara / Bidhaa)',
    evTypeOptNews: 'NEWS (Habari & Taarifa kwa Umma)',
    evRegionAll: 'Mikoa Yote (National Tour)',

    // Admin Dashboard
    adminKpiBooked: 'Mabanda Yaliyohifadhiwa',
    adminKpiRevenue: 'Mapato ya Mabanda (TZS)',
    adminKpiVisitors: 'Watembeleaji wa Tovuti',
    adminKpiAttendees: 'Wahudhuriaji wa Mikoa',
    adminDestManagerBadge: 'Mkoa Tunaoenda & Eneo la Tamasha (Destination & Venue Manager)',
    adminDestManagerTitle: 'Panga Mkoa Unaofuata na Eneo Rasmi Litakaloonekana Kwenye Ramani',
    adminDestManagerDesc: 'Chagua mkoa ambapo tamasha linaelekea, jina la uwanja/eneo rasmi, anwani na tarehe ili lionekane moja kwa moja kwenye homepage na ramani.',
    adminDestCurrentBadge: 'Sasa Tunaoenda: Mwanza (Rock City / Furahisha)',
    adminDestSelectLabel: 'Mkoa Tunaoenda (Destination City)',
    adminDestVenueLabel: 'Jina la Uwanja / Venue Grounds',
    adminDestLocLabel: 'Anwani / Mahali Rasmi (Street/Location)',
    adminDestDatesLabel: 'Tarehe za Tamasha (Event Dates)',
    adminDestNotesLabel: 'Maelezo ya Eneo / Maegesho / Landmark',
    adminBookedTableTitle: 'Orodha ya Washiriki Waliohifadhi Mabanda (Booked Exhibition Booths)',
    adminThCompany: 'Mshiriki / Kampuni',
    adminThBooth: 'Banda',
    adminThRegions: 'Mikoa',
    adminThAmount: 'Kiasi',

    spSuccessMsg: 'Asante! Maombi yako yamepokelewa. Timu yetu (+255 767 053 250) itawasiliana nawe.',
    ctSuccessMsg: 'Asante! Ujumbe wako umepokelewa. Tutawasiliana nawe kupitia simu / email uliyoweka.',
    adminDestSuccessMsg: 'Mkoa na Eneo Vimesasishwa Kikamilifu Kwenye Ramani!',

    // Newsletter Section & Modal
    newsletterHeading: 'JIUNGE NA JARIDA LETU ILI KUPATA HABARI MPYA KWANZA',
    newsletterBtn: 'Jiunge na Jarida',
    newsletterPageBadge: 'Taarifa Rasmi za TBF',
    newsletterBackBtn: 'Rudi Mwanzo',
    newsletterQueries: 'Kwa maswali yoyote tafadhali watumie waandaaji barua pepe kupitia',
    newsletterEmailLabel: 'Barua Pepe:',
    newsletterModalTitle: 'Jiunge na Jarida Rasmi la TBF',
    newsletterModalSubtitle: 'Pata taarifa za ratiba za mikoa, fursa za biashara na miongozo ya mabanda moja kwa moja kwenye barua pepe yako.',
    newsletterNameLabel: 'Jina Kamili (Si lazima)',
    newsletterEmailInputLabel: 'Barua Pepe Rasmi',
    newsletterRegionLabel: 'Mkoa Unaovutiwa Nao',
    newsletterRegionAll: 'Mikoa Yote ya Mzunguko (Nchi Nzima)',
    newsletterSubmitBtn: 'Thibitisha Kujiunga',
    newsletterSuccessHeading: 'Umefanikiwa Kujiunga!',
    newsletterSuccessMsg: 'Asante sana! Barua pepe yako imesajiliwa kikamilifu. Utapokea taarifa na habari zote kwanza.',
    newsletterCloseBtn: 'Funga',

    // Additional Placeholders, Payment Titles & Admin Labels
    retrieveRefPlaceholder: 'Mfano: TBF-BIZ-101 au 99104...',
    formBizNamePlaceholder: 'Mfano: Azania Agro & Spices Ltd',
    formContactPlaceholder: 'Mfano: Juma Bakari',
    formTaglinePlaceholder: 'Mfano: Wazalishaji na wasambazaji wa viungo asilia, nafaka na mafuta.',
    formEmailPlaceholder: 'barua@kampuni.co.tz',
    spOrgPlaceholder: 'Mfano: Reliance Solutions Ltd',
    spContactPlaceholder: 'Mfano: Neema Kweka',
    spRegionSearchPlaceholder: 'Tafuta mkoa (mf. Dar es Salaam, Arusha...)',
    spPhoneShort: 'Simu / WhatsApp:',
    spEmailShort: 'Barua Pepe:',
    annStatusPlaceholder: 'Mfano: Tarehe Rasmi ni Wiki Ijayo / Usajili Wazi',
    annTitlePlaceholder: 'Kichwa cha Tukio, Habari au Tangazo la Biashara *',
    annSummaryPlaceholder: 'Maelezo kamili ya tangazo au tukio *',
    ctNamePlaceholder: 'Mfano: Juma Rashid',
    ctMsgPlaceholder: 'Andika swali, maoni au maombi ya udhamini hapa...',
    payCardMobileTitle: 'Malipo ya Simu (Mobile Money)',
    payCardBankTitle: 'Uhamisho wa Benki (Control #)',
    payCardOnlineTitle: 'Kadi Mtandaoni (Card)',
    adminThId: 'ID & Control #',
    adminThStatus: 'Hali & Udhibiti',
    adminBtnMarkPaid: 'Thibitisha Malipo',
    adminStatusPaid: 'Imelipwa',
    adminStatusPending: 'Inasubiri Malipo',
    adminStatusCancelled: 'Imeghairiwa',
    adminStatusExpired: 'Muda Umeisha',
    adminHoldsPrefix: 'Mabanda Yaliyoshikwa:',
    loginMissingErr: 'Weka barua pepe na nenosiri la msimamizi.',
    loginInvalidErr: 'Taarifa za kuingia si sahihi.',
    loginNetworkErr: 'Hitilafu ya mtandao wakati wa kuingia. Jaribu tena.',
    sumZoneLbl: 'Ukanda (Zone):',
    sumSizeLbl: 'Ukubwa / Nafasi:',
    sumPassesLbl: 'Vibali vya QR:',
    sumVenueDatesLbl: 'Uwanja & Tarehe:',
    sumSeatStatusLbl: 'Hali ya Siti:',
    sumPerksLbl: 'Huduma & Vipengele Vilivyojumuishwa:'
  },

  en: {
    // Brand & Header
    topProposalLink: 'Open Official Proposal (PDF)',
    brandSubtitle: 'Every business has a place, every city has an opportunity',
    navHome: 'HOME',
    navAbout: 'ABOUT US',
    navBooking: 'BOOKING',
    navSponsors: 'SPONSORS',
    navNews: 'NEWS',
    navSubAllNews: 'ALL UPDATES',
    navSubGallery: 'PHOTO GALLERY',
    navSubLatestNews: 'LATEST NEWS',
    navSubEventsSchedule: 'EVENTS & SCHEDULE',
    navSubAds: 'ADVERTISEMENTS',
    navSubOfficialNews: 'OFFICIAL NEWS',
    navSubSponsors: 'SPONSORS & PARTNERS',
    navContacts: 'CONTACTS',
    navLogin: 'LOGIN',
    langLabel: 'LANGUAGE:',
    langBtn: 'LANGUAGE',

    cardBtnGallery: 'View Gallery',
    cardBtnAction: 'Book Booth →',

    // Hero Buttons
    heroBtnBook: '+ BOOK YOUR EXHIBITION BOOTH',
    heroBtnAbout: 'ABOUT THE FESTIVAL',
    heroBtnContact: 'CONTACT US',

    // Home 3 Action Cards
    card1Title: 'BOOK A BOOTH NOW!',
    card1Desc: 'Reserve your exhibition booth to showcase and sell your products across regional festival stops.',
    card1Btn: 'Book Now →',
    card2Title: 'OUR VISION & MISSION',
    card2Desc: 'To be Tanzania’s premier platform connecting people, businesses, and investors in every region.',
    card2Btn: 'Explore About Us →',
    card3Title: 'SPONSORS & PARTNERS',
    card3Desc: 'Partner with us as a title sponsor, official bank, or corporate sponsor across regional summits.',
    card3Btn: 'Partner With Us →',

    // Destination & Map Section
    destSecBadge: '2026/2027 REGIONAL TOUR • NATIONWIDE CARAVAN',
    destSecTitle: 'Official Festival Venue & Interactive Street Map',
    destSecSub: 'Explore the fairgrounds, venue photos, and live interactive street map for the upcoming stop.',
    destSecBtn: '+ Reserve Your Booth →',
    destBadgeUpcoming: 'Upcoming Destination',
    destLabelVenue: 'Exhibition Grounds / Venue',
    destLabelLocation: 'Location / Address',
    destLabelDates: 'Festival Dates',
    destPhotosHeading: 'Venue & Fairgrounds Photos',
    destPhotosClick: 'Click to preview',
    destBookBtnPrefix: '+ Reserve Booth in',
    destGoogleMapsBtn: 'Google Maps ↗',

    // Regional Showcase Section (Carousel / Moving Regions)
    homeUpdatesBadge: 'REGIONAL HUBS • NATIONWIDE SHOWCASE',
    homeUpdatesHeading: 'NATIONWIDE REGIONAL TOUR & COMMERCIAL HUBS',
    homeUpdatesSubtitle: 'A roving economic movement reaching every region across Tanzania. Explore modern pavilions, vendor booths, and official fairgrounds.',
    homeUpdatesViewAll: 'Explore Nationwide Tour →',
    newsReadMore: 'Read More →',

    // Testimonials
    usersSayBadge: 'TESTIMONIALS • WHAT OUR USERS SAY',
    usersSayHeading: 'What Exhibitors & Attendees Say About TBF',
    usersSaySubtitle: 'Discover how Tanzania Biashara Festival connects businesses with direct buyers, regional distribution agents, and institutional investors across Tanzania.',
    testActionTitle: 'Join Hundreds of Exhibitors at the Festival',
    testActionSub: 'Reserve your booth now to showcase and sell your products to thousands across every region.',
    testActionBtn: 'Book Exhibition Booth →',

    // Live Stats Banner
    statLabelVisitors: 'Website Visitors',
    statLabelAttendees: 'Regional Attendees',
    statLabelInvestors: 'Sponsors & Investors',
    statLabelBusinesses: 'Exhibition Booths Secured',

    // About Us Page
    aboutBadge: 'ABOUT US • TANZANIA BIASHARA FESTIVAL',
    aboutTitle: "Tanzania's Premier Nationwide Platform for Trade, Brand Promotion & Investment",
    aboutDesc: 'Tanzania Biashara Festival (TBF) is a large-scale roving business, investment, and commerce festival touring across any region scheduled nationwide in Tanzania. Our mission is to give businesses an unmatched platform to promote their brands and sell directly to the public, while connecting serious investors directly with bankable ventures and growing companies.',
    aboutMottoTitle: 'Our Motto',
    aboutMottoQuote: '"Every business has a place, every city has an opportunity."',
    aboutMottoSub: 'Every enterprise has its space, and every town across Tanzania holds real economic and investment opportunity.',
    aboutVisionTitle: 'Our Vision',
    aboutVisionBody: "To be Tanzania's leading nationwide ecosystem for business expansion, brand visibility, innovation, and high-impact investment.",
    aboutMissionTitle: 'Our Mission',
    aboutMissionBody: 'To build an inclusive commercial bridge connecting entrepreneurs, brands, buyers, and investors across Tanzania to drive sustainable economic growth.',
    aboutHowItWorksBadge: 'HOW IT WORKS IN DETAIL • NATIONWIDE TOUR',
    aboutHowItWorksTitle: 'How Tanzania Biashara Festival Operates Step by Step',
    aboutHowItWorksDesc: 'TBF is never limited to a fixed shortlist of cities — the festival follows a flexible roving tour schedule capable of reaching any planned region across Mainland Tanzania and Zanzibar. Each destination pairs a modern exhibition arena with advance online promotion and dynamic live fairground programming.',
    aboutPillar1Title: '01. Regional Scheduling & Grounds Setup',
    aboutPillar1Desc: 'Our team selects target regions based on market demand, announcing fairgrounds with zoned pavilions, utilities, and round-the-clock security.',
    aboutPillar2Title: '02. Advance Digital Promotion',
    aboutPillar2Desc: 'As soon as a vendor reserves a booth, their business is showcased upfront on the TBF portal so buyers and partners discover them early.',
    aboutPillar3Title: '03. Live Sales, Auctions & Activations',
    aboutPillar3Desc: 'On site, crowds enjoy retail and wholesale shopping, lively open-air auctions, brand launches, product demos, and lifestyle experiences.',
    aboutPillar4Title: '04. Investor Matchmaking & Agents',
    aboutPillar4Desc: 'Curated B2B roundtables, venture pitching, and regional distributor signings keep business relationships growing well after the tour moves on.',
    aboutBookBtn: 'Reserve Booth Now →',
    aboutContactBtn: 'Contact Us →',
    aboutHeroStat1Val: 'Nationwide',
    aboutHeroStat1: 'Flexible Tour Across Scheduled Regions',
    aboutHeroStat2Val: 'B2B & B2C',
    aboutHeroStat2: 'Buyers, Brands & Investors',
    aboutHeroStat3Val: 'Hybrid Expo',
    aboutHeroStat3: 'Physical Fairgrounds + Online Reach',
    aboutValuesTitle: 'Core Identity & Guiding Principles',
    aboutValuesSub: 'Every pillar of Tanzania Biashara Festival is designed so participating businesses gain visibility, close real sales, and meet serious capital partners.',
    aboutEcosystemBadge: 'WHO WE SERVE • FULL COMMERCIAL ECOSYSTEM',
    aboutEcosystemTitle: 'Built for Growing Brands, Active Investors & Shoppers',
    aboutEcosystemDesc: 'Whether you are an enterprise seeking high-impact marketing or an investor scouting Tanzania’s next high-growth sector, TBF bridges every side of the market.',
    aboutExhibitTag: 'FOR BUSINESSES SEEKING PROMOTION & SALES',
    aboutExhibitTitle: 'Promote Your Brand, Sell Direct & Build Regional Agents',
    aboutExhibitBody: 'Small businesses, mid-sized brands, factories, and service providers gain both physical foot traffic and online spotlight to launch products, run live stage promos, and accelerate nationwide sales.',
    aboutExhibitPt1: 'Front-page business showcase online plus high-visibility booths at every scheduled city',
    aboutExhibitPt2: 'Product launches, live brand activations, open-air auctions & direct bulk trade',
    aboutExhibitPt3: 'Connect with wholesalers and regional sales agents anywhere the tour travels',
    aboutBuyerTag: 'FOR INVESTORS SEEKING HIGH-GROWTH OPPORTUNITIES',
    aboutBuyerTitle: 'Invest in Vetted Ventures, Manufacturing & Expanding SMEs',
    aboutBuyerBody: 'TBF goes beyond retail shopping — it is a live deal-making engine. Domestic and international investors meet entrepreneurs face to face on the ground, evaluate active products, and structure joint ventures or capital financing.',
    aboutBuyerPt1: 'Dedicated Investment Forums & B2B Deal Rooms with vetted project owners',
    aboutBuyerPt2: 'Business Innovation Pitch Arena showcasing scalable startups seeking capital or partners',
    aboutBuyerPt3: 'First-hand regional market intelligence across agriculture, energy, manufacturing & tech',
    aboutCrowdTag: 'FOR SHOPPERS, YOUTH & LOCAL COMMUNITIES',
    aboutCrowdTitle: 'Factory-Direct Deals, Open Auctions, Training & Lifestyle',
    aboutCrowdBody: 'Residents of every host region gain access to genuine factory goods at promotional festival prices, exciting open-air auctions, entrepreneurship workshops, culinary courts, and family entertainment.',
    aboutCrowdPt1: 'Genuine agricultural, industrial, and consumer goods at direct festival discounts',
    aboutCrowdPt2: 'Practical business, branding, and financial growth workshops on the fairgrounds',
    aboutCrowdPt3: 'Vibrant Food Court, artisan markets, coffee lounges, and cultural showcase stages',
    aboutSectorsBadge: 'WHAT HAPPENS INSIDE THE FESTIVAL • SECTORS',
    aboutSectorsTitle: 'Industries & Activities Featured at Every Edition',
    aboutSectorsDesc: 'Every festival arena brings together diverse commercial sectors, modern innovations, and experiential lifestyle zones under one roof.',
    aboutSec1Title: 'Manufacturing, Agribusiness & Everyday Goods',
    aboutSec1Desc: 'Grains, processed foods, textiles, construction hardware, cosmetics, and household products sold straight from producers.',
    aboutSec2Title: 'Technology, Fintech & Clean Energy',
    aboutSec2Desc: 'Digital payment systems, business software, telecom solutions, solar irrigation & clean power systems, and youth tech startups.',
    aboutSec3Title: 'Arts, Hospitality, Tourism & Food Court',
    aboutSec3Desc: 'Tanzanian leatherwork and heritage crafts, safari gear, coffee & restaurant stands, and community entertainment stages.',
    aboutTrustBadge: 'BRAND SPONSORSHIP & STRATEGIC PARTNERSHIPS',
    aboutTrustTitle: 'Become an Official Sponsor or Sector Partner Nationwide',
    aboutTrustBody: 'Corporates, banks, telecoms, insurers, and institutional brands looking for dominant nationwide exposure can sponsor the full roving tour or individual host regions with exclusive digital and arena rights.',
    aboutTrustBtn: 'Explore Sponsorship Packages →',

    // Booking Page
    bookingBadge: 'VENDOR & EXHIBITOR BOOTH RESERVATION',
    bookingTitle: 'Reserve Your Exhibition Booth',
    bookingDesc: 'Pick a booth on the map first to view its price, enter your business details next, and finish payment step by step.',
    bookingDiscount: '15% Multi-City Discount for 2+ Regions!',
    bookingTabBook: 'New Booth Booking',
    bookingTabRetrieve: 'Check / Change Booking (PIN)',
    wizStep1: 'Select Booth',
    wizStep2: 'Your Details',
    wizStep3: 'Payment',
    wizActiveCityLbl: 'Tour Destination & Dates',
    wizScheduledByAdmin: 'Open for Reservations',
    wizPickRegion: '1A. Select City / Cities',
    wizPickPackage: '1B. Booth Category',
    wizStep1Prompt: 'Click any open booth slot above to select and reveal pricing.',
    btnNextStep2: 'Continue: Your Details →',
    btnBackStep1: '← Back: Change Booth',
    btnNextStep3: 'Continue: Payment →',
    btnBackStep2: '← Back: Edit Details',
    bookingRetrieveTitle: 'Retrieve Booking, Unlock Control Number & Switch Booth',
    bookingRetrieveDesc: 'Enter your Booking ID or Control Number with your Phone Number for a summary, then enter your 6-digit Access PIN to unlock your full receipt or change your booth.',
    bookingRetrieveRefLbl: 'Booking ID or Control Number *',
    bookingRetrievePhoneLbl: 'Registered Phone Number *',
    bookingRetrieveBtn: 'Find Booking & Pass →',
    bookingStep1Title: 'Select Tour City / Cities to Participate',
    bookingStep1Note: 'Official dates are announced under Events & News',
    bookingStep2Title: 'Choose Booth Package Category',
    bookingStep3Title: 'Booth Floor Map — Click a Booth to Select',
    legendAvailable: 'Available',
    legendSelected: 'Selected',
    legendHeld: 'Held',
    legendBooked: 'Reserved',
    bookingHoldHint: 'Your selected booth is automatically held for 10 minutes as you enter your details.',
    bookingHoldBtn: 'Hold Selected Booth (10 Min)',
    bookingStep2WizardTitle: 'Step 2: Enter Your Business Details',
    bookingStep2WizardDesc: 'Fill in your business details below, then proceed to payment.',
    bookingStep3WizardTitle: 'Step 3: Payment & Generate Control Number',
    bookingStep3WizardDesc: 'Review your selection, pick a payment method, and confirm to receive your Control Number and Security PIN.',
    bookingStep4Title: 'Business Details & Payment Method',
    bookingStep4Desc: 'Complete your business details below to receive your Control Number and 6-digit Security Access PIN.',
    lblBizName: 'Business / Company Name *',
    lblSector: 'Business Sector *',
    lblTagline: 'Short Description of Products / Services (Tagline) *',
    lblContactPerson: 'Contact Person Name *',
    lblPhone: 'Business Phone (WhatsApp / Call) *',
    lblEmail: 'Email Address *',
    lblPayment: 'Payment Method *',
    sumHeader: 'Registration Summary',
    sumTitle: 'Digital Receipt & Pass',
    sumOfficialPass: 'Exhibitor Pass & Summary',
    sumSelectPrompt: 'Click any booth on the map to reveal its category and price.',
    sumUnitPrice: 'Booth Price:',
    sumCityCount: 'Scheduled Region:',
    sumDiscount: 'Tour Discount (15%):',
    sumTotal: 'Total Amount Payable:',
    sumSubmitBtn: 'Confirm & Generate Control Number',

    // Sponsors Page
    spTitle: 'Partner With Us: Sponsors & Partners',
    spDesc: 'Position your brand in front of thousands of regional businesses, distributors, and consumers across Tanzania. Contact our partnership desk directly at +255 767 053 250.',
    spProposalBtn: 'Open & Download Festival Overview (PDF) →',
    spRoleSponsor: 'Sponsor',
    spRolePartner: 'Strategic Partner',
    spCurrentTitle: 'Official Sponsors & Strategic Partners',
    spCurrentDesc: 'Organizations and enterprises partnering with Tanzania Biashara Festival across the nation. Click any partner logo to visit their official website.',
    spRelianceRole: 'Official Technology & Digital Partner',
    spFormTitle: 'Apply as a Sponsor or Partner',
    spFormDesc: 'Enter your organization details below and our partnerships team will contact you.',
    spOrgLabel: 'Organization / Company Name *',
    spContactLabel: 'Contact Person Name *',
    spPhoneLabel: 'Phone / WhatsApp *',
    spEmailLabel: 'Official Email Address *',
    spTierLabel: 'Partnership Interest',
    spRegionLabel: 'Target Regions / Coverage',
    spRegionSelectAll: 'Select All Regions (All 31 Regions)',
    spRegionDone: 'Done',
    spSubmitBtn: 'Submit Sponsorship Request',
    spSuccessHeading: 'Sponsorship Request Received!',
    spAnotherBtn: 'Submit Another Request',
    spSuccessMsg: 'Thank you! Your request has been received. Our team (+255 767 053 250) will contact you.',

    // Events Page
    evBadge: 'Dynamic Updates • No Fixed Hardcoded Dates',
    evTitle: 'Events, News & Commercial Advertisements',
    evDesc: 'As regional fair dates are scheduled with venue management, official Event Dates, News Updates, and Commercial Ads are continuously published and refreshed here.',
    evFilterAll: 'All',
    evFilterEvents: 'Upcoming Events & Schedule',
    evFilterGallery: 'Photo Gallery',
    evFilterAds: 'Advertisements',
    evFilterNews: 'Official News',
    evUpdatesSubheading: 'Latest Updates & Commercial Announcements',
    evPublishTitle: '+ Publish Event Update, News or Business Advertisement',
    evTypeLabel: 'Publication Type',
    evRegionLabel: 'Target Region',
    evStatusLabel: 'Schedule/Status Note (Optional)',
    evPublishBtn: 'Publish Update / Ad Now',

    // Contacts Page
    ctBadge: 'OFFICIAL CONTACTS • REACH OUR TEAM',
    ctTitle: 'Contact Tanzania Biashara Festival',
    ctDesc: 'For booth reservations, sponsorship packages, corporate partnerships, or festival tour inquiries, contact us directly:',
    ctCard1Title: 'Phone / WhatsApp',
    ctCard1Sub: 'Available for instant phone calls and WhatsApp support for booth reservations.',
    ctCard1Btn: 'Chat on WhatsApp Now →',
    ctCard2Title: 'Official Email Desk',
    ctCard2Sub: 'Send emails for institutional communications, formal proposals, and strategic sponsorship inquiries.',
    ctCard2Btn: 'Send Email Now →',
    ctCard3Title: 'Offices & Roving Circuit',
    ctCard3Value: 'All Regions across Tanzania',
    ctCard3Sub: 'Dar es Salaam • Mwanza • Arusha • Dodoma • Mbeya • Zanzibar (Designated Exhibition Fairgrounds).',
    ctCard3Hours: 'Working Hours: Monday - Saturday (08:00 - 18:00)',
    ctFormBadge: 'INQUIRY FORM',
    ctFormTitle: 'Send an Inquiry or Message',
    ctFormDesc: 'Complete this brief form and our team will get in touch promptly.',
    ctNameLabel: 'Your Full Name *',
    ctPhoneLabel: 'Phone Number *',
    ctEmailLabel: 'Email Address',
    ctTypeLabel: 'Inquiry / Participation Type *',
    ctMsgLabel: 'Your Message *',
    ctSubmitBtn: 'Send Message Now →',
    ctSuccessMsg: 'Thank you! Your message has been received. We will contact you shortly.',

    // Login Page
    loginHeading: 'Sign In',
    loginSubheading: 'Sign in with your email address to access your reservation or portal.',
    exLoginEmailLabel: 'Email Address *',
    exLoginEmailPlaceholder: 'email@company.co.tz',
    exLoginRefLabel: 'Booking ID / Control #',
    exLoginRefPlaceholder: 'TBF-BIZ-... or 99104...',
    exLoginPinLabel: 'PIN / Password',
    exLoginPinPlaceholder: '••••••••',
    exLoginBtn: 'Sign In →',
    exRegisterTitle: 'New exhibitor? Reserve your booth today.',
    exRegisterBtn: 'Register →',

    // Admin Page
    adminBadge: 'Organizer Backoffice & Visitor Analytics Dashboard',
    adminTitle: 'Management System (Admin & Regional Attendance Analytics)',
    adminBookingsTitle: 'Booked Exhibition Booths & Payment Controls',
    adminAddNewsBtn: '+ Post Update / News',
    adminLogoutBtn: 'Log Out',
    adminDestTitle: 'Active Destination & Map (Admin Spotlight)',
    adminDestDesc: 'Choose the region, venue, location, and dates shown on the front page.',
    adminDestSaveBtn: 'Save Upcoming Destination & Venue Map',
    adminDestSuccess: 'Destination & Venue Updated on Interactive Map!',

    // Modals & Cookies
    modalBookingConfirmed: 'Control Number Issued • Awaiting Payment',
    modalBookingTitle: 'Your Booth Receipt & Control Number',
    modalBookingSub: 'Use the Control Number below to complete payment. For assistance call +255 767 053 250.',
    modalDownloadBtn: 'Download QR Pass & Receipt (PNG)',
    modalPrintBtn: 'Print',
    modalHomeBtn: 'View Your Business on Front Page →',
    modalCloseBtn: '✕ Close',
    receiptBackBookingBtn: 'Back to Booths',
    cookieTitle: 'We Value Your Privacy',
    cookieText: 'We use cookies to improve our services and to remember who you are, including your language preferences and booking session. By clicking "Accept All Cookies", you consent to our use of cookies.',
    cookieAcceptBtn: 'Accept All Cookies',
    cookieEssentialBtn: 'Essential Only',
    cookieManageBtn: 'Preferences',
    footerCookieSettings: 'Cookie Settings',
    cookieModalTitle: 'Privacy & Cookie Settings',
    cookieModalSubtitle: 'Manage the cookie categories you allow during your visit.',
    cookieCatEssentialTitle: 'Strictly Necessary Cookies',
    cookieAlwaysActiveBadge: 'Always Active',
    cookieCatEssentialDesc: 'Required for secure sessions, booth concurrency locking, and core platform operations. Cannot be disabled.',
    cookieCatPrefTitle: 'Functional & Preference Cookies',
    cookieCatPrefDesc: 'Allows the platform to remember your selected language and active regional tour location across sessions.',
    cookieCatAnalyticsTitle: 'Privacy-First Analytics',
    cookieCatAnalyticsDesc: 'Helps us anonymously measure real-time platform visits and regional interest without sharing data with third-party advertisers.',
    cookieSavePreferencesBtn: 'Save Preferences',
    cookieAcceptAllBtn: 'Accept All',

    // Footer
    footerMotto: '"Every business has a place, every city has an opportunity."',
    footerDesc: "Tanzania's nationwide roving trade festival connecting exhibitors, businesses, and investors with buyers in every region.",
    footerLinksTitle: 'Quick Navigation',
    footerLinkFeatured: 'Home & Regional Tour',
    footerLinkAbout: 'About TBF',
    footerLinkBooking: 'Book Exhibition Booth',
    footerLinkProposal: 'Official Proposal (PDF)',
    footerProgramsTitle: 'Programs & Media',
    footerLinkSponsors: 'Partners & Sponsors',
    footerLinkEvents: 'Events & Schedule',
    footerLinkAds: 'Advertisements',
    footerLinkNews: 'Official News',
    footerContactTitle: 'Official Contacts',
    footerTourText: 'Nationwide Roving Tour across Tanzania',
    footerCopyright: '© Tanzania Biashara Festival (TBF). All rights reserved.',
    footerPowered: 'Powered by TBF Digital Platform',

    // Dropdown & Global
    langBtn: 'Language',
    langSwLabel: 'Kiswahili',
    langEnLabel: 'English',
    langZhLabel: '中文 (Chinese)',

    // Booking Select Options
    optSectorAgri: 'Agribusiness & Food Processing',
    optSectorMfg: 'Manufacturing & Fast-Moving Consumer Goods (FMCG)',
    optSectorTech: 'Technology, Innovation & Startups',
    optSectorMining: 'Mining, Construction & Renewable Energy',
    optSectorFinance: 'Banking, Insurance, Fintech & Investment',
    optSectorTourism: 'Tourism, Gemstones, Arts & Fashion',
    optSectorFood: 'Catering, Beverage & Food Court',

    optPayMobile: 'Mobile Money (M-Pesa / Mixx by Yas / Airtel Money)',
    optPayBank: 'Bank Transfer / Control Number (CRDB / NMB)',
    optPayCard: 'Visa / Mastercard Online Payment',

    // Contact Form Select Options
    ctOptBooth: 'Exhibition Booth Booking & Registration',
    ctOptSponsor: 'Corporate Sponsorship & Partnerships',
    ctOptSchedule: 'Regional Tour Schedule & Dates',
    ctOptOther: 'General Inquiries & Media Access',

    // Events Form Select Options
    evTypeOptEvent: 'EVENT (Dates, Schedule & Tour Announcements)',
    evTypeOptAd: 'ADVERTISEMENT (Vendor Promotion & Commercial Deals)',
    evTypeOptNews: 'NEWS (Official Press Releases & Public Updates)',
    evRegionAll: 'All Regions (Nationwide Tour)',

    // Admin Dashboard
    adminKpiBooked: 'Total Booths Booked',
    adminKpiRevenue: 'Total Revenue (TZS)',
    adminKpiVisitors: 'Total Website Visitors',
    adminKpiAttendees: 'Regional Attendees',
    adminDestManagerBadge: 'Destination & Venue Manager',
    adminDestManagerTitle: 'Set Next Tour Destination & Live Interactive Map',
    adminDestManagerDesc: 'Select the target region, venue name, address, and dates to be instantly featured on the homepage and interactive map.',
    adminDestCurrentBadge: 'Current Destination: Mwanza (Rock City / Furahisha)',
    adminDestSelectLabel: 'Destination City',
    adminDestVenueLabel: 'Venue / Fairgrounds Name',
    adminDestLocLabel: 'Street Address / Venue Location',
    adminDestDatesLabel: 'Event Dates & Schedule',
    adminDestNotesLabel: 'Venue Highlights / Parking / Landmark Notes',
    adminBookedTableTitle: 'Booked Exhibitors & Vendor Booth Directory',
    adminThCompany: 'Exhibitor / Company',
    adminThBooth: 'Booth Tier',
    adminThRegions: 'Selected Cities',
    adminThAmount: 'Total Fee',

    spSuccessMsg: 'Thank you! Your sponsorship request has been received. Our corporate team (+255 767 053 250) will contact you shortly.',
    ctSuccessMsg: 'Thank you! Your message has been received. We will get in touch with you via your phone or email.',
    adminDestSuccessMsg: 'Destination and venue map details successfully updated!',

    // Newsletter Section & Modal
    newsletterHeading: 'SUBSCRIBE TO OUR NEWSLETTER TO GET LATEST NEWS FIRST',
    newsletterBtn: 'Subscribe',
    newsletterPageBadge: 'Official TBF Dispatch',
    newsletterBackBtn: 'Back to Home',
    newsletterQueries: 'Any queries please email organisers on',
    newsletterEmailLabel: 'Email:',
    newsletterModalTitle: 'Subscribe to Official TBF Newsletter',
    newsletterModalSubtitle: 'Get regional tour schedules, business opportunities, and exhibition booth guides directly to your inbox.',
    newsletterNameLabel: 'Full Name (Optional)',
    newsletterEmailInputLabel: 'Email Address',
    newsletterRegionLabel: 'Region of Interest',
    newsletterRegionAll: 'All Tour Regions (Nationwide)',
    newsletterSubmitBtn: 'Subscribe Now',
    newsletterSuccessHeading: 'Successfully Subscribed!',
    newsletterSuccessMsg: 'Thank you! You have successfully subscribed to the Tanzania Biashara Festival newsletter.',
    newsletterCloseBtn: 'Close',

    // Additional Placeholders, Payment Titles & Admin Labels
    retrieveRefPlaceholder: 'e.g. TBF-BIZ-101 or 99104...',
    formBizNamePlaceholder: 'e.g. Azania Agro & Spices Ltd',
    formContactPlaceholder: 'e.g. Juma Bakari',
    formTaglinePlaceholder: 'e.g. Producers and suppliers of organic spices, grains and oils.',
    formEmailPlaceholder: 'email@company.co.tz',
    spOrgPlaceholder: 'e.g. Reliance Solutions Ltd',
    spContactPlaceholder: 'e.g. Neema Kweka',
    spRegionSearchPlaceholder: 'Search region (e.g. Dar es Salaam, Arusha...)',
    spPhoneShort: 'Phone / WhatsApp:',
    spEmailShort: 'Email:',
    annStatusPlaceholder: 'e.g. Official Dates Next Week / Registration Open',
    annTitlePlaceholder: 'Event, News or Commercial Ad Headline *',
    annSummaryPlaceholder: 'Full summary of event or commercial notice *',
    ctNamePlaceholder: 'e.g. Juma Rashid',
    ctMsgPlaceholder: 'Write your inquiry, booth question, or partnership message here...',
    payCardMobileTitle: 'Mobile Money',
    payCardBankTitle: 'Bank Transfer',
    payCardOnlineTitle: 'Card Online',
    adminThId: 'ID & Control #',
    adminThStatus: 'Status & Actions',
    adminBtnMarkPaid: 'Mark Paid',
    adminStatusPaid: 'Paid',
    adminStatusPending: 'Awaiting Payment',
    adminStatusCancelled: 'Cancelled',
    adminStatusExpired: 'Expired',
    adminHoldsPrefix: 'Holds Active:',
    loginMissingErr: 'Enter both administrator email and password.',
    loginInvalidErr: 'Invalid administrator credentials.',
    loginNetworkErr: 'Network error while signing in. Please try again.',
    sumZoneLbl: 'Exhibition Zone:',
    sumSizeLbl: 'Dimensions / Space:',
    sumPassesLbl: 'Official Passes:',
    sumVenueDatesLbl: 'Venue & Dates:',
    sumSeatStatusLbl: 'Seat Status:',
    sumPerksLbl: 'Included Benefits & Specs:'
  },

  zh: {
    // Brand & Header
    topProposalLink: '打开官方招商方案 (PDF)',
    brandSubtitle: '每家企业皆有其位，每座城市皆有机遇',
    navHome: '首页',
    navAbout: '关于我们',
    navBooking: '展位预订',
    navSponsors: '赞助伙伴',
    navNews: '新闻资讯',
    navSubAllNews: '全部动态',
    navSubGallery: '现场图库',
    navSubLatestNews: '最新新闻',
    navSubEventsSchedule: '活动与日程',
    navSubAds: '商贸广告',
    navSubOfficialNews: '官方公告',
    navSubSponsors: '赞助伙伴',
    navContacts: '联系我们',
    navLogin: '系统登录',
    langLabel: '语言:',
    langBtn: '语言',

    cardBtnGallery: '查看图库',
    cardBtnAction: '立即预订 →',

    // Hero Buttons
    heroBtnBook: '+ 立即预订商业展位',
    heroBtnAbout: '了解展会详情',
    heroBtnContact: '联系我们',

    // Home 3 Action Cards
    card1Title: '立即抢订展位',
    card1Desc: '预订现代化展销展位，在全国各大省份巡展中直接向海量采购商与消费者展销产品。',
    card1Btn: '立即预订 →',
    card2Title: '愿景与使命',
    card2Desc: '成为坦桑尼亚连接大众、商业与投资者的国家级经贸与科技创新综合平台。',
    card2Btn: '了解关于我们 →',
    card3Title: '赞助商与战略伙伴',
    card3Desc: '作为总冠名赞助商、官方金融机构或战略企业伙伴，共享全国巡回商机。',
    card3Btn: '携手合作 →',

    // Destination & Map Section
    destSecBadge: '2026/2027 全国巡展行程 • 坦桑尼亚大篷车',
    destSecTitle: '展会官方举办地与实景交互地图',
    destSecSub: '查看巡展下一站的官方博览会广场实景、现场实拍与高精度交互地图。',
    destSecBtn: '+ 抢订您的展位 →',
    destBadgeUpcoming: '即将巡展省份',
    destLabelVenue: '展会官方广场 / 场地',
    destLabelLocation: '具体举办地点',
    destLabelDates: '巡展举办日期',
    destPhotosHeading: '举办场地实拍照片',
    destPhotosClick: '点击查看大图',
    destBookBtnPrefix: '+ 预订展位：',
    destGoogleMapsBtn: '谷歌地图 ↗',

    // Regional Showcase Section (Carousel / Moving Regions)
    homeUpdatesBadge: '全国各省巡展精选',
    homeUpdatesHeading: '坦桑尼亚全国各省巡回展会与商业枢纽',
    homeUpdatesSubtitle: '辐射坦桑尼亚各大省份的经济大篷车。探索全国各省官方商业展馆、现代化摊位与正式展贸广场。',
    homeUpdatesViewAll: '查看全国巡展行程 →',
    newsReadMore: '阅读全文 →',

    // Testimonials
    usersSayBadge: '参展商评价 • WHAT OUR USERS SAY',
    usersSayHeading: '参展商与各界代表评价',
    usersSaySubtitle: '探索坦桑尼亚商业节（TBF）如何帮助企业开拓新市场、对接投资机构，并在各省巡回展会中直接向数万公众销售优质产品。',
    testActionTitle: '携手数百家参展企业与品牌共襄盛会',
    testActionSub: '立即预订现代化展位，在全国各大经济大省向数万公众与采购商展销产品。',
    testActionBtn: '立即预订展位 →',

    // Live Stats Banner
    statLabelVisitors: '全网累计访客',
    statLabelAttendees: '各省注册观众总数',
    statLabelInvestors: '合作赞助商与投资机构',
    statLabelBusinesses: '已预订展位及参展企业',

    // About Us Page
    aboutBadge: '关于我们 • 坦桑尼亚商业节 (TBF)',
    aboutTitle: '覆盖坦桑尼亚全境的商贸展示、品牌推广与产业投资大平台',
    aboutDesc: '坦桑尼亚商业节（TBF）是面向坦桑尼亚全境灵活巡回举办的大型商业、投资与经济盛会，可根据市场规划前往全国任意省份。我们的宗旨是为企业提供线上线下联动的品牌宣传与产品展销舞台，同时为寻求投资机遇的资本方精准对接具备潜力的实体项目与成长型企业。',
    aboutMottoTitle: '我们的口号',
    aboutMottoQuote: '“每家企业皆有其位，每座城市皆有机遇。”',
    aboutMottoSub: '每家企业都有广阔舞台，坦桑尼亚每一座城市都蕴藏着切实的商贸与投资机遇。',
    aboutVisionTitle: '我们的愿景 (Vision)',
    aboutVisionBody: '成为坦桑尼亚领先的国家级商贸拓展、品牌推广、科技创新与高效投资综合生态平台。',
    aboutMissionTitle: '我们的使命 (Mission)',
    aboutMissionBody: '搭建连接参展企业、消费群体与海内外投资者的包容性桥梁，以真实商机推动坦桑尼亚各省经济持续增长。',
    aboutHowItWorksBadge: '深度运作机制 • 覆盖坦桑全境',
    aboutHowItWorksTitle: '坦桑尼亚商业节如何全流程高效运作',
    aboutHowItWorksDesc: '商业节不局限于少数固定城市，而是采用灵活的全国巡回规划，随市场需求深入坦桑尼亚本土及桑给巴尔各省市。每站巡展均配备现代化会展广场、提前在线曝光机制以及丰富的现场商贸活动。',
    aboutPillar1Title: '01. 灵活巡展规划与场馆搭建',
    aboutPillar1Desc: '组委会依据各地商机规划下一站巡展城市，打造分区明确的展馆、充足电力与全天候专业安保广场。',
    aboutPillar2Title: '02. 线上抢先曝光与品牌造势',
    aboutPillar2Desc: '企业在线预订展位后即可立即登上商业节首页展示，让买家与投资人提前了解您的品牌和主打产品。',
    aboutPillar3Title: '03. 现场展销、公开拍卖与路演',
    aboutPillar3Desc: '展会期间同步开展零售批发直销、大众露天折扣拍卖、新品发布会及丰富多彩的品牌舞台推广活动。',
    aboutPillar4Title: '04. 投融资洽谈与省区代理签约',
    aboutPillar4Desc: '通过B2B投资对接会、创业路演及省级经销签约，确保商业合作在巡展赴往下一城后仍持续创造收益。',
    aboutBookBtn: '立即抢订展位 →',
    aboutContactBtn: '联系我们 →',
    aboutHeroStat1Val: '覆盖全境',
    aboutHeroStat1: '按计划灵活巡回坦桑各省',
    aboutHeroStat2Val: 'B2B & B2C',
    aboutHeroStat2: '品牌、买家与投资人对接',
    aboutHeroStat3Val: '线上线下融合',
    aboutHeroStat3: '实体会展广场 + 数字展厅',
    aboutValuesTitle: '核心理念与平台基石',
    aboutValuesSub: '坦桑尼亚商业节的每一项安排，都旨在帮助参展企业打响品牌知名度、提升真实销量并赢得资本合作。',
    aboutEcosystemBadge: '平台生态与赋能对象',
    aboutEcosystemTitle: '赋能成长品牌、实力投资方与广大民众',
    aboutEcosystemDesc: '无论您是需要全国推广的制造品牌，还是寻找优质项目与合作机遇的投资者，商业节都能为您打通关键通道。',
    aboutExhibitTag: '面向希望推广品牌与拓展销路的企业',
    aboutExhibitTitle: '打响品牌知名度、直面客户销售并招募全国代理',
    aboutExhibitBody: '中小微企业、加工制造工厂及服务品牌可通过广场大客流与官网矩阵曝光，集中举办新品发布、舞台品牌互动并快速提升全国订单量。',
    aboutExhibitPt1: '官网首页显著品牌展示 + 巡展各省黄金展位线下实景引流',
    aboutExhibitPt2: '举办新品路演、品牌互动推广、露天优惠拍卖及大宗批发洽谈',
    aboutExhibitPt3: '在巡展所到的每一个省份直接对接分销商、批发商与区域代理',
    aboutBuyerTag: '面向寻求优质项目的海内外投资者',
    aboutBuyerTitle: '精准投资实体产业、高成长工厂与创新项目',
    aboutBuyerBody: '商业节不仅是一个交易广场，更是项目资本对接引擎。国内外投资者可在现场与具备真实产品的企业负责人面对面交流，探讨股权投资、合资建厂或供应链融资合作。',
    aboutBuyerPt1: '举办专属投资论坛与B2B一对一洽谈室，直联优质实体项目方',
    aboutBuyerPt2: '青年与科技企业创新路演舞台，发掘极具潜力的初创合作项目',
    aboutBuyerPt3: '深入农业加工、新能源、制造业及科技领域的各省一线市场洞察',
    aboutCrowdTag: '面向广大消费者、青年创业者与社会公众',
    aboutCrowdTitle: '原厂直供特惠商品、趣味拍卖、技能培训与美食嘉年华',
    aboutCrowdBody: '举办地民众可在广场一站式买到价格实惠的正品工业与农副产品，参与热闹的露天拍卖，参加商业创富课程并体验各地风味美食与家庭文化演出。',
    aboutCrowdPt1: '厂家直供特惠价采购工业品、农产品、家居百货及电子产品',
    aboutCrowdPt2: '现场举办实用商业营销、品牌打造与理财成长公益培训讲堂',
    aboutCrowdPt3: '汇聚特色美食广场、咖啡休息区、手工艺集市与精彩舞台演艺',
    aboutSectorsBadge: '展会全业态展示板块 • WHAT WE COVER',
    aboutSectorsTitle: '坦桑尼亚商业节涵盖的核心行业与体验区',
    aboutSectorsDesc: '每一站博览会都在同一座现代化广场内汇聚多元商业行业、前沿科技创新及休闲生活方式展区。',
    aboutSec1Title: '现代制造业、农业加工与日用消费品',
    aboutSec1Desc: '精选粮油食品、服装纺织、五金建材、天然日化洗护与家居用品，全部来自源头工厂及品牌直供。',
    aboutSec2Title: '数字科技、金融支付与清洁能源',
    aboutSec2Desc: '覆盖数字收银POS与金融科技软件、通讯互联网服务、太阳能光伏灌溉与储能系统及青年科技初创项目。',
    aboutSec3Title: '非遗工艺、文旅酒店与特色美食广场',
    aboutSec3Desc: '展现坦桑尼亚皮革手作、生态旅游装备、品牌餐饮与精品咖啡，为全场带来浓厚的商业与生活氛围。',
    aboutTrustBadge: '品牌官方赞助与战略合作机遇',
    aboutTrustTitle: '成为坦桑尼亚商业节全国冠名赞助商或战略合作伙伴',
    aboutTrustBody: '大型企业、商业银行、电信运营商与保险机构可赞助全境巡展或单省主场，享有线上线下全渠道独家曝光、主舞台演讲及中心黄金展岛权益。',
    aboutTrustBtn: '查看赞助与合作方案 →',

    // Booking Page
    bookingBadge: '展位预订与参展企业登记',
    bookingTitle: '预订商业博览会展位席位',
    bookingDesc: '先在平面图挑选展位查看价格，再填写企业资料，最后确认付款方式——全程分步指引。',
    bookingDiscount: '预订2个及以上巡展城市尊享 15% 特别折扣！',
    bookingTabBook: '立即预订展位',
    bookingTabRetrieve: '查询 / 更改预订 (PIN)',
    wizStep1: '选择展位',
    wizStep2: '填写信息',
    wizStep3: '付款确认',
    wizActiveCityLbl: '巡展城市与日程',
    wizScheduledByAdmin: '展位现已开放预订',
    wizPickRegion: '1A. 选择巡展省市',
    wizPickPackage: '1B. 选择展位等级',
    wizStep1Prompt: '请点击上方任意空闲展位编号以查看价格。',
    btnNextStep2: '下一步：填写企业资料 →',
    btnBackStep1: '← 返回重选展位',
    btnNextStep3: '下一步：选择付款 →',
    btnBackStep2: '← 返回修改信息',
    bookingRetrieveTitle: '查询预订、解锁缴费识别码与调换展位',
    bookingRetrieveDesc: '输入预订编号或缴费识别码及预留手机号即可查看摘要，随后输入6位安全PIN码解锁完整缴费单或更换展位。',
    bookingRetrieveRefLbl: '预订编号或缴费识别码 (ID / Control Number) *',
    bookingRetrievePhoneLbl: '登记预留手机号码 *',
    bookingRetrieveBtn: '立即查询预订记录 →',
    bookingStep1Title: '选择您要参展的巡回省份 / 城市',
    bookingStep1Note: '官方举办日期将通过活动与新闻动态持续发布',
    bookingStep2Title: '选择展位类型与规格等级',
    bookingStep3Title: '展位平面图 — 点击选择具体展位号',
    legendAvailable: '可选',
    legendSelected: '已选',
    legendHeld: '保留中',
    legendBooked: '已订',
    bookingHoldHint: '点击下一步填写资料时，系统将自动为您保留所选展位10分钟。',
    bookingHoldBtn: '临时锁定该展位 (10分钟)',
    bookingStep2WizardTitle: '第2步：填写参展企业基本信息',
    bookingStep2WizardDesc: '填写下方企业资料后即可进入付款步骤。',
    bookingStep3WizardTitle: '第3步：确认订单与付款方式',
    bookingStep3WizardDesc: '核对所选展位与企业信息，选择付款方式并确认即可获取缴费识别码及6位安全PIN码。',
    bookingStep4Title: '填写参展企业资料与付款方式',
    bookingStep4Desc: '填写下方企业信息即可获取缴费识别码及6位安全查询PIN码。',
    lblBizName: '企业 / 品牌名称 *',
    lblSector: '所属行业板块 *',
    lblTagline: '产品或服务简介 (宣传标语) *',
    lblContactPerson: '联系人姓名 *',
    lblPhone: '联系电话 (微信/电话) *',
    lblEmail: '电子邮箱 *',
    lblPayment: '付款方式 *',
    sumHeader: '登记汇总信息',
    sumTitle: '数字收据与参展通行证',
    sumOfficialPass: '官方参展企业通行凭证 (OFFICIAL PASS)',
    sumSelectPrompt: '点击平面图上的任意展位号，即可查看该展位等级与价格。',
    sumUnitPrice: '展位价格：',
    sumCityCount: '参展举办省份：',
    sumDiscount: '巡展专享优惠 (15%)：',
    sumTotal: '应付总金额：',
    sumSubmitBtn: '确认预订并获取缴费识别码',

    // Sponsors Page
    spTitle: '携手合作：赞助商与战略伙伴',
    spDesc: '在坦桑尼亚全境数万企业主、区域分销商与消费者面前展现卓越企业品牌。欢迎随时致电合作专线：+255 767 053 250。',
    spProposalBtn: '查阅并下载官方项目概览 (PDF) →',
    spRoleSponsor: '赞助商 (Sponsor)',
    spRolePartner: '战略合作伙伴 (Partner)',
    spCurrentTitle: '官方赞助商与战略合作伙伴',
    spCurrentDesc: '携手推动坦桑尼亚商业、科技创新与区域贸易发展的官方合作伙伴。点击品牌标志即可直接访问其官方网站。',
    spRelianceRole: '官方科技与数字化系统合作伙伴',
    spFormTitle: '申请成为赞助商或合作伙伴',
    spFormDesc: '请在下方填写您的企业或机构信息，我们的合作团队将尽快与您联系。',
    spOrgLabel: '企业 / 机构名称 *',
    spContactLabel: '负责人姓名 *',
    spPhoneLabel: '联系电话 / 微信 *',
    spEmailLabel: '官方电子邮箱 *',
    spTierLabel: '合作身份意向',
    spRegionLabel: '拟合作巡展省份 / 区域',
    spRegionSelectAll: '全选所有省份（坦桑尼亚全境 31 省）',
    spRegionDone: '完成',
    spSubmitBtn: '提交合作意向',
    spSuccessHeading: '合作申请已收到！',
    spAnotherBtn: '提交新的合作意向',
    spSuccessMsg: '感谢您的垂询！我们已收到您的申请，招商团队 (+255 767 053 250) 将尽快与您联系。',

    // Events Page
    evBadge: '实时动态发布 • 滚动更新日程',
    evTitle: '展会日程、新闻公告与商贸广告',
    evDesc: '各省巡展时间根据场地筹备情况动态安排，此板块全天候更新各省日程（Events）、官方新闻（News）及赞助商产品广告（Advertisements）。',
    evFilterAll: '全部资讯',
    evFilterEvents: '即将举办与日程安排',
    evFilterGallery: '现场图库',
    evFilterAds: '商贸广告',
    evFilterNews: '官方新闻',
    evUpdatesSubheading: '最新动态与商贸公告',
    evPublishTitle: '+ 发布展会动态、新闻公告或商业广告',
    evTypeLabel: '发布类型',
    evRegionLabel: '所属省份',
    evStatusLabel: '日程状态说明 (选填)',
    evPublishBtn: '立即发布资讯',

    // Contacts Page
    ctBadge: '官方联系方式 • REACH OUR TEAM',
    ctTitle: '联系坦桑尼亚商业节组委会',
    ctDesc: '关于展位预订、赞助合作、官方招商或各省巡展排期咨询，欢迎直接与我们取得联系：',
    ctCard1Title: '电话咨询 / WhatsApp',
    ctCard1Sub: '支持直接致电与WhatsApp在线沟通，为您提供快捷的展位咨询服务。',
    ctCard1Btn: '立即进行 WhatsApp 沟通 →',
    ctCard2Title: '官方电子邮箱',
    ctCard2Sub: '用于官方商务函件、机构战略合作、赞助申请及正式协议往来。',
    ctCard2Btn: '立即发送邮件 →',
    ctCard3Title: '全国巡展办公联络处',
    ctCard3Value: '坦桑尼亚各大核心省份',
    ctCard3Sub: '达累斯萨拉姆 • 姆万扎 • 阿鲁沙 • 多多马 • 姆贝亚 • 桑给巴尔（各省指定博览会广场）。',
    ctCard3Hours: '工作时间：周一至周六 (08:00 - 18:00)',
    ctFormBadge: '在线留言与商务咨询',
    ctFormTitle: '在线留言或提交咨询',
    ctFormDesc: '请填写以下表单，我们的专属商务顾问将尽快与您取得联系。',
    ctNameLabel: '您的姓名 *',
    ctPhoneLabel: '联系电话 *',
    ctEmailLabel: '电子邮箱',
    ctTypeLabel: '咨询 / 参展类型 *',
    ctMsgLabel: '留言内容 *',
    ctSubmitBtn: '立即提交留言 →',
    ctSuccessMsg: '感谢您的垂询！我们已收到您的留言，稍后将通过电话或邮箱与您联系。',

    // Login Page
    loginHeading: '登录',
    loginSubheading: '请使用您的电子邮箱登录查看预订或管理后台。',
    exLoginEmailLabel: '电子邮箱 *',
    exLoginEmailPlaceholder: 'email@company.co.tz',
    exLoginRefLabel: '预订编号 / 缴费识别码',
    exLoginRefPlaceholder: 'TBF-BIZ-... 或 99104...',
    exLoginPinLabel: 'PIN 码 / 密码',
    exLoginPinPlaceholder: '••••••••',
    exLoginBtn: '登录 →',
    exRegisterTitle: '新参展商？立即登记并选定展位。',
    exRegisterBtn: '立即登记 →',

    // Admin Page
    adminBadge: '组委会后台管理与访客数据大屏',
    adminTitle: '展会数据与各省参展统筹管理控制台',
    adminBookingsTitle: '参展企业预订清单与收款审核控制',
    adminAddNewsBtn: '+ 发布公告与新闻',
    adminLogoutBtn: '退出登录',
    adminDestTitle: '展会巡回目的地与交互地图后台',
    adminDestDesc: '选择首页展示的巡回省份、举办场馆、具体地址与举办日期。',
    adminDestSaveBtn: '保存巡展目的地并更新交互地图',
    adminDestSuccess: '巡展目的地与场馆信息已成功同步至交互地图！',

    // Modals & Cookies
    modalBookingConfirmed: '缴费识别码已生成 • 等待付款',
    modalBookingTitle: '您的展位收据与缴费识别码',
    modalBookingSub: '请使用以下识别码完成缴费。如需帮助请致电 +255 767 053 250。',
    modalDownloadBtn: '下载电子通行证与收据 (PNG)',
    modalPrintBtn: '打印',
    modalHomeBtn: '在首页查看您的展商信息 →',
    modalCloseBtn: '✕ 关闭',
    receiptBackBookingBtn: '返回展位预订',
    cookieTitle: '我们重视您的隐私',
    cookieText: '我们使用 Cookie 以改进我们的服务并记住您的身份与偏好设置（包括语言选择与展位预订会话）。点击“接受全部 Cookie”即表示您同意我们使用 Cookie。',
    cookieAcceptBtn: '接受全部 Cookie',
    cookieEssentialBtn: '仅必要 Cookie',
    cookieManageBtn: '偏好设置',
    footerCookieSettings: 'Cookie 设置',
    cookieModalTitle: '隐私与 Cookie 设置',
    cookieModalSubtitle: '管理您在访问期间允许使用的 Cookie 类别。',
    cookieCatEssentialTitle: '必要系统 Cookie',
    cookieAlwaysActiveBadge: '始终启用',
    cookieCatEssentialDesc: '用于账户安全会话、展位预订防冲突锁定及核心平台验证。不可禁用。',
    cookieCatPrefTitle: '偏好与功能性 Cookie',
    cookieCatPrefDesc: '使平台能够跨会话记住您选择的界面语言与关注的巡展地区。',
    cookieCatAnalyticsTitle: '隐私保护数据统计',
    cookieCatAnalyticsDesc: '帮助我们匿名统计实时访问量与各省份关注热度，绝不与任何第三方广告商共享数据。',
    cookieSavePreferencesBtn: '保存偏好设置',
    cookieAcceptAllBtn: '全部接受',

    // Footer
    footerMotto: '“每家企业皆有其位，每座城市皆有机遇。”',
    footerDesc: '坦桑尼亚全国巡回商业博览会，在各大省份直接连接参展企业、中小企业与投资者及本地消费市场。',
    footerLinksTitle: '快速导航',
    footerLinkFeatured: '首页与全国巡展',
    footerLinkAbout: '关于博览会',
    footerLinkBooking: '展商入驻与展位预订',
    footerLinkProposal: '官方招商白皮书 (PDF)',
    footerProgramsTitle: '展会专栏',
    footerLinkSponsors: '赞助商与战略伙伴',
    footerLinkEvents: '展会日程与活动',
    footerLinkAds: '商业推广广告',
    footerLinkNews: '官方新闻公告',
    footerContactTitle: '官方联络处',
    footerTourText: '坦桑尼亚全国巡回大篷车博览会',
    footerCopyright: '© Tanzania Biashara Festival (TBF). 版权所有。',
    footerPowered: '由 TBF 数字平台驱动',

    // Dropdown & Global
    langBtn: '语言',
    langSwLabel: '斯瓦希里语 (Kiswahili)',
    langEnLabel: '英语 (English)',
    langZhLabel: '中文 (Chinese)',

    // Booking Select Options
    optSectorAgri: '农业综合企业与现代食品加工',
    optSectorMfg: '工业制造与快速消费品 (FMCG)',
    optSectorTech: '高新科技、数字化转型与初创企业',
    optSectorMining: '矿产资源、工程建筑与绿色能源',
    optSectorFinance: '商业银行、保险科技与投融资对接',
    optSectorTourism: '文化旅游、天然宝石、工艺艺术与服饰',
    optSectorFood: '特色美食品鉴与餐饮专区 (Food Court)',

    optPayMobile: '移动钱包支付 (M-Pesa / Mixx by Yas / Airtel)',
    optPayBank: '银行转账 / 政府控制号 (CRDB / NMB Control Number)',
    optPayCard: 'Visa / Mastercard 万事达卡在线安全支付',

    // Contact Form Select Options
    ctOptBooth: '展位预订与参展席位登记咨询',
    ctOptSponsor: '企业赞助与全国战略伙伴合作',
    ctOptSchedule: '全国巡展各省最新档期与日程',
    ctOptOther: '媒体宣传、商务合作与其他咨询',

    // Events Form Select Options
    evTypeOptEvent: '展会日程 (省份排期、开幕与重大活动)',
    evTypeOptAd: '商业广告 (展商促销、企业招商与供需发布)',
    evTypeOptNews: '官方动态 (官方新闻通稿与行业要闻)',
    evRegionAll: '全国各省巡回 (National Tour)',

    // Admin Dashboard
    adminKpiBooked: '已预订展位总数',
    adminKpiRevenue: '展位总营收 (TZS)',
    adminKpiVisitors: '独立访问访客总数',
    adminKpiAttendees: '各省注册观众总数',
    adminDestManagerBadge: '巡展目的地与场馆管理系统',
    adminDestManagerTitle: '设置下一巡回省份与官方地图实景',
    adminDestManagerDesc: '选择即将前往的巡展省份、官方场馆名称、详细街道地址与举办日期，系统将即时同步至网站首页及互动地图。',
    adminDestCurrentBadge: '当前巡展举办地：姆万扎 (Rock City / Furahisha)',
    adminDestSelectLabel: '巡展目标城市',
    adminDestVenueLabel: '官方展会广场名称',
    adminDestLocLabel: '官方场馆详细地址',
    adminDestDatesLabel: '展会举办日期与周期',
    adminDestNotesLabel: '场馆地标、交通与停车配套说明',
    adminBookedTableTitle: '已预订展位企业与参展商名录',
    adminThCompany: '参展企业 / 机构',
    adminThBooth: '展位类型',
    adminThRegions: '参展城市',
    adminThAmount: '应付金额',

    spSuccessMsg: '感谢您的垂询！赞助申请已成功提交，招商团队（+255 767 053 250）将尽快与您对接。',
    ctSuccessMsg: '感谢您的留言！我们已收到您的咨询，将通过您留下的电话或邮箱尽快回复。',
    adminDestSuccessMsg: '巡展省份与场馆地图信息已成功更新发布！',

    // Newsletter Section & Modal
    newsletterHeading: '订阅我们的新闻通讯，第一时间获取最新资讯',
    newsletterBtn: '立即订阅',
    newsletterPageBadge: 'TBF 官方资讯推送',
    newsletterBackBtn: '返回首页',
    newsletterQueries: '如有任何疑问，请通过电子邮件联系主办方：',
    newsletterEmailLabel: '电子邮箱：',
    newsletterModalTitle: '订阅 TBF 官方新闻通讯',
    newsletterModalSubtitle: '直接在您的收件箱中获取巡回展时间表、商业机会和展位指南。',
    newsletterNameLabel: '全名（可选）',
    newsletterEmailInputLabel: '电子邮箱',
    newsletterRegionLabel: '感兴趣的地区',
    newsletterRegionAll: '所有巡回地区（全国）',
    newsletterSubmitBtn: '确认订阅',
    newsletterSuccessHeading: '订阅成功！',
    newsletterSuccessMsg: '非常感谢！您已成功订阅坦桑尼亚商业节新闻通讯，将优先获取所有最新动态。',
    newsletterCloseBtn: '关闭',

    // Additional Placeholders, Payment Titles & Admin Labels
    retrieveRefPlaceholder: '例如：TBF-BIZ-101 或 99104...',
    formBizNamePlaceholder: '例如：Azania Agro & Spices Ltd',
    formContactPlaceholder: '例如：Juma Bakari',
    formTaglinePlaceholder: '例如：天然香料、谷物与食用油生产及供应链企业。',
    formEmailPlaceholder: 'email@company.co.tz',
    spOrgPlaceholder: '例如：Reliance Solutions Ltd',
    spContactPlaceholder: '例如：Neema Kweka',
    spRegionSearchPlaceholder: '搜索省份名称（如 Dar es Salaam, Arusha...）',
    spPhoneShort: '电话 / WhatsApp：',
    spEmailShort: '电子邮箱：',
    annStatusPlaceholder: '例如：下周公布正式日期 / 报名通道已开启',
    annTitlePlaceholder: '活动、新闻或商业广告标题 *',
    annSummaryPlaceholder: '公告或商业推广详细内容 *',
    ctNamePlaceholder: '例如：Juma Rashid',
    ctMsgPlaceholder: '请在此填写您的展位咨询、合作建议或留言内容...',
    payCardMobileTitle: '移动钱包支付',
    payCardBankTitle: '银行柜台 / 控制号转账',
    payCardOnlineTitle: '国际银行卡在线支付',
    adminThId: '编号与控制号',
    adminThStatus: '状态与管理',
    adminBtnMarkPaid: '标记已付款',
    adminStatusPaid: '已付款',
    adminStatusPending: '待支付',
    adminStatusCancelled: '已取消',
    adminStatusExpired: '已过期',
    adminHoldsPrefix: '当前锁定展位：',
    loginMissingErr: '请输入管理员邮箱和密码。',
    loginInvalidErr: '登录账号或密码不正确。',
    loginNetworkErr: '登录时网络异常，请稍后重试。',
    sumZoneLbl: '展位区域：',
    sumSizeLbl: '展位面积规格：',
    sumPassesLbl: '官方通行证：',
    sumVenueDatesLbl: '场馆与展期：',
    sumSeatStatusLbl: '席位状态：',
    sumPerksLbl: '展位包含权益与配置：'
  }
};

function makeBoothRange(prefix, count) {
  return Array.from({ length: count }, (_, idx) => `${prefix}-${String(idx + 1).padStart(2, '0')}`);
}

const FLOORPLAN_ZONES = [
  {
    prefix: 'A',
    codes: makeBoothRange('A', 24),
    zoneTitleSw: 'Zone A — Prime Corporate & Executive Boulevard (Mabanda 24)',
    zoneTitleEn: 'Zone A — Prime Corporate & Executive Boulevard (24 Booths)',
    zoneTitleZh: 'A区 — 尊享企业与行政大道 (24 个展位)'
  },
  {
    prefix: 'B',
    codes: makeBoothRange('B', 60),
    zoneTitleSw: 'Zone B — Main SME Commercial Exhibition Hall (Mabanda 60)',
    zoneTitleEn: 'Zone B — Main SME Commercial Exhibition Hall (60 Booths)',
    zoneTitleZh: 'B区 — 主中小型企业综合展馆 (60 个展位)'
  },
  {
    prefix: 'SME',
    codes: makeBoothRange('SME', 48),
    zoneTitleSw: 'Zone SME — Kijana, Kilimo & Startup Innovation Pavilion (Mabanda 48)',
    zoneTitleEn: 'Zone SME — Youth, Agro & Startup Innovation Pavilion (48 Booths)',
    zoneTitleZh: 'SME区 — 青年创业与农业创新馆 (48 个展位)'
  },
  {
    prefix: 'FOOD',
    codes: makeBoothRange('FOOD', 28),
    zoneTitleSw: 'Zone FOOD — Food Court, Kahawa & Lifestyle Arena (Mabanda 28)',
    zoneTitleEn: 'Zone FOOD — Food Court, Coffee & Lifestyle Arena (28 Booths)',
    zoneTitleZh: '美食区 — 餐饮美食、咖啡与生活方式广场 (28 个展位)'
  }
];

const TESTIMONIALS_DATA = [
  {
    initials: 'AM',
    bg: '#0b6b68',
    name: 'Amani Mrema',
    roleSw: 'Kilimanjaro Fresh Agro-Processing • Moshi',
    roleEn: 'Kilimanjaro Fresh Agro-Processing • Moshi',
    roleZh: '乞力马扎罗高山农产加工企业 • 莫希 (Moshi)',
    boothSw: 'Banda #A-04 (Executive Pavilion)',
    boothEn: 'Booth #A-04 (Executive Pavilion)',
    boothZh: '展位 #A-04 (商务行政展厅)',
    badgeSw: 'Mshiriki Aliyethibitishwa',
    badgeEn: 'Verified Exhibitor',
    badgeZh: '官方认证参展商',
    quoteSw: '"Ndani ya siku tatu za maonyesho Mwanza na Arusha, tulipata mawakala 14 wapya wa mikoani na mauzo yetu yaliongezeka kwa 45%!"',
    quoteEn: '"Within three exhibition days in Mwanza and Arusha, we signed 14 regional distributors and boosted factory sales by 45%!"',
    quoteZh: '“在姆万扎和阿鲁沙短短三天展期内，我们签约了14家区域代理商，工厂销售额增长了45%！”'
  },
  {
    initials: 'SM',
    bg: '#08524f',
    name: 'Sarah Mwamba',
    roleSw: 'Mwamba Textile & Fashion • Dar es Salaam',
    roleEn: 'Mwamba Textile & Fashion • Dar es Salaam',
    roleZh: '姆瓦姆巴纺织服饰品牌 • 达累斯萨拉姆',
    boothSw: 'Banda #B-02 (SME Stall)',
    boothEn: 'Booth #B-02 (SME Stall)',
    boothZh: '展位 #B-02 (标准中小企业展位)',
    badgeSw: 'Mshiriki Aliyethibitishwa',
    badgeEn: 'Verified Exhibitor',
    badgeZh: '官方认证参展商',
    quoteSw: '"Mpangilio wa mabanda na minada ya wazi ulikuwa wa kiwango cha juu. Wananchi walifurika na batiki zetu ziliisha zote uwanjani!"',
    quoteEn: '"The booth layouts and open-air auctions were world-class. Crowds poured in and our batik and kitenge stock sold out completely!"',
    quoteZh: '“展位规划与露天拍卖堪称一流。大批采购商涌入现场，我们的蜡染与印花布艺产品全部售罄！”'
  },
  {
    initials: 'DK',
    bg: '#0b6b68',
    name: 'Daniel Kimaro',
    roleSw: 'Victoria Solar & Clean Energy • Mwanza',
    roleEn: 'Victoria Solar & Clean Energy • Mwanza',
    roleZh: '维多利亚清洁能源公司 • 姆万扎',
    boothSw: 'Banda #A-01 (Clean Tech)',
    boothEn: 'Booth #A-01 (Clean Tech)',
    boothZh: '展位 #A-01 (绿色清洁科技展区)',
    badgeSw: 'Mshiriki Aliyethibitishwa',
    badgeEn: 'Verified Exhibitor',
    badgeZh: '官方认证参展商',
    quoteSw: '"Kwenye One-Stop Business Clinic tulikutana na mabenki na taasisi za viwango uwanjani, tukapata mtaji na nembo ya ubora papo hapo."',
    quoteEn: '"At the One-Stop Business Clinic, we met commercial banks and standards bureaus directly on site, securing capital and certification immediately."',
    quoteZh: '“在一站式政企服务大厅，我们现场对接了商业银行与标准局，当场完成了资金授信与产品认证。”'
  },
  {
    initials: 'FA',
    bg: '#08524f',
    name: 'Fatma Ally Khamis',
    roleSw: 'Zanzibar Royal Spices • Zanzibar',
    roleEn: 'Zanzibar Royal Spices • Zanzibar',
    roleZh: '桑给巴尔皇家香料庄园 • 桑给巴尔',
    boothSw: 'Banda #B-08 (Agro & Food)',
    boothEn: 'Booth #B-08 (Agro & Food)',
    boothZh: '展位 #B-08 (特色农产与食品专区)',
    badgeSw: 'Mshiriki Aliyethibitishwa',
    badgeEn: 'Verified Exhibitor',
    badgeZh: '官方认证参展商',
    quoteSw: '"Mzunguko wa mikoani unatuunganisha na wanunuzi wa bara wanaotafuta viungo asilia vya Zanzibar na tumesaini mikataba mikubwa ya jumla."',
    quoteEn: '"The roving regional tour connects us directly with mainland buyers seeking authentic Zanzibar organic spices, yielding major wholesale distribution contracts."',
    quoteZh: '“全国巡回展让我们直接触达内陆正宗有机香料采购商，并成功签署了多项大宗批发分销协议。”'
  },
  {
    initials: 'JT',
    bg: '#0b6b68',
    name: 'Dr. Josephat Temba',
    roleSw: 'Youth Innovation Hub • Dodoma',
    roleEn: 'Youth Innovation Hub • Dodoma',
    roleZh: '青年科技创新孵化中心 • 多多马',
    boothSw: 'Banda #SME-03 (Innovation Hub)',
    boothEn: 'Booth #SME-03 (Innovation Hub)',
    boothZh: '展位 #SME-03 (青年双创馆)',
    badgeSw: 'Mshiriki wa Pitch',
    badgeEn: 'Innovation Pitcher',
    badgeZh: '双创路演代表',
    quoteSw: '"Startup yetu ilifanya pitch kwenye jukwaa la Business Summit mbele ya wawekezaji na tukapata mtaji wa kuanzia pamoja na mradi wa majaribio Dodoma na Morogoro."',
    quoteEn: '"Our startup pitched on the Regional Business Summit stage directly before venture investors, securing seed growth capital and two pilot rollout projects in Dodoma and Morogoro."',
    quoteZh: '“我们的初创项目在区域投资峰会的路演舞台上面向天使投资人精彩展示，不仅成功融到了种子期发展资金，还在多多马与莫罗戈罗落地了两个示范合作项目。”'
  },
  {
    initials: 'RM',
    bg: '#1e293b',
    name: 'Rehema Mushi',
    roleSw: 'Mhudhuriaji & Mnunuzi • Mbeya City',
    roleEn: 'Regional Visitor & Buyer • Mbeya City',
    roleZh: '特邀采购商与市民代表 • 姆贝亚',
    boothSw: 'General Visitor Pass',
    boothEn: 'General Visitor Pass',
    boothZh: '公众特邀采购通行证',
    badgeSw: 'Mhudhuriaji / Visitor',
    badgeEn: 'Fairgrounds Visitor',
    badgeZh: '采购观众',
    quoteSw: '"Nilienda kama mnunuzi tu wa kawaida Mbeya, lakini nilinunua bidhaa nyingi za viwanda vya ndani kwa bei nafuu bila madalali. Mazingira yalikuwa salama na ya kifamilia."',
    quoteEn: '"I attended as a consumer in Mbeya, but was amazed to buy so many high-grade locally manufactured goods at genuine factory prices without middlemen. Safe, vibrant, family-friendly atmosphere."',
    quoteZh: '“我本来只是抱着逛逛的心态来到姆贝亚博览会，结果以极低的出厂直销价采购了大量高品质本土日用品，省去了所有中间商环节！展会安全、热闹且体验极佳。”'
  }
];

function renderTestimonials() {
  const container = document.getElementById('home-testimonials-grid');
  if (!container) return;

  const lang = appState.lang || 'en';
  const fourTestimonials = TESTIMONIALS_DATA.slice(0, 4);

  container.innerHTML = fourTestimonials.map(t => {
    let quote = t.quoteSw;
    let role = t.roleSw;
    let badge = t.badgeSw;
    if (lang === 'en') {
      quote = t.quoteEn;
      role = t.roleEn;
      badge = t.badgeEn;
    } else if (lang === 'zh') {
      quote = t.quoteZh;
      role = t.roleZh;
      badge = t.badgeZh;
    }

    const cleanBadge = escapeBookingHtml(badge.replace('✓', '').trim());
    const safeQuote = escapeBookingHtml(quote || '');
    const safeInitials = escapeBookingHtml(t.initials || '');
    const safeName = escapeBookingHtml(t.name || '');
    const safeRole = escapeBookingHtml(role || '');
    const safeBg = /^#[a-zA-Z0-9]{3,6}$/.test(t.bg) ? t.bg : '#0b6b68';

    return `
      <div class="border-l-2 border-[#0b6b68]/30 hover:border-[#0b6b68] pl-4 py-1 flex flex-col justify-between transition-all duration-300 group select-none">
        <div>
          <!-- Modern SVG quote icon + sleek minimalist verified tag (Form-less & Compact) -->
          <div class="flex items-center justify-between mb-2">
            <svg class="w-4 h-4 text-[#0b6b68]/40 group-hover:text-[#0b6b68] transition-colors shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <span class="inline-flex items-center gap-1 text-[10px] font-bold text-[#0b6b68] uppercase tracking-wider">
              <svg class="w-3.5 h-3.5 text-[#0b6b68] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
              <span>${cleanBadge}</span>
            </span>
          </div>

          <!-- Full, readable quote text without mid-word truncation -->
          <p class="text-xs text-slate-600 leading-relaxed mb-4 font-normal">
            ${safeQuote}
          </p>
        </div>

        <!-- Compact modern author row -->
        <div class="pt-2 border-t border-slate-200/70 flex items-center gap-2.5 mt-auto">
          <div class="w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-[10px] shrink-0" style="background-color: ${safeBg};">
            ${safeInitials}
          </div>
          <div class="min-w-0">
            <div class="text-[11px] font-extrabold text-slate-900 uppercase truncate group-hover:text-[#0b6b68] transition-colors">${safeName}</div>
            <div class="text-[10px] text-slate-500 font-medium truncate">${safeRole}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

let heroSlideTimer = null;
let cardPhotoTimer = null;

function renderHeroSlide() {
  const activeIdx = appState.heroSlideIndex % HERO_BUSINESS_SLIDES.length;
  const slide = HERO_BUSINESS_SLIDES[activeIdx];
  const isEn = appState.lang === 'en';

  const bgSlides = document.querySelectorAll('.hero-bg-slide');
  if (bgSlides.length) {
    bgSlides.forEach((img, idx) => {
      if (idx === activeIdx) {
        img.classList.remove('opacity-0');
        img.classList.add('opacity-100');
      } else {
        img.classList.remove('opacity-100');
        img.classList.add('opacity-0');
      }
    });
  }

  const headEl = document.getElementById('hero-slide-heading');
  const subEl = document.getElementById('hero-slide-sub');
  const dotsEl = document.getElementById('hero-slide-dots');

  // Strip all animation classes first
  const animClasses = [
    'anim-hero-zoom',
    'anim-hero-split-left',
    'anim-hero-split-right',
    'anim-hero-drop',
    'anim-hero-rise',
    'anim-hero-blur'
  ];
  if (headEl) headEl.classList.remove(...animClasses);
  if (subEl) subEl.classList.remove(...animClasses);

  const lang = appState.lang || 'en';
  let titleText = slide.titleSw;
  let subText = slide.subSw;

  if (lang === 'en') {
    titleText = slide.titleEn;
    subText = slide.subEn;
  } else if (lang === 'zh') {
    titleText = slide.titleZh || slide.titleEn;
    subText = slide.subZh || slide.subEn;
  }

  if (headEl) headEl.textContent = titleText;
  if (subEl) subEl.textContent = subText;

  // Force DOM reflow to re-trigger CSS animations cleanly on each slide transition
  if (headEl) void headEl.offsetWidth;

  // Apply distinct, non-repeating entrance animation design per slide
  if (slide.animType === 'zoom') {
    if (headEl) headEl.classList.add('anim-hero-zoom');
    if (subEl) subEl.classList.add('anim-hero-zoom');
  } else if (slide.animType === 'split') {
    if (headEl) headEl.classList.add('anim-hero-split-left');
    if (subEl) subEl.classList.add('anim-hero-split-right');
  } else if (slide.animType === 'drop') {
    if (headEl) headEl.classList.add('anim-hero-drop');
    if (subEl) subEl.classList.add('anim-hero-rise');
  } else if (slide.animType === 'rise') {
    if (headEl) headEl.classList.add('anim-hero-rise');
    if (subEl) subEl.classList.add('anim-hero-rise');
  } else if (slide.animType === 'blur') {
    if (headEl) headEl.classList.add('anim-hero-blur');
    if (subEl) subEl.classList.add('anim-hero-blur');
  }

  if (dotsEl) {
    dotsEl.innerHTML = HERO_BUSINESS_SLIDES.map((_, idx) => {
      const active = idx === activeIdx;
      return `
        <button
          onclick="goToHeroSlide(${idx})"
          class="h-2.5 rounded-full transition-all ${active ? 'w-8 bg-white shadow' : 'w-2.5 bg-white/50 hover:bg-white'}"
          aria-label="Slide ${idx + 1}"
        ></button>
      `;
    }).join('');
  }
}

function nextHeroSlide() {
  appState.heroSlideIndex = (appState.heroSlideIndex + 1) % HERO_BUSINESS_SLIDES.length;
  renderHeroSlide();
}

function prevHeroSlide() {
  appState.heroSlideIndex = (appState.heroSlideIndex - 1 + HERO_BUSINESS_SLIDES.length) % HERO_BUSINESS_SLIDES.length;
  renderHeroSlide();
}

function goToHeroSlide(idx) {
  appState.heroSlideIndex = idx;
  renderHeroSlide();
  resetHeroSlideTimer();
}

function resetHeroSlideTimer() {
  if (heroSlideTimer) clearInterval(heroSlideTimer);
  heroSlideTimer = setInterval(() => {
    nextHeroSlide();
  }, 3500);
}

function startCardPhotosAutoCycle() {
  if (cardPhotoTimer) clearInterval(cardPhotoTimer);
  cardPhotoTimer = setInterval(() => {
    appState.cardImageTick += 1;
    document.querySelectorAll('[data-biz-images]').forEach(img => {
      const list = (img.getAttribute('data-biz-images') || '').split('|').filter(Boolean);
      if (list.length > 1) {
        const cardIdx = Number(img.getAttribute('data-card-idx') || 0);
        const nextUrl = list[(appState.cardImageTick + cardIdx) % list.length];
        img.style.opacity = '0.45';
        setTimeout(() => {
          img.src = nextUrl;
          img.style.opacity = '1';
        }, 160);
      }
    });
  }, 4500);
}

// ==========================================
// COOKIE HELPERS & VISITOR ANALYTICS
// ==========================================
function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const match = document.cookie.split('; ').find(row => row.startsWith(name + '='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

async function initCookieTracking() {
  let visitorId = getCookie('tbf_visitor_id');
  const consent = getCookie('tbf_cookie_consent');
  const savedLang = getCookie('tbf_lang');
  const savedRegion = getCookie('tbf_region');

  if (savedLang === 'en' || savedLang === 'sw' || savedLang === 'zh') {
    appState.lang = savedLang;
  }
  if (savedRegion) {
    appState.activeRegionId = savedRegion;
  }

  let isNewVisitor = false;
  if (!visitorId) {
    visitorId = 'tbf_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    setCookie('tbf_visitor_id', visitorId, 365);
    isNewVisitor = true;
  }

  if (!window.__tbfCookieBannerDismissed) {
    document.getElementById('cookie-consent-banner')?.classList.remove('hidden');
  }

  await pingVisitorServer(visitorId, isNewVisitor, appState.activeRegionId);
}

async function pingVisitorServer(visitorId, isNewVisitor, regionId) {
  try {
    const res = await fetch('/api/visitor-ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        isNewVisitor,
        regionId,
        cookieConsent: getCookie('tbf_cookie_consent') || 'active'
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.liveStats) appState.liveStats = data.liveStats;
      if (data.regions) appState.regions = data.regions;
      renderLiveStatsBanner();
      renderRegionsExplorer();
    }
  } catch (e) {
    // Offline fallback
  }
}

function acceptCookies(mode = 'all') {
  window.__tbfCookieBannerDismissed = true;
  setCookie('tbf_cookie_consent', mode, 365);
  document.getElementById('cookie-consent-banner')?.classList.add('hidden');
  closeCookieSettingsModal();
  const vid = getCookie('tbf_visitor_id');
  pingVisitorServer(vid, false, appState.activeRegionId);
}

function openCookieSettingsModal() {
  const modal = document.getElementById('cookie-preferences-modal');
  if (!modal) return;
  const consent = getCookie('tbf_cookie_consent') || 'all';
  const prefToggle = document.getElementById('cookie-toggle-pref');
  const analyticsToggle = document.getElementById('cookie-toggle-analytics');
  if (prefToggle) prefToggle.checked = consent === 'all' || consent.includes('pref');
  if (analyticsToggle) analyticsToggle.checked = consent === 'all' || consent.includes('analytics');
  modal.classList.remove('hidden');
}

function closeCookieSettingsModal() {
  document.getElementById('cookie-preferences-modal')?.classList.add('hidden');
}

function saveCustomCookiePreferences() {
  const prefToggle = document.getElementById('cookie-toggle-pref');
  const analyticsToggle = document.getElementById('cookie-toggle-analytics');
  const allowsPref = prefToggle ? prefToggle.checked : true;
  const allowsAnalytics = analyticsToggle ? analyticsToggle.checked : true;

  let mode = 'essential';
  if (allowsPref && allowsAnalytics) {
    mode = 'all';
  } else if (allowsPref) {
    mode = 'pref';
  } else if (allowsAnalytics) {
    mode = 'analytics';
  }

  acceptCookies(mode);
}

// ==========================================
// LANGUAGE SWITCHER & DROPDOWN (SW / EN / ZH)
// ==========================================
function toggleLanguageDropdown(e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  const menu = document.getElementById('lang-dropdown-menu');
  const caret = document.getElementById('lang-caret');
  const btn = document.getElementById('lang-dropdown-btn');
  if (!menu) return;
  const isHidden = menu.classList.contains('hidden');
  if (isHidden) {
    menu.classList.remove('hidden');
    if (caret) caret.style.transform = 'rotate(180deg)';
    if (btn) btn.setAttribute('aria-expanded', 'true');
  } else {
    menu.classList.add('hidden');
    if (caret) caret.style.transform = 'rotate(0deg)';
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }
}

function selectLanguage(lang) {
  const menu = document.getElementById('lang-dropdown-menu');
  const caret = document.getElementById('lang-caret');
  const btn = document.getElementById('lang-dropdown-btn');
  if (menu) menu.classList.add('hidden');
  if (caret) caret.style.transform = 'rotate(0deg)';
  if (btn) btn.setAttribute('aria-expanded', 'false');
  setLanguage(lang);
}

// Close language dropdown if user clicks anywhere outside
document.addEventListener('click', (e) => {
  const wrapper = document.getElementById('lang-dropdown-wrapper');
  const menu = document.getElementById('lang-dropdown-menu');
  const caret = document.getElementById('lang-caret');
  const btn = document.getElementById('lang-dropdown-btn');
  if (wrapper && menu && !wrapper.contains(e.target)) {
    menu.classList.add('hidden');
    if (caret) caret.style.transform = 'rotate(0deg)';
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }
  const spWrap = document.getElementById('sp-region-dropdown-wrap');
  if (spWrap && !spWrap.contains(e.target) && typeof closeSponsorRegionDropdown === 'function') {
    closeSponsorRegionDropdown();
  }
  const newsWrap = document.getElementById('news-dropdown-wrapper');
  const newsMenu = document.getElementById('news-dropdown-menu');
  if (newsWrap && newsMenu && !newsWrap.contains(e.target)) {
    newsMenu.classList.add('hidden');
  }
});

function toggleNewsDropdown(e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  const menu = document.getElementById('news-dropdown-menu');
  const btn = document.getElementById('nav-events');
  if (!menu) return;
  const willOpen = menu.classList.contains('hidden');
  menu.classList.toggle('hidden', !willOpen);
  if (btn) btn.setAttribute('aria-expanded', String(willOpen));
}

function selectNewsSub(subKey) {
  const menu = document.getElementById('news-dropdown-menu');
  const btn = document.getElementById('nav-events');
  if (menu) menu.classList.add('hidden');
  if (btn) btn.setAttribute('aria-expanded', 'false');
  switchSection('events');
  filterUpdates(subKey || 'ALL');
}

window.toggleNewsDropdown = toggleNewsDropdown;
window.selectNewsSub = selectNewsSub;

function setLanguage(lang) {
  if (lang !== 'sw' && lang !== 'en' && lang !== 'zh') {
    lang = 'en';
  }
  appState.lang = lang;
  document.documentElement.lang = lang;
  setCookie('tbf_lang', lang, 365);

  // Update dropdown button text & active check indicators
  const labelEl = document.getElementById('lang-current-label');
  const checkSw = document.getElementById('lang-check-sw');
  const checkEn = document.getElementById('lang-check-en');
  const checkZh = document.getElementById('lang-check-zh');
  const optSw = document.getElementById('lang-opt-sw');
  const optEn = document.getElementById('lang-opt-en');
  const optZh = document.getElementById('lang-opt-zh');

  if (labelEl) {
    labelEl.textContent = lang.toUpperCase();
  }
  const labelMobileEl = document.getElementById('lang-current-label-mobile');
  if (labelMobileEl) {
    labelMobileEl.textContent = lang.toUpperCase();
  }

  if (checkSw) checkSw.classList.toggle('hidden', lang !== 'sw');
  if (checkEn) checkEn.classList.toggle('hidden', lang !== 'en');
  if (checkZh) checkZh.classList.toggle('hidden', lang !== 'zh');

  if (optSw) optSw.className = `w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between transition cursor-pointer ${lang === 'sw' ? 'bg-[#f0f7ff] text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'}`;
  if (optEn) optEn.className = `w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between transition cursor-pointer ${lang === 'en' ? 'bg-[#f0f7ff] text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'}`;
  if (optZh) optZh.className = `w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between transition cursor-pointer ${lang === 'zh' ? 'bg-[#f0f7ff] text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'}`;

  const dict = I18N[lang] || I18N.en;

  // Translate standard textContent
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // Translate HTML content (where links or formatting exist)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  // Translate input placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });

  renderAll();
  const receiptSec = document.getElementById('sec-receipt');
  if (receiptSec && !receiptSec.classList.contains('hidden') && appState.lastConfirmedBooking) {
    renderDedicatedReceiptPage(appState.lastConfirmedBooking, appState.lastConfirmedPin || '');
  }
}

function formatTZS(num) {
  return 'TZS ' + Number(num || 0).toLocaleString('en-US');
}

function toggleMobileMenu() {
  const drawer = document.getElementById('mobile-drawer');
  if (!drawer) return;
  drawer.classList.toggle('hidden');
}
window.toggleMobileMenu = toggleMobileMenu;

function switchSection(secId) {
  const drawer = document.getElementById('mobile-drawer');
  if (drawer && !drawer.classList.contains('hidden')) {
    drawer.classList.add('hidden');
  }

  let targetSec = secId;
  if (targetSec === 'admin' && !appState.isAdminAuthenticated) {
    targetSec = 'login';
  } else if (targetSec === 'login' && appState.isAdminAuthenticated) {
    targetSec = 'admin';
  }

  const sections = ['home', 'about', 'booking', 'sponsors', 'events', 'contacts', 'newsletter', 'receipt', 'login', 'admin'];
  sections.forEach(id => {
    const el = document.getElementById('sec-' + id);
    if (el) el.classList.add('hidden');
    const nav = document.getElementById('nav-' + id);
    if (nav) {
      nav.className = 'px-2 sm:px-2.5 lg:px-3 h-full text-xs font-extrabold tracking-wider border-r border-white/20 text-white hover:bg-[#08524f] transition flex items-center whitespace-nowrap uppercase';
    }
  });

  const target = document.getElementById('sec-' + targetSec);
  if (target) target.classList.remove('hidden');

  const navId = targetSec === 'admin' ? 'login' : (targetSec === 'events' ? 'news-dropdown' : (targetSec === 'newsletter' ? 'home' : (targetSec === 'receipt' ? 'booking' : targetSec)));
  const activeNav = document.getElementById('nav-' + navId);
  if (activeNav) {
    activeNav.className = 'px-2 sm:px-2.5 lg:px-3 h-full text-xs font-extrabold tracking-wider border-r border-white/20 bg-[#08524f] text-white transition flex items-center whitespace-nowrap uppercase';
  }

  if (history.replaceState) {
    history.replaceState(null, '', '#' + targetSec);
  }
  if (targetSec === 'receipt') {
    if (!appState.lastConfirmedBooking && typeof restoreLastReceiptFromSession === 'function') {
      restoreLastReceiptFromSession();
    }
    if (appState.lastConfirmedBooking && typeof renderDedicatedReceiptPage === 'function') {
      renderDedicatedReceiptPage(appState.lastConfirmedBooking, appState.lastConfirmedPin || '');
    } else if (!appState.lastConfirmedBooking) {
      targetSec = 'booking';
      if (target) target.classList.add('hidden');
      const bkEl = document.getElementById('sec-booking');
      if (bkEl) bkEl.classList.remove('hidden');
    }
  }
  if (targetSec === 'booking' && typeof renderBookingGateState === 'function') {
    renderBookingGateState();
  }
  if (targetSec === 'admin' && appState.isAdminAuthenticated) {
    loadAdminOverview();
  }
  if (targetSec === 'home') {
    renderLiveStatsBanner(true);
    if (typeof updateRegionalSliderPosition === 'function') updateRegionalSliderPosition();
    if (typeof startRegionalAutoSlide === 'function') startRegionalAutoSlide();
  } else {
    if (typeof stopRegionalAutoSlide === 'function') stopRegionalAutoSlide();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.switchSection = switchSection;

function handleContactSubmit() {
  const name = document.getElementById('contact-form-name')?.value.trim();
  const phone = document.getElementById('contact-form-phone')?.value.trim();
  const email = document.getElementById('contact-form-email')?.value.trim();
  const type = document.getElementById('contact-form-type')?.value;
  const msg = document.getElementById('contact-form-msg')?.value.trim();

  if (!name || !phone) {
    alert(appState.lang === 'sw' ? 'Tafadhali weka Jina Lako na Namba ya Simu.' : 'Please enter your Full Name and Phone Number.');
    return;
  }

  const feedback = document.getElementById('contact-form-feedback');
  if (feedback) {
    feedback.classList.remove('hidden');
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Reset inputs
  if (document.getElementById('contact-form-name')) document.getElementById('contact-form-name').value = '';
  if (document.getElementById('contact-form-phone')) document.getElementById('contact-form-phone').value = '';
  if (document.getElementById('contact-form-email')) document.getElementById('contact-form-email').value = '';
  if (document.getElementById('contact-form-msg')) document.getElementById('contact-form-msg').value = '';
}

function renderAdminUIState() {
  const eventsPublisher = document.getElementById('events-admin-publisher');
  if (eventsPublisher) {
    eventsPublisher.classList.toggle('hidden', !appState.isAdminAuthenticated);
  }
}

async function checkAdminSession() {
  try {
    const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      appState.isAdminAuthenticated = Boolean(data.authenticated);
      appState.adminUser = data.user || null;
      renderAdminUIState();
      if (appState.isAdminAuthenticated) {
        await loadAdminOverview();
      }
      return;
    }
  } catch (err) {
    // Offline fallback stays unauthenticated
  }
  appState.isAdminAuthenticated = false;
  appState.adminUser = null;
  renderAdminUIState();
}

async function loadAdminOverview() {
  if (!appState.isAdminAuthenticated) return;
  try {
    const res = await fetch('/api/admin/overview', { credentials: 'same-origin' });
    if (res.status === 401) {
      appState.isAdminAuthenticated = false;
      appState.adminUser = null;
      appState.adminOverview = null;
      renderAdminUIState();
      return;
    }
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        appState.adminOverview = data;
        if (data.liveStats) appState.liveStats = data.liveStats;
        renderAdminDashboard();
      }
    }
  } catch (err) {
    // Ignore transient fetch errors
  }
}

async function updateAdminBookingStatus(bookingId, status) {
  if (!appState.isAdminAuthenticated || !bookingId) return;
  try {
    const res = await fetch('/api/admin/bookings/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ bookingId, status })
    });
    if (res.status === 401) {
      appState.isAdminAuthenticated = false;
      renderAdminUIState();
      switchSection('login');
      return;
    }
    if (res.ok) {
      await loadAdminOverview();
      const refreshRes = await fetch('/api/data');
      if (refreshRes.ok) {
        const publicData = await refreshRes.json();
        appState.regions = publicData.regions || appState.regions;
        appState.bookings = publicData.bookings || appState.bookings;
        appState.activeHolds = publicData.activeHolds || [];
        renderAll();
      }
    }
  } catch (err) {
    // Ignore transient network errors
  }
}

async function handleSystemLogin(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  const identifier = (document.getElementById('login-identifier')?.value || '').trim();
  const password = document.getElementById('login-password')?.value || '';
  const errBox = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit-btn');

  const dict = I18N[appState.lang] || I18N.en;
  if (errBox) errBox.classList.add('hidden');
  if (!identifier || !password) {
    if (errBox) {
      errBox.textContent = dict.loginMissingErr || 'Weka barua pepe na nenosiri la msimamizi.';
      errBox.classList.remove('hidden');
    }
    return;
  }

  if (submitBtn) submitBtn.disabled = true;
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (errBox) {
        errBox.textContent = (appState.lang === 'sw' && data.error) ? data.error : (dict.loginInvalidErr || data.error || 'Taarifa za kuingia si sahihi.');
        errBox.classList.remove('hidden');
      }
      return;
    }
    appState.isAdminAuthenticated = true;
    appState.adminUser = data.user || { identifier, role: 'admin' };
    const passEl = document.getElementById('login-password');
    if (passEl) passEl.value = '';
    renderAdminUIState();
    await loadAdminOverview();
    switchSection('admin');
  } catch (err) {
    if (errBox) {
      errBox.textContent = dict.loginNetworkErr || 'Hitilafu ya mtandao wakati wa kuingia. Jaribu tena.';
      errBox.classList.remove('hidden');
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function handleAdminLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } catch (err) {
    // Clear local state regardless
  }
    appState.isAdminAuthenticated = false;
  appState.adminUser = null;
  appState.adminOverview = null;
  renderAdminUIState();
  renderAdminDashboard();
  switchSection('login');
}

function startExhibitorRegistration() {
  switchSection('booking');
  setTimeout(() => {
    const stepTarget = appState.selectedBoothCode ? 2 : 1;
    appState.bookingStep = stepTarget;
    if (typeof renderBookingWizardState === 'function') renderBookingWizardState();
    const elId = stepTarget === 2 ? 'form-email' : 'booking-wizard-step-1';
    const el = document.getElementById(elId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (stepTarget === 2 && typeof el.focus === 'function') el.focus();
    }
  }, 150);
}

function clearExhibitorLoginSession() {
  appState.activeLookupContext = null;
  const box = document.getElementById('exhibitor-login-result');
  if (box) {
    box.innerHTML = '';
    box.classList.add('hidden');
  }
  const pinEl = document.getElementById('exhibitor-login-pin');
  if (pinEl) pinEl.value = '';
}

async function handleExhibitorLogin(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  const msg = BOOKING_MSG[appState.lang] || BOOKING_MSG.en;
  const email = (document.getElementById('exhibitor-login-email')?.value || '').trim().toLowerCase();
  const ref = (document.getElementById('exhibitor-login-ref')?.value || '').trim();
  const rawSecret = document.getElementById('exhibitor-login-pin')?.value || '';
  const errBox = document.getElementById('exhibitor-login-error');
  const resBox = document.getElementById('exhibitor-login-result');
  const submitBtn = document.getElementById('exhibitor-login-btn');

  if (errBox) {
    errBox.textContent = '';
    errBox.classList.add('hidden');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    if (errBox) {
      errBox.textContent = msg.regEmailInvalid;
      errBox.classList.remove('hidden');
    }
    return;
  }
  if (!ref && !rawSecret) {
    if (errBox) {
      errBox.textContent = msg.exLoginMissingRefOrPin;
      errBox.classList.remove('hidden');
    }
    return;
  }

  if (submitBtn) submitBtn.disabled = true;
  if (resBox) {
    resBox.classList.remove('hidden');
    resBox.innerHTML = `<div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold">${escapeBookingHtml(msg.lookupSearching)}</div>`;
  }

  try {
    const res = await fetchWithRetry('/api/auth/unified-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, ref, secret: rawSecret })
    }, { retries: 2, timeoutMs: 10000 });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (resBox) resBox.classList.add('hidden');
      if (errBox) {
        errBox.textContent = data.error || msg.exLoginNotFound;
        errBox.classList.remove('hidden');
      }
      return;
    }

    const secretInput = document.getElementById('exhibitor-login-pin');
    if (data.role === 'admin') {
      if (resBox) {
        resBox.innerHTML = '';
        resBox.classList.add('hidden');
      }
      if (secretInput) secretInput.value = '';
      appState.isAdminAuthenticated = true;
      appState.adminUser = data.user || { identifier: email, role: 'admin' };
      renderAdminUIState();
      await loadAdminOverview();
      switchSection('admin');
      return;
    }

    if (!data.booking) {
      if (resBox) resBox.classList.add('hidden');
      return;
    }

    appState.activeLookupContext = {
      ref: data.booking.id || ref,
      email,
      phone: '',
      pin: rawSecret.trim(),
      manageToken: data.booking.manageToken || data.manageToken || '',
      booking: data.booking,
      rawResponse: data,
      targetBoxId: 'exhibitor-login-result'
    };
    renderLookupResultCard(data.booking, data, '', '', 'exhibitor-login-result');
  } catch (err) {
    if (resBox) resBox.classList.add('hidden');
    if (errBox) {
      errBox.textContent = msg.lookupError;
      errBox.classList.remove('hidden');
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function refreshActiveLookupBooking() {
  const ctx = appState.activeLookupContext;
  if (!ctx) return lookupGuestBooking();
  if (ctx.targetBoxId === 'exhibitor-login-result' || (ctx.email && !ctx.phone)) {
    const msg = BOOKING_MSG[appState.lang] || BOOKING_MSG.en;
    try {
      const res = await fetchWithRetry('/api/bookings/email-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: ctx.email, ref: ctx.ref, pin: ctx.pin || '' })
      }, { retries: 2, timeoutMs: 10000 });
      const data = await res.json();
      if (res.ok && data.success && data.booking) {
        appState.activeLookupContext.booking = data.booking;
        appState.activeLookupContext.manageToken = data.booking.manageToken || ctx.manageToken || '';
        appState.activeLookupContext.rawResponse = data;
        const notice = isBookingPaidStatus(data.booking.status) ? msg.paymentUnlockedMsg : msg.paymentStillPendingMsg;
        renderLookupResultCard(data.booking, data, notice, '', ctx.targetBoxId || 'exhibitor-login-result');
      }
    } catch (err) {
      renderLookupResultCard(ctx.booking, ctx.rawResponse || {}, '', msg.lookupError, ctx.targetBoxId || 'exhibitor-login-result');
    }
    return;
  }
  return lookupGuestBooking();
}

window.startExhibitorRegistration = startExhibitorRegistration;
window.handleExhibitorLogin = handleExhibitorLogin;
window.clearExhibitorLoginSession = clearExhibitorLoginSession;
window.refreshActiveLookupBooking = refreshActiveLookupBooking;

const DATA_CACHE_KEY = 'tbf_api_cache_v1';

async function fetchWithRetry(url, fetchOpts = {}, retryCfg = {}) {
  const { retries = 2, timeoutMs = 12000, backoffMs = 700 } = retryCfg;
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...fetchOpts,
        signal: controller.signal
      });
      clearTimeout(timer);
      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < retries) {
        await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
        continue;
      }
      updateNetworkStatusBanner(false);
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < retries && navigator.onLine !== false) {
        await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
        continue;
      }
    }
  }
  updateNetworkStatusBanner(true);
  throw lastErr || new Error('Network error');
}

function updateNetworkStatusBanner(isDegraded) {
  const banner = document.getElementById('network-status-banner');
  if (!banner) return;
  const offline = navigator.onLine === false;
  if (!offline && !isDegraded) {
    banner.classList.add('hidden');
    banner.innerHTML = '';
    return;
  }
  const msg = (typeof BOOKING_MSG !== 'undefined' && (BOOKING_MSG[appState.lang] || BOOKING_MSG.en)) || {};
  const text = offline
    ? (msg.offlineNotice || 'You appear to be offline — cached festival details are shown.')
    : (msg.holdNetworkWarn || 'Slow internet connection detected — you can retry safely.');
  const retryText = msg.syncNowBtn || 'Retry';
  banner.innerHTML = `
    <span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span><span>${escapeBookingHtml(text)}</span></span>
    <button type="button" onclick="syncFestivalData()" class="px-3 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold text-xs cursor-pointer">${escapeBookingHtml(retryText)}</button>
  `;
  banner.classList.remove('hidden');
}

function applyFestivalDataPayload(data) {
  if (!data || typeof data !== 'object') return;
  appState.regions = data.regions || [];
  appState.boothPackages = data.boothPackages || [];
  appState.bookings = data.bookings || [];
  appState.activeHolds = data.activeHolds || [];
  appState.sponsors = data.sponsors || [];
  appState.announcements = data.announcements || [];
  if (data.liveStats) appState.liveStats = data.liveStats;
  if (data.destination) appState.destination = data.destination;
  syncBookingCitiesFromDestination();
}

function generateTbfQrSvg(text, pixelSize = 140) {
  if (typeof window.qrcode !== 'function') {
    return '<span class="font-mono text-[10px] font-extrabold text-[#0b6b68]">[QR]</span>';
  }
  try {
    const qr = window.qrcode(0, 'M');
    qr.addData(String(text || 'TBF'), 'Byte');
    qr.make();
    const rawSvg = qr.createSvgTag(4, 2);
    return rawSvg.replace(
      '<svg ',
      `<svg style="width:${pixelSize}px;height:${pixelSize}px;display:block;max-width:100%;height:auto;" `
    );
  } catch (err) {
    return '<span class="font-mono text-[10px] font-extrabold text-[#0b6b68]">[QR]</span>';
  }
}

async function syncFestivalData() {
  try {
    const res = await fetchWithRetry('/api/data', { cache: 'no-store' }, { retries: 2, timeoutMs: 10000 });
    if (res.ok) {
      const data = await res.json();
      applyFestivalDataPayload(data);
      try {
        localStorage.setItem(DATA_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
      } catch (e) {
        // Ignore storage quota
      }
      renderAll();
      return true;
    }
  } catch (err) {
    debugLog('Background sync skipped due to low/offline network:', err?.message || err);
  }
  return false;
}

window.addEventListener('online', () => {
  updateNetworkStatusBanner(false);
  syncFestivalData();
});
window.addEventListener('offline', () => updateNetworkStatusBanner(true));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

async function loadFestivalData() {
  // Start Hero Slider immediately before any network calls
  renderHeroSlide();
  resetHeroSlideTimer();

  // Instant first paint from cached snapshot for low-internet (2G/3G) users
  try {
    const cachedRaw = localStorage.getItem(DATA_CACHE_KEY);
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw);
      if (parsed?.data) {
        applyFestivalDataPayload(parsed.data);
        setLanguage(appState.lang);
      }
    }
  } catch (e) {
    // Ignore corrupt cache
  }

  try {
    const res = await fetchWithRetry('/api/data', { cache: 'no-store' }, { retries: 2, timeoutMs: 10000 });
    if (res.ok) {
      const data = await res.json();
      applyFestivalDataPayload(data);
      try {
        localStorage.setItem(DATA_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
      } catch (e) {
        // Ignore quota error
      }
    }
  } catch (err) {
    debugLog('Using fallback/cached state:', err);
  }
  await initCookieTracking();
  await checkAdminSession();
  setLanguage(appState.lang);
  initExhibitorSession();
  initHoldSession();

  const rawHash = window.location.hash.replace('#', '').replace('sec-', '').trim();
  const validSections = ['home', 'about', 'booking', 'sponsors', 'events', 'contacts', 'receipt', 'login', 'admin'];
  if (validSections.includes(rawHash)) {
    switchSection(rawHash);
  } else {
    switchSection('home');
  }
  setupStatsObserver();
}

window.addEventListener('hashchange', () => {
  const rawHash = window.location.hash.replace('#', '').replace('sec-', '').trim();
  const validSections = ['home', 'about', 'booking', 'sponsors', 'events', 'contacts', 'receipt', 'login', 'admin'];
  if (validSections.includes(rawHash)) {
    switchSection(rawHash);
  }
});

const MONTH_MAP = {
  januari: { en: 'January', zh: '1月', num: 1 },
  january: { en: 'January', zh: '1月', num: 1 },
  februari: { en: 'February', zh: '2月', num: 2 },
  february: { en: 'February', zh: '2月', num: 2 },
  machi: { en: 'March', zh: '3月', num: 3 },
  march: { en: 'March', zh: '3月', num: 3 },
  aprili: { en: 'April', zh: '4月', num: 4 },
  april: { en: 'April', zh: '4月', num: 4 },
  mei: { en: 'May', zh: '5月', num: 5 },
  may: { en: 'May', zh: '5月', num: 5 },
  juni: { en: 'June', zh: '6月', num: 6 },
  june: { en: 'June', zh: '6月', num: 6 },
  julai: { en: 'July', zh: '7月', num: 7 },
  july: { en: 'July', zh: '7月', num: 7 },
  agosti: { en: 'August', zh: '8月', num: 8 },
  august: { en: 'August', zh: '8月', num: 8 },
  septemba: { en: 'September', zh: '9月', num: 9 },
  september: { en: 'September', zh: '9月', num: 9 },
  oktoba: { en: 'October', zh: '10月', num: 10 },
  october: { en: 'October', zh: '10月', num: 10 },
  novemba: { en: 'November', zh: '11月', num: 11 },
  november: { en: 'November', zh: '11月', num: 11 },
  desemba: { en: 'December', zh: '12月', num: 12 },
  december: { en: 'December', zh: '12月', num: 12 }
};

function translateEventDate(dateStr, lang) {
  const raw = String(dateStr || '').trim();
  if (!raw || lang === 'sw') return raw;

  const cleaned = raw.replace(/^Tarehe\s+/i, '').trim();
  const rangeMatch = cleaned.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (rangeMatch) {
    const [, d1, d2, monthWord, year] = rangeMatch;
    const mInfo = MONTH_MAP[monthWord.toLowerCase()];
    if (mInfo) {
      if (lang === 'zh') return `${year}年${mInfo.zh}${d1}日 - ${d2}日`;
      return `${mInfo.en} ${d1} - ${d2}, ${year}`;
    }
  }

  const singleMatch = cleaned.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/) || cleaned.match(/^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})$/);
  if (singleMatch) {
    const isMonthFirst = isNaN(Number(singleMatch[1]));
    const monthWord = isMonthFirst ? singleMatch[1] : singleMatch[2];
    const day = isMonthFirst ? singleMatch[2] : singleMatch[1];
    const year = singleMatch[3];
    const mInfo = MONTH_MAP[monthWord.toLowerCase()];
    if (mInfo) {
      if (lang === 'zh') return `${year}年${mInfo.zh}${day}日`;
      return `${mInfo.en} ${day}, ${year}`;
    }
  }

  let out = cleaned;
  Object.keys(MONTH_MAP).forEach(k => {
    const re = new RegExp(`\\b${k}\\b`, 'gi');
    out = out.replace(re, lang === 'zh' ? MONTH_MAP[k].zh : MONTH_MAP[k].en);
  });
  return out;
}

const SECTOR_KEY_MAP = [
  { match: 'kilimo', key: 'optSectorAgri' },
  { match: 'agribusiness', key: 'optSectorAgri' },
  { match: 'viwanda', key: 'optSectorMfg' },
  { match: 'manufacturing', key: 'optSectorMfg' },
  { match: 'fmcg', key: 'optSectorMfg' },
  { match: 'teknolojia', key: 'optSectorTech' },
  { match: 'technology', key: 'optSectorTech' },
  { match: 'startup', key: 'optSectorTech' },
  { match: 'madini', key: 'optSectorMining' },
  { match: 'mining', key: 'optSectorMining' },
  { match: 'fedha', key: 'optSectorFinance' },
  { match: 'finance', key: 'optSectorFinance' },
  { match: 'banking', key: 'optSectorFinance' },
  { match: 'fintech', key: 'optSectorFinance' },
  { match: 'utalii', key: 'optSectorTourism' },
  { match: 'tourism', key: 'optSectorTourism' },
  { match: 'huduma za chakula', key: 'optSectorFood' },
  { match: 'food court', key: 'optSectorFood' },
  { match: 'catering', key: 'optSectorFood' }
];

function localizeSectorLabel(rawSector, lang) {
  const dict = I18N[lang] || I18N.en;
  const raw = String(rawSector || '').trim();
  if (!raw) return lang === 'zh' ? '商贸与投资' : (lang === 'en' ? 'Trade & Investment' : 'Biashara & Uwekezaji');
  const lower = raw.toLowerCase();
  const found = SECTOR_KEY_MAP.find(item => lower.includes(item.match));
  if (found && dict[found.key]) {
    return dict[found.key];
  }
  return raw;
}

function getLocalizedDestinationInfo(dest, lang) {
  const fallback = {
    regionName: 'Mwanza',
    venue: 'Rock City / Furahisha Exhibition Grounds',
    venueLocation: 'Barabara ya Nyerere, Ilemela, Mwanza',
    eventDates: 'Tarehe 15 - 20 Julai 2026'
  };
  const d = dest || fallback;
  const regId = String(d.regionId || 'mwanza').toLowerCase();
  const locInfo = REGION_LOCALIZED_INFO[regId] || null;
  const baseName = d.regionName || (locInfo ? locInfo.nameSw : 'Mwanza');
  const defaultVenue = locInfo
    ? (lang === 'zh' ? locInfo.venueZh : (lang === 'en' ? locInfo.venueEn : locInfo.venueSw))
    : (lang === 'zh' ? `${baseName} 国际会展中心` : (lang === 'en' ? `${baseName} Exhibition Grounds` : `Uwanja wa Maonyesho ${baseName}`));
  const defaultLoc = locInfo
    ? (lang === 'zh' ? locInfo.locZh : (lang === 'en' ? locInfo.locEn : locInfo.locSw))
    : `${baseName}, Tanzania`;
  const defaultDates = locInfo
    ? (lang === 'zh' ? locInfo.datesZh : (lang === 'en' ? locInfo.datesEn : locInfo.datesSw))
    : translateEventDate(d.eventDates || '', lang);

  return {
    regionDisplayName: lang === 'zh'
      ? (d.regionNameZh || (locInfo ? locInfo.nameZh : baseName))
      : (lang === 'en' ? (d.regionNameEn || (locInfo ? locInfo.nameEn : baseName)) : (d.regionNameSw || baseName)),
    venueDisplayName: lang === 'zh'
      ? (d.venueZh || (d.venue && locInfo && d.venue !== locInfo.venueSw ? d.venue : defaultVenue))
      : (lang === 'en'
        ? (d.venueEn || (d.venue && locInfo && d.venue !== locInfo.venueSw ? d.venue : defaultVenue))
        : (d.venueSw || d.venue || defaultVenue)),
    locDisplayName: lang === 'zh'
      ? (d.venueLocationZh || (d.venueLocation && locInfo && d.venueLocation !== locInfo.locSw ? d.venueLocation : defaultLoc))
      : (lang === 'en'
        ? (d.venueLocationEn || (d.venueLocation && locInfo && d.venueLocation !== locInfo.locSw ? d.venueLocation : defaultLoc))
        : (d.venueLocationSw || d.venueLocation || defaultLoc)),
    datesDisplayName: lang === 'zh'
      ? (d.eventDatesZh || (d.eventDates ? translateEventDate(d.eventDates, 'zh') : defaultDates))
      : (lang === 'en'
        ? (d.eventDatesEn || (d.eventDates ? translateEventDate(d.eventDates, 'en') : defaultDates))
        : (d.eventDatesSw || d.eventDates || defaultDates))
  };
}

function renderAll() {
  renderHeroSlide();
  renderFeaturedBusinesses();
  renderLiveStatsBanner();
  renderRegionsExplorer();
  renderHomeUpdatesPreview();
  renderTestimonials();
  renderBookingConfigurator();
  renderFloorPlan();
  renderHoldBanner();
  refreshBookingSummary();
  if (typeof renderBookingWizardState === 'function') renderBookingWizardState();
  if (typeof renderSponsorRegionSelector === 'function') renderSponsorRegionSelector();
  if (appState.activeLookupContext?.booking && typeof renderLookupResultCard === 'function') {
    renderLookupResultCard(
      appState.activeLookupContext.booking,
      appState.activeLookupContext.rawResponse || {},
      '',
      '',
      appState.activeLookupContext.targetBoxId || 'retrieve-result-box'
    );
  }
  const galModal = document.getElementById('regional-gallery-modal');
  if (galModal && !galModal.classList.contains('hidden') && typeof updateGalleryModalView === 'function') {
    updateGalleryModalView();
  }
  renderAnnouncements();
  renderAdminDashboard();
}

// ==========================================
// 1. BIASHARA KWANZA — FEATURED BUSINESSES WITH PHOTOS
// ==========================================
function filterBusinessesBySector(sectorKey) {
  appState.activeSectorFilter = sectorKey;
  document.querySelectorAll('.sec-pill').forEach(btn => {
    if (btn.getAttribute('data-sector') === sectorKey) {
      btn.className = 'sec-pill px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[#0b6b68] text-white transition';
    } else {
      btn.className = 'sec-pill px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#f4f7f6] text-slate-700 hover:bg-[#e6f3f2] hover:text-[#0b6b68] transition';
    }
  });
  renderFeaturedBusinesses();
}

function renderFeaturedBusinesses() {
  const grid = document.getElementById('featured-businesses-grid');
  if (!grid) return;

  const lang = appState.lang || 'en';
  const query = (document.getElementById('biz-search-input')?.value || '').toLowerCase();
  const sectorFilter = appState.activeSectorFilter;

  const filtered = appState.bookings.filter(biz => {
    const matchesSector =
      sectorFilter === 'ALL' ||
      (biz.sector || '').toLowerCase().includes(sectorFilter.toLowerCase());
    const haystack = `${biz.businessName} ${biz.tagline || ''} ${biz.taglineEn || ''} ${biz.taglineZh || ''} ${biz.sector} ${(biz.cities || []).join(' ')}`.toLowerCase();
    return matchesSector && haystack.includes(query);
  });

  if (!filtered.length) {
    const emptyMsg = lang === 'zh'
      ? '当前筛选条件下暂无已预订参展商。'
      : (lang === 'en' ? 'No exhibitors matched the current filter.' : 'Hakuna biashara iliyopatikana kwa kichujio hiki.');
    const showAllLabel = lang === 'zh'
      ? '显示全部参展企业'
      : (lang === 'en' ? 'Show All Exhibitors' : 'Onyesha Biashara Zote');
    grid.innerHTML = `
      <div class="col-span-full p-8 text-center rounded-2xl bg-[#f4f7f6] border border-slate-200 space-y-2">
        <div class="text-sm font-bold text-slate-700">${emptyMsg}</div>
        <button onclick="filterBusinessesBySector('ALL')" class="px-4 py-2 rounded-xl bg-[#0b6b68] text-white text-xs font-bold">${showAllLabel}</button>
      </div>
    `;
    return;
  }

  const boothPrefix = lang === 'zh' ? '展位 #' : (lang === 'en' ? 'Booth #' : 'Banda #');
  const citiesPrefix = lang === 'zh' ? '参展城市: ' : (lang === 'en' ? 'Cities: ' : 'Mikoa: ');
  const defaultTagline = lang === 'zh'
    ? '坦桑尼亚商业节巡展官方甄选优质生产商与服务企业。'
    : (lang === 'en'
      ? 'Featured producer and service exhibitor on the Tanzania Biashara Festival tour.'
      : 'Wazalishaji na watoa huduma bora kwenye mzunguko wa Tanzania Biashara Festival.');

  grid.innerHTML = filtered.map((biz, idx) => {
    const imgArray = (Array.isArray(biz.images) && biz.images.length
      ? biz.images
      : DEFAULT_BIZ_IMAGES[idx % DEFAULT_BIZ_IMAGES.length]).map(sanitizeMediaSrc);
    const primaryImg = imgArray[0];
    const localizedSector = localizeSectorLabel(biz.sector, lang).split('(')[0].trim();
    const localizedTagline = (lang === 'zh' ? (biz.taglineZh || biz.taglineEn || biz.tagline) : (lang === 'en' ? (biz.taglineEn || biz.tagline) : biz.tagline)) || defaultTagline;
    const safeBizName = escapeBookingHtml(biz.businessName || '');
    const safeSector = escapeBookingHtml(localizedSector);
    const safeBoothCode = escapeBookingHtml(biz.boothCode || '');
    const safeCities = escapeBookingHtml((biz.cities || []).join(' • '));
    const safeTagline = escapeBookingHtml(localizedTagline);
    const safeContact = escapeBookingHtml(biz.contactPerson || 'Exhibitor Desk');
    const safePhoneDisplay = escapeBookingHtml(biz.phone || '+255 767 053 250');
    const safeTel = escapeBookingHtml(sanitizeTelHref(biz.phone));

    return `
      <div class="group rounded-2xl bg-white border border-slate-200 hover:border-[#0b6b68] overflow-hidden flex flex-col justify-between transition shadow-sm hover:shadow-md">
        <div>
          <!-- Top Business Photo Banner (Auto-Cycles!) -->
          <div class="relative h-44 w-full overflow-hidden bg-slate-100">
            <img
              src="${escapeBookingHtml(primaryImg)}"
              alt="${safeBizName}"
              data-biz-images="${escapeBookingHtml(imgArray.join('|'))}"
              data-card-idx="${idx}"
              class="card-photo-transition w-full h-full object-cover group-hover:scale-105"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent"></div>
            <div class="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <span class="px-2.5 py-1 rounded-full bg-white/95 text-[#0b6b68] text-xs font-extrabold shadow-sm">
                ${safeSector}
              </span>
              <span class="px-2.5 py-1 rounded-lg bg-[#0b6b68] text-white font-mono text-xs font-bold shadow-sm">
                ${escapeBookingHtml(boothPrefix)}${safeBoothCode}
              </span>
            </div>
            <div class="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs font-semibold">
              <span>${escapeBookingHtml(citiesPrefix)}${safeCities}</span>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-5 space-y-2">
            <h3 class="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
              ${safeBizName}
            </h3>
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
              ${safeTagline}
            </p>
          </div>
        </div>

        <div class="px-5 pb-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span class="text-slate-600 font-medium">${safeContact}</span>
          <a href="tel:${safeTel}" class="font-extrabold text-[#0b6b68] hover:underline">
            ${safePhoneDisplay}
          </a>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// 2. ZIGZAG TEAL-GREEN STATISTICS BANNER (WITH 3-SECOND SMOOTH COUNT-UP ANIMATION)
// ==========================================
let statsCountAnimated = false;

function animateNumberCount(el, startVal, targetVal, duration = 3000) {
  if (!el) return;
  const startTime = performance.now();
  const diff = targetVal - startVal;

  function updateCount(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Smooth ease-out cubic curve (starts dynamic, decelerates softly to exact target)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(startVal + diff * easeOut);

    el.textContent = current.toLocaleString('en-US') + '+';

    if (progress < 1) {
      requestAnimationFrame(updateCount);
    } else {
      el.textContent = Number(targetVal).toLocaleString('en-US') + '+';
    }
  }

  requestAnimationFrame(updateCount);
}

function renderLiveStatsBanner(forceAnimate = false) {
  const s = appState.liveStats || {};
  const targetVisitors = Number(s.totalCookieVisitors || 185);
  const targetAttendees = Number(s.totalRegisteredAttendees || 240);
  const targetInvestors = Number(s.totalPartnersAndInvestors || 2);
  const targetBiz = Number(s.totalBusinessesShowcased || 10);

  const visitorsEl = document.getElementById('stat-cookie-visitors');
  const attendeesEl = document.getElementById('stat-regional-attendees');
  const investorsEl = document.getElementById('stat-investors-count');
  const bizEl = document.getElementById('stat-businesses-count');

  if (!statsCountAnimated || forceAnimate) {
    statsCountAnimated = true;
    animateNumberCount(visitorsEl, 0, targetVisitors, 1600);
    animateNumberCount(attendeesEl, 0, targetAttendees, 1600);
    animateNumberCount(investorsEl, 0, targetInvestors, 1600);
    animateNumberCount(bizEl, 0, targetBiz, 1600);
  } else {
    if (visitorsEl) {
      const prev = parseInt(visitorsEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
      if (prev !== targetVisitors) animateNumberCount(visitorsEl, prev, targetVisitors, 800);
    }
    if (attendeesEl) {
      const prev = parseInt(attendeesEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
      if (prev !== targetAttendees) animateNumberCount(attendeesEl, prev, targetAttendees, 800);
    }
    if (investorsEl) {
      const prev = parseInt(investorsEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
      if (prev !== targetInvestors) animateNumberCount(investorsEl, prev, targetInvestors, 800);
    }
    if (bizEl) {
      const prev = parseInt(bizEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
      if (prev !== targetBiz) animateNumberCount(bizEl, prev, targetBiz, 800);
    }
  }
}

function setupStatsObserver() {
  const visitorsEl = document.getElementById('stat-cookie-visitors');
  const statsSection = visitorsEl ? visitorsEl.closest('section') : null;
  if (!statsSection || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        renderLiveStatsBanner(true);
      }
    });
  }, { threshold: 0.15 });

  observer.observe(statsSection);
}

// ==========================================
// 3. REGIONAL ATTENDANCE, TOUR MAP & COOKIE STATISTICS
// ==========================================
const TOUR_CIRCUIT_NODES = [
  { id: 'dar', name: 'Dar es Salaam', zoneSw: 'Pwani & Biashara', x: 415, y: 255, labelX: 415, labelY: 278, order: 1 },
  { id: 'mwanza', name: 'Mwanza', zoneSw: 'Kanda ya Ziwa', x: 190, y: 92, labelX: 190, labelY: 76, order: 2 },
  { id: 'arusha', name: 'Arusha', zoneSw: 'Kaskazini', x: 335, y: 105, labelX: 375, labelY: 108, order: 3 },
  { id: 'dodoma', name: 'Dodoma', zoneSw: 'Kati / Makao Makuu', x: 265, y: 215, labelX: 265, labelY: 198, order: 4 },
  { id: 'mbeya', name: 'Mbeya', zoneSw: 'Nyanda za Juu', x: 180, y: 345, labelX: 135, labelY: 348, order: 5 },
  { id: 'zanzibar', name: 'Zanzibar', zoneSw: 'Visiwani', x: 446, y: 220, labelX: 485, labelY: 224, order: 6 }
];


const REGION_LOCALIZED_INFO = {
  mwanza: {
    nameSw: 'Mwanza',
    nameEn: 'Mwanza',
    nameZh: '姆万扎 (Mwanza)',
    venueSw: 'Rock City / Furahisha Exhibition Grounds',
    venueEn: 'Rock City / Furahisha Exhibition Grounds',
    venueZh: 'Rock City / Furahisha 展览广场',
    locSw: 'Barabara ya Nyerere, Ilemela, Mwanza',
    locEn: 'Nyerere Road, Ilemela, Mwanza',
    locZh: '姆万扎伊莱梅拉区尼雷尔大道',
    datesSw: 'Tarehe 15 - 20 Julai 2026',
    datesEn: 'Dates: July 15 - 20, 2026',
    datesZh: '展期：2026年7月15日 - 20日'
  },
  dar: {
    nameSw: 'Dar es Salaam',
    nameEn: 'Dar es Salaam',
    nameZh: '达累斯萨拉姆 (Dar es Salaam)',
    venueSw: 'Dar es Salaam Exhibition Grounds (Mnazi Mmoja)',
    venueEn: 'Dar es Salaam Exhibition Grounds (Mnazi Mmoja)',
    venueZh: '达累斯萨拉姆市中心展览广场 (Mnazi Mmoja)',
    locSw: 'Mnazi Mmoja / Kivukoni, Dar es Salaam',
    locEn: 'Mnazi Mmoja / Kivukoni, Dar es Salaam',
    locZh: '达累斯萨拉姆基武科尼海滨区',
    datesSw: 'Tarehe 10 - 15 Agosti 2026',
    datesEn: 'Dates: August 10 - 15, 2026',
    datesZh: '展期：2026年8月10日 - 15日'
  },
  arusha: {
    nameSw: 'Arusha',
    nameEn: 'Arusha',
    nameZh: '阿鲁沙 (Arusha)',
    venueSw: 'Sheikh Amri Abeid Exhibition Grounds',
    venueEn: 'Sheikh Amri Abeid Exhibition Grounds',
    venueZh: '阿鲁沙谢赫阿姆里阿贝德体育场及博览广场',
    locSw: 'Katikati ya Jiji, Arusha',
    locEn: 'City Center, Arusha',
    locZh: '阿鲁沙市中心',
    datesSw: 'Tarehe 5 - 10 Septemba 2026',
    datesEn: 'Dates: September 5 - 10, 2026',
    datesZh: '展期：2026年9月5日 - 10日'
  },
  dodoma: {
    nameSw: 'Dodoma',
    nameEn: 'Dodoma',
    nameZh: '多多马 (Dodoma)',
    venueSw: 'Dodoma Exhibition & Capital Grounds',
    venueEn: 'Dodoma Exhibition & Capital Grounds',
    venueZh: '多多马首都国际展览广场',
    locSw: 'Kikuyu / Jamhuri, Dodoma',
    locEn: 'Kikuyu / Jamhuri, Dodoma',
    locZh: '多多马市中心基库尤 / 共和国大道',
    datesSw: 'Tarehe 1 - 6 Oktoba 2026',
    datesEn: 'Dates: October 1 - 6, 2026',
    datesZh: '展期：2026年10月1日 - 6日'
  },
  mbeya: {
    nameSw: 'Mbeya',
    nameEn: 'Mbeya',
    nameZh: '姆贝亚 (Mbeya)',
    venueSw: 'Sokoine Stadium & Highland Grounds',
    venueEn: 'Sokoine Stadium & Highland Grounds',
    venueZh: '索科伊内体育场及高原博览广场',
    locSw: 'Ruanda Nzovwe, Mbeya',
    locEn: 'Ruanda Nzovwe, Mbeya',
    locZh: '姆贝亚卢安达佐韦展区',
    datesSw: 'Tarehe 20 - 25 Oktoba 2026',
    datesEn: 'Dates: October 20 - 25, 2026',
    datesZh: '展期：2026年10月20日 - 25日'
  },
  zanzibar: {
    nameSw: 'Zanzibar',
    nameEn: 'Zanzibar',
    nameZh: '桑给巴尔 (Zanzibar)',
    venueSw: 'Maisara Grounds & Amani Complex',
    venueEn: 'Maisara Grounds & Amani Complex',
    venueZh: '迈萨拉广场与阿马尼会展中心',
    locSw: 'Michenzani / Stone Town, Zanzibar',
    locEn: 'Michenzani / Stone Town, Zanzibar',
    locZh: '桑给巴尔石头城迈桑扎尼区',
    datesSw: 'Tarehe 15 - 20 Novemba 2026',
    datesEn: 'Dates: November 15 - 20, 2026',
    datesZh: '展期：2026年11月15日 - 20日'
  }
};

const REGION_VENUE_PHOTOS = {
  mwanza: [
    {
      src: '/images/market_tents_aisle.jpg',
      titleSw: 'Viwanja vya Furahisha & Minada',
      titleEn: 'Furahisha Grounds & Live Auctions',
      titleZh: 'Furahisha 广场与露天拍卖'
    },
    {
      src: '/images/african_market_stalls.jpg',
      titleSw: 'Mabanda ya Wajasiriamali & Mauzo',
      titleEn: 'Vendor Booths & Direct Sales',
      titleZh: '展商展位与现场直销'
    },
    {
      src: '/images/sabasaba_event.jpg',
      titleSw: 'Kongamano & One-Stop Clinic',
      titleEn: 'Business Conference & One-Stop Clinic',
      titleZh: '商务峰会与一站式政企服务'
    }
  ],
  dar: [
    {
      src: '/images/sabasaba_event.jpg',
      titleSw: 'Viwanja vya Mnazi Mmoja',
      titleEn: 'Mnazi Mmoja Exhibition Grounds',
      titleZh: 'Mnazi Mmoja 展会主广场'
    },
    {
      src: '/images/expo2.jpg',
      titleSw: 'Mabanda ya Viwanda & FMCG',
      titleEn: 'Industrial & FMCG Pavilions',
      titleZh: '制造业与快消品展厅'
    },
    {
      src: '/images/market_tents_aisle.jpg',
      titleSw: 'Minada ya Wazi ya Pwani',
      titleEn: 'Coastal Open-Air Auctions',
      titleZh: '沿海露天商品展销拍卖'
    }
  ],
  arusha: [
    {
      src: '/images/expo5.jpg',
      titleSw: 'Sheikh Amri Abeid Grounds',
      titleEn: 'Sheikh Amri Abeid Grounds',
      titleZh: '谢赫阿姆里阿贝德广场'
    },
    {
      src: '/images/market_tents_aisle.jpg',
      titleSw: 'Minada ya Utalii & Mazao',
      titleEn: 'Tourism & Agro-Produce Auctions',
      titleZh: '农产品与旅游博览拍卖'
    },
    {
      src: '/images/african_market_stalls.jpg',
      titleSw: 'Mabanda ya Sanaa & Vito',
      titleEn: 'Gemstones, Minerals & Craft Stalls',
      titleZh: '矿产宝石与工艺美术展位'
    }
  ],
  dodoma: [
    {
      src: '/images/expo2.jpg',
      titleSw: 'Nyerere Square Grounds',
      titleEn: 'Nyerere Square Capital Grounds',
      titleZh: '尼雷尔广场中心展区'
    },
    {
      src: '/images/sabasaba_event.jpg',
      titleSw: 'Jukwaa la Uwekezaji & Serikali',
      titleEn: 'National Investment & Gov Forum',
      titleZh: '国家投资与政府对接论坛'
    },
    {
      src: '/images/expo5.jpg',
      titleSw: 'Mabanda ya Makao Makuu',
      titleEn: 'National Capital Expo Booths',
      titleZh: '首都商务代表团展位'
    }
  ],
  mbeya: [
    {
      src: '/images/african_market_stalls.jpg',
      titleSw: 'Viwanja vya Ruanda Nzovwe',
      titleEn: 'Ruanda Nzovwe Exhibition Grounds',
      titleZh: '卢安达佐韦展会广场'
    },
    {
      src: '/images/market_tents_aisle.jpg',
      titleSw: 'Minada ya Mazao & Vifaa',
      titleEn: 'Agri-Commodity & Tool Auctions',
      titleZh: '大宗农副产品与农机拍卖'
    },
    {
      src: '/images/biz1.jpg',
      titleSw: 'Ukanda wa Biashara SADC',
      titleEn: 'SADC Southern Corridor Trade',
      titleZh: 'SADC 南部走廊跨境贸易区'
    }
  ],
  zanzibar: [
    {
      src: '/images/african_crafts_stalls.jpg',
      titleSw: 'Maisara Grounds & Stone Town',
      titleEn: 'Maisara Grounds & Stone Town',
      titleZh: '迈萨拉广场与石头城'
    },
    {
      src: '/images/african_market_stalls.jpg',
      titleSw: 'Mabanda ya Viungo & Utalii',
      titleEn: 'Spice & Island Tourism Booths',
      titleZh: '香料与海岛旅游特色展厅'
    },
    {
      src: '/images/sabasaba_event.jpg',
      titleSw: 'Jukwaa la Uchumi wa Buluu',
      titleEn: 'Blue Economy Summit Forum',
      titleZh: '蓝色经济高端论坛'
    }
  ]
};
const REGION_GEO_COORDS = {
  mwanza: {
    lat: -2.5085,
    lng: 32.9065,
    zoom: 14,
    name: 'Mwanza',
    venue: 'Rock City / Furahisha Exhibition Grounds',
    location: 'Barabara ya Nyerere, Ilemela, Mwanza'
  },
  dar: {
    lat: -6.8180,
    lng: 39.2780,
    zoom: 14,
    name: 'Dar es Salaam',
    venue: 'Dar es Salaam Exhibition Grounds',
    location: 'Mnazi Mmoja / Kivukoni, Dar es Salaam'
  },
  arusha: {
    lat: -3.3725,
    lng: 36.6870,
    zoom: 14,
    name: 'Arusha',
    venue: 'Sheikh Amri Abeid Exhibition Grounds',
    location: 'Katikati ya Jiji, Arusha'
  },
  dodoma: {
    lat: -6.1730,
    lng: 35.7480,
    zoom: 14,
    name: 'Dodoma',
    venue: 'Dodoma Exhibition & Capital Grounds',
    location: 'Kikuyu / Jamhuri, Dodoma'
  },
  mbeya: {
    lat: -8.9050,
    lng: 33.4530,
    zoom: 14,
    name: 'Mbeya',
    venue: 'Sokoine Stadium & Highland Grounds',
    location: 'Mafiati / Sisimba, Mbeya'
  },
  zanzibar: {
    lat: -6.1640,
    lng: 39.1910,
    zoom: 14,
    name: 'Zanzibar',
    venue: 'Maisara Exhibition Grounds',
    location: 'Stone Town / Maisara, Zanzibar'
  }
};

let leafletMap = null;
let leafletMarker = null;

function showVenuePhotoPreview(src, title) {
  const modal = document.getElementById('venue-photo-modal');
  const img = document.getElementById('venue-photo-img');
  const titleEl = document.getElementById('venue-photo-title');
  if (modal && img) {
    img.src = src;
    if (titleEl) titleEl.textContent = title;
    modal.classList.remove('hidden');
  }
}

function closeVenuePhotoModal() {
  const modal = document.getElementById('venue-photo-modal');
  if (modal) modal.classList.add('hidden');
}

// Newsletter Dedicated Page & Form-less Handlers
function openNewsletterModal() {
  switchSection('newsletter');
  const form = document.getElementById('newsletter-form');
  const successBox = document.getElementById('newsletter-success-box');
  if (form) form.classList.remove('hidden');
  if (successBox) successBox.classList.add('hidden');
  const emailInput = document.getElementById('newsletter-email');
  if (emailInput) setTimeout(() => emailInput.focus(), 180);
}

function closeNewsletterModal() {
  switchSection('home');
}

function selectPillOption(containerId, hiddenInputId, value, btnEl) {
  const hiddenInput = document.getElementById(hiddenInputId);
  if (hiddenInput) hiddenInput.value = value;
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('button').forEach(btn => {
    btn.className = 'px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer bg-slate-200/75 hover:bg-[#e6f3f2] text-slate-700 hover:text-[#0b6b68]';
  });
  if (btnEl) {
    btnEl.className = 'px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer bg-[#0b6b68] text-white shadow-sm';
  }
}

function selectNewsletterRegion(region, btnEl) {
  selectPillOption('newsletter-region-pills', 'newsletter-region', region, btnEl);
}

async function handleNewsletterSubmit(e) {
  e.preventDefault();
  const nameEl = document.getElementById('newsletter-name');
  const emailEl = document.getElementById('newsletter-email');
  const regionEl = document.getElementById('newsletter-region');
  const submitBtn = document.getElementById('newsletter-submit-btn');

  const email = emailEl ? emailEl.value.trim() : '';
  const name = nameEl ? nameEl.value.trim() : '';
  const region = regionEl ? regionEl.value : 'All Regions';

  if (!email || !email.includes('@')) {
    alert((t('newsletterEmailInputLabel') || 'Email') + ': invalid email');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>...</span>`;
  }

  try {
    await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, region })
    });
  } catch (err) {
    debugLog('Newsletter API offline, saving to localStorage:', err);
  }

  try {
    localStorage.setItem('tbf_newsletter_email', email);
  } catch (err) {}

  const form = document.getElementById('newsletter-form');
  const successBox = document.getElementById('newsletter-success-box');
  if (form) form.classList.add('hidden');
  if (successBox) successBox.classList.remove('hidden');

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>${t('newsletterSubmitBtn')}</span>`;
  }

  const mainBtn = document.getElementById('newsletter-main-btn');
  if (mainBtn) {
    const isSw = appState.lang === 'sw';
    const isZh = appState.lang === 'zh';
    const subText = isSw ? 'Umesajiliwa Kikamilifu' : (isZh ? '已成功订阅' : 'Successfully Subscribed');
    mainBtn.innerHTML = `
      <svg class="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
      <span>${subText}</span>
    `;
    mainBtn.classList.add('bg-emerald-800');
  }

  showToast(t('newsletterSuccessMsg'));
}

window.openNewsletterModal = openNewsletterModal;
window.closeNewsletterModal = closeNewsletterModal;
window.selectNewsletterRegion = selectNewsletterRegion;
window.handleNewsletterSubmit = handleNewsletterSubmit;

function initRealVenueMap(regionId, venueName, venueLocation) {
  const container = document.getElementById('real-venue-map');
  if (!container) return;

  const geo = REGION_GEO_COORDS[regionId] || REGION_GEO_COORDS.mwanza;
  const lat = geo.lat;
  const lng = geo.lng;
  const lang = appState.lang || 'en';

  // Fallback to OpenStreetMap embed if Leaflet script isn't available
  if (typeof L === 'undefined') {
    container.innerHTML = `
      <iframe
        width="100%"
        height="100%"
        frameborder="0"
        scrolling="no"
        src="https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.035}%2C${lat - 0.025}%2C${lng + 0.035}%2C${lat + 0.025}&amp;layer=mapnik&amp;marker=${lat}%2C${lng}"
        class="w-full h-full border-0 rounded-2xl"
      ></iframe>
    `;
    return;
  }

  // Clear previous instance
  if (leafletMap) {
    try {
      leafletMap.remove();
    } catch (e) {}
    leafletMap = null;
    leafletMarker = null;
  }

  try {
    leafletMap = L.map('real-venue-map', {
      center: [lat, lng],
      zoom: geo.zoom || 14,
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: false
    });

    // Clean OpenStreetMap tiles (Attribution removed per user design preference)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(leafletMap);

    const popupBadge = lang === 'zh' ? '官方展会主场馆' : (lang === 'en' ? 'Official Festival Venue' : 'Eneo Rasmi la Tamasha');
    leafletMarker = L.marker([lat, lng]).addTo(leafletMap);
    leafletMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 2px;">
        <div style="color: #0b6b68; font-weight: 800; font-size: 10px; text-transform: uppercase;">${escapeBookingHtml(popupBadge)}</div>
        <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-top: 2px;">${escapeBookingHtml(venueName || geo.venue)}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${escapeBookingHtml(venueLocation || geo.location)}</div>
      </div>
    `).openPopup();

    setTimeout(() => {
      if (leafletMap) leafletMap.invalidateSize();
    }, 250);
  } catch (err) {
    debugLog('Error initializing Leaflet map:', err);
  }
}


function renderRegionsExplorer() {
  const spotlight = document.getElementById('region-spotlight-box');
  if (!spotlight) return;

  const dest = appState.destination || {
    regionId: 'mwanza',
    regionName: 'Mwanza',
    venue: 'Rock City / Furahisha Exhibition Grounds',
    venueLocation: 'Barabara ya Nyerere, Ilemela, Mwanza',
    eventDates: 'Tarehe 15 - 20 Julai 2026'
  };

  const lang = appState.lang || 'en';
  const dict = I18N[lang] || I18N.en;
  const regId = dest.regionId || 'mwanza';
  const venuePics = REGION_VENUE_PHOTOS[regId] || REGION_VENUE_PHOTOS.mwanza;
  const { regionDisplayName, venueDisplayName, locDisplayName, datesDisplayName } = getLocalizedDestinationInfo(dest, lang);

  const gmapsQuery = encodeURIComponent(`${venueDisplayName} ${locDisplayName} ${regionDisplayName} Tanzania`);

  const getPicTitle = (p) => {
    if (lang === 'zh') return p.titleZh || p.titleEn || p.titleSw || p.title || '';
    if (lang === 'en') return p.titleEn || p.titleSw || p.title || '';
    return p.titleSw || p.title || '';
  };

  spotlight.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
      
      <!-- LEFT COLUMN: VENUE INFO & PICTURES PEMBENI (COL-SPAN-5) -->
      <div class="lg:col-span-5 flex flex-col justify-between space-y-4">
        <div class="space-y-3">
          <div>
            <div class="text-[11px] font-black uppercase tracking-widest text-[#0b6b68]">
              ${escapeBookingHtml(dict.destBadgeUpcoming)}
            </div>
            <h3 class="text-2xl sm:text-3xl font-extrabold uppercase text-slate-900 tracking-tight mt-0.5">
              ${escapeBookingHtml(regionDisplayName)}
            </h3>
          </div>

          <!-- Essential Details Only (Punguza Maneno) -->
          <div class="p-3.5 rounded-2xl bg-[#f4f7f6] border border-slate-200 text-xs sm:text-sm space-y-2">
            <div>
              <span class="text-slate-500 font-bold block text-[11px] uppercase">${escapeBookingHtml(dict.destLabelVenue)}</span>
              <strong class="text-slate-900 font-extrabold">${escapeBookingHtml(venueDisplayName)}</strong>
            </div>
            <div>
              <span class="text-slate-500 font-bold block text-[11px] uppercase">${escapeBookingHtml(dict.destLabelLocation)}</span>
              <span class="text-slate-700 font-medium">${escapeBookingHtml(locDisplayName)}</span>
            </div>
            <div>
              <span class="text-slate-500 font-bold block text-[11px] uppercase">${escapeBookingHtml(dict.destLabelDates)}</span>
              <strong class="text-[#0b6b68] font-extrabold">${escapeBookingHtml(datesDisplayName)}</strong>
            </div>
          </div>

          <!-- Pictures Pembeni: 3 Real Venue / Market Photos -->
          <div class="space-y-2 pt-1">
            <div class="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center justify-between">
              <span>${escapeBookingHtml(dict.destPhotosHeading)}</span>
              <span class="text-[10px] text-slate-500 font-bold">${escapeBookingHtml(dict.destPhotosClick)}</span>
            </div>
            <div class="grid grid-cols-3 gap-2.5">
              ${venuePics.map(pic => {
                const t = getPicTitle(pic);
                const safeSrc = sanitizeMediaSrc(pic.src);
                const safeTitle = escapeBookingHtml(t);
                const jsTitle = escapeBookingHtml(t.replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
                return `
                  <div class="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition" onclick="showVenuePhotoPreview('${escapeBookingHtml(safeSrc)}', '${jsTitle}')">
                    <img src="${escapeBookingHtml(safeSrc)}" alt="${safeTitle}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex items-end p-2">
                      <span class="text-[11px] font-bold text-white leading-snug drop-shadow tracking-normal [word-spacing:0.08em] line-clamp-2">${safeTitle}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-3 pt-2">
          <button onclick="jumpToCityBooking('${escapeBookingHtml(String(dest.regionName || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"))}')" class="flex-1 py-3 px-4 rounded-xl bg-[#0b6b68] hover:bg-[#08524f] text-white font-extrabold text-xs uppercase tracking-wider shadow transition text-center">
            ${escapeBookingHtml(dict.destBookBtnPrefix)} ${escapeBookingHtml(regionDisplayName)} &rarr;
          </button>
          <a
            href="https://www.google.com/maps/search/?api=1&query=${gmapsQuery}"
            target="_blank"
            rel="noopener noreferrer"
            class="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider transition text-center flex items-center justify-center gap-1.5"
          >
            <span>${dict.destGoogleMapsBtn}</span>
          </a>
        </div>
      </div>

      <!-- RIGHT COLUMN: PURE FORM-LESS REAL INTERACTIVE MAP (COL-SPAN-7) -->
      <div class="lg:col-span-7 flex flex-col">
        <div id="real-venue-map" class="w-full h-[360px] sm:h-[430px] rounded-2xl overflow-hidden shadow border border-slate-200 relative z-0"></div>
      </div>

    </div>
  `;

  // Initialize the real map immediately with localized names
  initRealVenueMap(regId, venueDisplayName, locDisplayName);
}

function selectActiveRegion(regionId) {
  appState.activeRegionId = regionId;
  setCookie('tbf_region', regionId, 365);
  const vid = getCookie('tbf_visitor_id');
  pingVisitorServer(vid, false, regionId);
  renderRegionsExplorer();
}

const KNOWN_REGION_ID_BY_NAME = {
  'Dar es Salaam': 'dar',
  'Mwanza': 'mwanza',
  'Arusha': 'arusha',
  'Dodoma': 'dodoma',
  'Mbeya': 'mbeya',
  'Zanzibar': 'zanzibar',
  'Mjini Magharibi (Zanzibar)': 'zanzibar'
};

function getRegionIdForName(regionName) {
  const clean = String(regionName || '').trim();
  if (!clean) return 'mwanza';
  if (KNOWN_REGION_ID_BY_NAME[clean]) return KNOWN_REGION_ID_BY_NAME[clean];
  return clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mwanza';
}

function renderAdminDestinationSelect() {
  const select = document.getElementById('admin-dest-region-select');
  if (!select) return;
  const currentDest = appState.destination || {};
  const activeId = currentDest.regionId || 'mwanza';

  select.innerHTML = TANZANIA_ALL_REGIONS.map(rName => {
    const rid = getRegionIdForName(rName);
    const existing = appState.regions.find(r => r.id === rid || String(r.name || '').toLowerCase() === rName.toLowerCase());
    const label = existing && existing.venueSw ? `${rName} — ${existing.venueSw}` : `${rName} Region`;
    return `<option value="${escapeBookingHtml(rid)}" data-region-name="${escapeBookingHtml(rName)}">${escapeBookingHtml(label)}</option>`;
  }).join('');

  if (Array.from(select.options).some(o => o.value === activeId)) {
    select.value = activeId;
  } else if (currentDest.regionName) {
    const fallbackOpt = document.createElement('option');
    fallbackOpt.value = activeId;
    fallbackOpt.setAttribute('data-region-name', currentDest.regionName);
    fallbackOpt.textContent = currentDest.regionName;
    select.insertBefore(fallbackOpt, select.firstChild);
    select.value = activeId;
  }
}

function syncAdminDestDefaults() {
  const select = document.getElementById('admin-dest-region-select');
  if (!select) return;
  const regionId = select.value;
  const selectedOpt = select.options[select.selectedIndex];
  const optRegionName = selectedOpt ? (selectedOpt.getAttribute('data-region-name') || selectedOpt.textContent.split('—')[0].trim()) : '';
  const reg = appState.regions.find(r => r.id === regionId || String(r.name || '').toLowerCase() === optRegionName.toLowerCase());
  const displayName = (reg && reg.name) ? reg.name : (optRegionName || regionId);

  const venueInput = document.getElementById('admin-dest-venue-input');
  const locInput = document.getElementById('admin-dest-location-input');
  const datesInput = document.getElementById('admin-dest-dates-input');

  if (reg) {
    if (venueInput) venueInput.value = reg.venueSw || `${displayName} Exhibition Grounds`;
    if (locInput) locInput.value = reg.venueLocation || `${displayName} City Center`;
    if (datesInput) datesInput.value = reg.eventDates || 'Tarehe Zitatangazwa';
  } else {
    if (venueInput) venueInput.value = `Viwanja Vikuu vya Maonyesho — ${displayName}`;
    if (locInput) locInput.value = `Katikati ya Mji wa ${displayName}`;
    if (datesInput) datesInput.value = 'Tarehe Zitatangazwa';
  }
}

async function handleAdminSaveDestination() {
  const select = document.getElementById('admin-dest-region-select');
  const venueInput = document.getElementById('admin-dest-venue-input');
  const locInput = document.getElementById('admin-dest-location-input');
  const datesInput = document.getElementById('admin-dest-dates-input');
  const notesInput = document.getElementById('admin-dest-notes-input');

  const regionId = select ? select.value : 'mwanza';
  const selectedOpt = select && select.selectedIndex >= 0 ? select.options[select.selectedIndex] : null;
  const optRegionName = selectedOpt ? (selectedOpt.getAttribute('data-region-name') || '') : '';
  const targetReg = appState.regions.find(r => r.id === regionId || String(r.name || '').toLowerCase() === optRegionName.toLowerCase());
  const regionName = optRegionName || (targetReg ? targetReg.name : 'Mwanza');
  const venue = (venueInput ? venueInput.value.trim() : '') || `Viwanja vya Maonyesho — ${regionName}`;
  const venueLocation = (locInput ? locInput.value.trim() : '') || `${regionName} City Center`;
  const eventDates = (datesInput ? datesInput.value.trim() : '') || 'Tarehe Zitatangazwa';
  const notes = notesInput ? notesInput.value.trim() : '';

  try {
    const res = await fetch('/api/admin/set-destination', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        regionId,
        regionName,
        venue,
        venueLocation,
        eventDates,
        notes
      })
    });
    if (res.status === 401) {
      appState.isAdminAuthenticated = false;
      renderAdminUIState();
      switchSection('login');
      return;
    }
    if (res.ok) {
      const data = await res.json();
      if (data.destination) appState.destination = data.destination;
      if (data.regions) appState.regions = data.regions;
      appState.activeRegionId = appState.destination?.regionId || regionId;
      syncBookingCitiesFromDestination();

      const toast = document.getElementById('admin-dest-toast');
      if (toast) {
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 4000);
      }
      const badge = document.getElementById('admin-dest-badge');
      if (badge) {
        const lang = appState.lang || 'en';
        const prefix = lang === 'zh' ? '当前巡展举办地：' : (lang === 'en' ? 'Current Destination: ' : 'Sasa Tunaoenda: ');
        badge.textContent = `${prefix}${appState.destination.regionName} (${venue})`;
      }

      renderAll();
    }
  } catch (err) {
    debugLog('Error saving destination:', err);
    alert('Hitilafu ya mtandao wakati wa kuhifadhi mkoa tunaoenda.');
  }
}

async function rsvpForRegion(regionId) {
  setCookie('tbf_rsvp_' + regionId, 'yes', 365);
  try {
    const res = await fetch('/api/attendee-rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regionId, count: 1 })
    });
    if (res.ok) {
      const data = await res.json();
      appState.regions = data.db.regions;
      appState.liveStats = data.liveStats;
      renderLiveStatsBanner();
      renderRegionsExplorer();
      const toast = document.getElementById('rsvp-toast');
      if (toast) toast.classList.remove('hidden');
    }
  } catch (e) {
    // Fallback
  }
}

function jumpToCityBooking(cityName) {
  if (!appState.selectedBookingCities.includes(cityName)) {
    appState.selectedBookingCities.push(cityName);
  }
  renderBookingConfigurator();
  renderFloorPlan();
  refreshBookingSummary();
  switchSection('booking');
}

// ==========================================
// 4. HOME REGIONAL SHOWCASE (IMAGE 2 / LALA SALAMA LUXURY MOVING CAROUSEL)
// ==========================================
const HOME_REGIONAL_SHOWCASE = [
  {
    id: 'mwanza',
    regionSw: 'Mwanza',
    regionEn: 'Mwanza',
    regionZh: '姆万扎',
    titleSw: 'Mwanza • Banda la Ziwa Victoria',
    titleEn: 'Mwanza • Lake Victoria Pavilion',
    titleZh: '姆万扎 • 维多利亚湖展馆',
    attendeesSw: '15,000+ Washiriki',
    attendeesEn: '15,000+ Attendees',
    attendeesZh: '15,000+ 参会者',
    boothsSw: '150+ Mabanda',
    boothsEn: '150+ Booths',
    boothsZh: '150+ 展位',
    venueSw: 'Viwanja vya Furahisha',
    venueEn: 'Furahisha Grounds',
    venueZh: '富拉希沙广场',
    descSw: 'Kitovu kikuu cha uvuvi, madini, kilimo na biashara ya mipakani ya nchi za Maziwa Makuu.',
    descEn: 'The premier economic hub for fisheries, mining, agro-processing, and Great Lakes transit trade.',
    descZh: '大湖区渔业、矿产、农业综合开发及跨境商贸转运枢纽。',
    photos: [
      '/images/african_market_stalls.jpg',
      '/images/african_crafts_stalls.jpg',
      '/images/biz2.jpg',
      '/images/expo4.jpg'
    ]
  },
  {
    id: 'dar',
    regionSw: 'Dar es Salaam',
    regionEn: 'Dar es Salaam',
    regionZh: '达累斯萨拉姆',
    titleSw: 'Dar es Salaam • Kitovu cha Taifa',
    titleEn: 'Dar es Salaam • National Commercial Hub',
    titleZh: '达累斯萨拉姆 • 全国商业中心',
    attendeesSw: '35,000+ Washiriki',
    attendeesEn: '35,000+ Attendees',
    attendeesZh: '35,000+ 参会者',
    boothsSw: '300+ Mabanda',
    boothsEn: '300+ Booths',
    boothsZh: '300+ 展位',
    venueSw: 'Viwanja vya Sabasaba',
    venueEn: 'Sabasaba Grounds',
    venueZh: '萨巴萨巴广场',
    descSw: 'Kituo kikuu cha kifedha, viwanda na biashara ya kimataifa. Ungana na maelfu ya wanunuzi wa moja kwa moja.',
    descEn: 'The country\'s financial and trade capital. Connect directly with institutional buyers and corporate sponsors.',
    descZh: '坦桑尼亚经济与外贸枢纽。直接对接大宗采购商、金融机构与企业赞助商。',
    photos: [
      '/images/sabasaba_event.jpg',
      '/images/slide4.jpg',
      '/images/african_clothes_stalls.jpg',
      '/images/expo3.jpg'
    ]
  },
  {
    id: 'arusha',
    regionSw: 'Arusha',
    regionEn: 'Arusha',
    regionZh: '阿鲁沙',
    titleSw: 'Arusha • Lango Kuu la Utalii na EAC',
    titleEn: 'Arusha • Tourism & East Africa Gateway',
    titleZh: '阿鲁沙 • 旅游与东非门户',
    attendeesSw: '18,000+ Washiriki',
    attendeesEn: '18,000+ Attendees',
    attendeesZh: '18,000+ 参会者',
    boothsSw: '180+ Mabanda',
    boothsEn: '180+ Booths',
    boothsZh: '180+ 展位',
    venueSw: 'Viwanja vya Magereza',
    venueEn: 'Magereza Grounds',
    venueZh: '马格雷扎广场',
    descSw: 'Lango kuu la utalii, safari, kilimo cha kisasa, na bidhaa zinazovuka mipaka ya Jumuiya ya Afrika Mashariki.',
    descEn: 'The gateway to safari hospitality, export horticulture, gemstones, and cross-border EAC commerce.',
    descZh: '高端生态旅游、优质园艺农产品及东非共同体跨界商贸的重要枢纽。',
    photos: [
      '/images/african_crafts_stalls.jpg',
      '/images/biz1.jpg',
      '/images/african_market_stalls.jpg',
      '/images/biz4.jpg'
    ]
  },
  {
    id: 'dodoma',
    regionSw: 'Dodoma',
    regionEn: 'Dodoma',
    regionZh: '多多马',
    titleSw: 'Dodoma • Makao Makuu ya Nchi & Kanda ya Kati',
    titleEn: 'Dodoma • Capital City & Central Zone Hub',
    titleZh: '多多马 • 首都及中部经济特区展馆',
    attendeesSw: '22,000+ Washiriki',
    attendeesEn: '22,000+ Attendees',
    attendeesZh: '22,000+ 参会者',
    boothsSw: '220+ Mabanda',
    boothsEn: '220+ Booths',
    boothsZh: '220+ 展位',
    venueSw: 'Uwanja wa Jamhuri',
    venueEn: 'Jamhuri Stadium Grounds',
    venueZh: '贾姆胡里体育场广场',
    descSw: 'Makutano ya serikali, taasisi za umma, kilimo cha zabibu, na uwekezaji mkubwa wa miundombinu Kanda ya Kati.',
    descEn: 'The governmental capital connecting public institutions, agribusiness, grape cultivation, and central infrastructure investments.',
    descZh: '国家行政首都与中央经济枢纽，对接政府部门、特色农产品深加工与重点投资项目。',
    photos: [
      '/images/expo3.jpg',
      '/images/slide4.jpg',
      '/images/biz2.jpg',
      '/images/biz3.jpg'
    ]
  },
  {
    id: 'mbeya',
    regionSw: 'Mbeya',
    regionEn: 'Mbeya',
    regionZh: '姆贝亚',
    titleSw: 'Mbeya • Nyanda za Juu Kusini & SADC',
    titleEn: 'Mbeya • Southern Highlands & SADC Corridor',
    titleZh: '姆贝亚 • 南部高地与南部非洲走廊',
    attendeesSw: '20,000+ Washiriki',
    attendeesEn: '20,000+ Attendees',
    attendeesZh: '20,000+ 参会者',
    boothsSw: '170+ Mabanda',
    boothsEn: '170+ Booths',
    boothsZh: '170+ 展位',
    venueSw: 'Uwanja wa Sokoine',
    venueEn: 'Sokoine Stadium Grounds',
    venueZh: '索科因体育场广场',
    descSw: 'Kitovu kikuu cha kilimo, nafaka, kahawa, madini ya makaa, na lango kuu la biashara kuelekea Zambia na Malawi.',
    descEn: 'The breadbasket of Tanzania and trade bridge linking agro-industries with Southern African development corridors.',
    descZh: '坦桑尼亚重点粮仓与矿产区，连接赞比亚、马拉维及南部非洲贸易走廊的重要商贸桥梁。',
    photos: [
      '/images/expo4.jpg',
      '/images/slide2.jpg',
      '/images/biz5.jpg',
      '/images/african_market_stalls.jpg'
    ]
  },
  {
    id: 'zanzibar',
    regionSw: 'Zanzibar',
    regionEn: 'Zanzibar',
    regionZh: '桑给巴尔',
    titleSw: 'Zanzibar • Uchumi wa Buluu & Utalii',
    titleEn: 'Zanzibar • Blue Economy & Island Tourism',
    titleZh: '桑给巴尔 • 蓝色经济与海岛旅游展馆',
    attendeesSw: '16,000+ Washiriki',
    attendeesEn: '16,000+ Attendees',
    attendeesZh: '16,000+ 参会者',
    boothsSw: '140+ Mabanda',
    boothsEn: '140+ Booths',
    boothsZh: '140+ 展位',
    venueSw: 'Viwanja vya Maisara',
    venueEn: 'Maisara Grounds',
    venueZh: '迈萨拉广场',
    descSw: 'Kongamano la biashara ya viungo, ukarimu wa kimataifa, usindikaji wa mazao ya bahari, na teknolojia ya uchumi wa buluu.',
    descEn: 'A showcase for the historic spice trade, marine aquaculture, luxury hospitality, and maritime commerce.',
    descZh: '历史悠久的香料商贸、海滨休闲旅游、现代海洋渔业与可持续蓝色经济展示平台。',
    photos: [
      '/images/biz1.jpg',
      '/images/african_crafts_stalls.jpg',
      '/images/african_clothes_stalls.jpg',
      '/images/biz6.jpg'
    ]
  }
];

let currentGalleryRegionIdx = 0;
let currentGalleryPhotoIdx = 0;
let activeCustomGallery = null;
let currentRegionalSlide = 0;
let regionalAutoSlideTimer = null;

function swapCardMainPhoto(cardIdx, photoUrl, btnElem) {
  const mainImg = document.getElementById(`card-main-img-${cardIdx}`);
  if (mainImg) {
    mainImg.src = sanitizeMediaSrc(photoUrl);
  }
  document.querySelectorAll(`.card-thumb-btn-${cardIdx}`).forEach(btn => {
    btn.className = `card-thumb-btn-${cardIdx} h-12 sm:h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer border-transparent opacity-70 hover:opacity-100`;
  });
  if (btnElem) {
    btnElem.className = `card-thumb-btn-${cardIdx} h-12 sm:h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer border-[#0b6b68] opacity-100 ring-1 ring-[#0b6b68]`;
  }
}

function openCardGalleryModal(regionIdx) {
  activeCustomGallery = null;
  currentGalleryRegionIdx = regionIdx;
  currentGalleryPhotoIdx = 0;
  updateGalleryModalView();
  const modal = document.getElementById('regional-gallery-modal');
  if (modal) modal.classList.remove('hidden');
}

function openNewsGalleryModal(photoIdx = 0) {
  activeCustomGallery = NEWS_GALLERY_PHOTOS;
  currentGalleryPhotoIdx = Math.max(0, Math.min(photoIdx, NEWS_GALLERY_PHOTOS.length - 1));
  updateGalleryModalView();
  const modal = document.getElementById('regional-gallery-modal');
  if (modal) modal.classList.remove('hidden');
}
window.openNewsGalleryModal = openNewsGalleryModal;

function closeRegionalGalleryModal() {
  const modal = document.getElementById('regional-gallery-modal');
  if (modal) modal.classList.add('hidden');
}

function navRegionalGallery(delta) {
  const photos = activeCustomGallery
    ? activeCustomGallery.map(p => p.src)
    : HOME_REGIONAL_SHOWCASE[currentGalleryRegionIdx]?.photos;
  if (!photos || !photos.length) return;
  const count = photos.length;
  currentGalleryPhotoIdx = (currentGalleryPhotoIdx + delta + count) % count;
  updateGalleryModalView();
}

function setGalleryModalPhoto(pIdx) {
  currentGalleryPhotoIdx = pIdx;
  updateGalleryModalView();
}

function updateGalleryModalView() {
  const lang = appState.lang || 'en';
  let photos = [];
  let title = '';
  if (activeCustomGallery) {
    photos = activeCustomGallery.map(p => p.src);
    const activeItem = activeCustomGallery[currentGalleryPhotoIdx] || activeCustomGallery[0];
    title = lang === 'zh' ? activeItem.titleZh : (lang === 'sw' ? activeItem.titleSw : activeItem.titleEn);
  } else {
    const reg = HOME_REGIONAL_SHOWCASE[currentGalleryRegionIdx];
    if (!reg) return;
    photos = reg.photos || [];
    title = reg.titleEn;
    if (lang === 'sw') title = reg.titleSw;
    if (lang === 'zh') title = reg.titleZh;
  }

  const count = photos.length;
  const mainImg = document.getElementById('regional-gallery-main-img');
  const titleEl = document.getElementById('regional-gallery-title');
  const counterEl = document.getElementById('regional-gallery-counter');
  const thumbsContainer = document.getElementById('regional-gallery-thumbs');

  if (mainImg) mainImg.src = sanitizeMediaSrc(photos[currentGalleryPhotoIdx] || '');
  if (titleEl) titleEl.textContent = title;
  if (counterEl) {
    counterEl.textContent = lang === 'zh'
      ? `第 ${currentGalleryPhotoIdx + 1} 张，共 ${count} 张`
      : (lang === 'en' ? `Photo ${currentGalleryPhotoIdx + 1} of ${count}` : `Picha ${currentGalleryPhotoIdx + 1} ya ${count}`);
  }
  if (thumbsContainer) {
    thumbsContainer.innerHTML = photos.map((ph, idx) => `
      <button
        type="button"
        onclick="setGalleryModalPhoto(${idx})"
        class="w-16 h-16 sm:w-20 sm:h-20 overflow-hidden border-2 transition flex-shrink-0 cursor-pointer ${idx === currentGalleryPhotoIdx ? 'border-emerald-400 ring-2 ring-emerald-400 opacity-100' : 'border-white/20 opacity-60 hover:opacity-100'}"
      >
        <img src="${escapeBookingHtml(sanitizeMediaSrc(ph))}" alt="Thumb ${idx + 1}" class="w-full h-full object-cover" />
      </button>
    `).join('');
  }
}

let isRegionalSliding = false;

function getVisibleCardsCount() {
  if (window.innerWidth >= 1024) return 3;
  if (window.innerWidth >= 640) return 2;
  return 1;
}

function updateRegionalSliderPosition(immediate = false) {
  const grid = document.getElementById('home-updates-grid');
  if (!grid || !grid.children || grid.children.length === 0) return;

  if (immediate) {
    grid.style.transition = 'none';
  } else {
    grid.style.transition = 'transform 750ms cubic-bezier(0.16, 1, 0.3, 1)';
  }

  const targetCard = grid.children[currentRegionalSlide];
  const firstCard = grid.children[0];
  if (targetCard && firstCard) {
    const offset = targetCard.offsetLeft - firstCard.offsetLeft;
    grid.style.transform = `translateX(-${offset}px)`;
  } else if (firstCard) {
    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = window.innerWidth >= 1024 ? 32 : 24;
    const offset = currentRegionalSlide * (cardWidth + gap);
    grid.style.transform = `translateX(-${offset}px)`;
  }
  renderRegionalSliderDots();
}

function nextRegionalSlide() {
  const grid = document.getElementById('home-updates-grid');
  if (!grid) return;
  if (isRegionalSliding) return;
  isRegionalSliding = true;

  currentRegionalSlide++;
  updateRegionalSliderPosition(false);
  startRegionalAutoSlide();

  setTimeout(() => {
    isRegionalSliding = false;
  }, 800);
}

function prevRegionalSlide() {
  const grid = document.getElementById('home-updates-grid');
  if (!grid) return;
  if (isRegionalSliding) return;

  if (currentRegionalSlide <= 0) {
    currentRegionalSlide = HOME_REGIONAL_SHOWCASE.length;
    updateRegionalSliderPosition(true);
    void grid.offsetHeight;
  }

  isRegionalSliding = true;
  currentRegionalSlide--;
  updateRegionalSliderPosition(false);
  startRegionalAutoSlide();

  setTimeout(() => {
    isRegionalSliding = false;
  }, 800);
}

function goToRegionalSlide(idx) {
  currentRegionalSlide = idx;
  updateRegionalSliderPosition(false);
  startRegionalAutoSlide();
}

function startRegionalAutoSlide() {
  stopRegionalAutoSlide();
  regionalAutoSlideTimer = setInterval(() => {
    nextRegionalSlide();
  }, 3000);
}

function stopRegionalAutoSlide() {
  if (regionalAutoSlideTimer) {
    clearInterval(regionalAutoSlideTimer);
    regionalAutoSlideTimer = null;
  }
}

function pauseRegionalAutoSlide() {
  stopRegionalAutoSlide();
}

function resumeRegionalAutoSlide() {
  startRegionalAutoSlide();
}

function renderRegionalSliderDots() {
  const dotsContainer = document.getElementById('regional-slider-dots');
  if (!dotsContainer) return;
  const totalRegions = HOME_REGIONAL_SHOWCASE.length;
  const activeIdx = ((currentRegionalSlide % totalRegions) + totalRegions) % totalRegions;

  let html = '';
  for (let i = 0; i < totalRegions; i++) {
    const isActive = i === activeIdx;
    html += `
      <button
        type="button"
        onclick="goToRegionalSlide(${i})"
        class="h-2 rounded-full transition-all cursor-pointer ${isActive ? 'w-8 bg-[#0b6b68]' : 'w-2 bg-slate-300 hover:bg-slate-400'}"
        aria-label="Slide ${i + 1}"
      ></button>
    `;
  }
  dotsContainer.innerHTML = html;
}

function setupRegionalInfiniteTransition() {
  const grid = document.getElementById('home-updates-grid');
  if (!grid || grid.dataset.infiniteBound) return;
  grid.dataset.infiniteBound = 'true';

  grid.addEventListener('transitionend', () => {
    isRegionalSliding = false;
    if (currentRegionalSlide >= HOME_REGIONAL_SHOWCASE.length) {
      currentRegionalSlide = currentRegionalSlide - HOME_REGIONAL_SHOWCASE.length;
      updateRegionalSliderPosition(true);
      void grid.offsetHeight;
    }
  });
}

let touchStartX = 0;
let touchEndX = 0;

function initRegionalTouchSwipe() {
  const viewport = document.getElementById('regional-slider-viewport');
  if (!viewport || viewport.dataset.swipeBound) return;
  viewport.dataset.swipeBound = 'true';

  viewport.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  viewport.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextRegionalSlide();
      } else {
        prevRegionalSlide();
      }
    }
  }, { passive: true });
}

function renderHomeUpdatesPreview() {
  const grid = document.getElementById('home-updates-grid');
  if (!grid) return;
  const lang = appState.lang || 'en';
  const dict = I18N[lang] || I18N.en;

  const allCards = [
    ...HOME_REGIONAL_SHOWCASE,
    ...HOME_REGIONAL_SHOWCASE.slice(0, 3)
  ];

  grid.innerHTML = allCards.map((reg, idx) => {
    const realRegionIdx = idx % HOME_REGIONAL_SHOWCASE.length;
    let title = reg.titleSw;
    let desc = reg.descSw;
    let attendees = reg.attendeesSw;
    let booths = reg.boothsSw;
    let venue = reg.venueSw;

    if (lang === 'zh') {
      title = reg.titleZh;
      desc = reg.descZh;
      attendees = reg.attendeesZh;
      booths = reg.boothsZh;
      venue = reg.venueZh;
    } else if (lang === 'en') {
      title = reg.titleEn;
      desc = reg.descEn;
      attendees = reg.attendeesEn;
      booths = reg.boothsEn;
      venue = reg.venueEn;
    }

    const safeTitle = escapeBookingHtml(title || '');
    const safeDesc = escapeBookingHtml(desc || '');
    const safeAttendees = escapeBookingHtml(attendees || '');
    const safeBooths = escapeBookingHtml(booths || '');
    const safeVenue = escapeBookingHtml(venue || '');
    const safeGalleryBtn = escapeBookingHtml(dict.cardBtnGallery || 'View Gallery');
    const safeActionBtn = escapeBookingHtml(dict.cardBtnAction || 'Book Booth →');
    const safeMainImg = escapeBookingHtml(sanitizeMediaSrc(reg.photos[0]));

    return `
      <div class="w-full sm:w-[calc((100%-24px)/2)] lg:w-[calc((100%-64px)/3)] shrink-0 flex flex-col group select-none">
        <!-- TOP BLOCK: PHOTOS ONLY (Completely outside form - modern frameless) -->
        <div class="mb-3">
          <div class="relative w-full h-60 sm:h-64 md:h-72 rounded-2xl overflow-hidden bg-slate-200 shadow-sm mb-2">
            <img id="card-main-img-${idx}" src="${safeMainImg}" alt="${safeTitle}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </div>

          <!-- 4-Thumbnail Gallery Strip (Frameless outside text form) -->
          <div class="grid grid-cols-4 gap-1.5">
            ${reg.photos.map((ph, pIdx) => {
              const safeThumbSrc = escapeBookingHtml(sanitizeMediaSrc(ph));
              return `
                <button
                  type="button"
                  onclick="swapCardMainPhoto(${idx}, '${safeThumbSrc}', this)"
                  class="card-thumb-btn-${idx} h-12 sm:h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${pIdx === 0 ? 'border-[#0b6b68] opacity-100 ring-1 ring-[#0b6b68]' : 'border-transparent opacity-70 hover:opacity-100'}"
                  aria-label="Thumbnail ${pIdx + 1}"
                >
                  <img src="${safeThumbSrc}" alt="Thumbnail ${pIdx + 1}" class="w-full h-full object-cover" />
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- BOTTOM BLOCK: WORDS / TEXT ONLY INSIDE MODERN WHITE FORM (Moves together with photo) -->
        <div class="flex-1 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] group-hover:shadow-[0_12px_30px_-6px_rgba(11,107,104,0.14)] group-hover:border-[#0b6b68]/40 transition-all duration-300 flex flex-col justify-between">
          <div>
            <!-- Title First -->
            <h3 class="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug mb-2 group-hover:text-[#0b6b68] transition-colors">
              ${safeTitle}
            </h3>

            <!-- Clean Metadata Specs (Monochrome SVG Icons) -->
            <div class="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[11px] font-semibold text-slate-500 mb-3 pb-3 border-b border-slate-100">
              <span class="inline-flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-[#0b6b68] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"></path><circle cx="9" cy="7" r="4" stroke-width="1.8"></circle><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"></path></svg>
                <span>${safeAttendees}</span>
              </span>
              <span class="inline-flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-[#0b6b68] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 21h18M3 7v14M21 7v14M4 7l8-4 8 4M10 21V11h4v10"></path></svg>
                <span>${safeBooths}</span>
              </span>
              <span class="inline-flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-[#0b6b68] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 21c-4.97-4.97-8-8.5-8-12a8 8 0 1116 0c0 3.5-3.03 7.03-8 12z"></path><circle cx="12" cy="9" r="2.5" stroke-width="1.8"></circle></svg>
                <span>${safeVenue}</span>
              </span>
            </div>

            <!-- Description -->
            <p class="text-xs sm:text-[13px] text-slate-600 font-normal leading-relaxed mb-4 line-clamp-2">
              ${safeDesc}
            </p>
          </div>

          <!-- Aligned Modern Action Buttons -->
          <div class="pt-1 flex items-center gap-2.5 mt-auto">
            <button
              type="button"
              onclick="openCardGalleryModal(${realRegionIdx})"
              class="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 text-slate-800 font-bold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <svg class="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="1.8"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 15l-5-5L5 21"></path></svg>
              <span>${safeGalleryBtn}</span>
            </button>
            <button
              type="button"
              onclick="switchSection('booking')"
              class="flex-1 py-2.5 px-3 rounded-xl bg-[#0b6b68] hover:bg-[#08524f] text-white font-bold text-[11px] uppercase tracking-wider transition-all shadow-sm hover:shadow flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>${safeActionBtn}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  setupRegionalInfiniteTransition();
  updateRegionalSliderPosition(true);
  startRegionalAutoSlide();
  initRegionalTouchSwipe();
}

window.nextRegionalSlide = nextRegionalSlide;
window.prevRegionalSlide = prevRegionalSlide;
window.goToRegionalSlide = goToRegionalSlide;
window.pauseRegionalAutoSlide = pauseRegionalAutoSlide;
window.resumeRegionalAutoSlide = resumeRegionalAutoSlide;
window.addEventListener('resize', updateRegionalSliderPosition);

window.swapCardMainPhoto = swapCardMainPhoto;
window.openCardGalleryModal = openCardGalleryModal;
window.closeRegionalGalleryModal = closeRegionalGalleryModal;
window.navRegionalGallery = navRegionalGallery;
window.setGalleryModalPhoto = setGalleryModalPhoto;

let activeNewsGalleryCat = 'all';

function setNewsGalleryCategory(cat) {
  activeNewsGalleryCat = cat || 'all';
  renderNewsGallerySection();
}
window.setNewsGalleryCategory = setNewsGalleryCategory;

function renderNewsScheduleSection() {
  const el = document.getElementById('news-schedule-section');
  if (!el) return;
  const lang = appState.lang || 'en';
  const destInfo = getLocalizedDestinationInfo(appState.destination, lang);

  const secTitle = lang === 'zh' ? '即将举办活动与每日日程表' : (lang === 'sw' ? 'Matukio Yajayo & Ratiba Kuu ya Siku' : 'Upcoming Event & Daily Fairgrounds Timetable');
  const nextLbl = lang === 'zh' ? '下一巡展站点' : (lang === 'sw' ? 'Kituo Kijacho cha Ziara' : 'Next Scheduled Tour Stop');
  const bookNowTxt = lang === 'zh' ? '预订此站展位 →' : (lang === 'sw' ? 'Hifadhi Banda →' : 'Book Booth for This Stop →');
  const dailyHdr = lang === 'zh' ? '每日活动议程 (08:00 - 19:00)' : (lang === 'sw' ? 'Ratiba ya Kila Siku Uwanjani (08:00 - 19:00)' : 'Daily Fairgrounds Schedule (08:00 - 19:00)');

  el.innerHTML = `
    <div class="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-sm space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <h3 class="text-xl sm:text-2xl font-extrabold uppercase text-slate-900">${escapeBookingHtml(secTitle)}</h3>
        <button type="button" onclick="switchSection('booking')" class="px-4 py-2 rounded-xl bg-[#0b6b68] hover:bg-[#08524f] text-white text-xs font-extrabold transition cursor-pointer">
          ${escapeBookingHtml(bookNowTxt)}
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div class="lg:col-span-5 rounded-2xl bg-[#08524f] text-white p-5 flex flex-col justify-between space-y-4">
          <div class="space-y-2">
            <div class="text-[11px] font-bold uppercase tracking-wider text-emerald-200">${escapeBookingHtml(nextLbl)}</div>
            <div class="text-2xl sm:text-3xl font-extrabold uppercase">${escapeBookingHtml(destInfo.regionDisplayName)}</div>
            <div class="text-sm font-bold text-emerald-200">${escapeBookingHtml(destInfo.datesDisplayName)}</div>
            <div class="text-xs text-white/90 pt-1">${escapeBookingHtml(destInfo.venueDisplayName)}</div>
            <div class="text-xs text-white/75">${escapeBookingHtml(destInfo.locDisplayName)}</div>
          </div>
          <div class="pt-3 border-t border-white/15 flex items-center justify-between text-xs">
            <span>${lang === 'zh' ? '入场方式：观众免费入场' : (lang === 'sw' ? 'Kiingilio: Bure kwa Wananchi' : 'Visitor Entry: Free Admission')}</span>
            <button type="button" onclick="switchSection('home')" class="underline font-bold hover:text-emerald-200 cursor-pointer">
              ${lang === 'zh' ? '查看地图 →' : (lang === 'sw' ? 'Ramani →' : 'View Map →')}
            </button>
          </div>
        </div>

        <div class="lg:col-span-7 space-y-2.5">
          <div class="text-xs font-extrabold uppercase tracking-wider text-[#0b6b68]">${escapeBookingHtml(dailyHdr)}</div>
          <div class="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-[#f9fbfa] overflow-hidden">
            ${FESTIVAL_DAILY_TIMETABLE.map(slot => {
              const stTitle = lang === 'zh' ? slot.titleZh : (lang === 'sw' ? slot.titleSw : slot.titleEn);
              const stDesc = lang === 'zh' ? slot.descZh : (lang === 'sw' ? slot.descSw : slot.descEn);
              return `
                <div class="p-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span class="font-mono text-xs font-extrabold text-[#0b6b68] bg-[#e6f3f2] px-2.5 py-1 rounded-lg shrink-0 w-fit">${escapeBookingHtml(slot.time)}</span>
                  <div class="min-w-0">
                    <div class="text-xs sm:text-sm font-bold text-slate-900">${escapeBookingHtml(stTitle)}</div>
                    <div class="text-[11px] text-slate-600 leading-snug mt-0.5">${escapeBookingHtml(stDesc)}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderNewsGallerySection() {
  const el = document.getElementById('news-gallery-section');
  if (!el) return;
  const lang = appState.lang || 'en';

  const hdr = lang === 'zh' ? '商业节精彩现场图库' : (lang === 'sw' ? 'Picha za Matukio ya Tamasha (Photo Gallery)' : 'Festival Photo Gallery');
  const sub = lang === 'zh' ? '点击任意图片即可放大浏览高清展区实景。' : (lang === 'sw' ? 'Bonyeza picha yoyote kuona kwa ukubwa kamili.' : 'Click any photo below to view in full screen.');
  const cats = [
    ['all', lang === 'zh' ? '全部' : (lang === 'sw' ? 'Zote' : 'All Photos')],
    ['stalls', lang === 'zh' ? '展位摊位' : (lang === 'sw' ? 'Mabanda' : 'Booths & Stalls')],
    ['auctions', lang === 'zh' ? '拍卖洽谈' : (lang === 'sw' ? 'Minada & Mauzo' : 'Auctions & Sales')],
    ['forums', lang === 'zh' ? '投资与服务' : (lang === 'sw' ? 'Majukwaa & Kliniki' : 'Forums & Clinic')],
    ['lifestyle', lang === 'zh' ? '文化与美食' : (lang === 'sw' ? 'Chakula & Sanaa' : 'Food & Crafts')]
  ];
  const filtered = NEWS_GALLERY_PHOTOS
    .map((p, idx) => ({ ...p, origIdx: idx }))
    .filter(p => activeNewsGalleryCat === 'all' || p.cat === activeNewsGalleryCat);

  el.innerHTML = `
    <div class="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-sm space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-xl sm:text-2xl font-extrabold uppercase text-slate-900">${escapeBookingHtml(hdr)}</h3>
          <p class="text-xs text-slate-500 mt-0.5">${escapeBookingHtml(sub)}</p>
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${cats.map(([key, label]) => `
            <button type="button" onclick="setNewsGalleryCategory('${key}')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeNewsGalleryCat === key ? 'bg-[#0b6b68] text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">
              ${escapeBookingHtml(label)}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        ${filtered.map(item => {
          const cap = lang === 'zh' ? item.titleZh : (lang === 'sw' ? item.titleSw : item.titleEn);
          return `
            <button type="button" onclick="openNewsGalleryModal(${item.origIdx})" class="group relative rounded-2xl overflow-hidden bg-slate-100 aspect-[4/3] text-left cursor-pointer shadow-xs hover:shadow-md transition">
              <img src="${item.src}" alt="${escapeBookingHtml(cap)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent flex items-end p-3">
                <span class="text-white text-[11px] font-bold leading-snug line-clamp-2">${escapeBookingHtml(cap)}</span>
              </div>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderNewsEssentialsSection() {
  const el = document.getElementById('news-essentials-section');
  if (!el) return;
  const lang = appState.lang || 'en';

  const hdr = lang === 'zh' ? '参展与观展实用指南' : (lang === 'sw' ? 'Mambo Muhimu kwa Washiriki & Wageni' : 'Essential Exhibitor & Visitor Information');
  const cards = [
    {
      t: lang === 'zh' ? '免费入场与开放时间' : (lang === 'sw' ? 'Muda & Kiingilio' : 'Hours & Admission'),
      d: lang === 'zh' ? '每日 08:00 - 19:00 开放。采购观众与市民全程免费入场；参展商凭已付款二维码凭证核验入场。' : (lang === 'sw' ? 'Wazi kila siku 08:00 - 19:00. Wananchi na wanunuzi wanaingia BURE; washiriki wanatumia QR Pass iliyolipiwa.' : 'Open daily 08:00 - 19:00. Free admission for shoppers & buyers; exhibitors check in with verified Paid QR Pass.')
    },
    {
      t: lang === 'zh' ? '多城参展与安全码' : (lang === 'sw' ? 'Usalama wa Banda & PIN' : 'Booth Security & Multi-City Discount'),
      d: lang === 'zh' ? '预订超过2个城市立享15%优惠。缴费识别码下发后请保存6位安全PIN码，付款后即可解锁正式电子通行证。' : (lang === 'sw' ? 'Punguzo la 15% ukichagua mikoa 2+. Tunza PIN ya tarakimu 6 kufungua risiti yako na QR Pass pindi ukilipa.' : '15% automatic discount on 2+ regions. Keep your 6-digit Security PIN private; your TRA receipt & QR Pass unlock upon payment.')
    },
    {
      t: lang === 'zh' ? '组委会服务与资讯订阅' : (lang === 'sw' ? 'Msaada & Jarida la Habari' : '24/7 Support & Dispatch'),
      d: lang === 'zh' ? '客服专线 +255 767 053 250（电话与WhatsApp）。订阅官方通讯，第一时间掌握各省新巡展日期。' : (lang === 'sw' ? 'Piga au WhatsApp +255 767 053 250 muda wowote, au jiunge na jarida kupokea ratiba za mikoa.' : 'Call or WhatsApp +255 767 053 250 for assistance, or subscribe to receive upcoming regional dates.')
    }
  ];
  const subBtn = lang === 'zh' ? '订阅巡展资讯 →' : (lang === 'sw' ? 'Jiunge na Jarida →' : 'Subscribe for Updates →');
  const bookBtn = lang === 'zh' ? '前往预订展位 →' : (lang === 'sw' ? 'Hifadhi Banda Sasa →' : 'Book a Booth →');

  el.innerHTML = `
    <div class="rounded-3xl bg-[#08524f] text-white p-6 sm:p-8 space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h3 class="text-lg sm:text-xl font-extrabold uppercase tracking-wide">${escapeBookingHtml(hdr)}</h3>
        <div class="flex flex-wrap gap-2">
          <button type="button" onclick="switchSection('newsletter')" class="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition cursor-pointer">${escapeBookingHtml(subBtn)}</button>
          <button type="button" onclick="switchSection('booking')" class="px-4 py-2 rounded-xl bg-white text-[#08524f] hover:bg-emerald-50 text-xs font-extrabold transition cursor-pointer">${escapeBookingHtml(bookBtn)}</button>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${cards.map(c => `
          <div class="rounded-2xl bg-white/10 border border-white/15 p-4 space-y-1.5">
            <div class="text-sm font-extrabold text-emerald-200">${escapeBookingHtml(c.t)}</div>
            <p class="text-xs text-white/85 leading-relaxed">${escapeBookingHtml(c.d)}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function filterUpdates(typeKey) {
  appState.activeUpdateFilter = typeKey || 'ALL';
  document.querySelectorAll('.upd-pill[data-upd-filter]').forEach(btn => {
    const active = btn.getAttribute('data-upd-filter') === appState.activeUpdateFilter;
    btn.className = active
      ? 'upd-pill px-4 py-2 rounded-xl text-xs font-extrabold bg-[#0b6b68] text-white cursor-pointer'
      : 'upd-pill px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer';
  });
  renderAnnouncements();
}

function renderAnnouncements() {
  const filter = appState.activeUpdateFilter || 'ALL';
  const scheduleEl = document.getElementById('news-schedule-section');
  const galleryEl = document.getElementById('news-gallery-section');
  const annWrap = document.getElementById('announcements-wrapper');
  const essentialsEl = document.getElementById('news-essentials-section');

  if (scheduleEl) scheduleEl.classList.toggle('hidden', !(filter === 'ALL' || filter === 'EVENT'));
  if (galleryEl) galleryEl.classList.toggle('hidden', !(filter === 'ALL' || filter === 'GALLERY'));
  if (annWrap) annWrap.classList.toggle('hidden', filter === 'GALLERY');
  if (essentialsEl) essentialsEl.classList.toggle('hidden', filter === 'GALLERY');

  renderNewsScheduleSection();
  renderNewsGallerySection();
  renderNewsEssentialsSection();

  const list = document.getElementById('announcements-list');
  if (!list) return;

  const lang = appState.lang || 'en';
  const items = appState.announcements.filter(a => filter === 'ALL' || a.type === filter);
  const bookBtnText = lang === 'zh' ? '预订展位 →' : (lang === 'en' ? 'Book Booth →' : 'Hifadhi Banda →');

  list.innerHTML = items.map((ann, idx) => {
    const imgUrl = NEWS_CARD_IMAGES[idx % NEWS_CARD_IMAGES.length];
    let title = '';
    let summary = '';
    let region = '';
    let category = '';
    if (lang === 'zh') {
      title = ann.titleZh || ann.titleEn || ann.titleSw || ann.title || '最新展会动态';
      summary = ann.summaryZh || ann.summaryEn || ann.summarySw || ann.summary || '';
      region = ann.regionZh || ann.regionEn || ann.regionSw || ann.region || '全国各省';
      category = ann.categoryZh || ann.categoryEn || ann.categorySw || ann.category || '展会资讯';
    } else if (lang === 'en') {
      title = ann.titleEn || ann.titleSw || ann.title || 'Latest Festival Update';
      summary = ann.summaryEn || ann.summarySw || ann.summary || '';
      region = ann.regionEn || ann.regionSw || ann.region || 'All Regions';
      category = ann.categoryEn || ann.categorySw || ann.category || 'Official News';
    } else {
      title = ann.titleSw || ann.title || ann.titleEn || 'Taarifa Mpya ya Tamasha';
      summary = ann.summarySw || ann.summary || ann.summaryEn || '';
      region = ann.regionSw || ann.region || 'Mikoa Yote';
      category = ann.categorySw || ann.category || 'Habari Rasmi';
    }

    return `
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-sm">
        <div class="h-44 overflow-hidden bg-slate-100">
          <img src="${escapeBookingHtml(sanitizeMediaSrc(imgUrl))}" alt="${escapeBookingHtml(title)}" class="w-full h-full object-cover" />
        </div>
        <div class="p-5 space-y-2 flex-1 flex flex-col justify-between">
          <div class="space-y-1.5">
            <h4 class="text-base font-extrabold uppercase text-slate-900 leading-snug">${escapeBookingHtml(title)}</h4>
            <div class="text-xs font-semibold text-slate-400">${escapeBookingHtml(region)} • ${escapeBookingHtml(category)}</div>
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">${escapeBookingHtml(summary)}</p>
          </div>
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
            <span class="font-bold text-[#0b6b68]">+255 767 053 250</span>
            <button onclick="switchSection('booking')" class="px-3.5 py-1.5 rounded-lg bg-[#0b6b68] text-white font-extrabold hover:bg-[#08524f] transition">
              ${escapeBookingHtml(bookBtnText)}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function postNewAnnouncement() {
  const type = document.getElementById('ann-type').value || 'EVENT';
  const regionId = document.getElementById('ann-region-id').value;
  const scheduleStatus = document.getElementById('ann-schedule-status').value;
  const title = document.getElementById('ann-title').value;
  const summary = document.getElementById('ann-summary').value;
  if (!title) return;

  const regionObj = appState.regions.find(r => r.id === regionId);
  const regionName = regionObj ? regionObj.name : 'All Regions';

  try {
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        type,
        category: `${type} • ${regionName.toUpperCase()}`,
        region: regionName,
        regionId,
        scheduleStatus,
        title,
        summary
      })
    });
    if (res.status === 401) {
      appState.isAdminAuthenticated = false;
      renderAdminUIState();
      switchSection('login');
      return;
    }
    const result = await res.json();
    if (result.success) {
      appState.announcements = result.db.announcements;
      appState.regions = result.db.regions;
      document.getElementById('ann-title').value = '';
      document.getElementById('ann-summary').value = '';
      document.getElementById('ann-schedule-status').value = '';
      renderAll();
    }
  } catch (e) {
    // Fallback
  }
}

// ==========================================
// 5. VENDOR BOOKING & INTERACTIVE FLOOR MAP
// ==========================================
function syncBookingCitiesFromDestination() {
  const dest = appState.destination || {};
  const destId = String(dest.regionId || 'mwanza').trim().toLowerCase();
  const destName = String(dest.regionName || 'Mwanza').trim();
  const matchedRegion = (appState.regions || []).find(r =>
    String(r.id || '').trim().toLowerCase() === destId ||
    String(r.name || '').trim().toLowerCase() === destName.toLowerCase()
  );
  const activeCity = matchedRegion ? matchedRegion.name : (destName || 'Mwanza');
  const changed = appState.selectedBookingCities.length !== 1 || appState.selectedBookingCities[0] !== activeCity;
  appState.selectedBookingCities = [activeCity];

  if (changed && appState.selectedBoothCode) {
    const bookedSet = getBookedCodesForSelectedCities();
    const heldSet = getHeldCodesForSelectedCities();
    if (bookedSet.has(appState.selectedBoothCode) || heldSet.has(appState.selectedBoothCode)) {
      appState.selectedBoothCode = '';
    }
  }
}

function renderBookingConfigurator() {
  syncBookingCitiesFromDestination();

  const dest = appState.destination || {};
  const lang = appState.lang || 'en';
  const { regionDisplayName, venueDisplayName, datesDisplayName } = getLocalizedDestinationInfo(dest, lang);

  const cityLabelEl = document.getElementById('booking-dest-city-label');
  if (cityLabelEl) cityLabelEl.textContent = regionDisplayName;

  const dateLabelEl = document.getElementById('booking-dest-date-label');
  if (dateLabelEl) {
    dateLabelEl.textContent = datesDisplayName ? `• ${datesDisplayName}` : '';
  }

  const venueLabelEl = document.getElementById('booking-dest-venue-label');
  if (venueLabelEl) {
    venueLabelEl.textContent = venueDisplayName;
  }
}

function toggleCityInBooking() {
  syncBookingCitiesFromDestination();
  renderBookingConfigurator();
  renderFloorPlan();
  refreshBookingSummary();
  renderBookingWizardState();
}

function selectPackage(pkgId) {
  setBookingError('booking-step1-error', '');
  appState.selectedPackageId = pkgId;
  const pkg = appState.boothPackages.find(p => p.id === pkgId);
  if (pkg) {
    const zone = FLOORPLAN_ZONES.find(z => z.prefix === pkg.zonePrefix) || FLOORPLAN_ZONES[1];
    const bookedSet = getBookedCodesForSelectedCities();
    const heldSet = getHeldCodesForSelectedCities();
    const firstAvailable = zone.codes.find(code => !bookedSet.has(code) && !heldSet.has(code)) || '';
    appState.selectedBoothCode = firstAvailable;
  }
  renderBookingConfigurator();
  renderFloorPlan();
  refreshBookingSummary();
  renderBookingWizardState();
}

function getBookedCodesForSelectedCities() {
  const booked = new Set();
  const selectedLower = new Set(appState.selectedBookingCities.map(c => String(c || '').trim().toLowerCase()));
  const destIdLower = String(appState.destination?.regionId || '').trim().toLowerCase();

  appState.regions.forEach(region => {
    const regNameLower = String(region.name || '').trim().toLowerCase();
    const regIdLower = String(region.id || '').trim().toLowerCase();
    if ((selectedLower.has(regNameLower) || (destIdLower && regIdLower === destIdLower)) && Array.isArray(region.bookedCodes)) {
      region.bookedCodes.forEach(c => booked.add(c));
    }
  });

  (appState.bookings || []).forEach(b => {
    const st = String(b.status || '').toLowerCase();
    if (st === 'cancelled' || st === 'expired' || !b.boothCode) return;
    const cities = Array.isArray(b.cities) ? b.cities : [];
    const overlaps = cities.some(c => selectedLower.has(String(c || '').trim().toLowerCase()));
    if (overlaps) booked.add(b.boothCode);
  });

  return booked;
}

function getHeldCodesForSelectedCities() {
  const held = new Set();
  const now = Date.now();
  const myHold = appState.currentHold && Number(appState.currentHold.expiresAt || 0) > now ? appState.currentHold : null;

  (appState.activeHolds || []).forEach(hold => {
    if (!hold || Number(hold.expiresAt || 0) <= now) return;
    const citiesOverlap = (hold.cities || []).some(c => appState.selectedBookingCities.includes(c));
    if (!citiesOverlap) return;

    const isMine = Boolean(
      myHold &&
      myHold.boothCode === hold.boothCode &&
      (myHold.cities || []).some(c => appState.selectedBookingCities.includes(c))
    );
    if (!isMine) {
      held.add(hold.boothCode);
    }
  });
  return held;
}

function getAvailableBoothOptions(cities) {
  const targetCities = Array.isArray(cities) && cities.length ? cities : appState.selectedBookingCities;
  const booked = new Set();
  const held = new Set();
  const now = Date.now();

  appState.regions.forEach(region => {
    if (targetCities.includes(region.name) && Array.isArray(region.bookedCodes)) {
      region.bookedCodes.forEach(c => booked.add(c));
    }
  });
  (appState.activeHolds || []).forEach(h => {
    if (h && Number(h.expiresAt || 0) > now && (h.cities || []).some(c => targetCities.includes(c))) {
      held.add(h.boothCode);
    }
  });

  const options = [];
  FLOORPLAN_ZONES.forEach(zone => {
    zone.codes.forEach(code => {
      if (!booked.has(code) && !held.has(code)) {
        options.push({ code, zoneTitle: zone.zoneTitleEn || zone.zoneTitleSw });
      }
    });
  });
  return options;
}

function renderFloorPlan() {
  const container = document.getElementById('floorplan-grid');
  if (!container) return;

  const lang = appState.lang || 'en';
  const bookedSet = getBookedCodesForSelectedCities();
  const heldSet = getHeldCodesForSelectedCities();
  const myHoldCode = (appState.currentHold && Number(appState.currentHold.expiresAt || 0) > Date.now())
    ? appState.currentHold.boothCode
    : '';

  const totalBoothsCount = FLOORPLAN_ZONES.reduce((sum, z) => sum + z.codes.length, 0);
  const totalOpenCount = FLOORPLAN_ZONES.reduce(
    (sum, z) => sum + z.codes.filter(c => !bookedSet.has(c) && !heldSet.has(c)).length,
    0
  );
  const arenaSummaryText = lang === 'zh'
    ? `大型全展馆平面图 • 共 ${totalBoothsCount} 个标准展位`
    : (lang === 'en'
      ? `Large Exhibition Fairground • ${totalBoothsCount} Booth Spaces`
      : `Uwanja Mkubwa wa Maonyesho • Mabanda ${totalBoothsCount}`);
  const openBadgeText = lang === 'zh'
    ? `可选: ${totalOpenCount} / ${totalBoothsCount}`
    : (lang === 'en'
      ? `Open: ${totalOpenCount} / ${totalBoothsCount}`
      : `Wazi: ${totalOpenCount} / ${totalBoothsCount}`);

  const headerStrip = `
    <div class="px-3.5 py-2 rounded-xl bg-[#e6f3f2]/80 border border-[#0b6b68]/20 flex flex-wrap items-center justify-between gap-2 text-xs">
      <span class="font-extrabold text-[#08524f]">${arenaSummaryText}</span>
      <span class="px-2.5 py-0.5 rounded-full bg-white text-[#0b6b68] border border-[#0b6b68]/25 text-[11px] font-extrabold">${openBadgeText}</span>
    </div>
  `;

  container.innerHTML = headerStrip + FLOORPLAN_ZONES.map(zone => {
    let title = zone.zoneTitleSw;
    if (lang === 'zh') title = zone.zoneTitleZh || zone.zoneTitleSw;
    else if (lang === 'en') title = zone.zoneTitleEn || zone.zoneTitleSw;
    const zoneOpenCount = zone.codes.filter(c => !bookedSet.has(c) && !heldSet.has(c)).length;
    const zonePillText = lang === 'zh'
      ? `余 ${zoneOpenCount}/${zone.codes.length}`
      : (lang === 'en' ? `${zoneOpenCount}/${zone.codes.length} Open` : `Wazi ${zoneOpenCount}/${zone.codes.length}`);
    const zoneGridClass = zone.prefix === 'FOOD'
      ? 'grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-1.5'
      : (zone.prefix === 'SME'
        ? 'grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-10 gap-1.5'
        : 'grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-12 gap-1.5');
    return `
      <div class="p-3 sm:p-3.5 rounded-2xl bg-[#f4f7f6] border border-slate-200 space-y-2 overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="text-xs font-extrabold text-slate-700">${title}</div>
          <span class="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-[#0b6b68] shrink-0">${zonePillText}</span>
        </div>
        <div class="${zoneGridClass}">
          ${zone.codes.map(code => {
            const isBooked = bookedSet.has(code);
            const isHeld = !isBooked && heldSet.has(code);
            const isSelected = appState.selectedBoothCode === code && !isBooked && !isHeld;
            const isLockedMine = !isBooked && myHoldCode === code;

            let btnClass = 'bg-[#e6f3f2] border-[#0b6b68]/45 text-[#0b6b68] hover:bg-[#0b6b68] hover:text-white';
            if (isBooked) {
              btnClass = 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed line-through';
            } else if (isHeld) {
              btnClass = 'bg-amber-100 border-amber-300 text-amber-800 cursor-not-allowed';
            } else if (isLockedMine) {
              btnClass = 'bg-amber-600 border-2 border-slate-900 text-white font-extrabold shadow-sm';
            } else if (isSelected) {
              btnClass = 'bg-[#0b6b68] border-2 border-slate-900 text-white font-extrabold shadow-sm';
            }
            return `
              <button
                type="button"
                ${isBooked || isHeld ? 'disabled' : ''}
                onclick="selectBoothSlot('${code}', '${zone.prefix}')"
                class="booth-cell min-w-0 w-full py-1.5 px-1 rounded-lg border text-[10px] sm:text-[11px] font-bold text-center whitespace-nowrap leading-none overflow-hidden ${btnClass}"
              >
                ${code}${isHeld ? ' •' : ''}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function selectBoothSlot(code, prefix) {
  const bookedSet = getBookedCodesForSelectedCities();
  const heldSet = getHeldCodesForSelectedCities();
  if (bookedSet.has(code) || heldSet.has(code)) return;

  setBookingError('booking-step1-error', '');
  appState.selectedBoothCode = code;
  const matchingPkg = appState.boothPackages.find(p => p.zonePrefix === prefix);
  if (matchingPkg) {
    appState.selectedPackageId = matchingPkg.id;
  }
  renderBookingConfigurator();
  renderFloorPlan();
  refreshBookingSummary();
  renderBookingWizardState();

  // Hold the selected booth immediately so others cannot take it, WITHOUT starting the countdown until Payment (Step 3)
  acquireBoothHold({ startTimer: Number(appState.bookingStep || 1) === 3, silentNetworkError: true });
}

const EXHIBITOR_SESSION_KEY = 'tbf_guest_exhibitor_v1';
const BOOTH_HOLD_SESSION_KEY = 'tbf_booth_hold_v1';

const BOOKING_MSG = {
  sw: {
    noBoothSelected: 'Tafadhali chagua banda moja lililo wazi kwenye ramani kwanza kabla ya kuendelea.',
    boothUnavailableNow: 'Banda hilo limeshachukuliwa au limeshikwa kwa mkoa uliochagua. Chagua banda lingine lililo wazi.',
    step1PromptDefault: 'Bonyeza banda lolote lililo wazi hapa juu kuchagua.',
    step1SelectedPrefix: 'Umechagua Banda',
    btnNextStep2: 'Endelea: Jaza Taarifa →',
    btnNextStep3: 'Endelea: Malipo →',
    btnConfirmBooking: 'Thibitisha & Pata Control Number',
    holdBusy: 'Inalinda banda lako...',
    recapBoothLbl: 'Banda & Mikoa',
    recapBizLbl: 'Biashara & Simu',
    recapEditBooth: 'Badili Banda',
    recapEditInfo: 'Badili Taarifa',
    regMissing: 'Tafadhali jaza Jina la Biashara, Mwakilishi, Namba ya Simu sahihi, na Maelezo ya Bidhaa.',
    regPhoneInvalid: 'Weka namba ya simu sahihi (angalau tarakimu 9, mfano +255 7XX XXX XXX).',
    noCitiesSelected: 'Tafadhali chagua angalau mkoa mmoja katika Hatua ya 1 kabla ya kuendelea.',
    lookupMissing: 'Weka Kumbukumbu (Booking ID au Control Number) na Namba ya Simu iliyotumika kuweka booking.',
    lookupSearching: 'Inatafuta kumbukumbu zako...',
    lookupNotFound: 'Hakuna booking iliyopatikana kwa Kumbukumbu na Namba ya Simu hiyo. Hakikisha umeandika kwa usahihi.',
    lookupError: 'Hitilafu ya mtandao wakati wa kutafuta booking. Tafadhali jaribu tena.',
    lookupFoundLocked: 'MUHTASARI WA BOOKING (TAARIFA NYETI ZIMEFICHWA)',
    lookupFoundUnlocked: 'TIKETI KAMILI IMEFUNGULIWA (ACCESS VERIFIED)',
    lookupStatusPending: 'Inasubiri Malipo (Control Number Tayari)',
    lookupStatusPaid: 'Imelipiwa',
    lookupStatusExpired: 'Muda Umeisha (24h Expired)',
    lookupStatusCancelled: 'Imeghairiwa',
    pinUnlockHint: 'Weka Security Access PIN yako ya tarakimu 6 kufungua Control Number kamili, kuchapisha risiti, kubadilisha banda, au kughairi booking:',
    pinUnlockBtn: 'Fungua Risiti Kamili (Unlock)',
    pinMissing: 'Weka PIN ya usalama ya tarakimu 6 kwanza.',
    switchBoothLabel: 'Chagua Banda Jipya Linalopatikana:',
    switchBoothBtn: 'Badili Banda (Switch)',
    cancelBookingBtn: 'Ghairi Booking Hii (Cancel Unpaid)',
    confirmCancelMsg: 'Una uhakika unataka kughairi booking hii ambayo haijalipiwa? Banda litaachiwa kwa wafanyabiashara wengine.',
    printPass: 'Chapisha / Hifadhi Tiketi (Print)',
    saveReceiptNote: 'Hifadhi Control Number pamoja na Security Access PIN hii kuangalia risiti au kubadili banda muda wowote.',
    pinBoxTitle: 'SECURITY ACCESS PIN YAKO (TARAKIMU 6)',
    pinBoxWarning: 'Hifadhi namba hii kwa siri — itaombwa unapotaka kufungua Control Number kamili, kubadilisha banda, au kughairi.',
    holdActiveLabel: 'Muda wa Malipo:',
    holdReservedPendingPayment: 'Banda limetengwa kwako:',
    holdCountdownStartsAtPayment: 'Muda utaanza kuhesabika ukifika hatua ya Malipo',
    holdExpiredNotice: 'Muda wa kulipia banda umeisha, hivyo banda limeachiwa. Tafadhali chagua banda lililo wazi.',
    holdReleaseBtn: 'Achia Banda (Release)',
    holdNetworkWarn: 'Mtandao uko chini kwa muda — mfumo utaendelea kujaribu tena kiotomatiki.',
    holdRetryBtn: 'Jaribu Tena',
    submitNetworkError: 'Mtandao umekatika au uko chini sana wakati wa kuthibitisha. Hakikisha intaneti kisha jaribu tena — taarifa zako zimehifadhiwa.',
    offlineNotice: 'Huna intaneti kwa sasa — unaona nakala iliyohifadhiwa. Unganisha intaneti ili kuhifadhi banda.',
    syncNowBtn: 'Pakia Upya',
    modalQrTitle: 'QR Pass ya Banda',
    modalQrHint: 'Skani msimbo huu wa QR kupitia simu yako ili kuhakiki banda, Control Number na kibali cha kuingia.',
    downloadPassBtn: 'Pakua Pass (PNG)',
    qrLockedTitle: 'QR Pass Imefungwa',
    qrLockedHint: 'Kibali cha QR na kupakua vitafunguka pindi malipo yakithibitishwa.',
    downloadPaymentRequired: 'Huwezi kupakua QR Pass au risiti kabla ya kulipia. Tafadhali kamilisha malipo kwa Control Number yako kwanza.',
    verifyPaymentBtn: 'Nimeshalipa — Hakiki & Fungua Pass',
    checkingPaymentBtn: 'Inahakiki malipo...',
    paymentStillPendingMsg: 'Malipo bado hayajathibitishwa kwenye mfumo. Lipa kwa Control Number yako kisha bonyeza tena kuhakiki.',
    paymentUnlockedMsg: 'Malipo yamethibitishwa! Sasa unaweza kupakua QR Pass na risiti yako.',
    copyControlBtn: 'Nakili Control Number',
    copiedControlBtn: 'Imenakiliwa',
    paidBadgeLabel: 'Malipo Yamethibitishwa',
    paidModalTitle: 'QR Pass na Risiti ya Malipo',
    viewTraReceiptBtn: 'Fungua Risiti Kamili (TRA View) →',
    regEmailInvalid: 'Tafadhali weka Barua Pepe sahihi (mfano barua@kampuni.co.tz) ili uweze kuingia na kufungua risiti yako baadaye.',
    exLoginMissingRefOrPin: 'Weka PIN / Nenosiri AU Booking ID / Control Number pamoja na Barua Pepe.',
    exLoginNotFound: 'Taarifa za kuingia si sahihi.',
    exLoginLogoutBtn: 'Toka Kwenye Kipindi Hiki'
  },
  en: {
    noBoothSelected: 'Please select an available booth on the map first before continuing.',
    boothUnavailableNow: 'That booth was just taken or held for your selected region. Please pick another open booth.',
    step1PromptDefault: 'Click any open booth slot above to select.',
    step1SelectedPrefix: 'Selected Booth',
    btnNextStep2: 'Continue: Your Details →',
    btnNextStep3: 'Continue: Payment →',
    btnConfirmBooking: 'Confirm & Generate Control Number',
    holdBusy: 'Holding booth...',
    recapBoothLbl: 'Booth & Cities',
    recapBizLbl: 'Business & Phone',
    recapEditBooth: 'Change Booth',
    recapEditInfo: 'Edit Details',
    regMissing: 'Please enter Business Name, Contact Person, valid Phone Number, and Product Description.',
    regPhoneInvalid: 'Please enter a valid phone number (at least 9 digits, e.g. +255 7XX XXX XXX).',
    noCitiesSelected: 'Please select at least one tour city in Step 1 before continuing.',
    lookupMissing: 'Enter both your Booking ID / Control Number and the registered Phone Number.',
    lookupSearching: 'Searching for your booking...',
    lookupNotFound: 'No matching booking found for that ID / Control Number and Phone Number.',
    lookupError: 'Network error while looking up booking. Please try again.',
    lookupFoundLocked: 'BOOKING SUMMARY FOUND (SENSITIVE DETAILS MASKED)',
    lookupFoundUnlocked: 'FULL BOOKING PASS UNLOCKED (PIN VERIFIED)',
    lookupStatusPending: 'Awaiting Payment (Control Number Active)',
    lookupStatusPaid: 'Paid',
    lookupStatusExpired: 'Expired After 24h Unpaid',
    lookupStatusCancelled: 'Cancelled',
    pinUnlockHint: 'Enter your 6-digit Security Access PIN to reveal your full Control Number, print receipt, switch booth, or cancel reservation:',
    pinUnlockBtn: 'Unlock Full Details',
    pinMissing: 'Please enter your 6-digit Security Access PIN.',
    switchBoothLabel: 'Switch to Another Available Booth:',
    switchBoothBtn: 'Switch Booth',
    cancelBookingBtn: 'Cancel Unpaid Booking',
    confirmCancelMsg: 'Are you sure you want to cancel this unpaid booking? The booth will immediately be released to other exhibitors.',
    printPass: 'Print / Save Pass',
    saveReceiptNote: 'Keep your Control Number and 6-digit Access PIN to view your full receipt or change your booth anytime.',
    pinBoxTitle: 'YOUR 6-DIGIT SECURITY ACCESS PIN',
    pinBoxWarning: 'Save this PIN carefully — it is required to unlock your full Control Number, switch booths, or cancel.',
    holdActiveLabel: 'Payment Hold Timer:',
    holdReservedPendingPayment: 'Booth held for you:',
    holdCountdownStartsAtPayment: 'Countdown begins when you reach Payment',
    holdExpiredNotice: 'Your payment countdown expired and the booth was released. Please select an open booth.',
    holdReleaseBtn: 'Release Booth',
    holdNetworkWarn: 'Slow connection detected — your draft is safe and seat lock can retry.',
    holdRetryBtn: 'Retry Lock',
    submitNetworkError: 'Connection dropped while submitting due to weak internet. Check your connection and click Confirm again — your details are preserved.',
    offlineNotice: 'You appear to be offline — cached festival info is shown. Reconnect to reserve a booth.',
    syncNowBtn: 'Retry Sync',
    modalQrTitle: 'Booth QR Pass',
    modalQrHint: 'Scan this QR code on entry or to verify your reserved booth, Control Number & schedule.',
    downloadPassBtn: 'Download Pass (PNG)',
    qrLockedTitle: 'QR Pass Locked',
    qrLockedHint: 'QR Pass and Download unlock automatically once payment is confirmed.',
    downloadPaymentRequired: 'Download is disabled until payment is confirmed. Please complete payment with your Control Number first.',
    verifyPaymentBtn: 'I Have Paid — Verify & Unlock Pass',
    checkingPaymentBtn: 'Checking payment status...',
    paymentStillPendingMsg: 'Payment has not been confirmed by the system yet. Complete payment using your Control Number, then check again.',
    paymentUnlockedMsg: 'Payment confirmed! You can now download your QR Pass and paid receipt.',
    copyControlBtn: 'Copy Control Number',
    copiedControlBtn: 'Copied',
    paidBadgeLabel: 'Payment Confirmed',
    paidModalTitle: 'Your Booth QR Pass & Paid Receipt',
    viewTraReceiptBtn: 'Open Dedicated TRA Receipt →',
    regEmailInvalid: 'Please enter a valid Email Address (e.g. email@company.co.tz) so you can access your booth and TRA receipt later.',
    exLoginMissingRefOrPin: 'Please enter your PIN / Password or Booking ID / Control Number together with your Email.',
    exLoginNotFound: 'Invalid email, reference, or PIN/password.',
    exLoginLogoutBtn: 'Sign Out Session'
  },
  zh: {
    noBoothSelected: '请先在平面图上点击选择一个空闲展位，再进入下一步。',
    boothUnavailableNow: '该展位在所选城市刚被预订或临时锁定，请选择其他空闲展位。',
    step1PromptDefault: '请点击上方任意空闲展位编号进行选择。',
    step1SelectedPrefix: '已选展位',
    btnNextStep2: '下一步：填写企业资料 →',
    btnNextStep3: '下一步：选择付款 →',
    btnConfirmBooking: '确认预订并获取缴费识别码',
    holdBusy: '正在保留展位...',
    recapBoothLbl: '展位与城市',
    recapBizLbl: '企业与电话',
    recapEditBooth: '更换展位',
    recapEditInfo: '修改资料',
    regMissing: '请完整填写企业名称、联系人姓名、有效联系电话及主营产品简介。',
    regPhoneInvalid: '请输入有效的联系电话（至少9位数字，例如 +255 7XX XXX XXX）。',
    noCitiesSelected: '请在第一步中至少选择一个参展城市后再继续。',
    lookupMissing: '请输入您的预订编号或缴费识别码，以及登记时预留的手机号码。',
    lookupSearching: '正在查询预订记录...',
    lookupNotFound: '未找到与该编号及手机号匹配的预订信息，请核对后重试。',
    lookupError: '查询网络异常，请稍后重试。',
    lookupFoundLocked: '已查到预订摘要（敏感信息已脱敏隐藏）',
    lookupFoundUnlocked: '完整电子凭证已解锁（安全验证通过）',
    lookupStatusPending: '待支付（24小时内有效）',
    lookupStatusPaid: '已付款确认',
    lookupStatusExpired: '超时未支付已自动释放',
    lookupStatusCancelled: '已取消',
    pinUnlockHint: '请输入6位安全PIN码以解锁完整缴费识别码、打印收据、更换展位或取消未付款预订：',
    pinUnlockBtn: '验证PIN并解锁',
    pinMissing: '请先输入6位安全PIN码。',
    switchBoothLabel: '更换为其他可选展位：',
    switchBoothBtn: '确认调换展位',
    cancelBookingBtn: '取消未付款预订',
    confirmCancelMsg: '确定要取消此未付款预订吗？该展位将立即释放给其他参展商。',
    printPass: '打印 / 保存凭证',
    saveReceiptNote: '请妥善保管缴费识别码和6位安全PIN码，可随时查看完整凭证或更换展位。',
    pinBoxTitle: '您的6位安全查询PIN码',
    pinBoxWarning: '请务必保存此PIN码——用于解锁完整缴费识别码、调换展位或取消预订。',
    holdActiveLabel: '付款倒计时剩余：',
    holdReservedPendingPayment: '已为您锁定展位：',
    holdCountdownStartsAtPayment: '进入付款步骤后开始倒计时',
    holdExpiredNotice: '付款倒计时已结束，展位已自动释放。请重新选择空闲展位。',
    holdReleaseBtn: '释放展位',
    holdNetworkWarn: '当前网速较慢 — 您填写的内容已保留，可一键重试锁定展位。',
    holdRetryBtn: '重试锁定',
    submitNetworkError: '提交时网络连接中断或信号太弱，您的资料已保存，请检查网络后重新点击确认（不会重复下单）。',
    offlineNotice: '当前处于离线状态 — 正在显示缓存的展会信息。重新联网后即可预订展位。',
    syncNowBtn: '重新同步',
    modalQrTitle: '展位二维码电子通行证',
    modalQrHint: '现场扫码核验参展展位编号、缴费控制号与入场资格。',
    downloadPassBtn: '下载通行证 (PNG)',
    qrLockedTitle: '二维码尚未解锁',
    qrLockedHint: '完成缴费并由系统确认到账后，即可查看并下载参展二维码。',
    downloadPaymentRequired: '未付款前无法下载通行证与收据。请先使用缴费识别码完成付款。',
    verifyPaymentBtn: '我已付款 — 核验并解锁通行证',
    checkingPaymentBtn: '正在核验付款状态...',
    paymentStillPendingMsg: '系统尚未确认到账。请使用缴费识别码付款后再点击核验。',
    paymentUnlockedMsg: '付款已确认！您现在可以下载电子通行证与付款收据。',
    copyControlBtn: '复制缴费识别码',
    copiedControlBtn: '已复制',
    paidBadgeLabel: '付款已确认',
    paidModalTitle: '您的展位电子通行证与已付款收据',
    viewTraReceiptBtn: '打开专用小票页面 →',
    regEmailInvalid: '请输入有效的电子邮箱（例如 email@company.co.tz），以便日后登录查看展位与电子收据。',
    exLoginMissingRefOrPin: '请与电子邮箱一同填写 PIN 码 / 密码，或预订编号 / 缴费识别码。',
    exLoginNotFound: '电子邮箱、编号或 PIN 码/密码不正确。',
    exLoginLogoutBtn: '退出当前查看'
  }
};

function escapeBookingHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setGateTabStyle(btn, isActive) {
  if (!btn) return;
  btn.className = isActive
    ? 'py-3 px-4 rounded-xl bg-[#0b6b68] text-white font-extrabold text-xs sm:text-sm transition shadow-sm cursor-pointer'
    : 'py-3 px-4 rounded-xl bg-transparent text-slate-700 hover:text-slate-900 font-bold text-xs sm:text-sm transition cursor-pointer';
}

function syncFormFromExhibitor(reg) {
  if (!reg) return;
  const fieldMap = {
    'form-biz-name': reg.businessName || '',
    'form-contact-person': reg.contactPerson || '',
    'form-phone': reg.phone || '',
    'form-tagline': reg.tagline || '',
    'form-email': reg.email || ''
  };
  Object.entries(fieldMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = val;
  });
  const sectorEl = document.getElementById('form-sector');
  if (sectorEl && reg.sector) sectorEl.value = reg.sector;
}

function initExhibitorSession() {
  try {
    const raw = sessionStorage.getItem(EXHIBITOR_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        appState.registeredExhibitor = parsed;
        syncFormFromExhibitor(parsed);
      }
    }
  } catch (err) {
    appState.registeredExhibitor = null;
  }
  renderBookingGateState();
}

function initHoldSession() {
  try {
    const raw = sessionStorage.getItem(BOOTH_HOLD_SESSION_KEY);
    if (!raw) {
      renderHoldBanner();
      return;
    }
    const parsed = JSON.parse(raw);
    if (parsed && parsed.holdToken && Number(parsed.expiresAt || 0) > Date.now()) {
      const stillActive = (appState.activeHolds || []).some(
        h => h.boothCode === parsed.boothCode && Number(h.expiresAt || 0) > Date.now()
      );
      if (stillActive) {
        appState.currentHold = parsed;
        if (parsed.boothCode) appState.selectedBoothCode = parsed.boothCode;
        if (Number(appState.bookingStep || 1) === 3) {
          startHoldCountdown();
        } else {
          stopHoldCountdown();
        }
        renderHoldBanner();
        renderFloorPlan();
        refreshBookingSummary();
        return;
      }
    }
  } catch (err) {
    // Ignore storage error
  }
  clearHoldState();
}

function stopHoldCountdown() {
  if (holdCountdownInterval) {
    clearInterval(holdCountdownInterval);
    holdCountdownInterval = null;
  }
}

function clearHoldState() {
  appState.currentHold = null;
  stopHoldCountdown();
  try {
    sessionStorage.removeItem(BOOTH_HOLD_SESSION_KEY);
  } catch (err) {
    // Ignore
  }
  renderHoldBanner();
}

function startHoldCountdown() {
  stopHoldCountdown();
  if (Number(appState.bookingStep || 1) !== 3) return;
  holdCountdownInterval = setInterval(async () => {
    if (Number(appState.bookingStep || 1) !== 3) {
      stopHoldCountdown();
      renderHoldBanner();
      return;
    }
    if (!appState.currentHold || Number(appState.currentHold.expiresAt || 0) <= Date.now()) {
      const msg = BOOKING_MSG[appState.lang] || BOOKING_MSG.en;
      await releaseBoothHold({ clearSelection: true });
      appState.bookingStep = 1;
      renderBookingWizardState();
      setBookingError('booking-step1-error', msg.holdExpiredNotice);
      renderHoldBanner(msg.holdExpiredNotice, true);
      return;
    }
    renderHoldBanner();
  }, 1000);
}

function renderHoldBanner(noticeText, isError) {
  const banner = document.getElementById('booking-hold-banner');
  if (!banner) return;
  const msg = BOOKING_MSG[appState.lang] || BOOKING_MSG.en;

  if (noticeText) {
    banner.className = `rounded-2xl ${isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-300 text-amber-900'} border px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold`;
    banner.innerHTML = `<span>${escapeBookingHtml(noticeText)}</span>`;
    banner.classList.remove('hidden');
    return;
  }

  const hold = appState.currentHold;
  if (!hold || Number(hold.expiresAt || 0) <= Date.now()) {
    banner.classList.add('hidden');
    banner.innerHTML = '';
    return;
  }

  const isPaymentStep = Number(appState.bookingStep || 1) === 3;
  if (!isPaymentStep) {
    banner.className = 'max-w-5xl mx-auto rounded-2xl bg-[#e6f3f2] border border-[#0b6b68]/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-[#08524f]';
    banner.innerHTML = `
      <div class="flex flex-wrap items-center gap-2">
        <span>${escapeBookingHtml(msg.holdReservedPendingPayment)}</span>
        <span class="px-2.5 py-0.5 rounded-lg bg-[#0b6b68] text-white font-mono">#${escapeBookingHtml(hold.boothCode)}</span>
        <span class="font-normal text-slate-600">(${escapeBookingHtml((hold.cities || []).join(', '))}) • ${escapeBookingHtml(msg.holdCountdownStartsAtPayment)}</span>
      </div>
      <button type="button" onclick="releaseBoothHold()" class="px-3 py-1 rounded-lg bg-white border border-[#0b6b68]/30 hover:bg-[#0b6b68] hover:text-white text-[#0b6b68] font-bold text-xs transition cursor-pointer">
        ${escapeBookingHtml(msg.holdReleaseBtn)}
      </button>
    `;
    banner.classList.remove('hidden');
    return;
  }

  const secLeft = Math.max(0, Math.floor((Number(hold.expiresAt) - Date.now()) / 1000));
  const mm = String(Math.floor(secLeft / 60)).padStart(2, '0');
  const ss = String(secLeft % 60).padStart(2, '0');

  banner.className = 'max-w-5xl mx-auto rounded-2xl bg-amber-50 border border-amber-300 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-amber-900';
  banner.innerHTML = `
    <div class="flex items-center gap-2">
      <span>${escapeBookingHtml(msg.holdActiveLabel)}</span>
      <span class="px-2.5 py-0.5 rounded-lg bg-amber-600 text-white font-mono">#${escapeBookingHtml(hold.boothCode)}</span>
      <span class="font-mono text-amber-950" id="hold-countdown-clock">${mm}:${ss}</span>
      <span class="font-normal text-amber-800">(${escapeBookingHtml((hold.cities || []).join(', '))})</span>
    </div>
    <button type="button" onclick="releaseBoothHold()" class="px-3 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold text-xs transition cursor-pointer">
      ${escapeBookingHtml(msg.holdReleaseBtn)}
    </button>
  `;
  banner.classList.remove('hidden');
}

function setBookingError(boxId, text) {
  const errBox = document.getElementById(boxId);
  if (!errBox) return;
  if (!text) {
    errBox.classList.add('hidden');
    errBox.textContent = '';
    return;
  }
  errBox.textContent = text;
  errBox.classList.remove('hidden');
  errBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearAllBookingErrors() {
  setBookingError('booking-step1-error', '');
  setBookingError('booking-step2-error', '');
  setBookingError('booking-checkout-error', '');
}

function hasMatchingActiveHold() {
  const h = appState.currentHold;
  if (!h || Number(h.expiresAt || 0) <= Date.now()) return false;
  if (h.boothCode !== appState.selectedBoothCode) return false;
  const hCities = [...(h.cities || [])].sort().join('|');
  const sCities = [...(appState.selectedBookingCities || [])].sort().join('|');
  return hCities === sCities;
}

async function acquireBoothHold(options = {}) {
  const { startTimer = false, silentNetworkError = false } = options;
  const msg = BOOKING_MSG[appState.lang] || BOOKING_MSG.en;
  if (!appState.selectedBookingCities.length) {
    renderHoldBanner(msg.noCitiesSelected, true);
    return false;
  }
  if (!appState.selectedBoothCode) {
    setBookingError('booking-step1-error', msg.noBoothSelected);
    return false;
  }

  const requestedCode = appState.selectedBoothCode;
  try {
    const res = await fetchWithRetry('/api/bookings/hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        boothCode: requestedCode,
        cities: appState.selectedBookingCities,
        holdToken: appState.currentHold?.holdToken || ''
      })
    }, { retries: 2, timeoutMs: 10000 });
    const data = await res.json();
    if (!res.ok || !data.success) {
      const errMsg = data.error || msg.boothUnavailableNow;
      renderHoldBanner(errMsg, true);
      setBookingError('booking-step1-error', errMsg);
      if (res.status === 409) {
        appState.selectedBoothCode = '';
        const refreshRes = await fetchWithRetry('/api/data', { cache: 'no-store' }, { retries: 1, timeoutMs: 8000 }).catch(() => null);
        if (refreshRes && refreshRes.ok) {
          const fresh = await refreshRes.json();
          appState.regions = fresh.regions || appState.regions;
          appState.activeHolds = fresh.activeHolds || [];
          renderFloorPlan();
          refreshBookingSummary();
          renderBookingWizardState();
        }
      }
      return false;
    }

    // If user rapidly clicked a newer booth while an earlier fetch resolved, keep latest selection in sync
    if (appState.selectedBoothCode && appState.selectedBoothCode !== requestedCode) {
      return false;
    }

    appState.currentHold = data.hold;
    if (data.db) {
      appState.regions = data.db.regions || appState.regions;
      appState.activeHolds = data.db.activeHolds || [];
    }
    try {
      sessionStorage.setItem(BOOTH_HOLD_SESSION_KEY, JSON.stringify(data.hold));
    } catch (e) {
      // Ignore storage quota
    }
    if (startTimer && Number(appState.bookingStep || 1) === 3) {
      startHoldCountdown();
    } else {
      stopHoldCountdown();
    }
    renderHoldBanner();
    renderFloorPlan();
    refreshBookingSummary();
    return true;
  } catch (err) {
    if (silentNetworkError) {
      // Keep user's chosen booth & offer a friendly retry pill on low 2G/3G networks
      const banner = document.getElementById('booking-hold-banner');
      if (banner) {
        banner.className = 'max-w-5xl mx-auto rounded-2xl bg-amber-50 border border-amber-300 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-amber-900';
        banner.innerHTML = `
          <span>${escapeBookingHtml(msg.holdNetworkWarn)}</span>
          <button type="button" onclick="acquireBoothHold({ startTimer: Number(appState.bookingStep || 1) === 3 })" class="px-3 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold text-xs cursor-pointer">${escapeBookingHtml(msg.holdRetryBtn)}</button>
        `;
        banner.classList.remove('hidden');
      }
    } else {
      renderHoldBanner(msg.holdNetworkWarn, true);
      setBookingError('booking-step1-error', msg.holdNetworkWarn);
    }
    return false;
  }
}

async function releaseBoothHold(options = {}) {
  const { clearSelection = true } = options;
  const holdToken = appState.currentHold?.holdToken;
  if (clearSelection) {
    appState.selectedBoothCode = '';
  }
  clearHoldState();
  if (!holdToken) {
    renderFloorPlan();
    refreshBookingSummary();
    renderBookingWizardState();
    return;
  }
  try {
    await fetch('/api/bookings/hold', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ holdToken })
    });
    const refreshRes = await fetch('/api/data');
    if (refreshRes.ok) {
      const fresh = await refreshRes.json();
      appState.regions = fresh.regions || appState.regions;
      appState.activeHolds = fresh.activeHolds || [];
    }
  } catch (err) {
    // Ignore network issue on cleanup
  }
  renderFloorPlan();
  refreshBookingSummary();
  renderBookingWizardState();
}

function validateBookingStep1() {
  const msg = BOOKING_MSG[appState.lang] || BOOKING_MSG.en;
  if (!appState.selectedBookingCities.length) {
    setBookingError('booking-step1-error', msg.noCitiesSelected);
    return false;
  }
  if (!appState.selectedBoothCode) {
    setBookingError('booking-step1-error', msg.noBoothSelected);
    return false;
  }
  const bookedSet = getBookedCodesForSelectedCities();
  const heldSet = getHeldCodesForSelectedCities();
  if (bookedSet.has(appState.selectedBoothCode) || heldSet.has(appState.selectedBoothCode)) {
    appState.selectedBoothCode = '';
    renderFloorPlan();
    refreshBookingSummary();
    renderBookingWizardState();
    setBookingError('booking-step1-error', msg.boothUnavailableNow);
    return false;
  }
  return true;
}

function validateBookingStep2() {
  const msg = BOOKING_MSG[appState.lang] || BOOKING_MSG.en;
  const businessName = (document.getElementById('form-biz-name')?.value || '').trim();
  const contactPerson = (document.getElementById('form-contact-person')?.value || '').trim();
  const phone = (document.getElementById('form-phone')?.value || '').trim();
  const tagline = (document.getElementById('form-tagline')?.value || '').trim();
  const email = (document.getElementById('form-email')?.value || '').trim();

  if (!businessName || !contactPerson || !phone || !tagline) {
    setBookingError('booking-step2-error', msg.regMissing);
    const firstEmpty = !businessName ? 'form-biz-name' : (!contactPerson ? 'form-contact-person' : (!phone ? 'form-phone' : 'form-tagline'));
    document.getElementById(firstEmpty)?.focus();
    return false;
  }
  if (phone.replace(/\D/g, '').length < 9) {
    setBookingError('booking-step2-error', msg.regPhoneInvalid);
    document.getElementById('form-phone')?.focus();
    return false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setBookingError('booking-step2-error', msg.regEmailInvalid);
    document.getElementById('form-email')?.focus();
    return false;
  }
  return true;
}

function renderBookingWizardState() {
  const step = Number(appState.bookingStep || 1);
  const lang = appState.lang || 'en';
  const msg = BOOKING_MSG[lang] || BOOKING_MSG.en;

  [1, 2, 3].forEach(n => {
    const panel = document.getElementById(`booking-wizard-step-${n}`);
    if (panel) panel.classList.toggle('hidden', step !== n);

    const pill = document.getElementById(`wizard-pill-${n}`);
    if (pill) {
      const numEl = pill.querySelector('.wizard-num');
      const txtEl = pill.querySelector('.wizard-txt');
      if (n === step) {
        if (numEl) {
          numEl.className = 'wizard-num w-7 h-7 rounded-full bg-[#0b6b68] text-white text-xs font-extrabold flex items-center justify-center shrink-0';
          numEl.textContent = String(n);
        }
        if (txtEl) txtEl.className = 'wizard-txt text-xs sm:text-sm font-extrabold text-[#0b6b68]';
      } else if (n < step) {
        if (numEl) {
          numEl.className = 'wizard-num w-7 h-7 rounded-full bg-[#e6f3f2] text-[#0b6b68] border border-[#0b6b68] text-xs font-extrabold flex items-center justify-center shrink-0';
          numEl.textContent = '✓';
        }
        if (txtEl) txtEl.className = 'wizard-txt text-xs sm:text-sm font-bold text-slate-800';
      } else {
        if (numEl) {
          numEl.className = 'wizard-num w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-xs font-extrabold flex items-center justify-center shrink-0';
          numEl.textContent = String(n);
        }
        if (txtEl) txtEl.className = 'wizard-txt text-xs sm:text-sm font-bold text-slate-500';
      }
    }
  });

  const hintEl = document.getElementById('step1-selection-hint');
  const next1Btn = document.getElementById('btn-step1-next');
  const pkg = appState.boothPackages.find(p => p.id === appState.selectedPackageId) || appState.boothPackages[0];
  if (hintEl) {
    if (appState.selectedBoothCode) {
      hintEl.className = 'text-xs sm:text-sm font-extrabold text-[#0b6b68]';
      hintEl.textContent = `${msg.step1SelectedPrefix} #${appState.selectedBoothCode} (${pkg ? formatTZS(pkg.price) : ''})`;
    } else {
      hintEl.className = 'text-xs sm:text-sm font-semibold text-slate-500';
      hintEl.textContent = msg.step1PromptDefault;
    }
  }
  if (next1Btn) {
    next1Btn.className = appState.selectedBoothCode
      ? 'px-6 py-3 rounded-2xl bg-[#0b6b68] hover:bg-[#08524f] text-white font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer shrink-0'
      : 'px-6 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-xs sm:text-sm transition cursor-pointer shrink-0';
  }

  const sumBtn = document.getElementById('btn-summary-action');
  if (sumBtn) {
    if (step === 1) {
      sumBtn.textContent = msg.btnNextStep2;
      sumBtn.className = appState.selectedBoothCode
        ? 'w-full py-3.5 rounded-2xl bg-[#0b6b68] hover:bg-[#08524f] text-white font-extrabold text-sm shadow-md transition cursor-pointer'
        : 'w-full py-3.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-sm transition cursor-pointer';
    } else if (step === 2) {
      sumBtn.textContent = msg.btnNextStep3;
      sumBtn.className = 'w-full py-3.5 rounded-2xl bg-[#0b6b68] hover:bg-[#08524f] text-white font-extrabold text-sm shadow-md transition cursor-pointer';
    } else {
      sumBtn.textContent = msg.btnConfirmBooking;
      sumBtn.className = 'w-full py-3.5 rounded-2xl bg-[#0b6b68] hover:bg-[#08524f] text-white font-extrabold text-sm shadow-md transition cursor-pointer';
    }
  }

  const recapEl = document.getElementById('step3-recap-card');
  if (recapEl && step === 3) {
    const biz = (document.getElementById('form-biz-name')?.value || '-').trim();
    const ph = (document.getElementById('form-phone')?.value || '-').trim();
    const citiesStr = appState.selectedBookingCities.join(', ');
    recapEl.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div>
          <div class="text-[11px] font-bold uppercase text-slate-500">${escapeBookingHtml(msg.recapBoothLbl)}</div>
          <div class="font-extrabold text-slate-900 mt-0.5">#${escapeBookingHtml(appState.selectedBoothCode)} • ${escapeBookingHtml(citiesStr)}</div>
        </div>
        <button type="button" onclick="goToBookingStep(1)" class="text-[11px] font-extrabold text-[#0b6b68] hover:underline shrink-0 cursor-pointer">${escapeBookingHtml(msg.recapEditBooth)}</button>
      </div>
      <div class="flex items-start justify-between gap-2 sm:border-l sm:border-slate-200 sm:pl-4">
        <div>
          <div class="text-[11px] font-bold uppercase text-slate-500">${escapeBookingHtml(msg.recapBizLbl)}</div>
          <div class="font-extrabold text-slate-900 mt-0.5">${escapeBookingHtml(biz)} • ${escapeBookingHtml(ph)}</div>
        </div>
        <button type="button" onclick="goToBookingStep(2)" class="text-[11px] font-extrabold text-[#0b6b68] hover:underline shrink-0 cursor-pointer">${escapeBookingHtml(msg.recapEditInfo)}</button>
      </div>
    `;
  }
}

async function goToBookingStep(targetStep) {
  clearAllBookingErrors();
  const desired = Number(targetStep || 1);
  const current = Number(appState.bookingStep || 1);
  const msg = BOOKING_MSG[appState.lang] || BOOKING_MSG.en;

  if (desired <= 1) {
    appState.bookingStep = 1;
    stopHoldCountdown();
    renderHoldBanner();
    refreshBookingSummary();
    renderBookingWizardState();
    return;
  }

  if (desired < current) {
    appState.bookingStep = desired;
    stopHoldCountdown();
    renderHoldBanner();
    refreshBookingSummary();
    renderBookingWizardState();
    return;
  }

  if (!validateBookingStep1()) {
    appState.bookingStep = 1;
    stopHoldCountdown();
    renderHoldBanner();
    renderBookingWizardState();
    return;
  }

  if (desired === 2) {
    if (!hasMatchingActiveHold()) {
      const next1 = document.getElementById('btn-step1-next');
      const sumBtn = document.getElementById('btn-summary-action');
      const prev1 = next1?.textContent;
      if (next1) { next1.disabled = true; next1.textContent = msg.holdBusy; }
      if (sumBtn) { sumBtn.disabled = true; sumBtn.textContent = msg.holdBusy; }
      const locked = await acquireBoothHold({ startTimer: false });
      if (next1) { next1.disabled = false; if (prev1) next1.textContent = prev1; }
      if (sumBtn) { sumBtn.disabled = false; }
      if (!locked) {
        appState.bookingStep = 1;
        renderBookingWizardState();
        return;
      }
    }
    appState.bookingStep = 2;
    stopHoldCountdown();
    renderHoldBanner();
    renderBookingWizardState();
    document.getElementById('booking-panel-book')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  if (!validateBookingStep2()) {
    appState.bookingStep = 2;
    stopHoldCountdown();
    renderHoldBanner();
    renderBookingWizardState();
    return;
  }

  try {
    sessionStorage.setItem(EXHIBITOR_SESSION_KEY, JSON.stringify({
      businessName: (document.getElementById('form-biz-name')?.value || '').trim(),
      contactPerson: (document.getElementById('form-contact-person')?.value || '').trim(),
      phone: (document.getElementById('form-phone')?.value || '').trim(),
      sector: (document.getElementById('form-sector')?.value || '').trim(),
      tagline: (document.getElementById('form-tagline')?.value || '').trim(),
      email: (document.getElementById('form-email')?.value || '').trim()
    }));
  } catch (e) {
    // Ignore storage quota
  }

  // Enter Step 3 (Payment): refresh/acquire hold and START countdown timer now!
  appState.bookingStep = 3;
  const sumBtn = document.getElementById('btn-summary-action');
  if (sumBtn) { sumBtn.disabled = true; sumBtn.textContent = msg.holdBusy; }
  const locked = await acquireBoothHold({ startTimer: true });
  if (sumBtn) { sumBtn.disabled = false; }
  if (!locked) {
    appState.bookingStep = 1;
    stopHoldCountdown();
    renderHoldBanner();
    renderBookingWizardState();
    return;
  }
  renderHoldBanner();
  renderBookingWizardState();
  document.getElementById('booking-panel-book')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function selectPaymentMethod(methodValue, btnEl) {
  const hiddenInput = document.getElementById('form-payment');
  if (hiddenInput) hiddenInput.value = methodValue;
  const grid = document.getElementById('payment-cards-grid');
  if (!grid) return;
  grid.querySelectorAll('button[data-pay]').forEach(btn => {
    const isActive = btn === btnEl || btn.dataset.pay === methodValue;
    btn.className = isActive
      ? 'p-4 rounded-2xl border-2 border-[#0b6b68] bg-[#e6f3f2] text-left space-y-1 transition cursor-pointer'
      : 'p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#0b6b68] text-left space-y-1 transition cursor-pointer';
  });
}

function handleSummaryPrimaryAction() {
  const step = Number(appState.bookingStep || 1);
  if (step === 1) return goToBookingStep(2);
  if (step === 2) return goToBookingStep(3);
  return submitVendorBooking();
}

function switchBookingGateMode(mode) {
  const isRetrieve = mode === 'retrieve';
  const bookBtn = document.getElementById('booking-tab-btn-book');
  const retBtn = document.getElementById('booking-tab-btn-retrieve');
  const bookPanel = document.getElementById('booking-panel-book');
  const retPanel = document.getElementById('booking-panel-retrieve');

  setGateTabStyle(bookBtn, !isRetrieve);
  setGateTabStyle(retBtn, isRetrieve);

  if (bookPanel) bookPanel.classList.toggle('hidden', isRetrieve);
  if (retPanel) retPanel.classList.toggle('hidden', !isRetrieve);
  clearAllBookingErrors();
}

function renderBookingGateState() {
  const bookPanel = document.getElementById('booking-panel-book');
  const retPanel = document.getElementById('booking-panel-retrieve');
  if (bookPanel && retPanel && bookPanel.classList.contains('hidden') && retPanel.classList.contains('hidden')) {
    switchBookingGateMode('book');
  }
  renderBookingConfigurator();
  renderFloorPlan();
  renderHoldBanner();
  refreshBookingSummary();
  renderBookingWizardState();
}

window.goToBookingStep = goToBookingStep;
window.selectPaymentMethod = selectPaymentMethod;
window.handleSummaryPrimaryAction = handleSummaryPrimaryAction;

function isBookingPaidStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  return s === 'paid' || s === 'confirmed';
}

function renderLockedQrCardHtml(boothCode, msg) {
  return `
    <div class="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-dashed border-amber-300 text-center space-y-2 w-full">
      <div class="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
        </svg>
      </div>
      <span class="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-extrabold">#${escapeBookingHtml(boothCode || '--')}</span>
      <div class="text-[11px] font-extrabold text-slate-800">${escapeBookingHtml(msg.qrLockedTitle)}</div>
      <p class="text-[10px] text-slate-500 leading-snug max-w-[190px]">${escapeBookingHtml(msg.qrLockedHint)}</p>
    </div>
  `;
}

function getBookingStatusPresentation(status, msg) {
  const s = String(status || '').toLowerCase();
  if (s === 'paid' || s === 'confirmed') {
    return { label: msg.lookupStatusPaid, cls: 'bg-emerald-600' };
  }
  if (s === 'expired') {
    return { label: msg.lookupStatusExpired, cls: 'bg-slate-600' };
  }
  if (s === 'cancelled') {
    return { label: msg.lookupStatusCancelled, cls: 'bg-red-600' };
  }
  return { label: msg.lookupStatusPending, cls: 'bg-[#0b6b68]' };
}

function renderLookupResultCard(b, rawResponse, actionNotice, actionError, targetBoxId = 'retrieve-result-box') {
  const box = document.getElementById(targetBoxId || 'retrieve-result-box');
  if (!box || !b) return;
  box.classList.remove('hidden');
  const isLoginPortalBox = targetBoxId === 'exhibitor-login-result';
  const msg = BOOKING_MSG[appState.lang] || BOOKING_MSG.en;
  const st = getBookingStatusPresentation(b.status, msg);
  const citiesList = Array.isArray(b.cities) ? b.cities.join(', ') : '';
  const isUnmasked = Boolean(b.unmasked);
  const isPaid = isBookingPaidStatus(b.status);
  const stepUpRequired = Boolean(b.stepUpRequired);
  const canManage = isUnmasked && !['paid', 'confirmed', 'expired', 'cancelled'].includes(String(b.status || '').toLowerCase());

  const availOptions = canManage ? getAvailableBoothOptions(b.cities || []) : [];
  const boothOptionsHtml = availOptions.length
    ? availOptions.map(o => `<option value="${escapeBookingHtml(o.code)}">#${escapeBookingHtml(o.code)} (${escapeBookingHtml(o.zoneTitle)})</option>`).join('')
    : `<option value="">-- No spare booth available --</option>`;

  box.innerHTML = `
    <div class="rounded-2xl border-2 border-[#0b6b68] bg-[#f6fbfa] p-5 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#0b6b68]/20 pb-3">
        <span class="text-xs font-extrabold uppercase tracking-wider text-[#0b6b68]">
          ${escapeBookingHtml(isUnmasked ? msg.lookupFoundUnlocked : msg.lookupFoundLocked)}
        </span>
        <span class="px-3 py-1 rounded-full ${st.cls} text-white text-[11px] font-extrabold">
          ${escapeBookingHtml(st.label)}
        </span>
      </div>

      ${actionNotice ? `<div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">${escapeBookingHtml(actionNotice)}</div>` : ''}
      ${actionError ? `<div class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">${escapeBookingHtml(actionError)}</div>` : ''}

      <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        <div class="${isUnmasked ? 'sm:col-span-8' : 'sm:col-span-12'} grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div><span class="text-slate-500">Booking ID:</span> <strong class="font-mono text-[#0b6b68]">${escapeBookingHtml(b.id)}</strong></div>
          <div><span class="text-slate-500">Control Number:</span> <strong class="font-mono text-slate-900">${escapeBookingHtml(b.controlNumber || '-')}</strong></div>
          <div><span class="text-slate-500">Business:</span> <strong>${escapeBookingHtml(b.businessName)}</strong></div>
          <div><span class="text-slate-500">Contact:</span> <strong>${escapeBookingHtml(b.contactPerson || '-')} (${escapeBookingHtml(b.phone || '-')})</strong></div>
          <div><span class="text-slate-500">Booth:</span> <strong>${escapeBookingHtml(b.packageName)} (#${escapeBookingHtml(b.boothCode)})</strong></div>
          <div><span class="text-slate-500">Total:</span> <strong class="text-[#0b6b68]">${escapeBookingHtml(formatTZS(b.totalAmount || 0))}</strong></div>
          <div class="sm:col-span-2"><span class="text-slate-500">Tour Cities:</span> <strong>${escapeBookingHtml(citiesList)}</strong></div>
        </div>
        ${isUnmasked ? (isPaid ? `
          <div class="sm:col-span-4 flex flex-col items-center justify-center p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
            ${generateTbfQrSvg(`TBF-PASS|ID:${b.id}|CN:${b.controlNumber || ''}|BOOTH:${b.boothCode}|CITIES:${citiesList}|BIZ:${b.businessName}`, 108)}
            <span class="text-[9px] font-extrabold uppercase tracking-wider text-[#0b6b68]">${escapeBookingHtml(msg.modalQrTitle)}</span>
          </div>
        ` : `<div class="sm:col-span-4">${renderLockedQrCardHtml(b.boothCode, msg)}</div>`) : ''}
      </div>

      ${stepUpRequired ? `
        <div class="p-4 rounded-xl bg-white border border-amber-300 space-y-3">
          <div class="text-xs font-bold text-slate-700">${escapeBookingHtml(msg.pinUnlockHint)}</div>
          <div id="retrieve-stepup-error" class="hidden p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold"></div>
          <div class="flex flex-wrap gap-2">
            <input id="retrieve-pin-input" type="password" inputmode="numeric" maxlength="6" placeholder="PIN (6 digits)" class="flex-1 min-w-[160px] px-3.5 py-2 rounded-xl bg-[#f4f7f6] border border-slate-300 text-sm font-mono tracking-widest focus:outline-none focus:border-[#0b6b68]" />
            <button type="button" onclick="unlockBookingWithPin()" class="px-4 py-2 rounded-xl bg-[#0b6b68] hover:bg-[#08524f] text-white text-xs font-extrabold transition cursor-pointer">
              ${escapeBookingHtml(msg.pinUnlockBtn)}
            </button>
          </div>
        </div>
      ` : ''}

      ${canManage ? `
        <div class="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            <div class="sm:col-span-8">
              <label for="manage-new-booth-select" class="block text-[11px] font-bold text-slate-600 mb-1">${escapeBookingHtml(msg.switchBoothLabel)}</label>
              <select id="manage-new-booth-select" class="w-full px-3 py-2 rounded-xl bg-[#f4f7f6] border border-slate-300 text-xs font-bold focus:outline-none focus:border-[#0b6b68]">
                ${boothOptionsHtml}
              </select>
            </div>
            <div class="sm:col-span-4">
              <button type="button" onclick="manageBookingAction('switch_booth')" class="w-full px-3 py-2 rounded-xl bg-[#e6f3f2] hover:bg-[#0b6b68] text-[#0b6b68] hover:text-white border border-[#0b6b68]/30 text-xs font-extrabold transition cursor-pointer">
                ${escapeBookingHtml(msg.switchBoothBtn)}
              </button>
            </div>
          </div>
          <div class="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <button type="button" onclick="manageBookingAction('cancel')" class="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 text-xs font-extrabold transition cursor-pointer">
              ${escapeBookingHtml(msg.cancelBookingBtn)}
            </button>
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" onclick="openLookupInReceiptPage()" class="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition cursor-pointer">
                ${escapeBookingHtml(msg.viewTraReceiptBtn)}
              </button>
              <button type="button" onclick="refreshActiveLookupBooking()" class="px-4 py-2 rounded-xl bg-[#0b6b68] hover:bg-[#08524f] text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer">
                <span>${escapeBookingHtml(msg.verifyPaymentBtn)}</span>
              </button>
              ${isLoginPortalBox ? `
                <button type="button" onclick="clearExhibitorLoginSession()" class="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition cursor-pointer">
                  ${escapeBookingHtml(msg.exLoginLogoutBtn)}
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      ` : (isUnmasked && isPaid ? `
        <div class="pt-2 border-t border-[#0b6b68]/15 flex flex-wrap justify-end gap-2">
          <button type="button" onclick="openLookupInReceiptPage()" class="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition cursor-pointer">
            ${escapeBookingHtml(msg.viewTraReceiptBtn)}
          </button>
          <button type="button" onclick="downloadActiveLookupPass()" class="px-4 py-2 rounded-xl bg-[#0b6b68] hover:bg-[#08524f] text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer">
            <span>↓</span><span>${escapeBookingHtml(msg.downloadPassBtn)}</span>
          </button>
          <button type="button" onclick="window.print()" class="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition cursor-pointer">
            ${escapeBookingHtml(msg.printPass)}
          </button>
          ${isLoginPortalBox ? `
            <button type="button" onclick="clearExhibitorLoginSession()" class="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition cursor-pointer">
              ${escapeBookingHtml(msg.exLoginLogoutBtn)}
            </button>
          ` : ''}
        </div>
      ` : '')}
    </div>
  `;
}

async function lookupGuestBooking() {
  const lang = appState.lang || 'en';
  const msg = BOOKING_MSG[lang] || BOOKING_MSG.en;
  const ref = (document.getElementById('retrieve-ref')?.value || '').trim();
  const phone = (document.getElementById('retrieve-phone')?.value || '').trim();
  const box = document.getElementById('retrieve-result-box');
  if (!box) return;

  box.classList.remove('hidden');
  if (!ref || !phone) {
    box.innerHTML = `<div class="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">${escapeBookingHtml(msg.lookupMissing)}</div>`;
    return;
  }

  box.innerHTML = `<div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold">${escapeBookingHtml(msg.lookupSearching)}</div>`;

  try {
    const res = await fetchWithRetry('/api/bookings/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ ref, phone })
    }, { retries: 2, timeoutMs: 10000 });
    const data = await res.json();
    if (!res.ok || !data.success || !data.booking) {
      box.innerHTML = `<div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">${escapeBookingHtml(data.error || msg.lookupNotFound)}</div>`;
      return;
    }

    appState.activeLookupContext = {
      ref: data.booking.id || ref,
      phone,
      email: '',
      manageToken: data.booking.manageToken || data.manageToken || '',
      booking: data.booking,
      rawResponse: data,
      targetBoxId: 'retrieve-result-box'
    };
    renderLookupResultCard(data.booking, data, '', '', 'retrieve-result-box');
  } catch (err) {
    box.innerHTML = `<div class="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">${escapeBookingHtml(msg.lookupError)}</div>`;
  }
}

async function unlockBookingWithPin() {
  const msg = BOOKING_MSG[appState.lang] || BOOKING_MSG.en;
  const ctx = appState.activeLookupContext;
  if (!ctx) return;

  const pin = (document.getElementById('retrieve-pin-input')?.value || '').trim();
  const errEl = document.getElementById('retrieve-stepup-error');
  if (!pin) {
    if (errEl) {
      errEl.textContent = msg.pinMissing;
      errEl.classList.remove('hidden');
    }
    return;
  }

  try {
    const res = await fetch('/api/bookings/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        ref: ctx.ref,
        phone: ctx.phone || '',
        email: ctx.email || '',
        pin,
        action: 'unlock'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (errEl) {
        errEl.textContent = data.error || msg.lookupNotFound;
        errEl.classList.remove('hidden');
      }
      return;
    }

    appState.activeLookupContext = {
      ...ctx,
      ref: data.booking.id || ctx.ref,
      pin,
      manageToken: data.booking.manageToken || data.manageToken || '',
      booking: data.booking,
      rawResponse: data
    };
    renderLookupResultCard(data.booking, data, '', '', ctx.targetBoxId || 'retrieve-result-box');
  } catch (err) {
    if (errEl) {
      errEl.textContent = msg.lookupError;
      errEl.classList.remove('hidden');
    }
  }
}

async function manageBookingAction(action) {
  const msg = BOOKING_MSG[appState.lang] || BOOKING_MSG.en;
  const ctx = appState.activeLookupContext;
  if (!ctx || !ctx.manageToken) return;
  const targetBoxId = ctx.targetBoxId || 'retrieve-result-box';

  if (action === 'cancel' && !confirm(msg.confirmCancelMsg)) return;

  const payload = {
    ref: ctx.ref,
    phone: ctx.phone || '',
    email: ctx.email || '',
    manageToken: ctx.manageToken,
    action
  };
  if (action === 'switch_booth') {
    const newCode = document.getElementById('manage-new-booth-select')?.value || '';
    if (!newCode) return;
    payload.newBoothCode = newCode;
  }

  try {
    const res = await fetch('/api/bookings/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      renderLookupResultCard(ctx.booking, data, '', data.error || msg.lookupError, targetBoxId);
      return;
    }

    if (data.db) {
      appState.regions = data.db.regions || appState.regions;
      appState.bookings = data.db.bookings || appState.bookings;
      appState.activeHolds = data.db.activeHolds || [];
    }
    if (data.liveStats) appState.liveStats = data.liveStats;
    appState.activeLookupContext.booking = data.booking;
    appState.activeLookupContext.rawResponse = data;
    renderLookupResultCard(data.booking, data, data.message || 'Updated successfully!', '', targetBoxId);
    renderAll();
  } catch (err) {
    renderLookupResultCard(ctx.booking, {}, '', msg.lookupError, targetBoxId);
  }
}

function getLocalizedPkgName(pkg, lang) {
  if (!pkg) return '--';
  if (lang === 'zh') return pkg.nameZh || pkg.nameEn || pkg.nameSw || pkg.name || '--';
  if (lang === 'en') return pkg.nameEn || pkg.nameSw || pkg.name || '--';
  return pkg.nameSw || pkg.nameEn || pkg.name || '--';
}

function getLocalizedPkgSize(pkg, lang) {
  if (!pkg) return '--';
  if (lang === 'zh') return pkg.sizeZh || pkg.sizeEn || pkg.sizeSw || '--';
  if (lang === 'en') return pkg.sizeEn || pkg.sizeSw || '--';
  return pkg.sizeSw || pkg.sizeEn || '--';
}

function getLocalizedPkgPerks(pkg, lang) {
  if (!pkg) return [];
  if (lang === 'zh') return Array.isArray(pkg.perksZh) ? pkg.perksZh : (pkg.perksEn || pkg.perksSw || []);
  if (lang === 'en') return Array.isArray(pkg.perksEn) ? pkg.perksEn : (pkg.perksSw || []);
  return Array.isArray(pkg.perksSw) ? pkg.perksSw : (pkg.perksEn || []);
}

function getLocalizedZoneTitle(prefix, lang) {
  const z = FLOORPLAN_ZONES.find(item => item.prefix === prefix);
  if (!z) return prefix || '--';
  if (lang === 'zh') return z.zoneTitleZh || z.zoneTitleEn || z.zoneTitleSw;
  if (lang === 'en') return z.zoneTitleEn || z.zoneTitleSw;
  return z.zoneTitleSw;
}

function refreshBookingSummary() {
  const pkg = appState.boothPackages.find(p => p.id === appState.selectedPackageId) || appState.boothPackages[0];
  if (!pkg) return;

  const lang = appState.lang || 'en';
  const hasBooth = Boolean(appState.selectedBoothCode);
  const cityCount = Math.max(1, appState.selectedBookingCities.length);
  const subtotal = pkg.price * cityCount;
  const discount = cityCount >= 2 ? Math.round(subtotal * 0.15) : 0;
  const total = subtotal - discount;

  const defaultBiz = lang === 'zh' ? '您的企业名称' : (lang === 'en' ? 'Your Business Ltd' : 'Biashara Yako Ltd');
  const bizName = (document.getElementById('form-biz-name')?.value || defaultBiz).trim();
  const rawSector = document.getElementById('form-sector')?.value || '';
  const sector = localizeSectorLabel(rawSector, lang);

  const pkgName = getLocalizedPkgName(pkg, lang);
  const boothPrefix = lang === 'zh' ? '展位 #' : (lang === 'en' ? 'Booth #' : 'Banda #');
  const pickLabel = lang === 'zh' ? '请选择展位' : (lang === 'en' ? 'Select Booth' : 'Chagua Banda');
  const citiesPrefix = lang === 'zh' ? '举办省份: ' : (lang === 'en' ? 'Region: ' : 'Mkoa: ');
  const activeRegionLabel = appState.selectedBookingCities.join(', ') || (appState.destination?.regionName || 'Mwanza');

  const summaryBoothPill = document.getElementById('summary-booth-pill');
  if (summaryBoothPill) summaryBoothPill.textContent = hasBooth ? (boothPrefix + appState.selectedBoothCode) : pickLabel;

  const previewBizName = document.getElementById('preview-biz-name');
  if (previewBizName) previewBizName.textContent = bizName;

  const previewSector = document.getElementById('preview-sector');
  if (previewSector) previewSector.textContent = sector;

  const previewPkgName = document.getElementById('preview-pkg-name');
  if (previewPkgName) previewPkgName.textContent = hasBooth ? pkgName : '--';

  const previewBoothCode = document.getElementById('preview-booth-code');
  if (previewBoothCode) previewBoothCode.textContent = 'BOOTH: ' + (hasBooth ? appState.selectedBoothCode : '--');

  const previewQrSlot = document.getElementById('preview-qr-slot');
  if (previewQrSlot) {
    const qrPayload = hasBooth
      ? `TBF-PREVIEW|BOOTH:${appState.selectedBoothCode}|PKG:${pkg.id}|CITY:${activeRegionLabel}|FEE:${total}|BIZ:${bizName}`
      : `TBF|${activeRegionLabel}|SELECT-BOOTH`;
    previewQrSlot.innerHTML = generateTbfQrSvg(qrPayload, 56);
  }

  const previewCities = document.getElementById('preview-cities');
  if (previewCities) previewCities.textContent = citiesPrefix + activeRegionLabel;

  const detailsBox = document.getElementById('receipt-seat-details-box');
  if (detailsBox) {
    detailsBox.classList.toggle('hidden', !hasBooth);
    if (hasBooth) {
      const codePrefix = String(appState.selectedBoothCode || '').split('-')[0] || pkg.zonePrefix || '';
      const zoneTitle = getLocalizedZoneTitle(codePrefix, lang).replace(/\s*\([^)]*\)\s*$/, '');
      const pkgSize = getLocalizedPkgSize(pkg, lang);
      const badgeNum = Number(pkg.badgeCount || 2);
      const passesText = lang === 'zh'
        ? `${badgeNum} 张官方参展QR电子证`
        : (lang === 'en' ? `${badgeNum} Official QR Exhibitor Passes` : `Beji ${badgeNum} Rasmi za QR`);
      const destInfo = getLocalizedDestinationInfo(appState.destination, lang);
      const venueDatesText = [destInfo.venueDisplayName, destInfo.datesDisplayName].filter(Boolean).join(' • ');

      const isPaymentStep = Number(appState.bookingStep || 1) === 3;
      const isHeld = Boolean(appState.currentHold && appState.currentHold.boothCode === appState.selectedBoothCode && Number(appState.currentHold.expiresAt || 0) > Date.now());
      let statusText;
      if (isPaymentStep && isHeld) {
        statusText = lang === 'zh'
          ? '付款锁定中 (倒计时运行中)'
          : (lang === 'en' ? 'Held for Payment (Countdown Active)' : 'Imeshikwa kwa Malipo (Muda Unahesabika)');
      } else if (isHeld) {
        statusText = lang === 'zh'
          ? '已为您预留 (进入付款后开始倒计时)'
          : (lang === 'en' ? 'Reserved for You (Timer Starts at Payment)' : 'Limetengwa Kwako (Muda Utaanza Hatua ya Malipo)');
      } else {
        statusText = lang === 'zh'
          ? '已选定 (正在为您预留...)'
          : (lang === 'en' ? 'Selected (Reserving Seat...)' : 'Umechagua (Inahifadhiwa...)');
      }

      const zoneEl = document.getElementById('preview-seat-zone');
      if (zoneEl) zoneEl.textContent = zoneTitle;
      const sizeEl = document.getElementById('preview-seat-size');
      if (sizeEl) sizeEl.textContent = pkgSize;
      const badgesEl = document.getElementById('preview-seat-badges');
      if (badgesEl) badgesEl.textContent = passesText;
      const vdEl = document.getElementById('preview-seat-venue-date');
      if (vdEl) vdEl.textContent = venueDatesText || activeRegionLabel;
      const stEl = document.getElementById('preview-seat-status');
      if (stEl) stEl.textContent = statusText;

      const perksEl = document.getElementById('preview-seat-perks');
      if (perksEl) {
        const perks = getLocalizedPkgPerks(pkg, lang);
        perksEl.innerHTML = perks
          .map(item => `<li class="flex items-start gap-1.5"><span class="text-[#0b6b68] font-bold shrink-0">✓</span><span>${escapeBookingHtml(item)}</span></li>`)
          .join('');
      }
    }
  }

  const promptEl = document.getElementById('booking-price-prompt');
  const pricingRowsEl = document.getElementById('booking-pricing-rows');
  if (promptEl) promptEl.classList.toggle('hidden', hasBooth);
  if (pricingRowsEl) pricingRowsEl.classList.toggle('hidden', !hasBooth);

  const calcUnitPrice = document.getElementById('calc-unit-price');
  if (calcUnitPrice) calcUnitPrice.textContent = hasBooth ? formatTZS(pkg.price) : '--';

  const calcCityCount = document.getElementById('calc-city-count');
  if (calcCityCount) calcCityCount.textContent = activeRegionLabel;

  const discRow = document.getElementById('calc-discount-row');
  if (discount > 0 && hasBooth) {
    if (discRow) discRow.classList.remove('hidden');
    const calcDiscAmount = document.getElementById('calc-discount-amount');
    if (calcDiscAmount) calcDiscAmount.textContent = '- ' + formatTZS(discount);
  } else {
    if (discRow) discRow.classList.add('hidden');
  }

  const calcTotalPrice = document.getElementById('calc-total-price');
  if (calcTotalPrice) calcTotalPrice.textContent = hasBooth ? formatTZS(total) : '--';
}

function showBookingCheckoutError(text) {
  setBookingError('booking-checkout-error', text);
}

async function submitVendorBooking() {
  const lang = appState.lang || 'en';
  const msg = BOOKING_MSG[lang] || BOOKING_MSG.en;
  clearAllBookingErrors();

  if (!validateBookingStep1()) {
    appState.bookingStep = 1;
    renderBookingWizardState();
    return;
  }

  if (!validateBookingStep2()) {
    appState.bookingStep = 2;
    renderBookingWizardState();
    return;
  }

  const businessName = (document.getElementById('form-biz-name')?.value || '').trim();
  const contactPerson = (document.getElementById('form-contact-person')?.value || '').trim();
  const phone = (document.getElementById('form-phone')?.value || '').trim();
  const sector = (document.getElementById('form-sector')?.value || '').trim();
  const tagline = (document.getElementById('form-tagline')?.value || '').trim();
  const email = (document.getElementById('form-email')?.value || '').trim();
  const paymentMethod = document.getElementById('form-payment')?.value || 'M-Pesa / Mixx by Yas / Airtel Money';

  const pkg = appState.boothPackages.find(p => p.id === appState.selectedPackageId) || appState.boothPackages[0];
  if (!pkg) return;

  const cityCount = appState.selectedBookingCities.length;
  const subtotal = pkg.price * cityCount;
  const discount = cityCount >= 2 ? Math.round(subtotal * 0.15) : 0;
  const totalAmount = subtotal - discount;

  if (!appState.pendingBookingRequestId) {
    appState.pendingBookingRequestId = (window.crypto?.randomUUID ? window.crypto.randomUUID() : ('req-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10)));
  }

  const payload = {
    businessName,
    tagline,
    contactPerson,
    phone,
    email,
    sector: sector || 'Biashara & Uwekezaji',
    packageId: pkg.id,
    packageName: getLocalizedPkgName(pkg, lang),
    boothCode: appState.selectedBoothCode,
    cities: appState.selectedBookingCities,
    totalAmount,
    paymentMethod,
    holdToken: appState.currentHold?.holdToken || '',
    clientRequestId: appState.pendingBookingRequestId
  };

  try {
    sessionStorage.setItem(EXHIBITOR_SESSION_KEY, JSON.stringify({ businessName, contactPerson, phone, sector, tagline, email }));
  } catch (e) {
    // Ignore storage error
  }

  const btn = document.getElementById('btn-submit-booking');
  const sumBtn = document.getElementById('btn-summary-action');
  if (btn) btn.disabled = true;
  if (sumBtn) sumBtn.disabled = true;

  try {
    const res = await fetchWithRetry('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    }, { retries: 2, timeoutMs: 12000 });
    const result = await res.json();
    if (!res.ok || !result.success) {
      appState.pendingBookingRequestId = '';
      const errMsg = result.error || msg.submitNetworkError;
      // Release booth hold immediately upon non-network payment/booking failure so seat becomes available again
      await releaseBoothHold({ clearSelection: true });
      appState.bookingStep = 1;
      renderBookingWizardState();
      setBookingError('booking-step1-error', errMsg);
      renderHoldBanner(errMsg, true);
      return;
    }

    appState.pendingBookingRequestId = '';
    clearHoldState();
    appState.regions = result.db.regions || [];
    appState.bookings = result.db.bookings || [];
    appState.activeHolds = result.db.activeHolds || [];
    if (result.liveStats) appState.liveStats = result.liveStats;

    const retRef = document.getElementById('retrieve-ref');
    const retPhone = document.getElementById('retrieve-phone');
    if (retRef) retRef.value = result.booking.controlNumber || result.booking.id || '';
    if (retPhone) retPhone.value = result.booking.phone || phone;

    appState.bookingStep = 1;
    appState.selectedBoothCode = '';
    refreshBookingSummary();
    renderBookingWizardState();
    showBookingConfirmationModal(result.booking, result.accessPin);
    renderAll();
  } catch (err) {
    // On low/dropped internet after retries, keep details intact on Step 3 so user can tap Confirm again safely with the same idempotency key!
    showBookingCheckoutError(msg.submitNetworkError);
  } finally {
    if (btn) btn.disabled = false;
    if (sumBtn) sumBtn.disabled = false;
  }
}

function drawCanvasRoundedRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function wrapCanvasText(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function downloadBookingPassPng(booking, accessPin) {
  if (!booking) return;
  const lang = appState.lang || 'en';
  const msg = BOOKING_MSG[lang] || BOOKING_MSG.en;
  if (!isBookingPaidStatus(booking.status)) {
    alert(msg.downloadPaymentRequired);
    return;
  }

  // Narrow Tanzania TRA / EFD thermal receipt strip canvas
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 1480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const monoStack = 'Consolas, "Courier New", monospace';
  const sansStack = '"Plus Jakarta Sans", "Segoe UI", Arial, sans-serif';

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const paperX = 56;
  const paperW = canvas.width - 112;
  const paperTop = 50;
  const paperBottom = canvas.height - 50;
  const toothW = 24;
  const toothH = 14;
  const innerL = paperX + 42;
  const innerR = paperX + paperW - 42;
  const centerX = paperX + paperW / 2;

  // Draw crisp narrow thermal receipt paper with zigzag sawtooth top & bottom edges
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(paperX, paperTop + toothH);
  for (let x = paperX; x < paperX + paperW; x += toothW) {
    ctx.lineTo(x + toothW / 2, paperTop);
    ctx.lineTo(Math.min(x + toothW, paperX + paperW), paperTop + toothH);
  }
  ctx.lineTo(paperX + paperW, paperBottom - toothH);
  for (let x = paperX + paperW; x > paperX; x -= toothW) {
    ctx.lineTo(x - toothW / 2, paperBottom);
    ctx.lineTo(Math.max(x - toothW, paperX), paperBottom - toothH);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const drawDashedRule = (y) => {
    ctx.save();
    ctx.setLineDash([7, 6]);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(innerL, y);
    ctx.lineTo(innerR, y);
    ctx.stroke();
    ctx.restore();
  };

  const destInfo = getLocalizedDestinationInfo(appState.destination, lang);
  const boothCode = String(booking.boothCode || '--').toUpperCase();
  const createdStr = booking.createdAt
    ? new Date(booking.createdAt).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  // TRA-style Centered Merchant Header
  let y = paperTop + 62;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.font = `700 22px ${monoStack}`;
  ctx.fillText('*** START OF LEGAL RECEIPT ***', centerX, y);
  y += 38;
  ctx.font = `800 25px ${monoStack}`;
  ctx.fillText('TANZANIA BIASHARA FESTIVAL', centerX, y);
  y += 28;
  ctx.fillStyle = '#334155';
  ctx.font = `600 18px ${monoStack}`;
  ctx.fillText(`${destInfo.venueDisplayName}`, centerX, y, paperW - 84);
  y += 24;
  ctx.fillText('TEL: +255 767 053 250 | biasharafestival.co.tz', centerX, y);
  y += 24;
  ctx.fillStyle = '#0b6b68';
  ctx.font = `700 19px ${monoStack}`;
  ctx.fillText(
    lang === 'zh' ? '参展展位已付款电子小票与入场凭证' : (lang === 'en' ? 'PAID BOOTH RECEIPT & QR ENTRY PASS' : 'RISITI HALISI YA MALIPO & QR PASS'),
    centerX, y
  );

  y += 22;
  drawDashedRule(y);
  y += 32;

  // Two-column TRA Metadata Rows
  ctx.textAlign = 'left';
  const metaRows = [
    ['RECEIPT / ID:', booking.id || '-'],
    ['DATE / TIME:', createdStr],
    ['CONTROL NO:', booking.controlNumber || '-'],
    ['STATUS:', String(booking.status || 'Paid').toUpperCase()],
    ['EXHIBITOR:', booking.businessName || '-'],
    ['CONTACT:', `${booking.contactPerson || '-'} (${booking.phone || '-'})`],
    ['BOOTH CODE:', `#${boothCode}`],
    ['TOUR CITIES:', (booking.cities || []).join(', ') || destInfo.regionDisplayName]
  ];
  metaRows.forEach(([k, v]) => {
    ctx.fillStyle = '#475569';
    ctx.font = `600 18px ${monoStack}`;
    ctx.fillText(k, innerL, y);
    ctx.fillStyle = '#0f172a';
    ctx.font = `700 18px ${monoStack}`;
    ctx.textAlign = 'right';
    ctx.fillText(String(v), innerR, y, paperW - 260);
    ctx.textAlign = 'left';
    y += 34;
  });

  y += 4;
  drawDashedRule(y);
  y += 32;

  // Item Line Section (TRA style)
  ctx.fillStyle = '#0f172a';
  ctx.font = `700 18px ${monoStack}`;
  ctx.fillText('DESCRIPTION / BOOTH', innerL, y);
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT', innerR, y);
  ctx.textAlign = 'left';
  y += 30;

  ctx.fillStyle = '#1e293b';
  ctx.font = `600 18px ${monoStack}`;
  const pkgLines = wrapCanvasText(ctx, `1 x ${booking.packageName || 'Exhibition Booth'} (#${boothCode})`, 360).slice(0, 2);
  pkgLines.forEach((ln, idx) => {
    ctx.fillText(ln, innerL, y + idx * 24);
  });
  ctx.textAlign = 'right';
  ctx.font = `700 19px ${monoStack}`;
  ctx.fillText(formatTZS(booking.totalAmount || 0), innerR, y);
  ctx.textAlign = 'left';
  y += pkgLines.length * 26 + 14;

  drawDashedRule(y);
  y += 38;

  // Bold Total Payable Row
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 22px ${monoStack}`;
  ctx.fillText(lang === 'zh' ? 'TOTAL PAID:' : (lang === 'en' ? 'TOTAL PAID:' : 'JUMLA ILIYOLIPWA:'), innerL, y);
  ctx.fillStyle = '#0b6b68';
  ctx.font = `800 26px ${monoStack}`;
  ctx.textAlign = 'right';
  ctx.fillText(formatTZS(booking.totalAmount || 0), innerR, y);
  ctx.textAlign = 'left';
  y += 26;

  drawDashedRule(y);
  y += 34;

  // Centered Bottom TRA-style Scannable Verification QR Code
  const qrSize = 270;
  const qrX = Math.round(centerX - qrSize / 2);
  const qrY = y;
  const qrPayload = `TBF-PASS|ID:${booking.id}|CN:${booking.controlNumber || ''}|BOOTH:${boothCode}|CITIES:${(booking.cities || []).join(',')}|BIZ:${booking.businessName}`;
  if (typeof window.qrcode === 'function') {
    const qr = window.qrcode(0, 'M');
    qr.addData(qrPayload, 'Byte');
    qr.make();
    const count = qr.getModuleCount();
    const cell = Math.floor(qrSize / count);
    const totalQr = cell * count;
    const ox = qrX + Math.floor((qrSize - totalQr) / 2);
    const oy = qrY + Math.floor((qrSize - totalQr) / 2);
    ctx.fillStyle = '#0f172a';
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect(ox + c * cell, oy + r * cell, cell, cell);
        }
      }
    }
  }

  y = qrY + qrSize + 34;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.font = `700 18px ${monoStack}`;
  ctx.fillText(`VERIFY CODE: ${booking.id || '-'} | #${boothCode}`, centerX, y);
  y += 28;
  if (accessPin) {
    ctx.fillStyle = '#92400e';
    ctx.font = `700 17px ${sansStack}`;
    ctx.fillText(`SECURITY ACCESS PIN: ${accessPin}`, centerX, y);
    y += 28;
  }
  ctx.fillStyle = '#334155';
  ctx.font = `700 20px ${monoStack}`;
  ctx.fillText('*** END OF LEGAL RECEIPT ***', centerX, Math.min(y + 10, paperBottom - 36));
  ctx.textAlign = 'left';

  const link = document.createElement('a');
  const safeId = String(booking.id || 'RECEIPT').replace(/[^A-Za-z0-9_-]/g, '');
  link.download = `TBF-Receipt-${boothCode}-${safeId}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadCurrentModalPass() {
  if (appState.lastConfirmedBooking) {
    downloadBookingPassPng(appState.lastConfirmedBooking, appState.lastConfirmedPin || '');
  }
}

function downloadActiveLookupPass() {
  if (appState.activeLookupContext?.booking) {
    downloadBookingPassPng(appState.activeLookupContext.booking, '');
  }
}

function setModalPaymentMsg(text, isSuccess) {
  const msgBox = document.getElementById('modal-payment-check-msg');
  if (!msgBox) return;
  if (!text) {
    msgBox.classList.add('hidden');
    msgBox.textContent = '';
    return;
  }
  msgBox.textContent = text;
  msgBox.className = isSuccess
    ? 'rounded-xl p-3 text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-900'
    : 'rounded-xl p-3 text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-900';
  msgBox.classList.remove('hidden');
}

function copyModalControlNumber() {
  const cn = appState.lastConfirmedBooking?.controlNumber || '';
  const btn = document.getElementById('btn-copy-modal-control');
  const lang = appState.lang || 'en';
  const msg = BOOKING_MSG[lang] || BOOKING_MSG.en;
  if (!cn) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(cn).catch(() => {});
  }
  if (btn) {
    btn.textContent = msg.copiedControlBtn;
    setTimeout(() => {
      if (btn) btn.textContent = msg.copyControlBtn;
    }, 2000);
  }
}

async function verifyCurrentModalPayment() {
  const b = appState.lastConfirmedBooking;
  const pin = appState.lastConfirmedPin || '';
  if (!b) return;
  const lang = appState.lang || 'en';
  const msg = BOOKING_MSG[lang] || BOOKING_MSG.en;
  const lbl = document.getElementById('btn-verify-modal-payment-lbl');
  const btn = document.getElementById('btn-verify-modal-payment');

  if (btn) btn.disabled = true;
  if (lbl) lbl.textContent = msg.checkingPaymentBtn;
  setModalPaymentMsg('', false);

  try {
    const res = await fetchWithRetry('/api/bookings/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: b.id, phone: b.phone || '', pin })
    }, { retries: 1, timeoutMs: 9000 });
    const data = await res.json();
    if (res.ok && data.success && data.booking) {
      showBookingConfirmationModal(data.booking, pin);
      if (isBookingPaidStatus(data.booking.status)) {
        setModalPaymentMsg(msg.paymentUnlockedMsg, true);
      } else {
        setModalPaymentMsg(msg.paymentStillPendingMsg, false);
      }
      return;
    }
    setModalPaymentMsg(data.error || msg.paymentStillPendingMsg, false);
  } catch (err) {
    setModalPaymentMsg(msg.lookupError, false);
  } finally {
    if (btn) btn.disabled = false;
    if (lbl) lbl.textContent = msg.verifyPaymentBtn;
  }
}

function openLookupInReceiptPage() {
  if (appState.activeLookupContext?.booking) {
    const pin = appState.activeLookupContext.pin || '';
    showBookingConfirmationModal(appState.activeLookupContext.booking, pin);
  }
}

window.downloadCurrentModalPass = downloadCurrentModalPass;
window.downloadActiveLookupPass = downloadActiveLookupPass;
window.verifyCurrentModalPayment = verifyCurrentModalPayment;
window.copyModalControlNumber = copyModalControlNumber;
window.openLookupInReceiptPage = openLookupInReceiptPage;

function saveReceiptToSession(booking, accessPin) {
  try {
    if (!booking) return;
    sessionStorage.setItem('tbf_active_receipt_v1', JSON.stringify({ booking, accessPin: accessPin || '' }));
  } catch (e) { /* ignore storage restrictions */ }
}

function restoreLastReceiptFromSession() {
  try {
    const raw = sessionStorage.getItem('tbf_active_receipt_v1');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.booking) {
      appState.lastConfirmedBooking = parsed.booking;
      appState.lastConfirmedPin = parsed.accessPin || '';
      return true;
    }
  } catch (e) { /* ignore */ }
  return false;
}

function renderDedicatedReceiptPage(booking, accessPin) {
  if (!booking) return;
  appState.lastConfirmedBooking = booking;
  appState.lastConfirmedPin = accessPin || '';
  saveReceiptToSession(booking, accessPin);

  const paperBody = document.getElementById('receipt-paper-body');
  if (!paperBody) return;

  const lang = appState.lang || 'en';
  const dict = I18N[lang] || I18N.en;
  const msg = BOOKING_MSG[lang] || BOOKING_MSG.en;
  const isPaid = isBookingPaidStatus(booking.status);

  const badgeEl = document.getElementById('modal-status-badge');
  const dotEl = document.getElementById('modal-status-dot');
  const statusTxtEl = document.getElementById('modal-status-text');
  const btnDownload = document.getElementById('btn-download-modal-pass');
  const btnPrint = document.getElementById('btn-print-modal-pass');
  const btnHome = document.getElementById('btn-receipt-home');
  const btnVerify = document.getElementById('btn-verify-modal-payment');
  const btnVerifyLbl = document.getElementById('btn-verify-modal-payment-lbl');
  const btnCopy = document.getElementById('btn-copy-modal-control');

  if (badgeEl && dotEl && statusTxtEl) {
    badgeEl.className = isPaid
      ? 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-semibold'
      : 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold';
    dotEl.className = isPaid ? 'w-1.5 h-1.5 rounded-full bg-emerald-500' : 'w-1.5 h-1.5 rounded-full bg-amber-500';
    statusTxtEl.textContent = isPaid ? msg.paidBadgeLabel : dict.modalBookingConfirmed;
  }
  if (btnDownload) btnDownload.classList.toggle('hidden', !isPaid);
  if (btnPrint) btnPrint.classList.toggle('hidden', !isPaid);
  if (btnHome) {
    btnHome.classList.toggle('col-span-1', isPaid);
    btnHome.classList.toggle('col-span-2', !isPaid);
  }
  if (btnVerify) btnVerify.classList.toggle('hidden', isPaid);
  if (btnCopy) {
    btnCopy.classList.toggle('hidden', isPaid);
    btnCopy.textContent = msg.copyControlBtn;
  }
  if (btnVerifyLbl) btnVerifyLbl.textContent = msg.verifyPaymentBtn;
  setModalPaymentMsg('', false);

  const destInfo = getLocalizedDestinationInfo(appState.destination, lang);
  const boothCode = String(booking.boothCode || '--').toUpperCase();
  const createdStr = booking.createdAt
    ? new Date(booking.createdAt).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const startBanner = isPaid ? '*** START OF LEGAL RECEIPT ***' : '*** PAYMENT CONTROL INVOICE ***';
  const docTitle = isPaid
    ? (lang === 'zh' ? '参展展位付款小票' : (lang === 'en' ? 'OFFICIAL EXHIBITOR RECEIPT' : 'RISITI HALISI YA MALIPO'))
    : (lang === 'zh' ? '待付款缴费通知单' : (lang === 'en' ? 'AWAITING PAYMENT INVOICE' : 'ANKARA YA MALIPO (SUBIRI MALIPO)'));
  const statusDisplay = isPaid
    ? (lang === 'zh' ? '已付款 (PAID)' : (lang === 'en' ? 'PAID' : 'IMELIPIWA (PAID)'))
    : (lang === 'zh' ? '待支付 (UNPAID)' : (lang === 'en' ? 'AWAITING PAYMENT' : 'INASUBIRI MALIPO'));
  const totalLbl = isPaid
    ? (lang === 'zh' ? '实付总额:' : (lang === 'en' ? 'TOTAL PAID:' : 'JUMLA ILIYOLIPWA:'))
    : (lang === 'zh' ? '应付总额:' : (lang === 'en' ? 'TOTAL PAYABLE:' : 'JUMLA YA KULIPA:'));

  const qrPayload = `TBF-PASS|ID:${booking.id}|CN:${booking.controlNumber || ''}|BOOTH:${boothCode}|CITIES:${(booking.cities || []).join(',')}|BIZ:${booking.businessName}`;
  const bottomQrSection = isPaid
    ? `
      <div class="pt-3 flex flex-col items-center text-center space-y-2">
        <div class="p-2 bg-white border border-slate-300 inline-block">
          ${generateTbfQrSvg(qrPayload, 148)}
        </div>
        <div class="text-[11px] font-bold tracking-wide text-slate-900">${escapeBookingHtml(booking.id)} • #${escapeBookingHtml(boothCode)}</div>
        <div class="text-[11px] font-bold tracking-wider text-slate-800">*** END OF LEGAL RECEIPT ***</div>
      </div>
    `
    : `
      <div class="pt-3 flex flex-col items-center text-center space-y-2">
        <div class="w-full p-3 border border-dashed border-amber-400 bg-amber-50/70 rounded-lg space-y-1.5">
          <div class="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <div class="text-[11px] font-bold text-slate-900">${escapeBookingHtml(msg.qrLockedTitle)}</div>
          <div class="text-[10px] font-sans text-slate-600 leading-snug">${escapeBookingHtml(msg.qrLockedHint)}</div>
        </div>
        <div class="text-[10.5px] font-bold tracking-wider text-slate-500">*** PAY TO UNLOCK RECEIPT &amp; QR ***</div>
      </div>
    `;

  paperBody.innerHTML = `
    <div class="text-center space-y-0.5 pb-2.5">
      <div class="text-[10.5px] font-bold tracking-wider text-slate-700">${startBanner}</div>
      <div class="text-[13px] font-extrabold tracking-tight text-slate-950 pt-0.5">TANZANIA BIASHARA FESTIVAL</div>
      <div class="text-[10.5px] text-slate-600">${escapeBookingHtml(destInfo.venueDisplayName)}</div>
      <div class="text-[10.5px] text-slate-600">TEL: +255 767 053 250</div>
      <div class="text-[11px] font-bold text-[#0b6b68] pt-1">${escapeBookingHtml(docTitle)}</div>
    </div>

    <div class="border-t border-dashed border-slate-400 my-2"></div>

    <div class="space-y-1 text-[11px]">
      <div class="flex justify-between gap-2"><span class="text-slate-600">RECEIPT / ID:</span><strong class="text-slate-950 text-right">${escapeBookingHtml(booking.id)}</strong></div>
      <div class="flex justify-between gap-2"><span class="text-slate-600">DATE / TIME:</span><span class="text-right">${escapeBookingHtml(createdStr)}</span></div>
      <div class="flex justify-between gap-2"><span class="text-slate-600">CONTROL NO:</span><strong class="text-slate-950 text-right text-[12px]">${escapeBookingHtml(booking.controlNumber || '-')}</strong></div>
      <div class="flex justify-between gap-2"><span class="text-slate-600">STATUS:</span><strong class="${isPaid ? 'text-emerald-700' : 'text-amber-700'} text-right">${escapeBookingHtml(statusDisplay)}</strong></div>
    </div>

    <div class="border-t border-dashed border-slate-400 my-2"></div>

    <div class="space-y-1 text-[11px]">
      <div class="flex justify-between gap-2"><span class="text-slate-600 shrink-0">EXHIBITOR:</span><strong class="text-right text-slate-950 break-words">${escapeBookingHtml(booking.businessName || '-')}</strong></div>
      <div class="flex justify-between gap-2"><span class="text-slate-600 shrink-0">CONTACT:</span><span class="text-right break-words">${escapeBookingHtml(booking.contactPerson || '-')}</span></div>
      <div class="flex justify-between gap-2"><span class="text-slate-600 shrink-0">PHONE:</span><span class="text-right">${escapeBookingHtml(booking.phone || '-')}</span></div>
      <div class="flex justify-between gap-2"><span class="text-slate-600 shrink-0">BOOTH CODE:</span><strong class="text-[#0b6b68] text-right">#${escapeBookingHtml(boothCode)}</strong></div>
      <div class="flex justify-between gap-2"><span class="text-slate-600 shrink-0">CITIES:</span><span class="text-right break-words">${escapeBookingHtml((booking.cities || []).join(', ') || destInfo.regionDisplayName)}</span></div>
    </div>

    <div class="border-t border-dashed border-slate-400 my-2"></div>

    <div class="space-y-1.5 text-[11px]">
      <div class="flex justify-between font-bold text-slate-700 text-[10px]">
        <span>DESCRIPTION</span>
        <span>AMOUNT</span>
      </div>
      <div class="flex justify-between items-start gap-2">
        <span class="text-slate-800 leading-snug">1 x ${escapeBookingHtml(booking.packageName || 'Booth')} (#${escapeBookingHtml(boothCode)})</span>
        <strong class="shrink-0 text-slate-950">${escapeBookingHtml(formatTZS(booking.totalAmount || 0))}</strong>
      </div>
    </div>

    <div class="border-t border-dashed border-slate-400 my-2"></div>

    <div class="flex justify-between items-baseline text-[13px] font-extrabold">
      <span>${totalLbl}</span>
      <span class="text-[#0b6b68] text-[15px]">${escapeBookingHtml(formatTZS(booking.totalAmount || 0))}</span>
    </div>
    <div class="flex justify-between text-[10.5px] text-slate-600 mt-1">
      <span>PAYMENT METHOD:</span>
      <span class="text-right">${escapeBookingHtml(booking.paymentMethod || 'Control Number')}</span>
    </div>

    ${accessPin ? `
      <div class="border-t border-dashed border-slate-400 my-2.5"></div>
      <div class="p-2.5 rounded-md bg-amber-50 border border-amber-300 text-center space-y-1">
        <div class="text-[10px] font-bold tracking-wider text-amber-900">${escapeBookingHtml(msg.pinBoxTitle)}</div>
        <div class="text-base font-extrabold tracking-[0.25em] text-amber-950">${escapeBookingHtml(accessPin)}</div>
        <div class="font-sans text-[10px] text-amber-800 leading-snug">${escapeBookingHtml(msg.pinBoxWarning)}</div>
      </div>
    ` : ''}

    <div class="border-t border-dashed border-slate-400 mt-2.5"></div>
    ${bottomQrSection}
  `;
}

function showBookingConfirmationModal(booking, accessPin) {
  renderDedicatedReceiptPage(booking, accessPin);
  switchSection('receipt');
}

function closeBookingModal() {
  switchSection('booking');
}

const SPONSOR_MSG = {
  sw: {
    missing: 'Tafadhali jaza Jina la Kampuni, Afisa Mhusika, Namba ya Simu na Barua Pepe sahihi.',
    regionMissing: 'Tafadhali chagua angalau mkoa mmoja (au chagua Mikoa Yote) kwenye orodha ya mikoa.',
    allRegionsLabel: 'Mikoa Yote ya Tanzania (31)',
    pickRegionPlaceholder: 'Chagua Mkoa / Mikoa...',
    searchRegionPlaceholder: 'Tafuta mkoa (mf. Dar es Salaam, Arusha, Zanzibar...)',
    noRegionMatch: 'Hakuna mkoa unaolingana na utafutaji wako.',
    submitErr: 'Imeshindikana kutuma ombi kwa sasa. Tafadhali jaribu tena au piga +255 767 053 250.'
  },
  en: {
    missing: 'Please enter Organization Name, Contact Person, Phone Number, and a valid Email Address.',
    regionMissing: 'Please select at least one Tanzania region (or click Select All) in Target Regions.',
    allRegionsLabel: 'All Regions of Tanzania (31)',
    pickRegionPlaceholder: 'Select region(s)...',
    searchRegionPlaceholder: 'Search region (e.g. Dar es Salaam, Arusha, Zanzibar...)',
    noRegionMatch: 'No matching region found.',
    submitErr: 'Could not submit right now. Please try again or call +255 767 053 250.'
  },
  zh: {
    missing: '请完整填写企业名称、负责人姓名、联系电话及有效电子邮箱。',
    regionMissing: '请在省份列表中至少选择一个坦桑尼亚省份（或点击顶部全选）。',
    allRegionsLabel: '坦桑尼亚全境所有省份 (31 省)',
    pickRegionPlaceholder: '请选择合作省份...',
    searchRegionPlaceholder: '搜索省份名称（如 Dar es Salaam, Arusha, Zanzibar...）',
    noRegionMatch: '未找到匹配的省份。',
    submitErr: '暂时无法提交，请重试或直接致电 +255 767 053 250。'
  }
};

function selectSponsorTier(tierTitle, btnEl) {
  const container = document.getElementById('sp-tier-pills');
  const resolvedBtn = btnEl || (container ? [...container.querySelectorAll('button')].find(b => b.dataset.tier === tierTitle) : null);
  selectPillOption('sp-tier-pills', 'sp-tier', tierTitle, resolvedBtn);
}

function getSelectedSponsorRegions() {
  if (!Array.isArray(appState.selectedSponsorRegions)) {
    appState.selectedSponsorRegions = [...TANZANIA_ALL_REGIONS];
  }
  return appState.selectedSponsorRegions;
}

function renderSponsorRegionSelector() {
  const lang = appState.lang || 'en';
  const msg = SPONSOR_MSG[lang] || SPONSOR_MSG.en;
  const selected = getSelectedSponsorRegions();
  const total = TANZANIA_ALL_REGIONS.length;
  const isAll = selected.length === total;

  const hiddenEl = document.getElementById('sp-regions');
  if (hiddenEl) {
    hiddenEl.value = isAll ? 'All Regions (All 31 Regions of Tanzania)' : selected.join(', ');
  }

  const displayEl = document.getElementById('sp-region-display');
  if (displayEl) {
    if (selected.length === 0) {
      displayEl.textContent = msg.pickRegionPlaceholder;
      displayEl.className = 'text-base text-slate-400 font-normal truncate';
    } else if (isAll) {
      displayEl.textContent = msg.allRegionsLabel;
      displayEl.className = 'text-base text-[#0b6b68] font-bold truncate';
    } else if (selected.length <= 2) {
      displayEl.textContent = selected.join(', ');
      displayEl.className = 'text-base text-slate-900 font-medium truncate';
    } else {
      const moreTxt = lang === 'zh'
        ? `（共 ${selected.length} 省）`
        : (lang === 'en' ? `(+${selected.length - 2} more)` : `(+${selected.length - 2} nyingine)`);
      displayEl.textContent = `${selected[0]}, ${selected[1]} ${moreTxt}`;
      displayEl.className = 'text-base text-slate-900 font-medium truncate';
    }
  }

  const allChk = document.getElementById('sp-region-all-chk');
  if (allChk) {
    allChk.className = isAll
      ? 'w-5 h-5 rounded-md bg-[#0b6b68] text-white flex items-center justify-center text-xs font-extrabold shrink-0'
      : 'w-5 h-5 rounded-md border-2 border-slate-300 bg-white text-transparent flex items-center justify-center text-xs font-extrabold shrink-0';
  }

  const badgeEl = document.getElementById('sp-region-count-badge');
  if (badgeEl) badgeEl.textContent = `${selected.length} / ${total}`;

  const footerInfo = document.getElementById('sp-region-footer-info');
  if (footerInfo) {
    footerInfo.textContent = lang === 'zh'
      ? `已选 ${selected.length} / ${total} 个省份`
      : (lang === 'en' ? `${selected.length} of ${total} regions selected` : `Mikoa ${selected.length} kati ya ${total} imechaguliwa`);
  }

  const searchInput = document.getElementById('sp-region-search');
  if (searchInput) searchInput.placeholder = msg.searchRegionPlaceholder;

  const listEl = document.getElementById('sp-region-list');
  if (listEl) {
    const q = String(appState.sponsorRegionSearch || '').trim().toLowerCase();
    const filtered = TANZANIA_ALL_REGIONS.filter(reg => {
      if (!q) return true;
      const hay = reg.toLowerCase();
      if (hay.includes(q)) return true;
      if (q.includes('zanz') && (hay.includes('pemba') || hay.includes('unguja'))) return true;
      return false;
    });

    if (!filtered.length) {
      listEl.innerHTML = `<div class="col-span-full py-6 text-center text-xs font-semibold text-slate-400">${escapeBookingHtml(msg.noRegionMatch)}</div>`;
    } else {
      listEl.innerHTML = filtered.map(reg => {
        const isChecked = selected.includes(reg);
        const safeReg = escapeBookingHtml(reg);
        return `
          <button type="button" onclick="toggleSponsorRegionItem('${safeReg}', event)" data-sp-region="${safeReg}" class="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-left transition cursor-pointer ${
            isChecked ? 'bg-[#e6f3f2] text-[#08524f] font-bold' : 'hover:bg-slate-100 text-slate-700 font-medium'
          }">
            <span class="w-4 h-4 rounded flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
              isChecked ? 'bg-[#0b6b68] text-white' : 'border border-slate-300 bg-white text-transparent'
            }">✓</span>
            <span class="text-xs truncate">${safeReg}</span>
          </button>
        `;
      }).join('');
    }
  }
}

function toggleSponsorRegionDropdown(e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  const menu = document.getElementById('sp-region-menu');
  const chev = document.getElementById('sp-region-chevron');
  if (!menu) return;
  const willOpen = menu.classList.contains('hidden');
  menu.classList.toggle('hidden', !willOpen);
  if (chev) chev.style.transform = willOpen ? 'rotate(180deg)' : 'rotate(0deg)';
  if (willOpen) {
    renderSponsorRegionSelector();
    setTimeout(() => document.getElementById('sp-region-search')?.focus(), 50);
  }
}

function closeSponsorRegionDropdown() {
  const menu = document.getElementById('sp-region-menu');
  const chev = document.getElementById('sp-region-chevron');
  if (menu) menu.classList.add('hidden');
  if (chev) chev.style.transform = 'rotate(0deg)';
}

function toggleAllSponsorRegions(e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  const current = getSelectedSponsorRegions();
  appState.selectedSponsorRegions = (current.length === TANZANIA_ALL_REGIONS.length) ? [] : [...TANZANIA_ALL_REGIONS];
  renderSponsorRegionSelector();
}

function toggleSponsorRegionItem(regionName, e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  const current = new Set(getSelectedSponsorRegions());
  if (current.has(regionName)) current.delete(regionName);
  else current.add(regionName);
  appState.selectedSponsorRegions = TANZANIA_ALL_REGIONS.filter(r => current.has(r));
  renderSponsorRegionSelector();
}

function filterSponsorRegionsList(query) {
  appState.sponsorRegionSearch = String(query || '');
  renderSponsorRegionSelector();
}

function selectSponsorRegion(region) {
  const txt = String(region || '').trim();
  if (!txt || /all|national|yote/i.test(txt)) {
    appState.selectedSponsorRegions = [...TANZANIA_ALL_REGIONS];
  } else {
    const matched = TANZANIA_ALL_REGIONS.find(r => r.toLowerCase().includes(txt.toLowerCase()));
    appState.selectedSponsorRegions = matched ? [matched] : [txt];
  }
  renderSponsorRegionSelector();
}

function resetSponsorApplication(clearInputs = true) {
  const form = document.getElementById('sponsor-apply-form');
  const feedback = document.getElementById('sp-feedback');
  const errBox = document.getElementById('sp-error');
  if (form) form.classList.remove('hidden');
  if (feedback) feedback.classList.add('hidden');
  if (errBox) errBox.classList.add('hidden');

  if (clearInputs) {
    ['sp-org', 'sp-contact', 'sp-phone', 'sp-email', 'sp-region-search'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    appState.selectedSponsorRegions = [...TANZANIA_ALL_REGIONS];
    appState.sponsorRegionSearch = '';
    closeSponsorRegionDropdown();
    renderSponsorRegionSelector();
  }
}

function prefillSponsorForm(roleChoice) {
  resetSponsorApplication(false);
  selectSponsorTier(roleChoice || 'Sponsor');
  document.getElementById('sponsor-apply-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => document.getElementById('sp-org')?.focus(), 200);
}

async function submitSponsorForm(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  const msg = SPONSOR_MSG[appState.lang] || SPONSOR_MSG.en;
  const errBox = document.getElementById('sp-error');
  const submitBtn = document.getElementById('sp-submit-btn');

  const organization = (document.getElementById('sp-org')?.value || '').trim();
  const contactName = (document.getElementById('sp-contact')?.value || '').trim();
  const phone = (document.getElementById('sp-phone')?.value || '').trim();
  const email = (document.getElementById('sp-email')?.value || '').trim();
  const tier = document.getElementById('sp-tier')?.value || 'Sponsor';
  const targetRegions = (document.getElementById('sp-regions')?.value || '').trim();

  if (!organization || !contactName || !phone || !email.includes('@')) {
    if (errBox) {
      errBox.textContent = msg.missing;
      errBox.classList.remove('hidden');
    }
    return;
  }

  if (!targetRegions) {
    if (errBox) {
      errBox.textContent = msg.regionMissing;
      errBox.classList.remove('hidden');
    }
    return;
  }

  if (errBox) errBox.classList.add('hidden');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-60', 'cursor-wait');
  }

  try {
    const res = await fetch('/api/sponsors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organization, contactName, phone, email, tier, targetRegions })
    });
    const result = await res.json();
    if (result.success) {
      if (result.db?.sponsors) appState.sponsors = result.db.sponsors;
      if (result.liveStats) appState.liveStats = result.liveStats;
      renderAll();
    }
  } catch (err) {
    if (errBox) {
      errBox.textContent = msg.submitErr;
      errBox.classList.remove('hidden');
    }
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-60', 'cursor-wait');
    }
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-60', 'cursor-wait');
  }
  const form = document.getElementById('sponsor-apply-form');
  const feedback = document.getElementById('sp-feedback');
  if (form) form.classList.add('hidden');
  if (feedback) feedback.classList.remove('hidden');
  showToast(t('spSuccessMsg'));
}

window.selectSponsorTier = selectSponsorTier;
window.selectSponsorRegion = selectSponsorRegion;
window.renderSponsorRegionSelector = renderSponsorRegionSelector;
window.toggleSponsorRegionDropdown = toggleSponsorRegionDropdown;
window.closeSponsorRegionDropdown = closeSponsorRegionDropdown;
window.toggleAllSponsorRegions = toggleAllSponsorRegions;
window.toggleSponsorRegionItem = toggleSponsorRegionItem;
window.filterSponsorRegionsList = filterSponsorRegionsList;
window.resetSponsorApplication = resetSponsorApplication;
window.prefillSponsorForm = prefillSponsorForm;
window.submitSponsorForm = submitSponsorForm;

function renderAdminDashboard() {
  const lang = appState.lang || 'en';
  const dict = I18N[lang] || I18N.en;
  const adminBookings = (appState.isAdminAuthenticated && Array.isArray(appState.adminOverview?.bookings))
    ? appState.adminOverview.bookings
    : [];
  const activeHoldsCount = (appState.isAdminAuthenticated && Array.isArray(appState.adminOverview?.activeHolds))
    ? appState.adminOverview.activeHolds.length
    : (appState.activeHolds || []).length;

  const badge = document.getElementById('admin-count-badge');
  if (badge) badge.textContent = adminBookings.length;

  const holdsPill = document.getElementById('admin-active-holds-pill');
  if (holdsPill) holdsPill.textContent = `${dict.adminHoldsPrefix || 'Holds Active:'} ${activeHoldsCount}`;

  const kpiBookings = document.getElementById('admin-kpi-bookings');
  if (kpiBookings) kpiBookings.textContent = adminBookings.length;

  const totalRev = adminBookings.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0);
  const kpiRev = document.getElementById('admin-kpi-revenue');
  if (kpiRev) kpiRev.textContent = formatTZS(totalRev);

  const kpiVis = document.getElementById('admin-kpi-visitors');
  if (kpiVis) kpiVis.textContent = Number(appState.liveStats?.totalCookieVisitors || 71998).toLocaleString();

  const kpiAtt = document.getElementById('admin-kpi-attendees');
  if (kpiAtt) kpiAtt.textContent = Number(appState.liveStats?.totalRegisteredAttendees || 18450).toLocaleString();

  const tbody = document.getElementById('admin-bookings-tbody');
  if (tbody) {
    tbody.innerHTML = adminBookings.map(b => {
      const stLower = String(b.status || '').toLowerCase();
      const isPaid = stLower === 'paid' || stLower === 'confirmed';
      const statusBadge = isPaid
        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
        : (stLower === 'cancelled' || stLower === 'expired'
          ? 'bg-slate-200 text-slate-600 border-slate-300'
          : 'bg-amber-100 text-amber-800 border-amber-200');
      const statusLabel = isPaid
        ? (dict.adminStatusPaid || 'Paid')
        : (stLower === 'cancelled'
          ? (dict.adminStatusCancelled || 'Cancelled')
          : (stLower === 'expired' ? (dict.adminStatusExpired || 'Expired') : (dict.adminStatusPending || 'Awaiting Payment')));
      return `
        <tr>
          <td class="py-3 pr-3 font-mono text-xs">
            <div class="font-bold text-[#0b6b68]">${escapeBookingHtml(b.id)}</div>
            <div class="text-[11px] text-slate-500">${escapeBookingHtml(b.controlNumber || '-')}</div>
          </td>
          <td class="py-3 pr-3">
            <div class="font-bold text-slate-900">${escapeBookingHtml(b.businessName)}</div>
            <div class="text-xs text-slate-500">${escapeBookingHtml(b.contactPerson || '-')} • ${escapeBookingHtml(b.phone || '-')}</div>
          </td>
          <td class="py-3 pr-3">
            <span class="px-2 py-0.5 rounded bg-[#e6f3f2] text-[#0b6b68] font-bold text-xs">#${escapeBookingHtml(b.boothCode)}</span>
            <div class="text-xs text-slate-500">${escapeBookingHtml(b.packageName)}</div>
          </td>
          <td class="py-3 pr-3 text-xs">${escapeBookingHtml((b.cities || []).join(', '))}</td>
          <td class="py-3 pr-3 font-extrabold text-[#0b6b68]">${escapeBookingHtml(formatTZS(b.totalAmount))}</td>
          <td class="py-3 pr-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusBadge}">${escapeBookingHtml(statusLabel)}</span>
              ${!isPaid && stLower !== 'cancelled' && stLower !== 'expired' ? `
                <button type="button" onclick="updateAdminBookingStatus('${escapeBookingHtml(b.id)}', 'Paid')" class="px-2.5 py-1 rounded-lg bg-[#0b6b68] hover:bg-[#08524f] text-white text-[11px] font-bold transition cursor-pointer">
                  ${escapeBookingHtml(dict.adminBtnMarkPaid || 'Mark Paid')}
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Populate Destination Manager fields
  renderAdminDestinationSelect();
  const dest = appState.destination;
  if (dest) {
    const sel = document.getElementById('admin-dest-region-select');
    const venue = document.getElementById('admin-dest-venue-input');
    const loc = document.getElementById('admin-dest-location-input');
    const dates = document.getElementById('admin-dest-dates-input');
    const notes = document.getElementById('admin-dest-notes-input');
    const badgeEl = document.getElementById('admin-dest-badge');

    if (sel && dest.regionId) sel.value = dest.regionId;
    if (venue && dest.venue) venue.value = dest.venue;
    if (loc && dest.venueLocation) loc.value = dest.venueLocation;
    if (dates && dest.eventDates) dates.value = dest.eventDates;
    if (notes && dest.notes) notes.value = dest.notes;
    if (badgeEl) {
      const prefix = lang === 'zh' ? '当前巡展举办地：' : (lang === 'en' ? 'Current Destination: ' : 'Sasa Tunaoenda: ');
      badgeEl.textContent = `${prefix}${dest.regionName} (${dest.venue || ''})`;
    }
  }
}

document.addEventListener('DOMContentLoaded', loadFestivalData);