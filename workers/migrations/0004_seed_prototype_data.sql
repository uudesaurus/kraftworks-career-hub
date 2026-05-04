-- Prototype Seed Data for Kraftworks Career Hub
-- Seeds companies, job listings, job applications, waitlist entries, and contact submissions

-- ==========================================
-- SEED USERS (simulated employer and graduate users)
-- ==========================================
INSERT OR IGNORE INTO users (id, email, full_name, created_at, updated_at) VALUES
  ('seed_employer_sparks', 'hr@sparkselec.com', 'Jake Patterson', datetime('now', '-30 days'), datetime('now', '-30 days')),
  ('seed_employer_summit', 'careers@summithvac.com', 'Maria Chen', datetime('now', '-25 days'), datetime('now', '-25 days')),
  ('seed_employer_ironedge', 'jobs@ironedgeweld.com', 'Tom Rivera', datetime('now', '-20 days'), datetime('now', '-20 days')),
  ('seed_employer_buildright', 'talent@buildrightco.com', 'Angela Foster', datetime('now', '-18 days'), datetime('now', '-18 days')),
  ('seed_employer_pipemaster', 'apply@pipemasterpro.com', 'Derek Nguyen', datetime('now', '-15 days'), datetime('now', '-15 days')),
  ('seed_grad_mike', 'mike.johnson@email.com', 'Mike Johnson', datetime('now', '-14 days'), datetime('now', '-14 days')),
  ('seed_grad_sarah', 'sarah.williams@email.com', 'Sarah Williams', datetime('now', '-12 days'), datetime('now', '-12 days')),
  ('seed_grad_james', 'james.brown@email.com', 'James Brown', datetime('now', '-10 days'), datetime('now', '-10 days'));

-- Employer roles
INSERT OR IGNORE INTO user_roles (user_id, role, granted_at) VALUES
  ('seed_employer_sparks', 'employer', datetime('now', '-30 days')),
  ('seed_employer_summit', 'employer', datetime('now', '-25 days')),
  ('seed_employer_ironedge', 'employer', datetime('now', '-20 days')),
  ('seed_employer_buildright', 'employer', datetime('now', '-18 days')),
  ('seed_employer_pipemaster', 'employer', datetime('now', '-15 days'));

-- User roles for graduates
INSERT OR IGNORE INTO user_roles (user_id, role, granted_at) VALUES
  ('seed_grad_mike', 'user', datetime('now', '-14 days')),
  ('seed_grad_sarah', 'user', datetime('now', '-12 days')),
  ('seed_grad_james', 'user', datetime('now', '-10 days'));

-- ==========================================
-- SEED COMPANIES
-- ==========================================
INSERT OR IGNORE INTO companies (id, user_id, company_name, company_email, company_phone, company_website, industry, company_size, description, city, state, is_partner, is_verified, status, created_at, updated_at) VALUES
  ('comp_sparks_001', 'seed_employer_sparks', 'Sparks Electrical Services', 'hr@sparkselec.com', '(555) 101-2001', 'https://sparkselec.example.com', 'Electrical', '51-200', 'Leading electrical contractor serving residential and commercial clients across the Southeast. Over 25 years of experience delivering safe, reliable electrical installations and maintenance.', 'Atlanta', 'GA', 1, 1, 'active', datetime('now', '-30 days'), datetime('now', '-30 days')),
  ('comp_summit_002', 'seed_employer_summit', 'Summit HVAC Solutions', 'careers@summithvac.com', '(555) 202-3002', 'https://summithvac.example.com', 'HVAC', '11-50', 'Full-service HVAC company specializing in energy-efficient heating, ventilation, and air conditioning for commercial properties. EPA-certified technicians with a focus on green solutions.', 'Dallas', 'TX', 1, 1, 'active', datetime('now', '-25 days'), datetime('now', '-25 days')),
  ('comp_ironedge_003', 'seed_employer_ironedge', 'IronEdge Welding Co.', 'jobs@ironedgeweld.com', '(555) 303-4003', 'https://ironedgeweld.example.com', 'Welding & Fabrication', '11-50', 'Precision welding and custom metal fabrication for industrial clients. AWS-certified shop offering MIG, TIG, and stick welding services. Known for quality structural steel work.', 'Houston', 'TX', 0, 1, 'active', datetime('now', '-20 days'), datetime('now', '-20 days')),
  ('comp_buildright_004', 'seed_employer_buildright', 'BuildRight Construction', 'talent@buildrightco.com', '(555) 404-5004', 'https://buildrightco.example.com', 'General Construction', '201-500', 'Multi-trade construction firm handling projects from ground-up builds to renovations. Strong apprenticeship program with pathways into specialized trades.', 'Phoenix', 'AZ', 1, 1, 'active', datetime('now', '-18 days'), datetime('now', '-18 days')),
  ('comp_pipemaster_005', 'seed_employer_pipemaster', 'PipeMaster Plumbing Pro', 'apply@pipemasterpro.com', '(555) 505-6005', NULL, 'Plumbing', '1-10', 'Growing plumbing company looking for motivated apprentices and journeymen. Residential and light commercial work with competitive pay and benefits.', 'Orlando', 'FL', 0, 0, 'pending_review', datetime('now', '-15 days'), datetime('now', '-15 days'));

