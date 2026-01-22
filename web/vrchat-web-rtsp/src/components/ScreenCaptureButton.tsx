interface Props {
  setCapture: React.Dispatch<React.SetStateAction<MediaStream | null>>
};

export default function ScreenCaptureButton(props: Props) {
	const onClick = async () => {
		props.setCapture(await navigator.mediaDevices.getDisplayMedia());
	};
	return (
		<div>
			<button className="btn" type="button" onClick={onClick}>
				Screen Capture
			</button>
		</div>
	);
}
