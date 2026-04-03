/**
 * SEED SCRIPT — Club Deportivo PWA
 * Crea usuarios, academia y datos de prueba en todos los módulos.
 *
 * Uso:
 *   cd server
 *   node ../supabase/seed/seed.js
 *
 * Requiere: server/.env con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const PASSWORD = 'Admin123456';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg) { console.log(`  ✓ ${msg}`); }
function section(msg) { console.log(`\n── ${msg}`); }

async function createAuthUser(email, name) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error && !error.message.includes('already registered')) throw new Error(`createUser ${email}: ${error.message}`);
  if (error) {
    // already exists, fetch it
    const { data: { users } } = await supabase.auth.admin.listUsers();
    return users.find(u => u.email === email);
  }
  return data.user;
}

async function upsertProfile(authUserId, fields) {
  const existing = await supabase.from('profiles').select('id').eq('auth_user_id', authUserId).maybeSingle();
  if (existing.data) return existing.data;

  const { data, error } = await supabase
    .from('profiles')
    .insert({ auth_user_id: authUserId, status: 'active', ...fields })
    .select()
    .single();
  if (error) throw new Error(`upsertProfile: ${error.message}`);
  return data;
}

async function findOrCreate(table, matchFields, insertFields) {
  const query = Object.entries(matchFields).reduce(
    (q, [k, v]) => q.eq(k, v),
    supabase.from(table).select('*')
  );
  const { data: existing } = await query.maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase.from(table).insert(insertFields ?? matchFields).select().single();
  if (error) throw new Error(`findOrCreate ${table}: ${error.message}`);
  return data;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Club Deportivo PWA — Seed iniciado\n');

  // ══════════════════════════════════════════════════════════════════════════
  // 1. USUARIOS AUTH + PERFILES
  // ══════════════════════════════════════════════════════════════════════════
  section('Creando usuarios Auth...');

  const authUsers = {};
  const userDefs = [
    { key: 'superAdmin', email: 'superadmin@clubdeportivo.com', first_name: 'Super', last_name: 'Admin' },
    { key: 'owner', email: 'owner@clubdeportivo.com', first_name: 'Carlos', last_name: 'Propietario' },
    { key: 'admin', email: 'admin@clubdeportivo.com', first_name: 'Ana', last_name: 'Administradora' },
    { key: 'finance', email: 'finanzas@clubdeportivo.com', first_name: 'Luis', last_name: 'Finanzas' },
    { key: 'collections', email: 'cobranzas@clubdeportivo.com', first_name: 'María', last_name: 'Cobranzas' },
    { key: 'coach', email: 'coach@clubdeportivo.com', first_name: 'Pedro', last_name: 'Entrenador' },
    { key: 'staff', email: 'staff@clubdeportivo.com', first_name: 'Sofía', last_name: 'Staff' },
    { key: 'guardian', email: 'tutor@clubdeportivo.com', first_name: 'Roberto', last_name: 'Tutor' },
    { key: 'athleteUser', email: 'atleta@clubdeportivo.com', first_name: 'Javier', last_name: 'Atleta' },
  ];

  for (const def of userDefs) {
    const u = await createAuthUser(def.email, `${def.first_name} ${def.last_name}`);
    authUsers[def.key] = u;
    log(`Auth user: ${def.email}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 2. PERFILES
  // ══════════════════════════════════════════════════════════════════════════
  section('Creando perfiles...');

  const profiles = {};
  for (const def of userDefs) {
    profiles[def.key] = await upsertProfile(authUsers[def.key].id, {
      email: def.email,
      first_name: def.first_name,
      last_name: def.last_name,
      phone: '+58-412-555-0001',
    });
    log(`Perfil: ${def.first_name} ${def.last_name}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. ROL DE PLATAFORMA (super_admin)
  // ══════════════════════════════════════════════════════════════════════════
  section('Asignando rol super_admin...');

  const { data: platformRole } = await supabase.from('platform_roles').select('id').eq('code', 'super_admin').single();
  await findOrCreate(
    'profile_platform_roles',
    { profile_id: profiles.superAdmin.id, platform_role_id: platformRole.id },
  );
  log('super_admin asignado a superadmin@clubdeportivo.com');

  // ══════════════════════════════════════════════════════════════════════════
  // 4. ACADEMIA
  // ══════════════════════════════════════════════════════════════════════════
  section('Creando academia...');

  const academy = await findOrCreate(
    'academies',
    { slug: 'academia-deportiva-caracas' },
    {
      name: 'Academia Deportiva Caracas',
      slug: 'academia-deportiva-caracas',
      sport_type: 'Fútbol',
      country: 'Venezuela',
      currency_code: 'USD',
      timezone: 'America/Caracas',
      status: 'active',
      owner_profile_id: profiles.owner.id,
    }
  );
  log(`Academia: ${academy.name} (${academy.id})`);

  // Settings de academia
  await supabase.from('academy_settings').upsert({
    academy_id: academy.id,
    payment_due_day: 10,
    late_fee_amount: 5,
    allow_partial_payments: false,
    notification_days_before_due: 5,
    default_currency: 'USD',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'academy_id' });
  log('Settings de academia configurados');

  // ══════════════════════════════════════════════════════════════════════════
  // 5. MEMBRESÍAS
  // ══════════════════════════════════════════════════════════════════════════
  section('Creando membresías...');

  const membershipDefs = [
    { key: 'owner', role: 'academy_owner' },
    { key: 'admin', role: 'academy_admin' },
    { key: 'finance', role: 'finance_manager' },
    { key: 'collections', role: 'collections_manager' },
    { key: 'coach', role: 'coach' },
    { key: 'staff', role: 'staff' },
    { key: 'guardian', role: 'guardian' },
    { key: 'athleteUser', role: 'athlete' },
  ];

  const memberships = {};
  for (const def of membershipDefs) {
    const existing = await supabase.from('academy_memberships')
      .select('id').eq('academy_id', academy.id).eq('profile_id', profiles[def.key].id).maybeSingle();

    if (!existing.data) {
      const { data } = await supabase.from('academy_memberships').insert({
        academy_id: academy.id,
        profile_id: profiles[def.key].id,
        role_code: def.role,
        status: 'active',
        joined_at: new Date().toISOString(),
      }).select().single();
      memberships[def.key] = data;
    } else {
      memberships[def.key] = existing.data;
    }
    log(`Membresía: ${def.role} → ${def.key}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 6. CATEGORÍAS
  // ══════════════════════════════════════════════════════════════════════════
  section('Creando categorías...');

  const catDefs = [
    { name: 'Sub-10', age_min: 7, age_max: 10, sort_order: 1 },
    { name: 'Sub-12', age_min: 11, age_max: 12, sort_order: 2 },
    { name: 'Sub-15', age_min: 13, age_max: 15, sort_order: 3 },
    { name: 'Sub-18', age_min: 16, age_max: 18, sort_order: 4 },
  ];

  const categories = {};
  for (const def of catDefs) {
    const cat = await findOrCreate(
      'categories',
      { academy_id: academy.id, name: def.name },
      { academy_id: academy.id, ...def, status: 'active', created_by: profiles.admin.id }
    );
    categories[def.name] = cat;
    log(`Categoría: ${cat.name}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 7. CUOTAS POR CATEGORÍA
  // ══════════════════════════════════════════════════════════════════════════
  section('Creando cuotas...');

  const feeDefs = [
    { cat: 'Sub-10', amount: 30 },
    { cat: 'Sub-12', amount: 35 },
    { cat: 'Sub-15', amount: 40 },
    { cat: 'Sub-18', amount: 45 },
  ];

  const feeVersions = {};
  for (const def of feeDefs) {
    const existing = await supabase.from('category_fee_versions')
      .select('id').eq('category_id', categories[def.cat].id).eq('is_active', true).maybeSingle();

    if (!existing.data) {
      const { data } = await supabase.from('category_fee_versions').insert({
        academy_id: academy.id,
        category_id: categories[def.cat].id,
        amount: def.amount,
        currency_code: 'USD',
        effective_from: '2026-01-01',
        is_active: true,
        created_by: profiles.admin.id,
      }).select().single();
      feeVersions[def.cat] = data;
    } else {
      feeVersions[def.cat] = existing.data;
    }
    log(`Cuota ${def.cat}: $${def.amount}/mes`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 8. ATLETAS
  // ══════════════════════════════════════════════════════════════════════════
  section('Creando atletas...');

  const athleteDefs = [
    { first_name: 'Javier', last_name: 'Martínez', birth_date: '2016-03-15', gender: 'male', cat: 'Sub-10', doc: 'V-28001001' },
    { first_name: 'Valentina', last_name: 'López', birth_date: '2015-07-22', gender: 'female', cat: 'Sub-10', doc: 'V-28001002' },
    { first_name: 'Diego', last_name: 'Ramírez', birth_date: '2014-11-05', gender: 'male', cat: 'Sub-12', doc: 'V-28001003' },
    { first_name: 'Camila', last_name: 'Torres', birth_date: '2013-02-18', gender: 'female', cat: 'Sub-12', doc: 'V-28001004' },
    { first_name: 'Sebastián', last_name: 'González', birth_date: '2012-08-30', gender: 'male', cat: 'Sub-15', doc: 'V-28001005' },
    { first_name: 'Isabella', last_name: 'Hernández', birth_date: '2011-04-12', gender: 'female', cat: 'Sub-15', doc: 'V-28001006' },
    { first_name: 'Mateo', last_name: 'Díaz', birth_date: '2010-09-25', gender: 'male', cat: 'Sub-18', doc: 'V-28001007' },
    { first_name: 'Lucía', last_name: 'Vargas', birth_date: '2009-01-08', gender: 'female', cat: 'Sub-18', doc: 'V-28001008' },
  ];

  const athletes = {};
  const enrollments = {};

  for (const def of athleteDefs) {
    // Create athlete
    let athlete = (await supabase.from('athletes').select('id').eq('document_number', def.doc).maybeSingle()).data;
    if (!athlete) {
      const { data } = await supabase.from('athletes').insert({
        first_name: def.first_name,
        last_name: def.last_name,
        birth_date: def.birth_date,
        gender: def.gender,
        document_number: def.doc,
        created_by: profiles.admin.id,
      }).select().single();
      athlete = data;
    }
    athletes[def.doc] = athlete;

    // Create enrollment
    let enrollment = (await supabase.from('athlete_academy_enrollments')
      .select('id').eq('academy_id', academy.id).eq('athlete_id', athlete.id).maybeSingle()).data;

    if (!enrollment) {
      const { data } = await supabase.from('athlete_academy_enrollments').insert({
        academy_id: academy.id,
        athlete_id: athlete.id,
        category_id: categories[def.cat].id,
        membership_status: 'active',
        joined_at: '2026-01-01',
        medical_clearance_status: 'approved',
        can_train: true,
        created_by: profiles.admin.id,
      }).select().single();
      enrollment = data;
    }
    enrollments[def.doc] = enrollment;
    log(`Atleta: ${def.first_name} ${def.last_name} (${def.cat})`);
  }

  // Vincular atleta Javier con usuario atleta@clubdeportivo.com
  await findOrCreate(
    'athlete_user_links',
    { athlete_id: athletes['V-28001001'].id, profile_id: profiles.athleteUser.id },
  );
  log('Link: atleta@clubdeportivo.com ↔ Javier Martínez');

  // Vincular tutors/guardian con Javier y Valentina
  await findOrCreate(
    'guardian_links',
    { guardian_profile_id: profiles.guardian.id, athlete_id: athletes['V-28001001'].id },
    { guardian_profile_id: profiles.guardian.id, athlete_id: athletes['V-28001001'].id, relationship_type: 'parent', is_primary: true }
  );
  await findOrCreate(
    'guardian_links',
    { guardian_profile_id: profiles.guardian.id, athlete_id: athletes['V-28001002'].id },
    { guardian_profile_id: profiles.guardian.id, athlete_id: athletes['V-28001002'].id, relationship_type: 'parent', is_primary: true }
  );
  log('Tutor vinculado a Javier y Valentina');

  // ══════════════════════════════════════════════════════════════════════════
  // 9. GRUPOS Y SESIONES DE ENTRENAMIENTO
  // ══════════════════════════════════════════════════════════════════════════
  section('Creando entrenamientos...');

  const groupDefs = [
    { name: 'Grupo Sub-10 Lunes/Miércoles', cat: 'Sub-10', location: 'Campo Norte' },
    { name: 'Grupo Sub-12 Martes/Jueves', cat: 'Sub-12', location: 'Campo Sur' },
    { name: 'Grupo Sub-15/18 Mixto', cat: 'Sub-15', location: 'Cancha Principal' },
  ];

  const groups = {};
  for (const def of groupDefs) {
    const g = await findOrCreate(
      'training_groups',
      { academy_id: academy.id, name: def.name },
      { academy_id: academy.id, name: def.name, category_id: categories[def.cat].id, location: def.location, status: 'active', created_by: profiles.coach.id }
    );
    groups[def.name] = g;
    log(`Grupo: ${def.name}`);
  }

  // Sesiones de los últimos 2 meses + próximas
  const sessionDefs = [
    // Sesiones pasadas (completadas)
    { group: 'Grupo Sub-10 Lunes/Miércoles', date: '2026-02-02', start: '16:00', end: '17:30', status: 'completed' },
    { group: 'Grupo Sub-10 Lunes/Miércoles', date: '2026-02-04', start: '16:00', end: '17:30', status: 'completed' },
    { group: 'Grupo Sub-12 Martes/Jueves', date: '2026-02-03', start: '17:00', end: '18:30', status: 'completed' },
    { group: 'Grupo Sub-12 Martes/Jueves', date: '2026-02-10', start: '17:00', end: '18:30', status: 'cancelled', reason: 'Lluvia intensa' },
    { group: 'Grupo Sub-15/18 Mixto', date: '2026-03-03', start: '18:00', end: '20:00', status: 'completed' },
    { group: 'Grupo Sub-15/18 Mixto', date: '2026-03-10', start: '18:00', end: '20:00', status: 'completed' },
    // Sesiones futuras (scheduled)
    { group: 'Grupo Sub-10 Lunes/Miércoles', date: '2026-04-07', start: '16:00', end: '17:30', status: 'scheduled' },
    { group: 'Grupo Sub-10 Lunes/Miércoles', date: '2026-04-09', start: '16:00', end: '17:30', status: 'scheduled' },
    { group: 'Grupo Sub-12 Martes/Jueves', date: '2026-04-08', start: '17:00', end: '18:30', status: 'scheduled' },
    { group: 'Grupo Sub-15/18 Mixto', date: '2026-04-07', start: '18:00', end: '20:00', status: 'scheduled' },
  ];

  const sessions = [];
  for (const def of sessionDefs) {
    const s = await findOrCreate(
      'training_sessions',
      { academy_id: academy.id, training_group_id: groups[def.group].id, session_date: def.date },
      {
        academy_id: academy.id,
        training_group_id: groups[def.group].id,
        title: `Entrenamiento ${def.date}`,
        session_date: def.date,
        start_time: def.start,
        end_time: def.end,
        is_enabled: def.status !== 'cancelled',
        cancellation_reason: def.reason || null,
        status: def.status,
        created_by: profiles.coach.id,
      }
    );
    sessions.push({ ...s, _group: def.group });
    log(`Sesión: ${def.date} (${def.status})`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 10. ASISTENCIA
  // ══════════════════════════════════════════════════════════════════════════
  section('Registrando asistencia...');

  const completedSessions = sessions.filter(s => s.status === 'completed');
  // Para sesiones Sub-10 completadas → Javier y Valentina
  const sub10Enrollments = [enrollments['V-28001001'], enrollments['V-28001002']];
  const sub12Enrollments = [enrollments['V-28001003'], enrollments['V-28001004']];
  const sub1518Enrollments = [enrollments['V-28001005'], enrollments['V-28001006'], enrollments['V-28001007'], enrollments['V-28001008']];

  const attendanceMap = {
    'Grupo Sub-10 Lunes/Miércoles': sub10Enrollments,
    'Grupo Sub-12 Martes/Jueves': sub12Enrollments,
    'Grupo Sub-15/18 Mixto': sub1518Enrollments,
  };

  const attendanceStatuses = ['present', 'present', 'present', 'absent', 'late'];

  for (const session of completedSessions) {
    const groupEnrollments = attendanceMap[session._group] || [];
    for (let i = 0; i < groupEnrollments.length; i++) {
      const enr = groupEnrollments[i];
      const existing = await supabase.from('attendance_records')
        .select('id').eq('training_session_id', session.id).eq('athlete_enrollment_id', enr.id).maybeSingle();
      if (!existing.data) {
        await supabase.from('attendance_records').insert({
          academy_id: academy.id,
          training_session_id: session.id,
          athlete_enrollment_id: enr.id,
          attendance_status: attendanceStatuses[i % attendanceStatuses.length],
          recorded_by: profiles.coach.id,
          recorded_at: new Date().toISOString(),
        });
      }
    }
    log(`Asistencia registrada: sesión ${session.session_date}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 11. PERÍODOS DE PAGO
  // ══════════════════════════════════════════════════════════════════════════
  section('Generando períodos de pago...');

  const allEnrollments = Object.values(enrollments);
  const periods = {};

  // Enero, Febrero, Marzo 2026 para todos
  const monthDefs = [
    { year: 2026, month: 1, dueDay: '10', defaultStatus: 'confirmed' },
    { year: 2026, month: 2, dueDay: '10', defaultStatus: 'confirmed' },
    { year: 2026, month: 3, dueDay: '10', defaultStatus: 'pending' },
  ];

  for (const md of monthDefs) {
    for (const enr of allEnrollments) {
      const existing = await supabase.from('payment_periods')
        .select('id').eq('academy_id', academy.id).eq('athlete_enrollment_id', enr.id)
        .eq('period_year', md.year).eq('period_month', md.month).maybeSingle();

      if (!existing.data) {
        // Get fee for this enrollment's category
        const { data: feeRow } = await supabase.from('category_fee_versions')
          .select('amount').eq('category_id', enr.category_id).eq('is_active', true).maybeSingle();
        const fee = feeRow?.amount || 30;
        const monthStr = String(md.month).padStart(2, '0');
        const dueDate = `${md.year}-${monthStr}-${md.dueDay}`;

        const { data: period } = await supabase.from('payment_periods').insert({
          academy_id: academy.id,
          athlete_enrollment_id: enr.id,
          category_id: enr.category_id,
          period_year: md.year,
          period_month: md.month,
          fee_amount: fee,
          discount_amount: 0,
          surcharge_amount: 0,
          total_due: fee,
          due_date: dueDate,
          status: md.defaultStatus,
          generated_by: profiles.finance.id,
          generated_at: new Date().toISOString(),
        }).select().single();

        if (!periods[`${md.year}-${md.month}`]) periods[`${md.year}-${md.month}`] = [];
        periods[`${md.year}-${md.month}`].push(period);
      }
    }
    log(`Períodos ${md.year}-${String(md.month).padStart(2, '0')}: ${allEnrollments.length} atletas`);
  }

  // Hacer algunos de Marzo overdue (due_date pasada)
  await supabase.from('payment_periods')
    .update({ status: 'overdue', due_date: '2026-03-10' })
    .eq('academy_id', academy.id)
    .eq('period_year', 2026)
    .eq('period_month', 3)
    .in('athlete_enrollment_id', [
      enrollments['V-28001003'].id,
      enrollments['V-28001004'].id,
      enrollments['V-28001005'].id,
    ]);
  log('3 períodos de Marzo marcados como overdue');

  // 1 período en under_review
  const { data: underReviewPeriod } = await supabase.from('payment_periods')
    .select('id')
    .eq('academy_id', academy.id)
    .eq('period_year', 2026)
    .eq('period_month', 3)
    .eq('athlete_enrollment_id', enrollments['V-28001001'].id)
    .maybeSingle();

  if (underReviewPeriod) {
    await supabase.from('payment_periods').update({ status: 'under_review' }).eq('id', underReviewPeriod.id);
    log('Período Javier Marzo: under_review');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 12. REPORTES DE PAGO
  // ══════════════════════════════════════════════════════════════════════════
  section('Creando reportes de pago...');

  // Reporte confirmado (Enero, Javier)
  const eneroJavier = await supabase.from('payment_periods')
    .select('id, total_due').eq('academy_id', academy.id)
    .eq('period_year', 2026).eq('period_month', 1)
    .eq('athlete_enrollment_id', enrollments['V-28001001'].id).maybeSingle();

  if (eneroJavier.data) {
    const existingReport = await supabase.from('payment_reports')
      .select('id').eq('payment_period_id', eneroJavier.data.id).maybeSingle();
    if (!existingReport.data) {
      const { data: report } = await supabase.from('payment_reports').insert({
        academy_id: academy.id,
        payment_period_id: eneroJavier.data.id,
        reported_by_profile_id: profiles.guardian.id,
        amount_reported: eneroJavier.data.total_due,
        payment_method: 'Transferencia bancaria',
        reference_number: 'TRF-20260105-001',
        payment_date: '2026-01-05',
        status: 'confirmed',
        reviewed_by: profiles.finance.id,
        reviewed_at: new Date('2026-01-06').toISOString(),
        review_notes: 'Pago verificado correctamente.',
      }).select().single();
      await supabase.from('payment_report_events').insert([
        { payment_report_id: report.id, event_type: 'submitted', event_by: profiles.guardian.id, notes: null },
        { payment_report_id: report.id, event_type: 'confirmed', event_by: profiles.finance.id, notes: 'Pago verificado.' },
      ]);
      log('Reporte confirmado: Javier - Enero');
    }
  }

  // Reporte submitted (Marzo, Javier — under_review)
  if (underReviewPeriod) {
    const existingReport = await supabase.from('payment_reports')
      .select('id').eq('payment_period_id', underReviewPeriod.id).maybeSingle();
    if (!existingReport.data) {
      const { data: report } = await supabase.from('payment_reports').insert({
        academy_id: academy.id,
        payment_period_id: underReviewPeriod.id,
        reported_by_profile_id: profiles.guardian.id,
        amount_reported: 30,
        payment_method: 'Pago móvil',
        reference_number: 'PM-20260328-555',
        payment_date: '2026-03-28',
        status: 'submitted',
      }).select().single();
      await supabase.from('payment_report_events').insert({
        payment_report_id: report.id, event_type: 'submitted', event_by: profiles.guardian.id, notes: null,
      });
      log('Reporte submitted: Javier - Marzo');
    }
  }

  // Reporte rechazado (Febrero, Diego)
  const febreroD = await supabase.from('payment_periods')
    .select('id, total_due').eq('academy_id', academy.id)
    .eq('period_year', 2026).eq('period_month', 2)
    .eq('athlete_enrollment_id', enrollments['V-28001003'].id).maybeSingle();

  if (febreroD.data) {
    const existingReport = await supabase.from('payment_reports')
      .select('id').eq('payment_period_id', febreroD.data.id).maybeSingle();
    if (!existingReport.data) {
      const { data: report } = await supabase.from('payment_reports').insert({
        academy_id: academy.id,
        payment_period_id: febreroD.data.id,
        reported_by_profile_id: profiles.athleteUser.id,
        amount_reported: 20,
        payment_method: 'Efectivo',
        reference_number: null,
        payment_date: '2026-02-15',
        status: 'rejected',
        reviewed_by: profiles.finance.id,
        reviewed_at: new Date('2026-02-16').toISOString(),
        review_notes: 'El monto no corresponde a la cuota completa.',
      }).select().single();
      await supabase.from('payment_report_events').insert([
        { payment_report_id: report.id, event_type: 'submitted', event_by: profiles.athleteUser.id, notes: null },
        { payment_report_id: report.id, event_type: 'rejected', event_by: profiles.finance.id, notes: 'Monto incompleto.' },
      ]);
      log('Reporte rechazado: Diego - Febrero');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 13. CATEGORÍAS DE GASTOS E INGRESOS
  // ══════════════════════════════════════════════════════════════════════════
  section('Creando categorías de gastos e ingresos...');

  const expCatDefs = [
    { name: 'Equipamiento deportivo', type: 'operational' },
    { name: 'Transporte', type: 'operational' },
    { name: 'Alimentación', type: 'operational' },
    { name: 'Inscripciones y licencias', type: 'tournament' },
    { name: 'Mantenimiento de instalaciones', type: 'operational' },
    { name: 'Material médico', type: 'operational' },
  ];

  const expCats = {};
  for (const def of expCatDefs) {
    const cat = await findOrCreate(
      'expense_categories',
      { academy_id: academy.id, name: def.name },
      { academy_id: academy.id, name: def.name, type: def.type, status: 'active' }
    );
    expCats[def.name] = cat;
  }
  log(`${expCatDefs.length} categorías de gastos`);

  const incCatDefs = [
    { name: 'Patrocinio', type: 'sponsorship' },
    { name: 'Eventos especiales', type: 'event' },
    { name: 'Donaciones', type: 'donation' },
  ];

  const incCats = {};
  for (const def of incCatDefs) {
    const cat = await findOrCreate(
      'income_categories',
      { academy_id: academy.id, name: def.name },
      { academy_id: academy.id, name: def.name, type: def.type, status: 'active' }
    );
    incCats[def.name] = cat;
  }
  log(`${incCatDefs.length} categorías de ingresos`);

  // ══════════════════════════════════════════════════════════════════════════
  // 14. GASTOS
  // ══════════════════════════════════════════════════════════════════════════
  section('Registrando gastos...');

  const expenseDefs = [
    { title: 'Balones de fútbol x10', cat: 'Equipamiento deportivo', date: '2026-01-15', amount: 250, method: 'Transferencia', status: 'confirmed' },
    { title: 'Conos y petos entrenamiento', cat: 'Equipamiento deportivo', date: '2026-01-20', amount: 80, method: 'Efectivo', status: 'confirmed' },
    { title: 'Bus alquiler Sub-10 torneo', cat: 'Transporte', date: '2026-02-10', amount: 120, method: 'Transferencia', status: 'confirmed' },
    { title: 'Refrigerios torneo febrero', cat: 'Alimentación', date: '2026-02-11', amount: 95, method: 'Efectivo', status: 'confirmed' },
    { title: 'Inscripción Liga Regional', cat: 'Inscripciones y licencias', date: '2026-02-01', amount: 300, method: 'Transferencia', status: 'confirmed' },
    { title: 'Pintura cancha principal', cat: 'Mantenimiento de instalaciones', date: '2026-03-05', amount: 180, method: 'Efectivo', status: 'confirmed' },
    { title: 'Botiquín y vendajes', cat: 'Material médico', date: '2026-03-12', amount: 45, method: 'Efectivo', status: 'confirmed' },
    { title: 'Uniformes Sub-15 nuevos', cat: 'Equipamiento deportivo', date: '2026-03-20', amount: 420, method: 'Transferencia', status: 'draft' },
    { title: 'Transporte Copa Primavera', cat: 'Transporte', date: '2026-04-05', amount: 200, method: 'Transferencia', status: 'draft' },
  ];

  for (const def of expenseDefs) {
    const existing = await supabase.from('expenses').select('id').eq('academy_id', academy.id).eq('title', def.title).maybeSingle();
    if (!existing.data) {
      await supabase.from('expenses').insert({
        academy_id: academy.id,
        category_id: expCats[def.cat]?.id || null,
        title: def.title,
        expense_date: def.date,
        amount: def.amount,
        currency_code: 'USD',
        payment_method: def.method,
        status: def.status,
        created_by: profiles.finance.id,
      });
    }
    log(`Gasto: ${def.title} ($${def.amount})`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 15. INGRESOS EXTRA
  // ══════════════════════════════════════════════════════════════════════════
  section('Registrando ingresos extra...');

  const incomeDefs = [
    { title: 'Patrocinio Empresas Locales Q1', cat: 'Patrocinio', date: '2026-01-10', amount: 500, status: 'confirmed' },
    { title: 'Torneo benéfico febrero', cat: 'Eventos especiales', date: '2026-02-22', amount: 350, status: 'confirmed' },
    { title: 'Donación Club Hermano', cat: 'Donaciones', date: '2026-03-01', amount: 200, status: 'confirmed' },
    { title: 'Patrocinio Copa Primavera', cat: 'Patrocinio', date: '2026-04-01', amount: 800, status: 'draft' },
  ];

  for (const def of incomeDefs) {
    const existing = await supabase.from('extra_incomes').select('id').eq('academy_id', academy.id).eq('title', def.title).maybeSingle();
    if (!existing.data) {
      await supabase.from('extra_incomes').insert({
        academy_id: academy.id,
        category_id: incCats[def.cat]?.id || null,
        title: def.title,
        income_date: def.date,
        amount: def.amount,
        currency_code: 'USD',
        status: def.status,
        created_by: profiles.finance.id,
      });
    }
    log(`Ingreso: ${def.title} ($${def.amount})`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 16. TORNEOS
  // ══════════════════════════════════════════════════════════════════════════
  section('Creando torneos...');

  const tournament1 = await findOrCreate(
    'tournaments',
    { academy_id: academy.id, name: 'Copa Interescolar Febrero 2026' },
    {
      academy_id: academy.id,
      name: 'Copa Interescolar Febrero 2026',
      description: 'Torneo interescolar nivel regional, categorías Sub-10 y Sub-12.',
      location: 'Estadio Municipal Los Laureles',
      start_date: '2026-02-14',
      end_date: '2026-02-16',
      status: 'finished',
      expected_cost: 500,
      expected_income: 200,
      created_by: profiles.coach.id,
    }
  );
  log(`Torneo: ${tournament1.name} (finished)`);

  const tournament2 = await findOrCreate(
    'tournaments',
    { academy_id: academy.id, name: 'Copa Primavera Abril 2026' },
    {
      academy_id: academy.id,
      name: 'Copa Primavera Abril 2026',
      description: 'Gran torneo regional de primavera. Todas las categorías.',
      location: 'Complejo Deportivo Sur',
      start_date: '2026-04-18',
      end_date: '2026-04-20',
      status: 'callup_launched',
      expected_cost: 1200,
      expected_income: 600,
      created_by: profiles.coach.id,
    }
  );
  log(`Torneo: ${tournament2.name} (callup_launched)`);

  const tournament3 = await findOrCreate(
    'tournaments',
    { academy_id: academy.id, name: 'Liga Interna Verano 2026' },
    {
      academy_id: academy.id,
      name: 'Liga Interna Verano 2026',
      description: 'Liga interna de verano, solo atletas de la academia.',
      location: 'Cancha Principal',
      start_date: '2026-06-01',
      end_date: '2026-06-30',
      status: 'planned',
      expected_cost: 300,
      expected_income: 0,
      created_by: profiles.coach.id,
    }
  );
  log(`Torneo: ${tournament3.name} (planned)`);

  // Vincular gastos del torneo febrero al tournament1
  await supabase.from('expenses').update({ tournament_id: tournament1.id })
    .eq('academy_id', academy.id)
    .in('title', ['Bus alquiler Sub-10 torneo', 'Refrigerios torneo febrero', 'Inscripción Liga Regional']);

  // Vincular gastos del torneo Copa Primavera al tournament2
  await supabase.from('expenses').update({ tournament_id: tournament2.id })
    .eq('academy_id', academy.id)
    .eq('title', 'Transporte Copa Primavera');

  await supabase.from('extra_incomes').update({ tournament_id: tournament2.id })
    .eq('academy_id', academy.id)
    .eq('title', 'Patrocinio Copa Primavera');

  log('Gastos e ingresos vinculados a torneos');

  // ══════════════════════════════════════════════════════════════════════════
  // 17. CONVOCATORIAS
  // ══════════════════════════════════════════════════════════════════════════
  section('Creando convocatorias...');

  // Torneo 1 (finished) — todos los Sub-10 y Sub-12, estados variados
  const callupEnrollments1 = [
    enrollments['V-28001001'], enrollments['V-28001002'],
    enrollments['V-28001003'], enrollments['V-28001004'],
  ];
  const callupStatuses1 = ['accepted', 'accepted', 'accepted', 'declined'];

  for (let i = 0; i < callupEnrollments1.length; i++) {
    const enr = callupEnrollments1[i];
    await findOrCreate(
      'tournament_callups',
      { tournament_id: tournament1.id, athlete_enrollment_id: enr.id },
      {
        academy_id: academy.id,
        tournament_id: tournament1.id,
        athlete_enrollment_id: enr.id,
        status: callupStatuses1[i],
        responded_at: new Date('2026-02-10').toISOString(),
        response_notes: callupStatuses1[i] === 'declined' ? 'No puede asistir por motivos familiares.' : null,
      }
    );
  }
  log(`Convocatorias torneo 1: ${callupEnrollments1.length} atletas`);

  // Torneo 2 (callup_launched) — Sub-15 y Sub-18, algunos pendientes
  const callupEnrollments2 = [
    enrollments['V-28001005'], enrollments['V-28001006'],
    enrollments['V-28001007'], enrollments['V-28001008'],
    enrollments['V-28001001'], enrollments['V-28001002'],
  ];
  const callupStatuses2 = ['accepted', 'pending', 'pending', 'accepted', 'pending', 'declined'];

  for (let i = 0; i < callupEnrollments2.length; i++) {
    const enr = callupEnrollments2[i];
    const st = callupStatuses2[i];
    await findOrCreate(
      'tournament_callups',
      { tournament_id: tournament2.id, athlete_enrollment_id: enr.id },
      {
        academy_id: academy.id,
        tournament_id: tournament2.id,
        athlete_enrollment_id: enr.id,
        status: st,
        responded_at: st !== 'pending' ? new Date('2026-04-03').toISOString() : null,
      }
    );
  }
  log(`Convocatorias torneo 2: ${callupEnrollments2.length} atletas`);

  // ══════════════════════════════════════════════════════════════════════════
  // 18. NOTIFICACIONES
  // ══════════════════════════════════════════════════════════════════════════
  section('Creando notificaciones...');

  const notifDefs = [
    { profile: 'guardian', type: 'payment_reminder', title: 'Recordatorio de pago', body: 'Tienes un pago pendiente de $30 con vencimiento 2026-03-10.' },
    { profile: 'athleteUser', type: 'callup', title: 'Convocatoria: Copa Primavera', body: 'Has sido convocado para la Copa Primavera Abril 2026. Responde antes del 10 de abril.' },
    { profile: 'guardian', type: 'payment_rejected', title: 'Pago rechazado', body: 'Tu reporte de pago de febrero fue rechazado. El monto no corresponde a la cuota completa.' },
    { profile: 'admin', type: 'new_payment_report', title: 'Nuevo aviso de pago', body: 'Javier Martínez ha reportado un pago para Marzo 2026.' },
    { profile: 'coach', type: 'session_reminder', title: 'Sesión mañana: Sub-10', body: 'Recuerda que mañana hay sesión a las 16:00 en Campo Norte.' },
    { profile: 'athleteUser', type: 'general', title: 'Bienvenido a la plataforma', body: 'Tu cuenta ha sido activada correctamente. ¡Bienvenido a Academia Deportiva Caracas!' },
  ];

  for (const def of notifDefs) {
    const existing = await supabase.from('notifications')
      .select('id').eq('profile_id', profiles[def.profile].id).eq('title', def.title).maybeSingle();
    if (!existing.data) {
      await supabase.from('notifications').insert({
        academy_id: academy.id,
        profile_id: profiles[def.profile].id,
        type: def.type,
        title: def.title,
        body: def.body,
        is_read: false,
        sent_at: new Date().toISOString(),
      });
    }
    log(`Notificación → ${def.profile}: ${def.title}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RESUMEN FINAL
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('  ✅  SEED COMPLETADO');
  console.log('═'.repeat(60));
  console.log('\n  Usuarios de prueba (password: Admin123456)\n');
  console.log('  Rol               | Email');
  console.log('  ─────────────────────────────────────────────');
  for (const def of userDefs) {
    const label = def.key.padEnd(16);
    console.log(`  ${label} | ${def.email}`);
  }
  console.log('\n  Academia: Academia Deportiva Caracas');
  console.log(`  ID: ${academy.id}\n`);
}

main().catch((err) => {
  console.error('\n❌ SEED FALLÓ:', err.message);
  process.exit(1);
});