-- ==========================================
-- SEED JOB LISTINGS (12 jobs across all trades)
-- ==========================================

-- Sparks Electrical (3 jobs)
INSERT OR IGNORE INTO job_listings (id, company_id, posted_by, title, description, trade_category, employment_type, experience_level, salary_min, salary_max, salary_period, city, state, is_remote, requirements, benefits, application_deadline, status, is_featured, views_count, created_at, updated_at) VALUES
  ('job_elec_001', 'comp_sparks_001', 'seed_employer_sparks', 'Electrical Apprentice', 'Join our team as an Electrical Apprentice and gain hands-on experience in residential and commercial wiring. You will work alongside licensed electricians, learning NEC code compliance, conduit bending, panel installations, and troubleshooting. Great opportunity for recent trade school graduates.', 'electrician', 'apprenticeship', 'entry', 18, 24, 'hourly', 'Atlanta', 'GA', 0, '["Valid state driver''s license","Willingness to learn and follow safety protocols","Basic hand tool knowledge","Trade school diploma or equivalent preferred","Ability to lift 50 lbs and work on ladders"]', '["Health and dental insurance","401(k) with company match","Paid apprenticeship training","Tool allowance","Annual safety boot stipend"]', datetime('now', '+60 days'), 'active', 1, 245, datetime('now', '-28 days'), datetime('now', '-28 days')),

  ('job_elec_002', 'comp_sparks_001', 'seed_employer_sparks', 'Licensed Journeyman Electrician', 'Seeking a licensed Journeyman Electrician for a mix of residential and commercial projects. Must have strong knowledge of NEC code, experience with 3-phase systems, and excellent troubleshooting skills. Lead small teams on service calls and installations.', 'electrician', 'full_time', 'mid', 28, 38, 'hourly', 'Atlanta', 'GA', 0, '["Journeyman Electrician License (GA)","3+ years field experience","NEC code compliance knowledge","Experience with residential and commercial systems","Valid driver''s license and clean driving record"]', '["Competitive hourly pay","Company vehicle provided","Health, dental, and vision insurance","Paid time off","Overtime opportunities"]', datetime('now', '+45 days'), 'active', 0, 189, datetime('now', '-20 days'), datetime('now', '-20 days')),

  ('job_elec_003', 'comp_sparks_001', 'seed_employer_sparks', 'Master Electrician - Project Lead', 'Lead electrical projects from planning through completion. Oversee apprentices and journeymen, manage material lists, coordinate with general contractors, and ensure all work meets code. This senior role combines technical expertise with leadership.', 'electrician', 'full_time', 'senior', 75000, 95000, 'yearly', 'Atlanta', 'GA', 0, '["Master Electrician License (GA)","7+ years commercial experience","Project management experience","Blueprint reading and estimation","Strong communication and leadership skills"]', '["Salary plus performance bonuses","Company truck and fuel card","Comprehensive benefits package","Retirement plan with match","Professional development budget"]', datetime('now', '+30 days'), 'active', 1, 312, datetime('now', '-15 days'), datetime('now', '-15 days'));

