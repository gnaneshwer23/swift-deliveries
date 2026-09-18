import { queryOptions } from "@tanstack/react-query";
import { getApplicationBoard, getInterviewLab, getPerformanceReviewBoard } from "./career.functions";
import { getWorkspaceFeed } from "./workspace-feed.functions";

export const interviewLabQuery = queryOptions({
  queryKey: ["interview-lab"],
  queryFn: () => getInterviewLab(),
});

export const applicationBoardQuery = queryOptions({
  queryKey: ["application-board"],
  queryFn: () => getApplicationBoard(),
});

export const performanceReviewQuery = queryOptions({
  queryKey: ["performance-reviews"],
  queryFn: () => getPerformanceReviewBoard(),
});

export const workspaceFeedQuery = queryOptions({
  queryKey: ["workspace-feed"],
  queryFn: () => getWorkspaceFeed(),
});
