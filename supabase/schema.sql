-- ============================================================
-- Sibert Residence — Supabase schema for the admin-editable CMS
-- Run this once in your Supabase project's SQL editor.
-- ============================================================

-- 1. Content table: one row per editable section, value holds the JSON blob.
create table if not exists site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

-- Anyone (including the public website, unauthenticated) can read content.
create policy "Public can read site content"
  on site_content for select
  using (true);

-- Only logged-in admin users can create/update/delete content.
create policy "Authenticated users can insert site content"
  on site_content for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update site content"
  on site_content for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete site content"
  on site_content for delete
  to authenticated
  using (true);

-- Keep updated_at fresh on every write.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_site_content_updated_at on site_content;
create trigger trg_site_content_updated_at
  before update on site_content
  for each row execute function set_updated_at();

-- 2. Storage bucket for admin-uploaded photos.
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

create policy "Public can view site images"
  on storage.objects for select
  using (bucket_id = 'site-images');

create policy "Authenticated users can upload site images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-images');

create policy "Authenticated users can update site images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-images');

create policy "Authenticated users can delete site images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-images');

-- ============================================================
-- 3. Seed data — matches the site's built-in defaults so the
--    admin panel opens with real content already in place.
--    Safe to re-run: uses upsert.
-- ============================================================

insert into site_content (key, value) values
('site', '{
  "name": "Sibert Residence",
  "tagline": "La Digue · Seychelles",
  "sloganEyebrow": "Welcome to Paradise",
  "slogan": "Your Serene Hideaway in La Digue",
  "phone": "+248 423 4142",
  "phoneHref": "tel:+2484234142",
  "whatsapp": "+248 266 9035",
  "whatsappNumber": "2482669035",
  "whatsappHref": "https://wa.me/2482669035?text=Hi%20Sibert%20Residence%2C%20I%27d%20like%20to%20know%20more%20about%20a%20stay.",
  "email": "sibertresidence@seychelles.net",
  "address": "La Passe, La Digue, Seychelles",
  "mapsHref": "https://www.google.com/maps/search/?api=1&query=Sibert+Residence%2C+La+Passe%2C+La+Digue%2C+Seychelles",
  "mapsEmbedSrc": "https://maps.google.com/maps?q=Sibert%20Residence%2C%20La%20Passe%2C%20La%20Digue%2C%20Seychelles&t=&z=17&ie=UTF8&iwloc=&output=embed",
  "logoWhite": "/images/logo/sibert-logo-white.png",
  "logoMark": "/images/logo/sibert-logo-white.png",
  "social": {
    "facebook": "https://www.facebook.com/share/1KKimtbTF",
    "instagram": "https://www.instagram.com/sibertresidence/"
  }
}'::jsonb),

('exterior_images', '{
  "hero": "/images/exterior/drone-wide.jpg",
  "heroSlides": [
    "/images/exterior/drone-wide.jpg",
    "/images/exterior/drone-coastline.jpg",
    "/images/exterior/drone-rooftops.jpg",
    "/images/exterior/street-view.jpg"
  ],
  "story": "/images/exterior/entrance-close.jpg",
  "about": "/images/exterior/street-view.jpg",
  "cta": "/images/exterior/drone-canopy-1.jpg"
}'::jsonb),

