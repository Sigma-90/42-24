import { client } from '$lib/graphql-client';
import { gql } from 'graphql-request';

export const get = async () => {
	try {
		const query = gql`
			query Events {
				events {
					slug
					what
					when
					attendees {
						name
						age
						foodPreference
					}
				}
			}
		`;
		const { events } = await client.request(query);

		return { status: 200, body: { events } };
	} catch (error) {
		return { status: 400, body: { error: 'Serverfehler. Bitte später erneut versuchen.' } };
	}
};
