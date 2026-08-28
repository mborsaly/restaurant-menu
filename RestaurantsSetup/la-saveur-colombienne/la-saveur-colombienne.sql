-- ============================================
-- LA SAVEUR COLOMBIENNE
-- BISTROVITE ONBOARDING
-- Colombian cuisine
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
  'La Saveur Colombienne',
  'La Saveur Colombienne',
  'نكهة كولومبيا',
  'la-saveur-colombienne',
  'restaurant',
  'bistrovite',
  '+15142927328',              -- replace with owner phone
  'la-saveur-colombienne@gmail.com',
  '+15142927328',                         -- add after Twilio/WhatsApp setup
  '37 Bd Curé-Labelle, Sainte-Rose, QC H7L 2Y8',                         -- replace with real address
  '11:00',
  '21:00',                      -- confirm real hours with owner
  0.00,
  3.99,                         -- confirm real delivery fee with owner
  '30-40 min',
  '#C8102E',                    -- Colombian flag red, placeholder brand color
  '#FFCD00',                    -- Colombian flag yellow
  '🇨🇴',
  'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/la-saveur-colombienne-hbnsczdx-logo.png',
  'CA', 'CAD', '+1',
  ARRAY['en','fr','ar'],
  'America/Toronto',
  true, true, false,
  true,                        -- keep inactive until confirmed live
  false,
  'Welcome to La Saveur Colombienne! Browse our menu and order in seconds 🇨🇴',
  'Bienvenue chez La Saveur Colombienne! Parcourez notre menu et commandez en quelques secondes 🇨🇴',
  'أهلاً بيك في نكهة كولومبيا! تصفح المنيو واطلب في ثواني 🇨🇴',
  'Colombian',
  'كولومبي'
)
ON CONFLICT (slug) DO NOTHING;


