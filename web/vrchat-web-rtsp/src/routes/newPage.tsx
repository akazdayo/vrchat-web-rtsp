import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import ScreenCaptureButton from "@/components/ScreenCaptureButton";

export const Route = createFileRoute("/newPage")({
	component: RouteComponent,
});

function RouteComponent() {
	const [capture, setCapture] = useState<MediaStream | null>(null);

  return (
    <ScreenCaptureButton setCapture={setCapture}/>
  );
};