('rooms', '[
  {
    "slug": "superior",
    "name": "Superior Room",
    "tagline": "Bright, breezy, and effortlessly comfortable.",
    "description": "A sunlit retreat featuring a king size bed, coastal teal decor, and a private balcony with lush tropical views. Designed with cosy armchair seating and warm wooden finishes, it''s the ideal space for couples or solo travellers to unwind after a day on the island.",
    "bedding": "1 King Size Bed",
    "occupancy": "Max 2 Adults, or 1 Adult + 1 Child (6–11 yrs)",
    "guestOptions": ["2 Adults", "1 Adult + 1 Child (6–11 yrs)"],
    "highlights": ["Private balcony", "Plush seating area", "Airy tile flooring"],
    "image": "/images/rooms/superior.png",
    "priceFrom": 186
  },
  {
    "slug": "deluxe",
    "name": "Deluxe Room",
    "tagline": "Expansive comfort with extra room to relax.",
    "description": "Generously spaced to host couples or small families, the Deluxe Room features a main plush bed plus an extra single daybed. Comes fully appointed with a private ensuite bathroom, a full wooden wardrobe, and a dedicated vanity desk.",
    "bedding": "1 King Bed + 1 Single Bed",
    "occupancy": "Max 2 Adults + 1 Child (6–11 yrs), or 1 Adult + 2 Children (6–11 yrs)",
    "guestOptions": ["2 Adults + 1 Child (6–11 yrs)", "1 Adult + 2 Children (6–11 yrs)"],
    "highlights": ["Extra spacious layout", "Private ensuite bathroom", "Generous storage space"],
    "image": "/images/rooms/deluxe.png",
    "priceFrom": 201
  }
]'::jsonb),

('pricing', '{
  "currency": "€",
  "validity": "1 November 2026 – 31 October 2027",
  "note": "Rates are per room, per night, inclusive of breakfast, taxes and service charge — based on 2 adults sharing.",
  "seasons": [
    { "name": "Low Season", "dates": "1–30 Sep 2026 · 1–20 Dec 2026 · 1 May – 30 Jun 2027" },
    { "name": "High Season", "dates": "1–30 Nov 2026 · 10 Jan – 20 Mar 2027 · 5–30 Apr 2027 · 1 Jul – 31 Aug 2027 · 1–31 Oct 2027" },
    { "name": "Peak Season", "dates": "21 Dec 2026 – 9 Jan 2027 · 21 Mar – 4 Apr 2027" }
  ],
  "seasonRanges": [
    { "season": "low", "start": "2026-09-01", "end": "2026-09-30" },
    { "season": "low", "start": "2026-12-01", "end": "2026-12-20" },
    { "season": "low", "start": "2027-05-01", "end": "2027-06-30" },
    { "season": "high", "start": "2026-11-01", "end": "2026-11-30" },
    { "season": "high", "start": "2027-01-10", "end": "2027-03-20" },
    { "season": "high", "start": "2027-04-05", "end": "2027-04-30" },
    { "season": "high", "start": "2027-07-01", "end": "2027-08-31" },
    { "season": "high", "start": "2027-10-01", "end": "2027-10-31" },
    { "season": "peak", "start": "2026-12-21", "end": "2027-01-09" },
    { "season": "peak", "start": "2027-03-21", "end": "2027-04-04" }
  ],
  "minStay": { "low": 2, "high": 2, "peak": 3 },
  "rates": [
    { "room": "Superior Room", "low": 186, "high": 205, "peak": 240 },
    { "room": "Deluxe Room", "low": 201, "high": 220, "peak": 255 }
  ],
  "extras": [
    "Half Board Supplement: €75 / night per adult (12+ yrs), €40 / night per child (6–11 yrs)",
    "Extra Bed Supplement: €50 / night (child 6–11 yrs only)",
    "Early Bird Offer: 10% off in High Season or 5% off in Low Season — book 60+ days ahead, B&B basis, minimum 3-night stay. Not combinable with other offers; not applicable to child-sharing bookings.",
    "Long Stay Offer: 15% off for stays of 7+ nights — High Season only, B&B basis. Not combinable with other offers; not applicable to child-sharing bookings.",
    "Christmas Eve Dinner Supplement (24 Dec, optional for B&B/HB guests): €90 per adult (12+ yrs), €45 per child (6–11 yrs)",
    "New Year''s Eve Dinner Supplement (31 Dec, compulsory): B&B €105 per adult / €55 per child · Half Board €30 per adult / €15 per child",
    "Honeymooners receive a bottle of sparkling wine and a fruit platter (valid 6 months from wedding date)"
  ],
  "occupancy": "Superior Room: max 2 adults, or 1 adult + 1 child (6–11 yrs). Deluxe Room: max 2 adults + 1 child (6–11 yrs), or 1 adult + 2 children (6–11 yrs). Base rate is for 2 adults.",
  "prepayment": [
    "Low & High Seasons: 50% deposit due 7 days prior to arrival — remaining 50% balance due on check-in.",
    "Peak Season: 100% deposit due 21 days prior to arrival."
  ],
  "cancellation": [
    "High & Low Seasons: free cancellation 8+ days before arrival · 0–7 days: 50% charge · no-show/early departure: 100% charge",
    "Peak Season: free cancellation 22+ days before arrival · 0–21 days: 100% charge · no-show/early departure: 100% charge"
  ]
}'::jsonb),

