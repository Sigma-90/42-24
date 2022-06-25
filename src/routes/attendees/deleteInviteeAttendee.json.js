import { client } from '$lib/graphql-client';
import { gql } from 'graphql-request';

// @ts-ignore
export const post = async ({ request }) => {
	const attendeeData = await request.json();

	if (!attendeeData.attendeeId) {
		return { status: 400, body: { error: 'Ungültige Eingabe!' } };
	}

	try {
		const query = gql`
			mutation deleteInviteeAttendee($attendeeId: ID!) {
				attendee: deleteAttendee(where: { id: $attendeeId }) {
					id
					slug
					name
					age
					isInvitee
					invitee {
						id
						slug
					}
				}
			}
		`;

		const variables = {
			attendeeId: attendeeData.attendeeId,
		};

		const { attendee } = await client.request(query, variables);

		return { status: 200, body: { attendee } };
	} catch (error) {
		// @ts-ignore
		return { status: 500, body: { error: 'Serverfehler. Bitte später erneut versuchen. | ' + error.message } };
	}
};
