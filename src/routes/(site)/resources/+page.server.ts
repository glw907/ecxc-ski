import { redirect } from '@sveltejs/kit';

// Resources' waiver-and-forms content folded into CrewLAB and the page was deleted (backlog
// #18); this keeps the old /resources URL working by sending it to its new home instead of
// 404ing.
export const load = () => {
  redirect(301, '/crewlab');
};