('services', '[
  {
    "id": "boat",
    "name": "Boat Excursion",
    "tagline": "Sail, snorkel and explore the coastline",
    "description": "Head out onto the Indian Ocean in comfort and style — sailing past granite headlands, stopping to snorkel over reef and coral, and taking in La Digue''s coastline from the water. A relaxed way to see the neighbouring islands and hidden coves that are hard to reach on foot.",
    "highlights": ["Half-day & full-day options", "Snorkelling gear included", "Small group or private charter"],
    "image": "/images/services/boat-excursion.jpg"
  },
  {
    "id": "buggy",
    "name": "Buggy Island Tour",
    "tagline": "Explore La Digue in style",
    "description": "An exciting buggy ride through scenic trails, past white-sand beaches and hidden island gems, for an unforgettable adventure. A great option for anyone who wants to see more of the island without pedalling every mile themselves.",
    "highlights": ["Guided island route", "Stops at key viewpoints", "Great for groups & families"],
    "image": "/images/services/buggy-sibert.jpg"
  },
  {
    "id": "bike",
    "name": "Bicycle Rental",
    "tagline": "Two wheels, island pace",
    "description": "La Digue is famously best explored by bike. Rent one directly from Sibert Residence and enjoy an eco-friendly ride to beaches, Creole villages, and coastal viewpoints — at your own pace, with no engine noise to interrupt the island quiet.",
    "highlights": ["Daily & multi-day rental", "Well-maintained bikes", "Free route suggestions"],
    "image": "https://sibert.sc/wp-content/uploads/2025/10/sibert-residence-c-8877.jpg"
  }
]'::jsonb),

('gallery_images', '[
  "/images/exterior/drone-coastline.jpg",
  "/images/exterior/entrance-close.jpg",
  "/images/rooms/balcony.jpg",
  "/images/restaurant/dining-chandelier.jpg",
  "/images/shop/moonlight-sign.jpg",
  "/images/services/boat-excursion.jpg"
]'::jsonb),

('restaurant_photos', '[
  { "title": "The Dining Room", "description": "A hand-painted sunset mural wraps the ceiling of the dining room, giving every table an island backdrop, rain or shine.", "image": "/images/restaurant/dining-room-wide.jpg" },
  { "title": "Sunset Mural Ceiling", "description": "Granite boulders, palm trees and a blazing Seychellois sunset — painted overhead, table to table.", "image": "/images/restaurant/dining-chandelier.jpg" },
  { "title": "The Bar", "description": "A granite-top bar stocked with Seychellois rum, Takamaka spirits and the makings of a proper tropical cocktail.", "image": "/images/restaurant/bar-counter.jpg" },
  { "title": "Behind the Bar", "description": "Local liqueurs and spirits lined up and ready — Tia Maria, Takamaka rum, Grand Marnier and more for the evening''s cocktail list.", "image": "/images/restaurant/bar-bottles.jpg" },
  { "title": "Cocktail Bar Nook", "description": "Tucked among the palms, our casual grill and juice bar serves fresh fruit juices, smoothies and cocktails through the day.", "image": "/images/restaurant/cocktail-bar-terrace.jpg" },
  { "title": "Welcome In", "description": "Rum barrels dressed with fresh coconuts and hibiscus mark the entrance — a small taste of what''s inside.", "image": "/images/restaurant/entrance-barrels-1.jpg" }
]'::jsonb),

