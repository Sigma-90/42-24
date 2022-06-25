import { GraphQLClient } from 'graphql-request';

const /** @type {string} */ endpoint = `${process.env.GQL_ENDPOINT}`;

export const client = new GraphQLClient(endpoint, {
	headers: {
		Authorization: 'Bearer ' + process.env.GQL_INVITEE_TOKEN,
	},
});
