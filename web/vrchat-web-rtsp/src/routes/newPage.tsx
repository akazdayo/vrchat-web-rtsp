import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/newPage")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/newPage"!</div>;
}