('shop_categories', '[
  { "name": "Woven & Hand-Made Crafts", "description": "Palm-leaf weaving, baskets and coconut-shell pieces made by local artisans.", "image": "/images/shop/shop-crafts-1.jpg" },
  { "name": "Island Keepsakes", "description": "Carved wood pieces, shell displays and small Creole artwork to remember La Digue by.", "image": "/images/shop/shop-crafts-2.jpg" },
  { "name": "Jewellery & Accessories", "description": "Shell and bead jewellery, sun hats and bracelets handmade by local craftspeople.", "image": "/images/shop/shop-crafts-3.jpg" }
]'::jsonb),

('faq', '{
  "checkIn": "12:00hrs",
  "checkOut": "10:00hrs",
  "checkInOutNote": "Early check-in and late check-out are subject to availability. To guarantee early check-in before 12:00hrs or late check-out until 15:00hrs, an extra charge of 50% of one night''s accommodation applies.",
  "restaurantHours": [
    { "label": "Breakfast", "time": "07:00hrs – 10:00hrs" },
    { "label": "Lunch / Dinner", "time": "11:00hrs – 21:00hrs (last order)" }
  ],
  "items": [
    { "question": "What time is check-in and check-out?", "answer": "Check-in is from 12:00hrs and check-out is by 10:00hrs. Early check-in and late check-out are subject to availability — to guarantee early check-in before 12:00hrs or late check-out until 15:00hrs, an extra charge of 50% of one night''s accommodation applies." },
    { "question": "What are the restaurant''s opening hours?", "answer": "Breakfast: 07:00hrs – 10:00hrs. Lunch & Dinner: 11:00hrs – 21:00hrs (last order)." },
    { "question": "Is there a minimum stay?", "answer": "Yes — Min Stay: 2 Nights (High & Low Seasons). Min Stay: 3 Nights (Peak Season). The applicable minimum is shown automatically once you select your dates." },
    { "question": "How much deposit do I need to pay to book?", "answer": "For Low and High Season stays, a 50% deposit is due 7 days before arrival, with the remaining 50% balance paid on check-in. For Peak Season stays, a 100% deposit is due 21 days before arrival." },
    { "question": "What is your cancellation policy?", "answer": "In High and Low Seasons, cancellations are free 8 or more days before arrival; 0–7 days before arrival incurs a 50% charge, and no-shows or early departures are charged in full. In Peak Season, cancellations are free 22 or more days before arrival; inside that window, or for no-shows and early departures, the full amount is charged." },
    { "question": "Do you offer half board?", "answer": "Yes — a Half Board Supplement of €75 per night per adult (12+ yrs) and €40 per night per child (6–11 yrs) can be added to a B&B booking." },
    { "question": "Is there a discount for early bookings or long stays?", "answer": "Yes — book 60 or more days ahead on a B&B basis (minimum 3 nights) for 10% off in High Season or 5% off in Low Season. Stays of 7 or more nights in High Season get 15% off on a B&B basis. These offers aren''t combinable with each other and don''t apply to child-sharing bookings." }
  ]
}'::jsonb),

('availability', '{
  "blockedDates": {
    "superior": [],
    "deluxe": []
  }
}'::jsonb)

on conflict (key) do update set value = excluded.value;

-- ============================================================
-- 4. Create your first admin login
--    Supabase Auth has no public sign-up form on this site by
--    design — create admin accounts yourself:
--    Dashboard → Authentication → Users → Add user
--    (set "Auto Confirm User" so no email verification is needed)
-- ============================================================

-- ============================================================
-- 5. INCREMENTAL MIGRATION — run this instead of the whole file
--    if you already ran this schema once and have since edited
--    content from the admin panel (re-running the seed above
--    would overwrite those edits). This block only merges in the
--    WhatsApp fields and removes the retired restaurant menu —
--    it leaves everything else you've saved untouched.
-- ============================================================

update site_content
set value = value || '{
  "whatsapp": "+248 423 4142",
  "whatsappHref": "https://wa.me/2484234142?text=Hi%20Sibert%20Residence%2C%20I%27d%20like%20to%20know%20more%20about%20a%20stay."
}'::jsonb
where key = 'site' and not (value ? 'whatsappHref');

