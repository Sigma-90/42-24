<script context="module">
	export let load = async ({ fetch, params }) => {
		const { slug } = params;
		const response = await fetch(`/eingeladene/${slug}.json`);
		if (response.ok) {
			const { invitee } = await response.json();
			const inv = JSON.parse(JSON.stringify(invitee));
			const allEvents = inv.eligibleEvents;
			if (inv.eligibleEvents) {
				inv.eligibleEvents.forEach((event, index) => {
					const inviteeWillAttend = inv.attendedEvents.find((evt) => evt.id === event.id);
					const attendeeCount = event.attendees.length || 0;
					const eligibleAttendees =
						!inv.attendees || !inv.attendees.length
							? []
							: inv.attendees.map((attendee) => {
									const isAttendingEvent = attendee.events && !!attendee.events.find((evt) => evt.id === event.id);
									return { ...attendee, isAttendingEvent, eventId: event.id };
							  });
					let childrenCount = 0;
					event.attendees.forEach((attendee, index) => {
						if (attendee.age < 12) {
							childrenCount += 1;
						}
					});
					allEvents[index].attendeeCount = attendeeCount;
					allEvents[index].childrenCount = childrenCount;
					allEvents[index].inviteeWillAttend = inviteeWillAttend;
					allEvents[index].inviteeAttendees = eligibleAttendees;
				});
			}
			return { props: { invitee: inv } };
		}
		return { props: { invitee: null } };
	};
</script>

