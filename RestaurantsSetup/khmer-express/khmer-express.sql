-- ============================================
-- KHMER EXPRESS
-- BISTROVITE ONBOARDING
-- Laval, QC — Cambodian / Asian, Halal
-- Trilingual: EN / FR (source data), AR added
-- ⚠️ Item DESCRIPTIONS came in mixed EN/FR from
--    source — normalized below, both languages
--    populated per item
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
  supports_delivery, supports_pickup, supports_dine_in,
  active, manually_closed,
  welcome_en, welcome_fr, welcome_ar,
  cuisine_type, cuisine_type_ar
) VALUES (
  'Khmer Express',
  'Khmer Express',
  'خمير إكسبرس',
  'khmer-express',
  'restaurant',
  'bistrovite',
  '+14509378900',              -- replace with owner phone
  'abc@efg.com',
  '+14509378900',                         -- add after WhatsApp/Twilio setup
  '145 Bd Sainte-Rose, Laval, QC H7L 3J7, Canada',
  '11:00',
  '19:40',
  0.00,
  3.99,                         -- confirm real delivery fee with owner
  '30-40 min',
  '#B5432E',                    -- warm terracotta/spice tone, placeholder
  '#F5E6D3',
  '🍜',
  'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/khmer-express/dfe73df3a8123af1971eabf3eeff9ac1.jpeg',
  'CA', 'CAD', '+1',
  ARRAY['en','fr','ar'],
  'America/Toronto',
  true, true, false,
  false,                        -- keep inactive until confirmed live
  'Welcome to Khmer Express! Browse our menu and order in seconds',
  'Bienvenue chez Khmer Express! Parcourez notre menu et commandez en quelques secondes',
  'أهلاً بيك في خمير إكسبرس! تصفح المنيو واطلب في ثواني',
  'Cambodian, Asian, Halal',
  'كمبودي وآسيوي حلال'
)
ON CONFLICT (slug) DO NOTHING;


-- ============================================
-- STEP 2 — CATEGORIES
-- ============================================
INSERT INTO categories (vendor_id, name_en, name_fr, name_ar, emoji, sort_order, active)
VALUES
  ((SELECT id FROM vendors WHERE slug='khmer-express'), 'Combos', 'Les Combos', 'الكومبو', '🍱', 1, true),
  ((SELECT id FROM vendors WHERE slug='khmer-express'), 'Khmer Express Specialties', 'Les Spécialités Khmer Express', 'أطباق خمير إكسبرس المميزة', '🥢', 2, true),
  ((SELECT id FROM vendors WHERE slug='khmer-express'), 'Asian Classics', 'Les Classiques Asiatiques', 'الأطباق الآسيوية الكلاسيكية', '🍚', 3, true),
  ((SELECT id FROM vendors WHERE slug='khmer-express'), 'Starters', 'Les Entrées', 'المقبلات', '🥟', 4, true);


-- ============================================
-- STEP 3 — MENU ITEMS
-- Prices in CAD, exactly as provided
-- ============================================

-- ── 🍱 COMBOS / LES COMBOS ─────────────────
INSERT INTO menu_items (
  vendor_id, category_id, name_en, name_fr, name_ar,
  description_en, description_fr, description_ar,
  base_price, available, sort_order, emoji, image_url
) VALUES

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Combos'),
 'Diet Pepsi and Wonton Soup Combo', 'Combo Pepsi Diet et Soupe Won Ton', 'كومبو بيبسي دايت وشوربة ونتون',
 'Enjoy a wonton soup paired with a Diet Pepsi for a comforting experience.',
 'Savourez une soupe won ton accompagnée d''un Pepsi Diet pour une expérience réconfortante.',
 'استمتع بشوربة ونتون مع بيبسي دايت لتجربة مريحة.',
 7.50, true, 1, '🍱',
 NULL),