delete from site_content where key = 'menu_highlights';

-- ============================================================
-- 6. OPTIONAL — refresh exterior/services/gallery/restaurant
--    photos to the newest batch supplied by the client.
--    WARNING: unlike block 5, this REPLACES those four sections
--    wholesale. Only run it if you have NOT customized these
--    sections from the admin panel yet — otherwise copy just the
--    keys you want from the main seed above instead.
-- ============================================================

update site_content set value = '{
  "hero": "/images/exterior/drone-wide.jpg",
  "heroSlides": [
    "/images/exterior/drone-wide.jpg",
    "/images/exterior/drone-coastline.jpg",
    "/images/exterior/drone-rooftops.jpg",
    "/images/exterior/street-view.jpg"
  ],
  "story": "/images/exterior/entrance-close.jpg",
  "about": "/images/exterior/street-view.jpg",
  "cta": "/images/exterior/drone-canopy-1.jpg"
}'::jsonb where key = 'exterior_images';

update site_content set value = '[
  "/images/exterior/drone-coastline.jpg",
  "/images/exterior/entrance-close.jpg",
  "/images/rooms/balcony.jpg",
  "/images/restaurant/dining-chandelier.jpg",
  "/images/shop/moonlight-sign.jpg",
  "/images/services/boat-excursion.jpg"
]'::jsonb where key = 'gallery_images';

update site_content set value = '[
  { "title": "The Dining Room", "description": "A hand-painted sunset mural wraps the ceiling of the dining room, giving every table an island backdrop, rain or shine.", "image": "/images/restaurant/dining-room-wide.jpg" },
  { "title": "Sunset Mural Ceiling", "description": "Granite boulders, palm trees and a blazing Seychellois sunset — painted overhead, table to table.", "image": "/images/restaurant/dining-chandelier.jpg" },
  { "title": "The Bar", "description": "A granite-top bar stocked with Seychellois rum, Takamaka spirits and the makings of a proper tropical cocktail.", "image": "/images/restaurant/bar-counter.jpg" },
  { "title": "Behind the Bar", "description": "Local liqueurs and spirits lined up and ready — Tia Maria, Takamaka rum, Grand Marnier and more for the evening''s cocktail list.", "image": "/images/restaurant/bar-bottles.jpg" },
  { "title": "Cocktail Bar Nook", "description": "Tucked among the palms, our casual grill and juice bar serves fresh fruit juices, smoothies and cocktails through the day.", "image": "/images/restaurant/cocktail-bar-terrace.jpg" },
  { "title": "Welcome In", "description": "Rum barrels dressed with fresh coconuts and hibiscus mark the entrance — a small taste of what''s inside.", "image": "/images/restaurant/entrance-barrels-1.jpg" }
]'::jsonb where key = 'restaurant_photos';

update site_content
set value = jsonb_set(
  jsonb_set(value, '{0,image}', '"/images/services/boat-excursion.jpg"'),
  '{1,image}', '"/images/services/buggy-sibert.jpg"'
)
where key = 'services';

-- ============================================================
-- 7. WhatsApp enquiry number change + map links.
--    The client's WhatsApp enquiry number changed from
--    +248 423 4142 to +248 266 9035. This OVERWRITES the
--    whatsapp/whatsappNumber/whatsappHref fields on the site
--    row (the main phone number, phone/phoneHref, is untouched)
--    and merges in the mapsHref/mapsEmbedSrc fields used by the
--    footer/contact/shop "get directions" links.
-- ============================================================

update site_content
set value = value || '{
  "whatsapp": "+248 266 9035",
  "whatsappNumber": "2482669035",
  "whatsappHref": "https://wa.me/2482669035?text=Hi%20Sibert%20Residence%2C%20I%27d%20like%20to%20know%20more%20about%20a%20stay.",
  "mapsHref": "https://www.google.com/maps/search/?api=1&query=Sibert+Residence%2C+La+Passe%2C+La+Digue%2C+Seychelles",
  "mapsEmbedSrc": "https://maps.google.com/maps?q=Sibert%20Residence%2C%20La%20Passe%2C%20La%20Digue%2C%20Seychelles&t=&z=17&ie=UTF8&iwloc=&output=embed"
}'::jsonb
where key = 'site';

