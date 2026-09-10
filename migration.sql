BEGIN;

CREATE TABLE IF NOT EXISTS learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner user_profile NOT NULL,
  word_key varchar(160) NOT NULL,
  chapter_id integer NOT NULL,
  stage integer NOT NULL DEFAULT 0,
  status varchar(32) NOT NULL DEFAULT 'learning',
  correct_count integer NOT NULL DEFAULT 0,
  wrong_count integer NOT NULL DEFAULT 0,
  last_rating varchar(24),
  last_reviewed_at TIMESTAMP(3) WITH TIME ZONE,
  next_review_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by user_profile DEFAULT (
    CASE
      WHEN current_setting('app.user_id', TRUE) = '' THEN NULL
      ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile
    END
  ),
  _updated_at TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by user_profile DEFAULT (
    CASE
      WHEN current_setting('app.user_id', TRUE) = '' THEN NULL
      ELSE concat('(', current_setting('app.user_id', TRUE), ')')::user_profile
    END
  )
);

ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_bypass_policy ON learning_progress
  TO service_role USING (true);
CREATE POLICY "修改全部数据" ON learning_progress
  AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "查看全部数据" ON learning_progress
  AS PERMISSIVE FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "修改本人数据" ON learning_progress
  AS PERMISSIVE FOR ALL TO authenticated USING (
    (current_setting('app.user_id'::text) = ANY (ARRAY[]::text[]))
    AND (current_setting('app.user_id'::text) = ((_created_by).user_id)::text)
  );

CREATE UNIQUE INDEX IF NOT EXISTS uk_learning_progress_learner_word
  ON learning_progress (((learner).user_id), word_key);
CREATE INDEX IF NOT EXISTS idx_learning_progress_due
  ON learning_progress (((learner).user_id), next_review_at);

COMMIT;
