-- ============================================
-- LE MÉCHANT CUISINIER
-- BISTROVITE ONBOARDING
-- Montreal, QC — Egyptian/Middle Eastern
-- Trilingual: EN / FR / AR
-- Source: owner-provided menu with hosted images
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
  'Le Méchant Cuisinier',
  'Le Méchant Cuisinier',
  'Le Méchant Cuisinier',
  'le-mechant-cuisinier',
  'restaurant',
  'bistrovite',
  '+15142268188',              -- replace with owner phone
  'le-mechant-cuisinier@gmail.com',
  '+15142268188',                         -- add after Twilio/WhatsApp setup
  '4913 Saint-Charles Blvd, Pierrefonds, QC H9H 3E4, Montreal, QC',
  '13:00',
  '19:00',
  0.00,
  3.99,                         -- confirm real delivery fee with owner
  '30-40 min',
  '#8B1A1A',                    -- deep Egyptian red, placeholder brand color
  '#F5E6D3',
  '🍗',
  NULL,                         -- add logo separately if available
  'CA', 'CAD', '+1',
  ARRAY['en','fr','ar'],
  'America/Toronto',
  true, true, false,            -- delivery + pickup, no dine-in (yet)
  true,                        -- keep inactive until confirmed live
  false,
  'Welcome to Le Méchant Cuisinier! Browse our menu and order in seconds 🍗',
  'Bienvenue chez Le Méchant Cuisinier! Parcourez notre menu et commandez en quelques secondes 🍗',
  'أهلاً بيك في Le Méchant Cuisinier! تصفح المنيو واطلب في ثواني 🍗',
  'Egyptian & Middle Eastern',
  'مصري وشرق أوسطي'
)
ON CONFLICT (slug) DO NOTHING;


-- ============================================
-- STEP 2 — CATEGORIES
-- ============================================
INSERT INTO categories (vendor_id, name_en, name_fr, name_ar, emoji, sort_order, active)
VALUES
  ((SELECT id FROM vendors WHERE slug='le-mechant-cuisinier'), 'Main Dishes', 'Plats Principaux', 'الأطباق الرئيسية', '🍽️', 1, true),
  ((SELECT id FROM vendors WHERE slug='le-mechant-cuisinier'), 'Drinks', 'Boissons', 'المشروبات', '🥤', 2, true);


-- ============================================
-- STEP 3 — MENU ITEMS
-- Prices in CAD, exactly as provided
-- ============================================

-- ── 🍽️ MAIN DISHES / الأطباق الرئيسية ──────
INSERT INTO menu_items (
  vendor_id, category_id, name_en, name_fr, name_ar,
  description_en, description_fr, description_ar,
  base_price, available, sort_order, emoji, image_url
) VALUES

((SELECT id FROM vendors WHERE slug='le-mechant-cuisinier'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='le-mechant-cuisinier') AND name_en='Main Dishes'),
 'Hawawshy', 'Hawawshi', 'حواوشي',
 'Seasoned meat stuffed inside Egyptian bread, served with pickles.',
 'Viande assaisonnée farcie dans un pain égyptien, servie avec des cornichons.',
 'لحم متبل ومحشو داخل خبز مصري، يقدم مع المخلل.',
 9.99, true, 1, '🥙',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/le-mechant-cuisinier/4218ca1d09174218364162cd0b1a8cc1(3).jpeg'),

((SELECT id FROM vendors WHERE slug='le-mechant-cuisinier'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='le-mechant-cuisinier') AND name_en='Main Dishes'),
 'Koshary Double', 'Koshari Double', 'كشري دبل',
 'Rice, macaroni, chickpeas, onion and tomato sauce, with spicy sauce on the side.',
 'Riz, macaroni, pois chiches, oignons et sauce tomate, avec sauce piquante à part.',
 'أرز ومكرونة وحمص وبصل وصلصة طماطم، مع صلصة حارة على الجانب.',
 14.99, true, 2, '🍚',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/le-mechant-cuisinier/4218ca1d09174218364162cd0b1a8cc1.jpeg'),

((SELECT id FROM vendors WHERE slug='le-mechant-cuisinier'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='le-mechant-cuisinier') AND name_en='Main Dishes'),
 'Koshary Single', 'Koshari Simple', 'كشري سنجل',
 'Rice, macaroni, chickpeas, onion and tomato sauce, with spicy sauce on the side.',
 'Riz, macaroni, pois chiches, oignons et sauce tomate, avec sauce piquante à part.',
 'أرز ومكرونة وحمص وبصل وصلصة طماطم، مع صلصة حارة على الجانب.',
 9.99, true, 3, '🍚',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/le-mechant-cuisinier/4218ca1d09174218364162cd0b1a8cc1(2).jpeg'),

((SELECT id FROM vendors WHERE slug='le-mechant-cuisinier'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='le-mechant-cuisinier') AND name_en='Main Dishes'),
 'Shawerma Double', 'Shawarma Double', 'شاورما دبل',
 'Chicken shawarma served with rice.',
 'Shawarma de poulet servie avec du riz.',
 'شاورما دجاج تقدم مع الأرز.',
 15.99, true, 4, '🌯',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/le-mechant-cuisinier/4218ca1d09174218364162cd0b1a8cc1(5).jpeg'),

((SELECT id FROM vendors WHERE slug='le-mechant-cuisinier'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='le-mechant-cuisinier') AND name_en='Main Dishes'),
 'Shawerma Single', 'Shawarma Simple', 'شاورما سنجل',
 'Chicken shawarma served with rice.',
 'Shawarma de poulet servie avec du riz.',
 'شاورما دجاج تقدم مع الأرز.',
 10.99, true, 5, '🌯',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/le-mechant-cuisinier/4218ca1d09174218364162cd0b1a8cc1(4).jpeg'),