-- ============================================================
-- 8. Rate correction — official 2026/2027 rates, 2nd Edition
--    (Seyvillas). This corrects several values that were wrong
--    in earlier seed data even after block 7's percentage fix:
--      - High Season date ranges (no longer include Jul–Oct 2026,
--        which fall outside this edition's rate table)
--      - Half Board Supplement: was showing €30/€15, corrected
--        to €75/€40 (adult/child)
--      - Room occupancy wording (adds the "1 adult + child(ren)"
--        alternative for each room)
--      - Adds seasonRanges + minStay machine-readable fields to
--        'pricing' (needed for the minimum-stay booking logic —
--        these were missing from the DB seed entirely before)
--      - Adds Christmas Eve / New Year's Eve dinner supplements
--      - Check-in/check-out corrected to 12:00/10:00 in 'faq'
--        (in case block 5/7 hasn't been run — safe either way)
--    This OVERWRITES the 'rooms', 'pricing', and 'faq' rows
--    wholesale. Safe to run even if you've customized site/
--    services/shop/restaurant content — those are untouched.
--    Only skip this if you've manually edited rooms/pricing/faq
--    from the admin panel and want to keep those specific edits.
-- ============================================================

update site_content set value = '[
  {
    "slug": "superior",
    "name": "Superior Room",
    "tagline": "Bright, breezy, and effortlessly comfortable.",
    "description": "A sunlit retreat featuring a king size bed, coastal teal decor, and a private balcony with lush tropical views. Designed with cosy armchair seating and warm wooden finishes, it''s the ideal space for couples or solo travellers to unwind after a day on the island.",
    "bedding": "1 King Size Bed",
    "occupancy": "Max 2 Adults, or 1 Adult + 1 Child (6–11 yrs)",
    "highlights": ["Private balcony", "Plush seating area", "Airy tile flooring"],
    "image": "/images/rooms/superior.png",
    "priceFrom": 186
  },
  {
    "slug": "deluxe",
    "name": "Deluxe Room",
    "tagline": "Expansive comfort with extra room to relax.",
    "description": "Generously spaced to host couples or small families, the Deluxe Room features a main plush bed plus an extra single daybed. Comes fully appointed with a private ensuite bathroom, a full wooden wardrobe, and a dedicated vanity desk.",
    "bedding": "1 King Bed + 1 Single Bed",
    "occupancy": "Max 2 Adults + 1 Child (6–11 yrs), or 1 Adult + 2 Children (6–11 yrs)",
    "highlights": ["Extra spacious layout", "Private ensuite bathroom", "Generous storage space"],
    "image": "/images/rooms/deluxe.png",
    "priceFrom": 201
  }
]'::jsonb where key = 'rooms';

update site_content set value = '{
  "currency": "€",
  "validity": "1 November 2026 – 31 October 2027",
  "note": "Rates are per room, per night, inclusive of breakfast, taxes and service charge — based on 2 adults sharing.",
  "seasons": [
    { "name": "Low Season", "dates": "1–30 Sep 2026 · 1–20 Dec 2026 · 1 May – 30 Jun 2027" },
    { "name": "High Season", "dates": "1–30 Nov 2026 · 10 Jan – 20 Mar 2027 · 5–30 Apr 2027 · 1 Jul – 31 Aug 2027 · 1–31 Oct 2027" },
    { "name": "Peak Season", "dates": "21 Dec 2026 – 9 Jan 2027 · 21 Mar – 4 Apr 2027" }
  ],
  "seasonRanges": [
    { "season": "low", "start": "2026-09-01", "end": "2026-09-30" },
    { "season": "low", "start": "2026-12-01", "end": "2026-12-20" },
    { "season": "low", "start": "2027-05-01", "end": "2027-06-30" },
    { "season": "high", "start": "2026-11-01", "end": "2026-11-30" },
    { "season": "high", "start": "2027-01-10", "end": "2027-03-20" },
    { "season": "high", "start": "2027-04-05", "end": "2027-04-30" },
    { "season": "high", "start": "2027-07-01", "end": "2027-08-31" },
    { "season": "high", "start": "2027-10-01", "end": "2027-10-31" },
    { "season": "peak", "start": "2026-12-21", "end": "2027-01-09" },
    { "season": "peak", "start": "2027-03-21", "end": "2027-04-04" }
  ],
  "minStay": { "low": 2, "high": 2, "peak": 3 },
  "rates": [
    { "room": "Superior Room", "low": 186, "high": 205, "peak": 240 },
    { "room": "Deluxe Room", "low": 201, "high": 220, "peak": 255 }
  ],
  "extras": [
    "Half Board Supplement: €75 / night per adult (12+ yrs), €40 / night per child (6–11 yrs)",
    "Extra Bed Supplement: €50 / night (child 6–11 yrs only)",
    "Early Bird Offer: 10% off in High Season or 5% off in Low Season — book 60+ days ahead, B&B basis, minimum 3-night stay. Not combinable with other offers; not applicable to child-sharing bookings.",
    "Long Stay Offer: 15% off for stays of 7+ nights — High Season only, B&B basis. Not combinable with other offers; not applicable to child-sharing bookings.",
    "Christmas Eve Dinner Supplement (24 Dec, optional for B&B/HB guests): €90 per adult (12+ yrs), €45 per child (6–11 yrs)",
    "New Year''s Eve Dinner Supplement (31 Dec, compulsory): B&B €105 per adult / €55 per child · Half Board €30 per adult / €15 per child",
    "Honeymooners receive a bottle of sparkling wine and a fruit platter (valid 6 months from wedding date)"
  ],
  "occupancy": "Superior Room: max 2 adults, or 1 adult + 1 child (6–11 yrs). Deluxe Room: max 2 adults + 1 child (6–11 yrs), or 1 adult + 2 children (6–11 yrs). Base rate is for 2 adults.",
  "prepayment": [
    "Low & High Seasons: 50% deposit due 7 days prior to arrival — remaining 50% balance due on check-in.",
    "Peak Season: 100% deposit due 21 days prior to arrival."
  ],
  "cancellation": [
    "High & Low Seasons: free cancellation 8+ days before arrival · 0–7 days: 50% charge · no-show/early departure: 100% charge",
    "Peak Season: free cancellation 22+ days before arrival · 0–21 days: 100% charge · no-show/early departure: 100% charge"
  ]
}'::jsonb where key = 'pricing';

