-- End-to-end business-flow test. Runs entirely inside one DO block that ends by
-- raising an exception, so every change is rolled back. Safe to run against the
-- linked project:  npx supabase db query --linked -f supabase/tests/business_flows.sql
-- Success shows the error text "ALL_FLOWS_PASSED (n checks)".
do $$
declare
  emp uuid := gen_random_uuid(); emp2 uuid := gen_random_uuid(); cand uuid := gen_random_uuid(); cand2 uuid := gen_random_uuid(); adm uuid := gen_random_uuid();
  area uuid; job uuid; job2 uuid; app uuid; w record; n int; ok boolean; checks int := 0; t text;
begin
  select id into area from public.areas where taluk = 'Kolar' and active and verified limit 1;

  insert into auth.users(id, instance_id, aud, role, email, encrypted_password, raw_user_meta_data, raw_app_meta_data, created_at, updated_at) values
    (emp,  '00000000-0000-0000-0000-000000000000','authenticated','authenticated','t-emp@jik.test','', '{"role":"employer","full_name":"Test Employer","phone":"9876543210","company_name":"Test Works"}','{}',now(),now()),
    (emp2, '00000000-0000-0000-0000-000000000000','authenticated','authenticated','t-emp2@jik.test','', '{"role":"employer","full_name":"Other Employer","company_name":"Other Co"}','{}',now(),now()),
    (cand, '00000000-0000-0000-0000-000000000000','authenticated','authenticated','t-cand@jik.test','', '{"role":"candidate","full_name":"Ravi Kumar","phone":"9123456780"}','{}',now(),now()),
    (cand2,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','t-cand2@jik.test','', '{"role":"candidate","full_name":"Asha Rani"}','{}',now(),now()),
    (adm,  '00000000-0000-0000-0000-000000000000','authenticated','authenticated','t-adm@jik.test','', '{"full_name":"Test Admin"}','{}',now(),now());
  update public.profiles set is_admin = true, role = 'admin' where id = adm;

  -- 1. Signup side effects
  assert (select role from public.profiles where id = emp) = 'employer', 'employer profile role'; checks := checks + 1;
  assert exists(select 1 from public.companies where id = emp and name = 'Test Works' and not verified), 'company shell created unverified'; checks := checks + 1;
  select * into w from public.employer_wallets where employer_id = emp;
  assert w.job_credits = 2 and w.unlock_credits = 5, 'free plan credits 2/5'; checks := checks + 1;
  assert (select raw_app_meta_data->>'role' from auth.users where id = emp) = 'employer', 'role claim synced'; checks := checks + 1;
  assert (select raw_app_meta_data->>'role' from auth.users where id = adm) = 'admin', 'admin claim synced'; checks := checks + 1;
  assert (select email_confirmed_at is not null from auth.users where id = cand), 'auto-confirmed'; checks := checks + 1;

  -- 2. Employer posts a job (as employer)
  perform set_config('request.jwt.claims', json_build_object('sub', emp, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  insert into public.jobs(employer_id, title, company_name, category, description, taluk, area_id, salary_min, salary_max, status, screening_questions, featured, views)
    values (emp, 'CNC Operator', 'Test Works', 'Manufacturing', repeat('Operate CNC machines safely. ', 5), 'Kolar', area, 15000, 20000, 'pending_review', '["Can you join in 15 days?"]', true, 999)
    returning id into job;
  -- a draft costs nothing
  insert into public.jobs(employer_id, title, company_name, category, description, taluk, area_id, salary_min, status)
    values (emp, 'Draft Role', 'Test Works', 'Manufacturing', repeat('x', 100), 'Kolar', area, 12000, 'draft') returning id into job2;
  -- employer cannot self-publish
  begin
    update public.jobs set status = 'published' where id = job;
    raise exception 'employer self-publish should fail';
  exception when others then
    if sqlerrm like '%should fail%' then raise; end if;
  end;
  perform set_config('role', 'none', true);
  select * into w from public.employer_wallets where employer_id = emp;
  assert w.job_credits = 1, 'submit consumed exactly one credit (got ' || w.job_credits || ')'; checks := checks + 1;
  assert (select not featured and views = 0 and credit_used and status = 'pending_review' from public.jobs where id = job), 'protected job fields reset on insert'; checks := checks + 1;
  assert (select company_id = emp from public.jobs where id = job), 'company linked'; checks := checks + 1;

  -- 3. Admin rejects then employer resubmits free, admin approves
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  begin
    update public.jobs set status = 'rejected' where id = job;
    raise exception 'reject without reason should fail';
  exception when others then
    if sqlerrm like '%should fail%' then raise; end if;
  end;
  update public.jobs set status = 'rejected', rejection_reason = 'Add shift timings please' where id = job;
  perform set_config('role', 'none', true);
  assert exists(select 1 from public.notifications where user_id = emp and kind = 'job_review' and title = 'Job needs changes'), 'employer told about rejection'; checks := checks + 1;

  perform set_config('request.jwt.claims', json_build_object('sub', emp, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  update public.jobs set status = 'pending_review', description = description || ' Day shift 9-6.' where id = job;
  perform set_config('role', 'none', true);
  assert (select job_credits from public.employer_wallets where employer_id = emp) = 1, 'resubmission is free'; checks := checks + 1;

  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  update public.jobs set status = 'published' where id = job;
  perform set_config('role', 'none', true);
  assert (select status = 'published' and published_at is not null and expires_at > now() + interval '29 days' from public.jobs where id = job), 'published with 30-day expiry'; checks := checks + 1;
  assert exists(select 1 from public.notifications where user_id = emp and title = 'Job approved'), 'employer told about approval'; checks := checks + 1;
  assert exists(select 1 from public.admin_actions where target_id = job and action = 'published'), 'moderation audited'; checks := checks + 1;

  -- 4. Candidate applies
  perform set_config('request.jwt.claims', json_build_object('sub', cand, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  assert (select count(*) from public.jobs where id = job) = 1, 'candidate sees published job'; checks := checks + 1;
  assert (select count(*) from public.jobs where id = job2) = 0, 'candidate cannot see draft'; checks := checks + 1;
  begin
    insert into public.applications(job_id, candidate_id) values (job, cand);
    raise exception 'apply without screening answers should fail';
  exception when others then
    if sqlerrm like '%should fail%' then raise; end if;
  end;
  insert into public.applications(job_id, candidate_id, cover_letter, screening_answers, status)
    values (job, cand, 'Ready to join', '[{"question":"Can you join in 15 days?","answer":"Yes"}]', 'hired') returning id into app;
  begin
    insert into public.applications(job_id, candidate_id, screening_answers) values (job, cand, '[{"question":"q","answer":"a"}]');
    raise exception 'duplicate apply should fail';
  exception when unique_violation then null;
  end;
  begin
    update public.applications set status = 'shortlisted' where id = app;
    raise exception 'candidate self-shortlist should fail';
  exception when others then
    if sqlerrm like '%should fail%' then raise; end if;
  end;
  -- candidate cannot message before employer engages
  begin
    insert into public.messages(application_id, sender_id, body) values (app, cand, 'Hello?');
    raise exception 'early candidate message should fail';
  exception when others then
    if sqlerrm like '%should fail%' then raise; end if;
  end;
  perform set_config('role', 'none', true);
  assert (select status = 'submitted' and employer_id = emp and candidate_snapshot->>'full_name' = 'Ravi Kumar' from public.applications where id = app), 'status forced to submitted + snapshot'; checks := checks + 1;
  assert (select applications_count from public.jobs where id = job) = 1, 'application counter'; checks := checks + 1;
  assert exists(select 1 from public.notifications where user_id = emp and kind = 'new_application'), 'employer notified of application'; checks := checks + 1;

  -- 5. Other employer is isolated
  perform set_config('request.jwt.claims', json_build_object('sub', emp2, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  assert (select count(*) from public.applications where id = app) = 0, 'other employer cannot see application'; checks := checks + 1;
  update public.applications set status = 'rejected' where id = app; -- silently matches 0 rows under RLS
  assert (select count(*) from public.profiles where id = cand) = 0, 'other employer cannot read candidate profile'; checks := checks + 1;
  perform set_config('role', 'none', true);
  assert (select status from public.applications where id = app) = 'submitted', 'other employer could not change status'; checks := checks + 1;

  -- 6. Employer pipeline
  perform set_config('request.jwt.claims', json_build_object('sub', emp, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  update public.applications set viewed_at = now() where id = app;
  assert (select status from public.applications where id = app) = 'reviewing', 'opening moves to reviewing'; checks := checks + 1;
  assert (public.candidate_card(cand)->>'phone') = '9123456780', 'applicant contact visible to employer'; checks := checks + 1;
  update public.applications set status = 'shortlisted' where id = app;
  begin
    update public.applications set status = 'interview' where id = app;
    raise exception 'interview without date should fail';
  exception when others then
    if sqlerrm like '%should fail%' then raise; end if;
  end;
  update public.applications set status = 'interview', interview_at = now() + interval '2 days', interview_mode = 'in_person', interview_location = 'Plant gate 2' where id = app;
  insert into public.application_notes(application_id, author_id, body) values (app, emp, 'Strong on fanuc controls');
  insert into public.messages(application_id, sender_id, body) values (app, emp, 'Please bring your ITI certificate.');
  perform set_config('role', 'none', true);

  perform set_config('request.jwt.claims', json_build_object('sub', cand, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  insert into public.messages(application_id, sender_id, body) values (app, cand, 'Sure, will bring it.');
  assert (select count(*) from public.application_notes where application_id = app) = 0, 'candidate cannot read private notes'; checks := checks + 1;
  assert (select count(*) from public.application_events where application_id = app) >= 4, 'candidate sees timeline'; checks := checks + 1;
  perform set_config('role', 'none', true);
  assert exists(select 1 from public.notifications where user_id = cand and kind = 'interview'), 'candidate notified of interview'; checks := checks + 1;
  assert exists(select 1 from public.notifications where user_id = emp and kind = 'message'), 'employer notified of reply'; checks := checks + 1;

  perform set_config('request.jwt.claims', json_build_object('sub', emp, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  update public.applications set status = 'offered' where id = app;
  update public.applications set status = 'hired' where id = app;
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', json_build_object('sub', cand, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  begin
    update public.applications set status = 'withdrawn' where id = app;
    raise exception 'withdraw after hire should fail';
  exception when others then
    if sqlerrm like '%should fail%' then raise; end if;
  end;
  perform set_config('role', 'none', true);
  assert exists(select 1 from public.notifications where user_id = cand and title = 'You are hired'), 'candidate notified of hire'; checks := checks + 1;

  -- 7. Talent pool: unverified employer cannot unlock; verified can, once
  update public.profiles set current_title = 'Welder', experience_years = 4, taluk = 'Kolar', skills = '{Welding,TIG}' where id = cand2;
  perform set_config('request.jwt.claims', json_build_object('sub', emp, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n from public.search_talent_v2(p_query => 'weld');
  assert n >= 1, 'talent search finds candidate'; checks := checks + 1;
  select display_name into t from public.search_talent_v2(p_query => 'weld') where id = cand2;
  assert t = 'Asha R.', 'name masked before unlock (got ' || coalesce(t,'null') || ')'; checks := checks + 1;
  assert (public.candidate_card(cand2)->>'phone') is null, 'contact hidden before unlock'; checks := checks + 1;
  begin
    perform public.unlock_candidate(cand2);
    raise exception 'unverified unlock should fail';
  exception when others then
    if sqlerrm like '%should fail%' then raise; end if;
  end;
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  update public.companies set verified = true where id = emp;
  assert exists(select 1 from public.notifications where user_id = emp and kind = 'company'), 'employer told about verification'; checks := checks + 1;
  perform set_config('request.jwt.claims', json_build_object('sub', emp, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.unlock_candidate(cand2);
  perform public.unlock_candidate(cand2); -- idempotent
  assert (select unlocked from public.search_talent_v2(p_query => 'weld') where id = cand2), 'unlocked flag'; checks := checks + 1;
  perform set_config('role', 'none', true);
  assert (select unlock_credits from public.employer_wallets where employer_id = emp) = 4, 'one unlock credit consumed'; checks := checks + 1;
  assert exists(select 1 from public.notifications where user_id = cand2 and title = 'An employer viewed your profile'), 'candidate told about unlock'; checks := checks + 1;

  -- 8. Candidate cannot use employer tools
  perform set_config('request.jwt.claims', json_build_object('sub', cand, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  begin
    perform public.search_talent_v2();
    raise exception 'candidate talent search should fail';
  exception when others then
    if sqlerrm like '%should fail%' then raise; end if;
  end;
  begin
    update public.profiles set is_admin = true where id = cand;
    raise exception 'self-promotion should fail';
  exception when others then
    if sqlerrm like '%should fail%' then raise; end if;
  end;
  select count(*) into n from public.employer_wallets;
  assert n = 0, 'candidate cannot read wallets'; checks := checks + 1;
  perform set_config('role', 'none', true);

  -- 9. Out of credits blocks submission; payment grants credits
  update public.employer_wallets set job_credits = 0 where employer_id = emp;
  perform set_config('request.jwt.claims', json_build_object('sub', emp, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  begin
    update public.jobs set status = 'pending_review' where id = job2;
    raise exception 'submit without credits should fail';
  exception when others then
    if sqlerrm like '%should fail%' then raise; end if;
  end;
  perform set_config('role', 'none', true);
  insert into public.payment_orders(id, employer_id, plan_id, amount_inr, gst_inr, total_inr) values (gen_random_uuid(), emp, 'growth', 2499, 450, 2949);
  perform public.apply_paid_order((select id from public.payment_orders where employer_id = emp limit 1), 'pay_test_1');
  perform public.apply_paid_order((select id from public.payment_orders where employer_id = emp limit 1), 'pay_test_1');
  select * into w from public.employer_wallets where employer_id = emp;
  assert w.job_credits = 15 and w.unlock_credits = 154 and w.plan_id = 'growth' and w.expires_at > now() + interval '59 days', 'growth plan applied once (idempotent)'; checks := checks + 1;
  assert (select invoice_no like 'JIK-%' from public.payment_orders where employer_id = emp limit 1), 'invoice number issued'; checks := checks + 1;

  -- 10. Blocked employer cannot post
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  update public.profiles set account_status = 'blocked' where id = emp2;
  perform set_config('request.jwt.claims', json_build_object('sub', emp2, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  begin
    insert into public.jobs(employer_id, title, company_name, category, description, taluk, area_id, salary_min, status)
      values (emp2, 'Blocked', 'Other Co', 'Sales', repeat('y', 100), 'Kolar', area, 10000, 'draft');
    raise exception 'blocked employer insert should fail';
  exception when others then
    if sqlerrm like '%should fail%' then raise; end if;
  end;
  perform set_config('role', 'none', true);

  -- 11. Public stats + directory work anonymously
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
  assert (public.public_stats()->>'live_jobs')::int >= 1, 'public stats'; checks := checks + 1;
  assert exists(select 1 from public.company_directory where id = emp and verified), 'directory shows verified company'; checks := checks + 1;
  assert (select count(*) from public.applications) = 0, 'anon sees no applications'; checks := checks + 1;
  perform set_config('role', 'none', true);

  raise exception 'ALL_FLOWS_PASSED (% checks)', checks;
end $$;
