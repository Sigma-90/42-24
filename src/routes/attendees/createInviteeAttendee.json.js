import { client } from '$lib/graphql-client';
import { gql } from 'graphql-request';

// @ts-ignore
export const post = async ({ request }) => {
	const attendeeData = await request.json();

	if (!attendeeData.age || attendeeData.age <= 0 || !attendeeData.name || !attendeeData.inviteeId) {
		return { status: 400, body: { error: 'Ungültige Eingabe!' } };
	}

	try {
		const query = gql`
			mutation CreateNewAttendee($slug: String!, $name: String!, $age: Int!, $isInvitee: Boolean, $inviteeId: ID!) {
				newAttendee: createAttendee(
					data: { slug: $slug, name: $name, age: $age, isInvitee: $isInvitee, invitee: { connect: { id: $inviteeId } } }
				) {
					id
				}
			}
		`;
		const variables = {
			slug: attendeeData.name
				.trim()
				.toLowerCase()
				.replace(/\s/g, '-')
				.replace('ä', 'ae')
				.replace('ö', 'oe')
				.replace('ü', 'ue')
				.replace('ß', 'ss')
				.replace(/[^0-9a-z-_]/g, ''),
			name: attendeeData.name,
			age: attendeeData.age,
			isInvitee: attendeeData.isInvitee,
			inviteeId: attendeeData.inviteeId,
		};
		const { newAttendee } = await client.request(query, variables);

		const publishQuery = gql`
			mutation publishNewAttendee($attendeeId: ID!) {
				attendee: publishAttendee(where: { id: $attendeeId }) {
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
		const { attendee } = await client.request(publishQuery, { attendeeId: newAttendee.id });

		return { status: 201, body: { attendee } };
	} catch (error) {
		// @ts-ignore
		return { status: 500, body: { error: 'Serverfehler. Bitte später erneut versuchen.' } };
	}
};
