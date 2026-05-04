-- =============================================
-- Kraftworks Career Hub — Production Database Reset & Seed
-- Generated: 2026-04-08
-- =============================================
--
-- This script:
-- 1. Wipes ALL existing data from the production D1 database
-- 2. Re-creates admin account (Mahmud Asrul)
-- 3. Creates 3 employer accounts + companies
-- 4. Seeds 9 real job listings from LinkedIn postings
--
-- AFTER RUNNING:
-- 1. Create Clerk accounts for each employer (see employer_accounts.csv)
-- 2. Run the update_clerk_ids.sql script with real Clerk user IDs
-- Temporary employer IDs are used: employer_enterprise_001, employer_unify_001, employer_hays_001
-- =============================================


-- ========== STEP 1: WIPE ALL DATA ==========
-- (in foreign key dependency order)

DELETE FROM admin_audit_log;
DELETE FROM email_events;
DELETE FROM workflow_runs;
DELETE FROM job_applications;
DELETE FROM resume_feedback;
DELETE FROM interview_questions;
DELETE FROM ai_usage;
DELETE FROM employer_access_requests;
DELETE FROM newsletter_subscribers;
DELETE FROM contact_submissions;
DELETE FROM employer_waitlist;
DELETE FROM trade_grad_waitlist;
DELETE FROM job_listings;
DELETE FROM companies;
DELETE FROM resumes;
DELETE FROM user_roles;
DELETE FROM users;


-- ========== STEP 2: ADMIN ACCOUNT ==========

INSERT INTO users (id, email, full_name, created_at, updated_at) VALUES
  ('user_3BhZpQjH0GAk9oWdJwnFHqv4DYl', 'mahmudasrul11@gmail.com', 'Mahmud Asrul', datetime('now'), datetime('now'));

INSERT INTO user_roles (user_id, role, granted_at) VALUES
  ('user_3BhZpQjH0GAk9oWdJwnFHqv4DYl', 'admin', datetime('now'));


-- ========== STEP 3: EMPLOYER ACCOUNTS ==========
-- IMPORTANT: Replace placeholder IDs with real Clerk user IDs!

INSERT INTO users (id, email, full_name, created_at, updated_at) VALUES
  ('employer_enterprise_001', 'hr@enterpriseelectrical.com', 'Enterprise Electrical', datetime('now'), datetime('now')),
  ('employer_unify_001', 'careers@unifyenergy.com', 'Unify Energy Solutions', datetime('now'), datetime('now')),
  ('employer_hays_001', 'hr@hayselectrical.com', 'Hays Electrical Services', datetime('now'), datetime('now'));

INSERT INTO user_roles (user_id, role, granted_at) VALUES
  ('employer_enterprise_001', 'employer', datetime('now')),
  ('employer_unify_001', 'employer', datetime('now')),
  ('employer_hays_001', 'employer', datetime('now'));


-- ========== STEP 4: COMPANIES ==========

INSERT INTO companies (id, user_id, company_name, company_email, company_phone, company_website, industry, company_size, description, city, state, is_partner, is_verified, status, created_at, updated_at) VALUES
  ('comp_enterprise_001', 'employer_enterprise_001', 'Enterprise Electrical', 'hr@enterpriseelectrical.com', NULL, NULL, 'Electrical Contracting', '201-500',
   'Electrical Contractor specializing in design-build projects. Enterprise Electrical is a leading commercial and industrial electrical contractor serving the Houston, TX area and beyond, with expertise in commercial, data center, and mission-critical electrical installations.',
   'Houston', 'TX', 1, 1, 'active', datetime('now'), datetime('now')),

  ('comp_unify_001', 'employer_unify_001', 'Unify Energy Solutions', 'careers@unifyenergy.com', NULL, 'https://www.unifyES.com', 'Building Automation & HVAC', '51-200',
   'Unify Energy Solutions is a leading provider of innovative Building Automation Solutions (BAS) that maximize energy efficiency and sustainable building operations. Factory Trained and Authorized Providers of the Reliable Controls product line, serving Houston, Beaumont, Central and South Texas, Colorado and Wyoming. Our solutions control and monitor building functions such as heating, air conditioning, and lighting in education, commercial office, healthcare, government, and data center markets.',
   'Houston', 'TX', 1, 1, 'active', datetime('now'), datetime('now')),

  ('comp_hays_001', 'employer_hays_001', 'Hays Electrical Services', 'hr@hayselectrical.com', NULL, NULL, 'Electrical Contracting', '500+',
   'Founded in 2007, Hays Electrical Services is one of the fastest-growing electrical contractors in the nation, specializing in commercial, hospitality, and multi-family projects. With over 19 years of experience and 100+ million-dollar projects completed, Hays delivers exceptional results through integrity, trust, and reliability.',
   'Houston', 'TX', 1, 1, 'active', datetime('now'), datetime('now'));


