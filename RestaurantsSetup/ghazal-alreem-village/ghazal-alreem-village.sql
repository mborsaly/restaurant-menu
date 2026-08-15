-- ============================================
-- GHAZAL ALREEM VILLAGE — BEDOUIN FOOD
-- BISTROVITE ONBOARDING
-- Source: Talabat menu export (CSV/XLSX)
-- ⚠️ English item NAMES were corrected —
--    source spreadsheet had "Mutton MABAKBAKA
--    PASTA" copy-pasted as the English name for
--    ALL 26 items. English DESCRIPTIONS were
--    correct and used to derive proper names.
--    Flag any corrected name with the owner
--    before going fully live.
-- ============================================

-- ============================================
-- STEP 1 — INSERT VENDOR
-- ============================================
INSERT INTO vendors (
  name, name_fr, name_ar,
  slug, vendor_type, brand,
  owner_phone, owner_email, twilio_number,
  address, open_time, close_time,
  min_order, delivery_fee, delivery_time,
  primary_color, secondary_color, logo_emoji, logo_url,
  country_code, currency_code, default_country_code,
  supported_languages, timezone,
  active, manually_closed,
  welcome_en, welcome_fr, welcome_ar,
  cuisine_type, cuisine_type_ar
) VALUES (
  'Ghazal Alreem Village',
  'Ghazal Alreem Village',
  'قرية غزال الريم',
  'ghazal-alreem-village',
  'restaurant',
  'bistrovite',
  '+2011446444466',            -- replace with owner phone
  'ghazal-alreem-village@gmail.com',
  '+2011446444466',
  'Tagammoa 5 - El Narges, Cairo, Egypt',
  '13:00',
  '01:00',                     -- confirm real hours with owner
  0.00,
  0.00,
  NULL,
  '#8B4513',
  '#F5E6D3',
  '🐫',
  'https://talabat.dhmedia.io/image/talabat/restaurants/logo__Hesham_Ismail638577895676262119.jpg?width=400',
  'EG', 'EGP', '+20',
  ARRAY['en','ar'],
  'Africa/Cairo',
  true,                        -- keep inactive until menu confirmed
  false, 
  'Welcome to Ghazal Alreem Village! Browse our menu and order in seconds 🐫',
  'Bienvenue à Ghazal Alreem Village! Parcourez notre menu et commandez en quelques secondes 🐫',
  'أهلاً بيك في قرية غزال الريم! تصفح المنيو واطلب في ثواني 🐫',
  'Bedouin & Arabic Grills, Mandi',
  'مشويات ومندي بدوي وعربي'
)
ON CONFLICT (slug) DO NOTHING;


