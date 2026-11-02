import { createFileRoute } from "@tanstack/react-router";
import { LearnHub } from "@/components/learn/learn-pages";
import { pageHead } from "@/components/marketing/page-head";
import { LESSONS } from "@/lib/learn/lessons";
import { breadcrumbs, learnCourse } from "@/lib/seo/structured-data";

const LEARN_DESCRIPTION =
  "Eight short lessons that follow the real steps of a product: frame the question, separate evidence from assumptions, approve a plan, compare options, decide, review the build, read the package and record what happened.";

export const Route = createFileRoute("/learn/")({
  head: () =>
    pageHead(
      "/learn",
      "Learn by building — Product craft, one real step at a time | DeliverX",
      LEARN_DESCRIPTION,
      [breadcrumbs([["Learn", "/learn"]]), learnCourse(LESSONS, LEARN_DESCRIPTION)],
    ),
  component: LearnHub,
});
