import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uuid = z.string().uuid();
const projectInput = z.object({ title: z.string().trim().min(2).max(120), purpose: z.string().trim().min(10).max(1200), enrolmentId: uuid.nullable().default(null) });
const projectIdInput = z.object({ projectId: uuid });

export type ProfessionalWorkspace = {
  projects: Array<{ id: string; title: string; purpose: string; source: string; createdAt: string }>;
  project: null | {
    id: string; title: string; purpose: string; source: string; observationEnabled: boolean;
    people: Array<{ id: string; kind: string; name: string; role: string; remit: string; accent: string }>;
    tasks: Array<{ id: string; title: string; detail: string; priority: string; status: string; dueAt: string | null }>;
    meetings: Array<{ id: string; title: string; scheduledAt: string | null; agenda: string; notes: string; status: string }>;
    decisions: Array<{ id: string; title: string; options: string[]; selectedOption: string | null; rationale: string; status: string }>;
    risks: Array<{ id: string; title: string; detail: string; probability: string; impact: string; mitigation: string; status: string }>;
    documents: Array<{ id: string; title: string; kind: string; body: string; status: string; contentHash: string | null; submittedVersionId: string | null }>;
    suggestions: Array<{ id: string; kind: string; title: string; text: string; status: string; errorMessage: string | null; createdAt: string }>;
    events: Array<{ id: string; eventType: string; entityType: string; occurredAt: string }>;
  };
};

