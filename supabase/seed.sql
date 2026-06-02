-- ─────────────────────────────────────────────────────────────────────────────
-- Ortist – seed data
-- Run AFTER 002_fix_rls.sql in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Profiles ─────────────────────────────────────────────────────────────────
INSERT INTO profiles (clerk_id, username, display_name, bio, avatar_url, location, tag, followers_count, following_count, total_likes, rating, available) VALUES
('seed_user_1', 'alexmorrison',  'Alex Morrison',    'Creating visual experiences that blend surrealism with modern design. Specialising in brand identity, illustration, and digital art.',                  'https://i.pravatar.cc/150?img=33', 'San Francisco, CA',   'Digital Artist',    124500, 892,  2400000, 4.9, true),
('seed_user_2', 'mila_design',   'Mila Chen',        'UI/UX designer obsessed with clean interfaces and smooth animations. 6 years crafting digital products for startups and Fortune 500 companies.',     'https://i.pravatar.cc/150?img=5',  'New York, US',        'UI/UX Designer',     88200, 541,  1820000, 4.8, true),
('seed_user_3', 'jin3d_art',     'Jin Park',         '3D artist & motion designer. I build worlds that do not exist — yet. Open for brand collaborations and NFT drops.',                                   'https://i.pravatar.cc/150?img=7',  'Seoul, South Korea',  '3D Artist',          67100, 312,   980000, 4.7, true),
('seed_user_4', 'sara_motion',   'Sara Reyes',       'Motion designer with a love for kinetic typography and fluid animation. Worked with Netflix, Spotify, and Adobe.',                                   'https://i.pravatar.cc/150?img=9',  'Los Angeles, CA',     'Motion Designer',   201000, 1230, 4100000, 5.0, false),
('seed_user_5', 'noah_illusts',  'Noah Williams',    'Illustrator and visual storyteller. My work lives at the intersection of fantasy and everyday life. Editorial, publishing & brand commissions open.', 'https://i.pravatar.cc/150?img=12', 'London, UK',          'Illustrator',        43800, 287,   670000, 4.6, true),
('seed_user_6', 'priya_ux',      'Priya Sharma',     'Product designer from Mumbai. Passionate about inclusive design and accessibility. Currently designing for fintech and healthtech.',                  'https://i.pravatar.cc/150?img=16', 'Mumbai, India',       'Product Designer',   32400, 198,   410000, 4.7, true),
('seed_user_7', 'luca_brand',    'Luca Ferrari',     'Brand strategist and visual identity designer based in Milan. 10+ years helping brands find their visual voice.',                                    'https://i.pravatar.cc/150?img=20', 'Milan, Italy',        'Brand Designer',     91600, 445,  1350000, 4.9, true),
('seed_user_8', 'yuki_type',     'Yuki Tanaka',      'Typography artist and lettering designer. Every letter tells a story. Based in Tokyo, working worldwide.',                                           'https://i.pravatar.cc/150?img=22', 'Tokyo, Japan',        'Typography Artist',  28900, 163,   320000, 4.5, true)
ON CONFLICT (clerk_id) DO NOTHING;

