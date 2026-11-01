import { createFileRoute, notFound } from "@tanstack/react-router";
import { LessonView } from "@/components/learn/learn-pages";
import { pageHead } from "@/components/marketing/page-head";
import { lessonById } from "@/lib/learn/lessons";

export const Route = createFileRoute("/learn/$lessonId")({
  loader: ({ params }) => {
    const lesson = lessonById(params.lessonId);
    if (!lesson) throw notFound();
    return { lesson };
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead(
          `/learn/${loaderData.lesson.id}`,
          `${loaderData.lesson.title} — Learn by building | DeliverX`,
          loaderData.lesson.summary,
        )
      : {},
  component: LessonPage,
});

function LessonPage() {
  const { lesson } = Route.useLoaderData();
  return <LessonView lesson={lesson} />;
}