-- ========== STEP 5: JOB LISTINGS (9 jobs) ==========

-- -----------------------------------------------
-- Enterprise Electrical — Job 1 of 3
-- LinkedIn: 4392981360
-- -----------------------------------------------
INSERT INTO job_listings (id, company_id, posted_by, title, description, trade_category, employment_type, experience_level, salary_min, salary_max, salary_period, city, state, is_remote, requirements, benefits, application_deadline, status, is_featured, views_count, created_at, updated_at) VALUES
  ('job_ee_service_001', 'comp_enterprise_001', 'employer_enterprise_001',
   'Apprentice Commercial Electrician (Service)',
   'We are seeking Apprentice commercial electricians to join our team in Houston, TX (The TX Gulf Coast Region includes Houston and Greater Houston area).

As an apprentice commercial electrician, you will work under the guidance of experienced electricians to learn and develop the necessary skills to become a fully licensed electrician. This is a great opportunity for individuals who are passionate about the electrical trade and eager to gain hands-on experience in a variety of commercial settings.

Duties include assisting with the installation, maintenance, and repair of electrical systems in commercial settings, learning to read and interpret blueprints, schematics, and technical drawings, troubleshooting electrical issues, performing basic electrical tasks such as wiring, conduit bending, and circuit installation, and following all safety protocols and regulations.

Knowledge of high voltage systems and NEC (National Electrical Code) regulations is valued. Expected work schedule: 40 hours per week. A neat, clean, tidy, and professional appearance is always the Enterprise Electrical standard.

Enterprise Electrical Core Values: Committed to Excellence, Plan it Do it Own it, Learn it Know it Teach it, One Team One Goal, Positive Attitude Required.',
   'electrician', 'full_time', 'entry', 22, 28, 'hourly', 'Houston', 'TX', 0,
   '["Active TX ID or Driver''s License","Active Electrical License","Social Security Card","Own tools required","Reliable transportation","Knowledge of NEC regulations","Basic knowledge of electrical principles","Familiarity with hand tools and power tools","Strong attention to detail and problem-solving skills","Physical ability to lift, stand, and walk for extended periods","Ability to work at heights and in confined spaces","Clear communication skills"]',
   '["Competitive compensation","Paid Vacation","Paid Holidays (8.5 days)","Health Insurance","Dental & Vision Insurance (covered by Enterprise)","School Tuition Assistance","401K Retirement savings plan","Training and development programs","Career advancement opportunities"]',
   datetime('now', '+60 days'), 'active', 1, 0, datetime('now'), datetime('now'));

-- -----------------------------------------------
-- Enterprise Electrical — Job 2 of 3
-- LinkedIn: 4387441847
-- -----------------------------------------------
INSERT INTO job_listings (id, company_id, posted_by, title, description, trade_category, employment_type, experience_level, salary_min, salary_max, salary_period, city, state, is_remote, requirements, benefits, application_deadline, status, is_featured, views_count, created_at, updated_at) VALUES
  ('job_ee_houston_002', 'comp_enterprise_001', 'employer_enterprise_001',
   'Apprentice Commercial Electrician - Houston, TX',
   'We are seeking Apprentice commercial electricians to join our team in Houston, TX (The TX Gulf Coast Region includes Houston and Greater Houston area).

As an apprentice commercial electrician, you will work under the guidance of experienced electricians to learn and develop the necessary skills to become a fully licensed electrician. This is a great opportunity for individuals who are passionate about the electrical trade and eager to gain hands-on experience in a variety of commercial settings.

Responsibilities include assisting with installation, maintenance, and repair of electrical systems, learning to read and interpret blueprints and technical drawings, troubleshooting electrical issues, performing wiring, conduit bending, and circuit installation, and collaborating with a team of electricians to complete projects efficiently and effectively.

Strong understanding of electrical principles and familiarity with hand tools and power tools used in the electrical trade is expected. Commitment to safety protocols is essential. Expected work schedule: 40 hours per week.

Enterprise Electrical Core Values: Committed to Excellence, Plan it Do it Own it, Learn it Know it Teach it, One Team One Goal, Positive Attitude Required.',
   'electrician', 'full_time', 'entry', 22, 28, 'hourly', 'Houston', 'TX', 0,
   '["Active TX ID or Driver''s License","Active Electrical License","Social Security Card","Own tools required","Reliable transportation","Knowledge of NEC regulations","Basic knowledge of electrical principles","Familiarity with hand tools and power tools","Strong attention to detail and problem-solving skills","Physical ability to lift, stand, and walk for extended periods","Ability to work at heights and in confined spaces","Clear communication skills"]',
   '["Competitive compensation","Paid Vacation","Paid Holidays (8.5 days)","Health Insurance","Dental & Vision Insurance (covered by Enterprise)","School Tuition Assistance","401K Retirement savings plan","Training and development programs","Career advancement opportunities"]',
   datetime('now', '+60 days'), 'active', 0, 0, datetime('now'), datetime('now'));