-- ============================================
-- STEP 2 — CATEGORIES
-- ============================================
INSERT INTO categories (vendor_id, name_en, name_fr, name_ar, emoji, sort_order, active)
VALUES
  ((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'), 'Bedouin Corner', 'Coin Bédouin', 'الركن البدوي', '🍲', 1, true),
  ((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'), 'Al-Reem Trays', 'Plateaux Al-Reem', 'صواني الريم', '🍽️', 2, true),
  ((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'), 'Mandi Section', 'Section Mandi', 'قسم المندي', '🐑', 3, true);


-- ============================================
-- STEP 3 — MENU ITEMS
-- All prices in EGP, exactly as provided
-- ============================================

-- ── 🍲 BEDOUIN CORNER / الركن البدوي ──────
INSERT INTO menu_items (
  vendor_id, category_id, name_en, name_fr, name_ar,
  description_en, description_ar, base_price,
  available, sort_order, emoji, image_url
) VALUES

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Bedouin Corner'),
 'Mutton Mabakbaka Pasta', 'Pâtes Mabakbaka à l''Agneau', 'مكرونة مبكبكة ضاني',
 'Pasta cooked with tender pieces of mutton meat (lamb), mixed with spicy tomato sauce and various spices, cooked until the flavors blend perfectly.',
 'مكرونة تُطهى مع قطع لحم ضاني (الخروف) طرية، وتُخلط مع صلصة طماطم حارة وتوابل متنوعة، وتُطهى حتى تمتزج النكهات بشكل مثالي',
 400, true, 1, '🍝',
 'https://images.deliveryhero.io/image/talabat/MenuItems/%D9%85%D9%83%D8%B1%D9%88%D9%86%D9%87_%D9%85%D8%A8%D9%83%D8%A8%D9%83%D9%87_%D8%B6%D8%A7%D9%86%D9%89638578025544904424.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Bedouin Corner'),
 'Kandouz Mabakbaka Pasta', 'Pâtes Mabakbaka au Kandouz', 'مكرونة مبكبكة كندوز',
 'Pasta cooked with tender pieces of Kandouz meat (baby cow), mixed with spicy tomato sauce and various spices, cooked until the flavors blend perfectly.',
 'مكرونة تُطهى مع قطع لحم كندوز (البقر الصغير) طرية، وتُخلط مع صلصة طماطم حارة وتوابل متنوعة، وتُطهى حتى تمتزج النكهات بشكل مثالي',
 350, true, 2, '🍝',
 'https://images.deliveryhero.io/image/talabat/MenuItems/%D9%85%D9%83%D8%B1%D9%88%D9%86%D9%87_%D9%85%D8%A8%D9%83%D8%A8%D9%83%D9%87_%D9%83%D9%86%D8%AF%D9%88%D8%B2638578025565144093.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Bedouin Corner'),
 'Meat Madghout', 'Madghout à la Viande', 'مضغوط لحمه',
 'A traditional dish consisting of pieces of meat slow cooked with rice and spices, cooked under pressure until the meat is very tender and blends with the flavors of the rice.',
 'طبق تقليدي يتكون من قطع لحم مطهية ببطء مع أرز و بهارات، يُطهى تحت ضغط حتى يصبح اللحم طريًا جدًا ويمتزج مع نكهات الأرز.',
 400, true, 3, '🍚',
 'https://images.deliveryhero.io/image/global-menu-service/HF_EG/vendor/737112/product/426221003/369832b2-06a9-426e-8e32-60c98fb09d52.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Bedouin Corner'),
 'Chicken Madghout', 'Madghout au Poulet', 'مضغوط دجاج',
 'Similar to Madghout with meat, but prepared using chicken instead of meat, and cooked with rice and spices until the chicken is tender and the rice is full of flavours.',
 'مشابه للمضغوط باللحم، ولكنه يُحضر باستخدام دجاج بدلاً من اللحم، ويُطهى مع أرز وبهارات حتى يصبح الدجاج طريًا والأرز مليئًا بالنكهات',
 220, true, 4, '🍚',
 'https://images.deliveryhero.io/image/talabat/MenuItems/%D9%85%D8%B6%D8%BA%D9%88%D8%B7_%D8%AF%D8%AC%D8%A7%D8%AC638578024967845301.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Bedouin Corner'),
 'Meat Mathbi', 'Mathbi à la Viande', 'مظبي لحمه',
 'Meat cooked slowly over low heat with various spices and seasonings, sometimes grilled over stones or charcoal until it acquires a distinctive flavor and becomes tender and juicy.',
 'لحم يُطهى ببطء على نار هادئة مع توابل وبهارات متنوعة، ويُشوى أحيانًا على الحجارة أو الفحم حتى يكتسب نكهة مميزة ويصبح طريًا ومليئًا بالعصارة',
 400, true, 5, '🔥',
 'https://images.deliveryhero.io/image/talabat/MenuItems/%D9%85%D8%B8%D8%A8%D9%89_%D9%84%D8%AD%D9%85%D9%87638578025328025661.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Bedouin Corner'),
 'Chicken Mathbi', 'Mathbi au Poulet', 'مظبي دجاج',
 'Similar to Mathbi with meat, but prepared using chicken, slowly simmered or grilled until the chicken is tender and juicy.',
 'مشابه للمظبي باللحم، ولكنه يُحضر باستخدام دجاج، ويُطهى ببطء على نار هادئة أو يُشوى حتى يصبح الدجاج طريًا ومليئًا بالعصارة',
 220, true, 6, '🔥',
 'https://images.deliveryhero.io/image/talabat/MenuItems/%D9%85%D8%B8%D8%A8%D9%89_%D8%AF%D8%AC%D8%A7%D8%AC638578025223225356.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Bedouin Corner'),
 'Meat Zurbian', 'Zurbian à la Viande', 'زربيان لحمه',
 'A dish consisting of rice and meat, slowly cooked with yogurt, spices and saffron until the rice blends with the meat and the dish becomes rich in flavors and juiciness.',
 'طبق مكون من أرز و لحم، يُطهى ببطء مع زبادي، توابل و زعفران حتى يمتزج الأرز باللحم ويصبح طبق غنيًا بالنكهات والعصارة',
 400, true, 7, '🍛',
 'https://images.deliveryhero.io/image/global-menu-service/HF_EG/vendor/737112/product/426221011/74e94bb2-3ec2-44f7-97d2-d8d9408623da.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Bedouin Corner'),
 'Chicken Zurbian', 'Zurbian au Poulet', 'زربيان دجاج',
 'Similar to Zurbian with meat, but prepared using chicken, cooked with rice, yogurt, spices and saffron until the rice blends with the chicken and the dish becomes rich in flavors and juiciness.',
 'مشابه للزربيان باللحم، ولكنه يُحضر باستخدام دجاج، ويُطهى مع أرز، زبادي، توابل و زعفران حتى يمتزج الأرز بالدجاج ويصبح الطبق غنيًا بالنكهات والعصارة',
 220, true, 8, '🍛',
 'https://images.deliveryhero.io/image/talabat/MenuItems/%D8%B2%D8%B1%D8%A8%D9%8A%D8%A7%D9%86_%D8%AF%D8%AC%D8%A7%D8%AC638578023975738676.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Bedouin Corner'),
 'Mutton Fahsa', 'Fahsa à l''Agneau', 'فحسة ضاني',
 'Mutton meat pieces slowly cooked with spices and herbs until tender and juicy.',
 'قطع لحم ضاني تُطهى ببطء مع توابل و أعشاب حتى تصبح طرية ومليئة بالعصارة',
 400, true, 9, '🍖',
 'https://images.deliveryhero.io/image/global-menu-service/HF_EG/vendor/737112/product/426221015/899102e1-7655-4900-8f74-87cd59818a50_original.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Bedouin Corner'),
 'Kandouz Fahsa', 'Fahsa au Kandouz', 'فحسة كندوز',
 'Kandouz meat pieces are slowly cooked with spices and herbs until tender and juicy.',
 'قطع لحم كندوز تُطهى ببطء مع توابل وأعشاب حتى تصبح طرية ومليئة بالعصارة',
 400, true, 10, '🍖',
 'https://images.deliveryhero.io/image/global-menu-service/HF_EG/vendor/737112/product/426221017/5b3497d6-4d31-455f-9db0-cd80b962ab72_original.jpg'),


