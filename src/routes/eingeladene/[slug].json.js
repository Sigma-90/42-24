import { client } from '$lib/graphql-client';
import { gql } from 'graphql-request';

export const get = async (/** @type {any} */ request) => {
	try {
		const slug = request.params.slug;
		const query = gql`
			query Invitee($slug: String!) {
				invitee(where: { slug: $slug }) {
					id
					slug
					name
					lastName
					isHost
					eligibleEvents {
						id
						slug
						what
						when
						where
						why
						attendees {
							id
							name
							isChild
							age
							foodPreference
						}
					}
					attendedEvents {
						id
					}
					declinedEvents {
						id
					}
					attendees {
						id
						slug
						name
						isChild
						age
						isInvitee
						events {
							id
						}
					}
				}
			}
		`;
		const variables = { slug };
		const { invitee } = await client.request(query, variables);

		return { status: 200, body: { invitee } };
	} catch (error) {
		return { status: 500, body: { error: 'Serverfehler. Bitte später erneut versuchen.' } };
	}
};