export const getProfessionalWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ projectId: uuid.nullable().default(null) }).parse(data))
  .handler(async ({ data, context }): Promise<ProfessionalWorkspace> => {
    const { supabase, userId } = context;
    const { data: projects, error } = await supabase.from("workspace_projects").select("id,title,purpose,source,created_at").eq("owner_id", userId).order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    const chosen = data.projectId ? (projects ?? []).find((p) => p.id === data.projectId) : projects?.[0];
    const mappedProjects = (projects ?? []).map((p) => ({ id: p.id, title: p.title, purpose: p.purpose, source: p.source, createdAt: p.created_at }));
    if (!chosen) return { projects: mappedProjects, project: null };

    const [pref, people, tasks, meetings, decisions, risks, documents, suggestions, events] = await Promise.all([
      supabase.from("workspace_observation_preferences").select("enabled").eq("project_id", chosen.id).maybeSingle(),
      supabase.from("workspace_people").select("id,kind,name,role,remit,accent").eq("project_id", chosen.id).order("created_at"),
      supabase.from("workspace_tasks").select("id,title,detail,priority,status,due_at").eq("project_id", chosen.id).order("updated_at", { ascending: false }),
      supabase.from("workspace_meetings").select("id,title,scheduled_at,agenda,notes,status").eq("project_id", chosen.id).order("created_at", { ascending: false }),
      supabase.from("workspace_decisions").select("id,title,options,selected_option,rationale,status").eq("project_id", chosen.id).order("updated_at", { ascending: false }),
      supabase.from("workspace_risks").select("id,title,detail,probability,impact,mitigation,status").eq("project_id", chosen.id).order("updated_at", { ascending: false }),
      supabase.from("workspace_documents").select("id,title,kind,body,status,content_hash,submitted_version_id").eq("project_id", chosen.id).order("updated_at", { ascending: false }),
      supabase.from("workspace_ai_suggestions").select("id,kind,title,content,status,error_message,created_at").eq("project_id", chosen.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("workspace_contribution_events").select("id,event_type,entity_type,occurred_at").eq("project_id", chosen.id).order("occurred_at", { ascending: false }).limit(30),
    ]);
    const firstError = [people.error,tasks.error,meetings.error,decisions.error,risks.error,documents.error,suggestions.error,events.error].find(Boolean);
    if (firstError) throw new Error(firstError.message);
    return {
      projects: mappedProjects,
      project: {
        id: chosen.id, title: chosen.title, purpose: chosen.purpose, source: chosen.source,
        observationEnabled: pref.data?.enabled ?? false,
        people: (people.data ?? []).map((r) => ({ id:r.id,kind:r.kind,name:r.name,role:r.role,remit:r.remit,accent:r.accent })),
        tasks: (tasks.data ?? []).map((r) => ({ id:r.id,title:r.title,detail:r.detail,priority:r.priority,status:r.status,dueAt:r.due_at })),
        meetings: (meetings.data ?? []).map((r) => ({ id:r.id,title:r.title,scheduledAt:r.scheduled_at,agenda:r.agenda,notes:r.notes,status:r.status })),
        decisions: (decisions.data ?? []).map((r) => ({ id:r.id,title:r.title,options:Array.isArray(r.options)?r.options.filter((x):x is string=>typeof x==="string"):[],selectedOption:r.selected_option,rationale:r.rationale,status:r.status })),
        risks: (risks.data ?? []).map((r) => ({ id:r.id,title:r.title,detail:r.detail,probability:r.probability,impact:r.impact,mitigation:r.mitigation,status:r.status })),
        documents: (documents.data ?? []).map((r) => ({ id:r.id,title:r.title,kind:r.kind,body:r.body,status:r.status,contentHash:r.content_hash,submittedVersionId:r.submitted_version_id })),
        suggestions: (suggestions.data ?? []).map((r) => ({ id:r.id,kind:r.kind,title:r.title,text:typeof r.content === "object" && r.content && "text" in r.content ? String((r.content as {text?:unknown}).text ?? "") : "",status:r.status,errorMessage:r.error_message,createdAt:r.created_at })),
        events: (events.data ?? []).map((r) => ({ id:r.id,eventType:r.event_type,entityType:r.entity_type,occurredAt:r.occurred_at })),
      },
    };
  });

export const createWorkspaceProject = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data: unknown) => projectInput.parse(data)).handler(async ({ data, context }) => {
  const { supabase, userId } = context;
  if (data.enrolmentId) {
    const { data: enrolment } = await supabase.from("experience_enrolments").select("id,experience_scenarios(company_name,name,summary)").eq("id", data.enrolmentId).eq("owner_id", userId).maybeSingle();
    if (!enrolment) throw new Error("That Experience enrolment is not available.");
  }
  const { data: project, error } = await supabase.from("workspace_projects").insert({ owner_id:userId,title:data.title,purpose:data.purpose,experience_enrolment_id:data.enrolmentId,source:data.enrolmentId?"experience":"real_project" }).select("id").single();
  if (error || !project) throw new Error(error?.message ?? "Could not create the workspace.");
  const people = [
    { kind:"human", name:"You", role:"Product Manager", remit:"Own decisions, approvals and submissions", accent:"purple" },
    { kind:"ai_colleague", name:"Stakeholder partner", role:"Sponsor", remit:"Challenges outcomes, constraints and stakeholder alignment", accent:"gold" },
    { kind:"ai_colleague", name:"Delivery partner", role:"Scrum Master", remit:"Surfaces dependencies, sequencing and delivery risk", accent:"cyan" },
    { kind:"ai_colleague", name:"Engineering partner", role:"Engineer", remit:"Challenges feasibility, scope and technical assumptions", accent:"green" },
    { kind:"ai_colleague", name:"Analysis partner", role:"Business Analyst", remit:"Tests requirements, evidence and acceptance criteria", accent:"blue" },
  ].map((person) => ({ ...person, project_id:project.id, owner_id:userId }));
  const { error: peopleError } = await supabase.from("workspace_people").insert(people);
  if (peopleError) throw new Error(peopleError.message);
  const { error: prefError } = await supabase.from("workspace_observation_preferences").insert({ project_id:project.id,owner_id:userId,enabled:false });
  if (prefError) throw new Error(prefError.message);
  return { projectId: project.id };
});

export const setWorkspaceObservation = createServerFn({ method:"POST" }).middleware([requireSupabaseAuth]).inputValidator((data:unknown)=>z.object({projectId:uuid,enabled:z.boolean()}).parse(data)).handler(async({data,context})=>{
  const { error }=await context.supabase.from("workspace_observation_preferences").upsert({project_id:data.projectId,owner_id:context.userId,enabled:data.enabled,changed_at:new Date().toISOString()},{onConflict:"project_id"});
  if(error) throw new Error(error.message); return {ok:true};
});

