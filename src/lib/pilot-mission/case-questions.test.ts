import { describe, expect, it } from "vitest";
import { answerCaseQuestion, caseQuestionTopic } from "./case-questions";
import { baseMission } from "./test-fixtures";

describe("questions about a supervised case", () => {
  it("routes every suggested Studio prompt to a topic answered from the case", () => {
    const prompts: Record<string, string> = {
      "What is blocking the next step?": "next_step",
      "Summarise active agents and outputs.": "team",
      "What should I approve next?": "approvals",
      "Why is this your recommendation?": "recommendation",
      "What is the biggest risk?": "risks",
      "What should we research next?": "research_next",
      "Summarise what is on the record so far": "summary",
      "What is waiting on me?": "approvals",
      "Which workstream has the most gaps?": "workstreams",
      "What evidence supports this option?": "evidence",
    };
    for (const [prompt, topic] of Object.entries(prompts)) {
      expect(caseQuestionTopic(prompt), prompt).toBe(topic);
    }
  });

  it("refuses to act on the case and points to the screen's actions", () => {
    for (const ask of [
      "Approve option B",
      "Can you approve this?",
      "please cancel the mission",
      "Change the scope to mobile only",
    ]) {
      const answer = answerCaseQuestion(baseMission(), ask);
      expect(answer.topic, ask).toBe("change_request");
      expect(answer.text).toMatch(/can't change the case from chat/i);
    }
  });

  it("answers the next step and its recorded blockers", () => {
    const answer = answerCaseQuestion(baseMission(), "What is blocking the next step?");
    expect(answer.text).toMatch(/^Next step: Export the pack\./);
    expect(answer.text).toMatch(/Waiting on founder note/);
    expect(answer.basis).toMatch(/case record/);
  });

  it("lists what is waiting on the owner", () => {
    expect(answerCaseQuestion(baseMission(), "What is waiting on me?").text).toMatch(
      /^Waiting on you:\n• Export the pack/,
    );
    expect(
      answerCaseQuestion(baseMission({ stage: "alternatives" }), "What should I approve next?")
        .text,
    ).toMatch(/Record your next path/);
  });

  it("quotes evidence with its source and counts assumptions and gaps", () => {
    const text = answerCaseQuestion(baseMission(), "What evidence supports this option?").text;
    expect(text).toMatch(/Surplus tracking is the first pain\. — https:\/\/example\.com\/e1/);
    expect(text).toMatch(/0 assumptions and 1 gap\b/);
  });

  it("says plainly when nothing is recorded, instead of inventing an answer", () => {
    const empty = baseMission({
      evidence: [],
      researchGaps: [],
      proposal: null,
      approval: null,
      continuationPlan: null,
      activity: [],
    });
    expect(answerCaseQuestion(empty, "What should we research next?").text).toBe(
      "No research gaps are recorded on the case.",
    );
    expect(answerCaseQuestion(empty, "Which options are there?").text).toBe(
      "No options are drafted on the case yet.",
    );
    expect(answerCaseQuestion(empty, "What did I decide?").text).toBe(
      "No decision is recorded on the case yet.",
    );
  });

  it("labels simulated options and reports the recorded decision", () => {
    const mission = baseMission({
      proposal: {
        action: "compare_options",
        version: 1,
        scopeHash: "s",
        options: [{ id: "o1", title: "Waste log", tradeoff: "Manual entry", basis: "e1" }],
        generation: {
          ran: false,
          label: "not run",
          provider: null,
          model: null,
          output: "",
          citations: [],
          gaps: [],
        },
      },
    });
    expect(answerCaseQuestion(mission, "What options do we have?").text).toMatch(
      /Waste log — Manual entry[\s\S]*simulated drafts: no model ran/,
    );
    expect(answerCaseQuestion(mission, "What did I decide?").text).toMatch(
      /^Your recorded decision: .+ — "Ship a thin slice"/,
    );
  });

  it("reads curly apostrophes and treats 'update me' or 'start with' as questions", () => {
    expect(caseQuestionTopic("What\u2019s next?")).toBe("next_step");
    expect(caseQuestionTopic("I don\u2019t know who buys this")).toBe("research_next");
    expect(caseQuestionTopic("Update me on the status")).toBe("next_step");
    expect(caseQuestionTopic("Start with the risks")).toBe("risks");
  });

  it("names the model that drafted the options", () => {
    const mission = baseMission({
      proposal: {
        action: "compare_options",
        version: 1,
        scopeHash: "s",
        options: [{ id: "o1", title: "Waste log", tradeoff: "Manual entry", basis: "e1" }],
        generation: {
          ran: true,
          label: "openai/gpt-test",
          provider: "openai",
          model: "gpt-test",
          output: "{}",
          citations: [],
          gaps: [],
        },
      },
    });
    expect(answerCaseQuestion(mission, "What options do we have?").text).toMatch(
      /Drafted by model gpt-test\.$/,
    );
  });

  it("explains what it can answer when the question matches nothing", () => {
    const answer = answerCaseQuestion(baseMission(), "Tell me a joke");
    expect(answer.topic).toBe("unknown");
    expect(answer.text).toMatch(/I answer from this case's saved record/);
  });
});