-- -----------------------------------------------
-- Enterprise Electrical — Job 3 of 3
-- LinkedIn: 4383393054
-- -----------------------------------------------
INSERT INTO job_listings (id, company_id, posted_by, title, description, trade_category, employment_type, experience_level, salary_min, salary_max, salary_period, city, state, is_remote, requirements, benefits, application_deadline, status, is_featured, views_count, created_at, updated_at) VALUES
  ('job_ee_datacenter_003', 'comp_enterprise_001', 'employer_enterprise_001',
   'Apprentice Electrician - Mission Critical Data Center',
   'Enterprise Electrical is looking for dedicated and skilled electricians at all levels — including apprentice electricians and crew support — to assist with a vital data center project in San Antonio, TX. This is a fantastic opportunity for professional electricians seeking consistent hours, competitive compensation, and robust travel support.

Compensation Structure: Entry-level Apprentice (Crew Support): $15-$20/hr. Apprentice 1 (1+ year verified experience): $22-$25/hr. Apprentice 2 (2+ years verified experience): $26-$29/hr. Daily Per Diem: $120 (paid daily, 7 days a week). Retention Bonus: $5.00/hr. Standard Schedule: 6/10s. Project Duration: 1 year+ with additional steady work.

Duties include assisting journeymen and foremen with installation of conduit systems (EMT, RMC, IMC), cable tray and supports, electrical equipment, panels, and devices. Pull wire and assist with terminations under supervision. Install grounding and bonding components. Support work in electrical rooms, data halls, and support spaces. Maintain cleanliness and organization in sensitive data center areas. Follow strict access, housekeeping, and work sequencing requirements.

Safety & Compliance: Follow all OSHA, NEC, NFPA 70E, and company safety policies. Participate in daily JHAs, toolbox talks, and safety meetings. Use required PPE and report hazards immediately.

Learning & Development: Actively participate in apprenticeship training and schooling (IEC or equivalent). Develop technical skills, tool knowledge, and code awareness. Progress toward journeyman licensure.',
   'electrician', 'full_time', 'entry', 15, 29, 'hourly', 'San Antonio', 'TX', 0,
   '["Valid TX TDLR electrical license","OSHA 10 required (or ability to obtain)","Valid driver''s license preferred","Basic understanding of construction tools and jobsite safety","Ability to follow instructions and work as part of a team","Willingness to learn commercial and data center electrical systems","Reliable attendance and strong work ethic","Ability to work extended hours, nights, or weekends as needed"]',
   '["Full-time employment","Health insurance","Dental and Vision Insurance","401K after 90 days","Retention Bonuses","Paid Time Off (after 90 days)","Paid Holidays (8.5 days)","Professional development opportunities","Travel opportunities across data centers nationwide","Competitive salary and comprehensive travel support"]',
   datetime('now', '+90 days'), 'active', 1, 0, datetime('now'), datetime('now'));

