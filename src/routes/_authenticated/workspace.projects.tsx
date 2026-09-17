import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Bot, Check, FileText, ListChecks, MessageSquareText, Plus, ShieldCheck, Users, X } from "lucide-react";
import { toast } from "sonner";
import { WorkspaceCard, WorkspaceShell } from "@/components/workspace/workspace-shell";
import { Button } from "@/components/ui/button";
import { professionalWorkspaceQuery } from "@/lib/professional-workspace-queries";
import { createWorkspaceItem, createWorkspaceProject, generateWorkspaceAiDraft, resolveWorkspaceAiDraft, setWorkspaceObservation, submitWorkspaceDocument, updateWorkspaceItemStatus } from "@/lib/professional-workspace.functions";
import type { ProfessionalWorkspace } from "@/lib/professional-workspace.functions";

type View = "overview"|"team"|"tasks"|"meetings"|"artefacts"|"decisions"|"risks"|"evidence";
type CreateType = "task"|"meeting"|"document"|"decision"|"risk";
const views: Array<{id:View;label:string}> = [
  {id:"overview",label:"Overview"},{id:"team",label:"Team"},{id:"tasks",label:"Tasks"},{id:"meetings",label:"Meetings"},
  {id:"artefacts",label:"Artefacts"},{id:"decisions",label:"Decisions"},{id:"risks",label:"Risks"},{id:"evidence",label:"Evidence review"},
];
const input = "w-full rounded-[4px] border border-[var(--pw-border)] bg-[var(--pw-surface-2)] px-3 py-2.5 text-sm text-[var(--pw-ink)] outline-none focus:border-[var(--pw-teal)] focus:ring-2 focus:ring-[var(--pw-teal-soft)]";