-- Summit HVAC (3 jobs)
INSERT OR IGNORE INTO job_listings (id, company_id, posted_by, title, description, trade_category, employment_type, experience_level, salary_min, salary_max, salary_period, city, state, is_remote, requirements, benefits, application_deadline, status, is_featured, views_count, created_at, updated_at) VALUES
  ('job_hvac_001', 'comp_summit_002', 'seed_employer_summit', 'HVAC Apprentice Technician', 'Entry-level position for a motivated HVAC apprentice. Learn installation, maintenance, and repair of heating and cooling systems under experienced technicians. EPA 608 certification support provided. Great training environment for trade school grads.', 'hvac', 'apprenticeship', 'entry', 17, 22, 'hourly', 'Dallas', 'TX', 0, '["High school diploma or GED","Trade school coursework in HVAC preferred","Basic mechanical aptitude","Ability to work in varied weather conditions","Reliable transportation"]', '["Paid training program","EPA 608 certification sponsorship","Health insurance after 90 days","Tool kit provided for apprentices","Career advancement pathway"]', datetime('now', '+90 days'), 'active', 1, 178, datetime('now', '-22 days'), datetime('now', '-22 days')),

  ('job_hvac_002', 'comp_summit_002', 'seed_employer_summit', 'HVAC Service Technician', 'Diagnose and repair commercial HVAC systems including rooftop units, split systems, and VRF units. Perform preventive maintenance, handle refrigerant recovery, and provide excellent customer service. Must hold EPA 608 Universal certification.', 'hvac', 'full_time', 'mid', 25, 35, 'hourly', 'Dallas', 'TX', 0, '["EPA 608 Universal Certification","2+ years commercial HVAC experience","Experience with RTUs and split systems","Strong diagnostic skills","Clean driving record"]', '["Competitive pay with overtime","Company service van","Full benefits package","Ongoing training and certifications","Performance bonuses"]', datetime('now', '+60 days'), 'active', 0, 156, datetime('now', '-18 days'), datetime('now', '-18 days')),

  ('job_hvac_003', 'comp_summit_002', 'seed_employer_summit', 'HVAC Controls Specialist (Contract)', 'Contract position for an experienced HVAC controls technician. Program and commission DDC/BAS systems for a large commercial retrofit project. Strong knowledge of Tridium Niagara, BACnet, and building automation required.', 'hvac', 'contract', 'senior', 45, 60, 'hourly', 'Dallas', 'TX', 0, '["5+ years DDC/BAS programming experience","Tridium Niagara certification preferred","BACnet protocol expertise","Low voltage wiring experience","Project documentation skills"]', '["Premium contract rate","Flexible schedule","Long-term contract (6-12 months)","Per diem for travel"]', datetime('now', '+30 days'), 'active', 0, 97, datetime('now', '-10 days'), datetime('now', '-10 days'));

