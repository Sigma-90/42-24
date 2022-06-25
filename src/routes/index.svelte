<script>
	// @ts-nocheck
	import { goto } from '$app/navigation';

	let email = '';
	const getInvitee = async (email) => {
		const res = await fetch(`/eingeladene/by-email.json?email=${email}`);
		if (res.ok) {
			const data = await res.json();
			if (data.error) {
				alert(data.error);
			} else {
				goto(`/eingeladene/${data.invitee.slug}`);
			}
		} else {
			const { error } = await res.json();
			alert(error);
		}
	};
</script>

<svelte:head>
	<title>42-24 - Geburtstagsfeier-Anmeldung</title>
</svelte:head>

<article class="mt-6 bg-base-100 shadow-lg py-4 px-6">
	<h2 class="text-3xl font-extrabold mb-6">Event-Anmeldung</h2>
	<p class="text-xl mb-4">
		Hallo!<br />
		Diese Website dient dem Zweck der Veranstaltungsplanung, damit ich für jedes Event im Blick habe, wie viele Personen an welcher
		Feier teilnehmen werden. Dies ist für meine Planung und Kostenabschätzung von essentieller Bedeutung, da hiervon Reservierungsangaben
		und Einkaufskosten abhängen.
	</p>
	<p class="text-xl mb-4">
		Ich möchte dich daher bitten, hier anzugeben, an welchem der geplanten Termine du teilnehmen möchtest und wie viele Personen
		du jeweils mitzubringen gedenkst.
	</p>
	<hr class="my-6 bg-black border-black" />
	<p class="text-xl mb-6 font-semibold">
		Wenn du hier bist, bedeutet das, dass ich dir einen Link zu dieser Seite geschickt habe. Bitte trage deine E-Mail-Adresse,
		an die ich den Link geschickt hatte, in das folgende Feld ein, um fortzufahren:
	</p>
	<form
		method="post"
		action=""
		on:submit={(e) => {
			e.preventDefault();
			getInvitee(email);
		}}
		class="flex justify-center items-end flex-wrap"
	>
		<div class="form-control w-full max-w-xs mr-4 mb-2">
			<label class="label" for="email">
				<span class="label-text text-base">E-Mail-Adresse:</span>
			</label>
			<input id="email" type="email" bind:value={email} class="input input-bordered" />
		</div>
		<button type="submit" class="btn btn-primary mb-2">Bestätigen</button>
	</form>
</article>