-- ── Posts ─────────────────────────────────────────────────────────────────────
INSERT INTO posts (user_id, author_name, author_username, author_avatar, title, description, image_url, category, tags, medium, style, likes_count, comments_count, saves_count) VALUES
('seed_user_1', 'Alex Morrison',   'alexmorrison',  'https://i.pravatar.cc/80?img=33', 'Neon Dreams',           'A surreal cityscape at 3am. Built entirely in Procreate over two weeks.',                        'https://picsum.photos/seed/neon1/500/700',    'Illustration', ARRAY['digital','surreal','neon'],         'Digital',    'Surrealism', 4821, 92,  312),
('seed_user_1', 'Alex Morrison',   'alexmorrison',  'https://i.pravatar.cc/80?img=33', 'Brand Identity Vol.3',  'Exploring geometric forms for a sustainable fashion brand.',                                     'https://picsum.photos/seed/brand3/500/600',   'Branding',     ARRAY['branding','identity','geometric'],   'Vector',     'Minimal',    3204, 54,  198),
('seed_user_2', 'Mila Chen',       'mila_design',   'https://i.pravatar.cc/80?img=5',  'Dashboard Redesign',    'Rethinking how financial data can feel warm and approachable.',                                   'https://picsum.photos/seed/dash1/500/650',    'UI/UX',        ARRAY['ui','dashboard','fintech'],          'Figma',      'Clean',      6102, 134, 521),
('seed_user_2', 'Mila Chen',       'mila_design',   'https://i.pravatar.cc/80?img=5',  'Mobile App Concept',    'A meditation app focused on calm, intentional UI patterns.',                                     'https://picsum.photos/seed/mobile2/500/800',  'UI/UX',        ARRAY['mobile','app','ux'],                'Figma',      'Minimal',    5341, 89,  402),
('seed_user_3', 'Jin Park',        'jin3d_art',     'https://i.pravatar.cc/80?img=7',  'Abstract Horizons',     'A study in light, form and negative space. Rendered in Cinema 4D.',                              'https://picsum.photos/seed/abstract1/500/700','3D',           ARRAY['3d','abstract','light'],            'Cinema 4D',  '3D',         8923, 201, 678),
('seed_user_3', 'Jin Park',        'jin3d_art',     'https://i.pravatar.cc/80?img=7',  'Chrome Planet',         'Hyper-realistic metallic sphere series exploring reflection and distortion.',                    'https://picsum.photos/seed/chrome1/500/500',  '3D',           ARRAY['3d','chrome','hyperreal'],          'Cinema 4D',  'Hyperreal',  7812, 176, 589),
('seed_user_4', 'Sara Reyes',      'sara_motion',   'https://i.pravatar.cc/80?img=9',  'Kinetic Type Reel',     'A collection of my favourite kinetic typography pieces from 2024.',                             'https://picsum.photos/seed/kinetic1/500/600', 'Motion',       ARRAY['motion','typography','kinetic'],    'After Effects','Dynamic', 12400, 287, 934),
('seed_user_4', 'Sara Reyes',      'sara_motion',   'https://i.pravatar.cc/80?img=9',  'Fluid Animation Study', 'Six months studying fluid simulations and organic motion paths.',                               'https://picsum.photos/seed/fluid1/500/700',   'Motion',       ARRAY['motion','fluid','simulation'],      'After Effects','Organic', 9831, 213, 742),
('seed_user_5', 'Noah Williams',   'noah_illusts',  'https://i.pravatar.cc/80?img=12', 'The Night Market',      'Editorial illustration for a travel magazine feature on Hong Kong street food.',               'https://picsum.photos/seed/market1/500/650',  'Illustration', ARRAY['illustration','editorial','travel'],'Procreate',  'Painterly',  3892, 67,  234),
('seed_user_5', 'Noah Williams',   'noah_illusts',  'https://i.pravatar.cc/80?img=12', 'Botanical Series #7',   'Part of an ongoing botanical study combining scientific accuracy with decorative style.',        'https://picsum.photos/seed/botanical1/500/750','Illustration',ARRAY['botanical','illustration','nature'],'Watercolour','Decorative',4521, 98, 367),
('seed_user_6', 'Priya Sharma',    'priya_ux',      'https://i.pravatar.cc/80?img=16', 'Health App UX',         'Redesigning the patient experience for a telemedicine platform. Research to prototype.',           'https://picsum.photos/seed/health1/500/600',  'UI/UX',        ARRAY['healthcare','ux','accessibility'],  'Figma',      'Clean',      2934, 48,  189),
('seed_user_7', 'Luca Ferrari',    'luca_brand',    'https://i.pravatar.cc/80?img=20', 'Aperitivo Brand',       'Complete visual identity for an Italian aperitivo brand — logo, packaging, and art direction.', 'https://picsum.photos/seed/brand7/500/700',   'Branding',     ARRAY['branding','packaging','italian'],   'Illustrator','Classic',   7123, 154, 534),
('seed_user_7', 'Luca Ferrari',    'luca_brand',    'https://i.pravatar.cc/80?img=20', 'Wordmark Collection',   'A personal project exploring wordmark design across different typographic styles.',               'https://picsum.photos/seed/wordmark1/500/550','Typography',   ARRAY['typography','wordmark','branding'], 'Illustrator','Varied',    5678, 112, 421),
('seed_user_8', 'Yuki Tanaka',     'yuki_type',     'https://i.pravatar.cc/80?img=22', 'Kanji Letterforms',     'Reimagining traditional Kanji characters as Latin letterforms. An ongoing cultural study.',     'https://picsum.photos/seed/kanji1/500/650',   'Typography',   ARRAY['typography','japanese','lettering'],'Pen & Ink', 'Experimental',6234, 143, 478),
('seed_user_8', 'Yuki Tanaka',     'yuki_type',     'https://i.pravatar.cc/80?img=22', 'Neon Lettering',        'Hand lettered neon sign designs inspired by the backstreets of Shibuya.',                        'https://picsum.photos/seed/neon_type1/500/700','Typography',  ARRAY['lettering','neon','handmade'],      'Procreate',  'Retro',      4891, 87,  312)
ON CONFLICT DO NOTHING;

