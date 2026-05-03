import { createClient } from '@supabase/supabase-js';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../../data/inventory.db');

const sqlite = new Database(DB_PATH);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function migrate() {
    console.log('--- Migration to Supabase Started ---');

    // 1. Migrate Analysis Templates
    console.log('Migrating Analysis Templates...');
    const templates = sqlite.prepare('SELECT * FROM analysis_templates').all();
    for (const t of templates) {
        const { error } = await supabase.from('analysis_templates').upsert({
            trait: t.trait,
            level: t.level,
            title: t.title,
            summary: t.summary,
            strengths: JSON.parse(t.strengths || '[]'),
            weaknesses: JSON.parse(t.weaknesses || '[]'),
            work_style: t.work_style,
            recommendations: JSON.parse(t.recommendations || '[]')
        }, { onConflict: 'trait,level' });
        if (error) console.error(`Error migrating template ${t.trait}-${t.level}:`, error.message);
    }

    // 2. Migrate Comparison Templates
    console.log('Migrating Comparison Templates...');
    const comparisons = sqlite.prepare('SELECT * FROM comparison_templates').all();
    for (const c of comparisons) {
        const { error } = await supabase.from('comparison_templates').upsert({
            trait: c.trait,
            type: c.type,
            title: c.title,
            description: c.description,
            synergy: c.synergy,
            potential_conflict: c.potential_conflict
        }, { onConflict: 'trait,type' });
        if (error) console.error(`Error migrating comparison ${c.trait}-${c.type}:`, error.message);
    }

    // 3. Migrate Personnel
    console.log('Migrating Personnel records...');
    const personnel = sqlite.prepare('SELECT * FROM personnel').all();
    for (const p of personnel) {
        const { error } = await supabase.from('personnel').insert({
            name: p.name,
            age: p.age,
            employee_id: p.employee_id,
            department: p.department,
            e_score: p.e_score,
            a_score: p.a_score,
            c_score: p.c_score,
            n_score: p.n_score,
            o_score: p.o_score,
            position: p.position,
            ai_summary: p.ai_summary,
            ai_strengths: JSON.parse(p.ai_strengths || '[]'),
            ai_weaknesses: JSON.parse(p.ai_weaknesses || '[]'),
            ai_work_style: p.ai_work_style,
            ai_stress_behavior: p.ai_stress_behavior,
            ai_job_fit: p.ai_job_fit,
            ai_recommendations: JSON.parse(p.ai_recommendations || '[]'),
            created_at: p.created_at
        });
        if (error) console.error(`Error migrating person ${p.name}:`, error.message);
    }

    console.log('--- Migration Finished Successfully ---');
}

migrate();
