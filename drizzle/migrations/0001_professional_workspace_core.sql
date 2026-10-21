CREATE TABLE public.workspace_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  experience_enrolment_id uuid REFERENCES public.experience_enrolments(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 120),
  purpose text NOT NULL CHECK (char_length(trim(purpose)) BETWEEN 10 AND 1200),
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'real_project' CHECK (source IN ('experience','real_project')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_projects TO authenticated;
GRANT ALL ON public.workspace_projects TO service_role;
ALTER TABLE public.workspace_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage workspace projects" ON public.workspace_projects FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER update_workspace_projects_updated_at BEFORE UPDATE ON public.workspace_projects FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE TABLE public.workspace_observation_preferences (
  project_id uuid PRIMARY KEY REFERENCES public.workspace_projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  changed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.workspace_observation_preferences TO authenticated;
GRANT ALL ON public.workspace_observation_preferences TO service_role;
ALTER TABLE public.workspace_observation_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage observation preferences" ON public.workspace_observation_preferences FOR ALL TO authenticated USING (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.workspace_projects p WHERE p.id = project_id AND p.owner_id = auth.uid())) WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.workspace_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

CREATE TABLE public.workspace_people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.workspace_projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('human','ai_colleague')),
  name text NOT NULL,
  role text NOT NULL,
  remit text NOT NULL,
  accent text NOT NULL DEFAULT 'teal' CHECK (accent IN ('gold','purple','cyan','green','blue','teal')),
  memory jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_people TO authenticated;
GRANT ALL ON public.workspace_people TO service_role;
ALTER TABLE public.workspace_people ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage workspace people" ON public.workspace_people FOR ALL TO authenticated USING (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.workspace_projects p WHERE p.id = project_id AND p.owner_id = auth.uid())) WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.workspace_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

CREATE TABLE public.workspace_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.workspace_projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 180),
  detail text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','blocked','done')),
  assignee_id uuid REFERENCES public.workspace_people(id) ON DELETE SET NULL,
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_tasks TO authenticated;
GRANT ALL ON public.workspace_tasks TO service_role;
ALTER TABLE public.workspace_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage workspace tasks" ON public.workspace_tasks FOR ALL TO authenticated USING (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.workspace_projects p WHERE p.id = project_id AND p.owner_id = auth.uid())) WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.workspace_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE TRIGGER update_workspace_tasks_updated_at BEFORE UPDATE ON public.workspace_tasks FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE TABLE public.workspace_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.workspace_projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 180),
  scheduled_at timestamptz,
  agenda text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','held','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_meetings TO authenticated;
GRANT ALL ON public.workspace_meetings TO service_role;
ALTER TABLE public.workspace_meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage workspace meetings" ON public.workspace_meetings FOR ALL TO authenticated USING (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.workspace_projects p WHERE p.id = project_id AND p.owner_id = auth.uid())) WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.workspace_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE TRIGGER update_workspace_meetings_updated_at BEFORE UPDATE ON public.workspace_meetings FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE TABLE public.workspace_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.workspace_projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 180),
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_option text,
  rationale text NOT NULL DEFAULT '',
  task_id uuid REFERENCES public.workspace_tasks(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','decided','revisited')),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_decisions TO authenticated;
GRANT ALL ON public.workspace_decisions TO service_role;
ALTER TABLE public.workspace_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage workspace decisions" ON public.workspace_decisions FOR ALL TO authenticated USING (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.workspace_projects p WHERE p.id = project_id AND p.owner_id = auth.uid())) WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.workspace_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE TRIGGER update_workspace_decisions_updated_at BEFORE UPDATE ON public.workspace_decisions FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE TABLE public.workspace_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.workspace_projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 180),
  detail text NOT NULL DEFAULT '',
  probability text NOT NULL DEFAULT 'possible' CHECK (probability IN ('unlikely','possible','likely')),
  impact text NOT NULL DEFAULT 'medium' CHECK (impact IN ('low','medium','high')),
  mitigation text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','mitigated','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_risks TO authenticated;
GRANT ALL ON public.workspace_risks TO service_role;
ALTER TABLE public.workspace_risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage workspace risks" ON public.workspace_risks FOR ALL TO authenticated USING (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.workspace_projects p WHERE p.id = project_id AND p.owner_id = auth.uid())) WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.workspace_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE TRIGGER update_workspace_risks_updated_at BEFORE UPDATE ON public.workspace_risks FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE TABLE public.workspace_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.workspace_projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 180),
  kind text NOT NULL DEFAULT 'document',
  body text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'working' CHECK (status IN ('working','submitted')),
  submitted_version_id uuid REFERENCES public.artefact_versions(id),
  content_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_documents TO authenticated;
GRANT ALL ON public.workspace_documents TO service_role;
ALTER TABLE public.workspace_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage workspace documents" ON public.workspace_documents FOR ALL TO authenticated USING (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.workspace_projects p WHERE p.id = project_id AND p.owner_id = auth.uid())) WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.workspace_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE TRIGGER update_workspace_documents_updated_at BEFORE UPDATE ON public.workspace_documents FOR EACH ROW EXECUTE FUNCTION private.update_updated_at_column();

CREATE TABLE public.workspace_ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.workspace_projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('agenda','artefact','decision_options','risk_flags')),
  target_id uuid,
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'generating' CHECK (status IN ('generating','ready','approved','dismissed','failed')),
  approved_content jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
GRANT SELECT ON public.workspace_ai_suggestions TO authenticated;
GRANT ALL ON public.workspace_ai_suggestions TO service_role;
ALTER TABLE public.workspace_ai_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read workspace suggestions" ON public.workspace_ai_suggestions FOR SELECT TO authenticated USING (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.workspace_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

