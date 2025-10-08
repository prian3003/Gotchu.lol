-- Migration to add CASCADE delete to template foreign key constraints
-- Run this on your database to fix existing constraints

-- Drop and recreate template_likes foreign key with CASCADE
ALTER TABLE template_likes DROP CONSTRAINT IF EXISTS fk_templates_template_likes;
ALTER TABLE template_likes DROP CONSTRAINT IF EXISTS fk_template_likes_template_id;
ALTER TABLE template_likes
  ADD CONSTRAINT fk_template_likes_template_id
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE;

-- Drop and recreate template_assets foreign key with CASCADE
ALTER TABLE template_assets DROP CONSTRAINT IF EXISTS fk_templates_template_assets;
ALTER TABLE template_assets DROP CONSTRAINT IF EXISTS fk_template_assets_template_id;
ALTER TABLE template_assets
  ADD CONSTRAINT fk_template_assets_template_id
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE;

-- Drop and recreate template_links foreign key with CASCADE
ALTER TABLE template_links DROP CONSTRAINT IF EXISTS fk_templates_template_links;
ALTER TABLE template_links DROP CONSTRAINT IF EXISTS fk_template_links_template_id;
ALTER TABLE template_links
  ADD CONSTRAINT fk_template_links_template_id
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE;

-- Drop and recreate template_reports foreign key with CASCADE
ALTER TABLE template_reports DROP CONSTRAINT IF EXISTS fk_templates_template_reports;
ALTER TABLE template_reports DROP CONSTRAINT IF EXISTS fk_template_reports_template_id;
ALTER TABLE template_reports
  ADD CONSTRAINT fk_template_reports_template_id
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE;
