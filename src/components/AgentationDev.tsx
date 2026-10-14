'use client';

import { Agentation } from 'agentation';

/** Toolbar anotasi visual untuk AI agent — hanya muncul di development. */
export function AgentationDev() {
  if (process.env.NODE_ENV !== 'development') return null;
  return <Agentation />;
}
