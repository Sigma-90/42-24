import { client } from '$lib/graphql-client';
import { gql } from 'graphql-request';

// @ts-ignore
export const post = async ({ request }) => {
	const data = await request.json();

	if (!data.eventId || !data.inviteeId) {
		return { status: 400, body: { error: 'Ungültige Eingabe!' } };
	}

	try {
		const query = gql`
			mutation DisconnectEventFromInvitee($inviteeId: ID!, $eventId: ID!) {
				invitee: updateInvitee(where: { id: $inviteeId }, data: { attendedEvents: { disconnect: { id: $eventId } } }) {
					id
					attendedEvents {
						id
					}
				}
			}
		`;
		const variables = {
			inviteeId: data.inviteeId,
			eventId: data.eventId,
		};
		const { invitee } = await client.request(query, variables);

		const publishQuery = gql`
			mutation publishUpdatedInvitee($inviteeId: ID!) {
				publishInvitee(where: { id: $inviteeId }) {
					id
				}
			}
		`;
		const { publishInvitee } = await client.request(publishQuery, { inviteeId: invitee.id });

		if (publishInvitee.id !== invitee.id) {
			return { status: 500, body: { error: 'Fehler beim Speichern. Bitte erneut versuchen.' } };
		}

		return { status: 200, body: { invitee } };
	} catch (error) {
		// @ts-ignore
		return { status: 500, body: { error: 'Serverfehler. Bitte später erneut versuchen.' } };
	}
};