-- ── 🍽️ AL-REEM TRAYS / صواني الريم ─────────
((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Al-Reem Trays'),
 'Ghazal Alreem Tray', 'Plateau Ghazal Alreem', 'غزال الريم',
 '1/8 Teis mandi, kilo kofta, grilled chicken and basmati rice.',
 'ثمن تيس مندي، كيلو كفتة، فرخة مشوية و ارز بسمتي',
 2000, true, 1, '🍽️',
 'https://images.deliveryhero.io/image/global-menu-service/HF_EG/vendor/737112/product/426221019/c620e90d-5003-4714-8426-0265299d46d2.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Al-Reem Trays'),
 'Ghawy Mashawy Tray', 'Plateau Ghawy Mashawy', 'غاوي مشاوي',
 'Kilo kebab, kilo kofta, kilo shish, half kilo grilled liver, half kilo grilled sausage and basmati rice.',
 'كيلو كباب، كيلو كفتة، كيلو شيش، نصف كيلو كبدة مشوية، نصف كيلو سجق مشوي و ارز بسمتي',
 3500, true, 2, '🍢',
 'https://images.deliveryhero.io/image/talabat/MenuItems/%D8%BA%D8%A7%D9%88%D9%8A_%D9%85%D8%B4%D8%A7%D9%88%D9%8A638578024748946465.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Al-Reem Trays'),
 'Al Sohab Tray', 'Plateau Al Sohab', 'الصحاب',
 '1/4 Teis mandi, kilo kofta, kilo shish, half kilo grilled liver, grilled chicken and basmati rice.',
 'ربع تيس مندي، كيلو كفتة، كيلو شيش، نصف كيلو كبدة مشوية، فرخة مشوية و ارز بسمتي',
 4000, true, 3, '🍽️',
 'https://images.deliveryhero.io/image/global-menu-service/HF_EG/vendor/737112/product/426221021/b62f33d1-c5f5-49fc-927a-58651d5cdfd3_original.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Al-Reem Trays'),
 'Big Family Tray', 'Plateau Grande Famille', 'العيلة الكبيرة',
 'Kilo and half kebab, kilo kofta, kilo shish, grilled chicken, 4 single pigeons and basmati rice.',
 'كيلو ونص كباب، كيلو كفتة، كيلو شيش، فرخة مشوية، 4 فرد حمام و ارز بسمتي',
 4500, true, 4, '👨‍👩‍👧‍👦',
 'https://images.deliveryhero.io/image/global-menu-service/HF_EG/vendor/737112/product/426221022/f177821d-df7a-4c4c-9c32-bd8fe3fcfec8_original.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Al-Reem Trays'),
 'Al Tawfeer Tray', 'Plateau Al Tawfeer', 'التوفير',
 '1/8 Teis mandi, kilo kofta, half kilo grilled liver, half kilo grilled sausage, half kilo tarb, grilled chicken, mandi chicken, and 4 single pigeons.',
 'ثمن تيس مندي، كيلو كفتة، نصف كيلو كبدة مشوية، نصف كيلو سجق مشوي، نصف كيلو طرب، فرخة مشوية، فرخة مندي و 4 فرد حمام',
 5000, true, 5, '💰',
 'https://images.deliveryhero.io/image/global-menu-service/HF_EG/vendor/737112/product/426221023/297ec9f3-2578-4f41-8cb1-4c8aadb7b6b9.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Al-Reem Trays'),
 'Al Akela Tray', 'Plateau Al Akela', 'الاكيلة',
 'Half Teis mandi, kilo kofta, half kilo grilled liver, half kilo shish tawook, 2 grilled chicken and basmati rice.',
 'نصف تيس مندي، كيلو كفتة، نصف كيلو كبدة مشوية، نصف كيلو شيش طاووق، 2 فرخة مشوية و ارز بسمتي',
 5850, true, 6, '🍽️',
 'https://images.deliveryhero.io/image/talabat/MenuItems/%D8%A7%D9%84%D8%A7%D9%83%D9%8A%D9%84%D8%A9638578021992805292.jpg'),