CREATE TABLE public.workspace_contribution_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.workspace_projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('ai_draft','user_edit','user_approved','submitted','outcome')),
  entity_type text NOT NULL,
  entity_id uuid,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.workspace_contribution_events TO authenticated;
GRANT ALL ON public.workspace_contribution_events TO service_role;
ALTER TABLE public.workspace_contribution_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read consented contribution events" ON public.workspace_contribution_events FOR SELECT TO authenticated USING (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.workspace_projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE TRIGGER workspace_contribution_events_immutable BEFORE UPDATE OR DELETE ON public.workspace_contribution_events FOR EACH ROW EXECUTE FUNCTION private.forbid_mutation();

CREATE OR REPLACE FUNCTION public.record_workspace_contribution(_project_id uuid, _event_type text, _entity_type text, _entity_id uuid DEFAULT NULL, _detail jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  _owner uuid := auth.uid();
  _event_id uuid;
BEGIN
  IF _owner IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
  IF _event_type NOT IN ('ai_draft','user_edit','user_approved','submitted','outcome') THEN RAISE EXCEPTION 'invalid_event_type'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.workspace_projects WHERE id = _project_id AND owner_id = _owner) THEN RAISE EXCEPTION 'workspace_not_found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.workspace_observation_preferences WHERE project_id = _project_id AND owner_id = _owner AND enabled) THEN RETURN NULL; END IF;
  INSERT INTO public.workspace_contribution_events (project_id, owner_id, event_type, entity_type, entity_id, detail)
  VALUES (_project_id, _owner, _event_type, _entity_type, _entity_id, COALESCE(_detail, '{}'::jsonb)) RETURNING id INTO _event_id;
  RETURN _event_id;
END;
$$;
REVOKE ALL ON FUNCTION public.record_workspace_contribution(uuid,text,text,uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_workspace_contribution(uuid,text,text,uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_workspace_document(_document_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, extensions
AS $$
DECLARE
  _owner uuid := auth.uid();
  _document public.workspace_documents%ROWTYPE;
  _project public.workspace_projects%ROWTYPE;
  _artefact_id uuid;
  _version_id uuid;
  _hash text;
BEGIN
  IF _owner IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
  SELECT * INTO _document FROM public.workspace_documents WHERE id = _document_id AND owner_id = _owner FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'document_not_found'; END IF;
  IF _document.status = 'submitted' THEN RAISE EXCEPTION 'document_already_submitted'; END IF;
  IF char_length(trim(_document.body)) < 20 THEN RAISE EXCEPTION 'document_content_required'; END IF;
  SELECT * INTO _project FROM public.workspace_projects WHERE id = _document.project_id AND owner_id = _owner;
  IF NOT FOUND THEN RAISE EXCEPTION 'workspace_not_found'; END IF;
  _hash := encode(digest(convert_to(_document.body, 'UTF8'), 'sha256'), 'hex');
  INSERT INTO public.artefacts (owner_id, title, kind, description)
  VALUES (_owner, _document.title, _document.kind, 'Professional Workspace submission from ' || _project.title)
  RETURNING id INTO _artefact_id;
  INSERT INTO public.artefact_versions (artefact_id, owner_id, version, body, content)
  VALUES (_artefact_id, _owner, 1, _document.body, jsonb_build_object('workspace_project_id', _project.id, 'workspace_document_id', _document.id, 'sha256', _hash, 'human_submitted', true))
  RETURNING id INTO _version_id;
  INSERT INTO public.evidence_ledger (owner_id, artefact_version_id, source, strength, summary, provenance)
  VALUES (_owner, _version_id, 'workspace_contribution', 'observed', _document.title || ' submitted from Professional Workspace.', jsonb_build_object('workspace_project_id', _project.id, 'workspace_document_id', _document.id, 'sha256', _hash, 'human_submitted', true));
  UPDATE public.workspace_documents SET status = 'submitted', submitted_version_id = _version_id, content_hash = _hash WHERE id = _document.id;
  IF EXISTS (SELECT 1 FROM public.workspace_observation_preferences WHERE project_id = _project.id AND owner_id = _owner AND enabled) THEN
    INSERT INTO public.workspace_contribution_events (project_id, owner_id, event_type, entity_type, entity_id, detail)
    VALUES (_project.id, _owner, 'submitted', 'artefact', _document.id, jsonb_build_object('artefact_version_id', _version_id, 'sha256', _hash));
  END IF;
  RETURN _version_id;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_workspace_document(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_workspace_document(uuid) TO authenticated;

CREATE INDEX workspace_projects_owner_idx ON public.workspace_projects(owner_id, updated_at DESC);
CREATE INDEX workspace_tasks_project_idx ON public.workspace_tasks(project_id, status, updated_at DESC);
CREATE INDEX workspace_meetings_project_idx ON public.workspace_meetings(project_id, scheduled_at DESC);
CREATE INDEX workspace_decisions_project_idx ON public.workspace_decisions(project_id, status, updated_at DESC);
CREATE INDEX workspace_risks_project_idx ON public.workspace_risks(project_id, status, updated_at DESC);
CREATE INDEX workspace_documents_project_idx ON public.workspace_documents(project_id, status, updated_at DESC);
CREATE INDEX workspace_suggestions_project_idx ON public.workspace_ai_suggestions(project_id, status, created_at DESC);
CREATE INDEX workspace_events_project_idx ON public.workspace_contribution_events(project_id, occurred_at DESC);