update site_content set value = '{
  "checkIn": "12:00hrs",
  "checkOut": "10:00hrs",
  "checkInOutNote": "Early check-in and late check-out are subject to availability. To guarantee early check-in before 12:00hrs or late check-out until 15:00hrs, an extra charge of 50% of one night''s accommodation applies.",
  "restaurantHours": [
    { "label": "Breakfast", "time": "07:00hrs – 10:00hrs" },
    { "label": "Lunch / Dinner", "time": "11:00hrs – 21:00hrs (last order)" }
  ],
  "items": [
    { "question": "What time is check-in and check-out?", "answer": "Check-in is from 12:00hrs and check-out is by 10:00hrs. Early check-in and late check-out are subject to availability — to guarantee early check-in before 12:00hrs or late check-out until 15:00hrs, an extra charge of 50% of one night''s accommodation applies." },
    { "question": "What are the restaurant''s opening hours?", "answer": "Breakfast: 07:00hrs – 10:00hrs. Lunch & Dinner: 11:00hrs – 21:00hrs (last order)." },
    { "question": "Is there a minimum stay?", "answer": "Yes — Min Stay: 2 Nights (High & Low Seasons). Min Stay: 3 Nights (Peak Season). The applicable minimum is shown automatically once you select your dates." },
    { "question": "How much deposit do I need to pay to book?", "answer": "For Low and High Season stays, a 50% deposit is due 7 days before arrival, with the remaining 50% balance paid on check-in. For Peak Season stays, a 100% deposit is due 21 days before arrival." },
    { "question": "What is your cancellation policy?", "answer": "In High and Low Seasons, cancellations are free 8 or more days before arrival; 0–7 days before arrival incurs a 50% charge, and no-shows or early departures are charged in full. In Peak Season, cancellations are free 22 or more days before arrival; inside that window, or for no-shows and early departures, the full amount is charged." },
    { "question": "Do you offer half board?", "answer": "Yes — a Half Board Supplement of €75 per night per adult (12+ yrs) and €40 per night per child (6–11 yrs) can be added to a B&B booking." },
    { "question": "Is there a discount for early bookings or long stays?", "answer": "Yes — book 60 or more days ahead on a B&B basis (minimum 3 nights) for 10% off in High Season or 5% off in Low Season. Stays of 7 or more nights in High Season get 15% off on a B&B basis. These offers aren''t combinable with each other and don''t apply to child-sharing bookings." }
  ]
}'::jsonb where key = 'faq';

