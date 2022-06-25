import { client } from '$lib/graphql-client';
import { gql } from 'graphql-request';

// @ts-ignore
export const post = async ({ request }) => {
	const data = await request.json();

	if (!data.eventId || !data.attendeeId || !data.inviteeId) {
		return { status: 400, body: { error: 'Ungültige Eingabe!' } };
	}

	try {
		const query = gql`
			mutation DisconnectAttendeeFromEvent($attendeeId: ID!, $eventId: ID!) {
				event: updateEvent(where: { id: $eventId }, data: { attendees: { disconnect: { id: $attendeeId } } }) {
					id
					attendees {
						id
					}
				}
			}
		`;
		const variables = {
			inviteeId: data.inviteeId,
			attendeeId: data.attendeeId,
			eventId: data.eventId,
		};
		const { event } = await client.request(query, variables);

		const publishEventQuery = gql`
			mutation publishUpdatedEvent($eventId: ID!) {
				publishEvent(where: { id: $eventId }) {
					id
				}
			}
		`;
		const { publishEvent } = await client.request(publishEventQuery, { eventId: data.eventId });
		if (publishEvent.id !== event.id) {
			return { status: 500, body: { error: 'Fehler beim Speichern. Bitte erneut versuchen.' } };
		}

		const publishAttendeeQuery = gql`
			mutation publishUpdatedAttendee($attendeeId: ID!) {
				publishAttendee(where: { id: $attendeeId }) {
					id
				}
			}
		`;
		const { publishAttendee } = await client.request(publishAttendeeQuery, { attendeeId: data.attendeeId });
		if (publishAttendee.id !== data.attendeeId) {
			return { status: 500, body: { error: 'Fehler beim Speichern. Bitte erneut versuchen.' } };
		}

		const publishInviteeQuery = gql`
			mutation publishUpdatedInvitee($inviteeId: ID!) {
				publishInvitee(where: { id: $inviteeId }) {
					id
				}
			}
		`;
		const { publishInvitee } = await client.request(publishInviteeQuery, { inviteeId: data.inviteeId });
		if (publishInvitee.id !== data.inviteeId) {
			return { status: 500, body: { error: 'Fehler beim Speichern. Bitte erneut versuchen.' } };
		}

		return { status: 200, body: { event } };
	} catch (error) {
		// @ts-ignore
		return { status: 500, body: { error: 'Serverfehler. Bitte später erneut versuchen. ' + error.message } };
	}
};
