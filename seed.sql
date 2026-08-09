-- CuratedLux Seed Data - Test luxury inventory & client requests

INSERT OR IGNORE INTO inventory (id, owner_id, category, brand, model, reference_number, year, condition_grade, condition_label, estimated_value, currency, confidence, authenticity_status, reasoning, inclusions, image_count, status, created_at, updated_at)
VALUES
('inv-001', 'demo-user', 'Watches', 'Rolex', 'Submariner Date 126610LN', '126610LN', 2024, 4, 'Mint', 14200, 'USD', 96, 'AUTHENTIC', 'Ceramic bezel, Oystersteel case, 41mm — verified against TagMyWatch index', '["Box","Papers","Hang Tag"]', 3, 'active', datetime('now'), datetime('now')),
('inv-002', 'demo-user', 'Watches', 'Patek Philippe', 'Nautilus 5811/1G-001', '5811/1G-001', 2023, 4, 'Mint', 145000, 'USD', 98, 'AUTHENTIC', '18k white gold case, blue sunburst dial — 2026 Patek archives match', '["Box","Papers","Archive Extract"]', 2, 'active', datetime('now'), datetime('now')),
('inv-003', 'demo-user', 'Watches', 'Audemars Piguet', 'Royal Oak Extra-Thin 16202ST', '16202ST.OO.1240ST.01', 2023, 3, 'Very Good', 68000, 'USD', 96, 'AUTHENTIC', 'Petite Tapisserie dial, octagonal bezel, Calibre 7121', '["Box","Papers"]', 2, 'active', datetime('now'), datetime('now')),
('inv-004', 'demo-user', 'Watches', 'Richard Mille', 'RM 11-03 Flyback Chronograph', 'RM11-03 TI', 2022, 4, 'Mint', 220000, 'USD', 97, 'AUTHENTIC', 'Calibre RMAC3, NTPT carbon/titanium tonneau case', '["Box","Papers"]', 1, 'active', datetime('now'), datetime('now')),
('inv-005', 'demo-user', 'Handbags', 'Hermès', 'Birkin 30 Black Epsom GHW', 'HER-BIR-30-EPS', 2023, 4, 'Mint', 24500, 'USD', 98, 'AUTHENTIC', 'Hermès Paris foil stamping, Epsom leather grain verified', '["Box","Dust Bag","Receipt"]', 2, 'active', datetime('now'), datetime('now')),
('inv-006', 'demo-user', 'Handbags', 'Hermès', 'Kelly 25 Sellier Croc Porosus', 'HER-KEL-25-CRO', 2024, 4, 'Mint', 68000, 'USD', 99, 'AUTHENTIC', 'Porosus crocodile scale symmetry, blind stamp verified', '["Box","Dust Bag","CITES"]', 2, 'active', datetime('now'), datetime('now')),
('inv-007', 'demo-user', 'Fine Jewelry', 'Cartier', 'Love Bracelet 18K Yellow Gold', 'B6035517', 2023, 3, 'Very Good', 7800, 'USD', 96, 'AUTHENTIC', 'Cartier signature, serial engraving, screw spacing verified', '["Box","Certificate"]', 1, 'active', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO client_requests (id, owner_id, client_name, looking_for_brand, looking_for_model, reference_number, budget_usd, currency, urgency, condition_required, status, created_at, updated_at)
VALUES
('req-001', 'demo-user', 'James Mitchell', 'Rolex', 'Daytona 116500LN', '116500LN', 35000, 'USD', 'Immediate', 4, 'active', datetime('now'), datetime('now')),
('req-002', 'demo-user', 'Sarah Chen', 'Patek Philippe', 'Aquanaut 5167A', '5167A', 65000, 'USD', '1-2 weeks', 4, 'active', datetime('now'), datetime('now')),
('req-003', 'demo-user', 'David Park', 'Hermès', 'Birkin 25 Togo', '', 18000, 'USD', 'Flexible', 3, 'active', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO profiles (user_id, full_name, email, company_name, role, tier, created_at, updated_at)
VALUES ('demo-user', 'Alexandre Laurent', 'alex@curatedlux.com', 'CuratedLux International', 'Senior Appraiser', 'Enterprise VIP', datetime('now'), datetime('now'));