((SELECT id FROM vendors WHERE slug='le-mechant-cuisinier'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='le-mechant-cuisinier') AND name_en='Main Dishes'),
 'Foul Medames with Tahini', 'Foul Medames avec Tahini', 'فول مدمس بالطحينة',
 'Fava beans with tahini and chickpeas, served with pita bread and pickles.',
 'Fèves mijotées avec tahini et pois chiches, servies avec pain pita et cornichons.',
 'فول مع الطحينة والحمص، يقدم مع خبز بيتا والمخلل.',
 6.99, true, 6, '🫘',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/le-mechant-cuisinier/4218ca1d09174218364162cd0b1a8cc1(1).jpeg'),

((SELECT id FROM vendors WHERE slug='le-mechant-cuisinier'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='le-mechant-cuisinier') AND name_en='Main Dishes'),
 'Egyptian Style Roasted Chicken - Half', 'Poulet Rôti à l''Égyptienne - Demi-Poulet', 'فراخ مشوية على الطريقة المصرية - نصف فرخة',
 'Half chicken roasted Egyptian style.',
 'Demi-poulet rôti à la manière égyptienne.',
 'نصف دجاجة مشوية على الطريقة المصرية.',
 24.99, true, 7, '🍗',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/le-mechant-cuisinier/a1681d67ebe55c76c3af5f401619c278.jpeg'),

((SELECT id FROM vendors WHERE slug='le-mechant-cuisinier'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='le-mechant-cuisinier') AND name_en='Main Dishes'),
 'Beef Pie', 'Pâté à la Viande de Bœuf', 'فطيرة باللحمة',
 'Savory pie filled with beef.',
 'Pâté salé farci au bœuf.',
 'فطيرة محشوة باللحم.',
 19.99, true, 8, '🥧',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/le-mechant-cuisinier/a1681d67ebe55c76c3af5f401619c278(1).jpeg'),

((SELECT id FROM vendors WHERE slug='le-mechant-cuisinier'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='le-mechant-cuisinier') AND name_en='Main Dishes'),
 'Molokhia', 'Molokhia', 'ملوخية',
 'Traditional Egyptian-style cooked molokhia.',
 'Molokhia cuisinée à la manière traditionnelle égyptienne.',
 'ملوخية مصرية مطبوخة بالطريقة التقليدية.',
 6.99, true, 9, '🍲',
 NULL),  -- ⚠️ no image provided in source


-- ── 🥤 DRINKS / المشروبات ─────────────────
((SELECT id FROM vendors WHERE slug='le-mechant-cuisinier'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='le-mechant-cuisinier') AND name_en='Drinks'),
 'Oasis Apple Juice 300 ml', 'Jus de Pomme Oasis 300 ml', 'عصير أويسيس تفاح ٣٠٠ مل',
 'Oasis apple juice, 300 ml.',
 'Jus de pomme Oasis, 300 ml.',
 'عصير تفاح أويسيس بحجم ٣٠٠ مل.',
 2.49, true, 1, '🧃',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/le-mechant-cuisinier/f0d1762b91fd823a1aa9bd0dab5c648d.jpeg'),

((SELECT id FROM vendors WHERE slug='le-mechant-cuisinier'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='le-mechant-cuisinier') AND name_en='Drinks'),
 'Oasis Orange Juice 300 ml', 'Jus d''Orange Oasis 300 ml', 'عصير أويسيس برتقال ٣٠٠ مل',
 'Oasis orange juice, 300 ml.',
 'Jus d''orange Oasis, 300 ml.',
 'عصير برتقال أويسيس بحجم ٣٠٠ مل.',
 2.49, true, 2, '🧃',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/le-mechant-cuisinier/f0d1762b91fd823a1aa9bd0dab5c648d(2).jpeg'),

((SELECT id FROM vendors WHERE slug='le-mechant-cuisinier'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='le-mechant-cuisinier') AND name_en='Drinks'),
 'Pepsi 330 ml', 'Pepsi 330 ml', 'بيبسي ٣٣٠ مل',
 'Pepsi soft drink, 330 ml.',
 'Boisson gazeuse Pepsi, 330 ml.',
 'بيبسي بحجم ٣٣٠ مل.',
 2.49, true, 3, '🥤',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/le-mechant-cuisinier/f0d1762b91fd823a1aa9bd0dab5c648d(3).jpeg'),

((SELECT id FROM vendors WHERE slug='le-mechant-cuisinier'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='le-mechant-cuisinier') AND name_en='Drinks'),
 'Coca-Cola 330 ml', 'Coca-Cola 330 ml', 'كوكا كولا ٣٣٠ مل',
 'Coca-Cola soft drink, 330 ml.',
 'Boisson gazeuse Coca-Cola, 330 ml.',
 'كوكا كولا بحجم ٣٣٠ مل.',
 2.49, true, 4, '🥤',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/le-mechant-cuisinier/f0d1762b91fd823a1aa9bd0dab5c648d(4).jpeg'),

((SELECT id FROM vendors WHERE slug='le-mechant-cuisinier'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='le-mechant-cuisinier') AND name_en='Drinks'),
 'Water 500 ml', 'Eau 500 ml', 'مياه ٥٠٠ مل',
 'Bottled water, 500 ml.',
 'Eau embouteillée, 500 ml.',
 'مياه معدنية بحجم ٥٠٠ مل.',
 1.79, true, 5, '💧',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/le-mechant-cuisinier/f0d1762b91fd823a1aa9bd0dab5c648d(1).jpeg');


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
WHERE v.slug = 'le-mechant-cuisinier'
GROUP BY v.id, v.name, v.slug, v.currency_code, v.supported_languages;