export const Route = createFileRoute("/_authenticated/workspace/projects")({
  head:()=>({meta:[{title:"Professional Workspace — DeliverX"},{name:"description",content:"Run product work with explicit human approval, immutable submissions and consent-led contribution records."},{property:"og:title",content:"Professional Workspace — DeliverX"},{property:"og:description",content:"Tasks, meetings, artefacts, decisions, risks and evidence in one trusted workspace."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),
  loader:({context})=>context.queryClient.ensureQueryData(professionalWorkspaceQuery()),
  component:ProfessionalWorkspacePage,
});

function ProfessionalWorkspacePage(){
  const {data}=useSuspenseQuery(professionalWorkspaceQuery());
  const qc=useQueryClient(); const [view,setView]=useState<View>("overview"); const [modal,setModal]=useState<CreateType|null>(null);
  const invalidate=()=>qc.invalidateQueries({queryKey:["professional-workspace"]});
  const createProject=useMutation({mutationFn:(form:{title:string;purpose:string})=>createWorkspaceProject({data:{...form,enrolmentId:null}}),onSuccess:()=>{toast.success("Workspace created.");void invalidate()},onError:(e:Error)=>toast.error(e.message)});
  if(!data.project) return <WorkspaceShell title="Professional Workspace" subtitle="Human-led delivery with AI support."><NewProject pending={createProject.isPending} onCreate={(form)=>createProject.mutate(form)}/></WorkspaceShell>;
  const project=data.project;
  return <WorkspaceShell title="Professional Workspace" subtitle={project.title}>
    <div className="pw-shell">
      <div className="pw-project-bar"><div><span className="pw-kicker">Active project</span><strong>{project.title}</strong></div><span className="pw-source">{project.source==="experience"?"Experience project":"Professional project"}</span></div>
      <nav className="pw-tabs" aria-label="Workspace sections">{views.map((item)=><button key={item.id} type="button" className={view===item.id?"active":""} onClick={()=>setView(item.id)}>{item.label}</button>)}</nav>
      {view==="overview"?<Overview project={project} setView={setView}/>:null}
      {view==="team"?<Team people={project.people}/>:null}
      {view==="tasks"?<Records title="Tasks" description="Delivery work stays visible until you close it." empty="No tasks yet." rows={project.tasks.map(r=>({id:r.id,title:r.title,meta:`${r.priority} priority`,detail:r.detail,status:r.status,type:"task" as const}))} onCreate={()=>setModal("task")} projectId={project.id} invalidate={invalidate}/>:null}
      {view==="meetings"?<Meetings project={project} onCreate={()=>setModal("meeting")} invalidate={invalidate}/>:null}
      {view==="artefacts"?<Artefacts project={project} onCreate={()=>setModal("document")} invalidate={invalidate}/>:null}
      {view==="decisions"?<Records title="Decisions" description="Options stay open until a person makes the call." empty="No decisions logged yet." rows={project.decisions.map(r=>({id:r.id,title:r.title,meta:r.selectedOption??"Awaiting a human decision",detail:r.rationale,status:r.status,type:"decision" as const}))} onCreate={()=>setModal("decision")} projectId={project.id} invalidate={invalidate}/>:null}
      {view==="risks"?<Records title="Risks" description="Record the signal, impact and mitigation without overstating certainty." empty="No risks logged yet." rows={project.risks.map(r=>({id:r.id,title:r.title,meta:`${r.probability} probability · ${r.impact} impact`,detail:r.detail||r.mitigation,status:r.status,type:"risk" as const}))} onCreate={()=>setModal("risk")} projectId={project.id} invalidate={invalidate}/>:null}
      {view==="evidence"?<Evidence project={project} invalidate={invalidate}/>:null}
      {modal?<CreateModal type={modal} projectId={project.id} close={()=>setModal(null)} invalidate={invalidate}/>:null}
    </div>
  </WorkspaceShell>;
}

function NewProject({pending,onCreate}:{pending:boolean;onCreate:(data:{title:string;purpose:string})=>void}){
  const [title,setTitle]=useState(""); const [purpose,setPurpose]=useState("");
  return <WorkspaceCard title="Create your first delivery workspace" description="Start empty. Nothing is observed, generated or submitted until you choose it."><form className="max-w-2xl space-y-4" onSubmit={e=>{e.preventDefault();onCreate({title,purpose})}}><label className="block text-sm">Project name<input className={`${input} mt-1.5`} value={title} onChange={e=>setTitle(e.target.value)} required minLength={2}/></label><label className="block text-sm">Purpose<textarea className={`${input} mt-1.5 min-h-28`} value={purpose} onChange={e=>setPurpose(e.target.value)} required minLength={10}/></label><Button disabled={pending} className="pw-primary">{pending?"Creating…":"Create workspace"}</Button></form></WorkspaceCard>;
}

function Overview({project,setView}:{project:ProfessionalProject;setView:(v:View)=>void}){
  const items=[{label:"Open tasks",value:project.tasks.filter(x=>x.status!=="done").length,view:"tasks" as View},{label:"Planned meetings",value:project.meetings.filter(x=>x.status==="planned").length,view:"meetings" as View},{label:"Working artefacts",value:project.documents.filter(x=>x.status==="working").length,view:"artefacts" as View},{label:"Open risks",value:project.risks.filter(x=>x.status==="open").length,view:"risks" as View}];
  return <div className="space-y-4"><section className="pw-brief"><span className="pw-kicker">Project purpose</span><p>{project.purpose}</p></section><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{items.map(x=><button type="button" className="pw-stat" key={x.label} onClick={()=>setView(x.view)}><strong>{x.value}</strong><span>{x.label}</span></button>)}</div><AiStudio project={project}/></div>;
}

function Team({people}:{people:Array<{id:string;kind:string;name:string;role:string;remit:string;accent:string}>}){return <WorkspaceCard title="Team" description="AI colleagues challenge the work. They cannot approve, decide or submit it."><div className="grid gap-3 md:grid-cols-2">{people.map(p=><article key={p.id} className={`pw-person pw-${p.accent}`}><div className="flex items-center gap-3">{p.kind==="human"?<Users/>:<Bot/>}<div><strong>{p.name}</strong><span>{p.role}</span></div></div><p>{p.remit}</p><small>{p.kind==="human"?"Human authority":"AI colleague · suggestions only"}</small></article>)}</div></WorkspaceCard>}

function Records({title,description,empty,rows,onCreate,projectId,invalidate}:{title:string;description:string;empty:string;rows:Array<{id:string;title:string;meta:string;detail:string;status:string;type:"task"|"decision"|"risk"}>;onCreate:()=>void;projectId:string;invalidate:()=>unknown}){
  const update=useMutation({mutationFn:(row:{id:string;type:"task"|"decision"|"risk";status:string})=>updateWorkspaceItemStatus({data:{...row,projectId}}),onSuccess:()=>{toast.success("Status updated.");void invalidate()},onError:(e:Error)=>toast.error(e.message)});
  const next={task:{open:"in_progress",in_progress:"done",blocked:"in_progress",done:"open"},decision:{open:"decided",decided:"revisited",revisited:"decided"},risk:{open:"mitigated",mitigated:"closed",closed:"open"}} as const;
  return <WorkspaceCard title={title} description={description} action={<Button onClick={onCreate} className="pw-primary"><Plus/>Add</Button>}>{rows.length===0?<p className="pw-empty">{empty}</p>:<div className="pw-list">{rows.map(row=><article key={row.id}><div><strong>{row.title}</strong><span>{row.meta}</span>{row.detail?<p>{row.detail}</p>:null}</div><Button variant="outline" disabled={update.isPending} onClick={()=>update.mutate({id:row.id,type:row.type,status:next[row.type][row.status as never] as string})}>{humanStatus(row.status)}</Button></article>)}</div>}</WorkspaceCard>
}

function Meetings({project,onCreate,invalidate}:{project:ProfessionalProject;onCreate:()=>void;invalidate:()=>unknown}){
  const update=useMutation({mutationFn:(x:{id:string;status:string})=>updateWorkspaceItemStatus({data:{type:"meeting",id:x.id,status:x.status,projectId:project.id}}),onSuccess:()=>{toast.success("Meeting updated.");void invalidate()},onError:(e:Error)=>toast.error(e.message)});
  return <WorkspaceCard title="Meetings" description="Prepare deliberately; record what people agreed after the conversation." action={<Button onClick={onCreate} className="pw-primary"><Plus/>Add</Button>}>{project.meetings.length===0?<p className="pw-empty">No meetings planned yet.</p>:<div className="pw-list">{project.meetings.map(r=><article key={r.id}><div><strong>{r.title}</strong><span>{r.scheduledAt?new Date(r.scheduledAt).toLocaleString():"Date not scheduled"}</span>{r.agenda?<p>{r.agenda}</p>:null}</div><Button variant="outline" onClick={()=>update.mutate({id:r.id,status:r.status==="planned"?"held":"planned"})}>{humanStatus(r.status)}</Button></article>)}</div>}</WorkspaceCard>;
}

type ProfessionalProject=NonNullable<ProfessionalWorkspace["project"]>;
function Artefacts({project,onCreate,invalidate}:{project:ProfessionalProject;onCreate:()=>void;invalidate:()=>unknown}){
  const submit=useMutation({mutationFn:(id:string)=>submitWorkspaceDocument({data:{documentId:id}}),onSuccess:()=>{toast.success("Submitted. An immutable version and evidence entry were created.");void invalidate()},onError:(e:Error)=>toast.error(e.message)});
  return <WorkspaceCard title="Artefacts" description="Working documents remain editable. Submission is a separate human action that freezes a SHA-256 fingerprint." action={<Button onClick={onCreate} className="pw-primary"><Plus/>New artefact</Button>}>{project.documents.length===0?<p className="pw-empty">No artefacts created yet.</p>:<div className="pw-list">{project.documents.map(r=><article key={r.id}><div><strong>{r.title}</strong><span>{r.status==="submitted"?"Submitted and immutable":"Working document"}</span><p className="line-clamp-3 whitespace-pre-wrap">{r.body}</p>{r.contentHash?<small className="pw-hash">SHA-256 {r.contentHash}</small>:null}</div>{r.status==="working"?<Button disabled={submit.isPending||r.body.trim().length<20} onClick={()=>submit.mutate(r.id)} className="pw-primary"><ShieldCheck/>Submit</Button>:<span className="pw-confirmed"><Check/>Frozen</span>}</article>)}</div>}</WorkspaceCard>;
}

function Evidence({project,invalidate}:{project:ProfessionalProject;invalidate:()=>unknown}){
  const toggle=useMutation({mutationFn:(enabled:boolean)=>setWorkspaceObservation({data:{projectId:project.id,enabled}}),onSuccess:()=>{toast.success("Observation preference updated.");void invalidate()},onError:(e:Error)=>toast.error(e.message)});
  return <div className="space-y-4"><WorkspaceCard title="Observation consent" description="Optional contribution events are recorded only while this setting is on. Submission evidence is still created when you explicitly submit an artefact."><label className="pw-consent"><input type="checkbox" checked={project.observationEnabled} disabled={toggle.isPending} onChange={e=>toggle.mutate(e.target.checked)}/><span><strong>{project.observationEnabled?"Observation is on":"Observation is off"}</strong><small>{project.observationEnabled?"AI drafts, edits, approvals and outcomes can be added to your private contribution trail.":"No optional session or contribution events are being recorded."}</small></span></label></WorkspaceCard><WorkspaceCard title="Evidence review" description="Only explicit artefact submissions write professional evidence. AI drafts never become evidence by themselves.">{project.documents.filter(x=>x.status==="submitted").length===0?<p className="pw-empty">No Professional Workspace artefacts have been submitted.</p>:<div className="pw-list">{project.documents.filter(x=>x.status==="submitted").map(x=><article key={x.id}><div><strong>{x.title}</strong><span>Human-submitted artefact</span><small className="pw-hash">SHA-256 {x.contentHash}</small></div><span className="pw-confirmed"><ShieldCheck/>Recorded</span></article>)}</div>}</WorkspaceCard>{project.observationEnabled?<WorkspaceCard title="Private contribution trail" description="Append-only events captured after consent was enabled.">{project.events.length===0?<p className="pw-empty">No contribution events have been recorded since consent was enabled.</p>:<ol className="pw-events">{project.events.map(x=><li key={x.id}><span>{humanStatus(x.eventType)}</span><small>{x.entityType} · {new Date(x.occurredAt).toLocaleString()}</small></li>)}</ol>}</WorkspaceCard>:null}</div>;
}

function AiStudio({project}:{project:ProfessionalProject}){
  const qc=useQueryClient(); const [kind,setKind]=useState<"agenda"|"artefact"|"decision_options"|"risk_flags">("agenda"); const [editing,setEditing]=useState<Record<string,string>>({});
  const invalidate=()=>qc.invalidateQueries({queryKey:["professional-workspace"]});
  const generate=useMutation({mutationFn:()=>generateWorkspaceAiDraft({data:{projectId:project.id,kind}}),onSuccess:()=>{toast.success("AI draft ready for your review.");void invalidate()},onError:(e:Error)=>toast.error(e.message)});
  const resolve=useMutation({mutationFn:(x:{suggestionId:string;action:"approve"|"dismiss";editedText:string})=>resolveWorkspaceAiDraft({data:{...x,projectId:project.id}}),onSuccess:(_r,x)=>{toast.success(x.action==="approve"?"Draft approved as working content. Nothing was submitted.":"Draft dismissed.");void invalidate()},onError:(e:Error)=>toast.error(e.message)});
  const ready=project.suggestions.filter(x=>x.status==="ready");
  return <WorkspaceCard title="AI draft studio" description="AI uses approved project records only. Every result stays a suggestion until you approve, edit or dismiss it."><div className="flex flex-wrap gap-2"><select className={`${input} max-w-xs`} value={kind} onChange={e=>setKind(e.target.value as typeof kind)}><option value="agenda">Meeting agenda</option><option value="artefact">Working artefact</option><option value="decision_options">Decision options</option><option value="risk_flags">Risk flags</option></select><Button className="pw-primary" disabled={generate.isPending} onClick={()=>generate.mutate()}><Bot/>{generate.isPending?"Drafting…":"Generate AI draft"}</Button></div>{ready.map(row=><article className="pw-ai" key={row.id}><header><span><Bot/>AI draft</span><strong>{row.title}</strong></header><textarea className={`${input} min-h-56 font-mono`} value={editing[row.id]??row.text} onChange={e=>setEditing(v=>({...v,[row.id]:e.target.value}))}/><footer><Button className="pw-primary" disabled={resolve.isPending} onClick={()=>resolve.mutate({suggestionId:row.id,action:"approve",editedText:editing[row.id]??row.text})}><Check/>Approve as working content</Button><Button variant="outline" disabled={resolve.isPending} onClick={()=>resolve.mutate({suggestionId:row.id,action:"dismiss",editedText:""})}><X/>Dismiss</Button></footer><small>Approval does not submit this content or write evidence.</small></article>)}</WorkspaceCard>;
}

function CreateModal({type,projectId,close,invalidate}:{type:CreateType;projectId:string;close:()=>void;invalidate:()=>unknown}){const [title,setTitle]=useState("");const [detail,setDetail]=useState("");const [priority,setPriority]=useState<"low"|"medium"|"high"|"critical">("medium");const create=useMutation({mutationFn:()=>createWorkspaceItem({data:type==="task"?{type,projectId,title,detail,priority}:type==="risk"?{type,projectId,title,detail,priority:priority==="critical"?"high":priority}:{type,projectId,title,detail}}),onSuccess:()=>{toast.success("Created.");void invalidate();close()},onError:(e:Error)=>toast.error(e.message)});return <div className="pw-modal-bg" role="presentation" onMouseDown={e=>{if(e.currentTarget===e.target)close()}}><section className="pw-modal" role="dialog" aria-modal="true" aria-labelledby="create-title"><header><h2 id="create-title">Add {type}</h2><Button variant="ghost" size="icon" onClick={close} aria-label="Close"><X/></Button></header><label>Title<input autoFocus className={input} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>{type==="meeting"?"Agenda":type==="document"?"Working content":"Detail"}<textarea className={`${input} min-h-32`} value={detail} onChange={e=>setDetail(e.target.value)}/></label>{type==="task"||type==="risk"?<label>{type==="task"?"Priority":"Impact"}<select className={input} value={priority} onChange={e=>setPriority(e.target.value as typeof priority)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>{type==="task"?<option value="critical">Critical</option>:null}</select></label>:null}<footer><Button variant="outline" onClick={close}>Cancel</Button><Button className="pw-primary" disabled={create.isPending||title.trim().length<2} onClick={()=>create.mutate()}>{create.isPending?"Saving…":"Create"}</Button></footer></section></div>}

function humanStatus(value:string){return value.replaceAll("_"," ").replace(/^./,x=>x.toUpperCase())}