-- ── 🐑 MANDI SECTION / قسم المندي ──────────
((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Mandi Section'),
 'Nafar Super Meat Mandi', 'Mandi Viande Super Nafar', 'نفر لحم مندي سوبر',
 'Slow-cooked pieces of meat in an underground pit with seasonings and spices, served with rice. Super means it comes in a large portion.',
 'قطع لحم مطهية ببطء في حفرة تحت الأرض مع توابل و بهارات، تُقدم مع أرز. سوبر يعني أنه يأتي بحصة كبيرة',
 460, true, 1, '🐑',
 'https://images.deliveryhero.io/image/global-menu-service/HF_EG/vendor/737112/product/426221004/49088f0d-34f3-4e63-bf84-bcff04d6fc82_original.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Mandi Section'),
 'Nafar Meat Mandi', 'Mandi Viande Nafar', 'نفر لحم مندي',
 'Similar to the Nafar Super Meat Mandi, but in a regular portion.',
 'مشابه لنفر لحم مندي سوبر، ولكنه بحصة عادية',
 400, true, 2, '🐑',
 'https://images.deliveryhero.io/image/talabat/MenuItems/Nafar_meat_mandi638578041103163287.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Mandi Section'),
 'Teis Mandi (Whole Lamb)', 'Mandi Teis (Agneau Entier)', 'تيس مندي',
 'Whole lamb slowly cooked in an underground pit with seasonings and spices, served with rice.',
 'خروف كامل يُطهى ببطء في حفرة تحت الأرض مع توابل و بهارات، يُقدم مع أرز',
 7350, true, 3, '🐑',
 'https://images.deliveryhero.io/image/talabat/MenuItems/Teis_mandiQ638578040777533990.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Mandi Section'),
 'Half Teis Mandi', 'Demi Mandi Teis', 'نصف تيس مندي',
 'Half lamb slowly cooked in an underground pit with seasonings and spices, served with rice.',
 'نصف خروف يُطهى ببطء في حفرة تحت الأرض مع توابل و بهارات، يُقدم مع أرز',
 3700, true, 4, '🐑',
 'https://images.deliveryhero.io/image/global-menu-service/HF_EG/vendor/737112/product/426221010/59ee4040-f374-4fc5-99fe-b574121c3a0e_original.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Mandi Section'),
 'Quarter Teis Mandi', 'Quart Mandi Teis', 'ربع تيس مندي',
 'Quarter lamb slowly cooked in an underground pit with seasonings and spices, served with rice.',
 'ربع خروف يُطهى ببطء في حفرة تحت الأرض مع توابل و بهارات، يُقدم مع أرز',
 1850, true, 5, '🐑',
 'https://images.deliveryhero.io/image/talabat/MenuItems/%D8%B1%D8%A8%D8%B9_%D8%AA%D9%8A%D8%B3_%D9%85%D9%86%D8%AF%D9%89638578023798263200.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Mandi Section'),
 '1/8 Teis Mandi', '1/8 Mandi Teis', 'ثمن تيس مندي',
 'Small portion of lamb slowly cooked in an underground pit with seasonings and spices, served with rice.',
 'جزء صغير من الخروف يُطهى ببطء في حفرة تحت الأرض مع توابل و بهارات، يُقدم مع أرز.',
 920, true, 6, '🐑',
 'https://images.deliveryhero.io/image/global-menu-service/HF_EG/vendor/737112/product/426221014/5fae3d1e-f6d2-4f4b-ba4a-66aa4cbc4170_original.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Mandi Section'),
 'Mandi Chicken', 'Poulet Mandi', 'فرخة مندي',
 'Whole chicken slowly cooked in an underground pit with seasonings and spices, served with rice.',
 'دجاجة كاملة تُطهى ببطء في حفرة تحت الأرض مع توابل و بهارات، تُقدم مع أرز',
 330, true, 7, '🍗',
 'https://images.deliveryhero.io/image/talabat/MenuItems/Mandi_chicken638578041462239711.jpg'),

((SELECT id FROM vendors WHERE slug='ghazal-alreem-village'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='ghazal-alreem-village') AND name_en='Mandi Section'),
 'Half Mandi Chicken', 'Demi Poulet Mandi', 'نصف فرخة مندي',
 'Half chicken slowly cooked in an underground pit with seasonings and spices, served with rice.',
 'نصف دجاجة تُطهى ببطء في حفرة تحت الأرض مع توابل و بهارات، تُقدم مع أرز',
 210, true, 8, '🍗',
 'https://images.deliveryhero.io/image/talabat/MenuItems/%D9%86%D8%B5_%D9%81%D8%B1%D8%AE%D9%87_%D9%85%D9%86%D8%AF%D9%89638578025977135096.jpg');


-- ============================================
-- STEP 4 — VERIFY
-- ============================================
SELECT
  v.name, v.slug, v.currency_code,
  COUNT(DISTINCT c.id) AS categories,
  COUNT(DISTINCT m.id) AS menu_items
FROM vendors v
LEFT JOIN categories c ON c.vendor_id = v.id
LEFT JOIN menu_items m ON m.vendor_id = v.id
WHERE v.slug = 'ghazal-alreem-village'
GROUP BY v.id, v.name, v.slug, v.currency_code;