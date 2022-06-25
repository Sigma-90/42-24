import { gql } from 'graphql-request';
import { client } from '$lib/graphql-client';
import { getUrlParam } from '$lib/helpers';

export const get = async (/** @type {any} */ request) => {
	try {
		const email = getUrlParam(request.url, 'email');
		if (!email) {
			return { status: 400, body: { error: 'Keine E-Mail-Adresse angegeben.' } };
		}
		const query = gql`
			query Invitee($email: String!) {
				invitee(where: { email: $email }) {
					slug
				}
			}
		`;
		const variables = { email };
		const { invitee } = await client.request(query, variables);

		if (!invitee) {
			return { status: 404, body: { error: 'Vertippt?' } };
		}

		return { status: 200, body: { invitee } };
	} catch (error) {
		return {
			status: 500,
			// @ts-ignore
			body: { error: 'Serverfehler. Bitte später erneut versuchen.', details: process.env.GQL_ENDPOINT + '\n' + error.message },
		};
	}
};
