import type { HazardId, Language, Persona, SeverityStatus } from '../types/telemetry';

type ActiveStatus = Exclude<SeverityStatus, 'nodata'>;

export interface ActionPlanMap {
  [persona: string]: {
    [hazard: string]: {
      [status: string]: string[];
    };
  };
}

export const ACTION_PLANS: Record<Language, Record<Persona, Record<HazardId, Record<ActiveStatus, string[]>>>> = {
  en: {
    farmer: {
      wildfire: {
        nominal: [
          'Maintain normal field operations and keep crop residue clearing controlled.',
          'Keep water tanks and farm boundary firebreaks free of dry brush.',
          'Check afternoon wind speed before any permitted agricultural burning.',
        ],
        watch: [
          'Clear dry grass and straw within 10 m of barns, fodder stacks, and equipment.',
          'Inspect water pumps and verify irrigation hoses can reach storage sheds.',
          'Monitor wind direction so smoke does not drift toward livestock pens.',
        ],
        warning: [
          'Halt all open burning, welding, or spark-producing machinery near dry fields.',
          'Move livestock, tractors, and fuel drums to cleared low-vegetation zones.',
          'Wet perimeter firebreaks around high-value orchards and stored grain.',
        ],
        critical: [
          'Evacuate family and livestock immediately along safe upwind roads.',
          'Shut off main gas, diesel, and electrical feeds to outbuildings if safe.',
          'Follow local emergency authorities and Rescue services; do not stay to defend fields.',
        ],
      },
      flood: {
        nominal: [
          'Inspect field drainage channels and clear silt or crop debris before rain.',
          'Verify fertilizer and seed bags are stored on raised pallets.',
          'Schedule normal irrigation based on root-zone moisture readings.',
        ],
        watch: [
          'Open perimeter drainage outlets and bund spillways ahead of heavy rain.',
          'Delay basal fertilizer application to prevent runoff loss into waterways.',
          'Move portable pumps and electrical starters to higher ground.',
        ],
        warning: [
          'Relocate livestock, feed, and farm machinery away from riverbanks and low depressions.',
          'Disconnect submersible pumps and field transformers in flood-prone plots.',
          'Harvest mature standing crops early if fields can be accessed safely.',
        ],
        critical: [
          'Evacuate low-lying farmsteads immediately and avoid crossing flooded culverts.',
          'Release tied livestock to higher terrain rather than leaving them penned.',
          'Follow official flood advisories and wait for waters to recede before entering fields.',
        ],
      },
      soil: {
        nominal: [
          'Continue balanced irrigation intervals aligned with crop growth stage.',
          'Preserve surface mulch to stabilize soil temperature and moisture retention.',
          'Log weekly field moisture checks alongside satellite root-zone trends.',
        ],
        watch: [
          'Adjust irrigation timing to early morning or dusk if root-zone moisture is drying.',
          'If soil is waterlogged (>0.90), pause irrigation and open surface drainage furrows.',
          'Check shallow-rooted vegetables for early wilting or standing water stress.',
        ],
        warning: [
          'Prioritize limited irrigation water for flowering and grain-filling crop stages.',
          'Apply organic mulch or crop residue cover to cut surface evaporation losses.',
          'Avoid heavy tractor passes on stressed or overly saturated soils to prevent compaction.',
        ],
        critical: [
          'Shift immediately to deficit irrigation targeting permanent orchards and core crops.',
          'Coordinate with local water user associations for emergency canal or tubewell rotation.',
          'Delay new sowing until root-zone moisture recovers or supplemental water is secured.',
        ],
      },
      air: {
        nominal: [
          'Conduct normal outdoor fieldwork and spraying operations.',
          'Ensure tractor cab air filters are clean before dusty tillage.',
          'Schedule strenuous harvesting during cooler morning hours.',
        ],
        watch: [
          'Provide N95 or particulate masks for workers doing dusty threshing or plowing.',
          'Shift heavy manual labor to early morning when surface haze is typically lower.',
          'Keep livestock drinking water fresh and shaded from settling ash or dust.',
        ],
        warning: [
          'Limit prolonged outdoor labor for workers with asthma or heart conditions.',
          'Use N95 respirators during essential field tasks and take shaded breaks.',
          'Avoid burning crop stubble, which compounds local particulate spikes.',
        ],
        critical: [
          'Suspend non-essential outdoor fieldwork until AQI drops below hazardous levels.',
          'Move vulnerable family members and sensitive livestock to enclosed spaces.',
          'Seal poultry and dairy sheds with clean ventilation filtering where available.',
        ],
      },
    },
    hiker: {
      wildfire: {
        nominal: [
          'Pack standard trail essentials, plenty of water, and an offline map.',
          'Confirm campfires are prohibited or strictly confined to designated rings.',
          'Note trailhead wind conditions before entering steep canyons.',
        ],
        watch: [
          'Check ridge visibility and smell for smoke before ascending remote trails.',
          'Choose routes with multiple bailout paths back to paved roads.',
          'Carry a headlamp, N95 mask, and fully charged power bank.',
        ],
        warning: [
          'Avoid backcountry ridges and forested valleys within 15 km of active fire.',
          'Reroute to open urban parks or coastal/valley trails upwind of detections.',
          'Monitor local forestry advisories continuously for trail closures.',
        ],
        critical: [
          'Cancel all hikes immediately and leave forest or scrubland areas right away.',
          'Drive or walk perpendicular and upwind away from the smoke plume.',
          'Follow emergency responder roadblocks and report stranded hikers to authorities.',
        ],
      },
      flood: {
        nominal: [
          'Review watershed terrain and identify dry high-ground campsites.',
          'Wear waterproof footwear when crossing seasonal streams.',
          'Check upstream weather radar before entering narrow gorges.',
        ],
        watch: [
          'Avoid camping in dry riverbeds, nullahs, or narrow canyon floors.',
          'Expect muddy, slippery trail sections and rising stream crossings.',
          'Turn back immediately if distant thunder or muddy water surges appear.',
        ],
        warning: [
          'Cancel canyon, gorge, and riverside trekking routes due to flash-flood risk.',
          'Never attempt to wade or drive across fast-moving water over trails or roads.',
          'Seek high ground immediately if trapped near rising tributaries.',
        ],
        critical: [
          'Stay completely clear of riverbanks, bridges, and landslide-prone slopes.',
          'Move vertically to high stable terrain rather than outrunning water downstream.',
          'Contact local emergency services with your exact coordinates if isolated.',
        ],
      },
      soil: {
        nominal: [
          'Expect firm trail surfaces with standard traction requirements.',
          'Pack regular trekking poles for steep descents.',
          'Follow Leave No Trace guidelines by staying on durable main paths.',
        ],
        watch: [
          'Watch for slick mud on clay trails if root-zone wetness exceeds 0.90.',
          'If terrain is dry, pack extra water and avoid creating sparks on dry brush.',
          'Use trekking poles on wet or loose gravelly inclines.',
        ],
        warning: [
          'Expect either high dust/tinder-dry brush or deep boggy mud on unpaved tracks.',
          'Avoid steep eroded hillsides after heavy saturation due to slip risk.',
          'Carry gaiters and extra traction devices for steep mountain approaches.',
        ],
        critical: [
          'Avoid backcountry trails on saturated slopes prone to mudslides or washouts.',
          'In severe drought zones, carry double hydration and zero open-flame stoves.',
          'Stick to maintained paved overlooks until trail conditions stabilize.',
        ],
      },
      air: {
        nominal: [
          'Ideal conditions for aerobic trail running and high-elevation hikes.',
          'Keep standard hydration schedule along exposed ridges.',
          'Check afternoon ozone/dust levels if hiking near urban basins.',
        ],
        watch: [
          'Reduce vigorous ascent pace if you experience coughing or throat irritation.',
          'Sensitive individuals should carry rescue inhalers and choose shaded routes.',
          'Prefer morning hikes before afternoon dust and photochemical haze peak.',
        ],
        warning: [
          'Postpone strenuous cardio treks and high-altitude climbs.',
          'Wear a well-fitted N95 mask if walking outdoors in smoke or urban smog.',
          'Switch to low-exertion indoor activities until air quality improves.',
        ],
        critical: [
          'Cancel all outdoor hiking and trail sports immediately.',
          'Remain indoors with windows sealed and air recirculation enabled.',
          'Seek medical care promptly if experiencing shortness of breath or chest tightness.',
        ],
      },
    },
    responder: {
      wildfire: {
        nominal: [
          'Maintain routine apparatus readiness and verify VHF/UHF relay coverage.',
          'Update pre-incident water hydrant and pond access maps in dry districts.',
          'Review mutual-aid dispatch contacts for peri-urban forest interfaces.',
        ],
        watch: [
          'Verify bearing and distance to nearby thermal detections against ground reports.',
          'Alert volunteer forestry wardens and ready brush-engine crews.',
          'Stage water tenders near wildland-urban interface access corridors.',
        ],
        warning: [
          'Dispatch reconnaissance units to confirm fire perimeter, fuel type, and wind vector.',
          'Pre-notify vulnerable settlements downwind and prepare evacuation corridors.',
          'Coordinate aerial or drone spotters if smoke obscures ridge access.',
        ],
        critical: [
          'Initiate life-safety evacuation orders for communities inside the 5 km impact zone.',
          'Establish Incident Command upwind with clear ingress/egress safety zones.',
          'Deploy structure protection teams and request regional mutual aid immediately.',
        ],
      },
      flood: {
        nominal: [
          'Verify swift-water rescue gear, boats, and lifejackets are inspection-ready.',
          'Check telemetry gauges on primary river bridges and urban storm drains.',
          'Confirm shelter rosters and emergency generator fuel levels.',
        ],
        watch: [
          'Place swift-water rescue teams and flood pumps on standby.',
          'Coordinate municipal crews to clear critical culverts and underpass drains.',
          'Issue early readiness advisories to low-lying riverside settlements.',
        ],
        warning: [
          'Pre-stage rescue boats and high-clearance vehicles near flood-prone chokepoints.',
          'Close submerged low-water crossings and deploy traffic barricades.',
          'Activate emergency shelters and prepare evacuation transport for vulnerable households.',
        ],
        critical: [
          'Execute immediate evacuation and rescue operations in inundated sectors.',
          'Broadcast emergency alerts through sirens, radio, and local community leaders.',
          'Deconflict helicopter/boat landing zones and isolate downed electrical feeders.',
        ],
      },
      soil: {
        nominal: [
          'Include seasonal soil saturation status in routine weekly hazard briefings.',
          'Note dry fuel zones vs. saturated slope zones for vehicle off-road planning.',
          'Maintain standard heavy-vehicle recovery gear on rural response units.',
        ],
        watch: [
          'Factor reduced off-road traction into rural deployment routes if soil > 0.90.',
          'Increase brush-fire patrol readiness where root-zone wetness drops below 0.40.',
          'Monitor steep road cuts for minor rockfall after rainfall.',
        ],
        warning: [
          'Keep heavy fire/rescue trucks on paved or stabilized roads in saturated districts.',
          'Inspect hillside access roads for landslide indicators before committing convoys.',
          'Pre-position wildland suppression gear in severe soil-drying corridors.',
        ],
        critical: [
          'Treat steep saturated slopes as active landslide hazards; stage earthmoving gear.',
          'In severe drought corridors, enforce extreme fire-danger dispatch protocols.',
          'Verify rural water tanker refill points where surface streams have dried.',
        ],
      },
      air: {
        nominal: [
          'Standard respiratory PPE protocols apply for field operations.',
          'Keep particulate masks stocked on frontline ambulances and patrol vehicles.',
          'Log baseline AQI alongside regional wildfire smoke trajectories.',
        ],
        watch: [
          'Issue N95 respirators to traffic, patrol, and outdoor staging personnel.',
          'Anticipate increased respiratory dispatch calls from schools and elderly care.',
          'Rotate crews working extended perimeter shifts in smoky sectors.',
        ],
        warning: [
          'Mandate N95/P100 respiratory protection for non-SCBA outdoor responders.',
          'Coordinate with hospitals to prepare asthma and COPD surge capacity.',
          'Establish clean-air relief rooms at command posts and public shelters.',
        ],
        critical: [
          'Activate public health air-emergency protocols and distribute masks to high-risk zones.',
          'Minimize unprotected outdoor exposure for all non-emergency municipal staff.',
          'Direct ambulance triage toward clean-air shelters for vulnerable residents.',
        ],
      },
    },
    planner: {
      wildfire: {
        nominal: [
          'Update peri-urban greenbelt fuel-break zoning and hydrant spacing plans.',
          'Integrate seasonal thermal anomaly hotspots into land-use overlays.',
          'Audit building-code defensible space compliance in hillside subdivisions.',
        ],
        watch: [
          'Cross-reference nearby thermal detections with zoning and utility corridors.',
          'Coordinate municipal parks teams to clear dry brush along urban fringes.',
          'Review evacuation road bottlenecks serving hillside neighborhoods.',
        ],
        warning: [
          'Suspend municipal burn permits and park brush-clearing operations.',
          'Alert utility operators to inspect overhead lines crossing high-risk scrubland.',
          'Brief municipal emergency operations center on smoke plume exposure corridors.',
        ],
        critical: [
          'Support active EOC operations with GIS parcel, school, and hospital layers.',
          'Log fire footprint boundaries for post-event erosion and flood-runoff planning.',
          'Coordinate temporary housing and utility shutoff mapping with responders.',
        ],
      },
      flood: {
        nominal: [
          'Map impermeable surface expansion against watershed drainage capacity.',
          'Prioritize permeable pavements and bioswales in chronic pooling districts.',
          'Review floodplain setback enforcement for new construction permits.',
        ],
        watch: [
          'Inspect urban stormwater retention basins and pump station readiness.',
          'Verify construction sites have silt traps secured ahead of forecast rain.',
          'Flag low-lying transit corridors for proactive drainage maintenance.',
        ],
        warning: [
          'Coordinate municipal public works to open detention gates and mobile pumps.',
          'Issue transit rerouting notices for flood-prone underpasses and river bridges.',
          'Document high-water marks to calibrate future urban stormwater models.',
        ],
        critical: [
          'Support emergency shelter siting and critical infrastructure protection.',
          'Assess bridge, substation, and water-treatment plant flood exposure.',
          'Capture damage extents for resilient post-flood reconstruction zoning.',
        ],
      },
      soil: {
        nominal: [
          'Track seasonal soil moisture anomalies to plan urban tree-canopy irrigation.',
          'Incorporate root-zone trends into municipal groundwater recharge planning.',
          'Promote native drought-tolerant landscaping in public medians.',
        ],
        watch: [
          'Adjust municipal park watering schedules based on drying or saturated soil.',
          'Inspect retaining walls in saturated zones for hydrostatic drainage pressure.',
          'Monitor peri-urban agricultural land stress for food-supply resilience.',
        ],
        warning: [
          'Enact non-essential municipal water conservation measures during dry stress.',
          'Restrict heavy construction excavation on over-saturated clay slopes.',
          'Evaluate heat-island amplification caused by parched soils.',
        ],
        critical: [
          'Activate drought contingency water allocation across municipal sectors.',
          'In extreme saturation, cordon unstable slope zones near informal settlements.',
          'Prioritize urban cooling centers where dry soil accelerates surface heat.',
        ],
      },
      air: {
        nominal: [
          'Track 30-day AQI exceedance trends to evaluate transit and industrial corridors.',
          'Expand urban vegetative buffers along arterial roadways.',
          'Maintain public air-quality dashboards for school and clinic planning.',
        ],
        watch: [
          'Advise school districts to move strenuous outdoor PE indoors if AQI climbs.',
          'Increase street wetting on dusty arterial corridors to curb PM10.',
          'Review industrial and brick-kiln compliance during stagnant inversions.',
        ],
        warning: [
          'Recommend temporary restrictions on open waste burning and heavy diesel idling.',
          'Coordinate free public transit or carpool advisories to cut emissions.',
          'Open filtered public library and community-center clean-air spaces.',
        ],
        critical: [
          'Activate municipal smog-emergency plan: halt dust-heavy construction.',
          'Coordinate school schedule adjustments or remote learning advisories.',
          'Deploy mobile health units and distribute N95 masks in dense neighborhoods.',
        ],
      },
    },
  },
  ur: {
    farmer: {
      wildfire: {
        nominal: [
          'کھیتوں میں معمول کا کام جاری رکھیں اور فصل کی باقیات جلانے پر قابو رکھیں۔',
          'پانی کے ٹینک اور کھیتوں کے گرد حفاظتی فائر بریک خشک جھاڑیوں سے صاف رکھیں۔',
          'کسی بھی مجاز صفائی سے پہلے دوپہر کی ہوا کی رفتار ضرور چیک کریں۔',
        ],
        watch: [
          'گوداموں، چارے کے ڈھیروں اور مشینری کے گرد 10 میٹر تک خشک گھاس صاف کریں۔',
          'پانی کے پمپ اور پائپ چیک کریں تاکہ ہنگامی صورت میں شیڈ تک پہنچ سکیں۔',
          'ہوا کا رخ دیکھیں تاکہ دھواں مویشیوں کے باڑوں کی طرف نہ جائے۔',
        ],
        warning: [
          'خشک کھیتوں کے قریب آگ جلانا، ویلڈنگ یا چنگاری پیدا کرنے والی مشینری بند کریں۔',
          'مویشی، ٹریکٹر اور ایندھن کے ڈرم صاف اور کم گھاس والے محفوظ علاقے میں منتقل کریں۔',
          'باغات اور ذخیرہ شدہ اناج کے گرد حفاظتی پٹی کو پانی سے گیلا کریں۔',
        ],
        critical: [
          'خاندان اور مویشیوں کو فوری طور پر ہوا کے مخالف سمت محفوظ راستے سے نکالیں۔',
          'اگر محفوظ ہو تو گوداموں کی گیس، ڈیزل اور بجلی کی مین سپلائی بند کر دیں۔',
          'مقامی ہنگامی اداروں اور ریسکیو کی ہدایات پر عمل کریں؛ کھیت بچانے کے لیے نہ رکیں۔',
        ],
      },
      flood: {
        nominal: [
          'بارش سے پہلے کھیتوں کی نکاسی کی نالیوں سے گاد اور کچرا صاف کریں۔',
          'کھاد اور بیج کی بوریوں کو زمین سے اونچے تختوں پر محفوظ رکھیں۔',
          'جڑوں کی نمی کے مطابق معمول کے مطابق آبپاشی کا شیڈول جاری رکھیں۔',
        ],
        watch: [
          'شدید بارش سے پہلے کھیتوں کے کناروں اور بندوں کے نکاسی راستے کھول دیں۔',
          'کھاد ڈالنے میں تاخیر کریں تاکہ بارش کے پانی میں بہہ کر ضائع نہ ہو۔',
          'پورٹیبل پمپ اور بجلی کے سٹارٹرز اونچی جگہ پر منتقل کریں۔',
        ],
        warning: [
          'مویشی، چارہ اور زرعی مشینری دریا کے کناروں اور نشیبی زمین سے دور لے جائیں۔',
          'زیرِ آب آنے والے کھیتوں میں سبمرسیبل پمپ اور ٹرانسفارمر منقطع کر دیں۔',
          'اگر محفوظ طریقے سے ممکن ہو تو پکی ہوئی کھڑی فصل جلد کاٹ لیں۔',
        ],
        critical: [
          'نشیبی فارم ہاؤسز فوری خالی کریں اور سیلابی نالوں کو پار کرنے سے گریز کریں۔',
          'بندھے ہوئے مویشیوں کو کھول کر اونچے مقام کی طرف منتقل کریں۔',
          'سرکاری سیلابی انتباہات پر عمل کریں اور پانی اترنے سے پہلے کھیت میں داخل نہ ہوں۔',
        ],
      },
      soil: {
        nominal: [
          'فصل کے مرحلے کے مطابق متوازن آبپاشی کا وقفہ برقرار رکھیں۔',
          'زمین میں نمی برقرار رکھنے کے لیے سطحی ملچ (بھوسہ) محفوظ رکھیں۔',
          'سیٹلائٹ ریڈنگز کے ساتھ ہفتہ وار کھیت کی نمی کا ریکارڈ رکھیں۔',
        ],
        watch: [
          'اگر نمی کم ہو رہی ہو تو آبپاشی صبح سویرے یا شام کے وقت کریں۔',
          'اگر زمین میں پانی کھڑا ہو (>0.90) تو آبپاشی روک کر نکاسی کی نالیاں کھولیں۔',
          'کم گہری جڑوں والی سبزیوں میں مرجھانے یا زیادہ پانی کے دباؤ کی علامات دیکھیں۔',
        ],
        warning: [
          'پھول اور دانہ بننے کے نازک مراحل والی فصلوں کو دستیاب پانی میں ترجیح دیں۔',
          'بخارات کے ضیاع کو کم کرنے کے لیے نامیاتی ملچ یا فصل کی باقیات کی تہہ بچھائیں۔',
          'انتہائی خشک یا بہت گیلی زمین پر بھاری ٹریکٹر چلانے سے گریز کریں۔',
        ],
        critical: [
          'فوری طور پر کفایتی آبپاشی اپنائیں اور مستقل باغات و اہم فصلوں کو بچائیں۔',
          'ہنگامی نہری یا ٹیوب ویل باری کے لیے مقامی کسان تنظیموں سے رابطہ کریں۔',
          'نئی بوائی اس وقت تک مؤخر کریں جب تک زمین کی نمی بہتر نہ ہو یا پانی دستیاب نہ ہو۔',
        ],
      },
      air: {
        nominal: [
          'کھیتوں میں معمول کا کام اور سپرے بلا روک ٹوک جاری رکھیں۔',
          'گرد آلود ہل چلانے سے پہلے ٹریکٹر کیبن کے ایئر فلٹر صاف رکھیں۔',
          'محنت طلب کٹائی کا کام صبح کے ٹھنڈے اوقات میں کریں۔',
        ],
        watch: [
          'تھریشنگ یا دھول والے کام کے دوران مزدوروں کو N95 ماسک فراہم کریں۔',
          'بھاری مشقت صبح سویرے کریں جب سطحی دھند اور گرد عام طور پر کم ہوتی ہے۔',
          'مویشیوں کے پینے کا پانی ڈھانپ کر تازہ رکھیں۔',
        ],
        warning: [
          'دمہ یا دل کے مرض میں مبتلا افراد کا کھلی فضا میں طویل کام محدود کریں۔',
          'ضروری زرعی کام کے دوران N95 ماسک پہنیں اور سائے میں وقفے لیں۔',
          'فصل کی باقیات یا بھوسہ ہرگز نہ جلائیں تاکہ مقامی آلودگی مزید نہ بڑھے۔',
        ],
        critical: [
          'جب تک ہوا کا معیار بہتر نہ ہو غیر ضروری بیرونی زرعی کام معطل کر دیں۔',
          'بزرگوں، بچوں اور حساس مویشیوں کو بند اور محفوظ جگہوں پر منتقل کریں۔',
          'پولٹری اور ڈیری شیڈز میں ممکنہ حد تک صاف ہوا کی فلٹریشن کا انتظام کریں۔',
        ],
      },
    },
    hiker: {
      wildfire: {
        nominal: [
          'ٹریکنگ کا ضروری سامان، وافر پانی اور آف لائن نقشہ ساتھ رکھیں۔',
          'تصدیق کریں کہ جنگلات میں آگ جلانا ممنوع ہے یا صرف مقررہ جگہ تک محدود ہے۔',
          'تنگ گھاٹیوں میں جانے سے پہلے ہوا کی رفتار کا جائزہ لیں۔',
        ],
        watch: [
          'اونچے راستوں پر چڑھنے سے پہلے افق پر دھوئیں یا بو کا جائزہ لیں۔',
          'ایسے راستے منتخب کریں جہاں سے پکی سڑک پر واپسی کے متعدد متبادل موجود ہوں۔',
          'ہیڈ لیمپ، N95 ماسک اور مکمل چارج پاور بینک ساتھ رکھیں۔',
        ],
        warning: [
          'فعال آگ سے 15 کلومیٹر کے اندر جنگلاتی وادیوں اور پہاڑی راستوں سے گریز کریں۔',
          'ہوا کے رخ کے مخالف کھلے شہری پارکوں یا محفوظ راستوں کا انتخاب کریں۔',
          'ٹریک بندش کے لیے محکمہ جنگلات کے اعلانات مسلسل چیک کریں۔',
        ],
        critical: [
          'تمام ہائیکنگ فوری منسوخ کریں اور جنگل یا جھاڑیوں والے علاقے سے فوراً نکل جائیں۔',
          'دھوئیں کے بادل سے عمودی اور ہوا کے مخالف سمت میں سفر کریں۔',
          'ہنگامی عملے کی رکاوٹوں پر عمل کریں اور پھنسے ہوئے مسافروں کی اطلاع دیں۔',
        ],
      },
      flood: {
        nominal: [
          'وادی کے نقشے دیکھیں اور کیمپنگ کے لیے اونچی خشک جگہ منتخب کریں۔',
          'موسمی نالے عبور کرتے وقت واٹر پروف جوتے پہنیں۔',
          'تنگ گھاٹیوں میں داخل ہونے سے پہلے بالائی علاقے کا موسم چیک کریں۔',
        ],
        watch: [
          'خشک ندی نالوں یا تنگ گھاٹیوں کے فرش پر کیمپ لگانے سے گریز کریں۔',
          'پھسلن بھرے کیچڑ والے راستوں اور نالوں میں پانی بڑھنے کے لیے تیار رہیں۔',
          'دور گرج چمک یا مٹیالے پانی کا ریلا نظر آتے ہی فوراً واپس مڑ جائیں۔',
        ],
        warning: [
          'فلیش فلڈ کے خطرے کے باعث ندی کنارے اور تنگ گھاٹیوں کے ٹریک منسوخ کریں۔',
          'تیز بہتے پانی میں پیدل چلنے یا گاڑی گزارنے کی ہرگز کوشش نہ کریں۔',
          'پانی بڑھنے کی صورت میں فوراً قریب ترین اونچے مقام پر چڑھ جائیں۔',
        ],
        critical: [
          'دریاؤں کے کناروں، پلوں اور لینڈ سلائیڈنگ والی ڈھلوانوں سے مکمل دور رہیں۔',
          'پانی کے بہاؤ کے ساتھ بھاگنے کے بجائے فوراً عمودی طور پر اونچی جگہ جائیں۔',
          'پھنس جانے کی صورت میں اپنے درست نقاط کے ساتھ ہنگامی امداد کو کال کریں۔',
        ],
      },
      soil: {
        nominal: [
          'مضبوط اور معمول کی پکڑ والے راستوں کی توقع رکھیں۔',
          'ڈھلوان اترتے وقت توازن کے لیے ٹریکنگ پولز استعمال کریں۔',
          'پائیدار مرکزی پگڈنڈیوں پر رہ کر قدرتی ماحول کی حفاظت کریں۔',
        ],
        watch: [
          'اگر زمین کی نمی 0.90 سے زیادہ ہو تو چکنی مٹی پر شدید پھسلن سے ہوشیار رہیں۔',
          'خشک علاقوں میں اضافی پانی ساتھ رکھیں اور خشک گھاس پر چنگاری سے بچیں۔',
          'گیلی یا ڈھیلی پتھریلی چڑھائیوں پر ٹریکنگ پولز کا سہارا لیں۔',
        ],
        warning: [
          'کچے راستوں پر یا تو شدید دھول یا گہرے کیچڑ کا سامنا ہو سکتا ہے۔',
          'پانی سے تر ڈھلوانوں پر پھسلن اور مٹی سرکنے کے خطرے سے بچیں۔',
          'اونچے پہاڑی راستوں کے لیے مضبوط گرفت والے بوٹ اور گیٹرز استعمال کریں۔',
        ],
        critical: [
          'مٹی کے تودے گرنے کے خطرے والی تر ڈھلوانوں کے تمام راستے ترک کر دیں۔',
          'شدید خشک سالی والے علاقوں میں دوگنا پانی رکھیں اور چولہا نہ جلائیں۔',
          'حالات بہتر ہونے تک صرف پکی اور محفوظ سیرگاہوں تک محدود رہیں۔',
        ],
      },
      air: {
        nominal: [
          'تیز چہل قدمی اور اونچے پہاڑی ٹریکنگ کے لیے بہترین فضا ہے۔',
          'دھوپ والے راستوں پر پانی پینے کا معمول برقرار رکھیں۔',
          'شہری وادیوں کے قریب دوپہر کے وقت گرد اور اوزون کی سطح چیک کریں۔',
        ],
        watch: [
          'کھانسی یا گلے میں خراش محسوس ہو تو چڑھائی کی رفتار کم کر دیں۔',
          'حساس افراد اپنا انہیلر ساتھ رکھیں اور سایہ دار راستے منتخب کریں۔',
          'دوپہر کی گرد اور سموگ سے بچنے کے لیے صبح سویرے ہائیکنگ کریں۔',
        ],
        warning: [
          'سخت جسمانی مشقت والی چڑھائیاں اور بلند ہائیکنگ مؤخر کر دیں۔',
          'دھوئیں یا شہری سموگ میں باہر چلتے ہوئے مناسب N95 ماسک پہنیں۔',
          'ہوا بہتر ہونے تک کم مشقت والی اندرونی سرگرمیاں اختیار کریں۔',
        ],
        critical: [
          'تمام بیرونی ہائیکنگ اور ٹریل کھیل فوری طور پر منسوخ کر دیں۔',
          'کھڑکیاں بند کر کے گھر کے اندر رہیں اور اندرونی ہوا صاف رکھیں۔',
          'سانس لینے میں دشواری یا سینے میں جکڑن ہو تو فوری طبی امداد لیں۔',
        ],
      },
    },
    responder: {
      wildfire: {
        nominal: [
          'گاڑیوں کی معمول کی تیاری اور وائرلیس کمیونیکیشن ریلے کی جانچ جاری رکھیں۔',
          'خشک اضلاع میں فائر ہائیڈرنٹس اور پانی کے ذخائر کے نقشے اپ ڈیٹ رکھیں۔',
          'جنگل اور آبادی کے سنگم والے علاقوں کے باہمی امدادی رابطے چیک کریں۔',
        ],
        watch: [
          'قریبی تھرمل نشاندہی کی سمت اور فاصلے کی زمینی اطلاعات سے تصدیق کریں۔',
          'جنگلات کے رضاکاروں کو الرٹ کریں اور برش فائر عملے کو تیار رکھیں۔',
          'آبادی اور جنگل کے درمیانی راستوں کے قریب واٹر ٹینڈرز تعینات کریں۔',
        ],
        warning: [
          'آگ کے گھیرے، ایندھن کی نوعیت اور ہوا کے رخ کی تصدیق کے لیے ریکی ٹیم بھیجیں۔',
          'ہوا کے رخ پر واقع بستیوں کو پیشگی آگاہ کریں اور انخلا کے راستے تیار رکھیں۔',
          'اگر دھوئیں سے راستہ نظر نہ آئے تو ڈرون یا فضائی نگرانی سے مدد لیں۔',
        ],
        critical: [
          '5 کلومیٹر کے اندر موجود آبادیوں کے لیے فوری جان بچاؤ انخلا کے احکامات جاری کریں۔',
          'ہوا کے مخالف سمت محفوظ انٹری و ایگزٹ زون کے ساتھ کمانڈ پوسٹ قائم کریں۔',
          'عمارتوں کے تحفظ کی ٹیمیں تعینات کریں اور فوری علاقائی امداد طلب کریں۔',
        ],
      },
      flood: {
        nominal: [
          'تصدیق کریں کہ ریسکیو کشتیاں، لائف جیکٹس اور حفاظتی آلات مکمل تیار ہیں۔',
          'اہم پلوں اور شہری نالوں پر پانی کی سطح کے گیجز چیک کریں۔',
          'پناہ گاہوں کی فہرست اور جنریٹرز کے ایندھن کی تصدیق کریں۔',
        ],
        watch: [
          'تیز پانی میں ریسکیو ٹیموں اور ڈی واٹرنگ پمپس کو سٹینڈ بائی پر رکھیں۔',
          'بلدیاتی عملے کے ساتھ مل کر اہم پلیاں اور انڈر پاس نالے صاف کروائیں۔',
          'دریا کنارے نشیبی بستیوں کو ابتدائی تیاری کی ہدایات جاری کریں۔',
        ],
        warning: [
          'سیلابی رکاوٹوں کے قریب ریسکیو کشتیاں اور اونچی گاڑیاں پہلے سے تعینات کریں۔',
          'زیرِ آب آنے والے کم اونچائی کے راستے بند کریں اور بیریکیڈز لگائیں۔',
          'ہنگامی شیلٹرز فعال کریں اور کمزور خاندانوں کی منتقلی کے لیے ٹرانسپورٹ تیار رکھیں۔',
        ],
        critical: [
          'زیرِ آب علاقوں میں فوری انخلا اور جان بچاؤ آپریشن شروع کریں۔',
          'سائرن، ریڈیو اور مقامی کمیونٹی رہنماؤں کے ذریعے ہنگامی اعلانات نشر کریں۔',
          'کشتی اور ہیلی کاپٹر لینڈنگ زون محفوظ بنائیں اور گرے ہوئے بجلی کے فیڈر بند کروائیں۔',
        ],
      },
      soil: {
        nominal: [
          'ہفتہ وار بریفنگ میں موسمی زمینی نمی کی صورتحال شامل رکھیں۔',
          'آف روڈ گاڑیوں کی منصوبہ بندی کے لیے خشک اور دلدلی زون نشان زد کریں۔',
          'دیہی ریسکیو یونٹس میں بھاری گاڑیاں نکالنے کا سامان برقرار رکھیں۔',
        ],
        watch: [
          'اگر نمی 0.90 سے زیادہ ہو تو دیہی راستوں میں گاڑیوں کی پھسلن مدنظر رکھیں۔',
          'جہاں جڑوں کی نمی 0.40 سے کم ہو وہاں آگ لگنے کے گشت میں اضافہ کریں۔',
          'بارش کے بعد پہاڑی سڑکوں کے کٹاؤ پر معمولی پتھر گرنے کی نگرانی کریں۔',
        ],
        warning: [
          'انتہائی تر اضلاع میں بھاری فائر اور ریسکیو ٹرک صرف پکی سڑکوں پر رکھیں۔',
          'قافلے بھیجنے سے پہلے پہاڑی سڑکوں پر لینڈ سلائیڈنگ کے آثار چیک کریں۔',
          'خشک زونز میں جنگلی آگ بجھانے کا سامان پہلے سے تعینات کریں۔',
        ],
        critical: [
          'شدید تر ڈھلوانوں کو فعال لینڈ سلائیڈ خطرہ سمجھیں اور بھاری مشینری تیار رکھیں۔',
          'شدید خشک سالی والے علاقوں میں ہنگامی فائر الرٹ پروٹوکول نافذ کریں۔',
          'جہاں نالے خشک ہو چکے ہوں وہاں پانی کے ٹینکرز بھرنے کے متبادل مقامات چیک کریں۔',
        ],
      },
      air: {
        nominal: [
          'فیلڈ آپریشنز کے لیے سانس کے حفاظتی آلات کے معمول کے اصول نافذ رکھیں۔',
          'ایمبولینسز اور گشتی گاڑیوں میں پارٹیکیولیٹ ماسک کا سٹاک رکھیں۔',
          'علاقائی دھوئیں کے رخ کے ساتھ بنیادی AQI ریکارڈ محفوظ کریں۔',
        ],
        watch: [
          'ٹریفک، گشت اور بیرونی تعیناتی والے عملے کو N95 ماسک جاری کریں۔',
          'سکولوں اور بزرگوں کی دیکھ بھال کے مراکز سے سانس کی ایمرجنسی کالز کے لیے تیار رہیں۔',
          'دھوئیں والے علاقوں میں طویل شفٹ والے عملے کو وقفے وقفے سے تبدیل کریں۔',
        ],
        warning: [
          'باہر کام کرنے والے ریسپانڈرز کے لیے N95/P100 ماسک لازمی قرار دیں۔',
          'ہسپتالوں کے ساتھ دمہ اور سانس کے مریضوں کے رش کی تیاری کے لیے رابطہ کریں۔',
          'کمانڈ پوسٹوں اور شیلٹرز میں صاف ہوا والے ریلیف رومز قائم کریں۔',
        ],
        critical: [
          'عوامی صحت کا فضائی ایمرجنسی پروٹوکول فعال کریں اور متاثرہ زونز میں ماسک تقسیم کریں۔',
          'غیر ہنگامی بلدیاتی عملے کی کھلی فضا میں موجودگی کم سے کم کریں۔',
          'کمزور شہریوں کو صاف ہوا والے شیلٹرز کی طرف منتقل کرنے میں مدد کریں۔',
        ],
      },
    },
    planner: {
      wildfire: {
        nominal: [
          'شہر کے کنارے گرین بیلٹ میں فائر بریک زوننگ اور ہائیڈرنٹ فاصلے اپ ڈیٹ کریں۔',
          'زمینی استعمال کے نقشوں میں موسمی حرارتی ہاٹ اسپاٹس شامل کریں۔',
          'پہاڑی بستیوں میں عمارتوں کے گرد حفاظتی فاصلوں کے قوانین کا جائزہ لیں۔',
        ],
        watch: [
          'قریبی حرارتی نشاندہی کا موازنہ زوننگ اور بجلی کی لائنوں کے نقشوں سے کریں۔',
          'بلدیاتی پارکس ٹیموں کے ذریعے شہری کناروں پر خشک جھاڑیاں صاف کروائیں۔',
          'پہاڑی محلوں کی انخلا سڑکوں میں ٹریفک کی رکاوٹوں کا جائزہ لیں۔',
        ],
        warning: [
          'جھاڑیاں جلانے کے بلدیاتی اجازت نامے اور متعلقہ سرگرمیاں معطل کریں۔',
          'بجلی کمپنیوں کو خشک جھاڑیوں کے اوپر سے گزرنے والی تاروں کے معائنے کی ہدایت کریں۔',
          'ایمرجنسی آپریشنز سینٹر کو دھوئیں سے متاثرہ آبادیوں کے بارے میں بریف کریں۔',
        ],
        critical: [
          'جی آئی ایس پارسل، سکول اور ہسپتال کے نقشوں کے ساتھ ریسکیو سینٹر کی مدد کریں۔',
          'آگ کے بعد مٹی کے کٹاؤ اور سیلابی بہاؤ کی منصوبہ بندی کے لیے متاثرہ حد ریکارڈ کریں۔',
          'عارضی رہائش اور بجلی بندش کے نقشوں میں ریسپانڈرز کے ساتھ تعاون کریں۔',
        ],
      },
      flood: {
        nominal: [
          'نکاسی آب کی گنجائش کے مقابلے میں پکی سطحوں کے پھیلاؤ کا نقشہ بنائیں۔',
          'پانی جمع ہونے والے علاقوں میں جاذب فرش اور بائیو سوالز کو ترجیح دیں۔',
          'نئے تعمیراتی اجازت ناموں میں سیلابی گزرگاہ کے فاصلوں پر سختی سے عمل کروائیں۔',
        ],
        watch: [
          'شہری بارشی پانی کے تالابوں اور پمپنگ اسٹیشنوں کی تیاری کا معائنہ کریں۔',
          'بارش سے پہلے تعمیراتی مقامات پر مٹی روکنے والے ٹریپس چیک کریں۔',
          'نشیبی ٹرانزٹ سڑکوں پر پیشگی صفائی اور نکاسی کا انتظام کریں۔',
        ],
        warning: [
          'بلدیاتی ورکس کے ذریعے ڈرینج گیٹس اور موبائل پمپس فعال کروائیں۔',
          'زیرِ آب آنے والے انڈر پاسز اور پلوں کے لیے متبادل ٹریفک پلان جاری کریں۔',
          'مستقبل کے نکاسی ماڈلز کو بہتر بنانے کے لیے پانی کی بلند ترین سطح ریکارڈ کریں۔',
        ],
        critical: [
          'ہنگامی شیلٹرز کے مقامات اور اہم تنصیبات کے تحفظ میں معاونت کریں۔',
          'پلوں، گرڈ اسٹیشنوں اور واٹر ٹریٹمنٹ پلانٹس کے سیلابی خطرے کا جائزہ لیں۔',
          'محفوظ تعمیرِ نو کی زوننگ کے لیے نقصانات کا درست حدود ریکارڈ محفوظ کریں۔',
        ],
      },
      soil: {
        nominal: [
          'شہری درختوں کی آبپاشی کے لیے موسمی زمینی نمی کے رجحانات مانیٹر کریں۔',
          'زیرِ زمین پانی کی بحالی کی منصوبہ بندی میں جڑوں کی نمی کا ڈیٹا شامل کریں۔',
          'عوامی پارکوں میں کم پانی والے مقامی پودوں کی حوصلہ افزائی کریں۔',
        ],
        watch: [
          'خشک یا تر زمین کے مطابق بلدیاتی پارکوں میں پانی دینے کا شیڈول بدلیں۔',
          'انتہائی تر علاقوں میں حفاظتی دیواروں پر پانی کے دباؤ کا معائنہ کریں۔',
          'غذائی تحفظ کے لیے مضافاتی زرعی زمین کے دباؤ پر نظر رکھیں۔',
        ],
        warning: [
          'خشک سالی کے دوران غیر ضروری بلدیاتی پانی کے استعمال پر پابندیاں نافذ کریں۔',
          'زیادہ تر چکنی مٹی والی ڈھلوانوں پر بھاری تعمیراتی کھدائی محدود کریں۔',
          'خشک زمین کے باعث شہری حدت (ہیٹ آئی لینڈ) میں اضافے کا جائزہ لیں۔',
        ],
        critical: [
          'تمام بلدیاتی شعبوں میں خشک سالی کے ہنگامی پانی کی تقسیم کا پلان نافذ کریں۔',
          'شدید تر صورتحال میں کچی آبادیوں کے قریب غیر مستحکم ڈھلوانوں کو بند کریں۔',
          'جہاں خشک زمین گرمی بڑھا رہی ہو وہاں عوامی کولنگ سینٹرز کو ترجیح دیں۔',
        ],
      },
      air: {
        nominal: [
          'ٹرانزٹ اور صنعتی راہداریوں کا جائزہ لینے کے لیے 30 روزہ AQI رجحان ٹریک کریں۔',
          'اہم شاہراہوں کے کنارے سبز درختوں کی پٹیوں میں اضافہ کریں۔',
          'سکولوں اور کلینکس کے لیے عوامی فضائی معیار کی معلومات برقرار رکھیں۔',
        ],
        watch: [
          'اگر AQI بڑھے تو سکولوں کو بیرونی کھیل انڈور منتقل کرنے کا مشورہ دیں۔',
          'PM10 دھول کم کرنے کے لیے گرد آلود سڑکوں پر پانی کا چھڑکاؤ بڑھائیں۔',
          'ہوا رکنے کی صورت میں صنعتوں اور بھٹوں کے ضوابط کا معائنہ کریں۔',
        ],
        warning: [
          'کھلے کچرے کو جلانے اور بھاری ڈیزل گاڑیوں کی بے جا سٹارٹنگ پر پابندی تجویز کریں۔',
          'دھوئیں کو کم کرنے کے لیے پبلک ٹرانسپورٹ یا کارپول کی ترغیب دیں۔',
          'لائبریریوں اور کمیونٹی سینٹرز میں فلٹر شدہ صاف ہوا کے مقامات کھولیں۔',
        ],
        critical: [
          'بلدیاتی سموگ ایمرجنسی پلان نافذ کریں: گرد اڑانے والی تعمیرات روک دیں۔',
          'سکولوں کے اوقات کار میں تبدیلی یا آن لائن تعلیم کی ہدایات پر عملدرآمد کروائیں۔',
          'گنجان آباد محلوں میں موبائل ہیلتھ یونٹس بھیجیں اور N95 ماسک تقسیم کریں۔',
        ],
      },
    },
  },
};

export function getActionPlanSteps(
  language: Language,
  persona: Persona,
  hazard: HazardId,
  status: SeverityStatus
): string[] {
  const safeStatus: ActiveStatus = status === 'nodata' ? 'nominal' : status;
  return ACTION_PLANS[language][persona][hazard][safeStatus];
}