<script>
	// @ts-nocheck
	import SvelteMarkdown from 'svelte-markdown';
	import { scale, slide } from 'svelte/transition';
	import { actionIsPending } from '$lib/utils/stores';

	export let invitee;

	let fullName = invitee.name + (invitee.lastName ? ` ${invitee.lastName}` : '');

	let showNewAttendeeForm = invitee.attendees && invitee.attendees.length ? false : true;

	let editAttendeeId = '';
	let newAttendeeName = invitee.attendees && invitee.attendees.length ? '' : fullName;
	let newAttendeeAge = 0;

	let childrenAgeThreshold = 12;
	let showChildrenAgeRange = false;

	const updateEventChildrenCount = (event) => {
		const newChildrenCount = event.attendees.filter((att) => att.age < childrenAgeThreshold).length;
		const eventPos = invitee.eligibleEvents.findIndex((evt) => evt.id === event.id);
		invitee.eligibleEvents[eventPos].childrenCount = newChildrenCount;

		invitee = { ...invitee };
	};

	const addAttendee = async () => {
		if (!newAttendeeName || newAttendeeAge <= 0) {
			alert('Nicht alle Felder ausgefüllt!');
			return;
		}

		$actionIsPending = true;

		const response = await fetch('/attendees/createInviteeAttendee.json', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				name: newAttendeeName,
				age: newAttendeeAge,
				isInvitee: !invitee.attendees || !invitee.attendees.length,
				inviteeId: invitee.id,
			}),
		});

		$actionIsPending = false;

		if (!response.ok) {
			const { error } = await response.json();
			alert(error);
			//throw new Error(error);
			return;
		}

		const { attendee } = await response.json();

		if (!attendee || !attendee.id) {
			throw new Error('This should not happen!', attendee);
		}

		newAttendeeName = '';
		newAttendeeAge = 0;
		showNewAttendeeForm = false;

		invitee.attendees.push(attendee);
		if (invitee.eligibleEvents) {
			invitee.eligibleEvents.forEach((event, index) => {
				const inviteeWillAttend = invitee.attendedEvents.find((evt) => evt.id === event.id);
				const attendeeCount = event.attendees.length || 0;
				const eligibleAttendees =
					!invitee.attendees || !invitee.attendees.length
						? []
						: invitee.attendees.map((attendee) => {
								const isAttendingEvent = attendee.events && !!attendee.events.find((evt) => evt.id === event.id);
								return { ...attendee, isAttendingEvent, eventId: event.id };
						  });
				let childrenCount = 0;
				event.attendees.forEach((attendee, index) => {
					if (attendee.age < childrenAgeThreshold) {
						childrenCount += 1;
					}
				});
				invitee.eligibleEvents[index].attendeeCount = attendeeCount;
				invitee.eligibleEvents[index].childrenCount = childrenCount;
				invitee.eligibleEvents[index].inviteeWillAttend = inviteeWillAttend;
				invitee.eligibleEvents[index].inviteeAttendees = eligibleAttendees;
			});
		}

		invitee = { ...invitee };
	};

	const editAttendee = async (event) => {
		event.preventDefault();
		if (!editAttendeeId) {
			return;
		}
		const currentAttendee = invitee.attendees.find((attendee) => attendee.id === editAttendeeId);
		if (!currentAttendee.name || currentAttendee.age <= 0) {
			alert('Nicht alle Felder ausgefüllt!');
			return;
		}

		$actionIsPending = true;

		const response = await fetch('/attendees/editInviteeAttendee.json', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ name: currentAttendee.name, age: currentAttendee.age, attendeeId: currentAttendee.id }),
		});

		$actionIsPending = false;

		if (!response.ok) {
			const { error } = await response.json();
			alert(error);
			//throw new Error(error);
			return;
		}

		const { attendee } = await response.json();

		if (!attendee || !attendee.id) {
			throw new Error('This should not happen!', attendee);
		}

		invitee.attendees = invitee.attendees.map((listEntry) => {
			if (listEntry.id === attendee.id) {
				return attendee;
			}
			return listEntry;
		});

		editAttendeeId = '';

		invitee = { ...invitee };
	};

	const deleteAttendee = async (attendeeId) => {
		event.preventDefault();
		if (!attendeeId) {
			return;
		}
		const currentAttendee = invitee.attendees.find((attendee) => attendee.id === attendeeId);
		if (!currentAttendee) {
			alert('Ungültiger Eintrag!');
			return;
		}

		$actionIsPending = true;

		const response = await fetch('/attendees/deleteInviteeAttendee.json', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ attendeeId: currentAttendee.id }),
		});

		$actionIsPending = false;

		if (!response.ok) {
			const { error } = await response.json();
			alert(error);
			//throw new Error(error);
			return;
		}

		const { attendee } = await response.json();

		if (!attendee || !attendee.id) {
			throw new Error('This should not happen!', attendee);
		}

		invitee.attendees = invitee.attendees.filter((listEntry) => listEntry.id !== attendee.id);

		if (invitee.eligibleEvents) {
			invitee.eligibleEvents.forEach((event, index) => {
				const inviteeWillAttend = invitee.attendedEvents.find((evt) => evt.id === event.id);
				const attendeeCount = event.attendees.length || 0;
				const eligibleAttendees =
					!invitee.attendees || !invitee.attendees.length
						? []
						: invitee.attendees.map((attendee) => {
								const isAttendingEvent = attendee.events && !!attendee.events.find((evt) => evt.id === event.id);
								return { ...attendee, isAttendingEvent, eventId: event.id };
						  });
				let childrenCount = 0;
				event.attendees.forEach((attendee, index) => {
					if (attendee.age < childrenAgeThreshold) {
						childrenCount += 1;
					}
				});
				invitee.eligibleEvents[index].attendeeCount = attendeeCount;
				invitee.eligibleEvents[index].childrenCount = childrenCount;
				invitee.eligibleEvents[index].inviteeWillAttend = inviteeWillAttend;
				invitee.eligibleEvents[index].inviteeAttendees = eligibleAttendees;
			});
		}
		if (!invitee.attendees || !invitee.attendees.length) {
			showNewAttendeeForm = true;
			newAttendeeName = fullName;
			newAttendeeAge = 0;
		}

		invitee = { ...invitee };
	};

	const toggleEventInviteeStatus = async (eventId) => {
		if (!invitee.attendedEvents || !invitee.attendedEvents.find((evt) => evt.id === eventId)) {
			$actionIsPending = true;

			const response = await fetch('/events/connectEventToInvitee.json', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ eventId, inviteeId: invitee.id }),
			});

			$actionIsPending = false;

			if (!response.ok) {
				const { error } = await response.json();
				alert(error);
				//throw new Error(error);
				return;
			}

			if (!invitee.attendedEvents) {
				invitee.attendedEvents = [];
			}
			invitee.attendedEvents.push({ id: eventId });

			invitee = { ...invitee };
		} else {
			$actionIsPending = true;

			const response = await fetch('/events/disconnectEventFromInvitee.json', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ eventId, inviteeId: invitee.id }),
			});

			$actionIsPending = false;

			if (!response.ok) {
				const { error } = await response.json();
				alert(error);
				//throw new Error(error);
				return;
			}

			const evtPos = invitee.attendedEvents.findIndex((evt) => evt.id === eventId);
			if (evtPos >= 0) {
				invitee.attendedEvents.splice(evtPos, 1);
			}

			invitee = { ...invitee };
		}
	};

	const toggleEventAttendeeStatus = async (attendeeData) => {
		if (attendeeData.isAttendingEvent) {
			$actionIsPending = true;

			const response = await fetch('/events/connectAttendeeToEvent.json', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ attendeeId: attendeeData.id, eventId: attendeeData.eventId, inviteeId: invitee.id }),
			});

			$actionIsPending = false;

			if (!response.ok) {
				attendeeData.isAttending = false;
				const { error } = await response.json();
				alert(error);
				//throw new Error(error);
				return;
			}

			const aIndex = invitee.attendees.findIndex((att) => att.id === attendeeData.id);
			const eIndex = invitee.eligibleEvents.findIndex((evt) => evt.id === attendeeData.eventId);
			if (aIndex >= 0) {
				if (!invitee.attendees[aIndex].events) {
					invitee.attendees[aIndex].events = [];
				}
				if (invitee.attendees[aIndex].events.findIndex((evt) => evt.id === attendeeData.eventId) < 0) {
					invitee.attendees[aIndex].events.push({ id: attendeeData.eventId });
				}
			}
			if (eIndex >= 0) {
				if (!invitee.eligibleEvents[eIndex].attendees) {
					invitee.eligibleEvents[eIndex].attendees = [];
				}
				if (invitee.eligibleEvents[eIndex].attendees.findIndex((att) => att.id === attendeeData.id) < 0) {
					invitee.eligibleEvents[eIndex].attendees.push({ id: attendeeData.id, age: attendeeData.age });
				}

				if (attendeeData.isInvitee) {
					invitee.eligibleEvents[eIndex].inviteeWillAttend = true;
				}
			}
			if (!invitee.attendedEvents) {
				invitee.attendedEvents = [];
			}
			if (attendeeData.isInvitee && invitee.attendedEvents.findIndex((evt) => evt.id === attendeeData.eventId) < 0) {
				invitee.attendedEvents.push({ id: attendeeData.eventId });
			}

			invitee = { ...invitee };
		} else {
			$actionIsPending = true;

			const response = await fetch('/events/disconnectAttendeeFromEvent.json', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ attendeeId: attendeeData.id, eventId: attendeeData.eventId, inviteeId: invitee.id }),
			});

			$actionIsPending = false;

			if (!response.ok) {
				attendeeData.isAttending = true;
				const { error } = await response.json();
				alert(error);
				//throw new Error(error);
				return;
			}

			const aIndex = invitee.attendees.findIndex((att) => att.id === attendeeData.id);
			const eIndex = invitee.eligibleEvents.findIndex((evt) => evt.id === attendeeData.eventId);
			if (aIndex >= 0) {
				const aEvtIndex = invitee.attendees[aIndex].events.findIndex((evt) => evt.id === attendeeData.eventId);
				if (aEvtIndex >= 0) {
					invitee.attendees[aIndex].events.splice(aEvtIndex, 1);
				}
			}
			if (eIndex >= 0) {
				const eAttIndex = invitee.eligibleEvents[eIndex].attendees.findIndex((att) => att.id === attendeeData.id);
				if (eAttIndex >= 0) {
					invitee.eligibleEvents[eIndex].attendees.splice(eAttIndex, 1);
				}
				if (attendeeData.isInvitee) {
					invitee.eligibleEvents[eIndex].inviteeWillAttend = false;
				}
			}
			if (attendeeData.isInvitee) {
				const attEvIndex = invitee.attendedEvents.findIndex((evt) => evt.id === attendeeData.eventId);
				if (attEvIndex >= 0) {
					invitee.attendedEvents.splice(attEvIndex, 1);
				}
			}

			invitee = { ...invitee };
		}
	};

	const registerInviteeForEvent = async (event) => {
		const ivAtt = event.inviteeAttendees.find((att) => att.isInvitee);
		if (!ivAtt) {
			alert('Es ist ein Fehler aufgetreten.');
			return;
		}
		await toggleEventInviteeStatus(event.id);
		ivAtt.isAttendingEvent = true;
		await toggleEventAttendeeStatus(ivAtt);
	};

	const unregisterInviteeFromEvent = async (event) => {
		const ivAtt = event.inviteeAttendees.find((att) => att.isInvitee);
		if (!ivAtt) {
			alert('Es ist ein Fehler aufgetreten.');
			return;
		}
		await toggleEventInviteeStatus(event.id);
		await event.inviteeAttendees.forEach(async (att) => {
			if (att.isAttendingEvent && !att.isInvitee) {
				att.isAttendingEvent = false;
				await toggleEventAttendeeStatus(att);
			}
		});
		ivAtt.isAttendingEvent = false;
		await toggleEventAttendeeStatus(ivAtt);
	};

	const toggleEventRegistration = async (eventId) => {
		const event = invitee.eligibleEvents.find((evt) => evt.id === eventId);
		if (!event) {
			alert('Es ist ein Fehler aufgetreten.');
			return;
		}
		if (event.inviteeWillAttend) {
			await registerInviteeForEvent(event);
		} else {
			await unregisterInviteeFromEvent(event);
		}
	};
