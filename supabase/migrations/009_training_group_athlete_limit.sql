-- Migration to add athlete_limit to training_groups
ALTER TABLE training_groups ADD COLUMN athlete_limit int CHECK (athlete_limit > 0);