-- -----------------------------------------------
-- Unify Energy Solutions — Job 4 of 5
-- LinkedIn: 4385844226
-- -----------------------------------------------
INSERT INTO job_listings (id, company_id, posted_by, title, description, trade_category, employment_type, experience_level, salary_min, salary_max, salary_period, city, state, is_remote, requirements, benefits, application_deadline, status, is_featured, views_count, created_at, updated_at) VALUES
  ('job_unify_bas_controls_004', 'comp_unify_001', 'employer_unify_001',
   'Building Automation Controls Technician',
   'Do you consider yourself to be analytical and have a strong attention to detail? Are you driven to master new skills? Do you consider yourself to be patient and systematic? If this sounds like you, come join the Unify Energy Solutions Team!

Unify Energy Solutions is a leading provider of innovative Building Automation Solutions (BAS) that maximize energy efficiency and sustainable building operations. The BAS Controls Technician is responsible for troubleshooting automation control systems pertaining to air distribution equipment, air handlers, valves, variable speed equipment, exhaust systems, lighting, chill water, and boiler systems.

Duties & Responsibilities: Start-up and troubleshooting automation control systems. Work on replacement, renovation, or retrofit of building HVAC systems. Understand Reliable Product line and installation methods. Understand HVAC and Electrical systems. Maintain communication with PM and team members. Point to Point including end device set-up on boxes and fan coils. Controller hardware setup, wiring, and addressing. MSET MPC and Cradle Point set-up. Checkout of terminal units, fan coils, AHU, sequence checks, and troubleshooting. Maintain checkout books and redline submittals.',
   'hvac', 'full_time', 'entry', NULL, NULL, NULL, 'Houston', 'TX', 0,
   '["High School Diploma or equivalent required","Technical Certification preferred","Technical aptitude","Strong communication skills (written and verbal)","Knowledge of HVAC controls concepts is a plus","Knowledge of HVAC equipment is a plus","Electrical knowledge is a plus","Controls installation experience is a plus","Computer networking knowledge is a plus","Microsoft Office proficiency (Excel, Word, Outlook, Visio)"]',
   '["Medical, Dental, Vision Insurance","401K","Life/AD&D/LTD","Flexible Spending Accounts","Competitive Compensation","Paid Vacation/Sick/Holidays"]',
   datetime('now', '+60 days'), 'active', 1, 0, datetime('now'), datetime('now'));

-- -----------------------------------------------
-- Unify Energy Solutions — Job 5 of 5
-- LinkedIn: 4388292478
-- -----------------------------------------------
INSERT INTO job_listings (id, company_id, posted_by, title, description, trade_category, employment_type, experience_level, salary_min, salary_max, salary_period, city, state, is_remote, requirements, benefits, application_deadline, status, is_featured, views_count, created_at, updated_at) VALUES
  ('job_unify_bas_field_005', 'comp_unify_001', 'employer_unify_001',
   'Building Automation Controls Field Tech',
   'Do you consider yourself to be analytical and have a strong attention to detail? Are you driven to master new skills? Come join the Unify Energy Solutions Team!

The BAS Controls Field Tech is responsible for field troubleshooting of automation control systems pertaining to air distribution equipment, air handlers, valves, variable speed equipment, exhaust systems, lighting, chill water, and boiler systems. Many projects include replacement, renovation, or retrofit of building HVAC systems.

This position requires a passion and dedication to providing the customer with innovative and superior building automation systems and outstanding customer service. You will work on controller hardware setup, point-to-point checkout including end device set-up, sequence checks on terminal units and fan coils, and maintain checkout documentation and redline submittals.',
   'hvac', 'full_time', 'entry', NULL, NULL, NULL, 'Houston', 'TX', 0,
   '["High School Diploma or equivalent required","Technical Certification preferred","Technical aptitude","Strong communication skills (written and verbal)","Knowledge of HVAC controls concepts is a plus","Knowledge of HVAC equipment is a plus","Electrical knowledge is a plus","Controls installation experience is a plus","Computer networking knowledge is a plus","Microsoft Office proficiency (Excel, Word, Outlook, Visio)"]',
   '["Medical, Dental, Vision Insurance","401K","Life/AD&D/LTD","Flexible Spending Accounts","Competitive Compensation","Paid Vacation/Sick/Holidays"]',
   datetime('now', '+60 days'), 'active', 0, 0, datetime('now'), datetime('now'));