-- IronEdge Welding (2 jobs)
INSERT OR IGNORE INTO job_listings (id, company_id, posted_by, title, description, trade_category, employment_type, experience_level, salary_min, salary_max, salary_period, city, state, is_remote, requirements, benefits, application_deadline, status, is_featured, views_count, created_at, updated_at) VALUES
  ('job_weld_001', 'comp_ironedge_003', 'seed_employer_ironedge', 'Entry-Level Welder / Fabricator', 'Looking for a motivated welder to join our fabrication shop. You will perform MIG and TIG welding on structural steel and aluminum components. Read blueprints, operate grinding and cutting equipment, and assist senior welders on large projects.', 'welding', 'full_time', 'entry', 19, 25, 'hourly', 'Houston', 'TX', 0, '["Welding certificate or trade school diploma","Basic MIG and TIG proficiency","Blueprint reading ability","Safety-conscious mindset","Ability to pass weld test on hire"]', '["Health insurance","Weekly pay","Steel-toed boots provided","Growth into certified welder roles","Overtime available"]', datetime('now', '+45 days'), 'active', 0, 134, datetime('now', '-16 days'), datetime('now', '-16 days')),

  ('job_weld_002', 'comp_ironedge_003', 'seed_employer_ironedge', 'AWS Certified Structural Welder', 'Experienced structural welder needed for industrial and infrastructure projects. Must hold AWS D1.1 certification and be proficient in SMAW and FCAW processes. Work on bridges, buildings, and heavy equipment.', 'welding', 'full_time', 'mid', 30, 42, 'hourly', 'Houston', 'TX', 0, '["AWS D1.1 Structural Welding Certification","3+ years structural welding experience","SMAW and FCAW proficiency","Ability to weld in all positions","OSHA 10 or 30 preferred"]', '["Top-tier hourly pay","Per diem on travel jobs","Health, dental, and vision","Retirement plan","Welding supply allowance"]', datetime('now', '+60 days'), 'active', 1, 201, datetime('now', '-12 days'), datetime('now', '-12 days'));

-- BuildRight Construction (2 jobs)
INSERT OR IGNORE INTO job_listings (id, company_id, posted_by, title, description, trade_category, employment_type, experience_level, salary_min, salary_max, salary_period, city, state, is_remote, requirements, benefits, application_deadline, status, is_featured, views_count, created_at, updated_at) VALUES
  ('job_carp_001', 'comp_buildright_004', 'seed_employer_buildright', 'Carpentry Apprentice', 'Hands-on apprenticeship in residential framing, finish carpentry, and cabinet installation. Work on new construction and renovation projects under master carpenters. Learn to read blueprints, measure accurately, and use power tools safely.', 'carpentry', 'apprenticeship', 'entry', 16, 20, 'hourly', 'Phoenix', 'AZ', 0, '["Interest in carpentry and woodworking","Physical fitness and stamina","Basic math skills","Willingness to learn","Own transportation to job sites"]', '["Paid on-the-job training","Tool belt and basic tools provided","Health insurance","Path to journeyman certification","Annual raises based on skill progression"]', datetime('now', '+90 days'), 'active', 0, 167, datetime('now', '-14 days'), datetime('now', '-14 days')),

  ('job_gen_001', 'comp_buildright_004', 'seed_employer_buildright', 'General Trades Helper', 'Assist various trade crews on an active construction site. Rotate between carpentry, electrical, plumbing, and HVAC teams to gain broad exposure. Ideal for someone exploring which trade to specialize in.', 'general', 'part_time', 'entry', 15, 18, 'hourly', 'Phoenix', 'AZ', 0, '["High school diploma or GED","Physical ability to lift and carry materials","Positive attitude and reliability","Interest in the construction trades","OSHA 10 preferred but not required"]', '["Flexible schedule","Exposure to multiple trades","Free PPE provided","Mentorship from skilled tradespeople"]', datetime('now', '+120 days'), 'active', 0, 89, datetime('now', '-8 days'), datetime('now', '-8 days'));