</script>

{#if invitee}
	<article class="mt-6 bg-base-100 shadow-lg py-4 px-6 mb-8">
		<h2 class="text-3xl font-extrabold mb-6">Event-Anmeldung</h2>
		<p class="text-xl mb-4">
			Hallo {invitee.name}!<br />
			Diese Website dient dem Zweck der Veranstaltungsplanung, damit ich für jedes Event im Blick habe, wie viele Personen an welcher
			Feier teilnehmen werden. Dies ist für meine Planung und Kostenabschätzung von essentieller Bedeutung, da hiervon Reservierungsangaben
			und Einkaufskosten abhängen.
		</p>
		<p class="text-xl mb-4">
			Ich möchte dich daher bitten, hier anzugeben, an welchem der geplanten Termine du teilnehmen möchtest und wie viele
			Personen du jeweils mitzubringen gedenkst.
		</p>
	</article>
	<section class="bg-base-100 shadow-lg py-4 px-6 mb-8">
		<h2 class="text-3xl font-extrabold mb-6">Deine Gesamt-Teilnehmerliste</h2>
		<p class="text-lg my-4">
			Gib hier bitte Name und Alter (wichtig um zu ermitteln, wie viele Kinder unter den Gästen sein werden) aller Personen an,
			die du zu einem oder mehreren der Events mitbringen möchtest. Trage dich hier bitte als Erstes selbst ein und danach
			Partner/In und Kinder.
		</p>
		{#if invitee.attendees.length}
			<table class="text-lg">
				{#each invitee.attendees as attendee}
					{#if editAttendeeId && attendee.id === editAttendeeId}
						<tr>
							<td colspan="2" class="my-2">
								<form class="flex justify-start align-end gap-2" method="post" action="" on:submit={editAttendee}>
									<div class="form-control w-full max-w-xs">
										<label class="label" for="editName">
											<span class="label-text text-base">Name:</span>
										</label>
										<input id="editName" type="text" bind:value={attendee.name} class="input input-bordered w-full max-w-xs" />
									</div>
									<div class="form-control max-w-xs">
										<label class="label" for="editAge">
											<span class="label-text text-base">Alter:</span>
										</label>
										<input
											id="editAge"
											type="number"
											bind:value={attendee.age}
											min="0"
											class="input input-bordered w-full max-w-xs"
										/>
									</div>
									<div class="form-control max-w-xs mt-3 justify-end">
										<button
											type="submit"
											disabled={!attendee.name || attendee.age <= 0 ? 'disabled' : undefined}
											class="btn btn-primary">Speichern</button
										>
									</div>
									<div class="form-control max-w-xs mt-2 justify-end">
										<button
											type="button"
											class="btn btn-secondary"
											on:click={() => {
												editAttendeeId = '';
											}}>Abbrechen</button
										>
									</div>
								</form>
							</td></tr
						>
					{:else}
						<tr>
							<td class="text-lg font-semibold">{attendee.name}</td>
							<td class="px-2">
								<button
									class=""
									type="button"
									data-editid={attendee.id}
									on:click={() => {
										editAttendeeId = attendee.id;
									}}>📝</button
								>
								<button
									class=""
									type="button"
									data-editid={attendee.id}
									on:click={() => {
										if (confirm('Wirklich löschen?')) {
											deleteAttendee(attendee.id);
										}
									}}>❌</button
								>
							</td>
						</tr>
					{/if}
				{/each}
			</table>
		{/if}
		<div class="my-4">
			{#if showNewAttendeeForm}
				<form
					class="flex justify-start align-end gap-2"
					method="post"
					action=""
					on:submit={(e) => {
						e.preventDefault();
						addAttendee();
					}}
				>
					<div class="form-control w-full max-w-xs">
						<label class="label" for="name">
							<span class="label-text text-base">Name:</span>
						</label>
						<input
							id="name"
							type="text"
							bind:value={newAttendeeName}
							readonly={!invitee.attendees || !invitee.attendees.length}
							class="input input-bordered w-full max-w-xs"
						/>
					</div>
					<div class="form-control max-w-xs">
						<label class="label" for="age">
							<span class="label-text text-base">Alter:</span>
						</label>
						<input id="age" type="number" bind:value={newAttendeeAge} min="0" class="input input-bordered w-full max-w-xs" />
					</div>
					<div class="form-control max-w-xs justify-end">
						<button
							class="btn btn-primary"
							type="submit"
							disabled={!newAttendeeName || newAttendeeAge <= 0 ? 'disabled' : undefined}>Hinzufügen</button
						>
					</div>
				</form>
			{:else}
				<button
					class="btn btn-primary"
					type="button"
					on:click={() => {
						showNewAttendeeForm = true;
					}}>Weiteren Teilnehmer hinzufügen</button
				>
			{/if}
		</div>
	</section>
	<section>
		<h2 class="text-3xl font-extrabold mb-4 bg-base-100 shadow-lg py-4 px-6">Übersicht der anstehenden Veranstaltungen:</h2>
		{#if invitee.eligibleEvents.length}
			<ul class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{#each invitee.eligibleEvents as event}
					<li class="card bg-base-100 shadow-xl">
						<article class="card-body">
							<header>
								<h3 class="text-2xl font-extrabold mb-6 min-h-16">{event.what}</h3>
								<p>
									📅 {new Date(event.when).toLocaleDateString('de-DE')} 🕔 {new Date(event.when).toLocaleTimeString('de-DE')}
								</p>
								<p>🗺️ {event.where}</p>
							</header>
							<section class="mb-4">
								<div class="flex justify-between">
									<h4 class="flex-grow-0 font-semibold">Aktuelle Teilnehmerzahl:</h4>
									<p class="flex-grow-0">
										{event.attendeeCount}, davon {event.childrenCount} Kinder unter {childrenAgeThreshold}
										<button
											type="button"
											on:click={() => {
												showChildrenAgeRange = !showChildrenAgeRange;
											}}>{showChildrenAgeRange ? '▲' : '▼'}</button
										>
									</p>
								</div>
								{#if showChildrenAgeRange}
									<input
										type="range"
										min="1"
										max="18"
										class="range mt-2"
										step="1"
										bind:value={childrenAgeThreshold}
										on:change={() => {
											updateEventChildrenCount(event);
										}}
									/>
									<div class="w-full flex justify-between text-xs px-2">
										<span>| 01</span>
										<span>| 02</span>
										<span>| 03</span>
										<span>| 04</span>
										<span>| 05</span>
										<span>| 06</span>
										<span>| 07</span>
										<span>| 08</span>
										<span>| 09</span>
										<span>| 10</span>
										<span>| 11</span>
										<span>| 12</span>
										<span>| 13</span>
										<span>| 14</span>
										<span>| 15</span>
										<span>| 16</span>
										<span>| 17</span>
										<span>| 18</span>
									</div>
								{:else}
									<hr class="mt-6" />
								{/if}
							</section>

							<section class="prose">
								<SvelteMarkdown source={event.why} />
							</section>
							{#if !invitee.isHost}
								<section class="mb-2">
									<h4 class="font-semibold block mt-2 mb-2 text-xl">Nimmst du an diesem Event teil?</h4>
									<div class="form-control block">
										<label class="label cursor-pointer justify-start inline-flex">
											<input
												id="willAttend"
												type="checkbox"
												bind:checked={event.inviteeWillAttend}
												on:change={() => {
													toggleEventRegistration(event.id);
												}}
												class="checkbox checkbox-primary"
											/>
											<span class="label-text text-lg relative">
												&nbsp;&nbsp;
												{#if event.inviteeWillAttend}
													<span class="absolute" transition:scale>&nbsp;&nbsp;Ja&nbsp;&nbsp;</span>
												{:else}
													<span class="absolute" transition:scale>Nein</span>
												{/if}
											</span>
										</label>
									</div>
								</section>
							{/if}
							{#if event.inviteeWillAttend || invitee.isHost}
								<div transition:slide>
									<h4 class="font-semibold block mt-2 mb-2 text-xl">
										{invitee.isHost ? 'Gastgeberseitig teilnehmende Personen' : 'Teilnehmende Personen'}:
									</h4>
									<ul>
										{#each event.inviteeAttendees as attendee}
											<li>
												<label class="label cursor-pointer justify-start inline-flex">
													<input
														type="checkbox"
														bind:checked={attendee.isAttendingEvent}
														on:change={() => {
															toggleEventAttendeeStatus(attendee);
														}}
														readonly={attendee.isInvitee}
														class="checkbox checkbox-primary"
													/>
													<span class="label-text text-lg relative" class:font-semibold={attendee.isAttendingEvent}>
														&nbsp;&nbsp;
														{attendee.name}
													</span>
												</label>
											</li>
										{/each}
									</ul>
									{#if invitee.isHost}
										<h4 class="font-semibold block mt-2 mb-2 text-xl">Insgesamt teilnehmende Personen:</h4>
										<ol class="list-decimal">
											{#each event.attendees as attendee}
												<li class="list-item list-inside text-lg">
													{attendee.name}
												</li>
											{/each}
										</ol>
									{/if}
								</div>
							{/if}
						</article>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
{/if}