-- ── 🥢 KHMER EXPRESS SPECIALTIES / LES SPÉCIALITÉS KHMER EXPRESS ──
((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Khmer Express Specialties'),
 '7. Mi Katang', '7. Mi Katang', '٧. مي كاتانج',
 'Wide rice noodles with oyster sauce.',
 'Nouilles de riz larges avec sauce aux huîtres.',
 'نودلز أرز عريضة بصلصة المحار.',
 18.99, true, 1, '🍜',
 NULL),

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Khmer Express Specialties'),
 '8. Ke Tirv Phnom Penh', '8. Ke Tirv Phnom Penh', '٨. كي تيرف بنوم بنه',
 'Dry noodle option available.',
 'Option nouilles seches disponible.',
 'يتوفر خيار النودلز الجافة.',
 19.99, true, 2, '🍲',
 NULL),

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Khmer Express Specialties'),
 '9. Crispy Fried Chicken Wings', '9. Ailes De Poulet Frits', '٩. أجنحة دجاج مقلية مقرمشة',
 'Crispy fried chicken wings.',
 'Ailes de poulet frites croustillantes.',
 'أجنحة دجاج مقلية ومقرمشة.',
 14.99, true, 3, '🍗',
 NULL),

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Khmer Express Specialties'),
 '10. Cha Loc Lac', '10. Cha Loc Lac', '١٠. تشا لوك لاك',
 'Sauteed beef cube served with a side of rice with tomato paste.',
 'Sauté de cubes de bœuf servi avec du riz à la pâte de tomate.',
 'مكعبات لحم بقري مقلية تقدم مع أرز بمعجون الطماطم.',
 23.99, true, 4, '🥩',
 NULL),

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Khmer Express Specialties'),
 '12. Ke Tirv Khor Ko', '12. Ke Tirv Khor Ko', '١٢. كي تيرف خور كو',
 'Traditional Khmer-style soup with rice noodles, beef and carrots.',
 'Soupe traditionnelle khmère avec nouilles de riz, bœuf et carottes.',
 'شوربة كمبودية تقليدية بنودلز الأرز واللحم البقري والجزر.',
 23.99, true, 5, '🍲',
 NULL),

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Khmer Express Specialties'),
 '13. Beef Skewer Plate (3 pieces)', '13. Assiette 3 brochettes de boeuf', '١٣. طبق ٣ أسياخ لحم بقري',
 'Tender beef skewers, served in a set of three.',
 'Brochettes de bœuf tendre, servies en ensemble de trois.',
 'أسياخ لحم بقري طرية، تقدم بمجموعة من ثلاثة.',
 24.99, true, 6, '🍢',
 NULL),

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Khmer Express Specialties'),
 '14. Tender Beef Wok with Crunchy Broccoli', '14. Boeuf tendre au wok et broccolis croquants', '١٤. لحم بقري طري بالووك مع بروكلي مقرمش',
 'Sauteed beef with broccoli, served with rice.',
 'Sauté de bœuf avec broccolis servis avec du riz.',
 'لحم بقري مقلي مع البروكلي، يقدم مع الأرز.',
 23.00, true, 7, '🥦',
 NULL),


-- ── 🍚 ASIAN CLASSICS / LES CLASSIQUES ASIATIQUES ──
((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Asian Classics'),
 '1. Fried Rice', '1. Riz Frit', '١. أرز مقلي',
 'Savory Asian rice dish with a delightful mix of authentic flavors.',
 'Plat de riz asiatique savoureux avec un mélange de saveurs authentiques.',
 'طبق أرز آسيوي شهي بمزيج رائع من النكهات الأصيلة.',
 18.00, true, 1, '🍚',
 NULL),

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Asian Classics'),
 '2. Chef''s General Tao', '2. Général Tao du Chef', '٢. جنرال تاو الشيف',
 'Large crispy pieces of chicken (about 9-10), coated in a homemade sweet-spicy Tao sauce with onions and peppers. Generous portion, served with steamed white rice on the side.',
 'Gros morceaux croustillants de poulet (~9 ou ~10), enrobés d''une sauce Tao maison sucrée-épicée avec oignons et poivrons. Portion généreuse, servie avec riz blanc vapeur à côté.',
 'قطع دجاج مقرمشة كبيرة (٩-١٠ تقريبًا)، مغطاة بصلصة تاو منزلية حلوة حارة مع البصل والفلفل. حصة سخية، تقدم مع أرز أبيض مطهو بالبخار.',
 23.00, true, 2, '🍗',
 NULL),

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Asian Classics'),
 '3. Pad Thai', '3. Pad Thai', '٣. باد تاي',
 'Stir-fried rice noodles with shallots, chop suey and your choice of protein.',
 'Nouilles de riz sautées avec échalotes, chop suey et votre choix de protéine.',
 'نودلز أرز مقلية مع الكراث والخضار وبروتين حسب اختيارك.',
 18.99, true, 3, '🍜',
 NULL),

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Asian Classics'),
 '4. Crispy Bird''s Nest', '4. Nid D''oiseaux Croustillant', '٤. عش الطائر المقرمش',
 'Crispy bird''s nest filled with a choice of shrimp, chicken, or beef and vegetables.',
 'Nid d''oiseaux croustillant garni de crevettes, poulet ou bœuf au choix et de légumes.',
 'عش طائر مقرمش محشو باختيارك من الجمبري أو الدجاج أو اللحم البقري مع الخضار.',
 17.99, true, 4, '🥘',
 NULL),

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Asian Classics'),
 '5. Pad See Ew', '5. Pad See Ew', '٥. باد سي إيو',
 'Wide rice noodles, egg, broccoli, and Chinese broccoli with a soy sauce base.',
 'Nouilles de riz larges, oeuf, broccolis, broccolis chinois avec sauce à base de sauce soya.',
 'نودلز أرز عريضة، بيض، بروكلي، وبروكلي صيني بصلصة الصويا.',
 18.99, true, 5, '🍜',
 NULL),

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Asian Classics'),
 '6. Mi Cha', '6. Mi Cha', '٦. مي تشا',
 'Cambodian-style rice noodle dish.',
 'Plat de nouilles de riz à la cambodgienne.',
 'طبق نودلز أرز على الطريقة الكمبودية.',
 16.99, true, 6, '🍜',
 NULL),

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Asian Classics'),
 'Vegetable Fried Rice', 'Riz frit aux légumes', 'أرز مقلي بالخضار',
 'Fried rice with onions, carrots and green peas.',
 'Riz frits avec oignons, carottes et pois verts.',
 'أرز مقلي بالبصل والجزر والبازلاء الخضراء.',
 16.99, true, 7, '🍚',
 NULL),

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Asian Classics'),
 'Family-Size General Tao', 'General Tao Familial', 'جنرال تاو حجم عائلي',
 'General Tao for 5 people, served with rice.',
 'General tao pour 5 personnes accompagné de riz.',
 'جنرال تاو لخمسة أشخاص، يقدم مع الأرز.',
 69.00, true, 8, '🍗',
 NULL),

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Asian Classics'),
 '3. Vegetable Pad Thai', '3. Pad Thai aux légumes', '٣. باد تاي بالخضار',
 'Stir-fried rice noodles with shallots and chop suey.',
 'Nouilles de riz sautées avec échalotes et chop suey.',
 'نودلز أرز مقلية مع الكراث والخضار.',
 17.99, true, 9, '🍜',
 NULL),

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Asian Classics'),
 '5. Vegetable Pad See Ew', '5. Pad See Ew aux légumes', '٥. باد سي إيو بالخضار',
 'Wide rice noodles, egg, broccoli, and Chinese broccoli with a soy sauce base.',
 'Nouilles de riz larges, oeuf, broccolis, broccolis chinois avec sauce à base de sauce soya.',
 'نودلز أرز عريضة، بيض، بروكلي، وبروكلي صيني بصلصة الصويا.',
 18.99, true, 10, '🍜',
 NULL),