-- PipeMaster Plumbing (2 jobs)
INSERT OR IGNORE INTO job_listings (id, company_id, posted_by, title, description, trade_category, employment_type, experience_level, salary_min, salary_max, salary_period, city, state, is_remote, requirements, benefits, application_deadline, status, is_featured, views_count, created_at, updated_at) VALUES
  ('job_plumb_001', 'comp_pipemaster_005', 'seed_employer_pipemaster', 'Plumbing Apprentice', 'Learn residential plumbing from the ground up. Install and repair water supply lines, drainage systems, and fixtures. Great mentorship and hands-on learning environment.', 'plumbing', 'apprenticeship', 'entry', 16, 21, 'hourly', 'Orlando', 'FL', 0, '["Trade school plumbing coursework preferred","Valid driver''s license","Physical fitness","Eagerness to learn","Drug-free workplace compliance"]', '["Paid apprenticeship","Tools provided during training","Health insurance after probation","License exam prep support"]', datetime('now', '+75 days'), 'draft', 0, 45, datetime('now', '-6 days'), datetime('now', '-6 days')),

  ('job_plumb_002', 'comp_pipemaster_005', 'seed_employer_pipemaster', 'Licensed Plumber - Residential', 'Experienced residential plumber needed for service calls, new construction rough-ins, and fixture installations. Must hold a valid Florida plumbing license and provide excellent customer service.', 'plumbing', 'full_time', 'mid', 24, 34, 'hourly', 'Orlando', 'FL', 0, '["Florida Journeyman or Master Plumber License","2+ years residential experience","Knowledge of Florida plumbing code","Customer-facing communication skills","Own basic hand tools"]', '["Competitive hourly rate","Company truck after 90 days","Health and dental insurance","Paid holidays","Referral bonuses"]', datetime('now', '+45 days'), 'draft', 0, 32, datetime('now', '-5 days'), datetime('now', '-5 days'));

