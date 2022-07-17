<script context="module">
	export let load = async ({ fetch, params }) => {
		const { slug } = params;
		const response = await fetch(`/eingeladene/${slug}.json`);
		if (response.ok) {
			const { invitee } = await response.json();
			const inv = JSON.parse(JSON.stringify(invitee));
			const allEvents = !!inv && Object.prototype.hasOwnProperty.call(inv, 'eligibleEvents') ? inv.eligibleEvents : undefined;
			if (allEvents) {
				inv.eligibleEvents.forEach((event, index) => {
					const inviteeWillAttend = inv.attendedEvents.find((evt) => evt.id === event.id);
					const inviteeHasDeclined = inv.declinedEvents.find((evt) => evt.id === event.id);
					const attendeeCount = event.attendees.length || 0;
					const eligibleAttendees =
						!inv.attendees || !inv.attendees.length
							? []
							: inv.attendees.map((attendee) => {
									const isAttendingEvent = attendee.events && !!attendee.events.find((evt) => evt.id === event.id);
									return { ...attendee, foodPreference: attendee.foodPreference || '', isAttendingEvent, eventId: event.id };
							  });
					let childrenCount = 0;
					event.attendees.forEach((attendee, index) => {
						if (attendee.age !== 0 && attendee.age < 12) {
							childrenCount += 1;
						}
					});
					allEvents[index].attendeeCount = attendeeCount;
					allEvents[index].childrenCount = childrenCount;
					allEvents[index].inviteeWillAttend = !!inviteeHasDeclined ? 'n' : !!inviteeWillAttend ? 'y' : undefined;
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
	import { scale, slide, fade } from 'svelte/transition';
	import { actionIsPending } from '$lib/utils/stores';

	export let invitee;

	let fullName = !invitee ? '' : invitee.name + (invitee.lastName ? ` ${invitee.lastName}` : '');

	let showNewAttendeeForm = !invitee ? false : invitee.attendees && invitee.attendees.length ? false : true;

	let editAttendeeId = '';
	let newAttendeeName = !invitee ? '' : invitee.attendees && invitee.attendees.length ? '' : fullName;
	let newAttendeeIsChild = false;
	let newAttendeeAge = 0;
	let newAttendeeFoodPreference = '';

	let childrenAgeThreshold = 12;
	let showChildrenAgeRange = false;

	const createFoodPreferenceLabel = (pref) => {
		let label = '';
		switch (pref) {
			case 'vegetarian':
				label = 'Vegetarisch';
				break;
			case 'vegan':
				label = 'Vegan';
				break;
			case '':
				label = '';
				break;
			default:
				label = pref[0].toUpperCase() + pref.substring(1);
		}
		return label;
	};

	const updateEventChildrenCount = (event) => {
		const newChildrenCount = event.attendees.filter((att) => att.age !== 0 && att.age < childrenAgeThreshold).length;
		const eventPos = invitee.eligibleEvents.findIndex((evt) => evt.id === event.id);
		invitee.eligibleEvents[eventPos].childrenCount = newChildrenCount;

		invitee = { ...invitee };
	};

	const updateInviteeEventList = () => {
		if (invitee.eligibleEvents) {
			invitee.eligibleEvents.forEach((event, index) => {
				const inviteeWillAttend = invitee.attendedEvents.find((evt) => evt.id === event.id);
				const inviteeHasDeclined = invitee.declinedEvents.find((evt) => evt.id === event.id);
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
					if (attendee.age !== 0 && attendee.age < childrenAgeThreshold) {
						childrenCount += 1;
					}
				});
				invitee.eligibleEvents[index].attendeeCount = attendeeCount;
				invitee.eligibleEvents[index].childrenCount = childrenCount;
				invitee.eligibleEvents[index].inviteeWillAttend = !!inviteeHasDeclined ? 'n' : !!inviteeWillAttend ? 'y' : undefined;
				invitee.eligibleEvents[index].inviteeAttendees = eligibleAttendees;
			});
		}
		invitee = { ...invitee };
	};

	const addAttendee = async () => {
		if (!newAttendeeName || (newAttendeeIsChild && newAttendeeAge <= 0)) {
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
				isChild: newAttendeeIsChild,
				age: newAttendeeAge,
				foodPreference: newAttendeeFoodPreference,
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
		newAttendeeIsChild = false;
		newAttendeeAge = 0;
		newAttendeeFoodPreference = '';
		showNewAttendeeForm = false;

		invitee.attendees.push(attendee);
		updateInviteeEventList();
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
			body: JSON.stringify({
				name: currentAttendee.name,
				age: currentAttendee.age,
				foodPreference: currentAttendee.foodPreference,
				attendeeId: currentAttendee.id,
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

		invitee.attendees = invitee.attendees.map((listEntry) => {
			if (listEntry.id === attendee.id) {
				return attendee;
			}
			return listEntry;
		});

		editAttendeeId = '';

		updateInviteeEventList();
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

		if (!invitee.attendees || !invitee.attendees.length) {
			showNewAttendeeForm = true;
			newAttendeeName = fullName;
			newAttendeeIsChild = false;
			newAttendeeAge = 0;
			newAttendeeFoodPreference = '';
		}

		updateInviteeEventList();
	};

	const executeInviteeEventAttendanceCommittment = async (eventId, rerenderAfterSuccess = true) => {
		if (!invitee.attendedEvents || !invitee.attendedEvents.find((evt) => evt.id === eventId)) {
			$actionIsPending = true;

			const response = await fetch('/events/connectEventToInvitee.json', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ eventId, inviteeId: invitee.id }),
			});

			if (!response.ok) {
				$actionIsPending = false;
				const { error } = await response.json();
				alert(error);
				//throw new Error(error);
				return false;
			}

			if (rerenderAfterSuccess) {
				$actionIsPending = false;
			}

			if (!invitee.attendedEvents) {
				invitee.attendedEvents = [];
			}
			invitee.attendedEvents.push({ id: eventId });

			if (rerenderAfterSuccess) {
				updateInviteeEventList();
			}

			return true;
		} else {
			console.log('Already attending this event, no need to commit to it again.');
		}
		return false;
	};

	const executeInviteeEventAttendanceRescindence = async (eventId, rerenderAfterSuccess = true) => {
		if (invitee.attendedEvents && !!invitee.attendedEvents.find((evt) => evt.id === eventId)) {
			$actionIsPending = true;

			const response = await fetch('/events/disconnectEventFromInvitee.json', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ eventId, inviteeId: invitee.id }),
			});

			if (!response.ok) {
				$actionIsPending = false;
				const { error } = await response.json();
				alert(error);
				//throw new Error(error);
				return false;
			}

			if (rerenderAfterSuccess) {
				$actionIsPending = false;
			}

			const evtPos = invitee.attendedEvents.findIndex((evt) => evt.id === eventId);
			if (evtPos >= 0) {
				invitee.attendedEvents.splice(evtPos, 1);
			}

			if (rerenderAfterSuccess) {
				updateInviteeEventList();
			}

			return true;
		} else {
			console.log('No attendance for this event was registered, so there is nothing to take back here.');
		}
		return false;
	};

	const executeInviteeEventDeclinationCommittment = async (eventId, rerenderAfterSuccess = true) => {
		if (!invitee.declinedEvents || !invitee.declinedEvents.find((evt) => evt.id === eventId)) {
			$actionIsPending = true;

			const response = await fetch('/events/connectEventDeclinationToInvitee.json', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ eventId, inviteeId: invitee.id }),
			});

			if (!response.ok) {
				$actionIsPending = false;
				const { error } = await response.json();
				alert(error);
				//throw new Error(error);
				return false;
			}

			if (rerenderAfterSuccess) {
				$actionIsPending = false;
			}

			if (!invitee.declinedEvents) {
				invitee.declinedEvents = [];
			}
			invitee.declinedEvents.push({ id: eventId });

			if (rerenderAfterSuccess) {
				updateInviteeEventList();
			}

			return true;
		} else {
			console.log('This event was already declined. No action taken.');
		}
		return false;
	};

	const executeInviteeEventDeclinationRescindence = async (eventId, rerenderAfterSuccess = true) => {
		if (invitee.declinedEvents && !!invitee.declinedEvents.find((evt) => evt.id === eventId)) {
			$actionIsPending = true;

			const response = await fetch('/events/disconnectEventDeclinationFromInvitee.json', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ eventId, inviteeId: invitee.id }),
			});

			if (!response.ok) {
				$actionIsPending = false;
				const { error } = await response.json();
				alert(error);
				//throw new Error(error);
				return false;
			}

			if (rerenderAfterSuccess) {
				$actionIsPending = false;
			}

			const evtPos = invitee.declinedEvents.findIndex((evt) => evt.id === eventId);
			if (evtPos >= 0) {
				invitee.declinedEvents.splice(evtPos, 1);
			}

			if (rerenderAfterSuccess) {
				updateInviteeEventList();
			}

			return true;
		} else {
			console.log('The event was not declined, so there is nothing to take back here.');
		}
		return false;
	};

	const executeAttendeeEventCommittment = async (attendeeData, rerenderAfterSuccess = true) => {
		attendeeData.isAttendingEvent = true;
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
			attendeeData.isAttendingEvent = false;
			$actionIsPending = false;
			attendeeData.isAttending = false;
			const { error } = await response.json();
			alert(error);
			//throw new Error(error);
			return false;
		}

		if (rerenderAfterSuccess) {
			$actionIsPending = false;
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
				invitee.eligibleEvents[eIndex].inviteeWillAttend = 'y';
			}
		}
		if (!invitee.attendedEvents) {
			invitee.attendedEvents = [];
		}
		if (attendeeData.isInvitee && invitee.attendedEvents.findIndex((evt) => evt.id === attendeeData.eventId) < 0) {
			invitee.attendedEvents.push({ id: attendeeData.eventId });
		}

		if (rerenderAfterSuccess) {
			updateInviteeEventList();
		}

		return true;
	};

	const executeAttendeeEventRescindence = async (attendeeData, rerenderAfterSuccess = true) => {
		attendeeData.isAttendingEvent = false;
		$actionIsPending = true;

		const response = await fetch('/events/disconnectAttendeeFromEvent.json', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ attendeeId: attendeeData.id, eventId: attendeeData.eventId, inviteeId: invitee.id }),
		});

		if (!response.ok) {
			attendeeData.isAttendingEvent = true;
			$actionIsPending = false;
			attendeeData.isAttending = true;
			const { error } = await response.json();
			alert(error);
			//throw new Error(error);
			return false;
		}

		if (rerenderAfterSuccess) {
			$actionIsPending = false;
		}

		const aIndex = invitee.attendees.findIndex((att) => att.id === attendeeData.id);
		const eIndex = invitee.eligibleEvents.findIndex((evt) => evt.id === attendeeData.eventId);
		if (aIndex >= 0 && invitee.attendees[aIndex].events) {
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
				invitee.eligibleEvents[eIndex].inviteeWillAttend = undefined;
			}
		}
		if (attendeeData.isInvitee) {
			const attEvIndex = invitee.attendedEvents.findIndex((evt) => evt.id === attendeeData.eventId);
			if (attEvIndex >= 0) {
				invitee.attendedEvents.splice(attEvIndex, 1);
			}
		}

		if (rerenderAfterSuccess) {
			updateInviteeEventList();
		}

		return true;
	};

	const toggleEventAttendeeStatus = async (attendeeData) => {
		if (attendeeData.isAttendingEvent) {
			executeAttendeeEventCommittment(attendeeData);
		} else {
			executeAttendeeEventRescindence(attendeeData);
		}
	};

	const unregisterInviteeFromEvent = async (event) => {
		const ivAtt = event.inviteeAttendees.find((att) => att.isInvitee);
		if (!ivAtt) {
			console.log('No Attendee found that represents the Invitee');
			return false;
		}
		if (await executeInviteeEventAttendanceRescindence(event.id, false)) {
			await event.inviteeAttendees.forEach(async (att) => {
				if (att.isAttendingEvent && !att.isInvitee) {
					await executeAttendeeEventRescindence(att, false);
				}
			});
			return await executeAttendeeEventRescindence(ivAtt);
		}
		return false;
	};

	const confirmEventInvitation = async (eventId) => {
		const event = invitee.eligibleEvents.find((evt) => evt.id === eventId);
		if (!event) {
			console.log('Invitee not eligible for Event');
			alert('Es ist ein Fehler aufgetreten.');
			return false;
		}
		const ivAtt = event.inviteeAttendees.find((att) => att.isInvitee);
		if (!ivAtt) {
			console.log('No Attendee found that represents the Invitee');
			alert('Es ist ein Fehler aufgetreten.');
			return false;
		}
		const inviteeHasAlreadyDeclined = invitee.declinedEvents && !!invitee.declinedEvents.find((evt) => evt.id === eventId);
		console.log(
			`Attempting to perform event invitation confirmation ${
				inviteeHasAlreadyDeclined ? 'while' : 'without'
			} first taking back a pre-existing declination`
		);
		if (!inviteeHasAlreadyDeclined) {
			if (await executeInviteeEventAttendanceCommittment(event.id, false)) {
				return await executeAttendeeEventCommittment(ivAtt);
			}
		} else if (await executeInviteeEventDeclinationRescindence(event.id, false)) {
			if (await executeInviteeEventAttendanceCommittment(event.id, false)) {
				return await executeAttendeeEventCommittment(ivAtt);
			}
		}
		return false;
	};

	const declineEventInvitation = async (eventId) => {
		const event = invitee.eligibleEvents.find((evt) => evt.id === eventId);
		if (!event) {
			console.log('Invitee not eligible for Event');
			alert('Es ist ein Fehler aufgetreten.');
			return false;
		}
		const invitedAttendee = event.inviteeAttendees.find((att) => att.isInvitee);
		const inviteeHasAlreadyConfirmed = !!invitedAttendee && invitedAttendee.isAttendingEvent;
		console.log(
			`Attempting to perform event invitation declination ${
				inviteeHasAlreadyConfirmed ? 'while' : 'without'
			} first taking back a pre-existing confirmation`
		);
		if (!inviteeHasAlreadyConfirmed) {
			return await executeInviteeEventDeclinationCommittment(event.id);
		} else if (await unregisterInviteeFromEvent(event)) {
			return await executeInviteeEventDeclinationCommittment(event.id);
		}
		return false;
	};

	const revertEventInvitationDeclination = async (eventId) => {
		const event = invitee.eligibleEvents.find((evt) => evt.id === eventId);
		if (!event) {
			console.log('Invitee not eligible for Event');
			alert('Es ist ein Fehler aufgetreten.');
			return false;
		}
		return await executeInviteeEventDeclinationRescindence(event.id);
	};

	const toggleEventRegistration = async (eventId) => {
		const event = invitee.eligibleEvents.find((evt) => evt.id === eventId);
		if (!event) {
			console.log('Invitee not eligible for toggled Event');
			alert('Es ist ein Fehler aufgetreten.');
			return;
		}
		if (event.inviteeWillAttend === 'y') {
			await confirmEventInvitation(event.id);
		} else if (event.inviteeWillAttend === 'n') {
			await declineEventInvitation(event.id);
		} else {
			await executeInviteeEventDeclinationRescindence(event.id, false);
			if (!(await unregisterInviteeFromEvent(event))) {
				$actionIsPending = false;
			}
		}
	};