-- ============================================
-- STEP 2 — CATEGORIES
-- ============================================
INSERT INTO categories (vendor_id, name_en, name_fr, name_ar, emoji, sort_order, active)
VALUES
  ((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'), 'Appetizers', 'Entrées', 'المقبلات', '🥟', 1, true),
  ((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'), 'Individual Colombian Meals', 'Repas Individuels Colombiens', 'وجبات كولومبية', '🍽️', 2, true),
  ((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'), 'Meal Soups', 'Soupes-Repas', 'الشوربات', '🍲', 3, true),
  ((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'), 'Seafood Meals', 'Repas de Fruits de Mer', 'المأكولات البحرية', '🦐', 4, true),
  ((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'), 'Colombian Soft Drinks', 'Boissons Gazeuses Colombiennes', 'المشروبات الكولومبية', '🥤', 5, true),
  ((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'), 'Natural Juices', 'Jus Naturels', 'العصائر الطبيعية', '🧃', 6, true),
  ((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'), 'Desserts', 'Desserts', 'الحلويات', '🍰', 7, true),
  ((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'), 'Express Menu', 'Menu Express', 'وجبات سريعة', '⚡', 8, true);


-- ============================================
-- STEP 3 — MENU ITEMS
-- Prices in CAD, exactly as provided
-- ============================================

-- ── 🥟 APPETIZERS / المقبلات ───────────────
INSERT INTO menu_items (
  vendor_id, category_id, name_en, name_fr, name_ar,
  description_en, description_fr, description_ar,
  base_price, available, sort_order, emoji, image_url
) VALUES

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Appetizers'),
 'Miniempanadas (9)', 'Miniempanadas (9)', 'ميني إمبانادا (٩)',
 'Fried corn turnovers stuffed with minced meat and potato, served with Aji.',
 'Chaussons de maïs frits, farcis de viande hachée et de pommes de terre, servis avec de l''Aji.',
 'فطائر ذرة مقلية محشوة باللحم المفروم والبطاطس، تقدم مع صلصة آخي.',
 16.00, true, 1, '🥟',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/b4facf495c22df52f3ca635379ebe613(3).jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Appetizers'),
 'Patacon (4)', 'Patacon (4)', 'باتاكون (٤)',
 'Flattened and fried pieces of green plantain, served with Hogao Creole sauce.',
 'Morceaux de banane plantain verte aplatis et frits, servis avec une sauce Hogao créole.',
 'شرائح من الموز الأخضر المهروسة والمقلية، تقدم مع صلصة هوجاو الكريولية.',
 12.00, true, 2, '🍌',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/b4facf495c22df52f3ca635379ebe613(5).jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Appetizers'),
 'Palitos de Queso (8)', 'Palitos de Queso (8)', 'أصابع الجبن (٨)',
 'Mozzarella cheese sticks wrapped in buttery dough and fried.',
 'Bâtonnets de mozzarella enveloppés dans une pâte beurrée et frits.',
 'أصابع من جبن الموزاريلا ملفوفة بعجينة زبدية ومقلية.',
 17.00, true, 3, '🧀',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/b4facf495c22df52f3ca635379ebe613(7).jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Appetizers'),
 'Morcilla with Criolla', 'Morcilla avec Criolla', 'مورسيلا مع بطاطس كريولا',
 'Colombian blood sausage containing rice, mint and spices, served with arepa.',
 'Boudin noir colombien contenant du riz, de la menthe et des épices, servi avec une arepa.',
 'نقانق دم كولومبية تحتوي على الأرز والنعناع والتوابل، تقدم مع أريبا.',
 14.00, true, 4, '🌭',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/b4facf495c22df52f3ca635379ebe613(9).jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Appetizers'),
 'Colombian Chorizo with Criolla', 'Chorizo Colombien avec Criolla', 'تشوريزو كولومبي مع بطاطس كريولا',
 'Colombian chorizo made with coarsely chopped pork seasoned with cilantro, shallot and special spices, served with arepa.',
 'Chorizo colombien à base de porc haché grossièrement, assaisonné de coriandre, d''échalote et d''épices spéciales, servi avec une arepa.',
 'تشوريزو كولومبي من لحم الخنزير المتبل بالكزبرة والكراث وتوابل خاصة، يقدم مع أريبا.',
 14.00, true, 5, '🌭',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/b4facf495c22df52f3ca635379ebe613(8).jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Appetizers'),
 'Empanada (1)', 'Empanada (1)', 'إمبانادا واحدة',
 'Fried corn turnover stuffed with minced meat and potato, served with Aji.',
 'Chausson de maïs frit, farci de viande hachée et de pommes de terre, servi avec de l''Aji.',
 'فطيرة ذرة مقلية محشوة باللحم المفروم والبطاطس، تقدم مع صلصة آخي.',
 4.50, true, 6, '🥟',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/bc9c318a9c96996e2d990faf2b0c65f6(2).jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Appetizers'),
 'Empanadas (3)', 'Empanadas (3)', 'إمبانادا (٣)',
 'Three corn turnovers stuffed with beef and potato, served with Aji.',
 'Trois chaussons de maïs farcis au bœuf et aux pommes de terre, servis avec de l''Aji.',
 'ثلاث فطائر ذرة محشوة باللحم والبطاطس، تقدم مع صلصة آخي.',
 13.00, true, 7, '🥟',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/bc9c318a9c96996e2d990faf2b0c65f6.jpeg'),


-- ── 🍽️ INDIVIDUAL COLOMBIAN MEALS / وجبات كولومبية ──
((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Individual Colombian Meals'),
 'Colombian Lechona', 'Lechona Colombienne', 'ليتشونا كولومبية',
 'Boneless pork stuffed with rice, shredded meat, peas and spices, cooked in the oven and served with crispy skin and arepa.',
 'Porc désossé farci de riz, de viande effilochée, de pois et d''épices, cuit au four et servi avec peau croustillante et arepa.',
 'لحم خنزير منزوع العظم محشو بالأرز واللحم المفتت والبازلاء والتوابل، يقدم مع جلد مقرمش وأريبا.',
 17.00, true, 1, '🍖',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/b4facf495c22df52f3ca635379ebe613(4).jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Individual Colombian Meals'),
 'Bean Casserole', 'Casserole de Haricots', 'كازويلا الفاصوليا',
 'Red bean stew with white rice, ripe plantain, arepa, chorizo, morcilla, chicharron, avocado and an egg.',
 'Ragoût de haricots rouges avec riz blanc, plantain mûr, arepa, chorizo, morcilla, chicharron, avocat et un œuf.',
 'يخنة من الفاصوليا الحمراء مع الأرز الأبيض والموز الناضج والأريبا والتشوريزو والمورسيلا وتشيتشارون والأفوكادو والبيض.',
 27.00, true, 2, '🍲',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/b4facf495c22df52f3ca635379ebe613(1).jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Individual Colombian Meals'),
 'Colombian Picada', 'Picada Colombienne', 'بيكادا كولومبية',
 'Assorted plantains, pork belly, chorizo, morcilla, Colombian baby potatoes, arepa and mini beef empanadas, served with Aji.',
 'Assortiment de plantains, poitrine de porc, chorizo, morcilla, petites pommes de terre colombiennes, arepa et mini-empanadas au bœuf, servi avec de l''Aji.',
 'تشكيلة من الموز الأخضر ولحم البطن والتشوريزو والمورسيلا وبطاطس كريولا وأريبا وإمبانادا، تقدم مع صلصة آخي.',
 25.00, true, 3, '🍽️',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/b4facf495c22df52f3ca635379ebe613(2).jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Individual Colombian Meals'),
 'Tamal Tolimense', 'Tamal Tolimense', 'تامال توليمينسي',
 'Seasoned rice mixture stuffed with chicken, pork, carrots, potatoes and spices, cooked in a banana leaf and served with arepa and coffee or hot chocolate.',
 'Préparation de riz savoureuse farcie de poulet, porc, carottes, pommes de terre et épices, cuite dans une feuille de bananier et servie avec arepa et café ou chocolat chaud.',
 'أرز متبل محشو بالدجاج والخنزير والجزر والبطاطس والتوابل، مطهو في ورق الموز ويقدم مع أريبا وقهوة أو شوكولاتة ساخنة.',
 16.00, true, 4, '🌽',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/4218ca1d09174218364162cd0b1a8cc1.jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Individual Colombian Meals'),
 'Bistec a Caballo', 'Bistec a Caballo', 'بيستيك آ كابايو',
 'Beef steak in criolla sauce, served with plantain, arepa and eggs.',
 'Steak de bœuf dans une sauce criolla, servi avec banane plantain, arepa et œufs.',
 'شريحة لحم بقري في صلصة كريولا، مع موز أخضر وأريبا وبيض.',
 30.00, true, 5, '🥩',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/58f691da9eaef86b0b51f9b2c483fe63.jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Individual Colombian Meals'),
 'Chuleta Caleña', 'Chuleta Caleña', 'تشوليتا كالينيا',
 'Breaded pork chop served with white rice, green plantain and fries.',
 'Côtelette de porc panée servie avec riz blanc, plantain vert et frites.',
 'قطعة لحم خنزير مغطاة بالبقسماط، تقدم مع الأرز الأبيض والموز الأخضر والبطاطس المقلية.',
 30.00, true, 6, '🍖',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/bc9c318a9c96996e2d990faf2b0c65f6(1).jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Individual Colombian Meals'),
 'Half Chuleta Caleña', 'Demi-Chuleta Caleña', 'نصف تشوليتا كالينيا',
 'Half breaded pork chop served with white rice, patacon and fries.',
 'Demi-côtelette de porc panée servie avec riz blanc, patacon et frites.',
 'نصف قطعة لحم خنزير مغطاة بالبقسماط، تقدم مع الأرز الأبيض والباتاكون والبطاطس المقلية.',
 22.00, true, 7, '🍖',
 NULL),  -- ⚠️ no image provided in source


-- ── 🍲 MEAL SOUPS / الشوربات ────────────────
((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Meal Soups'),
 'Ajiaco Bogotano', 'Ajiaco Bogotano', 'أخياكو بوغوتانو',
 'Hearty soup with three types of potatoes and chicken, seasoned with Guasca, served with chicken thigh, rice, capers and cream.',
 'Soupe consistante aux trois sortes de pommes de terre et au poulet, assaisonnée de guasca, servie avec cuisse de poulet, riz, câpres et crème.',
 'شوربة غنية بثلاثة أنواع من البطاطس والدجاج مع توابل غواسكاس، تقدم مع فخذ دجاج وأرز وكبر وكريمة.',
 26.00, true, 1, '🍲',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/b4facf495c22df52f3ca635379ebe613.jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Meal Soups'),
 'Sancocho de Gallina', 'Sancocho de Gallina', 'سانكوتشو دي جالينا',
 'Chicken broth with potato, green plantain, corn and cassava, served with white rice, avocado and Aji.',
 'Bouillon de poulet avec pommes de terre, plantain vert, maïs et manioc, servi avec riz blanc, avocat et Aji.',
 'مرق دجاج مع البطاطس والموز الأخضر والذرة واليوكا، يقدم مع الأرز الأبيض والأفوكادو وصلصة آخي.',
 31.00, true, 2, '🍲',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/b4facf495c22df52f3ca635379ebe613(6).jpeg'),


-- ── 🦐 SEAFOOD MEALS / المأكولات البحرية ────
((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Seafood Meals'),
 'Paella', 'Paella', 'باييلا',
 'Special seafood rice with shrimp, squid, crab and mussels, prepared with red and green pepper sauce and white wine.',
 'Riz spécial aux fruits de mer avec crevettes, calamars, crabe et moules, préparé avec une sauce aux poivrons rouges et verts et du vin blanc.',
 'أرز بالمأكولات البحرية مثل الروبيان والحبار والسلطعون وبلح البحر، مع صلصة الفلفل الأحمر والأخضر والنبيذ الأبيض.',
 32.00, true, 1, '🥘',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/4218ca1d09174218364162cd0b1a8cc1(1).jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Seafood Meals'),
 'Seafood Casserole', 'Cazuela de Mariscos', 'كازويلا دي ماريسكوس',
 'Creamy seafood stew with coconut milk and pepper, shrimp, squid, crab and mussels, served with patacon and white rice.',
 'Ragoût crémeux de fruits de mer avec lait de coco et poivre, crevettes, calamars, crabe et moules, servi avec patacon et riz blanc.',
 'يخنة كريمية من المأكولات البحرية وحليب جوز الهند والفلفل، مع الروبيان والحبار والسلطعون وبلح البحر، تقدم مع باتاكون وأرز أبيض.',
 32.00, true, 2, '🍤',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/4218ca1d09174218364162cd0b1a8cc1(2).jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Seafood Meals'),
 'Fried Fish', 'Poisson Entier Frit', 'سمك مقلي كامل',
 'Whole fried fish served with fries, plantain, cassava and salad.',
 'Poisson entier frit servi avec frites, banane plantain, manioc et salade.',
 'سمكة كاملة مقلية تقدم مع البطاطس المقلية والموز واليوكا والسلطة.',
 32.00, true, 3, '🐟',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/58f691da9eaef86b0b51f9b2c483fe63(3).jpeg'),


-- ── 🥤 COLOMBIAN SOFT DRINKS / المشروبات الكولومبية ──
((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Colombian Soft Drinks'),
 'Colombiana Can', 'Colombiana - Canette', 'كولومبيانا علبة',
 'Colombiana Colombian soft drink in a can.',
 'Boisson gazeuse colombienne en canette.',
 'مشروب غازي كولومبي في علبة.',
 4.00, true, 1, '🥤',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/58f691da9eaef86b0b51f9b2c483fe63(4).jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Colombian Soft Drinks'),
 'Colombiana 1.5L', 'Colombiana 1,5 L', 'كولومبيانا ١.٥ لتر',
 'Colombiana soft drink, 1.5 L.',
 'Boisson Colombiana, 1,5 L.',
 'مشروب كولومبيانا بحجم ١.٥ لتر.',
 8.00, true, 2, '🥤',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/58f691da9eaef86b0b51f9b2c483fe63(1).jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Colombian Soft Drinks'),
 'Pony Malta - 6 Pack', 'Pony Malta - Paquet de 6', 'بوني مالطا - ٦ عبوات',
 'Six-pack of Pony Malta.',
 'Paquet de 6 Pony Malta.',
 'عبوة من ست زجاجات بوني مالطا.',
 18.00, true, 3, '🍾',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/58f691da9eaef86b0b51f9b2c483fe63(2).jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Colombian Soft Drinks'),
 'Manzana Soft Drink', 'Boisson Gazeuse Manzana', 'مانزانا',
 'Apple-flavored soft drink.',
 'Boisson gazeuse à saveur de pomme.',
 'مشروب غازي بنكهة التفاح.',
 4.00, true, 4, '🥤',
 NULL),  -- ⚠️ no image provided in source


-- ── 🧃 NATURAL JUICES / العصائر الطبيعية ────
((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Natural Juices'),
 'Natural Juices with Water', 'Jus Naturels avec de l''Eau', 'عصائر طبيعية بالماء',
 'Natural fruit juices prepared with water; choice of flavor.',
 'Jus de fruits naturels préparés avec de l''eau; choix de saveur.',
 'عصائر فواكه طبيعية محضرة بالماء مع اختيار النكهة.',
 5.00, true, 1, '🧃',
 NULL),  -- ⚠️ no image provided in source

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Natural Juices'),
 'Natural Juice Pitcher', 'Pichet de Jus Naturel', 'بيتشير عصير طبيعي',
 'Pitcher of natural fruit juice.',
 'Pichet de jus de fruits naturel.',
 'إبريق كبير من العصير الطبيعي.',
 18.00, true, 2, '🧃',
 NULL),  -- ⚠️ no image provided in source


-- ── 🍰 DESSERTS / الحلويات ──────────────────
((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Desserts'),
 'Dessert', 'Dessert', 'حلوى',
 'Sponge cake topped with whipped cream and a cherry, drizzled with red syrup and served with orange slices.',
 'Gâteau éponge garni de crème fouettée et d''une cerise, nappé de sirop rouge et servi avec des tranches d''orange.',
 'كيك إسفنجي مغطى بالكريمة المخفوقة والكرز، مع صوص أحمر وشرائح برتقال.',
 8.00, true, 1, '🍰',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/bc9c318a9c96996e2d990faf2b0c65f6(3).jpeg'),


-- ── ⚡ EXPRESS MENU / وجبات سريعة ───────────
((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Express Menu'),
 'Colombian Poutine', 'Poutine Colombienne', 'بوتين كولومبية',
 'Poutine topped with Colombian chorizo, criolla sauce and crispy cheese.',
 'Poutine garnie de chorizo colombien, de sauce criolla et de fromage croustillant.',
 'بوتين مع تشوريزو كولومبي وصلصة كريولا وجبن مقرمش.',
 22.00, true, 1, '🍟',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/58f691da9eaef86b0b51f9b2c483fe63(5).jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Express Menu'),
 'Patacon Burger', 'Patacon Burger', 'باتاكون برجر',
 'Burger combining fried green plantain patacon with a chorizo patty, cheese, onions and corn, served with fries.',
 'Burger combinant le patacon de plantain vert et une galette de chorizo, avec fromage, oignons et maïs, servi avec frites.',
 'برجر يجمع بين الباتاكون وقطعة تشوريزو مع الجبن والبصل والذرة، يقدم مع البطاطس المقلية.',
 23.00, true, 2, '🍔',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/58f691da9eaef86b0b51f9b2c483fe63(6).jpeg'),

((SELECT id FROM vendors WHERE slug='la-saveur-colombienne'),
 (SELECT id FROM categories WHERE vendor_id=(SELECT id FROM vendors WHERE slug='la-saveur-colombienne') AND name_en='Express Menu'),
 'Chicharron Ceviche', 'Ceviche de Chicharron', 'سيفيتشي تشيتشارون',
 'Pork belly in homemade BBQ sauce with red onion, corn and patacon.',
 'Poitrine de porc dans une sauce BBQ maison avec oignon rouge, maïs et patacon.',
 'لحم بطن الخنزير في صلصة باربكيو منزلية مع البصل الأحمر والذرة والباتاكون.',
 24.00, true, 3, '🍖',
 'https://axiwfkpwgyvccdzpclfu.supabase.co/storage/v1/object/public/vendors-imgs/la-saveur-colombienne/58f691da9eaef86b0b51f9b2c483fe63(7).jpeg');


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
WHERE v.slug = 'la-saveur-colombienne'
GROUP BY v.id, v.name, v.slug, v.currency_code, v.supported_languages;