export const createWorkspaceItem = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((data:unknown)=>z.discriminatedUnion("type",[
  z.object({type:z.literal("task"),projectId:uuid,title:z.string().trim().min(2).max(180),detail:z.string().trim().max(4000).default(""),priority:z.enum(["low","medium","high","critical"]).default("medium")}),
  z.object({type:z.literal("meeting"),projectId:uuid,title:z.string().trim().min(2).max(180),detail:z.string().trim().max(8000).default("")}),
  z.object({type:z.literal("decision"),projectId:uuid,title:z.string().trim().min(2).max(180),detail:z.string().trim().max(4000).default("")}),
  z.object({type:z.literal("risk"),projectId:uuid,title:z.string().trim().min(2).max(180),detail:z.string().trim().max(4000).default(""),priority:z.enum(["low","medium","high"]).default("medium")}),
  z.object({type:z.literal("document"),projectId:uuid,title:z.string().trim().min(2).max(180),detail:z.string().max(20000).default("")}),
]).parse(data)).handler(async({data,context})=>{
  const base={project_id:data.projectId,owner_id:context.userId,title:data.title}; let result:{id:string}|null=null; let error:{message:string}|null=null;
  if(data.type==="task") ({data:result,error}=await context.supabase.from("workspace_tasks").insert({...base,detail:data.detail,priority:data.priority}).select("id").single());
  if(data.type==="meeting") ({data:result,error}=await context.supabase.from("workspace_meetings").insert({...base,agenda:data.detail}).select("id").single());
  if(data.type==="decision") ({data:result,error}=await context.supabase.from("workspace_decisions").insert({...base,rationale:data.detail}).select("id").single());
  if(data.type==="risk") ({data:result,error}=await context.supabase.from("workspace_risks").insert({...base,detail:data.detail,impact:data.priority}).select("id").single());
  if(data.type==="document") ({data:result,error}=await context.supabase.from("workspace_documents").insert({...base,body:data.detail}).select("id").single());
  if(error||!result) throw new Error(error?.message??"Could not create that item.");
  await context.supabase.rpc("record_workspace_contribution",{_project_id:data.projectId,_event_type:"user_edit",_entity_type:data.type,_entity_id:result.id,_detail:{action:"created"}});
  return {id:result.id};
});

export const updateWorkspaceItemStatus = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((data:unknown)=>z.object({type:z.enum(["task","meeting","decision","risk"]),id:uuid,status:z.string().min(2).max(30),projectId:uuid}).parse(data)).handler(async({data,context})=>{
  const allowed={task:["open","in_progress","blocked","done"],meeting:["planned","held","cancelled"],decision:["open","decided","revisited"],risk:["open","mitigated","closed"]}[data.type];
  if(!allowed.includes(data.status)) throw new Error("That status change is not allowed.");
  let error: { message: string } | null = null;
  if (data.type === "task") ({ error } = await context.supabase.from("workspace_tasks").update({ status: data.status }).eq("id", data.id).eq("owner_id", context.userId));
  if (data.type === "meeting") ({ error } = await context.supabase.from("workspace_meetings").update({ status: data.status }).eq("id", data.id).eq("owner_id", context.userId));
  if (data.type === "decision") ({ error } = await context.supabase.from("workspace_decisions").update({ status: data.status, decided_at: data.status === "decided" ? new Date().toISOString() : null }).eq("id", data.id).eq("owner_id", context.userId));
  if (data.type === "risk") ({ error } = await context.supabase.from("workspace_risks").update({ status: data.status }).eq("id", data.id).eq("owner_id", context.userId));
  if(error) throw new Error(error.message);
  await context.supabase.rpc("record_workspace_contribution",{_project_id:data.projectId,_event_type:"outcome",_entity_type:data.type,_entity_id:data.id,_detail:{status:data.status}});
  return {ok:true};
});

export const submitWorkspaceDocument = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((data:unknown)=>z.object({documentId:uuid}).parse(data)).handler(async({data,context})=>{
  const {data:versionId,error}=await context.supabase.rpc("submit_workspace_document",{_document_id:data.documentId});
  if(error) throw new Error(error.message); return {versionId};
});