-- -----------------------------------------------
-- Unify Energy Solutions — Job 6 of 5
-- LinkedIn: 4392052249
-- -----------------------------------------------
INSERT INTO job_listings (id, company_id, posted_by, title, description, trade_category, employment_type, experience_level, salary_min, salary_max, salary_period, city, state, is_remote, requirements, benefits, application_deadline, status, is_featured, views_count, created_at, updated_at) VALUES
  ('job_unify_hvac_bas_sa_006', 'comp_unify_001', 'employer_unify_001',
   'HVAC & BAS Controls Tech - Relocate to San Antonio',
   'Are you a Commercial HVAC Technician with a talent for troubleshooting and a hunger for the tech side of the industry? Do you excel with chillers, RTUs, and air handlers, but feel ready to master the world of Building Automation Systems (BAS)?

Unify Energy Solutions is seeking an early-to-mid-career, motivated technician to become our foundational presence in San Antonio. Because we are currently scaling our San Antonio operations, this role begins with a 3-6 month intensive training residency in Houston.

The Training & Development Path: Houston Residency (3-6 months) to master BAS controls integration. Flexible commuter schedule with 4-10 option (four 10-hour days). San Antonio field rotations for 1-2 weeks at a time. Long-term transition to full-time 40-hour on-site technician in San Antonio as the market matures.

What You Will Do: Perform start-up and troubleshooting on commercial HVAC systems (RTUs, chillers, boilers) while learning BAS integration. Develop expertise in BAS controls for VFDs, actuators, and dampers. Configure, download, and verify controller hardware and network addresses. Execute sequence verification for building energy efficiency. Facilitate BACnet integrations and provide clear updates to project managers and customers.

A clear career pivot: an accelerated pathway from traditional HVAC to BAS Controls Expert with paid hands-on training on industry-leading platforms.',
   'hvac', 'full_time', 'mid', NULL, NULL, NULL, 'San Antonio', 'TX', 0,
   '["1-3+ years hands-on commercial HVAC experience","Chiller/RTU experience is a major plus","Strong desire to learn BAS software, networking, and controls logic","Proficiency in interpreting control wiring diagrams and mechanical drawings","Willingness to travel/train in Houston initially","Must be ready to relocate to San Antonio","Ability to lift 30+ lbs","Valid driver''s license","Reliable work ethic"]',
   '["Medical, Dental, Vision Insurance","401K","Paid Time Off","Paid hands-on BAS training","Competitive compensation","Clear career advancement pathway"]',
   datetime('now', '+60 days'), 'active', 0, 0, datetime('now'), datetime('now'));

-- -----------------------------------------------
-- Unify Energy Solutions — Job 7 of 5
-- LinkedIn: 4380139713
-- -----------------------------------------------
INSERT INTO job_listings (id, company_id, posted_by, title, description, trade_category, employment_type, experience_level, salary_min, salary_max, salary_period, city, state, is_remote, requirements, benefits, application_deadline, status, is_featured, views_count, created_at, updated_at) VALUES
  ('job_unify_bas_field_007', 'comp_unify_001', 'employer_unify_001',
   'BAS Field Technician',
   'Unify Energy Solutions is a leading provider of innovative Building Automation Solutions (BAS) that maximize energy efficiency and sustainable building operations. If you are dedicated and ambitious, Unify Energy Solutions is an excellent place to grow your career.

The BAS Field Technician is responsible for start-up and troubleshooting automation control systems pertaining to air distribution equipment, air handlers, valves, variable speed equipment, exhaust systems, lighting, chill water, and boiler systems. Many projects include replacement, renovation, or retrofit of building HVAC systems.

Key responsibilities include understanding the Reliable Product line and installation methods, maintaining communication with PM and team members, material management and chain of custody, point-to-point checkout including end device set-up on boxes and fan coils, controller hardware setup (wired and addressed correctly), MSET MPC and Cradle Point set-up, sequence checks and basic troubleshooting of terminal units and fan coils, maintaining checkout books and redline submittals, and AHU checkout.',
   'hvac', 'full_time', 'entry', NULL, NULL, NULL, 'Houston', 'TX', 0,
   '["High School Diploma or equivalent required","Technical Certification preferred","Technical aptitude","Strong communication skills (written and verbal)","Knowledge of HVAC controls concepts is a plus","Knowledge of HVAC equipment is a plus","Electrical knowledge is a plus","Controls installation experience is a plus","Computer networking knowledge is a plus","Microsoft Office proficiency (Excel, Word, Outlook, Visio)"]',
   '["Medical, Dental, Vision Insurance","401K","Life/AD&D/LTD","Flexible Spending Accounts","Competitive Compensation","Paid Vacation/Sick/Holidays"]',
   datetime('now', '+60 days'), 'active', 0, 0, datetime('now'), datetime('now'));