-- ==========================================
-- SEED RESUMES (for graduate users)
-- ==========================================
INSERT OR IGNORE INTO resumes (id, user_id, file_name, file_path, file_size, file_hash, trade_program, is_active, created_at, updated_at) VALUES
  ('resume_mike_001', 'seed_grad_mike', 'Mike_Johnson_Resume.pdf', 'seed_grad_mike/resume_mike_001/Mike_Johnson_Resume.pdf', 185320, 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', 'electrician', 1, datetime('now', '-13 days'), datetime('now', '-13 days')),
  ('resume_sarah_001', 'seed_grad_sarah', 'Sarah_Williams_CV.pdf', 'seed_grad_sarah/resume_sarah_001/Sarah_Williams_CV.pdf', 210450, 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3', 'hvac', 1, datetime('now', '-11 days'), datetime('now', '-11 days')),
  ('resume_james_001', 'seed_grad_james', 'James_Brown_Resume.pdf', 'seed_grad_james/resume_james_001/James_Brown_Resume.pdf', 175200, 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', 'welding', 1, datetime('now', '-9 days'), datetime('now', '-9 days'));

-- ==========================================
-- SEED RESUME FEEDBACK (various statuses)
-- ==========================================

-- Mike's feedback - approved
INSERT OR IGNORE INTO resume_feedback (id, user_id, resume_id, resume_hash, status, overall_score, strengths, improvements, suggestions, trade_suggestions, actionable_steps, model_name, reviewed_by, reviewed_at, created_at, updated_at) VALUES
  ('fb_mike_001', 'seed_grad_mike', 'resume_mike_001', 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
   'approved', 7,
   '["Strong hands-on electrical experience from trade school labs","OSHA 10 certification prominently listed","Clear chronological format easy to scan","Includes relevant coursework in NEC code compliance"]',
   '["Missing specific project examples or accomplishments","No mention of soft skills like teamwork or communication","Contact information formatting needs improvement","Education section lacks GPA or honors"]',
   '["Add 2-3 specific project descriptions with measurable outcomes","Include a brief professional summary at the top","List software skills like AutoCAD Electrical or Bluebeam","Add references or ''Available upon request'' line"]',
   '["Highlight conduit bending and panel wiring experience","Mention familiarity with residential vs commercial wiring","Include any solar or renewable energy coursework","Note experience with multimeters and testing equipment"]',
   '["Rewrite your resume summary to target entry-level electrician roles","Add numbers: hours of lab time, projects completed, team sizes","Get a peer review from your trade school career center","Create a LinkedIn profile and add the URL to your resume header"]',
   'google/gemini-2.0-flash-001',
   'user_3BhZpQjH0GAk9oWdJwnFHqv4DYl', datetime('now', '-8 days'),
   datetime('now', '-12 days'), datetime('now', '-8 days'));

-- Sarah's feedback - pending review
INSERT OR IGNORE INTO resume_feedback (id, user_id, resume_id, resume_hash, status, overall_score, strengths, improvements, suggestions, trade_suggestions, actionable_steps, model_name, created_at, updated_at) VALUES
  ('fb_sarah_001', 'seed_grad_sarah', 'resume_sarah_001', 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
   'pending_review', 6,
   '["EPA 608 certification clearly highlighted","Relevant internship experience included","Good use of action verbs","Professional email address and formatting"]',
   '["Resume is slightly too long at 2 pages for entry level","Some job descriptions are too vague","Missing skills section for software and tools","Internship dates do not specify months"]',
   '["Condense to a single page for entry-level positions","Quantify achievements where possible","Add a dedicated Technical Skills section","Include month and year for all experience dates"]',
   '["Emphasize EPA 608 Universal certification prominently","Detail experience with specific HVAC brands and systems","Mention comfort with refrigerant handling and recovery","Include any energy audit or building performance training"]',
   '["Cut resume to one page by removing outdated experience","Use the STAR method to rewrite each bullet point","Add technical skills: R-410A, ductwork sizing, load calculations","Ask an HVAC instructor to review before submitting applications"]',
   'google/gemini-2.0-flash-001',
   datetime('now', '-10 days'), datetime('now', '-10 days'));

-- James's feedback - rejected (needs revision)
INSERT OR IGNORE INTO resume_feedback (id, user_id, resume_id, resume_hash, status, overall_score, strengths, improvements, suggestions, trade_suggestions, actionable_steps, model_name, reviewed_by, reviewed_at, rejection_reason, created_at, updated_at) VALUES
  ('fb_james_001', 'seed_grad_james', 'resume_james_001', 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
   'rejected', 3,
   '["Shows genuine interest in welding as a career"]',
   '["Resume is a single paragraph with no structure","No certifications or training mentioned","Contains multiple spelling and grammar errors","No contact information provided"]',
   '["Use a standard resume template with clear sections","Proofread carefully or use a grammar checker","Add all certifications, even in-progress ones","Include full contact details at the top"]',
   '["List any AWS certifications or weld tests passed","Specify welding processes learned: MIG, TIG, SMAW, FCAW","Include types of metals worked with","Mention any fabrication or blueprint reading training"]',
   '["Download a free professional resume template","Have someone proofread your resume before resubmitting","List all welding certifications and training hours","Visit your school''s career services office for a resume workshop"]',
   'google/gemini-2.0-flash-001',
   'user_3BhZpQjH0GAk9oWdJwnFHqv4DYl', datetime('now', '-7 days'),
   'Resume lacks basic formatting and required sections. Please restructure using a standard resume template and resubmit.',
   datetime('now', '-9 days'), datetime('now', '-7 days'));

-- ==========================================
-- SEED AI USAGE
-- ==========================================
INSERT OR IGNORE INTO ai_usage (id, user_id, action_type, input_hash, model_name, created_at) VALUES
  ('usage_mike_001', 'seed_grad_mike', 'resume_feedback', 'seed_hash_mike_fb', 'google/gemini-2.0-flash-001', datetime('now', '-12 days')),
  ('usage_sarah_001', 'seed_grad_sarah', 'resume_feedback', 'seed_hash_sarah_fb', 'google/gemini-2.0-flash-001', datetime('now', '-10 days')),
  ('usage_james_001', 'seed_grad_james', 'resume_feedback', 'seed_hash_james_fb', 'google/gemini-2.0-flash-001', datetime('now', '-9 days'));

-- ==========================================
-- SEED JOB APPLICATIONS
-- ==========================================
INSERT OR IGNORE INTO job_applications (id, job_id, user_id, resume_id, cover_letter, status, employer_notes, created_at, updated_at) VALUES
  -- Mike applied to 3 electrical jobs
  ('app_mike_001', 'job_elec_001', 'seed_grad_mike', 'resume_mike_001', 'I am a recent graduate from Atlanta Technical College with hands-on experience in residential wiring and a strong foundation in NEC code compliance. I am eager to start my career as an electrical apprentice at Sparks Electrical.', 'shortlisted', 'Strong candidate - trade school background matches our needs. Schedule interview.', datetime('now', '-11 days'), datetime('now', '-9 days')),
  ('app_mike_002', 'job_elec_002', 'seed_grad_mike', 'resume_mike_001', NULL, 'submitted', NULL, datetime('now', '-10 days'), datetime('now', '-10 days')),
  ('app_mike_003', 'job_gen_001', 'seed_grad_mike', 'resume_mike_001', 'While my focus is electrical, I am interested in gaining broader construction experience.', 'reviewed', 'Entry-level applicant. Solid resume but may be overqualified for helper role.', datetime('now', '-8 days'), datetime('now', '-7 days')),

  -- Sarah applied to 2 HVAC jobs
  ('app_sarah_001', 'job_hvac_001', 'seed_grad_sarah', 'resume_sarah_001', 'As a recent HVAC program graduate with EPA 608 certification and an internship under my belt, I am excited about the apprentice technician position at Summit HVAC Solutions.', 'interview', 'Great candidate. EPA certified. Set up ride-along interview for next week.', datetime('now', '-9 days'), datetime('now', '-6 days')),
  ('app_sarah_002', 'job_hvac_002', 'seed_grad_sarah', 'resume_sarah_001', NULL, 'rejected', 'Need more experience for this mid-level role. Recommended apprentice position instead.', datetime('now', '-8 days'), datetime('now', '-5 days')),

  -- James applied to 2 welding jobs
  ('app_james_001', 'job_weld_001', 'seed_grad_james', 'resume_james_001', 'I completed my welding program at Houston Community College and am ready to start my career in fabrication. I have experience with MIG and TIG processes from my coursework.', 'submitted', NULL, datetime('now', '-7 days'), datetime('now', '-7 days')),
  ('app_james_002', 'job_carp_001', 'seed_grad_james', 'resume_james_001', 'I am also interested in carpentry and want to explore this trade.', 'withdrawn', NULL, datetime('now', '-6 days'), datetime('now', '-4 days'));

-- ==========================================
-- SEED TRADE GRAD WAITLIST
-- ==========================================
INSERT OR IGNORE INTO trade_grad_waitlist (id, full_name, email, trade_program, state, city, consent, created_at) VALUES
  ('wl_tg_001', 'Carlos Hernandez', 'carlos.h@email.com', 'Electrician', 'TX', 'San Antonio', 1, datetime('now', '-45 days')),
  ('wl_tg_002', 'Brianna Taylor', 'b.taylor@email.com', 'HVAC', 'FL', 'Tampa', 1, datetime('now', '-40 days')),
  ('wl_tg_003', 'Deshawn Mitchell', 'deshawn.m@email.com', 'Welding', 'GA', 'Savannah', 1, datetime('now', '-35 days')),
  ('wl_tg_004', 'Emily Nguyen', 'e.nguyen@email.com', 'Plumbing', 'AZ', 'Tucson', 1, datetime('now', '-30 days')),
  ('wl_tg_005', 'Robert Kim', 'r.kim@email.com', 'Electrician', 'CA', 'Sacramento', 1, datetime('now', '-25 days')),
  ('wl_tg_006', 'Ashley Cooper', 'a.cooper@email.com', 'HVAC', 'TX', 'Austin', 1, datetime('now', '-20 days')),
  ('wl_tg_007', 'Marcus Williams', 'marcus.w@email.com', 'Carpentry', 'NC', 'Charlotte', 1, datetime('now', '-15 days'));

-- ==========================================
-- SEED EMPLOYER WAITLIST
-- ==========================================
INSERT OR IGNORE INTO employer_waitlist (id, full_name, company_email, job_title, trades_hiring_for, hiring_volume, state, city, consent, created_at) VALUES
  ('wl_emp_001', 'Lisa Reynolds', 'lisa@voltageelectric.com', 'HR Manager', 'Electrician, General', '5-10', 'IL', 'Chicago', 1, datetime('now', '-42 days')),
  ('wl_emp_002', 'Brian O''Connor', 'brian@coolairservices.com', 'Operations Director', 'HVAC', '3-5', 'FL', 'Jacksonville', 1, datetime('now', '-38 days')),
  ('wl_emp_003', 'Yuki Tanaka', 'yuki@precisionweld.com', 'Shop Manager', 'Welding', '1-3', 'OH', 'Cleveland', 1, datetime('now', '-33 days')),
  ('wl_emp_004', 'Patricia Adams', 'padams@metroplumb.com', 'Recruiting Lead', 'Plumbing, HVAC', '10+', 'NY', 'Buffalo', 1, datetime('now', '-28 days')),
  ('wl_emp_005', 'David Chen', 'dchen@tradeforce.com', 'VP of Talent', 'Electrician, HVAC, Welding, Plumbing', '20+', 'TX', 'Dallas', 1, datetime('now', '-22 days'));

-- ==========================================
-- SEED CONTACT SUBMISSIONS
-- ==========================================
INSERT OR IGNORE INTO contact_submissions (id, full_name, email, subject, message, status, created_at) VALUES
  ('contact_001', 'Jennifer Lopez', 'jlopez@email.com', 'Partnership Inquiry', 'Hi, I represent a technical college in Georgia and we are interested in partnering with Kraftworks to connect our graduates with employers. Can we schedule a call to discuss?', 'new', datetime('now', '-20 days')),
  ('contact_002', 'Ahmed Hassan', 'ahmed.h@email.com', 'Feature Request', 'Would it be possible to add a skills assessment feature? I think trade school grads would benefit from being able to showcase their hands-on competencies beyond a resume.', 'in_progress', datetime('now', '-15 days')),
  ('contact_003', 'Rachel Kim', 'rachel.k@email.com', 'Bug Report', 'I tried uploading my resume in DOCX format and got an error. I see it says PDF only, but it would be great if you supported other formats too.', 'resolved', datetime('now', '-10 days')),
  ('contact_004', 'Tony Martinez', 'tony.m@email.com', 'General Question', 'How long does it typically take for resume feedback to come back? I submitted mine two days ago and it still says pending.', 'new', datetime('now', '-5 days'));

-- ==========================================
-- SEED AUDIT LOG (for admin actions already taken)
-- ==========================================
INSERT OR IGNORE INTO admin_audit_log (id, actor_user_id, entity_type, entity_id, action, before_json, after_json, created_at) VALUES
  ('audit_001', 'user_3BhZpQjH0GAk9oWdJwnFHqv4DYl', 'resume_feedback', 'fb_mike_001', 'approve', '{"status":"pending_review"}', '{"status":"approved"}', datetime('now', '-8 days')),
  ('audit_002', 'user_3BhZpQjH0GAk9oWdJwnFHqv4DYl', 'resume_feedback', 'fb_james_001', 'reject', '{"status":"pending_review"}', '{"status":"rejected","rejection_reason":"Resume lacks basic formatting and required sections."}', datetime('now', '-7 days')),
  ('audit_003', 'user_3BhZpQjH0GAk9oWdJwnFHqv4DYl', 'contact_submission', 'contact_003', 'update_status', '{"status":"new"}', '{"status":"resolved"}', datetime('now', '-9 days')),
  ('audit_004', 'user_3BhZpQjH0GAk9oWdJwnFHqv4DYl', 'contact_submission', 'contact_002', 'update_status', '{"status":"new"}', '{"status":"in_progress"}', datetime('now', '-12 days')),
  ('audit_005', 'user_3BhZpQjH0GAk9oWdJwnFHqv4DYl', 'company', 'comp_sparks_001', 'approve_company', '{"status":"pending_review"}', '{"status":"active"}', datetime('now', '-29 days')),
  ('audit_006', 'user_3BhZpQjH0GAk9oWdJwnFHqv4DYl', 'company', 'comp_summit_002', 'approve_company', '{"status":"pending_review"}', '{"status":"active"}', datetime('now', '-24 days'));