-- ============================================================
-- 9. Add slogan fields (from the client's email signature) to
--    the 'site' row on an already-running database. This only
--    merges in the two new fields — it never overwrites
--    anything else you've saved on the site row.
-- ============================================================

update site_content
set value = value || '{
  "sloganEyebrow": "Welcome to Paradise",
  "slogan": "Your Serene Hideaway in La Digue"
}'::jsonb
where key = 'site' and not (value ? 'slogan');

-- ============================================================
-- 10. Add per-room "guestOptions" (drives the Guests dropdown
--     in the booking form so it only offers combinations that
--     actually fit that room's max occupancy). This assumes
--     rooms are still in the default order (index 0 = Superior,
--     index 1 = Deluxe) — if you've reordered or added rooms via
--     the admin panel, add "guestOptions" for the new/reordered
--     rooms directly from Admin → Rooms instead of running this.
-- ============================================================

update site_content
set value = jsonb_set(
  jsonb_set(
    value,
    '{0,guestOptions}',
    '["2 Adults", "1 Adult + 1 Child (6–11 yrs)"]'::jsonb
  ),
  '{1,guestOptions}',
  '["2 Adults + 1 Child (6–11 yrs)", "1 Adult + 2 Children (6–11 yrs)"]'::jsonb
)
where key = 'rooms' and not (value -> 0 ? 'guestOptions');

-- ============================================================
-- 11. Policy change (client-confirmed): High Season minimum
--     stay drops from 3 nights to 2, now grouped with Low
--     Season. Peak Season stays at 3 nights.
--     This only touches minStay.high on 'pricing' (safe — won't
--     affect rates, offers, or anything else you've edited) and
--     the minimum-stay FAQ answer specifically.
-- ============================================================

update site_content
set value = jsonb_set(value, '{minStay,high}', '2')
where key = 'pricing';

update site_content
set value = jsonb_set(
  value,
  '{items}',
  (
    select jsonb_agg(
      case
        when item ->> 'question' = 'Is there a minimum stay?'
        then jsonb_set(item, '{answer}', '"Yes — Min Stay: 2 Nights (High & Low Seasons). Min Stay: 3 Nights (Peak Season). The applicable minimum is shown automatically once you select your dates."')
        else item
      end
    )
    from jsonb_array_elements(value -> 'items') as item
  )
)
where key = 'faq';

-- ============================================================
-- 12. Logo fix: the logo was pointing at the old WordPress site
--     (sibert.sc/wp-content/uploads/...), which is why it wasn't
--     showing. The logo is now self-hosted in /public/images/logo
--     as a white cut-out (the header/footer/loader all have a dark
--     green background, so a white logo is what actually shows up).
--     Only touches 'site'.logoWhite / 'site'.logoMark.
-- ============================================================

update site_content
set value = jsonb_set(
  jsonb_set(value, '{logoWhite}', '"/images/logo/sibert-logo-white.png"'),
  '{logoMark}', '"/images/logo/sibert-logo-white.png"'
)
where key = 'site';