-- ── Comments on first few posts ──────────────────────────────────────────────
-- Get the first few post IDs and add comments
DO $$
DECLARE
  post_ids UUID[];
  pid UUID;
BEGIN
  SELECT ARRAY(SELECT id FROM posts ORDER BY created_at LIMIT 5) INTO post_ids;

  FOREACH pid IN ARRAY post_ids LOOP
    INSERT INTO comments (user_id, author_name, author_avatar, post_id, text) VALUES
    ('seed_user_2', 'Mila Chen',     'https://i.pravatar.cc/80?img=5',  pid, 'Absolutely stunning work! The composition is perfect 🔥'),
    ('seed_user_3', 'Jin Park',      'https://i.pravatar.cc/80?img=7',  pid, 'The colour palette here is incredible. What medium did you use?'),
    ('seed_user_5', 'Noah Williams', 'https://i.pravatar.cc/80?img=12', pid, 'This is gallery-worthy. Saved immediately!'),
    ('seed_user_7', 'Luca Ferrari',  'https://i.pravatar.cc/80?img=20', pid, 'Love the concept behind this. Would love to collaborate sometime!')
    ON CONFLICT DO NOTHING;

    UPDATE posts SET comments_count = 4 WHERE id = pid;
  END LOOP;
END $$;

-- ── Likes on all posts ────────────────────────────────────────────────────────
DO $$
DECLARE
  post_ids UUID[];
  pid UUID;
  likers TEXT[] := ARRAY['seed_user_1','seed_user_2','seed_user_3','seed_user_4','seed_user_5'];
  uid TEXT;
BEGIN
  SELECT ARRAY(SELECT id FROM posts) INTO post_ids;

  FOREACH pid IN ARRAY post_ids LOOP
    FOREACH uid IN ARRAY likers LOOP
      INSERT INTO likes (user_id, post_id) VALUES (uid, pid) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ── Follows ───────────────────────────────────────────────────────────────────
INSERT INTO follows (follower_id, following_id) VALUES
('seed_user_2', 'seed_user_1'), ('seed_user_3', 'seed_user_1'), ('seed_user_4', 'seed_user_1'),
('seed_user_5', 'seed_user_1'), ('seed_user_1', 'seed_user_2'), ('seed_user_3', 'seed_user_2'),
('seed_user_6', 'seed_user_3'), ('seed_user_7', 'seed_user_4'), ('seed_user_8', 'seed_user_5')
ON CONFLICT DO NOTHING;
