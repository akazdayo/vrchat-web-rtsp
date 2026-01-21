interface InlineMessageProps {
	message?: string | null;
	className?: string;
}

export function InlineMessage({ message, className }: InlineMessageProps) {
	if (!message) {
		return null;
	}

	return <p className={className}>{message}</p>;
}