</script>

{#if invitee}
	{#if !invitee.isHost || !invitee.attendees || !invitee.attendees.length}
		<article class="mt-6 bg-base-100 shadow-lg py-4 px-6 mb-8">
			<h2 class="text-3xl font-extrabold mb-6">Event-Anmeldung</h2>
			<p class="text-xl mb-4">
				Hallo {invitee.name}!<br />
				<br />
				Diese Website dient dem Zweck der Veranstaltungsplanung, damit ich für jedes Event im Blick habe, wie viele Personen an welcher
				Feier teilnehmen werden. Dies ist für meine Planung und Kostenabschätzung von essentieller Bedeutung, da hiervon Reservierungsangaben
				und Einkaufskosten abhängen.
			</p>
			<p class="text-xl mb-4">
				Ich möchte Dich daher bitten, hier anzugeben, an welchem der geplanten Termine Du teilnehmen möchtest und wie viele
				Personen Du jeweils mitzubringen gedenkst.
			</p>
		</article>
		<section class="bg-base-100 shadow-lg py-4 px-6 mb-8">
			<h2 class="text-3xl font-extrabold mb-6">Deine Gesamt-Teilnehmerliste</h2>
			<p class="text-lg my-4">
				Gib hier bitte Name und Alter (wichtig um zu ermitteln, wie viele Kinder unter den Gästen sein werden) aller Personen
				an, die Du zu einem oder mehreren der Events mitbringen möchtest. Trage Dich hier bitte als Erstes selbst ein und danach
				Partner/In und Kinder.<br />
				Dies muss nur einmal hier erfolgen. Sobald die Liste komplett ist, kannst Du dann für jedes der unten aufgelisteten Events,
				für das Du zugesagt hast, angeben, wer davon zum jeweiligen Event mitkommt.
			</p>
			{#if invitee.attendees.length}
				<table class="text-lg">
					{#each invitee.attendees as attendee}
						{#if editAttendeeId && attendee.id === editAttendeeId}
							<tr>
								<td colspan="2" class="my-2">
									<form
										class="flex flex-col lg:flex-row justify-start align-end gap-2"
										method="post"
										action=""
										on:submit={editAttendee}
									>
										<div class="form-control w-64 max-w-xs justify-end">
											<label class="label" for="editName">
												<span class="label-text text-base">Name:</span>
											</label>
											<input
												id="editName"
												type="text"
												bind:value={attendee.name}
												class="input input-bordered w-full max-w-xs"
											/>
										</div>
										<div class="form-control max-w-xs justify-end">
											<label class="label" for="editFoodPreference">
												<span class="label-text">Ernährungspräferenz:</span>
											</label>
											<select id="editFoodPreference" class="select select-bordered" bind:value={attendee.foodPreference}>
												<option value="">Keine</option>
												<option value="vegetarian">Vegetarisch</option>
												<option value="vegan">Vegan</option>
											</select>
										</div>
										<div class="form-control max-w-xs justify-end">
											<label class="label" for="editIsChild">
												<span class="label-text">Ist diese Person ein Kind?</span>
											</label>
											<label class="label cursor-pointer justify-start inline-flex h-12">
												<input
													id="editIsChild"
													type="checkbox"
													bind:checked={attendee.isChild}
													class="checkbox checkbox-primary"
												/>
												<span class="label-text text-lg relative">
													&nbsp;&nbsp;
													{#if attendee.isChild}
														<span class="absolute">&nbsp;&nbsp;Ja&nbsp;&nbsp;</span>
													{:else}
														<span class="absolute">Nein</span>
													{/if}
												</span>
											</label>
										</div>
										{#if attendee.isChild}
											<div class="form-control w-20 max-w-xs justify-end">
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
										{/if}
										<div class="form-control max-w-xs mt-3 justify-end">
											<button
												type="submit"
												disabled={!attendee.name || (attendee.isChild && attendee.age <= 0) ? 'disabled' : undefined}
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
										title="Eintrag bearbeiten"
										on:click={() => {
											editAttendeeId = attendee.id;
										}}>📝</button
									>
									<button
										class=""
										type="button"
										data-editid={attendee.id}
										title="Eintrag löschen"
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
						class="flex flex-col lg:flex-row justify-start align-end gap-2"
						method="post"
						action=""
						on:submit={(e) => {
							e.preventDefault();
							addAttendee();
						}}
					>
						<div class="form-control w-64 max-w-xs justify-end">
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
						<div class="form-control max-w-xs justify-end">
							<label class="label" for="newAttendeeFoodPreference">
								<span class="label-text">Ernährungspräferenz:</span>
							</label>
							<select id="newAttendeeFoodPreference" class="select select-bordered" bind:value={newAttendeeFoodPreference}>
								<option value="">Keine</option>
								<option value="vegetarian">Vegetarisch</option>
								<option value="vegan">Vegan</option>
							</select>
						</div>
						<div class="form-control max-w-xs justify-end">
							<label class="label" for="newAttendeeIsChild">
								<span class="label-text">Ist diese Person ein Kind?</span>
							</label>
							<label class="label cursor-pointer justify-start inline-flex h-12">
								<input
									id="newAttendeeIsChild"
									type="checkbox"
									bind:checked={newAttendeeIsChild}
									class="checkbox checkbox-primary"
								/>
								<span class="label-text text-lg relative">
									&nbsp;&nbsp;
									{#if newAttendeeIsChild}
										<span class="absolute" transition:scale>&nbsp;&nbsp;Ja&nbsp;&nbsp;</span>
									{:else}
										<span class="absolute" transition:scale>Nein</span>
									{/if}
								</span>
							</label>
						</div>
						{#if newAttendeeIsChild}
							<div class="form-control w-20 max-w-xs justify-end" transition:fade>
								<label class="label" for="age">
									<span class="label-text text-base">Alter:</span>
								</label>
								<input
									id="age"
									type="number"
									bind:value={newAttendeeAge}
									min="0"
									max="17"
									class="input input-bordered w-full max-w-xs"
								/>
							</div>
						{/if}
						<div class="form-control max-w-xs justify-end">
							<button
								class="btn btn-primary"
								type="submit"
								disabled={!newAttendeeName || (newAttendeeIsChild && newAttendeeAge <= 0) ? 'disabled' : undefined}
								>Hinzufügen</button
							>
						</div>
						<div class="form-control max-w-xs justify-end">
							<button
								class="btn btn-secondary"
								type="button"
								on:click={() => {
									showNewAttendeeForm = false;
									newAttendeeName = '';
									newAttendeeIsChild = false;
									newAttendeeAge = 0;
									newAttendeeFoodPreference = '';
								}}>Abbrechen</button
							>
						</div>
					</form>
				{:else}
					<button
						class="btn btn-primary"
						type="button"
						on:click={() => {
							showNewAttendeeForm = true;
						}}>Weiteren Listeneintrag anlegen</button
					>
				{/if}
			</div>
		</section>
	{/if}
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
									<span title="Datum">📅</span>
									{new Date(event.when).toLocaleDateString('de-DE')} <span title="Uhrzeit">🕔</span>
									{new Date(event.when).toLocaleTimeString('de-DE')}
								</p>
								<p><span title="Ort">🗺️</span> {event.where}</p>
							</header>
							<section class="mb-4">
								<div class="flex justify-between">
									<h4 class="flex-grow-0 font-semibold">Aktuelle Teilnehmeranzahl:</h4>
									<p class="flex-grow-0">
										{event.attendeeCount}, davon {event.childrenCount} Kinder unter {childrenAgeThreshold}
										<button
											type="button"
											title={'Kinder-Altersgrenzen-Anpassung ' + (showChildrenAgeRange ? ' verbergen' : ' anzeigen')}
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
									{#if !invitee.attendees || !invitee.attendees.length}
										{#if event.inviteeWillAttend === 'n'}
											<h4 class="font-semibold block mt-2 mb-2 text-xl">Absage erteilt</h4>
											<p class="text-md mb-2">
												Du hast angegeben, dass du an diesem Event leider nicht teilnehmen kannst. Sollte sich dieser Umstand
												geändert haben, klicke einfach den folgenden Button, um doch noch eine Zusage machen zu können.
											</p>
											<button
												type="button"
												class="btn btn-primary"
												on:click={() => {
													revertEventInvitationDeclination(event.id);
												}}>Absage zurückziehen</button
											>
										{:else}
											<h4 class="font-semibold block mt-2 mb-2 text-xl">Teilnahmebestätigung</h4>
											<p class="text-md">
												Du kannst erst zu diesem Event zusagen, wenn du der obigen Teilnehmerliste mindestens einen Eintrag
												(nämlich den für dich selbst) hinzugefügt hast.
											</p>
											<h4 class="font-semibold block mt-2 mb-2 text-xl">Definitive Absage erteilen</h4>
											<p class="text-md mb-2">
												Wenn du dir sicher bist, dass du an diesem Termin keine Zeit hast, dann gib hier bitte an, dass du nicht
												kommen kannst. <br />
												Damit hilfst du mir, Klarheit darüber zu erlangen, wer nun definitiv nicht kommt und wer aus unterschiedlichen
												Gründen nur noch nicht zugesagt hat.
												<br />
												Du ersparst dir so zudem auch unnötige Nachfragen meinerseits, da ich alle Unentschlossenen in regelmäßigen
												Abständen nochmal an die ausstehende Einladung erinnern muss, um möglichst zeitnah alle benötigten Informationen
												zur Veranstaltungs&shy;planung und Reservierungs&shy;angaben beisammen zu haben.
											</p>
											<button
												type="button"
												class="btn btn-primary"
												on:click={() => {
													declineEventInvitation(event.id);
												}}>Absagen</button
											>
										{/if}
									{:else}
										<h4 class="font-semibold block mt-2 mb-2 text-xl">Nimmst du an diesem Event teil?</h4>
										<!-- <div class="form-control block">
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
												{#if event.inviteeWillAttend === 'y' || true}
													<span class="absolute" transition:scale>&nbsp;&nbsp;Ja&nbsp;&nbsp;</span>
												{:else}
													<span class="absolute" transition:scale>Nein</span>
												{/if}
											</span>
										</label>
									</div> -->
										<div class="form-control">
											<label class="label cursor-pointer justify-start">
												<input
													type="radio"
													name={'radio_attending_' + event.slug}
													class="radio radio-primary"
													bind:group={event.inviteeWillAttend}
													on:change={() => {
														toggleEventRegistration(event.id);
													}}
													value={'n'}
												/>
												<span class="label-text text-lg ml-4">Nein, leider keine Zeit</span>
											</label>
										</div>
										<div class="form-control">
											<label class="label cursor-pointer justify-start">
												<input
													type="radio"
													name={'radio_attending_' + event.slug}
													class="radio radio-primary"
													bind:group={event.inviteeWillAttend}
													on:change={() => {
														toggleEventRegistration(event.id);
													}}
													value={undefined}
												/>
												<span class="label-text text-lg ml-4">Ich weiß noch nicht</span>
											</label>
										</div>
										<div class="form-control">
											<label class="label cursor-pointer justify-start">
												<input
													type="radio"
													name={'radio_attending_' + event.slug}
													class="radio radio-primary"
													bind:group={event.inviteeWillAttend}
													on:change={() => {
														toggleEventRegistration(event.id);
													}}
													value={'y'}
												/>
												<span class="label-text text-lg ml-4">Ja, ich bin dabei</span>
											</label>
										</div>
									{/if}
								</section>
							{/if}
							{#if event.inviteeWillAttend === 'y' || invitee.isHost}
								<div transition:slide>
									{#if !invitee.isHost}
										<h4 class="font-semibold block mt-2 mb-2 text-xl">Teilnehmende Personen:</h4>
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
									{:else}
										<h4 class="font-semibold block mt-2 mb-2 text-xl">Insgesamt teilnehmende Personen:</h4>
										<ol class="list-decimal">
											{#each event.attendees as attendee}
												<li class="list-item list-inside text-lg">
													{attendee.name}
													{attendee.foodPreference ? ` (${createFoodPreferenceLabel(attendee.foodPreference)})` : ''}
												</li>
											{/each}
										</ol>
										<h4 class="font-semibold block mt-2 mb-2 text-xl">Insgesamte Absagen:</h4>
										<ol class="list-decimal">
											{#each event.decliningInvitees as invitee}
												<li class="list-item list-inside text-lg">
													{invitee.name + (invitee.lastName ? ` ${invitee.lastName}` : '')}
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
{:else}
	<h2 class="text-4xl font-extrabold text-center bg-base-100 shadow-lg mt-12 py-6 px-4">404 - Seite nicht gefunden</h2>
{/if}