-- ── 🥟 STARTERS / LES ENTRÉES ────────────────
((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Starters'),
 'Wonton Soup (Small)', 'Soupe Won Ton (petite)', 'شوربة ونتون (صغيرة)',
 'Delicate stuffed chicken wontons served in a savory broth. 5 wontons, 12 oz.',
 'Délicats won ton farcis au poulet servis dans un bouillon savoureux. 5 won ton, 12 onces.',
 'ونتون محشو بالدجاج يقدم في مرق شهي. ٥ قطع ونتون، ١٢ أونصة.',
 6.25, true, 1, '🍲',
 NULL),

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Starters'),
 'Wonton Soup (Large)', 'Soupe Won Ton (grande)', 'شوربة ونتون (كبيرة)',
 'Delicate wontons served in a savory broth. 9 wontons, 16 oz.',
 'Délicats won ton servis dans un bouillon savoureux. 9 won ton, 16 onces.',
 'ونتون يقدم في مرق شهي. ٩ قطع ونتون، ١٦ أونصة.',
 9.25, true, 2, '🍲',
 NULL),

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Starters'),
 'Homemade Crispy Chicken & Taro Spring Roll', 'Rouleau impérial maison au poulet taro - croustillant', 'لفافة ربيعية منزلية بالدجاج والقلقاس - مقرمشة',
 'Homemade crispy spring roll filled with chicken and taro.',
 'Rouleau impérial maison croustillant farci au poulet et au taro.',
 'لفافة ربيعية منزلية مقرمشة محشوة بالدجاج والقلقاس.',
 4.50, true, 3, '🥟',
 NULL),

((SELECT id FROM vendors WHERE slug='khmer-express'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='khmer-express') AND name_en='Starters'),
 'Homemade Crispy Vegetable Spring Roll', 'Rouleau impérial maison aux légumes - croustillant', 'لفافة ربيعية منزلية بالخضار - مقرمشة',
 'Homemade crispy spring roll filled with vegetables.',
 'Rouleau impérial maison croustillant farci aux légumes.',
 'لفافة ربيعية منزلية مقرمشة محشوة بالخضار.',
 4.00, true, 4, '🥬',
 NULL);


-- ============================================
-- STEP 4 — VERIFY
-- ============================================
SELECT
  v.name, v.slug, v.currency_code, v.supported_languages,
  COUNT(DISTINCT c.id) AS categories,
  COUNT(DISTINCT m.id) AS menu_items,
  COUNT(DISTINCT m.id) FILTER (WHERE m.image_url IS NULL) AS items_without_image
FROM vendors v
LEFT JOIN categories c ON c.vendor_id = v.id
LEFT JOIN menu_items m ON m.vendor_id = v.id
WHERE v.slug = 'khmer-express'
GROUP BY v.id, v.name, v.slug, v.currency_code, v.supported_languages;