-- Migration 006: Add coach_profile_id to training_groups
-- Este campo permite vincular un grupo de entrenamiento con un entrenador específico (profile).

ALTER TABLE training_groups 
ADD COLUMN IF NOT EXISTS coach_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
