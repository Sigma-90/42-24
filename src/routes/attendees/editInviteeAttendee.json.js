import { client } from '$lib/graphql-client';
import { gql } from 'graphql-request';

// @ts-ignore
export const post = async ({ request }) => {
	const attendeeData = await request.json();

	if (
		typeof attendeeData.age === 'undefined' ||
		(attendeeData.isChild && attendeeData.age <= 0) ||
		!attendeeData.name ||
		!attendeeData.attendeeId
	) {
		return { status: 400, body: { error: 'Ungültige Eingabe!' } };
	}

	try {
		const query = gql`
			mutation updateAttendeeData($attendeeId: ID!, $name: String!, $isChild: Boolean, $age: Int!, $foodPreference: String) {
				attendee: updateAttendee(
					where: { id: $attendeeId }
					data: { name: $name, isChild: $isChild, age: $age, foodPreference: $foodPreference }
				) {
					id
					slug
					name
					isChild
					age
					foodPreference
					isInvitee
					invitee {
						id
						slug
					}
				}
			}
		`;
		const variables = {
			name: attendeeData.name,
			isChild: attendeeData.isChild,
			age: attendeeData.age,
			foodPreference: attendeeData.foodPreference,
			attendeeId: attendeeData.attendeeId,
		};
		const { attendee } = await client.request(query, variables);

		const publishQuery = gql`
			mutation publishUpdatedAttendee($attendeeId: ID!) {
				publishAttendee(where: { id: $attendeeId }) {
					id
				}
			}
		`;
		const { publishAttendee } = await client.request(publishQuery, { attendeeId: attendee.id });

		if (publishAttendee.id !== attendee.id) {
			return { status: 500, body: { error: 'Fehler beim Speichern. Bitte erneut versuchen.' } };
		}

		return { status: 200, body: { attendee } };
	} catch (error) {
		// @ts-ignore
		return { status: 500, body: { error: 'Serverfehler. Bitte später erneut versuchen.' } };
	}
};
