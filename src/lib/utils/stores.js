import { writable } from 'svelte/store';

export let actionIsPending = writable(false);