-- -----------------------------------------------
-- Unify Energy Solutions — Job 8 of 5
-- LinkedIn: 4381952030
-- -----------------------------------------------
INSERT INTO job_listings (id, company_id, posted_by, title, description, trade_category, employment_type, experience_level, salary_min, salary_max, salary_period, city, state, is_remote, requirements, benefits, application_deadline, status, is_featured, views_count, created_at, updated_at) VALUES
  ('job_unify_hvac_sa_008', 'comp_unify_001', 'employer_unify_001',
   'HVAC Service Technician',
   'Unify Energy Solutions is seeking a dedicated and experienced HVAC Service Technician to join our dynamic team. You will be working in the fast-paced, always evolving construction industry, where you will be constantly challenged and given the opportunity to make a big impact. This permanent position offers a fantastic opportunity for those with a passion for problem-solving and a keen interest in the HVAC sector.

Duties and Responsibilities: Installing, maintaining, and repairing heating, ventilation, cooling, and refrigeration units for both commercial and residential customers, including air conditioning systems, chillers, heat pumps, and other HVAC equipment. Diagnosing and repairing faults in HVAC systems for optimal efficiency. Performing routine maintenance (replacing filters, lubricating parts, inspecting electrical wiring). Responding to emergency call-outs. Providing technical support and advice to customers. Ensuring all work adheres to health and safety regulations. Keeping accurate records of work performed and materials used.',
   'hvac', 'full_time', 'mid', NULL, NULL, NULL, 'San Antonio', 'TX', 0,
   '["Minimum 1 year HVAC Service Technician experience","Understanding of HVAC systems (installation, maintenance, repair)","Commercial HVAC and chiller experience is a plus","Proficiency in diagnosing and fixing mechanical faults","Valid driver''s license and ability to travel to job sites","Strong customer service skills","Excellent problem-solving skills","Knowledge of health and safety regulations","HVAC certification preferred but not essential"]',
   '["Medical, Dental, Vision Insurance","401K","Life/AD&D/LTD","Competitive Compensation","Paid Vacation/Sick/Holidays"]',
   datetime('now', '+60 days'), 'active', 0, 0, datetime('now'), datetime('now'));

-- -----------------------------------------------
-- Hays Electrical Services — Job 9 of 9
-- LinkedIn: 4367321143
-- -----------------------------------------------
INSERT INTO job_listings (id, company_id, posted_by, title, description, trade_category, employment_type, experience_level, salary_min, salary_max, salary_period, city, state, is_remote, requirements, benefits, application_deadline, status, is_featured, views_count, created_at, updated_at) VALUES
  ('job_hays_prefab_009', 'comp_hays_001', 'employer_hays_001',
   'Electrical Apprentice Pre Fab',
   'With over 19 years of experience and 100+ million-dollar projects completed, Hays Electrical Services provides excellent service to customers in industries like hospitality/multifamily, commercial, and solar. We are expanding our staff and seeking Licensed Apprentice Electricians to join the Hays Team in Houston, TX.

We are seeking motivated and skilled Electricians to join our team. The ideal candidate will have minimum 2 years of experience in commercial, multi-family, and hospitality projects. This is an excellent opportunity to gain hands-on experience and develop your skills in a fast-paced and dynamic environment.

Duties: Comply with regulations to ensure a safe working environment. Maintain accurate records of work performed, including time spent, materials used, and tasks completed. Stay updated on industry trends, advancements, and best practices to continuously improve technical skills.',
   'electrician', 'full_time', 'entry', NULL, NULL, NULL, 'Houston', 'TX', 0,
   '["Apprentice Electrical License","Valid OSHA 10 certification","Previous experience in commercial, multi-family, and hospitality projects preferred","Knowledge of electrical codes, regulations, and safety guidelines","Ability to read and interpret blueprints, diagrams, and technical drawings","Strong problem-solving skills and attention to detail","Excellent communication and teamwork abilities","Physical stamina for manual labor and lifting heavy objects","Reliable and punctual with strong work ethic","Willing to travel","Reliable transportation"]',
   '["Stable employment with 19-year-old company","Tons of steady work","401K Program (company matches)","Medical, Dental, Vision, and Life insurance","Career advancement opportunities"]',
   datetime('now', '+90 days'), 'active', 1, 0, datetime('now'), datetime('now'));


-- =============================================
-- DONE! Summary:
-- - 1 admin account (Mahmud Asrul)
-- - 3 employer accounts
-- - 3 companies (Enterprise Electrical, Unify Energy Solutions, Hays Electrical Services)
-- - 9 job listings (3 Enterprise, 5 Unify, 1 Hays)
-- =============================================