export const generateWorkspaceAiDraft = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((data:unknown)=>z.object({projectId:uuid,kind:z.enum(["agenda","artefact","decision_options","risk_flags"])}).parse(data)).handler(async({data,context})=>{
  const {data:project}=await context.supabase.from("workspace_projects").select("id,title,purpose").eq("id",data.projectId).eq("owner_id",context.userId).maybeSingle();
  if(!project) throw new Error("Workspace not found.");
  const [docs,decisions,tasks,risks]=await Promise.all([
    context.supabase.from("workspace_documents").select("title,body,status").eq("project_id",project.id).eq("status","submitted").limit(8),
    context.supabase.from("workspace_decisions").select("title,selected_option,rationale,status").eq("project_id",project.id).eq("status","decided").limit(8),
    context.supabase.from("workspace_tasks").select("title,detail,status").eq("project_id",project.id).limit(12),
    context.supabase.from("workspace_risks").select("title,detail,mitigation,status").eq("project_id",project.id).limit(8),
  ]);
  const approvedContext=JSON.stringify({submittedArtefacts:docs.data??[],decisions:decisions.data??[],tasks:tasks.data??[],risks:risks.data??[]});
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:row,error:createError}=await supabaseAdmin.from("workspace_ai_suggestions").insert({project_id:project.id,owner_id:context.userId,kind:data.kind,title:{agenda:"Meeting agenda",artefact:"Working artefact",decision_options:"Decision options",risk_flags:"Risk review"}[data.kind],status:"generating"}).select("id").single();
  if(createError||!row) throw new Error(createError?.message??"Could not start the draft.");
  try {
    const {generateWorkspaceSuggestion}=await import("./workspace-ai.server");
    const text=await generateWorkspaceSuggestion({kind:data.kind,projectTitle:project.title,projectPurpose:project.purpose,approvedContext});
    const {error}=await supabaseAdmin.from("workspace_ai_suggestions").update({content:{text},status:"ready"}).eq("id",row.id);
    if(error) throw new Error(error.message);
    await context.supabase.rpc("record_workspace_contribution",{_project_id:project.id,_event_type:"ai_draft",_entity_type:data.kind,_entity_id:row.id,_detail:{suggestion_id:row.id}});
    return {id:row.id};
  } catch(error) {
    const message=error instanceof Error?error.message:"AI drafting failed.";
    await supabaseAdmin.from("workspace_ai_suggestions").update({status:"failed",error_message:message}).eq("id",row.id);
    throw new Error(message);
  }
});

export const resolveWorkspaceAiDraft = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((data:unknown)=>z.object({suggestionId:uuid,projectId:uuid,action:z.enum(["approve","dismiss"]),editedText:z.string().max(20000).default("")}).parse(data)).handler(async({data,context})=>{
  const {data:row}=await context.supabase.from("workspace_ai_suggestions").select("id,owner_id,status,content,kind,title").eq("id",data.suggestionId).eq("owner_id",context.userId).eq("project_id",data.projectId).maybeSingle();
  if(!row||row.status!=="ready") throw new Error("That AI draft is no longer awaiting review.");
  const original=typeof row.content==="object"&&row.content&&"text" in row.content?String((row.content as {text?:unknown}).text??""):"";
  const approved=data.editedText.trim()||original;
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {error}=await supabaseAdmin.from("workspace_ai_suggestions").update({status:data.action==="approve"?"approved":"dismissed",approved_content:data.action==="approve"?{text:approved}:null,resolved_at:new Date().toISOString()}).eq("id",data.suggestionId).eq("owner_id",context.userId);
  if(error) throw new Error(error.message);
  if(data.action==="approve") {
    let workingId: string | null = null;
    if (row.kind === "agenda") {
      const { data: meeting, error: meetingError } = await supabaseAdmin.from("workspace_meetings").insert({ project_id:data.projectId, owner_id:context.userId, title:row.title, agenda:approved }).select("id").single();
      if (meetingError || !meeting) throw new Error(meetingError?.message ?? "Could not create the working agenda.");
      workingId = meeting.id;
    } else if (row.kind === "decision_options") {
      const { data: decision, error: decisionError } = await supabaseAdmin.from("workspace_decisions").insert({ project_id:data.projectId, owner_id:context.userId, title:row.title, rationale:approved }).select("id").single();
      if (decisionError || !decision) throw new Error(decisionError?.message ?? "Could not create the working decision.");
      workingId = decision.id;
    } else {
      const { data: document, error: documentError } = await supabaseAdmin.from("workspace_documents").insert({ project_id:data.projectId, owner_id:context.userId, title:row.title, kind:row.kind === "risk_flags" ? "risk_review" : "document", body:approved }).select("id").single();
      if (documentError || !document) throw new Error(documentError?.message ?? "Could not create the working artefact.");
      workingId = document.id;
    }
    if(approved!==original) await context.supabase.rpc("record_workspace_contribution",{_project_id:data.projectId,_event_type:"user_edit",_entity_type:"ai_suggestion",_entity_id:data.suggestionId,_detail:{edited:true}});
    await context.supabase.rpc("record_workspace_contribution",{_project_id:data.projectId,_event_type:"user_approved",_entity_type:"ai_suggestion",_entity_id:data.suggestionId,_detail:{approved:true,working_item_id:workingId}});
  }
  return {ok:true};
});
