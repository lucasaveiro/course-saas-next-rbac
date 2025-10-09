-- Rename acme-admin organization to Acme_Organization and delete others

UPDATE organizations SET name = 'Acme_Organization' WHERE slug = 'acme-admin';

DELETE FROM organizations WHERE slug IN ('acme-customer','acme-member');

-- Ensure only three members exist in the remaining organization with specified roles
-- Update roles for John, Courtney, Raymond
UPDATE members SET role = 'ADMIN'
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'acme-admin')
  AND user_id = (SELECT id FROM users WHERE email = 'john@acme.com');

UPDATE members SET role = 'CUSTOMER'
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'acme-admin')
  AND user_id = (SELECT id FROM users WHERE email = 'Cleveland.Runte@gmail.com');

UPDATE members SET role = 'STORE_OWNER'
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'acme-admin')
  AND user_id = (SELECT id FROM users WHERE email = 'Omari.Wehner21@hotmail.com');

-- Remove any other members from the acme-admin organization
DELETE FROM members
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'acme-admin')
  AND user_id NOT IN (
    (SELECT id FROM users WHERE email = 'john@acme.com'),
    (SELECT id FROM users WHERE email = 'Cleveland.Runte@gmail.com'),
    (SELECT id FROM users WHERE email = 'Omari.Wehner21@hotmail.com')
  );