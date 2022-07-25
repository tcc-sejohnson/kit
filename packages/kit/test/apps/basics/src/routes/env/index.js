import { SECRET } from '$env/private';

export function GET() {
	return {
		body: {
			SECRET
		}
	};
}
